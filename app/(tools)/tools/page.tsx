"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  // Brain, // unused — Case Strength Analyzer tool commented out
  LifeBuoy,
  Compass,
  MessageSquare,
  Calculator,
  Clock,
  Calendar,
  Camera,
  Files,
  PenTool,
  Wand2,
  FileSearch,
  ArrowRight,
  ChevronDown,
  Lock,
  Crown,
} from "lucide-react";
import { getCostOfWaitingMessage } from "@/lib/ui/costOfWaitingMessages";
import { getCostOfWaitingMessage } from "@/lib/ui/costOfWaitingMessages";

import { useLanguage } from "@/app/context/LanguageContext";
import { usePlan } from "../../context/PlanContext";
import { UpgradeModal } from "../../components/entitlements/UpgradeModal";
import { ROUTE_FEATURE_MAP } from "@/lib/entitlements/routeFeatureMap";
import AddResourceCard from "@/components/resources/AddResourceCard";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// ─── Data & Types ─────────────────────────────────────────────────────────────
type ToolCategory =
  | "AI & Planning"
  | "Money & Sponsorship"
  | "Tracking"
  | "Docs & PDFs"
  | "Forms & Automation";

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
  // {
  //   id: "uscis-case-status",
  //   title: "USCIS Case Status",
  //   description:
  //     "Real-time USCIS case status lookup via the official Torch API.",
  //   category: "Tracking",
  //   href: "/case-status",
  //   icon: FileSearch,
  //   iconSrc: "/icons/checklist.svg",
  //   badge: "Live",
  //   // Public tool — no entitlement required
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
    description: "Merge • compress • convert • edit — all in one toolkit.",
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

const TOOL_COST_MESSAGE_MAP: Record<
  string,
  keyof typeof import("@/lib/ui/costOfWaitingMessages").COST_OF_WAITING_MESSAGES
> = {
  "case-strength-analyzer": "CASE_STRENGTH_TOOL_CARD",
  "221g-planner": "ACTION_PLANNER_TOOL_CARD_221G",
  "visa-path": "VISA_PATH_TOOL_CARD",
  "interview-prep": "INTERVIEW_PREP_TOOL_CARD",
  "queue-watch": "DQ_STATUS_CHECK_TOOL_CARD",
  "visa-bulletin-monitor": "VISA_BULLETIN_MONITOR_CURRENT",
  "sponsorship-calculator": "SPONSORSHIP_CALCULATOR_TOOL_CARD",
  "photo-booth": "PHOTO_BOOTH_TOOL_CARD",
  "pdf-toolkit": "PDF_TOOL_KIT_TOOL_CARD",
  "snap-sign": "SNAP_AND_SIGN_TOOL_CARD",
  "form-forge": "SMART_FORM_FILLER_TOOL_CARD",
};

// ─── Page component ───────────────────────────────────────────────────────────

export default function ToolsPage({ isEmbedded = false }: { isEmbedded?: boolean }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<"All" | ToolCategory>("All");
  const [visibleCount, setVisibleCount] = useState(7);
  const [upgradeModalFeature, setUpgradeModalFeature] = useState<string | null>(null);
  const { t } = useLanguage();
  const plan = usePlan();

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

  // "My Resources" (embedded) view: only the tools the user actually owns —
  // free/public tools plus anything unlocked by their plan or purchased add-ons.
  const isOwned = (feature?: string) =>
    !feature || (!plan.isLoading && !plan.isLocked(feature));
  const displayTools = isEmbedded
    ? filteredTools.filter((tool) => isOwned(tool.entitlementFeature))
    : filteredTools;

  return (
    <div
      className={`bg-background text-foreground font-sans overflow-x-hidden selection:bg-primary selection:text-primary-foreground ${isEmbedded ? "" : "pt-16"}`}
    >
      {/* UpgradeModal */}
      {upgradeModalFeature && (
        <UpgradeModal feature={upgradeModalFeature} onClose={() => setUpgradeModalFeature(null)} />
      )}

      {/* Ambient Glow */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10">
        <div className="absolute top-[10%] left-[15%] w-[500px] h-[500px] bg-[#0d7377]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-[20%] right-[10%] w-[600px] h-[600px] bg-[#32e0c4]/5 rounded-full blur-3xl" />
      </div>

      <div className="site-main-px site-main-py">
        {/* Hero — hidden in the embedded "My Resources" view */}
        {!isEmbedded && (
          <section className="text-center mb-5 md:mb-10 pt-1">
            <h1 className="text-3xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-linear-to-r from-foreground to-muted-foreground animate-fade-up">
              {t("toolsPage.heroTitle") || "Create. Check. Comply."}
            </h1>
            <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto animate-fade-up [animation-delay:100ms]">
              {t("toolsPage.heroDescription") ||
                "A suite of powerful tools designed to simplify complex processes and boost your productivity."}
            </p>
          </section>
        )}

        {/* Search */}
        {!isEmbedded && (
        <div className="relative max-w-lg mx-auto mb-10 animate-scale-in [animation-delay:200ms]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5 pointer-events-none" />
          <input
            type="text"
            placeholder={t("toolsPage.searchPlaceholder") || "Search tools..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-card border-2 border-border pl-11 pr-4 py-3 rounded-full text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all shadow-sm placeholder:text-muted-foreground"
          />
        </div>
        )}

        {/* Category tabs — hidden in the embedded "My Resources" view */}
        {!isEmbedded && (
        <div ref={containerRef} className="relative w-full mb-8 flex justify-center">
          <div
            ref={measureRef}
            aria-hidden="true"
            className="absolute top-0 left-0 w-full flex flex-wrap gap-3 pointer-events-none opacity-0 z-[-1]"
          >
            {CATEGORIES.map((cat) => (
              <div key={cat} className="px-4 py-2.5 text-sm font-medium whitespace-nowrap border">
                {t(`toolsPage.categories.${cat}`) || cat}
              </div>
            ))}
            <div
              data-more-button="true"
              className="px-4 py-2.5 text-sm font-medium whitespace-nowrap border flex items-center gap-1"
            >
              {t("toolsPage.more") || "More"} <ChevronDown className="w-4 h-4 ml-1" />
            </div>
          </div>
          <div className="flex flex-wrap gap-3 animate-fade-in [animation-delay:300ms]">
            {visibleCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap border transition-all duration-200 ${selectedCategory === cat ? "bg-primary text-primary-foreground border-primary shadow-md" : "bg-card text-muted-foreground border-border hover:border-primary hover:bg-primary/5 hover:text-primary"}`}
              >
                {t(`toolsPage.categories.${cat}`) || cat}
              </button>
            ))}
            {hiddenCategories.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className={`px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap border transition-all duration-200 flex items-center gap-1 ${isMoreSelected ? "bg-primary text-primary-foreground border-primary shadow-md" : "bg-card text-muted-foreground border-border hover:border-primary hover:bg-primary/5 hover:text-primary"}`}
                  >
                    {t("toolsPage.more") || "More"} <ChevronDown className="w-4 h-4 ml-1" />
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-10 gap-x-6 pt-6">
          {displayTools.map((tool, index) => (
            <ToolCard
              key={tool.id}
              tool={tool}
              index={index}
              onLockedClick={(feature) => setUpgradeModalFeature(feature)}
            />
          ))}
          {isEmbedded && (
            <AddResourceCard
              href="/pricing?mode=tools"
              label="Add tool"
              index={displayTools.length}
            />
          )}
          {!isEmbedded && displayTools.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              {t("toolsPage.noToolsFound") || "No tools found matching your search."}
            </div>
          )}
        </div>
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
}: {
  tool: Tool;
  index: number;
  onLockedClick: (feature: string) => void;
}) {
  const Icon = tool.icon;
  const styles = CATEGORY_STYLES[tool.category];
  const { t } = useLanguage();
  const plan = usePlan();

  const isLocked =
    !!tool.entitlementFeature && !plan.isLoading && plan.isLocked(tool.entitlementFeature);

  const isRouteLocked = isLocked && ROUTE_FEATURE_MAP[tool.href] !== undefined;
  const isResultLocked = isLocked && ROUTE_FEATURE_MAP[tool.href] === undefined;

  const costMessageKey = TOOL_COST_MESSAGE_MAP[tool.id];
  const costOfWaitingMessage = costMessageKey ? getCostOfWaitingMessage(costMessageKey) : null;

  const isNavigable = !tool.disabled && !isRouteLocked;

  const handleClick = (e: React.MouseEvent) => {
    if (isRouteLocked && tool.entitlementFeature) {
      e.preventDefault();
      onLockedClick(tool.entitlementFeature);
    }
  };

  const cardClasses = `group relative flex flex-col bg-card rounded-[30px] p-6 pt-7 mt-6
    transition-all duration-400 ease-[cubic-bezier(0.175,0.885,0.32,1.275)]
    ${
      isRouteLocked
        ? "border-[1.5px] border-slate-200 bg-white cursor-pointer shadow-sm hover:shadow-[0_12px_40px_-12px_rgba(99,102,241,0.18)] hover:-translate-y-1"
        : isNavigable
          ? "border-[1.5px] border-slate-200 bg-white hover:-translate-y-2 hover:shadow-xl cursor-pointer"
          : "border-[1.5px] border-slate-200 bg-white opacity-80 cursor-not-allowed grayscale-[0.5]"
    }
    animate-fade-up`;

  return (
    <Link
      href={isNavigable ? tool.href : "#"}
      onClick={handleClick}
      className={cardClasses}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Ribbon bookmark for Locked/Premium cards */}
      {(isRouteLocked || isResultLocked) && (
        <div className="absolute -top-21 -right-12 sm:-right-3 z-20 pointer-events-none">
          <Image
            src="/icons/ribbon.png"
            alt="Premium ribbon"
            width={160}
            height={220}
            priority={false}
            className="block w-40 h-56 object-contain"
          />
        </div>
      )}
      {/* Hover overlay: pastel fill on hover, sits under ribbon (applies to locked + unlocked) */}
      <div
        className={`absolute inset-0 rounded-[30px] transition-colors duration-400 pointer-events-none z-0 bg-transparent ${styles.hoverBg}`}
      />

      {/* Floating icon box */}
      <div
        className={`absolute -top-6 left-6 w-14 h-14 rounded-2xl border flex items-center justify-center shadow-md transition-all duration-400 z-40 group-hover:-translate-y-1 group-hover:-rotate-3 group-hover:shadow-lg ${styles.iconBox}`}
      >
        <div
          className={`absolute inset-1 rounded-[10px] -z-10 transition-colors duration-300 ${styles.innerBox}`}
        />
        <Icon className="w-6 h-6 stroke-2" />
      </div>

      {/* Radial glow */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-0 bg-[radial-gradient(400px_circle_at_var(--mouse-x,50%)_var(--mouse-y,50%),rgba(13,115,119,0.04),transparent_40%)] dark:bg-[radial-gradient(400px_circle_at_var(--mouse-x,50%)_var(--mouse-y,50%),rgba(255,255,255,0.03),transparent_40%)]" />

      {/* Content */}
      <div className="relative z-30 flex flex-col grow pt-2">
        <h3 className="text-xl font-bold mb-1 text-foreground transition-colors">
          {t(`toolsPage.toolsItems.${tool.id}.title`) || tool.title}
        </h3>
        <div className="mb-3 flex gap-2 items-center">
          <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground/80 bg-muted px-2 py-0.5 rounded">
            {t(`toolsPage.categories.${tool.category}`) || tool.category}
          </span>
          {/* {isResultLocked && (
            <span className="text-[11px] font-bold uppercase tracking-wide bg-amber-50 text-amber-700 px-2 py-0.5 rounded flex items-center gap-1 border border-amber-200/50">
              <Crown size={10} className="text-amber-500 fill-amber-500 animate-pulse" /> Premium
            </span>
          )} */}
        </div>
        <p className={`text-sm leading-relaxed mb-1 grow text-slate-900 dark:text-white mb-0 grow`}>
        <p className={`text-sm leading-relaxed mb-1 grow text-slate-900 dark:text-white mb-0 grow`}>
          {t(`toolsPage.toolsItems.${tool.id}.desc`) || tool.description}
        </p>

        {costOfWaitingMessage && (
          <div className="mt-0 mb-0">
            <p
              className="w-full text-teal-700 dark:text-teal-300 text-sm italic"
              style={{
                fontSize: 13,
                lineHeight: 1.4,
                marginTop: 0,
                marginBottom: 0,
                fontWeight: 400,
                letterSpacing: "-0.01em",
                fontStyle: "italic",
                fontFamily: "Georgia, 'Times New Roman', serif",
              }}
            >
              {costOfWaitingMessage}
            </p>
          </div>
        )}

        {costOfWaitingMessage && (
          <div className="mt-0 mb-0">
            <p
              className="w-full text-teal-700 dark:text-teal-300 text-sm italic"
              style={{
                fontSize: 13,
                lineHeight: 1.4,
                marginTop: 0,
                marginBottom: 0,
                fontWeight: 400,
                letterSpacing: "-0.01em",
                fontStyle: "italic",
                fontFamily: "Georgia, 'Times New Roman', serif",
              }}
            >
              {costOfWaitingMessage}
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="relative z-10 flex items-center justify-between pt-3 border-t border-border mt-auto">
      <div className="relative z-10 flex items-center justify-between pt-3 border-t border-border mt-auto">
        <span className="text-xs font-medium text-muted-foreground flex items-center gap-1" />
        {isRouteLocked ? (
          <span
            className={`text-sm font-semibold flex items-center gap-1.5 group-hover:underline decoration-2 underline-offset-2 ${styles.link}`}
          >
            <Lock size={14} className="mb-[1px]" />{" "}
            {t("toolsPage.unlockPro") !== "toolsPage.unlockPro"
              ? t("toolsPage.unlockPro")
              : "Unlock"}
          </span>
        ) : isNavigable ? (
          <span
            className={`text-sm font-semibold flex items-center gap-1.5 group-hover:underline decoration-2 underline-offset-2 ${styles.link}`}
          >
            {t("toolsPage.openTool") || "Open Tool"} <ArrowRight className="w-4 h-4" />
          </span>
        ) : (
          <span className="text-sm font-semibold text-muted-foreground/50 flex items-center gap-1.5 cursor-not-allowed">
            {t("toolsPage.comingSoon") || "Coming Soon"}
          </span>
        )}
      </div>
    </Link>
  );
}
