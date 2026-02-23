"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type CnicWizardState = {
  currentStep: number;
  completedSteps: number[];
  personType: string | null;
  applicationType: string | null;
  applicationMethod: string | null;
  location: { province: string; district: string; city: string };
  isAddedToActive: boolean;
};

export type CnicWizardContextType = {
  isMounted: boolean;
  state: CnicWizardState;
  updateState: (updates: Partial<CnicWizardState>) => void;
  setCurrentStep: (step: number) => void;
  completeStep: (step: number) => void;
  setPersonType: (type: string) => void;
  setApplicationType: (type: string) => void;
  setApplicationMethod: (method: string) => void;
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

const CnicWizardContext = createContext<CnicWizardContextType | null>(null);

const STORAGE_KEY = "cnic_wizard_state";

const initialState: CnicWizardState = {
  currentStep: 0,
  completedSteps: [],
  personType: null, // adult, special/orphan
  applicationType: null, // new, replacement, correction
  applicationMethod: null, // online, inperson
  location: { province: "", district: "", city: "" },
  isAddedToActive: false,
};

export function CnicWizardProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMounted, setIsMounted] = useState(false);

  const [state, setState] = useState(() => initialState);

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
      } else {
        const dontShow = localStorage.getItem("dont_show_cnic_welcome");
        if (dontShow) {
          setState((prev) => ({ ...prev, currentStep: 1 }));
        }
      }
    }
  }, []);

  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const dontShow = localStorage.getItem("dont_show_cnic_welcome");
      if (!dontShow) {
        setShowWelcomeModal(true);
      }
    }
  }, []);

  useEffect(() => {
    if (isMounted && typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [state, isMounted]);

  const updateState = (updates: Partial<CnicWizardState>) => {
    setState((prev: CnicWizardState) => ({ ...prev, ...updates }));
  };

  const setCurrentStep = (step: number) => {
    setState((prev: CnicWizardState) => ({ ...prev, currentStep: step }));
  };

  const completeStep = (step: number) => {
    setState((prev: CnicWizardState) => ({
      ...prev,
      completedSteps: Array.from(new Set([...prev.completedSteps, step])),
    }));
  };

  const setPersonType = (type: string) => {
    updateState({ personType: type });
    completeStep(1);
  };

  const setApplicationType = (type: string) => {
    updateState({ applicationType: type });
    completeStep(2);
  };

  const setApplicationMethod = (method: string) => {
    updateState({ applicationMethod: method });
    completeStep(3);
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
        title: "Pakistani CNIC Guide – Application & Renewal",
        personType: state.personType,
        savedAt: new Date().toISOString(),
        url: "/guides/cnic-guide",
      };
      localStorage.setItem(
        "active_wizards",
        JSON.stringify([...activeWizards, wizardEntry]),
      );
    }
  };

  const resetWizard = () => {
    if (typeof window !== "undefined") {
      const dontShow = localStorage.getItem("dont_show_cnic_welcome");
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
    setApplicationType,
    setApplicationMethod,
    setLocation,
    addToActiveWizards,
    resetWizard,
    showWelcomeModal,
    setShowWelcomeModal,
  };

  return (
    <CnicWizardContext.Provider value={value}>
      {children}
    </CnicWizardContext.Provider>
  );
}

export function useCnicWizard() {
  const context = useContext(CnicWizardContext);
  if (!context) {
    throw new Error("useCnicWizard must be used within CnicWizardProvider");
  }
  return context;
}
