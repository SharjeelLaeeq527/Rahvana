import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, animate as mAnimate } from "motion/react";
import * as Icons from "lucide-react";

// ─── Design tokens ─────────────────────────────────────────────────────────────
const BG      = "#dde8ed";
const HERO_BG = "#f5f7f8";
const TEAL    = "#2e7175";
const TEALB   = "#235658";
const INDIGO  = "#4a4070";
const SLATE   = "#6b7c87";
const ORANGE  = "#7a6040";
const CRIMSON = "#7a4a55";
const FD      = "'Fraunces', Georgia, serif";
const FB      = "'DM Sans', system-ui, sans-serif";

const JA="#3d7275", JB="#607080", JC="#8fa0a8", JD="#7a6535", JE="#7a4a55", JF="#7a6050";

const FIVE_IDS = new Set([1, 10, 11, 15, 22]);

// ─── Jargon data ───────────────────────────────────────────────────────────────
const JARGON = [
  {id:0,  text:"I-130",           x:"3%",  y:"7%",  sz:13,rot:-5,  col:JA,op:1,   w:"700"},
  {id:1,  text:"USCIS",           x:"11%", y:"16%", sz:26,rot:-12, col:JB,op:.80, w:"800"},
  {id:2,  text:"Petitioner",      x:"5%",  y:"28%", sz:11,rot:8,   col:JC,op:.85, w:"500"},
  {id:3,  text:"RFE",             x:"77%", y:"5%",  sz:24,rot:11,  col:JD,op:.95, w:"900"},
  {id:4,  text:"NOA1",            x:"68%", y:"17%", sz:14,rot:6,   col:JC,op:.85, w:"600"},
  {id:5,  text:"NOA",             x:"6%",  y:"87%", sz:17,rot:13,  col:JA,op:.90, w:"700"},
  {id:6,  text:"Green Card",      x:"20%", y:"86%", sz:19,rot:-14, col:JB,op:.80, w:"700"},
  {id:7,  text:"DACA",            x:"68%", y:"90%", sz:21,rot:-11, col:JA,op:.95, w:"800"},
  {id:8,  text:"Embassy",         x:"89%", y:"90%", sz:14,rot:-7,  col:JD,op:.85, w:"600"},
  {id:9,  text:"I-485",           x:"87%", y:"13%", sz:12,rot:-9,  col:JA,op:.80, w:"600"},
  {id:10, text:"NVC",             x:"29%", y:"4%",  sz:30,rot:-5,  col:JB,op:.65, w:"900"},
  {id:11, text:"DS-260",          x:"48%", y:"8%",  sz:15,rot:9,   col:JA,op:.85, w:"700"},
  {id:12, text:"I-140",           x:"38%", y:"14%", sz:11,rot:-11, col:JD,op:.75, w:"600"},
  {id:13, text:"I-864",           x:"14%", y:"40%", sz:17,rot:-6,  col:JA,op:.95, w:"700"},
  {id:14, text:"Biometrics",      x:"3%",  y:"52%", sz:11,rot:12,  col:JC,op:.75, w:"500"},
  {id:15, text:"PERM",            x:"9%",  y:"63%", sz:21,rot:-13, col:JD,op:.90, w:"900"},
  {id:16, text:"I-693",           x:"82%", y:"26%", sz:19,rot:-14, col:JB,op:.75, w:"700"},
  {id:17, text:"AP / EAD",        x:"78%", y:"42%", sz:13,rot:16,  col:JD,op:.85, w:"600"},
  {id:18, text:"485J",            x:"92%", y:"47%", sz:18,rot:-8,  col:JA,op:.90, w:"800"},
  {id:19, text:"I-797",           x:"87%", y:"58%", sz:12,rot:11,  col:JD,op:.80, w:"600"},
  {id:20, text:"EB-2",            x:"85%", y:"78%", sz:17,rot:-17, col:JA,op:.85, w:"700"},
  {id:21, text:"I-751",           x:"4%",  y:"80%", sz:13,rot:9,   col:JD,op:.90, w:"600"},
  {id:22, text:"EAD",             x:"7%",  y:"46%", sz:22,rot:10,  col:JA,op:.95, w:"900"},
  {id:23, text:"I-539",           x:"2%",  y:"36%", sz:15,rot:-18, col:JD,op:.85, w:"600"},
  {id:24, text:"Advance Parole",  x:"4%",  y:"74%", sz:10,rot:5,   col:JC,op:.75, w:"500"},
  {id:25, text:"NOA2",            x:"93%", y:"64%", sz:15,rot:-13, col:JB,op:.85, w:"700"},
  {id:26, text:"Joint Sponsor",   x:"91%", y:"36%", sz:11,rot:-5,  col:JC,op:.80, w:"500"},
  {id:27, text:"Affidavit",       x:"18%", y:"33%", sz:12,rot:9,   col:JA,op:.60, w:"500"},
  {id:28, text:"I-212",           x:"14%", y:"82%", sz:16,rot:-8,  col:JA,op:.85, w:"700"},
  {id:29, text:"F-1",             x:"48%", y:"82%", sz:19,rot:-18, col:JB,op:.75, w:"800"},
  {id:30, text:"Tax Returns",     x:"46%", y:"93%", sz:10,rot:-10, col:JC,op:.70, w:"500"},
  {id:31, text:"Interview",       x:"72%", y:"55%", sz:14,rot:12,  col:JB,op:.55, w:"600"},
  {id:32, text:"Priority Date",   x:"54%", y:"3%",  sz:10,rot:7,   col:JC,op:.80, w:"500"},
  {id:33, text:"?",               x:"18%", y:"22%", sz:58,rot:-11, col:JB,op:.05, w:"700"},
  {id:34, text:"?",               x:"78%", y:"34%", sz:44,rot:17,  col:JA,op:.07, w:"700"},
  {id:35, text:"Medical Exam",    x:"22%", y:"57%", sz:13,rot:-10, col:JC,op:.55, w:"500"},
  {id:36, text:"DS-5540",         x:"16%", y:"72%", sz:11,rot:5,   col:JD,op:.65, w:"600"},
  {id:37, text:"I-94",            x:"80%", y:"67%", sz:17,rot:-9,  col:JD,op:.65, w:"700"},
  {id:38, text:"Vaccinations",    x:"82%", y:"83%", sz:11,rot:9,   col:JC,op:.75, w:"500"},
  {id:39, text:"CR-1",            x:"36%", y:"76%", sz:12,rot:10,  col:JC,op:.65, w:"500"},
  {id:40, text:"BIA",             x:"61%", y:"64%", sz:14,rot:-8,  col:JD,op:.60, w:"600"},
  {id:41, text:"Civil Documents", x:"42%", y:"19%", sz:9, rot:-3,  col:JC,op:.65, w:"500"},
  {id:42, text:"AOS Fee",         x:"57%", y:"19%", sz:9, rot:-7,  col:JC,op:.60, w:"500"},
  {id:43, text:"Sponsor",         x:"34%", y:"90%", sz:12,rot:7,   col:JA,op:.80, w:"600"},
  {id:44, text:"Appeal",          x:"38%", y:"5%",  sz:13,rot:14,  col:JA,op:.75, w:"600"},
  {id:45, text:"K-1 Visa",        x:"64%", y:"11%", sz:12,rot:10,  col:JD,op:.70, w:"600"},
  {id:46, text:"?",               x:"35%", y:"48%", sz:80,rot:-6,  col:JB,op:.04, w:"700"},
  {id:47, text:"?",               x:"68%", y:"28%", sz:50,rot:13,  col:JD,op:.07, w:"700"},
  {id:48, text:"?",               x:"8%",  y:"55%", sz:64,rot:-19, col:JA,op:.06, w:"700"},
  {id:49, text:"?",               x:"90%", y:"72%", sz:40,rot:9,   col:JB,op:.09, w:"700"},
  {id:50, text:"CBP",             x:"44%", y:"56%", sz:13,rot:-11, col:JB,op:.50, w:"600"},
  {id:51, text:"IR-1",            x:"26%", y:"46%", sz:10,rot:13,  col:JA,op:.55, w:"500"},
  {id:52, text:"Case Review",     x:"76%", y:"81%", sz:12,rot:7,   col:JB,op:.70, w:"500"},
  {id:53, text:"Marriage Cert",   x:"10%", y:"23%", sz:10,rot:12,  col:JC,op:.65, w:"500"},
  {id:54, text:"Pay Stubs",       x:"93%", y:"22%", sz:10,rot:-12, col:JC,op:.65, w:"500"},
  {id:55, text:"I-797C",          x:"28%", y:"77%", sz:11,rot:9,   col:JD,op:.70, w:"500"},
  {id:56, text:"Employer Letter", x:"65%", y:"85%", sz:9, rot:-4,  col:JC,op:.60, w:"500"},
  {id:57, text:"?",               x:"58%", y:"80%", sz:60,rot:10,  col:JB,op:.04, w:"700"},
  {id:58, text:"?",               x:"25%", y:"62%", sz:46,rot:-13, col:JA,op:.06, w:"700"},
  {id:59, text:"?",               x:"74%", y:"48%", sz:68,rot:-5,  col:JB,op:.05, w:"700"},
  {id:60, text:"Wait Times",      x:"40%", y:"30%", sz:11,rot:-8,  col:JC,op:.62, w:"500"},
  {id:61, text:"Processing",      x:"55%", y:"45%", sz:13,rot:6,   col:JE,op:.68, w:"600"},
  {id:62, text:"Denied",          x:"63%", y:"38%", sz:16,rot:-15, col:JE,op:.72, w:"700"},
  {id:63, text:"Approved",        x:"32%", y:"58%", sz:14,rot:11,  col:TEAL,op:.58,w:"600"},
  {id:64, text:"Pending",         x:"50%", y:"68%", sz:12,rot:-7,  col:JF,op:.64, w:"500"},
  {id:65, text:"I-90",            x:"42%", y:"38%", sz:10,rot:13,  col:JA,op:.58, w:"500"},
  {id:66, text:"Status Check",    x:"59%", y:"25%", sz:9, rot:-9,  col:JC,op:.52, w:"500"},
  {id:67, text:"Timeline",        x:"25%", y:"50%", sz:15,rot:8,   col:JD,op:.66, w:"600"},
  {id:68, text:"Citizenship",     x:"70%", y:"60%", sz:11,rot:-12, col:JB,op:.60, w:"500"},
  {id:69, text:"Naturalization",  x:"15%", y:"58%", sz:10,rot:14,  col:JC,op:.54, w:"500"},
  {id:70, text:"I-20",            x:"45%", y:"15%", sz:12,rot:-6,  col:JA,op:.58, w:"600"},
  {id:100,text:"Spouse Visa Requirements",x:"30%",y:"35%",sz:12,rot:0,col:INDIGO,op:.92,w:"600",result:true},
  {id:101,text:"NVC Case Processing",     x:"30%",y:"42%",sz:12,rot:0,col:INDIGO,op:.92,w:"600",result:true},
  {id:102,text:"DS-260 Form Guide",       x:"30%",y:"49%",sz:12,rot:0,col:INDIGO,op:.92,w:"600",result:true},
  {id:103,text:"Interview Preparation",   x:"30%",y:"56%",sz:12,rot:0,col:INDIGO,op:.92,w:"600",result:true},
];

const WAVE_IDS = {
  1:[0,1,2,3,4,5,6,7,8,9,10,11,12],
  2:[13,14,15,16,17,18,19,20,21,22,23,24],
  3:[25,26,27,28,29,30,31,32,33,34,35,36,37,38,60,61,62,63],
  4:[39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,64,65,66,67,68,69,70],
  5:[100,101,102,103],
};

const NARR_BEATS = [
  {
    eyebrow: "You just wanted a simple answer.",
    lines: [{ text: "WHERE TO START?" }],
    sub: "Spouse Visa  ·  IR-1  ·  K-1",
    accent: "#1e293b",
  },
  {
    eyebrow: "But one thing leads to ten others.",
    lines: [{ text: "IT NEVER" }, { text: "STOPS." }],
    accent: "#1e293b",
  },
  {
    eyebrow: "The information is out there, sure.",
    lines: [{ text: "HOW DOES IT" }, { text: "APPLY TO YOU?" }],
    accent: "#1e293b",
  },
  {
    eyebrow: "You don't need a list of forms.",
    lines: [{ text: "YOU NEED" }, { text: "A CLEAR PATH." }],
    sub: "and that's exactly what we built.",
    accent: "#1e293b",
  },
];

// ─── Cinematic slides — slide 0 holds 2800ms, slide 1 (last) holds 4800ms ────
const CIN_SLIDES = [
  {
    eyebrow: "Stop piecing it together yourself.",
    lines: [{ text: "SEE EXACTLY" }, { text: "WHAT'S NEXT." }],
    accent: "#1e293b",
    holdMs: 2800,
  },
  {
    eyebrow: "Because immigration isn't a search.",
    lines: [{ text: "IT'S A" }, { text: "PROCESS." }],
    sub: "and every process needs a map.",
    accent: "#1e293b",
    holdMs: 4800, // ← much longer hold for the last slide
  },
];

const sleep = (ms : number) => new Promise(r => setTimeout(r, ms));
const rand  = (a : number, b : number) => a + Math.random() * (b - a);

export default function App() {
  const [query,         setQuery]         = useState("");
  const [submitted,     setSubmit]        = useState(false);
  const [tabs, setTabs] = useState<{ id: string; label: string }[]>([]);
  const [subTabs,       setSubTabs]       = useState({});
  const [activeTab, setActive] = useState<string | null>(null);
  const [visibleJ, setVisibleJ] = useState<Set<number>>(new Set());
  const [content, setContent] = useState<
  { kind: "search" } | { kind: "narration"; sceneIdx: number }
>({ kind: "search" });
  const [endPhase,      setEndPhase]      = useState(null);
  const [listWords, setListWords] = useState<string[]>([]);
  const [convergingIdx, setConvergingIdx] = useState(-1);
  const [fade,          setFade]          = useState(0);
  const [typeText,      setTypeText]      = useState("");
  const [narrPhase,     setNarrPhase]     = useState(null);
  const [seqHl, setSeqHl] = useState<number | null>(null);
  const [cVis,          setCVis]          = useState(new Set());

  // Responsive: track viewport width
  const [vw, setVw] = useState(typeof window !== "undefined" ? window.innerWidth : 1200);
  useEffect(() => {
    const onResize = () => setVw(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  const isMobile  = vw < 640;
  const isTablet  = vw >= 640 && vw < 1024;
  const browserW  = isMobile ? Math.min(vw - 24, 420) : isTablet ? Math.min(vw - 48, 600) : 720;

  useEffect(() => {
    if (typeof document !== "undefined") {
      if (endPhase !== "hero") {
        document.body.style.overflow = "hidden";
        document.documentElement.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "";
        document.documentElement.style.overflow = "";
      }
    }
    return () => {
      if (typeof document !== "undefined") {
        document.body.style.overflow = "";
        document.documentElement.style.overflow = "";
      }
    };
  }, [endPhase]);

  const camZoom = useMotionValue(0.80);
  const camX    = useMotionValue(0);
  const camY    = useMotionValue(0);
  const camRot  = useMotionValue(-2);
  const shakeX  = useMotionValue(0);
  const shakeY  = useMotionValue(0);

  const stageT = useTransform(
  [camZoom, camX, camY, camRot, shakeX, shakeY],
  (values) => {
    const [z, x, y, r, sx, sy] =
      values as [number, number, number, number, number, number];

    return `translate3d(${x + sx}px,${y + sy}px,0)
            scale(${z})
            rotate(${r}deg)`;
  }
  );

  useEffect(() => {
    if (narrPhase !== 3) { setSeqHl(null); return; }
    const ids = Array.from(visibleJ).filter(id => JARGON[id]?.text !== "?");
    if (!ids.length) return;
    let i = 0;
    const iv = setInterval(() => { setSeqHl(ids[i % ids.length]); i++; }, 180);
    return () => clearInterval(iv);
  }, [narrPhase, visibleJ]);

  useEffect(() => {
    let active = true;
   type CameraTarget = {
        zoom?: number;
        x?: number;
        y?: number;
        rotate?: number;
      };

      const cam = (
        to: CameraTarget,
        dur: number = 1.1
      ) => {
      const ease = [0.22, 1, 0.36, 1];
      if (to.zoom   !== undefined) mAnimate(camZoom, to.zoom,   { duration: dur, ease });
      if (to.x      !== undefined) mAnimate(camX,    to.x,      { duration: dur, ease });
      if (to.y      !== undefined) mAnimate(camY,    to.y,      { duration: dur, ease });
      if (to.rotate !== undefined) mAnimate(camRot,  to.rotate, { duration: dur, ease });
    };
    const shake = async () => {
      for (let i = 0; i < 16; i++) { if (!active) return; shakeX.set(rand(-12, 12)); shakeY.set(rand(-8, 8)); await sleep(32); }
      shakeX.set(0); shakeY.set(0);
    };
    const narrate = async (sceneIdx, holdMs, level) => {
      setNarrPhase(level);
      setContent({ kind: "narration", sceneIdx });
      await sleep(holdMs);
      if (!active) return;
      setContent({ kind: "search" });
      setNarrPhase(null);
      await sleep(300);
    };
    const wave  = w => setVisibleJ(p => { const n = new Set(p); (WAVE_IDS[w] || []).forEach(id => n.add(id)); return n; });
    const show  = i => setCVis(p => new Set([...p, i]));
    const clearC = () => setCVis(new Set());

    (async () => {
      cam({ zoom: 0.58, x: 30, y: 40, rotate: -8 }, 0.01);
      await sleep(300);
      cam({ zoom: 0.75, x: -15, y: 10, rotate: 3 }, 2.2);
      await sleep(600);

      setSubmit(false);
      const q1 = "how do I bring my spouse to the US";
      for (let i = 0; i < q1.length; i++) {
        if (!active) return;
        setQuery(q1.slice(0, i + 1));
        await sleep(q1[i] === " " ? rand(80, 180) : rand(35, 90));
        if (Math.random() < 0.15 && q1[i] === " ") { await sleep(rand(200, 500)); }
      }
      await sleep(400); setSubmit(true);
      cam({ zoom: 1.05, x: 10, y: -30, rotate: -1.5 }, 0.9);
      setTabs(p => [...p, { id: "spouse", label: "Spouse Visa" }]);
      setActive("spouse");
      wave(1);
      await sleep(800);
      await narrate(0, 2400, 1);

      let len = 0; setQuery(q => { len = q.length; return q; }); await sleep(0);
      for (let i = 0; i < len; i++) { if (!active) return; setQuery(q => q.slice(0, -1)); await sleep(12); }
      setSubmit(false); await sleep(500);
      const typo = "what is NCV";
      for (const ch of typo) { if (!active) return; setQuery(q => q + ch); await sleep(rand(40, 75)); }
      await sleep(600);
      for (let i = 0; i < 3; i++) { if (!active) return; setQuery(q => q.slice(0, -1)); await sleep(90); }
      await sleep(200);
      for (const ch of "NVC") { if (!active) return; setQuery(q => q + ch); await sleep(60); }
      await sleep(350); setSubmit(true);
      setTabs(p => [...p, { id: "nvc", label: "NVC" }]); setActive("nvc");
      await sleep(700);

      setSubTabs({ nvc: [
        { id: "ds260",     label: "DS-260" },
        { id: "civdocs",   label: "Civil Documents" },
        { id: "interview", label: "Interview" },
        { id: "fees",      label: "Fees" },
        { id: "medical",   label: "Medical Exam" },
        { id: "police",    label: "Police Certificate" },
        { id: "affidavit", label: "Affidavit of Support" },
      ]});
      setActive("ds260");
      cam({ zoom: 1.25, x: 120, y: -50, rotate: -4.5 }, 1.0);
      wave(2);
      await sleep(800);
      await narrate(1, 2600, 2);

      wave(3);
      cam({ zoom: 0.88, x: -40, y: 15, rotate: 2.8 }, 1.4);
      await sleep(500);
      await narrate(2, 2400, 3);

      wave(4);
      await shake();
      cam({ zoom: 0.72, x: 20, y: 35, rotate: -5.2 }, 1.3);
      await sleep(700);
      await narrate(3, 3000, 4);

      let len2 = 0; setQuery(q => { len2 = q.length; return q; }); await sleep(0);
      for (let i = 0; i < len2; i++) { if (!active) return; setQuery(q => q.slice(0, -1)); await sleep(12); }
      setSubmit(false); await sleep(400);
      const q3 = "what am i missing???????";
      for (const ch of q3) { if (!active) return; setQuery(q => q + ch); await sleep(rand(40, 75)); }
      await sleep(500); setSubmit(true);
      await sleep(800);

      setEndPhase("list");
      const words = ["Forms.", "Documents.", "Deadlines.", "Interviews.", "Requirements.", "Fees.", "Translations.", "Proofs."];
      for (let i = 0; i < words.length; i++) {
        if (!active) return; setListWords(words.slice(0, i + 1)); await sleep(280);
      }
      await sleep(2000);
      for (let i = 0; i < words.length; i++) {
        if (!active) return; setConvergingIdx(i); await sleep(60);
      }
      await sleep(600);
      setListWords([]);
      await sleep(100);

      setEndPhase("cinematic");
      // Show slide 0, hold for its own holdMs, then slide 1 for its holdMs
      show(0); await sleep(CIN_SLIDES[0].holdMs);
      show(1); await sleep(CIN_SLIDES[1].holdMs);  // ← 4800ms for the last slide
      clearC(); await sleep(400);

      setEndPhase("fade");
      for (let i = 1; i <= 30; i++) { if (!active) return; setFade(i / 30); await sleep(20); }
      await sleep(100);
      setEndPhase("hero");

      const full = "Let's map it out.";
      for (let i = 0; i <= full.length; i++) { if (!active) return; setTypeText(full.slice(0, i)); await sleep(rand(38, 82)); }
    })();

    return () => { active = false; };
  }, [camZoom, camX, camY, camRot, shakeX, shakeY]);

  const showStage    = endPhase === null;
  const isN          = content.kind === "narration";
  const narrSceneIdx = isN ? content.sceneIdx : null;

  return (
    <section style={{
      position: "relative", zIndex: 50,
      height: "100vh", width: "100%", overflow: "hidden",
      fontFamily: FB,
      background: "linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 40%, #94a3b8 100%)",
    }}>
      {/* Fade overlay */}
      {fade > 0 && (
        <div style={{ position: "absolute", inset: 0, background: HERO_BG, opacity: fade, zIndex: 60, pointerEvents: "none" }} />
      )}

      {/* ── Jargon scatter ── */}
      {endPhase !== "hero" && (
        <div style={{ position: "absolute", inset: 0, zIndex: 10, pointerEvents: "none" }}>
          {JARGON.map(j => {
            if (!visibleJ.has(j.id)) return null;
            const isPill   = j.text !== "?";
            const isResult = j.result;
            const isHl5    = narrPhase === 2 && FIVE_IDS.has(j.id);
            const isSeqH   = narrPhase === 3 && seqHl === j.id;
            const isJitter = narrPhase === 4 && isPill;

            let dx = 0, dy = 0, dop = j.op;
            if (isN) {
              dop = j.op * (isHl5 ? 0.7 : 0.15);
            } else if (endPhase === "list" || endPhase === "cinematic" || endPhase === "fade") {
              dop = 0;
            }

            // Scale down font sizes on mobile
            const scaledSz = isMobile ? Math.max(j.sz * 0.65, 8) : isTablet ? Math.max(j.sz * 0.82, 9) : j.sz;

            const animX = isJitter ? [dx, dx + ((j.id * 7) % 13) - 6, dx - ((j.id * 13) % 11) + 5, dx + ((j.id * 13) % 11) - 5, dx] : dx;
            const animY = isJitter ? [dy, dy + ((j.id * 11) % 9) - 4, dy - ((j.id * 5) % 13) + 6, dy + ((j.id * 5) % 13) - 6, dy] : dy;

            if (isResult) {
              return (
                <div key={j.id} style={{ position: "absolute", left: j.x, top: j.y, transform: "translate(-50%,-50%)" }}>
                  <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                    animate={{ opacity: dop, y: 0, scale: 1 }}
                    transition={{ duration: 0.5, delay: j.id * 0.08 }}
                    style={{
                      background: "rgba(255,255,255,0.92)",
                      border: "1px solid rgba(74,64,112,0.18)",
                      borderLeft: "3px solid rgba(74,64,112,0.45)",
                      borderRadius: 6, padding: isMobile ? "5px 10px" : "8px 14px",
                      fontSize: scaledSz, fontWeight: j.w, color: j.col,
                      boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
                      backdropFilter: "blur(6px)", minWidth: isMobile ? 130 : 200, fontFamily: FB,
                    }}
                  >{j.text}</motion.div>
                </div>
              );
            }

            return (
              <div key={j.id} style={{
                position: "absolute", left: j.x, top: j.y,
                transform: `translate(-50%,-50%) rotate(${j.rot}deg)`,
              }}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.4, filter: "blur(8px)", rotate: rand(-20, 20) }}
                  animate={{
                    opacity: isHl5 && !isN ? Math.min(1, dop + 0.3) : isSeqH && !isN ? Math.min(1, dop + 0.25) : dop,
                    scale: isHl5 && !isN ? 1.22 : isSeqH && !isN ? 1.16 : 1,
                    filter: "blur(0px)",
                    x: animX, y: animY, rotate: 0,
                  }}
                  transition={{
                    opacity: { duration: 0.6 },
                    scale: { duration: isHl5 || isSeqH ? 0.18 : 0.6 },
                    filter: { duration: 0.6 }, rotate: { duration: 0.6 },
                    x: isJitter ? { duration: 0.52 + (j.id % 3) * 0.18, ease: "easeInOut", repeat: Infinity } : { duration: 1.8, ease: [0.22, 1, 0.36, 1] },
                    y: isJitter ? { duration: 0.60 + (j.id % 4) * 0.15, ease: "easeInOut", repeat: Infinity } : { duration: 1.8, ease: [0.22, 1, 0.36, 1] },
                  }}
                >
                  <span style={{
                    display: "block",
                    fontSize: scaledSz, fontWeight: j.w, color: j.col,
                    letterSpacing: "0.04em", whiteSpace: "nowrap", fontFamily: FB,
                    transition: "background 0.28s, border-color 0.28s",
                    ...(isPill ? {
                      background: isHl5 ? "rgba(46,113,117,0.12)" : isSeqH ? "rgba(46,113,117,0.07)" : "rgba(0,0,0,0.03)",
                      border: isHl5 ? "1.5px solid rgba(46,113,117,0.40)" : isSeqH ? "1.5px solid rgba(46,113,117,0.25)" : "1px solid rgba(0,0,0,0.08)",
                      borderRadius: 20, padding: isMobile ? "2px 6px" : "3px 9px", backdropFilter: "blur(4px)",
                    } : {}),
                  }}>{j.text}</span>
                </motion.div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Browser stage ── */}
      {showStage && (
        <motion.div
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.6, 1] }}
          style={{
            position: "absolute", inset: 0, zIndex: 20, display: "flex",
            alignItems: "center", justifyContent: "center", perspective: 1800,
          }}
        >
          <motion.div style={{ transform: stageT, transformOrigin: "50% 50%", willChange: "transform" }}>
            <div style={{
              width: browserW, flexShrink: 0, overflow: "hidden", borderRadius: isMobile ? 10 : 16,
              background: "linear-gradient(145deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.5) 100%)",
              backdropFilter: "blur(40px) saturate(150%)",
              boxShadow: "inset 0 1px 1px rgba(255,255,255,1), 0 24px 64px rgba(0,0,0,0.08), 0 0 0 1px rgba(255,255,255,0.4)",
            }}>
              {/* Chrome bar */}
              <div style={{
                display: "flex", alignItems: "center", gap: 8, padding: isMobile ? "8px 12px" : "10px 16px",
                borderBottom: "1px solid #e8e8ec",
                background: "linear-gradient(to bottom, #f4f4f7, #ededf1)",
              }}>
                <Dot c="#ff5f57" /><Dot c="#ffbd2e" /><Dot c="#28c840" />
                <div style={{ flex: 1, margin: "0 10px" }}><URLBar activeTab={activeTab} isMobile={isMobile} /></div>
                <Dot c="#c5c5cc" /><Dot c="#c5c5cc" /><Dot c="#c5c5cc" />
              </div>
              <TabBar tabs={tabs} subTabs={subTabs} activeTab={activeTab} isMobile={isMobile} />
              {/* Content */}
              <div style={{
                width: "100%", height: isMobile ? 220 : 320, display: "flex",
                alignItems: "center", justifyContent: "center",
                padding: isMobile ? "0 16px" : "0 40px",
                background: "#fcfcfd",
                boxShadow: "inset 0 4px 20px rgba(0,0,0,0.03)",
                position: "relative",
              }}>
                <AnimatePresence mode="wait">
                  {isN && narrSceneIdx !== null ? (
                    <InnerNarration key={`narr-${narrSceneIdx}`} beatIdx={narrSceneIdx} isMobile={isMobile} />
                  ) : (
                    <motion.div key="search" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ width: "100%", maxWidth: isMobile ? "100%" : 500 }}>
                      <div style={{
                        display: "flex", alignItems: "center", gap: 10,
                        padding: isMobile ? "11px 16px" : "15px 22px",
                        borderRadius: 999, background: "#fff",
                        boxShadow: "inset 0 0 0 1.5px #d1d5db, 0 2px 12px rgba(0,0,0,0.05)",
                      }}>
                        <SearchIcon />
                        <div style={{
                          flex: 1, fontSize: isMobile ? 12 : 14, color: "#1a202c",
                          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                          minHeight: "1.4em", lineHeight: 1.4, fontFamily: FB,
                        }}>
                          {query.length === 0 && !submitted
                            ? <span style={{ color: "#9ca3af" }}>Ask anything about immigration…</span>
                            : query}
                          {!submitted && <Blink />}
                        </div>
                        {submitted && <span style={{ fontSize: 11, color: "#9ca3af", letterSpacing: "0.1em" }}>↵</span>}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* ── List cascade ── */}
      {endPhase === "list" && (
        <div style={{
          position: "absolute", inset: 0, zIndex: 50, background: "transparent",
          display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", padding: "0 8vw", gap: 2,
        }}>
          {listWords.map((w, i) => {
            const entryX = [-180, 200, -220, 160, -240, 190, -170, 210][i] ?? (i % 2 === 0 ? -180 : 180);
            const entryY = [-60, -40, 20, -30, 40, -50, 30, -20][i] ?? 0;
            const entryRot = [-22, 18, -28, 14, -20, 25, -16, 22][i] ?? 0;
            const yOff = (i - (listWords.length - 1) / 2) * (isMobile ? 48 : 74);
            const isConverging = convergingIdx >= i;
            const convDelay = [0, 0.04, 0.02, 0.06, 0.01, 0.05, 0.03, 0.07][i] ?? 0;
            return (
              <motion.div key={w}
                initial={{ opacity: 0, x: entryX, y: entryY, scale: 0.6, rotate: entryRot, filter: "blur(12px)" }}
                animate={isConverging ? {
                  opacity: 0, x: 0, y: -yOff, scale: 0.04, rotate: 0, filter: "blur(24px)",
                } : {
                  opacity: 1, x: 0, y: 0, scale: 1, rotate: 0, filter: "blur(0px)",
                }}
                transition={isConverging ? {
                  duration: 0.42, ease: [0.7, 0, 1, 0.3], delay: convDelay,
                  rotate: { duration: 0.38, ease: [0.7, 0, 1, 0.2] },
                } : {
                  duration: 0.45, ease: [0.16, 1, 0.3, 1], delay: i * 0.07,
                  rotate: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
                  filter: { duration: 0.4 },
                }}
                style={{
                  fontSize: isMobile ? "clamp(20px,7vw,40px)" : "clamp(26px,4.5vw,62px)",
                  fontWeight: 900,
                  color: i % 2 === 0 ? TEAL : "#1e293b",
                  letterSpacing: "-0.05em", lineHeight: 1.02,
                  alignSelf: i % 3 === 0 ? "flex-start" : i % 3 === 1 ? "flex-end" : "center",
                  fontFamily: FD,
                  textShadow: isConverging ? "none" : "0 2px 18px rgba(0,0,0,0.08)",
                }}
              >{w}</motion.div>
            );
          })}
        </div>
      )}

      {/* ── Cinematic editorial phase ── */}
      {endPhase === "cinematic" && (
        <>
          <div style={{
            position: "absolute", inset: 0, zIndex: 25, pointerEvents: "none",
            background: "radial-gradient(ellipse at 50% 50%, rgba(255,255,255,0.6) 0%, rgba(226,232,240,0.2) 100%)",
          }} />
          <div style={{ position: "absolute", inset: 0, zIndex: 30, pointerEvents: "none" }}>
            <AnimatePresence mode="wait">
              {cVis.size > 0 && (() => {
                const idx = Math.max(...Array.from(cVis));
                const slide = CIN_SLIDES[idx];
                return slide ? <EditorialSlide key={idx} slide={slide} isMobile={isMobile} /> : null;
              })()}
            </AnimatePresence>
          </div>
        </>
      )}

      {/* ── Hero ── */}
      {endPhase === "hero" && <HeroFrame typeText={typeText} isMobile={isMobile} isTablet={isTablet} />}

      <style>{`@keyframes _blink{50%{opacity:0}}`}</style>
    </section>
  );
}

// ─── Inner Narration ───────────────────────────────────────────────────────────
function InnerNarration({ beatIdx, isMobile }) {
  const beat = NARR_BEATS[beatIdx];
  if (!beat) return null;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, filter: "blur(8px)" }}
      animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      style={{
        position: "absolute", inset: 0, zIndex: 45,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        textAlign: "center", padding: isMobile ? "0 16px" : "0 4vw", pointerEvents: "none",
      }}
    >
      <motion.p
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.06, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        style={{
          fontSize: isMobile ? 9 : "clamp(10px,1vw,12px)",
          fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase",
          color: SLATE, margin: "0 0 1.2em", fontFamily: FB,
        }}
      >{beat.eyebrow}</motion.p>

      <div style={{ position: "relative" }}>
        {beat.lines.map((line, li) => (
          <motion.div
            key={li}
            initial={{ opacity: 0, y: 30, filter: "blur(12px)", scale: 0.95 }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)", scale: 1 }}
            transition={{ delay: 0.14 + li * 0.16, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            style={{
              display: "block",
              fontSize: isMobile ? "clamp(20px,7vw,38px)" : "clamp(24px,4vw,56px)",
              fontWeight: 900, lineHeight: 0.95, letterSpacing: "-0.03em",
              fontFamily: FD, WebkitFontSmoothing: "antialiased", MozOsxFontSmoothing: "grayscale",
              background: line.outline ? "transparent" : "linear-gradient(160deg, #020617 0%, #334155 100%)",
              WebkitBackgroundClip: line.outline ? "none" : "text",
              WebkitTextFillColor: "transparent",
              WebkitTextStroke: line.outline ? "1.5px #020617" : "none",
              marginBottom: li < beat.lines.length - 1 ? "0.1em" : "0",
            }}
          >{line.text}</motion.div>
        ))}
      </div>

      {beat.sub && (
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 0.6 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          style={{
            fontSize: isMobile ? 9 : "clamp(11px,1vw,13px)",
            color: SLATE, fontFamily: FB, fontWeight: 500,
            letterSpacing: "0.1em", textTransform: "uppercase", margin: "1.2em 0 0",
          }}
        >{beat.sub}</motion.p>
      )}
    </motion.div>
  );
}

// ─── Editorial slide ───────────────────────────────────────────────────────────
function EditorialSlide({ slide, isMobile }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 0, filter: "blur(24px)", scale: 0.4 }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)", scale: 1 }}
      exit={{ opacity: 0, y: -20, filter: "blur(8px)", scale: 1.02, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }}
      transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
      style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        textAlign: "center", padding: isMobile ? "0 6vw" : "0 8vw", pointerEvents: "none",
      }}
    >
      {slide.eyebrow && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.08, duration: 0.8 }}
          style={{
            fontSize: isMobile ? 9 : "clamp(10px,0.9vw,13px)", fontWeight: 500,
            letterSpacing: "0.24em", textTransform: "uppercase",
            color: SLATE, margin: "0 0 1.1em", fontFamily: FB,
          }}
        >{slide.eyebrow}</motion.p>
      )}
      {slide.lines.map((line, li) => (
        <motion.div
          key={li}
          initial={{ opacity: 0, y: 60, filter: "blur(18px)", scale: 0.95 }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)", scale: 1 }}
          transition={{ delay: 0.14 + li * 0.16, duration: 1, ease: [0.16, 1, 0.3, 1] }}
          style={{
            display: "block",
            fontSize: isMobile ? "clamp(28px,9vw,56px)" : "clamp(28px,5vw,64px)",
            fontWeight: 900, lineHeight: 0.84, letterSpacing: "-0.056em",
            fontFamily: FD, WebkitFontSmoothing: "antialiased", MozOsxFontSmoothing: "grayscale",
            background: line.outline ? "transparent" : "linear-gradient(160deg, #020617 0%, #334155 100%)",
            WebkitBackgroundClip: line.outline ? "none" : "text",
            WebkitTextFillColor: "transparent",
            WebkitTextStroke: line.outline ? "2px #020617" : "none",
            marginBottom: li < slide.lines.length - 1 ? "0.07em" : "0",
          }}
        >{line.text}</motion.div>
      ))}
      {slide.sub && (
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 0.5 }}
          transition={{ delay: 0.6, duration: 0.85 }}
          style={{
            fontSize: isMobile ? 11 : "clamp(12px,1.1vw,16px)", color: SLATE,
            fontFamily: FB, fontWeight: 400, letterSpacing: "0.08em",
            margin: "1.2em 0 0",
          }}
        >{slide.sub}</motion.p>
      )}
    </motion.div>
  );
}

// ─── URL bar ───────────────────────────────────────────────────────────────────
function URLBar({ activeTab, isMobile }) {
  return (
    <motion.div key="url" initial={{ opacity: 0, y: -3 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div style={{
        margin: "0 auto", height: 22, maxWidth: isMobile ? 200 : 340, borderRadius: 6,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "0 10px", gap: 6,
        border: "1px solid rgba(0,0,0,0.08)", background: "rgba(255,255,255,0.6)",
        overflow: "hidden", whiteSpace: "nowrap",
      }}>
        <Icons.Lock size={10} color="#9ca3af" />
        <span style={{
          fontSize: 10.5, color: "#64748b", letterSpacing: "0.01em",
          overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%", fontFamily: FB,
        }}></span>
      </div>
    </motion.div>
  );
}

// ─── Tab bar ───────────────────────────────────────────────────────────────────
function TabBar({ tabs, subTabs, activeTab, isMobile }) {
  const rowRef = useRef(null);
  const subRef = useRef(null);
  useEffect(() => { if (rowRef.current) rowRef.current.scrollLeft = rowRef.current.scrollWidth; }, [tabs]);
  useEffect(() => { if (subRef.current) subRef.current.scrollLeft = subRef.current.scrollWidth; }, [subTabs]);
  if (tabs.length === 0) return null;
  const ep = Object.keys(subTabs)[0] ?? null;
  return (
    <div style={{ background: "linear-gradient(to bottom,#f4f4f7,#f1f1f4)", borderBottom: "1px solid #e2e2e6" }}>
      <div ref={rowRef} style={{
        display: "flex", alignItems: "flex-end",
        padding: isMobile ? "5px 8px 0" : "7px 12px 0", gap: 1,
        overflowX: "auto", scrollbarWidth: "none", width: "100%",
      }}>
        {tabs.map(t => {
          const ca = (subTabs[t.id] ?? []).some(c => c.id === activeTab);
          const ia = activeTab === t.id || ca;
          return (
            <motion.div key={t.id}
              initial={{ opacity: 0, y: 12, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 440, damping: 24, mass: 0.6 }}
              style={{ flexShrink: 0 }}
            >
              <BTab label={t.label} active={ia} small={isMobile} />
            </motion.div>
          );
        })}
      </div>
      {ep && subTabs[ep] && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          style={{ overflow: "hidden" }}
        >
          <div ref={subRef} style={{
            display: "flex", alignItems: "flex-end", gap: 1,
            padding: isMobile ? "2px 8px 0" : "3px 12px 0",
            borderTop: "1px dashed #d1d5db",
            overflowX: "auto", scrollbarWidth: "none",
          }}>
            {subTabs[ep].map((c, i) => (
              <motion.div key={c.id}
                initial={{ opacity: 0, y: 8, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 380, damping: 22, mass: 0.7, delay: 0.05 * i }}
                style={{ flexShrink: 0 }}
              >
                <BTab label={c.label} active={activeTab === c.id} small />
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}

function BTab({ label, active, small }) {
  return (
    <div style={{
      height: small ? 22 : 30, paddingLeft: small ? 9 : 15, paddingRight: small ? 9 : 15,
      display: "inline-flex", alignItems: "center",
      fontSize: small ? 9.5 : 11.5,
      fontWeight: active ? 600 : 400,
      color: active ? TEALB : "#718096",
      background: active ? "#fff" : "rgba(255,255,255,0.5)",
      clipPath: "polygon(6px 0,calc(100% - 6px) 0,100% 100%,0 100%)",
      boxShadow: active ? "0 1px 0 #fff inset" : "none",
      marginRight: -4, flexShrink: 0, whiteSpace: "nowrap",
      transition: "all 180ms", fontFamily: FB,
    }}>
      <span style={{
        width: small ? 4 : 5, height: small ? 4 : 5,
        borderRadius: "50%", background: active ? TEAL : "#cbd5e0",
        display: "inline-block", marginRight: small ? 4 : 5, flexShrink: 0,
      }} />
      {label}
    </div>
  );
}

// ─── Hero frame ────────────────────────────────────────────────────────────────
function HeroFrame({ typeText, isMobile, isTablet }) {
  const done = typeText === "Let's map it out.";
  const bgJ = [
    { t: "I-130",      x: "5%",  y: "14%", sz: 17, rot: -6 },
    { t: "NVC",        x: "88%", y: "11%", sz: 27, rot:  4 },
    { t: "USCIS",      x: "91%", y: "70%", sz: 21, rot: -5 },
    { t: "DS-260",     x: "4%",  y: "80%", sz: 15, rot:  7 },
    { t: "Green Card", x: "7%",  y: "47%", sz: 13, rot: -4 },
    { t: "I-485",      x: "88%", y: "44%", sz: 14, rot:  6 },
    { t: "Interview",  x: "78%", y: "87%", sz: 12, rot: -3 },
    { t: "I-864",      x: "22%", y: "88%", sz: 13, rot:  5 },
    { t: "PERM",       x: "48%", y: "90%", sz: 19, rot: -8 },
    { t: "EAD",        x: "60%", y: "8%",  sz: 18, rot:  5 },
  ];

  const logoScale = isMobile ? 0.55 : isTablet ? 0.75 : 1;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
      style={{
        position: "absolute", inset: 0, zIndex: 70,
        background: `radial-gradient(ellipse 130% 80% at 50% 40%, #ddeef7 0%, ${HERO_BG} 70%)`,
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        alignItems: "center",
        justifyContent: isMobile ? "center" : "space-between",
        padding: isMobile ? "0 24px" : "0 7vw",
        overflow: "hidden",
        gap: isMobile ? 16 : 24,
      }}
    >
      {bgJ.map(({ t, x, y, sz, rot }, i) => (
        <motion.span key={t}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.038 }}
          transition={{ delay: 0.5 + i * 0.06, duration: 1.5 }}
          style={{
            position: "absolute", left: x, top: y, fontSize: isMobile ? sz * 0.65 : sz,
            fontWeight: 700, color: TEAL, letterSpacing: "0.04em",
            whiteSpace: "nowrap", fontFamily: FB,
            transform: `translate(-50%,-50%) rotate(${rot}deg)`,
            background: "rgba(46,113,117,0.05)", border: "1px solid rgba(46,113,117,0.12)",
            borderRadius: 20, padding: "3px 9px", pointerEvents: "none",
          }}
        >{t}</motion.span>
      ))}

      <motion.div
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: 1 }}
        transition={{ delay: 0.1, duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: "absolute", top: "10%", left: "8%", right: "8%", height: 1,
          background: `linear-gradient(to right, transparent, rgba(46,113,117,0.20), transparent)`,
          transformOrigin: "left",
        }}
      />

      {/* Left column — logo, heading, subtext, CTA */}
      <div style={{
        position: "relative", zIndex: 2,
        display: "flex", flexDirection: "column",
        alignItems: isMobile ? "center" : "flex-start",
        flex: isMobile ? "none" : "1 1 50%",
        maxWidth: isMobile ? "100%" : 560,
      }}>
        {/* Logo — color now matches TEAL (same as CTA button) */}
        <motion.div
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
          style={{
            marginBottom: isMobile ? 16 : 32, color: TEAL,
            transform: `scale(${logoScale})`,
            transformOrigin: isMobile ? "center" : "left center",
            alignSelf: isMobile ? "center" : "flex-start",
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="152 220 710 215"
            style={{ height: 40, width: "auto", fill: "currentColor" }}
          >
            <path d="M194.478302,411.482117C188.648972,398.666321 181.184067,387.211884 174.078979,375.556946C161.946335,355.654999 154.218430,334.429535 152.466766,310.927032C150.965759,290.787415 151.490814,271.069061 158.657028,251.953415C161.906097,243.286591 167.372574,236.333282 175.068100,231.098938C187.972153,222.321823 212.377777,222.515015 222.031631,242.165817C226.003326,250.250381 232.154404,254.994858 241.386230,255.103607C240.874603,257.700470 239.210571,257.303253 238.057617,257.539734C214.604111,262.350281 200.098267,276.975067 192.363480,299.065857C184.921768,320.319672 187.555267,352.132874 198.628662,372.172211C195.346085,360.736084 194.548477,349.072571 194.585556,337.231354C194.686203,305.091156 209.071442,282.030487 237.587112,267.388245C252.463837,259.749298 268.363953,254.738281 283.791870,248.515182C300.024750,241.967392 315.867065,234.607849 330.889893,225.571030C331.848022,224.994675 332.727417,224.133804 334.330139,224.642090C334.086884,229.016586 332.356110,232.995224 331.110291,237.029678C325.877838,253.974487 319.356995,270.258270 307.731262,284.109070C295.584656,298.580475 279.797791,306.307983 261.751282,310.259583C255.743668,311.575104 249.729248,312.898682 243.795959,314.506500C229.390137,318.410126 220.388382,329.212219 218.286926,343.947327C216.575470,355.947906 217.905655,367.798737 218.737152,379.737518C219.623474,392.463135 221.756760,405.206818 219.303925,418.003387C217.963852,424.994537 214.710114,430.344635 207.688766,433.006439C204.303909,434.289673 202.544754,433.679260 201.368622,430.074707C199.358749,423.914886 196.908096,417.898895 194.478302,411.482117z"></path>
            <path d="M347.022308,320.000671C347.016052,314.839264 347.105347,310.174835 346.965759,305.517273C346.865234,302.162506 348.128204,300.629364 351.628418,300.734467C356.786560,300.889313 361.960175,300.922363 367.113922,300.699646C370.973633,300.532806 372.427643,301.928192 372.368347,305.879303C372.186157,318.023376 372.301971,330.171936 372.301971,342.083649C373.283447,342.867767 373.819183,342.426117 374.318726,342.006836C383.782745,334.063324 394.575775,332.615875 406.196838,335.633057C415.899536,338.152130 422.744904,346.587646 423.310516,356.622040C424.267090,373.593201 423.737030,390.584991 423.953217,407.566589C423.995270,410.868988 423.022247,412.495087 419.405853,412.347473C414.084778,412.130249 408.740967,412.096069 403.421997,412.329346C399.633331,412.495514 398.561127,410.970825 398.606415,407.354187C398.766998,394.531891 398.675171,381.706299 398.663269,368.881958C398.653717,358.575378 395.399567,354.366302 387.286011,354.116821C377.843262,353.826508 372.628845,358.719452 372.391693,368.828339C372.122253,380.313904 372.349670,391.810638 372.318054,403.302399C372.289795,413.578827 373.113983,412.175079 363.109467,412.274994C359.445770,412.311584 355.772827,412.113037 352.119568,412.309662C348.129639,412.524414 346.894379,410.660309 346.908722,406.924530C346.998840,383.444702 346.970551,359.964386 346.985443,336.484253C346.988831,331.156372 347.007996,325.828522 347.022308,320.000671z"></path>
            <path d="M320.909363,412.311096C317.090668,412.315186 313.737823,412.059113 310.437317,412.365967C305.318787,412.841858 301.746216,411.882538 302.918549,404.615967C295.871124,410.791656 288.552673,413.763123 280.156006,414.249451C254.958969,415.708740 237.504608,396.636383 239.498611,370.735535C239.781265,367.064178 240.334641,363.492889 241.348862,359.967224C249.310272,332.292297 281.741791,328.266632 299.022125,340.520233C300.048828,341.248291 300.767242,342.583801 302.297913,342.519531C303.777649,335.660950 303.777649,335.661041 311.217407,335.661530C315.046356,335.661774 318.896240,335.913361 322.698822,335.596771C327.228424,335.219635 328.372986,337.188049 328.342041,341.407928C328.185883,362.715698 328.266510,384.025238 328.261688,405.334137C328.260132,412.186127 328.256805,412.186127 320.909363,412.311096M301.669952,365.008423C295.854095,354.320007 283.816345,350.650452 274.124878,356.611633C264.651733,362.438538 261.929047,377.159515 268.562775,386.684814C274.734344,395.546509 288.041443,397.276093 296.853241,389.902008C304.682800,383.349915 304.819550,374.753296 301.669952,365.008423z"></path>
            <path d="M605.060913,373.000000C605.062988,384.657990 604.973816,395.817139 605.115417,406.973328C605.163574,410.764404 603.888367,412.517792 599.916382,412.297821C596.098145,412.086365 592.258423,412.278320 588.428223,412.263885C581.340210,412.237213 581.340271,412.228333 580.396484,405.534912C578.652649,405.182587 577.723206,406.577301 576.587097,407.410583C564.256653,416.454071 551.032898,416.485992 537.883057,410.164795C525.372864,404.151062 519.815430,393.082336 518.661011,379.565979C517.650513,367.735138 519.446167,356.688538 527.285583,347.204102C539.560242,332.353760 562.272705,329.781647 577.620483,341.553528C578.269348,342.051208 578.930420,342.532898 579.531860,342.981750C579.975769,342.721405 580.485229,342.552582 580.478455,342.407898C580.185974,336.163940 583.752686,335.041809 589.019958,335.614197C592.147156,335.954010 595.341675,335.664795 598.505798,335.677979C604.895813,335.704559 605.023010,335.813751 605.037109,342.023712C605.060242,352.182434 605.053894,362.341248 605.060913,373.000000M560.688660,354.010437C551.697937,354.960571 545.673096,359.988037 543.586243,368.281647C541.270569,377.484711 544.135803,386.858582 550.601074,391.231262C557.524597,395.913879 567.137268,395.721375 574.094788,390.760834C580.548767,386.159302 583.183777,376.489594 580.517395,367.191528C578.133301,358.877991 571.864624,354.512573 560.688660,354.010437z"></path>
            <path d="M791.203979,365.000000C791.216858,379.151947 791.068298,392.806946 791.330078,406.454102C791.419312,411.109009 789.796753,412.746704 785.268616,412.344116C781.965149,412.050415 778.614258,412.285797 775.284485,412.293915C768.156677,412.311279 768.156677,412.313538 767.357422,405.215393C764.213135,407.193054 761.370483,409.448242 758.167908,410.920929C733.721130,422.162598 707.000671,405.737396 705.710083,378.830902C705.135010,366.839264 706.926270,355.504913 715.175415,346.176605C727.394165,332.359222 748.536804,330.064270 763.725403,340.652008C764.770203,341.380341 765.547607,342.627289 767.044250,342.615326C768.603943,335.673187 768.603943,335.673187 776.271057,335.669495C791.293762,335.662231 791.290283,335.662231 791.225891,350.515137C791.205688,355.176697 791.210022,359.838379 791.203979,365.000000M768.573364,376.996460C769.015320,373.435791 768.214661,370.040833 767.117615,366.707123C764.123230,357.607910 755.689209,352.825104 745.305481,354.289215C737.101746,355.445923 731.056091,363.018951 730.341125,373.034027C729.616272,383.187927 734.786743,391.471527 743.217041,393.662537C755.729126,396.914307 764.723938,391.261047 768.573364,376.996460z"></path>
            <path d="M697.327026,399.984680C697.339050,412.311646 697.339050,412.311615 685.404663,412.283051C670.974670,412.248474 670.964172,412.248535 670.934204,397.847595C670.912354,387.349304 670.950134,376.850830 670.910339,366.352631C670.877319,357.649750 667.768311,354.120880 660.178406,354.030457C651.960327,353.932495 646.475220,358.640869 646.328003,366.479462C646.090149,379.139923 646.175232,391.806488 646.130127,404.470490C646.102478,412.239929 646.107666,412.248108 638.147339,412.267700C633.814819,412.278351 629.479553,412.159454 625.150574,412.280670C622.015259,412.368408 620.641907,411.190186 620.652283,407.922607C620.723999,385.259857 620.724670,362.596588 620.651917,339.933838C620.641296,336.624023 622.086670,335.543457 625.194092,335.645996C629.355530,335.783325 633.524902,335.671936 637.690918,335.677185C645.251038,335.686707 645.251038,335.689728 646.772644,342.860565C652.933044,338.273254 659.430969,334.844513 667.182312,334.359741C685.805542,333.194977 696.572632,343.763824 697.123047,358.999908C697.610107,372.480835 697.291077,385.990845 697.327026,399.984680z"></path>
            <path d="M462.865234,349.315674C466.810211,360.099579 470.616516,370.517090 474.916962,382.287018C479.384949,370.264709 483.446716,359.611023 487.304840,348.884125C492.050720,335.688873 491.977295,335.663025 505.813934,335.672577C509.450104,335.675079 513.086243,335.672974 516.388855,335.672974C517.832825,337.670685 516.935730,339.029816 516.375854,340.352936C506.968994,362.584229 497.464996,384.774902 488.184998,407.058929C486.539337,411.010712 484.388458,412.776581 479.977966,412.379303C475.350067,411.962463 470.655884,412.190247 465.993652,412.284424C463.688049,412.331024 462.271484,411.462463 461.363007,409.333313C451.367401,385.906311 441.325592,362.499023 431.328247,339.072754C431.024841,338.361816 431.069000,337.502533 430.862396,336.117645C439.559174,335.296478 447.964783,335.637482 456.359894,335.899841C458.206085,335.957550 458.559937,337.773163 459.088776,339.116821C460.368408,342.367920 461.522064,345.668579 462.865234,349.315674z"></path>
          </svg>
        </motion.div>

        <div style={{ textAlign: isMobile ? "center" : "left", maxWidth: isMobile ? "100%" : 560 }}>
          <motion.h1
            animate={{ letterSpacing: done ? "-0.055em" : "-0.03em" }}
            transition={{ duration: 0.95, ease: [0.22, 1, 0.36, 1] }}
            style={{
              fontSize: isMobile ? "clamp(28px,8vw,48px)" : "clamp(32px,5vw,72px)",
              fontWeight: 900, lineHeight: 1.0, margin: 0, color: "#020617",
              fontFamily: FD, WebkitFontSmoothing: "antialiased", MozOsxFontSmoothing: "grayscale",
            }}
          >
            {typeText}
            {!done && (
              <span style={{
                display: "inline-block", width: "0.06em", height: "0.82em",
                background: TEAL, marginLeft: "0.06em", verticalAlign: "middle",
                borderRadius: 2, animation: "_blink 1s step-start infinite",
              }} />
            )}
          </motion.h1>
        </div>

        {done && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              style={{ textAlign: isMobile ? "center" : "left", maxWidth: isMobile ? "100%" : 480, marginTop: isMobile ? 8 : 18 }}
            >
              <p style={{
                fontSize: isMobile ? "clamp(13px,3.5vw,16px)" : "clamp(15px,1.45vw,19px)",
                color: SLATE, lineHeight: 1.88, fontWeight: 300, margin: 0, fontFamily: FB,
              }}>
                See every step, requirement, and milestone in one place.
              </p>
            </motion.div>
            <motion.button
              initial={{ opacity: 0, y: 20, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.6, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              style={{
                marginTop: isMobile ? 20 : 28,
                display: "inline-flex", alignItems: "center", gap: 10,
                padding: isMobile ? "12px 28px" : "15px 36px",
                borderRadius: 999, background: TEAL, color: "#fff",
                fontSize: isMobile ? 13 : 14, fontWeight: 600, letterSpacing: "0.02em",
                cursor: "pointer", border: "none", fontFamily: FB,
                boxShadow: "0 4px 24px rgba(46,113,117,0.35), 0 1px 4px rgba(0,0,0,0.1)",
              }}
            >
              Start your journey
              <motion.span
                animate={{ x: [0, 4, 0] }}
                transition={{ delay: 1.4, duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                style={{ display: "inline-block", fontSize: 16 }}
              >→</motion.span>
            </motion.button>
          </>
        )}
      </div>

      {/* Right column — reference illustration: girl with laptop */}
      {!isMobile && (
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{
            opacity: done ? 1 : 0,
            y: done ? 0 : 24,
            scale: done ? 1 : 0.96,
          }}
          transition={{ delay: 0.55, duration: 1.0, ease: [0.22, 1, 0.36, 1] }}
          style={{
            flex: "0 0 auto",
            display: "flex", justifyContent: "center", alignItems: "center",
            pointerEvents: "none",
          }}
        >
          <img
            src="/assets/images/character.png"
            alt=""
            style={{ width: isTablet ? 230 : 720, height: "auto", display: "block" }}
          />
        </motion.div>
      )}

      {/* Mobile: illustration stacks below the text */}
      {isMobile && done && (
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.55, duration: 1.0, ease: [0.22, 1, 0.36, 1] }}
          style={{ pointerEvents: "none" }}
        >
          <img
            src="/assets/images/character.png"
            alt=""
            style={{ width: 150, height: "auto", display: "block" }}
          />
        </motion.div>
      )}

      {/* Scroll affordance — stays centered at the very bottom of the viewport */}
      {done && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.8, duration: 1.0, ease: [0.22, 1, 0.36, 1] }}
          style={{
            position: "absolute", bottom: 36, left: "50%", transform: "translateX(-50%)",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 4, pointerEvents: "none",
          }}
        >
          <motion.div
            animate={{ opacity: [0.25, 0.65, 0.25], y: [0, 5, 0] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          >
            <svg width="20" height="12" viewBox="0 0 20 12" fill="none">
              <path d="M2 2l8 8 8-8" stroke={TEAL} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </motion.div>
          <motion.div
            animate={{ opacity: [0.1, 0.35, 0.1], y: [0, 5, 0] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
          >
            <svg width="14" height="8" viewBox="0 0 14 8" fill="none">
              <path d="M1 1l6 6 6-6" stroke={TEAL} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
}

// ─── Micro components ──────────────────────────────────────────────────────────
function Dot({ c }) {
  return <span style={{ width: 10, height: 10, borderRadius: "50%", background: c, display: "inline-block", flexShrink: 0 }} />;
}
function SearchIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" style={{ color: "#9ca3af", flexShrink: 0 }}>
      <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
      <path d="m11 11 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
function Blink() {
  return <span style={{
    display: "inline-block", width: 2, height: "1em", background: TEALB,
    marginLeft: 2, verticalAlign: "middle", borderRadius: 1,
    animation: "_blink 1s step-start infinite",
  }} />;
}