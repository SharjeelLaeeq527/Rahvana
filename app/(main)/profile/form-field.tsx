"use client";

import { ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { CustomDropdown } from "@/app/components/shared/CustomDropdown";
import { cn } from "@/lib/utils";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Building2,
  Calendar,
  Briefcase,
  GraduationCap,
  FileText,
  Globe,
  ChevronDown,
  AlertCircle,
} from "lucide-react";

// Icon mapping for different field types
const iconMap: Record<string, ReactNode> = {
  name: <User className="h-4 w-4 text-slate-400" />,
  email: <Mail className="h-4 w-4 text-slate-400" />,
  phone: <Phone className="h-4 w-4 text-slate-400" />,
  address: <MapPin className="h-4 w-4 text-slate-400" />,
  city: <Building2 className="h-4 w-4 text-slate-400" />,
  date: <Calendar className="h-4 w-4 text-slate-400" />,
  job: <Briefcase className="h-4 w-4 text-slate-400" />,
  education: <GraduationCap className="h-4 w-4 text-slate-400" />,
  document: <FileText className="h-4 w-4 text-slate-400" />,
  country: <Globe className="h-4 w-4 text-slate-400" />,
};

interface FormFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  icon?: keyof typeof iconMap;
  className?: string;
  helpText?: string;
  /** Validation message — when set, the field shows a red border + the message. */
  error?: string;
}

export function FormField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
  disabled = false,
  readOnly = false,
  icon,
  className,
  helpText,
  error,
}: FormFieldProps) {
  const hasError = Boolean(error);
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label className="text-xs font-medium text-slate-600">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </Label>
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
            {iconMap[icon]}
          </div>
        )}
        <Input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          aria-invalid={hasError}
          className={cn(
            "h-10 text-sm bg-white border rounded-md",
            "placeholder:text-slate-400",
            "disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed",
            "read-only:bg-slate-50 read-only:text-slate-600",
            hasError
              ? "border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-200"
              : "border-slate-200 hover:border-slate-300 focus:border-slate-400 focus:ring-1 focus:ring-slate-200",
            icon ? "pl-9" : "px-3"
          )}
        />
      </div>
      {hasError ? (
        <p className="flex items-center gap-1 text-xs text-red-600">
          <AlertCircle className="h-3 w-3 shrink-0" />
          {error}
        </p>
      ) : (
        helpText && <p className="text-xs text-slate-400">{helpText}</p>
      )}
    </div>
  );
}

interface FormSelectProps {
  label: string;
  value?: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  placeholder?: string;
  className?: string;
  helpText?: string;
}

export function FormSelect({
  label,
  value,
  onChange,
  options,
  required = false,
  disabled = false,
  readOnly = false,
  placeholder,
  className,
  helpText,
}: FormSelectProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label className="text-xs font-medium text-slate-600">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </Label>
      <CustomDropdown
        value={value ?? ""}
        onChange={onChange}
        options={[
          ...(placeholder ? [{ value: "", label: placeholder }] : []),
          ...options,
        ]}
        placeholder={placeholder}
        disabled={disabled || readOnly}
        className="w-full [&_button]:w-full [&_button]:min-w-0"
      />
      {helpText && <p className="text-xs text-slate-400">{helpText}</p>}
    </div>
  );
}

// ── Section header (used inside each collapsible profile Card) ──────────────────
// A coloured icon badge + title + optional sub-line makes every section instantly
// scannable and gives the page a clear visual rhythm.
export type SectionAccent =
  | "slate"
  | "emerald"
  | "sky"
  | "violet"
  | "amber"
  | "rose"
  | "pink"
  | "indigo"
  | "green"
  | "cyan"
  | "teal";

const accentStyles: Record<SectionAccent, string> = {
  slate: "bg-slate-100 text-slate-600",
  emerald: "bg-emerald-100 text-emerald-600",
  sky: "bg-sky-100 text-sky-600",
  violet: "bg-violet-100 text-violet-600",
  amber: "bg-amber-100 text-amber-600",
  rose: "bg-rose-100 text-rose-600",
  pink: "bg-pink-100 text-pink-600",
  indigo: "bg-indigo-100 text-indigo-600",
  green: "bg-green-100 text-green-600",
  cyan: "bg-cyan-100 text-cyan-600",
  teal: "bg-teal-100 text-teal-600",
};

interface SectionHeaderProps {
  icon: ReactNode;
  title: string;
  description?: string;
  accent?: SectionAccent;
  isOpen: boolean;
  badge?: string;
}

export function SectionHeader({
  icon,
  title,
  description,
  accent = "slate",
  isOpen,
  badge,
}: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
            accentStyles[accent]
          )}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-800 truncate">{title}</h3>
            {badge && (
              <span
                className={cn(
                  "text-[10px] font-semibold px-1.5 py-0.5 rounded-full whitespace-nowrap",
                  accentStyles[accent]
                )}
              >
                {badge}
              </span>
            )}
          </div>
          {description && <p className="text-xs text-slate-500 mt-0.5 truncate">{description}</p>}
        </div>
      </div>
      <ChevronDown
        className={cn(
          "h-4 w-4 shrink-0 text-slate-400 transition-transform",
          isOpen && "rotate-180"
        )}
      />
    </div>
  );
}

interface FormSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function FormSection({ title, description, children, className }: FormSectionProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="pb-2">
        <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
        {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

interface FormCheckboxProps {
  id: string;
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  variant?: "default" | "warning";
  className?: string;
  disabled?: boolean;
}

export function FormCheckbox({
  id,
  label,
  checked,
  onCheckedChange,
  variant = "default",
  className,
  disabled = false,
}: FormCheckboxProps) {
  return (
    <label
      htmlFor={id}
      className={cn(
        "flex items-center gap-2.5 cursor-pointer group",
        disabled && "opacity-60 cursor-not-allowed pointer-events-none",
        className
      )}
    >
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={(e) => onCheckedChange(e.target.checked)}
        disabled={disabled}
        className="h-4 w-4 rounded border-slate-300 text-slate-700 focus:ring-slate-400 focus:ring-offset-0 disabled:cursor-not-allowed"
      />
      <span
        className={cn(
          "text-sm font-normal leading-tight",
          variant === "warning" ? "text-amber-700" : "text-slate-600",
          !disabled && "group-hover:text-slate-800"
        )}
      >
        {label}
      </span>
    </label>
  );
}
