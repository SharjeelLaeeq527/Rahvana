"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { DashboardChapter, DashboardPathStep } from "@/lib/journey/dashboard/types";
import { CHAPTER_COLORS } from "./palette";

const W = 500;
const H = 268;
type Box = { x: number; y: number; w: number; h: number };
const FULL: Box = { x: 0, y: 0, w: W, h: H };

/** Names are drawn at the same angle, so they never touch while the dots are this far apart (px, perpendicular). */
const MIN_PERP_PX = 12.5;
const LABEL_MAX_CHARS = 30;

/** Corner points of the line: flat, rise, flat, rise ... from bottom-left to top-right. */
function cornerPoints(n: number): [number, number][] {
  if (n === 3) return [[36, 236], [186, 236], [316, 108], [460, 108]];
  const pts: [number, number][] = [];
  for (let i = 0; i <= n; i++) {
    const x = 36 + (424 * i) / Math.max(1, n);
    const rises = Math.floor((i + 1) / 2);
    const totalRises = Math.max(1, Math.floor((n + 1) / 2));
    pts.push([x, 236 - (128 * rises) / totalRises]);
  }
  return pts;
}

interface Placed extends DashboardPathStep {
  x: number;
  y: number;
  seg: number;
  k: number;
  n: number;
}

export function JourneyLine({
  chapters,
  path,
  onOpenStep,
}: {
  chapters: DashboardChapter[];
  path: DashboardPathStep[];
  onOpenStep: (chapterIndex: number, stepIndex: number) => void;
}) {
  const K = useMemo(() => cornerPoints(chapters.length), [chapters.length]);
  const segOf = useMemo(() => new Map(chapters.map((c, i) => [c.index, i])), [chapters]);

  const placed = useMemo<Placed[]>(() => {
    const bySeg = new Map<number, DashboardPathStep[]>();
    path.forEach((p) => {
      const s = segOf.get(p.chapterIndex);
      if (s === undefined) return;
      bySeg.set(s, [...(bySeg.get(s) || []), p]);
    });
    const out: Placed[] = [];
    bySeg.forEach((steps, seg) => {
      const [a, b] = [K[seg], K[seg + 1]];
      steps.forEach((p, k) => {
        const f = (k + 1) / (steps.length + 1);
        out.push({ ...p, seg, k, n: steps.length, x: a[0] + (b[0] - a[0]) * f, y: a[1] + (b[1] - a[1]) * f });
      });
    });
    return out;
  }, [path, K, segOf]);

  const current = placed.find((p) => p.state === "current") || null;
  // A step can be opened once the user has reached it (done, or at / before the
  // current step). Later steps show their name but do not open.
  const currentPos = current ? placed.indexOf(current) : -1;
  const canOpen = (p: Placed) => p.state === "done" || currentPos < 0 || placed.indexOf(p) <= currentPos;
  const progress = useMemo(() => {
    if (current) return { seg: current.seg, x: current.x, y: current.y };
    const lastDone = [...placed].reverse().find((p) => p.state === "done");
    if (!lastDone) return null;
    return placed.every((p) => p.state === "done")
      ? { seg: chapters.length - 1, x: K[K.length - 1][0], y: K[K.length - 1][1] }
      : { seg: lastDone.seg, x: lastDone.x, y: lastDone.y };
  }, [current, placed, chapters.length, K]);

  // Real rendered size (the SVG letterboxes when the hero is short).
  const rootRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: W, h: H });
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const read = () => setSize({ w: el.clientWidth || W, h: el.clientHeight || H });
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ── Zoom (animated viewBox) ────────────────────────────────────────────────
  const [box, setBox] = useState<Box>(FULL);
  const [focus, setFocus] = useState<number | null>(null);
  const raf = useRef<number | null>(null);
  const boxRef = useRef(box);
  boxRef.current = box;

  const animateTo = (t: Box) => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setBox(t);
      return;
    }
    const from = { ...boxRef.current };
    const start = performance.now();
    const dur = 520;
    if (raf.current) cancelAnimationFrame(raf.current);
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / dur);
      const e = 1 - Math.pow(1 - p, 3);
      setBox({
        x: from.x + (t.x - from.x) * e,
        y: from.y + (t.y - from.y) * e,
        w: from.w + (t.w - from.w) * e,
        h: from.h + (t.h - from.h) * e,
      });
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  };
  useEffect(
    () => () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    },
    []
  );

  const frameFor = (seg: number): Box => {
    const [a, b] = [K[seg], K[seg + 1]];
    const flat = a[1] === b[1];
    const dx = Math.abs(b[0] - a[0]);
    const dy = Math.abs(b[1] - a[1]);
    // Tight on the chapter; names need room above (flat) or to the lower right (rising).
    const w = Math.max(150, Math.min(W, flat ? dx + 60 : Math.max(dx + 110, (dy + 70) * (W / H))));
    const h = (w * H) / W;
    const cx = (a[0] + b[0]) / 2 + (flat ? 0 : w * 0.12);
    const cy = (a[1] + b[1]) / 2 + (flat ? -h * 0.2 : h * 0.06);
    return { x: cx - w / 2, y: cy - h / 2, w, h };
  };
  const zoomTo = (seg: number) => {
    setFocus(seg);
    animateTo(frameFor(seg));
  };
  const reset = () => {
    setFocus(null);
    animateTo(FULL);
  };

  useEffect(() => {
    if (focus === null) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && reset();
    const onDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) reset();
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus]);

  // ── Screen mapping ─────────────────────────────────────────────────────────
  const fit = Math.min(size.w / W, size.h / H);
  const offX = (size.w - W * fit) / 2;
  const offY = (size.h - H * fit) / 2;
  const toScreen = (x: number, y: number) => [
    offX + ((x - box.x) / box.w) * W * fit,
    offY + ((y - box.y) / box.h) * H * fit,
  ];
  const z = box.w / W; // user units per CSS px at fit 1: keeps strokes the same size while zooming
  const zoomed = focus !== null;
  const settled = focus !== null && Math.abs(box.w - frameFor(focus).w) < 1;

  const [hover, setHover] = useState<Placed | null>(null);

  // Names for the zoomed chapter, all at one angle, leaning away from the line:
  // up-right on flat stretches, down-right (perpendicular) on rising ones.
  // Parallel labels cannot overlap while the dots are MIN_PERP_PX apart
  // across the label direction; tighter than that, only numbers show.
  const labels = useMemo(() => {
    if (!zoomed || !settled || focus === null) return [];
    const steps = placed.filter((p) => p.seg === focus);
    if (steps.length === 0) return [];
    const [a, b] = [K[focus], K[focus + 1]];
    const lineDeg = (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI;
    const flat = Math.abs(lineDeg) < 5;
    const deg = flat ? -42 : lineDeg + 90;
    const screen = steps.map((p) => toScreen(p.x, p.y));
    if (steps.length > 1) {
      const gap = Math.hypot(screen[1][0] - screen[0][0], screen[1][1] - screen[0][1]);
      const perp = gap * Math.abs(Math.sin(((deg - lineDeg) * Math.PI) / 180));
      if (perp < MIN_PERP_PX) return [];
    }
    return steps.map((p, i) => ({ p, x: screen[i][0], y: screen[i][1], deg }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoomed, settled, focus, placed, box, size]);
  const showNumbers = zoomed && settled && labels.length === 0;

  const tip = hover || (zoomed && showNumbers ? current && current.seg === focus ? current : null : !zoomed ? current : null);

  const chapterSub = (c: DashboardChapter) =>
    c.status === "done" ? "Complete" : c.status === "upcoming" || c.status === "locked" ? "Upcoming" : `${c.done} of ${c.total} steps`;

  if (chapters.length === 0 || placed.length === 0) return <div className="jl" ref={rootRef} />;

  return (
    <div ref={rootRef} className={`jl${zoomed ? " zm" : ""}`}>
      {zoomed && (
        <div className="jh">
          <b style={{ color: CHAPTER_COLORS[focus % CHAPTER_COLORS.length].col }}>{chapters[focus].title}</b>
          <small>
            {chapters[focus].done} of {chapters[focus].total} steps done, open any step you have reached
          </small>
        </div>
      )}
      <svg
        viewBox={`${box.x} ${box.y} ${box.w} ${box.h}`}
        role="img"
        aria-label={`Your journey: ${placed.filter((p) => p.state === "done").length} of ${placed.length} steps done`}
        onClick={(e) => {
          if (e.target === e.currentTarget && zoomed) reset();
        }}
      >
        {chapters.map((c, i) => {
          const [a, b] = [K[i], K[i + 1]];
          const col = CHAPTER_COLORS[i % CHAPTER_COLORS.length].col;
          const dim = zoomed && focus !== i ? 0.15 : 1;
          let doneTo: [number, number] | null = null;
          if (progress) {
            if (i < progress.seg) doneTo = b;
            else if (i === progress.seg) doneTo = [progress.x, progress.y];
          }
          return (
            <g key={c.index} opacity={dim}>
              <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke="#d3dde0" strokeWidth={9 * z} strokeLinecap="round" />
              {doneTo && <line x1={a[0]} y1={a[1]} x2={doneTo[0]} y2={doneTo[1]} stroke={col} strokeWidth={9 * z} strokeLinecap="round" />}
            </g>
          );
        })}

        {placed.map((p) => {
          if (p === current) return null;
          const inFocus = zoomed && p.seg === focus;
          const col = p.state === "next" ? "#8ea3ab" : CHAPTER_COLORS[p.seg % CHAPTER_COLORS.length].col;
          const dim = zoomed && !inFocus ? 0.15 : 1;
          return (
            <g
              key={`${p.chapterIndex}-${p.stepIndex}`}
              className={`st${focus === p.seg && !canOpen(p) ? " na" : ""}`}
              opacity={dim}
              transform={`translate(${p.x} ${p.y}) scale(${z})`}
              onPointerEnter={() => setHover(p)}
              onPointerLeave={() => setHover(null)}
              onClick={(e) => {
                e.stopPropagation();
                if (focus !== p.seg) zoomTo(p.seg);
                else if (canOpen(p)) onOpenStep(p.chapterIndex, p.stepIndex);
              }}
            >
              <circle r={10} fill="transparent" />
              {inFocus && settled ? (
                <>
                  <circle r={7.5} fill={p.state === "done" ? col : "#fff"} stroke={col} strokeWidth={1.6} />
                  <text className="sn" y={2.6} textAnchor="middle" fontSize={7.5} fontWeight={700} fill={p.state === "done" ? "#fff" : "#5c7080"}>
                    {p.number}
                  </text>
                </>
              ) : (
                <circle className="b" r={3.1} fill="#fff" stroke={col} strokeOpacity={0.6} strokeWidth={1.2} />
              )}
            </g>
          );
        })}

        {K.map((pt, i) => {
          const dim = zoomed && i !== focus && i !== focus + 1 ? 0.15 : 1;
          return (
            <g key={`k${i}`} opacity={dim} transform={`translate(${pt[0]} ${pt[1]}) scale(${z})`} pointerEvents="none">
              {i === 0 ? (
                <circle r={8} fill={CHAPTER_COLORS[0].col} stroke="#fff" strokeWidth={3.5} />
              ) : i === K.length - 1 ? (
                <>
                  <circle r={11} fill="#14263a" stroke="#fff" strokeWidth={3} />
                  <path d="M-3 -5V5M-3 -5h7l-2 2.5 2 2.5h-7" stroke="#fff" strokeWidth={1.7} fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </>
              ) : (
                <circle r={9.5} fill="#fff" stroke="#14263a" strokeWidth={3.6} />
              )}
            </g>
          );
        })}

        {current && (
          <g
            className="st"
            opacity={zoomed && focus !== current.seg ? 0.15 : 1}
            transform={`translate(${current.x} ${current.y}) scale(${z})`}
            onPointerEnter={() => setHover(current)}
            onPointerLeave={() => setHover(null)}
            onClick={(e) => {
              e.stopPropagation();
              if (focus === current.seg) onOpenStep(current.chapterIndex, current.stepIndex);
              else zoomTo(current.seg);
            }}
          >
            <circle r={16} fill="transparent" />
            <circle className="pu" r={10} fill="none" stroke={CHAPTER_COLORS[current.seg % CHAPTER_COLORS.length].col} strokeWidth={2} />
            <circle r={11} fill="#fff" stroke={CHAPTER_COLORS[current.seg % CHAPTER_COLORS.length].col} strokeWidth={4.5} />
            {zoomed && settled ? (
              <text y={3} textAnchor="middle" fontSize={8.5} fontWeight={800} fill={CHAPTER_COLORS[current.seg % CHAPTER_COLORS.length].col}>
                {current.number}
              </text>
            ) : (
              <circle r={4} fill={CHAPTER_COLORS[current.seg % CHAPTER_COLORS.length].col} />
            )}
          </g>
        )}
      </svg>

      {/* Chapter labels on the overview */}
      {!zoomed &&
        chapters.map((c, i) => {
          const [a, b] = [K[i], K[i + 1]];
          const flat = a[1] === b[1];
          const [sx, sy] = toScreen((a[0] + b[0]) / 2, (a[1] + b[1]) / 2);
          return (
            <button
              key={`l${c.index}`}
              type="button"
              className="cl"
              style={{
                left: Math.max(4, Math.min(size.w - 140, flat ? sx - 60 : sx - 150)),
                top: flat ? (a[1] > H * 0.6 ? sy - 44 : sy + 16) : sy - 34,
                color: CHAPTER_COLORS[i % CHAPTER_COLORS.length].col,
              }}
              onClick={() => zoomTo(i)}
              title="Zoom into this chapter"
            >
              <b>{c.title}</b>
              <small>{chapterSub(c)}</small>
            </button>
          );
        })}

      {/* Step names in the zoomed chapter: alternate rows, never overlapping */}
      {labels.map(({ p, x, y, deg }) => {
        const text = p.name.length > LABEL_MAX_CHARS ? p.name.slice(0, LABEL_MAX_CHARS - 1).trimEnd() + "." : p.name;
        const style = { left: x, top: y, transform: `rotate(${deg}deg) translate(13px, -50%)` };
        const lock = p.lock ? " lk" : "";
        // Not reached yet: readable, but not a link.
        return canOpen(p) ? (
          <button
            key={`n${p.chapterIndex}-${p.stepIndex}`}
            type="button"
            className={`sl2 ${p.state}${lock}`}
            style={style}
            onClick={() => onOpenStep(p.chapterIndex, p.stepIndex)}
            title={p.lock ? `${p.name} (needs ${planName(p.lock.requiredPlan)})` : p.name}
          >
            {text}
          </button>
        ) : (
          <span key={`n${p.chapterIndex}-${p.stepIndex}`} className={`sl2 ${p.state} na${lock}`} style={style} title={p.name}>
            {text}
          </span>
        );
      })}

      {tip &&
        (() => {
          const [sx, sy] = toScreen(tip.x, tip.y);
          if (sx < -10 || sx > size.w + 10 || sy < 0 || sy > size.h) return null;
          const isHere = tip.state === "current" && !hover;
          const ch = chapters[tip.seg];
          return (
            <div className={`jt on${isHere ? " dk" : ""}`} style={{ left: Math.max(80, Math.min(size.w - 80, sx)), top: sy - 18 }}>
              {isHere ? (
                <>
                  <b>You are here, step {tip.number}</b>
                  <small>{tip.name}</small>
                </>
              ) : (
                <>
                  <b>{tip.name}</b>
                  <small>
                    Step {tip.number} of {tip.n}, {ch?.title}, {tip.state === "done" ? "done" : tip.state === "current" ? "you are here" : "upcoming"}
                  </small>
                  {tip.lock ? (
                    <small className="jt-l">Needs the {planName(tip.lock.requiredPlan)} plan</small>
                  ) : !canOpen(tip) ? (
                    <small className="jt-l">Opens when you reach it</small>
                  ) : null}
                </>
              )}
            </div>
          );
        })()}

      {zoomed && (
        <button type="button" className="jx" aria-label="Zoom out" onClick={reset}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      )}
    </div>
  );
}

function planName(plan: string) {
  return plan.charAt(0).toUpperCase() + plan.slice(1);
}
