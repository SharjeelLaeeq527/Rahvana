"use client";

import { useState, useEffect, useRef } from "react";
import {
  AlertCircle,
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
import { QuickAccessButton } from "@/app/components/shared/QuickAccessButton";
import { CustomDropdown } from "@/app/components/shared/CustomDropdown";
import LocationAutocomplete from "@/app/components/shared/LocationAutoComplete";
import { useToast } from "@/app/components/shared/ToastProvider";

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

export default function Home() {
  const { t } = useLanguage();
  const [visaCategory, setVisaCategory] = useState<string>("immediate-relative");
  const [city, setCity] = useState<string>("");
  const [results, setResults] = useState<SchedulingResult[] | null>(null);
  const [countryOptions, setCountryOptions] = useState<CountryOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState<string>("");

  const { showToast } = useToast();

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

      if (!data.success && data.data.length === 0) {
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

  const resultsRef = useRef<HTMLDivElement>(null);

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
    <div className="guide-grid-bg mt-10 min-h-screen bg-[#f5f7fb] px-5 py-12 text-[#18212f] sm:px-8 lg:px-12 lg:py-14">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col items-start justify-between gap-6 md:flex-row">
          <div className="max-w-3xl">
            <h1 className="mb-2 text-3xl font-bold tracking-tight text-[#121a28] md:text-4xl">
              IV Scheduling Status Tool
            </h1>

            <p className="max-w-2xl text-[15px] leading-relaxed text-[#4b5563]">
              Check the current scheduling status for Immigrant Visa interviews at U.S. Embassies
              and Consulates. Find out which documentarily complete applications are currently being
              processed.
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

        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_288px]">
          <main className="min-w-0">
            <div className="mb-8 rounded-2xl border border-[#edf0f5] bg-[#ffffff] p-6 shadow-[0_8px_24px_rgba(35,53,78,0.05)] md:p-7">
              <h2 className="mb-7 flex items-center gap-2 text-xl font-semibold tracking-tight text-[#18212f]">
                <Search className="h-5 w-5 text-[#0d7377]" aria-hidden="true" />
                Find Your Scheduling Status
              </h2>

              <div className="space-y-6">
                <div>
                  <label className="mb-2 block text-xs font-semibold tracking-wide text-[#384252]">
                    Visa Category <span className="text-[#db8090]">*</span>
                  </label>

                  <div className="relative">
                    <CustomDropdown
                      value={visaCategory}
                      onChange={(val) => setVisaCategory(val)}
                      options={[
                        {
                          value: "immediate-relative",
                          label: "Immediate Relative",
                        },
                        {
                          value: "family-sponsored",
                          label: "Family-Sponsored Preference",
                        },
                      ]}
                      placeholder="Select visa category"
                      className="w-full [&_button]:h-auto [&_button]:min-h-12 [&_button]:w-full [&_button]:min-w-0 [&_button]:rounded-xl [&_button]:border-[#cbd3d8] [&_button]:bg-white [&_button]:px-3 [&_button]:py-3 [&_button]:text-left [&_button]:text-sm [&_button]:text-[#263342]"
                    />

                    <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-[#52606b]" />
                  </div>
                </div>

                <div className="relative">
                  <LocationAutocomplete
                    formData={{ city }}
                    setFormData={(data) => {
                      setCity((data.city as string) ?? "");
                    }}
                    valueKey="city"
                    type="city"
                    label="U.S. Embassy or Consulate City"
                    required
                    icon={<MapPin className="h-4 w-4" />}
                    placeholder="e.g., Islamabad, Pakistan"
                    inputClassName="w-full rounded-xl border border-[#cbd3d8] bg-[#ffffff] py-3.5 pr-10 pl-10 text-sm text-[#263342] shadow-none transition-colors outline-none placeholder:text-[#7a838c] focus:border-[#0d7377] focus:ring-2 focus:ring-[#0d7377]/10"
                  />
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={loading || !city.trim()}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#00595C] px-6 py-3 text-sm font-semibold tracking-wide text-[#ffffff] transition-all hover:bg-[#095d61] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-45 sm:w-auto"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Checking Status...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4" />
                      Check Status
                    </>
                  )}
                </button>
              </div>
            </div>

            {countryOptions.length > 0 && !loading && (
              <div className="mb-8 rounded-2xl border border-[#f0dfb4] bg-[#fffaf0] p-6 shadow-[0_8px_24px_rgba(113,87,28,0.05)]">
                <div className="mb-5 flex items-start gap-3">
                  <HelpCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#b7791f]" />

                  <div>
                    <h3 className="mb-1 text-lg font-semibold text-[#5e481c]">
                      {t("ivTool.suggestions.notfound", { city: searchTerm })}
                    </h3>

                    <p className="text-sm text-[#876b32]">{t("ivTool.suggestions.didYouMean")}</p>
                  </div>
                </div>

                <div className="space-y-6">
                  {countryOptions.map((option, idx) => (
                    <div
                      key={idx}
                      className="border-t border-[#f0dfb4] pt-5 first:border-t-0 first:pt-0"
                    >
                      <h4 className="mb-4 text-lg font-bold text-[#273342]">{option.country}</h4>

                      {option.embassies.length > 0 && (
                        <div className="mb-5">
                          <div className="mb-3 flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-[#0d7377]" />

                            <span className="font-semibold text-[#4b5563]">
                              {t("ivTool.suggestions.embassy")}
                            </span>
                          </div>

                          <div className="ml-6 space-y-2">
                            {option.embassies.map((embassy, eidx) => (
                              <button
                                key={eidx}
                                onClick={() => handleSelectPost(embassy)}
                                className="group w-full rounded-xl border border-[#b8dddd] bg-[#e9f5f5] p-3 text-left transition-all hover:border-[#0d7377] hover:bg-[#dff0f0]"
                              >
                                <p className="font-medium text-[#0d7377]">{embassy.Post}</p>

                                <p className="mt-1 text-xs text-[#397b7e]">
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
                            <MapPin className="h-4 w-4 text-[#0d7377]" />

                            <span className="font-semibold text-[#4b5563]">
                              {t("ivTool.suggestions.consulate")}
                            </span>
                          </div>

                          <div className="ml-6 space-y-2">
                            {option.consulates.map((consulate, cidx) => (
                              <button
                                key={cidx}
                                onClick={() => handleSelectPost(consulate)}
                                className="group w-full rounded-xl border border-[#b8dddd] bg-[#e9f5f5] p-3 text-left transition-all hover:border-[#0d7377] hover:bg-[#dff0f0]"
                              >
                                <p className="font-medium text-[#0d7377]">{consulate.Post}</p>

                                <p className="mt-1 text-xs text-[#397b7e]">
                                  ✓ {t("ivTool.results.caseComplete")}:{" "}
                                  {consulate["Case Documentarily Complete"]}
                                </p>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {option.embassies.length === 0 && option.consulates.length === 0 && (
                        <p className="text-sm text-[#68737e]">{t("ivTool.suggestions.noPosts")}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {results && results.length > 0 && (
              <div ref={resultsRef} className="space-y-4 pt-1">
                <div className="flex items-center gap-2 px-1 pb-1">
                  <CheckCircle2 className="h-5 w-5 text-[#0d7377]" />

                  <h3 className="text-lg font-semibold text-[#273342]">
                    {t("ivTool.results.title")}
                  </h3>
                </div>

                {results.map((result, idx) => (
                  <div
                    key={idx}
                    className="relative isolate overflow-hidden rounded-2xl border border-[#e1e8f1] bg-[#ffffff] p-6 shadow-[0_10px_28px_rgba(35,53,78,0.06)] transition-shadow hover:shadow-[0_14px_34px_rgba(35,53,78,0.1)] md:p-7"
                  >
                    {/* Single decorative shape */}
                    <div className="pointer-events-none absolute top-0 right-0 z-0 h-28 w-28 rounded-bl-[72px] bg-[#e7f3f1]" />

                    <div className="relative z-10">
                      <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-[#82F4FA] px-2.5 py-1 text-[11px] font-semibold tracking-wide text-[#0d7377]">
                        <CheckCircle2 className="h-3 w-3" />
                        Result Found
                      </span>

                      <h4 className="mb-1 text-xl font-bold tracking-tight text-[#121a28]">
                        {result.Post}
                      </h4>

                      <p className="mb-7 text-sm text-[#59636f]">{result["Visa Category"]}</p>

                      <div className="rounded-xl border border-[#d7e1ef] bg-[#EFF4FF] px-5 py-6 text-center">
                        <span className="block text-sm text-[#496495]">
                          Currently scheduling applicants Documentarily Complete in:
                        </span>

                        <p className="mt-2 text-3xl font-bold tracking-tight text-[#00595C]">
                          {result["Case Documentarily Complete"]}
                        </p>
                      </div>

                      <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-[#cde6e7] bg-[#EAF1FF] px-4 py-3.5 text-[12px] leading-relaxed text-[#645961]">
                        <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#0d7377]" />

                        <p>
                          If your case was Documentarily Complete in or before this month, you
                          should receive an interview notice soon.
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>

          <aside className="space-y-6">
            <section className="rounded-2xl border border-[#edf0f5] bg-[#EFF4FF] p-5 shadow-[0_8px_24px_rgba(35,53,78,0.05)]">
              <div className="mb-4 flex items-start gap-3">
                <HelpCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#42505c]" />

                <h2 className="text-base leading-snug font-semibold text-[#3B3B3B]">
                  What does &quot;Documentarily Complete&quot; mean?
                </h2>
              </div>

              <div className="space-y-3 text-[12px] leading-relaxed text-[#5F7777]">
                <p>
                  A case is considered &quot;Documentarily Complete&quot; when the National Visa
                  Center (NVC) has received all required forms, civil documents, and financial
                  evidence, and has reviewed them for completeness.
                </p>
              </div>

              <div className="mt-5 h-1.5 rounded-full bg-linear-to-r from-[#0d7377] via-[#55aaa8] to-[#8bd7d3]" />
            </section>

            <section className="rounded-2xl border border-[#edf0f5] bg-[#EFF4FF] p-5 shadow-[0_8px_24px_rgba(35,53,78,0.05)]">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-[#183b3b]">
                <Landmark className="h-4 w-4 text-[#0d7377]" /> Official Resources
              </h3>
              <div className="mt-4 space-y-3">
                <a
                  href="https://travel.state.gov/content/travel/en/us-visas/visa-information-resources/iv-wait-times.html"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm font-medium text-[#0d7377] transition-opacity hover:opacity-75"
                >
                  NVC Processing Timeframes <ExternalLink className="h-3.5 w-3.5" />
                </a>
                <a
                  href="https://travel.state.gov/content/travel/en/legal/visa-law0/visa-bulletin.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm font-medium text-[#0d7377] transition-opacity hover:opacity-75"
                >
                  Visa Bulletin <ExternalLink className="h-3.5 w-3.5" />
                </a>
                <a
                  href="https://travel.state.gov/content/travel/en/us-visas/visa-information-resources/list-of-posts.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm font-medium text-[#0d7377] transition-opacity hover:opacity-75"
                >
                  U.S. Embassy Locator <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
