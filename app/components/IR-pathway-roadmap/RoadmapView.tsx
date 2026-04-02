"use client";

import { useStore } from "@/lib/store";
import { immigrationSteps } from "@/lib/steps";
import IslandCard from "./IslandCard";
import StepDialog from "./StepDialog";
import ProgressBar from "./ProgressBar";
import CompletionDialog from "./CompletionDialog";
import Confetti from "react-confetti";
import { useEffect, useState } from "react";

interface RoadmapViewProps {
  onClose?: () => void;
  showTitle?: boolean;
}

export default function RoadmapView({ showTitle = true }: RoadmapViewProps) {
  const { completedSteps: completed, completeStep } = useStore();
  const [openStep, setOpenStep] = useState<number | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
  const [mounted, setMounted] = useState(false);

  const progress = (completed.length / immigrationSteps.length) * 100;
  const isComplete = completed.length === immigrationSteps.length;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isComplete) {
      setShowConfetti(true);
      setShowCompletionDialog(true);
    }
  }, [isComplete]);

  if (!mounted) return null;

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950">
      {showConfetti && <Confetti recycle={false} numberOfPieces={200} gravity={0.2} style={{ position: 'fixed', zIndex: 100 }} />}
      
      {/* Header with Progress */}
      <div className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-border shadow-sm px-6 py-6">
        <div className="flex flex-col gap-4 w-full">
          {showTitle && (
            <div className="animate-slide-left">
              <h1 className="text-3xl md:text-4xl font-bold text-foreground text-balance">
                Pakistan to USA Spousal Journey
              </h1>
              <p className="text-muted-foreground mt-1">Track your immigration pathway step by step</p>
            </div>
          )}
          <ProgressBar completed={completed.length} total={immigrationSteps.length} />
        </div>
      </div>

      <main className="flex-1 overflow-y-auto p-6 md:p-8">
        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
          {immigrationSteps.map((step, index) => (
            <div
              key={step.id}
              className="animate-slide-up"
              style={{
                animationDelay: `${index * 50}ms`,
              }}
            >
              <IslandCard
                step={step}
                isCompleted={completed.includes(step.id)}
                onClick={() => setOpenStep(step.id)}
              />
            </div>
          ))}
        </div>
      </main>

      <StepDialog
        step={immigrationSteps.find((s) => s.id === openStep)}
        isCompleted={completed.includes(openStep || 0)}
        open={!!openStep}
        onOpenChange={(o) => !o && setOpenStep(null)}
        onComplete={() => {
          if (openStep) {
            completeStep(openStep);
            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 3000);
          }
        }}
      />

      <CompletionDialog
        open={showCompletionDialog}
        onOpenChange={setShowCompletionDialog}
        progress={progress}
      />
    </div>
  );
}
