"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileText,
  Shield,
  Heart,
  Globe,
  Syringe,
  BookOpen,
  Clock,
  CheckCircle2,
  PlayCircle,
  Trash2,
  Lock,
} from "lucide-react";

import { UpgradeModal } from "@/app/components/entitlements/UpgradeModal";
import { usePlan } from "@/app/context/PlanContext";
import { useAuth } from "@/app/context/AuthContext";
import { ConfirmationModal } from "@/app/components/shared/ConfirmationModal";
import { QuickAccessButton } from "@/app/components/shared/QuickAccessButton";
import { useWallet } from "@/app/context/WalletContext";
import { getGuideCatalogItem, withPreviewMode } from "@/lib/wallet/resourceMapping";
import { useJourneyEnvironment } from "@/app/context/JourneyEnvironmentContext";
import CreditInfoTooltip from "@/components/resources/CreditInfoTooltip";
import type { WalletCatalogItem } from "@/lib/wallet/catalog";
import { CreditLaunchModal } from "@/app/components/wallet/CreditLaunchModal";
import {
  CATALOG_BAND_PALETTE,
  CATALOG_BTN_GHOST,
  CATALOG_BTN_PRIMARY,
  CatalogBadge,
  CatalogCard,
  CatalogEmpty,
  CatalogFilters,
  CatalogGrid,
  CatalogOpenCue,
  CatalogPrice,
  CatalogSearch,
  CatalogSection,
  CatalogShell,
  CatalogToolbar,
  GUIDE_CATEGORY_PALETTES,
} from "@/components/resources/catalog";

import { useCandidate } from "@/app/context/CandidateContext";

import { GUIDE_REGISTRY, GuideMetadata, type GuideIconName } from "@/lib/guides/guideRegistry";
import { hasJourneyEntitlementForGuide } from "@/lib/guides/guideAccessService";

interface UserGuideSession {
  id: string;
  status: string;
  progress_percent: number;
  last_updated_at: string;
  guides: {
    slug: string;
    title: string;
    description: string;
  };
}

// --- Data & Types ---

type GuideCategory = "Pakistan Document" | "Medical & Exam";

interface Guide extends GuideMetadata {
  icon: React.ElementType;
}

const ICON_MAP: Record<GuideIconName, React.ElementType> = {
  Globe,
  Shield,
  FileText,
  Heart,
  Syringe,
  BookOpen,
  Users: BookOpen,
};

const GUIDES: Guide[] = GUIDE_REGISTRY.map((meta) => ({
  ...meta,
  icon: ICON_MAP[meta.iconName] || BookOpen,
}));

const CATEGORIES: ("All" | GuideCategory)[] = ["All", "Pakistan Document", "Medical & Exam"];

// --- Components ---

type AccessFilter = "all" | "plan" | "credits" | "active" | "inactive";

const ACCESS_FILTERS: { id: AccessFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "plan", label: "Included with Plan" },
  // { id: "credits", label: "Unlocked with Credits" },
  { id: "active", label: "In Progress" },
  { id: "inactive", label: "Not Started" },
];

const guidePalette = (guide: Guide) =>
  GUIDE_CATEGORY_PALETTES[guide.category] ?? CATALOG_BAND_PALETTE;

export default function GuidesPage({ isEmbedded = false }: { isEmbedded?: boolean }) {
  const { user } = useAuth();
  const { activeCandidateId } = useCandidate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<"All" | GuideCategory>("All");
  const [upgradeModalFeature, setUpgradeModalFeature] = useState<string | null>(null);
  const [launchTarget, setLaunchTarget] = useState<{
    item: WalletCatalogItem;
    href: string;
  } | null>(null);
  const plan = usePlan();
  // Wallet state + journey context drive standalone ownership below: outside a
  // journey, guides are owned via credit unlock / legacy add-on only (plan tier
  // does NOT unlock standalone guides).
  const wallet = useWallet();
  const { isInsideJourney } = useJourneyEnvironment();

  const [sessions, setSessions] = useState<UserGuideSession[]>([]);
  const [deleting, setDeleting] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [accessFilter, setAccessFilter] = useState<AccessFilter>("all");

  useEffect(() => {
    if (!user) {
      setSessions([]);
      return;
    }
    const fetchMyGuides = async () => {
      try {
        const currentCandidateId = activeCandidateId || "candidate-1";

        // 1. Fetch from server API
        let apiSessions: UserGuideSession[] = [];
        try {
          const res = await fetch(`/api/guides/my-guides?candidateId=${currentCandidateId}`);
          if (res.ok) {
            const data = await res.json();
            apiSessions = data.sessions || [];
          }
        } catch (e) {
          console.error("API error fetching guides:", e);
        }

        // 2. Read local candidate sessions cache
        let localSessions: UserGuideSession[] = [];
        if (typeof window !== "undefined") {
          try {
            const raw = localStorage.getItem(`rahvana_guide_sessions_${currentCandidateId}`);
            if (raw) {
              localSessions = JSON.parse(raw);
            }
          } catch {
            // Ignore storage errors
          }
        }

        // 3. Merge sessions cleanly by guide slug
        const sessionMap = new Map<string, UserGuideSession>();
        for (const s of localSessions) {
          if (s.guides?.slug) sessionMap.set(s.guides.slug, s);
        }
        for (const s of apiSessions) {
          if (s.guides?.slug) sessionMap.set(s.guides.slug, s);
        }

        setSessions(Array.from(sessionMap.values()));
      } catch (error) {
        console.error("Failed to fetch my guides:", error);
      }
    };
    fetchMyGuides();
  }, [user, activeCandidateId]);

  const handleDelete = async () => {
    if (!selectedSessionId) return;
    try {
      setDeleting(true);

      // Clean local storage cache
      if (typeof window !== "undefined") {
        const currentCandidateId = activeCandidateId || "candidate-1";
        try {
          const raw = localStorage.getItem(`rahvana_guide_sessions_${currentCandidateId}`);
          if (raw) {
            const list: UserGuideSession[] = JSON.parse(raw);
            const updated = list.filter((s) => s.id !== selectedSessionId);
            localStorage.setItem(
              `rahvana_guide_sessions_${currentCandidateId}`,
              JSON.stringify(updated)
            );
          }
        } catch {
          // Ignore
        }
      }

      const res = await fetch("/api/guides/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: selectedSessionId }),
      });
      if (res.ok) {
        setSessions((prev) => prev.filter((s) => s.id !== selectedSessionId));
        setShowConfirmDelete(false);
        setSelectedSessionId(null);
      }
    } catch (error) {
      console.error("Failed to delete guide:", error);
    } finally {
      setDeleting(false);
    }
  };

  const filteredGuides = GUIDES.filter((guide) => {
    const matchesSearch =
      guide.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      guide.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || guide.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }).sort((a, b) => a.title.localeCompare(b.title));

  // Outside a journey, guides are accessible if:
  // 1. The user owns an eligible journey plan (Premium or Executive) for any category mapped to this guide.
  // 2. OR the user unlocked it via wallet credits / legacy add-on.
  // 3. OR the guide is a free/public guide with no entitlement lock.
  // Inside a journey, standard feature entitlement applies.
  const isOwned = (guide: Guide) => {
    // 1. Check if user holds an active journey plan for any of this guide's visa categories
    const journeyAccess = hasJourneyEntitlementForGuide(guide, plan.journeyTiers);
    if (journeyAccess.hasAccess) {
      return true;
    }

    // 2. Check wallet credit unlock / legacy add-on
    const catalogItem = getGuideCatalogItem(guide.id);
    if (catalogItem && !isInsideJourney) {
      return (
        !wallet.isLoading && wallet.isUnlocked(catalogItem.resourceId, catalogItem.resourceType)
      );
    }

    // 3. Fallback: free guide or in-journey entitlement check
    return (
      !guide.entitlementFeature || (!plan.isLoading && !plan.isLocked(guide.entitlementFeature))
    );
  };

  const hasSession = (guide: Guide) => {
    const slug = guide.href.split("/").pop();
    return sessions.some((s) => s.guides.slug === slug);
  };
  // A started guide belongs in "My Guides" even if its entitlement is locked.
  const isMine = (guide: Guide) => isOwned(guide) || hasSession(guide);
  const ownedGuides = filteredGuides.filter(isMine);
  const browseGuides = filteredGuides.filter((guide) => !isMine(guide));

  const isIncludedWithPlan = (guide: Guide) => {
    const journeyAccess = hasJourneyEntitlementForGuide(guide, plan.journeyTiers);
    return (
      journeyAccess.hasAccess &&
      !isInsideJourney &&
      guide.creditPayable !== false &&
      !!guide.entitlementFeature
    );
  };

  const isUnlockedWithCredits = (guide: Guide) => {
    const journeyAccess = hasJourneyEntitlementForGuide(guide, plan.journeyTiers);
    const catalogItem = getGuideCatalogItem(guide.id);
    const walletUnlocked =
      !!catalogItem && wallet.isUnlocked(catalogItem.resourceId, catalogItem.resourceType);
    return walletUnlocked && !journeyAccess.hasAccess && !isInsideJourney;
  };

  const filteredOwnedGuides = ownedGuides.filter((guide) => {
    if (accessFilter === "plan") return isIncludedWithPlan(guide);
    if (accessFilter === "credits") return isUnlockedWithCredits(guide);
    if (accessFilter === "active") return hasSession(guide);
    if (accessFilter === "inactive") return !hasSession(guide);
    return true;
  });

  // Embedded "My Resources" shows owned/started in the first grid; the standalone
  // page shows the full filtered list.
  const displayGuides = isEmbedded ? filteredOwnedGuides : filteredGuides;

  // Renders a started-guide progress card when a session exists, otherwise a GuideCard.
  const renderGuideCard = (guide: Guide, index: number) => {
    const guideSlug = guide.href.split("/").pop();
    const session = sessions.find((s) => s.guides.slug === guideSlug);

    if (session) {
      const completed = session.status === "completed";
      const Icon = guide.icon;
      return (
        <CatalogCard
          key={session.id}
          palette={guidePalette(guide)}
          icon={<Icon />}
          index={index}
          eyebrow={completed ? "Completed" : "In progress"}
          title={session.guides.title}
          titleAttr={session.guides.description}
          subtitle={
            <span className="inline-flex items-center gap-1">
              <Clock size={11} />
              Last saved {new Date(session.last_updated_at).toLocaleDateString()}
            </span>
          }
          topRight={
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setSelectedSessionId(session.id);
                  setShowConfirmDelete(true);
                }}
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-[#16302C]/40 transition-colors hover:bg-red-50 hover:text-red-600"
                title="Delete this progress"
                aria-label="Delete this progress"
              >
                <Trash2 size={15} />
              </button>
              <QuickAccessButton
                item={{
                  id: `guide-${guide.id}`,
                  title: `${guide.title} Guide`,
                  href: guide.href,
                  icon_name: guide.iconName || "BookOpen",
                }}
                mode="icon"
              />
            </>
          }
          footer={
            <Link
              href={`/guides/${session.guides.slug}`}
              className={`${CATALOG_BTN_PRIMARY} w-full`}
            >
              {completed ? (
                <>
                  <CheckCircle2 size={15} />
                  View Results
                </>
              ) : (
                <>
                  <PlayCircle size={15} />
                  Resume Guide
                </>
              )}
            </Link>
          }
        >
          <div className="mt-5">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-[11px] font-semibold tracking-wider text-[#16302C]/50 uppercase">
                Progress
              </span>
              <span className="text-xs font-bold text-[var(--cat-accent-dark)] tabular-nums">
                {session.progress_percent}%
              </span>
            </div>
            <div
              className="h-2 overflow-hidden rounded-full bg-[var(--cat-accent-tint)]"
              role="progressbar"
              aria-valuenow={session.progress_percent}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-full rounded-full bg-[var(--cat-accent)] transition-all duration-1000"
                style={{ width: `${session.progress_percent}%` }}
              />
            </div>
          </div>
        </CatalogCard>
      );
    }

    return (
      <GuideCard
        key={guide.id}
        guide={guide}
        index={index}
        onLockedClick={(feature) => setUpgradeModalFeature(feature)}
        onLaunch={(item) => setLaunchTarget({ item, href: guide.href })}
        isEmbedded={isEmbedded}
      />
    );
  };

  const modals = (
    <>
      {upgradeModalFeature && (
        <UpgradeModal feature={upgradeModalFeature} onClose={() => setUpgradeModalFeature(null)} />
      )}
      {launchTarget && (
        <CreditLaunchModal
          item={launchTarget.item}
          href={launchTarget.href}
          onClose={() => setLaunchTarget(null)}
        />
      )}
      <ConfirmationModal
        open={showConfirmDelete}
        onOpenChange={setShowConfirmDelete}
        title="Delete Progress?"
        description="This will permanently delete your progress for this guide. You cannot undo this action."
        confirmText="Yes, Delete"
        cancelText="No, Keep it"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </>
  );

  // ── Embedded in My Resources: the page band and tabs come from ResourcesContent ──
  if (isEmbedded) {
    return (
      <div className="text-[#16302C]">
        {modals}
        <CatalogSection
          title="My Guides"
          subtitle="Guides you have unlocked or already started."
          count={ownedGuides.length}
          actions={
            ownedGuides.length > 0 ? (
              <CatalogFilters
                label="Filter my guides"
                variant="loose"
                options={ACCESS_FILTERS}
                value={accessFilter}
                onChange={setAccessFilter}
              />
            ) : undefined
          }
        >
          <CatalogGrid>
            {displayGuides.map((guide, index) => renderGuideCard(guide, index))}
            {displayGuides.length === 0 && (
              <CatalogEmpty>
                {accessFilter === "plan"
                  ? "No guides found included with your plan."
                  : accessFilter === "credits"
                    ? "No guides found unlocked with credits."
                    : accessFilter === "active"
                      ? "No guides currently in progress."
                      : accessFilter === "inactive"
                        ? "No unstarted guides found."
                        : "No guides in your collection yet."}
              </CatalogEmpty>
            )}
          </CatalogGrid>
        </CatalogSection>

        {browseGuides.length > 0 && (
          <CatalogSection
            title="Browse Guides"
            subtitle="Explore more guides, preview them or unlock the full version."
            count={browseGuides.length}
          >
            <CatalogGrid>
              {browseGuides.map((guide, index) => renderGuideCard(guide, index))}
            </CatalogGrid>
          </CatalogSection>
        )}
      </div>
    );
  }

  // ── Standalone /guides page ──
  return (
    <>
      {modals}
      <CatalogShell
        title="Master the Paperwork."
        tagline="Step-by-step guides for every document you need. Clear instructions, timelines, and common pitfalls to avoid."
        bandContent={
          <CatalogSearch
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search guides... (e.g., 'passport', 'police')"
          />
        }
        toolbar={
          <CatalogToolbar>
            <CatalogFilters
              label="Guide categories"
              options={CATEGORIES.map((cat) => ({ id: cat, label: cat }))}
              value={selectedCategory}
              onChange={setSelectedCategory}
            />
          </CatalogToolbar>
        }
      >
        <CatalogGrid>
          {displayGuides.map((guide, index) => renderGuideCard(guide, index))}
          {displayGuides.length === 0 && (
            <CatalogEmpty>No guides found matching your search.</CatalogEmpty>
          )}
        </CatalogGrid>
      </CatalogShell>
    </>
  );
}

// --- Guide Card Component ---

function GuideCard({
  guide,
  index,
  onLockedClick,
  onLaunch,
  isEmbedded,
}: {
  guide: Guide;
  index: number;
  onLockedClick: (feature: string) => void;
  onLaunch: (item: WalletCatalogItem) => void;
  isEmbedded?: boolean;
}) {
  const plan = usePlan();
  const wallet = useWallet();
  const { isInsideJourney } = useJourneyEnvironment();
  const Icon = guide.icon;

  const planLocked =
    !!guide.entitlementFeature && !plan.isLoading && plan.isLocked(guide.entitlementFeature);
  const catalogItem = getGuideCatalogItem(guide.id);
  const walletUnlocked =
    !!catalogItem && wallet.isUnlocked(catalogItem.resourceId, catalogItem.resourceType);

  // Check journey entitlement across guide.visaCategories
  const journeyAccess = hasJourneyEntitlementForGuide(guide, plan.journeyTiers);
  const hasJourneyPlanAccess = journeyAccess.hasAccess;

  // Feature is locked if neither journey plan nor wallet unlock grants access
  const featureLocked =
    catalogItem && !isInsideJourney
      ? !walletUnlocked && !hasJourneyPlanAccess
      : planLocked && !walletUnlocked && !hasJourneyPlanAccess;

  const showDualCta = !!catalogItem && featureLocked && !guide.disabled;
  const isNavigable = !guide.disabled;

  const handleClick = (e: React.MouseEvent) => {
    if (!showDualCta && featureLocked && guide.entitlementFeature) {
      e.preventDefault();
      onLockedClick(guide.entitlementFeature);
    }
  };

  const showPlanBadge =
    !isEmbedded &&
    hasJourneyPlanAccess &&
    !isInsideJourney &&
    guide.creditPayable !== false &&
    !!guide.entitlementFeature;
  const showCreditsBadge =
    !isEmbedded && walletUnlocked && !hasJourneyPlanAccess && !isInsideJourney;

  const footer =
    showDualCta && catalogItem ? (
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2.5">
        <div className="flex items-center gap-2">
          <Link
            href={
              catalogItem.legacyAddonId
                ? `/resources/${catalogItem.legacyAddonId}`
                : withPreviewMode(guide.href)
            }
            onClick={(e) => e.stopPropagation()}
            className={CATALOG_BTN_GHOST}
          >
            {catalogItem.legacyAddonId ? "View Details" : "Preview Guide"}
          </Link>
          <button
            type="button"
            onClick={() => onLaunch(catalogItem)}
            aria-label={`Launch ${guide.title} for ${catalogItem.credits} credits`}
            className={CATALOG_BTN_PRIMARY}
          >
            Launch
          </button>
        </div>
        <CatalogPrice kind="guides" amount={catalogItem.credits} />
      </div>
    ) : (
      <div className="flex items-center justify-end">
        {featureLocked ? (
          <button
            type="button"
            onClick={() => guide.entitlementFeature && onLockedClick(guide.entitlementFeature)}
            className="inline-flex cursor-pointer items-center gap-1.5 text-sm font-semibold text-[var(--cat-accent-dark)] underline-offset-2 hover:underline"
          >
            <Lock size={14} /> Unlock
          </button>
        ) : isNavigable ? (
          <CatalogOpenCue label="Read Guide" />
        ) : (
          <span className="text-sm font-semibold text-[#16302C]/40">
            {guide.comingSoon ? "Coming Soon" : "Unavailable"}
          </span>
        )}
      </div>
    );

  return (
    <CatalogCard
      palette={guidePalette(guide)}
      icon={<Icon />}
      eyebrow={guide.category}
      title={guide.title}
      subtitle={guide.subtitle}
      description={guide.description}
      locked={featureLocked}
      disabled={guide.disabled}
      index={index}
      href={!showDualCta && isNavigable && !featureLocked ? guide.href : undefined}
      onClick={!showDualCta && featureLocked ? handleClick : undefined}
      badges={
        showPlanBadge || showCreditsBadge ? (
          <>
            {showPlanBadge && (
              <CatalogBadge tone="success" icon={<CheckCircle2 size={11} />}>
                Included with {journeyAccess.unlockedViaCategory || "Plan"}
              </CatalogBadge>
            )}
            {showCreditsBadge && (
              <CatalogBadge tone="info" icon={<CheckCircle2 size={11} />}>
                Unlocked with credits
              </CatalogBadge>
            )}
          </>
        ) : undefined
      }
      topRight={
        featureLocked ? (
          <CreditInfoTooltip
            message="Unlock once: spend credits one time, then use this guide as much as you like."
            side="top"
          />
        ) : (
          <QuickAccessButton
            item={{
              id: `guide-${guide.id}`,
              title: `${guide.title} Guide`,
              href: guide.href,
              icon_name: guide.iconName || "BookOpen",
            }}
            mode="icon"
          />
        )
      }
      footer={footer}
    />
  );
}
