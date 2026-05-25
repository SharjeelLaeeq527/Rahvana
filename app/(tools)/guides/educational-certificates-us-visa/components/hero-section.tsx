"use client";
import React from "react";
import { motion } from "motion/react";
import { GraduationCap, Award, BookOpen, Plane, Sparkles, CheckCircle2 } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative pt-32 pb-20 overflow-hidden">
      {/* Decorative background elements - adjusted for dark teal background */}
      <div className="absolute top-0 inset-x-0 h-96 bg-linear-to-b from-white/5 to-transparent" />
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
      <div className="absolute top-1/4 -right-24 w-80 h-80 bg-[#32e0c4]/10 rounded-full blur-3xl" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-full mb-8 shadow-sm">
            <Sparkles className="w-4 h-4 text-[#32e0c4]" />
            <span className="text-sm font-bold text-white uppercase tracking-wider">
              US Student Visa Roadmap 2026
            </span>
          </div>

          <h1 className="text-4xl md:text-7xl font-black text-white mb-6 tracking-tight">
            Educational{" "}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-[#32e0c4] to-[#14a0a6]">
              Document Guide
            </span>
          </h1>

          <p className="max-w-2xl text-white/70 text-base md:text-lg leading-relaxed mb-10">
            A comprehensive, step-by-step journey for Pakistani students: from attesting
            certificates at HEC/IBCC to securing your F-1 Visa.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-4xl">
            {[
              {
                icon: GraduationCap,
                label: "Admission",
                value: "I-20 Support",
              },
              {
                icon: Award,
                label: "Verification",
                value: "HEC & IBCC",
              },
              {
                icon: BookOpen,
                label: "Evaluations",
                value: "WES & Test Scores",
              },
              {
                icon: Plane,
                label: "Journey",
                value: "F-1 Process",
              },
            ].map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + idx * 0.1, duration: 0.5 }}
                className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/10 shadow-sm hover:shadow-md transition-all group text-center"
              >
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                  <stat.icon className="w-5 h-5 text-[#32e0c4]" />
                </div>
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">
                  {stat.label}
                </p>
                <p className="text-sm font-black text-white">{stat.value}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
