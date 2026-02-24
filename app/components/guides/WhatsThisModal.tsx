import React, { useState, useEffect } from "react";
import { X, Info, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface WhatsThisData {
  heading: string;
  sub: string;
  description: string;
  quick_instructions: string[];
  disclaimer: string;
}

interface WhatsThisModalProps {
  open: boolean;
  onClose: () => void;
  data: WhatsThisData;
  documentLabel?: string;
}

interface ExpandSectionProps {
  title: string;
  subtitle?: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function ExpandSection({
  title,
  subtitle,
  isOpen,
  onToggle,
  children,
}: ExpandSectionProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 backdrop-blur-sm overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-white/5 transition-colors"
        aria-expanded={isOpen}
      >
        <div>
          <div className="text-sm font-extrabold tracking-wide text-white/95 uppercase">
            {title}
          </div>
          {subtitle ? (
            <div className="mt-1 text-sm text-white/70">{subtitle}</div>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-white/80">
            {isOpen ? "Hide" : "Learn more"}
          </span>
          <span
            className={[
              "inline-flex h-9 w-9 items-center justify-center rounded-xl",
              "bg-white/10 border border-white/10 text-white/85 transition-transform",
              isOpen ? "rotate-180" : "rotate-0",
            ].join(" ")}
            aria-hidden="true"
          >
            {/* chevron */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M6 9l6 6 6-6"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </div>
      </button>

      <div
        className={[
          "grid transition-[grid-template-rows] duration-300 ease-out",
          isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        ].join(" ")}
      >
        <div className="overflow-hidden">
          <div className="px-5 pb-5 pt-0">{children}</div>
        </div>
      </div>
    </div>
  );
}

/** Custom icons (inline SVG) */
function ShieldCheckIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12 2l7 4v6c0 5-3 9-7 10-4-1-7-5-7-10V6l7-4z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M8.5 12l2.2 2.2L15.8 9.1"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ClipboardIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M9 4h6a2 2 0 0 1 2 2v1H7V6a2 2 0 0 1 2-2z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M7 7h10v13a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V7z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M9.5 11h5M9.5 14h5M9.5 17h3.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function FolderCheckIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M3 7a2 2 0 0 1 2-2h5l2 2h9a2 2 0 0 1 2-2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M9 14l2 2 4-4"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface FeatureCardProps {
  title: string;
  subtitle: string;
  variant?: "teal" | "blue" | "amber";
  Icon: React.ElementType;
}

function FeatureCard({
  title,
  subtitle,
  variant = "teal",
  Icon,
}: FeatureCardProps) {
  const styles: Record<string, Record<string, string>> = {
    teal: {
      card: "bg-emerald-600 border-emerald-500/60",
      iconWrap: "bg-white/15 border-white/20 text-white",
      title: "text-white",
      sub: "text-white/85",
    },
    blue: {
      card: "bg-sky-600 border-sky-500/60",
      iconWrap: "bg-white/15 border-white/20 text-white",
      title: "text-white",
      sub: "text-white/85",
    },
    amber: {
      card: "bg-amber-700 border-amber-700/60",
      iconWrap: "bg-white/15 border-white/20 text-white",
      title: "text-white",
      sub: "text-white/85",
    },
  };

  const style = styles[variant];

  return (
    <div
      className={[
        "rounded-2xl border backdrop-blur-sm p-4 flex gap-3",
        "shadow-[0_16px_34px_rgba(0,0,0,0.22)]",
        style.card,
      ].join(" ")}
    >
      <span
        className={[
          "h-11 w-11 rounded-2xl grid place-items-center shrink-0",
          "border shadow-[0_12px_24px_rgba(0,0,0,0.18)]",
          style.iconWrap,
        ].join(" ")}
        aria-hidden="true"
      >
        <Icon className="w-6 h-6" />
      </span>

      <div className="min-w-0 text-left flex-1">
        <div
          className={[
            "text-sm font-extrabold leading-snug whitespace-nowrap overflow-hidden text-ellipsis",
            style.title,
          ].join(" ")}
        >
          {title}
        </div>
        <div
          className={["mt-1 text-xs leading-relaxed text-left", style.sub].join(
            " ",
          )}
        >
          {subtitle}
        </div>
      </div>
    </div>
  );
}

const WhatsThisModal = ({
  open,
  onClose,
  data,
  documentLabel = "Document",
}: WhatsThisModalProps) => {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const [openDoc, setOpenDoc] = useState(false);
  const [openSteps, setOpenSteps] = useState(false);

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const handleClose = () => {
    if (dontShowAgain && typeof window !== "undefined") {
      localStorage.setItem("hide_whats_this_modal", "true");
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 bg-teal-900/60 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-labelledby="whats-this-welcome-title"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.96, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.96, y: 20 }}
            transition={{ type: "spring", bounce: 0.2, duration: 0.45 }}
            className={[
              "w-full max-w-5xl",
              "max-h-[88vh] overflow-hidden flex flex-col relative",
              "rounded-3xl shadow-2xl",
              "border border-white/10",
              "bg-linear-to-br from-[#062f31] via-[#0b5c5f] to-[#0d7478]",
            ].join(" ")}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-5 right-5 z-20">
              <button
                onClick={handleClose}
                className="p-2 rounded-2xl bg-white/10 border border-white/10 hover:bg-white/15 transition-colors focus:outline-none focus:ring-2 focus:ring-white/50 backdrop-blur-md shadow-sm"
                aria-label="Close modal"
                type="button"
              >
                <X className="w-5 h-5 text-white/85" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar w-full">
              <div className="px-6 pt-12 pb-4 bg-linear-to-b from-black/15 to-transparent backdrop-blur-sm">
                <div className="text-center">
                  <h2
                    id="whats-this-welcome-title"
                    className="text-3xl md:text-4xl font-black tracking-tight text-white mb-3"
                  >
                    {data.heading}
                  </h2>
                  <p className="mt-2 text-sm md:text-base text-white/75 max-w-3xl mx-auto leading-relaxed flex items-center justify-center gap-2">
                    {data.sub}{" "}
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  </p>

                  {/* Feature boxes universally applicable */}
                  <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 max-w-5xl mx-auto">
                    <FeatureCard
                      variant="teal"
                      title="Avoid Pitfalls"
                      subtitle="Find out common mistakes that cause rejections."
                      Icon={ShieldCheckIcon}
                    />
                    <FeatureCard
                      variant="blue"
                      title="Personalized Checklist"
                      subtitle="See exactly what you need for your situation."
                      Icon={ClipboardIcon}
                    />
                    <FeatureCard
                      variant="amber"
                      title="Clear Steps"
                      subtitle="A tailored roadmap for the process."
                      Icon={FolderCheckIcon}
                    />
                  </div>
                </div>
              </div>

              {/* Body content */}
              <div className="px-6 pb-6 mt-4">
                <div className="space-y-4 max-w-4xl mx-auto">
                  <ExpandSection
                    title={`What is a ${documentLabel}?`}
                    subtitle="Expand to see the description."
                    isOpen={openDoc}
                    onToggle={() => setOpenDoc((v) => !v)}
                  >
                    <div className="text-[14px] md:text-[15px] leading-relaxed text-white/85 space-y-3 pt-2">
                      <p>{data.description}</p>
                    </div>
                  </ExpandSection>

                  <ExpandSection
                    title="Quick Overview"
                    subtitle="Fast, step-by-step. Expand to see the flow."
                    isOpen={openSteps}
                    onToggle={() => setOpenSteps((v) => !v)}
                  >
                    <ol className="space-y-3 pt-2">
                      {data.quick_instructions.map((text, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-4 p-3 md:p-4 rounded-2xl bg-white/10 border border-white/10"
                        >
                          <span
                            className="flex h-8 w-8 items-center justify-center rounded-xl font-extrabold text-sm text-[#062f31]
                                     bg-linear-to-b from-[#efe3c2] to-[#f6edd5] shadow-sm shrink-0 mt-0.5"
                            aria-hidden="true"
                          >
                            {idx + 1}
                          </span>
                          <p className="text-[14px] md:text-[15px] leading-snug text-white/90 font-medium pt-1.5">
                            {text}
                          </p>
                        </li>
                      ))}
                    </ol>
                  </ExpandSection>

                  {/* Solid yellow disclaimer card */}
                  <div className="rounded-2xl border border-yellow-300 bg-yellow-300 p-5 mt-6 shadow-md">
                    <div className="flex items-start gap-3">
                      <Info className="w-6 h-6 text-yellow-900 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[15px] font-extrabold text-yellow-950">
                          Important Note
                        </p>
                        <p className="mt-1.5 text-[14px] leading-relaxed text-yellow-950/90 font-medium">
                          {data.disclaimer}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Footer controls */}
                  <div className="pt-6 mt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                    <label className="flex items-center gap-3 cursor-pointer select-none group">
                      <div className="relative flex items-center justify-center">
                        <input
                          type="checkbox"
                          checked={dontShowAgain}
                          onChange={(e) => setDontShowAgain(e.target.checked)}
                          className="peer w-5 h-5 appearance-none rounded border-2 border-white/30 bg-white/10 checked:bg-emerald-500 checked:border-emerald-500 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                        />
                        <svg
                          className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      </div>
                      <span className="text-sm font-medium text-white/80 group-hover:text-white transition-colors">
                        Don&apos;t show this again
                      </span>
                    </label>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={handleClose}
                        className="px-6 py-3 md:py-2.5 rounded-xl font-semibold bg-white/10 hover:bg-white/20 text-white transition-all border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/50"
                        type="button"
                      >
                        Not now
                      </button>
                      <button
                        onClick={handleClose}
                        className="px-6 py-3 md:py-2.5 rounded-xl font-bold bg-white text-[#062f31] hover:bg-gray-100 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)] focus:outline-none focus:ring-2 focus:ring-white/50"
                        type="button"
                      >
                        Start Wizard
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default WhatsThisModal;
