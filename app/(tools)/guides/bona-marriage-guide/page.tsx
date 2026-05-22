"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import {
  Heart,
  Info,
  ExternalLink,
  Wallet,
  Check,
  ChevronRight,
  ChevronLeft,
  UserCheck,
  Sparkles,
  Zap,
  Home,
  BadgeCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { FlickeringGrid } from "@/components/magicui/flickering-grid";

// --- Types ---
interface Step {
  id: string;
  title: string;
  shortTitle: string;
  count: string;
  description: string;
  icon:
    | React.ComponentType<{ className?: string }>
    | React.FunctionComponent<{ className?: string }>;
  sections: {
    heading: string;
    items: { id: string; text: string; subtext?: string }[];
  }[];
  proTip: string;
}

// --- Steps Data ---
const STEPS: Step[] = [
  {
    id: "overview",
    title: "1. Relationship Foundation",
    shortTitle: "Foundation",
    count: "01",
    description: "Initial phase focusing on your history and ongoing communication.",
    icon: Info,
    sections: [
      {
        heading: "Communication Records",
        items: [
          {
            id: "com-1",
            text: "WhatsApp & Messenger Logs",
            subtext: "Spanning 2-3 years of history.",
          },
          {
            id: "com-2",
            text: "International Call Records",
            subtext: "Skype, WhatsApp, or carrier logs.",
          },
          {
            id: "com-3",
            text: "Emails & Social Media",
            subtext: "Joint posts, tags, and threads.",
          },
        ],
      },
      {
        heading: "Meeting Proofs",
        items: [
          { id: "meet-1", text: "Photos of Meetings", subtext: "Candid shots in public places." },
          { id: "meet-2", text: "Gift Receipts & Cards", subtext: "Courtship period exchanges." },
        ],
      },
    ],
    proTip: "USCIS looks for a pattern. Consistency is more important than single big events.",
  },
  {
    id: "marriage",
    title: "2. The Legal Union",
    shortTitle: "Marriage",
    count: "02",
    description: "Documentation related to the wedding ceremony in Pakistan.",
    icon: Heart,
    sections: [
      {
        heading: "Legal Documents",
        items: [
          { id: "leg-1", text: "Original Nikah Nama", subtext: "Union Council registered." },
          { id: "leg-2", text: "NADRA MRC", subtext: "Computerized certificate." },
          { id: "leg-3", text: "English Translations", subtext: "Certified for all Urdu files." },
        ],
      },
      {
        heading: "Social Proof",
        items: [
          { id: "soc-1", text: "Wedding Photo Album", subtext: "20-50 high-quality photos." },
          { id: "soc-2", text: "Invitation Cards", subtext: "Digital or physical prints." },
          { id: "soc-3", text: "Guest List & Receipts", subtext: "Proves a public event." },
        ],
      },
    ],
    proTip: "Photos should include elders to show cultural and family acceptance.",
  },
  {
    id: "integration",
    title: "3. Shared Life & Finances",
    shortTitle: "Integration",
    count: "03",
    description: "Proving financial commingling and shared responsibilities.",
    icon: Wallet,
    sections: [
      {
        heading: "Financial Evidence",
        items: [
          { id: "fin-1", text: "Joint Bank Accounts", subtext: "Statements showing shared funds." },
          { id: "fin-2", text: "Money Transfers", subtext: "Wise, Western Union receipts." },
          { id: "fin-3", text: "Insurance Beneficiary", subtext: "Spouse named on policies." },
        ],
      },
      {
        heading: "Shared Living",
        items: [
          { id: "trav-1", text: "Travel Records", subtext: "Flight tickets and bookings." },
          { id: "trav-2", text: "Lease Agreements", subtext: "Listing both spouses." },
        ],
      },
    ],
    proTip: "Financial commingling is often the strongest evidence for USCIS.",
  },
  {
    id: "final",
    title: "4. Interview Mastery",
    shortTitle: "Interview",
    count: "04",
    description: "Preparing the physical file and mastering the consular interview.",
    icon: UserCheck,
    sections: [
      {
        heading: "File Organization",
        items: [
          { id: "org-1", text: "Chronological Sorting", subtext: "Recent evidence on top." },
          { id: "org-2", text: "Labeled Dividers", subtext: "Easy for the officer to navigate." },
          { id: "org-3", text: "Photo Captions", subtext: "Explain who and where." },
        ],
      },
      {
        heading: "Interview Skills",
        items: [
          { id: "int-1", text: "Consistent Narrative", subtext: "Match dates with DS-260." },
          {
            id: "int-2",
            text: "Carry Originals",
            subtext: "Keep original files for verification.",
          },
        ],
      },
    ],
    proTip: "Confidence comes from knowing your case. Rehearse dates together.",
  },
];

export default function BonaMarriageGuidePage() {
  const [activeTab, setActiveTab] = useState(0);
  const [checkedItems, setCheckedItems] = useState<string[]>([]);

  const toggleChecked = (id: string) => {
    setCheckedItems((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const getProgress = () => {
    const totalItems = STEPS.reduce(
      (acc, step) => acc + step.sections.reduce((sAcc, sec) => sAcc + sec.items.length, 0),
      0
    );
    return totalItems === 0 ? 0 : Math.round((checkedItems.length / totalItems) * 100);
  };

  const currentStep = STEPS[activeTab];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans selection:bg-[#32e0c4]/30 overflow-hidden">
      {/* Magic UI Flickering Grid Background */}
      <div className="fixed inset-0 z-0 opacity-40">
        <FlickeringGrid
          className="size-full"
          squareSize={4}
          gridGap={6}
          color="#055b5e"
          maxOpacity={0.4}
          minOpacity={0.15}
          flickerChance={0.05}
        />
      </div>

      {/* Hero Section - Balanced */}
      <section className="relative pt-28 pb-16 overflow-hidden z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex flex-col items-center text-center"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#055b5e]/10 backdrop-blur-md border border-[#055b5e]/20 rounded-full mb-8 shadow-sm"
            >
              <Sparkles className="w-4 h-4 text-[#14a0a6]" />
              <span className="text-xs font-bold text-[#055b5e] dark:text-[#32e0c4] uppercase tracking-wider">
                Bona Fide Marriage Guide 2026
              </span>
            </motion.div>

            <h1 className="text-4xl md:text-7xl font-black text-[#055b5e] dark:text-white mb-6 tracking-tight">
              Relationship{" "}
              <span className="text-transparent bg-clip-text bg-linear-to-r from-[#14a0a6] via-[#32e0c4] to-[#14a0a6] bg-size-[200%_auto] animate-gradient-x">
                Evidence
              </span>
            </h1>
            <p className="max-w-2xl text-slate-500 text-base md:text-lg mb-10 font-medium leading-relaxed">
              Transform your shared history into a professional evidence file. A comprehensive
              roadmap for IR1/CR1 applicants from Pakistan.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-3xl text-left">
              {[
                { icon: Info, label: "Phase 1", value: "History" },
                { icon: Heart, label: "Phase 2", value: "Nikah Nama" },
                { icon: Wallet, label: "Phase 3", value: "Shared Life" },
                { icon: UserCheck, label: "Phase 4", value: "Interview" },
              ].map((stat, idx) => (
                <div
                  key={idx}
                  className="bg-white/80 dark:bg-white/5 backdrop-blur-md p-5 rounded-4xl border border-slate-200/50 shadow-sm transition-all hover:border-[#14a0a6]/30"
                >
                  <stat.icon className="w-5 h-5 text-[#14a0a6] mb-3" />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">
                    {stat.label}
                  </p>
                  <p className="text-sm font-black text-[#055b5e] dark:text-white">{stat.value}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Main Content Area - Premium Spacing */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-32">
        {/* Navigation & Progress */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
          <nav className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
            <Link href="/" className="hover:text-[#055b5e] transition-colors">
              <Home className="w-4 h-4" />
            </Link>
            <ChevronRight className="w-3 h-3 text-slate-300" />
            <span className="text-[#055b5e] dark:text-white bg-[#14a0a6]/10 px-3 py-1 rounded-full">
              Guide Roadmap
            </span>
          </nav>

          <div className="flex items-center gap-6 group">
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                Profile Strength
              </p>
              <p className="text-sm font-black text-[#14a0a6]">{getProgress()}% Verified</p>
            </div>
            <div className="w-40 h-3 bg-white/50 dark:bg-white/5 rounded-full p-0.5 border border-slate-200 dark:border-white/10 shadow-inner overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${getProgress()}%` }}
                className="h-full bg-linear-to-r from-[#055b5e] via-[#14a0a6] to-[#32e0c4] rounded-full shadow-[0_0_10px_#14a0a680]"
              />
            </div>
          </div>
        </div>

        {/* Unique Sliding Stepper */}
        <div className="hidden lg:grid grid-cols-4 gap-6 mb-12 relative">
          {STEPS.map((step, idx) => (
            <button
              key={step.id}
              onClick={() => setActiveTab(idx)}
              className={cn(
                "group relative p-7 rounded-[2.5rem] transition-all duration-500 flex flex-col items-center text-center gap-4 overflow-hidden",
                activeTab === idx
                  ? "text-white shadow-2xl shadow-[#055b5e]/20"
                  : "bg-white/40 dark:bg-white/5 text-slate-500 hover:text-[#055b5e] hover:bg-white hover:scale-[1.02]"
              )}
            >
              {/* Animated Background Indicator */}
              {activeTab === idx && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute inset-0 bg-[#055b5e] z-0"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}

              <div
                className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 relative z-10",
                  activeTab === idx
                    ? "bg-white/20 text-white"
                    : "bg-slate-100 dark:bg-white/10 text-slate-400 group-hover:bg-[#14a0a6]/10 group-hover:text-[#14a0a6]"
                )}
              >
                <step.icon className="w-6 h-6" />
              </div>

              <div className="flex flex-col font-black relative z-10">
                <span
                  className={cn(
                    "text-[10px] uppercase tracking-[0.3em] mb-1 transition-colors",
                    activeTab === idx ? "text-[#32e0c4]" : "text-[#14a0a6]"
                  )}
                >
                  Phase {step.count}
                </span>
                <span className="text-sm tracking-tight leading-none uppercase">
                  {step.shortTitle}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Enhanced Content Card */}
        <div className="grid lg:grid-cols-4 gap-12 items-start relative">
          <div className="lg:col-span-3 relative group">
            {/* Border Beam Glow Effect */}
            <div className="absolute -inset-0.5 bg-linear-to-r from-[#14a0a6] via-[#32e0c4] to-[#055b5e] rounded-[3.1rem] opacity-30 group-hover:opacity-100 transition-opacity duration-500 blur-sm pointer-events-none" />

            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, scale: 0.98, x: 20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.98, x: -20 }}
                transition={{ duration: 0.4, ease: "anticipate" }}
                className="bg-white/95 dark:bg-slate-900/90 backdrop-blur-3xl rounded-[3rem] p-8 lg:p-14 relative overflow-hidden shadow-2xl"
              >
                <div className="relative z-10">
                  <div className="flex flex-col md:flex-row md:items-center gap-10 mb-16">
                    <motion.div
                      initial={{ rotate: -15, scale: 0.8 }}
                      animate={{ rotate: 0, scale: 1 }}
                      className="w-20 h-20 rounded-4xl bg-linear-to-br from-[#055b5e] to-[#14a0a6] flex items-center justify-center text-white shadow-2xl shadow-[#055b5e]/40 shrink-0"
                    >
                      <currentStep.icon className="w-10 h-10" />
                    </motion.div>
                    <div className="text-left">
                      <Badge className="bg-[#14a0a6]/10 text-[#14a0a6] border-none mb-4 uppercase font-black tracking-widest px-4 py-1.5 rounded-full">
                        Optimization Phase {currentStep.count}
                      </Badge>
                      <h2 className="text-4xl font-black text-[#055b5e] dark:text-white leading-none tracking-tighter mb-4">
                        {currentStep.title}
                      </h2>
                      <p className="text-slate-500 dark:text-slate-400 text-lg font-medium max-w-xl">
                        {currentStep.description}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-16">
                    {currentStep.sections.map((sec, secIdx) => (
                      <div key={secIdx} className="space-y-8 text-left">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-1.5 bg-[#14a0a6] rounded-full shadow-[0_0_15px_#14a0a6]" />
                          <h4 className="font-black text-[#055b5e] dark:text-white text-lg tracking-tight uppercase leading-none">
                            {sec.heading}
                          </h4>
                        </div>

                        <div className="flex flex-col gap-4">
                          {sec.items.map((item, itemIdx) => {
                            const isChecked = checkedItems.includes(item.id);
                            return (
                              <motion.div
                                key={item.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.05 * itemIdx }}
                                onClick={() => toggleChecked(item.id)}
                                className={cn(
                                  "group relative flex items-center gap-6 p-6 rounded-2xl border transition-all duration-400 cursor-pointer overflow-hidden",
                                  isChecked
                                    ? "bg-[#055b5e]/5 border-[#055b5e]/20 shadow-[0_4px_20px_-4px_rgba(5,91,94,0.1)]"
                                    : "bg-white dark:bg-white/2 border-slate-100 dark:border-white/5 hover:border-[#14a0a6]/30 hover:shadow-xl hover:shadow-slate-200/50"
                                )}
                              >
                                {/* Left Status Indicator */}
                                <div
                                  className={cn(
                                    "w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 transition-all duration-500",
                                    isChecked
                                      ? "bg-[#055b5e] border-[#055b5e] text-white rotate-360"
                                      : "bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-300 group-hover:border-[#14a0a6]"
                                  )}
                                >
                                  {isChecked ? (
                                    <Check className="w-6 h-6 stroke-3" />
                                  ) : (
                                    <div className="w-2 h-2 rounded-full bg-slate-200" />
                                  )}
                                </div>

                                {/* Content */}
                                <div className="flex-1 text-left">
                                  <div className="flex items-center gap-3 mb-1">
                                    <span
                                      className={cn(
                                        "text-base font-bold tracking-tight transition-colors duration-300",
                                        isChecked
                                          ? "text-[#055b5e] dark:text-[#32e0c4]"
                                          : "text-slate-800 dark:text-white"
                                      )}
                                    >
                                      {item.text}
                                    </span>
                                    {isChecked && (
                                      <Badge className="bg-emerald-500/10 text-emerald-600 border-none text-[8px] uppercase font-black px-2 py-0">
                                        Verified
                                      </Badge>
                                    )}
                                  </div>
                                  {item.subtext && (
                                    <p className="text-sm text-slate-400 dark:text-slate-500 font-medium leading-tight">
                                      {item.subtext}
                                    </p>
                                  )}
                                </div>

                                {/* Right Side Metadata */}
                                <div className="hidden sm:flex flex-col items-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">
                                    Requirement
                                  </span>
                                  <BadgeCheck
                                    className={cn(
                                      "w-5 h-5",
                                      isChecked ? "text-[#14a0a6]" : "text-slate-200"
                                    )}
                                  />
                                </div>

                                {/* Glass Highlight */}
                                <div className="absolute inset-x-0 bottom-0 h-px bg-linear-to-r from-transparent via-[#14a0a6]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                              </motion.div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination Controls */}
                  <div className="mt-20 pt-10 border-t border-slate-100 dark:border-white/10 flex items-center justify-between">
                    <button
                      disabled={activeTab === 0}
                      onClick={() => setActiveTab((prev) => prev - 1)}
                      className={cn(
                        "flex items-center gap-3 px-10 py-5 rounded-3xl font-black text-sm transition-all duration-300",
                        activeTab === 0
                          ? "opacity-20 cursor-not-allowed"
                          : "text-slate-500 hover:text-[#055b5e] bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:shadow-xl"
                      )}
                    >
                      <ChevronLeft className="w-5 h-5" /> Back
                    </button>
                    <button
                      onClick={() => {
                        if (activeTab < STEPS.length - 1) setActiveTab((prev) => prev + 1);
                        else alert("Success! Your evidence roadmap is complete.");
                      }}
                      className="flex items-center gap-3 px-12 py-5 rounded-3xl bg-linear-to-r from-[#055b5e] to-[#14a0a6] text-white font-black text-sm hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-[#055b5e]/30"
                    >
                      {activeTab < STEPS.length - 1
                        ? `Next: ${STEPS[activeTab + 1].shortTitle}`
                        : "Generate Checklist"}{" "}
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Sidebar - Pro Panels */}
          <div className="lg:col-span-1 space-y-8 sticky top-24">
            <motion.div
              whileHover={{ y: -5 }}
              className="bg-[#055b5e] rounded-[3rem] p-10 text-left relative overflow-hidden shadow-2xl"
            >
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <Zap className="w-32 h-32 text-white" />
              </div>
              <div className="flex items-center gap-4 mb-8 relative z-10">
                <div className="p-3 bg-white/10 rounded-[1.2rem]">
                  <Sparkles className="w-6 h-6 text-[#32e0c4]" />
                </div>
                <h3 className="font-black text-white text-xl tracking-tight">Expert Strategy</h3>
              </div>
              <p className="text-lg font-bold text-white/90 leading-relaxed relative z-10 italic">
                &quot;{currentStep.proTip}&quot;
              </p>
            </motion.div>

            <div className="bg-white dark:bg-white/5 rounded-[3rem] p-10 text-left shadow-2xl border border-slate-100 dark:border-white/10">
              <h4 className="font-black text-xl text-[#055b5e] dark:text-white mb-8 tracking-tighter uppercase">
                Verified Links
              </h4>
              <div className="space-y-4">
                {[
                  { name: "USCIS Policy Manual", url: "#" },
                  { name: "Embassy Guides", url: "#" },
                  { name: "DS-260 Simulator", url: "#" },
                ].map((link, idx) => (
                  <motion.a
                    key={idx}
                    href={link.url}
                    whileHover={{ x: 5 }}
                    className="flex items-center justify-between p-5 bg-slate-50 dark:bg-white/5 rounded-3xl group hover:bg-[#14a0a6] transition-all border border-slate-100 dark:border-white/10 shadow-sm"
                  >
                    <span className="text-xs font-black uppercase tracking-widest text-slate-500 group-hover:text-white">
                      {link.name}
                    </span>
                    <ExternalLink className="w-5 h-5 text-slate-300 group-hover:text-white transition-all" />
                  </motion.a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
