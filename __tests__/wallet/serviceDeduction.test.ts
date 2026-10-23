/* eslint-disable @typescript-eslint/no-explicit-any -- loose Supabase test doubles */
/**
 * Service booking credit deduction tests (lib/wallet/serviceBooking.ts).
 * Verifies per-booking credit deductions, server-authoritative pricing,
 * one charge per booking, ownership of the booking, and 402 insufficient
 * credit responses.
 */

// serviceBooking notifies admins; lib/notifications builds a Resend client at import.
jest.mock("@/lib/notifications", () => ({
  triggerAppointmentNotification: jest.fn(),
  triggerPCCNotification: jest.fn(),
  triggerTranslationNotification: jest.fn(),
  triggerConsultationNotification: jest.fn(),
}));

import { deductServiceBooking } from "@/lib/wallet/serviceBooking";
import { getServiceCatalogItem } from "@/lib/wallet/resourceMapping";
import { triggerAppointmentNotification } from "@/lib/notifications";

type Row = Record<string, any>;

/**
 * Supabase stand-in: `rpc` plus the booking tables. Every booking row belongs to
 * user-1 and is unpaid unless the test says otherwise.
 */
function makeSupabase(
  rpcResult: { data: any; error: any } = { data: null, error: null },
  rows: Record<string, Row[]> = {},
  opts: { failUpdate?: boolean } = {}
) {
  const rpc = jest.fn().mockResolvedValue(rpcResult);
  const updates: Array<{ table: string; values: Row }> = [];
  const from = (table: string) => {
    const filters: Row = {};
    let pendingUpdate: Row | null = null;
    const matches = () =>
      (rows[table] ?? []).filter((r) => Object.entries(filters).every(([k, v]) => r[k] === v));
    const builder: any = {
      select: () => builder,
      update: (values: Row) => {
        pendingUpdate = values;
        return builder;
      },
      eq: (col: string, val: unknown) => {
        filters[col] = val;
        return builder;
      },
      maybeSingle: async () => ({ data: matches()[0] ?? null, error: null }),
      then: (resolve: (v: unknown) => unknown) => {
        if (pendingUpdate) {
          if (opts.failUpdate) return Promise.resolve({ data: null, error: { message: "down" } }).then(resolve);
          const hit = matches();
          hit.forEach((r) => Object.assign(r, pendingUpdate));
          updates.push({ table, values: pendingUpdate });
          return Promise.resolve({ data: hit.map((r) => ({ id: r.id })), error: null }).then(resolve);
        }
        return Promise.resolve({ data: matches(), error: null }).then(resolve);
      },
    };
    return builder;
  };
  return { client: { rpc, from } as any, rpc, updates };
}

const unpaid = (id: string, extra: Row = {}): Row => ({
  id,
  user_id: "user-1",
  payment_status: "pending",
  ...extra,
});

const bookings = () => ({
  appointments: [unpaid("apt_123", { awaiting_payment: true })],
  police_verification_requests: [unpaid("pcc_456", { awaiting_payment: true })],
  consultation_bookings: [unpaid("consult_789")],
  translation_documents: [unpaid("trans_999")],
});

const deduct = (client: any, body: any, userId = "user-1") =>
  deductServiceBooking(client, userId, body);

beforeEach(() => jest.clearAllMocks());

describe("Phase 6 Standalone Services Credit Deduction", () => {
  describe("Catalog and Resource Mapping", () => {
    it("maps all 4 core services to their catalog items with exact credit costs", () => {
      const medical = getServiceCatalogItem("book-medical-appointment");
      expect(medical).not.toBeNull();
      expect(medical?.credits).toBe(5);
      expect(medical?.resourceType).toBe("service");

      const pcc = getServiceCatalogItem("pcc-filing-service");
      expect(pcc).not.toBeNull();
      expect(pcc?.credits).toBe(25);

      const translation = getServiceCatalogItem("document-translation");
      expect(translation).not.toBeNull();
      expect(translation?.credits).toBe(25);

      const consultation = getServiceCatalogItem("book-a-consultation");
      expect(consultation).not.toBeNull();
      expect(consultation?.credits).toBe(99);
    });

    it("correctly resolves service ID aliases from services page and components", () => {
      expect(getServiceCatalogItem("pcc-filing-service-, -sindh")?.resourceId).toBe(
        "pcc-filing-service"
      );
      expect(getServiceCatalogItem("urdu-→-english-translation")?.resourceId).toBe(
        "document-translation"
      );
    });
  });

  describe("deductServiceBooking", () => {
    it("deducts the server catalog price (5 credits for medical) and reveals the booking", async () => {
      const rows = bookings();
      const { client, rpc, updates } = makeSupabase(
        { data: { success: true, balance: 95, transaction_id: "tx_medical_1" }, error: null },
        rows
      );

      const res = await deduct(client, {
        serviceId: "book-medical-appointment",
        referenceId: "apt_123",
        credits: 1, // Client tries to send cheap price -> ignored
      });

      expect(rpc).toHaveBeenCalledWith(
        "deduct_service_credits_atomic",
        expect.objectContaining({
          p_user_id: "user-1",
          p_service_id: "book-medical-appointment",
          p_credit_cost: 5,
          p_reference_id: "apt_123",
        })
      );
      expect(res).toEqual({
        status: 200,
        body: {
          success: true,
          balance: 95,
          transactionId: "tx_medical_1",
          serviceId: "book-medical-appointment",
          referenceId: "apt_123",
          alreadyProcessed: false,
        },
      });
      expect(updates).toEqual([
        { table: "appointments", values: { payment_status: "paid", awaiting_payment: false } },
      ]);
      expect(triggerAppointmentNotification).toHaveBeenCalledWith("apt_123");
    });

    it.each([
      ["pcc-filing-service", "pcc_456", 25, "police_verification_requests"],
      ["book-a-consultation", "consult_789", 99, "consultation_bookings"],
      ["document-translation", "trans_999", 25, "translation_documents"],
    ])("charges %s at its catalog price", async (serviceId, referenceId, credits, table) => {
      const { client, rpc, updates } = makeSupabase(
        { data: { success: true, balance: 1, transaction_id: "tx" }, error: null },
        bookings()
      );
      const res = await deduct(client, { serviceId, referenceId });
      expect(res.status).toBe(200);
      expect(rpc.mock.calls[0][1]).toMatchObject({ p_credit_cost: credits, p_reference_id: referenceId });
      expect(updates[0].table).toBe(table);
    });

    it("returns 402 with deficit and exact topupAmount when credits are insufficient", async () => {
      const { client, updates } = makeSupabase(
        {
          data: { success: false, error: "INSUFFICIENT_CREDITS", required: 25, available: 10, deficit: 15 },
          error: null,
        },
        bookings()
      );

      const res = await deduct(client, { serviceId: "document-translation", referenceId: "trans_999" });

      expect(res).toEqual({
        status: 402,
        body: {
          success: false,
          error: "INSUFFICIENT_CREDITS",
          required: 25,
          available: 10,
          deficit: 15,
          topupAmount: 15,
        },
      });
      expect(updates).toEqual([]);
    });

    it("derives the idempotency key from the booking, never from the client key", async () => {
      const { client, rpc } = makeSupabase(
        { data: { success: true, balance: 95, transaction_id: "tx_1" }, error: null },
        bookings()
      );

      await deduct(client, {
        serviceId: "book-medical-appointment",
        referenceId: "apt_123",
        idempotencyKey: "client_key_12345",
      });

      expect(rpc.mock.calls[0][1].p_idempotency_key).toBe(
        "service_booking:user-1:book-medical-appointment:apt_123"
      );
    });

    it("a key reused from a paid booking cannot pay another booking", async () => {
      // Booking A was paid with key K. B is a new unpaid draft sent with the same K.
      const rows = {
        appointments: [
          unpaid("apt_A", { payment_status: "paid", awaiting_payment: false }),
          unpaid("apt_B", { awaiting_payment: true }),
        ],
      };
      const { client, rpc } = makeSupabase(
        { data: { success: true, balance: 90, transaction_id: "tx_B" }, error: null },
        rows
      );

      await deduct(client, {
        serviceId: "book-medical-appointment",
        referenceId: "apt_B",
        idempotencyKey: "K_reused_123",
      });

      // B is charged under its own key, so the RPC's per-booking replay can't mistake it for A.
      expect(rpc.mock.calls[0][1]).toMatchObject({
        p_reference_id: "apt_B",
        p_idempotency_key: "service_booking:user-1:book-medical-appointment:apt_B",
      });
    });

    it("an already-paid booking is not charged again (lost response, retry)", async () => {
      const rows = {
        appointments: [unpaid("apt_123", { payment_status: "paid", awaiting_payment: false })],
      };
      const { client, rpc, updates } = makeSupabase({ data: null, error: null }, rows);

      const res = await deduct(client, { serviceId: "book-medical-appointment", referenceId: "apt_123" });

      expect(res).toMatchObject({ status: 200, body: { success: true, alreadyProcessed: true } });
      expect(rpc).not.toHaveBeenCalled();
      expect(updates).toEqual([]);
    });

    it("an RPC replay (charged, but the booking update was lost) still finishes the booking", async () => {
      const rows = bookings();
      const { client, updates } = makeSupabase(
        {
          data: { success: true, already_processed: true, balance: 95, transaction_id: "tx_existing" },
          error: null,
        },
        rows
      );

      const res = await deduct(client, { serviceId: "book-medical-appointment", referenceId: "apt_123" });

      expect(res.body).toEqual(
        expect.objectContaining({ alreadyProcessed: true, transactionId: "tx_existing" })
      );
      expect(updates).toHaveLength(1);
      expect(rows.appointments[0].payment_status).toBe("paid");
    });

    it("never charges for another user's booking", async () => {
      const rows = { consultation_bookings: [unpaid("consult_789", { user_id: "user-2" })] };
      const { client, rpc } = makeSupabase({ data: { success: true }, error: null }, rows);

      const res = await deduct(client, { serviceId: "book-a-consultation", referenceId: "consult_789" });

      expect(res).toEqual({ status: 404, body: { success: false, error: "BOOKING_NOT_FOUND" } });
      expect(rpc).not.toHaveBeenCalled();
    });

    it("refuses a booking that is no longer payable (e.g. refunded)", async () => {
      const rows = { translation_documents: [unpaid("trans_999", { payment_status: "refunded" })] };
      const { client, rpc } = makeSupabase({ data: { success: true }, error: null }, rows);

      const res = await deduct(client, { serviceId: "document-translation", referenceId: "trans_999" });

      expect(res).toEqual({ status: 409, body: { success: false, error: "BOOKING_NOT_PAYABLE" } });
      expect(rpc).not.toHaveBeenCalled();
    });

    it("reports a charge whose booking could not be marked paid", async () => {
      const { client } = makeSupabase(
        { data: { success: true, balance: 95, transaction_id: "tx" }, error: null },
        bookings(),
        { failUpdate: true }
      );

      const res = await deduct(client, { serviceId: "book-medical-appointment", referenceId: "apt_123" });

      expect(res).toEqual({ status: 500, body: { success: false, error: "BOOKING_UPDATE_FAILED" } });
      expect(triggerAppointmentNotification).not.toHaveBeenCalled();
    });

    it("keeps client metadata nested so it cannot overwrite the ledger fields", async () => {
      const { client, rpc } = makeSupabase(
        { data: { success: true, balance: 1, transaction_id: "tx" }, error: null },
        bookings()
      );

      await deduct(client, {
        serviceId: "book-a-consultation",
        referenceId: "consult_789",
        description: "free",
        metadata: { source: "hacked", catalog_credits: 0, reference_id: "other" },
      });

      const args = rpc.mock.calls[0][1];
      expect(args.p_description).toBe("Expert Consultation - Standalone Service Booking");
      expect(args.p_metadata).toEqual({
        client: { source: "hacked", catalog_credits: 0, reference_id: "other" },
        source: "service_booking",
        catalog_credits: 99,
      });
    });

    it.each([
      [{ serviceId: "" }, 400, "INVALID_SERVICE_ID"],
      [{ serviceId: null }, 400, "INVALID_SERVICE_ID"],
      [{ serviceId: "non-existent-service" }, 404, "UNKNOWN_SERVICE"],
      [{ serviceId: "sponsorship-calculator" }, 404, "UNKNOWN_SERVICE"], // tool, not service
      [{ serviceId: "book-medical-appointment" }, 400, "REFERENCE_REQUIRED"],
      [{ serviceId: "book-medical-appointment", referenceId: "  " }, 400, "REFERENCE_REQUIRED"],
      [{ serviceId: "book-medical-appointment", referenceId: "missing" }, 404, "BOOKING_NOT_FOUND"],
    ])("rejects invalid input %p with status %i", async (body, expectedStatus, expectedError) => {
      const { client, rpc } = makeSupabase(undefined, bookings());
      const res = await deduct(client, body as any);
      expect(res.status).toBe(expectedStatus);
      expect(res.body).toEqual({ success: false, error: expectedError });
      expect(rpc).not.toHaveBeenCalled();
    });

    it("surfaces database or RPC errors as 500 DEDUCT_SERVICE_FAILED", async () => {
      const { client, updates } = makeSupabase(
        { data: null, error: { message: "database timeout" } },
        bookings()
      );

      const res = await deduct(client, { serviceId: "book-medical-appointment", referenceId: "apt_123" });
      expect(res.status).toBe(500);
      expect(res.body).toEqual({ success: false, error: "DEDUCT_SERVICE_FAILED" });
      expect(updates).toEqual([]);
    });
  });
});
