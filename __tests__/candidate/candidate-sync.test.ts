// __tests__/candidate/candidate-sync.test.ts
// ============================================================================
// Unit tests for Multi-Candidate / Beneficiary Profile Architecture
// ============================================================================

import {
  getDefaultCandidatesForVisa,
  createNewCandidate,
  getCandidateJourneyKey,
  getBaseVisaCategory,
  getVisaCategoryForRelation,
  SHARED_PETITIONER_FIELDS,
  CANDIDATE_SPECIFIC_FIELDS,
} from "@/lib/candidate/candidateSyncService";
import {
  getFriendlyJourneyName,
  journeyTypeToVisaCategory,
} from "@/lib/document-vault/journey-mapping";
import type { CandidateProfile } from "@/types/candidate";

describe("Multi-Candidate Profile Management & Sync Engine", () => {
  describe("getVisaCategoryForRelation", () => {
    it("maps parents and stepparents to IR-5", () => {
      expect(getVisaCategoryForRelation("Mother")).toBe("IR-5");
      expect(getVisaCategoryForRelation("Father")).toBe("IR-5");
      expect(getVisaCategoryForRelation("Stepparent")).toBe("IR-5");
      expect(getVisaCategoryForRelation("AdoptiveParent")).toBe("IR-5");
    });

    it("maps spouses to IR-1", () => {
      expect(getVisaCategoryForRelation("Spouse")).toBe("IR-1");
    });

    it("maps children to IR-2", () => {
      expect(getVisaCategoryForRelation("Child")).toBe("IR-2");
    });
  });

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
      expect(candidates[0].id).toBe("candidate-1");
      expect(candidates[0].relation).toBe("Mother");
      expect(candidates[0].isPrimary).toBe(true);

      expect(candidates[1].id).toBe("candidate-2");
      expect(candidates[1].relation).toBe("Father");
      expect(candidates[1].isPrimary).toBe(false);
      expect(candidates[1].tier).toBe("premium");
    });

    it("generates Child 1 candidate for IR-2", () => {
      const candidates = getDefaultCandidatesForVisa("IR-2", "basic", false);
      expect(candidates).toHaveLength(1);
      expect(candidates[0].relation).toBe("Child");
      expect(candidates[0].label).toBe("Candidate 1 (Child)");
    });

    it("generates Spouse candidate for IR-1 / CR-1", () => {
      const candidates = getDefaultCandidatesForVisa("IR-1", "executive", false);
      expect(candidates).toHaveLength(1);
      expect(candidates[0].relation).toBe("Spouse");
    });
  });

  describe("createNewCandidate", () => {
    it("creates a 2nd parent candidate in free preview mode and sets IR-5 visaCategory and free tier", () => {
      const existing: CandidateProfile[] = [
        {
          id: "candidate-1",
          label: "Candidate 1 (Mother)",
          relation: "Mother",
          visaCategory: "IR-5",
          tier: "premium",
          isPrimary: true,
          isPreview: false,
          createdAt: new Date().toISOString(),
          colorTag: "rose",
        },
      ];

      const newCand = createNewCandidate(existing, {
        relation: "Father",
        isPreview: true,
      });

      expect(newCand.id).toBe("candidate-2");
      expect(newCand.relation).toBe("Father");
      expect(newCand.visaCategory).toBe("IR-5");
      expect(newCand.isPreview).toBe(true);
      expect(newCand.tier).toBe("free");
      expect(newCand.isPrimary).toBe(false);
    });

    it("creates Spouse candidate and correctly assigns IR-1 visaCategory even from IR-5 account", () => {
      const existing: CandidateProfile[] = [
        {
          id: "candidate-1",
          label: "Candidate 1 (Mother)",
          relation: "Mother",
          visaCategory: "IR-5",
          tier: "premium",
          isPrimary: true,
          isPreview: false,
          createdAt: new Date().toISOString(),
          colorTag: "rose",
        },
      ];

      const spouseCand = createNewCandidate(existing, {
        relation: "Spouse",
        fullName: "Jane Doe",
      });

      expect(spouseCand.id).toBe("candidate-2");
      expect(spouseCand.relation).toBe("Spouse");
      expect(spouseCand.visaCategory).toBe("IR-1");
      expect(spouseCand.tier).toBe("free");
      expect(spouseCand.isPreview).toBe(true);
    });

    it("creates Mother candidate and correctly assigns IR-5 visaCategory even from IR-1 account", () => {
      const existing: CandidateProfile[] = [
        {
          id: "candidate-1",
          label: "Candidate 1 (Spouse)",
          relation: "Spouse",
          visaCategory: "IR-1",
          tier: "premium",
          isPrimary: true,
          isPreview: false,
          createdAt: new Date().toISOString(),
          colorTag: "teal",
        },
      ];

      const motherCand = createNewCandidate(existing, {
        relation: "Mother",
        fullName: "Fatima Bibi",
      });

      expect(motherCand.id).toBe("candidate-2");
      expect(motherCand.relation).toBe("Mother");
      expect(motherCand.visaCategory).toBe("IR-5");
      expect(motherCand.tier).toBe("free");
      expect(motherCand.isPreview).toBe(true);
    });

    it("creates sequential child candidates for IR-2 (Child 1, Child 2, Child 3) in free preview", () => {
      const initial = getDefaultCandidatesForVisa("IR-2", "premium", false);
      expect(initial).toHaveLength(1);

      const child2 = createNewCandidate(initial, {
        relation: "Child",
        isPreview: true,
      });
      expect(child2.id).toBe("candidate-2");
      expect(child2.relation).toBe("Child");
      expect(child2.visaCategory).toBe("IR-2");
      expect(child2.label).toBe("Candidate 2 (Child 2)");
      expect(child2.tier).toBe("free");
      expect(child2.isPreview).toBe(true);

      const child3 = createNewCandidate([...initial, child2], {
        relation: "Child",
        isPreview: true,
      });
      expect(child3.id).toBe("candidate-3");
      expect(child3.label).toBe("Candidate 3 (Child 3)");
      expect(child3.visaCategory).toBe("IR-2");
      expect(child3.tier).toBe("free");
      expect(child3.isPreview).toBe(true);
    });
  });

  describe("getBaseVisaCategory", () => {
    it("extracts base visa category from standard and compound keys", () => {
      expect(getBaseVisaCategory("ir-5")).toBe("IR-5");
      expect(getBaseVisaCategory("IR5")).toBe("IR-5");
      expect(getBaseVisaCategory("ir5_candidate2")).toBe("IR-5");
      expect(getBaseVisaCategory("IR5_CANDIDATE-2_CANDIDATE-2_CANDIDATE-3")).toBe("IR-5");
      expect(getBaseVisaCategory("ir-1")).toBe("IR-1");
      expect(getBaseVisaCategory("ir1_candidate2")).toBe("IR-1");
      expect(getBaseVisaCategory("ir-2")).toBe("IR-2");
      expect(getBaseVisaCategory("ir2_candidate3")).toBe("IR-2");
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

    it("is fully idempotent when passed already candidate-suffixed keys", () => {
      expect(getCandidateJourneyKey("ir5_candidate2", "candidate-2")).toBe("ir5_candidate2");
      expect(getCandidateJourneyKey("IR5_CANDIDATE-2_CANDIDATE-2_CANDIDATE-2", "candidate-2")).toBe(
        "ir5_candidate2"
      );
      expect(getCandidateJourneyKey("ir5_candidate2", "candidate-3")).toBe("ir5_candidate3");
    });
  });

  describe("Journey Naming & Visa Mapping for Vault", () => {
    it("formats friendly journey names cleanly without candidate key repetition", () => {
      expect(getFriendlyJourneyName("ir5")).toBe("IR-5 Parent Visa Journey");
      expect(getFriendlyJourneyName("ir5_candidate2")).toBe("IR-5 Parent Visa Journey");
      expect(getFriendlyJourneyName("IR5_CANDIDATE-2_CANDIDATE-2_CANDIDATE-3")).toBe(
        "IR-5 Parent Visa Journey"
      );
      expect(getFriendlyJourneyName("ir1")).toBe("IR-1 Spouse Visa Journey");
      expect(getFriendlyJourneyName("ir2_candidate3")).toBe("IR-2 Child Visa Journey");
    });

    it("maps candidate journey types to valid VisaCategory", () => {
      expect(journeyTypeToVisaCategory("ir5")).toBe("IR-5");
      expect(journeyTypeToVisaCategory("ir5_candidate2")).toBe("IR-5");
      expect(journeyTypeToVisaCategory("IR5_CANDIDATE-2_CANDIDATE-2_CANDIDATE-3")).toBe("IR-5");
      expect(journeyTypeToVisaCategory("ir1_candidate2")).toBe("IR-1");
      expect(journeyTypeToVisaCategory("ir2_candidate3")).toBe("IR-2");
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
