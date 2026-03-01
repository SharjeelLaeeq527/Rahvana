"use client";

import { useState, useRef } from "react";
import { DocumentDefinition, DocumentRole } from "@/lib/document-vault/types";
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB");
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
        toast.error("Only PDF, JPG, PNG, and GIF files are allowed");
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !config) return;

    setUploading(true);
    toast.loading("Uploading document...", { id: "upload-progress" });

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
        throw new Error(data.error || "Upload failed");
      }

      toast.success("✅ Document uploaded successfully!", {
        id: "upload-progress",
      });

      // Call completion handler to refresh the list
      await onUploadComplete();

      handleClose();
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(error instanceof Error ? error.message : "Upload failed", {
        id: "upload-progress",
      });
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
            Upload Document: {documentDef.name}
          </DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full absolute -top-2 -right-2 sm:-top-2 sm:-right-2"
            onClick={handleClose}
          >
            <X className="w-4 h-4" />
            <span className="sr-only">Close</span>
          </Button>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6">
          {/* File upload area */}
          <div>
            <Label>Select File</Label>
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
                  <p className="font-medium">Click to select file</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    PDF, JPG, PNG, GIF (max 10MB)
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
            <Label>Provided By</Label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as DocumentRole)}
              className="w-full border rounded-md p-2"
            >
              {documentDef.roles.map((r) => (
                <option key={r} value={r}>
                  {r.replace("_", " ")}
                </option>
              ))}
            </select>
          </div>

          {/* Expiration date (if needed) */}
          {needsExpirationDate && (
            <div>
              <Label>
                Expiration Date
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
                  ? "Required: Enter the expiration date for this document"
                  : "Optional: Enter expiration date if known"}
              </p>
            </div>
          )}

          {/* Notes */}
          <div>
            <Label>Notes (Optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this document..."
              rows={3}
            />
          </div>

          {/* USCIS Naming Preview */}
          {selectedFile && config && (
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4 space-y-3">
              <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                📄 USCIS Naming Preview
              </p>

              {/* Display name */}
              <div>
                <p className="text-xs text-blue-700 dark:text-blue-300 mb-1">
                  Display Name:
                </p>
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  {documentDef.name} -{" "}
                  {role === "PETITIONER"
                    ? config.petitionerName || "Petitioner"
                    : role === "BENEFICIARY"
                      ? config.beneficiaryName || "Beneficiary"
                      : config.jointSponsorName || "Joint Sponsor"}
                </p>
              </div>

              {/* Standardized filename */}
              <div>
                <p className="text-xs text-blue-700 dark:text-blue-300 mb-1">
                  Standardized Filename:
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
                  Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </span>
                <span>
                  Type: {selectedFile.name.split(".").pop()?.toUpperCase()}
                </span>
              </div>

              {(!config.caseId ||
                !config.petitionerName ||
                !config.beneficiaryName) && (
                <div className="bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 rounded p-2">
                  <p className="text-xs text-red-800 dark:text-red-200">
                    ⚠️ <strong>Warning:</strong> Set Case Information in left
                    panel for proper USCIS naming!
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={handleClose} className="flex-1">
              Cancel
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
              {uploading ? "Uploading..." : "Upload Document"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
