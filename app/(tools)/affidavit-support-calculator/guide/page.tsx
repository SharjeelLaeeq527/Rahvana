"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Calculator,
  Shield,
  Users,
  DollarSign,
  Briefcase,
  Heart,
  Flag,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Home,
  UserPlus,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Animation Variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring" as const, stiffness: 50, damping: 20 },
  },
};

const headerVariants = {
  hidden: { opacity: 0, y: -40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 60,
      damping: 15,
      duration: 0.8,
    },
  },
};

const blobVariants = {
  animate: {
    scale: [1, 1.1, 1],
    rotate: [0, 10, -10, 0],
    x: [0, 30, -30, 0],
    y: [0, -30, 30, 0],
    transition: {
      duration: 15,
      repeat: Infinity,
      ease: "easeInOut" as const,
    },
  },
};

export default function AffidavitGuidePage() {
  return (
    <div className="min-h-screen bg-slate-50/50 selection:bg-blue-100 selection:text-blue-900 overflow-hidden">
      {/* Dynamic Background */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <motion.div
          variants={blobVariants}
          animate="animate"
          className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-200/20 rounded-full blur-[100px]"
        />
        <motion.div
          variants={blobVariants}
          animate="animate"
          transition={{ delay: 2 }}
          className="absolute top-[20%] right-[-5%] w-[400px] h-[400px] bg-indigo-200/20 rounded-full blur-[90px]"
        />
        <motion.div
          variants={blobVariants}
          animate="animate"
          transition={{ delay: 4 }}
          className="absolute bottom-[-10%] left-[20%] w-[600px] h-[600px] bg-emerald-100/30 rounded-full blur-[120px]"
        />
      </div>

      {/* Hero Section */}
      <section className="relative pt-10 md:pt-20 pb-7 md:pb-20">
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={headerVariants}
            className="max-w-4xl mx-auto text-center space-y-8"
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center justify-center"
            >
              <Badge
                variant="secondary"
                className="bg-white/80 backdrop-blur-md border border-blue-100 text-blue-700 px-6 py-2 text-sm rounded-full shadow-xs"
              >
                <Sparkles className="w-3 h-3 mr-2 text-blue-500 fill-blue-500" />
                Updated for 2025 Guidelines
              </Badge>
            </motion.div>

            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.1]">
              Master the <br />
              <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-600 via-indigo-600 to-emerald-600 animate-gradient-x">
                Affidavit of Support
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-slate-600 max-w-2xl mx-auto leading-relaxed font-medium">
              Demystifying the financial requirements for US immigration.
              Simple, accurate, and completely free.
            </p>

            <motion.div
              className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-6 pt-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              <Button
                asChild
                size="lg"
                className="bg-primary hover:bg-primary/90 text-white rounded-full px-8 h-14 text-lg shadow-lg hover:shadow-blue-200 hover:-translate-y-1 transition-all duration-300 w-full sm:w-auto"
              >
                <Link href="/affidavit-support-calculator">
                  <Calculator className="mr-2 h-5 w-5" />
                  Start Calculator
                </Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="rounded-full px-8 h-14 text-lg border-2 border-slate-200 hover:border-blue-200 hover:bg-blue-50/50 text-slate-700 w-full sm:w-auto"
                onClick={() =>
                  document
                    .getElementById("core-concepts")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                Learn More
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8 md:py-12 max-w-6xl relative z-10">
        {/* Core Concepts Grid */}
        <div id="core-concepts" className="scroll-mt-24">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="grid md:grid-cols-3 gap-8 mb-10 md:mb-20"
          >
            <ConceptCard
              icon={Shield}
              color="blue"
              title="The 125% Rule"
              desc="Most sponsors must prove income at 125% of the HHS Poverty Guidelines to ensure self-sufficiency."
            />
            <ConceptCard
              icon={Users}
              color="emerald"
              title="Household Math"
              desc="It's not just you. We add up your dependents, spouse, and the immigrant to find your true household size."
            />
            <ConceptCard
              icon={DollarSign}
              color="amber"
              title="Income Sources"
              desc="W-2 wages, self-employment, and investment income all count. Assets can bridge the gap if you're short."
            />
          </motion.div>
        </div>

        {/* 10 Scenarios Section */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="mb-10 md:mb-20"
        >
          <div className="text-center mb-16 space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-block p-3 rounded-2xl bg-indigo-50 text-indigo-600 mb-1 md:pb-4"
            >
              <Briefcase className="w-8 h-8" />
            </motion.div>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
              10 Ways to Qualify
            </h2>
            <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto">
              No two cases are alike. Our tool intelligently determines which
              pathway fits your specific situation.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Standard Cases */}
            <div className="col-span-full mb-6">
              <div className="flex items-center gap-4">
                <div className="h-px flex-1 bg-slate-200"></div>
                <h3 className="text-lg font-semibold text-emerald-700 bg-emerald-50 px-4 py-1 rounded-full border border-emerald-100 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Standard Options
                </h3>
                <div className="h-px flex-1 bg-slate-200"></div>
              </div>
            </div>

            <ScenarioCard
              icon={Briefcase}
              color="blue"
              title="Primary Sponsor Alone"
              desc="You meet the income requirement on your own. Simple and straightforward."
            />
            <ScenarioCard
              icon={Home}
              color="emerald"
              title="With Household Member"
              desc="You combine income with a spouse, parent, or adult child living with you."
            />
            <ScenarioCard
              icon={UserPlus}
              color="indigo"
              title="With Joint Sponsor"
              desc="A separate person (friend/family) sponsors the immigrant fully."
            />

            {/* Special Cases */}
            <div className="col-span-full mt-12 mb-6">
              <div className="flex items-center gap-4">
                <div className="h-px flex-1 bg-slate-200"></div>
                <h3 className="text-lg font-semibold text-amber-700 bg-amber-50 px-4 py-1 rounded-full border border-amber-100 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> Special Situations
                </h3>
                <div className="h-px flex-1 bg-slate-200"></div>
              </div>
            </div>

            <ScenarioCard
              icon={Users}
              color="purple"
              title="Combined Support"
              desc="Using both household members AND joint sponsors to cover everyone."
            />
            <ScenarioCard
              icon={Heart}
              color="rose"
              title="Substitute Sponsor"
              desc="Used when the original petitioner has passed away. A relative takes over."
            />
            <ScenarioCard
              icon={Home}
              color="blue"
              title="Household Member as Sole Sponsor"
              desc="Primary sponsor has $0 income? A household member (spouse/parent) takes full responsibility."
            />
            <ScenarioCard
              icon={Shield}
              color="orange"
              title="Military Privilege"
              desc="Active duty military sponsoring spouse/child only need 100% of poverty line."
            />

            {/* Advanced Cases */}
            <div className="col-span-full mt-12 mb-6">
              <div className="flex items-center gap-4">
                <div className="h-px flex-1 bg-slate-200"></div>
                <h3 className="text-lg font-semibold text-blue-700 bg-blue-50 px-4 py-1 rounded-full border border-blue-100 flex items-center gap-2">
                  <Flag className="w-4 h-4" /> Alternative Methods
                </h3>
                <div className="h-px flex-1 bg-slate-200"></div>
              </div>
            </div>

            <ScenarioCard
              icon={DollarSign}
              color="green"
              title="Using Assets"
              desc="Using savings/property (3x-5x shortfall) instead of income."
            />
            <ScenarioCard
              icon={UserPlus}
              color="indigo"
              title="Joint Sponsor + Their Household"
              desc="Even your joint sponsor can use their household member's income to qualify."
            />
            <ScenarioCard
              icon={HelpCircle}
              color="slate"
              title="Self-Petitioning"
              desc={
                <span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="cursor-help underline decoration-dotted underline-offset-2">
                          VAWA
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Violence Against Women Act</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  , Widow(er)s, and Special Immigrants usually don&apos;t need a
                  sponsor.
                </span>
              }
            />
          </div>
        </motion.div>

        {/* Forms Matrix */}
        <motion.div
          variants={headerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="bg-white/80 backdrop-blur-xl rounded-[40px] border border-white/50 shadow-2xl overflow-hidden mb-10 md:mb-20 ring-1 ring-slate-900/5"
        >
          <div className="p-4 md:p-12 bg-linear-to-b from-slate-50/80 to-white/50 border-b border-slate-100">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 text-center">
              Forms Decoded
            </h2>
            <p className="text-center text-slate-600 max-w-2xl mx-auto text-lg">
              The calculator will generate your custom checklist, but it&apos;s
              good to know exactly what each form does.
            </p>
          </div>

          <div className="p-4 md:p-12 grid gap-6">
            <FormAccordion
              id="i864"
              title="Form I-864 (Affidavit of Support)"
              content="The main form used for most family-based immigrant visas. Required for the petitioner/primary sponsor, and also for any joint sponsors."
            />
            <FormAccordion
              id="i864a"
              title="Form I-864A (Contract Between Sponsor & Household Member)"
              content="Used when a sponsor is relying on the income of a household member (like a spouse or parent) to meet the income requirement. Both the sponsor and household member sign this."
            />
            <FormAccordion
              id="i864w"
              title="Form I-864W (Request for Exemption)"
              content={
                <span>
                  Used by self-petitioners (widows,{" "}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="cursor-help underline decoration-dotted underline-offset-2">
                          VAWA
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Violence Against Women Act</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  ) or applicants who have already earned 40 qualifying quarters
                  of work in the US, to show they are exempt from the Affidavit
                  of Support requirement.
                </span>
              }
            />
            <FormAccordion
              id="i864ez"
              title="Form I-864EZ (Short Form)"
              content="A simpler version of the I-864. You can use this ONLY if: You are the petitioner, there is no joint sponsor, you are sponsoring only one person (spouse, parent or a child), and your income is purely from W-2 salary/pension."
            />
          </div>
        </motion.div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, type: "spring" }}
          className="text-center pb-8 md:pb-14"
        >
          <div className="inline-block p-1.5 rounded-[40px] bg-linear-to-r from-blue-500 via-indigo-500 to-emerald-500 shadow-2xl shadow-blue-200/50">
            <div className="bg-white rounded-[36px] px-4 sm:px-8 py-16 md:px-24 md:py-20 relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-[0.03] pointer-events-none"></div>

              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{
                  repeat: Infinity,
                  duration: 3,
                  ease: "easeInOut",
                }}
                className="mb-8 inline-block"
              >
                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto text-blue-600">
                  <Calculator className="w-8 h-8" />
                </div>
              </motion.div>

              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6 tracking-tight">
                Ready to find your path?
              </h2>
              <p className="text-lg md:text-xl text-slate-600 mb-10 max-w-lg mx-auto">
                Get your personalized assessment and document checklist in under
                2 minutes.
              </p>

              <Button
                asChild
                size="lg"
                className="bg-slate-900 text-white hover:bg-slate-800 rounded-full px-8 md:px-12 h-14 md:h-16 text-lg md:text-xl shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1 w-full md:w-auto"
              >
                <Link href="/affidavit-support-calculator">
                  Start Free Assessment <ArrowRight className="ml-3 w-6 h-6" />
                </Link>
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// Helper Components
// ----------------------------------------------------------------------

function ConceptCard({
  icon: Icon,
  title,
  desc,
  color,
}: {
  icon: React.ElementType;
  title: string;
  desc: string;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white",
    emerald:
      "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white",
    amber:
      "bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white",
  };

  return (
    <motion.div variants={itemVariants} className="h-full">
      <Card className="h-full border-0 shadow-lg shadow-slate-200/50 hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-500 bg-white group overflow-hidden relative">
        <div
          className={`absolute top-0 left-0 w-full h-1 bg-${color}-500 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500`}
        />
        <CardHeader>
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-all duration-500 ${colorMap[color]} shadow-xs`}
          >
            <Icon className="w-7 h-7" />
          </div>
          <CardTitle className="text-xl md:text-2xl font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-600 leading-relaxed text-base md:text-lg">
            {desc}
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function ScenarioCard({
  icon: Icon,
  title,
  desc,
  color,
}: {
  icon: React.ElementType;
  title: string;
  desc: string | React.ReactNode;
  color: string;
}) {
  const colorStyles: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white ring-blue-100",
    emerald:
      "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white ring-emerald-100",
    indigo:
      "bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white ring-indigo-100",
    purple:
      "bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white ring-purple-100",
    rose: "bg-rose-50 text-rose-600 group-hover:bg-rose-600 group-hover:text-white ring-rose-100",
    amber:
      "bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white ring-amber-100",
    orange:
      "bg-orange-50 text-orange-600 group-hover:bg-orange-600 group-hover:text-white ring-orange-100",
    green:
      "bg-green-50 text-green-600 group-hover:bg-green-600 group-hover:text-white ring-green-100",
    slate:
      "bg-slate-100 text-slate-600 group-hover:bg-slate-600 group-hover:text-white ring-slate-200",
  };

  return (
    <motion.div variants={itemVariants} className="h-full">
      <motion.div
        whileHover={{ y: -5 }}
        className="h-full p-8 rounded-3xl bg-white border border-slate-100 shadow-lg shadow-slate-200/50 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 group cursor-default relative overflow-hidden"
      >
        <div
          className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-all duration-300 ${colorStyles[color]} ring-4 ring-offset-2`}
        >
          <Icon className="w-7 h-7" />
        </div>
        <h4 className="text-lg md:text-xl font-bold text-slate-900 mb-3 group-hover:text-blue-700 transition-colors">
          {title}
        </h4>
        <p className="text-slate-600 text-sm md:text-base leading-relaxed">
          {desc}
        </p>

        {/* Decorative corner blob */}
        <div
          className={`absolute -bottom-8 -right-8 w-24 h-24 rounded-full opacity-10 group-hover:scale-150 transition-transform duration-500 ${colorStyles[color].split(" ")[0]}`}
        />
      </motion.div>
    </motion.div>
  );
}

function FormAccordion({
  id,
  title,
  content,
}: {
  id: string;
  title: string;
  content: string | React.ReactNode;
}) {
  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value={id} className="border-b-0 mb-4">
        <AccordionTrigger className="text-base md:text-lg font-semibold text-slate-900 bg-white p-5 md:p-6 rounded-2xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all data-[state=open]:rounded-b-none data-[state=open]:bg-blue-50/30 text-left">
          {title}
        </AccordionTrigger>
        <AccordionContent className="text-slate-600 leading-relaxed text-sm md:text-base bg-white p-5 md:p-6 pt-2 rounded-b-2xl border border-t-0 border-slate-100">
          {content}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
