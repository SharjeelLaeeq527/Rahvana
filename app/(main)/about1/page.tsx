"use client";

import { motion } from "framer-motion";
import * as Icons from "lucide-react";

export default function AboutPage() {
  return (
    <div className="w-full">
      {/* HERO */}
      <section className="py-24 px-6 md:px-16 bg-white">
        <div className="max-w-6xl mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-5xl font-bold mb-6"
          >
            Simplifying Immigration Journeys
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-gray-600 text-lg max-w-3xl mx-auto"
          >
            Rahvana is a technology-driven platform that helps individuals
            navigate complex immigration processes through intelligent tools,
            structured guidance, and reliable resources.
          </motion.p>
        </div>
      </section>

      {/* STORY */}
      <section className="py-20 px-6 md:px-16 bg-gray-50">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-14 items-center">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold mb-4">Our Story</h2>

            <p className="text-gray-600 mb-4">
              Immigration processes are often confusing, time-consuming, and
              stressful. Applicants frequently struggle with unclear
              requirements, documentation issues, and unreliable information.
            </p>

            <p className="text-gray-600">
              Rahvana was created to solve this challenge. By combining
              technology with structured guidance, we aim to make immigration
              preparation simple, transparent, and accessible for everyone.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="bg-primary text-white p-10 rounded-2xl"
          >
            <h3 className="text-xl font-semibold mb-3">What Rahvana Means</h3>

            <p className="opacity-90">
              Rahvana represents a journey toward opportunity. Our platform
              helps individuals explore global pathways with clarity,
              confidence, and the right guidance.
            </p>
          </motion.div>
        </div>
      </section>

      {/* MISSION & VISION */}
      <section className="py-24 px-6 md:px-16 bg-white">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="border rounded-2xl p-10"
          >
            <h3 className="text-2xl font-bold mb-4 text-primary">
              Our Mission
            </h3>

            <p className="text-gray-600">
              To simplify immigration journeys through technology, transparency,
              and intelligent tools that empower people to pursue opportunities
              across borders.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            viewport={{ once: true }}
            className="border rounded-2xl p-10"
          >
            <h3 className="text-2xl font-bold mb-4 text-primary">Our Vision</h3>

            <p className="text-gray-600">
              To become a trusted global platform that connects people with the
              right immigration knowledge, tools, and resources to build their
              future internationally.
            </p>
          </motion.div>
        </div>
      </section>

      {/* VALUES */}
      <section className="py-24 px-6 md:px-16 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-3">Our Core Values</h2>
            <p className="text-gray-600">
              The principles that guide everything we build.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                title: "Transparency",
                text: "Clear and understandable immigration guidance without unnecessary complexity.",
              },
              {
                title: "Accessibility",
                text: "Everyone deserves access to reliable immigration information.",
              },
              {
                title: "Empowerment",
                text: "We empower people to take control of their immigration journey.",
              },
              {
                title: "Innovation",
                text: "Using technology to simplify global mobility.",
              },
            ].map((value, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15 }}
                viewport={{ once: true }}
                className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-lg transition"
              >
                <h4 className="font-semibold text-lg mb-2 text-primary">
                  {value.title}
                </h4>
                <p className="text-gray-600 text-sm">{value.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY RAHVANA */}
      <section className="py-24 px-6 md:px-16 bg-white">
        <div className="max-w-5xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-3xl font-bold mb-6"
          >
            Why Rahvana Exists
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            viewport={{ once: true }}
            className="text-gray-600 text-lg"
          >
            Immigration systems are complex and difficult to navigate. Rahvana
            exists to bring clarity, structure, and intelligent tools to the
            process so individuals can move forward with confidence.
          </motion.p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 md:px-16 bg-primary text-white text-center">
        <motion.h2
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-3xl font-bold mb-4"
        >
          Start Your Immigration Journey
        </motion.h2>

        <p className="opacity-90 mb-8">
          Explore immigration pathways and tools designed to simplify your
          journey.
        </p>

        <button className="bg-white text-primary font-semibold px-6 py-3 rounded-full hover:scale-105 transition">
          Explore Tools
        </button>
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
