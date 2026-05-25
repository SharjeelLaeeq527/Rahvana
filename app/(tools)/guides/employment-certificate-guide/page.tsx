"use client";

import { useState, type ElementType, type ReactNode } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import {
  Briefcase,
  Building2,
  FileCheck,
  Globe,
  MapPin,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  ShieldCheck,
  HelpCircle,
  Stamp,
  GraduationCap,
  Users,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface GuideSectionProps {
  containerVariants: Variants;
  itemVariants: Variants;
}

interface StepItem {
  title: string;
  desc: ReactNode;
  icon: ElementType;
  color: string;
}

export default function EmploymentVerificationGuide() {
  const [activeTab, setActiveTab] = useState("overview");

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden font-sans selection:bg-purple-100">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[20%] -right-[10%] w-[800px] h-[800px] bg-purple-100/40 rounded-full blur-3xl mix-blend-multiply opacity-70 animate-blob" />
        <div className="absolute top-[20%] -left-[10%] w-[600px] h-[600px] bg-blue-100/40 rounded-full blur-3xl mix-blend-multiply opacity-70 animate-blob animation-delay-2000" />
        <div className="absolute -bottom-[20%] left-[20%] w-[600px] h-[600px] bg-emerald-100/40 rounded-full blur-3xl mix-blend-multiply opacity-70 animate-blob animation-delay-4000" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10" />

        {/* Abstract Icons */}
        {/* <div className="absolute top-1/4 left-10 w-64 h-64 opacity-[0.05] pointer-events-none rotate-12">
          <Briefcase className="w-full h-full text-slate-900" />
        </div>
        <div className="absolute bottom-1/4 right-10 w-96 h-96 opacity-[0.05] pointer-events-none -rotate-12">
          <FileText className="w-full h-full text-blue-900" />
        </div> */}
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 space-y-6"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200 font-bold text-sm">
            <Building2 className="w-4 h-4" />
            2026 Updated Process
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-slate-900 tracking-tight">
            Employment Verification{" "}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-purple-600 to-blue-500">
              Guide
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-lg md:text-xl text-slate-600 leading-relaxed">
            The complete roadmap to verifying your employment history in Pakistan. Whether for
            loans, visas, or overseas opportunities.
          </p>
        </motion.div>

        {/* Main Interface */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-12">
          {/* Navigation Pills */}
          <div className="flex justify-center overflow-x-auto pb-4 sm:pb-0">
            <TabsList className="bg-white/80 backdrop-blur-md border border-slate-200 p-1.5 rounded-full h-auto shadow-sm inline-flex">
              {[
                { id: "overview", label: "Overview", icon: FileCheck },
                { id: "process", label: "Step-by-Step", icon: Briefcase },
                { id: "provinces", label: "Provinces", icon: MapPin },
                { id: "overseas", label: "Overseas", icon: Globe },
                { id: "faq", label: "Common FAQs", icon: HelpCircle },
              ].map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="rounded-full px-4 sm:px-6 py-3 data-[state=active]:bg-purple-600 data-[state=active]:text-white transition-all duration-300 gap-2 font-bold text-sm sm:text-base whitespace-nowrap"
                >
                  <tab.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <div className="min-h-[500px]">
            <AnimatePresence mode="wait">
              <TabsContent value="overview" className="mt-0">
                <OverviewSection
                  containerVariants={containerVariants}
                  itemVariants={itemVariants}
                />
              </TabsContent>

              <TabsContent value="process" className="mt-0">
                <ProcessSection containerVariants={containerVariants} itemVariants={itemVariants} />
              </TabsContent>

              <TabsContent value="provinces" className="mt-0">
                <ProvincesSection
                  containerVariants={containerVariants}
                  itemVariants={itemVariants}
                />
              </TabsContent>

              <TabsContent value="overseas" className="mt-0">
                <OverseasSection
                  containerVariants={containerVariants}
                  itemVariants={itemVariants}
                />
              </TabsContent>

              <TabsContent value="faq" className="mt-0">
                <FAQSection containerVariants={containerVariants} itemVariants={itemVariants} />
              </TabsContent>
            </AnimatePresence>
          </div>
        </Tabs>
      </div>
    </div>
  );
}

// --- SUB-COMPONENTS ---

function OverviewSection({ containerVariants, itemVariants }: GuideSectionProps) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
      className="grid md:grid-cols-2 gap-8"
    >
      <motion.div variants={itemVariants} className="space-y-6">
        <h2 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <FileText className="w-8 h-8 text-purple-600" />
          Types of Documents
        </h2>

        <div className="grid gap-6">
          <Card className="shadow-md hover:shadow-lg transition-shadow bg-white/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-start gap-4 space-y-0 pb-2">
              <div className="p-3 bg-purple-50 rounded-xl">
                <Building2 className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-slate-900">
                  A. Employer-Issued Letter
                </CardTitle>
                <CardDescription className="font-medium text-slate-500 mt-1">
                  Most common for loans, visas & HR checks.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 mt-2">
                {[
                  "Issued on official company letterhead",
                  "Includes Name & CNIC/Passport No.",
                  "States Job Title & Duration",
                  "Must have Signature & Stamp",
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-slate-700 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-purple-500 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="shadow-md hover:shadow-lg transition-shadow bg-white/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-start gap-4 space-y-0 pb-2">
              <div className="p-3 bg-blue-50 rounded-xl">
                <ShieldCheck className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-slate-900">
                  B. Govt/Police Verification
                </CardTitle>
                <CardDescription className="font-medium text-slate-500 mt-1">
                  Required for overseas work visas (UAE/FIA etc.)
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 mt-2">
                {[
                  "Police Character Certificate",
                  "Attested Job Letter",
                  "Passport + CNIC Verification",
                  "Often needed for emigration",
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-slate-700 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="space-y-6">
        <h2 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <Clock className="w-8 h-8 text-blue-600" />
          Timeline & Costs
        </h2>

        <Card className="bg-linear-to-br from-slate-900 to-slate-800 text-white border-none shadow-xl">
          <CardContent className="p-6 space-y-6">
            <div className="grid gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-purple-300 font-bold">
                  <Clock className="w-5 h-5" /> Processing Time
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                    <p className="text-sm text-slate-400">Employer Letter</p>
                    <p className="text-xl font-bold">1-3 Days</p>
                  </div>
                  <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                    <p className="text-sm text-slate-400">Attestation</p>
                    <p className="text-xl font-bold">1-3 Weeks</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-emerald-300 font-bold">
                  <FileText className="w-5 h-5" /> Estimated Fees
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/10">
                    <span className="text-slate-300">Employer Letter</span>
                    <span className="font-bold text-emerald-400">Free</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/10">
                    <span className="text-slate-300">Attestation (Govt)</span>
                    <span className="font-bold text-emerald-400">Varies</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 flex items-start gap-3 text-sm text-slate-300">
              <AlertCircle className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
              <p>
                Fees for attestation depend on the specific agency (MOFA, Embassy, etc.) and are
                subject to change.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

function ProcessSection({ containerVariants, itemVariants }: GuideSectionProps) {
  const steps: StepItem[] = [
    {
      title: "Gather Basic Documents",
      desc: "Prepare your CNIC/Smart NIC, Employment Contract, Passport (for overseas), and salary slips.",
      icon: FileText,
      color: "blue",
    },
    {
      title: "Request from Employer",
      desc: (
        <>
          Ask HR for a verification letter on <strong>official letterhead</strong>. Ensure it has
          stamp & signature. This is the primary method.
        </>
      ),
      icon: Building2,
      color: "purple",
    },
    {
      title: "Attestation (If Needed)",
      desc: "If required by third parties (visas/banks), get it attested by acts like Chamber of Commerce or MOFA.",
      icon: Stamp,
      color: "orange",
    },
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
      className="max-w-4xl mx-auto space-y-12"
    >
      <div className="text-center space-y-4 mb-8">
        <h2 className="text-3xl font-bold text-slate-900">Step-by-Step Process</h2>
        <p className="text-slate-600 max-w-2xl mx-auto">
          Follow these steps to ensure your employment verification is valid and accepted.
        </p>
      </div>

      <div className="relative">
        <div className="absolute left-6 md:left-1/2 top-4 bottom-4 w-1 bg-slate-200 -translate-x-1/2 hidden md:block" />

        {steps.map((step, i) => (
          <motion.div
            key={i}
            variants={itemVariants}
            className={`flex flex-col md:flex-row items-center gap-8 mb-12 last:mb-0 relative ${
              i % 2 === 0 ? "md:flex-row-reverse" : ""
            }`}
          >
            {/* Timeline Content */}
            <div className="w-full md:w-1/2 pl-12 md:pl-0 md:px-8">
              <Card className={`shadow-lg`}>
                <CardContent className="p-6">
                  <h3 className={`text-xl font-bold text-${step.color}-700 mb-2`}>
                    Step {i + 1}: {step.title}
                  </h3>
                  <p className="text-slate-600 leading-relaxed text-sm">{step.desc}</p>
                </CardContent>
              </Card>
            </div>

            {/* Timeline Dot */}
            <div className="absolute left-6 md:left-1/2 -translate-x-1/2 w-12 h-12 rounded-full border-4 border-white shadow-md flex items-center justify-center bg-white z-10">
              <step.icon className={`w-6 h-6 text-${step.color}-600`} />
            </div>

            {/* Empty Space for Grid */}
            <div className="hidden md:block w-1/2" />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

function ProvincesSection({
  containerVariants,
  // itemVariants,
}: GuideSectionProps) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
      className="max-w-5xl mx-auto"
    >
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-slate-900">Province Specifics</h2>
        <p className="text-slate-600 mt-2">
          Employment verification is largely employer-driven, but some provincial nuances exist.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-green-600" /> Sindh
            </CardTitle>
          </CardHeader>
          <CardContent className="text-slate-600 text-sm leading-relaxed space-y-3">
            <p>
              Govt departments require <strong>strict verification</strong> of educational and
              domicile credentials before employment orders.
            </p>
            <p className="bg-green-50 p-2 rounded-lg text-green-800 border border-green-100">
              No separate provincial employment verification office exists.
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-blue-600" /> Punjab
            </CardTitle>
          </CardHeader>
          <CardContent className="text-slate-600 text-sm leading-relaxed space-y-3">
            <p>
              Pushing teacher verification through <strong>TECTAA</strong> online portal.
            </p>
            <p>General employment relies on standard Employer & HR verification.</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow ">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-orange-600" /> Other Provinces
            </CardTitle>
          </CardHeader>
          <CardContent className="text-slate-600 text-sm leading-relaxed space-y-3">
            <p>
              <strong>KPK & Balochistan</strong>: Follow the same HR & Employer process.
            </p>
            <p className="bg-orange-50 p-2 rounded-lg text-orange-800 border border-orange-100">
              No separate government department for private employment verification.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 p-4 bg-slate-100 rounded-xl text-center text-slate-500 text-sm flex items-center justify-center gap-2">
        <AlertCircle className="w-4 h-4" />
        <span>
          Note: As of 2026, verification remains primarily an employer-driven responsibility across
          all provinces.
        </span>
      </div>
    </motion.div>
  );
}

function OverseasSection({ containerVariants, itemVariants }: GuideSectionProps) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
      className="max-w-4xl mx-auto space-y-8"
    >
      <div className="bg-indigo-600 rounded-2xl p-8 text-white text-center shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-3xl font-bold mb-4">Going Abroad?</h2>
          <p className="text-indigo-100 max-w-2xl mx-auto text-lg">
            If you are leaving Pakistan for work, your documents require additional verification
            steps.
          </p>
        </div>
        <Globe className="absolute -right-10 -bottom-10 w-64 h-64 text-indigo-500/30 rotate-12" />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {[
          {
            title: "BEOE Registration",
            icon: Globe,
            text: "Must register on Bureau of Emigration & Overseas Employment portal. Required for 'Protector' stamp.",
            color: "indigo",
          },
          {
            title: "Police Character Cert",
            icon: ShieldCheck,
            text: "Often required for UAE/Gulf visas. Issued by local police department.",
            color: "blue",
          },
          {
            title: "MOFA Attestation",
            icon: Stamp,
            text: "Ministry of Foreign Affairs attestation is mandatory for most overseas documents.",
            color: "purple",
          },
          {
            title: "Embassy Attestation",
            icon: Building2,
            text: "Employer letters may need specific Embassy attestation based on the destination country.",
            color: "pink",
          },
        ].map((item, i) => (
          <motion.div key={i} variants={itemVariants}>
            <Card className="hover:shadow-lg transition-all hover:bg-slate-50">
              <CardContent className="p-6 flex gap-4">
                <div className={`p-3 rounded-xl bg-${item.color}-100 h-fit`}>
                  <item.icon className={`w-6 h-6 text-${item.color}-600`} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">{item.title}</h3>
                  <p className="text-slate-600 mt-2 text-sm leading-relaxed">{item.text}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

function FAQSection({ containerVariants, itemVariants }: GuideSectionProps) {
  const faqs = [
    {
      q: "Can I verify my past job if the company no longer exists?",
      a: "Yes, but it's harder. usage old contracts, pay slips, tax documents, or affidavits from former verification colleagues. A reference letter from a past manager can also help.",
    },
    {
      q: "Can I get verification directly from NADRA?",
      a: "No. NADRA only verifies identity (CNIC). It does NOT verify employment history.",
    },
    {
      q: "Do banks handle employment verification?",
      a: "Yes. Banks often contact employers directly to confirm job status and salary before approving loans or credit cards.",
    },
    {
      q: "What if my employer refuses to issue a letter?",
      a: "Try providing them a sample template to make it easier. If they still refuse, seek help from legal advisors or higher HR management.",
    },
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
      className="max-w-3xl mx-auto space-y-8"
    >
      <motion.div variants={itemVariants} className="text-center">
        <h2 className="text-3xl font-bold text-slate-900 mb-2">Common Questions</h2>
        <p className="text-slate-500">Everything you need to know about the process</p>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Accordion type="single" collapsible className="w-full space-y-4">
          {faqs.map((faq, i) => (
            <AccordionItem
              key={i}
              value={`faq-${i}`}
              className="bg-white border border-slate-200 rounded-xl px-4 shadow-sm"
            >
              <AccordionTrigger className="font-bold text-slate-800 hover:text-purple-600 text-left">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-slate-600 leading-relaxed pb-4">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </motion.div>

      <motion.div
        variants={itemVariants}
        className="bg-purple-50 border border-purple-100 rounded-xl p-6 flex gap-4 items-start"
      >
        <HelpCircle className="w-6 h-6 text-purple-600 shrink-0 mt-1" />
        <div>
          <h4 className="font-bold text-purple-900 text-lg">Still have questions?</h4>
          <p className="text-purple-800 text-sm mt-1 leading-relaxed">
            For specific legal disputes regarding employment certificates, consult a labor lawyer or
            relevant provincial labor courts.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
