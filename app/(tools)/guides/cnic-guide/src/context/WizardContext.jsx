import React, { createContext, useContext, useState, useEffect } from 'react';

const WizardContext = createContext();

const STORAGE_KEY = 'pakistan_bc_wizard_state';

const initialState = {
  currentStep: 0,
  completedSteps: [],
  personType: null,
  documentNeed: null,
  location: {
    province: null,
    district: null,
    city: null,
  },
  roadmap: {
    stations: [],
    customTimes: {},
  },
  checklist: [],
  preferredOffice: null,
  documentVault: [],
  isAddedToActive: false,
};

export function WizardProvider({ children }) {
  const [state, setState] = useState(() => {
    // Load from localStorage on mount
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved state:', e);
        return initialState;
      }
    }
    return initialState;
  });

  const [showWelcomeModal, setShowWelcomeModal] = useState(() => {
    const dontShow = localStorage.getItem('dont_show_welcome');
    return !dontShow;
  });

  // Autosave to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const updateState = (updates) => {
    setState((prev) => ({
      ...prev,
      ...updates,
    }));
  };

  const setCurrentStep = (step) => {
    setState((prev) => ({
      ...prev,
      currentStep: step,
    }));
  };

  const completeStep = (step) => {
    setState((prev) => ({
      ...prev,
      completedSteps: [...new Set([...prev.completedSteps, step])],
    }));
  };

  const setPersonType = (type) => {
    updateState({ personType: type });
    completeStep(1);
  };

  const setDocumentNeed = (need) => {
    updateState({ documentNeed: need });
    completeStep(2);
  };

  const setLocation = (location) => {
    updateState({ location });
    completeStep(3);
  };

  const setRoadmap = (roadmap) => {
    updateState({ roadmap });
  };

  const setChecklist = (checklist) => {
    updateState({ checklist });
  };

  const updateChecklistItem = (index, updates) => {
    setState((prev) => {
      const newChecklist = [...prev.checklist];
      newChecklist[index] = { ...newChecklist[index], ...updates };
      return { ...prev, checklist: newChecklist };
    });
  };

  const setPreferredOffice = (office) => {
    updateState({ preferredOffice: office });
  };

  const addToDocumentVault = (document) => {
    setState((prev) => ({
      ...prev,
      documentVault: [...prev.documentVault, document],
    }));
  };

  const addToActiveWizards = () => {
    updateState({ isAddedToActive: true });
    // Store in a separate list for "Active Wizards"
    const activeWizards = JSON.parse(localStorage.getItem('active_wizards') || '[]');
    const wizardEntry = {
      id: Date.now(),
      title: 'Pakistan Birth Certificate (Union Council) – Immigration',
      personType: state.personType,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem('active_wizards', JSON.stringify([...activeWizards, wizardEntry]));
  };

  const resetWizard = () => {
    setState(initialState);
    localStorage.removeItem(STORAGE_KEY);
  };

  const value = {
    state,
    updateState,
    setCurrentStep,
    completeStep,
    setPersonType,
    setDocumentNeed,
    setLocation,
    setRoadmap,
    setChecklist,
    updateChecklistItem,
    setPreferredOffice,
    addToDocumentVault,
    addToActiveWizards,
    resetWizard,
    showWelcomeModal,
    setShowWelcomeModal,
  };

  return <WizardContext.Provider value={value}>{children}</WizardContext.Provider>;
}

export function useWizard() {
  const context = useContext(WizardContext);
  if (!context) {
    throw new Error('useWizard must be used within WizardProvider');
  }
  return context;
}
