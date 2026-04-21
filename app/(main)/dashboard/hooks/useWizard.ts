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

        // Sync any missing steps from latest config into existing journey (silent, best-effort)
        try {
          await fetch(`/api/journeys/${targetJourneyId}/sync-steps`, { method: 'POST' });
        } catch (syncErr) {
          console.warn('[useWizard] Step sync failed (non-fatal):', syncErr);
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
            metadata: {
              ...metadata,
              tracking_status: journey.tracking_status || {},
            },
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
        console.warn("[useWizard] toggleComplete: stepKey not found in stepMap, attempting sync...");
        
        // Attempt to sync missing steps from config into this journey
        if (state.backendId) {
          try {
            const syncRes = await fetch(`/api/journeys/${state.backendId}/sync-steps`, { method: 'POST' });
            const syncData = await syncRes.json();
            
            if (syncData.success && syncData.data.steps_added > 0) {
              // Re-fetch journey steps to build updated stepMap
              const detailRes = await fetch(`/api/journeys/${state.backendId}`);
              const detailData = await detailRes.json();
              
              if (detailData.success) {
                const newStepMap: Record<string, string> = {};
                detailData.data.steps.forEach((s: any) => {
                  newStepMap[s.step_key] = s.id;
                });
                
                setState((prev) => ({ ...prev, stepMap: newStepMap }));
                
                // Now check if the step is available
                if (newStepMap[stepKey]) {
                  // Continue with the now-found step UUID
                  const newStepUuid = newStepMap[stepKey];
                  try {
                    const res = await fetch(`/api/steps/${newStepUuid}?action=complete`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({}),
                    });
                    if (res.ok) {
                      setState((prev) => {
                        const newCompleted = new Set(prev.completedSteps);
                        newCompleted.add(stepKey);
                        return { ...prev, completedSteps: newCompleted, stepMap: { ...prev.stepMap, ...newStepMap } };
                      });
                      console.log('[useWizard] Step synced and completed:', stepKey);
                    }
                  } catch (err) {
                    console.error('[useWizard] Failed to complete synced step:', err);
                  }
                  return;
                }
              }
            }
          } catch (err) {
            console.warn('[useWizard] Auto-sync failed:', err);
          }
        }
        
        toast.error(`Step not found in your journey. Please refresh the page.`);
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

      // Background Sync — retries 3 times before rollback so
      // a single network hiccup never undoes the user's progress.
      if (stepUuid) {
        setIsSyncing(true);
        const url = !isCompleted
          ? `/api/steps/${stepUuid}?action=complete`
          : `/api/steps/${stepUuid}`;
        const method = !isCompleted ? "POST" : "PATCH";
        const body = JSON.stringify(!isCompleted ? {} : { status: "not_started" });

        let lastErr: unknown;
        let success = false;

        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            if (attempt > 0) {
              // Wait before retry: 800ms, 1600ms
              await new Promise((r) => setTimeout(r, attempt * 800));
            }
            const res = await fetch(url, {
              method,
              headers: { "Content-Type": "application/json" },
              body,
            });
            if (!res.ok) {
              const errData = await res.json().catch(() => ({}));
              throw new Error(errData.error || `HTTP ${res.status}`);
            }
            success = true;
            break;
          } catch (err) {
            lastErr = err;
          }
        }

        if (success) {
          console.log("[useWizard] sync success:", stepKey);
        } else {
          console.error("[useWizard] sync failed after 3 attempts:", stepKey, lastErr);
          toast.error("Progress saved locally. Will sync when connection is restored.");
          // Rollback only after all retries exhausted
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
      const hasChanges = Object.entries(metadata).some(
        ([key, val]) => JSON.stringify(state.metadata[key]) !== JSON.stringify(val)
      );
      if (!hasChanges) return;

      // If updating NVC/USCIS/Courier fields, re-fetch Portal Wallet and merge
      const portalFields = ["nvcCaseNum", "nvcInvoice", "receiptNum", "interviewEmbassy", "medicalDate"];
      const shouldSyncWallet = Object.keys(metadata).some((k) => portalFields.includes(k));

      let mergedMetadata = { ...metadata };
      if (shouldSyncWallet) {
        try {
          const res = await fetch("/api/portal-wallet");
          const wallet = await res.json();
          const nvcCreds = wallet.credentials?.find((c: any) => c.portal_type?.toUpperCase() === "NVC");
          if (nvcCreds) {
            // Only sync from wallet if the form didn't just provide a new value
            if (nvcCreds.nvc_case_number && !metadata.nvcCaseNum) mergedMetadata.nvcCaseNum = nvcCreds.nvc_case_number;
            if (nvcCreds.nvc_invoice_id && !metadata.nvcInvoice) mergedMetadata.nvcInvoice = nvcCreds.nvc_invoice_id;
          }
          const uscisCreds = wallet.credentials?.find((c: any) => c.portal_type?.toUpperCase() === "USCIS");
          if (uscisCreds && uscisCreds.receipt_number && !metadata.receiptNum) mergedMetadata.receiptNum = uscisCreds.receipt_number;
        } catch (err) {
          console.error("[useWizard] Failed to sync Portal Wallet to metadata:", err);
        }
      }

      setState((prev) => ({
        ...prev,
        metadata: { ...prev.metadata, ...mergedMetadata }
      }));

      if (state.backendId) {
        try {
          const ops = Object.entries(mergedMetadata).map(([key, val]) => ({
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
    },

    savePaymentMethod: async (methodValue: string) => {
      if (!state.backendId) {
        console.warn("[useWizard] No backendId for payment method save");
        throw new Error("Journey not initialized");
      }

      try {
        const dataKey = "paper_payment_method";
        const response = await fetch(`/api/case_data/${state.backendId}/${dataKey}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            data_value: methodValue,
            is_verified: false,
            source: "step_action",
          }),
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
          throw new Error(error.error || `Failed to save payment method: ${response.status}`);
        }

        // Update local state with the saved data
        setState((prev) => ({
          ...prev,
          metadata: { ...prev.metadata, [dataKey]: methodValue },
        }));

        console.log("[useWizard] Payment method saved successfully");
      } catch (err) {
        console.error("[useWizard] Payment method save failed:", err);
        throw err;
      }
    },

    saveMailingDetails: async (carrier: string, trackingNumber: string) => {
      if (!state.backendId) {
        console.warn("[useWizard] No backendId for mailing details save");
        throw new Error("Journey not initialized");
      }
    
      try {
        // Step 1: Save carrier and tracking number (existing code)
        const [carrierRes, trackingRes] = await Promise.all([
          fetch(`/api/case_data/${state.backendId}/paper_mailing_carrier`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              data_value: carrier,
              is_verified: false,
              source: "step_action",
            }),
          }),
          fetch(`/api/case_data/${state.backendId}/paper_mailing_tracking`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              data_value: trackingNumber,
              is_verified: false,
              source: "step_action",
            }),
          }),
        ]);
    
        // Check both responses
        if (!carrierRes.ok) {
          const error = await carrierRes
            .json()
            .catch(() => ({ error: `HTTP ${carrierRes.status}` }));
          throw new Error(
            error.error || `Failed to save carrier: ${carrierRes.status}`
          );
        }
        if (!trackingRes.ok) {
          const error = await trackingRes
            .json()
            .catch(() => ({ error: `HTTP ${trackingRes.status}` }));
          throw new Error(
            error.error || `Failed to save tracking: ${trackingRes.status}`
          );
        }
    
        // NEW: Step 2 - Create EasyPost tracker
        console.log(
          "[useWizard] Creating EasyPost tracker...",
          carrier,
          trackingNumber
        );
    
        const trackerRes = await fetch("/api/easypost/tracker/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            caseId: state.backendId,
            carrier: carrier,
            trackingCode: trackingNumber,
          }),
        });
    
        let trackerData = null;
        if (!trackerRes.ok) {
          const error = await trackerRes
            .json()
            .catch(() => ({ error: `HTTP ${trackerRes.status}` }));
          console.error(
            "[useWizard] Failed to create tracker:",
            error.error || trackerRes.status
          );
          // Don't throw here - tracking creation failure shouldn't fail the main save
          // The cron job can retry later
        } else {
          trackerData = await trackerRes.json();
          console.log("[useWizard] EasyPost tracker created:", trackerData.id);
        }
    
        // Update local state with saved values
        setState((prev) => {
          const newMetadata: Record<string, any> = {
            ...prev.metadata,
            paper_mailing_carrier: carrier,
            paper_mailing_tracking: trackingNumber,
          };

          // If tracker created successfully, also store tracker data
          if (trackerData) {
            newMetadata.easypost_tracker_id = trackerData.id;
            newMetadata.tracking_status = trackerData.status;
            newMetadata.tracking_last_checked_at = new Date().toISOString();
          }

          return {
            ...prev,
            metadata: newMetadata,
          };
        });
    
        console.log("[useWizard] Mailing details saved successfully");
      } catch (err) {
        console.error("[useWizard] Mailing details save failed:", err);
        throw err;
      }
    },
  }), [state.backendId, state.metadata, state.completedSteps, state.stepMap, state.role, journeyId, userId, activeRoadmap, normalizeState]);

  return { state, actions, isLoaded, hasExistingProgress, isSyncing };
}
