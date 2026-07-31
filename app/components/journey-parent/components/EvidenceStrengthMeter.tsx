// components/EvidenceStrengthMeter.tsx
//
// Document gathering progress advisor for step_1_2.
//
// Reads the actual document_items defined in ir-1.json for step_1_2 and
// determines completion status by checking ALL signals the existing UI uses:
//   - documentChecklist[doc.name]              (manually marked)
//   - metadata.docReviewStatus[doc.id]         ("reviewed")
//   - docUploads[doc.name]                     (legacy attachment)
//   - notes[doc.name]                          (notes recorded)
//   - vault uploadedDocuments matched via mapDocumentNameToId(doc.name)
//
// Surfaces ONLY pending items (the user explicitly asked: don't show the full
// checklist — only show what is still missing). Groups pending items by their
// existing `group` field. When everything is done, surfaces a single green
// confirmation card.
//
// No external categorization is imposed. Every group, every "required" flag,
// and every document shown here comes from the JSON the roadmap author defined.

import React, { useMemo } from "react";
import { CheckCircle2, AlertCircle, Circle } from "lucide-react";
import type { UploadedDocument } from "@/lib/document-vault/types";
import { mapDocumentNameToId } from "@/lib/document-vault/journey-mapping";

export interface DocumentItem {
  id: string;
  name: string;
  subtitle?: string;
  group?: string;
  required?: boolean;
  tag?: string;
}

interface EvidenceStrengthMeterProps {
  documentItems: DocumentItem[] | undefined | null;
  uploadedDocuments: UploadedDocument[];
  documentChecklist: Record<string, boolean> | undefined;
  docReviewStatus: Record<string, string> | undefined;
  docUploads: Record<string, unknown> | undefined;
  notes: Record<string, string> | undefined;
}

interface GroupSummary {
  label: string;
  pending: DocumentItem[];
}

function isDocumentDone(
  doc: DocumentItem,
  uploadedDocuments: UploadedDocument[],
  documentChecklist: Record<string, boolean> | undefined,
  docReviewStatus: Record<string, string> | undefined,
  docUploads: Record<string, unknown> | undefined,
  notes: Record<string, string> | undefined
): boolean {
  // Manual review / checklist signals (same logic existing rendering uses)
  if (docReviewStatus?.[doc.id] === "reviewed") return true;
  if (documentChecklist?.[doc.name] === true) return true;
  if (docUploads?.[doc.name] !== undefined && docUploads?.[doc.name] !== null) return true;
  if (notes?.[doc.name]) return true;

  // Vault linkage: map the doc name to a vault DocumentDefinition id and
  // check whether any uploaded document references that id.
  const vaultDefId = mapDocumentNameToId(doc.name);
  if (vaultDefId && uploadedDocuments.some((u) => u.documentDefId === vaultDefId)) {
    return true;
  }

  return false;
}

export function EvidenceStrengthMeter({
  documentItems,
  uploadedDocuments,
  documentChecklist,
  docReviewStatus,
  docUploads,
  notes,
}: EvidenceStrengthMeterProps) {
  if (!documentItems || documentItems.length === 0) return null;

  // Partition into pending vs done while preserving group order
  const { pendingGroups, totalRequired, requiredDone, totalDocs, doneDocs } = useMemo(() => {
    let totalRequired = 0;
    let requiredDone = 0;
    let totalDocs = 0;
    let doneDocs = 0;

    const groupOrder: string[] = [];
    const byGroup = new Map<string, DocumentItem[]>();

    for (const item of documentItems) {
      totalDocs++;
      if (item.required) totalRequired++;
      const done = isDocumentDone(
        item,
        uploadedDocuments,
        documentChecklist,
        docReviewStatus,
        docUploads,
        notes
      );
      if (done) {
        doneDocs++;
        if (item.required) requiredDone++;
        continue; // skip done items — user only wants to see pending
      }
      const g = item.group ?? "Other";
      if (!byGroup.has(g)) {
        byGroup.set(g, []);
        groupOrder.push(g);
      }
      byGroup.get(g)!.push(item);
    }

    const pendingGroups: GroupSummary[] = groupOrder.map((label) => ({
      label,
      pending: byGroup.get(label)!,
    }));

    return { pendingGroups, totalRequired, requiredDone, totalDocs, doneDocs };
  }, [documentItems, uploadedDocuments, documentChecklist, docReviewStatus, docUploads, notes]);

  const requiredPending = totalRequired - requiredDone;
  const allDone = doneDocs === totalDocs && totalDocs > 0;
  const allRequiredDone = totalRequired > 0 && requiredPending === 0;

  // Everything done — single green confirmation card
  if (allDone) {
    return (
      <div className="max-w-3xl w-full mx-auto px-0 sm:px-2 md:px-4 pb-4 sm:pb-6 md:pb-8">
        <div
          className="rounded-2xl border-[1.5px] p-4 sm:p-5 flex items-start gap-3"
          style={{ background: "#ecfdf5", borderColor: "#a7f3d0" }}
        >
          <CheckCircle2 size={20} color="#065f46" className="shrink-0 mt-0.5" />
          <div className="min-w-0">
            <h3 className="text-[15px] font-bold text-[#065f46] leading-snug">
              All {totalDocs} documents marked done
            </h3>
            <p className="text-[12px] text-[#065f46] mt-1 leading-relaxed">
              Every document in this step's checklist is complete. You can proceed to the filing
              steps with confidence.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="max-w-3xl w-full mx-auto px-0 sm:px-2 md:px-4 pb-4 sm:pb-6 md:pb-8"
      role="region"
      aria-label="Pending documents"
    >
      <div
        className="rounded-2xl border-[1.5px] p-4 sm:p-6"
        style={{ background: "#fafaf9", borderColor: "#e7e5e4" }}
      >
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <div
            className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0"
            style={{
              background: allRequiredDone ? "#ecfdf5" : "#fffbeb",
              border: `1px solid ${allRequiredDone ? "#a7f3d0" : "#fde68a"}`,
            }}
          >
            <AlertCircle size={18} color={allRequiredDone ? "#065f46" : "#92400e"} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-[15px] sm:text-[16px] font-bold text-[#1c1917] leading-snug">
              Documents still pending
            </h3>
            <p className="text-[12px] sm:text-[13px] text-[#57534e] mt-0.5 leading-relaxed">
              {totalRequired > 0 ? (
                <>
                  {requiredDone} of {totalRequired} required documents done
                  {requiredPending > 0 && (
                    <>
                      {" "}, <strong>{requiredPending} required</strong> still pending.
                    </>
                  )}
                </>
              ) : (
                <>
                  {doneDocs} of {totalDocs} documents done, {totalDocs - doneDocs} still pending.
                </>
              )}
            </p>
          </div>
          {totalRequired > 0 && (
            <div
              className="text-[12px] font-bold whitespace-nowrap px-2 py-0.5 rounded shrink-0"
              style={{
                background: allRequiredDone ? "#dcfce7" : "#fef3c7",
                color: allRequiredDone ? "#065f46" : "#92400e",
              }}
            >
              {requiredDone} / {totalRequired}
            </div>
          )}
        </div>

        {/* Required progress bar */}
        {totalRequired > 0 && (
          <div
            className="w-full h-[6px] rounded-full overflow-hidden mb-4"
            style={{ background: "#f1f5f9" }}
          >
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${(requiredDone / totalRequired) * 100}%`,
                background: allRequiredDone ? "#16a34a" : "#f59e0b",
              }}
            />
          </div>
        )}

        {/* Pending grouped lists */}
        <div className="flex flex-col gap-2.5 mb-3">
          {pendingGroups.map((g) => (
            <div
              key={g.label}
              className="rounded-[10px] border bg-white p-3"
              style={{ borderColor: "#e7e5e4" }}
            >
              <h4 className="text-[12.5px] sm:text-[13px] font-semibold text-[#1c1917] leading-tight mb-2">
                {g.label}
                <span className="ml-2 text-[11px] font-bold text-[#dc2626]">
                  ({g.pending.length} pending)
                </span>
              </h4>
              <ul className="flex flex-col gap-1.5">
                {g.pending.map((doc) => (
                  <li key={doc.id} className="flex items-start gap-2 text-[12.5px]">
                    <Circle size={13} color="#a8a29e" className="shrink-0 mt-1" />
                    <div className="min-w-0">
                      <span className="text-[#1c1917] font-medium">
                        {doc.name}
                        {doc.required && (
                          <span className="ml-1 text-[11px] font-bold text-[#dc2626]">
                            *required
                          </span>
                        )}
                      </span>
                      {doc.subtitle && (
                        <span className="block text-[11.5px] text-[#78716c] mt-0.5 leading-snug">
                          {doc.subtitle}
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="text-[10.5px] text-[#78716c] leading-relaxed italic">
          Shows only documents still pending. Marked complete when you upload via the document
          vault, mark as reviewed, or attach a file. Advisory only, not legal advice.
        </p>
      </div>
    </div>
  );
}
