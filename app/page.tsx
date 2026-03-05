"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import * as Icons from "lucide-react";
import { useRouter } from "next/navigation";
import { Wizard } from "./components/home-page/Wizard";
import { Dashboard } from "./components/home-page/Dashboard";
import {
  VisaCategorySection,
  ToolsSection,
  PricingSection,
  IR1JourneyDetail,
} from "./components/home-page/StaticSections";
import { useWizard } from "./(main)/dashboard/hooks/useWizard";
import Image from "next/image";
import { StackedCarousel } from "./components/StackedCarousel";
import Link from "next/link";
import HydrationSafeButton from "@/app/components/HydrationSafeButton";
import { ComingSoonModal } from "./components/shared/ComingSoonModal";
import { useAuth } from "./context/AuthContext";
import { createClient } from "@/lib/supabase/client";
import GetInTouch from "./components/Contact/GetInTouch";
import { AuthRequiredModal } from "./components/shared/AuthRequiredModal";
import { MfaPromptModal } from "./components/shared/MFAPromptModal";
import { NAV_DATA } from "@/app/components/layout/navigationData";
import { useLanguage } from "@/app/context/LanguageContext";

const renderWithAbbr = (text: string) => {
  if (!text || typeof text !== "string" || !text.includes("PCC")) return text;
  const parts = text.split("PCC");
  return parts.reduce((acc, part, i) => {
    if (i === 0) return [part];
    return [
      ...acc,
      <abbr
        key={i}
        title="Police Clearance Certificate"
        className="cursor-help decoration-slate-400"
      >
        PCC
      </abbr>,
      part,
    ];
  }, [] as React.ReactNode[]);
};

const ALL_SERVICES = NAV_DATA.services.tabs.flatMap((tab) =>
  tab.items ? tab.items.map((item) => ({ ...item, category: tab.label })) : [],
);

const JOURNEYS = [
  // Family & Protection
  {
    category: "Family & Protection",
    code: "IR-1/CR-1",
    title: "Spouse of U.S. Citizen",
    desc: "Bring your spouse to the United States through the immediate relative visa process.",
    icon: Icons.Heart,
    live: true,
  },
  {
    category: "Family & Protection",
    code: "K-1",
    title: "Fiancé(e) Visa",
    desc: "Bring your fiancé(e) to the U.S. to marry within 90 days of arrival.",
    icon: Icons.Briefcase,
    live: false,
  },
  {
    category: "Family & Protection",
    code: "K-3",
    title: "Spouse (short-separation option)",
    desc: "Spouse (short-separation option)",
    icon: Icons.Globe,
    live: false,
  },
  {
    category: "Family & Protection",
    code: "IR-5",
    title: "Parent of U.S. Citizen",
    desc: "Petition for your parent as an immediate relative of a U.S. citizen.",
    icon: Icons.Globe,
    live: false,
  },
  {
    category: "Family & Protection",
    code: "IR-2 / CR-2",
    title: "Child of U.S. Citizen",
    desc: "Child of U.S. Citizen",
    icon: Icons.Globe,
    live: false,
  },
  {
    category: "Family & Protection",
    code: "IR-3 / IR-4",
    title: "Intercountry Adoption",
    desc: "Intercountry Adoption",
    icon: Icons.Globe,
    live: false,
  },
  // Family Preferences
  {
    category: "Family & Protection",
    code: "F-1",
    title: "Adult Child (Unmarried) of U.S. Citizen",
    desc: "Adult Child (Unmarried) of U.S. Citizen",
    icon: Icons.Globe,
    live: false,
  },
  {
    category: "Family & Protection",
    code: "F-2A",
    title: "Spouse/Child of Green Card Holder",
    desc: "Spouse/Child of Green Card Holder",
    icon: Icons.Globe,
    live: false,
  },
  {
    category: "Family & Protection",
    code: "F-2B",
    title: "Adult Child (Unmarried) of Green Card Holder",
    desc: "Adult Child (Unmarried) of Green Card Holder",
    icon: Icons.Globe,
    live: false,
  },
  {
    category: "Family & Protection",
    code: "F-3",
    title: "Adult Child (Married) of U.S. Citizen",
    desc: "Adult Child (Married) of U.S. Citizen",
    icon: Icons.Globe,
    live: false,
  },
  {
    category: "Family & Protection",
    code: "F-4",
    title: "Sibling of U.S. Citizen",
    desc: "Sibling of U.S. Citizen",
    icon: Icons.Globe,
    live: false,
  },
  // Humanitarian
  {
    category: "Family & Protection",
    code: "Refugee",
    title: "Refugee (USRAP)",
    desc: "Refugee (USRAP)",
    icon: Icons.ShieldCheck,
    live: false,
  },
  {
    category: "Family & Protection",
    code: "Asylum",
    title: "Asylum (typically filed in U.S.)",
    desc: "Asylum (typically filed in U.S.)",
    icon: Icons.ShieldCheck,
    live: false,
  },
  {
    category: "Family & Protection",
    code: "Parole",
    title: "Humanitarian Parole (case-by-case)",
    desc: "Humanitarian Parole (case-by-case)",
    icon: Icons.ShieldCheck,
    live: false,
  },

  // Work & Business - Pro Work
  {
    category: "Work & Business",
    code: "H-1B",
    title: "Specialty Occupation",
    desc: "Work in the U.S. in a specialty occupation requiring a bachelor's degree.",
    icon: Icons.Globe,
    live: false,
  },
  {
    category: "Work & Business",
    code: "L-1A / L-1B",
    title: "Company Transfer (Manager / Specialist)",
    desc: "Company Transfer (Manager / Specialist)",
    icon: Icons.Globe,
    live: false,
  },
  // Talent
  {
    category: "Work & Business",
    code: "O-1A / O-1B",
    title: "Extraordinary Talent (Science / Business / Arts)",
    desc: "Extraordinary Talent (Science / Business / Arts)",
    icon: Icons.Globe,
    live: false,
  },
  {
    category: "Work & Business",
    code: "O-2",
    title: "Support Staff for O-1",
    desc: "Support Staff for O-1",
    icon: Icons.Globe,
    live: false,
  },
  // Sports/Arts
  {
    category: "Work & Business",
    code: "P-1 / P-2 / P-3",
    title: "Athlete / Entertainer / Tour Group",
    desc: "Athlete / Entertainer / Tour Group",
    icon: Icons.Activity,
    live: false,
  },
  // Trade / Investment
  {
    category: "Work & Business",
    code: "E-1",
    title: "Treaty Trader",
    desc: "Treaty Trader",
    icon: Icons.Building2,
    live: false,
  },
  {
    category: "Work & Business",
    code: "E-2",
    title: "Treaty Investor",
    desc: "Treaty Investor",
    icon: Icons.Globe,
    live: false,
  },
  // Culture / Faith
  {
    category: "Work & Business",
    code: "R-1",
    title: "Religious Worker",
    desc: "Religious Worker",
    icon: Icons.Heart,
    live: false,
  },
  {
    category: "Work & Business",
    code: "Q-1",
    title: "Cultural Exchange (Work + Culture)",
    desc: "Cultural Exchange (Work + Culture)",
    icon: Icons.Globe,
    live: false,
  },
  // Media
  {
    category: "Work & Business",
    code: "I",
    title: "Journalist / Media",
    desc: "Journalist / Media",
    icon: Icons.Globe,
    live: false,
  },
  // Seasonal
  {
    category: "Work & Business",
    code: "H-2A",
    title: "Seasonal Agriculture (eligibility list applies)",
    desc: "Seasonal Agriculture (eligibility list applies)",
    icon: Icons.Globe,
    live: false,
  },
  {
    category: "Work & Business",
    code: "H-2B",
    title: "Seasonal Non-Agriculture (eligibility list applies)",
    desc: "Seasonal Non-Agriculture (eligibility list applies)",
    icon: Icons.Globe,
    live: false,
  },
  // Training
  {
    category: "Work & Business",
    code: "H-3",
    title: "Trainee / Special Education Exchange",
    desc: "Trainee / Special Education Exchange",
    icon: Icons.Globe,
    live: false,
  },

  // Work Green Cards
  // High Impact
  {
    category: "Work Green Cards",
    code: "EB-1",
    title: "Priority Workers",
    desc: "For persons of extraordinary ability, outstanding researchers, and multinational executives.",
    icon: Icons.Star,
    live: false,
  },
  // Advanced
  {
    category: "Work Green Cards",
    code: "EB-2",
    title: "Advanced Degree / Exceptional Ability",
    desc: "Advanced Degree / Exceptional Ability",
    icon: Icons.Cpu,
    live: false,
  },
  {
    category: "Work Green Cards",
    code: "EB-2 (NIW Path)",
    title: "National Interest Waiver",
    desc: "Self-petition without employer sponsorship based on national interest.",
    icon: Icons.Briefcase,
    live: false,
  },
  // Career
  {
    category: "Work Green Cards",
    code: "EB-3",
    title: "Skilled Worker / Professional",
    desc: "Skilled Worker / Professional",
    icon: Icons.Users,
    live: false,
  },
  // Special
  {
    category: "Work Green Cards",
    code: "EB-4",
    title: "Special Immigrants (varies)",
    desc: "Special Immigrants (varies)",
    icon: Icons.Users,
    live: false,
  },
  // Investment
  {
    category: "Work Green Cards",
    code: "EB-5",
    title: "Investor Green Card",
    desc: "Investor Green Card",
    icon: Icons.Users,
    live: false,
  },
  // Lottery
  {
    category: "Work Green Cards",
    code: "DV",
    title: "Diversity Visa (DV Lottery)",
    desc: "Diversity Visa (DV Lottery)",
    icon: Icons.Users,
    live: false,
  },

  // Students & Visitors
  // Visit
  {
    category: "Students & Visitors",
    code: "B-2",
    title: "Tourism / Family Visit",
    desc: "Tourism / Family Visit",
    icon: Icons.Camera,
    live: false,
  },
  {
    category: "Students & Visitors",
    code: "B-1",
    title: "Business Visitor",
    desc: "Business Visitor",
    icon: Icons.Camera,
    live: false,
  },
  // Study
  {
    category: "Students & Visitors",
    code: "F-1",
    title: "Student Visa",
    desc: "Study at a U.S. academic institution or English language program.",
    icon: Icons.Camera,
    live: false,
  },
  {
    category: "Students & Visitors",
    code: "F-2",
    title: "Student Dependent",
    desc: "Student Dependent",
    icon: Icons.Camera,
    live: false,
  },
  {
    category: "Students & Visitors",
    code: "M-1",
    title: "Vocational / Technical Student",
    desc: "Vocational / Technical Student",
    icon: Icons.Camera,
    live: false,
  },
  {
    category: "Students & Visitors",
    code: "M-2",
    title: "Vocational Dependent",
    desc: "Vocational Dependent",
    icon: Icons.Camera,
    live: false,
  },
  // Exchange
  {
    category: "Students & Visitors",
    code: "J-1",
    title: "Exchange Visitor (Programs)",
    desc: "Exchange Visitor (Programs)",
    icon: Icons.Camera,
    live: false,
  },
  {
    category: "Students & Visitors",
    code: "J-2",
    title: "Exchange Dependent",
    desc: "Exchange Dependent",
    icon: Icons.Camera,
    live: false,
  },
];

const LIFECYCLE_STEPS = [
  {
    step: 1,
    title: "Create Profile & Start Case",
    icon: Icons.UserPlus,
    desc: "User creates an account, adds basic case details, and opens a dedicated immigration workspace to begin the journey.",
    items: [
      "Sign up and verify account",
      "Add applicant and spouse basics",
      "Set country and embassy context",
      "Open personal immigration workspace",
    ],
  },
  {
    step: 2,
    title: "Select the Correct Journey",
    icon: Icons.Route,
    desc: "User selects the visa pathway and enters a guided roadmap tailored to the selected category.",
    items: [
      "Review available journey options",
      "Choose a visa category",
      "Enter guided roadmap flow",
      "Align process with case goals",
    ],
  },
  {
    step: 3,
    title: "Start the Live IR-1/CR-1 Track",
    icon: Icons.HeartHandshake,
    desc: "Current primary live journey supports IR-1 / CR-1 (Spouse of U.S. Citizen) with structured stage-by-stage execution.",
    items: [
      "Confirm IR-1 / CR-1 eligibility path",
      "View stage-based workflow",
      "Understand immediate priorities",
      "Follow live journey checkpoints",
    ],
  },
  {
    step: 4,
    title: "Use Productivity Tools",
    icon: Icons.Wrench,
    desc: "Users complete tasks faster with built-in tools that support planning, form completion, interview prep, and document formatting.",
    items: [
      "Run case strength checker",
      "Use visa bulletin checker",
      "Prepare with interview prep module",
      "Use PDF/photo/signature tools and form autofill",
    ],
  },
  {
    step: 5,
    title: "Organize Documents Centrally",
    icon: Icons.FolderKanban,
    desc: "Document Vault stores files, notes, and checklist progress in one place to keep the case embassy/NVC ready.",
    items: [
      "Upload and categorize documents",
      "Track checklist completion",
      "Maintain case notes and history",
      "Stay prepared for NVC and embassy review",
    ],
  },
  {
    step: 6,
    title: "Get Expert Support",
    icon: Icons.UserRoundCog,
    desc: "Users can book consultations and request support services such as appointment booking and translation before final submission/interview.",
    items: [
      "Book expert consultation sessions",
      "Request appointment booking help",
      "Use translation and support services",
      "Reduce risk before final interview/submission",
    ],
  },
];

const FAQS = [
  {
    q: "How does Rahvana help simplify my visa journey?",
    a: "Rahvana acts as your personal digital guide, breaking down the complex U.S. immigration process into clear, manageable steps. We combine expert-level roadmaps (specific to your location) with AI-powered tools to automate paperwork, track timelines, and prepare you for your interview, reducing the stress and uncertainty of doing it alone.",
  },
  {
    q: "Is the Roadmap tailored for the Islamabad Embassy?",
    a: "Yes! Rahvana includes specific guidance for Pakistan, including NADRA document requirements, Union Council registrations, local police certificate procedures, and IOM medical exam details specific to Islamabad, Karachi, and Lahore.",
  },
  {
    q: "Can Rahvana really auto-fill my USCIS forms?",
    a: "Absolutely. Our AI 'Brain' takes your profile data and maps it directly onto official USCIS PDFs like the I-130 and Form I-864, generating a perfectly filled, compliant form in seconds, ready for your review and submission.",
  },
  {
    q: "Does Rahvana provide legal representation?",
    a: "No, Rahvana is an educational AI assistant designed to simplify your journey. While we provide expert-level guidance and tools, we are not a law firm. We always recommend consulting a licensed attorney for complex legal cases.",
  },
  {
    q: "How accurate is the Interview Prep Question Bank?",
    a: "Our bank contains 50+ real-world questions reported from the Islamabad Embassy, with suggested answers and tips on how to present your case honestly and effectively based on successful approval historical data.",
  },
  {
    q: "Is my document data secure in the Vault?",
    a: "Yes. We use bank-level encryption (AES-256) to secure your files. For Free users, progress is stored locally in your browser. Plus users benefit from secure, encrypted cloud synchronization across all devices.",
  },
];

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen">
          Loading...
        </div>
      }
    >
      <HomePageContent />
    </Suspense>
  );
}

function HomePageContent() {
  const [activeSection, setActiveSection] = useState("home");
  const searchParams = useSearchParams();

  const { user } = useAuth();
  const router = useRouter();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showMfaPrompt, setShowMfaPrompt] = useState(false);

  // Listen for section changes in URL
  useEffect(() => {
    const section = searchParams.get("section");
    if (section) {
      setActiveSection(section);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      // Default to "home" if no section param
      setActiveSection("home");
      // Handle hash navigation (e.g. #contact)
      if (typeof window !== "undefined" && window.location.hash) {
        const id = window.location.hash.substring(1);
        setTimeout(() => {
          const element = document.getElementById(id);
          if (element) {
            element.scrollIntoView({ behavior: "smooth" });
          }
        }, 100);
      } else {
        // If no hash and no section, scroll to top
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  }, [searchParams]);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [journeyTab, setJourneyTab] = useState("Family & Protection");
  const [activeStep, setActiveStep] = useState(1);
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  const [activeService, setActiveService] = useState(0);

  // Lifted wizard state to share with Dashboard
  const { state, actions, isLoaded } = useWizard();
  const { t } = useLanguage();

  const handleNavigate = (section: string) => {
    if (section === "contact") {
      setActiveSection("home");
      setTimeout(() => {
        document
          .getElementById("contact")
          ?.scrollIntoView({ behavior: "smooth" });
      }, 100);
      return;
    }
    setActiveSection(section);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleToggleAuth = () => {
    setIsSignedIn(!isSignedIn);
  };

  const handleStartJourney = () => {
    if (!isSignedIn) {
      handleToggleAuth();
    }
    setActiveSection("ir1-journey");
  };

  useEffect(() => {
    if (!user) return;

    const fetchProfile = async (userId: string) => {
      const supabaseClient = createClient();
      const { data, error } = await supabaseClient
        .from("profiles")
        .select("mfa_enabled, mfa_prompt_dismissed_at")
        .eq("id", userId)
        .maybeSingle();

      if (error || !data) return;

      if (
        !data.mfa_enabled &&
        (!data.mfa_prompt_dismissed_at ||
          daysSince(data.mfa_prompt_dismissed_at) >= 7)
      ) {
        setShowMfaPrompt(true);
      }
    };

    fetchProfile(user.id);
  }, [user]);

  const daysSince = (date: string) => {
    const diffTime = new Date().getTime() - new Date(date).getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const handleEnableMfa = () => {
    window.location.href = "/mfa-setup";
  };

  const handleRemindLater = async () => {
    if (!user) return;

    const supabaseClient = createClient();
    await supabaseClient
      .from("profiles")
      .update({
        mfa_prompt_dismissed_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    setShowMfaPrompt(false);
  };

  const handleConsultationClick = () => {
    if (user) {
      router.push("/book-consultation");
    } else {
      setShowAuthModal(true);
    }
  };
  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <main className="min-h-[calc(100vh-200px)]">
        {activeSection === "home" && (
          <div className="flex flex-col">
            {/* HERO SECTION */}
            <section className="relative py-8 md:py-12 overflow-hidden bg-background">
              <div className="container mx-auto px-6">
                <div className="flex flex-col lg:flex-row items-center gap-16">
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    viewport={{ once: true }}
                    className="w-full lg:w-1/2 max-w-2xl"
                  >
                    <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 text-sm font-medium rounded-full bg-rahvana-primary-pale text-rahvana-primary">
                      <Icons.ShieldCheck className="w-4 h-4" />
                      {t("homePage.trustedBy")}
                    </div>
                    <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold leading-tight text-foreground mb-6">
                      {t("homePage.heroTitle1")}
                      <br />
                      <span className="bg-linear-to-r from-rahvana-primary to-rahvana-primary-light bg-clip-text text-fill-transparent">
                        {t("homePage.heroTitle2")}
                      </span>
                    </h1>
                    <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                      {t("homePage.heroDescription")}
                    </p>
                    <div className="flex flex-wrap gap-4 mb-10">
                      {user && (
                        <Link href={"/my-journeys"}>
                          <HydrationSafeButton
                            onClick={() => {}}
                            className="inline-flex items-center gap-2 px-8 py-4 text-base font-semibold text-white rounded-lg bg-linear-to-r from-rahvana-primary to-rahvana-primary-light shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
                          >
                            {t("homePage.resumeJourney")}
                            <Icons.ArrowRight className="w-5 h-5" />
                          </HydrationSafeButton>
                        </Link>
                      )}
                      <Link href={"/visa-category/ir-category"}>
                        <HydrationSafeButton
                          onClick={() => {}}
                          className={
                            user
                              ? "inline-flex items-center px-8 py-4 text-base font-semibold text-rahvana-primary rounded-lg border border-border bg-background hover:bg-rahvana-primary-pale hover:border-rahvana-primary transition-all"
                              : "inline-flex items-center px-8 py-4 text-base font-semibold text-white rounded-lg bg-linear-to-r from-rahvana-primary to-rahvana-primary-light shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
                          }
                        >
                          {t("homePage.exploreJourneys")}
                        </HydrationSafeButton>
                      </Link>
                    </div>
                    <div className="flex flex-wrap gap-8">
                      {[
                        { icon: Icons.Lock, text: "Secure Vault" },
                        { icon: Icons.Cpu, text: "AI Insights" },
                        {
                          icon: Icons.CheckCircle,
                          text: "Step-by-Step Guidance",
                        },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-rahvana-primary-pale text-rahvana-primary">
                            <item.icon className="w-5 h-5" />
                          </div>
                          <span className="text-sm font-medium text-muted-foreground">
                            {item.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                    viewport={{ once: true }}
                    className="w-full lg:w-1/2 relative"
                  >
                    <div className="absolute -top-12 -right-12 w-64 h-64 rounded-full bg-rahvana-primary-pale/50 -z-10 blur-3xl"></div>
                    <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-rahvana-primary-pale/50 -z-10 blur-3xl"></div>
                    <div className="relative rounded-3xl overflow-hidden shadow-2xl border-8 border-white">
                      <Image
                        src="/assets/images/hero-journey.jpg"
                        alt="Family reunion"
                        className="w-full h-auto aspect-4/3 object-cover"
                        height={600}
                        width={600}
                      />
                      <div className="absolute inset-0 bg-linear-to-tr from-rahvana-primary/10 to-transparent pointer-events-none"></div>
                    </div>
                  </motion.div>
                </div>
              </div>
            </section>

            {/* JOURNEYS SECTION */}
            <section
              className="relative py-12 md:py-24 bg-muted/30 overflow-hidden"
              id="journeys"
            >
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
                <svg width="100%" height="100%">
                  <pattern
                    id="grid"
                    width="40"
                    height="40"
                    patternUnits="userSpaceOnUse"
                  >
                    <path
                      d="M 40 0 L 0 0 0 40"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1"
                    />
                  </pattern>
                  <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>
              </div>
              <div className="container mx-auto px-6 relative z-10">
                <div className="text-center max-w-3xl mx-auto mb-16">
                  <motion.span
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rahvana-primary-pale text-rahvana-primary text-sm font-semibold mb-4"
                  >
                    <Icons.Compass className="w-4 h-4" />
                    Find Your Path
                  </motion.span>
                  <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    viewport={{ once: true }}
                    className="text-3xl md:text-5xl font-bold text-foreground mb-4"
                  >
                    Explore Immigration Journeys
                  </motion.h2>
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    viewport={{ once: true }}
                    className="text-lg text-muted-foreground"
                  >
                    Select your visa category to access personalized guidance,
                    document checklists, and timeline tracking.
                  </motion.p>
                </div>

                <div className="flex justify-center gap-3 mb-12 flex-wrap">
                  {[
                    "Family & Protection",
                    "Work & Business",
                    "Work Green Cards",
                    "Students & Visitors",
                  ].map((tab) => (
                    <HydrationSafeButton
                      key={tab}
                      onClick={() => setJourneyTab(tab)}
                      className={`px-6 py-3 rounded-full text-sm font-semibold transition-all border ${
                        journeyTab === tab
                          ? "bg-rahvana-primary border-rahvana-primary text-white shadow-md"
                          : "bg-background border-border text-muted-foreground hover:border-rahvana-primary hover:text-rahvana-primary"
                      }`}
                    >
                      {tab.charAt(0).toUpperCase() +
                        tab.slice(1).replace("-", " ")}
                    </HydrationSafeButton>
                  ))}
                </div>

                <div className="relative group min-h-125 flex items-center justify-center">
                  <StackedCarousel
                    items={JOURNEYS.filter((j) => j.category === journeyTab)}
                    onNavigate={handleNavigate}
                    onNotify={() => setShowComingSoon(true)}
                  />
                </div>
              </div>
            </section>

            {/* QUICK TOOLS SECTION */}
            <section
              className="relative py-12 md:py-24 bg-background"
              id="tools"
            >
              <div className="container mx-auto px-6">
                <div className="text-center max-w-3xl mx-auto mb-16">
                  <motion.span
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rahvana-primary-pale text-rahvana-primary text-sm font-semibold mb-4"
                  >
                    <Icons.Wrench className="w-4 h-4" />
                    Power Tools
                  </motion.span>
                  <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
                    Quick Tools at Your Fingertips
                  </h2>
                  <p className="text-lg text-muted-foreground">
                    Powerful tools designed to streamline your immigration
                    process and keep you informed.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[
                    {
                      icon: <Icons.Brain className="w-7 h-7 " />,
                      title: "Case Strength Analyzer",
                      desc: "Get AI-powered insights into your case status, processing times, and what to expect next.",
                      url: "/visa-case-strength-checker",
                    },
                    {
                      icon: <Icons.LifeBuoy className="w-7 h-7 " />,
                      title: "221(g) Action Planner",
                      desc: "Navigate administrative processing with step-by-step guidance and status tracking.",
                      url: "/221g-action-planner",
                    },
                    {
                      icon: <Icons.Compass className="w-7 h-7" />,
                      title: "VisaPath Finder",
                      desc: "Answer a few questions and discover the best visa options for your unique situation.",
                      url: "/visa-eligibility",
                    },
                    {
                      icon: <Icons.Calculator className="w-7 h-7" />,
                      title: "Sponsorship Calculator",
                      desc: "Calculate financial requirements and determine if you meet the sponsorship threshold.",
                      url: "/affidavit-support-calculator",
                    },
                    {
                      icon: <Icons.Files className="w-7 h-7 " />,
                      title: "PDF ToolKit",
                      desc: "Merge, split, and organize your immigration documents with ease.",
                      url: "/pdf-processing",
                    },
                    {
                      icon: <Icons.Wand2 className="w-7 h-7" />,
                      title: "Smart Form Filler",
                      desc: "Auto-complete immigration forms with your saved profile data.",
                      url: "/visa-forms",
                    },
                  ].map((tool, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      viewport={{ once: true }}
                      onClick={() => router.push(tool.url)}
                      className="group relative bg-muted/30 rounded-2xl p-8 border border-border transition-all hover:border-rahvana-primary/30 hover:shadow-xl cursor-pointer overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-linear-to-tr from-rahvana-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <div className="w-14 h-14 rounded-xl bg-linear-to-br from-rahvana-primary to-rahvana-primary-light flex items-center justify-center text-white mb-6 transform group-hover:scale-110 transition-transform [&>svg]:text-white!">
                        {tool.icon}
                      </div>
                      <h3 className="text-xl font-bold text-foreground mb-2">
                        {tool.title}
                      </h3>
                      <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                        {tool.desc}
                      </p>
                      <div className="flex items-center gap-2 text-sm font-bold text-rahvana-primary group-hover:gap-3 transition-all">
                        Try it out <Icons.ArrowRight className="w-4 h-4" />
                      </div>
                    </motion.div>
                  ))}
                </div>
                <div className="mt-12 text-center">
                  <HydrationSafeButton
                    onClick={() => router.push("/tools")}
                    className="inline-flex items-center gap-2 px-8 py-3 text-base font-bold text-rahvana-primary border-2 border-rahvana-primary rounded-full hover:bg-rahvana-primary hover:text-white transition-all cursor-pointer"
                  >
                    Explore all tools <Icons.ArrowRight className="w-5 h-5" />
                  </HydrationSafeButton>
                </div>
              </div>
            </section>

            {/* SERVICES SECTION */}
            <section
              className="relative py-12 md:py-24 bg-muted/10 overflow-hidden"
              id="services"
            >
              <div className="container mx-auto px-6">
                <div className="text-center max-w-3xl mx-auto mb-16">
                  <motion.span
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rahvana-primary-pale text-rahvana-primary text-sm font-semibold mb-4"
                  >
                    <Icons.Briefcase className="w-4 h-4" />
                    Premium Services
                  </motion.span>
                  <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    viewport={{ once: true }}
                    className="text-3xl md:text-5xl font-bold text-foreground mb-4"
                  >
                    Expert Help & Done-for-You Cases
                  </motion.h2>
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    viewport={{ once: true }}
                    className="text-lg text-muted-foreground"
                  >
                    Get the personalized support you need, from quick
                    consultations to full document preparation and review.
                  </motion.p>
                </div>

                <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 w-full max-w-6xl mx-auto">
                  {/* Left Column: Interactive List */}
                  <div className="w-full lg:w-5/12 flex flex-col gap-3">
                    {ALL_SERVICES.filter((s) => s.href !== "/book-consultation")
                      .slice(0, 5)
                      .map((service, idx) => {
                        const isActive = activeService === idx;
                        return (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1, duration: 0.4 }}
                            viewport={{ once: true }}
                            onClick={() => setActiveService(idx)}
                            className={`group relative flex items-center p-3 sm:p-4 rounded-xl sm:rounded-2xl cursor-pointer transition-all duration-300 border ${
                              isActive
                                ? "bg-card border-rahvana-primary shadow-md"
                                : "bg-transparent border-transparent hover:bg-muted/50 hover:border-border"
                            }`}
                          >
                            <div
                              className={`flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl transition-all duration-300 mr-3 sm:mr-4 shrink-0 ${
                                isActive
                                  ? "bg-rahvana-primary text-white shadow-md shadow-rahvana-primary/20 scale-105 sm:scale-110 [&>svg]:text-current!"
                                  : "bg-muted text-muted-foreground group-hover:bg-primary/90 group-hover:text-white [&>svg]:text-current!"
                              }`}
                            >
                              {React.cloneElement(
                                service.icon as React.ReactElement<{
                                  className?: string;
                                }>,
                                {
                                  className: "w-4 h-4 sm:w-5 sm:h-5",
                                },
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4
                                className={`font-bold text-sm sm:text-base truncate transition-colors ${
                                  isActive
                                    ? "text-foreground"
                                    : "text-muted-foreground group-hover:text-foreground"
                                }`}
                              >
                                {renderWithAbbr(service.title)}
                              </h4>
                              <p className="text-[10px] sm:text-xs text-muted-foreground truncate opacity-80 uppercase tracking-wider mt-0.5 sm:mt-1">
                                {service.category}
                              </p>
                            </div>
                            {/* Active indicator line */}
                            {/* {isActive && (
                              <motion.div
                                layoutId="activeIndicator"
                                className="absolute left-0 w-1 h-1/2 bg-rahvana-primary rounded-r-full"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.3 }}
                              />
                            )} */}
                          </motion.div>
                        );
                      })}

                    <div className="mt-6 pl-4">
                      <HydrationSafeButton
                        onClick={() => router.push("/services")}
                        className="inline-flex items-center gap-2 text-sm font-bold text-rahvana-primary hover:text-rahvana-primary-dark transition-colors"
                      >
                        View all services{" "}
                        <Icons.ArrowRight className="w-4 h-4" />
                      </HydrationSafeButton>
                    </div>
                  </div>

                  {/* Right Column: Dynamic Showcase Card */}
                  <div className="w-full lg:w-7/12 relative min-h-[400px]">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={activeService}
                        initial={{ opacity: 0, y: 20, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.98 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        className="absolute inset-0 rounded-3xl bg-card border border-border overflow-hidden shadow-2xl flex flex-col justify-between"
                      >
                        {/* Decorative Background */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-rahvana-primary-pale/30 rounded-full blur-3xl -mx-20 -my-20 pointer-events-none"></div>
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-rahvana-primary-pale/20 rounded-full blur-2xl -mx-10 -my-10 pointer-events-none"></div>

                        <div className="relative z-10 p-6 sm:p-8 md:p-12 flex-1 flex flex-col">
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 mb-6 sm:mb-8 border-b border-border/50 pb-6">
                            <div className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-xl sm:rounded-2xl bg-linear-to-br from-rahvana-primary to-rahvana-primary-light flex items-center justify-center text-white shadow-lg shadow-rahvana-primary/20 [&>svg]:text-white! [&>svg]:w-6 [&>svg]:h-6 sm:[&>svg]:w-8 sm:[&>svg]:h-8 md:[&>svg]:w-10 md:[&>svg]:h-10 shrink-0">
                              {
                                ALL_SERVICES.filter(
                                  (s) =>
                                    // !s.disabled &&
                                    s.href !== "/book-consultation",
                                )[activeService]?.icon
                              }
                            </div>
                            <div className="inline-block px-3 py-1 sm:px-4 sm:py-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-wider rounded-full bg-rahvana-primary-pale text-rahvana-primary">
                              {
                                ALL_SERVICES.filter(
                                  (s) =>
                                    // !s.disabled &&
                                    s.href !== "/book-consultation",
                                )[activeService]?.category
                              }
                            </div>
                          </div>

                          <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-3 sm:mb-4 leading-tight">
                            {renderWithAbbr(
                              ALL_SERVICES.filter(
                                (s) =>
                                  // !s.disabled &&
                                  s.href !== "/book-consultation",
                              )[activeService]?.title || "",
                            )}
                          </h3>
                          <p className="text-muted-foreground text-sm sm:text-base md:text-lg leading-relaxed mb-6 sm:mb-8 flex-1">
                            {renderWithAbbr(
                              ALL_SERVICES.filter(
                                (s) =>
                                  // !s.disabled &&
                                  s.href !== "/book-consultation",
                              )[activeService]?.description || "",
                            )}
                          </p>

                          <div className="mt-auto">
                            <HydrationSafeButton
                             // disabled
                              onClick={() => setShowComingSoon(true)}
                              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-bold text-white bg-rahvana-primary rounded-xl transition-all shadow-md"
                            >
                              Get Started{" "}
                              <Icons.ArrowRight className="w-5 h-5" />
                            </HydrationSafeButton>
                          </div>
                        </div>
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </section>

            {/* CONSULTATION BANNER */}
            <section className="py-12 md:py-24 bg-background">
              <div className="container mx-auto px-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="relative bg-linear-to-r from-rahvana-primary to-rahvana-primary-light rounded-3xl overflow-hidden shadow-2xl"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-2">
                    <div className="p-6 md:p-10 lg:p-16 text-white self-center">
                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 text-sm font-semibold mb-6">
                        <Icons.MessageSquare className="w-4 h-4" />
                        Expert Guidance
                      </div>
                      <h2 className="text-3xl lg:text-5xl font-bold mb-6">
                        Book a Consultation
                      </h2>
                      <p className="text-lg opacity-90 leading-relaxed mb-8">
                        Get personalized advice from immigration specialists who
                        understand your journey.{" "}
                        <span className="inline-block px-3 py-1 rounded-md bg-white/20 font-bold">
                          Sign up now.
                        </span>
                      </p>
                      <button
                        // onClick={handleConsultationClick}
                        onClick={() => setShowComingSoon(true)}
                        className="inline-flex items-center px-10 py-5 bg-background text-rahvana-primary text-lg font-bold rounded-xl shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all"
                      >
                        Book a Consultation
                      </button>
                    </div>
                    <div className="relative h-64 lg:h-full min-h-100 rounded-r-2xl">
                      <Image
                        src="/assets/images/consultation.jpg"
                        alt="Consultation"
                        className="absolute inset-0 w-full h-full object-cover rounded-r-2xl"
                        height={400}
                        width={400}
                      />
                      <div className="absolute inset-0 bg-linear-to-l from-transparent to-rahvana-primary/20 pointer-events-none"></div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </section>

            {/* HOW RAHVANA WORKS SECTION */}
            <section className="py-12 md:py-24 bg-muted/30" id="about">
              <div className="container mx-auto px-6">
                <div className="text-center max-w-3xl mx-auto mb-16">
                  <motion.span
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rahvana-primary-pale text-rahvana-primary text-sm font-semibold mb-4"
                  >
                    <Icons.TrendingUp className="w-4 h-4" />
                    Your Journey
                  </motion.span>
                  <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
                    How Rahvana Works
                  </h2>
                  <p className="text-lg text-muted-foreground">
                    From onboarding to interview readiness, Rahvana guides each
                    case through a clear, trackable workflow.
                  </p>
                  <motion.span
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rahvana-primary-pale text-rahvana-primary text-sm font-semibold my-2"
                  >
                    <Icons.Route className="w-4 h-4" />
                    See steps below for how rahvana works
                  </motion.span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="relative aspect-square max-w-[340px] md:max-w-[480px] mx-auto w-full"
                  >
                    {/* SVG Layer for all lines */}
                    <svg
                      className="absolute inset-0 w-full h-full -rotate-90"
                      viewBox="0 0 100 100"
                    >
                      {/* Background Dashed Circle */}
                      <circle
                        cx="50"
                        cy="50"
                        r="35"
                        stroke="currentColor"
                        strokeWidth="0.2"
                        strokeDasharray="1 2"
                        fill="none"
                        className="text-border"
                      />

                      {/* Animated Drawing Circle */}
                      <motion.circle
                        cx="50"
                        cy="50"
                        r="35"
                        stroke="currentColor"
                        strokeWidth="0.8"
                        strokeLinecap="round"
                        fill="none"
                        className="text-rahvana-primary"
                        initial={{ pathLength: 0, opacity: 0 }}
                        whileInView={{ pathLength: 1, opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 2, ease: "easeInOut" }}
                      />
                    </svg>

                    {/* Pulsing beacon in middle */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full bg-rahvana-primary/5 flex items-center justify-center">
                      <div className="w-4 h-4 rounded-full bg-rahvana-primary animate-ping opacity-75"></div>
                      <div className="absolute w-2 h-2 rounded-full bg-rahvana-primary"></div>
                    </div>

                    {/* Step Nodes with Staggered Entrance */}
                    <motion.div
                      variants={{
                        visible: {
                          transition: {
                            staggerChildren: 0.15,
                          },
                        },
                      }}
                      initial="hidden"
                      whileInView="visible"
                      viewport={{ once: true }}
                    >
                      {LIFECYCLE_STEPS.map((stepData, i) => {
                        const step = i + 1;
                        const angle = (360 / LIFECYCLE_STEPS.length) * i;
                        const isActive = activeStep === step;
                        return (
                          <motion.div
                            key={step}
                            onClick={() => setActiveStep(step)}
                            variants={{
                              hidden: { opacity: 0, scale: 0.8 },
                              visible: { opacity: 1, scale: 1 },
                            }}
                            animate={{
                              scale: isActive ? 1.25 : 1,
                            }}
                            className={`absolute w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center transition-all duration-500 z-10 ${
                              isActive
                                ? "bg-rahvana-primary text-white shadow-xl ring-4 md:ring-8 ring-rahvana-primary/10"
                                : "bg-card text-muted-foreground border border-border hover:border-rahvana-primary hover:text-rahvana-primary hover:scale-110 shadow-md"
                            }`}
                            style={{
                              left: `${(50 + 35 * Math.sin((angle * Math.PI) / 180)).toFixed(3)}%`,
                              top: `${(50 - 35 * Math.cos((angle * Math.PI) / 180)).toFixed(3)}%`,
                              translate: "-50% -50%",
                            }}
                          >
                            <HydrationSafeButton className="w-full h-full rounded-full flex items-center justify-center p-0 bg-transparent border-0">
                              <span className="sr-only">Step {step}</span>
                              {React.createElement(stepData.icon, {
                                className:
                                  "w-4 h-4 md:w-6 md:h-6 pointer-events-none",
                              })}
                            </HydrationSafeButton>
                          </motion.div>
                        );
                      })}
                    </motion.div>
                  </motion.div>

                  <div className="space-y-8">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={activeStep}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="bg-card rounded-3xl p-8 shadow-xl border border-border"
                      >
                        <div className="flex items-center gap-4 mb-6">
                          <div className="w-12 h-12 rounded-full bg-rahvana-primary text-white flex items-center justify-center text-xl font-bold">
                            0{activeStep}
                          </div>
                          <h3 className="text-2xl font-bold text-foreground">
                            {LIFECYCLE_STEPS[activeStep - 1].title}
                          </h3>
                        </div>
                        <p className="text-muted-foreground leading-relaxed mb-8 text-lg">
                          {LIFECYCLE_STEPS[activeStep - 1].desc}
                        </p>
                        <ul className="space-y-4 mb-10">
                          {LIFECYCLE_STEPS[activeStep - 1].items.map(
                            (item, i) => (
                              <li
                                key={i}
                                className="flex items-center gap-3 text-foreground font-medium bg-muted/50 p-3 rounded-xl border border-border"
                              >
                                <Icons.Check className="w-5 h-5 text-rahvana-primary" />
                                {item}
                              </li>
                            ),
                          )}
                        </ul>

                        <div className="flex flex-wrap items-center justify-between gap-3 md:gap-4 pt-6 border-t border-border sm:flex-nowrap">
                          <button
                            onClick={() =>
                              setActiveStep((prev) => Math.max(1, prev - 1))
                            }
                            disabled={activeStep === 1}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${
                              activeStep === 1
                                ? "opacity-30 cursor-not-allowed text-muted-foreground"
                                : "text-rahvana-primary hover:bg-rahvana-primary-pale"
                            }`}
                          >
                            <Icons.ChevronLeft className="w-5 h-5" />
                            Previous
                          </button>

                          <div className="flex gap-1.5">
                            {LIFECYCLE_STEPS.map((_, i) => (
                              <div
                                key={i}
                                className={`w-2 h-2 rounded-full transition-all ${i + 1 === activeStep ? "bg-rahvana-primary w-4" : "bg-border"}`}
                              />
                            ))}
                          </div>

                          <button
                            onClick={() =>
                              setActiveStep((prev) =>
                                Math.min(LIFECYCLE_STEPS.length, prev + 1),
                              )
                            }
                            disabled={activeStep === LIFECYCLE_STEPS.length}
                            className={`flex items-center gap-2 px-6 py-2 rounded-lg font-semibold transition-all ${
                              activeStep === LIFECYCLE_STEPS.length
                                ? "opacity-30 cursor-not-allowed text-muted-foreground"
                                : "bg-rahvana-primary text-white shadow-lg hover:bg-rahvana-primary-dark hover:-translate-y-0.5"
                            }`}
                          >
                            Next
                            <Icons.ChevronRight className="w-5 h-5" />
                          </button>
                        </div>
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </section>

            {/* FAQ SECTION */}
            <section className="py-12 md:py-24 bg-background" id="faq">
              <div className="container mx-auto px-6">
                <div className="text-center max-w-3xl mx-auto mb-16">
                  <motion.span
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rahvana-primary-pale text-rahvana-primary text-sm font-semibold mb-4"
                  >
                    <Icons.HelpCircle className="w-4 h-4" />
                    Common Questions
                  </motion.span>
                  <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
                    Frequently Asked Questions
                  </h2>
                </div>

                <div className="max-w-3xl mx-auto space-y-4">
                  {FAQS.map((faq, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      viewport={{ once: true }}
                      className={`rounded-2xl border transition-all ${
                        openFAQ === i
                          ? "border-rahvana-primary bg-rahvana-primary-pale/30 shadow-md"
                          : "border-border bg-card hover:border-rahvana-primary/30"
                      }`}
                    >
                      <HydrationSafeButton
                        onClick={() => setOpenFAQ(openFAQ === i ? null : i)}
                        className="w-full px-5 md:px-8 py-6 text-left flex items-center justify-between"
                      >
                        <span className="text-lg font-bold text-foreground pr-4 md:pr-8">
                          {faq.q}
                        </span>
                        <div
                          className={`w-6 h-6 md:h-8 md:w-8 shrink-0 rounded-full  border flex items-center justify-center transition-all ${
                            openFAQ === i
                              ? "bg-rahvana-primary border-rahvana-primary text-white rotate-45"
                              : "border-border text-muted-foreground group-hover:border-rahvana-primary group-hover:text-rahvana-primary"
                          }`}
                        >
                          <Icons.Plus className="w-4 h-4" />
                        </div>
                      </HydrationSafeButton>
                      <AnimatePresence>
                        {openFAQ === i && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="px-8 pb-6 text-muted-foreground leading-relaxed border-t border-rahvana-primary/10 pt-4">
                              {faq.a}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))}
                </div>
              </div>
            </section>

            {/* GET IN TOUCH */}
            {/* wrap in animation */}
            <motion.div
              id="contact"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className=""
            >
              <GetInTouch />
            </motion.div>

            {/* AUTH MODAL */}
            <AnimatePresence>
              {showAuthModal && (
                <AuthRequiredModal
                  open={showAuthModal}
                  onClose={() => setShowAuthModal(false)}
                  redirectTo="/book-consultation"
                />
              )}
            </AnimatePresence>

            {/* Toast Container */}
            {/* <div ref={toastContainerRef} className="toast-container" /> */}
          </div>
        )}

        {activeSection === "journeys" && (
          <VisaCategorySection onNavigate={handleNavigate} />
        )}

        {activeSection === "ir1-journey" && (
          <IR1JourneyDetail
            isSignedIn={isSignedIn}
            onToggleAuth={handleToggleAuth}
            onStart={handleStartJourney}
          >
            <Wizard state={state} actions={actions} isLoaded={isLoaded} />
          </IR1JourneyDetail>
        )}

        {activeSection === "tools" && <ToolsSection />}

        {activeSection === "pricing" && <PricingSection />}

        {activeSection === "dashboard" && (
          <Dashboard
            state={state}
            isSignedIn={isSignedIn}
            onContinue={() => router.push("/my-journeys")}
            onNavigate={handleNavigate}
            onToggleAuth={handleToggleAuth}
          />
        )}
      </main>

      {showMfaPrompt && (
        <MfaPromptModal
          open={showMfaPrompt}
          onEnable={handleEnableMfa}
          onRemindLater={handleRemindLater}
        />
      )}

      {showComingSoon && (
        <ComingSoonModal
          open={showComingSoon}
          onOpenChange={setShowComingSoon}
        />
      )}
    </div>
  );
}
