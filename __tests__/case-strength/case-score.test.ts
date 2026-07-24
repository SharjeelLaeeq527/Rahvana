/**
 * Weighted Case Strength score tests (§6 of CASE_STRENGTH_ALERT_ESCALATION_PLAN).
 *
 * Locks in:
 *   1. The 4-ingredient weighted math (Evidence 40 / Consistency 30 /
 *      Completeness 20 / Risk 10 penalty), risk applied as inverted health,
 *      clamping, and rounding.
 *   2. Risk-penalty accumulation & cap.
 *   3. Score bands (Weak <40 / Moderate 40–70 / Strong 70+).
 *   4. The IR-5-only opt-in flag (IR5 has caseScore; IR1 does not).
 *   5. The evidence engine's user-provided-only view ignores profile-autofilled
 *      journey / case_data placeholders (the auto-fill inflation fix, §6E).
 */

import {
  computeWeightedCaseScore,
  computeRiskPenalty,
  getScoreBand,
  classifyBandTransition,
  generateCaseNarrative,
  CASE_SCORE_WEIGHTS,
  RISK_SEVERITY_PENALTY,
  type RiskFlag,
} from "@/lib/case-strength";
import { IR1_PROFILE, IR5_PROFILE } from "@/lib/case-strength/categories";
import { EvidenceGapEngine } from "@/lib/journey/evidence-gap";
import type { EvidenceGapInput } from "@/lib/journey/evidence-gap";

function flag(severity: RiskFlag["severity"], id: string = severity): RiskFlag {
  return {
    id,
    title: `${severity} flag`,
    severity,
    advisory: "advisory text",
    source_basis: "test",
  };
}

describe("computeWeightedCaseScore", () => {
  it("weights sum to 1.0", () => {
    const sum =
      CASE_SCORE_WEIGHTS.evidence +
      CASE_SCORE_WEIGHTS.consistency +
      CASE_SCORE_WEIGHTS.completeness +
      CASE_SCORE_WEIGHTS.risk;
    expect(sum).toBeCloseTo(1.0, 10);
  });

  it("a flawless, risk-free case scores 100", () => {
    const { score } = computeWeightedCaseScore({
      evidenceStrength: 100,
      consistencyScore: 100,
      completeness: 100,
      riskFlags: [],
    });
    expect(score).toBe(100);
  });

  it("an empty case scores near the risk-health floor (no flags → full risk weight)", () => {
    // evidence 0*.4 + consistency 0*.3 + completeness 0*.2 + riskHealth 100*.1 = 10
    const { score } = computeWeightedCaseScore({
      evidenceStrength: 0,
      consistencyScore: 0,
      completeness: 0,
      riskFlags: [],
    });
    expect(score).toBe(10);
  });

  it("combines the four ingredients by weight", () => {
    // 80*.4 + 60*.3 + 50*.2 + (100-0)*.1 = 32 + 18 + 10 + 10 = 70
    const { score } = computeWeightedCaseScore({
      evidenceStrength: 80,
      consistencyScore: 60,
      completeness: 50,
      riskFlags: [],
    });
    expect(score).toBe(70);
  });

  it("a critical risk flag subtracts the full risk weight (10 points)", () => {
    const base = computeWeightedCaseScore({
      evidenceStrength: 100,
      consistencyScore: 100,
      completeness: 100,
      riskFlags: [],
    }).score;
    const withCritical = computeWeightedCaseScore({
      evidenceStrength: 100,
      consistencyScore: 100,
      completeness: 100,
      riskFlags: [flag("critical")],
    }).score;
    expect(base - withCritical).toBe(10);
  });

  it("clamps out-of-range inputs and never returns <0 or >100", () => {
    const high = computeWeightedCaseScore({
      evidenceStrength: 250,
      consistencyScore: 250,
      completeness: 250,
      riskFlags: [],
    });
    expect(high.score).toBe(100);
    const low = computeWeightedCaseScore({
      evidenceStrength: -50,
      consistencyScore: -50,
      completeness: -50,
      riskFlags: [flag("critical")],
    });
    expect(low.score).toBe(0);
  });

  it("returns the clamped breakdown for the always-visible 'why'", () => {
    const { breakdown } = computeWeightedCaseScore({
      evidenceStrength: 42,
      consistencyScore: 88,
      completeness: 10,
      riskFlags: [flag("warning")],
    });
    expect(breakdown.evidenceStrength).toBe(42);
    expect(breakdown.consistencyScore).toBe(88);
    expect(breakdown.completeness).toBe(10);
    expect(breakdown.riskPenalty).toBe(RISK_SEVERITY_PENALTY.warning);
  });
});

describe("computeRiskPenalty", () => {
  it("is 0 with no flags", () => {
    expect(computeRiskPenalty([])).toBe(0);
  });

  it("accumulates per-severity penalties", () => {
    expect(computeRiskPenalty([flag("warning", "a"), flag("advisory", "b")])).toBe(
      RISK_SEVERITY_PENALTY.warning + RISK_SEVERITY_PENALTY.advisory
    );
  });

  it("caps at 100", () => {
    expect(
      computeRiskPenalty([flag("critical", "a"), flag("critical", "b")])
    ).toBe(100);
  });
});

describe("getScoreBand", () => {
  it("classifies weak / moderate / strong at the 40 & 70 cut-offs", () => {
    expect(getScoreBand(0)).toBe("weak");
    expect(getScoreBand(39)).toBe("weak");
    expect(getScoreBand(40)).toBe("moderate");
    expect(getScoreBand(69)).toBe("moderate");
    expect(getScoreBand(70)).toBe("strong");
    expect(getScoreBand(100)).toBe("strong");
  });
});

describe("classifyBandTransition (score-drop alerting §6C)", () => {
  it("a null previous band (fresh session) never counts as a drop", () => {
    expect(classifyBandTransition(null, 10).direction).toBe("same");
    expect(classifyBandTransition(null, 95).direction).toBe("same");
  });

  it("detects a downward band cross", () => {
    // moderate (was) → weak (score 30)
    expect(classifyBandTransition("moderate", 30)).toEqual({ band: "weak", direction: "drop" });
    // strong → moderate
    expect(classifyBandTransition("strong", 55).direction).toBe("drop");
  });

  it("never flags an improvement as a drop", () => {
    expect(classifyBandTransition("weak", 80).direction).toBe("rise");
    expect(classifyBandTransition("moderate", 90).direction).toBe("rise");
  });

  it("ignores fluctuations within the same band", () => {
    expect(classifyBandTransition("moderate", 55).direction).toBe("same");
    expect(classifyBandTransition("moderate", 69).direction).toBe("same");
  });
});

describe("caseScore profile opt-in", () => {
  it("IR-5 opts into the weighted model", () => {
    expect(IR5_PROFILE.caseScore).toEqual({ model: "weighted" });
  });

  it("IR-1 now uses weighted model (caseScore)", () => {
    expect(IR1_PROFILE.caseScore).toEqual({ model: "weighted" });
  });
});

describe("case narrative — weighted / calm / user-provided (drawer §6E)", () => {
  const emptyEvidence = new EvidenceGapEngine().analyze({
    vaultDocuments: [],
    journeyDocuments: [{ document_type: "birth_certificate", status: "uploaded", is_required: true }],
    caseData: {},
  });

  it("band-based override → calm 'still building' summary for a low score", () => {
    const n = generateCaseNarrative({
      evidenceAnalysis: emptyEvidence,
      consistencyFindings: [],
      overallScoreOverride: 20, // weak band
    });
    expect(n.executiveSummary.toLowerCase()).toContain("still building");
    expect(n.executiveSummary.toLowerCase()).not.toContain("significant improvements");
  });

  it("band-based override → 'to gather' wording, never 'still missing'", () => {
    const n = generateCaseNarrative({
      evidenceAnalysis: emptyEvidence,
      consistencyFindings: [],
      overallScoreOverride: 45,
    });
    expect(n.executiveSummary.toLowerCase()).not.toContain("still missing");
  });

  it("legacy (no override) keeps the original alarming phrasing", () => {
    const n = generateCaseNarrative({ evidenceAnalysis: emptyEvidence, consistencyFindings: [] });
    // Low raw score → legacy "significant improvements" / "notable gaps" wording.
    expect(n.executiveSummary.toLowerCase()).toMatch(/significant improvements|notable gaps/);
  });
});

describe("EvidenceGapEngine user-provided-only view (auto-fill fix)", () => {
  it("ignores autofilled journey / case_data placeholders", () => {
    const engine = new EvidenceGapEngine();
    // No real uploads (vault empty), but journey + case_data are pre-populated
    // exactly as profile autofill would leave them.
    const input: EvidenceGapInput = {
      vaultDocuments: [],
      journeyDocuments: [
        {
          document_type: "birth_certificate",
          status: "uploaded",
          is_required: true,
        },
      ],
      caseData: {
        petitioner_name: {
          data_value: "Jane Doe",
          is_verified: false,
          source: "profile",
        },
      },
    };
    const result = engine.analyze(input);
    // The user has uploaded nothing, so the user-provided view is empty…
    expect(result.userProvided?.evidenceCount).toBe(0);
    expect(result.userProvided?.score).toBe(0);
    // …even though the autofill-inclusive overallScore may be non-zero.
    expect(result.userProvided?.score).toBeLessThanOrEqual(result.overallScore);
  });

  it("exposes a full user-provided sub-view (docs/categories/stats) for the drawer", () => {
    const engine = new EvidenceGapEngine();
    const result = engine.analyze({
      vaultDocuments: [
        { id: "v1", documentDefId: "birth-certificate", uploadedAt: new Date("2026-01-01"), status: "UPLOADED" },
      ],
      journeyDocuments: [],
      caseData: {},
    });
    expect(result.userProvided?.requiredDocuments).toBeDefined();
    expect(result.userProvided?.categories).toBeDefined();
    expect(result.userProvided?.stats).toBeDefined();
    expect(result.userProvided?.recommendations).toBeDefined();
    // The user-provided required-docs "found" never exceeds the autofill-inclusive one.
    expect(result.userProvided!.requiredDocuments.found).toBeLessThanOrEqual(
      result.requiredDocuments.found
    );
  });

  it("counts real vault uploads in the user-provided view", () => {
    const engine = new EvidenceGapEngine();
    const input: EvidenceGapInput = {
      vaultDocuments: [
        {
          id: "v1",
          documentDefId: "birth-certificate",
          uploadedAt: new Date("2026-01-01"),
          status: "UPLOADED",
        },
      ],
      journeyDocuments: [],
      caseData: {},
    };
    const result = engine.analyze(input);
    expect((result.userProvided?.evidenceCount ?? 0)).toBeGreaterThan(0);
  });
});
