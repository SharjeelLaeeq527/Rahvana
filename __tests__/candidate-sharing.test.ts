import {
  isDocumentShareableAcrossCandidates,
  getMaxCandidates,
  isMultiCandidateJourney,
  getCandidateLabel,
  getDefaultCandidates,
  getNextCandidate,
  isValidCandidateId,
  getOtherCandidates,
  getCandidateShareTargets,
} from "@/lib/document-vault/candidate-sharing";
import { DocumentDefinition, VaultCandidate } from "@/lib/document-vault/types";

function def(partial: Partial<DocumentDefinition>): DocumentDefinition {
  return {
    id: "x",
    key: "X",
    name: "X",
    description: "",
    category: "CIVIL",
    roles: [],
    stages: ["NVC"],
    required: false,
    multipleFilesAllowed: false,
    validityType: "none",
    ...partial,
  };
}

const ROSTER: VaultCandidate[] = [
  { id: "candidate_1", label: "Parent 1" },
  { id: "candidate_2", label: "Parent 2" },
];

describe("isDocumentShareableAcrossCandidates", () => {
  it("shares petitioner-only documents by default", () => {
    expect(isDocumentShareableAcrossCandidates(def({ roles: ["PETITIONER"] }))).toBe(true);
  });

  it("shares joint-sponsor / household documents by default", () => {
    expect(isDocumentShareableAcrossCandidates(def({ roles: ["JOINT_SPONSOR"] }))).toBe(true);
    expect(isDocumentShareableAcrossCandidates(def({ roles: ["HOUSEHOLD_MEMBER"] }))).toBe(true);
  });

  it("treats any beneficiary document as candidate-specific", () => {
    expect(isDocumentShareableAcrossCandidates(def({ roles: ["BENEFICIARY"] }))).toBe(false);
    expect(
      isDocumentShareableAcrossCandidates(def({ roles: ["BENEFICIARY", "PETITIONER"] }))
    ).toBe(false);
  });

  it("treats a document with no roles as candidate-specific", () => {
    expect(isDocumentShareableAcrossCandidates(def({ roles: [] }))).toBe(false);
  });

  it("honors an explicit override in both directions", () => {
    expect(
      isDocumentShareableAcrossCandidates(
        def({ roles: ["BENEFICIARY"], shareableAcrossCandidates: true })
      )
    ).toBe(true);
    expect(
      isDocumentShareableAcrossCandidates(
        def({ roles: ["PETITIONER"], shareableAcrossCandidates: false })
      )
    ).toBe(false);
  });
});

describe("roster caps and labels", () => {
  it("caps IR-5 at 2 and leaves other journeys single-candidate", () => {
    expect(getMaxCandidates("IR5")).toBe(2);
    expect(getMaxCandidates("ir-5")).toBe(2);
    expect(getMaxCandidates("IR1")).toBe(1);
    expect(getMaxCandidates(undefined)).toBe(1);
  });

  it("only IR-5 is a multi-candidate journey today", () => {
    expect(isMultiCandidateJourney("ir5")).toBe(true);
    expect(isMultiCandidateJourney("ir1")).toBe(false);
  });

  it("labels IR-5 candidates as parents", () => {
    expect(getCandidateLabel("ir5", 1)).toBe("Parent 1");
    expect(getCandidateLabel("ir5", 2)).toBe("Parent 2");
    expect(getCandidateLabel("ir2", 1)).toBe("Candidate 1");
  });

  it("seeds one default candidate for IR-5 and none for single-candidate journeys", () => {
    expect(getDefaultCandidates("ir5")).toEqual([{ id: "candidate_1", label: "Parent 1" }]);
    expect(getDefaultCandidates("ir1")).toEqual([]);
  });
});

describe("getNextCandidate", () => {
  it("returns candidate_2 when IR-5 has one candidate", () => {
    const next = getNextCandidate("ir5", [{ id: "candidate_1", label: "Parent 1" }]);
    expect(next).toEqual({ id: "candidate_2", label: "Parent 2" });
  });

  it("returns null when IR-5 is already at its cap of 2", () => {
    expect(getNextCandidate("ir5", ROSTER)).toBeNull();
  });

  it("never reuses an id even after a middle candidate was removed", () => {
    // roster has only candidate_2 left (candidate_1 was removed) -> next must not collide
    const next = getNextCandidate("ir5", [{ id: "candidate_2", label: "Parent 2" }]);
    expect(next?.id).toBe("candidate_3");
  });
});

describe("candidate selectors", () => {
  it("validates roster membership", () => {
    expect(isValidCandidateId(ROSTER, "candidate_1")).toBe(true);
    expect(isValidCandidateId(ROSTER, "candidate_9")).toBe(false);
    expect(isValidCandidateId(ROSTER, null)).toBe(false);
  });

  it("returns the other candidates", () => {
    expect(getOtherCandidates(ROSTER, "candidate_1")).toEqual([
      { id: "candidate_2", label: "Parent 2" },
    ]);
  });
});

describe("getCandidateShareTargets", () => {
  it("returns [] for a single-candidate roster", () => {
    expect(
      getCandidateShareTargets(def({ roles: ["PETITIONER"] }), [ROSTER[0]], "candidate_1")
    ).toEqual([]);
  });

  it("returns [] for a candidate-specific document even with two candidates", () => {
    expect(
      getCandidateShareTargets(def({ roles: ["BENEFICIARY"] }), ROSTER, "candidate_1")
    ).toEqual([]);
  });

  it("returns the other candidate for a shareable document", () => {
    expect(
      getCandidateShareTargets(def({ roles: ["PETITIONER"] }), ROSTER, "candidate_1")
    ).toEqual([{ id: "candidate_2", label: "Parent 2" }]);
  });
});
