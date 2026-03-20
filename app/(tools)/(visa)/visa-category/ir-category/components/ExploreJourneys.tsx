"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  MapPin,
  Search,
  Info,
  CheckCircle,
  Plus,
  ArrowRight,
  X,
  Clock,
} from "lucide-react";
import { Loader } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { VisaEligibilityTool } from "@/app/(tools)/visa-eligibility/components/VisaEligibilityTool";
import Link from "next/link";
import { useAuth } from "@/app/context/AuthContext";
import {
  loadJourneyProgress,
  JourneyProgressRecord,
} from "@/lib/journey/journeyProgressService";
import { useRouter } from "next/navigation";
import { roadmapData } from "@/data/roadmap";
import { useLanguage } from "@/app/context/LanguageContext";

// Mock Data
type Journey = {
  id: string;
  title: string;
  category: string;
  process: string;
  description: string;
  matchScore: number;
  time: string;
  cost: string;
  color: string;
  visaCode: string;
  bestFor: string;
  stations: number;
  difficulty: "Low" | "Medium" | "High";
  pakistanFocused: boolean;
  quickRoadmap: string[];
  introVideo?: {
    title: string;
    duration: string;
    description: string;
  };
};

type Station = {
  key: string;
  label: string;
  summary: string;
  whatYouDo: string;
  uploadsNeeded: string[];
  pitfalls: string[];
};

const JOURNEY_DETAILS: Record<string, Station[]> = {
  ir1: [
    {
      key: "uscis",
      label: "USCIS",
      summary: "File I-130 petition",
      whatYouDo:
        "U.S. citizen spouse files Form I-130 petition to establish the relationship.",
      uploadsNeeded: [
        "Marriage certificate",
        "Birth certificates",
        "Proof of citizenship",
        "Photos together",
        "Financial documents",
      ],
      pitfalls: [
        "Incomplete forms",
        "Missing translations",
        "Insufficient evidence of relationship",
      ],
    },
    {
      key: "nvc",
      label: "NVC",
      summary: "Submit documents",
      whatYouDo:
        "After USCIS approval, case moves to National Visa Center for document review.",
      uploadsNeeded: [
        "DS-260 form",
        "Civil documents",
        "Financial support (I-864)",
        "Police certificates",
      ],
      pitfalls: [
        "Expired police certificates",
        "Incorrect fee payment",
        "Missing civil documents",
      ],
    },
    {
      key: "interview",
      label: "Interview",
      summary: "Embassy interview",
      whatYouDo: "Attend visa interview at a U.S. embassy or consulate.",
      uploadsNeeded: [
        "Passport",
        "Medical exam results",
        "Interview letter",
        "Supporting documents",
      ],
      pitfalls: [
        "Inadequate relationship evidence",
        "Medical issues",
        "Previous visa violations",
      ],
    },
    {
      key: "221g",
      label: "221(g)",
      summary: "Admin Processing",
      whatYouDo:
        "Submit missing documents or wait for background checks to complete.",
      uploadsNeeded: [
        "Missing civil documents",
        "New passport (if expired)",
        "CV/Resume (if requested)",
      ],
      pitfalls: ["Long wait times", "Lack of updates", "Passport hold"],
    },
    {
      key: "arrival",
      label: "Arrival",
      summary: "Enter U.S.",
      whatYouDo: "Travel to U.S. and receive green card by mail.",
      uploadsNeeded: ["Visa packet (sealed)", "Valid passport"],
      pitfalls: ["Travel within visa validity", "USCIS immigrant fee payment"],
    },
  ],
  ir5: [
    {
      key: "uscis",
      label: "USCIS",
      summary: "I-130 Petition",
      whatYouDo: "U.S. Citizen child files petition for parent.",
      uploadsNeeded: ["Proof of citizenship", "Birth certificate", "Fees"],
      pitfalls: ["Missing birth records", "Incorrect fees"],
    },
    {
      key: "nvc",
      label: "NVC",
      summary: "Doc Review",
      whatYouDo: "Submit civil documents and financial support forms.",
      uploadsNeeded: ["DS-260", "I-864 Affadavit of Support"],
      pitfalls: ["Incomplete tax returns", "Missing translations"],
    },
    {
      key: "interview",
      label: "Interview",
      summary: "Consulate Visit",
      whatYouDo: "Parent attends interview at a U.S. Embassy or Consulate.",
      uploadsNeeded: ["Medical Exam", "Passport", "Photos"],
      pitfalls: ["Medical inadmissibility", "Missing original docs"],
    },
    {
      key: "221g",
      label: "221(g)",
      summary: "Admin Processing",
      whatYouDo:
        "Submit missing documents or wait for background checks to complete.",
      uploadsNeeded: [
        "Missing civil documents",
        "New passport (if expired)",
        "CV/Resume (if requested)",
      ],
      pitfalls: ["Long wait times", "Lack of updates", "Passport hold"],
    },
    {
      key: "arrival",
      label: "Arrival",
      summary: "Enter U.S.",
      whatYouDo: "Travel to U.S. as a permanent resident.",
      uploadsNeeded: ["Sealed Immigrant Packet"],
      pitfalls: ["Lost packet", "Travel expiry"],
    },
  ],
  "germany-student": [
    {
      key: "admission",
      label: "Admission",
      summary: "Get Admission Letter",
      whatYouDo: "Apply to German universities and receive Zulassungsbescheid.",
      uploadsNeeded: ["Admission letter", "Language certificates", "Transcripts"],
      pitfalls: ["Late application", "Missing certified translations"],
    },
    {
      key: "finance",
      label: "Finance",
      summary: "Blocked Account",
      whatYouDo: "Open a blocked account and deposit required funds.",
      uploadsNeeded: ["Blocked account confirmation", "Health insurance cert"],
      pitfalls: ["Insufficient funds", "Unaccepted providers"],
    },
    {
      key: "appointment",
      label: "Appointment",
      summary: "Embassy Visit",
      whatYouDo: "Book and attend visa interview at German Embassy.",
      uploadsNeeded: ["Application form", "Passport", "Photos", "Proof of funds"],
      pitfalls: ["Incomplete documents", "Interview performance"],
    },
    {
      key: "arrival",
      label: "Arrival",
      summary: "Register in DE",
      whatYouDo: "Travel to Germany, register address, and get residence permit.",
      uploadsNeeded: ["Registration certificate", "Enrollment certificate"],
      pitfalls: ["Missing deadlines", "Expired visa"],
    },
  ],
  f1: [
    {
      key: "accept",
      label: "Acceptance",
      summary: "Get I-20",
      whatYouDo:
        "Gain admission to a SEVP-certified school and receive Form I-20.",
      uploadsNeeded: ["School application", "Financial proof"],
      pitfalls: ["Late application", "Insufficient funds"],
    },
    {
      key: "sevis",
      label: "SEVIS",
      summary: "Pay Fee",
      whatYouDo: "Pay the I-901 SEVIS fee online.",
      uploadsNeeded: ["Form I-20", "Credit card"],
      pitfalls: ["Typing errors", "Forgetting receipt"],
    },
    {
      key: "ds160",
      label: "Apply",
      summary: "Form DS-160",
      whatYouDo: "Complete online visa application and schedule interview.",
      uploadsNeeded: ["Digital Photo", "Passport info"],
      pitfalls: ["Inconsistent info", "Session timeout"],
    },
    {
      key: "interview",
      label: "Interview",
      summary: "Visa Intrview",
      whatYouDo: "Demonstrate ties to home country and academic intent.",
      uploadsNeeded: ["I-20", "SEVIS Receipt", "Financial docs", "Transcripts"],
      pitfalls: ["Immigrant intent", "Poor English skills"],
    },
  ],
  h1b: [
    {
      key: "lottery",
      label: "Lottery",
      summary: "Registration",
      whatYouDo: "Employer registers you for the H-1B cap lottery.",
      uploadsNeeded: ["Passport details", "Job info"],
      pitfalls: ["Duplicate registration", "Wrong dates"],
    },
    {
      key: "petition",
      label: "Petition",
      summary: "File I-129",
      whatYouDo: "If selected, employer files detailed petition with USCIS.",
      uploadsNeeded: ["LCA", "Degree eval", "Job offer"],
      pitfalls: ["Specialty occupation RFE", "Wage level issues"],
    },
    {
      key: "approval",
      label: "Approval",
      summary: "I-797 Notice",
      whatYouDo: "Receive approval notice (I-797) from employer.",
      uploadsNeeded: ["None (wait for mail)"],
      pitfalls: ["USCIS delays", "Premium processing needed"],
    },
    {
      key: "stamping",
      label: "Stamping",
      summary: "Visa Sticker",
      whatYouDo: "Attend interview for visa stamping in passport.",
      uploadsNeeded: ["I-797", "DS-160", "Client letter"],
      pitfalls: ["221(g) admin processing", "Job verification"],
    },
  ],
};

const JOURNEYS: Journey[] = [
  {
    id: "ir1",
    title: "IR-1 Spouse Visa",
    category: "Family",
    process: "Consular",
    description: "For spouses of U.S. citizens. High priority path.",
    matchScore: 98,
    time: "12-14 mo",
    cost: "$1,200",
    color: "bg-blue-100 text-blue-700 border-blue-200",
    visaCode: "IR-1/CR-1",
    bestFor: "Married couples where one spouse is a U.S. citizen",
    stations: 5,
    difficulty: "Medium",
    pakistanFocused: false,
    quickRoadmap: [
      "File I-130 with USCIS (4-12 months)",
      "NVC document processing (2-4 months)",
      "Schedule embassy interview (1-3 months)",
      "Attend embassy interview",
      "Receive visa and travel to U.S.",
    ],
    introVideo: {
      title: "Spouse & Fiancé Visa Process Explained",
      duration: "4:30",
      description:
        "Learn how to bring your spouse to the U.S. using the IR-1/CR-1 visa. This guide covers the I-130 petition, NVC processing, and the crucial interview stage.",
    },
  },
  {
    id: "ir5",
    title: "IR-5 Parent Visa",
    category: "Family",
    process: "Consular",
    description: "For parents of U.S. citizens. Immediate relative status.",
    matchScore: 95,
    time: "10-12 mo",
    cost: "$1,200",
    color: "bg-emerald-100 text-emerald-700 border-emerald-200",
    visaCode: "IR-5",
    bestFor: "Parents of U.S. citizens (over 21)",
    stations: 5,
    difficulty: "Medium",
    pakistanFocused: false,
    quickRoadmap: [
      "File I-130 with USCIS",
      "NVC processing",
      "Embassy Interview",
      "Visa issuance",
      "Travel to US",
    ],
    introVideo: {
      title: "Parent Visa (IR-5) Overview",
      duration: "3:45",
      description:
        "A step-by-step guide for U.S. citizens sponsoring their parents. Understand the financial requirements and document gathering process.",
    },
  },
  {
    id: "f1",
    title: "F1 Student Visa",
    category: "Study",
    process: "Consular",
    description: "Academic studies in the US. Requires university acceptance.",
    matchScore: 85,
    time: "3-6 mo",
    cost: "$510",
    color: "bg-purple-100 text-purple-700 border-purple-200",
    visaCode: "F-1",
    bestFor: "Students accepted into U.S. academic programs",
    stations: 3,
    difficulty: "Low",
    pakistanFocused: false,
    quickRoadmap: [
      "Apply to School",
      "Receive I-20",
      "Pay SEVIS Fee",
      "Visa Interview",
      "Travel",
    ],
    introVideo: {
      title: "U.S. Student Visa Guide",
      duration: "5:10",
      description:
        "From university acceptance to the embassy interview. Tips for demonstrating strong ties to your home country and funding your education.",
    },
  },
  {
    id: "germany-student",
    title: "Germany Student Visa",
    category: "Study",
    process: "Consular",
    description: "National study visa for Germany. Requires university admission.",
    matchScore: 82,
    time: "4-8 mo",
    cost: "€11,208 (Blocked)",
    color: "bg-emerald-100 text-emerald-700 border-emerald-200",
    visaCode: "16b AufenthG",
    bestFor: "Students accepted into German academic programs",
    stations: 4,
    difficulty: "Medium",
    pakistanFocused: true,
    quickRoadmap: [
      "University Admission",
      "Document Prep",
      "Blocked Account",
      "Visa Appointment",
      "Arrive in Germany",
    ],
  },
  {
    id: "h1b",
    title: "H-1B Specialty Occupation",
    category: "Work",
    process: "Consular",
    description: "For foreign workers in specialty occupations.",
    matchScore: 70,
    time: "6-9 mo",
    cost: "$460+",
    color: "bg-orange-100 text-orange-700 border-orange-200",
    visaCode: "H-1B",
    bestFor:
      "Professionals with bachelor's degree or higher in specialty occupations",
    stations: 4,
    difficulty: "High",
    pakistanFocused: false,
    quickRoadmap: [
      "Employer files Petition",
      "USCIS Approval",
      "DS-160 & Interview",
      "Visa Stamping",
      "Travel to US",
    ],
    introVideo: {
      title: "H-1B Work Visa Explained",
      duration: "5:15",
      description:
        "The H-1B is one of the most sought-after work visas. It requires a U.S. employer sponsor and a bachelor's degree. With annual caps and lottery systems, competition is fierce.",
    },
  },
  // Family & Protection - Spouse/Fiance
  {
    id: "k1",
    title: "K-1 Fiancé(e) Visa",
    category: "Family",
    process: "Consular",
    description:
      "For fiancé(e)s of U.S. citizens to travel to U.S. for marriage.",
    matchScore: 88,
    time: "8-10 mo",
    cost: "$800+",
    color: "bg-pink-100 text-pink-700 border-pink-200",
    visaCode: "K-1",
    bestFor: "Fiancé(e) of U.S. Citizen",
    stations: 4,
    difficulty: "Medium",
    pakistanFocused: false,
    quickRoadmap: ["File I-129F", "NVC", "Interview", "Travel & Marry"],
  },
  {
    id: "k3",
    title: "K-3 Spouse Visa",
    category: "Family",
    process: "Consular",
    description: "Speed up family reunification for spouses.",
    matchScore: 60,
    time: "Varies",
    cost: "Varies",
    color: "bg-slate-50 text-slate-600 border-slate-200",
    visaCode: "K-3",
    bestFor: "Spouse (short-separation option)",
    stations: 4,
    difficulty: "Medium",
    pakistanFocused: false,
    quickRoadmap: ["File I-130", "File I-129F", "Approval", "Visa"],
  },
  {
    id: "ir2",
    title: "IR-2 / CR-2 Child Visa",
    category: "Family",
    process: "Consular",
    description: "For unmarried children (under 21) of U.S. citizens.",
    matchScore: 80,
    time: "10-14 mo",
    cost: "$1,200",
    color: "bg-blue-50 text-blue-600 border-blue-200",
    visaCode: "IR-2/CR-2",
    bestFor: "Child of U.S. Citizen",
    stations: 4,
    difficulty: "Low",
    pakistanFocused: false,
    quickRoadmap: ["File I-130", "NVC Processing", "Interview", "Arrival"],
  },
  {
    id: "ir3_4",
    title: "IR-3 / IR-4 Adoption",
    category: "Family",
    process: "Consular",
    description: "For orphans adopted abroad or to be adopted in U.S.",
    matchScore: 50,
    time: "Varies",
    cost: "Varies",
    color: "bg-slate-50 text-slate-600 border-slate-200",
    visaCode: "IR-3/IR-4",
    bestFor: "Intercountry Adoption",
    stations: 5,
    difficulty: "High",
    pakistanFocused: false,
    quickRoadmap: [
      "Adoption Process",
      "File Petition",
      "Visa Interview",
      "Arrival",
    ],
  },
  // Family Preferences
  {
    id: "fp1",
    title: "F-1 Family Preference",
    category: "Family",
    process: "Consular",
    description: "Unmarried sons and daughters (21+) of U.S. citizens.",
    matchScore: 65,
    time: "7+ years",
    cost: "$1,000+",
    color: "bg-slate-50 text-slate-600 border-slate-200",
    visaCode: "F-1 (Family)",
    bestFor: "Adult Child (Unmarried) of U.S. Citizen",
    stations: 3,
    difficulty: "Medium",
    pakistanFocused: false,
    quickRoadmap: ["File I-130", "Wait for Priority Date", "NVC & Interview"],
  },
  {
    id: "f2a",
    title: "F-2A Residence Spouse/Child",
    category: "Family",
    process: "Consular",
    description: "Spouses and children (unmarried, under 21) of LPRs.",
    matchScore: 75,
    time: "2-4 years",
    cost: "Varies",
    color: "bg-slate-50 text-slate-600 border-slate-200",
    visaCode: "F-2A",
    bestFor: "Spouse/Child of Green Card Holder",
    stations: 4,
    difficulty: "Medium",
    pakistanFocused: false,
    quickRoadmap: ["File I-130", "Wait for Priority Date", "NVC", "Interview"],
  },
  {
    id: "f2b",
    title: "F-2B Residence Adult Child",
    category: "Family",
    process: "Consular",
    description: "Unmarried sons and daughters (21+) of LPRs.",
    matchScore: 65,
    time: "7+ years",
    cost: "Varies",
    color: "bg-slate-50 text-slate-600 border-slate-200",
    visaCode: "F-2B",
    bestFor: "Adult Child (Unmarried) of Green Card Holder",
    stations: 3,
    difficulty: "Medium",
    pakistanFocused: false,
    quickRoadmap: ["File I-130", "Wait for Priority Date", "NVC", "Interview"],
  },
  {
    id: "f3",
    title: "F-3 Married Child",
    category: "Family",
    process: "Consular",
    description: "Married sons and daughters of U.S. citizens.",
    matchScore: 60,
    time: "10+ years",
    cost: "Varies",
    color: "bg-slate-50 text-slate-600 border-slate-200",
    visaCode: "F-3",
    bestFor: "Adult Child (Married) of U.S. Citizen",
    stations: 3,
    difficulty: "Medium",
    pakistanFocused: false,
    quickRoadmap: ["File I-130", "Wait for Priority Date", "NVC", "Interview"],
  },
  {
    id: "f4",
    title: "F-4 Sibling",
    category: "Family",
    process: "Consular",
    description: "Brothers and sisters of U.S. citizens.",
    matchScore: 55,
    time: "15+ years",
    cost: "Varies",
    color: "bg-slate-50 text-slate-600 border-slate-200",
    visaCode: "F-4",
    bestFor: "Sibling of U.S. Citizen",
    stations: 3,
    difficulty: "Medium",
    pakistanFocused: false,
    quickRoadmap: ["File I-130", "Wait for Priority Date", "NVC", "Interview"],
  },
  // Humanitarian
  {
    id: "refugee",
    title: "Refugee",
    category: "Humanitarian",
    process: "Consular",
    description: "Protection for those persecuted in home country.",
    matchScore: 40,
    time: "Varies",
    cost: "Free",
    color: "bg-amber-100 text-amber-700 border-amber-200",
    visaCode: "Refugee",
    bestFor: "Refugee (USRAP)",
    stations: 5,
    difficulty: "High",
    pakistanFocused: false,
    quickRoadmap: ["UN/Referral", "USRAP Processing", "Interview", "Admission"],
  },
  {
    id: "asylum",
    title: "Asylum",
    category: "Humanitarian",
    process: "AOS",
    description: "Protection for those already in the U.S.",
    matchScore: 40,
    time: "Varies",
    cost: "Free",
    color: "bg-amber-100 text-amber-700 border-amber-200",
    visaCode: "Asylum",
    bestFor: "Asylum (typically filed in U.S.)",
    stations: 4,
    difficulty: "High",
    pakistanFocused: false,
    quickRoadmap: ["File I-589", "Biometrics", "Interview", "Decision"],
  },
  {
    id: "parole",
    title: "Humanitarian Parole",
    category: "Humanitarian",
    process: "Consular",
    description: "Temporary entry for urgent humanitarian reasons.",
    matchScore: 35,
    time: "Varies",
    cost: "$575",
    color: "bg-amber-100 text-amber-700 border-amber-200",
    visaCode: "Parole",
    bestFor: "Humanitarian Parole (case-by-case)",
    stations: 3,
    difficulty: "High",
    pakistanFocused: false,
    quickRoadmap: ["File I-131", "Decision", "Travel", "Parole at Port"],
  },
  // Work
  {
    id: "l1",
    title: "L-1 Intracompany Transferee",
    category: "Work",
    process: "Consular",
    description: "Transfer to a U.S. office of your current employer.",
    matchScore: 60,
    time: "3-6 mo",
    cost: "$460+",
    color: "bg-orange-50 text-orange-600 border-orange-200",
    visaCode: "L-1A/L-1B",
    bestFor: "Company Transfer (Manager / Specialist)",
    stations: 4,
    difficulty: "Medium",
    pakistanFocused: false,
    quickRoadmap: ["Employer Petition", "Approval", "Visa Interview", "Travel"],
  },
  {
    id: "o1",
    title: "O-1 Extraordinary Ability",
    category: "Work",
    process: "Consular",
    description: "For individuals with extraordinary ability or achievement.",
    matchScore: 50,
    time: "3-6 mo",
    cost: "$460+",
    color: "bg-orange-50 text-orange-600 border-orange-200",
    visaCode: "O-1A / O-1B",
    bestFor: "Extraordinary Talent (Science / Business / Arts)",
    stations: 4,
    difficulty: "High",
    pakistanFocused: false,
    quickRoadmap: [
      "Employer Petition",
      "Peer Consultation",
      "Approval",
      "Visa",
    ],
  },
  {
    id: "o2",
    title: "O-2 Support Personnel",
    category: "Work",
    process: "Consular",
    description: "Essential support personnel for O-1 artists/athletes.",
    matchScore: 40,
    time: "3-6 mo",
    cost: "$460+",
    color: "bg-slate-50 text-slate-600 border-slate-200",
    visaCode: "O-2",
    bestFor: "Support Staff for O-1",
    stations: 4,
    difficulty: "Medium",
    pakistanFocused: false,
    quickRoadmap: ["File Petition", "Approval", "Interview", "Travel"],
  },
  {
    id: "p_visa",
    title: "P Visa Athlete/Entertainer",
    category: "Work",
    process: "Consular",
    description: "For athletes, entertainers, and artists.",
    matchScore: 45,
    time: "3-6 mo",
    cost: "$460+",
    color: "bg-slate-50 text-slate-600 border-slate-200",
    visaCode: "P-1/P-2/P-3",
    bestFor: "Athlete / Entertainer / Tour Group",
    stations: 4,
    difficulty: "Medium",
    pakistanFocused: false,
    quickRoadmap: ["Group Petition", "Approval", "Interview", "Travel"],
  },
  {
    id: "e1",
    title: "E-1 Treaty Trader",
    category: "Work",
    process: "Consular",
    description: "For nationals of countries with commerce treaties with U.S.",
    matchScore: 55,
    time: "2-4 mo",
    cost: "Varies",
    color: "bg-slate-50 text-slate-600 border-slate-200",
    visaCode: "E-1",
    bestFor: "Treaty Trader",
    stations: 3,
    difficulty: "Medium",
    pakistanFocused: true,
    quickRoadmap: ["Application", "Interview", "Approval", "Travel"],
  },
  {
    id: "e2",
    title: "E-2 Treaty Investor",
    category: "Work",
    process: "Consular",
    description: "Invest substantial capital in a U.S. business.",
    matchScore: 55,
    time: "2-4 mo",
    cost: "Varies",
    color: "bg-slate-50 text-slate-600 border-slate-200",
    visaCode: "E-2",
    bestFor: "Treaty Investor",
    stations: 3,
    difficulty: "High",
    pakistanFocused: true,
    quickRoadmap: [
      "Business Plan",
      "Investment",
      "Consular Filing",
      "Interview",
    ],
  },
  {
    id: "r1",
    title: "R-1 Religious Worker",
    category: "Work",
    process: "Consular",
    description: "For non-immigrant religious workers.",
    matchScore: 30,
    time: "3-6 mo",
    cost: "$460+",
    color: "bg-slate-50 text-slate-600 border-slate-200",
    visaCode: "R-1",
    bestFor: "Religious Worker",
    stations: 4,
    difficulty: "Medium",
    pakistanFocused: false,
    quickRoadmap: ["Employer Petition", "Site Visit", "Approval", "Interview"],
  },
  {
    id: "q1",
    title: "Q-1 Cultural Exchange",
    category: "Work",
    process: "Consular",
    description: "International cultural exchange programs.",
    matchScore: 30,
    time: "2-4 mo",
    cost: "$460+",
    color: "bg-slate-50 text-slate-600 border-slate-200",
    visaCode: "Q-1",
    bestFor: "Cultural Exchange (Work + Culture)",
    stations: 3,
    difficulty: "Low",
    pakistanFocused: false,
    quickRoadmap: ["Sponsor Petition", "Approval", "Interview", "Travel"],
  },
  {
    id: "i_visa",
    title: "I Visa Media",
    category: "Work",
    process: "Consular",
    description: "For representatives of foreign media.",
    matchScore: 20,
    time: "1-3 mo",
    cost: "$185",
    color: "bg-slate-50 text-slate-600 border-slate-200",
    visaCode: "I",
    bestFor: "Journalist / Media",
    stations: 2,
    difficulty: "Low",
    pakistanFocused: false,
    quickRoadmap: ["Application", "Interview", "travel"],
  },
  {
    id: "h2a",
    title: "H-2A Agricultural",
    category: "Work",
    process: "Consular",
    description: "Temporary agricultural workers.",
    matchScore: 25,
    time: "2-4 mo",
    cost: "$460+",
    color: "bg-slate-50 text-slate-600 border-slate-200",
    visaCode: "H-2A",
    bestFor: "Seasonal Agriculture (eligibility list applies)",
    stations: 4,
    difficulty: "Medium",
    pakistanFocused: false,
    quickRoadmap: ["Labor Cert", "Petition", "Interview", "Travel"],
  },
  {
    id: "h2b",
    title: "H-2B Non-Agricultural",
    category: "Work",
    process: "Consular",
    description: "Temporary non-agricultural workers.",
    matchScore: 25,
    time: "3-5 mo",
    cost: "$460+",
    color: "bg-slate-50 text-slate-600 border-slate-200",
    visaCode: "H-2B",
    bestFor: "Seasonal Non-Agriculture (eligibility list applies)",
    stations: 4,
    difficulty: "Medium",
    pakistanFocused: false,
    quickRoadmap: ["Labor Cert", "Petition", "Interview", "Travel"],
  },
  {
    id: "h3",
    title: "H-3 Trainee",
    category: "Work",
    process: "Consular",
    description: "Training programs not available in home country.",
    matchScore: 20,
    time: "3-6 mo",
    cost: "$460+",
    color: "bg-slate-50 text-slate-600 border-slate-200",
    visaCode: "H-3",
    bestFor: "Trainee / Special Education Exchange",
    stations: 3,
    difficulty: "Medium",
    pakistanFocused: false,
    quickRoadmap: ["Petition", "Approval", "Interview", "Travel"],
  },
  // Work Green Cards
  {
    id: "eb1",
    title: "EB-1 Priority Worker",
    category: "Work",
    process: "Consular",
    description: "Permanent residence for extraordinary ability.",
    matchScore: 40,
    time: "12-24 mo",
    cost: "$700+",
    color: "bg-emerald-50 text-emerald-600 border-emerald-200",
    visaCode: "EB-1",
    bestFor: "Extraordinary Ability / Top Talent",
    stations: 4,
    difficulty: "High",
    pakistanFocused: false,
    quickRoadmap: ["Petition", "Decision", "Consular/AOS", "Green Card"],
  },
  {
    id: "eb2",
    title: "EB-2 Advanced Degree",
    category: "Work",
    process: "Consular",
    description: "Professionals with advanced degrees.",
    matchScore: 45,
    time: "18-36 mo",
    cost: "$700+",
    color: "bg-emerald-50 text-emerald-600 border-emerald-200",
    visaCode: "EB-2",
    bestFor: "Advanced Degree / Exceptional Ability",
    stations: 5,
    difficulty: "High",
    pakistanFocused: false,
    quickRoadmap: [
      "Labor Cert",
      "Petition",
      "Priority Date",
      "Interview",
      "Green Card",
    ],
  },
  {
    id: "eb2_niw",
    title: "EB-2 NIW",
    category: "Work",
    process: "Consular",
    description: "National Interest Waiver for EB-2.",
    matchScore: 50,
    time: "12-24 mo",
    cost: "$700+",
    color: "bg-emerald-50 text-emerald-600 border-emerald-200",
    visaCode: "EB-2 NIW",
    bestFor: "National Interest Waiver (NIW)",
    stations: 4,
    difficulty: "High",
    pakistanFocused: false,
    quickRoadmap: ["Self-Petition", "Approval", "Consular/AOS", "Green Card"],
  },
  {
    id: "eb3",
    title: "EB-3 Skilled Worker",
    category: "Work",
    process: "Consular",
    description: "Skilled workers, professionals, and other workers.",
    matchScore: 45,
    time: "2-4 years",
    cost: "$700+",
    color: "bg-emerald-50 text-emerald-600 border-emerald-200",
    visaCode: "EB-3",
    bestFor: "Skilled Worker / Professional",
    stations: 5,
    difficulty: "Medium",
    pakistanFocused: false,
    quickRoadmap: ["Labor Cert", "Petition", "Wait", "Interview", "Green Card"],
  },
  {
    id: "eb4",
    title: "EB-4 Special Immigrant",
    category: "Work",
    process: "Consular",
    description: "Religious workers and other special categories.",
    matchScore: 30,
    time: "Varies",
    cost: "Varies",
    color: "bg-emerald-50 text-emerald-600 border-emerald-200",
    visaCode: "EB-4",
    bestFor: "Special Immigrants (varies)",
    stations: 4,
    difficulty: "Medium",
    pakistanFocused: false,
    quickRoadmap: ["Petition", "Approval", "Interview", "Green Card"],
  },
  {
    id: "eb5",
    title: "EB-5 Investor",
    category: "Work",
    process: "Consular",
    description: "Green card through investment.",
    matchScore: 20,
    time: "2-4 years",
    cost: "$800k+",
    color: "bg-emerald-50 text-emerald-600 border-emerald-200",
    visaCode: "EB-5",
    bestFor: "Investor Green Card",
    stations: 4,
    difficulty: "High",
    pakistanFocused: false,
    quickRoadmap: ["Invest", "Petition", "Conditional GC", "Remove Conditions"],
  },
  {
    id: "dv",
    title: "Diversity Visa",
    category: "Other",
    process: "Consular",
    description: "Annual lottery for low-admission countries.",
    matchScore: 10,
    time: "1-2 years",
    cost: "~$330",
    color: "bg-emerald-50 text-emerald-600 border-emerald-200",
    visaCode: "DV",
    bestFor: "Diversity Visa (DV Lottery)",
    stations: 4,
    difficulty: "High",
    pakistanFocused: false,
    quickRoadmap: ["Enter Lottery", "Selection", "DS-260", "Interview"],
  },
  // Students & Visitors
  {
    id: "b2",
    title: "B-2 Tourist Visa",
    category: "Visit",
    process: "Consular",
    description: "For tourism, vacation, or visiting family.",
    matchScore: 90,
    time: "1-3 mo",
    cost: "$185",
    color: "bg-cyan-50 text-cyan-600 border-cyan-200",
    visaCode: "B-2",
    bestFor: "Tourism / Family Visit",
    stations: 3,
    difficulty: "Medium",
    pakistanFocused: true,
    quickRoadmap: ["DS-160", "Schedule", "Interview", "Travel"],
  },
  {
    id: "b1",
    title: "B-1 Business Visitor",
    category: "Visit",
    process: "Consular",
    description: "Consult with associates, attend conferences.",
    matchScore: 60,
    time: "1-3 mo",
    cost: "$185",
    color: "bg-cyan-50 text-cyan-600 border-cyan-200",
    visaCode: "B-1",
    bestFor: "Business Visitor",
    stations: 3,
    difficulty: "Medium",
    pakistanFocused: true,
    quickRoadmap: ["DS-160", "Schedule", "Interview", "Travel"],
  },
  {
    id: "f2_dep",
    title: "F-2 Student Dependent",
    category: "Study",
    process: "Consular",
    description: "Dependents of F-1 students.",
    matchScore: 50,
    time: "2-4 mo",
    cost: "$185",
    color: "bg-purple-50 text-purple-600 border-purple-200",
    visaCode: "F-2",
    bestFor: "Student Dependent",
    stations: 3,
    difficulty: "Low",
    pakistanFocused: false,
    quickRoadmap: ["I-20", "DS-160", "Interview", "Travel"],
  },
  {
    id: "m1",
    title: "M-1 Vocational Student",
    category: "Study",
    process: "Consular",
    description: "Vocational or non-academic studies.",
    matchScore: 30,
    time: "3-6 mo",
    cost: "$185+",
    color: "bg-purple-50 text-purple-600 border-purple-200",
    visaCode: "M-1",
    bestFor: "Vocational / Technical Student",
    stations: 3,
    difficulty: "Medium",
    pakistanFocused: false,
    quickRoadmap: ["Apply", "I-20", "Visa", "Travel"],
  },
  {
    id: "m2",
    title: "M-2 Vocational Dependent",
    category: "Study",
    process: "Consular",
    description: "Dependents of M-1 students.",
    matchScore: 20,
    time: "2-4 mo",
    cost: "$185",
    color: "bg-purple-50 text-purple-600 border-purple-200",
    visaCode: "M-2",
    bestFor: "Vocational Dependent",
    stations: 3,
    difficulty: "Low",
    pakistanFocused: false,
    quickRoadmap: ["I-20", "DS-160", "Interview", "Travel"],
  },
  {
    id: "j1",
    title: "J-1 Exchange Visitor",
    category: "Study",
    process: "Consular",
    description: "Work-and-study exchange visitor programs.",
    matchScore: 60,
    time: "2-5 mo",
    cost: "Varies",
    color: "bg-purple-50 text-purple-600 border-purple-200",
    visaCode: "J-1",
    bestFor: "Exchange Visitor (Programs)",
    stations: 4,
    difficulty: "Medium",
    pakistanFocused: true,
    quickRoadmap: ["Program Accept", "DS-2019", "Visa Interview", "Travel"],
  },
  {
    id: "j2",
    title: "J-2 Exchange Dependent",
    category: "Study",
    process: "Consular",
    description: "Dependents of J-1 exchange visitors.",
    matchScore: 40,
    time: "2-4 mo",
    cost: "Varies",
    color: "bg-purple-50 text-purple-600 border-purple-200",
    visaCode: "J-2",
    bestFor: "Exchange Dependent",
    stations: 3,
    difficulty: "Low",
    pakistanFocused: false,
    quickRoadmap: ["DS-2019", "DS-160", "Interview", "Travel"],
  },
];

interface ExploreJourneysProps {
  origin: string;
  destination: string;
}

export default function ExploreJourneys({
  origin,
  destination,
}: ExploreJourneysProps) {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [ir1Progress, setIr1Progress] = useState<JourneyProgressRecord | null>(
    null,
  );

  const searchParams = useSearchParams();
  const categoryFromUrl = searchParams.get("category");
  const router = useRouter();

  const [checkingProgress, setCheckingProgress] = useState(true);

  // Check if logged-in user has an existing IR-1 journey
  useEffect(() => {
    let active = true;

    if (!user?.id) {
      setIr1Progress(null);
      setCheckingProgress(false);
      return;
    }

    setCheckingProgress(true);
    loadJourneyProgress(user.id, "ir1")
      .then((record) => {
        if (!active) return;
        if (record && record.started) {
          setIr1Progress(record);
        } else {
          setIr1Progress(null);
        }
        setCheckingProgress(false);
      })
      .catch(() => {
        if (!active) return;
        setCheckingProgress(false);
      });

    return () => {
      active = false;
    };
  }, [user?.id]);

  const ir1HasProgress = !!ir1Progress;
  const isUrdu = language === "ur";

  const getTranslated = (journey: Journey, prop: keyof Journey): any => {
    if (prop === "quickRoadmap") {
      const roadmap = t(`visaCategory.journeys.${journey.id}.quickRoadmap`, { returnObjects: true });
      return Array.isArray(roadmap) ? roadmap : journey.quickRoadmap;
    }
    const val = t(`visaCategory.journeys.${journey.id}.${prop}`);
    const key = `visaCategory.journeys.${journey.id}.${prop}`;
    return val !== key ? val : journey[prop];
  };

  // Calculate progress percentage for IR-1 if it exists
  const ir1ProgressPercent = React.useMemo(() => {
    if (!ir1Progress) return 0;
    const totalSteps = roadmapData.stages.reduce(
      (acc, s) => acc + s.steps.length,
      0,
    );
    const completedCount = Array.isArray(ir1Progress.completed_steps)
      ? ir1Progress.completed_steps.length
      : 0;
    return Math.round((completedCount / totalSteps) * 100);
  }, [ir1Progress]);

  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedProcess, setSelectedProcess] = useState("Consular");
  const [highlightedJourney, setHighlightedJourney] = useState<string | null>(
    null,
  );
  const [selectedJourneys, setSelectedJourneys] = useState<string[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isMatcherOpen, setIsMatcherOpen] = useState(false);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [isQuickRoadmapOpen, setIsQuickRoadmapOpen] = useState(false);
  const [videoModalJourney, setVideoModalJourney] = useState<Journey | null>(
    null,
  );
  const [isVisaWizardOpen, setIsVisaWizardOpen] = useState(false);

  const [selectedStationKey, setSelectedStationKey] = useState<string>("uscis");

  useEffect(() => {
    if (categoryFromUrl) {
      setSelectedCategory(categoryFromUrl);
    }
  }, [categoryFromUrl]);

  // Effect to reset selected station when journey changes
  React.useEffect(() => {
    if (highlightedJourney) {
      const stations = JOURNEY_DETAILS[highlightedJourney];
      if (stations && stations.length > 0) {
        setSelectedStationKey(stations[0].key);
      }
    }
  }, [highlightedJourney]);

  // Filter Logic
  const filteredJourneys = JOURNEYS.filter((j) => {
    if (selectedCategory !== "all" && j.category !== selectedCategory)
      return false;
    if (j.process !== selectedProcess) return false;
    return true;
  });

  const bestMatches = filteredJourneys.filter((j) => j.matchScore > 90);
  const otherJourneys = filteredJourneys.filter((j) => j.matchScore <= 90);

  const toggleCompare = (
    id: string,
    e: React.MouseEvent | { stopPropagation: () => void },
  ) => {
    e.stopPropagation();
    if (selectedJourneys.includes(id)) {
      setSelectedJourneys(selectedJourneys.filter((j) => j !== id));
    } else {
      if (selectedJourneys.length < 3) {
        setSelectedJourneys([...selectedJourneys, id]);
      }
    }
  };

  return (
    <div className="w-full bg-slate-50/50 min-h-screen font-sans text-slate-800">
      {/* Filters Section */}
      <section className="top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm py-4">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
            <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <Search className="w-5 h-5 text-primary" />
              {t("visaCategory.exploreFilters")}
            </h3>
            <div className="flex items-center gap-4"></div>
          </div>

          <Dialog
            open={isCompareModalOpen}
            onOpenChange={setIsCompareModalOpen}
          >
            <DialogContent className="max-h-[85vh] overflow-y-auto w-[95%] max-w-4xl p-4 md:p-6 rounded-xl gap-4">
              <DialogHeader>
                <DialogTitle className="pr-8">{t("visaCategory.journeyComparison")}</DialogTitle>
                <DialogDescription className="sr-only">
                  {t("visaCategory.journeyComparisonDesc")}
                </DialogDescription>
              </DialogHeader>

              <div className="flex justify-center md:justify-end">
                <Button
                  variant="outline"
                  onClick={() => setIsVisaWizardOpen(true)}
                  className="gap-2 bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 hover:text-emerald-800"
                >
                  <CheckCircle className="w-4 h-4" />
                  {t("visaCategory.visaChecker")}
                </Button>
              </div>

              <div className="mt-6 overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="py-4 px-4 font-bold text-slate-800 w-32">
                        {t("visaCategory.feature")}
                      </th>
                      {selectedJourneys.map((id) => {
                        const journey = JOURNEYS.find((j) => j.id === id);
                        return (
                          <th
                            key={id}
                            className="py-4 px-4 font-bold text-slate-900 min-w-50"
                          >
                            {journey ? getTranslated(journey, "title") : t("visaCategory.unknown")}
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="py-4 px-4 font-bold text-slate-800">
                        {t("visaCategory.visaCode")}
                      </td>
                      {selectedJourneys.map((id) => {
                        const journey = JOURNEYS.find((j) => j.id === id);
                        return (
                          <td key={id} className="py-4 px-4 text-slate-600">
                            {journey?.visaCode}
                          </td>
                        );
                      })}
                    </tr>
                    <tr>
                      <td className="py-4 px-4 font-bold text-slate-800">
                        {t("visaCategory.bestFor")}
                      </td>
                      {selectedJourneys.map((id) => {
                        const journey = JOURNEYS.find((j) => j.id === id);
                        return (
                          <td
                            key={id}
                            className="py-4 px-4 text-slate-600 leading-relaxed"
                          >
                            {journey ? getTranslated(journey, "bestFor") : ""}
                          </td>
                        );
                      })}
                    </tr>
                    <tr>
                      <td className="py-4 px-4 font-bold text-slate-800">
                        {t("visaCategory.stations")}
                      </td>
                      {selectedJourneys.map((id) => {
                        const journey = JOURNEYS.find((j) => j.id === id);
                        return (
                          <td key={id} className="py-4 px-4 text-slate-600">
                            {journey?.stations}
                          </td>
                        );
                      })}
                    </tr>
                    <tr>
                      <td className="py-4 px-4 font-bold text-slate-800">
                        {t("visaCategory.difficulty")}
                      </td>
                      {selectedJourneys.map((id) => {
                        const journey = JOURNEYS.find((j) => j.id === id);
                        return (
                          <td key={id} className="py-4 px-4 text-slate-600">
                            {journey?.difficulty}
                          </td>
                        );
                      })}
                    </tr>
                    <tr>
                      <td className="py-4 px-4 font-bold text-slate-800">
                        {t("visaCategory.priorityPath")}
                      </td>
                      {selectedJourneys.map((id) => {
                        const journey = JOURNEYS.find((j) => j.id === id);
                        return (
                          <td key={id} className="py-4 px-4 text-slate-600">
                            {(journey?.matchScore ?? 0) > 90
                              ? "Yes"
                              : "Standard"}
                          </td>
                        );
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog
            open={isQuickRoadmapOpen}
            onOpenChange={setIsQuickRoadmapOpen}
          >
            <DialogContent className="w-[95%] max-w-2xl p-4 md:p-6 rounded-xl gap-4">
              <DialogHeader>
                <DialogTitle className="pr-8">
                  Quick Roadmap:{" "}
                  {highlightedJourney
                    ? JOURNEYS.find((j) => j.id === highlightedJourney)
                        ?.bestFor.split(" which")[0]
                        .replace(
                          "Married couples where one spouse is a ",
                          "Spouse of ",
                        )
                    : ""}
                </DialogTitle>
                <DialogDescription className="sr-only">
                  Quick summary of the roadmap steps.
                </DialogDescription>
              </DialogHeader>
              <div className="pt-6 space-y-6">
                <ol className="list-decimal space-y-6 pl-5 text-slate-700">
                  {highlightedJourney &&
                    JOURNEYS.find(
                      (j) => j.id === highlightedJourney,
                    )?.quickRoadmap?.map((step, idx) => (
                      <li key={idx} className="pl-2">
                        <span className="text-slate-700">{step}</span>
                      </li>
                    ))}
                </ol>
              </div>
            </DialogContent>
          </Dialog>

          {/* Video Modal */}
          <Dialog
            open={!!videoModalJourney}
            onOpenChange={(open) => !open && setVideoModalJourney(null)}
          >
            <DialogContent className="w-[95%] max-w-2xl bg-white p-0 overflow-hidden rounded-xl">
              <DialogHeader className="p-6 pb-2">
                <DialogTitle className="text-xl font-bold text-slate-900 pr-8">
                  {videoModalJourney?.introVideo?.title || "Journey Overview"}
                </DialogTitle>
                <DialogDescription className="sr-only">
                  Intro video for the selected visa journey.
                </DialogDescription>
              </DialogHeader>

              <div className="px-6 pb-6">
                <div className="relative aspect-video bg-slate-900 rounded-lg overflow-hidden group cursor-pointer mb-6">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/30 transition-all">
                      <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-slate-900 shadow-lg pl-1">
                        <svg
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path d="M8 5V19L19 12L8 5Z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                    <Clock className="w-4 h-4" />
                    Duration: {videoModalJourney?.introVideo?.duration}
                  </div>

                  <p className="text-slate-600 leading-relaxed">
                    {videoModalJourney?.introVideo?.description}
                  </p>

                  <p className="text-xs text-slate-400 italic pt-2">
                    Note: This is a placeholder. In production, this would be a
                    real video embed.
                  </p>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isVisaWizardOpen} onOpenChange={setIsVisaWizardOpen}>
            <DialogContent className="max-w-4xl w-[95%] h-[85vh] p-0 bg-transparent border-none shadow-none overflow-hidden">
              <DialogHeader className="sr-only">
                <DialogTitle>Visa Eligibility Wizard</DialogTitle>
                <DialogDescription>
                  Help you determine the best visa category for your situation.
                </DialogDescription>
              </DialogHeader>
              <div className="w-full h-full bg-white rounded-xl overflow-hidden shadow-2xl">
                <VisaEligibilityTool />
              </div>
            </DialogContent>
          </Dialog>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">
            {/* Route */}
            <div className="md:col-span-3 lg:col-span-2 space-y-2">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {t("visaCategory.route")}
              </div>
              <div className="flex items-center gap-2 bg-slate-100 rounded-lg p-2 border border-slate-200 text-sm font-medium text-slate-700">
                <span className="truncate">{origin || t("visaCategory.origin")}</span>
                <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="truncate">{destination || t("visaCategory.destination")}</span>
              </div>
            </div>

            {/* Visa Category */}
            <div className="md:col-span-9 lg:col-span-6 space-y-2">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {t("visaCategory.visaCategory")}
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  "all",
                  "Family",
                  "Work",
                  "Study",
                  "Humanitarian",
                  "Visit",
                  "Other",
                ].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      setSelectedCategory(cat);
                      router.push(`?category=${cat}`, { scroll: false });
                    }}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                      selectedCategory === cat
                        ? "bg-primary text-white shadow-md shadow-primary/20"
                        : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-slate-300",
                    )}
                  >
                    {t(`visaCategory.categories.${cat}`) || cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Process & Stage */}
            <div className="md:col-span-12 lg:col-span-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    {t("visaCategory.processingMethod")}
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-4 h-4 text-primary cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs p-4 bg-white border border-slate-200 shadow-xl">
                        <div className="space-y-3 text-sm">
                          <p>
                            <span className="font-bold text-slate-900">
                              • {t("visaCategory.consularTitle")}
                            </span>{" "}
                            {t("visaCategory.consularTooltip")}
                          </p>
                          <p>
                            <span className="font-bold text-slate-900">
                              • {t("visaCategory.aosTitle")}
                            </span>{" "}
                            {t("visaCategory.aosTooltip")}
                          </p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                  {["Consular", "AOS"].map((proc) => (
                    <button
                      key={proc}
                      onClick={() => setSelectedProcess(proc)}
                      className={cn(
                        "flex-1 py-1 text-sm font-medium rounded-md transition-all",
                        selectedProcess === proc
                          ? "bg-white text-primary shadow-sm"
                          : "text-slate-500 hover:text-slate-700",
                      )}
                    >
                      {proc === "Consular" ? t("visaCategory.processes.Consular") : t("visaCategory.processes.Adjustment of Status")}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col justify-end">
                <Button
                  onClick={() => setIsVisaWizardOpen(true)}
                  className="w-full h-13.5 bg-linear-to-br from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white font-bold rounded-xl shadow-lg shadow-teal-900/20 transition-all flex items-center justify-center gap-3 group active:scale-[0.98] border border-teal-500/30"
                >
                  <CheckCircle className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                  {t("visaCategory.visaChecker")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="container mx-auto px-4 md:px-6 py-8 grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Journey Shelf */}
        <div className="lg:col-span-2 space-y-8 lg:h-[calc(100vh-180px)] lg:overflow-y-auto h-auto pr-3 pb-24 scroll-smooth">
          {bestMatches.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">

                <h2 className="text-xl font-bold text-slate-800">
                  {t("visaCategory.bestMatches")}
                </h2>
              </div>
              <div className="grid gap-4">
                {bestMatches.map((journey) => (
                  <JourneyCard
                    key={journey.id}
                    journey={journey}
                    isActive={highlightedJourney === journey.id}
                    isSelected={selectedJourneys.includes(journey.id)}
                    onSelect={() => setHighlightedJourney(journey.id)}
                    onCompare={(e) => toggleCompare(journey.id, e)}
                    onWatchIntro={() => setVideoModalJourney(journey)}
                    hasProgress={journey.id === "ir1" && ir1HasProgress}
                    isLoading={journey.id === "ir1" && checkingProgress}
                    progressPercent={
                      journey.id === "ir1" ? ir1ProgressPercent : undefined
                    }
                  />
                ))}
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div className="flex items-center gap-2">

              <h2 className="text-xl font-bold text-slate-800">{t("visaCategory.all")}</h2>
            </div>
            {otherJourneys.length > 0 ? (
              <div className="grid gap-4">
                {otherJourneys.map((journey) => (
                  <JourneyCard
                    key={journey.id}
                    journey={journey}
                    isActive={highlightedJourney === journey.id}
                    isSelected={selectedJourneys.includes(journey.id)}
                    onSelect={() => setHighlightedJourney(journey.id)}
                    onCompare={(e) => toggleCompare(journey.id, e)}
                    onWatchIntro={() => setVideoModalJourney(journey)}
                    hasProgress={journey.id === "ir1" && ir1HasProgress}
                    isLoading={journey.id === "ir1" && checkingProgress}
                    progressPercent={
                      journey.id === "ir1" ? ir1ProgressPercent : undefined
                    }
                  />
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-white rounded-xl border border-dashed border-slate-300 text-slate-500">
                {t("visaCategory.noJourneysFound")}
              </div>
            )}
          </div>
        </div>

        {/* Preview Panel */}
        <div className="lg:col-span-3 lg:h-[calc(100vh-180px)] lg:overflow-y-auto h-auto pb-24 scroll-smooth">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden min-h-75 lg:min-h-150 flex flex-col">
            {highlightedJourney ? (
              <>
                {/* Header */}
                <div className="p-4 md:p-6 border-b border-slate-100">
                  <h3 className="text-xl md:text-2xl font-bold text-slate-900">
                    {JOURNEYS.find((j) => j.id === highlightedJourney)?.title}
                  </h3>
                  <p className="text-sm text-slate-500 font-medium mt-1">
                    {
                      JOURNEYS.find((j) => j.id === highlightedJourney)
                        ?.visaCode
                    }
                  </p>
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col p-4 md:p-6 space-y-6 md:space-y-8">
                  {/* Roadmap Stepper */}
                  <div className="px-2 md:px-4 pt-24 md:pt-32 pb-6 bg-slate-50/50 rounded-xl border border-slate-100 overflow-x-auto">
                    <div className="relative flex items-start justify-between min-w-75">
                      {/* Connecting Line */}
                      <div className="absolute left-0 right-0 top-4 -translate-y-1/2 h-1 bg-slate-200 z-0 mx-8"></div>

                      {JOURNEY_DETAILS[highlightedJourney]
                        ?.filter((s) => s.key !== "221g")
                        .map((station, index) => {
                          const isActive = selectedStationKey === station.key;
                          const stations = JOURNEY_DETAILS[
                            highlightedJourney
                          ].filter((s) => s.key !== "221g");
                          const currentIndex = stations.findIndex(
                            (s) => s.key === selectedStationKey,
                          );
                          const isCompleted = index < currentIndex;

                          // 221g Logic
                          const adminStation = JOURNEY_DETAILS[
                            highlightedJourney
                          ].find((s) => s.key === "221g");
                          const isAdminActive = selectedStationKey === "221g";

                          return (
                            <div
                              key={station.key}
                              className="relative z-10 flex flex-col items-center gap-2 cursor-pointer group"
                              onClick={() => setSelectedStationKey(station.key)}
                            >
                              {/* 221g Branch (Only above Interview) */}
                              {station.key === "interview" && adminStation && (
                                <div
                                  className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 flex flex-col items-center gap-2 group/221g"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedStationKey("221g");
                                  }}
                                >
                                  {/* Label Above */}
                                  <div className="text-center pb-1 w-32">
                                    <p
                                      className={cn(
                                        "text-xs font-bold uppercase tracking-wider transition-colors",
                                        isAdminActive
                                          ? "text-slate-900"
                                          : "text-slate-500",
                                      )}
                                    >
                                      {adminStation.label}
                                    </p>
                                    <p className="text-[10px] text-slate-400 hidden md:block leading-tight mt-1">
                                      {adminStation.summary}
                                    </p>
                                  </div>

                                  {/* Node */}
                                  <div className="h-8 flex items-center justify-center bg-transparent z-20">
                                    <div
                                      className={cn(
                                        "rounded-full border-[3px] transition-all bg-white box-border",
                                        isAdminActive
                                          ? "border-amber-500 w-8 h-8 ring-4 ring-amber-50"
                                          : "border-slate-300 group-hover/221g:border-amber-400 w-6 h-6",
                                      )}
                                    ></div>
                                  </div>

                                  {/* Vertical Line Connector */}
                                  <div className="w-0.5 h-8 bg-slate-200"></div>
                                </div>
                              )}

                              <div className="h-8 flex items-center justify-center bg-transparent">
                                <div
                                  className={cn(
                                    "rounded-full border-[3px] transition-all bg-white box-border",
                                    isActive
                                      ? "border-teal-600 w-8 h-8 ring-4 ring-teal-50"
                                      : isCompleted
                                        ? "border-teal-600 bg-teal-600 w-6 h-6"
                                        : "border-slate-300 group-hover:border-teal-400 w-6 h-6",
                                  )}
                                ></div>
                              </div>
                              <div className="text-center pt-1">
                                <p
                                  className={cn(
                                    "text-xs font-bold uppercase tracking-wider transition-colors",
                                    isActive
                                      ? "text-slate-900"
                                      : "text-slate-500",
                                  )}
                                >
                                  {station.label}
                                </p>
                                <p className="text-[10px] text-slate-400 hidden md:block max-w-20 leading-tight mt-1">
                                  {station.summary}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>

                  {/* Detail Card */}
                  {selectedStationKey && (
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <div className="p-4 md:p-6 space-y-6">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="text-lg font-bold text-slate-800">
                            {
                              JOURNEY_DETAILS[highlightedJourney]?.find(
                                (s) => s.key === selectedStationKey,
                              )?.label
                            }{" "}
                            Station
                          </h4>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <h5 className="text-sm font-semibold text-slate-500 mb-2">
                              What happens here
                            </h5>
                            <p className="text-sm text-slate-700 leading-relaxed">
                              {
                                JOURNEY_DETAILS[highlightedJourney]?.find(
                                  (s) => s.key === selectedStationKey,
                                )?.whatYouDo
                              }
                            </p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <h5 className="text-sm font-semibold text-teal-600 mb-2 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-teal-600"></span>
                                Uploads needed
                              </h5>
                              <ul className="space-y-2">
                                {JOURNEY_DETAILS[highlightedJourney]
                                  ?.find((s) => s.key === selectedStationKey)
                                  ?.uploadsNeeded.map((item, idx) => (
                                    <li
                                      key={idx}
                                      className="text-xs text-slate-600 flex items-start gap-2"
                                    >
                                      <span className="text-teal-600 mt-0.5">
                                        •
                                      </span>
                                      {item}
                                    </li>
                                  ))}
                              </ul>
                            </div>
                            <div>
                              <h5 className="text-sm font-semibold text-rose-600 mb-2 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
                                Common pitfalls
                              </h5>
                              <ul className="space-y-2">
                                {JOURNEY_DETAILS[highlightedJourney]
                                  ?.find((s) => s.key === selectedStationKey)
                                  ?.pitfalls.map((item, idx) => (
                                    <li
                                      key={idx}
                                      className="text-xs text-slate-600 flex items-start gap-2"
                                    >
                                      <span className="text-rose-600 mt-0.5">
                                        •
                                      </span>
                                      {item}
                                    </li>
                                  ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-slate-100 flex items-center gap-3 bg-slate-50/50">
                  {highlightedJourney && ["ir1", "ir5", "f1", "germany-student"].includes(highlightedJourney) ? (
                    <Link href={`/visa-category/ir-category/${
                      highlightedJourney === "ir1" ? "ir1-journey" : 
                      highlightedJourney === "ir5" ? "ir5-journey" : 
                      highlightedJourney === "f1" ? "f-1" : 
                      highlightedJourney
                    }`}>
                      <Button className="bg-teal-700 hover:bg-teal-800 text-white shadow-sm shadow-teal-900/10 transition-all active:scale-95">
                        Start Journey
                      </Button>
                    </Link>
                  ) : (
                    <Button
                      disabled
                      className="bg-slate-200 text-slate-500 cursor-not-allowed border-slate-300"
                    >
                      Coming Soon
                    </Button>
                  )}
                  {/* Removed Quick Roadmap button as per request */}
                  <Button
                    variant="outline"
                    className="ml-auto border-slate-200 text-slate-600 hover:text-slate-900"
                    onClick={() =>
                      highlightedJourney &&
                      toggleCompare(highlightedJourney, {
                        stopPropagation: () => {},
                      })
                    }
                  >
                    <Plus className="w-4 h-4 mr-1.5" /> Compare
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-8 text-center text-slate-400 h-full">
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                  <MapPin className="w-6 h-6 md:w-8 md:h-8 text-slate-300" />
                </div>
                <h3 className="text-lg font-semibold text-slate-700 mb-1">
                  No Journey Selected
                </h3>
                <p className="text-sm text-slate-500 max-w-xs mx-auto">
                  Select a journey from the left to view its detailed roadmap
                  and requirements.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Compare Tray */}
      {selectedJourneys.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-6 w-[92%] md:w-auto max-w-2xl">
          <div className="bg-slate-900 text-white px-4 md:px-6 py-3 rounded-full shadow-2xl shadow-indigo-500/20 flex items-center justify-between md:justify-start gap-3 md:gap-6 border border-slate-800 w-full">
            <div className="flex items-center gap-2 md:gap-3">
              <span className="font-semibold text-sm md:text-base whitespace-nowrap">
                {selectedJourneys.length}/3
                <span className="hidden sm:inline"> selected</span>
              </span>
              <div className="flex -space-x-2">
                {selectedJourneys.map((id) => (
                  <div
                    key={id}
                    className="w-6 h-6 md:w-8 md:h-8 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center text-[10px] md:text-xs font-bold"
                  >
                    {JOURNEYS.find((j) => j.id === id)?.title.charAt(0)}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => setIsCompareModalOpen(true)}
                className="bg-indigo-500 hover:bg-indigo-400 text-white rounded-full text-xs md:text-sm px-3 md:px-4"
              >
                Compare <span className="hidden sm:inline ml-1">Journeys</span>{" "}
                <ArrowRight className="w-3 h-3 md:w-4 md:h-4 ml-1" />
              </Button>
              <button
                onClick={() => setSelectedJourneys([])}
                className="text-slate-400 hover:text-white transition-colors p-1"
                aria-label="Clear selection"
              >
                <X className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 60-Second Matcher Mock */}
      {/* <div className="fixed bottom-6 right-6 z-40">
        <Button
          onClick={() => setIsMatcherOpen(true)}
          className="h-14 w-14 rounded-full bg-linear-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white shadow-lg shadow-rose-500/30 flex items-center justify-center p-0"
        >
          <Clock className="w-6 h-6" />
        </Button>
      </div> */}
    </div>
  );
}

function JourneyCard({
  journey,
  isActive,
  isSelected,
  onSelect,
  onCompare,
  onWatchIntro,
  hasProgress,
  progressPercent,
  isLoading,
}: {
  journey: Journey;
  isActive: boolean;
  isSelected: boolean;
  onSelect: () => void;
  onCompare: (e: React.MouseEvent) => void;
  onWatchIntro: () => void;
  hasProgress?: boolean;
  progressPercent?: number;
  isLoading?: boolean;
}) {
  const { t } = useLanguage();

  const getTranslated = (prop: keyof Journey): any => {
    if (prop === "quickRoadmap") {
      const roadmap = t(`visaCategory.journeys.${journey.id}.quickRoadmap`, { returnObjects: true });
      return Array.isArray(roadmap) ? roadmap : journey.quickRoadmap;
    }
    const val = t(`visaCategory.journeys.${journey.id}.${prop}`);
    const key = `visaCategory.journeys.${journey.id}.${prop}`;
    return val !== key ? val : (journey[prop] as any);
  };

  return (
    <div
      onClick={onSelect}
      className={cn(
        "group relative p-6 rounded-xl border transition-all cursor-pointer",
        isActive
          ? "bg-[#F0FDF9] border-teal-600 shadow-md"
          : "bg-white border-slate-200 hover:border-teal-200 hover:shadow-md",
      )}
    >
      {/* Top Row: Type Label & Match & Compare */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={cn(
              "px-3 py-1 rounded-full text-xs font-semibold bg-white border border-slate-200 text-slate-600",
            )}
          >
            {t(`visaCategory.categories.${journey.category}`) || journey.category}
          </span>
          {journey.matchScore > 90 && (
            <span className="hidden md:block">
              {" "}
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100 flex items-center gap-1 ">
                <CheckCircle className="w-3 h-3 " /> {journey.matchScore}% {t("visaCategory.match") || "Match"}
              </span>
            </span>
          )}
          {/* In Progress Badge with Percent */}
          {hasProgress && (
            <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2 py-1 rounded-full border border-teal-200 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {progressPercent !== undefined
                ? t("visaCategory.completePercent", { percent: progressPercent.toString() })
                : t("visaCategory.inProgress")}
            </span>
          )}
        </div>

        {/* Compare Checkbox */}
        <div
          onClick={onCompare}
          className="flex items-center gap-2 cursor-pointer group/compare"
        >
          <div
            className={cn(
              "w-5 h-5 rounded border flex items-center justify-center transition-colors",
              isSelected
                ? "bg-teal-600 border-teal-600 text-white"
                : "border-slate-300 group-hover/compare:border-teal-400",
            )}
          >
            {isSelected && <CheckCircle className="w-3.5 h-3.5" />}
          </div>
          <span
            className={cn(
              "text-xs font-medium",
              isSelected
                ? "text-teal-700"
                : "text-slate-400 group-hover/compare:text-teal-600",
            )}
          >
            {t("visaCategory.compare")}
          </span>
        </div>
      </div>

      {/* Title Section */}
      <div className="mb-4">
        <h3 className="text-xl font-bold text-slate-900 mb-1">
          {getTranslated("title")}
        </h3>
        <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">
          {journey.visaCode}
        </p>
      </div>

      {/* Best For Highlight */}
      <div className="mb-3">
        <h4 className="text-sm font-semibold text-teal-700 mb-1">
          {getTranslated("bestFor")}
        </h4>
        <p className="text-sm text-slate-600 leading-relaxed line-clamp-2">
          {getTranslated("description")}
        </p>
      </div>

      {/* Tags Row */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-xs font-medium text-slate-700">
          <div className="w-1.5 h-1.5 rounded-full bg-slate-500"></div>
          {journey.stations} {t("visaCategory.stations")}
        </div>
        {journey.matchScore > 95 && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-700">
            {t("visaCategory.highApproval")}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center flex-wrap gap-3">
        {["ir1", "ir5", "f1", "germany-student"].includes(journey.id) ? (
          <Link
            href={
              hasProgress
                ? "/my-journeys"
                : `/visa-category/ir-category/${
                    journey.id === "ir1" ? "ir1-journey" : 
                    journey.id === "ir5" ? "ir5-journey" : 
                    journey.id === "f1" ? "f-1" : 
                    journey.id
                  }`
            }
          >
            <Button
              disabled={isLoading}
              className={cn(
                "h-9 px-4 rounded-lg font-medium shadow-none transition-colors",
                hasProgress
                  ? "bg-teal-600 text-white hover:bg-teal-700"
                  : "bg-teal-700 text-white hover:bg-teal-800",
                isLoading && "opacity-80",
              )}
            >
              {isLoading ? (
                <>
                  <Loader size="sm" /> {t("visaCategory.checking")}
                </>
              ) : hasProgress ? (
                <>
                  <ArrowRight className="w-4 h-4 mr-1" /> {t("visaCategory.resumeJourney")}
                </>
              ) : (
                t("visaCategory.startJourney")
              )}
            </Button>
          </Link>
        ) : (
          <Button
            disabled
            className="h-9 px-4 rounded-lg font-medium bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
          >
            {t("visaCategory.map.comingSoon")}
          </Button>
        )}
        {journey.id === "ir1" && (
          <button
            className="text-sm font-medium text-teal-600 hover:text-teal-700 hover:underline ml-1"
            onClick={(e) => {
              e.stopPropagation();
              onWatchIntro();
            }}
          >
            {t("visaCategory.watchIntro")}
          </button>
        )}
      </div>
    </div>
  );
}
