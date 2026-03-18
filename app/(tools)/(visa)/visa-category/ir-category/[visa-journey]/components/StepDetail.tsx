import React from "react";
import {
  Info,
  Users,
  MapPin,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Wand2,
  HelpCircle,
  Circle
} from "lucide-react";
import * as icons from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { RoadmapStep, RoadmapStage } from "./types";
import { WizardState } from "@/app/(main)/dashboard/hooks/useWizard";
import { useLanguage } from "@/app/context/LanguageContext";
import { useRouter } from "next/navigation";

import { motion } from "framer-motion";

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
  stage: _stage,
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

  // Logic to match tools to specific actions or documents
  const allTools = step.relevantTools || [];
  const matchedToolLabels = new Set<string>();
  const toolAssignments: Record<string, any[]> = {};

  const checkMatch = (text: string | undefined, toolLabel: string | undefined) => {
    if (!text || !toolLabel) return false;
    
    const textLower = text.toLowerCase();
    const toolLower = toolLabel.toLowerCase();

    // Direct inclusion check (loose)
    const ignoreWords = ["guide", "tool", "service", "app", "calculator", "finder", "monitor", "tracker", "analyzer", "prep", "filler", "toolkit", "booth", "kit"];
    const importantWords = toolLower.split(/\s+/).filter(w => w.length > 3 && !ignoreWords.includes(w));
    
    if (importantWords.some(w => textLower.includes(w))) return true;

    // Hardcoded synonym matches for the specific domain
    const synonymMap: Record<string, string[]> = {
      "nikah": ["marriage", "wedding", "nikahnama"],
      "marriage": ["nikah", "wedding"],
      "birth": ["born", "birth"],
      "passport": ["travel document", "photo", "biometric"],
      "photo": ["passport", "booth", "picture"],
      "translation": ["urdu", "english", "translator"],
      "police": ["character", "criminal", "clearance"],
      "medical": ["health", "vaccination", "polio", "doctor", "clinic"],
      "affidavit": ["support", "sponsor", "financial"],
      "form": ["i-130", "i-864", "ds-260", "filler", "application"],
      "status": ["tracking", "case", "checker"],
    };

    for (const [key, synonyms] of Object.entries(synonymMap)) {
      const toolHasKey = toolLower.includes(key);
      const textHasSynonym = synonyms.some(s => textLower.includes(s));
      if (toolHasKey && textHasSynonym) return true;
      
      const textHasKey = textLower.includes(key);
      const toolHasSynonym = synonyms.some(s => toolLower.includes(s));
      if (textHasKey && toolHasSynonym) return true;
    }

    return false;
  };

  // Pre-calculate action assignments
  (step.actions || []).forEach((_action, idx) => {
    const actionEn = step.actions?.[idx];
    const actionUr = step.actionsUr?.[idx];
    const matches = allTools.filter(
      (tool) =>
        checkMatch(actionEn, tool.label) ||
        (tool.labelUr && checkMatch(actionEn, tool.labelUr)) ||
        (actionUr && checkMatch(actionUr, tool.label)) ||
        (actionUr && tool.labelUr && checkMatch(actionUr, tool.labelUr)),
    );
    if (matches.length > 0) {
      toolAssignments[`action-${idx}`] = matches;
      matches.forEach((m) => matchedToolLabels.add(m.label));
    }
  });

  // Pre-calculate document assignments
  (step.documents || []).forEach((_doc, idx) => {
    const docEn = step.documents?.[idx];
    const docUr = step.documentsUr?.[idx];
    const matches = allTools.filter(
      (tool) =>
        checkMatch(docEn, tool.label) ||
        (tool.labelUr && checkMatch(docEn, tool.labelUr)) ||
        (docUr && checkMatch(docUr, tool.label)) ||
        (docUr && tool.labelUr && checkMatch(docUr, tool.labelUr)),
    );
    if (matches.length > 0) {
      toolAssignments[`doc-${idx}`] = matches;
      matches.forEach((m) => matchedToolLabels.add(m.label));
    }
  });

  return (
    <div
      id="step-content"
      className="animate-in fade-in slide-in-from-bottom-2 duration-300"
    >
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100/80 text-slate-500 rounded-full text-[12px] font-bold uppercase tracking-wider border border-slate-200/50">
            <icons.Info className="w-3.5 h-3.5" />
            {t("visaJourney.stageStep", {
              stage: (state.currentStage + 1).toString(),
              step: ((state.currentStep || 0) + 1).toString(),
            })}
          </div>

          {(isUrdu && step.outputUr
            ? step.outputUr
            : step.output || step.success) && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="p-1 rounded-full hover:bg-indigo-50 transition-colors group">
                    <HelpCircle className="w-4 h-4 md:w-6 md:h-6 text-indigo-500 animate-blinking cursor-help" />
                  </button>
                </TooltipTrigger>
                <TooltipContent
                  side="right"
                  className="max-w-[300px] p-4 bg-white border-indigo-100 shadow-xl rounded-xl"
                >
                  <div className="flex flex-col gap-2">
                    <span className="text-[11px] font-black text-indigo-700 uppercase tracking-widest">
                      {t("visaJourney.successTitle")}
                    </span>
                    <div
                      className="text-indigo-900 text-sm font-bold leading-relaxed"
                      dangerouslySetInnerHTML={{
                        __html:
                          (isUrdu && step.outputUr
                            ? step.outputUr
                            : step.output || step.success) || "",
                      }}
                    />
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
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

        {/* Info & Warnings */}
        {(step.info || step.warn) && (
          <div className="flex flex-col gap-4 mb-8">
            {step.info && (
              <div className="flex items-start gap-3 p-4 bg-sky-50 rounded-xl border border-sky-100">
                <Info className="w-5 h-5 text-sky-500 mt-0.5 shrink-0" />
                <p className="text-[15px] font-medium text-sky-900 leading-relaxed">
                  {step.info}
                </p>
              </div>
            )}
            {step.warn && (
              <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-xl border border-amber-100">
                <div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center shrink-0 mt-0.5 text-amber-600 font-bold text-sm">
                  !
                </div>
                <p className="text-[15px] font-medium text-amber-900 leading-relaxed">
                  {step.warn}
                </p>
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
              )?.map((action: string, idx: number) => {
                const relatedTools = toolAssignments[`action-${idx}`] || [];
                return (
                  <li
                    key={`action-${idx}`}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white rounded-xl border border-slate-100 group transition-all hover:border-primary/20 hover:shadow-sm"
                  >
                    <div className="flex gap-4 items-start text-[16px] text-slate-700 font-medium flex-1">
                      <div className="w-6 h-6 rounded-full bg-slate-50 border-2 border-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                      </div>
                      <div className="leading-snug">{action}</div>
                    </div>

                    {relatedTools.length > 0 && (
                      <div className="flex flex-wrap gap-2 sm:ml-4">
                        {relatedTools.map((tool, tIdx) => (
                          <button
                            key={`act-tool-${idx}-${tIdx}`}
                            onClick={() => router.push(tool.href)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/5 text-primary border border-primary/10 rounded-lg text-xs font-bold hover:bg-primary hover:text-white transition-all shadow-sm active:scale-95"
                          >
                            <icons.Wand2 className="w-3.5 h-3.5" />
                            {isUrdu && tool.labelUr ? tool.labelUr : tool.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </li>
                );
              })}
              {(isUrdu && step.documentsUr
                ? step.documentsUr
                : step.documents || []
              )?.map((doc: string, idx: number) => {
                const relatedTools = toolAssignments[`doc-${idx}`] || [];
                return (
                  <li
                    key={`doc-${idx}`}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white rounded-xl border border-slate-100 group transition-all hover:border-primary/20 hover:shadow-sm"
                  >
                    <div className="flex gap-4 items-start text-[16px] text-slate-700 font-medium flex-1">
                      <div className="w-6 h-6 rounded-full bg-slate-50 border-2 border-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                      </div>
                      <div className="leading-snug">
                        {doc}{" "}
                        <span className="text-primary/50 text-[10px] font-black uppercase tracking-tighter ml-2 px-1.5 py-0.5 bg-primary/5 rounded border border-primary/10 whitespace-nowrap">
                          {t("visaJourney.documentRequired")}
                        </span>
                      </div>
                    </div>

                    {relatedTools.length > 0 && (
                      <div className="flex flex-wrap gap-2 sm:ml-4">
                        {relatedTools.map((tool, tIdx) => (
                          <button
                            key={`doc-tool-${idx}-${tIdx}`}
                            onClick={() => router.push(tool.href)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/5 text-primary border border-primary/10 rounded-lg text-xs font-bold hover:bg-primary hover:text-white transition-all shadow-sm active:scale-95"
                          >
                            <icons.Wand2 className="w-3.5 h-3.5" />
                            {isUrdu && tool.labelUr ? tool.labelUr : tool.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Success Condition */}
        {/* {(isUrdu && step.outputUr
          ? step.outputUr
          : step.output || step.success) && (
          <div className="p-6 bg-indigo-50/40 rounded-2xl border border-indigo-100 mb-10">
            <h4 className="text-[13px] font-black mb-3 text-indigo-700 uppercase tracking-widest">
              {t("visaJourney.successTitle")}
            </h4>
            <div
              className="text-indigo-900 text-[16px] font-bold leading-relaxed"
              dangerouslySetInnerHTML={{
                __html:
                  (isUrdu && step.outputUr
                    ? step.outputUr
                    : step.output || step.success) || "",
              }}
            />
          </div>
        )} */}
      </div>

      {/* Official Sources */}
      {/* {stage.sources && stage.sources.length > 0 && (
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
      )} */}

      {/* Relevant Tools & Services */}
      {(() => {
        const remainingTools = (step.relevantTools || []).filter(
          (t) => !matchedToolLabels.has(t.label),
        );
        if (remainingTools.length === 0) return null;

        return (
          <div className="bg-primary/5 rounded-2xl p-6 md:p-8 mb-8 md:mb-10 border border-primary/10">
            <h4 className="flex items-center gap-2 text-[13px] font-black mb-6 text-primary uppercase tracking-widest">
              <Wand2 className="w-4 h-4" />
              {t("visaJourney.relevantTools")}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {remainingTools.map((tool: any, idx: number) => (
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
        );
      })()}

      {/* Modern Navigation */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 sm:gap-4 pt-6 md:pt-8 border-t border-slate-100">
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

        <div className="flex justify-center mt-4">
          {(() => {
            const hasOutput = isUrdu && step.outputUr ? step.outputUr : step.output || step.success;
            const toggleButton = (
              <div 
                className="flex items-center gap-4 cursor-pointer select-none group"
                onClick={(e) => onToggleComplete(step.id, e)}
              >
                <div className="flex flex-col text-left rtl:text-right">
                  <span className={`text-lg md:text-xl font-bold transition-colors ${isCompleted ? 'text-emerald-600' : 'text-slate-700'}`}>
                    {isCompleted ? t("visaJourney.completed") : t("visaJourney.markAsComplete")}
                  </span>
                  {!isCompleted && (
                    <span className="text-[11px] md:text-xs font-medium text-slate-400 uppercase tracking-widest mt-0.5">
                      {t("visaJourney.clickToMarkAsRead")}
                    </span>
                  )}
                </div>

                <div 
                  className={`relative w-[60px] h-[32px] rounded-full transition-all duration-300 shadow-inner ${
                    isCompleted ? 'bg-emerald-500 shadow-emerald-600/20' : 'bg-slate-200 shadow-slate-300/20'
                  }`}
                >
                  <motion.div
                    className="absolute top-1 left-1 w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center"
                    animate={{ 
                      x: isCompleted ? 28 : 0,
                    }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  >
                    {isCompleted && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    )}
                  </motion.div>
                </div>
              </div>
            );

            if (hasOutput) {
              return (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      {toggleButton}
                    </TooltipTrigger>
                    <TooltipContent
                      side="top"
                      className="max-w-[300px] p-5 bg-white border-indigo-100 shadow-2xl rounded-2xl z-50 feedback-tooltip"
                    >
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                          <span className="text-[11px] font-black text-indigo-700 uppercase tracking-widest">
                            {t("visaJourney.successTitle")}
                          </span>
                        </div>
                        <div
                          className="text-indigo-950 text-sm font-bold leading-relaxed"
                          dangerouslySetInnerHTML={{
                            __html: hasOutput.toString(),
                          }}
                        />
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            }

            return toggleButton;
          })()}
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
