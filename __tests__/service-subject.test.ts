import { SOMEONE_ELSE_CANDIDATE_ID, isSomeoneElseRow } from "@/lib/services/serviceSubject";
import { buildServiceRequestDirectory } from "@/lib/services/serviceRequestDirectory";
import type { CandidateProfile } from "@/types/candidate";

const candidates = [
  { id: "candidate-1", label: "Parent 1 (Mother)", relation: "Mother", fullName: "Amina", visaCategory: "IR-5" },
] as unknown as CandidateProfile[];

describe("service booking subject ('Someone else')", () => {
  it("recognises rows booked for someone else (direct or metadata tag)", () => {
    expect(isSomeoneElseRow({ candidate_id: SOMEONE_ELSE_CANDIDATE_ID })).toBe(true);
    expect(isSomeoneElseRow({ metadata: { candidate_id: SOMEONE_ELSE_CANDIDATE_ID } })).toBe(true);
    expect(isSomeoneElseRow({ candidate_id: "candidate-1" })).toBe(false);
    expect(isSomeoneElseRow({})).toBe(false);
  });

  it("shows a standalone 'someone else' booking under the name saved on the booking", () => {
    const [item] = buildServiceRequestDirectory(
      {
        medicalAppointments: [
          {
            id: "m9",
            status: "pending",
            source: "standalone",
            candidate_id: SOMEONE_ELSE_CANDIDATE_ID,
            candidate_name: "Usman Khan",
            admin_notes: "[Candidate: someone-else] Usman Khan",
            created_at: "2026-11-23T00:00:00Z",
          },
        ],
      },
      candidates
    );
    expect(item.context.kind).toBe("standalone");
    expect(item.context.label).toBe("Standalone service page - Usman Khan");
  });
});
