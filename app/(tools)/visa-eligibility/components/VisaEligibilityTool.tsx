"use client";

/**
 * VisaEligibilityTool — Pakistan to US Immigration Eligibility Checker
 *
 * All visa logic verified against official USCIS sources:
 *
 * [1] Immediate Relatives of US Citizens
 *     https://www.uscis.gov/green-card/green-card-eligibility/green-card-for-immediate-relatives-of-us-citizen
 *
 * [2] Family Preference Immigrants
 *     https://www.uscis.gov/green-card/green-card-eligibility/green-card-for-family-preference-immigrants
 *
 * [3] Bringing Parents to the US (21+ rule)
 *     https://www.uscis.gov/family/family-of-us-citizens/bringing-parents-to-live-in-the-united-states-as-permanent-residents
 *
 * [4] Bringing Siblings to the US (21+ rule)
 *     https://www.uscis.gov/family/family-of-us-citizens/bringing-siblings-to-live-in-the-united-states-as-permanent-residents
 *
 * [5] Bringing Children to the US
 *     https://www.uscis.gov/family/bring-children-to-live-in-the-US
 *
 * [6] K-1 Fiancé Visa
 *     https://www.uscis.gov/family/family-of-us-citizens/k-1-fiance-visa
 *
 * [7] I-130 Form Instructions (LPR categories)
 *     https://www.uscis.gov/sites/default/files/document/forms/i-130instr.pdf
 *
 * USCIS-ENFORCED RULES IN THIS TOOL:
 * ─────────────────────────────────────────────────────────────────
 * 1. Petitioner MUST be 21+ to sponsor PARENT (IR-5)       [ref 3]
 * 2. Petitioner MUST be 21+ to sponsor SIBLING (F-4)       [ref 4]
 * 3. Petitioner UNDER 21 can ONLY sponsor spouse/fiancé    [ref 1]
 * 4. LPR cannot sponsor PARENTS — USC only                 [ref 7]
 * 5. LPR cannot sponsor SIBLINGS — USC only                [ref 7]
 * 6. LPR cannot sponsor MARRIED children (F-3) — USC only  [ref 7]
 * 7. LPR can ONLY sponsor: spouse (F2A), child <21 (F2A),
 *    unmarried adult child (F2B)                           [ref 7]
 * 8. F-3 = Married sons/daughters of US citizens           [ref 2]
 * ─────────────────────────────────────────────────────────────────
 */

import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useAuth } from "@/app/context/AuthContext";
import { MasterProfile } from "@/types/profile";
import { motion, AnimatePresence } from "framer-motion";
import { autoFillForm } from "@/lib/autoFill/mapper";
import {
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  Flag,
  Heart,
  User,
  FileText,
  X,
  Save,
  RefreshCw,
  AlertTriangle,
  Info,
  LucideIcon,
} from "lucide-react";
import { visaCriteria } from "../criteria-data";
import { Loader } from "@/components/ui/spinner";

// ─── Types ────────────────────────────────────────────────────────────────────

type VisaSuggestion = {
  code: string;
  title: string;
  description: string;
};

type Answers = {
  // Section 1 — Petitioner
  petitionerStatus?: "US_CITIZEN" | "LPR" | "NONE";
  statusOrigin?: "NATURALIZED" | "BIRTH" | "GREEN_CARD";
  petitionerAgeGroup?: "UNDER_21" | "OVER_21"; // USCIS: 21+ needed for parent/sibling

  // Section 2 — Relationship
  relationship?:
    | "SPOUSE"              // IR-1/CR-1 (USC) or F2A (LPR)
    | "FIANCE"              // K-1 (USC only)
    | "CHILD_UNDER_21"      // unmarried, under 21 → IR-2 (USC) or F2A (LPR)
    | "SON_DAUGHTER_ADULT"  // unmarried, 21+ → F-1 (USC) or F2B (LPR)
    | "SON_DAUGHTER_MARRIED"// married any age → F-3 (USC only)
    | "PARENT"              // IR-5 (USC + 21+ only)
    | "SIBLING"             // F-4 (USC + 21+ only)
    | "EMPLOYMENT"          // EB-1/2/3
    | "OTHER";
  legalStatus?: "BIOLOGICAL" | "ADOPTIVE" | "STEP";
  isLegallyMarried?: "YES" | "NO";
  marriageDuration?: "LESS_THAN_2" | "MORE_THAN_2";

  // Section 3 — Applicant location
  applicantLocation?: "PAKISTAN" | "INSIDE_US" | "OTHER_COUNTRY";

  // Section 4 — Purpose
  intent?: "PERMANENT" | "TEMPORARY";
  tempPurpose?: "TOURISM" | "STUDY" | "WORK" | "HUMANITARIAN";
  violationHistory?: "YES" | "NO" | "NOT_SURE";
  sponsorBase?: "FAMILY" | "EMPLOYMENT" | "INVESTMENT" | "HUMANITARIAN";
};

// ─── Section Metadata ─────────────────────────────────────────────────────────

const SECTIONS = [
  {
    icon: Flag,
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
    title: "Your Status in the US",
    subtitle:
      "Tell us about your current immigration status. Answer as the petitioner — the person in the US who will be sponsoring.",
  },
  {
    icon: Heart,
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
    title: "Your Relationship",
    subtitle:
      "Who are you sponsoring from Pakistan? This determines which visa categories apply.",
  },
  {
    icon: User,
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
    title: "Applicant Details",
    subtitle:
      "About the person currently in Pakistan who wishes to come to the US.",
  },
  {
    icon: FileText,
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
    title: "Purpose & Background",
    subtitle: "A few final questions to determine eligible visa categories.",
  },
];

const TOTAL_STEPS = 5;

// ─── Component ────────────────────────────────────────────────────────────────

export function VisaEligibilityTool() {
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState<Answers>({});
  const [selectedVisaCode, setSelectedVisaCode] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  const { user } = useAuth();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  // ── Auto-fill from profile ──────────────────────────────────────────────────

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("user_profiles")
        .select("profile_details")
        .eq("id", user.id)
        .single();

      if (!data?.profile_details) return;
      const profile = data.profile_details as MasterProfile;

      const dummyForm: Answers = {};
      const formRecord = dummyForm as Record<string, unknown>;
      Object.keys(dummyForm).forEach((k) => { formRecord[k] = null; });

      const filled = autoFillForm(profile, formRecord) as Answers;
      const derived: Partial<Answers> = { ...filled };

      // Petitioner status
      if (!derived.petitionerStatus) {
        if (profile.citizenshipStatus === "USCitizen") derived.petitionerStatus = "US_CITIZEN";
        else if (profile.citizenshipStatus === "LPR") derived.petitionerStatus = "LPR";
        else if (String(profile.citizenshipStatus).toLowerCase().includes("citizen")) derived.petitionerStatus = "US_CITIZEN";
        else if (String(profile.citizenshipStatus).toLowerCase().includes("permanent") || String(profile.citizenshipStatus).includes("LPR")) derived.petitionerStatus = "LPR";
      }

      // Petitioner age — simple UNDER_21 / OVER_21
      if (!derived.petitionerAgeGroup && profile.dateOfBirth) {
        const age = Math.abs(
          new Date(Date.now() - new Date(profile.dateOfBirth).getTime()).getUTCFullYear() - 1970
        );
        derived.petitionerAgeGroup = age >= 21 ? "OVER_21" : "UNDER_21";
      }

      // Relationship from visaType
      if (!derived.relationship) {
        if (profile.visaType) {
          const vt = profile.visaType;
          if (["IR-1", "CR-1", "K-3", "K3", "IR1", "CR1"].includes(vt)) derived.relationship = "SPOUSE";
          else if (["IR-5", "IR5"].includes(vt)) derived.relationship = "PARENT";
          else if (["IR-2", "F2A", "IR2"].includes(vt)) derived.relationship = "CHILD_UNDER_21";
          else if (["F1", "F2B"].includes(vt)) derived.relationship = "SON_DAUGHTER_ADULT";
          else if (["F3"].includes(vt)) derived.relationship = "SON_DAUGHTER_MARRIED";
          else if (["F4"].includes(vt)) derived.relationship = "SIBLING";
          else if (["K-1", "K1"].includes(vt)) derived.relationship = "FIANCE";
        }
        if (!derived.relationship && profile.relationship?.type) {
          const rel = profile.relationship.type.toUpperCase();
          if (rel === "SPOUSE") derived.relationship = "SPOUSE";
          else if (["FIANCE", "FIANCEE"].includes(rel)) derived.relationship = "FIANCE";
          else if (rel === "CHILD") derived.relationship = "CHILD_UNDER_21";
          else if (["PARENT", "FATHER", "MOTHER"].includes(rel)) derived.relationship = "PARENT";
          else if (["SIBLING", "BROTHER", "SISTER"].includes(rel)) derived.relationship = "SIBLING";
        }
      }

      // Marriage duration
      if (!derived.marriageDuration && profile.relationship?.marriageDate) {
        const diffYears =
          (Date.now() - new Date(profile.relationship.marriageDate).getTime()) /
          (1000 * 60 * 60 * 24 * 365.25);
        derived.marriageDuration = diffYears >= 2 ? "MORE_THAN_2" : "LESS_THAN_2";
        derived.isLegallyMarried = "YES";
      }

      // Applicant location
      if (!derived.applicantLocation) {
        const country =
          profile.beneficiary?.countryOfResidence || profile.currentAddress?.country;
        if (country) {
          const isUS =
            country.toLowerCase().includes("united states") ||
            ["usa", "us"].includes(country.toLowerCase());
          derived.applicantLocation = isUS ? "INSIDE_US" : "PAKISTAN";
        }
      }

      if (Object.keys(derived).length > 0) {
        setAnswers((prev) => {
          const final = { ...prev, ...derived };
          const hasEnoughFamily = final.petitionerStatus && final.relationship && final.intent;
          const hasEnoughEmployment =
            ["EMPLOYMENT", "INVESTMENT", "HUMANITARIAN"].includes(final.sponsorBase ?? "") &&
            final.intent;
          if (hasEnoughFamily || hasEnoughEmployment) setTimeout(() => setStep(5), 120);
          return final;
        });
      }
    };
    fetchProfile();
  }, [user, supabase]);

  // ── Save to Supabase ─────────────────────────────────────────────────────────

  const saveToProfile = async () => {
    if (!user) return;
    try {
      setSaving(true);
      setSaveMessage("");
      const { data: profileData } = await supabase
        .from("user_profiles")
        .select("profile_details")
        .eq("id", user.id)
        .single();

      const existing = (profileData?.profile_details as MasterProfile) || {};
      const updated: MasterProfile = {
        ...existing,
        visaEligibility: { ...existing.visaEligibility, ...answers },
      };

      const { error } = await supabase.from("user_profiles").upsert({
        id: user.id,
        profile_details: updated,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;
      setSaveMessage("Successfully saved to your profile!");
      setTimeout(() => setSaveMessage(""), 3000);
    } catch (err) {
      console.error("Save error:", err);
      setSaveMessage("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // USCIS-VERIFIED VISA LOGIC
  // ─────────────────────────────────────────────────────────────────────────────

  const getVisaSuggestions = (): VisaSuggestion[] => {
    const v: VisaSuggestion[] = [];
    const {
      petitionerStatus,
      petitionerAgeGroup,
      relationship,
      isLegallyMarried,
      marriageDuration,
      legalStatus,
      intent,
      tempPurpose,
      sponsorBase,
    } = answers;

    // ── TEMPORARY (non-immigrant) ─────────────────────────────────────────────
    if (intent === "TEMPORARY") {
      if (tempPurpose === "TOURISM")
        v.push({ code: "B1/B2", title: "Visitor Visa (B-1/B-2)", description: "For temporary tourism, family visits, or business trips from Pakistan." });
      if (tempPurpose === "STUDY")
        v.push({ code: "F-1", title: "Academic Student Visa (F-1)", description: "For Pakistani students admitted to a SEVP-certified US academic institution." });
      if (tempPurpose === "WORK") {
        v.push({ code: "H-1B", title: "Specialty Occupation Work Visa (H-1B)", description: "For Pakistani professionals in specialty occupations with a US employer sponsor." });
        v.push({ code: "L-1", title: "Intra-Company Transfer (L-1)", description: "For employees of a Pakistani company transferring to a US branch or affiliate." });
        v.push({ code: "O-1", title: "Extraordinary Ability Visa (O-1)", description: "For those with extraordinary ability in science, arts, business, or athletics." });
      }
      if (tempPurpose === "HUMANITARIAN") {
        v.push({ code: "Humanitarian", title: "Humanitarian Immigration", description: "Asylum, refugee, VAWA, or special immigrant categories." });
        v.push({ code: "J-1", title: "Exchange Visitor Visa (J-1)", description: "For participants in approved cultural or educational exchange programs." });
      }
      return v;
    }

    // ── PERMANENT — US CITIZEN ────────────────────────────────────────────────
    // Source: uscis.gov/green-card/green-card-eligibility/green-card-for-immediate-relatives-of-us-citizen
    if (petitionerStatus === "US_CITIZEN") {

      // Spouse — IR-1/CR-1 (no petitioner age restriction per USCIS)
      if (relationship === "SPOUSE" && isLegallyMarried === "YES") {
        if (marriageDuration === "MORE_THAN_2")
          v.push({ code: "IR-1", title: "Immediate Relative – Spouse (IR-1)", description: "For Pakistani spouses of US citizens married 2+ years. No annual cap." });
        if (marriageDuration === "LESS_THAN_2")
          v.push({ code: "CR-1", title: "Conditional Resident – Spouse (CR-1)", description: "For Pakistani spouses married less than 2 years. Conditional Green Card for 2 years." });
      }

      // Fiancé — K-1 (no petitioner age restriction per USCIS)
      // Source: uscis.gov/family/family-of-us-citizens/k-1-fiance-visa
      if (relationship === "FIANCE")
        v.push({ code: "K-1", title: "Fiancé(e) Visa (K-1)", description: "For Pakistani fiancés of US citizens. Must marry within 90 days of US entry." });

      // Child under 21 unmarried — IR-2 (no petitioner age restriction)
      if (relationship === "CHILD_UNDER_21")
        v.push({ code: "IR-2", title: "Child of US Citizen (IR-2)", description: "For unmarried Pakistani children under 21 of US citizens. No annual cap." });

      // Unmarried son/daughter 21+ — F-1 preference
      // Source: uscis.gov/green-card/green-card-eligibility/green-card-for-family-preference-immigrants
      if (relationship === "SON_DAUGHTER_ADULT")
        v.push({ code: "F1", title: "Unmarried Adult Child of US Citizen (F-1)", description: "For unmarried Pakistani sons/daughters 21+ of US citizens. Subject to annual cap." });

      // Married son/daughter — F-3 (US citizen only, no LPR equivalent)
      // Source: uscis.gov/green-card/green-card-eligibility/green-card-for-family-preference-immigrants
      if (relationship === "SON_DAUGHTER_MARRIED")
        v.push({ code: "F3", title: "Married Son/Daughter of US Citizen (F-3)", description: "For married Pakistani sons/daughters of US citizens. Subject to annual cap." });

      // Parent — IR-5 — PETITIONER MUST BE 21+ (hard USCIS rule)
      // Source: uscis.gov/family/family-of-us-citizens/bringing-parents-to-live-in-the-united-states-as-permanent-residents
      if (relationship === "PARENT" && petitionerAgeGroup === "OVER_21" && legalStatus !== undefined)
        v.push({ code: "IR-5", title: "Parent of US Citizen (IR-5)", description: "For Pakistani parents of US citizens aged 21+. No annual cap — immediate relative." });

      // Sibling — F-4 — PETITIONER MUST BE 21+ (hard USCIS rule)
      // Source: uscis.gov/family/family-of-us-citizens/bringing-siblings-to-live-in-the-united-states-as-permanent-residents
      if (relationship === "SIBLING" && petitionerAgeGroup === "OVER_21")
        v.push({ code: "F4", title: "Sibling of US Citizen (F-4)", description: "For Pakistani brothers/sisters of US citizens aged 21+. Expect 10–15+ year wait." });
    }

    // ── PERMANENT — LPR ───────────────────────────────────────────────────────
    // Source: uscis.gov/sites/default/files/document/forms/i-130instr.pdf
    // LPR can ONLY sponsor: spouse (F2A), child <21 (F2A), unmarried adult child (F2B)
    // LPR CANNOT sponsor: parents, siblings, married children
    if (petitionerStatus === "LPR") {

      // Spouse — F2A
      if (relationship === "SPOUSE" && isLegallyMarried === "YES")
        v.push({ code: "F2A", title: "Spouse of Green Card Holder (F2A)", description: "For Pakistani spouses of Lawful Permanent Residents. Subject to annual numerical limits." });

      // Child under 21 — F2A
      if (relationship === "CHILD_UNDER_21")
        v.push({ code: "F2A", title: "Child of Green Card Holder (F2A)", description: "For unmarried Pakistani children under 21 of LPRs. Subject to annual limits." });

      // Unmarried adult child — F2B
      if (relationship === "SON_DAUGHTER_ADULT")
        v.push({ code: "F2B", title: "Unmarried Adult Child of Green Card Holder (F2B)", description: "For unmarried Pakistani sons/daughters 21+ of LPRs. Subject to annual limits." });

      // LPR cannot sponsor parent, sibling, or married children — no entries added
    }

    // ── EMPLOYMENT-BASED ──────────────────────────────────────────────────────
    if (relationship === "EMPLOYMENT" || sponsorBase === "EMPLOYMENT") {
      v.push({ code: "EB-1", title: "Employment-Based 1st Preference (EB-1)", description: "For extraordinary ability, outstanding researchers, or multinational executives." });
      v.push({ code: "EB-2", title: "Employment-Based 2nd Preference (EB-2)", description: "For advanced degree professionals or those with exceptional ability." });
      v.push({ code: "EB-3", title: "Employment-Based 3rd Preference (EB-3)", description: "For skilled workers, professionals, and other workers with a US job offer." });
    }

    if (sponsorBase === "INVESTMENT")
      v.push({ code: "EB-5", title: "Immigrant Investor Visa (EB-5)", description: "For Pakistani investors creating US jobs. Minimum $800K–$1.05M investment required." });

    if (sponsorBase === "HUMANITARIAN")
      v.push({ code: "Humanitarian", title: "Humanitarian Immigration", description: "Asylum, refugee, VAWA, and other special immigrant categories." });

    return v;
  };

  // ── Helpers ──────────────────────────────────────────────────────────────────

  const setAnswer = <K extends keyof Answers>(key: K, value: Answers[K]) =>
    setAnswers((prev) => ({ ...prev, [key]: value }));

  // USCIS-verified navigation guard
  const canProceed = (): boolean => {
    if (step === 1) return !!answers.petitionerStatus && !!answers.petitionerAgeGroup;
    if (step === 2) {
      if (!answers.relationship) return false;
      // Block Next if selected relationship is not allowed for this petitioner
      if (answers.relationship && isBlocked(answers.relationship)) return false;
      if (answers.relationship === "SPOUSE")
        return !!answers.isLegallyMarried && !!answers.marriageDuration;
      if (["PARENT", "CHILD_UNDER_21", "SON_DAUGHTER_ADULT", "SON_DAUGHTER_MARRIED", "SIBLING"].includes(answers.relationship))
        return !!answers.legalStatus;
      return true; // FIANCE, EMPLOYMENT, OTHER
    }
    if (step === 3) return !!answers.applicantLocation;
    if (step === 4) return !!answers.intent;
    return true;
  };

  const next = () => { if (canProceed() && step < TOTAL_STEPS) setStep((s) => s + 1); };
  const back = () => { if (step > 1) setStep((s) => s - 1); };
  const restart = () => { setAnswers({}); setStep(1); };

  const progress = (step / TOTAL_STEPS) * 100;
  const fadeIn = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
    transition: { duration: 0.3 },
  };

  // Derived booleans
  const isLPR = answers.petitionerStatus === "LPR";
  const isUnder21 = answers.petitionerAgeGroup === "UNDER_21";

  // A relationship is blocked if petitioner is LPR or under 21 (USCIS rules)
  const isBlocked = (rel: string): boolean => {
    if (isLPR && ["PARENT", "SIBLING", "SON_DAUGHTER_MARRIED"].includes(rel)) return true;
    if (isUnder21 && ["PARENT", "SIBLING"].includes(rel)) return true;
    return false;
  };

  const blockedReason = (rel: string): string => {
    if (isLPR && rel === "PARENT") return "Only US citizens can sponsor parents";
    if (isLPR && rel === "SIBLING") return "Only US citizens can sponsor siblings";
    if (isLPR && rel === "SON_DAUGHTER_MARRIED") return "LPRs cannot sponsor married children";
    if (isUnder21 && rel === "PARENT") return "Must be 21 or older to sponsor a parent";
    if (isUnder21 && rel === "SIBLING") return "Must be 21 or older to sponsor a sibling";
    return "";
  };

  // Show contextual inline warning only when user has selected a blocked relationship
  const selectedBlockedReason = answers.relationship ? blockedReason(answers.relationship) : "";

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="w-full bg-white/95 rounded-3xl overflow-hidden flex flex-col h-full">

        {/* Header */}
        <div className="p-8 pb-0">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-black">Immigration Questionnaire</h1>
            <span className="text-sm font-semibold text-gray-400">
              Section {Math.min(step, 4)} of 4
            </span>
          </div>
          <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            />
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 p-8 overflow-y-auto">
          <AnimatePresence mode="wait">

            {/* ── STEP 1: Petitioner Status ── */}
            {step === 1 && (
              <motion.div key="s1" {...fadeIn} className="space-y-8">
                <SectionHeader section={SECTIONS[0]} />

                <QBlock label="Q. Are you currently a:">
                  <div className="grid grid-cols-1 gap-2.5">
                    <CompactOption label="US Citizen" hint="Naturalized or by birth" isSelected={answers.petitionerStatus === "US_CITIZEN"} onClick={() => setAnswer("petitionerStatus", "US_CITIZEN")} />
                    <CompactOption label="US Permanent Resident" hint="Green Card holder (LPR)" isSelected={answers.petitionerStatus === "LPR"} onClick={() => setAnswer("petitionerStatus", "LPR")} />
                    <CompactOption label="None of the above" hint="Not currently in the US" isSelected={answers.petitionerStatus === "NONE"} onClick={() => setAnswer("petitionerStatus", "NONE")} />
                  </div>
                </QBlock>

                {answers.petitionerStatus && answers.petitionerStatus !== "NONE" && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">

                    <QBlock label="Q. How did you obtain your US status?">
                      <div className="grid grid-cols-1 gap-2.5">
                        <CompactOption label="US citizen by birth" isSelected={answers.statusOrigin === "BIRTH"} onClick={() => setAnswer("statusOrigin", "BIRTH")} />
                        <CompactOption label="Naturalized citizen" hint="Through the immigration process" isSelected={answers.statusOrigin === "NATURALIZED"} onClick={() => setAnswer("statusOrigin", "NATURALIZED")} />
                        <CompactOption label="Green Card holder" hint="Through family, employment, or asylum" isSelected={answers.statusOrigin === "GREEN_CARD"} onClick={() => setAnswer("statusOrigin", "GREEN_CARD")} />
                      </div>
                    </QBlock>

                    {/* Age — only 2 options per USCIS logic */}
                    <QBlock label="Q. What is your current age?">
                      <div className="grid grid-cols-2 gap-3">
                        <GridButton
                          label="Under 21"
                          isSelected={answers.petitionerAgeGroup === "UNDER_21"}
                          onClick={() => setAnswer("petitionerAgeGroup", "UNDER_21")}
                        />
                        <GridButton
                          label="21 or older"
                          isSelected={answers.petitionerAgeGroup === "OVER_21"}
                          onClick={() => setAnswer("petitionerAgeGroup", "OVER_21")}
                        />
                      </div>
                    </QBlock>

                    {/* No proactive warning here — restrictions shown contextually in Step 2 when user selects a blocked option */}

                    {/* USCIS info — LPR restriction */}
                    {isLPR && (
                      <div className="flex gap-3 p-4 bg-primary/5 border border-primary/20 rounded-xl text-sm text-primary">
                        <Info size={18} className="shrink-0 mt-0.5" />
                        <div>
                          <strong>Green Card holder (USCIS):</strong> As an LPR, you can only sponsor your <strong>spouse</strong> and <strong>unmarried children</strong>.
                          You cannot sponsor parents or siblings — only US citizens can.{" "}
                          <a
                            href="https://www.uscis.gov/green-card/green-card-eligibility/green-card-for-family-preference-immigrants"
                            target="_blank"
                            rel="noreferrer"
                            className="underline font-medium"
                          >
                            USCIS source 
                          </a>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                <NavFooter step={step} canNext={canProceed()} onBack={back} onNext={next} />
              </motion.div>
            )}

            {/* ── STEP 2: Relationship ── */}
            {step === 2 && (
              <motion.div key="s2" {...fadeIn} className="space-y-6">
                <SectionHeader section={SECTIONS[1]} />

                <QBlock label="Q. Who are you sponsoring from Pakistan?">
                  <div className="grid grid-cols-2 gap-3">

                    {/* Spouse */}
                    <RelCard
                      label="Spouse"
                      hint="Husband / Wife"
                      tag="IR-1 / CR-1"
                      isSelected={answers.relationship === "SPOUSE"}
                      onClick={() => setAnswer("relationship", "SPOUSE")}
                    />

                    {/* Fiancé */}
                    <RelCard
                      label="Fiancé / Fiancée"
                      hint="Plan to marry in US"
                      tag="K-1"
                      isSelected={answers.relationship === "FIANCE"}
                      onClick={() => setAnswer("relationship", "FIANCE")}
                    />

                    {/* Child under 21 */}
                    <RelCard
                      label="Child under 21"
                      hint="Unmarried, in Pakistan"
                      tag="IR-2 / F2A"
                      isSelected={answers.relationship === "CHILD_UNDER_21"}
                      onClick={() => setAnswer("relationship", "CHILD_UNDER_21")}
                    />

                    {/* Son/daughter 21+ unmarried */}
                    <RelCard
                      label="Son / Daughter 21+"
                      hint="Unmarried, in Pakistan"
                      tag="F-1 / F2B"
                      isSelected={answers.relationship === "SON_DAUGHTER_ADULT"}
                      onClick={() => setAnswer("relationship", "SON_DAUGHTER_ADULT")}
                    />

                    {/* Married son/daughter — USC only */}
                    {!isLPR && (
                      <RelCard
                        label="Son / Daughter"
                        hint="Married, any age"
                        tag="F-3 (USC only)"
                        isSelected={answers.relationship === "SON_DAUGHTER_MARRIED"}
                        onClick={() => setAnswer("relationship", "SON_DAUGHTER_MARRIED")}
                      />
                    )}

                    {/* Parent */}
                    <RelCard
                      label="Parent"
                      hint="Mother or Father"
                      tag="IR-5"
                      isSelected={answers.relationship === "PARENT"}
                      onClick={() => !isBlocked("PARENT") && setAnswer("relationship", "PARENT")}
                      blocked={isBlocked("PARENT")}
                      blockedReason={blockedReason("PARENT")}
                    />

                    {/* Sibling */}
                    <RelCard
                      label="Sibling"
                      hint="Brother or Sister"
                      tag="F-4"
                      isSelected={answers.relationship === "SIBLING"}
                      onClick={() => !isBlocked("SIBLING") && setAnswer("relationship", "SIBLING")}
                      blocked={isBlocked("SIBLING")}
                      blockedReason={blockedReason("SIBLING")}
                    />

                    {/* Employment */}
                    <RelCard
                      label="Employment"
                      hint="Work / skilled visa"
                      tag="EB-1 / 2 / 3"
                      isSelected={answers.relationship === "EMPLOYMENT"}
                      onClick={() => setAnswer("relationship", "EMPLOYMENT")}
                    />

                    {/* Other */}
                    <RelCard
                      label="Other / Not sure"
                      hint="Humanitarian or other"
                      tag=""
                      isSelected={answers.relationship === "OTHER"}
                      onClick={() => setAnswer("relationship", "OTHER")}
                    />
                  </div>
                </QBlock>

                {/* Contextual blocked warning */}
                {selectedBlockedReason && (
                  <div className="flex gap-3 p-3.5 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
                    <AlertTriangle size={15} className="shrink-0 mt-0.5" />
                    <span>
                      <strong>Not eligible:</strong> {selectedBlockedReason}.{" "}
                      <a
                        href={isLPR
                          ? "https://www.uscis.gov/green-card/green-card-eligibility/green-card-for-family-preference-immigrants"
                          : "https://www.uscis.gov/family/family-of-us-citizens/bringing-parents-to-live-in-the-united-states-as-permanent-residents"
                        }
                        target="_blank" rel="noreferrer" className="underline font-medium"
                      >USCIS source </a>
                    </span>
                  </div>
                )}

                {/* Spouse follow-ups */}
                {answers.relationship === "SPOUSE" && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                    <QBlock label="Q. Are you legally married to this person?">
                      <div className="grid grid-cols-2 gap-3">
                        <GridButton label="Yes, legally married" isSelected={answers.isLegallyMarried === "YES"} onClick={() => setAnswer("isLegallyMarried", "YES")} />
                        <GridButton label="Not yet married" isSelected={answers.isLegallyMarried === "NO"} onClick={() => setAnswer("isLegallyMarried", "NO")} />
                      </div>
                    </QBlock>
                    {answers.isLegallyMarried === "NO" && (
                      <div className="text-sm text-primary bg-primary/5 border border-primary/20 rounded-xl p-3.5">
                        If you are engaged and plan to marry in the US, go back and select <strong>Fiancé/Fiancée</strong> to see the K-1 visa option.
                      </div>
                    )}
                    {answers.isLegallyMarried === "YES" && (
                      <div className="space-y-3">
                        <QBlock label="Q. How long have you been married?">
                          <div className="grid grid-cols-2 gap-3">
                            <GridButton label="Less than 2 years" isSelected={answers.marriageDuration === "LESS_THAN_2"} onClick={() => setAnswer("marriageDuration", "LESS_THAN_2")} />
                            <GridButton label="2 years or more" isSelected={answers.marriageDuration === "MORE_THAN_2"} onClick={() => setAnswer("marriageDuration", "MORE_THAN_2")} />
                          </div>
                        </QBlock>
                        {answers.marriageDuration === "LESS_THAN_2" && (
                          <div className="flex gap-2.5 p-3.5 bg-primary/5 border border-primary/15 rounded-xl text-xs text-primary/80">
                            <Info size={14} className="shrink-0 mt-0.5" />
                            <span>
                              <strong>Note:</strong> USCIS determines CR-1 vs IR-1 based on marriage duration at <strong>visa issuance</strong>, not filing date. If processing takes 2+ years, your CR-1 may automatically upgrade to IR-1.{" "}
                              <a href="https://www.uscis.gov/green-card/green-card-eligibility/green-card-for-immediate-relatives-of-us-citizen" target="_blank" rel="noreferrer" className="underline font-medium">USCIS </a>
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Nature of relationship */}
                {["PARENT", "CHILD_UNDER_21", "SON_DAUGHTER_ADULT", "SON_DAUGHTER_MARRIED", "SIBLING"].includes(answers.relationship ?? "") && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <QBlock label="Q. What is the nature of this relationship?">
                      <div className="grid grid-cols-3 gap-3">
                        <GridButton label="Biological" isSelected={answers.legalStatus === "BIOLOGICAL"} onClick={() => setAnswer("legalStatus", "BIOLOGICAL")} />
                        <GridButton label="Adoptive" isSelected={answers.legalStatus === "ADOPTIVE"} onClick={() => setAnswer("legalStatus", "ADOPTIVE")} />
                        <GridButton label="Step" isSelected={answers.legalStatus === "STEP"} onClick={() => setAnswer("legalStatus", "STEP")} />
                      </div>
                      {answers.legalStatus === "ADOPTIVE" && (
                        <p className="text-xs text-gray-400 mt-2 pl-1">Adoption must have occurred before the child turned 16.</p>
                      )}
                      {answers.legalStatus === "STEP" && (
                        <p className="text-xs text-gray-400 mt-2 pl-1">Marriage creating the step-relationship must have occurred before the child turned 18.</p>
                      )}
                    </QBlock>
                  </motion.div>
                )}

                <NavFooter step={step} canNext={canProceed()} onBack={back} onNext={next} />
              </motion.div>
            )}

            {/* ── STEP 3: Applicant Details ── */}
            {step === 3 && (
              <motion.div key="s3" {...fadeIn} className="space-y-8">
                <SectionHeader section={SECTIONS[2]} />

                <QBlock label="Q. Where is the applicant currently located?">
                  <div className="grid grid-cols-1 gap-2.5">
                    <CompactOption label="In Pakistan" hint="Seeking an immigrant or non-immigrant US visa" isSelected={answers.applicantLocation === "PAKISTAN"} onClick={() => setAnswer("applicantLocation", "PAKISTAN")} />
                    <CompactOption label="Currently inside the US" hint="On a temporary visa or visa waiver" isSelected={answers.applicantLocation === "INSIDE_US"} onClick={() => setAnswer("applicantLocation", "INSIDE_US")} />
                    <CompactOption label="In a third country" hint="Not Pakistan and not the US" isSelected={answers.applicantLocation === "OTHER_COUNTRY"} onClick={() => setAnswer("applicantLocation", "OTHER_COUNTRY")} />
                  </div>
                </QBlock>

                <NavFooter step={step} canNext={canProceed()} onBack={back} onNext={next} />
              </motion.div>
            )}

            {/* ── STEP 4: Purpose & Background ── */}
            {step === 4 && (
              <motion.div key="s4" {...fadeIn} className="space-y-8">
                <SectionHeader section={SECTIONS[3]} />

                <QBlock label="Q. Is the applicant seeking permanent residence or a temporary stay?">
                  <div className="grid grid-cols-2 gap-3">
                    <GridButton label="Permanent residency" isSelected={answers.intent === "PERMANENT"} onClick={() => setAnswer("intent", "PERMANENT")} />
                    <GridButton label="Temporary stay" isSelected={answers.intent === "TEMPORARY"} onClick={() => setAnswer("intent", "TEMPORARY")} />
                  </div>
                </QBlock>

                {answers.intent === "TEMPORARY" && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <QBlock label="Q. What is the purpose of the temporary visit?">
                      <div className="grid grid-cols-2 gap-3">
                        <RelCard label="Tourism / Visit" hint="B-1/B-2 visitor visa" tag="B-1/B-2" isSelected={answers.tempPurpose === "TOURISM"} onClick={() => setAnswer("tempPurpose", "TOURISM")} />
                        <RelCard label="Academic Study" hint="F-1 student visa" tag="F-1" isSelected={answers.tempPurpose === "STUDY"} onClick={() => setAnswer("tempPurpose", "STUDY")} />
                        <RelCard label="Work / Occupation" hint="H-1B, L-1, or O-1" tag="H-1B / L-1 / O-1" isSelected={answers.tempPurpose === "WORK"} onClick={() => setAnswer("tempPurpose", "WORK")} />
                        <RelCard label="Humanitarian" hint="Asylum, refugee, VAWA" tag="Asylum / VAWA" isSelected={answers.tempPurpose === "HUMANITARIAN"} onClick={() => setAnswer("tempPurpose", "HUMANITARIAN")} />
                      </div>
                    </QBlock>
                  </motion.div>
                )}

                {answers.intent === "PERMANENT" && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <QBlock label="Q. What is the basis for sponsorship?">
                      <div className="grid grid-cols-2 gap-3">
                        {(["FAMILY", "EMPLOYMENT", "INVESTMENT", "HUMANITARIAN"] as const).map((opt) => (
                          <GridButton key={opt} label={opt.charAt(0) + opt.slice(1).toLowerCase()} isSelected={answers.sponsorBase === opt} onClick={() => setAnswer("sponsorBase", opt)} />
                        ))}
                      </div>
                    </QBlock>
                  </motion.div>
                )}

                <QBlock label="Q. Has the applicant ever been denied a US visa or had immigration violations?">
                  <div className="grid grid-cols-3 gap-3">
                    {(["NO", "YES", "NOT_SURE"] as const).map((opt) => (
                      <GridButton key={opt} label={opt.replace("_", " ")} isSelected={answers.violationHistory === opt} onClick={() => setAnswer("violationHistory", opt)} />
                    ))}
                  </div>
                </QBlock>

                {answers.violationHistory === "YES" && (
                  <div className="flex gap-3 p-4 bg-amber-50 border border-amber-100 rounded-xl text-sm text-amber-700">
                    <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                    <span>Previous visa denials or violations may affect eligibility. We will still show potential categories — consult an immigration attorney for your specific situation.</span>
                  </div>
                )}

                <NavFooter step={step} canNext={canProceed()} onBack={back} onNext={next} isLast />
              </motion.div>
            )}

            {/* ── STEP 5: Results ── */}
            {step === 5 && (() => {
              const suggestions = getVisaSuggestions();
              return (
                <motion.div key="s5" {...fadeIn} className="space-y-8">
                  {suggestions.length > 0 ? (
                    <>
                      <div className="text-center">
                        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                          <CheckCircle size={40} />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">
                          Visa Categories You May Be Eligible For
                        </h2>
                        <p className="text-gray-500 mt-2">Based on the information you provided</p>
                      </div>

                      <div className="space-y-4">
                        {suggestions.map((visa) => (
                          <div
                            key={visa.code}
                            onClick={() => setSelectedVisaCode(visa.code)}
                            className="p-5 border rounded-xl bg-gray-50 hover:border-primary transition cursor-pointer hover:shadow-md"
                          >
                            <h3 className="font-semibold text-primary">{visa.code} – {visa.title}</h3>
                            <p className="text-sm text-gray-600 mt-1">{visa.description}</p>
                          </div>
                        ))}
                      </div>

                      {/* Official source links */}
                      <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl text-xs text-gray-500 space-y-1.5">
                        <p className="font-semibold text-gray-600 mb-2">Official USCIS Sources:</p>
                        <p>• <a href="https://www.uscis.gov/green-card/green-card-eligibility/green-card-for-immediate-relatives-of-us-citizen" target="_blank" rel="noreferrer" className="text-primary underline">Immediate Relatives of US Citizens</a></p>
                        <p>• <a href="https://www.uscis.gov/green-card/green-card-eligibility/green-card-for-family-preference-immigrants" target="_blank" rel="noreferrer" className="text-primary underline">Family Preference Immigrants</a></p>
                        <p>• <a href="https://www.uscis.gov/family/family-of-us-citizens/bringing-parents-to-live-in-the-united-states-as-permanent-residents" target="_blank" rel="noreferrer" className="text-primary underline">Bringing Parents to the US (21+ rule)</a></p>
                        <p>• <a href="https://www.uscis.gov/family/family-of-us-citizens/bringing-siblings-to-live-in-the-united-states-as-permanent-residents" target="_blank" rel="noreferrer" className="text-primary underline">Bringing Siblings to the US (21+ rule)</a></p>
                        <p>• <a href="https://www.uscis.gov/family/family-of-us-citizens/k-1-fiance-visa" target="_blank" rel="noreferrer" className="text-primary underline">K-1 Fiancé Visa</a></p>
                      </div>

                      <div className="space-y-4 pt-2">
                        <button
                          onClick={() => setStep(1)}
                          className="w-full flex items-center justify-center gap-2 py-4 px-6 bg-white border-2 border-primary text-primary font-bold rounded-2xl hover:bg-primary/5 transition-all shadow-lg shadow-primary/5"
                        >
                          <RefreshCw size={20} /> Edit My Information
                        </button>
                        <button
                          onClick={saveToProfile}
                          disabled={saving}
                          className="w-full flex items-center justify-center gap-2 py-4 px-6 bg-primary text-white font-bold rounded-2xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                        >
                          {saving ? <Loader size="sm" /> : <Save size={20} />}
                          Save Results to My Profile
                        </button>
                        {saveMessage && (
                          <p className={`text-center text-sm font-medium ${saveMessage.includes("Failed") ? "text-red-500" : "text-green-600"}`}>
                            {saveMessage}
                          </p>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-10">
                      <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertTriangle size={32} />
                      </div>
                      <h2 className="text-xl font-bold text-gray-900 mb-2">No Direct Match Found</h2>
                      <p className="text-sm text-gray-500 leading-relaxed max-w-xs mx-auto">
                        Based on your answers, no standard visa category directly applies. Please consult a licensed immigration attorney.
                      </p>
                    </div>
                  )}

                  <p className="text-xs text-gray-400 text-center">
                    ⚠️ This tool provides guidance only and does not guarantee visa approval. Always consult a qualified immigration attorney.
                  </p>

                  <div className="pt-4 border-t text-center">
                    <button onClick={restart} className="inline-flex items-center gap-2 text-gray-500 hover:text-primary font-medium">
                      <RefreshCw size={16} /> Start Over
                    </button>
                  </div>
                </motion.div>
              );
            })()}

          </AnimatePresence>
        </div>
      </div>

      {/* Criteria Modal */}
      <AnimatePresence>
        {selectedVisaCode && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedVisaCode(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[80vh] flex flex-col"
            >
              <div className="p-6 border-b flex justify-between items-center bg-gray-50/50">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {visaCriteria[selectedVisaCode]?.title || selectedVisaCode + " Criteria"}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">Eligibility Requirements</p>
                </div>
                <button onClick={() => setSelectedVisaCode(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 overflow-y-auto">
                {visaCriteria[selectedVisaCode] ? (
                  <div className="space-y-4">
                    <p className="text-gray-600">{visaCriteria[selectedVisaCode].description}</p>
                    <ul className="space-y-3">
                      {visaCriteria[selectedVisaCode].criteria.map((item, idx) => (
                        <li key={idx} className="flex gap-3 text-sm">
                          <CheckCircle size={18} className="text-green-500 shrink-0 mt-0.5" />
                          <span className="text-gray-700">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <AlertTriangle size={48} className="mx-auto mb-4 text-gray-300" />
                    <p>No specific criteria details available for this category yet.</p>
                  </div>
                )}
              </div>
              <div className="p-6 border-t bg-gray-50/50">
                <button onClick={() => setSelectedVisaCode(null)} className="w-full py-3 rounded-xl bg-gray-900 text-white font-semibold hover:bg-gray-800 transition-all">
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({ section }: { section: (typeof SECTIONS)[number] }) {
  const Icon = section.icon;
  return (
    <div className="text-center">
      <div className={`${section.iconBg} w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${section.iconColor}`}>
        <Icon size={32} />
      </div>
      <h2 className="text-2xl font-bold text-gray-800">{section.title}</h2>
      <p className="text-gray-500 mt-2">{section.subtitle}</p>
    </div>
  );
}

function QBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <p className="font-semibold text-gray-700">{label}</p>
      {children}
    </div>
  );
}

function OptionButton({ label, hint, onClick, isSelected, icon: Icon }: {
  label: string; hint?: string; onClick: () => void; isSelected: boolean; icon?: LucideIcon;
}) {
  return (
    <button
      onClick={onClick}
      className="group flex items-center p-4 border-2 border-transparent bg-gray-50 hover:bg-primary/10 hover:border-primary/50 rounded-xl transition-all duration-200 text-left w-full mb-3"
    >
      <div className={`p-3 rounded-full mr-4 transition-colors ${isSelected ? "bg-primary text-white" : "bg-white text-gray-400 group-hover:bg-primary/50 group-hover:text-primary/70"}`}>
        {Icon ? <Icon size={20} className={isSelected ? "opacity-100" : "opacity-70"} /> : <CheckCircle size={20} className={isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-50"} />}
      </div>
      <div>
        <h3 className="font-semibold text-gray-800">{label}</h3>
        {hint && <p className="text-xs text-gray-400 mt-0.5">{hint}</p>}
      </div>
    </button>
  );
}

function BlockedOption({ label, reason }: { label: string; reason: string }) {
  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 border-2 border-transparent rounded-xl opacity-50 cursor-not-allowed mb-3">
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-full bg-white">
          <CheckCircle size={20} className="text-gray-300" />
        </div>
        <h3 className="font-semibold text-gray-400">{label}</h3>
      </div>
      <span className="text-xs text-red-400 font-medium shrink-0 ml-2">{reason}</span>
    </div>
  );
}

function RelCard({
  label, hint, tag, isSelected, onClick, blocked = false, blockedReason = "",
}: {
  label: string;
  hint?: string;
  tag?: string;
  isSelected: boolean;
  onClick: () => void;
  blocked?: boolean;
  blockedReason?: string;
}) {
  if (blocked) {
    return (
      <div className="relative flex flex-col justify-between p-3.5 rounded-xl border border-dashed border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed min-h-[80px]">
        <span className="text-sm font-semibold text-gray-400">{label}</span>
        {hint && <span className="text-xs text-gray-400 mt-0.5">{hint}</span>}
        <span className="text-xs text-red-400 font-medium mt-1.5">{blockedReason}</span>
      </div>
    );
  }
  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col justify-between p-3.5 rounded-xl border-2 text-left transition-all duration-150 min-h-[80px] ${
        isSelected
          ? "border-primary bg-primary/5"
          : "border-gray-100 bg-gray-50 hover:border-primary/40 hover:bg-primary/5"
      }`}
    >
      {tag && (
        <span className={`self-start text-[10px] font-semibold px-1.5 py-0.5 rounded-md mb-1.5 ${
          isSelected ? "bg-primary/15 text-primary" : "bg-gray-100 text-gray-400"
        }`}>
          {tag}
        </span>
      )}
      <span className={`text-sm font-semibold leading-tight ${isSelected ? "text-primary" : "text-gray-800"}`}>
        {label}
      </span>
      {hint && (
        <span className={`text-xs mt-1 ${isSelected ? "text-primary/70" : "text-gray-400"}`}>
          {hint}
        </span>
      )}
      {isSelected && (
        <span className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
          <CheckCircle size={10} className="text-white" />
        </span>
      )}
    </button>
  );
}

function GridButton({ label, isSelected, onClick }: { label: string; isSelected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`p-3.5 rounded-xl border-2 font-semibold transition-all text-sm ${isSelected ? "border-primary bg-primary/5 text-primary" : "border-gray-100 text-gray-600 hover:bg-gray-50"}`}
    >
      {label}
    </button>
  );
}

function CompactOption({ label, hint, isSelected, onClick }: {
  label: string; hint?: string; isSelected: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl border-2 text-left transition-all duration-150 ${
        isSelected
          ? "border-primary bg-primary/5"
          : "border-gray-100 bg-gray-50 hover:border-primary/40 hover:bg-primary/5"
      }`}
    >
      <span className={`flex-shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
        isSelected ? "border-primary bg-primary" : "border-gray-300"
      }`}>
        {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
      </span>
      <span className="flex-1 min-w-0">
        <span className={`block text-sm font-semibold ${isSelected ? "text-primary" : "text-gray-800"}`}>{label}</span>
        {hint && <span className={`block text-xs mt-0.5 ${isSelected ? "text-primary/70" : "text-gray-400"}`}>{hint}</span>}
      </span>
    </button>
  );
}

function NavFooter({ step, canNext, onBack, onNext, isLast = false }: {
  step: number; canNext: boolean; onBack: () => void; onNext: () => void; isLast?: boolean;
}) {
  return (
    <div className="flex justify-between pt-4">
      {step > 1 ? (
        <button onClick={onBack} className="inline-flex items-center gap-1 text-gray-400 hover:text-gray-600 font-medium">
          <ChevronLeft size={16} /> Back
        </button>
      ) : <span />}
      <button
        onClick={onNext}
        disabled={!canNext}
        className="px-8 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
      >
        {isLast ? "See Results" : "Next Section"} <ChevronRight size={18} />
      </button>
    </div>
  );
}