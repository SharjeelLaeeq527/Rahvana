"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { motion as BannerMotion } from "framer-motion";
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
import { CinematicHeroHtmlStyle } from "./components/home-page/CinematicHeroHtmlStyle";
import { ComingSoonModal } from "./components/shared/ComingSoonModal";
import { useAuth } from "./context/AuthContext";
import { createClient } from "@/lib/supabase/client";
import GetInTouch from "./components/Contact/GetInTouch";
import { AuthRequiredModal } from "./components/shared/AuthRequiredModal";
import { MfaPromptModal } from "./components/shared/MFAPromptModal";
import { NAV_DATA } from "@/app/components/layout/navigationData";
import { useLanguage } from "@/app/context/LanguageContext";
import {
  FAQS,
  heroAnnotationFont,
  heroAnnotations,
} from "@/data/home-page-data";
import { Loader } from "@/components/ui/spinner";
import {
  RealDashboardScene,
  TwoWaysScene,
  ConsultationBanner,
} from "./components/home-page/Components";

export const journeyHref = "/visa-category/ir-category/ir1-journey";
export const toolsHref = "/tools";

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

const LiveBackground = () => {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 size-full overflow-hidden">
      <BannerMotion.div
        className="absolute h-[260px] w-[260px] rounded-full mix-blend-screen opacity-20 sm:h-[500px] sm:w-[500px]"
        style={{
          backgroundColor: "#afdbdb",
          filter: "blur(80px)",
          top: "-10%",
          left: "-12%",
        }}
        animate={{ scale: [1, 1.1, 1], opacity: [0.15, 0.25, 0.15] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      />
      <BannerMotion.div
        className="absolute h-[220px] w-[220px] rounded-full mix-blend-screen opacity-20 sm:h-[400px] sm:w-[400px]"
        style={{
          backgroundColor: "#db8090",
          filter: "blur(80px)",
          right: "-12%",
          bottom: "-14%",
        }}
        animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
      />
      <BannerMotion.div
        className="absolute h-[160px] w-[160px] rounded-full mix-blend-screen opacity-10 sm:h-[300px] sm:w-[300px]"
        style={{
          backgroundColor: "#cdadcc",
          filter: "blur(60px)",
          left: "52%",
          top: "12%",
        }}
        animate={{ scale: [1, 1.15, 1], opacity: [0.1, 0.2, 0.1] }}
        transition={{
          duration: 9,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
      />

      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: "radial-gradient(#afdbdb 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      <BannerMotion.div
        className="absolute right-[-18%] top-1/2 z-0 flex -translate-y-1/2 items-center justify-center rounded-full sm:right-[-10%] sm:z-10 md:right-[5%]"
        style={{
          width: "220px",
          height: "220px",
          backgroundColor: "rgba(175, 219, 219, 0.02)",
          border: "1px dashed rgba(175, 219, 219, 0.15)",
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
      >
        <Icons.Globe
          className="h-20 w-20 sm:h-32 sm:w-32"
          color="#afdbdb"
          strokeWidth={0.5}
          opacity={0.4}
        />

        <BannerMotion.div
          className="absolute"
          animate={{ rotate: -360 }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          style={{ width: "300px", height: "300px" }}
        >
          <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rotate-90">
            <Icons.Plane
              className="h-4 w-4 sm:h-7 sm:w-7"
              color="#db8090"
              fill="#db8090"
              opacity={0.7}
            />
          </div>
        </BannerMotion.div>

        <BannerMotion.div
          className="absolute"
          animate={{ rotate: 360 }}
          transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
          style={{ width: "360px", height: "360px" }}
        >
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 -rotate-90">
            <Icons.Plane
              className="h-3.5 w-3.5 sm:h-5 sm:w-5"
              color="#cdadcc"
              opacity={0.5}
            />
          </div>
        </BannerMotion.div>
      </BannerMotion.div>

      <BannerMotion.div
        className="absolute left-[58%] top-[16%] z-0 rounded-xl p-2.5 shadow-2xl backdrop-blur-md sm:left-[55%] sm:top-[20%] sm:p-3.5 sm:z-20"
        style={{
          backgroundColor: "rgba(205, 173, 204, 0.15)",
          border: "1px solid rgba(205, 173, 204, 0.2)",
        }}
        animate={{ y: [0, -20, 0], rotate: [-5, 5, -5] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      >
        <Icons.FileText
          className="h-4 w-4 sm:h-7 sm:w-7"
          color="#cdadcc"
          strokeWidth={1.5}
        />
      </BannerMotion.div>

      <BannerMotion.div
        className="absolute bottom-[16%] left-[10%] z-0 rounded-xl p-2.5 shadow-2xl backdrop-blur-md sm:bottom-[20%] sm:left-[40%] sm:p-3.5 sm:z-20"
        style={{
          backgroundColor: "rgba(219, 128, 144, 0.15)",
          border: "1px solid rgba(219, 128, 144, 0.2)",
        }}
        animate={{ y: [0, 15, 0], scale: [1, 1.05, 1], rotate: [5, -5, 5] }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
      >
        <Icons.MessagesSquare
          className="h-4 w-4 sm:h-7 sm:w-7"
          color="#db8090"
          strokeWidth={1.5}
        />
      </BannerMotion.div>

      <BannerMotion.div
        className="absolute right-[28%] top-[72%] z-0 rounded-full p-2 backdrop-blur-md sm:right-[35%] sm:top-[70%] sm:p-2.5 sm:z-10"
        style={{
          backgroundColor: "rgba(175, 219, 219, 0.15)",
          border: "1px solid rgba(175, 219, 219, 0.2)",
        }}
        animate={{ y: [0, -12, 0], scale: [1, 1.1, 1] }}
        transition={{
          duration: 4.5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.5,
        }}
      >
        <Icons.MapPin
          className="h-4 w-4 sm:h-6 sm:w-6"
          color="#afdbdb"
          strokeWidth={1.5}
        />
      </BannerMotion.div>
    </div>
  );
};

// function ConsultationBanner({
//   onConsultationClick,
// }: {
//   onConsultationClick: () => void;
// }) {
//   return (
//     <section className="w-full px-3 py-6 sm:px-4 md:px-6 md:py-8">
//       <div className="relative flex min-h-[280px] w-full items-center overflow-hidden rounded-2xl bg-[#0d7377] shadow-[0_20px_40px_rgba(13,115,119,0.25)] sm:min-h-[300px] sm:rounded-[1.4rem]">
//         <LiveBackground />

//         <div className="pointer-events-none relative z-10 flex w-full flex-col justify-center p-5 sm:p-7 md:w-[68%] md:p-9 lg:w-3/5 lg:p-10">
//           <BannerMotion.div
//             className="pointer-events-auto"
//             initial={{ opacity: 0, x: -20 }}
//             whileInView={{ opacity: 1, x: 0 }}
//             viewport={{ once: true }}
//             transition={{ duration: 0.6, ease: "easeOut" }}
//           >
//             <h2 className="mb-2 text-2xl font-bold tracking-tight text-white drop-shadow-sm sm:mb-3 sm:text-3xl lg:mb-4 lg:text-5xl">
//               Book a Consultation
//             </h2>

//             <p className="mb-4 max-w-[60ch] text-[15px] font-light leading-relaxed text-white/95 drop-shadow-sm sm:mb-5 sm:text-base lg:mb-6 lg:text-lg">
//               Get personalized advice from specialists who understand your
//               journey.
//             </p>

//             <BannerMotion.button
//               type="button"
//               onClick={onConsultationClick}
//               className="flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-bold shadow-lg transition-colors sm:w-auto sm:px-7 sm:py-3.5 sm:text-base"
//               style={{ backgroundColor: "#db8090", color: "#ffffff" }}
//               whileHover={{ scale: 1.02, backgroundColor: "#e294a2" }}
//               whileTap={{ scale: 0.98 }}
//             >
//               Book a Consultation
//             </BannerMotion.button>
//           </BannerMotion.div>
//         </div>
//       </div>
//     </section>
//   );
// }

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col items-center justify-center bg-background">
          <Loader size="lg" text="Loading" />
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

  const [heroScene, setHeroScene] = useState(0);
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
    <div className="min-h-screen bg-background font-sans text-foreground overflow-x-clip">
      <main className="min-h-[calc(100vh-200px)]">
        {activeSection === "home" && (
          <div className="flex flex-col">
            {/* Use the new styled hero, but keep the same CTA and header logic */}

            <section className="relative overflow-hidden border-b border-[#d9e2e1] bg-[#fbfaf7] lg:h-screen lg:min-h-[720px]">
              <div className="absolute inset-0">
                <Image
                  src="/assets/images/heroimage1.png"
                  alt=""
                  fill
                  priority
                  sizes="100vw"
                  className="object-cover object-[58%_48%]"
                />
              </div>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_42%,rgba(255,255,255,0.24),transparent_27%),radial-gradient(circle_at_71%_52%,rgba(13,115,119,0.16),transparent_30%),radial-gradient(circle_at_center,rgba(5,12,22,0)_38%,rgba(5,12,22,0.34)_100%)]" />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,12,22,0)_34%,rgba(5,12,22,0.22)_64%,rgba(5,12,22,0.88)_100%)]" />

              {/* 2xl:hidden */}
              <div className="hidden lg:block">
                <h1 className="absolute left-1/2 top-[50px] xl:top-[60px] 2xl:top-[65px] z-10 w-full -translate-x-1/2 whitespace-nowrap text-center text-[clamp(28px,3.2vw,48px)] font-extrabold leading-[1.08] tracking-[-0.045em] text-white [text-shadow:0_8px_28px_rgba(5,12,22,0.42)] xl:top-[64px]">
                  <span className="inline-block pb-2">
                    Navigate your IR-1 journey with clarity.
                  </span>
                </h1>

                <div className="absolute left-[5vw] top-[40vh] z-20 w-[300px] rounded-[22px] border border-white/40 bg-white/[0.18] px-6 py-6 shadow-[0_24px_70px_rgba(15,23,42,0.25),inset_0_1px_0_rgba(255,255,255,0.35)] backdrop-blur-[18px] xl:left-[10vw] xl:top-[38vh] xl:w-[350px] xl:px-8 xl:py-[30px] 2xl:left-[13vw] 2xl:w-[390px]">
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={heroScene}
                      initial={{ opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -14 }}
                      transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
                      className={`${heroAnnotationFont.className} text-[28px] leading-[1.44] text-white [text-shadow:0_2px_14px_rgba(0,0,0,0.34)] xl:text-[31px] xl:leading-[1.46]`}
                    >
                      {heroAnnotations[heroScene]}
                    </motion.p>
                  </AnimatePresence>
                </div>

                <svg
                  aria-hidden="true"
                  className="pointer-events-none absolute left-[27vw] top-[38vh] z-30 h-[118px] w-[32vw] overflow-visible xl:left-[33vw] xl:top-[37vh] xl:w-[25vw] 2xl:left-[34vw]"
                  viewBox="0 0 470 140"
                  fill="none"
                >
                  <defs>
                    <filter
                      id="heroConnectorGlow"
                      x="-40%"
                      y="-80%"
                      width="180%"
                      height="260%"
                    >
                      <feGaussianBlur stdDeviation="4" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>
                  <path
                    d="M 50 85 C 90 84 120 18 196 35 C 215 39 220 41 230 44"
                    stroke="rgba(255,255,255,0.65)"
                    strokeWidth="2"
                    strokeDasharray="4 8"
                    strokeLinecap="round"
                  />
                  <circle
                    cx="50"
                    cy="85"
                    r="4.5"
                    fill="rgba(255,255,255,0.96)"
                    filter="url(#heroConnectorGlow)"
                  />
                  <circle
                    cx="230"
                    cy="44"
                    r="4.5"
                    fill="rgba(255,255,255,0.96)"
                    filter="url(#heroConnectorGlow)"
                  />
                </svg>

                <div className="absolute right-[3vw] top-[75px] lg:top-[85px] xl:top-[90px] z-20 h-[clamp(470px,50vh,560px)] w-[clamp(560px,54vw,720px)] xl:right-[6vw] xl:top-[120px] xl:h-[clamp(500px,52vh,590px)] xl:w-[clamp(650px,47vw,760px)] 2xl:right-[11vw] 2xl:w-[clamp(700px,47vw,860px)]">
                  <RealDashboardScene compact onSceneChange={setHeroScene} />
                </div>

                <div className="absolute bottom-[8px] left-0 right-0 z-20 flex flex-col gap-4">
                  <div className="flex px-[5vw] xl:px-[10vw] 2xl:px-[13vw]">
                    <Link
                      href={journeyHref}
                      className="inline-flex min-h-[57px] items-center justify-center gap-2 rounded-[18px] bg-[linear-gradient(135deg,#0d7377,#18a6a2)] px-8 text-base font-black text-white shadow-[0_18px_44px_rgba(13,115,119,0.38)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_54px_rgba(13,115,119,0.46)]"
                    >
                      Start IR-1 Journey
                      <Icons.ArrowRight className="size-5" />
                    </Link>
                    {/* <Link
                      href="#how-it-works"
                      className="inline-flex min-h-[57px] items-center justify-center rounded-[18px] border border-white/55 bg-[#08111f]/34 px-8 text-base font-black text-white shadow-[0_14px_32px_rgba(0,0,0,0.20)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-white/12"
                    >
                      See How It Works
                    </Link> */}
                  </div>
                  <div className="">
                    <p className="mx-auto text-center text-[15px] leading-[1.65] text-white/88 [text-shadow:0_2px_14px_rgba(0,0,0,0.35)] xl:text-[17px]">
                      <span className="">
                        Rahvana gives you a structured step-by-step IR-1 roadmap
                        from petition filing to interview readiness with guided
                        steps, document organization, progress tracking, and
                        focused tools when you need them.
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Desktop Layout (xl and up, >1280px) */}
              {/* <div className="hidden 2xl:flex absolute inset-0 z-10 w-full max-w-[1600px] mx-auto px-[5vw] 2xl:px-[8vw] pt-[120px] pb-[40px] flex-col pointer-events-none">
                <h1 className="absolute left-1/2 top-[60px] z-10 w-full -translate-x-1/2 whitespace-nowrap text-center text-[clamp(28px,3.2vw,48px)] font-extrabold leading-[1.08] tracking-[-0.045em] text-white [text-shadow:0_8px_28px_rgba(5,12,22,0.42)]">
                  <span className="inline-block pb-2">
                    Navigate your IR-1 journey with clarity.
                  </span>
                </h1> */}

              {/* Main Middle Section: Card, Connector, Dashboard */}
              {/* <div className="flex flex-1 items-center justify-between w-full relative mt-[4vh]"> */}
              {/* Left: Card */}
              {/* <div className="z-20 w-[340px] 2xl:w-[380px] shrink-0 rounded-[22px] border border-white/40 bg-white/[0.18] px-8 py-[30px] shadow-[0_24px_70px_rgba(15,23,42,0.25),inset_0_1px_0_rgba(255,255,255,0.35)] backdrop-blur-[18px] pointer-events-auto">
                    <AnimatePresence mode="wait">
                      <motion.p
                        key={heroScene}
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -14 }}
                        transition={{
                          duration: 0.42,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                        className={`${heroAnnotationFont.className} text-[30px] leading-[1.46] text-white [text-shadow:0_2px_14px_rgba(0,0,0,0.34)]`}
                      >
                        {heroAnnotations[heroScene]}
                      </motion.p>
                    </AnimatePresence>
                  </div> */}

              {/* Middle: Flexible Connector */}
              {/* <div className="flex-1 relative z-30 mx-[-4px] pointer-events-none flex items-center justify-center">
                    <svg
                      viewBox="0 0 180 67"
                      className="w-full max-w-[280px] drop-shadow-lg overflow-visible"
                      fill="none"
                    >
                      <defs>
                        <filter
                          id="heroConnectorGlowFlex"
                          x="-40%"
                          y="-80%"
                          width="180%"
                          height="260%"
                        >
                          <feGaussianBlur stdDeviation="4" result="blur" />
                          <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                          </feMerge>
                        </filter>
                      </defs>
                      <path
                        d="M 0 67 C 40 66 70 0 146 17 C 165 21 170 23 180 26"
                        stroke="rgba(255,255,255,0.65)"
                        strokeWidth="2"
                        strokeDasharray="4 8"
                        strokeLinecap="round"
                      />
                      <circle
                        cx="0"
                        cy="67"
                        r="4.5"
                        fill="rgba(255,255,255,0.96)"
                        filter="url(#heroConnectorGlowFlex)"
                      />
                      <circle
                        cx="180"
                        cy="26"
                        r="4.5"
                        fill="rgba(255,255,255,0.96)"
                        filter="url(#heroConnectorGlowFlex)"
                      />
                    </svg>
                  </div> */}

              {/* Right: Dashboard */}
              {/* <div className="z-20 w-[clamp(650px,47vw,760px)] 2xl:w-[clamp(720px,47vw,840px)] shrink-0 h-[clamp(500px,52vh,590px)] pointer-events-auto">
                    <RealDashboardScene compact onSceneChange={setHeroScene} />
                  </div>
                </div> */}

              {/* Bottom CTA Section */}
              {/* <div className="mt-auto pt-6 z-20 flex items-center justify-between gap-6 w-full pointer-events-auto">
                  <div className="w-[50%]">
                    <p className="text-left text-[17px] leading-[1.65] text-white/90 [text-shadow:0_2px_14px_rgba(0,0,0,0.35)]">
                      Rahvana gives you a structured step-by-step IR-1 roadmap
                      from petition filing to interview readiness with guided
                      steps, document organization, progress tracking, and
                      focused tools when you need them.
                    </p>
                  </div>
                  <div className="flex gap-4 w-auto justify-end">
                    <Link
                      href={journeyHref}
                      className="inline-flex min-h-[57px] items-center justify-center gap-2 rounded-[18px] bg-[linear-gradient(135deg,#0d7377,#18a6a2)] px-8 text-base font-black text-white shadow-[0_18px_44px_rgba(13,115,119,0.38)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_54px_rgba(13,115,119,0.46)]"
                    >
                      Start IR-1 Journey
                      <Icons.ArrowRight className="size-5" />
                    </Link>
                  </div>
                </div>
              </div> */}

              <div className="relative z-10 flex min-h-screen flex-col gap-7 px-5 pb-10 pt-24 sm:px-7 lg:hidden">
                <h1 className="text-center text-[clamp(2.2rem,8vw,4.2rem)] font-extrabold leading-[1.06] tracking-[-0.04em] text-white [text-shadow:0_8px_28px_rgba(5,12,22,0.42)]">
                  <span className="inline-block pb-2">
                    Navigate your IR-1 journey with clarity.
                  </span>
                </h1>

                <div className="mx-auto h-[460px] w-full max-w-[760px] sm:h-[520px]">
                  <RealDashboardScene compact onSceneChange={setHeroScene} />
                </div>

                <div className="mx-auto w-full max-w-[640px] rounded-[22px] border border-white/40 bg-white/[0.18] px-6 py-6 mt-12 shadow-[0_24px_70px_rgba(15,23,42,0.26),inset_0_1px_0_rgba(255,255,255,0.35)] backdrop-blur-[18px]">
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={heroScene}
                      initial={{ opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -14 }}
                      transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
                      className={`${heroAnnotationFont.className} text-[29px] leading-[1.35] text-white/95 [text-shadow:0_2px_12px_rgba(0,0,0,0.28)]`}
                    >
                      {heroAnnotations[heroScene]}
                    </motion.p>
                  </AnimatePresence>
                </div>

                <div className="mx-auto flex w-full max-w-[760px] flex-col gap-5">
                  <p className="text-base leading-7 text-white/88 [text-shadow:0_2px_14px_rgba(0,0,0,0.35)] sm:text-lg">
                    <span className="block">
                      Rahvana gives you a structured step-by-step IR-1 roadmap
                      from petition filing to interview readiness with guided
                      steps, document organization, progress tracking, and
                      focused tools when you need them.
                    </span>
                  </p>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Link
                      href={journeyHref}
                      className="inline-flex min-h-[56px] items-center justify-center gap-2 rounded-[18px] bg-[linear-gradient(135deg,#0d7377,#18a6a2)] px-8 text-base font-black text-white shadow-[0_18px_44px_rgba(13,115,119,0.34)] transition hover:-translate-y-0.5"
                    >
                      Start IR-1 Journey
                      <Icons.ArrowRight className="size-5" />
                    </Link>
                    {/* <Link
                      href="#how-it-works"
                      className="inline-flex min-h-[56px] items-center justify-center rounded-[18px] border border-white/55 bg-[#08111f]/34 px-8 text-base font-black text-white shadow-[0_14px_32px_rgba(0,0,0,0.20)] backdrop-blur-xl transition hover:-translate-y-0.5"
                    >
                      See How It Works
                    </Link> */}
                  </div>
                </div>
              </div>
            </section>

            <TwoWaysScene />

            <ConsultationBanner onConsultationClick={handleConsultationClick} />

            {/* FAQ SECTION */}
            <section className="py-8 md:py-12 bg-background" id="faq">
              <div className="w-full mx-auto px-6 sm:px-8 md:px-12  2xl:px-30 ">
                <div className="text-center w-full md:w-3/4 mx-auto mb-5">
                  <motion.span
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rahvana-primary-pale text-rahvana-primary text-sm font-semibold mb-4"
                  >
                    <Icons.HelpCircle className="w-4 h-4" />
                    {t("homePage.faqBadge")}
                  </motion.span>
                  <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
                    {t("homePage.faqTitle") || "Frequently Asked Questions"}
                  </h2>
                </div>

                <div className="w-full md:w-3/4 mx-auto space-y-4">
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
                          {t(`homePage.faqs.q${i + 1}.q`) || faq.q}
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
                              {t(`homePage.faqs.q${i + 1}.a`) || faq.a}
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
