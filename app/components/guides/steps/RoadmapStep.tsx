import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, ChevronDown } from "lucide-react";
import { useLanguage } from "@/app/context/LanguageContext";

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
  const { t, isUrdu } = useLanguage();
  const title = data?.title || t("wizard.common.personalizedRoadmap");
  // const estimatedTimeline = data?.estimated_timeline || "";

  const onsitePhases = data?.onsitePhases || [];
  const onlinePhases = data?.onlinePhases || [];
  const documentsChecklist = data?.documents_checklist || [];
  const hasOnlinePhases = onlinePhases.length > 0;

  const [activePhase, setActivePhase] = useState<Phase | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showDocuments, setShowDocuments] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [hasClickedAnyPhase, setHasClickedAnyPhase] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  const getBulletPoints = (text: string) => {
    return text
      .split(/\.\s+/)
      .map((item) => item.replace(/\.$/, "").trim())
      .filter((item) => item.length > 0);
  };

  const renderTextWithLinks = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    return parts.map((part, i) => {
      if (part.match(urlRegex)) {
        return (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline font-medium"
            onClick={(e) => e.stopPropagation()}
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={isUrdu ? "font-urdu-body" : ""}
    >
      {/* Heading */}
      <h2 className="text-[1.75rem] font-extrabold text-[hsl(220_20%_10%)] mb-2">
        {title}
      </h2>

      {/* Flashcard Timeline */}
      <div className="mb-8">
        <div
          onClick={() => hasOnlinePhases && setIsFlipped(!isFlipped)}
          className={`relative w-full min-h-[260px] ${hasOnlinePhases ? "cursor-pointer" : ""} transition-transform duration-700 ${
            isFlipped ? "rotate-y-180" : ""
          }`}
          style={{ transformStyle: "preserve-3d", perspective: "1200px" }}
        >
          {/* FRONT (Onsite) */}
          <div
            className={`absolute inset-0 backface-hidden ${
              isFlipped ? "pointer-events-none" : "z-10"
            }`}
          >
            <TimelinePhases
              phases={onsitePhases}
              type={t("wizard.common.onsiteApplication")}
              onSelectPhase={(phase) => {
                setActivePhase(phase);
                setHasClickedAnyPhase(true);
              }}
              hasClickedAnyPhase={hasClickedAnyPhase}
              hasOnlinePhases={hasOnlinePhases}
            />
          </div>

          {/* BACK (Online) */}
          <div
            className={`absolute inset-0 backface-hidden rotate-y-180 ${
              !isFlipped ? "pointer-events-none" : "z-10"
            }`}
          >
            <TimelinePhases
              phases={onlinePhases}
              type={t("wizard.common.onlineApplication")}
              onSelectPhase={(phase) => {
                setActivePhase(phase);
                setHasClickedAnyPhase(true);
              }}
              hasClickedAnyPhase={hasClickedAnyPhase}
              hasOnlinePhases={hasOnlinePhases}
            />
          </div>
        </div>
      </div>

      <div className="h-14 sm:h-10"></div>
      {/* Checklist Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 mt-8 pt-5">
        <div
          className="cursor-pointer group flex-1"
          onClick={() => setShowDocuments(!showDocuments)}
        >
          <h3 className="text-[1.15rem] font-bold text-slate-900 group-hover:text-primary transition-colors flex items-center gap-2">
            {t("wizard.common.requiredDocs")} ({checkedDocuments.length}/
            {documentsChecklist.length})
            <ChevronDown
              className={`w-5 h-5 transition-transform duration-300 ${
                showDocuments ? "rotate-180" : ""
              }`}
            />
          </h3>
          {!showDocuments && (
            <p className="text-[0.85rem] text-slate-500 mt-0.5">
              {t("wizard.common.clickToSeeDocs")}
            </p>
          )}
        </div>
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

                      <div className={isUrdu ? "font-urdu-body" : ""}>
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
                              {t("wizard.common.required")}
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
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Phase Modal */}
      {mounted && typeof document !== "undefined"
        ? createPortal(
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
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
                    w-[90%] max-w-lg bg-white rounded-2xl shadow-2xl p-6 z-50 border border-slate-200 ${isUrdu ? "font-urdu-body" : ""}`}
                    dir={isUrdu ? "rtl" : "ltr"}
                  >
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <h4 className="text-lg font-bold text-primary">
                          {t("wizard.common.phase")} {activePhase.id}:{" "}
                          {activePhase.title}
                        </h4>
                        <p className="text-sm text-slate-500 mt-1">
                          {activePhase.duration}
                        </p>
                      </div>
                      <button
                        onClick={() => setActivePhase(null)}
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors"
                      >
                        <X className="w-4 h-4 text-slate-500" />
                      </button>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                      <ul className="space-y-3">
                        {getBulletPoints(activePhase.description).map(
                          (point, index) => (
                            <li key={index} className="flex gap-3">
                              <span className="text-primary font-bold shrink-0">
                                •
                              </span>
                              <span className="text-slate-700 text-sm leading-relaxed">
                                {renderTextWithLinks(point)}
                              </span>
                            </li>
                          ),
                        )}
                      </ul>
                    </div>

                    <div className="mt-4 flex justify-end gap-2">
                      <button
                        onClick={() => setActivePhase(null)}
                        className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                      >
                        {t("wizard.common.close")}
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>,
            document.body,
          )
        : null}
    </motion.div>
  );
};

export default RoadmapStep;

interface TimelineProps {
  phases: Phase[];
  type: string;
  onSelectPhase: (phase: Phase) => void;
  hasClickedAnyPhase: boolean;
  hasOnlinePhases?: boolean;
}

const TimelinePhases = ({
  phases,
  type,
  onSelectPhase,
  hasClickedAnyPhase,
  hasOnlinePhases = true,
}: TimelineProps) => {
  const { t, isUrdu } = useLanguage();
  const [activeId, setActiveId] = useState<number | null>(null);

  return (
    <div
      className={`p-6 rounded-2xl border shadow-lg ${
        type === t("wizard.common.onsiteApplication")
          ? "bg-linear-to-br from-[#e8f6f6] to-[#d1eeef] border-primary/20"
          : "bg-linear-to-br from-[#e8f6f6] to-[#0d47a1]/20 border-[#0d47a1]/30"
      }`}
      dir={isUrdu ? "rtl" : "ltr"}
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-2">
        <h4
          className={`text-lg font-bold ${type === t("wizard.common.onsiteApplication") ? "text-primary" : "text-[#0d47a1]"}`}
        >
          {type}
        </h4>
        {hasOnlinePhases ? (
          <div
            className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-full border border-slate-200/60 shadow-inner shrink-0"
            dir="ltr"
          >
            <span
              className={`px-3 py-1 text-[0.7rem] font-bold rounded-full transition-all duration-300 uppercase tracking-wider ${
                type === t("wizard.common.onsiteApplication")
                  ? "bg-white text-primary shadow-sm ring-1 ring-slate-200/50"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              {t("wizard.common.onsite")}
            </span>
            <span
              className={`px-3 py-1 text-[0.7rem] font-bold rounded-full transition-all duration-300 uppercase tracking-wider ${
                type === t("wizard.common.onlineApplication")
                  ? "bg-white text-[#0d47a1] shadow-sm ring-1 ring-slate-200/50"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              {t("wizard.common.online")}
            </span>
          </div>
        ) : (
          // <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
          //   Click to view details
          // </span>
          <></>
        )}
      </div>

      <div className="overflow-x-auto custom-scrollbar pt-10 pb-6 -mx-3 px-3">
        <div
          className={`flex justify-start items-stretch gap-2 sm:gap-4 min-w-max ${isUrdu ? "flex-row-reverse" : ""}`}
        >
          {phases.map((phase, i) => (
            <div
              key={phase.id}
              className="relative flex flex-col items-center w-[110px] sm:w-[130px]"
            >
              {/* Connecting Line */}
              {i < phases.length - 1 && (
                <div
                  className={`absolute top-[28px] ${isUrdu ? "right-[50%]" : "left-[50%]"} w-full h-1 z-0`}
                >
                  <div
                    className={`w-full h-full ${type === t("wizard.common.onsiteApplication") ? "bg-primary/30" : "bg-[#0d47a1]/40"} rounded-full`}
                  ></div>
                </div>
              )}

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveId(phase.id);
                  onSelectPhase(phase);
                }}
                className="relative z-10 flex flex-1 flex-col items-center gap-2 bg-transparent border-none p-1 group w-full"
              >
                {i === 0 && !hasClickedAnyPhase && (
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap pointer-events-none z-20">
                    {t("wizard.common.clickHere")}
                  </div>
                )}
                <div className="relative">
                  {i === 0 && !hasClickedAnyPhase && (
                    <div
                      className="absolute inset-0 rounded-full bg-current opacity-30 animate-ping z-0 pointer-events-none"
                      style={{
                        color:
                          type === t("wizard.common.onsiteApplication")
                            ? "#0d7377"
                            : "#0d47a1",
                      }}
                    />
                  )}
                  <div
                    className={`relative z-10 w-14 h-14 shrink-0 rounded-full flex items-center justify-center
                  font-bold text-white text-lg shadow-lg group-hover:scale-110 transition-transform duration-200 border-2
                  ${
                    activeId === phase.id
                      ? type === t("wizard.common.onsiteApplication")
                        ? "bg-primary border-[#0a5a5d] ring-4 ring-primary/20"
                        : "bg-[#0d47a1] border-[#063275] ring-4 ring-[#0d47a1]/20"
                      : type === t("wizard.common.onsiteApplication")
                        ? "bg-linear-to-br from-primary to-[#0a5a5d] border-[#0a5a5d] group-hover:ring-2 group-hover:ring-primary/30"
                        : "bg-linear-to-br from-[#0d47a1] to-[#0d47a1] border-[#063275] group-hover:ring-2 group-hover:ring-[#0d47a1]/30"
                  }`}
                  >
                    {phase.id}
                  </div>
                </div>

                <div className="text-center px-1 flex flex-col items-center flex-1 w-full">
                  <span className="block text-sm font-semibold text-slate-800 group-hover:text-primary transition-colors">
                    {phase.title}
                  </span>
                  <span className="block text-xs text-slate-500 mt-auto pt-1 font-medium">
                    {phase.duration}
                  </span>
                </div>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
