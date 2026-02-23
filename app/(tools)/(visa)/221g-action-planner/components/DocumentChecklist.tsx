import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileText,
  Upload,
  Package,
  Eye,
} from "lucide-react";
import { FormSelections } from "../types/221g";
import { manualChecklists, ChecklistItem } from "../utils/manualChecklists";
import { DocumentType } from "../utils/documentValidation";
import { DocumentItem, DocumentStatus } from "../utils/documentDefinitions";

// Local definitions removed in favor of imports from documentDefinitions.ts

interface DocumentChecklistProps {
  selectedItems: FormSelections;
  onDocumentStatusChange: (documentId: string, status: DocumentStatus) => void;
  onFileUpload: (docId: string, files: FileList) => void;
  onFileRemove: (docId: string, fileIndex: number) => void;
  uploadedDocs: Record<
    string,
    {
      file: File;
      uploadDate: Date;
      quality: "excellent" | "good" | "needs-review";
    }[]
  >;
  docQualityChecks: Record<string, { passed: boolean; issues: string[] }>;
}

export default function DocumentChecklist({
  selectedItems,
  onDocumentStatusChange,
  onFileUpload,
  onFileRemove,
  uploadedDocs,
  docQualityChecks,
}: DocumentChecklistProps) {
  // Map selected form items to document checklist
  const [documents, setDocuments] = useState<DocumentItem[]>([]);

  // Manual Verification State
  const [showManualVerify, setShowManualVerify] = useState(false);
  const [manualVerifyDocId, setManualVerifyDocId] = useState<string | null>(
    null,
  );
  const [manualVerifyDocType, setManualVerifyDocType] =
    useState<DocumentType | null>(null);
  const [manualChecklist, setManualChecklist] = useState<
    Record<string, boolean>
  >({});
  const [currentChecklistItems, setCurrentChecklistItems] = useState<
    ChecklistItem[]
  >([]);

  // Validation Error State
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Update documents when selectedItems change
  useEffect(() => {
    import("../utils/documentDefinitions").then(
      ({ generateRequiredDocumentsList }) => {
        const newDocuments = generateRequiredDocumentsList(selectedItems);
        setDocuments(newDocuments);
      },
    );
  }, [selectedItems]);

  const getStatusColor = (status: DocumentStatus) => {
    switch (status) {
      case "missing":
        return "secondary";
      case "in-progress":
        return "default";
      case "ready":
        return "success";
      case "submitted":
        return "outline";
      default:
        return "secondary";
    }
  };

  const getStatusIcon = (status: DocumentStatus) => {
    switch (status) {
      case "missing":
        return <XCircle className="h-4 w-4 text-destructive" />;
      case "in-progress":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "ready":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "submitted":
        return <Package className="h-4 w-4 text-blue-500" />;
      default:
        return <XCircle className="h-4 w-4 text-destructive" />;
    }
  };

  const updateDocumentStatus = (docId: string, status: DocumentStatus) => {
    onDocumentStatusChange(docId, status);
    setDocuments((prev) =>
      prev.map((doc) => (doc.id === docId ? { ...doc, status } : doc)),
    );
  };

  const openManualVerification = (docId: string, docType: string) => {
    const type = docType as DocumentType;
    const checklistItems = manualChecklists[type];

    if (!checklistItems) {
      console.warn(`No manual checklist defined for ${type}`);
      return;
    }

    setManualVerifyDocId(docId);
    setManualVerifyDocType(type);
    setCurrentChecklistItems(checklistItems);

    // Initialize all items as unchecked
    const initialChecklist: Record<string, boolean> = {};
    checklistItems.forEach((item) => {
      initialChecklist[item.id] = false;
    });
    setManualChecklist(initialChecklist);

    setShowManualVerify(true);
  };

  const handleManualVerifySubmit = () => {
    const allChecked = Object.values(manualChecklist).every((v) => v);
    if (allChecked && manualVerifyDocId) {
      updateDocumentStatus(manualVerifyDocId, "ready");
      setShowManualVerify(false);
    } else {
      alert("Please verify all items in the checklist before proceeding.");
    }
  };

  // Calculate progress
  const completedCount = documents.filter(
    (d) => d.status === "ready" || d.status === "submitted",
  ).length;
  const totalCount = documents.length;
  const progressPercentage =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-end">
          <Badge variant="outline">
            {completedCount}/{totalCount} completed
          </Badge>
        </div>
        <CardDescription>
          Upload and validate your required documents
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-1">
            <span>Overall Progress</span>
            <span>{progressPercentage}%</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        <div className="space-y-4">
          {documents.length > 0 ? (
            documents.map((doc) => {
              const docId = doc.id;
              const hasUploads = uploadedDocs[docId]?.length > 0;
              const qualityCheck = docQualityChecks[docId];

              return (
                <div
                  key={doc.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(doc.status)}
                      <div>
                        <h3 className="font-medium">{doc.name}</h3>
                        <p className="text-xs text-gray-500">
                          {doc.required ? "Required" : "Recommended"}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={getStatusColor(doc.status)}
                      className="self-start sm:self-auto"
                    >
                      {doc.status.replace("-", " ")}
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    {/* File Input Row */}
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <input
                          type="file"
                          multiple
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) =>
                            e.target.files &&
                            onFileUpload(docId, e.target.files)
                          }
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                      </div>
                    </div>

                    {/* Action Buttons Row - Only show if files are uploaded */}
                    {hasUploads && (
                      <div className="flex flex-wrap items-center gap-2 justify-end pt-2 border-t border-gray-100">
                        <Button
                          size="sm"
                          variant="default"
                          className="bg-teal-600 hover:bg-teal-700 text-white"
                          onClick={() => {
                            // Find the most recently uploaded file for this document
                            if (hasUploads) {
                              const latestFile =
                                uploadedDocs[docId][
                                  uploadedDocs[docId].length - 1
                                ];

                              // Create a temporary validator to validate this specific file
                              const validator = async () => {
                                try {
                                  // Use the new OCR processor that handles both images and PDFs
                                  const { processDocumentOCR } =
                                    await import("../utils/ocrProcessor");

                                  const text = await processDocumentOCR(
                                    latestFile.file,
                                    (progressInfo) => {
                                      console.log(
                                        `OCR Progress: ${progressInfo.status} - ${progressInfo.current}%`,
                                      );
                                    },
                                  );

                                  // Import the validation function from the utility
                                  const { validateByDocumentType } =
                                    await import("../utils/documentValidation");

                                  // Validate based on document type
                                  const validationResult =
                                    validateByDocumentType(
                                      text,
                                      doc.type as DocumentType,
                                    );

                                  // Update the document status based on validation result
                                  if (validationResult.isValid) {
                                    updateDocumentStatus(docId, "ready");
                                  } else {
                                    // Show the validation issues to the user
                                    const issues = validationResult.issues.map(
                                      (issue) => `${issue.message}`,
                                    );

                                    // Add hidden debug info
                                    issues.push(`
                                      <details class="mt-4 p-2 bg-gray-100 rounded text-xs font-mono">
                                        <summary class="cursor-pointer font-bold text-gray-600">Show Debug Info (OCR Text)</summary>
                                        <div class="mt-2 whitespace-pre-wrap break-all">
                                          ${text.substring(0, 500)}...
                                        </div>
                                      </details>
                                    `);

                                    setValidationErrors(issues);
                                    setShowErrorDialog(true);
                                  }
                                } catch (error) {
                                  console.error("Validation error:", error);
                                  setValidationErrors([
                                    `Error validating document: ${error instanceof Error ? error.message : "Unknown error"}. Please try again.`,
                                  ]);
                                  setShowErrorDialog(true);
                                }
                              };

                              validator();
                            } else {
                              alert(
                                "Please upload a file first before validating.",
                              );
                            }
                          }}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Validate Document
                        </Button>

                        {/* Show Manual Verify for all documents that have a checklist defined */}
                        {manualChecklists[doc.type as DocumentType] && (
                          <Button
                            size="sm"
                            variant="default"
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={() =>
                              openManualVerification(docId, doc.type)
                            }
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Manual Verify
                          </Button>
                        )}
                      </div>
                    )}
                  </div>

                  {hasUploads && (
                    <div className="mt-3 space-y-2">
                      {uploadedDocs[docId].map((upload, fileIdx) => (
                        <div
                          key={fileIdx}
                          className="flex flex-col sm:flex-row sm:items-center justify-between p-2 bg-gray-50 rounded text-xs gap-2"
                        >
                          <span className="flex items-center gap-2 overflow-hidden w-full sm:w-auto">
                            <span
                              className="truncate flex-1 sm:flex-none"
                              title={upload.file.name}
                            >
                              📄 {upload.file.name}
                            </span>
                            <Badge
                              variant="outline"
                              className="text-xs shrink-0"
                            >
                              {upload.quality}
                            </Badge>
                          </span>
                          <div className="flex items-center gap-2 self-end sm:self-auto">
                            <span className="text-gray-500 unshrinkable">
                              {(upload.file.size / 1024).toFixed(1)} KB
                            </span>
                            <button
                              onClick={() => onFileRemove(docId, fileIdx)}
                              className="text-red-500 hover:text-red-700 cursor-pointer p-1"
                              title="Remove file"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ))}

                      {doc.status === "ready" ? (
                        <div className="p-2 rounded text-xs bg-green-50 text-green-700">
                          ✓ Document validated successfully
                        </div>
                      ) : (
                        qualityCheck && (
                          <div
                            className={`p-2 rounded text-xs ${
                              qualityCheck.passed
                                ? "bg-primary/10 text-primary"
                                : "bg-red-50 text-red-700"
                            }`}
                          >
                            {qualityCheck.passed
                              ? "✓ File uploaded. Please proceed to validation."
                              : `⚠ Issues found: ${qualityCheck.issues.join(", ")}`}
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto text-gray-300" />
              <p>No documents required based on your 221(g) form selections</p>
              <p className="text-sm mt-1">
                Go back to the 221(g) form checker to select required documents
              </p>
            </div>
          )}
        </div>

        <div className="mt-6 p-4 bg-primary/10 rounded-lg border border-primary/30">
          <h4 className="font-medium text-primary flex items-center">
            <AlertTriangle className="mr-2 h-4 w-4" />
            Document Preparation Tips
          </h4>
          <ul className="mt-2 space-y-1 text-sm text-primary">
            <li>• Make sure all documents are clear and readable</li>
            <li>• Check that names match across all documents</li>
            <li>• Ensure documents are not expired</li>
            <li>• For translations, use certified translators</li>
            <li>• Keep copies of all submitted documents</li>
          </ul>
        </div>
      </CardContent>

      {/* Manual Verification Dialog */}
      <Dialog open={showManualVerify} onOpenChange={setShowManualVerify}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Manual Verification:{" "}
              {manualVerifyDocType?.replace("_", " ").toUpperCase()}
            </DialogTitle>
            <DialogDescription>
              Please manually verify that your document contains the following
              required details.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {currentChecklistItems.map((item) => (
              <div key={item.id} className="flex items-center space-x-2">
                <Checkbox
                  id={item.id}
                  checked={manualChecklist[item.id] || false}
                  onCheckedChange={(checked) =>
                    setManualChecklist((prev) => ({
                      ...prev,
                      [item.id]: !!checked,
                    }))
                  }
                />
                <Label htmlFor={item.id}>{item.label}</Label>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowManualVerify(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleManualVerifySubmit}>
              Confirm & Mark Ready
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Validation Error Dialog */}
      <Dialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Validation Issues Found
            </DialogTitle>
            <DialogDescription>
              We found some issues with your document. Please review them below.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2">
            {validationErrors.map((error, idx) => (
              <div
                key={idx}
                className="p-3 bg-red-50 border border-red-100 rounded-md text-sm text-red-800"
              >
                • {error}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button onClick={() => setShowErrorDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
