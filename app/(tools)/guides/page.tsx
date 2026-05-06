"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Search,
  FileText,
  Shield,
  DollarSign,
  Heart,
  Users,
  Briefcase,
  FileCheck,
  BookOpen,
  ArrowRight,
  GraduationCap,
  Scale,
  Globe,
  Syringe,
  Activity,
  Map,
  // Truck,
  // Truck,
  // Plane,
  ChevronDown,
  LayoutGrid,
  Crown,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UpgradeModal } from "@/app/components/entitlements/UpgradeModal";
import { usePlan } from "@/app/context/PlanContext";

// --- Data & Types ---

type GuideCategory =
  | "Pakistan Document"
  // | "Embassy Logistics"
  // | "Arrival & Travel"
  // | "Financial & Sponsorship"
  | "Medical & Exam";
// | "Relationship Evidence"
// | "Education & Process"
// | "Visa Strategy";

interface Guide {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  category: GuideCategory;
  href: string;
  icon: React.ElementType;
  disabled?: boolean;
  comingSoon?: boolean;
  /** Entitlement feature key to gate this guide. */
  entitlementFeature?: string;
}

const GUIDES: Guide[] = [
  // --- Pakistan Docs ---
  {
    id: "passport",
    title: "Passport",
    subtitle: "",
    description:
      "DGIP roadmap for MRP and ePassport applications, renewals, and lost or damaged cases.",
    category: "Pakistan Document",
    href: "/guides/passport-guide",
    icon: Globe,
    entitlementFeature: "civil_doc_guides",
  },
  {
    id: "police-verification",
    icon: Shield,
    title: "Police Character Certificate",
    subtitle: "",
    description:
      "Province-wise PCC workflow with required documents, fee tiers, and verification steps.",
    href: "/guides/police-verification-guide",
    category: "Pakistan Document",
    entitlementFeature: "civil_doc_guides",
  },
  {
    id: "cnic",
    title: "CNIC",
    subtitle: "Computerized National Identity Card",
    description:
      "NADRA CNIC workflow for new issuance, corrections, and replacement or renewal applications.",
    category: "Pakistan Document",
    href: "/guides/cnic-guide",
    icon: FileText,
    entitlementFeature: "civil_doc_guides",
  },
  {
    id: "birth-certificate",
    title: "Birth Certificate",
    subtitle: "",
    description:
      "Union Council CBRC process for birth registration, correction, and replacement",
    category: "Pakistan Document",
    href: "/guides/birth-certificate-guide",
    icon: FileText,
    entitlementFeature: "civil_doc_guides",
  },
  {
    id: "frc",
    title: "FRC",
    subtitle: "NADRA Family Registration Certificate",
    description:
      "NADRA process to apply for an FRC and review registered family details.",
    category: "Pakistan Document",
    href: "/guides/frc-guide",
    icon: Globe,
    entitlementFeature: "civil_doc_guides",
  },
  {
    id: "marriage-certificate",
    title: "Marriage Registration",
    subtitle: "",
    description:
      "Nikah Nama registration through Union Council and NADRA MRC issuance with attestation pathway.",
    category: "Pakistan Document",
    href: "/guides/nikah-nama-guide",
    icon: Heart,
    entitlementFeature: "civil_doc_guides",
  },

  // --- Medical & Exam ---
  {
    id: "vaccinations",
    title: "Polio Vaccination",
    subtitle: "",
    description:
      "Polio vaccination workflow with NIMS entry and travel certificate issuance.",
    category: "Medical & Exam",
    href: "/guides/polio-vaccination-guide",
    icon: Syringe,
    entitlementFeature: "polio_certificate",
  },
];

const CATEGORIES: ("All" | GuideCategory)[] = [
  "All",
  "Pakistan Document",
  // "Embassy Logistics",
  // "Arrival & Travel",
  // "Financial & Sponsorship",
  "Medical & Exam",
  // "Relationship Evidence",
  // "Education & Process",
  // "Visa Strategy",
];

// --- Components ---

export default function GuidesPage({
  isEmbedded = false,
}: {
  isEmbedded?: boolean;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<
    "All" | GuideCategory
  >("All");
  const [visibleCount, setVisibleCount] = useState(7); // Default to all
  const [upgradeModalFeature, setUpgradeModalFeature] = useState<string | null>(null);

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

  const filteredGuides = GUIDES.filter((guide) => {
    const matchesSearch =
      guide.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      guide.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "All" || guide.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }).sort((a, b) => a.title.localeCompare(b.title));

  return (
    <div
      className={`bg-background text-foreground font-sans overflow-x-hidden selection:bg-primary selection:text-primary-foreground ${
        isEmbedded ? "" : "pt-16"
      }`}
    >
      {/* Upgrade Modal */}
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

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Hero Section */}
        <section className="text-center mb-5 md:mb-10 pt-1 relative flex flex-col items-center">
          <div className="w-full flex justify-end mb-6 md:absolute md:top-0 md:right-0 md:mb-0 md:w-auto md:block">
            <Link
              href="/guides/my-guides"
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-full text-sm font-bold text-slate-600 hover:text-teal-600 hover:border-teal-200 shadow-sm transition-all"
            >
              <LayoutGrid size={16} />
              My Guides
            </Link>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold mb-4 mt-2 md:mt-0 bg-clip-text text-transparent bg-linear-to-r from-foreground to-muted-foreground animate-fade-up">
            Master the Paperwork.
          </h1>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto animate-fade-up [animation-delay:100ms]">
            Step-by-step guides for every document you need. Clear instructions,
            timelines, and common pitfalls to avoid.
          </p>
        </section>

        {/* Search Bar */}
        <div className="relative max-w-lg mx-auto mb-10 animate-scale-in [animation-delay:200ms]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search guides... (e.g., 'passport', 'police')"
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
                className="px-5 py-2.5 text-sm font-medium whitespace-nowrap border"
              >
                {cat}
              </div>
            ))}
            {/* Force render the More button to measure it */}
            <div className="px-5 py-2.5 text-sm font-medium whitespace-nowrap border flex items-center gap-1">
              More <ChevronDown className="w-4 h-4 ml-1" />
            </div>
          </div>

          {/* Visible Container */}
          <div className="flex flex-wrap gap-3 animate-fade-in [animation-delay:300ms]">
            {visibleCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap border transition-all duration-200 ${
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
                    className={`px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap border transition-all duration-200 flex items-center gap-1 ${
                      isMoreSelected
                        ? "bg-primary text-primary-foreground border-primary shadow-md"
                        : "bg-card text-muted-foreground border-border hover:border-primary hover:bg-primary/5 hover:text-primary"
                    }`}
                  >
                    More <ChevronDown className="w-4 h-4 ml-1" />
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
                      {cat}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* Guides Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7 pt-6">
          {filteredGuides.length > 0 ? (
            filteredGuides.map((guide, index) => (
              <GuideCard
                key={guide.id}
                guide={guide}
                index={index}
                onLockedClick={(feature) => setUpgradeModalFeature(feature)}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              No guides found matching your search.
            </div>
          )}
        </div>
      </div>
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
  }
> = {
  "Pakistan Document": {
    iconBox: "bg-green-600 text-white border-transparent dark:bg-green-500",
    innerBox: "bg-white/20",
    link: "text-green-600 dark:text-green-400",
    borderGradient:
      "from-green-400 to-green-300 dark:from-green-400 dark:to-green-300",
  },
  "Medical & Exam": {
    iconBox: "bg-teal-600 text-white border-transparent dark:bg-teal-500",
    innerBox: "bg-white/20",
    link: "text-teal-600 dark:text-teal-400",
    borderGradient:
      "from-teal-400 to-teal-300 dark:from-teal-400 dark:to-teal-300",
  },
};

function GuideCard({
  guide,
  index,
  onLockedClick,
}: {
  guide: Guide;
  index: number;
  onLockedClick: (feature: string) => void;
}) {
  const plan = usePlan();
  const Icon = guide.icon;
  const styles = CATEGORY_STYLES[guide.category];

  // Entitlement check
  const featureLocked =
    !!guide.entitlementFeature &&
    !plan.isLoading &&
    plan.isLocked(guide.entitlementFeature);

  const isNavigable = !guide.disabled;

  const handleClick = (e: React.MouseEvent) => {
    if (featureLocked && guide.entitlementFeature) {
      e.preventDefault();
      onLockedClick(guide.entitlementFeature);
    }
  };

  const CardWrapper = isNavigable ? Link : "div";

  return (
    <CardWrapper
      href={isNavigable ? guide.href : "#"}
      onClick={handleClick}
      className={`group relative flex flex-col bg-card rounded-[30px] p-6 pt-7 mt-6
      transition-all duration-400 ease-[cubic-bezier(0.175,0.885,0.32,1.275)]
      ${featureLocked
        ? "border-2 border-[#8a5a08] dark:border-[#b88716] cursor-pointer shadow-[0_18px_38px_-24px_rgba(138,90,8,0.9),0_0_0_1px_rgba(255,215,112,0.28)_inset] hover:-translate-y-1 hover:shadow-[0_24px_48px_-24px_rgba(138,90,8,0.95),0_0_26px_rgba(212,161,44,0.22)]"
        : isNavigable
          ? "border border-border hover:-translate-y-2 hover:shadow-xl cursor-pointer"
          : "border border-border opacity-80 cursor-not-allowed grayscale-[0.5]"
      }
      animate-fade-up`}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Gold gradient border — always visible for locked/premium cards */}
      {featureLocked && (
        <div
          className="absolute inset-0 rounded-[30px] pointer-events-none"
          style={{
            padding: "2.5px",
            background:
              "linear-gradient(135deg, #5f3a00 0%, #a66a04 18%, #f5d06f 34%, #7a4a00 50%, #fff1a8 66%, #b77905 82%, #5f3a00 100%), repeating-linear-gradient(45deg, rgba(255,255,255,0.36) 0 1px, transparent 1px 5px)",
            backgroundBlendMode: "overlay",
            WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            WebkitMaskComposite: "xor",
            maskComposite: "exclude",
            opacity: 0.96,
          }}
        />
      )}

      {/* Floating Icon Box */}
      <div
        className={`absolute -top-6 left-6 w-14 h-14 rounded-2xl border flex items-center justify-center shadow-md transition-all duration-400 z-10
        group-hover:-translate-y-1 group-hover:-rotate-3 group-hover:shadow-lg
        ${styles.iconBox}`}
      >
        <div
          className={`absolute inset-1 rounded-[10px] -z-10 transition-colors duration-300 ${styles.innerBox}`}
        />
        <Icon className="w-6 h-6 stroke-2" />
      </div>

      {/* Crown badge — top-right corner */}
      {featureLocked && (
        <div className="absolute top-3.5 right-4 z-10">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#8a5a08] bg-[radial-gradient(circle_at_30%_20%,#fff2b8_0%,#d9a62e_36%,#8a5a08_78%,#4d2e00_100%)] text-[#4d2e00] shadow-[0_7px_18px_rgba(138,90,8,0.42),inset_0_1px_0_rgba(255,255,255,0.65)]">
            <Crown size={20} strokeWidth={3} fill="currentColor" />
          </span>
        </div>
      )}

      {/* Border gradient on hover (category color) */}
      {!featureLocked && (
        <div
          className={`absolute inset-0 rounded-[30px] p-[2px] bg-linear-to-br ${styles.borderGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-400 pointer-events-none [mask:linear-gradient(#fff_0_0)_content-box,linear-gradient(#fff_0_0)] mask-exclude`}
        />
      )}

      {/* Radial Glow Effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-0 bg-[radial-gradient(400px_circle_at_var(--mouse-x,50%)_var(--mouse-y,50%),rgba(13,115,119,0.04),transparent_40%)] dark:bg-[radial-gradient(400px_circle_at_var(--mouse-x,50%)_var(--mouse-y,50%),rgba(255,255,255,0.03),transparent_40%)]" />

      {/* Content */}
      <div className="relative z-10 flex flex-col grow pt-2">
        <h3 className="text-lg md:text-xl leading-tight font-bold text-foreground mb-0.5 transition-colors">
          {guide.title}
        </h3>
        <p
          className={`text-[11px] leading-snug text-zinc-500 dark:text-zinc-400 mb-4 ${
            guide.subtitle ? "" : "invisible"
          }`}
        >
          {guide.subtitle || " "}
        </p>
        <div className="mb-3">
          <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-primary/85 bg-primary/10 border border-primary/20 px-2 py-1 rounded">
            {guide.category}
          </span>
        </div>
        <p className="text-sm leading-6 font-medium text-slate-500 dark:text-slate-400 mb-5 grow [text-wrap:pretty]">
          {guide.description}
        </p>
      </div>

      {/* Footer / Action */}
      <div className="relative z-10 flex items-center justify-between pt-3.5 border-t border-border mt-auto">
        <span className="text-xs font-medium text-muted-foreground flex items-center gap-1" />

        {featureLocked ? (
          <span aria-hidden="true" className="h-5" />
        ) : isNavigable ? (
          <span
            className={`text-sm font-semibold flex items-center gap-1.5 group-hover:underline decoration-2 underline-offset-2 ${styles.link}`}
          >
            Read Guide <ArrowRight className="w-4 h-4" />
          </span>
        ) : (
          <span className="text-sm font-semibold text-muted-foreground/50 flex items-center gap-1.5 cursor-not-allowed">
            {guide.comingSoon ? "Coming Soon" : "Unavailable"}
          </span>
        )}
      </div>
    </CardWrapper>
  );
}