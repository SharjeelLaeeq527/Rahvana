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
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { E, msg, errorCode } from "@/lib/errors";
import { VISA_CATEGORIES, HELPER_DATA, COMPARISON_GROUPS, ADDONS, FAQS } from "./data/pricing";
import type { PlanData } from "./data/pricing";
import ResourceToolCard from "@/components/pricing/ResourceToolCard";

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
   ADDON CONFIG — icons + colors matching resources page system
   =========================================================================== */
const ADDON_CONFIG: Record<
  string,
  {
    icon: React.ComponentType<{ className?: string }>;
    iconBg: string;
  }
> = {
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

const RESOURCE_TABS: Record<
  ResourceMode,
  { label: string; sub: string; heading: string; blurb: string }
> = {
  tools: {
    label: "Tools",
    sub: "Self-serve tools",
    heading: "Buy individual tools",
    blurb: "Self-serve tools you can use right away — no full journey plan required.",
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
function ComparisonCell({ value }: { value: string }) {
  const v = value.trim();
  if (v === "Included" || v === "Unlimited") {
    return <IconCheck className="w-5 h-5 mx-auto text-primary" />;
  }
  if (v === "Not Included") {
    return <IconX className="w-5 h-5 mx-auto text-red-500" />;
  }
  if (v === "—") {
    return (
      <span className="block text-center text-muted-foreground/40 font-bold text-xl leading-none">
        —
      </span>
    );
  }
  if (/included/i.test(v) && v !== "Included") {
    return (
      <span className="inline-flex items-center gap-1 mx-auto px-2.5 py-1 rounded-full text-[11px] font-bold border bg-primary/10 text-primary border-primary/20">
        <IconCheck className="w-3 h-3" /> {v}
      </span>
    );
  }
  if (/add on/i.test(v)) {
    return (
      <span className="inline-flex items-center mx-auto px-2.5 py-1 rounded-full text-[10.5px] font-bold border bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800">
        {v}
      </span>
    );
  }
  return (
    <span className="inline-block px-2.5 py-1 rounded-full text-[11px] font-bold border bg-muted text-muted-foreground border-border">
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
      className="fixed inset-0 bg-black/50 backdrop-blur-[2px] z-[1000] overflow-y-auto animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div className="flex min-h-full items-center justify-center p-4 sm:p-6 md:p-10">
        <div
          className="w-full max-w-[960px] max-h-[calc(100vh-40px)] md:max-h-[calc(100vh-80px)] bg-card border border-border rounded-[28px] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="cmp-title"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-border flex justify-between items-start gap-4 shrink-0 bg-gradient-to-b from-muted/30 to-transparent">
            <div>
              <h2
                id="cmp-title"
                className="text-[20px] font-bold m-0 leading-tight text-foreground"
              >
                Compare Rahvana plans
              </h2>
              <p className="text-muted-foreground text-[13px] mt-1 m-0">
                See exactly what&apos;s included in Basic, Premium, and Executive.
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-[7px] rounded-full border border-border bg-card hover:bg-muted/60 transition-colors cursor-pointer shrink-0"
              aria-label="Close"
            >
              <IconX className="w-[15px] h-[15px]" />
            </button>
          </div>

          {/* Plan headers + toggle */}
          <div className="px-6 py-4 border-b border-border bg-card/50 shrink-0">
            <div className="grid grid-cols-[minmax(0,180px)_repeat(3,minmax(0,1fr))] gap-3 items-center">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  role="switch"
                  aria-checked={differencesOnly}
                  onClick={() => setDifferencesOnly(!differencesOnly)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${differencesOnly ? "bg-primary" : "bg-muted"}`}
                >
                  <span className="sr-only">Differences only</span>
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ${differencesOnly ? "translate-x-4" : "translate-x-0"}`}
                  />
                </button>
                <span className="text-[12px] font-medium text-muted-foreground leading-tight">
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
                    className={`rounded-[16px] px-3 py-2.5 text-center border ${tc.border} ${tc.cardBg} ${tc.glow} shadow-sm`}
                  >
                    <div
                      className={`text-[10px] font-extrabold tracking-widest uppercase mb-0.5 ${tc.textAccent}`}
                    >
                      {plan.name}
                    </div>
                    <div className="text-[15px] font-bold leading-tight">
                      ${planDisplayPrice(plan)}
                      <span className="text-[11px] font-normal text-muted-foreground ml-0.5">
                        /mo
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Table — always expanded, alternating rows */}
          <div className="overflow-y-auto overflow-x-auto flex-1 scrollbar-premium bg-card">
            <div className="min-w-[540px]">
              {COMPARISON_GROUPS.map((group, gi) => {
                const rows = differencesOnly
                  ? group.rows.filter((r) => new Set(r.slice(1)).size > 1)
                  : group.rows;
                if (!rows.length) return null;
                return (
                  <div key={gi} className="border-b border-border/50 last:border-0">
                    <div className="px-6 py-2.5 bg-muted/30">
                      <span className="text-[10.5px] font-extrabold tracking-[0.12em] uppercase text-primary">
                        {group.label}
                      </span>
                    </div>
                    {rows.map((row, ri) => (
                      <div
                        key={ri}
                        className={`grid grid-cols-[minmax(0,1fr)_repeat(3,minmax(0,1fr))] gap-3 px-6 py-[11px] border-t border-border/20 items-center ${
                          ri % 2 === 0 ? "bg-card" : "bg-muted/[0.04]"
                        }`}
                      >
                        <span className="text-[13px] font-medium text-foreground">{row[0]}</span>
                        {row.slice(1).map((val, vi) => (
                          <div key={vi} className="flex justify-center">
                            <ComparisonCell value={val} />
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>

          {/* CTA footer */}
          <div className="px-6 py-5 border-t border-border shrink-0 rounded-b-[28px] bg-gradient-to-t from-muted/15 to-transparent">
            <p className="text-[11px] font-bold tracking-[0.1em] uppercase text-muted-foreground text-center mb-3">
              Select a plan to get started
            </p>
            <div className="grid grid-cols-3 gap-3">
              {paidPlans.map((plan) => {
                const tc = TIER[plan.id as TierKey];
                return (
                  <button
                    key={plan.id}
                    className={`py-[11px] px-4 rounded-full text-[13.5px] font-bold tracking-tight transition-all duration-150 cursor-pointer shadow-sm hover:shadow-md hover:-translate-y-px ${tc.btn}`}
                    onClick={() => {
                      onSelectPlan(plan.id);
                      onClose();
                    }}
                  >
                    {plan.cta} →
                  </button>
                );
              })}
            </div>
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
  const [userActiveTier, setUserActiveTier] = useState<string | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isProcessingAutoCheckout, setIsProcessingAutoCheckout] = useState(false);
  const [isManualCheckoutLoading, setIsManualCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const isAnyCheckoutLoading = isProcessingAutoCheckout || isManualCheckoutLoading;

  const [mode, setMode] = useState<"plans" | ResourceMode>("plans");
  const [purchaseStep, setPurchaseStep] = useState<"browse" | "review">("browse");

  const [visa, setVisa] = useState("IR-1 / CR-1");
  const billing = "monthly";

  const [selectedPlan, setSelectedPlan] = useState("premium");
  const [selectedAddons, setSelectedAddons] = useState<Set<string>>(new Set());

  const [comparePlansOpen, setComparePlansOpen] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number>(-1);
  const [allAddonsOpen, setAllAddonsOpen] = useState(false);
  const [checkoutCanceled, setCheckoutCanceled] = useState(false);

  // Derived
  const activeVisaCategory = useMemo(
    () => VISA_CATEGORIES.find((v) => v.id === visa) || VISA_CATEGORIES[0],
    [visa]
  );
  const activePlans = activeVisaCategory.plans;
  const paidPlans = activePlans.filter((p) => p.id !== "free");
  const currentPlanData = activePlans.find((p) => p.id === selectedPlan) || activePlans[2];
  const activeAddons = ADDONS.filter((a) => selectedAddons.has(a.id));
  const planDisplayPrice = (plan: PlanData) => plan.monthlyPrice;
  const summaryBase =
    mode === "plans" && currentPlanData.id !== "free" ? currentPlanData.annualPrice : 0;
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
            addons: addonsOverride || Array.from(selectedAddons),
            visaCategory: visa,
            billing,
            userId: uid,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setCheckoutError(`${msg(E.DASH_CHECKOUT_NO_URL)}`);
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
    [selectedPlan, selectedAddons, visa, billing, isProcessingAutoCheckout]
  );

  const toggleAddon = (id: string) =>
    setSelectedAddons((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

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
    const urlAddons = (addons || "").split(",").filter(Boolean);
    if (urlAddons.length) setSelectedAddons((prev) => new Set([...prev, ...urlAddons]));
    if (visaCat) setVisa(visaCat);
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
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("subscription_tier, subscription_status")
          .eq("id", uid)
          .single();
        if (profile?.subscription_status === "active" && profile?.subscription_tier) {
          setUserActiveTier(profile.subscription_tier);
        }
      }
      setIsLoadingUser(false);
    });
  }, []);

  // Layout tokens
  const W = "px-4 sm:px-6 lg:px-10 max-w-[1440px] mx-auto";
  const eyebrow = "text-[11px] tracking-[0.15em] uppercase font-bold text-primary mb-2";
  const secBtn =
    "px-4 py-[8px] rounded-full text-[13px] font-medium cursor-pointer transition-colors border border-border bg-card hover:bg-muted/40 text-foreground inline-flex items-center gap-2";

  // Visa pill — static display (only IR-1/CR-1 journey available)
  const visaPill = (
    <div className="inline-flex items-center gap-1.5 px-3 py-[5px] rounded-full bg-muted/70 border border-border/60 text-[12px]">
      <span className="font-medium text-foreground/80">Pakistan → US</span>
      <span className="text-border/80 mx-0.5">|</span>
      <span className="text-muted-foreground">{visa}</span>
    </div>
  );

  // Checkout button (shared)
  const checkoutBtn = (
    <div className="flex flex-col gap-1.5">
      {isLoadingUser ? (
        <button
          disabled
          className="w-full py-[11px] px-5 rounded-full text-[14px] font-semibold bg-primary/50 text-white/70 cursor-not-allowed text-center"
        >
          Loading…
        </button>
      ) : userId ? (
        <CheckoutButton
          productTier={mode === "plans" && selectedPlan !== "free" ? selectedPlan : undefined}
          addons={Array.from(selectedAddons)}
          visaCategory={visa}
          userId={userId}
          onLoadingChange={setIsManualCheckoutLoading}
          className="w-full py-[11px] px-5 rounded-full text-[14px] font-semibold bg-primary hover:bg-primary/90 text-white text-center"
        >
          Continue to Secure Checkout →
        </CheckoutButton>
      ) : (
        <Link
          href={`/login?redirect=${encodeURIComponent(`/pricing?auto_checkout=true&plan=${selectedPlan}&addons=${Array.from(selectedAddons).join(",")}&visa=${encodeURIComponent(visa)}`)}`}
          className="w-full py-[11px] px-5 rounded-full text-[14px] font-semibold bg-primary hover:bg-primary/90 text-white text-center block"
        >
          Sign in to Checkout →
        </Link>
      )}
      <p className="text-center text-[11px] text-muted-foreground">Secure checkout via Stripe</p>
    </div>
  );

  return (
    <div className="min-h-[100dvh] overflow-x-hidden text-foreground font-sans selection:bg-primary/20 pb-12 sm:pb-20">
      {/* ── Mode Toggle ──────────────────────────────────────────────────────── */}
      <div className={`${W} pt-[88px] pb-0`}>
        <nav className="grid grid-cols-2 md:grid-cols-4 items-end gap-1 border-b-2 border-border/40" aria-label="Pricing mode">
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
                id: "services" as const,
                label: RESOURCE_TABS.services.label,
                sub: RESOURCE_TABS.services.sub,
              },
              {
                id: "guides" as const,
                label: RESOURCE_TABS.guides.label,
                sub: RESOURCE_TABS.guides.sub,
              },
            ] as const
          ).map(({ id, label, sub }) => (
            <button
              key={id}
              onClick={() => {
                setMode(id);
                setPurchaseStep("browse");
              }}
              className={`relative px-6 pb-3 pt-2 text-left cursor-pointer transition-all rounded-t-[10px] group ${
                mode === id ? "bg-primary/[0.07]" : "hover:bg-muted/40"
              }`}
            >
              <span
                className={`block text-[15px] font-bold tracking-tight transition-colors ${
                  mode === id
                    ? "text-primary"
                    : "text-muted-foreground/60 group-hover:text-foreground"
                }`}
              >
                {label}
              </span>
              <span
                className={`block text-[11px] mt-0.5 font-medium transition-colors ${
                  mode === id ? "text-primary/60" : "text-muted-foreground/35"
                }`}
              >
                {sub}
              </span>
              {mode === id && (
                <span className="absolute bottom-[-2px] left-0 right-0 h-[3px] bg-primary rounded-t-full" />
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
              <strong className="font-semibold">Checkout canceled — no charge was made.</strong>{" "}
              Your selection is saved below. Continue whenever you&apos;re ready.
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
          {/* Hero */}
          <section className={`${W} pt-7 pb-6`}>
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div>
                <div className={eyebrow}>Journey Plans</div>
                <h1 className="page-heading m-0">
                  Choose your Rahvana journey plan
                </h1>
                <p className="page-description mt-2 text-muted-foreground">
                  Pick the level of guidance, tools, and support that fits your case.
                </p>
              </div>
              {/* Visa pill — top right */}
              <div className="sm:mt-1 shrink-0 self-start sm:self-auto">{visaPill}</div>
            </div>

            <div className="mt-5 flex items-center gap-3 flex-wrap">
              <button className={secBtn} onClick={() => setComparePlansOpen(true)}>
                <IcoTableCompare className="w-4 h-4 opacity-60" />
                Compare plans
              </button>
              {checkoutError && (
                <div className="w-full mt-3 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-red-500 shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p className="text-sm text-red-700">{checkoutError}</p>
                </div>
              )}
              <span className="text-[12px] text-muted-foreground/50 hidden md:inline">·</span>
              <span className="text-[12px] text-muted-foreground hidden md:inline">
                Government fees are not included in any plan
              </span>
            </div>
          </section>

          {/* Plan cards — full width, no sidebar */}
          <div className={`${W}`}>
            {(() => {
              const TIER_RANK: Record<string, number> = {
                free: 0,
                basic: 1,
                premium: 2,
                executive: 3,
              };
              const activeTierRank = TIER_RANK[userActiveTier ?? "free"] ?? 0;
              return (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {paidPlans.map((plan) => {
                    const tc = TIER[plan.id as TierKey];
                    const isSelected = selectedPlan === plan.id;
                    const planRank = TIER_RANK[plan.id] ?? 0;
                    const isCurrentPlan = userActiveTier && plan.id === userActiveTier;
                    const isDowngrade = !!userActiveTier && planRank < activeTierRank;
                    return (
                      <article
                        key={plan.id}
                        className={`${tc.cardBg} border rounded-[24px] p-6 flex flex-col relative transition-all duration-200 ${
                          isDowngrade
                            ? "opacity-50 cursor-not-allowed"
                            : `cursor-pointer ${isSelected ? `${tc.selBorder} ${tc.ring} ${tc.glow}` : `${tc.border} hover:shadow-lg hover:-translate-y-0.5`}`
                        }`}
                        onClick={() => {
                          if (!isDowngrade) setSelectedPlan(plan.id);
                        }}
                      >
                        {isCurrentPlan && (
                          <div className="absolute top-4 right-4 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-[0.06em] uppercase bg-green-100 text-green-700 border border-green-300">
                            Current Plan
                          </div>
                        )}
                        {!isCurrentPlan && plan.recommended && !isDowngrade && (
                          <div
                            className={`absolute top-4 right-4 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-[0.06em] uppercase ${tc.badgeBg} ${tc.badgeText}`}
                          >
                            Most Popular
                          </div>
                        )}
                        {isSelected && !plan.recommended && !isCurrentPlan && !isDowngrade && (
                          <div
                            className={`absolute top-4 right-4 w-6 h-6 rounded-full ${tc.btn} flex items-center justify-center`}
                          >
                            <IconCheck className="w-3.5 h-3.5" />
                          </div>
                        )}

                        {/* Icon + Name/Price row */}
                        <div className="flex items-center gap-0 mb-4 -ml-3">
                          <span
                            aria-hidden="true"
                            className={`plan-icon plan-icon--${plan.id}`}
                            style={{ width: 72, height: 72, flexShrink: 0 }}
                          />
                          <div className="flex flex-col gap-0.5">
                            <div
                              className={`text-[10px] font-extrabold tracking-[0.16em] uppercase ${tc.textAccent}`}
                            >
                              {plan.name}
                            </div>
                            <div className="flex items-baseline gap-1">
                              <span className="text-[34px] font-bold tracking-tight leading-none">
                                ${planDisplayPrice(plan)}
                              </span>
                              <span className="text-[12px] text-muted-foreground">/mo</span>
                            </div>
                            <div className="text-[11px] text-muted-foreground">
                              ${plan.annualPrice} total
                            </div>
                          </div>
                        </div>
                        <p className="text-muted-foreground text-[13px] leading-[1.5] mb-4">
                          {plan.tagline}
                        </p>

                        {/* Key features — single line each */}
                        <ul className="list-none p-0 m-0 space-y-2 flex-1">
                          {plan.bullets.slice(0, 5).map((item, idx) => (
                            <li key={idx} className="flex gap-2 items-center text-[13px]">
                              <IconCheck className={`w-4 h-4 flex-shrink-0 ${tc.checkCol}`} />
                              <span className="truncate">{item}</span>
                            </li>
                          ))}
                        </ul>

                        {/* "See what else is included" → opens compare modal */}
                        {plan.bullets.length > 5 && (
                          <button
                            className={`mt-3 flex items-center gap-1 text-[12px] font-semibold ${tc.textAccent} cursor-pointer bg-transparent border-0 p-0 text-left`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setComparePlansOpen(true);
                            }}
                          >
                            Click here to see what else is included
                            <IcoChevron className="w-3.5 h-3.5 -rotate-90" />
                          </button>
                        )}

                        <button
                          disabled={isDowngrade || !!isCurrentPlan}
                          className={`mt-4 w-full py-[10px] px-4 rounded-full text-[13.5px] font-semibold transition-all duration-150 ${
                            isDowngrade || isCurrentPlan
                              ? "cursor-not-allowed opacity-60 bg-muted text-muted-foreground border border-border"
                              : `cursor-pointer ${isSelected ? tc.btn : `${tc.btnOut} border`}`
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isDowngrade || isCurrentPlan) return;
                            setSelectedPlan(plan.id);
                            setPurchaseStep("review");
                            window.scrollTo({ top: 0, behavior: "smooth" });
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

            {/* Free plan strip */}
            <div className="mt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-muted/30 border border-border rounded-[18px] px-5 py-4">
              <div>
                <p className="font-semibold text-[14px] m-0">
                  Not ready to commit? Start with a free preview.
                </p>
                <p className="text-muted-foreground text-[13px] m-0 mt-0.5">
                  Preview the roadmap structure, access public tools — no payment required.
                </p>
              </div>
              <Link href={userId ? "/" : "/signup"} className="shrink-0">
                <button className={secBtn}>Get Started Free</button>
              </Link>
            </div>

            {/* Help me choose — full width */}
            <div className="mt-10">
              <h3 className="text-[17px] font-bold m-0 mb-1">Help me choose</h3>
              <p className="text-[13.5px] text-muted-foreground mb-4">
                Pick the description that matches you.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {HELPER_DATA.map((card, idx) => {
                  const tc = TIER[card.plan as TierKey];
                  const isActive = selectedPlan === card.plan;
                  return (
                    <button
                      key={idx}
                      className={`border rounded-[18px] p-5 text-left cursor-pointer transition-all ${
                        isActive
                          ? `${tc.cardBg} ${tc.selBorder} ${tc.ring}`
                          : "bg-card border-border hover:bg-muted/20"
                      }`}
                      onClick={() => setSelectedPlan(card.plan)}
                    >
                      <strong className="block text-[14.5px] mb-2">{card.title}</strong>
                      <p className="m-0 text-muted-foreground text-[13px] leading-[1.55] mb-3">
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

            {/* FAQs — full width */}
            <div className="mt-10">
              <h2 className="text-[22px] font-bold m-0 mb-1">Common questions</h2>
              <p className="text-muted-foreground text-[13.5px] mb-4">
                Everything you need to know before purchasing.
              </p>
              <div className="bg-card border border-border rounded-[20px] overflow-hidden">
                {FAQS.map(([q, a], idx) => (
                  <div
                    key={idx}
                    className={`border-t border-border first:border-0 ${openFaqIndex === idx ? "bg-muted/20" : ""}`}
                  >
                    <button
                      className="w-full bg-transparent border-0 p-[16px_22px] flex justify-between items-center gap-4 text-left cursor-pointer hover:bg-muted/25 transition-colors"
                      onClick={() => setOpenFaqIndex(openFaqIndex === idx ? -1 : idx)}
                    >
                      <span className="font-semibold text-[14px]">{q}</span>
                      <span className="text-xl text-muted-foreground font-normal leading-none shrink-0">
                        {openFaqIndex === idx ? "−" : "+"}
                      </span>
                    </button>
                    {openFaqIndex === idx && (
                      <div className="px-[22px] pb-4 text-muted-foreground leading-[1.65] text-[13.5px]">
                        {a}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* CTA Banner — full width */}
            <div className="mt-8 bg-primary rounded-[22px] p-7 text-white flex flex-col md:flex-row justify-between gap-4 md:items-center">
              <div>
                <h2 className="m-[0_0_6px] text-[22px] font-bold tracking-tight">
                  Start with the level that fits you.
                </h2>
                <p className="m-0 text-white/80 text-[14px]">
                  Pick a plan, then add only the extras that apply to your case.
                </p>
              </div>
              <div className="flex gap-3 flex-wrap shrink-0">
                <button
                  className="px-5 py-[9px] bg-white text-primary rounded-full text-[13.5px] font-semibold hover:bg-white/90 transition-colors cursor-pointer"
                  onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                >
                  Review Plans
                </button>
                <Link href="/#contact">
                  <button className="px-5 py-[9px] border border-white/30 text-white rounded-full text-[13.5px] font-semibold hover:bg-white/10 transition-colors cursor-pointer">
                    Talk to Support
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          JOURNEY PLANS — ORDER REVIEW STEP
          ═══════════════════════════════════════════════════════════════════════ */}
      {mode === "plans" && purchaseStep === "review" && (
        <div className="animate-in fade-in duration-300">
          <div className={`${W} pt-6`}>
            {/* Back button */}
            <button
              className="inline-flex items-center gap-1.5 text-[13.5px] text-muted-foreground hover:text-foreground font-medium cursor-pointer bg-transparent border-0 p-0 mb-6 transition-colors"
              onClick={() => {
                setPurchaseStep("browse");
                window.scrollTo({ top: 0 });
              }}
            >
              <ArrowLeft className="w-4 h-4" />
              Back to plans
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 items-start">
              {/* Left: add-ons */}
              <div>
                {/* Selected plan summary */}
                {(() => {
                  const tc = TIER[currentPlanData.id as TierKey];
                  if (!tc) return null;
                  return (
                    <div className={`${tc.cardBg} border ${tc.selBorder} rounded-[22px] p-5 mb-8`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <div
                            className={`text-[11px] font-extrabold tracking-widest uppercase mb-1 ${tc.textAccent}`}
                          >
                            Selected Plan
                          </div>
                          <div className="text-[20px] font-bold">{currentPlanData.name}</div>
                          <p className="text-muted-foreground text-[13px] mt-0.5 m-0">
                            {currentPlanData.tagline}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-[32px] font-bold tracking-tight leading-none">
                            ${planDisplayPrice(currentPlanData)}
                          </div>
                          <div className="text-[12px] text-muted-foreground">
                            /mo · ${currentPlanData.annualPrice} total
                          </div>
                        </div>
                      </div>
                      <button
                        className={`mt-3 text-[12.5px] font-medium ${tc.textAccent} cursor-pointer bg-transparent border-0 p-0`}
                        onClick={() => setPurchaseStep("browse")}
                      >
                        Change plan →
                      </button>
                    </div>
                  );
                })()}

                {/* Want to add extra help? */}
                <div>
                  <div className={eyebrow}>Optional add-ons</div>
                  <h2 className="text-[21px] font-bold m-0 mb-1">Want to add extra help?</h2>
                  <p className="text-[13.5px] text-muted-foreground mb-5">
                    Add only what you need. Recommended for the {currentPlanData.name} plan — or
                    browse all below.
                  </p>

                  {/* Recommended add-ons */}
                  {reviewAddons.length > 0 && (
                    <div className="mb-7">
                      <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
                        Recommended for {currentPlanData.name}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {reviewAddons.map((addon) => {
                          const isAdded = selectedAddons.has(addon.id);
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
                                <Icon className="w-7 h-7 opacity-70" />
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
                                      disabled={isAnyCheckoutLoading}
                                      className={`resource-fbtn ${isAdded ? "is-added" : ""}`}
                                      onClick={() => toggleAddon(addon.id)}
                                    >
                                      {isAdded ? "✓ Added to order" : "+ Add to order"}
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
                  <div className="mt-4 border-t border-border pt-4">
                    <button
                      className="w-full flex justify-between items-center cursor-pointer bg-transparent border-0 p-0 group mb-0"
                      onClick={() => setAllAddonsOpen(!allAddonsOpen)}
                    >
                      <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground group-hover:text-foreground transition-colors">
                        All available add-ons
                      </span>
                      <span className="flex items-center gap-1.5 text-[12px] text-muted-foreground group-hover:text-foreground transition-colors">
                        <span className="font-medium">
                          {allAddonsOpen ? "Collapse" : "Show all"}
                        </span>
                        <IcoChevron
                          className={`w-3.5 h-3.5 transition-transform duration-200 ${allAddonsOpen ? "rotate-180" : ""}`}
                        />
                      </span>
                    </button>
                    {allAddonsOpen && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
                        {ADDONS.filter((a) => !(PLAN_RECS[selectedPlan] || []).includes(a.id)).map(
                          (addon) => {
                            const isAdded = selectedAddons.has(addon.id);
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
                                  <Icon className="w-7 h-7 opacity-70" />
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
                                      disabled={isAnyCheckoutLoading}
                                      className={`resource-fbtn ${isAdded ? "is-added" : ""}`}
                                      onClick={() => toggleAddon(addon.id)}
                                    >
                                      {isAdded ? "✓ Added to order" : "+ Add to order"}
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
              <aside className="lg:sticky lg:top-[88px] bg-card border border-border rounded-[22px] p-5 shadow-md">
                <div className="text-[11px] uppercase tracking-widest text-muted-foreground font-bold mb-4">
                  Order Summary
                </div>

                <div className="flex justify-between gap-3 py-2.5 border-b border-dashed border-border text-[13px]">
                  <span className="text-muted-foreground">Visa</span>
                  <strong className="text-[12.5px]">{visa}</strong>
                </div>

                {currentPlanData.id !== "free" && (
                  <div className="flex justify-between gap-3 py-2.5 border-b border-dashed border-border text-[13px]">
                    <span className="text-muted-foreground">Plan</span>
                    <div className="text-right">
                      <strong
                        className={`block ${TIER[currentPlanData.id as TierKey]?.textAccent ?? ""}`}
                      >
                        {currentPlanData.name}
                      </strong>
                      <span className="text-[11px] text-muted-foreground">
                        ${currentPlanData.monthlyPrice}/mo · ${currentPlanData.annualPrice} total
                      </span>
                    </div>
                  </div>
                )}

                {activeAddons.map((a) => (
                  <div
                    key={a.id}
                    className="flex justify-between gap-3 py-2 border-b border-dashed border-border text-[13px]"
                  >
                    <span className="text-[12.5px] truncate pr-2">{a.title}</span>
                    <div className="text-right shrink-0">
                      <strong>${a.price}</strong>
                      <button
                        disabled={isAnyCheckoutLoading}
                        className={`ml-2 text-muted-foreground transition-colors ${isAnyCheckoutLoading ? "opacity-30 cursor-not-allowed" : "hover:text-red-500 cursor-pointer"} text-[11px]`}
                        onClick={() => toggleAddon(a.id)}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}

                <div className="flex justify-between items-end mt-4 pt-4 border-t border-border">
                  <span className="text-[12px] text-muted-foreground">Total commitment</span>
                  <span className="font-bold text-[28px] tracking-tight text-primary leading-none">
                    ${summaryTotal}
                  </span>
                </div>

                <p className="text-[11px] text-muted-foreground leading-relaxed mt-3 mb-4 p-3 bg-muted/40 rounded-[12px] border border-dashed border-border">
                  Billed monthly at $
                  {currentPlanData.id !== "free" ? currentPlanData.monthlyPrice : 0}
                  /mo. Add-ons are one-time. Government fees excluded.
                </p>

                {checkoutBtn}
              </aside>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          INDIVIDUAL RESOURCES MODE — Tools / Services / Guides tabs
          ═══════════════════════════════════════════════════════════════════════ */}
      {mode !== "plans" && (
        <div className="animate-in fade-in duration-300">
          <section className={`${W} pt-7 pb-5`}>
            <div className={eyebrow}>{RESOURCE_TABS[mode].label}</div>
            <h1 className="text-[clamp(24px,3.5vw,42px)] font-bold leading-[1.1] tracking-tight m-0">
              {RESOURCE_TABS[mode].heading}
            </h1>
            <p className="mt-2 text-muted-foreground text-[14.5px] max-w-[520px]">
              {RESOURCE_TABS[mode].blurb}
            </p>
          </section>

          <div className={`${W}`}>
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_284px] gap-6 items-start">
              <div>
                {/* Resource cards — clickable, open the tool detail page */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {resourcesForMode.map((addon) => (
                    <ResourceToolCard
                      key={addon.id}
                      addon={addon}
                      isAdded={selectedAddons.has(addon.id)}
                      disabled={isAnyCheckoutLoading}
                      onToggle={toggleAddon}
                    />
                  ))}
                </div>

                <div className="mt-6 text-center">
                  <button
                    className="text-[13.5px] text-primary font-semibold inline-flex items-center gap-1.5 cursor-pointer bg-transparent border-0 p-0"
                    onClick={() => setMode("plans")}
                  >
                    <ArrowLeft className="w-4 h-4" />
                    View full journey plans
                  </button>
                </div>
              </div>

              {/* Order summary sidebar */}
              <aside className="lg:sticky lg:top-[88px] bg-card border border-border rounded-[22px] p-5 shadow-md">
                <div className="text-[11px] uppercase tracking-widest text-muted-foreground font-bold mb-4">
                  Order Summary
                </div>

                {activeAddons.length === 0 ? (
                  <div className="py-5 text-center text-muted-foreground text-[13px]">
                    No items selected yet.
                  </div>
                ) : (
                  activeAddons.map((a) => (
                    <div
                      key={a.id}
                      className="flex justify-between gap-3 py-2 border-b border-dashed border-border text-[13px]"
                    >
                      <span className="text-[12.5px] truncate pr-2">{a.title}</span>
                      <div className="text-right shrink-0">
                        <strong>${a.price}</strong>
                        <button
                          disabled={isAnyCheckoutLoading}
                          className={`ml-2 text-muted-foreground transition-colors ${isAnyCheckoutLoading ? "opacity-30 cursor-not-allowed" : "hover:text-red-500 cursor-pointer"} text-[11px]`}
                          onClick={() => toggleAddon(a.id)}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))
                )}

                {activeAddons.length > 0 && (
                  <>
                    <div className="flex justify-between items-end mt-4 pt-4 border-t border-border">
                      <span className="text-[12px] text-muted-foreground">Total</span>
                      <span className="font-bold text-[28px] tracking-tight text-primary leading-none">
                        ${summaryAddonsTotal}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed mt-3 mb-4 p-3 bg-muted/40 rounded-[12px] border border-dashed border-border">
                      Add-ons are one-time charges. Government fees are not included.
                    </p>
                    {checkoutBtn}
                  </>
                )}
              </aside>
            </div>
          </div>
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
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4 mx-auto" />
          <h2 className="text-xl font-bold mb-2">Loading Pricing…</h2>
          <p className="text-muted-foreground">Preparing your plan options.</p>
        </div>
      }
    >
      <PricingContent />
    </Suspense>
  );
}
