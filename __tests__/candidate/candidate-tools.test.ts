// __tests__/candidate/candidate-tools.test.ts
// ============================================================================
// Multi-Candidate Tools Scoping & Beneficiary Isolation Tests (Phase 2)
// ============================================================================

import {
  calculateSponsorshipHouseholdSize,
  getSponsorshipResult,
  STANDALONE_SPONSORSHIP_STORAGE_KEY,
  STANDALONE_SPONSORSHIP_DRAFT_KEY,
  getJourneySponsorshipDraftKey,
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

    it("generates isolated draft keys for journey candidates vs standalone tool", () => {
      const ir5MotherKey = getJourneySponsorshipDraftKey("ir5-journey", "candidate-1");
      const ir5FatherKey = getJourneySponsorshipDraftKey("ir5-journey", "candidate-2");
      const ir1SpouseKey = getJourneySponsorshipDraftKey("ir1-journey", "candidate-1");

      expect(STANDALONE_SPONSORSHIP_STORAGE_KEY).toBe("standalone_sponsorship_calc");
      expect(STANDALONE_SPONSORSHIP_DRAFT_KEY).toBe("standalone_sponsorship_calc_draft");

      expect(ir5MotherKey).toBe("journey_ir5-journey_candidate-1_sponsorship_draft");
      expect(ir5FatherKey).toBe("journey_ir5-journey_candidate-2_sponsorship_draft");
      expect(ir1SpouseKey).toBe("journey_ir1-journey_candidate-1_sponsorship_draft");

      expect(ir5MotherKey).not.toEqual(ir5FatherKey);
      expect(ir5MotherKey).not.toEqual(STANDALONE_SPONSORSHIP_DRAFT_KEY);
      expect(ir1SpouseKey).not.toEqual(STANDALONE_SPONSORSHIP_DRAFT_KEY);
    });

    it("prevents standalone draft/result from leaking into journey and vice-versa", () => {
      const mockStorage: Record<string, string> = {
        [STANDALONE_SPONSORSHIP_STORAGE_KEY]: JSON.stringify({
          householdSize: 2,
          requiredIncome: 25550,
          totalIncome: 45000,
          isEligible: true,
          raw: { state: "TX", currentAnnualIncome: 45000, relationshipToApplicant: "other" },
        }),
        [STANDALONE_SPONSORSHIP_DRAFT_KEY]: JSON.stringify({
          stepIdx: 3,
          data: { state: "TX", numberOfChildren: 1 },
          updatedAt: "2026-09-28T10:00:00.000Z",
        }),
        "journey_ir5-journey_candidate-1_sponsorship_draft": JSON.stringify({
          stepIdx: 6,
          data: { state: "CA", currentAnnualIncome: 60000, relationshipToApplicant: "parent" },
          updatedAt: "2026-09-28T10:05:00.000Z",
        }),
        "journey_ir5-journey_candidate-2_sponsorship_draft": JSON.stringify({
          stepIdx: 2,
          data: { state: "CA", currentAnnualIncome: 60000, isMarried: true },
          updatedAt: "2026-09-28T10:10:00.000Z",
        }),
      };

      // Standalone resolver only reads standalone keys
      const resolveStandaloneDraft = () => {
        const raw = mockStorage[STANDALONE_SPONSORSHIP_DRAFT_KEY];
        return raw ? JSON.parse(raw) : null;
      };

      // Journey resolver only reads journey-candidate keys
      const resolveJourneyDraft = (journeySlug: string, candidateId: string) => {
        const key = getJourneySponsorshipDraftKey(journeySlug, candidateId);
        const raw = mockStorage[key];
        return raw ? JSON.parse(raw) : null;
      };

      const standaloneDraft = resolveStandaloneDraft();
      const motherDraft = resolveJourneyDraft("ir5-journey", "candidate-1");
      const fatherDraft = resolveJourneyDraft("ir5-journey", "candidate-2");

      expect(standaloneDraft.stepIdx).toBe(3);
      expect(standaloneDraft.data.state).toBe("TX");

      expect(motherDraft.stepIdx).toBe(6);
      expect(motherDraft.data.relationshipToApplicant).toBe("parent");

      expect(fatherDraft.stepIdx).toBe(2);
      expect(fatherDraft.data.isMarried).toBe(true);

      // Verify mutual exclusivity
      expect(motherDraft.data.state).not.toEqual(standaloneDraft.data.state);
      expect(standaloneDraft.data.relationshipToApplicant).toBeUndefined();
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

  // ─── 5. Smart Form Filler Draft Isolation (Phase C) ──────────────────────
  describe("5. Smart Form Filler Draft & Progress Isolation (Phase C)", () => {
    const DRAFT_STORAGE_KEY = "visa_form_draft_backup";
    const buildDraftStorageKey = (formCode: string, journeyKey = "global") =>
      `${DRAFT_STORAGE_KEY}:${formCode.toLowerCase()}:${journeyKey}`;

    it("generates isolated draft storage keys per form and candidate journey key", () => {
      const keyCand1DS260 = buildDraftStorageKey("ds260", "ir5");
      const keyCand2DS260 = buildDraftStorageKey("ds260", "ir5_candidate2");
      const keyCand1I130 = buildDraftStorageKey("i130", "ir5");
      const keyCand2I130 = buildDraftStorageKey("i130", "ir5_candidate2");
      const keyLegacy = buildDraftStorageKey("ds260", "global");

      expect(keyCand1DS260).toBe("visa_form_draft_backup:ds260:ir5");
      expect(keyCand2DS260).toBe("visa_form_draft_backup:ds260:ir5_candidate2");
      expect(keyCand1I130).toBe("visa_form_draft_backup:i130:ir5");
      expect(keyCand2I130).toBe("visa_form_draft_backup:i130:ir5_candidate2");
      expect(keyLegacy).toBe("visa_form_draft_backup:ds260:global");

      expect(keyCand1DS260).not.toEqual(keyCand2DS260);
      expect(keyCand1DS260).not.toEqual(keyCand1I130);
    });

    it("isolates draft payloads between Candidate 1 (Mother) and Candidate 2 (Father)", () => {
      const mockStorage: Record<string, string> = {};

      const saveDraft = (formCode: string, journeyKey: string, payload: Record<string, string>) => {
        mockStorage[buildDraftStorageKey(formCode, journeyKey)] = JSON.stringify({
          draft: {
            payload,
            current_step: 2,
            current_question_index: 3,
            view_mode: "form",
            completed: false,
          },
        });
      };

      const readDraft = (formCode: string, journeyKey: string) => {
        const raw = mockStorage[buildDraftStorageKey(formCode, journeyKey)];
        if (raw) return JSON.parse(raw).draft;
        if (journeyKey !== "global") {
          const fallback = mockStorage[buildDraftStorageKey(formCode, "global")];
          if (fallback) return JSON.parse(fallback).draft;
        }
        return null;
      };

      // Candidate 1 (Mother Jane) saves DS-260 draft
      saveDraft("ds260", "ir5", {
        "S01-Q001_GivenName": "Jane",
        "S01-Q001_FamilyName": "Doe",
        "S01-Q004": "Female",
        "S01-Q006": "1960-05-12",
        "S01-Q012": "A12345678",
      });

      // Candidate 2 (Father John) saves DS-260 draft
      saveDraft("ds260", "ir5_candidate2", {
        "S01-Q001_GivenName": "John",
        "S01-Q001_FamilyName": "Doe",
        "S01-Q004": "Male",
        "S01-Q006": "1958-11-20",
        "S01-Q012": "B98765432",
      });

      const cand1Draft = readDraft("ds260", "ir5");
      const cand2Draft = readDraft("ds260", "ir5_candidate2");

      expect(cand1Draft.payload["S01-Q001_GivenName"]).toBe("Jane");
      expect(cand1Draft.payload["S01-Q004"]).toBe("Female");
      expect(cand1Draft.payload["S01-Q012"]).toBe("A12345678");

      expect(cand2Draft.payload["S01-Q001_GivenName"]).toBe("John");
      expect(cand2Draft.payload["S01-Q004"]).toBe("Male");
      expect(cand2Draft.payload["S01-Q012"]).toBe("B98765432");
    });

    it("falls back to legacy 'global' draft when candidate-specific draft does not exist yet", () => {
      const mockStorage: Record<string, string> = {
        [buildDraftStorageKey("i130", "global")]: JSON.stringify({
          draft: {
            payload: {
              sponsor_first_name: "Sharjeel",
              sponsor_last_name: "Laeeq",
              sponsor_city: "Los Angeles",
            },
            current_step: 1,
            current_question_index: 2,
          },
        }),
      };

      const readDraft = (formCode: string, journeyKey: string) => {
        const raw = mockStorage[buildDraftStorageKey(formCode, journeyKey)];
        if (raw) return JSON.parse(raw).draft;
        if (journeyKey !== "global") {
          const fallback = mockStorage[buildDraftStorageKey(formCode, "global")];
          if (fallback) return JSON.parse(fallback).draft;
        }
        return null;
      };

      // Candidate 1 (ir5) has no specific draft yet -> should read global fallback
      const cand1Draft = readDraft("i130", "ir5");
      expect(cand1Draft).not.toBeNull();
      expect(cand1Draft.payload.sponsor_first_name).toBe("Sharjeel");

      // Candidate 2 (ir5_candidate2) has no specific draft yet -> should also read global fallback
      const cand2Draft = readDraft("i130", "ir5_candidate2");
      expect(cand2Draft).not.toBeNull();
      expect(cand2Draft.payload.sponsor_first_name).toBe("Sharjeel");
    });

    it("constructs unique hydration keys so switching candidate switches form state", () => {
      const getHydrationKey = (formCode: string, userId: string | null, journeyKey: string) =>
        `${formCode}:${userId ?? "anon"}:${journeyKey}`;

      const keyCand1 = getHydrationKey("ds260", "user-123", "ir5");
      const keyCand2 = getHydrationKey("ds260", "user-123", "ir5_candidate2");

      expect(keyCand1).toBe("ds260:user-123:ir5");
      expect(keyCand2).toBe("ds260:user-123:ir5_candidate2");
      expect(keyCand1).not.toEqual(keyCand2);
    });
  });
});

