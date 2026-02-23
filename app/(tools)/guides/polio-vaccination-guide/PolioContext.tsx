"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type PolioWizardState = {
  currentStep: number;
  completedSteps: number[];
  personType: string | null;
  location: { province: string; district: string; city: string } | null;
  isAddedToActive: boolean;
};

export type PolioWizardContextType = {
  isMounted: boolean;
  state: PolioWizardState;
  updateState: (updates: Partial<PolioWizardState>) => void;
  setCurrentStep: (step: number) => void;
  completeStep: (step: number) => void;
  setPersonType: (type: string) => void;
  setLocation: (location: {
    province: string;
    district: string;
    city: string;
  }) => void;
  addToActiveWizards: () => void;
  resetWizard: () => void;
  showWelcomeModal: boolean;
  setShowWelcomeModal: (show: boolean) => void;
};

const PolioWizardContext = createContext<PolioWizardContextType | null>(null);

const STORAGE_KEY = "polio_wizard_state";

const initialState: PolioWizardState = {
  currentStep: 0,
  completedSteps: [],
  personType: null,
  location: null,
  isAddedToActive: false,
};

export function PolioWizardProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMounted, setIsMounted] = useState(false);
  const [state, setState] = useState(() => initialState);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          setState(JSON.parse(saved));
        } catch (e) {
          console.error("Failed to parse saved state:", e);
        }
      }

      const dontShow = localStorage.getItem("dont_show_polio_welcome");
      if (!dontShow) {
        setShowWelcomeModal(true);
      } else if (!saved) {
        setState((prev) => ({ ...prev, currentStep: 1 }));
      }
    }
  }, []);

  useEffect(() => {
    if (isMounted && typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [state, isMounted]);

  const updateState = (updates: Partial<PolioWizardState>) => {
    setState((prev: PolioWizardState) => ({ ...prev, ...updates }));
  };

  const setCurrentStep = (step: number) => {
    setState((prev: PolioWizardState) => ({ ...prev, currentStep: step }));
  };

  const completeStep = (step: number) => {
    setState((prev: PolioWizardState) => ({
      ...prev,
      completedSteps: Array.from(new Set([...prev.completedSteps, step])),
    }));
  };

  const setPersonType = (type: string) => {
    updateState({ personType: type });
    completeStep(1);
  };

  const setLocation = (location: {
    province: string;
    district: string;
    city: string;
  }) => {
    updateState({ location });
  };

  const addToActiveWizards = () => {
    updateState({ isAddedToActive: true });
    if (typeof window !== "undefined") {
      const activeWizards = JSON.parse(
        localStorage.getItem("active_wizards") || "[]",
      );
      const wizardEntry = {
        id: Date.now(),
        title: "Polio Vaccination Certificate Guide",
        personType: state.personType,
        savedAt: new Date().toISOString(),
        url: "/guides/polio-vaccination-guide",
      };
      localStorage.setItem(
        "active_wizards",
        JSON.stringify([...activeWizards, wizardEntry]),
      );
    }
  };

  const resetWizard = () => {
    if (typeof window !== "undefined") {
      const dontShow = localStorage.getItem("dont_show_polio_welcome");
      setState({
        ...initialState,
        currentStep: dontShow ? 1 : 0,
      });
      localStorage.removeItem(STORAGE_KEY);
    } else {
      setState(initialState);
    }
  };

  const value = {
    isMounted,
    state,
    updateState,
    setCurrentStep,
    completeStep,
    setPersonType,
    setLocation,
    addToActiveWizards,
    resetWizard,
    showWelcomeModal,
    setShowWelcomeModal,
  };

  return (
    <PolioWizardContext.Provider value={value}>
      {children}
    </PolioWizardContext.Provider>
  );
}

export function usePolioWizard() {
  const context = useContext(PolioWizardContext);
  if (!context) {
    throw new Error("usePolioWizard must be used within PolioWizardProvider");
  }
  return context;
}
