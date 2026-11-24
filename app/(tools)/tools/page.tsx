"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Search,
  LifeBuoy,
  MessageSquare,
  Calculator,
  Clock,
  CalendarCheck,
  Camera,
  Files,
  PenTool,
  Wand2,
  Lock,
} from "lucide-react";
import { useLanguage } from "@/app/context/LanguageContext";
import { usePlan } from "../../context/PlanContext";
import { UpgradeModal } from "../../components/entitlements/UpgradeModal";
import { ROUTE_FEATURE_MAP } from "@/lib/entitlements/routeFeatureMap";
import { QuickAccessButton } from "@/app/components/shared/QuickAccessButton";
import { useWallet } from "@/app/context/WalletContext";
import {
  getToolCatalogItem,
  isCatalogItemOwned,
  withPreviewMode,
} from "@/lib/wallet/resourceMapping";
import { useJourneyEnvironment } from "@/app/context/JourneyEnvironmentContext";
import CreditInfoTooltip from "@/components/resources/CreditInfoTooltip";
import { isPhotoBoothItem, type WalletCatalogItem } from "@/lib/wallet/catalog";
import { CreditLaunchModal } from "@/app/components/wallet/CreditLaunchModal";
import {
  CATALOG_BAND_PALETTE,
  CATALOG_BTN_GHOST,
  CATALOG_BTN_PRIMARY,
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
  TOOL_CARD_PALETTES,
} from "@/components/resources/catalog";

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

  {
    // Free in every mode: no entitlementFeature and no wallet catalog entry, so the card is
    // always owned and opens directly.
    id: "cspa-age-checker",
    title: "CSPA Age-Out Checker",
    description: "Check if your child can still apply as a child after turning 21.",
    category: "AI & Planning",
    href: "/cspa-age-checker",
    icon: CalendarCheck,
    iconSrc: "/icons/dq-case-tracker.svg",
    badge: "Live",
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
    description: "Merge, compress, convert and edit, all in one toolkit.",
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

  const categoryLabel = (cat: "All" | ToolCategory) => {
    const key = `toolsPage.categories.${cat}`;
    const label = t(key);
    return label && label !== key ? label : cat;
  };

  const filteredTools = TOOLS.filter((tool) => {
    const matchesSearch =
      tool.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || tool.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }).sort((a, b) => a.title.localeCompare(b.title));

  // "My Resources" (embedded) view splits the catalog into two sections:
  //  • "My Tools"     — tools the user owns (free/public, wallet-unlocked, or plan-unlocked
  //                     for tools with no credit price)
  //  • "Browse Tools" — everything else, shown as locked/"Unlock" cards to explore
  const isOwned = (tool: Tool) => {
    const catalogItem = getToolCatalogItem(tool.id);
    if (catalogItem && !isInsideJourney) {
      return !wallet.isLoading && isCatalogItemOwned(catalogItem, wallet.isUnlocked);
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
    </>
  );

  // ── Embedded in My Resources: the page band and tabs come from ResourcesContent ──
  if (isEmbedded) {
    return (
      <div className="text-[#16302C]">
        {modals}
        <CatalogSection
          title="My Tools"
          subtitle="Tools you have unlocked with jarthings or an earlier purchase."
          count={ownedTools.length}
        >
          <CatalogGrid>
            {ownedTools.map((tool, index) => renderToolCard(tool, index))}
            {ownedTools.length === 0 && (
              <CatalogEmpty>No tools unlocked yet. Try one from the catalog below.</CatalogEmpty>
            )}
          </CatalogGrid>
        </CatalogSection>

        {browseTools.length > 0 && (
          <CatalogSection
            title="Browse Tools"
            subtitle="Explore more tools, try a demo or unlock the full version."
            count={browseTools.length}
          >
            <CatalogGrid>
              {browseTools.map((tool, index) => renderToolCard(tool, index))}
            </CatalogGrid>
          </CatalogSection>
        )}
      </div>
    );
  }

  // ── Standalone /tools page ──
  return (
    <>
      {modals}
      <CatalogShell
        eyebrow="Rahvana tools"
        title={t("toolsPage.heroTitle") || "Create. Check. Comply."}
        tagline={
          t("toolsPage.heroDescription") ||
          "A suite of powerful tools designed to simplify complex processes and boost your productivity."
        }
        bandContent={
          <CatalogSearch
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder={t("toolsPage.searchPlaceholder") || "Search tools..."}
          />
        }
        toolbar={
          <CatalogToolbar>
            <CatalogFilters
              label="Tool categories"
              options={CATEGORIES.map((cat) => ({ id: cat, label: categoryLabel(cat) }))}
              value={selectedCategory}
              onChange={setSelectedCategory}
            />
          </CatalogToolbar>
        }
      >
        <CatalogGrid>
          {filteredTools.map((tool, index) => renderToolCard(tool, index))}
          {filteredTools.length === 0 && (
            <CatalogEmpty>
              {t("toolsPage.noToolsFound") || "No tools found matching your search."}
            </CatalogEmpty>
          )}
        </CatalogGrid>
      </CatalogShell>
    </>
  );
}

const QUICK_ACCESS_ICONS: Record<string, string> = {
  "221g-planner": "LifeBuoy",
  "interview-prep": "MessageSquare",
  "sponsorship-calculator": "Calculator",
  "queue-watch": "Clock",
  "cspa-age-checker": "Clock",
  "photo-booth": "Camera",
  "pdf-toolkit": "Files",
  "snap-sign": "PenTool",
  "form-forge": "Wand2",
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
  const { t } = useLanguage();
  const plan = usePlan();
  const wallet = useWallet();
  const { isInsideJourney } = useJourneyEnvironment();

  const planLocked =
    !!tool.entitlementFeature && !plan.isLoading && plan.isLocked(tool.entitlementFeature);
  // Priced tools are standalone credit tools: only a wallet unlock (incl.
  // grandfathered legacy add-ons via /api/wallet) opens them, whatever the plan.
  // Unpriced tools keep the plan rule.
  const catalogItem = getToolCatalogItem(tool.id);
  const walletUnlocked = !!catalogItem && isCatalogItemOwned(catalogItem, wallet.isUnlocked);
  // Standalone catalog tools: credits/legacy add-on only — plan tier never
  // unlocks them outside a journey. Inside a journey, plan entitlement rules.
  const isLocked =
    catalogItem && !isInsideJourney ? !walletUnlocked : planLocked && !walletUnlocked;

  // Credit-purchasable and still locked -> the card becomes a dual-CTA card. A tool
  // not sold as a whole (the Smart Form Filler sells each form on its own) stays a
  // plain link: its page lists the items and each one opens its own credit modal.
  const sellsWhole = !!catalogItem && catalogItem.launchable;
  const showDualCta = sellsWhole && isLocked && !tool.disabled;
  const perItemCredits = catalogItem && !catalogItem.launchable ? catalogItem.credits : null;

  const isRouteLocked = isLocked && !showDualCta && ROUTE_FEATURE_MAP[tool.href] !== undefined;
  const isResultLocked = isLocked && !showDualCta && ROUTE_FEATURE_MAP[tool.href] === undefined;

  const isNavigable = !tool.disabled && !isRouteLocked;

  const handleClick = (e: React.MouseEvent) => {
    // Dual-CTA cards own their clicks through the buttons below; no UpgradeModal grab.
    if (!showDualCta && isRouteLocked && tool.entitlementFeature) {
      e.preventDefault();
      onLockedClick(tool.entitlementFeature);
    }
  };

  const titleKey = `toolsPage.toolsItems.${tool.id}.title`;
  const descKey = `toolsPage.toolsItems.${tool.id}.desc`;
  const catKey = `toolsPage.categories.${tool.category}`;
  const title = t(titleKey) && t(titleKey) !== titleKey ? t(titleKey) : tool.title;
  const description = t(descKey) && t(descKey) !== descKey ? t(descKey) : tool.description;
  const category = t(catKey) && t(catKey) !== catKey ? t(catKey) : tool.category;

  const footer =
    showDualCta && catalogItem ? (
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2.5">
          <div className="flex items-center gap-2">
            <Link
              href={
                catalogItem.legacyAddonId
                  ? `/resources/${catalogItem.legacyAddonId}`
                  : withPreviewMode(tool.href)
              }
              onClick={(e) => e.stopPropagation()}
              className={CATALOG_BTN_GHOST}
            >
              {catalogItem.legacyAddonId ? "View Details" : "Preview Tool"}
            </Link>
            <button
              type="button"
              onClick={() => onLaunch(catalogItem)}
              aria-label={`Launch ${tool.title} for ${catalogItem.credits} jarthings`}
              className={CATALOG_BTN_PRIMARY}
            >
              Launch
            </button>
          </div>
          <CatalogPrice kind="tools" amount={catalogItem.credits} />
        </div>
        {isPhotoBoothItem(catalogItem) && (
          <p className="text-xs font-medium text-[#16302C]/60">
            {catalogItem.credits} jarthings gives you 2 photos. Buy again when both are used.
          </p>
        )}
      </div>
    ) : (
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center">
          {perItemCredits !== null && !isInsideJourney && (
            <CatalogPrice
              kind="tools"
              size={22}
              amount={perItemCredits}
              suffix="jarthings per form"
            />
          )}
        </span>
        {isRouteLocked ? (
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--cat-accent-dark)]">
            <Lock size={14} />
            {t("toolsPage.unlockPro") !== "toolsPage.unlockPro"
              ? t("toolsPage.unlockPro")
              : "Unlock"}
          </span>
        ) : isNavigable ? (
          <CatalogOpenCue label={t("toolsPage.openTool") || "Open Tool"} />
        ) : (
          <span className="text-sm font-semibold text-[#16302C]/40">
            {t("toolsPage.comingSoon") || "Coming Soon"}
          </span>
        )}
      </div>
    );

  return (
    <CatalogCard
      palette={TOOL_CARD_PALETTES[tool.id] ?? CATALOG_BAND_PALETTE}
      icon={<Icon />}
      eyebrow={category}
      title={title}
      description={description}
      locked={isRouteLocked || isResultLocked}
      disabled={tool.disabled}
      index={index}
      href={!showDualCta && isNavigable ? tool.href : undefined}
      onClick={isRouteLocked ? handleClick : undefined}
      topRight={
        isLocked ? (
          <CreditInfoTooltip
            message="Unlock once: spend jarthings one time, then use this tool as much as you like."
            side="top"
          />
        ) : (
          <QuickAccessButton
            item={{
              id: tool.id === "221g-planner" ? "221g-action-planner" : tool.id,
              title: tool.title,
              href: tool.href,
              icon_name: QUICK_ACCESS_ICONS[tool.id] || "Zap",
            }}
            mode="icon"
          />
        )
      }
      footer={footer}
    />
  );
}
