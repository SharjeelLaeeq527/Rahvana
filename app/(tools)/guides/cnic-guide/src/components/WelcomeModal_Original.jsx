import React, { useState } from 'react';
import { useWizard } from '../context/WizardContext';
import { CloseIcon, InfoIcon, DocumentIcon } from './Icons';

export default function WelcomeModal() {
  const { showWelcomeModal, setShowWelcomeModal } = useWizard();
  const [dontShowAgain, setDontShowAgain] = useState(false);

  if (!showWelcomeModal) return null;

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem('dont_show_welcome', 'true');
    }
    setShowWelcomeModal(false);
  };

  return (
    <div className="modal-overlay animate-fade-in" onClick={handleClose}>
      <div
        className="modal-content animate-slide-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-8">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary-100 rounded-xl">
                <DocumentIcon className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Pakistan Birth Certificate Wizard
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Union Council • US Immigration Purpose
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close modal"
            >
              <CloseIcon className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="space-y-6">
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                What is a Union Council Birth Certificate?
              </h3>
              <p className="text-gray-700 leading-relaxed">
                A Union Council birth certificate is an official civil document issued by local
                Union Councils, Municipal Corporations, Cantonment Boards, or the Capital
                Development Authority (CDA) in Pakistan. It serves as primary evidence of birth
                and is required for US immigration processes (USCIS, NVC, and Embassy interviews).
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                How Rahvana Helps
              </h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Step-by-step guidance tailored to your specific situation</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Immigration-ready validation checklist to avoid rejections</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Personalized roadmap with realistic time estimates</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Office finder with jurisdiction information</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Document vault to organize your files</span>
                </li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Quick Instructions
              </h3>
              <ol className="space-y-2 text-gray-700">
                <li className="flex items-start gap-3">
                  <span className="font-semibold text-primary">1.</span>
                  <span>Answer a few questions about who needs the certificate</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="font-semibold text-primary">2.</span>
                  <span>Provide location details to find your Union Council</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="font-semibold text-primary">3.</span>
                  <span>Receive a custom roadmap and document checklist</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="font-semibold text-primary">4.</span>
                  <span>Validate your final certificate against immigration requirements</span>
                </li>
              </ol>
            </section>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <InfoIcon className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-900">
                  <p className="font-medium mb-1">Important Disclaimer</p>
                  <p>
                    This wizard provides general guidance based on publicly available information
                    and should not be considered legal advice. Requirements may vary by Union
                    Council and can change over time. Always verify current procedures with your
                    local office and consult an immigration attorney for specific legal guidance.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 flex items-center justify-between pt-6 border-t border-gray-200">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className="checkbox"
              />
              <span className="text-sm text-gray-700">Don't show this again</span>
            </label>
            <button onClick={handleClose} className="btn btn-primary">
              Get Started
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
