"use client";

import React, { useEffect, useLayoutEffect, useRef, useState, useCallback } from "react";
import { Caveat } from "next/font/google";
import * as Icons from "lucide-react";

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
// A single top-level <RoadmapCanvas> reads all registered elements,
// measures their real on-screen centers, and draws ONE smooth path
// through them. This replaces the old per-section 0-100 viewBox SVGs,
// which could never line up with the actual node positions because each
// section's coordinate space was independent and ignorant of true layout.
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

// Wraps the whole timeline. Owns the anchor registry + the single SVG
// that draws the smooth snake line behind all sections.
function RoadmapProvider({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const anchorsRef = useRef<Map<string, AnchorEntry>>(new Map());
  const [pathSegments, setPathSegments] = useState<{ d: string; color: AnchorColor }[]>([]);
  const [svgHeight, setSvgHeight] = useState(0);
  const rafRef = useRef<number | null>(null);

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

    // Only draw the snake line on md+ layouts (matches the original
    // "hidden md:block" intent — on mobile the two-column roadmap
    // collapses to a single stack and the connecting line doesn't apply).
    const isDesktop = window.matchMedia("(min-width: 768px)").matches;
    if (!isDesktop) {
      setPathSegments([]);
      return;
    }

    const containerRect = container.getBoundingClientRect();
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

    // Build one smooth Catmull-Rom-derived cubic bezier curve through
    // every point, but emit it as per-segment <path> pieces so each
    // segment can carry its own stroke color (matching the original
    // teal -> amber -> purple -> rose -> green progression) while the
    // tangents are computed across the FULL point sequence, so the
    // curve stays smooth and continuous across color boundaries
    // (no visible kink where the color changes).
    const segments: { d: string; color: AnchorColor }[] = [];
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
      // Color a segment by the color of the node/card it's LEAVING,
      // matching the original section-by-section coloring.
      segments.push({ d, color: p1.color });
    }

    setPathSegments(segments);
    setSvgHeight(container.scrollHeight);
  }

  useLayoutEffect(() => {
    scheduleRecompute();

    const ro = new ResizeObserver(() => scheduleRecompute());
    if (containerRef.current) ro.observe(containerRef.current);

    window.addEventListener("resize", scheduleRecompute);

    // Recompute again after fonts/images settle and after scroll-reveal
    // animations run, since those can shift layout slightly.
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
          {pathSegments.map((seg, i) => (
            <path
              key={i}
              d={seg.d}
              fill="none"
              stroke={strokeColors[seg.color]}
              strokeWidth="2"
              strokeDasharray="4,4"
              className="opacity-50"
            />
          ))}
        </svg>
        {children}
      </div>
    </RoadmapContext.Provider>
  );
}

// Small wrapper that registers any element (leaf dot, card placeholder,
// or NodeCircle) as a point the snake line must pass through.
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

// ----------------------------------------------------------------------------
// Scroll Reveal Component (unchanged)
// ----------------------------------------------------------------------------
function ScrollReveal({
  children,
  delayClass = "",
}: {
  children: React.ReactNode;
  delayClass?: string;
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
    <div ref={ref} className={`reveal ${delayClass} ${visible ? "visible" : ""}`}>
      {children}
    </div>
  );
}

// Annotation Label with hand-drawn arrow style (unchanged)
function Annotation({ text, direction = "left" }: { text: string; direction?: "left" | "right" }) {
  return (
    <div
      className={`absolute z-10 ${
        direction === "left"
          ? "left-[10%] md:left-[15%] top-[10%]"
          : "right-[10%] md:right-[15%] top-[15%]"
      } max-w-[160px] transform ${direction === "left" ? "-rotate-6" : "rotate-6"} pointer-events-none`}
    >
      <p
        className={`${caveat.className} text-slate-500 text-lg md:text-xl leading-tight font-medium`}
      >
        {text}
      </p>
      {direction === "left" ? (
        <svg
          className="w-10 h-10 text-slate-400/80 -mt-1 ml-6 rotate-[-25deg]"
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
          className="w-10 h-10 text-slate-400/80 -mt-1 mr-6 rotate-[75deg]"
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

// Interactive pulsing Node Circle (unchanged visually; anchoring now
// happens in the wrapping <RoadmapAnchor> at each call site)
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
      <div className="mt-3 text-center">
        <h4 className="font-bold text-slate-800 text-lg">{label}</h4>
      </div>
    </div>
  );
}

export default function RoadmapPage() {
  return (
    <div className={`w-full min-h-screen bg-slate-50/50 pb-20 ${caveat.variable}`}>
      {/* Hero Section Placeholder */}
      <div className="w-full min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-linear-to-br from-teal-500/10 via-transparent to-amber-500/10 border-b border-slate-100">
        <div className="absolute inset-0 guide-grid-bg opacity-30 pointer-events-none" />
        <div className="text-center px-4 relative z-10 max-w-2xl">
          <h2 className="text-slate-400 text-xl font-medium mt-4">[Hero Section Placeholder]</h2>
        </div>
      </div>

      <RoadmapProvider>
        <div className="max-w-5xl mx-auto px-6 mt-12 relative">
          {/* SECTION 1 */}
          <div className="py-16 md:py-24 flex items-center justify-center text-center relative">
            <ScrollReveal>
              <div className="max-w-xl mx-auto">
                <h2 className="text-3xl md:text-5xl font-bold text-primary mt-2 mb-4 leading-tight tracking-tight">
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
            <div className="col-span-12 md:col-span-5">
              <ScrollReveal>
                <h3 className="text-2xl md:text-3.5xl font-bold text-primary mt-1 mb-3 leading-tight">
                  Let&apos;s take it one step at a time.
                </h3>
                <p className="text-slate-500 text-base md:text-lg leading-relaxed">
                  Rahvana will guide you through your journey.
                </p>
              </ScrollReveal>
            </div>
            <div className="col-span-12 md:col-span-7 relative h-48 flex items-center justify-center">
              <Annotation text="A clear path. No more guessing." direction="right" />
              <RoadmapAnchor
                id="01"
                color="teal"
                className="absolute top-[30%] md:left-[29%] right-[35%] md:right-auto transform md:-translate-x-1/2 z-10"
              >
                <div className="w-8 h-8 rounded-full bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600" />
              </RoadmapAnchor>
            </div>
          </div>

          {/* SECTION 3 — Petition node (anchor "02") */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center py-16 relative min-h-[300px]">
            <div className="col-span-12 md:col-span-5">
              <ScrollReveal>
                <h3 className="text-2xl md:text-3.5xl font-bold text-primary mt-1 mb-3 leading-tight">
                  Everything starts with the petition.
                </h3>
                <p className="text-slate-500 text-base md:text-lg leading-relaxed">
                  This is where your journey begins.
                </p>
              </ScrollReveal>
            </div>
            <div className="col-span-12 md:col-span-7">
              <ScrollReveal>
                <RoadmapAnchor id="02" color="teal" className="inline-block">
                  <NodeCircle icon={Icons.FileText} label="Petition" color="teal" />
                </RoadmapAnchor>
              </ScrollReveal>
            </div>
          </div>

          {/* SECTION 4 — card placeholder (anchor "03") */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center py-16 relative min-h-[350px]">
            <div className="col-span-12 md:col-span-5">
              <ScrollReveal>
                <h3 className="text-2xl md:text-3.5xl font-bold text-primary mt-1 mb-3 leading-tight">
                  Wait... these forms look intimidating.
                </h3>
                <p className="text-slate-500 text-base md:text-lg leading-relaxed">
                  Long. Confusing. Full of questions I don&apos;t understand.
                </p>
              </ScrollReveal>
            </div>
            <div className="col-span-12 md:col-span-7 flex justify-center">
              <ScrollReveal delayClass="reveal-delay-1">
                <RoadmapAnchor id="03" color="teal" className="inline-block">
                  <div className="relative h-[300px] w-[500px] bg-white border border-slate-200 shadow-xl rounded-2xl p-6 max-w-sm overflow-hidden group hover:border-teal-500/20 transition-all duration-300" />
                </RoadmapAnchor>
              </ScrollReveal>
            </div>
          </div>

          {/* SECTION 5 — card placeholder (anchor "04") */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center py-16 relative min-h-[350px]">
            <div className="col-span-12 md:col-span-5">
              <ScrollReveal>
                <h3 className="text-2xl md:text-3.5xl font-bold text-primary mt-1 mb-3 leading-tight">
                  Rahvana breaks it down for you.
                </h3>
                <p className="text-slate-500 text-base md:text-lg leading-relaxed">
                  One section at a time. Clear. Simple. Guided.
                </p>
              </ScrollReveal>
            </div>
            <div className="col-span-12 md:col-span-7 flex justify-center">
              <ScrollReveal delayClass="reveal-delay-2">
                <RoadmapAnchor id="04" color="teal" className="inline-block">
                  <div className="relative h-[300px] w-[500px] bg-white border border-slate-200 shadow-xl rounded-2xl p-6 max-w-sm overflow-hidden group hover:border-[#0d7377]/20 transition-all duration-300" />
                </RoadmapAnchor>
              </ScrollReveal>
            </div>
          </div>

          {/* SECTION 6 — Check node (anchor "05") */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center py-16 relative min-h-[300px]">
            <div className="col-span-12 md:col-span-5">
              <ScrollReveal>
                <h3 className="text-2xl md:text-3.5xl font-bold text-primary mt-1 mb-3 leading-tight">
                  That wasn&apos;t so bad.
                </h3>
                <p className="text-slate-500 text-base md:text-lg leading-relaxed">
                  Petition submitted! One step down. Many more to go.
                </p>
              </ScrollReveal>
            </div>
            <div className="col-span-12 md:col-span-7 relative">
              <ScrollReveal>
                <RoadmapAnchor id="05" color="amber" className="inline-block">
                  <NodeCircle icon={Icons.Check} color="teal" />
                </RoadmapAnchor>
                <Annotation text="Progress feels good." direction="left" />
              </ScrollReveal>
            </div>
          </div>

          {/* SECTION 7 — Documents node (anchor "06") */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center py-16 relative min-h-[300px]">
            <div className="col-span-12 md:col-span-5">
              <ScrollReveal>
                <h3 className="text-2xl md:text-3.5xl font-bold text-[#8a6200] mt-1 mb-3 leading-tight">
                  What&apos;s next?
                </h3>
                <p className="text-slate-500 text-base md:text-lg leading-relaxed">
                  The next important step is your documents.
                </p>
              </ScrollReveal>
            </div>
            <div className="col-span-12 md:col-span-7">
              <ScrollReveal>
                <RoadmapAnchor id="06" color="amber" className="inline-block">
                  <NodeCircle icon={Icons.FolderOpen} label="Documents" color="amber" />
                </RoadmapAnchor>
              </ScrollReveal>
            </div>
          </div>

          {/* SECTION 8 — card placeholder (anchor "07") */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center py-16 relative min-h-[350px]">
            <div className="col-span-12 md:col-span-5">
              <ScrollReveal>
                <h3 className="text-2xl md:text-3.5xl font-bold text-[#8a6200] mt-1 mb-3 leading-tight">
                  So many documents... what if I miss something important?
                </h3>
                <p className="text-slate-500 text-base md:text-lg leading-relaxed">
                  I don&apos;t want to get delayed later.
                </p>
              </ScrollReveal>
            </div>
            <div className="col-span-12 md:col-span-7 flex justify-center">
              <ScrollReveal delayClass="reveal-delay-1">
                <RoadmapAnchor id="07" color="amber" className="inline-block">
                  <div className="relative h-[300px] w-[500px] max-w-sm bg-white border border-slate-200 shadow-xl rounded-2xl p-5 overflow-hidden group hover:border-amber-500/20 transition-all duration-300" />
                </RoadmapAnchor>
              </ScrollReveal>
            </div>
          </div>

          {/* SECTION 9 — card placeholder (anchor "08") */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center py-16 relative min-h-[350px]">
            <div className="col-span-12 md:col-span-5">
              <ScrollReveal>
                <h3 className="text-2xl md:text-3.5xl font-bold text-[#8a6200] mt-1 mb-3 leading-tight">
                  Rahvana tells you exactly what you need.
                </h3>
                <p className="text-slate-500 text-base md:text-lg leading-relaxed">
                  Upload, review, and keep everything in one place.
                </p>
              </ScrollReveal>
            </div>
            <div className="col-span-12 md:col-span-7 flex justify-center">
              <ScrollReveal delayClass="reveal-delay-2">
                <RoadmapAnchor id="08" color="amber" className="inline-block">
                  <div className="bg-white h-[300px] w-[500px] border border-slate-200 shadow-xl rounded-2xl p-5 max-w-sm group hover:border-amber-500/20 transition-all duration-300" />
                </RoadmapAnchor>
              </ScrollReveal>
            </div>
          </div>

          {/* SECTION 10 — FolderCheck node (anchor "09") */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center py-16 relative min-h-[300px]">
            <div className="col-span-12 md:col-span-5">
              <ScrollReveal>
                <h3 className="text-2xl md:text-3.5xl font-bold text-[#8a6200] mt-1 mb-3 leading-tight">
                  Finally, I know I have everything.
                </h3>
                <p className="text-slate-500 text-base md:text-lg leading-relaxed">
                  One less thing to worry about.
                </p>
              </ScrollReveal>
            </div>
            <div className="col-span-12 md:col-span-7 relative">
              <ScrollReveal>
                <RoadmapAnchor id="09" color="purple" className="inline-block">
                  <NodeCircle icon={Icons.FolderCheck} color="amber" />
                </RoadmapAnchor>
                <Annotation text="This feels relieving." direction="right" />
              </ScrollReveal>
            </div>
          </div>

          {/* SECTION 11 — Finance node (anchor "10") */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center py-16 relative min-h-[300px]">
            <div className="col-span-12 md:col-span-5">
              <ScrollReveal>
                <h3 className="text-2xl md:text-3.5xl font-bold text-[#4a2d8a] mt-1 mb-3 leading-tight">
                  Next up, the financial part.
                </h3>
                <p className="text-slate-500 text-base md:text-lg leading-relaxed">
                  Let&apos;s make sense of it.
                </p>
              </ScrollReveal>
            </div>
            <div className="col-span-12 md:col-span-7">
              <ScrollReveal>
                <RoadmapAnchor id="10" color="purple" className="inline-block">
                  <NodeCircle icon={Icons.Calculator} label="Finance" color="purple" />
                </RoadmapAnchor>
              </ScrollReveal>
            </div>
          </div>

          {/* SECTION 12 — card placeholder (anchor "11") */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center py-16 relative min-h-[350px]">
            <div className="col-span-12 md:col-span-5">
              <ScrollReveal>
                <h3 className="text-2xl md:text-3.5xl font-bold text-[#4a2d8a] mt-1 mb-3 leading-tight">
                  Do I qualify? What if I don&apos;t make enough?
                </h3>
                <p className="text-slate-500 text-base md:text-lg leading-relaxed">
                  The rules are confusing and everyone says something different.
                </p>
              </ScrollReveal>
            </div>
            <div className="col-span-12 md:col-span-7 flex justify-center">
              <ScrollReveal delayClass="reveal-delay-1">
                <RoadmapAnchor id="11" color="purple" className="inline-block">
                  <div className="bg-white border h-[300px] w-[500px] border-slate-200 shadow-xl rounded-2xl p-5 max-w-sm group hover:border-purple-500/20 transition-all duration-300" />
                </RoadmapAnchor>
              </ScrollReveal>
            </div>
          </div>

          {/* SECTION 13 — card placeholder (anchor "12") */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center py-16 relative min-h-[350px]">
            <div className="col-span-12 md:col-span-5">
              <ScrollReveal>
                <h3 className="text-2xl md:text-3.5xl font-bold text-[#4a2d8a] mt-1 mb-3 leading-tight">
                  Rahvana gives you a clear answer.
                </h3>
                <p className="text-slate-500 text-base md:text-lg leading-relaxed">
                  We&apos;ll calculate it for your situation so you know where you stand.
                </p>
              </ScrollReveal>
            </div>
            <div className="col-span-12 md:col-span-7 flex justify-center">
              <ScrollReveal delayClass="reveal-delay-2">
                <RoadmapAnchor id="12" color="purple" className="inline-block">
                  <div className="bg-white border h-[300px] w-[500px] border-slate-200 shadow-xl rounded-2xl p-5 max-w-sm group hover:border-purple-500/20 transition-all duration-300" />
                </RoadmapAnchor>
              </ScrollReveal>
            </div>
          </div>

          {/* SECTION 14 — Interview node (anchor "13") */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center py-16 relative min-h-[300px]">
            <div className="col-span-12 md:col-span-5">
              <ScrollReveal>
                <h3 className="text-2xl md:text-3.5xl font-bold text-[#c0596a] mt-1 mb-3 leading-tight">
                  Almost there.
                </h3>
                <p className="text-slate-500 text-base md:text-lg leading-relaxed">
                  Now let&apos;s get you ready for the interview.
                </p>
              </ScrollReveal>
            </div>
            <div className="col-span-12 md:col-span-7">
              <ScrollReveal>
                <RoadmapAnchor id="13" color="rose" className="inline-block">
                  <NodeCircle icon={Icons.Users} label="Interview" color="rose" />
                </RoadmapAnchor>
              </ScrollReveal>
            </div>
          </div>

          {/* SECTION 15 — card placeholder (anchor "14") */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center py-16 relative min-h-[350px]">
            <div className="col-span-12 md:col-span-5">
              <ScrollReveal>
                <h3 className="text-2xl md:text-3.5xl font-bold text-[#c0596a] mt-1 mb-3 leading-tight">
                  The interview makes me nervous.
                </h3>
                <p className="text-slate-500 text-base md:text-lg leading-relaxed">
                  What if they ask something I don&apos;t know? What if I forget everything?
                </p>
              </ScrollReveal>
            </div>
            <div className="col-span-12 md:col-span-7 flex justify-center">
              <ScrollReveal delayClass="reveal-delay-1">
                <RoadmapAnchor id="14" color="rose" className="inline-block">
                  <div className="bg-white h-[300px] w-[500px] border border-slate-200 shadow-xl rounded-2xl p-5 max-w-sm group hover:border-rose-500/20 transition-all duration-300 relative overflow-hidden" />
                </RoadmapAnchor>
              </ScrollReveal>
            </div>
          </div>

          {/* SECTION 16 — card placeholder (anchor "15") */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center py-16 relative min-h-[350px]">
            <div className="col-span-12 md:col-span-5">
              <ScrollReveal>
                <h3 className="text-2xl md:text-3.5xl font-bold text-[#c0596a] mt-1 mb-3 leading-tight">
                  Rahvana helps you prepare with confidence.
                </h3>
                <p className="text-slate-500 text-base md:text-lg leading-relaxed">
                  Practice, get feedback, and walk in ready.
                </p>
              </ScrollReveal>
            </div>
            <div className="col-span-12 md:col-span-7 flex justify-center">
              <ScrollReveal delayClass="reveal-delay-2">
                <RoadmapAnchor id="15" color="rose" className="inline-block">
                  <div className="bg-white h-[300px] w-[500px] border border-slate-200 shadow-xl rounded-2xl p-5 max-w-sm group hover:border-rose-500/20 transition-all duration-300" />
                </RoadmapAnchor>
              </ScrollReveal>
            </div>
          </div>

          {/* SECTION 17 — final Welcome node (anchor "16") */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center py-16 relative min-h-[300px]">
            <div className="col-span-12 md:col-span-6 md:pr-6">
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
            <div className="col-span-12 md:col-span-6 relative">
              <ScrollReveal>
                <RoadmapAnchor id="16" color="green" className="inline-block">
                  <NodeCircle icon={Icons.ThumbsUp} label="Welcome to the USA!" color="green" />
                </RoadmapAnchor>
                <Annotation text="Reunited at last!" direction="left" />
              </ScrollReveal>
            </div>
          </div>
        </div>
      </RoadmapProvider>
    </div>
  );
}
