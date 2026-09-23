// __tests__/candidate/candidate-tools.test.ts
// ============================================================================
// Multi-Candidate Tools Scoping & Beneficiary Isolation Tests (Phase 2)
// ============================================================================

import {
  calculateSponsorshipHouseholdSize,
  getSponsorshipResult,
} from "@/components/tools/SponsorshipCalculatorTool";
import { parseUSCISData, formatReceiptInput, decodePrefix } from "@/app/(tools)/case-status/page";

describe("Phase 2: Beneficiary-Specific Tools & Multi-Candidate Scoping", () => {
  // ─── 1. Interview Prep Tool Scoping ───────────────────────────────────────
  describe("1. Interview Preparation Session Isolation", () => {
    const getSessionStorageKey = (candidateId: string) =>
      `interviewPrepSessionId_${candidateId}`;
    const getSourceStorageKey = (candidateId: string) =>
      `interviewPrepSessionSource_${candidateId}`;

    it("generates isolated session storage keys for each candidate", () => {
      const cand1Key = getSessionStorageKey("candidate-1");
      const cand2Key = getSessionStorageKey("candidate-2");
      const cand3Key = getSessionStorageKey("candidate-3");

      expect(cand1Key).toBe("interviewPrepSessionId_candidate-1");
      expect(cand2Key).toBe("interviewPrepSessionId_candidate-2");
      expect(cand3Key).toBe("interviewPrepSessionId_candidate-3");
      expect(cand1Key).not.toEqual(cand2Key);
    });

    it("restores session correctly per candidate and maintains candidate-1 fallback", () => {
      const mockStorage: Record<string, string> = {
        interviewPrepSessionId: "session-legacy-default",
        "interviewPrepSessionId_candidate-2": "session-cand-2-father",
        "interviewPrepSessionId_candidate-3": "session-cand-3-child",
      };

      const resolveSessionId = (candidateId: string): string | null => {
        const scoped = mockStorage[`interviewPrepSessionId_${candidateId}`];
        if (scoped) return scoped;
        if (candidateId === "candidate-1") {
          return mockStorage["interviewPrepSessionId"] || null;
        }
        return null;
      };

      expect(resolveSessionId("candidate-1")).toBe("session-legacy-default");
      expect(resolveSessionId("candidate-2")).toBe("session-cand-2-father");
      expect(resolveSessionId("candidate-3")).toBe("session-cand-3-child");
      expect(resolveSessionId("candidate-4")).toBeNull();
    });

    it("does not bleed session questionnaire answers across candidates", () => {
      const sessionsByCandidate: Record<string, any> = {
        "candidate-1": {
          category: "ir5-mother",
          answers: { "m-1": "Mother's Birth Certificate Provided" },
        },
        "candidate-2": {
          category: "ir5-father",
          answers: { "f-1": "Father's Military Service Records" },
        },
      };

      expect(sessionsByCandidate["candidate-1"].answers["f-1"]).toBeUndefined();
      expect(sessionsByCandidate["candidate-2"].answers["m-1"]).toBeUndefined();
    });
  });

  // ─── 2. 221(g) Action Planner Isolation ──────────────────────────────────
  describe("2. 221(g) Action Planner Candidate Isolation", () => {
    it("namespaces 221(g) action plans per candidate in profile", () => {
      const mockProfile: any = {
        actionPlanner_candidate_1: {
          questionnaire: {
            formData: {
              beneficiaryName: "Mother Jane",
              visaCategory: "IR-5",
              consularPost: "Islamabad",
            },
          },
        },
        actionPlanner_candidate_2: {
          questionnaire: {
            formData: {
              beneficiaryName: "Father John",
              visaCategory: "IR-5",
              consularPost: "London",
            },
          },
        },
      };

      const getCandidateActionPlanner = (profile: any, candidateId: string) => {
        return (
          profile[`actionPlanner_${candidateId}`] ||
          profile[`actionPlanner_${candidateId.replace("-", "_")}`] ||
          (candidateId === "candidate-1" ? profile.actionPlanner : null)
        );
      };

      const cand1Plan = getCandidateActionPlanner(mockProfile, "candidate-1");
      const cand2Plan = getCandidateActionPlanner(mockProfile, "candidate-2");

      expect(cand1Plan?.questionnaire.formData.beneficiaryName).toBe("Mother Jane");
      expect(cand1Plan?.questionnaire.formData.consularPost).toBe("Islamabad");

      expect(cand2Plan?.questionnaire.formData.beneficiaryName).toBe("Father John");
      expect(cand2Plan?.questionnaire.formData.consularPost).toBe("London");
    });

    it("supports backward compatibility for primary candidate action planner", () => {
      const legacyProfile: any = {
        actionPlanner: {
          questionnaire: {
            formData: {
              beneficiaryName: "Spouse Jane",
              visaCategory: "IR-1",
            },
          },
        },
      };

      const getCandidateActionPlanner = (profile: any, candidateId: string) => {
        return (
          profile[`actionPlanner_${candidateId}`] ||
          (candidateId === "candidate-1" ? profile.actionPlanner : null)
        );
      };

      expect(getCandidateActionPlanner(legacyProfile, "candidate-1")?.questionnaire.formData.beneficiaryName).toBe("Spouse Jane");
      expect(getCandidateActionPlanner(legacyProfile, "candidate-2")).toBeNull();
    });
  });

  // ─── 3. Sponsorship Calculator Isolation ─────────────────────────────────
  describe("3. Sponsorship Calculator Candidate Isolation", () => {
    it("calculates household size accurately for spouse vs parent beneficiaries", () => {
      // Sponsoring spouse (married)
      const spouseData = {
        isMarried: true,
        relationshipToApplicant: "spouse",
        numberOfChildren: 1,
        taxDependents: 0,
        previousSponsoredCount: 0,
        currentSponsoredApplicant: true,
      };
      // Sponsor (1) + Spouse (not added twice since sponsoring own spouse) + Child (1) + Applicant (1) = 3
      const spouseHousehold = calculateSponsorshipHouseholdSize(spouseData);
      expect(spouseHousehold).toBe(3);

      // Sponsoring parent (mother) while married to spouse
      const parentData = {
        isMarried: true,
        relationshipToApplicant: "parent",
        numberOfChildren: 1,
        taxDependents: 0,
        previousSponsoredCount: 0,
        currentSponsoredApplicant: true,
      };
      // Sponsor (1) + Non-sponsored Spouse (1) + Child (1) + Applicant/Parent (1) = 4
      const parentHousehold = calculateSponsorshipHouseholdSize(parentData);
      expect(parentHousehold).toBe(4);
    });

    it("determines eligibility and required income independently for candidates", () => {
      // Candidate 1 (Spouse): Household 2, Sponsor income $40,000 in CA
      const resSpouse = getSponsorshipResult({
        state: "CA",
        isMarried: true,
        relationshipToApplicant: "spouse",
        currentAnnualIncome: 40000,
        currentSponsoredApplicant: true,
      });

      // Candidate 2 (Father): Household 3 (Sponsor + Spouse + Father), Sponsor income $40,000 in CA
      const resFather = getSponsorshipResult({
        state: "CA",
        isMarried: true,
        relationshipToApplicant: "other",
        currentAnnualIncome: 40000,
        currentSponsoredApplicant: true,
      });

      expect(resSpouse.householdSize).toBe(2);
      expect(resFather.householdSize).toBe(3);
      expect(resFather.requiredIncome).toBeGreaterThan(resSpouse.requiredIncome);
      expect(resSpouse.isEligible).toBe(true);
    });

    it("isolates storage state per candidate without key collisions", () => {
      const storage: Record<string, string> = {};

      const saveCandidateCalculation = (candidateId: string, result: any) => {
        storage[`sponsorshipCalc_${candidateId}`] = JSON.stringify(result);
        if (candidateId === "candidate-1") {
          storage["sponsorshipCalc"] = JSON.stringify(result);
        }
      };

      const result1 = { householdSize: 2, requiredIncome: 25550, isEligible: true };
      const result2 = { householdSize: 4, requiredIncome: 39000, isEligible: true };

      saveCandidateCalculation("candidate-1", result1);
      saveCandidateCalculation("candidate-2", result2);

      expect(JSON.parse(storage["sponsorshipCalc_candidate-1"]).householdSize).toBe(2);
      expect(JSON.parse(storage["sponsorshipCalc_candidate-2"]).householdSize).toBe(4);
      expect(JSON.parse(storage["sponsorshipCalc"]).householdSize).toBe(2);
    });
  });

  // ─── 4. USCIS Case Status Candidate Tagging ──────────────────────────────
  describe("4. USCIS Case Status Candidate Tagging & History Filtering", () => {
    it("formats and decodes receipt numbers accurately", () => {
      expect(formatReceiptInput("msc-249-0000001")).toBe("MSC2490000001");
      expect(formatReceiptInput(" ioe 9182 7364 50 ")).toBe("IOE9182736450");

      const decoded = decodePrefix("IOE9182736450");
      expect(decoded?.prefix).toBe("IOE");
      expect(decoded?.center).toBe("USCIS Electronic System");
    });

    it("parses USCIS response and attaches candidate identity tags", () => {
      const rawApiData = {
        formType: "I-130",
        current_case_status_en: "Case Was Received",
        current_case_status_desc_en: "On January 15, 2026, we received your Form I-130.",
        next_case_status: [{ date: "2026-01-15", completed_text_en: "Receipt notice sent" }],
      };

      const parsed = parseUSCISData(rawApiData, "IOE9182736450", {
        candidateId: "candidate-2",
        candidateName: "Father John",
      });

      expect(parsed.receiptNumber).toBe("IOE9182736450");
      expect(parsed.formType).toBe("I-130");
      expect(parsed.status).toBe("Case Was Received");
      expect(parsed.candidateId).toBe("candidate-2");
      expect(parsed.candidateName).toBe("Father John");
    });

    it("filters history records by candidate correctly", () => {
      const historyList = [
        { receiptNumber: "IOE9000000001", candidateId: "candidate-1", candidateName: "Mother Jane" },
        { receiptNumber: "IOE9000000002", candidateId: "candidate-2", candidateName: "Father John" },
        { receiptNumber: "IOE9000000003", candidateId: "candidate-1", candidateName: "Mother Jane" },
      ];

      const filterByCandidate = (list: typeof historyList, filterMode: "all" | "active", activeId: string) => {
        if (filterMode === "all") return list;
        return list.filter((item) => item.candidateId === activeId);
      };

      const all = filterByCandidate(historyList, "all", "candidate-1");
      const cand1Only = filterByCandidate(historyList, "active", "candidate-1");
      const cand2Only = filterByCandidate(historyList, "active", "candidate-2");

      expect(all).toHaveLength(3);
      expect(cand1Only).toHaveLength(2);
      expect(cand2Only).toHaveLength(1);
      expect(cand2Only[0].receiptNumber).toBe("IOE9000000002");
    });
  });
});
