"use client";

import { motion } from "framer-motion";
import { MapPin } from "lucide-react";

export interface ProvinceOption {
  id: string;
  label: string;
  color?: string;
}

export interface ProvinceSelectionData {
  title: string;
  description: string;
  options: ProvinceOption[];
}

interface ProvinceSelectionStepProps {
  selected: string | null;
  onSelect: (id: string) => void;
  data?: ProvinceSelectionData;
}

const POSTAL_COLORS: Record<
  string,
  { bg: string; text: string; border: string; hover: string }
> = {
  green: {
    bg: "bg-emerald-50/70",
    text: "text-emerald-700",
    border: "border-emerald-200/50",
    hover: "hover:border-emerald-300 hover:shadow-emerald-100/50",
  },
  rose: {
    bg: "bg-rose-50/70",
    text: "text-rose-700",
    border: "border-rose-200/50",
    hover: "hover:border-rose-300 hover:shadow-rose-100/50",
  },
  orange: {
    bg: "bg-orange-50/70",
    text: "text-orange-700",
    border: "border-orange-200/50",
    hover: "hover:border-orange-300 hover:shadow-orange-100/50",
  },
  purple: {
    bg: "bg-violet-50/70",
    text: "text-violet-700",
    border: "border-violet-200/50",
    hover: "hover:border-violet-300 hover:shadow-violet-100/50",
  },
  default: {
    bg: "bg-slate-50/70",
    text: "text-slate-700",
    border: "border-slate-200/50",
    hover: "hover:border-slate-300 hover:shadow-slate-100/50",
  },
};

const ProvinceSelectionStep = ({
  selected,
  onSelect,
  data,
}: ProvinceSelectionStepProps) => {
  const title = data?.title || "Select Province";
  const description =
    data?.description || "Select the province where you want to apply.";
  const options = data?.options || [];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-2">
      <div className="mb-6 md:mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2 md:mb-3 tracking-tight">
          {title}
        </h2>
        <p className="text-slate-600 text-base md:text-lg max-w-xl">
          {description}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {options.map((option, i) => {
          const isSelected = selected === option.id;
          const colorStyles =
            POSTAL_COLORS[option.color || "default"] || POSTAL_COLORS.default;

          return (
            <motion.button
              key={option.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{
                y: -4,
                boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)",
              }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelect(option.id)}
              className={`flex items-center justify-between p-4 sm:p-6 rounded-2xl border-2 transition-all duration-300 text-left ${
                isSelected
                  ? "border-primary bg-primary/5 shadow-md ring-2 ring-primary/20 scale-[1.02]"
                  : `${colorStyles.border} ${colorStyles.bg} shadow-sm hover:shadow-md ${colorStyles.hover}`
              }`}
            >
              <div className="flex items-center gap-3 sm:gap-4">
                <div
                  className={`w-10 h-10 sm:w-12 sm:h-12 shrink-0 rounded-xl flex items-center justify-center transition-colors shadow-xs ${
                    isSelected
                      ? "bg-primary text-white"
                      : `bg-white ${colorStyles.text} shadow-sm`
                  }`}
                >
                  <MapPin className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <span
                  className={`text-lg sm:text-xl font-bold ${
                    isSelected ? "text-primary" : "text-slate-700"
                  }`}
                >
                  {option.label}
                </span>
              </div>
              {/* <ArrowRight className={`w-5 h-5 transition-transform ${
                isSelected ? "text-primary translate-x-1" : "text-slate-300"
              }`} /> */}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default ProvinceSelectionStep;
