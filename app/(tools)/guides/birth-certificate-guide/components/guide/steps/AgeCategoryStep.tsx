import { motion } from "framer-motion";
import { Baby, FerrisWheel, GraduationCap, UserCheck, Check } from "lucide-react";
import guideData from "@/data/birth-certificate-guide-data.json";

interface AgeCategoryStepProps {
  selectedCategory: string | null;
  onSelect: (id: string) => void;
}

const AGE_ICONS: Record<string, any> = {
  "0-3": Baby,
  "3-10": FerrisWheel,
  "10-18": GraduationCap,
  "18+": UserCheck,
};

const AgeCategoryStep = ({ selectedCategory, onSelect }: AgeCategoryStepProps) => {
  const { title, description, options } = guideData.wizard.age_category;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      {/* Title */}
      <div className="mb-10 text-center md:text-left">
        <h2 className="text-[1.85rem] font-black text-slate-900 mb-2 font-['Plus_Jakarta_Sans','Inter',system-ui,sans-serif] tracking-tight">
          {title}
        </h2>
        <p className="text-[1rem] text-slate-500 leading-relaxed font-['Plus_Jakarta_Sans',system-ui] max-w-xl">
          {description}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-3xl mx-auto md:mx-0">
        {options.map((option: any) => {
          const Icon = AGE_ICONS[option.id] || UserCheck;
          const isSelected = selectedCategory === option.id;

          return (
            <motion.button
              key={option.id}
              whileHover={{ y: -4, scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelect(option.id)}
              className={`
                relative p-6 rounded-[24px] flex flex-col items-start gap-4 transition-all border-2 text-left
                ${isSelected 
                  ? `bg-${option.color}-50 border-${option.color}-600 shadow-xl shadow-${option.color}-100` 
                  : "bg-white border-slate-100 hover:border-slate-200 hover:shadow-lg hover:shadow-slate-100"}
              `}
            >
              <div className={`
                w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300
                ${isSelected ? `bg-${option.color}-600 text-white rotate-6` : "bg-slate-50 text-slate-400"}
              `}>
                <Icon className="w-7 h-7" />
              </div>

              <div>
                <h4 className={`text-[1.15rem] font-black mb-1 font-['Plus_Jakarta_Sans',system-ui] ${isSelected ? `text-${option.color}-900` : "text-slate-900"}`}>
                  {option.title}
                </h4>
                <p className={`text-[0.85rem] font-medium leading-normal ${isSelected ? `text-${option.color}-700` : "text-slate-500"}`}>
                  {option.description}
                </p>
              </div>

              {isSelected && (
                <div className={`absolute top-4 right-4 w-7 h-7 rounded-full bg-${option.color}-600 flex items-center justify-center shadow-lg`}>
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
};

export default AgeCategoryStep;
