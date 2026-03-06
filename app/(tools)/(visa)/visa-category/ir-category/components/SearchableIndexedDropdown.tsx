"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ChevronDown, X, Globe } from "lucide-react";

interface SearchableIndexedDropdownProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder: string;
  disabledOptions?: string[];
  comingSoonText?: string;
}

export default function SearchableIndexedDropdown({
  id,
  label,
  value,
  onChange,
  options,
  placeholder,
  disabledOptions = [],
  comingSoonText = "(Coming Soon)",
}: SearchableIndexedDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter options based on search query
  const filteredOptions = useMemo(() => {
    return options.filter((option) =>
      option.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [options, searchQuery]);

  // Group options by first letter for the index
  const indexedOptions = useMemo(() => {
    const groups: { [key: string]: string[] } = {};
    filteredOptions.forEach((option) => {
      const firstLetter = option[0].toUpperCase();
      if (!groups[firstLetter]) {
        groups[firstLetter] = [];
      }
      groups[firstLetter].push(option);
    });
    return groups;
  }, [filteredOptions]);

  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  const availableLetters = useMemo(() => {
    return alphabet.filter((letter) => indexedOptions[letter]);
  }, [indexedOptions]);

  const scrollToLetter = (letter: string) => {
    const element = document.getElementById(`letter-section-${id}-${letter}`);
    if (element && listRef.current) {
      listRef.current.scrollTo({
        top: element.offsetTop,
        behavior: "smooth",
      });
    }
  };

  const handleSelect = (option: string) => {
    if (disabledOptions.includes(option)) return;
    onChange(option);
    setIsOpen(false);
    setSearchQuery("");
  };

  return (
    <div
      className={`relative w-full ${isOpen ? "z-50" : "z-0"}`}
      ref={dropdownRef}
    >
      <label
        htmlFor={id}
        className="block text-sm font-medium text-gray-700 mb-2"
      >
        {label}
      </label>

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) setTimeout(() => inputRef.current?.focus(), 100);
        }}
        className={`w-full flex items-center justify-between px-4 py-3 border rounded-lg bg-white text-left transition-all duration-200 ${
          isOpen
            ? "border-primary ring-2 ring-primary/20"
            : "border-gray-300 hover:border-gray-400"
        }`}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <Globe className="w-5 h-5 text-gray-400 shrink-0" />
          <span
            className={`truncate ${value ? "text-gray-900" : "text-gray-500"}`}
          >
            {value || placeholder}
          </span>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence mode="wait">
        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 z-9999">
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[450px]"
            >
              {/* Search Header */}
              <div className="p-3 border-b border-gray-100 flex items-center gap-2 bg-white sticky top-0 z-10 font-sans">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    ref={inputRef}
                    type="text"
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium text-gray-900"
                    placeholder="Search country..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 rounded-full transition-colors"
                    >
                      <X className="w-3.5 h-3.5 text-gray-500" />
                    </button>
                  )}
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 md:hidden hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-gray-600" />
                </button>
              </div>

              <div className="flex flex-1 overflow-hidden relative font-sans">
                {/* Options List */}
                <div
                  ref={listRef}
                  className="flex-1 overflow-y-auto py-2 custom-scrollbar scroll-smooth"
                >
                  {availableLetters.length > 0 ? (
                    availableLetters.map((letter) => (
                      <div key={letter} id={`letter-section-${id}-${letter}`}>
                        <div className="px-4 py-2 text-[10px] font-black text-primary/40 bg-gray-50/80 sticky top-0 uppercase tracking-[0.2em] leading-none z-10 backdrop-blur-sm">
                          {letter}
                        </div>
                        {indexedOptions[letter].map((option) => {
                          const isDisabled = disabledOptions.includes(option);
                          const isSelected = value === option;
                          return (
                            <button
                              key={option}
                              onClick={() => handleSelect(option)}
                              disabled={isDisabled}
                              className={`w-full text-left px-4 py-3 flex items-center justify-between transition-all group ${
                                isSelected
                                  ? "bg-primary/5 text-primary"
                                  : "hover:bg-gray-50 text-gray-700"
                              } ${isDisabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
                            >
                              <div className="flex items-center gap-3 overflow-hidden">
                                {isSelected && (
                                  <motion.div
                                    layoutId={`active-indicator-${id}`}
                                    className="w-1 h-4 rounded-full bg-primary shrink-0"
                                  />
                                )}
                                <span
                                  className={`truncate ${isSelected ? "font-bold" : "font-medium"}`}
                                >
                                  {option}
                                </span>
                              </div>
                              {isDisabled && (
                                <span className="text-[9px] font-black px-2 py-0.5 bg-gray-100 text-gray-400 rounded-full uppercase tracking-tighter whitespace-nowrap shrink-0 border border-gray-200/50">
                                  Coming Soon
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    ))
                  ) : (
                    <div className="px-8 py-16 text-center">
                      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
                        <Search className="w-8 h-8 text-gray-200" />
                      </div>
                      <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">
                        No Results
                      </p>
                      <button
                        onClick={() => setSearchQuery("")}
                        className="text-primary text-sm font-bold mt-4 hover:opacity-80 transition-opacity"
                      >
                        Reset Search
                      </button>
                    </div>
                  )}
                </div>

                {/* A-Z Index Sidebar */}
                {availableLetters.length > 5 && (
                  <div className="flex flex-col justify-center px-1 bg-white border-l border-gray-100 z-20">
                    <div className="flex flex-col gap-0.5 py-2 overflow-y-auto no-scrollbar max-h-full">
                      {alphabet.map((letter) => {
                        const isAvailable = !!indexedOptions[letter];
                        return (
                          <button
                            key={letter}
                            type="button"
                            disabled={!isAvailable}
                            onClick={() => scrollToLetter(letter)}
                            className={`w-5 h-5 flex items-center justify-center text-[9px] font-black rounded-full transition-all ${
                              isAvailable
                                ? "text-primary hover:bg-primary hover:text-white cursor-pointer"
                                : "text-gray-200 cursor-default"
                            }`}
                          >
                            {letter}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e5e7eb;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #d1d5db;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
