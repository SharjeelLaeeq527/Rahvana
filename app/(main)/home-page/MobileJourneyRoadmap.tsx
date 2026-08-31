"use client";

import React, { useRef, useState, useEffect, useLayoutEffect, useCallback, createContext, useContext } from "react";
import Link from "next/link";
import * as Icons from "lucide-react";
import AnimationCard from "./AnimationCard";
import { Caveat } from "next/font/google";

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

const MobileRoadmapContext = createContext<{
  register: (id: string, entry: AnchorEntry | null) => void;
} | null>(null);

function useMobileRoadmapAnchor(id: string, color: AnchorColor) {
  const ctx = useContext(MobileRoadmapContext);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ctx || !ref.current) return;
    ctx.register(id, { el: ref.current, color });
    return () => ctx.register(id, null);
  }, [ctx, id, color]);

  return ref;
}

function MobileRoadmapAnchor({
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
  const ref = useMobileRoadmapAnchor(id, color);
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

function MobileRoadmapProvider({ children }: { children: React.ReactNode }) {
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

    const containerRect = container.getBoundingClientRect();
    const curScroll = typeof window !== "undefined" ? window.scrollY : 0;
    containerTopRef.current = containerRect.top + curScroll;
    windowHeightRef.current = typeof window !== "undefined" ? window.innerHeight : 800;

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
    }[] = [];

    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i === 0 ? i : i - 1];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2 < points.length ? i + 2 : i + 1];

      // Inject wave offset (swaying left and right between nodes) to create a beautiful wave curve
      const waveAmplitude = 32;
      const direction = i % 2 === 0 ? 1 : -1;

      const cp1x = p1.x + (p2.x - p0.x) / 4 + direction * waveAmplitude;
      const cp1y = p1.y + (p2.y - p0.y) / 4;
      const cp2x = p2.x - (p3.x - p1.x) / 4 - direction * waveAmplitude;
      const cp2y = p2.y - (p3.y - p1.y) / 4;

      const d = `M ${p1.x},${p1.y} C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
      segments.push({
        d,
        color: p1.color,
        yStart: p1.y,
        yEnd: p2.y,
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
    const intervals = [200, 600, 1200, 2500];
    const timers = intervals.map((ms) => setTimeout(scheduleRecompute, ms));

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", scheduleRecompute);
      timers.forEach(clearTimeout);
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
        if (containerRef.current) {
          containerTopRef.current = containerRef.current.getBoundingClientRect().top + window.scrollY;
        }
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

  const segmentProgress = pathSegments.map((seg, i) => {
    const length = pathLengths[i] || 0;
    const revealY = scrollY + (windowHeightRef.current || 800) * 0.65;
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
    <MobileRoadmapContext.Provider value={{ register }}>
      <div ref={containerRef} className="relative">
        <svg
          className="pointer-events-none absolute inset-0 z-[10] block w-full"
          style={{ height: svgHeight }}
          width="100%"
          preserveAspectRatio="none"
        >
          {pathSegments.map((seg, i) => {
            const { activeLength, dashOffset } = segmentProgress[i];

            return (
              <React.Fragment key={i}>
                <mask id={`mobile-roadmap-mask-${i}`}>
                  <path
                    d={seg.d}
                    fill="none"
                    stroke="white"
                    strokeWidth="8"
                    strokeDasharray={activeLength}
                    strokeDashoffset={dashOffset}
                    style={{
                      transition: "stroke-dashoffset 0.1s ease-out",
                    }}
                  />
                </mask>
                {/* Glow layer */}
                <path
                  d={seg.d}
                  fill="none"
                  stroke={strokeColors[seg.color]}
                  strokeWidth="4"
                  className="opacity-[0.18] blur-[1px]"
                  mask={`url(#mobile-roadmap-mask-${i})`}
                />
                {/* Main animated path line */}
                <path
                  ref={(el) => {
                    pathRefs.current[i] = el;
                  }}
                  d={seg.d}
                  fill="none"
                  stroke={strokeColors[seg.color]}
                  strokeWidth="2.5"
                  strokeDasharray="5,5"
                  className="opacity-85"
                  mask={`url(#mobile-roadmap-mask-${i})`}
                />
              </React.Fragment>
            );
          })}
        </svg>

        {children}
      </div>
    </MobileRoadmapContext.Provider>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   HELPERS & DECORATIONS
───────────────────────────────────────────────────────────────────────────── */

function MobileNodeCircle({
  icon: Icon,
  label,
  color = "teal",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label?: string;
  color?: AnchorColor;
}) {
  const bgColors: Record<AnchorColor, string> = {
    teal: "bg-[#0d7377]",
    amber: "bg-[#8a6200]",
    purple: "bg-[#4a2d8a]",
    rose: "bg-[#c0596a]",
    green: "bg-[#15744f]",
  };

  return (
    <div className="relative z-20 flex flex-col items-center justify-center py-4">
      <div
        className={`h-16 w-16 rounded-full ${bgColors[color]} flex items-center justify-center text-white shadow-md border-2 border-white`}
      >
        <Icon className="h-7 w-7" />
      </div>
      {label && (
        <div className="mt-2 text-center">
          <span className="inline-block rounded-full border border-slate-200/80 bg-white px-4 py-1 text-sm font-bold text-slate-800 shadow-2xs">
            {label}
          </span>
        </div>
      )}
    </div>
  );
}

function MobileBirdImage({ n, className = "" }: { n: number; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/homepage/bird${n}.png`}
      alt=""
      aria-hidden="true"
      className={`pointer-events-none select-none h-auto object-contain ${className}`}
    />
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN COMPONENT — REIMAGINED MOBILE ROADMAP
───────────────────────────────────────────────────────────────────────────── */

export default function MobileJourneyRoadmap() {
  return (
    <div className={`block md:hidden w-full bg-white text-slate-800 relative overflow-hidden font-sans ${caveat.variable}`}>
      <MobileRoadmapProvider>
        {/* ─── HOOK / INTRO HEADER ─── */}
        <section className="relative w-full bg-white px-6 pt-16 pb-10 text-center border-b border-slate-100">
          <div className="max-w-xs mx-auto text-center">
            <h2 className="text-3xl font-semibold text-slate-900 tracking-tight leading-tight mb-2">
              Where do I even start?
            </h2>
            <p className="text-base text-slate-500 leading-relaxed font-normal">
              If only someone could show me the right order.
            </p>
          </div>
        </section>

        {/* ─── SECTION 1: PROLOGUE (Anchor 01) ─── */}
        <section
          className="relative w-full py-16 px-6"
          style={{
            background: "linear-gradient(to bottom, #ffffff 0%, #f4fafa 6%, #f4fafa 94%, #ffffff 100%)",
          }}
        >
          {/* Centered Title & Subtitle */}
          <div className="max-w-xs mx-auto text-center mb-8">
            <h3 className="text-3xl font-semibold text-[#0d7377] tracking-tight leading-tight mb-2">
              Let&apos;s take it one step at a time.
            </h3>
            <p className="text-base text-slate-500 leading-relaxed font-normal">
              Rahvana will guide you through your journey.
            </p>
          </div>

          {/* Row with Annotation on Left, Start Dot in Center, Bird 1 on Right */}
          <div className="relative flex items-center justify-between max-w-sm mx-auto my-6 px-2">
            {/* Annotation on Left */}
            <div className="w-32 shrink-0 text-right pr-1">
              <p
                className="text-lg leading-tight font-medium text-slate-500 rotate-2"
                style={{ fontFamily: "var(--font-caveat), Caveat, cursive" }}
              >
                A clear path. No more guessing.
              </p>
              <svg
                className="h-5 w-5 text-slate-400 mt-0.5 ml-auto rotate-[25deg]"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.5 4.5l15 15m0 0H8.25m11.25 0V8.25"
                />
              </svg>
            </div>

            {/* Start Anchor Point ("01") in Center */}
            <div className="relative flex flex-col items-center shrink-0 mx-2 z-20">
              <MobileRoadmapAnchor id="01" color="teal" className="inline-block">
                <div className="relative flex h-5 w-5 items-center justify-center rounded-full border border-[#5f9d98] bg-[#7fb8b4]">
                  <div className="h-1.5 w-1.5 rounded-full bg-white" />
                </div>
              </MobileRoadmapAnchor>
            </div>

            {/* Bird 1 on Right */}
            <div className="w-36 shrink-0 flex justify-end">
              <MobileBirdImage n={1} className="w-40 max-w-none translate-y-23" />
            </div>
          </div>
        </section>

        {/* ─── SECTION 2: PETITION NODE (Anchor 02) ─── */}
        <section className="relative w-full bg-white py-8 px-6 overflow-visible">
          <div className="relative z-10 flex flex-col items-center">
            {/* Text top-left */}
            <div className="w-full text-left mb-4">
              <h3 className="text-2xl font-semibold text-[#0d7377] tracking-tight leading-snug mb-1">
                Everything starts<br />with the petition.
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed font-normal">
                This is where your journey <br /> begins.
              </p>
            </div>

            {/* Petition node centered, bird3 floated to the right below it */}
            <div className="relative w-full flex justify-center">
              <MobileRoadmapAnchor id="02" color="teal" className="inline-block my-2 z-20">
                <MobileNodeCircle icon={Icons.FileText} label="Petition" color="teal" />
              </MobileRoadmapAnchor>

              {/* Bird 3 — bottom-right of this row */}
              <div className="absolute right-0 top-25">
                <MobileBirdImage n={2} className="w-32" />
              </div>
            </div>
          </div>
        </section>

        {/* ─── SECTION 3: FORM ANXIETY (Anchor 03) ─── */}
        <section
          className="relative w-full py-16 px-6"
          style={{
            background: "linear-gradient(to bottom, #ffffff 0%, #f4fafa 6%, #f4fafa 94%, #ffffff 100%)",
          }}
        >
          <div className="relative z-10">
            {/* Text only at top — no bird here */}
            <div className="w-[55%] text-left mb-6">
              <p
                className="text-[1.65rem] leading-snug font-normal text-[#0d7377]"
                style={{ fontFamily: "var(--font-caveat), Caveat, cursive" }}
              >
                &ldquo;Wait... these forms <br />look complicated.&rdquo;
              </p>
              <p
                className="text-sm text-slate-500 mt-1 font-normal"
                style={{ fontFamily: "var(--font-caveat), Caveat, cursive" }}
              >
                Long. Confusing. Full of questions I <br /> don&apos;t understand.
              </p>
            </div>

            <MobileRoadmapAnchor id="03" color="teal" className="flex justify-center my-6 min-h-[300px]">
              <AnimationCard
                file="wait... section animation final.html"
                title="Immigration forms feel overwhelming"
                w={480}
                h={600}
              />
            </MobileRoadmapAnchor>

            {/* Bird 4 below the animation, right-aligned */}
            <div className="flex justify-end mt-7">
              <MobileBirdImage n={3} className="w-35" />
            </div>
          </div>
        </section>

        {/* ─── SECTION 4: RAHVANA SOLUTION (Anchor 04) ─── */}
        <section className="relative w-full bg-white pt-6 pb-12 px-6">
          <div className="relative z-10 text-left">
            {/* Text on Top Left */}
            <div className="w-[60%] text-left mb-4">
              <h3 className="text-[1.6rem] font-semibold text-[#0d7377] tracking-tight leading-snug mb-1">
                Rahvana breaks <br />it down for you.
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed font-normal">
                One section at a time.<br /> Clear. Simple. Guided.
              </p>
            </div>

            <MobileRoadmapAnchor id="04" color="teal" className="flex justify-center my-6 min-h-[250px]">
              <AnimationCard
                file="visa form solution final.html"
                title="Rahvana breaks the form down section by section"
                w={660}
                h={430}
              />
            </MobileRoadmapAnchor>

            {/* Bird 4 below the animation */}
            <div className="flex justify-end mt-10">
              <MobileBirdImage n={4} className="w-38" />
            </div>
          </div>
        </section>

        {/* ─── SECTION 5: PETITION CHECK (Anchor 05) ─── */}
        <section
          className="relative w-full py-16 px-6"
          style={{
            background: "linear-gradient(to bottom, #ffffff 0%, #f4fafa 6%, #f4fafa 94%, #ffffff 100%)",
          }}
        >
          <div className="relative z-10">
            {/* Header text on left */}
            <div className="w-[60%] text-left mb-4">
              <p
                className="text-3xl text-[#0d7377] font-normal mb-1"
                style={{ fontFamily: "var(--font-caveat), Caveat, cursive" }}
              >
                &ldquo;... That wasn&apos;t so bad.&rdquo;
              </p>
              <p
                className="text-sm text-slate-500 font-normal"
                style={{ fontFamily: "var(--font-caveat), Caveat, cursive" }}
              >
                Petition submitted! One step down. <br />Many more to go.
              </p>
            </div>

            {/* Check node centered with side annotation */}
            <div className="relative flex justify-center mt-12 mb-6 z-20">
              <MobileRoadmapAnchor id="05" color="amber" className="inline-block">
                <MobileNodeCircle icon={Icons.Check} color="teal" />
              </MobileRoadmapAnchor>

              <div className="absolute left-[58%] top-2 pointer-events-none w-36">
                <p
                  className="text-lg leading-tight font-medium text-slate-500 rotate-3 text-left"
                  style={{ fontFamily: "var(--font-caveat), Caveat, cursive" }}
                >
                  Progress feels good.
                </p>
                <svg
                  className="h-5 w-5 text-slate-400 mt-0.5 rotate-[65deg]"
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
              </div>
            </div>

            {/* Bird 5 below the check node on the left side */}
            <div className="flex justify-start mt-8">
              <MobileBirdImage n={5} className="w-36" />
            </div>
          </div>
        </section>

        {/* ─── SECTION 6: DOCUMENTS NODE (Anchor 06) ─── */}
        <section className="relative w-full bg-white py-16 px-6">
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-full flex justify-between items-start mb-6">
              <div className="w-[45%] text-left pr-1">
                <h3 className="text-2xl font-semibold text-[#8a6200] tracking-tight leading-snug mb-1">
                  What&apos;s next?
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed font-normal">
                  The next important step is your documents.
                </p>
              </div>

              <div className="w-[45%] flex justify-end mt-6">
                <MobileBirdImage n={6} className="w-42 max-w-none" />
              </div>
            </div>

            <div className="relative flex justify-center my-4 z-20">
              <MobileRoadmapAnchor id="06" color="amber" className="inline-block">
                <MobileNodeCircle icon={Icons.FolderOpen} label="Documents" color="amber" />
              </MobileRoadmapAnchor>

              {/* Side Annotation on Left below Documents Node */}
              <div className="absolute left-[-90%] top-30 pointer-events-none w-36">
                <p
                  className="text-lg leading-tight font-medium text-slate-500 -rotate-3 text-left"
                  style={{ fontFamily: "var(--font-caveat), Caveat, cursive" }}
                >
                  Organized &amp; clear.
                </p>
                <svg
                  className="h-5 w-5 text-slate-400 mt-0.5 rotate-[-75deg]"
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
              </div>
            </div>
          </div>
        </section>

        {/* ─── SECTION 7: DOCUMENTS ANXIETY (Anchor 07) ─── */}
        <section
          className="relative w-full py-16 px-6"
          style={{
            background: "linear-gradient(to bottom, #ffffff 0%, #fffcf6 6%, #fffcf6 94%, #ffffff 100%)",
          }}
        >
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-6">
              <div className="w-[45%] text-left pr-1">
                <p
                  className="text-2xl leading-snug font-normal text-[#8a6200]"
                  style={{ fontFamily: "var(--font-caveat), Caveat, cursive" }}
                >
                  &ldquo;... So many documents... what if I miss something important?&rdquo;
                </p>
                <p
                  className="text-sm text-slate-500 mt-1 font-normal"
                  style={{ fontFamily: "var(--font-caveat), Caveat, cursive" }}
                >
                  I don&apos;t want to get delayed later.
                </p>
              </div>
              <div className="w-[45%] flex justify-end mt-8">
                <MobileBirdImage n={7} className="w-38" />
              </div>
            </div>

            <MobileRoadmapAnchor id="07" color="amber" className="flex justify-center my-6 min-h-[260px]">
              <div className="relative p-2.5 bg-white rounded-2xl border border-amber-200/80 shadow-md shadow-amber-900/5 max-w-full">
                <AnimationCard
                  file="document_gathering_problem option 1 final.html"
                  title="Gathering documents is confusing"
                  w={380}
                  h={440}
                />
              </div>
            </MobileRoadmapAnchor>
          </div>
        </section>

        {/* ─── SECTION 8: DOCUMENT VAULT (Anchor 08) ─── */}
        <section className="relative w-full bg-white py-16 px-6">
          <div className="relative z-10 text-left">
            <div className="w-full flex justify-between items-start mb-4">
              <div className="w-[55%] text-left pr-2">
                <h3 className="text-2xl font-semibold text-[#8a6200] tracking-tight leading-snug mb-1">
                  Rahvana tells you exactly what documents you need.
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed font-normal">
                  Track required documents, upload files, and keep everything organized in one place.
                </p>
              </div>
              <div className="w-[38%] flex justify-end translate-y-15 rotate-[-10deg]">
                <MobileBirdImage n={8} className="w-42" />
              </div>
            </div>

            <MobileRoadmapAnchor id="08" color="amber" className="flex justify-center my-6 min-h-[300px]">
              <AnimationCard
                file="rahvana-document-vault-v3 final.html"
                title="Rahvana's document vault keeps everything organized"
                w={480}
                h={640}
              />
            </MobileRoadmapAnchor>
          </div>
        </section>

        {/* ─── SECTION 9: DOCUMENTS CHECK (Anchor 09) ─── */}
        <section
          className="relative w-full py-16 px-6"
          style={{
            background: "linear-gradient(to bottom, #ffffff 0%, #fffcf6 6%, #fffcf6 94%, #ffffff 100%)",
          }}
        >
          <div className="relative z-10">
            <div className="w-[60%] text-left mb-4">
              <p
                className="text-[1.65rem] text-[#8a6200] font-normal mb-1"
                style={{ fontFamily: "var(--font-caveat), Caveat, cursive" }}
              >
                &ldquo;Finally, I know I <br />have everything.&rdquo;
              </p>
              <p
                className="text-sm text-slate-500 font-normal"
                style={{ fontFamily: "var(--font-caveat), Caveat, cursive" }}
              >
                One less thing to worry about.
              </p>
            </div>

            <div className="relative flex justify-center my-6 z-20">
              <MobileRoadmapAnchor id="09" color="purple" className="inline-block">
                <MobileNodeCircle icon={Icons.FolderCheck} color="amber" />
              </MobileRoadmapAnchor>
              <div className="absolute left-[5%] top-2 pointer-events-none w-36">
                <p
                  className="text-lg leading-tight font-medium text-slate-500 -rotate-3 text-left"
                  style={{ fontFamily: "var(--font-caveat), Caveat, cursive" }}
                >
                  This feels relieving.
                </p>
                <svg
                  className="h-5 w-5 text-slate-400 mt-0.5 rotate-[-75deg]"
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
              </div>
            </div>

            {/* Bird 9 below the FolderCheck node */}
            <div className="flex justify-end mt-4">
              <MobileBirdImage n={9} className="w-36" />
            </div>
          </div>
        </section>

        {/* ─── SECTION 10: FINANCE NODE (Anchor 10) ─── */}
        <section className="relative w-full bg-white py-16 px-6">
          <div className="relative z-10 text-left">
            <div className="w-[60%] text-left mb-4">
              <h3 className="text-[1.65rem] font-semibold text-[#4a2d8a] tracking-tight leading-snug mb-1">
                Next up, the <br /> financial part.
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed font-normal">
                Let&apos;s make sense of it.
              </p>
            </div>

            <div className="flex justify-center my-4">
              <MobileRoadmapAnchor id="10" color="purple" className="inline-block z-20">
                <MobileNodeCircle icon={Icons.Calculator} label="Finances" color="purple" />
              </MobileRoadmapAnchor>
            </div>

            {/* Bird 10 below the Finances node */}
            <div className="flex justify-end mt-4">
              <MobileBirdImage n={10} className="w-38" />
            </div>
          </div>
        </section>

        {/* ─── SECTION 11: FINANCE ANXIETY (Anchor 11) ─── */}
        <section
          className="relative w-full py-16 px-6"
          style={{
            background: "linear-gradient(to bottom, #ffffff 0%, #f5f1f9 6%, #f5f1f9 94%, #ffffff 100%)",
          }}
        >
          <div className="relative z-10">
            <div className="w-[60%] text-left mb-6">
              <p
                className="text-[1.65rem] leading-snug font-normal text-[#4a2d8a]"
                style={{ fontFamily: "var(--font-caveat), Caveat, cursive" }}
              >
                &ldquo;Do I qualify? <br />What if I don&apos;t <br /> make enough?&rdquo;
              </p>
              <p
                className="text-sm text-slate-500 mt-1 font-normal"
                style={{ fontFamily: "var(--font-caveat), Caveat, cursive" }}
              >
                The rules are confusing and everyone <br />says something different.
              </p>
            </div>

            <MobileRoadmapAnchor id="11" color="purple" className="flex justify-center my-6 min-h-[260px]">
              <div className="relative p-2.5 bg-white rounded-2xl border border-purple-200/80 shadow-md shadow-purple-900/5 max-w-full">
                <AnimationCard
                  file="rahvana_sponsorship_anxiety_v4 final.html"
                  title="Worrying about whether you financially qualify"
                  w={460}
                  h={360}
                />
              </div>
            </MobileRoadmapAnchor>

            {/* Bird 11 below anxiety animation on the right */}
            <div className="flex justify-end mt-4">
              <MobileBirdImage n={11} className="w-42" />
            </div>
          </div>
        </section>

        {/* ─── SECTION 12: SPONSORSHIP CALCULATOR (Anchor 12) ─── */}
        <section className="relative w-full bg-white py-16 px-6">
          <div className="relative z-10 text-left">
            <div className="w-[60%] text-left mb-4">
              <h3 className="text-[1.65rem] font-semibold text-[#4a2d8a] tracking-tight leading-snug mb-1">
                Rahvana gives <br />you a clear <br /> answer.
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed font-normal">
                We&apos;ll calculate it for your <br /> exact situation so you always <br /> know where you stand.
              </p>
            </div>

            <MobileRoadmapAnchor id="12" color="purple" className="flex justify-center my-6 min-h-[260px]">
              <AnimationCard
                file="sponsorship calculator solution final.html"
                title="Rahvana calculates whether you qualify"
                w={484}
                h={448}
              />
            </MobileRoadmapAnchor>

            {/* Bird 12 below sponsorship solution animation on the right */}
            <div className="flex justify-end mt-4">
              <MobileBirdImage n={12} className="w-38" />
            </div>
          </div>
        </section>

        {/* ─── SECTION 13: INTERVIEW NODE (Anchor 13) ─── */}
        <section
          className="relative w-full py-16 px-6"
          style={{
            background: "linear-gradient(to bottom, #ffffff 0%, #fef6f7 6%, #fef6f7 94%, #ffffff 100%)",
          }}
        >
          <div className="relative z-10 text-left">
            <div className="w-[60%] text-left mb-4">
              <h3 className="text-[1.65rem] font-semibold text-[#c0596a] tracking-tight leading-snug mb-1">
                Almost there.
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed font-normal">
                Now let&apos;s get you ready for the interview.
              </p>
            </div>

            <div className="flex justify-center my-4">
              <MobileRoadmapAnchor id="13" color="rose" className="inline-block z-20">
                <MobileNodeCircle icon={Icons.Users} label="Interview" color="rose" />
              </MobileRoadmapAnchor>
            </div>

            {/* Bird 13 below the Interview node on the right */}
            <div className="flex justify-end mt-6">
              <MobileBirdImage n={13} className="w-38" />
            </div>
          </div>
        </section>

        {/* ─── SECTION 14: INTERVIEW ANXIETY (Anchor 14) ─── */}
        <section className="relative w-full bg-white py-16 px-6">
          <div className="relative z-10 text-left">
            <div className="w-[60%] text-left mb-6">
              <p
                className="text-[1.65rem] leading-snug font-normal text-[#c0596a]"
                style={{ fontFamily: "var(--font-caveat), Caveat, cursive" }}
              >
                &ldquo;The interview <br /> makes me nervous.&rdquo;
              </p>
              <p
                className="text-sm text-slate-500 mt-1 font-normal"
                style={{ fontFamily: "var(--font-caveat), Caveat, cursive" }}
              >
                What if they ask something I don&apos;t <br /> know? What if I forget everything?
              </p>
            </div>

            <MobileRoadmapAnchor id="14" color="rose" className="flex justify-center my-6 min-h-[300px]">
              <AnimationCard
                file="rahvana_question_stack_standalone_final.html"
                title="Interview anxiety, what if I forget?"
                w={450}
                h={640}
              />
            </MobileRoadmapAnchor>

            {/* Bird 14 below question stack animation on the right */}
            <div className="flex justify-end mt-4">
              <MobileBirdImage n={14} className="w-38" />
            </div>
          </div>
        </section>

        {/* ─── SECTION 15: INTERVIEW PREP (Anchor 15) ─── */}
        <section
          className="relative w-full py-16 px-6"
          style={{
            background: "linear-gradient(to bottom, #ffffff 0%, #fef6f7 6%, #fef6f7 94%, #ffffff 100%)",
          }}
        >
          <div className="relative z-10 text-left">
            <div className="w-[60%] text-left mb-4">
              <h3 className="text-2xl font-semibold text-[#c0596a] tracking-tight leading-snug mb-1">
                Rahvana helps <br /> you prepare with confidence.
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed font-normal">
                Practice real questions, get  <br /> feedback, and walk in ready.
              </p>
            </div>

            <MobileRoadmapAnchor id="15" color="rose" className="flex justify-center my-6 min-h-[260px]">
              <AnimationCard
                file="rahvana_visa_prep_animation.html"
                title="Rahvana helps you prepare with confidence"
                w={560}
                h={480}
              />
            </MobileRoadmapAnchor>

            {/* Bird 15 below visa prep animation on the right */}
            <div className="flex justify-end mt-4">
              <MobileBirdImage n={15} className="w-38" />
            </div>
          </div>
        </section>

        {/* ─── SECTION 16: VISA APPROVED (Anchor 16 — FINAL STOPPING NODE) ─── */}
        <section className="relative w-full bg-white py-16 px-6">
          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="w-full flex justify-between items-start mb-6">
              <div className="w-[45%] text-left pr-1">
                <h3 className="text-4xl font-semibold text-slate-800 tracking-tight leading-snug mb-1">
                  Visa Approved
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed font-normal">
                  The final milestone in your journey. Your passport is stamped, and you are officially ready to begin your new life together.
                </p>
              </div>

              <div className="flex justify-end mt-17 ">
                <MobileBirdImage n={16} className="w-38" />
              </div>
            </div>

            {/* Line stops cleanly at this anchor ("16") */}
            <MobileRoadmapAnchor id="16" color="green" className="inline-block my-4 z-20">
              <MobileNodeCircle icon={Icons.CheckCircle} label="Visa Approval" color="green" />
            </MobileRoadmapAnchor>

            <p
              className="text-3xl text-[#15744f] font-medium mt-3"
              style={{ fontFamily: "var(--font-caveat), Caveat, cursive" }}
            >
              Reunited at last!
            </p>
          </div>
        </section>

        {/* ─── SECTION 17: FINALE CALL TO ACTION (UNANCHORED, NO LINE PAST VISA APPROVED) ─── */}
        <section
          className="relative w-full py-20 px-6 text-center"
          style={{
            background: "linear-gradient(to bottom, #ffffff 0%, #f7fcf9 6%, #f7fcf9 100%)",
          }}
        >
          <div className="relative z-10 max-w-xs mx-auto text-left">
            <h3 className="text-3xl font-semibold text-slate-800 tracking-tight leading-snug mb-3">
              Navigate your spouse visa journey with clarity and confidence
            </h3>
            <p className="text-base text-slate-600 leading-relaxed mb-6 font-normal">
              Whether you&apos;re completing your application, gathering documents, preparing for an interview, or moving to the next step, Rahvana helps you understand where you are, what to do and what comes next.
            </p>

            <Link
              href="/visa-category"
              className="inline-flex items-center justify-center gap-2 w-full py-4 px-6 rounded-xl bg-[#0d7377] text-white font-bold text-base shadow-xs hover:bg-[#0a5c5f] transition-all active:scale-[0.98]"
            >
              <span>Start Your Journey</span>
              <Icons.ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </section>
      </MobileRoadmapProvider>
    </div>
  );
}
