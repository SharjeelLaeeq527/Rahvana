"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import type { AppGroup } from "@/types/app-groups";
import type {
  DashboardAlert,
  DashboardCaseHealth,
  DashboardChapter,
  DashboardHero,
  DashboardKeyDate,
  DashboardPathStep,
  DashboardTracking,
} from "@/lib/journey/dashboard/types";
import { AppGroupModal } from "@/app/components/journey-engine/AppGroupModal";
import { AllServiceRequestsModal } from "@/app/components/journey-engine/AllServiceRequestsModal";
import { useQuickAccess } from "@/app/context/QuickAccessContext";
import { useCandidate } from "@/app/context/CandidateContext";
import { useJourneyEnvironment } from "@/app/context/JourneyEnvironmentContext";
import { getBaseVisaCategory } from "@/lib/candidate/candidateSyncService";
import type { DashboardPersonal } from "./useDashboardPersonal";
import { DesktopDashboard } from "./desktop/DesktopDashboard";
import { MobileDashboard } from "./mobile/MobileDashboard";
import { Icon } from "./icons";
import type { UscisLiveCheck } from "./useUscisLiveCheck";

/**
 * Community group link. Leave empty to hide every Community entry point; the
 * designs used a placeholder, so nothing is shown until a real link is set.
 */
export const COMMUNITY_URL = process.env.NEXT_PUBLIC_COMMUNITY_URL || "";

export interface DashboardActions {
  /** Hero button: same lock / upgrade / navigate logic as the classic CaseStatusHero. */
  onContinue: () => void;
  onOpenChapter: (chapterIndex: number) => void;
  onOpenStep: (chapterIndex: number, stepIndex: number) => void;
  onOpenCaseAnalysis: () => void;
  onOpenEvidenceQuestions: () => void;
  onOpenConsistencyQuestions: () => void;
}

/** Navigation to panels that live outside the dashboard skin. */
export interface DashboardNav {
  openGroup: (groupId: string) => void;
  openRequests: () => void;
  openFavourites: () => void;
  openVault: () => void;
  openWallet: () => void;
  /** Open a toolbox item (tool / guide / service) inside the journey. */
  launchTool: (componentKey: string) => void;
  /** Administrative processing: the full tracker, or the step that records AP details. */
  openApTracker: () => void;
  communityUrl: string;
}

export interface DashboardSkinProps {
  journeyId?: string;
  greetingName?: string;
  hero: DashboardHero;
  chapters: DashboardChapter[];
  path: DashboardPathStep[];
  caseHealth: DashboardCaseHealth;
  alerts: DashboardAlert[];
  tracking: DashboardTracking;
  /** Live USCIS (Torch API) status check for the receipt on the ticket. */
  uscis: UscisLiveCheck;
  keyDates: DashboardKeyDate[];
  groups: AppGroup[];
  personal: DashboardPersonal;
  actions: DashboardActions;
  nav: DashboardNav;
}

export interface JourneyDashboardProps extends Omit<DashboardSkinProps, "nav"> {
  /** Wizard state, for the toolbox modal's per-journey plan check. */
  state: unknown;
  onLaunchTool?: (componentKey: string) => void;
  /** Pages this journey's plan does not include: their links open the upgrade prompt instead. */
  pageLocks: { vault: boolean; wallet: boolean };
  onUpgrade: (feature: string) => void;
  renderApTracker: () => ReactNode;
}

const DESKTOP_QUERY = "(min-width: 1024px)";

function useIsDesktop(): boolean | null {
  const [v, setV] = useState<boolean | null>(null);
  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_QUERY);
    const on = () => setV(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return v;
}

export function JourneyDashboard({ state, onLaunchTool, pageLocks, onUpgrade, renderApTracker, ...props }: JourneyDashboardProps) {
  const router = useRouter();
  const isDesktop = useIsDesktop();
  const [groupId, setGroupId] = useState<string | null>(null);
  const [showRequests, setShowRequests] = useState(false);
  const [showFavourites, setShowFavourites] = useState(false);
  const [showAp, setShowAp] = useState(false);

  const { activeCandidateId, activeCandidate } = useCandidate();
  const { journeyCategory, candidateId: envCandidateId } = useJourneyEnvironment();
  const launch = (key: string) => onLaunchTool?.(key);

  // Portal wallet keys IR-1 (one spouse) as "ir1"; every other category by candidate id.
  const base = getBaseVisaCategory(journeyCategory || activeCandidate?.visaCategory || "");
  const walletCaseId = base === "IR-1" || base === "CR-1" ? "ir1" : activeCandidateId || envCandidateId || "candidate-1";
  const nav: DashboardNav = {
    openGroup: setGroupId,
    openRequests: () => setShowRequests(true),
    openFavourites: () => setShowFavourites(true),
    openVault: () =>
      pageLocks.vault
        ? onUpgrade("document_vault")
        : router.push(props.journeyId ? `/document-vault?journey=${encodeURIComponent(props.journeyId)}` : "/document-vault"),
    openWallet: () =>
      pageLocks.wallet
        ? onUpgrade("portal_wallet")
        : router.push(`/portal-wallet?candidate=${encodeURIComponent(walletCaseId)}`),
    launchTool: launch,
    openApTracker: () => {
      const ap = props.tracking.ap;
      if (!ap) return;
      if (ap.saved) setShowAp(true);
      else if (ap.step) props.actions.onOpenStep(ap.step.chapterIndex, ap.step.stepIndex);
    },
    communityUrl: COMMUNITY_URL,
  };
  const selectedGroup = props.groups.find((g) => g.id === groupId) || null;

  return (
    <>
      {isDesktop === null ? null : isDesktop ? (
        <DesktopDashboard {...props} nav={nav} />
      ) : (
        <MobileDashboard {...props} nav={nav} />
      )}

      <AppGroupModal
        group={selectedGroup}
        isOpen={!!selectedGroup}
        onClose={() => setGroupId(null)}
        state={state}
        onLaunchItem={(key) => {
          setGroupId(null);
          launch(key);
        }}
      />
      <AllServiceRequestsModal
        currentJourneyOnly
        isOpen={showRequests}
        onClose={() => setShowRequests(false)}
        onDone={() => setShowRequests(false)}
        onLaunchItem={(key) => {
          setShowRequests(false);
          launch(key);
        }}
      />
      {showAp && <ApTrackerPanel onClose={() => setShowAp(false)}>{renderApTracker()}</ApTrackerPanel>}
      {showFavourites && (
        <FavouritesPanel
          journeyId={props.journeyId}
          onClose={() => setShowFavourites(false)}
          onLaunch={(key) => {
            setShowFavourites(false);
            launch(key);
          }}
        />
      )}
    </>
  );
}

/** The journey's own AP tracking tool in a panel over the dashboard (the board itself never scrolls). */
function ApTrackerPanel({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div
      className="fixed inset-0 z-[9990] flex items-center justify-center bg-[#0b1b26]/45 p-4 backdrop-blur-[2px]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Administrative processing tracker"
    >
      <div
        className="relative max-h-[calc(100dvh-32px)] w-full max-w-[720px] overflow-y-auto rounded-3xl bg-white p-4 shadow-2xl sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[15px] font-bold text-[#0c1b33]">Administrative processing</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-3 py-1 text-[13px] font-semibold text-[#0d7377] hover:bg-[#e6f5f5]"
          >
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/** This journey's favourites (same data as the JourneyFavoritesTray in the journey nav). */
function FavouritesPanel({
  journeyId,
  onClose,
  onLaunch,
}: {
  journeyId?: string;
  onClose: () => void;
  onLaunch: (key: string) => void;
}) {
  const { items, isPending } = useQuickAccess(
    journeyId ? { type: "journey", journeyId } : { type: "account" }
  );
  const list = journeyId ? items : [];
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  if (!mounted) return null;
  return createPortal(
    <div
      className="fixed inset-0 z-[9990] flex items-end justify-center bg-slate-900/40 p-4 sm:items-center"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="rv-fav-title"
    >
      <div className="w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 id="rv-fav-title" className="text-base font-bold text-slate-900">
            Journey favourites
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-8 w-8 place-items-center rounded-full bg-slate-100 text-slate-500"
          >
            <Icon n="x" size={14} />
          </button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto">
          {isPending && list.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-slate-400">Loading</p>
          ) : list.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-slate-500">
              Tap the heart on any tool, guide or service in the toolbox to pin it here.
            </p>
          ) : (
            list.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onLaunch(item.id)}
                className="flex w-full items-center gap-3 border-b border-slate-100 px-5 py-3 text-left text-sm font-medium text-slate-800 last:border-0 hover:bg-slate-50"
              >
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#0d7377]/10 text-[#0d7377]">
                  <Icon n="heart" size={15} />
                </span>
                <span className="flex-1 truncate">{item.title}</span>
                <Icon n="chev" size={15} className="text-slate-400" />
              </button>
            ))
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
