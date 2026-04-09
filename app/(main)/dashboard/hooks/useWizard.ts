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
  // Queue for serializing step toggle API calls
  const syncQueueRef = useRef<Array<() => Promise<void>>>([]);
  const isSyncingRef = useRef(false);
  const isInitialLoadRef = useRef(true);

  // ─── Normalize State (Moved up for use in useEffect and Memoized actions) ───────────
  const normalizeState = useCallback(() => {
    if (!activeRoadmap || !(activeRoadmap.chapters || activeRoadmap.stages)) return;

    setState((prev) => {
      let { currentStage, currentStep } = prev;
      const chapters = activeRoadmap.chapters || activeRoadmap.stages;
      const filingMethod = prev.metadata?.filingMethod || prev.filingType || 'online';

      // Helper: Get active steps for a chapter based on filing method
      const getActiveStepsForChapter = (chapterIdx: number) => {
        const chapter = chapters[chapterIdx];
        if (!chapter) return [];
        return chapter.steps.filter((s: any) => {
          const visibleWhen = s.visible_when;
          if (visibleWhen && Object.keys(visibleWhen).length > 0) {
            if (visibleWhen.filingMethod) {
              return visibleWhen.filingMethod === filingMethod;
            }
          }
          const branch = s.branch;
          if (!branch || branch === 'both') return true;
          return branch === filingMethod;
        });
      };

      // Validate and adjust currentStage
      if (currentStage < 0) currentStage = 0;
      if (currentStage >= chapters.length) {
        currentStage = Math.max(0, chapters.length - 1);
      }

      // Get active steps for current chapter
      let activeSteps = getActiveStepsForChapter(currentStage);

      // If current chapter has no active steps, find next chapter with active steps
      while (activeSteps.length === 0 && currentStage < chapters.length - 1) {
        currentStage++;
        activeSteps = getActiveStepsForChapter(currentStage);
      }

      // Determine current step within the chapter
      let narrowedStep: number;
      const stepsInChapter = chapters[currentStage]?.steps || [];
      const activeStepsInChapter = getActiveStepsForChapter(currentStage);

      if (currentStep === null || currentStep < 0 || currentStep >= stepsInChapter.length) {
        // Find first incomplete active step
        const firstIncomplete = stepsInChapter.findIndex((s: any) => {
          const sId = s.step_key || s.id;
          // Check if this step is active (visible)
          const isActive = activeStepsInChapter.some((as: any) => 
            (as.step_key || as.id) === sId
          );
          return isActive && !prev.completedSteps.has(sId);
        });
        
        // If all active steps complete, stay on first active step (don't auto-advance chapter)
        if (firstIncomplete === -1) {
          narrowedStep = activeStepsInChapter.length > 0 ? stepsInChapter.findIndex((s: any) =>
            activeStepsInChapter.some((as: any) => (as.step_key || as.id) === (s.step_key || s.id))
          ) : 0;
        } else {
          narrowedStep = firstIncomplete;
        }
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
          const found = listData.data.find((j: any) => {
            const itemType = j.journey.journey_type.toLowerCase().replace(/-/g, "");
            const queryType = journeyId.toLowerCase().replace(/-/g, "");
            return itemType === queryType;
          });
          if (found) targetJourneyId = found.journey.id;
        }

        // 2. Auto-Initialize if not found
        if (!targetJourneyId) {
          const configType = journeyId.toLowerCase() === 'ir1' ? 'ir-1' : journeyId.toLowerCase();
          const initRes = await fetch('/api/journeys/create-from-config', {
            method: 'POST',
            body: JSON.stringify({ visa_type: configType }),
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
          const { journey, chapters, steps, case_data, progress_summary } = detailData.data;

          const stepMap: Record<string, string> = {};
          const completedSet = new Set<string>();
          
          // Group steps by chapter for easier lookup
          const stepsByChapter: Record<string, any[]> = {};
          steps.forEach((s: any) => {
            stepMap[s.step_key] = s.id;
            if (s.status === 'completed') {
              completedSet.add(s.step_key);
            }
            if (!stepsByChapter[s.chapter_id]) {
              stepsByChapter[s.chapter_id] = [];
            }
            stepsByChapter[s.chapter_id].push(s);
          });

          const metadata: Record<string, any> = {};
          case_data.forEach((cd: any) => {
            metadata[cd.data_key] = cd.data_value;
          });

          // Derive currentStage & currentStep from the actual completedSteps (source of truth)
          // This avoids stale DB cached progress percentages misleading the UI position.
          const filingMethod = journey.filing_method || 'online';
          const roadmapChapters = activeRoadmap?.chapters || activeRoadmap?.stages || [];
          
          let derivedStage = 0;
          let derivedStep = 0;

          for (let ci = 0; ci < roadmapChapters.length; ci++) {
            const chapterSteps = (roadmapChapters[ci].steps || []).filter((s: any) => {
              const branch = s.branch;
              return !branch || branch === 'both' || branch === filingMethod;
            });
            const allDone = chapterSteps.length > 0 && chapterSteps.every(
              (s: any) => completedSet.has(s.step_key || s.id)
            );
            if (!allDone) {
              derivedStage = ci;
              const firstIncomplete = chapterSteps.findIndex(
                (s: any) => !completedSet.has(s.step_key || s.id)
              );
              derivedStep = firstIncomplete === -1 ? 0 : firstIncomplete;
              break;
            }
            // If this chapter is fully done, keep looking
            if (ci === roadmapChapters.length - 1) {
              // All chapters complete
              derivedStage = ci;
              derivedStep = chapterSteps.length > 0 ? chapterSteps.length - 1 : 0;
            }
          }

          setState((prev) => ({
            ...prev,
            backendId: targetJourneyId!,
            stepMap,
            completedSteps: completedSet,
            metadata,
            filingType: (journey.filing_method as any) || prev.filingType,
            currentStage: derivedStage,
            currentStep: derivedStep,
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

  // normalizeState is only needed for manual navigation (setStage), not on load.
  // Position is now correctly derived from completedSteps in loadProgress.

  // ─── Actions (Memoized to prevent infinite update loops) ───────────────────
  const actions = useMemo(() => ({
    setStage: (idx: number) => {
      setState((prev) => {
        const chapters = activeRoadmap.chapters || activeRoadmap.stages;
        const chapter = chapters[idx];
        
        // Persist the current chapter to the backend
        if (state.backendId && chapter?.id) {
          fetch(`/api/journeys/${state.backendId}`, {
            method: "PATCH",
            body: JSON.stringify({ 
              current_chapter_id: chapter.id,
            }),
          }).catch((err) => console.error("[useWizard] Failed to save chapter position:", err));
        }
        
        return { ...prev, currentStage: idx, currentStep: null };
      });
      // Don't auto-normalize here - user is manually selecting chapter
      // They should see chapter view, not auto-jump to a step
    },

    setCurrentStep: (idx: number) => {
      setState((prev) => {
        const chapters = activeRoadmap.chapters || activeRoadmap.stages;
        const stage = chapters[prev.currentStage];
        if (!stage) return prev;
        const stepId = stage.steps[idx]?.step_key || stage.steps[idx]?.id;
        
        // Persist the current step to the backend
        if (state.backendId && stepId && prev.stepMap[stepId]) {
          const stepUuid = prev.stepMap[stepId];
          fetch(`/api/journeys/${state.backendId}`, {
            method: "PATCH",
            body: JSON.stringify({ 
              current_step_id: stepUuid,
              current_chapter_id: stage?.id,
            }),
          }).catch((err) => console.error("[useWizard] Failed to save step position:", err));
        }
        
        return { 
          ...prev, 
          currentStep: idx, 
          collapsedSteps: { ...prev.collapsedSteps, [stepId]: false } 
        };
      });
    },

    toggleComplete: async (stepKey: string) => {
      console.log("[useWizard] toggleComplete called for:", stepKey);

      if (!state.backendId) {
        console.warn("[useWizard] toggleComplete: No backendId found");
        return;
      }

      if (!state.stepMap[stepKey]) {
        console.warn("[useWizard] toggleComplete: stepKey not found in stepMap", {
          stepKey,
          availableKeys: Object.keys(state.stepMap).slice(0, 10),
        });
        toast.error(`Sync Error: Step missing from journey. Please reset your journey.`);
        return;
      }

      const stepUuid = state.stepMap[stepKey];
      const isCompleted = state.completedSteps.has(stepKey);

      // Optimistic update — instant UI feedback regardless of queue state
      setState((prev) => {
        const newCompleted = new Set(prev.completedSteps);
        if (newCompleted.has(stepKey)) newCompleted.delete(stepKey);
        else newCompleted.add(stepKey);
        
        // Auto-advance to next chapter if completing last step
        if (!isCompleted) { // Only when marking as complete, not uncompleting
          const chapters = activeRoadmap.chapters || activeRoadmap.stages;
          const filingMethod = prev.metadata?.filingMethod || prev.filingType || 'online';
          
          // Helper to get active steps for a chapter
          const getActiveStepsForChapter = (chapterIdx: number) => {
            const chapter = chapters[chapterIdx];
            if (!chapter) return [];
            return chapter.steps.filter((s: any) => {
              const visibleWhen = s.visible_when;
              if (visibleWhen && Object.keys(visibleWhen).length > 0) {
                if (visibleWhen.filingMethod) {
                  return visibleWhen.filingMethod === filingMethod;
                }
              }
              const branch = s.branch;
              if (!branch || branch === 'both') return true;
              return branch === filingMethod;
            });
          };
          
          // Check if all active steps in current chapter are now complete
          const currentChapterActive = getActiveStepsForChapter(prev.currentStage);
          const allCurrentChapterComplete = currentChapterActive.length > 0 && 
            currentChapterActive.every((s: any) => newCompleted.has(s.step_key || s.id));
          
          // If current chapter is now complete and there's a next chapter, move to it
          if (allCurrentChapterComplete && prev.currentStage < chapters.length - 1) {
            return {
              ...prev,
              completedSteps: newCompleted,
              currentStage: prev.currentStage + 1,
              currentStep: null, // Will be normalized to first incomplete step
            };
          }
        }
        
        return { ...prev, completedSteps: newCompleted };
      });

      // Enqueue the API call
      const job = async () => {
        const url = isCompleted
          ? `/api/steps/${stepUuid}`
          : `/api/steps/${stepUuid}?action=complete`;

        try {
          const res = await fetch(url, {
            method: isCompleted ? "PATCH" : "POST",
            body: JSON.stringify(isCompleted ? { status: "not_started" } : {}),
          });

          if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP ${res.status}`);
          }
          console.log("[useWizard] sync success:", stepKey);
        } catch (err) {
          console.error("[useWizard] sync failed:", stepKey, err);
          toast.error("Failed to save step. Please check your connection.");
          // Rollback this specific step
          setState((prev) => {
            const newCompleted = new Set(prev.completedSteps);
            if (isCompleted) newCompleted.add(stepKey);
            else newCompleted.delete(stepKey);
            return { ...prev, completedSteps: newCompleted };
          });
        }
      };

      syncQueueRef.current.push(job);

      // If not already processing the queue, start draining it
      if (!isSyncingRef.current) {
        isSyncingRef.current = true;
        setIsSyncing(true);
        while (syncQueueRef.current.length > 0) {
          const next = syncQueueRef.current.shift()!;
          await next();
        }
        isSyncingRef.current = false;
        setIsSyncing(false);
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
