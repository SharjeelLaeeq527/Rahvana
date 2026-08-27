"use client";

import React, { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, CheckCircle2 } from "lucide-react";

export interface DropdownOption {
  value: string;
  label: string;
  status?: "uploaded" | "none";
}

interface CustomDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  /**
   * When only one option is available, render it as a static field (and
   * auto-select it) instead of a pointless single-choice dropdown. Used where a
   * category list can shrink to one entry, e.g. IR-5 hidden on production.
   */
  collapseWhenSingle?: boolean;
}

export const CustomDropdown = ({
  value,
  onChange,
  options,
  placeholder = "Select an option",
  className = "",
  disabled = false,
  collapseWhenSingle = false,
}: CustomDropdownProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const displayOptions = (options ?? []).filter(
    (option) => option.value !== ""
  );

  // When collapsed to a single option, auto-select it so any dependent form
  // validation (e.g. "category is required") still passes.
  const soleOption =
    collapseWhenSingle && displayOptions.length === 1 ? displayOptions[0] : null;

  useEffect(() => {
    if (soleOption && value !== soleOption.value) {
      onChange(soleOption.value);
    }
  }, [soleOption, value, onChange]);

  if (soleOption) {
    return (
      <div className={`w-full max-w-full ${className}`}>
        <div className="flex min-h-[42px] w-full items-center rounded-lg border border-transparent bg-white px-3 py-2 text-[13.5px] font-semibold text-slate-700 shadow-sm">
          {soleOption.label}
        </div>
      </div>
    );
  }

  const handleSelect = (selectedValue: string) => {
    const optionExists = displayOptions.some((option) => option.value === selectedValue);

    if (optionExists && selectedValue !== value) {
      onChange(selectedValue);
    }
  };

  const selectedLabel = displayOptions.find((option) => option.value === value)?.label;

  const filteredOptions = displayOptions.filter((option) =>
    option.label.toLowerCase().includes(searchTerm.trim().toLowerCase())
  );

  return (
    <div className={`w-full max-w-full ${className}`}>
      <Select
        value={value || undefined}
        onValueChange={handleSelect}
        disabled={disabled}
        onOpenChange={(open) => {
          if (!open) {
            setSearchTerm("");
          }
        }}
      >
        <SelectTrigger
          className="
            h-auto
            min-h-[42px]
            w-full
            min-w-0
            max-w-full
            rounded-lg
            border
            border-transparent
            bg-white
            px-3
            py-2
            text-left
            text-[13.5px]
            font-semibold
            text-slate-700
            shadow-sm
            transition-colors
            hover:border-transparent
            focus:ring-2
            focus:ring-slate-200
            focus:ring-offset-0
            disabled:cursor-not-allowed
            disabled:opacity-60
            [&>svg]:text-slate-500
          "
        >
          <SelectValue placeholder={placeholder}>
            {selectedLabel ? (
              <span className="block min-w-0 flex-1 truncate text-slate-700">{selectedLabel}</span>
            ) : null}
          </SelectValue>
        </SelectTrigger>

        <SelectContent
          position="popper"
          sideOffset={1}
          className="
            z-[10100]
            w-[var(--radix-select-trigger-width)]
            min-w-[var(--radix-select-trigger-width)]
            max-w-none
            overflow-hidden
            rounded-lg
            border
            border-transparent
            bg-white
            p-0
            shadow-xl
            data-[side=bottom]:translate-y-0
            data-[side=top]:translate-y-0
            [&_[data-radix-select-viewport]]:h-auto
            [&_[data-radix-select-viewport]]:min-h-0
            [&_[data-radix-select-viewport]]:p-0
          "
        >
          {displayOptions.length > 10 && (
            <div
              className="
                sticky
                top-0
                z-10
                flex
                items-center
                border-b
                border-transparent
                bg-white
                px-3
                py-2.5
              "
              onPointerDown={(event) => event.stopPropagation()}
              onKeyDown={(event) => event.stopPropagation()}
            >
              <Search className="mr-2 h-4 w-4 shrink-0 text-[#4A7772]" />

              <input
                type="text"
                value={searchTerm}
                placeholder="Search..."
                onChange={(event) => setSearchTerm(event.target.value)}
                className="
                  min-w-0
                  flex-1
                  bg-transparent
                  text-sm
                  font-medium
                  text-slate-700
                  outline-none
                  placeholder:font-normal
                  placeholder:text-slate-400
                "
              />
            </div>
          )}

          <div className="max-h-[250px] overflow-y-auto py-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  className="
                    cursor-pointer
                    rounded-md
                    px-4
                    py-3
                    text-sm
                    font-medium
                    text-slate-700
                    transition-colors
                    focus:bg-[#EAF5F0]
                    focus:text-[#2E5450]
                    data-[state=checked]:bg-[#EAF5F0]
                    data-[state=checked]:text-[#2E5450]
                    [&>span:first-child]:hidden
                  "
                >
                  <div className="flex w-full min-w-0 items-center justify-between gap-3">
                    <span
                      className={`min-w-0 flex-1 truncate ${
                        option.status === "uploaded" ? "font-bold text-[#2E5450]" : ""
                      }`}
                    >
                      {option.label}
                    </span>

                    {option.status === "uploaded" && (
                      <div
                        className="
                          ml-auto
                          flex
                          shrink-0
                          items-center
                          gap-1
                          rounded-md
                          bg-[#EAF5F0]
                          px-1.5
                          py-0.5
                          text-[10px]
                          font-black
                          uppercase
                          tracking-wider
                          text-[#2E5450]
                        "
                      >
                        <CheckCircle2 size={10} strokeWidth={3} />
                        Uploaded
                      </div>
                    )}
                  </div>
                </SelectItem>
              ))
            ) : (
              <div className="px-4 py-5 text-center text-sm text-slate-500">No options found</div>
            )}
          </div>
        </SelectContent>
      </Select>
    </div>
  );
};
