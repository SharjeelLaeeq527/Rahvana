// components/FileQualityPreCheck.tsx
//
// Pre-flight check for documents the user has uploaded to Rahvana's vault
// BEFORE they re-upload to the USCIS online portal at step_1_8.
//
// USCIS online portal limits (myaccount.uscis.gov):
//   - Max file size: 12 MB per file
//   - Accepted formats: PDF, JPG, JPEG, TIF, TIFF
//
// Reads vault documents and surfaces:
//   - Green chip when everything passes
//   - Red list of files that fail size or format
//   - The compressed version is checked when present (USCIS receives compressed)
//
// Pure additive UI. Does not modify vault state.

import React, { useMemo } from "react";
import { FileCheck, FileWarning, AlertCircle } from "lucide-react";
import type { UploadedDocument } from "@/lib/document-vault/types";
import { DOCUMENTS_BY_KEY } from "@/lib/document-vault/document-definitions";
import { USCIS_PORTAL_FILE_LIMITS } from "@/lib/case-strength";

interface FileQualityPreCheckProps {
  uploadedDocuments: UploadedDocument[];
}

interface QualityIssue {
  docId: string;
  filename: string;
  savedFilename: string;
  docName: string;
  sizeMb: number;
  extension: string;
  reasons: string[];
}

const MAX_SIZE_MB = USCIS_PORTAL_FILE_LIMITS.max_file_size_mb;
const ACCEPTED_EXTENSIONS = USCIS_PORTAL_FILE_LIMITS.accepted_extensions as readonly string[];

function getExtension(filename: string): string {
  const i = filename.lastIndexOf(".");
  return i >= 0 ? filename.slice(i + 1).toLowerCase() : "";
}

function findDocName(documentDefId: string): string {
  const def = Object.values(DOCUMENTS_BY_KEY).find((d) => d.id === documentDefId);
  return def?.name ?? "Document";
}

export function FileQualityPreCheck({ uploadedDocuments }: FileQualityPreCheckProps) {
  const { issues, total } = useMemo(() => {
    const issuesList: QualityIssue[] = [];
    for (const doc of uploadedDocuments) {
      // USCIS receives the compressed file when one exists
      const filename = doc.compressedFilename ?? doc.originalFilename;
      const savedFilename = doc.originalFilename || doc.standardizedFilename || filename;
      const sizeBytes = doc.hasCompressedVersion
        ? (doc.compressedFileSize ?? doc.fileSize)
        : doc.fileSize;
      const sizeMb = sizeBytes / (1024 * 1024);
      const ext = getExtension(filename);

      const reasons: string[] = [];
      if (sizeMb > MAX_SIZE_MB) {
        reasons.push(
          `File is ${sizeMb.toFixed(1)} MB, exceeds USCIS portal's ${MAX_SIZE_MB} MB per-file limit.`
        );
      }
      if (!ext || !ACCEPTED_EXTENSIONS.includes(ext)) {
        reasons.push(
          `Format ".${ext || "(none)"}" is not accepted. USCIS portal accepts: ${ACCEPTED_EXTENSIONS.map((e) => "." + e).join(", ")}.`
        );
      }

      if (reasons.length > 0) {
        issuesList.push({
          docId: doc.id,
          filename,
          savedFilename,
          docName: findDocName(doc.documentDefId),
          sizeMb,
          extension: ext,
          reasons,
        });
      }
    }
    return { issues: issuesList, total: uploadedDocuments.length };
  }, [uploadedDocuments]);

  // Don't render the panel at all if there are no documents in the vault yet —
  // the user hasn't started gathering. Otherwise always show, so users get
  // clear confirmation when everything passes.
  if (total === 0) return null;

  const allPass = issues.length === 0;

  return (
    <div className="mt-[12px]" role="region" aria-label="USCIS portal upload pre-check">
      <div
        className="rounded-[12px] border-[1.5px] p-4 sm:p-5"
        style={{ background: "#fafaf9", borderColor: "#e7e5e4" }}
      >
        {/* Header */}
        <div className="flex flex-col gap-2 mb-3">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0"
              style={{
                background: allPass ? "#ecfdf5" : "#fef2f2",
                border: `1px solid ${allPass ? "#a7f3d0" : "#fecaca"}`,
              }}
            >
              {allPass ? (
                <FileCheck size={18} color="#065f46" />
              ) : (
                <FileWarning size={18} color="#991b1b" />
              )}
            </div>
            <h3 className="text-[14px] sm:text-[15px] font-bold text-[#1c1917] leading-snug truncate">
              USCIS portal upload pre-check
            </h3>
          </div>
          <p className="text-[12px] text-[#57534e] leading-relaxed w-full">
            We checked the {total} document{total === 1 ? "" : "s"} in your vault against the
            USCIS online portal limits ({MAX_SIZE_MB} MB max, formats:{" "}
            {ACCEPTED_EXTENSIONS.map((e) => "." + e).join(", ")}).
          </p>
        </div>

        {/* Result */}
        {allPass ? (
          <div
            className="rounded-[10px] border p-3 flex flex-col gap-1.5"
            style={{ background: "#ecfdf5", borderColor: "#a7f3d0" }}
          >
            <div className="flex items-center gap-2">
              <FileCheck size={16} color="#065f46" className="shrink-0" />
              <h5 className="text-[12.5px] font-semibold leading-snug" style={{ color: "#065f46" }}>
                All {total} document{total === 1 ? "" : "s"} pass the USCIS portal pre-check
              </h5>
            </div>
            <p className="text-[12px] leading-relaxed w-full" style={{ color: "#065f46" }}>
              Your vault documents are within the USCIS portal size and format limits. You can
              proceed to upload them through the USCIS online portal.
            </p>
          </div>
        ) : (
          <div
            className="rounded-[10px] border p-3"
            style={{ background: "#fef2f2", borderColor: "#fecaca" }}
          >
            <div className="flex flex-col gap-1.5 mb-3">
              <div className="flex items-center gap-2">
                <AlertCircle size={16} color="#991b1b" className="shrink-0" />
                <h5
                  className="text-[12.5px] font-semibold leading-snug"
                  style={{ color: "#991b1b" }}
                >
                  {issues.length} document{issues.length === 1 ? "" : "s"} need attention before
                  USCIS upload
                </h5>
              </div>
              <p className="text-[12px] leading-relaxed w-full" style={{ color: "#7f1d1d" }}>
                Fix each item below before attempting to upload to USCIS, the portal will reject
                these.
              </p>
            </div>
            <ul className="flex flex-col gap-2 mt-2">
              {issues.map((iss) => (
                <li
                  key={iss.docId}
                  className="rounded-[8px] border p-2.5"
                  style={{ background: "white", borderColor: "#fecaca" }}
                >
                  <div className="flex items-center justify-between gap-3 mb-1">
                    <span className="text-[12.5px] font-semibold text-[#7f1d1d] truncate">
                      {iss.docName}
                    </span>
                    <span className="text-[11px] text-[#991b1b] whitespace-nowrap">
                      {iss.sizeMb.toFixed(1)} MB · .{iss.extension || "?"}
                    </span>
                  </div>
                  <p
                    title={iss.savedFilename}
                    className="text-[11px] text-[#78716c] mb-1.5 italic line-clamp-2 break-all cursor-help"
                  >
                    {iss.savedFilename}
                  </p>
                  <ul
                    className="text-[11.5px] leading-relaxed list-disc pl-5"
                    style={{ color: "#7f1d1d" }}
                  >
                    {iss.reasons.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </div>
        )}

        <p className="text-[10.5px] text-[#78716c] mt-3 leading-relaxed italic">
          Source: USCIS online filing portal, file requirements published at myaccount.uscis.gov.
          Pre-check only, final acceptance is determined by USCIS at upload time.
        </p>
      </div>
    </div>
  );
}
