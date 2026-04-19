import React, { useEffect, useRef, useState } from "react";
const heroBg = "/assets/images/heroimage.png";
const eiffelBg = "/assets/images/heroimage.png";
import Link from "next/link";
import { useAuth } from "@/app/context/AuthContext";
import { useLanguage } from "@/app/context/LanguageContext";

// ...existing code...

export function CinematicHeroHtmlStyle() {
  // Auth/journey state (must be inside component)
  const { user } = useAuth();
  const { t } = useLanguage();
  const [journeys, setJourneys] = useState<null | any[]>(null);
  const [journeysLoading, setJourneysLoading] = useState(false);
  
  useEffect(() => {
    let ignore = false;
    if (!user) {
      setJourneys(null);
      return;
    }
    setJourneysLoading(true);
    fetch("/api/journeys")
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to fetch journeys");
        const data = await res.json();
        if (!ignore) setJourneys(Array.isArray(data.data) ? data.data : []);
      })
      .catch(() => {
        if (!ignore) setJourneys([]);
      })
      .finally(() => {
        if (!ignore) setJourneysLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [user]);

  const [panel, setPanel] = useState(0);
  const [animating, setAnimating] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number>(0);

  // Animate in text on mount
  useEffect(() => {
    setTimeout(() => document.getElementById("h1")?.classList.add("in"), 100);
    setTimeout(() => document.getElementById("s1")?.classList.add("in"), 250);
    setTimeout(() => document.getElementById("sc")?.classList.add("in"), 400);
  }, []);

  // Scroll, touch, and keyboard navigation
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (animating) return;
      if (e.deltaY > 30 && panel === 0) goTo(1);
      else if (e.deltaY < -30 && panel === 1) goTo(0);
    };
    const handleTouchStart = (e: TouchEvent) => {
      touchStartY.current = e.touches[0].clientY;
    };
    const handleTouchEnd = (e: TouchEvent) => {
      const diff = touchStartY.current - e.changedTouches[0].clientY;
      if (diff > 40 && panel === 0) goTo(1);
      else if (diff < -40 && panel === 1) goTo(0);
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "PageDown") goTo(1);
      if (e.key === "ArrowUp" || e.key === "PageUp") goTo(0);
    };
    const stage = stageRef.current;
    stage?.addEventListener("wheel", handleWheel, { passive: true });
    stage?.addEventListener("touchstart", handleTouchStart, { passive: true });
    stage?.addEventListener("touchend", handleTouchEnd, { passive: true });
    document.addEventListener("keydown", handleKey);
    return () => {
      stage?.removeEventListener("wheel", handleWheel);
      stage?.removeEventListener("touchstart", handleTouchStart);
      stage?.removeEventListener("touchend", handleTouchEnd);
      document.removeEventListener("keydown", handleKey);
    };
    // eslint-disable-next-line
  }, [panel, animating]);

  function goTo(idx: number) {
    if (animating || idx === panel) return;
    setAnimating(true);
    setPanel(idx);
    // Dispatch event so SiteHeader knows which hero panel is active
    window.dispatchEvent(
      new CustomEvent("home-hero-transition", { detail: { transitioned: idx === 1 } })
    );
    setTimeout(() => setAnimating(false), 1100);
  }

  return (
    <div
      className="w-full min-h-screen h-screen flex flex-col justify-center items-center bg-cover bg-center"
      style={{ backgroundImage: 'url(/assets/images/heroimage.png)' }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Inter:wght@300;400;500&display=swap');
        * { box-sizing: border-box; }
        .stage { width: 100%; height: 600px; position: relative; overflow: hidden; cursor: default; font-family: 'Inter', sans-serif; background: #0D1B2A; margin-top: 0 !important; padding-top: 0 !important; }
        .panel { position: absolute; inset: 0; width: 100%; height: 100%; transition: opacity 0.7s cubic-bezier(0.83,0,0.17,1), transform 0.7s cubic-bezier(0.83,0,0.17,1); }
        #p1 { z-index: 2; background-image: url('${eiffelBg}'); background-size: cover; background-position: center; transition: transform 0.7s cubic-bezier(0.83,0,0.17,1), opacity 0.7s cubic-bezier(0.83,0,0.17,1), clip-path 0.7s cubic-bezier(0.83,0,0.17,1); clip-path: ${panel === 1 ? "polygon(0 0, 100% 0, 100% 0%, 0 0%)" : "polygon(0 0, 100% 0, 100% 100%, 0 100%)"}; opacity: ${panel === 1 ? 0 : 1}; pointer-events: ${panel === 1 ? "none" : "auto"}; }
        #p2 { pointer-events: ${panel === 0 ? "none" : "auto"}; }
        .p1-photo { position: absolute; inset: 0; background-image: url('${heroBg}'); background-size: cover; background-position: center; transition: transform 1.4s cubic-bezier(0.25,0.46,0.45,0.94); }
        #p1:hover .p1-photo { transform: scale(1.03); }
        .p1-photo:hover { transform: scale(1.03); }
        .p1-veil { position: absolute; inset: 0; background: linear-gradient(135deg, rgba(13,27,42,0.78) 0%, rgba(13,27,42,0.45) 50%, rgba(13,27,42,0.15) 100%); }
        .p1-content { position: absolute; inset: 0; display: flex; flex-direction: column; justify-content: center; padding: 0 6% 5% 7%; margin-top: 90px; }
        .eyebrow-row { display: flex; align-items: center; gap: 12px; margin-bottom: 28px; opacity: 0; transform: translateY(18px); transition: opacity 0.7s ease 0.1s, transform 0.7s ease 0.1s; }
        .eyebrow-row.in { opacity: 1; transform: translateY(0); }
        .e-line { width: 32px; height: 1px; background: #7ECEC4; }
        .e-text { font-size: 11px; font-weight: 500; letter-spacing: 0.16em; text-transform: uppercase; color: #7ECEC4; }
        .p1-h1 { font-family: 'Cormorant Garamond', serif; font-size: clamp(38px, 6vw, 68px); font-weight: 300; line-height: 1.08; color: #fff; letter-spacing: -0.02em; margin-bottom: 22px; opacity: 0; transform: translateY(22px); transition: opacity 0.8s ease 0.25s, transform 0.8s ease 0.25s; }
        .p1-h1.in { opacity: 1; transform: translateY(0); }
        .p1-h1 em { font-style: italic; color: #6ba59f; }
        .p1-sub { font-size: 15px; font-weight: 300; line-height: 1.72; color: rgba(255,255,255,0.68); max-width: 420px; margin-bottom: 40px; opacity: 0; transform: translateY(18px); transition: opacity 0.8s ease 0.4s, transform 0.8s ease 0.4s; }
        .p1-sub.in { opacity: 1; transform: translateY(0); }
        .scroll-cta { display: flex; align-items: center; gap: 14px; cursor: pointer; opacity: 0; transform: translateY(14px); transition: opacity 0.8s ease 0.55s, transform 0.8s ease 0.55s; }
        .scroll-cta.in { opacity: 1; transform: translateY(0); }
        .scroll-ring { width: 44px; height: 44px; border-radius: 50%; border: 1px solid rgba(255,255,255,0.4); display: flex; align-items: center; justify-content: center; transition: border-color 0.3s, transform 0.3s; animation: pulse-ring 2.5s ease-in-out infinite; }
        .scroll-cta:hover .scroll-ring { border-color: #7ECEC4; transform: scale(1.1); }
        @keyframes pulse-ring { 0%,100% { box-shadow: 0 0 0 0 rgba(126,206,196,0.4); } 50% { box-shadow: 0 0 0 8px rgba(126,206,196,0); } }
        .scroll-label { font-size: 12px; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase; color: rgba(255,255,255,0.55); transition: color 0.3s; }
        .scroll-cta:hover .scroll-label { color: #7ECEC4; }
        .chevron-down { width: 16px; height: 16px; animation: bounce 1.8s ease-in-out infinite; }
        @keyframes bounce { 0%,100% { transform: translateY(0); } 50% { transform: translateY(4px); } }
        #p2 { z-index: 1; background: #F2EDE8; display: grid; grid-template-columns: 1.2fr 1.8fr; }
        .p2-left { display: flex; flex-direction: column; justify-content: center; padding: 0 7% 0 11%; z-index: 2; }
        .p2-right { position: relative; overflow: hidden; }
        .p2-img { position: absolute; inset: 0; background-color: #0D1B2A; background-image: url('${heroBg}'); background-size: cover; background-position: right center; clip-path: path('M 0 0 Q 8% 50% 0 100% L 100% 100% L 100% 0 Z'); transition: transform 0.8s ease; box-shadow: -24px 0 48px -16px rgba(13,27,42,0.10); }
        .p2-img:hover { transform: scale(1.03); }
        .p2-veil { position: absolute; inset: 0; background: linear-gradient(135deg, rgba(13,27,42,0.78) 0%, rgba(13,27,42,0.45) 50%, rgba(13,27,42,0.15) 100%); z-index: 2; pointer-events: none; }
        .p2-img-fade { position: absolute; inset: 0; background: linear-gradient(90deg, #F2EDE8 0%, rgba(242,237,232,0.92) 10%, rgba(242,237,232,0.7) 22%, rgba(242,237,232,0.3) 38%, transparent 65%); z-index: 3; pointer-events: none; }
        .p2-accent { width: 40px; height: 2px; background: #6B5B7B; margin-bottom: 20px; }
        .p2-eyebrow { font-size: 11px; font-weight: 500; letter-spacing: 0.16em; text-transform: uppercase; color: #6B5B7B; margin-bottom: 18px; }
        .p2-h2 { font-family: 'Cormorant Garamond', serif; font-size: clamp(32px, 4.5vw, 56px); font-weight: 300; line-height: 1.1; color: #1A2530; letter-spacing: -0.02em; margin-bottom: 20px; }
        .p2-h2 em { font-style: italic; color: #6B5B7B; }
        .p2-sub { font-size: 14.5px; font-weight: 300; line-height: 1.74; color: #4A5568; max-width: 380px; margin-bottom: 36px; }
        .btn-row { display: flex; flex-wrap: wrap; gap: 12px; }
        .btn-dark { display: inline-flex; align-items: center; gap: 9px; padding: 13px 22px; background: #2a4549; color: #fff; font-family: 'Inter', sans-serif; font-size: 12.5px; font-weight: 500; letter-spacing: 0.05em; border: none; border-radius: 3px; cursor: pointer; transition: background 0.25s, transform 0.15s; white-space: nowrap; }
        .btn-dark:hover { background: #2a3d52; }
        .btn-dark:active { transform: scale(0.98); }
        .btn-ghost { display: inline-flex; align-items: center; gap: 9px; padding: 12px 20px; background: transparent; color: #1A2530; font-family: 'Inter', sans-serif; font-size: 12.5px; font-weight: 500; letter-spacing: 0.05em; border: 1px solid rgba(26,37,48,0.3); border-radius: 3px; cursor: pointer; transition: border-color 0.25s, background 0.25s, transform 0.15s; white-space: nowrap; }
        .btn-ghost:hover { border-color: rgba(26,37,48,0.7); background: rgba(26,37,48,0.05); }
        .btn-ghost:active { transform: scale(0.98); }
        .btn-arrow { width:14px; height:14px; flex-shrink:0; }
        .back-hint { position: absolute; bottom: 28px; left: 50%; transform: translateX(-50%); display: flex; align-items: center; gap: 8px; cursor: pointer; z-index: 10; opacity: ${panel === 1 ? 1 : 0}; transition: opacity 0.5s ease 0.8s; }
        .back-hint span { font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; color: rgba(26,37,48,0.4); font-weight: 500; }
        .back-hint:hover span { color: #6B5B7B; }
        /* Nav-dots (navbar) in p1 is now transparent */
        .nav-dots { position: absolute; right: 28px; top: 50%; transform: translateY(-50%); display: flex; flex-direction: column; gap: 10px; z-index: 20; background: transparent !important; padding: 0; }
        .dot { width: 6px; height: 6px; border-radius: 50%; background: rgba(255,255,255,0.35); cursor: pointer; transition: background 0.3s, transform 0.3s; }
        .dot.active { background: #7ECEC4; transform: scale(1.4); }
        .dot.dark { background: rgba(26,37,48,0.25); }
        .dot.dark.active { background: #6B5B7B; }
      `}</style>
      <div className="stage" ref={stageRef}>
        {/* Nav dots for panel navigation */}
        <div className="nav-dots">
          <div className={`dot${panel === 0 ? " active" : ""}${panel === 1 ? " dark" : ""}`} onClick={() => goTo(0)} />
          <div className={`dot${panel === 1 ? " active dark" : ""}`} onClick={() => goTo(1)} />
        </div>
        {/* PANEL 1 */}
        <div className="panel" id="p1">
          <div className="p1-photo" />
          <div className="p1-veil" />
          <div className="p1-content">
            {/* Eyebrow removed as requested */}
            <h1 className="p1-h1" id="h1">
              Your IR-1<br />Journey, <em>Simplified</em>
            </h1>
            <p className="p1-sub" id="s1">
              Bespoke residency advisory. We handle the intricacies of your international relocation with absolute discretion and precision.
            </p>
            <div className="scroll-cta" id="sc" onClick={() => goTo(1)}>
              <div className="scroll-ring">
                <svg className="chevron-down" viewBox="0 0 16 16" fill="none">
                  <path d="M4 6l4 4 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <span className="scroll-label">Discover your path</span>
            </div>
          </div>
        </div>
        {/* PANEL 2 (REPLACED WITH HTML REFERENCE) */}
        <div className="panel" id="p2" style={{ zIndex: 1 }}>
          <div className="p2-left">
            <div className="p2-accent" />
            <p className="p2-eyebrow">Your next chapter</p>
            <h2 className="p2-h2">Where could your<br />life go <em>next?</em></h2>
            <p className="p2-sub">Rahvana turns the visa process into a clear, confident journey — with tools and support designed around you.</p>
            <div className="btn-row">
              {/* Robust CTA logic, now using Next.js Link and translation for resume journey */}
              {(!user || journeysLoading) && (
                <Link href="/visa-category/ir-category/ir1-journey" className="btn-dark">
                  Start your journey
                  <svg className="btn-arrow" viewBox="0 0 14 14" fill="none">
                    <path d="M1 7h12M8 3l5 4-5 4" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
              )}
              {user && journeys && journeys.length > 0 && (
                <Link href="/user-dashboard" className="btn-ghost">
                  {t("homePage.resumeJourney") || "Resume my journey"}
                  <svg className="btn-arrow" viewBox="0 0 14 14" fill="none">
                    <circle cx="7" cy="7" r="5.5" stroke="#1A2530" strokeWidth="1.2" />
                    <path d="M5.5 5v4l4-2z" fill="#1A2530" />
                  </svg>
                </Link>
              )}
              {user && journeys && journeys.length === 0 && !journeysLoading && (
                <Link href="/visa-category/ir-category/ir1-journey" className="btn-dark">
                  Start my journey
                  <svg className="btn-arrow" viewBox="0 0 14 14" fill="none">
                    <path d="M1 7h12M8 3l5 4-5 4" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
              )}
            </div>
          </div>
          <div className="p2-right">
            <div className="p2-img" />
            <div className="p2-veil" />
            <div className="p2-img-fade" />
          </div>
        </div>
      </div>
    </div>
  );
}