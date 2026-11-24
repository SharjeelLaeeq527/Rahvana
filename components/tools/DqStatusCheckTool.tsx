"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Info, ExternalLink, Loader2, Calendar } from "lucide-react";
import { useLanguage } from "@/app/context/LanguageContext";
import { usePlan, normalizePlanTier } from "@/app/context/PlanContext";
import type { PlanTier } from "@/lib/entitlements/config";
import { ResultGate } from "@/app/components/entitlements/ResultGate";
import { CustomDropdown, DropdownOption } from "@/app/components/shared/CustomDropdown";
import { useCandidate } from "@/app/context/CandidateContext";
import type { ToolModeProps } from "@/types/tool-mode";
import { useResolveToolMode } from "@/lib/hooks/useResolveToolMode";
import { ToolLayout } from "./layout";
import type { ToolFaq } from "./layout/types";

interface SchedulingResult {
  Country?: string;
  Post: string;
  "Visa Category": string;
  "Case Documentarily Complete": string;
}

export interface DqStatusCheckToolProps extends ToolModeProps {
  showHeader?: boolean;
  className?: string;
}

function resolveDefaultVisaCategory(visaCat?: string): string {
  if (!visaCat) return "immediate-relative";
  const normalized = visaCat.toUpperCase();
  if (normalized.includes("IR") || normalized.includes("CR") || normalized.includes("IMMEDIATE")) {
    return "immediate-relative";
  }
  if (
    normalized.startsWith("F") ||
    normalized.includes("FAMILY") ||
    normalized.includes("PREFERENCE")
  ) {
    return "family-sponsored";
  }
  if (normalized.startsWith("EB") || normalized.includes("EMPLOYMENT")) {
    return "employment-based";
  }
  return "immediate-relative";
}

function parseCutoffDate(raw?: string): Date {
  if (!raw) return new Date("2025-10-01");
  const direct = new Date(raw);
  if (!isNaN(direct.getTime())) return direct;
  const parts = raw.split(/[- /]+/);
  if (parts.length >= 2) {
    const month = parts[0];
    const year = parts[1];
    const attempt = new Date(`${month} 1, ${year}`);
    if (!isNaN(attempt.getTime())) return attempt;
  }
  return new Date("2025-10-01");
}

function fmtMonth(d: Date | null): string {
  if (!d || isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

export default function DqStatusCheckTool({
  showHeader = true,
  className = "",
  mode: propMode,
  journeyContext: propContext,
  journeyTier: propJourneyTier,
}: DqStatusCheckToolProps) {
  const { isJourney, journeyContext, journeyTier } = useResolveToolMode({
    mode: propMode,
    journeyContext: propContext,
    journeyTier: propJourneyTier,
  });

  const { t } = useLanguage();
  const accountPlan = usePlan();
  const candidateCtx = useCandidate();

  const candidateVisaCategory =
    candidateCtx?.activeCandidate?.visaCategory || journeyContext?.journeyCategory;

  const defaultCategory = useMemo(
    () => resolveDefaultVisaCategory(candidateVisaCategory),
    [candidateVisaCategory]
  );

  const [visaCategory, setVisaCategory] = useState<string>(defaultCategory);
  const [post, setPost] = useState<string>("Islamabad");
  const [dqDate, setDqDate] = useState<string>("2026-06-20");
  const [loading, setLoading] = useState<boolean>(false);
  const [results, setResults] = useState<SchedulingResult[] | null>(null);

  // Sync category in journey mode
  useEffect(() => {
    if (isJourney && candidateVisaCategory) {
      setVisaCategory(resolveDefaultVisaCategory(candidateVisaCategory));
    }
  }, [isJourney, candidateVisaCategory]);

  // Dropdown Options
  const postOptions: DropdownOption[] = useMemo(
    () => [
      {
        value: "Islamabad",
        label: "Islamabad (U.S. Embassy)",
      },
      {
        value: "Karachi",
        label: "Karachi (U.S. Consulate)",
      },
    ],
    []
  );

  const visaCategoryOptions: DropdownOption[] = useMemo(
    () => [
      {
        value: "immediate-relative",
        label: "Immediate Relative (IR-1, CR-1, IR-5, IR-2)",
      },
      {
        value: "family-sponsored",
        label: "Family-Sponsored Preference (F1, F2A, F2B, F3, F4)",
      },
    ],
    []
  );

  // Determine effective plan tier
  const rawJourneyTier = propJourneyTier ?? journeyTier ?? journeyContext?.subscriptionTier;
  const effectiveTier: PlanTier = useMemo(() => {
    if (isJourney) {
      if (rawJourneyTier) {
        return normalizePlanTier(rawJourneyTier);
      }
      if (
        journeyContext?.journeyCategory &&
        accountPlan.journeyTiers[journeyContext.journeyCategory]
      ) {
        return accountPlan.journeyTiers[journeyContext.journeyCategory];
      }
    }
    return accountPlan.tier;
  }, [isJourney, rawJourneyTier, journeyContext, accountPlan.journeyTiers, accountPlan.tier]);

  // Fetch status from API
  const fetchStatus = useCallback(async (cat: string) => {
    setLoading(true);
    try {
      const response = await fetch("/api/iv-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city: "Islamabad", visaCategory: cat }),
      });
      const data = await response.json();
      if (response.ok && data.data && data.data.length > 0) {
        setResults(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch scheduling status:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus(visaCategory);
  }, [visaCategory, fetchStatus]);

  // Compute Cutoff Date
  const cutoffDate = useMemo(() => {
    const rawCutoff = results?.[0]?.["Case Documentarily Complete"];
    if (rawCutoff) {
      return parseCutoffDate(rawCutoff);
    }
    // Default fallback based on category
    return visaCategory === "family-sponsored" ? new Date("2024-10-01") : new Date("2025-10-01");
  }, [results, visaCategory]);

  // Compute User Date & Queue Status
  const userDate = useMemo(() => {
    if (!dqDate) return null;
    const d = new Date(dqDate);
    return isNaN(d.getTime()) ? null : d;
  }, [dqDate]);

  const isUserDateValid = userDate !== null;
  const isSoon = isUserDateValid && userDate.getTime() <= cutoffDate.getTime();

  const diffMonths = useMemo(() => {
    if (!isUserDateValid || !userDate) return 0;
    const diff = userDate.getTime() - cutoffDate.getTime();
    return Math.max(1, Math.round(diff / (1000 * 60 * 60 * 24 * 30.4375)));
  }, [isUserDateValid, userDate, cutoffDate]);

  // Calculate percentage positions for the timeline gauge
  const { cutPct, youPct } = useMemo(() => {
    if (!isUserDateValid || !userDate) {
      return { cutPct: 60, youPct: null };
    }

    const minTime = Math.min(cutoffDate.getTime(), userDate.getTime());
    const maxTime = Math.max(cutoffDate.getTime(), userDate.getTime());

    const start = new Date(minTime);
    start.setMonth(start.getMonth() - 4);
    const end = new Date(maxTime);
    end.setMonth(end.getMonth() + 4);

    const range = end.getTime() - start.getTime();
    if (range <= 0) return { cutPct: 50, youPct: 50 };

    const calcPct = (d: Date) => {
      const p = ((d.getTime() - start.getTime()) / range) * 100;
      return Math.max(8, Math.min(92, p));
    };

    return {
      cutPct: calcPct(cutoffDate),
      youPct: calcPct(userDate),
    };
  }, [cutoffDate, userDate, isUserDateValid]);

  const faqs: ToolFaq[] = useMemo(
    () => [
      {
        question: "What does documentarily complete mean?",
        answer:
          "NVC has accepted all your documents and the case is waiting for an interview slot.",
      },
      {
        question: "Where does this data come from?",
        answer: "The State Department's monthly immigrant visa scheduling report.",
      },
      {
        question: "When will I receive my Interview Letter (IL)?",
        answer:
          "NVC typically issues the Interview Appointment Letter (P4) by email between 4 to 8 weeks before the scheduled interview date.",
      },
      {
        question: "Can I do my immigrant visa interview in Karachi instead of Islamabad?",
        answer:
          "No. All immigrant visa adjudications and interviews for Pakistan are centralized exclusively at U.S. Embassy Islamabad. The U.S. Consulate General in Karachi does not conduct immigrant visa interviews.",
      },
    ],
    []
  );

  const sources = useMemo(
    () => [
      {
        title: "NVC Immigrant Visa Processing Timeframes",
        url: "https://travel.state.gov/content/travel/en/us-visas/visa-information-resources/iv-wait-times.html",
        note: "Official State Department weekly updates on document review and interview scheduling queues.",
      },
      {
        title: "U.S. Department of State Visa Bulletin",
        url: "https://travel.state.gov/content/travel/en/legal/visa-law0/visa-bulletin.html",
        note: "Monthly priority date cutoffs for family-sponsored and employment-based preference categories.",
      },
      {
        title: "U.S. Embassy Islamabad Consular Section",
        url: "https://pk.usembassy.gov/visas/immigrant-visas/",
        note: "Consular instructions, packet information, and interview requirements for Pakistani applicants.",
      },
      {
        title: "CEAC Case Status Tracker",
        url: "https://ceac.state.gov/ceacstattracker/status.aspx",
        note: "Check your live consular case status and correspondence directly from the Department of State.",
      },
    ],
    []
  );

  // Verdict Header Strings
  const verdictTitle = useMemo(() => {
    if (!isUserDateValid) return "Check your queue";
    return isSoon ? "Likely soon" : "Not yet";
  }, [isUserDateValid, isSoon]);

  const verdictSubtitle = useMemo(() => {
    if (!isUserDateValid) {
      return "Enter your documentarily complete date to compare against current consular processing cutoffs.";
    }
    if (isSoon) {
      return "This post is already scheduling cases from before your date.";
    }
    return `About ${diffMonths} ${diffMonths === 1 ? "month" : "months"} of cases are ahead of you.`;
  }, [isUserDateValid, isSoon, diffMonths]);

  // Answer Panel (Right Section)
  const answerPanel = (
    <ResultGate feature="dq_status_check" planTier={effectiveTier}>
      <div className="flex h-full min-w-0 flex-col gap-6">
        {/* Verdict */}
        <div>
          <div className="text-xs font-semibold tracking-wider text-[#6F7775] uppercase">
            The answer
          </div>
          <h3 className="mt-1 text-3xl font-extrabold tracking-tight text-[#16302C] sm:text-4xl">
            {verdictTitle}
          </h3>
          <p className="mt-1.5 text-sm leading-relaxed text-[#6F7775] sm:text-base">
            {verdictSubtitle}
          </p>
        </div>

        {/* Measure Track Gauge */}
        <div className="relative my-2 h-16 px-1 select-none">
          {/* Rail Track */}
          <div className="absolute top-[28px] right-0 left-0 h-[3px] rounded-full bg-[#16302C]/15" />

          {/* Progress Bar (Have) */}
          <div
            className="absolute top-[27px] left-0 h-[5px] rounded-full bg-[#A06A14] transition-all duration-300"
            style={{ width: `${cutPct}%` }}
          />

          {/* Cutoff Tick */}
          <div
            className="absolute top-[14px] h-[30px] w-[3px] -translate-x-1/2 rounded-full bg-[#16302C] transition-all duration-300"
            style={{ left: `${cutPct}%` }}
          >
            <span className="absolute -top-[20px] left-1/2 -translate-x-1/2 text-[11px] font-semibold whitespace-nowrap text-[#6F7775]">
              Scheduling up to {fmtMonth(cutoffDate)}
            </span>
          </div>

          {/* User Tick */}
          {isUserDateValid && userDate && youPct !== null && (
            <div
              className="absolute top-[14px] h-[30px] w-[3px] -translate-x-1/2 rounded-full bg-[#A06A14] shadow-xs transition-all duration-300"
              style={{ left: `${youPct}%` }}
            >
              <span className="absolute top-[32px] left-1/2 -translate-x-1/2 text-[11px] font-bold whitespace-nowrap text-[#A06A14]">
                You ({fmtMonth(userDate)})
              </span>
            </div>
          )}
        </div>

        {/* Specification Rows */}
        <div className="divide-y divide-[#16302C]/12 border-t border-[#16302C]/12 text-sm">
          <div className="flex items-baseline justify-between gap-3 py-2.5">
            <span className="text-[#6F7775]">Post is scheduling</span>
            <b className="text-right font-semibold text-[#16302C] tabular-nums">
              {loading ? "Updating..." : fmtMonth(cutoffDate)}
            </b>
          </div>

          <div className="flex items-baseline justify-between gap-3 py-2.5">
            <span className="text-[#6F7775]">Your date</span>
            <b className="text-right font-semibold text-[#16302C] tabular-nums">
              {isUserDateValid && userDate ? fmtMonth(userDate) : "Select date"}
            </b>
          </div>

          <div className="flex items-baseline justify-between gap-3 py-2.5">
            <span className="text-[#6F7775]">What to do</span>
            <b
              className={`text-right font-semibold ${
                isSoon ? "text-[#2E7D32]" : isUserDateValid ? "text-[#B76E00]" : "text-[#6F7775]"
              }`}
            >
              {isSoon
                ? "Watch email and CEAC"
                : isUserDateValid
                  ? "Check again next month"
                  : "Select your DQ date"}
            </b>
          </div>
        </div>

        {/* Small Disclaimer / Note */}
        <div className="mt-auto pt-2 text-center text-xs text-[#6F7775]">
          Live data tracked from U.S. State Department &amp; NVC immigrant visa processing reports.
        </div>

        {/* Action Links */}
        <div className="grid gap-2 pt-1">
          <a
            href="https://travel.state.gov/content/travel/en/us-visas/visa-information-resources/iv-wait-times.html"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl bg-[#16302C] px-5 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-[#234B45] active:scale-[0.99]"
          >
            <span>NVC Processing Timeframes</span>
            <ExternalLink className="h-4 w-4" />
          </a>
          <a
            href="https://ceac.state.gov/ceacstattracker/status.aspx"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-[#DDD9CE] bg-white/80 px-5 py-2.5 text-sm font-medium text-[#16302C] transition hover:bg-white active:scale-[0.99]"
          >
            <span>Check CEAC Status</span>
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>
    </ResultGate>
  );

  return (
    <ToolLayout
      title={t("ivTool.title") || "DQ Status Check"}
      tagline={
        t("ivTool.subtitle") ||
        "Find out if your immigrant visa interview is coming soon based on your documentarily complete date."
      }
      category="Immigrant Visa / NVC"
      priceOrDuration="Instant check"
      theme="dq"
      quickAccessItem={{
        id: "queue-watch",
        title: "DQ Status Check",
        href: "/iv-tool",
        icon_name: "Clock",
      }}
      faqs={faqs}
      sources={sources}
      disclaimer="Consular processing times vary by post capacity and visa availability. Projections are based on historical scheduling reports."
      showHeader={showHeader}
      layout="split"
      answer={answerPanel}
      className={className}
    >
      {/* Work Section (Left Column) */}
      <div className="space-y-6">
        <div>
          <div className="text-xs font-semibold tracking-wider text-[#6F7775] uppercase">
            Your case
          </div>
          <h2 className="mt-1.5 text-2xl font-bold tracking-tight text-[#16302C] sm:text-3xl">
            Is your interview coming soon?
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {/* Embassy or Consulate */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-[#16302C]">
              Embassy or consulate
            </label>
            <CustomDropdown
              value={post}
              onChange={(val) => setPost(val)}
              options={postOptions}
              placeholder="Select embassy or consulate"
              maxLabelWidth="max-w-[240px] sm:max-w-[340px]"
              className="w-full"
              triggerClassName="min-h-[50px] rounded-xl border border-[#DDD9CE] bg-white px-3.5 py-3 text-sm font-medium text-[#16302C] shadow-2xs hover:border-[#DDD9CE] focus:border-[#A06A14] focus:ring-2 focus:ring-[#F5ECD8]"
            />
          </div>

          {/* Visa Category */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-[#16302C]">
              Visa category
            </label>
            <CustomDropdown
              value={visaCategory}
              onChange={(val) => setVisaCategory(val)}
              options={visaCategoryOptions}
              placeholder="Select visa category"
              maxLabelWidth="max-w-[240px] sm:max-w-[340px]"
              className="w-full"
              triggerClassName="min-h-[50px] rounded-xl border border-[#DDD9CE] bg-white px-3.5 py-3 text-sm font-medium text-[#16302C] shadow-2xs hover:border-[#DDD9CE] focus:border-[#A06A14] focus:ring-2 focus:ring-[#F5ECD8]"
            />
          </div>

          {/* Documentarily Complete Date */}
          <div className="sm:col-span-2">
            <label htmlFor="d-date" className="mb-1.5 block text-sm font-semibold text-[#16302C]">
              Date NVC marked you documentarily complete
            </label>
            <div className="relative flex items-center">
              <input
                type="date"
                id="d-date"
                value={dqDate}
                onChange={(e) => setDqDate(e.target.value)}
                className="min-h-[50px] w-full rounded-xl border border-[#DDD9CE] bg-white px-3.5 py-3 text-sm font-medium text-[#16302C] shadow-2xs transition focus:border-[#A06A14] focus:ring-2 focus:ring-[#F5ECD8] focus:outline-hidden"
              />
            </div>
            <div className="mt-1.5 text-xs text-[#6F7775]">
              From your NVC email notification or the CEAC dashboard
            </div>
          </div>
        </div>

        {/* Refresh / Check Button */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => fetchStatus(visaCategory)}
            disabled={loading}
            className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-[#16302C] px-6 py-3 text-sm font-semibold text-white shadow-xs transition hover:bg-[#234B45] active:scale-[0.99] disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Checking latest schedule...</span>
              </>
            ) : (
              <>
                <Calendar className="h-4 w-4" />
                <span>Check Status</span>
              </>
            )}
          </button>
        </div>

        {/* Contextual Educational Note */}
        <div className="rounded-xl border border-[#DDD9CE]/80 bg-[#F6F4EF]/70 p-4 text-xs leading-relaxed text-[#6F7775]">
          <div className="flex items-start gap-2.5">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#A06A14]" />
            <div>
              <span className="font-semibold text-[#16302C]">
                What does &quot;Documentarily Complete&quot; mean?
              </span>
              <p className="mt-1">
                A case is documentarily complete when the National Visa Center (NVC) reviews and
                approves all required forms (DS-260), civil documents, and Form I-864 Affidavit of
                Support with zero rejected items or outstanding RFEs.
              </p>
            </div>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
