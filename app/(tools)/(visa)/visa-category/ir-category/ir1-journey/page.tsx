"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from "@/app/context/AuthContext";
import { useWizard, WizardState } from "@/app/(main)/dashboard/hooks/useWizard";
// import { roadmapData } from "@/app/(main)/dashboard/data/roadmap";
import { ProgressTree } from "@/app/test/components/ProgressTree";
import { StepDetail } from "@/app/test/components/StepDetail";
import { DocumentVault } from "@/app/test/components/DocumentVault";
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, ArrowRight, Save, CheckCircle2, Loader2, FileText, Layout, Users, IdCard, Plane } from 'lucide-react';
import { roadmapData } from '@/data/roadmap';
import { ConfirmationModal } from "@/app/components/shared/ConfirmationModal";

export default function IR1JourneyPage() {
    const { user } = useAuth();
    const userId = user?.id ?? null;

    const { state, actions, isLoaded, hasExistingProgress, isSyncing } = useWizard({
        userId,
        journeyId: 'ir1',
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
        isLoaded &&
        isSignedIn &&
        hasExistingProgress &&
        !journeyDecisionMade;

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
        if (isLoaded && isSignedIn && !hasExistingProgress && !journeyDecisionMade) {
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
                    <p className="text-muted-foreground text-sm">Loading your journey...</p>
                </div>
            </div>
        );
    }

    return (
        <section id="ir1-journey" className="block">
            <div className="max-w-[1400px] mx-auto px-6 py-[60px]">
                <div className='max-w-5xl mx-auto mb-12'>
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                            <h1 className="text-5xl font-bold mb-4">IR-1/CR-1 Spouse Visa Journey</h1>
                            <p className="text-slate-500 mb-8 text-lg max-w-2xl">
                                Comprehensive roadmap for bringing your spouse to the United States via consular processing at U.S. Embassy Islamabad, Pakistan.
                            </p>
                        </div>
                        {/* Sync indicator */}
                        {isSignedIn && (
                             <div className="flex items-center gap-2 text-sm text-slate-500 mt-2 shrink-0">
                                 {isSyncing ? (
                                     <>
                                         <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                         <span>Saving...</span>
                                     </>
                                 ) : (
                                     <>
                                         <Save className="w-4 h-4 text-emerald-500" />
                                         <span className="text-emerald-600 font-medium">Auto-saved</span>
                                     </>
                                 )}
                             </div>
                         )}
                    </div>

                    {/* Stage Overview */}
                    <div className="mb-12">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-1 h-8 bg-primary rounded-full" />
                            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">The 5 Stages of Your Journey</h2>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                            {[
                                { stage: 'I', title: 'USCIS Petition', time: '17-65 months', icon: FileText, color: 'bg-blue-50 text-blue-600' },
                                { stage: 'II', title: 'NVC Processing', time: '4-9 months', icon: Layout, color: 'bg-indigo-50 text-indigo-600' },
                                { stage: 'III', title: 'Med + Interview', time: '2-4 weeks', icon: Users, color: 'bg-emerald-50 text-emerald-600' },
                                { stage: 'IV', title: 'Visa & Travel', time: '1-2 weeks', icon: IdCard, color: 'bg-amber-50 text-amber-600' },
                                { stage: 'V', title: 'U.S. Arrival', time: '90 days', icon: Plane, color: 'bg-rose-50 text-rose-600' },
                            ].map(({ stage, title, time, icon: Icon, color }) => (
                                <div key={stage} className="relative group">
                                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:border-primary/30 hover:-translate-y-1 h-full flex flex-col">
                                        <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-4 transition-transform group-hover:scale-110`}>
                                            <Icon className="w-5 h-5" />
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Stage {stage}</span>
                                        <h4 className="font-bold text-slate-800 text-[15px] mb-2 leading-tight">{title}</h4>
                                        <div className="mt-auto pt-2 flex items-center gap-1.5 text-slate-500">
                                            <Loader2 className="w-3 h-3 animate-spin-slow" />
                                            <span className="text-[11px] font-medium">{time}</span>
                                        </div>
                                    </div>
                                    {/* Connectivity Line for Desktop */}
                                    {stage !== 'V' && (
                                        <div className="hidden lg:flex absolute top-1/2 left-[calc(100%+8px)] -translate-x-1/2 -translate-y-1/2 z-[20] items-center justify-center w-6 h-6">
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
                                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                        <CheckCircle2 className="w-6 h-6 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-900">Welcome Back!</h3>
                                        <p className="text-slate-500 text-sm">You have an existing IR-1 journey in progress.</p>
                                    </div>
                                </div>

                                {/* Progress Summary */}
                                <div className="bg-slate-50 rounded-xl p-4 mb-6">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm font-semibold text-slate-600">Journey Progress</span>
                                        <span className="text-sm font-bold text-primary">
                                            {state.completedSteps.size} steps completed
                                        </span>
                                    </div>
                                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-primary transition-all duration-500 rounded-full"
                                            style={{
                                                width: `${Math.round(
                                                    (state.completedSteps.size /
                                                        roadmapData.stages.reduce((acc, s) => acc + s.steps.length, 0)) * 100
                                                )}%`
                                            }}
                                        />
                                    </div>
                                    <p className="text-xs text-slate-400 mt-2">
                                        Currently at: Stage {state.currentStage + 1} — {roadmapData.stages[state.currentStage]?.name ?? ''}
                                    </p>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-3">
                                    <button
                                        onClick={handleResume}
                                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all shadow-md hover:shadow-lg active:scale-95"
                                    >
                                        Resume My Journey
                                        <ArrowRight className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={handleStartFresh}
                                        className="flex items-center justify-center gap-2 px-6 py-3 bg-white border-2 border-slate-200 text-slate-600 font-semibold rounded-xl hover:border-red-300 hover:text-red-600 hover:bg-red-50 transition-all"
                                    >
                                        <RotateCcw className="w-4 h-4" />
                                        Start Fresh
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>


                </div>

                {/* ── Wizard (shown when decision is made or user is guest) ── */}
                {(!showDecisionScreen) && (
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
                title="Start Fresh?"
                description="Are you sure you want to reset all progress? This action cannot be undone."
                confirmText="Start Fresh"
                onConfirm={confirmStartFresh}
            />
        </section>
    );
}

type WizardActions = ReturnType<typeof useWizard>['actions'];

interface WizardProps {
    state: WizardState;
    actions: WizardActions;
    isLoaded: boolean;
    isSignedIn: boolean;
}

function Wizard({ state, actions, isLoaded, isSignedIn }: WizardProps) {
    const [isVaultOpen, setIsVaultOpen] = useState(false);

    if (!isLoaded) {
        return <div className="p-20 text-center text-slate-400">Loading your journey...</div>;
    }

    const currentStage = roadmapData.stages[state.currentStage];
    const currentStep = currentStage.steps[state.currentStep || 0];
    const totalSteps = roadmapData.stages.reduce((acc, s) => acc + s.steps.length, 0);
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
                        <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Overall Journey Progress</span>
                        <span className="text-sm font-bold text-[#0d9488]">{progressPercent}% ({completedTotal}/{totalSteps} steps)</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-[#0d9488] transition-all duration-500" style={{ width: `${progressPercent}%` }}></div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsVaultOpen(true)}
                        className="flex items-center gap-2 px-4 py-2  border border-slate-200 rounded-lg font-semibold text-slate-700 hover:border-[#0d9488] bg-[#ebf5f4] transition-all"
                    >
                        Document Vault
                    </button>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-6 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm min-h-[600px] mb-12">
                <aside className="w-full md:w-[320px] bg-slate-50 border-r border-slate-200 p-4 md:p-6 overflow-y-auto max-h-[800px]">
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
                        isLast={state.currentStage === roadmapData.stages.length - 1 && state.currentStep === currentStage.steps.length - 1}
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