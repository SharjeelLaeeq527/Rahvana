"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { useCandidate } from "@/app/context/CandidateContext";
import { useWizard } from "@/app/(main)/dashboard/hooks/useWizard";
import { Loader } from "@/components/ui/spinner";
import RahvanaDashboard from "@/app/(main)/Jdashboard/RahvanaDashboard";
import { ChapterView as ChapterViewSpouse } from "@/app/components/journey-spouse/ChapterView";
import { ChapterView as ChapterViewEngine } from "@/app/components/journey-engine/ChapterView";
import { StepView as StepViewSpouse } from "@/app/components/journey-spouse/StepView";
import { StepView as StepViewEngine } from "@/app/components/journey-engine/StepView";
import { CSADrawer } from "@/app/components/journey-spouse/components/CSADrawer";
import { fetchReceiptForJourney, type ReceiptRecord } from "@/app/components/home-page/Visatickerprops";
import { getJourneyHrefByType, ir1journeyHref } from "@/lib/constants/routes";
import { ArrowLeft, ExternalLink, Layers } from "lucide-react";

// Static JSON imports for supported visa categories
import ir1Data from "@/data/visa-category/ir-1.json";
import ir5Data from "@/data/visa-category/ir-5.json";
import f1Data from "@/data/visa-category/f-1.json";
import ir2Data from "@/data/visa-category/ir-2.json";
import germanyData from "@/data/visa-category/germany-student-journey.json";

// ── Helpers ─────────────────────────────────────────────────────────────────

function resolveRoadmapData(category?: string | null): any {
  if (!category) return ir1Data;
  const norm = String(category).toLowerCase().replace(/[^a-z0-9]/g, "");
  if (norm.startsWith("ir5")) return ir5Data;
  if (norm.startsWith("ir1") || norm.startsWith("cr1")) return ir1Data;
  if (norm.startsWith("ir2") || norm.startsWith("cr2")) return ir2Data;
  if (norm.startsWith("f1")) return f1Data;
  if (norm.includes("germany")) return germanyData;
  return ir1Data;
}

function normalizeCategorySlug(category?: string | null): string {
  if (!category) return "ir-1";
  const norm = String(category).toLowerCase().replace(/[^a-z0-9]/g, "");
  if (norm.startsWith("ir5")) return "ir-5";
  if (norm.startsWith("ir1") || norm.startsWith("cr1")) return "ir-1";
  if (norm.startsWith("ir2") || norm.startsWith("cr2")) return "ir-2";
  if (norm.startsWith("f1")) return "f-1";
  if (norm.includes("germany")) return "germany-student-journey";
  return "ir-1";
}

function isSpouseSlug(slug: string): boolean {
  const norm = slug.toLowerCase().replace(/[^a-z0-9]/g, "");
  return norm.startsWith("ir1") || norm.startsWith("cr1");
}

function getCandidateIcon(relation?: string): string {
  switch (relation?.toLowerCase()) {
    case "spouse": return "💍";
    case "mother": return "🧕";
    case "father": return "👨";
    case "child":
    case "son":
    case "daughter": return "👶";
    case "student": return "🎓";
    default: return "📋";
  }
}

// ── Main Component ────────────────────────────────────────────────────────────

export function UserJourneyDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const {
    candidates,
    activeCandidate,
    setActiveCandidateId,
  } = useCandidate();

  // Sub-view navigation within the embedded dashboard
  const [view, setView] = useState<"dashboard" | "chapter" | "step">("dashboard");
  const [selectedChapterIdx, setSelectedChapterIdx] = useState<number>(0);

  // Case Strength drawer state
  const [isCSADrawerOpen, setIsCSADrawerOpen] = useState(false);

  // Derive the active category slug & roadmap from the active candidate
  const activeVisaCategory = activeCandidate?.visaCategory || "IR-1";
  const categorySlug = useMemo(() => normalizeCategorySlug(activeVisaCategory), [activeVisaCategory]);
  const roadmapData = useMemo(() => resolveRoadmapData(activeVisaCategory), [activeVisaCategory]);
  const useSpouseViews = useMemo(() => isSpouseSlug(categorySlug), [categorySlug]);

  // Load wizard state for the active candidate + category
  const { state, actions, isLoaded } = useWizard({
    userId,
    journeyId: categorySlug,
    candidateId: activeCandidate?.id,
    roadmapData,
  });

  // Live USCIS receipt status
  const [receiptRecord, setReceiptRecord] = useState<ReceiptRecord | null | undefined>(undefined);
  useEffect(() => {
    let cancelled = false;
    const jId = state?.backendId;
    if (!jId) { setReceiptRecord(null); return; }
    fetchReceiptForJourney(jId)
      .then(({ record }) => { if (!cancelled) setReceiptRecord(record ?? null); })
      .catch(() => { if (!cancelled) setReceiptRecord(null); });
    return () => { cancelled = true; };
  }, [state?.backendId]);

  // Reset sub-view when candidate changes so we always land on dashboard
  useEffect(() => { setView("dashboard"); }, [activeCandidate?.id]);

  // Deep-link into the dedicated journey roadmap page
  const fullJourneyHref = useMemo(
    () => getJourneyHrefByType(activeVisaCategory) || ir1journeyHref,
    [activeVisaCategory],
  );

  // ── Handler callbacks ──────────────────────────────────────────────────────

  const scrollTop = () => { if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" }); };

  const handleSelectChapter = (chapterIdx: number) => {
    setSelectedChapterIdx(chapterIdx);
    actions.setStage(chapterIdx);
    actions.setCurrentStep(-1);
    setView("chapter");
    scrollTop();
  };

  const handleSelectStep = (chapterIdx: number, stepIdx: number) => {
    setSelectedChapterIdx(chapterIdx);
    actions.setStage(chapterIdx);
    actions.setCurrentStep(stepIdx);
    setView("step");
    scrollTop();
  };

  const handleBackToDashboard = () => { setView("dashboard"); actions.setCurrentStep(-1); scrollTop(); };
  const handleBackToChapter = () => { setView("chapter"); actions.setCurrentStep(-1); scrollTop(); };

  const handleLaunchTool = (toolKey: string) => {
    if (toolKey === "document_vault") router.push("/document-vault");
    else router.push(`/tools?tool=${encodeURIComponent(toolKey)}`);
  };

  // ── Loading skeleton ──────────────────────────────────────────────────────

  if (!isLoaded) {
    return (
      <div className="w-full min-h-[340px] flex flex-col items-center justify-center bg-white rounded-3xl border border-slate-200/80 p-8 shadow-xs mb-10">
        <Loader size="md" />
        <p className="text-slate-500 font-medium text-sm mt-3">Loading your journey dashboard…</p>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="w-full flex flex-col mb-10">

      {/* ── Multi-journey switcher pill row ── */}
      {candidates && candidates.length > 1 && (
        <div className="mb-4 flex items-center gap-3 flex-wrap">
          <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-widest text-slate-400 shrink-0">
            <Layers size={12} />
            Journeys
          </span>
          <div className="flex items-center gap-2 overflow-x-auto pb-0.5 scrollbar-hide max-w-full">
            {candidates.map((c) => {
              const isActive = c.id === activeCandidate?.id;
              const cat = c.visaCategory || "IR-1";
              return (
                <button
                  key={c.id}
                  onClick={() => { setActiveCandidateId(c.id); setView("dashboard"); }}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                    isActive
                      ? "bg-[#0d7377] text-white shadow-xs"
                      : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/80"
                  }`}
                >
                  <span>{getCandidateIcon(c.relation)}</span>
                  <span>{c.fullName && c.fullName !== c.relation ? c.fullName : c.relation}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase ${
                    isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-400"
                  }`}>{cat}</span>
                </button>
              );
            })}
          </div>

          {fullJourneyHref && (
            <a
              href={fullJourneyHref}
              className="ml-auto text-xs font-semibold text-[#0d7377] hover:text-[#0a5c5f] inline-flex items-center gap-1 shrink-0"
            >
              Full Roadmap <ExternalLink size={11} />
            </a>
          )}
        </div>
      )}

      {/* ── Dashboard (main RahvanaDashboard widget) ── */}
      {view === "dashboard" && (
        <div className="w-full flex items-center justify-center animate-in fade-in duration-300">
          <RahvanaDashboard
            data={roadmapData}
            state={state}
            actions={actions}
            onSelectChapter={handleSelectChapter}
            onSelectStep={handleSelectStep}
            onLaunchTool={handleLaunchTool}
            options={{
              tier: (state?.subscriptionTier || activeCandidate?.tier || "free") as any,
              receiptRecord,
              onOpenCaseStrength: () => setIsCSADrawerOpen(true),
              onOpenVault: () => router.push("/document-vault"),
            }}
          />
        </div>
      )}

      {/* ── Chapter view (Steps accordion) ── */}
      {view === "chapter" && (
        <div className="w-full bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden animate-in fade-in duration-300">
          {/* Sub-nav breadcrumb */}
          <div className="flex items-center gap-3 px-5 py-3 border-b border-slate-100 bg-slate-50/60">
            <button
              onClick={handleBackToDashboard}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200/80 transition-colors cursor-pointer"
            >
              <ArrowLeft size={13} />
              Dashboard
            </button>
            <span className="text-slate-300">/</span>
            <span className="text-xs font-semibold text-slate-700 truncate">
              Chapter {selectedChapterIdx + 1}: {(roadmapData as any)?.chapters?.[selectedChapterIdx]?.title || "Steps"}
            </span>
            {fullJourneyHref && (
              <a
                href={`${fullJourneyHref}?stage=${selectedChapterIdx}`}
                className="ml-auto text-[11px] font-semibold text-[#0d7377] hover:underline inline-flex items-center gap-0.5 shrink-0"
              >
                Full View <ExternalLink size={10} />
              </a>
            )}
          </div>

          {/* Render the actual ChapterView steps */}
          <div className="px-4 sm:px-6 py-6 pb-8">
            {useSpouseViews ? (
              <ChapterViewSpouse
                data={roadmapData}
                chapterIdx={selectedChapterIdx}
                state={state}
                onBack={handleBackToDashboard}
                onSelectStep={handleSelectStep}
              />
            ) : (
              <ChapterViewEngine
                data={roadmapData}
                chapterIdx={selectedChapterIdx}
                state={state}
                onBack={handleBackToDashboard}
                onSelectStep={handleSelectStep}
              />
            )}
          </div>
        </div>
      )}

      {/* ── Step detail view ── */}
      {view === "step" && (
        <div className="w-full bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden animate-in fade-in duration-300">
          {/* Sub-nav breadcrumb */}
          <div className="flex items-center gap-3 px-5 py-3 border-b border-slate-100 bg-slate-50/60">
            <button
              onClick={handleBackToChapter}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200/80 transition-colors cursor-pointer"
            >
              <ArrowLeft size={13} />
              Chapter Steps
            </button>
            <span className="text-slate-300">/</span>
            <span className="text-xs font-semibold text-slate-700">Step Details</span>
            <button
              onClick={handleBackToDashboard}
              className="ml-auto text-[11px] font-semibold text-[#0d7377] hover:underline cursor-pointer"
            >
              ← Dashboard
            </button>
          </div>

          {/* Render the actual StepView */}
          <div className="pb-8">
            {useSpouseViews ? (
              <StepViewSpouse
                data={roadmapData}
                state={state}
                actions={actions as any}
                onBack={handleBackToChapter}
                onSelectChapter={handleSelectChapter}
                onSelectStep={handleSelectStep}
                onLaunchTool={handleLaunchTool}
              />
            ) : (
              <StepViewEngine
                data={roadmapData}
                state={state}
                actions={actions as any}
                onBack={handleBackToChapter}
                onSelectChapter={handleSelectChapter}
                onSelectStep={handleSelectStep}
                onLaunchTool={handleLaunchTool}
              />
            )}
          </div>
        </div>
      )}

      {/* ── CSA Drawer ── */}
      <CSADrawer
        isOpen={isCSADrawerOpen}
        onClose={() => setIsCSADrawerOpen(false)}
        narrative={null}
        evidenceAnalysis={null}
        evidenceLoading={false}
        healthNotStarted={true}
        healthStatus={null}
        onOpenPhase2={() => { setIsCSADrawerOpen(false); router.push("/visa-case-strength-checker"); }}
      />
    </div>
  );
}

export default UserJourneyDashboard;
