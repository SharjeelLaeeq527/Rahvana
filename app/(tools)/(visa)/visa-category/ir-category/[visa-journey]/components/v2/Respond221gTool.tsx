"use client";

import React, { useState } from "react";
import { Calendar } from "lucide-react";
import ActionPlanResults from "@/app/(tools)/(visa)/221g-action-planner/components/ActionPlanResults";
import {
  FormData as PlannerFormData,
  FormSelections,
} from "@/app/(tools)/(visa)/221g-action-planner/types/221g";

interface Respond221gToolProps {
  tool: any;
  state: any;
  actions: any;
  guard?: () => boolean;
}

export const Respond221gTool: React.FC<Respond221gToolProps> = ({
  tool,
  state,
  actions,
  guard,
}) => {
  const [submissionDate, setSubmissionDate] = useState<string>(
    state.metadata?.response221gDate || ""
  );
  const [submissionMethod, setSubmissionMethod] = useState<string>(
    state.metadata?.response221gMethod || ""
  );
  const [isSaved, setIsSaved] = useState<boolean>(
    !!state.metadata?.response221gDate
  );

  const selections: FormSelections =
    state.metadata?.twentyTwoOneGSelections || {};

  const formData: PlannerFormData = {
    visaType: "Immigrant",
    visaCategory: "IR-1",
    visaTypeOther: "",
    interviewDate: state.metadata?.interviewDate || "",
    consularPost: state.metadata?.interviewLocation || "U.S. Embassy",
    ceacStatus: "Administrative Processing",
    caseNumber: state.metadata?.caseNumber || "",
    beneficiaryName: state.metadata?.beneficiaryName || "",
    passportNumber: "",
    dateOfBirth: "",
  };

  const handleSave = () => {
    if (guard && !guard()) return;
    if (!submissionDate) return;
    setIsSaved(true);
    actions.updateMetadata({
      response221gDate: submissionDate,
      response221gMethod: submissionMethod,
    });
  };

  return (
    <div className="flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-300 w-full gap-4">

      {/* ── Submission Log ─────────────────────────────────────────── */}
      <div className="bg-white border-[1.5px] border-[#d0e4f7] rounded-[16px] overflow-hidden shadow-[0_4px_24px_rgba(12,27,51,0.08)]">
        <div className="px-5 py-4 border-b border-[#eef4fb]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#fef8e8] border border-[#f0d98a] flex items-center justify-center shrink-0">
              <Calendar size={14} className="text-[#8a6200]" strokeWidth={2} />
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-[#6b8097]">
                Submission Log
              </div>
              <div className="text-[13px] font-bold text-[#0c1b33]">
                Record when and how you submitted your packet
              </div>
            </div>
          </div>
        </div>

        {!isSaved ? (
          <div className="p-5">
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase tracking-wide text-[#6b8097]">
                  Date Submitted
                </label>
                <input
                  type="date"
                  value={submissionDate}
                  max={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setSubmissionDate(e.target.value)}
                  className="p-2.5 border-[1.5px] border-[#d0e4f7] rounded-lg text-[13px] outline-none focus:border-primary transition-all"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase tracking-wide text-[#6b8097]">
                  Submission Method
                </label>
                <select
                  value={submissionMethod}
                  onChange={(e) => setSubmissionMethod(e.target.value)}
                  className="p-2.5 border-[1.5px] border-[#d0e4f7] rounded-lg text-[13px] outline-none focus:border-primary transition-all"
                >
                  <option value="">Select method…</option>
                  <option value="drop_box">Courier / Drop Box</option>
                  <option value="email">Email</option>
                  <option value="in_person">In Person</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            <button
              onClick={handleSave}
              disabled={!submissionDate}
              className="w-full p-3 bg-primary text-white rounded-xl text-[13px] font-bold transition-all shadow-[0_4px_16px_rgba(47,111,212,0.3)] hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-40 disabled:translate-y-0 disabled:cursor-not-allowed"
            >
              Save Submission Details
            </button>
          </div>
        ) : (
          <div className="px-5 py-4 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-[#15744f] mb-0.5">
                ✓ Submission Logged
              </div>
              <div className="text-[13.5px] font-bold text-[#0c1b33]">
                {new Date(submissionDate + "T00:00:00").toLocaleDateString(
                  "en-US",
                  { year: "numeric", month: "long", day: "numeric" }
                )}
                {submissionMethod && (
                  <span className="text-[#6b8097] font-normal ml-1.5 text-[12.5px]">
                    · via {submissionMethod.replace(/_/g, " ")}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => setIsSaved(false)}
              className="text-[11px] font-bold text-primary hover:underline shrink-0"
            >
              Edit
            </button>
          </div>
        )}
      </div>

      {/* ── Action Plan + Checklist (with vault upload) ────────────── */}
      <ActionPlanResults
        formData={formData}
        selectedItems={selections}
        onBackToForm={() => {}}
        onSaveToProfile={async () => {}}
        guard={guard}
      />
    </div>
  );
};
