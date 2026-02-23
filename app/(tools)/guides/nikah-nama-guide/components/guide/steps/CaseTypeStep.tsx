import { motion } from "framer-motion";
import { ClipboardList, Users, UserPlus, Globe, AlertCircle } from "lucide-react";
import guideData from "@/data/nikah-nama-guide-data.json";

const ICONS: Record<string, React.ElementType> = {
  local: Users,
  foreigner: Globe,
  polygamy: UserPlus,
  abroad: Globe,
};

interface CaseTypeStepProps {
  selected: string | null;
  onSelect: (id: string) => void;
}

const CaseTypeStep = ({ selected, onSelect }: CaseTypeStepProps) => {
  const { title, description, types, eligibility_note } =
    guideData.wizard.case_type;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      {/* Title */}
      <h2 className="text-[1.75rem] font-extrabold text-slate-900 mb-2 font-['Plus_Jakarta_Sans','Inter',system-ui,sans-serif]">
        {title}
      </h2>

      {/* Description */}
      <p className="text-[0.95rem] text-slate-500 mb-8 leading-normal">
        {description}
      </p>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
        {types.map((option: any, i: number) => {
          const Icon = ICONS[option.id] || ClipboardList;
          const isSelected = selected === option.id;

          return (
            <motion.button
              key={option.id}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelect(option.id)}
              className={`
                p-6 rounded-2xl text-left border-2 transition-all flex flex-col gap-4
                ${isSelected 
                  ? "bg-teal-50 border-teal-600 shadow-md" 
                  : "bg-white border-slate-100 hover:border-teal-200 shadow-sm"}
              `}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isSelected ? "bg-teal-600 text-white" : "bg-slate-50 text-slate-600"}`}>
                <Icon className="w-6 h-6" />
              </div>

              <div>
                <h3 className={`text-base font-bold mb-1 ${isSelected ? "text-teal-900" : "text-slate-900"}`}>
                  {option.title}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  {option.description}
                </p>
              </div>
            </motion.button>
          );
        })}
      </div>

    </motion.div>
  );
};

export default CaseTypeStep;
