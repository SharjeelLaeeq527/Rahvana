"use client";

import { cn } from "@/lib/utils";

interface OptionCardProps {
  value: string;
  label: string;
  isSelected: boolean;
  onSelect: (value: string) => void;
  className?: string;
  /** Optional accent color for selected state */
  accentColor?: string;
  /** Optional light background color for selected state */
  accentColorLight?: string;
}

export const OptionCard = ({
  value,
  label,
  isSelected,
  onSelect,
  className,
  accentColor = "#0d7377",
  accentColorLight = "#e8f6f6",
}: OptionCardProps) => {
  return (
    <div
      onClick={() => onSelect(value)}
      className={cn(
        "cursor-pointer rounded-lg border-2 p-4 min-h-[80px] flex items-center justify-center transition-all duration-200",
        !isSelected && "border-gray-200 hover:border-slate-300 hover:bg-slate-50",
        className
      )}
      style={
        isSelected
          ? {
              borderColor: accentColor,
              backgroundColor: accentColorLight,
            }
          : undefined
      }
    >
      <div className="font-medium text-sm" style={{ color: isSelected ? accentColor : "#334155" }}>
        {label}
      </div>
    </div>
  );
};
