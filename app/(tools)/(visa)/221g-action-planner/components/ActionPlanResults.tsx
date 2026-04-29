"use client";

import { useState, useMemo } from "react";
import {
  CopyIcon,
  PrinterIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  SaveIcon,
  CheckCircle2,
  FileText,
  ClipboardList,
  Mail,
  Clock,
  Check,
  AlertCircle,
  Lightbulb,
  FileDigit,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { FormData, FormSelections } from "../types/221g";
import { classifySituation } from "../utils/classifier";
import {
  generateActionPlan as generateDynamicActionPlan,
  ActionPlan,
  ActionStage,
} from "../utils/actionPlanGenerator";

interface ActionPlanResultsProps {
  formData: FormData | null;
  selectedItems: FormSelections | null;
  onBackToForm: () => void;
  onSaveToProfile: () => Promise<void>;
  planGeneratedAt?: number;
}

export default function ActionPlanResults({
  formData,
  selectedItems,
  onBackToForm,
  onSaveToProfile,
}: ActionPlanResultsProps) {
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [activeTab, setActiveTab] = useState<"plan" | "checklist" | "letter">("plan");
  const [currentStageIdx, setCurrentStageIdx] = useState(0);

  const data = useMemo(() => {
    if (!formData || !selectedItems) return null;
    const cb = formData;
    const cl = selectedItems;
    const today = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const parsedItems = Object.keys(cl).filter(
      (key) => cl[key as keyof FormSelections] === true
    );
    const classifications = classifySituation(cb, parsedItems);
    const plans = classifications.map((c) =>
      generateDynamicActionPlan(c, parsedItems)
    );
    // Flatten all stages across all plans for the wizard
    const allStages: { plan: ActionPlan; stage: ActionStage; globalIdx: number }[] = [];
    plans.forEach((plan) => {
      plan.stages.forEach((stage) => {
        allStages.push({ plan, stage, globalIdx: allStages.length });
      });
    });
    return { cb, cl, today, plans, allStages };
  }, [formData, selectedItems]);

  if (!data) {
    return (
      <div className="w-full py-12 text-center">
        <p className="text-[#6b8097]">Generating results...</p>
      </div>
    );
  }

  const { cb, cl, today, plans, allStages } = data;
  const totalStages = allStages.length;
  const current = allStages[currentStageIdx];

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setSaveMessage("Copied!");
    setTimeout(() => setSaveMessage(""), 2000);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSaveToProfile();
      setSaveMessage("Saved!");
      setTimeout(() => setSaveMessage(""), 3000);
    } catch {
      /* noop */
    } finally {
      setSaving(false);
    }
  };

  const goNext = () => setCurrentStageIdx((p) => Math.min(p + 1, totalStages - 1));
  const goPrev = () => setCurrentStageIdx((p) => Math.max(p - 1, 0));

  // ── Tab Buttons ──
  const tabs = [
    { key: "plan" as const, label: "Action Plan", icon: FileText },
    { key: "checklist" as const, label: "Checklist", icon: ClipboardList },
    { key: "letter" as const, label: "Cover Letter", icon: Mail },
  ];

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* ── Tab Bar ── */}
      <div className="flex bg-[#f1f5f9] rounded-xl p-1 mb-5 gap-1">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => { setActiveTab(t.key); setCurrentStageIdx(0); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-[12px] font-bold transition-all ${
                isActive
                  ? "bg-white text-primary shadow-sm"
                  : "text-[#6b8097] hover:text-[#3a4f63]"
              }`}
            >
              <Icon size={14} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ══════════════ TAB: ACTION PLAN ══════════════ */}
      {activeTab === "plan" && current && (
        <div className="animate-in fade-in duration-200">
          {/* Stage Progress Bar */}
          <div className="flex items-center gap-2 mb-4">
            {allStages.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentStageIdx(idx)}
                className={`h-1.5 rounded-full transition-all flex-1 ${
                  idx === currentStageIdx
                    ? "bg-primary"
                    : idx < currentStageIdx
                      ? "bg-primary/30"
                      : "bg-[#d0e4f7]"
                }`}
              />
            ))}
          </div>

          {/* Stage Counter */}
          <div className="flex items-center justify-between mb-3">
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#6b8097]">
              Stage {currentStageIdx + 1} of {totalStages}
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/8 text-primary text-[10px] font-bold uppercase tracking-wider">
              <Clock size={10} />
              {current.stage.timeframe}
            </div>
          </div>

          {/* Stage Card */}
          <div className="bg-white border border-[#d0e4f7] rounded-2xl overflow-hidden shadow-sm mb-4">
            {/* Stage Header */}
            <div className="bg-[#f8fafc] border-b border-[#e8f1fb] px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center text-[13px] font-black shrink-0">
                  {currentStageIdx + 1}
                </div>
                <div>
                  <div className="text-[16px] font-bold text-[#0c1b33] leading-tight">
                    {current.stage.title}
                  </div>
                  <div className="text-[11px] text-[#6b8097] mt-0.5">
                    {current.plan.title.replace(" - Action Plan", "")}
                  </div>
                </div>
              </div>
            </div>

            {/* Stage Body */}
            <div className="p-5 space-y-5">
              {/* Actions */}
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-[#6b8097] mb-3 flex items-center gap-1.5">
                  <Check size={12} className="text-primary" strokeWidth={3} />
                  Steps to take
                </div>
                <div className="space-y-2.5">
                  {current.stage.actions.map((action, i) => (
                    <div key={i} className="flex gap-3 group">
                      <div className="w-5 h-5 rounded-md bg-[#e8f1fb] text-primary flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 group-hover:bg-primary group-hover:text-white transition-colors">
                        {i + 1}
                      </div>
                      <div className="text-[13px] text-[#3a4f63] leading-relaxed">
                        {action}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Documents */}
              {current.stage.documents && current.stage.documents.length > 0 && (
                <div className="bg-[#f8fafc] rounded-xl p-4 border border-[#e8f1fb]">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-[#6b8097] mb-2.5 flex items-center gap-1.5">
                    <FileDigit size={12} className="text-primary" />
                    Documents needed
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {current.stage.documents.map((doc, i) => (
                      <span
                        key={i}
                        className="bg-white px-2.5 py-1 rounded-md border border-[#d0e4f7] text-[11px] font-medium text-[#3a4f63]"
                      >
                        {doc}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Tips */}
              {current.stage.tips.length > 0 && (
                <div className="bg-[#eff6ff] rounded-xl p-4 border border-[#dbeafe]">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-[#4f46e5] mb-2 flex items-center gap-1.5">
                    <Lightbulb size={12} />
                    Pro Tips
                  </div>
                  <div className="space-y-1.5">
                    {current.stage.tips.map((tip, i) => (
                      <div key={i} className="text-[12px] text-[#4338ca]/80 leading-relaxed flex gap-2">
                        <span className="shrink-0">•</span>
                        <span>{tip}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={goPrev}
              disabled={currentStageIdx === 0}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[12px] font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed bg-[#f1f5f9] text-[#3a4f63] hover:bg-[#e2e8f0]"
            >
              <ChevronLeft size={14} /> Previous
            </button>
            {currentStageIdx < totalStages - 1 ? (
              <button
                onClick={goNext}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-[12px] font-bold bg-primary text-white shadow-md shadow-primary/20 hover:-translate-y-0.5 active:translate-y-0 transition-all"
              >
                Next Stage <ChevronRight size={14} />
              </button>
            ) : (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#e8f5ef] text-[#15744f] text-[12px] font-bold">
                <CheckCircle2 size={14} /> All stages reviewed
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════ TAB: CHECKLIST ══════════════ */}
      {activeTab === "checklist" && (
        <div className="animate-in fade-in duration-200 space-y-4">
          <div className="flex items-center justify-between mb-1">
            <div className="text-[15px] font-bold text-[#0c1b33]">Packet Assembly</div>
            <button
              onClick={() => handleCopyText(buildChecklistText(cl))}
              className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1"
            >
              <CopyIcon size={12} /> Copy
            </button>
          </div>

          {/* Base Documents */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#6b8097] mb-2">
              Required Base Documents
            </div>
            <div className="space-y-1.5">
              {[
                "221(g) Refusal Letter / Slip",
                "Response Cover Letter (Signed)",
                cl.passport && "Passport (Original)",
                cl.medical_examination && "Sealed Medical Results",
              ]
                .filter(Boolean)
                .map((item, i) => (
                  <ChecklistRow key={i} num={i + 1} text={item as string} />
                ))}
            </div>
          </div>

          {/* Financial */}
          {cl.i864_affidavit && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-[#6b8097] mb-2">
                Financial / Sponsor
              </div>
              <div className="space-y-1.5">
                {[
                  "I-864 Affidavit of Support (Signed)",
                  "IRS Tax Transcripts (3 years)",
                  "Pay Stubs (6 months)",
                  "Employment Verification Letter",
                ].map((item, i) => (
                  <ChecklistRow key={i} num={i + 1} text={item} />
                ))}
              </div>
            </div>
          )}

          {/* Civil & Legal */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#6b8097] mb-2">
              Civil & Legal Records
            </div>
            <div className="space-y-1.5">
              {[
                cl.nadra_birth_cert && "NADRA Birth Certificate",
                cl.nadra_marriage_cert && "NADRA Marriage Certificate",
                cl.nikah_nama && "Original Nikah Nama",
                cl.nikah_nama && "Computerized Marriage Certificate",
                cl.nadra_divorce_cert && "NADRA Divorce Certificate",
                cl.police_certificate && "Police Clearance Certificate",
                cl.english_translation && "Certified English Translations",
              ]
                .filter(Boolean)
                .map((item, i) => (
                  <ChecklistRow key={i} num={i + 1} text={item as string} />
                ))}
            </div>
          </div>

          {/* Final Checks */}
          <div className="bg-[#0e1e38] rounded-xl p-4 text-white mt-2">
            <div className="text-[11px] font-bold uppercase tracking-widest text-white/40 mb-2">
              Final Checks
            </div>
            <div className="space-y-2">
              {[
                "Cover letter is signed and dated",
                "Documents in correct order",
                "Kept copies of everything",
              ].map((t, i) => (
                <div key={i} className="flex items-center gap-2.5 text-[12px] text-white/80">
                  <div className="w-4 h-4 rounded border border-white/20 shrink-0" />
                  {t}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════ TAB: COVER LETTER ══════════════ */}
      {activeTab === "letter" && (
        <div className="animate-in fade-in duration-200">
          <div className="flex justify-end gap-2 mb-3">
            <button
              onClick={() => handleCopyText(buildLetterText(cb, cl, today))}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#f1f5f9] text-[11px] font-bold text-[#3a4f63] hover:bg-[#e2e8f0] transition-all"
            >
              <CopyIcon size={12} /> Copy
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white text-[11px] font-bold shadow-sm hover:opacity-90 transition-all"
            >
              <PrinterIcon size={12} /> Print
            </button>
          </div>

          <div className="bg-white border border-[#d0e4f7] rounded-2xl overflow-hidden shadow-sm">
            <div className="p-8 md:p-10 font-serif text-[#1c2b3a] leading-relaxed space-y-8">
              {/* Header */}
              <div className="not-italic font-sans space-y-0.5">
                <div className="text-[14px] font-bold text-[#0c1b33]">{today}</div>
                <div className="text-[13px] text-[#6b8097]">{cb.consularPost}</div>
                <div className="text-[12px] text-[#6b8097]">Immigrant Visa Unit</div>
              </div>

              {/* Subject */}
              <div className="font-sans not-italic border-b border-[#e8f1fb] pb-4">
                <div className="text-[15px] font-bold text-[#0c1b33]">
                  Subject: Response to INA 221(g) Refusal
                </div>
                {cb.caseNumber && (
                  <div className="text-[12px] text-primary font-medium mt-0.5">
                    Case Number: {cb.caseNumber}
                  </div>
                )}
              </div>

              {/* Body */}
              <div className="space-y-5 text-[14px] italic">
                <p>Dear Consular Officer,</p>
                <p>
                  I am writing in response to the Section 221(g) refusal issued
                  following my interview on{" "}
                  {cb.interviewDate
                    ? new Date(cb.interviewDate).toLocaleDateString()
                    : "[Date]"}
                  . I am submitting the requested documents as instructed.
                </p>
              </div>

              {/* Applicant Info Card */}
              <div className="bg-[#f8fafc] rounded-xl border border-[#e8f1fb] p-5 font-sans not-italic">
                <div className="text-[9px] font-bold uppercase tracking-widest text-[#6b8097] mb-3">
                  Applicant Information
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    ["Name", cb.beneficiaryName || "[Your Name]"],
                    ["Case #", cb.caseNumber || "[Case Number]"],
                    ["Category", cb.visaCategory || "IR-1"],
                    [
                      "Interview",
                      cb.interviewDate
                        ? new Date(cb.interviewDate).toLocaleDateString()
                        : "—",
                    ],
                  ].map(([label, val], i) => (
                    <div key={i}>
                      <div className="text-[10px] text-[#6b8097]">{label}</div>
                      <div className="text-[13px] font-bold text-[#0c1b33]">{val}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Enclosed Docs */}
              <div className="font-sans not-italic space-y-3">
                <div className="text-[13px] font-bold text-[#0c1b33]">
                  Enclosed Documents:
                </div>
                <div className="space-y-1.5 ml-1">
                  {[
                    "221(g) Refusal Notice",
                    cl.passport && "Passport (Original)",
                    cl.medical_examination && "Medical Examination Results",
                    cl.i864_affidavit && "I-864 Affidavit of Support",
                    cl.nadra_birth_cert && "NADRA Birth Certificate",
                    cl.nadra_marriage_cert && "NADRA Marriage Certificate",
                    cl.nikah_nama && "Original Nikah Nama",
                    cl.nadra_divorce_cert && "NADRA Divorce Certificate",
                    cl.police_certificate && "Police Clearance Certificate",
                    cl.english_translation && "Certified English Translations",
                  ]
                    .filter(Boolean)
                    .map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-[13px] text-[#3a4f63]">
                        <div className="w-1 h-1 rounded-full bg-[#b8cedf]" />
                        {item}
                      </div>
                    ))}
                </div>
              </div>

              {/* Closing */}
              <div className="space-y-8 not-italic font-sans pt-4">
                <p className="text-[13px] text-[#3a4f63] italic font-serif">
                  All documents are submitted in accordance with the instructions
                  provided in the 221(g) letter.
                </p>
                <div>
                  <div className="text-[13px] text-[#3a4f63] mb-8">Sincerely,</div>
                  <div className="border-t border-[#3a4f63] w-48 pt-1.5">
                    <div className="text-[14px] font-bold text-[#0c1b33]">
                      {cb.beneficiaryName || "[Signature]"}
                    </div>
                    <div className="text-[9px] font-bold uppercase tracking-widest text-[#6b8097]">
                      Applicant
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Disclaimer ── */}
      <div className="flex items-start gap-2.5 mt-5 p-3.5 rounded-xl bg-amber-50/60 border border-amber-100">
        <AlertCircle size={14} className="text-amber-500 shrink-0 mt-0.5" />
        <p className="text-[11px] text-amber-700/80 leading-relaxed">
          Based on your inputs. Always follow your embassy&apos;s 221(g) letter.
          This is not legal advice.
        </p>
      </div>
    </div>
  );
}

/* ── Checklist Row Component ── */
function ChecklistRow({ num, text }: { num: number; text: string }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-[#e8f1fb] bg-white hover:border-primary/20 transition-colors">
      <div className="w-5 h-5 rounded-md bg-[#f1f5f9] border border-[#d0e4f7] flex items-center justify-center text-[9px] font-bold text-primary shrink-0">
        {num}
      </div>
      <span className="text-[13px] font-medium text-[#3a4f63]">{text}</span>
    </div>
  );
}

/* ── Plain Text Helpers ── */
function buildChecklistText(cl: FormSelections) {
  const items = [
    "1. 221(g) Refusal Letter",
    "2. Cover Letter",
    cl.passport && "3. Passport",
    cl.medical_examination && "4. Medical Results",
  ].filter(Boolean);
  return items.join("\n");
}

function buildLetterText(cb: FormData, cl: FormSelections, today: string) {
  return `${today}\n${cb.consularPost}\nImmigrant Visa Unit\n\nSubject: Response to 221(g) – Case ${cb.caseNumber || ""}\n\nDear Consular Officer,\n\nI am submitting the requested documents in response to the Section 221(g) refusal.\n\nSincerely,\n${cb.beneficiaryName || "[Your Name]"}`;
}
