"use client";

import React, { useState } from "react";
import { Calendar, AlertTriangle } from "lucide-react";
import ActionPlanResults from "@/app/(tools)/(visa)/221g-action-planner/components/ActionPlanResults";
import { FormData, FormSelections } from "@/app/(tools)/(visa)/221g-action-planner/types/221g";

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

  const handleSave = () => {
    if (guard && !guard()) return;
    if (!submissionDate) return;
    setIsSaved(true);
    actions.updateMetadata({
      response221gDate: submissionDate,
      response221gMethod: submissionMethod,
    });
  };

  const selectedItems: FormSelections =
    state.metadata?.twentyTwoOneGSelections || {};
  const formData: FormData = {
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

  const hasSelections = Object.keys(selectedItems).filter(
    (k) => selectedItems[k as keyof FormSelections] === true
  ).length > 0;

  return (
    <div className="flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-300 w-full">
      {/* Submission Recorder — compact card */}
      {!isSaved ? (
        <div className="bg-white border-[1.5px] border-[#d0e4f7] rounded-[16px] p-5 mb-5 shadow-[0_4px_24px_rgba(12,27,51,0.08)]">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-9 h-9 rounded-lg bg-[#fef8e8] border border-[#f0d98a] flex items-center justify-center shrink-0">
              <Calendar size={16} className="text-[#8a6200]" strokeWidth={1.8} />
            </div>
            <div>
              <div className="text-[13px] font-bold text-[#0c1b33]">
                Log your document submission
              </div>
              <div className="text-[11px] text-[#6b8097]">
                Record when and how you submitted the requested documents
              </div>
            </div>
          </div>
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
                className="p-2 border-[1.5px] border-[#d0e4f7] rounded-lg text-[13px] outline-none focus:border-primary transition-all"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase tracking-wide text-[#6b8097]">
                Submission Method
              </label>
              <select
                value={submissionMethod}
                onChange={(e) => setSubmissionMethod(e.target.value)}
                className="p-2 border-[1.5px] border-[#d0e4f7] rounded-lg text-[13px] outline-none focus:border-primary transition-all"
              >
                <option value="">Select method...</option>
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
            className="w-full p-3 bg-primary text-white rounded-xl text-[13px] font-bold transition-all shadow-[0_4px_16px_rgba(47,111,212,0.3)] hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:translate-y-0"
          >
            Save Submission Details
          </button>
        </div>
      ) : (
        <div className="bg-white border-[1.5px] border-[#f0d98a] rounded-[14px] p-4 mb-5 shadow-sm animate-in fade-in duration-300">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#8a6200]">
              Submission Recorded
            </div>
            <button
              onClick={() => setIsSaved(false)}
              className="text-[11px] font-bold text-primary hover:underline"
            >
              Edit
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-[10px] text-[#6b8097] font-medium">Date</div>
              <div className="text-[13px] font-bold text-[#0c1b33]">
                {submissionDate
                  ? new Date(submissionDate + "T00:00:00").toLocaleDateString(
                      "en-US",
                      { year: "numeric", month: "long", day: "numeric" }
                    )
                  : "—"}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-[#6b8097] font-medium">Method</div>
              <div className="text-[13px] font-bold text-[#0c1b33] capitalize">
                {submissionMethod.replace("_", " ") || "—"}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Action Plan from 221g-action-planner */}
      {hasSelections ? (
        <ActionPlanResults
          formData={formData}
          selectedItems={selectedItems}
          onBackToForm={() => {}}
          onSaveToProfile={async () => {}}
        />
      ) : (
        <div className="bg-amber-50/80 border border-amber-200 rounded-[14px] p-5 flex items-start gap-3">
          <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
          <div className="text-[13px] text-amber-800 leading-relaxed">
            <span className="font-bold">No checklist data found.</span> Go back
            to the &quot;Input 221(g) Checklist&quot; step and select the items
            from your 221(g) letter to generate your personalized action plan.
          </div>
        </div>
      )}
    </div>
  );
};
