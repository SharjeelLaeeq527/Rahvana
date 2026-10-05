"use client";

import { useCallback, useMemo } from "react";
import type { Field as ConfigField } from "@/lib/formConfig/types";

export const DEFAULT_FREE_QUESTION_LIMIT = 15;

/** "Answered" test for a single field, shared by the counting and anchor logic. */
const isFieldFilled = (f: ConfigField, data: Record<string, string>): boolean => {
  if (f.type === "checkbox" && f.options) {
    return f.options.some((opt) => data[opt.pdfKey || opt.value] === "Yes");
  }
  const val = data[f.key];
  return !!val && val.trim() !== "";
};

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

      if (isFieldFilled(f, data)) {
        count++;
      }

      if (f.subQuestions && f.subQuestions.length > 0) {
        walk(f.subQuestions as ConfigField[]);
      }
    });
  };
  walk(fields);
  return count;
};

/** True when f (or any nested sub-question) uses this key. */
const fieldContainsKey = (f: ConfigField, key: string): boolean =>
  f.key === key || (f.subQuestions ?? []).some((sub) => fieldContainsKey(sub as ConfigField, key));

/**
 * Collects the visible question fields (display order, conditions resolved
 * against the current answers) up to and including the anchor key.
 * "hidden" entries are containers (e.g. full_name_group), not questions.
 * Returns null when the anchor isn't reachable with the current answers.
 */
const collectFieldsUntilAnchor = (
  fields: ConfigField[],
  data: Record<string, string>,
  anchorKey: string
): ConfigField[] | null => {
  const collected: ConfigField[] = [];
  const walk = (items: ConfigField[]): boolean => {
    for (const f of items) {
      if (f.condition && !f.condition(data)) continue;
      if (f.type !== "hidden") {
        collected.push(f);
        if (f.key === anchorKey) return true;
      }
      if (f.subQuestions && f.subQuestions.length > 0 && walk(f.subQuestions as ConfigField[])) {
        return true;
      }
    }
    return false;
  };
  return walk(fields) ? collected : null;
};

/** Global render-order position model for the wizard's visible question flow. */
interface PreviewFlow {
  /** top-level card key -> its index in the visible flow across sections */
  orderByKey: Map<string, number>;
  /** flow index of the card that contains the anchor (-1 when unresolved) */
  anchorIdx: number;
  /** section index (0-based) containing the anchor (-1 when unresolved) */
  anchorStep: number;
  /** questions (incl. sub-questions) from the start through the anchor */
  anchorFields: ConfigField[] | null;
}

const UNRESOLVED_FLOW: PreviewFlow = {
  orderByKey: new Map(),
  anchorIdx: -1,
  anchorStep: -1,
  anchorFields: null,
};

const warnedAnchors = new Set<string>();

interface UseFreePreviewProps {
  canUseSmartFormFiller: boolean;
  formFields: ConfigField[];
  formData: Record<string, string>;
  /**
   * Count-based allowance from the form config (`freePreviewLimit`).
   * Falls back to DEFAULT_FREE_QUESTION_LIMIT when the form doesn't set one.
   */
  configuredLimit?: number;
  /**
   * Position-based allowance from the form config (`freePreviewUntilKey`):
   * the free walkthrough may not progress beyond the card containing this
   * field key. Preferred over the count-based limit (immune to profile
   * auto-fill and optional blanks); falls back to it when unresolved.
   */
  untilKey?: string;
}

export function useFreePreview({
  canUseSmartFormFiller,
  formFields,
  formData,
  configuredLimit,
  untilKey,
}: UseFreePreviewProps) {
  const isFreePreview = !canUseSmartFormFiller;

  // Mirror the wizard's render order: fields grouped by `section ?? "General"`
  // (first-appearance order), condition-visible only.
  const flow = useMemo<PreviewFlow>(() => {
    if (!untilKey || !formFields?.length) return UNRESOLVED_FLOW;

    const sectionMap = new Map<string, ConfigField[]>();
    formFields.forEach((f) => {
      const section = f.section ?? "General";
      if (!sectionMap.has(section)) sectionMap.set(section, []);
      sectionMap.get(section)!.push(f);
    });

    const orderByKey = new Map<string, number>();
    let anchorIdx = -1;
    let anchorStep = -1;
    let index = 0;
    let step = 0;
    for (const fields of sectionMap.values()) {
      for (const f of fields) {
        if (f.condition && !f.condition(formData)) continue;
        orderByKey.set(f.key, index);
        if (anchorIdx === -1 && fieldContainsKey(f, untilKey)) {
          anchorIdx = index;
          anchorStep = step;
        }
        index++;
      }
      step++;
    }

    if (anchorIdx === -1) {
      if (!warnedAnchors.has(`${untilKey}`)) {
        warnedAnchors.add(`${untilKey}`);
        console.warn(
          `[useFreePreview] freePreviewUntilKey "${untilKey}" is not visible in the form flow — falling back to the count-based limit.`
        );
      }
      return UNRESOLVED_FLOW;
    }

    // Re-run the ordered walk so section grouping is respected when collecting
    // the question list (drives the human-readable limit number).
    const anchorFields = collectFieldsUntilAnchor(
      Array.from(sectionMap.values()).flat(),
      formData,
      untilKey
    );
    return { orderByKey, anchorIdx, anchorStep, anchorFields };
  }, [untilKey, formFields, formData]);

  const anchored = flow.anchorIdx !== -1;

  const filledFieldsCount = useMemo(() => {
    if (!formFields) return 0;
    return countFilledFields(formFields, formData);
  }, [formFields, formData]);

  // Displayed/toasted allowance number.
  const limit = anchored
    ? (flow.anchorFields?.length ?? 0)
    : (configuredLimit ?? DEFAULT_FREE_QUESTION_LIMIT);

  // True when every question from the start through the anchor is answered.
  const hasReachedLimit = isFreePreview
    ? anchored
      ? (flow.anchorFields?.every((f) => isFieldFilled(f, formData)) ?? false)
      : filledFieldsCount >= limit
    : false;

  /** Current card sits at or beyond the anchor card in the flow. */
  const atOrPastAnchor = useCallback(
    (key?: string) => anchored && key != null && (flow.orderByKey.get(key) ?? -1) >= flow.anchorIdx,
    [anchored, flow]
  );

  /** Jump target sits strictly beyond the anchor card (unknown targets count as past). */
  const pastAnchor = useCallback(
    (key?: string) => {
      if (!anchored) return false;
      if (key == null) return true;
      const idx = flow.orderByKey.get(key);
      return idx != null && idx > flow.anchorIdx;
    },
    [anchored, flow]
  );

  /** Jump target section sits beyond the anchor's section. */
  const stepPastAnchor = useCallback(
    (stepIdx: number) => anchored && stepIdx > flow.anchorStep,
    [anchored, flow]
  );

  return {
    isFreePreview,
    filledFieldsCount,
    hasReachedLimit,
    limit,
    atOrPastAnchor,
    pastAnchor,
    stepPastAnchor,
  };
}
