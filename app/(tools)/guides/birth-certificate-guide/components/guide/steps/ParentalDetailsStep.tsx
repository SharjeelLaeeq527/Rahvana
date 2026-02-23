import { motion } from "framer-motion";
import { Check, ClipboardCheck } from "lucide-react";
import guideData from "@/data/birth-certificate-guide-data.json";

interface ParentalDetailsStepProps {
  status: {
    hasCNICs: boolean;
    hasNikahNama: boolean;
    isSingleParent: boolean;
    hasOldRecords: boolean;
    hasSchoolRecord: boolean;
    hasResidenceProof: boolean;
  };
  onToggle: (key: string) => void;
}

const ParentalDetailsStep = ({ status, onToggle }: ParentalDetailsStepProps) => {
  const { title, options } = guideData.wizard.parental_details;

  // Map JSON IDs to state keys
  const idMap: Record<string, keyof ParentalDetailsStepProps['status']> = {
    cnics: "hasCNICs",
    nikah_nama: "hasNikahNama",
    single_deceased: "isSingleParent",
    old_record: "hasOldRecords",
    school_record: "hasSchoolRecord",
    residence_proof: "hasResidenceProof",
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <h2 className="text-[1.75rem] font-extrabold text-slate-900 mb-2 font-['Plus_Jakarta_Sans','Inter',system-ui,sans-serif]">
        {title}
      </h2>
      <p className="text-[0.95rem] text-slate-500 mb-8 leading-normal font-['Plus_Jakarta_Sans',system-ui]">
        Select all documentation proofs you currently possess or apply to your case.
      </p>

      <div className="flex flex-col gap-4 max-w-2xl">
        {options.map((option) => {
          const stateKey = idMap[option.id];
          const isChecked = status[stateKey];

          return (
            <motion.button
              key={option.id}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => onToggle(stateKey)}
              className={`
                p-5 rounded-2xl flex items-center justify-between transition-all border-2 text-left
                ${isChecked 
                  ? "bg-teal-50 border-teal-600 shadow-sm" 
                  : "bg-white border-slate-100 hover:border-teal-200"}
              `}
            >
              <div className="flex items-center gap-4">
                <div className={`
                  w-10 h-10 rounded-xl flex items-center justify-center transition-colors
                  ${isChecked ? "bg-teal-600 text-white" : "bg-slate-50 text-slate-400"}
                `}>
                  <ClipboardCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className={`text-[0.95rem] font-bold ${isChecked ? "text-teal-900" : "text-slate-900"}`}>
                    {option.label}
                  </h4>
                  {option.required && (
                    <span className="text-[0.7rem] font-bold text-teal-600 uppercase tracking-wider">Mandatory for standard case</span>
                  )}
                </div>
              </div>

              <div className={`
                w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all
                ${isChecked ? "bg-teal-600 border-teal-600 shadow-inner" : "bg-white border-slate-200"}
              `}>
                {isChecked && <Check className="w-4 h-4 text-white" />}
              </div>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
};

export default ParentalDetailsStep;
