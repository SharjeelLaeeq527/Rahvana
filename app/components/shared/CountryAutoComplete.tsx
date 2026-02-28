"use client";

import { useState, useRef, useEffect, useCallback } from "react";

export interface CountryAutocompleteProps {
  /** Form data object containing the country value (e.g. formData) */
  formData: Record<string, unknown>;
  /** Callback to update form with selected country. Receives partial object like { country_of_residence: "..." } */
  setFormData: (data: Record<string, unknown>) => void;
  /** Key in formData to read/write (default "country_of_residence"). Use "beneficiary_country" for interview-prep. */
  valueKey?: string;
  /** When true, do not render the label (parent provides it). */
  hideLabel?: boolean;
  /** Optional class name for the input to match parent form styling. */
  inputClassName?: string;
  /** Optional placeholder. */
  placeholder?: string;
}

const DEFAULT_VALUE_KEY = "country_of_residence";

export default function CountryAutocomplete({
  formData,
  setFormData,
  valueKey = DEFAULT_VALUE_KEY,
  hideLabel = false,
  inputClassName,
  placeholder = "Start typing country...",
}: CountryAutocompleteProps) {
  const key = valueKey ?? DEFAULT_VALUE_KEY;
  const initialValue = (formData[key] as string | undefined) ?? "";
  const [query, setQuery] = useState(initialValue);
  const [suggestions, setSuggestions] = useState<
    Array<{ properties: { place_id: string; country: string } }>
  >([]);
  const [loading, setLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const GEOAPIFY_KEY = process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY;

  // Sync query when formData value changes from parent (e.g. profile load)
  useEffect(() => {
    const v = (formData[key] as string | undefined) ?? "";
    if (v !== query) setQuery(v);
  }, [formData, key]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchCountries = useCallback(
    async (value: string) => {
      setQuery(value);

      if (!value) {
        setSuggestions([]);
        setHighlightedIndex(-1);
        return;
      }

      setLoading(true);
      setHighlightedIndex(-1);

      try {
        const res = await fetch(
          `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(value)}&type=country&limit=5&apiKey=${GEOAPIFY_KEY}`,
        );

        const data = await res.json();
        setSuggestions(data.features || []);
      } catch (error) {
        console.error("Geoapify error:", error);
      }

      setLoading(false);
    },
    [GEOAPIFY_KEY],
  );

  const handleSelect = useCallback(
    (country: string) => {
      setFormData({ ...formData, [key]: country });
      setQuery(country);
      setSuggestions([]);
      setHighlightedIndex(-1);
    },
    [formData, key, setFormData],
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (suggestions.length === 0) {
      if (e.key === "Escape") {
        (e.target as HTMLInputElement).blur();
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : 0,
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : suggestions.length - 1,
        );
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
          handleSelect(suggestions[highlightedIndex].properties.country);
        }
        break;
      case "Escape":
        e.preventDefault();
        setSuggestions([]);
        setHighlightedIndex(-1);
        (e.target as HTMLInputElement).blur();
        break;
      default:
        break;
    }
  };

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex < 0 || !listRef.current) return;
    const el = listRef.current.children[highlightedIndex] as HTMLElement;
    el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [highlightedIndex]);

  return (
    <div className="relative">
      {!hideLabel && (
        <label className="text-base text-muted-foreground mb-1 block">
          Country of Residence
        </label>
      )}

      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => fetchCountries(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={inputClassName ?? "w-full border rounded-lg px-3 py-2"}
        autoComplete="off"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={suggestions.length > 0}
        aria-haspopup="listbox"
        aria-controls="country-suggestions-list"
        aria-activedescendant={
          highlightedIndex >= 0 && suggestions[highlightedIndex]
            ? `country-option-${highlightedIndex}`
            : undefined
        }
      />

      {/* Loading state */}
      {loading && (
        <div
          className="absolute z-20 left-0 right-0 mt-1 rounded-md border border-border bg-popover text-popover-foreground shadow-md p-3 flex items-center justify-center gap-2"
          role="status"
          aria-live="polite"
        >
          <span
            className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"
            aria-hidden
          />
          <span className="text-sm text-muted-foreground">
            Searching countries...
          </span>
        </div>
      )}

      {/* Suggestions dropdown – same styling as SelectContent/SelectItem */}
      {!loading && suggestions.length > 0 && (
        <div
          id="country-suggestions-list"
          ref={listRef}
          role="listbox"
          className="absolute z-50 w-full mt-1 overflow-y-auto overflow-x-hidden rounded-md border border-border bg-popover text-popover-foreground shadow-md max-h-60 p-1"
        >
          {suggestions.map((item, index) => {
            const country = item.properties.country;
            const isHighlighted = index === highlightedIndex;
            return (
              <div
                key={item.properties.place_id}
                id={`country-option-${index}`}
                role="option"
                aria-selected={isHighlighted}
                onClick={() => handleSelect(country)}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={`relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-2 pr-3 text-sm outline-none transition-colors ${
                  isHighlighted
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-accent/80 hover:text-accent-foreground"
                }`}
              >
                {country}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
