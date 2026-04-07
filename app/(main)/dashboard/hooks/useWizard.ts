import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { roadmapData } from "../../../../data/roadmap";
import { toast } from "sonner";
import { mapDocumentNameToId } from "@/lib/document-vault/journey-mapping";

export interface WizardState {
  currentStage: number;
  currentStep: number | null;
  scenarioType?: string | undefined;
  completedSteps: Set<string>;
  collapsedSteps: Record<string, boolean>;
  role: "both" | "petitioner" | "beneficiary";
  filingType: "online" | "paper" | "both";
  documentChecklist: Record<string, boolean>;
  docUploads: Record<
    string,
    { name: string; size: number; lastModified: number }
  >;
  notes: Record<string, string>;
  started: boolean;
  // New Journey Engine fields
  answers: Record<string, any>;
  metadata: Record<string, any>;
  unresolvedTasks: string[];
  backendId?: string; // Supabase UUID
  stepMap: Record<string, string>; // step_key -> uuid
}

const DEFAULT_STATE: WizardState = {
  currentStage: 0,
  currentStep: null,
  scenarioType: undefined,
  completedSteps: new Set(),
  collapsedSteps: {},
  role: "both",
  filingType: "online",
  documentChecklist: {},
  docUploads: {},
  notes: {},
  started: false,
  answers: {},
  metadata: {},
  unresolvedTasks: [],
  stepMap: {},
};

interface UseWizardOptions {
  /** Supabase user ID — if provided, progress syncs to DB */
  userId?: string | null;
  /** Journey ID (e.g., 'ir1') */
  journeyId?: string;
  /** Custom roadmap data (optional) */
  roadmapData?: any;
}

export function useWizard(options: UseWizardOptions = {}) {
  const {
    userId,
    journeyId = "ir1",
    roadmapData: externalRoadmapData,
  } = options;

  const activeRoadmap = externalRoadmapData || roadmapData;

  const [state, setState] = useState<WizardState>(DEFAULT_STATE);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasExistingProgress, setHasExistingProgress] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // ─── Normalize State (Moved up for use in useEffect and Memoized actions) ───────────
  const normalizeState = useCallback(() => {
    if (!activeRoadmap || !(activeRoadmap.chapters || activeRoadmap.stages)) return;

    setState((prev) => {
      let { currentStage, currentStep } = prev;
      const chapters = activeRoadmap.chapters || activeRoadmap.stages;

      if (currentStage < 0) currentStage = 0;
      if (currentStage >= chapters.length) {
        currentStage = Math.max(0, chapters.length - 1);
      }

      const stage = chapters[currentStage];
      if (!stage) return { ...prev, currentStage, currentStep: null };

      let narrowedStep: number;
      if (currentStep === null || currentStep < 0 || currentStep >= stage.steps.length) {
        const firstIncomplete = stage.steps.findIndex(
          (s: any) => !prev.completedSteps.has(s.step_key || s.id),
        );
        narrowedStep = firstIncomplete === -1 ? 0 : firstIncomplete;
      } else {
        narrowedStep = currentStep;
      }

      return {
        ...prev,
        currentStage,
        currentStep: narrowedStep,
      };
    });
  }, [activeRoadmap]);

  // ─── Load Progress ────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function loadProgress() {
      if (!userId) return;
      setIsLoaded(false);

      try {
        console.log(`[useWizard] Syncing for journey: ${journeyId}`);

        // 1. Find existing journey (Case-Insensitive search)
        const listRes = await fetch(`/api/journeys?journey_type=${journeyId.toUpperCase()}`);
        const listData = await listRes.json();

        let targetJourneyId: string | null = null;
        if (listData.success && listData.data && listData.data.length > 0) {
          // Look for exact or case-insensitive match
          const found = listData.data.find(
            (j: any) => j.journey.journey_type.toLowerCase() === journeyId.toLowerCase()
          );
          if (found) targetJourneyId = found.journey.id;
        }

        // 2. Auto-Initialize if not found
        if (!targetJourneyId) {
          console.log(`[useWizard] No existing journey found for ${journeyId}. Initializing...`);
          const initRes = await fetch('/api/journeys/create-from-config', {
            method: 'POST',
            body: JSON.stringify({ visa_type: journeyId.toLowerCase() }),
          });
          const initData = await initRes.json();
          if (initData.success) {
            targetJourneyId = initData.data.journey.id;
          } else {
             // Handle "already exists" error gracefully - might have been created concurrently
            if (initData.error?.includes("unique constraint")) {
               const retryRes = await fetch(`/api/journeys?journey_type=${journeyId.toUpperCase()}`);
               const retryData = await retryRes.json();
               if (retryData.success && retryData.data.length > 0) {
                 targetJourneyId = retryData.data[0].journey.id;
               } else throw new Error("Conflict during creation and failed to fetch.");
            } else {
              throw new Error(initData.error || 'Failed to initialize journey');
            }
          }
        }

        if (cancelled) return;

        // 3. Load full state tree
        const detailRes = await fetch(`/api/journeys/${targetJourneyId}`);
        const detailData = await detailRes.json();

        if (detailData.success && !cancelled) {
          const { journey, steps, case_data, progress_summary } = detailData.data;

          const stepMap: Record<string, string> = {};
          const completedSet = new Set<string>();
          steps.forEach((s: any) => {
            stepMap[s.step_key] = s.id;
            if (s.status === 'completed') {
              completedSet.add(s.step_key);
            }
          });

          const metadata: Record<string, any> = {};
          case_data.forEach((cd: any) => {
            metadata[cd.data_key] = cd.data_value;
          });

          setState((prev) => ({
            ...prev,
            backendId: targetJourneyId!,
            stepMap,
            completedSteps: completedSet,
            metadata,
            currentStage: progress_summary?.current_chapter_index ?? prev.currentStage,
            currentStep: progress_summary?.current_step_index ?? prev.currentStep,
            started: journey.status !== 'not_started',
          }));

          setHasExistingProgress(journey.status !== 'not_started');
          setIsLoaded(true);
        }
      } catch (err) {
        console.error("[useWizard] Critical sync error:", err);
        toast.error("Cloud synchronization failed.");
        setIsLoaded(true);
      }
    }

    loadProgress();
    return () => { cancelled = true; };
  }, [userId, journeyId]);

  useEffect(() => {
    if (isLoaded) normalizeState();
  }, [isLoaded, normalizeState]);

  // ─── Actions (Memoized to prevent infinite update loops) ───────────────────
  const actions = useMemo(() => ({
    setStage: (idx: number) => {
      setState((prev) => ({ ...prev, currentStage: idx, currentStep: null }));
      setTimeout(normalizeState, 0);
    },

    setCurrentStep: (idx: number) => {
      setState((prev) => {
        const chapters = activeRoadmap.chapters || activeRoadmap.stages;
        const stage = chapters[prev.currentStage];
        if (!stage) return prev;
        const stepId = stage.steps[idx]?.step_key || stage.steps[idx]?.id;
        return { 
          ...prev, 
          currentStep: idx, 
          collapsedSteps: { ...prev.collapsedSteps, [stepId]: false } 
        };
      });
    },

    toggleComplete: async (stepKey: string) => {
      if (!state.backendId || !state.stepMap[stepKey]) return;
      const stepUuid = state.stepMap[stepKey];
      const isCompleted = state.completedSteps.has(stepKey);

      setState((prev) => {
        const newCompleted = new Set(prev.completedSteps);
        if (newCompleted.has(stepKey)) newCompleted.delete(stepKey);
        else newCompleted.add(stepKey);
        return { ...prev, completedSteps: newCompleted };
      });

      try {
        const url = isCompleted 
          ? `/api/steps/${stepUuid}` 
          : `/api/steps/${stepUuid}?action=complete`;
        
        await fetch(url, {
          method: isCompleted ? "PATCH" : "POST",
          body: JSON.stringify(isCompleted ? { status: "not_started" } : {}),
        });
      } catch (err) {
        console.error("[useWizard] Step sync failed:", err);
        toast.error("Failed to update step.");
      }
    },

    updateMetadata: async (metadata: Record<string, any>) => {
      // Deep comparison to prevent redundant updates
      const hasChanges = Object.entries(metadata).some(
        ([key, val]) => JSON.stringify(state.metadata[key]) !== JSON.stringify(val)
      );
      if (!hasChanges) return;

      setState((prev) => ({
        ...prev,
        metadata: { ...prev.metadata, ...metadata }
      }));

      if (state.backendId) {
        try {
          const ops = Object.entries(metadata).map(([key, val]) => ({
            operation: "set",
            data_key: key,
            data_value: val,
          }));
          await fetch("/api/case_data", {
            method: "POST",
            body: JSON.stringify({
              journey_id: state.backendId,
              batch: true,
              operations: ops,
            }),
          });
        } catch (err) {
          console.error("[useWizard] Case data sync failed:", err);
        }
      }
    },

    updateAnswers: (answers: Record<string, any>) => {
      setState((prev) => ({
        ...prev,
        answers: { ...prev.answers, ...answers },
      }));
    },

    setRole: (role: WizardState["role"]) => setState((prev) => ({ ...prev, role })),
    
    setFilingType: (type: WizardState["filingType"]) => setState((prev) => ({ ...prev, filingType: type })),
    
    setScenario: (scenario: string) => setState((prev) => ({ ...prev, scenarioType: scenario })),

    toggleCollapse: (stepId: string) => setState((prev) => ({
      ...prev,
      collapsedSteps: { ...prev.collapsedSteps, [stepId]: !prev.collapsedSteps[stepId] }
    })),

    uploadDocument: async (doc: string, file: File) => {
      setState((prev) => ({
        ...prev,
        docUploads: { ...prev.docUploads, [doc]: { name: file.name, size: file.size, lastModified: file.lastModified } }
      }));

      if (userId) {
        toast.loading(`Saving ${file.name} to vault...`, { id: "vault-upload" });
        try {
          const documentDefId = mapDocumentNameToId(doc);
          const formData = new FormData();
          formData.append("file", file);
          formData.append("documentDefId", documentDefId);
          formData.append("caseId", journeyId.toUpperCase());

          const res = await fetch("/api/documents/upload", { method: "POST", body: formData });
          if (!res.ok) throw new Error();
          toast.success("Saved to vault", { id: "vault-upload" });
        } catch {
          toast.error("Vault save failed", { id: "vault-upload" });
        }
      }
    },

    resetProgress: async () => {
      if (state.backendId) {
        await fetch(`/api/journeys/${state.backendId}`, { method: "DELETE" }).catch(() => {});
      }
      setState(DEFAULT_STATE);
      setHasExistingProgress(false);
    },

    startJourney: async () => {
      if (state.backendId) {
        await fetch(`/api/journeys/${state.backendId}`, {
          method: "PATCH",
          body: JSON.stringify({ status: "in_progress" }),
        });
      }
      setState((prev) => ({ ...prev, started: true }));
      setHasExistingProgress(true);
    }
  }), [state.backendId, state.metadata, state.completedSteps, state.stepMap, state.role, journeyId, userId, activeRoadmap, normalizeState]);

  return { state, actions, isLoaded, hasExistingProgress, isSyncing };
}
