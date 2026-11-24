/**
 * Rows that belong to a candidate must carry that candidate's id.
 *
 *  4. Checklist age band: the base `ir2` journey took the DOB of the account's primary
 *     candidate (an IR-5 parent), not the IR-2 child's.
 *  5. CEAC status upsert had no candidate_id, so the column default ('candidate-1')
 *     attributed every status to the account's first candidate.
 *  6. The consultation in-app notification had no candidate_id (same default).
 *  7. The guides/start fallback upsert dropped candidate_id (same default), so one
 *     candidate's guide progress could land on candidate-1.
 */

import { createFakeSupabase, type Row } from "./fakeSupabase";

let tables: Record<string, Row[]>;
let client: ReturnType<typeof createFakeSupabase>;

jest.mock("@/lib/supabase/server", () => ({ createClient: async () => client }));
jest.mock("@/lib/supabase/admin", () => ({
  supabaseAdmin: new Proxy({}, { get: (_t, p) => (client as any)[p] }),
}));
jest.mock("@supabase/ssr", () => ({ createServerClient: () => client }));
jest.mock("resend", () => ({
  Resend: jest.fn().mockImplementation(() => ({ emails: { send: jest.fn().mockResolvedValue({ id: "e" }) } })),
}));

import { pickCandidateForJourney, computeChildAgeBand } from "@/lib/journey/document-checklist/visibility";
import { CeacReminderEngine } from "@/lib/ceac-tracking/CeacReminderEngine";
import { triggerConsultationNotification } from "@/lib/notifications";
import { POST as guidesStart } from "@/app/api/guides/start/route";

const flush = () => new Promise((r) => setTimeout(r, 0));

const ROSTER = [
  { id: "candidate-1", relation: "Mother", visaCategory: "IR-5", dateOfBirth: "1960-01-01", isPrimary: true },
  { id: "candidate-2", relation: "Father", visaCategory: "IR-5", dateOfBirth: "1958-01-01" },
  { id: "candidate-3", relation: "Child", visaCategory: "IR-2", categorySlot: 1, dateOfBirth: "2015-06-01" },
  { id: "candidate-4", relation: "Child", visaCategory: "IR-2", categorySlot: 2, dateOfBirth: "2009-03-01" },
] as any[];

describe("4. checklist age band uses the child who owns the journey", () => {
  it("the base ir2 journey is the first IR-2 child's, not the IR-5 parent's", () => {
    const c = pickCandidateForJourney(ROSTER, "ir2");
    expect(c?.id).toBe("candidate-3");
    expect(computeChildAgeBand(c?.dateOfBirth, new Date("2026-11-13"))).toBe("under_14");
  });

  it("ir2_candidate2 is the second child", () => {
    const c = pickCandidateForJourney(ROSTER, "ir2_candidate2");
    expect(c?.id).toBe("candidate-4");
    expect(computeChildAgeBand(c?.dateOfBirth, new Date("2026-11-13"))).toBe("16_17");
  });

  it("an unowned journey yields no candidate (age band stays unknown, nothing hidden)", () => {
    expect(pickCandidateForJourney(ROSTER, "ir2_candidate5")).toBeNull();
  });
});

describe("5. CEAC status rows carry the journey owner's candidate_id", () => {
  it("tags the IR-2 child's CEAC status with candidate-3", async () => {
    tables = {
      journeys: [{ id: "j-ir2", user_id: "u1", journey_type: "ir2" }],
      user_profiles: [{ id: "u1", profile_details: { candidates: ROSTER } }],
      ceac_case_status: [],
      ceac_scheduled_notifications: [],
    };
    client = createFakeSupabase(tables);
    const engine = new CeacReminderEngine(client as any);
    await engine.scheduleReminders({
      journeyId: "j-ir2",
      userId: "u1",
      newStatus: "in_transit",
      previousStatus: "at_nvc",
    } as any);
    expect(tables.ceac_case_status[0]).toMatchObject({ journey_id: "j-ir2", candidate_id: "candidate-3" });
  });

  it("a legacy journey without a roster owner keeps the pre-slot id", async () => {
    tables = {
      journeys: [{ id: "j-ir5c2", user_id: "u1", journey_type: "ir5_candidate2" }],
      user_profiles: [{ id: "u1", profile_details: {} }],
      ceac_case_status: [],
      ceac_scheduled_notifications: [],
    };
    client = createFakeSupabase(tables);
    await new CeacReminderEngine(client as any).scheduleReminders({
      journeyId: "j-ir5c2",
      userId: "u1",
      newStatus: "in_transit",
      previousStatus: "at_nvc",
    } as any);
    expect(tables.ceac_case_status[0].candidate_id).toBe("candidate-2");
  });
});

describe("6. consultation notifications carry the booking's candidate_id", () => {
  function setupBooking(candidateId: string | null) {
    tables = {
      consultation_bookings: [
        {
          id: "b1",
          email: "p@example.com",
          full_name: "P",
          status: "confirmed",
          issue_category: "Visa",
          reference_id: "R1",
          candidate_id: candidateId,
        },
      ],
      profiles: [{ id: "u1", email: "p@example.com" }],
      app_notifications: [],
    };
    client = createFakeSupabase(tables);
  }

  it("a journey booking for the IR-2 child is tagged candidate-3", async () => {
    setupBooking("candidate-3");
    await triggerConsultationNotification("b1");
    await flush();
    expect(tables.app_notifications[0]).toMatchObject({ user_id: "u1", candidate_id: "candidate-3" });
  });

  it("a standalone booking is account-wide (null), not candidate-1", async () => {
    setupBooking(null);
    await triggerConsultationNotification("b1");
    await flush();
    expect(tables.app_notifications[0].candidate_id).toBeNull();
  });
});

describe("7. guides/start never writes a guide session without its candidate", () => {
  function setupGuides(failInsert: boolean) {
    tables = { guides: [{ id: "g1", slug: "nvc", title: "NVC" }], user_guides: [] };
    client = createFakeSupabase(tables, {
      user: { id: "u1" },
      failOps: failInsert ? ["user_guides.insert"] : [],
    });
  }
  const start = (body: unknown) =>
    guidesStart(new Request("http://localhost", { method: "POST", body: JSON.stringify(body) }));

  it("the insert path tags the candidate", async () => {
    setupGuides(false);
    await start({ slug: "nvc", candidateId: "candidate-3" });
    expect(tables.user_guides[0]).toMatchObject({ guide_id: "g1", candidate_id: "candidate-3" });
  });

  it("the fallback after a failed insert keeps candidate_id", async () => {
    setupGuides(true);
    const res = await start({ slug: "nvc", candidateId: "candidate-3" });
    expect(res.status).toBe(200);
    expect(tables.user_guides).toHaveLength(1);
    expect(tables.user_guides[0].candidate_id).toBe("candidate-3");
  });

  it("a malformed candidate id falls back to candidate-1", async () => {
    setupGuides(false);
    await start({ slug: "nvc", candidateId: "x'); drop" });
    expect(tables.user_guides[0].candidate_id).toBe("candidate-1");
  });
});
