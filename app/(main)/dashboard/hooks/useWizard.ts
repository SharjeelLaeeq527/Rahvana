"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useParams } from "next/navigation";
import { useToast } from "@/app/components/shared/ToastProvider";
import { E, msg } from "@/lib/errors";
import { useDocumentVaultStore } from "@/lib/document-vault/store";
import { mapDocumentNameToId } from "@/lib/document-vault/journey-mapping";
import { getJourneyLockStatus } from "@/lib/journey-lock";
import { useUserProfile } from "@/app/context/UserProfileContext";
import { useCandidate } from "@/app/context/CandidateContext";
import { syncCaseDataToProfile, syncProfileToCaseData } from "@/lib/autoFill/journeyProfileBridge";

export interface WizardState {
  currentStage: number;
  currentStep: number | null;
  scenarioType?: string | undefined;
  completedSteps: Set<string>;
  collapsedSteps: Record<string, boolean>;
  role: "both" | "petitioner" | "beneficiary";
  filingType: "online" | "paper" | "both";
  documentChecklist: Record<string, boolean>;
  docUploads: Record<string, { name: string; size: number; lastModified: number }>;
  notes: Record<string, string>;
  started: boolean;
  answers: Record<string, any>;
  metadata: Record<string, any>;
  unresolvedTasks: string[];
  backendId?: string;
  subscriptionTier: string;
  stepMap: Record<string, string>;
  /**
   * Per-step timestamps (ms epoch) for time-based case-strength gating.
   * `completedAt` drives the "passed step, deficiency unresolved → escalate"
   * windows; `startedAt` (reached) drives the current-step grace. Populated from
   * the DB `steps` rows on load; `completedAt` is stamped locally on completion.
   */
  stepTimestamps: Record<string, { completedAt?: number | null; startedAt?: number | null }>;
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
  subscriptionTier: "free",
  stepMap: {},
  stepTimestamps: {},
};

interface UseWizardOptions {
  userId?: string | null;
  journeyId?: string;
  candidateId?: string;
  roadmapData?: any;
  journeyDbId?: string | null;
}

export function useWizard(options: UseWizardOptions = {}) {
  const params = useParams();
  const routeJourney = params?.["visa-journey"];
  const routeJourneyId = typeof routeJourney === "string" ? routeJourney.replace("-", "").toLowerCase() : undefined;

  const { activeCandidateId } = useCandidate();
  const effectiveCandidateId = options.candidateId || activeCandidateId || "candidate-1";

  const { userId, journeyId = routeJourneyId, roadmapData: externalRoadmapData, journeyDbId } = options;
  const { profile, updateProfile } = useUserProfile();

  const activeRoadmap = externalRoadmapData;

  const [state, setState] = useState<WizardState>(DEFAULT_STATE);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasExistingProgress, setHasExistingProgress] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const {showToast} = useToast();

  // Abort controller ref — cancelled on unmount to silence "Failed to fetch"
  // errors caused by in-flight requests surviving hot-reloads or navigation.
  const abortControllerRef = useRef<AbortController | null>(null);
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

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
      if (!userId || !journeyId) {
        setIsLoaded(true);
        return;
      }
      setIsLoaded(false);

      try {
        console.log(`[useWizard] Initializing journey: ${journeyId}`);

        // Single call replaces: list → create → sync-steps → detail (4 round-trips → 1)
        const res = await fetch("/api/journeys/initialize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            journey_type: journeyId,
            candidate_id: effectiveCandidateId,
            journey_db_id: journeyDbId || undefined,
          }),
        });

        if (!res.ok) throw new Error(`Initialize failed: HTTP ${res.status}`);
        const { data } = await res.json();
        if (cancelled) return;

        const { journey, steps, case_data } = data;

        const stepMap: Record<string, string> = {};
        const completedSet = new Set<string>();
        const stepTimestamps: Record<
          string,
          { completedAt?: number | null; startedAt?: number | null }
        > = {};

        steps.forEach((s: any) => {
          stepMap[s.step_key] = s.id;
          if (s.status === "completed") completedSet.add(s.step_key);
          const completedAt = s.completed_at ? Date.parse(s.completed_at) : null;
          const startedAt = s.started_at ? Date.parse(s.started_at) : null;
          stepTimestamps[s.step_key] = {
            completedAt: Number.isFinite(completedAt) ? completedAt : null,
            startedAt: Number.isFinite(startedAt) ? startedAt : null,
          };
        });

        const metadata: Record<string, any> = {};
        case_data.forEach((cd: any) => {
          metadata[cd.data_key] = cd.data_value;
        });

        const filingMethod = journey.filing_method || "online";

        // Derive stage/step position from roadmap JSON (if available)
        // Note: activeRoadmap is no longer a dependency — we derive best-effort
        const roadmapChapters = activeRoadmap?.chapters || activeRoadmap?.stages || [];

        let derivedStage = 0;
        let derivedStep = 0;

        if (roadmapChapters.length > 0) {
          for (let ci = 0; ci < roadmapChapters.length; ci++) {
            const chapterSteps = (roadmapChapters[ci].steps || []).filter((s: any) => {
              const branch = s.branch;
              return !branch || branch === "both" || branch === filingMethod;
            });
            const allDone =
              chapterSteps.length > 0 &&
              chapterSteps.every((s: any) => completedSet.has(s.step_key || s.id));
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
          backendId: journey?.id || undefined,
          subscriptionTier: journey?.subscription_tier || "free", 
          stepMap,
          stepTimestamps,
          completedSteps: completedSet,
          metadata: {
            ...metadata,
            tracking_status: journey?.tracking_status || {},
          },
          filingType: (journey?.filing_method as any) || prev.filingType,
          currentStage: derivedStage,
          currentStep: derivedStep,
          started: journey?.status ? journey.status !== "not_started" : false,
        }));

        setHasExistingProgress(journey?.status ? journey.status !== "not_started" : false);
        setIsLoaded(true);
      } catch (err) {
        if (cancelled) return;
        console.error("[useWizard] Initialize error:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
        showToast(msg(E.DASH_CLOUD_SYNC_FAILED), "error");
        setIsLoaded(true);
      }
    }

    loadProgress();
    return () => {
      cancelled = true;
    };
    // activeRoadmap intentionally excluded — API starts immediately on userId
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, journeyId, effectiveCandidateId, journeyDbId]);

  // Synchronize MasterProfile standard fields back into wizard metadata in-memory
  useEffect(() => {
    if (!profile || !isLoaded) return;

    try {
      const profileDelta = syncProfileToCaseData(profile, state.metadata, state.backendId);
      if (Object.keys(profileDelta).length > 0) {
        setState((prev) => ({
          ...prev,
          metadata: { ...prev.metadata, ...profileDelta },
        }));
        console.log("[useWizard] Auto-merged profile fields into journey metadata:", profileDelta);
      }
    } catch (err) {
      console.error("[useWizard] Failed to auto-merge profile fields into journey metadata:", err);
    }
  }, [profile, isLoaded, state.metadata]);

  // ─── Actions ───────────────────────────────────────────────────────────────

  const actions = useMemo(() => {
    // Helper to invalidate server cache in the background after a mutation
    const invalidateJourneyCache = () => {
      if (!userId || !journeyId) return;
      fetch("/api/journeys/initialize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-cache-bust": "1",
        },
        body: JSON.stringify({
          journey_type: journeyId,
          candidate_id: effectiveCandidateId,
        }),
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

          // Stamp started_at the FIRST time the user opens a step. This is the
          // origin the case-strength active-step grace window keys off of
          // (alert-gating.ts). Without it, `startedAt` stays null and current-step
          // warnings surface immediately instead of after the grace period.
          const alreadyStarted = prev.stepTimestamps[stepId]?.startedAt != null;

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

            // Persist started_at once, so the grace clock survives a reload.
            if (!alreadyStarted) {
              fetch(`/api/steps/${stepUuid}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ started_at: new Date().toISOString() }),
              }).catch((err) =>
                console.error("[useWizard] Failed to save step start time:", err)
              );
            }
          }

          // Local stamp (first reach only) so the grace clock starts now without
          // waiting for a reload — mirrors the completed_at stamp in toggleComplete.
          const nextStepTimestamps = alreadyStarted
            ? prev.stepTimestamps
            : {
                ...prev.stepTimestamps,
                [stepId]: { ...(prev.stepTimestamps[stepId] || {}), startedAt: Date.now() },
              };

          return {
            ...prev,
            currentStep: idx,
            collapsedSteps: { ...prev.collapsedSteps, [stepId]: false },
            stepTimestamps: nextStepTimestamps,
          };
        });
      },

      toggleComplete: async (stepKey: string) => {
        const currentState = stateRef.current;
        const { isLocked } = getJourneyLockStatus(currentState.metadata);
        if (isLocked) {
          showToast(
            `${msg(E.DASH_JOURNEY_STEP_LOCKED)}.\nThis journey is in read-only mode. The 14-day window following your interview outcome has ended.`,
            "error",
            { duration: 4000 }
          );
          return;
        }

        // Restrict free plan users from marking steps as completed to avoid inserting journey into DB
        const currentTier = (currentState.subscriptionTier || "free").toLowerCase();
        if (currentTier === "free") {
          showToast(
            "Please upgrade your plan to mark steps as completed and save your journey progress.",
            "error",
            { duration: 4000 }
          );
          return;
        }

        const isCompleted = currentState.completedSteps.has(stepKey);

        // ENFORCE SEQUENTIAL ORDERING — runs before backendId check so the
        // toast always fires even if the journey hasn't fully synced yet.
        if (!isCompleted) {
          const chapters = activeRoadmap?.chapters || activeRoadmap?.stages || [];
          const filingMethod =
            currentState.metadata?.filingMethod || currentState.filingType || "online";
          const metadata = currentState.metadata;

          const isStepActiveForCurrentFlow = (s: any): boolean => {
            const visibleWhen = s.visible_when;
            if (visibleWhen && Object.keys(visibleWhen).length > 0) {
              let isVisible = true;
              for (const [key, value] of Object.entries<any>(visibleWhen)) {
                if (key === "filingMethod") {
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
            if (!branch || branch === "both") return true;
            return branch === filingMethod;
          };

          // Build ordered list of all active steps with their display names
          const orderedActiveSteps: Array<{ key: string; name: string }> = [];
          chapters.forEach((chapter: any) => {
            (chapter.steps || []).forEach((s: any) => {
              if (isStepActiveForCurrentFlow(s)) {
                orderedActiveSteps.push({
                  key: s.step_key || s.id,
                  name: s.step_name || s.name || s.step_key || s.id,
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
              showToast(
                `Required step pending: "${firstIncomplete.name}"\n Please complete the required preceding step first.`,
                "error",
                { duration: 4000 }
              );
              return;
            }
          }
        }

        if (!currentState.backendId) {
          console.warn("[useWizard] toggleComplete: No backendId found");
          return;
        }

        let stepUuid = currentState.stepMap[stepKey];

        if (!stepUuid) {
          console.warn(
            `[useWizard] toggleComplete: stepKey "${stepKey}" not found in stepMap, attempting sync...`
          );
          try {
            setIsSyncing(true);
            // Create a fresh controller for the auto-heal fetch
            const healController = new AbortController();
            abortControllerRef.current = healController;
            const res = await fetch("/api/journeys/initialize", {
              method: "POST",
              headers: { "Content-Type": "application/json", "x-cache-bust": "1" },
              body: JSON.stringify({
                journey_type: journeyId,
                candidate_id: effectiveCandidateId,
              }),
              signal: healController.signal,
            });
            if (res.ok) {
              const { data } = await res.json();
              if (data?.steps) {
                const refreshedMap: Record<string, string> = {};
                data.steps.forEach((s: any) => {
                  refreshedMap[s.step_key] = s.id;
                });
                setState((prev) => ({
                  ...prev,
                  stepMap: { ...prev.stepMap, ...refreshedMap },
                }));
                stepUuid = refreshedMap[stepKey];
              }
            }
          } catch (syncErr) {
            if ((syncErr as any)?.name === "AbortError") return; // unmount — no-op
            console.error("[useWizard] auto-heal stepMap error:", syncErr);
          } finally {
            setIsSyncing(false);
          }

          if (!stepUuid) {
            showToast(msg(E.DASH_CLOUD_SYNC_FAILED), "error");
            return;
          }
        }

        // Optimistic update
        setState((prev) => {
          const newCompleted = new Set(prev.completedSteps);
          const nowCompleting = !newCompleted.has(stepKey);
          if (nowCompleting) newCompleted.add(stepKey);
          else newCompleted.delete(stepKey);

          // Stamp/clear completed_at locally so the case-strength "behind step"
          // escalation clock is accurate without waiting for a reload.
          const prevTs = prev.stepTimestamps[stepKey] || {};
          return {
            ...prev,
            completedSteps: newCompleted,
            stepTimestamps: {
              ...prev.stepTimestamps,
              [stepKey]: { ...prevTs, completedAt: nowCompleting ? Date.now() : null },
            },
          };
        });

        if (stepUuid) {
          setIsSyncing(true);
          const url = !isCompleted
            ? `/api/steps/${stepUuid}?action=complete`
            : `/api/steps/${stepUuid}`;
          const method = !isCompleted ? "POST" : "PATCH";
          const body = JSON.stringify(!isCompleted ? {} : { status: "not_started" });

          // Fresh abort controller for this sync request
          const syncController = new AbortController();
          abortControllerRef.current = syncController;

          try {
            const res = await fetch(url, {
              method,
              headers: { "Content-Type": "application/json" },
              body,
              signal: syncController.signal,
            });
            if (res.ok) {
              window.dispatchEvent(new CustomEvent("refresh-reminders"));
              invalidateJourneyCache();
            } else {
              throw new Error(`Sync failed: HTTP ${res.status}`);
            }
          } catch (err) {
            if ((err as any)?.name === "AbortError") {
              // Request was cancelled (unmount / hot-reload) — leave optimistic state as-is
              setIsSyncing(false);
              return;
            }
            console.error("[useWizard] sync failed:", err);
            // Rollback (including the optimistic completed_at stamp)
            setState((prev) => {
              const newCompleted = new Set(prev.completedSteps);
              if (!isCompleted) newCompleted.delete(stepKey);
              else newCompleted.add(stepKey);
              const prevTs = prev.stepTimestamps[stepKey] || {};
              return {
                ...prev,
                completedSteps: newCompleted,
                stepTimestamps: {
                  ...prev.stepTimestamps,
                  [stepKey]: { ...prevTs, completedAt: isCompleted ? prevTs.completedAt ?? null : null },
                },
              };
            });
          }
          setIsSyncing(false);
        }
      },

      updateMetadata: async (metadata: Record<string, any>) => {
        const currentState = stateRef.current;

        const hasChanges = Object.entries(metadata).some(
          ([key, val]) => JSON.stringify(currentState.metadata[key]) !== JSON.stringify(val)
        );
        if (!hasChanges) return;

        // Optimistic local update immediately
        setState((prev) => ({
          ...prev,
          metadata: { ...prev.metadata, ...metadata },
        }));

        // Client-side synchronization with UserProfileContext
        try {
          const profileDelta = syncCaseDataToProfile(metadata, {}, currentState.backendId);
          if (Object.keys(profileDelta).length > 0) {
            updateProfile(profileDelta, { silent: true });
          }
        } catch (err) {
          console.error("[useWizard] Failed to sync metadata to user profile context:", err);
        }

        if (currentState.backendId) {
          const ops = Object.entries(metadata).map(([key, val]) => ({
            operation: "set",
            data_key: key,
            data_value: val,
          }));
          const res = await fetch("/api/case_data", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              journey_id: currentState.backendId,
              batch: true,
              operations: ops,
            }),
          });
          if (!res.ok) {
            throw new Error(`[useWizard] Case data sync failed: HTTP ${res.status}`);
          }
          window.dispatchEvent(new CustomEvent("refresh-reminders"));
          invalidateJourneyCache();
        }
      },

      updateAnswers: (answers: Record<string, any>) => {
        setState((prev) => ({
          ...prev,
          answers: { ...prev.answers, ...answers },
        }));
      },

      setRole: (role: WizardState["role"]) => setState((prev) => ({ ...prev, role })),
      setFilingType: (type: WizardState["filingType"]) =>
        setState((prev) => ({ ...prev, filingType: type })),
      setScenario: (scenario: string) => setState((prev) => ({ ...prev, scenarioType: scenario })),
      toggleCollapse: (stepId: string) =>
        setState((prev) => ({
          ...prev,
          collapsedSteps: { ...prev.collapsedSteps, [stepId]: !prev.collapsedSteps[stepId] },
        })),
      toggleDocument: (doc: string) => {
        setState((prev) => ({
          ...prev,
          documentChecklist: {
            ...prev.documentChecklist,
            [doc]: !prev.documentChecklist[doc],
          },
        }));
      },
      updateNote: (stepKey: string, note: string) => {
        setState((prev) => ({
          ...prev,
          notes: {
            ...prev.notes,
            [stepKey]: note,
          },
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
            showToast(`Saving ${file.name} to vault...`, "loading", { id: "vault-upload" });
            const documentDefId = mapDocumentNameToId(doc);
            const formData = new FormData();
            formData.append("file", file);
            formData.append("documentDefId", documentDefId);
            formData.append("caseId", journeyId.toUpperCase());

            fetch("/api/documents/upload", { method: "POST", body: formData })
              .then((res) => {
                if (!res.ok) throw new Error();
                useDocumentVaultStore.getState().reloadDocuments();
                showToast("Saved to vault", "success", { id: "vault-upload" });
              })
              .catch(() => showToast(msg(E.DASH_VAULT_SAVE_FAILED), "error", { id: "vault-upload" }));
          }
          return {
            ...prev,
            docUploads: {
              ...prev.docUploads,
              [doc]: { name: file.name, size: file.size, lastModified: file.lastModified },
            },
          };
        });
      },
      resetProgress: async () => {
        setState((prev) => {
          if (prev.backendId) {
            fetch(`/api/journeys/${prev.backendId}`, {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
            })
              .then(() => invalidateJourneyCache())
              .catch(() => {});
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
            })
              .then(() => invalidateJourneyCache())
              .catch(() => {});
          }
          return { ...prev, started: true };
        });
        setHasExistingProgress(true);
      },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, journeyId, activeRoadmap, effectiveCandidateId]); // STABLE DEPENDENCIES
  // ^ effectiveCandidateId MUST be here: the actions close over it (cache-bust refetch posts
  //   candidate_id: effectiveCandidateId). Without it, switching the active candidate left the
  //   actions bound to the previous candidate, so refetches/writes hit the wrong journey.

  return { state, actions, isLoaded, hasExistingProgress, isSyncing, error };
}
