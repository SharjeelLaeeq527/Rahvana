import React from "react";
import { WizardState } from "@/app/(main)/dashboard/hooks/useWizard";
import { useLanguage } from "@/app/context/LanguageContext";
import {
  CheckCircle2,
  Circle,
  ArrowRight,
  ArrowLeft,
  Users,
  MapPin,
  Info,
  ClipboardList,
  ExternalLink,
} from "lucide-react";
import { RoadmapStep, RoadmapStage } from "./types";

interface StepDetailProps {
  step: RoadmapStep;
  stage: RoadmapStage;
  state: WizardState;
  onToggleComplete: (id: string, e: React.MouseEvent) => void;
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
          {t("ir1Journey.stageStep", { stage: stage.id.toString(), step: step.id.toString() })}
        </div>

        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 md:gap-6 mb-6">
          <h2 className="text-2xl md:text-4xl font-extrabold text-slate-900 leading-tight">
            {isUrdu && step.nameUr ? step.nameUr : step.name}
          </h2>
        </div>

        <div className="text-slate-600 text-[15px] md:text-[17px] leading-relaxed pb-6 md:pb-8 mb-6 md:mb-8 border-b border-slate-100">
          {isUrdu && (step.descriptionUr || step.notesUr) ? (step.descriptionUr || step.notesUr) : (step.description || step.notes ||
            t("stepDetail.defaultNotes", { stepName: step.name }))}
            
          {/* Info Box */}
          {step.info && (
            <div className="mt-6 p-4 rounded-xl border border-blue-200 bg-blue-50 text-blue-800 text-[14px] leading-relaxed">
              <strong>ℹ Note:</strong> {step.info}
            </div>
          )}

          {/* Warning Box */}
          {step.warn && (
            <div className="mt-6 p-4 rounded-xl border border-amber-200 bg-amber-50 text-amber-800 text-[14px] leading-relaxed">
              <strong>⚠ Important:</strong> {step.warn}
            </div>
          )}
        </div>

        {/* Professional Badges */}
        {(step.who || step.where || step.whoUr || step.whereUr) && (
          <div className="flex flex-wrap gap-3 mb-10">
            {(step.who || step.whoUr) && (
              <div className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-50 text-slate-600 rounded-xl text-sm font-bold border border-slate-200">
                <Users className="w-4 h-4 text-slate-400" /> {isUrdu && step.whoUr ? step.whoUr : step.who}
              </div>
            )}
            {(step.where || step.whereUr) && (
              <div className="flex items-center gap-2 px-3.5 py-1.5 bg-indigo-50 text-indigo-600 rounded-xl text-sm font-bold border border-indigo-100">
                <MapPin className="w-4 h-4 text-indigo-400" /> {isUrdu && step.whereUr ? step.whereUr : step.where}
              </div>
            )}
          </div>
        )}

        {/* Actions Required */}
        {((step.actions && step.actions.length > 0) || (step.documents && step.documents.length > 0) || (step.actionsUr && step.actionsUr.length > 0) || (step.documentsUr && step.documentsUr.length > 0)) && (
          <div className="bg-slate-50/50 rounded-2xl p-5 md:p-8 mb-8 md:mb-10 border border-slate-100">
            <h4 className="flex items-center gap-2 text-[14px] font-black mb-6 text-slate-900 uppercase tracking-widest">
              <ClipboardList className="w-4 h-4 text-primary" />
              {t("stepDetail.actionsRequired")}
            </h4>
            <ul className="space-y-4">
              {(isUrdu && step.actionsUr ? step.actionsUr : (step.actions || []))?.map((action: string, idx: number) => (
                <li
                  key={`action-${idx}`}
                  className="flex gap-4 items-start text-[16px] text-slate-700 font-medium group"
                >
                  <div className="w-6 h-6 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center shrink-0 mt-0.5 group-hover:border-primary/50 transition-colors">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300 group-hover:bg-primary transition-colors" />
                  </div>
                  <div className="leading-snug">{action}</div>
                </li>
              ))}
              {(isUrdu && step.documentsUr ? step.documentsUr : (step.documents || []))?.map((doc: string, idx: number) => (
                <li
                  key={`doc-${idx}`}
                  className="flex gap-4 items-start text-[16px] text-slate-700 font-medium group"
                >
                  <div className="w-6 h-6 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center shrink-0 mt-0.5 group-hover:border-primary/50 transition-colors">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300 group-hover:bg-primary transition-colors" />
                  </div>
                  <div className="leading-snug">
                    {doc}{" "}
                    <span className="text-slate-400 text-sm font-normal ml-2">
                      {t("stepDetail.documentRequired")}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Success Condition */}
        {(isUrdu && step.outputUr ? step.outputUr : step.output) && (
          <div className="p-6 bg-emerald-50/40 rounded-2xl border border-emerald-100 mb-10">
            <h4 className="text-[13px] font-black mb-3 text-emerald-700 uppercase tracking-widest">
              {t("stepDetail.successCondition")}
            </h4>
            <p className="text-emerald-900 text-[16px] font-bold leading-relaxed">
              {isUrdu && step.outputUr ? step.outputUr : step.output}
            </p>
          </div>
        )}

        {/* Official Sources */}
        {stage.sources && stage.sources.length > 0 && (
          <div className="bg-slate-50/80 rounded-2xl p-5 md:p-6 mb-8 md:mb-10 border border-slate-200">
            <h4 className="text-[12px] font-extrabold mb-4 text-slate-500 uppercase tracking-widest">
              {t("stepDetail.officialSources", { defaultValue: "Official Sources" }) || "Official Sources"}
            </h4>
            <div className="flex flex-wrap gap-3">
              {stage.sources.map((src, idx) => (
                <a
                  key={`src-${idx}`}
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50/50 text-blue-700 text-[13px] font-bold rounded-full border border-blue-200 hover:bg-blue-100/50 hover:border-blue-300 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  {isUrdu && src.labelUr ? src.labelUr : src.label}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-center mb-8">
        <button
          onClick={(e) => onToggleComplete(step.id, e)}
          className={`w-full md:w-auto flex items-center justify-center space-x-2 md:justify-start gap-2 px-8 py-4 rounded-xl font-bold text-lg transition-all whitespace-nowrap active:scale-95 shadow-lg ${
            isCompleted
              ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
              : "bg-primary text-white hover:bg-primary/90 shadow-primary/30"
          }`}
        >
          {isCompleted ? (
            <>
              <CheckCircle2 className="w-6 h-6" />
              {t("stepDetail.completed")}
            </>
          ) : (
            <>
              <Circle className="w-6 h-6" />
              {t("stepDetail.markComplete")}
            </>
          )}
        </button>
      </div>

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
          <ArrowLeft className="w-4 h-4" /> {t("stepDetail.prevStep")}
        </button>

        {!isLast && (
          <button
            onClick={onNext}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 bg-primary text-white rounded-xl font-extrabold hover:bg-primary/90 transition-all shadow-lg shadow-primary/10 active:scale-95 whitespace-nowrap"
          >
            {t("stepDetail.nextStep")} <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
