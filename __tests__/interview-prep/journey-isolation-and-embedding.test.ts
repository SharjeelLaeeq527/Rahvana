import { TOOL_FEATURE_MAP } from "@/lib/constants/journey-app-groups";
import { STEP_PRIMARY_FEATURE } from "@/lib/entitlements/stepFeatureMap";
import { ENTITLEMENTS } from "@/lib/entitlements/config";
import { getEffectiveEntitlement } from "@/lib/entitlements/helpers";
import { DEFAULT_PREP_TOOL_DATA } from "@/app/components/journey-engine/components/InterviewPrepTool";

describe("Interview Prep Journey Embedding & Tier Access", () => {
  it("maps interview_prep toolKey to basic_interview_prep feature key", () => {
    expect(TOOL_FEATURE_MAP["interview_prep"]).toBe("basic_interview_prep");
  });

  it("maps roadmap step_3_7 to basic_interview_prep instead of step_guides", () => {
    expect(STEP_PRIMARY_FEATURE["step_3_7"]).toBe("basic_interview_prep");
  });

  it("evaluates interview prep access based on journey tier (Basic, Premium, Executive unlocked; Free locked)", () => {
    // Journey tier Free: locked
    const freeEntitlement = getEffectiveEntitlement("basic_interview_prep", "free", []);
    expect(freeEntitlement.state).toBe("locked_upgrade");
    expect(freeEntitlement.upgradeTarget).toBe("basic");

    // Journey tier Basic: FULL access, even with no purchased add-ons
    const basicEntitlement = getEffectiveEntitlement("basic_interview_prep", "basic", []);
    expect(basicEntitlement.state).toBe("full");

    // Journey tier Premium: FULL access
    const premiumEntitlement = getEffectiveEntitlement("basic_interview_prep", "premium", []);
    expect(premiumEntitlement.state).toBe("full");

    // Journey tier Executive: FULL access
    const execEntitlement = getEffectiveEntitlement("basic_interview_prep", "executive", []);
    expect(execEntitlement.state).toBe("full");
  });

  it("provides comprehensive DEFAULT_PREP_TOOL_DATA for dashboard launcher", () => {
    expect(DEFAULT_PREP_TOOL_DATA.type).toBe("interview_prep");
    expect(DEFAULT_PREP_TOOL_DATA.launch_module.title).toBeDefined();
    expect(DEFAULT_PREP_TOOL_DATA.launch_module.heading).toBeDefined();
    expect(DEFAULT_PREP_TOOL_DATA.launch_module.cues.length).toBeGreaterThan(0);
    expect(DEFAULT_PREP_TOOL_DATA.readiness_grid.length).toBe(2);
  });
});

describe("Interview Prep Standalone vs Journey Storage and Session Isolation", () => {
  const STANDALONE_SESSION_KEY = "standalone_interview_prep_session_id";
  const getCandidateSessionKey = (cId: string) => `interviewPrepSessionId_${cId}`;

  it("isolates standalone session storage key from candidate journey keys", () => {
    const standaloneKey = STANDALONE_SESSION_KEY;
    const candidate1Key = getCandidateSessionKey("candidate-1");
    const candidate2Key = getCandidateSessionKey("candidate-2");

    expect(standaloneKey).not.toBe(candidate1Key);
    expect(standaloneKey).not.toBe(candidate2Key);
  });

  it("prevents cross-session restoration between standalone and journey", () => {
    const standaloneSession = { id: "sess_tool_123", source: "tool" as const };
    const journeySession = { id: "sess_journey_456", source: "journey" as const, journey_id: "journey-1" };

    // Function simulating the isolation check in page.tsx
    const canRestore = (session: { source: string }, isEmbedded: boolean) => {
      if (!isEmbedded && session.source === "journey") return false;
      if (isEmbedded && session.source === "tool") return false;
      return true;
    };

    // In standalone mode (isEmbedded = false):
    expect(canRestore(standaloneSession, false)).toBe(true);
    expect(canRestore(journeySession, false)).toBe(false);

    // In journey mode (isEmbedded = true):
    expect(canRestore(journeySession, true)).toBe(true);
    expect(canRestore(standaloneSession, true)).toBe(false);
  });

  it("treats category access as included for paid journey tiers and skips purchase requirements", () => {
    const isCategoryUnlockedInJourney = (isJourney: boolean, journeyTier: string | null | undefined) => {
      if (!isJourney) return false;
      return Boolean(journeyTier && journeyTier.toLowerCase() !== "free");
    };

    expect(isCategoryUnlockedInJourney(true, "basic")).toBe(true);
    expect(isCategoryUnlockedInJourney(true, "premium")).toBe(true);
    expect(isCategoryUnlockedInJourney(true, "executive")).toBe(true);
    expect(isCategoryUnlockedInJourney(true, "free")).toBe(false);
    expect(isCategoryUnlockedInJourney(false, "executive")).toBe(false); // standalone requires purchase
  });
});

describe("Multi-Candidate Category Resolution & Query Param Generation (Phase 6)", () => {
  const { resolveCategorySlug } = require("@/lib/interview-prep/journey-category-map");
  const { getBaseVisaCategory, UNKNOWN_VISA_CATEGORY } = require("@/lib/candidate/candidateSyncService");

  const buildLaunchUrl = (opts: {
    journeyId?: string;
    rawCategory?: string;
    candidateId?: string;
  }) => {
    const baseCat = getBaseVisaCategory(opts.rawCategory);
    const effectiveCat = baseCat !== UNKNOWN_VISA_CATEGORY ? baseCat : "IR-1";
    const categorySlug = resolveCategorySlug(effectiveCat) || "ir-1-spouse";

    const queryParams = new URLSearchParams();
    if (opts.journeyId) queryParams.set("journey_id", opts.journeyId);
    if (categorySlug) queryParams.set("category_slug", categorySlug);
    if (opts.candidateId) queryParams.set("candidate_id", opts.candidateId);

    const qs = queryParams.toString();
    return qs ? `/interview-prep?${qs}` : "/interview-prep";
  };

  it("resolves IR-5 candidate 1 (Mother) and candidate 2 (Father) correctly", () => {
    const motherUrl = buildLaunchUrl({
      journeyId: "j-uuid-mother",
      rawCategory: "ir5",
      candidateId: "candidate-1",
    });
    const fatherUrl = buildLaunchUrl({
      journeyId: "j-uuid-father",
      rawCategory: "ir5_candidate-2",
      candidateId: "candidate-2",
    });

    expect(motherUrl).toBe("/interview-prep?journey_id=j-uuid-mother&category_slug=ir-5-parent&candidate_id=candidate-1");
    expect(fatherUrl).toBe("/interview-prep?journey_id=j-uuid-father&category_slug=ir-5-parent&candidate_id=candidate-2");
  });

  it("resolves IR-2 child journeys without falling back to IR-1", () => {
    const child1Url = buildLaunchUrl({
      journeyId: "j-uuid-child1",
      rawCategory: "ir2",
      candidateId: "candidate-1",
    });
    const child2Url = buildLaunchUrl({
      journeyId: "j-uuid-child2",
      rawCategory: "ir2_candidate-2",
      candidateId: "candidate-2",
    });

    expect(child1Url).toBe("/interview-prep?journey_id=j-uuid-child1&category_slug=ir-2-child&candidate_id=candidate-1");
    expect(child2Url).toBe("/interview-prep?journey_id=j-uuid-child2&category_slug=ir-2-child&candidate_id=candidate-2");
  });

  it("resolves IR-1 spouse journeys as candidate-1 ir-1-spouse", () => {
    const spouseUrl = buildLaunchUrl({
      journeyId: "j-uuid-spouse",
      rawCategory: "IR-1",
      candidateId: "candidate-1",
    });

    expect(spouseUrl).toBe("/interview-prep?journey_id=j-uuid-spouse&category_slug=ir-1-spouse&candidate_id=candidate-1");
  });
});

describe("Category Selection Filtering in Multi-Candidate Journeys (Phase 7)", () => {
  const { isMultiCandidateCategorySlug } = require("@/lib/interview-prep/journey-category-map");

  const filterCategories = (
    allCategories: Array<{ categorySlug: string; categoryName: string }>,
    userSessions: Array<{ category_slug: string; candidate_id?: string; completed?: boolean }>
  ) => {
    const usedCategorySlugs = new Set<string>();
    for (const s of userSessions) {
      if (!s.category_slug) continue;
      const isMulti = isMultiCandidateCategorySlug(s.category_slug);
      if (!isMulti) {
        usedCategorySlugs.add(s.category_slug);
      }
    }

    return allCategories.filter((cat) => !usedCategorySlugs.has(cat.categorySlug));
  };

  const categories = [
    { categorySlug: "ir-1-spouse", categoryName: "IR-1/CR-1 Spouse" },
    { categorySlug: "ir-5-parent", categoryName: "IR-5 Parent" },
    { categorySlug: "ir-2-child", categoryName: "IR-2 Child" },
  ];

  it("permits multi-candidate IR-5 to remain selectable for multiple sessions / candidates (adoptive, step parents, etc.)", () => {
    const sessions = [
      { category_slug: "ir-5-parent", candidate_id: "candidate-1", completed: false },
      { category_slug: "ir-5-parent", candidate_id: "candidate-2", completed: false },
    ];

    // IR-5 MUST remain available even after 2 sessions
    const available = filterCategories(categories, sessions);
    expect(available.some((c) => c.categorySlug === "ir-5-parent")).toBe(true);
  });

  it("permits multi-candidate IR-2 to remain selectable for multiple child candidates", () => {
    const sessions = [
      { category_slug: "ir-2-child", candidate_id: "candidate-1", completed: false },
    ];

    const available = filterCategories(categories, sessions);
    expect(available.some((c) => c.categorySlug === "ir-2-child")).toBe(true);
  });

  it("strictly filters single-candidate IR-1 categories once a session exists", () => {
    const sessions = [
      { category_slug: "ir-1-spouse", candidate_id: "candidate-1", completed: false },
    ];

    const available = filterCategories(categories, sessions);
    expect(available.some((c) => c.categorySlug === "ir-1-spouse")).toBe(false);
  });
});


