"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { motion } from "framer-motion";

export const journeyHref = "/visa-category/ir-category/ir1-journey";
export const toolsHref = "/resources";

interface PlatformChoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const options = [
  {
    id: "journey",
    title: "Guided Visa Journey",
    tagline: "Ideal for first-time applicants • Step-by-step roadmap",
    bestFor: "Beginners wanting a clear, stress-free step-by-step plan.",
    cta: "Start the Roadmap",
    href: journeyHref,
    image: "/assets/images/ir1-journey/guided-journey.png",
    ctaStyle:
      "bg-teal-600 hover:bg-teal-700 text-white shadow-[0_4px_12px_rgba(13,115,119,0.2)] hover:shadow-[0_6px_16px_rgba(13,115,119,0.35)]",
    cardClass: "border-teal-200 bg-teal-50/50 hover:border-teal-400 hover:bg-teal-50/85 text-teal-950 shadow-sm hover:shadow-md",
    taglineClass: "text-teal-600 font-bold",
    bestForClass: "bg-teal-100/50 border border-teal-200/60 text-teal-900",
    bulletColor: "text-teal-600",
  },
  {
    id: "resources",
    title: "Tools & Resources",
    tagline: "For experienced users • Direct access to features",
    bestFor: "Anyone wanting immediate, targeted help with a specific task.",
    cta: "Browse Resources",
    href: toolsHref,
    image: "/assets/images/ir1-journey/browse-tool-resources.png",
    ctaStyle:
      "bg-slate-800 hover:bg-slate-900 text-white shadow-[0_4px_12px_rgba(30,41,59,0.15)] hover:shadow-[0_6px_16px_rgba(30,41,59,0.25)]",
    cardClass: "border-indigo-200 bg-indigo-50/50 hover:border-indigo-400 hover:bg-indigo-50/85 text-slate-950 shadow-sm hover:shadow-md",
    taglineClass: "text-indigo-600 font-bold",
    bestForClass: "bg-indigo-100/50 border border-indigo-200/60 text-indigo-900",
    bulletColor: "text-indigo-600",
  },
] as const;

export function PlatformChoiceModal({ isOpen, onClose }: PlatformChoiceModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[95%] max-w-5xl bg-white rounded-3xl p-0 gap-0 overflow-hidden border border-gray-100 shadow-2xl max-h-[95vh] overflow-y-auto scrollbar-premium">
        {/* Header */}
        <div className="relative px-6 py-4 border-b border-gray-100">
          {/* Subtle gradient accent */}
          <div className="absolute inset-0 bg-gradient-to-br from-teal-50/20 via-white to-white pointer-events-none" />

          <div className="relative flex items-center justify-between gap-4">
            <DialogTitle className="text-lg md:text-xl font-extrabold text-gray-900 leading-tight">
              How would you like to use Rahvana?
            </DialogTitle>
            <button
              type="button"
              onClick={onClose}
              className="flex-shrink-0 p-1.5 rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Option cards */}
        <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
          {options.map((opt, i) => {
            return (
              <motion.div
                key={opt.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className={`group flex flex-col justify-between rounded-2xl border p-4 md:p-5 transition-all duration-300 ${opt.cardClass} hover:-translate-y-0.5`}
              >
                <div className="flex flex-col gap-3">
                  {/* Title & Tagline */}
                  <div className="flex flex-col gap-0.5">
                    <h3 className="text-base md:text-lg font-black text-gray-900 leading-tight">
                      {opt.title}
                    </h3>
                    <p className={`text-[10px] md:text-[11px] font-semibold tracking-wide ${opt.taglineClass}`}>
                      {opt.tagline}
                    </p>
                  </div>

                  {/* Image wrapper */}
                  <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-gray-100/60 bg-white">
                    <Image
                      src={opt.image}
                      alt={opt.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 450px"
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      priority={i === 0}
                    />
                  </div>

                  {/* Best for */}
                  <div className={`flex items-start gap-2 rounded-lg px-3 py-2 border ${opt.bestForClass}`}>
                    <span className={`font-bold text-xs mt-0.5 ${opt.bulletColor}`}>•</span>
                    <p className="text-[11px] leading-relaxed font-semibold">
                      Best for: {opt.bestFor}
                    </p>
                  </div>
                </div>

                {/* CTA Button */}
                <Link
                  href={opt.href}
                  onClick={onClose}
                  className={`mt-4 inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg text-xs font-bold transition-all duration-200 no-underline ${opt.ctaStyle}`}
                >
                  {opt.cta}
                  <ArrowRight
                    size={14}
                    className="transition-transform duration-200 group-hover:translate-x-0.5"
                  />
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* Footer note */}
        <div className="px-6 pb-4 pt-1">
          <p className="text-center text-[11px] text-gray-400">
            Not sure yet?{" "}
            <button
              type="button"
              onClick={onClose}
              className="underline underline-offset-2 hover:text-gray-600 transition-colors font-medium"
            >
              Close and explore the page
            </button>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
