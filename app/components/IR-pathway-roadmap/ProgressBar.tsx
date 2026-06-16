"use client";

import { useEffect, useState } from "react";

interface ProgressBarProps {
  completed: number;
  total: number;
}

export default function ProgressBar({ completed, total }: ProgressBarProps) {
  const [displayProgress, setDisplayProgress] = useState(0);
  const percentage = Math.round((completed / total) * 100);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDisplayProgress(percentage);
    }, 100);
    return () => clearTimeout(timer);
  }, [percentage]);

  return (
    <div className="w-full space-y-3 animate-fade-in">
      {/* Progress Bar Container */}
      <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden shadow-sm">
        <div
          className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-700 ease-out shadow-lg"
          style={{ width: `${displayProgress}%` }}
        />
      </div>

      {/* Progress Stats */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">
            Progress: {completed} of {total} steps
          </p>
          <p className="text-xs text-muted-foreground">
            {completed === 0 && "Ready to start your journey"}
            {completed > 0 && completed < total && `${total - completed} steps remaining`}
            {completed === total && "All steps completed!"}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-primary">{percentage}%</p>
        </div>
      </div>
    </div>
  );
}
