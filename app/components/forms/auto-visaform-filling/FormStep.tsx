"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Field as FormField } from "@/lib/formConfig/types";
import { Check, Info, ChevronDown } from "lucide-react";
import { US_STATES } from "@/lib/formConfig/constants";

/* Inputs */

const SafeInput = (props: React.InputHTMLAttributes<HTMLInputElement>) => {
  const { value, className, ...rest } = props;
  return (
    <input
      {...rest}
      value={value ?? ""}
      className={`w-full mt-1 px-4 py-3.5 rounded-xl bg-white border-2 border-[#e8f6f6] text-gray-900 placeholder:text-gray-400 outline-none transition-all duration-200 focus:border-[#0d7377] focus:ring-4 focus:ring-[#0d7377]/10 hover:border-[#14a0a6]/50 ${
        className || ""
      }`}
    />
  );
};

const Textarea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea
    {...props}
    className={`w-full mt-1 px-4 py-3.5 rounded-xl bg-white border-2 border-[#e8f6f6] text-gray-900 placeholder:text-gray-400 outline-none transition-all duration-200 resize-none focus:border-[#0d7377] focus:ring-4 focus:ring-[#0d7377]/10 hover:border-[#14a0a6]/50 ${
      props.className || ""
    }`}
  />
);

const Select = (props: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <select
    {...props}
    className={`w-full mt-1 px-4 py-3.5 rounded-xl bg-white border-2 border-[#e8f6f6] text-gray-900 placeholder:text-gray-400 outline-none transition-all duration-200 focus:border-[#0d7377] focus:ring-4 focus:ring-[#0d7377]/10 hover:border-[#14a0a6]/50 appearance-none cursor-pointer ${
      props.className || ""
    }`}
  >
    {props.children}
  </select>
);

type RadioOption = { label: string; value: string; pdfKey: string };

interface RadioGroupProps {
  name: string;
  options: RadioOption[];
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const RadioGroup = ({ name, options, value, onChange }: RadioGroupProps) => {
  // Mobile: always column, Desktop: responsive columns based on count
  const cols =
    options.length >= 4
      ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
      : options.length === 3
        ? "grid-cols-1 md:grid-cols-3"
        : options.length === 2
          ? "grid-cols-1 md:grid-cols-2"
          : "grid-cols-1";

  return (
    <div className={`grid ${cols} gap-3 mt-2`}>
      {options.map((opt) => {
        const selected = value === opt.value;
        return (
          <label key={opt.value} className="cursor-pointer group relative">
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={selected}
              onChange={onChange}
              className="sr-only peer"
            />
            <motion.div
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="h-full p-4 rounded-xl border-2 transition-all duration-200 flex items-start gap-3"
              style={{
                borderColor: selected ? "#0a5a5d" : "#e8f6f6",
                backgroundColor: selected ? "#e8f6f6" : "#ffffff",
                boxShadow: selected
                  ? "0 4px 14px rgba(13, 115, 119, 0.15)"
                  : "0 1px 2px rgba(0,0,0,0.03)",
              }}
            >
              <div
                className="mt-0.5 flex items-center justify-center w-5 h-5 rounded-full border-2 shrink-0 transition-all"
                style={{
                  borderColor: selected ? "#0a5a5d" : "#cbd5d5",
                  backgroundColor: selected ? "#0d7377" : "transparent",
                }}
              >
                {selected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-2 h-2 rounded-full bg-white"
                  />
                )}
              </div>
              <span
                className="text-sm font-medium leading-snug"
                style={{ color: selected ? "#0a5a5d" : "#1f2937" }}
              >
                {opt.label}
              </span>
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
  <label className="block cursor-pointer mt-2">
    <input
      type="checkbox"
      name={name}
      checked={checked}
      onChange={onChange}
      className="sr-only"
    />
    <motion.div
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      className="p-4 rounded-xl border-2 transition-all duration-200 flex items-center gap-3"
      style={{
        borderColor: checked ? "#0a5a5d" : "#e8f6f6",
        backgroundColor: checked ? "#e8f6f6" : "#ffffff",
        boxShadow: checked
          ? "0 4px 14px rgba(13, 115, 119, 0.15)"
          : "0 1px 2px rgba(0,0,0,0.03)",
      }}
    >
      <div
        className="flex items-center justify-center w-5 h-5 rounded-md border-2 shrink-0 transition-all"
        style={{
          borderColor: checked ? "#0a5a5d" : "#cbd5d5",
          backgroundColor: checked ? "#0d7377" : "transparent",
        }}
      >
        {checked && (
          <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
        )}
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

/* Flashcard step */

interface FormStepProps {
  stepNumber: number;
  sectionTitle: string;
  fields: FormField[];
  allVisibleFields?: FormField[];
  formData: Record<string, string>;
  onInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
  /** Index of currently visible question (within `fields`). Optional: defaults to last. */
  currentQuestionIndex?: number;
  navigationDirection?: "next" | "prev";
  progressiveSubQuestionIndices?: Record<string, number>;
}

export function FormStep({
  sectionTitle,
  fields,
  allVisibleFields,
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
      <div className="space-y-6 animate-pulse">
        <div className="h-7 bg-[#e8f6f6] rounded-lg w-2/3" />
        <div className="h-48 bg-[#e8f6f6] rounded-2xl" />
      </div>
    );
  }

  if (!fields.length) {
    return (
      <div className="py-16 text-center text-gray-500">
        No questions in this section.
      </div>
    );
  }

  const activeIdx =
    typeof currentQuestionIndex === "number"
      ? Math.min(Math.max(currentQuestionIndex, 0), fields.length - 1)
      : fields.length - 1;

  const activeField = fields[activeIdx];
  const answeredFields = fields.slice(0, activeIdx);
  const cleanSection = sectionTitle.replace(/^\d+\.\s*/, "");

  // Render multiple sub-questions in same card (4a, 4b, 4c scenario)
  const renderSubQuestions = (field: FormField) => {
    // If field has subQuestions, check if parent should be rendered
    const hasSubQuestions = field.subQuestions && field.subQuestions.length > 0;

    if (!hasSubQuestions) {
      // No subQuestions - just render the field normally
      return renderInput(field);
    }

    // Filter subQuestions based on their conditions
    const applicableSubQuestions = (field.subQuestions || []).filter(
      (subQ): subQ is FormField => !subQ.condition || subQ.condition(formData),
    );

    const progressiveIndex = progressiveSubQuestionIndices[field.key] ?? -1;
    const visibleSubQuestions = applicableSubQuestions.slice(
      0,
      progressiveIndex + 1,
    );

    // Only render parent field if it has options (e.g., radio buttons)
    // Skip parent if it's just a grouping label (no options)
    const shouldRenderParent = field.options && field.options.length > 0;

    return (
      <div className="space-y-5">
        {/* Render parent field only if it has options (like radio buttons) */}
        {shouldRenderParent && renderInput(field)}

        {/* Render sub-questions progressively */}
        {visibleSubQuestions.map((subQ) => (
          <motion.div
            key={subQ.key}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-2"
          >
            <label className="block text-sm font-semibold text-gray-700">
              {subQ.label}
            </label>
            {renderInput(subQ as FormField)}
          </motion.div>
        ))}
      </div>
    );
  };

  const renderInput = (field: FormField) => {
    if (field.type === "text" || field.type === "date") {
      return (
        <SafeInput
          type="text"
          name={field.key}
          value={formData[field.key] ?? ""}
          onChange={onInputChange}
          placeholder={field.placeholder}
          maxLength={field.maxLength}
          autoFocus
        />
      );
    }
    if (field.type === "radio") {
      return (
        <RadioGroup
          name={field.key}
          options={field.options!}
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
          rows={5}
          autoFocus
        />
      );
    }
    if (field.type === "dropdown") {
      const options = field.isState ? US_STATES : field.options || [];
      <div className="relative group/select">
        <Select
          name={field.key}
          value={formData[field.key] ?? ""}
          onChange={onInputChange as any}
          autoFocus
        >
          <option value="">
            Select {field.isState ? "a State" : "an option"}
          </option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>
        <div className="absolute right-4 top-[calc(50%+2px)] -translate-y-1/2 pointer-events-none transition-transform group-focus-within/select:rotate-180">
          <ChevronDown className="w-5 h-5 text-[#0d7377]" />
        </div>
      </div>;
    }
    return null;
  };

  return (
    <div>
      {/* Section heading */}
      <div className="mb-8">
        <p
          className="text-[11px] font-semibold uppercase tracking-[0.16em] mb-2"
          style={{ color: "#0d7377" }}
        >
          Current Section
        </p>
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">
          {cleanSection}
        </h2>
      </div>

      {/* Premium Flashcard */}
      <div className="relative" style={{ perspective: 1400 }}>
        {/* Subtle glow effect behind card */}
        <div
          className="absolute -inset-4 rounded-3xl blur-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-500"
          style={{
            background:
              "linear-gradient(135deg, #0d7377 0%, #14a0a6 50%, #32e0c4 100%)",
          }}
          aria-hidden
        />

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeField.key}
            initial={{
              opacity: 0,
              rotateY: navigationDirection === "next" ? 35 : -35,
              x: navigationDirection === "next" ? 60 : -60,
            }}
            animate={{ opacity: 1, rotateY: 0, x: 0 }}
            exit={{
              opacity: 0,
              rotateY: navigationDirection === "next" ? -35 : 35,
              x: navigationDirection === "next" ? -60 : 60,
            }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="relative rounded-3xl bg-white border border-[#e8f6f6] p-7 md:p-9 group"
            style={{
              boxShadow:
                "0 16px 50px -12px rgba(13, 115, 119, 0.2), 0 4px 12px rgba(0,0,0,0.05), inset 0 1px 1px rgba(255,255,255,0.8)",
              transformStyle: "preserve-3d",
              transition: "all 0.3s cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          >
            {/* Question counter with gradient */}
            <div className="flex items-center justify-between gap-3 mb-6">
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="px-3 py-1 rounded-full text-xs font-bold bg-linear-to-r from-[#0d7377] to-[#14a0a6] text-white"
                style={{
                  boxShadow: "0 4px 12px rgba(13, 115, 119, 0.3)",
                }}
              >
                Q{activeIdx + 1} / {fields.length}
              </motion.span>
            </div>

            {/* Question label with tooltip */}
            <div className="flex items-start gap-3 mb-6">
              <label className="block text-xl md:text-2xl font-bold text-gray-900 leading-snug flex-1">
                {activeField.label}
              </label>
              {activeField.tooltip && (
                <div className="group/tooltip relative shrink-0 mt-1">
                  <Info
                    className="h-5 w-5 cursor-help"
                    style={{ color: "#14a0a6" }}
                  />
                  <div className="absolute right-0 top-full mt-2 w-72 p-4 bg-linear-to-br from-gray-900 to-gray-800 text-white text-xs rounded-xl opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-20 shadow-2xl border border-gray-700">
                    {activeField.tooltip}
                    <div className="absolute right-4 -top-2 w-0 h-0 border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-gray-900" />
                  </div>
                </div>
              )}
            </div>

            {/* Input area with enhanced styling */}
            <div className="space-y-5">{renderSubQuestions(activeField)}</div>

            {activeField.placeholder && activeField.type !== "text" && (
              <p className="mt-4 text-xs text-gray-500 italic">
                {activeField.placeholder}
              </p>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Premium Answered Chips */}
      {answeredFields.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8"
        >
          <p
            className="text-xs font-semibold uppercase tracking-[0.14em] mb-3"
            style={{ color: "#0a5a5d" }}
          >
            ✓ Completed in this section
          </p>
          <div className="flex flex-wrap gap-2">
            {answeredFields.map((f, i) => (
              <motion.div
                key={f.key}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-semibold border"
                style={{
                  background:
                    "linear-gradient(135deg, #e8f6f6 0%, #f0fafb 100%)",
                  borderColor: "rgba(13, 115, 119, 0.2)",
                  color: "#0a5a5d",
                  boxShadow: "0 2px 8px rgba(13, 115, 119, 0.1)",
                }}
              >
                <Check
                  className="w-3.5 h-3.5"
                  style={{ color: "#0d7377" }}
                  strokeWidth={3}
                />
                <span className="max-w-xs truncate">Q{i + 1}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
