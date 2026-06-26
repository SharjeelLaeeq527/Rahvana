import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, animate as mAnimate } from "motion/react";
import * as Icons from "lucide-react";

// ─── Design tokens ─────────────────────────────────────────────────────────────
const BG      = "#dde8ed";  // barely-blue fog — desaturated, editorial
const HERO_BG = "#f5f7f8";  // almost-white warm-slate, matches page
const TEAL    = "#2e7175";  // desaturated steel-teal — not neon, not loud
const TEALB   = "#235658";  // deeper quiet teal
const INDIGO  = "#4a4070";  // muted indigo-slate
const SLATE   = "#6b7c87";  // blue-gray mid-tone
const ORANGE  = "#7a6040";  // aged leather / warm stone
const CRIMSON = "#7a4a55";  // dusty rose, not lipstick
const FD      = "'Fraunces', Georgia, serif";   // display
const FB      = "'DM Sans', system-ui, sans-serif"; // body

// Jargon palette — all desaturated, editorial, zero circus energy
// JA = muted teal, JB = blue-gray slate, JC = pale cloud-gray
// JD = aged amber, JE = dusty mauve, JF = warm stone
const JA="#3d7275", JB="#607080", JC="#8fa0a8", JD="#7a6535", JE="#7a4a55", JF="#7a6050";

const FIVE_IDS = new Set([1, 10, 11, 15, 22]);

// ─── Jargon data ───────────────────────────────────────────────────────────────
type J = { id:number; text:string; x:string; y:string; sz:number; rot:number; col:string; op:number; w:string; result?:boolean };
const JARGON: J[] = [
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

const WAVE_IDS: Record<number,number[]> = {
  1:[0,1,2,3,4,5,6,7,8,9,10,11,12],
  2:[13,14,15,16,17,18,19,20,21,22,23,24],
  3:[25,26,27,28,29,30,31,32,33,34,35,36,37,38,60,61,62,63],
  4:[39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,64,65,66,67,68,69,70],
  5:[100,101,102,103],
};

// ─── Narration beats — full-screen editorial overlay ──────────────────────────
type NarrBeat = {
  eyebrow: string;
  lines: { text: string; outline?: boolean }[];
  sub?: string;
  accent: string;
};

const NARR_BEATS: NarrBeat[] = [
  {
    eyebrow: "You just wanted a simple answer.",
    lines: [{ text: "WHERE TO START?" }],
    sub: "Spouse Visa  ·  IR-1  ·  K-1",
    accent: "#1e293b",
  },
  {
    eyebrow: "But one form leads to ten others.",
    lines: [
      { text: "IT NEVER" },
      { text: "STOPS." },
    ],
    accent: "#1e293b",
  },
  {
    eyebrow: "The information is out there, sure.",
    lines: [{ text: "HOW DOES IT" }, { text: "APPLY TO YOU?" }],
    accent: "#1e293b",
  },
  {
    eyebrow: "You don't need a list of forms.",
    lines: [
      { text: "YOU NEED" },
      { text: "A CLEAR PATH." },
    ],
    sub: "and that's exactly what we built.",
    accent: "#1e293b",
  },
];

// ─── Cinematic slides — post-browser editorial ────────────────────────────────
type CinSlide = {
  eyebrow?: string;
  lines: { text: string; outline?: boolean }[];
  sub?: string;
  accent: string;
};

const CIN_SLIDES: CinSlide[] = [
  {
    eyebrow: "Stop piecing it together yourself.",
    lines: [{ text: "NO MORE" }, { text: "GUESSWORK." }],
    accent: "#1e293b",
  },
  {
    eyebrow: "See exactly where you are,",
    lines: [{ text: "AND WHAT'S NEXT." }],
    accent: "#1e293b",
  },
  {
    eyebrow: "Because immigration isn't a search.",
    lines: [{ text: "IT'S A" }, { text: "PROCESS." }],
    sub: "and every process needs a map.",
    accent: "#1e293b",
  },
];

// ─── Types ─────────────────────────────────────────────────────────────────────
type Tab = { id:string; label:string };
type NarrLevel = 1|2|3|4;
type BContent = {kind:"search"} | {kind:"narration";sceneIdx:number};
type EPhase = null | "list" | "cinematic" | "fade" | "hero";

const sleep = (ms:number) => new Promise<void>(r=>setTimeout(r,ms));
const rand  = (a:number,b:number) => a+Math.random()*(b-a);

// ─── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [query,     setQuery]     = useState("");
  const [submitted, setSubmit]    = useState(false);
  const [tabs,      setTabs]      = useState<Tab[]>([]);
  const [subTabs,   setSubTabs]   = useState<Record<string,Tab[]>>({});
  const [activeTab, setActive]    = useState<string|null>(null);
  const [visibleJ,  setVisibleJ]  = useState<Set<number>>(new Set());
  const [content,   setContent]   = useState<BContent>({kind:"search"});
  const [endPhase,  setEndPhase]  = useState<EPhase>(null);
  const [listWords, setListWords] = useState<string[]>([]);
  const [fade,      setFade]      = useState(0);
  const [typeText,  setTypeText]  = useState("");
  const [narrPhase, setNarrPhase] = useState<NarrLevel|null>(null);
  const [seqHl,     setSeqHl]     = useState<number|null>(null);
  const [cVis,      setCVis]      = useState<Set<number>>(new Set());

  useEffect(() => {
    if (typeof document !== "undefined") {
      if (endPhase !== "hero") {
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "unset";
      }
    }
    return () => {
      if (typeof document !== "undefined") document.body.style.overflow = "unset";
    };
  }, [endPhase]);

  const camZoom = useMotionValue(0.80);
  const camX    = useMotionValue(0);
  const camY    = useMotionValue(0);
  const camRot  = useMotionValue(-2);
  const shakeX  = useMotionValue(0);
  const shakeY  = useMotionValue(0);

  const stageT = useTransform(
    [camZoom,camX,camY,camRot,shakeX,shakeY],
    v => { const[z,x,y,r,sx,sy]=v as number[];
      return `translate3d(${x+sx}px,${y+sy}px,0) scale(${z}) rotate(${r}deg)`; }
  );

  useEffect(()=>{
    if(narrPhase!==3){setSeqHl(null);return;}
    const ids=Array.from(visibleJ).filter(id=>JARGON[id]?.text!=="?");
    if(!ids.length)return;
    let i=0;
    const iv=setInterval(()=>{setSeqHl(ids[i%ids.length]);i++;},180);
    return()=>clearInterval(iv);
  },[narrPhase,visibleJ]);

  useEffect(()=>{
    let active=true;
    const cam=(to:{zoom?:number;x?:number;y?:number;rotate?:number},dur=1.1)=>{
      const ease=[0.22,1,0.36,1] as const;
      if(to.zoom  !==undefined) mAnimate(camZoom,to.zoom,  {duration:dur,ease});
      if(to.x     !==undefined) mAnimate(camX,   to.x,     {duration:dur,ease});
      if(to.y     !==undefined) mAnimate(camY,   to.y,     {duration:dur,ease});
      if(to.rotate!==undefined) mAnimate(camRot, to.rotate,{duration:dur,ease});
    };
    const shake=async()=>{
      for(let i=0;i<16;i++){if(!active)return;shakeX.set(rand(-12,12));shakeY.set(rand(-8,8));await sleep(32);}
      shakeX.set(0);shakeY.set(0);
    };
    const narrate=async(sceneIdx:number,holdMs:number,level:NarrLevel)=>{
      setNarrPhase(level);
      setContent({kind:"narration",sceneIdx});
      await sleep(holdMs);
      if(!active)return;
      setContent({kind:"search"});
      setNarrPhase(null);
      await sleep(300);
    };
    const wave=(w:number)=>setVisibleJ(p=>{const n=new Set(p);(WAVE_IDS[w]||[]).forEach(id=>n.add(id));return n;});
    const show=(i:number)=>setCVis(p=>new Set([...p,i]));
    const clearC=()=>setCVis(new Set());

    (async()=>{
      cam({zoom:0.58,x:30,y:40,rotate:-8},0.01);
      await sleep(300);
      cam({zoom:0.75,x:-15,y:10,rotate:3},2.2);
      await sleep(600);

      setSubmit(false);
      const q1="how do I bring my spouse to the US";
      for(let i=0;i<q1.length;i++){
        if(!active)return;
        setQuery(q1.slice(0,i+1));
        await sleep(q1[i]===" "?rand(80,180):rand(35,90));
        if(Math.random()<0.15&&q1[i]===" "){await sleep(rand(200,500));}
      }
      await sleep(400);setSubmit(true);
      cam({zoom:1.05,x:10,y:-30,rotate:-1.5},0.9);
      setTabs(p=>[...p,{id:"spouse",label:"Spouse Visa"}]);
      setActive("spouse");
      wave(1);
      await sleep(800);
      await narrate(0,2400,1);

      let len=0;setQuery(q=>{len=q.length;return q;});await sleep(0);
      for(let i=0;i<len;i++){if(!active)return;setQuery(q=>q.slice(0,-1));await sleep(12);}
      setSubmit(false);await sleep(500);
      const typo="what is NCV";
      for(const ch of typo){if(!active)return;setQuery(q=>q+ch);await sleep(rand(40,75));}
      await sleep(600);
      for(let i=0;i<3;i++){if(!active)return;setQuery(q=>q.slice(0,-1));await sleep(90);}
      await sleep(200);
      for(const ch of "NVC"){if(!active)return;setQuery(q=>q+ch);await sleep(60);}
      await sleep(350);setSubmit(true);
      setTabs(p=>[...p,{id:"nvc",label:"NVC"}]);setActive("nvc");
      await sleep(700);

      setSubTabs({nvc:[
        {id:"ds260",    label:"DS-260"},
        {id:"civdocs",  label:"Civil Documents"},
        {id:"interview",label:"Interview"},
        {id:"fees",     label:"Fees"},
        {id:"medical",  label:"Medical Exam"},
        {id:"police",   label:"Police Certificate"},
        {id:"affidavit",label:"Affidavit of Support"},
      ]});
      setActive("ds260");
      cam({zoom:1.25,x:120,y:-50,rotate:-4.5},1.0);
      wave(2);
      await sleep(800);
      await narrate(1,2600,2);

      wave(3);
      cam({zoom:0.88,x:-40,y:15,rotate:2.8},1.4);
      await sleep(500);
      await narrate(2,2400,3);

      wave(4);
      await shake();
      cam({zoom:0.72,x:20,y:35,rotate:-5.2},1.3);
      await sleep(700);
      await narrate(3,3000,4);

      setEndPhase("list");
      const words=["Forms.","Documents.","Deadlines.","Interviews.","Requirements.","Fees.","Translations.","Proofs."];
      for(let i=0;i<words.length;i++){
        if(!active)return;setListWords(words.slice(0,i+1));await sleep(280);
      }
      await sleep(2000);
      setListWords([]);
      await sleep(500);

      setEndPhase("cinematic");
      show(0);await sleep(2400);
      show(1);await sleep(2400);
      clearC();await sleep(400);
      show(2);await sleep(2600);
      clearC();await sleep(200);

      setEndPhase("fade");
      for(let i=1;i<=20;i++){if(!active)return;setFade(i/20);await sleep(30);}
      await sleep(200);
      setEndPhase("hero");

      const full="Let's map it out.";
      for(let i=0;i<=full.length;i++){if(!active)return;setTypeText(full.slice(0,i));await sleep(rand(38,82));}
    })();

    return()=>{active=false;};
  },[camZoom,camX,camY,camRot,shakeX,shakeY]);

  const showStage  = endPhase===null;
  const isN        = content.kind==="narration";
  const narrSceneIdx = isN ? (content as {kind:"narration";sceneIdx:number}).sceneIdx : null;

  return (
    <section style={{position:"relative",zIndex:50,height:"100vh",width:"100%",overflow:"hidden",fontFamily:FB,background:"linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 40%, #94a3b8 100%)"}}>

      {/* Fade overlay → dark hero bg */}
      {fade>0&&(
        <div style={{position:"absolute",inset:0,background:HERO_BG,opacity:fade,zIndex:60,pointerEvents:"none"}}/>
      )}

      {/* ── Jargon scatter ── */}
      {endPhase!=="hero"&&(
        <div style={{position:"absolute",inset:0,zIndex:10,pointerEvents:"none"}}>
          {JARGON.map(j=>{
            if(!visibleJ.has(j.id))return null;
            const isPill   = j.text!=="?";
            const isResult = j.result;

            const isHl5   = narrPhase===2 && FIVE_IDS.has(j.id);
            const isSeqH  = narrPhase===3 && seqHl===j.id;
            const isJitter = narrPhase===4 && isPill;

            let dx=0, dy=0, dop=j.op;

            if(isN){
              // During narration: nearly invisible; keep the five highlighted terms softly present
              dop = j.op * (isHl5 ? 0.7 : 0.15);
            } else if(endPhase==="cinematic"){
              if(cVis.has(0)||cVis.has(1)){dx=j.x<"50%"?-40:40; dy=j.y<"50%"?-28:28;}
              if(cVis.has(4)||cVis.has(5)){dx=j.x<"50%"?20:-20; dy=j.y<"50%"?14:-14;}
              dop = j.op*0.22;
            }
            if(endPhase==="fade") dop=0;

            const animX = isJitter?[dx,dx+((j.id*7)%13)-6,dx-((j.id*13)%11)+5,dx+((j.id*13)%11)-5,dx]:dx;
            const animY = isJitter?[dy,dy+((j.id*11)%9)-4,dy-((j.id*5)%13)+6,dy+((j.id*5)%13)-6,dy]:dy;

            if(isResult){
              return (
                <div key={j.id} style={{position:"absolute",left:j.x,top:j.y,transform:"translate(-50%,-50%)"}}>
                  <motion.div
                    initial={{opacity:0,y:20,scale:0.9}}
                    animate={{opacity:dop,y:0,scale:1}}
                    transition={{duration:0.5,delay:j.id*0.08}}
                    style={{
                      background:"rgba(255,255,255,0.92)",
                      border:"1px solid rgba(74,64,112,0.18)",
                      borderLeft:"3px solid rgba(74,64,112,0.45)",
                      borderRadius:6,padding:"8px 14px",
                      fontSize:j.sz,fontWeight:j.w,color:j.col,
                      boxShadow:"0 2px 12px rgba(0,0,0,0.08)",
                      backdropFilter:"blur(6px)",minWidth:200,fontFamily:FB,
                    }}
                  >{j.text}</motion.div>
                </div>
              );
            }

            return (
              <div key={j.id} style={{
                position:"absolute",left:j.x,top:j.y,
                transform:`translate(-50%,-50%) rotate(${j.rot}deg)`,
              }}>
                <motion.div
                  initial={{opacity:0,scale:0.4,filter:"blur(8px)",rotate:rand(-20,20)}}
                  animate={{
                    opacity: isHl5&&!isN ? Math.min(1,dop+0.3) : isSeqH&&!isN ? Math.min(1,dop+0.25) : dop,
                    scale: isHl5&&!isN?1.22:isSeqH&&!isN?1.16:1,
                    filter:"blur(0px)",
                    x:animX, y:animY, rotate:0,
                  }}
                  transition={{
                    opacity:{duration:0.6},
                    scale:{duration:isHl5||isSeqH?0.18:0.6},
                    filter:{duration:0.6},rotate:{duration:0.6},
                    x:isJitter?{duration:0.52+(j.id%3)*0.18,ease:"easeInOut",repeat:Infinity}:{duration:1.8,ease:[0.22,1,0.36,1]},
                    y:isJitter?{duration:0.60+(j.id%4)*0.15,ease:"easeInOut",repeat:Infinity}:{duration:1.8,ease:[0.22,1,0.36,1]},
                  }}
                >
                  <span style={{
                    display:"block",
                    fontSize:j.sz,fontWeight:j.w,color:j.col,
                    letterSpacing:"0.04em",whiteSpace:"nowrap",fontFamily:FB,
                    transition:"background 0.28s,border-color 0.28s",
                    ...(isPill?{
                      background:isHl5?"rgba(46,113,117,0.12)":isSeqH?"rgba(46,113,117,0.07)":"rgba(0,0,0,0.03)",
                      border:isHl5?"1.5px solid rgba(46,113,117,0.40)":isSeqH?"1.5px solid rgba(46,113,117,0.25)":"1px solid rgba(0,0,0,0.08)",
                      borderRadius:20,padding:"3px 9px",backdropFilter:"blur(4px)",
                    }:{}),
                  }}>{j.text}</span>
                </motion.div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Browser stage — hosts narration inside ── */}
      {showStage&&(
        <motion.div
          animate={{opacity: 1}}
          transition={{duration:0.5,ease:[0.4,0,0.6,1]}}
          style={{position:"absolute",inset:0,zIndex:20,display:"flex",
            alignItems:"center",justifyContent:"center",perspective:1800}}
        >
          <motion.div style={{transform:stageT,transformOrigin:"50% 50%",willChange:"transform"}}>
            <div style={{
              width:720,flexShrink:0,overflow:"hidden",borderRadius:14,
              background:"rgba(255,255,255,0.75)", backdropFilter:"blur(24px)",
              boxShadow:"0 0 0 1px rgba(255,255,255,0.6),0 12px 32px rgba(0,0,0,0.08),0 48px 100px rgba(0,0,0,0.06)",
            }}>
              {/* Chrome bar */}
              <div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 16px",
                borderBottom:"1px solid #e8e8ec",background:"linear-gradient(to bottom,#f4f4f7,#ededf1)"}}>
                <Dot c="#ff5f57"/><Dot c="#ffbd2e"/><Dot c="#28c840"/>
                <div style={{flex:1,margin:"0 14px"}}><URLBar activeTab={activeTab}/></div>
                <Dot c="#c5c5cc"/><Dot c="#c5c5cc"/><Dot c="#c5c5cc"/>
              </div>
              <TabBar tabs={tabs} subTabs={subTabs} activeTab={activeTab}/>
              {/* Content — Search bar OR Narration */}
              <div style={{
                width:720,height:320,display:"flex",alignItems:"center",justifyContent:"center",
                padding:"0 40px",
                background:"radial-gradient(ellipse at 50% 30%, rgba(250,250,254,0.6) 0%, rgba(248,248,251,0.6) 100%)",
                position:"relative",
              }}>
                <AnimatePresence mode="wait">
                  {isN && narrSceneIdx !== null ? (
                    <InnerNarration key={`narr-${narrSceneIdx}`} beatIdx={narrSceneIdx}/>
                  ) : (
                    <motion.div key="search" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} style={{width:"100%",maxWidth:500}}>
                      <div style={{display:"flex",alignItems:"center",gap:12,padding:"15px 22px",
                        borderRadius:999,background:"#fff",
                        boxShadow:"inset 0 0 0 1.5px #d1d5db,0 2px 12px rgba(0,0,0,0.05)"}}>
                        <SearchIcon/>
                        <div style={{flex:1,fontSize:14,color:"#1a202c",whiteSpace:"nowrap",
                          overflow:"hidden",textOverflow:"ellipsis",minHeight:"1.4em",lineHeight:1.4,fontFamily:FB}}>
                          {query.length===0&&!submitted
                            ?<span style={{color:"#9ca3af"}}>Ask anything about immigration…</span>
                            :query}
                          {!submitted&&<Blink/>}
                        </div>
                        {submitted&&<span style={{fontSize:11,color:"#9ca3af",letterSpacing:"0.1em"}}>↵</span>}
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
      <AnimatePresence>
        {endPhase==="list"&&(
          <motion.div key="list"
            initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0,transition:{duration:0.3}}}
            transition={{duration:0.15}}
            style={{position:"absolute",inset:0,zIndex:50,background:BG,
              display:"flex",flexDirection:"column",alignItems:"center",
              justifyContent:"center",padding:"0 8vw",gap:4}}>
            {listWords.map((w,i)=>{
              const align=i%3===0?"flex-start":i%3===1?"flex-end":"center";
              const xOff=i%3===0?-120:i%3===1?120:0;
              return (
                <motion.div key={w}
                  initial={{opacity:0,x:xOff,scale:0.82}}
                  animate={{opacity:1,x:0,scale:1}}
                  transition={{duration:0.58,ease:[0.22,1,0.36,1],delay:i*0.05}}
                  style={{fontSize:"clamp(24px,4vw,56px)",fontWeight:900,
                    color:i%2===0?TEAL:"#1e293b",
                    letterSpacing:"-0.045em",lineHeight:1.06,alignSelf:align,fontFamily:FD}}
                >{w}</motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Cinematic editorial phase ── */}
      {endPhase==="cinematic"&&(
        <>
          <div style={{
            position:"absolute",inset:0,zIndex:25,pointerEvents:"none",
            background:"radial-gradient(ellipse 55% 55% at 50% 50%, transparent 0%, rgba(204,230,244,0.72) 100%)",
          }}/>
          <div style={{position:"absolute",inset:0,zIndex:30,pointerEvents:"none"}}>
            <AnimatePresence mode="wait">
              {cVis.size>0&&(()=>{
                const idx=Math.max(...Array.from(cVis));
                const slide=CIN_SLIDES[idx];
                return slide?<EditorialSlide key={idx} slide={slide}/>:null;
              })()}
            </AnimatePresence>
          </div>
        </>
      )}

      {/* ── Hero ── */}
      {endPhase==="hero"&&<HeroFrame typeText={typeText}/>}

      <style>{`@keyframes _blink{50%{opacity:0}}`}</style>
    </section>
  );
}

// ─── Inner Narration — rendered inside the browser frame ───────────────────────
function InnerNarration({beatIdx}:{beatIdx:number}){
  const beat=NARR_BEATS[beatIdx];
  if(!beat)return null;
  return (
    <motion.div
      initial={{opacity:0, scale: 0.95, filter:"blur(8px)"}}
      animate={{opacity:1, scale: 1, filter:"blur(0px)"}}
      exit={{opacity:0}}
      transition={{duration:0.8,ease:[0.16,1,0.3,1]}}
      style={{
        position:"absolute",inset:0,zIndex:45,
        display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
        textAlign:"center",padding:"0 4vw",pointerEvents:"none",
      }}
    >
      <motion.p
        initial={{opacity:0,y:15}}
        animate={{opacity:1,y:0}}
        transition={{delay:0.06,duration:0.8,ease:[0.16,1,0.3,1]}}
        style={{
          position:"relative",
          fontSize:"clamp(10px,1vw,12px)",
          fontWeight:600,
          letterSpacing:"0.15em",
          textTransform:"uppercase",
          color:SLATE,
          margin:"0 0 1.2em",
          fontFamily:FB,
        }}
      >{beat.eyebrow}</motion.p>

      <div style={{position:"relative"}}>
        {beat.lines.map((line,li)=>(
          <motion.div
            key={li}
            initial={{opacity:0,y:30,filter:"blur(12px)",scale:0.95}}
            animate={{opacity:1,y:0,filter:"blur(0px)",scale:1}}
            transition={{delay:0.14+li*0.16,duration:0.9,ease:[0.16,1,0.3,1]}}
            style={{
              display:"block",
              fontSize:"clamp(24px,4vw,56px)",
              fontWeight:900,
              lineHeight:0.95,
              letterSpacing:"-0.03em",
              fontFamily:FD,
              background: line.outline ? "transparent" : "linear-gradient(135deg, #0f172a 0%, #475569 100%)",
              WebkitBackgroundClip: line.outline ? "none" : "text",
              WebkitTextFillColor: "transparent",
              WebkitTextStroke: line.outline ? `1.5px #1e293b` : "none",
              marginBottom:li<beat.lines.length-1?"0.1em":"0",
            }}
          >{line.text}</motion.div>
        ))}
      </div>

      {beat.sub&&(
        <motion.p
          initial={{opacity:0,y:10}}
          animate={{opacity:0.6}}
          transition={{delay:0.5,duration:0.8}}
          style={{
            position:"relative",
            fontSize:"clamp(11px,1vw,13px)",
            color:SLATE,
            fontFamily:FB,
            fontWeight:500,
            letterSpacing:"0.1em",
            textTransform:"uppercase",
            margin:"1.2em 0 0",
          }}
        >{beat.sub}</motion.p>
      )}
    </motion.div>
  );
}

// ─── Editorial slide (cinematic phase) ────────────────────────────────────────
function EditorialSlide({slide}:{slide:CinSlide}){
  return (
    <motion.div
      initial={{opacity:0,y:40,filter:"blur(12px)",scale:0.95}}
      animate={{opacity:1,y:0,filter:"blur(0px)",scale:1}}
      exit={{opacity:0,y:-20,filter:"blur(8px)",scale:1.02,transition:{duration:0.6,ease:[0.16,1,0.3,1]}}}
      transition={{duration:1,ease:[0.16,1,0.3,1]}}
      style={{
        position:"absolute",inset:0,
        display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
        textAlign:"center",padding:"0 8vw",pointerEvents:"none"
      }}
    >
      {slide.eyebrow&&(
        <motion.p
          initial={{opacity:0}}
          animate={{opacity:1}}
          transition={{delay:0.08,duration:0.8}}
          style={{
            fontSize:"clamp(10px,0.9vw,13px)",fontWeight:500,
            letterSpacing:"0.24em",textTransform:"uppercase",
            color:SLATE,margin:"0 0 1.1em",fontFamily:FB,
          }}
        >{slide.eyebrow}</motion.p>
      )}
      {slide.lines.map((line,li)=>(
        <motion.div
          key={li}
          initial={{opacity:0,y:60,filter:"blur(18px)",scale:0.95}}
          animate={{opacity:1,y:0,filter:"blur(0px)",scale:1}}
          transition={{delay:0.14+li*0.16,duration:1,ease:[0.16,1,0.3,1]}}
          style={{
            display:"block",
            fontSize:"clamp(28px,5vw,64px)",
            fontWeight:900,
            lineHeight:0.84,
            letterSpacing:"-0.056em",
            fontFamily:FD,
            background: line.outline ? "transparent" : "linear-gradient(135deg, #0f172a 0%, #475569 100%)",
            WebkitBackgroundClip: line.outline ? "none" : "text",
            WebkitTextFillColor: "transparent",
            WebkitTextStroke: line.outline ? `2px #1e293b` : "none",
            marginBottom:li<slide.lines.length-1?"0.07em":"0",
          }}
        >{line.text}</motion.div>
      ))}
      {slide.sub&&(
        <motion.p
          initial={{opacity:0,y:10}}
          animate={{opacity:0.5}}
          transition={{delay:0.6,duration:0.85}}
          style={{
            fontSize:"clamp(12px,1.1vw,16px)",color:SLATE,
            fontFamily:FB,fontWeight:400,letterSpacing:"0.08em",
            margin:"1.2em 0 0"
          }}
        >{slide.sub}</motion.p>
      )}
    </motion.div>
  );
}

// ─── URL bar ───────────────────────────────────────────────────────────────────
function URLBar({activeTab}:{activeTab:string|null}){
  return (
    <motion.div key="url" initial={{opacity:0,y:-3}} animate={{opacity:1,y:0}} transition={{duration:0.3}}>
      <div style={{margin:"0 auto",height:22,maxWidth:340,borderRadius:6,
        display:"flex",alignItems:"center",justifyContent:"center",padding:"0 12px", gap:6,
        border:"1px solid rgba(0,0,0,0.08)",background:"rgba(255,255,255,0.6)",overflow:"hidden",whiteSpace:"nowrap"}}>
        <Icons.Lock size={10} color="#9ca3af" />
        <span style={{fontSize:10.5,color:"#64748b",letterSpacing:"0.01em",
          overflow:"hidden",textOverflow:"ellipsis",maxWidth:"100%",fontFamily:FB}}></span>
      </div>
    </motion.div>
  );
}

// ─── Tab bar ───────────────────────────────────────────────────────────────────
function TabBar({tabs,subTabs,activeTab}:{tabs:Tab[];subTabs:Record<string,Tab[]>;activeTab:string|null}){
  const rowRef=useRef<HTMLDivElement>(null);
  const subRef=useRef<HTMLDivElement>(null);
  useEffect(()=>{if(rowRef.current)rowRef.current.scrollLeft=rowRef.current.scrollWidth;},[tabs]);
  useEffect(()=>{if(subRef.current)subRef.current.scrollLeft=subRef.current.scrollWidth;},[subTabs]);
  if(tabs.length===0)return null;
  const ep=Object.keys(subTabs)[0]??null;
  return (
    <div style={{background:"linear-gradient(to bottom,#f4f4f7,#f1f1f4)",borderBottom:"1px solid #e2e2e6"}}>
      <div ref={rowRef} style={{display:"flex",alignItems:"flex-end",padding:"7px 12px 0",gap:1,
        overflowX:"auto",scrollbarWidth:"none",width:"100%"}}>
        {tabs.map(t=>{
          const ca=(subTabs[t.id]??[]).some(c=>c.id===activeTab);
          const ia=activeTab===t.id||ca;
          return (
            <motion.div key={t.id} initial={{opacity:0,y:12,scale:0.9}} animate={{opacity:1,y:0,scale:1}}
              transition={{type:"spring",stiffness:440,damping:24,mass:0.6}} style={{flexShrink:0}}>
              <BTab label={t.label} active={ia}/>
            </motion.div>
          );
        })}
      </div>
      {ep&&subTabs[ep]&&(
        <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:"auto"}}
          transition={{duration:0.4,ease:[0.22,1,0.36,1]}} style={{overflow:"hidden"}}>
          <div ref={subRef} style={{display:"flex",alignItems:"flex-end",gap:1,padding:"3px 12px 0",
            borderTop:"1px dashed #d1d5db",overflowX:"auto",scrollbarWidth:"none"}}>
            {subTabs[ep].map((c,i)=>(
              <motion.div key={c.id} initial={{opacity:0,y:8,scale:0.9}} animate={{opacity:1,y:0,scale:1}}
                transition={{type:"spring",stiffness:380,damping:22,mass:0.7,delay:0.05*i}} style={{flexShrink:0}}>
                <BTab label={c.label} active={activeTab===c.id} small/>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}

function BTab({label,active,small}:{label:string;active:boolean;small?:boolean}){
  return (
    <div style={{height:small?24:30,paddingLeft:small?11:15,paddingRight:small?11:15,
      display:"inline-flex",alignItems:"center",fontSize:small?10.5:11.5,
      fontWeight:active?600:400,color:active?TEALB:"#718096",
      background:active?"#fff":"rgba(255,255,255,0.5)",
      clipPath:"polygon(6px 0,calc(100% - 6px) 0,100% 100%,0 100%)",
      boxShadow:active?"0 1px 0 #fff inset":"none",
      marginRight:-4,flexShrink:0,whiteSpace:"nowrap",transition:"all 180ms",fontFamily:FB}}>
      <span style={{width:5,height:5,borderRadius:"50%",background:active?TEAL:"#cbd5e0",
        display:"inline-block",marginRight:5,flexShrink:0}}/>
      {label}
    </div>
  );
}

// ─── Hero frame ────────────────────────────────────────────────────────────────
function HeroFrame({typeText}:{typeText:string}){
  const done=typeText==="Immigration is a journey, not a search.";
  const bgJ=[
    {t:"I-130",     x:"5%",  y:"14%",sz:17,rot:-6},
    {t:"NVC",       x:"88%", y:"11%",sz:27,rot:4},
    {t:"USCIS",     x:"91%", y:"70%",sz:21,rot:-5},
    {t:"DS-260",    x:"4%",  y:"80%",sz:15,rot:7},
    {t:"Green Card",x:"7%",  y:"47%",sz:13,rot:-4},
    {t:"I-485",     x:"88%", y:"44%",sz:14,rot:6},
    {t:"Interview", x:"78%", y:"87%",sz:12,rot:-3},
    {t:"I-864",     x:"22%", y:"88%",sz:13,rot:5},
    {t:"PERM",      x:"48%", y:"90%",sz:19,rot:-8},
    {t:"EAD",       x:"60%", y:"8%", sz:18,rot:5},
  ];
  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{duration:0.9,ease:[0.22,1,0.36,1]}}
      style={{position:"absolute",inset:0,zIndex:70,
        background:`radial-gradient(ellipse 130% 80% at 50% 40%, #ddeef7 0%, ${HERO_BG} 70%)`,  
        display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
        padding:"0 8vw",overflow:"hidden"}}>

      {bgJ.map(({t,x,y,sz,rot},i)=>(
        <motion.span key={t}
          initial={{opacity:0}} animate={{opacity:0.038}}
          transition={{delay:0.5+i*0.06,duration:1.5}}
          style={{position:"absolute",left:x,top:y,fontSize:sz,fontWeight:700,color:TEAL,
            letterSpacing:"0.04em",whiteSpace:"nowrap",fontFamily:FB,
            transform:`translate(-50%,-50%) rotate(${rot}deg)`,
            background:"rgba(46,113,117,0.05)",border:"1px solid rgba(46,113,117,0.12)",
            borderRadius:20,padding:"3px 9px",pointerEvents:"none"}}
        >{t}</motion.span>
      ))}

      <motion.div
        initial={{scaleX:0,opacity:0}} animate={{scaleX:1,opacity:1}}
        transition={{delay:0.1,duration:1.4,ease:[0.22,1,0.36,1]}}
        style={{position:"absolute",top:"10%",left:"8%",right:"8%",height:1,
          background:`linear-gradient(to right, transparent, rgba(46,113,117,0.20), transparent)`,
          transformOrigin:"left"}}
      />

      <motion.div initial={{opacity:0,y:-14}} animate={{opacity:1,y:0}}
        transition={{delay:0.2,duration:0.85,ease:[0.22,1,0.36,1]}}
        style={{fontSize:11,fontWeight:500,letterSpacing:"0.3em",textTransform:"uppercase",
          color:TEAL,marginBottom:52,fontFamily:FB}}>
        Rahvana
      </motion.div>

      <div style={{textAlign:"center",maxWidth:980}}>
        <motion.h1
          animate={{letterSpacing:done?"-0.055em":"-0.03em"}}
          transition={{duration:0.95,ease:[0.22,1,0.36,1]}}
          style={{fontSize:"clamp(32px,5vw,72px)",fontWeight:900,
            lineHeight:1.0,margin:0,color:"#0f172a",fontFamily:FD}}
        >
          {typeText}
          {!done&&<span style={{display:"inline-block",width:"0.06em",height:"0.82em",
            background:TEAL,marginLeft:"0.06em",verticalAlign:"middle",borderRadius:2,
            animation:"_blink 1s step-start infinite"}}/>}
        </motion.h1>
      </div>

      {done&&(
        <>
          <motion.div
            initial={{scaleX:0,opacity:0}} animate={{scaleX:1,opacity:1}}
            transition={{delay:0.2,duration:1.1,ease:[0.22,1,0.36,1]}}
            style={{width:48,height:1,background:TEAL,margin:"44px 0 40px",transformOrigin:"center"}}
          />
          <motion.div
            initial={{opacity:0,y:24}} animate={{opacity:1,y:0}}
            transition={{delay:0.5,duration:0.9,ease:[0.22,1,0.36,1]}}
            style={{textAlign:"center",maxWidth:500}}
          >
            <p style={{fontSize:"clamp(15px,1.45vw,19px)",color:SLATE,lineHeight:1.88,
              fontWeight:300,margin:"0 0 8px",fontFamily:FB}}>
              Stop piecing together your immigration journey one search at a time.
            </p>
            <p style={{fontSize:"clamp(15px,1.45vw,19px)",color:SLATE,lineHeight:1.88,
              fontWeight:300,margin:0,fontFamily:FB}}>
              Rahvana helps you see every step, requirement, and milestone in one place.
            </p>
          </motion.div>
          <motion.button
            initial={{opacity:0,y:20,scale:0.94}} animate={{opacity:1,y:0,scale:1}}
            transition={{delay:0.8,duration:0.85,ease:[0.22,1,0.36,1]}}
            style={{marginTop:42,display:"inline-flex",alignItems:"center",gap:10,
              padding:"15px 36px",borderRadius:999,background:TEAL,color:"#fff",
              fontSize:14,fontWeight:600,letterSpacing:"0.02em",cursor:"pointer",
              border:"none",fontFamily:FB}}
          >
            Start your journey
            <motion.span
              animate={{x:[0,4,0]}}
              transition={{delay:1.5,duration:1.2,repeat:Infinity,ease:"easeInOut"}}
              style={{display:"inline-block",fontSize:16}}
            >→</motion.span>
          </motion.button>
          <motion.div
            initial={{scaleX:0,opacity:0}} animate={{scaleX:1,opacity:1}}
            transition={{delay:1.1,duration:1.4,ease:[0.22,1,0.36,1]}}
            style={{position:"absolute",bottom:"10%",left:"8%",right:"8%",height:1,
              background:`linear-gradient(to right, transparent, rgba(46,113,117,0.14), transparent)`,
              transformOrigin:"right"}}
          />
        </>
      )}
    </motion.div>
  );
}

// ─── Micro components ──────────────────────────────────────────────────────────
function Dot({c}:{c:string}){
  return <span style={{width:10,height:10,borderRadius:"50%",background:c,display:"inline-block",flexShrink:0}}/>;
}
function SearchIcon(){
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" style={{color:"#9ca3af",flexShrink:0}}>
      <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="m11 11 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}
function Blink(){
  return <span style={{display:"inline-block",width:2,height:"1em",background:TEALB,marginLeft:2,
    verticalAlign:"middle",borderRadius:1,animation:"_blink 1s step-start infinite"}}/>;
}
