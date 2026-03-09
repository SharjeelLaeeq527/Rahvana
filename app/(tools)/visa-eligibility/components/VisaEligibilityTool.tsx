"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useAuth } from "@/app/context/AuthContext";
import { MasterProfile } from "@/types/profile";
import { motion, AnimatePresence } from "framer-motion";
import { autoFillForm } from "@/lib/autoFill/mapper";
import {
  CheckCircle,
  // ChevronLeft,
  ChevronRight,
  User,
  // Users,
  Heart,
  // Calendar,
  Flag,
  Globe,
  MapPin,
  // AlertCircle,
  RefreshCw,
  AlertTriangle,
  LucideIcon,
  X,
  Save,
} from "lucide-react";
import { visaCriteria } from "../criteria-data";
import { Loader } from "@/components/ui/spinner";

type VisaSuggestion = {
  code: string;
  title: string;
  description: string;
};

type FutureAnswers = {
  // Section 1: Petitioner / Sponsor Details
  petitionerStatus?: "US_CITIZEN" | "LPR" | "NONE";
  statusOrigin?: "NATURALIZED" | "BIRTH" | "GREEN_CARD";
  petitionerAgeGroup?: "UNDER_21" | "OVER_21";

  // Section 2: Relationship
  relationship?: "SPOUSE" | "PARENT" | "CHILD" | "SIBLING" | "FIANCE" | "OTHER";
  legalStatus?: "MARRIAGE_REGISTERED" | "BIOLOGICAL" | "ADOPTIVE" | "STEP";

  // Section 3: Applicant Details
  applicantAgeGroup?: "UNDER_21" | "OVER_21";
  applicantMaritalStatus?: "SINGLE" | "MARRIED" | "DIVORCED_WIDOWED";
  applicantLocation?: "OUTSIDE_US" | "INSIDE_US";

  // Section 4: Specific Checks
  // isBiologicalParent?: "YES" | "NO"; // Removed in favor of legalStatus
  isLegallyMarried?: "YES" | "NO";
  marriageDuration?: "LESS_THAN_2" | "MORE_THAN_2";

  // Section 5: Exclusion / Future
  violationHistory?: "YES" | "NO" | "NOT_SURE";
  intent?: "PERMANENT" | "TEMPORARY";
  sponsorBase?: "FAMILY" | "EMPLOYMENT" | "INVESTMENT" | "HUMANITARIAN";
};

export function VisaEligibilityTool() {
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState<FutureAnswers>({});
  const [selectedVisaCode, setSelectedVisaCode] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  const { user } = useAuth();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      const { data } = await supabase
        .from("user_profiles")
        .select("profile_details")
        .eq("id", user.id)
        .single();

      if (data?.profile_details) {
        const profile = data.profile_details as MasterProfile;

        // Use the centralized auto-fill logic
        const dummyForm: FutureAnswers = {
          petitionerStatus: undefined,
          statusOrigin: undefined,
          petitionerAgeGroup: undefined,
          relationship: undefined,
          legalStatus: undefined,
          applicantAgeGroup: undefined,
          applicantMaritalStatus: undefined,
          applicantLocation: undefined,
          isLegallyMarried: undefined,
          marriageDuration: undefined,
          violationHistory: undefined,
          intent: undefined,
          sponsorBase: undefined,
        };

        // Initialize with null to ensure autoFillForm doesn't skip them
        const formRecord = dummyForm as unknown as Record<string, unknown>;
        Object.keys(dummyForm).forEach((k) => {
          formRecord[k] = null;
        });

        const filledAnswers = autoFillForm(
          profile,
          formRecord,
        ) as FutureAnswers;

        // Derivation logic for fields that might not be explicitly set in visaEligibility
        const newAnswers: Partial<FutureAnswers> = { ...filledAnswers };

        // 1. Petitioner Status (if not explicitly in visaEligibility)
        if (!newAnswers.petitionerStatus) {
          // Check standard citizenshipStatus
          if (profile.citizenshipStatus === "USCitizen")
            newAnswers.petitionerStatus = "US_CITIZEN";
          else if (profile.citizenshipStatus === "LPR")
            newAnswers.petitionerStatus = "LPR";
          // Fallback: Check for loose string matches in case of legacy data
          else if (
            String(profile.citizenshipStatus).toLowerCase().includes("citizen")
          )
            newAnswers.petitionerStatus = "US_CITIZEN";
          else if (
            String(profile.citizenshipStatus)
              .toLowerCase()
              .includes("permanent") ||
            String(profile.citizenshipStatus).includes("LPR")
          )
            newAnswers.petitionerStatus = "LPR";
        }

        // 2. Petitioner Age (Derive from DOB)
        if (!newAnswers.petitionerAgeGroup && profile.dateOfBirth) {
          // Handle direct age if available (legacy?) or calc from DOB
          if (profile.dateOfBirth) {
            const birthDate = new Date(profile.dateOfBirth);
            const ageDiffMs = Date.now() - birthDate.getTime();
            const ageDate = new Date(ageDiffMs);
            const age = Math.abs(ageDate.getUTCFullYear() - 1970);
            newAnswers.petitionerAgeGroup = age >= 21 ? "OVER_21" : "UNDER_21";
          }
        }

        // 3. Relationship
        if (!newAnswers.relationship) {
          // Check visaType first
          if (profile.visaType) {
            const vt = profile.visaType;
            if (["IR-1", "CR-1", "K-3", "K3", "IR1", "CR1"].includes(vt))
              newAnswers.relationship = "SPOUSE";
            else if (["IR-5", "IR5"].includes(vt))
              newAnswers.relationship = "PARENT";
            else if (["IR-2", "F1", "F2A", "F2B", "F3", "IR2"].includes(vt))
              newAnswers.relationship = "CHILD";
            else if (["F4"].includes(vt)) newAnswers.relationship = "SIBLING";
            else if (["K-1", "K1"].includes(vt))
              newAnswers.relationship = "FIANCE";
          }

          // Check explicit relationship object
          if (!newAnswers.relationship && profile.relationship?.type) {
            const rel = profile.relationship.type.toUpperCase();
            if (rel === "SPOUSE") newAnswers.relationship = "SPOUSE";
            else if (rel === "FIANCE" || rel === "FIANCEE")
              newAnswers.relationship = "FIANCE";
            else if (rel === "CHILD") newAnswers.relationship = "CHILD";
            else if (rel === "PARENT" || rel === "FATHER" || rel === "MOTHER")
              newAnswers.relationship = "PARENT";
            else if (rel === "SIBLING" || rel === "BROTHER" || rel === "SISTER")
              newAnswers.relationship = "SIBLING";
          }
        }

        // 4. Marriage Duration
        if (
          !newAnswers.marriageDuration &&
          profile.relationship?.marriageDate
        ) {
          const marriageDate = new Date(profile.relationship.marriageDate);
          const diffMs = Date.now() - marriageDate.getTime();
          const diffYears = diffMs / (1000 * 60 * 60 * 24 * 365.25);
          newAnswers.marriageDuration =
            diffYears >= 2 ? "MORE_THAN_2" : "LESS_THAN_2";
          newAnswers.isLegallyMarried = "YES";
        }

        // 5. Applicant Location
        if (!newAnswers.applicantLocation) {
          const beneficiaryCountry =
            profile.beneficiary?.countryOfResidence ||
            profile.currentAddress?.country;
          if (beneficiaryCountry) {
            const isUS =
              beneficiaryCountry.toLowerCase().includes("united states") ||
              beneficiaryCountry.toLowerCase() === "usa" ||
              beneficiaryCountry.toLowerCase() === "us";
            newAnswers.applicantLocation = isUS ? "INSIDE_US" : "OUTSIDE_US";
          }
        }

        // 6. Applicant Age
        if (!newAnswers.applicantAgeGroup) {
          const benDob = profile.beneficiary?.dateOfBirth;
          if (benDob) {
            const birthDate = new Date(benDob);
            const ageDiffMs = Date.now() - birthDate.getTime();
            const ageDate = new Date(ageDiffMs);
            const age = Math.abs(ageDate.getUTCFullYear() - 1970);
            newAnswers.applicantAgeGroup = age >= 21 ? "OVER_21" : "UNDER_21";
          }
        }

        if (Object.keys(newAnswers).length > 0) {
          setAnswers((prev) => {
            const finalAnswers = { ...prev, ...newAnswers };

            // Check if we have enough info to show results directly
            // Minimal set: petitionerStatus (or sponsorBase), intent, relationship (if family)
            const hasFamilyBasics =
              finalAnswers.petitionerStatus && finalAnswers.relationship;
            const hasEmploymentBasics =
              finalAnswers.sponsorBase &&
              ["EMPLOYMENT", "INVESTMENT", "HUMANITARIAN"].includes(
                finalAnswers.sponsorBase,
              );

            // If we have intent and either family or employment basics, likely enough for a result
            if (
              finalAnswers.intent &&
              (hasFamilyBasics || hasEmploymentBasics)
            ) {
              // We add a small delay to let state settle or just setStep(5)
              // However, doing it here might cause render issues if not careful.
              // We'll use a timeout to push to step 5.
              setTimeout(() => setStep(5), 100);
            }

            return finalAnswers;
          });
        }
      }
    };

    fetchProfile();
  }, [user, supabase]);

  const handleEdit = () => {
    setStep(1);
    // We keep the answers so the user sees them filled in
  };

  const saveToProfile = async () => {
    if (!user) return;
    try {
      setSaving(true);
      setSaveMessage("");

      // Get existing profile
      const { data: profileData } = await supabase
        .from("user_profiles")
        .select("profile_details")
        .eq("id", user.id)
        .single();

      const existingProfile =
        (profileData?.profile_details as MasterProfile) || {};

      // Update visaEligibility section
      const updatedProfile: MasterProfile = {
        ...existingProfile,
        visaEligibility: {
          ...existingProfile.visaEligibility,
          ...answers,
        },
      };

      const { error } = await supabase.from("user_profiles").upsert({
        id: user.id,
        profile_details: updatedProfile,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;
      setSaveMessage("Successfully saved to your profile!");
      setTimeout(() => setSaveMessage(""), 3000);
    } catch (err) {
      console.error("Error saving eligibility answers:", err);
      setSaveMessage("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const totalSteps = 5; // 4 Sections + 1 Result
  const progress = (step / totalSteps) * 100;

  const next = () => setStep(Math.min(step + 1, totalSteps));
  const back = () => setStep(Math.max(step - 1, 1));

  const setAnswer = <K extends keyof FutureAnswers>(
    key: K,
    value: FutureAnswers[K],
  ) => {
    setAnswers({ ...answers, [key]: value });
  };

  const fadeIn = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
    transition: { duration: 0.3 },
  };

  // Helper component for option buttons
  const OptionButton = ({
    label,
    onClick,
    isSelected,
    icon: Icon,
  }: {
    label: string;
    onClick: () => void;
    isSelected: boolean;
    icon?: LucideIcon;
  }) => (
    <button
      onClick={onClick}
      className="group flex items-center p-4 border-2 border-transparent bg-gray-50 hover:bg-primary/10 hover:border-primary/50 rounded-xl transition-all duration-200 text-left w-full mb-3"
    >
      <div
        className={`p-3 rounded-full mr-4 transition-colors ${
          isSelected
            ? "bg-primary text-white"
            : "bg-white text-gray-400 group-hover:bg-primary/50 group-hover:text-primary/70"
        }`}
      >
        {Icon ? (
          <Icon
            size={20}
            className={isSelected ? "opacity-100" : "opacity-70"}
          />
        ) : (
          <CheckCircle
            size={20}
            className={
              isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-50"
            }
          />
        )}
      </div>
      <div>
        <h3 className="font-semibold text-gray-800">{label}</h3>
      </div>
    </button>
  );

  const getVisaSuggestions = (): VisaSuggestion[] => {
    const v: VisaSuggestion[] = [];

    const {
      petitionerStatus,
      petitionerAgeGroup,
      relationship,
      isLegallyMarried,
      marriageDuration,
      applicantAgeGroup,
      applicantMaritalStatus,
      sponsorBase,
      intent,
    } = answers;

    /* =========================
     IMMEDIATE RELATIVE VISAS
     ========================= */

    // IR-1 / CR-1 (Spouse of US Citizen)
    if (
      petitionerStatus === "US_CITIZEN" &&
      relationship === "SPOUSE" &&
      isLegallyMarried === "YES"
    ) {
      if (marriageDuration === "MORE_THAN_2") {
        v.push({
          code: "IR-1",
          title: "Immediate Relative – Spouse of US Citizen",
          description:
            "For spouses of US citizens married for 2 years or more.",
        });
      } else if (marriageDuration === "LESS_THAN_2") {
        v.push({
          code: "CR-1",
          title: "Conditional Resident – Spouse of US Citizen",
          description:
            "For spouses of US citizens married for less than 2 years.",
        });
      }
    }

    // IR-5 (Parent of US Citizen)
    if (
      petitionerStatus === "US_CITIZEN" &&
      petitionerAgeGroup === "OVER_21" &&
      relationship === "PARENT" &&
      relationship === "PARENT" &&
      (answers.legalStatus === "BIOLOGICAL" ||
        answers.legalStatus === "ADOPTIVE") // ask about the step relationship // Check legalStatus instead of isBiologicalParent
    ) {
      v.push({
        code: "IR-5",
        title: "Immediate Relative – Parent of US Citizen",
        description: "For parents of US citizens who are 21 years or older.",
      });
    }

    /* =========================
     FAMILY PREFERENCE VISAS
     ========================= */

    if (petitionerStatus === "US_CITIZEN" || petitionerStatus === "LPR") {
      if (relationship === "CHILD") {
        if (
          applicantAgeGroup === "UNDER_21" &&
          applicantMaritalStatus === "SINGLE"
        ) {
          v.push({
            code: petitionerStatus === "US_CITIZEN" ? "IR-2" : "F2A",
            title: "Child of Sponsor",
            description:
              "For unmarried children under 21 of US citizens or Green Card holders.",
          });
        } else {
          v.push({
            code: petitionerStatus === "US_CITIZEN" ? "F1" : "F2B",
            title: "Adult Unmarried Child of Sponsor",
            description: "For unmarried sons and daughters aged 21 or older.",
          });
        }
      }

      if (relationship === "SIBLING" && petitionerStatus === "US_CITIZEN") {
        v.push({
          code: "F4",
          title: "Sibling of US Citizen",
          description:
            "For brothers and sisters of US citizens aged 21 or older.",
        });
      }
    }

    /* =========================
     K VISAS
     ========================= */

    if (
      petitionerStatus === "US_CITIZEN" &&
      relationship === "FIANCE" &&
      intent === "PERMANENT"
    ) {
      v.push({
        code: "K-1",
        title: "Fiancé(e) Visa",
        description:
          "For fiancé(e)s of US citizens intending to marry in the US.",
      });
    }

    /* =========================
     EMPLOYMENT VISAS
     ========================= */

    if (sponsorBase === "EMPLOYMENT") {
      v.push(
        {
          code: "EB-1",
          title: "Employment-Based First Preference",
          description:
            "For individuals with extraordinary ability or multinational executives.",
        },
        {
          code: "EB-2",
          title: "Employment-Based Second Preference",
          description:
            "For professionals with advanced degrees or exceptional ability.",
        },
        {
          code: "EB-3",
          title: "Employment-Based Third Preference",
          description: "For skilled workers, professionals, and other workers.",
        },
      );
    }

    /* =========================
     INVESTMENT
     ========================= */

    if (sponsorBase === "INVESTMENT") {
      v.push({
        code: "EB-5",
        title: "Immigrant Investor Visa",
        description:
          "For investors who invest in US businesses and create jobs.",
      });
    }

    /* =========================
     HUMANITARIAN
     ========================= */

    if (sponsorBase === "HUMANITARIAN") {
      v.push({
        code: "Humanitarian",
        title: "Humanitarian-Based Immigration",
        description:
          "Includes asylum, refugee, VAWA, and special immigrant categories.",
      });
    }

    /* =========================
     NON-IMMIGRANT
     ========================= */

    if (intent === "TEMPORARY") {
      v.push(
        {
          code: "B1/B2",
          title: "Visitor Visa",
          description: "For temporary business or tourism visits.",
        },
        {
          code: "F-1",
          title: "Student Visa",
          description: "For academic study in the United States.",
        },
        {
          code: "M-1",
          title: "Student Visa",
          description: "For vocational studies in the United States.",
        },
        {
          code: "H-1B",
          title: "Specialty Occupation Work Visa",
          description: "For professionals in specialty occupations.",
        },
      );
    }

    /* =========================
     OTHERS
     ========================= */
    if (intent === "TEMPORARY" && sponsorBase === "HUMANITARIAN") {
      v.push({
        code: "J-1",
        title: "Exchange Visitor Visa",
        description:
          "For participants in approved cultural or educational exchange programs.",
      });
    }

    if (intent === "TEMPORARY" && sponsorBase === "EMPLOYMENT") {
      v.push({
        code: "L-1",
        title: "Intra-Company Transfer Visa",
        description:
          "For employees transferring to a US branch of the same company.",
      });
    }

    if (intent === "TEMPORARY" && sponsorBase === "EMPLOYMENT") {
      v.push({
        code: "O-1",
        title: "Extraordinary Ability Visa",
        description:
          "For individuals with extraordinary ability in science, arts, education, business, or athletics.",
      });
    }

    if (intent === "TEMPORARY" && sponsorBase === "HUMANITARIAN") {
      v.push({
        code: "R-1",
        title: "Religious Worker Visa",
        description:
          "For individuals working in a religious capacity for a US religious organization.",
      });
    }

    if (intent === "TEMPORARY" && sponsorBase === "EMPLOYMENT") {
      v.push({
        code: "P",
        title: "Athlete or Artist Visa",
        description:
          "For internationally recognized athletes or entertainment groups.",
      });
    }

    if (intent === "TEMPORARY" && sponsorBase === "HUMANITARIAN") {
      v.push({
        code: "Q",
        title: "Cultural Exchange Visa",
        description:
          "For participants in international cultural exchange programs.",
      });
    }

    if (intent === "TEMPORARY" && sponsorBase === "INVESTMENT") {
      v.push({
        code: "E-1 / E-2",
        title: "Treaty Trader / Investor Visa",
        description:
          "For nationals of treaty countries engaged in substantial trade or investment with the US.",
      });
    }

    /* =========================
     DV LOTTERY
     ========================= */

    // v.push({
    //   code: "DV",
    //   title: "Diversity Visa Lottery",
    //   description: "A lottery-based immigrant visa for eligible countries.",
    // });

    return v;
  };

  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="w-full bg-white/95 rounded-3xl overflow-hidden flex flex-col h-full">
        {/* Header / Progress */}
        <div className="p-8 pb-0">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold bg-clip-text text-black">
              Immigration Questionnaire
            </h1>
            <span className="text-sm font-semibold text-gray-400">
              Section {step} of {totalSteps}
            </span>
          </div>
          <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-8 overflow-y-auto">
          <AnimatePresence mode="wait">
            {/* SECTION 1: Petitioner Details */}
            {step === 1 && (
              <motion.div key="step1" {...fadeIn} className="space-y-8">
                <div className="text-center">
                  <div className="bg-indigo-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-indigo-600">
                    <Flag size={32} />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800">
                    Petitioner Details
                  </h2>
                  <p className="text-gray-500 mt-2">
                    Tell us about your status in the U.S.
                  </p>
                </div>

                {/* Q1: Status */}
                <div className="space-y-4">
                  <p className="font-semibold text-gray-700">
                    Q. Are you currently a:
                  </p>
                  {[
                    { val: "US_CITIZEN", label: "US Citizen" },
                    {
                      val: "LPR",
                      label: "US Permanent Resident (Green Card holder)",
                    },
                    { val: "NONE", label: "None of the above" },
                  ].map((opt) => (
                    <OptionButton
                      key={opt.val}
                      label={opt.label}
                      isSelected={answers.petitionerStatus === opt.val}
                      onClick={() =>
                        setAnswer(
                          "petitionerStatus",
                          opt.val as FutureAnswers["petitionerStatus"],
                        )
                      }
                    />
                  ))}
                </div>

                {/* Q2: Status Origin (Only if not NONE) */}
                {answers.petitionerStatus &&
                  answers.petitionerStatus !== "NONE" && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="space-y-4"
                    >
                      <p className="font-semibold text-gray-700">
                        Q. How did you get your US status?
                      </p>
                      {[
                        { val: "NATURALIZED", label: "Naturalized citizen" },
                        { val: "BIRTH", label: "By birth" },
                        {
                          val: "GREEN_CARD",
                          label: "Green Card (family / employment / asylum)",
                        },
                      ].map((opt) => (
                        <OptionButton
                          key={opt.val}
                          label={opt.label}
                          isSelected={answers.statusOrigin === opt.val}
                          onClick={() =>
                            setAnswer(
                              "statusOrigin",
                              opt.val as FutureAnswers["statusOrigin"],
                            )
                          }
                        />
                      ))}
                    </motion.div>
                  )}

                {/* Q3: Age */}
                {answers.statusOrigin && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-4"
                  >
                    <p className="font-semibold text-gray-700">
                      Q. What is your current age?
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() =>
                          setAnswer("petitionerAgeGroup", "UNDER_21")
                        }
                        className={`p-4 rounded-xl border-2 font-semibold transition-all ${
                          answers.petitionerAgeGroup === "UNDER_21"
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-gray-100 text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        Under 21
                      </button>
                      <button
                        onClick={() =>
                          setAnswer("petitionerAgeGroup", "OVER_21")
                        }
                        className={`p-4 rounded-xl border-2 font-semibold transition-all ${
                          answers.petitionerAgeGroup === "OVER_21"
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-gray-100 text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        21 or older
                      </button>
                    </div>
                  </motion.div>
                )}

                <div className="flex justify-end pt-4">
                  <button
                    onClick={next}
                    disabled={
                      !answers.petitionerAgeGroup ||
                      answers.petitionerAgeGroup === "UNDER_21"
                    }
                    className="px-8 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                  >
                    Next Section <ChevronRight size={18} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* SECTION 2: Relationship */}
            {step === 2 && (
              <motion.div key="step2" {...fadeIn} className="space-y-8">
                <div className="text-center">
                  <div className="bg-purple-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-purple-600">
                    <Heart size={32} />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800">
                    Relationship
                  </h2>
                  <p className="text-gray-500 mt-2">Who are you sponsoring?</p>
                </div>

                {/* Q4 */}
                <div className="space-y-4">
                  <p className="font-semibold text-gray-700">
                    Q. What is your relationship with the person you want to
                    sponsor? (attempt if applicable)
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      "SPOUSE",
                      "PARENT",
                      "CHILD",
                      "SIBLING",
                      "FIANCE",
                      "OTHER",
                    ].map((rel) => (
                      <button
                        key={rel}
                        onClick={() =>
                          setAnswer(
                            "relationship",
                            rel as FutureAnswers["relationship"],
                          )
                        }
                        className={`p-4 rounded-xl border-2 font-semibold text-sm transition-all ${
                          answers.relationship === rel
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-gray-100 text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        {rel.charAt(0) +
                          rel.slice(1).toLowerCase().replace("_", " ")}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Q5 */}
                {["PARENT", "CHILD", "SIBLING"].includes(
                  answers.relationship || "",
                ) && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-4"
                  >
                    <p className="font-semibold text-gray-700">
                      Q. What is the nature of this relationship?
                    </p>
                    {[
                      { val: "BIOLOGICAL", label: "Biological" },
                      { val: "ADOPTIVE", label: "Adoptive" },
                      { val: "STEP", label: "Stepflow" },
                    ].map((opt) => (
                      <OptionButton
                        key={opt.val}
                        label={opt.label}
                        isSelected={answers.legalStatus === opt.val}
                        onClick={() =>
                          setAnswer(
                            "legalStatus",
                            opt.val as FutureAnswers["legalStatus"],
                          )
                        }
                      />
                    ))}
                  </motion.div>
                )}

                {answers.relationship === "SPOUSE" && (
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <p className="font-semibold text-gray-700">
                        Q. Is the applicant your legally married spouse?
                      </p>
                      <div className="flex gap-3">
                        <button
                          onClick={() => setAnswer("isLegallyMarried", "YES")}
                          className={`flex-1 p-4 rounded-xl border-2 font-semibold transition-all ${
                            answers.isLegallyMarried === "YES"
                              ? "border-primary bg-primary/5 text-primary"
                              : "border-gray-100 text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => setAnswer("isLegallyMarried", "NO")}
                          className={`flex-1 p-4 rounded-xl border-2 font-semibold transition-all ${
                            answers.isLegallyMarried === "NO"
                              ? "border-primary bg-primary/5 text-primary"
                              : "border-gray-100 text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          No
                        </button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <p className="font-semibold text-gray-700">
                        Q. How long have you been married?
                      </p>
                      <div className="space-y-2">
                        <OptionButton
                          label="Less than 2 years"
                          isSelected={
                            answers.marriageDuration === "LESS_THAN_2"
                          }
                          onClick={() =>
                            setAnswer("marriageDuration", "LESS_THAN_2")
                          }
                        />
                        <OptionButton
                          label="2 years or more"
                          isSelected={
                            answers.marriageDuration === "MORE_THAN_2"
                          }
                          onClick={() =>
                            setAnswer("marriageDuration", "MORE_THAN_2")
                          }
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-between pt-4">
                  <button
                    onClick={back}
                    className="text-gray-400 hover:text-gray-600 font-medium"
                  >
                    Back
                  </button>
                  <button
                    onClick={next}
                    disabled={
                      (!answers.legalStatus &&
                        answers.relationship === "SPOUSE" &&
                        (!answers.isLegallyMarried ||
                          !answers.marriageDuration)) ||
                      (!answers.legalStatus &&
                        (answers.relationship === "PARENT" ||
                          answers.relationship === "SIBLING" ||
                          answers.relationship === "CHILD") &&
                        !answers.legalStatus)
                    }
                    className="px-8 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                  >
                    Next Section <ChevronRight size={18} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* SECTION 3: Applicant Details */}
            {step === 3 && (
              <motion.div key="step3" {...fadeIn} className="space-y-8">
                <div className="text-center">
                  <div className="bg-pink-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-pink-600">
                    <User size={32} />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800">
                    Applicant Details
                  </h2>
                  <p className="text-gray-500 mt-2">
                    Information about the beneficiary.
                  </p>
                </div>

                {/* Q6 Age */}
                <div className="space-y-4">
                  <p className="font-semibold text-gray-700">
                    Q. What is the applicant’s age?
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setAnswer("applicantAgeGroup", "UNDER_21")}
                      className={`flex-1 p-4 rounded-xl border-2 font-semibold transition-all ${
                        answers.applicantAgeGroup === "UNDER_21"
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-gray-100 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      Under 21
                    </button>
                    <button
                      onClick={() => setAnswer("applicantAgeGroup", "OVER_21")}
                      className={`flex-1 p-4 rounded-xl border-2 font-semibold transition-all ${
                        answers.applicantAgeGroup === "OVER_21"
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-gray-100 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      21 or older
                    </button>
                  </div>
                </div>

                {/* Q7 Marital Status */}
                <div className="space-y-4">
                  <p className="font-semibold text-gray-700">
                    Q. What is the applicant’s marital status?
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    {["SINGLE", "MARRIED", "DIVORCED_WIDOWED"].map((status) => (
                      <button
                        key={status}
                        onClick={() =>
                          setAnswer(
                            "applicantMaritalStatus",
                            status as FutureAnswers["applicantMaritalStatus"],
                          )
                        }
                        className={`p-3 rounded-xl border-2 font-semibold text-sm transition-all ${
                          answers.applicantMaritalStatus === status
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-gray-100 text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        {status.charAt(0) +
                          status.slice(1).toLowerCase().replace("_", " ")}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Q8 Location */}
                <div className="space-y-4">
                  <p className="font-semibold text-gray-700">
                    Q. Where is the applicant currently located?
                  </p>
                  <div className="space-y-2">
                    <OptionButton
                      label="Outside the US"
                      isSelected={answers.applicantLocation === "OUTSIDE_US"}
                      onClick={() =>
                        setAnswer("applicantLocation", "OUTSIDE_US")
                      }
                      icon={Globe}
                    />
                    <OptionButton
                      label="Inside the US"
                      isSelected={answers.applicantLocation === "INSIDE_US"}
                      onClick={() =>
                        setAnswer("applicantLocation", "INSIDE_US")
                      }
                      icon={MapPin}
                    />
                  </div>
                </div>

                <div className="flex justify-between pt-4">
                  <button
                    onClick={back}
                    className="text-gray-400 hover:text-gray-600 font-medium"
                  >
                    Back
                  </button>
                  <button
                    onClick={next}
                    disabled={!answers.applicantLocation} // Last Q answered
                    className="px-8 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                  >
                    Next Section <ChevronRight size={18} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* SECTION 4: Exclusion/Future */}
            {step === 4 && (
              <motion.div key="step4" {...fadeIn} className="space-y-8">
                <div className="text-center">
                  <div className="bg-red-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-red-600">
                    <AlertTriangle size={32} />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800">
                    Additional Information
                  </h2>
                  <p className="text-gray-500 mt-2">Final details.</p>
                </div>

                {/* Q12 Violation */}
                <div className="space-y-4">
                  <p className="font-semibold text-gray-700">
                    Q. Has the applicant ever violated US immigration laws?
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    {["YES", "NO", "NOT_SURE"].map((opt) => (
                      <button
                        key={opt}
                        onClick={() =>
                          setAnswer(
                            "violationHistory",
                            opt as FutureAnswers["violationHistory"],
                          )
                        }
                        className={`p-3 rounded-xl border-2 font-semibold text-sm transition-all ${
                          answers.violationHistory === opt
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-gray-100 text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        {opt.replace("_", " ")}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Q13 Intent */}
                <div className="space-y-4">
                  <p className="font-semibold text-gray-700">
                    Q. Is the applicant seeking permanent residence or temporary
                    stay?
                  </p>
                  <div className="space-y-2">
                    <OptionButton
                      label="Permanent (Green Card)"
                      isSelected={answers.intent === "PERMANENT"}
                      onClick={() => setAnswer("intent", "PERMANENT")}
                    />
                    <OptionButton
                      label="Temporary (Visit / Study / Work)"
                      isSelected={answers.intent === "TEMPORARY"}
                      onClick={() => setAnswer("intent", "TEMPORARY")}
                    />
                  </div>
                </div>

                {/* Q14 Sponsor Base */}
                <div className="space-y-4">
                  <p className="font-semibold text-gray-700">
                    Q. Are you planning to sponsor based on:
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {["FAMILY", "EMPLOYMENT", "INVESTMENT", "HUMANITARIAN"].map(
                      (opt) => (
                        <button
                          key={opt}
                          onClick={() =>
                            setAnswer(
                              "sponsorBase",
                              opt as FutureAnswers["sponsorBase"],
                            )
                          }
                          className={`p-3 rounded-xl border-2 font-semibold text-sm transition-all ${
                            answers.sponsorBase === opt
                              ? "border-primary bg-primary/5 text-primary"
                              : "border-gray-100 text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          {opt.charAt(0) + opt.slice(1).toLowerCase()}
                        </button>
                      ),
                    )}
                  </div>
                </div>

                <div className="flex justify-between pt-4">
                  <button
                    onClick={back}
                    className="text-gray-400 hover:text-gray-600 font-medium"
                  >
                    Back
                  </button>
                  <button
                    onClick={next}
                    // disabled={!answers.sponsorBase}
                    className="px-8 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                  >
                    Finish <ChevronRight size={18} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 5: RESULT */}
            {step === 5 && (
              <motion.div key="step5" {...fadeIn} className="space-y-8">
                <div className="text-center">
                  <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle size={40} />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {getVisaSuggestions().length > 0
                      ? "Visa Categories You May Be Eligible For"
                      : "You are not eligible for any visa category"}
                  </h2>
                  <p className="text-gray-500 mt-2">
                    Based on the information you provided
                  </p>
                </div>

                <div className="space-y-4">
                  {getVisaSuggestions().map((visa) => (
                    <div
                      key={visa.code}
                      onClick={() => setSelectedVisaCode(visa.code)}
                      className="p-5 border rounded-xl bg-gray-50 hover:border-primary transition cursor-pointer hover:shadow-md"
                    >
                      <h3 className="font-semibold text-primary">
                        {visa.code} – {visa.title}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {visa.description}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="space-y-4 pt-4">
                  <button
                    onClick={handleEdit}
                    className="w-full flex items-center justify-center gap-2 py-4 px-6 bg-white border-2 border-primary text-primary font-bold rounded-2xl hover:bg-primary/5 transition-all shadow-lg shadow-primary/5"
                  >
                    <RefreshCw size={20} />
                    Edit My Information
                  </button>

                  <button
                    onClick={saveToProfile}
                    disabled={saving}
                    className="w-full flex items-center justify-center gap-2 py-4 px-6 bg-primary text-white font-bold rounded-2xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                  >
                    {saving ? (
                      <Loader size="sm" />
                    ) : (
                      <Save size={20} />
                    )}
                    Save Results to My Profile
                  </button>
                  {saveMessage && (
                    <p
                      className={`text-center text-sm font-medium ${saveMessage.includes("Failed") ? "text-red-500" : "text-green-600"}`}
                    >
                      {saveMessage}
                    </p>
                  )}
                </div>

                <p className="text-xs text-gray-400 text-center">
                  ⚠️ This tool provides guidance only and does not guarantee
                  visa approval.
                </p>

                <div className="pt-4 border-t text-center">
                  <button
                    onClick={() => {
                      setStep(1);
                      setAnswers({});
                    }}
                    className="inline-flex items-center gap-2 text-gray-500 hover:text-primary font-medium"
                  >
                    <RefreshCw size={16} /> Start Over
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Criteria Modal */}
      <AnimatePresence>
        {selectedVisaCode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedVisaCode(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[80vh] flex flex-col"
            >
              <div className="p-6 border-b flex justify-between items-center bg-gray-50/50">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {visaCriteria[selectedVisaCode]?.title ||
                      selectedVisaCode + " Criteria"}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Eligibility Requirements
                  </p>
                </div>
                <button
                  onClick={() => setSelectedVisaCode(null)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto">
                {visaCriteria[selectedVisaCode] ? (
                  <div className="space-y-4">
                    <p className="text-gray-600">
                      {visaCriteria[selectedVisaCode].description}
                    </p>
                    <ul className="space-y-3">
                      {visaCriteria[selectedVisaCode].criteria.map(
                        (item, idx) => (
                          <li key={idx} className="flex gap-3 text-sm">
                            <CheckCircle
                              size={18}
                              className="text-green-500 shrink-0 mt-0.5"
                            />
                            <span className="text-gray-700">{item}</span>
                          </li>
                        ),
                      )}
                    </ul>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <AlertTriangle
                      size={48}
                      className="mx-auto mb-4 text-gray-300"
                    />
                    <p>
                      No specific criteria details available for this visa
                      category yet.
                    </p>
                  </div>
                )}
              </div>

              <div className="p-6 border-t bg-gray-50/50">
                <button
                  onClick={() => setSelectedVisaCode(null)}
                  className="w-full py-3 rounded-xl bg-gray-900 text-white font-semibold hover:bg-gray-800 transition-all"
                >
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
