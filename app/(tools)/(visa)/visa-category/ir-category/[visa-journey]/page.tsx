"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useWizard, type WizardState } from "@/app/(main)/dashboard/hooks/useWizard";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { ChevronDown, Save, ArrowRight, Folder } from "lucide-react";
import * as icons from "lucide-react";
import { Loader } from "@/components/ui/spinner";
import { ConfirmationModal } from "@/app/components/shared/ConfirmationModal";
import { ProgressTree } from "./components/ProgressTree";
import { StepDetail } from "./components/StepDetail";
import { DocumentVault } from "./components/DocumentVault";
import { useLanguage } from "@/app/context/LanguageContext";
import { RoadmapData, RoadmapStage } from "./components/types";
import ScenarioSelectionModal from "./components/ScenarioSelectionModal";
import VisaCategoryTooltip from "./components/VisaCategoryToolTip";
import RoadmapLayoutV2 from "./components/v2/RoadmapLayoutV2";

export default function IR1JourneyPage() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const { t, language } = useLanguage();
  const params = useParams();
  const visaJourneyParam = (params?.["visa-journey"] as string) || "ir-1";

  const journeyMapping: Record<string, string> = {
    "ir1-journey": "ir-1",
    "ir5-journey": "ir-5",
    f1: "f-1",
    "germany-student": "germany-student-journey",
  };

  const visaJourney = journeyMapping[visaJourneyParam] || visaJourneyParam;

  const [roadmapData, setRoadmapData] = useState<RoadmapData | null>(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [showScenarioModal, setShowScenarioModal] = useState(false);
  const [hasScenarios, setHasScenarios] = useState(false);
  const [relationshipNotesOpen, setRelationshipNotesOpen] = useState(false);

  useEffect(() => {
    if (visaJourney) {
      import(`@/data/visa-category/${visaJourney}.json`)
        .then((mod) => {
          const data = mod.default || mod;
          setRoadmapData(data);
          const hasScenarioSteps = data.stages.some((s: RoadmapStage) =>
            s.steps.some((st) => st.scenarioSpecific),
          );
          setHasScenarios(hasScenarioSteps);
          setDataLoaded(true);
        })
        .catch((err) => {
          console.error("Failed to load visa journey data", err);
          setDataLoaded(true);
        });
    }
  }, [visaJourney]);

  const { state, actions, isLoaded, hasExistingProgress, isSyncing } =
    useWizard({
      userId,
      journeyId: visaJourney,
      roadmapData,
    });

  const isSignedIn = !!user;
  const [journeyDecisionMade, setJourneyDecisionMade] = useState(false);
  const [startFreshModalOpen, setStartFreshModalOpen] = useState(false);

  const showDecisionScreen =
    isLoaded && isSignedIn && hasExistingProgress && !journeyDecisionMade;

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
    return <Loader fullScreen text={t("visaJourney.loading")} />;
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
    return (
      <RoadmapLayoutV2
        data={roadmapData}
        state={state}
        actions={actions}
        isLoaded={isLoaded && dataLoaded}
      />
    );
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
                  {language === "ur" && roadmapData.titleUr
                    ? roadmapData.titleUr
                    : roadmapData.title || t("ir1Journey.title")}
                </h1>
                <VisaCategoryTooltip roadmapData={roadmapData} language={language} />
              </div>
              <p className="text-slate-500 mb-6 md:mb-8 text-base md:text-lg max-w-2xl">
                {language === "ur" && roadmapData.descriptionUr
                  ? roadmapData.descriptionUr
                  : roadmapData.description || t("ir1Journey.description")}
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
                    <span className="text-emerald-600 font-medium">{t("visaJourney.autoSaved")}</span>
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
                            roadmapData.scenarios.find((s) => s.id === state.scenarioType)?.title
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
                          onClick={(e) => { e.stopPropagation(); setShowScenarioModal(true); }}
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
                  <TooltipContent>{relationshipNotesOpen ? "Click to collapse" : "Click to expand"}</TooltipContent>
                  {relationshipNotesOpen && roadmapData.scenarioNotes && roadmapData.scenarioNotes[state.scenarioType] && (
                    <div className="px-4 pb-4 text-sm text-muted-foreground border-t border-primary/10">
                      {roadmapData.scenarioNotes[state.scenarioType]}
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
                  const visibleStagesCount = roadmapData.stages.filter(
                    (s) => !hasScenarios || !s.scenarioSpecific || s.scenarioSpecific === state.scenarioType,
                  ).length;
                  return `The ${visibleStagesCount} Stages of Your Journey`;
                })()}
              </h2>
            </div>
            <div className="flex overflow-x-auto w-full justify-start gap-4 pb-6 pt-2 snap-x snap-mandatory px-4">
              {roadmapData.stages
                .filter((stage: RoadmapStage) => !hasScenarios || !stage.scenarioSpecific || stage.scenarioSpecific === state.scenarioType)
                .map((stage: RoadmapStage, sIdx: number, filteredStages: RoadmapStage[]) => {
                  const Icon = (icons as unknown as Record<string, React.ElementType>)[stage.icon || "FileText"] || icons.FileText;
                  const isLast = sIdx === filteredStages.length - 1;
                  return (
                    <div key={stage.id} className="relative shrink-0 w-52 snap-center">
                      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm h-full flex flex-col">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center mb-4">
                          <Icon className="w-5 h-5 text-primary" />
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                          {t("visaJourney.stageShort", { stage: sIdx + 1 })}
                        </span>
                        <h4 className="font-bold text-slate-800 text-[15px] mb-2">{stage.name}</h4>
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

function Wizard({ roadmapData, state, actions, isLoaded, selectedScenario, hasScenarios }: WizardProps) {
  const [isVaultOpen, setIsVaultOpen] = useState(false);
  const { t } = useLanguage();

  if (!isLoaded) return null;

  const currentStage = roadmapData.stages[state.currentStage];
  const currentStep = currentStage?.steps[state.currentStep || 0];

  if (!currentStep || !currentStage) return null;

  return (
    <div className="flex flex-col gap-6">
       <button onClick={() => setIsVaultOpen(true)} className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-xl font-bold">
          <Folder className="w-5 h-5 text-amber-500" />
          {t("ir1Journey.documentVault")}
       </button>

       <div className="flex flex-col md:flex-row gap-6 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <aside className="w-full md:w-[320px] bg-slate-50 border-r border-slate-200">
             <ProgressTree
               roadmapData={roadmapData}
               state={state}
               onSelectStep={(st, sp) => { actions.setStage(st); actions.setCurrentStep(sp); }}
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
