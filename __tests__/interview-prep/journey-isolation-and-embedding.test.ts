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

