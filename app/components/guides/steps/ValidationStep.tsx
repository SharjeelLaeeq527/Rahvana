import { motion } from "framer-motion";
import { Upload, Check, ChevronDown, CheckCircle2, Lock, Loader2 } from "lucide-react";
import { useState, useRef } from "react";
import { useLanguage } from "@/app/context/LanguageContext";

interface ValidationCategory {
  name: string;
  items: { label: string; critical: boolean }[];
}

interface ValidationData {
  title: string;
  description: string;
  upload_section?: {
    title: string;
    description: string;
    formats: string;
  };
  uploadSection?: {
    title: string;
    description: string;
    formats: string;
  };
  checklist_title?: string;
  checklistTitle?: string;
  categories: ValidationCategory[];
}

interface ValidationStepProps {
  validationChecks: string[];
  onToggleCheck: (label: string) => void;
  uploadedFile: boolean;
  onUpload: (file: File) => Promise<void>;
  data?: ValidationData;
}

const ValidationStep = ({
  validationChecks,
  onToggleCheck,
  uploadedFile,
  onUpload,
  data,
}: ValidationStepProps) => {
  const { t, isUrdu } = useLanguage();
  const [showValidations, setShowValidations] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const title = data?.title || t("wizard.common.certificateValidation");
  const description = data?.description || "";
  const uploadSection = data?.upload_section ||
    data?.uploadSection || {
      title: "",
      description: "",
      formats: "",
    };
  const checklistTitle =
    data?.checklist_title || data?.checklistTitle || t("wizard.common.validation");
  const categories = data?.categories || [];

  const totalItems = categories.reduce((acc, cat) => acc + cat.items.length, 0);
  const checkedCount = validationChecks.length;
  const criticalTotal = categories.reduce(
    (acc, cat) => acc + cat.items.filter((item) => item.critical).length,
    0
  );
  const criticalChecked = categories.reduce(
    (acc, cat) =>
      acc +
      cat.items.filter((item) => item.critical && validationChecks.includes(item.label)).length,
    0
  );
  const criticalRemaining = criticalTotal - criticalChecked;

  const acceptedFormats = data?.upload_section?.formats || data?.uploadSection?.formats || "";

  const handleButtonClick = () => {
    if (!uploadedFile && !isUploading) {
      fileInputRef.current?.click();
    }
  };

  const handleFileSelect = async (file: File) => {
    setIsUploading(true);
    try {
      await onUpload(file);
    } finally {
      setIsUploading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
    // Reset so the same file can be selected again
    e.target.value = "";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!uploadedFile && !isUploading) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (uploadedFile || isUploading) return;
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={isUrdu ? "font-urdu-body" : ""}
      dir={isUrdu ? "rtl" : "ltr"}
    >
      {/* Title & Description */}
      <h2
        className="text-[1.75rem] font-extrabold text-[hsl(220_20%_10%)]
                     mb-2 font-['Plus_Jakarta_Sans','Inter',system-ui,sans-serif]"
      >
        {title}
      </h2>
      <p className="text-[0.95rem] text-[hsl(215_16%_47%)] mb-8">{description}</p>

      {/* Hidden file input for both button click and drag-and-drop */}
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedFormats?.replace(/,/g, ",.") || ""}
        onChange={handleInputChange}
        className="hidden"
      />

      {/* Upload Section */}
      <div
        className={`p-6 rounded-xl border mb-8 transition-colors ${
          uploadedFile
            ? "border-green-200 bg-green-50"
            : isDragging
              ? "border-primary bg-primary/5"
              : "border-[hsl(214_32%_91%)] bg-white"
        }`}
      >
        <h3
          className="text-[1.1rem] font-bold text-[hsl(220_20%_10%)] mb-4
                       font-['Plus_Jakarta_Sans','Inter',system-ui,sans-serif]"
        >
          {uploadSection.title}
        </h3>

        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`flex flex-col items-center gap-3 p-8 rounded-lg border-2 border-dashed transition-all duration-200 ${
            uploadedFile
              ? "border-green-300 bg-green-100"
              : isDragging
                ? "border-primary bg-primary/10 scale-[1.01]"
                : isUploading
                  ? "border-primary/50 bg-primary/5"
                  : "border-[hsl(214_32%_88%)] bg-[hsl(210_20%_99%)]"
          }`}
        >
          {isUploading ? (
            <>
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p
                className={`text-[0.9rem] text-primary font-semibold text-center ${isUrdu ? "font-urdu-body" : ""}`}
              >
                Uploading & processing your document...
              </p>
              <p className={`text-[0.78rem] text-slate-500 ${isUrdu ? "font-urdu-body" : ""}`}>
                Please wait, this may take a moment.
              </p>
            </>
          ) : uploadedFile ? (
            <>
              <CheckCircle2 className="w-8 h-8 text-green-600" />
              <p
                className={`text-[0.9rem] text-green-700 font-semibold text-center ${isUrdu ? "font-urdu-body" : ""}`}
              >
                {t("wizard.common.uploadSuccess")}
              </p>
              <p className={`text-[0.78rem] text-green-600 ${isUrdu ? "font-urdu-body" : ""}`}>
                {t("wizard.common.secureStore")}
              </p>
            </>
          ) : (
            <>
              <Upload
                className={`w-8 h-8 text-[hsl(215_16%_70%)] ${isDragging ? "text-primary scale-110" : ""} transition-all`}
              />
              <p className="text-[0.9rem] text-[hsl(215_16%_47%)] text-center">
                {isDragging ? "Drop your file here" : uploadSection.description}
              </p>
              <p
                className={`text-[0.78rem] text-[hsl(215_16%_60%)] ${isUrdu ? "font-urdu-body" : ""}`}
              >
                {t("wizard.common.acceptedFormats")} {uploadSection.formats}
              </p>
            </>
          )}
          <motion.button
            whileHover={{ scale: uploadedFile || isUploading ? 1 : 1.03 }}
            whileTap={{ scale: uploadedFile || isUploading ? 1 : 0.97 }}
            onClick={handleButtonClick}
            disabled={uploadedFile || isUploading}
            className={`px-6 py-2 rounded-xl text-[0.875rem] font-semibold transition-all
                        ${
                          uploadedFile
                            ? "bg-green-100 text-green-700 border border-green-300 cursor-default"
                            : isUploading
                              ? "bg-primary/10 text-primary border border-primary/30 cursor-wait"
                              : "bg-linear-to-br from-[#14a0a6] to-[#0d7377] text-white shadow-[0_2px_8px_hsl(168_80%_30%/0.3)] hover:shadow-[0_4px_12px_hsl(168_80%_30%/0.4)] cursor-pointer"
                        }`}
          >
            {isUploading ? (
              <span className={`flex items-center gap-2 ${isUrdu ? "font-urdu-body" : ""}`}>
                <Loader2 className="w-4 h-4 animate-spin" />
                Uploading...
              </span>
            ) : uploadedFile ? (
              <span className={`flex items-center gap-2 ${isUrdu ? "font-urdu-body" : ""}`}>
                <Check className="w-4 h-4" />
                {t("wizard.common.uploadedToVault")}
              </span>
            ) : (
              <span className={isUrdu ? "font-urdu-body" : ""}>
                {t("wizard.common.uploadToVault")}
              </span>
            )}
          </motion.button>

          {/* Security Notice */}
          <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-500 font-semibold mt-1">
            <Lock className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className={isUrdu ? "font-urdu-body" : ""}>
              {t("documentVaultPage.components.uploadModal.securityNotice")}
            </span>
          </div>
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
          </div>
        </div>
        {criticalRemaining > 0 && (
          <span
            className={`p-2 rounded-xl text-[10px] font-semibold
                           bg-[hsl(0_84%_95%)] text-[hsl(0_70%_50%)] ${isUrdu ? "font-urdu-body" : ""}`}
          >
            {t("wizard.common.criticalIssues", {
              count: criticalRemaining,
            })}
          </span>
        )}
        {!showValidations && (
          <p className={`text-[0.85rem] text-slate-500 mt-2 ${isUrdu ? "font-urdu-body" : ""}`}>
            {t("wizard.common.clickToSeeValidations")}
          </p>
        )}
      </div>

      {/* Checklist Categories */}
      {showValidations &&
        categories.map((category, ci) => (
          <div key={ci} className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-[hsl(168_80%_30%)]" />
              <h4 className="text-[0.95rem] font-bold text-[hsl(220_20%_15%)]">{category.name}</h4>
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
                      {isChecked && <Check className="w-3.5 h-3.5 text-white" />}
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
                                      ${isChecked ? "text-[hsl(168_80%_30%)]" : "text-[hsl(0_70%_50%)]"} ${isUrdu ? "font-urdu-body" : ""}`}
                      >
                        {isChecked ? "✓" : t("wizard.common.critical")}
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
