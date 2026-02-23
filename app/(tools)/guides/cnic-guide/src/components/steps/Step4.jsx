import React, { useState, useEffect } from 'react';
import { useWizard } from '../../context/WizardContext';
import { ClockIcon, CloseIcon, CheckIcon, DownloadIcon, UploadIcon } from '../Icons';

// Generate roadmap based on user selections
function generateRoadmap(personType, documentNeed) {
  const stations = [];

  // Station 1: Gather Documents
  stations.push({
    id: 'gather',
    title: 'Gather Documents',
    estimatedDays: documentNeed === 'new' ? 3 : documentNeed === 'correction' ? 5 : 1,
    tasks: [
      'Parent CNIC/NICOP copies (front and back)',
      'Applicant CNIC/Passport (if adult)',
      'Hospital birth slip or vaccination card (if available)',
      'Proof of residence',
      'Recent passport-size photographs (2)',
    ],
  });

  // Station 2: Visit Union Council
  stations.push({
    id: 'visit',
    title: 'Visit Union Council',
    estimatedDays: 1,
    tasks: [
      'Fill application form at office',
      'Submit all required documents',
      'Pay registration fee',
      'Collect receipt with tracking number',
    ],
  });

  // Station 3: Processing
  stations.push({
    id: 'processing',
    title: 'Processing',
    estimatedDays: documentNeed === 'new' ? 5 : documentNeed === 'correction' ? 7 : 3,
    tasks: [
      'Union Council verifies documents',
      'NADRA database registration (if applicable)',
      'Certificate printing and signing',
    ],
  });

  // Station 4: Collect Certificate
  stations.push({
    id: 'collect',
    title: 'Collect Certificate',
    estimatedDays: 1,
    tasks: [
      'Return to Union Council with receipt',
      'Verify all information is correct',
      'Collect original certificate',
    ],
  });

  // Station 5: MOFA Attestation
  stations.push({
    id: 'mofa',
    title: 'MOFA Attestation',
    estimatedDays: 10,
    tasks: [
      'Submit to Ministry of Foreign Affairs or camp office',
      'Pay attestation fee',
      'Collect attested certificate',
    ],
  });

  // Station 6: Translation (if needed)
  if (documentNeed === 'new' || documentNeed === 'correction') {
    stations.push({
      id: 'translation',
      title: 'Certified Translation',
      estimatedDays: 3,
      tasks: [
        'Get English translation from certified translator',
        'Include translator certification statement',
      ],
    });
  }

  return stations;
}

function generateChecklist(personType, documentNeed) {
  const items = [];

  // Parent documents
  items.push({
    id: 'parent-cnic',
    title: 'Parent CNIC/NICOP Copies',
    description: 'Clear, legible copies of both parents (front and back)',
    required: true,
    completed: false,
    notes: '',
  });

  // Birth proof
  items.push({
    id: 'birth-proof',
    title: 'Proof of Birth',
    description: 'Hospital slip, vaccination card, or affidavit',
    required: documentNeed === 'new',
    completed: false,
    notes: '',
  });

  // Applicant ID (for adults)
  if (personType === 'adult' || personType === 'senior') {
    items.push({
      id: 'applicant-id',
      title: 'Applicant CNIC/Passport',
      description: 'Valid identification document',
      required: true,
      completed: false,
      notes: '',
    });
  }

  // Residence proof
  items.push({
    id: 'residence',
    title: 'Proof of Residence',
    description: 'Utility bill, rental agreement, or property documents',
    required: true,
    completed: false,
    notes: '',
  });

  // Photographs
  items.push({
    id: 'photos',
    title: 'Passport-size Photographs',
    description: 'Recent photos (2 copies, white background)',
    required: true,
    completed: false,
    notes: '',
  });

  // Old certificate (for correction/replacement)
  if (documentNeed === 'correction' || documentNeed === 'replacement') {
    items.push({
      id: 'old-certificate',
      title: 'Original/Old Certificate',
      description: 'Existing birth certificate (if available)',
      required: documentNeed === 'correction',
      completed: false,
      notes: '',
    });
  }

  // Correction documents
  if (documentNeed === 'correction') {
    items.push({
      id: 'correction-proof',
      title: 'Correction Supporting Documents',
      description: 'Proof of correct information (e.g., passport, school certificate)',
      required: true,
      completed: false,
      notes: '',
    });
  }

  return items;
}

export default function Step4() {
  const { state, setRoadmap, setChecklist, setCurrentStep, updateChecklistItem } = useWizard();
  const [stations, setStations] = useState([]);
  const [checklist, setLocalChecklist] = useState([]);
  const [selectedStation, setSelectedStation] = useState(null);
  const [editingTime, setEditingTime] = useState(null);

  useEffect(() => {
    const roadmap = generateRoadmap(state.personType, state.documentNeed);
    const checklistItems = generateChecklist(state.personType, state.documentNeed);
    
    setStations(roadmap);
    setLocalChecklist(checklistItems);
    
    setRoadmap({ stations: roadmap, customTimes: {} });
    setChecklist(checklistItems);
  }, [state.personType, state.documentNeed]);

  const handleBack = () => {
    setCurrentStep(3);
  };

  const handleContinue = () => {
    setCurrentStep(5);
  };

  const handleChecklistToggle = (index) => {
    const updated = [...checklist];
    updated[index].completed = !updated[index].completed;
    setLocalChecklist(updated);
    setChecklist(updated);
    updateChecklistItem(index, { completed: updated[index].completed });
  };

  const handleNotesChange = (index, notes) => {
    const updated = [...checklist];
    updated[index].notes = notes;
    setLocalChecklist(updated);
    updateChecklistItem(index, { notes });
  };

  const totalDays = stations.reduce((sum, station) => sum + station.estimatedDays, 0);
  const completedCount = checklist.filter((item) => item.completed).length;

  return (
    <div className="max-w-5xl mx-auto animate-slide-in space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          Your Personalized Roadmap
        </h2>
        <p className="text-gray-600 text-lg">
          Estimated timeline: <span className="font-semibold text-primary">{totalDays} days</span>
        </p>
      </div>

      {/* Metro Roadmap */}
      <div className="card overflow-x-auto">
        <div className="flex items-center gap-4 pb-6 min-w-max">
          {stations.map((station, index) => (
            <React.Fragment key={station.id}>
              <button
                onClick={() => setSelectedStation(station)}
                className="flex-shrink-0 text-center group"
              >
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white font-bold text-lg mb-2 group-hover:scale-110 transition-transform shadow-md">
                  {index + 1}
                </div>
                <div className="text-sm font-medium text-gray-900 max-w-[120px]">
                  {station.title}
                </div>
                <div className="text-xs text-gray-500 mt-1 flex items-center justify-center gap-1">
                  <ClockIcon className="w-3 h-3" />
                  {station.estimatedDays}d
                </div>
              </button>
              {index < stations.length - 1 && (
                <div className="flex-shrink-0 w-12 h-0.5 bg-primary mt-6" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Document Checklist */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900">
            Required Documents ({completedCount}/{checklist.length})
          </h3>
          <button
            onClick={() => window.print()}
            className="btn btn-outline flex items-center gap-2"
          >
            <DownloadIcon className="w-5 h-5" />
            Print Checklist
          </button>
        </div>

        <div className="space-y-4">
          {checklist.map((item, index) => (
            <div key={item.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={item.completed}
                  onChange={() => handleChecklistToggle(index)}
                  className="checkbox mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-gray-900">{item.title}</h4>
                    {item.required && (
                      <span className="badge badge-warning text-xs">Required</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                  <input
                    type="text"
                    placeholder="Add notes..."
                    value={item.notes}
                    onChange={(e) => handleNotesChange(index, e.target.value)}
                    className="input text-sm"
                  />
                </div>
                <button className="btn btn-outline text-sm px-3 py-1.5 flex items-center gap-2">
                  <UploadIcon className="w-4 h-4" />
                  Upload
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <button onClick={handleBack} className="btn btn-secondary">
          ← Back
        </button>
        <div className="text-sm text-gray-500">Step 4 of 7</div>
        <button onClick={handleContinue} className="btn btn-primary">
          Continue →
        </button>
      </div>

      {/* Station Detail Modal */}
      {selectedStation && (
        <div className="modal-overlay animate-fade-in" onClick={() => setSelectedStation(null)}>
          <div
            className="modal-content max-w-md animate-slide-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">
                  {selectedStation.title}
                </h3>
                <button
                  onClick={() => setSelectedStation(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <CloseIcon className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="mb-4">
                <div className="flex items-center gap-2 text-gray-600 mb-4">
                  <ClockIcon className="w-5 h-5" />
                  <span className="font-medium">Estimated: {selectedStation.estimatedDays} days</span>
                </div>

                <h4 className="font-medium text-gray-900 mb-2">Tasks:</h4>
                <ul className="space-y-2">
                  {selectedStation.tasks.map((task, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                      <CheckIcon className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      <span>{task}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => setSelectedStation(null)}
                className="btn btn-primary w-full"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
