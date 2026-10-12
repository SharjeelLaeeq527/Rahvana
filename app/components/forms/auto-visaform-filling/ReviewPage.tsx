"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { DEFAULT_FREE_QUESTION_LIMIT } from "./useFreePreview";
import type { Field } from "@/lib/formConfig/types";
import type { CandidateProfile } from "@/types/candidate";
import { getFieldCandidateScope } from "@/lib/formConfig/candidateScope";
import {
  Check,
  ChevronDown,
  Pencil,
  Eye,
  Download,
  Save,
  ArrowLeft,
  Lock,
  User,
  RefreshCw,
  CornerDownRight,
  ClipboardCheck,
} from "lucide-react";
import { useLanguage } from "@/app/context/LanguageContext";

/* ─── palette ─────────────────────────────────────────────────────────────────
 * One family: the app's deep teal + its soft tint.
 *   teal   #0d7377  primary, progress, "checked", main buttons
 *   tint   #e8f6f6  soft teal backgrounds
 *   glow   #3fb8b0  bright end of the progress bar
 *   blue   (Tailwind blue)  ONLY for things about the beneficiary / carried-over answers
 *   amber  (Tailwind amber) ONLY for blanks
 * Everything else is neutral slate.
 */
const TEAL = "#0d7377";
const TEAL_TINT = "#e8f6f6";
const TEAL_GLOW = "#3fb8b0";

/* ─── helpers ─────────────────────────────────────────────────────────────── */

/** Small string hash, so saved progress can tell "answers changed" without storing the answers themselves. */
const hashString = (str: string): string => {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
};

const PROGRESS_TTL_MS = 7 * 24 * 60 * 60 * 1000;

type SavedProgress = {
  savedAt: number;
  /** section index → hash of that section's answers when it was checked */
  sections: Record<string, string>;
  /** carried-over field key → hash of its value when it was marked correct */
  correct: Record<string, string>;
};

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

const isFieldAnswered = (field: Field, formData: Record<string, string>): boolean => {
  if (field.type === "checkbox" && field.options) {
    return field.options.some((opt) => formData[opt.pdfKey || opt.value] === "Yes");
  }
  const value = formData[field.key];
  return !!(value && value.trim() !== "");
};

const getDisplayValue = (field: Field, formData: Record<string, string>): string => {
  if (field.type === "checkbox" && field.options) {
    return field.options
      .filter((opt) => formData[opt.pdfKey || opt.value] === "Yes")
      .map((opt) => opt.label)
      .join(", ");
  }
  return formData[field.key] ?? "";
};

/**
 * Blank answers that are fine to leave blank. Uses the field's own `required` flag when it has one,
 * and falls back to the wording of the question ("if any", "leave blank", "if applicable", ...).
 */
const isOptionalField = (field: Field): boolean => {
  const required = (field as { required?: boolean }).required;
  if (required === false) return true;
  return /\((?:[^)]*\b)?(if any|if applicable|leave blank|optional|if outside|if in the u\.?s|if you still)/i.test(
    field.label ?? ""
  );
};

type Row =
  | { kind: "heading"; key: string; label: string }
  | { kind: "field"; key: string; field: Field; depth: number };

/**
 * Every visible question in a section, in form order.
 * - Hidden group cards become a small heading followed by their sub-questions.
 * - Sub-questions of ANY question (e.g. the details that appear when someone answers "Yes" to
 *   "Does the beneficiary have an A-Number?") are listed right under it, indented, whenever
 *   their condition is met.
 */
const getRows = (fields: Field[], formData: Record<string, string>): Row[] => {
  const rows: Row[] = [];

  // `groupChildren`: sub-questions of a hidden group card sit level with each other, unless they only
  // appear conditionally. Conditional ones are follow-ups to an earlier answer, so they get indented.
  const addSubs = (parent: Field, depth: number, groupChildren = false) => {
    (parent.subQuestions ?? []).forEach((s) => {
      const sub = s as unknown as Field;
      if (sub.condition && !sub.condition(formData)) return;
      const showSelf = sub.type !== "hidden" || !!sub.label;
      const d = groupChildren ? (sub.condition ? 1 : 0) : depth;
      if (showSelf) rows.push({ kind: "field", key: sub.key, field: sub, depth: d });
      addSubs(sub, showSelf ? d + 1 : d);
    });
  };

  fields.forEach((field) => {
    if (field.condition && !field.condition(formData)) return;

    if (field.type === "hidden" && field.subQuestions && field.subQuestions.length > 0) {
      const before = rows.length;
      rows.push({ kind: "heading", key: `h-${field.key}`, label: field.label });
      addSubs(field, 0, true);
      if (rows.length === before + 1) rows.pop(); // group had nothing visible
    } else if (field.type !== "hidden" || field.label) {
      // A top-level question that only appears conditionally is a follow-up to an earlier answer.
      const isFollowUp = !!field.condition && rows.some((r) => r.kind === "field");
      rows.push({ kind: "field", key: field.key, field, depth: isFollowUp ? 1 : 0 });
      addSubs(field, isFollowUp ? 2 : 1);
    }
  });

  return rows;
};

/* ─── props ────────────────────────────────────────────────────────────────── */

export interface ReviewPageProps {
  formData: Record<string, string>;
  sections: { title: string; fields: Field[] }[];
  onEditStep: (step: number) => void;
  onBackToForm: () => void;
  onPreviewPDF: () => void;
  onDownloadPDF: () => void;
  onSaveToVault?: () => void;
  isPreviewing?: boolean;
  isDownloading?: boolean;
  isSavingToVault?: boolean;
  isFreePreview?: boolean;
  /** Per-form preview allowance (from the form config) shown in the free-preview banner. */
  freePreviewLimit?: number;
  onUpgradeClick?: () => void;
  formCode?: string;
  activeCandidate?: CandidateProfile | null;
  /**
   * Set when this form was pre-filled from another candidate (e.g. "test2").
   * If omitted, nothing is flagged as carried-over and the "Check these first" box is hidden.
   */
  prefilledFromName?: string;
  /** Keys of fields the user has edited themselves this session. Edited answers aren't flagged. */
  editedKeys?: Set<string>;
}

/* ─── component ─────────────────────────────────────────────────────────────*/

export function ReviewPage({
  formData,
  sections,
  onEditStep,
  onBackToForm,
  onPreviewPDF,
  onDownloadPDF,
  onSaveToVault,
  isPreviewing,
  isDownloading,
  isSavingToVault,
  isFreePreview = false,
  freePreviewLimit = DEFAULT_FREE_QUESTION_LIMIT,
  onUpgradeClick,
  formCode = "i130",
  activeCandidate,
  prefilledFromName,
  editedKeys,
}: ReviewPageProps) {
  const { t } = useLanguage();

  const [confirmed, setConfirmed] = useState<Set<number>>(new Set());
  const [stillCorrect, setStillCorrect] = useState<Set<string>>(new Set());
  // undefined = user hasn't touched it yet, so we pick a smart default below
  const [openIdx, setOpenIdx] = useState<number | null | undefined>(undefined);
  const [allOpen, setAllOpen] = useState(false);
  const [lockedHint, setLockedHint] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [restored, setRestored] = useState(false);
  const hintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // The answers each checked section had at the moment it was checked
  const confirmedSigs = useRef<Map<number, string>>(new Map());

  useEffect(
    () => () => {
      if (hintTimer.current) clearTimeout(hintTimer.current);
    },
    []
  );

  const candidateName = useMemo(() => {
    if (!activeCandidate) return "Beneficiary";
    if (activeCandidate.fullName) return activeCandidate.fullName.split(" ")[0];

    const firstNameKeys = [
      "pt4_beneficiary_first",
      "beneficiary_first_name",
      "ds260_first_name",
      "applicant_first_name",
      "immigrant_first_name",
    ];
    for (const k of firstNameKeys) {
      const v = formData[k]?.trim();
      if (v) return v;
    }

    if (activeCandidate.label)
      return activeCandidate.label
        .replace(/candidate\s*(\d+)?/i, (_: string, n: string) => (n ? `Beneficiary ${n}` : "Beneficiary"))
        .trim();
    return "Beneficiary";
  }, [activeCandidate, formData]);

  const isEdited = (f: Field) =>
    !!editedKeys && (editedKeys.has(f.key) || !!f.options?.some((o) => editedKeys.has(o.pdfKey || o.value)));

  const isPersonSpecific = (f: Field, sectionTitle: string) =>
    !!activeCandidate && getFieldCandidateScope(formCode, f, sectionTitle) === "candidate_distinct";

  /* Every section with every question, plus counts and the carried-over list */
  const { sectionData, carriedItems } = useMemo(() => {
    const carried: { field: Field; stepNum: number; value: string }[] = [];

    const data = sections
      .map((section, idx) => {
        const rows = getRows(section.fields, formData);
        let total = 0;
        let answered = 0;
        let requiredBlank = 0;
        let personCount = 0;
        const sectionCarried: { field: Field; stepNum: number; value: string }[] = [];

        rows.forEach((row) => {
          if (row.kind !== "field") return;
          const f = row.field;
          total++;
          if (isPersonSpecific(f, section.title)) personCount++;
          if (isFieldAnswered(f, formData)) {
            answered++;
            if (isPersonSpecific(f, section.title) && prefilledFromName) {
              if (!isEdited(f))
                sectionCarried.push({ field: f, stepNum: idx + 1, value: getDisplayValue(f, formData) });
            }
          } else if (!isOptionalField(f)) {
            requiredBlank++;
          }
        });

        // A beneficiary section is one where most questions are about the beneficiary. Only those get the
        // "About <name>" treatment, and only their copied answers are listed under "Check these first".
        const hasPerson = total > 0 && personCount * 2 >= total;
        if (hasPerson) carried.push(...sectionCarried);

        const sig = hashString(
          rows.map((r) => (r.kind === "field" ? `${r.key}=${getDisplayValue(r.field, formData)}` : r.key)).join("|")
        );

        return { idx, title: section.title, rows, total, answered, requiredBlank, hasPerson, sig };
      })
      .filter((s) => s.total > 0);

    return { sectionData: data, carriedItems: carried };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sections, formData, activeCandidate, formCode, prefilledFromName, editedKeys]);

  /* ── Remembered progress ─────────────────────────────────────────────────────
   * Checked sections and "still correct" ticks are kept for a week, per form and candidate.
   * Only hashes are stored (never the answers), and a tick is dropped automatically if that
   * section's answers have changed since it was checked.
   */
  const candidateKey =
    (activeCandidate as { id?: string } | null | undefined)?.id ?? activeCandidate?.label ?? "default";
  const storageKey = `review-progress:${formCode}:${candidateKey}`;

  useEffect(() => {
    if (hydrated || sectionData.length === 0) return;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        const saved = JSON.parse(raw) as SavedProgress;
        if (saved && Date.now() - saved.savedAt < PROGRESS_TTL_MS) {
          const sigs = new Map(sectionData.map((sec) => [String(sec.idx), sec.sig]));
          const okSections = Object.entries(saved.sections ?? {})
            .filter(([i, sig]) => sigs.get(i) === sig)
            .map(([i, sig]) => {
              confirmedSigs.current.set(Number(i), sig);
              return Number(i);
            });
          const carriedSigs = new Map(carriedItems.map((c) => [c.field.key, hashString(c.value)]));
          const okCorrect = Object.entries(saved.correct ?? {})
            .filter(([k, sig]) => carriedSigs.get(k) === sig)
            .map(([k]) => k);
          if (okSections.length > 0 || okCorrect.length > 0) {
            setConfirmed(new Set(okSections));
            setStillCorrect(new Set(okCorrect));
            setRestored(true);
          }
        }
      }
    } catch {
      /* storage unavailable: start fresh */
    }
    setHydrated(true);
  }, [hydrated, sectionData, carriedItems, storageKey]);

  // Un-check a section if its answers changed after it was checked (or a copied answer was edited)
  useEffect(() => {
    if (!hydrated) return;
    const sigs = new Map(sectionData.map((sec) => [sec.idx, sec.sig]));
    const staleSections = [...confirmed].filter((i) => confirmedSigs.current.get(i) !== sigs.get(i));
    if (staleSections.length > 0) {
      staleSections.forEach((i) => confirmedSigs.current.delete(i));
      setConfirmed((prev) => {
        const n = new Set(prev);
        staleSections.forEach((i) => n.delete(i));
        return n;
      });
    }
    const stillCarried = new Set(carriedItems.map((c) => c.field.key));
    const staleCorrect = [...stillCorrect].filter((k) => !stillCarried.has(k));
    if (staleCorrect.length > 0) {
      setStillCorrect((prev) => {
        const n = new Set(prev);
        staleCorrect.forEach((k) => n.delete(k));
        return n;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, sectionData, carriedItems]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      const sections: Record<string, string> = {};
      confirmed.forEach((i) => {
        const sig = confirmedSigs.current.get(i);
        if (sig) sections[String(i)] = sig;
      });
      const correct: Record<string, string> = {};
      carriedItems.forEach((c) => {
        if (stillCorrect.has(c.field.key)) correct[c.field.key] = hashString(c.value);
      });
      if (Object.keys(sections).length === 0 && Object.keys(correct).length === 0) {
        window.localStorage.removeItem(storageKey);
      } else {
        const payload: SavedProgress = { savedAt: Date.now(), sections, correct };
        window.localStorage.setItem(storageKey, JSON.stringify(payload));
      }
    } catch {
      /* storage unavailable: progress just won't be remembered */
    }
  }, [hydrated, confirmed, stillCorrect, carriedItems, storageKey]);

  const carriedResolved = carriedItems.filter((c) => stillCorrect.has(c.field.key)).length;
  const carriedLeft = carriedItems.length - carriedResolved;
  const allCarriedResolved = carriedItems.length === 0 || carriedResolved === carriedItems.length;
  const confirmedCount = sectionData.filter((s) => confirmed.has(s.idx)).length;
  const sectionsLeft = sectionData.length - confirmedCount;
  const allSectionsConfirmed = sectionData.length > 0 && confirmedCount === sectionData.length;
  const unlocked = allCarriedResolved && allSectionsConfirmed;
  const exportBusy = isPreviewing || isDownloading || isSavingToVault;
  const progressPercent = sectionData.length ? Math.round((confirmedCount / sectionData.length) * 100) : 0;
  const totalRequiredBlank = sectionData.reduce((n, s) => n + s.requiredBlank, 0);

  /* Header message: changes with where the person is */
  const baseMessage = (() => {
    if (unlocked) return "You're all set. Preview your PDF, download it, or save it to your vault.";
    const blankNote =
      totalRequiredBlank > 0
        ? ` ${totalRequiredBlank} ${plural(totalRequiredBlank, "question is", "questions are")} still blank.`
        : "";
    if (carriedLeft > 0) {
      return `Some answers were copied from ${prefilledFromName}. Please make sure they're right for ${candidateName}, then go through each section.${blankNote}`;
    }
    if (allSectionsConfirmed) {
      return "Every section is checked. One more look at the answers copied over, and you're done.";
    }
    if (confirmedCount === 0) {
      return `Go through each section. When it's correct, tap "Looks right".${blankNote}`;
    }
    return `Nice work. ${sectionsLeft} ${plural(sectionsLeft, "section", "sections")} to go.${blankNote}`;
  })();
  const headerMessage = restored && !unlocked ? `Welcome back. We kept your progress. ${baseMessage}` : baseMessage;

  /* Tapping a locked export button says what's missing and takes the person there */
  const showLockedHint = () => {
    let hint: string;
    if (carriedLeft > 0) {
      hint = `Confirm the ${carriedLeft} copied ${plural(carriedLeft, "answer", "answers")} at the top first.`;
      document.getElementById("review-carried")?.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      const next = sectionData.find((s) => !confirmed.has(s.idx));
      if (!next) return;
      hint = `Check "${next.title}" first. ${sectionsLeft} ${plural(sectionsLeft, "section", "sections")} left.`;
      setAllOpen(false);
      setOpenIdx(next.idx);
      scrollToSection(next.idx);
    }
    setLockedHint(hint);
    if (hintTimer.current) clearTimeout(hintTimer.current);
    hintTimer.current = setTimeout(() => setLockedHint(null), 6000);
  };

  const guarded = (action?: () => void) => () => {
    if (!unlocked) {
      showLockedHint();
      return;
    }
    action?.();
  };

  const toggleStillCorrect = (key: string) => {
    setRestored(false);
    setStillCorrect((prev) => {
      const n = new Set(prev);
      if (n.has(key)) n.delete(key);
      else n.add(key);
      return n;
    });
  };

  const markAllCarried = () => {
    setRestored(false);
    setStillCorrect(allCarriedResolved ? new Set() : new Set(carriedItems.map((c) => c.field.key)));
  };

  const scrollToSection = (idx: number) => {
    setTimeout(() => {
      document.getElementById(`review-sec-${idx}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 60);
  };

  // First open section: the first beneficiary section when we know what was carried over, else the first one
  const firstUnchecked = sectionData.find((s) => !confirmed.has(s.idx))?.idx;
  const defaultOpenIdx =
    confirmed.size > 0
      ? firstUnchecked ?? null
      : (prefilledFromName ? sectionData.find((s) => s.hasPerson)?.idx : undefined) ?? sectionData[0]?.idx ?? null;
  const currentOpen = openIdx === undefined ? defaultOpenIdx : openIdx;

  const toggleOpen = (idx: number) => {
    setAllOpen(false);
    setOpenIdx(currentOpen === idx ? null : idx);
  };

  const confirmSection = (idx: number) => {
    setRestored(false);
    confirmedSigs.current.set(idx, sectionData.find((s) => s.idx === idx)?.sig ?? "");
    const next = new Set(confirmed);
    next.add(idx);
    setConfirmed(next);
    const after = sectionData.find((s) => s.idx > idx && !next.has(s.idx));
    const any = after ?? sectionData.find((s) => !next.has(s.idx));
    setAllOpen(false);
    setOpenIdx(any ? any.idx : null);
    if (any) scrollToSection(any.idx);
  };

  const undoConfirm = (idx: number) => {
    setRestored(false);
    confirmedSigs.current.delete(idx);
    setConfirmed((prev) => {
      const n = new Set(prev);
      n.delete(idx);
      return n;
    });
  };

  return (
    <div className="w-full pb-4 max-w-3xl mx-auto">
      {/* Free preview banner (teal: amber is reserved for blanks) */}
      {isFreePreview && (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-teal-200 bg-[#e8f6f6] px-4 py-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <Lock size={15} className="text-[#0d7377] shrink-0" />
            <p className="text-[13px] text-slate-800">
              <span className="font-bold">Demo mode.</span> Fill up to {freePreviewLimit} questions and preview the first
              page of your PDF.
            </p>
          </div>
          <button
            onClick={onUpgradeClick}
            className="px-3 py-1.5 rounded-lg bg-[#0d7377] hover:bg-[#0a5c5f] text-white text-[13px] font-bold shrink-0 cursor-pointer"
          >
            Unlock full PDF
          </button>
        </div>
      )}

      {/* Header card: title, who it's for, a message for where you are, progress */}
      <div className="mb-4 flex gap-3.5 rounded-2xl border border-teal-200 bg-gradient-to-br from-[#e8f6f6] to-white p-4">
        <span
          className="hidden sm:flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white"
          style={{ background: TEAL }}
        >
          {unlocked ? <Check className="h-5 w-5" strokeWidth={2.5} /> : <ClipboardCheck className="h-5 w-5" />}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {unlocked ? "You're all set" : "Check your answers"}
            </h1>
            {activeCandidate && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                <User className="w-3 h-3" />
                {candidateName}
              </span>
            )}
          </div>
          <p className="mt-1 text-[13.5px] leading-relaxed text-slate-600">{headerMessage}</p>

          <div
            className="mt-3 h-[6px] rounded-full overflow-hidden"
            style={{ background: "rgba(13,115,119,0.15)" }}
            role="progressbar"
            aria-valuenow={progressPercent}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%`, background: `linear-gradient(90deg, ${TEAL}, ${TEAL_GLOW})` }}
            />
          </div>
          <p className="mt-1.5 text-[12.5px] font-semibold text-[#0d7377]">
            {confirmedCount} of {sectionData.length} sections checked
          </p>
        </div>
      </div>

      {/* Carried-over answers (blue: about the beneficiary) */}
      {carriedItems.length > 0 && (
        <div id="review-carried" className="mb-4 scroll-mt-4 rounded-2xl border border-blue-200 bg-white overflow-hidden shadow-sm">
          <div className="px-3.5 py-3 bg-blue-50 border-b border-blue-200">
            <div className="flex items-center justify-between gap-3">
              <h2 className="inline-flex items-center gap-1.5 text-[15px] font-bold text-blue-950">
                <RefreshCw className="w-4 h-4" />
                Check these first
              </h2>
              {carriedItems.length > 4 && (
                <button
                  type="button"
                  onClick={markAllCarried}
                  className="text-[13px] font-semibold text-blue-800 hover:underline cursor-pointer"
                >
                  {allCarriedResolved ? "Clear all" : "Mark all correct"}
                </button>
              )}
            </div>
            <p className="mt-1 text-[14px] leading-snug text-slate-900">
              These were copied from <span className="font-bold">{prefilledFromName}</span>. Make sure they are right
              for <span className="font-bold">{candidateName}</span>, not left over from someone else.
            </p>
          </div>

          {allCarriedResolved && (
            <p className="flex items-center gap-1.5 px-3.5 py-2 text-[12.5px] font-semibold text-[#0d7377] bg-[#e8f6f6] border-b border-teal-100">
              <Check className="w-3.5 h-3.5" strokeWidth={3} />
              All copied answers confirmed for {candidateName}.
            </p>
          )}

          <ul className="divide-y divide-slate-200">
            {carriedItems.map(({ field, stepNum, value }) => {
              const ok = stillCorrect.has(field.key);
              return (
                <li
                  key={field.key}
                  className={`flex items-center gap-2 px-3.5 py-2 transition-colors ${ok ? "bg-[#e8f6f6]" : "bg-white"}`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium text-slate-700 leading-snug">{field.label}</p>
                    <p className="text-sm font-semibold text-slate-900 break-words leading-snug">{value}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleStillCorrect(field.key)}
                    aria-label={ok ? "Marked correct" : "Mark as correct"}
                    aria-pressed={ok}
                    className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border transition-colors cursor-pointer ${
                      ok
                        ? "bg-[#0d7377] border-[#0d7377] text-white"
                        : "bg-white border-slate-300 text-slate-500 hover:bg-slate-100"
                    }`}
                  >
                    <Check className="w-4 h-4" strokeWidth={2.5} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onEditStep(stepNum)}
                    aria-label={`Change ${field.label}`}
                    className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border border-slate-300 bg-white text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Sections */}
      <div className="flex items-center justify-between px-0.5 mb-1.5 text-[12.5px] text-slate-500">
        <span>{sectionData.length} sections</span>
        <button
          type="button"
          onClick={() => setAllOpen((v) => !v)}
          className="font-semibold text-[#0d7377] hover:underline cursor-pointer"
        >
          {allOpen ? "Collapse all" : "Expand all"}
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden divide-y divide-slate-100 shadow-sm">
        {sectionData.map(({ idx, title, rows, total, answered, requiredBlank, hasPerson }, pos) => {
          const open = allOpen || currentOpen === idx;
          const done = confirmed.has(idx);
          const isLastToCheck = !done && sectionData.every((s) => s.idx === idx || confirmed.has(s.idx));

          return (
            <div key={`sec-${idx}`} id={`review-sec-${idx}`} className="scroll-mt-4">
              <button
                type="button"
                onClick={() => toggleOpen(idx)}
                aria-expanded={open}
                className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors cursor-pointer ${
                  open ? "" : "bg-white hover:bg-slate-50"
                }`}
                style={
                  open
                    ? {
                        background: hasPerson
                          ? "linear-gradient(90deg, #eff6ff 0%, #f8fbff 50%, #ffffff 100%)"
                          : `linear-gradient(90deg, ${TEAL_TINT} 0%, #f5fbfb 50%, #ffffff 100%)`,
                      }
                    : undefined
                }
              >
                <span
                  className={`w-7 h-7 rounded-full text-xs font-semibold flex items-center justify-center shrink-0 transition-shadow ${
                    done
                      ? "bg-[#0d7377] text-white"
                      : open && hasPerson
                      ? "bg-blue-500 text-white ring-4 ring-blue-500/15"
                      : open
                      ? "bg-[#0d7377] text-white ring-4 ring-[#0d7377]/15"
                      : hasPerson
                      ? "bg-blue-100 text-blue-700"
                      : "bg-[#e8f6f6] text-[#0d7377]"
                  }`}
                >
                  {done ? <Check className="w-3.5 h-3.5" strokeWidth={3} /> : pos + 1}
                </span>

                <span className="min-w-0 flex-1 flex items-center gap-2 flex-wrap">
                  <span className="text-[14.5px] font-semibold text-slate-900">{title}</span>
                  {hasPerson && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                      <User className="w-3 h-3" />
                      About {candidateName}
                    </span>
                  )}
                  <span className="text-xs text-slate-500 whitespace-nowrap">
                    {answered} of {total}
                  </span>
                </span>

                {done ? (
                  <span className="rounded-full bg-[#e8f6f6] px-2.5 py-0.5 text-[11.5px] font-semibold text-[#0d7377]">
                    Checked
                  </span>
                ) : requiredBlank > 0 ? (
                  <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11.5px] font-semibold text-amber-800">
                    {requiredBlank} blank
                  </span>
                ) : null}

                <ChevronDown
                  className={`w-4 h-4 shrink-0 transition-transform ${
                    open ? `rotate-180 ${hasPerson ? "text-blue-500" : "text-[#0d7377]"}` : "text-slate-400"
                  }`}
                />
              </button>

              {open && (
                <div className="border-t border-slate-200">
                  {/* Note for this section: changes with its state */}
                  {requiredBlank > 0 ? (
                    <p className="px-4 py-2.5 text-[13px] text-slate-600 bg-[#e8f6f6]/60 border-b border-teal-100">
                      <span className="font-semibold text-slate-800">
                        {requiredBlank} {plural(requiredBlank, "question is", "questions are")} blank.
                      </span>{" "}
                      Tap Add answer to fill {plural(requiredBlank, "it", "them")} in, or continue if{" "}
                      {plural(requiredBlank, "it doesn't", "they don't")} apply to you.
                    </p>
                  ) : done ? (
                    <p className="flex items-center gap-2 px-4 py-2.5 text-[13px] text-[#0d7377] bg-[#e8f6f6] border-b border-teal-100">
                      <Check className="w-4 h-4 shrink-0" strokeWidth={2.5} />
                      <span>
                        <span className="font-semibold">Checked.</span> You can still edit this section.
                      </span>
                    </p>
                  ) : (
                    <p className="px-4 py-2.5 text-[13px] text-slate-600 bg-[#e8f6f6]/60 border-b border-teal-100">
                      {hasPerson
                        ? `Everything here is filled in. Check it's right for ${candidateName}, then tap Looks right.`
                        : "Everything here is filled in. Take a look, then tap Looks right."}
                    </p>
                  )}

                  <dl className="divide-y divide-slate-200">
                    {rows.map((row, ri) => {
                      if (row.kind === "heading") {
                        return (
                          <div
                            key={`${row.key}-${ri}`}
                            className="px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-[#0d7377] bg-[#e8f6f6]/70"
                          >
                            {row.label}
                          </div>
                        );
                      }
                      const f = row.field;
                      const has = isFieldAnswered(f, formData);
                      const optional = isOptionalField(f);
                      const edited = isEdited(f);
                      const nested = row.depth > 0;
                      // Questions are mid slate, answers are near-black bold, so the two never blend together
                      const qColor = nested ? "text-slate-600" : "text-slate-700";

                      return (
                        <div
                          key={`${row.key}-${ri}`}
                          className="pr-4 bg-white"
                          style={{ paddingLeft: 16 + (nested ? row.depth * 20 : 0) }}
                        >
                          <div
                            className={`flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1.5 sm:gap-6 ${
                              nested ? "py-2.5" : "py-3.5"
                            }`}
                          >
                            <dt
                              className={`leading-snug flex items-start gap-1.5 sm:max-w-[60%] ${qColor} ${
                                nested ? "text-[13px] font-medium" : "text-[14px] font-medium"
                              }`}
                            >
                              {nested && <CornerDownRight className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-px" />}
                              {f.label}
                            </dt>
                            <dd className="text-[15px] sm:text-right break-words sm:max-w-[38%] shrink-0">
                              {has ? (
                                <>
                                  {edited && (
                                    <span className="mr-2 inline-block rounded-full bg-[#e8f6f6] px-2 py-0.5 align-middle text-[11px] font-semibold text-[#0d7377]">
                                      Edited
                                    </span>
                                  )}
                                  <span className="font-bold text-slate-950">{getDisplayValue(f, formData)}</span>
                                </>
                              ) : optional ? (
                                <span className="text-slate-400">—</span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => onEditStep(idx + 1)}
                                  className="rounded-full border border-amber-300 bg-white px-3 py-1 text-xs font-semibold text-amber-800 hover:bg-amber-100 cursor-pointer"
                                >
                                  Add answer
                                </button>
                              )}
                            </dd>
                          </div>
                        </div>
                      );
                    })}
                  </dl>

                  <div className="flex items-center justify-between gap-3 px-4 py-3 bg-slate-50/80 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => onEditStep(idx + 1)}
                      className="inline-flex items-center gap-1.5 h-8 text-[13px] font-semibold text-slate-600 hover:text-[#0d7377] cursor-pointer"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Edit
                    </button>

                    {done ? (
                      <button
                        type="button"
                        onClick={() => undoConfirm(idx)}
                        className="h-8 text-[13px] font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
                      >
                        Undo
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => confirmSection(idx)}
                        className="h-9 px-5 rounded-xl text-[13px] font-semibold text-white bg-[#0d7377] hover:bg-[#0a5c5f] shadow-sm shadow-[#0d7377]/25 transition-colors cursor-pointer"
                      >
                        {requiredBlank > 0
                          ? `Continue with ${requiredBlank} blank`
                          : isLastToCheck
                          ? "Looks right, finish"
                          : "Looks right, next →"}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* You're all set */}
      {unlocked && (
        <div className="mt-4 flex items-start gap-3 rounded-2xl border border-teal-200 bg-[#e8f6f6] px-4 py-3.5">
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white"
            style={{ background: TEAL }}
          >
            <Check className="h-4 w-4" strokeWidth={3} />
          </span>
          <div>
            <p className="text-[15px] font-bold text-slate-900">You're all set</p>
            <p className="mt-0.5 text-[13px] text-slate-600">
              Every section is checked{totalRequiredBlank > 0 ? ", and the blanks are ones you chose to skip" : ""}. Use
              the buttons below to preview your PDF, download it, or save it to your vault.
            </p>
          </div>
        </div>
      )}

      {/* Sticky bottom bar */}
      <div
        className="sticky bottom-0 -mx-3 mt-6 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur-md md:-mx-6 md:px-6 z-30"
        style={{ boxShadow: "0 -4px 20px rgba(0,0,0,0.05)" }}
      >
        <div className="flex items-center gap-2 flex-wrap max-w-3xl mx-auto">
          <p
            role="status"
            aria-live="polite"
            className={`flex-1 min-w-[160px] text-[12.5px] font-semibold ${
              unlocked ? "text-[#0d7377]" : lockedHint ? "text-slate-900" : "text-slate-500"
            }`}
          >
            {unlocked
              ? "You're all set. Ready to export."
              : lockedHint
              ? lockedHint
              : sectionsLeft > 0
              ? `${sectionsLeft} ${plural(sectionsLeft, "section", "sections")} left to check before you can download.`
              : `Confirm the ${carriedLeft} copied ${plural(carriedLeft, "answer", "answers")} above to continue.`}
          </p>

          <button
            onClick={onBackToForm}
            className="inline-flex items-center gap-1.5 h-[34px] px-3 rounded-[9px] text-[13px] font-semibold text-slate-500 hover:bg-slate-100 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          <button
            onClick={guarded(onPreviewPDF)}
            disabled={exportBusy}
            aria-disabled={!unlocked}
            className={`inline-flex items-center gap-1.5 h-[34px] px-3.5 rounded-[9px] text-[13px] font-semibold text-[#0d7377] bg-white border border-[#0d7377] hover:bg-[#e8f6f6] disabled:opacity-40 disabled:cursor-not-allowed ${
              unlocked ? "cursor-pointer" : "opacity-40 cursor-not-allowed"
            }`}
          >
            <Eye className="h-4 w-4" />
            {isPreviewing ? "Previewing..." : isFreePreview ? "Preview page 1" : "Preview"}
          </button>

          <button
            onClick={guarded(onDownloadPDF)}
            disabled={exportBusy}
            aria-disabled={!unlocked}
            className={`inline-flex items-center gap-1.5 h-[34px] px-3.5 rounded-[9px] text-[13px] font-semibold text-white bg-slate-800 hover:bg-slate-900 disabled:opacity-40 disabled:cursor-not-allowed ${
              unlocked ? "cursor-pointer" : "opacity-40 cursor-not-allowed"
            }`}
          >
            <Download className="h-4 w-4" />
            {isDownloading ? "Downloading..." : isFreePreview ? "Download page 1" : "Download"}
          </button>

          <button
            onClick={isFreePreview ? onUpgradeClick : guarded(onSaveToVault)}
            disabled={!isFreePreview && exportBusy}
            aria-disabled={!unlocked && !isFreePreview}
            className={`inline-flex items-center gap-1.5 h-[34px] px-3.5 rounded-[9px] text-[13px] font-semibold text-white bg-[#0d7377] hover:bg-[#0a5c5f] disabled:opacity-40 disabled:cursor-not-allowed ${
              unlocked || isFreePreview ? "cursor-pointer" : "opacity-40 cursor-not-allowed"
            }`}
          >
            {isFreePreview ? <Lock className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            {isFreePreview ? "Unlock save to vault" : isSavingToVault ? "Saving..." : "Save to vault"}
          </button>
        </div>

        <div className="mt-2 flex items-center justify-center gap-1 text-[10.5px] font-semibold text-slate-500">
          <Lock className="h-3 w-3 shrink-0 text-[#0d7377]" />
          <span>{t("documentVaultPage.components.uploadModal.securityNotice")}</span>
        </div>
      </div>
    </div>
  );
}