"use client";

import React, { useState, useEffect } from "react";
import { usePolioWizard } from "../../PolioContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  Download,
  X,
  Check,
  ArrowRight,
  ArrowLeft,
  ChevronDown,
} from "lucide-react";

export default function RoadmapStep() {
  const { state, setCurrentStep, completeStep } = usePolioWizard();
  const [activePhase, setActivePhase] = useState<number | null>(1);

  const [checkedDocs, setCheckedDocs] = useState<string[]>([]);
  const [isDocsOpen, setIsDocsOpen] = useState(false);

  useEffect(() => {
    if (activePhase !== null) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [activePhase]);

  const toggleDoc = (title: string) => {
    setCheckedDocs((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title],
    );
  };

  const isChild = state.personType === "child";
  const isForeigner = state.personType === "foreigner";

  // Dynamic Process Phases
  const phases = [
    {
      id: 1,
      title: "Get Vaccinated",
      duration: "Day 1",
      description:
        "Visit your selected vaccination center. Provide your original ID and ensure the staff correctly enters your details into the NIMS system.",
    },
    {
      id: 2,
      title: "NIMS Entry",
      duration: "24 Hours",
      description:
        "Wait up to 24 hours for the vaccination record to reflect on the official NIMS portal. You can check your status online.",
    },
    {
      id: 3,
      title: "Download Online",
      duration: "Instant",
      description: (
        <div className="space-y-2">
          {/* <p>
            Pay the Rs. 100 processing fee on the NIMS portal securely and
            download your official Polio Vaccination Certificate PDF.
          </p> */}
          <ul className="list-disc pl-5 space-y-1">
            <li>
              Visit the official{" "}
              <a
                href="https://nims.nadra.gov.pk/nims/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline font-semibold"
              >
                NIMS website
              </a>{" "}
              and select &quot;Other Vaccination – Polio / Yellow Fever&quot;.
            </li>
            <li>
              Enter your{" "}
              <strong>
                {isChild
                  ? "B-Form / CRC Number"
                  : isForeigner
                    ? "Passport Number"
                    : "CNIC & Passport Number"}
              </strong>{" "}
              and <strong>Issue Date</strong> to retrieve your specific records.
            </li>
            <li>
              Verify your information, pay the one-time processing fee online (≈
              Rs. 100).
            </li>
            <li>
              Hit Download and save the PDF securely on your phone for easy
              access.
            </li>
          </ul>
        </div>
      ),
    },
  ];

  // Dynamic Document Checklist
  let documents_checklist: {
    title: string;
    description: string;
    required: boolean;
  }[] = [];

  if (isChild) {
    documents_checklist = [
      {
        title: "Original B-Form (CRC)",
        description:
          "Mandatory for minors. Ensure the B-Form number is correctly relayed to the operator.",
        required: true,
      },
      {
        title: "Parent's CNIC",
        description: "Original CNIC of the accompanying parent or guardian.",
        required: true,
      },
      {
        title: "Active Mobile Number",
        description: "Used for SMS verification and NIMS portal tracking.",
        required: true,
      },
      {
        title: "Passport Copy",
        description: "Important if the child is traveling abroad.",
        required: false,
      },
    ];
  } else if (isForeigner) {
    documents_checklist = [
      {
        title: "Original Passport",
        description:
          "Primary identification document. The passport number is used for NIMS entry.",
        required: true,
      },
      {
        title: "Valid Visa Copy",
        description: "Proof of legal stay in Pakistan.",
        required: true,
      },
      {
        title: "Active Mobile Number",
        description: "Used for SMS verification and NIMS portal tracking.",
        required: true,
      },
    ];
  } else {
    documents_checklist = [
      {
        title: "Original CNIC",
        description: "Your 13-digit Computerized National Identity Card.",
        required: true,
      },
      {
        title: "Original Passport",
        description:
          "Mandatory if you are traveling abroad; ensures the certificate is linked to your passport.",
        required: true,
      },
      {
        title: "Active Mobile Number",
        description: "Used for SMS verification and NIMS portal tracking.",
        required: true,
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
          <span className="text-primary font-bold">1 - 2 Days</span>
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

                <p className="text-[0.875rem] text-slate-700 leading-relaxed">
                  {phases[activePhase - 1]?.description}
                </p>
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
            <p className="text-[0.85rem] text-slate-500 mt-0.5">
              Click to see the required documents
            </p>
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
