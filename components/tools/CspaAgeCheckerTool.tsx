"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { Check, ChevronDown, ChevronRight } from "lucide-react";
import type { ToolModeProps } from "@/types/tool-mode";
import { useResolveToolMode } from "@/lib/hooks/useResolveToolMode";
import { QuickAccessButton } from "@/app/components/shared/QuickAccessButton";
import {
  checkCspa,
  CSPA_SOURCES,
  formatAge,
  formatDate,
  ageBetween,
  birthdayAt,
  parseIsoDate,
  type CspaCheckState,
  type CspaInput,
  type CspaResult,
  type CspaSourceId,
  type CspaStatus,
} from "@/lib/tools/cspa/ageOut";
import { toCspaJourneyRecord, type CspaJourneyRecord } from "@/lib/tools/cspa/journeyPrefill";

/**
 * CSPA age-out checker for a child of a U.S. citizen (IR-2 / CR-2). Free in both modes.
 *
 * - standalone (`/cspa-age-checker`): reads nothing from any journey or profile and saves
 *   nothing; the answers live only in this page's memory.
 * - journey (EmbeddedToolContainer): the container passes `initialInput` built from the active
 *   journey (its saved check, the candidate's date of birth, the eligibility quest answers) and
 *   `onSave`, which writes the result to that journey's metadata.
 * All rules live in `lib/tools/cspa/ageOut.ts`; this component only collects input and shows
 * the result.
 */
export interface CspaAgeCheckerToolProps extends ToolModeProps {
  showHeader?: boolean;
  className?: string;
  /** Journey mode only: starting values. Ignored in standalone mode. */
  initialInput?: Partial<CspaInput>;
  /** Journey mode only: saves the check to the journey. Ignored in standalone mode. */
  onSave?: (record: CspaJourneyRecord) => void;
  /** Open straight on the checker instead of the intro card (e.g. a journey with a saved check). */
  skipIntro?: boolean;
}

const EMPTY: CspaInput = {
  dateOfBirth: "",
  maritalStatus: "never_married",
  relationship: "biological",
  stepMarriageDate: null,
  adoptionDate: null,
  i130Filed: false,
  filingDate: null,
  parentStatusAtFiling: "citizen",
  parentNaturalized: false,
  naturalizationDate: null,
};

/** One accent colour per result. Used for the top rule, the status dot and the timeline. */
const STATUS_STYLE: Record<CspaStatus, { label: string; accent: string; text: string }> = {
  protected: { label: "Protected", accent: "bg-emerald-600", text: "text-emerald-700 dark:text-emerald-400" },
  not_filed: { label: "Not filed yet", accent: "bg-[#0d7377]", text: "text-[#0d7377] dark:text-teal-300" },
  file_soon: { label: "File soon", accent: "bg-amber-500", text: "text-amber-700 dark:text-amber-400" },
  aged_out: { label: "Over the age limit", accent: "bg-rose-600", text: "text-rose-700 dark:text-rose-400" },
  not_a_child: { label: "Does not qualify", accent: "bg-rose-600", text: "text-rose-700 dark:text-rose-400" },
  needs_review: { label: "Talk to a lawyer", accent: "bg-amber-500", text: "text-amber-700 dark:text-amber-400" },
  invalid: { label: "Check the dates", accent: "bg-slate-400", text: "text-slate-600 dark:text-slate-400" },
};

const CHECK_MARK: Record<CspaCheckState, string> = {
  ok: "bg-emerald-600",
  problem: "bg-rose-600",
  review: "bg-amber-500",
  info: "bg-slate-400",
};

const QUESTIONS: { q: string; a: string }[] = [
  {
    q: "What does \"age locked\" mean?",
    a: "For a child of a U.S. citizen, the child's age stops counting on the day USCIS receives the I-130. If the child was under 21 that day, the child can still immigrate as a child after turning 21.",
  },
  {
    q: "Which date counts as the filing date?",
    a: "The day USCIS receives the I-130. It is printed as the Received Date on the receipt notice (Form I-797C).",
  },
  {
    q: "What if my child gets married?",
    a: "Locking the age does not cover marriage. A child who marries before getting the visa can no longer apply as a child. A married son or daughter can still be sponsored in the F3 category, which has a long wait.",
  },
  {
    q: "Does this work for stepchildren and adopted children?",
    a: "Yes, with extra rules. A stepchild counts only if the stepparent married the child's parent before the child turned 18. An adopted child usually counts only if adopted before 16, and the parent had legal custody and lived with the child for 2 years.",
  },
  {
    q: "What if the parent had a green card when the I-130 was filed?",
    a: "Then the child is in the F2A category, where the age is worked out with a different formula. This checker does not cover that case. If the parent later became a U.S. citizen, enter that date and the checker will use it.",
  },
];

// ─── Form controls ────────────────────────────────────────────────────────────

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 text-sm font-medium text-slate-900 dark:text-slate-100">{label}</div>
      {children}
      {hint && <p className="mt-1.5 text-[13px] text-slate-500 dark:text-slate-400">{hint}</p>}
    </div>
  );
}

/** Bordered radio options, laid out in a row on wider screens. */
function Choice<T extends string>({
  name,
  value,
  options,
  onChange,
}: {
  name: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={name}
      className={`grid grid-cols-1 gap-2 ${options.length === 2 ? "sm:grid-cols-2" : "sm:grid-cols-3"}`}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={`flex items-center gap-2.5 rounded-lg border px-3.5 py-2.5 text-left text-sm transition-colors focus-visible:ring-2 focus-visible:ring-[#0d7377]/30 focus-visible:outline-none ${
              active
                ? "border-[#0d7377] bg-[#0d7377]/[0.04] font-medium text-slate-900 dark:bg-teal-400/10 dark:text-slate-100"
                : "border-slate-200 text-slate-700 hover:border-slate-300 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600"
            }`}
          >
            <span
              aria-hidden
              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                active ? "border-[#0d7377]" : "border-slate-300 dark:border-slate-600"
              }`}
            >
              {active && <span className="h-2 w-2 rounded-full bg-[#0d7377]" />}
            </span>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function DateInput({
  value,
  onChange,
  max,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  max: string;
  label: string;
}) {
  return (
    <input
      type="date"
      aria-label={label}
      max={max}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3.5 text-sm text-slate-900 transition-colors focus:border-[#0d7377] focus:ring-2 focus:ring-[#0d7377]/15 focus:outline-none sm:max-w-[260px] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
    />
  );
}

/** A follow-up question that depends on the answer above it. */
function FollowUp({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6 rounded-lg bg-slate-50 p-4 sm:p-5 dark:bg-slate-800/50">{children}</div>
  );
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="p-5 sm:p-8">
      <legend className="sr-only">{title}</legend>
      <h2 className="mb-6 text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100">{title}</h2>
      <div className="space-y-7">{children}</div>
    </fieldset>
  );
}

// ─── Result pieces ────────────────────────────────────────────────────────────

const toMs = (iso: string | null | undefined) => parseIsoDate(iso)?.getTime() ?? null;
const clampPct = (n: number) => Math.min(100, Math.max(0, n));

/**
 * The years that matter, from age 17 (or today, if the child is younger) to age 22, with the
 * 21st birthday, today and the lock date marked. A birth-to-21 scale would squeeze every marker
 * into the last few pixels.
 */
function AgeTimeline({ dob, result, accent }: { dob: string; result: CspaResult; accent: string }) {
  const birth = parseIsoDate(dob);
  const now = parseIsoDate(new Date().toISOString().slice(0, 10));
  if (!birth || !now) return null;

  const startDate = new Date(Math.min(birthdayAt(birth, 17).getTime(), now.getTime()));
  const start = startDate.getTime();
  const end = birthdayAt(birth, 22).getTime();
  const twentyOne = birthdayAt(birth, 21).getTime();
  if (end <= start) return null;

  const pct = (ms: number) => clampPct(((ms - start) / (end - start)) * 100);
  const todayPct = pct(now.getTime());
  const twentyOnePct = pct(twentyOne);
  const lockMs = toMs(result.freezeDate);
  const lockPct = lockMs === null ? null : pct(lockMs);
  const startAge = ageBetween(birth, startDate).years;

  return (
    <div>
      <div className="relative h-1.5 rounded-full bg-slate-100 dark:bg-slate-800">
        <div className={`absolute inset-y-0 left-0 rounded-full ${accent}`} style={{ width: `${todayPct}%` }} />
        <span
          className="absolute -top-1.5 h-[18px] w-px bg-slate-400 dark:bg-slate-500"
          style={{ left: `${twentyOnePct}%` }}
        />
        {lockPct !== null && (
          <span
            className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rotate-45 border-2 border-white bg-slate-900 dark:border-slate-900 dark:bg-white"
            style={{ left: `${lockPct}%` }}
          />
        )}
        <span
          className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-slate-900 shadow-sm dark:border-slate-900 dark:bg-white"
          style={{ left: `${todayPct}%` }}
        />
      </div>
      <div className="relative mt-2 h-4 text-xs text-slate-500 tabular-nums dark:text-slate-400">
        <span className="absolute left-0">Age {startAge}</span>
        <span className="absolute -translate-x-1/2 font-medium text-slate-700 dark:text-slate-200" style={{ left: `${twentyOnePct}%` }}>
          21
        </span>
        <span className="absolute right-0">22</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-slate-600 dark:text-slate-300">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-slate-900 dark:bg-white" />
          Today
        </span>
        {lockPct !== null && (
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rotate-45 bg-slate-900 dark:bg-white" />
            Age locked
          </span>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5">
      <dt className="text-sm text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className="text-right text-sm font-medium text-slate-900 tabular-nums dark:text-slate-100">{value}</dd>
    </div>
  );
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return <h4 className="mb-3 text-[13px] font-semibold text-slate-900 dark:text-slate-100">{children}</h4>;
}

// ─── Intro card ───────────────────────────────────────────────────────────────

const NEEDED: string[] = [
  "Your child's date of birth",
  "Whether your child is married, or was married before",
  "For a stepchild: the date the stepparent married the child's parent",
  "For an adopted child: the date the adoption was finalized",
  "If the I-130 is filed: the Received Date on the receipt notice (Form I-797C)",
];

const MORE: { q: string; a: React.ReactNode }[] = [
  {
    q: "See an example",
    a: "A child was born on 10 March 2005. The U.S. citizen parent filed the I-130 on 1 June 2025, when the child was 20. The age is locked at 20, so the child can still get the IR-2 visa after turning 21 in March 2026.",
  },
  {
    q: "What you will need",
    a: (
      <ul className="list-disc space-y-1.5 pl-5 marker:text-slate-400">
        {NEEDED.map((n) => (
          <li key={n}>{n}</li>
        ))}
      </ul>
    ),
  },
  {
    q: "Married, step or adopted child?",
    a: "Locking the age does not help a child who marries before getting the visa. Stepchildren and adopted children have their own date rules. The checker asks about these.",
  },
];

const HELPS: string[] = [
  "Whether your child's age is already locked, and at what age",
  "The date your child turns 21, and the last day to file the I-130",
  "What to do next, in plain steps",
];

function IntroBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-[15px] font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
      <div className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{children}</div>
    </div>
  );
}

function IntroCard({ isJourney, onContinue }: { isJourney: boolean; onContinue: () => void }) {
  return (
    <section className="max-w-4xl rounded-xl border border-slate-200 bg-white p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900">
      <h2 className="text-xl leading-snug font-semibold tracking-tight text-slate-900 sm:text-2xl dark:text-slate-50">
        Will your child turn 21 before getting the visa?
      </h2>

      <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-3 md:gap-8">
        <IntroBlock title="What this tool is">
          A free checker for U.S. citizen parents bringing a child to the U.S. on an IR-2 visa.
          You enter a few dates, and it works out your child&apos;s age the way USCIS does.
        </IntroBlock>
        <IntroBlock title="Why you need it">
          The IR-2 visa is only for an unmarried child under 21. Cases take months, and a child
          who turns 21 without protection moves to a category with a much longer wait.
        </IntroBlock>
        <IntroBlock title="How it helps">
          A law called the Child Status Protection Act (CSPA) locks your child&apos;s age on the day
          USCIS receives the I-130. The checker tells you:
          <ul className="mt-1.5 list-disc space-y-1 pl-5 marker:text-slate-400">
            {HELPS.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
        </IntroBlock>
      </div>

      {/* On phones the button sticks to the bottom of the screen so it is always in view. */}
      <div className="sticky bottom-0 z-10 -mx-6 mt-6 flex flex-col gap-2 border-t border-slate-100 bg-white/95 px-6 py-3 backdrop-blur sm:static sm:mx-0 sm:flex-row sm:items-center sm:gap-3 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none dark:border-slate-800 dark:bg-slate-900/95 sm:dark:bg-transparent">
        <button
          type="button"
          onClick={onContinue}
          className="inline-flex h-11 items-center justify-center gap-1.5 rounded-lg bg-[#0d7377] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#0a5f62] focus-visible:ring-2 focus-visible:ring-[#0d7377] focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          Continue
          <ChevronRight className="h-4 w-4" />
        </button>
        <span className="text-[13px] text-slate-500 dark:text-slate-400">
          Takes about 2 minutes.{isJourney && " You can save the result to this journey."}
        </span>
      </div>

      <div className="mt-7 divide-y divide-slate-200 border-y border-slate-200 dark:divide-slate-800 dark:border-slate-800">
        {MORE.map(({ q, a }) => (
          <details key={q} className="group">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-3.5 text-sm font-medium text-slate-800 [&::-webkit-details-marker]:hidden dark:text-slate-200">
              {q}
              <ChevronDown className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-open:rotate-180" />
            </summary>
            <div className="-mt-1 pb-4 pr-8 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{a}</div>
          </details>
        ))}
      </div>

      <p className="mt-5 text-[12.5px] leading-relaxed text-slate-500 dark:text-slate-400">
        Based on USCIS guidance:{" "}
        {(["cspa", "policyManual"] as CspaSourceId[]).map((id, i) => (
          <React.Fragment key={id}>
            {i > 0 && ", "}
            <a
              href={CSPA_SOURCES[id].url}
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-slate-300 underline-offset-4 hover:text-slate-900 dark:decoration-slate-600 dark:hover:text-slate-200"
            >
              {CSPA_SOURCES[id].label}
            </a>
          </React.Fragment>
        ))}
        . This is general information, not legal advice.
      </p>
    </section>
  );
}

// ─── Tool ─────────────────────────────────────────────────────────────────────

export default function CspaAgeCheckerTool({
  showHeader = true,
  className = "",
  initialInput,
  onSave,
  skipIntro = false,
  mode: propMode,
  journeyContext: propContext,
  journeyTier: propJourneyTier,
}: CspaAgeCheckerToolProps) {
  const { isJourney } = useResolveToolMode({
    mode: propMode,
    journeyContext: propContext,
    journeyTier: propJourneyTier,
  });

  // Standalone never takes journey data, even if a caller passes it.
  const [input, setInput] = useState<CspaInput>(() =>
    isJourney && initialInput ? { ...EMPTY, ...initialInput } : EMPTY
  );
  const [saved, setSaved] = useState(false);
  const [started, setStarted] = useState(skipIntro);

  const goTo = (next: boolean) => {
    setStarted(next);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const set = <K extends keyof CspaInput>(key: K, value: CspaInput[K]) => {
    setInput((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const result = useMemo(() => (input.dateOfBirth ? checkCspa(input) : null), [input]);
  const style = result ? STATUS_STYLE[result.status] : null;
  const today = new Date().toISOString().slice(0, 10);
  const sourceIds: CspaSourceId[] = result?.sources.length
    ? result.sources
    : ["cspa", "policyManual", "children"];
  const showTimeline =
    !!result && (result.status === "protected" || result.status === "not_filed" || result.status === "file_soon");

  const handleSave = () => {
    if (!isJourney || !onSave || !result || result.status === "invalid") return;
    onSave(toCspaJourneyRecord(input, result));
    setSaved(true);
  };

  return (
    <div className={`mx-auto w-full max-w-6xl ${className}`}>
      {showHeader && (
        <header className="mb-10">
          {!isJourney && (
            <nav aria-label="Breadcrumb" className="mb-5 flex items-center gap-1.5 text-[13px] text-slate-500">
              <Link href="/tools" className="hover:text-slate-900 dark:hover:text-slate-200">
                Tools
              </Link>
              <ChevronRight className="h-3.5 w-3.5" />
              <span className="text-slate-700 dark:text-slate-300">CSPA Age-Out Checker</span>
            </nav>
          )}
          <div className="flex flex-col items-start justify-between gap-5 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <h1 className="text-[28px] leading-tight font-semibold tracking-tight text-slate-900 md:text-[34px] dark:text-slate-50">
                CSPA Age-Out Checker
              </h1>
              {started && (
              <p className="mt-3 text-base leading-relaxed text-slate-600 dark:text-slate-300">
                A child of a U.S. citizen can usually immigrate as a child only until age 21. Find
                out if your child&apos;s age is protected, or the last day to file the I-130.
              </p>
              )}
            </div>
            {!isJourney && (
              <QuickAccessButton
                item={{
                  id: "cspa-age-checker",
                  title: "CSPA Age-Out Checker",
                  href: "/cspa-age-checker",
                  icon_name: "Clock",
                }}
              />
            )}
          </div>
        </header>
      )}

      {!started ? (
        <IntroCard isJourney={isJourney} onContinue={() => goTo(true)} />
      ) : (
        <>
          <button
            type="button"
            onClick={() => goTo(false)}
            className="mb-4 inline-flex items-center gap-1 text-[13px] font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
          >
            <ChevronRight className="h-3.5 w-3.5 rotate-180" />
            What is CSPA?
          </button>
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-8">
          {/* ─ Inputs ─ */}
          <section className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
            <FormSection title="Your child">
              <Field label="Date of birth">
                <DateInput
                  label="Child's date of birth"
                  max={today}
                  value={input.dateOfBirth}
                  onChange={(v) => set("dateOfBirth", v)}
                />
              </Field>

              <Field label="Is your child married?">
                <Choice
                  name="Marital status"
                  value={input.maritalStatus}
                  onChange={(v) => set("maritalStatus", v)}
                  options={[
                    { value: "never_married", label: "Never married" },
                    { value: "previously_married", label: "Was married before" },
                    { value: "married", label: "Married now" },
                  ]}
                />
              </Field>

              <Field label="How is the child related to the U.S. citizen parent?">
                <Choice
                  name="Relationship"
                  value={input.relationship}
                  onChange={(v) => set("relationship", v)}
                  options={[
                    { value: "biological", label: "Own child" },
                    { value: "stepchild", label: "Stepchild" },
                    { value: "adopted", label: "Adopted" },
                  ]}
                />
              </Field>

              {input.relationship === "stepchild" && (
                <FollowUp>
                  <Field
                    label="When did the stepparent marry the child's parent?"
                    hint="This must be before the child's 18th birthday."
                  >
                    <DateInput
                      label="Stepparent marriage date"
                      max={today}
                      value={input.stepMarriageDate ?? ""}
                      onChange={(v) => set("stepMarriageDate", v || null)}
                    />
                  </Field>
                </FollowUp>
              )}

              {input.relationship === "adopted" && (
                <FollowUp>
                  <Field
                    label="When was the adoption finalized?"
                    hint="A guardianship order does not count as adoption."
                  >
                    <DateInput
                      label="Adoption date"
                      max={today}
                      value={input.adoptionDate ?? ""}
                      onChange={(v) => set("adoptionDate", v || null)}
                    />
                  </Field>
                </FollowUp>
              )}
            </FormSection>

            <FormSection title="The I-130 petition">
              <Field label="Has the U.S. citizen parent filed the I-130 for this child?">
                <Choice
                  name="I-130 filed"
                  value={input.i130Filed ? "yes" : "no"}
                  onChange={(v) => set("i130Filed", v === "yes")}
                  options={[
                    { value: "no", label: "Not yet" },
                    { value: "yes", label: "Yes, it is filed" },
                  ]}
                />
              </Field>

              {input.i130Filed && (
                <FollowUp>
                  <Field
                    label="Date it was filed"
                    hint="Shown as Received Date on the USCIS receipt notice (I-797C)."
                  >
                    <DateInput
                      label="I-130 filing date"
                      max={today}
                      value={input.filingDate ?? ""}
                      onChange={(v) => set("filingDate", v || null)}
                    />
                  </Field>

                  <Field label="On that day, the parent was">
                    <Choice
                      name="Parent status at filing"
                      value={input.parentStatusAtFiling ?? "citizen"}
                      onChange={(v) => set("parentStatusAtFiling", v)}
                      options={[
                        { value: "citizen", label: "A U.S. citizen" },
                        { value: "lpr", label: "A green card holder" },
                      ]}
                    />
                  </Field>

                  {input.parentStatusAtFiling === "lpr" && (
                    <Field label="Has the parent become a U.S. citizen since then?">
                      <Choice
                        name="Parent naturalized"
                        value={input.parentNaturalized ? "yes" : "no"}
                        onChange={(v) => set("parentNaturalized", v === "yes")}
                        options={[
                          { value: "no", label: "No" },
                          { value: "yes", label: "Yes" },
                        ]}
                      />
                    </Field>
                  )}

                  {input.parentStatusAtFiling === "lpr" && input.parentNaturalized && (
                    <Field label="Date the parent became a citizen" hint="Shown on the naturalization certificate.">
                      <DateInput
                        label="Date the parent became a citizen"
                        max={today}
                        value={input.naturalizationDate ?? ""}
                        onChange={(v) => set("naturalizationDate", v || null)}
                      />
                    </Field>
                  )}
                </FollowUp>
              )}
            </FormSection>
          </section>

          {/* ─ Result ─ */}
          <aside className="lg:sticky lg:top-24" aria-live="polite">
            {!result || !style ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-white/60 p-6 dark:border-slate-700 dark:bg-slate-900/60">
                <h3 className="text-[15px] font-semibold text-slate-900 dark:text-slate-100">
                  Your result will show here
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                  Start with your child&apos;s date of birth. The result updates as you answer, and
                  shows the 21st birthday, whether the age is locked, and what to do next.
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                <div className={`h-1 ${style.accent}`} />

                <div className="p-5 sm:p-6">
                  <div className={`flex items-center gap-2 text-[13px] font-semibold ${style.text}`}>
                    <span className={`h-2 w-2 rounded-full ${style.accent}`} />
                    {style.label}
                  </div>
                  <h3 className="mt-2 text-xl leading-snug font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                    {result.headline}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{result.body}</p>
                  {result.errors.length > 1 && (
                    <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-600 dark:text-slate-300">
                      {result.errors.slice(1).map((e) => (
                        <li key={e}>{e}</li>
                      ))}
                    </ul>
                  )}

                  {showTimeline && (
                    <div className="mt-6">
                      <AgeTimeline dob={input.dateOfBirth} result={result} accent={style.accent} />
                    </div>
                  )}
                </div>

                {result.status !== "invalid" && (
                  <dl className="divide-y divide-slate-100 border-t border-slate-100 px-5 py-1.5 sm:px-6 dark:divide-slate-800 dark:border-slate-800">
                    {result.ageToday && <Row label="Age today" value={formatAge(result.ageToday)} />}
                    {result.twentyFirstBirthday && (
                      <Row label="21st birthday" value={formatDate(result.twentyFirstBirthday)} />
                    )}
                    {result.freezeDate && <Row label="Age locked on" value={formatDate(result.freezeDate)} />}
                    {result.cspaAge && <Row label="Locked age" value={formatAge(result.cspaAge)} />}
                  </dl>
                )}

                {result.checks.length > 0 && (
                  <div className="border-t border-slate-100 p-5 sm:p-6 dark:border-slate-800">
                    <SubHeading>Relationship check</SubHeading>
                    <ul className="space-y-3">
                      {result.checks.map((c) => (
                        <li key={c.id} className="flex gap-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                          <span className={`mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full ${CHECK_MARK[c.state]}`} />
                          <span>{c.text}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {result.nextSteps.length > 0 && (
                  <div className="border-t border-slate-100 p-5 sm:p-6 dark:border-slate-800">
                    <SubHeading>What to do next</SubHeading>
                    <ol className="space-y-3">
                      {result.nextSteps.map((s, i) => (
                        <li key={s} className="flex gap-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                          <span className="w-4 shrink-0 text-right font-medium text-slate-400 tabular-nums">{i + 1}.</span>
                          <span>{s}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {isJourney && onSave && result.status !== "invalid" && (
                  <div className="border-t border-slate-100 bg-slate-50/70 p-5 sm:px-6 dark:border-slate-800 dark:bg-slate-800/40">
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={saved}
                      className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#0d7377] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#0a5f62] disabled:cursor-default disabled:bg-white disabled:text-emerald-700 disabled:ring-1 disabled:ring-emerald-200"
                    >
                      {saved && <Check className="h-4 w-4" />}
                      {saved ? "Saved to this journey" : "Save to this journey"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </aside>
        </div>

        {/* ─ Common questions + sources ─ */}
        <section className="mt-14 grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-8">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              Common questions
            </h2>
            <div className="mt-4 divide-y divide-slate-200 border-y border-slate-200 dark:divide-slate-800 dark:border-slate-800">
              {QUESTIONS.map(({ q, a }) => (
                <details key={q} className="group">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-[15px] font-medium text-slate-900 [&::-webkit-details-marker]:hidden dark:text-slate-100">
                    {q}
                    <ChevronDown className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-open:rotate-180" />
                  </summary>
                  <p className="-mt-1 pb-5 pr-8 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{a}</p>
                </details>
              ))}
            </div>
          </div>

          <div className="text-sm">
            <h2 className="text-[13px] font-semibold text-slate-900 dark:text-slate-100">Sources</h2>
            <ul className="mt-3 space-y-2">
              {sourceIds.map((id) => (
                <li key={id}>
                  <a
                    href={CSPA_SOURCES[id].url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-600 underline decoration-slate-300 underline-offset-4 hover:text-slate-900 hover:decoration-slate-500 dark:text-slate-400 dark:decoration-slate-600 dark:hover:text-slate-200"
                  >
                    {CSPA_SOURCES[id].label}
                  </a>
                </li>
              ))}
            </ul>
            <p className="mt-6 border-t border-slate-200 pt-4 text-[13px] leading-relaxed text-slate-500 dark:border-slate-800 dark:text-slate-400">
              This checker gives general information based on USCIS guidance. It is not legal advice.
              Rules can change, so check the sources above or speak to a licensed immigration
              attorney before you file.
            </p>
          </div>
        </section>
        </>
      )}
    </div>
  );
}
