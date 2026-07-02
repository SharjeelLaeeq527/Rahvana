"use client";

import React, { useState, useEffect, Suspense, useRef, useLayoutEffect, useCallback } from "react";
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
import { FAQS, heroAnnotationFont, heroAnnotations } from "@/data/home-page-data";
import { Loader } from "@/components/ui/spinner";
import {
  RealDashboardScene,
  TwoWaysScene,
  ConsultationBanner,
  JourneyConsultationBand,
} from "./components/home-page/Components";
import { Caveat } from "next/font/google";
import { ToolsDock } from "./(main)/home-page/ToolDock";
import HeroSection from "./(main)/home-page/herosection";
import AnimationCard from "./(main)/home-page/AnimationCard";

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
  tab.items ? tab.items.map((item) => ({ ...item, category: tab.label })) : []
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
            <Icons.Plane className="h-3.5 w-3.5 sm:h-5 sm:w-5" color="#cdadcc" opacity={0.5} />
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
        <Icons.FileText className="h-4 w-4 sm:h-7 sm:w-7" color="#cdadcc" strokeWidth={1.5} />
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
        <Icons.MessagesSquare className="h-4 w-4 sm:h-7 sm:w-7" color="#db8090" strokeWidth={1.5} />
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
        <Icons.MapPin className="h-4 w-4 sm:h-6 sm:w-6" color="#afdbdb" strokeWidth={1.5} />
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
const caveat = Caveat({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-caveat",
});

type AnchorColor = "teal" | "amber" | "purple" | "rose" | "green";

type AnchorEntry = {
  el: HTMLElement;
  color: AnchorColor;
};

const RoadmapContext = React.createContext<{
  register: (id: string, entry: AnchorEntry | null) => void;
} | null>(null);

function useRoadmapAnchor(id: string, color: AnchorColor) {
  const ctx = React.useContext(RoadmapContext);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ctx || !ref.current) return;
    ctx.register(id, { el: ref.current, color });
    return () => ctx.register(id, null);
  }, [ctx, id, color]);

  return ref;
}

function RoadmapProvider({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const anchorsRef = useRef<Map<string, AnchorEntry>>(new Map());
  const [pathSegments, setPathSegments] = useState<
    { d: string; color: AnchorColor; yStart: number; yEnd: number }[]
  >([]);
  const [svgHeight, setSvgHeight] = useState(0);
  const rafRef = useRef<number | null>(null);

  const [scrollY, setScrollY] = useState(0);
  const containerTopRef = useRef(0);
  const windowHeightRef = useRef(0);
  const pathRefs = useRef<(SVGPathElement | null)[]>([]);
  const [pathLengths, setPathLengths] = useState<number[]>([]);

  const register = useCallback((id: string, entry: AnchorEntry | null) => {
    if (entry) {
      anchorsRef.current.set(id, entry);
    } else {
      anchorsRef.current.delete(id);
    }
    scheduleRecompute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function scheduleRecompute() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(recompute);
  }

  function recompute() {
    const container = containerRef.current;
    if (!container) return;

    const isDesktop = window.matchMedia("(min-width: 768px)").matches;
    if (!isDesktop) {
      setPathSegments([]);
      return;
    }

    const containerRect = container.getBoundingClientRect();
    containerTopRef.current = containerRect.top + window.scrollY;
    windowHeightRef.current = window.innerHeight;

    const ids = Array.from(anchorsRef.current.keys()).sort((a, b) => parseFloat(a) - parseFloat(b));

    const points = ids.map((id) => {
      const { el, color } = anchorsRef.current.get(id)!;
      const r = el.getBoundingClientRect();
      return {
        x: r.left + r.width / 2 - containerRect.left,
        y: r.top + r.height / 2 - containerRect.top,
        color,
      };
    });

    if (points.length < 2) {
      setPathSegments([]);
      return;
    }

    const segments: { d: string; color: AnchorColor; yStart: number; yEnd: number }[] = [];
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i === 0 ? i : i - 1];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2 < points.length ? i + 2 : i + 1];

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      const d = `M ${p1.x},${p1.y} C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
      segments.push({ d, color: p1.color, yStart: p1.y, yEnd: p2.y });
    }

    setPathSegments(segments);
    setSvgHeight(container.scrollHeight);
  }

  useLayoutEffect(() => {
    if (typeof window !== "undefined") {
      setScrollY(window.scrollY);
      windowHeightRef.current = window.innerHeight;
    }
    recompute();

    const ro = new ResizeObserver(() => scheduleRecompute());
    if (containerRef.current) ro.observe(containerRef.current);

    window.addEventListener("resize", scheduleRecompute);

    const t1 = setTimeout(scheduleRecompute, 300);
    const t2 = setTimeout(scheduleRecompute, 1000);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", scheduleRecompute);
      clearTimeout(t1);
      clearTimeout(t2);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let rafId: number;
    function handleScroll() {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        setScrollY(window.scrollY);
      });
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      cancelAnimationFrame(rafId);
    };
  }, []);

  useLayoutEffect(() => {
    const lengths = pathSegments.map((_, i) => {
      const path = pathRefs.current[i];
      return path ? path.getTotalLength() : 0;
    });
    setPathLengths(lengths);
  }, [pathSegments]);

  const strokeColors: Record<AnchorColor, string> = {
    teal: "#0d7377",
    amber: "#8a6200",
    purple: "#4a2d8a",
    rose: "#c0596a",
    green: "#15744f",
  };

  return (
    <RoadmapContext.Provider value={{ register }}>
      <div ref={containerRef} className="relative">
        <svg
          className="absolute inset-0 w-full pointer-events-none z-0 hidden md:block"
          style={{ height: svgHeight }}
          width="100%"
          preserveAspectRatio="none"
        >
          {pathSegments.map((seg, i) => {
            const length = pathLengths[i] || 0;
            const yStart = seg.yStart;
            const yEnd = seg.yEnd;

            // Calculate progress based on scroll
            const revealY = scrollY + (windowHeightRef.current || 800) - 80;
            const currentY = revealY - containerTopRef.current;

            let progress = 0;
            if (currentY >= yEnd) {
              progress = 1;
            } else if (currentY <= yStart) {
              progress = 0;
            } else if (yEnd > yStart) {
              progress = (currentY - yStart) / (yEnd - yStart);
            }

            const activeLength = length || 1000;
            const dashOffset = activeLength * (1 - progress);

            return (
              <React.Fragment key={i}>
                <mask id={`roadmap-mask-${i}`}>
                  <path
                    d={seg.d}
                    fill="none"
                    stroke="white"
                    strokeWidth="6"
                    strokeDasharray={activeLength}
                    strokeDashoffset={dashOffset}
                    style={{
                      transition: "stroke-dashoffset 0.15s ease-out",
                    }}
                  />
                </mask>
                <path
                  ref={(el) => {
                    pathRefs.current[i] = el;
                  }}
                  d={seg.d}
                  fill="none"
                  stroke={strokeColors[seg.color]}
                  strokeWidth="2"
                  strokeDasharray="4,4"
                  className="opacity-50"
                  mask={`url(#roadmap-mask-${i})`}
                />
              </React.Fragment>
            );
          })}
        </svg>
        {children}
      </div>
    </RoadmapContext.Provider>
  );
}

function RoadmapAnchor({
  id,
  color,
  className = "",
  children,
}: {
  id: string;
  color: AnchorColor;
  className?: string;
  children: React.ReactNode;
}) {
  const ref = useRoadmapAnchor(id, color);
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

function ScrollReveal({
  children,
  delayClass = "",
  className = "",
}: {
  children: React.ReactNode;
  delayClass?: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -80px 0px" }
    );

    observer.observe(el);
    return () => observer.unobserve(el);
  }, []);

  return (
    <div ref={ref} className={`reveal ${delayClass} ${visible ? "visible" : ""} ${className}`}>
      {children}
    </div>
  );
}

function Annotation({
  text,
  direction = "left",
  className = "",
  arrowRotation = "",
}: {
  text: string;
  direction?: "left" | "right";
  className?: string;
  arrowRotation?: string;
}) {
  const defaultPos =
    direction === "left"
      ? "left-[10%] md:left-[15%] top-[10%]"
      : "right-[10%] md:right-[15%] top-[15%]";

  return (
    <div
      className={`absolute z-10 ${className || defaultPos} max-w-[160px] transform ${
        direction === "left" ? "-rotate-6" : "rotate-6"
      } pointer-events-none`}
    >
      <p
        className={`${caveat.className} text-slate-500 text-lg md:text-xl leading-tight font-medium`}
      >
        {text}
      </p>
      {direction === "left" ? (
        <svg
          className={`w-10 h-10 text-slate-400/80 -mt-1 ml-6 ${arrowRotation || "rotate-[-25deg]"}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.5 4.5l-15 15m0 0h11.25m-11.25 0V8.25"
          />
        </svg>
      ) : (
        <svg
          className={`w-10 h-10 text-slate-400/80 -mt-1 mr-6 ${arrowRotation || "rotate-[75deg]"}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.5 4.5l-15 15m0 0h11.25m-11.25 0V8.25"
          />
        </svg>
      )}
    </div>
  );
}

function NodeCircle({
  icon: Icon,
  label,
  color,
}: {
  icon: React.ComponentType<any>;
  label?: string;
  badgeNum?: string;
  color: "teal" | "amber" | "purple" | "rose" | "green";
}) {
  const colorClasses = {
    teal: { bg: "bg-[#0d7377]" },
    amber: { bg: "bg-[#8a6200]" },
    purple: { bg: "bg-[#4a2d8a]" },
    rose: { bg: "bg-[#c0596a]" },
    green: { bg: "bg-[#15744f]" },
  };

  return (
    <div className="flex flex-col items-center justify-center relative py-12 z-10">
      <div className="relative group flex items-center justify-center">
        <div
          className={`w-25 h-25 rounded-full ${colorClasses[color].bg} text-white flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110 cursor-pointer relative z-10`}
        >
          <Icon className="w-10 h-10" />
        </div>
      </div>
      {label && (
        <div className="mt-3 text-center relative z-20">
          <h4 className="font-bold text-slate-800 text-lg px-4 py-1.5 rounded-full bg-white/95 backdrop-blur-md shadow-sm border border-slate-200/50 inline-block relative z-20">
            {label}
          </h4>
        </div>
      )}
    </div>
  );
}

const CARD_OFFSET_CLASS = "md:-ml-12";

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
        document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
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
        (!data.mfa_prompt_dismissed_at || daysSince(data.mfa_prompt_dismissed_at) >= 7)
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

            <div className={`w-full min-h-screen bg-slate-50/50 pb-20 ${caveat.variable}`}>
              <HeroSection />

              <RoadmapProvider>
                <div className="max-w-5xl mx-auto px-6 mt-12 relative">
                  <div className="py-16 md:py-24 flex items-center justify-center text-center relative">
                    <ScrollReveal>
                      <div className="max-w-xl mx-auto">
                        <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mt-2 mb-4 leading-tight tracking-tight">
                          Where do I even start?
                        </h2>
                        <p className="text-lg md:text-xl text-slate-500 max-w-md mx-auto leading-relaxed">
                          If only someone could show me the right order.
                        </p>
                      </div>
                    </ScrollReveal>
                  </div>

                  {/* SECTION 2 — leaf start node (anchor "01") */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center py-16 relative min-h-[300px]">
                    <div className="md:col-span-5 min-w-0">
                      <ScrollReveal>
                        <h3 className="text-2xl md:text-3.5xl font-bold text-primary mt-1 mb-3 leading-tight">
                          Let&apos;s take it one step at a time.
                        </h3>
                        <p className="text-slate-500 text-base md:text-lg leading-relaxed">
                          Rahvana will guide you through your journey.
                        </p>
                      </ScrollReveal>
                    </div>
                    <div className="md:col-span-7 relative h-48 flex items-center justify-center min-w-0">
                      <Annotation
                        text="A clear path. No more guessing."
                        direction="right"
                        arrowRotation="rotate-[-45deg]"
                      />
                      <RoadmapAnchor
                        id="01"
                        color="teal"
                        className="hidden md:block absolute top-[30%] md:left-[29%] right-[35%] md:right-auto transform md:-translate-x-1/2 z-10"
                      >
                        <div className="w-8 h-8 rounded-full bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600" />
                      </RoadmapAnchor>
                    </div>
                  </div>

                  {/* SECTION 3 — Petition node (anchor "02") — centered */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center py-16 relative min-h-[300px]">
                    <div className="md:col-span-5 min-w-0">
                      <ScrollReveal>
                        <h3 className="text-2xl md:text-3.5xl font-bold text-primary mt-1 mb-3 leading-tight">
                          Everything starts with the petition.
                        </h3>
                        <p className="text-slate-500 text-base md:text-lg leading-relaxed">
                          This is where your journey begins.
                        </p>
                      </ScrollReveal>
                    </div>
                    <div className="md:col-span-7 flex justify-center min-w-0">
                      <ScrollReveal>
                        <RoadmapAnchor id="02" color="teal" className="inline-block">
                          <NodeCircle icon={Icons.FileText} label="Petition" color="teal" />
                        </RoadmapAnchor>
                      </ScrollReveal>
                    </div>
                  </div>

                  {/* SECTION 4 — card placeholder (anchor "03") — shifted left */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center py-16 relative min-h-[350px]">
                    <div className="md:col-span-5 min-w-0">
                      <ScrollReveal>
                        <h3 className="text-2xl md:text-3.5xl font-bold text-primary mt-1 mb-3 leading-tight">
                          Wait... these forms look complicated.
                        </h3>
                        <p className="text-slate-500 text-base md:text-lg leading-relaxed">
                          Long. Confusing. Full of questions I don&apos;t understand.
                        </p>
                      </ScrollReveal>
                    </div>
                    <div className="md:col-span-7 flex justify-center min-w-0">
                      <ScrollReveal
                        delayClass="reveal-delay-1"
                        className="w-full flex justify-center min-w-0"
                      >
                        <RoadmapAnchor
                          id="03"
                          color="teal"
                          className={`w-full flex justify-center min-w-0 md:w-auto md:inline-block ${CARD_OFFSET_CLASS}`}
                        >
                          <AnimationCard
                            file="wait... section animation final.html"
                            title="Immigration forms feel overwhelming"
                            w={480}
                            h={600}
                          />
                        </RoadmapAnchor>
                      </ScrollReveal>
                    </div>
                  </div>

                  {/* SECTION 5 — card placeholder (anchor "04") — shifted left */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center py-16 relative min-h-[350px]">
                    <div className="md:col-span-5 min-w-0">
                      <ScrollReveal>
                        <h3 className="text-2xl md:text-3.5xl font-bold text-primary mt-1 mb-3 leading-tight">
                          Rahvana breaks it down for you.
                        </h3>
                        <p className="text-slate-500 text-base md:text-lg leading-relaxed">
                          One section at a time. Clear. Simple. Guided.
                        </p>
                      </ScrollReveal>
                    </div>
                    <div className="md:col-span-7 flex justify-center min-w-0">
                      <ScrollReveal
                        delayClass="reveal-delay-2"
                        className="w-full flex justify-center min-w-0"
                      >
                        <RoadmapAnchor
                          id="04"
                          color="teal"
                          className={`w-full flex justify-center min-w-0 md:w-auto md:inline-block ${CARD_OFFSET_CLASS}`}
                        >
                          <AnimationCard
                            file="visa form solution final.html"
                            title="Rahvana breaks the form down section by section"
                            w={660}
                            h={430}
                          />
                        </RoadmapAnchor>
                      </ScrollReveal>
                    </div>
                  </div>

                  {/* SECTION 6 — Check node (anchor "05") — centered */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center py-16 relative min-h-[300px]">
                    <div className="md:col-span-5 min-w-0">
                      <ScrollReveal>
                        <h3 className="text-2xl md:text-3.5xl font-bold text-primary mt-1 mb-3 leading-tight">
                          That wasn&apos;t so bad.
                        </h3>
                        <p className="text-slate-500 text-base md:text-lg leading-relaxed">
                          Petition submitted! One step down. Many more to go.
                        </p>
                      </ScrollReveal>
                    </div>
                    <div className="md:col-span-7 relative flex justify-center min-w-0">
                      <ScrollReveal>
                        <div className="relative inline-block">
                          <RoadmapAnchor id="05" color="amber" className="inline-block">
                            <NodeCircle icon={Icons.Check} color="teal" />
                          </RoadmapAnchor>
                          <Annotation
                            text="Progress feels good."
                            direction="left"
                            className="right-[105%] md:right-[125%] top-[-10px] md:top-2"
                          />
                        </div>
                      </ScrollReveal>
                    </div>
                  </div>

                  {/* SECTION 7 — Documents node (anchor "06") — centered */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center py-16 relative min-h-[300px]">
                    <div className="md:col-span-5 min-w-0">
                      <ScrollReveal>
                        <h3 className="text-2xl md:text-3.5xl font-bold text-[#8a6200] mt-1 mb-3 leading-tight">
                          What&apos;s next?
                        </h3>
                        <p className="text-slate-500 text-base md:text-lg leading-relaxed">
                          The next important step is your documents.
                        </p>
                      </ScrollReveal>
                    </div>
                    <div className="md:col-span-7 flex justify-center min-w-0">
                      <ScrollReveal>
                        <RoadmapAnchor id="06" color="amber" className="inline-block">
                          <NodeCircle icon={Icons.FolderOpen} label="Documents" color="amber" />
                        </RoadmapAnchor>
                      </ScrollReveal>
                    </div>
                  </div>

                  {/* SECTION 8 — card placeholder (anchor "07") — shifted left */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center py-16 relative min-h-[350px]">
                    <div className="md:col-span-5 min-w-0">
                      <ScrollReveal>
                        <h3 className="text-2xl md:text-3.5xl font-bold text-[#8a6200] mt-1 mb-3 leading-tight">
                          So many documents... what if I miss something important?
                        </h3>
                        <p className="text-slate-500 text-base md:text-lg leading-relaxed">
                          I don&apos;t want to get delayed later.
                        </p>
                      </ScrollReveal>
                    </div>
                    <div className="md:col-span-7 flex justify-center min-w-0">
                      <ScrollReveal
                        delayClass="reveal-delay-1"
                        className="w-full flex justify-center min-w-0"
                      >
                        <RoadmapAnchor
                          id="07"
                          color="amber"
                          className={`w-full flex justify-center min-w-0 md:w-auto md:inline-block ${CARD_OFFSET_CLASS}`}
                        >
                          <AnimationCard
                            file="document_gathering_problem option 1 final.html"
                            title="Gathering documents is confusing"
                            w={380}
                            h={440}
                            bgClass="bg-slate-50 border border-slate-200/40 rounded-2xl shadow-sm"
                          />
                        </RoadmapAnchor>
                      </ScrollReveal>
                    </div>
                  </div>

                  {/* SECTION 9 — card placeholder (anchor "08") — shifted left */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center py-16 relative min-h-[350px]">
                    <div className="md:col-span-5 min-w-0">
                      <ScrollReveal>
                        <h3 className="text-2xl md:text-3.5xl font-bold text-[#8a6200] mt-1 mb-3 leading-tight">
                          Rahvana tells you exactly what documents you need.
                        </h3>
                        <p className="text-slate-500 text-base md:text-lg leading-relaxed">
                          Track required documents, upload your files, and keep everything organized
                          in one place.
                        </p>
                      </ScrollReveal>
                    </div>
                    <div className="md:col-span-7 flex justify-center min-w-0">
                      <ScrollReveal
                        delayClass="reveal-delay-2"
                        className="w-full flex justify-center min-w-0"
                      >
                        <RoadmapAnchor
                          id="08"
                          color="amber"
                          className={`w-full flex justify-center min-w-0 md:w-auto md:inline-block ${CARD_OFFSET_CLASS}`}
                        >
                          <AnimationCard
                            file="rahvana-document-vault-v3 final.html"
                            title="Rahvana's document vault keeps everything organized"
                            w={480}
                            h={640}
                          />
                        </RoadmapAnchor>
                      </ScrollReveal>
                    </div>
                  </div>

                  {/* SECTION 10 — FolderCheck node (anchor "09") — centered */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center py-16 relative min-h-[300px]">
                    <div className="md:col-span-5 min-w-0">
                      <ScrollReveal>
                        <h3 className="text-2xl md:text-3.5xl font-bold text-[#8a6200] mt-1 mb-3 leading-tight">
                          Finally, I know I have everything.
                        </h3>
                        <p className="text-slate-500 text-base md:text-lg leading-relaxed">
                          One less thing to worry about.
                        </p>
                      </ScrollReveal>
                    </div>
                    <div className="md:col-span-7 relative flex justify-center min-w-0">
                      <ScrollReveal>
                        <div className="relative inline-block">
                          <RoadmapAnchor id="09" color="purple" className="inline-block">
                            <NodeCircle icon={Icons.FolderCheck} color="amber" />
                          </RoadmapAnchor>
                          <Annotation
                            text="This feels relieving."
                            direction="right"
                            className="left-[105%] md:left-[125%] top-[-5px] md:top-4"
                          />
                        </div>
                      </ScrollReveal>
                    </div>
                  </div>

                  {/* SECTION 11 — Finance node (anchor "10") — centered */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center py-16 relative min-h-[300px]">
                    <div className="md:col-span-5 min-w-0">
                      <ScrollReveal>
                        <h3 className="text-2xl md:text-3.5xl font-bold text-[#4a2d8a] mt-1 mb-3 leading-tight">
                          Next up, the financial part.
                        </h3>
                        <p className="text-slate-500 text-base md:text-lg leading-relaxed">
                          Let&apos;s make sense of it.
                        </p>
                      </ScrollReveal>
                    </div>
                    <div className="md:col-span-7 flex justify-center min-w-0">
                      <ScrollReveal>
                        <RoadmapAnchor id="10" color="purple" className="inline-block">
                          <NodeCircle icon={Icons.Calculator} label="Finance" color="purple" />
                        </RoadmapAnchor>
                      </ScrollReveal>
                    </div>
                  </div>

                  {/* SECTION 12 — card placeholder (anchor "11") — shifted left */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center py-16 relative min-h-[350px]">
                    <div className="md:col-span-5 min-w-0">
                      <ScrollReveal>
                        <h3 className="text-2xl md:text-3.5xl font-bold text-[#4a2d8a] mt-1 mb-3 leading-tight">
                          Do I qualify? What if I don&apos;t make enough?
                        </h3>
                        <p className="text-slate-500 text-base md:text-lg leading-relaxed">
                          The rules are confusing and everyone says something different.
                        </p>
                      </ScrollReveal>
                    </div>
                    <div className="md:col-span-7 flex justify-center min-w-0">
                      <ScrollReveal
                        delayClass="reveal-delay-1"
                        className="w-full flex justify-center min-w-0"
                      >
                        <RoadmapAnchor
                          id="11"
                          color="purple"
                          className={`w-full flex justify-center min-w-0 md:w-auto md:inline-block ${CARD_OFFSET_CLASS}`}
                        >
                          <AnimationCard
                            file="rahvana_sponsorship_anxiety_v4 final.html"
                            title="Worrying about whether you financially qualify"
                            w={460}
                            h={360}
                            bgClass="bg-slate-50 border border-slate-200/40 rounded-2xl shadow-sm"
                          />
                        </RoadmapAnchor>
                      </ScrollReveal>
                    </div>
                  </div>

                  {/* SECTION 13 — card placeholder (anchor "12") — shifted left */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center py-16 relative min-h-[350px]">
                    <div className="md:col-span-5 min-w-0">
                      <ScrollReveal>
                        <h3 className="text-2xl md:text-3.5xl font-bold text-[#4a2d8a] mt-1 mb-3 leading-tight">
                          Rahvana gives you a clear answer.
                        </h3>
                        <p className="text-slate-500 text-base md:text-lg leading-relaxed">
                          We&apos;ll calculate it for your situation so you know where you stand.
                        </p>
                      </ScrollReveal>
                    </div>
                    <div className="md:col-span-7 flex justify-center min-w-0">
                      <ScrollReveal
                        delayClass="reveal-delay-2"
                        className="w-full flex justify-center min-w-0"
                      >
                        <RoadmapAnchor
                          id="12"
                          color="purple"
                          className={`w-full flex justify-center min-w-0 md:w-auto md:inline-block ${CARD_OFFSET_CLASS}`}
                        >
                          <AnimationCard
                            file="sponsorship calculator solution final.html"
                            title="Rahvana calculates whether you qualify"
                            w={484}
                            h={448}
                          />
                        </RoadmapAnchor>
                      </ScrollReveal>
                    </div>
                  </div>

                  {/* SECTION 14 — Interview node (anchor "13") — centered */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center py-16 relative min-h-[300px]">
                    <div className="md:col-span-5 min-w-0">
                      <ScrollReveal>
                        <h3 className="text-2xl md:text-3.5xl font-bold text-[#c0596a] mt-1 mb-3 leading-tight">
                          Almost there.
                        </h3>
                        <p className="text-slate-500 text-base md:text-lg leading-relaxed">
                          Now let&apos;s get you ready for the interview.
                        </p>
                      </ScrollReveal>
                    </div>
                    <div className="md:col-span-7 flex justify-center min-w-0">
                      <ScrollReveal>
                        <RoadmapAnchor id="13" color="rose" className="inline-block">
                          <NodeCircle icon={Icons.Users} label="Interview" color="rose" />
                        </RoadmapAnchor>
                      </ScrollReveal>
                    </div>
                  </div>

                  {/* SECTION 15 — card placeholder (anchor "14") — shifted left */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center py-16 relative min-h-[350px]">
                    <div className="md:col-span-5 min-w-0">
                      <ScrollReveal>
                        <h3 className="text-2xl md:text-3.5xl font-bold text-[#c0596a] mt-1 mb-3 leading-tight">
                          The interview makes me nervous.
                        </h3>
                        <p className="text-slate-500 text-base md:text-lg leading-relaxed">
                          What if they ask something I don&apos;t know? What if I forget everything?
                        </p>
                      </ScrollReveal>
                    </div>
                    <div className="md:col-span-7 flex justify-center min-w-0">
                      <ScrollReveal
                        delayClass="reveal-delay-1"
                        className="w-full flex justify-center min-w-0"
                      >
                        <RoadmapAnchor
                          id="14"
                          color="rose"
                          className={`w-full flex justify-center min-w-0 md:w-auto md:inline-block ${CARD_OFFSET_CLASS}`}
                        >
                          <AnimationCard
                            file="rahvana_question_stack_standalone_final.html"
                            title="Interview anxiety — what if I forget?"
                            w={450}
                            h={640}
                            maxH={640}
                          />
                        </RoadmapAnchor>
                      </ScrollReveal>
                    </div>
                  </div>

                  {/* SECTION 16 — card placeholder (anchor "15") — shifted left */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center py-16 relative min-h-[350px]">
                    <div className="md:col-span-5 min-w-0">
                      <ScrollReveal>
                        <h3 className="text-2xl md:text-3.5xl font-bold text-[#c0596a] mt-1 mb-3 leading-tight">
                          Rahvana helps you prepare with confidence.
                        </h3>
                        <p className="text-slate-500 text-base md:text-lg leading-relaxed">
                          Practice, get feedback, and walk in ready.
                        </p>
                      </ScrollReveal>
                    </div>
                    <div className="md:col-span-7 flex justify-center min-w-0">
                      <ScrollReveal
                        delayClass="reveal-delay-2"
                        className="w-full flex justify-center min-w-0"
                      >
                        <RoadmapAnchor
                          id="15"
                          color="rose"
                          className={`w-full flex justify-center min-w-0 md:w-auto md:inline-block ${CARD_OFFSET_CLASS}`}
                        >
                          <AnimationCard
                            file="rahvana_visa_prep_animation.html"
                            title="Rahvana helps you prepare with confidence"
                            w={560}
                            h={480}
                          />
                        </RoadmapAnchor>
                      </ScrollReveal>
                    </div>
                  </div>

                  {/* SECTION 17 — Visa Approval node (anchor "16") — centered */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center py-16 relative min-h-[300px]">
                    <div className="md:col-span-5 min-w-0">
                      <ScrollReveal>
                        <h3 className="text-2xl md:text-3.5xl font-bold text-primary mt-1 mb-3 leading-tight">
                          Visa Approved
                        </h3>
                        <p className="text-slate-500 text-base md:text-lg leading-relaxed font-medium">
                          The final milestone in your journey. Your passport is stamped, and you are
                          officially ready to begin your new life together.
                        </p>
                      </ScrollReveal>
                    </div>
                    <div className="md:col-span-7 flex justify-center min-w-0">
                      <ScrollReveal>
                        <RoadmapAnchor id="16" color="green" className="inline-block">
                          <NodeCircle
                            icon={Icons.CheckCircle}
                            label="Visa Approval"
                            color="green"
                          />
                        </RoadmapAnchor>
                      </ScrollReveal>
                    </div>
                  </div>

                  {/* SECTION 18 — final Welcome node (anchor "17") — centered */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center py-16 relative min-h-[300px]">
                    <div className="md:col-span-6 md:pr-6 min-w-0">
                      <ScrollReveal>
                        <h3 className="text-2xl md:text-3.5xl font-bold text-primary mt-1 mb-4 leading-tight">
                          Navigate your spouse visa journey with clarity and confidence
                        </h3>
                        <p className="text-slate-600 text-base md:text-lg leading-relaxed font-medium">
                          Whether you&apos;re completing your application, gathering documents,
                          preparing for an interview, or moving to the next step, Rahvana helps you
                          understand where you are, what to do and what comes next.
                        </p>
                      </ScrollReveal>
                    </div>
                    <div className="md:col-span-6 relative flex justify-center min-w-0">
                      <ScrollReveal>
                        <RoadmapAnchor id="17" color="green" className="inline-block">
                          <NodeCircle icon={Icons.ThumbsUp} color="green" />
                        </RoadmapAnchor>
                        {/* <Annotation text="Reunited at last!" direction="left" /> */}
                      </ScrollReveal>
                    </div>
                  </div>
                </div>
              </RoadmapProvider>

              {/* SECTION — Toolkit / ToolDock */}
              <ToolsDock />
            </div>

            <JourneyConsultationBand>
              {/* <TwoWaysScene /> */}
              <ConsultationBanner onConsultationClick={handleConsultationClick} />

              {/* TESTIMONIALS (moved from About page) */}
              <section className="py-24 px-8 md:px-20 text-center">
                <div className="flex justify-center mb-5">
                  <span className="inline-flex items-center gap-2 px-4 py-1.5 border-[1.5px] border-[#b5451b] rounded-full text-[11px] font-semibold tracking-widest text-[#b5451b] uppercase">
                    Voices From The Journey
                  </span>
                </div>
                <h2 className="font-serif font-bold text-3xl md:text-5xl text-[#121e2e] mb-14 max-w-4xl mx-auto leading-tight">
                  Words from people{" "}
                  <em className="italic text-[#0d7a75] font-normal">who&apos;ve been there.</em>
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                  {[
                    {
                      bg: "bg-[#fde8ec]",
                      iconBg: "bg-[#fbc8d2]",
                      author: "Ayesha W.",
                      role: "IR-1 applicant · Islamabad",
                      text: "For the first time, I felt like someone had actually thought about what this process feels like to go through — not just the steps, but the weight of it.",
                    },
                    {
                      bg: "bg-[#e3edf9]",
                      iconBg: "bg-[#c4d9f5]",
                      author: "Karim U.",
                      role: "US Citizen sponsor · Chicago",
                      text: "Three years of waiting. Rahvana helped me understand where I was in the process without the constant anxiety of not knowing what comes next.",
                    },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className={`${item.bg} rounded-[20px] p-9 text-left flex flex-col gap-6 shadow-sm`}
                    >
                      <div
                        className={`${item.iconBg} w-9 h-9 rounded-lg flex items-center justify-center text-[#0d7a75]`}
                      >
                        <Icons.Quote size={20} fill="currentColor" />
                      </div>
                      <blockquote className="text-sm italic text-gray-600 leading-relaxed grow">
                        &quot;{item.text}&quot;
                      </blockquote>
                      <div className="text-sm">
                        <strong className="block text-[#121e2e] font-semibold">
                          {item.author}
                        </strong>
                        <span className="text-xs text-gray-500">{item.role}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="py-8 md:py-12" id="faq">
                <div className="w-full mx-auto px-6 sm:px-8 md:px-12 2xl:px-30">
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

                  <div className="w-full md:w-[90%] lg:w-[88%] mx-auto space-y-4">
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
                            : "border-border bg-card/60 hover:border-rahvana-primary/30"
                        }`}
                      >
                        <HydrationSafeButton
                          onClick={() => setOpenFAQ(openFAQ === i ? null : i)}
                          className="w-full px-4 sm:px-5 md:px-5 py-4 md:py-5 text-left flex items-center justify-between"
                        >
                          <span className="text-lg font-bold text-foreground pr-3 md:pr-5">
                            {t(`homePage.faqs.q${i + 1}.q`) || faq.q}
                          </span>
                          <div
                            className={`w-6 h-6 md:h-8 md:w-8 shrink-0 rounded-full border flex items-center justify-center transition-all ${
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
                              <div className="px-4 sm:px-5 md:px-5 pb-5 text-muted-foreground leading-relaxed border-t border-rahvana-primary/10 pt-3">
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
            </JourneyConsultationBand>

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

        {activeSection === "journeys" && <VisaCategorySection onNavigate={handleNavigate} />}

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

      {showComingSoon && <ComingSoonModal open={showComingSoon} onOpenChange={setShowComingSoon} />}
    </div>
  );
}
