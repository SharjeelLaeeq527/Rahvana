"use client";

import React from "react";
import { useToast } from "@/app/components/shared/ToastProvider";
import { E, msg } from "@/lib/errors";
import { APPOINTMENT_RECEIVED_DATA } from "../AppointmentReceivedData";

interface AppointmentReceivedToolProps {
  state: any;
  actions: any;
  interviewState: {
    interviewSaved: boolean;
    setInterviewSaved: (v: boolean) => void;
    interviewDate: string;
    setInterviewDate: (v: string) => void;
    letterDate: string;
    setLetterDate: (v: string) => void;
    consulateLocation: string;
    setConsulateLocation: (v: string) => void;
  };
  guard?: () => boolean;
}

export const AppointmentReceivedTool: React.FC<AppointmentReceivedToolProps> = ({
  actions,
  interviewState,
  guard,
}) => {
  const { showToast } = useToast();
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
  const data = APPOINTMENT_RECEIVED_DATA;

  React.useEffect(() => {
    if (!consulateLocation?.trim()) {
      setConsulateLocation("Islamabad");
    }
  }, []);

  const validateAppointmentFields = () => {
    const newErrors: Record<string, string> = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!interviewDate) {
      newErrors.interviewDate = msg(E.APPOINTMENT_INTERVIEW_DATE_REQUIRED);
    } else if (new Date(interviewDate) < today) {
      newErrors.interviewDate = msg(E.APPOINTMENT_INTERVIEW_DATE_PAST);
    }

    const loc = consulateLocation.trim();
    if (!loc) {
      newErrors.consulateLocation = msg(E.APPOINTMENT_LOCATION_REQUIRED);
    } else if (loc.length < 2) {
      newErrors.consulateLocation = msg(E.APPOINTMENT_LOCATION_TOO_SHORT);
    } else if (!/^[a-zA-Z\s\-,\.]+$/.test(loc)) {
      newErrors.consulateLocation = msg(E.APPOINTMENT_LOCATION_INVALID);
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
                showToast(msg(E.APPOINTMENT_FIX_ERRORS), "error");
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
                showToast(msg(E.APPOINTMENT_SAVED_SUCCESS), "success");
              } finally {
                setIsSaving(false);
              }
            }}
            disabled={isSaving}
            className="w-full bg-primary hover:bg-primary/90 text-white py-3.5 rounded-xl font-bold transition-all shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
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
