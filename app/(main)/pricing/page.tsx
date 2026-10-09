"use client";

import React, { useEffect, useRef, useState, useMemo, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import CheckoutButton from "@/app/components/payment/CheckoutButton";
import Link from "next/link";
import {
  // Brain, // unused — Case Strength Analyzer commented out
  LifeBuoy,
  MessageSquare,
  Zap,
  Camera,
  Wand2,
  Calculator,
  FileSearch,
  Users,
  FileUp,
  UserCheck,
  Globe,
  Stethoscope,
  ShieldCheck,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  ShoppingCart,
  X,
  AlertTriangle,
  CheckCircle2,
  Minus,
  Plus,
  Heart,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { E, msg, errorCode } from "@/lib/errors";
import { VISA_CATEGORIES, HELPER_DATA, COMPARISON_GROUPS, ADDONS, FAQS } from "./data/pricing";
import type { PlanData } from "./data/pricing";
import ResourceToolCard from "@/components/pricing/ResourceToolCard";
import { ExplorerJourneyCard } from "@/app/(tools)/(visa)/visa-category/components/journey-explorer-card";
import {
  EXPLORER_CARDS,
  type ExplorerJourneyCard as ExplorerJourneyCardType,
} from "@/app/(tools)/(visa)/visa-category/data/journeys";
import { useToast } from "@/app/components/shared/ToastProvider";
import { useCandidate } from "@/app/context/CandidateContext";

/* ===========================================================================
   TIER VISUAL CONFIG
   =========================================================================== */
const TIER = {
  basic: {
    cardBg: "bg-gradient-to-br from-[#e8f5f1] to-[#cce9df]",
    border: "border-[#92ccbc]",
    selBorder: "border-[#0d7a5c]",
    textAccent: "text-[#0d7a5c]",
    badgeBg: "bg-[#aed9ca]",
    badgeText: "text-[#065e42]",
    checkCol: "text-[#0d7a5c]",
    btn: "bg-[#0d7a5c] hover:bg-[#0a6048] text-white",
    btnOut: "border border-[#92ccbc] text-[#0d7a5c] hover:bg-[#aed9ca]/50 bg-transparent",
    ring: "ring-2 ring-[#0d7a5c]/20",
    glow: "[box-shadow:0_16px_52px_rgba(13,122,92,0.15)]",
  },
  premium: {
    cardBg: "bg-gradient-to-br from-[#ede8f8] to-[#d9d0f2]",
    border: "border-[#b5a5e3]",
    selBorder: "border-[#5c2db8]",
    textAccent: "text-[#5c2db8]",
    badgeBg: "bg-[#c4b6ed]",
    badgeText: "text-[#471e9c]",
    checkCol: "text-[#5c2db8]",
    btn: "bg-[#5c2db8] hover:bg-[#4b22a3] text-white",
    btnOut: "border border-[#b5a5e3] text-[#5c2db8] hover:bg-[#c4b6ed]/50 bg-transparent",
    ring: "ring-2 ring-[#5c2db8]/20",
    glow: "[box-shadow:0_16px_52px_rgba(92,45,184,0.15)]",
  },
  executive: {
    cardBg: "bg-gradient-to-br from-[#fdf4e2] to-[#f1dea8]",
    border: "border-[#d9ba6e]",
    selBorder: "border-[#b45309]",
    textAccent: "text-[#b45309]",
    badgeBg: "bg-[#e8c96c]",
    badgeText: "text-[#8a3f07]",
    checkCol: "text-[#b45309]",
    btn: "bg-[#b45309] hover:bg-[#9c4808] text-white",
    btnOut: "border border-[#d9ba6e] text-[#b45309] hover:bg-[#e8c96c]/50 bg-transparent",
    ring: "ring-2 ring-[#b45309]/20",
    glow: "[box-shadow:0_16px_52px_rgba(180,83,9,0.15)]",
  },
};
type TierKey = keyof typeof TIER;

/* ===========================================================================
   VISA CATEGORY AVAILABILITY
   ===========================================================================
   Only categories listed here are selectable in the UI, even though more
   exist in VISA_CATEGORIES (data/pricing.ts). Add an id here once that
   journey's content/roadmap is actually ready for users to pick. */
const AVAILABLE_VISA_IDS: string[] = ["IR-1 / CR-1", "IR-5"];

/* ===========================================================================
   ADDON CONFIG — icons + colors matching resources page system
   =========================================================================== */
type AddonConfigEntry = {
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
};

const ADDON_CONFIG: Record<string, AddonConfigEntry> = {
  "221g": { icon: LifeBuoy, iconBg: "bg-violet-600 dark:bg-violet-500" },
  // Temporarily hidden — Case Strength Analyzer commented out.
  // "case-strength": { icon: Brain, iconBg: "bg-violet-600 dark:bg-violet-500" },
  "interview-prep": { icon: MessageSquare, iconBg: "bg-indigo-600 dark:bg-indigo-500" },
  photo: { icon: Camera, iconBg: "bg-rose-600 dark:bg-rose-500" },
  smart: { icon: Wand2, iconBg: "bg-cyan-600 dark:bg-cyan-500" },
  sponsor: { icon: Calculator, iconBg: "bg-emerald-600 dark:bg-emerald-500" },
  "doc-review": { icon: FileSearch, iconBg: "bg-amber-600 dark:bg-amber-500" },
  consultation: { icon: Users, iconBg: "bg-indigo-600 dark:bg-indigo-500" },
  translate: { icon: FileUp, iconBg: "bg-amber-600 dark:bg-amber-500" },
  medical: { icon: Stethoscope, iconBg: "bg-rose-600 dark:bg-rose-500" },
  pcc: { icon: ShieldCheck, iconBg: "bg-emerald-600 dark:bg-emerald-500" },
  "case-manager": {
    icon: UserCheck,
    iconBg: "bg-indigo-600 dark:bg-indigo-500",
  },
  "civil-guid": { icon: Globe, iconBg: "bg-green-600 dark:bg-green-500" },
};

/* ===========================================================================
   RESOURCE TABS + PLAN RECOMMENDATIONS
   ===========================================================================
   The à la carte resources are split into three top-level tabs by add-on
   `kind` (tools | services | guides), mirroring the /resources page. */
type ResourceMode = "tools" | "services" | "guides";

// sessionStorage key for the persisted add-on cart — survives navigation to a
// tool/service/guide detail page and back. Cleared after a successful checkout.
const CART_STORAGE_KEY = "rahvana_pricing_cart_addons";

type ResourceTabInfo = { label: string; sub: string; heading: string; blurb: string };

const RESOURCE_TABS: Record<ResourceMode, ResourceTabInfo> = {
  tools: {
    label: "Tools",
    sub: "Self-serve tools",
    heading: "Buy individual tools",
    blurb: "Self-serve tools you can use right away, no full journey plan required.",
  },
  services: {
    label: "Services",
    sub: "Expert help",
    heading: "Expert services",
    blurb: "Human-delivered help when you want a specialist on your case.",
  },
  guides: {
    label: "Guides",
    sub: "Step-by-step guides",
    heading: "Document guides",
    blurb: "Country-specific, step-by-step guides for obtaining each required document.",
  },
};

const PLAN_RECS: Record<string, string[]> = {
  // "case-strength" temporarily hidden — Case Strength Analyzer commented out.
  basic: ["smart", "sponsor", "interview-prep", "civil-guid"],
  premium: ["interview-prep", "doc-review", "consultation", "221g"],
  executive: ["case-manager", "consultation", "translate"],
};

const INTERVIEW_PREP_ADDON_PREFIX = "interview-prep:";

const VISA_TO_INTERVIEW_CATEGORY: Record<string, string> = {
  "IR-1 / CR-1": "ir-1-spouse",
  "IR-5": "ir-5-parent",
};

const getCatalogAddonId = (addonId: string): string => {
  const normalized = addonId.toLowerCase();

  if (normalized.startsWith(INTERVIEW_PREP_ADDON_PREFIX)) {
    return "interview-prep";
  }

  return normalized;
};

const resolveCheckoutAddonId = (addonId: string, interviewCategory: string | null): string => {
  const normalized = addonId.toLowerCase();

  if (normalized.startsWith(INTERVIEW_PREP_ADDON_PREFIX)) {
    return normalized;
  }

  if (normalized === "interview-prep" && interviewCategory) {
    return `${INTERVIEW_PREP_ADDON_PREFIX}${interviewCategory}`;
  }

  return normalized;
};

const mergeAddonSelections = (current: Set<string>, incoming: string[]): Set<string> => {
  const next = new Set(current);

  for (const incomingId of incoming) {
    const catalogId = getCatalogAddonId(incomingId);

    // Remove an existing generic/category-specific variant of the same catalog product.
    for (const existingId of Array.from(next)) {
      if (getCatalogAddonId(existingId) === catalogId) {
        next.delete(existingId);
      }
    }

    next.add(incomingId);
  }

  return next;
};

/* ===========================================================================
   SVG HELPERS
   =========================================================================== */
function IconCheck({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      className={className}
      style={style}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 10l4 4 8-8" />
    </svg>
  );
}

function IconX({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={className}
      style={style}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 5L5 15M5 5l10 10" />
    </svg>
  );
}
function IcoChevron({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={className}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m5 7 5 6 5-6" />
    </svg>
  );
}
function IcoTableCompare({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={className}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="4" width="6" height="12" rx="1" />
      <rect x="12" y="4" width="6" height="12" rx="1" />
    </svg>
  );
}
function IcoInfo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className={className}
      strokeLinecap="round"
    >
      <circle cx="8" cy="8" r="6.5" />
      <line x1="8" y1="7" x2="8" y2="10.5" />
      <circle cx="8" cy="5.5" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

/* ===========================================================================
   COMPARISON CELL
   =========================================================================== */
function ComparisonCell({ value, planId }: { value: string; planId?: string }) {
  const v = value.trim();
  const tc = planId && planId in TIER ? TIER[planId as TierKey] : null;
  const checkColor = tc ? tc.checkCol : "text-primary";

  if (v === "Included" || v === "Unlimited") {
    return <IconCheck className={`${checkColor} mx-auto h-4 w-4 shrink-0 sm:h-5 sm:w-5`} />;
  }
  if (v === "Not Included") {
    return <IconX className="mx-auto h-4 w-4 shrink-0 text-red-500 sm:h-5 sm:w-5" />;
  }
  if (v === "") {
    return (
      <span className="text-muted-foreground/30 block text-center text-base leading-none font-bold select-none sm:text-xl">
        —
      </span>
    );
  }
  if (/included/i.test(v) && v !== "Included") {
    return (
      <span
        className={`mx-auto inline-flex items-center justify-center gap-0.5 rounded-full border px-1.5 py-0.5 text-[9.5px] leading-tight font-bold sm:gap-1 sm:px-2.5 sm:py-1 sm:text-[11px] ${
          tc
            ? `${tc.badgeBg} ${tc.badgeText} border-transparent`
            : "bg-primary/10 text-primary border-primary/20"
        }`}
      >
        <IconCheck className={`h-2.5 w-2.5 shrink-0 sm:h-3 sm:w-3 ${tc ? tc.checkCol : ""}`} /> {v}
      </span>
    );
  }
  if (/add on/i.test(v)) {
    return (
      <span className="mx-auto inline-flex items-center justify-center rounded-full border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[9.5px] leading-tight font-bold text-amber-700 sm:px-2.5 sm:py-1 sm:text-[10.5px] dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-400">
        {v}
      </span>
    );
  }
  return (
    <span className="bg-muted text-muted-foreground border-border inline-block rounded-full border px-1.5 py-0.5 text-[9.5px] leading-tight font-bold sm:px-2.5 sm:py-1 sm:text-[11px]">
      {v}
    </span>
  );
}

/* ===========================================================================
   COMPARE MODAL
   =========================================================================== */
function CompareModal({
  isOpen,
  onClose,
  activePlans,
  planDisplayPrice,
  onSelectPlan,
}: {
  isOpen: boolean;
  onClose: () => void;
  activePlans: PlanData[];
  planDisplayPrice: (p: PlanData) => number;
  onSelectPlan: (id: string) => void;
}) {
  const [differencesOnly, setDifferencesOnly] = useState(false);
  const paidPlans = activePlans.filter((p) => p.id !== "free");

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="animate-in fade-in fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 px-3 py-5 backdrop-blur-sm duration-150 sm:p-6 md:p-10"
      onClick={onClose}
    >
      <div
        className="bg-card border-border animate-in zoom-in-95 flex h-auto max-h-[86vh] w-full max-w-[960px] flex-col overflow-hidden rounded-[20px] border shadow-2xl duration-200 sm:max-h-[calc(100vh-48px)] sm:rounded-[28px] md:max-h-[calc(100vh-80px)]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cmp-title"
      >
        {/* Header */}
        <div className="border-border from-muted/30 flex shrink-0 items-start justify-between gap-3 border-b bg-gradient-to-b to-transparent px-4 py-3.5 sm:items-center sm:px-6 sm:py-5">
          <div>
            <h2
              id="cmp-title"
              className="text-foreground m-0 text-[16px] leading-tight font-bold sm:text-[20px]"
            >
              Compare Rahvana plans
            </h2>
            <p className="text-muted-foreground m-0 mt-0.5 text-[11.5px] sm:text-[13px]">
              See exactly what&apos;s included in Basic, Premium, and Executive.
            </p>
          </div>
          <button
            onClick={onClose}
            className="border-border bg-card hover:bg-muted/60 mt-0.5 shrink-0 cursor-pointer rounded-full border p-1.5 transition-colors sm:mt-0 sm:p-[7px]"
            aria-label="Close"
          >
            <IconX className="h-4 w-4 sm:h-[15px] sm:w-[15px]" />
          </button>
        </div>

        {/* Scrollable area — unified container for headers, table rows, and CTAs */}
        <div className="scrollbar-premium bg-card flex-1 overflow-x-hidden overflow-y-auto">
          <div className="flex min-h-full w-full flex-col">
            {/* Sticky plan headers bar */}
            <div className="bg-card/95 border-border sticky top-0 z-20 shrink-0 border-b px-3 py-2.5 shadow-xs backdrop-blur-md sm:px-6 sm:py-3">
              {/* Mobile controls bar (Differences switch) */}
              <div className="border-border/40 mb-2 flex items-center justify-between gap-2 border-b pb-2 sm:hidden">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={differencesOnly}
                    onClick={() => setDifferencesOnly(!differencesOnly)}
                    className={`ring-offset-background relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none ${
                      differencesOnly ? "bg-primary" : "bg-muted"
                    }`}
                  >
                    <span className="sr-only">Differences only</span>
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ${
                        differencesOnly ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                  <span className="text-muted-foreground text-[11.5px] leading-tight font-medium select-none">
                    Show differences only
                  </span>
                </div>
              </div>

              {/* Plan headers grid */}
              <div className="grid grid-cols-3 items-center gap-1.5 sm:grid-cols-[minmax(140px,180px)_repeat(3,minmax(0,1fr))] sm:gap-3">
                {/* Desktop switch column */}
                <div className="hidden items-center gap-2 sm:flex sm:gap-3">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={differencesOnly}
                    onClick={() => setDifferencesOnly(!differencesOnly)}
                    className={`ring-offset-background focus-visible:ring-ring relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none ${
                      differencesOnly ? "bg-primary" : "bg-muted"
                    }`}
                  >
                    <span className="sr-only">Differences only</span>
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ${
                        differencesOnly ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                  <span className="text-muted-foreground text-[11px] leading-tight font-medium select-none sm:text-[12px]">
                    Differences
                    <br />
                    only
                  </span>
                </div>

                {paidPlans.map((plan) => {
                  const tc = TIER[plan.id as TierKey];
                  return (
                    <div
                      key={plan.id}
                      className={`rounded-[12px] border px-1.5 py-1.5 text-center sm:rounded-[16px] sm:px-3 sm:py-2.5 ${tc.border} ${tc.cardBg} ${tc.glow} shadow-sm`}
                    >
                      <div
                        className={`mb-0.5 text-[9px] font-extrabold tracking-wider uppercase sm:text-[10px] sm:tracking-widest ${tc.textAccent}`}
                      >
                        {plan.name}
                      </div>
                      <div className="text-[12px] leading-tight font-bold sm:text-[15px]">
                        ${planDisplayPrice(plan)}
                        <span className="text-muted-foreground ml-0.5 text-[9.5px] font-normal sm:text-[11px]">
                          /mo
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Comparison table groups */}
            <div className="flex-1 pb-2">
              {COMPARISON_GROUPS.map((group, gi) => {
                const rows = differencesOnly
                  ? group.rows.filter((r) => new Set(r.slice(1)).size > 1)
                  : group.rows;
                if (!rows.length) return null;
                return (
                  <div key={gi} className="border-border/50 border-b last:border-0">
                    <div className="bg-muted/30 border-border/30 border-y px-3 py-1.5 sm:px-6 sm:py-2">
                      <span className="text-primary text-[9.5px] font-extrabold tracking-[0.12em] uppercase sm:text-[10.5px]">
                        {group.label}
                      </span>
                    </div>
                    {rows.map((row, ri) => (
                      <div
                        key={ri}
                        className={`border-border/20 border-t ${
                          ri % 2 === 0 ? "bg-card" : "bg-muted/[0.04]"
                        }`}
                      >
                        {/* Mobile view (< sm): label on top, 3 plan values below in 3 columns */}
                        <div className="block px-3 py-2 sm:hidden">
                          <div className="text-foreground mb-1.5 text-[11.5px] leading-snug font-medium">
                            {row[0]}
                          </div>
                          <div className="grid grid-cols-3 items-center gap-1.5">
                            {row.slice(1).map((val, vi) => (
                              <div key={vi} className="flex justify-center text-center">
                                <ComparisonCell value={val} planId={paidPlans[vi]?.id} />
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Desktop view (>= sm): 4-column layout side-by-side */}
                        <div className="hidden grid-cols-[minmax(140px,180px)_repeat(3,minmax(0,1fr))] items-center gap-3 px-6 py-[11px] sm:grid">
                          <span className="text-foreground text-[13px] leading-snug font-medium">
                            {row[0]}
                          </span>
                          {row.slice(1).map((val, vi) => (
                            <div key={vi} className="flex justify-center text-center">
                              <ComparisonCell value={val} planId={paidPlans[vi]?.id} />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Fixed CTA Footer */}
        <div className="border-border bg-card/95 shrink-0 rounded-b-[20px] border-t px-3 py-3.5 backdrop-blur-md sm:rounded-b-[28px] sm:px-8 sm:py-5">
          <p className="text-muted-foreground mb-2.5 text-center text-[10px] font-extrabold tracking-[0.12em] uppercase sm:mb-4 sm:text-[11.5px]">
            Select a plan to get started
          </p>
          <div className="mx-auto grid max-w-[720px] grid-cols-3 gap-1.5 sm:gap-4">
            {paidPlans.map((plan) => {
              const tc = TIER[plan.id as TierKey];
              return (
                <button
                  key={plan.id}
                  className={`group inline-flex w-full cursor-pointer items-center justify-center gap-1 rounded-full px-1.5 py-2 text-center text-[11px] leading-none font-bold shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 min-[380px]:text-[12.5px] sm:gap-2 sm:px-4 sm:py-3 sm:text-[14px] ${tc.btn}`}
                  onClick={() => {
                    onSelectPlan(plan.id);
                    onClose();
                  }}
                >
                  <span>
                    <span className="hidden sm:inline">Choose </span>
                    {plan.name}
                  </span>
                  <span className="shrink-0 text-[12px] leading-none transition-transform duration-150 group-hover:translate-x-0.5 sm:text-[15px]">
                    →
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===========================================================================
   MAIN PRICING CONTENT
   =========================================================================== */
function PricingContent() {
  const searchParams = useSearchParams();

  const [userId, setUserId] = useState<string | null>(null);
  const [journeyTiers, setJourneyTiers] = useState<Record<string, string>>({});
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isProcessingAutoCheckout, setIsProcessingAutoCheckout] = useState(false);
  const [isManualCheckoutLoading, setIsManualCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const isAnyCheckoutLoading = isProcessingAutoCheckout || isManualCheckoutLoading;

  const [mode, setMode] = useState<"plans" | ResourceMode>("plans");
  const [purchaseStep, setPurchaseStep] = useState<"browse" | "review">("browse");

  const [visa, setVisa] = useState<string>(() => {
    if (typeof window === "undefined") {
      return "";
    }

    return localStorage.getItem("rahvana_selected_visa") ?? "";
  });
  // Step control — when a visa was already picked (or restored from storage)
  // the user lands on plan selection; flipping this back to true returns them
  // to journey selection without losing their current pick (it stays visibly
  // highlighted on the journey cards).
  const [isChangingJourney, setIsChangingJourney] = useState(false);
  const billing = "monthly";

  const [selectedPlan, setSelectedPlan] = useState("premium");
  const [selectedAddons, setSelectedAddons] = useState<Set<string>>(new Set());

  const requestedInterviewCategory =
    searchParams.get("interview_category") || VISA_TO_INTERVIEW_CATEGORY[visa] || null;

  const { showToast } = useToast();
  const { candidates } = useCandidate();

  // Multi-parent sponsorship state for IR-5
  const [parentCount, setParentCount] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const pParam = urlParams.get("parents") || urlParams.get("candidate_count");
      if (pParam) {
        const parsed = parseInt(pParam, 10);
        if (!isNaN(parsed) && parsed >= 1) return parsed;
      }
    }
    return 1;
  });
  const [isEligibilityConfirmed, setIsEligibilityConfirmed] = useState<boolean>(true);

  const checkoutAddonIds = useMemo(
    () =>
      Array.from(selectedAddons).map((addonId) =>
        resolveCheckoutAddonId(addonId, requestedInterviewCategory)
      ),
    [selectedAddons, requestedInterviewCategory]
  );

  const isAddonSelected = (catalogAddonId: string) =>
    Array.from(selectedAddons).some(
      (selectedId) => getCatalogAddonId(selectedId) === catalogAddonId
    );

  const [comparePlansOpen, setComparePlansOpen] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number>(-1);
  const [allAddonsOpen, setAllAddonsOpen] = useState(false);
  const [checkoutCanceled, setCheckoutCanceled] = useState(false);

  // Derived
  const isIr5 = Boolean(
    visa && (visa.toUpperCase().includes("IR-5") || visa.toUpperCase().includes("IR5"))
  );
  const isAddingCandidate = searchParams.get("action") === "add_candidate";
  const hasActiveIr5 = Boolean(journeyTiers.ir5 && journeyTiers.ir5 !== "free");
  const parentMultiplier = isIr5 ? parentCount : 1;
  const isIr1Purchased = Boolean(journeyTiers.ir1 && journeyTiers.ir1 !== "free");

  // Auto-switch away from IR-1 if user already has an active purchased plan for it
  useEffect(() => {
    if (isIr1Purchased && (visa.includes("IR-1") || visa.includes("CR-1"))) {
      setVisa("IR-5");
    }
  }, [isIr1Purchased, visa]);

  // Reset eligibility confirmation when switching back to <= 2 parents
  useEffect(() => {
    if (parentCount <= 2) {
      setIsEligibilityConfirmed(true);
    } else {
      setIsEligibilityConfirmed(false);
    }
  }, [parentCount]);

  const activeVisaCategory = useMemo(
    () => VISA_CATEGORIES.find((v) => v.id === visa) || VISA_CATEGORIES[0],
    [visa]
  );
  const selectedJourneyTier = visa.toLowerCase().includes("5")
    ? (journeyTiers.ir5 ?? "free")
    : (journeyTiers.ir1 ?? "free");
  const activePlans = activeVisaCategory.plans;
  const paidPlans = activePlans.filter((p) => p.id !== "free");
  const currentPlanData = activePlans.find((p) => p.id === selectedPlan) || activePlans[2];
  const activeAddons = ADDONS.filter((addon) => isAddonSelected(addon.id));
  const planDisplayPrice = (plan: PlanData) => plan.monthlyPrice * parentMultiplier;
  const summaryBase =
    mode === "plans" && currentPlanData.id !== "free"
      ? currentPlanData.annualPrice * parentMultiplier
      : 0;
  const summaryAddonsTotal = activeAddons.reduce((s, a) => s + a.price, 0);
  const summaryTotal = summaryBase + summaryAddonsTotal;

  const reviewAddons = useMemo(
    () => ADDONS.filter((a) => (PLAN_RECS[selectedPlan] || []).includes(a.id)),
    [selectedPlan]
  );

  const resourcesForMode = useMemo(() => {
    if (mode === "plans") return [];
    return ADDONS.filter((a) => a.kind === mode).sort((a, b) => a.title.localeCompare(b.title));
  }, [mode]);

  useEffect(() => {
    if (visa) {
      localStorage.setItem("rahvana_selected_visa", visa);
    } else {
      localStorage.removeItem("rahvana_selected_visa");
    }
  }, [visa]);

  // Handlers
  const handleCheckout = useCallback(
    async (uid: string, planOverride?: string, addonsOverride?: string[]) => {
      if (isProcessingAutoCheckout) return;
      setIsProcessingAutoCheckout(true);
      setCheckoutError(null);
      try {
        const res = await fetch("/api/stripe/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productTier: planOverride || (mode === "plans" ? selectedPlan : undefined),
            addons: addonsOverride
              ? addonsOverride.map((addonId) =>
                  resolveCheckoutAddonId(addonId, requestedInterviewCategory)
                )
              : checkoutAddonIds,
            visaCategory: visa,
            billing,
            userId: uid,
            candidateCount: isIr5 ? parentCount : 1,
            action: isAddingCandidate || (isIr5 && hasActiveIr5) ? "add_candidate" : undefined,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          // Past-due / payment-recovery case: the server tells us to send the user
          // to the billing portal to fix their existing plan instead of buying a
          // duplicate. Route there rather than showing a dead-end error.
          if (data?.portal) {
            try {
              const portalRes = await fetch("/api/stripe/portal", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: uid }),
              });
              const portalData = await portalRes.json();
              if (portalData?.url) {
                window.location.href = portalData.url;
                return;
              }
            } catch (portalErr) {
              console.error("Portal redirect failed:", portalErr);
            }
          }
          // Prefer the server's specific message (e.g. "you already own", past-due
          // recovery) over the generic fallback.
          setCheckoutError(data?.error || `${msg(E.DASH_CHECKOUT_NO_URL)}`);
          setIsProcessingAutoCheckout(false);
          return;
        }
        if (data.url) window.location.href = data.url;
      } catch (err) {
        console.error("Checkout error:", err);
        setCheckoutError(`${msg(E.DASH_CHECKOUT_NO_URL)}`);
        setIsProcessingAutoCheckout(false);
      }
    },
    [
      selectedPlan,
      checkoutAddonIds,
      requestedInterviewCategory,
      visa,
      billing,
      isIr5,
      parentCount,
      isProcessingAutoCheckout,
      isAddingCandidate,
      hasActiveIr5,
    ]
  );

  const toggleAddon = (catalogAddonId: string) => {
    setSelectedAddons((prev) => {
      const next = new Set(prev);

      const matchingSelections = Array.from(next).filter(
        (selectedId) => getCatalogAddonId(selectedId) === catalogAddonId
      );

      if (matchingSelections.length > 0) {
        matchingSelections.forEach((selectedId) => {
          next.delete(selectedId);
        });

        return next;
      }

      next.add(resolveCheckoutAddonId(catalogAddonId, requestedInterviewCategory));

      return next;
    });
  };

  // Apply deep-link params (mode / plan / addons / visa) into state. This must
  // run ONLY when the URL actually changes — never when other state (e.g. the
  // recreated handleCheckout callback) changes, otherwise every user edit to the
  // selection would be instantly reverted back to the URL value. We key the
  // effect off the stringified params so it is stable across unrelated renders.
  const searchParamsString = searchParams.toString();
  useEffect(() => {
    const plan = searchParams.get("plan");
    const addons = searchParams.get("addons");
    const visaCat = searchParams.get("visa");
    const modeParam = searchParams.get("mode");
    if (
      modeParam === "plans" ||
      modeParam === "tools" ||
      modeParam === "services" ||
      modeParam === "guides"
    ) {
      setMode(modeParam);
    } else if (modeParam === "resources") {
      // Legacy alias — route to the tab that owns the first deep-linked add-on.
      const firstAddon = addons?.split(",").filter(Boolean)[0];
      const found = firstAddon ? ADDONS.find((a) => a.id === firstAddon) : undefined;
      setMode((found?.kind as ResourceMode) ?? "tools");
    }
    if (plan) setSelectedPlan(plan);
    // MERGE deep-linked add-ons into the existing cart (don't replace) — opening
    // a tool's detail page and adding it should keep items already in the order.
    const urlInterviewCategory =
      searchParams.get("interview_category") || VISA_TO_INTERVIEW_CATEGORY[visaCat || visa] || null;

    const urlAddons = (addons || "")
      .split(",")
      .filter(Boolean)
      .map((addonId) => resolveCheckoutAddonId(addonId, urlInterviewCategory));

    if (urlAddons.length) {
      setSelectedAddons((prev) => mergeAddonSelections(prev, urlAddons));
    }
    if (visaCat && AVAILABLE_VISA_IDS.includes(visaCat)) setVisa(visaCat);
    const parentsParam = searchParams.get("parents") || searchParams.get("candidate_count");
    if (parentsParam) {
      const parsed = parseInt(parentsParam, 10);
      if (!isNaN(parsed) && parsed >= 1) setParentCount(parsed);
    }
    if (searchParams.get("action") === "add_candidate") {
      setParentCount(1);
    }
    // Restore the order-summary (review) step when deep-linked back to it.
    if (searchParams.get("step") === "review") setPurchaseStep("review");
    // Returning from a canceled Stripe checkout — show a non-blocking notice and
    // strip the flag from the URL so a refresh doesn't keep re-showing it.
    if (searchParams.get("checkout_canceled") === "1") {
      setCheckoutCanceled(true);
      const cleaned = new URLSearchParams(searchParamsString);
      cleaned.delete("checkout_canceled");
      const qs = cleaned.toString();
      window.history.replaceState({}, "", qs ? `?${qs}` : window.location.pathname);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParamsString]);

  // Auto-checkout — fire once the user is known. Kept separate from the param
  // parsing above so a recreated handleCheckout never re-applies URL state.
  useEffect(() => {
    const autoCheckout = searchParams.get("auto_checkout") === "true";
    if (autoCheckout && userId && !isLoadingUser && !isProcessingAutoCheckout) {
      const plan = searchParams.get("plan");
      const addons = searchParams.get("addons");
      window.history.replaceState({}, "", window.location.pathname);
      handleCheckout(userId, plan || undefined, addons ? addons.split(",") : undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParamsString, userId, isLoadingUser, handleCheckout, isProcessingAutoCheckout]);

  // ── Cart persistence ─────────────────────────────────────────────────────
  // The selected add-ons (the "cart") live in component state, so navigating to
  // a tool/service/guide detail page (a separate route) would normally wipe
  // them. Persist the cart in sessionStorage so it survives navigation, and
  // restore it on mount. Hydrate via effect (not a lazy initializer) to avoid an
  // SSR/client hydration mismatch.
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(CART_STORAGE_KEY);
      if (raw) {
        const stored: string[] = JSON.parse(raw);
        if (Array.isArray(stored) && stored.length) {
          setSelectedAddons((prev) => new Set([...prev, ...stored]));
        }
      }
    } catch {
      /* sessionStorage unavailable — non-fatal */
    }
  }, []);

  // Persist on every change. Skip the very first run so the initial empty state
  // doesn't clobber the cart before the hydration effect above has restored it.
  const cartPersistInitialized = useRef(false);
  useEffect(() => {
    if (!cartPersistInitialized.current) {
      cartPersistInitialized.current = true;
      return;
    }
    try {
      sessionStorage.setItem(CART_STORAGE_KEY, JSON.stringify(Array.from(selectedAddons)));
      // Let other routes (e.g. resource detail CTAs) re-read the cart instantly.
      window.dispatchEvent(new Event("rahvana-cart-change"));
    } catch {
      /* sessionStorage unavailable — non-fatal */
    }
  }, [selectedAddons]);

  // If the user redirects to Stripe and then hits Back, the page is restored
  // from the bfcache with these loading flags still true — leaving the order
  // summary stuck on "Processing". Clear them whenever the page is re-shown.
  useEffect(() => {
    const onPageShow = (e: PageTransitionEvent) => {
      if (!e.persisted) return;
      setIsProcessingAutoCheckout(false);
      setIsManualCheckoutLoading(false);
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }: any) => {
      const uid = data.user?.id || null;
      setUserId(uid);
      if (uid) {
        const { data: journeys } = await supabase
          .from("journeys")
          .select("journey_type, subscription_tier")
          .eq("user_id", uid);
        setJourneyTiers(
          (journeys || []).reduce<Record<string, string>>((tiers, journey) => {
            const key = String(journey.journey_type || "")
              .toLowerCase()
              .includes("5")
              ? "ir5"
              : "ir1";
            tiers[key] = journey.subscription_tier || "free";
            return tiers;
          }, {})
        );
      }
      setIsLoadingUser(false);
    });
  }, []);

  // Layout tokens
  const W = "px-4 sm:px-6 lg:px-10 max-w-[1440px] mx-auto";
  const eyebrow = "text-[12px] tracking-[0.15em] uppercase font-bold text-primary mt-0.5";
  const secBtn =
    "px-4 py-[8px] rounded-full text-[13px] font-medium cursor-pointer transition-colors border border-border bg-card hover:bg-muted/40 text-foreground inline-flex items-center gap-2";

  // Parent eligibility guard for > 2 parents
  const isParentEligibilityBlocked = isIr5 && parentCount > 2 && !isEligibilityConfirmed;

  // Checkout button (shared)
  const checkoutBtn = (
    <div className="flex flex-col gap-1.5">
      {isLoadingUser ? (
        <button
          disabled
          className="bg-primary/50 w-full cursor-not-allowed rounded-full px-5 py-[11px] text-center text-[14px] font-semibold text-white/70"
        >
          Loading...
        </button>
      ) : isParentEligibilityBlocked ? (
        <button
          type="button"
          onClick={() => {
            showToast(
              "Please confirm legal eligibility for all additional parents before checkout.",
              "error"
            );
            const disclaimerEl = document.getElementById("parent-eligibility-disclaimer");
            if (disclaimerEl) {
              disclaimerEl.scrollIntoView({ behavior: "smooth", block: "center" });
            }
          }}
          className="w-full cursor-pointer rounded-full bg-amber-600 px-5 py-[11px] text-center text-[13.5px] font-semibold text-white shadow-sm transition-all hover:bg-amber-700"
        >
          Confirm Eligibility to Continue →
        </button>
      ) : userId ? (
        <CheckoutButton
          productTier={mode === "plans" && selectedPlan !== "free" ? selectedPlan : undefined}
          addons={checkoutAddonIds}
          visaCategory={visa}
          candidateCount={isIr5 ? parentCount : 1}
          action={isAddingCandidate || (isIr5 && hasActiveIr5) ? "add_candidate" : undefined}
          userId={userId}
          onLoadingChange={setIsManualCheckoutLoading}
          className="bg-primary hover:bg-primary/90 w-full rounded-full px-5 py-[11px] text-center text-[14px] font-semibold text-white"
        >
          Continue to Secure Checkout →
        </CheckoutButton>
      ) : (
        <Link
          href={`/login?redirect=${encodeURIComponent(`/pricing?auto_checkout=true&plan=${selectedPlan}&addons=${checkoutAddonIds.join(",")}&visa=${encodeURIComponent(visa)}&candidate_count=${parentCount}`)}`}
          className="bg-primary hover:bg-primary/90 block w-full rounded-full px-5 py-[11px] text-center text-[14px] font-semibold text-white"
        >
          Sign in to Checkout →
        </Link>
      )}
      <p className="text-muted-foreground text-center text-[11px]">Secure checkout via Stripe</p>
    </div>
  );

  // Order-summary header — a cart glyph with a live item-count badge, matching
  // the pattern shoppers expect from any standard cart. Reused by both the
  // journey-review and resources summaries so the two never drift apart.
  const summaryHeader = (count: number) => (
    <div className="border-border mb-4 flex items-center gap-2.5 border-b pb-3">
      <span className="relative inline-flex shrink-0">
        <ShoppingCart className="text-primary h-[18px] w-[18px]" strokeWidth={2} />
        {count > 0 && (
          <span className="bg-primary absolute -top-1.5 -right-1.5 inline-flex h-[15px] min-w-[15px] items-center justify-center rounded-full px-1 text-[9px] leading-none font-bold text-white tabular-nums">
            {count}
          </span>
        )}
      </span>
      <span className="text-muted-foreground text-[11px] font-bold tracking-widest uppercase">
        Order Summary
      </span>
      {count > 0 && (
        <span className="text-muted-foreground ml-auto text-[11px] font-medium">
          {count} {count === 1 ? "item" : "items"}
        </span>
      )}
    </div>
  );

  // Compact checkout control for the mobile sticky bar — same auth/loading
  // branches as checkoutBtn, minus the caption so it fits on one line.
  const mobileCheckoutButton = isLoadingUser ? (
    <button
      disabled
      className="bg-primary/50 w-full cursor-not-allowed rounded-full px-4 py-2.5 text-center text-[13px] font-semibold text-white/70"
    >
      Loading...
    </button>
  ) : isParentEligibilityBlocked ? (
    <button
      type="button"
      onClick={() => {
        showToast(
          "Please confirm legal eligibility for all additional parents before checkout.",
          "error"
        );
        const disclaimerEl = document.getElementById("parent-eligibility-disclaimer");
        if (disclaimerEl) {
          disclaimerEl.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }}
      className="w-full cursor-pointer rounded-full bg-amber-600 px-4 py-2.5 text-center text-[12.5px] font-semibold text-white"
    >
      Confirm Eligibility →
    </button>
  ) : userId ? (
    <CheckoutButton
      productTier={mode === "plans" && selectedPlan !== "free" ? selectedPlan : undefined}
      addons={checkoutAddonIds}
      visaCategory={visa}
      candidateCount={isIr5 ? parentCount : 1}
      action={isAddingCandidate || (isIr5 && hasActiveIr5) ? "add_candidate" : undefined}
      userId={userId}
      onLoadingChange={setIsManualCheckoutLoading}
      className="bg-primary hover:bg-primary/90 w-full rounded-full px-4 py-2.5 text-center text-[13px] font-semibold text-white"
    >
      Checkout →
    </CheckoutButton>
  ) : (
    <Link
      href={`/login?redirect=${encodeURIComponent(`/pricing?auto_checkout=true&plan=${selectedPlan}&addons=${checkoutAddonIds.join(",")}&visa=${encodeURIComponent(visa)}&candidate_count=${parentCount}`)}`}
      className="bg-primary hover:bg-primary/90 block w-full rounded-full px-4 py-2.5 text-center text-[13px] font-semibold text-white"
    >
      Sign in →
    </Link>
  );

  // Mobile-only sticky checkout bar. On phones the summary aside stacks well
  // below the content, so the running total + checkout would otherwise be out
  // of reach — this keeps them pinned to the viewport (standard cart behavior).
  const mobileSummaryBar = (count: number, total: number) => (
    <div className="border-border bg-card/95 fixed inset-x-0 bottom-0 z-40 border-t pb-[env(safe-area-inset-bottom)] shadow-[0_-6px_24px_rgba(0,0,0,0.10)] backdrop-blur-md lg:hidden">
      <div className="mx-auto flex max-w-[1440px] items-center gap-3 px-4 py-3">
        <span className="relative inline-flex shrink-0">
          <ShoppingCart className="text-primary h-6 w-6" strokeWidth={2} />
          {count > 0 && (
            <span className="bg-primary absolute -top-1.5 -right-1.5 inline-flex h-[16px] min-w-[16px] items-center justify-center rounded-full px-1 text-[9.5px] leading-none font-bold text-white tabular-nums">
              {count}
            </span>
          )}
        </span>
        <div className="min-w-0 leading-tight">
          <div className="text-muted-foreground text-[10px] tracking-wide uppercase">Total</div>
          <div className="text-primary mt-0.5 text-[19px] leading-none font-bold tracking-tight">
            ${total}
          </div>
        </div>
        <div className="ml-auto w-[150px] shrink-0 min-[420px]:w-[190px]">
          {mobileCheckoutButton}
        </div>
      </div>
    </div>
  );

  const reviewItemCount = (currentPlanData.id !== "free" ? 1 : 0) + activeAddons.length;

  return (
    <div className="text-foreground selection:bg-primary/20 min-h-[100dvh] overflow-x-hidden pb-12 font-sans sm:pb-20">
      {/* ── Mode Toggle ──────────────────────────────────────────────────────── */}
      <div className={`${W} pt-[88px] pb-0`}>
        <nav
          className="border-border/40 flex scrollbar-none items-center justify-between gap-4 overflow-x-auto border-b px-1 sm:justify-start sm:gap-8 md:grid md:grid-cols-4 md:gap-1 md:px-0"
          aria-label="Pricing mode"
        >
          {(
            [
              {
                id: "plans" as const,
                label: "Journey Plans",
                sub: "Full roadmap guidance",
              },
              {
                id: "tools" as const,
                label: RESOURCE_TABS.tools.label,
                sub: RESOURCE_TABS.tools.sub,
              },
              {
                id: "guides" as const,
                label: RESOURCE_TABS.guides.label,
                sub: RESOURCE_TABS.guides.sub,
              },
              {
                id: "services" as const,
                label: RESOURCE_TABS.services.label,
                sub: RESOURCE_TABS.services.sub,
              },
            ] as const
          ).map(({ id, label, sub }) => (
            <button
              key={id}
              onClick={() => {
                setMode(id);
                setPurchaseStep("browse");
              }}
              className={`group relative shrink-0 cursor-pointer px-1 py-3 text-left text-sm transition-all md:rounded-t-[10px] md:px-6 md:pt-2 md:pb-3 ${
                mode === id ? "md:bg-primary/[0.07]" : "hover:bg-muted/40"
              }`}
            >
              <span
                className={`block text-[13px] font-bold tracking-tight transition-colors sm:text-[15px] ${
                  mode === id
                    ? "text-primary"
                    : "text-muted-foreground/60 group-hover:text-foreground"
                }`}
              >
                {label}
              </span>
              <span
                className={`mt-0.5 hidden text-[11px] font-medium transition-colors md:block ${
                  mode === id ? "text-primary/60" : "text-muted-foreground/35"
                }`}
              >
                {sub}
              </span>
              {mode === id && (
                <span className="bg-primary absolute right-0 bottom-0 left-0 h-[2.5px] rounded-full md:bottom-[-2px] md:h-[3px] md:rounded-t-full" />
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* ── Checkout-canceled notice — shown when the user returns from Stripe
          without paying. Non-blocking; their selection is preserved. ───────── */}
      {checkoutCanceled && (
        <div className={`${W} pt-4`}>
          <div className="flex items-start gap-3 rounded-[14px] border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800 dark:bg-amber-900/20">
            <IcoInfo className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <div className="flex-1 text-[13px] leading-relaxed text-amber-800 dark:text-amber-300">
              <strong className="font-semibold">Checkout canceled, no charge was made.</strong> Your
              selection is saved below. Continue whenever you&apos;re ready.
            </div>
            <button
              onClick={() => setCheckoutCanceled(false)}
              className="shrink-0 rounded-full p-1 text-amber-600 transition-colors hover:bg-amber-100 dark:text-amber-400 dark:hover:bg-amber-900/40"
              aria-label="Dismiss"
            >
              <IconX className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
  JOURNEY PLANS — BROWSE
  ═══════════════════════════════════════════════════════════════════════ */}
      {mode === "plans" && purchaseStep === "browse" && (
        <div className="animate-in fade-in duration-300">
          {/* ═══════════════════════════════════════════════════════════════════
    STEP 1 — CHOOSE JOURNEY
    ═══════════════════════════════════════════════════════════════════ */}
          {!visa || isChangingJourney ? (
            <section className={`${W} pt-7 pb-8`}>
              {/* Hero */}
              <div className={eyebrow}>Journey Plans</div>

              <h1 className="page-heading m-0">Choose your immigration journey</h1>

              <p className="page-description text-muted-foreground mt-2 max-w-2xl">
                Select the journey that matches your immigration case to see the plans, tools, and
                guidance available for you.
              </p>

              {/* Already purchased IR-1 notice */}
              {isIr1Purchased && (
                <div className="mt-5 flex flex-col gap-2.5 rounded-2xl border border-teal-200/90 bg-teal-50/80 p-4 text-xs text-teal-900 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-teal-600" />
                    <span>
                      You already have an active <strong>IR-1 Spouse Visa</strong> journey (
                      <strong>{journeyTiers.ir1}</strong> plan).
                    </span>
                  </div>
                  <Link
                    href="/my-journeys"
                    className="inline-flex items-center gap-1 font-semibold text-[#0d7377] hover:underline"
                  >
                    Go to My Journeys →
                  </Link>
                </div>
              )}

              {/* Journey Cards */}
              <div className="mt-7 grid grid-cols-1 gap-5 md:grid-cols-3">
                {EXPLORER_CARDS.filter((card) => {
                  if (
                    isIr1Purchased &&
                    (card.code.includes("IR-1") ||
                      card.code.includes("CR-1") ||
                      card.slug === "ir-1")
                  ) {
                    return false;
                  }
                  return true;
                }).map((card) => {
                  const isLive = card.status === "Live" && Boolean(card.href);
                  const isSelected = card.code === visa;

                  return (
                    <div
                      key={card.code}
                      className={`relative rounded-[24px] transition-all duration-200 ${
                        isSelected
                          ? "shadow-[0_12px_36px_rgba(13,122,92,0.18)] ring-2 ring-[#0d7a5c] ring-offset-2 ring-offset-[#fafcfb]"
                          : ""
                      }`}
                    >
                      <ExplorerJourneyCard
                        card={card}
                        onSelect={
                          isLive
                            ? () => {
                                setVisa(card.code);
                                setIsChangingJourney(false);
                              }
                            : undefined
                        }
                      />

                      {isSelected && (
                        <span className="absolute top-3 right-3 z-10 inline-flex items-center gap-1 rounded-full bg-[#0d7a5c] px-2.5 py-1 text-[10.5px] font-bold tracking-wide text-white uppercase shadow-sm">
                          <IconCheck className="h-3 w-3" strokeWidth={3} />
                          Selected
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Supporting note */}
              <div className="mt-6 flex items-center gap-3">
                <span className="text-muted-foreground/50 text-[12px]">·</span>

                <span className="text-muted-foreground text-[12px]">
                  Select a journey to continue to available plans.
                </span>
              </div>
            </section>
          ) : (
            <>
              {/* ═════════════════════════════════════════════════════════════════
          STEP 2 — PLAN SELECTION HERO
          ═════════════════════════════════════════════════════════════════ */}
              <section className={`${W} pt-7 pb-6`}>
                <div className="flex items-start justify-between gap-4">
                  {/* Hero copy */}
                  <div>
                    <div className="flex gap-3">
                      <div className="mb-6 flex items-center justify-between gap-3">
                        <button
                          className="text-muted-foreground hover:text-foreground inline-flex cursor-pointer items-center gap-1.5 border-0 bg-transparent p-0 text-[13.5px] font-medium transition-colors"
                          onClick={() => {
                            setIsChangingJourney(true);
                            window.scrollTo({ top: 0 });
                          }}
                        >
                          <ArrowLeft className="h-4 w-4" />
                          Back to Journeys
                        </button>
                      </div>
                      <div className={eyebrow}>Journey Plans</div>
                    </div>

                    <h1 className="page-heading m-0">Choose your Rahvana journey plan</h1>

                    <p className="page-description text-muted-foreground mt-2">
                      Pick the level of guidance, tools, and support that fits your case.
                    </p>
                  </div>
                </div>

                {/* Compare plans */}
                <div className="mt-4 -ml-3">
                  <div className="ml-2 flex flex-wrap items-center justify-start gap-2 md:flex-row md:flex-nowrap">
                    <button
                      type="button"
                      className={`${secBtn} shrink-0`}
                      onClick={() => setComparePlansOpen(true)}
                    >
                      <IcoTableCompare className="h-4 w-4 opacity-60" />
                      Compare plans
                    </button>
                  </div>
                </div>

                {/* Checkout error + Government fees */}
                <div className="mt-4 -ml-3">
                  {checkoutError && (
                    <div className="mb-3 flex w-full items-start gap-3 rounded-xl border border-red-100 bg-red-50 p-4">
                      <svg
                        className="mt-0.5 h-5 w-5 shrink-0 text-red-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>

                      <p className="text-sm text-red-700">{checkoutError}</p>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground/50 text-[12px]">·</span>

                    <span className="text-muted-foreground text-[12px]">
                      Government fees are not included in any plan
                    </span>
                  </div>
                </div>
              </section>

              {/* ═════════════════════════════════════════════════════════════════
          PLAN CARDS — FULL WIDTH
          ═════════════════════════════════════════════════════════════════ */}
              <div className={`${W}`}>
                {/* IR-5 Multi-Parent Selector & Eligibility Disclaimer */}
                {isIr5 && (
                  <div className="mb-8 space-y-4">
                    {/* Parent Selector Card */}
                    <div className="border-border bg-card rounded-[22px] border p-5 shadow-sm sm:p-6">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#0d7377]/10 text-[#0d7377]">
                              <Users className="h-4 w-4" />
                            </span>
                            <h3 className="text-foreground text-[17px] font-bold">
                              {isAddingCandidate || hasActiveIr5
                                ? "Add Additional Beneficiary Parent"
                                : "Beneficiary Parents Selection"}
                            </h3>
                            <span className="rounded-full bg-[#0d7377]/10 px-2.5 py-0.5 text-[11px] font-semibold text-[#0d7377]">
                              IR-5 Visa
                            </span>
                          </div>
                          <p className="text-muted-foreground mt-1 text-[13px]">
                            {isAddingCandidate || hasActiveIr5
                              ? "You are adding another parent beneficiary to your IR-5 petition. Choose how many additional parents and select their plan below."
                              : "How many parents are you petitioning for? Select biological, step, or adoptive parents."}
                          </p>
                        </div>

                        {/* Counter and presets */}
                        <div className="flex flex-wrap items-center gap-2">
                          {[1, 2, 3, 4].map((count) => (
                            <button
                              key={count}
                              type="button"
                              onClick={() => {
                                setParentCount(count);
                                if (count <= 2) {
                                  setIsEligibilityConfirmed(true);
                                }
                              }}
                              className={`rounded-xl px-3.5 py-2 text-[13px] font-semibold transition-all ${
                                parentCount === count
                                  ? "bg-[#0d7377] text-white shadow-sm ring-2 ring-[#0d7377]/20"
                                  : "border-border bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground border"
                              }`}
                            >
                              {count} {count === 1 ? "Parent" : "Parents"}
                            </button>
                          ))}

                          {/* Stepper for 5+ or precise adjusting */}
                          <div className="border-border bg-muted/20 flex items-center rounded-xl border p-1">
                            <button
                              type="button"
                              disabled={parentCount <= 1}
                              onClick={() => {
                                const next = Math.max(1, parentCount - 1);
                                setParentCount(next);
                                if (next <= 2) setIsEligibilityConfirmed(true);
                              }}
                              className="text-muted-foreground hover:bg-card hover:text-foreground flex h-8 w-8 items-center justify-center rounded-lg disabled:opacity-30 disabled:hover:bg-transparent"
                              title="Decrease parent count"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span className="text-foreground min-w-[42px] px-2 text-center text-[13px] font-bold">
                              {parentCount}
                            </span>
                            <button
                              type="button"
                              disabled={parentCount >= 8}
                              onClick={() => {
                                const next = Math.min(8, parentCount + 1);
                                setParentCount(next);
                                if (next > 2 && parentCount <= 2) {
                                  setIsEligibilityConfirmed(false);
                                }
                              }}
                              className="text-muted-foreground hover:bg-card hover:text-foreground flex h-8 w-8 items-center justify-center rounded-lg disabled:opacity-30 disabled:hover:bg-transparent"
                              title="Increase parent count"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Dynamic multiplier note */}
                      <div className="border-border/60 text-muted-foreground mt-4 flex flex-wrap items-center justify-between gap-2 border-t pt-3 text-[12px]">
                        <div className="flex items-center gap-1.5">
                          <Heart className="h-3.5 w-3.5 text-[#0d7377]" />
                          <span>
                            {parentCount === 1 ? (
                              "Petitioning for 1 parent. Standard single-journey pricing applies."
                            ) : (
                              <>
                                Petitioning for{" "}
                                <strong className="text-foreground">{parentCount} parents</strong> (
                                {parentCount}x journey plan). Plan pricing adjusts automatically.
                              </>
                            )}
                          </span>
                        </div>
                        {parentCount > 2 && (
                          <span className="font-medium text-amber-600 dark:text-amber-400">
                            Requires step/adoptive parent eligibility confirmation
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Disclaimer when parentCount > 2 */}
                    {parentCount > 2 && (
                      <div
                        id="parent-eligibility-disclaimer"
                        className={`rounded-[22px] border p-5 transition-all duration-200 ${
                          isEligibilityConfirmed
                            ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-950 dark:text-emerald-100"
                            : "border-amber-500/40 bg-amber-500/10 text-amber-950 ring-2 ring-amber-500/20 dark:text-amber-100"
                        }`}
                      >
                        <div className="flex items-start gap-3.5">
                          <div
                            className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                              isEligibilityConfirmed
                                ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                                : "bg-amber-500/20 text-amber-600 dark:text-amber-400"
                            }`}
                          >
                            {isEligibilityConfirmed ? (
                              <CheckCircle2 className="h-5 w-5" />
                            ) : (
                              <AlertTriangle className="h-5 w-5" />
                            )}
                          </div>
                          <div className="flex-1 space-y-2">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <h4 className="text-[15px] font-bold">
                                {isEligibilityConfirmed
                                  ? "Eligibility Verified for All Beneficiary Parents"
                                  : "Important: Confirm Stepparent / Adoptive Parent Eligibility"}
                              </h4>
                              <span
                                className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                                  isEligibilityConfirmed
                                    ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                                    : "bg-amber-500/20 text-amber-700 dark:text-amber-300"
                                }`}
                              >
                                {parentCount} Parents Selected
                              </span>
                            </div>

                            <p className="text-[13px] leading-relaxed opacity-90">
                              Under USCIS regulations, you can petition for biological parents,
                              stepparents, and adoptive parents. However, strict statutory criteria
                              must be satisfied before filing Form I-130:
                            </p>

                            <div className="grid grid-cols-1 gap-2.5 pt-1 text-[12.5px] sm:grid-cols-2">
                              <div className="bg-background/50 rounded-xl border border-black/5 p-3 dark:border-white/10">
                                <strong className="text-foreground block text-[13px]">
                                  Stepparents (INA § 101(b)(1)(B))
                                </strong>
                                <span className="text-muted-foreground mt-0.5 block">
                                  The marriage between your biological parent and stepparent must
                                  have occurred <strong>before you turned 18</strong>.
                                </span>
                              </div>
                              <div className="bg-background/50 rounded-xl border border-black/5 p-3 dark:border-white/10">
                                <strong className="text-foreground block text-[13px]">
                                  Adoptive Parents (INA § 101(b)(1)(E))
                                </strong>
                                <span className="text-muted-foreground mt-0.5 block">
                                  The adoption must have been legally finalized{" "}
                                  <strong>before you turned 16</strong>, with at least 2 years of
                                  legal custody.
                                </span>
                              </div>
                            </div>

                            {/* Checkbox confirmation */}
                            <div className="mt-3 pt-2">
                              <label className="flex cursor-pointer items-center gap-3 select-none">
                                <input
                                  type="checkbox"
                                  checked={isEligibilityConfirmed}
                                  onChange={(e) => setIsEligibilityConfirmed(e.target.checked)}
                                  className="border-border h-4 w-4 shrink-0 rounded text-[#0d7377] focus:ring-[#0d7377]"
                                />
                                <span className="text-[13px] leading-snug font-medium">
                                  I confirm that all beneficiary parents meet USCIS statutory
                                  eligibility criteria before purchasing journey plan.
                                </span>
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Separation / Isolation feature callout */}
                    <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-[12.5px] text-emerald-900 dark:text-emerald-200">
                      <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                      <span>
                        <strong>100% Isolated Roadmaps & Document Vaults:</strong> Each parent
                        receives their own dedicated journey roadmap, document checklist, and secure
                        vault under your account.
                      </span>
                    </div>
                  </div>
                )}

                {(() => {
                  const TIER_RANK: Record<string, number> = {
                    free: 0,
                    basic: 1,
                    premium: 2,
                    executive: 3,
                  };

                  const activeTierRank = TIER_RANK[selectedJourneyTier] ?? 0;

                  return (
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                      {paidPlans.map((plan) => {
                        const tc = TIER[plan.id as TierKey];

                        const isSelected = selectedPlan === plan.id;

                        const planRank = TIER_RANK[plan.id] ?? 0;

                        const isCurrentPlan = !isIr5 && plan.id === selectedJourneyTier;

                        const isDowngrade = !isIr5 && planRank < activeTierRank;

                        return (
                          <article
                            key={plan.id}
                            className={`${tc.cardBg} relative flex flex-col rounded-[24px] border p-6 transition-all duration-200 ${
                              isDowngrade
                                ? "cursor-not-allowed opacity-50"
                                : `cursor-pointer ${
                                    isSelected
                                      ? `${tc.selBorder} ${tc.ring} ${tc.glow}`
                                      : `${tc.border} hover:-translate-y-0.5 hover:shadow-lg`
                                  }`
                            }`}
                            onClick={() => {
                              if (!isDowngrade) {
                                setSelectedPlan(plan.id);
                              }
                            }}
                          >
                            {/* Current plan badge */}
                            {isCurrentPlan && (
                              <div className="absolute top-4 right-4 rounded-full border border-green-300 bg-green-100 px-2.5 py-1 text-[10px] font-bold tracking-[0.06em] text-green-700 uppercase">
                                Current Plan
                              </div>
                            )}

                            {/* Most popular badge */}
                            {!isCurrentPlan && plan.recommended && !isDowngrade && (
                              <div
                                className={`absolute top-4 right-4 rounded-full px-2.5 py-1 text-[10px] font-bold tracking-[0.06em] uppercase ${tc.badgeBg} ${tc.badgeText}`}
                              >
                                Most Popular
                              </div>
                            )}

                            {/* Selected check */}
                            {isSelected && !plan.recommended && !isCurrentPlan && !isDowngrade && (
                              <div
                                className={`absolute top-4 right-4 flex h-6 w-6 items-center justify-center rounded-full ${tc.btn}`}
                              >
                                <IconCheck className="h-3.5 w-3.5" />
                              </div>
                            )}

                            {/* Icon + Name + Price */}
                            <div className="mb-4 -ml-3 flex items-center gap-0">
                              <span
                                aria-hidden="true"
                                className={`plan-icon plan-icon--${plan.id}`}
                                style={{
                                  width: 72,
                                  height: 72,
                                  flexShrink: 0,
                                }}
                              />

                              <div className="flex flex-col gap-0.5">
                                {/* Plan name */}
                                <div
                                  className={`text-[10px] font-extrabold tracking-[0.16em] uppercase ${tc.textAccent}`}
                                >
                                  {plan.name}
                                </div>

                                {/* Monthly price */}
                                <div className="flex items-baseline gap-1">
                                  <span className="text-[34px] leading-none font-bold tracking-tight">
                                    ${planDisplayPrice(plan)}
                                  </span>

                                  <span className="text-muted-foreground text-[12px]">/mo</span>
                                </div>

                                {/* Annual price */}
                                <div className="text-muted-foreground text-[11px]">
                                  ${plan.annualPrice * parentMultiplier} total
                                  {isIr5 && parentCount > 1 && (
                                    <span>
                                      {" "}
                                      ({parentCount}x ${plan.annualPrice}/ea)
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Tagline */}
                            <p className="text-muted-foreground mb-4 text-[13px] leading-[1.5]">
                              {plan.tagline}
                            </p>

                            {/* Key Features */}
                            <ul className="m-0 flex-1 list-none space-y-2 p-0">
                              {plan.bullets.slice(0, 5).map((item, idx) => (
                                <li key={idx} className="flex items-center gap-2 text-[13px]">
                                  <IconCheck className={`h-4 w-4 flex-shrink-0 ${tc.checkCol}`} />

                                  <span className="truncate">{item}</span>
                                </li>
                              ))}
                            </ul>

                            {/* More Features */}
                            {plan.bullets.length > 5 && (
                              <button
                                type="button"
                                className={`mt-3 flex cursor-pointer items-center gap-1 border-0 bg-transparent p-0 text-left text-[12px] font-semibold ${tc.textAccent}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setComparePlansOpen(true);
                                }}
                              >
                                Click here to see what else is included
                                <IcoChevron className="h-3.5 w-3.5 -rotate-90" />
                              </button>
                            )}

                            {/* CTA */}
                            <button
                              type="button"
                              disabled={isDowngrade || !!isCurrentPlan}
                              className={`mt-4 w-full rounded-full px-4 py-[10px] text-[13.5px] font-semibold transition-all duration-150 ${
                                isDowngrade || isCurrentPlan
                                  ? "bg-muted text-muted-foreground border-border cursor-not-allowed border opacity-60"
                                  : `cursor-pointer ${isSelected ? tc.btn : `${tc.btnOut} border`}`
                              }`}
                              onClick={(e) => {
                                e.stopPropagation();

                                if (isDowngrade || isCurrentPlan) {
                                  return;
                                }

                                if (!visa) {
                                  showToast("Please select a visa category first.", "error");

                                  return;
                                }

                                if (isIr5 && parentCount > 2 && !isEligibilityConfirmed) {
                                  showToast(
                                    "Please confirm legal eligibility for all beneficiary parents before proceeding.",
                                    "error"
                                  );
                                  const el = document.getElementById(
                                    "parent-eligibility-disclaimer"
                                  );
                                  if (el) {
                                    el.scrollIntoView({ behavior: "smooth", block: "center" });
                                  }
                                  return;
                                }

                                setSelectedPlan(plan.id);
                                setPurchaseStep("review");

                                window.scrollTo({
                                  top: 0,
                                  behavior: "smooth",
                                });
                              }}
                            >
                              {isCurrentPlan
                                ? "Your Current Plan"
                                : isDowngrade
                                  ? "Not Available"
                                  : isSelected
                                    ? "Continue to Checkout →"
                                    : plan.cta}
                            </button>
                          </article>
                        );
                      })}
                    </div>
                  );
                })()}

                {/* ═══════════════════════════════════════════════════════════════
            FREE PLAN STRIP
            ═══════════════════════════════════════════════════════════════ */}
                <div className="bg-muted/30 border-border mt-4 flex flex-col items-start justify-between gap-3 rounded-[18px] border px-5 py-4 sm:flex-row sm:items-center">
                  <div>
                    <p className="m-0 text-[14px] font-semibold">
                      Not ready to commit? Start with a free preview.
                    </p>

                    <p className="text-muted-foreground m-0 mt-0.5 text-[13px]">
                      Preview the roadmap structure, access public tools, no payment required.
                    </p>
                  </div>

                  <Link href={userId ? "/" : "/signup"} className="shrink-0">
                    <button type="button" className={secBtn}>
                      Get Started Free
                    </button>
                  </Link>
                </div>

                {/* ═══════════════════════════════════════════════════════════════
            HELP ME CHOOSE
            ═══════════════════════════════════════════════════════════════ */}
                <div className="mt-10">
                  <h3 className="m-0 mb-1 text-[17px] font-bold">Help me choose</h3>

                  <p className="text-muted-foreground mb-4 text-[13.5px]">
                    Pick the description that matches you.
                  </p>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    {HELPER_DATA.map((card, idx) => {
                      const tc = TIER[card.plan as TierKey];

                      const isActive = selectedPlan === card.plan;

                      return (
                        <button
                          key={idx}
                          type="button"
                          className={`cursor-pointer rounded-[18px] border p-5 text-left transition-all ${
                            isActive
                              ? `${tc.cardBg} ${tc.selBorder} ${tc.ring}`
                              : "bg-card border-border hover:bg-muted/20"
                          }`}
                          onClick={() => {
                            setSelectedPlan(card.plan);
                          }}
                        >
                          <strong className="mb-2 block text-[14.5px]">{card.title}</strong>

                          <p className="text-muted-foreground m-0 mb-3 text-[13px] leading-[1.55]">
                            {card.copy}
                          </p>

                          <span className={`text-[12px] font-bold ${tc.textAccent}`}>
                            → Use {activePlans.find((p) => p.id === card.plan)?.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* ═══════════════════════════════════════════════════════════════
            FAQs — FULL WIDTH
            ═══════════════════════════════════════════════════════════════ */}
                <div className="mt-10">
                  <h2 className="m-0 mb-1 text-[22px] font-bold">Common questions</h2>

                  <p className="text-muted-foreground mb-4 text-[13.5px]">
                    Everything you need to know before purchasing.
                  </p>

                  <div className="bg-card border-border overflow-hidden rounded-[20px] border">
                    {FAQS.map(([q, a], idx) => (
                      <div
                        key={idx}
                        className={`border-border border-t first:border-0 ${
                          openFaqIndex === idx ? "bg-muted/20" : ""
                        }`}
                      >
                        <button
                          type="button"
                          className="hover:bg-muted/25 flex w-full cursor-pointer items-center justify-between gap-4 border-0 bg-transparent p-[16px_22px] text-left transition-colors"
                          onClick={() => setOpenFaqIndex(openFaqIndex === idx ? -1 : idx)}
                        >
                          <span className="text-[14px] font-semibold">{q}</span>

                          <span className="text-muted-foreground shrink-0 text-xl leading-none font-normal">
                            {openFaqIndex === idx ? "−" : "+"}
                          </span>
                        </button>

                        {openFaqIndex === idx && (
                          <div className="text-muted-foreground px-[22px] pb-4 text-[13.5px] leading-[1.65]">
                            {a}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* ═══════════════════════════════════════════════════════════════
            CTA BANNER — FULL WIDTH
            ═══════════════════════════════════════════════════════════════ */}
                <div className="bg-primary mt-8 flex flex-col justify-between gap-4 rounded-[22px] p-7 text-white md:flex-row md:items-center">
                  <div>
                    <h2 className="m-[0_0_6px] text-[22px] font-bold tracking-tight">
                      Start with the level that fits you.
                    </h2>

                    <p className="m-0 text-[14px] text-white/80">
                      Pick a plan, then add only the extras that apply to your case.
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-3">
                    <button
                      type="button"
                      className="text-primary cursor-pointer rounded-full bg-white px-5 py-[9px] text-[13.5px] font-semibold transition-colors hover:bg-white/90"
                      onClick={() =>
                        window.scrollTo({
                          top: 0,
                          behavior: "smooth",
                        })
                      }
                    >
                      Review Plans
                    </button>

                    <Link href="/#contact">
                      <button
                        type="button"
                        className="cursor-pointer rounded-full border border-white/30 px-5 py-[9px] text-[13.5px] font-semibold text-white transition-colors hover:bg-white/10"
                      >
                        Talk to Support
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          JOURNEY PLANS — ORDER REVIEW STEP
          ═══════════════════════════════════════════════════════════════════════ */}
      {mode === "plans" && purchaseStep === "review" && (
        <div className="animate-in fade-in duration-300">
          <div className={`${W} pt-6`}>
            {/* Back button + visa selector */}
            <div className="mb-6 flex items-center justify-between gap-3">
              <button
                className="text-muted-foreground hover:text-foreground inline-flex cursor-pointer items-center gap-1.5 border-0 bg-transparent p-0 text-[13.5px] font-medium transition-colors"
                onClick={() => {
                  setPurchaseStep("browse");
                  window.scrollTo({ top: 0 });
                }}
              >
                <ArrowLeft className="h-4 w-4" />
                Back to plans
              </button>
            </div>

            <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[1fr_320px]">
              {/* Left: add-ons */}
              <div>
                {/* Selected plan summary */}
                {(() => {
                  const tc = TIER[currentPlanData.id as TierKey];
                  if (!tc) return null;
                  return (
                    <div className={`${tc.cardBg} border ${tc.selBorder} mb-8 rounded-[22px] p-5`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <div
                            className={`mb-1 text-[11px] font-extrabold tracking-widest uppercase ${tc.textAccent}`}
                          >
                            Selected Plan
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[20px] font-bold">{currentPlanData.name}</span>
                            {isIr5 && parentCount > 1 && (
                              <span className="rounded-full bg-[#0d7377]/10 px-2.5 py-0.5 text-[11px] font-semibold text-[#0d7377]">
                                {parentCount} Parents
                              </span>
                            )}
                          </div>
                          <p className="text-muted-foreground m-0 mt-0.5 text-[13px]">
                            {currentPlanData.tagline}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-[32px] leading-none font-bold tracking-tight">
                            ${planDisplayPrice(currentPlanData)}
                          </div>
                          <div className="text-muted-foreground text-[12px]">
                            /mo · ${currentPlanData.annualPrice * parentMultiplier} total
                            {isIr5 && parentCount > 1 && (
                              <span> (${currentPlanData.annualPrice}/ea)</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* If > 2 parents, show eligibility reminder in the plan card */}
                      {isIr5 && parentCount > 2 && (
                        <div className="border-border/80 bg-background/60 mt-4 rounded-xl border p-3 text-[12.5px]">
                          <label className="flex cursor-pointer items-start gap-2.5 select-none">
                            <input
                              type="checkbox"
                              checked={isEligibilityConfirmed}
                              onChange={(e) => setIsEligibilityConfirmed(e.target.checked)}
                              className="border-border mt-0.5 h-4 w-4 rounded text-[#0d7377] focus:ring-[#0d7377]"
                            />
                            <div>
                              <span className="text-foreground font-semibold">
                                Stepparent / Adoptive Parent Eligibility Confirmed
                              </span>
                              <p className="text-muted-foreground mt-0.5 text-[11.5px]">
                                Stepparents married before petitioner turned 18; adoptions finalized
                                before 16.
                              </p>
                            </div>
                          </label>
                        </div>
                      )}

                      <button
                        className={`mt-3 text-[12.5px] font-medium ${tc.textAccent} cursor-pointer border-0 bg-transparent p-0`}
                        onClick={() => setPurchaseStep("browse")}
                      >
                        Change plan or parent count →
                      </button>
                    </div>
                  );
                })()}

                {/* Want to add extra help? */}
                <div>
                  <div className={eyebrow}>Optional add-ons</div>
                  <h2 className="m-0 mb-1 text-[21px] font-bold">Want to add extra help?</h2>
                  <p className="text-muted-foreground mb-5 text-[13.5px]">
                    Add only what you need. Recommended for the {currentPlanData.name} plan, or
                    browse all below.
                  </p>

                  {/* Recommended add-ons */}
                  {reviewAddons.length > 0 && (
                    <div className="mb-7">
                      <div className="text-muted-foreground mb-3 text-[11px] font-bold tracking-widest uppercase">
                        Recommended for {currentPlanData.name}
                      </div>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {reviewAddons.map((addon) => {
                          const isAdded = isAddonSelected(addon.id);
                          const cfg = ADDON_CONFIG[addon.id];
                          const Icon = cfg?.icon ?? Wand2;
                          return (
                            <article
                              key={addon.id}
                              className={`resource-fcard transition-all ${isAdded ? "is-added shadow-md" : "hover:shadow-sm"}`}
                            >
                              <div
                                className={`resource-fcard-frame ${
                                  cfg?.iconBg.includes("emerald") || cfg?.iconBg.includes("cyan")
                                    ? "bg-[#EEF6F0] text-[#3A6E4A]"
                                    : cfg?.iconBg.includes("indigo") || cfg?.iconBg.includes("blue")
                                      ? "bg-[#EAF1FB] text-[#1A5FA3]"
                                      : cfg?.iconBg.includes("amber") ||
                                          cfg?.iconBg.includes("yellow")
                                        ? "bg-[#FBF2E3] text-[#9B6220]"
                                        : cfg?.iconBg.includes("violet") ||
                                            cfg?.iconBg.includes("purple")
                                          ? "bg-[#F3EFFE] text-[#5C3DAA]"
                                          : "bg-[#FEF0F0] text-[#903030]"
                                }`}
                              >
                                <Icon className="h-7 w-7 opacity-70" />
                              </div>

                              <div className="resource-fcard-body">
                                <h3 className="resource-fcard-name">{addon.title}</h3>
                                <p className="resource-fcard-desc">{addon.copy}</p>

                                <div className="resource-fcard-foot">
                                  <div>
                                    <div className="resource-fcard-price">${addon.price}</div>
                                    <div className="resource-fcard-unit">{addon.unit}</div>
                                  </div>
                                  <button
                                    title={isAdded ? "Added to order" : "Add to order"}
                                    disabled={isAnyCheckoutLoading}
                                    className={`resource-fbtn ${isAdded ? "is-added" : ""}`}
                                    onClick={() => toggleAddon(addon.id)}
                                  >
                                    {isAdded ? "✓ Added to order" : "+ Add"}
                                  </button>
                                </div>
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* All other add-ons — collapsed by default */}
                  <div className="border-border mt-4 border-t pt-4">
                    <button
                      className="group mb-0 flex w-full cursor-pointer items-center justify-between border-0 bg-transparent p-0"
                      onClick={() => setAllAddonsOpen(!allAddonsOpen)}
                    >
                      <span className="text-muted-foreground group-hover:text-foreground text-[11px] font-bold tracking-widest uppercase transition-colors">
                        All available add-ons
                      </span>
                      <span className="text-muted-foreground group-hover:text-foreground flex items-center gap-1.5 text-[12px] transition-colors">
                        <span className="font-medium">
                          {allAddonsOpen ? "Collapse" : "Show all"}
                        </span>
                        <IcoChevron
                          className={`h-3.5 w-3.5 transition-transform duration-200 ${allAddonsOpen ? "rotate-180" : ""}`}
                        />
                      </span>
                    </button>
                    {allAddonsOpen && (
                      <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {ADDONS.filter((a) => !(PLAN_RECS[selectedPlan] || []).includes(a.id)).map(
                          (addon) => {
                            const isAdded = isAddonSelected(addon.id);
                            const cfg = ADDON_CONFIG[addon.id];
                            const Icon = cfg?.icon ?? Wand2;
                            return (
                              <article
                                key={addon.id}
                                className={`resource-fcard transition-all ${isAdded ? "is-added shadow-md" : "hover:shadow-sm"}`}
                              >
                                <div
                                  className={`resource-fcard-frame ${
                                    cfg?.iconBg.includes("emerald") || cfg?.iconBg.includes("cyan")
                                      ? "bg-[#EEF6F0] text-[#3A6E4A]"
                                      : cfg?.iconBg.includes("indigo") ||
                                          cfg?.iconBg.includes("blue")
                                        ? "bg-[#EAF1FB] text-[#1A5FA3]"
                                        : cfg?.iconBg.includes("amber") ||
                                            cfg?.iconBg.includes("yellow")
                                          ? "bg-[#FBF2E3] text-[#9B6220]"
                                          : cfg?.iconBg.includes("violet") ||
                                              cfg?.iconBg.includes("purple")
                                            ? "bg-[#F3EFFE] text-[#5C3DAA]"
                                            : "bg-[#FEF0F0] text-[#903030]"
                                  }`}
                                >
                                  <Icon className="h-7 w-7 opacity-70" />
                                </div>

                                <div className="resource-fcard-body">
                                  <h3 className="resource-fcard-name">{addon.title}</h3>
                                  <p className="resource-fcard-desc">{addon.copy}</p>

                                  <div className="resource-fcard-foot">
                                    <div>
                                      <div className="resource-fcard-price">${addon.price}</div>
                                      <div className="resource-fcard-unit">{addon.unit}</div>
                                    </div>

                                    <button
                                      title={isAdded ? "Added to order" : "Add to order"}
                                      disabled={isAnyCheckoutLoading}
                                      className={`resource-fbtn ${isAdded ? "is-added" : ""}`}
                                      onClick={() => toggleAddon(addon.id)}
                                    >
                                      {isAdded ? "✓ Added to order" : "+ Add"}
                                    </button>
                                  </div>
                                </div>
                              </article>
                            );
                          }
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: sticky order summary */}
              <aside className="bg-card border-border rounded-[22px] border p-5 shadow-md lg:sticky lg:top-[88px]">
                {summaryHeader(reviewItemCount)}

                <div className="border-border flex justify-between gap-3 border-b border-dashed py-2.5 text-[13px]">
                  <span className="text-muted-foreground">Visa</span>
                  <strong className="text-[12.5px]">{activeVisaCategory.label}</strong>
                </div>

                {isIr5 && (
                  <div className="border-border flex justify-between gap-3 border-b border-dashed py-2.5 text-[13px]">
                    <span className="text-muted-foreground">Beneficiaries</span>
                    <strong className="text-[12.5px]">
                      {parentCount} {parentCount === 1 ? "Parent" : "Parents"}
                    </strong>
                  </div>
                )}

                {currentPlanData.id !== "free" && (
                  <div className="border-border flex justify-between gap-3 border-b border-dashed py-2.5 text-[13px]">
                    <span className="text-muted-foreground">Plan</span>
                    <div className="text-right">
                      <strong
                        className={`block ${TIER[currentPlanData.id as TierKey]?.textAccent ?? ""}`}
                      >
                        {currentPlanData.name}
                      </strong>
                      <span className="text-muted-foreground text-[11px]">
                        ${planDisplayPrice(currentPlanData)}/mo · $
                        {currentPlanData.annualPrice * parentMultiplier} total
                        {isIr5 && parentCount > 1 && (
                          <span> (${currentPlanData.annualPrice}/ea)</span>
                        )}
                      </span>
                    </div>
                  </div>
                )}

                {isIr5 && parentCount > 2 && (
                  <div className="border-border border-b border-dashed py-2.5">
                    <label className="flex cursor-pointer items-center gap-2 text-[12px] select-none">
                      <input
                        type="checkbox"
                        checked={isEligibilityConfirmed}
                        onChange={(e) => setIsEligibilityConfirmed(e.target.checked)}
                        className="border-border h-3.5 w-3.5 shrink-0 rounded text-[#0d7377] focus:ring-[#0d7377]"
                      />
                      <span
                        className={
                          isEligibilityConfirmed
                            ? "font-medium text-emerald-600 dark:text-emerald-400"
                            : "font-medium text-amber-600 dark:text-amber-400"
                        }
                      >
                        {isEligibilityConfirmed
                          ? "✓ Eligibility verified"
                          : "Verify parent eligibility to proceed"}
                      </span>
                    </label>
                  </div>
                )}

                {activeAddons.map((a) => (
                  <div
                    key={a.id}
                    className="border-border flex justify-between gap-3 border-b border-dashed py-2 text-[13px]"
                  >
                    <span className="truncate pr-2 text-[12.5px]">{a.title}</span>
                    <div className="shrink-0 text-right">
                      <strong>${a.price}</strong>
                      <button
                        disabled={isAnyCheckoutLoading}
                        className={`text-muted-foreground ml-2 transition-colors ${isAnyCheckoutLoading ? "cursor-not-allowed opacity-30" : "cursor-pointer hover:text-red-500"} text-[11px]`}
                        onClick={() => toggleAddon(a.id)}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}

                <div className="border-border mt-4 flex items-end justify-between border-t pt-4">
                  <span className="text-muted-foreground text-[12px]">Total commitment</span>
                  <span className="text-primary text-[28px] leading-none font-bold tracking-tight">
                    ${summaryTotal}
                  </span>
                </div>

                <p className="text-muted-foreground bg-muted/40 border-border mt-3 mb-4 rounded-[12px] border border-dashed p-3 text-[11px] leading-relaxed">
                  Billed monthly at $
                  {currentPlanData.id !== "free" ? planDisplayPrice(currentPlanData) : 0}
                  /mo. Add-ons are one-time. Government fees excluded.
                </p>

                {checkoutBtn}
              </aside>
            </div>

            {/* Spacer so the last content clears the mobile sticky bar */}
            <div className="h-24 lg:hidden" aria-hidden="true" />
          </div>

          {reviewItemCount > 0 && mobileSummaryBar(reviewItemCount, summaryTotal)}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          INDIVIDUAL RESOURCES MODE — Tools / Services / Guides tabs
          ═══════════════════════════════════════════════════════════════════════ */}
      {mode !== "plans" && (
        <div className="animate-in fade-in duration-300">
          <section className={`${W} pt-7 pb-5`}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className={eyebrow}>{RESOURCE_TABS[mode].label}</div>
                <h1 className="m-0 text-[clamp(24px,3.5vw,42px)] leading-[1.1] font-bold tracking-tight">
                  {RESOURCE_TABS[mode].heading}
                </h1>
                <p className="text-muted-foreground mt-2 max-w-[520px] text-[14.5px]">
                  {RESOURCE_TABS[mode].blurb}
                </p>
              </div>
            </div>
          </section>

          <div className={`${W}`}>
            <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1fr_284px]">
              <div>
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
                  {resourcesForMode.map((addon) => (
                    <ResourceToolCard
                      key={addon.id}
                      addon={addon}
                      isAdded={isAddonSelected(addon.id)}
                      disabled={isAnyCheckoutLoading}
                      onToggle={toggleAddon}
                    />
                  ))}
                </div>

                <div className="mt-6 text-center">
                  <button
                    className="text-primary inline-flex cursor-pointer items-center gap-1.5 border-0 bg-transparent p-0 text-[13.5px] font-semibold"
                    onClick={() => setMode("plans")}
                  >
                    <ArrowLeft className="h-4 w-4" />
                    View full journey plans
                  </button>
                </div>
              </div>

              {/* Order summary sidebar */}
              <aside className="bg-card border-border rounded-[22px] border p-5 shadow-md lg:sticky lg:top-[88px]">
                {summaryHeader(activeAddons.length)}

                {activeAddons.length === 0 ? (
                  <div className="text-muted-foreground py-5 text-center text-[13px]">
                    No items selected yet.
                  </div>
                ) : (
                  activeAddons.map((a) => (
                    <div
                      key={a.id}
                      className="border-border flex justify-between gap-3 border-b border-dashed py-2 text-[13px]"
                    >
                      <span className="truncate pr-2 text-[12.5px]">{a.title}</span>
                      <div className="shrink-0 text-right">
                        <strong>${a.price}</strong>
                        <button
                          type="button"
                          disabled={isAnyCheckoutLoading}
                          aria-label={`Remove ${a.title}`}
                          title={`Remove ${a.title}`}
                          className={`ml-2 inline-flex items-center justify-center rounded-md p-1 transition-colors ${
                            isAnyCheckoutLoading
                              ? "cursor-not-allowed opacity-30"
                              : "text-muted-foreground cursor-pointer hover:bg-red-50 hover:text-red-500"
                          }`}
                          onClick={() => toggleAddon(a.id)}
                        >
                          <X className="h-3.5 w-3.5" strokeWidth={2} />
                        </button>
                      </div>
                    </div>
                  ))
                )}

                {activeAddons.length > 0 && (
                  <>
                    <div className="border-border mt-4 flex items-end justify-between border-t pt-4">
                      <span className="text-muted-foreground text-[12px]">Total</span>
                      <span className="text-primary text-[28px] leading-none font-bold tracking-tight">
                        ${summaryAddonsTotal}
                      </span>
                    </div>
                    <p className="text-muted-foreground bg-muted/40 border-border mt-3 mb-4 rounded-[12px] border border-dashed p-3 text-[11px] leading-relaxed">
                      Add-ons are one-time charges. Government fees are not included.
                    </p>
                    {checkoutBtn}
                  </>
                )}
              </aside>
            </div>

            {/* Spacer so the last content clears the mobile sticky bar */}
            {activeAddons.length > 0 && <div className="h-24 lg:hidden" aria-hidden="true" />}
          </div>

          {activeAddons.length > 0 && mobileSummaryBar(activeAddons.length, summaryAddonsTotal)}
        </div>
      )}

      {/* ── Compare Modal ─────────────────────────────────────────────────────── */}
      <CompareModal
        isOpen={comparePlansOpen}
        onClose={() => setComparePlansOpen(false)}
        activePlans={activePlans}
        planDisplayPrice={planDisplayPrice}
        onSelectPlan={(id) => {
          setSelectedPlan(id);
          setMode("plans");
          setPurchaseStep("browse");
        }}
      />
    </div>
  );
}

/* ===========================================================================
   SUSPENSE WRAPPER
   =========================================================================== */
export default function PricingSection() {
  return (
    <Suspense
      fallback={
        <div className="bg-background flex min-h-screen flex-col items-center justify-center p-6 text-center">
          <div className="border-primary mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-t-transparent" />
          <h2 className="mb-2 text-xl font-bold">Loading Pricing...</h2>
          <p className="text-muted-foreground">Preparing your plan options.</p>
        </div>
      }
    >
      <PricingContent />
    </Suspense>
  );
}
