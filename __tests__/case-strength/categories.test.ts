/**
 * Category-profile / IR-5 case-strength tests.
 *
 * These lock in the scalability layer that makes the engine visa-category-aware:
 *   1. `resolveCaseStrengthProfile` maps journey_type → the right profile,
 *      tolerant of "IR1"/"IR-1"/"ir_1" spellings, and defaults to IR-1.
 *   2. The IR-5 (parent) registry reuses every shared checker but overrides the
 *      five relationship/consistency-sensitive steps with parent-child versions
 *      (no marriage, no I-130A, DOB-only cross-form baseline).
 *   3. The generic `compareFields` diff works for the IR-5 baseline fields.
 */

import {
  compareFields,
  runStepChecks,
  runPhase2Checks,
  runCommonPhase2Checks,
  runFullConsistencyAnalysis,
  type StepCheck,
} from "@/lib/case-strength";
import {
  resolveCaseStrengthProfile,
  IR1_PROFILE,
  IR5_PROFILE,
  IR5_STEP_CHECKERS,
  IR5_BASELINE_FIELDS,
} from "@/lib/case-strength/categories";
import { EvidenceGapEngine } from "@/lib/journey/evidence-gap";
import type { EvidenceGapInput } from "@/lib/journey/evidence-gap";

/** Minimal WizardState shape the checkers read. Cast at call sites. */
function makeState(metadata: Record<string, unknown> = {}): any {
  return {
    metadata,
    answers: {},
    completedSteps: new Set<string>(),
    documentChecklist: {},
    docUploads: {},
    notes: {},
  };
}

function ctx(state: any, eligibilityAnswers: any = null) {
  return { state, uploadedDocuments: [], eligibilityAnswers };
}

const titles = (checks: StepCheck[]) => checks.map((c) => c.title).join(" | ");

// ── 1. Resolver ───────────────────────────────────────────────────────────────

describe("resolveCaseStrengthProfile", () => {
  it("maps IR-5 journey types (any spelling) to the parent profile", () => {
    for (const t of ["ir-5", "IR5", "IR-5", "ir_5"]) {
      expect(resolveCaseStrengthProfile(t).id).toBe("ir-5");
    }
  });

  it("maps IR-1 / CR-1 journey types to the spouse profile", () => {
    for (const t of ["IR1", "IR-1", "CR1", "cr-1"]) {
      expect(resolveCaseStrengthProfile(t).id).toBe("ir-1");
    }
  });

  it("defaults to IR-1 for unknown or missing journey types (no behavior change)", () => {
    expect(resolveCaseStrengthProfile(undefined).id).toBe("ir-1");
    expect(resolveCaseStrengthProfile("something-else").id).toBe("ir-1");
    expect(resolveCaseStrengthProfile(null).id).toBe("ir-1");
  });
});

// ── 2. IR-5 registry reuses COMMON but overrides the 5 relationship steps ──────

describe("IR-5 registry composition", () => {
  it("reuses the SAME shared checker as IR-1 for a category-agnostic step", () => {
    // step_1_3 (filing method) is shared — the IR-5 profile must point at the
    // exact same function object as IR-1, proving it was reused, not copied.
    expect(IR5_STEP_CHECKERS.step_1_3).toBe(IR1_PROFILE.stepCheckers.step_1_3);
  });

  it("overrides the 5 relationship/consistency steps with its own functions", () => {
    for (const key of ["step_1_4", "step_1_9", "step_1_10", "step_2_3", "step_3_7"]) {
      expect(IR5_STEP_CHECKERS[key]).not.toBe(IR1_PROFILE.stepCheckers[key]);
    }
  });
});

// ── 3. IR-5 step_1_4 is parent-child, not marriage ─────────────────────────────

describe("IR-5 step_1_4 (relationship baseline)", () => {
  it("asks for the parent-child link and never mentions marriage", () => {
    const checks = runStepChecks("step_1_4", ctx(makeState()), IR5_PROFILE.stepCheckers);
    const text = titles(checks) + JSON.stringify(checks);
    expect(text.toLowerCase()).toContain("parent");
    expect(text.toLowerCase()).not.toContain("marriage");
  });

  it("flags missing DOBs but not a missing marriage date", () => {
    const checks = runStepChecks("step_1_4", ctx(makeState()), IR5_PROFILE.stepCheckers);
    expect(checks.some((c) => c.title.toLowerCase().includes("date of birth"))).toBe(true);
    expect(checks.some((c) => c.title.toLowerCase().includes("marriage date"))).toBe(false);
  });

  it("clears the DOB warning once both dates are captured", () => {
    const state = makeState({
      consistencyBaseline: {
        petitionerDateOfBirth: "1990-01-01",
        beneficiaryDateOfBirth: "1960-01-01",
      },
    });
    const checks = runStepChecks("step_1_4", ctx(state), IR5_PROFILE.stepCheckers);
    expect(checks.some((c) => c.title.toLowerCase().includes("date of birth"))).toBe(false);
  });
});

// ── 4. IR-5 step_2_3 cross-form consistency uses DOB-only baseline ─────────────

describe("IR-5 step_2_3 (DS-260 vs I-130)", () => {
  it("flags a DOB mismatch between the two forms as critical", () => {
    const state = makeState({
      consistencyBaseline: { petitionerDateOfBirth: "1990-01-01", beneficiaryDateOfBirth: "1960-01-01" },
      ds260Baseline: { petitionerDateOfBirth: "1990-01-01", beneficiaryDateOfBirth: "1960-05-05", capturedAt: "x" },
    });
    const checks = runStepChecks("step_2_3", ctx(state), IR5_PROFILE.stepCheckers);
    expect(checks.some((c) => c.level === "critical" && /does not match/i.test(c.title))).toBe(true);
  });
});

// ── 5. Generic comparator on IR-5 fields ───────────────────────────────────────

describe("compareFields with IR5_BASELINE_FIELDS", () => {
  it("returns only the differing field", () => {
    const a = { petitionerDateOfBirth: "1990-01-01", beneficiaryDateOfBirth: "1960-01-01" };
    const b = { petitionerDateOfBirth: "1990-01-01", beneficiaryDateOfBirth: "1961-01-01" };
    const diff = compareFields(a, b, IR5_BASELINE_FIELDS);
    expect(diff).toHaveLength(1);
    expect(diff[0].field).toBe("beneficiaryDateOfBirth");
  });

  it("skips fields missing on either side (not captured ≠ mismatch)", () => {
    const a = { petitionerDateOfBirth: "1990-01-01" };
    const b = { beneficiaryDateOfBirth: "1960-01-01" };
    expect(compareFields(a, b, IR5_BASELINE_FIELDS)).toHaveLength(0);
  });
});

// ── 6. Consistency Intelligence Phase 2 is category-aware ──────────────────────

describe("Consistency Intelligence Phase 2 — category profiles", () => {
  // A response set that would trigger the spouse-only prior-marriage findings.
  const marriageResponse = { prior_marriage_either: true } as any;

  it("IR-1 questionnaire includes marriage-history questions; IR-5 does not", () => {
    const ir1Groups = IR1_PROFILE.consistency.phase2Questions.map((q) => q.group);
    const ir5Groups = IR5_PROFILE.consistency.phase2Questions.map((q) => q.group);
    expect(ir1Groups).toContain("Marriage History");
    expect(ir5Groups).not.toContain("Marriage History");
    // IR-5 still keeps the shared groups (immigration/employment/address).
    expect(ir5Groups).toContain("Immigration History");
  });

  it("IR-5 wires the common-only Phase 2 runner (reuse, not a copy)", () => {
    expect(IR5_PROFILE.consistency.runPhase2Checks).toBe(runCommonPhase2Checks);
    expect(IR1_PROFILE.consistency.runPhase2Checks).toBe(runPhase2Checks);
  });

  it("IR-5 runner emits NO prior-marriage finding even when the answer is yes", () => {
    const findings = IR5_PROFILE.consistency.runPhase2Checks(marriageResponse, makeState());
    expect(findings.some((f) => f.id.includes("prior_marriage"))).toBe(false);
  });

  it("IR-1 runner DOES emit the prior-marriage finding for the same answer", () => {
    const findings = IR1_PROFILE.consistency.runPhase2Checks(marriageResponse, makeState());
    expect(findings.some((f) => f.id.includes("prior_marriage"))).toBe(true);
  });

  it("runFullConsistencyAnalysis honors the category's Phase 2 runner", () => {
    const input = { state: makeState(), eligibilityAnswers: null };

    const ir5 = runFullConsistencyAnalysis(
      input,
      marriageResponse,
      [],
      IR5_PROFILE.consistency.runPhase2Checks
    );
    expect(ir5.some((f) => f.id.includes("prior_marriage"))).toBe(false);

    const ir1 = runFullConsistencyAnalysis(
      input,
      marriageResponse,
      [],
      IR1_PROFILE.consistency.runPhase2Checks
    );
    expect(ir1.some((f) => f.id.includes("prior_marriage"))).toBe(true);
  });
});

// ── 7. Evidence Gap engine is category-aware ───────────────────────────────────

describe("Evidence Gap — category profiles", () => {
  // Only civil documents uploaded; nothing marriage-related. This lets us see
  // which REQUIRED docs each category flags as missing.
  const emptyInput = {
    vaultDocuments: [] as EvidenceGapInput["vaultDocuments"],
    journeyDocuments: [],
    caseData: {},
    questionnaireResponses: {},
  };

  it("IR-1 keeps the full evidence set; IR-5 assesses only I-130 filing-stage categories", () => {
    const ir1Cats = Object.keys(IR1_PROFILE.evidence.requirements);
    const ir5Cats = Object.keys(IR5_PROFILE.evidence.requirements);

    // Spouse categories AND the NVC-stage categories (FINANCIAL = I-864/tax,
    // IMMIGRATION_HISTORY = police cert) are present for IR-1 but omitted for IR-5,
    // whose Case Analysis focuses on the I-130 filing stage only.
    for (const c of [
      "RELATIONSHIP",
      "COHABITATION",
      "COMMUNICATION",
      "FINANCIAL",
      "IMMIGRATION_HISTORY",
    ]) {
      expect(ir1Cats).toContain(c);
      expect(ir5Cats).not.toContain(c);
    }
    // IR-5 assesses only the filing-stage categories.
    expect(ir1Cats).toContain("IDENTITY");
    expect(ir5Cats).toContain("IDENTITY");
    expect(ir5Cats).toContain("FAMILY_INTEGRATION");
  });

  it("IR-1 IDENTITY requires the marriage certificates; IR-5 IDENTITY does not", () => {
    const ir1IdIds = IR1_PROFILE.evidence.requirements.IDENTITY!.items.map((i) => i.id);
    const ir5IdIds = IR5_PROFILE.evidence.requirements.IDENTITY!.items.map((i) => i.id);

    expect(ir1IdIds).toEqual(expect.arrayContaining(["nikah_nama", "nadra_mrc"]));
    expect(ir5IdIds).not.toContain("nikah_nama");
    expect(ir5IdIds).not.toContain("nadra_mrc");
    // The parent-child link is still proven by the shared civil docs.
    expect(ir5IdIds).toEqual(
      expect.arrayContaining(["passport_beneficiary", "passport_petitioner", "birth_certificate"])
    );
  });

  it("IR-5 engine never reports a missing Nikah Nama / marriage requirement", () => {
    const ir5 = new EvidenceGapEngine(IR5_PROFILE.evidence.requirements).analyze(emptyInput);
    const missingNames = ir5.requiredDocuments.missing.map((m) => m.name.toLowerCase()).join(" | ");
    expect(missingNames).not.toContain("nikah");
    expect(missingNames).not.toContain("nadra");
    expect(missingNames).not.toContain("marriage");
    // But the shared required civil docs ARE still tracked as missing.
    expect(missingNames).toContain("passport");
  });

  it("IR-1 engine DOES report the marriage certificates as missing", () => {
    const ir1 = new EvidenceGapEngine(IR1_PROFILE.evidence.requirements).analyze(emptyInput);
    const missingNames = ir1.requiredDocuments.missing.map((m) => m.name.toLowerCase()).join(" | ");
    expect(missingNames).toContain("nikah");
  });

  it("IR-5 produces no assessment cards for the spouse-only categories", () => {
    const ir5 = new EvidenceGapEngine(IR5_PROFILE.evidence.requirements).analyze(emptyInput);
    const cardCats = Object.keys(ir5.categories);
    expect(cardCats).not.toContain("RELATIONSHIP");
    expect(cardCats).not.toContain("COHABITATION");
    expect(cardCats).not.toContain("COMMUNICATION");
  });

  it("IR-5 questionnaire keeps only I-130 filing-stage questions (drops marriage + NVC-stage)", () => {
    const ir5Ids = IR5_PROFILE.evidence.questionnaire.map((q) => q.id);
    // Marriage questions dropped (a parent case has no marriage to prove).
    expect(ir5Ids).not.toContain("has_wedding_photos");
    expect(ir5Ids).not.toContain("has_lease");
    expect(ir5Ids).not.toContain("has_children");
    // NVC-stage financial/immigration questions are dropped too — those categories
    // are not scored at the I-130 filing stage, so we don't ask about them here.
    expect(ir5Ids).not.toContain("has_i864");
    expect(ir5Ids).not.toContain("has_tax_returns");
    expect(ir5Ids).not.toContain("has_i94");
    // Only the filing-stage supporting question remains.
    expect(ir5Ids).toContain("has_family_photos");
  });
});

// ── 8. Legacy numeric CaseStrengthEngine relationship signal is category-aware ─

describe("Numeric strength — relationship signal by category", () => {
  it("IR-1 scores marriage + children and flags a large spouse age gap", () => {
    const r = IR1_PROFILE.strengthSignals.relationship({
      hasChildrenTogether: true,
      marriageYears: 3,
      ageGapYears: 20,
    });
    // +10 children, +5 long marriage, −5 age gap => +10 net.
    expect(r.scoreDelta).toBe(10);
    expect(r.positiveSignals.length).toBe(2);
    expect(r.riskFlags.some((f) => f.code === "HIGH_AGE_GAP")).toBe(true);
  });

  it("IR-1 flags a very short marriage", () => {
    const r = IR1_PROFILE.strengthSignals.relationship({
      hasChildrenTogether: false,
      marriageYears: 0.25,
      ageGapYears: null,
    });
    expect(r.scoreDelta).toBe(-5);
    expect(r.riskFlags.some((f) => f.code === "SHORT_MARRIAGE")).toBe(true);
  });

  it("IR-5 NEVER flags the (expected) large parent↔child age gap", () => {
    // A 35-year parent↔child gap would wrongly trip HIGH_AGE_GAP under the old
    // spouse-only engine. The parent signal must stay silent.
    const r = IR5_PROFILE.strengthSignals.relationship({
      hasChildrenTogether: false,
      marriageYears: 0,
      ageGapYears: 35,
    });
    expect(r.scoreDelta).toBe(0);
    expect(r.positiveSignals).toHaveLength(0);
    expect(r.riskFlags).toHaveLength(0);
  });

  it("IR-5 stays silent even if spouse-shaped data leaks in", () => {
    const r = IR5_PROFILE.strengthSignals.relationship({
      hasChildrenTogether: true,
      marriageYears: 5,
      ageGapYears: 40,
    });
    expect(r.scoreDelta).toBe(0);
    expect(r.riskFlags).toHaveLength(0);
  });
});

// ── 9. Evidence Gap maps the real IR-5 journey document ids ─────────────────────
// The engine's document→category map was built for IR-1 ids. IR-5 (ir-5.json)
// uses different ids; these lock in that the parent docs land in the right
// category instead of being silently dropped by the keyword fallback.

describe("Evidence Gap — IR-5 journey document mapping", () => {
  const ir5Reqs = IR5_PROFILE.evidence.requirements;
  const base = {
    vaultDocuments: [] as EvidenceGapInput["vaultDocuments"],
    caseData: {},
    questionnaireResponses: {},
  };
  const journeyDoc = (document_type: string, is_required = false) => ({
    document_type,
    status: "uploaded",
    is_required,
  });

  it("family photos ('photos' id) count toward FAMILY_INTEGRATION, not dropped", () => {
    const analysis = new EvidenceGapEngine(ir5Reqs).analyze({
      ...base,
      journeyDocuments: [journeyDoc("photos")],
    });
    expect(analysis.categories.FAMILY_INTEGRATION.items.length).toBeGreaterThan(0);
    // and it satisfies the family_photos requirement (no longer "missing")
    const missing = analysis.categories.FAMILY_INTEGRATION.missingSupporting
      .map((m) => m.item.toLowerCase())
      .join(" | ");
    expect(missing).not.toContain("photos");
  });

  it("the parent-legitimacy marriage doc lands in IDENTITY (civil), never dropped", () => {
    const analysis = new EvidenceGapEngine(ir5Reqs).analyze({
      ...base,
      journeyDocuments: [journeyDoc("doc_parents_marriage")],
    });
    // Present as an IDENTITY item (parent-child legitimacy) — IR-5 has no
    // RELATIONSHIP card at all, so it must not vanish.
    expect(analysis.categories.IDENTITY.items.some((i) => i.id.includes("parents_marriage"))).toBe(
      true
    );
  });

  it("parent passport + birth-cert ids satisfy the IR-5 required civil docs", () => {
    const analysis = new EvidenceGapEngine(ir5Reqs).analyze({
      ...base,
      journeyDocuments: [
        journeyDoc("doc_parent_passport", true),
        journeyDoc("doc_parent_birth_cert", true),
        journeyDoc("doc_petitioner_birth_cert", true),
      ],
    });
    const missing = analysis.requiredDocuments.missing.map((m) => m.name.toLowerCase()).join(" | ");
    // Birth certificate + parent's passport now found; only the petitioner's
    // passport remains outstanding.
    expect(missing).not.toMatch(/birth/);
    expect(missing).toContain("petitioner");
  });
});

// ── 10. IR-5 eligibility detector matches IR-5's REAL q5 questionnaire ──────────
// IR-5's eligibility quest (ir-5.json) renumbered/re-polarized q5 vs IR-1. These
// lock in that IR-5 reads its own ids/values and never reuses IR-1's polarity.

describe("IR-5 eligibility risk detector (q5 semantics)", () => {
  const ir5 = IR5_PROFILE.detectEligibilityRisks;
  const ir1 = IR1_PROFILE.detectEligibilityRisks;
  const q5 = (screens: Record<string, string>) => ({ q5: screens });
  const ids = (flags: Array<{ id: string }>) => flags.map((f) => f.id);

  it("does NOT flag income when sponsorship is manageable (q5s5='yes') — the reported bug", () => {
    expect(ids(ir5(q5({ q5s5: "yes" })))).not.toContain("financial_sponsorship_concern");
  });

  it("flags income concern only when q5s5 is 'no' / 'possible' / 'unsure'", () => {
    for (const v of ["no", "possible", "unsure"]) {
      expect(ids(ir5(q5({ q5s5: v })))).toContain("financial_sponsorship_concern");
    }
  });

  it("treats q5s4 as a HEALTH concern, not an unlawful-presence waiver", () => {
    const flags = ir5(q5({ q5s4: "yes" }));
    expect(ids(flags)).toContain("medical_vaccination_concern");
    expect(ids(flags)).not.toContain("unlawful_presence_history");
  });

  it("reads unlawful presence from q5s3 (IR-5's id), not q5s4", () => {
    expect(ids(ir5(q5({ q5s3: "yes" })))).toContain("unlawful_presence_history");
    expect(ids(ir5(q5({ q5s4: "yes" })))).not.toContain("unlawful_presence_history");
  });

  it("flags immigration (q5s1), criminal (q5s2), domicile (q5s6), separate petition (q5s7)", () => {
    expect(ids(ir5(q5({ q5s1: "yes" })))).toContain("parent_immigration_or_fraud_history");
    expect(ids(ir5(q5({ q5s2: "yes" })))).toContain("parent_criminal_history");
    expect(ids(ir5(q5({ q5s6: "no" })))).toContain("domicile_concern");
    expect(ids(ir5(q5({ q5s7: "no" })))).toContain("separate_petition_required");
  });

  it("never emits the spouse-only prior-marriage flag (IR-1's q3 logic)", () => {
    const flags = ir5({ q3: { q3s1: "petitioner", q3s3: "no" }, q5: { q5s5: "no" } });
    expect(ids(flags)).not.toContain("missing_prior_marriage_termination");
  });

  it("IR-1 keeps its original polarity: q5s5='yes' DOES flag income (no regression)", () => {
    expect(ids(ir1(q5({ q5s5: "yes" })))).toContain("financial_sponsorship_concern");
  });
});
