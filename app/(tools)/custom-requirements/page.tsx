"use client";

import { motion } from "framer-motion";
import {
  BookOpen as PassportIcon,
  FileText,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  MapPin,
  BadgeDollarSign,
  GraduationCap,
  Briefcase,
  ShieldCheck,
  Info,
  HandHelping,
  ArrowRight,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export default function ArrivalGuidePage() {
  return (
    <div className="min-h-screen bg-slate-50/50 py-6 md:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8 md:space-y-12">
        {/* Header Section */}
        <motion.div
          className="text-center space-y-3 md:space-y-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex justify-center">
            <div className="p-2.5 md:p-3 bg-primary rounded-2xl shadow-lg ring-4 ring-primary/10">
              <MapPin className="text-white w-6 h-6 md:w-8 md:h-8" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-black tracking-tight text-gray-900 sm:text-4xl md:text-5xl">
              Arrival at <span className="text-primary">Port of Entry</span>
            </h1>
            <p className="text-base md:text-lg text-gray-500 max-w-2xl mx-auto font-medium px-2">
              A comprehensive guide on documents required and questions asked
              when you land in the United States.
            </p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 gap-8 md:gap-12">
          {/* Main Content Sections */}
          <Tabs defaultValue="documents" className="w-full">
            <div className="flex justify-center mb-6 md:mb-10 w-full px-4 sm:px-0">
              <div className="max-w-full overflow-x-auto no-scrollbar rounded-2xl">
                <TabsList className="bg-white p-1 rounded-2xl shadow-md border border-gray-100 h-auto flex flex-nowrap sm:justify-center min-w-max sm:min-w-0">
                  <TabsTrigger
                    value="documents"
                    className="px-4 md:px-8 py-2.5 md:py-3 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white transition-all text-xs sm:text-sm font-bold gap-1.5 md:gap-2 whitespace-nowrap"
                  >
                    <FileText size={16} className="sm:block hidden" /> Required
                    Documents
                  </TabsTrigger>
                  <TabsTrigger
                    value="questions"
                    className="px-4 md:px-8 py-2.5 md:py-3 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white transition-all text-xs sm:text-sm font-bold gap-1.5 md:gap-2 whitespace-nowrap"
                  >
                    <HelpCircle size={16} className="sm:block hidden" /> Common
                    Questions
                  </TabsTrigger>
                  <TabsTrigger
                    value="inspection"
                    className="px-4 md:px-8 py-2.5 md:py-3 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white transition-all text-xs sm:text-sm font-bold gap-1.5 md:gap-2 whitespace-nowrap"
                  >
                    <AlertTriangle size={16} className="sm:block hidden" />
                    Secondary Inspection
                  </TabsTrigger>
                </TabsList>
              </div>
            </div>

            <TabsContent value="documents" className="space-y-8">
              <motion.div
                variants={staggerContainer}
                initial="initial"
                animate="animate"
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                {/* Core Documents */}
                <motion.div variants={fadeInUp}>
                  <Card className="h-full border-none shadow-xl shadow-slate-200/50 rounded-2xl md:rounded-3xl overflow-hidden bg-white">
                    <CardHeader className="bg-primary/5 border-b border-primary/10 p-5 md:pb-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <ShieldCheck className="text-primary w-5 h-5" />
                        </div>
                        <CardTitle className="text-lg md:text-xl font-bold">
                          Core Required Documents
                        </CardTitle>
                      </div>
                      <CardDescription className="text-xs md:text-sm">
                        Must hand-carry (do not pack in checked luggage)
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 md:pt-6 space-y-4">
                      <div className="space-y-4">
                        <DocumentItem
                          title="Valid Passport"
                          description="Must be valid for the entire travel and at least 6 months beyond intended stay."
                          badge="Mandatory"
                        />
                        <DocumentItem
                          title="Visa Stamp"
                          description="Your approved immigrant or non-immigrant visa (CR1, IR1, F-1, H-1B, etc.)"
                          badge="Mandatory"
                        />
                        <DocumentItem
                          title="Sealed Visa Packet"
                          description="If provided by the consulate, do not open it. Present directly to CBP."
                          badge="Immigrants Only"
                        />
                        <DocumentItem
                          title="Form I-94"
                          description="Arrival-Departure Record. Usually issued electronically upon arrival."
                        />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Additional Documents */}
                <motion.div variants={fadeInUp}>
                  <Card className="h-full border-none shadow-xl shadow-slate-200/50 rounded-2xl md:rounded-3xl overflow-hidden bg-white">
                    <CardHeader className="bg-teal-50 border-b border-teal-100 p-5 md:pb-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-teal-100/50 rounded-lg">
                          <HandHelping className="text-teal-600 w-5 h-5" />
                        </div>
                        <CardTitle className="text-lg md:text-xl font-bold text-slate-800">
                          Highly Recommended
                        </CardTitle>
                      </div>
                      <CardDescription className="text-xs md:text-sm">
                        Helpful to avoid delays or secondary inspection
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 md:pt-6 space-y-4">
                      <div className="space-y-4">
                        <DocumentItem
                          title="U.S. Residence Evidence"
                          description="Address of where you will be staying or living."
                        />
                        <DocumentItem
                          title="Proof of Intent"
                          description="Marriage certificate, petition paperwork, or employment contract."
                        />
                        <DocumentItem
                          title="Financial Documents"
                          description="Bank statements, sponsor letters, or proof of scholarship."
                        />
                        <DocumentItem
                          title="Customs Declaration"
                          description="Form CF-6059, usually completed on the plane or at a kiosk."
                        />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </motion.div>
            </TabsContent>

            <TabsContent value="questions" className="space-y-8">
              <motion.div
                variants={fadeInUp}
                initial="initial"
                animate="animate"
                className="max-w-3xl mx-auto px-1 sm:px-0"
              >
                <Card className="border-none shadow-xl shadow-slate-200/50 rounded-2xl md:rounded-3xl overflow-hidden bg-white">
                  <CardHeader className="bg-blue-50 border-b border-blue-100 p-5 md:pb-6">
                    <CardTitle className="text-xl md:text-2xl font-black text-slate-800">
                      CBP Interview Questions
                    </CardTitle>
                    <CardDescription className="text-xs md:text-sm">
                      Answer clearly, honestly, and concisely.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Accordion type="single" collapsible className="w-full">
                      <QuestionSection
                        value="core"
                        title="Common Core Questions"
                        icon={<Info className="w-5 h-5 text-blue-500" />}
                        questions={[
                          "Why are you coming to the United States?",
                          "What is the purpose of your trip/entry?",
                          "Where will you live in the U.S.?",
                          "How long do you plan to stay?",
                          "Do you have enough funds to support yourself?",
                          "Do your documents support your purpose?",
                        ]}
                      />
                      <QuestionSection
                        value="immigrant"
                        title="Immigrant Visa Specific (CR/IR)"
                        icon={
                          <PassportIcon className="w-5 h-5 text-purple-500" />
                        }
                        questions={[
                          "Are you entering on an immigrant visa?",
                          "Who is your petitioner in the U.S.?",
                          "How long have you been married (if marriage-based)?",
                          "Where do you plan to live after entry?",
                          "What is your spouse’s contact information?",
                        ]}
                      />
                      <QuestionSection
                        value="work"
                        title="Work / H-1B Employment"
                        icon={<Briefcase className="w-5 h-5 text-orange-500" />}
                        questions={[
                          "Who is your employer?",
                          "What position will you be working in?",
                          "What address will you work from?",
                          "When does your job start?",
                        ]}
                      />
                      <QuestionSection
                        value="student"
                        title="Students (F-1, J-1)"
                        icon={
                          <GraduationCap className="w-5 h-5 text-emerald-500" />
                        }
                        questions={[
                          "Which school will you attend?",
                          "What program of study are you in?",
                          "How will you support your studies?",
                          "Who is your Designated School Official (DSO)?",
                        ]}
                      />
                      <QuestionSection
                        value="customs"
                        title="Customs & Agricultural"
                        icon={
                          <BadgeDollarSign className="w-5 h-5 text-amber-500" />
                        }
                        questions={[
                          "Are you carrying any agricultural products or food?",
                          "How much cash are you carrying? (Limit is $10k without reporting)",
                          "Are you bringing any restricted items?",
                        ]}
                      />
                    </Accordion>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            <TabsContent value="inspection" className="space-y-8">
              <motion.div
                variants={fadeInUp}
                initial="initial"
                animate="animate"
                className="max-w-3xl mx-auto space-y-6 px-1 sm:px-0"
              >
                <Card className="border-none shadow-xl shadow-slate-200/50 rounded-2xl md:rounded-3xl overflow-hidden bg-white">
                  <CardHeader className="bg-red-50 border-b border-red-100 p-5 md:pb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-red-100/50 rounded-lg">
                        <AlertTriangle className="text-red-600 w-5 h-5" />
                      </div>
                      <CardTitle className="text-lg md:text-xl font-bold text-slate-800">
                        What is Secondary Inspection?
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 md:pt-6 space-y-6">
                    <p className="text-sm md:text-base text-slate-600 leading-relaxed">
                      If the officer requires more information, they may send
                      you to secondary inspection.
                      <strong>
                        {" "}
                        This is not unusual and not automatically bad.
                      </strong>{" "}
                      It is simply a deeper review of your case.
                    </p>

                    <div className="bg-slate-50 rounded-2xl p-4 md:p-6 space-y-4 border border-slate-100">
                      <h4 className="font-bold text-slate-800 flex items-center gap-2 text-sm md:text-base">
                        <ArrowRight className="w-4 h-4 text-primary" />
                        What to expect:
                      </h4>
                      <ul className="space-y-3">
                        <li className="flex gap-2 text-xs md:text-sm text-slate-600">
                          <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                          Requests for additional documentation (financials,
                          contracts, etc.)
                        </li>
                        <li className="flex gap-2 text-xs md:text-sm text-slate-600">
                          <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                          Detailed questions about ties, finances, and
                          intentions
                        </li>
                        <li className="flex gap-2 text-xs md:text-sm text-slate-600">
                          <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                          Verification of U.S. addresses and contacts
                        </li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>

                <div className="bg-amber-50 border border-amber-100 p-5 md:p-6 rounded-2xl md:rounded-3xl space-y-4">
                  <h3 className="text-base md:text-lg font-bold text-amber-800 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5" />
                    Final Tips for Success
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                    <div className="bg-white/50 p-4 rounded-xl border border-amber-200/50">
                      <p className="text-sm font-bold text-amber-900 mb-1 underline">
                        Hand-Carry Everything
                      </p>
                      <p className="text-[11px] md:text-xs text-amber-800">
                        Keep all originals and supporting docs in your carry-on,
                        not checked bags.
                      </p>
                    </div>
                    <div className="bg-white/50 p-4 rounded-xl border border-amber-200/50">
                      <p className="text-sm font-bold text-amber-900 mb-1 underline">
                        Contacts Ready
                      </p>
                      <p className="text-[11px] md:text-xs text-amber-800">
                        Have names and numbers of your sponsor, employer, or
                        school easily accessible.
                      </p>
                    </div>
                    <div className="bg-white/50 p-4 rounded-xl border border-amber-200/50">
                      <p className="text-sm font-bold text-amber-900 mb-1 underline">
                        Be Precise
                      </p>
                      <p className="text-[11px] md:text-xs text-amber-800">
                        Answer clearly, honestly, and politely. Don&lsquo;t
                        volunteer info not asked for.
                      </p>
                    </div>
                    <div className="bg-white/50 p-4 rounded-xl border border-amber-200/50">
                      <p className="text-sm font-bold text-amber-900 mb-1 underline">
                        Address Access
                      </p>
                      <p className="text-[11px] md:text-xs text-amber-800">
                        Know exactly where you&lsquo;re staying. Write it down
                        if necessary.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function DocumentItem({
  title,
  description,
  badge,
}: {
  title: string;
  description: string;
  badge?: string;
}) {
  return (
    <div className="flex gap-3 md:gap-4 p-3 md:p-4 rounded-xl md:rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100 group">
      <div className="mt-1">
        <div className="p-1.5 md:p-2 bg-white rounded-lg shadow-sm group-hover:bg-primary/5 group-hover:text-primary transition-colors">
          <FileText className="w-4 h-4" />
        </div>
      </div>
      <div className="space-y-1 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <h4 className="font-bold text-sm md:text-base text-slate-900">
            {title}
          </h4>
          {badge && (
            <Badge
              variant="secondary"
              className="bg-slate-100 text-[9px] md:text-[10px] uppercase tracking-wider font-bold text-slate-600"
            >
              {badge}
            </Badge>
          )}
        </div>
        <p className="text-xs md:text-sm text-slate-500 leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}

function QuestionSection({
  value,
  title,
  icon,
  questions,
}: {
  value: string;
  title: string;
  icon: React.ReactNode;
  questions: string[];
}) {
  return (
    <AccordionItem
      value={value}
      className="border-b border-slate-50 last:border-0 overflow-hidden"
    >
      <AccordionTrigger className="px-5 md:px-6 py-3.5 md:py-4 hover:bg-slate-50 transition-all hover:no-underline group">
        <div className="flex items-center gap-3">
          <div className="p-1.5 md:p-2 rounded-lg bg-white shadow-sm group-hover:scale-110 transition-transform">
            {icon}
          </div>
          <span className="text-base md:text-lg font-bold text-slate-800 text-left leading-tight">
            {title}
          </span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="bg-slate-50/50 px-5 md:px-6 py-3.5 md:py-4">
        <ul className="space-y-2.5 md:space-y-3">
          {questions.map((q, i) => (
            <li
              key={i}
              className="flex gap-3 text-xs md:text-sm text-slate-600"
            >
              <span className="shrink-0 w-5 h-5 md:w-6 md:h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center text-[9px] md:text-[10px] font-bold text-slate-400">
                {i + 1}
              </span>
              <span className="pt-0.5">{q}</span>
            </li>
          ))}
        </ul>
      </AccordionContent>
    </AccordionItem>
  );
}
