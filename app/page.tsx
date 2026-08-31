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
import Intro from "./(main)/home-page/intro";
import SectionBird from "./(main)/home-page/SectionBird";
import MobileJourneyRoadmap from "./(main)/home-page/MobileJourneyRoadmap";
import ConsultationSection from "./components/home-page/ConsultationSection";
import { Star, User, ShieldCheck } from "lucide-react";

import { ir1journeyHref } from "@/lib/constants/routes";

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
        className="absolute h-[260px] w-[260px] rounded-full opacity-20 mix-blend-screen sm:h-[500px] sm:w-[500px]"
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
        className="absolute h-[220px] w-[220px] rounded-full opacity-20 mix-blend-screen sm:h-[400px] sm:w-[400px]"
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
        className="absolute h-[160px] w-[160px] rounded-full opacity-10 mix-blend-screen sm:h-[300px] sm:w-[300px]"
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
        className="absolute top-1/2 right-[-18%] z-0 flex -translate-y-1/2 items-center justify-center rounded-full sm:right-[-10%] sm:z-10 md:right-[5%]"
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
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-90">
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
        className="absolute top-[16%] left-[58%] z-0 rounded-xl p-2.5 shadow-2xl backdrop-blur-md sm:top-[20%] sm:left-[55%] sm:z-20 sm:p-3.5"
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
        className="absolute bottom-[16%] left-[10%] z-0 rounded-xl p-2.5 shadow-2xl backdrop-blur-md sm:bottom-[20%] sm:left-[40%] sm:z-20 sm:p-3.5"
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
        className="absolute top-[72%] right-[28%] z-0 rounded-full p-2 backdrop-blur-md sm:top-[70%] sm:right-[35%] sm:z-10 sm:p-2.5"
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

// Anchor ids where the copy is Rahvana speaking (guiding/answering/narrating),
// as opposed to the user's worry or relief. A segment renders solid when it
// ARRIVES at a Rahvana-voiced anchor — dashed otherwise — so the path itself
// carries the back-and-forth rhythm of the conversation, no per-line marker needed.
// Headings at these ids also carry the "sender" typography (bold, upright);
// the complementary ids (03, 05, 07, 09, 11, 14) carry the "receiver" voice —
// smaller, lighter, slightly tilted, colored to match that section's path —
// see the heading className on each section.
// 01 "Let's take it one step at a time..."      — Rahvana
// 02 "Everything starts with the petition..."    — Rahvana
// 03 "Wait... these forms look complicated"      — User
// 04 "Rahvana breaks it down for you"            — Rahvana
// 05 "That wasn't so bad"                        — User
// 06 "What's next?... your documents"            — Rahvana
// 07 "So many documents... what if I miss..."    — User
// 08 "Rahvana tells you exactly..."              — Rahvana
// 09 "Finally, I know I have everything"         — User
// 10 "Next up, the financial part"               — Rahvana
// 11 "Do I qualify?..."                          — User
// 12 "Rahvana gives you a clear answer"          — Rahvana
// 13 "Almost there... ready for the interview"   — Rahvana
// 14 "The interview makes me nervous"            — User
// 15 "Rahvana helps you prepare with confidence" — Rahvana
// 16 "Visa Approved..."                          — Rahvana
// 17 closing statement                           — neutral
const RAHVANA_NODE_IDS = new Set(["01", "02", "04", "06", "08", "10", "12", "13", "15", "16"]);

function RoadmapProvider({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const anchorsRef = useRef<Map<string, AnchorEntry>>(new Map());
  const [pathSegments, setPathSegments] = useState<
    { d: string; color: AnchorColor; yStart: number; yEnd: number; isAnswer: boolean }[]
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
        id,
        x: r.left + r.width / 2 - containerRect.left,
        y: r.top + r.height / 2 - containerRect.top,
        color,
      };
    });

    if (points.length < 2) {
      setPathSegments([]);
      return;
    }

    const segments: {
      d: string;
      color: AnchorColor;
      yStart: number;
      yEnd: number;
      isAnswer: boolean;
    }[] = [];
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
      segments.push({
        d,
        color: p1.color,
        yStart: p1.y,
        yEnd: p2.y,
        isAnswer: RAHVANA_NODE_IDS.has(p2.id),
      });
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

  // Compute each segment's scroll progress once and reuse it for the SVG
  // path reveal below. (The cursor-dot HTML layer that used to consume
  // `progress` for a per-frame indicator was removed — the mask/dashoffset
  // reveal on the path itself is enough of a "presence" cue on scroll.)
  const segmentProgress = pathSegments.map((seg, i) => {
    const length = pathLengths[i] || 0;
    // Trigger point sits at the vertical middle of the viewport rather than
    // near the bottom — anchoring reveal position to roughly where the eye
    // is reading, instead of letting it race ahead to whatever has merely
    // scrolled into the bottom edge of the screen.
    const revealY = scrollY + (windowHeightRef.current || 800) * 0.5;
    const currentY = revealY - containerTopRef.current;

    let progress = 0;
    if (currentY >= seg.yEnd) {
      progress = 1;
    } else if (currentY <= seg.yStart) {
      progress = 0;
    } else if (seg.yEnd > seg.yStart) {
      progress = (currentY - seg.yStart) / (seg.yEnd - seg.yStart);
    }

    const activeLength = length || 1000;
    const dashOffset = activeLength * (1 - progress);
    return { progress, activeLength, dashOffset };
  });

  return (
    <RoadmapContext.Provider value={{ register }}>
      <div ref={containerRef} className="relative">
        <svg
          className="pointer-events-none absolute inset-0 z-[2] hidden w-full md:block"
          style={{ height: svgHeight }}
          width="100%"
          preserveAspectRatio="none"
        >
          {pathSegments.map((seg, i) => {
            const { activeLength, dashOffset } = segmentProgress[i];

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
                {/* Glow layer underneath */}
                <path
                  d={seg.d}
                  fill="none"
                  stroke={strokeColors[seg.color]}
                  strokeWidth="3.5"
                  className="opacity-[0.12] blur-[1px]"
                  mask={`url(#roadmap-mask-${i})`}
                />
                {/* Main path — solid when this segment arrives at a Rahvana-voiced
                    anchor (a reply), dotted when it arrives at a user line */}
                <path
                  ref={(el) => {
                    pathRefs.current[i] = el;
                  }}
                  d={seg.d}
                  fill="none"
                  stroke={strokeColors[seg.color]}
                  strokeWidth="2.2"
                  strokeDasharray="5,5"
                  className="opacity-75"
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
        className={`${caveat.className} text-lg leading-tight font-medium text-slate-500 md:text-xl`}
      >
        {text}
      </p>
      {direction === "left" ? (
        <svg
          className={`-mt-1 ml-6 h-10 w-10 text-slate-400/80 ${arrowRotation || "rotate-[-25deg]"}`}
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
          className={`-mt-1 mr-6 h-10 w-10 text-slate-400/80 ${arrowRotation || "rotate-[75deg]"}`}
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
  onClick,
  href,
}: {
  icon: React.ComponentType<any>;
  label?: string;
  badgeNum?: string;
  color: "teal" | "amber" | "purple" | "rose" | "green";
  onClick?: () => void;
  href?: string;
}) {
  const colorClasses = {
    teal: { bg: "bg-[#0d7377]" },
    amber: { bg: "bg-[#8a6200]" },
    purple: { bg: "bg-[#4a2d8a]" },
    rose: { bg: "bg-[#c0596a]" },
    green: { bg: "bg-[#15744f]" },
  };

  const isInteractive = !!(onClick || href);

  // Interactive nodes (the final CTA) get the richer gradient + lift
  // treatment so the finish line feels like an arrival, not just another
  // step. Teal-green, picked from the swatch grid to sit well against the
  // mint-tinted section background. Static roadmap markers stay flat solid.
  const circleBg =
    isInteractive && color === "green"
      ? "bg-gradient-to-br from-[#0e6b52] to-[#0a5240] group-hover:from-[#149470] group-hover:to-[#0e6b52]"
      : colorClasses[color].bg;

  // href takes precedence and renders a real navigable link; onClick without
  // href renders a button; neither renders a plain illustrative marker.
  const Wrapper: React.ElementType = href ? Link : onClick ? "button" : "div";
  const wrapperProps: Record<string, unknown> = href
    ? { href }
    : onClick
      ? { onClick, type: "button" as const }
      : {};

  return (
    <div className="relative z-10 flex flex-col items-center justify-center py-12">
      <Wrapper
        {...wrapperProps}
        className={`group relative flex items-center justify-center ${
          isInteractive
            ? "rounded-full focus:outline-none focus-visible:ring-4 focus-visible:ring-current focus-visible:ring-offset-2"
            : ""
        }`}
      >
        <div
          className={`h-25 w-25 rounded-full ${circleBg} flex items-center justify-center text-white shadow-lg transition-all duration-300 group-hover:scale-110 ${
            isInteractive
              ? "group-hover:-translate-y-1 group-hover:shadow-[0_10px_40px_-8px_rgba(14,107,82,0.5)] group-active:translate-y-0 group-active:scale-100"
              : ""
          } relative z-10 cursor-pointer border border-white/20`}
        >
          {isInteractive && (
            <>
              <span
                className="pointer-events-none absolute -inset-5 rounded-full bg-[#0e6b52]/[0.08]"
                aria-hidden="true"
              />
              <span
                className="pointer-events-none absolute -inset-2.5 rounded-full bg-[#0e6b52]/[0.12]"
                aria-hidden="true"
              />
            </>
          )}

          <Icon className="h-10 w-10" />
        </div>
      </Wrapper>
      {label && (
        <div className="relative z-20 mt-3 text-center">
          <h4 className="relative z-20 inline-block rounded-full border border-slate-200/50 bg-white/95 px-4 py-1.5 text-lg font-bold text-slate-800 shadow-sm backdrop-blur-md">
            {label}
          </h4>
        </div>
      )}
    </div>
  );
}

// Renders the "user voice" lines that punctuate the roadmap — no bubble, no
// box, no icon. Uses the same handwritten font as the margin Annotations
// (kept modest in size, not oversized), with a faint leading ellipsis as the
// only graphic touch — echoing the hesitation already written into these
// lines ("Wait...", "So many documents...", "Almost there."). Color is
// passed per-section to match that segment's path.
function VoiceLine({
  children,
  colorClassName,
}: {
  children: React.ReactNode;
  colorClassName: string;
}) {
  return (
    <h3
      className={`${caveat.className} mb-1.5 max-w-sm text-2xl leading-snug font-normal md:text-3xl ${colorClassName}`}
    >
      <span className="mr-1 opacity-30">...</span>
      {children}
    </h3>
  );
}

// The supporting line under a VoiceLine heading is the same voice, just
// trailing off — same handwritten font, smaller and lighter, no separate
// styling language from the paragraph copy used in Rahvana's sections.
function VoiceSubtext({ children }: { children: React.ReactNode }) {
  return (
    <p className={`${caveat.className} max-w-sm text-lg leading-relaxed text-slate-500 md:text-xl`}>
      {children}
    </p>
  );
}

// A softer, delayed sibling of ScrollReveal used only for voice lines — it
// settles at 85% opacity with a short pause before easing in, so the line
// lands like a beat of hesitation rather than snapping in at full strength.
function VoiceReveal({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold: 0.1, rootMargin: "0px 0px -80px 0px" }
    );
    observer.observe(el);
    return () => observer.unobserve(el);
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 0.85 : 0,
        transform: visible ? "translateY(0)" : "translateY(6px)",
        transition: "opacity 900ms ease-out 220ms, transform 900ms ease-out 220ms",
      }}
    >
      {children}
    </div>
  );
}

const CARD_OFFSET_CLASS = "md:-ml-12";

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="bg-background flex min-h-screen flex-col items-center justify-center">
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
    <div className="bg-background text-foreground min-h-screen overflow-x-clip font-sans">
      <main className="min-h-[calc(100vh-200px)]">
        {activeSection === "home" && (
          <div className="flex flex-col">
            {/* Use the new styled hero, but keep the same CTA and header logic */}

            <div className={`min-h-screen w-full bg-slate-50/50 ${caveat.variable}`}>
              <Intro />

              {/* Reimagined Living Timeline Roadmap — Mobile Only */}
              <MobileJourneyRoadmap />

              {/* Desktop Snake-Curve Roadmap Experience (Desktop Only) */}
              <div className="hidden md:block">
                <RoadmapProvider>
                <div className="relative w-full bg-white">
                  <div className="relative mx-auto max-w-5xl px-6">
                    <SectionBird
                      n={1}
                      side="right"
                      pos="top-[82%] -translate-y-1/2"
                      size="w-40 lg:w-52 xl:w-64"
                    />
                    <div className="relative flex items-center justify-center py-16 text-center md:py-24">
                      <ScrollReveal>
                        <div className="mx-auto max-w-xl">
                          <h2 className="mt-2 mb-4 text-3xl leading-tight font-bold tracking-tight text-slate-900 md:text-5xl">
                            Where do I even start?
                          </h2>
                          <p className="mx-auto max-w-md text-lg leading-relaxed text-slate-500 md:text-xl">
                            If only someone could show me the right order.
                          </p>
                        </div>
                      </ScrollReveal>
                    </div>
                  </div>
                </div>

                {/* SECTION 2 — leaf start node (anchor "01") — Rahvana */}
                <div
                  className="relative w-full"
                  style={{
                    background:
                      "linear-gradient(to bottom, #ffffff 0%, #f4fafa 4%, #f4fafa 96%, #ffffff 100%)",
                  }}
                >
                  <div className="relative mx-auto max-w-5xl px-6">
                    <SectionBird n={2} side="left" pos="top-[48%]" size="w-22 lg:w-32 xl:w-40" />
                    <div className="relative z-10 grid min-h-[300px] grid-cols-1 items-center gap-8 py-16 md:grid-cols-12">
                      <div className="min-w-0 md:col-span-5">
                        <ScrollReveal>
                          <h3 className="md:text-3.5xl text-primary mt-1 mb-3 text-2xl leading-tight font-bold tracking-tight">
                            Let&apos;s take it one step at a time.
                          </h3>
                          <p className="text-base leading-relaxed text-slate-500 md:text-lg">
                            Rahvana will guide you through your journey.
                          </p>
                        </ScrollReveal>
                      </div>
                      <div className="relative flex h-48 min-w-0 items-center justify-center md:col-span-7">
                        <Annotation
                          text="A clear path. No more guessing."
                          direction="right"
                          arrowRotation="rotate-[-45deg]"
                        />
                        <RoadmapAnchor
                          id="01"
                          color="teal"
                          className="absolute top-[30%] right-[35%] z-10 hidden transform md:right-auto md:left-[29%] md:block md:-translate-x-1/2"
                        >
                          <div className="relative flex h-8 w-8 items-center justify-center rounded-full border border-[#5f9d98] bg-[#7fb8b4]">
                            <div className="absolute top-1.5 left-1.5 h-1.5 w-1.5 rounded-full bg-white/60" />
                          </div>
                        </RoadmapAnchor>
                      </div>
                    </div>
                  </div>
                </div>

                {/* SECTION 3 — Petition node (anchor "02") — Rahvana — centered */}
                <div className="relative w-full bg-white">
                  <div className="relative mx-auto max-w-5xl px-6">
                    <div className="relative z-10 grid min-h-[300px] grid-cols-1 items-center gap-8 py-16 md:grid-cols-12">
                      <SectionBird n={3} side="right" pos="top-[54%]" />
                      <div className="min-w-0 md:col-span-5">
                        <ScrollReveal>
                          <h3 className="md:text-3.5xl text-primary mt-1 mb-3 text-2xl leading-tight font-bold tracking-tight">
                            Everything starts with the petition.
                          </h3>
                          <p className="text-base leading-relaxed text-slate-500 md:text-lg">
                            This is where your journey begins.
                          </p>
                        </ScrollReveal>
                      </div>
                      <div className="flex min-w-0 justify-center md:col-span-7">
                        <ScrollReveal>
                          <RoadmapAnchor id="02" color="teal" className="inline-block">
                            <NodeCircle icon={Icons.FileText} label="Petition" color="teal" />
                          </RoadmapAnchor>
                        </ScrollReveal>
                      </div>
                    </div>
                  </div>
                </div>

                {/* SECTION 4 — card placeholder (anchor "03") — User voice — shifted left */}
                <div
                  className="relative w-full"
                  style={{
                    background:
                      "linear-gradient(to bottom, #ffffff 0%, #f4fafa 4%, #f4fafa 96%, #ffffff 100%)",
                  }}
                >
                  <div className="relative mx-auto max-w-5xl px-6">
                    <div className="relative z-10 grid min-h-[350px] grid-cols-1 items-center gap-8 py-16 md:grid-cols-12">
                      <SectionBird n={4} side="left" pos="top-[72%]" />
                      <div className="min-w-0 md:col-span-5">
                        <ScrollReveal>
                          <VoiceReveal>
                            <VoiceLine colorClassName="text-primary/70">
                              Wait... these forms look complicated.
                            </VoiceLine>
                            <VoiceSubtext>
                              Long. Confusing. Full of questions I don&apos;t understand.
                            </VoiceSubtext>
                          </VoiceReveal>
                        </ScrollReveal>
                      </div>
                      <div className="flex min-w-0 justify-center md:col-span-7">
                        <ScrollReveal
                          delayClass="reveal-delay-1"
                          className="flex w-full min-w-0 justify-center"
                        >
                          <RoadmapAnchor
                            id="03"
                            color="teal"
                            className={`flex w-full min-w-0 justify-center md:inline-block md:w-auto ${CARD_OFFSET_CLASS}`}
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
                  </div>
                </div>

                {/* SECTION 5 — card placeholder (anchor "04") — Rahvana — shifted left */}
                <div className="relative w-full bg-white">
                  <div className="relative mx-auto max-w-5xl px-6">
                    <div className="relative z-10 grid min-h-[350px] grid-cols-1 items-center gap-8 py-16 md:grid-cols-12">
                      <SectionBird n={5} side="left" pos="top-[68%]" />
                      <div className="min-w-0 md:col-span-5">
                        <ScrollReveal>
                          <h3 className="md:text-3.5xl text-primary mt-1 mb-3 text-2xl leading-tight font-bold tracking-tight">
                            Rahvana breaks it down for you.
                          </h3>
                          <p className="text-base leading-relaxed text-slate-500 md:text-lg">
                            One section at a time. Clear. Simple. Guided.
                          </p>
                        </ScrollReveal>
                      </div>
                      <div className="flex min-w-0 justify-center md:col-span-7">
                        <ScrollReveal
                          delayClass="reveal-delay-2"
                          className="flex w-full min-w-0 justify-center"
                        >
                          <RoadmapAnchor
                            id="04"
                            color="teal"
                            className={`flex w-full min-w-0 justify-center md:inline-block md:w-auto ${CARD_OFFSET_CLASS}`}
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
                  </div>
                </div>

                {/* SECTION 6 — Check node (anchor "05") — User voice — centered */}
                <div
                  className="relative w-full"
                  style={{
                    background:
                      "linear-gradient(to bottom, #ffffff 0%, #f4fafa 4%, #f4fafa 96%, #ffffff 100%)",
                  }}
                >
                  <SectionBird
                    n={6}
                    side="left"
                    className="left-0"
                    pos="top-[54%]"
                    size="w-34 lg:w-486 xl:w-54"
                  />
                  <div className="relative mx-auto max-w-5xl px-6">
                    <div className="relative z-10 grid min-h-[300px] grid-cols-1 items-center gap-8 py-16 md:grid-cols-12">
                      <div className="min-w-0 md:col-span-5">
                        <ScrollReveal>
                          <VoiceReveal>
                            <VoiceLine colorClassName="text-primary/70">
                              That wasn&apos;t so bad.
                            </VoiceLine>
                            <VoiceSubtext>
                              Petition submitted! One step down. Many more to go.
                            </VoiceSubtext>
                          </VoiceReveal>
                        </ScrollReveal>
                      </div>
                      <div className="relative flex min-w-0 justify-center md:col-span-7">
                        <ScrollReveal>
                          <div className="relative inline-block">
                            <RoadmapAnchor id="05" color="amber" className="inline-block">
                              <NodeCircle icon={Icons.Check} color="teal" />
                            </RoadmapAnchor>
                            <Annotation
                              text="Progress feels good."
                              direction="left"
                              className="top-[-10px] right-[105%] md:top-2 md:right-[125%]"
                            />
                          </div>
                        </ScrollReveal>
                      </div>
                    </div>
                  </div>
                </div>

                {/* SECTION 7 — Documents node (anchor "06") — Rahvana — centered */}
                <div className="relative w-full bg-white">
                  <div className="relative mx-auto max-w-5xl px-6">
                    <div className="relative z-10 grid min-h-[300px] grid-cols-1 items-center gap-8 py-16 md:grid-cols-12">
                      <SectionBird n={7} side="right" pos="top-[63%]" size="w-44 lg:w-56 xl:w-64" />
                      <div className="min-w-0 md:col-span-5">
                        <ScrollReveal>
                          <h3 className="md:text-3.5xl mt-1 mb-3 text-2xl leading-tight font-bold tracking-tight text-[#8a6200]">
                            What&apos;s next?
                          </h3>
                          <p className="text-base leading-relaxed text-slate-500 md:text-lg">
                            The next important step is your documents.
                          </p>
                        </ScrollReveal>
                      </div>
                      <div className="flex min-w-0 justify-center md:col-span-7">
                        <ScrollReveal>
                          <RoadmapAnchor id="06" color="amber" className="inline-block">
                            <NodeCircle icon={Icons.FolderOpen} label="Documents" color="amber" />
                          </RoadmapAnchor>
                        </ScrollReveal>
                      </div>
                    </div>
                  </div>
                </div>

                {/* SECTION 8 — card placeholder (anchor "07") — User voice — shifted left */}
                <div
                  className="relative w-full"
                  style={{
                    background:
                      "linear-gradient(to bottom, #ffffff 0%, #fffcf6 4%, #fffcf6 96%, #ffffff 100%)",
                  }}
                >
                  <div className="relative mx-auto max-w-5xl px-6">
                    <div className="relative z-10 grid min-h-[350px] grid-cols-1 items-center gap-8 py-16 md:grid-cols-12">
                      <SectionBird n={8} side="left" pos="top-[74%]" />
                      <div className="min-w-0 md:col-span-5">
                        <ScrollReveal>
                          <VoiceReveal>
                            <VoiceLine colorClassName="text-[#8a6200]/70">
                              So many documents... what if I miss something important?
                            </VoiceLine>
                            <VoiceSubtext>I don&apos;t want to get delayed later.</VoiceSubtext>
                          </VoiceReveal>
                        </ScrollReveal>
                      </div>
                      <div className="flex min-w-0 justify-center md:col-span-7">
                        <ScrollReveal
                          delayClass="reveal-delay-1"
                          className="flex w-full min-w-0 justify-center"
                        >
                          <RoadmapAnchor
                            id="07"
                            color="amber"
                            className={`flex w-full min-w-0 justify-center md:inline-block md:w-auto ${CARD_OFFSET_CLASS}`}
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
                  </div>
                </div>

                {/* SECTION 9 — card placeholder (anchor "08") — Rahvana — shifted left */}
                <div className="relative w-full bg-white">
                  <div className="relative mx-auto max-w-5xl px-6">
                    <div className="relative z-10 grid min-h-[350px] grid-cols-1 items-center gap-8 py-16 md:grid-cols-12">
                      <SectionBird n={9} side="left" pos="top-[68%]" />
                      <div className="min-w-0 md:col-span-5">
                        <ScrollReveal>
                          <h3 className="md:text-3.5xl mt-1 mb-3 text-2xl leading-tight font-bold tracking-tight text-[#8a6200]">
                            Rahvana tells you exactly what documents you need.
                          </h3>
                          <p className="text-base leading-relaxed text-slate-500 md:text-lg">
                            Track required documents, upload your files, and keep everything
                            organized in one place.
                          </p>
                        </ScrollReveal>
                      </div>
                      <div className="flex min-w-0 justify-center md:col-span-7">
                        <ScrollReveal
                          delayClass="reveal-delay-2"
                          className="flex w-full min-w-0 justify-center"
                        >
                          <RoadmapAnchor
                            id="08"
                            color="amber"
                            className={`flex w-full min-w-0 justify-center md:inline-block md:w-auto ${CARD_OFFSET_CLASS}`}
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
                  </div>
                </div>

                {/* SECTION 10 — FolderCheck node (anchor "09") — User voice — centered */}
                <div
                  className="relative w-full"
                  style={{
                    background:
                      "linear-gradient(to bottom, #ffffff 0%, #fffcf6 4%, #fffcf6 90%, #ffffff 100%)",
                  }}
                >
                  <div className="relative mx-auto max-w-5xl px-6">
                    <div className="relative z-10 grid min-h-[300px] grid-cols-1 items-center gap-8 py-16 md:grid-cols-12">
                      <SectionBird n={10} side="right" pos="top-[50%]" />
                      <div className="min-w-0 md:col-span-5">
                        <ScrollReveal>
                          <VoiceReveal>
                            <VoiceLine colorClassName="text-[#8a6200]/70">
                              Finally, I know I have everything.
                            </VoiceLine>
                            <VoiceSubtext>One less thing to worry about.</VoiceSubtext>
                          </VoiceReveal>
                        </ScrollReveal>
                      </div>
                      <div className="relative flex min-w-0 justify-center md:col-span-7">
                        <ScrollReveal>
                          <div className="relative inline-block">
                            <RoadmapAnchor id="09" color="purple" className="inline-block">
                              <NodeCircle icon={Icons.FolderCheck} color="amber" />
                            </RoadmapAnchor>
                            <Annotation
                              text="This feels relieving."
                              direction="right"
                              className="top-[-5px] left-[105%] md:top-4 md:left-[125%]"
                            />
                          </div>
                        </ScrollReveal>
                      </div>
                    </div>
                  </div>
                </div>

                {/* SECTION 11 — Finance node (anchor "10") — Rahvana — centered */}
                <div className="relative w-full bg-white">
                  <div className="relative mx-auto max-w-5xl px-6">
                    <div className="relative z-10 grid min-h-[300px] grid-cols-1 items-center gap-8 py-16 md:grid-cols-12">
                      <SectionBird n={11} side="right" pos="top-[54%]" />
                      <div className="min-w-0 md:col-span-5">
                        <ScrollReveal>
                          <h3 className="md:text-3.5xl mt-1 mb-3 text-2xl leading-tight font-bold tracking-tight text-[#4a2d8a]">
                            Next up, the financial part.
                          </h3>
                          <p className="text-base leading-relaxed text-slate-500 md:text-lg">
                            Let&apos;s make sense of it.
                          </p>
                        </ScrollReveal>
                      </div>
                      <div className="flex min-w-0 justify-center md:col-span-7">
                        <ScrollReveal>
                          <RoadmapAnchor id="10" color="purple" className="inline-block">
                            <NodeCircle icon={Icons.Calculator} label="Finance" color="purple" />
                          </RoadmapAnchor>
                        </ScrollReveal>
                      </div>
                    </div>
                  </div>
                </div>

                {/* SECTION 12 — card placeholder (anchor "11") — User voice — shifted left */}
                <div
                  className="relative w-full"
                  style={{
                    background:
                      "linear-gradient(to bottom, #ffffff 0%, #f5f1f9 4%, #f5f1f9 90%, #ffffff 100%)",
                  }}
                >
                  <div className="relative mx-auto max-w-5xl px-6">
                    <div className="relative z-10 grid min-h-[350px] grid-cols-1 items-center gap-8 py-16 md:grid-cols-12">
                      <SectionBird n={12} side="left" pos="top-[64%]" />
                      <div className="min-w-0 md:col-span-5">
                        <ScrollReveal>
                          <VoiceReveal>
                            <VoiceLine colorClassName="text-[#4a2d8a]/70">
                              Do I qualify? What if I don&apos;t make enough?
                            </VoiceLine>
                            <VoiceSubtext>
                              The rules are confusing and everyone says something different.
                            </VoiceSubtext>
                          </VoiceReveal>
                        </ScrollReveal>
                      </div>
                      <div className="flex min-w-0 justify-center md:col-span-7">
                        <ScrollReveal
                          delayClass="reveal-delay-1"
                          className="flex w-full min-w-0 justify-center"
                        >
                          <RoadmapAnchor
                            id="11"
                            color="purple"
                            className={`flex w-full min-w-0 justify-center md:inline-block md:w-auto ${CARD_OFFSET_CLASS}`}
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
                  </div>
                </div>

                {/* SECTION 13 — card placeholder (anchor "12") — Rahvana — shifted left */}
                <div className="relative w-full bg-white">
                  <div className="relative mx-auto max-w-5xl px-6">
                    <div className="relative z-10 grid min-h-[350px] grid-cols-1 items-center gap-8 py-16 md:grid-cols-12">
                      <SectionBird n={13} side="left" pos="top-[68%]" />
                      <div className="min-w-0 md:col-span-5">
                        <ScrollReveal>
                          <h3 className="md:text-3.5xl mt-1 mb-3 text-2xl leading-tight font-bold tracking-tight text-[#4a2d8a]">
                            Rahvana gives you a clear answer.
                          </h3>
                          <p className="text-base leading-relaxed text-slate-500 md:text-lg">
                            We&apos;ll calculate it for your situation so you know where you stand.
                          </p>
                        </ScrollReveal>
                      </div>
                      <div className="flex min-w-0 justify-center md:col-span-7">
                        <ScrollReveal
                          delayClass="reveal-delay-2"
                          className="flex w-full min-w-0 justify-center"
                        >
                          <RoadmapAnchor
                            id="12"
                            color="purple"
                            className={`flex w-full min-w-0 justify-center md:inline-block md:w-auto ${CARD_OFFSET_CLASS}`}
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
                  </div>
                </div>

                {/* SECTION 14 — Interview node (anchor "13") — Rahvana — centered */}
                <div
                  className="relative w-full"
                  style={{
                    background:
                      "linear-gradient(to bottom, #ffffff 0%, #fef6f7 4%, #fef6f7 90%, #ffffff 100%)",
                  }}
                >
                  <div className="relative mx-auto max-w-5xl px-6">
                    <div className="relative z-10 grid min-h-[300px] grid-cols-1 items-center gap-8 py-16 md:grid-cols-12">
                      <SectionBird n={14} side="right" pos="top-[60%]" />
                      <div className="min-w-0 md:col-span-5">
                        <ScrollReveal>
                          <h3 className="md:text-3.5xl mt-1 mb-3 text-2xl leading-tight font-bold tracking-tight text-[#c0596a]">
                            Almost there.
                          </h3>
                          <p className="text-base leading-relaxed text-slate-500 md:text-lg">
                            Now let&apos;s get you ready for the interview.
                          </p>
                        </ScrollReveal>
                      </div>
                      <div className="flex min-w-0 justify-center md:col-span-7">
                        <ScrollReveal>
                          <RoadmapAnchor id="13" color="rose" className="inline-block">
                            <NodeCircle icon={Icons.Users} label="Interview" color="rose" />
                          </RoadmapAnchor>
                        </ScrollReveal>
                      </div>
                    </div>
                  </div>
                </div>

                {/* SECTION 15 — card placeholder (anchor "14") — User voice — shifted left */}
                <div className="relative w-full bg-white">
                  <div className="relative mx-auto max-w-5xl px-6">
                    <div className="relative z-10 grid min-h-[350px] grid-cols-1 items-center gap-8 py-16 md:grid-cols-12">
                      <SectionBird n={15} side="left" pos="top-[80%]" />
                      <div className="min-w-0 md:col-span-5">
                        <ScrollReveal>
                          <VoiceReveal>
                            <VoiceLine colorClassName="text-[#c0596a]/70">
                              The interview makes me nervous.
                            </VoiceLine>
                            <VoiceSubtext>
                              What if they ask something I don&apos;t know? What if I forget
                              everything?
                            </VoiceSubtext>
                          </VoiceReveal>
                        </ScrollReveal>
                      </div>
                      <div className="flex min-w-0 justify-center md:col-span-7">
                        <ScrollReveal
                          delayClass="reveal-delay-1"
                          className="flex w-full min-w-0 justify-center"
                        >
                          <RoadmapAnchor
                            id="14"
                            color="rose"
                            className={`flex w-full min-w-0 justify-center md:inline-block md:w-auto ${CARD_OFFSET_CLASS}`}
                          >
                            <AnimationCard
                              file="rahvana_question_stack_standalone_final.html"
                              title="Interview anxiety, what if I forget?"
                              w={450}
                              h={640}
                              maxH={640}
                            />
                          </RoadmapAnchor>
                        </ScrollReveal>
                      </div>
                    </div>
                  </div>
                </div>

                {/* SECTION 16 — card placeholder (anchor "15") — Rahvana — shifted left */}
                <div
                  className="relative w-full"
                  style={{
                    background:
                      "linear-gradient(to bottom, #ffffff 0%, #fef6f7 4%, #fef6f7 90%, #ffffff 100%)",
                  }}
                >
                  <div className="relative mx-auto max-w-5xl px-6">
                    <div className="relative z-10 grid min-h-[350px] grid-cols-1 items-center gap-8 py-16 md:grid-cols-12">
                      <SectionBird n={16} side="left" pos="top-[66%]" />
                      <div className="min-w-0 md:col-span-5">
                        <ScrollReveal>
                          <h3 className="md:text-3.5xl mt-1 mb-3 text-2xl leading-tight font-bold tracking-tight text-[#c0596a]">
                            Rahvana helps you prepare with confidence.
                          </h3>
                          <p className="text-base leading-relaxed text-slate-500 md:text-lg">
                            Practice, get feedback, and walk in ready.
                          </p>
                        </ScrollReveal>
                      </div>
                      <div className="flex min-w-0 justify-center md:col-span-7">
                        <ScrollReveal
                          delayClass="reveal-delay-2"
                          className="flex w-full min-w-0 justify-center"
                        >
                          <RoadmapAnchor
                            id="15"
                            color="rose"
                            className={`flex w-full min-w-0 justify-center md:inline-block md:w-auto ${CARD_OFFSET_CLASS}`}
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
                  </div>
                </div>

                {/* SECTION 17 — Visa Approval node (anchor "16") — Rahvana — centered */}
                <div className="relative w-full bg-white">
                  <div className="relative mx-auto max-w-5xl px-6">
                    <div className="relative z-10 grid min-h-[300px] grid-cols-1 items-center gap-8 py-16 md:grid-cols-12">
                      <SectionBird
                        n={17}
                        side="right"
                        pos="top-[55%]"
                        size="w-44 lg:w-60 xl:w-72"
                      />
                      <div className="min-w-0 md:col-span-5">
                        <ScrollReveal>
                          <h3 className="md:text-3.5xl text-primary mt-1 mb-3 text-2xl leading-tight font-bold tracking-tight">
                            Visa Approved
                          </h3>
                          <p className="text-base leading-relaxed font-medium text-slate-500 md:text-lg">
                            The final milestone in your journey. Your passport is stamped, and you
                            are officially ready to begin your new life together.
                          </p>
                        </ScrollReveal>
                      </div>
                      <div className="flex min-w-0 justify-center md:col-span-7">
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
                  </div>
                </div>

                {/* SECTION 18 — final Welcome node (anchor "17") — neutral — centered */}
                <div
                  className="relative w-full"
                  style={{
                    background: "linear-gradient(to bottom, #ffffff 0%, #f7fcf9 6%, #f7fcf9 100%)",
                  }}
                >
                  <div className="relative mx-auto max-w-5xl px-6">
                    <div className="relative z-10 grid min-h-[300px] grid-cols-1 items-center gap-8 py-16 md:grid-cols-12">
                      <div className="min-w-0 md:col-span-6 md:pr-6">
                        <ScrollReveal>
                          <h3 className="md:text-3.5xl text-primary mt-1 mb-4 text-2xl leading-tight font-bold">
                            Navigate your spouse visa journey with clarity and confidence
                          </h3>
                          <p className="text-base leading-relaxed font-medium text-slate-600 md:text-lg">
                            Whether you&apos;re completing your application, gathering documents,
                            preparing for an interview, or moving to the next step, Rahvana helps
                            you understand where you are, what to do and what comes next.
                          </p>
                        </ScrollReveal>
                      </div>
                      <div className="relative flex min-w-0 justify-center md:col-span-6">
                        <ScrollReveal>
                          <RoadmapAnchor id="17" color="green" className="inline-block">
                            <NodeCircle
                              icon={Icons.ArrowRight}
                              label="Start Your Journey"
                              color="green"
                              href={"/visa-category"}
                            />
                          </RoadmapAnchor>
                          {/* <Annotation text="Reunited at last!" direction="left" /> */}
                        </ScrollReveal>
                      </div>
                    </div>
                  </div>
                </div>
              </RoadmapProvider>
              </div>

              {/* SECTION — Toolkit / ToolDock */}
              <ToolsDock />
            </div>

            <JourneyConsultationBand>
              <ConsultationSection onConsultationClick={handleConsultationClick} />

              {/* TESTIMONIALS (moved from About page) */}
              <section className="px-8 py-4 text-center md:px-20">
                <div className="mb-5 flex justify-center">
                  <span className="inline-flex items-center gap-2 rounded-full border-[1.5px] border-[#b5451b] px-4 py-1.5 text-[11px] font-semibold tracking-widest text-[#b5451b] uppercase">
                    Voices From The Journey
                  </span>
                </div>

                <h2 className="mx-auto mb-14 max-w-4xl font-serif text-3xl leading-tight font-bold text-[#121e2e] md:text-5xl">
                  Words from people{" "}
                  <em className="font-normal text-[#0d7a75] italic">who&apos;ve been there.</em>
                </h2>

                <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 md:grid-cols-3">
                  {[
                    {
                      bg: "bg-[#fde8ec]",
                      author: "Ayesha W.",
                      role: "IR-1 applicant · Islamabad",
                      rating: 5,
                      image: "/assets/images/ayesha.jpg",
                      text: "The uncertainty of the IR-1 process felt like a weight. Rahvana's clear roadmap gave me the clarity I needed to finally breathe again. My visa was approved last month.",
                    },
                    {
                      bg: "bg-[#e3edf9]",
                      author: "Karim U.",
                      role: "US Citizen sponsor · Chicago",
                      rating: 5,
                      image: "/assets/images/karim.jpg",
                      text: "After three years of waiting, we were lost in the system. Rahvana helped us understand exactly where we stood. Now, my family is finally together in Chicago.",
                    },
                    {
                      bg: "bg-[#f0f7f4]",
                      author: "Wasay C.",
                      role: "US Citizen sponsor · Bogota",
                      rating: 4.5,
                      image: "/assets/images/Wasay.png",
                      text: "The document requirements were overwhelming. Rahvana's vault made organizing our case effortless. We just received our interview date!",
                    },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className={`${item.bg} flex flex-col gap-5 rounded-[20px] p-8 text-left shadow-sm`}
                    >
                      <div className="flex gap-1 text-[#0d7a75]">
                        {[...Array(5)].map((_, j) => {
                          const isHalfStar = item.rating === 4.5 && j === 4;

                          return (
                            <div key={j} className="relative h-4 w-4">
                              {/* Empty star */}
                              <Star
                                size={16}
                                className="absolute inset-0"
                                fill="none"
                                strokeWidth={2}
                              />

                              {/* Full / half fill */}
                              <div
                                className={`absolute inset-0 overflow-hidden ${
                                  isHalfStar ? "w-1/2" : "w-full"
                                }`}
                              >
                                <Star size={16} fill="currentColor" strokeWidth={2} />
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <blockquote className="grow text-[15px] leading-relaxed text-[#4a5567] italic">
                        {item.text}
                      </blockquote>

                      <div className="flex items-center gap-3 text-sm">
                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-white/70">
                          <Image
                            src={item.image}
                            alt={item.author}
                            fill
                            sizes="56px"
                            className="object-cover"
                          />
                        </div>

                        <div>
                          <strong className="block font-semibold text-[#121e2e]">
                            {item.author}
                          </strong>
                          <span className="text-xs text-[#64748b]">{item.role}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mx-auto mt-10 max-w-2xl text-center">
                  <h3 className="mb-6 text-2xl font-bold text-[#121e2e] md:text-3xl">
                    Ready to start your own journey?
                  </h3>

                  <Link
                    href="/visa-category"
                    className="inline-flex items-center justify-center rounded-full bg-[#0d7a75] px-8 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0a5f5b]"
                  >
                    Start Your Journey
                  </Link>
                </div>

                <div className="mx-auto mt-8 max-w-3xl border-t border-[#e2e8f0]" />

                <div className="mx-auto mt-8 flex max-w-3xl items-center justify-center gap-2 text-[11px] text-[#64748b] md:text-sm">
                  <ShieldCheck size={16} className="text-[#0d7a75]" />
                  <span>Helping families navigate U.S. immigration with confidence.</span>
                </div>
              </section>

              <section className="py-8 md:py-12" id="faq">
                <div className="mx-auto w-full px-6 sm:px-8 md:px-12 2xl:px-30">
                  <div className="mx-auto mb-5 w-full text-center md:w-3/4">
                    <motion.span
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      className="bg-rahvana-primary-pale text-rahvana-primary mb-4 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold"
                    >
                      <Icons.HelpCircle className="h-4 w-4" />
                      {t("homePage.faqBadge")}
                    </motion.span>
                    <h2 className="text-foreground mb-4 text-3xl font-bold md:text-5xl">
                      {t("homePage.faqTitle") || "Frequently Asked Questions"}
                    </h2>
                  </div>

                  <div className="mx-auto w-full space-y-4 md:w-[90%] lg:w-[88%]">
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
                          className="flex w-full items-center justify-between px-4 py-4 text-left sm:px-5 md:px-5 md:py-5"
                        >
                          <span className="text-foreground pr-3 text-md md:text-lg font-bold md:pr-5">
                            {t(`homePage.faqs.q${i + 1}.q`) || faq.q}
                          </span>
                          <div
                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-all md:h-8 md:w-8 ${
                              openFAQ === i
                                ? "bg-rahvana-primary border-rahvana-primary rotate-45 text-white"
                                : "border-border text-muted-foreground group-hover:border-rahvana-primary group-hover:text-rahvana-primary"
                            }`}
                          >
                            <Icons.Plus className="h-4 w-4" />
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
                              <div className="text-muted-foreground border-rahvana-primary/10 border-t px-4 pt-3 pb-5 leading-relaxed sm:px-5 md:px-5">
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
