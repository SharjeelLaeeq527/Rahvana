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
import { useToast } from "@/app/components/shared/ToastProvider";
import { Upload, X, Lock, ScanLine } from "lucide-react";
import { getOcrConfig, getOcrDocTypeMeta } from "@/lib/document-ocr/registry";
import { resizeImageIfNeeded } from "@/lib/document-ocr/clientImage";
import { crossCheckFields } from "@/lib/document-ocr/crossCheck";
import { useUserProfile } from "@/app/context/UserProfileContext";
import { Checkbox } from "@/components/ui/checkbox";
import {
  getFriendlyJourneyName,
  isDocumentApplicableToJourney,
  getCachedUserJourneys,
  setCachedUserJourneys,
  fetchUserJourneysCached,
  isSameJourneyType,
} from "@/lib/document-vault/journey-mapping";

interface DocumentUploadModalProps {
  open: boolean;
  onClose: () => void;
  documentDef: DocumentDefinition;
  onUploadComplete: () => void;
  userJourneys?: any[];
  activeJourneyId?: string | null;
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
  userJourneys = [],
  activeJourneyId = null,
}: DocumentUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [role, setRole] = useState<DocumentRole>(documentDef.roles[0]);
  const [expirationDate, setExpirationDate] = useState("");
  const [notes, setNotes] = useState("");
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { config, replaceDocumentId, deleteDocument, currentJourneyId } = useDocumentVaultStore();
  const { t } = useLanguage();

  const [internalUserJourneys, setInternalUserJourneys] = useState<any[]>(() => {
    if (userJourneys && userJourneys.length > 0) return userJourneys;
    return getCachedUserJourneys() || [];
  });
  const [internalActiveJourneyId, setInternalActiveJourneyId] = useState<string | null>(
    activeJourneyId || currentJourneyId || null
  );

  const effectiveUserJourneys = userJourneys.length > 0 ? userJourneys : internalUserJourneys;
  const effectiveActiveJourneyId = activeJourneyId || internalActiveJourneyId || currentJourneyId;

  useEffect(() => {
    if (!open) return;

    const resolvedActiveId = activeJourneyId || currentJourneyId;
    if (resolvedActiveId) {
      setInternalActiveJourneyId(resolvedActiveId);
    }

    if (userJourneys && userJourneys.length > 0) {
      setInternalUserJourneys(userJourneys);
      setCachedUserJourneys(userJourneys);
      if (!resolvedActiveId && userJourneys.length > 0) {
        setInternalActiveJourneyId(userJourneys[0].id);
      }
      return;
    }

    // Check synchronous in-memory cache first
    const cached = getCachedUserJourneys();
    if (cached && cached.length > 0) {
      setInternalUserJourneys(cached);
      if (!resolvedActiveId) {
        const saved =
          typeof window !== "undefined" ? sessionStorage.getItem("doc_vault_active_journey") : null;
        if (saved && cached.some((j) => j.id === saved)) {
          setInternalActiveJourneyId(saved);
        } else {
          const active = cached.find((j) => j.status === "in_progress") || cached[0];
          setInternalActiveJourneyId(active.id);
        }
      }
    }

    // Background revalidate / fetch
    fetchUserJourneysCached()
      .then((journeys) => {
        if (journeys && journeys.length > 0) {
          setInternalUserJourneys(journeys);
          if (!resolvedActiveId) {
            const saved =
              typeof window !== "undefined"
                ? sessionStorage.getItem("doc_vault_active_journey")
                : null;
            if (saved && journeys.some((j) => j.id === saved)) {
              setInternalActiveJourneyId(saved);
            } else {
              const active = journeys.find((j) => j.status === "in_progress") || journeys[0];
              setInternalActiveJourneyId(active.id);
            }
          }
        }
      })
      .catch((err) => {
        console.error("DocumentUploadModal failed to fetch journeys:", err);
      });
  }, [open, userJourneys, activeJourneyId, currentJourneyId]);

  const otherJourneys = useMemo(() => {
    return effectiveUserJourneys.filter((j) => {
      if (j.id === effectiveActiveJourneyId) return false;
      if (isSameJourneyType(j.journey_type, effectiveActiveJourneyId)) return false;
      return isDocumentApplicableToJourney(documentDef.id, documentDef.name, j.journey_type);
    });
  }, [effectiveUserJourneys, effectiveActiveJourneyId, documentDef]);

  const [sharedJourneyIds, setSharedJourneyIds] = useState<string[]>([]);

  const otherJourneysKey = useMemo(() => otherJourneys.map((j) => j.id).join(","), [otherJourneys]);

  useEffect(() => {
    if (open) {
      setSharedJourneyIds(otherJourneys.map((j) => j.id));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, otherJourneysKey]);
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
  const [ocrPhase, setOcrPhase] = useState<"idle" | "reading" | "confirm" | "error">("idle");
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
        // The file is already saved in the vault; only the auto-read failed. Keep the
        // modal open in an error state so the user can re-read or fill in manually,
        // instead of dropping them out with no way to retry.
        setOcrPhase("error");
        return;
      }
      setOcrFields(json.fields || {});
      setOcrWarnings(json.warnings || []);
      setOcrPhase("confirm");
    } catch {
      setOcrPhase("error");
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
      const path = ocrConfig && ocrConfig.target !== "self" ? `${ocrConfig.target}.${key}` : key;
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
        showToast(json?.error || "Could not save details to your profile.", "error");
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
      showToast("Details saved to your profile.", "success");
      handleClose();
    } catch {
      showToast("Something went wrong while saving.", "error");
    } finally {
      setOcrSaving(false);
    }
  };

  const { showToast } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        showToast(t("documentVaultPage.components.uploadModal.fileSizeError"), "error");
        return;
      }

      // Validate file type
      const allowedTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png", "image/gif"];
      if (!allowedTypes.includes(file.type)) {
        showToast(t("documentVaultPage.components.uploadModal.fileTypeError"), "error");
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
        showToast(t("documentVaultPage.components.uploadModal.fileSizeError"), "error");
        return;
      }

      // Validate file type
      const allowedTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png", "image/gif"];
      if (!allowedTypes.includes(file.type)) {
        showToast(t("documentVaultPage.components.uploadModal.fileTypeError"), "error");
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    if (!config) {
      showToast(
        "Document Vault is not configured. Please refresh the page and try again.",
        "error"
      );
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
    showToast(t("documentVaultPage.components.uploadModal.uploading"), "loading", {
      id: "upload-progress",
    });

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("documentDefId", documentDef.id);
      formData.append("role", role);
      formData.append("caseId", config.caseId || "CASE");

      if (documentDef.id.startsWith("dynamic-")) {
        formData.append("dynamicName", documentDef.name);
        formData.append("dynamicCategory", documentDef.category || "MISC");
      }

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
      if (activeJourneyId) {
        formData.append("journeyId", activeJourneyId);
      }
      if (sharedJourneyIds.length > 0) {
        formData.append("shareWithJourneyIds", JSON.stringify(sharedJourneyIds));
      }

      const response = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t("documentVaultPage.components.uploadModal.uploadFailed"));
      }

      showToast(
        replaceDocumentId
          ? "Document replaced successfully"
          : t("documentVaultPage.components.uploadModal.uploadSuccess"),
        "success",
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
      showToast(
        error instanceof Error
          ? error.message
          : t("documentVaultPage.components.uploadModal.uploadFailed"),
        "error",
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
        } w-[95vw] overflow-hidden rounded-2xl border-none p-0 shadow-2xl sm:w-full`}
      >
        <div className="max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader className="relative pb-4">
            <DialogTitle className="pr-8 text-lg font-bold text-[#0c1b33] sm:text-xl">
              {t("documentVaultPage.components.uploadModal.titlePrefix")}
              {t(`documentVaultPage.documents.${documentDef.id}.name`) !==
              `documentVaultPage.documents.${documentDef.id}.name`
                ? t(`documentVaultPage.documents.${documentDef.id}.name`)
                : documentDef.name}
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-0 right-0 h-8 w-8 rounded-full transition-colors hover:bg-slate-100"
              onClick={handleClose}
            >
              <X className="h-4 w-4 text-slate-500" />
              <span className="sr-only">{t("documentVaultPage.components.uploadModal.close")}</span>
            </Button>
          </DialogHeader>

          {/* Config not ready warning */}
          {!config && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 shadow-sm">
              <span className="mt-0.5 text-lg leading-none">⏳</span>
              <span className="leading-relaxed">
                Document Vault is initializing&hellip; please wait a moment before uploading.
              </span>
            </div>
          )}

          {/* ── Inline OCR auto-fill panel (shown after upload for OCR docs) ── */}
          {ocrPhase !== "idle" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-[#0c1b33]">
                <div className="text-brand flex h-9 w-9 items-center justify-center rounded-xl bg-[#e8f1fb]">
                  <ScanLine className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold">
                    {ocrPhase === "reading"
                      ? "Reading your document..."
                      : ocrPhase === "error"
                        ? "We couldn't read this document"
                        : "Confirm the details we read"}
                  </p>
                  {ocrPhase !== "error" && (
                    <p className="text-xs text-[#6b8097]">
                      {ocrConfig?.target === "beneficiary"
                        ? "These will be saved to your spouse's (beneficiary) details."
                        : "These will be saved to your profile."}
                    </p>
                  )}
                </div>
                {/* Re-read shortcut on the confirm screen — lets the user retry the
                    auto-read if the values look off, without re-uploading the file. */}
                {ocrPhase === "confirm" && selectedFile && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => runOcr(selectedFile)}
                    disabled={ocrSaving}
                    className="gap-1.5 rounded-xl border-[#d0e4f7] text-xs font-semibold text-[#6b8097] hover:bg-slate-50"
                  >
                    <ScanLine className="h-3.5 w-3.5" />
                    Re-read
                  </Button>
                )}
              </div>

              {ocrPhase === "reading" && (
                <div className="flex items-center justify-center gap-3 py-10 text-[#6b8097]">
                  <div className="border-brand/30 border-t-brand h-5 w-5 animate-spin rounded-full border-2" />
                  <span className="text-sm font-medium">Extracting fields...</span>
                </div>
              )}

              {ocrPhase === "error" && (
                <>
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                    <p className="mb-1 font-semibold">
                      Your document is saved, we just couldn&apos;t auto-read it.
                    </p>
                    <p className="leading-relaxed">
                      The photo may be blurry, cropped, or have glare. For the best result, use a
                      clear, well-lit photo of the full document, then try again. You can also fill
                      in the details yourself.
                    </p>
                  </div>
                  <div className="flex gap-3 pt-2 pb-2">
                    <Button
                      variant="outline"
                      onClick={handleClose}
                      className="flex-1 rounded-xl border-[#d0e4f7] font-semibold text-[#6b8097] hover:bg-slate-50"
                    >
                      Fill in manually
                    </Button>
                    <Button
                      onClick={() => selectedFile && runOcr(selectedFile)}
                      disabled={!selectedFile}
                      className="bg-primary hover:bg-primary/90 flex-1 gap-1.5 rounded-xl font-semibold text-white"
                    >
                      <ScanLine className="h-4 w-4" />
                      Re-read document
                    </Button>
                  </div>
                </>
              )}

              {ocrPhase === "confirm" && (
                <>
                  {ocrWarnings.length > 0 && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                      <p className="mb-1 font-semibold">Please double-check these</p>
                      <ul className="list-disc space-y-1 pl-4">
                        {ocrWarnings.map((w, i) => (
                          <li key={i}>{w}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {journeyMarriageClash && (
                    <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-800">
                      <p className="mb-1 font-semibold">
                        Please review, this may not match an earlier answer
                      </p>
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
                    <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                      <p className="mb-1 font-semibold">
                        These don&apos;t match what&apos;s already saved
                      </p>
                      <ul className="list-disc space-y-1 pl-4">
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

                  <div className="grid grid-cols-1 items-start gap-x-4 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
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
                      className="flex-1 rounded-xl border-[#d0e4f7] font-semibold text-[#6b8097] hover:bg-slate-50"
                    >
                      Skip
                    </Button>
                    <Button
                      onClick={handleSaveOcr}
                      disabled={ocrSaving}
                      className="bg-primary hover:bg-primary/90 flex-1 rounded-xl font-semibold text-white"
                    >
                      {ocrSaving ? "Saving..." : "Confirm & Save"}
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}

          <div className={`space-y-4 sm:space-y-6 ${ocrPhase !== "idle" ? "hidden" : ""}`}>
            {/* File upload area */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-[#263342]">
                {t("documentVaultPage.components.uploadModal.selectFile")}
              </Label>

              <div
                onClick={() => !selectedFile && fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative flex min-h-[300px] w-full flex-col justify-center overflow-hidden rounded-2xl transition-all duration-300 bg-transparent ${
                  selectedFile
                    ? "border border-[#0d7377]/25 p-4"
                    : isDragging
                      ? "cursor-pointer border border-[#0d7377] shadow-[0_18px_50px_rgba(13,115,119,0.18)]"
                      : "cursor-pointer border border-[#dcecf1] px-6 py-10 shadow-[0_10px_40px_rgba(13,115,119,0.10)] hover:border-[#afdbdb] hover:shadow-[0_16px_48px_rgba(13,115,119,0.14)] sm:px-10 sm:py-12"
                }`}
              >
                {!selectedFile && (
                  <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div className="absolute -top-16 -right-16 h-32 w-32 rounded-full bg-[#0d7377]/[0.025]" />
                    <div className="absolute -bottom-20 -left-16 h-36 w-36 rounded-full bg-[#32e0c4]/[0.025]" />
                  </div>
                )}

                {!selectedFile ? (
                  <div className="relative z-10 flex flex-col items-center justify-center">
                    {/* Icon */}
                    <div
                      className={`mb-5 flex h-16 w-16 items-center justify-center rounded-2xl transition-all duration-300 sm:h-[72px] sm:w-[72px] ${
                        isDragging
                          ? "scale-105 bg-[#0d7377] shadow-[0_10px_30px_rgba(13,115,119,0.22)]"
                          : "border border-[#0d7377]/10 bg-[#edf8f8]"
                      }`}
                    >
                      <Upload
                        className={`h-7 w-7 ${isDragging ? "text-white" : "text-[#0d7377]"}`}
                      />
                    </div>

                    {/* Title */}
                    <p className="text-center text-lg font-bold text-[#123f42] sm:text-xl">
                      {isDragging ? "Drop your file here" : "Drag & drop your file here"}
                    </p>

                    {/* Description */}
                    <p className="mt-1.5 text-center text-xs text-[#6b8a8f] sm:text-sm">
                      or choose a file from your device
                    </p>

                    {/* Divider */}
                    <div className="my-5 flex w-[200px] items-center gap-3">
                      <span className="h-px flex-1 bg-[#e6ecee]" />

                      <span className="text-[10px] font-medium tracking-wider text-[#9aa4ab]">
                        OR
                      </span>

                      <span className="h-px flex-1 bg-[#e6ecee]" />
                    </div>

                    {/* Browse */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#00595C] px-7 py-3 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(13,115,119,0.25)] transition-all hover:bg-[#004a4c] hover:shadow-[0_10px_26px_rgba(13,115,119,0.32)] active:scale-[0.98] sm:w-auto"
                    >
                      <Upload className="h-4 w-4" />
                      Browse files
                    </button>

                    {/* Helper */}
                    <p className="mt-4 text-center text-[11px] text-[#8aa5a8] sm:text-xs">
                      PDF, JPG, PNG or GIF • Maximum file size 10 MB
                    </p>
                  </div>
                ) : (
                  <div className="w-full">
                    <div className="flex items-center gap-3 rounded-xl border border-[#dceaea] bg-white p-3.5 shadow-[0_4px_14px_rgba(35,53,78,0.05)] sm:p-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#edf8f8] text-[#0d7377]">
                        <Upload className="h-5 w-5" />
                      </div>

                      <div className="min-w-0 flex-1 text-left">
                        <p
                          className="truncate text-sm font-semibold text-[#263342]"
                          title={selectedFile.name}
                        >
                          {selectedFile.name}
                        </p>

                        <div className="mt-1 flex items-center gap-2">
                          <span className="text-[11px] text-[#7a858e]">
                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                          </span>

                          <span className="h-1 w-1 rounded-full bg-[#b8c4c9]" />

                          <span className="flex items-center gap-1 text-[11px] font-medium text-[#0d7377]">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#0d7377]" />
                            Ready
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFile(null);

                          if (fileInputRef.current) {
                            fileInputRef.current.value = "";
                          }
                        }}
                        aria-label="Remove selected file"
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#8a969e] transition-all hover:bg-[#fff1f1] hover:text-[#c75c5c] active:scale-95"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="mt-3 flex items-center justify-between px-1">
                      <span className="text-[11px] text-[#7a858e]">File ready to upload</span>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();

                          if (fileInputRef.current) {
                            fileInputRef.current.value = "";
                            fileInputRef.current.click();
                          }
                        }}
                        className="text-[11px] font-semibold text-[#0d7377] transition-colors hover:text-[#095c60]"
                      >
                        Change file
                      </button>
                    </div>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.gif"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            </div>

            {/* Expiration date (if needed) */}
            {needsExpirationDate && (
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-[#3a4f63]">
                  {t("documentVaultPage.components.uploadModal.expirationDate")}
                  {documentDef.validityType === "user_set" && (
                    <span className="ml-1 text-red-500">*</span>
                  )}
                </Label>
                <Input
                  type="date"
                  value={expirationDate}
                  onChange={(e) => setExpirationDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="focus:ring-brand/20 rounded-lg border-[#d0e4f7]"
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
                className="focus:ring-brand/20 resize-none rounded-lg border-[#d0e4f7]"
              />
            </div>

            {/* Sibling Journeys Cross-Sharing Checkboxes */}
            {otherJourneys.length > 0 && (
              <div className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 shadow-inner dark:border-slate-800/80 dark:bg-slate-800/40">
                <label className="text-xs font-bold tracking-wider text-slate-700 uppercase dark:text-slate-300">
                  Cross-share this document
                </label>
                <p className="mb-1 text-[11px] leading-normal text-slate-500">
                  Select which of your other active immigration journeys should also receive this
                  uploaded file:
                </p>
                <div className="space-y-2.5 pt-1">
                  {otherJourneys.map((j) => {
                    const isChecked = sharedJourneyIds.includes(j.id);
                    return (
                      <div
                        key={j.id}
                        onClick={() => {
                          if (isChecked) {
                            setSharedJourneyIds(sharedJourneyIds.filter((id) => id !== j.id));
                          } else {
                            setSharedJourneyIds([...sharedJourneyIds, j.id]);
                          }
                        }}
                        className={`flex cursor-pointer items-center justify-between rounded-xl border p-3.5 transition-all duration-300 select-none ${
                          isChecked
                            ? "bg-primary/5 border-primary shadow-xs"
                            : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-5 w-5 items-center justify-center rounded-md border transition-all duration-300 ${
                              isChecked
                                ? "bg-primary border-primary scale-100 text-white"
                                : "border-slate-300 bg-transparent dark:border-slate-700"
                            }`}
                          >
                            {isChecked && (
                              <svg
                                className="h-3.5 w-3.5 fill-none stroke-white stroke-[3]"
                                viewBox="0 0 24 24"
                              >
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            )}
                          </div>
                          <span
                            className={`text-xs font-bold transition-colors ${
                              isChecked
                                ? "text-slate-900 dark:text-white"
                                : "text-slate-600 dark:text-slate-400"
                            }`}
                          >
                            {getFriendlyJourneyName(j.journey_type, j.journey_name)}
                          </span>
                        </div>
                        {isChecked && (
                          <span className="text-primary bg-primary/10 animate-in fade-in zoom-in-95 rounded-md px-2 py-0.5 text-[10px] font-black tracking-wider uppercase duration-200">
                            Shared
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* USCIS Naming Preview */}
            {selectedFile && config && (
              <div className="space-y-4 rounded-xl border border-blue-100 bg-blue-50/50 p-5 shadow-sm">
                <div className="mb-1 flex items-center gap-2">
                  <div className="bg-brand h-1.5 w-1.5 rounded-full" />
                  <p className="text-xs font-bold tracking-wider text-blue-900/60 uppercase">
                    {t("documentVaultPage.components.uploadModal.namingPreview")}
                  </p>
                </div>

                {/* Display name */}
                <div className="grid grid-cols-1 gap-1">
                  <p className="text-[11px] font-bold tracking-tight text-blue-800/50 uppercase">
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
                  <p className="text-[11px] font-bold tracking-tight text-blue-800/50 uppercase">
                    {t("documentVaultPage.components.uploadModal.standardizedFilename")}
                  </p>
                  <div className="group rounded-lg border border-blue-100 bg-white/80 p-3 shadow-inner">
                    <code className="font-mono text-xs leading-relaxed break-all text-blue-900">
                      {`${role}_${documentDef.key}_${new Date().toISOString().split("T")[0]}_v1.${selectedFile.name
                        .split(".")
                        .pop()
                        ?.toLowerCase()}`}
                    </code>
                  </div>
                </div>

                {/* File info */}
                <div className="flex items-center justify-between border-t border-blue-100/50 pt-2 text-[11px] font-bold text-blue-800/60 uppercase">
                  <span>
                    {t("documentVaultPage.components.uploadModal.sizePrefix")}
                    <span className="ml-1 text-blue-900">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                  </span>
                  <span>
                    {t("documentVaultPage.components.uploadModal.typePrefix")}
                    <span className="ml-1 text-blue-900">
                      {selectedFile.name.split(".").pop()?.toUpperCase()}
                    </span>
                  </span>
                </div>

                {(!config.caseId || !config.petitionerName || !config.beneficiaryName) && (
                  <div className="flex items-start gap-2 rounded-lg border border-red-100 bg-red-50 p-3 shadow-sm">
                    <span className="text-xs">⚠️</span>
                    <p className="text-[11px] leading-relaxed font-medium text-red-800">
                      {t("documentVaultPage.components.uploadModal.warning")}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Security Guarantee */}
            <div className="flex items-center justify-center gap-2 rounded-xl border border-[#d0e4f7]/40 bg-slate-50 px-4 py-2.5 text-xs font-semibold text-[#3a4f63] shadow-sm">
              <Lock className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
              <span>{t("documentVaultPage.components.uploadModal.securityNotice")}</span>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 pb-2">
              <Button
                variant="outline"
                onClick={handleClose}
                className="flex-1 rounded-xl border-[#d0e4f7] font-semibold text-[#6b8097] transition-all hover:bg-slate-50"
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
                className="bg-primary hover:bg-primary/90 shadow-brand/20 disabled:bg-primary/70 flex-1 rounded-xl font-semibold text-white shadow-lg transition-all disabled:cursor-not-allowed disabled:border-slate-300 disabled:text-white disabled:shadow-none"
              >
                {uploading ? (
                  <div className="flex items-center gap-2 text-white">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-white" />
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
