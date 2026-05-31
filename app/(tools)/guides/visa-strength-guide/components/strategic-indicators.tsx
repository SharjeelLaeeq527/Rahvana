"use client";
import React from "react";
import { motion } from "motion/react";
import { CheckCircle2, XCircle, Info, Sparkles, AlertTriangle, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const GOLD_FLAGS = [
  {
    title: "Financial Co-mingling",
    desc: "Joint bank accounts with 6+ months of transaction history.",
    icon: Sparkles,
  },
  {
    title: "Joint Residency",
    desc: "Shared lease or utility bills showing both names at the same address.",
    icon: ShieldCheck,
  },
  {
    title: "Biological Children",
    desc: "Primary evidence that naturally creates a high-trust baseline.",
    icon: CheckCircle2,
  },
  {
    title: "Third-Party Affidavits",
    desc: "Letters from U.S. citizens/residents testifying to the marriage.",
    icon: Info,
  },
];

const RED_FLAGS = [
  {
    title: "A typical Age Gap",
    desc: "Differences larger than 15-20 years often trigger manual review.",
    icon: AlertTriangle,
  },
  {
    title: "Limited Contact",
    desc: "Less than 2-3 in-person meetings prior to the visa interview.",
    icon: XCircle,
  },
  {
    title: "Language Barriers",
    desc: "Inability to communicate in a shared language without a translator.",
    icon: XCircle,
  },
  {
    title: "Low Income",
    desc: "Sponsor earning below the 125% Federal Poverty Line requirement.",
    icon: AlertTriangle,
  },
];

export function StrategicIndicators() {
  return (
    <div className="grid lg:grid-cols-2 gap-12 mt-20">
      {/* Gold Flags */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        className="space-y-6"
      >
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-emerald-500/10 rounded-2xl">
            <Sparkles className="w-6 h-6 text-emerald-500" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 font-serif italic">
            The Gold Standards
          </h3>
        </div>
        <div className="grid gap-4">
          {GOLD_FLAGS.map((flag, idx) => (
            <div
              key={idx}
              className="group p-6 bg-white border border-slate-200 rounded-3xl hover:border-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/5 transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
                  <flag.icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 mb-1">{flag.title}</h4>
                  <p className="text-sm text-slate-500 leading-relaxed">{flag.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Red Flags */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        className="space-y-6"
      >
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-rose-500/10 rounded-2xl">
            <AlertTriangle className="w-6 h-6 text-rose-500" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 font-serif italic">Scrutiny Triggers</h3>
        </div>
        <div className="grid gap-4">
          {RED_FLAGS.map((flag, idx) => (
            <div
              key={idx}
              className="group p-6 bg-white border border-slate-200 rounded-3xl hover:border-rose-500/30 hover:shadow-xl hover:shadow-rose-500/5 transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="p-2 bg-rose-50 rounded-xl text-rose-600">
                  <flag.icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 mb-1">{flag.title}</h4>
                  <p className="text-sm text-slate-500 leading-relaxed">{flag.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
