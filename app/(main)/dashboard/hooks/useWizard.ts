import { useState, useEffect, useCallback, useRef } from 'react';
import { roadmapData } from '../../../../data/roadmap';
import {
  loadJourneyProgress,
  saveJourneyProgress,
  deleteJourneyProgress,
  recordToWizardState,
} from '@/lib/journey/journeyProgressService';

export interface WizardState {
  currentStage: number;
  currentStep: number | null;
  scenarioType?: string | undefined;
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
  scenarioType: undefined,
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
  /** Custom roadmap data (optional) */
  roadmapData?: any;
}

export function useWizard(options: UseWizardOptions = {}) {
  const { userId, journeyId = 'ir1', roadmapData: externalRoadmapData } = options;

  // Use external roadmap data if provided, else fallback to default
  const activeRoadmap = externalRoadmapData || roadmapData;

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
    if (!activeRoadmap || !activeRoadmap.stages) return;

    setState(prev => {
      let { currentStage, currentStep } = prev;

      if (currentStage < 0) currentStage = 0;
      if (currentStage >= activeRoadmap.stages.length) {
        currentStage = Math.max(0, activeRoadmap.stages.length - 1);
      }

      const stage = activeRoadmap.stages[currentStage];
      if (!stage) return { ...prev, currentStage, currentStep: null };

      let narrowedStep: number;
      if (currentStep === null || currentStep < 0 || currentStep >= stage.steps.length) {
        const firstIncomplete = stage.steps.findIndex((s: any) => !prev.completedSteps.has(s.id));
        narrowedStep = firstIncomplete === -1 ? 0 : firstIncomplete;
      } else {
        narrowedStep = currentStep;
      }

      const stepId = stage.steps[narrowedStep]?.id;
      const newCollapsed = { ...prev.collapsedSteps };
      if (stepId) {
        newCollapsed[stepId] = false;
      }

      return { ...prev, currentStage, currentStep: narrowedStep, collapsedSteps: newCollapsed };
    });
  }, [activeRoadmap]);

  useEffect(() => {
    if (isLoaded) {
      normalizeState();
    }
  }, [isLoaded, normalizeState]);

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
      setState(prev => ({ ...prev, currentStage: idx, currentStep: null }));
      setTimeout(normalizeState, 0);
    },

    setCurrentStep: (idx: number) => {
      setState(prev => {
        const stage = activeRoadmap.stages[prev.currentStage];
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

          const stage = activeRoadmap.stages[prev.currentStage];
          if (stage) {
            const currentStepId = stage.steps[prev.currentStep ?? 0]?.id;
            if (currentStepId === stepId) {
              const nextIdx = stage.steps.findIndex((s: any) => !newCompleted.has(s.id));
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

    setScenario: (scenario: string) => {
      setState(prev => ({
        ...prev,
        scenarioType: scenario
      }));
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