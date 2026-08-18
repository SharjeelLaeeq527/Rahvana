"use client";
import Image from "next/image";
import { SafeHtml } from "../shared/SafeHTML";

// Generic tutorial overlay for status guides (used for 'What does this status mean?')
export const GuideTutorialOverlay: React.FC<TutorialOverlayProps> = (props) => {
  const s: TutorialStep = props.tutorial[props.index] ?? {};
  const showBrowserHeader = Boolean(s?.url);
  const hasImageVisual = Boolean(s?.visual && /<img\b/i.test(s.visual));
  return (
    <TutorialShell {...props} title={props.title || s.heading}>
      <div className="text-[10px] sm:text-[11px] font-semibold tracking-widest uppercase text-primary mb-3">
        {props.title || s.label}
      </div>
      <h2 className="text-[clamp(18px,3.2vw,26px)] text-[#0c1b33] leading-tight mb-2">
        {s.heading}
      </h2>
      <SafeHtml
  as="p"
  className="text-[13px] sm:text-[14px] text-[#3a4f63] leading-relaxed mb-4 sm:mb-[18px]"
  html={s.instruction || ""}
/>
      <div className="bg-white border-[1.5px] border-[#d0e4f7] rounded-[10px] overflow-hidden mb-4 sm:mb-[18px] shadow-[0_2px_12px_rgba(12,27,51,0.06)]">
        {showBrowserHeader && (
          <div className="bg-[#eef3fa] border-b border-[#d0e4f7] p-[8px_10px] sm:p-[10px_14px] flex items-center gap-1.5 min-w-0">
            <div className="w-[9px] h-[9px] rounded-full bg-[#f87171]" />
            <div className="w-[9px] h-[9px] rounded-full bg-[#fbbf24]" />
            <div className="w-[9px] h-[9px] rounded-full bg-[#34d399]" />
            <div className="text-[9px] sm:text-[10px] font-semibold tracking-[0.07em] uppercase text-[#6b8097] ml-auto truncate min-w-0">
              {s.url}
            </div>
          </div>
        )}
        <div className="p-[14px] sm:p-[18px] leading-relaxed">
          {(s.ssLabel || s.kicker) && (
            <div className="text-[9px] sm:text-[10px] font-bold uppercase text-[#2f6fd4] mb-1">
              {s.ssLabel || s.kicker}
            </div>
          )}
          {(s.ssHeadline || s.head) && (
            <div className="text-[14px] sm:text-[15px] font-bold text-[#0c1b33] mb-1">
              {s.ssHeadline || s.head}
            </div>
          )}
          {(s.ssDesc || s.copy) && (
            <div className="text-[12px] sm:text-[13px] text-[#3a4f63] mb-2">
              {s.ssDesc || s.copy}
            </div>
          )}
          {s.visual && (
            <SafeHtml
            className={
              hasImageVisual
                ? "-mx-[18px] -mb-[18px] [&_img]:block [&_img]:w-full [&_img]:h-auto [&_img]:object-contain [&_img]:object-top"
                : "mb-3"
            }
            html={s.visual || ""}
          />
          )}
          {(s.ssHighlight || s.highlight) && (
            <div className="text-[12px] sm:text-[13px] font-semibold text-[#2f6fd4] px-3 py-2 bg-[#2f6fd4]/10 border border-[#2f6fd4]/20 rounded-lg mb-2">
              {s.ssHighlight || s.highlight}
            </div>
          )}
          {s.pills && (
            <div className="flex gap-2 flex-wrap mb-2">
              {s.pills.map((p: string, i: number) => (
                <span
                  key={i}
                  className="inline-block px-2.5 py-1 rounded-full bg-[#f4f7fb] border border-[#d0e4f7] text-[#6b8097] text-[10px] sm:text-[11px] font-bold uppercase tracking-wide whitespace-nowrap"
                >
                  {p}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
      {s.note && (
        <div className="bg-[#fef8e8] border border-[#f0d98a] rounded-[10px] px-3 py-2 sm:px-[14px] sm:py-[11px] text-[12px] sm:text-[13px] text-[#8a6200] leading-relaxed mb-5 sm:mb-[24px]">
          {s.note}
        </div>
      )}
    </TutorialShell>
  );
};

import React, { useEffect } from "react";
import { X, UserPlus, User, ExternalLink } from "lucide-react";
import { useLanguage } from "@/app/context/LanguageContext";

type TutorialStep = {
  label?: string;
  heading?: string;
  instruction?: string;
  url?: string;
  visual?: string;
  note?: string;
  caption?: string;
  ssLabel?: string;
  kicker?: string;
  ssHeadline?: string;
  head?: string;
  ssDesc?: string;
  copy?: string;
  ssHighlight?: string;
  highlight?: string;
  pills?: string[];
  vlabel?: string;
  media?: { type: "img" | "video"; src?: string };
};

interface TutorialOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  tutorial: TutorialStep[];
  index: number;
  setIndex: (idx: number) => void;
  title?: string;
}

const TutorialShell: React.FC<TutorialOverlayProps & { children: React.ReactNode }> = ({
  isOpen,
  onClose,
  tutorial,
  index,
  setIndex,
  children,
}) => {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen || !tutorial) return null;

  const total = tutorial.length;
  const progress = ((index + 1) / total) * 100;
  const isFirst = index === 0;
  const isLast = index === total - 1;

  return (
    <div className="fixed inset-0 z-500 flex flex-col overflow-hidden animate-in slide-in-from-bottom-[18px] duration-[0.28s] ease-in-out font-sans bg-white">
      {/* ── Progress bar header ── */}
      <div className="flex items-center px-5 sm:px-8 py-4 sm:py-5 border-b border-[#d0e4f7] gap-4 shrink-0 bg-white">
          <button onClick={onClose} className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#f4f7fb] transition-colors">
            <X size={16} strokeWidth={2} className="text-[#3a4f63]" />
          </button>
          <div className="flex-1 h-[6px] bg-[#d0e4f7] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-400 ease-in-out rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-[13px] font-semibold text-[#6b8097] whitespace-nowrap shrink-0">
            {index + 1} / {total}
          </div>
        </div>
      {/* ── Scrollable content + nav ── */}
      <div className="flex-1 overflow-y-auto flex flex-col items-center px-5 sm:px-8 md:px-10 py-7 sm:py-10">
        <div className="w-full max-w-full sm:max-w-[600px] md:max-w-[650px] flex flex-col">
          {children}
          <div className="mt-8 mb-2 flex flex-row gap-3">
            {!isFirst && (
              <button
                onClick={() => setIndex(index - 1)}
                className="shrink-0 px-6 py-3.5 bg-transparent text-[#3a4f63] border-[1.5px] border-[#d0e4f7] rounded-[10px] font-sans text-[14px] font-medium cursor-pointer transition-all hover:border-[#3a4f63] hover:text-[#1c2b3a]"
              >
                ← Back
              </button>
            )}
            {isLast ? (
              <button
                onClick={() => {
                  setIndex(0);
                  onClose();
                }}
                className="flex-1 py-3.5 bg-[#15744f] text-white border-none rounded-[10px] font-sans text-[14px] font-semibold cursor-pointer transition-all hover:bg-[#0e5c3c] hover:-translate-y-px text-center"
              >
                Done, return to step
              </button>
            ) : (
              <button
                onClick={() => setIndex(index + 1)}
                className="flex-1 py-3.5 bg-primary text-white border-none rounded-[10px] font-sans text-[14px] font-semibold cursor-pointer transition-all hover:bg-primary/80 hover:-translate-y-px active:translate-y-0 text-center"
              >
                Next →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const MedicalTutOverlay: React.FC<TutorialOverlayProps> = (props) => {
  const s = props.tutorial[props.index];
  return (
    <TutorialShell {...props} title="Medical Exam Guide">
      <div className="text-[11px] font-semibold tracking-widest uppercase text-primary mb-3.5">
        Medical Exam Guide · {s.label}
      </div>
      <h2 className="text-[clamp(20px,3.2vw,26px)] text-[#0c1b33] leading-tight mb-2">
        {s.heading}
      </h2>
      <p className="text-[14px] text-[#3a4f63] leading-relaxed mb-[18px]">{s.instruction}</p>
      <div className="bg-white border-[1.5px] border-[#d0e4f7] rounded-[10px] overflow-hidden mb-[18px] shadow-[0_2px_12px_rgba(12,27,51,0.06)]">
        <div className="bg-[#eef3fa] border-b border-[#d0e4f7] p-[10px_14px] flex items-center gap-1.5">
          <div className="w-[9px] h-[9px] rounded-full bg-[#f87171]" />
          <div className="w-[9px] h-[9px] rounded-full bg-[#fbbf24]" />
          <div className="w-[9px] h-[9px] rounded-full bg-[#34d399]" />
          <div className="text-[10px] font-semibold tracking-[0.07em] uppercase text-[#6b8097] ml-auto">
            {s.vlabel}
          </div>
        </div>
        <SafeHtml className="p-[18px] leading-relaxed" html={s.visual || ""} />
      </div>
      {s.note && (
        <div className="bg-[#fef8e8] border border-[#f0d98a] rounded-[10px] p-[11px_14px] text-[13px] text-[#8a6200] leading-relaxed mb-[24px]">
          {s.note}
        </div>
      )}
    </TutorialShell>
  );
};

export const InterviewDayTutOverlay: React.FC<TutorialOverlayProps> = (props) => {
  const s = props.tutorial[props.index];
  return (
    <TutorialShell {...props} title="Interview Day Guide">
      <div className="text-[11px] font-semibold tracking-widest uppercase text-primary mb-3.5">
        Interview Day Guide · {s.label}
      </div>
      <h2 className="text-[clamp(20px,3.2vw,26px)] text-[#0c1b33] leading-tight mb-2">
        {s.heading}
      </h2>
      <p className="text-[14px] text-[#3a4f63] leading-relaxed mb-[18px]">{s.instruction}</p>
      {s.media?.type === "img" && s.media.src ? (
        <Image
          src={s.media.src}
          alt={s.heading || "Interview day guide image"}
          width={1200}
          height={900}
          className="mb-[18px] w-full h-auto object-contain"
          sizes="(max-width: 640px) 95vw, (max-width: 1024px) 90vw, 580px"
          quality={95}
        />
      ) : (
        <SafeHtml className="mb-[18px] leading-relaxed" html={s.visual || ""} />
      )}
      {s.note && (
        <div className="bg-[#fef8e8] border border-[#f0d98a] rounded-[10px] p-[11px_14px] text-[13px] text-[#8a6200] leading-relaxed mb-[24px]">
          {s.note}
        </div>
      )}
    </TutorialShell>
  );
};

/*
export const CourierTutOverlay: React.FC<TutorialOverlayProps> = (props) => {
  const s = props.tutorial[props.index];
  return (
    <TutorialShell {...props} title="Courier Registration Guide">
      <div className="text-[11px] font-semibold tracking-widest uppercase text-primary mb-3.5">Courier Registration Guide · {s.label}</div>
      <h2 className="text-[clamp(20px,3.2vw,26px)] text-[#0c1b33] leading-tight mb-2">{s.heading}</h2>
      <p className="text-[14px] text-[#3a4f63] leading-relaxed mb-[18px]">{s.instruction}</p>
      <div className="bg-white border-[1.5px] border-[#d0e4f7] rounded-[10px] overflow-hidden mb-[18px] shadow-[0_2px_12px_rgba(12,27,51,0.06)]">
        <div className="bg-[#eef3fa] border-b border-[#d0e4f7] p-[10px_14px] flex items-center gap-1.5">
          <div className="w-[9px] h-[9px] rounded-full bg-[#f87171]" /><div className="w-[9px] h-[9px] rounded-full bg-[#fbbf24]" /><div className="w-[9px] h-[9px] rounded-full bg-[#34d399]" />
          <div className="text-[10px] font-semibold tracking-[0.07em] uppercase text-[#6b8097] ml-auto">{s.vlabel}</div>
        </div>
        <div className="p-[18px] leading-relaxed courier-mock-visual" dangerouslySetInnerHTML={{ __html: s.visual || "" }} />
      </div>
      {s.note && <div className="bg-[#fef8e8] border border-[#f0d98a] rounded-[10px] p-[11px_14px] text-[13px] text-[#8a6200] leading-relaxed mb-[24px]">{s.note}</div>}
    </TutorialShell>
  );
};
*/

export const CourierTutOverlay: React.FC<TutorialOverlayProps> = (props) => {
  const { t } = useLanguage();
  const guideStage = props.index + 1;

  const stages = [
    {
      id: 1,
      title: t("pages.courierRegistration.sidebar.signup"),
      label: t("pages.courierRegistration.guide.titles.signup"),
      desc: t("pages.courierRegistration.guide.descriptions.signup"),
      steps: [
        {
          id: "s1",
          title: t("pages.courierRegistration.guide.steps.signup.s1.title"),
          desc: t("pages.courierRegistration.guide.steps.signup.s1.desc"),
          link: "https://www.usvisascheduling.com/",
        },
        {
          id: "s2",
          title: t("pages.courierRegistration.guide.steps.signup.s2.title"),
          desc: t("pages.courierRegistration.guide.steps.signup.s2.desc"),
        },
        {
          id: "s3",
          title: t("pages.courierRegistration.guide.steps.signup.s3.title"),
          desc: t("pages.courierRegistration.guide.steps.signup.s3.desc"),
          note: "Check your inbox (and spam folder) for a 6-digit code. Enter it into the portal and click `Verify Code` to proceed.",
        },
        {
          id: "s4",
          title: t("pages.courierRegistration.guide.steps.signup.s4.title"),
          desc: t("pages.courierRegistration.guide.steps.signup.s4.desc"),
        },
        {
          id: "s5",
          title: t("pages.courierRegistration.guide.steps.signup.s5.title"),
          desc: t("pages.courierRegistration.guide.steps.signup.s5.desc"),
        },
        {
          id: "s6",
          title: t("pages.courierRegistration.guide.steps.signup.s6.title"),
          desc: t("pages.courierRegistration.guide.steps.signup.s6.desc"),
        },
        {
          id: "s7",
          title: t("pages.courierRegistration.guide.steps.signup.s7.title"),
          desc: t("pages.courierRegistration.guide.steps.signup.s7.desc"),
        },
        {
          id: "s8",
          title: t("pages.courierRegistration.guide.steps.signup.s8.title"),
          desc: t("pages.courierRegistration.guide.steps.signup.s8.desc"),
          bullets: [
            {
              label: t("pages.courierRegistration.guide.steps.signup.s8.username"),
              value: t("pages.courierRegistration.guide.steps.signup.s8.usernameDesc"),
            },
            {
              label: t("pages.courierRegistration.guide.steps.signup.s8.q1"),
              value: `${t("pages.courierRegistration.guide.steps.signup.s8.q1Desc")}`,
            },
            {
              label: t("pages.courierRegistration.guide.steps.signup.s8.q2"),
              value: t("pages.courierRegistration.guide.steps.signup.s8.q2Desc"),
            },
          ],
        },
        {
          id: "s9",
          title: t("pages.courierRegistration.guide.steps.signup.s9.title"),
          desc: t("pages.courierRegistration.guide.steps.signup.s9.desc"),
        },
      ],
    },
    {
      id: 2,
      title: t("pages.courierRegistration.sidebar.profile"),
      label: t("pages.courierRegistration.guide.titles.profile"),
      desc: t("pages.courierRegistration.guide.descriptions.profile"),
      steps: [
        {
          id: "p1",
          title: t("pages.courierRegistration.guide.steps.profile.s1.title"),
          desc: t("pages.courierRegistration.guide.steps.profile.s1.desc"),
        },
        {
          id: "p2",
          title: t("pages.courierRegistration.guide.steps.profile.s2.title"),
          desc: t("pages.courierRegistration.guide.steps.profile.s2.desc"),
        },
        {
          id: "p3",
          title: t("pages.courierRegistration.guide.steps.profile.s3.title"),
          desc: t("pages.courierRegistration.guide.steps.profile.s3.desc"),
        },
        {
          id: "p4",
          title: t("pages.courierRegistration.guide.steps.profile.s4.title"),
          desc: t("pages.courierRegistration.guide.steps.profile.s4.desc"),
        },
      ],
    },
    {
      id: 3,
      title: t("pages.courierRegistration.sidebar.application"),
      label: t("pages.courierRegistration.guide.titles.application"),
      desc: t("pages.courierRegistration.guide.descriptions.application"),
      steps: [
        {
          id: "a1",
          title: t("pages.courierRegistration.guide.steps.application.s1.title"),
          desc: t("pages.courierRegistration.guide.steps.application.s1.desc"),
        },
        {
          id: "a2",
          title: t("pages.courierRegistration.guide.steps.application.s2.title"),
          desc: t("pages.courierRegistration.guide.steps.application.s2.desc"),
          bullets: [
            {
              label: t("pages.courierRegistration.guide.steps.application.s2.country"),
              value: t("pages.courierRegistration.guide.steps.application.s2.countryDesc"),
            },
            {
              label: t("pages.courierRegistration.guide.steps.application.s2.name"),
              value: t("pages.courierRegistration.guide.steps.application.s2.nameDesc"),
            },
            {
              label: t("pages.courierRegistration.guide.steps.application.s2.birth"),
              value: t("pages.courierRegistration.guide.steps.application.s2.birthDesc"),
            },
          ],
        },
        {
          id: "a3",
          title: t("pages.courierRegistration.guide.steps.application.s3.title"),
          desc: t("pages.courierRegistration.guide.steps.application.s3.desc"),
          bullets: [
            {
              label: t("pages.courierRegistration.guide.steps.application.s3.phone"),
              value: t("pages.courierRegistration.guide.steps.application.s3.phoneDesc"),
            },
            {
              label: t("pages.courierRegistration.guide.steps.application.s3.email"),
              value: t("pages.courierRegistration.guide.steps.application.s3.emailDesc"),
            },
          ],
        },
        {
          id: "a4",
          title: t("pages.courierRegistration.guide.steps.application.s4.title"),
          desc: t("pages.courierRegistration.guide.steps.application.s4.desc"),
        },
        {
          id: "a5",
          title: t("pages.courierRegistration.guide.steps.application.s5.title"),
          desc: t("pages.courierRegistration.guide.steps.application.s5.desc"),
          bullets: [
            {
              label: t("pages.courierRegistration.guide.steps.application.s5.pasport"),
              value: t("pages.courierRegistration.guide.steps.application.s5.pasportDesc"),
            },
            {
              label: t("pages.courierRegistration.guide.steps.application.s5.dates"),
              value: t("pages.courierRegistration.guide.steps.application.s5.datesDesc"),
            },
            {
              label: t("pages.courierRegistration.guide.steps.application.s5.place"),
              value: t("pages.courierRegistration.guide.steps.application.s5.placeDesc"),
            },
          ],
        },
        {
          id: "a6",
          title: t("pages.courierRegistration.guide.steps.application.s6.title"),
          desc: t("pages.courierRegistration.guide.steps.application.s6.desc"),
          bullets: [
            {
              label: t("pages.courierRegistration.guide.steps.application.s6.id"),
              value: t("pages.courierRegistration.guide.steps.application.s6.idDesc"),
            },
            {
              label: "",
              value: t("pages.courierRegistration.guide.steps.application.s6.review"),
            },
            {
              label: "",
              value: t("pages.courierRegistration.guide.steps.application.s6.submit"),
            },
          ],
        },
      ],
    },
    {
      id: 4,
      title: t("pages.courierRegistration.sidebar.groupRequest"),
      label: t("pages.courierRegistration.guide.titles.groupRequest"),
      desc: t("pages.courierRegistration.guide.descriptions.groupRequest"),
      steps: [
        {
          id: "g1",
          title: t("pages.courierRegistration.guide.steps.groupRequest.s1.title"),
          desc: t("pages.courierRegistration.guide.steps.groupRequest.s1.desc"),
        },
        {
          id: "g2",
          title: t("pages.courierRegistration.guide.steps.groupRequest.s2.title"),
          desc: t("pages.courierRegistration.guide.steps.groupRequest.s2.desc"),
          bullets: [
            {
              label: t("pages.courierRegistration.guide.steps.groupRequest.s2.name"),
              value: t("pages.courierRegistration.guide.steps.groupRequest.s2.nameDesc"),
            },
            {
              label: t("pages.courierRegistration.guide.steps.groupRequest.s2.date"),
              value: t("pages.courierRegistration.guide.steps.groupRequest.s2.dateDesc"),
            },
            {
              label: t("pages.courierRegistration.guide.steps.groupRequest.s2.reason"),
              value: t("pages.courierRegistration.guide.steps.groupRequest.s2.reasonDesc"),
            },
          ],
        },
        {
          id: "g3",
          title: t("pages.courierRegistration.guide.steps.groupRequest.s3.title"),
          desc: t("pages.courierRegistration.guide.steps.groupRequest.s3.desc"),
          bullets: [
            {
              label: t("pages.courierRegistration.guide.steps.groupRequest.s3.local"),
              value: t("pages.courierRegistration.guide.steps.groupRequest.s3.localDesc"),
            },
            {
              label: t("pages.courierRegistration.guide.steps.groupRequest.s3.us"),
              value: t("pages.courierRegistration.guide.steps.groupRequest.s3.usDesc"),
            },
            {
              label: t("pages.courierRegistration.guide.steps.groupRequest.s3.address"),
              value: t("pages.courierRegistration.guide.steps.groupRequest.s3.addressDesc"),
            },
          ],
        },
        {
          id: "g4",
          title: t("pages.courierRegistration.guide.steps.groupRequest.s4.title"),
          desc: t("pages.courierRegistration.guide.steps.groupRequest.s4.desc"),
          bullets: [
            {
              label: t("pages.courierRegistration.guide.steps.groupRequest.s4.embassy"),
              value: t("pages.courierRegistration.guide.steps.groupRequest.s4.embassyDesc"),
            },
            {
              label: t("pages.courierRegistration.guide.steps.groupRequest.s4.attach"),
              value: t("pages.courierRegistration.guide.steps.groupRequest.s4.attachDesc"),
            },
            {
              label: t("pages.courierRegistration.guide.steps.groupRequest.s4.submit"),
              value: t("pages.courierRegistration.guide.steps.groupRequest.s4.submitDesc"),
            },
          ],
        },
      ],
    },
  ];

  const currentStage = stages[props.index] || stages[0];

  return (
    <TutorialShell {...props} tutorial={stages} title={t("pages.courierRegistration.title.main")}>
      <div className="w-full flex flex-col">
        {/* Kicker & Title */}
        <div className="text-[11px] font-semibold tracking-widest uppercase text-primary mb-3.5">
          Step 3.6 · {currentStage.title}
        </div>
        <h2 className="text-[clamp(22px,3.5vw,28px)] font-black text-[#0c1b33] mb-2 leading-tight">
          {currentStage.label}
        </h2>
        <p className="text-[14px] text-[#3a4f63] leading-relaxed mb-8 max-w-[600px]">
          {currentStage.desc}
        </p>

        {/* Steps Grid/List using Image-style Cards */}
        <div className="flex flex-col gap-5">
          {currentStage.steps.map((step, idx) => (
            <div
              key={step.id}
              className="bg-[#f4f7fb] border border-[#d0e4f7] rounded-[16px] p-[20px_22px] transition-all"
            >
              <div className="text-[12px] font-semibold text-[#6b8097] uppercase tracking-[0.05em] mb-[10px] flex items-center justify-end">
                {/* <span>WHAT THIS IS — {idx + 1}</span> */}
                {step.link && (
                  <a
                    href={step.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-primary lowercase tracking-normal"
                  >
                    visit portal <ExternalLink size={12} />
                  </a>
                )}
              </div>
              <div className="space-y-3">
                <div className="text-[15px] font-bold text-[#0c1b33]">{step.title}</div>
                <div className="text-sm text-[#3a4f63] leading-[1.7]">{step.desc}</div>
                {step.bullets && (
                  <ul className="mt-3 space-y-2.5">
                    {step.bullets.map((b, i) => (
                      <li
                        key={i}
                        className="flex gap-2.5 text-[13px] text-[#4a5f73] leading-relaxed"
                      >
                        <span className="text-primary/60 font-bold shrink-0">•</span>
                        <div>
                          {b.label && (
                            <span className="font-bold text-[#0c1b33] mr-1">{b.label}</span>
                          )}
                          <span>{b.value}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                {step.note && (
                  <div className="mt-4 bg-[#fef8e8] border border-[#f0d98a] rounded-[10px] p-[11px_14px] text-[13px] text-[#8a6200] leading-relaxed">
                    {step.note}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </TutorialShell>
  );
};
