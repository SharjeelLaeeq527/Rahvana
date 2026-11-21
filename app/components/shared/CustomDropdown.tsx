"use client";

import React, { useState, useEffect, useId, useMemo, useRef } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Search, CheckCircle2, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The shared dropdown used across the app.
 *
 * Built on Radix Popover (non-modal), NOT Radix Select: Radix Select always freezes page scrolling
 * and hides the scrollbar while its list is open, with no way to turn that off. A popover leaves
 * the page scrollable and the list follows its field. Keyboard: arrows / Home / End move,
 * Enter picks, Escape closes; long lists (> 10) get a search box.
 */
export interface DropdownOption {
  value: string;
  label: string;
  subLabel?: string;
  status?: "uploaded" | "none";
  icon?: React.ReactNode;
  rightElement?: React.ReactNode;
  disabled?: boolean;
  disabledReason?: string;
}

interface CustomDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  placeholder?: string;
  className?: string;
  triggerClassName?: string;
  disabled?: boolean;
  /** Optional id for the trigger, so a <label htmlFor> can point at it. */
  id?: string;
  /**
   * When only one option is available, render it as a static field (and
   * auto-select it) instead of a pointless single-choice dropdown. Used where a
   * category list can shrink to one entry, e.g. IR-5 hidden on production.
   */
  collapseWhenSingle?: boolean;
  /** Optional max-width class for the label in trigger before truncating (e.g. max-w-[140px]) */
  maxLabelWidth?: string;
  /** Whether to show rightElement inside the closed trigger. Defaults to false. */
  showRightElementInTrigger?: boolean;
}

const DEFAULT_DISABLED_REASON =
  "This candidate has the Executive plan (highest plan) and cannot be upgraded.";

// Keeps wheel / touch scrolling working inside the list when the dropdown sits in a modal dialog:
// the dialog's scroll lock listens on the document and would otherwise cancel these events.
const stopScrollLockFromEatingEvent = (e: React.SyntheticEvent) => e.stopPropagation();

export const CustomDropdown = ({
  value,
  onChange,
  options,
  placeholder = "Select an option",
  className = "",
  triggerClassName = "",
  disabled = false,
  id,
  collapseWhenSingle = false,
  maxLabelWidth,
  showRightElementInTrigger = false,
}: CustomDropdownProps) => {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);
  const listId = useId();

  const displayOptions = useMemo(
    () => (options ?? []).filter((option) => option.value !== ""),
    [options]
  );

  // When collapsed to a single option, auto-select it so any dependent form
  // validation (e.g. "category is required") still passes.
  const soleOption = collapseWhenSingle && displayOptions.length === 1 ? displayOptions[0] : null;

  useEffect(() => {
    if (soleOption && value !== soleOption.value) {
      onChange(soleOption.value);
    }
  }, [soleOption, value, onChange]);

  const showSearch = displayOptions.length > 10;
  const filteredOptions = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return q
      ? displayOptions.filter((option) => option.label.toLowerCase().includes(q))
      : displayOptions;
  }, [displayOptions, searchTerm]);

  // Each time the list opens: clear the search and start on the selected option.
  useEffect(() => {
    if (!open) return;
    setSearchTerm("");
    const i = displayOptions.findIndex((o) => o.value === value);
    setActive(i >= 0 ? i : 0);
  }, [open, displayOptions, value]);

  useEffect(() => {
    if (!open) return;
    listRef.current
      ?.querySelector<HTMLElement>(`[data-index="${active}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  if (soleOption) {
    return (
      <div className={cn("w-full max-w-full", className)}>
        <div className="flex min-h-[42px] w-full items-center rounded-lg border border-transparent bg-white px-3 py-2 text-[13.5px] font-semibold text-slate-700 shadow-sm">
          {soleOption.label}
        </div>
      </div>
    );
  }

  const selectedOption = displayOptions.find((option) => option.value === value);

  const pick = (option: DropdownOption | undefined) => {
    if (!option || option.disabled) return;
    if (option.value !== value) onChange(option.value);
    setOpen(false);
  };

  const move = (step: number) => {
    if (filteredOptions.length === 0) return;
    let i = active;
    for (let n = 0; n < filteredOptions.length; n++) {
      i = (i + step + filteredOptions.length) % filteredOptions.length;
      if (!filteredOptions[i].disabled) break;
    }
    setActive(i);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (disabled) return;
    switch (event.key) {
      case "ArrowDown":
      case "ArrowUp":
        event.preventDefault();
        if (!open) setOpen(true);
        else move(event.key === "ArrowDown" ? 1 : -1);
        break;
      case "Home":
        if (open) {
          event.preventDefault();
          setActive(0);
        }
        break;
      case "End":
        if (open) {
          event.preventDefault();
          setActive(filteredOptions.length - 1);
        }
        break;
      case "Enter":
        if (open) {
          event.preventDefault();
          pick(filteredOptions[active]);
        }
        break;
    }
  };

  return (
    <div className={cn("w-full max-w-full", className)}>
      <Popover open={open} onOpenChange={(next) => !disabled && setOpen(next)}>
        <PopoverTrigger asChild>
          <button
            id={id}
            type="button"
            role="combobox"
            aria-expanded={open}
            aria-controls={listId}
            aria-haspopup="listbox"
            disabled={disabled}
            onKeyDown={handleKeyDown}
            className={cn(
              "flex h-auto min-h-[42px] w-full max-w-full min-w-0 items-center justify-between gap-2 rounded-lg border border-transparent bg-white px-3 py-2 text-left text-[13.5px] font-semibold whitespace-nowrap text-slate-700 shadow-sm transition-colors hover:border-transparent focus:ring-2 focus:ring-slate-200 focus:ring-offset-0 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 [&>svg]:text-slate-500",
              triggerClassName
            )}
          >
            {selectedOption ? (
              <span className="inline-flex min-w-0 items-center gap-1.5">
                {selectedOption.icon && <span className="shrink-0">{selectedOption.icon}</span>}
                <span
                  className={cn(
                    "truncate text-inherit",
                    maxLabelWidth || "max-w-[130px] sm:max-w-[170px]"
                  )}
                >
                  {selectedOption.label}
                </span>
                {showRightElementInTrigger && selectedOption.rightElement && (
                  <span className="shrink-0">{selectedOption.rightElement}</span>
                )}
              </span>
            ) : (
              <span className="text-muted-foreground truncate">{placeholder}</span>
            )}
            <ChevronDown
              aria-hidden
              className={cn("h-4 w-4 shrink-0 opacity-50 transition-transform", open && "rotate-180")}
            />
          </button>
        </PopoverTrigger>

        <PopoverContent
          align="start"
          sideOffset={2}
          onOpenAutoFocus={(event) => {
            // Without a search box, keep focus on the trigger so the arrow keys keep working.
            if (!showSearch) event.preventDefault();
          }}
          className="z-[10100] w-[var(--radix-popover-trigger-width)] max-w-none min-w-[max(250px,var(--radix-popover-trigger-width))] overflow-hidden rounded-lg border border-transparent bg-white p-0 shadow-xl"
        >
          {showSearch && (
            <div className="sticky top-0 z-10 flex items-center border-b border-transparent bg-white px-3 py-2.5">
              <Search className="mr-2 h-4 w-4 shrink-0 text-[#4A7772]" />

              <input
                type="text"
                value={searchTerm}
                placeholder="Search..."
                onChange={(event) => {
                  setSearchTerm(event.target.value);
                  setActive(0);
                }}
                onKeyDown={handleKeyDown}
                className="min-w-0 flex-1 bg-transparent text-sm font-medium text-slate-700 outline-none placeholder:font-normal placeholder:text-slate-400"
              />
            </div>
          )}

          <ul
            ref={listRef}
            id={listId}
            role="listbox"
            onWheel={stopScrollLockFromEatingEvent}
            onTouchMove={stopScrollLockFromEatingEvent}
            className="max-h-[250px] overflow-x-hidden overflow-y-auto overscroll-contain px-1 py-1"
          >
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, index) => {
                const checked = option.value === value;
                return (
                  <li
                    key={option.value}
                    data-index={index}
                    role="option"
                    aria-selected={checked}
                    aria-disabled={option.disabled || undefined}
                    title={
                      option.disabled
                        ? option.disabledReason || DEFAULT_DISABLED_REASON
                        : option.label
                    }
                    onMouseEnter={() => !option.disabled && setActive(index)}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => pick(option)}
                    className={cn(
                      "w-full min-w-0 cursor-pointer rounded-md px-3.5 py-2.5 text-sm font-medium text-slate-700 transition-colors select-none",
                      (index === active || checked) && !option.disabled && "bg-[#EAF5F0] text-[#2E5450]",
                      option.disabled &&
                        "cursor-not-allowed text-slate-500 opacity-60 hover:bg-amber-50/50 dark:hover:bg-amber-950/20"
                    )}
                  >
                    <div className="flex w-full min-w-0 items-center justify-between gap-2.5">
                      <div className="flex min-w-0 flex-1 items-center gap-2">
                        {option.icon && <span className="shrink-0">{option.icon}</span>}
                        <div className="flex min-w-0 flex-1 flex-col">
                          <span
                            className={cn(
                              "truncate",
                              option.status === "uploaded" ? "font-bold text-[#2E5450]" : "",
                              option.disabled ? "font-medium text-slate-500" : ""
                            )}
                          >
                            {option.label}
                          </span>
                          {option.subLabel && (
                            <span className="truncate text-[10.5px] font-normal text-amber-700 dark:text-amber-400/90">
                              {option.subLabel}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-1.5">
                        {option.rightElement && (
                          <span className="shrink-0">{option.rightElement}</span>
                        )}
                        {option.status === "uploaded" && (
                          <div className="flex shrink-0 items-center gap-1 rounded-md bg-[#EAF5F0] px-1.5 py-0.5 text-[10px] font-black tracking-wider text-[#2E5450] uppercase">
                            <CheckCircle2 size={10} strokeWidth={3} />
                            Uploaded
                          </div>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })
            ) : (
              <li className="px-4 py-5 text-center text-sm text-slate-500">No options found</li>
            )}
          </ul>
        </PopoverContent>
      </Popover>
    </div>
  );
};
