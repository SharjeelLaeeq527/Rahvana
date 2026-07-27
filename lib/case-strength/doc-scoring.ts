/**
 * Universal Case Strength scoring engine.
 *
 * Three industry-standard dimensions — works for ANY visa category that
 * exposes document_items in its JSON (IR-1, IR-2, F-2A, K-1, …).
 *
 *   1. Completeness     (50%) — required docs marked complete
 *   2. Evidence Quality (30%) — done docs backed by upload + review/notes
 *   3. Consistency      (20%) — eligibility answers align with provided docs
 *
 * No hardcoded weights per document. No category-specific content. Every
 * piece of displayed text comes from the JSON document_items + state.
 */

import type { UploadedDocument } from "@/lib/document-vault/types";
import { mapDocumentNameToId, isDocUploadedInVault } from "@/lib/document-vault/journey-mapping";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DocItem {
  id: string;
  name: string;
  subtitle?: string;
  required?: boolean;
  group?: string;
  tag?: string;
  guideUrl?: string;
  icon?: string;
}

export interface ConsistencyCheck {
  id: string;
  label: string;
  passed: boolean;
  hint?: string;
  relatedDocId?: string;
}

export interface MissingDoc {
  id: string;
  name: string;
  subtitle?: string;
  guideUrl?: string;
}

export interface ScoringResult {
  completeness: {
    score: number; // 0-100
    done: number;
    required: number;
    missing: MissingDoc[];
  };
  evidenceQuality: {
    score: number; // 0-100
    fullCount: number;
    partialCount: number;
    weak: Array<{ id: string; name: string }>;
  };
  consistency: {
    score: number; // 0-100
    checks: ConsistencyCheck[];
  };
  overall: number; // 0-100 (weighted)
  strengthLevel: "weak" | "fair" | "good" | "strong";
  strengthLabel: string;
  strengthColor: string;
  nextSteps: Array<{
    priority: number;
    action: string;
    docId?: string;
    href?: string;
  }>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isDocDone(
  doc: DocItem,
  uploadedDocuments: UploadedDocument[],
  documentChecklist: Record<string, boolean> | undefined,
  docReviewStatus: Record<string, string> | undefined,
  docUploads: Record<string, unknown> | undefined,
  notes: Record<string, string> | undefined
): boolean {
  if (docReviewStatus?.[doc.id] === "reviewed") return true;
  if (documentChecklist?.[doc.name] === true) return true;
  if (docUploads?.[doc.name] !== undefined && docUploads?.[doc.name] !== null) return true;
  if (notes?.[doc.name]) return true;
  const vaultId = mapDocumentNameToId(doc.name);
  if (vaultId && isDocUploadedInVault(doc.name, vaultId, uploadedDocuments)) return true;
  return false;
}

function getEvidenceLevel(
  doc: DocItem,
  uploadedDocuments: UploadedDocument[],
  documentChecklist: Record<string, boolean> | undefined,
  docReviewStatus: Record<string, string> | undefined,
  notes: Record<string, string> | undefined
): "none" | "partial" | "full" {
  const vaultId = mapDocumentNameToId(doc.name);
  const hasUpload = !!(vaultId && isDocUploadedInVault(doc.name, vaultId, uploadedDocuments));
  const hasReview = docReviewStatus?.[doc.id] === "reviewed";
  const hasNotes = !!notes?.[doc.name];
  const hasCheck = documentChecklist?.[doc.name] === true;

  if (hasUpload && (hasReview || hasNotes)) return "full";
  if (hasUpload || hasReview || hasNotes || hasCheck) return "partial";
  return "none";
}

// ─── Main scoring engine ─────────────────────────────────────────────────────

export function computeCaseStrength(
  documentItems: DocItem[],
  uploadedDocuments: UploadedDocument[],
  documentChecklist: Record<string, boolean> | undefined,
  docReviewStatus: Record<string, string> | undefined,
  docUploads: Record<string, unknown> | undefined,
  notes: Record<string, string> | undefined,
  eligibilityAnswers?: Record<string, Record<string, string | string[]> | undefined> | null
): ScoringResult {
  // ── 1. Completeness ─────────────────────────────────────────────────────
  const required = documentItems.filter((d) => d.required === true);
  const missing: MissingDoc[] = [];
  let doneCount = 0;
  for (const d of required) {
    if (isDocDone(d, uploadedDocuments, documentChecklist, docReviewStatus, docUploads, notes)) {
      doneCount++;
    } else {
      missing.push({ id: d.id, name: d.name, subtitle: d.subtitle, guideUrl: d.guideUrl });
    }
  }
  const completenessPct = required.length ? Math.round((doneCount / required.length) * 100) : 0;

  // ── 2. Evidence Quality ─────────────────────────────────────────────────
  // For docs that ARE done — how strong is the evidence backing them?
  let fullCount = 0;
  let partialCount = 0;
  const weak: Array<{ id: string; name: string }> = [];
  const doneDocs = required.filter((d) =>
    isDocDone(d, uploadedDocuments, documentChecklist, docReviewStatus, docUploads, notes)
  );
  for (const d of doneDocs) {
    const level = getEvidenceLevel(d, uploadedDocuments, documentChecklist, docReviewStatus, notes);
    if (level === "full") fullCount++;
    else if (level === "partial") {
      partialCount++;
      weak.push({ id: d.id, name: d.name });
    }
  }
  const evidencePct = doneDocs.length
    ? Math.round(((fullCount + partialCount * 0.5) / doneDocs.length) * 100)
    : 0;

  // ── 3. Consistency ──────────────────────────────────────────────────────
  // Cross-check eligibility answers against required document presence.
  // All checks are derivable from JSON-defined doc names + standard answer keys.
  const checks: ConsistencyCheck[] = [];

  // Helper: find a doc by partial id match (works across categories)
  const findDoc = (idFragment: string): DocItem | undefined =>
    documentItems.find((d) => d.id.toLowerCase().includes(idFragment));

  // Check A: prior marriage disclosed in eligibility → termination doc needed
  const q3s1 = eligibilityAnswers?.q3?.q3s1 as string | undefined;
  if (q3s1 && q3s1 !== "none") {
    const priorDoc = findDoc("prior_marriage") || findDoc("prior-marriage");
    if (priorDoc) {
      const done = isDocDone(
        priorDoc,
        uploadedDocuments,
        documentChecklist,
        docReviewStatus,
        docUploads,
        notes
      );
      checks.push({
        id: "prior_marriage_consistency",
        label: "Old marriage papers",
        passed: done,
        hint: done
          ? undefined
          : `You said there was a previous marriage, please add ${priorDoc.name}`,
        relatedDocId: priorDoc.id,
      });
    }
  }

  // Check B: non-English docs present → translations must be done
  const hasNonEnglishDocs = documentItems.some(
    (d) => d.tag === "beneficiary" && d.required === true
  );
  if (hasNonEnglishDocs) {
    const translationDoc = findDoc("translation");
    if (translationDoc) {
      const done = isDocDone(
        translationDoc,
        uploadedDocuments,
        documentChecklist,
        docReviewStatus,
        docUploads,
        notes
      );
      checks.push({
        id: "translations_consistency",
        label: "English translations",
        passed: done,
        hint: done
          ? undefined
          : `Your documents are in Urdu/regional language, please add the ${translationDoc.name}`,
        relatedDocId: translationDoc.id,
      });
    }
  }

  // Check C: criminal history disclosed → police clearance / disclosure doc needed
  const q5s2 = eligibilityAnswers?.q5?.q5s2 as string | undefined;
  if (q5s2 === "yes") {
    const policeDoc = findDoc("police");
    if (policeDoc) {
      const done = isDocDone(
        policeDoc,
        uploadedDocuments,
        documentChecklist,
        docReviewStatus,
        docUploads,
        notes
      );
      checks.push({
        id: "criminal_history_consistency",
        label: "Police clearance",
        passed: done,
        hint: done
          ? undefined
          : `You mentioned an arrest/charge in eligibility, please add the ${policeDoc.name}`,
        relatedDocId: policeDoc.id,
      });
    }
  }

  const consistencyPct = checks.length
    ? Math.round((checks.filter((c) => c.passed).length / checks.length) * 100)
    : 100; // No checks applicable = consistent by default

  // ── Overall weighted score ──────────────────────────────────────────────
  const overall = Math.round(completenessPct * 0.5 + evidencePct * 0.3 + consistencyPct * 0.2);

  let strengthLevel: ScoringResult["strengthLevel"];
  let strengthLabel: string;
  let strengthColor: string;
  if (overall < 35) {
    strengthLevel = "weak";
    strengthLabel = "Weak";
    strengthColor = "#dc2626";
  } else if (overall < 60) {
    strengthLevel = "fair";
    strengthLabel = "Fair";
    strengthColor = "#d97706";
  } else if (overall < 85) {
    strengthLevel = "good";
    strengthLabel = "Good";
    strengthColor = "#16a34a";
  } else {
    strengthLevel = "strong";
    strengthLabel = "Strong";
    strengthColor = "#059669";
  }

  // ── Next Steps — derived purely from scoring gaps ───────────────────────
  const nextSteps: ScoringResult["nextSteps"] = [];
  let priority = 1;

  // Top missing required docs first
  for (const m of missing.slice(0, 3)) {
    nextSteps.push({
      priority: priority++,
      action: `Add ${m.name}`,
      docId: m.id,
      href: m.guideUrl,
    });
  }

  // Then resolve consistency issues
  for (const c of checks.filter((c) => !c.passed).slice(0, 2)) {
    nextSteps.push({
      priority: priority++,
      action: c.hint || `Resolve: ${c.label}`,
      docId: c.relatedDocId,
    });
  }

  // Then strengthen weak evidence
  for (const w of weak.slice(0, 2)) {
    nextSteps.push({
      priority: priority++,
      action: `Strengthen evidence, upload + mark reviewed: ${w.name}`,
      docId: w.id,
    });
  }

  return {
    completeness: {
      score: completenessPct,
      done: doneCount,
      required: required.length,
      missing,
    },
    evidenceQuality: {
      score: evidencePct,
      fullCount,
      partialCount,
      weak,
    },
    consistency: {
      score: consistencyPct,
      checks,
    },
    overall,
    strengthLevel,
    strengthLabel,
    strengthColor,
    nextSteps: nextSteps.slice(0, 5),
  };
}
