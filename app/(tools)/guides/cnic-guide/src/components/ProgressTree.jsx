import React from 'react';
import { useWizard } from '../context/WizardContext';
import {
  CheckIcon,
  UserIcon,
  DocumentIcon,
  LocationIcon,
  MapIcon,
  SearchIcon,
  StarIcon,
  BookmarkIcon,
} from './Icons';

const STEPS = [
  { id: 0, title: 'Welcome', icon: DocumentIcon },
  { id: 1, title: 'Who is this for?', icon: UserIcon },
  { id: 2, title: 'Document Need', icon: DocumentIcon },
  { id: 3, title: 'Location', icon: LocationIcon },
  { id: 4, title: 'Roadmap', icon: MapIcon },
  { id: 5, title: 'Office Finder', icon: SearchIcon },
  { id: 6, title: 'Validation', icon: StarIcon },
];

export default function ProgressTree() {
  const { state, setCurrentStep, addToActiveWizards } = useWizard();

  const getStepStatus = (stepId) => {
    if (state.completedSteps.includes(stepId)) return 'complete';
    if (stepId === state.currentStep) return 'current';
    return 'upcoming';
  };

  const handleStepClick = (stepId) => {
    // Allow navigation to completed steps or current step
    if (state.completedSteps.includes(stepId) || stepId === state.currentStep) {
      setCurrentStep(stepId);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Add to Active Wizards Button */}
      <div className="p-4 border-b border-gray-200">
        <button
          onClick={addToActiveWizards}
          disabled={state.isAddedToActive}
          className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${
            state.isAddedToActive
              ? 'bg-green-50 text-green-700 border border-green-200 cursor-default'
              : 'bg-primary text-white hover:bg-primary-dark'
          }`}
        >
          <BookmarkIcon className="w-5 h-5" />
          {state.isAddedToActive ? 'Saved to Active Wizards' : 'Add to Active Wizards'}
        </button>
      </div>

      {/* Progress Steps */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-2">
          {STEPS.map((step, index) => {
            const status = getStepStatus(step.id);
            const Icon = step.icon;
            const isClickable = status === 'complete' || status === 'current';

            return (
              <div key={step.id}>
                <button
                  onClick={() => handleStepClick(step.id)}
                  disabled={!isClickable}
                  className={`progress-step w-full text-left ${
                    status === 'complete'
                      ? 'progress-step-complete cursor-pointer'
                      : status === 'current'
                      ? 'progress-step-current'
                      : 'progress-step-upcoming cursor-not-allowed opacity-50'
                  }`}
                >
                  <div className="flex-shrink-0">
                    {status === 'complete' ? (
                      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                        <CheckIcon className="w-5 h-5 text-white" />
                      </div>
                    ) : (
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          status === 'current'
                            ? 'bg-white bg-opacity-20'
                            : 'bg-gray-200'
                        }`}
                      >
                        <Icon
                          className={`w-5 h-5 ${
                            status === 'current' ? 'text-white' : 'text-gray-500'
                          }`}
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{step.title}</p>
                    <p
                      className={`text-xs mt-0.5 ${
                        status === 'current' ? 'text-white text-opacity-90' : ''
                      }`}
                    >
                      {status === 'complete'
                        ? 'Completed'
                        : status === 'current'
                        ? 'In Progress'
                        : 'Upcoming'}
                    </p>
                  </div>
                </button>

                {/* Connector Line */}
                {index < STEPS.length - 1 && (
                  <div className="flex justify-start pl-4 py-1">
                    <div
                      className={`w-0.5 h-6 ${
                        state.completedSteps.includes(step.id)
                          ? 'bg-primary'
                          : 'bg-gray-200'
                      }`}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Progress Summary */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
          <span>Progress</span>
          <span className="font-medium">
            {state.completedSteps.length} of {STEPS.length - 1}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{
              width: `${(state.completedSteps.length / (STEPS.length - 1)) * 100}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
