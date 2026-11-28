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
  name: <User className="h-4 w-4 text-muted-foreground" />,
  email: <Mail className="h-4 w-4 text-muted-foreground" />,
  phone: <Phone className="h-4 w-4 text-muted-foreground" />,
  address: <MapPin className="h-4 w-4 text-muted-foreground" />,
  city: <Building2 className="h-4 w-4 text-muted-foreground" />,
  date: <Calendar className="h-4 w-4 text-muted-foreground" />,
  job: <Briefcase className="h-4 w-4 text-muted-foreground" />,
  education: <GraduationCap className="h-4 w-4 text-muted-foreground" />,
  document: <FileText className="h-4 w-4 text-muted-foreground" />,
  country: <Globe className="h-4 w-4 text-muted-foreground" />,
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
      <Label className="text-xs font-semibold text-foreground">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
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
            "h-12 text-sm bg-card border border-border rounded-lg",
            "placeholder:text-muted-foreground",
            "disabled:bg-muted/40 disabled:text-muted-foreground disabled:cursor-not-allowed",
            "read-only:bg-muted/40 read-only:text-foreground read-only:border-border",
            "focus:outline-none focus:ring-1 transition-colors",
            hasError
              ? "border-destructive focus:border-destructive focus:ring-destructive/20"
              : "border-border hover:border-border/80 focus:border-primary focus:ring-primary/20",
            icon ? "pl-9" : "px-3"
          )}
        />
      </div>
      {hasError ? (
        <p className="flex items-center gap-1 text-xs text-destructive font-medium">
          <AlertCircle className="h-3 w-3 shrink-0" />
          {error}
        </p>
      ) : (
        helpText && <p className="text-xs text-muted-foreground">{helpText}</p>
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
      <Label className="text-xs font-semibold text-foreground">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
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
        className="w-full [&_button]:w-full [&_button]:min-w-0 [&_button]:h-12 [&_button]:text-sm [&_button]:rounded-lg [&_button]:border-border [&_button]:hover:border-border/80 [&_button]:focus:border-primary"
      />
      {helpText && <p className="text-xs text-muted-foreground">{helpText}</p>}
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
  slate: "bg-muted text-muted-foreground",
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
    <div className="flex items-center justify-between gap-3 w-full">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
            accentStyles[accent]
          )}
        >
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-semibold text-foreground">{title}</h3>
            {badge && (
              <span
                className={cn(
                  "text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap",
                  accentStyles[accent]
                )}
              >
                {badge}
              </span>
            )}
          </div>
          {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
        </div>
      </div>
      <ChevronDown
        className={cn(
          "h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200",
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
      <div className="pb-1">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
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
        className="h-4 w-4 rounded border-border text-foreground focus:ring-ring focus:ring-offset-0 disabled:cursor-not-allowed accent-primary"
      />
      <span
        className={cn(
          "text-sm font-normal leading-snug",
          variant === "warning" ? "text-amber-600 dark:text-amber-400" : "text-foreground",
          !disabled && "group-hover:text-foreground"
        )}
      >
        {label}
      </span>
    </label>
  );
}
