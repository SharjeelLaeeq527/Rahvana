"use client";

import React, { useState } from "react";
import { useCnicWizard } from "../../CnicContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  Download,
  Upload,
  X,
  Check,
  ArrowRight,
  ArrowLeft,
  ChevronDown,
} from "lucide-react";

export default function RoadmapStep() {
  const { state, setCurrentStep, completeStep } = useCnicWizard();
  const [activePhase, setActivePhase] = useState<number | null>(1);

  const [checkedDocs, setCheckedDocs] = useState<string[]>([]);
  const [isDocsOpen, setIsDocsOpen] = useState(false);

  const toggleDoc = (title: string) => {
    setCheckedDocs((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title],
    );
  };

  const isOnline = state.applicationMethod === "online";
  const isSpecial = state.personType === "special";
  const isNew = state.applicationType === "new";
  const isCorrection = state.applicationType === "correction";
  const isReplacement = state.applicationType === "replacement";

  // Dynamic Process Phases
  const phases = isOnline
    ? [
        {
          id: 1,
          title: "Download App",
          duration: "5 mins",
          description:
            "Download the PakID app on your smartphone and register an account using your mobile number and email address.",
        },
        {
          id: 2,
          title: "Details & Biometrics",
          duration: "15 mins",
          description: (
            <ul className="list-disc pl-5 space-y-1">
              <li>On “Home” page, go to “ID Documents” and select “ID Card”</li>
              <li>Choose select “My Blood Relatives” category</li>
              <li>Select “Modification” category</li>
              <li>Capture applicant&apos;s Photograph &amp; Fingerprints.</li>
              <li>Enter the personal details</li>
              <li>Upload documents, if required</li>
              <li>Review and verify information</li>
            </ul>
          ),
        },
        {
          id: 3,
          title: "Payment & Submit",
          duration: "5 mins",
          description: (
            <ul className="list-disc pl-5 space-y-1">
              <li>Biometric Verification (anyone of parents or sibling).</li>
              <li>Photographs and fingerprints are mandatory</li>
              <li>Your data will be entered and reviewed.</li>
              <li>
                Attestation by anyone of the parents or siblings or by Gazetted
                officer
              </li>
              <li>Interview by OIC</li>
              <li>
                Fee submission (Executive Rs 2500) &amp; (Urgent Rs 1500) &amp;
                (Normal Rs 750) excluding delivery fee
              </li>
              <li>
                CNIC will be printed and handed over upon completion of the
                processing period against the specific category
              </li>
            </ul>
          ),
        },
      ]
    : [
        {
          id: 1,
          title: "Token & Waiting",
          duration: "Varies",
          description:
            "Visit your nearest NADRA Registration Center, get a queue token, and wait for your turn. Visit early morning to avoid rush.",
        },
        {
          id: 2,
          title: "Data Entry & Biometrics",
          duration: "15 mins",
          description:
            "Provide your original documents to the operator. They will capture your photograph, fingerprints, and digital signature.",
        },
        {
          id: 3,
          title: "Review & Receipt",
          duration: "5 mins",
          description:
            "Review the printed application form carefully. Sign it and collect your tracking receipt.",
        },
      ];

  // Dynamic Document Checklist
  let documents_checklist: {
    title: string;
    description: string;
    required: boolean;
  }[] = [];

  if (isNew) {
    if (isSpecial) {
      documents_checklist = [
        {
          title: "Birth Certificate",
          description: "Original birth certificate from Union Council.",
          required: true,
        },
        {
          title: "School Certificate",
          description:
            "If applicable, from your last attended educational institute.",
          required: true,
        },
        {
          title: "Affidavit",
          description:
            "Explaining your family status and why parents' CNICs are unavailable.",
          required: true,
        },
        {
          title: "Court Verification",
          description:
            "Legal proof of guardianship from a court or recognized institution.",
          required: true,
        },
        {
          title: "Police Verification",
          description: "Local clearance to verify your identity.",
          required: true,
        },
      ];
    } else {
      documents_checklist = [
        {
          title: "Original B-Form (CRC)",
          description:
            "Or original Birth Certificate. Without originals, application may be rejected.",
          required: true,
        },
        {
          title: "Parents' CNIC Copies",
          description:
            "Clear copies of at least one parent's CNIC (both is better).",
          required: true,
        },
        {
          title: "Proof of Residence",
          description: "Utility bill or domicile in your parent's/your name.",
          required: false,
        },
        {
          title: "Active Mobile Number",
          description: "For OTP verification and SMS tracking.",
          required: true,
        },
      ];
    }
  } else if (isCorrection) {
    documents_checklist = [
      {
        title: "Original Existing CNIC",
        description: "Your current CNIC card that needs correction.",
        required: true,
      },
      {
        title: "Proof of Modification",
        description:
          "E.g., Nikkah Nama for marital status, Matriculation transcript for DOB or spelling, Utility Bill for address change.",
        required: true,
      },
      {
        title: "Relative CNIC Copies",
        description:
          "Parents' or Spouse's CNIC copies if modifying family linkages.",
        required: false,
      },
    ];
  } else if (isReplacement) {
    documents_checklist = [
      {
        title: "Copy of Lost/Old CNIC",
        description:
          "If available, otherwise ensure you know your 13-digit CNIC number.",
        required: false,
      },
      {
        title: "Loss Report / FIR",
        description:
          "A non-cognizable (NC) report or FIR from local police station (rules vary, good to have).",
        required: false,
      },
      {
        title: "Original Secondary ID",
        description:
          "Passport or Domicile as secondary photo ID proof, if requested.",
        required: false,
      },
    ];
  }

  const handleNext = () => {
    completeStep(3);
    setCurrentStep(4);
  };

  const handleBack = () => {
    setCurrentStep(2);
  };

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Title */}
        <h2 className="text-[1.75rem] font-bold text-slate-900 mb-2 font-sans tracking-tight">
          Application Roadmap
        </h2>

        <p className="text-[0.95rem] mb-8 text-slate-600">
          <span className="text-slate-500">Estimated timeline: </span>
          <span className="text-primary font-bold">
            {isOnline ? "7-10 Days (Executive)" : "10-15 Days (Normal)"}
          </span>
        </p>

        {/* Timeline */}
        <div className="flex items-start justify-center gap-2 mb-10 p-6 rounded-2xl bg-slate-50 border border-slate-200">
          {phases.map((phase, i) => (
            <div key={phase.id} className="flex items-start gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() =>
                  setActivePhase(activePhase === phase.id ? null : phase.id)
                }
                className={`flex flex-col items-center gap-2 p-2 rounded-xl cursor-pointer focus:outline-none transition-all duration-300 ${
                  activePhase === phase.id
                    ? "opacity-100 scale-105"
                    : "opacity-60 hover:opacity-100"
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center font-extrabold text-[1.1rem] transition-all duration-300 ${
                    activePhase === phase.id
                      ? "bg-primary text-white shadow-lg shadow-primary/40 ring-4 ring-primary/20"
                      : "bg-slate-200 text-slate-500 border-2 border-slate-300"
                  }`}
                >
                  {phase.id}
                </div>

                <span
                  className={`text-[0.8rem] font-bold text-center max-w-22 leading-tight ${
                    activePhase === phase.id ? "text-primary" : "text-slate-800"
                  }`}
                >
                  {phase.title}
                </span>

                <span
                  className={`flex items-center gap-1 text-[0.72rem] ${
                    activePhase === phase.id
                      ? "text-primary/80 font-medium"
                      : "text-slate-500"
                  }`}
                >
                  <Clock className="w-3 h-3" />
                  {phase.duration}
                </span>
              </motion.button>

              {i < phases.length - 1 && (
                <div className="w-10 h-0.5 bg-primary mt-6 opacity-30" />
              )}
            </div>
          ))}
        </div>

        {/* Phase Detail */}
        <AnimatePresence>
          {activePhase !== null && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 overflow-hidden"
            >
              <div className="p-5 rounded-xl bg-primary/5 border border-primary/20">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-[1rem] font-bold text-primary">
                    Phase {activePhase}: {phases[activePhase - 1]?.title}
                  </h4>

                  <button
                    onClick={() => setActivePhase(null)}
                    className="text-slate-500 hover:text-slate-800 transition-colors focus:outline-none"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="text-[0.875rem] text-slate-700 leading-relaxed">
                  {phases[activePhase - 1]?.description}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Checklist Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 mt-10">
          <div
            className="cursor-pointer group flex-1"
            onClick={() => setIsDocsOpen(!isDocsOpen)}
          >
            <h3 className="text-[1.15rem] font-bold text-slate-900 group-hover:text-primary transition-colors flex items-center gap-2">
              Required Documents ({checkedDocs.length}/
              {documents_checklist.length})
              <ChevronDown
                className={`w-5 h-5 transition-transform duration-300 ${
                  isDocsOpen ? "rotate-180" : ""
                }`}
              />
            </h3>
            {!isDocsOpen && (
              <p className="text-[0.85rem] text-slate-500 mt-0.5">
                Click to see the required documents
              </p>
            )}
          </div>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg border-[1.5px] border-primary text-primary text-[0.85rem] font-semibold hover:bg-primary/5 transition-colors focus:outline-none shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            Print Checklist
          </motion.button>
        </div>

        {/* Checklist Items */}
        <AnimatePresence>
          {isDocsOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="flex flex-col gap-3 pb-4">
                {documents_checklist.map((doc, idx) => {
                  const isChecked = checkedDocs.includes(doc.title);

                  return (
                    <motion.div
                      key={idx}
                      whileHover={{ y: -1 }}
                      onClick={() => toggleDoc(doc.title)}
                      className={`p-4 rounded-xl flex items-center justify-between transition-all cursor-pointer ${
                        isChecked
                          ? "bg-primary/5 border border-primary/30"
                          : "bg-white border border-slate-200 shadow-sm hover:shadow-md"
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        {/* Checkbox */}
                        <div
                          className={`w-5.5 h-5.5 rounded-[6px] flex items-center justify-center shrink-0 transition-all ${
                            isChecked
                              ? "bg-primary border-2 border-primary"
                              : "bg-white border-2 border-slate-300"
                          }`}
                        >
                          {isChecked && (
                            <Check className="w-3.5 h-3.5 text-white" />
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[0.9rem] font-bold text-slate-800 ${
                                isChecked ? "line-through opacity-70" : ""
                              }`}
                            >
                              {doc.title}
                            </span>

                            {doc.required && (
                              <span className="px-2 py-px rounded-md bg-rose-50 text-rose-600 text-[0.7rem] font-bold uppercase tracking-wider">
                                Required
                              </span>
                            )}
                          </div>

                          <p
                            className={`text-[0.8rem] text-slate-500 mt-0.5 ${isChecked ? "opacity-70" : ""}`}
                          >
                            {doc.description}
                          </p>
                        </div>
                      </div>

                      {isOnline && (
                        <button
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-primary text-primary text-[0.8rem] font-semibold hover:bg-primary/5 transition-colors shrink-0"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          Upload
                        </button>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Navigation */}
      <div className="mt-8 flex justify-between items-center pt-6 border-t border-slate-100">
        <button
          onClick={handleBack}
          className="text-slate-500 hover:text-slate-800 font-medium px-4 py-2 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <div className="flex items-center gap-4">
          <div className="text-sm font-bold text-slate-400 uppercase tracking-widest hidden sm:block">
            Step 3 of 4
          </div>
          <button
            onClick={handleNext}
            className="bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-lg font-medium transition-colors shadow-md shadow-primary/20 flex items-center gap-2"
          >
            Next
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
