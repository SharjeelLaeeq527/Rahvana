"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { countries } from "@/lib/constants/countries";
import { Input } from "@/components/ui/input";

export interface StaticCountryAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string; // Wrapper className
  inputClassName?: string; // Input element className
}

export default function StaticCountryAutocomplete({
  value,
  onChange,
  placeholder = "Start typing country...",
  className,
  inputClassName,
}: StaticCountryAutocompleteProps) {
  const [query, setQuery] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const listRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync internal query with external value
  useEffect(() => {
    setQuery(value);
  }, [value]);

  const suggestions = useMemo(() => {
    if (!query || value === query) return [];
    return countries
      .filter((country) =>
        country.toLowerCase().includes(query.toLowerCase())
      )
      .slice(0, 10);
  }, [query, value]);

  const handleSelect = (country: string) => {
    onChange(country);
    setQuery(country);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) {
      if (e.key === "ArrowDown" && query.length > 0) {
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
          handleSelect(suggestions[highlightedIndex]);
        }
        break;
      case "Escape":
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex < 0 || !listRef.current) return;
    const el = listRef.current.children[highlightedIndex] as HTMLElement;
    el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [highlightedIndex]);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <Input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => query.length > 0 && setIsOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={inputClassName}
        autoComplete="off"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={isOpen && suggestions.length > 0}
        aria-controls="country-suggestions-list"
      />

      {isOpen && suggestions.length > 0 && (
        <div
          id="country-suggestions-list"
          ref={listRef}
          role="listbox"
          className="absolute z-50 w-full mt-1 overflow-y-auto overflow-x-hidden rounded-md border border-border bg-popover text-popover-foreground shadow-md max-h-60 p-1"
        >
          {suggestions.map((country, index) => {
            const isHighlighted = index === highlightedIndex;
            return (
              <div
                key={country}
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
