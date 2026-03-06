"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useWizard, WizardState } from "@/app/(main)/dashboard/hooks/useWizard";
// import { roadmapData } from "@/app/(main)/dashboard/data/roadmap";

import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  RotateCcw,
  ArrowRight,
  Save,
  CheckCircle2,
  Loader2,
  FileText,
  Layout,
  Users,
  IdCard,
  Plane,
  Folder,
} from "lucide-react";
import { roadmapData } from "@/data/roadmap";
import { ConfirmationModal } from "@/app/components/shared/ConfirmationModal";
import { ProgressTree } from "./components/ProgressTree";
import { StepDetail } from "./components/StepDetail";
import { DocumentVault } from "./components/DocumentVault";
import { useLanguage } from "@/app/context/LanguageContext";

export default function IR1JourneyPage() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const { t, language } = useLanguage();

  const { state, actions, isLoaded, hasExistingProgress, isSyncing } =
    useWizard({
      userId,
      journeyId: "ir1",
    });

  const router = useRouter();
  const isSignedIn = !!user;

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
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">
            {t("ir1Journey.loadingJourney")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <section id="ir1-journey" className="block">
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-8 md:py-[60px]">
        <div className="max-w-5xl mx-auto mb-8 md:mb-12">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
            <div className="flex-1">
              <h1 className="text-3xl md:text-5xl font-bold mb-3 md:mb-4">
                {t("ir1Journey.title")}
              </h1>
              <p className="text-slate-500 mb-6 md:mb-8 text-base md:text-lg max-w-2xl">
                {t("ir1Journey.description")}
              </p>
            </div>
            {/* Sync indicator */}
            {isSignedIn && (
              <div className="flex items-center gap-2 text-sm text-slate-500 mt-2 shrink-0">
                {isSyncing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span>{t("ir1Journey.saving")}</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 text-emerald-500" />
                    <span className="text-emerald-600 font-medium">
                      {t("ir1Journey.autoSaved")}
                    </span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Stage Overview */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6 md:mb-8">
              <div className="w-1 h-6 md:h-8 bg-primary rounded-full" />
              <h2 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
                {t("ir1Journey.stagesTitle")}
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {[
                {
                  stage: "I",
                  title: t("ir1Journey.stageNames.1"),
                  time: t("ir1Journey.stageTimes.1"),
                  icon: FileText,
                  color: "bg-blue-50 text-blue-600",
                },
                {
                  stage: "II",
                  title: t("ir1Journey.stageNames.2"),
                  time: t("ir1Journey.stageTimes.2"),
                  icon: Layout,
                  color: "bg-indigo-50 text-indigo-600",
                },
                {
                  stage: "III",
                  title: t("ir1Journey.stageNames.3"),
                  time: t("ir1Journey.stageTimes.3"),
                  icon: Users,
                  color: "bg-emerald-50 text-emerald-600",
                },
                {
                  stage: "IV",
                  title: t("ir1Journey.stageNames.4"),
                  time: t("ir1Journey.stageTimes.4"),
                  icon: IdCard,
                  color: "bg-amber-50 text-amber-600",
                },
                {
                  stage: "V",
                  title: t("ir1Journey.stageNames.5"),
                  time: t("ir1Journey.stageTimes.5"),
                  icon: Plane,
                  color: "bg-rose-50 text-rose-600",
                },
              ].map(({ stage, title, time, icon: Icon, color }) => (
                <div key={stage} className="relative group">
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:border-primary/30 hover:-translate-y-1 h-full flex flex-col">
                    <div
                      className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-4 transition-transform group-hover:scale-110`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                      {t("ir1Journey.stageShort", { stage })}
                    </span>
                    <h4 className="font-bold text-slate-800 text-[15px] mb-2 leading-tight">
                      {title}
                    </h4>
                    <div className="mt-auto pt-2 flex items-center gap-1.5 text-slate-500">
                      <Loader2 className="w-3 h-3 animate-spin-slow" />
                      <span className="text-[11px] font-medium">{time}</span>
                    </div>
                  </div>
                  {/* Connectivity Line for Desktop */}
                  {stage !== "V" && (
                    <div className="hidden lg:flex absolute top-1/2 left-[calc(100%+8px)] -translate-x-1/2 -translate-y-1/2 z-20 items-center justify-center w-6 h-6">
                      <ArrowRight className="w-5 h-5 text-slate-300" />
                    </div>
                  )}
                </div>
              ))}
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
                      {t("ir1Journey.welcomeBack")}
                    </h3>
                    <p className="text-slate-500 text-xs md:text-sm">
                      {t("ir1Journey.existingJourney")}
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
                      {t("ir1Journey.stepsCompleted", { count: state.completedSteps.size.toString() })}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-500 rounded-full"
                      style={{
                        width: `${Math.round(
                          (state.completedSteps.size /
                            roadmapData.stages.reduce(
                              (acc, s) => acc + s.steps.length,
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
                        name: roadmapData.stages[state.currentStage]?.name ?? "" 
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
            state={state}
            actions={actions}
            isLoaded={isLoaded}
            isSignedIn={isSignedIn}
          />
        )}
      </div>

      <ConfirmationModal
        open={startFreshModalOpen}
        onOpenChange={setStartFreshModalOpen}
        title={t("ir1Journey.startFreshTitle")}
        description={t("ir1Journey.startFreshDesc")}
        confirmText={t("ir1Journey.startFresh")}
        onConfirm={confirmStartFresh}
      />
    </section>
  );
}

type WizardActions = ReturnType<typeof useWizard>["actions"];

interface WizardProps {
  state: WizardState;
  actions: WizardActions;
  isLoaded: boolean;
  isSignedIn: boolean;
}

function Wizard({ state, actions, isLoaded, isSignedIn }: WizardProps) {
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
  const currentStep = currentStage.steps[state.currentStep || 0];
  const totalSteps = roadmapData.stages.reduce(
    (acc, s) => acc + s.steps.length,
    0,
  );
  const completedTotal = state.completedSteps.size;
  const progressPercent = Math.round((completedTotal / totalSteps) * 100);

  const handleNext = () => {
    const nextStepIdx = (state.currentStep || 0) + 1;
    if (nextStepIdx < currentStage.steps.length) {
      actions.setCurrentStep(nextStepIdx);
    } else if (state.currentStage + 1 < roadmapData.stages.length) {
      actions.setStage(state.currentStage + 1);
      actions.setCurrentStep(0);
    }
  };

  const handlePrev = () => {
    const prevStepIdx = (state.currentStep || 0) - 1;
    if (prevStepIdx >= 0) {
      actions.setCurrentStep(prevStepIdx);
    } else if (state.currentStage - 1 >= 0) {
      const prevStage = roadmapData.stages[state.currentStage - 1];
      actions.setStage(state.currentStage - 1);
      actions.setCurrentStep(prevStage.steps.length - 1);
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
              {progressPercent}% ({completedTotal}/{totalSteps} {(t("ir1Journey.stepsCompleted", { count: "" }) as string).replace(/\{count\}/, "").trim()})
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

      <div className="flex flex-col md:flex-row gap-0 md:gap-6 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm min-h-[400px] md:min-h-[600px] mb-12">
        <aside className="w-full md:w-[320px] bg-slate-50 border-b md:border-b-0 md:border-r border-slate-200 p-4 md:p-6 overflow-y-auto max-h-[300px] md:max-h-[800px] shrink-0">
          <ProgressTree
            state={state}
            onSelectStep={(stageIdx, stepIdx) => {
              actions.setStage(stageIdx);
              actions.setCurrentStep(stepIdx);
            }}
          />
        </aside>

        <main className="flex-1 p-4 md:p-8 bg-white overflow-y-auto">
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
        </main>
      </div>

      <DocumentVault
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
