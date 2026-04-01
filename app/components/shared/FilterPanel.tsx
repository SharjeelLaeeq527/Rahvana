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
    const resetFilters = fields.reduce(
      (acc, field) => ({ ...acc, [field.key]: "all" }),
      {}
    );
    setLocalFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  const activeFiltersCount = Object.values(localFilters).filter(
    (v) => v !== "all"
  ).length;

  return (
    <div className="relative inline-block">
      <Button
        ref={buttonRef}
        onClick={() => setShowPopover(!showPopover)}
        variant="outline"
        className={`gap-2 ${activeFiltersCount > 0 ? "bg-teal-50 border-teal-300" : ""}`}
      >
        <Filter className="w-4 h-4" />
        Filters
        {activeFiltersCount > 0 && (
          <span className="ml-1 px-2 py-0.5 bg-teal-600 text-white text-xs rounded-full">
            {activeFiltersCount}
          </span>
        )}
      </Button>

      {showPopover && (
        <div
          ref={popoverRef}
          className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-200 z-50 w-80 max-h-125 overflow-y-auto"
        >
          <div className="p-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white">
            <h3 className="font-semibold text-slate-900">Filter Sessions</h3>
            <button
              onClick={() => setShowPopover(false)}
              className="text-slate-600 hover:text-slate-900 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 space-y-4" onClick={(e) => e.stopPropagation()}>
            {fields.map((field) => (
              <div key={field.key} onClick={(e) => e.stopPropagation()}>
                <label className="block text-xs font-semibold text-slate-900 mb-2 uppercase tracking-wide">
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

          <div className="px-4 py-3 border-t border-slate-100 space-y-3 sticky bottom-0 bg-slate-50">
            <div className="flex gap-2">
              {activeFiltersCount > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReset();
                  }}
                  className="flex-1 text-sm text-white bg-teal-600 hover:bg-teal-700 font-medium transition-colors py-2 px-3 rounded-lg"
                >
                  Reset
                </button>
              )}
              <button
                onClick={() => setShowPopover(false)}
                className="flex-1 text-sm text-slate-700 bg-slate-200 hover:bg-slate-300 font-medium transition-colors py-2 px-3 rounded-lg"
              >
                Done
              </button>
            </div>
            <div className="text-xs text-slate-600 text-center">
              Showing{" "}
              <span className="font-semibold text-slate-900">{itemCount}</span>{" "}
              of{" "}
              <span className="font-semibold text-slate-900">{totalCount}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
