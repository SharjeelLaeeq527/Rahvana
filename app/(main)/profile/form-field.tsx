"use client";

import { ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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
}: FormFieldProps) {
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
          className={cn(
            "h-10 text-sm bg-white border border-slate-200 rounded-md",
            "placeholder:text-slate-400",
            "hover:border-slate-300",
            "focus:border-slate-400 focus:ring-1 focus:ring-slate-200",
            "disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed",
            "read-only:bg-slate-50 read-only:text-slate-600",
            icon ? "pl-9" : "px-3"
          )}
        />
      </div>
      {helpText && <p className="text-xs text-slate-400">{helpText}</p>}
    </div>
  );
}

interface FormSelectProps {
  label: string;
  value: string;
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
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled || readOnly}
        className={cn(
          "flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm",
          "hover:border-slate-300",
          "focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-200",
          "disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
        )}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {helpText && <p className="text-xs text-slate-400">{helpText}</p>}
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
