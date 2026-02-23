import React, { useMemo, useState } from "react";
import { useWizard } from "../context/WizardContext";
import { CloseIcon, InfoIcon } from "./Icons";

function ExpandSection({ title, subtitle, isOpen, onToggle, children }) {
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
function ShieldCheckIcon({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
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

function ClipboardIcon({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
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

function FolderCheckIcon({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3 7a2 2 0 0 1 2-2h5l2 2h9a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z"
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

function FeatureCard({ title, subtitle, variant = "teal", Icon }) {
  const styles = {
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
  }[variant];

  return (
    <div
      className={[
        "rounded-2xl border backdrop-blur-sm p-4 flex gap-3",
        "shadow-[0_16px_34px_rgba(0,0,0,0.22)]",
        styles.card,
      ].join(" ")}
    >
      <span
        className={[
          "h-11 w-11 rounded-2xl grid place-items-center flex-shrink-0",
          "border shadow-[0_12px_24px_rgba(0,0,0,0.18)]",
          styles.iconWrap,
        ].join(" ")}
        aria-hidden="true"
      >
        <Icon className="w-6 h-6" />
      </span>

      <div className="min-w-0 text-left">
        <div className={["text-sm font-extrabold leading-snug whitespace-nowrap overflow-hidden text-ellipsis",styles.title,].join(" ")}>
          {title}
        </div>
        <div className={["mt-1 text-xs leading-relaxed text-left", styles.sub].join(" ")}>
          {subtitle}
        </div>
      </div>
    </div>
  );
}

export default function WelcomeModal() {
  const { showWelcomeModal, setShowWelcomeModal } = useWizard();
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const [openDoc, setOpenDoc] = useState(false);
  const [openSteps, setOpenSteps] = useState(false);

  const steps = useMemo(
    () => [
      "Tell us who needs the birth certificate and why.",
      "Get a tailored roadmap + checklist (what to request, verify, and upload).",
      "Validate the final certificate before submission.",
    ],
    []
  );

  if (!showWelcomeModal) return null;

  const handleClose = () => {
    if (dontShowAgain) localStorage.setItem("dont_show_welcome", "true");
    setShowWelcomeModal(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 bg-primary-900/45 backdrop-blur-lg"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bcw-welcome-title"
      onClick={handleClose}
    >
      <div
        className={[
          "w-full max-w-5xl",
          "max-h-[88vh] overflow-hidden",
          "rounded-3xl shadow-2xl",
          "border border-white/10",
          "bg-gradient-to-br from-[#062f31] via-[#0b5c5f] to-[#0d7478]",
        ].join(" ")}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 px-6 pt-6 pb-4 bg-gradient-to-b from-black/15 to-transparent backdrop-blur-sm">
          <div className="flex items-start justify-end">
            <button
              onClick={handleClose}
              className="p-2 rounded-2xl bg-white/10 border border-white/10 hover:bg-white/15 transition-colors"
              aria-label="Close modal"
              type="button"
            >
              <CloseIcon className="w-5 h-5 text-white/85" />
            </button>
          </div>

          <div className="mt-2 text-center">
            <h2
              id="bcw-welcome-title"
              className="text-3xl md:text-4xl font-black tracking-tight text-white"
            >
              Welcome to the Birth Certificate Document Wizard
            </h2>
            <p className="mt-3 text-sm md:text-base text-white/75 max-w-3xl mx-auto leading-relaxed">
              Let's get your birth certificate done correctly ✔
            </p>

            {/* Feature boxes (now unique colors + custom icons) */}
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-5xl mx-auto">
              <FeatureCard
                variant="teal"
                title="Avoid common rejections"
                subtitle="Catch missing fields & mismatches early"
                Icon={ShieldCheckIcon}
              />
              <FeatureCard
                variant="blue"
                title="Know exactly what to request"
                subtitle="Get the right office + the right ask"
                Icon={ClipboardIcon}
              />
              <FeatureCard
                variant="amber"
                title="Stay organized"
                subtitle="Use a checklist flow from start to upload"
                Icon={FolderCheckIcon}
              />
            </div>
          </div>
        </div>

        {/* Scroll area inside modal */}
        <div className="px-6 pb-6 overflow-y-auto max-h-[calc(88vh-230px)]">
          <div className="space-y-5 mt-2">
            <ExpandSection
              title="What is a Union Council Birth Certificate?"
              subtitle="A quick explanation of the document and why it matters for U.S. immigration."
              isOpen={openDoc}
              onToggle={() => setOpenDoc((v) => !v)}
            >
              <div className="text-[15px] leading-relaxed text-white/85 space-y-3">
                <p>
                  A <span className="font-semibold text-white">Union Council Birth Certificate</span> is an
                  official civil record issued by a local authority in Pakistan (Union Council / Municipal
                  authority). It typically includes the person’s name, date of birth, place of birth, and
                  parent information.
                </p>
                <p>
                  For U.S. immigration, it’s commonly used as{" "}
                  <span className="font-semibold text-white">primary evidence of birth</span> during USCIS/NVC
                  processing and may be requested at the embassy interview.
                </p>
              </div>
            </ExpandSection>

            <ExpandSection
              title="How to use this wizard"
              subtitle="Fast, step-by-step. Expand to see the flow."
              isOpen={openSteps}
              onToggle={() => setOpenSteps((v) => !v)}
            >
              <ol className="space-y-3">
                {steps.map((text, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-3 p-3 rounded-2xl bg-white/10 border border-white/10"
                  >
                    <span
                      className="flex h-8 w-8 items-center justify-center rounded-xl font-extrabold text-sm text-[#062f31]
                                 bg-gradient-to-b from-[#efe3c2] to-[#f6edd5] shadow-sm"
                      aria-hidden="true"
                    >
                      {idx + 1}
                    </span>
                    <p className="text-[15px] leading-snug text-white/85">{text}</p>
                  </li>
                ))}
              </ol>
            </ExpandSection>

            {/* Solid yellow disclaimer card */}
            <div className="rounded-2xl border border-yellow-300 bg-yellow-300 p-5">
              <div className="flex items-start gap-3">
                <InfoIcon className="w-5 h-5 text-yellow-900 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-extrabold text-yellow-950">
                    Important disclaimer
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-yellow-950/90">
                    This wizard provides general guidance based on publicly available information and common
                    real-world patterns. Requirements can vary by Union Council and may change over time.
                    Always confirm current requirements with your local office. This is not legal advice.
                  </p>
                </div>
              </div>
            </div>

            {/* Footer controls */}
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={dontShowAgain}
                  onChange={(e) => setDontShowAgain(e.target.checked)}
                  className="checkbox"
                />
                <span className="text-sm text-white/80">Don't show this again</span>
              </label>

              <div className="flex flex-col sm:flex-row gap-2 justify-end">
                <button onClick={handleClose} className="btn btn-secondary" type="button">
                  Not now
                </button>
                <button onClick={handleClose} className="btn btn-primary" type="button">
                  Start Wizard
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="pointer-events-none h-10 bg-gradient-to-t from-black/20 to-transparent" />
      </div>
    </div>
  );
}