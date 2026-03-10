"use client";

import React from "react";
import { motion } from "framer-motion";
import * as Icons from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background font-sans text-foreground pb-20">
      {/* HERO SECTION */}
      <section className="relative pt-20 pb-16 md:pt-32 md:pb-24 overflow-hidden bg-background">
        <div className="absolute top-0 right-0 w-96 h-96 bg-rahvana-primary-pale/30 rounded-full blur-[100px] pointer-events-none -z-10 translate-x-1/3 -translate-y-1/3"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-rahvana-primary-pale/20 rounded-full blur-[80px] pointer-events-none -z-10 -translate-x-1/2 translate-y-1/2"></div>

        <div className="container mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="inline-flex items-center gap-2 px-5 py-2 mb-8 text-sm font-semibold rounded-full bg-rahvana-primary-pale text-rahvana-primary"
          >
            <Icons.Info className="w-4 h-4" />
            About Rahvana
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
            className="text-4xl md:text-6xl font-extrabold text-foreground mb-6"
          >
            Simplifying Your <br className="hidden md:block" />
            <span className="bg-linear-to-r from-rahvana-primary to-rahvana-primary-light bg-clip-text text-fill-transparent">
              Immigration Journey
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
            className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto"
          >
            We are a comprehensive immigration assistant—a platform where we
            provide the essential tools, expert guides, and dedicated services
            you need for your visa process.
          </motion.p>
        </div>
      </section>

      {/* MISSION & VISION */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="relative"
            >
              <div className="absolute -inset-4 bg-rahvana-primary-pale/40 rounded-[2rem] -z-10 transform scale-105"></div>
              <div className="bg-card border border-border rounded-3xl p-8 md:p-12 shadow-xl">
                <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-rahvana-primary to-rahvana-primary-light flex items-center justify-center mb-8 shadow-lg">
                  <Icons.Target className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold mb-6 text-foreground">
                  Our Platforms Purpose
                </h2>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  Navigating the complexities of immigration can be
                  overwhelming. Rahvana was built to be your trusted immigration
                  assistant, guiding you step-by-step through the process.
                  Whether working on family visas, business immigration, or
                  student status, we provide clear tools, comprehensive guides,
                  and reliable services.
                </p>
              </div>
            </motion.div>

            <div className="flex flex-col gap-6 md:gap-8">
              {[
                {
                  icon: Icons.Compass,
                  title: "Expert Guides",
                  desc: "Step-by-step instructions customized for your specific visa category.",
                },
                {
                  icon: Icons.Wrench,
                  title: "Smart Tools",
                  desc: "Calculators, status checkers, and analyzers to empower your decisions.",
                },
                {
                  icon: Icons.LifeBuoy,
                  title: "Dedicated Services",
                  desc: "Comprehensive support designed to ease the burden of paperwork and tracking.",
                },
              ].map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.15 }}
                  className="flex gap-6 items-start group"
                >
                  <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-card border border-border flex items-center justify-center group-hover:border-rahvana-primary group-hover:bg-rahvana-primary-pale transition-all">
                    <item.icon className="w-6 h-6 text-rahvana-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-rahvana-primary transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* IMPORTANT DISCLAIMER */}
      <section className="py-12 md:py-20 bg-muted/20">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="max-w-4xl mx-auto rounded-3xl overflow-hidden relative shadow-2xl bg-linear-to-br from-rahvana-primary to-rahvana-primary-light"
          >
            <div className="p-8 md:p-14 text-white relative z-10 flex flex-col md:flex-row items-center gap-10">
              <div className="shrink-0 w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30 shadow-inner">
                <Icons.Scale className="w-12 h-12 text-white" />
              </div>
              <div className="text-center md:text-left">
                <h2 className="text-2xl md:text-3xl font-bold mb-4">
                  Important Disclaimer
                </h2>
                <p className="text-white/90 text-lg leading-relaxed font-medium">
                  Rahvana is an immigration assistant designed to simplify your
                  journey. While we provide expert-level guidance and tools to
                  assist you, <strong>we are not a law firm</strong>. Our
                  platform does not constitute legal advice. We always recommend
                  consulting a licensed attorney for complex legal cases.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
