import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, X, Check, Download, ChevronDown } from "lucide-react";

interface Phase {
  id: number;
  title: string;
  duration: string;
  description: string;
}

interface DocumentItem {
  id: string;
  label: string;
  description: string;
  required: boolean;
}

interface RoadmapData {
  title: string;
  estimated_timeline: string;
  onsitePhases: Phase[];
  onlinePhases: Phase[];
  documents_checklist: DocumentItem[];
}

interface RoadmapStepProps {
  checkedDocuments: string[];
  onToggleDocument: (id: string) => void;
  data?: RoadmapData;
}

const RoadmapStep = ({
  checkedDocuments,
  onToggleDocument,
  data,
}: RoadmapStepProps) => {
  const title = data?.title || "Your Personalized Roadmap";
  const estimatedTimeline = data?.estimated_timeline || "";

  const onsitePhases = data?.onsitePhases || [];
  const onlinePhases = data?.onlinePhases || [];
  const documentsChecklist = data?.documents_checklist || [];

  const [activePhase, setActivePhase] = useState<Phase | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showDocuments, setShowDocuments] = useState(false);

  useEffect(() => {
    if (activePhase) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [activePhase]);

  const checkedCount = checkedDocuments.length;
  const totalDocs = documentsChecklist.length;

  const currentPhases = isFlipped ? onlinePhases : onsitePhases;

  const getBulletPoints = (text: string) => {
    return text
      .split(".")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      {/* Heading */}
      <h2 className="text-[1.75rem] font-extrabold text-[hsl(220_20%_10%)] mb-2">
        {title}
      </h2>

      <p className="text-[0.95rem] mb-8">
        <span className="text-[hsl(215_16%_47%)]">Estimated timeline: </span>
        <span className="text-[#0d7377] font-bold">{estimatedTimeline}</span>
      </p>

      {/* Flashcard Timeline */}
      <div className="mb-12">
        <div
          onClick={() => setIsFlipped(!isFlipped)}
          className={`relative w-full min-h-[260px] cursor-pointer transition-transform duration-700 ${
            isFlipped ? "rotate-y-180" : ""
          }`}
          style={{ transformStyle: "preserve-3d", perspective: "1200px" }}
        >
          {/* FRONT (Onsite) */}
          <div className="absolute inset-0 backface-hidden">
            <TimelinePhases
              phases={onsitePhases}
              type="Onsite Application"
              onSelectPhase={setActivePhase}
            />
          </div>

          {/* BACK (Online) */}
          <div className="absolute inset-0 backface-hidden rotate-y-180">
            <TimelinePhases
              phases={onlinePhases}
              type="Online Application"
              onSelectPhase={setActivePhase}
            />
          </div>
        </div>
      </div>

      {/* Checklist Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 mt-10">
        <div
          className="cursor-pointer group flex-1"
          onClick={() => setShowDocuments(!showDocuments)}
        >
          <h3 className="text-[1.15rem] font-bold text-slate-900 group-hover:text-primary transition-colors flex items-center gap-2">
            Required Documents ({checkedDocuments.length}/
            {documentsChecklist.length})
            <ChevronDown
              className={`w-5 h-5 transition-transform duration-300 ${
                showDocuments ? "rotate-180" : ""
              }`}
            />
          </h3>
          {!showDocuments && (
            <p className="text-[0.85rem] text-slate-500 mt-0.5">
              Click to see the required documents
            </p>
          )}
        </div>

        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg border-[1.5px] border-primary text-primary text-[0.85rem] font-semibold hover:bg-primary/5 transition-colors focus:outline-none shrink-0"
        >
          <Download className="w-3.5 h-3.5" />
          Print Checklist
        </motion.button>
      </div>

      {/* Checklist Items */}
      <AnimatePresence>
        {showDocuments && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-3 pb-4">
              {documentsChecklist.map((doc, idx) => {
                const isChecked = checkedDocuments.includes(doc.id);

                return (
                  <motion.div
                    key={idx}
                    whileHover={{ y: -1 }}
                    onClick={() => onToggleDocument(doc.id)}
                    className={`p-4 rounded-xl flex items-center justify-between transition-all cursor-pointer ${
                      isChecked
                        ? "bg-primary/5 border border-primary/30"
                        : "bg-white border border-slate-200 shadow-sm hover:shadow-md"
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      {/* Checkbox */}
                      <div
                        className={`w-5.5 h-5.5 rounded-[6px] flex items-center justify-center shrink-0 transition-all ${
                          isChecked
                            ? "bg-primary border-2 border-primary"
                            : "bg-white border-2 border-slate-300"
                        }`}
                      >
                        {isChecked && (
                          <Check className="w-3.5 h-3.5 text-white" />
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[0.9rem] font-bold text-slate-800 ${
                              isChecked ? "line-through opacity-70" : ""
                            }`}
                          >
                            {doc.label}
                          </span>

                          {doc.required && (
                            <span className="px-2 py-px rounded-md bg-rose-50 text-rose-600 text-[0.7rem] font-bold uppercase tracking-wider">
                              Required
                            </span>
                          )}
                        </div>

                        <p
                          className={`text-[0.8rem] text-slate-500 mt-0.5 ${
                            isChecked ? "opacity-70" : ""
                          }`}
                        >
                          {doc.description}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-primary text-primary text-[0.8rem] font-semibold hover:bg-primary/5 transition-colors shrink-0"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      Upload
                    </button>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Phase Modal */}
      <AnimatePresence>
        {activePhase && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
              onClick={() => setActivePhase(null)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
              w-[90%] max-w-md bg-white rounded-2xl shadow-xl p-6 z-50"
            >
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-bold text-[#0d7377]">
                  Phase {activePhase.id}: {activePhase.title}
                </h4>
                <button onClick={() => setActivePhase(null)}>
                  <X className="w-4 h-4" />
                </button>
              </div>

              <ul className="space-y-2 text-sm text-gray-600 leading-6">
                {getBulletPoints(activePhase.description).map(
                  (point, index) => (
                    <li key={index} className="flex gap-2">
                      <span className="text-[#0d7377] font-bold">•</span>
                      <span>{point}</span>
                    </li>
                  ),
                )}
              </ul>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default RoadmapStep;

interface TimelineProps {
  phases: Phase[];
  type: string;
  onSelectPhase: (phase: Phase) => void;
}

const TimelinePhases = ({ phases, type, onSelectPhase }: TimelineProps) => {
  const [activeId, setActiveId] = useState<number | null>(null);

  return (
    <div className="p-6 rounded-xl bg-[#f8fdfd] border border-[#e1f3f3] shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h4 className="text-lg font-semibold text-[#0d7377]">{type}</h4>
        <span className="text-xs text-slate-500">Click anywhere to switch</span>
      </div>

      <div className="flex justify-center items-start gap-2.5">
        {phases.map((phase, i) => (
          <div key={phase.id} className="flex items-start gap-2.5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveId(phase.id);
                onSelectPhase(phase);
              }}
              className="flex flex-col items-center gap-2 bg-transparent border-none p-1"
            >
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center
                font-bold text-white text-[1.05rem] shadow-md
                ${
                  activeId === phase.id
                    ? "bg-[#0d7377]"
                    : "bg-linear-to-br from-[#14a0a6] to-[#0a5a5d]"
                }`}
              >
                {phase.id}
              </div>

              <span className="text-[0.8rem] font-semibold text-center max-w-24 leading-[1.3] min-h-12">
                {phase.title}
              </span>

              {/* <span className="text-[0.72rem] text-slate-500">
                {phase.duration}
              </span> */}
            </button>

            {i < phases.length - 1 && (
              <div className="w-10 h-0.5 bg-[#14a0a6] mt-6 opacity-40" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
