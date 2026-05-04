"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Field as FormField } from "@/lib/formConfig/types";
import { Check } from "lucide-react";
import { ExpandableTooltip } from "@/app/components/shared/ExpandableTooltip";
import {
  CustomDropdown,
  type DropdownOption,
} from "@/app/components/shared/CustomDropdown";
import { US_STATES } from "@/lib/formConfig/constants";

/* ==================== Input Components ==================== */

const SafeInput = (props: React.InputHTMLAttributes<HTMLInputElement>) => {
  const { value, className, ...rest } = props;
  return (
    <input
      {...rest}
      value={value ?? ""}
      className={`w-full px-4 py-3 rounded-lg bg-white border border-[#d0e8e9] text-gray-900 placeholder:text-gray-400 outline-none transition-all duration-150 focus:border-[#0d7377] focus:ring-3 focus:ring-[#0d7377]/20 ${
        className || ""
      }`}
    />
  );
};

const DateInput = (props: React.InputHTMLAttributes<HTMLInputElement>) => {
  const { value, className, ...rest } = props;
  return (
    <input
      {...rest}
      type="date"
      value={value ?? ""}
      className={`w-full px-4 py-3 rounded-lg bg-white border border-[#d0e8e9] text-gray-900 outline-none transition-all duration-150 focus:border-[#0d7377] focus:ring-3 focus:ring-[#0d7377]/20 ${
        className || ""
      }`}
    />
  );
};

const Textarea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea
    {...props}
    className={`w-full px-4 py-3 rounded-lg bg-white border border-[#d0e8e9] text-gray-900 placeholder:text-gray-400 outline-none transition-all duration-150 resize-none focus:border-[#0d7377] focus:ring-3 focus:ring-[#0d7377]/20 ${
      props.className || ""
    }`}
  />
);

type RadioOption = { label: string; value: string; pdfKey?: string };

interface RadioGroupProps {
  name: string;
  options: RadioOption[];
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const RadioGroup = ({ name, options, value, onChange }: RadioGroupProps) => {
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
              whileHover={{ borderColor: "#0d7377" }}
              whileTap={{ scale: 0.98 }}
              className="p-4 rounded-lg border-2 transition-all duration-150 text-left"
              style={{
                borderColor: selected ? "#0d7377" : "#d0e8e9",
                backgroundColor: selected ? "#e8f6f6" : "#ffffff",
                boxShadow: selected
                  ? "0 2px 8px rgba(13, 115, 119, 0.12)"
                  : "0 1px 2px rgba(0,0,0,0.04)",
              }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="mt-1 flex items-center justify-center w-5 h-5 rounded-full border-2 shrink-0 transition-all"
                  style={{
                    borderColor: selected ? "#0d7377" : "#cbd5d5",
                    backgroundColor: selected ? "#0d7377" : "transparent",
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
                  style={{ color: selected ? "#0a5a5d" : "#1f2937" }}
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
}

const CheckboxCard = ({
  name,
  label,
  checked,
  onChange,
}: CheckboxCardProps) => (
  <label className="block cursor-pointer">
    <input
      type="checkbox"
      name={name}
      checked={checked}
      onChange={onChange}
      className="sr-only"
    />
    <motion.div
      whileHover={{ borderColor: "#0d7377" }}
      whileTap={{ scale: 0.98 }}
      className="p-4 rounded-lg border-2 transition-all duration-150 flex items-center gap-3"
      style={{
        borderColor: checked ? "#0d7377" : "#d0e8e9",
        backgroundColor: checked ? "#e8f6f6" : "#ffffff",
        boxShadow: checked
          ? "0 2px 8px rgba(13, 115, 119, 0.12)"
          : "0 1px 2px rgba(0,0,0,0.04)",
      }}
    >
      <div
        className="flex items-center justify-center w-5 h-5 rounded-md border-2 shrink-0 transition-all"
        style={{
          borderColor: checked ? "#0d7377" : "#cbd5d5",
          backgroundColor: checked ? "#0d7377" : "transparent",
        }}
      >
        {checked && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
      </div>
      <span
        className="text-sm font-medium"
        style={{ color: checked ? "#0a5a5d" : "#1f2937" }}
      >
        {label}
      </span>
    </motion.div>
  </label>
);

/* ==================== FormStep Component ==================== */

interface FormStepProps {
  stepNumber: number;
  sectionTitle: string;
  fields: FormField[];
  allVisibleFields?: FormField[];
  formData: Record<string, string>;
  onInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
  currentQuestionIndex?: number;
  navigationDirection?: "next" | "prev";
  progressiveSubQuestionIndices?: Record<string, number>;
}

export function FormStep({
  sectionTitle,
  fields,
  formData,
  onInputChange,
  currentQuestionIndex,
  navigationDirection = "next",
  progressiveSubQuestionIndices = {},
}: FormStepProps) {
  const [isClient, setIsClient] = useState(false);

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
    return (
      <div className="py-12 text-center text-gray-500">
        No questions in this section.
      </div>
    );
  }

  const activeIdx =
    typeof currentQuestionIndex === "number"
      ? Math.min(Math.max(currentQuestionIndex, 0), fields.length - 1)
      : fields.length - 1;

  const activeField = fields[activeIdx];
  const cleanSection = sectionTitle.replace(/^\d+\.\s*/, "");

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

  const renderSubQuestions = (field: FormField) => {
    const hasSubQuestions = field.subQuestions && field.subQuestions.length > 0;

    if (!hasSubQuestions) {
      return renderInput(field);
    }

    const applicableSubQuestions = (field.subQuestions || []).filter(
      (subQ): subQ is FormField => !subQ.condition || subQ.condition(formData),
    );

    const progressiveIndex = progressiveSubQuestionIndices[field.key] ?? -1;
    const visibleSubQuestions = applicableSubQuestions.slice(
      0,
      progressiveIndex + 1,
    );
    const shouldRenderParent = field.type !== "hidden";
    // const shouldRenderParent = field.options && field.options.length > 0;

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
            <label className="block text-sm font-medium text-gray-700">
              {subQ.label}
            </label>
            {renderInput(subQ as FormField)}
          </motion.div>
        ))}
      </div>
    );
  };

  const renderInput = (field: FormField) => {
    if (field.type === "date") {
      return (
        <DateInput
          name={field.key}
          value={formData[field.key] ?? ""}
          onChange={onInputChange}
          placeholder={field.placeholder}
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
          placeholder={field.placeholder}
          maxLength={field.maxLength}
        />
      );
    }
    if (field.type === "radio") {
      return (
        <RadioGroup
          name={field.key}
          options={(field.options as RadioOption[]) || []}
          value={formData[field.key] ?? ""}
          onChange={onInputChange}
        />
      );
    }
    if (field.type === "checkbox") {
      return (
        <CheckboxCard
          name={field.key}
          label={field.label}
          checked={formData[field.key] === "Yes"}
          onChange={onInputChange}
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
          className="border-[#d0e8e9] focus:border-[#0d7377]"
        />
      );
    }
    return null;
  };

  return (
    <div className="w-full">
      {/* Header */}
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
      {activeField.tooltip && (
        <ExpandableTooltip
          icon="?"
          title="What does this mean?"
          message={activeField.tooltip}
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
          className="space-y-6"
        >
          {/* Question Heading */}
          <div>
            <h2 className="text-2xl md:text-3xl font-semibold leading-snug text-gray-900 mb-2">
              {mainQuestion}
            </h2>
            {hintText && (
              <p className="text-sm text-gray-600 mt-1">{hintText}</p>
            )}
          </div>

          {/* Input Section */}
          <div>{renderSubQuestions(activeField)}</div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
