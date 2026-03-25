"use client";

import React, { useEffect, useState, useMemo } from "react";
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
// import { useLanguage } from "@/app/context/LanguageContext";

function IconCheck({ className, style }: { className?: string; style?: any }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={className}
      style={style}
    >
      <path d="M4 10l4 4 8-8"></path>
    </svg>
  );
}

function IconX({ className, style }: { className?: string; style?: any }) {
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
      <path d="M15 5L5 15M5 5l10 10"></path>
    </svg>
  );
}

function statusClass(text: string) {
  const t = text.toLowerCase();
  if (
    ["included"].includes(t) ||
    t.includes("dedicated") ||
    t.includes("standard")
  )
    return "bg-primary-pale text-primary border-primary/20";
  if (t.includes("priority")) return "bg-blue-50 text-blue-700 border-blue-200";
  if (t.includes("not included"))
    return "bg-muted/50 text-muted-foreground border-border";
  if (
    t.includes("1 included") ||
    t.includes("2 included") ||
    t.includes("3 included") ||
    t.includes("add-on") ||
    t.includes("discounted") ||
    t.includes("credit")
  )
    return "bg-muted text-foreground border-border";
  return "bg-muted text-muted-foreground border-border";
}

export default function PricingSection() {
  // const { t } = useLanguage();
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  const [origin, setOrigin] = useState("Pakistan");
  const [destination, setDestination] = useState("United States");
  const [visa, setVisa] = useState("IR-1 / CR-1");
  const [selectedPlan, setSelectedPlan] = useState("premium");
  const [selectedAddons, setSelectedAddons] = useState<Set<string>>(new Set());
  const [differencesOnly, setDifferencesOnly] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<"origin" | "destination">(
    "origin",
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeStep, setActiveStep] = useState<"plans" | "addons">("plans");
  const [openFaqIndex, setOpenFaqIndex] = useState<number>(0);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }: any) => {
      setUserId(data.user?.id || null);
      setIsLoadingUser(false);
    });
  }, []);

  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
  }, [isModalOpen]);

  const toggleAddon = (id: string) => {
    const nextAddons = new Set(selectedAddons);
    if (nextAddons.has(id)) nextAddons.delete(id);
    else nextAddons.add(id);
    setSelectedAddons(nextAddons);
  };

  const activeVisaCategory = useMemo(() => {
    return VISA_CATEGORIES.find((v) => v.id === visa) || VISA_CATEGORIES[0];
  }, [visa]);

  const activePlans = activeVisaCategory.plans;

  const currentPlanData =
    activePlans.find((p) => p.id === selectedPlan) || activePlans[1];
  const activeAddons = ADDONS.filter((a) => selectedAddons.has(a.id));
  const summaryTotal =
    currentPlanData.price + activeAddons.reduce((sum, a) => sum + a.price, 0);

  const groupedCountries = useMemo(() => {
    const lowerSearch = searchQuery.toLowerCase();
    const filtered = COUNTRIES.filter((c) =>
      c.toLowerCase().includes(lowerSearch),
    );
    const groups: Record<string, string[]> = {};
    filtered.forEach((c) => {
      const letter = c[0].toUpperCase();
      if (!groups[letter]) groups[letter] = [];
      groups[letter].push(c);
    });
    return groups;
  }, [searchQuery]);

  const containerClass = "max-w-[1180px] mx-auto px-4 md:px-6";
  const eyebrowClass =
    "text-[12px] tracking-[0.14em] uppercase font-bold text-primary mb-3";
  const h1Class =
    "text-[clamp(38px,6vw,68px)] leading-[1.02] tracking-tight mb-[18px] font-bold";
  const h2Class =
    "text-[24px] md:text-[30px] font-bold leading-tight tracking-tight m-0";

  // const ghostBtn =
  //   "px-[14px] py-[10px] bg-transparent text-muted-foreground rounded-full hover:bg-card hover:border-border border border-transparent transition-colors cursor-pointer text-sm font-medium";
  const solidBtn =
    "px-[18px] py-[12px] bg-primary text-white rounded-full hover:bg-primary-dark transition-colors border border-transparent cursor-pointer font-medium text-center inline-block";
  const outlineBtn =
    "px-[18px] py-[12px] bg-card border border-border text-foreground rounded-full hover:border-border hover:bg-card transition-colors cursor-pointer font-medium text-center inline-block";
  const miniBtn =
    "px-[14px] py-[10px] bg-card border border-border text-foreground rounded-full hover:border-border hover:bg-card transition-colors cursor-pointer text-sm font-medium shrink-0";

  return (
    <div className="min-h-screen text-foreground font-sans selection:bg-primary/20 pb-[48px]">
      {activeStep === "plans" && (
        <section className="pt-10 md:pt-16 pb-7">
          <div className={containerClass}>
            <div className={eyebrowClass}>Plain Pricing</div>
            <h1 className={h1Class}>
              Choose the support level that fits your journey
            </h1>
            {/* <p className="max-w-[760px] text-[17px] leading-[1.65] text-muted-foreground m-0">
            Use the roadmap for free. Upgrade for automation, review coverage,
            and higher-touch support. This version is built around Pakistan to
            United States IR-1 / CR-1, while the structure is ready for more
            origins, destinations, and visa categories.
          </p> */}
            <div className="mt-[14px] text-[13px] text-muted-foreground">
              Government filing fees, medical examination fees, embassy fees,
              and any other applicable charges are paid separately and are not
              included in the total cost.
            </div>

            <div className="mt-[30px] bg-card border border-border rounded-[24px] shadow-lg overflow-hidden">
              <div className="p-[18px_22px] border-b border-border flex md:items-center justify-between gap-3 bg-gradient-to-b from-card to-muted flex-col md:flex-row items-start">
                <div className="text-[13px] font-bold tracking-[0.08em] uppercase text-muted-foreground">
                  Journey Context
                </div>
                {/* <div className="inline-flex items-center gap-2.5 px-3 py-2 rounded-full bg-muted border border-border text-muted-foreground text-[12px] font-bold tracking-[0.08em] uppercase">
                Structured for future countries and visa pathways
              </div> */}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3">
                <div className="p-[22px] border-b md:border-b-0 md:border-r border-border">
                  <div className="text-[12px] text-muted-foreground mb-2.5">
                    Origin Country
                  </div>
                  <button
                    className="w-full p-[16px_18px] border border-border rounded-[16px] bg-card flex justify-between items-center text-left gap-2.5 cursor-pointer hover:border-border transition-colors group"
                    onClick={() => {
                      setPickerTarget("origin");
                      setSearchQuery(origin);
                      setIsModalOpen(true);
                    }}
                  >
                    <div>
                      <div className="font-[650] text-[16px] group-hover:text-primary transition-colors">
                        {origin}
                      </div>
                      {/* <div className="text-[12px] text-muted-foreground mt-0.5">
                      Country where the applicant is applying from
                    </div> */}
                    </div>
                    <svg
                      className="w-[18px] h-[18px] opacity-60 shrink-0"
                      viewBox="0 0 20 20"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    >
                      <path d="m5 7 5 6 5-6"></path>
                    </svg>
                  </button>
                </div>
                <div className="p-[22px] border-b md:border-b-0 md:border-r border-border">
                  <div className="text-[12px] text-muted-foreground mb-2.5">
                    Destination Country
                  </div>
                  <button
                    className="w-full p-[16px_18px] border border-border rounded-[16px] bg-card flex justify-between items-center text-left gap-2.5 cursor-pointer hover:border-border transition-colors group"
                    onClick={() => {
                      setPickerTarget("destination");
                      setSearchQuery(destination);
                      setIsModalOpen(true);
                    }}
                  >
                    <div>
                      <div className="font-[650] text-[16px] group-hover:text-primary transition-colors">
                        {destination}
                      </div>
                      {/* <div className="text-[12px] text-muted-foreground mt-0.5">
                      Country where the immigration outcome is sought
                    </div> */}
                    </div>
                    <svg
                      className="w-[18px] h-[18px] opacity-60 shrink-0"
                      viewBox="0 0 20 20"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    >
                      <path d="m5 7 5 6 5-6"></path>
                    </svg>
                  </button>
                </div>
                <div className="p-[22px]">
                  <div className="text-[12px] text-muted-foreground mb-2.5">
                    Visa Category
                  </div>
                  <div className="relative">
                    <select
                      className="w-full p-[16px_18px] border border-border rounded-[16px] bg-card flex justify-between items-center text-left gap-2.5 cursor-pointer hover:border-border transition-colors appearance-none font-[650] text-[16px] outline-none"
                      value={visa}
                      onChange={(e) => setVisa(e.target.value)}
                    >
                      {VISA_CATEGORIES.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.label}
                        </option>
                      ))}
                    </select>
                    <svg
                      className="w-[18px] h-[18px] opacity-60 shrink-0 absolute right-[18px] top-1/2 -translate-y-1/2 pointer-events-none"
                      viewBox="0 0 20 20"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    >
                      <path d="m5 7 5 6 5-6"></path>
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 flex-wrap mt-[24px]">
              <button
                className={solidBtn}
                onClick={() => {
                  setActiveStep("plans");
                  document
                    .getElementById("plans")
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                Compare Plans
              </button>
              <button
                className={outlineBtn}
                onClick={() => {
                  setActiveStep("plans");
                  document
                    .getElementById("comparison")
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                See Full Comparison
              </button>
            </div>
          </div>
        </section>
      )}

      <main>
        {activeStep === "plans" && (
          <div className="animate-in fade-in duration-300">
            <section id="plans" className="py-8">
              <div className={containerClass}>
                <div className="flex flex-col md:flex-row justify-between md:items-end mb-[18px] gap-5">
                  <div>
                    <div className={eyebrowClass}>Step 1</div>
                    <h2 className={h2Class}>Select your plan</h2>
                    <p className="mt-1.5 text-muted-foreground text-[14px]">
                      Add-ons come on the next step after the plan is selected.
                    </p>
                  </div>
                  <div className="inline-flex items-center gap-[10px] px-3 py-2 rounded-full bg-muted border border-border text-muted-foreground text-[12px] font-bold tracking-[0.08em] uppercase">
                    {origin} → {destination} · {visa}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {activePlans.map((plan) => (
                    <article
                      key={plan.id}
                      className={`bg-card border rounded-[24px] p-[22px] flex flex-col relative transition-all ${
                        selectedPlan === plan.id
                          ? "border-primary shadow-xl z-10"
                          : "border-border shadow-sm hover:border-border"
                      } ${plan.recommended && selectedPlan !== plan.id ? "ring-2 ring-primary" : ""}`}
                    >
                      {plan.recommended && (
                        <div className="absolute top-3.5 right-3.5 bg-primary-pale text-primary border border-primary/20 rounded-full px-2.5 py-1.5 text-[11px] font-bold tracking-[0.08em] uppercase">
                          Popular
                        </div>
                      )}
                      <div className="text-[14px] font-extrabold tracking-widest uppercase text-muted-foreground mb-2.5">
                        {plan.name}
                      </div>
                      <div className="text-[44px] leading-none font-bold tracking-tight mb-2">
                        {plan.price ? `$${plan.price}` : "$0"}
                        {plan.price > 0 && (
                          <small className="text-[14px] font-sans text-muted-foreground font-semibold ml-1">
                            per journey
                          </small>
                        )}
                      </div>
                      <div className="text-muted-foreground text-[14px] leading-[1.55] mb-[18px] min-h-[64px]">
                        {plan.tagline}
                      </div>
                      <ul className="list-none p-0 m-[0_0_20px] grid gap-2.5 flex-1">
                        {plan.bullets.map((item, idx) => (
                          <li
                            key={idx}
                            className="flex gap-2.5 items-start text-[14px] leading-[1.45]"
                          >
                            <IconCheck className="w-4 h-4 flex-[0_0_16px] text-primary mt-[2px]" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="flex gap-2.5 mt-auto w-full">
                        {plan.id === "free" ? (
                          <Link
                            href={userId ? "/" : "/signup"}
                            className="w-full"
                          >
                            <button
                              className={`${outlineBtn} w-full`}
                              type="button"
                            >
                              {plan.cta}
                            </button>
                          </Link>
                        ) : (
                          <button
                            className={`${plan.id === selectedPlan ? "bg-primary text-white hover:bg-primary-dark" : "bg-card border-border text-foreground hover:border-border hover:bg-muted/30"} w-full px-[18px] py-[12px] rounded-full transition-colors border font-medium border-solid ${plan.id !== selectedPlan ? "border" : "border-transparent"}`}
                            type="button"
                            onClick={() => setSelectedPlan(plan.id)}
                          >
                            {plan.id === selectedPlan ? "Selected" : plan.cta}
                          </button>
                        )}
                      </div>
                    </article>
                  ))}
                </div>

                <div className="mt-10 flex justify-center w-full">
                  <button
                    className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary text-white text-[16px] font-bold rounded-full shadow-lg hover:shadow-xl hover:bg-primary-dark hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
                    onClick={() => {
                      setActiveStep("addons");
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                  >
                    Proceed to Step 2: Add-ons
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>

                <div className="flex flex-col md:flex-row justify-between md:items-end mt-[28px]">
                  <div>
                    <h2 className="text-[24px] font-bold m-0">
                      Which plan is right for you?
                    </h2>
                    <p className="mt-1.5 text-muted-foreground text-[14px]">
                      Use this if you want a faster way to decide.
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-[18px]">
                  {HELPER_DATA.map((card, idx) => (
                    <button
                      key={idx}
                      className={`bg-card border rounded-[20px] p-[18px] cursor-pointer text-left transition-colors ${selectedPlan === card.plan ? "border-primary bg-muted/30" : "border-border hover:border-border"}`}
                      onClick={() => setSelectedPlan(card.plan)}
                    >
                      <strong className="block text-[15px] mb-2 text-foreground">
                        {card.title}
                      </strong>
                      <p className="m-[0_0_10px] text-muted-foreground text-[14px] leading-[1.55]">
                        {card.copy}
                      </p>
                      <span className="text-[13px] font-bold text-primary">
                        Use {activePlans.find((p) => p.id === card.plan)?.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </section>

            <section id="comparison" className="py-[34px]">
              <div className={containerClass}>
                <div className="flex flex-col md:flex-row justify-between md:items-end mb-[18px] gap-5">
                  <div className={eyebrowClass}>Comparison Table</div>
                  <div className="flex items-center gap-3 bg-muted/30 border border-border rounded-full px-4 py-2">
                    <span className="text-sm font-medium text-muted-foreground">
                      Show Differences Only
                    </span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={differencesOnly}
                      onClick={() => setDifferencesOnly(!differencesOnly)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                        differencesOnly ? "bg-primary" : "bg-border"
                      }`}
                    >
                      <span className="sr-only">Show Differences Only</span>
                      <span
                        aria-hidden="true"
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          differencesOnly ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                </div>
                <div className="bg-card border border-border rounded-[24px] overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                      <thead>
                        <tr>
                          {[
                            "Feature",
                            // "Signed-in Free",
                            "Basic",
                            "Premium",
                            "Executive",
                          ].map((h, i) => (
                            <th
                              key={i}
                              className={`p-[14px_16px] border-b border-border text-[12px] tracking-widest uppercase text-muted-foreground bg-muted/30 ${i !== 0 ? "text-center" : ""}`}
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {COMPARISON_GROUPS.map((group, gi) => {
                          const rows = differencesOnly
                            ? group.rows.filter(
                                (r) => new Set(r.slice(1)).size > 1,
                              )
                            : group.rows;
                          if (!rows.length) return null;
                          return (
                            <React.Fragment key={gi}>
                              <tr className="group-row">
                                <td
                                  colSpan={5}
                                  className="p-[14px_16px] bg-muted text-primary text-[12px] font-extrabold tracking-widest uppercase"
                                >
                                  {group.label}
                                </td>
                              </tr>
                              {rows.map((row, ri) => (
                                <tr key={ri} className="hover:bg-slate-50/50">
                                  {row.map((val, vi) => (
                                    <td
                                      key={vi}
                                      className={`p-[14px_16px] border-b border-border align-middle text-[14px] ${vi !== 0 ? "text-center" : ""}`}
                                    >
                                      {vi === 0 ? (
                                        val
                                      ) : val.toLowerCase() === "included" ? (
                                        <IconCheck className="w-5 h-5 mx-auto text-primary" />
                                      ) : val.toLowerCase() ===
                                        "not included" ? (
                                        <IconX className="w-5 h-5 mx-auto text-red-600" />
                                      ) : (
                                        <span
                                          className={`inline-block px-2.5 py-1.5 rounded-full text-[12px] font-bold border ${statusClass(val)}`}
                                        >
                                          {val}
                                        </span>
                                      )}
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

            {/* <section className="py-[34px]">
              <div className={containerClass}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-[18px]">
                  <div className="bg-card border border-border rounded-[22px] p-[22px]">
                    <h3 className="m-[0_0_14px] text-[18px] font-bold">
                      What your plan includes
                    </h3>
                    <ul className="list-none p-0 m-0 grid gap-2.5">
                      <li className="flex gap-2.5 text-muted-foreground text-[14px] leading-normal">
                        <IconCheck className="w-4 h-4 flex-[0_0_16px] mt-0.5 text-primary" />{" "}
                        Structured roadmap, checklisting, and visa-stage
                        guidance
                      </li>
                      <li className="flex gap-2.5 text-muted-foreground text-[14px] leading-normal">
                        <IconCheck className="w-4 h-4 flex-[0_0_16px] mt-0.5 text-primary" />{" "}
                        Guided workflows for core forms and document readiness
                      </li>
                      <li className="flex gap-2.5 text-muted-foreground text-[14px] leading-normal">
                        <IconCheck className="w-4 h-4 flex-[0_0_16px] mt-0.5 text-primary" />{" "}
                        Review coverage and support levels based on the tier you
                        choose
                      </li>
                      <li className="flex gap-2.5 text-muted-foreground text-[14px] leading-normal">
                        <IconCheck className="w-4 h-4 flex-[0_0_16px] mt-0.5 text-primary" />{" "}
                        Pakistan civil document guidance for the applicable
                        journey
                      </li>
                    </ul>
                  </div>
                  <div className="bg-card border border-border rounded-[22px] p-[22px]">
                    <h3 className="m-[0_0_14px] text-[18px] font-bold">
                      What is separate
                    </h3>
                    <ul className="list-none p-0 m-0 grid gap-2.5">
                      <li className="flex gap-2.5 text-muted-foreground text-[14px] leading-normal">
                        <svg
                          viewBox="0 0 20 20"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          className="w-4 h-4 flex-[0_0_16px] mt-0.5 text-muted-foreground"
                        >
                          <path d="M5 10h10"></path>
                        </svg>
                        USCIS, NVC, and embassy filing fees
                      </li>
                      <li className="flex gap-2.5 text-muted-foreground text-[14px] leading-normal">
                        <svg
                          viewBox="0 0 20 20"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          className="w-4 h-4 flex-[0_0_16px] mt-0.5 text-muted-foreground"
                        >
                          <path d="M5 10h10"></path>
                        </svg>
                        Immigration medical exam costs
                      </li>
                      <li className="flex gap-2.5 text-muted-foreground text-[14px] leading-normal">
                        <svg
                          viewBox="0 0 20 20"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          className="w-4 h-4 flex-[0_0_16px] mt-0.5 text-muted-foreground"
                        >
                          <path d="M5 10h10"></path>
                        </svg>
                        Services the user adds on in Step 2, such as extra mock
                        sessions or additional translation
                      </li>
                      <li className="flex gap-2.5 text-muted-foreground text-[14px] leading-normal">
                        <svg
                          viewBox="0 0 20 20"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          className="w-4 h-4 flex-[0_0_16px] mt-0.5 text-muted-foreground"
                        >
                          <path d="M5 10h10"></path>
                        </svg>
                        Legal representation or legal advice
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </section> */}

            <section className="py-[34px]">
              <div className={containerClass}>
                <div className="flex flex-col md:flex-row justify-between mb-[18px] gap-5">
                  <div>
                    <h2 className={h2Class}>Common questions</h2>
                    <p className="mt-1.5 text-muted-foreground text-[14px]">
                      Short answers for the things a buyer usually checks before
                      purchase.
                    </p>
                  </div>
                </div>
                <div className="bg-card border border-border rounded-[24px] overflow-hidden">
                  {FAQS.map(([q, a], idx) => (
                    <div
                      key={idx}
                      className={`border-t border-border first:border-0 ${openFaqIndex === idx ? "bg-muted/30" : ""}`}
                    >
                      <button
                        className="w-full bg-transparent border-0 p-[18px_20px] flex justify-between items-center gap-4 text-left cursor-pointer font-[650] hover:bg-muted/50 transition-colors"
                        onClick={() =>
                          setOpenFaqIndex(openFaqIndex === idx ? -1 : idx)
                        }
                      >
                        <span className="text-[16px]">{q}</span>
                        <span className="text-xl text-muted-foreground font-normal leading-none">
                          {openFaqIndex === idx ? "−" : "+"}
                        </span>
                      </button>
                      {openFaqIndex === idx && (
                        <div className="p-[0_20px_18px] text-muted-foreground leading-[1.65] text-[14px]">
                          {a}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="py-[34px]">
              <div className={containerClass}>
                <div className="bg-primary rounded-[28px] p-[34px] text-white flex flex-col lg:flex-row justify-between gap-5 lg:items-center">
                  <div>
                    <h2 className="m-[0_0_8px] text-[28px] lg:text-[36px] leading-[1.08] font-bold tracking-tight">
                      Start with the level of support that fits you.
                    </h2>
                    <p className="m-0 text-white/80 leading-[1.6]">
                      Pick a plan now, then add only the extras that actually
                      apply to your case on the next step.
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <button
                      className="px-[18px] py-[12px] bg-card border border-transparent text-primary rounded-full hover:bg-primary-pale transition-colors cursor-pointer font-medium text-center"
                      onClick={() => {
                        document
                          .getElementById("plans")
                          ?.scrollIntoView({ behavior: "smooth" });
                      }}
                    >
                      Review Plans
                    </button>
                    <Link href="/#contact" className="inline-flex">
                      <button className="px-[18px] py-[12px] bg-transparent border border-white/35 text-white rounded-full hover:bg-card/10 transition-colors cursor-pointer font-medium text-center">
                        Talk to Support
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {activeStep === "addons" && (
          <div className="animate-in fade-in duration-300">
            <section id="addonsStep" className="py-[34px]">
              <div className={containerClass}>
                <div className="flex flex-col md:flex-row justify-between md:items-end mb-[18px] gap-5">
                  <div>
                    <div className={eyebrowClass}>Step 2</div>
                    <h2 className={h2Class}>Add-ons for this journey</h2>
                    {/* <p className="mt-1.5 text-muted-foreground text-[14px]">
                      The core plan stays clean. Extra services are chosen only
                      after the plan is selected.
                    </p> */}
                  </div>
                  <button
                    className={outlineBtn}
                    onClick={() => setActiveStep("plans")}
                  >
                    Back to Plans
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-[22px] items-start">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {ADDONS.map((addon) => {
                      const isSelected = selectedAddons.has(addon.id);
                      return (
                        <article
                          key={addon.id}
                          className={`bg-card border rounded-[22px] p-[18px] flex flex-col gap-2.5 transition-all ${isSelected ? "border-primary shadow-lg" : "border-border"}`}
                        >
                          <div className="flex justify-between items-start gap-3">
                            {/* <div className="rounded-[12px] bg-primary-pale flex items-center justify-center text-primary"> */}
                            {/* <IconCheck className="w-5 h-5" /> */}
                            <div className="text-[18px] font-[750] text-foreground mt-1">
                              {addon.title}
                            </div>
                            {/* </div> */}
                            <div className="text-right">
                              <div className="font-bold text-[28px] tracking-tight leading-none mb-1">
                                ${addon.price}
                              </div>
                              <div className="text-[12px] text-muted-foreground">
                                {addon.unit}
                              </div>
                            </div>
                          </div>

                          <div className="text-muted-foreground text-[14px] leading-[1.55] flex-1">
                            {addon.copy}
                          </div>
                          <div className="text-[12px] text-muted-foreground mt-2 mb-3 px-3 py-2 bg-muted/30 rounded-lg border border-border flex items-start">
                            <span className="font-bold uppercase tracking-wider text-[10px] mr-2 mt-0.5 opacity-80 shrink-0">
                              Note:
                            </span>
                            <span>
                              {(addon as { note?: string }).note ||
                                "Expires at the End of Journey"}
                            </span>
                          </div>
                          <button
                            className={`w-full px-[18px] py-[12px] rounded-full transition-colors border font-medium ${isSelected ? "bg-primary text-white border-transparent hover:bg-primary-dark" : "bg-card border-border text-foreground hover:border-border"}`}
                            onClick={() => toggleAddon(addon.id)}
                          >
                            {isSelected ? "Added" : "Add to Order"}
                          </button>
                        </article>
                      );
                    })}
                  </div>

                  <aside className="lg:sticky top-[92px] bg-card border border-border rounded-[24px] p-[22px] shadow-lg">
                    <h3 className="m-[0_0_16px] text-[15px] uppercase tracking-widest text-muted-foreground font-sans font-bold">
                      Order Summary
                    </h3>

                    <div className="flex justify-between gap-3 py-2.5 border-b border-dashed border-border text-[14px]">
                      <span>Journey</span>
                      <strong>
                        {origin} → {destination}
                      </strong>
                    </div>
                    <div className="flex justify-between gap-3 py-2.5 border-b border-dashed border-border text-[14px]">
                      <span>Visa Category</span>
                      <strong>{visa}</strong>
                    </div>
                    <div className="flex justify-between gap-3 py-2.5 border-b border-dashed border-border text-[14px]">
                      <span>Plan</span>
                      <strong>
                        {currentPlanData.name} (${currentPlanData.price})
                      </strong>
                    </div>

                    {activeAddons.map((a) => (
                      <div
                        key={a.id}
                        className="flex justify-between gap-3 py-2.5 border-b border-dashed border-border text-[14px]"
                      >
                        <span>{a.title}</span>
                        <strong>${a.price}</strong>
                      </div>
                    ))}

                    <div className="flex justify-between items-end mt-4 pt-4 border-t border-border">
                      <strong className="text-[14px] mb-[2px]">Total</strong>
                      <span className="font-bold text-[34px] tracking-tight text-primary leading-none">
                        ${summaryTotal}
                      </span>
                    </div>
                    <div className="text-[12px] text-muted-foreground leading-normal mt-3 mb-[18px]">
                      One-time purchase for this journey. Government fees remain
                      separate.
                    </div>

                    <div className="flex flex-col gap-2.5">
                      {isLoadingUser ? (
                        <button
                          disabled
                          className={`${solidBtn} w-full opacity-50 cursor-not-allowed`}
                        >
                          Loading...
                        </button>
                      ) : userId ? (
                        <CheckoutButton
                          productTier={selectedPlan}
                          addons={Array.from(selectedAddons)}
                          visaCategory={visa}
                          userId={userId}
                          className={`${solidBtn} w-full text-center block rounded-full! py-3 px-4 font-medium`}
                        >
                          Continue to Secure Checkout
                        </CheckoutButton>
                      ) : (
                        <Link
                          href="/login?redirect=/pricing"
                          className={`${solidBtn} w-full text-center block rounded-full! py-3 px-4 font-medium`}
                        >
                          Sign in to Checkout
                        </Link>
                      )}
                    </div>
                  </aside>
                </div>
              </div>
            </section>
          </div>
        )}
      </main>

      {isModalOpen && (
        <div className="fixed inset-0 bg-[#142225]/30 flex items-center justify-center p-3 md:p-6 z-50">
          <div
            className="w-full max-w-[920px] h-[min(86vh,760px)] md:h-[min(78vh,720px)] bg-card rounded-[28px] border border-border shadow-2xl flex overflow-hidden flex-col animate-in zoom-in-95 duration-200"
            role="dialog"
            aria-modal="true"
          >
            <div className="p-[20px_22px] border-b border-border flex justify-between items-center gap-3 bg-muted/30">
              <div>
                <div className="text-[20px] font-bold m-0">
                  {pickerTarget === "origin"
                    ? "Select Origin Country"
                    : "Select Destination Country"}
                </div>
              </div>
              <button className={miniBtn} onClick={() => setIsModalOpen(false)}>
                <IconX className="w-4 h-4" />
              </button>
            </div>
            <div className="p-[16px_22px] border-b border-border bg-card sticky top-0 z-10">
              <input
                type="text"
                placeholder="Search country"
                className="w-full p-[14px_16px] rounded-[16px] border border-border bg-muted/50 outline-none focus:border-primary"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
            </div>
            <div className="flex flex-1 overflow-hidden relative">
              <div
                className="overflow-y-auto p-[12px_22px] flex-1 bg-card"
                id="modal-list-scroll"
              >
                {Object.keys(groupedCountries).length > 0 ? (
                  Object.keys(groupedCountries)
                    .sort()
                    .map((letter) => (
                      <section
                        key={letter}
                        id={`group-${letter}`}
                        className="py-2.5"
                      >
                        <div className="sticky -top-px bg-card/95 pb-1.5 pt-2 text-[12px] font-extrabold tracking-[0.12em] uppercase text-muted-foreground z-10">
                          {letter}
                        </div>
                        {groupedCountries[letter].map((country) => {
                          const isActive =
                            (pickerTarget === "origin"
                              ? origin
                              : destination) === country;
                          return (
                            <button
                              key={country}
                              className={`w-full border border-transparent bg-transparent rounded-[16px] p-[14px_14px] text-left flex justify-between items-center cursor-pointer transition-colors ${isActive ? "bg-primary-pale border-primary/30" : "hover:bg-muted/50"}`}
                              onClick={() => {
                                if (pickerTarget === "origin")
                                  setOrigin(country);
                                else setDestination(country);
                                setIsModalOpen(false);
                              }}
                            >
                              <span
                                className={`text-[15px] ${isActive ? "font-bold text-primary" : "text-foreground"}`}
                              >
                                {country}
                              </span>
                              {/* <span
                                className={`text-[13px] ${isActive ? "font-bold text-primary" : "text-muted-foreground"}`}
                              >
                                {isActive ? "Selected" : "Choose"}
                              </span> */}
                            </button>
                          );
                        })}
                      </section>
                    ))
                ) : (
                  <div className="py-6 text-center text-muted-foreground">
                    No countries found.
                  </div>
                )}
              </div>

              <div className="flex border-l border-border bg-muted/30 flex-col items-center justify-start gap-1 p-[24px_4px] w-[40px] md:w-[54px] shrink-0 overflow-y-auto custom-scrollbar">
                {Object.keys(groupedCountries)
                  .sort()
                  .map((letter) => (
                    <button
                      key={letter}
                      className="bg-transparent border-0 p-[2px_4px] text-[11px] text-muted-foreground cursor-pointer rounded-[6px] hover:bg-muted hover:text-foreground transition-colors"
                      onClick={() => {
                        document
                          .getElementById(`group-${letter}`)
                          ?.scrollIntoView({
                            behavior: "smooth",
                            block: "start",
                          });
                      }}
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
