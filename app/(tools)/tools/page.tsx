"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  // Coins, // Unused now — replaced by <CreditTypeIcon kind="tools" /> (kept for reference)
  LifeBuoy,
  MessageSquare,
  Calculator,
  Clock,
  Camera,
  Files,
  PenTool,
  Wand2,
  ArrowRight,
  ChevronDown,
  Lock,
} from "lucide-react";
import { useLanguage } from "@/app/context/LanguageContext";
import { usePlan } from "../../context/PlanContext";
import { UpgradeModal } from "../../components/entitlements/UpgradeModal";
import { ROUTE_FEATURE_MAP } from "@/lib/entitlements/routeFeatureMap";
import AddResourceCard from "@/components/resources/AddResourceCard";
import ResourceSectionHeader from "@/components/resources/ResourceSectionHeader";
import { QuickAccessButton } from "@/app/components/shared/QuickAccessButton";
import { useWallet } from "@/app/context/WalletContext";
import { getToolCatalogItem, withPreviewMode } from "@/lib/wallet/resourceMapping";
import { useJourneyEnvironment } from "@/app/context/JourneyEnvironmentContext";
import CreditTypeIcon from "@/components/resources/CreditTypeIcon";
import CreditInfoTooltip from "@/components/resources/CreditInfoTooltip";
import type { WalletCatalogItem } from "@/lib/wallet/catalog";
import { CreditLaunchModal } from "@/app/components/wallet/CreditLaunchModal";
import { useQuickAccess } from "@/app/context/QuickAccessContext";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// ─── Data & Types ─────────────────────────────────────────────────────────────
type ToolCategory =
  "AI & Planning" | "Money & Sponsorship" | "Tracking" | "Docs & PDFs" | "Forms & Automation";

interface Tool {
  id: string;
  title: string;
  description: string;
  category: ToolCategory;
  href: string;
  icon: React.ElementType; // Added for Lucide icons
  iconSrc: string;
  badge?: "Live" | "Soon" | "Beta";
  disabled?: boolean;
  comingSoon?: boolean;
  /** entitlement feature key — if set, will show lock badge when user lacks access */
  entitlementFeature?: string;
}

const TOOLS: Tool[] = [
  // AI & Planning
  // Temporarily hidden — Case Strength Analyzer tool commented out.
  // {
  //   id: "case-strength-analyzer",
  //   title: "Case Strength Analyzer",
  //   description: "Instant AI case strength score + gaps to fix before NVC/Interview.",
  //   category: "AI & Planning",
  //   href: "/visa-case-strength-checker",
  //   icon: Brain,
  //   iconSrc: "/icons/case-strength-analyser.svg",
  //   badge: "Live",
  //   entitlementFeature: "case_strength",
  // },
  {
    id: "221g-planner",
    title: "221(g) Action Planner",
    description: "Step-by-step next moves after 221(g) or Administrative Processing.",
    category: "AI & Planning",
    href: "/221g-action-planner",
    icon: LifeBuoy,
    iconSrc: "/icons/221g-action-plan.svg",
    badge: "Live",
    entitlementFeature: "action_221g",
  },
  // {
  //   id: "visa-path",
  //   title: "Visa Path Finder",
  //   description:
  //     "Quick quiz that points you to the right visa path + next steps.",
  //   category: "AI & Planning",
  //   href: "/visa-eligibility",
  //   icon: Compass,
  //   iconSrc: "/icons/visa-path-finder.svg",
  //   badge: "Live",
  //   // Public — no entitlement required
  // },
  {
    id: "interview-prep",
    title: "Interview Prep",
    description: "Prepare smarter and deliver confident answers when it matters most.",
    category: "AI & Planning",
    href: "/interview-prep",
    icon: MessageSquare,
    iconSrc: "/icons/interview-prep.svg",
    badge: "Live",
    entitlementFeature: "basic_interview_prep",
  },

  // Money & Sponsorship
  {
    id: "sponsorship-calculator",
    title: "Sponsorship Calculator",
    description: "Auto-check income/assets and tell you what you still need.",
    category: "Money & Sponsorship",
    href: "/affidavit-support-calculator",
    icon: Calculator,
    iconSrc: "/icons/sponsorship-calculator.svg",
    badge: "Live",
    entitlementFeature: "sponsorship_calc",
  },

  // Tracking
  {
    id: "queue-watch",
    title: "DQ Status Check",
    description: "Track interview scheduling movement and trends by category.",
    category: "Tracking",
    href: "/iv-tool",
    icon: Clock,
    iconSrc: "/icons/dq-case-tracker.svg",
    badge: "Live",
    entitlementFeature: "dq_status_check",
  },

  ...(process.env.NEXT_PUBLIC_ENVIRONMENT === "development"
    ? [
        {
          id: "uscis-case-status",
          title: "USCIS Case Status",
          description: "Real-time USCIS case status lookup via the official Torch API.",
          category: "Tracking" as const,
          href: "/case-status",
          icon: Search,
          iconSrc: "/icons/checklist.svg",
          badge: "Live" as const,
        },
      ]
    : []),
  // {
  //   id: "visa-bulletin-monitor",
  //   title: "Visa Bulletin Monitor",
  //   description: "Check your priority date progress against the Visa Bulletin.",
  //   category: "Tracking",
  //   href: "/visa-checker",
  //   icon: Calendar,
  //   iconSrc: "/icons/visa-bulletin-monitor.svg",
  //   badge: "Live",
  //   entitlementFeature: "visa_bulletin_monitor",
  // },

  // Docs & PDFs
  {
    id: "photo-booth",
    title: "Photo Booth",
    description: "Make a compliant passport/visa photo in minutes.",
    category: "Docs & PDFs",
    href: "/passport",
    icon: Camera,
    iconSrc: "/icons/photo-booth.svg",
    badge: "Live",
    entitlementFeature: "photo_booth",
  },
  {
    id: "pdf-toolkit",
    title: "PDF Tool Kit",
    description: "Merge • compress • convert • edit, all in one toolkit.",
    category: "Docs & PDFs",
    href: "/pdf-processing",
    icon: Files,
    iconSrc: "/icons/pdf-toolbox.svg",
    badge: "Live",
    entitlementFeature: "pdf_toolkit",
  },
  {
    id: "snap-sign",
    title: "Snap & Sign",
    description: "Create a clean digital signature for your forms.",
    category: "Docs & PDFs",
    href: "/signature-image-processing",
    icon: PenTool,
    iconSrc: "/icons/snap-and-sign.svg",
    badge: "Live",
    entitlementFeature: "snap_sign",
  },

  // Forms & Automation
  {
    id: "form-forge",
    title: "Smart Form Filler",
    description: "Auto-fills your official form and generates a ready-to-upload PDF.",
    category: "Forms & Automation",
    href: "/visa-forms",
    icon: Wand2,
    iconSrc: "/icons/smart-form-filler.svg",
    badge: "Live",
    entitlementFeature: "smart_form_filler",
  },
];

const CATEGORIES: ("All" | ToolCategory)[] = [
  "All",
  "AI & Planning",
  "Money & Sponsorship",
  "Tracking",
  "Docs & PDFs",
  "Forms & Automation",
];

// ─── Page component ───────────────────────────────────────────────────────────

export default function ToolsPage({ isEmbedded = false }: { isEmbedded?: boolean }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<"All" | ToolCategory>("All");
  const [visibleCount, setVisibleCount] = useState(7);
  const [upgradeModalFeature, setUpgradeModalFeature] = useState<string | null>(null);
  const [launchTarget, setLaunchTarget] = useState<{
    item: WalletCatalogItem;
    href: string;
  } | null>(null);
  const { t } = useLanguage();
  const plan = usePlan();
  // Wallet state + journey context drive standalone ownership: outside a journey,
  // catalog tools are owned via credit unlock / legacy add-on only (plan tier does
  // NOT unlock standalone tools in My Resources).
  const wallet = useWallet();
  const { isInsideJourney } = useJourneyEnvironment();

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
        totalWidth += categoryEls[i].offsetWidth;
        if (i < categoryEls.length - 1) totalWidth += gap;
      }
      if (totalWidth <= containerWidth) {
        setVisibleCount(CATEGORIES.length);
        return;
      }

      totalWidth = 0;
      for (let i = 0; i < categoryEls.length; i++) {
        const gapWidth = i > 0 ? gap : 0;
        if (
          totalWidth + gapWidth + categoryEls[i].offsetWidth + gap + moreButtonWidth <=
          containerWidth
        ) {
          visible++;
          totalWidth += gapWidth + categoryEls[i].offsetWidth;
        } else break;
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

  const filteredTools = TOOLS.filter((tool) => {
    const matchesSearch =
      tool.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || tool.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }).sort((a, b) => a.title.localeCompare(b.title));

  // "My Resources" (embedded) view splits the catalog into two sections:
  //  • "My Tools"     — tools the user owns (free/public + unlocked by plan or add-ons)
  //  • "Browse Tools" — everything else, shown as locked/"Unlock" cards to explore
  // ORIGINAL (plan-tier ownership) — commented out per product decision:
  // const isOwned = (feature?: string) => !feature || (!plan.isLoading && !plan.isLocked(feature));
  const isOwned = (tool: Tool) => {
    const catalogItem = getToolCatalogItem(tool.id);
    if (catalogItem && !isInsideJourney) {
      return (
        !wallet.isLoading && wallet.isUnlocked(catalogItem.resourceId, catalogItem.resourceType)
      );
    }
    return !tool.entitlementFeature || (!plan.isLoading && !plan.isLocked(tool.entitlementFeature));
  };
  const ownedTools = filteredTools.filter((tool) => isOwned(tool));
  const browseTools = filteredTools.filter((tool) => !isOwned(tool));

  const renderToolCard = (tool: Tool, index: number) => (
    <ToolCard
      key={tool.id}
      tool={tool}
      index={index}
      onLockedClick={(feature) => setUpgradeModalFeature(feature)}
      onLaunch={(item) => setLaunchTarget({ item, href: tool.href })}
    />
  );

  return (
    <div
      className={`bg-background text-foreground selection:bg-primary selection:text-primary-foreground overflow-x-hidden font-sans ${isEmbedded ? "" : "pt-16"}`}
    >
      {/* UpgradeModal */}
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
        {/* Hero — hidden in the embedded "My Resources" view */}
        {!isEmbedded && (
          <section className="mb-5 pt-1 text-center md:mb-10">
            <h1 className="from-foreground to-muted-foreground animate-fade-up mb-4 bg-linear-to-r bg-clip-text text-3xl font-bold text-transparent md:text-5xl">
              {t("toolsPage.heroTitle") || "Create. Check. Comply."}
            </h1>
            <p className="text-muted-foreground animate-fade-up mx-auto max-w-2xl text-base [animation-delay:100ms] md:text-lg">
              {t("toolsPage.heroDescription") ||
                "A suite of powerful tools designed to simplify complex processes and boost your productivity."}
            </p>
          </section>
        )}

        {/* Search */}
        {!isEmbedded && (
          <div className="animate-scale-in relative mx-auto mb-10 max-w-lg [animation-delay:200ms]">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2" />
            <input
              type="text"
              placeholder={t("toolsPage.searchPlaceholder") || "Search tools..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-card border-border text-foreground focus:border-primary focus:ring-primary/10 placeholder:text-muted-foreground w-full rounded-full border-2 py-3 pr-4 pl-11 shadow-sm transition-all focus:ring-4 focus:outline-none"
            />
          </div>
        )}

        {/* Category tabs — hidden in the embedded "My Resources" view */}
        {!isEmbedded && (
          <div ref={containerRef} className="relative mb-8 flex w-full justify-center">
            <div
              ref={measureRef}
              aria-hidden="true"
              className="pointer-events-none absolute top-0 left-0 z-[-1] flex w-full flex-wrap gap-3 opacity-0"
            >
              {CATEGORIES.map((cat) => (
                <div key={cat} className="border px-4 py-2.5 text-sm font-medium whitespace-nowrap">
                  {t(`toolsPage.categories.${cat}`) || cat}
                </div>
              ))}
              <div
                data-more-button="true"
                className="flex items-center gap-1 border px-4 py-2.5 text-sm font-medium whitespace-nowrap"
              >
                {t("toolsPage.more") || "More"} <ChevronDown className="ml-1 h-4 w-4" />
              </div>
            </div>
            <div className="animate-fade-in flex flex-wrap gap-3 [animation-delay:300ms]">
              {visibleCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`rounded-full border px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-all duration-200 ${selectedCategory === cat ? "bg-primary text-primary-foreground border-primary shadow-md" : "bg-card text-muted-foreground border-border hover:border-primary hover:bg-primary/5 hover:text-primary"}`}
                >
                  {t(`toolsPage.categories.${cat}`) || cat}
                </button>
              ))}
              {hiddenCategories.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className={`flex items-center gap-1 rounded-full border px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-all duration-200 ${isMoreSelected ? "bg-primary text-primary-foreground border-primary shadow-md" : "bg-card text-muted-foreground border-border hover:border-primary hover:bg-primary/5 hover:text-primary"}`}
                    >
                      {t("toolsPage.more") || "More"} <ChevronDown className="ml-1 h-4 w-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-[200px]">
                    {hiddenCategories.map((cat) => (
                      <DropdownMenuItem
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`cursor-pointer ${selectedCategory === cat ? "bg-primary/10 text-primary font-semibold" : ""}`}
                      >
                        {t(`toolsPage.categories.${cat}`) || cat}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        )}

        {/* Tools grid */}
        {isEmbedded ? (
          <>
            {/* My Tools — what the user owns */}
            <ResourceSectionHeader
              title="My Tools"
              subtitle="Tools you've unlocked with your plan or add-ons."
              className="-mt-16"
            />
            <div className="grid grid-cols-1 gap-x-6 gap-y-10 pt-6 md:grid-cols-2 lg:grid-cols-3">
              {ownedTools.map((tool, index) => renderToolCard(tool, index))}
              <AddResourceCard
                href="/pricing?mode=tools"
                label="Add tool"
                index={ownedTools.length}
              />
            </div>

            {/* Browse Tools — everything not yet owned */}
            {browseTools.length > 0 && (
              <>
                <ResourceSectionHeader
                  title="Browse Tools"
                  subtitle="Explore more tools, try a demo or unlock the full version."
                />
                <div className="grid grid-cols-1 gap-x-6 gap-y-10 pt-6 md:grid-cols-2 lg:grid-cols-3">
                  {browseTools.map((tool, index) => renderToolCard(tool, index))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="grid grid-cols-1 gap-x-6 gap-y-10 pt-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredTools.map((tool, index) => renderToolCard(tool, index))}
            {filteredTools.length === 0 && (
              <div className="text-muted-foreground col-span-full py-12 text-center">
                {t("toolsPage.noToolsFound") || "No tools found matching your search."}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Category styles ──────────────────────────────────────────────────────────

const CATEGORY_STYLES: Record<
  ToolCategory,
  {
    iconBox: string;
    innerBox: string;
    link: string;
    hoverBg: string;
    ribbonColor: string;
    ribbonMid: string;
    ribbonDeep: string;
    ribbonIcon: string;
    ribbonBorder: string;
  }
> = {
  "AI & Planning": {
    iconBox: "bg-violet-600 text-white border-transparent dark:bg-violet-500",
    innerBox: "bg-white/20",
    link: "text-teal-600 dark:text-teal-400",
    hoverBg: "group-hover:bg-violet-50",
    ribbonColor: "#f3e8ff",
    ribbonMid: "#c4b5fd",
    ribbonDeep: "#7c3aed",
    ribbonIcon: "#7c3aed",
    ribbonBorder: "#ddd6fe",
  },
  "Money & Sponsorship": {
    iconBox: "bg-emerald-600 text-white border-transparent dark:bg-emerald-500",
    innerBox: "bg-white/20",
    link: "text-teal-600 dark:text-teal-400",
    hoverBg: "group-hover:bg-emerald-50",
    ribbonColor: "#dff7ea",
    ribbonMid: "#86efac",
    ribbonDeep: "#047857",
    ribbonIcon: "#047857",
    ribbonBorder: "#bbf7d0",
  },
  Tracking: {
    iconBox: "bg-amber-600 text-white border-transparent dark:bg-amber-500",
    innerBox: "bg-white/20",
    link: "text-teal-600 dark:text-teal-400",
    hoverBg: "group-hover:bg-amber-50",
    ribbonColor: "#fff4d6",
    ribbonMid: "#fcd34d",
    ribbonDeep: "#b45309",
    ribbonIcon: "#b45309",
    ribbonBorder: "#fde68a",
  },
  "Docs & PDFs": {
    iconBox: "bg-rose-600 text-white border-transparent dark:bg-rose-500",
    innerBox: "bg-white/20",
    link: "text-teal-600 dark:text-teal-400",
    hoverBg: "group-hover:bg-rose-50",
    ribbonColor: "#ffe4e6",
    ribbonMid: "#fda4af",
    ribbonDeep: "#be123c",
    ribbonIcon: "#be123c",
    ribbonBorder: "#fda4af",
  },
  "Forms & Automation": {
    iconBox: "bg-cyan-600 text-white border-transparent dark:bg-cyan-500",
    innerBox: "bg-white/20",
    link: "text-teal-600 dark:text-teal-400",
    hoverBg: "group-hover:bg-cyan-50",
    ribbonColor: "#e0f2fe",
    ribbonMid: "#7dd3fc",
    ribbonDeep: "#0e7490",
    ribbonIcon: "#0e7490",
    ribbonBorder: "#bae6fd",
  },
};

// ─── Tool card ────────────────────────────────────────────────────────────────
function ToolCard({
  tool,
  index,
  onLockedClick,
  onLaunch,
}: {
  tool: Tool;
  index: number;
  onLockedClick: (feature: string) => void;
  onLaunch: (item: WalletCatalogItem) => void;
}) {
  const Icon = tool.icon;
  const styles = CATEGORY_STYLES[tool.category];
  const { t } = useLanguage();
  const plan = usePlan();
  const wallet = useWallet();
  const { isInQuickAccess } = useQuickAccess();
  const { isInsideJourney } = useJourneyEnvironment();

  const planLocked =
    !!tool.entitlementFeature && !plan.isLoading && plan.isLocked(tool.entitlementFeature);
  // Wallet unlock (incl. grandfathered legacy add-ons via /api/wallet) grants access.
  const catalogItem = getToolCatalogItem(tool.id);
  const walletUnlocked =
    !!catalogItem && wallet.isUnlocked(catalogItem.resourceId, catalogItem.resourceType);
  // ORIGINAL: const isLocked = planLocked && !walletUnlocked;
  // Standalone catalog tools: credits/legacy add-on only — plan tier never
  // unlocks them outside a journey. Inside a journey, plan entitlement rules.
  const isLocked =
    catalogItem && !isInsideJourney ? !walletUnlocked : planLocked && !walletUnlocked;

  // Credit-purchasable and still locked -> the card becomes a dual-CTA card.
  const showDualCta = !!catalogItem && isLocked && !tool.disabled;

  const isRouteLocked = isLocked && !showDualCta && ROUTE_FEATURE_MAP[tool.href] !== undefined;
  const isResultLocked = isLocked && !showDualCta && ROUTE_FEATURE_MAP[tool.href] === undefined;

  const isNavigable = !tool.disabled && !isRouteLocked;

  const isPinned = isInQuickAccess(tool.id === "221g-planner" ? "221g-action-planner" : tool.id);

  const handleClick = (e: React.MouseEvent) => {
    // Dual-CTA cards own their clicks through the buttons below; no UpgradeModal grab.
    if (!showDualCta && isRouteLocked && tool.entitlementFeature) {
      e.preventDefault();
      onLockedClick(tool.entitlementFeature);
    }
  };

  const CardWrapper: any = showDualCta ? "div" : Link;

  const cardClasses = `group relative flex flex-col bg-card rounded-[30px] p-6 pt-7 mt-6 mx-2 md:mx-0
    transition-all duration-400 ease-[cubic-bezier(0.175,0.885,0.32,1.275)]
    ${
      // isPinned
      //   ? "border-[3px] border-[#0d7377] dark:border-[#32e0c4] bg-white shadow-[0_8px_30px_rgba(13,115,119,0.08)] hover:-translate-y-2 hover:shadow-xl cursor-pointer"
      //   :
      isRouteLocked
        ? "border-[1.5px] border-slate-200 bg-white cursor-pointer shadow-sm hover:shadow-[0_12px_40px_-12px_rgba(99,102,241,0.18)] hover:-translate-y-1"
        : isNavigable
          ? "border-[1.5px] border-slate-200 bg-white hover:-translate-y-2 hover:shadow-xl cursor-pointer"
          : "border-[1.5px] border-slate-200 bg-white opacity-80 cursor-not-allowed grayscale-[0.5]"
    }
    animate-fade-up`;

  return (
    <CardWrapper
      href={showDualCta ? undefined : isNavigable ? tool.href : "#"}
      onClick={handleClick}
      className={cardClasses}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Ribbon bookmark for Locked/Premium cards */}
      {(isRouteLocked || isResultLocked) && (
        <div className="pointer-events-none absolute -top-21 -right-12 z-20 sm:-right-3">
          <Image
            src="/icons/ribbon.png"
            alt="Premium ribbon"
            width={160}
            height={220}
            priority={false}
            className="block h-56 w-40 object-contain"
          />
        </div>
      )}
      {/* Hover overlay: pastel fill on hover, sits under ribbon (applies to locked + unlocked) */}
      <div
        className={`pointer-events-none absolute inset-0 z-0 rounded-[30px] bg-transparent transition-colors duration-400 ${styles.hoverBg}`}
      />

      {/* Floating icon box */}
      <div
        className={`absolute -top-6 left-6 z-40 flex h-12 w-12 items-center justify-center rounded-2xl border shadow-md transition-all duration-400 group-hover:-translate-y-1 group-hover:-rotate-3 group-hover:shadow-lg md:h-14 md:w-14 ${styles.iconBox}`}
      >
        <div
          className={`absolute inset-1 -z-10 rounded-[10px] transition-colors duration-300 ${styles.innerBox}`}
        />
        <Icon className="h-5 w-5 stroke-2 md:h-6 md:w-6" />
      </div>

      {/* Radial glow */}
      <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(400px_circle_at_var(--mouse-x,50%)_var(--mouse-y,50%),rgba(13,115,119,0.04),transparent_40%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:bg-[radial-gradient(400px_circle_at_var(--mouse-x,50%)_var(--mouse-y,50%),rgba(255,255,255,0.03),transparent_40%)]" />

      {/* Content */}
      <div className="relative z-30 flex grow flex-col pt-2">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-foreground mb-1 text-xl font-bold transition-colors">
            {t(`toolsPage.toolsItems.${tool.id}.title`) || tool.title}
          </h3>
          {!isLocked && (
            <div className="relative z-50 shrink-0">
              <QuickAccessButton
                item={{
                  id: tool.id === "221g-planner" ? "221g-action-planner" : tool.id,
                  title: tool.title,
                  href: tool.href,
                  icon_name: (() => {
                    const mapping: Record<string, string> = {
                      "221g-planner": "LifeBuoy",
                      "interview-prep": "MessageSquare",
                      "sponsorship-calculator": "Calculator",
                      "queue-watch": "Clock",
                      "photo-booth": "Camera",
                      "pdf-toolkit": "Files",
                      "snap-sign": "PenTool",
                      "form-forge": "Wand2",
                    };
                    return mapping[tool.id] || "Zap";
                  })(),
                }}
                mode="icon"
              />
            </div>
          )}
        </div>
        <div className="mb-3 flex items-center gap-2">
          <span className="text-muted-foreground/80 bg-muted rounded px-2 py-0.5 text-[11px] font-bold tracking-wide uppercase">
            {t(`toolsPage.categories.${tool.category}`) || tool.category}
          </span>
          {/* {isResultLocked && (
            <span className="text-[11px] font-bold uppercase tracking-wide bg-amber-50 text-amber-700 px-2 py-0.5 rounded flex items-center gap-1 border border-amber-200/50">
              <Crown size={10} className="text-amber-500 fill-amber-500 animate-pulse" /> Premium
            </span>
          )} */}
        </div>
        <p className={`mb-4 grow text-sm leading-relaxed text-slate-900 dark:text-white`}>
          {t(`toolsPage.toolsItems.${tool.id}.desc`) || tool.description}
        </p>
      </div>

      {/* Footer */}
      <div className="border-border relative z-10 mt-auto flex flex-col border-t pt-3">
        {showDualCta && catalogItem && (
          <>
            <div className="mb-2.5 flex items-center justify-between gap-2 text-sm font-bold text-[#0d7377] dark:text-[#32e0c4]">
              <div className="flex min-w-0 items-center gap-2">
                <CreditTypeIcon kind="tools" size={22} />
                <span>{catalogItem.credits}</span>
              </div>

              <CreditInfoTooltip
                message="Unlock once: pay these credits one time, then use this tool as much as you like."
                side="top"
              />
            </div>

            {/* Preview CTA removed from My Resources — now links to the resource
                detail page (preview moved to /resources/[slug]). ORIGINAL:
                <Link href={withPreviewMode(tool.href)} ...>Preview Tool</Link>
            */}
            <div className="flex items-center gap-2.5">
              <Link
                href={
                  catalogItem.legacyAddonId
                    ? `/resources/${catalogItem.legacyAddonId}`
                    : withPreviewMode(tool.href)
                }
                onClick={(e) => e.stopPropagation()}
                className="flex-1 rounded-xl border-[1.5px] border-slate-200 bg-white px-3 py-2.5 text-center text-sm font-bold text-slate-700 transition-colors hover:border-[#0d7377]/50 hover:text-[#0d7377]"
              >
                {catalogItem.legacyAddonId ? "View Details" : "Preview Tool"}
              </Link>
              <button
                type="button"
                onClick={() => onLaunch(catalogItem)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#0d7377] px-3 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#0a5c5f]"
              >
                Launch Tool ({catalogItem.credits} Credits)
              </button>
            </div>
            {/* Caption referenced the old Preview CTA — moved to detail page. ORIGINAL:
                <p className="mt-2 text-[11px] leading-snug font-medium text-slate-400">
                  Preview is free. Launching permanently unlocks full access with your wallet credits.
                </p>
            */}
          </>
        )}
        {!showDualCta && (
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground flex items-center gap-1 text-xs font-medium" />
            {isRouteLocked ? (
              <span
                className={`flex items-center gap-1.5 text-sm font-semibold decoration-2 underline-offset-2 group-hover:underline ${styles.link}`}
              >
                <Lock size={14} className="mb-[1px]" />{" "}
                {t("toolsPage.unlockPro") !== "toolsPage.unlockPro"
                  ? t("toolsPage.unlockPro")
                  : "Unlock"}
              </span>
            ) : isNavigable ? (
              <span
                className={`flex items-center gap-1.5 text-sm font-semibold decoration-2 underline-offset-2 group-hover:underline ${styles.link}`}
              >
                {t("toolsPage.openTool") || "Open Tool"} <ArrowRight className="h-4 w-4" />
              </span>
            ) : (
              <span className="text-muted-foreground/50 flex cursor-not-allowed items-center gap-1.5 text-sm font-semibold">
                {t("toolsPage.comingSoon") || "Coming Soon"}
              </span>
            )}
          </div>
        )}
      </div>
    </CardWrapper>
  );
}
