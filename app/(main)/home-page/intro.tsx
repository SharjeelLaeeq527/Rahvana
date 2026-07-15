
"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronsRight } from "lucide-react";
import HeroAnimation from "./herosection";

const TEAL = "#2e7175";
const FD = "'Fraunces', Georgia, serif";
const FB = "'DM Sans', system-ui, sans-serif";

/* Cool, neutral paper — no warmth */
const PAPER = "#f0f1f3";
/* Fountain-pen dark blue-black ink */
const INK = (a: number) => `rgba(12,18,42,${a})`;

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const rnd = (a: number, b: number) => a + Math.random() * (b - a);

type Stage = "typing" | "sketch" | "dissolving" | "done";
type IntroProps = {
  skipToEnd?: boolean;
  onSkip?: () => void;
};

/* ─── Shared skip control — identical look & behaviour everywhere it's used ───
   Text link (no pill), but always-underlined + a soft corner vignette so it
   stays clearly legible/clickable against the paper/sketch behind it.
   `screenActive` reflects pointer/touch activity ANYWHERE on the page (not
   just hovering the button itself) so the control visibly "wakes up" the
   moment the person engages with the intro, instead of waiting for them to
   find the corner. No pill, no glow — just a subtle brighten + a slightly
   quicker arrow nudge. */
function SkipIntroButton({
  onClick,
  compact = false,
  screenActive = false,
}: {
  onClick: () => void;
  compact?: boolean;
  screenActive?: boolean;
}) {
  return (
    <div
      style={{
        position: "absolute",
        bottom: 0,
        right: 0,
        zIndex: 45,
        width: compact ? 140 : 180,
        height: compact ? 90 : 110,
        pointerEvents: "none",
        background:
          "radial-gradient(ellipse at 100% 100%, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0) 70%)",
      }}
    >
      <motion.button
        type="button"
        onClick={onClick}
        initial={{ opacity: 0, y: 6 }}
        animate={{
          opacity: 1,
          y: screenActive ? -3 : 0,
          scale: screenActive ? 1.06 : 1,
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.96 }}
        transition={{ duration: 0.32, ease: [0.34, 1.4, 0.64, 1] }}
        style={{
          position: "absolute",
          bottom: compact
            ? "max(16px, env(safe-area-inset-bottom))"
            : "max(22px, env(safe-area-inset-bottom))",
          right: compact ? 16 : 24,
          display: "flex",
          alignItems: "center",
          gap: 6,
          border: "none",
          borderBottom: `1.5px solid ${INK(screenActive ? 0.75 : 0.55)}`,
          background: "transparent",
          color: INK(screenActive ? 0.9 : 0.75),
          fontFamily: FB,
          fontSize: compact ? 11 : 13,
          fontWeight: 700,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          padding: "10px 1px 6px",
          minHeight: 40,
          cursor: "pointer",
          pointerEvents: "all",
          WebkitTapHighlightColor: "transparent",
        }}
      >
        Skip
        <motion.span
          className="skip-intro-arrow"
          animate={{ x: screenActive ? [0, 5, 0] : [0, 2, 0] }}
          transition={{
            duration: screenActive ? 0.9 : 1.8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{ display: "inline-flex" }}
        >
          <ChevronsRight size={15} strokeWidth={2.75} />
        </motion.span>
      </motion.button>
    </div>
  );
}

/* ─── Pre-computed hatching paths (SVG 1440×900 coordinate space) ──────────── */

/* Drop shadow — right side of browser, x strip 1130–1174, diagonal 45°        */
const SHADOW_R = Array.from({ length: 36 }, (_, i) => {
  const y = 252 + i * 12;
  return `M 1130 ${y} L 1172 ${y + 42}`;
}).join(" ");

/* Drop shadow — bottom of browser, y strip 686–728                             */
const SHADOW_B = Array.from({ length: 64 }, (_, i) => {
  const x = 312 + i * 12;
  return `M ${x} 686 L ${x + 42} 728`;
}).join(" ");

/* Titlebar — horizontal fill lines, y 254–298, spaced 8px                     */
const TB_H = Array.from({ length: 6 }, (_, i) => `M 312 ${254 + i * 8} L 1128 ${254 + i * 8}`).join(
  " "
);

/* Titlebar — cross-hatch NE diagonals                                          */
const TB_X = Array.from({ length: 12 }, (_, i) => {
  const x = 312 + i * 70;
  return `M ${x} 300 L ${x + 46} 254`;
}).join(" ");

/* Background corner hatching — top-left margin                                 */
const BG_TL = Array.from({ length: 13 }, (_, i) => {
  const o = i * 24;
  return `M ${38 + o} 84 L ${38 + o + 42} 126`;
}).join(" ");

/* Background corner hatching — bottom-right margin                             */
const BG_BR = Array.from({ length: 13 }, (_, i) => {
  const o = i * 24;
  return `M ${1196 + o} 740 L ${1196 + o + 42} 782`;
}).join(" ");

/* Left / right page-edge shading                                               */
const BG_L = Array.from(
  { length: 26 },
  (_, i) => `M 20 ${96 + i * 26} L 52 ${96 + i * 26 + 32}`
).join(" ");

const BG_R = Array.from(
  { length: 26 },
  (_, i) => `M 1386 ${96 + i * 26} L 1418 ${96 + i * 26 + 32}`
).join(" ");

/* Content area horizontal rules — faint, inside browser                        */
const CONTENT_RULES = Array.from({ length: 5 }, (_, i) => {
  const y = 410 + i * 52;
  const w = 440 + (i % 2) * 80;
  return `M 490 ${y} L ${490 + w} ${y}`;
}).join(" ");

/* Content area short vertical marks — simulate text columns                   */
const CONTENT_MARKS = Array.from(
  { length: 18 },
  (_, i) => `M ${490 + i * 42} 362 L ${490 + i * 42 + 3} 396`
).join(" ");

/* ─── Full-page hand-drawn sketch ─────────────────────────────────────────── */
function FullPageSketch({ go, vw, vh }: { go: boolean; vw: number; vh: number }) {
  /*
    Two rendering layers:
    A) Shading — NO filter (so fine hatching lines stay crisp and visible)
    B) Outlines — subtle pencil-ink filter for organic stroke quality

    Responsive: all paths live in a 1440×900 design space. We compute a
    uniform scale so the artwork fits the real viewport, then translate to
    center it — so the browser frame is always fully visible on any screen.
  */

  /*
    Scale strategy:
    - LANDSCAPE (desktop, tablet, landscape mobile): original `xMidYMid slice`
      behaviour — Math.max(vw/1440, vh/900). Fills the screen exactly as before.
    - PORTRAIT (mobile/tablet): cap so the browser frame (819×435 design px)
      fits within 90% screen width / 78% screen height. Decorative elements
      outside the frame may bleed off-screen — intentional and looks good.
  */
  const FRAME_W = 819; /* browser frame width in design space (x 309–1128) */
  const FRAME_H = 435; /* browser frame height in design space (y 250–685)  */
  const isPortrait = vh > vw;
  const scaleFill  = Math.max(vw / 1440, vh / 900); /* original slice scale  */
  const scale = isPortrait
    ? Math.min(scaleFill, (vw * 0.90) / FRAME_W, (vh * 0.78) / FRAME_H)
    : scaleFill;
  /* Center-offset so the scaled content sits in the middle of the viewport    */
  const tx = (vw - 1440 * scale) / 2;
  const ty = (vh - 900 * scale) / 2;

  /* Outline path: draws in via pathLength animation                            */
  const seg = (delay: number, dur: number, stroke: string, sw: number) => ({
    stroke,
    strokeWidth: String(sw / scale), /* compensate stroke for scale so width stays visually consistent */
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    fill: "none",
    initial: { pathLength: 0, opacity: 0 },
    animate: go ? { pathLength: 1, opacity: 1 } : {},
    transition: {
      pathLength: {
        duration: dur,
        delay,
        ease: [0.26, 0, 0.74, 1] as [number, number, number, number],
      },
      opacity: { duration: 0.05, delay },
    },
  });

  /* Shading path: opacity fade, no filter so strokes remain crisp              */
  const sh = (delay: number, stroke: string, sw: number) => ({
    stroke,
    strokeWidth: String(sw / scale),
    strokeLinecap: "round" as const,
    fill: "none",
    initial: { opacity: 0 },
    animate: go ? { opacity: 1 } : {},
    transition: { duration: 0.55, delay },
  });

  const main = INK(0.72);

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none" }}>
      <svg
        viewBox={`0 0 ${vw} ${vh}`}
        width="100%"
        height="100%"
        preserveAspectRatio="none"
        style={{ display: "block" }}
      >
        {/* Single transform group: scales 1440×900 artwork to fit any viewport */}
        <g transform={`translate(${tx},${ty}) scale(${scale})`}>
        <defs>
          {/*
            Pencil-ink filter — VERY subtle displacement for organic quality.
            High baseFrequency = fine grain (not large wobble).
            Low scale = strokes barely move, just enough to look hand-drawn.
          */}
          <filter id="pen-ink" x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence type="fractalNoise" baseFrequency="0.055" numOctaves="3" result="n" />
            <feDisplacementMap
              in="SourceGraphic"
              in2="n"
              scale="0.55"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>

        {/* ━━ LAYER A: SHADING (no filter — stays crisp) ━━━━━━━━━━━━━━━━━━━━ */}
        <g>
          {/* Page margins */}
          <motion.path {...sh(0.28, INK(0.08), 1.3)} d={BG_L} />
          <motion.path {...sh(0.38, INK(0.08), 1.3)} d={BG_R} />
          <motion.path {...sh(0.44, INK(0.1), 1.4)} d={BG_TL} />
          <motion.path {...sh(0.52, INK(0.1), 1.4)} d={BG_BR} />

          {/* Browser shading — inside rotation group */}
          <g transform="rotate(-5, 720, 460)">
            {/* Titlebar cross-hatch then horizontal lines (x before h = darker feel) */}
            <motion.path {...sh(0.66, INK(0.13), 1.0)} d={TB_X} />
            <motion.path {...sh(0.72, INK(0.2), 1.1)} d={TB_H} />
            {/* Drop shadows */}
            <motion.path {...sh(1.04, INK(0.28), 1.2)} d={SHADOW_R} />
            <motion.path {...sh(1.1, INK(0.28), 1.2)} d={SHADOW_B} />
            {/* Content area texture */}
            <motion.path {...sh(2.38, INK(0.1), 1.0)} d={CONTENT_RULES} />
            <motion.path {...sh(2.44, INK(0.07), 0.9)} d={CONTENT_MARKS} />
          </g>
        </g>

        {/* ━━ LAYER B: OUTLINES (pencil-ink filter) ━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <g filter="url(#pen-ink)">
          {/* ── Top nav ── */}
          <motion.path {...seg(0, 0.44, INK(0.4), 1.1)} d="M 44 52 C 400 50 920 53 1396 51" />
          <motion.path
            {...seg(0.02, 0.26, INK(0.48), 1.7)}
            d="M 44 18 L 162 18 C 168 18 173 23 173 28 L 173 44
               C 173 49 168 52 162 52 L 44 52 C 38 52 35 48 35 43
               L 35 28 C 35 22 38 18 44 18"
          />
          <motion.path {...seg(0.1, 0.14, INK(0.3), 1.2)} d="M 1104 33 L 1170 33" />
          <motion.path {...seg(0.17, 0.14, INK(0.3), 1.2)} d="M 1196 33 L 1262 33" />
          <motion.path {...seg(0.23, 0.12, INK(0.3), 1.2)} d="M 1286 33 L 1338 33" />
          <motion.path
            {...seg(0.14, 0.24, INK(0.36), 1.4)}
            d="M 1356 24 L 1400 24 C 1409 24 1413 29 1413 35
               C 1413 41 1409 45 1400 45 L 1356 45
               C 1347 45 1342 41 1342 35 C 1342 29 1347 24 1356 24"
          />

          {/* ── Jargon pills — scattered across the page ── */}
          <motion.path
            {...seg(0.07, 0.2, INK(0.24), 1.3)}
            d="M 80 130 L 176 130 C 188 130 193 156 176 156 L 80 156 C 66 156 62 130 80 130"
          />
          <motion.path
            {...seg(0.18, 0.18, INK(0.17), 1.2)}
            d="M 56 246 L 116 246 C 128 246 133 270 116 270 L 56 270 C 42 270 38 246 56 246"
          />
          <motion.path
            {...seg(0.3, 0.18, INK(0.2), 1.2)}
            d="M 88 374 L 164 374 C 177 374 182 398 164 398 L 88 398 C 74 398 70 374 88 374"
          />
          <motion.path
            {...seg(0.41, 0.2, INK(0.16), 1.2)}
            d="M 36 532 L 110 532 C 124 532 130 558 110 558 L 36 558 C 22 558 18 532 36 532"
          />
          <motion.path
            {...seg(0.51, 0.22, INK(0.22), 1.2)}
            d="M 70 686 L 212 686 C 227 686 233 712 212 712 L 70 712 C 56 712 50 686 70 686"
          />
          <motion.path
            {...seg(0.11, 0.18, INK(0.24), 1.3)}
            d="M 1258 118 L 1334 118 C 1348 118 1354 144 1334 144 L 1258 144 C 1242 144 1236 118 1258 118"
          />
          <motion.path
            {...seg(0.23, 0.2, INK(0.16), 1.2)}
            d="M 1222 228 L 1372 228 C 1388 228 1394 256 1372 256 L 1222 256 C 1206 256 1200 228 1222 228"
          />
          <motion.path
            {...seg(0.37, 0.2, INK(0.19), 1.2)}
            d="M 1290 472 L 1390 472 C 1406 472 1413 498 1390 498 L 1290 498 C 1274 498 1268 472 1290 472"
          />
          <motion.path
            {...seg(0.48, 0.22, INK(0.16), 1.2)}
            d="M 1172 652 L 1314 652 C 1331 652 1337 678 1314 678 L 1172 678 C 1156 678 1150 652 1172 652"
          />
          <motion.path
            {...seg(0.06, 0.17, INK(0.2), 1.2)}
            d="M 580 62 L 652 62 C 666 62 672 88 652 88 L 580 88 C 566 88 560 62 580 62"
          />
          <motion.path
            {...seg(0.15, 0.19, INK(0.16), 1.2)}
            d="M 754 68 L 866 68 C 880 68 887 94 866 94 L 754 94 C 740 94 733 68 754 68"
          />
          <motion.path
            {...seg(0.54, 0.2, INK(0.16), 1.2)}
            d="M 436 840 L 578 840 C 595 840 601 864 578 864 L 436 864 C 420 864 413 840 436 840"
          />
          <motion.path
            {...seg(0.6, 0.18, INK(0.16), 1.2)}
            d="M 728 852 L 828 852 C 843 852 849 878 828 878 L 728 878 C 714 878 707 852 728 852"
          />
          <motion.path
            {...seg(0.66, 0.2, INK(0.16), 1.2)}
            d="M 918 842 L 1060 842 C 1077 842 1083 868 1060 868 L 918 868 C 902 868 895 842 918 842"
          />

          {/* ── Browser window — rotated –5° around its center ── */}
          <g transform="rotate(-5, 720, 460)">
            {/* Outer frame — one long continuous pen stroke */}
            <motion.path
              {...seg(0.24, 1.84, main, 2.9)}
              d="M 336 250
                 C 522 246 822 247 1106 249
                 C 1119 249 1129 258 1128 268
                 L 1129 666
                 C 1129 676 1120 684 1109 685
                 C 822 688 522 687 313 685
                 C 303 685 310 676 310 666
                 L 309 268
                 C 309 258 322 250 336 250"
            />
            {/* Titlebar separator */}
            <motion.path
              {...seg(1.04, 0.48, INK(0.54), 1.8)}
              d="M 310 302 C 560 299 862 302 1128 300"
            />
            {/* Traffic lights */}
            <motion.path
              {...seg(1.44, 0.22, main, 2.1)}
              d="M 352 276 C 344 269 344 284 352 284 C 360 284 360 269 352 276"
            />
            <motion.path
              {...seg(1.59, 0.22, main, 2.1)}
              d="M 374 276 C 366 269 366 284 374 284 C 382 284 382 269 374 276"
            />
            <motion.path
              {...seg(1.74, 0.22, main, 2.1)}
              d="M 396 276 C 388 269 388 284 396 284 C 404 284 404 269 396 276"
            />
            {/* URL bar */}
            <motion.path
              {...seg(1.9, 0.44, INK(0.56), 1.8)}
              d="M 462 260 L 989 259 C 999 259 1005 266 1005 274
                 C 1005 282 999 290 989 291 L 462 292
                 C 452 292 446 285 446 277 C 446 269 452 260 462 260"
            />
            {/* Tab bar */}
            <motion.path
              {...seg(2.06, 0.38, INK(0.46), 1.5)}
              d="M 310 328 C 560 326 862 329 1128 327"
            />
            <motion.path
              {...seg(2.14, 0.22, INK(0.44), 1.4)}
              d="M 334 309 L 440 309 C 450 309 456 320 449 327 L 334 327 C 325 327 319 318 326 310 Z"
            />
            <motion.path
              {...seg(2.24, 0.19, INK(0.34), 1.4)}
              d="M 455 311 L 540 311 C 549 311 554 321 548 328 L 455 328 C 446 328 441 320 447 312 Z"
            />
          </g>

          {/* ── Late jargon — appears after browser is drawn ── */}
          <motion.path
            {...seg(2.48, 0.2, INK(0.24), 1.2)}
            d="M 164 140 L 254 140 C 268 140 274 164 254 164 L 164 164 C 148 164 142 140 164 140"
          />
          <motion.path
            {...seg(2.6, 0.18, INK(0.16), 1.2)}
            d="M 38 428 L 112 428 C 127 428 133 454 112 454 L 38 454 C 24 454 18 428 38 428"
          />
          <motion.path
            {...seg(2.72, 0.2, INK(0.19), 1.2)}
            d="M 1312 336 L 1402 336 C 1419 336 1425 362 1402 362 L 1312 362 C 1296 362 1289 336 1312 336"
          />
          <motion.path
            {...seg(2.82, 0.22, INK(0.16), 1.2)}
            d="M 1148 758 L 1300 758 C 1317 758 1323 784 1300 784 L 1148 784 C 1132 784 1125 758 1148 758"
          />
          <motion.path
            {...seg(2.9, 0.2, INK(0.16), 1.2)}
            d="M 222 772 L 358 772 C 375 772 381 798 358 798 L 222 798 C 205 798 198 772 222 772"
          />
          </g>
        </g>{/* end responsive scale group */}
      </svg>
    </div>
  );
}

/* ─── Cursor ────────────────────────────────────────────────────────────────── */
function Cur() {
  return (
    <span
      style={{
        display: "inline-block",
        width: 2,
        height: "0.80em",
        background: INK(0.55),
        marginLeft: 2,
        verticalAlign: "middle",
        borderRadius: 1,
        animation: "_twc 0.9s step-start infinite",
      }}
    />
  );
}

/* ─── Root ─────────────────────────────────────────────────────────────────── */
export default function Intro({ skipToEnd = false, onSkip }: IntroProps = {}) {
  const [stage, setStage] = useState<Stage>("typing");
  const [title, setTitle] = useState("");
  const [sub, setSub] = useState("");
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [cur, setCur] = useState<"ti" | "sb" | "l1" | "l2" | "off">("ti");
  const [heroSkip, setHeroSkip] = useState(skipToEnd);
  const skipRef = useRef(skipToEnd);

  // Tracks whether the pointer/touch has been active anywhere on screen
  // recently — used so the skip control visibly wakes up the moment the
  // person engages with the page, not just when hovering the button.
  const [pointerActive, setPointerActive] = useState(false);
  useEffect(() => {
    let idleTimer: ReturnType<typeof setTimeout>;
    const markActive = () => {
      setPointerActive(true);
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => setPointerActive(false), 1400);
    };
    window.addEventListener("mousemove", markActive);
    window.addEventListener("touchstart", markActive, { passive: true });
    return () => {
      window.removeEventListener("mousemove", markActive);
      window.removeEventListener("touchstart", markActive);
      clearTimeout(idleTimer);
    };
  }, []);

  const handleSkip = () => {
    skipRef.current = true;
    setHeroSkip(true);
    onSkip?.();
    setStage("done");
  };

  useEffect(() => {
    skipRef.current = skipToEnd;
    if (skipToEnd) {
      setHeroSkip(true);
      setStage("done");
      onSkip?.();
    }
  }, [skipToEnd, onSkip]);

  /* Viewport px */
  const [vw, setVw] = useState(() => (typeof window !== "undefined" ? window.innerWidth : 1440));
  const [vh, setVh] = useState(() => (typeof window !== "undefined" ? window.innerHeight : 900));
  useEffect(() => {
    const f = () => {
      setVw(window.innerWidth);
      setVh(window.innerHeight);
    };
    window.addEventListener("resize", f);
    return () => window.removeEventListener("resize", f);
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      await sleep(420);

      const TI = "Marriage-Based Immigration";
      setCur("ti");
      for (let i = 1; i <= TI.length; i++) {
        if (!alive || skipRef.current) return;
        setTitle(TI.slice(0, i));
        await sleep([" ", "-"].includes(TI[i - 1]) ? rnd(50, 95) : rnd(22, 52));
      }
      await sleep(180);

      const SB = "for spouses of US citizens";
      setCur("sb");
      for (let i = 1; i <= SB.length; i++) {
        if (!alive || skipRef.current) return;
        setSub(SB.slice(0, i));
        await sleep(SB[i - 1] === " " ? rnd(34, 68) : rnd(15, 38));
      }
      await sleep(300);

      const L1 = "The process didn't come with a map.";
      setCur("l1");
      for (let i = 1; i <= L1.length; i++) {
        if (!alive || skipRef.current) return;
        setLine1(L1.slice(0, i));
        await sleep(L1[i - 1] === " " ? rnd(26, 56) : rnd(12, 34));
      }
      await sleep(130);

      const L2 = "Now it does.";
      setCur("l2");
      for (let i = 1; i <= L2.length; i++) {
        if (!alive || skipRef.current) return;
        setLine2(L2.slice(0, i));
        await sleep(rnd(28, 60));
      }
      setCur("off");

      await sleep(1200);
      if (!alive || skipRef.current) return;
      setStage("sketch");

      await sleep(3200); /* sketch fully drawn (~2.9s) + brief hold */
      if (!alive || skipRef.current) return;
      setStage("dissolving");

      await sleep(1400); /* chunk mask dissolve */
      if (!alive || skipRef.current) return;
      setStage("done");
    })();
    return () => {
      alive = false;
    };
  }, []);

  const isDissolving = stage === "dissolving";
  const isDone = stage === "done";
  
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("hero-animation-playing", { detail: { playing: !isDone } })
    );
  }, [isDone]);

  /*
   * Mirror the FullPageSketch scale formula so text layout and SVG sketch
   * always agree about where the browser frame sits on screen.
   */
  const _FRAME_W = 819; /* frame width in design space  */
  const _FRAME_H = 435; /* frame height in design space */
  const _portrait = vh > vw;
  const _sFill     = Math.max(vw / 1440, vh / 900);
  const _sketchS   = _portrait
    ? Math.min(_sFill, (vw * 0.90) / _FRAME_W, (vh * 0.78) / _FRAME_H)
    : _sFill;
  /* Frame content-area center Y as a % of viewport height.
     Design-space Y of tab-bar ≈ 328, frame bottom = 685 → center = 506.5
     Screen Y = 506.5 * s + (vh - 900*s)/2  →  as % = 50 + 56.5*s/vh * 100 */
  const _sketchTopPct = `${Math.round((0.5 + 56.5 * _sketchS / vh) * 100)}%`;
  /* Text container: 82% of the frame pixel width (88% on mobile portrait to reduce wrapping), clamped 220–500px */
  const _textW = `${Math.min(500, Math.max(220, Math.floor(_FRAME_W * _sketchS * (_portrait ? 0.88 : 0.82))))}px`;

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        minHeight: "100dvh",
        overflowX: "clip",
        background: "#f5f7f8",
      }}
    >
      {/* Hero animation — only renders after morph completes */}
      {isDone && (
        <motion.div
          /* Stage 4: Hero scales 0.985 → 1 (1.0–1.6s) */
          /* Stage 5: Hero blur 6px → 0px (1.0–1.8s) */
          /* Stage 6: Hero opacity 0 → 1 (1.0–1.8s) */
          /* Stage 7: Tiny spring settle (2.2–2.5s) */
          initial={{ scale: 0.985, filter: "blur(6px)", opacity: 0 }}
          animate={{
            scale: [0.985, 1, 1.015, 1],
            filter: ["blur(6px)", "blur(0px)", "blur(0px)", "blur(0px)"],
            opacity: [0, 1, 1, 1],
          }}
          transition={{
            scale: {
              duration: 1.3,
              delay: 0,
              times: [0, 0.46, 0.85, 1],
              ease: [0.34, 1.56, 0.64, 1] /* Spring */,
            },
            filter: {
              duration: 0.8,
              delay: 0,
              times: [0, 1, 1, 1],
              ease: "easeOut",
            },
            opacity: {
              duration: 0.8,
              delay: 0,
              times: [0, 1, 1, 1],
              ease: "easeOut",
            },
          }}
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 0,
            transformOrigin: "center center",
          }}
        >
          <HeroAnimation skipToEnd={heroSkip} />
        </motion.div>
      )}

      {/* Background color transition from paper to hero UI.
          Absolute (not fixed) so it scrolls away with the rest of the
          intro instead of staying pinned over the whole viewport. */}
      <motion.div
        animate={{
          background: isDone
            ? "linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 40%, #94a3b8 100%)"
            : PAPER,
        }}
        transition={{ duration: 1.2, ease: "easeInOut" }}
        style={{
          position: "absolute",
          inset: 0,
          zIndex: -1,
        }}
      />

      {/* ── Paper + sketch + text overlay — all dissolve together ─── */}
      <AnimatePresence>
        {!isDone && (
          <SkipIntroButton onClick={handleSkip} compact={vw < 640} screenActive={pointerActive} />
        )}

        {!isDone && (
          <motion.div
            key="intro"
            /* Stage 1: Paper texture fades out (0–0.5s) */
            animate={{
              backgroundColor: isDissolving ? "rgba(240, 241, 243, 0)" : PAPER,
            }}
            transition={{
              backgroundColor: { duration: 0.5, ease: "easeOut" },
            }}
            exit={{ opacity: 0, transition: { duration: 0.12 } }}
            style={{
              /* Absolute (not fixed): anchors to the outer `position: relative`
                 wrapper above, so this overlay scrolls away with the page
                 instead of staying pinned over the viewport while scrolling. */
              position: "absolute",
              inset: 0,
              zIndex: 40,
              pointerEvents: isDissolving ? "none" : "all",
            }}
          >
            {/* Intro text — fades with sketch */}
            <motion.div
              animate={{
                top: stage === "sketch" || stage === "dissolving" ? _sketchTopPct : "50%",
                opacity: isDissolving ? [1, 0] : 1 /* Fades out with sketch */,
                filter: isDissolving
                  ? ["blur(0px)", "blur(2px)"]
                  : "blur(0px)" /* Subtle blur as it fades */,
              }}
              transition={{
                top: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
                opacity: { duration: 0.5, delay: 0.5, ease: "easeOut" },
                filter: { duration: 0.5, delay: 0.5, ease: "easeOut" },
              }}
              style={{
                position: "absolute",
                left: "50%",
                /* Always rotate -5° during sketch — matches the SVG frame's own
                   rotate(-5, 720, 460) so text and frame visually align on all screens */
                transform: `translateX(-50%) translateY(-50%)
                            rotate(${stage === "sketch" || stage === "dissolving" ? "-5deg" : "0deg"})`,
                zIndex: 2,
                textAlign: "center",
                width: _textW,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 0,
                padding: "0 4px",
              }}
            >
              {/* Title */}
              {title && (
                <div
                  style={{
                    fontFamily: FD,
                    fontSize: _portrait ? "clamp(15px, 5vw, 58px)" : "clamp(26px, 6.5vw, 58px)",
                    fontWeight: 900,
                    lineHeight: 1.05,
                    letterSpacing: "-0.03em",
                    color: INK(0.88),
                    WebkitFontSmoothing: "antialiased",
                  }}
                >
                  {title}
                  {cur === "ti" && <Cur />}
                </div>
              )}

              {/* Sub — minimal uppercase tracking */}
              {sub && (
                <div
                  style={{
                    fontFamily: FB,
                    fontSize: _portrait ? "clamp(7px, 1.5vw, 11px)" : "clamp(9px, 1.8vw, 11px)",
                    fontWeight: 400,
                    letterSpacing: "0.22em",
                    textTransform: "uppercase",
                    color: INK(0.4),
                    marginTop: _portrait ? `${Math.round(6 * _sketchS)}px` : "clamp(6px, 1.2vw, 9px)",
                  }}
                >
                  {sub}
                  {cur === "sb" && <Cur />}
                </div>
              )}

              {/* Divider */}
              {line1 && (
                <div
                  style={{
                    width: 24,
                    height: 1,
                    background: INK(0.18),
                    margin: _portrait 
                      ? `${Math.round(10 * _sketchS)}px 0 ${Math.round(8 * _sketchS)}px`
                      : "clamp(14px, 2.4vw, 20px) 0 clamp(12px, 2vw, 17px)",
                    alignSelf: "center",
                  }}
                />
              )}

              {/* Payoff line 1 */}
              {line1 && (
                <div
                  style={{
                    fontFamily: FD,
                    fontSize: _portrait ? "clamp(9px, 2.5vw, 18px)" : "clamp(14px, 3vw, 18px)",
                    fontWeight: 400,
                    fontStyle: "italic",
                    color: INK(0.58),
                    lineHeight: _portrait ? 1.3 : 1.5,
                  }}
                >
                  {line1}
                  {cur === "l1" && <Cur />}
                </div>
              )}

              {/* Payoff line 2 */}
              {line2 && (
                <div
                  style={{
                    fontFamily: FD,
                    fontSize: _portrait ? "clamp(9px, 2.5vw, 18px)" : "clamp(14px, 3vw, 18px)",
                    fontWeight: 700,
                    color: TEAL,
                    marginTop: _portrait ? `${Math.round(2 * _sketchS)}px` : "clamp(2px, 0.4vw, 4px)",
                  }}
                >
                  {line2}
                  {cur === "l2" && <Cur />}
                </div>
              )}
            </motion.div>

            {/* Sketch */}
            {(stage === "sketch" || stage === "dissolving") && (
              /* Stage 2 & 3: Sketch lines dissolve (opacity + blur) (0.5–1.0s) */
              <motion.div
                animate={{
                  opacity: isDissolving ? [1, 0] : 1,
                  filter: isDissolving ? ["blur(0px)", "blur(4px)"] : "blur(0px)",
                }}
                transition={{
                  opacity: { duration: 0.5, delay: 0.5, ease: "easeOut" },
                  filter: { duration: 0.5, delay: 0.5, ease: "easeOut" },
                }}
                style={{
                  position: "absolute",
                  inset: 0,
                }}
              >
                <FullPageSketch go={true} vw={vw} vh={vh} />
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes _twc { 50% { opacity: 0 } }

        .skip-intro-arrow {
          transition: transform 0.28s cubic-bezier(0.22,1,0.36,1);
        }
        button:hover .skip-intro-arrow {
          transform: translateX(3px);
        }
      `}</style>
    </div>
  );
}