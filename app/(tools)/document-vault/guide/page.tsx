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
import { SafeHtml } from "@/app/components/shared/SafeHTML";

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
    boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
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
      description: t("documentVaultPage.guide.features.personalization.description"),
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
      title: t("documentVaultPage.guide.coverage.categories.relationship.title"),
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
    <div className="min-h-screen overflow-hidden bg-slate-50 font-sans">
      {/* Background Decor */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute top-0 left-0 h-[600px] w-full bg-linear-to-b from-blue-50/80 to-transparent" />
        <div className="absolute top-[-10%] right-[-10%] h-[600px] w-[600px] rounded-full bg-blue-100/40 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-emerald-100/40 blur-[100px]" />
        {/* Grid Pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "radial-gradient(#3b82f6 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <div className="relative z-10 container mx-auto max-w-7xl px-4 py-16 md:py-24">
        {/* Hero Section */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="mx-auto mb-24 max-w-4xl text-center"
        >
          <motion.div variants={itemVariants} className="mb-6 flex justify-center">
            <Badge
              variant="outline"
              className="rounded-full border-blue-200 bg-white/80 px-4 py-2 text-sm text-blue-700 shadow-xs backdrop-blur-md"
            >
              <Shield className="mr-2 h-4 w-4" />
              {t("documentVaultPage.guide.hero.badge")}
            </Badge>
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="mb-6 text-5xl leading-[1.1] font-extrabold tracking-tight text-slate-900 md:text-7xl"
          >
            {t("documentVaultPage.guide.hero.titleLine1")} <br className="hidden md:block" />
            <span className="bg-linear-to-r from-emerald-600 via-teal-500 to-cyan-500 bg-clip-text text-transparent">
              {t("documentVaultPage.guide.hero.titleHighlight")}
            </span>
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="mx-auto mb-10 max-w-2xl text-xl leading-relaxed text-slate-600 md:text-2xl"
          >
            {t("documentVaultPage.guide.hero.subtitle")}
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <Button
              asChild
              size="lg"
              className="h-14 rounded-full bg-blue-600 px-8 text-lg shadow-xl shadow-blue-200 transition-all duration-300 hover:scale-105 hover:bg-blue-700 hover:shadow-2xl"
            >
              <Link href="/document-vault">
                {t("documentVaultPage.guide.hero.openVault")}{" "}
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-14 rounded-full border-blue-200 bg-white/80 px-8 text-lg text-slate-700 hover:bg-white hover:text-blue-700"
            >
              <Link href="#features">{t("documentVaultPage.guide.hero.howItWorks")}</Link>
            </Button>
          </motion.div>
        </motion.div>

        {/* About / Purpose Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mx-auto mb-32 max-w-4xl"
        >
          <div className="rounded-3xl border border-slate-100 bg-white/50 p-8 shadow-xl shadow-slate-100/50 backdrop-blur-sm md:p-12">
            <h2 className="mb-6 text-center text-3xl font-bold text-slate-900 md:text-4xl">
              {t("documentVaultPage.guide.about.title")}
            </h2>

            <SafeHtml
              as="p"
              className="mb-8 text-center text-lg leading-relaxed text-slate-600"
              html={t("documentVaultPage.guide.about.description")
                .replace(
                  "secure, intelligent workspace",
                  `<span class="text-blue-600 font-semibold">secure, intelligent workspace</span>`
                )
                .replace(
                  "محفوظ اور ذہین ورک اسپیس",
                  `<span class="text-blue-600 font-semibold">محفوظ اور ذہین ورک اسپیس</span>`
                )}
            />

            <div className="grid gap-8 md:grid-cols-2">
              <div className="space-y-4">
                <h3 className="flex items-center text-xl font-semibold text-slate-900">
                  <span className="mr-3 flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-sm font-bold text-blue-600">
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
                    <li key={i} className="flex items-start text-sm text-slate-500">
                      <XCircle className="mt-0.5 mr-3 h-5 w-5 shrink-0 text-red-400" />
                      <span>{con}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-4">
                <h3 className="flex items-center text-xl font-semibold text-slate-900">
                  <span className="mr-3 flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-sm font-bold text-emerald-600">
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
                    <li key={i} className="flex items-start text-sm text-slate-700">
                      <CheckCircle2 className="mt-0.5 mr-3 h-5 w-5 shrink-0 text-emerald-500" />
                      <span className="flex-1">
                        <strong className="mb-1 block text-slate-900">{pro.title}</strong>{" "}
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
        <div id="features" className="mb-32 grid grid-cols-1 gap-8 md:grid-cols-3">
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: idx * 0.1, duration: 0.5 }}
            >
              <Card className="h-full border-none bg-white/80 shadow-lg shadow-slate-200/50 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1.25">
                <CardContent className="flex h-full flex-col items-start p-8">
                  <div className={`rounded-2xl p-4 ${feature.color} mb-6`}>
                    <feature.icon className="h-8 w-8" />
                  </div>
                  <h3 className="mb-3 text-2xl font-bold text-slate-900">{feature.title}</h3>
                  <p className="text-lg leading-relaxed text-slate-600">{feature.description}</p>
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
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold text-slate-900 md:text-5xl">
              {t("documentVaultPage.guide.coverage.title")}
            </h2>
            <p className="text-xl text-slate-600">
              {t("documentVaultPage.guide.coverage.subtitle")}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {categories.map((cat) => (
              <motion.div
                key={cat.id}
                variants={cardHoverVariants}
                initial="initial"
                whileHover="hover"
                className="group cursor-default rounded-3xl bg-white"
              >
                <div className="relative h-full overflow-hidden rounded-3xl border border-slate-100 p-8">
                  <div
                    className={`absolute top-0 right-0 h-32 w-32 bg-linear-to-br ${cat.color} -mt-8 -mr-8 rounded-bl-[100px] opacity-10 transition-transform duration-500 group-hover:scale-150`}
                  />

                  <div className="relative z-10">
                    <div
                      className={`h-12 w-12 rounded-xl bg-linear-to-br ${cat.color} mb-6 flex items-center justify-center text-white shadow-md`}
                    >
                      <cat.icon className="h-6 w-6" />
                    </div>
                    <h3 className="mb-4 text-xl font-bold text-slate-900">{cat.title}</h3>
                    <ul className="space-y-2">
                      {cat.items.map((item, i) => (
                        <li key={i} className="flex items-center text-sm text-slate-600">
                          <CheckCircle2 className="mr-2 h-4 w-4 shrink-0 text-emerald-500" />
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
        <div className="relative mb-32">
          {/* Connecting Line (Desktop) */}
          <div className="absolute top-15 right-0 left-0 hidden h-1 rounded-full bg-linear-to-r from-blue-100 via-blue-200 to-blue-100 md:block" />

          <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
            {steps.map((step, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.2 }}
                className="relative"
              >
                <div className="relative z-10 h-full rounded-2xl border border-slate-100 bg-white p-6 shadow-lg">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border-4 border-white bg-slate-900 text-xl font-bold text-white shadow-lg md:mx-0">
                    {step.number}
                  </div>
                  <h3 className="mb-3 text-center text-xl font-bold text-slate-900 md:text-left">
                    {step.title}
                  </h3>
                  <p className="text-center text-sm leading-relaxed text-slate-600 md:text-left">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mx-auto mb-32 max-w-3xl">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-slate-900">
              {t("documentVaultPage.guide.faqs.title")}
            </h2>
            <p className="text-slate-600">{t("documentVaultPage.guide.faqs.subtitle")}</p>
          </div>

          <Accordion type="single" collapsible className="w-full space-y-4">
            {faqs.map((faq, idx) => (
              <AccordionItem
                key={idx}
                value={`item-${idx}`}
                className="rounded-xl border border-slate-100 bg-white px-2 text-left shadow-xs"
              >
                <AccordionTrigger className="px-4 text-lg font-medium text-slate-900 hover:text-blue-600 hover:no-underline">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 text-base leading-relaxed text-slate-600">
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
          className="relative overflow-hidden rounded-[40px] bg-slate-900 px-6 py-20 text-center text-white shadow-2xl"
        >
          <div className="absolute inset-0 z-0 bg-linear-to-br from-blue-900 to-slate-900" />
          <div className="pointer-events-none absolute top-0 right-0 h-96 w-96 rounded-full bg-blue-500/20 blur-[100px]" />
          <div className="pointer-events-none absolute bottom-0 left-0 h-96 w-96 rounded-full bg-emerald-500/10 blur-[100px]" />

          <div className="relative z-10 mx-auto max-w-2xl">
            <h2 className="mb-6 text-3xl font-bold md:text-5xl">
              {t("documentVaultPage.guide.cta.title")}
            </h2>
            <p className="mb-10 text-xl text-blue-100">
              {t("documentVaultPage.guide.cta.subtitle")}
            </p>
            <Button
              asChild
              size="lg"
              className="h-16 rounded-full bg-white px-10 text-lg text-slate-900 shadow-lg transition-colors hover:bg-blue-50 hover:shadow-white/20"
            >
              <Link href="/document-vault">
                {t("documentVaultPage.guide.cta.button")} <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
