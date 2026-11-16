"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Field as FormField } from "@/lib/formConfig/types";
import { Check, AlertTriangle, User, UserCheck, Info, AlertCircle } from "lucide-react";
import { ExpandableTooltip } from "@/app/components/shared/ExpandableTooltip";
import { CustomDropdown, type DropdownOption } from "@/app/components/shared/CustomDropdown";
import { US_STATES } from "@/lib/formConfig/constants";
import { UrduKeyboard } from "@/app/components/shared/UrduKeyboard";
import { isFieldCritical, getFieldCandidateScope } from "@/lib/formConfig/candidateScope";

/* ==================== Input Components ==================== */

interface ThemedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  theme?: "teal" | "cerulean";
}

const SafeInput = (props: ThemedInputProps) => {
  const { value, className, theme = "teal", ...rest } = props;
  const isCerulean = theme === "cerulean";
  return (
    <input
      {...rest}
      value={value ?? ""}
      className={`w-full px-4 py-3 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 outline-none transition-all duration-150 ${
        isCerulean
          ? "border-2 border-sky-400 focus:border-[#0284c7] focus:ring-4 focus:ring-sky-100 text-slate-900 font-normal"
          : "border border-[#d0e8e9] focus:border-[#0d7377] focus:ring-3 focus:ring-[#0d7377]/20"
      } ${className || ""}`}
    />
  );
};

const DateInput = (props: ThemedInputProps) => {
  const { value, className, theme = "teal", ...rest } = props;
  const isCerulean = theme === "cerulean";
  return (
    <input
      {...rest}
      type="date"
      value={value ?? ""}
      className={`w-full px-4 py-3 rounded-lg bg-white text-gray-900 outline-none transition-all duration-150 ${
        isCerulean
          ? "border-2 border-sky-400 focus:border-[#0284c7] focus:ring-4 focus:ring-sky-100 text-slate-900 font-normal"
          : "border border-[#d0e8e9] focus:border-[#0d7377] focus:ring-3 focus:ring-[#0d7377]/20"
      } ${className || ""}`}
    />
  );
};

interface ThemedTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  theme?: "teal" | "cerulean";
}

const Textarea = (props: ThemedTextareaProps) => {
  const { theme = "teal", className, ...rest } = props;
  const isCerulean = theme === "cerulean";
  return (
    <textarea
      {...rest}
      className={`w-full px-4 py-3 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 outline-none transition-all duration-150 resize-none ${
        isCerulean
          ? "border-2 border-sky-400 focus:border-[#0284c7] focus:ring-4 focus:ring-sky-100 text-slate-900 font-normal"
          : "border border-[#d0e8e9] focus:border-[#0d7377] focus:ring-3 focus:ring-[#0d7377]/20"
      } ${className || ""}`}
    />
  );
};

type RadioOption = { label: string; value: string; pdfKey?: string };

interface RadioGroupProps {
  name: string;
  options: RadioOption[];
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  theme?: "teal" | "cerulean";
}

const RadioGroup = ({ name, options, value, onChange, theme = "teal" }: RadioGroupProps) => {
  const isCerulean = theme === "cerulean";
  const primaryColor = isCerulean ? "#0284c7" : "#0d7377";
  const bgSelected = isCerulean ? "#f0f9ff" : "#e8f6f6";
  const textSelected = isCerulean ? "#0369a1" : "#0a5a5d";
  const borderDefault = isCerulean ? "#bae6fd" : "#d0e8e9";

  const cols =
    options.length >= 4
      ? "grid-cols-1 md:grid-cols-2"
      : options.length === 3
        ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
        : options.length === 2
          ? "grid-cols-1 md:grid-cols-2"
          : "grid-cols-1";

  return (
    <div className={`grid ${cols} gap-3`}>
      {options.map((opt) => {
        const selected = value === opt.value;
        return (
          <label key={opt.value} className="cursor-pointer">
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={selected}
              onChange={onChange}
              className="sr-only peer"
            />
            <motion.div
              whileHover={{ borderColor: primaryColor }}
              whileTap={{ scale: 0.98 }}
              className="p-4 rounded-lg border-2 transition-all duration-150 text-left"
              style={{
                borderColor: selected ? primaryColor : borderDefault,
                backgroundColor: selected ? bgSelected : "#ffffff",
                boxShadow: selected ? "0 2px 8px rgba(2, 132, 199, 0.12)" : "0 1px 2px rgba(0,0,0,0.04)",
              }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="mt-1 flex items-center justify-center w-5 h-5 rounded-full border-2 shrink-0 transition-all"
                  style={{
                    borderColor: selected ? primaryColor : "#cbd5d5",
                    backgroundColor: selected ? primaryColor : "transparent",
                  }}
                >
                  {selected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-2.5 h-2.5 rounded-full bg-white"
                    />
                  )}
                </div>
                <span
                  className="text-sm font-medium leading-snug"
                  style={{ color: selected ? textSelected : "#1f2937" }}
                >
                  {opt.label}
                </span>
              </div>
            </motion.div>
          </label>
        );
      })}
    </div>
  );
};

interface CheckboxCardProps {
  name: string;
  label: string;
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  theme?: "teal" | "cerulean";
}

const CheckboxCard = ({ name, label, checked, onChange, theme = "teal" }: CheckboxCardProps) => {
  const isCerulean = theme === "cerulean";
  const primaryColor = isCerulean ? "#0284c7" : "#0d7377";
  const bgSelected = isCerulean ? "#f0f9ff" : "#e8f6f6";
  const textSelected = isCerulean ? "#0369a1" : "#0a5a5d";
  const borderDefault = isCerulean ? "#bae6fd" : "#d0e8e9";

  return (
    <label className="block cursor-pointer">
      <input type="checkbox" name={name} checked={checked} onChange={onChange} className="sr-only" />
      <motion.div
        whileHover={{ borderColor: primaryColor }}
        whileTap={{ scale: 0.98 }}
        className="p-4 rounded-lg border-2 transition-all duration-150 flex items-center gap-3"
        style={{
          borderColor: checked ? primaryColor : borderDefault,
          backgroundColor: checked ? bgSelected : "#ffffff",
          boxShadow: checked ? "0 2px 8px rgba(2, 132, 199, 0.12)" : "0 1px 2px rgba(0,0,0,0.04)",
        }}
      >
        <div
          className="flex items-center justify-center w-5 h-5 rounded-md border-2 shrink-0 transition-all"
          style={{
            borderColor: checked ? primaryColor : "#cbd5d5",
            backgroundColor: checked ? primaryColor : "transparent",
          }}
        >
          {checked && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
        </div>
        <span className="text-sm font-medium" style={{ color: checked ? textSelected : "#1f2937" }}>
          {label}
        </span>
      </motion.div>
    </label>
  );
};

/* ==================== FormStep Component ==================== */

interface FormStepProps {
  stepNumber: number;
  sectionTitle: string;
  fields: FormField[];
  allVisibleFields?: FormField[];
  formData: Record<string, string>;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  currentQuestionIndex?: number;
  navigationDirection?: "next" | "prev";
  progressiveSubQuestionIndices?: Record<string, number>;
  formCode?: string;
  activeCandidate?: any;
  journeyCategory?: string | null;
}

export function FormStep({
  sectionTitle,
  fields,
  formData,
  onInputChange,
  currentQuestionIndex,
  navigationDirection = "next",
  progressiveSubQuestionIndices = {},
  formCode = "i130",
  activeCandidate,
  journeyCategory,
}: FormStepProps) {
  const [isClient, setIsClient] = useState(false);
  const [activeKeyboardField, setActiveKeyboardField] = useState<string | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3" />
        <div className="h-32 bg-gray-200 rounded-lg" />
      </div>
    );
  }

  if (!fields.length) {
    return <div className="py-12 text-center text-gray-500">No questions in this section.</div>;
  }

  const activeIdx =
    typeof currentQuestionIndex === "number"
      ? Math.min(Math.max(currentQuestionIndex, 0), fields.length - 1)
      : fields.length - 1;

  const activeField = fields[activeIdx];
  const cleanSection = sectionTitle.replace(/^\d+\.\s*/, "");
  const fieldScope = getFieldCandidateScope(formCode, activeField, sectionTitle);
  const isCandidateDistinct = fieldScope === "candidate_distinct";

  // Resolve a human-readable display name — never expose raw labels like "Candidate 1".
  // Priority: activeCandidate.fullName → filled formData name field → humanized label → "Beneficiary"
  const resolveDisplayName = (candidate: any): string => {
    if (!candidate) return "Beneficiary";

    // 1. Profile already has a resolved full name
    if (candidate.fullName) {
      return candidate.fullName.split(" ")[0];
    }

    // 2. Petitioner has already typed the beneficiary's first name into the form
    const firstNameKeys = [
      "pt4_beneficiary_first",
      "beneficiary_first_name",
      "ds260_first_name",
      "applicant_first_name",
      "immigrant_first_name",
    ];
    for (const k of firstNameKeys) {
      const v = formData[k]?.trim();
      if (v) return v;
    }

    // 3. Humanize raw label: "Candidate 1" → "Beneficiary 1", remove parenthesized (Beneficiary)
    if (candidate.label) {
      return candidate.label
        .replace(/\s*\([^)]*\)/g, "")
        .replace(/candidate\s*(\d+)?/i, (_: string, n: string) => (n ? `Beneficiary ${n}` : "Beneficiary"))
        .trim();
    }

    return "Beneficiary";
  };

  // Humanize relation: "spouse" → "Spouse", ignore redundant "beneficiary" / "other"
  const resolveRelationLabel = (relation?: string): string => {
    if (!relation) return "";
    const r = relation.trim().toLowerCase();
    if (r === "beneficiary" || r === "applicant" || r === "immigrant" || r === "other") return "";
    const map: Record<string, string> = {
      spouse: "Spouse",
      wife: "Wife",
      husband: "Husband",
      child: "Child",
      son: "Son",
      daughter: "Daughter",
      mother: "Mother",
      father: "Father",
      parent: "Parent",
      brother: "Brother",
      sister: "Sister",
      sibling: "Sibling",
    };
    return map[r] || relation.charAt(0).toUpperCase() + relation.slice(1);
  };

  const candidateName = resolveDisplayName(activeCandidate);
  const candidateRelationLabel = resolveRelationLabel(activeCandidate?.relation);
  const isFirstCandidate =
    !activeCandidate ||
    activeCandidate?.id === "candidate-1" ||
    !activeCandidate?.id ||
    Boolean(activeCandidate?.label && /candidate\s*1\b|parent\s*1\b|child\s*1\b/i.test(activeCandidate.label));

  const fieldCriticalMeta = isFieldCritical(formCode, activeField, {
    fullName: candidateName,
    relation: candidateRelationLabel || activeCandidate?.relation,
    visaCategory: activeCandidate?.visaCategory,
    isFirstCandidate,
    candidateLabel: activeCandidate?.label,
    sectionTitle,
  });

  // Parse label to separate main question from bracket text (hint)
  const parseLabel = (label: string) => {
    const parts = label.split("\n");
    if (parts.length > 1) {
      return {
        main: parts[0],
        hint: parts.slice(1).join(" ").replace(/[()]/g, "").trim(),
      };
    }
    return { main: label, hint: null };
  };

  const { main: mainQuestion, hint: hintText } = parseLabel(activeField.label);

  const hasSubQuestions = !!(activeField.subQuestions && activeField.subQuestions.length > 0);
  const isInfoField = activeField.type === "hidden" && !hasSubQuestions;
  const infoLines = activeField.type === "hidden"
    ? activeField.label
        .split("\n")
        .slice(1)
        .map((line) => line.trim())
        .filter(Boolean)
    : [];

  const topHint = activeField.hint || hintText;
  const topHelp = activeField.tooltip || activeField.help;

  const renderFindExample = (field: FormField) => (
    <>
      {field.find && (
        <div className="rounded-lg border border-[#d0e8e9] bg-[#f2fafa] px-3 py-2.5 text-sm leading-relaxed text-[#0a5a5d]">
          <span className="font-semibold">Where to find this: </span>
          {field.find}
        </div>
      )}
      {field.example && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm leading-relaxed text-emerald-900">
          <span className="font-semibold">Example: </span>
          {field.example}
        </div>
      )}
    </>
  );

  const renderSubQuestions = (field: FormField) => {
    const hasSubs = field.subQuestions && field.subQuestions.length > 0;

    if (!hasSubs) {
      return renderInput(field);
    }

    const applicableSubQuestions = (field.subQuestions || []).filter(
      (subQ): subQ is FormField => !subQ.condition || subQ.condition(formData)
    );

    const progressiveIndex =
      progressiveSubQuestionIndices[field.key] ?? (field.type === "hidden" ? 0 : -1);
    const visibleSubQuestions = applicableSubQuestions.slice(0, progressiveIndex + 1);
    const shouldRenderParent = field.type !== "hidden";

    return (
      <div className="space-y-4">
        {shouldRenderParent && renderInput(field)}
        {visibleSubQuestions.map((subQ) => (
          <motion.div
            key={subQ.key}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="space-y-2"
          >
            <label className="text-[20px] md:text-[24px] font-semibold leading-[1.35] tracking-[-0.02em] text-gray-900">
              {subQ.label}
            </label>
            {subQ.hint && <p className="text-sm text-gray-600">{subQ.hint}</p>}
            {(subQ.tooltip || subQ.help) && (
              <ExpandableTooltip
                icon="?"
                title="What does this mean?"
                message={(subQ.tooltip || subQ.help) as string}
                defaultOpen={false}
              />
            )}
            {renderFindExample(subQ as FormField)}
            {renderInput(subQ as FormField)}
          </motion.div>
        ))}
      </div>
    );
  };

  const renderInput = (field: FormField) => {
    const inputTheme = "teal";

    if (field.type === "date") {
      return (
        <DateInput
          name={field.key}
          value={formData[field.key] ?? ""}
          onChange={onInputChange}
          placeholder={field.placeholder}
          theme={inputTheme}
        />
      );
    }
    if (field.type === "text") {
      return (
        <SafeInput
          type="text"
          name={field.key}
          value={formData[field.key] ?? ""}
          onChange={onInputChange}
          onFocus={() => {
            if (field.keyboardType === "urdu") {
              setActiveKeyboardField(field.key);
            }
          }}
          placeholder={field.placeholder}
          maxLength={field.maxLength}
          inputMode={field.inputMode}
          dir={field.keyboardType === "urdu" ? "rtl" : "ltr"}
          theme={inputTheme}
        />
      );
    }
    if (field.type === "radio") {
      let options = (field.options as RadioOption[]) || [];

      // In journey mode for I-130 relationship, restrict options to the specific journey category
      if (formCode === "i130" && field.key === "relationship") {
        const cat = (journeyCategory || activeCandidate?.visaCategory || "").toUpperCase();
        if (cat.includes("IR-5") || cat.includes("IR5")) {
          options = options.filter((o) => o.value === "Parent");
        } else if (
          cat.includes("IR-1") ||
          cat.includes("CR-1") ||
          cat.includes("IR1") ||
          cat.includes("CR1")
        ) {
          options = options.filter((o) => o.value === "Spouse");
        } else if (cat.includes("IR-2") || cat.includes("IR2")) {
          options = options.filter((o) => o.value === "Child");
        } else if (cat.includes("F-4") || cat.includes("F4")) {
          options = options.filter((o) => o.value === "BrotherSister");
        }
      }

      return (
        <RadioGroup
          name={field.key}
          options={options}
          value={formData[field.key] ?? ""}
          onChange={onInputChange}
          theme={inputTheme}
        />
      );
    }
    if (field.type === "checkbox") {
      if (field.options) {
        const cols =
          field.options.length >= 4
            ? "grid-cols-1 md:grid-cols-2"
            : field.options.length === 3
              ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
              : field.options.length === 2
                ? "grid-cols-1 md:grid-cols-2"
                : "grid-cols-1";
        return (
          <div className={`grid ${cols} gap-3`}>
            {field.options.map((opt) => {
              const name = opt.pdfKey || opt.value;
              return (
                <CheckboxCard
                  key={opt.value}
                  name={name}
                  label={opt.label}
                  checked={formData[name] === "Yes"}
                  onChange={onInputChange}
                  theme={inputTheme}
                />
              );
            })}
          </div>
        );
      }
      return (
        <CheckboxCard
          name={field.key}
          label={field.label}
          checked={formData[field.key] === "Yes"}
          onChange={onInputChange}
          theme={inputTheme}
        />
      );
    }
    if (field.type === "textarea") {
      return (
        <Textarea
          name={field.key}
          value={formData[field.key] ?? ""}
          onChange={onInputChange}
          placeholder={field.placeholder}
          rows={4}
          theme={inputTheme}
        />
      );
    }
    if (field.type === "dropdown") {
      let options: DropdownOption[] = [];

      const fieldWithIsState = field as FormField & { isState?: boolean };
      if (fieldWithIsState.isState) {
        options = US_STATES as DropdownOption[];
      } else if (field.options) {
        options = field.options.map((opt) => ({
          label: opt.label,
          value: opt.value,
        }));
      }

      return (
        <CustomDropdown
          value={formData[field.key] ?? ""}
          onChange={(value: string) => {
            const event = {
              target: {
                name: field.key,
                value: value,
              },
            } as React.ChangeEvent<HTMLInputElement>;
            onInputChange(event);
          }}
          options={options}
          placeholder={field.placeholder || `Select an option`}
          className="w-full [&_button]:border-[#d0e8e9] [&_button]:focus:border-[#0d7377]"
        />
      );
    }
    return null;
  };

  return (
    <div className="w-full">
      {/* Header Badge */}
      <div
        className="mb-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg backdrop-blur-md"
        style={{
          background: "rgba(232, 246, 246, 0.6)",
          border: "1px solid rgba(13, 115, 119, 0.2)",
        }}
      >
        <p
          className="text-[10px] font-semibold uppercase tracking-[0.12em]"
          style={{ color: "#0d7377" }}
        >
          {cleanSection}
        </p>
      </div>

      {/* Expandable Tooltip */}
      {topHelp && (
        <ExpandableTooltip
          icon="?"
          title="What does this mean?"
          message={topHelp}
          defaultOpen={false}
        />
      )}

      {/* Main Question Card */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={activeField.key}
          initial={{
            opacity: 0,
            y: navigationDirection === "next" ? 20 : -20,
          }}
          animate={{ opacity: 1, y: 0 }}
          exit={{
            opacity: 0,
            y: navigationDirection === "next" ? -20 : 20,
          }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="space-y-5"
        >
          {/* Subtle Beneficiary Indicator */}
          {isCandidateDistinct && (
            <div className="flex items-center justify-between gap-3 px-3.5 py-2 rounded-xl bg-[#e8f6f6]/60 border border-[#0d7377]/20 text-slate-800">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="h-6 w-6 rounded-md bg-[#0d7377] text-white flex items-center justify-center shrink-0">
                  <User className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-800">
                    {fieldCriticalMeta.isCritical && fieldCriticalMeta.title
                      ? `${fieldCriticalMeta.title} · For ${candidateName}`
                      : `For ${candidateName} (Beneficiary)`}
                  </p>
                  {fieldCriticalMeta.isCritical && fieldCriticalMeta.reason && (
                    <p className="text-[11px] text-slate-500 font-normal leading-relaxed">
                      {fieldCriticalMeta.reason}
                    </p>
                  )}
                </div>
              </div>
              {candidateRelationLabel && (
                <span className="shrink-0 text-[11px] font-medium px-2 py-0.5 rounded-md bg-white text-[#0d7377] border border-[#0d7377]/20">
                  {candidateRelationLabel}
                </span>
              )}
            </div>
          )}

          {/* Question Heading */}
          <div>
            <h2 className="text-[20px] md:text-[24px] font-bold leading-[1.35] tracking-[-0.02em] text-slate-900 mb-1.5">
              {mainQuestion}
            </h2>

            {!isInfoField && topHint && (
              <p className="text-sm text-slate-600">{topHint}</p>
            )}
          </div>

          {/* Guidance boxes: where to find this / example */}
          {!isInfoField && (activeField.find || activeField.example) && (
            <div className="space-y-2">{renderFindExample(activeField)}</div>
          )}

          {/* Info Lines */}
          {infoLines.length > 0 && (
            <div className="rounded-xl border border-[#d0e8e9] bg-[#f2fafa] p-4 sm:p-5 space-y-3">
              {infoLines.map((line, i) => {
                if (line.endsWith(":")) {
                  return (
                    <p key={i} className="text-sm sm:text-[15px] font-medium leading-relaxed text-gray-800">
                      {line}
                    </p>
                  );
                }
                if (/^note\b/i.test(line)) {
                  return (
                    <div key={i} className="mt-1 rounded-lg border border-teal-200 bg-teal-50 px-3 py-2.5 text-sm leading-relaxed text-teal-950">
                      {line}
                    </div>
                  );
                }
                return (
                  <div key={i} className="flex items-start gap-3">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#0d7377]" />
                    <p className="text-sm sm:text-[15px] leading-relaxed text-gray-700">{line}</p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Input Fields */}
          {!isInfoField && (
            <div
              className="pt-1"
            >
              {renderSubQuestions(activeField)}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Urdu Virtual Keyboard */}
      <UrduKeyboard
        isOpen={activeKeyboardField !== null}
        onClose={() => setActiveKeyboardField(null)}
        onKeyPress={(char) => {
          if (!activeKeyboardField) return;
          const currentValue = formData[activeKeyboardField] ?? "";
          const newValue = currentValue + char;
          const event = {
            target: {
              name: activeKeyboardField,
              value: newValue,
            },
          } as React.ChangeEvent<HTMLInputElement>;
          onInputChange(event);
        }}
        onBackspace={() => {
          if (!activeKeyboardField) return;
          const currentValue = formData[activeKeyboardField] ?? "";
          if (currentValue.length === 0) return;
          const newValue = currentValue.slice(0, -1);
          const event = {
            target: {
              name: activeKeyboardField,
              value: newValue,
            },
          } as React.ChangeEvent<HTMLInputElement>;
          onInputChange(event);
        }}
      />
    </div>
  );
}
