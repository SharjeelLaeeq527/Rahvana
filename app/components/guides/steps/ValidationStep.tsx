import { motion } from "framer-motion";
import { Upload, Check, ChevronDown } from "lucide-react";
import { useState } from "react";

interface ValidationCategory {
  name: string;
  items: { label: string; critical: boolean }[];
}

interface ValidationData {
  title: string;
  description: string;
  upload_section: {
    title: string;
    description: string;
    formats: string;
  };
  checklist_title: string;
  categories: ValidationCategory[];
}

interface ValidationStepProps {
  validationChecks: string[];
  onToggleCheck: (label: string) => void;
  uploadedFile: boolean;
  onUpload: () => void;
  data?: ValidationData;
}

const ValidationStep = ({
  validationChecks,
  onToggleCheck,
  uploadedFile,
  onUpload,
  data,
}: ValidationStepProps) => {
  const [showValidations, setShowValidations] = useState(false);

  const title = data?.title || "Certificate Validation";
  const description = data?.description || "";
  const uploadSection = data?.upload_section || {
    title: "",
    description: "",
    formats: "",
  };
  const checklistTitle = data?.checklist_title || "Validation";
  const categories = data?.categories || [];

  const totalItems = categories.reduce((acc, cat) => acc + cat.items.length, 0);
  const checkedCount = validationChecks.length;
  const criticalTotal = categories.reduce(
    (acc, cat) => acc + cat.items.filter((item) => item.critical).length,
    0,
  );
  const criticalChecked = categories.reduce(
    (acc, cat) =>
      acc +
      cat.items.filter(
        (item) => item.critical && validationChecks.includes(item.label),
      ).length,
    0,
  );
  const criticalRemaining = criticalTotal - criticalChecked;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      {/* Title & Description */}
      <h2
        className="text-[1.75rem] font-extrabold text-[hsl(220_20%_10%)]
                     mb-2 font-['Plus_Jakarta_Sans','Inter',system-ui,sans-serif]"
      >
        {title}
      </h2>
      <p className="text-[0.95rem] text-[hsl(215_16%_47%)] mb-8">
        {description}
      </p>

      {/* Upload Section */}
      <div className="p-6 rounded-xl border border-[hsl(214_32%_91%)] bg-white mb-8">
        <h3
          className="text-[1.1rem] font-bold text-[hsl(220_20%_10%)] mb-4
                       font-['Plus_Jakarta_Sans','Inter',system-ui,sans-serif]"
        >
          {uploadSection.title}
        </h3>

        <div className="flex flex-col items-center gap-3 p-8 rounded-lg border-2 border-dashed border-[hsl(214_32%_88%)] bg-[hsl(210_20%_99%)]">
          <Upload
            className={`w-8 h-8 ${uploadedFile ? "text-[hsl(168_80%_30%)]" : "text-[hsl(215_16%_70%)]"}`}
          />
          <p className="text-[0.9rem] text-[hsl(215_16%_47%)] text-center">
            {uploadSection.description}
          </p>
          <p className="text-[0.78rem] text-[hsl(215_16%_60%)]">
            Accepted formats: {uploadSection.formats}
          </p>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onUpload}
            className={`px-6 py-2 rounded-xl text-white text-[0.875rem] font-semibold
                        shadow-[0_2px_8px_hsl(168_80%_30%/0.3)]
                        ${
                          uploadedFile
                            ? "bg-[hsl(168_80%_30%)]"
                            : "bg-gradient-to-br from-[#14a0a6] to-[#0d7377]"
                        }`}
          >
            {uploadedFile ? "✓ Uploaded" : "Upload to Vault"}
          </motion.button>
        </div>
      </div>

      {/* Checklist Header */}
<div className="mb-4">
  <div className="flex justify-between items-center">
    <div className="flex">
      <div
        className="cursor-pointer group flex"
        onClick={() => setShowValidations(!showValidations)}
      >
        <h3 className="text-[1.15rem] font-bold text-[hsl(220_20%_10%)]">
          {checklistTitle} ({checkedCount}/{totalItems})
        </h3>
        <ChevronDown
          className={`w-5 h-5 transition-transform my-1 duration-300 ${
            showValidations ? "rotate-180" : ""
          }`}
        />
      </div>
      {criticalRemaining > 0 && (
        <span
          className="p-2 rounded-xl text-[10px] font-semibold
                           bg-[hsl(0_84%_95%)] text-[hsl(0_70%_50%)]"
        >
          {criticalRemaining} Critical Issues
        </span>
      )}
    </div>
  </div>
  {!showValidations && (
    <p className="text-[0.85rem] text-slate-500 mt-1">
      Click to see the required validations
    </p>
  )}
</div>

      {/* Checklist Categories */}
      {showValidations &&
        categories.map((category, ci) => (
          <div key={ci} className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-[hsl(168_80%_30%)]" />
              <h4 className="text-[0.95rem] font-bold text-[hsl(220_20%_15%)]">
                {category.name}
              </h4>
            </div>

            <div className="flex flex-col gap-2 pl-4">
              {category.items.map((item, ii) => {
                const isChecked = validationChecks.includes(item.label);
                return (
                  <motion.div
                    key={ii}
                    whileHover={{ x: 2 }}
                    onClick={() => onToggleCheck(item.label)}
                    className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer
                             transition-colors
                             ${isChecked ? "bg-[hsl(168_60%_98%)]" : "bg-transparent"}`}
                  >
                    {/* Checkbox */}
                    <div
                      className={`w-5 h-5 flex items-center justify-center rounded-md border-2
                                   ${
                                     isChecked
                                       ? "bg-[hsl(168_80%_30%)] border-[hsl(168_80%_30%)]"
                                       : "bg-white border-[hsl(214_32%_85%)]"
                                   }`}
                    >
                      {isChecked && (
                        <Check className="w-3.5 h-3.5 text-white" />
                      )}
                    </div>

                    {/* Label */}
                    <span
                      className={`text-[0.85rem] flex-1
                                   ${isChecked ? "line-through text-[hsl(215_16%_55%)]" : "text-[hsl(220_20%_20%)]"}`}
                    >
                      {item.label}
                    </span>

                    {/* Critical Badge */}
                    {item.critical && (
                      <span
                        className={`text-[0.72rem] font-semibold
                                      ${isChecked ? "text-[hsl(168_80%_30%)]" : "text-[hsl(0_70%_50%)]"}`}
                      >
                        {isChecked ? "✓" : "(Critical)"}
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
