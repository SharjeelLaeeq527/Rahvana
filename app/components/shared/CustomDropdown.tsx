"use client";

import React, { useState } from "react";
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
}

export const CustomDropdown = ({
  value,
  onChange,
  options,
  placeholder = "Select an option",
  className = "",
  disabled = false,
}: CustomDropdownProps) => {
  const [searchTerm, setSearchTerm] = useState("");

  const handleSelect = (selectedValue: string) => {
    onChange(selectedValue);
  };

  const selectedLabel = value ? options.find((opt) => opt.value === value)?.label : null;

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  );
  return (
    <div>
      <Select
        value={value || ""}
        onValueChange={handleSelect}
        disabled={disabled}
        onOpenChange={(open) => {
          if (!open) {
            setSearchTerm("");
          }
        }}
      >
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
            <span style={{ color: "#1c2b3a", fontSize: "15px" }}>{selectedLabel}</span>
          ) : (
            <SelectValue placeholder={placeholder} />
          )}
        </SelectTrigger>
        <SelectContent>
          {options.length > 10 && (
            <div
              className="flex items-center px-3 py-2 sticky top-0 bg-white z-10 border-b border-slate-100 mb-1"
              onPointerDown={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            >
              <Search className="w-4 h-4 mr-2 text-slate-400" />
              <input
                type="text"
                className="flex-1 bg-transparent outline-none text-sm text-slate-700 placeholder:text-slate-400"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          )}
          <div className="max-h-[250px] overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center justify-between w-full pr-6">
                    <span className={option.status === "uploaded" ? "text-primary font-bold" : ""}>
                      {option.label}
                    </span>
                    {option.status === "uploaded" && (
                      <div className="ml-2 px-1.5 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                        <CheckCircle2 size={10} strokeWidth={3} />
                        Uploaded
                      </div>
                    )}
                  </div>
                </SelectItem>
              ))
            ) : (
              <div className="px-3 py-4 text-sm text-center text-slate-500">No options found</div>
            )}
          </div>
        </SelectContent>
      </Select>
    </div>
  );
};
