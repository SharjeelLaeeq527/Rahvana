import React from "react";
import { Caveat } from "next/font/google";

const caveat = Caveat({
  subsets: ["latin"],
  weight: ["400", "700"],
});

// ----------------------------------------------------------------------------
// "The Lighthouse" background for the "Where do I even start?" section.
// The applicant is a small paper boat lost in a foggy sea; the teal-striped
// lighthouse (Rahvana's brand color) sweeps its light through the fog toward
// the question. Pure CSS/SVG, no external assets, reduced-motion safe.
// The scene bleeds to full viewport width and fades into the page background
// at its top and bottom edges so the light theme stays continuous.
// ----------------------------------------------------------------------------

const LIGHTHOUSE_CSS = `
@keyframes lh-sweep {
  from { transform: rotate(-7deg); }
  to   { transform: rotate(9deg); }
}
@keyframes lh-fog-drift {
  from { transform: translateX(-40px); }
  to   { transform: translateX(40px); }
}
@keyframes lh-boat-bob {
  from { transform: rotate(-3deg) translateY(0); }
  to   { transform: rotate(3deg) translateY(-6px); }
}
.lh-beam {
  transform-box: view-box;
  transform-origin: 1226px 375px;
}
.lh-boat-inner {
  transform-box: fill-box;
  transform-origin: 50% 100%;
}
@media (prefers-reduced-motion: no-preference) {
  .lh-beam { animation: lh-sweep 9s ease-in-out infinite alternate; }
  .lh-fog { animation: lh-fog-drift var(--lh-dur, 18s) ease-in-out var(--lh-delay, 0s) infinite alternate; }
  .lh-boat-inner { animation: lh-boat-bob 4.5s ease-in-out infinite alternate; }
}
`;

export default function LighthouseBackground() {
  return (
    <div
      className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-screen overflow-hidden pointer-events-none select-none"
      aria-hidden="true"
    >
      <style dangerouslySetInnerHTML={{ __html: LIGHTHOUSE_CSS }} />

      {/* misty sky */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, #eef4fb 0%, #e7eff8 48%, #dcebf4 68%, #cfe2ef 100%)",
        }}
      />

      {/* sea, rocks, lighthouse, beam, boat */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 1440 620"
        preserveAspectRatio="xMidYMax slice"
        fill="none"
      >
        <defs>
          <linearGradient id="lh-beam-grad" x1="380" y1="375" x2="1226" y2="375" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#ffd682" stopOpacity="0" />
            <stop offset="0.75" stopColor="#ffd682" stopOpacity="0.3" />
            <stop offset="1" stopColor="#ffd682" stopOpacity="0.5" />
          </linearGradient>
          <filter id="lh-blur">
            <feGaussianBlur stdDeviation="7" />
          </filter>
        </defs>

        {/* sea */}
        <path
          fill="#bcd7e8"
          opacity="0.8"
          d="M0 620 V486 Q120 470 240 484 T480 482 T720 486 T960 480 T1200 486 T1440 478 V620 Z"
        />
        <path
          fill="#a8cade"
          opacity="0.7"
          d="M0 620 V520 Q180 504 360 518 T720 516 T1080 520 T1440 512 V620 Z"
        />

        {/* the sweeping light */}
        <g className="lh-beam">
          <path
            d="M 1226 368 L 380 258 L 380 482 L 1226 382 Z"
            fill="url(#lh-beam-grad)"
            filter="url(#lh-blur)"
          />
        </g>

        {/* rocks under the lighthouse */}
        <path fill="#7d99ad" opacity="0.75" d="M1120 620 L1156 540 L1210 560 L1252 528 L1300 556 L1330 620 Z" />

        {/* lighthouse (brand teal stripes) */}
        <g>
          <path d="M1196 540 L1206 400 L1246 400 L1256 540 Z" fill="#f6fafc" />
          <path d="M1201 500 L1251 500 L1253 528 L1199 528 Z" fill="#0d7377" opacity="0.85" />
          <path d="M1204 444 L1248 444 L1250 470 L1202 470 Z" fill="#0d7377" opacity="0.85" />
          <rect x="1206" y="382" width="40" height="18" rx="3" fill="#1e3a45" />
          <rect x="1212" y="366" width="28" height="18" rx="2" fill="#ffd982" />
          <path d="M1210 366 L1226 350 L1242 366 Z" fill="#1e3a45" />
          <line x1="1200" y1="400" x2="1252" y2="400" stroke="#1e3a45" strokeWidth="3" />
        </g>
        {/* lantern glow */}
        <circle cx="1226" cy="375" r="34" fill="#ffd982" opacity="0.35" />
        <circle cx="1226" cy="375" r="14" fill="#ffe7b0" opacity="0.8" />

        {/* the little paper boat (the applicant) */}
        <g transform="translate(300 505)">
          <g className="lh-boat-inner">
            <path d="M-34 0 L34 0 L20 16 L-20 16 Z" fill="#ffffff" stroke="#c9d8e4" strokeWidth="1.5" />
            <path d="M0 -30 L0 0 L-22 0 Z" fill="#eef4f9" stroke="#c9d8e4" strokeWidth="1.5" />
            <path d="M0 -30 L0 0 L16 0 Z" fill="#ffffff" stroke="#c9d8e4" strokeWidth="1.5" />
          </g>
        </g>
      </svg>

      {/* drifting fog */}
      <div
        className="lh-fog absolute rounded-full"
        style={{ top: "38%", left: "6%", width: 340, height: 70, filter: "blur(18px)", background: "rgba(255,255,255,0.55)", ["--lh-dur" as string]: "18s", ["--lh-delay" as string]: "0s" }}
      />
      <div
        className="lh-fog absolute rounded-full"
        style={{ top: "56%", left: "24%", width: 420, height: 80, filter: "blur(18px)", background: "rgba(255,255,255,0.55)", ["--lh-dur" as string]: "22s", ["--lh-delay" as string]: "2s" }}
      />
      <div
        className="lh-fog absolute rounded-full"
        style={{ top: "30%", right: "30%", width: 300, height: 60, filter: "blur(18px)", background: "rgba(255,255,255,0.55)", ["--lh-dur" as string]: "16s", ["--lh-delay" as string]: "1s" }}
      />

      {/* soft white halo so the heading stays perfectly readable */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{
          width: 780,
          maxWidth: "96vw",
          height: 380,
          background:
            "radial-gradient(closest-side, rgba(255,255,255,0.75), rgba(255,255,255,0))",
        }}
      />

      {/* handwritten asides, same voice as the rest of the page */}
      <div
        className={`${caveat.className} hidden md:block absolute left-[16%] top-[22%] -rotate-6 text-slate-400 text-xl font-medium`}
      >
        lost at sea...
      </div>
      <div
        className={`${caveat.className} hidden md:block absolute right-[9%] top-[30%] rotate-6 text-xl font-medium`}
        style={{ color: "#b58a3a" }}
      >
        ...found by the light
      </div>

      {/* fade into the page background above and below */}
      <div
        className="absolute inset-x-0 top-0 h-14"
        style={{ background: "linear-gradient(to bottom, #fbfcfd, rgba(251,252,253,0))" }}
      />
      <div
        className="absolute inset-x-0 bottom-0 h-20"
        style={{ background: "linear-gradient(to top, #fbfcfd, rgba(251,252,253,0))" }}
      />
    </div>
  );
}
