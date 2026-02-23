"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CheckCircledIcon,
  InfoCircledIcon,
  ArrowLeftIcon,
  ChevronRightIcon,
  FileTextIcon,
  DownloadIcon,
  CheckIcon,
  Cross2Icon,
  HamburgerMenuIcon,
} from "@radix-ui/react-icons";
import { AlertTriangle, FileCheck, Calendar, PartyPopper } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

import { ActionPlan } from "../utils/actionPlanGenerator";
import { ClassificationResult } from "../utils/classifier";
import { generatePDFPacket, generateCoverLetter } from "../utils/PdfGenerator";
import DocumentChecklist from "./DocumentChecklist";

interface ActionPlanResultsProps {
  classification: ClassificationResult | null;
  actionPlan: ActionPlan | null;
  formData: import("../types/221g").FormData | null;
  selectedItems: import("../types/221g").FormSelections | null;
  onBackToForm: () => void;
  onSaveToProfile: () => Promise<void>;
  planGeneratedAt?: number;
}

interface UploadedFile {
  file: File;
  uploadDate: Date;
  quality: "excellent" | "good" | "needs-review";
}

export default function ActionPlanResults({
  classification,
  actionPlan,
  formData,
  selectedItems,
  onBackToForm,
  onSaveToProfile,
  planGeneratedAt,
}: ActionPlanResultsProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  // Document management
  const [uploadedDocs, setUploadedDocs] = useState<
    Record<string, UploadedFile[]>
  >({});
  const [docQualityChecks, setDocQualityChecks] = useState<
    Record<
      string,
      {
        passed: boolean;
        issues: string[];
      }
    >
  >({});

  // Packet generation
  const [coverLetterData, setCoverLetterData] = useState({
    applicantName: "",
    caseNumber: formData?.caseNumber || "",
    interviewDate: formData?.interviewDate || "",
    embassy: formData?.embassy || "islamabad",
    additionalNotes: "",
  });

  // Ref for tracking document scrolling (for UI)
  // const documentSectionsRef = useRef<Record<string, HTMLElement | null>>({});

  // Restore progress from localStorage on mount
  useEffect(() => {
    const savedProgress = localStorage.getItem("221gActionPlanProgress");
    if (savedProgress) {
      try {
        const progressState = JSON.parse(savedProgress);

        if (planGeneratedAt) {
          if (
            !progressState.planGeneratedAt ||
            progressState.planGeneratedAt !== planGeneratedAt
          ) {
            console.log(
              "New plan generated or legacy state detected, resetting progress",
            );
            // Optional: clear invalid localStorage to avoid confusion?
            // localStorage.removeItem("221gActionPlanProgress");
            return;
          }
        }

        setCurrentStepIndex(progressState.currentStepIndex || 0);
        setCompletedSteps(progressState.completedSteps || []);
        setUploadedDocs(progressState.uploadedDocs || {});
        setDocQualityChecks(progressState.docQualityChecks || {});
        setCoverLetterData((prev) => ({
          ...prev,
          ...progressState.coverLetterData,
        }));
      } catch (error) {
        console.error("Error restoring progress:", error);
      }
    }
  }, [planGeneratedAt]);

  if (!actionPlan || !classification) {
    return (
      <div className="container mx-auto py-8 px-4">
        <p className="text-center text-gray-600">No action plan available</p>
      </div>
    );
  }

  const currentStep = actionPlan.stages[currentStepIndex];
  const totalSteps = actionPlan.stages.length;
  const progressPercentage = Math.round(
    (completedSteps.length / totalSteps) * 100,
  );
  const allStepsCompleted = completedSteps.length === totalSteps;

  const handleMarkComplete = () => {
    if (!completedSteps.includes(currentStepIndex)) {
      setCompletedSteps([...completedSteps, currentStepIndex]);
    }
    if (currentStepIndex < totalSteps - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  const handleRevertStep = (stepIndex: number) => {
    setCompletedSteps((prev) => prev.filter((step) => step !== stepIndex));
  };

  const handleDocumentStatusChange = (
    documentId: string,
    status: "missing" | "in-progress" | "ready" | "submitted",
  ) => {
    // This function can be used to update document statuses in the future
    // For now, we're just logging the change
    console.log(`Document ${documentId} status changed to ${status}`);
  };

  // Save progress to localStorage before navigating back to form
  const handleBackToForm = () => {
    const progressState = {
      currentStepIndex,
      completedSteps,
      uploadedDocs,
      docQualityChecks,
      coverLetterData,
      planGeneratedAt,
    };

    localStorage.setItem(
      "221gActionPlanProgress",
      JSON.stringify(progressState),
    );
    onBackToForm();
  };

  const handleFileUpload = (docId: string, files: FileList) => {
    const newFiles: UploadedFile[] = Array.from(files).map((file) => ({
      file,
      uploadDate: new Date(),
      quality: checkFileQuality(file),
    }));

    setUploadedDocs((prev) => ({
      ...prev,
      [docId]: [...(prev[docId] || []), ...newFiles],
    }));

    performQualityCheck(docId, newFiles);
  };

  const handleRemoveFile = (docId: string, fileIndex: number) => {
    setUploadedDocs((prev) => {
      const currentFiles = prev[docId] || [];
      const updatedFiles = currentFiles.filter((_, idx) => idx !== fileIndex);

      if (updatedFiles.length === 0) {
        const newUploadedDocs = { ...prev };
        delete newUploadedDocs[docId];
        return newUploadedDocs;
      }

      return {
        ...prev,
        [docId]: updatedFiles,
      };
    });
  };

  const checkFileQuality = (
    file: File,
  ): "excellent" | "good" | "needs-review" => {
    const sizeMB = file.size / (1024 * 1024);
    const isPDF = file.type === "application/pdf";

    if (isPDF && sizeMB < 10 && sizeMB > 0.1) return "excellent";
    if (sizeMB > 20) return "needs-review";
    return "good";
  };

  const performQualityCheck = (docId: string, files: UploadedFile[]) => {
    const issues: string[] = [];

    files.forEach(({ file, quality }) => {
      if (quality === "needs-review") {
        if (file.size > 20 * 1024 * 1024) {
          issues.push(`File ${file.name} is too large (> 20MB)`);
        }
        if (file.size < 100 * 1024) {
          issues.push(`File ${file.name} might be too small - check quality`);
        }
      }
    });

    setDocQualityChecks((prev) => ({
      ...prev,
      [docId]: {
        passed: issues.length === 0,
        issues,
      },
    }));
  };

  const handleDownloadPacket = async () => {
    try {
      await generatePDFPacket({
        coverLetterData,
        selectedItems: selectedItems || {},
        uploadedDocs,
      });
    } catch (error) {
      console.error("Error generating PDF packet:", error);
      alert(
        "There was an error generating your PDF packet. Please try again or contact support if the issue persists.",
      );
    }
  };

  const isStepCompleted = (index: number) => completedSteps.includes(index);
  const isStepAccessible = (index: number) =>
    index === 0 || completedSteps.includes(index - 1);

  const SidebarContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <>
      {/* Sidebar Header */}
      <div className="p-6 border-b border-border">
        {!isMobile && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="mb-4 w-full justify-start"
          >
            <HamburgerMenuIcon className="w-4 h-4 mr-2" />
            {!sidebarCollapsed && "Collapse"}
          </Button>
        )}

        {(!sidebarCollapsed || isMobile) && (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Journey Progress
              </h2>
              <span className="text-sm font-bold text-primary">
                {progressPercentage}%
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2 mb-2" />
            <p className="text-xs text-muted-foreground">
              {completedSteps.length} of {totalSteps} steps completed
            </p>
          </>
        )}
      </div>

      {/* Steps List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {(!sidebarCollapsed || isMobile) && (
            <div className="mb-4">
              <Badge variant="outline" className="w-full justify-center py-2">
                {classification?.description}
              </Badge>
            </div>
          )}

          {actionPlan?.stages.map((stage, index) => {
            const isCompleted = isStepCompleted(index);
            const isCurrent = index === currentStepIndex;
            const isAccessible = isStepAccessible(index);

            return (
              <button
                key={index}
                onClick={() =>
                  (isAccessible || isCompleted) && setCurrentStepIndex(index)
                }
                disabled={!isAccessible && !isCompleted}
                className={`w-full text-left p-3 rounded-lg transition-all ${
                  isCurrent
                    ? "bg-primary/10 border-l-4 border-primary shadow-sm"
                    : isCompleted
                      ? "bg-green-500/10 border-l-4 border-green-500"
                      : "hover:bg-muted border-l-4 border-transparent"
                } ${!isAccessible && !isCompleted ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
              >
                {(!sidebarCollapsed || isMobile) && (
                  <div className="flex items-start space-x-3">
                    <div
                      className={`mt-0.5 shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                        isCompleted
                          ? "bg-green-500"
                          : isCurrent
                            ? "bg-primary"
                            : "bg-muted"
                      }`}
                    >
                      {isCompleted ? (
                        <CheckIcon className="w-4 h-4 text-white" />
                      ) : (
                        <span className="text-xs font-semibold text-white">
                          {index + 1}
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <p
                        className={`text-sm font-medium ${
                          isCurrent
                            ? "text-primary"
                            : isCompleted
                              ? "text-green-600"
                              : "text-muted-foreground"
                        }`}
                      >
                        {stage.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {stage.timeframe}
                      </p>
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </ScrollArea>

      {/* Back Button */}
      {(!sidebarCollapsed || isMobile) && (
        <div className="p-4 border-t border-border">
          <Button
            variant="outline"
            onClick={handleBackToForm}
            className="w-full"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Back to Form
          </Button>
        </div>
      )}
    </>
  );

  return (
    <div className="flex flex-col md:flex-row bg-background">
      {/* Desktop Sidebar */}
      <div
        className={`${sidebarCollapsed ? "w-20" : "w-80"} hidden md:flex bg-card border-r border-border flex-col transition-all duration-300 shadow-lg sticky top-0 h-screen`}
      >
        <SidebarContent />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="md:hidden p-4 border-b flex items-center justify-between bg-card text-card-foreground">
          <span className="font-semibold">Action Plan</span>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <HamburgerMenuIcon className="w-4 h-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 flex flex-col w-80">
              <SidebarContent isMobile={true} />
            </SheetContent>
          </Sheet>
        </div>

        <div className="max-w-6xl mx-auto p-4 md:p-8">
          {!allStepsCompleted ? (
            <>
              {/* Step Header */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <Badge variant="secondary">
                    Step {currentStepIndex + 1} of {totalSteps}
                  </Badge>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {currentStep?.timeframe || "Timeframe not specified"}
                  </Badge>
                </div>
                <h1 className="text-4xl font-bold text-foreground mb-2">
                  {currentStep?.title || "Untitled Step"}
                </h1>
                <p className="text-lg text-muted-foreground">
                  Complete these actions to move forward with your case
                </p>
              </div>

              <Tabs defaultValue="actions" className="mb-6">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="actions">Actions</TabsTrigger>
                  <TabsTrigger value="documents">Documents</TabsTrigger>
                  <TabsTrigger value="tips">Tips</TabsTrigger>
                </TabsList>

                <TabsContent value="actions" className="mt-6">
                  <Card>
                    <CardHeader className="bg-primary/10">
                      <CardTitle className="text-lg font-semibold text-primary flex items-center">
                        <CheckCircledIcon className="w-5 h-5 mr-2" />
                        Required Actions
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        {currentStep?.actions?.map((action, idx) => (
                          <div
                            key={idx}
                            className="flex items-start space-x-4 p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                          >
                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                              <span className="text-sm font-bold text-primary">
                                {idx + 1}
                              </span>
                            </div>
                            <p className="text-foreground leading-relaxed flex-1">
                              {action}
                            </p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="documents" className="mt-6">
                  <Card>
                    <CardHeader className="bg-amber-500/10">
                      <CardTitle className="text-lg font-semibold text-amber-700 flex items-center">
                        <FileTextIcon className="w-5 h-5 mr-2" />
                        Required Documents
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <DocumentChecklist
                        selectedItems={selectedItems || {}}
                        onDocumentStatusChange={handleDocumentStatusChange}
                        onFileUpload={handleFileUpload}
                        onFileRemove={handleRemoveFile}
                        uploadedDocs={uploadedDocs}
                        docQualityChecks={docQualityChecks}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="tips" className="mt-6">
                  <Card className="border-primary bg-primary/10">
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold text-primary flex items-center">
                        <InfoCircledIcon className="w-5 h-5 mr-2" />
                        Tips & Best Practices
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3">
                        {currentStep?.tips?.map((tip, idx) => (
                          <li
                            key={idx}
                            className="flex items-start space-x-3 p-3 bg-card rounded-lg"
                          >
                            <span className="text-primary text-xl">💡</span>
                            <span className="text-primary leading-relaxed">
                              {tip}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              {/* Navigation */}
              <div className="flex items-center justify-between pt-6 border-t border-border">
                <Button
                  variant="outline"
                  onClick={() =>
                    currentStepIndex > 0 &&
                    setCurrentStepIndex(currentStepIndex - 1)
                  }
                  disabled={currentStepIndex === 0}
                  size="lg"
                >
                  <ArrowLeftIcon className="w-4 h-4 mr-2" />
                  Previous
                </Button>

                <div className="text-sm text-muted-foreground">
                  Step {currentStepIndex + 1} of {totalSteps}
                </div>

                <Button
                  onClick={
                    completedSteps.includes(currentStepIndex)
                      ? () => handleRevertStep(currentStepIndex)
                      : handleMarkComplete
                  }
                  className={
                    completedSteps.includes(currentStepIndex)
                      ? "bg-gray-500 hover:bg-gray-600 text-white"
                      : "bg-teal-500 hover:bg-teal-600 text-white"
                  }
                  size="lg"
                >
                  {completedSteps.includes(currentStepIndex) ? (
                    <>
                      <Cross2Icon className="w-4 h-4 mr-2" />
                      Revert Step
                    </>
                  ) : (
                    <>
                      Mark Complete
                      <ChevronRightIcon className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </>
          ) : (
            /* Completion & Packet Generation */
            <div className="text-center py-12">
              <div className="mb-8">
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                  <CheckCircledIcon className="w-16 h-16 text-green-600" />
                </div>
                <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-3">
                  Congratulations!{" "}
                  <PartyPopper className="w-12 h-12 text-yellow-500" />
                </h1>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                  You&apos;ve completed all preparation steps. Now let&apos;s
                  create your submission packet.
                </p>
              </div>

              {/* Packet Builder */}
              <Card className="max-w-4xl mx-auto mb-8 text-left">
                <CardHeader className="bg-linear-to-r from-primary/30 to-primary/70">
                  <CardTitle className="text-2xl font-bold text-foreground">
                    Submission Packet Builder
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="block text-sm font-medium mb-2">
                        Applicant Name *
                      </Label>
                      <Input
                        value={coverLetterData.applicantName}
                        onChange={(e) =>
                          setCoverLetterData({
                            ...coverLetterData,
                            applicantName: e.target.value,
                          })
                        }
                        placeholder="Full name as on passport"
                      />
                    </div>
                    <div>
                      <Label className="block text-sm font-medium mb-2">
                        Case Number *
                      </Label>
                      <Input
                        value={coverLetterData.caseNumber}
                        onChange={(e) =>
                          setCoverLetterData({
                            ...coverLetterData,
                            caseNumber: e.target.value,
                          })
                        }
                        placeholder="From 221(g) letter"
                      />
                    </div>
                    <div>
                      <Label className="block text-sm font-medium mb-2">
                        Interview Date *
                      </Label>
                      <Input
                        type="date"
                        value={coverLetterData.interviewDate}
                        onChange={(e) =>
                          setCoverLetterData({
                            ...coverLetterData,
                            interviewDate: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label className="block text-sm font-medium mb-2">
                        Embassy *
                      </Label>
                      <Input
                        value={coverLetterData.embassy}
                        onChange={(e) =>
                          setCoverLetterData({
                            ...coverLetterData,
                            embassy: e.target.value,
                          })
                        }
                        placeholder="e.g., islamabad"
                        disabled
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="block text-sm font-medium mb-2">
                      Additional Notes (Optional)
                    </Label>
                    <Textarea
                      value={coverLetterData.additionalNotes}
                      onChange={(e) =>
                        setCoverLetterData({
                          ...coverLetterData,
                          additionalNotes: e.target.value,
                        })
                      }
                      placeholder="Any additional information for the consular officer"
                      rows={4}
                    />
                  </div>

                  <Alert>
                    <FileCheck className="h-4 w-4" />
                    <AlertDescription>
                      Your packet will include: Cover letter, Document index,
                      and all uploaded documents
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>

              {/* Download Actions */}
              <div className="flex flex-col sm:flex-row flex-wrap gap-4 justify-center mb-8">
                <Button
                  onClick={handleDownloadPacket}
                  size="lg"
                  className="bg-teal-600 hover:bg-teal-700 text-lg px-8"
                  disabled={
                    !coverLetterData.applicantName ||
                    !coverLetterData.caseNumber
                  }
                >
                  <DownloadIcon className="w-5 h-5 mr-2" />
                  Generate Packet (PDF)
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="text-lg px-8"
                  onClick={async () => {
                    const { generateRequiredDocumentsList } =
                      await import("../utils/documentDefinitions");
                    const docs = generateRequiredDocumentsList(
                      selectedItems || {},
                    );
                    const coverLetter = generateCoverLetter(
                      coverLetterData,
                      docs,
                    );
                    const printWindow = window.open("", "_blank");
                    if (printWindow) {
                      printWindow.document.write(`
                        <!DOCTYPE html>
                        <html>
                          <head>
                            <title>Cover Letter Preview</title>
                            <style>
                              body { font-family: Arial, sans-serif; margin: 40px; }
                              h1 { color: #1f2937; }
                              pre { white-space: pre-wrap; }
                            </style>
                          </head>
                          <body>
                            <h1>Cover Letter Preview</h1>
                            <pre>${coverLetter.replace(/\n/g, "<br>")}</pre>
                          </body>
                        </html>
                      `);
                      printWindow.document.close();
                      printWindow.focus();
                    }
                  }}
                >
                  <FileTextIcon className="w-5 h-5 mr-2" />
                  Preview Cover Letter
                </Button>

                <Button
                  variant="secondary"
                  size="lg"
                  className="text-lg px-8 bg-primary/10 hover:bg-primary/30 text-primary"
                  disabled={saving}
                  onClick={async () => {
                    setSaving(true);
                    await onSaveToProfile();
                    setSaveMessage("Saved!");
                    setTimeout(() => setSaveMessage(""), 3000);
                    setSaving(false);
                  }}
                >
                  {saving
                    ? "Saving..."
                    : saveMessage || "Save Results to Profile"}
                </Button>
              </div>

              {/* Next Steps */}
              <Card className="max-w-3xl mx-auto bg-yellow-500/10 border-yellow-500/20">
                <CardHeader>
                  <CardTitle className="flex items-center text-yellow-700">
                    <AlertTriangle className="w-5 h-5 mr-2" />
                    Important: Next Steps After Download
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="text-left space-y-2 text-yellow-700">
                    <li className="flex items-start">
                      <CheckCircledIcon className="w-5 h-5 mr-2 mt-0.5 shrink-0" />
                      Review the complete packet for accuracy and completeness
                    </li>
                    <li className="flex items-start">
                      <CheckCircledIcon className="w-5 h-5 mr-2 mt-0.5 shrink-0" />
                      Submit via your embassy&apos;s specified method
                      (courier/email/in-person)
                    </li>
                    <li className="flex items-start">
                      <CheckCircledIcon className="w-5 h-5 mr-2 mt-0.5 shrink-0" />
                      Keep proof of submission (tracking number, receipt,
                      confirmation email)
                    </li>
                    <li className="flex items-start">
                      <CheckCircledIcon className="w-5 h-5 mr-2 mt-0.5 shrink-0" />
                      Monitor your CEAC status regularly (every 2-3 days)
                    </li>
                    <li className="flex items-start">
                      <CheckCircledIcon className="w-5 h-5 mr-2 mt-0.5 shrink-0" />
                      Wait 4-6 weeks before sending a status inquiry
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
