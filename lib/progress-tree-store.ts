import { create } from "zustand";
import { persist } from "zustand/middleware";
import { TreeStep, StepStatus } from "@/app/components/progress-tree/ProgressTree";

interface ProgressTreeState {
  steps: TreeStep[];
  setSteps: (steps: TreeStep[]) => void;
  updateStepStatus: (stepId: string, status: StepStatus) => void;
  toggleStepCompletion: (stepId: string) => void;
  resetProgress: () => void;
  getStepById: (stepId: string) => TreeStep | null;
}

const updateStepInTree = (
  steps: TreeStep[],
  stepId: string,
  updateFn: (step: TreeStep) => TreeStep
): TreeStep[] => {
  return steps.map((step) => {
    if (step.id === stepId) {
      return updateFn(step);
    }
    if (step.children) {
      return {
        ...step,
        children: updateStepInTree(step.children, stepId, updateFn),
      };
    }
    return step;
  });
};

const findStepInTree = (steps: TreeStep[], stepId: string): TreeStep | null => {
  for (const step of steps) {
    if (step.id === stepId) {
      return step;
    }
    if (step.children) {
      const found = findStepInTree(step.children, stepId);
      if (found) return found;
    }
  }
  return null;
};

const checkAllChildrenCompleted = (step: TreeStep): boolean => {
  if (!step.children || step.children.length === 0) {
    return step.status === "completed";
  }
  return step.children.every((child) => checkAllChildrenCompleted(child));
};

const updateParentStatus = (steps: TreeStep[]): TreeStep[] => {
  return steps.map((step) => {
    if (step.children && step.children.length > 0) {
      const updatedChildren = updateParentStatus(step.children);
      const allChildrenCompleted = updatedChildren.every((child) =>
        checkAllChildrenCompleted(child)
      );
      const anyChildInProgress = updatedChildren.some((child) => child.status === "in-progress");

      return {
        ...step,
        children: updatedChildren,
        status: allChildrenCompleted
          ? "completed"
          : anyChildInProgress
            ? "in-progress"
            : step.status,
      };
    }
    return step;
  });
};

export const useProgressTreeStore = create<ProgressTreeState>()(
  persist(
    (set, get) => ({
      steps: [],

      setSteps: (steps) => set({ steps }),

      updateStepStatus: (stepId, status) =>
        set((state) => {
          const updatedSteps = updateStepInTree(state.steps, stepId, (step) => ({
            ...step,
            status,
          }));
          return { steps: updateParentStatus(updatedSteps) };
        }),

      toggleStepCompletion: (stepId) =>
        set((state) => {
          const step = findStepInTree(state.steps, stepId);
          if (!step) return state;

          const newStatus = step.status === "completed" ? "pending" : "completed";
          const updatedSteps = updateStepInTree(state.steps, stepId, (s) => ({
            ...s,
            status: newStatus,
          }));

          return { steps: updateParentStatus(updatedSteps) };
        }),

      resetProgress: () =>
        set((state) => {
          const resetSteps = (steps: TreeStep[]): TreeStep[] =>
            steps.map((step) => ({
              ...step,
              status: "pending" as StepStatus,
              children: step.children ? resetSteps(step.children) : undefined,
            }));

          return { steps: resetSteps(state.steps) };
        }),

      getStepById: (stepId) => {
        return findStepInTree(get().steps, stepId);
      },
    }),
    {
      name: "progress-tree-storage",
    }
  )
);
