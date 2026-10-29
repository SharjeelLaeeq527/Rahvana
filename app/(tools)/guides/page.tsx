"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  FileText,
  Shield,
  Heart,
  Globe,
  Syringe,
  ChevronDown,
  // Coins, // Unused now — replaced by <CreditTypeIcon kind="guides" /> (kept for reference)
  ArrowRight,
  BookOpen,
  Clock,
  CheckCircle2,
  PlayCircle,
  Trash2,
  ChevronRight,
  Lock,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UpgradeModal } from "@/app/components/entitlements/UpgradeModal";
import { usePlan } from "@/app/context/PlanContext";
import AddResourceCard from "@/components/resources/AddResourceCard";
import ResourceSectionHeader from "@/components/resources/ResourceSectionHeader";
import { useAuth } from "@/app/context/AuthContext";
import { motion } from "framer-motion";
import { ConfirmationModal } from "@/app/components/shared/ConfirmationModal";
import { QuickAccessButton } from "@/app/components/shared/QuickAccessButton";
import { useWallet } from "@/app/context/WalletContext";
import { getGuideCatalogItem, withPreviewMode } from "@/lib/wallet/resourceMapping";
import { useJourneyEnvironment } from "@/app/context/JourneyEnvironmentContext";
import CreditTypeIcon from "@/components/resources/CreditTypeIcon";
import CreditInfoTooltip from "@/components/resources/CreditInfoTooltip";
import type { WalletCatalogItem } from "@/lib/wallet/catalog";
import { CreditLaunchModal } from "@/app/components/wallet/CreditLaunchModal";
import { useQuickAccess } from "@/app/context/QuickAccessContext";

import { useCandidate } from "@/app/context/CandidateContext";

import {
  GUIDE_REGISTRY,
  GuideMetadata,
  type GuideCategory as RegistryGuideCategory,
  type GuideIconName,
} from "@/lib/guides/guideRegistry";
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


// --- Tier-aware card styles ------------------------------------------------
// Card border, shadow, and gradient border all follow the tier
const TIER_CARD_STYLE: Record<
  string,
  {
    cardBorder: string;
    cardShadow: string;
    cardHoverShadow: string;
    gradientBorder: string;
    badgeBg: string;
    badgeBorder: string;
  }
> = {
  basic: {
    cardBorder: "border-[#a8d4d4]",
    cardShadow:
      "shadow-[0_18px_38px_-24px_rgba(13,148,136,0.6),0_0_0_1px_rgba(168,212,212,0.3)_inset]",
    cardHoverShadow:
      "hover:shadow-[0_24px_48px_-24px_rgba(13,148,136,0.75),0_0_26px_rgba(13,148,136,0.15)]",
    gradientBorder: "from-teal-300 to-teal-200",
    badgeBg: "bg-teal-50",
    badgeBorder: "border-teal-200",
  },
  premium: {
    cardBorder: "border-[#94a3b8]",
    cardShadow:
      "shadow-[0_18px_38px_-24px_rgba(71,85,105,0.6),0_0_0_1px_rgba(148,163,184,0.3)_inset]",
    cardHoverShadow:
      "hover:shadow-[0_24px_48px_-24px_rgba(71,85,105,0.75),0_0_26px_rgba(71,85,105,0.15)]",
    gradientBorder: "from-slate-400 to-slate-300",
    badgeBg: "bg-slate-100",
    badgeBorder: "border-slate-300",
  },
  executive: {
    cardBorder: "border-[#e8c96a]",
    cardShadow:
      "shadow-[0_18px_38px_-24px_rgba(202,138,4,0.7),0_0_0_1px_rgba(232,201,106,0.3)_inset]",
    cardHoverShadow:
      "hover:shadow-[0_24px_48px_-24px_rgba(202,138,4,0.85),0_0_26px_rgba(202,138,4,0.2)]",
    gradientBorder: "from-amber-300 to-amber-200",
    badgeBg: "bg-amber-50",
    badgeBorder: "border-amber-200",
  },
};

// Inline gradient border styles per tier
const TIER_GRADIENT_BORDER_STYLE: Record<string, React.CSSProperties> = {
  basic: {
    padding: "2.5px",
    background:
      "linear-gradient(135deg, #0f766e 0%, #5eead4 34%, #0d9488 50%, #99f6e4 66%, #0f766e 100%)",
    WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
    WebkitMaskComposite: "xor",
    maskComposite: "exclude",
    opacity: 0.9,
  },
  premium: {
    padding: "2.5px",
    background:
      "linear-gradient(135deg, #334155 0%, #94a3b8 25%, #e2e8f0 50%, #94a3b8 75%, #334155 100%)",
    WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
    WebkitMaskComposite: "xor",
    maskComposite: "exclude",
    opacity: 0.9,
  },
  executive: {
    padding: "2.5px",
    background:
      "linear-gradient(135deg, #5f3a00 0%, #a66a04 18%, #f5d06f 34%, #7a4a00 50%, #fff1a8 66%, #b77905 82%, #5f3a00 100%)",
    WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
    WebkitMaskComposite: "xor",
    maskComposite: "exclude",
    opacity: 0.96,
  },
};

// --- Components ---

export default function GuidesPage({ isEmbedded = false }: { isEmbedded?: boolean }) {
  const { user } = useAuth();
  const { activeCandidateId } = useCandidate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<"All" | GuideCategory>("All");
  const [visibleCount, setVisibleCount] = useState(7);
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
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setSessions([]);
      return;
    }
    const fetchMyGuides = async () => {
      try {
        setSessionsLoading(true);
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
      } finally {
        setSessionsLoading(false);
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

  const containerRef = React.useRef<HTMLDivElement>(null);
  const measureRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const calculateVisible = () => {
      if (!containerRef.current || !measureRef.current) return;

      const containerWidth = containerRef.current.clientWidth;
      const measureItems = Array.from(measureRef.current.children) as HTMLDivElement[];

      const moreButtonEl = measureItems[measureItems.length - 1];
      const categoryEls = measureItems.slice(0, measureItems.length - 1);
      const moreButtonWidth = moreButtonEl.offsetWidth;
      const gap = 12;

      let totalWidth = 0;
      let visible = 0;

      for (let i = 0; i < categoryEls.length; i++) {
        const itemWidth = categoryEls[i].offsetWidth;
        const isLast = i === categoryEls.length - 1;
        totalWidth += itemWidth;
        if (!isLast) totalWidth += gap;
      }

      if (totalWidth <= containerWidth) {
        setVisibleCount(CATEGORIES.length);
        return;
      }

      totalWidth = 0;
      for (let i = 0; i < categoryEls.length; i++) {
        const itemWidth = categoryEls[i].offsetWidth;
        const gapWidth = i > 0 ? gap : 0;
        const projectedWidth = totalWidth + gapWidth + itemWidth + gap + moreButtonWidth;
        if (projectedWidth <= containerWidth) {
          visible++;
          totalWidth += gapWidth + itemWidth;
        } else {
          break;
        }
      }

      setVisibleCount(visible);
    };

    calculateVisible();
    const observer = new ResizeObserver(calculateVisible);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const visibleCategories = CATEGORIES.slice(0, visibleCount);
  const hiddenCategories = CATEGORIES.slice(visibleCount);
  const isMoreSelected = hiddenCategories.includes(selectedCategory);

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
  // Embedded "My Resources" shows owned/started in the first grid; the standalone
  // page shows the full filtered list.
  const displayGuides = isEmbedded ? ownedGuides : filteredGuides;

  // Renders a started-guide progress card when a session exists, otherwise a GuideCard.
  const renderGuideCard = (guide: Guide, index: number) => {
    const guideSlug = guide.href.split("/").pop();
    const session = sessions.find((s) => s.guides.slug === guideSlug);

    if (session) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: index * 0.1 }}
          key={session.id}
          className="group relative mt-6 flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-teal-200 hover:shadow-xl"
        >
          <div className="mb-4 flex items-start justify-between">
            <div className="rounded-2xl bg-teal-50 p-3 text-teal-600 transition-colors duration-300 group-hover:bg-teal-600 group-hover:text-white">
              <BookOpen size={24} />
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase ${session.status === "completed" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}
                >
                  {session.status.replace("_", " ")}
                </span>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    setSelectedSessionId(session.id);
                    setShowConfirmDelete(true);
                  }}
                  className="rounded-lg p-1.5 text-slate-400 transition-all hover:bg-red-50 hover:text-red-500"
                  title="Delete this progress"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <span className="flex items-center gap-1 text-[10px] font-medium text-slate-400">
                <Clock size={10} />
                {new Date(session.last_updated_at).toLocaleDateString()}
              </span>
            </div>
          </div>

          <div className="mb-2 flex items-start justify-between gap-3">
            <h3 className="text-xl font-bold text-slate-900 transition-colors group-hover:text-teal-700">
              {session.guides.title}
            </h3>
            <div className="relative z-50 shrink-0">
              <QuickAccessButton
                item={{
                  id: `guide-${guide.id}`,
                  title: `${guide.title} Guide`,
                  href: guide.href,
                  icon_name: guide.iconName || "BookOpen",
                }}
                mode="icon"
              />
            </div>
          </div>
          <p className="mb-6 line-clamp-2 text-sm leading-relaxed text-slate-500">
            {session.guides.description}
          </p>

          <div className="mt-auto">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-bold tracking-tighter text-slate-400 uppercase">
                Progress
              </span>
              <span className="text-xs font-black text-teal-600">{session.progress_percent}%</span>
            </div>
            <div className="mb-6 h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-teal-500 transition-all duration-1000"
                style={{ width: `${session.progress_percent}%` }}
              />
            </div>

            <Link
              href={`/guides/${session.guides.slug}`}
              className="group/btn flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 py-3.5 text-sm font-bold text-white shadow-lg shadow-slate-200 transition-all hover:bg-teal-600 hover:shadow-teal-100"
            >
              {session.status === "completed" ? (
                <>
                  <CheckCircle2 size={18} />
                  View Results
                </>
              ) : (
                <>
                  <PlayCircle
                    size={18}
                    className="transition-transform group-hover/btn:scale-110"
                  />
                  Resume Guide
                </>
              )}
              <ChevronRight
                size={16}
                className="ml-1 -translate-x-2 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100"
              />
            </Link>
          </div>
        </motion.div>
      );
    }

    return (
      <GuideCard
        key={guide.id}
        guide={guide}
        index={index}
        onLockedClick={(feature) => setUpgradeModalFeature(feature)}
        onLaunch={(item) => setLaunchTarget({ item, href: guide.href })}
      />
    );
  };

  return (
    <div
      className={`bg-background text-foreground selection:bg-primary selection:text-primary-foreground overflow-x-hidden font-sans ${
        isEmbedded ? "" : "pt-16"
      }`}
    >
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

      {/* Ambient Glow */}
      <div className="pointer-events-none fixed top-0 left-0 -z-10 h-full w-full">
        <div className="absolute top-[10%] left-[15%] h-[500px] w-[500px] rounded-full bg-[#0d7377]/5 blur-3xl" />
        <div className="absolute right-[10%] bottom-[20%] h-[600px] w-[600px] rounded-full bg-[#32e0c4]/5 blur-3xl" />
      </div>

      <div className="mx-auto w-full px-6 py-8">
        {/* Hero Section — hidden in the embedded "My Resources" view */}
        {!isEmbedded && (
          <section className="relative mb-5 flex flex-col items-center pt-1 text-center md:mb-10">
            <h1 className="from-foreground to-muted-foreground animate-fade-up mt-2 mb-4 bg-linear-to-r bg-clip-text text-3xl font-bold text-transparent md:mt-0 md:text-5xl">
              Master the Paperwork.
            </h1>
            <p className="text-muted-foreground animate-fade-up mx-auto max-w-2xl text-base [animation-delay:100ms] md:text-lg">
              Step-by-step guides for every document you need. Clear instructions, timelines, and
              common pitfalls to avoid.
            </p>
          </section>
        )}

        {/* Search Bar */}
        {!isEmbedded && (
          <div className="animate-scale-in relative mx-auto mb-10 max-w-lg [animation-delay:200ms]">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search guides... (e.g., 'passport', 'police')"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-card border-border text-foreground focus:border-primary focus:ring-primary/10 placeholder:text-muted-foreground w-full rounded-full border-2 py-3 pr-4 pl-11 shadow-sm transition-all focus:ring-4 focus:outline-none"
            />
          </div>
        )}

        {/* Categories — hidden in the embedded "My Resources" view */}
        {!isEmbedded && (
          <div ref={containerRef} className="relative mb-8 flex w-full justify-center">
            <div
              ref={measureRef}
              aria-hidden="true"
              className="pointer-events-none absolute top-0 left-0 z-[-1] flex w-full flex-wrap gap-3 opacity-0"
            >
              {CATEGORIES.map((cat) => (
                <div key={cat} className="border px-5 py-2.5 text-sm font-medium whitespace-nowrap">
                  {cat}
                </div>
              ))}
              <div className="flex items-center gap-1 border px-5 py-2.5 text-sm font-medium whitespace-nowrap">
                More <ChevronDown className="ml-1 h-4 w-4" />
              </div>
            </div>

            <div className="animate-fade-in flex flex-wrap gap-3 [animation-delay:300ms]">
              {visibleCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`rounded-full border px-5 py-2.5 text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                    selectedCategory === cat
                      ? "bg-primary text-primary-foreground border-primary shadow-md"
                      : "bg-card text-muted-foreground border-border hover:border-primary hover:bg-primary/5 hover:text-primary"
                  }`}
                >
                  {cat}
                </button>
              ))}

              {hiddenCategories.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className={`flex items-center gap-1 rounded-full border px-5 py-2.5 text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                        isMoreSelected
                          ? "bg-primary text-primary-foreground border-primary shadow-md"
                          : "bg-card text-muted-foreground border-border hover:border-primary hover:bg-primary/5 hover:text-primary"
                      }`}
                    >
                      More <ChevronDown className="ml-1 h-4 w-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-[200px]">
                    {hiddenCategories.map((cat) => (
                      <DropdownMenuItem
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`cursor-pointer ${
                          selectedCategory === cat ? "bg-primary/10 text-primary font-semibold" : ""
                        }`}
                      >
                        {cat}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        )}

        {/* My Guides — owned or already started (embedded view only) */}
        {isEmbedded && (
          <ResourceSectionHeader
            title="My Guides"
            subtitle="Guides you've unlocked or already started."
            className="-mt-16"
          />
        )}

        {/* Guides Grid */}
        <div className="grid grid-cols-1 gap-x-6 gap-y-10 pt-6 md:grid-cols-2 lg:grid-cols-3">
          {displayGuides.map((guide, index) => renderGuideCard(guide, index))}
          {/* {isEmbedded && plan.tier !== "premium" && plan.tier !== "executive" && (
            <AddResourceCard
              href="/pricing?mode=guides"
              label="Add guides"
              index={displayGuides.length}
            />
          )} */}
          {!isEmbedded && displayGuides.length === 0 && (
            <div className="text-muted-foreground col-span-full py-12 text-center">
              No guides found matching your search.
            </div>
          )}
        </div>

        {/* Browse Guides — everything not yet owned (embedded view only) */}
        {isEmbedded && browseGuides.length > 0 && (
          <>
            <ResourceSectionHeader
              title="Browse Guides"
              subtitle="Explore more guides, preview them or unlock the full version."
            />
            <div className="grid grid-cols-1 gap-x-6 gap-y-10 pt-6 md:grid-cols-2 lg:grid-cols-3">
              {browseGuides.map((guide, index) => renderGuideCard(guide, index))}
            </div>
          </>
        )}
      </div>
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
    </div>
  );
}

// --- Guide Card Component ---

const CATEGORY_STYLES: Record<
  GuideCategory,
  {
    iconBox: string;
    innerBox: string;
    link: string;
    borderGradient: string;
    hoverBg: string;
    hoverBorder: string;
  }
> = {
  "Pakistan Document": {
    iconBox: "bg-green-600 text-white border-transparent dark:bg-green-500",
    innerBox: "bg-white/20",
    link: "text-green-600 dark:text-green-400",
    borderGradient: "from-green-400 to-green-300 dark:from-green-400 dark:to-green-300",
    hoverBg: "group-hover:bg-green-100 dark:group-hover:bg-green-950/10",
    hoverBorder: "group-hover:border-green-500/30 dark:group-hover:border-green-500/20",
  },
  "Medical & Exam": {
    iconBox: "bg-teal-600 text-white border-transparent dark:bg-teal-500",
    innerBox: "bg-white/20",
    link: "text-teal-600 dark:text-teal-400",
    borderGradient: "from-teal-400 to-teal-300 dark:from-teal-400 dark:to-teal-300",
    hoverBg: "group-hover:bg-teal-100 dark:group-hover:bg-teal-950/10",
    hoverBorder: "group-hover:border-teal-500/30 dark:group-hover:border-teal-500/20",
  },
};

function GuideCard({
  guide,
  index,
  onLockedClick,
  onLaunch,
}: {
  guide: Guide;
  index: number;
  onLockedClick: (feature: string) => void;
  onLaunch: (item: WalletCatalogItem) => void;
}) {
  const plan = usePlan();
  const wallet = useWallet();
  const { isInsideJourney } = useJourneyEnvironment();
  const Icon = guide.icon;
  const styles = CATEGORY_STYLES[guide.category];
  const { isInQuickAccess } = useQuickAccess();

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

  const upgradeTarget: string =
    (guide.entitlementFeature ? plan.entitlement(guide.entitlementFeature).upgradeTarget : null) ??
    "premium";

  const tierStyle = TIER_CARD_STYLE[upgradeTarget] ?? TIER_CARD_STYLE.premium;
  const tierGradientBorderStyle =
    TIER_GRADIENT_BORDER_STYLE[upgradeTarget] ?? TIER_GRADIENT_BORDER_STYLE.premium;
  const tierIconClass = `plan-icon--${upgradeTarget}`;

  const isNavigable = !guide.disabled;

  const isPinned = isInQuickAccess(`guide-${guide.id}`);

  const handleClick = (e: React.MouseEvent) => {
    if (!showDualCta && featureLocked && guide.entitlementFeature) {
      e.preventDefault();
      onLockedClick(guide.entitlementFeature);
    }
  };

  const CardWrapper = (showDualCta || !isNavigable ? "div" : Link) as React.ElementType;

  return (
    <CardWrapper
      href={showDualCta ? undefined : isNavigable ? guide.href : "#"}
      onClick={handleClick}
      className={`group bg-card relative mx-2 mt-6 flex flex-col rounded-2xl p-8 pt-8 transition-all duration-400 ease-[cubic-bezier(0.175,0.885,0.32,1.275)] md:mx-0 ${
        // isPinned
        //   ? "border-[3px] border-[#0d7377] dark:border-[#32e0c4] shadow-md hover:-translate-y-2 hover:shadow-xl cursor-pointer"
        //   :
        featureLocked
          ? "border-border cursor-pointer border shadow-md hover:-translate-y-1"
          : isNavigable
            ? "border-border cursor-pointer border hover:-translate-y-2 hover:shadow-xl"
            : "border-border cursor-not-allowed border opacity-80 grayscale-[0.5]"
      } animate-fade-up`}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Ribbon for locked cards */}
      {featureLocked && (
        <div className="pointer-events-none absolute -top-21 -right-10 z-20 -translate-x-12 sm:-right-3 sm:-translate-x-5">
          <Image
            src="/icons/ribbon.png"
            alt="Premium ribbon"
            width={240}
            height={300}
            priority={false}
            className="h-56 w-40 object-contain drop-shadow-lg"
          />
        </div>
      )}

      {/* Floating icon box */}
      <div
        className={`absolute -top-6 left-6 z-40 flex h-12 w-12 items-center justify-center rounded-2xl border shadow-md transition-all duration-400 group-hover:-translate-y-1 group-hover:-rotate-3 group-hover:shadow-lg md:h-14 md:w-14 ${styles.iconBox}`}
      >
        <div
          className={`absolute inset-1 -z-10 rounded-[10px] transition-colors duration-300 ${styles.innerBox}`}
        />
        <Icon className="h-5 w-5 stroke-2 md:h-6 md:w-6" />
      </div>

      {/* (Removed tier badge — ribbon now indicates locked state) */}

      {/* Hover overlay with light category-specific background & border */}
      {!featureLocked && (
        <div
          className={`pointer-events-none absolute inset-0 z-0 rounded-2xl border border-transparent transition-all duration-400 ${styles.hoverBg} ${styles.hoverBorder}`}
        />
      )}

      {/* Radial Glow */}
      <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(400px_circle_at_var(--mouse-x,50%)_var(--mouse-y,50%),rgba(13,115,119,0.04),transparent_40%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:bg-[radial-gradient(400px_circle_at_var(--mouse-x,50%)_var(--mouse-y,50%),rgba(255,255,255,0.03),transparent_40%)]" />

      {/* Content */}
      <div className="relative z-10 flex flex-col pt-1">
        <div className="flex items-start justify-between gap-3">
          {/* Title + Credit tooltip */}
          <div className="flex min-w-0 flex-1 items-start justify-between gap-3">
            <h3 className="text-foreground mb-0.5 min-w-0 text-lg leading-tight font-bold transition-colors md:text-xl">
              {guide.title}
            </h3>

            {featureLocked && (
              <div className="shrink-0">
                <CreditInfoTooltip
                  message="Unlock once: spend credits one time, then use this guide as much as you like."
                  side="top"
                />
              </div>
            )}
          </div>

          {/* Quick Access button for unlocked guides */}
          {!featureLocked && (
            <div className="relative z-50 shrink-0">
              <QuickAccessButton
                item={{
                  id: `guide-${guide.id}`,
                  title: `${guide.title} Guide`,
                  href: guide.href,
                  icon_name: guide.iconName || "BookOpen",
                }}
                mode="icon"
              />
            </div>
          )}
        </div>

        {/* Subtitle */}
        <p
          className={`mb-4 text-[11px] leading-snug text-zinc-500 dark:text-zinc-400 ${
            guide.subtitle ? "" : "invisible"
          }`}
        >
          {guide.subtitle || " "}
        </p>

        {/* Category & Unlock Badges */}
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="text-primary/85 bg-primary/10 border-primary/20 rounded border px-2 py-1 text-[10px] font-semibold tracking-[0.08em] uppercase">
            {guide.category}
          </span>
          {hasJourneyPlanAccess &&
            !isInsideJourney &&
            guide.creditPayable !== false &&
            !!guide.entitlementFeature && (
              <span className="inline-flex items-center gap-1 rounded-full border border-teal-200 bg-teal-50 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-teal-800 uppercase dark:border-teal-800/40 dark:bg-teal-950/40 dark:text-teal-300">
                <CheckCircle2 size={11} className="text-teal-600 dark:text-teal-400" />
                Included with {journeyAccess.unlockedViaCategory || "Plan"}
              </span>
            )}
          {walletUnlocked && !hasJourneyPlanAccess && !isInsideJourney && (
            <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-blue-800 uppercase dark:border-blue-800/40 dark:bg-blue-950/40 dark:text-blue-300">
              <CheckCircle2 size={11} className="text-blue-600 dark:text-blue-400" />
              Unlocked with Credits
            </span>
          )}
        </div>



        {/* Description */}
        <p
          className="mb-0 pb-0 text-sm font-medium [text-wrap:pretty] text-slate-500 dark:text-slate-400"
          style={{ minHeight: 88, paddingBottom: 0, lineHeight: 1.3 }}
        >
          {guide.description}
        </p>
      </div>

      {/* Footer / Action */}
      <div className="border-border relative z-10 -mt-6 flex flex-col border-t pt-2">
        {showDualCta && catalogItem ? (
          <>
            <div className="mb-2.5 flex items-center justify-between gap-2 text-sm font-bold text-[#0d7377] dark:text-[#32e0c4]">
              <div className="flex items-center gap-2.5">
                <Link
                  href={
                    catalogItem.legacyAddonId
                      ? `/resources/${catalogItem.legacyAddonId}`
                      : withPreviewMode(guide.href)
                  }
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex h-9 items-center rounded-lg border border-slate-200 bg-white px-3.5 text-[13px] font-semibold whitespace-nowrap text-slate-700 transition-colors hover:border-[#0d7377]/40 hover:text-[#0d7377]"
                >
                  {catalogItem.legacyAddonId ? "View Details" : "Preview Guide"}
                </Link>
                <button
                  type="button"
                  onClick={() => onLaunch(catalogItem)}
                  aria-label={`Launch ${guide.title} for ${catalogItem.credits} credits`}
                  className="inline-flex h-9 items-center rounded-lg bg-[#0d7377] px-4 text-[13px] font-semibold whitespace-nowrap text-white transition-colors hover:bg-[#0a5c5f]"
                >
                  Launch
                </button>
              </div>

              <div className="flex min-w-0 items-center gap-2">
                <CreditTypeIcon kind="guides" size={22} />
                <span>{catalogItem.credits}</span>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground flex items-center gap-1 text-xs font-medium" />
            {featureLocked ? (
              <button
                type="button"
                onClick={() => guide.entitlementFeature && onLockedClick(guide.entitlementFeature)}
                className="flex items-center gap-1.5 text-sm font-semibold text-[#0d7377] decoration-2 underline-offset-2 group-hover:underline dark:text-[#32e0c4]"
              >
                <Lock size={14} className="mb-[1px]" /> Unlock
              </button>
            ) : isNavigable ? (
              <span
                className={`flex items-center gap-1.5 text-sm font-semibold decoration-2 underline-offset-2 group-hover:underline ${styles.link}`}
              >
                Read Guide <ArrowRight className="h-4 w-4" />
              </span>
            ) : (
              <span className="text-muted-foreground/50 flex cursor-not-allowed items-center gap-1.5 text-sm font-semibold">
                {guide.comingSoon ? "Coming Soon" : "Unavailable"}
              </span>
            )}
          </div>
        )}
      </div>
    </CardWrapper>
  );
}
