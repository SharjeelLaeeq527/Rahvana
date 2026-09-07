/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Bell,
  FileText,
  ArrowRight,
  Scale,
} from "lucide-react";

// ─── Chip colour map ────────────────────────────────────────────────────────────
const CHIP_STYLE: Record<string, string> = {
  role: "border-[#d0e4f7] bg-[#e8f1fb] text-[#2d4a6e]",
  urgent: "border-[#e8a87c] bg-[#fff8f3] text-[#7a3c00]",
  deadline: "border-[#f0d98a] bg-[#fef8e8] text-[#8a6200]",
  serious: "border-[#fecaca] bg-[#fff1f2] text-[#9f1239]",
  track: "border-[#c9bef2] bg-[#f3f0fb] text-[#4a2d8a]",
  status: "border-[#a8d9be] bg-[#e8f5ef] text-[#15744f]",
};

// ─── Alert banner ────────────────────────────────────────────────────────────────
const AlertBanner: React.FC<{ alert: any }> = ({ alert }) => {
  const isSerious = alert.type === "serious";
  return (
    <div
      className="mb-6 flex items-start gap-3 rounded-2xl p-4 md:p-5"
      style={{
        background: isSerious ? "#fff1f2" : "#eff6ff",
        border: `1.5px solid ${isSerious ? "#fca5a5" : "#bfdbfe"}`,
      }}
    >
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
        style={{ background: isSerious ? "#fee2e2" : "#dbeafe" }}
      >
        {isSerious ? (
          <AlertTriangle className="h-5 w-5" style={{ color: "#b91c1c" }} />
        ) : (
          <Info className="h-5 w-5" style={{ color: "#1d4ed8" }} />
        )}
      </div>
      <div>
        <div
          className="mb-0.5 text-[14px] font-semibold"
          style={{ color: isSerious ? "#7f1d1d" : "#1e3a5f" }}
        >
          {alert.heading}
        </div>
        <div
          className="text-[13px] leading-[1.65]"
          style={{ color: isSerious ? "#991b1b" : "#1e40af" }}
        >
          {alert.body}
        </div>
      </div>
    </div>
  );
};

// ─── Warning stripe ──────────────────────────────────────────────────────────────
const WarningBanner: React.FC<{ text: string }> = ({ text }) => (
  <div
    className="mb-6 flex items-start gap-3 rounded-xl px-4 py-3.5"
    style={{ background: "#fef9e7", border: "1.5px solid #f0d98a" }}
  >
    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "#b45309" }} />
    <p className="text-[13px] leading-[1.65]" style={{ color: "#78350f" }}>
      {text}
    </p>
  </div>
);

// ─── Numbered guide steps ────────────────────────────────────────────────────────
const GuideSteps: React.FC<{ steps: any[] }> = ({ steps }) => {
  const [expanded, setExpanded] = useState<Record<number, boolean>>(() => {
    const init: Record<number, boolean> = {};
    steps.forEach((_, i) => { init[i] = i === 0; });
    return init;
  });

  return (
    <div className="mb-8">
      <h2 className="mb-4 text-[20px] font-semibold text-[#0c1b33] md:text-[22px]">
        Step-by-step guide
      </h2>
      <div className="flex flex-col gap-3">
        {steps.map((step: any, i: number) => {
          const open = expanded[i] ?? false;
          return (
            <div
              key={i}
              className="overflow-hidden rounded-2xl border transition-all"
              style={{
                borderColor: open ? "var(--rv-ch1)" : "#d0e4f7",
                background: open ? "var(--rv-ch1-module-bg)" : "#fff",
              }}
            >
              <button
                type="button"
                className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
                onClick={() => setExpanded((prev) => ({ ...prev, [i]: !open }))}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[12px] font-bold"
                    style={{
                      background: open ? "var(--rv-ch1)" : "#e8f1fb",
                      color: open ? "#fff" : "#2d4a6e",
                    }}
                  >
                    {i + 1}
                  </div>
                  <span
                    className="text-[14px] font-semibold"
                    style={{ color: open ? "#fff" : "#0c1b33" }}
                  >
                    {step.title}
                  </span>
                </div>
                {open ? (
                  <ChevronUp className="h-4 w-4 shrink-0 text-white/60" />
                ) : (
                  <ChevronDown className="h-4 w-4 shrink-0 text-[#6b8097]" />
                )}
              </button>
              {open && (
                <div className="px-5 pb-5">
                  <p className="mb-3 text-[13.5px] leading-[1.7] text-white/80">{step.text}</p>
                  {step.note && (
                    <div
                      className="rounded-xl px-4 py-3 text-[12.5px] leading-[1.6]"
                      style={{
                        background: "rgba(255,255,255,0.08)",
                        border: "1px solid rgba(255,255,255,0.12)",
                        color: "rgba(255,255,255,0.65)",
                      }}
                    >
                      <span className="font-semibold text-white/80">Note: </span>
                      {step.note}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Expandable evidence categories (RFE) ────────────────────────────────────────
const EvidenceCategories: React.FC<{ data: any }> = ({ data }) => {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div className="mb-8">
      <h2 className="mb-1 text-[20px] font-semibold text-[#0c1b33] md:text-[22px]">
        {data.title}
      </h2>
      {data.subtitle && (
        <p className="mb-4 text-[13px] leading-[1.65] text-[#6b8097]">{data.subtitle}</p>
      )}
      <div className="flex flex-col gap-2">
        {data.categories.map((cat: any) => {
          const isOpen = open === cat.id;
          return (
            <div
              key={cat.id}
              className="overflow-hidden rounded-2xl border transition-all"
              style={{ borderColor: isOpen ? "#8284bf" : "#d0e4f7", background: "#fff" }}
            >
              <button
                type="button"
                className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left"
                onClick={() => setOpen(isOpen ? null : cat.id)}
              >
                <span className="text-[14px] font-semibold text-[#0c1b33]">{cat.label}</span>
                {isOpen ? (
                  <ChevronUp className="h-4 w-4 shrink-0 text-[#6b8097]" />
                ) : (
                  <ChevronDown className="h-4 w-4 shrink-0 text-[#6b8097]" />
                )}
              </button>
              {isOpen && (
                <div className="px-4 pb-4">
                  <p className="mb-3 text-[13px] leading-[1.65] text-[#3a4f63]">
                    {cat.description}
                  </p>
                  {cat.evidence_examples && (
                    <div className="mb-3">
                      <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-[#6b8097]">
                        Evidence examples
                      </div>
                      <div className="flex flex-col gap-1.5">
                        {cat.evidence_examples.map((ex: string, i: number) => (
                          <div key={i} className="flex items-start gap-2">
                            <span
                              className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                              style={{ background: "#8284bf" }}
                            />
                            <span className="text-[13px] text-[#3a4f63]">{ex}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {cat.important_note && (
                    <div
                      className="rounded-xl px-3 py-2.5 text-[12.5px] leading-[1.6]"
                      style={{
                        background: "#fef9e7",
                        border: "1px solid #f0d98a",
                        color: "#78350f",
                      }}
                    >
                      <span className="font-semibold">Important: </span>
                      {cat.important_note}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── NOID vs RFE comparison ──────────────────────────────────────────────────────
const NoidVsRfe: React.FC<{ data: any }> = ({ data }) => (
  <div className="mb-8">
    <h2 className="mb-4 text-[20px] font-semibold text-[#0c1b33] md:text-[22px]">
      {data.title}
    </h2>
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div
        className="rounded-2xl p-4"
        style={{ background: "#eff6ff", border: "1.5px solid #bfdbfe" }}
      >
        <div className="mb-1 text-[11px] font-bold uppercase tracking-wider text-[#1d4ed8]">
          {data.rfe.label}
        </div>
        <p className="text-[14px] leading-[1.65] text-[#1e3a5f]">{data.rfe.description}</p>
      </div>
      <div
        className="rounded-2xl p-4"
        style={{ background: "#fff1f2", border: "1.5px solid #fca5a5" }}
      >
        <div className="mb-1 text-[11px] font-bold uppercase tracking-wider text-[#b91c1c]">
          {data.noid.label}
        </div>
        <p className="text-[14px] leading-[1.65] text-[#7f1d1d]">{data.noid.description}</p>
      </div>
    </div>
  </div>
);

// ─── Denial options ──────────────────────────────────────────────────────────────
const DenialOptions: React.FC<{ data: any }> = ({ data }) => {
  const icons: Record<string, React.ReactNode> = {
    appeal: <Scale className="h-5 w-5" style={{ color: "#4a2d8a" }} />,
    motion_reopen: <FileText className="h-5 w-5" style={{ color: "#2d4a6e" }} />,
    motion_reconsider: <FileText className="h-5 w-5" style={{ color: "#2d4a6e" }} />,
    new_petition: <ArrowRight className="h-5 w-5" style={{ color: "#15744f" }} />,
  };
  return (
    <div className="mb-8">
      <h2 className="mb-1 text-[20px] font-semibold text-[#0c1b33] md:text-[22px]">
        {data.title}
      </h2>
      {data.subtitle && (
        <p className="mb-4 text-[13px] leading-[1.65] text-[#6b8097]">{data.subtitle}</p>
      )}
      <div className="flex flex-col gap-3">
        {data.options.map((opt: any) => (
          <div
            key={opt.id}
            className="rounded-2xl border p-4 md:p-5"
            style={{ borderColor: "#d0e4f7", background: "#fafcff" }}
          >
            <div className="mb-2 flex items-start gap-3">
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border"
                style={{ background: "#f3f0fb", borderColor: "#c9bef2" }}
              >
                {icons[opt.id] ?? <FileText className="h-5 w-5 text-[#4a2d8a]" />}
              </div>
              <div className="flex-1">
                <div className="mb-1 text-[14px] font-semibold text-[#0c1b33]">{opt.label}</div>
                <p className="mb-2 text-[13px] leading-[1.65] text-[#3a4f63]">
                  {opt.description}
                </p>
                {opt.important && (
                  <div
                    className="rounded-xl px-3 py-2.5 text-[12.5px] leading-[1.6]"
                    style={{
                      background: "#fef9e7",
                      border: "1px solid #f0d98a",
                      color: "#78350f",
                    }}
                  >
                    <span className="font-semibold">Important: </span>
                    {opt.important}
                  </div>
                )}
                {opt.url && (
                  <a
                    href={opt.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 flex items-center gap-1 text-[12px] font-semibold text-[#2f6fd4] hover:underline"
                  >
                    Official form link <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Outcomes panel ──────────────────────────────────────────────────────────────
const OutcomesPanel: React.FC<{ data: any }> = ({ data }) => {
  const iconMap: Record<string, React.ReactNode> = {
    approved: <CheckCircle className="h-5 w-5" style={{ color: "#15744f" }} />,
    denied: <XCircle className="h-5 w-5" style={{ color: "#b91c1c" }} />,
    notice: <Bell className="h-5 w-5" style={{ color: "#b45309" }} />,
  };
  const bgMap: Record<string, string> = {
    approved: "#e8f5ef",
    denied: "#fff1f2",
    notice: "#fff8f3",
  };
  const borderMap: Record<string, string> = {
    approved: "#a8d9be",
    denied: "#fca5a5",
    notice: "#e8a87c",
  };
  return (
    <div className="mb-8">
      <h2 className="mb-1 text-[20px] font-semibold text-[#0c1b33] md:text-[22px]">
        {data.heading}
      </h2>
      {data.body && (
        <p className="mb-4 text-[13px] leading-[1.65] text-[#6b8097]">{data.body}</p>
      )}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {data.outcomes.map((outcome: any) => (
          <div
            key={outcome.label}
            className="flex items-start gap-3 rounded-2xl border p-4"
            style={{
              background: bgMap[outcome.icon] ?? "#fafcff",
              borderColor: borderMap[outcome.icon] ?? "#d0e4f7",
            }}
          >
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
              style={{ background: "#fff" }}
            >
              {iconMap[outcome.icon] ?? <Info className="h-5 w-5 text-[#2d4a6e]" />}
            </div>
            <div>
              <div className="mb-0.5 text-[14px] font-semibold text-[#0c1b33]">
                {outcome.label}
              </div>
              <p className="text-[13px] leading-[1.65] text-[#3a4f63]">{outcome.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Attorney recommendation card ────────────────────────────────────────────────
const AttorneyCard: React.FC<{ data: any }> = ({ data }) => (
  <div
    className="mb-8 flex items-start gap-4 rounded-2xl border p-4 md:p-5"
    style={{ background: "#fff8f3", border: "1.5px solid #e8a87c" }}
  >
    <div
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
      style={{ background: "#fde8d4", border: "1px solid #e8a87c" }}
    >
      <Scale className="h-5 w-5" style={{ color: "#b85c00" }} />
    </div>
    <div>
      <div className="mb-1 text-[14px] font-semibold" style={{ color: "#7a3c00" }}>
        {data.heading}
      </div>
      <p className="text-[13px] leading-[1.65]" style={{ color: "#8a4a00" }}>
        {data.body}
      </p>
    </div>
  </div>
);

// ─── Citations ───────────────────────────────────────────────────────────────────
const Citations: React.FC<{ items: any[] }> = ({ items }) => (
  <div className="mb-6">
    <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-[#6b8097]">
      Official references
    </div>
    <div className="flex flex-col gap-2">
      {items.map((c: any, i: number) => (
        <a
          key={i}
          href={c.link}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-xl border border-[#d0e4f7] bg-[#fafcff] px-4 py-2.5 text-[13px] font-medium text-[#2f6fd4] transition-colors hover:border-[#2f6fd4] hover:underline"
        >
          <ExternalLink className="h-3.5 w-3.5 shrink-0" />
          {c.text}
        </a>
      ))}
    </div>
  </div>
);

// ─── AwaitingDecisionTool (step_1_23, type: "awaiting_decision") ─────────────────
export const AwaitingDecisionTool: React.FC<{ tool: any }> = ({ tool }) => (
  <div className="flex min-h-full w-full flex-col items-center">
    <div className="flex w-full max-w-[680px] flex-col px-4 pt-5 pb-10 sm:px-6 md:px-8 md:pt-8">
      {tool.status_card && (
        <div
          className="mb-6 overflow-hidden rounded-2xl border-[1.5px]"
          style={{ background: "var(--rv-ch1-module-bg)", borderColor: "var(--rv-ch1)" }}
        >
          <div
            className="h-[2px] w-full opacity-80"
            style={{
              background:
                "linear-gradient(90deg, var(--rv-ch1), var(--rv-ch1-module-bg), transparent)",
            }}
          />
          <div className="p-5 md:p-8">
            <div
              className="mb-1 text-[11px] font-bold uppercase tracking-widest"
              style={{ color: "var(--rv-ch1)" }}
            >
              Status
            </div>
            <h2 className="mb-2 text-[20px] font-semibold text-white md:text-[22px]">
              {tool.status_card.heading}
            </h2>
            <p className="text-[13.5px] leading-[1.7] text-white/75">{tool.status_card.body}</p>
            <span
              className="mt-3 inline-block rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider"
              style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}
            >
              {tool.status_card.badge}
            </span>
          </div>
        </div>
      )}

      {tool.possible_outcomes && (
        <OutcomesPanel
          data={{
            heading: "Possible outcomes",
            body: "USCIS will review your response and issue one of the following:",
            outcomes: tool.possible_outcomes,
          }}
        />
      )}

      {tool.monitoring_tips && (
        <div className="mb-8">
          <h2 className="mb-3 text-[18px] font-semibold text-[#0c1b33]">While you wait</h2>
          <div className="flex flex-col gap-2">
            {tool.monitoring_tips.map((tip: string, i: number) => (
              <div
                key={i}
                className="flex items-start gap-3 rounded-xl border border-[#d0e4f7] bg-white px-4 py-3"
              >
                <span
                  className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ background: "var(--rv-ch1)" }}
                />
                <p className="text-[13px] leading-[1.65] text-[#3a4f63]">{tip}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {tool.footer_note && (
        <p className="text-center text-[11.5px] text-[#6b8097]">{tool.footer_note}</p>
      )}
    </div>
  </div>
);

// ─── Main GuideStepRenderer ──────────────────────────────────────────────────────
interface GuideStepRendererProps {
  guideData: any;
  stepName: string;
  stepDescription?: string;
  actions?: any;
  state?: any;
}

export const GuideStepRenderer: React.FC<GuideStepRendererProps> = ({
  guideData,
  stepName,
  stepDescription,
}) => {
  if (!guideData) return null;
  const chips: any[] = guideData.chips ?? [];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 flex min-h-full w-full flex-col items-center duration-500">
      <div className="flex w-full max-w-[680px] flex-col px-4 pt-5 pb-10 sm:px-6 md:px-8 md:pt-8">
        <h1 className="mb-1 text-[clamp(26px,4vw,34px)] font-bold leading-[1.15] tracking-tight text-[#0c1b33]">
          {guideData.title || stepName}
        </h1>
        {(guideData.subtitle || stepDescription) && (
          <p className="mb-4 max-w-[620px] text-[15px] leading-[1.72] text-[#3a4f63]">
            {guideData.subtitle || stepDescription}
          </p>
        )}

        {chips.length > 0 && (
          <div className="mb-5 flex flex-wrap gap-2">
            {chips.map((chip: any, i: number) => (
              <span
                key={i}
                className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wider ${CHIP_STYLE[chip.type] ?? "border-[#d0e4f7] bg-[#fafcff] text-[#6b8097]"}`}
              >
                {chip.label}
              </span>
            ))}
          </div>
        )}

        {guideData.alert && <AlertBanner alert={guideData.alert} />}
        {guideData.warning_banner && <WarningBanner text={guideData.warning_banner.text} />}
        {guideData.noid_vs_rfe && <NoidVsRfe data={guideData.noid_vs_rfe} />}
        {guideData.common_rfe_reasons && (
          <EvidenceCategories data={guideData.common_rfe_reasons} />
        )}
        {guideData.denial_options && <DenialOptions data={guideData.denial_options} />}
        {guideData.guide_steps && guideData.guide_steps.length > 0 && (
          <GuideSteps steps={guideData.guide_steps} />
        )}
        {guideData.after_submission && <OutcomesPanel data={guideData.after_submission} />}
        {guideData.after_noid_response && <OutcomesPanel data={guideData.after_noid_response} />}
        {guideData.attorney_recommendation && (
          <AttorneyCard data={guideData.attorney_recommendation} />
        )}
        {guideData.citations && guideData.citations.length > 0 && (
          <Citations items={guideData.citations} />
        )}
        {guideData.disclaimer && (
          <p className="mt-2 text-center text-[11.5px] leading-[1.65] text-[#6b8097]">
            {guideData.disclaimer}
          </p>
        )}
      </div>
    </div>
  );
};

export default GuideStepRenderer;
