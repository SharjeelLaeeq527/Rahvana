import React from 'react';
import { useWizard } from "../../context/WizardContext";
import { UserIcon, ChildIcon, SeniorIcon } from '../Icons';

const PERSON_TYPES = [
  {
    id: 'adult',
    title: 'Adult',
    description: 'Ages 18-60',
    icon: UserIcon,
    color: 'from-blue-50 to-blue-100',
  },
  {
    id: 'child',
    title: 'Child / Minor',
    description: 'Under 18 years',
    icon: ChildIcon,
    color: 'from-purple-50 to-purple-100',
  },
  {
    id: 'senior',
    title: 'Senior',
    description: 'Over 60 years',
    icon: SeniorIcon,
    color: 'from-green-50 to-green-100',
  },
];

export default function Step1() {
  const { state, setPersonType, setCurrentStep } = useWizard();

  const handleSelect = (typeId) => {
    setPersonType(typeId);
    setTimeout(() => setCurrentStep(2), 300);
  };

  return (
    <div className="max-w-4xl mx-auto animate-slide-in">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          Who is this certificate for?
        </h2>
        <p className="text-gray-600 text-lg">
          This helps us tailor the requirements and process to your specific situation.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PERSON_TYPES.map((type) => {
          const Icon = type.icon;
          const isSelected = state.personType === type.id;

          return (
            <button
              key={type.id}
              onClick={() => handleSelect(type.id)}
              className={`card card-hover text-left ${
                isSelected ? 'card-selected' : ''
              }`}
            >
              <div className={`w-full h-32 bg-gradient-to-br ${type.color} rounded-lg mb-4 flex items-center justify-center`}>
                <Icon className="w-16 h-16 text-gray-700" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {type.title}
              </h3>
              <p className="text-gray-600">{type.description}</p>
            </button>
          );
        })}
      </div>

      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-900">
          <span className="font-medium">Note:</span> Age categories affect document
          requirements and processing procedures. Select the category that best matches
          the person for whom you're obtaining the certificate.
        </p>
      </div>
    </div>
  );
}
