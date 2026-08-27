"use client";
import React from "react";
import Script from "next/script";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import {
  CheckCircle,
  FileText,
  ChevronRight,
  ChevronLeft,
  Home,
  ShieldCheck,
  BadgeCheck,
  RotateCcw,
  Plane,
  Stamp,
  FileSearch,
  CreditCard,
} from "lucide-react";
import { HeroSection } from "./components/hero-section";

// --- Types & Config ---

type IconComponent = React.ComponentType<{ className?: string }> | React.FC<{ className?: string }>;

interface Step {
  id: string;
  title: string;
  shortTitle: string;
  icon: IconComponent;
  categories: {
    heading: string;
    items: { id: string; text: string; subtext?: string }[];
  }[];
  proTip?: string;
}

interface VantaEffectInstance {
  destroy: () => void;
}

interface VantaTopologyOptions {
  el: HTMLElement | null;
  mouseControls: boolean;
  touchControls: boolean;
  gyroControls: boolean;
  minHeight: number;
  minWidth: number;
  scale: number;
  scaleMobile: number;
  backgroundColor: number;
  color: number;
}

interface WindowWithVanta extends Window {
  VANTA?: {
    TOPOLOGY: (options: VantaTopologyOptions) => VantaEffectInstance;
  };
}

const STEPS: Step[] = [
  {
    id: "gathering",
    title: "1. Gathering Educational Documents",
    shortTitle: "Gather Docs",
    icon: FileText,
    categories: [
      {
        heading: "School Level Documents",
        items: [
          {
            id: "gen-1",
            text: "Matric (SSC) Certificate & Transcript",
            subtext:
              "Obtain from your BISE Board (e.g., Lahore Board, Karachi Board). Request original certificate + marksheet.",
          },
          {
            id: "gen-2",
            text: "Intermediate (HSSC) Certificate & Transcript",
            subtext: "Obtain from your BISE Board. Get original + detailed marksheet.",
          },
        ],
      },
      {
        heading: "University Level Documents",
        items: [
          {
            id: "gen-3",
            text: "Bachelor's Degree & Final Transcripts",
            subtext:
              "Obtain from your university (request sealed envelope with degree + official transcripts).",
          },
          {
            id: "gen-4",
            text: "Master's Degree & Transcripts (if applicable)",
            subtext: "Obtain from your university in sealed envelope format.",
          },
        ],
      },
      {
        heading: "Student Visa Specific",
        items: [
          {
            id: "admit-1",
            text: "I-20 Form (Original signed)",
            subtext: "Issued by your US university/college after admission",
          },
          { id: "admit-2", text: "Admission Letter", subtext: "From your US university/college" },
        ],
      },
    ],
    proTip:
      "Ensure names on all certificates match your passport exactly. Get an affidavit if there is any mismatch.",
  },
  {
    id: "attestation",
    title: "2. Attestation of Educational Certificates",
    shortTitle: "Attestation",
    icon: Stamp,
    categories: [
      {
        heading: "School Level (Matric & Intermediate)",
        items: [
          {
            id: "ibcc-1",
            text: "Apply online at ibcc.edu.pk",
            subtext: "Register and submit application",
          },
          {
            id: "ibcc-2",
            text: "IBCC Attestation",
            subtext:
              "For Matric & Intermediate certificates. Fee: PKR 2,000-5,000 per document. Submit originals + copies.",
          },
          {
            id: "ibcc-3",
            text: "Equivalence Certificate (if needed)",
            subtext: "For O/A Levels or foreign qualifications, apply at IBCC",
          },
        ],
      },
      {
        heading: "University Level (Bachelor's & above)",
        items: [
          {
            id: "hec-1",
            text: "Create account at eservices.hec.gov.pk",
            subtext: "Online portal for application",
          },
          {
            id: "hec-2",
            text: "HEC Attestation",
            subtext:
              "Upload degree & transcripts. HEC verifies with university. Fee: PKR 800-2,000 per document. Get final stamp.",
          },
        ],
      },
      {
        heading: "Final Attestation (Recommended)",
        items: [
          {
            id: "mofa-1",
            text: "MOFA Attestation",
            subtext:
              "After IBCC/HEC. Apply at mofa.gov.pk or MOFA camps. Increases credibility at US visa interview.",
          },
        ],
      },
    ],
    proTip:
      "Always keep photocopies of the stamped (attested) side. Urgent service available with extra fees.",
  },
  {
    id: "evaluation",
    title: "3. Credential Evaluation & Tests",
    shortTitle: "Evaluation",
    icon: FileSearch,
    categories: [
      {
        heading: "English Proficiency Tests",
        items: [
          {
            id: "test-1",
            text: "IELTS / TOEFL",
            subtext: "Take test from British Council, IDP or ETS",
          },
        ],
      },
      {
        heading: "Credential Evaluation (if required by university)",
        items: [
          {
            id: "eval-1",
            text: "Register at WES.org (or ECE / IEE)",
            subtext: "Create account for evaluation",
          },
          {
            id: "eval-2",
            text: "Send sealed & attested documents",
            subtext: "Request university/HEC to send sealed envelopes directly to WES",
          },
          {
            id: "eval-3",
            text: "Submit to evaluation agency",
            subtext: "Courier or direct submission to WES/ECE. Do NOT open sealed envelopes.",
          },
        ],
      },
    ],
    proTip:
      "Sealed envelopes from university/HEC must remain unopened for acceptance by WES or US schools.",
  },
  {
    id: "fees",
    title: "4. Fees Related to Education Path",
    shortTitle: "Fees",
    icon: CreditCard,
    categories: [
      {
        heading: "Student Visa Fees",
        items: [
          {
            id: "sevis-1",
            text: "SEVIS I-901 Fee ($350)",
            subtext: "Pay online at fmjfee.com after receiving I-20",
          },
          { id: "visa-1", text: "MRV Visa Fee ($185)", subtext: "Pay via Allied Bank in Pakistan" },
        ],
      },
    ],
    proTip: "Fees are non-refundable. Pay SEVIS only after I-20 is issued.",
  },
  {
    id: "interview",
    title: "5. DS-160 & Interview Preparation",
    shortTitle: "Interview",
    icon: Plane,
    categories: [
      {
        heading: "Online Application",
        items: [
          {
            id: "final-1",
            text: "Complete DS-160 Form",
            subtext: "Accurately fill education history at ceac.state.gov",
          },
          {
            id: "final-2",
            text: "Schedule appointment",
            subtext: "Book slot at US Embassy Islamabad or Consulate Karachi",
          },
        ],
      },
      {
        heading: "Documents to Carry to Interview",
        items: [
          { id: "emb-1", text: "I-20 (Original signed)" },
          { id: "emb-2", text: "Passport & DS-160 Confirmation Page" },
          {
            id: "emb-3",
            text: "Attested Educational Certificates & Transcripts",
            subtext:
              "Originals + IBCC/HEC/MOFA attested copies. Carry all from Matric to highest degree.",
          },
          { id: "emb-4", text: "SEVIS & MRV Payment Receipts" },
        ],
      },
      {
        heading: "Where Educational Documents Are Submitted",
        items: [
          {
            id: "sub-1",
            text: "US University / College",
            subtext: "Upload scanned attested copies during admission + send sealed originals",
          },
          {
            id: "sub-2",
            text: "DS-160 Online Form",
            subtext: "Upload scanned copies of attested certificates",
          },
          {
            id: "sub-3",
            text: "US Embassy Visa Interview",
            subtext: "Bring originals + attested photocopies to interview (Islamabad or Karachi)",
          },
        ],
      },
    ],
    proTip:
      "Clearly explain your study plan and strong ties to Pakistan. Be honest about your education history.",
  },
];

export default function USVisaEducationalGuidePage() {
  const [activeTab, setActiveTab] = React.useState<number>(0);
  const [checkedItems, setCheckedItems] = React.useState<string[]>([]);

  const vantaRef = React.useRef<HTMLDivElement>(null);
  const [scriptsLoaded, setScriptsLoaded] = React.useState(false);

  React.useEffect(() => {
    let vantaInstance: VantaEffectInstance | null = null;

    if (!vantaInstance && scriptsLoaded && typeof window !== "undefined") {
      const vantaLib = (window as WindowWithVanta).VANTA;
      if (vantaLib?.TOPOLOGY && vantaRef.current) {
        vantaInstance = vantaLib.TOPOLOGY({
          el: vantaRef.current,
          mouseControls: true,
          touchControls: true,
          gyroControls: false,
          minHeight: 200.0,
          minWidth: 200.0,
          scale: 1.0,
          scaleMobile: 1.0,
          backgroundColor: 0x055b5e,
          color: 0x89964e,
        }) as VantaEffectInstance;
      }
    }

    return () => {
      if (vantaInstance) vantaInstance.destroy();
    };
  }, [scriptsLoaded]);

  React.useEffect(() => {
    const saved = localStorage.getItem("usa-edu-guide-progress");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.checked) setCheckedItems(parsed.checked);
        if (parsed.currentStep !== undefined) setActiveTab(parsed.currentStep);
      } catch (e) {
        console.error("Failed to load progress", e);
      }
    }
  }, []);

  React.useEffect(() => {
    localStorage.setItem(
      "usa-edu-guide-progress",
      JSON.stringify({
        checked: checkedItems,
        currentStep: activeTab,
      })
    );
  }, [checkedItems, activeTab]);

  const toggleChecked = (id: string) => {
    setCheckedItems((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const getProgress = () => {
    const totalItems = STEPS.reduce(
      (acc, step) => acc + step.categories.reduce((cAcc, cat) => cAcc + cat.items.length, 0),
      0
    );
    return Math.round((checkedItems.length / totalItems) * 100);
  };

  const resetProgress = () => {
    if (confirm("Reset all progress?")) {
      setCheckedItems([]);
      setActiveTab(0);
      localStorage.removeItem("usa-edu-guide-progress");
    }
  };

  const currentStep = STEPS[activeTab];

  return (
    <div className="min-h-screen font-sans relative bg-[#055b5e]">
      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.4.1/p5.min.js"
        strategy="beforeInteractive"
      />
      <Script
        src="https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.topology.min.js"
        strategy="afterInteractive"
        onLoad={() => setScriptsLoaded(true)}
      />

      <div ref={vantaRef} className="fixed inset-0 z-0 w-full h-full" />

      <div className="relative z-10 w-full h-full">
        <HeroSection />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-32">
        {/* Breadcrumb & Progress */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 mt-8">
          <nav className="flex items-center gap-2 text-sm text-white/60">
            <Link href="/" className="hover:text-white transition-colors">
              <Home className="w-4 h-4" />
            </Link>
            <ChevronRight className="w-4 h-4 text-white/30" />
            <Link href="/guides" className="hover:text-white font-medium">
              Guides
            </Link>
            <ChevronRight className="w-4 h-4 text-white/30" />
            <span className="text-white font-black tracking-tight border-b-4 border-[#89964e]/50 uppercase text-xs">
              US Education Certificates Guide
            </span>
          </nav>

          <div className="flex items-center gap-4 bg-white/10 backdrop-blur-xl px-6 py-3 rounded-2xl border border-white/20 shadow-xl shrink-0">
            <div className="text-left">
              <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-0.5">
                Progress
              </p>
              <p className="text-sm font-black text-white">{getProgress()}% Completed</p>
            </div>
            <div className="w-32 h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${getProgress()}%` }}
                className="h-full bg-gradient-to-r from-[#89964e] to-[#a4b44b]"
              />
            </div>
            <button
              onClick={resetProgress}
              className="p-2 hover:bg-white/10 rounded-lg text-white/40 hover:text-rose-400 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Stepper Navigation - Now 5 columns again */}
        <div className="hidden lg:grid grid-cols-5 gap-4 mb-12">
          {STEPS.map((step, idx) => (
            <button
              key={step.id}
              onClick={() => setActiveTab(idx)}
              className={cn(
                "group relative p-6 rounded-3xl border-2 transition-all flex flex-col items-center text-center gap-3 overflow-hidden",
                activeTab === idx
                  ? "bg-white border-white text-[#055b5e] shadow-2xl scale-105"
                  : idx < activeTab
                    ? "bg-[#89964e]/40 border-white/20 text-white"
                    : "bg-black/20 border-white/10 text-white/50 hover:border-white/40 hover:text-white"
              )}
            >
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                  activeTab === idx ? "bg-[#89964e]/10" : "bg-white/10 group-hover:bg-white/20"
                )}
              >
                <step.icon
                  className={cn(
                    "w-5 h-5",
                    activeTab === idx ? "text-[#055b5e]" : "text-white/60 group-hover:text-white"
                  )}
                />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest leading-none">
                {step.shortTitle}
              </span>

              {STEPS[idx].categories.every((cat) =>
                cat.items.every((i) => checkedItems.includes(i.id))
              ) && (
                <div className="absolute top-2 right-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                </div>
              )}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-12 items-start text-left">
          <div className="lg:col-span-2 order-2 lg:order-1">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, scale: 0.98, x: 20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.98, x: -20 }}
                className="bg-white/10 backdrop-blur-2xl rounded-[3rem] p-8 lg:p-12 border border-white/20 shadow-2xl relative overflow-hidden"
              >
                <div className="absolute -right-16 -top-16 opacity-[0.15] rotate-12">
                  <currentStep.icon className="w-64 h-64 text-[#89964e]" />
                </div>

                <div className="relative z-10">
                  <div className="flex items-center gap-6 mb-12">
                    <div className="w-16 h-16 rounded-3xl bg-white flex items-center justify-center text-[#055b5e] shadow-xl shrink-0">
                      <currentStep.icon className="w-8 h-8" />
                    </div>
                    <div>
                      <span className="text-[10px] font-black text-[#89964e] uppercase tracking-[0.2em] bg-white/10 px-3 py-1 rounded-full mb-2 inline-block">
                        Step {activeTab + 1} of {STEPS.length}
                      </span>
                      <h2 className="text-3xl lg:text-4xl font-black text-white tracking-tight">
                        {currentStep.title}
                      </h2>
                    </div>
                  </div>

                  <div className="space-y-16">
                    {currentStep.categories.map((cat, catIdx) => (
                      <div key={catIdx} className="space-y-6">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-1.5 bg-[#89964e] rounded-full" />
                          <h4 className="font-black text-white text-sm tracking-tight uppercase">
                            {cat.heading}
                          </h4>
                        </div>

                        <div className="grid gap-3">
                          {cat.items.map((item) => {
                            const isChecked = checkedItems.includes(item.id);
                            return (
                              <div
                                key={item.id}
                                onClick={() => toggleChecked(item.id)}
                                className={cn(
                                  "group flex items-start gap-5 p-6 rounded-4xl border-2 transition-all cursor-pointer",
                                  isChecked
                                    ? "bg-[#89964e]/20 border-[#89964e]/40 shadow-sm"
                                    : "bg-white/5 border-white/5 hover:border-white/20 hover:bg-white/10"
                                )}
                              >
                                <div
                                  className={cn(
                                    "mt-1 w-6 h-6 rounded-[10px] border-2 flex items-center justify-center shrink-0 transition-all shadow-sm",
                                    isChecked
                                      ? "bg-[#89964e] border-[#89964e] text-slate-900"
                                      : "border-white/20 bg-transparent group-hover:border-white/40"
                                  )}
                                >
                                  {isChecked && <CheckCircle className="w-4 h-4" />}
                                </div>
                                <div className="flex flex-col text-left">
                                  <span
                                    className={cn(
                                      "text-base leading-tight tracking-tight",
                                      isChecked
                                        ? "text-white font-bold"
                                        : "text-white/80 font-semibold"
                                    )}
                                  >
                                    {item.text}
                                  </span>
                                  {item.subtext && (
                                    <span className="text-xs text-white/40 mt-1 font-medium">
                                      {item.subtext}
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-20 pt-10 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-6">
                    <button
                      disabled={activeTab === 0}
                      onClick={() => {
                        setActiveTab((prev) => prev - 1);
                        window.scrollTo({ top: 400, behavior: "smooth" });
                      }}
                      className={cn(
                        "w-full sm:w-auto flex items-center justify-center gap-2 px-10 py-5 rounded-2xl font-black text-sm transition-all",
                        activeTab === 0
                          ? "opacity-30 cursor-not-allowed"
                          : "hover:bg-white/10 text-white border-2 border-white/20"
                      )}
                    >
                      <ChevronLeft className="w-5 h-5" />
                      Back
                    </button>

                    {activeTab < STEPS.length - 1 ? (
                      <button
                        onClick={() => {
                          setActiveTab((prev) => prev + 1);
                          window.scrollTo({ top: 400, behavior: "smooth" });
                        }}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-12 py-5 rounded-2xl bg-white text-[#055b5e] font-black text-sm hover:scale-[1.03] active:scale-[0.97] transition-all shadow-xl shadow-black/20"
                      >
                        Next: {STEPS[activeTab + 1].shortTitle}
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    ) : (
                      <button
                        onClick={() => alert("Guide Complete! Good luck with your US studies.")}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-12 py-5 rounded-2xl bg-emerald-600 text-white font-black text-sm hover:scale-[1.03] active:scale-[0.97] transition-all shadow-xl shadow-emerald-600/20"
                      >
                        Finish Guide
                        <BadgeCheck className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 order-1 lg:order-2 space-y-6 lg:sticky lg:top-24 text-left">
            <div className="bg-white/10 backdrop-blur-2xl rounded-[2.5rem] border border-white/20 p-8 shadow-xl relative overflow-hidden">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-white rounded-xl">
                  <ShieldCheck className="w-5 h-5 text-[#055b5e]" />
                </div>
                <h3 className="font-black text-white text-lg tracking-tight">Quick Tip</h3>
              </div>
              <p className="text-sm font-bold text-white/70 leading-relaxed mb-8">
                {currentStep.proTip}
              </p>
            </div>

            <div className="bg-white rounded-[2.5rem] p-8 text-[#055b5e] shadow-xl">
              <h4 className="font-black text-lg mb-4 tracking-tight">Official Websites</h4>
              <div className="space-y-3">
                {[
                  { name: "HEC Portal", url: "https://eservices.hec.gov.pk" },
                  { name: "IBCC Portal", url: "https://ibcc.edu.pk" },
                  { name: "DS-160 Form", url: "https://ceac.state.gov" },
                  { name: "SEVIS Fee", url: "https://fmjfee.com" },
                  { name: "US Embassy Pakistan", url: "https://pk.usembassy.gov" },
                ].map((link, idx) => (
                  <a
                    key={idx}
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-4 bg-[#055b5e]/5 hover:bg-[#055b5e]/10 rounded-2xl transition-all group border border-[#055b5e]/10"
                  >
                    <span className="text-xs font-black uppercase tracking-widest">
                      {link.name}
                    </span>
                    <ChevronRight className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-all text-[#055b5e]" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
