"use client";

import React, { useState, useEffect } from "react";
import { JourneyDetailPage } from "../components/journey-detail";
import { isJourneySlug } from "../data/journeys";

// ── Static JSON imports — zero runtime network cost ───────────────────────────
// IR-1 is 314 KB of JSON, so we import it statically as it is the primary
// journey. Other journeys remain dynamic since they are rarely used.
import ir1Data from "@/data/visa-category/ir-1.json";
import ir5Data from "@/data/visa-category/ir-5.json";
import f1Data from "@/data/visa-category/f-1.json";
import germanyData from "@/data/visa-category/germany-student-journey.json";

const JOURNEY_DATA_MAP: Record<string, any> = {
  "ir-1": ir1Data,
  "ir-5": ir5Data,
  "f-1": f1Data,
  "germany-student-journey": germanyData,
};

function resolveJourneyData(visaJourney: string): any | null {
  return JOURNEY_DATA_MAP[visaJourney] ?? null;
}
import { useAuth } from "@/app/context/AuthContext";
import { useWizard, type WizardState } from "@/app/(main)/dashboard/hooks/useWizard";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  ChevronDown,
  Save,
  ArrowRight,
  Folder,
  AlertCircle,
  FileText,
  Globe,
  Heart,
  Briefcase,
  ShieldCheck,
  Star,
  Building2,
  Activity,
  Cpu,
  BookOpen,
  Users,
  Clock,
  MapPin,
  Scale,
  type LucideIcon,
} from "lucide-react";

/** Curated icon lookup for stage cards — avoids `import * as icons` which bundles ALL 1000+ Lucide icons */
const STAGE_ICON_MAP: Record<string, LucideIcon> = {
  FileText,
  Globe,
  Heart,
  Briefcase,
  ShieldCheck,
  Star,
  Building2,
  Activity,
  Cpu,
  BookOpen,
  Users,
  Clock,
  MapPin,
  Scale,
  AlertCircle,
  ArrowRight,
  Folder,
  Save,
};
import { Loader } from "@/components/ui/spinner";
import { ConfirmationModal } from "@/app/components/shared/ConfirmationModal";
import { ProgressTree } from "./components/ProgressTree";
import { StepDetail } from "./components/StepDetail";
import { DocumentVault } from "./components/DocumentVault";
import { useLanguage } from "@/app/context/LanguageContext";
import { RoadmapData } from "./components/types";
import ScenarioSelectionModal from "./components/ScenarioSelectionModal";
import VisaCategoryTooltip from "./components/VisaCategoryToolTip";
import RoadmapLayoutSpouse from "@/app/components/journey-spouse/RoadmapLayoutSpouse";
import RoadmapLayoutParent from "@/app/components/journey-parent/RoadmapLayoutParent";

export default function IR1JourneyPage() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const { t, language } = useLanguage();
  const params = useParams();
  const visaJourneyParam = (params?.["visa-journey"] as string) || "ir-1";

  if (isJourneySlug(visaJourneyParam)) {
    return <JourneyDetailPage slug={visaJourneyParam} />;
  }

  const journeyMapping: Record<string, string> = {
    "ir1-journey": "ir-1",
    "ir5-journey": "ir-5",
    f1: "f-1",
    "germany-student": "germany-student-journey",
  };

  const visaJourney = journeyMapping[visaJourneyParam] || visaJourneyParam;

  const [showScenarioModal, setShowScenarioModal] = useState(false);
  const [relationshipNotesOpen, setRelationshipNotesOpen] = useState(false);

  // Static lookup — resolves synchronously, no network call needed
  const roadmapData = resolveJourneyData(visaJourney) as RoadmapData | null;
  const dataLoaded = true;
  const hasScenarios = !!(
    roadmapData &&
    (roadmapData.chapters || (roadmapData as any).stages || []).some((s: any) =>
      (s.steps || []).some((st: any) => st.scenarioSpecific)
    )
  );

  const { state, actions, isLoaded, hasExistingProgress, isSyncing, error } = useWizard({
    userId,
    journeyId: visaJourney,
    roadmapData,
  });

  const isSignedIn = !!user;
  const [journeyDecisionMade, setJourneyDecisionMade] = useState(false);
  const [startFreshModalOpen, setStartFreshModalOpen] = useState(false);

  const showDecisionScreen = isLoaded && isSignedIn && hasExistingProgress && !journeyDecisionMade;

  const confirmStartFresh = async () => {
    await actions.resetProgress();
    setJourneyDecisionMade(true);
    setStartFreshModalOpen(false);
  };
  const handleScenarioSelect = (type: string) => actions.setScenario(type);

  useEffect(() => {
    if (hasScenarios && isLoaded && journeyDecisionMade && !state.scenarioType) {
      setShowScenarioModal(true);
    }
  }, [hasScenarios, isLoaded, state.scenarioType, journeyDecisionMade]);

  useEffect(() => {
    if (isLoaded && isSignedIn && !hasExistingProgress && !journeyDecisionMade) {
      actions.startJourney();
      setJourneyDecisionMade(true);
    }
  }, [isLoaded, isSignedIn, hasExistingProgress, journeyDecisionMade, actions]);

  if (!isLoaded || !dataLoaded) {
    return (
      <div className="min-h-screen w-full bg-[#f4f7fb] animate-in fade-in duration-300 pt-[70px]">
        {/* Skeleton nav bar */}
        <div className="sticky top-[70px] h-[52px] bg-white border-b border-[#d0e4f7] flex items-center px-5 gap-3 shrink-0 z-40 pt-2">
          <div className="h-4 w-20 bg-slate-200 rounded animate-pulse" />
        </div>

        {/* Skeleton dashboard content */}
        <div className="max-w-5xl mx-auto px-5 py-8 space-y-6">
          {/* Hero skeleton */}
          <div className="rounded-2xl bg-white border border-[#d0e4f7] p-8 space-y-4">
            <div className="h-4 w-32 bg-slate-200 rounded animate-pulse" />
            <div className="h-8 w-72 bg-slate-200 rounded animate-pulse" />
            <div className="h-4 w-full max-w-md bg-slate-100 rounded animate-pulse" />
          </div>

          {/* Chapter cards skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-2xl bg-white border border-[#d0e4f7] p-6 space-y-4 animate-pulse"
              >
                <div className="h-3 w-20 bg-slate-200 rounded" />
                <div className="h-5 w-40 bg-slate-200 rounded" />
                <div className="h-2 w-full bg-slate-100 rounded-full" />
              </div>
            ))}
          </div>

          {/* Steps skeleton */}
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="rounded-xl bg-white border border-[#d0e4f7] p-5 flex items-center gap-4 animate-pulse"
              >
                <div className="h-8 w-8 rounded-full bg-slate-200 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-48 bg-slate-200 rounded" />
                  <div className="h-3 w-32 bg-slate-100 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-8">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center text-red-500 mb-2">
          <AlertCircle size={32} />
        </div>
        <h2 className="text-2xl font-bold text-slate-800">Connection Error</h2>
        <p className="text-slate-500 text-center max-w-md">
          {error.message ||
            "Failed to synchronize your journey. This usually happens when the configuration file for your visa type is missing or inaccessible."}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-6 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-colors"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  if (!roadmapData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center text-slate-500 text-lg">
          Journey data not found for {visaJourney}
        </div>
      </div>
    );
  }

  // Use V2 for IR-1/CR-1 journeys
  if (visaJourney === "ir-1" || visaJourney === "cr-1") {
    return <RoadmapLayoutSpouse data={roadmapData} state={state} actions={actions as any} />;
  }

  // Use V3 for IR-5 parent journey (JSON-driven)
  if (visaJourney === "ir-5") {
    return <RoadmapLayoutParent data={roadmapData as any} state={state} actions={actions as any} />;
  }

  // Fallback for other journeys (Old UI)
  return (
    <section id={visaJourneyParam} className="block">
      <div className="w-full site-main-px site-main-py">
        <div className="w-full mb-8 md:mb-12">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3 md:mb-4">
                <h1 className="text-3xl md:text-5xl font-bold">
                  {language === "ur" && (roadmapData as any).titleUr
                    ? (roadmapData as any).titleUr
                    : (roadmapData as any).journey_name ||
                      (roadmapData as any).title ||
                      t("ir1Journey.title")}
                </h1>
                <VisaCategoryTooltip roadmapData={roadmapData} language={language} />
              </div>
              <p className="text-slate-500 mb-6 md:mb-8 text-base md:text-lg max-w-2xl">
                {language === "ur" && (roadmapData as any).descriptionUr
                  ? (roadmapData as any).descriptionUr
                  : (roadmapData as any).journey_description ||
                    (roadmapData as any).description ||
                    t("ir1Journey.description")}
              </p>
            </div>
            {isSignedIn && (
              <div className="flex items-center gap-2 text-sm text-slate-500 mt-2 shrink-0">
                {isSyncing ? (
                  <>
                    <Loader size="sm" />
                    <span>{t("ir1Journey.saving")}</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 text-emerald-500" />
                    <span className="text-emerald-600 font-medium">
                      {t("visaJourney.autoSaved")}
                    </span>
                  </>
                )}
              </div>
            )}
          </div>

          {state.scenarioType && (
            <TooltipProvider>
              <Tooltip>
                <div className="mb-6 rounded-xl border border-primary/20 bg-primary/5 overflow-hidden">
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => setRelationshipNotesOpen((prev) => !prev)}
                      className="w-full flex items-center cursor-pointer justify-between p-4 hover:bg-primary/10 transition"
                    >
                      <div className="flex gap-1">
                        <p className="font-semibold uppercase tracking-wide text-slate-500">
                          {roadmapData.scenarios ? "Visa Type:" : "Relationship Type:"}
                        </p>
                        <p className="font-semibold text-primary">
                          {roadmapData.scenarios ? (
                            roadmapData.scenarios.find((s: any) => s.id === state.scenarioType)
                              ?.title
                          ) : (
                            <>
                              {state.scenarioType === "bio" && "Biological Child"}
                              {state.scenarioType === "step" && "Stepchild"}
                              {state.scenarioType === "adopted" && "Adopted Child"}
                            </>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          role="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowScenarioModal(true);
                          }}
                          className="text-sm font-medium text-primary hover:underline cursor-pointer"
                        >
                          Change
                        </span>
                        <motion.div animate={{ rotate: relationshipNotesOpen ? 180 : 0 }}>
                          <ChevronDown className="w-4 h-4 text-primary" />
                        </motion.div>
                      </div>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {relationshipNotesOpen ? "Click to collapse" : "Click to expand"}
                  </TooltipContent>
                  {relationshipNotesOpen &&
                    (roadmapData as any).scenarioNotes &&
                    (roadmapData as any).scenarioNotes[state.scenarioType] && (
                      <div className="px-4 pb-4 text-sm text-muted-foreground border-t border-primary/10">
                        {(roadmapData as any).scenarioNotes[state.scenarioType]}
                      </div>
                    )}
                </div>
              </Tooltip>
            </TooltipProvider>
          )}

          {/* Stage Overview */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6 md:mb-8">
              <div className="w-1 h-6 md:h-8 bg-primary rounded-full" />
              <h2 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
                {(() => {
                  const chapters = roadmapData.chapters || (roadmapData as any).stages || [];
                  const visibleStagesCount = chapters.filter(
                    (s: any) =>
                      !hasScenarios ||
                      !s.scenarioSpecific ||
                      s.scenarioSpecific === state.scenarioType
                  ).length;
                  return `The ${visibleStagesCount} Stages of Your Journey`;
                })()}
              </h2>
            </div>
            <div className="flex overflow-x-auto w-full justify-start gap-4 pb-6 pt-2 snap-x snap-mandatory px-4">
              {(roadmapData.chapters || (roadmapData as any).stages || [])
                .filter(
                  (stage: any) =>
                    !hasScenarios ||
                    !stage.scenarioSpecific ||
                    stage.scenarioSpecific === state.scenarioType
                )
                .map((stage: any, sIdx: number, filteredStages: any[]) => {
                  const iconName = stage.icon || (stage as any).chapter_icon || "FileText";
                  const Icon = STAGE_ICON_MAP[iconName] || FileText;
                  const isLast = sIdx === filteredStages.length - 1;
                  const stageId = stage.chapter_key || stage.id;
                  const stageName = stage.chapter_name || stage.name;
                  return (
                    <div key={stageId} className="relative shrink-0 w-52 snap-center">
                      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm h-full flex flex-col">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center mb-4">
                          <Icon className="w-5 h-5 text-primary" />
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                          {t("visaJourney.stageShort", { stage: sIdx + 1 })}
                        </span>
                        <h4 className="font-bold text-slate-800 text-[15px] mb-2">{stageName}</h4>
                      </div>
                      {!isLast && (
                        <div className="hidden lg:flex absolute top-1/2 left-[calc(100%+8px)] -translate-y-1/2">
                          <ArrowRight className="w-6 h-6 text-slate-300" />
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>

          {!showDecisionScreen && (
            <Wizard
              roadmapData={roadmapData}
              state={state}
              actions={actions}
              isLoaded={isLoaded}
              selectedScenario={state.scenarioType}
              hasScenarios={hasScenarios}
            />
          )}
        </div>
      </div>

      <ConfirmationModal
        open={startFreshModalOpen}
        onOpenChange={setStartFreshModalOpen}
        title={t("visaJourney.startFresh")}
        description={t("ir1Journey.startFreshDesc")}
        confirmText={t("visaJourney.startFresh")}
        onConfirm={confirmStartFresh}
      />

      <ScenarioSelectionModal
        isOpen={showScenarioModal}
        currentType={state.scenarioType}
        onClose={() => setShowScenarioModal(false)}
        onConfirm={handleScenarioSelect}
        options={roadmapData.scenarios || []}
        title="Select Visa Type"
        description="Choose the relation type that applies to your case."
      />
    </section>
  );
}

interface WizardProps {
  roadmapData: RoadmapData;
  state: WizardState;
  actions: any;
  isLoaded: boolean;
  selectedScenario: string | undefined;
  hasScenarios: boolean;
}

function Wizard({
  roadmapData,
  state,
  actions,
  isLoaded,
  selectedScenario,
  hasScenarios,
}: WizardProps) {
  const [isVaultOpen, setIsVaultOpen] = useState(false);
  const { t } = useLanguage();

  if (!isLoaded) return null;

  const currentStage = (roadmapData.chapters || (roadmapData as any).stages || [])[
    state.currentStage
  ];
  const currentStep = currentStage?.steps[state.currentStep || 0];

  if (!currentStep || !currentStage) return null;

  return (
    <div className="flex flex-col gap-6">
      <button
        onClick={() => setIsVaultOpen(true)}
        className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-xl font-bold"
      >
        <Folder className="w-5 h-5 text-amber-500" />
        {t("ir1Journey.documentVault")}
      </button>

      <div className="flex flex-col md:flex-row gap-6 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <aside className="w-full md:w-[320px] bg-slate-50 border-r border-slate-200">
          <ProgressTree
            roadmapData={roadmapData}
            state={state}
            onSelectStep={(st, sp) => {
              actions.setStage(st);
              actions.setCurrentStep(sp);
            }}
            onToggleComplete={actions.toggleComplete}
            selectedScenario={selectedScenario}
            hasScenarios={hasScenarios}
          />
        </aside>
        <main className="flex-1 p-8">
          {currentStep && (
            <StepDetail
              step={currentStep}
              stage={currentStage}
              state={state}
              onToggleComplete={actions.toggleComplete}
              onNext={() => {}}
              onPrev={() => {}}
              isFirst={false}
              isLast={false}
            />
          )}
        </main>
      </div>

      <DocumentVault
        roadmapData={roadmapData}
        isOpen={isVaultOpen}
        onClose={() => setIsVaultOpen(false)}
        state={state}
        onToggleDocument={actions.toggleDocument}
        onUpdateNote={actions.updateNote}
        onUpload={actions.uploadDocument}
        onClearUpload={actions.clearDocument}
      />
    </div>
  );
}
