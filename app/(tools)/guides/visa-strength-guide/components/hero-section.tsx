"use client";
import React from "react";
import { motion } from "motion/react";
import { LampContainer } from "@/components/ui/lamp";
import { ShieldCheck, Heart, Sparkles, Star, Target, Crown } from "lucide-react";

export function HeroSection() {
  return (
    <LampContainer>
      <motion.div
        initial={{ opacity: 0.5, y: 100 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{
          delay: 0.3,
          duration: 0.8,
          ease: "easeInOut",
        }}
        className="mt-8 bg-linear-to-br from-slate-300 to-slate-500 py-4 bg-clip-text text-center text-4xl font-medium tracking-tight text-transparent md:text-7xl"
      >
        <div className="flex flex-col items-center gap-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="flex items-center gap-4"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-cyan-500/20 blur-2xl rounded-full" />
              <div className="relative p-4 bg-white/5 backdrop-blur-xl rounded-[2rem] border border-white/10 shadow-2xl">
                <ShieldCheck className="w-12 h-12 text-cyan-400" />
              </div>
            </div>
            <div className="h-12 w-px bg-white/10" />
            <div className="relative">
              <div className="absolute inset-0 bg-rose-500/20 blur-2xl rounded-full" />
              <div className="relative p-4 bg-white/5 backdrop-blur-xl rounded-[2rem] border border-white/10 shadow-2xl">
                <Crown className="w-12 h-12 text-amber-400" />
              </div>
            </div>
          </motion.div>

          <div className="space-y-4">
            <h1 className="text-white font-black drop-shadow-2xl leading-tight">
              Spouse Visa <br />
              <span className="bg-linear-to-r from-cyan-400 via-white to-amber-300 bg-clip-text text-transparent">
                Adjudication Strategy
              </span>
            </h1>
            <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto font-medium leading-relaxed">
              Master the internal logic of USCIS and NVC. This guide reveals the metrics used to
              weigh your case strength.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 mt-4">
            <div className="flex items-center gap-2 text-slate-300">
              <Target className="w-5 h-5 text-cyan-400" />
              <span className="text-sm font-bold uppercase tracking-widest">Target: Approval</span>
            </div>
            <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
            <div className="flex items-center gap-2 text-slate-300">
              <Star className="w-5 h-5 text-amber-400" />
              <span className="text-sm font-bold uppercase tracking-widest">Premium Logic</span>
            </div>
          </div>
        </div>
      </motion.div>
    </LampContainer>
  );
}
