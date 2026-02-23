"use client";

import { motion } from "framer-motion";
import { Upload, Check } from "lucide-react";
import guideData from "@/data/nikah-nama-guide-data.json";

interface ValidationStepProps {
  validationChecks: string[];
  onToggleCheck: (label: string) => void;
  uploadedFile: boolean;
  onUpload: () => void;
}

const ValidationStep = ({
  validationChecks,
  onToggleCheck,
  uploadedFile,
  onUpload,
}: ValidationStepProps) => {
  const { title, description, upload_section, checklist_title, categories } =
    guideData.wizard.validation;

  const totalItems = categories.reduce((acc: any, cat: any) => acc + cat.items.length, 0);

  const checkedCount = validationChecks.length;

  const criticalTotal = categories.reduce(
    (acc: any, cat: any) => acc + cat.items.filter((item: any) => item.critical).length,
    0,
  );

  const criticalChecked = categories.reduce(
    (acc: any, cat: any) =>
      acc +
      cat.items.filter(
        (item: any) => item.critical && validationChecks.includes(item.label),
      ).length,
    0,
  );

  const criticalRemaining = criticalTotal - criticalChecked;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="font-sans"
    >
      <h2 className="text-[1.75rem] font-extrabold text-slate-900 mb-2 font-['Plus_Jakarta_Sans','Inter',system-ui,sans-serif]">
        {title}
      </h2>

      <p className="text-sm text-slate-500 mb-8 font-['Plus_Jakarta_Sans','Inter',system-ui,sans-serif]">{description}</p>

      {/* Upload Section */}
      <div className="p-6 rounded-xl border border-slate-200 bg-white mb-8">
        <h3 className="text-lg font-bold text-slate-900 mb-4 font-['Plus_Jakarta_Sans','Inter',system-ui,sans-serif]">
          {upload_section.title}
        </h3>

        <div className="p-8 rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center gap-3 text-center">
          <Upload
            className={`w-8 h-8 ${
              uploadedFile ? "text-teal-700" : "text-slate-400"
            }`}
          />

          <p className="text-sm text-slate-500 font-['Plus_Jakarta_Sans',system-ui]">{upload_section.description}</p>

          <p className="text-xs text-slate-400">
            Accepted formats: {upload_section.formats}
          </p>

          <motion.button
            whileHover={{ scale: uploadedFile ? 1 : 1.03 }}
            whileTap={{ scale: uploadedFile ? 1 : 0.97 }}
            onClick={!uploadedFile ? onUpload : undefined}
            disabled={uploadedFile}
            className={`px-6 py-2 rounded-lg text-sm font-semibold text-white shadow-md transition font-['Plus_Jakarta_Sans',system-ui]
              ${
                uploadedFile
                  ? "bg-teal-700 cursor-default opacity-90"
                  : "bg-teal-600 hover:bg-teal-700 hover:shadow-lg"
              }
            `}
          >
            {uploadedFile ? "✓ Uploaded To Vault" : "Upload MRC to Vault"}
          </motion.button>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-slate-900 font-['Plus_Jakarta_Sans','Inter',system-ui,sans-serif]">
          {checklist_title} ({checkedCount}/{totalItems})
        </h3>

        {criticalRemaining > 0 && (
          <span className="px-3 py-1 rounded-md bg-red-100 text-red-600 text-xs font-bold uppercase tracking-wider">
            {criticalRemaining} CRITICAL ERRORS
          </span>
        )}
      </div>

      {categories.map((category: any, ci: any) => (
        <div key={ci} className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-teal-600" />
            <h4 className="text-sm font-bold text-slate-800 font-['Plus_Jakarta_Sans','Inter',system-ui,sans-serif]">
              {category.name}
            </h4>
          </div>

          <div className="flex flex-col gap-2 pl-4">
            {category.items.map((item: any, ii: any) => {
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
                    ${isChecked ? "bg-teal-50" : "hover:bg-slate-50"}
                  `}
                >
                  <div
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition
                      ${
                        isChecked
                          ? "bg-teal-600 border-teal-600"
                          : "border-slate-300 bg-white"
                      }
                    `}
                  >
                    {isChecked && <Check className="w-3 h-3 text-white" />}
                  </div>

                  <span
                    className={`text-sm flex-1 transition font-['Plus_Jakarta_Sans',system-ui]
                      ${
                        isChecked
                          ? "text-slate-400 line-through"
                          : "text-slate-800"
                      }
                    `}
                  >
                    {item.label}
                  </span>

                  {item.critical && (
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider font-['Plus_Jakarta_Sans',system-ui]
                        ${isChecked ? "text-teal-700" : "text-red-600"}
                      `}
                    >
                      {isChecked ? "✓" : "Critical"}
                    </span>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      ))}
    </motion.div>
  );
};

export default ValidationStep;
