"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Shield,
  Download,
  Clock,
  Briefcase,
  Heart,
  Landmark,
  Stethoscope,
  Camera,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useLanguage } from "@/app/context/LanguageContext";

// Animation Variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 50, damping: 20 },
  },
};

const cardHoverVariants = {
  initial: { y: 0, boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" },
  hover: {
    y: -8,
    boxShadow:
      "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
    transition: { type: "spring" as const, stiffness: 300, damping: 20 },
  },
};

export default function DocumentVaultGuidePage() {
  const { t } = useLanguage();

  // Data for Sections (Localized inside component)
  const features = [
    {
      icon: Zap,
      title: t("documentVaultPage.guide.features.personalization.title"),
      description: t(
        "documentVaultPage.guide.features.personalization.description",
      ),
      color: "bg-amber-100 text-amber-600",
    },
    {
      icon: Clock,
      title: t("documentVaultPage.guide.features.tracking.title"),
      description: t("documentVaultPage.guide.features.tracking.description"),
      color: "bg-rose-100 text-rose-600",
    },
    {
      icon: Download,
      title: t("documentVaultPage.guide.features.exports.title"),
      description: t("documentVaultPage.guide.features.exports.description"),
      color: "bg-emerald-100 text-emerald-600",
    },
  ];

  const categories = [
    {
      id: "civil",
      title: t("documentVaultPage.guide.coverage.categories.civil.title"),
      icon: Landmark,
      items:
        (t("documentVaultPage.guide.coverage.categories.civil.items", {
          returnObjects: true,
        }) as string[]) || [],
      color: "from-blue-500 to-cyan-500",
    },
    {
      id: "financial",
      title: t("documentVaultPage.guide.coverage.categories.financial.title"),
      icon: Briefcase,
      items:
        (t("documentVaultPage.guide.coverage.categories.financial.items", {
          returnObjects: true,
        }) as string[]) || [],
      color: "from-emerald-500 to-teal-500",
    },
    {
      id: "relationship",
      title: t(
        "documentVaultPage.guide.coverage.categories.relationship.title",
      ),
      icon: Heart,
      items:
        (t("documentVaultPage.guide.coverage.categories.relationship.items", {
          returnObjects: true,
        }) as string[]) || [],
      color: "from-rose-500 to-pink-500",
    },
    {
      id: "police",
      title: t("documentVaultPage.guide.coverage.categories.police.title"),
      icon: Shield,
      items:
        (t("documentVaultPage.guide.coverage.categories.police.items", {
          returnObjects: true,
        }) as string[]) || [],
      color: "from-slate-600 to-slate-800",
    },
    {
      id: "medical",
      title: t("documentVaultPage.guide.coverage.categories.medical.title"),
      icon: Stethoscope,
      items:
        (t("documentVaultPage.guide.coverage.categories.medical.items", {
          returnObjects: true,
        }) as string[]) || [],
      color: "from-red-500 to-orange-500",
    },
    {
      id: "photos",
      title: t("documentVaultPage.guide.coverage.categories.photos.title"),
      icon: Camera,
      items:
        (t("documentVaultPage.guide.coverage.categories.photos.items", {
          returnObjects: true,
        }) as string[]) || [],
      color: "from-violet-500 to-purple-500",
    },
  ];

  const steps = [
    {
      number: t("documentVaultPage.guide.steps.step1.number"),
      title: t("documentVaultPage.guide.steps.step1.title"),
      description: t("documentVaultPage.guide.steps.step1.description"),
    },
    {
      number: t("documentVaultPage.guide.steps.step2.number"),
      title: t("documentVaultPage.guide.steps.step2.title"),
      description: t("documentVaultPage.guide.steps.step2.description"),
    },
    {
      number: t("documentVaultPage.guide.steps.step3.number"),
      title: t("documentVaultPage.guide.steps.step3.title"),
      description: t("documentVaultPage.guide.steps.step3.description"),
    },
    {
      number: t("documentVaultPage.guide.steps.step4.number"),
      title: t("documentVaultPage.guide.steps.step4.title"),
      description: t("documentVaultPage.guide.steps.step4.description"),
    },
  ];

  const faqs =
    (t("documentVaultPage.guide.faqs.questions", { returnObjects: true }) as {
      q: string;
      a: string;
    }[]) || [];

  return (
    <div className="min-h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Background Decor */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-[600px] bg-linear-to-b from-blue-50/80 to-transparent" />
        <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-blue-100/40 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-emerald-100/40 rounded-full blur-[100px]" />
        {/* Grid Pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "radial-gradient(#3b82f6 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <div className="container mx-auto px-4 py-16 md:py-24 relative z-10 max-w-7xl">
        {/* Hero Section */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="text-center mb-24 max-w-4xl mx-auto"
        >
          <motion.div
            variants={itemVariants}
            className="flex justify-center mb-6"
          >
            <Badge
              variant="outline"
              className="px-4 py-2 text-sm bg-white/80 backdrop-blur-md border-blue-200 text-blue-700 shadow-xs rounded-full"
            >
              <Shield className="w-4 h-4 mr-2" />
              {t("documentVaultPage.guide.hero.badge")}
            </Badge>
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight leading-[1.1] mb-6"
          >
            {t("documentVaultPage.guide.hero.titleLine1")}{" "}
            <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-emerald-600 via-teal-500 to-cyan-500">
              {t("documentVaultPage.guide.hero.titleHighlight")}
            </span>
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="text-xl md:text-2xl text-slate-600 mb-10 leading-relaxed max-w-2xl mx-auto"
          >
            {t("documentVaultPage.guide.hero.subtitle")}
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button
              asChild
              size="lg"
              className="h-14 px-8 rounded-full text-lg shadow-xl shadow-blue-200 hover:shadow-2xl hover:scale-105 transition-all duration-300 bg-blue-600 hover:bg-blue-700"
            >
              <Link href="/document-vault">
                {t("documentVaultPage.guide.hero.openVault")}{" "}
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-14 px-8 rounded-full text-lg bg-white/80 hover:bg-white border-blue-200 text-slate-700 hover:text-blue-700"
            >
              <Link href="#features">
                {t("documentVaultPage.guide.hero.howItWorks")}
              </Link>
            </Button>
          </motion.div>
        </motion.div>

        {/* About / Purpose Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-32 max-w-4xl mx-auto"
        >
          <div className="bg-white/50 backdrop-blur-sm border border-slate-100 rounded-3xl p-8 md:p-12 shadow-xl shadow-slate-100/50">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6 text-center">
              {t("documentVaultPage.guide.about.title")}
            </h2>

            <p
              className="text-lg text-slate-600 leading-relaxed mb-8 text-center"
              dangerouslySetInnerHTML={{
                __html: t("documentVaultPage.guide.about.description")
                  .replace(
                    "secure, intelligent workspace",
                    `<span class="text-blue-600 font-semibold">secure, intelligent workspace</span>`,
                  )
                  .replace(
                    "محفوظ اور ذہین ورک اسپیس",
                    `<span class="text-blue-600 font-semibold">محفوظ اور ذہین ورک اسپیس</span>`,
                  ),
              }}
            />

            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-slate-900 flex items-center">
                  <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center mr-3 text-sm font-bold">
                    {t("documentVaultPage.guide.about.vs")}
                  </span>
                  {t("documentVaultPage.guide.about.standardFolderTitle")}
                </h3>
                <ul className="space-y-4">
                  {(
                    (t("documentVaultPage.guide.about.folderCons", {
                      returnObjects: true,
                    }) as string[]) || []
                  ).map((con, i) => (
                    <li
                      key={i}
                      className="flex items-start text-slate-500 text-sm"
                    >
                      <XCircle className="w-5 h-5 text-red-400 mr-3 mt-0.5 shrink-0" />
                      <span>{con}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-slate-900 flex items-center">
                  <span className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center mr-3 text-sm font-bold">
                    ✓
                  </span>
                  {t("documentVaultPage.guide.about.documentVaultTitle")}
                </h3>
                <ul className="space-y-4">
                  {(
                    (t("documentVaultPage.guide.about.vaultPros", {
                      returnObjects: true,
                    }) as { title: string; desc: string }[]) || []
                  ).map((pro, i) => (
                    <li
                      key={i}
                      className="flex items-start text-slate-700 text-sm"
                    >
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 mr-3 mt-0.5 shrink-0" />
                      <span className="flex-1">
                        <strong className="block mb-1 text-slate-900">
                          {pro.title}
                        </strong>{" "}
                        {pro.desc}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Features Grid */}
        <div
          id="features"
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-32"
        >
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: idx * 0.1, duration: 0.5 }}
            >
              <Card className="h-full border-none shadow-lg shadow-slate-200/50 bg-white/80 backdrop-blur-sm hover:-translate-y-1.25 transition-all duration-300">
                <CardContent className="p-8 flex flex-col items-start h-full">
                  <div className={`p-4 rounded-2xl ${feature.color} mb-6`}>
                    <feature.icon className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-slate-600 text-lg leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Comprehensive Coverage Section */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mb-32"
        >
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-4">
              {t("documentVaultPage.guide.coverage.title")}
            </h2>
            <p className="text-xl text-slate-600">
              {t("documentVaultPage.guide.coverage.subtitle")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((cat) => (
              <motion.div
                key={cat.id}
                variants={cardHoverVariants}
                initial="initial"
                whileHover="hover"
                className="group cursor-default rounded-3xl bg-white"
              >
                <div className="relative overflow-hidden rounded-3xl border border-slate-100 p-8 h-full">
                  <div
                    className={`absolute top-0 right-0 w-32 h-32 bg-linear-to-br ${cat.color} opacity-10 rounded-bl-[100px] -mr-8 -mt-8 transition-transform group-hover:scale-150 duration-500`}
                  />

                  <div className="relative z-10">
                    <div
                      className={`w-12 h-12 rounded-xl bg-linear-to-br ${cat.color} flex items-center justify-center text-white mb-6 shadow-md`}
                    >
                      <cat.icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-4">
                      {cat.title}
                    </h3>
                    <ul className="space-y-2">
                      {cat.items.map((item, i) => (
                        <li
                          key={i}
                          className="flex items-center text-slate-600 text-sm"
                        >
                          <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-500 shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Process Steps */}
        <div className="mb-32 relative">
          {/* Connecting Line (Desktop) */}
          <div className="hidden md:block absolute top-15 left-0 right-0 h-1 bg-linear-to-r from-blue-100 via-blue-200 to-blue-100 rounded-full" />

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {steps.map((step, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.2 }}
                className="relative"
              >
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100 relative z-10 h-full">
                  <div className="w-14 h-14 rounded-full bg-slate-900 text-white flex items-center justify-center text-xl font-bold mb-4 border-4 border-white shadow-lg mx-auto md:mx-0">
                    {step.number}
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3 text-center md:text-left">
                    {step.title}
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed text-center md:text-left">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto mb-32">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              {t("documentVaultPage.guide.faqs.title")}
            </h2>
            <p className="text-slate-600">
              {t("documentVaultPage.guide.faqs.subtitle")}
            </p>
          </div>

          <Accordion type="single" collapsible className="w-full space-y-4">
            {faqs.map((faq, idx) => (
              <AccordionItem
                key={idx}
                value={`item-${idx}`}
                className="bg-white border text-left border-slate-100 rounded-xl px-2 shadow-xs"
              >
                <AccordionTrigger className="px-4 text-slate-900 hover:text-blue-600 hover:no-underline font-medium text-lg">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="px-4 text-slate-600 pb-4 text-base leading-relaxed">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        {/* CTA Footer */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative rounded-[40px] overflow-hidden bg-slate-900 text-white text-center py-20 px-6 shadow-2xl"
        >
          <div className="absolute inset-0 bg-linear-to-br from-blue-900 to-slate-900 z-0" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/20 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />

          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              {t("documentVaultPage.guide.cta.title")}
            </h2>
            <p className="text-blue-100 text-xl mb-10">
              {t("documentVaultPage.guide.cta.subtitle")}
            </p>
            <Button
              asChild
              size="lg"
              className="h-16 px-10 rounded-full text-lg bg-white text-slate-900 hover:bg-blue-50 transition-colors shadow-lg hover:shadow-white/20"
            >
              <Link href="/document-vault">
                {t("documentVaultPage.guide.cta.button")}{" "}
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
