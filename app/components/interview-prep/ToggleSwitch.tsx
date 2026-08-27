"use client";

import { cn } from "@/lib/utils";

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
}

export const ToggleSwitch = ({ checked, onChange, className }: ToggleSwitchProps) => {
  return (
    <div className="flex items-center gap-3">
      {/* No text - left of toggle */}
      <span
        className={cn(
          "text-sm font-medium transition-colors duration-200",
          checked ? "text-slate-400" : "text-slate-700"
        )}
      >
        No
      </span>

      {/* Toggle button */}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-6 w-11 cursor-pointer items-center rounded-full transition-colors duration-200",
          checked ? "bg-teal-600" : "bg-slate-300",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2",
          className
        )}
      >
        <span
          className={cn(
            "inline-flex h-5 w-5 transform items-center justify-center rounded-full bg-white shadow-md transition-transform duration-200",
            checked ? "translate-x-6" : "translate-x-1"
          )}
        />
      </button>

      {/* Yes text - right of toggle */}
      <span
        className={cn(
          "text-sm font-medium transition-colors duration-200",
          checked ? "text-slate-700" : "text-slate-400"
        )}
      >
        Yes
      </span>
    </div>
  );
};
