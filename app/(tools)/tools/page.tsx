"use client";

import React, { useState } from "react";
import Link from "next/link";
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
  FolderLock,
  ArrowRight,
  ChevronDown,
} from "lucide-react";

import { useLanguage } from "@/app/context/LanguageContext";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// --- Data & Types ---

type ToolCategory =
  | "AI & Planning"
  | "Money & Sponsorship"
  | "Tracking"
  | "Docs & PDFs"
  | "Forms & Automation";
  // | "Storage & Organization";

interface Tool {
  id: string;
  title: string;
  description: string;
  category: ToolCategory;
  href: string;
  icon: React.ElementType;
  badge?: "Live" | "Soon" | "Beta";
  disabled?: boolean;
  comingSoon?: boolean;
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
    badge: "Live",
  },
  {
    id: "221g-planner",
    title: "221(g) Action Planner",
    description:
      "Step-by-step next moves after 221(g) or Administrative Processing.",
    category: "AI & Planning",
    href: "/221g-action-planner",
    icon: LifeBuoy,
    badge: "Live",
  },
  {
    id: "visa-path",
    title: "Visa Path Finder",
    description:
      "Quick quiz that points you to the right visa path + next steps.",
    category: "AI & Planning",
    href: "/visa-eligibility",
    icon: Compass,
    badge: "Live",
  },
  {
    id: "interview-prep",
    title: "Interview Prep",
    description:
      "Prepare smarter and deliver confident answers when it matters most.",
    category: "AI & Planning",
    href: "/interview-prep",
    icon: MessageSquare,
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
    badge: "Live",
  },

  // Tracking
  {
    id: "queue-watch",
    title: "DQ Status Check",
    description: "Track interview scheduling movement and trends by category.",
    category: "Tracking",
    href: "/iv-tool",
    icon: Clock,
    badge: "Live",
  },
  {
    id: "visa-bulletin-monitor",
    title: "Visa Bulletin Monitor",
    description: "Check your priority date progress against the Visa Bulletin.",
    category: "Tracking",
    href: "/visa-checker",
    icon: Calendar,
    badge: "Live",
    disabled: false,
    comingSoon: false,
  },

  // Docs & PDFs
  {
    id: "photo-booth",
    title: "Photo Booth",
    description: "Make a compliant passport/visa photo in minutes.",
    category: "Docs & PDFs",
    href: "/passport",
    icon: Camera,
    badge: "Live",
  },
  {
    id: "pdf-toolkit",
    title: "PDF Tool Kit",
    description: "Merge • compress • convert • edit — all in one toolkit.",
    category: "Docs & PDFs",
    href: "/pdf-processing",
    icon: Files,
    badge: "Live",
  },
  {
    id: "snap-sign",
    title: "Snap & Sign",
    description: "Create a clean digital signature for your forms.",
    category: "Docs & PDFs",
    href: "/signature-image-processing",
    icon: PenTool,
    badge: "Live",
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
    badge: "Live",
  },

  // Storage & Organization
  // {
  //   id: "doc-vault",
  //   title: "Document Vault",
  //   description:
  //     "Organize docs + build shareable packets when the embassy asks.",
  //   category: "Storage & Organization",
  //   href: "/document-vault",
  //   icon: FolderLock,
  //   badge: "Live",
  // },
];

const CATEGORIES: ("All" | ToolCategory)[] = [
  "All",
  "AI & Planning",
  "Money & Sponsorship",
  "Tracking",
  "Docs & PDFs",
  "Forms & Automation",
  // "Storage & Organization",
];

// --- Components ---

export default function ToolsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<
    "All" | ToolCategory
  >("All");
  const [visibleCount, setVisibleCount] = useState(7); // Default to all
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

      // Extract the More button width (last item) and Category widths
      const moreButtonEl = measureItems[measureItems.length - 1];
      const categoryEls = measureItems.slice(0, measureItems.length - 1);

      const moreButtonWidth = moreButtonEl.offsetWidth;
      const gap = 12; // gap-3 is 12px (0.75rem)

      let totalWidth = 0;
      let visible = 0;

      // First pass: Check if ALL fit
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

      // Second pass: Calculate how many fit WITH "More" button
      totalWidth = 0;

      for (let i = 0; i < categoryEls.length; i++) {
        const itemWidth = categoryEls[i].offsetWidth;
        // Check if adding this item + gap + MoreButton exceeds container
        // Current accumulated + this item + (gap if not first) + gap + MoreButton
        const gapWidth = i > 0 ? gap : 0;
        const projectedWidth =
          totalWidth + gapWidth + itemWidth + gap + moreButtonWidth;

        if (projectedWidth <= containerWidth) {
          visible++;
          totalWidth += gapWidth + itemWidth;
        } else {
          break;
        }
      }

      // Ensure at least 0 (or 1?) items are shown if possible, or 0 if even "More" doesn't fit?
      // If "More" button alone doesn't fit, we have bigger layouts problems, but let's assume it fits.
      setVisibleCount(visible);
    };

    calculateVisible();

    // Add resize listener
    const observer = new ResizeObserver(calculateVisible);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

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
    <div className="min-h-screen bg-background text-foreground font-sans overflow-x-hidden selection:bg-primary selection:text-primary-foreground">
      {/* Ambient Glow */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10">
        <div className="absolute top-[10%] left-[15%] w-[500px] h-[500px] bg-[#0d7377]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-[20%] right-[10%] w-[600px] h-[600px] bg-[#32e0c4]/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Hero Section */}
        <section className="text-center mb-5 md:mb-10">
          <h1 className="text-3xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-linear-to-r from-foreground to-muted-foreground animate-fade-up">
            {t("toolsPage.heroTitle") || "Create. Check. Comply."}
          </h1>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto animate-fade-up [animation-delay:100ms]">
            {t("toolsPage.heroDescription") || "A suite of powerful tools designed to simplify complex processes and boost your productivity."}
          </p>
        </section>

        {/* Search Bar */}
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

        {/* Categories */}
        <div
          ref={containerRef}
          className="relative w-full mb-8 flex justify-center"
        >
          {/* Hidden container for measuring */}
          <div
            ref={measureRef}
            aria-hidden="true"
            className="absolute top-0 left-0 w-full flex flex-wrap gap-3 pointer-events-none opacity-0 z-[-1]"
          >
            {/* Render all categories to measure them */}
            {CATEGORIES.map((cat) => (
              <div
                key={cat}
                className="px-4 py-2.5 text-sm font-medium whitespace-nowrap border"
                data-category={cat}
              >
                {t(`toolsPage.categories.${cat}`) || cat}
              </div>
            ))}
            {/* Force render the More button to measure it */}
            <div
              data-more-button="true"
              className="px-4 py-2.5 text-sm font-medium whitespace-nowrap border flex items-center gap-1"
            >
              {t("toolsPage.more") || "More"} <ChevronDown className="w-4 h-4 ml-1" />
            </div>
          </div>

          {/* Visible Container */}
          <div className="flex flex-wrap gap-3 animate-fade-in [animation-delay:300ms]">
            {visibleCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap border transition-all duration-200 ${
                  selectedCategory === cat
                    ? "bg-primary text-primary-foreground border-primary shadow-md"
                    : "bg-card text-muted-foreground border-border hover:border-primary hover:bg-primary/5 hover:text-primary"
                }`}
              >
                {t(`toolsPage.categories.${cat}`) || cat}
              </button>
            ))}

            {hiddenCategories.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className={`px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap border transition-all duration-200 flex items-center gap-1 ${
                      isMoreSelected
                        ? "bg-primary text-primary-foreground border-primary shadow-md"
                        : "bg-card text-muted-foreground border-border hover:border-primary hover:bg-primary/5 hover:text-primary"
                    }`}
                  >
                    {t("toolsPage.more") || "More"} <ChevronDown className="w-4 h-4 ml-1" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-[200px]">
                  {hiddenCategories.map((cat) => (
                    <DropdownMenuItem
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`cursor-pointer ${
                        selectedCategory === cat
                          ? "bg-primary/10 text-primary font-semibold"
                          : ""
                      }`}
                    >
                      {t(`toolsPage.categories.${cat}`) || cat}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-10 gap-x-6 pt-6">
          {filteredTools.length > 0 ? (
            filteredTools.map((tool, index) => (
              <ToolCard key={tool.id} tool={tool} index={index} />
            ))
          ) : (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              {t("toolsPage.noToolsFound") || "No tools found matching your search."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Tool Card Component ---

const CATEGORY_STYLES: Record<
  ToolCategory,
  {
    iconBox: string;
    innerBox: string;
    link: string;
    borderGradient: string;
  }
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
  // "Storage & Organization": {
  //   iconBox: "bg-indigo-600 text-white border-transparent dark:bg-indigo-500",
  //   innerBox: "bg-white/20",
  //   link: "text-indigo-600 dark:text-indigo-400",
  //   borderGradient:
  //     "from-indigo-400 to-indigo-300 dark:from-indigo-400 dark:to-indigo-300",
  // },
};

function ToolCard({ tool, index }: { tool: Tool; index: number }) {
  const Icon = tool.icon;
  const isClickable = !tool.disabled;
  const CardWrapper = isClickable ? Link : "div";
  const styles = CATEGORY_STYLES[tool.category];
  const { t } = useLanguage();

  return (
    <CardWrapper
      href={tool.href}
      className={`group relative flex flex-col bg-card border border-border rounded-[30px] p-6 pt-7 mt-6 
      transition-all duration-400 ease-[cubic-bezier(0.175,0.885,0.32,1.275)] 
      ${
        isClickable
          ? "hover:-translate-y-2 hover:shadow-xl cursor-pointer"
          : "opacity-80 cursor-not-allowed grayscale-[0.5]"
      }
      animate-fade-up`}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Floating Icon Box */}
      <div
        className={`absolute -top-6 left-6 w-14 h-14 rounded-2xl border flex items-center justify-center shadow-md transition-all duration-400 z-10 
        group-hover:-translate-y-1 group-hover:-rotate-3 group-hover:shadow-lg 
        ${styles.iconBox}`}
      >
        {/* Inner colored box for depth */}
        <div
          className={`absolute inset-1 rounded-[10px] -z-10 transition-colors duration-300 ${styles.innerBox}`}
        />
        <Icon className="w-6 h-6 stroke-2" />
      </div>

      {/* Floating Border Gradient (Pseudo-element emulation) */}
      <div
        className={`absolute inset-0 rounded-[30px] p-[2px] bg-linear-to-br ${styles.borderGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-400 pointer-events-none [mask:linear-gradient(#fff_0_0)_content-box,linear-gradient(#fff_0_0)] mask-exclude`}
      />
      {/* //from-[#0d7377] to-[#32e0c4] */}
      {/* Radial Glow Effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-0 bg-[radial-gradient(400px_circle_at_var(--mouse-x,50%)_var(--mouse-y,50%),rgba(13,115,119,0.04),transparent_40%)] dark:bg-[radial-gradient(400px_circle_at_var(--mouse-x,50%)_var(--mouse-y,50%),rgba(255,255,255,0.03),transparent_40%)]" />

      {/* Header (Badge) */}
      {/* <div className="flex justify-end items-start mb-2 min-h-[24px] relative z-10">
        {tool.badge && (
          <span
            className={`text-[10px] uppercase font-bold tracking-wider px-3 py-1 rounded-full border 
            ${
              tool.badge === "Live"
                ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800"
                : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800"
            }`}
          >
            {tool.badge}
          </span>
        )}
      </div> */}

      {/* Content */}
      <div className="relative z-10 flex flex-col grow pt-2">
        <h3 className="text-xl font-bold text-foreground mb-1 transition-colors">
          {t(`toolsPage.toolsItems.${tool.id}.title`) || tool.title}
        </h3>
        <div className="mb-3">
          <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground/80 bg-muted px-2 py-0.5 rounded">
            {t(`toolsPage.categories.${tool.category}`) || tool.category}
          </span>
        </div>
        <p className="text-muted-foreground dark:text-white text-sm leading-relaxed mb-6 grow">
          {t(`toolsPage.toolsItems.${tool.id}.desc`) || tool.description}
        </p>
      </div>

      {/* Footer / Action */}
      <div className="relative z-10 flex items-center justify-between pt-4 border-t border-border mt-auto">
        <span className="text-xs font-medium text-muted-foreground flex items-center gap-1"></span>

        {isClickable ? (
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
    </CardWrapper>
  );
}
