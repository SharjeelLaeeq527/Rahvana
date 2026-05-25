"use client";

import { useState, useRef } from "react";
import { DocumentDefinition, DocumentRole } from "@/lib/document-vault/types";
import { useLanguage } from "@/app/context/LanguageContext";
import { useDocumentVaultStore } from "@/lib/document-vault/store";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Upload, X, Lock } from "lucide-react";
import { toast } from "sonner";

interface DocumentUploadModalProps {
  open: boolean;
  onClose: () => void;
  documentDef: DocumentDefinition;
  onUploadComplete: () => void;
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

      handleClose();
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
    onClose();
  };

  const needsExpirationDate =
    documentDef.validityType === "user_set" || documentDef.validityType === "policy_variable";

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl w-[95vw] sm:w-full p-0 overflow-hidden rounded-2xl border-none shadow-2xl">
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

          <div className="space-y-4 sm:space-y-6">
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
