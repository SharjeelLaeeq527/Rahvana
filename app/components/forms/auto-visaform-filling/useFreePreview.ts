"use client";

import { useMemo } from "react";
import type { Field as ConfigField } from "@/lib/formConfig/types";

export const FREE_QUESTION_LIMIT = 10;

/**
 * Recursively counts how many non-empty fields in the form configuration
 * have been answered in the form data, respecting visibility conditions.
 */
export const countFilledFields = (fields: ConfigField[], data: Record<string, string>): number => {
  let count = 0;
  const walk = (items: ConfigField[]) => {
    items.forEach((f) => {
      // Check if field is visible/applicable based on parent answers
      if (f.condition && !f.condition(data)) return;
      
      if (f.type === "checkbox" && f.options) {
        const isFilled = f.options.some((opt) => data[opt.pdfKey || opt.value] === "Yes");
        if (isFilled) {
          count++;
        }
      } else {
        const val = data[f.key];
        // Radio groups, checkboxes, and text inputs are considered filled if not empty
        if (val && val.trim() !== "") {
          count++;
        }
      }
      
      if (f.subQuestions && f.subQuestions.length > 0) {
        walk(f.subQuestions as ConfigField[]);
      }
    });
  };
  walk(fields);
  return count;
};

interface UseFreePreviewProps {
  canUseSmartFormFiller: boolean;
  formFields: ConfigField[];
  formData: Record<string, string>;
}

export function useFreePreview({
  canUseSmartFormFiller,
  formFields,
  formData,
}: UseFreePreviewProps) {
  const isFreePreview = !canUseSmartFormFiller;

  const filledFieldsCount = useMemo(() => {
    if (!formFields) return 0;
    return countFilledFields(formFields, formData);
  }, [formFields, formData]);

  const hasReachedLimit = isFreePreview && filledFieldsCount >= FREE_QUESTION_LIMIT;

  return {
    isFreePreview,
    filledFieldsCount,
    hasReachedLimit,
    limit: FREE_QUESTION_LIMIT,
  };
}
