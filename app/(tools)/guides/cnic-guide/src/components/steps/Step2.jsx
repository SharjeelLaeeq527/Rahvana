import React from 'react';
import { useWizard } from "../../context/WizardContext";
import { DocumentIcon, EditIcon, RefreshIcon, QuestionIcon } from "../Icons";

const DOCUMENT_NEEDS = [
  {
    id: 'new',
    title: 'New Certificate',
    description: 'First-time birth certificate registration',
    icon: DocumentIcon,
    color: 'from-green-50 to-green-100',
  },
  {
    id: 'correction',
    title: 'Correction Needed',
    description: 'Fix errors in existing certificate',
    icon: EditIcon,
    color: 'from-orange-50 to-orange-100',
  },
  {
    id: 'replacement',
    title: 'Replacement',
    description: 'Lost or damaged certificate',
    icon: RefreshIcon,
    color: 'from-blue-50 to-blue-100',
  },
  {
    id: 'unsure',
    title: 'Not Sure',
    description: 'Need guidance on what to do',
    icon: QuestionIcon,
    color: 'from-purple-50 to-purple-100',
  },
];

export default function Step2() {
  const { state, setDocumentNeed, setCurrentStep } = useWizard();

  const handleSelect = (needId) => {
    setDocumentNeed(needId);
    setTimeout(() => setCurrentStep(3), 300);
  };

  const handleBack = () => {
    setCurrentStep(1);
  };

  return (
    <div className="max-w-4xl mx-auto animate-slide-in">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          What brings you here?
        </h2>
        <p className="text-gray-600 text-lg">
          Understanding your specific need helps us provide the most relevant guidance.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {DOCUMENT_NEEDS.map((need) => {
          const Icon = need.icon;
          const isSelected = state.documentNeed === need.id;

          return (
            <button
              key={need.id}
              onClick={() => handleSelect(need.id)}
              className={`card card-hover text-left ${
                isSelected ? 'card-selected' : ''
              }`}
            >
              <div className={`w-full h-32 bg-gradient-to-br ${need.color} rounded-lg mb-4 flex items-center justify-center`}>
                <Icon className="w-14 h-14 text-gray-700" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {need.title}
              </h3>
              <p className="text-gray-600">{need.description}</p>
            </button>
          );
        })}
      </div>

      <div className="mt-8 flex justify-between items-center">
        <button onClick={handleBack} className="btn btn-secondary">
          ← Back
        </button>
        <div className="text-sm text-gray-500">
          Step 2 of 7
        </div>
      </div>
    </div>
  );
}
