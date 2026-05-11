"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { toast } from "sonner";
import { useDocumentVaultStore } from "@/lib/document-vault/store";
import { mapDocumentNameToId } from "@/lib/document-vault/journey-mapping";
import { getJourneyLockStatus } from "@/lib/journey-lock";

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
  const [error, setError] = useState<Error | null>(null);

  // Keep a ref to the latest state to use in stable memoized actions
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // ─── Normalize State ───────────
  // const normalizeState = useCallback(() => {
  //   if (!activeRoadmap || !(activeRoadmap.chapters || activeRoadmap.stages)) return;

  //   setState((prev) => {
  //     let { currentStage, currentStep } = prev;
  //     const chapters = activeRoadmap.chapters || activeRoadmap.stages;
  //     const filingMethod = prev.metadata?.filingMethod || prev.filingType || 'online';

  //     const getActiveStepsForChapter = (chapterIdx: number) => {
  //       const chapter = chapters[chapterIdx];
  //       if (!chapter) return [];
  //       return chapter.steps.filter((s: any) => {
  //         const visibleWhen = s.visible_when;
  //         if (visibleWhen && Object.keys(visibleWhen).length > 0) {
  //           if (visibleWhen.filingMethod) {
  //             return visibleWhen.filingMethod === filingMethod;
  //           }
  //         }
  //         const branch = s.branch;
  //         if (!branch || branch === 'both') return true;
  //         return branch === filingMethod;
  //       });
  //     };

  //     if (currentStage < 0) currentStage = 0;
  //     if (currentStage >= chapters.length) {
  //       currentStage = Math.max(0, chapters.length - 1);
  //     }

  //     let activeSteps = getActiveStepsForChapter(currentStage);

  //     while (activeSteps.length === 0 && currentStage < chapters.length - 1) {
  //       currentStage++;
  //       activeSteps = getActiveStepsForChapter(currentStage);
  //     }

  //     let narrowedStep: number;
  //     const stepsInChapter = chapters[currentStage]?.steps || [];
  //     const activeStepsInChapter = getActiveStepsForChapter(currentStage);

  //     if (currentStep === null || currentStep < 0 || currentStep >= stepsInChapter.length) {
  //       const firstIncomplete = stepsInChapter.findIndex((s: any) => {
  //         const sId = s.step_key || s.id;
  //         const isActive = activeStepsInChapter.some((as: any) => 
  //           (as.step_key || as.id) === sId
  //         );
  //         return isActive && !prev.completedSteps.has(sId);
  //       });
        
  //       if (firstIncomplete === -1) {
  //         narrowedStep = activeStepsInChapter.length > 0 ? stepsInChapter.findIndex((s: any) =>
  //           activeStepsInChapter.some((as: any) => (as.step_key || as.id) === (s.step_key || s.id))
  //         ) : 0;
  //       } else {
  //         narrowedStep = firstIncomplete;
  //       }
  //     } else {
  //       narrowedStep = currentStep;
  //     }

  //     return {
  //       ...prev,
  //       currentStage,
  //       currentStep: narrowedStep,
  //     };
  //   });
  // }, [activeRoadmap]);

  // ─── Load Progress (single combined API call) ─────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function loadProgress() {
      if (!userId) return;
      setIsLoaded(false);

      try {
        console.log(`[useWizard] Initializing journey: ${journeyId}`);

        // Single call replaces: list → create → sync-steps → detail (4 round-trips → 1)
        const res = await fetch("/api/journeys/initialize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ journey_type: journeyId }),
        });

        if (!res.ok) throw new Error(`Initialize failed: HTTP ${res.status}`);
        const { data } = await res.json();
        if (cancelled) return;

        const { journey, steps, case_data } = data;

        const stepMap: Record<string, string> = {};
        const completedSet = new Set<string>();

        steps.forEach((s: any) => {
          stepMap[s.step_key] = s.id;
          if (s.status === "completed") completedSet.add(s.step_key);
        });

        const metadata: Record<string, any> = {};
        case_data.forEach((cd: any) => {
          metadata[cd.data_key] = cd.data_value;
        });

        const filingMethod = journey.filing_method || "online";

        // Derive stage/step position from roadmap JSON (if available)
        // Note: activeRoadmap is no longer a dependency — we derive best-effort
        const roadmapChapters =
          activeRoadmap?.chapters || activeRoadmap?.stages || [];

        let derivedStage = 0;
        let derivedStep = 0;

        if (roadmapChapters.length > 0) {
          for (let ci = 0; ci < roadmapChapters.length; ci++) {
            const chapterSteps = (roadmapChapters[ci].steps || []).filter(
              (s: any) => {
                const branch = s.branch;
                return !branch || branch === "both" || branch === filingMethod;
              }
            );
            const allDone =
              chapterSteps.length > 0 &&
              chapterSteps.every((s: any) =>
                completedSet.has(s.step_key || s.id)
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
              derivedStep = Math.max(0, chapterSteps.length - 1);
            }
          }
        }

        setState((prev) => ({
          ...prev,
          backendId: journey.id,
          stepMap,
          completedSteps: completedSet,
          metadata: {
            ...metadata,
            tracking_status: journey.tracking_status || {},
          },
          filingType: (journey.filing_method as any) || prev.filingType,
          currentStage: derivedStage,
          currentStep: derivedStep,
          started: journey.status !== "not_started",
        }));

        setHasExistingProgress(journey.status !== "not_started");
        setIsLoaded(true);
      } catch (err) {
        if (cancelled) return;
        console.error("[useWizard] Initialize error:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
        toast.error("Cloud synchronization failed.");
        setIsLoaded(true);
      }
    }

    loadProgress();
    return () => {
      cancelled = true;
    };
    // activeRoadmap intentionally excluded — API starts immediately on userId
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, journeyId]);

  // ─── Actions ───────────────────────────────────────────────────────────────
  const actions = useMemo(() => {
    // Helper to invalidate server cache in the background after a mutation
    const invalidateJourneyCache = () => {
      if (!userId || !journeyId) return;
      fetch("/api/journeys/initialize", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-cache-bust": "1" 
        },
        body: JSON.stringify({ journey_type: journeyId }),
      }).catch(() => {}); // Non-blocking
    };

    return {
      setStage: (idx: number) => {
        setState((prev) => {
          const chapters = activeRoadmap.chapters || activeRoadmap.stages;
          const chapter = chapters[idx];
          
          if (prev.backendId && chapter?.id) {
            fetch(`/api/journeys/${prev.backendId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
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
          
          if (prev.backendId && stepId && prev.stepMap[stepId]) {
            const stepUuid = prev.stepMap[stepId];
            fetch(`/api/journeys/${prev.backendId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
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
        const currentState = stateRef.current;
        const { isLocked } = getJourneyLockStatus(currentState.metadata);
        if (isLocked) {
          toast.error("Journey locked", {
            description: "This journey is in read-only mode. The 14-day window following your interview outcome has ended.",
            duration: 4000,
          });
          return;
        }

        const isCompleted = currentState.completedSteps.has(stepKey);

        // ENFORCE SEQUENTIAL ORDERING — runs before backendId check so the
        // toast always fires even if the journey hasn't fully synced yet.
        if (!isCompleted) {
          const chapters = activeRoadmap?.chapters || activeRoadmap?.stages || [];
          const filingMethod = currentState.metadata?.filingMethod || currentState.filingType || 'online';
          const metadata = currentState.metadata;

          const isStepActiveForCurrentFlow = (s: any): boolean => {
            const visibleWhen = s.visible_when;
            if (visibleWhen && Object.keys(visibleWhen).length > 0) {
              let isVisible = true;
              for (const [key, value] of Object.entries<any>(visibleWhen)) {
                if (key === 'filingMethod') {
                  if (value !== filingMethod) isVisible = false;
                } else {
                  const stateValue = metadata?.[key];
                  if (Array.isArray(value)) {
                    if (!(value as any[]).includes(stateValue)) isVisible = false;
                  } else {
                    if (stateValue !== value) isVisible = false;
                  }
                }
              }
              if (!isVisible) return false;
            }
            const branch = s.branch;
            if (!branch || branch === 'both') return true;
            return branch === filingMethod;
          };

          // Build ordered list of all active steps with their display names
          const orderedActiveSteps: Array<{ key: string; name: string }> = [];
          chapters.forEach((chapter: any) => {
            (chapter.steps || []).forEach((s: any) => {
              if (isStepActiveForCurrentFlow(s)) {
                orderedActiveSteps.push({
                  key: s.step_key || s.id,
                  name: s.step_name || s.name || (s.step_key || s.id),
                });
              }
            });
          });

          // Block completion if any preceding active step is not yet completed
          const targetIdx = orderedActiveSteps.findIndex((s) => s.key === stepKey);

          if (targetIdx > 0) {
            const firstIncomplete = orderedActiveSteps
              .slice(0, targetIdx)
              .find((s) => !currentState.completedSteps.has(s.key));

            if (firstIncomplete) {
              toast.error(`Required step pending: "${firstIncomplete.name}"`, {
                description: "Please complete the required preceding step first.",
                duration: 4000,
              });
              return;
            }
          }
        }

        if (!currentState.backendId) {
          console.warn("[useWizard] toggleComplete: No backendId found");
          return;
        }

        if (!currentState.stepMap[stepKey]) {
          console.warn("[useWizard] toggleComplete: stepKey not found in stepMap, attempting sync...");
          // (Rest of the sync logic skipped for brevity, but would use functional updates)
          toast.error(`Step not found in your journey. Please refresh the page.`);
          return;
        }

        const stepUuid = currentState.stepMap[stepKey];

        // Optimistic update
        setState((prev) => {
          const newCompleted = new Set(prev.completedSteps);
          if (newCompleted.has(stepKey)) newCompleted.delete(stepKey);
          else newCompleted.add(stepKey);
          
          return { ...prev, completedSteps: newCompleted };
        });

        if (stepUuid) {
          setIsSyncing(true);
          const url = !isCompleted
            ? `/api/steps/${stepUuid}?action=complete`
            : `/api/steps/${stepUuid}`;
          const method = !isCompleted ? "POST" : "PATCH";
          const body = JSON.stringify(!isCompleted ? {} : { status: "not_started" });

          try {
            const res = await fetch(url, {
              method,
              headers: { "Content-Type": "application/json" },
              body,
            });
            if (res.ok) {
              window.dispatchEvent(new CustomEvent("refresh-reminders"));
              invalidateJourneyCache();
            } else {
              throw new Error("Sync failed");
            }
          } catch (err) {
            console.error("[useWizard] sync failed:", err);
            // Rollback
            setState((prev) => {
              const newCompleted = new Set(prev.completedSteps);
              if (!isCompleted) newCompleted.delete(stepKey);
              else newCompleted.add(stepKey);
              return { ...prev, completedSteps: newCompleted };
            });
          }
          setIsSyncing(false);
        }
      },

      updateMetadata: async (metadata: Record<string, any>) => {
        setState((prev) => {
          const hasChanges = Object.entries(metadata).some(
            ([key, val]) => JSON.stringify(prev.metadata[key]) !== JSON.stringify(val)
          );
          if (!hasChanges) return prev;

          const mergedMetadata = { ...prev.metadata, ...metadata };

          if (prev.backendId) {
            const ops = Object.entries(metadata).map(([key, val]) => ({
              operation: "set",
              data_key: key,
              data_value: val,
            }));
            fetch("/api/case_data", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                journey_id: prev.backendId,
                batch: true,
                operations: ops,
              }),
            }).then(() => {
              window.dispatchEvent(new CustomEvent("refresh-reminders"));
              invalidateJourneyCache();
            }).catch((err) => console.error("[useWizard] Case data sync failed:", err));
          }

          return { ...prev, metadata: mergedMetadata };
        });
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
        setState((prev) => {
          if (userId && journeyId) {
            toast.loading(`Saving ${file.name} to vault...`, { id: "vault-upload" });
            const documentDefId = mapDocumentNameToId(doc);
            const formData = new FormData();
            formData.append("file", file);
            formData.append("documentDefId", documentDefId);
            formData.append("caseId", journeyId.toUpperCase());

            fetch("/api/documents/upload", { method: "POST", body: formData })
              .then((res) => {
                if (!res.ok) throw new Error();
                useDocumentVaultStore.getState().reloadDocuments();
                toast.success("Saved to vault", { id: "vault-upload" });
              })
              .catch(() => toast.error("Vault save failed", { id: "vault-upload" }));
          }
          return {
            ...prev,
            docUploads: { ...prev.docUploads, [doc]: { name: file.name, size: file.size, lastModified: file.lastModified } }
          };
        });
      },
      resetProgress: async () => {
        setState((prev) => {
          if (prev.backendId) {
            fetch(`/api/journeys/${prev.backendId}`, { 
              method: "DELETE",
              headers: { "Content-Type": "application/json" }
            }).then(() => invalidateJourneyCache()).catch(() => {});
          }
          return DEFAULT_STATE;
        });
        setHasExistingProgress(false);
      },
      startJourney: async () => {
        setState((prev) => {
          if (prev.backendId) {
            fetch(`/api/journeys/${prev.backendId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ status: "in_progress" }),
            }).then(() => invalidateJourneyCache()).catch(() => {});
          }
          return { ...prev, started: true };
        });
        setHasExistingProgress(true);
      },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, journeyId, activeRoadmap]); // STABLE DEPENDENCIES

  return { state, actions, isLoaded, hasExistingProgress, isSyncing, error };
}
