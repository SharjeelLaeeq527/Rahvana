"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, CheckCircle2, Info } from "lucide-react";

export interface InstructionPhase {
  id: number;
  title: string;
  duration: string;
  description: string;
}

export interface InstructionsData {
  title: string;
  phases: InstructionPhase[];
}

interface InstructionsStepProps {
  data: InstructionsData;
}

const InstructionsStep = ({ data }: InstructionsStepProps) => {
  const [openPhaseId, setOpenPhaseId] = useState<number | null>(data?.phases?.[0]?.id || null);

  if (!data || !data.phases) {
    return (
      <div className="p-8 text-center text-slate-500">
        Please go back and select a province to view its instructions.
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-2">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900 mb-3 tracking-tight">{data.title}</h2>
        <p className="text-slate-600 text-lg max-w-xl">
          Follow these steps carefully to complete your Police Character Certificate application.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {data.phases.map((phase, i) => {
          const isOpen = openPhaseId === phase.id;
          return (
            <motion.div
              key={phase.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`rounded-2xl border-2 transition-all duration-300 overflow-hidden ${
                isOpen 
                  ? "border-primary bg-primary/5 shadow-md" 
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <button
                onClick={() => setOpenPhaseId(isOpen ? null : phase.id)}
                className="w-full flex items-center justify-between p-5 text-left"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg transition-colors ${
                    isOpen ? "bg-primary text-white" : "bg-slate-100 text-slate-500"
                  }`}>
                    {phase.id}
                  </div>
                  <div>
                    <h3 className={`text-xl font-bold ${isOpen ? "text-primary" : "text-slate-700"}`}>
                      {phase.title}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-1 text-sm text-slate-500 font-medium tracking-wide">
                      <Info className="w-3.5 h-3.5" />
                      {phase.duration}
                    </div>
                  </div>
                </div>
                <ChevronDown className={`w-6 h-6 transition-transform duration-300 ${
                  isOpen ? "rotate-180 text-primary" : "text-slate-400"
                }`} />
              </button>
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="px-5 pb-5 pt-1 ml-14">
                      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                        <p className="text-slate-700 leading-relaxed font-medium">
                          {phase.description}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default InstructionsStep;
