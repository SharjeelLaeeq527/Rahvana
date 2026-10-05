"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  CheckCircle2,
  ChevronDown,
  HelpCircle,
  Building2,
  MapPin,
  Search,
  ExternalLink,
  Info,
  Loader2,
  Landmark,
} from "lucide-react";
import { useLanguage } from "@/app/context/LanguageContext";
import { usePlan, normalizePlanTier } from "@/app/context/PlanContext";
import type { PlanTier } from "@/lib/entitlements/config";
import { ResultGate } from "@/app/components/entitlements/ResultGate";
import { QuickAccessButton } from "@/app/components/shared/QuickAccessButton";
import { CustomDropdown } from "@/app/components/shared/CustomDropdown";
import { useToast } from "@/app/components/shared/ToastProvider";
import { useCandidate } from "@/app/context/CandidateContext";
import type { ToolModeProps } from "@/types/tool-mode";
import { useResolveToolMode } from "@/lib/hooks/useResolveToolMode";

interface SchedulingResult {
  Post: string;
  "Visa Category": string;
  "Case Documentarily Complete": string;
}

interface CountryOption {
  country: string;
  embassies: SchedulingResult[];
  consulates: SchedulingResult[];
}

export interface DqStatusCheckToolProps extends ToolModeProps {
  showHeader?: boolean;
  className?: string;
}

function resolveDefaultVisaCategory(visaCat?: string): string {
  if (!visaCat) return "immediate-relative";
  const normalized = visaCat.toUpperCase();
  if (
    normalized.includes("IR") ||
    normalized.includes("CR") ||
    normalized.includes("IMMEDIATE")
  ) {
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
  const { showToast } = useToast();
  const candidateCtx = useCandidate();

  const candidateVisaCategory =
    candidateCtx?.activeCandidate?.visaCategory || journeyContext?.journeyCategory;

  const defaultCategory = useMemo(
    () => resolveDefaultVisaCategory(candidateVisaCategory),
    [candidateVisaCategory]
  );

  const [visaCategory, setVisaCategory] = useState<string>(defaultCategory);
  const [city, setCity] = useState<string>("Islamabad");
  const [results, setResults] = useState<SchedulingResult[] | null>(null);
  const [countryOptions, setCountryOptions] = useState<CountryOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Keep category in sync if active candidate changes in journey mode
  useEffect(() => {
    if (isJourney && candidateVisaCategory) {
      setVisaCategory(resolveDefaultVisaCategory(candidateVisaCategory));
    }
  }, [isJourney, candidateVisaCategory]);

  // Determine effective plan tier: in journey mode, evaluate against the specific journey's tier, otherwise account tier
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

  const resultsRef = useRef<HTMLDivElement>(null);

  const submitSearch = async (searchCity: string) => {
    if (!searchCity.trim()) {
      showToast(t("ivTool.cityError"), "error");
      return;
    }

    setLoading(true);
    setResults(null);
    setCountryOptions([]);
    setSearchTerm(searchCity);

    try {
      const response = await fetch("/api/iv-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city: searchCity, visaCategory }),
      });

      const data = await response.json();

      if (!response.ok) {
        showToast(data.error || t("ivTool.errors.fetch"), "error");
        return;
      }

      if (!data.success && (!data.data || data.data.length === 0)) {
        if (data.needsCountrySelection && data.countryOptions) {
          setCountryOptions(data.countryOptions);
        } else {
          showToast(data.message || t("ivTool.errors.noResults"), "error");
          setCountryOptions([]);
        }
        return;
      }

      setResults(data.data);
      setCountryOptions([]);
    } catch (err) {
      showToast(t("ivTool.errors.general"), "error");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitSearch(city);
  };

  useEffect(() => {
    if (results && resultsRef.current) {
      const offset = 100;
      const elementPosition = resultsRef.current.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  }, [results]);

  const handleSelectPost = (post: SchedulingResult) => {
    setResults([post]);
    setCountryOptions([]);
  };

  return (
    <div className={`w-full ${className}`}>
      <div className="mx-auto max-w-6xl">
        {/* Header (Standalone Hero) */}
        {showHeader && (
          <div className="mb-8 flex flex-col items-start justify-between gap-6 md:flex-row">
            <div className="max-w-3xl">
              <h1 className="mb-2 text-3xl font-bold tracking-tight text-[#121a28] md:text-4xl dark:text-slate-100">
                {t("ivTool.title") || "IV Scheduling Status Tool"}
              </h1>

              <p className="max-w-2xl text-[15px] leading-relaxed text-[#4b5563] dark:text-slate-300">
                {t("ivTool.subtitle") ||
                  "Check the current scheduling status for Immigrant Visa interviews at U.S. Embassies and Consulates. Find out which documentarily complete applications are currently being processed."}
              </p>
            </div>

            <div className="mx-auto md:mx-0">
              <QuickAccessButton
                item={{
                  id: "queue-watch",
                  title: "DQ Status Check",
                  href: "/iv-tool",
                  icon_name: "Clock",
                }}
              />
            </div>
          </div>
        )}

        {/* Main Grid */}
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
          <main className="min-w-0">
            {/* Search Card */}
            <div className="mb-8 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm md:p-7 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="mb-6 flex items-center gap-2 text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                <Search className="h-5 w-5 text-[#0d7377] dark:text-teal-400" aria-hidden="true" />
                {t("ivTool.findStatus") || "Find Your Scheduling Status"}
              </h2>

              <div className="space-y-6">
                <div>
                  <label className="mb-2 block text-xs font-semibold tracking-wide text-slate-700 dark:text-slate-300">
                    {t("ivTool.categoryLabel") || "Visa Category"}{" "}
                    <span className="text-rose-500">*</span>
                  </label>

                  <div className="relative">
                    <CustomDropdown
                      value={visaCategory}
                      onChange={(val) => setVisaCategory(val)}
                      options={[
                        {
                          value: "immediate-relative",
                          label: t("ivTool.categories.immediate") || "Immediate Relative",
                        },
                        {
                          value: "family-sponsored",
                          label:
                            t("ivTool.categories.family") || "Family-Sponsored Preference",
                        },
                        // {
                        //   value: "employment-based",
                        //   label:
                        //     t("ivTool.categories.employment") || "Employment-Based Preference",
                        // },
                      ]}
                      placeholder="Select visa category"
                      className="w-full [&_button]:h-auto [&_button]:min-h-12 [&_button]:w-full [&_button]:min-w-0 [&_button]:rounded-xl [&_button]:border-slate-200 [&_button]:bg-white [&_button]:px-3 [&_button]:py-3 [&_button]:text-left [&_button]:text-sm [&_button]:text-slate-800 dark:[&_button]:border-slate-700 dark:[&_button]:bg-slate-800 dark:[&_button]:text-slate-100"
                    />

                    <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold tracking-wide text-slate-700 dark:text-slate-300">
                    {t("ivTool.cityLabel") || "U.S. Embassy or Consulate City"}
                  </label>

                  <div className="relative flex items-center">
                    <div className="pointer-events-none absolute left-3.5 flex items-center text-[#0d7377] dark:text-teal-400">
                      <MapPin className="h-4 w-4" />
                    </div>
                    <input
                      type="text"
                      value="Islamabad, Pakistan (U.S. Embassy)"
                      disabled
                      readOnly
                      className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-100/90 py-3.5 pr-28 pl-10 text-sm font-medium text-slate-700 select-none shadow-none dark:border-slate-700/80 dark:bg-slate-800/80 dark:text-slate-200"
                    />
                    
                  </div>
                  <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                    Currently tracking U.S. Embassy Islamabad (designated immigrant visa post for Pakistan).
                  </p>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={loading || !city.trim()}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#00595C] px-6 py-3 text-sm font-semibold tracking-wide text-white transition-all hover:bg-[#095d61] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-45 sm:w-auto dark:bg-teal-700 dark:hover:bg-teal-600"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t("ivTool.loading") || "Checking Status..."}
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4" />
                      {t("ivTool.search") || "Check Status"}
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Suggestions Card if not found */}
            {countryOptions.length > 0 && !loading && (
              <div className="mb-8 rounded-2xl border border-amber-200 bg-amber-50/70 p-6 shadow-sm dark:border-amber-900/40 dark:bg-amber-950/20">
                <div className="mb-5 flex items-start gap-3">
                  <HelpCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />

                  <div>
                    <h3 className="mb-1 text-lg font-semibold text-amber-900 dark:text-amber-200">
                      {t("ivTool.suggestions.notfound", { city: searchTerm })}
                    </h3>

                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      {t("ivTool.suggestions.didYouMean")}
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  {countryOptions.map((option, idx) => (
                    <div
                      key={idx}
                      className="border-t border-amber-200 pt-5 first:border-t-0 first:pt-0 dark:border-amber-900/40"
                    >
                      <h4 className="mb-4 text-lg font-bold text-slate-900 dark:text-slate-100">
                        {option.country}
                      </h4>

                      {option.embassies.length > 0 && (
                        <div className="mb-5">
                          <div className="mb-3 flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-[#0d7377] dark:text-teal-400" />

                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                              {t("ivTool.suggestions.embassy")}
                            </span>
                          </div>

                          <div className="ml-6 space-y-2">
                            {option.embassies.map((embassy, eidx) => (
                              <button
                                key={eidx}
                                onClick={() => handleSelectPost(embassy)}
                                className="group w-full rounded-xl border border-teal-200 bg-teal-50/50 p-3 text-left transition-all hover:border-[#0d7377] hover:bg-teal-100/60 dark:border-teal-900/50 dark:bg-teal-950/30 dark:hover:bg-teal-900/40"
                              >
                                <p className="font-medium text-[#0d7377] dark:text-teal-300">
                                  {embassy.Post}
                                </p>

                                <p className="mt-1 text-xs text-teal-800 dark:text-teal-400">
                                  ✓ {t("ivTool.results.caseComplete")}:{" "}
                                  {embassy["Case Documentarily Complete"]}
                                </p>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {option.consulates.length > 0 && (
                        <div>
                          <div className="mb-3 flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-[#0d7377] dark:text-teal-400" />

                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                              {t("ivTool.suggestions.consulate")}
                            </span>
                          </div>

                          <div className="ml-6 space-y-2">
                            {option.consulates.map((consulate, cidx) => (
                              <button
                                key={cidx}
                                onClick={() => handleSelectPost(consulate)}
                                className="group w-full rounded-xl border border-teal-200 bg-teal-50/50 p-3 text-left transition-all hover:border-[#0d7377] hover:bg-teal-100/60 dark:border-teal-900/50 dark:bg-teal-950/30 dark:hover:bg-teal-900/40"
                              >
                                <p className="font-medium text-[#0d7377] dark:text-teal-300">
                                  {consulate.Post}
                                </p>

                                <p className="mt-1 text-xs text-teal-800 dark:text-teal-400">
                                  ✓ {t("ivTool.results.caseComplete")}:{" "}
                                  {consulate["Case Documentarily Complete"]}
                                </p>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {option.embassies.length === 0 && option.consulates.length === 0 && (
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {t("ivTool.suggestions.noPosts")}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Results Gate & Display */}
            {results && results.length > 0 && (
              <ResultGate feature="dq_status_check" planTier={effectiveTier}>
                <div ref={resultsRef} className="space-y-4 pt-1">
                  <div className="flex items-center gap-2 px-1 pb-1">
                    <CheckCircle2 className="h-5 w-5 text-[#0d7377] dark:text-teal-400" />

                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                      {t("ivTool.results.title")}
                    </h3>
                  </div>

                  {results.map((result, idx) => (
                    <div
                      key={idx}
                      className="relative isolate overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition-shadow hover:shadow-md md:p-7 dark:border-slate-800 dark:bg-slate-900"
                    >
                      {/* Decorative Shape */}
                      <div className="pointer-events-none absolute top-0 right-0 z-0 h-28 w-28 rounded-bl-[72px] bg-teal-500/5 dark:bg-teal-500/10" />

                      <div className="relative z-10">
                        <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-[#0d7377] dark:bg-teal-950/60 dark:text-teal-300">
                          <CheckCircle2 className="h-3 w-3" />
                          Result Found
                        </span>

                        <h4 className="mb-1 text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                          {result.Post}
                        </h4>

                        <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
                          {result["Visa Category"]}
                        </p>

                        <div className="rounded-xl border border-teal-100 bg-teal-50/40 px-5 py-6 text-center dark:border-teal-900/40 dark:bg-teal-950/20">
                          <span className="block text-sm text-slate-600 dark:text-slate-300">
                            Currently scheduling applicants Documentarily Complete in:
                          </span>

                          <p className="mt-2 text-3xl font-bold tracking-tight text-[#00595C] dark:text-teal-400">
                            {result["Case Documentarily Complete"]}
                          </p>
                        </div>

                        <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-slate-200/80 bg-slate-50 px-4 py-3.5 text-[12px] leading-relaxed text-slate-600 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300">
                          <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#0d7377] dark:text-teal-400" />

                          <p>
                            If your case was Documentarily Complete in or before this month, you
                            should receive an interview notice soon.
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ResultGate>
            )}
          </main>

          {/* Educational Sidebar / Official Resources */}
          <aside className="space-y-6">
            <section className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900/70">
              <div className="mb-3 flex items-start gap-2.5">
                <HelpCircle className="mt-0.5 h-5 w-5 shrink-0 text-slate-600 dark:text-slate-400" />

                <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  What does &quot;Documentarily Complete&quot; mean?
                </h2>
              </div>

              <div className="space-y-3 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                <p>
                  A case is considered &quot;Documentarily Complete&quot; when the National Visa
                  Center (NVC) has received all required forms, civil documents, and financial
                  evidence, and has reviewed them for completeness.
                </p>
              </div>

              <div className="mt-4 h-1 rounded-full bg-linear-to-r from-[#0d7377] via-[#55aaa8] to-[#8bd7d3]" />
            </section>

            <section className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900/70">
              <h3 className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
                <Landmark className="h-4 w-4 text-[#0d7377] dark:text-teal-400" /> Official Resources
              </h3>
              <div className="mt-3 space-y-2.5">
                <a
                  href="https://travel.state.gov/content/travel/en/us-visas/visa-information-resources/iv-wait-times.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs font-medium text-[#0d7377] transition-opacity hover:opacity-75 dark:text-teal-400"
                >
                  NVC Processing Timeframes <ExternalLink className="h-3 w-3" />
                </a>
                <a
                  href="https://travel.state.gov/content/travel/en/legal/visa-law0/visa-bulletin.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs font-medium text-[#0d7377] transition-opacity hover:opacity-75 dark:text-teal-400"
                >
                  Visa Bulletin <ExternalLink className="h-3 w-3" />
                </a>
                <a
                  href="https://travel.state.gov/content/travel/en/us-visas/visa-information-resources/list-of-posts.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs font-medium text-[#0d7377] transition-opacity hover:opacity-75 dark:text-teal-400"
                >
                  U.S. Embassy Locator <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
