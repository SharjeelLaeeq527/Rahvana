"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useWizard, WizardState } from "@/app/(main)/dashboard/hooks/useWizard";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, ChevronDown, icons, InfoIcon } from "lucide-react";
import {
  RotateCcw,
  ArrowRight,
  Save,
  CheckCircle2,
  Folder,
} from "lucide-react";
import { Loader } from "@/components/ui/spinner";
import { ConfirmationModal } from "@/app/components/shared/ConfirmationModal";
import { ProgressTree } from "./components/ProgressTree";
import { StepDetail } from "./components/StepDetail";
import { DocumentVault } from "./components/DocumentVault";
import { useLanguage } from "@/app/context/LanguageContext";
import { RoadmapData, RoadmapStage } from "./components/types";
import ScenarioSelectionModal from "./components/ScenarioSelectionModal";

export default function IR1JourneyPage() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const { t, language } = useLanguage();
  const params = useParams();
  const visaJourneyParam = (params?.["visa-journey"] as string) || "ir-1";

  // Map URL slugs to actual JSON filenames if they differ
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
          // Check if this journey has scenario-specific steps
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

  // const router = useRouter();
  const isSignedIn = !!user;

  // When scenario changes, reset to first step of current stage if needed
  useEffect(() => {
    if (hasScenarios && roadmapData) {
      const currentStage = roadmapData.stages[state.currentStage];
      if (currentStage && state.currentStep !== null) {
        const currentStep = currentStage.steps[state.currentStep];
        // If current step is scenario-specific and doesn't match selected scenario,
        // find the first matching step for the new scenario
        if (
          currentStep?.scenarioSpecific &&
          currentStep.scenarioSpecific !== state.scenarioType
        ) {
          const firstMatchingStepIdx = currentStage.steps.findIndex(
            (s) =>
              !s.scenarioSpecific || s.scenarioSpecific === state.scenarioType,
          );
          if (firstMatchingStepIdx >= 0) {
            actions.setCurrentStep(firstMatchingStepIdx);
          }
        }
      }
    }
  }, [
    state.scenarioType,
    hasScenarios,
    roadmapData,
    state.currentStage,
    state.currentStep,
    actions,
  ]);

  // Show the resume/start-fresh screen only when:
  // - user is logged in
  // - there's existing progress
  // - they haven't clicked "Resume" or "Start Fresh" yet
  const [journeyDecisionMade, setJourneyDecisionMade] = useState(false);
  const [startFreshModalOpen, setStartFreshModalOpen] = useState(false);

  const showDecisionScreen =
    isLoaded && isSignedIn && hasExistingProgress && !journeyDecisionMade;

  const handleResume = () => {
    setJourneyDecisionMade(true);
  };

  const handleStartFresh = () => {
    setStartFreshModalOpen(true);
  };

  const confirmStartFresh = async () => {
    await actions.resetProgress();
    setJourneyDecisionMade(true);
    setStartFreshModalOpen(false);
  };

  const handleScenarioSelect = (type: string) => {
    actions.setScenario(type);
  };

  useEffect(() => {
    if (
      hasScenarios &&
      isLoaded &&
      journeyDecisionMade &&
      !state.scenarioType
    ) {
      setShowScenarioModal(true);
    }
  }, [hasScenarios, isLoaded, state.scenarioType, journeyDecisionMade]);

  // Loading state
  useEffect(() => {
    if (
      isLoaded &&
      isSignedIn &&
      !hasExistingProgress &&
      !journeyDecisionMade
    ) {
      actions.startJourney();
      setJourneyDecisionMade(true);
    }
  }, [isLoaded, isSignedIn, hasExistingProgress, journeyDecisionMade, actions]);

  // Loading state
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

  return (
    <section id={visaJourneyParam} className="block">
      <div className="w-full px-4 md:px-6 xl:px-8 py-8 md:py-[60px]">
        <div className="w-full mb-8 md:mb-12">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-2">
            <div className="flex-1">
              <h1 className="text-3xl md:text-5xl font-bold mb-3 md:mb-4">
                {language === "ur" && roadmapData.titleUr
                  ? roadmapData.titleUr
                  : roadmapData.title || t("ir1Journey.title")}
              </h1>
              <p className="text-slate-500 mb-6 md:mb-8 text-base md:text-lg max-w-2xl">
                {language === "ur" && roadmapData.descriptionUr
                  ? roadmapData.descriptionUr
                  : roadmapData.description || t("ir1Journey.description")}
              </p>
            </div>
            {/* Sync indicator */}
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
                  {/* Header */}
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => setRelationshipNotesOpen((prev) => !prev)}
                      className="w-full flex items-center cursor-pointer justify-between p-4 hover:bg-primary/10 transition"
                    >
                      <div className="flex gap-1">
                        <p className="font-semibold uppercase tracking-wide text-slate-500">
                          {roadmapData.scenarios
                            ? "Visa Type:"
                            : "Relationship Type:"}
                        </p>

                        <p className="font-semibold text-primary">
                          {roadmapData.scenarios ? (
                            roadmapData.scenarios.find(
                              (s) => s.id === state.scenarioType,
                            )?.title
                          ) : (
                            <>
                              {state.scenarioType === "bio" &&
                                "Biological Child"}
                              {state.scenarioType === "step" && "Stepchild"}
                              {state.scenarioType === "adopted" &&
                                "Adopted Child"}
                            </>
                          )}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowScenarioModal(true);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.stopPropagation();
                              setShowScenarioModal(true);
                            }
                          }}
                          className="text-sm font-medium text-primary hover:underline cursor-pointer"
                        >
                          Change
                        </span>

                        <motion.div
                          animate={{ rotate: relationshipNotesOpen ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ChevronDown className="w-4 h-4 text-primary" />
                        </motion.div>
                      </div>
                    </button>
                  </TooltipTrigger>

                  <TooltipContent>
                    {relationshipNotesOpen
                      ? "Click to collapse"
                      : "Click to expand"}
                  </TooltipContent>

                  {/* Collapsible Content */}
                  {relationshipNotesOpen &&
                    roadmapData.scenarioNotes &&
                    roadmapData.scenarioNotes[state.scenarioType] && (
                      <div className="px-4 pb-4 text-sm text-muted-foreground border-t border-primary/10">
                        {roadmapData.scenarioNotes[state.scenarioType]}
                      </div>
                    )}
                </div>
              </Tooltip>
            </TooltipProvider>
          )}
          {/* Disclaimer & Overview */}
          <div className="flex flex-col">
            {(roadmapData.disclaimer || roadmapData.disclaimerUr) && (
              <div className="bg-amber-50/50 border border-amber-200/50 rounded-2xl p-5 md:p-6 shadow-sm mb-4 md:mb-6">
                <p className="text-[14px] md:text-[15px] text-amber-900 leading-relaxed font-medium">
                  <span className="font-black text-amber-800 uppercase tracking-tighter mr-1.5">
                    Disclaimer:
                  </span>
                  {(() => {
                    const text =
                      language === "ur" && roadmapData.disclaimerUr
                        ? roadmapData.disclaimerUr
                        : roadmapData.disclaimer || "";

                    const links = [...(roadmapData.disclaimerLinks || [])];
                    if (
                      roadmapData.disclaimerLink &&
                      roadmapData.disclaimerLinkText
                    ) {
                      links.push({
                        text: roadmapData.disclaimerLinkText,
                        url: roadmapData.disclaimerLink,
                      });
                    }

                    if (links.length === 0) return text;

                    // Sort links by text length descending to avoid partial matches on longer strings
                    const sortedLinks = links.sort(
                      (a, b) => b.text.length - a.text.length,
                    );

                    let parts: (string | React.ReactNode)[] = [text];

                    sortedLinks.forEach((link) => {
                      const newParts: (string | React.ReactNode)[] = [];
                      parts.forEach((part) => {
                        if (
                          typeof part === "string" &&
                          part.includes(link.text)
                        ) {
                          const subParts = part.split(link.text);
                          subParts.forEach((subPart, i) => {
                            newParts.push(subPart);
                            if (i < subParts.length - 1) {
                              newParts.push(
                                <a
                                  key={`${link.text}-${i}`}
                                  href={link.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="font-bold underline underline-offset-2 hover:text-amber-700 transition-colors inline-flex items-center"
                                >
                                  {link.text}
                                </a>,
                              );
                            }
                          });
                        } else {
                          newParts.push(part);
                        }
                      });
                      parts = newParts;
                    });

                    return parts;
                  })()}
                </p>
              </div>
            )}

            {roadmapData.visaOverview && (
              <div className="bg-sky-50/50 border border-sky-100 rounded-2xl p-6 flex gap-6 items-start shadow-sm mb-4 md:mb-6">
                <div className="hidden sm:flex text-slate-500 font-bold text-lg h-10 w-10 items-center justify-center shrink-0 uppercase tracking-tighter">
                  {roadmapData.visaOverview.flag || "GOV"}
                </div>
                <div className="flex-1">
                  <h3 className="text-[#1a4b84] font-black uppercase tracking-wider mb-2 text-[13px] sm:text-[14px]">
                    {language === "ur" && roadmapData.visaOverview.titleUr
                      ? roadmapData.visaOverview.titleUr
                      : roadmapData.visaOverview.title}
                  </h3>
                  <div className="text-slate-600 text-[14px] leading-relaxed font-medium">
                    {language === "ur" && roadmapData.visaOverview.textUr
                      ? roadmapData.visaOverview.textUr
                      : roadmapData.visaOverview.text}
                    {roadmapData.visaOverview.link && (
                      <a
                        href={roadmapData.visaOverview.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-1 text-[#1a4b84] font-bold underline decoration-2 underline-offset-2"
                      >
                        {roadmapData.visaOverview.linkText ||
                          roadmapData.visaOverview.link
                            .replace(/^https?:\/\//, "")
                            .split("/")[0]}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Info */}
          {roadmapData.info && (
            <div className="bg-[#e8f6f6] border border-[#14a0a6] rounded-2xl p-5 md:p-6 shadow-sm mb-4 md:mb-6">
              <p className="text-[14px] md:text-[15px] text-[#0a5a5d] leading-relaxed font-medium">
                <span className="font-black text-[#0a5a5d] uppercase tracking-tighter mr-1.5 inline-flex items-center gap-1">
                  Info:
                </span>

                {(() => {
                  const text = roadmapData.info || "";

                  const links = [...(roadmapData.infoLinks || [])];

                  if (roadmapData.infoLink && roadmapData.infoLinkText) {
                    links.push({
                      text: roadmapData.infoLinkText,
                      url: roadmapData.infoLink,
                    });
                  }

                  if (links.length === 0) return text;

                  // Prevent partial replacement
                  const sortedLinks = links.sort(
                    (a, b) => b.text.length - a.text.length,
                  );

                  let parts: (string | React.ReactNode)[] = [text];

                  sortedLinks.forEach((link) => {
                    const newParts: (string | React.ReactNode)[] = [];

                    parts.forEach((part) => {
                      if (
                        typeof part === "string" &&
                        part.includes(link.text)
                      ) {
                        const subParts = part.split(link.text);

                        subParts.forEach((subPart, i) => {
                          newParts.push(subPart);

                          if (i < subParts.length - 1) {
                            newParts.push(
                              <a
                                key={`${link.text}-${i}`}
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-bold underline underline-offset-2 hover:text-[#0a5a5d] transition-colors inline-flex items-center"
                              >
                                {link.text}
                              </a>,
                            );
                          }
                        });
                      } else {
                        newParts.push(part);
                      }
                    });

                    parts = newParts;
                  });

                  return parts;
                })()}
              </p>
            </div>
          )}

          {/* Stage Overview */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6 md:mb-8">
              <div className="w-1 h-6 md:h-8 bg-primary rounded-full" />
              <h2 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
                {(() => {
                  const visibleStagesCount = roadmapData.stages.filter(
                    (s) =>
                      !hasScenarios ||
                      !s.scenarioSpecific ||
                      s.scenarioSpecific === state.scenarioType,
                  ).length;
                  return `The ${visibleStagesCount} Stages of Your Journey`;
                })()}
              </h2>
            </div>

            <div className="flex overflow-x-auto mx-auto justify-center gap-4 pb-6 pt-2 snap-x snap-mandatory hide-scrollbar px-4 scroll-smooth">
              {roadmapData.stages
                .filter(
                  (stage: RoadmapStage) =>
                    !hasScenarios ||
                    !stage.scenarioSpecific ||
                    stage.scenarioSpecific === state.scenarioType,
                )
                .map(
                  (
                    stage: RoadmapStage,
                    sIdx: number,
                    filteredStages: RoadmapStage[],
                  ) => {
                    const defaultIcons = [
                      "FileText",
                      "Layout",
                      "Users",
                      "IdCard",
                      "Plane",
                    ];
                    const defaultColors = [
                      "bg-blue-50 text-blue-600",
                      "bg-indigo-50 text-indigo-600",
                      "bg-emerald-50 text-emerald-600",
                      "bg-amber-50 text-amber-600",
                      "bg-rose-50 text-rose-600",
                    ];

                    const iconName =
                      stage.icon || defaultIcons[sIdx % defaultIcons.length];
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const Icon = (icons as any)[iconName] || icons.FileText;

                    const color =
                      stage.color || defaultColors[sIdx % defaultColors.length];
                    const isLast = sIdx === filteredStages.length - 1;

                    return (
                      <div
                        key={stage.id}
                        className="relative group shrink-0 h-48 w-50 sm:w-52.5 lg:w-55 snap-center"
                      >
                        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm h-full flex flex-col">
                          <div
                            className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-4`}
                          >
                            <Icon className="w-5 h-5" />
                          </div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                            {t("visaJourney.stageShort", { stage: sIdx + 1 })}
                          </span>
                          <h4 className="font-bold text-slate-800 text-[15px] mb-2 leading-tight">
                            {language === "ur" && stage.nameUr
                              ? stage.nameUr
                              : stage.name}
                          </h4>
                          <div className="mt-auto pt-2 flex items-center gap-1.5 text-slate-500">
                            <span className="text-[11px] font-medium">
                              {stage.timeline || "Variable"}
                            </span>
                          </div>
                        </div>
                        {/* Connectivity Line for Desktop */}
                        {!isLast && (
                          <div className="hidden lg:flex absolute top-1/2 left-[calc(100%+8px)] -translate-x-1/2 -translate-y-1/2 z-20 items-center justify-center w-10 h-10">
                            <ArrowRight className="w-6 h-6 text-slate-300" />
                          </div>
                        )}
                      </div>
                    );
                  },
                )}
            </div>
          </div>

          {/* ── Decision Screen: Resume or Start Fresh ── */}
          <AnimatePresence>
            {showDecisionScreen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -20 }}
                className="bg-white border-2 border-primary/20 rounded-2xl p-8 mb-8 shadow-xl relative overflow-hidden"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg md:text-xl font-bold text-slate-900">
                      {t("visaJourney.welcomeBack")}
                    </h3>
                    <p className="text-slate-500 text-xs md:text-sm">
                      {visaJourneyParam === "ir1-journey"
                        ? t("ir1Journey.existingJourney")
                        : t("visaJourney.existingJourney", {
                            title:
                              language === "ur" && roadmapData.titleUr
                                ? roadmapData.titleUr
                                : roadmapData.title,
                          })}
                    </p>
                  </div>
                </div>

                {/* Progress Summary */}
                <div className="bg-slate-50 rounded-xl p-4 mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold text-slate-600">
                      {t("ir1Journey.journeyProgress")}
                    </span>
                    <span className="text-sm font-bold text-primary">
                      {t("ir1Journey.stepsCompleted", {
                        count: state.completedSteps.size.toString(),
                      })}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-500 rounded-full"
                      style={{
                        width: `${Math.round(
                          (state.completedSteps.size /
                            roadmapData.stages.reduce(
                              (acc: number, s: RoadmapStage) =>
                                acc + s.steps.length,
                              0,
                            )) *
                            100,
                        )}%`,
                      }}
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-2">
                    {t("ir1Journey.currentlyAt", {
                      stage: (state.currentStage + 1).toString(),
                      name: roadmapData.stages[state.currentStage]?.name ?? "",
                    })}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleResume}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all shadow-md hover:shadow-lg active:scale-95"
                  >
                    {t("ir1Journey.resumeJourney")}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleStartFresh}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-white border-2 border-slate-200 text-slate-600 font-semibold rounded-xl hover:border-red-300 hover:text-red-600 hover:bg-red-50 transition-all"
                  >
                    <RotateCcw className="w-4 h-4" />
                    {t("ir1Journey.startFresh")}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Wizard (shown when decision is made or user is guest) ── */}
        {!showDecisionScreen && (
          <Wizard
            roadmapData={roadmapData}
            state={state}
            actions={actions}
            isLoaded={isLoaded}
            isSignedIn={isSignedIn}
            selectedScenario={state.scenarioType}
            hasScenarios={hasScenarios}
          />
        )}
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
        onConfirm={(type) => {
          handleScenarioSelect(type);
        }}
      />
    </section>
  );
}

type WizardActions = ReturnType<typeof useWizard>["actions"];

interface WizardProps {
  roadmapData: RoadmapData;
  state: WizardState;
  actions: WizardActions;
  isLoaded: boolean;
  isSignedIn: boolean;
  selectedScenario?: string;
  hasScenarios?: boolean;
}

function Wizard({
  roadmapData,
  state,
  actions,
  isLoaded,
  // isSignedIn,
  selectedScenario,
  hasScenarios = false,
}: WizardProps) {
  const { t } = useLanguage();
  const [isVaultOpen, setIsVaultOpen] = useState(false);

  if (!isLoaded) {
    return (
      <div className="p-20 text-center text-slate-400">
        {t("generic.loading")}
      </div>
    );
  }

  const currentStage = roadmapData.stages[state.currentStage];
  const currentStep = currentStage?.steps[state.currentStep || 0];
  const relevantStages = roadmapData.stages.filter(
    (s) =>
      !hasScenarios ||
      !s.scenarioSpecific ||
      s.scenarioSpecific === selectedScenario,
  );
  const totalSteps = relevantStages.reduce((acc: number, s: RoadmapStage) => {
    const visibleSteps = s.steps.filter(
      (st) =>
        !hasScenarios ||
        !st.scenarioSpecific ||
        st.scenarioSpecific === selectedScenario,
    );
    return acc + visibleSteps.length;
  }, 0);
  const completedTotal = state.completedSteps.size;
  const progressPercent =
    totalSteps > 0 ? Math.round((completedTotal / totalSteps) * 100) : 0;

  const handleNext = () => {
    const visibleStepsUnderCurrentStageIndices = currentStage.steps
      .map((st, i) =>
        !hasScenarios ||
        !st.scenarioSpecific ||
        st.scenarioSpecific === selectedScenario
          ? i
          : -1,
      )
      .filter((i) => i !== -1);

    const currentPosInVisible = visibleStepsUnderCurrentStageIndices.indexOf(
      state.currentStep || 0,
    );

    if (currentPosInVisible < visibleStepsUnderCurrentStageIndices.length - 1) {
      actions.setCurrentStep(
        visibleStepsUnderCurrentStageIndices[currentPosInVisible + 1],
      );
    } else {
      // Find next visible stage
      let nextStageIdx = state.currentStage + 1;
      while (nextStageIdx < roadmapData.stages.length) {
        const stage = roadmapData.stages[nextStageIdx];
        const isStageVisible =
          !hasScenarios ||
          !stage.scenarioSpecific ||
          stage.scenarioSpecific === selectedScenario;
        const visibleSteps = stage.steps.filter(
          (st) =>
            !hasScenarios ||
            !st.scenarioSpecific ||
            st.scenarioSpecific === selectedScenario,
        );

        if (isStageVisible && visibleSteps.length > 0) {
          const firstVisibleStepIdx = stage.steps.findIndex(
            (st) =>
              !hasScenarios ||
              !st.scenarioSpecific ||
              st.scenarioSpecific === selectedScenario,
          );
          actions.setStage(nextStageIdx);
          actions.setCurrentStep(firstVisibleStepIdx);
          return;
        }
        nextStageIdx++;
      }
    }
  };

  const handlePrev = () => {
    const visibleStepsUnderCurrentStageIndices = currentStage.steps
      .map((st, i) =>
        !hasScenarios ||
        !st.scenarioSpecific ||
        st.scenarioSpecific === selectedScenario
          ? i
          : -1,
      )
      .filter((i) => i !== -1);

    const currentPosInVisible = visibleStepsUnderCurrentStageIndices.indexOf(
      state.currentStep || 0,
    );

    if (currentPosInVisible > 0) {
      actions.setCurrentStep(
        visibleStepsUnderCurrentStageIndices[currentPosInVisible - 1],
      );
    } else {
      // Find previous visible stage
      let prevStageIdx = state.currentStage - 1;
      while (prevStageIdx >= 0) {
        const stage = roadmapData.stages[prevStageIdx];
        const isStageVisible =
          !hasScenarios ||
          !stage.scenarioSpecific ||
          stage.scenarioSpecific === selectedScenario;
        const visibleSteps = stage.steps.filter(
          (st) =>
            !hasScenarios ||
            !st.scenarioSpecific ||
            st.scenarioSpecific === selectedScenario,
        );

        if (isStageVisible && visibleSteps.length > 0) {
          const lastVisibleStepIdx = stage.steps
            .map((st, i) =>
              !hasScenarios ||
              !st.scenarioSpecific ||
              st.scenarioSpecific === selectedScenario
                ? i
                : -1,
            )
            .filter((i) => i !== -1)
            .pop();
          if (typeof lastVisibleStepIdx === "number") {
            actions.setStage(prevStageIdx);
            actions.setCurrentStep(lastVisibleStepIdx);
            return;
          }
        }
        prevStageIdx--;
      }
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div className="flex-1">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs md:text-sm font-bold text-slate-500 uppercase tracking-wider">
              {t("ir1Journey.overallProgress")}
            </span>
            <span className="text-xs md:text-sm font-bold text-rahvana-primary">
              {progressPercent}% ({completedTotal}/{totalSteps}{" "}
              {(t("ir1Journey.stepsCompleted", { count: "" }) as string)
                .replace(/\{count\}/, "")
                .trim()}
              )
            </span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-rahvana-primary transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={() => setIsVaultOpen(true)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-900 rounded-xl font-bold hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm active:scale-95"
          >
            <Folder className="w-5 h-5 text-amber-500" />
            {t("ir1Journey.documentVault")}
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-0 md:gap-6 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm min-h-100 md:min-h-150 mb-12">
        <aside className="w-full md:w-[320px] bg-slate-50 border-b md:border-b-0 md:border-r border-slate-200 p-4 md:p-6 overflow-y-auto max-h-[300px] md:max-h-[800px] shrink-0">
          <ProgressTree
            roadmapData={roadmapData}
            state={state}
            onSelectStep={(stageIdx, stepIdx) => {
              actions.setStage(stageIdx);
              actions.setCurrentStep(stepIdx);
            }}
            onToggleComplete={actions.toggleComplete}
            selectedScenario={selectedScenario}
            hasScenarios={hasScenarios}
          />
        </aside>

        <main className="flex-1 p-4 md:p-8 bg-white overflow-y-auto">
          {currentStep && (
            <StepDetail
              step={currentStep}
              stage={currentStage}
              state={state}
              onToggleComplete={actions.toggleComplete}
              onNext={handleNext}
              onPrev={handlePrev}
              isFirst={state.currentStage === 0 && state.currentStep === 0}
              isLast={
                state.currentStage === roadmapData.stages.length - 1 &&
                state.currentStep === currentStage.steps.length - 1
              }
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
