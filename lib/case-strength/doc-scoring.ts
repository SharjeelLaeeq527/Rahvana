/**
 * doc-scoring.ts
 *
 * Reusable document case-strength scoring engine.
 * Used by DocCaseStrengthMeter for any document-gathering step
 * (step_1_2, step_2_4, etc.).
 *
 * Pure functions — no React, no side effects.
 */

import type { UploadedDocument } from "@/lib/document-vault/types";
import { mapDocumentNameToId } from "@/lib/document-vault/journey-mapping";

// ─── Types ────────────────────────────────────────────────────────────────────

export type RfeRisk =
  | "filing-blocker"
  | "critical"
  | "high"
  | "medium"
  | "low"
  | "bonus";

export type DocStatus =
  | "done"
  | "missing"
  | "pair-incomplete"
  | "not-applicable";

export interface DocScoreEntry {
  /** Weight out of 100 for required docs; 0 for conditional until confirmed applicable */
  weight: number;
  impactLabel: string;
  rfeRisk: RfeRisk;
  /** If this doc must be paired (e.g. nikah_nama ↔ mrc), provide the partner id */
  pairWith?: string;
  /** Alert shown when this specific doc is missing */
  missingAlert?: string;
  /** Alert shown when doc is present but its pair is missing */
  pairMissingAlert?: string;
  /** Pak-specific inline note shown in the table */
  pakistanNote?: string;
  /** Whether this is a conditional doc (shown only when applicable) */
  isConditional?: boolean;
}

export interface RecommendedAction {
  priority: number;
  docId?: string;
  label: string;
  description: string;
  href?: string;
}

export interface DocScoringConfig {
  stepKey: string;
  stepName: string;
  timeline: string;
  scores: Record<string, DocScoreEntry>;
  pakistanSpecificNotes: string[];
  recommendedActions: RecommendedAction[];
}

export interface ComputedDocResult {
  docId: string;
  name: string;
  group: string;
  status: DocStatus;
  scoreEntry: DocScoreEntry;
  pointsEarned: number;
  alert: string | null;
}

export interface ScoringResult {
  totalScore: number;          // 0-100
  maxPossible: number;         // sum of non-conditional weights
  pct: number;                 // 0-100
  riskLevel: "filing-blocked" | "high" | "medium" | "low" | "strong";
  riskLabel: string;
  riskColor: string;
  docs: ComputedDocResult[];
  activeAlerts: string[];
  strengths: string[];
  gaps: string[];
  doneCount: number;
  totalRequired: number;
}

// ─── Step-specific scoring configs ───────────────────────────────────────────

export const STEP_1_2_SCORING_CONFIG: DocScoringConfig = {
  stepKey: "step_1_2",
  stepName: "Gather Required Documents",
  timeline: "4–8 weeks",
  scores: {
    doc_citizenship: {
      weight: 25,
      impactLabel: "Filing Blocker",
      rfeRisk: "filing-blocker",
      missingAlert:
        "Cannot file I-130 without proof of U.S. citizenship — this is a hard blocker.",
    },
    doc_passport_ben: {
      weight: 15,
      impactLabel: "High",
      rfeRisk: "high",
      missingAlert: "Beneficiary passport is required before filing.",
    },
    doc_nikah_nama: {
      weight: 10,
      impactLabel: "Critical",
      rfeRisk: "critical",
      pairWith: "doc_mrc",
      pairMissingAlert:
        "Nikah Nama present but NADRA MRC missing — Islamabad Embassy expects both.",
      pakistanNote:
        "Islamabad Embassy expects Nikah Nama + NADRA MRC as a pair.",
    },
    doc_mrc: {
      weight: 10,
      impactLabel: "Critical",
      rfeRisk: "critical",
      pairWith: "doc_nikah_nama",
      pairMissingAlert:
        "NADRA MRC present but Nikah Nama missing — both required together.",
      pakistanNote:
        "NADRA MRC is increasingly required by Islamabad Embassy. Apply at Union Council.",
    },
    doc_relationship: {
      weight: 20,
      impactLabel: "Very High",
      rfeRisk: "high",
      missingAlert:
        "Relationship evidence takes time to build — start collecting photos, messages, and travel docs now.",
    },
    doc_translations: {
      weight: 10,
      impactLabel: "Compliance",
      rfeRisk: "critical",
      missingAlert:
        "Nikah Nama is in Urdu — a certified English translation is mandatory for USCIS.",
    },
    doc_prior_marriage: {
      weight: 0,
      impactLabel: "Conditional",
      rfeRisk: "high",
      isConditional: true,
      missingAlert:
        "Prior marriage flagged — termination documents (divorce decree / death cert) are required.",
    },
    doc_birth_cert: {
      weight: 5,
      impactLabel: "Consular Prep",
      rfeRisk: "bonus",
      pakistanNote: "Get NADRA birth certificate early — can take 1-2 weeks.",
    },
    doc_police_cert: {
      weight: 5,
      impactLabel: "Consular Prep",
      rfeRisk: "bonus",
      pakistanNote:
        "PCC takes 3–7 days in Punjab/Islamabad — apply now to avoid delays later.",
    },
  },
  pakistanSpecificNotes: [
    "Union Council registration (NADRA MRC) is increasingly required by Islamabad Embassy — do not skip.",
    "Police Character Certificate (PCC): 3–7 days in Punjab/Islamabad. Apply early.",
    "Nikah Nama must have full certified English translation — partial translations trigger RFE.",
    "If either party had a prior talaq in Pakistan, Union Council must have issued the final divorce certificate (90-day reconciliation period complete).",
  ],
  recommendedActions: [
    {
      priority: 1,
      docId: "doc_citizenship",
      label: "Upload Proof of U.S. Citizenship",
      description:
        "Highest priority — I-130 cannot be filed without this. Passport, naturalization cert, or U.S. birth cert.",
    },
    {
      priority: 2,
      docId: "doc_nikah_nama",
      label: "Get Nikah Nama + NADRA MRC + Translation",
      description:
        "Visit Union Council for MRC if not obtained. Arrange certified Urdu→English translation of Nikah Nama.",
      href: "/guides/nikah-nama-guide",
    },
    {
      priority: 3,
      docId: "doc_relationship",
      label: "Start building Relationship Evidence",
      description:
        "Collect photos across different occasions, chat/call logs, travel receipts, and financial ties. More is better.",
    },
    {
      priority: 4,
      docId: "doc_passport_ben",
      label: "Confirm Beneficiary Passport validity",
      description:
        "Ensure passport is valid for at least 6 months beyond expected visa issuance.",
      href: "/guides/passport-guide",
    },
    {
      priority: 5,
      docId: "doc_police_cert",
      label: "Apply for Police Character Certificate",
      description:
        "Not needed for I-130 but required at consular stage. Apply now — 3–7 days processing.",
      href: "/guides/police-verification-guide",
    },
  ],
};

// ─── Scoring engine ───────────────────────────────────────────────────────────

function isDocumentDone(
  docName: string,
  docId: string,
  uploadedDocuments: UploadedDocument[],
  documentChecklist: Record<string, boolean> | undefined,
  docReviewStatus: Record<string, string> | undefined,
  docUploads: Record<string, unknown> | undefined,
  notes: Record<string, string> | undefined,
): boolean {
  if (docReviewStatus?.[docId] === "reviewed") return true;
  if (documentChecklist?.[docName] === true) return true;
  if (docUploads?.[docName] !== undefined && docUploads?.[docName] !== null)
    return true;
  if (notes?.[docName]) return true;
  const vaultId = mapDocumentNameToId(docName);
  if (vaultId && uploadedDocuments.some((u) => u.documentDefId === vaultId))
    return true;
  return false;
}

export function computeDocScore(
  documentItems: Array<{ id: string; name: string; group: string; required: boolean }>,
  config: DocScoringConfig,
  uploadedDocuments: UploadedDocument[],
  documentChecklist: Record<string, boolean> | undefined,
  docReviewStatus: Record<string, string> | undefined,
  docUploads: Record<string, unknown> | undefined,
  notes: Record<string, string> | undefined,
  hasPriorMarriage?: boolean,
): ScoringResult {
  const doneMap: Record<string, boolean> = {};
  for (const doc of documentItems) {
    doneMap[doc.id] = isDocumentDone(
      doc.name,
      doc.id,
      uploadedDocuments,
      documentChecklist,
      docReviewStatus,
      docUploads,
      notes,
    );
  }

  const docs: ComputedDocResult[] = [];
  const activeAlerts: string[] = [];
  let totalScore = 0;
  let maxPossible = 0;
  let doneRequired = 0;
  let totalRequired = 0;

  for (const doc of documentItems) {
    const entry = config.scores[doc.id];
    if (!entry) continue;

    const isConditional = entry.isConditional ?? false;
    // For prior_marriage: only count if applicable
    if (doc.id === "doc_prior_marriage" && !hasPriorMarriage) {
      docs.push({
        docId: doc.id,
        name: doc.name,
        group: doc.group,
        status: "not-applicable",
        scoreEntry: entry,
        pointsEarned: 0,
        alert: null,
      });
      continue;
    }

    const done = doneMap[doc.id] ?? false;
    const weight = isConditional && !hasPriorMarriage ? 0 : entry.weight;

    if (!isConditional && weight > 0) {
      maxPossible += weight;
      totalRequired++;
      if (done) doneRequired++;
    } else if (isConditional && hasPriorMarriage) {
      // treat as required when applicable
      maxPossible += 10; // conditional weight when required
      totalRequired++;
      if (done) doneRequired++;
    }

    // Determine status
    let status: DocStatus = done ? "done" : "missing";
    let alert: string | null = null;

    if (done && entry.pairWith) {
      const partnerDone = doneMap[entry.pairWith] ?? false;
      if (!partnerDone) {
        status = "pair-incomplete";
        if (entry.pairMissingAlert) {
          alert = entry.pairMissingAlert;
          if (!activeAlerts.includes(alert)) activeAlerts.push(alert);
        }
      }
    }

    if (!done) {
      if (entry.missingAlert) {
        if (!activeAlerts.includes(entry.missingAlert))
          activeAlerts.push(entry.missingAlert);
        alert = entry.missingAlert;
      }
    }

    const pointsEarned = done && status !== "pair-incomplete" ? weight : 0;
    totalScore += pointsEarned;

    docs.push({ docId: doc.id, name: doc.name, group: doc.group, status, scoreEntry: entry, pointsEarned, alert });
  }

  const pct = maxPossible > 0 ? Math.round((totalScore / maxPossible) * 100) : 0;

  // Determine risk level
  const citizenshipDone = doneMap["doc_citizenship"] ?? false;
  let riskLevel: ScoringResult["riskLevel"];
  let riskLabel: string;
  let riskColor: string;

  if (!citizenshipDone) {
    riskLevel = "filing-blocked";
    riskLabel = "Filing Blocked";
    riskColor = "#dc2626";
  } else if (pct < 45) {
    riskLevel = "high";
    riskLabel = "High Risk";
    riskColor = "#ea580c";
  } else if (pct < 70) {
    riskLevel = "medium";
    riskLabel = "Medium Risk";
    riskColor = "#d97706";
  } else if (pct < 88) {
    riskLevel = "low";
    riskLabel = "Looking Good";
    riskColor = "#16a34a";
  } else {
    riskLevel = "strong";
    riskLabel = "Strong";
    riskColor = "#059669";
  }

  // Strengths and gaps
  const strengths: string[] = [];
  const gaps: string[] = [];

  for (const d of docs) {
    if (d.status === "done") {
      if (d.scoreEntry.rfeRisk === "filing-blocker")
        strengths.push("U.S. citizenship proof on file — I-130 filing is unblocked");
      else if (d.docId === "doc_nikah_nama")
        strengths.push("Nikah Nama present");
      else if (d.docId === "doc_mrc")
        strengths.push("NADRA MRC on file — embassy compliance strong");
      else if (d.docId === "doc_relationship")
        strengths.push("Relationship evidence gathering started");
      else if (d.docId === "doc_translations")
        strengths.push("Certified translations ready");
      else if (d.docId === "doc_passport_ben")
        strengths.push("Beneficiary passport confirmed");
    } else if (d.status === "missing" && d.scoreEntry.rfeRisk !== "bonus" && d.status !== "not-applicable") {
      if (d.scoreEntry.rfeRisk === "filing-blocker")
        gaps.push("U.S. citizenship proof missing — I-130 CANNOT be filed yet");
      else if (d.docId === "doc_nikah_nama")
        gaps.push("Nikah Nama not yet uploaded");
      else if (d.docId === "doc_mrc")
        gaps.push("NADRA MRC not obtained — embassy compliance at risk");
      else if (d.docId === "doc_relationship")
        gaps.push("No relationship evidence collected yet — high consular risk");
      else if (d.docId === "doc_translations")
        gaps.push("Certified translations missing for non-English documents");
    } else if (d.status === "pair-incomplete") {
      if (d.docId === "doc_nikah_nama")
        gaps.push("Nikah Nama present but NADRA MRC missing");
      else if (d.docId === "doc_mrc")
        gaps.push("NADRA MRC present but Nikah Nama missing");
    }
  }

  return {
    totalScore,
    maxPossible,
    pct,
    riskLevel,
    riskLabel,
    riskColor,
    docs,
    activeAlerts,
    strengths,
    gaps,
    doneCount: doneRequired,
    totalRequired,
  };
}
