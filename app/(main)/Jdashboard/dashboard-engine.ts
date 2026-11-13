/* eslint-disable */
// @ts-nocheck
import type { DashboardOptions } from './types';

/**
 * Rahvana dashboard engine (v71 data-linked).
 *
 * Scoped to `root`, delegates events, cleans up on unmount, and connects
 * live journey data (chapters, steps, alerts, case strength, tracking, dates)
 * or gracefully falls back to interactive defaults.
 */
export function mountDashboard(root: HTMLElement, options: DashboardOptions = {}): () => void {
let dead = false, raf = 0;
const RV: Record<string, (...a: any[]) => void> = {};
const unsub: Array<() => void> = [];
const timers = new Set<number>();
const setTimeout = (f: () => void, ms?: number) => { const id = window.setTimeout(() => { timers.delete(id); f(); }, ms); timers.add(id); return id; };
const clearTimeout = (id?: number) => { if (id != null) { window.clearTimeout(id); timers.delete(id); } };
const onDoc = (t: string, f: any) => { document.addEventListener(t, f); unsub.push(() => document.removeEventListener(t, f)); };
const onWin = (t: string, f: any) => { window.addEventListener(t, f); unsub.push(() => window.removeEventListener(t, f)); };

const $=i=>root.querySelector("#"+i),B=$("bd");
const esc=s=>s==null?"":String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const I=(p,c)=>`<svg viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
const P={wallet:'<path d="M4 7a2 2 0 012-2h11v3M4 7v10a2 2 0 002 2h13a1 1 0 001-1V9a1 1 0 00-1-1H6a2 2 0 01-2-2zM16 13.5h.01"/>',tool:'<path d="M14.7 6.3a4 4 0 00-5.4 5.1L4 16.7V20h3.3l5.3-5.3a4 4 0 005.1-5.4l-2.6 2.6-2.4-.6-.6-2.4z"/>',doc:'<path d="M7 3h8l4 4v14H7zM15 3v4h4M10 12h6M10 16h6"/>',ppl:'<path d="M9 11a3 3 0 100-6 3 3 0 000 6zM3 20c0-3 3-5 6-5s6 2 6 5M17 11a2.5 2.5 0 100-5M21 19c0-2-1.5-3.5-4-4"/>',chat:'<path d="M4 5h16v11H9l-5 4z"/>',heart:'<path d="M12 20s-7-4.5-7-10a4 4 0 017-2.5A4 4 0 0119 10c0 5.5-7 10-7 10z"/>',vault:'<path d="M7 3h8l4 4v14H7zM15 3v4h4"/>'};

[["tool","#0d7377"],["doc","#3b62a0"],["ppl","#6b4f93"]].forEach((c,i)=>{
  const el = root.querySelectorAll(".fd .r1")[i];
  if (el) el.innerHTML=I(P[c[0]],c[1])+`<span class="bd">${[4,6,3][i]}</span>`;
});

// Setup folder actions
const tbTools = $("tb-tools");
if (tbTools) tbTools.onclick = () => { if (options.onOpenTools) options.onOpenTools(); else window.location.href = "/tools"; };
const tbGuides = $("tb-guides");
if (tbGuides) tbGuides.onclick = () => { if (options.onOpenGuides) options.onOpenGuides(); else window.location.href = "/guides/my-guides"; };
const tbServices = $("tb-services");
if (tbServices) tbServices.onclick = () => { if (options.onOpenServices) options.onOpenServices(); else window.location.href = "/services"; };

// Setup Quick Actions
$("qa").innerHTML=[
  ["My requests","chat","#b4405a","var(--rose)","openRequests()"],
  ["Favourites","heart","#d89a45","#fbf0de","openFavorites()"],
  ["Doc Vault","vault","#0a5a5d","var(--mint)","openVault()"],
  ["Portal wallet","wallet","#3b62a0","var(--blue)","openWallet()"]
].map(q=>`<a class="qi" data-oc="${q[4]}"><i style="background:${q[3]}">${I(P[q[1]],q[2])}</i>${q[0]}</a>`).join("");

const GRP='<circle cx="12" cy="8.5" r="3"/><circle cx="5.5" cy="10" r="2.2"/><circle cx="18.5" cy="10" r="2.2"/><path d="M6.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5M1.5 18c0-2 1.5-3.5 4-3.5M22.5 18c0-2-1.5-3.5-4-3.5"/>',COMMUNITY_URL="https://chat.whatsapp.com/";
$("qa").insertAdjacentHTML("beforeend",`<button type="button" class="qi cm" data-oc="openCm()" aria-haspopup="dialog"><i>${I(GRP,"#fff")}</i>Community</button>`);
root.insertAdjacentHTML("beforeend",`<div class="pop" id="pop" role="dialog" aria-modal="true" aria-labelledby="pt" data-oc="closeCm()" data-self><div class="cpc"><button type="button" class="px" data-oc="closeCm()" aria-label="Close">✕</button><div class="cph"><div class="chb">${I(GRP,"#0d7377")}</div><svg class="w" viewBox="0 0 330 40" preserveAspectRatio="none"><path d="M0 22c40-22 80 14 125 2s80-20 130-4c30 10 55 6 75-4v24H0z" fill="#fff"/></svg></div><div class="cpb"><h3 id="pt">Join the community</h3><p>Talk with others going through this too.</p><a class="pj" href="${COMMUNITY_URL}" target="_blank" rel="noopener" data-oc="closeCm()">Join the group</a></div></div></div>`);

function openCm(){const pop=$("pop"),btn=root.querySelector(".qi.cm i");if(!btn||!pop)return;const r=btn.getBoundingClientRect();
pop.style.setProperty("--dx",(r.left+r.width/2-innerWidth/2)+"px");pop.style.setProperty("--dy",(r.top+r.height/2-innerHeight/2)+"px");
pop.classList.remove("out");pop.classList.add("on");setTimeout(()=>{const j=root.querySelector("#pop .pj");j&&j.focus({preventScroll:true})},620)}
function closeCm(){const pop=$("pop");if(!pop||!pop.classList.contains("on"))return;pop.classList.add("out");setTimeout(()=>{pop.classList.remove("on","out")},220)}
onDoc("keydown",e=>{if(e.key=="Escape")closeCm()});

/* roadmap: glass road in perspective */
const F='font-family="Inter,-apple-system,Segoe UI,Roboto,Arial,sans-serif"';
const tip=(cx,y)=>`<rect x="${cx-46}" y="${y-30}" width="92" height="26" rx="13" fill="#14263a"/><path d="M${cx-6} ${y-4}h12l-6 7z" fill="#14263a"/><text x="${cx}" y="${y-13}" text-anchor="middle" font-size="11.5" font-weight="600" fill="#fff" ${F}>you are here</text>`;
function roadGlass(){const P0=[30,238],P1=[250,262],P2=[420,190],P3=[452,52],cur=.5;
const bz=t=>{const u=1-t;return[u*u*u*P0[0]+3*u*u*t*P1[0]+3*u*t*t*P2[0]+t*t*t*P3[0],u*u*u*P0[1]+3*u*u*t*P1[1]+3*u*t*t*P2[1]+t*t*t*P3[1]]};
const dz=t=>{const u=1-t;return[3*u*u*(P1[0]-P0[0])+6*u*t*(P2[0]-P1[0])+3*t*t*(P3[0]-P2[0]),3*u*u*(P1[1]-P0[1])+6*u*t*(P2[1]-P1[1])+3*t*t*(P3[1]-P2[1])]};
const W=t=>36-26*t;
const poly=(a,b)=>{const L=[],R=[];for(let k=0;k<=48;k++){const t=a+(b-a)*k/48,[x,y]=bz(t),[dx,dy]=dz(t),n=Math.hypot(dx,dy),w=W(t)/2;L.push([x-dy/n*w,y+dx/n*w]);R.push([x+dy/n*w,y-dx/n*w])}return"M"+L.map(p=>p.map(v=>v.toFixed(1)).join(" ")).join("L")+"L"+R.reverse().map(p=>p.map(v=>v.toFixed(1)).join(" ")).join("L")+"Z"};
const line=(a,b)=>{let d="";for(let k=0;k<=40;k++){const t=a+(b-a)*k/40,[x,y]=bz(t);d+=(k?"L":"M")+x.toFixed(1)+" "+y.toFixed(1)}return d};
let h=`<defs><linearGradient id="tb2" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#8fe0d6"/><stop offset=".55" stop-color="#0d9488"/><stop offset="1" stop-color="#0a5a5d"/></linearGradient><linearGradient id="gl" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#e3eef2"/></linearGradient><filter id="bl"><feGaussianBlur stdDeviation="6"/></filter></defs>`;
h+=`<path d="${poly(0,1)}" fill="#0a5a5d" fill-opacity=".25" filter="url(#bl)" transform="translate(0 12)"/>`;
h+=`<path d="${poly(cur,1)}" fill="url(#gl)" stroke="#0d737733" stroke-width="1.5" stroke-linejoin="round"/><path d="${line(cur,1)}" fill="none" stroke="#0d737788" stroke-width="2" stroke-dasharray="1 8" stroke-linecap="round"/>`;
h+=`<path d="${poly(0,cur)}" fill="url(#tb2)" stroke-linejoin="round"/><path d="${line(0.02,cur)}" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="3" stroke-linecap="round" stroke-dasharray="2 9"/>`;
for(let i=0;i<=10;i++){const t=i/10,[x,y]=bz(t),sc=W(t)/36;
if(i<5)h+=`<circle cx="${x}" cy="${y}" r="${(5+4*sc).toFixed(1)}" fill="#fff"/><circle cx="${x}" cy="${y}" r="${(2+2*sc).toFixed(1)}" fill="#0d7377"/>`;
else if(i==5)h+=`<circle cx="${x}" cy="${y}" r="16" fill="#0d94882e"><animate attributeName="r" values="16;30;16" dur="2.4s" repeatCount="indefinite"/><animate attributeName="opacity" values="1;0;1" dur="2.4s" repeatCount="indefinite"/></circle><circle cx="${x}" cy="${y}" r="12" fill="#fff" stroke="#0a5a5d" stroke-width="3.5"/><circle cx="${x}" cy="${y}" r="4.5" fill="#0a5a5d"/>${tip(x,y-14)}`;
else if(i<10)h+=`<circle cx="${x}" cy="${y}" r="${(3.5+3*sc).toFixed(1)}" fill="#fff" stroke="#0d737788" stroke-width="2"/>`;
else h+=`<circle cx="${x}" cy="${y}" r="7" fill="#fff" stroke="#0d7377" stroke-width="2.5"/><path d="M${x} ${y-8}V${y-38}" stroke="#0a5a5d" stroke-width="3" stroke-linecap="round"/><path d="M${x} ${y-38}l-24 8 24 8z" fill="#0d9488"/><rect x="${x-168}" y="${y-50}" width="122" height="26" rx="13" fill="#fff" stroke="#14263a1a"/><text x="${x-107}" y="${y-33}" text-anchor="middle" font-size="11.5" font-weight="600" fill="#14263a" ${F}>Visa issuance</text>`}
$("rt").innerHTML=h}

/* roadmap: terrain plateaus or glass ribbon */
let RDS="line",CHS="liquid";
function road(){B.dataset.th=RDS=="none"||RDS=="line"?1:0;B.dataset.jl=RDS=="line"?1:0;if(RDS=="none"||RDS=="line"){$("rt").innerHTML="";return}$("rt").setAttribute("viewBox",RDS=="wave"?"0 0 500 432":"0 -150 500 432");RDS=="wave"?roadWave():RDS=="terrain"?roadTerrain():roadGlass()}
function roadWave(){const sv=$("rt"),Fh='Inter,-apple-system,"Segoe UI",Roboto,Arial,sans-serif',N=260;
const P=[];for(let i=0;i<=N;i++){const f=i/N;P.push({x:26+436*f,y:412-190*Math.pow(f,.7)+(26-8*f)*Math.sin(2*Math.PI*2.5*f),f})}
const A=[0];for(let i=1;i<=N;i++)A[i]=A[i-1]+Math.hypot(P[i].x-P[i-1].x,P[i].y-P[i-1].y);const LT=A[N];
for(let i=0;i<=N;i++){const a=P[Math.max(0,i-1)],b=P[Math.min(N,i+1)],dx=b.x-a.x,dy=b.y-a.y,n=Math.hypot(dx,dy);P[i].nx=-dy/n;P[i].ny=dx/n;P[i].w=11-4*P[i].f}
const idx=t=>{const g=t*LT;let i=0;while(i<N&&A[i+1]<g)i++;return i},at=t=>P[idx(t)];
const ST=11,CU=6,fs=i=>.27+(i-1)*(.73/(ST-1)),tc=fs(CU),ic=idx(tc);
const side=(a,b,k,o=0)=>{let d="";for(let i=a;i<=b;i++)d+=(d?"L":"M")+(P[i].x+P[i].nx*(P[i].w-o)*k).toFixed(1)+" "+(P[i].y+P[i].ny*(P[i].w-o)*k).toFixed(1);return d};
const poly=(a,b)=>side(a,b,1)+"L"+side(a,b,-1).replace("M","").split("L").reverse().join("L")+"Z";
const mid=(a,b)=>side(a,b,0);
let h=`<defs><filter id="rbl"><feGaussianBlur stdDeviation="7"/></filter><linearGradient id="rdg" gradientUnits="userSpaceOnUse" x1="24" y1="0" x2="${at(tc).x}" y2="0"><stop offset="0" stop-color="#58d4c6"/><stop offset="1" stop-color="#0a5a5d"/></linearGradient></defs>`;
h+=`<path d="${poly(0,N)}" fill="#d6e7e9"/><path d="${poly(0,ic)}" fill="url(#rdg)" stroke-linejoin="round"/>`;
h+=`<path d="${mid(0,N)}" fill="none" stroke="#fff" stroke-width="1.6" stroke-dasharray="2 8" stroke-opacity=".9" stroke-linecap="round" opacity=".95"/>`;
const lab=(x,y,t)=>`<text x="${x}" y="${y}" text-anchor="middle" font-size="12.5" font-weight="500" fill="#6b7e90" font-family="${Fh}">${t}</text>`;
[[0.012,"USCIS"],[.135,"NVC"]].forEach(([t,tx])=>{const q=at(t);h+=`<circle cx="${q.x}" cy="${q.y}" r="14" fill="#0a5a5d" stroke="#fff" stroke-width="3"/><path d="M${q.x-4.2} ${q.y+.4}l3 3 5.4-6.2" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`+lab(q.x+(t>.05?-26:0),q.y-(t>.05?20:27),tx)});
for(let i=1;i<=ST;i++){if(i==CU)continue;const q=at(fs(i)),dn=i<CU;
if(i==ST)h+=`<path d="M${q.x} ${q.y-6}V${q.y-40}" stroke="#14263a" stroke-width="2.5" stroke-linecap="round"/><path d="M${q.x} ${q.y-40}l24 8-24 8z" fill="#0d9488"/>`;
h+=`<circle cx="${q.x}" cy="${q.y}" r="5" fill="#fff" stroke="${dn?"#0a5a5d":"#0a5a5d77"}" stroke-width="2"/>`}
const c=at(tc);h+=`<circle cx="${c.x}" cy="${c.y}" r="11" fill="#fff" stroke="#0a5a5d" stroke-width="3.5"/><circle cx="${c.x}" cy="${c.y}" r="4" fill="#0a5a5d"/><rect x="${c.x-46}" y="${c.y-52}" width="92" height="26" rx="13" fill="#14263a"/><path d="M${c.x-6} ${c.y-26}h12l-6 7z" fill="#14263a"/><text x="${c.x}" y="${c.y-35}" text-anchor="middle" font-size="11.5" font-weight="600" fill="#fff" font-family="${Fh}">you are here</text>`;
sv.innerHTML=h}
function roadTerrain(){const NS="http://www.w3.org/2000/svg",sv=$("rt"),Fh='Inter,-apple-system,"Segoe UI",Roboto,Arial,sans-serif';sv.innerHTML="";
const D="M26 228C94 232 112 168 172 164S258 192 318 166S388 110 436 66",P=document.createElementNS(NS,"path");P.setAttribute("d",D);sv.appendChild(P);
const L=P.getTotalLength(),at=f=>P.getPointAtLength(L*f),ST=11,CU=6,fs=i=>.27+(i-1)*(.73/(ST-1)),cu=at(fs(CU));
const ln=(a,b)=>{let d="";for(let k=0;k<=80;k++){const q=at(a+(b-a)*k/80);d+=(k?"L":"M")+q.x.toFixed(1)+" "+q.y.toFixed(1)}return d};
const disc=(cx,cy,rx,ry,c1,c2,ix,iy)=>`<g filter="url(#tsh)"><ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${c1}"/></g><ellipse cx="${cx+ix}" cy="${cy+iy}" rx="${rx*.58}" ry="${ry*.56}" fill="${c2}"/><ellipse cx="${cx+ix}" cy="${cy+iy}" rx="${rx*.58}" ry="${ry*.56}" fill="none" stroke="#fff" stroke-opacity=".55"/>`;
const ck=(x,y)=>`<path d="M${x-4.2} ${y+.4}l3 3 5.4-6.2" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`;
const lab=(x,y,t)=>`<text x="${x}" y="${y}" text-anchor="middle" font-size="11.5" fill="#6b7e90" font-family="${Fh}">${t}</text>`;
let h=`<defs><filter id="tsh" x="-20%" y="-30%" width="140%" height="190%"><feDropShadow dx="0" dy="8" stdDeviation="7" flood-color="#0a5a5d" flood-opacity=".2"/></filter></defs>`;
h+=disc(98,224,100,40,"#e3f0ef","#cfe6e3",6,-3)+disc(250,180,90,38,"#e6f2f1","#d1e8e5",0,-2)+disc(392,104,92,40,"#e3f0ef","#cfe6e3",4,-3)+disc(440,66,50,22,"#e8f4f3","#d6ebe8",0,-1);
h+=`<path d="${ln(0,1)}" fill="none" stroke="#0a5a5d" stroke-opacity=".3" stroke-width="2.6" stroke-dasharray="2 6.5" stroke-linecap="round"/><path d="${ln(0,fs(CU))}" fill="none" stroke="#0a5a5d" stroke-width="4.2" stroke-linecap="round"/>`;
[[0,"USCIS"],[.135,"NVC"]].forEach(([f,t])=>{const q=at(f);h+=`<circle cx="${q.x}" cy="${q.y}" r="13" fill="#0a5a5d" stroke="#fff" stroke-width="3"/>`+ck(q.x,q.y)+lab(q.x+(f?6:2),q.y+30,t)});
for(let i=1;i<=ST;i++){if(i==CU)continue;const q=at(fs(i)),dn=i<CU;
if(i==ST)h+=`<path d="M${q.x} ${q.y-6}V${q.y-40}" stroke="#14263a" stroke-width="2.5" stroke-linecap="round"/><path d="M${q.x} ${q.y-40}l24 8-24 8z" fill="#0d9488"/>`;
h+=`<circle cx="${q.x}" cy="${q.y}" r="5.8" fill="${dn?"#0a5a5d":"#fff"}" stroke="${dn?"#fff":"#0a5a5d77"}" stroke-width="${dn?2.2:1.8}"/>`}
h+=`<circle cx="${cu.x}" cy="${cu.y}" r="14" fill="#0d94882e"><animate attributeName="r" values="14;26;14" dur="2.4s" repeatCount="indefinite"/><animate attributeName="opacity" values="1;0;1" dur="2.4s" repeatCount="indefinite"/></circle><circle cx="${cu.x}" cy="${cu.y}" r="13" fill="#fff" stroke="#0a5a5d" stroke-width="3.8"/><text x="${cu.x}" y="${cu.y+4.3}" text-anchor="middle" font-size="12" font-weight="600" fill="#0a5a5d" font-family="${Fh}">${CU}</text>`;
h+=`<path d="M${cu.x-52} ${cu.y-26}L${cu.x-10} ${cu.y-10}" stroke="#0a5a5d" stroke-opacity=".5" stroke-dasharray="2 4" stroke-linecap="round"/><rect x="${cu.x-160}" y="${cu.y-48}" width="108" height="28" rx="14" fill="#0a5a5d"/><text x="${cu.x-106}" y="${cu.y-30}" text-anchor="middle" font-size="12" font-weight="600" fill="#fff" font-family="${Fh}">You are here</text><circle cx="${cu.x-58}" cy="${cu.y-34}" r="5.5" fill="#2fc7b8" stroke="#fff" stroke-width="2"/>`;
const e=at(1);h+=`<rect x="${e.x-168}" y="${e.y-50}" width="122" height="26" rx="13" fill="#fff" stroke="#14263a1a"/><text x="${e.x-107}" y="${e.y-33}" text-anchor="middle" font-size="11.5" font-weight="600" fill="#14263a" ${Fh}>Visa issuance</text>`;
sv.removeChild(P);sv.insertAdjacentHTML("beforeend",h)}

/* chapter cards */
const DEFAULT_CHD=[
  {n:1,t:"USCIS petition",d:11,tot:11,st:"Done",col:"#0d9488",a:"#b4dbd5",m:"#74b9b0",b:"#4d9490",la:"#4aa596",lm:"#38917f",lb:"#2a7769"},
  {n:2,t:"NVC processing",d:12,tot:12,st:"Done",col:"#3b62a0",a:"#c4d4ec",m:"#92abd3",b:"#6684b2",la:"#7096d4",lm:"#5a80c0",lb:"#4268a8"},
  {n:3,t:"Embassy interview",d:5,tot:11,st:"In progress",col:"#6b4f93",a:"#d6cce8",m:"#ab99c9",b:"#8b77a6",la:"#a58fd6",lm:"#8c76c2",lb:"#715ba8",cur:1}
];
const CHD = (options.chapters && options.chapters.length) ? options.chapters : DEFAULT_CHD;
const act=c=>c.cur?"Continue →":"Review →";
const wv=(ph,amp,h)=>{let d=`M0 ${h}`;for(let x=0;x<=400;x+=4)d+=`L${x} ${(h*.5+amp*Math.sin(x/200*Math.PI*4+ph)).toFixed(1)}`;return d+`V${h}Z`};
const CHV={liquid:()=>{const inner=c=>`<small>Chapter 0${c.n}</small><h4>${esc(c.t)}</h4><div class="bt"><span><strong>${c.d}</strong><em>/${c.tot}</em></span><a data-oc="goToChapter(${c.n-1})" style="cursor:pointer">${act(c)}</a></div>`;
return`<div class="cv-g">${CHD.map(c=>{const full=!c.cur;return`<div class="cv-w" data-oc="goToChapter(${c.n-1})" style="cursor:pointer" title="Open Chapter ${c.n}"><div class="lq ${c.cur?"cur":""}" style="--p:${full?100:(c.tot?c.d/c.tot*100:0)}%;--c:${c.col}"><div class="lq-cc">${inner(c)}</div><div class="lq-v ${full?"full":""}" style="--a:${c.la};--m:${c.lm};--b:${c.lb}"><svg class="lq-wv lq-w2" viewBox="0 0 400 14" preserveAspectRatio="none"><path d="${wv(1.6,4.2,14)}"/></svg><svg class="lq-wv" viewBox="0 0 400 10" preserveAspectRatio="none"><path d="${wv(0,3.4,10)}"/></svg><div class="lq-cc">${inner(c)}</div></div></div></div>`}).join("")}</div>`}};

function chap(){$("th").innerHTML=CHV[CHS]();bl()}
function bl(){const n=BL.filter(b=>!fx[b.id]).length;root.querySelectorAll(".blk").forEach(e=>e.textContent=n?n+(n>1?" blockers":" blocker")+" ↑":"all clear")}

/* Case Strength sub-scores & card */
const csScore = options.caseStrength?.score ?? 66;
const csBand = options.caseStrength?.band ?? "Good";
const csSub = options.caseStrength?.subScores;

const sbItems = [
  ["Evidence coverage", csSub?.evidenceCoverage?.val ?? "12", csSub?.evidenceCoverage?.denom ?? " of 15", csSub?.evidenceCoverage?.pct ?? 0.8, "#0d9488"],
  ["Consistency", csSub?.consistency?.val ?? "9", csSub?.consistency?.denom ?? " of 12", csSub?.consistency?.pct ?? 0.75, "#3b62a0"],
  ["Completeness", csSub?.completeness?.val ?? "17", csSub?.completeness?.denom ?? " of 25", csSub?.completeness?.pct ?? 0.68, "#6b4f93"],
  ["Risk deductions", csSub?.riskDeductions?.val ?? "−0", csSub?.riskDeductions?.denom ?? " pts", csSub?.riskDeductions?.pct ?? 0, "#b4405a"]
];
$("sb").innerHTML=sbItems.map(s=>`<div class="mc"><small>${s[0]}</small><b style="${s[1][0]=="−"?"color:var(--roseD)":""}">${s[1]}<span>${s[2]}</span></b><div class="vt">${Array.from({length:12},(_,i)=>`<i><u style="height:${i<Math.round(s[3]*12)?100:0}%;background:${s[4]}"></u></i>`).join("")}</div></div>`).join("");

// Update Case Strength card
const csScoreEl = $("cs-score");
if (csScoreEl) csScoreEl.textContent = String(csScore);
const csBadgeEl = $("cs-badge");
if (csBadgeEl) csBadgeEl.textContent = csBand;

const csBars = $("cs-bars");
if (csBars) {
  const w1 = Math.min(100, (csScore / 40) * 100);
  const w2 = csScore > 40 ? Math.min(100, ((csScore - 40) / 30) * 100) : 0;
  const w3 = csScore > 70 ? Math.min(100, ((csScore - 70) / 15) * 100) : 0;
  const w4 = csScore > 85 ? Math.min(100, ((csScore - 85) / 15) * 100) : 0;
  csBars.innerHTML = `<div><i style="width:${w1}%;background:#e9a3b2"></i></div><div><i style="width:${w2}%;background:#f2c9a0"></i></div><div><i style="width:${w3}%;background:var(--t2)"></i></div><div><i style="width:${w4}%;background:#0d7377"></i></div>`;
}
const csZones = $("cs-zones");
if (csZones) {
  const zIdx = csBand === "Critical" ? 0 : csBand === "Needs attention" ? 1 : csBand === "Excellent" ? 3 : 2;
  csZones.innerHTML = ["Critical", "Needs attention", "Good", "Excellent"].map((z, idx) => `<span class="${idx === zIdx ? "on" : ""}">${z}</span>`).join("");
}
const sgCard = $("sg-card");
if (sgCard && options.onOpenCaseStrength) {
  sgCard.style.cursor = "pointer";
  sgCard.onclick = () => options.onOpenCaseStrength!();
}

/* alerts */
const DEFAULT_BL=[
  {id:"p",tag:"MISSING",t:"Police certificate",a:"Add",s:"Step 6",n:6,m:"about 15 min",d:"No police certificate is on file. The embassy needs it before your interview.",f:"Request one locally, then upload it to Doc Vault.",chapterIdx:2,stepIdx:5,blk:true},
  {id:"m",tag:"DIFFERS",t:"Marriage date",a:"Resolve",s:"Step 5",n:5,m:"about 10 min",d:"Two of your documents list different marriage dates.",f:"Check which date is correct, then fix the other document.",chapterIdx:2,stepIdx:4,blk:true}
];
const DEFAULT_WA=[
  {id:"w0",t:"Photos older than 30 days",s:"Step 4",n:4,m:"about 20 min",d:"Your photos were taken more than 30 days ago.",f:"Retake them if your look has changed, then upload them to Doc Vault.",chapterIdx:2,stepIdx:3,blk:false},
  {id:"w1",t:"Translation not certified",s:"Step 5",n:5,m:"about 10 min",d:"The translation has no signed translator certificate.",f:"Ask the translator for a signed certificate and upload it.",chapterIdx:2,stepIdx:4,blk:false},
  {id:"w2",t:"Relationship evidence is thin",s:"Step 5",n:5,m:"about 15 min",d:"There isn't much recent proof of your relationship.",f:"Add recent photos together and chat records.",chapterIdx:2,stepIdx:4,blk:false}
];

let BL: any[] = [];
let WA: any[] = [];
if (options.alerts !== undefined) {
  BL = (options.alerts || []).filter(a => a.blk);
  WA = (options.alerts || []).filter(a => !a.blk);
} else {
  BL = DEFAULT_BL;
  WA = DEFAULT_WA;
}

let fx: Record<string, number> = {};
let alOpen: string | null = (BL[0]?.id || WA[0]?.id || null);

function alerts(){
  const op = BL.filter(b => !fx[b.id]);
  const wo = WA.filter(w => !fx[w.id]);
  const allOpen = [...op, ...wo];
  const tot = allOpen.length;
  const n = op.length;

  const bnEl = $("bn");
  if (bnEl) bnEl.textContent = tot > 0 ? String(tot) : "✓";

  const btEl = $("bt");
  if (btEl) {
    if (tot === 0) btEl.textContent = "All clear";
    else if (tot === 1) btEl.textContent = "1 thing needs you";
    else btEl.textContent = `${tot} things need you`;
  }

  const btSub = $("bt-sub");
  if (btSub) {
    btSub.textContent = tot === 0
      ? "Nothing stopping you now"
      : n > 0
        ? "Clear these before your next step"
        : "Review these recommendations";
  }

  const bchEl = $("bch");
  if (bchEl) {
    if (tot === 0) {
      bchEl.innerHTML = `<span class="chip" style="background:#e6f4ea;color:#137333;border:1px solid #ceead6;cursor:default">✓ All clear</span>`;
    } else {
      const displayChips = allOpen.slice(0, 2);
      const remaining = tot - displayChips.length;
      const chipsHtml = displayChips.map(b => {
        const isBlk = !!b.blk;
        const tag = b.tag || (isBlk ? "MISSING" : "CHECK");
        const cleanTitle = (b.t || "").replace(/^(missing|check|differs)\s+/i, "");
        return `<button class="chip ${isBlk ? "d" : ""}" data-oc="openAlerts()" title="${esc(b.t)}"><small>${esc(tag)}</small>${esc(cleanTitle)} →</button>`;
      }).join("");
      const moreHtml = remaining > 0
        ? `<button class="chip k" data-oc="openAlerts()">+${remaining} more →</button>`
        : "";
      bchEl.innerHTML = chipsHtml + moreHtml;
    }
  }

  const tileEl = $("tile");
  if (tileEl) {
    tileEl.innerHTML = `<div class="tp"><div><h3>${n ? n + " blocking" : tot ? tot + " to check" : "All clear"}</h3><p>${tot ? "Clear these before continuing" : "Nothing stopping you now"}</p></div><span class="a" data-oc="openAlerts()" style="cursor:pointer">↗</span></div><div class="tg">${op.map(b => `<button data-oc="fix('${b.id}')">${esc(b.t)}</button>`).join("")}${tot ? `<em>${BL.length - n} of ${BL.length || 1} resolved</em>` : "<em>All clear</em>"}</div>`;
  }

  const bkcEl = $("bkc");
  if (bkcEl) {
    bkcEl.innerHTML = `<div class="eb">${n ? "Blocking" : "All clear"}</div><div>${n ? op.map(b => `<button data-oc="fix('${b.id}')" title="Click to mark fixed">${esc(b.t)}</button>`).join("") : "<i>Nothing blocking you now</i>"}</div>`;
  }

  bl();
  if (root.classList.contains("o") && $("drc")?.dataset.k == "al") openAlerts();
}

function fix(id: string){ fx[id] = 1; if (alOpen == id) alOpen = null; alerts(); }
function alTog(id: string){ alOpen = alOpen == id ? null : id; openAlerts(1); }
const WARN='<svg viewBox="0 0 24 24" fill="none" stroke="#c98a2e" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"><path d="M12 4.2 21 19.5H3z"/><path d="M12 10v4.2M12 16.9v.1"/></svg>',CHVR='<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 4l6 6-6 6"/></svg>';

function alRow(x: any, blk: boolean){
  const o = alOpen == x.id;
  const cIdx = x.chapterIdx != null ? x.chapterIdx : 0;
  const sIdx = x.stepIdx != null ? x.stepIdx : (x.n - 1);
  return `<div class="na-r${o ? " o" : ""}"><button type="button" class="na-h" data-oc="alTog('${x.id}')" aria-expanded="${o}"><span class="na-i ${blk ? "b" : "w"}">${blk ? "!" : WARN}</span><span class="na-t"><b>${esc(x.t)}</b><small>${esc(x.s)} · ${esc(x.m || "about 15 min")}</small></span><span class="na-c">${CHVR}</span></button>${o ? `<div class="na-x"><p>${esc(x.d || x.t)}</p><div class="na-f"><i>How to fix</i><span>${esc(x.f || "Review step instructions")}</span></div><div class="na-a"><button type="button" class="na-go" data-oc="rvGotoStep(${cIdx},${sIdx})">Go to step ${x.n} →</button><button type="button" class="na-fx" data-oc="fix('${x.id}')">I've fixed this</button></div></div>` : ""}</div>`;
}

function openAlerts(keep?: any){
  const op = BL.filter(b => !fx[b.id]), wo = WA.filter(w => !fx[w.id]), tot = op.length + wo.length;
  const drc = $("drc");
  if (!drc) return;
  drc.dataset.k = "al";
  drc.innerHTML = `<div class="na"><div class="na-eb">Needs you</div><h2>${tot ? tot + " thing" + (tot > 1 ? "s" : "") + " need you" : "All clear"}</h2>` +
    (tot ? `<div class="na-bar" role="img" aria-label="${op.length} blocking, ${wo.length} to check">${op.length ? `<span style="flex:${op.length};background:#b4405a"></span>` : ""}${wo.length ? `<span style="flex:${wo.length};background:#d89a45"></span>` : ""}</div><div class="na-lg">${op.length ? `<span style="color:#b4405a">● ${op.length} blocking</span>` : ""}${wo.length ? `<span style="color:#b9822f">● ${wo.length} to check</span>` : ""}</div>` : `<div class="na-bar"><span style="flex:1;background:#0d9488"></span></div><p class="na-ok">Nothing is stopping you. You're ready for the next milestone.</p>`) +
    (op.length ? `<div class="na-sec"><b style="color:#b4405a">Blocking</b> · Action needed to proceed</div>${op.map(x => alRow(x, true)).join("")}` : "") +
    (wo.length ? `<div class="na-sec"><b style="color:#b9822f">To check</b> · Can slow you down</div>${wo.map(x => alRow(x, false)).join("")}` : "") + `</div>`;
  root.classList.add("o");
}
function closeD(){ root.classList.remove("o"); }

/* Hero setup */
const heroPrimaryBtn = $("hero-primary-btn");
if (heroPrimaryBtn) {
  if (options.nextAction) {
    heroPrimaryBtn.innerHTML = `Start ${options.nextAction.stepName} <span>→</span>`;
    heroPrimaryBtn.onclick = () => {
      if (options.onSelectStep) {
        options.onSelectStep(options.nextAction.chapterIdx, options.nextAction.stepIdx);
      }
    };
  } else {
    heroPrimaryBtn.onclick = () => {
      if (options.onSelectStep) options.onSelectStep(0, 0);
    };
  }
}
const heroSecondaryBtn = $("hero-secondary-btn");
if (heroSecondaryBtn) {
  heroSecondaryBtn.onclick = () => {
    if (options.onOpenVault) options.onOpenVault();
    else if (options.onOpenGuides) options.onOpenGuides();
    else window.location.href = "/guides/my-guides";
  };
}
const heroTitle = $("hero-title");
if (heroTitle && options.nextAction) {
  heroTitle.innerHTML = `Prepare for<br><em>${options.nextAction.stepName}</em>`;
}

/* calendar + planner */
const now = new Date();
const iv = options.interviewDate ? new Date(options.interviewDate) : new Date(now.getFullYear(), now.getMonth() + 1, 18);
const pDate = options.priorityDate ? new Date(options.priorityDate) : (options.receiptRecord?.noticeDate ? new Date(options.receiptRecord.noticeDate) : new Date(now.getFullYear(), 2, 12));
const dqDate = options.dqDate ? new Date(options.dqDate) : null;
const medDate = options.medicalDate ? new Date(options.medicalDate) : null;
const DEFAULT_KD=[
  [iv.getFullYear(), iv.getMonth(), iv.getDate(), "Interview", "#b4405a", "9:30 AM · US Embassy"],
  [now.getFullYear(), 5, 14, "Medical exam", "#0d9488", "Panel clinic"],
  [now.getFullYear(), 4, 2, "You became DQ", "#6b4f93", "NVC Approved"]
];
const KD = (options.keyDates && options.keyDates.length)
  ? options.keyDates.map(k => [k.y, k.m, k.d, k.t, k.c, k.s])
  : DEFAULT_KD;

let cm=new Date(now.getFullYear(),now.getMonth(),1);
let CE=[],face="f",aeC="#0d9488";
try{CE=(JSON.parse(localStorage.getItem("rv-ev")||"[]")||[]).filter(e=>e&&e.id&&e.t&&Number.isFinite(e.y)&&Number.isFinite(e.m)&&Number.isFinite(e.d));face=localStorage.getItem("rv-face")=="b"?"b":"f"}catch(e){CE=[]}
const svEv=()=>{try{localStorage.setItem("rv-ev",JSON.stringify(CE))}catch(e){}};
const MS3=["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"],COL=["#0d9488","#b4405a","#3b62a0","#6b4f93","#d89a45"];
const dOf=e=>new Date(e.y,e.m,e.d),today0=()=>new Date(now.getFullYear(),now.getMonth(),now.getDate());
const evs=()=>KD.map(k=>({y:k[0],m:k[1],d:k[2],t:k[3],c:k[4],s:k[5]})).concat(CE.map(e=>({...e,s:e.s||"Custom event",c:e.c||"#0d9488"}))).sort((a,b)=>dOf(b)-dOf(a));
const evAt=(y,m,d)=>evs().filter(e=>e.y==y&&e.m==m&&e.d==d);
const IC={cal:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="4" y="5" width="16" height="15" rx="3"/><path d="M4 10h16M9 3v4M15 3v4"/></svg>',list:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01"/></svg>',plus:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>'};
const goToday=()=>{cm=new Date(now.getFullYear(),now.getMonth(),1);cal()},mv=n=>{cm=new Date(cm.getFullYear(),cm.getMonth()+n,1);cal()};
function setFace(f){face=f;$("cl").classList.toggle("b",f=="b");try{localStorage.setItem("rv-face",f)}catch(e){}}
function goMonth(y,m){cm=new Date(y,m,1);cal()}
function goEv(y,m){cm=new Date(y,m,1);cal();setFace("f")}
function delEv(id){CE=CE.filter(e=>e.id!=id);svEv();cal()}
function cal(){const c0=$("cl");
if(!$("cf")){c0.innerHTML='<div class="fl"><div class="cf f" id="cf"></div><div class="cf b" id="cb"></div></div><div class="ae" id="ae"></div>';c0.classList.toggle("b",face=="b");aeInit()}
const y=cm.getFullYear(),m=cm.getMonth(),o=(new Date(y,m,1).getDay()+6)%7,n=new Date(y,m+1,0).getDate(),rows=Math.ceil((o+n)/7),t0=today0(),off=y!=now.getFullYear()||m!=now.getMonth();
let c="";const pd=new Date(y,m,0).getDate(),cell=(yy,mm,d,cls)=>{const es=evAt(yy,mm,d),k=es[0],td=new Date(yy,mm,d)-t0==0,wd=(new Date(yy,mm,d).getDay()+6)%7;
return `<button type="button" class="dc${td?" td":""}${wd>4?" we":""}${cls}" data-oc="aeOpen(${yy},${mm},${d})" aria-label="${d} ${MS3[mm]} ${yy}, add event"${k?` title="${es.map(e=>esc(e.t+" · "+e.s)).join("&#10;")}" style="--c:${k.c}"`:""}><span class="${k?"ev":""}">${d}</span>${k&&!td?"<u></u>":""}</button>`};
for(let i=o-1;i>=0;i--){const pm=new Date(y,m-1,1);c+=cell(pm.getFullYear(),pm.getMonth(),pd-i," out")}
for(let d=1;d<=n;d++)c+=cell(y,m,d,"");
for(let d=1;d<=rows*7-o-n;d++){const nm=new Date(y,m+1,1);c+=cell(nm.getFullYear(),nm.getMonth(),d," out")}
const all=evs(),st=all.filter(e=>dOf(e)>=t0).reverse().concat(all.filter(e=>dOf(e)<t0)).slice(0,3);
$("cf").innerHTML=`<div class="hd ch"><span class="ico" style="background:var(--blue);color:#3b62a0">${IC.cal}</span><b class="mt">${cm.toLocaleString("en",{month:"long"})}<span> ${y}</span></b><span class="sp"></span>${off?'<button type="button" class="cb td2" data-oc="goToday()">Today</button>':""}<button type="button" class="cb r" data-oc="mv(-1)" aria-label="Previous month">‹</button><button type="button" class="cb r" data-oc="mv(1)" aria-label="Next month">›</button><button type="button" class="cb r add" data-oc="aeOpen()" aria-label="Add event" title="Add event">${IC.plus}</button><button type="button" class="cb r" data-oc="setFace('b')" aria-label="Show key dates list" title="Key dates list">${IC.list}</button></div><div class="cg" style="--r:${rows}">${["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d=>`<small>${d}</small>`).join("")}${c}</div><div class="kc">${st.map(e=>{const df=Math.round((dOf(e)-t0)/864e5),rel=df>0?`in ${df} day${df>1?"s":""}`:df==0?"today":e.custom?"passed":esc(e.s);return`<button type="button" style="--c:${e.c}" data-oc="goMonth(${e.y},${e.m})"><b>${e.d} ${new Date(e.y,e.m,1).toLocaleString("en",{month:"short"})}</b><span>${esc(e.t)}</span><small>${rel}</small></button>`}).join("")}</div>`;
kdl()}
function kdl(){const t0=today0(),all=evs(),i=all.findIndex(e=>dOf(e)<=t0);
const row=e=>`<div class="kr${dOf(e)<t0?" past":""}" style="--c:${e.c}" role="button" tabindex="0" data-oc="goEv(${e.y},${e.m})" data-ok="goEv(${e.y},${e.m})"><div class="dp"><i>${MS3[e.m]}</i><b>${e.d}</b></div><div class="kt"><strong>${esc(e.t)}</strong><small>${esc(e.s)}${e.y!=now.getFullYear()?" · "+e.y:""}</small></div>${e.custom?`<button type="button" class="kx" aria-label="Delete ${esc(e.t)}" title="Delete event" data-oc="delEv('${e.id}')">×</button>`:""}</div>`,
tr=`<div class="kr on"><div class="dp"><i>${MS3[now.getMonth()]}</i><b>${now.getDate()}</b></div><div class="kt"><strong>Today</strong><small>You are here</small></div></div>`,
rs=i<0?all.map(row).concat(tr):all.slice(0,i).map(row).concat(tr,all.slice(i).map(row));
$("cb").innerHTML=`<div class="hd ch"><span class="ico" style="background:var(--blue);color:#3b62a0">${IC.cal}</span><b class="mt">Key dates</b><span class="sp"></span><button type="button" class="cb r add" data-oc="aeOpen()" aria-label="Add event" title="Add event">${IC.plus}</button><button type="button" class="cb r" data-oc="setFace('f')" aria-label="Show calendar" title="Calendar view">${IC.cal}</button></div><div class="kl">${rs.join("")}</div>`}
function aeInit(){$("ae").innerHTML=`<div class="hd" style="margin:0"><b style="font-size:16px;font-weight:500;letter-spacing:-.02em">Add event</b><span class="sp"></span><button type="button" class="cb r" data-oc="aeClose()" aria-label="Close">✕</button></div><label><span>Title</span><input id="aet" maxlength="40" autocomplete="off" placeholder="e.g. Collect police certificate"></label><div class="r2"><label><span>Date</span><input id="aed" type="date"></label><label><span>Time<em>optional</em></span><input id="aeh" type="time"></label></div><label><span>Note<em>optional</em></span><input id="aen" maxlength="40" autocomplete="off" placeholder="Where, who, what to bring"></label><div class="sws" id="aec">${COL.map(c=>`<button type="button" style="--c:${c}" data-c="${c}" aria-label="Colour ${c}" class="${c==aeC?"on":""}"></button>`).join("")}</div><button type="button" class="aes" id="aes" disabled>Save event</button>`;
["aet","aed"].forEach(i=>$(i).addEventListener("input",aeChk));
$("aec").onclick=e=>{const b=e.target.closest("button");if(!b)return;aeC=b.dataset.c;[...$("aec").children].forEach(x=>x.classList.toggle("on",x==b))};
$("aes").onclick=aeSave;
$("ae").addEventListener("keydown",e=>{if(e.key=="Escape")aeClose();else if(e.key=="Enter"&&e.target.tagName=="INPUT"&&!$("aes").disabled)aeSave()})}
function aeChk(){$("aes").disabled=!($("aet").value.trim()&&$("aed").value)}
function aeOpen(y,m,d){if(y==null){const off=cm.getFullYear()!=now.getFullYear()||cm.getMonth()!=now.getMonth();y=cm.getFullYear();m=cm.getMonth();d=off?1:now.getDate()}
$("aed").value=`${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;$("aet").value="";$("aeh").value="";$("aen").value="";aeChk();
$("cl").classList.add("ae-on");setTimeout(()=>$("aet").focus(),320)}
function aeClose(){$("cl").classList.remove("ae-on")}
function aeSave(){const t=$("aet").value.trim(),v=$("aed").value;if(!t||!v)return;const [y,m,d]=v.split("-").map(Number),h=$("aeh").value,nt=$("aen").value.trim(),sb=[];
if(h){const [hh,mm]=h.split(":").map(Number);sb.push(`${hh%12||12}:${String(mm).padStart(2,"0")} ${hh<12?"AM":"PM"}`)}if(nt)sb.push(nt);
CE.push({id:"c"+Date.now().toString(36)+Math.random().toString(36).slice(2,5),y,m:m-1,d,t,c:aeC,s:sb.join(" · ")||"Custom event",custom:1});svEv();cm=new Date(y,m-1,1);aeClose();cal()}
function planner(){
  const activeMilestone = options.activeMilestoneIndex != null
    ? options.activeMilestoneIndex
    : (options.interviewDate ? 4 : options.medicalDate ? 2 : options.dqDate ? 3 : 0);
  const pDone = activeMilestone > 0;
  const dqDone = activeMilestone > 1;
  const dqActive = activeMilestone === 1;
  const medDone = activeMilestone > 2;
  const medActive = activeMilestone === 2;
  const ivDone = activeMilestone >= 4;

  $("pl").innerHTML=`<div class="hd"><b>Case tracking</b><span class="mu">${options.receiptRecord?.lastCheckedAt ? "checked recently" : "USCIS active"}</span></div><div class="tl">
    <div class="${pDone ? "dn" : "now"}"><b>Petition received</b><small>${pDate ? pDate.toLocaleDateString("en", { day: "numeric", month: "short", year: "numeric" }) : "Filed"} · ${pDone ? "approved" : "active"}</small></div>
    <div class="${dqDone ? "dn" : dqActive ? "now" : "fu"}"><b>Documentarily qualified</b><small>${dqDate ? dqDate.toLocaleDateString("en", { day: "numeric", month: "short" }) : dqActive ? "In review" : "Upcoming (locked)"}</small></div>
    <div class="${medDone ? "dn" : medActive ? "now" : "fu"}"><b>Medical exam</b><small>${medDate ? medDate.toLocaleDateString("en", { day: "numeric", month: "short" }) : medActive ? "To do" : "Upcoming (locked)"}</small></div>
    <div class="${activeMilestone === 3 ? "now" : activeMilestone > 3 ? "dn" : "fu"}"><b>Embassy appointment queue</b><small>${activeMilestone >= 4 ? "Slot assigned" : activeMilestone === 3 ? "In appointment queue" : "Upcoming (locked)"}</small></div>
    <div class="${ivDone ? "now" : "fu"}"><b>Visa interview</b><small>${ivDone && iv ? iv.toLocaleDateString("en", { day: "numeric", month: "short" }) + " · US Embassy, Islamabad" : "Upcoming (locked)"}</small></div>
  </div><a class="mu" style="margin-top:auto;color:var(--blueD);font-weight:600" data-oc="setTr('ticket')">‹ Back to ticket</a>`}

function setTr(v){B.dataset.tr=v;root.querySelectorAll("#s2 button").forEach(b=>b.classList.toggle("on",b.dataset.v==v));if(v=="planner")planner()}
root.querySelectorAll("#s1 button").forEach(b=>b.onclick=()=>{B.dataset.al=b.dataset.v;root.querySelectorAll("#s1 button").forEach(x=>x.classList.toggle("on",x==b))});
root.querySelectorAll("#s2 button").forEach(b=>b.onclick=()=>setTr(b.dataset.v));
const seg=(id,fn)=>root.querySelectorAll("#"+id+" button").forEach(b=>b.onclick=()=>{root.querySelectorAll("#"+id+" button").forEach(x=>x.classList.toggle("on",x==b));fn(b.dataset.v)});
seg("s3",v=>{RDS=v;road()});

/* Case tracking ticket */
const activeMilestone = options.activeMilestoneIndex != null
  ? options.activeMilestoneIndex
  : (options.interviewDate ? 4 : options.medicalDate ? 2 : options.dqDate ? 3 : 0);
let tkI = Math.min(4, Math.max(0, activeMilestone)), tkDir = "";

function trk(){
  const day = 864e5, t0 = new Date(now.getFullYear(), now.getMonth(), now.getDate()), D = Math.max(0, Math.ceil((iv - t0) / day));
  if ($("nxd")) $("nxd").textContent = D;

  const M: Array<[string, Date | null, string]> = [
    ["Petition", pDate, pDate.toLocaleDateString("en", { month: "short", year: "numeric" })],
    ["DQ", dqDate, dqDate ? dqDate.toLocaleDateString("en", { day: "numeric", month: "short" }) : (activeMilestone >= 1 ? "In review" : "Upcoming")],
    ["Medical", medDate, medDate ? medDate.toLocaleDateString("en", { day: "numeric", month: "short" }) : (activeMilestone >= 2 ? "Panel clinic" : "Upcoming")],
    ["Slot", null, activeMilestone >= 4 ? "Assigned" : (activeMilestone >= 3 ? "In Queue" : "Upcoming")],
    ["Interview", iv, activeMilestone >= 4 ? iv.toLocaleDateString("en", { day: "numeric", month: "short" }) : "Upcoming"]
  ];

  const MO = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"], WD = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const ago = (d: Date) => { const n = Math.max(0, Math.round((t0.getTime() - d.getTime()) / day)); return n < 60 ? [n, n == 1 ? "day ago" : "days ago"] : [Math.floor(n / 30.44), Math.floor(n / 30.44) == 1 ? "month ago" : "months ago"]; };

  const CEAC_DATA = location.hash == "#ap" ? { status: "Administrative Processing", slip: "Yellow", apStart: new Date(2026, 8, 9), updated: "9 Sep", docs: ["Police certificate", "Updated bank statement"] } : location.hash == "#refused" ? { status: "Refused", slip: "Yellow", refusedOn: new Date(2026, 6, 30), updated: "30 Jul", docs: ["Police certificate", "Updated bank statement"] } : location.hash == "#issued" ? { status: "Issued" } : (window.RAHVANA_CEAC || null);
  const AP = !!(CEAC_DATA || (iv < t0 && activeMilestone >= 4));

  const realReceipt = options.receiptNumber || options.receiptRecord?.receiptNumber || "MSC2690123456";
  const uscisStatus = options.receiptRecord?.lastKnownStatus;
  const isApproved = uscisStatus ? uscisStatus.toLowerCase().includes("approved") : activeMilestone > 0;

  const ST: any[] = [
    // 0: USCIS Petition
    uscisStatus
      ? {
          t: uscisStatus,
          c: isApproved ? "Approved" : "In review",
          p: !isApproved,
          bigText: isApproved ? "Approved" : "USCIS",
          m: realReceipt,
          l: [`Notice date: ${pDateStr}`, `Status: ${uscisStatus}`],
          rm: [isApproved ? "Approved" : "Active", "USCIS review"],
          n: `USCIS tracking is active for ${realReceipt}. Official case status: ${uscisStatus}.`,
          a: ["Check USCIS status", "uscis"]
        }
      : activeMilestone > 0
        ? { t: "Petition approved", c: "Done", bigText: "Approved", m: pDateStr, l: ["Receipt: " + realReceipt, "Sent to NVC"], rm: ["Approved", "USCIS done"], n: "USCIS approved Form I-130 petition. Case forwarded to National Visa Center." }
        : { t: "Petition filed", c: "In review", p: 1, bigText: "Filed", m: pDateStr, l: ["Receipt on file: " + realReceipt, "Status monitoring active"], rm: ["Active", "USCIS review"], n: "Petition filed with USCIS. Status monitoring active.", a: ["Check USCIS", "uscis"] },

    // 1: NVC & CEAC / DQ
    activeMilestone < 1
      ? { t: "NVC review & DQ", c: "Upcoming", bigText: "Stage 2", m: "Upcoming stage", l: ["Unlocks after USCIS approval", "National Visa Center"], rm: ["Locked", "Stage 2"], n: "Unlocks after USCIS approves Form I-130 petition." }
      : activeMilestone === 1
        ? { t: "NVC document review", c: "In progress", p: 1, bigText: "CEAC", m: dqDate ? MO[dqDate.getMonth()] + " " + dqDate.getFullYear() : "Civil docs & DS-260", l: ["Form DS-260 & fees", "Civil documents submission"], rm: ["Active", "NVC review"], n: "Submit Form DS-260, pay immigrant visa fees, and upload civil documents on CEAC.", a: ["Open CEAC", "ceac"] }
        : { t: "Documentarily qualified", c: "Done", bigText: "DQ", m: dqDate ? MO[dqDate.getMonth()] + " " + dqDate.getFullYear() : "Review complete", l: ["All documents accepted", "Review complete"], rm: ["Done", "DQ achieved"], n: "Documentarily qualified (DQ). All documents accepted by NVC. Transferred to US Embassy Islamabad queue.", a: ["Open CEAC", "ceac"] },

    // 2: Medical Exam
    activeMilestone < 2
      ? { t: "Medical exam", c: "Upcoming", bigText: "Stage 3", m: "Upcoming stage", l: ["Unlocks once DQ'd", "Approved panel clinic"], rm: ["Locked", "Stage 3"], n: "Unlocks once your case is Documentarily Qualified (DQ) and interview is approaching." }
      : activeMilestone === 2
        ? { t: "Medical exam", c: "To do", p: 1, bigText: "Exam", m: medDate ? MO[medDate.getMonth()] + " " + medDate.getFullYear() : "Panel clinic", l: ["Approved panel clinic", "Vaccinations & blood tests"], rm: ["To do", "clinic exam"], n: "Bring Pakistani passport, 4 photos (35×45mm), and polio vaccination card to approved panel clinic." }
        : { t: "Medical exam", c: "Done", bigText: "Done", m: medDate ? MO[medDate.getMonth()] + " " + medDate.getFullYear() : "Exam complete", l: ["Panel clinic approved", "Sealed envelope ready"], rm: ["Done", "envelope sealed"], n: "Medical exam completed. Keep your sealed brown medical envelope untampered for interview day." },

    // 3: Embassy Queue
    activeMilestone < 3
      ? { t: "Embassy queue", c: "Upcoming", bigText: "Stage 4", m: "Upcoming stage", l: ["Unlocks after DQ", "US Embassy Islamabad"], rm: ["Locked", "Stage 4"], n: "Unlocks after Documentarily Qualified (DQ) status is confirmed." }
      : activeMilestone === 3
        ? { t: "Embassy appointment queue", c: "In queue", p: 1, bigText: "Queue", m: "US Embassy, Islamabad", l: ["Waiting for interview slot", "US Embassy Islamabad"], rm: ["Active", "in queue"], n: "In US Embassy Islamabad appointment queue. Monitoring for interview appointment letter (P4)." }
        : { t: "Slot assigned", c: "Done", bigText: "Slot", m: "Slot confirmed", l: ["Interview date confirmed", "US Embassy Islamabad"], rm: ["Done", "letter sent"], n: "Interview slot assigned by US Embassy Islamabad." },

    // 4: Visa Interview Day
    activeMilestone < 4
      ? { t: "Visa interview", c: "Upcoming", bigText: "Stage 5", m: "Upcoming stage", l: ["Unlocks when date scheduled", "US Embassy Islamabad"], rm: ["Locked", "Stage 5"], n: "Unlocks when US Embassy Islamabad assigns your interview appointment date." }
      : { t: "Visa interview", c: "Scheduled", bigText: "Interview", m: MO[iv.getMonth()] + " " + iv.getFullYear(), l: ["9:30 AM", "US Embassy, Islamabad"], rm: [D, "days to interview"], n: "Bring original NADRA documents (CNIC, FRC, MRC), valid passport, appointment letter & sealed medical envelope.", a: ["Add to calendar", "cal"] }
  ];

  const dsn = (d: Date) => Math.max(0, Math.round((t0.getTime() - d.getTime()) / day)), nd = CEAC_DATA && CEAC_DATA.docs ? CEAC_DATA.docs.length : 0;
  const APS = !CEAC_DATA ? { t: "Interview done", c: "Awaiting result", bigText: "Result", m: "days since interview", l: ["Check CEAC for your result", "Status monitoring active"], rm: ["—", "no update yet"], n: "Your result will appear here.", a: ["Open CEAC", "ceac"] }
    : CEAC_DATA.status == "Issued" ? { t: "Visa issued", c: "Issued", bigText: "Issued", m: "Visa issued", l: ["Case complete", "See CEAC for passport details"], rm: ["Done", "case closed"], n: "Check CEAC for passport collection.", a: ["Open CEAC", "ceac"] }
    : CEAC_DATA.status == "Refused" ? { t: "Refused under 221(g)", c: "Refused", r: 1, bigText: "221(g)", m: "days since refusal", l: ["221(g) · " + CEAC_DATA.slip + " slip", "Requested: " + nd + " documents"], rm: [CEAC_DATA.slip, "slip"], n: "Submit the " + nd + " requested documents.", a: ["Open CEAC", "ceac"] }
    : { t: "Administrative processing", c: "221(g)", r: 1, bigText: "221(g)", m: "days in AP", l: ["CEAC: Admin processing", "Requested: " + nd + " documents"], rm: [CEAC_DATA.slip, "slip"], n: "Submit the " + nd + " documents.", a: ["Open CEAC", "ceac"] };

  const TC = ["#0d9488", "#3b62a0", "#6b4f93", "#6b4f93", "#6b4f93"];

  function R(){
    const st = (AP && tkI == 4) ? APS : ST[tkI];
    const isLocked = tkI > activeMilestone;
    const sc = st.r ? "#b4405a" : isLocked ? "#8c9ba5" : TC[tkI];
    const d = M[tkI][1];
    const last = tkI == 4;
    const wd = (d && !isLocked && tkI != 3) ? " · " + WD[d.getDay()] : "";
    const r = st.rm || (tkI < 3 && d ? ago(d) : tkI == 3 ? ["Active", "scheduling queue"] : [D, "days to interview"]);

    $("tkh").className = "dt-h tkb-body " + tkDir;
    $("tkd").className = "dt-d tkb-body " + tkDir;
    [$("tkh"), $("tkd"), $("tkw")].forEach(e => e.style.setProperty("--sc", sc));

    $("tkh").innerHTML = `<div><div class="eb">Case tracking</div><h4>${esc(st.t)}</h4></div><div class="col"><div class="tkpg"><button type="button" id="tkp" aria-label="Previous stage" ${tkI == 0 ? "disabled" : ""}>‹</button><b>Stage ${tkI + 1} of 5</b><button type="button" id="tkn" aria-label="Next stage" ${last ? "disabled" : ""}>›</button></div><span class="dt-ok${st.p ? " p" : ""}${st.r ? " r" : ""}${isLocked ? " lk" : ""}">${esc(st.c)}</span></div>`;

    $("tkd").innerHTML = `<span class="big">${esc(st.bigText || "Stage " + (tkI + 1))}</span><div class="m"><b>${st.m || (d ? MO[d.getMonth()] + " " + d.getFullYear() + wd : "—")}</b><span>${st.l[0]}</span><span>${st.l[1]}</span></div><div class="rm"><b>${r[0]}</b><span>${r[1]}</span></div>`;

    $("rl").innerHTML = M.map((m, i) => {
      const isDone = i < activeMilestone;
      const isCur = i === activeMilestone;
      const isLockedMilestone = i > activeMilestone;
      const dateText = isLockedMilestone ? "Upcoming" : m[2];
      return `<div class="${isDone ? "d" : isCur ? "p" : "n"}${i == tkI ? " sel" : ""}" style="--tc:${TC[i]}" data-i="${i}" role="button" tabindex="0" aria-label="${m[0]}, ${dateText}"><span class="dot"></span><b>${m[0]}</b><small>${dateText}</small></div>`;
    }).join("");

    $("tkw").className = "tknow tkb-body " + tkDir;
    $("tkw").innerHTML = `<span>${esc(st.n)}</span>${st.a ? `<a id="tka" role="button" tabindex="0">${st.a[0]} ›</a>` : ""}`;

    const A = $("tka");
    if (A) {
      const go = () => {
        if (st.a[1] == "ceac") {
          window.open("https://ceac.state.gov/CEACStatTracker/Status.aspx", "_blank", "noopener");
        } else if (st.a[1] == "uscis") {
          window.open("https://egov.uscis.gov/", "_blank", "noopener");
        } else {
          const p = (n: number) => String(n).padStart(2, "0"), ds = iv.getFullYear() + p(iv.getMonth() + 1) + p(iv.getDate());
          const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "BEGIN:VEVENT", "DTSTART:" + ds + "T093000", "DTEND:" + ds + "T103000", "SUMMARY:Visa interview - US Embassy, Islamabad", "END:VEVENT", "END:VCALENDAR"].join("\r\n");
          const u = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
          const a = document.createElement("a");
          a.href = u; a.download = "visa-interview.ics"; a.click();
          setTimeout(() => URL.revokeObjectURL(u), 500);
        }
      };
      A.onclick = go;
      A.onkeydown = e => { if (e.key == "Enter" || e.key == " ") { e.preventDefault(); go(); } };
    }

    $("tkp").onclick = () => { tkI--; tkDir = "l"; R(); };
    $("tkn").onclick = () => { tkI++; tkDir = "r"; R(); };
    $("rl").querySelectorAll("[data-i]").forEach(e => {
      const go = () => { const i = +e.dataset.i; tkDir = i < tkI ? "l" : "r"; tkI = i; R(); };
      e.onclick = go;
      e.onkeydown = ev => { if (ev.key == "Enter" || ev.key == " ") { ev.preventDefault(); go(); } };
    });
  }

  R();
}

cal(); trk();

/* Receipt & Auto-check setup with Tier Gating */
const realReceipt = options.receiptNumber || options.receiptRecord?.receiptNumber || "MSC2690123456";
const rCodeEl = $("receipt-code");
if (rCodeEl) rCodeEl.textContent = realReceipt;

const rLabel = $("receipt-label");
if (rLabel) {
  rLabel.textContent = options.receiptRecord?.lastKnownStatus ? "USCIS" : "Receipt";
}

const rUpdated = $("receipt-updated-label");
if (rUpdated) {
  if (options.receiptRecord?.lastCheckedAt) {
    try {
      const d = new Date(options.receiptRecord.lastCheckedAt);
      rUpdated.textContent = `checked ${d.toLocaleDateString("en", { month: "short", day: "numeric" })}`;
    } catch {
      rUpdated.textContent = "tracking active";
    }
  } else if (options.receiptRecord?.trackingEnabled) {
    rUpdated.textContent = "tracking active";
  } else {
    rUpdated.textContent = "USCIS status active";
  }
}

$("cp").onclick = function(){
  try { navigator.clipboard.writeText(realReceipt); } catch (x) {}
  this.textContent = "copied";
  setTimeout(() => this.textContent = "copy", 1200);
};

const acInput = $("ac") as HTMLInputElement | null;
if (acInput) {
  const isTierLocked = options.tier === "free" || options.tier === "basic";
  acInput.checked = !isTierLocked && options.autoCheckEnabled !== false;
  $("al").textContent = isTierLocked ? "Auto-check (Premium)" : acInput.checked ? "Auto-check on" : "Auto-check off";

  acInput.onchange = (e) => {
    if (isTierLocked) {
      e.preventDefault();
      acInput.checked = false;
      $("al").textContent = "Auto-check (Premium)";
      if (options.onUpgradeRequired) {
        options.onUpgradeRequired("tracker_reminders");
      }
      return;
    }
    $("al").textContent = acInput.checked ? "Auto-check on" : "Auto-check off";
    if (options.onToggleAutoCheck) options.onToggleAutoCheck(acInput.checked);
  };
}

alerts();
chap();road();bl();

function fit(){
  if(dead)return;
  const b=$("fr");
  if(!b)return;
  const scale = Math.min((window.innerWidth - 48) / 1340, (window.innerHeight - 110) / 880, 1.0);
  const safeScale = Math.max(0.45, scale);
  if ("zoom" in (b.style as any)) {
    (b.style as any).zoom = String(safeScale);
  } else {
    b.style.transform = `scale(${safeScale})`;
    b.style.transformOrigin = "top center";
  }
}
onWin("resize",fit);fit();document.fonts&&document.fonts.ready.then(fit);

(function(){
const F0=[256,192],RM=matchMedia("(prefers-reduced-motion:reduce)").matches,bd=$("bd"),svg=$("js2"),jt=$("jt"),jl=$("jl");
if (!svg || !jt || !jl) return;

const C=CHD.map(c=>c.col),CT=CHD.map(c=>c.t),ci0=Math.max(0,CHD.findIndex(c=>c.cur)),dn=CHD[ci0]?.d ?? 0;
let activeCi = ci0;
let activeK = dn;
if (options.nextAction && options.nextAction.chapterIdx != null && options.nextAction.stepIdx != null) {
  activeCi = Math.max(0, Math.min(CHD.length - 1, options.nextAction.chapterIdx));
  activeK = Math.max(0, Math.min((CHD[activeCi]?.tot ?? 1) - 1, options.nextAction.stepIdx));
}

const DEFAULT_NM=[["Eligibility check","Petition forms","Sponsor documents","Relationship proof","Filing fee","Submit petition","Receipt notice","Biometrics","Evidence request","Case review","Petition approved"],["Case received","Choose agent","Pay fees","Fill online form","Civil documents","Upload scans","Affidavit of support","NVC review","Fix corrections","Final check","Documentarily qualified","Interview scheduled"],["Interview booked","Medical exam","Financial support","Photos","Civil documents","Police certificate","Document pack","Mock interview","Visa fee","Embassy interview","Visa issuance"]];
const NM = (options.stepNames && options.stepNames.length) ? options.stepNames : DEFAULT_NM;

const K=[[36,248],[186,248],[316,118],[460,118]],LEN=[0,1,2].map(i=>Math.hypot(K[i+1][0]-K[i][0],K[i+1][1]-K[i][1])),TOT=LEN.reduce((a,b)=>a+b),CUM=[0,LEN[0],LEN[0]+LEN[1]];
const at=(i,f)=>[K[i][0]+(K[i+1][0]-K[i][0])*f,K[i][1]+(K[i+1][1]-K[i][1])*f],ln=(i,a,b)=>{const p=at(i,a),q=at(i,b);return`M${p[0]} ${p[1]}L${q[0]} ${q[1]}`};
const ST=[];
CHD.forEach((c,ci)=>{
  for(let k=0;k<c.tot;k++){
    const f=(k+1)/(c.tot+1),p=at(ci,f);
    const isDone = ci < activeCi || (ci == activeCi && k < activeK);
    const isCurrent = ci == activeCi && k == activeK;
    ST.push({i:ST.length,ci,k,n:c.tot,t:(NM[ci]&&NM[ci][k])||"Step "+(k+1),f,x:p[0],y:p[1],g:(CUM[ci]+LEN[ci]*f)/TOT,s:isDone?"d":isCurrent?"c":"n"});
  }
});

let cur=ST.findIndex(s=>s.s=="c");
if (cur < 0) cur = ST.findIndex(s=>s.ci == activeCi && s.s != "d");
if (cur < 0) cur = Math.min(ST.length - 1, Math.max(0, dn));
const fc=ST[cur] ? ST[cur].f : 0.5;

const pDateStr = options.priorityDate ? new Date(options.priorityDate).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" }) : "12 Mar 2025";
const dqDateStr = options.dqDate ? new Date(options.dqDate).toLocaleDateString("en", { month: "short", day: "numeric" }) : "2 Jun 2026";
const MS=[["Priority date", pDateStr],["NVC processing","begins"],["Documentarily qualified", dqDateStr],["Visa issuance","Final destination"]];
const W7=`stroke-width="9" stroke-linecap="round" stroke-linejoin="round" fill="none"`;
let h=`<g id="cm">`;

CHD.forEach((c,i)=>{
  if(i>activeCi)h+=`<path data-ci="${i}" class="fi" style="--d:2.1s" d="${ln(i,0,1)}" stroke="#d3dde0" ${W7}/>`;
  else{
    if(i==activeCi)h+=`<path data-ci="${i}" class="fi" style="--d:2.1s" d="${ln(i,fc,1)}" stroke="#d3dde0" ${W7}/>`;
    h+=`<path data-ci="${i}" class="ln" pathLength="1" style="--d:${(CUM[i]/TOT*2).toFixed(2)}s" d="${ln(i,0,i==activeCi?fc:1)}" stroke="${C[i]}" ${W7}/>`;
  }
});

ST.forEach(s=>{if(s.s=="c")return;const col=s.s=="n"?"#8ea3ab":C[s.ci];h+=`<g class="st" data-i="${s.i}" transform="translate(${s.x.toFixed(1)} ${s.y.toFixed(1)})"><circle r="8" fill="transparent"/><g class="bd" style="--d:${(.1+s.g*2).toFixed(2)}s"><circle class="b" r="3.1" fill="#fff" stroke="${col}" stroke-opacity=".5"/></g></g>`});
h+=`<g id="sel" pointer-events="none" opacity="0"><circle r="7.5" fill="none" stroke="#14263a" stroke-width="1.8"/></g>`;
K.forEach((p,i)=>{h+=`<g class="st" data-m="${i}" transform="translate(${p[0]} ${p[1]})"><circle r="14" fill="transparent"/><g class="bd" style="--d:${(i/3*1.8).toFixed(2)}s">${i==0?`<circle r="8" fill="${C[0]}" stroke="#fff" stroke-width="3.5"/>`:i==3?`<circle r="11" fill="#14263a" stroke="#fff" stroke-width="3"/><path d="M-3 -5V5M-3 -5h7l-2 2.5 2 2.5h-7" stroke="#fff" stroke-width="1.7" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`:`<circle r="9.5" fill="#fff" stroke="#14263a" stroke-width="3.6"/>`}</g></g>`});
const c=ST[cur] || ST[0];
if (c) {
  h+=`<g class="st" data-i="${cur}" transform="translate(${c.x.toFixed(1)} ${c.y.toFixed(1)})"><circle r="16" fill="transparent"/><g class="cm"><circle class="pu" r="10" fill="none" stroke="${C[c.ci]}" stroke-width="2"/><circle r="11" fill="#fff" stroke="${C[c.ci]}" stroke-width="4.5"/><circle r="4" fill="${C[c.ci]}"/></g></g>`;
}

const sub=i=>i<activeCi?"Complete":i==activeCi?`${CHD[i].d} of ${CHD[i].tot} steps`:"Upcoming";
const lwp=(sx,sy,inner)=>`<g class="lw" data-x="${sx}" data-y="${sy}">${inner}</g>`;
const lab=(st,ox,oy,i)=>lwp(st[0],st[1],`<g class="cl fi" style="--d:2.3s" data-ci="${i}"><text x="${ox}" y="${oy}" font-size="11.5" font-weight="600" fill="${C[i]}">${CT[i]}</text><text x="${ox}" y="${oy+13}" font-size="10" fill="#6b7e90">${sub(i)}</text></g>`);
const tx=(st,ox,oy,a,b,an)=>lwp(st[0],st[1],`<g class="fi" style="--d:2.3s" pointer-events="none"><text x="${ox}" y="${oy}" text-anchor="${an}" font-size="9.5" fill="#6b7e90">${a}</text><text x="${ox}" y="${oy+12}" text-anchor="${an}" font-size="11" font-weight="600" fill="#14263a">${b}</text></g>`);

let LB="";
LB+=lab(K[0], -8, 28, 0)+lab([(K[1][0]+K[2][0])/2,(K[1][1]+K[2][1])/2], -95, 20, 1)+lab(K[2], 10, 28, 2);
LB+=tx(K[0], -8, -25, "Priority date", pDateStr, "start")+tx(K[2], -16, -14, "DQ", dqDateStr, "end")+tx(K[3], 15, 26, "Final destination", "Visa issuance", "end");
const dt=e=>e.ci==2&&e.k==9&&iv?" · "+iv.toLocaleDateString("en",{month:"short",day:"numeric"}):e.ci==2&&e.k==1&&medDate?" · "+medDate.toLocaleDateString("en",{month:"short",day:"numeric"}):"";
const SN=ST.map(e=>{const col=e.s=="n"?"#7b8d9c":e.s=="c"?"#14263a":"#34495c",w=e.s=="c"?700:500,d=e.ci==1?`<text x="15" y="4" font-size="11" font-weight="${w}" fill="${col}">${e.t}${dt(e)}</text>`:`<text transform="rotate(-38)" x="7" y="-9" font-size="11" font-weight="${w}" fill="${col}">${e.t}${dt(e)}</text>`;return`<g class="sw2" data-x="${e.x.toFixed(1)}" data-y="${e.y.toFixed(1)}" style="paint-order:stroke;stroke:#eef2f5;stroke-width:3.5px;stroke-linejoin:round">${d}</g>`}).join("");
svg.innerHTML=h+`</g><g id="lb">${LB}</g><g id="zt" pointer-events="none" style="opacity:0"><text id="zt1" x="16" y="30" font-size="16" font-weight="600"></text><text id="zt2" x="16" y="48" font-size="11.5" fill="#6b7e90"></text></g><g id="sl" pointer-events="none" style="opacity:0">${SN}</g>`;

const cm=$("cm"),selg=$("sel"),lbs=[...svg.querySelectorAll(".lw")],sg=$("sl"),zt=$("zt"),segs=[...svg.querySelectorAll("path[data-ci]")],bds=[...svg.querySelectorAll(".st[data-i]")],mks=[...svg.querySelectorAll(".st[data-m]")],sls=[...svg.querySelectorAll(".sw2")];
let fci=-1,lw=0,lh=0,s=RM?1:2.4,fx=RM?F0[0]:K[0][0],fy=RM?F0[1]:K[0][1],ts=1,tx2=F0[0],ty2=F0[1],sel=cur,zoom=0,hv=null,force=1,idle=0;const KE=.04;let ls=Math.log(s),vs=0,vx=0,vy=0,lt=performance.now();const cl01=v=>Math.max(0,Math.min(1,v));
const cxy=()=>[jl.clientWidth/2,jl.clientHeight/2],sp=(x,y)=>{const c=cxy();return[(x-fx)*s+c[0],(y-fy)*s+c[1]]};
function place(){const t=hv??{i:sel},o=t.m!=null?{x:K[t.m][0],y:K[t.m][1]}:ST[t.i];if(!o)return;const p=sp(o.x,o.y);jt.style.left=Math.max(75,Math.min(jl.clientWidth-75,p[0]))+"px";jt.style.top=(p[1]-16)+"px";jt.style.visibility=(!zoom||(hv==null&&sel==cur)?!zoom:(p[1]>40&&p[1]<296&&p[0]>-10&&p[0]<510))?"visible":"hidden";const q=ST[sel];if(q){selg.setAttribute("transform",`translate(${q.x} ${q.y})`);selg.setAttribute("opacity",sel==cur?0:1)}}
function apply(){const c=cxy();cm.setAttribute("transform",`translate(${c[0]} ${c[1]}) scale(${s}) translate(${-fx} ${-fy})`);lbs.forEach(g=>{const p=sp(+g.dataset.x,+g.dataset.y);g.setAttribute("transform",`translate(${p[0].toFixed(1)} ${p[1].toFixed(1)})`);g.style.opacity=(p[0]>-10&&p[0]<510&&p[1]>-10&&p[1]<280)?cl01((1.9-s)/.6):0});const on=s>1.5,zf=cl01((s-1.25)/.8),zo=cl01((s-1.5)/.6);sg.style.opacity=zo;zt.style.opacity=zo;segs.forEach(e=>e.style.strokeOpacity=+e.dataset.ci!=fci?1-.88*zf:1);mks.forEach(e=>{const m=+e.dataset.m;e.style.opacity=m!=fci&&m!=fci+1?1-.85*zf:1});bds.forEach(e=>e.style.opacity=ST[+e.dataset.i]?.ci!=fci?1-.85*zf:1);if(on)sls.forEach((g,gi)=>{const p=sp(+g.dataset.x,+g.dataset.y),ok=ST[gi]?.ci==fci&&p[0]>8&&p[0]<478&&p[1]>12&&p[1]<262&&!(p[0]<190&&p[1]<62);g.style.display=ok?"":"none";if(ok)g.setAttribute("transform",`translate(${p[0].toFixed(1)} ${p[1].toFixed(1)})`)});place()}
function frame(){if(dead)return;raf=requestAnimationFrame(frame);const t=performance.now(),dt=Math.min(.05,(t-lt)/1000);lt=t;if(bd.dataset.jl!="1")return;
if(jl.clientWidth!=lw||jl.clientHeight!=lh){lw=jl.clientWidth;lh=jl.clientHeight;force=1}
const lts=Math.log(ts),ds=lts-ls,dx=tx2-fx,dy=ty2-fy,moving=Math.abs(ds)>.0008||Math.abs(dx)>.04||Math.abs(dy)>.04||Math.abs(vs)>.002||Math.abs(vx)>.04||Math.abs(vy)>.04;
if(RM){s=ts;ls=lts;fx=tx2;fy=ty2;if(force||moving){force=0;vs=vx=vy=0;apply()}return}
if(moving||force){const w=7.2;vs+=(w*w*ds-2*w*vs)*dt;vx+=(w*w*dx-2*w*vx)*dt;vy+=(w*w*dy-2*w*vy)*dt;ls+=vs*dt;fx+=vx*dt;fy+=vy*dt;s=Math.exp(ls);
if(!(Math.abs(lts-ls)>.0008||Math.abs(tx2-fx)>.04||Math.abs(ty2-fy)>.04||Math.abs(vs)>.002||Math.abs(vx)>.04||Math.abs(vy)>.04)){ls=lts;s=ts;fx=tx2;fy=ty2;vs=vx=vy=0}force=0;apply()}}
const st=t=>{if(t.m!=null){const q=MS[t.m];return{h:`<b>${q[0]}</b><small>${q[1]}</small>`,dk:0}}const e=ST[t.i];if(!e)return{h:"",dk:0};const lb={d:"Done",c:"You are here",n:"Upcoming"}[e.s],dtStr=e.ci==2&&e.k==1&&medDate?" · "+medDate.toLocaleDateString("en",{month:"short",day:"numeric"}):"";return e.s=="c"&&!hv?{h:`<b>You are here · Step ${e.k+1}</b><small>${e.t}</small>`,dk:1}:{h:`<b>${e.t}</b><small>Step ${e.k+1} of ${e.n} · ${CT[e.ci]} · ${lb}${dtStr}</small>`,dk:0}};
function tip(){const o=st(hv??{i:sel});jt.innerHTML=o.h;jt.classList.toggle("dk",!!o.dk);jt.classList.add("on");force=1}
function goto(x,y,z){if(z>1){let b=1e9;for(let c=0;c<3;c++){const m=[(K[c][0]+K[c+1][0])/2,(K[c][1]+K[c+1][1])/2],d=Math.hypot(m[0]-x,m[1]-y);if(d<b){b=d;fci=c}}$("zt1").textContent=CT[fci];$("zt1").setAttribute("fill",C[fci]);$("zt2").textContent=sub(fci)+" · "+CHD[fci].tot+" steps"}tx2=x;ty2=y;ts=z;zoom=z>1;force=1;clearTimeout(idle);bd.dataset.zm=zoom?1:0;jl.classList.toggle("zm",zoom);if(zoom)idle=setTimeout(back,6000)}
function back(){sel=cur;tip();goto(F0[0],F0[1],1)}
function pick(i){sel=i;tip();if(ST[i])goto(ST[i].x,ST[i].y,2.7)}
function zch(ci){const a=K[ci],b=K[ci+1],dx=Math.abs(b[0]-a[0]),dy=Math.max(70,Math.abs(b[1]-a[1]));goto((a[0]+b[0])/2,(a[1]+b[1])/2+14,Math.min(3.1,400/dx,196/dy))}

svg.addEventListener("pointerover",e=>{const g=e.target.closest(".st");if(g){hv=g.dataset.m!=null?{m:+g.dataset.m}:{i:+g.dataset.i};tip()}});
svg.addEventListener("pointerout",e=>{if(e.target.closest(".st")){hv=null;tip()}});
svg.addEventListener("click",e=>{
  const g=e.target.closest(".st"),l=e.target.closest(".cl");
  if(l) {
    const ci = +l.dataset.ci;
    zch(ci);
  } else if(g&&g.dataset.m!=null) {
    zch(Math.min(+g.dataset.m,2));
  } else if(g&&g.dataset.i!=null) {
    const idx = +g.dataset.i;
    pick(idx);
    const stepObj = ST[idx];
    if (stepObj && options.onSelectStep) {
      options.onSelectStep(stepObj.ci, stepObj.k);
    }
  } else if(!g&&zoom) back();
});

RV.rvGotoStep = (cIdx, sIdx) => {
  closeD();
  if (options.onSelectStep) {
    options.onSelectStep(cIdx, sIdx);
  } else {
    const i = ST.findIndex(e => e.ci == cIdx && e.k == sIdx);
    if (i >= 0) setTimeout(() => pick(i), 260);
  }
};

onWin("keydown",e=>{if(e.key=="Escape"&&zoom)back()});
onDoc("pointerdown",e=>{if(zoom&&!jl.contains(e.target))back()});
jl.addEventListener("pointermove",()=>{if(zoom){clearTimeout(idle);idle=setTimeout(back,6000)}});
jl.addEventListener("keydown",e=>{if(e.key=="ArrowRight"){e.preventDefault();pick(Math.min(ST.length-1,sel+1))}else if(e.key=="ArrowLeft"){e.preventDefault();pick(Math.max(0,sel-1))}else if(e.key=="Escape")back()});
raf=requestAnimationFrame(frame);if(RM)tip();else{goto(F0[0],F0[1],1);setTimeout(tip,500)}
})();

/* quick notes */
(()=>{
const COLS=["#0d9488","#3b62a0","#6b4f93","#b4405a","#d89a45"],PIN='<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><path d="M9 3h6l-1 6 3 3v2H7v-2l3-3z"/><path d="M12 14v7" stroke-linecap="round"/></svg>',PINO='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M9 3h6l-1 6 3 3v2H7v-2l3-3z"/><path d="M12 14v7" stroke-linecap="round"/></svg>';
const HL={"#0d9488":"#b4e7df","#3b62a0":"#c6dbf7","#6b4f93":"#d9cdf0","#b4405a":"#f7c3cf","#d89a45":"#fbdf9f"};
let N=[],open=null,last=null,tt,q="",cf="";
try{N=(JSON.parse(localStorage.getItem("rv-qn")||"[]")||[]).filter(n=>n&&n.id&&typeof n.t=="string"&&n.t.trim()&&COLS.includes(n.c)&&Number.isFinite(n.ts)).map(n=>({...n,pin:!!n.pin}));const o=localStorage.getItem("rv-qopen");open=o===null?null:o=="1"}catch(e){N=[]}
if(open===null)open=N.length>0;
const save=()=>{try{localStorage.setItem("rv-qn",JSON.stringify(N));localStorage.setItem("rv-qopen",open?"1":"0")}catch(e){}};
const srt=()=>N.slice().sort((a,b)=>(b.pin-a.pin)||(b.ts-a.ts)),$q=s=>root.querySelector(s);
const fmt=ts=>{const d=new Date(ts),t=d.toLocaleTimeString("en",{hour:"numeric",minute:"2-digit"});return d.toDateString()==new Date().toDateString()?"Today · "+t:d.toLocaleDateString("en",{day:"numeric",month:"short"})+" · "+t};
const row=$("srow"),qn=$("qn"),inp=$("qn-inp");
root.insertAdjacentHTML("beforeend",`<div class="qnm" id="qnm" role="dialog" aria-modal="true" aria-labelledby="qnm-t" data-oc="closeNotes()" data-self><div class="qnm-c"><div class="qnm-h"><div class="qnm-tt"><h3 id="qnm-t">Notes</h3><p id="qnm-sub"></p></div><span class="ct" id="qnm-ct" hidden></span><label class="qnm-s"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/></svg><input id="qnm-q" placeholder="Search notes" aria-label="Search notes"></label><button type="button" class="qnm-x" data-oc="closeNotes()" aria-label="Close">✕</button></div><div class="qnm-new" id="qnm-form"><input id="qnm-inp" maxlength="300" placeholder="Take a note…" aria-label="Take a note" autocomplete="off"><button type="button" id="qnm-add">Add</button></div><div class="qnm-ch" id="qnm-ch"></div><div class="qnm-g" id="qnm-g"></div></div></div><div class="qn-toast" id="qn-toast"><span>Note deleted</span><button type="button" id="qn-undo">Undo</button></div>`);
function setOpen(v,focus){open=v;save();paint();if(v&&focus)setTimeout(()=>inp.focus(),520)}
function paint(){const S=srt(),sh=S.slice(0,2);row.classList.toggle("open",open);qn.classList.toggle("open",open);$("qn-tab").setAttribute("aria-expanded",open);$("qn-tab").tabIndex=open?-1:0;
const c=$("qn-cnt");c.hidden=!N.length;c.textContent=N.length;$("qn-n").textContent=N.length||"";
$("qn-rows").innerHTML=sh.length?sh.map(n=>`<div class="qn-r" role="button" tabindex="0" data-id="${n.id}" style="--c:${n.c};--h:${HL[n.c]}"><span><mark>${esc(n.t)}</mark></span><small>${n.pin?`<i class="pn">${PIN}</i>`:""}${esc(fmt(n.ts).split(" · ")[0])}</small><button type="button" class="rx" aria-label="Delete note" title="Delete">×</button></div>`).join(""):'<div class="qn-empty">Quick notes land here.<br>Type above and press Enter.</div>';
const m=$("qn-more");m.textContent=N.length>2?`+${N.length-2} more · View all`:N.length?"Open notes":"";}
function grid(focusId){const g=$("qnm-g"),S=srt().filter(n=>(!q||n.t.toLowerCase().includes(q.toLowerCase()))&&(!cf||n.c==cf)),card=n=>`<div class="qnm-n" data-id="${n.id}" style="--c:${n.c};--h:${HL[n.c]}"><textarea rows="1" maxlength="300" aria-label="Note">${esc(n.t)}</textarea><div class="qnm-f"><button type="button" class="pin${n.pin?" on":""}" aria-label="${n.pin?"Unpin":"Pin"}" title="${n.pin?"Unpin":"Pin"}">${n.pin?PIN:PINO}</button><button type="button" class="qcol" aria-label="Change colour" title="Change colour"><i></i></button><button type="button" class="del" aria-label="Delete" title="Delete"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12"/></svg></button><time>${fmt(n.ts)}</time></div></div>`,P=S.filter(n=>n.pin),O=S.filter(n=>!n.pin);
g.innerHTML=!S.length?`<div class="qnm-e">${q?"No notes match “"+esc(q)+"”.":"No notes yet. Add your first one above."}</div>`:(P.length?`<div class="qnm-lb">Pinned</div>`+P.map(card).join(""):"")+(P.length&&O.length?`<div class="qnm-lb">Others</div>`:"")+O.map(card).join("");
{const pc=N.filter(n=>n.pin).length;$("qnm-sub").textContent=N.length?`${N.length} note${N.length>1?"s":""}${pc?" · "+pc+" pinned":""}`:"Nothing yet";
$("qnm-ch").innerHTML=N.length?`<button type="button" class="ch${cf?"":" on"}" data-c="">All</button>`+COLS.filter(c=>N.some(n=>n.c==c)).map(c=>`<button type="button" class="ch${cf==c?" on":""}" data-c="${c}" style="--c:${c};--h:${HL[c]}"><i></i>${N.filter(n=>n.c==c).length}</button>`).join(""):"";}
g.querySelectorAll("textarea").forEach(t=>{t.style.height="auto";t.style.height=t.scrollHeight+"px"});$("qnm-ct").textContent=N.length||"";
if(focusId){const e=g.querySelector(`[data-id="${focusId}"]`);if(e){e.scrollIntoView({block:"nearest"});e.classList.add("flash");e.querySelector("textarea").focus()}}}
function openNotes(id){const m=$("qnm"),b=(open?$q(".qn-more")||qn:qn).getBoundingClientRect();m.style.setProperty("--dx",(b.left+b.width/2-innerWidth/2)+"px");m.style.setProperty("--dy",(b.top+b.height/2-innerHeight/2)+"px");q="";$("qnm-q").value="";grid(id);m.classList.remove("out");m.classList.add("on");if(!id)setTimeout(()=>$("qnm-inp").focus(),520)}
RV.closeNotes=()=>{const m=$("qnm");if(!m||!m.classList.contains("on"))return;m.classList.add("out");setTimeout(()=>m.classList.remove("on","out"),210)};
function add(t){t=t.trim();if(!t)return null;const n={id:"q"+Date.now().toString(36)+Math.random().toString(36).slice(2,5),t:t.slice(0,300),c:COLS[N.length%COLS.length],ts:Date.now(),pin:false};N.push(n);save();return n}
function del(id){const n=N.find(x=>x.id==id);if(!n)return;N=N.filter(x=>x!==n);last=n;save();paint();if($("qnm").classList.contains("on"))grid();const t=$("qn-toast");t.classList.add("on");clearTimeout(tt);tt=setTimeout(()=>t.classList.remove("on"),5000)}
$("qn-tab").onclick=()=>setOpen(true,true);$("qn-fold").onclick=()=>setOpen(false);
const quick=()=>{if(add(inp.value)){inp.value="";paint()}inp.focus()};
$("qn-send").onclick=quick;
inp.addEventListener("keydown",e=>{if(e.key=="Enter"){e.preventDefault();quick()}else if(e.key=="Escape")inp.blur()});
$("qn-more").onclick=()=>openNotes();
$("qn-rows").addEventListener("click",e=>{const r=e.target.closest(".qn-r");if(!r)return;if(e.target.closest(".rx")){del(r.dataset.id)}else openNotes(r.dataset.id)});
$("qn-rows").addEventListener("keydown",e=>{const r=e.target.closest(".qn-r");if(r&&e.key=="Enter")openNotes(r.dataset.id)});
const full=()=>{const i=$("qnm-inp"),n=add(i.value);if(n){i.value="";q="";$("qnm-q").value="";paint();grid()}i.focus()};
$("qnm-add").onclick=full;$("qnm-inp").addEventListener("keydown",e=>{if(e.key=="Enter"){e.preventDefault();full()}});
$("qnm-q").addEventListener("input",e=>{q=e.target.value.trim();grid()});
const g=$("qnm-g");$("qnm-ch").addEventListener("click",e=>{const b=e.target.closest(".ch");if(!b)return;cf=b.dataset.c;grid()});
g.addEventListener("input",e=>{const t=e.target.closest("textarea");if(!t)return;const n=N.find(x=>x.id==t.closest(".qnm-n").dataset.id);if(!n)return;n.t=t.value.slice(0,300);t.style.height="auto";t.style.height=t.scrollHeight+"px";save();paint()});
g.addEventListener("focusout",e=>{const t=e.target.closest("textarea");if(!t)return;const n=N.find(x=>x.id==t.closest(".qnm-n").dataset.id);if(n&&!t.value.trim())del(n.id)});
g.addEventListener("click",e=>{const c=e.target.closest(".qnm-n");if(!c)return;const n=N.find(x=>x.id==c.dataset.id);if(!n)return;
if(e.target.closest(".pin")){n.pin=!n.pin;save();paint();grid(n.id)}else if(e.target.closest(".qcol")){n.c=COLS[(COLS.indexOf(n.c)+1)%COLS.length];c.style.setProperty("--c",n.c);save();paint()}else if(e.target.closest(".del")){del(n.id)}});
$("qn-undo").onclick=()=>{if(!last)return;N.push(last);last=null;save();paint();if($("qnm").classList.contains("on"))grid();$("qn-toast").classList.remove("on")};
onDoc("keydown",e=>{if(e.key=="Escape")RV.closeNotes()});
paint();
})();

/* layout customizer */
(()=>{
const FR=$("fr"),RC=root.querySelector(".rc"),MID=root.querySelector(".mid"),LS="rahvana-layout-v2";
if (!RC || !MID) return;
const SRW=$("srow"),TB=RC.querySelector(":scope>.tb");MID.id="wMid";TB.id="wTb";MID.children[0].id="wTrk";MID.children[1].id="wCal";
const H={srow:"208px",wMid:"1fr",wTb:"112px"},ROWS=["srow","wMid","wTb"],COLS=["wTrk","wCal"],ALL=[["srow","Case strength"],["wTrk","Case tracking"],["wCal","Calendar"],["wTb","Tools & shortcuts"]],U=["srow","wTb","wTrk","wCal"].map(id=>$(id)).filter(Boolean);
const FD=[...TB.querySelectorAll(":scope>.fd")],QA=$("qa"),nm=e=>(e.querySelector("b")||e).textContent.trim();
const DEF={d:FD.map(nm),q:[...QA.children].map(nm)};
let hid=new Set();const lop=$("lop"),lyb=$("lyb");
lyb.onclick=e=>{e.stopPropagation();const o=lop.classList.toggle("on");lyb.setAttribute("aria-expanded",o)};
onDoc("pointerdown",e=>{if(lop.classList.contains("on")&&!e.target.closest(".lyw")){lop.classList.remove("on");lyb.setAttribute("aria-expanded","false")}});
onWin("keydown",e=>{if(e.key=="Escape"&&lop.classList.contains("on")){lop.classList.remove("on");lyb.focus()}});
function rows(){RC.style.gridTemplateRows=[...RC.children].filter(c=>!c.classList.contains("wh")).map(c=>H[c.id]||"auto").join(" ")}
function vis(){ALL.forEach(([id])=>{const e=$(id);if(e)e.classList.toggle("wh",hid.has(id))});const vc=COLS.filter(id=>!hid.has(id)).length;MID.style.gridTemplateColumns=vc==1?"1fr":"";rows();
const sw=$("lys");sw.innerHTML=ALL.map(([id,t])=>{const on=!hid.has(id),last=COLS.includes(id)&&on&&vc==1;return`<button type="button" role="switch" aria-checked="${on}" data-id="${id}" ${last?"disabled title=\"Keep at least one of tracking or calendar\"":""}>${t}<i></i></button>`}).join("");
sw.querySelectorAll("button").forEach(b=>b.onclick=()=>{const id=b.dataset.id;hid.has(id)?hid.delete(id):hid.add(id);vis();save();const e=$(id);if(e&&!hid.has(id))flash(e)})}
const order=(arr,parent,ref)=>arr.forEach(n=>{const e=[...parent.children].find(c=>nm(c)==n&&!c.classList.contains("gh"));if(e)parent.insertBefore(e,ref||null)});
function save(){try{localStorage.setItem(LS,JSON.stringify({r:[...RC.children].map(c=>c.id),m:[...MID.children].map(c=>c.id),h:[...hid],d:[...TB.querySelectorAll(":scope>.fd")].map(nm),q:[...QA.children].map(nm)}))}catch(x){}}
function apply(o){if(!o)return;try{o.r.forEach(id=>{const e=$(id);if(e&&ROWS.includes(id))RC.appendChild(e)});o.m.forEach(id=>{const e=$(id);if(e&&COLS.includes(id))MID.appendChild(e)});hid=new Set((o.h||[]).filter(id=>ALL.some(a=>a[0]==id)));if(hid.has("wTrk")&&hid.has("wCal"))hid.delete("wCal");order(o.d||[],TB,QA);order(o.q||[],QA)}catch(x){}}
try{apply(JSON.parse(localStorage.getItem(LS)))}catch(x){}
const flash=e=>{e.classList.remove("lay-in");void e.offsetWidth;e.classList.add("lay-in")};
function moveRow(d,t,after){if(d===t)return;RC.insertBefore(d,after?t.nextSibling:t);rows();save();flash(d)}
function swapMid(d,t){if(d===t)return;MID.insertBefore(d,d.nextElementSibling===t?t.nextSibling:t);save();flash(d);flash(t)}
const isRow=e=>ROWS.includes(e.id),isCol=e=>COLS.includes(e.id);
let drag=null,item=null;const clr=()=>root.querySelectorAll(".dz,.dzb,.dza,.dragging,.ib,.ia").forEach(e=>e.classList.remove("dz","dzb","dza","dragging","ib","ia"));
U.forEach(u=>{u.classList.add("u");const g=document.createElement("button");g.type="button";g.className="gh";g.innerHTML="<i></i>";g.setAttribute("aria-label",isCol(u)?"Move widget. Arrow left or right swaps it.":"Move widget. Arrow up or down moves it.");u.prepend(g);
g.onmousedown=()=>{u.draggable=true};g.onmouseup=()=>{u.draggable=false};
g.onkeydown=e=>{const k=e.key;if(isCol(u)&&(k=="ArrowLeft"||k=="ArrowRight")){e.preventDefault();const o=[...MID.children].find(c=>c!==u);if(o){swapMid(u,o);g.focus()}}
else if(isRow(u)&&(k=="ArrowUp"||k=="ArrowDown")){e.preventDefault();let t=k=="ArrowUp"?u.previousElementSibling:u.nextElementSibling;while(t&&t.classList.contains("wh"))t=k=="ArrowUp"?t.previousElementSibling:t.nextElementSibling;if(t&&ROWS.includes(t.id)){moveRow(u,t,k=="ArrowDown");g.focus()}}};
u.addEventListener("dragstart",e=>{if(e.target!==u)return;if(!FR.classList.contains("arr")){e.preventDefault();return}drag=u;e.dataTransfer.effectAllowed="move";try{e.dataTransfer.setData("text/plain",u.id)}catch(x){}setTimeout(()=>u.classList.add("dragging"))});
u.addEventListener("dragend",e=>{if(e.target!==u)return;u.draggable=false;drag=null;clr()})});
function tgt(t){if(!t)return;t.addEventListener("dragover",e=>{if(!drag||drag===t)return;const ok=isRow(drag)&&isRow(t)||isCol(drag)&&isCol(t);if(!ok)return;e.preventDefault();e.stopPropagation();clr();drag.classList.add("dragging");if(isRow(t)){const r=t.getBoundingClientRect();t.classList.add(e.clientY<r.top+r.height/2?"dzb":"dza")}else t.classList.add("dz")});
t.addEventListener("dragleave",e=>{if(!t.contains(e.relatedTarget))t.classList.remove("dz","dzb","dza")});
t.addEventListener("drop",e=>{if(!drag||drag===t)return;const ok=isRow(drag)&&isRow(t)||isCol(drag)&&isCol(t);if(!ok)return;e.preventDefault();e.stopPropagation();if(isRow(t)){const r=t.getBoundingClientRect();moveRow(drag,t,e.clientY>=r.top+r.height/2)}else swapMid(drag,t);clr()})}
[SRW,MID,TB,$("wTrk"),$("wCal")].filter(Boolean).forEach(tgt);

const grp=e=>e.classList.contains("fd")?"fd":"qi";
function items(){return[...TB.querySelectorAll(":scope>.fd"),...QA.children]}
items().forEach(it=>{it.addEventListener("dragstart",e=>{if(!FR.classList.contains("arr")){return}e.stopPropagation();item=it;e.dataTransfer.effectAllowed="move";try{e.dataTransfer.setData("text/plain",nm(it))}catch(x){}setTimeout(()=>it.classList.add("dragging"))});
it.addEventListener("dragend",e=>{e.stopPropagation();item=null;clr()});
it.addEventListener("dragover",e=>{if(!item||item===it||grp(item)!=grp(it))return;e.preventDefault();e.stopPropagation();clr();item.classList.add("dragging");const r=it.getBoundingClientRect();it.classList.add(e.clientX<r.left+r.width/2?"ib":"ia")});
it.addEventListener("dragleave",()=>it.classList.remove("ib","ia"));
it.addEventListener("drop",e=>{if(!item||item===it||grp(item)!=grp(it))return;e.preventDefault();e.stopPropagation();const r=it.getBoundingClientRect(),aft=e.clientX>=r.left+r.width/2;it.parentElement.insertBefore(item,aft?it.nextSibling:it);flash(item);save();clr()})});
function mode(on){FR.classList.toggle("arr",on);$("lyd").hidden=!on;$("arb").textContent=on?"Done":"Arrange";lop.classList.remove("on");lyb.setAttribute("aria-expanded","false");U.forEach(u=>u.draggable=false);items().forEach(it=>it.draggable=on)}
FR.addEventListener("click",e=>{if(FR.classList.contains("arr")&&!e.target.closest(".lyw,.gh")){e.preventDefault();e.stopPropagation()}},true);
$("arb").onclick=()=>mode(!FR.classList.contains("arr"));$("lyd").onclick=()=>mode(false);
$("rsb").onclick=()=>{ROWS.forEach(id=>{const e=$(id);if(e)RC.appendChild(e)});COLS.forEach(id=>{const e=$(id);if(e)MID.appendChild(e)});hid=new Set();order(DEF.d,TB,QA);order(DEF.q,QA);vis();try{localStorage.removeItem(LS)}catch(x){}[SRW,MID,TB].filter(Boolean).forEach(flash);lop.classList.remove("on")};
vis();
})();

/* ---- delegated handlers ---- */
const ACT: Record<string, (...a: any[]) => void> = {
  openAlerts, fix, closeD, closeCm, openCm, aeOpen, aeClose, goEv, goMonth, setTr, setFace, mv, goToday, alTog, delEv,
  openCaseStrength: () => {
    if (options.onOpenCaseStrength) options.onOpenCaseStrength();
    else if (options.onOpenCaseHealth) options.onOpenCaseHealth();
    else openAlerts();
  },
  goToChapter: (idx: number) => {
    if (options.onSelectChapter) options.onSelectChapter(idx);
  },
  rvGotoStep: (cIdx: number, sIdx: number) => {
    closeD();
    if (options.onSelectStep) options.onSelectStep(cIdx, sIdx);
    else if (options.onSelectChapter) options.onSelectChapter(cIdx);
  },
  openRequests: () => {
    if (options.onOpenRequests) options.onOpenRequests();
    else window.location.href = '/document-translation/my-requests';
  },
  openFavorites: () => {
    if (options.onOpenFavorites) options.onOpenFavorites();
  },
  openVault: () => {
    if (options.onOpenVault) options.onOpenVault();
    else if (options.onLaunchTool) options.onLaunchTool('document_vault');
  },
  openWallet: () => {
    if (options.onOpenWallet) options.onOpenWallet();
    else window.location.href = '/portal-wallet';
  },
  openTools: () => {
    if (options.onOpenTools) options.onOpenTools();
    else window.location.href = '/tools';
  },
  openGuides: () => {
    if (options.onOpenGuides) options.onOpenGuides();
    else window.location.href = '/guides/my-guides';
  },
  openServices: () => {
    if (options.onOpenServices) options.onOpenServices();
    else window.location.href = '/services';
  },
  closeNotes: (...a) => RV.closeNotes(...a),
};

const run = (call: string) => {
  const m = /^(\w+)\((.*)\)$/.exec(call);
  if (!m || !ACT[m[1]]) return;
  const args = m[2].trim() ? m[2].split(",").map((a) => { a = a.trim().replace(/^'|'$/g, ""); return /^-?\d+$/.test(a) ? Number(a) : a; }) : [];
  ACT[m[1]](...args);
};

const onClick = (e: MouseEvent) => {
  const t = (e.target as Element).closest("[data-oc]") as HTMLElement | null;
  if (!t || !root.contains(t)) return;
  if (t.hasAttribute("data-self") && e.target !== t) return;
  run(t.dataset.oc!);
};

const onKey = (e: KeyboardEvent) => {
  if (e.key !== "Enter") return;
  const t = (e.target as Element).closest("[data-ok]") as HTMLElement | null;
  if (t && root.contains(t)) run(t.dataset.ok!);
};

root.addEventListener("click", onClick);
root.addEventListener("keydown", onKey);

return () => {
  dead = true;
  cancelAnimationFrame(raf);
  timers.forEach((id) => window.clearTimeout(id));
  timers.clear();
  unsub.forEach((f) => f());
  root.removeEventListener("click", onClick);
  root.removeEventListener("keydown", onKey);
  root.classList.remove("o");
};
}
