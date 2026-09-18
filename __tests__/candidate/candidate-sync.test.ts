// __tests__/candidate/candidate-sync.test.ts
// ============================================================================
// Unit tests for Multi-Candidate / Beneficiary Profile Architecture
// ============================================================================

import {
  getDefaultCandidatesForVisa,
  createNewCandidate,
  getCandidateJourneyKey,
  SHARED_PETITIONER_FIELDS,
  CANDIDATE_SPECIFIC_FIELDS,
} from "@/lib/candidate/candidateSyncService";
import type { CandidateProfile } from "@/types/candidate";

describe("Multi-Candidate Profile Management & Sync Engine", () => {
  describe("getDefaultCandidatesForVisa", () => {
    it("generates Mother as default Candidate 1 for single-parent IR-5", () => {
      const candidates = getDefaultCandidatesForVisa("IR-5", "premium", false);
      expect(candidates).toHaveLength(1);
      expect(candidates[0].id).toBe("candidate-1");
      expect(candidates[0].relation).toBe("Mother");
      expect(candidates[0].isPrimary).toBe(true);
      expect(candidates[0].tier).toBe("premium");
    });

    it("generates Mother and Father candidates when bothParents is true for IR-5", () => {
      const candidates = getDefaultCandidatesForVisa("IR-5", "premium", true);
      expect(candidates).toHaveLength(2);
      expect(candidates[0].relation).toBe("Mother");
      expect(candidates[1].relation).toBe("Father");
      expect(candidates[1].id).toBe("candidate-2");
      expect(candidates[1].isPrimary).toBe(false);
      expect(candidates[1].tier).toBe("premium");
    });

    it("generates Child 1 candidate for IR-2", () => {
      const candidates = getDefaultCandidatesForVisa("IR-2", "basic", false);
      expect(candidates).toHaveLength(1);
      expect(candidates[0].relation).toBe("Child");
      expect(candidates[0].visaCategory).toBe("IR-2");
    });

    it("generates Spouse candidate for IR-1 / CR-1", () => {
      const candidates = getDefaultCandidatesForVisa("IR-1", "executive", false);
      expect(candidates).toHaveLength(1);
      expect(candidates[0].relation).toBe("Spouse");
    });
  });

  describe("createNewCandidate", () => {
    it("creates a 2nd parent candidate in free preview mode", () => {
      const existing: CandidateProfile[] = [
        {
          id: "candidate-1",
          label: "Candidate 1 (Mother)",
          relation: "Mother",
          fullName: "Fatima Bibi",
          visaCategory: "IR-5",
          tier: "premium",
          isPrimary: true,
          createdAt: new Date().toISOString(),
        },
      ];

      const newCand = createNewCandidate(existing, {
        relation: "Father",
        fullName: "Mohammad Ali",
        isPreview: true,
        tier: "free",
      });

      expect(newCand.id).toBe("candidate-2");
      expect(newCand.label).toBe("Candidate 2 (Father)");
      expect(newCand.relation).toBe("Father");
      expect(newCand.fullName).toBe("Mohammad Ali");
      expect(newCand.isPreview).toBe(true);
      expect(newCand.tier).toBe("free");
      expect(newCand.isPrimary).toBe(false);
    });

    it("creates sequential child candidates for IR-2 (Child 1, Child 2, Child 3)", () => {
      let list: CandidateProfile[] = getDefaultCandidatesForVisa("IR-2", "premium", false);
      expect(list).toHaveLength(1);
      expect(list[0].label).toBe("Candidate 1 (Child)");

      const child2 = createNewCandidate(list, {
        relation: "Child",
        fullName: "Zain Ali",
      });
      list = [...list, child2];
      expect(list).toHaveLength(2);
      expect(child2.label).toBe("Candidate 2 (Child 2)");

      const child3 = createNewCandidate(list, {
        relation: "Child",
        fullName: "Ayesha Ali",
      });
      list = [...list, child3];
      expect(list).toHaveLength(3);
      expect(child3.id).toBe("candidate-3");
      expect(child3.label).toBe("Candidate 3 (Child 3)");
    });
  });

  describe("getCandidateJourneyKey", () => {
    it("returns root journey key for candidate-1", () => {
      expect(getCandidateJourneyKey("ir-5", "candidate-1")).toBe("ir5");
      expect(getCandidateJourneyKey("ir-1", "candidate-1")).toBe("ir1");
    });

    it("returns candidate-scoped key for candidate-2 and beyond", () => {
      expect(getCandidateJourneyKey("ir-5", "candidate-2")).toBe("ir5_candidate2");
      expect(getCandidateJourneyKey("ir-2", "candidate-3")).toBe("ir2_candidate3");
    });
  });

  describe("Data Isolation & Shared Sponsor Definitions", () => {
    it("contains petitioner/sponsor fields in SHARED_PETITIONER_FIELDS", () => {
      expect(SHARED_PETITIONER_FIELDS).toContain("sponsor");
      expect(SHARED_PETITIONER_FIELDS).toContain("annualIncome");
      expect(SHARED_PETITIONER_FIELDS).toContain("financialProfile");
      expect(SHARED_PETITIONER_FIELDS).toContain("householdSize");
      expect(SHARED_PETITIONER_FIELDS).toContain("citizenshipStatus");
      expect(SHARED_PETITIONER_FIELDS).toContain("employer");
    });

    it("contains beneficiary-specific fields in CANDIDATE_SPECIFIC_FIELDS", () => {
      expect(CANDIDATE_SPECIFIC_FIELDS).toContain("beneficiary");
      expect(CANDIDATE_SPECIFIC_FIELDS).toContain("passportNumber");
      expect(CANDIDATE_SPECIFIC_FIELDS).toContain("cnic");
      expect(CANDIDATE_SPECIFIC_FIELDS).toContain("caseNumber");
      expect(CANDIDATE_SPECIFIC_FIELDS).toContain("receiptNumber");
      expect(CANDIDATE_SPECIFIC_FIELDS).toContain("interviewDate");
      expect(CANDIDATE_SPECIFIC_FIELDS).toContain("medicalDate");
      expect(CANDIDATE_SPECIFIC_FIELDS).toContain("pccDate");
    });

    it("ensures no overlap between shared sponsor fields and candidate-specific fields", () => {
      const sharedSet = new Set(SHARED_PETITIONER_FIELDS);
      const candidateSet = new Set(CANDIDATE_SPECIFIC_FIELDS);

      const intersection = [...sharedSet].filter((field) => candidateSet.has(field));
      expect(intersection).toEqual([]);
    });
  });

  describe("Document Vault Candidate Scoping", () => {
    it("scopes primary candidate vault to base journey key", () => {
      const key = getCandidateJourneyKey("IR-5", "candidate-1");
      expect(key).toBe("ir5");
    });

    it("scopes secondary parent candidate vault to isolated candidate journey key", () => {
      const key = getCandidateJourneyKey("IR-5", "candidate-2");
      expect(key).toBe("ir5_candidate2");
    });

    it("scopes child candidate vaults independently for multi-child IR-2 cases", () => {
      const child1Key = getCandidateJourneyKey("IR-2", "candidate-1");
      const child2Key = getCandidateJourneyKey("IR-2", "candidate-2");
      const child3Key = getCandidateJourneyKey("IR-2", "candidate-3");

      expect(child1Key).toBe("ir2");
      expect(child2Key).toBe("ir2_candidate2");
      expect(child3Key).toBe("ir2_candidate3");
      expect(new Set([child1Key, child2Key, child3Key]).size).toBe(3);
    });
  });
});
