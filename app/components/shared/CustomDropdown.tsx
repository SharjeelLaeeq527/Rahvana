"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface DropdownOption {
  value: string;
  label: string;
}

interface CustomDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export const CustomDropdown = ({
  value,
  onChange,
  options,
  placeholder = "Select an option",
  className = "",
  disabled = false,
}: CustomDropdownProps) => {
  const handleSelect = (selectedValue: string) => {
    onChange(selectedValue);
  };

  const selectedLabel = value ? options.find((opt) => opt.value === value)?.label : null;

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <Select value={value || ""} onValueChange={handleSelect} disabled={disabled}>
        <SelectTrigger
          className={`w-full px-3 py-3 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white hover:border-slate-400 transition-colors text-left font-medium ${className}`}
          onClick={(e) => e.stopPropagation()}
          style={{
            height: "auto",
            minHeight: "52px",
            display: "flex",
            alignItems: "center",
          }}
        >
          {selectedLabel ? (
            <span style={{ color: "#1c2b3a", fontSize: "15px" }}>
              {selectedLabel}
            </span>
          ) : (
            <SelectValue placeholder={placeholder} />
          )}
        </SelectTrigger>
        <SelectContent onClick={(e) => e.stopPropagation()}>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
