import React from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, ShieldCheck, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ToolCTAProps {
  badge?: string;
  headline?: string;
  description?: string;
  buttonText?: string;
  buttonHref?: string;
  variant?: "primary" | "secondary" | "card";
  className?: string;
}

export default function ToolCTA({
  badge = "Rahvana Visa Engine",
  headline = "Check Your U.S. Spouse Visa Eligibility & Timeline",
  description = "Get an instant step-by-step breakdown of your IR-1 / CR-1 journey, mandatory civil documents, and case strength score in under 2 minutes.",
  buttonText = "Start Free Case Strength Check →",
  buttonHref = "/visa-category/ir1-journey",
  variant = "primary",
  className = "",
}: ToolCTAProps) {
  if (variant === "card") {
    return (
      <div
        className={cn(
          "relative my-8 overflow-hidden rounded-2xl border border-teal-500/30 bg-slate-900/95 p-6 text-slate-100 shadow-lg sm:p-8",
          className
        )}
      >
        <div className="flex items-center gap-2 text-xs font-bold tracking-wider uppercase text-teal-400">
          <Wrench className="h-4 w-4" />
          <span>{badge}</span>
        </div>
        <h3 className="mt-3 text-xl font-bold text-white sm:text-2xl">{headline}</h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-300 sm:text-base">{description}</p>
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <Link
            href={buttonHref}
            className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-teal-900/30 transition-all hover:bg-teal-500 hover:shadow-teal-500/20"
          >
            <span>{buttonText}</span>
          </Link>
          {/* <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-teal-400" />
            No credit card required
          </span> */}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative my-10 overflow-hidden rounded-3xl border border-teal-500/25 bg-gradient-to-r from-slate-950 via-[#062c28] to-slate-950 p-8 text-white shadow-xl sm:p-10",
        className
      )}
    >
      {/* Ambient background glow accents */}
      <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-teal-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-teal-600/10 blur-3xl" />

      <div className="relative max-w-3xl">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-500/30 bg-teal-500/15 px-3.5 py-1 text-xs font-semibold tracking-wide text-teal-300 backdrop-blur-md">
          <Wrench className="h-3.5 w-3.5" />
          {badge}
        </span>
        <h3 className="mt-4 text-2xl font-bold tracking-tight text-white sm:text-3xl">
          {headline}
        </h3>
        <p className="mt-3 text-base text-slate-300 sm:text-lg">{description}</p>

        <div className="mt-6 grid grid-cols-1 gap-2 text-sm text-slate-300 sm:grid-cols-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-teal-400" />
            <span>NVC & NADRA Civil Document OCR Check</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-teal-400" />
            <span>Form I-864 Joint Sponsor Income Calculator</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-teal-400" />
            <span>US Embassy Islamabad 221(g) Risk Analyzer</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-teal-400" />
            <span>Personalized Interactive Journey Roadmap</span>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-4">
          <Link
            href={"/visa-category/ir1-journey"}
            className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-7 py-3.5 text-base font-semibold text-white shadow-lg shadow-teal-950/40 transition-all hover:scale-[1.02] hover:bg-teal-500"
          >
            <span>Explore Journey Roadmap</span>
          </Link>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-6 py-3.5 text-base font-medium text-white backdrop-blur-sm transition-all hover:bg-white/20"
          >
            <span>Explore Pricing & Plans</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
