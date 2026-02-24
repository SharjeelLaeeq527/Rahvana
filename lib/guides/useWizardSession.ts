import { useState, useEffect } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useGuideSession } from "./useGuideSession";

export function useWizardSession<T>(
  slug: string,
  state: T,
  setState: React.Dispatch<React.SetStateAction<T>>,
  stepIds: string[],
  setCurrentStep: (step: number) => void,
  stateToStepData: (prev: T, stepsData: Record<string, any>) => Partial<T>
) {
  const [hasLoaded, setHasLoaded] = useState(false);
  const { user } = useAuth();
  const { session, stepsData, startSession, saveStep, loading } = useGuideSession(slug);

  // 1. Initial Session Start
  useEffect(() => {
    if (user && !session && !loading) {
      startSession();
    }
  }, [user, session, loading, startSession]);

  // 2. Load backend data into state (ONCE)
  useEffect(() => {
    if (!loading && !hasLoaded) {
      if (stepsData && Object.keys(stepsData).length > 0) {
        setState(prev => ({
          ...prev,
          ...stateToStepData(prev, stepsData)
        }));

        // Sync current step
        if (session?.current_step_key) {
          const stepIndex = stepIds.indexOf(session.current_step_key);
          if (stepIndex !== -1) {
            setCurrentStep(stepIndex);
          }
        }
      }
      setHasLoaded(true);
    }
  }, [stepsData, session, loading, hasLoaded, setState, stepIds, setCurrentStep, stateToStepData]);

  // 3. Helper to save a step with progress calculation
  const saveWizardStep = (stepKey: string, data: any, isCompleted = false) => {
    if (user && session) {
      const stepIdx = stepIds.indexOf(stepKey);
      const progressPercent = Math.round(((stepIdx + 1) / stepIds.length) * 100);
      saveStep(stepKey, data, isCompleted, progressPercent);
    }
  };

  return {
    session,
    loading,
    saveWizardStep,
    isConnected: !!(user && session)
  };
}
