"use client";

import React from "react";
import { Search, Clock, Scale, Calendar, Info, Activity, Monitor, Activity as ActivityIcon, Plus, CheckCircle2, ArrowRight, X, ExternalLink, Check, Upload } from "lucide-react";
import { AWAITING_REVIEW_DATA } from "./AwaitingReviewData";
import { DQ_RECORDING_DATA } from "./DqRecordingData";
import { INTERVIEW_SCHEDULING_DATA } from "./InterviewSchedulingData";
import { APPOINTMENT_RECEIVED_DATA } from "./AppointmentReceivedData";
import { MEDICAL_EXAM_DATA } from "./MedicalExamData";
import { POLIO_CERTIFICATE_DATA } from "./PolioCertificateData";
import { POLICE_CLEARANCE_DATA } from "./PoliceClearanceData";
import { toast } from "sonner";
import Link from "next/link";

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
}

export const AwaitingReviewStep: React.FC<{ data: typeof AWAITING_REVIEW_DATA }> = ({ data }) => {
  return (
    <div className="w-full max-w-[720px] px-[24px] pt-[52px] pb-[96px] flex flex-col mx-auto">
      <div className="flex items-center gap-[8px] mb-[6px] animate-in fade-in slide-in-from-top-2 duration-300">
        <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6b8097]">{data.eyebrow.chapter}</span>
        <span className="text-[11px] text-[#b8d4f0]">›</span>
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#2f6fd4]">{data.eyebrow.step}</span>
      </div>
      <h1 className="text-[clamp(26px,4vw,34px)] font-black text-[#0c1b33] mb-[10px]">{data.title}</h1>
      <p className="text-[#3a4f63] text-[15px] leading-[1.7] mb-[22px] max-w-[500px]">{data.description}</p>
      <div className="flex flex-wrap gap-[7px] mb-[32px]">
        {data.chips.map((chip, i) => (
          <span key={i} className={`text-[11px] font-semibold uppercase tracking-[0.06em] px-[12px] py-[5px] rounded-full border ${chip.type === "nvc" ? "bg-[#f3f0fb] text-[#4a2d8a] border-[#c9bef2]" : "bg-[#e8f1fb] text-[#2d4a6e] border-[#d0e4f7]"}`}>{chip.label}</span>
        ))}
      </div>
      <div className="relative bg-[#0c1b33] border border-white/5 rounded-[16px] p-[24px_26px] mb-[16px] overflow-hidden shadow-xl">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-linear-to-r from-[#2f6fd4] via-[#6aa8f0] to-transparent opacity-80" />
        <div className="text-[10px] font-bold tracking-widest uppercase text-white/40 mb-[8px]">{data.statusCard.label}</div>
        <h2 className="text-[20px] text-white/92 leading-tight mb-[16px] flex items-center gap-[8px]">
          <span className="w-[7px] h-[7px] rounded-full bg-[#6aa8f0] animate-pulse shrink-0" />{data.statusCard.heading}
        </h2>
        <div className="grid grid-cols-2 min-[480px]:grid-cols-3 gap-[12px]">
          {data.statusCard.grid.map((item, i) => (
            <div key={i} className="flex flex-col gap-[3px]">
              <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white/38">{item.label}</div>
              <div className="text-[13px] font-semibold text-white/88">{item.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const DqRecordingTool: React.FC<StepToolRendererProps> = ({ dqState, actions }) => {
  const { dqSaved, setDqSaved, dqDate, setDqDate, dqCategory, setDqCategory, dqPost, setDqPost, dqCountry, setDqCountry } = dqState;
  
  return (
    <div className="flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-380">
      <div className="flex gap-[7px] flex-wrap mb-[32px]">
        <span className="text-[11px] font-semibold tracking-wider uppercase px-[12px] py-[3px] rounded-full bg-[#fffbec] text-[#b38600] border border-[#e8d47a]">Major Milestone</span>
        <span className="text-[11px] font-semibold tracking-wider uppercase px-[12px] py-[3px] rounded-full bg-[#e8f1fb] text-[#2d4a6e] border border-[#d0e4f7]">Tracking Active</span>
        <span className="text-[11px] font-semibold tracking-wider uppercase px-[12px] py-[3px] rounded-full bg-[#f3f0fb] text-[#4a2d8a] border border-[#c9bef2]">Dashboard Update</span>
      </div>

      <div className="relative bg-gradient-to-br from-[#0c1b33] to-[#1a3054] rounded-[16px] p-[22px_26px] mb-[18px] overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#b38600] via-[#f0d98a] to-transparent opacity-90" />
        <div className="text-[10px] font-bold tracking-widest uppercase text-white/40 mb-[5px]">NVC — Documentary Qualification Received</div>
        <div className="text-[22px] text-white/92 mb-[6px]">Your documents have been accepted by NVC</div>
        <div className="text-[13px] text-white/55 leading-[1.55]">This is a significant milestone. Case is now documentarily complete.</div>
      </div>

      {!dqSaved ? (
        <div className="bg-white border-[1.5px] border-[#d0e4f7] rounded-[16px] p-[22px_24px] mb-[14px]">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-[12px] mb-[16px]">
            <input type="date" value={dqDate} onChange={(e) => setDqDate(e.target.value)} className="p-2.5 border rounded-lg" />
            <select value={dqCategory} onChange={(e) => setDqCategory(e.target.value)} className="p-2.5 border rounded-lg">
                <option value="">Select Category</option>
                <option value="IR-1">IR-1</option>
                <option value="F2A">F2A</option>
            </select>
            <select value={dqPost} onChange={(e) => setDqPost(e.target.value)} className="p-2.5 border rounded-lg">
                <option value="">Select Post</option>
                <option value="Islamabad">Islamabad</option>
                <option value="Karachi">Karachi</option>
            </select>
          </div>
          <button onClick={() => { setDqSaved(true); actions.updateMetadata({ dqSaved: true, dqDate, dqCategory, dqPost, dqCountry, post: dqPost }); }} className="w-full bg-primary text-white py-3 rounded-lg font-bold">Save DQ & Activate Tracking</button>
        </div>
      ) : (
        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl mb-4 flex justify-between items-center">
          <div className="font-bold text-emerald-800 text-xs">✓ DQ Recorded ({dqDate})</div>
          <button onClick={() => setDqSaved(false)} className="text-primary text-xs font-semibold hover:underline">Edit</button>
        </div>
      )}
    </div>
  );
};

export const InterviewSchedulingTool: React.FC<{ metadata: any }> = ({ metadata }) => {
  const postKey = ((metadata.post || metadata.dqPost) as keyof typeof INTERVIEW_SCHEDULING_DATA.schedulingData) || "Other";
  const postData = INTERVIEW_SCHEDULING_DATA.schedulingData[postKey];

  return (
    <div className="flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-380 shadow-xs border p-5 rounded-2xl bg-white">
      <div className="text-[10px] font-bold tracking-widest uppercase text-[#2d4a6e] mb-[6px]">Scheduling Status</div>
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
}> = ({ actions, interviewState }) => {
  const { interviewSaved, setInterviewSaved, interviewDate, setInterviewDate, letterDate, setLetterDate, consulateLocation, setConsulateLocation } = interviewState;
  const data = APPOINTMENT_RECEIVED_DATA;

  return (
    <div className="flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-380">
      <div className="relative bg-linear-to-br from-[#0a1a2e] to-[#163258] rounded-[16px] p-[26px_28px] mb-[18px] overflow-hidden shadow-xl">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-linear-to-r from-amber-400 to-transparent opacity-80" />
        <div className="text-[10px] font-bold tracking-widest uppercase text-white/40 mb-[7px]">{data.heroBanner.eyebrow}</div>
        <div className="text-[22px] text-white/95 leading-[1.2] mb-[8px]">{data.heroBanner.title}</div>
        <div className="text-[13px] text-white/55">{data.heroBanner.sub}</div>
      </div>

      {!interviewSaved ? (
        <div className="bg-white border-[1.5px] border-[#d0e4f7] rounded-[16px] p-[22px_24px] mb-[14px] shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-[12px] mb-[16px]">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase">Interview Date</label>
              <input type="date" value={interviewDate} onChange={(e) => setInterviewDate(e.target.value)} className="p-2.5 border rounded-lg focus:ring-2 focus:ring-primary/20" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase">Location</label>
              <input type="text" value={consulateLocation} onChange={(e) => setConsulateLocation(e.target.value)} placeholder="e.g. Islamabad" className="p-2.5 border rounded-lg focus:ring-2 focus:ring-primary/20" />
            </div>
          </div>
          <button onClick={() => { setInterviewSaved(true); actions.updateMetadata({ interviewSaved: true, interviewDate, consulateLocation, letterDate }); toast.success("Appointment saved!"); }} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 rounded-xl font-bold transition-all shadow-lg">Save Appointment & Unlock Chapter 3</button>
        </div>
      ) : (
        <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-2xl mb-4 flex justify-between items-center shadow-sm">
           <div>
              <div className="text-[10px] uppercase font-black text-emerald-800 mb-1">✓ Interview Scheduled</div>
              <div className="text-sm font-bold text-emerald-900">{interviewDate} · {consulateLocation}</div>
           </div>
           <button onClick={() => setInterviewSaved(false)} className="text-primary font-bold text-xs hover:underline">Edit</button>
        </div>
      )}
    </div>
  );
};

export const MedicalExamTool: React.FC<{
  state: any;
  actions: any;
  medState: any;
}> = ({ actions, medState }) => {
  const { medSaved, setMedSaved, medDate, setMedDate, medTime, setMedTime, medClinic, setMedClinic, isMedWizardOpen, setIsMedWizardOpen, medWizardStep, setMedWizardStep, medWizardMode, setMedWizardMode } = medState;
  const data = MEDICAL_EXAM_DATA;

  const currentSteps = medWizardMode === "service" ? data.serviceSteps : data.guideSteps;
  const s = currentSteps[medWizardStep];

  return (
    <div className="flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-380">
      <div className="flex gap-1.5 flex-wrap mb-8">
        {data.chips.map((chip: any, i: number) => (
          <span key={i} className={`text-[10px] font-bold uppercase tracking-[0.06em] px-3 py-1.5 rounded-full border ${chip.type === "med" ? "bg-teal-50 text-teal-700 border-teal-200" : "bg-blue-50 text-blue-700 border-blue-100"}`}>{chip.label}</span>
        ))}
      </div>

      {!medSaved ? (
        <div className="relative bg-[#0e1e38] rounded-2xl border border-white/5 shadow-2xl overflow-hidden mb-4">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-linear-to-r from-teal-500 to-blue-500 opacity-75" />
          <div className="p-8">
            <div className="text-[10px] font-black tracking-widest uppercase text-white/30 mb-1">{data.decisionModule.eyebrow}</div>
            <div className="text-xl text-white/95 font-bold mb-6">{data.decisionModule.heading}</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {data.decisionModule.paths.map((p: any) => (
                <button
                  key={p.id}
                  onClick={() => { setMedWizardMode(p.id); setMedWizardStep(0); setIsMedWizardOpen(true); }}
                  className="bg-white/5 border border-white/10 rounded-xl p-5 text-left transition-all hover:bg-white/10 hover:-translate-y-1 active:translate-y-0 group"
                >
                  <div className="text-2xl mb-3 group-hover:scale-110 transition-transform">{p.icon}</div>
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
              <div className="text-[10px] font-black uppercase text-emerald-800 mb-1">✓ Medical Appointment Confirmed</div>
              <div className="text-sm font-bold text-emerald-900">{medDate} at {medTime}</div>
              <div className="text-[10px] text-emerald-700 font-medium">{medClinic}</div>
           </div>
           <button onClick={() => setMedSaved(false)} className="text-primary font-bold text-xs hover:underline">Edit</button>
        </div>
      )}

      {isMedWizardOpen && (
        <div className="fixed inset-0 z-200 bg-white flex flex-col animate-in slide-in-from-bottom-5 duration-300">
           <div className="p-6 border-b flex items-center gap-4">
              <button onClick={() => setIsMedWizardOpen(false)} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors">
                 <X size={20} className="text-slate-600" />
              </button>
              <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                 <div className="h-full bg-primary transition-all duration-500" style={{ width: `${((medWizardStep + 1) / currentSteps.length) * 100}%` }} />
              </div>
              <div className="text-xs font-bold text-slate-400">{medWizardStep + 1} / {currentSteps.length}</div>
           </div>
           <div className="flex-1 overflow-y-auto p-12 flex flex-col items-center">
              <div className="w-full max-w-lg">
                 <div className="text-[10px] font-bold text-primary uppercase mb-2">Step {medWizardStep + 1} — {medWizardMode === "service" ? "Service" : "Guide"}</div>
                 <h2 className="text-2xl font-bold text-slate-900 mb-2">{s.heading}</h2>
                 <p className="text-sm text-slate-600 leading-relaxed mb-8">{s.sub}</p>

                 {(s as any).card && (
                   <div className="bg-slate-50 border rounded-2xl p-6 mb-8 shadow-sm">
                      <div className="font-bold text-slate-900 mb-1">{(s as any).card.title}</div>
                      <div className="text-sm text-slate-500 mb-6">{(s as any).card.description}</div>
                      <button className="w-full bg-primary text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 group">
                         {(s as any).card.buttonLabel} <ExternalLink size={16} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                      </button>
                   </div>
                 )}

                 {s.form && (
                   <div className="grid grid-cols-2 gap-4 mb-8">
                      <div className="flex flex-col gap-1">
                         <label className="text-[10px] font-bold text-slate-500 uppercase">Date</label>
                         <input type="date" value={medDate} onChange={(e) => setMedDate(e.target.value)} className="p-3 border rounded-xl" />
                      </div>
                      <div className="flex flex-col gap-1">
                         <label className="text-[10px] font-bold text-slate-500 uppercase">Time</label>
                         <input type="text" value={medTime} onChange={(e) => setMedTime(e.target.value)} placeholder="e.g. 09:30 AM" className="p-3 border rounded-xl" />
                      </div>
                      <div className="col-span-2 flex flex-col gap-1">
                         <label className="text-[10px] font-bold text-slate-500 uppercase">Clinic / Physician Name</label>
                         <input type="text" value={medClinic} onChange={(e) => setMedClinic(e.target.value)} placeholder="e.g. IOM Islamabad" className="p-3 border rounded-xl" />
                      </div>
                   </div>
                 )}

                 <div className="flex gap-3">
                    {medWizardStep > 0 && <button onClick={() => setMedWizardStep((v: number) => v -1)} className="p-4 border rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors">Back</button>}
                    <button 
                      onClick={() => {
                        if((s as any).save) {
                           if(!medDate || !medTime || !medClinic) { toast.error("Please fill all details"); return; }
                           setMedSaved(true);
                           actions.updateMetadata({ medSaved: true, medDate, medTime, medClinic });
                           setIsMedWizardOpen(false);
                           toast.success("Medical appointment saved!");
                        } else if(medWizardStep < currentSteps.length - 1) {
                           setMedWizardStep((v: number) => v + 1);
                        }
                      }}
                      className="flex-1 bg-slate-900 text-white p-4 rounded-xl font-bold hover:bg-slate-800 transition-colors"
                    >
                      {(s as any).save ? "Save Appointment" : (s as any).nav?.next || "Continue"}
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
}> = ({ actions, polioState }) => {
  const { polioLaunched, setPolioLaunched, isPolioGuideOpen, setIsPolioGuideOpen, polioGuideStep, setPolioGuideStep, polioChecks, setPolioChecks } = polioState;
  const data = POLIO_CERTIFICATE_DATA;

  return (
    <div className="flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-380">
      <div className="flex gap-1.5 flex-wrap mb-8">
        {data.chips.map((chip: any, i: number) => (
          <span key={i} className={`text-[10px] font-bold uppercase tracking-[0.06em] px-3 py-1.5 rounded-full border ${chip.type === "med" ? "bg-teal-50 text-teal-700 border-teal-200" : "bg-amber-50 text-amber-700 border-amber-100"}`}>{chip.label}</span>
        ))}
      </div>

      <div className="relative bg-[#0e1e38] rounded-2xl border border-white/5 shadow-2xl p-8 mb-4">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-linear-to-r from-teal-500 via-amber-400 to-transparent opacity-75" />
          <div className="text-[10px] font-black tracking-widest uppercase text-white/30 mb-1">{data.launchModule.eyebrow}</div>
          <div className="text-xl text-white/95 font-bold mb-6">{data.launchModule.heading}</div>
          <button 
            onClick={() => { setPolioGuideStep(0); setIsPolioGuideOpen(true); }}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg transition-all"
          >
            {polioLaunched ? data.launchModule.buttonLabels.completed : data.launchModule.buttonLabels.initial}
            {polioLaunched ? <CheckCircle2 size={18} /> : <ArrowRight size={18} />}
          </button>
      </div>

      <div className="bg-white border-[1.5px] border-slate-200 p-6 rounded-2xl shadow-sm">
          <div className="text-sm font-bold mb-4">{data.completionCard.title}</div>
          <div className="flex flex-col gap-3">
             {data.completionCard.items.map((item: string, i: number) => (
               <label key={i} className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${polioChecks[i] ? "bg-emerald-50 border-emerald-100" : "hover:bg-slate-50 border-transparent"}`}>
                  <input 
                    type="checkbox" 
                    checked={polioChecks[i]} 
                    onChange={() => {
                       const next = [...polioChecks];
                       next[i] = !next[i];
                       setPolioChecks(next);
                       actions.updateMetadata({ polio_checks: next });
                    }}
                    className="mt-1"
                  />
                  <span className={`text-xs leading-tight ${polioChecks[i] ? "text-emerald-800 font-bold" : "text-slate-600"}`}>{item}</span>
               </label>
             ))}
          </div>
      </div>

      {isPolioGuideOpen && (
        <div className="fixed inset-0 z-200 bg-white flex flex-col animate-in slide-in-from-bottom-5 duration-300">
           <div className="p-6 border-b flex items-center gap-4">
              <button onClick={() => setIsPolioGuideOpen(false)} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors">
                 <X size={20} className="text-slate-600" />
              </button>
              <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                 <div className="h-full bg-primary transition-all duration-500" style={{ width: `${((polioGuideStep + 1) / data.guideSteps.length) * 100}%` }} />
              </div>
              <div className="text-xs font-bold text-slate-400">{polioGuideStep + 1} / {data.guideSteps.length}</div>
           </div>
           <div className="flex-1 overflow-y-auto p-12 flex flex-col items-center">
              <div className="w-full max-lg">
                 <div className="text-[10px] font-bold text-primary uppercase mb-2">Step {polioGuideStep + 1} — {data.guideSteps[polioGuideStep].label}</div>
                 <h2 className="text-2xl font-bold text-slate-900 mb-2">{data.guideSteps[polioGuideStep].heading}</h2>
                 <p className="text-sm text-slate-600 leading-relaxed mb-8">{data.guideSteps[polioGuideStep].instruction}</p>
                 
                 <div className="flex gap-3">
                    {polioGuideStep > 0 && <button onClick={() => setPolioGuideStep((v: number) => v -1)} className="p-4 border rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors">Back</button>}
                    <button 
                      onClick={() => {
                        if(polioGuideStep < data.guideSteps.length - 1) {
                           setPolioGuideStep((v: number) => v + 1);
                        } else {
                           setPolioLaunched(true);
                           actions.updateMetadata({ polio_launched: "true" });
                           setIsPolioGuideOpen(false);
                           toast.success("Guide completed!");
                        }
                      }}
                      className="flex-1 bg-slate-900 text-white p-4 rounded-xl font-bold hover:bg-slate-800 transition-colors"
                    >
                      {polioGuideStep === data.guideSteps.length - 1 ? "Finish Guide" : "Next →"}
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
}> = ({ actions, pccState }) => {
  const { pccSaved, setPccSaved, pccReceived, setPccReceived, pccData, setPccData, isPccOverlayOpen, setIsPccOverlayOpen, pccOverlayStep, setPccOverlayStep, pccOverlayMode, setPccOverlayMode } = pccState;
  const data = POLICE_CLEARANCE_DATA;

  const currentSteps = pccOverlayMode === "service" ? data.serviceSteps : data.guideSteps;

  return (
    <div className="flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-380 shadow-xs border p-6 rounded-2xl bg-white">
      <div className="flex items-center gap-1.5 flex-wrap mb-8">
        {data.chips.map((chip: any, i: number) => (
          <span key={i} className={`text-[10px] font-bold uppercase tracking-[0.06em] px-3 py-1.5 rounded-full border ${chip.type === "pcc" ? "bg-blue-50 text-blue-700 border-blue-100" : "bg-purple-50 text-purple-700 border-purple-100"}`}>{chip.label}</span>
        ))}
      </div>

      <div className="relative bg-[#0e1e38] rounded-2xl border border-white/5 shadow-2xl p-8 mb-6 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-linear-to-r from-blue-500 to-transparent opacity-75" />
          <div className="text-[10px] font-black tracking-widest uppercase text-white/30 mb-1">{data.decisionModule.eyebrow}</div>
          <div className="text-xl text-white/95 font-bold mb-6">{data.decisionModule.heading}</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             {data.decisionModule.paths.map((p: any) => (
               <button 
                 key={p.id}
                 onClick={() => { setPccOverlayMode(p.id); setPccOverlayStep(0); setIsPccOverlayOpen(true); }}
                 className="p-5 bg-white/5 border border-white/10 rounded-xl text-left hover:bg-white/10 transition-all group"
               >
                  <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">{p.icon}</div>
                  <div className="text-sm font-bold text-white mb-1">{p.title}</div>
                  <div className="text-[10px] text-white/50 leading-tight">{p.sub}</div>
               </button>
             ))}
          </div>
      </div>

      <div className="bg-slate-50 border rounded-2xl p-6 mb-6">
          <div className="text-sm font-bold flex items-center gap-2 mb-4"><Search size={16} /> {data.trackingCard.title}</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
             {data.trackingCard.fields.map((f: any) => (
               <div key={f.id} className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">{f.label}</label>
                  <input 
                    type={f.id === "date" ? "date" : "text"}
                    value={(pccData as any)[f.id]}
                    onChange={(e) => setPccData({ ...pccData, [f.id]: e.target.value })}
                    className="p-3 border rounded-xl focus:ring-2 focus:ring-primary/20"
                  />
               </div>
             ))}
          </div>
          <button 
            onClick={() => { setPccSaved(true); actions.updateMetadata({ pcc_saved: "true", pcc_receipt: pccData.receipt, pcc_track: pccData.track, pcc_date: pccData.date }); toast.success("Tracking saved!"); }}
            className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-bold"
          >
            {data.trackingCard.buttonLabel}
          </button>
      </div>

      {pccSaved && !pccReceived && (
        <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl flex flex-col gap-4">
           <div>
              <div className="text-sm font-bold text-amber-900 mb-1">📌 {data.pendingCard.title}</div>
              <div className="text-xs text-amber-800 leading-relaxed">{data.pendingCard.body}</div>
           </div>
           <button onClick={() => { setPccReceived(true); actions.updateMetadata({ pcc_received: "true" }); toast.success("Marked as Received!"); }} className="w-full bg-amber-600 text-white py-3 rounded-xl font-bold">{data.pendingCard.buttonLabel}</button>
        </div>
      )}

      {pccReceived && (
        <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-2xl flex flex-col gap-4">
           <div>
              <div className="text-sm font-bold text-emerald-900 mb-1">✅ {data.receivedCard.title}</div>
              <div className="text-xs text-emerald-800 leading-relaxed">{data.receivedCard.body}</div>
           </div>
           <button className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2">
              <Upload size={16} /> {data.receivedCard.buttonLabel}
           </button>
        </div>
      )}

      {isPccOverlayOpen && (
        <div className="fixed inset-0 z-200 bg-white flex flex-col animate-in slide-in-from-bottom-5 duration-300">
           <div className="p-6 border-b flex items-center gap-4">
              <button onClick={() => setIsPccOverlayOpen(false)} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors">
                 <X size={20} className="text-slate-600" />
              </button>
              <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                 <div className="h-full bg-primary transition-all duration-500" style={{ width: `${((pccOverlayStep + 1) / currentSteps.length) * 100}%` }} />
              </div>
              <div className="text-xs font-bold text-slate-400">{pccOverlayStep + 1} / {currentSteps.length}</div>
           </div>
           <div className="flex-1 overflow-y-auto p-12 flex flex-col items-center">
              <div className="w-full max-w-lg">
                 <div className="text-[10px] font-bold text-primary uppercase mb-2">Step {pccOverlayStep + 1} — {currentSteps[pccOverlayStep].label}</div>
                 <h2 className="text-2xl font-bold text-slate-900 mb-2">{currentSteps[pccOverlayStep].heading}</h2>
                 <p className="text-sm text-slate-600 leading-relaxed mb-8">{currentSteps[pccOverlayStep].instruction}</p>
                 
                 <div className="flex gap-3">
                    {pccOverlayStep > 0 && <button onClick={() => setPccOverlayStep((v: number) => v -1)} className="p-4 border rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors">Back</button>}
                    <button 
                      onClick={() => {
                        if(pccOverlayStep < currentSteps.length - 1) {
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
}> = ({ tool, state, actions, gatheringState }) => {
  const { 
    gatheringStatus, setGatheringStatus, 
    selectedGatheringItem, setSelectedGatheringItem, 
    isGatheringGuideOpen, setIsGatheringGuideOpen, 
    gatheringGuideStep, setGatheringGuideStep 
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
                      {status === "reviewed" ? <CheckCircle2 size={18} /> : <div className="w-2 h-2 rounded-full bg-slate-300" />}
                    </div>
                    <div className="flex-1">
                      <div className={`text-[14px] font-semibold leading-tight ${isRev ? "text-[#0e5c3c]" : "text-[#0c1b33]"}`}>{item.title}</div>
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
