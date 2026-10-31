/**
 * No IR-1 fallback for IR-2 (docs/ir2-implementation-plan.md, section 5.3 / test group E).
 * Risk: an IR-2 journey receives spouse (IR-1) content or rules because a resolver silently
 * defaults unknown categories to IR-1. "Unknown" must mean nothing, never "spouse".
 * Open rows are `it.todo` and name the phase that closes them; IR-2 cannot launch while any
 * todo remains (launch gate, Phase 7).
 */

import { getJourneyHrefByType, ROUTES } from "@/lib/constants/routes";
import { getQuestionnaireConfig, IR1_QUESTIONNAIRE_CONFIG } from "@/lib/questionnaire";
import { resolveCategorySlug } from "@/lib/interview-prep/journey-category-map";
import { DocumentChecklistEngine } from "@/lib/journey/document-checklist/engine";
import { journeyTypeForVisaCategory } from "@/lib/stripe/subscriptionCleanup";
import { journeyConfigKeyFor } from "@/lib/journey/journeyConfig";

const IR2_SPELLINGS = ["IR2", "ir2", "IR-2", "ir-2", "ir2_candidate-2", "IR-2 / CR-2", "CR-2"];

describe("closed: IR-2 never resolves to IR-1", () => {
  it("F1 Stripe plan ownership", () => {
    for (const s of IR2_SPELLINGS) expect([s, journeyTypeForVisaCategory(s)]).toEqual([s, "IR2"]);
  });

  it("F2/F3 seeding config", () => {
    for (const s of IR2_SPELLINGS) expect([s, journeyConfigKeyFor(s)]).toEqual([s, "ir-2"]);
  });

  it("F13 journey route is the IR-2 route, never IR-1", () => {
    for (const s of IR2_SPELLINGS) {
      expect([s, getJourneyHrefByType(s)]).toEqual([s, ROUTES.IR2_JOURNEY]);
    }
    expect(getJourneyHrefByType("IR-1")).toBe(ROUTES.JOURNEY);
    expect(getJourneyHrefByType("IR-5")).toBe(ROUTES.IR5_JOURNEY);
  });

  it("F8 document questionnaire is not the IR-1 questionnaire", () => {
    for (const s of ["IR2", "ir2-journey", "ir-2"]) {
      expect(getQuestionnaireConfig(s)).not.toBe(IR1_QUESTIONNAIRE_CONFIG);
    }
  });

  it("F10 interview category is never the spouse category", () => {
    for (const s of ["IR2", "ir2-journey", "ir2_candidate-2", "IR-2"]) {
      expect(resolveCategorySlug(s)).not.toBe("ir-1-spouse");
    }
  });

  it("F11 document checklist has no spouse documents", () => {
    // Private static on purpose (pure definition table); read it directly.
    const engine = DocumentChecklistEngine as unknown as {
      getDocumentDefinitions(journeyType: string): Array<{ document_key: string }>;
    };
    const defs = engine.getDocumentDefinitions("IR2");
    const keys = defs.map((d) => d.document_key);
    expect(keys).not.toContain("nikah-nama");
    expect(keys).not.toContain("marriage-cert");
  });
});

describe("open: closed by a later phase", () => {
  it.todo("F4/F5 resolveCaseStrengthProfile('IR2') is an IR-2 profile, not IR1_PROFILE (Phase 5)");
  it.todo("F5 IR-2 eligibility risks never raise a marriage / spouse flag (Phase 5)");
  it.todo("F6 StepView milestones use the IR-5 step layout for IR-2 (Phase 2)");
  it.todo("F7 interview prep for an IR-2 journey resolves ir-2-child (Phase 7)");
  it.todo("F12 vault Required tab lists IR-2 documents (Phase 4)");
});
