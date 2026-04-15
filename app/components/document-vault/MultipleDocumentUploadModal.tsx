"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import { DocumentRole } from "@/lib/document-vault/types";
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
import { Upload, X, Plus, Trash2, FileText, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { ALL_DOCUMENTS } from "@/lib/document-vault/document-definitions";

interface PendingUpload {
  id: string;
  type: string;
  notes: string;
  file: File | null;
}

interface MultipleDocumentUploadModalProps {
  open: boolean;
  onClose: () => void;
  categoryId: string; // e.g. doc_citizenship
  documentName: string; // e.g. Proof of U.S. Citizenship
  options: string[]; // e.g. ["U.S. passport", "U.S. birth certificate", ...]
  onUploadComplete: () => void;
}

const OTHER_OPTION = "Other";

export function MultipleDocumentUploadModal({
  open,
  onClose,
  categoryId,
  documentName,
  options,
  onUploadComplete,
}: MultipleDocumentUploadModalProps) {
  const [pendingUploads, setPendingUploads] = useState<PendingUpload[]>([]);
  const [uploading, setUploading] = useState(false);
  const { config, uploadedDocuments: vaultDocuments } = useDocumentVaultStore();
  const { t } = useLanguage();

  // Find the base document definition
  const documentDef = useMemo(() => {
    return ALL_DOCUMENTS.find((d) => d.id === categoryId) || {
      id: categoryId,
      key: categoryId.toUpperCase().replace(/[^A-Z]/g, "_"),
      roles: ["BENEFICIARY"] as DocumentRole[],
    };
  }, [categoryId]);

  // Derive already uploaded documents and their types for this category
  const uploadedDocuments = useMemo(() => {
    return vaultDocuments.filter((d) => d.documentDefId === categoryId);
  }, [vaultDocuments, categoryId]);

  const uploadedTypes = useMemo(() => {
    return uploadedDocuments
      .map((d) => {
        if (d.notes && d.notes.startsWith("Type: ")) {
          const typeMatch = d.notes.split("\n")[0].replace("Type: ", "").trim();
          return typeMatch;
        }
        return "";
      })
      .filter(Boolean);
  }, [uploadedDocuments]);

  // Make sure there is always at least one empty slot if there are available options
  useEffect(() => {
    if (open) {
      setPendingUploads((prev) => {
        if (prev.length === 0) {
          return [{ id: Math.random().toString(), type: "", notes: "", file: null }];
        }
        return prev;
      });
    } else {
      setPendingUploads([]);
    }
  }, [open]);

  const addPendingUpload = () => {
    setPendingUploads((prev) => [
      ...prev,
      { id: Math.random().toString(), type: "", notes: "", file: null },
    ]);
  };

  const removePendingUpload = (id: string) => {
    setPendingUploads((prev) => prev.filter((p) => p.id !== id));
  };

  const updatePendingUpload = (id: string, updates: Partial<PendingUpload>) => {
    setPendingUploads((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    );
  };

  const handleFileSelect = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB");
        return;
      }
      const allowedTypes = [
        "application/pdf",
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
      ];
      if (!allowedTypes.includes(file.type)) {
        toast.error("Invalid file type. Please upload PDF or image.");
        return;
      }
      updatePendingUpload(id, { file });
    }
  };

  const getAvailableOptions = (currentSlotId: string) => {
    const usedPendingTypes = pendingUploads
      .filter((p) => p.id !== currentSlotId && p.type && p.type !== OTHER_OPTION)
      .map((p) => p.type);
    
    return options.filter(
      (opt) => !uploadedTypes.includes(opt) && !usedPendingTypes.includes(opt)
    );
  };

  const handleUploadAll = async () => {
    const validUploads = pendingUploads.filter((p) => p.file && p.type);
    if (validUploads.length === 0) return;
    if (!config) {
      toast.error("Document Vault is not configured. Please refresh.");
      return;
    }

    setUploading(true);
    toast.loading(`Uploading ${validUploads.length} document(s)...`, {
      id: "multi-upload-progress",
    });

    try {
      // Need a role, if we can deduce from definition or default to BENEFICIARY
      const parentRole = documentDef.roles?.[0] || "BENEFICIARY";
      let personName = "Unknown";
      if (parentRole === "PETITIONER" && config.petitionerName) {
        personName = config.petitionerName;
      } else if (parentRole === "BENEFICIARY" && config.beneficiaryName) {
        personName = config.beneficiaryName;
      } else if (parentRole === "JOINT_SPONSOR" && config.jointSponsorName) {
        personName = config.jointSponsorName;
      }

      await Promise.all(
        validUploads.map(async (uploadItem) => {
          const formData = new FormData();
          formData.append("file", uploadItem.file!);
          formData.append("documentDefId", documentDef.id);
          formData.append("role", parentRole);
          formData.append("caseId", config.caseId || "CASE");
          formData.append("personName", personName);
          // Special storage: Save the selected document type inside the notes
          // format: Type: [type]\nNotes: [notes]
          let notesPayload = `Type: ${uploadItem.type}`;
          if (uploadItem.notes.trim()) {
            notesPayload += `\nNotes: ${uploadItem.notes.trim()}`;
          }
          formData.append("notes", notesPayload);

          const response = await fetch("/api/documents/upload", {
            method: "POST",
            body: formData,
          });

          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.error || "Upload failed");
          }
        })
      );

      toast.success(`Successfully uploaded ${validUploads.length} document(s)`, {
        id: "multi-upload-progress",
      });

      // Provide completion callbacks
      await onUploadComplete();
      
      // Keep modal open, but clear completed files and add a blank row
      setPendingUploads([]);
      addPendingUpload();
    } catch (error) {
      console.error("Multi-upload error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to upload all documents",
        { id: "multi-upload-progress" }
      );
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    if (!uploading) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl w-[95vw] p-0 overflow-hidden rounded-2xl border-none shadow-2xl bg-white">
        <div className="max-h-[90vh] overflow-y-auto p-5 sm:p-7">
          <DialogHeader className="relative pb-4 mb-2">
            <DialogTitle className="text-xl sm:text-2xl pr-8 font-black text-[#0f1f38]">
              Upload Multiple Documents
              <span className="block text-[15px] font-medium text-[#6b8097] mt-1 pr-6">
                {documentName}
              </span>
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full absolute top-0 right-0 hover:bg-slate-100 transition-colors"
              onClick={handleClose}
              disabled={uploading}
            >
              <X className="w-5 h-5 text-slate-500" />
            </Button>
          </DialogHeader>

          {/* Already Uploaded List */}
          {uploadedDocuments.length > 0 && (
            <div className="mb-8">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#3a4f63] mb-3">
                Already Uploaded
              </h4>
              <div className="space-y-3">
                {uploadedDocuments.map((doc) => {
                  const typeLabel = doc.notes?.startsWith("Type: ")
                    ? doc.notes.split("\n")[0].replace("Type: ", "").trim()
                    : "Document";
                  return (
                    <div
                      key={doc.id}
                      className="flex items-center gap-4 p-4 rounded-xl border border-[#d0e4f7] bg-[#f8fbff]"
                    >
                      <div className="w-10 h-10 rounded-lg bg-[#eaf7f2] border border-[#b5e0d0] text-[#1a7a5e] flex items-center justify-center shrink-0">
                        <CheckCircle2 size={20} strokeWidth={2.5} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-[#0f1f38] text-sm">
                          {typeLabel}
                        </h4>
                        <p className="text-xs text-[#6b8097] truncate">
                          {doc.originalFilename} •{" "}
                          {(doc.fileSize / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Pending Uploads Rows */}
          <div className="space-y-4 mb-8">
            <div className="flex items-center justify-between mb-1">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#3a4f63]">
                Add New Documents
              </h4>
            </div>

            {pendingUploads.map((uploadItem, index) => {
              const availableOptions = getAvailableOptions(uploadItem.id);
              return (
                <div
                  key={uploadItem.id}
                  className="p-5 rounded-2xl border-2 border-[#e8f1fb] bg-white shadow-sm flex flex-col md:flex-row gap-5 items-start md:items-center relative transition-all hover:border-[#d0e4f7]"
                >
                  <div className="w-full md:w-1/3 shrink-0">
                    <Label className="text-[13px] font-semibold text-[#3a4f63] mb-1.5 block">
                      Document Type
                    </Label>
                    <select
                      value={uploadItem.type}
                      onChange={(e) =>
                        updatePendingUpload(uploadItem.id, {
                          type: e.target.value,
                        })
                      }
                      className="w-full border-2 border-[#e8f1fb] rounded-xl p-3 text-[14px] font-medium text-[#0f1f38] focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none bg-slate-50/50"
                      disabled={uploading}
                    >
                      <option value="" disabled>
                        Select type...
                      </option>
                      {uploadItem.type && (
                        <option value={uploadItem.type}>{uploadItem.type}</option>
                      )}
                      {availableOptions.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                      {!options.includes(OTHER_OPTION) && (
                        <option value={OTHER_OPTION}>{OTHER_OPTION}</option>
                      )}
                    </select>
                  </div>

                  <div className="flex-1 w-full flex flex-col gap-4">
                    <div className="flex flex-col md:flex-row gap-5">
                      <div className="flex-1">
                        <Label className="text-[13px] font-semibold text-[#3a4f63] mb-1.5 block">
                          Select File
                        </Label>
                        <div className="relative">
                          {uploadItem.file ? (
                            <div className="flex items-center justify-between p-3 rounded-xl border-2 border-[#e8f1fb] bg-slate-50/50">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-8 h-8 rounded shrink-0 bg-primary/10 text-primary flex items-center justify-center">
                                  <FileText size={16} />
                                </div>
                                <span className="text-[14px] font-semibold text-[#0f1f38] truncate">
                                  {uploadItem.file.name}
                                </span>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg px-2"
                                onClick={() => updatePendingUpload(uploadItem.id, { file: null })}
                                disabled={uploading}
                              >
                                Remove
                              </Button>
                            </div>
                          ) : (
                            <label className="flex items-center justify-center w-full min-h-[52px] p-3 border-2 border-dashed border-[#d0e4f7] rounded-xl cursor-pointer hover:bg-primary/5 hover:border-primary transition-all group">
                              <div className="flex flex-row items-center justify-center gap-2">
                                <Upload className="w-5 h-5 text-primary/70 group-hover:text-primary transition-colors" />
                                <p className="text-[14px] font-medium text-[#3a4f63] group-hover:text-primary transition-colors">
                                  Click to browse...
                                </p>
                              </div>
                              <input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png,.gif"
                                className="hidden"
                                onChange={(e) => handleFileSelect(uploadItem.id, e)}
                                disabled={uploading}
                              />
                            </label>
                          )}
                        </div>
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1.5">
                          <Label className="text-[13px] font-semibold text-[#3a4f63] block">
                            Notes (Optional)
                          </Label>
                          <span className={`text-[10px] font-bold ${uploadItem.notes.length > 180 ? 'text-orange-500' : 'text-slate-400'}`}>
                            {uploadItem.notes.length}/200
                          </span>
                        </div>
                        <input
                          type="text"
                          placeholder="Brief description..."
                          value={uploadItem.notes}
                          onChange={(e) => updatePendingUpload(uploadItem.id, { notes: e.target.value.slice(0, 200) })}
                          className="w-full border-2 border-[#e8f1fb] rounded-xl p-3 text-[14px] font-medium text-[#0f1f38] focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none bg-slate-50/50"
                          disabled={uploading}
                        />
                      </div>
                    </div>
                  </div>

                  {pendingUploads.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-3 right-3 md:relative md:top-0 md:right-0 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full md:mt-6 shrink-0"
                      onClick={() => removePendingUpload(uploadItem.id)}
                      disabled={uploading}
                    >
                      <Trash2 size={18} />
                    </Button>
                  )}
                </div>
              );
            })}

            {/* Add Button */}
            {getAvailableOptions("").length > 0 && (
              <Button
                variant="outline"
                className="w-full py-6 border-2 border-dashed border-[#d0e4f7] rounded-2xl text-brand font-semibold hover:border-brand hover:bg-brand/5 transition-all flex items-center justify-center gap-2"
                onClick={addPendingUpload}
                disabled={uploading}
              >
                <Plus size={18} strokeWidth={2.5} />
                Add Another Document Type
              </Button>
            )}
          </div>

          {/* Action Footer */}
          <div className="flex gap-4 pt-4 border-t border-slate-100">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={uploading}
              className="flex-1 py-6 rounded-xl border-2 border-[#e8f1fb] text-[#6b8097] font-semibold hover:bg-slate-50 transition-all text-base"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUploadAll}
              disabled={
                uploading ||
                pendingUploads.filter((p) => p.file && p.type).length === 0
              }
              className="flex-1 py-6 rounded-xl bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 transition-all font-semibold disabled:bg-primary/60 text-base"
            >
              {uploading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-white/30 rounded-full animate-spin" />
                  Uploading...
                </div>
              ) : (
                `Upload ${pendingUploads.filter((p) => p.file && p.type).length} Document(s)`
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
