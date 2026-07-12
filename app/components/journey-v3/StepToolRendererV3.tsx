"use client";

import React from "react";
import {
  Search,
  // Activity as ActivityIcon,
  CheckCircle2,
  ArrowRight,
  X,
  ExternalLink,
  Upload,
  Clock,
  Scale,
} from "lucide-react";
import { getStepIcon } from "./StepIcon";
import { useToast } from "@/app/components/shared/ToastProvider";
// import Link from "next/link";
import { CustomDropdown } from "@/app/components/shared/CustomDropdown";

const renderPathIcon = (icon: any, pathId?: string, toolType?: string) => {
  if (typeof icon === "string") {
    let colorClass = "text-blue-400";
    if (pathId === "service") {
      if (toolType === "medical_exam") colorClass = "text-teal-400";
      if (toolType === "police_clearance") colorClass = "text-purple-400";
    }
    return getStepIcon(icon, 28, colorClass);
  }
  return icon;
};

interface StepToolRendererProps {
  tool: any;
  state: any;
  actions: any;
  metadata: any;
  dqState?: any;
  interviewState?: any;
  medState?: any;
  polioState?: any;
  pccState?: any;
  gatheringState?: any;
  guard?: () => boolean;
}

export const AwaitingReviewStep: React.FC<{
  data?: any;
}> = ({ data: propData }) => {
  const data = propData || {};
  return (
    <div className="flex flex-col items-center w-full min-h-screen">
      <style jsx global>{`
        @keyframes pulse-custom {
          0%,
          100% {
            opacity: 0.4;
            transform: scale(0.9);
          }
          50% {
            opacity: 1;
            transform: scale(1.15);
          }
        }
        .animate-pulse-custom {
          animation: pulse-custom 2.2s ease-in-out infinite;
        }
        .animate-pulse-delayed {
          animation: pulse-custom 2.2s ease-in-out infinite;
          animation-delay: 0.2s;
        }
      `}</style>

      {/* Page Shell */}
      <div className="w-full max-w-[720px] px-[24px] pt-4 md:pt-8 pb-20 flex flex-col mx-auto">
        <h1 className="text-[clamp(26px,4vw,34px)] font-black text-[#0c1b33] leading-[1.2] mb-[10px] animate-in fade-in slide-in-from-top-2 duration-300 delay-[40ms]">
          {data.title}
        </h1>

        <p className="text-[#3a4f63] text-[15px] leading-[1.7] mb-[22px] max-w-[500px] animate-in fade-in slide-in-from-top-2 duration-300 delay-[80ms]">
          {data.description}
        </p>

        <div className="flex flex-wrap gap-[7px] mb-[32px] animate-in fade-in slide-in-from-top-2 duration-300 delay-120">
          {data.chips?.map((chip: any, i: number) => (
            <span
              key={i}
              className={`text-[11px] font-semibold uppercase tracking-[0.06em] px-[12px] py-[5px] rounded-full border whitespace-nowrap ${
                chip.type === "nvc"
                  ? "bg-[#f3f0fb] text-[#4a2d8a] border-[#c9bef2]"
                  : chip.type === "status"
                    ? "bg-[#e8f1fb] text-[#2d4a6e] border-[#d0e4f7]"
                    : "bg-[#e8f6f6] text-[#0d6b6b] border-[#9fd6d6]"
              }`}
            >
              {chip.label}
            </span>
          ))}
        </div>

        {/* Status Card (Navy) */}
        {data.statusCard && (
          <div className="relative bg-[var(--rv-ch2-module-bg)] rounded-[16px] p-[24px_26px] mb-[16px] overflow-hidden shadow-[0_20px_60px_rgba(12,27,51,0.18),0_4px_16px_rgba(12,27,51,0.12)] animate-in fade-in slide-in-from-top-2 duration-300 delay-[160ms]">
            {/* Top Accent Stripe */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-linear-to-r from-[#2f6fd4] via-[#6aa8f0] to-transparent opacity-80" />

            <div className="text-[10px] font-[700] uppercase tracking-[0.12em] text-white/40 mb-[8px]">
              {data.statusCard.label}
            </div>

            <h2 className="text-[20px] text-white/92 leading-tight mb-[16px] flex items-center gap-[8px]">
              <span className="w-[7px] h-[7px] rounded-full bg-[#c56ca3] animate-pulse-custom shrink-0" />
              {data.statusCard.heading}
            </h2>

            <div className="grid grid-cols-2 min-[480px]:grid-cols-3 gap-[12px]">
              {data.statusCard.grid?.map((item: any, i: number) => (
                <div key={i} className="flex flex-col gap-[3px]">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white/38">
                    {item.label}
                  </div>
                  <div className="text-[13px] font-semibold text-white/88">{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info Card: What NVC is reviewing */}
        {data.reviewItems && (
          <div className="bg-white border-[1.5px] border-[#d0e4f7] rounded-[16px] p-[20px_22px] mb-[14px] shadow-[0_4px_24px_rgba(12,27,51,0.08)] animate-in fade-in slide-in-from-top-2 duration-300 delay-[200ms]">
            <div className="flex items-center gap-[10px] mb-[14px]">
              <div className="w-[36px] h-[36px] rounded-[9px] bg-[#e8f1fb] border border-[#d0e4f7] flex items-center justify-center shrink-0">
                <Search size={17} className="text-[#2f6fd4]" strokeWidth={1.7} />
              </div>
              <h3 className="text-[14px] font-semibold text-[#0c1b33]">{data.reviewItems.title}</h3>
            </div>
            <div className="flex flex-col gap-[7px]">
              {data.reviewItems.items?.map((item: any, i: number) => (
                <div
                  key={i}
                  className="flex items-start gap-[9px] text-[13px] text-[#3a4f63] leading-[1.5]"
                >
                  <div className="w-[4px] h-[4px] rounded-full bg-[#b8d4f0] mt-[5px] shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Two-Column Section */}
        <div className="grid grid-cols-1 min-[520px]:grid-cols-2 gap-[14px] mb-[14px] animate-in fade-in slide-in-from-top-2 duration-300 delay-[240ms]">
          {/* While You Wait */}
          {data.whileYouWait && (
            <div className="bg-white border-[1.5px] border-[#d0e4f7] rounded-[16px] p-[20px_22px] shadow-[0_4px_24px_rgba(12,27,51,0.08)]">
              <div className="flex items-center gap-[10px] mb-[14px]">
                <div className="w-[36px] h-[36px] rounded-[9px] bg-[#e8f5ef] border border-[#a8d9be] flex items-center justify-center shrink-0">
                  <Clock size={17} className="text-[#15744f]" strokeWidth={1.7} />
                </div>
                <h3 className="text-[14px] font-semibold text-[#0c1b33]">
                  {data.whileYouWait.title}
                </h3>
              </div>
              <div className="flex flex-col gap-[7px]">
                {data.whileYouWait.items?.map((item: any, i: number) => (
                  <div
                    key={i}
                    className="flex items-start gap-[9px] text-[13px] text-[#3a4f63] leading-[1.5]"
                  >
                    <div className="w-[4px] h-[4px] rounded-full bg-[#b8d4f0] mt-[5px] shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Timeline */}
          {data.timeline && (
            <div className="bg-white border-[1.5px] border-[#d0e4f7] rounded-[16px] p-[20px_22px] shadow-[0_4px_24px_rgba(12,27,51,0.08)]">
              <div className="flex items-center gap-[10px] mb-[14px]">
                <div className="w-[36px] h-[36px] rounded-[9px] bg-[#e8f1fb] border border-[#d0e4f7] flex items-center justify-center shrink-0">
                  <Scale size={17} className="text-[#2f6fd4]" strokeWidth={1.7} />
                </div>
                <h3 className="text-[14px] font-semibold text-[#0c1b33]">{data.timeline.title}</h3>
              </div>
              <div className="flex flex-col gap-0 relative pl-[18px]">
                {/* Vertical Line */}
                <div className="absolute left-[6px] top-[10px] bottom-[10px] w-[2px] bg-[#d0e4f7] rounded-[2px]" />

                <div className="flex flex-col gap-[10px]">
                  {data.timeline.steps?.map((step: any, i: number) => (
                    <div key={i} className="flex items-center gap-[8px]">
                      {step.status === "completed" ? (
                        <div className="w-[12px] h-[12px] rounded-full bg-[#15744f] shrink-0 z-10 ml-[-6px]" />
                      ) : step.status === "current" ? (
                        <div className="w-[12px] h-[12px] rounded-full border-2 border-[#2f6fd4] bg-white shrink-0 z-10 ml-[-6px] animate-pulse-custom" />
                      ) : (
                        <div className="w-[12px] h-[12px] rounded-full bg-[#d0e4f7] shrink-0 z-10 ml-[-6px]" />
                      )}
                      <span
                        className={`text-[12px] ${
                          step.status === "completed"
                            ? "text-[#0e5c3c] font-semibold"
                            : step.status === "current"
                              ? "text-[#2f6fd4] font-semibold"
                              : "text-[#6b8097]"
                        }`}
                      >
                        {step.label}
                        {step.status === "current" ? " ← you are here" : ""}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Alert Card: Corrections */}
        {data.correctionsAlert && (
          <div className="bg-[#fef8e8] border-[1.5px] border-[#f0d98a] rounded-[16px] p-[18px_20px] mb-[16px] animate-in fade-in slide-in-from-top-2 duration-300 delay-[280ms]">
            <div className="flex items-center gap-[9px] mb-[10px]">
              <span className="text-[18px]">📋</span>
              <h3 className="text-[14px] font-semibold text-[#8a6200]">
                {data.correctionsAlert.title}
              </h3>
            </div>
            <div className="flex flex-col gap-[7px]">
              {data.correctionsAlert.items?.map((item: any, i: number) => (
                <div
                  key={i}
                  className="flex items-start gap-[8px] text-[13px] text-[#8a6200] leading-[1.5]"
                >
                  <div className="w-[4px] h-[4px] rounded-full bg-[#8a6200] mt-[5px] shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Disclaimer */}
        {data.disclaimer && (
          <p className="text-[11.5px] text-[#6b8097] leading-[1.65] text-center pt-[4px] mt-[8px] animate-in fade-in slide-in-from-top-2 duration-300 delay-[320ms]">
            {data.disclaimer}
          </p>
        )}
      </div>
    </div>
  );
};

export const DqRecordingTool: React.FC<StepToolRendererProps> = ({ dqState, actions, guard }) => {
  const {
    dqSaved,
    setDqSaved,
    dqDate,
    setDqDate,
    dqCategory,
    setDqCategory,
    dqPost,
    setDqPost,
    dqCountry,
    setDqCountry,
  } = dqState;

  const [isSaving, setIsSaving] = React.useState(false);
  const [showErrors, setShowErrors] = React.useState(false);

  // -----------------------------
  // OPTIONS
  // -----------------------------
  const categoryOptions = [{ value: "IR-1", label: "IR-1" }];

  const postOptions = [
    { value: "Islamabad", label: "Islamabad" },
    { value: "Karachi", label: "Karachi" },
  ];

  // -----------------------------
  // VALIDATION
  // -----------------------------
  const isValid = dqDate && dqCategory && dqPost;
  const errorBorder = "border-red-500 focus:ring-red-500";
  const normalBorder = "border-slate-300 focus:ring-blue-500";

  return (
    <div className="flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-380">
      {/* HEADER */}
      <div className="flex gap-[7px] flex-wrap mb-[32px]">
        <span className="text-[11px] font-semibold uppercase px-[12px] py-[3px] rounded-full bg-[#fffbec] text-[#b38600] border border-[#e8d47a]">
          Major Milestone
        </span>
        <span className="text-[11px] font-semibold uppercase px-[12px] py-[3px] rounded-full bg-[#e8f1fb] text-[#2d4a6e] border border-[#d0e4f7]">
          Tracking Active
        </span>
        <span className="text-[11px] font-semibold uppercase px-[12px] py-[3px] rounded-full bg-[#f3f0fb] text-[#4a2d8a] border border-[#c9bef2]">
          Dashboard Update
        </span>
      </div>

      {/* INFO CARD */}
      <div className="relative bg-[#1a0a18] rounded-[16px] p-[22px_26px] mb-[18px] overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#b38600] via-[#f0d98a] to-transparent opacity-90" />

        <div className="text-[10px] font-bold tracking-widest uppercase text-white/40 mb-[5px]">
          NVC — Documentary Qualification Received
        </div>

        <div className="text-[22px] text-white/92 mb-[6px]">
          Your documents have been accepted by NVC
        </div>

        <div className="text-[13px] text-white/55">Case is now documentarily complete.</div>
      </div>

      {/* FORM */}
      {!dqSaved ? (
        <div className="bg-white border border-[#d0e4f7] rounded-[16px] p-[22px_24px] mb-[14px]">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-[12px] mb-[12px]">
            {/* DATE */}
            <div>
              <input
                type="date"
                value={dqDate}
                max={new Date().toISOString().split("T")[0]}
                onChange={(e) => setDqDate(e.target.value)}
                className={`w-full p-2.5 border rounded-lg ${
                  showErrors && !dqDate ? errorBorder : normalBorder
                }`}
              />
              {showErrors && !dqDate && (
                <p className="text-xs text-red-500 mt-1">Date is required</p>
              )}
            </div>

            {/* CATEGORY */}
            <div>
              <div className={showErrors && !dqCategory ? "border border-red-500 rounded-lg" : ""}>
                <CustomDropdown
                  value={dqCategory}
                  onChange={(val) => setDqCategory(val)}
                  options={categoryOptions}
                  placeholder="Select Category"
                />
              </div>
              {showErrors && !dqCategory && (
                <p className="text-xs text-red-500 mt-1">Category is required</p>
              )}
            </div>

            {/* POST */}
            <div>
              <div className={showErrors && !dqPost ? "border border-red-500 rounded-lg" : ""}>
                <CustomDropdown
                  value={dqPost}
                  onChange={(val) => setDqPost(val)}
                  options={postOptions}
                  placeholder="Select Post"
                />
              </div>
              {showErrors && !dqPost && (
                <p className="text-xs text-red-500 mt-1">Post is required</p>
              )}
            </div>
          </div>

          {/* SAVE BUTTON */}
          <button
            onClick={async () => {
              setShowErrors(true);

              if (!isValid) return;
              if (guard && !guard()) return;

              setIsSaving(true);

              try {
                setDqSaved(true);

                await actions.updateMetadata({
                  dqSaved: true,
                  dqDate,
                  dqCategory,
                  dqPost,
                  dqCountry,
                  post: dqPost,
                });
              } finally {
                setIsSaving(false);
              }
            }}
            disabled={isSaving || !isValid}
            className="w-full bg-primary text-white py-3 rounded-lg font-bold disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSaving ? "Saving..." : "Save DQ & Activate Tracking"}
          </button>
        </div>
      ) : (
        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl mb-4 flex justify-between items-center">
          <div className="font-bold text-emerald-800 text-xs">✓ DQ Recorded ({dqDate})</div>
          <button
            onClick={() => setDqSaved(false)}
            className="text-primary text-xs font-semibold hover:underline"
          >
            Edit
          </button>
        </div>
      )}
    </div>
  );
};

export const InterviewSchedulingTool: React.FC<{ metadata: any; tool?: any }> = ({
  metadata,
  tool,
}) => {
  const data = tool || {};
  const postKey = ((metadata.post || metadata.dqPost) as string) || "Other";
  const postData = (data.schedulingData || (data as any).scheduling_data)?.[postKey];

  return (
    <div className="flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-380 shadow-xs border p-5 rounded-2xl bg-white">
      <div className="text-[10px] font-bold tracking-widest uppercase text-[#2d4a6e] mb-[6px]">
        Scheduling Status
      </div>
      <div className="text-[20px] font-bold text-[#0c1b33] mb-4 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
        In queue — awaiting interview letter
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-slate-50 border rounded-xl">
          <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">Official Status</div>
          <div className="text-lg font-bold">{postData?.official || "—"}</div>
        </div>
        <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
          <div className="text-[10px] uppercase font-bold text-blue-600 mb-1">Trend</div>
          <div className="text-lg font-bold">{postData?.trend || "—"}</div>
        </div>
      </div>
    </div>
  );
};

export const AppointmentReceivedTool: React.FC<{
  state: any;
  actions: any;
  interviewState: any;
  tool?: any;
  guard?: () => boolean;
}> = ({ actions, interviewState, tool, guard }) => {
  const {
    interviewSaved,
    setInterviewSaved,
    interviewDate,
    setInterviewDate,
    letterDate,
    setLetterDate,
    consulateLocation,
    setConsulateLocation,
  } = interviewState;
  const [isSaving, setIsSaving] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const data = tool || {};

  const { showToast } = useToast();

  const validateAppointmentFields = () => {
    const newErrors: Record<string, string> = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!interviewDate) {
      newErrors.interviewDate = "Interview date is required.";
    } else if (new Date(interviewDate) < today) {
      newErrors.interviewDate = "Interview date cannot be in the past.";
    }

    const loc = consulateLocation.trim();
    if (!loc) {
      newErrors.consulateLocation = "Location is required.";
    } else if (loc.length < 2) {
      newErrors.consulateLocation = "Must be at least 2 characters.";
    } else if (!/^[a-zA-Z\s\-,\.]+$/.test(loc)) {
      newErrors.consulateLocation = "Only letters, spaces, dashes, and commas allowed.";
    }

    return newErrors;
  };

  return (
    <div className="flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-380">
      <div className="relative bg-[#1a0a18] rounded-[16px] p-[26px_28px] mb-[18px] overflow-hidden shadow-xl">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-linear-to-r from-amber-400 to-transparent opacity-80" />
        <div className="text-[10px] font-bold tracking-widest uppercase text-white/40 mb-[7px]">
          {data.heroBanner.eyebrow}
        </div>
        <div className="text-[22px] text-white/95 leading-[1.2] mb-[8px]">
          {data.heroBanner.title}
        </div>
        <div className="text-[13px] text-white/55">{data.heroBanner.sub}</div>
      </div>

      {!interviewSaved ? (
        <div className="bg-white border-[1.5px] border-[#d0e4f7] rounded-[16px] p-[22px_24px] mb-[14px] shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-[12px] mb-[16px]">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase">
                Interview Date
              </label>
              <input
                type="date"
                value={interviewDate}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => {
                  setInterviewDate(e.target.value);
                  setErrors((prev) => ({ ...prev, interviewDate: "" }));
                }}
                className={`p-2.5 border rounded-lg focus:ring-2 focus:ring-primary/20 ${errors.interviewDate ? "border-red-500 bg-red-50/30" : ""}`}
              />
              {errors.interviewDate && (
                <span className="text-[9px] font-bold text-red-500 uppercase px-1">
                  {errors.interviewDate}
                </span>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center">
                <label className="text-[11px] font-bold text-slate-500 uppercase">Location</label>
                <span
                  className={`text-[9px] font-medium ${consulateLocation.length >= 50 ? "text-red-500" : "text-slate-400"}`}
                >
                  {consulateLocation.length}/50
                </span>
              </div>
              <input
                type="text"
                value={consulateLocation}
                maxLength={50}
                placeholder="e.g. Islamabad"
                onChange={(e) => {
                  const val = e.target.value.replace(/[^a-zA-Z\s\-,\.]/g, "").slice(0, 50);
                  setConsulateLocation(val);
                  setErrors((prev) => ({ ...prev, consulateLocation: "" }));
                }}
                className={`p-2.5 border rounded-lg focus:ring-2 focus:ring-primary/20 ${errors.consulateLocation ? "border-red-500 bg-red-50/30" : ""}`}
              />
              {errors.consulateLocation && (
                <span className="text-[9px] font-bold text-red-500 uppercase px-1">
                  {errors.consulateLocation}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={async () => {
              if (guard && !guard()) return;
              const validationErrors = validateAppointmentFields();
              if (Object.keys(validationErrors).length > 0) {
                setErrors(validationErrors);
                showToast("Please fix the errors before saving.", "error");
                return;
              }
              setIsSaving(true);
              try {
                setInterviewSaved(true);
                await actions.updateMetadata({
                  interviewSaved: true,
                  interviewDate,
                  consulateLocation,
                  letterDate,
                });
                showToast("Appointment saved!", "success");
              } finally {
                setIsSaving(false);
              }
            }}
            disabled={isSaving}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 rounded-xl font-bold transition-all shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSaving ? "Saving..." : "Save Appointment & Unlock Chapter 3"}
          </button>
        </div>
      ) : (
        <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-2xl mb-4 flex justify-between items-center shadow-sm">
          <div>
            <div className="text-[10px] uppercase font-black text-emerald-800 mb-1">
              ✓ Interview Scheduled
            </div>
            <div className="text-sm font-bold text-emerald-900">
              {interviewDate} · {consulateLocation}
            </div>
          </div>
          <button
            onClick={() => setInterviewSaved(false)}
            className="text-primary font-bold text-xs hover:underline"
          >
            Edit
          </button>
        </div>
      )}
    </div>
  );
};

export const MedicalExamTool: React.FC<{
  state: any;
  actions: any;
  medState: any;
  tool?: any;
  guard?: () => boolean;
}> = ({ actions, medState, tool, guard }) => {
  const {
    medSaved,
    setMedSaved,
    medDate,
    setMedDate,
    medTime,
    setMedTime,
    medClinic,
    setMedClinic,
    isMedWizardOpen,
    setIsMedWizardOpen,
    medWizardStep,
    setMedWizardStep,
    medWizardMode,
    setMedWizardMode,
  } = medState;
  const [isSaving, setIsSaving] = React.useState(false);
  const [medErrors, setMedErrors] = React.useState<Record<string, string>>({});
  const data = tool || {};

  const { showToast } = useToast();

  const handleMedTimeChange = (input: string) => {
    const upper = input.toUpperCase();
    const digits = upper.replace(/\D/g, "").slice(0, 4);

    // Extract letters specifically after the numbers/colon
    const rawSuffix = upper.slice(digits.length > 2 ? digits.length + 1 : digits.length);
    let suffix = rawSuffix.replace(/[^APM]/g, "");

    // Logic: Suffix must start with A or P
    if (suffix.length > 0 && !["A", "P"].includes(suffix[0])) {
      suffix = "";
    }
    // Cap at 2 chars
    if (suffix.length > 2) suffix = suffix.slice(0, 2);

    let formatted = "";
    if (digits.length > 0) {
      formatted = digits.slice(0, 2);
      if (parseInt(formatted) > 12) formatted = "12";
      if (digits.length >= 3) {
        let mins = digits.slice(2, 4);
        if (parseInt(mins) > 59) mins = "59";
        formatted += ":" + mins;
      }
    }

    if (digits.length === 4) {
      formatted += " " + suffix;
    }

    setMedTime(formatted);
  };

  const currentSteps = medWizardMode === "service" ? data.serviceSteps : data.guideSteps;
  const s = currentSteps[medWizardStep];

  return (
    <div className="flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-380">
      <div className="flex gap-1.5 flex-wrap mb-8">
        {data.chips.map((chip: any, i: number) => (
          <span
            key={i}
            className={`text-[10px] font-bold uppercase tracking-[0.06em] px-3 py-1.5 rounded-full border ${chip.type === "med" ? "bg-teal-50 text-teal-700 border-teal-200" : "bg-blue-50 text-blue-700 border-blue-100"}`}
          >
            {chip.label}
          </span>
        ))}
      </div>

      {!medSaved ? (
        <div className="relative bg-[#0e1e38] rounded-2xl border border-white/5 shadow-2xl overflow-hidden mb-4">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-linear-to-r from-teal-500 to-blue-500 opacity-75" />
          <div className="p-8">
            <div className="text-[10px] font-black tracking-widest uppercase text-white/30 mb-1">
              {data.decisionModule.eyebrow}
            </div>
            <div className="text-xl text-white/95 font-bold mb-6">
              {data.decisionModule.heading}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {data.decisionModule.paths.map((p: any) => (
                <button
                  key={p.id}
                  onClick={() => {
                    if (guard && !guard()) return;
                    setMedWizardMode(p.id);
                    setMedWizardStep(0);
                    setIsMedWizardOpen(true);
                  }}
                  className="bg-white/5 border border-white/10 rounded-xl p-5 text-left transition-all hover:bg-white/10 hover:-translate-y-1 active:translate-y-0 group"
                >
                  <div className="text-2xl mb-3 group-hover:scale-110 transition-transform">
                    {renderPathIcon(p.icon, p.id, "medical_exam")}
                  </div>
                  <div className="text-sm font-bold text-white mb-1">{p.title}</div>
                  <div className="text-[10px] text-white/50 leading-relaxed">{p.sub}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-2xl mb-4 shadow-sm flex justify-between items-center animate-in fade-in">
          <div>
            <div className="text-[10px] font-black uppercase text-emerald-800 mb-1">
              ✓ Medical Appointment Confirmed
            </div>
            <div className="text-sm font-bold text-emerald-900">
              {medDate} at {medTime}
            </div>
            <div className="text-[10px] text-emerald-700 font-medium">{medClinic}</div>
          </div>
          <button
            onClick={() => setMedSaved(false)}
            className="text-primary font-bold text-xs hover:underline"
          >
            Edit
          </button>
        </div>
      )}

      {isMedWizardOpen && (
        <div className="fixed inset-0 z-200 bg-white flex flex-col animate-in slide-in-from-bottom-5 duration-300">
          <div className="p-6 border-b flex items-center gap-4">
            <button
              onClick={() => setIsMedWizardOpen(false)}
              className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
            >
              <X size={20} className="text-slate-600" />
            </button>
            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500"
                style={{
                  width: `${((medWizardStep + 1) / currentSteps.length) * 100}%`,
                }}
              />
            </div>
            <div className="text-xs font-bold text-slate-400">
              {medWizardStep + 1} / {currentSteps.length}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-12 flex flex-col items-center">
            <div className="w-full max-w-lg">
              <div className="text-[10px] font-bold text-primary uppercase mb-2">
                Step {medWizardStep + 1} — {medWizardMode === "service" ? "Service" : "Guide"}
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">{s.heading}</h2>
              <p className="text-sm text-slate-600 leading-relaxed mb-8">{s.sub}</p>

              {(s as any).card && (
                <div className="bg-slate-50 border rounded-2xl p-6 mb-8 shadow-sm">
                  <div className="font-bold text-slate-900 mb-1">{(s as any).card.title}</div>
                  <div className="text-sm text-slate-500 mb-6">{(s as any).card.description}</div>
                  <button className="w-full bg-primary text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 group">
                    {(s as any).card.buttonLabel}{" "}
                    <ExternalLink
                      size={16}
                      className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform"
                    />
                  </button>
                </div>
              )}

              {s.form && (
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Date</label>
                    <input
                      type="date"
                      value={medDate}
                      min={new Date().toISOString().split("T")[0]}
                      onChange={(e) => {
                        setMedDate(e.target.value);
                        setMedErrors((prev) => ({ ...prev, medDate: "" }));
                      }}
                      className={`p-3 border rounded-xl ${medErrors.medDate ? "border-red-500 bg-red-50/30" : ""}`}
                    />
                    {medErrors.medDate && (
                      <span className="text-[9px] font-bold text-red-500 uppercase px-1">
                        {medErrors.medDate}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Time</label>
                    <input
                      type="text"
                      value={medTime}
                      onChange={(e) => {
                        handleMedTimeChange(e.target.value);
                        setMedErrors((prev) => ({ ...prev, medTime: "" }));
                      }}
                      placeholder="hh:mm AM"
                      maxLength={8}
                      className={`p-3 border rounded-xl font-mono ${medErrors.medTime ? "border-red-500 bg-red-50/30" : ""}`}
                    />
                    {medErrors.medTime && (
                      <span className="text-[9px] font-bold text-red-500 uppercase px-1">
                        {medErrors.medTime}
                      </span>
                    )}
                  </div>
                  <div className="col-span-2 flex flex-col gap-1">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">
                        Clinic / Physician Name
                      </label>
                      <span
                        className={`text-[9px] font-medium ${medClinic.length >= 80 ? "text-red-500" : "text-slate-400"}`}
                      >
                        {medClinic.length}/80
                      </span>
                    </div>
                    <input
                      type="text"
                      value={medClinic}
                      maxLength={80}
                      placeholder="e.g. IOM Islamabad"
                      onChange={(e) => {
                        const val = e.target.value
                          .replace(/[^a-zA-Z0-9\s\-\.,\/]/g, "")
                          .slice(0, 80);
                        setMedClinic(val);
                        setMedErrors((prev) => ({ ...prev, medClinic: "" }));
                      }}
                      className={`p-3 border rounded-xl ${medErrors.medClinic ? "border-red-500 bg-red-50/30" : ""}`}
                    />
                    {medErrors.medClinic && (
                      <span className="text-[9px] font-bold text-red-500 uppercase px-1">
                        {medErrors.medClinic}
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                {medWizardStep > 0 && (
                  <button
                    onClick={() => setMedWizardStep((v: number) => v - 1)}
                    className="p-4 border rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    Back
                  </button>
                )}
                <button
                  onClick={async () => {
                    if ((s as any).nav?.save) {
                      const saveErrors: Record<string, string> = {};
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);

                      if (!medDate) {
                        saveErrors.medDate = "Date is required.";
                      } else if (new Date(medDate) < today) {
                        saveErrors.medDate = "Appointment date cannot be in the past.";
                      }

                      const timeRegex = /^(0?[1-9]|1[0-2]):[0-5][0-9] (AM|PM)$/;
                      if (!medTime || !timeRegex.test(medTime)) {
                        saveErrors.medTime = "Enter a valid time (e.g. 09:30 AM).";
                      }

                      const clinic = medClinic.trim();
                      if (!clinic) {
                        saveErrors.medClinic = "Clinic name is required.";
                      } else if (clinic.length < 2) {
                        saveErrors.medClinic = "Must be at least 2 characters.";
                      } else if (!/^[a-zA-Z0-9\s\-\.,\/]+$/.test(clinic)) {
                        saveErrors.medClinic =
                          "Only letters, numbers, spaces, and basic punctuation allowed.";
                      }

                      if (Object.keys(saveErrors).length > 0) {
                        setMedErrors(saveErrors);
                        showToast("Please fix the errors before saving.", "error");
                        return;
                      }
                      setIsSaving(true);
                      try {
                        setMedSaved(true);
                        await actions.updateMetadata({
                          med_appt_saved: "true",
                          med_date: medDate,
                          med_time: medTime,
                          med_clinic: medClinic,
                        });
                        setIsMedWizardOpen(false);
                        showToast("Medical appointment saved!", "success");
                      } finally {
                        setIsSaving(false);
                      }
                    } else if (medWizardStep < currentSteps.length - 1) {
                      setMedWizardStep((v: number) => v + 1);
                    }
                  }}
                  disabled={isSaving}
                  className="flex-1 bg-primary text-white p-4 rounded-xl font-bold hover:bg-primary transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSaving
                    ? "Saving..."
                    : (s as any).nav?.save
                      ? "Save Appointment"
                      : (s as any).nav?.next || "Continue"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const PolioCertificateTool: React.FC<{
  state: any;
  actions: any;
  polioState: any;
  tool?: any;
  guard?: () => boolean;
}> = ({ actions, polioState, tool, guard }) => {
  const {
    polioLaunched,
    setPolioLaunched,
    isPolioGuideOpen,
    setIsPolioGuideOpen,
    polioGuideStep,
    setPolioGuideStep,
    polioChecks,
    setPolioChecks,
  } = polioState;
  const [isSaving, setIsSaving] = React.useState(false);
  const data = tool || {};

  const { showToast } = useToast();

  return (
    <div className="flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-380">
      <div className="flex gap-1.5 flex-wrap mb-8">
        {data.chips.map((chip: any, i: number) => (
          <span
            key={i}
            className={`text-[10px] font-bold uppercase tracking-[0.06em] px-3 py-1.5 rounded-full border ${chip.type === "med" ? "bg-teal-50 text-teal-700 border-teal-200" : "bg-amber-50 text-amber-700 border-amber-100"}`}
          >
            {chip.label}
          </span>
        ))}
      </div>

      <div className="relative bg-[#0e1e38] rounded-2xl border border-white/5 shadow-2xl p-8 mb-4">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-linear-to-r from-teal-500 via-amber-400 to-transparent opacity-75" />
        <div className="text-[10px] font-black tracking-widest uppercase text-white/30 mb-1">
          {data.launchModule.eyebrow}
        </div>
        <div className="text-xl text-white/95 font-bold mb-6">{data.launchModule.heading}</div>
        <button
          onClick={() => {
            if (guard && !guard()) return;
            setPolioGuideStep(0);
            setIsPolioGuideOpen(true);
          }}
          className="w-full bg-[#3b7dd8] hover:bg-[#3b7dd8]  text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg transition-all"
        >
          {polioLaunched
            ? data.launchModule.buttonLabels.completed
            : data.launchModule.buttonLabels.initial}
          {polioLaunched ? <CheckCircle2 size={18} /> : <ArrowRight size={18} />}
        </button>
      </div>

      <div className="bg-white border-[1.5px] border-slate-200 p-6 rounded-2xl shadow-sm">
        <div className="text-sm font-bold mb-4">{data.completionCard.title}</div>
        <div className="flex flex-col gap-3">
          {data.completionCard.items.map((item: string, i: number) => (
            <label
              key={i}
              className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                polioChecks[i]
                  ? "bg-[#0d7377]/10 border-[#0d7377]/30"
                  : "hover:bg-slate-50 border-transparent"
              }`}
            >
              <input
                type="checkbox"
                checked={polioChecks[i]}
                onChange={async () => {
                  if (guard && !guard()) return;
                  const next = [...polioChecks];
                  next[i] = !next[i];
                  setPolioChecks(next);
                  await actions.updateMetadata({ polio_checks: next });
                }}
                className="mt-1 accent-[#0d7377]"
              />

              <span
                className={`text-xs leading-tight ${
                  polioChecks[i] ? "text-[#0d7377] font-bold" : "text-slate-600"
                }`}
              >
                {item}
              </span>
            </label>
          ))}
        </div>
      </div>

      {isPolioGuideOpen && (
        <div className="fixed inset-0 z-200 bg-white flex flex-col animate-in slide-in-from-bottom-5 duration-300 bg-white">
          <div className="p-6 border-b flex items-center gap-4">
            <button
              onClick={() => setIsPolioGuideOpen(false)}
              className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
            >
              <X size={20} className="text-slate-600" />
            </button>
            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500"
                style={{
                  width: `${((polioGuideStep + 1) / data.guideSteps.length) * 100}%`,
                }}
              />
            </div>
            <div className="text-xs font-bold text-slate-400">
              {polioGuideStep + 1} / {data.guideSteps.length}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-12 flex flex-col items-center">
            <div className="w-full max-lg">
              <div className="text-[10px] font-bold text-primary uppercase mb-2">
                Step {polioGuideStep + 1} — {data.guideSteps[polioGuideStep].label}
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                {data.guideSteps[polioGuideStep].heading}
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed mb-8">
                {data.guideSteps[polioGuideStep].instruction}
              </p>

              <div className="flex gap-3">
                {polioGuideStep > 0 && (
                  <button
                    onClick={() => setPolioGuideStep((v: number) => v - 1)}
                    className="p-4 border rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    Back
                  </button>
                )}
                <button
                  onClick={async () => {
                    if (polioGuideStep < data.guideSteps.length - 1) {
                      setPolioGuideStep((v: number) => v + 1);
                    } else {
                      setIsSaving(true);
                      try {
                        setPolioLaunched(true);
                        await actions.updateMetadata({
                          polio_launched: "true",
                        });
                        setIsPolioGuideOpen(false);
                        showToast("Guide completed!", "success");
                      } finally {
                        setIsSaving(false);
                      }
                    }
                  }}
                  disabled={isSaving}
                  className="flex-1 bg-slate-900 text-white p-4 rounded-xl font-bold hover:bg-slate-800 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSaving
                    ? "Saving..."
                    : polioGuideStep === data.guideSteps.length - 1
                      ? "Finish Guide"
                      : "Next →"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const PoliceClearanceTool: React.FC<{
  state: any;
  actions: any;
  pccState: any;
  tool?: any;
  guard?: () => boolean;
  openUploadModal?: (defId: string) => void;
  setActiveUploadId?: (id: string | null) => void;
  setActiveUploadType?: (type: "doc" | "hh" | "financial" | null) => void;
  uploadedDocuments?: any[];
}> = ({
  actions,
  pccState,
  openUploadModal,
  setActiveUploadId,
  setActiveUploadType,
  uploadedDocuments,
  tool,
  guard,
}) => {
  const {
    pccSaved,
    setPccSaved,
    pccReceived,
    setPccReceived,
    pccData,
    setPccData,
    isPccOverlayOpen,
    setIsPccOverlayOpen,
    pccOverlayStep,
    setPccOverlayStep,
    pccOverlayMode,
    setPccOverlayMode,
  } = pccState;
  const [isSaving, setIsSaving] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const { showToast } = useToast();

  const validatePccField = (id: string, value: string) => {
    if (!value) return "";

    // Allow alphanumeric, spaces, dashes, slashes
    const regex = /^[a-zA-Z0-9\s\-\/]+$/;
    if (!regex.test(value)) {
      return "Only letters, numbers, dashes (-), and slashes (/) allowed.";
    }
    if (value.length < 3) {
      return "Too short (minimum 3 characters).";
    }
    return "";
  };

  const data = tool || {};
  const isPccUploaded = uploadedDocuments?.some(
    (doc: any) => doc.documentDefId === "police-certificate-pakistan"
  );

  const currentSteps = pccOverlayMode === "service" ? data.serviceSteps : data.guideSteps;

  return (
    <div className="flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-380 shadow-xs border p-6 rounded-2xl bg-white">
      <div className="flex items-center gap-1.5 flex-wrap mb-8">
        {data.chips.map((chip: any, i: number) => (
          <span
            key={i}
            className={`text-[10px] font-bold uppercase tracking-[0.06em] px-3 py-1.5 rounded-full border ${chip.type === "pcc" ? "bg-blue-50 text-blue-700 border-blue-100" : "bg-purple-50 text-purple-700 border-purple-100"}`}
          >
            {chip.label}
          </span>
        ))}
      </div>

      <div className="relative bg-[#0e1e38] rounded-2xl border border-white/5 shadow-2xl p-8 mb-6 overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-linear-to-r from-blue-500 to-transparent opacity-75" />
        <div className="text-[10px] font-black tracking-widest uppercase text-white/30 mb-1">
          {data.decisionModule.eyebrow}
        </div>
        <div className="text-xl text-white/95 font-bold mb-6">{data.decisionModule.heading}</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {data.decisionModule.paths.map((p: any) => (
            <button
              key={p.id}
              onClick={() => {
                if (guard && !guard()) return;
                setPccOverlayMode(p.id);
                setPccOverlayStep(0);
                setIsPccOverlayOpen(true);
              }}
              className="p-5 bg-white/5 border border-white/10 rounded-xl text-left hover:bg-white/10 transition-all group"
            >
              <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">
                {renderPathIcon(p.icon, p.id, "police_clearance")}
              </div>
              <div className="text-sm font-bold text-white mb-1">{p.title}</div>
              <div className="text-[10px] text-white/50 leading-tight">{p.sub}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-slate-50 border rounded-2xl p-6 mb-6">
        <div className="text-sm font-bold flex items-center gap-2 mb-4">
          <Search size={16} /> {data.trackingCard.title}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          {data.trackingCard.fields.map((f: any) => {
            const isDate = f.id === "date";
            const todayStr = new Date().toISOString().split("T")[0];
            const currentVal = (pccData as any)[f.id] || "";
            const MAX_LEN = 20;
            return (
              <div key={f.id} className="flex flex-col gap-1">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">
                    {f.label}
                  </label>
                  {!isDate && (
                    <span
                      className={`text-[9px] font-medium ${currentVal.length >= MAX_LEN ? "text-red-500" : "text-slate-400"}`}
                    >
                      {currentVal.length}/{MAX_LEN}
                    </span>
                  )}
                </div>
                <input
                  type={isDate ? "date" : "text"}
                  value={currentVal}
                  max={isDate ? todayStr : undefined}
                  maxLength={!isDate ? MAX_LEN : undefined}
                  placeholder={
                    !isDate ? (f.id === "receipt" ? "e.g. PCC-2024-001234" : "Optional") : undefined
                  }
                  onChange={(e) => {
                    let val = e.target.value;
                    if (!isDate) {
                      val = val.replace(/[^a-zA-Z0-9\-\/\s]/g, "").toUpperCase();
                      if (val.length > MAX_LEN) val = val.slice(0, MAX_LEN);
                      const err = validatePccField(f.id, val);
                      setErrors((prev) => ({ ...prev, [f.id]: err }));
                    }
                    setPccData({ ...pccData, [f.id]: val });
                  }}
                  className={`p-3 border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all font-mono text-sm ${
                    errors[f.id] ? "border-red-500 bg-red-50/30" : "border-slate-200"
                  }`}
                />
                {errors[f.id] && (
                  <span className="text-[9px] font-bold text-red-500 uppercase px-1">
                    {errors[f.id]}
                  </span>
                )}
              </div>
            );
          })}
        </div>
        <button
          onClick={async () => {
            if (guard && !guard()) return;
            // Final validation check
            const receiptErr = validatePccField("receipt", pccData.receipt);
            const trackErr = validatePccField("track", pccData.track);

            if (receiptErr || trackErr) {
              setErrors({ receipt: receiptErr, track: trackErr });
              showToast("Please fix format errors before saving.", "error");
              return;
            }

            if (!pccData.date) {
              showToast("Please enter the application date.", "error");
              return;
            }

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (new Date(pccData.date) > today) {
              showToast("Application date cannot be in the future.", "error");
              return;
            }

            setIsSaving(true);
            try {
              setPccSaved(true);
              await actions.updateMetadata({
                pcc_saved: "true",
                pcc_receipt: pccData.receipt,
                pcc_track: pccData.track,
                pcc_date: pccData.date,
              });
              showToast("Tracking saved!", "success");
            } finally {
              setIsSaving(false);
            }
          }}
          disabled={isSaving}
          className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-bold disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isSaving ? "Saving..." : data.trackingCard.buttonLabel}
        </button>
      </div>

      {pccSaved && !pccReceived && (
        <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl flex flex-col gap-4">
          <div>
            <div className="text-sm font-bold text-amber-900 mb-1">📌 {data.pendingCard.title}</div>
            <div className="text-xs text-amber-800 leading-relaxed">{data.pendingCard.body}</div>
          </div>
          <button
            onClick={async () => {
              if (guard && !guard()) return;
              setIsSaving(true);
              try {
                setPccReceived(true);
                await actions.updateMetadata({ pcc_received: "true" });
                showToast("Marked as Received!", "success");
              } finally {
                setIsSaving(false);
              }
            }}
            disabled={isSaving}
            className="w-full bg-amber-600 text-white py-3 rounded-xl font-bold disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSaving ? "Saving..." : data.pendingCard.buttonLabel}
          </button>
        </div>
      )}

      {pccReceived && (
        <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-2xl flex flex-col gap-4">
          <div>
            <div className="text-sm font-bold text-emerald-900 mb-1 flex items-center gap-2">
              <CheckCircle2 size={18} className="text-emerald-600" /> {data.receivedCard.title}
            </div>
            <div className="text-xs text-emerald-800 leading-relaxed">{data.receivedCard.body}</div>
          </div>
          {isPccUploaded ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-emerald-700 font-semibold text-[13px] bg-emerald-100/50 py-3 px-4 rounded-xl border border-emerald-200">
                <CheckCircle2 size={16} strokeWidth={2.5} />
                Saved successfully to Vault
              </div>
              <button
                onClick={() => {
                  if (guard && !guard()) return;
                  if (openUploadModal && setActiveUploadId && setActiveUploadType) {
                    setActiveUploadId("pcc_upload");
                    setActiveUploadType("doc");
                    openUploadModal("police-certificate-pakistan");
                  } else {
                    showToast("Document vault is not available", "error");
                  }
                }}
                className="w-full bg-emerald-600/10 text-emerald-700 py-3 rounded-xl font-bold flex items-center justify-center gap-2 border border-emerald-200 transition-all hover:bg-emerald-600/20 active:scale-[0.98]"
              >
                <Upload size={16} /> Replace Document
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                if (guard && !guard()) return;
                if (openUploadModal && setActiveUploadId && setActiveUploadType) {
                  setActiveUploadId("pcc_upload");
                  setActiveUploadType("doc");
                  openUploadModal("police-certificate-pakistan");
                } else {
                  showToast("Document vault is not available", "error");
                }
              }}
              className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all hover:bg-emerald-700 active:scale-[0.98]"
            >
              <Upload size={16} /> {data.receivedCard.buttonLabel}
            </button>
          )}
        </div>
      )}

      {isPccOverlayOpen && (
        <div className="fixed inset-0 z-200 bg-white flex flex-col animate-in slide-in-from-bottom-5 duration-300">
          <div className="p-6 border-b flex items-center gap-4">
            <button
              onClick={() => setIsPccOverlayOpen(false)}
              className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
            >
              <X size={20} className="text-slate-600" />
            </button>
            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500"
                style={{
                  width: `${((pccOverlayStep + 1) / currentSteps.length) * 100}%`,
                }}
              />
            </div>
            <div className="text-xs font-bold text-slate-400">
              {pccOverlayStep + 1} / {currentSteps.length}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-12 flex flex-col items-center">
            <div className="w-full max-w-lg">
              <div className="text-[10px] font-bold text-primary uppercase mb-2">
                Step {pccOverlayStep + 1} — {currentSteps[pccOverlayStep].label}
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                {currentSteps[pccOverlayStep].heading}
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed mb-8">
                {currentSteps[pccOverlayStep].instruction}
              </p>

              <div className="flex gap-3">
                {pccOverlayStep > 0 && (
                  <button
                    onClick={() => setPccOverlayStep((v: number) => v - 1)}
                    className="p-4 border rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    Back
                  </button>
                )}
                <button
                  onClick={() => {
                    if (pccOverlayStep < currentSteps.length - 1) {
                      setPccOverlayStep((v: number) => v + 1);
                    } else {
                      setIsPccOverlayOpen(false);
                    }
                  }}
                  className="flex-1 bg-slate-900 text-white p-4 rounded-xl font-bold hover:bg-slate-800 transition-colors"
                >
                  {pccOverlayStep === currentSteps.length - 1 ? "Finish Guide" : "Next →"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const GatheringChecklistTool: React.FC<{
  tool: any;
  state: any;
  actions: any;
  gatheringState: any;
  guard?: () => boolean;
}> = ({ tool, state, actions, gatheringState, guard }) => {
  const {
    gatheringStatus,
    setGatheringStatus,
    selectedGatheringItem,
    setSelectedGatheringItem,
    isGatheringGuideOpen,
    setIsGatheringGuideOpen,
    gatheringGuideStep,
    setGatheringGuideStep,
  } = gatheringState;

  const groups = tool.doc_gathering?.groups || [];
  const allItems = groups.flatMap((g: any) => g.items);
  const total = allItems.length;
  const rev = allItems.filter((it: any) => gatheringStatus[it.id] === "reviewed").length;
  const pct = total > 0 ? (rev / total) * 100 : 0;

  return (
    <div className="flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-380 font-sans">
      <div className="flex items-center gap-[12px] mb-[36px]">
        <div className="flex-1 h-[5px] bg-[#d0e4f7] rounded-[10px] overflow-hidden">
          <div
            className="h-full bg-linear-to-r from-primary to-primary/70 rounded-[10px] transition-all duration-500 ease-in-out"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="text-[12px] font-[500] text-[#6b8097] whitespace-nowrap shrink-0">
          {rev} of {total} packed
        </div>
      </div>

      <div id="doc-groups">
        {groups.map((group: any) => (
          <div key={group.id} className="mb-[28px] last:mb-0">
            <div className="flex items-center gap-[10px] mb-[12px]">
              <span className="text-[11px] font-semibold tracking-[0.09em] uppercase text-[#6b8097]">
                {group.label}
              </span>
              <span
                className={`text-[9px] font-semibold px-[9px] py-[2px] rounded-full border tracking-[0.06em] whitespace-nowrap ${
                  group.badge === "Required"
                    ? "bg-[#ffeaea] text-[#a01c1c] border-[#f5bebe]"
                    : group.badge === "Recommended"
                      ? "bg-[#e8f1fb] text-[#2d4a6e] border-[#d0e4f7]"
                      : "bg-[#fef8e8] text-[#8a6200] border-[#f0d98a]"
                }`}
              >
                {group.badge === "Required"
                  ? "Required"
                  : group.badge === "Recommended"
                    ? "Recommended"
                    : "Required if applicable"}
              </span>
              <div className="flex-1 h-px bg-[#d0e4f7]" />
            </div>

            <div className="flex flex-col gap-[9px]">
              {group.items.map((item: any) => {
                const status = gatheringStatus[item.id] || "not-started";
                const isRev = status === "reviewed";
                const isIP = status === "in-progress";

                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (guard && !guard()) return;
                      setSelectedGatheringItem(item);
                      setIsGatheringGuideOpen(true);
                      if (status === "not-started") {
                        setGatheringStatus((prev: any) => ({
                          ...prev,
                          [item.id]: "in-progress",
                        }));
                      }
                    }}
                    className={`group border-[1.5px] rounded-[16px] px-[20px] py-[16px] flex items-center gap-[14px] cursor-pointer transition-all hover:-translate-y-[1px] ${
                      isRev
                        ? "bg-[#e8f5ef] border-[#a8d9be]"
                        : isIP
                          ? "bg-[#fef8e8] border-[#f0d98a]"
                          : "bg-white border-[#d0e4f7] hover:border-[#2f6fd4] hover:shadow-[0_4px_20px_rgba(47,111,212,0.1)]"
                    }`}
                  >
                    <div
                      className={`w-[38px] h-[38px] rounded-[9px] border flex items-center justify-center shrink-0 transition-all ${
                        isRev
                          ? "bg-[#e8f5ef] border-[#a8d9be] text-[#15744f]"
                          : "bg-white border-[#d0e4f7] text-[#6b8097]"
                      }`}
                    >
                      {status === "reviewed" ? (
                        <CheckCircle2 size={18} />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-slate-300" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div
                        className={`text-[14px] font-semibold leading-tight ${isRev ? "text-[#0e5c3c]" : "text-[#0c1b33]"}`}
                      >
                        {item.title}
                      </div>
                      <div className="text-[11px] text-[#6b8097] mt-0.5">{item.sub}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
