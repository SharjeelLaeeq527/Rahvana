"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Info,
  Plus,
  Minus,
  TrendingUp,
  FileSearch,
  Users,
  Briefcase,
  History,
  FileText,
  Calendar,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RiskFactor {
  id: string;
  label: string;
  weight: number;
  description: string;
  category: string;
  icon: any;
}

const RISK_FACTORS_LIST: RiskFactor[] = [
  {
    id: "age_gap",
    label: "Significant Age Gap (>10 years)",
    weight: -15,
    category: "Relationship",
    icon: Calendar,
    description:
      "Large age differences are often scrutinized for fraud. Requires more evidence of shared interests.",
  },
  {
    id: "limited_visits",
    label: "Limited In-Person Visits (<2)",
    weight: -20,
    category: "Relationship",
    icon: Users,
    description:
      "Lack of physical meetings is a major red flag for 'bona fide' marriage requirements.",
  },
  {
    id: "low_income",
    label: "Sponsor Income < 125% Poverty Line",
    weight: -25,
    category: "Financial",
    icon: Briefcase,
    description: "Mandatory requirement. Requires a joint sponsor to avoid RFE or denial.",
  },
  {
    id: "imm_violations",
    label: "Prior Immigration Violations",
    weight: -30,
    category: "History",
    icon: History,
    description: "Overstays or deportations may require complex waivers (I-601/I-601A).",
  },
  {
    id: "weak_docs",
    label: "Minimal Joint Financial Evidence",
    weight: -15,
    category: "Documentation",
    icon: FileText,
    description:
      "Lack of shared accounts, leases, or insurance makes proving a shared life harder.",
  },
  {
    id: "stable_job",
    label: "Long-term Stable Employment",
    weight: 10,
    category: "Financial",
    icon: Briefcase,
    description: "Strengthens public charge assessment.",
  },
  {
    id: "long_marriage",
    label: "Married > 2 Years",
    weight: 15,
    category: "Relationship",
    icon: Lock,
    description: "Qualifies for IR-1 (10-year card) and generally viewed as more stable.",
  },
  {
    id: "shared_child",
    label: "Common Children (Biological)",
    weight: 30,
    category: "Relationship",
    icon: Users,
    description: "Strongest piece of evidence for a bona-fide relationship.",
  },
];

export function StrengthAnalyzer() {
  const [selectedFactors, setSelectedFactors] = useState<string[]>([]);
  const [showDetails, setShowDetails] = useState<string | null>(null);

  const baseScore = 65; // Starting average
  const currentScore = selectedFactors.reduce((acc, factorId) => {
    const factor = RISK_FACTORS_LIST.find((f) => f.id === factorId);
    return acc + (factor?.weight || 0);
  }, baseScore);

  const clampedScore = Math.min(Math.max(currentScore, 0), 100);

  const getScoreStatus = () => {
    if (clampedScore >= 80)
      return {
        label: "Strong",
        color: "text-emerald-500",
        bg: "bg-emerald-500",
        desc: "Your case appears robust. Focus on maintaining consistency.",
      };
    if (clampedScore >= 55)
      return {
        label: "Moderate",
        color: "text-amber-500",
        bg: "bg-amber-500",
        desc: "A solid baseline, but some risk factors need mitigation with extra evidence.",
      };
    return {
      label: "Critical",
      color: "text-rose-500",
      bg: "bg-rose-500",
      desc: "Significant red flags detected. Legal consultation is highly recommended.",
    };
  };

  const status = getScoreStatus();

  const toggleFactor = (id: string) => {
    setSelectedFactors((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };

  return (
    <div className="bg-slate-900 rounded-[2.5rem] overflow-hidden border border-slate-800 shadow-2xl">
      <div className="p-8 lg:p-12">
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Left: Score Display */}
          <div className="lg:w-[350px] shrink-0">
            <div className="relative aspect-square flex flex-col items-center justify-center">
              {/* Score Ring */}
              <svg className="w-full h-full -rotate-90">
                <circle
                  cx="50%"
                  cy="50%"
                  r="45%"
                  className="fill-none stroke-slate-800 stroke-[4]"
                />
                <motion.circle
                  cx="50%"
                  cy="50%"
                  r="45%"
                  initial={{ strokeDasharray: "0 1000" }}
                  animate={{ strokeDasharray: `${(clampedScore / 100) * 282} 1000` }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className={cn(
                    "fill-none stroke-[8] stroke-linecap-round",
                    clampedScore >= 80
                      ? "stroke-emerald-400"
                      : clampedScore >= 55
                        ? "stroke-amber-400"
                        : "stroke-rose-400"
                  )}
                />
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <motion.span
                  key={clampedScore}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-7xl font-black text-white"
                >
                  {clampedScore}
                </motion.span>
                <span
                  className={cn("text-xl font-bold uppercase tracking-widest mt-2", status.color)}
                >
                  {status.label}
                </span>
              </div>
            </div>

            <div className="mt-8 p-6 bg-white/5 rounded-3xl border border-white/10">
              <div className="flex items-center gap-3 mb-3 text-white">
                <Info className="w-5 h-5 text-cyan-400" />
                <span className="font-bold">Initial Outlook</span>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">{status.desc}</p>
            </div>
          </div>

          {/* Right: Factors Selection */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-bold text-white mb-1">Scenario Builder</h3>
                <p className="text-slate-400 text-sm">
                  Select factors that apply to your current situation
                </p>
              </div>
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-cyan-500/10 rounded-full border border-cyan-500/20 text-cyan-400 text-[10px] font-bold uppercase tracking-wider">
                <TrendingUp className="w-3 h-3" />
                Real-time Analysis
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {RISK_FACTORS_LIST.map((factor) => {
                const isSelected = selectedFactors.includes(factor.id);
                const Icon = factor.icon;

                return (
                  <div
                    key={factor.id}
                    className={cn(
                      "relative group p-4 rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden",
                      isSelected
                        ? "bg-white/10 border-white/20 shadow-lg"
                        : "bg-slate-800/50 border-slate-700 hover:border-slate-500"
                    )}
                    onClick={() => toggleFactor(factor.id)}
                  >
                    <div className="flex items-center justify-between gap-4 relative z-10">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "p-2 rounded-lg transition-colors",
                            isSelected
                              ? "bg-white text-slate-900"
                              : "bg-slate-700 text-slate-400 group-hover:bg-slate-600"
                          )}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <span
                          className={cn(
                            "text-xs font-bold transition-colors",
                            isSelected ? "text-white" : "text-slate-400 group-hover:text-slate-300"
                          )}
                        >
                          {factor.label}
                        </span>
                      </div>
                      <div
                        className={cn(
                          "w-5 h-5 rounded-full flex items-center justify-center",
                          isSelected ? "bg-emerald-500 text-white" : "bg-slate-700 text-slate-500"
                        )}
                      >
                        {isSelected ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : (
                          <Plus className="w-3 h-3" />
                        )}
                      </div>
                    </div>

                    <div className="mt-3 relative z-10 flex justify-between items-center">
                      <span
                        className={cn(
                          "text-[9px] font-bold px-2 py-0.5 rounded-full uppercase",
                          factor.weight > 0
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-rose-500/10 text-rose-400"
                        )}
                      >
                        {factor.weight > 0 ? "+" : ""}
                        {factor.weight} Impact
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowDetails(showDetails === factor.id ? null : factor.id);
                        }}
                        className="text-slate-500 hover:text-white transition-colors"
                      >
                        <Info className="w-3 h-3" />
                      </button>
                    </div>

                    <AnimatePresence>
                      {showDetails === factor.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="mt-3 overflow-hidden"
                        >
                          <p className="text-[10px] text-slate-400 bg-black/20 p-2 rounded-lg border border-white/5 leading-normal">
                            {factor.description}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 pt-8 border-t border-white/10">
              <div className="p-4 bg-cyan-500/5 border border-cyan-500/10 rounded-2xl flex items-start gap-4">
                <div className="p-2 bg-cyan-500/20 rounded-xl">
                  <FileSearch className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h4 className="text-white font-bold text-sm mb-1">How this is calculated</h4>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    This score reflects adjudicator sentiment based on USCIS Policy Manual and INA
                    §212(a) standards. It estimates the likelihood of receiving an interview
                    approval without further administrative processing.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
