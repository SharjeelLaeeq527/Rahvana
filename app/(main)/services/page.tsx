"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, ArrowRight, ChevronDown, X, Shield, Calendar, Info } from "lucide-react";
import { useRouter } from "next/navigation";
import { NAV_DATA } from "@/app/components/layout/navigationData";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/app/context/LanguageContext";
import { usePlan } from "@/app/context/PlanContext";
import { useAuth } from "@/app/context/AuthContext";
import { UpgradeModal } from "@/app/components/entitlements/UpgradeModal";
import AddResourceCard from "@/components/resources/AddResourceCard";
import ResourceSectionHeader from "@/components/resources/ResourceSectionHeader";
import StatCard from "@/app/components/shared/StatCard";
import { ExpandableTooltip } from "@/app/components/shared/ExpandableTooltip";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Loader } from "@/components/ui/spinner";
import { QuickAccessButton } from "@/app/components/shared/QuickAccessButton";
import { useQuickAccess } from "@/app/context/QuickAccessContext";
import { useCandidate } from "@/app/context/CandidateContext";
import PccRequestCard, { type PccRequestRow } from "@/components/services/PccRequestCard";
import MedicalAppointmentCard, {
  type MedicalAppointmentRow,
} from "@/components/services/MedicalAppointmentCard";

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

// Request row types now live in the shared card components (single source of truth).
type PCCRequest = PccRequestRow;

type MedicalAppointment = MedicalAppointmentRow;

interface ConsultationBooking {
  id: string;
  selected_slot: string;
  status: string;
  created_at?: string;
}

interface TranslationDocument {
  id: string;
  status: string;
  created_at?: string;
}

/** Maps service ID → entitlement feature key.
 *  Service IDs are derived from: title.toLowerCase().replace(/\s+/g, "-")
 */
const SERVICE_ENTITLEMENT_MAP: Record<string, string> = {
  "book-a-consultation": "expert_consultation",
  // "expert-case-review":           "expert_doc_review",
  "pcc-filing-service-, -sindh": "pcc_filing",
  "book-medical-appointment": "medical_booking",
  "urdu-→-english-translation": "document_translation",
};
/** Maps service ID → minimum required plan tier */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const SERVICE_TIER_MAP: Record<string, "basic" | "premium" | "executive"> = {
  "book-a-consultation": "premium",
  // "expert-case-review":           "premium",
  "pcc-filing-service-, -sindh": "executive",
  "book-medical-appointment": "premium",
  "urdu-→-english-translation": "premium",
};

interface CategoryOption {
  id: string;
  label: string;
}

// --- Components ---
export default function ServicesPage({ isEmbedded = false }: { isEmbedded?: boolean }) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("All");
  const [visibleCount, setVisibleCount] = useState(7); // Default to all
  const [upgradeModalFeature, setUpgradeModalFeature] = useState<string | null>(null);
  const plan = usePlan();

  const [pccRequests, setPccRequests] = useState<PCCRequest[]>([]);
  const [medicalAppointments, setMedicalAppointments] = useState<MedicalAppointment[]>([]);
  const [consultationBookings, setConsultationBookings] = useState<ConsultationBooking[]>([]);
  const [translationDocuments, setTranslationDocuments] = useState<TranslationDocument[]>([]);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedModalType, setSelectedModalType] = useState<"pcc" | "medical" | null>(null);

  const { activeCandidate, activeCandidateId, isMultiCandidate } = useCandidate();

  useEffect(() => {
    if (!user) {
      setLoadingStatus(false);
      return;
    }

    const fetchServicesStatus = async () => {
      try {
        setLoadingStatus(true);
        const url = activeCandidateId
          ? `/api/user-dashboard/services-status?candidateId=${encodeURIComponent(activeCandidateId)}`
          : "/api/user-dashboard/services-status";
        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to fetch services status");
        const data = await res.json();
        setPccRequests(data.pccRequests || []);
        setMedicalAppointments(data.medicalAppointments || []);
        setConsultationBookings(data.consultationBookings || []);
        setTranslationDocuments(data.translationDocuments || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingStatus(false);
      }
    };

    fetchServicesStatus();
  }, [user, activeCandidateId]);

  const getActiveBookingData = (serviceId: string) => {
    if (!user) return null;

    if (serviceId === "expert-consultation" || serviceId === "book-a-consultation") {
      if (consultationBookings.length > 0) {
        // Find upcoming consultation booking (future and not cancelled)
        const now = new Date();
        const upcoming =
          consultationBookings
            .filter(
              (b: ConsultationBooking) =>
                new Date(b.selected_slot) >= now && b.status !== "canceled"
            )
            .sort(
              (a: ConsultationBooking, b: ConsultationBooking) =>
                new Date(a.selected_slot).getTime() - new Date(b.selected_slot).getTime()
            )[0] || consultationBookings[0];

        const slotDate = upcoming ? new Date(upcoming.selected_slot) : null;
        const formattedDate = slotDate
          ? slotDate.toLocaleDateString(undefined, {
              weekday: "short",
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "N/A";

        const statusMap: Record<string, string> = {
          pending_approval: "Pending Approval",
          alternatives_proposed: "Alternatives Proposed",
          needs_more_info: "Needs Info",
          confirmed: "Confirmed",
          completed: "Completed",
          canceled: "Canceled",
        };
        const rawStatus = upcoming?.status || "pending_approval";
        const displayStatus = statusMap[rawStatus] || rawStatus;

        const badgeColors: Record<string, string> = {
          pending_approval: "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400",
          alternatives_proposed: "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400",
          needs_more_info: "bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400",
          confirmed: "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400",
          completed: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
          canceled: "bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400",
        };
        const statusClass = badgeColors[rawStatus] || "bg-gray-100 text-gray-700";

        return {
          count: consultationBookings.length,
          countLabel: consultationBookings.length === 1 ? "session booked" : "sessions booked",
          href: "/book-consultation?tab=requests",
          description: (
            <span className="block text-slate-600 dark:text-slate-300">
              Next session:{" "}
              <span className="font-semibold text-slate-800 dark:text-slate-100">
                {formattedDate}
              </span>{" "}
              <div className="flex items-center justify-between">
                <span
                  className={`mx-1 inline-block rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wider uppercase ${statusClass}`}
                >
                  Status: {displayStatus}
                </span>
                <Link
                  href="/book-consultation?tab=requests"
                  onClick={(e) => e.stopPropagation()}
                  className="text-teal-650 hover:text-teal-750 dark:hover:text-teal-350 ml-1 font-semibold underline underline-offset-2 dark:text-teal-400"
                >
                  Show all requests
                </Link>
              </div>
            </span>
          ),
          actionButton: {
            label: "Book New Session",
            href: "/book-consultation",
          },
        };
      }
    }
    if (serviceId === "pcc-filing-service-, -sindh") {
      if (pccRequests.length > 0) {
        return {
          count: pccRequests.length,
          countLabel: pccRequests.length === 1 ? "request filed" : "requests filed",
          onClick: () => {
            setSelectedModalType("pcc");
            setIsModalOpen(true);
          },
          description:
            "Your Sindh PCC filing request is currently " +
            (pccRequests[0]?.status?.replace("_", " ") || "pending") +
            ". Click to track status.",
          actionButton: {
            label: "Apply for PCC Sindh",
            href: "/police-verification/apply?province=Sindh",
          },
        };
      }
    }
    if (serviceId === "book-medical-appointment") {
      if (medicalAppointments.length > 0) {
        return {
          count: medicalAppointments.length,
          countLabel:
            medicalAppointments.length === 1 ? "appointment booked" : "appointments booked",
          onClick: () => {
            setSelectedModalType("medical");
            setIsModalOpen(true);
          },
          description:
            "Your medical appointment status is currently " +
            (medicalAppointments[0]?.status || "pending") +
            ". Click to manage details.",
          actionButton: {
            label: "Book Appointment",
            href: "/book-appointment",
          },
        };
      }
    }
    if (serviceId === "urdu-→-english-translation") {
      if (translationDocuments.length > 0) {
        return {
          count: translationDocuments.length,
          countLabel:
            translationDocuments.length === 1 ? "translation requested" : "translations requested",
          href: "/document-translation/my-requests",
          description:
            "Your translation request is currently " +
            (translationDocuments[0]?.status?.replace("_", " ") || "pending") +
            ". Click to view progress.",
          actionButton: {
            label: "Request Translation",
            href: "/document-translation",
          },
        };
      }
    }
    return null;
  };

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
      })
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
      const measureItems = Array.from(measureRef.current.children) as HTMLDivElement[];

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

    // Add resize listener
    const observer = new ResizeObserver(calculateVisible);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [categories]);

  const visibleCategories = categories.slice(0, visibleCount);
  const hiddenCategories = categories.slice(visibleCount);
  const isMoreSelected = hiddenCategories.some((c) => c.id === selectedCategoryId);

  const filteredServices = services
    .filter((service) => {
      const matchesSearch =
        service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategoryId === "All" || service.categoryId === selectedCategoryId;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => a.title.localeCompare(b.title));

  // "My Resources" (embedded) view splits the catalog into two sections:
  //  • "My Services"     — services the user owns (plan/add-ons) OR has an active booking
  //  • "Browse Services" — everything else, shown as locked/"Unlock" cards to explore
  const isOwned = (feature?: string) => !feature || (!plan.isLoading && !plan.isLocked(feature));
  const hasBooking = (service: Service) => getActiveBookingData(service.id) !== null;
  // A service with an active request/booking belongs in "My Services" even if locked.
  const isMine = (service: Service) => isOwned(service.entitlementFeature) || hasBooking(service);
  const ownedServices = filteredServices.filter(isMine);
  const browseServices = filteredServices.filter((service) => !isMine(service));
  // Embedded "My Resources" shows owned/booked in the first grid; the standalone
  // page shows the full filtered list.
  const displayServices = isEmbedded ? ownedServices : filteredServices;

  return (
    <div
      className={`bg-background text-foreground selection:bg-primary selection:text-primary-foreground overflow-x-hidden font-sans ${
        isEmbedded ? "" : "pt-16"
      }`}
    >
      {/* Upgrade Modal */}
      {upgradeModalFeature && (
        <UpgradeModal feature={upgradeModalFeature} onClose={() => setUpgradeModalFeature(null)} />
      )}

      {/* Ambient Glow */}
      <div className="pointer-events-none fixed top-0 left-0 -z-10 h-full w-full">
        <div className="absolute top-[10%] left-[15%] h-[500px] w-[500px] rounded-full bg-[#0d7377]/5 blur-3xl" />
        <div className="absolute right-[10%] bottom-[20%] h-[600px] w-[600px] rounded-full bg-[#32e0c4]/5 blur-3xl" />
      </div>

      <div className="site-main-px site-main-py w-full">
        {/* Hero Section — hidden in the embedded "My Resources" view */}
        {!isEmbedded && (
          <section className={`mb-4 pt-1 text-center md:mb-6`}>
            <h1 className="from-foreground to-muted-foreground animate-fade-up mb-4 bg-linear-to-r bg-clip-text text-3xl font-bold text-transparent md:text-5xl">
              {t("pages.services.heroTitle")}
            </h1>
            <p className="text-muted-foreground animate-fade-up mx-auto max-w-2xl text-base [animation-delay:100ms] md:text-lg">
              {t("pages.services.heroDescription")}
            </p>
          </section>
        )}

        {/* Active Candidate Context Indicator (Global Switcher reactive) */}
        {isMultiCandidate && (
          <div className="mb-6 flex justify-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50/90 px-3.5 py-1.5 text-xs font-semibold text-teal-800 shadow-sm backdrop-blur-sm dark:border-teal-900/60 dark:bg-teal-950/40 dark:text-teal-300">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-teal-500" />
              <span>
                Showing service requests & applications for:{" "}
                <strong className="text-teal-950 dark:text-teal-100">
                  {activeCandidate.label || "Beneficiary"} (
                  {activeCandidate.fullName || "Primary Candidate"})
                </strong>
              </span>
            </div>
          </div>
        )}

        {/* Search Bar */}
        {!isEmbedded && (
          <div className="animate-scale-in relative mx-auto mb-10 max-w-lg [animation-delay:200ms]">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2" />
            <input
              type="text"
              placeholder={t("pages.services.searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-card border-border text-foreground focus:border-primary focus:ring-primary/10 placeholder:text-muted-foreground w-full rounded-full border-2 py-3 pr-4 pl-11 shadow-sm transition-all focus:ring-4 focus:outline-none"
            />
          </div>
        )}

        {/* Categories — hidden in the embedded "My Resources" view */}
        {!isEmbedded && (
          <div ref={containerRef} className="relative mb-8 flex w-full justify-center">
            {/* Hidden container for measuring */}
            <div
              ref={measureRef}
              aria-hidden="true"
              className="pointer-events-none absolute top-0 left-0 z-[-1] flex w-full flex-wrap gap-3 opacity-0"
            >
              {/* Render all categories to measure them */}
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="border px-5 py-2.5 text-sm font-medium whitespace-nowrap"
                >
                  {cat.label}
                </div>
              ))}
              {/* Force render the More button to measure it */}
              <div className="flex items-center gap-1 border px-5 py-2.5 text-sm font-medium whitespace-nowrap">
                {t("pages.services.more")} <ChevronDown className="ml-1 h-4 w-4" />
              </div>
            </div>

            {/* Visible Container */}
            <div className="animate-fade-in flex flex-wrap gap-3 [animation-delay:300ms]">
              {visibleCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategoryId(cat.id)}
                  className={`rounded-full border px-5 py-2.5 text-sm font-medium whitespace-nowrap transition-all duration-200 ${
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
                      className={`flex items-center gap-1 rounded-full border px-5 py-2.5 text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                        isMoreSelected
                          ? "bg-primary text-primary-foreground border-primary shadow-md"
                          : "bg-card text-muted-foreground border-border hover:border-primary hover:bg-primary/5 hover:text-primary"
                      }`}
                    >
                      {t("pages.services.more")} <ChevronDown className="ml-1 h-4 w-4" />
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
        )}

        {/* Journey-scope explainer — embedded "My Resources" view only. Mirrors the
            banner in EmbeddedToolContainer so both surfaces tell the same story. */}
        {isEmbedded && (
          <div className="-mt-8">
            <ExpandableTooltip
              icon={<Info size={12} />}
              title="Requests filed inside a Journey"
              message="Anything you book or file from within a journey (via its steps or toolbox) is tagged to that journey and only appears there. This tab lists requests you made directly, outside any journey."
              defaultOpen={true}
            />
          </div>
        )}

        {/* My Services — owned or with an active booking (embedded view only) */}
        {isEmbedded && (
          <ResourceSectionHeader
            title="My Services"
            subtitle="Services you've unlocked or already have an active request for."
          />
        )}

        {/* Services Grid */}
        <div className="grid grid-cols-1 gap-x-6 gap-y-10 pt-6 md:grid-cols-2 lg:grid-cols-3">
          {displayServices.map((service, index) => {
            const bookingData = getActiveBookingData(service.id);
            if (bookingData) {
              return (
                <div key={service.id} className="mt-6">
                  <StatCard
                    title={service.title}
                    icon={
                      React.isValidElement(service.icon)
                        ? React.cloneElement(
                            service.icon as React.ReactElement<{ className?: string }>,
                            {
                              className: "h-5 w-5",
                            }
                          )
                        : service.icon
                    }
                    status="live"
                    count={bookingData.count}
                    countLabel={bookingData.countLabel}
                    description={bookingData.description}
                    extraContent={bookingData.extraContent}
                    quickAccessButton={
                      <QuickAccessButton
                        item={{
                          id: `service-${service.id}`,
                          title: service.title,
                          href: service.href,
                          icon_name: (() => {
                            const mapping: Record<string, string> = {
                              "book-a-consultation": "Briefcase",
                              "pcc-filing-service-, -sindh": "Shield",
                              "book-medical-appointment": "Clock",
                              "urdu-→-english-translation": "Files",
                            };
                            return mapping[service.id] || "Briefcase";
                          })(),
                        }}
                        mode="icon"
                      />
                    }
                    actionButton={bookingData.actionButton}
                    onClick={() => {
                      if (bookingData.onClick) {
                        bookingData.onClick();
                      } else if (bookingData.href) {
                        router.push(bookingData.href);
                      }
                    }}
                  />
                </div>
              );
            }

            return (
              <ServiceCard
                key={service.id}
                service={service}
                index={index}
                onLockedClick={(feature) => setUpgradeModalFeature(feature)}
              />
            );
          })}
          {isEmbedded && (
            <AddResourceCard
              href="/pricing?mode=services"
              label="Add service"
              index={displayServices.length}
            />
          )}
          {!isEmbedded && displayServices.length === 0 && (
            <div className="text-muted-foreground col-span-full py-12 text-center">
              {t("pages.services.noResults")}
            </div>
          )}
        </div>

        {/* Browse Services — everything not yet owned (embedded view only) */}
        {isEmbedded && browseServices.length > 0 && (
          <>
            <ResourceSectionHeader
              title="Browse Services"
              subtitle="Explore more services, unlock them when you're ready."
            />
            <div className="grid grid-cols-1 gap-x-6 gap-y-10 pt-6 md:grid-cols-2 lg:grid-cols-3">
              {browseServices.map((service, index) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  index={index}
                  onLockedClick={(feature) => setUpgradeModalFeature(feature)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Dialog modal to show requests and statuses */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="flex max-h-[85vh] w-[calc(100%-2rem)] max-w-2xl flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white p-0 text-slate-900 shadow-xl md:w-full">
          {/* Close button in top-right */}
          <button
            onClick={() => setIsModalOpen(false)}
            className="absolute top-4 right-4 z-10060 cursor-pointer rounded-full p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 focus:outline-none"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>

          {selectedModalType === "pcc" ? (
            <>
              {/* Static Header */}
              <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-6 py-5 pr-12">
                <div className="flex items-center gap-3">
                  <Shield className="text-teal-650 h-6 w-6 flex-shrink-0" />
                  <div>
                    <DialogTitle className="text-xl font-bold text-gray-900">
                      Sindh PCC Requests
                    </DialogTitle>
                    <DialogDescription className="mt-1 text-sm text-gray-500">
                      Track the status of your Police Character Certificate filing for Sindh.
                    </DialogDescription>
                  </div>
                </div>
                {isMultiCandidate && (
                  <span className="hidden items-center gap-1.5 rounded-full border border-teal-200 bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-800 sm:inline-flex">
                    <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
                    {activeCandidate.label || "Beneficiary"}:{" "}
                    {activeCandidate.fullName || "Primary"}
                  </span>
                )}
              </div>

              {/* Scrollable Content */}
              <div className="scrollbar-premium flex-1 overflow-y-auto px-6 py-5">
                {loadingStatus ? (
                  <div className="flex justify-center py-8">
                    <Loader size="md" />
                  </div>
                ) : pccRequests.length === 0 ? (
                  <div className="py-8 text-center">
                    <Shield className="mx-auto mb-3 h-12 w-12 text-gray-300" />
                    <p className="font-medium text-gray-600">No active PCC requests found</p>
                    <p className="mt-1 mb-4 text-sm text-gray-400">
                      You haven&apos;t requested any Sindh PCC filing yet.
                    </p>
                    <button
                      onClick={() => {
                        setIsModalOpen(false);
                        router.push("/police-verification/apply?province=Sindh");
                      }}
                      className="inline-flex cursor-pointer items-center justify-center rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-700"
                    >
                      Apply for PCC Sindh
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pccRequests.map((req) => (
                      <PccRequestCard key={req.id} req={req} />
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Static Header */}
              <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-6 py-5 pr-12">
                <div className="flex items-center gap-3">
                  <Calendar className="h-6 w-6 flex-shrink-0 text-emerald-600" />
                  <div>
                    <DialogTitle className="text-xl font-bold text-gray-900">
                      Medical Appointments
                    </DialogTitle>
                    <DialogDescription className="mt-1 text-sm text-gray-500">
                      Manage and view the status of your booked medical examinations.
                    </DialogDescription>
                  </div>
                </div>
                {isMultiCandidate && (
                  <span className="hidden items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 sm:inline-flex">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    {activeCandidate.label || "Beneficiary"}:{" "}
                    {activeCandidate.fullName || "Primary"}
                  </span>
                )}
              </div>

              {/* Scrollable Content */}
              <div className="scrollbar-premium flex-1 overflow-y-auto px-6 py-5">
                {loadingStatus ? (
                  <div className="flex justify-center py-8">
                    <Loader size="md" />
                  </div>
                ) : medicalAppointments.length === 0 ? (
                  <div className="py-8 text-center">
                    <Calendar className="mx-auto mb-3 h-12 w-12 text-gray-300" />
                    <p className="font-medium text-gray-600">No medical appointments booked</p>
                    <p className="mt-1 mb-4 text-sm text-gray-400">
                      You haven&apos;t scheduled a medical appointment yet.
                    </p>
                    <button
                      onClick={() => {
                        setIsModalOpen(false);
                        router.push("/book-appointment");
                      }}
                      className="inline-flex cursor-pointer items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
                    >
                      Book Appointment
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {medicalAppointments.map((appointment) => (
                      <MedicalAppointmentCard key={appointment.id} appointment={appointment} />
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
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
    hoverBg: string;
    hoverBorder: string;
  }
> = {
  "expert-help": {
    iconBox: "bg-indigo-600 text-white border-transparent dark:bg-indigo-500",
    innerBox: "bg-white/20",
    link: "text-indigo-600 dark:text-indigo-400",
    borderGradient: "from-indigo-400 to-indigo-300 dark:from-indigo-400 dark:to-indigo-300",
    hoverBg: "group-hover:bg-indigo-100 dark:group-hover:bg-indigo-950/10",
    hoverBorder: "group-hover:border-indigo-500/30 dark:group-hover:border-indigo-500/20",
  },
  "pakistan-docs-services": {
    iconBox: "bg-emerald-600 text-white border-transparent dark:bg-emerald-500",
    innerBox: "bg-white/20",
    link: "text-emerald-600 dark:text-emerald-400",
    borderGradient: "from-emerald-400 to-emerald-300 dark:from-emerald-400 dark:to-emerald-300",
    hoverBg: "group-hover:bg-emerald-100 dark:group-hover:bg-emerald-950/10",
    hoverBorder: "group-hover:border-emerald-500/30 dark:group-hover:border-emerald-500/20",
  },
  medical: {
    iconBox: "bg-rose-600 text-white border-transparent dark:bg-rose-500",
    innerBox: "bg-white/20",
    link: "text-rose-600 dark:text-rose-400",
    borderGradient: "from-rose-400 to-rose-300 dark:from-rose-400 dark:to-rose-300",
    hoverBg: "group-hover:bg-rose-100 dark:group-hover:bg-rose-950/10",
    hoverBorder: "group-hover:border-rose-500/30 dark:group-hover:border-rose-500/20",
  },
  documents: {
    iconBox: "bg-amber-600 text-white border-transparent dark:bg-amber-500",
    innerBox: "bg-white/20",
    link: "text-amber-600 dark:text-amber-400",
    borderGradient: "from-amber-300 to-amber-200 dark:from-amber-300 dark:to-amber-200",
    hoverBg: "group-hover:bg-amber-100 dark:group-hover:bg-amber-950/10",
    hoverBorder: "group-hover:border-amber-500/30 dark:group-hover:border-amber-500/20",
  },
  // Fallback for any other categories
  Default: {
    iconBox: "bg-slate-600 text-white border-transparent dark:bg-slate-500",
    innerBox: "bg-white/20",
    link: "text-slate-600 dark:text-slate-400",
    borderGradient: "from-slate-400 to-slate-300 dark:from-slate-400 dark:to-slate-300",
    hoverBg: "group-hover:bg-slate-100 dark:group-hover:bg-slate-950/10",
    hoverBorder: "group-hover:border-slate-500/30 dark:group-hover:border-slate-500/20",
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
  const styles = CATEGORY_STYLES[service.categoryId] || CATEGORY_STYLES["Default"];
  const { isInQuickAccess } = useQuickAccess();

  // Entitlement check
  const featureLocked =
    !!service.entitlementFeature && !plan.isLoading && plan.isLocked(service.entitlementFeature);
  const isNavigable = !service.disabled;

  const isPinned = isInQuickAccess(`service-${service.id}`);

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
      className={`group bg-card relative mx-2 mt-6 flex flex-col rounded-[30px] p-6 pt-7 transition-all duration-400 ease-[cubic-bezier(0.175,0.885,0.32,1.275)] md:mx-0 ${
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
        <div className="pointer-events-none absolute -top-21 -right-12 z-20 sm:-right-3">
          <Image
            src="/icons/ribbon.png"
            alt="Premium ribbon"
            width={260}
            height={320}
            priority={false}
            className="h-56 w-40 object-contain drop-shadow-lg"
          />
        </div>
      )}

      {/* Floating Icon Box */}
      <div
        className={`absolute -top-6 left-6 z-10 flex h-12 w-12 items-center justify-center rounded-2xl border shadow-md transition-all duration-400 group-hover:-translate-y-1 group-hover:-rotate-3 group-hover:shadow-lg md:h-14 md:w-14 ${styles.iconBox}`}
      >
        <div
          className={`absolute inset-1 -z-10 rounded-[10px] transition-colors duration-300 ${styles.innerBox}`}
        />
        {React.isValidElement(service.icon)
          ? React.cloneElement(service.icon as React.ReactElement<{ className?: string }>, {
              className: "w-5 h-5 md:w-6 md:h-6 stroke-2",
            })
          : service.icon}
      </div>

      {/* (Removed tier badge — ribbon now indicates locked state) */}

      {/* Hover overlay with light category-specific background & border */}
      {!featureLocked && (
        <div
          className={`pointer-events-none absolute inset-0 z-0 rounded-[30px] border border-transparent transition-all duration-400 ${styles.hoverBg} ${styles.hoverBorder}`}
        />
      )}

      {/* Radial Glow */}
      <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(400px_circle_at_var(--mouse-x,50%)_var(--mouse-y,50%),rgba(13,115,119,0.04),transparent_40%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:bg-[radial-gradient(400px_circle_at_var(--mouse-x,50%)_var(--mouse-y,50%),rgba(255,255,255,0.03),transparent_40%)]" />

      {/* Content */}
      <div className="relative z-10 flex grow flex-col pt-2">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-foreground mb-1 text-xl font-bold transition-colors">
            {service.title}
          </h3>
          {!featureLocked && (
            <div className="relative z-50 shrink-0">
              <QuickAccessButton
                item={{
                  id: `service-${service.id}`,
                  title: service.title,
                  href: service.href,
                  icon_name: (() => {
                    const mapping: Record<string, string> = {
                      "book-a-consultation": "Briefcase",
                      "pcc-filing-service-, -sindh": "Shield",
                      "book-medical-appointment": "Clock",
                      "urdu-→-english-translation": "Files",
                    };
                    return mapping[service.id] || "Briefcase";
                  })(),
                }}
                mode="icon"
              />
            </div>
          )}
        </div>
        <div className="mb-3">
          <span className="text-muted-foreground/80 bg-muted rounded px-2 py-0.5 text-[11px] font-bold tracking-wide uppercase">
            {service.categoryLabel}
          </span>
        </div>
        <p className="mb-6 grow text-sm leading-relaxed text-slate-900 dark:text-white">
          {service.description}
        </p>
      </div>

      {/* Footer / Action */}
      <div className="border-border relative z-10 mt-auto flex items-center justify-between border-t pt-4">
        <span className="text-muted-foreground flex items-center gap-1 text-xs font-medium" />

        {featureLocked ? (
          <span aria-hidden="true" className="h-5" />
        ) : isNavigable ? (
          <span
            className={`flex items-center gap-1.5 text-sm font-semibold decoration-2 underline-offset-2 group-hover:underline ${styles.link}`}
          >
            {t("pages.services.openService")} <ArrowRight className="h-4 w-4" />
          </span>
        ) : (
          <span className="text-muted-foreground/50 flex cursor-not-allowed items-center gap-1.5 text-sm font-semibold">
            {t("pages.services.comingSoon")}
          </span>
        )}
      </div>
    </CardWrapper>
  );
}

// --- Collapsible Admin Notes: shared component from @/components/services/PccRequestCard ---
