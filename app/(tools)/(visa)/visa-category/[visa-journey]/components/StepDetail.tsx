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
  Circle,
  Brain,
  LifeBuoy,
  Compass,
  MessageSquare,
  Calculator,
  Clock,
  Calendar,
  Camera,
  Files,
  PenTool,
  FolderLock,
  Globe,
  FileText,
  Heart,
  Shield,
  Zap,
  BookOpen,
} from "lucide-react";
import * as icons from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { RoadmapStep, RoadmapChapter } from "./types";
import { WizardState } from "@/app/(main)/dashboard/hooks/useWizard";
import { useLanguage } from "@/app/context/LanguageContext";
import { useRouter } from "next/navigation";

import { motion } from "framer-motion";

interface StepDetailProps {
  step: RoadmapStep;
  stage: RoadmapChapter;
  state: WizardState;
  onToggleComplete: (stepId: string, e: React.MouseEvent) => void;
  onNext: () => void;
  onPrev: () => void;
  isFirst: boolean;
  isLast: boolean;
}

const getToolIcon = (href: string) => {
  const h = href.toLowerCase();

  if (h.includes("visa-case-strength-checker")) return <icons.Brain className="h-3.5 w-3.5" />;
  if (h.includes("221g-action-planner")) return <icons.LifeBuoy className="h-3.5 w-3.5" />;
  if (h.includes("visa-eligibility")) return <icons.Compass className="h-3.5 w-3.5" />;
  if (h.includes("interview-prep")) return <icons.MessageSquare className="h-3.5 w-3.5" />;
  if (h.includes("affidavit-support-calculator"))
    return <icons.Calculator className="h-3.5 w-3.5" />;
  if (h.includes("iv-tool")) return <icons.Clock className="h-3.5 w-3.5" />;
  if (h.includes("visa-checker")) return <icons.Calendar className="h-3.5 w-3.5" />;
  if (h.includes("passport") && h.includes("guide")) return <icons.Globe className="h-3.5 w-3.5" />;
  if (h.includes("passport")) return <icons.Camera className="h-3.5 w-3.5" />;
  if (h.includes("pdf-processing")) return <icons.Files className="h-3.5 w-3.5" />;
  if (h.includes("signature-image-processing")) return <icons.PenTool className="h-3.5 w-3.5" />;
  if (h.includes("visa-forms")) return <icons.Wand2 className="h-3.5 w-3.5" />;
  if (h.includes("document-vault")) return <icons.FolderLock className="h-3.5 w-3.5" />;

  if (h.includes("cnic-guide") || h.includes("birth-certificate-guide"))
    return <icons.FileText className="h-3.5 w-3.5" />;
  if (h.includes("frc-guide")) return <icons.Globe className="h-3.5 w-3.5" />;
  if (h.includes("marriage") || h.includes("nikah")) return <icons.Heart className="h-3.5 w-3.5" />;
  if (h.includes("police")) return <icons.Shield className="h-3.5 w-3.5" />;
  if (h.includes("services")) return <icons.Zap className="h-3.5 w-3.5" />;
  if (h.includes("guide")) return <icons.BookOpen className="h-3.5 w-3.5" />;

  return <icons.Wand2 className="h-3.5 w-3.5" />;
};

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
  const sId = step.step_key || (step as any).id;
  const isCompleted = state.completedSteps.has(sId);
  const isUrdu = language === "ur";

  // Logic to match tools to specific actions or documents
  const allTools = step.relevant_tools || [];
  const matchedToolLabels = new Set<string>();
  const toolAssignments: Record<string, any[]> = {};

  const checkMatch = (text: string | undefined, toolLabel: string | undefined) => {
    if (!text || !toolLabel) return false;

    const textLower = text.toLowerCase();
    const toolLower = toolLabel.toLowerCase();

    // Direct inclusion check (loose)
    const ignoreWords = [
      "guide",
      "tool",
      "service",
      "app",
      "calculator",
      "finder",
      "monitor",
      "tracker",
      "analyzer",
      "prep",
      "filler",
      "toolkit",
      "booth",
      "kit",
    ];
    const importantWords = toolLower
      .split(/\s+/)
      .filter((w) => w.length > 3 && !ignoreWords.includes(w));

    if (importantWords.some((w) => textLower.includes(w))) return true;

    // Hardcoded synonym matches for the specific domain
    const synonymMap: Record<string, string[]> = {
      nikah: ["marriage", "wedding", "nikahnama"],
      marriage: ["nikah", "wedding"],
      birth: ["born", "birth"],
      passport: ["travel document", "photo", "biometric"],
      photo: ["passport", "booth", "picture"],
      translation: ["urdu", "english", "translator"],
      police: ["character", "criminal", "clearance"],
      medical: ["health", "vaccination", "polio", "doctor", "clinic"],
      affidavit: ["support", "sponsor", "financial"],
      form: ["i-130", "i-864", "ds-260", "filler", "application"],
      status: ["tracking", "case", "checker"],
    };

    for (const [key, synonyms] of Object.entries(synonymMap)) {
      const toolHasKey = toolLower.includes(key);
      const textHasSynonym = synonyms.some((s) => textLower.includes(s));
      if (toolHasKey && textHasSynonym) return true;

      const textHasKey = textLower.includes(key);
      const toolHasSynonym = synonyms.some((s) => toolLower.includes(s));
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
        (actionUr && tool.labelUr && checkMatch(actionUr, tool.labelUr))
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
        (docUr && tool.labelUr && checkMatch(docUr, tool.labelUr))
    );
    if (matches.length > 0) {
      toolAssignments[`doc-${idx}`] = matches;
      matches.forEach((m) => matchedToolLabels.add(m.label));
    }
  });

  return (
    <div id="step-content" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="mb-8">
        <div className="mb-4 flex items-center gap-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/50 bg-slate-100/80 px-3 py-1 text-[12px] font-bold tracking-wider text-slate-500 uppercase">
            <icons.Info className="h-3.5 w-3.5" />
            {t("visaJourney.stageStep", {
              stage: (state.currentStage + 1).toString(),
              step: ((state.currentStep || 0) + 1).toString(),
            })}
          </div>

          {(isUrdu && step.outputUr ? step.outputUr : step.output || step.success) && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="group rounded-full p-1 transition-colors hover:bg-indigo-50">
                    <HelpCircle className="animate-blinking h-4 w-4 cursor-help text-indigo-500 md:h-6 md:w-6" />
                  </button>
                </TooltipTrigger>
                <TooltipContent
                  side="right"
                  className="max-w-[300px] rounded-xl border-indigo-100 bg-white p-4 shadow-xl"
                >
                  <div className="flex flex-col gap-2">
                    <span className="text-[11px] font-black tracking-widest text-indigo-700 uppercase">
                      {t("visaJourney.successTitle")}
                    </span>
                    <SafeHtml
                      className="text-sm leading-relaxed font-bold text-indigo-900"
                      html={
                        (isUrdu && step.outputUr ? step.outputUr : step.output || step.success) ||
                        ""
                      }
                    />
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-start md:gap-6">
          <h2 className="text-2xl leading-tight font-extrabold text-slate-900 md:text-4xl">
            {isUrdu
              ? step.nameUr || step.titleUr || step.name || step.title
              : step.name || step.title}
          </h2>
        </div>

        <p className="mb-8 text-[17px] leading-relaxed font-medium text-slate-600 md:text-[19px]">
          {isUrdu && (step.descriptionUr || step.description)
            ? step.descriptionUr || step.description
            : step.description || t("visaJourney.defaultNotes")}
        </p>

        {/* Professional Badges */}
        {(step.who || step.where || step.whoUr || step.whereUr) && (
          <div className="mb-10 flex flex-wrap gap-3">
            {(step.who || step.whoUr) && (
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-sm font-bold text-slate-600">
                <Users className="h-4 w-4 text-slate-400" />{" "}
                {isUrdu && step.whoUr ? step.whoUr : step.who}
              </div>
            )}
            {(step.where || step.whereUr) && (
              <div className="flex items-center gap-2 rounded-xl border border-indigo-100 bg-indigo-50 px-3.5 py-1.5 text-sm font-bold text-indigo-600">
                <MapPin className="h-4 w-4 text-indigo-400" />{" "}
                {isUrdu && step.whereUr ? step.whereUr : step.where}
              </div>
            )}
          </div>
        )}

        {/* Info & Warnings */}
        {(step.info || step.warn) && (
          <div className="mb-8 flex flex-col gap-4">
            {step.info && (
              <div className="flex items-start gap-3 rounded-xl border border-sky-100 bg-sky-50 p-4">
                <Info className="mt-0.5 h-5 w-5 shrink-0 text-sky-500" />
                <p className="text-[15px] leading-relaxed font-medium text-sky-900">{step.info}</p>
              </div>
            )}
            {step.warn && (
              <div className="flex items-start gap-3 rounded-xl border border-amber-100 bg-amber-50 p-4">
                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-100 text-sm font-bold text-amber-600">
                  !
                </div>
                <p className="text-[15px] leading-relaxed font-medium text-amber-900">
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
          <div className="mb-8 rounded-2xl border border-slate-100 bg-slate-50/50 p-5 md:mb-10 md:p-8">
            <h4 className="mb-6 flex items-center gap-2 text-[14px] font-black tracking-widest text-slate-900 uppercase">
              <ClipboardList className="text-primary h-4 w-4" />
              {t("visaJourney.actionsRequired")}
            </h4>
            <ul className="space-y-4">
              {(isUrdu && step.actionsUr ? step.actionsUr : step.actions || [])?.map(
                (action: string, idx: number) => {
                  const relatedTools = toolAssignments[`action-${idx}`] || [];
                  return (
                    <li
                      key={`action-${idx}`}
                      className="group hover:border-primary/20 flex flex-col justify-between gap-4 rounded-xl border border-slate-100 bg-white p-4 transition-all hover:shadow-sm sm:flex-row sm:items-center"
                    >
                      <div className="flex flex-1 items-start gap-4 text-[16px] font-medium text-slate-700">
                        <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-slate-200 bg-slate-50">
                          <div className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                        </div>
                        <div className="leading-snug">{action}</div>
                      </div>

                      {relatedTools.length > 0 && (
                        <div className="flex flex-wrap gap-2 sm:ml-4">
                          {relatedTools.map((tool, tIdx) => (
                            <button
                              key={`act-tool-${idx}-${tIdx}`}
                              onClick={() => router.push(tool.href)}
                              className="bg-primary/5 text-primary border-primary/10 hover:bg-primary inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold shadow-sm transition-all hover:text-white active:scale-95"
                            >
                              {getToolIcon(tool.href)}
                              {isUrdu && tool.labelUr ? tool.labelUr : tool.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </li>
                  );
                }
              )}
              {(isUrdu && step.documentsUr ? step.documentsUr : step.documents || [])?.map(
                (doc: string, idx: number) => {
                  const relatedTools = toolAssignments[`doc-${idx}`] || [];
                  return (
                    <li
                      key={`doc-${idx}`}
                      className="group hover:border-primary/20 flex flex-col justify-between gap-4 rounded-xl border border-slate-100 bg-white p-4 transition-all hover:shadow-sm sm:flex-row sm:items-center"
                    >
                      <div className="flex flex-1 items-start gap-4 text-[16px] font-medium text-slate-700">
                        <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-slate-200 bg-slate-50">
                          <div className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                        </div>
                        <div className="leading-snug">
                          {doc}{" "}
                          <span className="text-primary/50 bg-primary/5 border-primary/10 ml-2 rounded border px-1.5 py-0.5 text-[10px] font-black tracking-tighter whitespace-nowrap uppercase">
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
                              className="bg-primary/5 text-primary border-primary/10 hover:bg-primary inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold shadow-sm transition-all hover:text-white active:scale-95"
                            >
                              {getToolIcon(tool.href)}
                              {isUrdu && tool.labelUr ? tool.labelUr : tool.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </li>
                  );
                }
              )}
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
          (t) => !matchedToolLabels.has(t.label)
        );
        if (remainingTools.length === 0) return null;

        return (
          <div className="bg-primary/5 border-primary/10 mb-8 rounded-2xl border p-6 md:mb-10 md:p-8">
            <h4 className="text-primary mb-6 flex items-center gap-2 text-[13px] font-black tracking-widest uppercase">
              <Wand2 className="h-4 w-4" />
              {t("visaJourney.relevantTools")}
            </h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {remainingTools.map((tool: any, idx: number) => (
                <button
                  key={`tool-${idx}`}
                  onClick={() => router.push(tool.href)}
                  className="border-primary/20 hover:border-primary group flex items-center justify-between rounded-xl border bg-white p-4 text-left transition-all hover:shadow-md"
                >
                  <div className="flex flex-col">
                    <span className="text-primary/60 mb-0.5 text-[10px] font-bold tracking-wider uppercase">
                      {t(`visaJourney.toolTypes.${tool.type || "tool"}`)}
                    </span>
                    <span className="group-hover:text-primary text-sm font-bold text-slate-900 transition-colors md:text-base">
                      {isUrdu && tool.labelUr ? tool.labelUr : tool.label}
                    </span>
                  </div>
                  <ArrowRight className="text-primary h-4 w-4 -translate-x-2 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
                </button>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Modern Navigation */}
      <div className="flex flex-col items-stretch justify-between gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:gap-4 md:pt-8">
        <button
          onClick={onPrev}
          disabled={isFirst}
          className={`flex w-full items-center justify-center gap-2 rounded-xl border px-6 py-3 font-bold transition-all sm:w-auto ${
            isFirst
              ? "cursor-not-allowed border-slate-100 text-slate-300"
              : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50 active:scale-95"
          }`}
        >
          <ArrowLeft className="h-4 w-4" /> {t("visaJourney.prevStep")}
        </button>

        <div className="mt-4 flex justify-center">
          {(() => {
            const hasOutput = isUrdu && step.outputUr ? step.outputUr : step.output || step.success;
            const toggleButton = (
              <div
                className="group flex cursor-pointer items-center gap-4 select-none"
                onClick={(e) => onToggleComplete(step.step_key || (step as any).id, e)}
              >
                <div className="flex flex-col text-left rtl:text-right">
                  <span
                    className={`text-lg font-bold transition-colors md:text-xl ${isCompleted ? "text-emerald-600" : "text-slate-700"}`}
                  >
                    {isCompleted ? t("visaJourney.completed") : t("visaJourney.markAsComplete")}
                  </span>
                  {!isCompleted && (
                    <span className="mt-0.5 text-[11px] font-medium tracking-widest text-slate-400 uppercase md:text-xs">
                      {t("visaJourney.clickToMarkAsRead")}
                    </span>
                  )}
                </div>

                <div
                  className={`relative h-[32px] w-[60px] rounded-full shadow-inner transition-all duration-300 ${
                    isCompleted
                      ? "bg-emerald-500 shadow-emerald-600/20"
                      : "bg-slate-200 shadow-slate-300/20"
                  }`}
                >
                  <motion.div
                    className="absolute top-1 left-1 flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-md"
                    animate={{
                      x: isCompleted ? 28 : 0,
                    }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  >
                    {isCompleted && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                  </motion.div>
                </div>
              </div>
            );

            if (hasOutput) {
              return (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>{toggleButton}</TooltipTrigger>
                    <TooltipContent
                      side="top"
                      className="feedback-tooltip z-50 max-w-[300px] rounded-2xl border-indigo-100 bg-white p-5 shadow-2xl"
                    >
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 animate-pulse rounded-full bg-indigo-500" />
                          <span className="text-[11px] font-black tracking-widest text-indigo-700 uppercase">
                            {t("visaJourney.successTitle")}
                          </span>
                        </div>
                        <SafeHtml
                          className="text-sm leading-relaxed font-bold text-indigo-950"
                          html={hasOutput}
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
            className="bg-primary hover:bg-primary/90 shadow-primary/10 flex w-full items-center justify-center gap-2 rounded-xl px-8 py-3 font-extrabold whitespace-nowrap text-white shadow-lg transition-all active:scale-95 sm:w-auto"
          >
            {t("visaJourney.nextStep")} <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
