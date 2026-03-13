import React from "react";
import {
  Info,
  Users,
  MapPin,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Circle,
  ClipboardList,
  Wand2,
} from "lucide-react";
import * as icons from "lucide-react";
import { RoadmapStep, RoadmapStage } from "./types";
import { WizardState } from "@/app/(main)/dashboard/hooks/useWizard";
import { useLanguage } from "@/app/context/LanguageContext";
import { useRouter } from "next/navigation";

interface StepDetailProps {
  step: RoadmapStep;
  stage: RoadmapStage;
  state: WizardState;
  onToggleComplete: (stepId: string, e: React.MouseEvent) => void;
  onNext: () => void;
  onPrev: () => void;
  isFirst: boolean;
  isLast: boolean;
}

export function StepDetail({
  step,
  stage,
  state,
  onToggleComplete,
  onNext,
  onPrev,
  isFirst,
  isLast,
}: StepDetailProps) {
  const router = useRouter();
  const { t, language } = useLanguage();
  const isCompleted = state.completedSteps.has(step.id);
  const isUrdu = language === "ur";

  return (
    <div
      id="step-content"
      className="animate-in fade-in slide-in-from-bottom-2 duration-300"
    >
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100/80 text-slate-500 rounded-full text-[12px] font-bold uppercase tracking-wider mb-4 border border-slate-200/50">
          <Info className="w-3.5 h-3.5" />
          Stage {state.currentStage + 1} — Step{" "}
          {step.stepNumber ?? (state.currentStep || 0) + 1}
        </div>

        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 md:gap-6 mb-6">
          <h2 className="text-2xl md:text-4xl font-extrabold text-slate-900 leading-tight">
            {isUrdu
              ? step.nameUr || step.titleUr || step.name || step.title
              : step.name || step.title}
          </h2>
        </div>

        <p className="text-[17px] md:text-[19px] text-slate-600 leading-relaxed font-medium mb-8">
          {isUrdu && (step.descriptionUr || step.description)
            ? step.descriptionUr || step.description
            : step.description || t("visaJourney.defaultNotes")}
        </p>

        {/* Professional Badges */}
        {(step.who || step.where || step.whoUr || step.whereUr) && (
          <div className="flex flex-wrap gap-3 mb-10">
            {(step.who || step.whoUr) && (
              <div className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-50 text-slate-600 rounded-xl text-sm font-bold border border-slate-200">
                <Users className="w-4 h-4 text-slate-400" />{" "}
                {isUrdu && step.whoUr ? step.whoUr : step.who}
              </div>
            )}
            {(step.where || step.whereUr) && (
              <div className="flex items-center gap-2 px-3.5 py-1.5 bg-indigo-50 text-indigo-600 rounded-xl text-sm font-bold border border-indigo-100">
                <MapPin className="w-4 h-4 text-indigo-400" />{" "}
                {isUrdu && step.whereUr ? step.whereUr : step.where}
              </div>
            )}
          </div>
        )}

        {/* Actions Required */}
        {((step.actions && step.actions.length > 0) ||
          (step.documents && step.documents.length > 0) ||
          (step.actionsUr && step.actionsUr.length > 0) ||
          (step.documentsUr && step.documentsUr.length > 0)) && (
          <div className="bg-slate-50/50 rounded-2xl p-5 md:p-8 mb-8 md:mb-10 border border-slate-100">
            <h4 className="flex items-center gap-2 text-[14px] font-black mb-6 text-slate-900 uppercase tracking-widest">
              <ClipboardList className="w-4 h-4 text-primary" />
              {t("visaJourney.actionsRequired")}
            </h4>
            <ul className="space-y-4">
              {(isUrdu && step.actionsUr
                ? step.actionsUr
                : step.actions || []
              )?.map((action: string, idx: number) => (
                <li
                  key={`action-${idx}`}
                  className="flex gap-4 items-start text-[16px] text-slate-700 font-medium group"
                >
                  <div className="w-6 h-6 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                  </div>
                  <div className="leading-snug">{action}</div>
                </li>
              ))}
              {(isUrdu && step.documentsUr
                ? step.documentsUr
                : step.documents || []
              )?.map((doc: string, idx: number) => (
                <li
                  key={`doc-${idx}`}
                  className="flex gap-4 items-start text-[16px] text-slate-700 font-medium group"
                >
                  <div className="w-6 h-6 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                  </div>
                  <div className="leading-snug">
                    {doc}{" "}
                    <span className="text-slate-400 text-sm font-normal ml-2">
                      {t("visaJourney.documentRequired")}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Success Condition */}
        {(isUrdu && step.outputUr
          ? step.outputUr
          : step.output || step.success) && (
          <div className="p-6 bg-emerald-50/40 rounded-2xl border border-emerald-100 mb-10">
            <h4 className="text-[13px] font-black mb-3 text-emerald-700 uppercase tracking-widest">
              {t("visaJourney.successTitle")}
            </h4>
            <div
              className="text-emerald-900 text-[16px] font-bold leading-relaxed"
              dangerouslySetInnerHTML={{
                __html:
                  isUrdu && step.outputUr
                    ? step.outputUr
                    : step.output || step.success,
              }}
            />
          </div>
        )}
      </div>

      {/* Official Sources */}
      {stage.sources && stage.sources.length > 0 && (
        <div className="bg-slate-50/50 rounded-2xl p-4 md:p-6 mb-8 md:mb-10 border border-slate-100">
          <h4 className="text-[13px] font-black mb-4 text-slate-500 uppercase tracking-widest">
            OFFICIAL SOURCES
          </h4>
          <div className="flex flex-wrap gap-3">
            {stage.sources.map((source, idx) => (
              <a
                key={`source-${idx}`}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-1 bg-white border border-[#e8f6f6] hover:border-[#14a0a6] text-[#0a5a5d] text-xs 2xl:text-sm font-semibold rounded-full transition-all shadow-sm"
              >
                <icons.ExternalLink className="w-4 h-4" />
                {isUrdu && source.labelUr ? source.labelUr : source.label}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Relevant Tools & Services */}
      {step.relevantTools && step.relevantTools.length > 0 && (
        <div className="bg-primary/5 rounded-2xl p-6 md:p-8 mb-8 md:mb-10 border border-primary/10">
          <h4 className="flex items-center gap-2 text-[13px] font-black mb-6 text-primary uppercase tracking-widest">
            <Wand2 className="w-4 h-4" />
            {t("visaJourney.relevantTools")}
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {step.relevantTools.map((tool: any, idx: number) => (
              <button
                key={`tool-${idx}`}
                onClick={() => router.push(tool.href)}
                className="flex items-center justify-between p-4 bg-white rounded-xl border border-primary/20 hover:border-primary hover:shadow-md transition-all group text-left"
              >
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-primary/60 uppercase tracking-wider mb-0.5">
                    {t(`visaJourney.toolTypes.${tool.type || "tool"}`)}
                  </span>
                  <span className="text-sm md:text-base font-bold text-slate-900 group-hover:text-primary transition-colors">
                    {isUrdu && tool.labelUr ? tool.labelUr : tool.label}
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Modern Navigation */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 sm:gap-4 mt-8 md:mt-12 pt-6 md:pt-8 border-t border-slate-100">
        <button
          onClick={onPrev}
          disabled={isFirst}
          className={`w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-all border ${
            isFirst
              ? "text-slate-300 border-slate-100 cursor-not-allowed"
              : "text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300 active:scale-95"
          }`}
        >
          <ArrowLeft className="w-4 h-4" /> {t("visaJourney.prevStep")}
        </button>

        <div className="flex justify-center">
          <button
            onClick={(e) => onToggleComplete(step.id, e)}
            className={`w-full sm:w-auto flex items-center justify-center space-x-2 md:justify-start gap-2 px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap active:scale-95 shadow-lg ${
              isCompleted
                ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                : "bg-primary text-white hover:bg-primary/90 shadow-primary/30"
            }`}
          >
            {isCompleted ? (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span>{t("visaJourney.completed")}</span>
              </>
            ) : (
              <>
                <Circle className="w-5 h-5" />
                <span>{t("visaJourney.markAsComplete")}</span>
              </>
            )}
          </button>
        </div>

        {!isLast && (
          <button
            onClick={onNext}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 bg-primary text-white rounded-xl font-extrabold hover:bg-primary/90 transition-all shadow-lg shadow-primary/10 active:scale-95 whitespace-nowrap"
          >
            {t("visaJourney.nextStep")} <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
