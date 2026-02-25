import { useState } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Edit3,
  RefreshCw,
  User,
  Users,
  AlertCircle,
  FilePlus2,
  FileEdit,
  Smartphone,
  Building2,
  CheckCircle2,
  ArrowLeft,
  Baby,
  Smile,
  GraduationCap,
  Briefcase,
  Hospital,
  Home,
  Globe,
  Heart,
} from "lucide-react";

const ICONS: Record<string, React.ElementType> = {
  new_certificate: FileText,
  correction_needed: Edit3,
  replacement: RefreshCw,
  new_passport: FileText,
  renewal: Edit3,
  lost_damaged: RefreshCw,
  adult: Users,
  special: User,
  new: FilePlus2,
  correction: FileEdit,
  online: Smartphone,
  inperson: Building2,
  "0-3": Baby,
  "3-10": Smile,
  "10-18": GraduationCap,
  "18+": Briefcase,
  hospital: Hospital,
  home: Home,
  overseas: Globe,
  adoption: Heart,
};

const GRADIENT_STYLES: Record<
  string,
  { bg: string; border: string; iconBg: string; iconColor?: string }
> = {
  green: {
    bg: "bg-[linear-gradient(135deg,hsl(150_60%_96%),hsl(168_50%_93%))]",
    border: "border-[hsl(168_60%_80%)]",
    iconBg: "bg-[hsl(168_60%_90%)]",
    iconColor: "text-[hsl(168_80%_25%)]",
  },
  orange: {
    bg: "bg-[linear-gradient(135deg,hsl(35_80%_96%),hsl(25_70%_93%))]",
    border: "border-[hsl(35_70%_80%)]",
    iconBg: "bg-[hsl(35_70%_90%)]",
    iconColor: "text-[hsl(35_80%_35%)]",
  },
  blue: {
    bg: "bg-[linear-gradient(135deg,hsl(210_70%_96%),hsl(220_60%_93%))]",
    border: "border-[hsl(210_60%_80%)]",
    iconBg: "bg-[hsl(210_60%_90%)]",
    iconColor: "text-[hsl(210_80%_40%)]",
  },
};

export interface DocumentNeedOption {
  id: string;
  title: string;
  description: string;
  color: string;
  icon?: string;
  iconColor?: string;
  badge?: string;
  features?: string[];
}

export interface DocumentNeedQuestion {
  id: string;
  title: string;
  description?: string;
  options: DocumentNeedOption[];
  note?: string;
}

export interface DocumentNeedData {
  title?: string;
  description?: string;
  options?: DocumentNeedOption[];
  questions?: DocumentNeedQuestion[];
}

export interface DocumentNeedStepProps {
  selected: string | Record<string, string> | null;
  onSelect: (id: string, questionId?: string) => void;
  data?: DocumentNeedData;
}

const DocumentNeedStep = ({
  selected,
  onSelect,
  data,
}: DocumentNeedStepProps) => {
  const [internalStep, setInternalStep] = useState(1);

  const title = data?.title || "Application Setup";
  const description = data?.description || "";
  const options = data?.options || [];
  const questions = data?.questions || [];

  // Multiple Questions Mode
  if (questions.length > 0) {
    const handleOptionSelect = (qIndex: number, qId: string, optId: string) => {
      onSelect(optId, qId);
      // Don't automatically advance to next step - let user click Next button
      // if (qIndex + 1 < questions.length) {
      //   setInternalStep(qIndex + 2);
      // }
    };

    const handleBack = () => {
      if (internalStep > 1) {
        setInternalStep(internalStep - 1);
      }
    };

    return (
      <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-5">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900 mb-3 tracking-tight">
            {title}
          </h2>
          {description && (
            <p className="text-slate-600 text-lg max-w-xl">{description}</p>
          )}
        </div>

        <div className="space-y-8 relative before:absolute before:inset-0 before:ml-[23px] md:before:ml-[27px] before:-translate-x-px md:before:translate-x-0 before:h-full before:w-0.5 before:bg-linear-to-b before:from-transparent before:via-slate-200 before:border-slate-300">
          {questions.map((q, index) => {
            const stepNumber = index + 1;
            const isActive = internalStep >= stepNumber;
            const isCompleted = internalStep > stepNumber;

            return (
              <div
                key={q.id}
                className={`relative pl-12 md:pl-14 transition-all duration-500 ${
                  isActive
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-4 pointer-events-none hidden"
                }`}
              >
                <div
                  className={`absolute left-0 top-1 w-12 h-12 rounded-full border-4 shadow-sm flex items-center justify-center transition-all z-10 ${
                    isCompleted || isActive
                      ? "border-white bg-primary/10 text-primary"
                      : "border-white bg-slate-100 text-slate-400"
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : (
                    <span className="font-bold text-lg">{stepNumber}</span>
                  )}
                </div>

                <h3 className="text-xl font-bold text-slate-900 mb-4">
                  {q.title}
                </h3>
                {q.description && (
                  <p className="text-sm text-slate-500 mb-4">{q.description}</p>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {q.options.map((option) => {
                    const Icon = ICONS[option.icon || option.id] || FileText;

                    const isOptSelected =
                      typeof selected === "object" && selected !== null
                        ? selected[q.id] === option.id
                        : false;

                    const bgClass = option.color?.includes("from-")
                      ? `bg-linear-to-br ${option.color}`
                      : GRADIENT_STYLES[option.color]?.bg || "bg-slate-50";

                    // Support specialized layouts from Step1 Application Methods if features array exists
                    if (option.features && option.features.length > 0) {
                      return (
                        <button
                          key={option.id}
                          onClick={() =>
                            handleOptionSelect(index, q.id, option.id)
                          }
                          className={`group relative text-left rounded-xl border-2 transition-all duration-300 overflow-hidden ${
                            isOptSelected
                              ? "border-primary shadow-md ring-2 ring-primary/10 scale-[1.02]"
                              : "border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-md"
                          }`}
                        >
                          {option.badge && (
                            <div className="absolute top-3 right-3 bg-white/20 backdrop-blur-md px-2 py-0.5 rounded-full text-[10px] font-bold text-white z-10 border border-white/30">
                              {option.badge}
                            </div>
                          )}

                          <div
                            className={`p-5 h-full ${bgClass} text-white relative z-0`}
                          >
                            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform"></div>
                            <div className="flex items-center justify-between mb-4">
                              <Icon className="w-8 h-8 text-white/90" />
                              {isOptSelected && (
                                <CheckCircle2 className="w-6 h-6 text-white" />
                              )}
                            </div>
                            <h3 className="text-lg font-bold mb-1 tracking-tight">
                              {option.title}
                            </h3>
                            <p className="text-white/80 leading-snug text-xs mb-4 max-w-[90%]">
                              {option.description}
                            </p>
                            <ul className="space-y-1">
                              {option.features.map((feature, idx) => (
                                <li
                                  key={idx}
                                  className="flex items-center gap-2 text-xs text-white/90 font-medium"
                                >
                                  <div className="w-1 h-1 rounded-full bg-white/80"></div>
                                  {feature}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </button>
                      );
                    }

                    // Standard Step1 layout for multi-question UI
                    const iconColor =
                      option.iconColor ||
                      GRADIENT_STYLES[option.color]?.iconColor ||
                      "text-primary";

                    return (
                      <button
                        key={option.id}
                        onClick={() =>
                          handleOptionSelect(index, q.id, option.id)
                        }
                        className={`group text-left p-4 rounded-xl border-2 transition-all duration-200 ${bgClass} ${
                          isOptSelected
                            ? "border-primary shadow-md ring-2 ring-primary/20 scale-[1.02]"
                            : "border-transparent opacity-90 hover:opacity-100 hover:shadow-md"
                        }`}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 rounded-lg bg-white/60 flex items-center justify-center shadow-sm backdrop-blur-sm">
                            <Icon className={`w-5 h-5 ${iconColor}`} />
                          </div>
                          <h4 className="font-bold text-slate-900">
                            {option.title}
                          </h4>
                        </div>
                        <p className="text-slate-600 leading-relaxed text-xs font-medium">
                          {option.description}
                        </p>
                      </button>
                    );
                  })}
                </div>

                {q.note && internalStep === stepNumber && (
                  <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-100 flex gap-3 text-slate-600 text-xs shadow-sm">
                    <AlertCircle className="w-4 h-4 text-slate-400 shrink-0" />
                    <p dangerouslySetInnerHTML={{ __html: q.note }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-10 flex justify-between items-center pt-6 border-t border-slate-100">
          {/* <button
            onClick={handleBack}
            className={`text-slate-500 hover:text-slate-800 font-medium px-4 py-2 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-2 ${
              internalStep <= 1 ? "invisible" : ""
            }`}
            disabled={internalStep <= 1}
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button> */}

          {internalStep < questions.length && (
            <div className="px-4 py-2 text-sm text-slate-400 font-medium">
              Make a selection above
            </div>
          )}
        </div>
      </div>
    );
  }

  // Legacy Single Question Mode
  return (
    <div>
      <h2
        className="text-[1.75rem] font-extrabold text-[hsl(220_20%_10%)]
                     mb-2 font-['Plus_Jakarta_Sans','Inter',system-ui,sans-serif]"
      >
        {title}
      </h2>

      <p
        className="text-[0.95rem] text-[hsl(215_16%_47%)]
                    mb-8 leading-normal"
      >
        {description}
      </p>

      <div className={`grid gap-5 ${
        options.length === 4 
          ? "grid-cols-1 sm:grid-cols-2 max-w-3xl mx-auto" 
          : options.length % 3 === 0 
            ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3"
            : "grid-cols-1 sm:grid-cols-2 max-w-3xl mx-auto"
      }`}>
        {options.map((option, i) => {
          const Icon = ICONS[option.icon || option.id] || FileText;
          const styles = GRADIENT_STYLES[option.color] || GRADIENT_STYLES.green;
          const isSelected = selected === option.id;

          const activeBorder = "border-[hsl(168_80%_30%)]";
          const activeBg =
            "bg-[linear-gradient(135deg,hsl(168_60%_95%),hsl(168_50%_90%))]";
          const activeShadow = "shadow-[0_0_0_3px_hsl(168_80%_30%/0.15)]";

          return (
            <motion.button
              key={option.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{
                y: -4,
                boxShadow: "0 12px 32px -8px hsla(0,0%,0%,0.12)",
              }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onSelect(option.id)}
              className={`
                p-7 rounded-2xl text-left flex flex-col gap-4
                border-2 transition-all duration-200
                ${
                  isSelected
                    ? `${activeBorder} ${activeBg} ${activeShadow}`
                    : `${styles.border} ${styles.bg} shadow-[0_2px_8px_hsla(0,0%,0%,0.04)]`
                }
              `}
            >
              {/* Icon Box */}
              <div
                className={`w-14 h-14 rounded-[14px] flex items-center justify-center
                  ${isSelected ? "bg-[hsl(168_60%_88%)]" : styles.iconBg}`}
              >
                <Icon
                  className={`w-6.5 h-6.5
                    ${
                      isSelected
                        ? "text-[hsl(168_80%_25%)]"
                        : "text-[hsl(220_20%_30%)]"
                    }`}
                />
              </div>

              {/* Text */}
              <div>
                <h3
                  className="text-[1.05rem] font-bold
                               text-[hsl(220_20%_10%)]
                               mb-1
                               font-['Plus_Jakarta_Sans','Inter',system-ui,sans-serif]"
                >
                  {option.title}
                </h3>

                <p
                  className="text-[0.85rem]
                              text-[hsl(215_16%_50%)]
                              leading-[1.4]"
                >
                  {option.description}
                </p>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default DocumentNeedStep;
