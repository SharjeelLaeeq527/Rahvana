"use client";

import React from "react";
import Link from "next/link";
import { Map, Wrench, ArrowRight, Sparkles, X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { motion } from "framer-motion";

export const journeyHref = "/visa-category/ir-category/ir1-journey";
export const toolsHref = "/tools";

interface PlatformChoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const options = [
  {
    id: "journey",
    icon: Map,
    badge: "Recommended for beginners",
    badgeColor: "bg-teal-50 text-teal-700 border border-teal-200",
    iconBg: "bg-gradient-to-br from-teal-500 to-teal-700",
    title: "Start the Guided Journey",
    tagline: "I'm not sure where to begin",
    description:
      "The guided journey walks you through the entire IR-1 visa process from start to finish — in plain, simple language. It tells you exactly what to do at each stage, keeps track of your progress, and surfaces the right tool or resource at exactly the right moment.",
    bestFor: "Best if you're new to this, feeling overwhelmed, or want a clear step-by-step plan.",
    cta: "Start the Roadmap",
    href: journeyHref,
    ctaStyle:
      "bg-gradient-to-r from-teal-600 to-teal-500 text-white shadow-[0_8px_20px_rgba(13,115,119,0.28)] hover:shadow-[0_10px_26px_rgba(13,115,119,0.38)]",
    borderActive: "border-teal-500/40 bg-teal-50/40",
  },
  {
    id: "resources",
    icon: Wrench,
    badge: "For experienced users",
    badgeColor: "bg-slate-100 text-slate-600 border border-slate-200",
    iconBg: "bg-gradient-to-br from-slate-500 to-slate-700",
    title: "Browse Tools & Resources",
    tagline: "I know what I need help with",
    description:
      "If you already understand the process and just need help with one specific task — like filling out a form, calculating a fee, or checking a checklist — you can jump directly into our individual tools and guides without going through the full journey.",
    bestFor:
      "Best if you know exactly where you are in the process and want targeted, focused help.",
    cta: "Browse Resources",
    href: toolsHref,
    ctaStyle:
      "bg-white border border-slate-300 text-slate-800 hover:bg-slate-50 hover:border-slate-400",
    borderActive: "border-slate-300 bg-white",
  },
] as const;

export function PlatformChoiceModal({ isOpen, onClose }: PlatformChoiceModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-full max-w-2xl bg-white rounded-3xl p-0 gap-0 overflow-hidden border border-gray-200 shadow-2xl max-h-[95vh] overflow-y-auto scrollbar-premium">
        {/* Header */}
        <div className="relative px-6 pt-7 pb-5 border-b border-gray-100">
          {/* Subtle gradient accent */}
          <div className="absolute inset-0 bg-gradient-to-br from-teal-50/60 via-white to-white pointer-events-none" />

          <div className="relative flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 border border-teal-200 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-teal-700">
                  <Sparkles size={11} />
                  Before you continue
                </span>
              </div>
              <DialogTitle className="text-xl md:text-2xl font-extrabold text-gray-900 leading-tight">
                How would you like to use Rahvana?
              </DialogTitle>
              <p className="mt-1.5 text-sm text-gray-500 leading-relaxed max-w-md">
                We offer two ways to help you — pick whichever fits where you are right now.
                You can always switch later.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex-shrink-0 mt-0.5 p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Option cards */}
        <div className="p-5 md:p-6 flex flex-col gap-4">
          {options.map((opt, i) => {
            const Icon = opt.icon;
            return (
              <motion.div
                key={opt.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08, duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                className={`rounded-2xl border-2 p-5 flex flex-col gap-3.5 transition-all ${opt.borderActive}`}
              >
                {/* Top row: icon + badge + title */}
                <div className="flex items-start gap-3.5">
                  <div
                    className={`flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center ${opt.iconBg}`}
                  >
                    <Icon size={20} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-0.5">
                      <h3 className="text-base font-extrabold text-gray-900 leading-tight">
                        {opt.title}
                      </h3>
                      <span
                        className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${opt.badgeColor}`}
                      >
                        {opt.badge}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-gray-400 italic">{opt.tagline}</p>
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm text-gray-600 leading-relaxed">{opt.description}</p>

                {/* Best for */}
                <div className="flex items-start gap-2 bg-gray-50 rounded-xl px-3.5 py-2.5 border border-gray-100">
                  <span className="text-teal-600 flex-shrink-0">•</span>
                  <p className="text-xs text-gray-600 leading-relaxed font-medium mt-1">
                    {opt.bestFor}
                  </p>
                </div>

                {/* CTA */}
                <Link
                  href={opt.href}
                  onClick={onClose}
                  className={`inline-flex items-center justify-center gap-2 w-full sm:w-auto self-start px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 no-underline ${opt.ctaStyle}`}
                >
                  {opt.cta}
                  <ArrowRight size={15} />
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* Footer note */}
        <div className="px-6 pb-6 pt-0">
          <p className="text-center text-xs text-gray-400">
            Not sure yet?{" "}
            <button
              type="button"
              onClick={onClose}
              className="underline underline-offset-2 hover:text-gray-600 transition-colors"
            >
              Close and explore the page
            </button>{" "}
            — you can always come back to this.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
