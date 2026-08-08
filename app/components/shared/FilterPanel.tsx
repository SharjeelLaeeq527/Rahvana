"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Filter, X } from "lucide-react";
import { CustomDropdown, DropdownOption } from "./CustomDropdown";

export type FilterOption = DropdownOption;

export interface FilterField {
  key: string;
  label: string;
  options: FilterOption[];
  value: string;
}

interface FilterPanelProps {
  fields: FilterField[];
  onFilterChange: (filters: Record<string, string>) => void;
  itemCount: number;
  totalCount: number;
}

export const FilterPanel = ({
  fields,
  onFilterChange,
  itemCount,
  totalCount,
}: FilterPanelProps) => {
  const [showPopover, setShowPopover] = useState(false);
  const [localFilters, setLocalFilters] = useState<Record<string, string>>(
    fields.reduce((acc, field) => ({ ...acc, [field.key]: field.value }), {})
  );
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Update local filters when parent props change (sync from parent)
  useEffect(() => {
    const updatedFilters = fields.reduce(
      (acc, field) => ({ ...acc, [field.key]: field.value }),
      {}
    );
    setLocalFilters(updatedFilters);
  }, [fields]);

  // Close popover when clicking outside (but not on select dropdowns)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      // Check if click is from a select dropdown trigger/content
      const isSelectDropdown = target.closest(
        '[role="combobox"], [role="listbox"], [role="option"]'
      );

      if (
        !isSelectDropdown &&
        popoverRef.current &&
        !popoverRef.current.contains(target) &&
        buttonRef.current &&
        !buttonRef.current.contains(target)
      ) {
        setShowPopover(false);
      }
    };

    if (showPopover) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [showPopover]);

  const handleFilterChange = (key: string, value: string) => {
    const updatedFilters = { ...localFilters, [key]: value };
    setLocalFilters(updatedFilters);
    onFilterChange(updatedFilters);
  };

  const handleReset = () => {
    const resetFilters = fields.reduce((acc, field) => ({ ...acc, [field.key]: "all" }), {});
    setLocalFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  const activeFiltersCount = Object.values(localFilters).filter((v) => v !== "all").length;

  return (
    <div className="relative inline-block">
      <Button
  ref={buttonRef}
  onClick={() => setShowPopover(!showPopover)}
  variant="outline"
  className={`gap-3 !px-6 !py-5 ${
    activeFiltersCount > 0 ? "bg-teal-50 border-teal-300" : ""
  }`}
>
  <Filter className="h-4 w-4" />
  Filters

  {activeFiltersCount > 0 && (
    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-teal-600 px-1 text-xs font-semibold text-white">
      {activeFiltersCount}
    </span>
  )}
</Button>

      {showPopover && (
        <div
          ref={popoverRef}
          className="absolute top-full left-0 z-50 mt-2 max-h-125 w-80 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl"
        >
          <div className="sticky top-0 flex items-center justify-between border-b border-slate-100 bg-white p-4">
            <h3 className="font-semibold text-slate-900">Filter Sessions</h3>
            <button
              onClick={() => setShowPopover(false)}
              className="text-slate-600 transition-colors hover:text-slate-900"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-4 p-4" onClick={(e) => e.stopPropagation()}>
            {fields.map((field) => (
              <div key={field.key} onClick={(e) => e.stopPropagation()}>
                <label className="mb-2 block text-xs font-semibold tracking-wide text-slate-900 uppercase">
                  {field.label}
                </label>
                <CustomDropdown
                  value={localFilters[field.key] || ""}
                  onChange={(val) => {
                    handleFilterChange(field.key, val);
                  }}
                  options={field.options}
                  placeholder={`Select ${field.label}`}
                />
              </div>
            ))}
          </div>

          <div className="sticky bottom-0 space-y-3 border-t border-slate-100 bg-slate-50 px-4 py-3">
            <div className="flex gap-2">
              {activeFiltersCount > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReset();
                  }}
                  className="flex-1 rounded-lg bg-teal-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700"
                >
                  Reset
                </button>
              )}
              <button
                onClick={() => setShowPopover(false)}
                className="flex-1 rounded-lg bg-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-300"
              >
                Done
              </button>
            </div>
            <div className="text-center text-xs text-slate-600">
              Showing <span className="font-semibold text-slate-900">{itemCount}</span> of{" "}
              <span className="font-semibold text-slate-900">{totalCount}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
