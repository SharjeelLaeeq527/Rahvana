"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  Brain,
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
} from "lucide-react";

import { useLanguage } from "@/app/context/LanguageContext";
import { usePlan } from "../../context/PlanContext";
import { UpgradeModal } from "../../components/entitlements/UpgradeModal";

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
  {
    id: "case-strength-analyzer",
    title: "Case Strength Analyzer",
    description:
      "Instant AI case strength score + gaps to fix before NVC/Interview.",
    category: "AI & Planning",
    href: "/visa-case-strength-checker",
    icon: Brain,
    iconSrc: "/icons/case-strength-analyser.svg",
    badge: "Live",
    entitlementFeature: "case_strength",
  },
  {
    id: "221g-planner",
    title: "221(g) Action Planner",
    description:
      "Step-by-step next moves after 221(g) or Administrative Processing.",
    category: "AI & Planning",
    href: "/221g-action-planner",
    icon: LifeBuoy,
    iconSrc: "/icons/221g-action-plan.svg",
    badge: "Live",
    entitlementFeature: "action_221g",
  },
  {
    id: "visa-path",
    title: "Visa Path Finder",
    description:
      "Quick quiz that points you to the right visa path + next steps.",
    category: "AI & Planning",
    href: "/visa-eligibility",
    icon: Compass,
    iconSrc: "/icons/visa-path-finder.svg",
    badge: "Live",
    // Public — no entitlement required
  },
  {
    id: "interview-prep",
    title: "Interview Prep",
    description:
      "Prepare smarter and deliver confident answers when it matters most.",
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
  {
    id: "visa-bulletin-monitor",
    title: "Visa Bulletin Monitor",
    description: "Check your priority date progress against the Visa Bulletin.",
    category: "Tracking",
    href: "/visa-checker",
    icon: Calendar,
    iconSrc: "/icons/visa-bulletin-monitor.svg",
    badge: "Live",
    entitlementFeature: "visa_bulletin_monitor",
  },
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
    description:
      "Auto-fills your official form and generates a ready-to-upload PDF.",
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

export default function ToolsPage({
  isEmbedded = false,
}: {
  isEmbedded?: boolean;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<
    "All" | ToolCategory
  >("All");
  const [visibleCount, setVisibleCount] = useState(7);
  const [upgradeModalFeature, setUpgradeModalFeature] = useState<string | null>(
    null,
  );
  const { t } = useLanguage();

  const containerRef = React.useRef<HTMLDivElement>(null);
  const measureRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const calculateVisible = () => {
      if (!containerRef.current || !measureRef.current) return;
      const containerWidth = containerRef.current.clientWidth;
      const measureItems = Array.from(
        measureRef.current.children,
      ) as HTMLDivElement[];
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
          totalWidth +
            gapWidth +
            categoryEls[i].offsetWidth +
            gap +
            moreButtonWidth <=
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
    const matchesCategory =
      selectedCategory === "All" || tool.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }).sort((a, b) => a.title.localeCompare(b.title));

  return (
    <div
      className={`bg-background text-foreground font-sans overflow-x-hidden selection:bg-primary selection:text-primary-foreground ${isEmbedded ? "" : "pt-16"}`}
    >
      {/* UpgradeModal */}
      {upgradeModalFeature && (
        <UpgradeModal
          feature={upgradeModalFeature}
          onClose={() => setUpgradeModalFeature(null)}
        />
      )}

      {/* Ambient Glow */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10">
        <div className="absolute top-[10%] left-[15%] w-[500px] h-[500px] bg-[#0d7377]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-[20%] right-[10%] w-[600px] h-[600px] bg-[#32e0c4]/5 rounded-full blur-3xl" />
      </div>

      <div className="site-main-px site-main-py">
        {/* Hero */}
        <section className="text-center mb-5 md:mb-10 pt-1">
          <h1 className="text-3xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-linear-to-r from-foreground to-muted-foreground animate-fade-up">
            {t("toolsPage.heroTitle") || "Create. Check. Comply."}
          </h1>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto animate-fade-up [animation-delay:100ms]">
            {t("toolsPage.heroDescription") ||
              "A suite of powerful tools designed to simplify complex processes and boost your productivity."}
          </p>
        </section>

        {/* Search */}
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

        {/* Category tabs */}
        <div
          ref={containerRef}
          className="relative w-full mb-8 flex justify-center"
        >
          <div
            ref={measureRef}
            aria-hidden="true"
            className="absolute top-0 left-0 w-full flex flex-wrap gap-3 pointer-events-none opacity-0 z-[-1]"
          >
            {CATEGORIES.map((cat) => (
              <div
                key={cat}
                className="px-4 py-2.5 text-sm font-medium whitespace-nowrap border"
              >
                {t(`toolsPage.categories.${cat}`) || cat}
              </div>
            ))}
            <div
              data-more-button="true"
              className="px-4 py-2.5 text-sm font-medium whitespace-nowrap border flex items-center gap-1"
            >
              {t("toolsPage.more") || "More"}{" "}
              <ChevronDown className="w-4 h-4 ml-1" />
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
                    {t("toolsPage.more") || "More"}{" "}
                    <ChevronDown className="w-4 h-4 ml-1" />
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

        {/* Tools grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-10 gap-x-6 pt-6">
          {filteredTools.length > 0 ? (
            filteredTools.map((tool, index) => (
              <ToolCard
                key={tool.id}
                tool={tool}
                index={index}
                onLockedClick={(feature) => setUpgradeModalFeature(feature)}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              {t("toolsPage.noToolsFound") ||
                "No tools found matching your search."}
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
  { iconBox: string; innerBox: string; link: string; borderGradient: string }
> = {
  "AI & Planning": {
    iconBox: "bg-violet-600 text-white border-transparent dark:bg-violet-500",
    innerBox: "bg-white/20",
    link: "text-violet-600 dark:text-violet-400",
    borderGradient:
      "from-violet-400 to-violet-300 dark:from-violet-400 dark:to-violet-300",
  },
  "Money & Sponsorship": {
    iconBox: "bg-emerald-600 text-white border-transparent dark:bg-emerald-500",
    innerBox: "bg-white/20",
    link: "text-emerald-600 dark:text-emerald-400",
    borderGradient:
      "from-emerald-400 to-emerald-300 dark:from-emerald-400 dark:to-emerald-300",
  },
  Tracking: {
    iconBox: "bg-amber-600 text-white border-transparent dark:bg-amber-500",
    innerBox: "bg-white/20",
    link: "text-amber-600 dark:text-amber-400",
    borderGradient:
      "from-amber-300 to-amber-200 dark:from-amber-300 dark:to-amber-200",
  },
  "Docs & PDFs": {
    iconBox: "bg-rose-600 text-white border-transparent dark:bg-rose-500",
    innerBox: "bg-white/20",
    link: "text-rose-600 dark:text-rose-400",
    borderGradient:
      "from-rose-400 to-rose-300 dark:from-rose-400 dark:to-rose-300",
  },
  "Forms & Automation": {
    iconBox: "bg-cyan-600 text-white border-transparent dark:bg-cyan-500",
    innerBox: "bg-white/20",
    link: "text-cyan-600 dark:text-cyan-400",
    borderGradient:
      "from-cyan-300 to-cyan-200 dark:from-cyan-300 dark:to-cyan-200",
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

  const featureLocked =
    !!tool.entitlementFeature &&
    !plan.isLoading &&
    plan.isLocked(tool.entitlementFeature);
  const isNavigable = !tool.disabled && !featureLocked;

  const handleClick = (e: React.MouseEvent) => {
    if (featureLocked && tool.entitlementFeature) {
      e.preventDefault();
      onLockedClick(tool.entitlementFeature);
    }
  };

  const cardClasses = `group relative flex flex-col bg-card rounded-[30px] p-6 pt-7 mt-6
    transition-all duration-400 ease-[cubic-bezier(0.175,0.885,0.32,1.275)]
    ${
      featureLocked
        ? "border-[1.5px] border-transparent cursor-pointer shadow-sm hover:shadow-[0_12px_40px_-12px_rgba(99,102,241,0.25)] hover:-translate-y-1"
        : isNavigable
          ? "border-[1.5px] border-border hover:-translate-y-2 hover:shadow-xl cursor-pointer"
          : "border-[1.5px] border-border opacity-80 cursor-not-allowed grayscale-[0.5]"
    }
    animate-fade-up`;

  return (
    <Link
      href={isNavigable ? tool.href : "#"}
      onClick={handleClick}
      className={cardClasses}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Sleek Professional Border for Locked/Premium cards */}
      {featureLocked && (
        <div className="absolute inset-0 rounded-[30px] p-[1.5px] bg-gradient-to-br from-indigo-500/30 via-purple-500/30 to-pink-500/30 group-hover:from-indigo-500/70 group-hover:via-purple-500/70 group-hover:to-pink-500/70 transition-all duration-500 pointer-events-none [mask:linear-gradient(#fff_0_0)_content-box,linear-gradient(#fff_0_0)] mask-exclude" />
      )}

      {/* Professional Ribbon for Locked/Premium cards */}
      {featureLocked && (
        <div className="absolute -top-[1.5px] -right-[1.5px] h-[95px] w-[95px] overflow-hidden rounded-tr-[30px] pointer-events-none z-20">
          <div className="absolute top-[22px] right-[-28px] w-[130px] rotate-45 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 py-[4px] shadow-[0_4px_12px_rgba(0,0,0,0.2)] border-y border-white/20 dark:border-white/10 flex items-center justify-center transition-transform duration-500 group-hover:scale-105">
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white flex items-center gap-[4px] drop-shadow-md">
              <Lock size={10} strokeWidth={3} className="mb-[1px]" /> PRO
            </span>
          </div>
        </div>
      )}

      {/* Floating icon box */}
      <div
        className={`absolute -top-6 left-6 w-14 h-14 rounded-2xl border flex items-center justify-center shadow-md transition-all duration-400 z-10 group-hover:-translate-y-1 group-hover:-rotate-3 group-hover:shadow-lg ${styles.iconBox}`}
      >
        <div
          className={`absolute inset-1 rounded-[10px] -z-10 transition-colors duration-300 ${styles.innerBox}`}
        />
        <Icon className="w-6 h-6 stroke-2" />
      </div>

      {/* Border gradient on hover (category color) */}
      {!featureLocked && (
        <div
          className={`absolute inset-0 rounded-[30px] p-[1.5px] bg-linear-to-br ${styles.borderGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-400 pointer-events-none [mask:linear-gradient(#fff_0_0)_content-box,linear-gradient(#fff_0_0)] mask-exclude`}
        />
      )}

      {/* Radial glow */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-0 bg-[radial-gradient(400px_circle_at_var(--mouse-x,50%)_var(--mouse-y,50%),rgba(13,115,119,0.04),transparent_40%)] dark:bg-[radial-gradient(400px_circle_at_var(--mouse-x,50%)_var(--mouse-y,50%),rgba(255,255,255,0.03),transparent_40%)]" />

      {/* Content */}
      <div className="relative z-10 flex flex-col grow pt-2">
        <h3 className="text-xl font-bold mb-1 text-foreground transition-colors">
          {t(`toolsPage.toolsItems.${tool.id}.title`) || tool.title}
        </h3>
        <div className="mb-3">
          <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground/80 bg-muted px-2 py-0.5 rounded">
            {t(`toolsPage.categories.${tool.category}`) || tool.category}
          </span>
        </div>
        <p className="text-sm leading-relaxed mb-6 grow text-slate-900 dark:text-white">
          {t(`toolsPage.toolsItems.${tool.id}.desc`) || tool.description}
        </p>
      </div>

      {/* Footer */}
      <div className="relative z-10 flex items-center justify-between pt-4 border-t border-border mt-auto">
        <span className="text-xs font-medium text-muted-foreground flex items-center gap-1" />
        {featureLocked ? (
          <span className="text-sm font-semibold flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 group-hover:underline decoration-2 underline-offset-2">
            <Lock size={14} className="mb-[1px]" />{" "}
            {t("toolsPage.unlockPro") !== "toolsPage.unlockPro"
              ? t("toolsPage.unlockPro")
              : "Unlock Pro"}
          </span>
        ) : isNavigable ? (
          <span
            className={`text-sm font-semibold flex items-center gap-1.5 group-hover:underline decoration-2 underline-offset-2 ${styles.link}`}
          >
            {t("toolsPage.openTool") || "Open Tool"}{" "}
            <ArrowRight className="w-4 h-4" />
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
