"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import { DocumentDefinition, DocumentRole } from "@/lib/document-vault/types";
import { useLanguage } from "@/app/context/LanguageContext";
import { useDocumentVaultStore } from "@/lib/document-vault/store";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Upload, X, Lock, ScanLine } from "lucide-react";
import { toast } from "sonner";
import { getOcrConfig, getOcrDocTypeMeta } from "@/lib/document-ocr/registry";
import { resizeImageIfNeeded } from "@/lib/document-ocr/clientImage";
import { crossCheckFields } from "@/lib/document-ocr/crossCheck";
import { useUserProfile } from "@/app/context/UserProfileContext";

interface DocumentUploadModalProps {
  open: boolean;
  onClose: () => void;
  documentDef: DocumentDefinition;
  onUploadComplete: () => void;
}

/** Read a dot-path value off the in-memory profile, as a trimmed string ("" if absent). */
function readProfilePath(obj: unknown, path: string): string {
  let cur: unknown = obj;
  for (const k of path.split(".")) {
    if (cur && typeof cur === "object") cur = (cur as Record<string, unknown>)[k];
    else return "";
  }
  return cur == null ? "" : String(cur).trim();
}

export function DocumentUploadModal({
  open,
  onClose,
  documentDef,
  onUploadComplete,
}: DocumentUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [role, setRole] = useState<DocumentRole>(documentDef.roles[0]);
  const [expirationDate, setExpirationDate] = useState("");
  const [notes, setNotes] = useState("");
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { config, replaceDocumentId, deleteDocument } = useDocumentVaultStore();
  const { t } = useLanguage();
  const { refreshProfile, profile } = useUserProfile();

  // ── Inline OCR auto-fill (passport, etc.) ──
  // If this document type supports OCR, after a successful upload we read the
  // same file and offer to auto-fill the user's profile. Nothing is saved until
  // the user confirms. OCR is a bonus — failure never blocks the upload.
  const ocrConfig = getOcrConfig(documentDef.id);
  // Endpoint + field set come from the docType (passport, marriage, …) so this one
  // modal serves every OCR-eligible document without per-type branching here.
  const ocrMeta = ocrConfig ? getOcrDocTypeMeta(ocrConfig.docType) : null;
  const OCR_FIELD_ORDER = ocrMeta?.fields ?? [];
  const [ocrPhase, setOcrPhase] = useState<"idle" | "reading" | "confirm">("idle");
  const [ocrFields, setOcrFields] = useState<Record<string, string>>({});
  const [ocrWarnings, setOcrWarnings] = useState<string[]>([]);
  const [ocrSaving, setOcrSaving] = useState(false);

  // ── Two-source check (journey step answer) ──
  // For a prior-marriage proof (divorce decree / death cert), the journey earlier
  // asked the beneficiary whether they were previously married. We fetch that answer
  // so we can flag a clash ("you said this is your first marriage, but this document
  // shows a previous one") and, on save, overwrite that earlier answer.
  // null = not yet known / not applicable; "yes" | "no" | "" once fetched.
  const [journeyPriorMarriage, setJourneyPriorMarriage] = useState<string | null>(null);
  const isDivorceDoc = ocrConfig?.docType === "divorce";

  useEffect(() => {
    if (ocrPhase !== "confirm" || !isDivorceDoc) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/journey/marriage-check");
        const json = await res.json().catch(() => null);
        if (!cancelled) setJourneyPriorMarriage(json?.priorMarriageBeneficiary ?? "");
      } catch {
        if (!cancelled) setJourneyPriorMarriage("");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ocrPhase, isDivorceDoc]);

  // A clash exists when this document shows a previous marriage but the journey step
  // explicitly recorded "no" prior marriage. (Empty = unanswered → we don't nag.)
  const hasPriorMarriageData =
    isDivorceDoc &&
    Boolean(
      ocrFields["relationship.priorMarriage.spouseName"] ||
        ocrFields["relationship.priorMarriage.dateMarriageEnded"] ||
        ocrFields["relationship.priorMarriage.howEnded"]
    );
  const journeyMarriageClash =
    isDivorceDoc && hasPriorMarriageData && journeyPriorMarriage === "no";

  const runOcr = async (file: File) => {
    if (!ocrConfig) return;
    setOcrPhase("reading");
    try {
      const prepared = await resizeImageIfNeeded(file);
      const formData = new FormData();
      formData.append("file", prepared, prepared.name);
      const res = await fetch(ocrMeta?.endpoint ?? "/api/documents/extract-passport", {
        method: "POST",
        body: formData,
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json) {
        toast.info("Uploaded. We couldn't auto-read this document — you can fill details manually.");
        handleClose();
        return;
      }
      setOcrFields(json.fields || {});
      setOcrWarnings(json.warnings || []);
      setOcrPhase("confirm");
    } catch {
      toast.info("Uploaded. We couldn't auto-read this document — you can fill details manually.");
      handleClose();
    }
  };

  const updateOcrField = (key: string, value: string) => {
    setOcrFields((prev) => ({ ...prev, [key]: value }));
  };

  // ── Mismatch detection ──
  // Compare what we just read against what's already on the profile, so the user
  // can resolve conflicts (e.g. passport DOB ≠ saved DOB) BEFORE overwriting. Reads
  // the in-memory (decrypted) profile — no extra fetch. Re-runs live as the user
  // edits a field, so the banner clears the moment they reconcile a value.
  const crossCheck = useMemo(() => {
    if (ocrPhase !== "confirm" || !profile) return null;
    const stored: Record<string, string> = {};
    for (const { key } of OCR_FIELD_ORDER) {
      // Non-self docs store under that person's subsection (sponsor.* / beneficiary.*).
      const path =
        ocrConfig && ocrConfig.target !== "self" ? `${ocrConfig.target}.${key}` : key;
      const v = readProfilePath(profile, path);
      if (v) stored[key] = v;
    }
    return crossCheckFields(ocrFields, stored, OCR_FIELD_ORDER);
    // OCR_FIELD_ORDER is stable for a given docType; the real drivers are below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ocrPhase, profile, ocrFields, ocrConfig?.target]);

  const mismatchKeys = useMemo(
    () => new Set((crossCheck?.mismatches ?? []).map((m) => m.key)),
    [crossCheck]
  );

  const handleSaveOcr = async () => {
    setOcrSaving(true);
    try {
      const res = await fetch("/api/profile/merge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fields: ocrFields, target: ocrConfig?.target }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        toast.error(json?.error || "Could not save details to your profile.");
        return;
      }
      // For a prior-marriage proof, also OVERWRITE the earlier journey step answer
      // ("first marriage?") so the two sources stay in sync. Best-effort — never
      // blocks the save.
      if (isDivorceDoc && hasPriorMarriageData) {
        try {
          await fetch("/api/journey/marriage-check", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              howEnded: ocrFields["relationship.priorMarriage.howEnded"] || "divorce",
            }),
          });
        } catch {
          // Non-fatal: the profile save already succeeded.
        }
      }

      await refreshProfile();
      toast.success("Details saved to your profile.");
      handleClose();
    } catch {
      toast.error("Something went wrong while saving.");
    } finally {
      setOcrSaving(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error(t("documentVaultPage.components.uploadModal.fileSizeError"));
        return;
      }

      // Validate file type
      const allowedTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png", "image/gif"];
      if (!allowedTypes.includes(file.type)) {
        toast.error(t("documentVaultPage.components.uploadModal.fileTypeError"));
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error(t("documentVaultPage.components.uploadModal.fileSizeError"));
        return;
      }

      // Validate file type
      const allowedTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png", "image/gif"];
      if (!allowedTypes.includes(file.type)) {
        toast.error(t("documentVaultPage.components.uploadModal.fileTypeError"));
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    if (!config) {
      toast.error("Document Vault is not configured. Please refresh the page and try again.");
      console.error("[DocumentUploadModal] Upload blocked: config is null");
      return;
    }

    console.log("[DocumentUploadModal] Starting upload:", {
      file: selectedFile.name,
      documentDefId: documentDef.id,
      caseId: config.caseId,
      role,
    });

    setUploading(true);
    toast.loading(t("documentVaultPage.components.uploadModal.uploading"), {
      id: "upload-progress",
    });

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("documentDefId", documentDef.id);
      formData.append("role", role);
      formData.append("caseId", config.caseId || "CASE");

      // Determine person name based on role
      let personName = "Unknown";
      if (role === "PETITIONER" && config.petitionerName) {
        personName = config.petitionerName;
      } else if (role === "BENEFICIARY" && config.beneficiaryName) {
        personName = config.beneficiaryName;
      } else if (role === "JOINT_SPONSOR" && config.jointSponsorName) {
        personName = config.jointSponsorName;
      }
      formData.append("personName", personName);

      if (expirationDate) {
        formData.append("expirationDate", expirationDate);
      }
      if (notes) {
        formData.append("notes", notes);
      }

      const response = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t("documentVaultPage.components.uploadModal.uploadFailed"));
      }

      toast.success(
        replaceDocumentId
          ? "Document replaced successfully"
          : t("documentVaultPage.components.uploadModal.uploadSuccess"),
        {
          id: "upload-progress",
        }
      );

      // If this was a replacement, delete the old document
      if (replaceDocumentId) {
        try {
          console.log("[DocumentUploadModal] Deleting old version:", replaceDocumentId);
          await deleteDocument(replaceDocumentId);
        } catch (delError) {
          console.error("Failed to delete replaced document:", delError);
          // Don't fail the whole upload if just the deletion fails,
          // but maybe warn the user
        }
      }

      // Call completion handler to refresh the list
      await onUploadComplete();

      // OCR-eligible doc? Keep the modal open and offer to auto-fill the profile
      // from the same file. Otherwise close as before.
      if (ocrConfig && selectedFile) {
        await runOcr(selectedFile);
      } else {
        handleClose();
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : t("documentVaultPage.components.uploadModal.uploadFailed"),
        {
          id: "upload-progress",
        }
      );
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setRole(documentDef.roles[0]);
    setExpirationDate("");
    setNotes("");
    setOcrPhase("idle");
    setOcrFields({});
    setOcrWarnings([]);
    setJourneyPriorMarriage(null);
    onClose();
  };

  const needsExpirationDate =
    documentDef.validityType === "user_set" || documentDef.validityType === "policy_variable";

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className={`${
          ocrPhase === "confirm" ? "max-w-4xl" : "max-w-2xl"
        } w-[95vw] sm:w-full p-0 overflow-hidden rounded-2xl border-none shadow-2xl`}
      >
        <div className="max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader className="relative pb-4">
            <DialogTitle className="text-lg sm:text-xl pr-8 font-bold text-[#0c1b33]">
              {t("documentVaultPage.components.uploadModal.titlePrefix")}
              {t(`documentVaultPage.documents.${documentDef.id}.name`) !==
              `documentVaultPage.documents.${documentDef.id}.name`
                ? t(`documentVaultPage.documents.${documentDef.id}.name`)
                : documentDef.name}
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full absolute top-0 right-0 hover:bg-slate-100 transition-colors"
              onClick={handleClose}
            >
              <X className="w-4 h-4 text-slate-500" />
              <span className="sr-only">{t("documentVaultPage.components.uploadModal.close")}</span>
            </Button>
          </DialogHeader>

          {/* Config not ready warning */}
          {!config && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3 text-sm text-amber-800 shadow-sm">
              <span className="text-lg leading-none mt-0.5">⏳</span>
              <span className="leading-relaxed">
                Document Vault is initializing&hellip; please wait a moment before uploading.
              </span>
            </div>
          )}

          {/* ── Inline OCR auto-fill panel (shown after upload for OCR docs) ── */}
          {ocrPhase !== "idle" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-[#0c1b33]">
                <div className="w-9 h-9 rounded-xl bg-[#e8f1fb] text-brand flex items-center justify-center">
                  <ScanLine className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-sm">
                    {ocrPhase === "reading"
                      ? "Reading your document…"
                      : "Confirm the details we read"}
                  </p>
                  <p className="text-xs text-[#6b8097]">
                    {ocrConfig?.target === "beneficiary"
                      ? "These will be saved to your spouse's (beneficiary) details."
                      : "These will be saved to your profile."}
                  </p>
                </div>
              </div>

              {ocrPhase === "reading" && (
                <div className="flex items-center justify-center gap-3 py-10 text-[#6b8097]">
                  <div className="w-5 h-5 border-2 border-brand/30 border-t-brand rounded-full animate-spin" />
                  <span className="text-sm font-medium">Extracting fields…</span>
                </div>
              )}

              {ocrPhase === "confirm" && (
                <>
                  {ocrWarnings.length > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
                      <p className="font-semibold mb-1">Please double-check these</p>
                      <ul className="list-disc pl-4 space-y-1">
                        {ocrWarnings.map((w, i) => (
                          <li key={i}>{w}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {journeyMarriageClash && (
                    <div className="bg-red-50 border border-red-300 rounded-xl p-4 text-sm text-red-800">
                      <p className="font-semibold mb-1">⚠️ Please review — this may not match an earlier answer</p>
                      <p>
                        This document suggests a <strong>previous marriage</strong>, but earlier in
                        your journey you indicated this is your <strong>first marriage</strong>. If
                        the document is correct, click <strong>Confirm &amp; Save</strong> and
                        we&apos;ll update that earlier answer for you. If not, edit the fields below
                        or skip.
                      </p>
                    </div>
                  )}

                  {crossCheck && crossCheck.mismatches.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-800">
                      <p className="font-semibold mb-1">
                        These don&apos;t match what&apos;s already saved
                      </p>
                      <ul className="list-disc pl-4 space-y-1">
                        {crossCheck.mismatches.map((m) => (
                          <li key={m.key}>
                            <strong>{m.label}:</strong> this document says &ldquo;{m.newValue}
                            &rdquo;, but your saved value is &ldquo;{m.oldValue}&rdquo;. Edit the
                            field below to the correct one before saving.
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-3 items-start">
                    {OCR_FIELD_ORDER.map(({ key, label }) => {
                      const isMismatch = mismatchKeys.has(key);
                      return (
                        <div key={key} className="flex flex-col">
                          {/* Reserve two lines for every label so single- and two-line
                              labels keep all the input boxes aligned across the row. */}
                          <Label
                            htmlFor={`ocr-${key}`}
                            className="flex min-h-[2.5rem] items-start text-sm leading-snug"
                          >
                            {label}
                          </Label>
                          <Input
                            id={`ocr-${key}`}
                            value={ocrFields[key] ?? ""}
                            onChange={(e) => updateOcrField(key, e.target.value)}
                            placeholder={`Enter ${label.toLowerCase()}`}
                            className={
                              isMismatch ? "border-red-400 focus-visible:ring-red-400" : undefined
                            }
                          />
                          {/* Mismatch note sits BELOW the input so it never pushes the
                              box out of alignment with its neighbours. */}
                          {isMismatch && (
                            <span className="mt-1 text-xs text-red-600">
                              Doesn&apos;t match your saved value
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex gap-3 pt-2 pb-2">
                    <Button
                      variant="outline"
                      onClick={handleClose}
                      disabled={ocrSaving}
                      className="flex-1 rounded-xl border-[#d0e4f7] text-[#6b8097] hover:bg-slate-50 font-semibold"
                    >
                      Skip
                    </Button>
                    <Button
                      onClick={handleSaveOcr}
                      disabled={ocrSaving}
                      className="flex-1 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold"
                    >
                      {ocrSaving ? "Saving…" : "Confirm & Save"}
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}

          <div className={`space-y-4 sm:space-y-6 ${ocrPhase !== "idle" ? "hidden" : ""}`}>
            {/* File upload area */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-[#3a4f63]">
                {t("documentVaultPage.components.uploadModal.selectFile")}
              </Label>
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`group border-2 border-dashed rounded-xl p-6 sm:p-10 text-center cursor-pointer transition-all duration-300 ${
                  isDragging
                    ? "border-brand bg-brand/10 shadow-md"
                    : "border-[#d0e4f7] hover:border-brand hover:bg-brand/5 bg-slate-50/50"
                }`}
              >
                {selectedFile ? (
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-brand/10 text-brand flex items-center justify-center">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-[#0c1b33] break-all">{selectedFile.name}</p>
                      <p className="text-xs text-brand/80">
                        ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 rounded-full ml-auto hover:bg-red-50 hover:text-red-500 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFile(null);
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-[#e8f1fb] text-brand flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                      <Upload className="w-6 h-6" />
                    </div>
                    <p className="font-bold text-[#0c1b33] mb-1">
                      Click to Upload or Drag and Drop
                    </p>
                    <p className="text-xs text-[#6b8097]">
                      {t("documentVaultPage.components.uploadModal.allowedTypes")}
                    </p>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.gif"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {/* Role selection */}
            {/* <div className="space-y-2">
              <Label className="text-sm font-semibold text-[#3a4f63]">
                {t("documentVaultPage.components.uploadModal.providedBy")}
              </Label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as DocumentRole)}
                className="w-full border border-[#d0e4f7] rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all outline-none"
              >
                {documentDef.roles.map((r) => (
                  <option key={r} value={r}>
                    {t(`documentVaultPage.roles.${r}`)}
                  </option>
                ))}
              </select>
            </div> */}

            {/* Expiration date (if needed) */}
            {needsExpirationDate && (
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-[#3a4f63]">
                  {t("documentVaultPage.components.uploadModal.expirationDate")}
                  {documentDef.validityType === "user_set" && (
                    <span className="text-red-500 ml-1">*</span>
                  )}
                </Label>
                <Input
                  type="date"
                  value={expirationDate}
                  onChange={(e) => setExpirationDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="rounded-lg border-[#d0e4f7] focus:ring-brand/20"
                />
                <p className="text-[11px] text-[#6b8097] italic">
                  {documentDef.validityType === "user_set"
                    ? t("documentVaultPage.components.uploadModal.expirationRequired")
                    : t("documentVaultPage.components.uploadModal.expirationOptional")}
                </p>
              </div>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-[#3a4f63]">
                {t("documentVaultPage.components.uploadModal.notes")}
              </Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t("documentVaultPage.components.uploadModal.notesPlaceholder")}
                rows={3}
                className="rounded-lg border-[#d0e4f7] focus:ring-brand/20 resize-none"
              />
            </div>

            {/* USCIS Naming Preview */}
            {selectedFile && config && (
              <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-5 space-y-4 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand" />
                  <p className="text-xs font-bold uppercase tracking-wider text-blue-900/60">
                    {t("documentVaultPage.components.uploadModal.namingPreview")}
                  </p>
                </div>

                {/* Display name */}
                <div className="grid grid-cols-1 gap-1">
                  <p className="text-[11px] font-bold text-blue-800/50 uppercase tracking-tight">
                    {t("documentVaultPage.components.uploadModal.displayName")}
                  </p>
                  <p className="text-sm font-bold text-[#0c1b33]">
                    {t(`documentVaultPage.documents.${documentDef.id}.name`) !==
                    `documentVaultPage.documents.${documentDef.id}.name`
                      ? t(`documentVaultPage.documents.${documentDef.id}.name`)
                      : documentDef.name}{" "}
                    -{" "}
                    {role === "PETITIONER"
                      ? config.petitionerName ||
                        t("documentVaultPage.components.uploadModal.petitioner")
                      : role === "BENEFICIARY"
                        ? config.beneficiaryName ||
                          t("documentVaultPage.components.uploadModal.beneficiary")
                        : config.jointSponsorName ||
                          t("documentVaultPage.components.uploadModal.jointSponsor")}
                  </p>
                </div>

                {/* Standardized filename */}
                <div className="grid grid-cols-1 gap-2">
                  <p className="text-[11px] font-bold text-blue-800/50 uppercase tracking-tight">
                    {t("documentVaultPage.components.uploadModal.standardizedFilename")}
                  </p>
                  <div className="bg-white/80 border border-blue-100 p-3 rounded-lg shadow-inner group">
                    <code className="text-xs text-blue-900 font-mono break-all leading-relaxed">
                      {`${role}_${documentDef.key}_${new Date().toISOString().split("T")[0]}_v1.${selectedFile.name
                        .split(".")
                        .pop()
                        ?.toLowerCase()}`}
                    </code>
                  </div>
                </div>

                {/* File info */}
                <div className="flex items-center justify-between text-[11px] font-bold text-blue-800/60 uppercase pt-2 border-t border-blue-100/50">
                  <span>
                    {t("documentVaultPage.components.uploadModal.sizePrefix")}
                    <span className="text-blue-900 ml-1">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                  </span>
                  <span>
                    {t("documentVaultPage.components.uploadModal.typePrefix")}
                    <span className="text-blue-900 ml-1">
                      {selectedFile.name.split(".").pop()?.toUpperCase()}
                    </span>
                  </span>
                </div>

                {(!config.caseId || !config.petitionerName || !config.beneficiaryName) && (
                  <div className="bg-red-50 border border-red-100 rounded-lg p-3 flex items-start gap-2 shadow-sm">
                    <span className="text-xs">⚠️</span>
                    <p className="text-[11px] text-red-800 leading-relaxed font-medium">
                      {t("documentVaultPage.components.uploadModal.warning")}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Security Guarantee */}
            <div className="flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-50 border border-[#d0e4f7]/40 rounded-xl text-[#3a4f63] text-xs font-semibold shadow-sm">
              <Lock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>{t("documentVaultPage.components.uploadModal.securityNotice")}</span>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 pb-2">
              <Button
                variant="outline"
                onClick={handleClose}
                className="flex-1 rounded-xl border-[#d0e4f7] text-[#6b8097] hover:bg-slate-50 transition-all font-semibold"
              >
                {t("documentVaultPage.components.uploadModal.cancel")}
              </Button>
              <Button
                onClick={handleUpload}
                disabled={
                  !selectedFile ||
                  uploading ||
                  !config ||
                  (needsExpirationDate &&
                    documentDef.validityType === "user_set" &&
                    !expirationDate)
                }
                className="flex-1 rounded-xl bg-primary hover:bg-primary/90 text-white shadow-lg shadow-brand/20 transition-all font-semibold disabled:bg-primary/70 disabled:text-white disabled:border-slate-300 disabled:shadow-none disabled:cursor-not-allowed"
              >
                {uploading ? (
                  <div className="flex items-center gap-2 text-white">
                    <div className="w-4 h-4 border-2 border-white border-t-white rounded-full animate-spin" />
                    {replaceDocumentId ? "Replacing..." : "Uploading..."}
                  </div>
                ) : !config ? (
                  "Initializing..."
                ) : replaceDocumentId ? (
                  "Replace Version"
                ) : (
                  "Upload Document"
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
