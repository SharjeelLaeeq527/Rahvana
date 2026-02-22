"use client";

import React, { useState } from "react";
import { useCnicWizard } from "../../CnicContext";
import { motion } from "framer-motion";
import { Upload, Check, ArrowLeft, ShieldCheck } from "lucide-react";

export default function ValidationStep() {
  const { setCurrentStep, resetWizard } = useCnicWizard();
  const [validationChecks, setValidationChecks] = useState<string[]>([]);
  const [uploadedFile, setUploadedFile] = useState(false);

  const onToggleCheck = (label: string) => {
    setValidationChecks((prev) =>
      prev.includes(label) ? prev.filter((t) => t !== label) : [...prev, label],
    );
  };

  const onUpload = () => setUploadedFile(true);

  const config = {
    title: "Application Validation Vault",
    description:
      "Verify critical prerequisites and ensure your documents meet standard requirements before processing.",
    upload_section: {
      title: "Upload Application Scans",
      description: "Securely upload your form or document scans for tracking.",
      formats: "PDF, JPG, PNG (Max 5MB)",
    },
    checklist_title: "Pre-Submission Checklist",
    categories: [
      {
        name: "Document Readiness",
        items: [
          {
            label: "Original B-Form / CRC or old CNIC is ready",
            critical: true,
          },
          { label: "Biometric verification documents present", critical: true },
        ],
      },
      {
        name: "Form Validation",
        items: [
          { label: "Applicant's name & details spell-checked", critical: true },
          {
            label: "Attestation by a Grade-16+ officer included (if required)",
            critical: true,
          },
        ],
      },
      {
        name: "Payment Preparation",
        items: [
          {
            label:
              "Processing fee available based on selection (Normal/Urgent/Executive)",
            critical: false,
          },
        ],
      },
    ],
  };

  const totalItems = config.categories.reduce(
    (acc, cat) => acc + cat.items.length,
    0,
  );
  const checkedCount = validationChecks.length;
  const criticalTotal = config.categories.reduce(
    (acc, cat) => acc + cat.items.filter((item) => item.critical).length,
    0,
  );
  const criticalChecked = config.categories.reduce(
    (acc, cat) =>
      acc +
      cat.items.filter(
        (item) => item.critical && validationChecks.includes(item.label),
      ).length,
    0,
  );

  const criticalRemaining = criticalTotal - criticalChecked;

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="font-sans"
      >
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary font-medium text-sm mb-4">
            <ShieldCheck className="w-4 h-4" />
            Step 4 of 4
          </div>
          <h2 className="text-[1.75rem] font-extrabold text-slate-900 mb-2">
            {config.title}
          </h2>
          <p className="text-sm text-slate-500">{config.description}</p>
        </div>

        {/* Upload Section */}
        <div className="p-6 rounded-xl border border-slate-200 bg-white mb-8 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-4">
            {config.upload_section.title}
          </h3>

          <div className="p-8 rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center gap-3 text-center">
            <Upload
              className={`w-8 h-8 ${
                uploadedFile ? "text-emerald-700" : "text-slate-400"
              }`}
            />

            <p className="text-sm text-slate-500">
              {config.upload_section.description}
            </p>

            <p className="text-xs text-slate-400">
              Accepted formats: {config.upload_section.formats}
            </p>

            <motion.button
              whileHover={{ scale: uploadedFile ? 1 : 1.03 }}
              whileTap={{ scale: uploadedFile ? 1 : 0.97 }}
              onClick={!uploadedFile ? onUpload : undefined}
              disabled={uploadedFile}
              className={`px-6 py-2 mt-2 rounded-lg text-sm font-semibold text-white shadow-md transition
                ${
                  uploadedFile
                    ? "bg-emerald-700 cursor-default opacity-90"
                    : "bg-linear-to-r from-emerald-700 to-emerald-600 hover:shadow-lg"
                }
              `}
            >
              {uploadedFile ? "✓ Uploaded" : "Upload to Vault"}
            </motion.button>
          </div>
        </div>

        {/* Checklist Header */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-slate-900">
            {config.checklist_title} ({checkedCount}/{totalItems})
          </h3>

          {criticalRemaining > 0 && (
            <span className="px-3 py-1 rounded-md bg-red-100 text-red-600 text-xs font-semibold">
              {criticalRemaining} Critical Issues
            </span>
          )}
        </div>

        {/* Categories */}
        {config.categories.map((category, ci) => (
          <div key={ci} className="mb-6">
            {/* Category Header */}
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-emerald-700" />
              <h4 className="text-sm font-bold text-slate-800">
                {category.name}
              </h4>
            </div>

            {/* Items */}
            <div className="flex flex-col gap-2 pl-4">
              {category.items.map((item) => {
                const isChecked = validationChecks.includes(item.label);

                return (
                  <motion.div
                    key={item.label}
                    whileHover={{ x: 2 }}
                    onClick={() => onToggleCheck(item.label)}
                    role="checkbox"
                    aria-checked={isChecked}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        onToggleCheck(item.label);
                      }
                    }}
                    className={`flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition
                      ${isChecked ? "bg-emerald-50" : "hover:bg-slate-50"}
                    `}
                  >
                    {/* Checkbox */}
                    <div
                      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition shrink-0
                        ${
                          isChecked
                            ? "bg-emerald-700 border-emerald-700"
                            : "border-slate-300 bg-white"
                        }
                      `}
                    >
                      {isChecked && <Check className="w-3 h-3 text-white" />}
                    </div>

                    {/* Label */}
                    <span
                      className={`text-sm flex-1 transition
                        ${
                          isChecked
                            ? "text-slate-400 line-through"
                            : "text-slate-800"
                        }
                      `}
                    >
                      {item.label}
                    </span>

                    {/* Critical Badge */}
                    {item.critical && (
                      <span
                        className={`text-xs font-semibold shrink-0
                          ${isChecked ? "text-emerald-700" : "text-red-600"}
                        `}
                      >
                        {isChecked ? "✓ Verified" : "Critical"}
                      </span>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}
      </motion.div>

      {/* Navigation */}
      <div className="mt-10 flex justify-between items-center pt-6 border-t border-slate-100">
        <button
          onClick={() => setCurrentStep(3)}
          className="text-slate-500 hover:text-slate-800 font-medium px-4 py-2 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <button
          onClick={resetWizard}
          className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-lg font-medium transition-colors shadow-md"
        >
          Finish Guide
        </button>
      </div>
    </div>
  );
}
