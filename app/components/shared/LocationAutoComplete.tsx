"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Loader } from "@/components/ui/spinner";
import { X } from "lucide-react";
import { E, msg } from "@/lib/errors";

type LocationType = "country" | "city";

interface LocationSuggestion {
  properties: {
    place_id?: string;
    country?: string;
    city?: string;
    state?: string;
    formatted?: string;
    address_line1?: string;
  };
}

export interface LocationAutocompleteProps {
  formData: Record<string, unknown>;
  setFormData: (data: Record<string, unknown>) => void;

  valueKey?: string;

  /**
   * "country" -> searches countries
   * "city" -> searches cities
   */
  type?: LocationType;

  /**
   * Label shown above the field.
   */
  label?: string;

  /**
   * Show required asterisk.
   */
  required?: boolean;

  /**
   * Icon shown inside the left side of input.
   */
  icon?: React.ReactNode;

  /**
   * Hide label when parent already renders one.
   */
  hideLabel?: boolean;

  /**
   * Custom input styling.
   */
  inputClassName?: string;

  /**
   * Placeholder.
   */
  placeholder?: string;

  /**
   * Minimum characters before API request.
   */
  minChars?: number;

  /**
   * Show clear button when value exists.
   */
  showClearButton?: boolean;
}

const DEFAULT_VALUE_KEY = "country_of_residence";

const COMMON_COUNTRIES = [
  "Pakistan",
  "United States",
  "United Kingdom",
  "Canada",
  "Afghanistan",
  "India",
  "United Arab Emirates",
  "Saudi Arabia",
  "Turkey",
  "Germany",
  "France",
  "Italy",
  "Spain",
  "Australia",
  "China",
];

export default function LocationAutocomplete({
  formData,
  setFormData,
  valueKey = DEFAULT_VALUE_KEY,
  type = "country",
  label,
  required = false,
  icon,
  hideLabel = false,
  inputClassName,
  placeholder,
  minChars = 2,
  showClearButton = true,
}: LocationAutocompleteProps) {
  const key = valueKey;

  const initialValue = (formData[key] as string | undefined) ?? "";

  const [query, setQuery] = useState(initialValue);
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const GEOAPIFY_KEY = process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY;

  const defaultLabel =
    type === "country" ? "Country of Residence" : "U.S. Embassy or Consulate City";

  const defaultPlaceholder =
    type === "country" ? "Start typing country..." : "e.g., London, Manila, Ciudad Juarez";

  /*
   * Keep local input synchronized with parent formData.
   */
  useEffect(() => {
    const value = (formData[key] as string | undefined) ?? "";

    if (value !== query) {
      setQuery(value);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData, key]);

  /*
   * Extract the correct display name from Geoapify.
   */
  const getLocationName = useCallback(
    (item: LocationSuggestion): string => {
      const properties = item.properties;

      if (type === "country") {
        return properties.country ?? "";
      }

      /*
       * City results can have different properties depending
       * on Geoapify's returned feature.
       */
      return (
        properties.city ??
        properties.address_line1 ??
        properties.formatted?.split(",")[0]?.trim() ??
        ""
      );
    },
    [type]
  );

  /*
   * Search locations.
   */
  const fetchLocations = useCallback(
    async (value: string) => {
      setQuery(value);

      // Update parent immediately.
      setFormData({
        [key]: value,
      });

      const trimmedValue = value.trim();

      if (trimmedValue.length < minChars) {
        setSuggestions([]);
        setHighlightedIndex(-1);
        return;
      }

      setLoading(true);
      setHighlightedIndex(-1);

      try {
        if (!GEOAPIFY_KEY) {
          throw new Error(msg(E.GEOAPIFY_KEY_MISSING));
        }

        const apiUrl =
          type === "country"
            ? `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(
                trimmedValue
              )}&type=country&limit=5&apiKey=${GEOAPIFY_KEY}`
            : `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(
                trimmedValue
              )}&type=city&limit=5&apiKey=${GEOAPIFY_KEY}`;

        const response = await fetch(apiUrl);

        if (!response.ok) {
          throw new Error(`Geoapify API error: ${response.status}`);
        }

        const data = await response.json();

        console.log("Geoapify response:", data);

        const features: LocationSuggestion[] = Array.isArray(data.features) ? data.features : [];

        setSuggestions(features);
      } catch (error) {
        console.warn("Geoapify error:", error instanceof Error ? error.message : error);

        /*
         * Country fallback.
         *
         * We can safely fallback to local countries.
         * For cities, we don't have a reliable global
         * hardcoded fallback list.
         */
        if (type === "country") {
          const lowerValue = trimmedValue.toLowerCase();

          const fallbackFeatures: LocationSuggestion[] = COMMON_COUNTRIES.filter((country) =>
            country.toLowerCase().includes(lowerValue)
          ).map((country) => ({
            properties: {
              place_id: country,
              country,
            },
          }));

          setSuggestions(fallbackFeatures);

          console.info(msg(E.GEOAPIFY_FALLBACK_USED));
        } else {
          setSuggestions([]);
        }
      } finally {
        setLoading(false);
      }
    },
    [GEOAPIFY_KEY, key, minChars, setFormData, type]
  );

  /*
   * Select suggestion.
   */
  const handleSelect = useCallback(
    (item: LocationSuggestion) => {
      const location = getLocationName(item);

      if (!location) return;

      setQuery(location);

      setFormData({
        [key]: location,
      });

      setSuggestions([]);
      setHighlightedIndex(-1);
    },
    [getLocationName, key, setFormData]
  );

  /*
   * Clear field.
   */
  const handleClear = () => {
    setQuery("");

    setFormData({
      [key]: "",
    });

    setSuggestions([]);
    setHighlightedIndex(-1);

    inputRef.current?.focus();
  };

  /*
   * Keyboard navigation.
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (suggestions.length === 0) {
      if (e.key === "Escape") {
        inputRef.current?.blur();
      }

      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();

        setHighlightedIndex((previous) => (previous < suggestions.length - 1 ? previous + 1 : 0));

        break;

      case "ArrowUp":
        e.preventDefault();

        setHighlightedIndex((previous) => (previous > 0 ? previous - 1 : suggestions.length - 1));

        break;

      case "Enter":
        e.preventDefault();

        if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
          handleSelect(suggestions[highlightedIndex]);
        }

        break;

      case "Escape":
        e.preventDefault();

        setSuggestions([]);
        setHighlightedIndex(-1);

        inputRef.current?.blur();

        break;

      default:
        break;
    }
  };

  /*
   * Scroll highlighted suggestion into view.
   */
  useEffect(() => {
    if (highlightedIndex < 0 || !listRef.current) {
      return;
    }

    const element = listRef.current.children[highlightedIndex] as HTMLElement;

    element?.scrollIntoView({
      block: "nearest",
    });
  }, [highlightedIndex]);

  return (
    <div className="relative">
      {/* Label */}
      {!hideLabel && (
        <label
          htmlFor={`${key}-autocomplete`}
          className="mb-2 block text-xs font-semibold tracking-wide text-[#384252]"
        >
          {label ?? defaultLabel}

          {required && <span className="ml-1 text-[#db8090]">*</span>}
        </label>
      )}

      {/* Input wrapper */}
      <div className="relative">
        {/* Left icon */}
        {icon && (
          <div className="pointer-events-none absolute top-1/2 left-3.5 z-10 -translate-y-1/2 text-[#59636f]">
            {icon}
          </div>
        )}

        <input
          id={`${key}-autocomplete`}
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => fetchLocations(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder ?? defaultPlaceholder}
          autoComplete="off"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={suggestions.length > 0}
          aria-haspopup="listbox"
          aria-controls={`${key}-suggestions`}
          aria-activedescendant={
            highlightedIndex >= 0 && suggestions[highlightedIndex]
              ? `${key}-option-${highlightedIndex}`
              : undefined
          }
          className={
            inputClassName ??
            "w-full rounded-xl border border-[#cbd3d8] bg-white py-3.5 pr-10 pl-10 text-sm text-[#263342] transition-colors outline-none placeholder:text-[#7a838c] focus:border-[#0d7377] focus:ring-2 focus:ring-[#0d7377]/10"
          }
        />

        {/* Clear button */}
        {showClearButton && query && (
          <button
            type="button"
            onClick={handleClear}
            aria-label={`Clear ${label ?? type}`}
            className="absolute top-1/2 right-3.5 -translate-y-1/2 text-[#8a949d] transition-colors hover:text-[#36424d]"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div
          className="absolute top-full right-0 left-0 z-50 mt-1 flex items-center justify-center rounded-xl border border-[#dfe5e8] bg-white p-3 shadow-[0_10px_24px_rgba(35,53,78,0.12)]"
          role="status"
          aria-live="polite"
        >
          <Loader
            size="sm"
            text={type === "country" ? "Searching countries..." : "Searching cities..."}
          />
        </div>
      )}

      {/* Suggestions */}
      {!loading && suggestions.length > 0 && (
        <div
          id={`${key}-suggestions`}
          ref={listRef}
          role="listbox"
          className="absolute top-full z-50 mt-1 max-h-60 w-full overflow-x-hidden overflow-y-auto rounded-xl border border-[#dfe5e8] bg-white p-1 shadow-[0_10px_24px_rgba(35,53,78,0.12)]"
        >
          {suggestions.map((item, index) => {
            const location = getLocationName(item);

            if (!location) return null;

            const highlighted = index === highlightedIndex;

            return (
              <button
                type="button"
                key={item.properties.place_id ?? `${location}-${index}`}
                id={`${key}-option-${index}`}
                role="option"
                aria-selected={highlighted}
                onMouseDown={(e) => {
                  /*
                   * Prevent input blur before selection.
                   */
                  e.preventDefault();
                }}
                onClick={() => handleSelect(item)}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={`flex w-full cursor-pointer items-center rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                  highlighted
                    ? "bg-[#e9f5f5] text-[#0d7377]"
                    : "text-[#4b5563] hover:bg-[#e9f5f5] hover:text-[#0d7377]"
                }`}
              >
                {location}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
