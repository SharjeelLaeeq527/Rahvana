/**
 * Civil-document analyzer for Chapter 2 (NVC / CEAC processing).
 *
 * Chapter 2 Step 2.4 stores its document checklist as
 * `tool_data.doc_list.groups[].items[]` — a different shape than Chapter 1's
 * flat `document_items[]`. This module reads that nested shape directly from
 * the roadmap JSON (the source of truth — never hardcode doc ids here) and
 * surfaces advisory issues across the three pillars:
 *
 *   - Completeness  → required civil docs not yet prepared
 *   - Consistency   → conditional docs that BECOME required given case signals
 *                     (e.g. a prior marriage means termination proof is needed)
 *   - Evidence qual → recommended items that strengthen the package
 *
 * No scoring. Pure function — same inputs always produce the same issues.
 *
 * Sourcing: required-document expectations follow travel.state.gov reciprocity
 * guidance and 9 FAM 504.4 (civil documents for immigrant visas). Conditional
 * prior-marriage termination requirement follows 9 FAM 504.4-4 / 8 CFR 204.2.
 */

import type { UploadedDocument } from "@/lib/document-vault/types";
import { mapDocumentNameToId, isDocUploadedInVault } from "@/lib/document-vault/journey-mapping";

export interface CivilDocItem {
  id: string;
  title: string;
  sub?: string;
  required?: boolean;
  tags?: string[];
}

export interface CivilDocGroup {
  id: string; // "required" | "conditional" | "recommended"
  label?: string;
  items?: CivilDocItem[];
}

export interface CivilDocIssue {
  level: "critical" | "warning" | "info";
  title: string;
  hint?: string;
  docId: string;
  /** When true, the item is addressed — shows checkmark in sidebar */
  resolved?: boolean;
}

export interface CivilDocsContext {
  /** metadata.civilDocsStatus — Record<docId, "reviewed" | ...> */
  civilDocsStatus: Record<string, string> | undefined;
  uploadedDocuments: UploadedDocument[];
  /** persisted eligibility-suite quest answers (for conditional triggers) */
  eligibilityAnswers:
    | Record<string, Record<string, string | string[]> | undefined>
    | null
    | undefined;
}

/** A civil doc is "done" when marked reviewed OR an upload exists in the vault. */
function isCivilDocDone(item: CivilDocItem, ctx: CivilDocsContext): boolean {
  if (ctx.civilDocsStatus?.[item.id] === "reviewed") return true;
  const vaultId = mapDocumentNameToId(item.title);
  if (vaultId && isDocUploadedInVault(item.title, vaultId, ctx.uploadedDocuments)) return true;
  return false;
}

/** Did either spouse have a prior marriage? Derived from the eligibility quest. */
function hadPriorMarriage(ctx: CivilDocsContext): boolean {
  const q3s1 = ctx.eligibilityAnswers?.q3?.q3s1;
  return q3s1 === "petitioner" || q3s1 === "beneficiary" || q3s1 === "both";
}

/**
 * Analyzes the civil-document checklist and returns advisory issues.
 * `groups` comes straight from step_2_4.tool_data.doc_list.groups.
 *
 * Regular docs that are uploaded/reviewed are skipped (not shown in sidebar).
 * Prior marriage conditional docs are always shown but marked as resolved
 * when uploaded, so users can confirm they've addressed them.
 */
export function analyzeCivilDocs(
  groups: CivilDocGroup[] | undefined | null,
  ctx: CivilDocsContext
): CivilDocIssue[] {
  if (!groups || groups.length === 0) return [];
  const issues: CivilDocIssue[] = [];

  for (const group of groups) {
    const items = group.items ?? [];
    for (const item of items) {
      const done = isCivilDocDone(item, ctx);

      // ── Required group / explicitly required items → completeness gap ──
      if (group.id === "required" || item.required === true) {
        // Skip docs that are already uploaded/reviewed
        if (done) continue;
        issues.push({
          level: "critical",
          title: `Missing: ${item.title}`,
          hint: item.sub,
          docId: item.id,
        });
        continue;
      }

      // ── Conditional items that BECOME required given a case signal ──
      if (group.id === "conditional") {
        const isPriorMarriageDoc = item.id === "prior-marriage" || item.id === "death-cert";
        if (isPriorMarriageDoc && hadPriorMarriage(ctx)) {
          // Check if any prior marriage termination doc is uploaded (combines both doc types)
          const anyPriorMarriageDocDone = items.some(
            (i) => (i.id === "prior-marriage" || i.id === "death-cert") && isCivilDocDone(i, ctx)
          );

          // Only push one finding for the first prior marriage doc item
          // to avoid showing "Required for your case" twice for the same requirement
          if (item.id === "prior-marriage") {
            issues.push({
              level: "critical",
              title: `Required for your case: Prior Marriage Termination Documents`,
              hint: anyPriorMarriageDocDone
                ? "Document uploaded — prior marriage termination proof is on file."
                : "You indicated a prior marriage during eligibility. NVC requires proof every prior marriage legally ended (final divorce decree, annulment, or death certificate) — with a certified English translation.",
              docId: item.id,
              resolved: anyPriorMarriageDocDone,
            });
          }
          // Skip death-cert as it's combined with prior-marriage above
        }
        // Other conditional docs (name change, missing-record evidence) have no
        // automatic trigger signal — left to the user, not flagged.
        continue;
      }

      // ── Recommended group → evidence-quality strengthener (advisory) ──
      if (group.id === "recommended") {
        // Skip recommended docs that are already uploaded
        if (done) continue;
        issues.push({
          level: "info",
          title: `Recommended: ${item.title}`,
          hint: item.sub,
          docId: item.id,
        });
      }
    }
  }

  return issues;
}
