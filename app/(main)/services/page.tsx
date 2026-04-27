"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Search, ArrowRight, ChevronDown, Crown } from "lucide-react";
import { NAV_DATA } from "@/app/components/layout/navigationData";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/app/context/LanguageContext";
import { usePlan } from "@/app/context/PlanContext";
import { UpgradeModal } from "@/app/components/entitlements/UpgradeModal";

// --- Types ---
interface Service {
  id: string;
  title: string;
  description: string;
  categoryLabel: string;
  categoryId: string;
  href: string;
  icon: React.ReactNode;
  disabled?: boolean;
  /** Entitlement feature key to gate this service. */
  entitlementFeature?: string;
}

/** Maps service ID → entitlement feature key.
 *  Service IDs are derived from: title.toLowerCase().replace(/\s+/g, "-")
 */
const SERVICE_ENTITLEMENT_MAP: Record<string, string> = {
  "book-a-consultation":          "expert_consultation",
  "expert-case-review":           "expert_doc_review",
  "pcc-filing-service-—-sindh":   "pcc_filing",
  "book-medical-appointment":     "medical_booking",
  "urdu-→-english-translation":   "document_translation",
};

interface CategoryOption {
  id: string;
  label: string;
}

// --- Components ---
export default function ServicesPage({
  isEmbedded = false,
}: {
  isEmbedded?: boolean;
}) {
  const { t } = useLanguage();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("All");
  const [visibleCount, setVisibleCount] = useState(7); // Default to all
  const [upgradeModalFeature, setUpgradeModalFeature] = useState<string | null>(null);

  const containerRef = React.useRef<HTMLDivElement>(null);
  const measureRef = React.useRef<HTMLDivElement>(null);

  // Memoize services and categories to avoid recalculation on every render
  const { services, categories } = useMemo(() => {
    const servicesList: Service[] = NAV_DATA.services.tabs.flatMap((tab) =>
      (tab.items || []).map((item) => {
        const id = item.title.toLowerCase().replace(/\s+/g, "-");
        return {
          id,
          title: item.translationKey
            ? t(`navData.services.items.${item.translationKey}.title`)
            : item.title,
          description: item.translationKey
            ? t(`navData.services.items.${item.translationKey}.description`)
            : item.description,
          categoryLabel: tab.translationKey
            ? t(`navData.services.tabs.${tab.translationKey}.label`)
            : tab.label,
          categoryId: tab.id,
          href: item.href,
          icon: item.icon,
          disabled: item.disabled,
          entitlementFeature: SERVICE_ENTITLEMENT_MAP[id],
        };
      }),
    );

    const categoriesList: CategoryOption[] = [
      { id: "All", label: t("pages.services.allCategory") },
      ...NAV_DATA.services.tabs.map((tab) => ({
        id: tab.id,
        label: tab.translationKey
          ? t(`navData.services.tabs.${tab.translationKey}.label`)
          : tab.label,
      })),
    ];

    return { services: servicesList, categories: categoriesList };
  }, [t]);

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
        setVisibleCount(categories.length);
        return;
      }

      // Second pass: Calculate how many fit WITH "More" button
      totalWidth = 0;

      for (let i = 0; i < categoryEls.length; i++) {
        const itemWidth = categoryEls[i].offsetWidth;
        // Check if adding this item + gap + MoreButton exceeds container
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
  }, [categories]);

  const visibleCategories = categories.slice(0, visibleCount);
  const hiddenCategories = categories.slice(visibleCount);
  const isMoreSelected = hiddenCategories.some(
    (c) => c.id === selectedCategoryId,
  );

  const filteredServices = services
    .filter((service) => {
      const matchesSearch =
        service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategoryId === "All" ||
        service.categoryId === selectedCategoryId;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => a.title.localeCompare(b.title));

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
          onConfirm={(action, target) => {
            const plan = typeof target === "string" ? target : "premium";
            window.location.href = `/pricing?plan=${plan}`;
          }}
        />
      )}

      {/* Ambient Glow */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10">
        <div className="absolute top-[10%] left-[15%] w-[500px] h-[500px] bg-[#0d7377]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-[20%] right-[10%] w-[600px] h-[600px] bg-[#32e0c4]/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full site-main-px site-main-py">
        {/* Hero Section */}
        <section
          className={`text-center mb-5 md:mb-10 pt-1`}
        >
          <h1 className="text-3xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-linear-to-r from-foreground to-muted-foreground animate-fade-up">
            {t("pages.services.heroTitle")}
          </h1>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto animate-fade-up [animation-delay:100ms]">
            {t("pages.services.heroDescription")}
          </p>
        </section>

        {/* Search Bar */}
        <div className="relative max-w-lg mx-auto mb-10 animate-scale-in [animation-delay:200ms]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5 pointer-events-none" />
          <input
            type="text"
            placeholder={t("pages.services.searchPlaceholder")}
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
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="px-5 py-2.5 text-sm font-medium whitespace-nowrap border"
              >
                {cat.label}
              </div>
            ))}
            {/* Force render the More button to measure it */}
            <div className="px-5 py-2.5 text-sm font-medium whitespace-nowrap border flex items-center gap-1">
              {t("pages.services.more")}{" "}
              <ChevronDown className="w-4 h-4 ml-1" />
            </div>
          </div>

          {/* Visible Container */}
          <div className="flex flex-wrap gap-3 animate-fade-in [animation-delay:300ms]">
            {visibleCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategoryId(cat.id)}
                className={`px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap border transition-all duration-200 ${
                  selectedCategoryId === cat.id
                    ? "bg-primary text-primary-foreground border-primary shadow-md"
                    : "bg-card text-muted-foreground border-border hover:border-primary hover:bg-primary/5 hover:text-primary"
                }`}
              >
                {cat.label}
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
                    {t("pages.services.more")}{" "}
                    <ChevronDown className="w-4 h-4 ml-1" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-[200px]">
                  {hiddenCategories.map((cat) => (
                    <DropdownMenuItem
                      key={cat.id}
                      onClick={() => setSelectedCategoryId(cat.id)}
                      className={`cursor-pointer ${
                        selectedCategoryId === cat.id
                          ? "bg-primary/10 text-primary font-semibold"
                          : ""
                      }`}
                    >
                      {cat.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-10 gap-x-6 pt-6">
          {filteredServices.length > 0 ? (
            filteredServices.map((service, index) => (
              <ServiceCard
                key={service.id}
                service={service}
                index={index}
                onLockedClick={(feature) => setUpgradeModalFeature(feature)}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              {t("pages.services.noResults")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Service Card Component ---

const CATEGORY_STYLES: Record<
  string,
  {
    iconBox: string;
    innerBox: string;
    link: string;
    borderGradient: string;
  }
> = {
  "expert-help": {
    iconBox: "bg-indigo-600 text-white border-transparent dark:bg-indigo-500",
    innerBox: "bg-white/20",
    link: "text-indigo-600 dark:text-indigo-400",
    borderGradient:
      "from-indigo-400 to-indigo-300 dark:from-indigo-400 dark:to-indigo-300",
  },
  "pakistan-docs-services": {
    iconBox: "bg-emerald-600 text-white border-transparent dark:bg-emerald-500",
    innerBox: "bg-white/20",
    link: "text-emerald-600 dark:text-emerald-400",
    borderGradient:
      "from-emerald-400 to-emerald-300 dark:from-emerald-400 dark:to-emerald-300",
  },
  medical: {
    iconBox: "bg-rose-600 text-white border-transparent dark:bg-rose-500",
    innerBox: "bg-white/20",
    link: "text-rose-600 dark:text-rose-400",
    borderGradient:
      "from-rose-400 to-rose-300 dark:from-rose-400 dark:to-rose-300",
  },
  documents: {
    iconBox: "bg-amber-600 text-white border-transparent dark:bg-amber-500",
    innerBox: "bg-white/20",
    link: "text-amber-600 dark:text-amber-400",
    borderGradient:
      "from-amber-300 to-amber-200 dark:from-amber-300 dark:to-amber-200",
  },
  // Fallback for any other categories
  Default: {
    iconBox: "bg-slate-600 text-white border-transparent dark:bg-slate-500",
    innerBox: "bg-white/20",
    link: "text-slate-600 dark:text-slate-400",
    borderGradient:
      "from-slate-400 to-slate-300 dark:from-slate-400 dark:to-slate-300",
  },
};

function ServiceCard({
  service,
  index,
  onLockedClick,
}: {
  service: Service;
  index: number;
  onLockedClick: (feature: string) => void;
}) {
  const { t } = useLanguage();
  const plan = usePlan();
  const styles =
    CATEGORY_STYLES[service.categoryId] || CATEGORY_STYLES["Default"];

  // Entitlement check
  const featureLocked =
    !!service.entitlementFeature &&
    !plan.isLoading &&
    plan.isLocked(service.entitlementFeature);

  const isNavigable = !service.disabled;
  const CardWrapper = isNavigable ? Link : "div";

  const handleClick = (e: React.MouseEvent) => {
    if (featureLocked && service.entitlementFeature) {
      e.preventDefault();
      onLockedClick(service.entitlementFeature);
    }
  };

  return (
    <CardWrapper
      href={isNavigable ? service.href : "#"}
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
        {React.isValidElement(service.icon)
          ? React.cloneElement(
              service.icon as React.ReactElement<{ className?: string }>,
              { className: "w-6 h-6 stroke-2" },
            )
          : service.icon}
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

      {/* Radial Glow */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-0 bg-[radial-gradient(400px_circle_at_var(--mouse-x,50%)_var(--mouse-y,50%),rgba(13,115,119,0.04),transparent_40%)] dark:bg-[radial-gradient(400px_circle_at_var(--mouse-x,50%)_var(--mouse-y,50%),rgba(255,255,255,0.03),transparent_40%)]" />

      {/* Content */}
      <div className="relative z-10 flex flex-col grow pt-2">
        <h3 className="text-xl font-bold text-foreground mb-1 transition-colors">
          {service.title}
        </h3>
        <div className="mb-3">
          <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground/80 bg-muted px-2 py-0.5 rounded">
            {service.categoryLabel}
          </span>
        </div>
        <p className="text-slate-900 dark:text-white text-sm leading-relaxed mb-6 grow">
          {service.description}
        </p>
      </div>

      {/* Footer / Action */}
      <div className="relative z-10 flex items-center justify-between pt-4 border-t border-border mt-auto">
        <span className="text-xs font-medium text-muted-foreground flex items-center gap-1" />

        {featureLocked ? (
          <span aria-hidden="true" className="h-5" />
        ) : isNavigable ? (
          <span
            className={`text-sm font-semibold flex items-center gap-1.5 group-hover:underline decoration-2 underline-offset-2 ${styles.link}`}
          >
            {t("pages.services.openService")} <ArrowRight className="w-4 h-4" />
          </span>
        ) : (
          <span className="text-sm font-semibold text-muted-foreground/50 flex items-center gap-1.5 cursor-not-allowed">
            {t("pages.services.comingSoon")}
          </span>
        )}
      </div>
    </CardWrapper>
  );
}