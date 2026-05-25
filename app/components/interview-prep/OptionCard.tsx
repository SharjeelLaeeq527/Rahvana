"use client";

import { cn } from "@/lib/utils";

interface OptionCardProps {
  value: string;
  label: string;
  isSelected: boolean;
  onSelect: (value: string) => void;
  className?: string;
}

export const OptionCard = ({ value, label, isSelected, onSelect, className }: OptionCardProps) => {
  return (
    <div
      onClick={() => onSelect(value)}
      className={cn(
        "cursor-pointer rounded-lg border-2 p-4 min-h-[80px] flex items-center justify-center transition-all duration-200",
        "hover:border-teal-400 hover:bg-teal-50",
        isSelected ? "border-teal-600 bg-teal-50" : "border-gray-200",
        className
      )}
    >
      <div className="font-medium text-slate-900 text-sm">{label}</div>
    </div>
  );
};
