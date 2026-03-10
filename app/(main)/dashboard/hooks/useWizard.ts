import { useState, useEffect, useCallback, useRef } from 'react';
import {
  loadJourneyProgress,
  saveJourneyProgress,
  deleteJourneyProgress,
  recordToWizardState,
} from '@/lib/journey/journeyProgressService';
import { RoadmapData, RoadmapStep } from '@/app/(tools)/(visa)/visa-category/ir-category/[visa-journey]/components/types';

export interface WizardState {
  currentStage: number;
  currentStep: number | null;
  completedSteps: Set<string>;
  collapsedSteps: Record<string, boolean>;
  role: 'both' | 'petitioner' | 'beneficiary';
  filingType: 'online' | 'paper' | 'both';
  documentChecklist: Record<string, boolean>;
  docUploads: Record<string, { name: string; size: number; lastModified: number }>;
  notes: Record<string, string>;
  started: boolean;
}

const LOCAL_STORAGE_KEY = 'rahvanaWizardState';

const DEFAULT_STATE: WizardState = {
  currentStage: 0,
  currentStep: null,
  completedSteps: new Set(),
  collapsedSteps: {},
  role: 'both',
  filingType: 'online',
  documentChecklist: {},
  docUploads: {},
  notes: {},
  started: false,
};

interface UseWizardOptions {
  /** Supabase user ID — if provided, progress syncs to DB */
  userId?: string | null;
  /** Journey ID (e.g., 'ir1') */
  journeyId?: string;
  /** Dynamic roadmap data */
  roadmapData?: RoadmapData | null;
}

export function useWizard(options: UseWizardOptions = {}) {
  const { userId, journeyId = 'ir1', roadmapData } = options;

  const [state, setState] = useState<WizardState>(DEFAULT_STATE);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasExistingProgress, setHasExistingProgress] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Debounce ref to avoid saving on every keystroke
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // ─── Load Progress ────────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;

    async function loadProgress() {
      setIsLoaded(false);

      if (userId) {
        // Logged in: load from Supabase
        const record = await loadJourneyProgress(userId, journeyId);
        if (!cancelled) {
          if (record) {
            const wizardState = recordToWizardState(record);
            setState(prev => ({ ...prev, ...wizardState }));
            setHasExistingProgress(record.started);
          } else {
            // No DB record — check localStorage as fallback (e.g., started before login)
            const localData = loadFromLocalStorage();
            if (localData && localData.started) {
              setState(prev => ({ ...prev, ...localData }));
              setHasExistingProgress(true);
              // Immediately sync local data to DB
              await saveJourneyProgress(userId, journeyId, { ...DEFAULT_STATE, ...localData });
              clearLocalStorage();
            } else {
              setState(DEFAULT_STATE);
              setHasExistingProgress(false);
            }
          }
          setIsLoaded(true);
        }
      } else {
        // Logged out: load from localStorage
        const localData = loadFromLocalStorage();
        if (!cancelled) {
          if (localData) {
            setState(prev => ({ ...prev, ...localData }));
            setHasExistingProgress(localData.started ?? false);
          } else {
            setState(DEFAULT_STATE);
            setHasExistingProgress(false);
          }
          setIsLoaded(true);
        }
      }
    }

    loadProgress();
    return () => { cancelled = true; };
  }, [userId, journeyId]);

  // ─── Normalize State After Load ───────────────────────────────────────────

  const normalizeState = useCallback(() => {
    if (!roadmapData) return;
    setState(prev => {
      let { currentStage, currentStep } = prev;

      if (currentStage < 0) currentStage = 0;
      if (currentStage >= roadmapData.stages.length) {
        currentStage = roadmapData.stages.length - 1;
      }

      const stage = roadmapData.stages[currentStage];
      if (!stage) return prev;

      if (currentStep === null || currentStep < 0 || currentStep >= stage.steps.length) {
        const firstIncomplete = stage.steps.findIndex((s: RoadmapStep) => !prev.completedSteps.has(s.id));
        currentStep = firstIncomplete === -1 ? 0 : firstIncomplete;
      }

      const validStepIndex = currentStep === null ? 0 : currentStep;
      const stepId = stage.steps[validStepIndex]?.id;
      const newCollapsed = { ...prev.collapsedSteps };
      if (stepId) {
        newCollapsed[stepId] = false;
      }

      return { ...prev, currentStage, currentStep, collapsedSteps: newCollapsed };
    });
  }, [roadmapData]);

  useEffect(() => {
    if (isLoaded && roadmapData) {
      normalizeState();
    }
  }, [isLoaded, roadmapData, normalizeState]);

  // ─── Auto-Save on State Change ────────────────────────────────────────────

  useEffect(() => {
    if (!isLoaded) return;

    // Debounce saves by 800ms to avoid hammering the DB
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = setTimeout(async () => {
      if (userId) {
        setIsSyncing(true);
        await saveJourneyProgress(userId, journeyId, state);
        setIsSyncing(false);
      } else {
        // Save to localStorage for guest users
        saveToLocalStorage(state);
      }
    }, 800);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [state, isLoaded, userId, journeyId]);

  // ─── Actions ──────────────────────────────────────────────────────────────

  const actions = {
    setStage: (idx: number) => {
      if (!roadmapData) return;
      setState(prev => ({ ...prev, currentStage: idx, currentStep: null }));
      setTimeout(normalizeState, 0);
    },

    setCurrentStep: (idx: number) => {
      if (!roadmapData) return;
      setState(prev => {
        const stage = roadmapData.stages[prev.currentStage];
        if (!stage) return prev;
        const step = stage.steps[idx];
        const newCollapsed = { ...prev.collapsedSteps };
        if (step) {
          newCollapsed[step.id] = false;
        }
        return { ...prev, currentStep: idx, collapsedSteps: newCollapsed };
      });
    },

    toggleComplete: (stepId: string) => {
      if (!roadmapData) return;
      setState(prev => {
        const newCompleted = new Set(prev.completedSteps);
        const newCollapsed = { ...prev.collapsedSteps };
        let newStepIdx = prev.currentStep;

        if (newCompleted.has(stepId)) {
          newCompleted.delete(stepId);
          newCollapsed[stepId] = false;
        } else {
          newCompleted.add(stepId);
          newCollapsed[stepId] = true;

          const stage = roadmapData.stages[prev.currentStage];
          if (stage) {
            const currentStepId = stage.steps[prev.currentStep ?? 0]?.id;
            if (currentStepId === stepId) {
              const nextIdx = stage.steps.findIndex((s: RoadmapStep) => !newCompleted.has(s.id));
              if (nextIdx !== -1) {
                newStepIdx = nextIdx;
              }
            }
          }
        }

        return {
          ...prev,
          completedSteps: newCompleted,
          collapsedSteps: newCollapsed,
          currentStep: newStepIdx,
        };
      });
    },

    toggleCollapse: (stepId: string) => {
      setState(prev => ({
        ...prev,
        collapsedSteps: {
          ...prev.collapsedSteps,
          [stepId]: !prev.collapsedSteps[stepId],
        },
      }));
    },

    setRole: (role: WizardState['role']) =>
      setState(prev => ({ ...prev, role })),

    setFilingType: (type: WizardState['filingType']) =>
      setState(prev => ({ ...prev, filingType: type })),

    updateNote: (doc: string, note: string) => {
      setState(prev => ({ ...prev, notes: { ...prev.notes, [doc]: note } }));
    },

    toggleDocument: (doc: string) => {
      setState(prev => ({
        ...prev,
        documentChecklist: {
          ...prev.documentChecklist,
          [doc]: !prev.documentChecklist[doc],
        },
      }));
    },

    uploadDocument: (doc: string, file: File) => {
      setState(prev => ({
        ...prev,
        docUploads: {
          ...prev.docUploads,
          [doc]: { name: file.name, size: file.size, lastModified: file.lastModified },
        },
      }));
    },

    clearDocument: (doc: string) => {
      setState(prev => {
        const newUploads = { ...prev.docUploads };
        delete newUploads[doc];
        return { ...prev, docUploads: newUploads };
      });
    },

    /** Mark journey as officially started */
    startJourney: () => {
      setState(prev => ({ ...prev, started: true }));
      setHasExistingProgress(true);
    },

    /** Reset all progress (Start Fresh) */
    resetProgress: async () => {
      if (userId) {
        await deleteJourneyProgress(userId, journeyId);
      } else {
        clearLocalStorage();
      }

      setState(DEFAULT_STATE);
      setHasExistingProgress(false);
    },
  };

  return { state, actions, isLoaded, hasExistingProgress, isSyncing };
}

// ─── localStorage Helpers ─────────────────────────────────────────────────────

function loadFromLocalStorage(): Partial<WizardState> | null {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!saved) return null;
    const parsed = JSON.parse(saved);
    if (parsed.completedSteps) {
      parsed.completedSteps = new Set(parsed.completedSteps);
    }
    return parsed;
  } catch {
    return null;
  }
}

function saveToLocalStorage(state: WizardState) {
  try {
    const toSave = {
      ...state,
      completedSteps: Array.from(state.completedSteps),
    };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(toSave));
  } catch {
    // ignore storage errors
  }
}

function clearLocalStorage() {
  localStorage.removeItem(LOCAL_STORAGE_KEY);
}
