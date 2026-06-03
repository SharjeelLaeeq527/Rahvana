"use client";

import { useEffect, useLayoutEffect, useMemo, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  AlertTriangle,
  FileText,
  CheckCircle,
  Sparkles,
  Folder,
  Layers,
  Zap,
  Mic,
} from "lucide-react";

interface Scene {
  id: string;
  title: string;
  titleLines?: string[];
  description?: string;
  extraContent?: React.ReactNode;
  illustration: string;
}

const colors = {
  deepTeal: "#0d7377",
  softAqua: "#afdbdb",
  mutedLavender: "#cdadcc",
  dustyRose: "#db8090",
  sageGrey: "#89a4a0",
  white: "#ffffff",
  lightBg: "#f8fbfc",
};

const badgeConfig = {
  Basic: {
    bg: "bg-[#e4f4f2]",
    border: "border-[#98d0ca]",
    text: "text-[#0f4040]",
  },
  Premium: {
    bg: "bg-[#f2f4ff]",
    border: "border-[#d8ddff]",
    text: "text-[#24327f]",
  },
  Executive: {
    bg: "bg-[#fdf4d8]",
    border: "border-[#e4cc88]",
    text: "text-[#5a3808]",
  },
};

const interviewModes = {
  prep: {
    label: "Prep Mode",
    icon: BookOpen,
    color: "#0d7377",
    plans: ["Basic"],
    features: [
      "Full Interview Question Bank",
      "Prep Mode (full access)",
      "AI Answer Builder (core feature)",
      "Improve clarity & structure",
      "Make answers interview-ready",
      "Save & edit answers anytime",
    ],
  },

  rapid: {
    label: "Rapid Fire",
    icon: Zap,
    color: "#6b5b7b",
    plans: ["Premium", "Executive"],
    features: [
      "Rapid Fire Mode",
      "Timed questions (pressure simulation)",
      "Fast recall training",
      "Adaptive practice flow",
      "Smart summaries after sessions",
      "Performance review insights",
      "Confidence-building repetition",
    ],
  },

  mock: {
    label: "Mock Interview",
    icon: Mic,
    color: "#9e4a5a",
    plans: ["Executive"],
    features: [
      "Mock Interview Mode (full simulation)",
      "Voice-based interview experience",
      "Speech-to-Text (STT)",
      "Text-to-Speech (TTS)",
      "Real-time interview flow (no UI hints)",
      "Performance analytics",
      "Interview behavior feedback",
    ],
  },
};

const scenes221g: Scene[] = [
  {
    id: "welcome",
    title: "Welcome to the 221(g) Action Planner",
    description:
      "Follow a step-by-step workflow to build a cleaner, embassy-ready response packet.",
    illustration: "welcome",
  },
  {
    id: "what-is",
    title: "What is a 221(g)?",
    description:
      "Section 221(g) of the Immigration and Nationality Act allows consular officers to temporarily refuse a visa application when additional documents or administrative processing is required. This is not a permanent denial; it is a hold pending resolution.",
    extraContent: (
      <p className="mt-4 text-xs font-semibold tracking-wide" style={{ color: colors.sageGrey }}>
        Source: U.S. Department of State
      </p>
    ),
    illustration: "document",
  },
  {
    id: "pitfalls",
    title: "Avoid Pitfalls",
    titleLines: ["Avoid", "Pitfalls", "Early"],
    description: "Common mistakes that cause rejections.",
    illustration: "warning",
  },
  {
    id: "workflow",
    title: "Guided Workflow",
    titleLines: ["Guided", "Workflow", "Path"],
    description: "Step-by-step situation replication.",
    illustration: "checklist",
  },
  {
    id: "output",
    title: "Clean Output",
    titleLines: ["Clean", "Output", "Packet"],
    description: "Embassy-ready Packet & Checklist.",
    illustration: "output",
  },
  {
    id: "wizard",
    title: "How This Works",
    extraContent: (
      <div className="mt-6 mx-auto flex max-w-lg flex-col gap-4 text-left">
        {[
          "Replicate your 221(g) checklist letter using the guided form.",
          "Review and confirm your case details before generation.",
          "Generate an action plan, packet checklist, and cover letter.",
          "Export documents and submit exactly per embassy instructions.",
        ].map((text, i) => (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + i * 0.15, ease: [0.22, 1, 0.36, 1] }}
            key={i}
            className="flex items-start gap-4 rounded-2xl border border-[#afdbdb]/30 bg-white p-4 shadow-[0_10px_30px_-10px_rgba(13,115,119,0.08)]"
          >
            <div
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full font-bold text-white shadow-md"
              style={{
                background: `linear-gradient(135deg, ${colors.deepTeal}, ${colors.softAqua})`,
              }}
            >
              {i + 1}
            </div>
            <p
              className="text-base font-semibold leading-snug md:text-[17px]"
              style={{ color: colors.deepTeal }}
            >
              {text}
            </p>
          </motion.div>
        ))}
      </div>
    ),
    illustration: "wizard",
  },
  {
    id: "needs",
    title: "What You'll Need",
    extraContent: (
      <div className="mx-auto mt-6 max-w-lg space-y-6 text-left">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[
            "Your 221(g) refusal letter",
            "Case Number (e.g. ISL...)",
            "Passport details",
            "Beneficiary email & phone",
          ].map((item, i) => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              key={i}
              className="flex items-center gap-3 rounded-xl border border-[#cdadcc]/30 bg-white p-4 shadow-sm"
            >
              <div
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: colors.dustyRose }}
              />
              <span
                className="text-[15px] font-semibold leading-snug"
                style={{ color: colors.deepTeal }}
              >
                {item}
              </span>
            </motion.div>
          ))}
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-2xl border border-dashed bg-white p-5 shadow-sm"
          style={{ borderColor: colors.dustyRose }}
        >
          <h4
            className="mb-2 text-[11px] font-black uppercase tracking-[0.14em]"
            style={{ color: colors.dustyRose }}
          >
            Important Note
          </h4>
          <p className="text-[14px] font-medium leading-6" style={{ color: colors.sageGrey }}>
            This tool provides general guidance for Pakistan-based cases (Islamabad/Karachi) and is
            not legal advice. Always prioritize your official letter&apos;s instructions.
          </p>
        </motion.div>
      </div>
    ),
    illustration: "preparation",
  },
];

const scenesPassport: Scene[] = [
  {
    id: "welcome",
    title: "Welcome to Passport Guide",
    description:
      "Follow a step-by-step workflow to prepare your Pakistani passport application with fewer mistakes and better readiness.",
    illustration: "welcome",
  },
  {
    id: "what-is",
    title: "What is a Pakistani Passport?",
    description:
      "A Pakistani passport is an official travel document issued by DGIP for international travel. It also serves as proof of Pakistani citizenship and identity.",
    extraContent: (
      <p className="mt-4 text-xs font-semibold tracking-wide" style={{ color: colors.sageGrey }}>
        Source: DGIP (Directorate General of Immigration & Passports)
      </p>
    ),
    illustration: "document",
  },
  {
    id: "pitfalls",
    title: "Avoid Application Delays",
    titleLines: ["Avoid", "Application", "Delays"],
    description: "Catch common document and process mistakes before submission.",
    illustration: "warning",
  },
  {
    id: "workflow",
    title: "Guided Passport Workflow",
    titleLines: ["Guided", "Passport", "Workflow"],
    description: "A clear step-by-step path from application type to validation.",
    illustration: "checklist",
  },
  {
    id: "output",
    title: "Validation Checklist Ready",
    titleLines: ["Validation", "Checklist", "Guide"],
    description: "Get a cleaner, submission-ready checklist and next actions.",
    illustration: "output",
  },
  {
    id: "wizard",
    title: "How This Works",
    extraContent: (
      <div className="mt-6 mx-auto flex max-w-lg flex-col gap-4 text-left">
        {[
          "Select your passport application type (new, renewal, or lost/damaged).",
          "Review required documents for your profile and case.",
          "Follow a tailored roadmap with process and timing guidance.",
          "Validate readiness before visiting office or submitting online.",
        ].map((text, i) => (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + i * 0.15, ease: [0.22, 1, 0.36, 1] }}
            key={i}
            className="flex items-start gap-4 rounded-2xl border border-[#afdbdb]/30 bg-white p-4 shadow-[0_10px_30px_-10px_rgba(13,115,119,0.08)]"
          >
            <div
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full font-bold text-white shadow-md"
              style={{
                background: `linear-gradient(135deg, ${colors.deepTeal}, ${colors.softAqua})`,
              }}
            >
              {i + 1}
            </div>
            <p
              className="text-base font-semibold leading-snug md:text-[17px]"
              style={{ color: colors.deepTeal }}
            >
              {text}
            </p>
          </motion.div>
        ))}
      </div>
    ),
    illustration: "wizard",
  },
  {
    id: "needs",
    title: "What You'll Need",
    extraContent: (
      <div className="mx-auto mt-6 max-w-lg space-y-6 text-left">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[
            "Original CNIC/NICOP with copy",
            "Fee payment proof (challan/eReceipt)",
            "Previous passport (for renewal)",
            "Additional proofs for special cases",
          ].map((item, i) => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              key={i}
              className="flex items-center gap-3 rounded-xl border border-[#cdadcc]/30 bg-white p-4 shadow-sm"
            >
              <div
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: colors.dustyRose }}
              />
              <span
                className="text-[15px] font-semibold leading-snug"
                style={{ color: colors.deepTeal }}
              >
                {item}
              </span>
            </motion.div>
          ))}
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-2xl border border-dashed bg-white p-5 shadow-sm"
          style={{ borderColor: colors.dustyRose }}
        >
          <h4
            className="mb-2 text-[11px] font-black uppercase tracking-[0.14em]"
            style={{ color: colors.dustyRose }}
          >
            Important Note
          </h4>
          <p className="text-[14px] font-medium leading-6" style={{ color: colors.sageGrey }}>
            This guide provides general information based on publicly available DGIP sources.
            Requirements may vary by case and can change; verify with your RPO/EPO before
            submission.
          </p>
        </motion.div>
      </div>
    ),
    illustration: "preparation",
  },
];

const scenesCnic: Scene[] = [
  {
    id: "welcome",
    title: "Welcome to CNIC Guide",
    description:
      "Follow a guided workflow to prepare your CNIC application or update case with fewer errors.",
    illustration: "welcome",
  },
  {
    id: "what-is",
    title: "What is a CNIC?",
    description:
      "A CNIC is Pakistan's core national identity document issued by NADRA. It is required for most official, financial, and travel-related processes.",
    extraContent: (
      <p className="mt-4 text-xs font-semibold tracking-wide" style={{ color: colors.sageGrey }}>
        Source: NADRA
      </p>
    ),
    illustration: "document",
  },
  {
    id: "pitfalls",
    title: "Avoid Application Mistakes",
    titleLines: ["Avoid", "Application", "Mistakes"],
    description: "Prevent common errors that delay CNIC issuance or correction.",
    illustration: "warning",
  },
  {
    id: "workflow",
    title: "Guided CNIC Workflow",
    titleLines: ["Guided", "CNIC", "Workflow"],
    description: "Step-by-step path tailored to your profile and application type.",
    illustration: "checklist",
  },
  {
    id: "output",
    title: "Readiness Checklist Ready",
    titleLines: ["Readiness", "Checklist", "Guide"],
    description: "Get a cleaner, action-ready checklist before you proceed.",
    illustration: "output",
  },
  {
    id: "wizard",
    title: "How This Works",
    extraContent: (
      <div className="mt-6 mx-auto flex max-w-lg flex-col gap-4 text-left">
        {[
          "Select your CNIC case type and applicant profile.",
          "Review the relevant documents for your situation.",
          "Follow a practical roadmap and mark progress.",
          "Validate everything before office visit or submission.",
        ].map((text, i) => (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + i * 0.15, ease: [0.22, 1, 0.36, 1] }}
            key={i}
            className="flex items-start gap-4 rounded-2xl border border-[#afdbdb]/30 bg-white p-4 shadow-[0_10px_30px_-10px_rgba(13,115,119,0.08)]"
          >
            <div
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full font-bold text-white shadow-md"
              style={{
                background: `linear-gradient(135deg, ${colors.deepTeal}, ${colors.softAqua})`,
              }}
            >
              {i + 1}
            </div>
            <p
              className="text-base font-semibold leading-snug md:text-[17px]"
              style={{ color: colors.deepTeal }}
            >
              {text}
            </p>
          </motion.div>
        ))}
      </div>
    ),
    illustration: "wizard",
  },
  {
    id: "needs",
    title: "What You'll Need",
    extraContent: (
      <div className="mx-auto mt-6 max-w-lg space-y-6 text-left">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[
            "Valid or existing CNIC details",
            "Supporting records for your case type",
            "Recent photograph as required",
            "Fee/payment information",
          ].map((item, i) => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              key={i}
              className="flex items-center gap-3 rounded-xl border border-[#cdadcc]/30 bg-white p-4 shadow-sm"
            >
              <div
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: colors.dustyRose }}
              />
              <span
                className="text-[15px] font-semibold leading-snug"
                style={{ color: colors.deepTeal }}
              >
                {item}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    ),
    illustration: "preparation",
  },
];

const scenesFrc: Scene[] = [
  {
    id: "welcome",
    title: "Welcome to FRC Guide",
    description:
      "Use this wizard to prepare your Family Registration Certificate process with better clarity.",
    illustration: "welcome",
  },
  {
    id: "what-is",
    title: "What is FRC?",
    description:
      "FRC (Family Registration Certificate) is a NADRA-issued record of your registered family structure, often required for immigration and official verification.",
    extraContent: (
      <p className="mt-4 text-xs font-semibold tracking-wide" style={{ color: colors.sageGrey }}>
        Source: NADRA
      </p>
    ),
    illustration: "document",
  },
  {
    id: "pitfalls",
    title: "Avoid Document Gaps",
    titleLines: ["Avoid", "Document", "Gaps"],
    description: "Catch relationship and record mismatches before submission.",
    illustration: "warning",
  },
  {
    id: "workflow",
    title: "Guided FRC Workflow",
    titleLines: ["Guided", "FRC", "Workflow"],
    description: "Move through profile selection, checklist, and final validation.",
    illustration: "checklist",
  },
  {
    id: "output",
    title: "Submission Ready",
    titleLines: ["Submission", "Ready"],
    description: "Finish with a clearer checklist and next-step plan.",
    illustration: "output",
  },
  {
    id: "wizard",
    title: "How This Works",
    extraContent: (
      <div className="mt-6 mx-auto flex max-w-lg flex-col gap-4 text-left">
        {[
          "Choose your FRC category and use case.",
          "Follow the roadmap and required records list.",
          "Track each requirement step-by-step.",
          "Run final validation before applying.",
        ].map((text, i) => (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + i * 0.15, ease: [0.22, 1, 0.36, 1] }}
            key={i}
            className="flex items-start gap-4 rounded-2xl border border-[#afdbdb]/30 bg-white p-4 shadow-[0_10px_30px_-10px_rgba(13,115,119,0.08)]"
          >
            <div
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full font-bold text-white shadow-md"
              style={{
                background: `linear-gradient(135deg, ${colors.deepTeal}, ${colors.softAqua})`,
              }}
            >
              {i + 1}
            </div>
            <p
              className="text-base font-semibold leading-snug md:text-[17px]"
              style={{ color: colors.deepTeal }}
            >
              {text}
            </p>
          </motion.div>
        ))}
      </div>
    ),
    illustration: "wizard",
  },
  {
    id: "needs",
    title: "What You'll Need",
    extraContent: (
      <div className="mx-auto mt-6 max-w-lg space-y-6 text-left">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[
            "Applicant CNIC/NICOP details",
            "Accurate family relationship records",
            "Category-specific supporting proofs",
            "Fee details\nApplication info\nPayment proof",
          ].map((item, i) => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              key={i}
              className="flex items-center gap-3 rounded-xl border border-[#cdadcc]/30 bg-white p-4 shadow-sm"
            >
              <div
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: colors.dustyRose }}
              />
              <span
                className="text-[15px] font-semibold leading-snug whitespace-pre-wrap"
                style={{ color: colors.deepTeal }}
              >
                {item}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    ),
    illustration: "preparation",
  },
];

const scenesPoliceVerification: Scene[] = [
  {
    id: "welcome",
    title: "Welcome to Police Character Certificate Guide",
    description:
      "Prepare your police verification workflow with province-aware steps and fewer delays.",
    illustration: "welcome",
  },
  {
    id: "what-is",
    title: "What is a Police Character Certificate?",
    description:
      "This certificate confirms your police record status and is commonly required for immigration, employment, and travel processing.",
    illustration: "document",
  },
  {
    id: "pitfalls",
    title: "Avoid Province-Specific Mistakes",
    titleLines: ["Avoid", "Province-Specific", "Mistakes"],
    description: "Prevent errors in requirements, letters, and district-level processing.",
    illustration: "warning",
  },
  {
    id: "workflow",
    title: "Guided Verification Workflow",
    titleLines: ["Guided", "Verification", "Workflow"],
    description: "Select your province and follow the relevant checklist path.",
    illustration: "checklist",
  },
  {
    id: "output",
    title: "Verification Checklist Ready",
    titleLines: ["Verification", "Checklist", "Guide"],
    description: "Finish with a clear list of actions and required items.",
    illustration: "output",
  },
  {
    id: "wizard",
    title: "How This Works",
    extraContent: (
      <div className="mt-6 mx-auto flex max-w-lg flex-col gap-4 text-left">
        {[
          "Choose your province to load the right process.",
          "Review your province-specific documents and actions.",
          "Track completion through roadmap and validation.",
          "Use generated resources before final submission.",
        ].map((text, i) => (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + i * 0.15, ease: [0.22, 1, 0.36, 1] }}
            key={i}
            className="flex items-start gap-4 rounded-2xl border border-[#afdbdb]/30 bg-white p-4 shadow-[0_10px_30px_-10px_rgba(13,115,119,0.08)]"
          >
            <div
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full font-bold text-white shadow-md"
              style={{
                background: `linear-gradient(135deg, ${colors.deepTeal}, ${colors.softAqua})`,
              }}
            >
              {i + 1}
            </div>
            <p
              className="text-base font-semibold leading-snug md:text-[17px]"
              style={{ color: colors.deepTeal }}
            >
              {text}
            </p>
          </motion.div>
        ))}
      </div>
    ),
    illustration: "wizard",
  },
  {
    id: "needs",
    title: "What You'll Need",
    extraContent: (
      <div className="mx-auto mt-6 max-w-lg space-y-6 text-left">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[
            "Valid CNIC details",
            "Proof of current/previous residence",
            "Passport details (if needed)",
            "Province-required form details",
          ].map((item, i) => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              key={i}
              className="flex items-center gap-3 rounded-xl border border-[#cdadcc]/30 bg-white p-4 shadow-sm"
            >
              <div
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: colors.dustyRose }}
              />
              <span
                className="text-[15px] font-semibold leading-snug"
                style={{ color: colors.deepTeal }}
              >
                {item}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    ),
    illustration: "preparation",
  },
];

const scenesMarriageRegistration: Scene[] = [
  {
    id: "welcome",
    title: "Welcome to Marriage Registration Guide",
    description:
      "Plan your Nikah Nama and marriage registration flow with a cleaner, guided checklist.",
    illustration: "welcome",
  },
  {
    id: "what-is",
    title: "What is Marriage Registration?",
    description:
      "Marriage registration creates an official legal record of marriage and supports later legal and immigration documentation.",
    illustration: "document",
  },
  {
    id: "pitfalls",
    title: "Avoid Record Mismatches",
    titleLines: ["Avoid", "Record", "Mismatches"],
    description: "Prevent name, date, and witness-detail errors that cause delays.",
    illustration: "warning",
  },
  {
    id: "workflow",
    title: "Guided Registration Workflow",
    titleLines: ["Guided", "Registration", "Workflow"],
    description: "Follow a structured path from case type to final verification.",
    illustration: "checklist",
  },
  {
    id: "output",
    title: "Submission Checklist Ready",
    titleLines: ["Submission", "Checklist", "Guide"],
    description: "Get a practical checklist and action flow before office processing.",
    illustration: "output",
  },
  {
    id: "wizard",
    title: "How This Works",
    extraContent: (
      <div className="mt-6 mx-auto flex max-w-lg flex-col gap-4 text-left">
        {[
          "Select your marriage registration scenario.",
          "Check required documents and party details.",
          "Follow the roadmap in sequence.",
          "Run final validation before submission.",
        ].map((text, i) => (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + i * 0.15, ease: [0.22, 1, 0.36, 1] }}
            key={i}
            className="flex items-start gap-4 rounded-2xl border border-[#afdbdb]/30 bg-white p-4 shadow-[0_10px_30px_-10px_rgba(13,115,119,0.08)]"
          >
            <div
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full font-bold text-white shadow-md"
              style={{
                background: `linear-gradient(135deg, ${colors.deepTeal}, ${colors.softAqua})`,
              }}
            >
              {i + 1}
            </div>
            <p
              className="text-base font-semibold leading-snug md:text-[17px]"
              style={{ color: colors.deepTeal }}
            >
              {text}
            </p>
          </motion.div>
        ))}
      </div>
    ),
    illustration: "wizard",
  },
  {
    id: "needs",
    title: "What You'll Need",
    extraContent: (
      <div className="mx-auto mt-6 max-w-lg space-y-6 text-left">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[
            "Bride and groom identity details",
            "Nikah Nama / registration entries",
            "Witness and union council details",
            "Case-specific supporting proofs",
          ].map((item, i) => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              key={i}
              className="flex items-center gap-3 rounded-xl border border-[#cdadcc]/30 bg-white p-4 shadow-sm"
            >
              <div
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: colors.dustyRose }}
              />
              <span
                className="text-[15px] font-semibold leading-snug"
                style={{ color: colors.deepTeal }}
              >
                {item}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    ),
    illustration: "preparation",
  },
];

const scenesBirthCertificate: Scene[] = [
  {
    id: "welcome",
    title: "Welcome to Birth Certificate Guide",
    description: "Use this wizard to prepare a complete birth certificate application workflow.",
    illustration: "welcome",
  },
  {
    id: "what-is",
    title: "What is a Birth Certificate?",
    description:
      "A birth certificate is the official civil record of birth and is required for identity, schooling, passports, and legal processing.",
    illustration: "document",
  },
  {
    id: "pitfalls",
    title: "Avoid Processing Delays",
    titleLines: ["Avoid", "Processing", "Delays"],
    description: "Catch missing entries and supporting-document issues early.",
    illustration: "warning",
  },
  {
    id: "workflow",
    title: "Guided Birth Record Workflow",
    titleLines: ["Guided", "Birth Record", "Workflow"],
    description: "Move from applicant details to roadmap and final verification.",
    illustration: "checklist",
  },
  {
    id: "output",
    title: "Application Readiness",
    titleLines: ["Application", "Readiness", "Guide"],
    description: "Get a complete checklist for smoother submission.",
    illustration: "output",
  },
  {
    id: "wizard",
    title: "How This Works",
    extraContent: (
      <div className="mt-6 mx-auto flex max-w-lg flex-col gap-4 text-left">
        {[
          "Select your birth certificate case profile.",
          "Review required records and supporting proofs.",
          "Complete each roadmap item in order.",
          "Validate before final office submission.",
        ].map((text, i) => (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + i * 0.15, ease: [0.22, 1, 0.36, 1] }}
            key={i}
            className="flex items-start gap-4 rounded-2xl border border-[#afdbdb]/30 bg-white p-4 shadow-[0_10px_30px_-10px_rgba(13,115,119,0.08)]"
          >
            <div
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full font-bold text-white shadow-md"
              style={{
                background: `linear-gradient(135deg, ${colors.deepTeal}, ${colors.softAqua})`,
              }}
            >
              {i + 1}
            </div>
            <p
              className="text-base font-semibold leading-snug md:text-[17px]"
              style={{ color: colors.deepTeal }}
            >
              {text}
            </p>
          </motion.div>
        ))}
      </div>
    ),
    illustration: "wizard",
  },
  {
    id: "needs",
    title: "What You'll Need",
    extraContent: (
      <div className="mx-auto mt-6 max-w-lg space-y-6 text-left">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[
            "Child and parent identity details",
            "Hospital/home birth supporting record",
            "Union council or local authority inputs",
            "Fee/payment confirmation",
          ].map((item, i) => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              key={i}
              className="flex items-center gap-3 rounded-xl border border-[#cdadcc]/30 bg-white p-4 shadow-sm"
            >
              <div
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: colors.dustyRose }}
              />
              <span
                className="text-[15px] font-semibold leading-snug"
                style={{ color: colors.deepTeal }}
              >
                {item}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    ),
    illustration: "preparation",
  },
];

const scenesPolioVaccination: Scene[] = [
  {
    id: "welcome",
    title: "Welcome to Polio Vaccination Guide",
    description: "Prepare your vaccination and certificate process with a clear, guided checklist.",
    illustration: "welcome",
  },
  {
    id: "what-is",
    title: "What is a Polio Certificate?",
    description:
      "A polio vaccination certificate is proof of vaccination often required for international travel and immigration processing.",
    illustration: "document",
  },
  {
    id: "pitfalls",
    title: "Avoid Certificate Issues",
    titleLines: ["Avoid", "Certificate", "Issues"],
    description: "Prevent common mistakes in vaccination timing and documentation.",
    illustration: "warning",
  },
  {
    id: "workflow",
    title: "Guided Vaccination Workflow",
    titleLines: ["Guided", "Vaccination", "Workflow"],
    description: "Move from profile selection to checklist and final validation.",
    illustration: "checklist",
  },
  {
    id: "output",
    title: "Travel-Ready Checklist",
    titleLines: ["Travel-Ready", "Checklist", "Guide"],
    description: "Finish with clear next steps before certificate use.",
    illustration: "output",
  },
  {
    id: "wizard",
    title: "How This Works",
    extraContent: (
      <div className="mt-6 mx-auto flex max-w-lg flex-col gap-4 text-left">
        {[
          "Choose your applicant profile and scenario.",
          "Review vaccination and documentation requirements.",
          "Follow the roadmap and track completion.",
          "Validate readiness before travel use.",
        ].map((text, i) => (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + i * 0.15, ease: [0.22, 1, 0.36, 1] }}
            key={i}
            className="flex items-start gap-4 rounded-2xl border border-[#afdbdb]/30 bg-white p-4 shadow-[0_10px_30px_-10px_rgba(13,115,119,0.08)]"
          >
            <div
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full font-bold text-white shadow-md"
              style={{
                background: `linear-gradient(135deg, ${colors.deepTeal}, ${colors.softAqua})`,
              }}
            >
              {i + 1}
            </div>
            <p
              className="text-base font-semibold leading-snug md:text-[17px]"
              style={{ color: colors.deepTeal }}
            >
              {text}
            </p>
          </motion.div>
        ))}
      </div>
    ),
    illustration: "wizard",
  },
  {
    id: "needs",
    title: "What You'll Need",
    extraContent: (
      <div className="mx-auto mt-6 max-w-lg space-y-6 text-left">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[
            "Passport and CNIC details",
            "Vaccination center information",
            "NIMS/certificate tracking details",
            "Travel timeline and destination requirements",
          ].map((item, i) => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              key={i}
              className="flex items-center gap-3 rounded-xl border border-[#cdadcc]/30 bg-white p-4 shadow-sm"
            >
              <div
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: colors.dustyRose }}
              />
              <span
                className="text-[15px] font-semibold leading-snug"
                style={{ color: colors.deepTeal }}
              >
                {item}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    ),
    illustration: "preparation",
  },
];

const scenesInterviewPrep: Scene[] = [
  {
    id: "what-is",
    title: "What Is Interview Prep?",
    titleLines: ["What Is", "Interview Prep?"],
    description:
      "An AI-powered visa interview simulator designed to help applicants practice, improve answers, and build confidence before their embassy interview.",
    illustration: "document",

    extraContent: (
      <div className="mx-auto mt-6 max-w-lg space-y-4 text-left">
        {[
          "Realistic embassy-style interview questions",
          "Personalized feedback after every session",
          "Practice tailored to your visa category",
          "Confidence-building interview simulations",
        ].map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.3 + i * 0.1,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="flex items-center gap-3 rounded-xl border border-[#cdadcc]/30 bg-white p-4 shadow-sm"
          >
            <div
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: colors.deepTeal }}
            />

            <span
              className="text-[15px] font-semibold leading-snug"
              style={{ color: colors.deepTeal }}
            >
              {item}
            </span>
          </motion.div>
        ))}
      </div>
    ),
  },

  {
    id: "pitfalls",
    title: "Avoid Common Mistakes",
    titleLines: ["Avoid Common", "Mistakes"],
    description:
      "Many applicants know their case well but struggle to communicate it effectively during the interview.",
    illustration: "warning",

    extraContent: (
      <div className="mx-auto mt-6 max-w-lg space-y-4 text-left">
        {[
          "Giving incomplete or vague answers",
          "Appearing nervous or unprepared",
          "Missing key supporting details",
          "Providing overly long or confusing responses",
        ].map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              delay: 0.3 + i * 0.12,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="flex items-center gap-3 rounded-xl border border-[#db8090]/20 bg-white p-4 shadow-sm"
          >
            <div
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: colors.dustyRose }}
            />

            <span
              className="text-[15px] font-semibold leading-snug"
              style={{ color: colors.deepTeal }}
            >
              {item}
            </span>
          </motion.div>
        ))}
      </div>
    ),
  },

  {
    id: "workflow",
    title: "Practice Modes & Plans",
    titleLines: ["Practice Modes", "& Plans"],
    description: "Choose the interview preparation experience that best fits your needs.",
    illustration: "checklist",

    extraContent: (
      <div className="mt-6 mx-auto flex max-w-lg flex-col gap-4 text-left">
        <ModeCarousel />
      </div>
    ),
  },

  {
    id: "wizard",
    title: "How This Works",
    titleLines: ["Ready To", "Practice?"],
    description:
      "Start preparing today and walk into your embassy interview with greater confidence, clearer answers, and fewer surprises.",
    illustration: "wizard",

    extraContent: (
      <div className="mt-6 mx-auto flex max-w-lg flex-col gap-4 text-left">
        {[
          "Answer realistic embassy interview questions.",
          "Review feedback and scores.",
          "Improve weak areas and practice again.",
        ].map((text, i) => (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              delay: 0.3 + i * 0.15,
              ease: [0.22, 1, 0.36, 1],
            }}
            key={i}
            className="flex items-start gap-4 rounded-2xl border border-[#afdbdb]/30 bg-white p-4 shadow-[0_10px_30px_-10px_rgba(13,115,119,0.08)]"
          >
            <div
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full font-bold text-white shadow-md"
              style={{
                background: `linear-gradient(135deg, ${colors.deepTeal}, ${colors.softAqua})`,
              }}
            >
              {i + 1}
            </div>

            <p
              className="text-base font-semibold leading-snug md:text-[17px]"
              style={{ color: colors.deepTeal }}
            >
              {text}
            </p>
          </motion.div>
        ))}
      </div>
    ),
  },
];

interface NarrativeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  dontShowAgain: boolean;
  onDontShowAgainChange: (checked: boolean) => void;
  variant?:
    | "221g"
    | "passport"
    | "cnic"
    | "frc"
    | "police-verification"
    | "marriage-registration"
    | "birth-certificate"
    | "polio-vaccination"
    | "interview-prep";
}

const SCENE_DURATION = 9000;

export function NarrativeModal({
  isOpen,
  onClose,
  onComplete,
  dontShowAgain,
  onDontShowAgainChange,
  variant = "221g",
}: NarrativeModalProps) {
  const scenesByVariant = {
    "221g": scenes221g,
    passport: scenesPassport,
    cnic: scenesCnic,
    frc: scenesFrc,
    "police-verification": scenesPoliceVerification,
    "marriage-registration": scenesMarriageRegistration,
    "birth-certificate": scenesBirthCertificate,
    "polio-vaccination": scenesPolioVaccination,
    "interview-prep": scenesInterviewPrep,
  } as const;

  const scenes = scenesByVariant[variant];
  const modalScrollRef = useRef<HTMLDivElement | null>(null);
  const sceneScrollRef = useRef<HTMLDivElement | null>(null);
  const [currentScene, setCurrentScene] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isCompactView, setIsCompactView] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const scene = scenes[currentScene];
  const isWizardScene = scene.id === "wizard";
  const isCompactFirstScene = isCompactView && currentScene === 0;
  const isFirstFourScene = ["welcome", "what-is", "pitfalls", "workflow"].includes(scene.id);
  const isPagesTwoToFiveScene = ["what-is", "pitfalls", "workflow", "output"].includes(scene.id);
  const isPagesThreeToSixScene = ["pitfalls", "workflow", "output", "wizard"].includes(scene.id);
  const isPagesFourToFiveScene = ["workflow", "output"].includes(scene.id);
  const isCompactPagesTwoToFive = isCompactView && isPagesTwoToFiveScene;
  const isCompactPagesThreeToSix = isCompactView && isPagesThreeToSixScene;
  const isCompactPagesFourToFive = isCompactView && isPagesFourToFiveScene;
  const docBadgeTextByVariant: Record<NonNullable<NarrativeModalProps["variant"]>, string> = {
    "221g": "221(g)",
    passport: "Passport",
    cnic: "CNIC",
    frc: "FRC",
    "police-verification": "PCC",
    "marriage-registration": "Marriage",
    "birth-certificate": "Birth",
    "polio-vaccination": "Polio",
    "interview-prep": "Interview",
  };
  const docBadgeText = docBadgeTextByVariant[variant];
  const isGuideVariant = variant !== "221g";
  const reduceHeavyEffects = isMobileView || prefersReducedMotion;
  const useSimpleIllustrations = prefersReducedMotion;
  const compactModalMotion = reduceHeavyEffects
    ? {
        initialY: 14,
        exitY: 10,
        sceneInitialX: 8,
        sceneExitX: -8,
        sceneInitialY: 3,
        sceneExitY: -3,
        duration: 0.36,
        sceneDuration: 0.16,
      }
    : {
        initialY: 40,
        exitY: 30,
        sceneInitialX: 30,
        sceneExitX: -30,
        sceneInitialY: 8,
        sceneExitY: -8,
        duration: 0.8,
        sceneDuration: 0.7,
      };

  const particles = useMemo(
    () =>
      Array.from({ length: 25 }, (_, i) => {
        const palette = [colors.softAqua, colors.mutedLavender, colors.dustyRose, colors.deepTeal];
        return {
          id: i,
          color: palette[i % palette.length],
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          dx: Math.random() * 60 - 30,
          dy: Math.random() * 60 - 30,
          duration: Math.random() * 10 + 12,
          delay: Math.random() * 2,
          scale: Math.random() * 0.8 + 0.2,
        };
      }),
    []
  );

  const handleNext = () => {
    if (currentScene < scenes.length - 1) {
      setCurrentScene((prev) => prev + 1);
      setIsPlaying(true);
    } else {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (currentScene > 0) {
      setCurrentScene((prev) => prev - 1);
      setIsPlaying(true);
    }
  };

  const handleCompactWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    if (!isCompactView) return;

    // Reduce wheel jump distance in compact view for gentler scrolling.
    event.preventDefault();
    event.currentTarget.scrollBy({
      top: event.deltaY * 0.32,
      left: 0,
      behavior: "auto",
    });
  };

  useEffect(() => {
    if (isOpen) {
      setCurrentScene(0);
      setIsPlaying(true);
    }
  }, [isOpen]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const compactMq = window.matchMedia("(max-width: 650px)");
    const mobileMq = window.matchMedia("(max-width: 768px)");
    const reducedMq = window.matchMedia("(prefers-reduced-motion: reduce)");

    const syncState = () => {
      setIsCompactView(compactMq.matches);
      setIsMobileView(mobileMq.matches);
      setPrefersReducedMotion(reducedMq.matches);
    };

    syncState();
    compactMq.addEventListener("change", syncState);
    mobileMq.addEventListener("change", syncState);
    reducedMq.addEventListener("change", syncState);

    return () => {
      compactMq.removeEventListener("change", syncState);
      mobileMq.removeEventListener("change", syncState);
      reducedMq.removeEventListener("change", syncState);
    };
  }, []);

  useEffect(() => {
    if (!isOpen || !isPlaying) return;

    const timer = setTimeout(() => {
      if (currentScene < scenes.length - 1) {
        setCurrentScene((prev) => prev + 1);
      } else {
        setIsPlaying(false);
      }
    }, SCENE_DURATION);

    return () => clearTimeout(timer);
  }, [isOpen, isPlaying, currentScene]);

  useLayoutEffect(() => {
    if (!isOpen) return;

    // Keep the first scene visible on compact/mobile by resetting both scroll containers.
    modalScrollRef.current?.scrollTo({ top: 0, left: 0, behavior: "auto" });
    sceneScrollRef.current?.scrollTo({ top: 0, left: 0, behavior: "auto" });
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }
  }, [isOpen, currentScene]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={modalScrollRef}
          initial={
            reduceHeavyEffects ? { opacity: 0 } : { opacity: 0, backdropFilter: "blur(0px)" }
          }
          animate={
            reduceHeavyEffects ? { opacity: 1 } : { opacity: 1, backdropFilter: "blur(12px)" }
          }
          exit={reduceHeavyEffects ? { opacity: 0 } : { opacity: 0, backdropFilter: "blur(0px)" }}
          transition={{ duration: compactModalMotion.duration, ease: [0.16, 1, 0.3, 1] }}
          className={[
            "fixed inset-0 z-[150] flex items-start justify-center overflow-y-auto welcome-thick-scrollbar p-2.5 pt-3 sm:items-start sm:p-4 md:items-center md:p-8",
            isCompactView ? "p-1.5 pt-2" : "",
          ].join(" ")}
          style={{
            background:
              "radial-gradient(circle at 50% 25%, rgba(255,255,255,0.92) 0%, rgba(248,251,252,0.9) 42%, rgba(13,115,119,0.16) 100%)",
            scrollbarWidth: "none",
          }}
        >
          {!reduceHeavyEffects && (
            <div className="pointer-events-none absolute inset-0 hidden overflow-hidden sm:block">
              {particles.map((particle) => (
                <motion.div
                  key={particle.id}
                  className="absolute h-1.5 w-1.5 rounded-full blur-[1px]"
                  style={{
                    backgroundColor: particle.color,
                    left: particle.left,
                    top: particle.top,
                    scale: particle.scale,
                  }}
                  animate={{
                    x: [0, particle.dx, 0],
                    y: [0, particle.dy, 0],
                    opacity: [0, 0.08, 0],
                  }}
                  transition={{
                    duration: particle.duration,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: particle.delay,
                  }}
                />
              ))}
            </div>
          )}

          <motion.div
            initial={{
              scale: reduceHeavyEffects ? 0.992 : 0.98,
              opacity: 0,
              y: compactModalMotion.initialY,
            }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{
              scale: reduceHeavyEffects ? 0.992 : 0.98,
              opacity: 0,
              y: compactModalMotion.exitY,
            }}
            transition={{ duration: compactModalMotion.duration, ease: [0.16, 1, 0.3, 1] }}
            className={[
              "relative flex w-full max-w-5xl max-h-[calc(100svh-0.75rem)] min-h-0 flex-col overflow-hidden border border-[#cfe3e3] bg-[linear-gradient(180deg,#ffffff_0%,#fcffff_100%)] shadow-[0_32px_80px_-34px_rgba(13,115,119,0.35)] ring-1 ring-white/90 antialiased sm:max-h-[calc(100svh-1.5rem)] sm:rounded-[2.5rem] sm:ring-2 md:max-h-[calc(100svh-4rem)]",
              isCompactView
                ? "!w-[98vw] !h-[98vh] !max-w-full !max-h-[98vh] rounded-[1.2rem] overflow-y-auto welcome-thick-scrollbar"
                : "rounded-[1.65rem]",
            ].join(" ")}
            style={
              isCompactView
                ? {
                    scrollbarWidth: "none",
                    width: "98vw",
                    height: "98vh",
                    maxWidth: "100vw",
                    maxHeight: "98vh",
                  }
                : undefined
            }
          >
            <div className="absolute left-0 right-0 top-0 z-20 h-1 bg-[#f0f7f7]">
              <motion.div
                className="h-full origin-left"
                style={{ backgroundColor: colors.deepTeal }}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: isPlaying ? 1 : 0 }}
                key={currentScene + (isPlaying ? "-playing" : "-paused")}
                transition={{
                  duration: isPlaying ? SCENE_DURATION / 1000 : 0,
                  ease: "linear",
                }}
              />
            </div>

            <div className="pointer-events-none absolute inset-0 rounded-[1.65rem] ring-1 ring-inset ring-white/75 sm:rounded-[2.5rem]" />

            <div className="absolute right-2.5 top-2.5 z-20 flex items-center gap-2 sm:right-6 sm:top-6 sm:gap-3">
              <button
                onClick={onClose}
                className="transition-opacity duration-300 hover:opacity-70"
                style={{ color: colors.deepTeal }}
                type="button"
              >
                <X className="h-4.5 w-4.5 sm:h-6 sm:w-6" />
              </button>
            </div>

            <label className="absolute left-6 top-6 z-20 hidden items-center gap-2 rounded-full border border-[#dbe8e8] bg-white/95 px-3.5 py-1.5 text-[11px] font-semibold tracking-[0.01em] text-slate-600 shadow-sm sm:flex">
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={(e) => onDontShowAgainChange(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-slate-300 text-[#0d7377]"
              />
              Don&apos;t show again
            </label>

            <div
              ref={sceneScrollRef}
              onWheel={handleCompactWheel}
              className={[
                "relative flex flex-col min-h-0 flex-1 overflow-x-hidden overscroll-contain bg-gradient-to-b from-white via-[#fbfefe] to-[#f3faf9] w-full h-full",
                isCompactView
                  ? "overflow-y-auto px-3 pt-4 pb-4"
                  : "items-start justify-center overflow-y-auto px-3 pb-4 pt-16 sm:px-8 sm:pb-8 sm:pt-20 md:items-center md:p-12",
              ].join(" ")}
              style={{ scrollbarWidth: "none" }}
            >
              <div
                className="pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-white/95 to-transparent"
                style={{ height: isWizardScene ? "2rem" : "6rem" }}
              />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white/95 to-transparent" />

              <AnimatePresence mode="wait">
                <motion.div
                  key={scene.id}
                  initial={
                    isCompactView
                      ? { opacity: 1, filter: "blur(0px)" }
                      : reduceHeavyEffects
                        ? { opacity: 0, y: compactModalMotion.sceneInitialY }
                        : {
                            opacity: 0,
                            filter: "blur(12px)",
                            x: compactModalMotion.sceneInitialX,
                            scale: 0.98,
                          }
                  }
                  animate={
                    reduceHeavyEffects
                      ? { opacity: 1, y: 0 }
                      : { opacity: 1, filter: "blur(0px)", x: 0, scale: 1 }
                  }
                  exit={
                    reduceHeavyEffects
                      ? { opacity: 0, y: compactModalMotion.sceneExitY }
                      : {
                          opacity: 0,
                          filter: "blur(12px)",
                          x: compactModalMotion.sceneExitX,
                          scale: 0.98,
                        }
                  }
                  transition={{
                    duration: compactModalMotion.sceneDuration,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className={[
                    "flex w-full flex-col gap-3 pb-1 md:flex-row md:justify-center md:gap-12 md:items-center",
                    isCompactView ? "gap-8 px-3" : "",
                    isCompactView && isCompactFirstScene
                      ? "justify-center items-center text-center mt-4"
                      : "items-center",
                  ].join(" ")}
                >
                  <div
                    className={[
                      "w-full flex-none sm:max-w-md sm:flex-1 overflow-visible max-w-[200px]",
                      isCompactView ? "flex justify-center mb-2" : "",
                      isCompactView && isCompactFirstScene
                        ? "justify-center items-center text-center mb-2"
                        : "",
                    ].join(" ")}
                  >
                    <SceneIllustration
                      scene={scene}
                      reduceMotion={useSimpleIllustrations}
                      compactMode={isCompactView}
                      documentBadgeText={docBadgeText}
                      outputMode={isGuideVariant ? "guide" : "221g"}
                      {...(isCompactView && isPagesFourToFiveScene ? { size: 70 } : {})}
                    />
                  </div>

                  <div
                    className={[
                      "relative z-20 w-full max-w-lg flex-1",
                      isCompactView ? "text-center mt-6 px-2" : "text-center md:text-left",
                      isCompactView && isCompactFirstScene ? "text-center mt-2" : "",
                    ].join(" ")}
                  >
                    <motion.h2
                      className={[
                        "font-black leading-[1.05] tracking-[-0.02em] text-balance break-words w-full sm:text-[2rem] md:text-[3.1rem]",
                        isCompactFirstScene ? "mb-4 text-[1.12rem] leading-[1.12]" : "",
                        isCompactView ? "mb-5" : "",
                        isCompactPagesThreeToSix ? "mb-2.5 text-[1.12rem] leading-[1.14]" : "",
                        isFirstFourScene ? "mb-2 text-[1.48rem]" : "mb-2 text-[1.38rem]",
                      ].join(" ")}
                      style={{ color: colors.deepTeal }}
                    >
                      {scene.titleLines ? (
                        <span className="block text-center whitespace-normal md:text-left">
                          {scene.titleLines.map((line) => (
                            <span key={line} className="block">
                              {line}
                            </span>
                          ))}
                        </span>
                      ) : (
                        scene.title
                      )}
                    </motion.h2>

                    {scene.description && (
                      <motion.p
                        className={[
                          "mx-auto max-w-[60ch] text-[14px] font-medium leading-6 tracking-[0.002em] sm:text-[16px] sm:leading-7 md:mx-0 md:text-[1.12rem] md:leading-[1.65]",
                          isCompactPagesThreeToSix ? "text-[13px] leading-[1.5]" : "",
                        ].join(" ")}
                        style={{ color: colors.sageGrey }}
                      >
                        {scene.description}
                      </motion.p>
                    )}

                    {scene.extraContent && (
                      <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
                      >
                        {scene.extraContent}
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="relative z-20 border-t border-[#d5e7e7] bg-white/97 px-2.5 py-2.5 shadow-[0_-8px_24px_-18px_rgba(13,115,119,0.32)] sm:px-6 sm:py-4">
              <img
                src="/assets/images/mascot.png"
                alt="Rahvana bird mascot"
                className={[
                  "pointer-events-none absolute bottom-full -left-1 h-11 w-auto translate-y-1.5 sm:h-36 sm:translate-y-5 md:h-40",
                  isCompactView ? "hidden" : "",
                ].join(" ")}
                draggable={false}
              />
              <div className="grid grid-cols-1 items-center gap-2 sm:grid-cols-[auto_1fr_auto] sm:gap-4">
                <div className="order-1 flex items-center justify-start">
                  <button
                    onClick={handlePrev}
                    disabled={currentScene === 0}
                    className="flex items-center gap-1 rounded-xl px-2 py-1 text-[12px] font-semibold tracking-[0.01em] leading-none transition-all duration-300 hover:bg-[#f3f9f9] disabled:cursor-not-allowed disabled:opacity-30 sm:px-3 sm:py-2 sm:text-[16px]"
                    style={{ color: colors.deepTeal }}
                    type="button"
                  >
                    <ChevronLeft className="h-3.5 w-3.5 sm:h-5 sm:w-5" />
                    Back
                  </button>
                </div>

                <div className="order-3 flex justify-center gap-1.5 sm:order-2 sm:gap-2.5">
                  {scenes.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setCurrentScene(index);
                        setIsPlaying(true);
                      }}
                      className="relative h-1.5 overflow-hidden rounded-full transition-all duration-500"
                      style={{
                        width: index === currentScene ? "1.2rem" : "0.38rem",
                        backgroundColor: "#edf4f4",
                      }}
                      type="button"
                    >
                      {index === currentScene && (
                        <motion.div
                          className="absolute inset-0 rounded-full"
                          style={{ backgroundColor: colors.deepTeal }}
                          layoutId="activeDot"
                        />
                      )}
                    </button>
                  ))}
                </div>

                <div className="order-2 flex items-center justify-end gap-2 sm:order-3 sm:gap-3">
                  <button
                    onClick={handleNext}
                    className="group flex h-9 min-w-[104px] items-center justify-center gap-1.5 rounded-2xl px-3 text-[14px] font-black leading-none tracking-[0.01em] text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl active:scale-95 sm:h-11 sm:min-w-[158px] sm:gap-2 sm:px-6 sm:text-[18px]"
                    style={{
                      background: `linear-gradient(135deg, ${colors.deepTeal}, #129c9e)`,
                      boxShadow: "0 12px 28px -10px rgba(13, 115, 119, 0.42)",
                    }}
                    type="button"
                  >
                    {currentScene === scenes.length - 1 ? "Start Planning" : "Next"}
                    {currentScene < scenes.length - 1 && (
                      <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 sm:h-5 sm:w-5" />
                    )}
                  </button>
                </div>
              </div>

              <label className="mt-0.5 flex items-center justify-end gap-1 text-[10px] font-semibold tracking-[0.01em] text-slate-600 sm:hidden">
                <input
                  type="checkbox"
                  checked={dontShowAgain}
                  onChange={(e) => onDontShowAgainChange(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-[#0d7377]"
                />
                Don&apos;t show again
              </label>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function SceneIllustration({
  scene,
  reduceMotion = false,
  compactMode = false,
  documentBadgeText,
  outputMode,
}: {
  scene: Scene;
  reduceMotion?: boolean;
  compactMode?: boolean;
  documentBadgeText: string;
  outputMode: "221g" | "guide";
}) {
  const isNeedsScene = scene.illustration === "preparation";

  if (reduceMotion) {
    return (
      <SimpleSceneIllustration
        scene={scene}
        isNeedsScene={isNeedsScene}
        compactMode={compactMode}
      />
    );
  }

  return (
    <div
      className={[
        "relative mx-auto flex aspect-square w-full items-center justify-center overflow-visible",
        isNeedsScene ? "max-w-[280px] md:max-w-[310px]" : "max-w-md",
      ].join(" ")}
    >
      <div className={compactMode ? "h-full w-full scale-[0.82]" : "h-full w-full"}>
        {!compactMode && (
          <motion.div
            animate={{ scale: [1, 1.05, 1], opacity: [0.4, 0.6, 0.4] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 rounded-full blur-[70px]"
            style={{
              background: `radial-gradient(circle, ${colors.softAqua}40 0%, ${colors.mutedLavender}20 50%, transparent 100%)`,
            }}
          />
        )}

        {scene.illustration === "welcome" ? <WelcomeScene compactMode={compactMode} /> : null}
        {scene.illustration === "document" && <DocumentScene badgeText={documentBadgeText} />}
        {scene.illustration === "warning" && <WarningScene />}
        {scene.illustration === "checklist" && <ChecklistScene />}
        {scene.illustration === "output" && <OutputScene mode={outputMode} />}
        {scene.illustration === "wizard" && <WizardScene />}
        {scene.illustration === "preparation" && <PreparationScene />}
      </div>
    </div>
  );
}

function SimpleSceneIllustration({
  scene,
  isNeedsScene,
  compactMode = false,
}: {
  scene: Scene;
  isNeedsScene: boolean;
  compactMode?: boolean;
}) {
  const iconMap: Record<string, React.ElementType> = {
    welcome: BookOpen,
    document: FileText,
    warning: AlertTriangle,
    checklist: CheckCircle,
    output: Sparkles,
    wizard: Layers,
    preparation: Folder,
  };

  const Icon = iconMap[scene.illustration] || BookOpen;

  return (
    <div
      className={[
        "relative mx-auto flex aspect-square w-full items-center justify-center",
        compactMode ? "max-w-[112px]" : "",
        isNeedsScene ? "max-w-[220px] md:max-w-[310px]" : "max-w-[240px] md:max-w-md",
      ].join(" ")}
    >
      <div className="absolute inset-0 rounded-full bg-[#eaf6f5]" />
      <div
        className={
          compactMode
            ? "relative z-10 flex h-20 w-20 items-center justify-center rounded-3xl border border-[#d4eaea] bg-white shadow-sm"
            : "relative z-10 flex h-28 w-28 items-center justify-center rounded-3xl border border-[#d4eaea] bg-white shadow-sm md:h-36 md:w-36"
        }
      >
        <Icon
          className={
            compactMode ? "h-9 w-9 text-[#0d7377]" : "h-12 w-12 text-[#0d7377] md:h-16 md:w-16"
          }
        />
      </div>
    </div>
  );
}

function ModeCarousel() {
  const [index, setIndex] = useState(0);

  const modes = Object.values(interviewModes);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % modes.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const mode = modes[index];

  const Icon = mode.icon;

  return (
    <motion.div
      key={mode.label}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl border border-[#afdbdb]/30 bg-white p-4 shadow-[0_10px_30px_-10px_rgba(13,115,119,0.08)]"
    >
      {/* header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4" style={{ color: mode.color }} />
          <h4 className="font-bold" style={{ color: colors.deepTeal }}>
            {mode.label}
          </h4>
        </div>

        <div className="flex gap-2">
          {mode.plans.map((plan) => {
            const style = badgeConfig[plan as keyof typeof badgeConfig];

            return (
              <span
                key={plan}
                className={`rounded-full border px-3 py-1 text-xs font-semibold ${style.bg} ${style.border} ${style.text}`}
              >
                {plan}
              </span>
            );
          })}
        </div>
      </div>

      {/* features */}
      <div className="space-y-2">
        {mode.features.map((f) => (
          <div key={f} className="flex items-center gap-3 text-sm">
            <CheckCircle className="h-4 w-4" style={{ color: mode.color }} />
            <span>{f}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function WelcomeScene({ compactMode = false }: { compactMode?: boolean }) {
  return (
    <div className="relative flex h-full w-full items-center justify-center">
      <motion.div
        initial={{ scale: compactMode ? 0.9 : 0.8, y: compactMode ? 8 : 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={{ type: "spring", damping: 20 }}
        className={
          compactMode
            ? "relative z-10 flex h-28 w-28 items-center justify-center rounded-3xl border border-[#afdbdb]/40 bg-white shadow-[0_20px_50px_-15px_rgba(13,115,119,0.2)]"
            : "relative z-10 flex h-52 w-52 items-center justify-center rounded-3xl border border-[#afdbdb]/40 bg-white shadow-[0_20px_50px_-15px_rgba(13,115,119,0.2)]"
        }
      >
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        >
          <BookOpen
            className={compactMode ? "h-12 w-12" : "h-24 w-24"}
            style={{ color: colors.deepTeal }}
          />
        </motion.div>
      </motion.div>

      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute inset-0"
          animate={{ rotate: 360 }}
          transition={{ duration: 18 + i * 4, repeat: Infinity, ease: "linear", delay: i * 2 }}
        >
          <motion.div
            className="absolute left-1/2 top-6 flex h-20 w-14 flex-col items-center justify-center rounded-2xl border border-[#afdbdb]/30 bg-white shadow-xl"
            animate={{ rotate: -360 }}
            transition={{ duration: 18 + i * 4, repeat: Infinity, ease: "linear", delay: i * 2 }}
          >
            <div
              className="mb-3 h-1.5 w-8 rounded-full"
              style={{ backgroundColor: colors.softAqua }}
            />
            <div
              className="mb-3 h-1.5 w-10 rounded-full"
              style={{ backgroundColor: colors.mutedLavender }}
            />
            <div className="h-1.5 w-6 rounded-full" style={{ backgroundColor: colors.dustyRose }} />
          </motion.div>
        </motion.div>
      ))}
    </div>
  );
}

function DocumentScene({ badgeText }: { badgeText: string }) {
  return (
    <div className="relative flex h-full w-full items-center justify-center">
      <motion.div
        animate={{ y: [0, -8, 0], rotate: [-8, -4, -8] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute left-6 top-6 z-0 h-60 w-44 rounded-2xl border border-[#cdadcc]/40 bg-white p-6 shadow-lg"
      />
      <motion.div
        animate={{ y: [0, 8, 0], rotate: [8, 12, 8] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-6 right-6 z-0 h-60 w-44 rounded-2xl border border-[#afdbdb]/50 bg-white p-6 shadow-lg"
      />

      <motion.div
        animate={{ y: [0, -12, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="relative z-10 flex h-auto w-60 flex-col items-center justify-center rounded-2xl border border-[#db8090]/50 bg-white px-8 py-6 shadow-[0_30px_60px_-15px_rgba(219,128,144,0.25)]"
      >
        <div className="absolute left-0 top-0 h-full w-full overflow-hidden rounded-2xl">
          <div className="absolute -left-1/2 -top-1/2 h-full w-full rotate-45 bg-gradient-to-br from-[#f8fbfc]/80 to-transparent" />
        </div>

        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="mb-6 text-center text-5xl font-black tracking-tight leading-tight"
          style={{ color: colors.dustyRose }}
        >
          {badgeText}
        </motion.div>

        <div className="w-full space-y-5">
          <div
            className="h-2.5 w-full rounded-full"
            style={{ backgroundColor: `${colors.sageGrey}50` }}
          />
          <div
            className="h-2.5 w-5/6 rounded-full"
            style={{ backgroundColor: `${colors.sageGrey}50` }}
          />
          <div
            className="h-2.5 w-4/6 rounded-full"
            style={{ backgroundColor: `${colors.sageGrey}50` }}
          />
          <div
            className="h-2.5 w-full rounded-full"
            style={{ backgroundColor: `${colors.sageGrey}50` }}
          />
        </div>
      </motion.div>
    </div>
  );
}

function WarningScene() {
  return (
    <div className="relative flex h-full w-full items-center justify-center">
      <motion.div
        animate={{ y: [0, -10, 0], scale: [1, 1.02, 1] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="z-20 flex h-52 w-52 items-center justify-center rounded-full border-2 border-[#db8090]/20 bg-white shadow-[0_20px_70px_-10px_rgba(219,128,144,0.35)]"
      >
        <AlertTriangle className="h-24 w-24" style={{ color: colors.dustyRose }} />
      </motion.div>

      {[...Array(5)].map((_, i) => {
        const angle = (i * Math.PI * 2) / 5;
        const radius = 130;
        return (
          <motion.div
            key={i}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: i * 0.15, type: "spring", stiffness: 200 }}
            className="absolute z-10"
            style={{ x: Math.cos(angle) * radius, y: Math.sin(angle) * radius }}
          >
            <motion.div
              animate={{ y: [0, 8, 0], rotate: [-8, 8, -8] }}
              transition={{ duration: 4 + i, repeat: Infinity, ease: "easeInOut" }}
              className="flex h-16 w-16 items-center justify-center rounded-[1.25rem] border border-[#db8090]/30 bg-white shadow-xl"
            >
              <X className="h-8 w-8" style={{ color: colors.dustyRose }} />
            </motion.div>
          </motion.div>
        );
      })}
    </div>
  );
}

function ChecklistScene() {
  return (
    <div className="relative flex h-full w-full items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", damping: 25 }}
        className="relative z-20 w-72 rounded-[2rem] border border-[#afdbdb]/50 bg-white p-8 shadow-[0_30px_70px_-15px_rgba(13,115,119,0.15)]"
      >
        <div className="mb-8 flex items-center gap-4 border-b border-gray-100 pb-5">
          <CheckCircle className="h-10 w-10" style={{ color: colors.deepTeal }} />
          <div className="h-4 w-32 rounded-full" style={{ backgroundColor: colors.softAqua }} />
        </div>

        <div className="flex flex-col gap-6">
          {[...Array(4)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 + i * 0.15, ease: [0.22, 1, 0.36, 1] }}
              className="relative flex items-center gap-5"
            >
              {i > 0 && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: "1.5rem" }}
                  transition={{ delay: 0.3 + i * 0.15 + 0.2, ease: "easeOut" }}
                  className="absolute -top-6 left-[0.85rem] w-0.5 border-l-2 border-dashed"
                  style={{ borderColor: colors.softAqua }}
                />
              )}

              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3 + i * 0.15 + 0.2, type: "spring" }}
                className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg"
                style={{ backgroundColor: colors.deepTeal }}
              >
                <svg
                  className="h-4 w-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </motion.div>
              <div className="flex-1 space-y-2.5">
                <div
                  className="h-2.5 w-full rounded-full"
                  style={{ backgroundColor: `${colors.mutedLavender}80` }}
                />
                <div
                  className="h-2.5 w-2/3 rounded-full"
                  style={{ backgroundColor: `${colors.mutedLavender}40` }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

function OutputScene({ mode }: { mode: "221g" | "guide" }) {
  const isGuideMode = mode === "guide";

  return (
    <div className="relative flex h-full w-full items-center justify-center">
      <motion.div
        animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute h-72 w-72 rounded-full blur-[60px]"
        style={{ backgroundColor: colors.softAqua }}
      />

      <motion.div
        initial={{ scale: 0.8, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: "spring", damping: 20 }}
        className="relative z-20 flex h-96 w-72 flex-col items-center rounded-[2rem] border border-[#afdbdb]/50 bg-white p-8 text-center shadow-[0_40px_80px_-20px_rgba(13,115,119,0.25)]"
      >
        <motion.div
          animate={{ rotate: [0, 8, -8, 0], scale: [1, 1.05, 1] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          className="mb-8 flex h-20 w-20 items-center justify-center rounded-[1.5rem] bg-[#f0f7f7] shadow-inner"
        >
          {isGuideMode ? (
            <CheckCircle className="h-10 w-10" style={{ color: colors.deepTeal }} />
          ) : (
            <Sparkles className="h-10 w-10" style={{ color: colors.deepTeal }} />
          )}
        </motion.div>

        <div className="mb-10 h-4 w-40 rounded-full" style={{ backgroundColor: colors.softAqua }} />

        <div className="w-full flex-1 space-y-5">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <div
                className="h-5 w-5 rounded-full"
                style={{ backgroundColor: colors.mutedLavender }}
              />
              <div
                className="h-2.5 flex-1 rounded-full"
                style={{ backgroundColor: `${colors.mutedLavender}30` }}
              />
            </div>
          ))}
        </div>

        <motion.div
          className="mt-auto w-full rounded-xl py-4 text-sm font-black tracking-widest text-white shadow-md"
          style={{ background: `linear-gradient(135deg, ${colors.deepTeal}, #129c9e)` }}
          animate={{ opacity: [0.9, 1, 0.9] }}
          transition={{ duration: 2.5, repeat: Infinity }}
        >
          {isGuideMode ? "APPLICATION READY" : "READY FOR EMBASSY"}
        </motion.div>
      </motion.div>
    </div>
  );
}

function WizardScene() {
  return (
    <div className="relative flex h-full w-full items-center justify-center">
      <motion.div
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="relative z-20 flex h-36 w-36 items-center justify-center rounded-full border-4 bg-white shadow-[0_20px_50px_-10px_rgba(13,115,119,0.3)]"
        style={{ borderColor: colors.deepTeal }}
      >
        <Layers className="h-14 w-14" style={{ color: colors.deepTeal }} />
      </motion.div>

      {[120, 160].map((radius, index) => (
        <svg key={index} className="absolute inset-0 z-10 h-full w-full" viewBox="0 0 340 340">
          <defs>
            <linearGradient id={`wizardGrad${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={colors.softAqua} stopOpacity={0.8 - index * 0.2} />
              <stop
                offset="100%"
                stopColor={colors.mutedLavender}
                stopOpacity={0.8 - index * 0.2}
              />
            </linearGradient>
          </defs>
          <motion.circle
            cx="170"
            cy="170"
            r={radius}
            fill="none"
            stroke={`url(#wizardGrad${index})`}
            strokeWidth="3"
            strokeDasharray={index === 0 ? "10 10" : "20 20"}
            animate={{ rotate: index === 0 ? 360 : -360 }}
            style={{ originX: "50%", originY: "50%" }}
            transition={{ duration: 25 + index * 15, repeat: Infinity, ease: "linear" }}
          />
        </svg>
      ))}

      {[...Array(4)].map((_, i) => {
        const angle = (i * Math.PI * 2) / 4;
        const radius = 120;
        return (
          <motion.div
            key={i}
            className="absolute z-30"
            style={{ x: Math.cos(angle) * radius, y: Math.sin(angle) * radius }}
          >
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
              className="flex h-14 w-14 items-center justify-center rounded-full border-2 bg-white text-2xl font-black shadow-xl"
              style={{ borderColor: colors.softAqua, color: colors.deepTeal }}
            >
              {i + 1}
            </motion.div>
          </motion.div>
        );
      })}
    </div>
  );
}

function PreparationScene() {
  const items = [
    { icon: <FileText className="h-8 w-8" />, color: colors.dustyRose },
    { icon: <span className="text-3xl font-black">#</span>, color: colors.mutedLavender },
    { icon: <Folder className="h-8 w-8" />, color: colors.softAqua },
    { icon: <span className="text-3xl font-bold">@</span>, color: colors.sageGrey },
  ];

  return (
    <div className="relative flex h-full w-full items-center justify-center">
      <motion.div
        className="absolute z-20 flex h-44 w-44 items-center justify-center rounded-[2rem] border-2 bg-white shadow-[0_20px_60px_-15px_rgba(205,173,204,0.4)]"
        style={{ borderColor: colors.mutedLavender }}
        animate={{ scale: [1, 1.05, 1], rotate: [0, 3, -3, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      >
        <Folder className="h-20 w-20" style={{ color: colors.mutedLavender }} />
      </motion.div>

      {items.map((item, i) => {
        const angle = (i * Math.PI * 2) / items.length;
        const radius = 140;
        return (
          <motion.div
            key={i}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 + i * 0.15, type: "spring", stiffness: 180 }}
            className="absolute z-10"
            style={{ x: Math.cos(angle) * radius, y: Math.sin(angle) * radius }}
          >
            <motion.div
              animate={{ x: [0, -Math.cos(angle) * 12, 0], y: [0, -Math.sin(angle) * 12, 0] }}
              transition={{ duration: 4 + i * 0.5, repeat: Infinity, ease: "easeInOut" }}
              className="flex h-16 w-16 items-center justify-center rounded-[1.25rem] border border-gray-100 bg-white shadow-xl"
              style={{ color: item.color }}
            >
              {item.icon}
            </motion.div>

            <svg
              className="absolute inset-0 -z-10 h-full w-full"
              style={{ overflow: "visible", top: "50%", left: "50%" }}
            >
              <motion.line
                x1="0"
                y1="0"
                x2={-Math.cos(angle) * (radius - 55)}
                y2={-Math.sin(angle) * (radius - 55)}
                stroke={item.color}
                strokeWidth="3"
                strokeDasharray="6 6"
                opacity="0.3"
              />
            </svg>
          </motion.div>
        );
      })}
    </div>
  );
}
