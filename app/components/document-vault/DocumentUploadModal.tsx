"use client";

import { useState, useRef } from "react";
import { DocumentDefinition, DocumentRole } from "@/lib/document-vault/types";
import { useLanguage } from "@/app/context/LanguageContext";
import { useDocumentVaultStore } from "@/lib/document-vault/store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Upload, X } from "lucide-react";
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { config } = useDocumentVaultStore();
  const { t } = useLanguage();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error(
          t("documentVaultPage.components.uploadModal.fileSizeError"),
        );
        return;
      }

      // Validate file type
      const allowedTypes = [
        "application/pdf",
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
      ];
      if (!allowedTypes.includes(file.type)) {
        toast.error(
          t("documentVaultPage.components.uploadModal.fileTypeError"),
        );
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !config) return;

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
        throw new Error(
          data.error ||
            t("documentVaultPage.components.uploadModal.uploadFailed"),
        );
      }

      toast.success(
        t("documentVaultPage.components.uploadModal.uploadSuccess"),
        {
          id: "upload-progress",
        },
      );

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
        },
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
    documentDef.validityType === "user_set" ||
    documentDef.validityType === "policy_variable";

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader className="relative pb-2">
          <DialogTitle className="text-lg sm:text-xl pr-8">
            {t("documentVaultPage.components.uploadModal.titlePrefix")}
            {t(`documentVaultPage.documents.${documentDef.id}.name`) !==
            `documentVaultPage.documents.${documentDef.id}.name`
              ? t(`documentVaultPage.documents.${documentDef.id}.name`)
              : documentDef.name}
          </DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full absolute -top-2 -right-2 sm:-top-2 sm:-right-2"
            onClick={handleClose}
          >
            <X className="w-4 h-4" />
            <span className="sr-only">
              {t("documentVaultPage.components.uploadModal.close")}
            </span>
          </Button>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6">
          {/* File upload area */}
          <div>
            <Label>
              {t("documentVaultPage.components.uploadModal.selectFile")}
            </Label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed rounded-lg p-6 sm:p-8 text-center cursor-pointer hover:border-brand transition-colors mt-1.5"
            >
              {selectedFile ? (
                <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                  <Upload className="w-5 h-5 text-brand" />
                  <span className="font-medium">{selectedFile.name}</span>
                  <span className="text-muted-foreground text-sm">
                    ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
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
                  <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="font-medium">
                    {t(
                      "documentVaultPage.components.uploadModal.clickToSelect",
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
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
          <div>
            <Label>
              {t("documentVaultPage.components.uploadModal.providedBy")}
            </Label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as DocumentRole)}
              className="w-full border rounded-md p-2"
            >
              {documentDef.roles.map((r) => (
                <option key={r} value={r}>
                  {t(`documentVaultPage.roles.${r}`)}
                </option>
              ))}
            </select>
          </div>

          {/* Expiration date (if needed) */}
          {needsExpirationDate && (
            <div>
              <Label>
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
              />
              <p className="text-xs text-muted-foreground mt-1">
                {documentDef.validityType === "user_set"
                  ? t(
                      "documentVaultPage.components.uploadModal.expirationRequired",
                    )
                  : t(
                      "documentVaultPage.components.uploadModal.expirationOptional",
                    )}
              </p>
            </div>
          )}

          {/* Notes */}
          <div>
            <Label>{t("documentVaultPage.components.uploadModal.notes")}</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t(
                "documentVaultPage.components.uploadModal.notesPlaceholder",
              )}
              rows={3}
            />
          </div>

          {/* USCIS Naming Preview */}
          {selectedFile && config && (
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4 space-y-3">
              <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                {t("documentVaultPage.components.uploadModal.namingPreview")}
              </p>

              {/* Display name */}
              <div>
                <p className="text-xs text-blue-700 dark:text-blue-300 mb-1">
                  {t("documentVaultPage.components.uploadModal.displayName")}
                </p>
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
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
                        t(
                          "documentVaultPage.components.uploadModal.beneficiary",
                        )
                      : config.jointSponsorName ||
                        t(
                          "documentVaultPage.components.uploadModal.jointSponsor",
                        )}
                </p>
              </div>

              {/* Standardized filename */}
              <div>
                <p className="text-xs text-blue-700 dark:text-blue-300 mb-1">
                  {t(
                    "documentVaultPage.components.uploadModal.standardizedFilename",
                  )}
                </p>
                <div className="bg-white dark:bg-blue-900/50 p-2 rounded">
                  <code className="text-xs text-blue-800 dark:text-blue-200 break-all">
                    {`${(config.caseId || "CASE").replace(/[^a-zA-Z0-9]/g, "").toUpperCase()}_${role}_${(role ===
                    "PETITIONER"
                      ? config.petitionerName || "NAME"
                      : role === "BENEFICIARY"
                        ? config.beneficiaryName || "NAME"
                        : config.jointSponsorName || "NAME"
                    )
                      .normalize("NFD")
                      .replace(/[\u0300-\u036f]/g, "")
                      .replace(/[^a-zA-Z0-9\s]/g, "")
                      .trim()
                      .replace(/\s+/g, "_")
                      .toUpperCase()
                      .substring(
                        0,
                        30,
                      )}_${documentDef.key}_${new Date().toISOString().split("T")[0]}_v1.${selectedFile.name
                      .split(".")
                      .pop()
                      ?.toLowerCase()}`}
                  </code>
                </div>
              </div>

              {/* File info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-blue-700 dark:text-blue-300 gap-1">
                <span>
                  {t("documentVaultPage.components.uploadModal.sizePrefix")}
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </span>
                <span>
                  {t("documentVaultPage.components.uploadModal.typePrefix")}
                  {selectedFile.name.split(".").pop()?.toUpperCase()}
                </span>
              </div>

              {(!config.caseId ||
                !config.petitionerName ||
                !config.beneficiaryName) && (
                <div className="bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 rounded p-2">
                  <p className="text-xs text-red-800 dark:text-red-200">
                    {t("documentVaultPage.components.uploadModal.warning")}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={handleClose} className="flex-1">
              {t("documentVaultPage.components.uploadModal.cancel")}
            </Button>
            <Button
              onClick={handleUpload}
              disabled={
                !selectedFile ||
                uploading ||
                (needsExpirationDate &&
                  documentDef.validityType === "user_set" &&
                  !expirationDate)
              }
              className="flex-1"
            >
              {uploading
                ? t("documentVaultPage.components.uploadModal.uploadBtnLoading")
                : t("documentVaultPage.components.uploadModal.uploadBtn")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
