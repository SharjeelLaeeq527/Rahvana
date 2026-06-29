"use client";

import React, { useEffect, useLayoutEffect, useRef, useState, useCallback } from "react";
import { Caveat } from "next/font/google";
import * as Icons from "lucide-react";
import { ToolsDock } from "./ToolDock";
import HeroSection from "./herosection";
import AnimationCard from "./AnimationCard";

const caveat = Caveat({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-caveat",
});

// ----------------------------------------------------------------------------
// Roadmap anchor registry
// ----------------------------------------------------------------------------
// Every node/card that the snake line should pass through registers its
// DOM element here (keyed by an order index) via `useRoadmapAnchor`.
// A single top-level <RoadmapProvider> reads all registered elements,
// measures their real on-screen centers, and draws ONE smooth path
// through them.
//
// NOTE ON THE "STRAIGHT LINE" ISSUE:
// the curve math itself was never broken. A Catmull-Rom/cubic-bezier
// curve through points that all share the same x-coordinate IS a
// straight line -- there's no horizontal distance to bend through.
// Once the circular nodes AND the card placeholders were both centered
// in the previous pass, every anchor landed on the same vertical axis,
// so the "smooth curve" correctly degenerated into a straight line.
// To get the zigzag/snake back, the cards now sit shifted left of
// center (consistently, not alternating) while the round nodes stay
// dead-center -- this reintroduces the horizontal displacement the
// curve needs to actually curve, matching the reference screenshot.
// ----------------------------------------------------------------------------

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

// Card placeholder wrapper: shifts the card consistently left of its
// flex-centered column, so its anchor center sits left of the node
// anchors above/below it -- this is what gives the line a real
// horizontal swing to curve through, instead of a vertical straight
// line. Direction is fixed (not alternating) per your last request.
const CARD_OFFSET_CLASS = "md:-ml-12";

export default function RoadmapPage() {
  return (
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
                  Track required documents, upload your files, and keep everything organized in one
                  place.
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
                    file="rahvana_question_stack_with_image.html"
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
                  The final milestone in your journey. Your passport is stamped, and you are officially ready to begin your new life together.
                </p>
              </ScrollReveal>
            </div>
            <div className="md:col-span-7 flex justify-center min-w-0">
              <ScrollReveal>
                <RoadmapAnchor id="16" color="green" className="inline-block">
                  <NodeCircle icon={Icons.CheckCircle} label="Visa Approval" color="green" />
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
                  Whether you&apos;re completing your application, gathering documents, preparing
                  for an interview, or moving to the next step, Rahvana helps you understand where
                  you are, what to do and what comes next.
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
  );
}
