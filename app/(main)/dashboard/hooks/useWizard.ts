"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { toast } from "sonner";
import { useDocumentVaultStore } from "@/lib/document-vault/store";
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
  answers: Record<string, any>;
  metadata: Record<string, any>;
  unresolvedTasks: string[];
  backendId?: string;
  stepMap: Record<string, string>;
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
  userId?: string | null;
  journeyId?: string;
  roadmapData?: any;
}

export function useWizard(options: UseWizardOptions = {}) {
  const {
    userId,
    journeyId = "ir1",
    roadmapData: externalRoadmapData,
  } = options;

  const activeRoadmap = externalRoadmapData;

  const [state, setState] = useState<WizardState>(DEFAULT_STATE);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasExistingProgress, setHasExistingProgress] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // ─── Normalize State ───────────
  const normalizeState = useCallback(() => {
    if (!activeRoadmap || !(activeRoadmap.chapters || activeRoadmap.stages)) return;

    setState((prev) => {
      let { currentStage, currentStep } = prev;
      const chapters = activeRoadmap.chapters || activeRoadmap.stages;
      const filingMethod = prev.metadata?.filingMethod || prev.filingType || 'online';

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

      if (currentStage < 0) currentStage = 0;
      if (currentStage >= chapters.length) {
        currentStage = Math.max(0, chapters.length - 1);
      }

      let activeSteps = getActiveStepsForChapter(currentStage);

      while (activeSteps.length === 0 && currentStage < chapters.length - 1) {
        currentStage++;
        activeSteps = getActiveStepsForChapter(currentStage);
      }

      let narrowedStep: number;
      const stepsInChapter = chapters[currentStage]?.steps || [];
      const activeStepsInChapter = getActiveStepsForChapter(currentStage);

      if (currentStep === null || currentStep < 0 || currentStep >= stepsInChapter.length) {
        const firstIncomplete = stepsInChapter.findIndex((s: any) => {
          const sId = s.step_key || s.id;
          const isActive = activeStepsInChapter.some((as: any) => 
            (as.step_key || as.id) === sId
          );
          return isActive && !prev.completedSteps.has(sId);
        });
        
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

        const listRes = await fetch(`/api/journeys?journey_type=${journeyId.toUpperCase()}`);
        const listData = await listRes.json();

        let targetJourneyId: string | null = null;
        if (listData.success && listData.data && listData.data.length > 0) {
          const found = listData.data.find((j: any) => {
            const itemType = j.journey.journey_type.toLowerCase().replace(/-/g, "");
            const queryType = journeyId.toLowerCase().replace(/-/g, "");
            return itemType === queryType;
          });
          if (found) targetJourneyId = found.journey.id;
        }

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

        const detailRes = await fetch(`/api/journeys/${targetJourneyId}`);
        const detailData = await detailRes.json();

        if (detailData.success && !cancelled) {
          const { journey, steps, case_data } = detailData.data;

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
            if (ci === roadmapChapters.length - 1) {
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
  }, [userId, journeyId, activeRoadmap]);

  // ─── Actions ───────────────────────────────────────────────────────────────
  const actions = useMemo(() => ({
    setStage: (idx: number) => {
      setState((prev) => {
        const chapters = activeRoadmap.chapters || activeRoadmap.stages;
        const chapter = chapters[idx];
        
        if (state.backendId && chapter?.id) {
          fetch(`/api/journeys/${state.backendId}`, {
            method: "PATCH",
            body: JSON.stringify({ current_chapter_id: chapter.id }),
          }).catch((err) => console.error("[useWizard] Failed to save chapter position:", err));
        }
        
        return { ...prev, currentStage: idx, currentStep: null };
      });
    },

    setCurrentStep: (idx: number) => {
      setState((prev) => {
        const chapters = activeRoadmap.chapters || activeRoadmap.stages;
        const stage = chapters[prev.currentStage];
        if (!stage) return prev;
        const stepId = stage.steps[idx]?.step_key || stage.steps[idx]?.id;
        
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

      const isCompleted = state.completedSteps.has(stepKey);

      // ENFORCE SEQUENTIAL COMPLETION (ONLY when marking as completed)
      if (!isCompleted) {
        const chapters = activeRoadmap.chapters || activeRoadmap.stages || [];
        const filingMethod = state.metadata?.filingMethod || state.filingType || 'online';
        
        const allActiveSteps: any[] = [];
        chapters.forEach((chapter: any) => {
          const activeSteps = (chapter.steps || []).filter((s: any) => {
            const visibleWhen = s.visible_when;
            if (visibleWhen && Object.keys(visibleWhen).length > 0) {
              if (visibleWhen.filingMethod) return visibleWhen.filingMethod === filingMethod;
            }
            const branch = s.branch;
            if (!branch || branch === 'both') return true;
            return branch === filingMethod;
          });
          allActiveSteps.push(...activeSteps);
        });

        const targetIdx = allActiveSteps.findIndex(s => (s.step_key || s.id) === stepKey);

        if (targetIdx > 0) {
           const previousSteps = allActiveSteps.slice(0, targetIdx);
           const firstIncomplete = previousSteps.find(s => !state.completedSteps.has(s.step_key || s.id));
           
           if (firstIncomplete) {
             toast.error(`Previous step pending: "${firstIncomplete.step_name}"`, {
               description: "Steps must be completed in order. Please finish the preceding tasks first.",
               duration: 4000
             });
             return; // HARD BLOCK
           }
        }
      }

      if (!state.stepMap[stepKey]) {
        console.warn("[useWizard] toggleComplete: stepKey not found in stepMap");
        toast.error(`Sync Error: Step missing from journey. Please refresh your journey.`);
        return;
      }

      const stepUuid = state.stepMap[stepKey];

      // Optimistic update
      setState((prev) => {
        const newCompleted = new Set(prev.completedSteps);
        if (newCompleted.has(stepKey)) newCompleted.delete(stepKey);
        else newCompleted.add(stepKey);
        
        if (!isCompleted) {
          const chapters = activeRoadmap.chapters || activeRoadmap.stages;
          const filingMethod = prev.metadata?.filingMethod || prev.filingType || 'online';
          
          const getActiveStepsForChapter = (chapterIdx: number) => {
            const chapter = chapters[chapterIdx];
            if (!chapter) return [];
            return chapter.steps.filter((s: any) => {
              const visibleWhen = s.visible_when;
              if (visibleWhen && Object.keys(visibleWhen).length > 0) {
                if (visibleWhen.filingMethod) return visibleWhen.filingMethod === filingMethod;
              }
              const branch = s.branch;
              if (!branch || branch === 'both') return true;
              return branch === filingMethod;
            });
          };
          
          const currentChapterActive = getActiveStepsForChapter(prev.currentStage);
          const allCurrentChapterComplete = currentChapterActive.length > 0 && 
            currentChapterActive.every((s: any) => newCompleted.has(s.step_key || s.id));
          
          if (allCurrentChapterComplete && prev.currentStage < chapters.length - 1) {
            return {
              ...prev,
              completedSteps: newCompleted,
              currentStage: prev.currentStage + 1,
              currentStep: null,
            };
          }
        }
        
        return { ...prev, completedSteps: newCompleted };
      });

      // Background Sync
      if (stepUuid) {
        setIsSyncing(true);
        try {
          const url = !isCompleted
            ? `/api/steps/${stepUuid}?action=complete`
            : `/api/steps/${stepUuid}`;

          const res = await fetch(url, {
            method: !isCompleted ? "POST" : "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(!isCompleted ? {} : { status: "not_started" }),
          });

          if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP ${res.status}`);
          }
          console.log("[useWizard] sync success:", stepKey);
        } catch (err) {
          console.error("[useWizard] sync failed:", stepKey, err);
          toast.error("Failed to save progress. Please check your connection.");
          
          // Rollback
          setState((prev) => {
            const newCompleted = new Set(prev.completedSteps);
            if (!isCompleted) newCompleted.delete(stepKey);
            else newCompleted.add(stepKey);
            return { ...prev, completedSteps: newCompleted };
          });
        } finally {
          setIsSyncing(false);
        }
      }
    },

    updateMetadata: async (metadata: Record<string, any>) => {
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

    toggleDocument: (doc: string) => {
      setState((prev) => ({
        ...prev,
        documentChecklist: {
          ...prev.documentChecklist,
          [doc]: !prev.documentChecklist[doc]
        }
      }));
    },

    updateNote: (stepKey: string, note: string) => {
      setState((prev) => ({
        ...prev,
        notes: {
          ...prev.notes,
          [stepKey]: note
        }
      }));
    },

    clearDocument: (doc: string) => {
      setState((prev) => {
        const nextUploads = { ...prev.docUploads };
        delete nextUploads[doc];
        return { ...prev, docUploads: nextUploads };
      });
    },

    uploadDocument: async (doc: string, file: File) => {
      setState((prev) => ({
        ...prev,
        docUploads: { ...prev.docUploads, [doc]: { name: file.name, size: file.size, lastModified: file.lastModified } }
      }));

      if (userId && journeyId) {
        toast.loading(`Saving ${file.name} to vault...`, { id: "vault-upload" });
        try {
          const documentDefId = mapDocumentNameToId(doc);
          const formData = new FormData();
          formData.append("file", file);
          formData.append("documentDefId", documentDefId);
          formData.append("caseId", journeyId.toUpperCase());

          const res = await fetch("/api/documents/upload", { method: "POST", body: formData });
          if (!res.ok) throw new Error();
          
          useDocumentVaultStore.getState().reloadDocuments();
          
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
    },

    updateDocumentStatus: async (documentId: string, status: 'not-started' | 'in-progress' | 'reviewed') => {
      const currentDocReviewStatus = state.metadata?.docReviewStatus || {};
      const updatedDocReviewStatus = {
        ...currentDocReviewStatus,
        [documentId]: status
      };

      await actions.updateMetadata({
        docReviewStatus: updatedDocReviewStatus
      });
    }
  }), [state.backendId, state.metadata, state.completedSteps, state.stepMap, state.role, journeyId, userId, activeRoadmap, normalizeState]);

  return { state, actions, isLoaded, hasExistingProgress, isSyncing };
}
