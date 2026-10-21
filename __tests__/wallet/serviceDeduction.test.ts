/**
 * Service booking credit deduction tests (lib/wallet/serviceBooking.ts).
 * Verifies per-booking credit deductions, server-authoritative pricing,
 * idempotency namespacing, and 402 insufficient credit responses.
 */

import { deductServiceBooking } from "@/lib/wallet/serviceBooking";
import { getServiceCatalogItem, SERVICE_RESOURCE_IDS } from "@/lib/wallet/resourceMapping";

function makeSupabaseRpc(rpcResult: { data: any; error: any } = { data: null, error: null }) {
  const rpc = jest.fn().mockResolvedValue(rpcResult);
  return { client: { rpc } as any, rpc };
}

const deduct = (client: any, body: any, userId = "user-1") =>
  deductServiceBooking(client, userId, body);

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
    it("deducts server catalog price (5 credits for medical appointment) under atomic RPC", async () => {
      const { client, rpc } = makeSupabaseRpc({
        data: {
          success: true,
          balance: 95,
          transaction_id: "tx_medical_1",
          reference_id: "apt_123",
        },
        error: null,
      });

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
    });

    it("deducts 25 credits for PCC filing", async () => {
      const { client, rpc } = makeSupabaseRpc({
        data: {
          success: true,
          balance: 75,
          transaction_id: "tx_pcc_1",
          reference_id: "pcc_456",
        },
        error: null,
      });

      const res = await deduct(client, {
        serviceId: "pcc-filing-service",
        referenceId: "pcc_456",
      });

      expect(rpc).toHaveBeenCalledWith(
        "deduct_service_credits_atomic",
        expect.objectContaining({
          p_service_id: "pcc-filing-service",
          p_credit_cost: 25,
          p_reference_id: "pcc_456",
        })
      );
      expect(res.status).toBe(200);
      expect(res.body).toEqual(expect.objectContaining({ balance: 75 }));
    });

    it("deducts 99 credits for Expert Consultation", async () => {
      const { client, rpc } = makeSupabaseRpc({
        data: {
          success: true,
          balance: 1,
          transaction_id: "tx_consult_1",
          reference_id: "consult_789",
        },
        error: null,
      });

      const res = await deduct(client, {
        serviceId: "book-a-consultation",
        referenceId: "consult_789",
      });

      expect(rpc).toHaveBeenCalledWith(
        "deduct_service_credits_atomic",
        expect.objectContaining({
          p_service_id: "book-a-consultation",
          p_credit_cost: 99,
          p_reference_id: "consult_789",
        })
      );
      expect(res.status).toBe(200);
      expect(res.body).toEqual(expect.objectContaining({ balance: 1 }));
    });

    it("returns 402 with deficit and exact topupAmount when credits are insufficient", async () => {
      const { client } = makeSupabaseRpc({
        data: {
          success: false,
          error: "INSUFFICIENT_CREDITS",
          required: 25,
          available: 10,
          deficit: 15,
        },
        error: null,
      });

      const res = await deduct(client, {
        serviceId: "document-translation",
        referenceId: "trans_999",
      });

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
    });

    it("namespaces idempotency key with service_booking:userId:serviceId", async () => {
      const { client, rpc } = makeSupabaseRpc({
        data: {
          success: true,
          balance: 95,
          transaction_id: "tx_1",
        },
        error: null,
      });

      await deduct(client, {
        serviceId: "book-medical-appointment",
        idempotencyKey: "client_key_12345",
      });

      expect(rpc.mock.calls[0][1].p_idempotency_key).toBe(
        "service_booking:user-1:book-medical-appointment:client_key_12345"
      );
    });

    it("returns alreadyProcessed: true when RPC returns idempotent replay", async () => {
      const { client } = makeSupabaseRpc({
        data: {
          success: true,
          already_processed: true,
          balance: 95,
          transaction_id: "tx_existing",
          reference_id: "apt_123",
        },
        error: null,
      });

      const res = await deduct(client, {
        serviceId: "book-medical-appointment",
        referenceId: "apt_123",
        idempotencyKey: "client_key_12345",
      });

      expect(res.status).toBe(200);
      expect(res.body).toEqual(
        expect.objectContaining({
          alreadyProcessed: true,
          transactionId: "tx_existing",
        })
      );
    });

    it.each([
      [{ serviceId: "" }, 400, "INVALID_SERVICE_ID"],
      [{ serviceId: null }, 400, "INVALID_SERVICE_ID"],
      [{ serviceId: "non-existent-service" }, 404, "UNKNOWN_SERVICE"],
      [{ serviceId: "sponsorship-calculator" }, 404, "UNKNOWN_SERVICE"], // tool, not service
      [{ serviceId: "book-medical-appointment", idempotencyKey: "short" }, 400, "INVALID_IDEMPOTENCY_KEY"],
      [{ serviceId: "book-medical-appointment", idempotencyKey: "bad key with spaces" }, 400, "INVALID_IDEMPOTENCY_KEY"],
    ])("rejects invalid input %p with status %i", async (body, expectedStatus, expectedError) => {
      const { client, rpc } = makeSupabaseRpc();
      const res = await deduct(client, body as any);
      expect(res.status).toBe(expectedStatus);
      expect(res.body).toEqual({ success: false, error: expectedError });
      expect(rpc).not.toHaveBeenCalled();
    });

    it("surfaces database or RPC errors as 500 DEDUCT_SERVICE_FAILED", async () => {
      const { client } = makeSupabaseRpc({
        data: null,
        error: { message: "database timeout" },
      });

      const res = await deduct(client, { serviceId: "book-medical-appointment" });
      expect(res.status).toBe(500);
      expect(res.body).toEqual({ success: false, error: "DEDUCT_SERVICE_FAILED" });
    });
  });
});
