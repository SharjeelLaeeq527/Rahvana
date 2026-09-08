/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import {
  FileText,
  Info,
  FolderOpen,
  AlertTriangle,
  Mail,
  ArrowRight,
  CheckCircle,
  XCircle,
  MapPin,
  Clock,
} from "lucide-react";
import { WizardState } from "@/app/(main)/dashboard/hooks/useWizard";

// ─── Icon map ─────────────────────────────────────────────────────────────────
const ICON_MAP: Record<string, React.ReactNode> = {
  document: <FileText className="h-5 w-5" />,
  info: <Info className="h-5 w-5" />,
  folder: <FolderOpen className="h-5 w-5" />,
  alert: <AlertTriangle className="h-5 w-5" />,
  mail: <Mail className="h-5 w-5" />,
  check: <CheckCircle className="h-5 w-5" />,
  "x-circle": <XCircle className="h-5 w-5" />,
};

const SEVERITY_STYLES: Record<
  string,
  { card: string; iconBg: string; iconColor: string; badge: string }
> = {
  standard: {
    card: "border-[#d0e4f7] bg-white hover:border-[#2f6fd4] hover:shadow-[0_6px_24px_rgba(47,111,212,0.12)]",
    iconBg: "bg-[#e8f1fb] border-[#d0e4f7]",
    iconColor: "text-[#2f6fd4]",
    badge: "bg-[#e8f1fb] text-[#2d4a6e]",
  },
  serious: {
    card: "border-[#fca5a5] bg-[#fff8f8] hover:border-[#b91c1c] hover:shadow-[0_6px_24px_rgba(185,28,28,0.1)]",
    iconBg: "bg-[#fee2e2] border-[#fca5a5]",
    iconColor: "text-[#b91c1c]",
    badge: "bg-[#fee2e2] text-[#7f1d1d]",
  },
  success: {
    card: "border-[#a8d9be] bg-[#f0faf5] hover:border-[#15744f] hover:shadow-[0_6px_24px_rgba(21,116,79,0.1)]",
    iconBg: "bg-[#d1f0e2] border-[#a8d9be]",
    iconColor: "text-[#15744f]",
    badge: "bg-[#d1f0e2] text-[#0d5c3a]",
  },
};

const SELECTED_STYLES: Record<string, { card: string; iconBg: string; iconColor: string }> = {
  standard: {
    card: "border-[#2f6fd4] bg-[#eff6ff] shadow-[0_0_0_3px_rgba(47,111,212,0.15)]",
    iconBg: "bg-[#2f6fd4] border-[#2f6fd4]",
    iconColor: "text-white",
  },
  serious: {
    card: "border-[#b91c1c] bg-[#fff1f2] shadow-[0_0_0_3px_rgba(185,28,28,0.12)]",
    iconBg: "bg-[#b91c1c] border-[#b91c1c]",
    iconColor: "text-white",
  },
  success: {
    card: "border-[#15744f] bg-[#e8f5ef] shadow-[0_0_0_3px_rgba(21,116,79,0.15)]",
    iconBg: "bg-[#15744f] border-[#15744f]",
    iconColor: "text-white",
  },
};

interface NoticeTriageToolProps {
  tool: any;
  state: WizardState;
  actions: {
    updateMetadata: (data: Record<string, unknown>) => void;
  };
  guard?: () => boolean;
}

export const NoticeTriageTool: React.FC<NoticeTriageToolProps> = ({
  tool,
  state,
  actions,
  guard,
}) => {
  const savedType = (state?.metadata?.uscisNoticeType as string) ?? "";
  const [selected, setSelected] = useState<string>(savedType);
  const [confirming, setConfirming] = useState(false);

  const handleSelect = (type: string) => {
    if (guard && !guard()) return;
    setSelected(type);
    setConfirming(false);
  };

  const handleConfirm = async () => {
    if (!selected) return;
    if (guard && !guard()) return;
    setConfirming(true);
    await actions.updateMetadata({ uscisNoticeType: selected });
    setConfirming(false);
  };

  const alreadySaved = savedType !== "" && savedType === selected;

  const noticeTypes: any[] = tool.notice_types ?? [];
  const whereToFind = tool.where_to_find;
  const deadlineWarning = tool.deadline_warning;
  const introCard = tool.intro_card;
  const alert = tool.alert;

  return (
    <div className="flex w-full max-w-[680px] flex-col px-4 pt-2 pb-10 sm:px-6 md:px-8">
      {/* Alert banner */}
      {alert && (
        <div
          className="mb-6 flex items-start gap-3 rounded-2xl p-4"
          style={{
            background: alert.type === "warning" ? "#fef9e7" : "#eff6ff",
            border: `1.5px solid ${alert.type === "warning" ? "#f0d98a" : "#bfdbfe"}`,
          }}
        >
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
            style={{ background: alert.type === "warning" ? "#fde8d4" : "#dbeafe" }}
          >
            <AlertTriangle
              className="h-5 w-5"
              style={{ color: alert.type === "warning" ? "#b45309" : "#1d4ed8" }}
            />
          </div>
          <div>
            <div
              className="mb-0.5 text-[14px] font-semibold"
              style={{ color: alert.type === "warning" ? "#78350f" : "#1e3a5f" }}
            >
              {alert.heading}
            </div>
            <p
              className="text-[13px] leading-[1.65]"
              style={{ color: alert.type === "warning" ? "#92400e" : "#1e40af" }}
            >
              {alert.body}
            </p>
          </div>
        </div>
      )}

      {/* Intro card */}
      {introCard && (
        <div
          className="mb-6 rounded-2xl border border-[#d0e4f7] bg-[#fafcff] p-4"
        >
          <div className="mb-1 text-[14px] font-semibold text-[#0c1b33]">{introCard.heading}</div>
          <p className="text-[13px] leading-[1.65] text-[#3a4f63]">{introCard.body}</p>
        </div>
      )}

      {/* Notice type selector */}
      <h2 className="mb-3 text-[17px] font-semibold text-[#0c1b33]">
        What type of notice did you receive?
      </h2>
      <div className="mb-5 flex flex-col gap-3">
        {noticeTypes.map((notice: any) => {
          const isSelected = selected === notice.type;
          const styles = isSelected
            ? SELECTED_STYLES[notice.severity] ?? SELECTED_STYLES.standard
            : SEVERITY_STYLES[notice.severity] ?? SEVERITY_STYLES.standard;

          return (
            <button
              key={notice.type}
              type="button"
              onClick={() => handleSelect(notice.type)}
              className={`group relative flex w-full cursor-pointer items-start gap-4 rounded-2xl border-[1.5px] p-4 text-left transition-all duration-200 select-none ${
                isSelected ? styles.card : (SEVERITY_STYLES[notice.severity] ?? SEVERITY_STYLES.standard).card
              }`}
            >
              {/* Radio indicator */}
              <div
                className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200"
                style={{
                  borderColor: isSelected
                    ? notice.severity === "serious"
                      ? "#b91c1c"
                      : "#2f6fd4"
                    : "#d0e4f7",
                  background: isSelected
                    ? notice.severity === "serious"
                      ? "#b91c1c"
                      : "#2f6fd4"
                    : "transparent",
                }}
              >
                {isSelected && <div className="h-2 w-2 rounded-full bg-white" />}
              </div>

              {/* Icon */}
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-all duration-200 ${
                  isSelected
                    ? styles.iconBg + " " + styles.iconColor
                    : (SEVERITY_STYLES[notice.severity] ?? SEVERITY_STYLES.standard).iconBg + " " +
                      (SEVERITY_STYLES[notice.severity] ?? SEVERITY_STYLES.standard).iconColor
                }`}
              >
                {ICON_MAP[notice.icon] ?? <FileText className="h-5 w-5" />}
              </div>

              <div className="min-w-0 flex-1">
                <div className="mb-0.5 flex items-center gap-2 flex-wrap">
                  <span className="text-[14px] font-semibold text-[#0c1b33]">{notice.label}</span>
                  {notice.severity === "serious" && (
                    <span className="rounded-full bg-[#fee2e2] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#7f1d1d]">
                      Serious
                    </span>
                  )}
                </div>
                <p className="text-[13px] leading-[1.6] text-[#6b8097]">{notice.description}</p>
                {isSelected && notice.cta && (
                  <div className="mt-2 flex items-center gap-1 text-[12px] font-semibold"
                    style={{ color: notice.severity === "serious" ? "#b91c1c" : "#2f6fd4" }}>
                    <span>{notice.cta}</span>
                    <ArrowRight className="h-3 w-3" />
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Confirm button */}
      {selected && (
        <div className="animate-in fade-in slide-in-from-bottom-2 mb-6 duration-300">
          {alreadySaved ? (
            <div
              className="flex items-center gap-3 rounded-2xl border border-[#a8d9be] bg-[#e8f5ef] px-5 py-4"
            >
              <CheckCircle className="h-5 w-5 shrink-0 text-[#15744f]" />
              <div>
                <div className="text-[14px] font-semibold text-[#15744f]">Notice type saved</div>
                <p className="text-[12.5px] text-[#2a6644]">
                  Rahvana is now guiding you based on your{" "}
                  <strong>{noticeTypes.find((n) => n.type === selected)?.label ?? selected}</strong>.
                  Check the next step in your journey.
                </p>
              </div>
            </div>
          ) : (
            <button
              type="button"
              disabled={confirming}
              onClick={handleConfirm}
              className="flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-[14px] font-semibold text-white transition-all"
              style={{
                background: noticeTypes.find((n) => n.type === selected)?.severity === "serious"
                  ? "#b91c1c"
                  : noticeTypes.find((n) => n.type === selected)?.severity === "success"
                  ? "#15744f"
                  : "#2f6fd4",
                cursor: selected ? "pointer" : "not-allowed",
              }}
            >
              {confirming ? (
                <span className="opacity-70">Saving…</span>
              ) : (
                <>
                  <span>
                    Confirm — I received a{" "}
                    {noticeTypes.find((n) => n.type === selected)?.label?.split("—")[0]?.trim() ?? selected.toUpperCase()}
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* Where to find your notice */}
      {whereToFind && (
        <div className="mb-5">
          <div className="mb-2 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-[#6b8097]" />
            <span className="text-[13px] font-semibold text-[#0c1b33]">{whereToFind.title}</span>
          </div>
          <div className="flex flex-col gap-2">
            {whereToFind.items.map((item: any, i: number) => (
              <div
                key={i}
                className="rounded-xl border border-[#d0e4f7] bg-[#fafcff] px-4 py-3"
              >
                <div className="mb-0.5 text-[12px] font-bold uppercase tracking-wider text-[#2f6fd4]">
                  {item.source}
                </div>
                <p className="text-[12.5px] leading-[1.6] text-[#3a4f63]">{item.detail}</p>
              </div>
            ))}
          </div>
          {whereToFind.note && (
            <p className="mt-2 text-[12px] leading-[1.6] text-[#6b8097] italic">
              {whereToFind.note}
            </p>
          )}
        </div>
      )}

      {/* Deadline warning */}
      {deadlineWarning && (
        <div
          className="flex items-start gap-3 rounded-xl px-4 py-3.5"
          style={{ background: "#fef9e7", border: "1.5px solid #f0d98a" }}
        >
          <Clock className="mt-0.5 h-4 w-4 shrink-0 text-[#b45309]" />
          <div>
            <div className="mb-0.5 text-[13px] font-semibold text-[#78350f]">
              {deadlineWarning.heading}
            </div>
            <p className="text-[12.5px] leading-[1.65] text-[#92400e]">{deadlineWarning.body}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default NoticeTriageTool;
