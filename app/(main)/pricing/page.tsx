"use client";

import React, {
  useEffect,
  useState,
  useMemo,
  useCallback,
  Suspense,
} from "react";
import { useSearchParams } from "next/navigation";
import CheckoutButton from "@/app/components/payment/CheckoutButton";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  VISA_CATEGORIES,
  HELPER_DATA,
  COMPARISON_GROUPS,
  ADDONS,
  FAQS,
  COUNTRIES,
} from "./data/pricing";

// ─── Icon helpers ─────────────────────────────────────────────────────────────

function IconCheck({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2"
      className={className} style={style} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 10l4 4 8-8" />
    </svg>
  );
}

function IconX({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2"
      className={className} style={style} strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 5L5 15M5 5l10 10" />
    </svg>
  );
}

// ─── Comparison cell renderer ─────────────────────────────────────────────────

function ComparisonCell({ value }: { value: string }) {
  const v = value.trim();
  if (v === "Included" || v === "Unlimited") {
    return <IconCheck className="w-5 h-5 mx-auto text-primary" />;
  }
  if (v === "Not Included") {
    return <IconX className="w-5 h-5 mx-auto text-red-500" />;
  }
  if (v === "—") {
    return <span className="block text-center text-muted-foreground/40 font-bold text-xl leading-none">—</span>;
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

// ─── Tier color map ───────────────────────────────────────────────────────────

const TIER_COLORS: Record<string, string> = {
  free: "text-neutral-500",
  basic: "text-sky-700",
  premium: "text-violet-700",
  executive: "text-amber-700",
};

// ─── Main content ─────────────────────────────────────────────────────────────

function PricingContent() {
  const searchParams = useSearchParams();

  const [userId, setUserId] = useState<string | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isProcessingAutoCheckout, setIsProcessingAutoCheckout] = useState(false);

  const [origin, setOrigin] = useState("Pakistan");
  const [destination, setDestination] = useState("United States");
  const [visa, setVisa] = useState("IR-1 / CR-1");
  const [selectedPlan, setSelectedPlan] = useState("premium");
  const [selectedAddons, setSelectedAddons] = useState<Set<string>>(new Set());
  const billing = "monthly";
  const [differencesOnly, setDifferencesOnly] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<"origin" | "destination">("origin");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeStep, setActiveStep] = useState<"plans" | "addons">("plans");
  const [openFaqIndex, setOpenFaqIndex] = useState<number>(0);

  const handleCheckout = useCallback(
    async (uid: string, planOverride?: string, addonsOverride?: string[]) => {
      if (isProcessingAutoCheckout) return;
      setIsProcessingAutoCheckout(true);
      try {
        const response = await fetch("/api/stripe/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productTier: planOverride || selectedPlan,
            addons: addonsOverride || Array.from(selectedAddons),
            visaCategory: visa,
            billing,
            userId: uid,
          }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Checkout failed");
        if (data.url) window.location.href = data.url;
      } catch (err) {
        console.error("Checkout error:", err);
        setIsProcessingAutoCheckout(false);
      }
    },
    [selectedPlan, selectedAddons, visa, billing, isProcessingAutoCheckout],
  );

  useEffect(() => {
    const plan = searchParams.get("plan");
    const addons = searchParams.get("addons");
    const visaCat = searchParams.get("visa");
    const autoCheckout = searchParams.get("auto_checkout") === "true";

    if (plan) setSelectedPlan(plan);
    if (addons) setSelectedAddons(new Set(addons.split(",").filter(Boolean)));
    if (visaCat) setVisa(visaCat);

    if (autoCheckout && userId && !isLoadingUser && !isProcessingAutoCheckout) {
      window.history.replaceState({}, "", window.location.pathname);
      handleCheckout(userId, plan || undefined, addons ? addons.split(",") : undefined);
    }
  }, [searchParams, userId, isLoadingUser, handleCheckout, isProcessingAutoCheckout]);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }: any) => {
      setUserId(data.user?.id || null);
      setIsLoadingUser(false);
    });
  }, []);

  useEffect(() => {
    document.body.style.overflow = isModalOpen ? "hidden" : "auto";
  }, [isModalOpen]);

  const toggleAddon = (id: string) => {
    const next = new Set(selectedAddons);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedAddons(next);
  };

  const activeVisaCategory = useMemo(
    () => VISA_CATEGORIES.find((v) => v.id === visa) || VISA_CATEGORIES[0],
    [visa],
  );

  const activePlans = activeVisaCategory.plans;
  const currentPlanData = activePlans.find((p) => p.id === selectedPlan) || activePlans[2];
  const activeAddons = ADDONS.filter((a) => selectedAddons.has(a.id));

  const planDisplayPrice = (plan: (typeof activePlans)[0]) => plan.monthlyPrice;

  const summaryBase = currentPlanData.annualPrice;
  const summaryTotal = summaryBase + activeAddons.reduce((s, a) => s + a.price, 0);

  const groupedCountries = useMemo(() => {
    const lower = searchQuery.toLowerCase();
    const filtered = COUNTRIES.filter((c) => c.toLowerCase().includes(lower));
    const groups: Record<string, string[]> = {};
    filtered.forEach((c) => {
      const l = c[0].toUpperCase();
      if (!groups[l]) groups[l] = [];
      groups[l].push(c);
    });
    return groups;
  }, [searchQuery]);

  const containerClass = "mx-auto site-main-px py-[34px]";
  const eyebrowClass = "text-[12px] tracking-[0.14em] uppercase font-bold text-primary mb-3";
  const h2Class = "text-[24px] md:text-[30px] font-bold leading-tight tracking-tight m-0";
  const solidBtn = "px-[18px] py-[12px] bg-primary text-white rounded-full hover:bg-primary-dark transition-colors border border-transparent cursor-pointer font-medium text-center inline-block";
  const outlineBtn = "px-[18px] py-[12px] bg-card border border-border text-foreground rounded-full hover:bg-muted/40 transition-colors cursor-pointer font-medium text-center inline-block";
  const miniBtn = "px-[14px] py-[10px] bg-card border border-border text-foreground rounded-full hover:bg-muted/40 transition-colors cursor-pointer text-sm font-medium shrink-0";

  return (
    <div className="min-h-screen text-foreground font-sans selection:bg-primary/20 pb-[48px]">

      {/* ── Journey Context ────────────────────────────────────────────── */}
      {activeStep === "plans" && (
        <section className="pt-10">
          <div className={containerClass}>
            <div className={eyebrowClass}>Simple, transparent pricing</div>
            <h1 className="text-[clamp(36px,5.5vw,64px)] leading-[1.03] tracking-tight mb-[18px] font-bold">
              Choose the support level<br className="hidden md:block" /> that fits your journey
            </h1>
            <div className="mt-2 text-[13px] text-muted-foreground max-w-[600px]">
              Government filing fees, medical examination fees, embassy fees, and any other applicable charges are paid separately and are not included in any plan.
            </div>

            {/* Journey context picker removed per user request */}
            {/* 
            <div className="mt-[30px] bg-card border border-border rounded-[24px] shadow-lg overflow-hidden">
              <div className="p-[16px_22px] border-b border-border bg-gradient-to-b from-card to-muted">
                <div className="text-[12px] font-bold tracking-[0.08em] uppercase text-muted-foreground">Journey Context</div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3">
                <div className="p-[22px] border-b md:border-b-0 md:border-r border-border">
                  <div className="text-[12px] text-muted-foreground mb-2.5">Origin Country</div>
                  <button
                    className="w-full p-[14px_16px] border border-border rounded-[14px] bg-card flex justify-between items-center text-left gap-2.5 cursor-pointer hover:border-primary/40 transition-colors group"
                    onClick={() => { setPickerTarget("origin"); setSearchQuery(origin); setIsModalOpen(true); }}
                  >
                    <span className="font-[650] text-[15px] group-hover:text-primary transition-colors">{origin}</span>
                    <svg className="w-[16px] h-[16px] opacity-50 shrink-0" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m5 7 5 6 5-6" /></svg>
                  </button>
                </div>
                <div className="p-[22px] border-b md:border-b-0 md:border-r border-border">
                  <div className="text-[12px] text-muted-foreground mb-2.5">Destination Country</div>
                  <button
                    className="w-full p-[14px_16px] border border-border rounded-[14px] bg-card flex justify-between items-center text-left gap-2.5 cursor-pointer hover:border-primary/40 transition-colors group"
                    onClick={() => { setPickerTarget("destination"); setSearchQuery(destination); setIsModalOpen(true); }}
                  >
                    <span className="font-[650] text-[15px] group-hover:text-primary transition-colors">{destination}</span>
                    <svg className="w-[16px] h-[16px] opacity-50 shrink-0" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m5 7 5 6 5-6" /></svg>
                  </button>
                </div>
                <div className="p-[22px]">
                  <div className="text-[12px] text-muted-foreground mb-2.5">Visa Category</div>
                  <div className="relative">
                    <select
                      className="w-full p-[14px_16px] border border-border rounded-[14px] bg-card appearance-none font-[650] text-[15px] outline-none hover:border-primary/40 transition-colors cursor-pointer"
                      value={visa}
                      onChange={(e) => setVisa(e.target.value)}
                    >
                      {VISA_CATEGORIES.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.label}</option>
                      ))}
                    </select>
                    <svg className="w-[16px] h-[16px] opacity-50 absolute right-[16px] top-1/2 -translate-y-1/2 pointer-events-none" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m5 7 5 6 5-6" /></svg>
                  </div>
                </div>
              </div>
            </div>
            */}

            <div className="flex gap-3 flex-wrap mt-[22px]">
              <button className={solidBtn} onClick={() => document.getElementById("plans")?.scrollIntoView({ behavior: "smooth" })}>Compare Plans</button>
              <button className={outlineBtn} onClick={() => document.getElementById("comparison")?.scrollIntoView({ behavior: "smooth" })}>See Full Comparison</button>
            </div>
          </div>
        </section>
      )}

      <main>
        {activeStep === "plans" && (
          <div className="animate-in fade-in duration-300">

            {/* ── Plan cards ─────────────────────────────────────────────── */}
            <section id="plans">
              <div className={containerClass}>
                <div className="flex flex-col md:flex-row justify-between md:items-end mb-[22px] gap-5">
                  <div>
                    <div className={eyebrowClass}>Step 1 — Pick your plan</div>
                    <h2 className={h2Class}>Select your plan</h2>
                    <p className="mt-1.5 text-muted-foreground text-[14px]">Add-ons are optional and come on the next step.</p>
                  </div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <div className="inline-flex items-center gap-[10px] px-3 py-2 rounded-full bg-muted border border-border text-muted-foreground text-[11px] font-bold tracking-[0.08em] uppercase whitespace-nowrap">
                      {origin} → {destination} · {visa}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {activePlans.map((plan) => {
                    const isSelected = selectedPlan === plan.id;
                    const displayPrice = planDisplayPrice(plan);
                    return (
                      <article
                        key={plan.id}
                        className={`bg-card border rounded-[24px] p-[22px] flex flex-col relative transition-all ${
                          isSelected ? "border-primary shadow-xl z-10" : "border-border shadow-sm hover:border-border"
                        } ${plan.recommended && !isSelected ? "ring-2 ring-primary" : ""}`}
                      >
                        {plan.recommended && (
                          <div className="absolute top-3.5 right-3.5 bg-primary/10 text-primary border border-primary/20 rounded-full px-2.5 py-1 text-[10px] font-bold tracking-[0.08em] uppercase">
                            Popular
                          </div>
                        )}
                        <div className={`text-[12px] font-extrabold tracking-widest uppercase mb-2.5 ${TIER_COLORS[plan.id] || "text-muted-foreground"}`}>
                          {plan.name}
                        </div>
                        <div className="mb-[16px]">
                          <div className="flex items-baseline gap-1">
                            <span className="text-[42px] leading-none font-bold tracking-tight">
                              {plan.id === "free" ? "$0" : `$${displayPrice}`}
                            </span>
                            {plan.id !== "free" && (
                              <span className="text-[13px] text-muted-foreground font-medium">
                                /mo
                              </span>
                            )}
                          </div>
                          {plan.id !== "free" && plan.annualPrice > 0 && (
                            <div className="mt-1 text-[12px] text-muted-foreground">${plan.annualPrice} total</div>
                          )}
                        </div>
                        <div className="text-muted-foreground text-[13.5px] leading-[1.55] mb-[18px] min-h-[60px]">{plan.tagline}</div>
                        <ul className="list-none p-0 m-[0_0_20px] grid gap-2 flex-1">
                          {plan.bullets.map((item, idx) => (
                            <li key={idx} className="flex gap-2.5 items-start text-[13px] leading-[1.45]">
                              <IconCheck className="w-4 h-4 flex-[0_0_16px] text-primary mt-[2px]" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                        <div className="mt-auto w-full">
                          {plan.id === "free" ? (
                            <Link href={userId ? "/" : "/signup"} className="w-full">
                              <button className={`${outlineBtn} w-full`} type="button">{plan.cta}</button>
                            </Link>
                          ) : (
                            <button
                              className={`w-full px-[18px] py-[12px] rounded-full transition-colors border font-medium border-solid ${
                                isSelected
                                  ? "bg-primary text-white border-transparent hover:bg-primary-dark"
                                  : "bg-card border-border text-foreground hover:bg-muted/30"
                              }`}
                              type="button"
                              onClick={() => setSelectedPlan(plan.id)}
                            >
                              {isSelected ? "✓ Selected" : plan.cta}
                            </button>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>

                {/* CTA to step 2 */}
                <div className="mt-10 flex justify-center w-full">
                  <button
                    className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary text-white text-[15px] font-bold rounded-full shadow-lg hover:shadow-xl hover:bg-primary-dark hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
                    onClick={() => { setActiveStep("addons"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                  >
                    Proceed to Step 2: Add-ons
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>

                {/* Helper cards */}
                <div className="mt-[36px]">
                  <h2 className="text-[22px] font-bold m-0">Which plan is right for you?</h2>
                  <p className="mt-1.5 text-muted-foreground text-[14px] mb-[18px]">Use this to decide faster.</p>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {HELPER_DATA.map((card, idx) => (
                      <button
                        key={idx}
                        className={`bg-card border rounded-[20px] p-[18px] cursor-pointer text-left transition-colors ${selectedPlan === card.plan ? "border-primary bg-muted/30" : "border-border hover:border-border"}`}
                        onClick={() => setSelectedPlan(card.plan)}
                      >
                        <strong className="block text-[15px] mb-2 text-foreground">{card.title}</strong>
                        <p className="m-[0_0_10px] text-muted-foreground text-[14px] leading-[1.55]">{card.copy}</p>
                        <span className={`text-[12px] font-bold ${TIER_COLORS[card.plan] || "text-primary"}`}>
                          → Use {activePlans.find((p) => p.id === card.plan)?.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* ── Comparison table ──────────────────────────────────────── */}
            <section id="comparison">
              <div className={containerClass}>
                <div className="flex flex-col md:flex-row justify-between md:items-end mb-[18px] gap-5">
                  <div>
                    <div className={eyebrowClass}>Full comparison</div>
                    <h2 className={h2Class}>What's in each plan</h2>
                  </div>
                  <div className="flex items-center gap-3 bg-muted/30 border border-border rounded-full px-4 py-2">
                    <span className="text-sm font-medium text-muted-foreground">Show differences only</span>
                    <button
                      type="button" role="switch" aria-checked={differencesOnly}
                      onClick={() => setDifferencesOnly(!differencesOnly)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors ${differencesOnly ? "bg-primary" : "bg-border"}`}
                    >
                      <span className="sr-only">Show Differences Only</span>
                      <span aria-hidden="true" className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${differencesOnly ? "translate-x-5" : "translate-x-0"}`} />
                    </button>
                  </div>
                </div>
                <div className="bg-card border border-border rounded-[24px] overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[760px]">
                      <thead>
                        <tr className="bg-muted/30">
                          <th className="p-[14px_18px] border-b border-border text-[11px] tracking-widest uppercase text-muted-foreground w-[42%]">Feature</th>
                          {activePlans.filter((p) => p.id !== "free").map((p) => (
                            <th key={p.id} className="p-[14px_16px] border-b border-border text-center">
                              <div className={`text-[11px] tracking-widest uppercase font-extrabold mb-0.5 ${TIER_COLORS[p.id] || ""}`}>{p.name}</div>
                              {p.id !== "free" && (
                                <div className="text-[11px] text-muted-foreground font-medium">
                                  ${planDisplayPrice(p)}/mo
                                </div>
                              )}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {COMPARISON_GROUPS.map((group, gi) => {
                          const rows = differencesOnly
                            ? group.rows.filter((r) => new Set(r.slice(1)).size > 1)
                            : group.rows;
                          if (!rows.length) return null;
                          return (
                            <React.Fragment key={gi}>
                              <tr>
                                <td colSpan={4} className="p-[11px_18px] bg-muted/60 text-primary text-[10.5px] font-extrabold tracking-widest uppercase border-b border-border">
                                  {group.label}
                                </td>
                              </tr>
                              {rows.map((row, ri) => (
                                <tr key={ri} className="hover:bg-muted/20 transition-colors">
                                  {row.map((val, vi) => (
                                    <td key={vi} className={`p-[13px_18px] border-b border-border align-middle text-[13.5px] ${vi !== 0 ? "text-center" : "text-foreground font-medium"}`}>
                                      {vi === 0 ? val : <ComparisonCell value={val} />}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </React.Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </section>

            {/* ── FAQs ──────────────────────────────────────────────────── */}
            <section>
              <div className={containerClass}>
                <div className="mb-[18px]">
                  <h2 className={h2Class}>Common questions</h2>
                  <p className="mt-1.5 text-muted-foreground text-[14px]">Everything you need to know before purchasing.</p>
                </div>
                <div className="bg-card border border-border rounded-[24px] overflow-hidden">
                  {FAQS.map(([q, a], idx) => (
                    <div key={idx} className={`border-t border-border first:border-0 ${openFaqIndex === idx ? "bg-muted/20" : ""}`}>
                      <button
                        className="w-full bg-transparent border-0 p-[18px_22px] flex justify-between items-center gap-4 text-left cursor-pointer font-[650] hover:bg-muted/30 transition-colors"
                        onClick={() => setOpenFaqIndex(openFaqIndex === idx ? -1 : idx)}
                      >
                        <span className="text-[15px]">{q}</span>
                        <span className="text-xl text-muted-foreground font-normal leading-none flex-shrink-0">{openFaqIndex === idx ? "−" : "+"}</span>
                      </button>
                      {openFaqIndex === idx && (
                        <div className="p-[0_22px_18px] text-muted-foreground leading-[1.65] text-[14px]">{a}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* ── CTA banner ────────────────────────────────────────────── */}
            <section>
              <div className={containerClass}>
                <div className="bg-primary rounded-[28px] p-[34px] text-white flex flex-col lg:flex-row justify-between gap-5 lg:items-center">
                  <div>
                    <h2 className="m-[0_0_8px] text-[26px] lg:text-[34px] leading-[1.08] font-bold tracking-tight">Start with the level that fits you.</h2>
                    <p className="m-0 text-white/80 leading-[1.6]">Pick a plan, then add only the extras that apply to your case.</p>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <button className="px-[18px] py-[12px] bg-white border border-transparent text-primary rounded-full hover:bg-primary-pale transition-colors cursor-pointer font-semibold"
                      onClick={() => document.getElementById("plans")?.scrollIntoView({ behavior: "smooth" })}>
                      Review Plans
                    </button>
                    <Link href="/#contact" className="inline-flex">
                      <button className="px-[18px] py-[12px] bg-transparent border border-white/35 text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer font-semibold">
                        Talk to Support
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* ── Step 2: Add-ons ───────────────────────────────────────────── */}
        {activeStep === "addons" && (
          <div className="animate-in fade-in duration-300">
            <section id="addonsStep">
              <div className={containerClass}>
                <div className="flex flex-col md:flex-row justify-between md:items-end mb-[18px] gap-5">
                  <div>
                    <div className={eyebrowClass}>Step 2 — Optional add-ons</div>
                    <h2 className={h2Class}>Enhance your plan</h2>
                    <p className="mt-1.5 text-muted-foreground text-[14px]">Add only what you need. All add-ons are charged once unless noted.</p>
                  </div>
                  <button className={outlineBtn} onClick={() => setActiveStep("plans")}>← Back to Plans</button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-[22px] items-start">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {ADDONS.map((addon) => {
                      const isSelected = selectedAddons.has(addon.id);
                      return (
                        <article
                          key={addon.id}
                          className={`bg-card border rounded-[22px] p-[18px] flex flex-col gap-2 transition-all ${isSelected ? "border-primary shadow-lg" : "border-border"}`}
                        >
                          <div className="flex justify-between items-start gap-3">
                            <div className="text-[15px] font-[750] text-foreground mt-0.5 leading-snug flex-1">{addon.title}</div>
                            <div className="text-right shrink-0">
                              <div className="font-bold text-[26px] tracking-tight leading-none mb-0.5">${addon.price}</div>
                              <div className="text-[11px] text-muted-foreground">{addon.unit}</div>
                            </div>
                          </div>
                          <p className="text-muted-foreground text-[13px] leading-[1.55] flex-1">{addon.copy}</p>
                          <div className="text-[11px] text-muted-foreground px-3 py-2 bg-muted/30 rounded-lg border border-border flex items-center gap-1.5">
                            <span className="font-bold uppercase tracking-wider text-[9px] opacity-70 shrink-0">Note:</span>
                            <span>{(addon as any).note || "Valid for one journey"}</span>
                          </div>
                          <button
                            className={`w-full px-[16px] py-[10px] rounded-full transition-colors border font-medium text-[13px] ${isSelected ? "bg-primary text-white border-transparent hover:bg-primary-dark" : "bg-card border-border text-foreground hover:bg-muted/40"}`}
                            onClick={() => toggleAddon(addon.id)}
                          >
                            {isSelected ? "✓ Added" : "Add to Order"}
                          </button>
                        </article>
                      );
                    })}
                  </div>

                  {/* Order summary */}
                  <aside className="lg:sticky top-[92px] bg-card border border-border rounded-[24px] p-[22px] shadow-lg">
                    <h3 className="m-[0_0_16px] text-[12px] uppercase tracking-widest text-muted-foreground font-bold">Order Summary</h3>
                    <div className="flex justify-between gap-3 py-2.5 border-b border-dashed border-border text-[13.5px]">
                      <span className="text-muted-foreground">Journey</span>
                      <strong>{origin} → {destination}</strong>
                    </div>
                    <div className="flex justify-between gap-3 py-2.5 border-b border-dashed border-border text-[13.5px]">
                      <span className="text-muted-foreground">Visa</span>
                      <strong>{visa}</strong>
                    </div>
                    <div className="flex justify-between gap-3 py-2.5 border-b border-dashed border-border text-[13.5px]">
                      <span className="text-muted-foreground">Plan</span>
                      <div className="text-right">
                        <strong className={TIER_COLORS[currentPlanData.id] || ""}>{currentPlanData.name}</strong>
                        {currentPlanData.id !== "free" && (
                          <div className="text-[11px] mt-1 text-muted-foreground">
                            ${currentPlanData.monthlyPrice}/mo · ${currentPlanData.annualPrice} total
                          </div>
                        )}
                      </div>
                    </div>
                    {activeAddons.map((a) => (
                      <div key={a.id} className="flex justify-between gap-3 py-2.5 border-b border-dashed border-border text-[13.5px]">
                        <span>{a.title}</span>
                        <strong>${a.price}</strong>
                      </div>
                    ))}
                    <div className="flex justify-between items-end mt-4 pt-4 border-t border-border">
                      <strong className="text-[13px] mb-[2px] text-muted-foreground">Total due</strong>
                      <span className="font-bold text-[32px] tracking-tight text-primary leading-none">${summaryTotal.toFixed(0)}</span>
                    </div>
                    <p className="text-[11.5px] text-muted-foreground leading-relaxed mt-3 mb-[18px] p-3 bg-muted/40 rounded-xl border border-dashed border-border">
                      {`Billed monthly at $${currentPlanData.monthlyPrice}/mo. Total journey commitment: $${currentPlanData.annualPrice}.`}
                      {" "}Add-ons are one-time charges. No cancellation after grace period. Government fees are separate.
                    </p>
                    <div className="flex flex-col gap-2.5">
                      {isLoadingUser ? (
                        <button disabled className={`${solidBtn} w-full opacity-50 cursor-not-allowed`}>Loading…</button>
                      ) : userId ? (
                        <CheckoutButton
                          productTier={selectedPlan}
                          addons={Array.from(selectedAddons)}
                          visaCategory={visa}
                          userId={userId}
                          className={`${solidBtn} w-full text-center block rounded-full py-3 px-4 font-medium`}
                        >
                          Continue to Secure Checkout →
                        </CheckoutButton>
                      ) : (
                        <Link
                          href={`/login?redirect=${encodeURIComponent(`/pricing?auto_checkout=true&plan=${selectedPlan}&addons=${Array.from(selectedAddons).join(",")}&visa=${encodeURIComponent(visa)}&billing=monthly`)}`}
                          className={`${solidBtn} w-full text-center block rounded-full py-3 px-4 font-medium`}
                        >
                          Sign in to Checkout →
                        </Link>
                      )}
                      <p className="text-center text-[11px] text-muted-foreground">Secure checkout via Stripe · Billed monthly</p>
                    </div>
                  </aside>
                </div>
              </div>
            </section>
          </div>
        )}
      </main>

      {/* ── Country picker modal ──────────────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-[#142225]/30 flex items-center justify-center p-3 md:p-6 z-50">
          <div className="w-full max-w-[900px] h-[min(86vh,760px)] md:h-[min(78vh,720px)] bg-card rounded-[28px] border border-border shadow-2xl flex overflow-hidden flex-col animate-in zoom-in-95 duration-200" role="dialog" aria-modal="true">
            <div className="p-[18px_22px] border-b border-border flex justify-between items-center gap-3 bg-muted/30">
              <div className="text-[18px] font-bold">{pickerTarget === "origin" ? "Select Origin Country" : "Select Destination Country"}</div>
              <button className={miniBtn} onClick={() => setIsModalOpen(false)}><IconX className="w-4 h-4" /></button>
            </div>
            <div className="p-[14px_22px] border-b border-border bg-card sticky top-0 z-10">
              <input
                type="text" placeholder="Search country…"
                className="w-full p-[12px_16px] rounded-[14px] border border-border bg-muted/40 outline-none focus:border-primary"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
            </div>
            <div className="flex flex-1 overflow-hidden">
              <div className="overflow-y-auto p-[10px_22px] flex-1 bg-card">
                {Object.keys(groupedCountries).length > 0 ? (
                  Object.keys(groupedCountries).sort().map((letter) => (
                    <section key={letter} id={`group-${letter}`} className="py-2">
                      <div className="sticky -top-px bg-card/95 pb-1.5 pt-2 text-[11px] font-extrabold tracking-[0.12em] uppercase text-muted-foreground z-10">{letter}</div>
                      {groupedCountries[letter].map((country) => {
                        const isActive = (pickerTarget === "origin" ? origin : destination) === country;
                        return (
                          <button
                            key={country}
                            className={`w-full border border-transparent bg-transparent rounded-[14px] p-[12px_14px] text-left flex justify-between items-center cursor-pointer transition-colors ${isActive ? "bg-primary/8 border-primary/20" : "hover:bg-muted/50"}`}
                            onClick={() => {
                              if (pickerTarget === "origin") setOrigin(country);
                              else setDestination(country);
                              setIsModalOpen(false);
                            }}
                          >
                            <span className={`text-[14px] ${isActive ? "font-bold text-primary" : "text-foreground"}`}>{country}</span>
                          </button>
                        );
                      })}
                    </section>
                  ))
                ) : (
                  <div className="py-6 text-center text-muted-foreground">No countries found.</div>
                )}
              </div>
              <div className="flex border-l border-border bg-muted/30 flex-col items-center justify-start gap-1 p-[20px_4px] w-[40px] md:w-[52px] shrink-0 overflow-y-auto">
                {Object.keys(groupedCountries).sort().map((letter) => (
                  <button
                    key={letter}
                    className="bg-transparent border-0 p-[2px_4px] text-[11px] text-muted-foreground cursor-pointer rounded-[6px] hover:bg-muted hover:text-foreground transition-colors"
                    onClick={() => document.getElementById(`group-${letter}`)?.scrollIntoView({ behavior: "smooth", block: "start" })}
                  >
                    {letter}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PricingSection() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4 mx-auto" />
        <h2 className="text-xl font-bold mb-2">Loading Pricing…</h2>
        <p className="text-muted-foreground">Preparing your personalized plan options.</p>
      </div>
    }>
      <PricingContent />
    </Suspense>
  );
}   </Suspense>
  );
}