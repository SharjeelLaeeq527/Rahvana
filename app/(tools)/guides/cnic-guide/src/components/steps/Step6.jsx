import React, { useState } from 'react';
import { useWizard } from '../../context/WizardContext';
import { CheckIcon, AlertIcon, UploadIcon, DownloadIcon, EditIcon } from '../Icons';

const VALIDATION_CHECKLIST = [
  {
    id: 'spelling-name',
    category: 'Spelling & Name',
    item: 'Full name matches passport and other documents exactly',
    critical: true,
  },
  {
    id: 'spelling-parents',
    category: 'Spelling & Name',
    item: 'Parent names match their CNIC/NICOP exactly',
    critical: true,
  },
  {
    id: 'dob-format',
    category: 'Date of Birth',
    item: 'Date of birth is in correct format and matches other documents',
    critical: true,
  },
  {
    id: 'place-birth',
    category: 'Place of Birth',
    item: 'Place of birth is clearly stated with city/district',
    critical: false,
  },
  {
    id: 'registration-number',
    category: 'Registration Details',
    item: 'Registration number is visible and legible',
    critical: true,
  },
  {
    id: 'registration-date',
    category: 'Registration Details',
    item: 'Registration date is present',
    critical: false,
  },
  {
    id: 'signature-visible',
    category: 'Stamps & Signatures',
    item: 'Union Council Secretary signature is visible',
    critical: true,
  },
  {
    id: 'stamp-clear',
    category: 'Stamps & Signatures',
    item: 'Official stamp/seal is clear and legible',
    critical: true,
  },
  {
    id: 'letterhead',
    category: 'Format',
    item: 'Document is on official letterhead (not rupee paper)',
    critical: true,
  },
  {
    id: 'scan-quality',
    category: 'Scan Quality',
    item: 'Scan is clear, complete, and properly formatted',
    critical: true,
  },
  {
    id: 'no-tampering',
    category: 'Integrity',
    item: 'No visible signs of alteration or tampering',
    critical: true,
  },
  {
    id: 'mofa-attestation',
    category: 'Attestation',
    item: 'MOFA attestation is present (required for US immigration)',
    critical: true,
  },
];

export default function Step6() {
  const { state, setCurrentStep, addToDocumentVault } = useWizard();
  const [validationStatus, setValidationStatus] = useState({});
  const [hasIssues, setHasIssues] = useState(false);
  const [showCorrectionPlan, setShowCorrectionPlan] = useState(false);

  const handleToggle = (id) => {
    setValidationStatus((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleValidate = () => {
    const issues = VALIDATION_CHECKLIST.filter(
      (item) => item.critical && !validationStatus[item.id]
    );
    setHasIssues(issues.length > 0);
    if (issues.length > 0) {
      setShowCorrectionPlan(true);
    }
  };

  const handleUpload = () => {
    // Mock upload functionality
    const mockDocument = {
      id: Date.now(),
      name: 'birth-certificate.pdf',
      type: 'Birth Certificate',
      uploadedAt: new Date().toISOString(),
    };
    addToDocumentVault(mockDocument);
    alert('Document uploaded to vault successfully!');
  };

  const handleBack = () => {
    setCurrentStep(5);
  };

  const completedCount = Object.values(validationStatus).filter(Boolean).length;
  const totalCount = VALIDATION_CHECKLIST.length;
  const criticalIssues = VALIDATION_CHECKLIST.filter(
    (item) => item.critical && !validationStatus[item.id]
  ).length;

  const groupedChecklist = VALIDATION_CHECKLIST.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  return (
    <div className="max-w-4xl mx-auto animate-slide-in space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          Certificate Validation
        </h2>
        <p className="text-gray-600 text-lg">
          Ensure your birth certificate meets all US immigration requirements
        </p>
      </div>

      {/* Upload Section */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Upload Your Birth Certificate
        </h3>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary transition-colors">
          <UploadIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-700 mb-2">
            Upload your final birth certificate to Document Vault
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Accepted formats: PDF, JPG, PNG (Max 10MB)
          </p>
          <button onClick={handleUpload} className="btn btn-primary">
            Upload to Vault
          </button>
        </div>
      </div>

      {/* Validation Checklist */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            Immigration-Ready Validation ({completedCount}/{totalCount})
          </h3>
          {criticalIssues > 0 && (
            <span className="badge badge-warning">
              {criticalIssues} Critical Issues
            </span>
          )}
        </div>

        <div className="space-y-6">
          {Object.entries(groupedChecklist).map(([category, items]) => (
            <div key={category}>
              <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full" />
                {category}
              </h4>
              <div className="space-y-2 ml-4">
                {items.map((item) => (
                  <label
                    key={item.id}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={validationStatus[item.id] || false}
                      onChange={() => handleToggle(item.id)}
                      className="checkbox mt-0.5"
                    />
                    <div className="flex-1">
                      <span className="text-sm text-gray-700">{item.item}</span>
                      {item.critical && (
                        <span className="ml-2 text-xs text-red-600 font-medium">
                          (Critical)
                        </span>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <button
            onClick={handleValidate}
            className="btn btn-primary w-full flex items-center justify-center gap-2"
          >
            <CheckIcon className="w-5 h-5" />
            Validate Certificate
          </button>
        </div>
      </div>

      {/* Validation Results */}
      {hasIssues && showCorrectionPlan && (
        <div className="card bg-red-50 border-2 border-red-200">
          <div className="flex items-start gap-3 mb-4">
            <AlertIcon className="w-6 h-6 text-red-600 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-semibold text-red-900 mb-2">
                Certificate Has Issues
              </h3>
              <p className="text-red-800 mb-4">
                Your certificate has {criticalIssues} critical issue(s) that must be corrected
                before submission for US immigration. These issues will likely result in
                rejection or RFE (Request for Evidence).
              </p>
              <button
                onClick={() => {
                  // Reset to correction flow
                  setCurrentStep(2);
                  state.documentNeed = 'correction';
                }}
                className="btn bg-red-600 text-white hover:bg-red-700 flex items-center gap-2"
              >
                <EditIcon className="w-5 h-5" />
                Generate Correction Plan
              </button>
            </div>
          </div>
        </div>
      )}

      {!hasIssues && completedCount === totalCount && (
        <div className="card bg-green-50 border-2 border-green-200">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
              <CheckIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-green-900 mb-2">
                Certificate is Immigration-Ready!
              </h3>
              <p className="text-green-800 mb-4">
                Your birth certificate appears to meet all US immigration requirements. Make
                sure to bring the original certificate to your visa interview.
              </p>
              <div className="bg-white rounded-lg p-4 border border-green-200">
                <h4 className="font-medium text-gray-900 mb-2">Next Steps:</h4>
                <ol className="space-y-1 text-sm text-gray-700">
                  <li>1. Keep the original certificate in a safe place</li>
                  <li>2. Make certified copies for submission to NVC</li>
                  <li>3. Ensure certified English translation is included</li>
                  <li>4. Submit documents according to NVC instructions</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <button onClick={handleBack} className="btn btn-secondary">
          ← Back
        </button>
        <div className="text-sm text-gray-500">Step 6 of 7 (Final)</div>
        <button
          onClick={() => alert('Wizard completed! You can now close this window or start a new wizard.')}
          className="btn btn-primary"
        >
          Complete
        </button>
      </div>
    </div>
  );
}
