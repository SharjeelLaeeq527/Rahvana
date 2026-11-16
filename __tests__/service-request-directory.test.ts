import {
  buildServiceRequestDirectory,
  cleanAdminNotes,
  extractCandidateId,
  isRequestInCurrentJourney,
} from "@/lib/services/serviceRequestDirectory";
import type { CandidateProfile } from "@/types/candidate";

const candidates = [
  { id: "candidate-1", label: "Parent 1 (Mother)", relation: "Mother", fullName: "Amina", visaCategory: "IR-5" },
  { id: "candidate-2", label: "Parent 2 (Father)", relation: "Father", fullName: "Bilal", visaCategory: "IR-5" },
  { id: "candidate-3", label: "Spouse", relation: "Spouse", fullName: "Sara", visaCategory: "IR-1" },
] as unknown as CandidateProfile[];

describe("serviceRequestDirectory", () => {
  it("resolves a journey medical booking to its journey_slug category + candidate", () => {
    const [item] = buildServiceRequestDirectory(
      {
        medicalAppointments: [
          {
            id: "m1",
            status: "pending",
            source: "journey",
            journey_slug: "ir1-journey",
            candidate_id: "candidate-3",
            admin_notes: "[Candidate: candidate-3] Sara",
            created_at: "2026-10-01T00:00:00Z",
          },
        ],
      },
      candidates
    );
    expect(item.context.kind).toBe("journey");
    expect(item.context.category).toBe("IR-1");
    expect(item.context.candidateId).toBe("candidate-3");
    expect(item.context.label).toBe("IR-1 journey - Spouse: Sara");
    expect(item.context.journeyHref).toBe("/visa-category/ir1-journey");
    expect(item.adminNotes).toBeNull();
    expect(isRequestInCurrentJourney(item, { category: "IR-5", candidateId: "candidate-1" })).toBe(false);
    expect(isRequestInCurrentJourney(item, { category: "IR-1", candidateId: "candidate-3" })).toBe(true);
  });

  it("reads the PCC candidate from the admin_notes tag and keeps real admin text", () => {
    const row = { admin_notes: "[Candidate: candidate-2] Bilal Documents verified" , candidate_name: "Bilal" };
    expect(extractCandidateId(row)).toBe("candidate-2");
    expect(cleanAdminNotes(row)).toBe("Documents verified");
  });

  it("labels standalone rows, candidate-scoped translations, and account-wide consultations", () => {
    const items = buildServiceRequestDirectory(
      {
        pccRequests: [{ id: "p1", status: "pending", source: "standalone", created_at: "2026-09-01" }],
        translationDocuments: [
          { id: "t1", status: "PENDING", metadata: { candidate_id: "candidate-2" }, created_at: "2026-09-02" },
        ],
        consultationBookings: [
          { id: "c1", status: "confirmed", visa_category: "IR-5", created_at: "2026-09-03" },
        ],
      },
      candidates
    );
    const byId = Object.fromEntries(items.map((i) => [i.id, i]));
    expect(byId.p1.context.kind).toBe("standalone");
    expect(byId.p1.manageHref).toBe("/services");
    expect(byId.t1.context.label).toBe("IR-5 journey - Parent 2 (Father): Bilal");
    expect(byId.c1.context.kind).toBe("account");
    expect(byId.c1.context.label).toBe("Account-wide (booked for IR-5)");
    // newest first
    expect(items.map((i) => i.id)).toEqual(["c1", "t1", "p1"]);
  });

  it("treats untagged legacy journey rows as candidate-1", () => {
    const [item] = buildServiceRequestDirectory(
      { medicalAppointments: [{ id: "m2", source: "journey", journey_slug: "ir5-journey" }] },
      candidates
    );
    expect(item.context.candidateId).toBe("candidate-1");
    expect(item.context.label).toBe("IR-5 journey - Parent 1 (Mother): Amina");
  });

  it("resolves a journey consultation booking to its journey_slug category + candidate", () => {
    const [item] = buildServiceRequestDirectory(
      {
        consultationBookings: [
          {
            id: "c2",
            status: "pending_approval",
            source: "journey",
            journey_slug: "ir1-journey",
            candidate_id: "candidate-3",
            created_at: "2026-10-01T00:00:00Z",
          },
        ],
      },
      candidates
    );
    expect(item.context.kind).toBe("journey");
    expect(item.context.category).toBe("IR-1");
    expect(item.context.candidateId).toBe("candidate-3");
    expect(item.context.label).toBe("IR-1 journey - Spouse: Sara");
    expect(item.context.journeyHref).toBe("/visa-category/ir1-journey");
    expect(item.manageHref).toBeNull();
    expect(isRequestInCurrentJourney(item, { category: "IR-1", candidateId: "candidate-3" })).toBe(true);
  });

  it("removes account-wide requests when excludeAccountWide is true (accessed for journey)", () => {
    const items = buildServiceRequestDirectory(
      {
        pccRequests: [{ id: "p1", status: "pending", source: "standalone", created_at: "2026-09-01" }],
        translationDocuments: [
          { id: "t1", status: "PENDING", metadata: { candidate_id: "candidate-2" }, created_at: "2026-09-02" },
        ],
        consultationBookings: [
          { id: "c1", status: "confirmed", visa_category: "IR-5", created_at: "2026-09-03" },
          { id: "c2", status: "confirmed", source: "journey", journey_slug: "ir5-journey", candidate_id: "candidate-1", created_at: "2026-09-04" },
        ],
      },
      candidates,
      { excludeAccountWide: true }
    );
    // c1 is an account-wide consultation, so it must be removed. c2 is journey-scoped and must stay.
    const ids = items.map((i) => i.id);
    expect(ids).toContain("c2");
    expect(ids).toContain("t1");
    expect(ids).toContain("p1");
    expect(ids).not.toContain("c1");
    expect(items.every((i) => i.context.kind !== "account")).toBe(true);
  });
});
