import React, { useState } from 'react';
import { useWizard } from '../context/WizardContext';
import { ChatIcon, CloseIcon, UploadIcon } from './Icons';

const STEPS = [
  'Welcome',
  'Who is this for?',
  'Document need',
  'Location',
  'Roadmap',
  'Office finder',
  'Validation',
];

export default function FeedbackButton() {
  const { state } = useWizard();
  const [isOpen, setIsOpen] = useState(false);
  const [feedback, setFeedback] = useState({
    category: '',
    step: STEPS[state.currentStep] || '',
    description: '',
    attachments: [],
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();

    // Store feedback locally (in production, this would be sent to a server)
    const existingFeedback = JSON.parse(localStorage.getItem('wizard_feedback') || '[]');
    const newFeedback = {
      ...feedback,
      timestamp: new Date().toISOString(),
      wizardState: state,
    };
    localStorage.setItem(
      'wizard_feedback',
      JSON.stringify([...existingFeedback, newFeedback])
    );

    setSubmitted(true);
    setTimeout(() => {
      setIsOpen(false);
      setSubmitted(false);
      setFeedback({
        category: '',
        step: STEPS[state.currentStep] || '',
        description: '',
        attachments: [],
      });
    }, 2000);
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setFeedback((prev) => ({
      ...prev,
      attachments: [...prev.attachments, ...files],
    }));
  };

  return (
    <>
      {/* Sticky Feedback Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 bg-primary text-white px-5 py-3 rounded-full shadow-lg hover:bg-primary-dark transition-all duration-200 hover:scale-[1.03] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
        aria-label="Provide feedback"
      >
        <ChatIcon className="w-5 h-5" />
        <span className="text-sm font-semibold tracking-wide">Provide feedback</span>
      </button>

      {/* Feedback Modal */}
      {isOpen && (
        <div className="modal-overlay animate-fade-in z-50" onClick={() => setIsOpen(false)}>
          <div
            className="modal-content max-w-lg animate-slide-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Send Feedback</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <CloseIcon className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {submitted ? (
                <div className="py-12 text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-8 h-8 text-green-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">
                    Thank you for your feedback!
                  </h4>
                  <p className="text-gray-600">
                    Your input helps us improve the wizard experience.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Category */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Feedback Type
                    </label>
                    <select
                      value={feedback.category}
                      onChange={(e) =>
                        setFeedback((prev) => ({ ...prev, category: e.target.value }))
                      }
                      className="input"
                      required
                    >
                      <option value="">Select a category</option>
                      <option value="Incorrect info">Incorrect information</option>
                      <option value="UI/UX issue">UI/UX issue</option>
                      <option value="Bug">Bug / Something broken</option>
                      <option value="Suggestion">Suggestion / Improvement</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {/* Step */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Where did this happen?
                    </label>
                    <select
                      value={feedback.step}
                      onChange={(e) =>
                        setFeedback((prev) => ({ ...prev, step: e.target.value }))
                      }
                      className="input"
                    >
                      {STEPS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={feedback.description}
                      onChange={(e) =>
                        setFeedback((prev) => ({ ...prev, description: e.target.value }))
                      }
                      className="input min-h-[120px]"
                      placeholder="Please describe your feedback in detail..."
                      required
                    />
                  </div>

                  {/* Attachments */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Attachments (optional)
                    </label>

                    <div className="flex items-center gap-3">
                      <input
                        id="feedback-files"
                        type="file"
                        multiple
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <label htmlFor="feedback-files" className="cursor-pointer">
                        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors text-sm font-medium text-gray-800">
                          <UploadIcon className="w-4 h-4" />
                          Add files
                        </span>
                      </label>
                      <span className="text-xs text-gray-500">
                        Screenshots help a lot.
                      </span>
                    </div>

                    {feedback.attachments.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {feedback.attachments.map((file, idx) => (
                          <div
                            key={`${file.name}-${idx}`}
                            className="text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2"
                          >
                            {file.name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="pt-2 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsOpen(false)}
                      className="btn btn-secondary"
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                      Submit Feedback
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}