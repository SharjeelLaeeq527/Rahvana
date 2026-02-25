import { motion } from "framer-motion";
import {
  ClipboardList,
  MapPin,
  Map,
  Search,
  Star,
  Bookmark,
} from "lucide-react";
import { type WizardStepId } from "@/types/guide-wizard";

const STEP_ICONS: Record<string, React.ElementType> = {
  document_need: ClipboardList,
  location: MapPin,
  roadmap: Map,
  office_finder: Search,
  validation: Star,
};

interface WizardSidebarProps {
  currentStep: number;
  steps: WizardStepId[];
  onStepClick: (step: number) => void;
  stepLabels?: Record<string, string>;
}

const DEFAULT_LABELS: Record<string, string> = {
  document_need: "Document Need",
  location: "Location",
  roadmap: "Roadmap",
  office_finder: "Office Finder",
  validation: "Validation",
};

type StepStatus = "completed" | "active" | "upcoming";

const getStatus = (index: number, currentStep: number): StepStatus => {
  if (index < currentStep) return "completed";
  if (index === currentStep) return "active";
  return "upcoming";
};

const WizardSidebar = ({
  currentStep,
  steps,
  onStepClick,
  stepLabels,
}: WizardSidebarProps) => {
  const labels = stepLabels || DEFAULT_LABELS;
  const progress = currentStep + 1;
  const total = steps.length;
  const progressPercent = (progress / total) * 100;

  return (
    <aside className="h-full flex flex-col bg-white border-r border-slate-200 rounded-xl mx-4 my-3" style={{ height: '660px', width: '320px' }}>
      {/* Add to Active Wizards Button */}
      <div className="p-4 border-b border-slate-200 rounded-t-xl">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full flex items-center justify-center gap-2
                     px-4 py-2.5 rounded-lg font-medium transition-all
                     bg-primary text-white hover:bg-primary/80"
        >
          <Bookmark className="w-5 h-5" />
          Add to My Guides
        </motion.button>
      </div>

      {/* Steps */}
      <nav className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {steps.map((stepId, index) => {
          const status = getStatus(index, currentStep);
          const Icon = STEP_ICONS[stepId] || ClipboardList;
          const label = labels[stepId] || stepId;
          const isClickable = status === "completed";

          return (
            <div key={stepId}>
              <motion.button
                onClick={() => isClickable && onStepClick(index)}
                whileHover={isClickable ? { x: 4 } : {}}
                className={`w-full flex items-start gap-3 p-2 rounded-lg text-left transition-colors
                           ${
                             status === "completed"
                               ? "hover:bg-slate-50 cursor-pointer text-slate-700"
                               : status === "active"
                                 ? "bg-primary/10 cursor-pointer text-primary"
                                 : "opacity-50 cursor-not-allowed text-slate-500"
                           }`}
              >
                <div className="shrink-0 mt-0.5">
                  {status === "completed" ? (
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="none"
                      >
                        <path
                          d="M6.5 10.5L9 13L14.5 7.5"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  ) : (
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center
                        ${
                          status === "active"
                            ? "bg-primary shadow-md"
                            : "bg-slate-100"
                        }`}
                    >
                      <Icon
                        className={`w-4 h-4
                          ${
                            status === "active"
                              ? "text-white"
                              : "text-slate-400"
                          }`}
                      />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0 py-1">
                  <p
                    className={`font-medium text-sm truncate ${status === "active" ? "font-bold" : ""}`}
                  >
                    {label}
                  </p>
                  <p
                    className={`text-xs mt-0.5 ${
                      status === "active" ? "text-primary" : "text-slate-400"
                    }`}
                  >
                    {status === "completed"
                      ? "Completed"
                      : status === "active"
                        ? "In Progress"
                        : "Upcoming"}
                  </p>
                </div>
              </motion.button>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="flex justify-start pl-6 py-0.5">
                  <div
                    className={`w-0.5 h-4 ${
                      status === "completed"
                        ? "bg-primary"
                        : "bg-slate-200"
                    }`}
                  />
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Progress Bar */}
      <div className="p-4 border-t border-slate-200 bg-slate-50 rounded-b-xl">
        <div className="flex items-center justify-between text-xs text-slate-500 mb-2 font-medium">
          <span>Overall Progress</span>
          <span className="text-primary bg-primary/10 px-2 py-0.5 rounded-full">
            {progress} / {total} Steps
          </span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-1.5 animate-pulse">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="h-1.5 rounded-full transition-all duration-500 shadow-sm bg-primary"
          />
        </div>
      </div>
    </aside>
  );
};

export default WizardSidebar;