"use client";

import React from "react";
import { useCnicWizard } from "../CnicContext";
import {
  CheckCircle2,
  User,
  Map,
  BookmarkPlus,
  MapPin,
  ShieldCheck,
} from "lucide-react";

const STEPS = [
  { id: 1, title: "Application Setup", icon: User },
  { id: 2, title: "Location Details", icon: MapPin },
  { id: 3, title: "Process Roadmap", icon: Map },
  { id: 4, title: "Validation Checklist", icon: ShieldCheck },
];

export default function ProgressTree() {
  const { state, setCurrentStep, addToActiveWizards } = useCnicWizard();

  const getStepStatus = (stepId: number) => {
    if (state.completedSteps.includes(stepId)) return "complete";
    if (stepId === state.currentStep) return "current";
    return "upcoming";
  };

  const handleStepClick = (stepId: number) => {
    if (state.completedSteps.includes(stepId) || stepId === state.currentStep) {
      setCurrentStep(stepId);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-slate-200">
        <button
          onClick={addToActiveWizards}
          disabled={state.isAddedToActive}
          className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${
            state.isAddedToActive
              ? "bg-primary/10 text-primary border border-primary/20 cursor-default"
              : "bg-primary text-white hover:bg-primary/90"
          }`}
        >
          <BookmarkPlus className="w-5 h-5" />
          {state.isAddedToActive ? "Saved to Profile" : "Add to Active Wizards"}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        <div className="space-y-1">
          {STEPS.map((step, index) => {
            const status = getStepStatus(step.id);
            const Icon = step.icon;
            const isClickable = status === "complete" || status === "current";

            return (
              <div key={step.id}>
                <button
                  onClick={() => handleStepClick(step.id)}
                  disabled={!isClickable}
                  className={`w-full flex items-start gap-3 p-2 rounded-lg text-left transition-colors ${
                    status === "complete"
                      ? "hover:bg-slate-50 cursor-pointer text-slate-700"
                      : status === "current"
                        ? "bg-primary/10 cursor-pointer text-primary"
                        : "opacity-50 cursor-not-allowed text-slate-500"
                  }`}
                >
                  <div className="shrink-0 mt-0.5">
                    {status === "complete" ? (
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5 text-primary" />
                      </div>
                    ) : (
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          status === "current"
                            ? "bg-primary shadow-md"
                            : "bg-slate-100"
                        }`}
                      >
                        <Icon
                          className={`w-4 h-4 ${
                            status === "current"
                              ? "text-white"
                              : "text-slate-400"
                          }`}
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 py-1">
                    <p
                      className={`font-medium text-sm truncate ${status === "current" ? "font-bold" : ""}`}
                    >
                      {step.title}
                    </p>
                    <p
                      className={`text-xs mt-0.5 ${
                        status === "current" ? "text-primary" : "text-slate-400"
                      }`}
                    >
                      {status === "complete"
                        ? "Completed"
                        : status === "current"
                          ? "In Progress"
                          : "Upcoming"}
                    </p>
                  </div>
                </button>

                {/* Connector Line */}
                {index < STEPS.length - 1 && (
                  <div className="flex justify-start pl-6 py-0.5">
                    <div
                      className={`w-0.5 h-4 ${
                        state.completedSteps.includes(step.id)
                          ? "bg-primary"
                          : "bg-slate-200"
                      }`}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Progress Summary */}
      <div className="p-4 border-t border-slate-200 bg-slate-50">
        <div className="flex items-center justify-between text-xs text-slate-500 mb-2 font-medium">
          <span>Overall Progress</span>
          <span className="text-primary bg-primary/10 px-2 py-0.5 rounded-full">
            {state.completedSteps.length} / {STEPS.length} Steps
          </span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-1.5 animate-pulse">
          <div
            className="bg-primary h-1.5 rounded-full transition-all duration-500 shadow-sm"
            style={{
              width: `${(state.completedSteps.length / STEPS.length) * 100}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
