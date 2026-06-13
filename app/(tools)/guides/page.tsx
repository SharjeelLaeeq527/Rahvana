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
  LayoutGrid,
  ArrowRight,
  BookOpen,
  Clock,
  CheckCircle2,
  PlayCircle,
  Trash2,
  ChevronRight,
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
import { useAuth } from "@/app/context/AuthContext";
import { motion } from "framer-motion";
import { ConfirmationModal } from "@/app/components/shared/ConfirmationModal";

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
  entitlementFeature?: string;
}

const GUIDES: Guide[] = [
  {
    id: "passport",
    title: "Passport",
    subtitle: "",
    description:
      "DGIP roadmap for MRP and ePassport applications, renewals, and lost or damaged cases.",
    category: "Pakistan Document",
    href: "/guides/passport-guide",
    icon: Globe,
    entitlementFeature: "guide_passport",
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
    entitlementFeature: "guide_police",
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
    entitlementFeature: "guide_cnic",
  },
  {
    id: "birth-certificate",
    title: "Birth Certificate",
    subtitle: "",
    description: "Union Council CBRC process for birth registration, correction, and replacement",
    category: "Pakistan Document",
    href: "/guides/birth-certificate-guide",
    icon: FileText,
    entitlementFeature: "guide_birth_cert",
  },
  {
    id: "frc",
    title: "FRC",
    subtitle: "NADRA Family Registration Certificate",
    description: "NADRA process to apply for an FRC and review registered family details.",
    category: "Pakistan Document",
    href: "/guides/frc-guide",
    icon: Globe,
    entitlementFeature: "guide_frc",
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
    entitlementFeature: "guide_nikah_nama",
  },
  {
    id: "vaccinations",
    title: "Polio Vaccination",
    subtitle: "",
    description: "Polio vaccination workflow with NIMS entry and travel certificate issuance.",
    category: "Medical & Exam",
    href: "/guides/polio-vaccination-guide",
    icon: Syringe,
    entitlementFeature: "polio_certificate",
  },
];

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
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<"All" | GuideCategory>("All");
  const [visibleCount, setVisibleCount] = useState(7);
  const [upgradeModalFeature, setUpgradeModalFeature] = useState<string | null>(null);
  const plan = usePlan();

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
        const res = await fetch("/api/guides/my-guides");
        if (res.ok) {
          const data = await res.json();
          setSessions(data.sessions || []);
        }
      } catch (error) {
        console.error("Failed to fetch my guides:", error);
      } finally {
        setSessionsLoading(false);
      }
    };
    fetchMyGuides();
  }, [user]);

  const handleDelete = async () => {
    if (!selectedSessionId) return;
    try {
      setDeleting(true);
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

  // "My Resources" (embedded) view: only the guides the user has unlocked
  // (via plan tier or purchased add-ons); free guides always show.
  const isOwned = (feature?: string) => !feature || (!plan.isLoading && !plan.isLocked(feature));
  const displayGuides = isEmbedded
    ? filteredGuides.filter((guide) => isOwned(guide.entitlementFeature))
    : filteredGuides;

  return (
    <div
      className={`bg-background text-foreground font-sans overflow-x-hidden selection:bg-primary selection:text-primary-foreground ${
        isEmbedded ? "" : "pt-16"
      }`}
    >
      {upgradeModalFeature && (
        <UpgradeModal feature={upgradeModalFeature} onClose={() => setUpgradeModalFeature(null)} />
      )}

      {/* Ambient Glow */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10">
        <div className="absolute top-[10%] left-[15%] w-[500px] h-[500px] bg-[#0d7377]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-[20%] right-[10%] w-[600px] h-[600px] bg-[#32e0c4]/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Hero Section — hidden in the embedded "My Resources" view */}
        {!isEmbedded && (
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
              Step-by-step guides for every document you need. Clear instructions, timelines, and
              common pitfalls to avoid.
            </p>
          </section>
        )}

        {/* Search Bar */}
        {!isEmbedded && (
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
        )}

        {/* Categories — hidden in the embedded "My Resources" view */}
        {!isEmbedded && (
          <div ref={containerRef} className="relative w-full mb-8 flex justify-center">
            <div
              ref={measureRef}
              aria-hidden="true"
              className="absolute top-0 left-0 w-full flex flex-wrap gap-3 pointer-events-none opacity-0 z-[-1]"
            >
              {CATEGORIES.map((cat) => (
                <div key={cat} className="px-5 py-2.5 text-sm font-medium whitespace-nowrap border">
                  {cat}
                </div>
              ))}
              <div className="px-5 py-2.5 text-sm font-medium whitespace-nowrap border flex items-center gap-1">
                More <ChevronDown className="w-4 h-4 ml-1" />
              </div>
            </div>

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

        {/* Guides Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7 pt-6">
          {displayGuides.map((guide, index) => {
            const guideSlug = guide.href.split("/").pop();
            const session = sessions.find((s) => s.guides.slug === guideSlug);

            if (session) {
              return (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  key={session.id}
                  className="group bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-xl hover:border-teal-200 transition-all flex flex-col relative overflow-hidden mt-6"
                >
                  {/* Progress bar accent */}
                  {/* <div
                    className="absolute top-0 left-0 h-1.5 bg-teal-500 transition-all duration-1000"
                    style={{ width: `${session.progress_percent}%` }}
                  /> */}

                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-teal-50 rounded-2xl text-teal-600 group-hover:bg-teal-600 group-hover:text-white transition-colors duration-300">
                      <BookOpen size={24} />
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full 
                          ${session.status === "completed" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}
                        >
                          {session.status.replace("_", " ")}
                        </span>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            setSelectedSessionId(session.id);
                            setShowConfirmDelete(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                          title="Delete this progress"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1 font-medium">
                        <Clock size={10} />
                        {new Date(session.last_updated_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 group-hover:text-teal-700 transition-colors mb-2">
                    {session.guides.title}
                  </h3>
                  <p className="text-slate-500 text-sm leading-relaxed mb-6 line-clamp-2">
                    {session.guides.description}
                  </p>

                  <div className="mt-auto">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">
                        Progress
                      </span>
                      <span className="text-xs font-black text-teal-600">
                        {session.progress_percent}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-6">
                      <div
                        className="h-full bg-teal-500 rounded-full transition-all duration-1000"
                        style={{ width: `${session.progress_percent}%` }}
                      />
                    </div>

                    <Link
                      href={`/guides/${session.guides.slug}`}
                      className="flex items-center justify-center gap-2 w-full py-3.5 bg-slate-900 text-white rounded-2xl text-sm font-bold hover:bg-teal-600 transition-all shadow-lg shadow-slate-200 hover:shadow-teal-100 group/btn"
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
                            className="group-hover/btn:scale-110 transition-transform"
                          />
                          Resume Guide
                        </>
                      )}
                      <ChevronRight
                        size={16}
                        className="ml-1 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all"
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
              />
            );
          })}
          {isEmbedded && (
            <AddResourceCard
              href="/pricing?mode=guides"
              label="Add guides"
              index={displayGuides.length}
            />
          )}
          {!isEmbedded && displayGuides.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              No guides found matching your search.
            </div>
          )}
        </div>
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
  }
> = {
  "Pakistan Document": {
    iconBox: "bg-green-600 text-white border-transparent dark:bg-green-500",
    innerBox: "bg-white/20",
    link: "text-green-600 dark:text-green-400",
    borderGradient: "from-green-400 to-green-300 dark:from-green-400 dark:to-green-300",
  },
  "Medical & Exam": {
    iconBox: "bg-teal-600 text-white border-transparent dark:bg-teal-500",
    innerBox: "bg-white/20",
    link: "text-teal-600 dark:text-teal-400",
    borderGradient: "from-teal-400 to-teal-300 dark:from-teal-400 dark:to-teal-300",
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

  const featureLocked =
    !!guide.entitlementFeature && !plan.isLoading && plan.isLocked(guide.entitlementFeature);

  const upgradeTarget: string =
    (guide.entitlementFeature ? plan.entitlement(guide.entitlementFeature).upgradeTarget : null) ??
    "premium";

  // All tier-specific card styles derived from upgradeTarget
  const tierStyle = TIER_CARD_STYLE[upgradeTarget] ?? TIER_CARD_STYLE.premium;
  const tierGradientBorderStyle =
    TIER_GRADIENT_BORDER_STYLE[upgradeTarget] ?? TIER_GRADIENT_BORDER_STYLE.premium;
  const tierIconClass = `plan-icon--${upgradeTarget}`;

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
      ${
        featureLocked
          ? "border border-border cursor-pointer shadow-md hover:-translate-y-1"
          : isNavigable
            ? "border border-border hover:-translate-y-2 hover:shadow-xl cursor-pointer"
            : "border border-border opacity-80 cursor-not-allowed grayscale-[0.5]"
      }
      animate-fade-up`}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Ribbon for locked cards */}
      {featureLocked && (
        <div className="absolute -top-21 -right-12 sm:-right-3 z-20 pointer-events-none">
          <Image
            src="/icons/ribbon.png"
            alt="Premium ribbon"
            width={240}
            height={300}
            priority={false}
            className="w-40 h-56 object-contain drop-shadow-lg"
          />
        </div>
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

      {/* (Removed tier badge — ribbon now indicates locked state) */}

      {/* Border gradient on hover (category color, non-locked only) */}
      {!featureLocked && (
        <div
          className={`absolute inset-0 rounded-[30px] p-[2px] bg-linear-to-br ${styles.borderGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-400 pointer-events-none [mask:linear-gradient(#fff_0_0)_content-box,linear-gradient(#fff_0_0)] mask-exclude`}
        />
      )}

      {/* Radial Glow */}
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
