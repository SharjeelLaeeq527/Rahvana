"use client";

import { useState, useEffect, useRef } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Loader,
  ChevronDown,
  HelpCircle,
  Building2,
  MapPin,
} from "lucide-react";

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

const CITY_SUGGESTIONS = [
  "Islamabad",
  "Mumbai",
  "Dubai",
  "Ankara",
  "New Delhi",
  "Manila",
  "Mexico City",
  "Lagos",
  "Karachi",
  "Dhaka",
  "Cairo",
  "Beijing",
  "Shanghai",
  "Guangzhou",
  "Ho Chi Minh City",
  "Bangkok",
  "Jakarta",
  "Kuala Lumpur",
  "Singapore",
  "Colombo",
  "Kathmandu",
  "Phnom Penh",
  "Hanoi",
  "Seoul",
  "Tokyo",
  "Osaka",
  "Sydney",
  "Melbourne",
  "Toronto",
  "Montreal",
  "Vancouver",
  "London",
  "Manchester",
  "Paris",
  "Frankfurt",
  "Madrid",
  "Rome",
  "Moscow",
  "Kyiv",
  "Warsaw",
  "Prague",
  "Budapest",
  "Vienna",
  "Athens",
  "Sofia",
  "Bucharest",
  "Belgrade",
  "Zagreb",
  "Sarajevo",
  "Skopje",
  "Tirana",
  "Podgorica",
  "Pristina",
  "Riyadh",
  "Jeddah",
  "Doha",
  "Abu Dhabi",
  "Kuwait City",
  "Muscat",
  "Amman",
  "Beirut",
  "Tel Aviv",
  "Baghdad",
  "Tehran",
  "Kabul",
  "Tashkent",
  "Almaty",
  "Bishkek",
  "Dushanbe",
  "Ashgabat",
  "Yerevan",
  "Tbilisi",
  "Baku",
  "Ulaanbaatar",
  "Phuket",
  "Chiang Mai",
  "Nairobi",
  "Accra",
  "Lagos",
  "Abuja",
  "Addis Ababa",
  "Dar es Salaam",
  "Kigali",
  "Kampala",
  "Lusaka",
  "Harare",
  "Maputo",
  "Luanda",
  "Kinshasa",
  "Brazzaville",
  "Yaoundé",
  "Douala",
  "Abidjan",
  "Dakar",
  "Bamako",
  "Ouagadougou",
  "Niamey",
  "N'Djamena",
  "Bangui",
  "Juba",
  "Mogadishu",
  "Khartoum",
  "Asmara",
  "Djibouti",
  "Port Louis",
  "Antananarivo",
  "Moroni",
  "Victoria",
  "Cape Town",
  "Johannesburg",
  "Durban",
  "Pretoria",
  "Windhoek",
  "Gaborone",
  "Maseru",
  "Mbabane",
  "Lobamba",
  "Lilongwe",
  "Blantyre",
  "Georgetown",
  "Paramaribo",
  "Cayenne",
  "Brasília",
  "São Paulo",
  "Rio de Janeiro",
  "Buenos Aires",
  "Santiago",
  "Lima",
  "Bogotá",
  "Caracas",
  "Quito",
  "La Paz",
  "Asunción",
  "Montevideo",
  "San José",
  "Panama City",
  "Havana",
  "Kingston",
  "Port-au-Prince",
  "Santo Domingo",
  "San Juan",
  "Nassau",
  "Bridgetown",
  "Castries",
  "Kingstown",
  "St. George's",
  "St. John's",
  "Roseau",
  "Basseterre",
  "Oranjestad",
  "Willemstad",
  "Plymouth",
  "The Valley",
  "Basse-Terre",
  "Marigot",
  "Gustavia",
  "Philipsburg",
  "Road Town",
  "Charlotte Amalie",
].sort();

export default function Home() {
  const [visaCategory, setVisaCategory] =
    useState<string>("immediate-relative");
  const [city, setCity] = useState<string>("");
  const [results, setResults] = useState<SchedulingResult[] | null>(null);
  const [countryOptions, setCountryOptions] = useState<CountryOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");

  const [citySuggestions, setCitySuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      if (city.trim().length >= 2) {
        const filtered = CITY_SUGGESTIONS.filter((c) =>
          c.toLowerCase().includes(city.toLowerCase()),
        ).slice(0, 8);
        setCitySuggestions(filtered);
        setShowSuggestions(true);
      } else {
        setCitySuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [city]);

  const handleCitySelect = (selectedCity: string) => {
    setCity(selectedCity);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const submitSearch = async (searchCity: string) => {
    if (!searchCity.trim()) {
      setError("Please enter a city name.");
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);
    setCountryOptions([]);
    setShowSuggestions(false);
    setSearchTerm(searchCity);

    try {
      const response = await fetch("/api/iv-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city: searchCity, visaCategory }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to fetch scheduling data");
        return;
      }

      if (!data.success && data.data.length === 0) {
        if (data.needsCountrySelection && data.countryOptions) {
          setCountryOptions(data.countryOptions);
          setError(null);
        } else {
          setError(
            data.message || "No results found for this city and category.",
          );
          setCountryOptions([]);
        }
        return;
      }

      setResults(data.data);
      setCountryOptions([]);
    } catch (err) {
      setError("An error occurred. Please try again.");
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
      const offset = 100; // Account for sticky header
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
    <div className="min-h-screen bg-linear-to-b from-primary/10 to-white py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-primary mb-2">
          IV Scheduling Status Tool
        </h1>
        <p className="text-gray-600 mb-6">
          Check when your immigrant visa interview might be scheduled
        </p>

        <div className="bg-white p-6 rounded-lg shadow-md mb-8 text-gray-700 text-sm leading-relaxed">
          <p className="mb-3">
            The Immigrant Visa (IV) Scheduling Status Tool shows when the
            National Visa Center (NVC) is scheduling interviews at specific U.S.
            embassies or consulates. Interviews are scheduled based on the date
            your case became &quot;documentarily complete&quot; (when you paid
            all fees and submitted required documents).
          </p>
          <p>
            <strong>Important:</strong> Interviews can only be scheduled if a
            visa is available. For preference visa cases, check the monthly{" "}
            <a
              href="https://travel.state.gov/content/travel/en/legal/visa-law0/visa-bulletin.html"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline font-medium hover:text-blue-800"
            >
              Visa Bulletin
            </a>{" "}
            to confirm visa availability.
          </p>
        </div>

        <div className="bg-gray-100 p-8 rounded-lg shadow-sm mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">
            Find Your Scheduling Status
          </h2>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-4">
                Visa Category <span className="text-red-600">*</span>
              </label>
              <div className="space-y-3">
                {[
                  { value: "immediate-relative", label: "Immediate Relative" },
                  {
                    value: "family-sponsored",
                    label: "Family-Sponsored Preference",
                  },
                  {
                    value: "employment-based",
                    label: "Employment-Based Preference",
                  },
                ].map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="visaCategory"
                      value={option.value}
                      checked={visaCategory === option.value}
                      onChange={(e) => setVisaCategory(e.target.value)}
                      className="mr-3 h-4 w-4 text-primary cursor-pointer"
                    />
                    <span className="text-gray-700">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="relative">
              <label
                htmlFor="city"
                className="block text-sm font-semibold text-gray-800 mb-2"
              >
                U.S. Embassy or Consulate City{" "}
                <span className="text-red-600">*</span>
              </label>
              <p className="text-xs text-gray-600 mb-2">
                Examples: Islamabad, Mumbai, Dubai, Ankara, New Delhi
              </p>
              <div className="relative">
                <input
                  id="city"
                  ref={inputRef}
                  type="text"
                  placeholder="Start typing city name..."
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  onFocus={() => city.length >= 2 && setShowSuggestions(true)}
                  onBlur={() =>
                    setTimeout(() => setShowSuggestions(false), 200)
                  }
                  className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-primary focus:border-transparent text-gray-700 placeholder-gray-400"
                />
                {city && (
                  <button
                    type="button"
                    onClick={() => setCity("")}
                    className="absolute right-10 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                )}
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
              </div>

              {showSuggestions && citySuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                  {citySuggestions.map((suggestion, idx) => (
                    <div
                      key={idx}
                      onMouseDown={() => handleCitySelect(suggestion)}
                      className="px-4 py-2.5 text-sm text-gray-700 hover:bg-primary/10 hover:text-primary cursor-pointer"
                    >
                      {suggestion}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading || !city.trim()}
              className="w-full sm:w-auto px-8 py-3 bg-primary text-white font-semibold rounded-md hover:bg-primary/90 disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-150 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader className="h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                "Search"
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-lg mb-8 flex gap-3 items-start">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-900">Error</p>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Country Selection Screen */}
        {countryOptions.length > 0 && !loading && (
          <div className="space-y-4 mb-8">
            <div className="bg-amber-50 border border-amber-200 p-6 rounded-lg">
              <div className="flex items-start gap-3 mb-4">
                <HelpCircle className="h-6 w-6 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-lg font-semibold text-amber-900 mb-2">
                    We couldnt find {searchTerm}
                  </h3>
                  <p className="text-sm text-amber-800">
                    Did you mean one of these countries? Select whether you need
                    an Embassy or Consulate:
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                {countryOptions.map((option, idx) => (
                  <div
                    key={idx}
                    className="border-t border-amber-200 pt-6 first:border-t-0 first:pt-0"
                  >
                    <h4 className="font-bold text-gray-800 mb-4 text-lg">
                      {option.country}
                    </h4>

                    {/* Embassies Section */}
                    {option.embassies.length > 0 && (
                      <div className="mb-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Building2 className="h-5 w-5 text-primary" />
                          <span className="font-semibold text-gray-700">
                            Embassy
                          </span>
                        </div>
                        <div className="space-y-2 ml-7">
                          {option.embassies.map((embassy, eidx) => (
                            <button
                              key={eidx}
                              onClick={() => handleSelectPost(embassy)}
                              className="w-full text-left p-3 bg-primary/10 border border-primary/30 rounded-lg hover:bg-primary/5 hover:border-primary/70 transition-all group"
                            >
                              <p className="font-medium text-primary group-hover:text-primary">
                                {embassy.Post}
                              </p>
                              <p className="text-xs text-primary mt-1">
                                ✓ Case Complete:{" "}
                                {embassy["Case Documentarily Complete"]}
                              </p>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Consulates Section */}
                    {option.consulates.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <MapPin className="h-5 w-5 text-primary" />
                          <span className="font-semibold text-gray-700">
                            Consulate
                          </span>
                        </div>
                        <div className="space-y-2 ml-7">
                          {option.consulates.map((consulate, cidx) => (
                            <button
                              key={cidx}
                              onClick={() => handleSelectPost(consulate)}
                              className="w-full text-left p-3 bg-primary/10 border border-primary/30 rounded-lg hover:bg-primary/5 hover:border-primary/70 transition-all group"
                            >
                              <p className="font-medium text-primary group-hover:text-primary">
                                {consulate.Post}
                              </p>
                              <p className="text-xs text-primary mt-1">
                                ✓ Case Complete:{" "}
                                {consulate["Case Documentarily Complete"]}
                              </p>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {option.embassies.length === 0 &&
                      option.consulates.length === 0 && (
                        <p className="text-gray-600 text-sm">
                          No posts available for your visa category
                        </p>
                      )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Results Display */}
        {results && results.length > 0 && (
          <div ref={resultsRef} className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="h-6 w-6 text-primary" />
              <h3 className="text-lg font-semibold text-gray-800">
                Scheduling Information
              </h3>
            </div>

            {results.map((result, idx) => (
              <div
                key={idx}
                className="bg-linear-to-r from-primary/10 to-white border border-primary/30 p-6 rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="text-lg font-bold text-primary mb-1">
                      {result.Post}
                    </h4>
                    <div className="space-y-2">
                      <div>
                        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                          Visa Category
                        </span>
                        <p className="text-sm text-gray-800 font-medium">
                          {result["Visa Category"]}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                          Documentarily Complete Date
                        </span>
                        <p className="text-lg font-bold text-primary">
                          {result["Case Documentarily Complete"]}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-primary/10 p-3 rounded-lg">
                    <CheckCircle2 className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
