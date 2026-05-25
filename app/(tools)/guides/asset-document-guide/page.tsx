"use client";

import { useState } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";

interface GuideSectionProps {
  containerVariants: Variants;
  itemVariants?: Variants;
}

interface ProvinceCardProps {
  title: string;
  badge: string;
  desc: string;
  children: React.ReactNode;
}

interface Portal {
  name: string;
  link: string;
  desc: string;
}
import {
  FileText,
  Car,
  Users,
  ExternalLink,
  Building2,
  CheckCircle2,
  HelpCircle,
  CreditCard,
  Search,
  ArrowRight,
  ShieldCheck,
  FileCheck,
  Landmark,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function AssetDocumentGuide() {
  const [activeTab, setActiveTab] = useState("overview");

  // Animation Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-96 bg-linear-to-br from-[#0d7377] via-[#0a5a5d] to-slate-900 -z-10" />
      <div className="absolute top-0 right-0 w-1/2 h-96 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 space-y-6"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#32e0c4]/10 border border-[#32e0c4]/20 text-[#32e0c4] font-medium text-sm backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#32e0c4] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#32e0c4]"></span>
            </span>
            Updated for 2026
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl text-slate-800 font-black tracking-tight">
            Asset <span className="text-[#0d7377]">Documentation</span>
          </h1>

          <p className="max-w-2xl mx-auto text-lg md:text-xl text-slate-400 leading-relaxed">
            The complete guide to obtaining property, vehicle, and inheritance documents in
            Pakistan. Secure your assets with the right paperwork.
          </p>
        </motion.div>

        {/* Main Interface */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          {/* Custom Tab Navigation */}
          <div className="flex justify-center overflow-x-auto pb-4">
            <div className="bg-white/80 backdrop-blur-md border border-slate-200 p-1.5 rounded-full inline-flex shadow-xl">
              {[
                { id: "overview", label: "Overview", icon: FileText },
                { id: "property", label: "Land & Property", icon: Building2 },
                { id: "inheritance", label: "Inheritance", icon: Users },
                { id: "vehicle", label: "Vehicle", icon: Car },
                { id: "portals", label: "Portals & FAQs", icon: ExternalLink },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold transition-all duration-300 whitespace-nowrap
                    ${
                      activeTab === tab.id
                        ? "bg-[#0d7377] text-white shadow-lg scale-105"
                        : "text-slate-500 hover:text-[#0d7377] hover:bg-[#e8f6f6]"
                    }
                  `}
                >
                  <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? "text-[#32e0c4]" : ""}`} />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="min-h-[600px]">
            <AnimatePresence mode="wait">
              {/* OVERVIEW TAB */}
              <TabsContent key="overview" value="overview" className="mt-0">
                <motion.div
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  variants={containerVariants}
                  className="grid grid-cols-1 md:grid-cols-3 gap-6"
                >
                  {/* Hero Card */}
                  <motion.div variants={itemVariants} className="md:col-span-2">
                    <Card className="h-full border-none shadow-xl shadow-slate-200/50 overflow-hidden relative group bg-[#0d7377]">
                      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mixed-blend-overlay" />
                      <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-[#32e0c4] rounded-full blur-[100px] opacity-20" />

                      <CardHeader className="relative z-10">
                        <Badge className="w-fit bg-[#32e0c4]/20 text-[#32e0c4] border-[#32e0c4]/30 mb-2">
                          Essential Guide
                        </Badge>
                        <CardTitle className="text-3xl font-bold text-white">
                          What is Asset Documentation?
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="relative z-10 text-emerald-50 space-y-6">
                        <p className="text-lg leading-relaxed font-light opacity-90">
                          Official legal proofs showing ownership of your assets. Without these,
                          your ownership is not legally recognized.
                        </p>
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:bg-white/20 transition-colors">
                            <Building2 className="w-8 h-8 text-[#32e0c4] mb-3" />
                            <h3 className="font-bold text-white">Property</h3>
                            <p className="text-sm text-emerald-100/70">
                              Fard, Registry, Mutation (Intiqal)
                            </p>
                          </div>
                          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:bg-white/20 transition-colors">
                            <Car className="w-8 h-8 text-[#32e0c4] mb-3" />
                            <h3 className="font-bold text-white">Vehicle</h3>
                            <p className="text-sm text-emerald-100/70">
                              Smart Card, Registration Book
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  {/* Inheritance Card */}
                  <motion.div variants={itemVariants}>
                    <Card className="h-full border-none shadow-lg shadow-slate-200/50 bg-white relative overflow-hidden group hover:shadow-xl transition-all">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-bl-[100px] z-10" />
                      <CardHeader className="relative z-10">
                        <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center mb-4 text-indigo-600">
                          <Users className="w-6 h-6" />
                        </div>
                        <CardTitle className="text-xl font-bold text-slate-800">
                          Inheritance?
                        </CardTitle>
                        <CardDescription>Transferring assets after death</CardDescription>
                      </CardHeader>
                      <CardContent className="relative z-10 space-y-4">
                        <p className="text-slate-600 text-sm leading-relaxed">
                          Heirs need legal authority to claim assets. The{" "}
                          <strong>NADRA Succession Certificate</strong> has replaced complex court
                          procedures.
                        </p>
                        <Button
                          onClick={() => setActiveTab("inheritance")}
                          variant="outline"
                          className="w-full border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:text-indigo-800"
                        >
                          Learn More <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>

                  {/* Summary Stats / Quick Info */}
                  <motion.div variants={itemVariants} className="md:col-span-3">
                    <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        {
                          label: "Property Proof",
                          val: "Fard / Registry",
                          icon: FileText,
                          color: "emerald",
                        },
                        {
                          label: "Vehicle Proof",
                          val: "Smart Card",
                          icon: CreditCard,
                          color: "blue",
                        },
                        {
                          label: "Inheritance",
                          val: "Succession Cert",
                          icon: Users,
                          color: "purple",
                        },
                        {
                          label: "Authorities",
                          val: "PLRA / Excise / NADRA",
                          icon: Landmark,
                          color: "orange",
                        },
                      ].map((item, i) => (
                        <Card
                          key={i}
                          className="border-none shadow-sm hover:shadow-md transition-shadow bg-white"
                        >
                          <CardContent className="p-4 flex items-center gap-4">
                            <div
                              className={`p-3 rounded-full bg-${item.color}-50 text-${item.color}-600`}
                            >
                              <item.icon className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                                {item.label}
                              </p>
                              <p className="font-bold text-slate-800">{item.val}</p>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </motion.div>
                </motion.div>
              </TabsContent>

              {/* PROPERTY TAB */}
              <TabsContent key="property" value="property" className="mt-0">
                <PropertySection
                  containerVariants={containerVariants}
                  itemVariants={itemVariants}
                />
              </TabsContent>

              {/* INHERITANCE TAB */}
              <TabsContent key="inheritance" value="inheritance" className="mt-0">
                <InheritanceSection
                  containerVariants={containerVariants}
                  itemVariants={itemVariants}
                />
              </TabsContent>

              {/* VEHICLE TAB */}
              <TabsContent key="vehicle" value="vehicle" className="mt-0">
                <VehicleSection containerVariants={containerVariants} itemVariants={itemVariants} />
              </TabsContent>

              {/* PORTALS TAB */}
              <TabsContent key="portals" value="portals" className="mt-0">
                <PortalsSection containerVariants={containerVariants} itemVariants={itemVariants} />
              </TabsContent>
            </AnimatePresence>
          </div>
        </Tabs>
      </div>
    </div>
  );
}

// --- SUB-COMPONENTS ---

function PropertySection({ containerVariants }: GuideSectionProps) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
      className="space-y-8"
    >
      <div className="text-center max-w-2xl mx-auto mb-8">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Land & Property Records</h2>
        <p className="text-slate-600">
          Procedures vary by province. Select your region below to find the specific authority and
          process.
        </p>
      </div>

      <Tabs defaultValue="punjab" className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 h-auto p-1 mb-6 bg-slate-100 rounded-xl">
          {[
            { id: "punjab", label: "Punjab" },
            { id: "sindh", label: "Sindh" },
            { id: "kpk", label: "KPK" },
            { id: "balochistan", label: "Balochistan" },
          ].map((prov) => (
            <TabsTrigger
              key={prov.id}
              value={prov.id}
              className="py-3 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold data-[state=active]:text-[#0d7377]"
            >
              {prov.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <TabsContent value="punjab" className="mt-0 space-y-6">
              <ProvinceCard
                title="Punjab Land Records Authority (PLRA)"
                badge="Highly Digital"
                desc="Punjab has the most advanced digital land record system."
              >
                <div className="space-y-4">
                  <h4 className="font-bold text-[#0d7377] flex items-center gap-2">
                    <Search className="w-4 h-4" /> How to Obtain Fard (Online)
                  </h4>
                  <ul className="space-y-3 text-sm text-slate-600">
                    <li className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-[#e8f6f6] text-[#0d7377] flex items-center justify-center shrink-0 font-bold text-xs">
                        1
                      </div>
                      <span>
                        Visit <strong>Punjab Zameen</strong> portal (
                        <Link
                          href="https://www.punjab-zameen.gov.pk/"
                          className="text-blue-600 hover:underline"
                        >
                          punjab-zameen.gov.pk
                        </Link>
                        )
                      </span>
                    </li>
                    <li className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-[#e8f6f6] text-[#0d7377] flex items-center justify-center shrink-0 font-bold text-xs">
                        2
                      </div>
                      <span>
                        Register/Login using CNIC. Search Property by: District, Tehsil, Mauza,
                        Plot#, Owner CNIC.
                      </span>
                    </li>
                    <li className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-[#e8f6f6] text-[#0d7377] flex items-center justify-center shrink-0 font-bold text-xs">
                        3
                      </div>
                      <span>
                        Pay fee online and download the official <strong>Fard</strong> PDF
                        instantly.
                      </span>
                    </li>
                  </ul>
                  <div className="bg-amber-50 p-4 rounded-lg border border-amber-100 text-amber-800 text-sm flex gap-3">
                    <HelpCircle className="w-5 h-5 shrink-0" />
                    <p>
                      <strong>Note:</strong> Online Fard is for record keeping. For
                      selling/registry, visit an <strong>Arazi Record Center (ARC)</strong> or
                      e-Khidmat Markaz for verification.
                    </p>
                  </div>
                </div>
              </ProvinceCard>
            </TabsContent>

            <TabsContent value="sindh" className="mt-0 space-y-6">
              <ProvinceCard
                title="Sindh Board of Revenue / SindhZameen"
                badge="Online Search Only"
                desc="Online search is available for verification, but certified copies are mostly offline."
              >
                <div className="space-y-4">
                  <h4 className="font-bold text-[#0d7377] flex items-center gap-2">
                    <Search className="w-4 h-4" /> Verification Process
                  </h4>
                  <ul className="space-y-3 text-sm text-slate-600">
                    <li className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-[#e8f6f6] text-[#0d7377] flex items-center justify-center shrink-0 font-bold text-xs">
                        1
                      </div>
                      <span>
                        Global Search: Use Name/CNIC to find <strong>Form 7A</strong> (Ownership)
                        and <strong>Form 7B</strong> on SindhZameen portal.
                      </span>
                    </li>
                    <li className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-[#e8f6f6] text-[#0d7377] flex items-center justify-center shrink-0 font-bold text-xs">
                        2
                      </div>
                      <span>
                        <strong>Certified Copies:</strong> Visit the local Taluka / Board of Revenue
                        office with your CNIC and Survey Number.
                      </span>
                    </li>
                  </ul>
                </div>
              </ProvinceCard>
            </TabsContent>

            <TabsContent value="kpk" className="mt-0 space-y-6">
              <ProvinceCard
                title="KPK Revenue & Estate Dept"
                badge="Digitizing"
                desc="KPK is actively digitizing, but Fard issuance is often still manual."
              >
                <div className="space-y-4">
                  <h4 className="font-bold text-[#0d7377] flex items-center gap-2">
                    <Building2 className="w-4 h-4" /> Standard Procedure
                  </h4>
                  <ul className="space-y-3 text-sm text-slate-600">
                    <li className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-[#e8f6f6] text-[#0d7377] flex items-center justify-center shrink-0 font-bold text-xs">
                        1
                      </div>
                      <span>
                        Visit the local <strong>Land Record & Revenue Office</strong> (Patwari).
                      </span>
                    </li>
                    <li className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-[#e8f6f6] text-[#0d7377] flex items-center justify-center shrink-0 font-bold text-xs">
                        2
                      </div>
                      <span>
                        Request Fard or Ownership Record by providing CNIC and land details.
                      </span>
                    </li>
                    <li className="flex gap-3">
                      <CheckCircle2 className="w-5 h-5 text-[#32e0c4] shrink-0" />
                      <span>
                        Ask if <strong>e-Registration</strong> is available at your specific tehsil
                        for faster processing.
                      </span>
                    </li>
                  </ul>
                </div>
              </ProvinceCard>
            </TabsContent>

            <TabsContent value="balochistan" className="mt-0 space-y-6">
              <ProvinceCard
                title="Balochistan Zameen (Land Registry)"
                badge="Online Payment"
                desc="Services available through Arazi Record Centres (ARC)."
              >
                <div className="space-y-4">
                  <h4 className="font-bold text-[#0d7377] flex items-center gap-2">
                    <FileCheck className="w-4 h-4" /> Obtaining Documents
                  </h4>
                  <ul className="space-y-3 text-sm text-slate-600">
                    <li className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-[#e8f6f6] text-[#0d7377] flex items-center justify-center shrink-0 font-bold text-xs">
                        1
                      </div>
                      <span>
                        Visit the <strong>Property Registry</strong> section on the official portal.
                      </span>
                    </li>
                    <li className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-[#e8f6f6] text-[#0d7377] flex items-center justify-center shrink-0 font-bold text-xs">
                        2
                      </div>
                      <span>Request Fard using CNIC + Survey/Plot number.</span>
                    </li>
                    <li className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-[#e8f6f6] text-[#0d7377] flex items-center justify-center shrink-0 font-bold text-xs">
                        3
                      </div>
                      <span>
                        Pay Stamp Duty / Taxes online or at the center to receive the certified
                        copy.
                      </span>
                    </li>
                  </ul>
                </div>
              </ProvinceCard>
            </TabsContent>
          </div>

          <div>
            <Card className="bg-slate-900 text-white border-none shadow-xl sticky top-8">
              <CardHeader>
                <CardTitle className="text-[#32e0c4]">Key Documents</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <h4 className="font-bold">Fard</h4>
                  <p className="text-sm text-slate-400">
                    The fundamental proof of land ownership. Shows current owner status.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-bold">Registry</h4>
                  <p className="text-sm text-slate-400">
                    The sale deed contract when buying/selling property.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-bold">Intiqal (Mutation)</h4>
                  <p className="text-sm text-slate-400">
                    The process of transferring the ownership in government records after a sale.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </Tabs>
    </motion.div>
  );
}

function InheritanceSection({ containerVariants }: GuideSectionProps) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
      className="grid md:grid-cols-12 gap-8"
    >
      <div className="md:col-span-8 space-y-6">
        <Card className="border-none shadow-lg overflow-hidden">
          <div className="h-2 bg-[#0d7377] w-full" />
          <CardHeader>
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <Users className="w-6 h-6 text-[#0d7377]" /> NADRA Succession Certificate
            </CardTitle>
            <CardDescription>
              Replaces old court procedures. Valid for movable assets (Bank accounts, Shares, etc).
              For Immovable assets (Land), a <strong>Letter of Administration</strong> is issued.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <h4 className="font-bold text-[#0d7377] mb-3">Required Documents</h4>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li className="flex gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#0d7377]" /> Death Certificate of
                    deceased
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#0d7377]" /> FRC (Family Reg Certificate)
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#0d7377]" /> CNIC copies of all legal
                    heirs
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#0d7377]" /> List of assets to be
                    transferred
                  </li>
                </ul>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <h4 className="font-bold text-[#0d7377] mb-3">The Process</h4>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li className="flex gap-2">
                    <div className="font-bold">1.</div> Visit NADRA Succession Unit
                  </li>
                  <li className="flex gap-2">
                    <div className="font-bold">2.</div> Submit Docs & Biometrics
                  </li>
                  <li className="flex gap-2">
                    <div className="font-bold">3.</div> Public Notice (Newspaper)
                  </li>
                  <li className="flex gap-2">
                    <div className="font-bold">4.</div> Certificate Issuance
                  </li>
                </ul>
              </div>
            </div>
            <div className="bg-[#e8f6f6] text-[#0d7377] p-4 rounded-lg flex gap-3 text-sm border border-[#32e0c4]/20">
              <ShieldCheck className="w-5 h-5 shrink-0" />
              <p>
                <strong>Note:</strong> All legal heirs must be present for biometric verification.
                If any heir is abroad, they can verify remotely via a power of attorney or mission.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="md:col-span-4">
        <Card className="bg-slate-900 border border-slate-700 text-white h-full shadow-xl">
          <CardHeader>
            <CardTitle>Why this matters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-slate-300">
            <p>
              Without a Succession Certificate, banks and authorities will freeze the
              deceased&apos;s assets.
            </p>
            <p>This document is the legal authority that allows heirs to:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Withdraw bank funds</li>
              <li>Transfer vehicles</li>
              <li>Sell or transfer property</li>
              <li>Claim insurance/pension</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}

function VehicleSection({ containerVariants }: GuideSectionProps) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
      className="space-y-6"
    >
      <div className="grid md:grid-cols-2 gap-8">
        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#0d7377]">
              <Car className="w-6 h-6" /> Ownership & Registration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-xl bg-[#e8f6f6] border border-[#32e0c4]/30">
              <h4 className="font-bold text-[#0d7377] mb-1">Smart Card</h4>
              <p className="text-sm text-slate-600">
                The modern, credit-card sized proof of ownership. Replaced the old
                &quot;Registration Book&quot;.
              </p>
            </div>
            <div className="space-y-4 mt-6">
              <h4 className="font-bold text-slate-800">Where to go?</h4>
              <ul className="space-y-3">
                <li className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <span className="font-medium text-slate-700">Punjab & ICT</span>
                  <Badge className="bg-blue-100 text-blue-700">Excise & Taxation Dept</Badge>
                </li>
                <li className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <span className="font-medium text-slate-700">Sindh</span>
                  <Badge className="bg-blue-100 text-blue-700">Sindh Excise Dept</Badge>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-800">
              <Users className="w-6 h-6" /> Transferring Ownership
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-600 mb-4">
              Buying or selling a car? You MUST transfer the ownership officially.
            </p>

            <div className="space-y-3">
              <div className="flex gap-3 items-start">
                <div className="bg-slate-900 text-white text-xs font-bold px-2 py-1 rounded">
                  REQ
                </div>
                <div>
                  <p className="font-bold text-slate-800 text-sm">Biometric Verification</p>
                  <p className="text-xs text-slate-500">
                    Both Buyer and Seller must verify biometrics at e-Sahulat or Excise office.
                  </p>
                </div>
              </div>
              <div className="flex gap-3 items-start">
                <div className="bg-slate-900 text-white text-xs font-bold px-2 py-1 rounded">
                  REQ
                </div>
                <div>
                  <p className="font-bold text-slate-800 text-sm">Transfer Letter</p>
                  <p className="text-xs text-slate-500">
                    Sales deed/Transfer letter signed by both parties.
                  </p>
                </div>
              </div>
              <div className="flex gap-3 items-start">
                <div className="bg-slate-900 text-white text-xs font-bold px-2 py-1 rounded">
                  TIP
                </div>
                <div>
                  <p className="font-bold text-slate-800 text-sm">Keep Old Records</p>
                  <p className="text-xs text-slate-500">
                    Always keep the original file/book safe, it increases resale value.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}

function PortalsSection({ containerVariants }: GuideSectionProps) {
  const portals = [
    {
      name: "Punjab Zameen (PLRA)",
      link: "https://www.punjab-zameen.gov.pk/",
      desc: "Land records & Fard for Punjab",
    },
    {
      name: "Sindh e-Registration",
      link: "https://e-registration.gos.pk/",
      desc: "Deed registration & verification in Sindh",
    },
    {
      name: "Punjab Excise",
      link: "https://excise.gos.pk/",
      desc: "Vehicle tax & registration services",
    },
    {
      name: "MTMIS Sindh",
      link: "https://mtmissindh.com/",
      desc: "Check car registration details online",
    },
    {
      name: "Khyber Pakhtunkhwa (KPK)",
      link: "https://revenue.kp.gov.pk/",
      desc: "KPK Land Records / Director Land Records(online / office)",
    },
    {
      name: "Balochistan",
      link: "https://balochistan-zameen.gob.pk/Home/PropertyRegistry",
      desc: "Balochistan Land Registry (official portal)",
    },
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
      className="space-y-8"
    >
      <div className="grid md:grid-cols-2 gap-6">
        {portals.map((p: Portal, i: number) => (
          <Link href={p.link} target="_blank" key={i}>
            <Card className="hover:shadow-lg transition-all group cursor-pointer border-slate-200">
              <CardContent className="p-6 flex items-start justify-between">
                <div className="space-y-2">
                  <h3 className="font-bold text-[#0d7377] text-lg group-hover:underline">
                    {p.name}
                  </h3>
                  <p className="text-slate-600 text-sm">{p.desc}</p>
                </div>
                <ExternalLink className="w-5 h-5 text-slate-400 group-hover:text-[#32e0c4]" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card className="border-none bg-[#e8f6f6] shadow-inner">
        <CardHeader>
          <CardTitle className="text-[#0d7377]">Quick FAQs</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1" className="border-b-[#0d7377]/20">
              <AccordionTrigger className="text-slate-800 hover:text-[#0d7377]">
                Can I get Fard completely online?
              </AccordionTrigger>
              <AccordionContent className="text-slate-600">
                In Punjab, yes, for record purposes. For selling, you might need an in-person visit
                for biometric verification at an Arazi Record Center. In other provinces, it is
                mostly in-person.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2" className="border-b-[#0d7377]/20">
              <AccordionTrigger className="text-slate-800 hover:text-[#0d7377]">
                Do I need a lawyer for Inheritance?
              </AccordionTrigger>
              <AccordionContent className="text-slate-600">
                Not necessarily. The new NADRA Succession Certificate system removes the need for
                courts/lawyers in simple cases where all heirs agree. If there is a dispute, you
                will need to go to court.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3" className="border-b-0">
              <AccordionTrigger className="text-slate-800 hover:text-[#0d7377]">
                Is the &apos;Smart Card&apos; mandatory for cars?
              </AccordionTrigger>
              <AccordionContent className="text-slate-600">
                Yes, the old book Registration Books are being phased out. New cars get Smart Cards
                by default. It is highly recommended to upgrade for easier carrying and
                verification.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function ProvinceCard({ title, badge, desc, children }: ProvinceCardProps) {
  return (
    <Card className="border-none shadow-lg h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start mb-2">
          <Badge className="bg-[#e8f6f6] text-[#0d7377] hover:bg-[#d6f0f0] border-none">
            {badge}
          </Badge>
        </div>
        <CardTitle className="text-xl font-bold text-slate-900 leading-tight">{title}</CardTitle>
        <CardDescription className="text-slate-500 mt-2">{desc}</CardDescription>
      </CardHeader>
      <CardContent className="grow pt-4">{children}</CardContent>
    </Card>
  );
}
