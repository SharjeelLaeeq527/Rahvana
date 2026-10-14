"use client";

import React, { Suspense } from "react";
import { MessageSquare, Wrench } from "lucide-react";
import { useJourneyEnvironment } from "@/app/context/JourneyEnvironmentContext";
import { useCandidate } from "@/app/context/CandidateContext";
import { usePlan } from "@/app/context/PlanContext";
import { useDocumentVaultStore } from "@/lib/document-vault/store";
import {
  isJourneyRequestLocked,
  isPccRequestLocked,
  isConsultationRequestLocked,
  pccExpiryDate,
  pccRenewalDate,
  type JourneyServiceRecord,
} from "@/lib/journey/toolModeGuards";
import { getEffectiveDocDef } from "@/app/components/journey-engine/StepView";
import { DocActionModal } from "./components/DocActionModal";
import { DocumentUploadModal } from "@/app/components/document-vault/DocumentUploadModal";
// Consultation is opened directly from the journey Services toolbox and must appear
// instantly as a full-screen overlay (no Suspense loading flash), so it is statically
// imported here rather than React.lazy — mirroring how the step-based Medical/PCC
// overlays mount their tools.
import BookConsultationTool from "@/components/tools/BookConsultationTool";

// Lazy-load mode-aware tool components
const SponsorshipCalculatorTool = React.lazy(
  () => import("@/components/tools/SponsorshipCalculatorTool")
);
const PassportPhotoTool = React.lazy(() => import("@/components/tools/PassportPhotoTool"));
// const PassportOcrTool = React.lazy(() => import("@/components/tools/PassportOcrTool"));
const DocumentTranslationTool = React.lazy(
  () => import("@/components/tools/DocumentTranslationTool")
);
const PdfToolkitTool = React.lazy(() => import("@/components/tools/PdfToolkitTool"));
const SnapAndSignTool = React.lazy(() => import("@/components/tools/SnapAndSignTool"));
const DqStatusCheckTool = React.lazy(() => import("@/components/tools/DqStatusCheckTool"));
const MedicalAppointmentTool = React.lazy(
  () => import("@/components/tools/MedicalAppointmentTool")
);
const PccFilingTool = React.lazy(() => import("@/components/tools/PccFilingTool"));
const InterviewPrepTool = React.lazy(() =>
  import("./components/InterviewPrepTool").then((m) => ({ default: m.InterviewPrepTool }))
);
const Input221gTool = React.lazy(() =>
  import("./components/Input221gTool").then((m) => ({ default: m.Input221gTool }))
);
const Respond221gTool = React.lazy(() =>
  import("./components/Respond221gTool").then((m) => ({ default: m.Respond221gTool }))
);
const MultiStepForm = React.lazy(() =>
  import("@/app/components/forms/auto-visaform-filling/MultiStepForm").then((m) => ({
    default: m.MultiStepForm,
  }))
);
// const MedicalExamTool = React.lazy(() =>
//   import("./components/MedicalExamTool").then((m) => ({ default: m.MedicalExamTool }))
// );
// const PoliceClearanceTool = React.lazy(() =>
//   import("./components/PoliceClearanceTool").then((m) => ({ default: m.PoliceClearanceTool }))
// );
// const MedicalExamGuideTool = React.lazy(() =>
//   import("./components/MedicalExamGuideTool").then((m) => ({ default: m.MedicalExamGuideTool }))
// );
// const InterviewDayTool = React.lazy(() =>
//   import("./components/InterviewDayTool").then((m) => ({ default: m.InterviewDayTool }))
// );
// const PolioCertificateTool = React.lazy(() =>
//   import("./components/PolioCertificateTool").then((m) => ({ default: m.PolioCertificateTool }))
// );
// const DqRecordingTool = React.lazy(() =>
//   import("./components/DqRecordingTool").then((m) => ({ default: m.DqRecordingTool }))
// );

import { GuidePageOverlay } from "@/app/components/shared/GuidePageOverlay";
import { getOverlayPageRoute } from "@/lib/constants/journey-app-groups";

interface EmbeddedToolContainerProps {
  toolKey: string;
  onClose?: () => void;
  data?: unknown;
  state?: unknown;
  actions?: unknown;
  journeyTier?: string;
  /** When the tool was launched from a specific roadmap step (e.g. the Medical/PCC
   *  module cards), completing the service should also tick that step off. Passed by
   *  RoadmapLayoutEngine when a step card launches a tool via the shared breadcrumb. */
  autoCompleteStepKey?: string | null;
}

function ToolSkeleton() {
  return (
    <div className="flex w-full animate-pulse flex-col gap-6 p-8">
      <div className="h-8 w-64 rounded-lg bg-slate-200" />
      <div className="h-4 w-96 rounded bg-slate-100" />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="h-64 rounded-2xl bg-slate-100" />
        <div className="h-64 rounded-2xl bg-slate-100" />
      </div>
    </div>
  );
}

/**
 * Guides (and page-backed services) launched from the journey toolbox mount the
 * REAL guide page via GuidePageOverlay: no route change, and for a guide that
 * overlay is a full-screen shell with a single close button (no site header, no
 * journey nav, no wizard header). Closing it returns to the journey dashboard.
 */
function InlineJourneyGuidePage({
  toolKey,
  journeyTier,
  onClose,
}: {
  toolKey: string;
  journeyTier: string;
  onClose?: () => void;
}) {
  const route = getOverlayPageRoute(toolKey);
  const [isOpen, setIsOpen] = React.useState(true);

  const handleClose = React.useCallback(() => {
    setIsOpen(false);
    onClose?.();
  }, [onClose]);

  if (!route) return null;

  return (
    <GuidePageOverlay guideUrl={isOpen ? route : null} onClose={handleClose} tier={journeyTier} />
  );
}

function Journey221gEmbeddedTool({
  state,
  actions,
  journeyContext,
}: {
  state: any;
  actions: any;
  journeyContext: any;
}) {
  const hasSavedSelections = Boolean(state?.metadata?.twentyTwoOneGSelections);
  const [isEditing, setIsEditing] = React.useState(!hasSavedSelections);

  const plan = usePlan();
  const {
    openUploadModal,
    uploadModalOpen,
    closeUploadModal,
    selectedDocumentDefId,
    reloadDocuments,
  } = useDocumentVaultStore();

  const [activeUploadId, setActiveUploadId] = React.useState<string | null>(null);
  const [activeUploadType, setActiveUploadType] = React.useState<"doc" | "hh" | "financial" | null>(
    null
  );
  const [upgradeModalFeature, setUpgradeModalFeature] = React.useState<string | null>(null);

  const [docActionModal, setDocActionModal] = React.useState<{
    isOpen: boolean;
    doc: any | null;
    title?: string;
    subtitle?: string;
    onReadGuide?: () => void;
    onUpload?: () => void;
  }>({
    isOpen: false,
    doc: null,
  });

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 sm:px-6 lg:px-8">
      {isEditing || !hasSavedSelections ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              221(g) Refusal Worksheet
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select the refusal reasons marked on your 221(g) slip to generate your custom action
              plan and document checklist.
            </p>
          </div>
          <Input221gTool
            tool={{ type: "input_221g" }}
            state={state || {}}
            actions={{
              ...actions,
              updateMetadata: (updates: any) => {
                actions?.updateMetadata?.(updates);
                setIsEditing(false);
              },
            }}
          />
        </div>
      ) : (
        <div className="flex flex-col gap-4 pt-3">
          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
            <div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                Action Plan generated for your logged 221(g) requirements
              </span>
            </div>
            <button
              onClick={() => setIsEditing(true)}
              className="text-xs font-bold text-[#0d7377] hover:underline dark:text-teal-400"
            >
              Edit 221(g) Selections
            </button>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <Respond221gTool
              tool={{ type: "respond_221g" }}
              state={state || {}}
              actions={actions || {}}
              setDocActionModal={setDocActionModal}
              openUploadModal={openUploadModal}
              setActiveUploadId={setActiveUploadId}
              setActiveUploadType={setActiveUploadType}
            />
          </div>
        </div>
      )}

      {/* DocActionModal integration for checklist item clicks */}
      {docActionModal.isOpen && (
        <DocActionModal
          isOpen={docActionModal.isOpen}
          onClose={() => setDocActionModal({ ...docActionModal, isOpen: false })}
          docActionModal={docActionModal}
          setDocActionModal={setDocActionModal}
          plan={plan}
          docActionUpgradeFeature={upgradeModalFeature}
          setDocActionUpgradeFeature={setUpgradeModalFeature}
          sId="step_3_12"
        />
      )}

      {/* DocumentUploadModal integration */}
      {uploadModalOpen && selectedDocumentDefId && getEffectiveDocDef(selectedDocumentDefId) && (
        <DocumentUploadModal
          open={uploadModalOpen}
          onClose={closeUploadModal}
          documentDef={getEffectiveDocDef(selectedDocumentDefId)!}
          activeJourneyId={state?.backendId || journeyContext?.journeyId || null}
          onUploadComplete={async () => {
            await reloadDocuments();
            if (activeUploadId && actions?.updateDocumentStatus) {
              await actions.updateDocumentStatus(activeUploadId, "reviewed");
            }
          }}
        />
      )}
    </div>
  );
}

function JourneyVisaFormsEmbeddedTool({
  journeyContext,
  effectiveJourneyTier,
  initialFormCode,
  onClose,
}: {
  journeyContext: any;
  effectiveJourneyTier: string;
  initialFormCode?: string;
  onClose?: () => void;
}) {
  const category = (journeyContext?.journeyCategory || "").toUpperCase();
  const availableForms = React.useMemo(() => {
    if (category.includes("IR-1") || category.includes("CR-1")) {
      return [
        { code: "i130", label: "I-130", title: "Petition for Alien Relative" },
        { code: "i130a", label: "I-130A", title: "Supplemental Info for Spouse Beneficiary" },
        { code: "ds260", label: "DS-260", title: "Online Immigrant Visa Application" },
        { code: "i864", label: "I-864", title: "Affidavit of Support" },
        { code: "i864ez", label: "I-864EZ", title: "Affidavit of Support (Short Form)" },
        { code: "i864a", label: "I-864A", title: "Contract Between Sponsor & Household Member" },
        { code: "g1450", label: "G-1450", title: "Credit Card Payment Authorization" },
      ];
    }
    if (category.includes("IR-5")) {
      return [
        { code: "i130", label: "I-130", title: "Petition for Alien Relative (Parent)" },
        { code: "ds260", label: "DS-260", title: "Online Immigrant Visa Application" },
        { code: "i864", label: "I-864", title: "Affidavit of Support" },
        { code: "i864ez", label: "I-864EZ", title: "Affidavit of Support (Short Form)" },
        { code: "i864a", label: "I-864A", title: "Contract Between Sponsor & Household Member" },
        { code: "g1450", label: "G-1450", title: "Credit Card Payment Authorization" },
      ];
    }
    return [
      { code: "i130", label: "I-130", title: "Petition for Alien Relative" },
      { code: "ds260", label: "DS-260", title: "Online Immigrant Visa Application" },
      { code: "i864", label: "I-864", title: "Affidavit of Support" },
      { code: "g1450", label: "G-1450", title: "Credit Card Payment Authorization" },
    ];
  }, [category]);

  const [selectedForm, setSelectedForm] = React.useState<string>(
    initialFormCode || availableForms[0]?.code || "i130"
  );

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-2 sm:px-4">
      {/* Form Picker Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="mr-1 shrink-0 text-xs font-bold tracking-wider text-slate-500 uppercase">
          Visa Form:
        </span>
        {availableForms.map((form) => {
          const isSelected = selectedForm === form.code;
          return (
            <button
              key={form.code}
              onClick={() => setSelectedForm(form.code)}
              className={`shrink-0 cursor-pointer rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                isSelected
                  ? "bg-[#0d7377] text-white shadow-xs"
                  : "border border-slate-200 bg-white text-slate-700 hover:border-teal-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              }`}
              title={form.title}
            >
              <span>{form.label}</span>
            </button>
          );
        })}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <MultiStepForm
          key={`${selectedForm}_${journeyContext?.candidateId || "candidate-1"}`}
          formCode={selectedForm}
          mode="journey"
          journeyContext={journeyContext}
          journeyTier={effectiveJourneyTier}
          isEmbedded={true}
          onClose={onClose}
        />
      </div>
    </div>
  );
}

import { UpgradeModal } from "@/app/components/entitlements/UpgradeModal";
import { useJourneyPlan } from "@/app/context/useJourneyPlan";
import { TOOL_FEATURE_MAP } from "@/lib/constants/journey-app-groups";
import { useJourneyServiceStatus } from "@/lib/journey/useJourneyServiceStatus";
import { Lock, ArrowRight } from "lucide-react";

function LockedToolGate({
  featureKey,
  targetTier,
  lockHint,
  ctaText,
  toolTitle,
}: {
  featureKey: string;
  targetTier: string | null;
  lockHint: string;
  ctaText: string | null;
  toolTitle?: string;
}) {
  const [showUpgrade, setShowUpgrade] = React.useState(false);
  const tierIconClass = targetTier ? `plan-icon--${targetTier}` : "plan-icon--premium";

  return (
    <>
      {showUpgrade && <UpgradeModal feature={featureKey} onClose={() => setShowUpgrade(false)} />}
      <div className="flex w-full flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xs sm:p-12 dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
          <Lock className="h-8 w-8" />
        </div>

        {targetTier && (
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
            <span className={`plan-icon ${tierIconClass} scale-110`} aria-hidden="true" />
            <span className="uppercase">{targetTier} Plan Required</span>
          </div>
        )}

        <h3 className="text-xl font-bold text-slate-900 sm:text-2xl dark:text-slate-100">
          {toolTitle || "Tool"} is locked on your current plan
        </h3>

        <p className="mt-2 max-w-md text-sm text-slate-600 dark:text-slate-400">
          {lockHint ||
            "Upgrade your journey plan to unlock full access to this tool, official guides, and verified candidate auto-saving."}
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => setShowUpgrade(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-[#0d7377] px-6 py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-[#095457] hover:shadow-lg active:scale-98"
          >
            <span>{ctaText || "Upgrade Plan"}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </>
  );
}

export function EmbeddedToolContainer({
  toolKey,
  state,
  actions,
  journeyTier = "free",
  data,
  onClose,
  autoCompleteStepKey,
}: EmbeddedToolContainerProps) {
  const { journeySlug, candidateId } = useJourneyEnvironment();
  const { activeCandidate } = useCandidate();

  const resolvedState = state as
    | {
        backendId?: string;
        candidateId?: string;
        subscriptionTier?: string;
        subscription_tier?: string;
        metadata?: any;
      }
    | undefined;

  const effectiveJourneyTier =
    resolvedState?.subscriptionTier ?? resolvedState?.subscription_tier ?? journeyTier ?? "free";

  const plan = useJourneyPlan(resolvedState || { subscriptionTier: effectiveJourneyTier });
  const featureKey = TOOL_FEATURE_MAP[toolKey];
  const isToolLocked = featureKey ? plan.isLocked(featureKey) : false;

  const journeyCategoryRaw = (data as { journey_type?: string })?.journey_type;
  // Normalize to match the StepView overlays (e.g. "IR-5"/"IR5" → token "IR5" →
  // category "IR-5", slug "ir5-journey"). A mismatch here would make the journey-
  // scoped request query return nothing, so the service card wouldn't render.
  const journeyTypeToken = String(journeyCategoryRaw || "IR5")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
  const journeyCategory = journeyTypeToken.startsWith("IR")
    ? `IR-${journeyTypeToken.slice(2)}`
    : journeyCategoryRaw || "IR-5";
  const resolvedSlug = journeyCategoryRaw
    ? `${journeyTypeToken.toLowerCase()}-journey`
    : journeySlug || "ir5-journey";

  const resolvedCandidateId =
    (state as any)?.candidateId ||
    resolvedState?.candidateId ||
    candidateId ||
    activeCandidate?.id ||
    "candidate-1";

  const resolvedBackendId = (state as any)?.backendId || resolvedState?.backendId || null;

  const journeyContext = {
    journeySlug: resolvedSlug,
    journeyCategory,
    journeyId: resolvedBackendId || resolvedSlug || "journey",
    candidateId: resolvedCandidateId,
    backendId: resolvedBackendId,
    subscriptionTier: effectiveJourneyTier,
  };

  // Journey-scoped service requests → surfaced as My-Resources-style cards on the
  // embedded Medical/PCC intro screens, and used to lock re-booking while a request
  // is still active (only fetched when one of those tools is open).
  const isMedicalTool = toolKey === "medical_appointment";
  const isPccTool = toolKey === "police_verification";
  const isConsultationTool = toolKey === "expert_consultation";
  const isServiceTool = isMedicalTool || isPccTool || isConsultationTool;

  const serviceStatus = useJourneyServiceStatus({
    journeySlug: resolvedSlug,
    candidateId: resolvedCandidateId,
    medicalMetadata: (resolvedState?.metadata?.medicalBooking as JourneyServiceRecord) ?? null,
    pccMetadata: (resolvedState?.metadata?.pccFiling as JourneyServiceRecord) ?? null,
    consultationMetadata: resolvedState?.metadata?.consultationBooking as
      JourneyServiceRecord | null | undefined,
    updateMetadata: (actions as { updateMetadata?: (updates: Record<string, unknown>) => void })
      ?.updateMetadata,
    enabled: isServiceTool,
  });

  // Medical: locked until the scheduled appointment date passes. PCC: locked while
  // in progress, then for the 4-month renewal margin after receipt (a two-month buffer
  // inside the certificate's true 6-month validity).
  // The tool intro uses `loading` to render a neutral "Checking…" placeholder,
  // then swaps to either the amber lock banner (locked=true) or the CTA (locked=false).
  const serviceLoading = serviceStatus.loading;
  const medicalLocked = isJourneyRequestLocked(serviceStatus.medicalRecord);
  const pccLocked = isPccRequestLocked(serviceStatus.pccRecord);
  const pccValidUntil = pccExpiryDate(serviceStatus.pccRecord);
  const pccRenewal = pccRenewalDate(serviceStatus.pccRecord);

  const consultationLocked = isConsultationRequestLocked(serviceStatus.consultationRecord);
  const consultationLockHint = serviceStatus.consultationRecord?.referenceDate
    ? `A consultation is already scheduled for ${serviceStatus.consultationRecord.referenceDate}. You can book another once it takes place.`
    : "You already have an active consultation. You can book another once its session takes place.";

  const medicalLockHint = serviceStatus.medicalRecord?.referenceDate
    ? `An appointment is already scheduled for ${serviceStatus.medicalRecord.referenceDate}. You can book another once that date has passed.`
    : "You already have an active medical appointment. You can book another once its appointment date passes.";

  const pccLockHint =
    serviceStatus.pccRecord?.status === "received"
      ? `Your certificate is valid until ${pccValidUntil ?? "its expiry"}. You can file your next request${pccRenewal ? ` from ${pccRenewal}` : ""} — we open renewals two months early so there is no gap.`
      : "Your PCC application is still in progress. You can file another once you receive it and the lock period ends.";

  // Persist the newly-created request to journey metadata, then refresh the card list.
  const saveServiceRecord = (
    key: "medicalBooking" | "pccFiling" | "consultationBooking",
    record: unknown
  ) => {
    (actions as { updateMetadata?: (u: Record<string, unknown>) => void })?.updateMetadata?.({
      [key]: record,
    });
    // When launched from a roadmap step, mark that step complete on successful save.
    // Guard against re-toggling an already-complete step off (toggleComplete is a toggle).
    if (autoCompleteStepKey) {
      const alreadyComplete = (
        state as { completedSteps?: Set<string> } | undefined
      )?.completedSteps?.has?.(autoCompleteStepKey);
      if (!alreadyComplete) {
        (actions as { toggleComplete?: (id: string) => void })?.toggleComplete?.(
          autoCompleteStepKey
        );
      }
    }
    serviceStatus.refetch();
    onClose?.();
  };

  const renderToolComponent = () => {
    if (isToolLocked && featureKey) {
      const targetTier = plan.entitlement(featureKey)?.upgradeTarget || null;
      const lockHint = plan.lockHint(featureKey);
      const ctaText = plan.upgradeCTA(featureKey);
      const toolTitle = toolKey.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

      return (
        <LockedToolGate
          featureKey={featureKey}
          targetTier={targetTier}
          lockHint={lockHint}
          ctaText={ctaText}
          toolTitle={toolTitle}
        />
      );
    }

    switch (toolKey) {
      case "sponsorship_calculator":
        return (
          <SponsorshipCalculatorTool
            isOpen={true}
            onClose={onClose}
            embedded
            mode="journey"
            journeyContext={journeyContext}
            journeyTier={effectiveJourneyTier}
            initialData={{
              ...((state as any)?.metadata?.sponsorshipResult?.raw || {}),
            }}
          />
        );

      case "passport_photo":
        return (
          <PassportPhotoTool
            showHeader={false}
            showRequirements={true}
            mode="journey"
            journeyContext={journeyContext}
            journeyTier={effectiveJourneyTier}
          />
        );

      case "doc_translation":
        return (
          <DocumentTranslationTool
            showHeader={false}
            showRequirements={true}
            showRequestsLink={false}
            mode="journey"
            journeyContext={journeyContext}
            journeyTier={effectiveJourneyTier}
          />
        );

      case "medical_appointment":
        return (
          <MedicalAppointmentTool
            isOpen={true}
            onClose={onClose}
            embedded
            mode="journey"
            journeyContext={journeyContext}
            journeyTier={effectiveJourneyTier}
            existingRequests={serviceStatus.medicalRows}
            statusLoading={serviceLoading}
            locked={medicalLocked}
            lockHint={medicalLockHint}
            initialData={(resolvedState?.metadata?.medicalBooking as Record<string, unknown>) || {}}
            onSave={(record) => saveServiceRecord("medicalBooking", record)}
          />
        );

      case "police_verification":
        return (
          <PccFilingTool
            isOpen={true}
            onClose={onClose}
            embedded
            mode="journey"
            journeyContext={journeyContext}
            journeyTier={effectiveJourneyTier}
            existingRequests={serviceStatus.pccRows}
            statusLoading={serviceLoading}
            locked={pccLocked}
            lockHint={pccLockHint}
            initialData={(resolvedState?.metadata?.pccFiling as Record<string, unknown>) || {}}
            onSave={(record) => saveServiceRecord("pccFiling", record)}
          />
        );

      // case "interview_prep":
      //   return (

      //   );

      case "action_221g":
        return (
          <Journey221gEmbeddedTool
            state={state}
            actions={actions}
            journeyContext={journeyContext}
          />
        );

      // case "medical_appointment":
      //   return (

      //   );

      case "pcc_guide":
      case "polio_vaccination_guide":
      case "passport_guide":
      case "cnic_guide":
      case "birth_certificate_guide":
      case "frc_guide":
      case "marriage_guide":
        return (
          <InlineJourneyGuidePage
            toolKey={toolKey}
            journeyTier={effectiveJourneyTier}
            onClose={onClose}
          />
        );

      case "expert_consultation":
        return (
          <BookConsultationTool
            isOpen={true}
            onClose={onClose}
            embedded
            mode="journey"
            journeyContext={journeyContext}
            journeyTier={effectiveJourneyTier}
            existingRequests={serviceStatus.consultationRows}
            statusLoading={serviceLoading}
            locked={consultationLocked}
            lockHint={consultationLockHint}
            initialData={
              (resolvedState?.metadata?.consultationBooking as Record<string, unknown>) || {}
            }
            onSave={(record) => saveServiceRecord("consultationBooking", record)}
          />
        );

      case "pdf_toolkit":
        return (
          <div className="mx-auto w-full max-w-7xl px-4 pt-4 sm:px-6 sm:pt-6 lg:px-8">
            <PdfToolkitTool
              showHeader={false}
              mode="journey"
              journeyContext={journeyContext}
              journeyTier={effectiveJourneyTier}
            />
          </div>
        );

      case "snap_and_sign":
        return (
          <div className="mx-auto w-full max-w-7xl px-4 pt-4 sm:px-6 sm:pt-6 lg:px-8">
            <SnapAndSignTool
              showHeader={false}
              showTips={true}
              mode="journey"
              journeyContext={journeyContext}
              journeyTier={effectiveJourneyTier}
            />
          </div>
        );

      case "dq_status_check":
        return (
          <div className="mx-auto w-full max-w-7xl px-4 pt-4 sm:px-6 sm:pt-6 lg:px-8">
            <DqStatusCheckTool
              showHeader={false}
              mode="journey"
              journeyContext={journeyContext}
              journeyTier={effectiveJourneyTier}
            />
          </div>
        );

      case "visa_forms":
        return (
          <JourneyVisaFormsEmbeddedTool
            journeyContext={journeyContext}
            effectiveJourneyTier={effectiveJourneyTier}
            initialFormCode={(data as any)?.formCode || (data as any)?.form_id || "i130"}
            onClose={onClose}
          />
        );

      default:
        return (
          <div className="rounded-2xl border border-teal-500/20 bg-teal-50/50 p-8 text-center">
            <Wrench className="mx-auto mb-3 h-10 w-10 text-[#0d7377]" />
            <h3 className="text-lg font-bold text-slate-900">Journey Tool</h3>
            <p className="mt-1 text-sm text-slate-600">
              This tool is active in your journey environment and saves progress automatically.
            </p>
          </div>
        );
    }
  };

  const isDocTranslation = toolKey === "doc_translation" || toolKey === "document_translation";

  return (
    <div
      className={`animate-in fade-in w-full pb-10 duration-200 ${
        isDocTranslation ? "pt-10" : "pt-4 sm:pt-6"
      }`}
    >
      <Suspense fallback={<ToolSkeleton />}>{renderToolComponent()}</Suspense>
    </div>
  );
}
