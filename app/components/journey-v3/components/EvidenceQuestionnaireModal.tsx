"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ClipboardList, ChevronDown } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { EVIDENCE_QUESTIONNAIRE } from "@/lib/journey/evidence-gap";
import type { EvidenceQuestion } from "@/lib/journey/evidence-gap";

export interface EvidenceQuestionnaireModalProps {
  isOpen: boolean;
  onClose: () => void;
  responses: Record<string, boolean>;
  onSave: (responses: Record<string, boolean>) => void;
  /**
   * Category-specific questionnaire items. Defaults to the full IR-1 set so
   * existing (spouse) callers are unchanged; IR-5 passes the marriage-free set.
   */
  questions?: readonly EvidenceQuestion[];
}

export function EvidenceQuestionnaireModal({
  isOpen,
  onClose,
  responses,
  onSave,
  questions = EVIDENCE_QUESTIONNAIRE,
}: EvidenceQuestionnaireModalProps) {
  const [local, setLocal] = useState<Record<string, boolean>>(responses);

  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    for (const q of questions) {
      if (responses[q.id]) initial.add(q.group);
    }
    if (initial.size === 0 && questions.length > 0) {
      initial.add(questions[0].group);
    }
    return initial;
  });

  const grouped: Record<string, EvidenceQuestion[]> = {};
  for (const q of questions) {
    if (!grouped[q.group]) grouped[q.group] = [];
    grouped[q.group].push(q);
  }

  const toggle = (id: string) => {
    setLocal((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleGroup = (group: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(group)) next.delete(group);
      else next.add(group);
      return next;
    });
  };

  const answeredCount = Object.values(local).filter(Boolean).length;
  const totalQuestions = questions.length;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl w-[95vw] p-0 overflow-hidden border-none rounded-[28px] shadow-2xl">
        <div className="relative overflow-hidden bg-white">
          {/* Background Decorations */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl pointer-events-none" />

          <div className="relative">
            {/* Header */}
            <div className="px-8 pt-8 pb-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                    <ClipboardList size={24} />
                  </div>
                  <div>
                    <DialogTitle className="text-xl font-bold text-[#0f1f38]">
                      Evidence Questionnaire
                    </DialogTitle>
                    <p className="text-sm text-[#6b8097] mt-0.5">
                      Tell us about evidence you have, even if not uploaded yet
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5 text-[#6b8097]" />
                </button>
              </div>

              {/* Progress indicator */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-300"
                    style={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-[#6b8097]">
                  {answeredCount}/{totalQuestions}
                </span>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="overflow-y-auto max-h-[50vh] px-8 pb-6 space-y-4">
              {Object.entries(grouped).map(([group, questions]) => {
                const groupAnswered = questions.filter((q) => local[q.id]).length;
                const isExpanded = expandedGroups.has(group);

                return (
                  <div
                    key={group}
                    className="rounded-2xl border border-[#d0e4f7]/60 bg-[#f8fbff] overflow-hidden"
                  >
                    <button
                      onClick={() => toggleGroup(group)}
                      className="w-full flex items-center justify-between px-5 py-4 hover:bg-[#f0f7ff] transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-white border border-[#d0e4f7] flex items-center justify-center">
                          <ClipboardList className="w-4 h-4 text-primary" />
                        </div>
                        <div className="text-left">
                          <h4 className="text-sm font-semibold text-[#0f1f38]">{group}</h4>
                          <p className="text-[11px] text-[#6b8097]">
                            {groupAnswered}/{questions.length} answered
                          </p>
                        </div>
                      </div>
                      <ChevronDown
                        className="w-5 h-5 text-[#6b8097] transition-transform"
                        style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0)" }}
                      />
                    </button>

                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="px-5 pb-4 space-y-2">
                            {questions.map((q) => (
                              <div
                                key={q.id}
                                className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                                  local[q.id]
                                    ? "bg-white border-primary/30 shadow-sm"
                                    : "bg-white/60 border-[#d0e4f7]/40 hover:border-[#d0e4f7]"
                                }`}
                              >
                                <div className="flex-1 min-w-0 mr-4">
                                  <p className="text-[13px] font-medium text-[#0f1f38]">
                                    {q.question}
                                  </p>
                                  {q.description && (
                                    <p className="text-[11px] text-[#6b8097] mt-1 leading-relaxed">
                                      {q.description}
                                    </p>
                                  )}
                                </div>
                                <div className="shrink-0 flex items-center gap-2">
                                  <span
                                    className={`text-[10px] font-bold uppercase transition-colors ${
                                      local[q.id] ? "text-primary" : "text-slate-400"
                                    }`}
                                  >
                                    {local[q.id] ? "Yes" : "No"}
                                  </span>
                                  <button
                                    onClick={() => toggle(q.id)}
                                    className={`w-12 h-7 rounded-full transition-all duration-200 ${
                                      local[q.id]
                                        ? "bg-primary shadow-[0_2px_8px_rgba(13,148,136,0.3)]"
                                        : "bg-slate-200"
                                    }`}
                                  >
                                    <div
                                      className="bg-white rounded-full shadow-sm transition-transform duration-200"
                                      style={{
                                        width: 22,
                                        height: 22,
                                        transform: local[q.id]
                                          ? "translateX(22px)"
                                          : "translateX(3px)",
                                      }}
                                    />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="px-8 py-6 border-t border-[#d0e4f7]/50 flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-full border border-[#d0e4f7] text-sm font-semibold text-[#6b8097] hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onSave(local);
                  onClose();
                }}
                className="flex-1 py-3 rounded-full text-sm font-semibold text-white bg-primary hover:bg-primary/90 transition-colors shadow-[0_4px_12px_rgba(13,148,136,0.25)]"
              >
                Save Answers
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
