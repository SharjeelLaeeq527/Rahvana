"use client";

import { useState, useMemo } from "react";
import { DocumentDefinition } from "@/lib/document-vault/types";
import { useLanguage } from "@/app/context/LanguageContext";
import { useDocumentVaultStore } from "@/lib/document-vault/store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  ProgressTree,
  TreeStep,
} from "@/app/components/progress-tree/ProgressTree";
import {
  ChevronRight,
  ChevronLeft,
  ExternalLink,
  Clock,
  DollarSign,
  Lightbulb,
  FileText,
  Video,
  Link as LinkIcon,
  RotateCcw,
  X,
} from "lucide-react";

interface DocumentWizardProps {
  open: boolean;
  onClose: () => void;
  documentDef: DocumentDefinition;
}

export function DocumentWizard({
  open,
  onClose,
  documentDef,
}: DocumentWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const { t } = useLanguage();

  const completedSteps = useDocumentVaultStore((state) => state.completedSteps);
  const toggleStepCompletion = useDocumentVaultStore(
    (state) => state.toggleStepCompletion,
  );
  const resetDocumentProgress = useDocumentVaultStore(
    (state) => state.resetDocumentProgress,
  );
  const uploadedDocuments = useDocumentVaultStore(
    (state) => state.uploadedDocuments,
  );

  const wizardSteps = useMemo(() => {
    const translatedSteps = t(
      `documentVaultPage.documents.${documentDef.id}.wizardSteps`,
      { returnObjects: true },
    );
    if (
      Array.isArray(translatedSteps) &&
      translatedSteps.length > 0 &&
      typeof translatedSteps[0] !== "string"
    ) {
      return translatedSteps;
    }
    return documentDef.wizardSteps || [];
  }, [documentDef.id, documentDef.wizardSteps, t]);

  const isDocumentUploaded = useMemo(
    () =>
      uploadedDocuments.some(
        (doc) =>
          doc.documentDefId === documentDef.id && doc.status === "UPLOADED",
      ),
    [uploadedDocuments, documentDef.id],
  );

  // Get completed step IDs for this document
  const docCompletedSteps = useMemo(
    () => completedSteps[documentDef.id] || [],
    [completedSteps, documentDef.id],
  );

  // Convert wizard steps to tree steps with completion status
  const treeSteps = useMemo((): TreeStep[] => {
    return wizardSteps.map((step, index) => {
      const stepId = `step-${index}`;
      const isCompleted =
        docCompletedSteps.includes(stepId) || isDocumentUploaded;

      return {
        id: stepId,
        title: step.title,
        description: step.description,
        status: isCompleted
          ? "completed"
          : index === currentStep
            ? "in-progress"
            : "pending",
        onClick: () => {
          if (!isDocumentUploaded) {
            toggleStepCompletion(documentDef.id, stepId);
          }
        },
      };
    });
  }, [
    wizardSteps,
    currentStep,
    documentDef.id,
    docCompletedSteps,
    isDocumentUploaded,
    toggleStepCompletion,
  ]);

  if (wizardSteps.length === 0) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="w-[95vw] sm:w-full p-4 sm:p-6">
          <DialogHeader className="relative">
            <DialogTitle className="pr-8">
              {t(`documentVaultPage.documents.${documentDef.id}.name`) !==
              `documentVaultPage.documents.${documentDef.id}.name`
                ? t(`documentVaultPage.documents.${documentDef.id}.name`)
                : documentDef.name}
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full absolute -top-2 -right-2"
              onClick={onClose}
            >
              <X className="w-4 h-4" />
            </Button>
          </DialogHeader>
          <p className="text-sm sm:text-base text-muted-foreground mt-2">
            {t("documentVaultPage.components.wizard.noGuide")}
          </p>
          <div className="mt-4">
            <Button onClick={onClose} className="w-full sm:w-auto">
              {t("documentVaultPage.components.wizard.close")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const step = wizardSteps[currentStep];

  const getResourceIcon = (type: string) => {
    switch (type) {
      case "video":
        return <Video className="w-4 h-4" />;
      case "pdf":
        return <FileText className="w-4 h-4" />;
      default:
        return <LinkIcon className="w-4 h-4" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 w-[95vw] sm:w-full">
        <DialogHeader className="relative pb-2 mb-2 sm:mb-4 border-b">
          <DialogTitle className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pr-8">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              <span className="text-lg sm:text-xl leading-tight">
                {t("documentVaultPage.components.wizard.howToObtain")}
                {t(`documentVaultPage.documents.${documentDef.id}.name`) !==
                `documentVaultPage.documents.${documentDef.id}.name`
                  ? t(`documentVaultPage.documents.${documentDef.id}.name`)
                  : documentDef.name}
              </span>
              {isDocumentUploaded && (
                <Badge className="bg-green-500 w-fit">
                  {t("documentVaultPage.components.wizard.documentUploaded")}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
              <Badge variant="outline">
                {t("documentVaultPage.components.wizard.stepProgress", {
                  current: currentStep + 1,
                  total: wizardSteps.length,
                })}
              </Badge>
              {!isDocumentUploaded && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (
                      confirm(
                        t("documentVaultPage.components.wizard.resetConfirm"),
                      )
                    ) {
                      resetDocumentProgress(documentDef.id);
                    }
                  }}
                  title={t("documentVaultPage.components.wizard.resetProgress")}
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
              )}
            </div>
          </DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full absolute -top-2 -right-2"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </Button>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left side - Progress Tree */}
          <div className="lg:border-r lg:pr-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {t("documentVaultPage.components.wizard.progressOverview")}
              </h3>
              {!isDocumentUploaded && (
                <p className="text-xs text-muted-foreground">
                  {t("documentVaultPage.components.wizard.clickToMark")}
                </p>
              )}
            </div>
            <ProgressTree
              steps={treeSteps}
              showProgress={true}
              onStepClick={(step) => {
                const stepIndex = parseInt(step.id.split("-")[1]);
                setCurrentStep(stepIndex);
              }}
            />
            {!isDocumentUploaded && (
              <Card className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 border-blue-200">
                <p className="text-xs text-blue-800 dark:text-blue-200">
                  {t("documentVaultPage.components.wizard.tip")}
                </p>
              </Card>
            )}
          </div>

          {/* Right side - Step Details */}
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-bold mb-2">{step.title}</h3>
              <p className="text-muted-foreground">{step.description}</p>
            </div>

            {/* Time and cost estimates */}
            {(step.estimatedTime || step.cost) && (
              <div className="flex gap-4">
                {step.estimatedTime && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span>{step.estimatedTime}</span>
                  </div>
                )}
                {step.cost && (
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                    <span>{step.cost}</span>
                  </div>
                )}
              </div>
            )}

            {/* Tips */}
            {step.tips && step.tips.length > 0 && (
              <Card className="p-4 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-2">
                  <Lightbulb className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                      {t("documentVaultPage.components.wizard.tipsHeading")}
                    </h4>
                    <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
                      {step.tips.map((tip, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-blue-600 dark:text-blue-400 mt-0.5">
                            •
                          </span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Card>
            )}

            {/* Resources */}
            {step.resources && step.resources.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">
                  {t("documentVaultPage.components.wizard.helpfulResources")}
                </h4>
                <div className="space-y-2">
                  {step.resources.map((resource, index) => (
                    <a
                      key={index}
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 border rounded-lg hover:border-brand hover:bg-brand/5 transition-colors"
                    >
                      {getResourceIcon(resource.type)}
                      <span className="flex-1 font-medium">
                        {resource.name}
                      </span>
                      <ExternalLink className="w-4 h-4 text-muted-foreground" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex gap-3 pt-4 border-t mt-6">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
            className="flex-1"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            {t("documentVaultPage.components.wizard.previous")}
          </Button>

          {currentStep < wizardSteps.length - 1 ? (
            <Button
              onClick={() =>
                setCurrentStep(
                  Math.min(wizardSteps.length - 1, currentStep + 1),
                )
              }
              className="flex-1"
            >
              {t("documentVaultPage.components.wizard.next")}
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={onClose} className="flex-1">
              {t("documentVaultPage.components.wizard.done")}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
