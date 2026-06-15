"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, ArrowRight, ChevronDown, X, Shield, Calendar } from "lucide-react";
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
import StatCard from "@/app/components/shared/StatCard";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Loader } from "@/components/ui/spinner";

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

interface PCCRequest {
  id: string;
  request_id: string;
  full_name: string;
  status: string;
  district: string;
  purpose: string;
  province: string;
  admin_notes?: string;
  created_at?: string;
}

interface MedicalAppointment {
  id: string;
  medical_website?: string;
  location: string;
  status: string;
  full_name: string;
  passport_number?: string;
  preferred_date?: string;
  preferred_time?: string;
  notes?: string;
  admin_notes?: string;
  created_at?: string;
}

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
  "pcc-filing-service-—-sindh": "pcc_filing",
  "book-medical-appointment": "medical_booking",
  "urdu-→-english-translation": "document_translation",
};
/** Maps service ID → minimum required plan tier */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const SERVICE_TIER_MAP: Record<string, "basic" | "premium" | "executive"> = {
  "book-a-consultation": "premium",
  // "expert-case-review":           "premium",
  "pcc-filing-service-—-sindh": "executive",
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

  useEffect(() => {
    if (!user) {
      setLoadingStatus(false);
      return;
    }

    const fetchServicesStatus = async () => {
      try {
        const res = await fetch("/api/user-dashboard/services-status");
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
  }, [user]);

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
                  className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider mx-1 ${statusClass}`}
                >
                  Status: {displayStatus}
                </span>
                <Link
                  href="/book-consultation?tab=requests"
                  onClick={(e) => e.stopPropagation()}
                  className="text-teal-650 hover:text-teal-750 dark:text-teal-400 dark:hover:text-teal-350 font-semibold underline underline-offset-2 ml-1"
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
    if (serviceId === "pcc-filing-service-—-sindh") {
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

  // "My Resources" (embedded) view: only the services the user has unlocked
  // (via plan tier or purchased add-ons); free services always show.
  const isOwned = (feature?: string) => !feature || (!plan.isLoading && !plan.isLocked(feature));
  const displayServices = isEmbedded
    ? filteredServices.filter((service) => isOwned(service.entitlementFeature))
    : filteredServices;

  return (
    <div
      className={`bg-background text-foreground font-sans overflow-x-hidden selection:bg-primary selection:text-primary-foreground ${
        isEmbedded ? "" : "pt-16"
      }`}
    >
      {/* Upgrade Modal */}
      {upgradeModalFeature && (
        <UpgradeModal feature={upgradeModalFeature} onClose={() => setUpgradeModalFeature(null)} />
      )}

      {/* Ambient Glow */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10">
        <div className="absolute top-[10%] left-[15%] w-[500px] h-[500px] bg-[#0d7377]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-[20%] right-[10%] w-[600px] h-[600px] bg-[#32e0c4]/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full site-main-px site-main-py">
        {/* Hero Section — hidden in the embedded "My Resources" view */}
        {!isEmbedded && (
          <section className={`text-center mb-5 md:mb-10 pt-1`}>
            <h1 className="text-3xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-linear-to-r from-foreground to-muted-foreground animate-fade-up">
              {t("pages.services.heroTitle")}
            </h1>
            <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto animate-fade-up [animation-delay:100ms]">
              {t("pages.services.heroDescription")}
            </p>
          </section>
        )}

        {/* Search Bar */}
        {!isEmbedded && (
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
        )}

        {/* Categories — hidden in the embedded "My Resources" view */}
        {!isEmbedded && (
          <div ref={containerRef} className="relative w-full mb-8 flex justify-center">
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
                {t("pages.services.more")} <ChevronDown className="w-4 h-4 ml-1" />
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
                      {t("pages.services.more")} <ChevronDown className="w-4 h-4 ml-1" />
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

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-10 gap-x-6 pt-6">
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
            <div className="col-span-full text-center py-12 text-muted-foreground">
              {t("pages.services.noResults")}
            </div>
          )}
        </div>
      </div>

      {/* Dialog modal to show requests and statuses */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="w-[calc(100%-2rem)] md:w-full max-w-2xl bg-white rounded-2xl p-0 shadow-xl max-h-[85vh] overflow-hidden border border-gray-100 flex flex-col text-slate-900">
          {/* Close button in top-right */}
          <button
            onClick={() => setIsModalOpen(false)}
            className="absolute right-4 top-4 rounded-full p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors focus:outline-none z-10060 cursor-pointer"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>

          {selectedModalType === "pcc" ? (
            <>
              {/* Static Header */}
              <div className="flex items-center gap-3 border-b border-gray-100 px-6 py-5 shrink-0 pr-12">
                <Shield className="h-6 w-6 text-teal-650 flex-shrink-0" />
                <div>
                  <DialogTitle className="text-xl font-bold text-gray-900">
                    Sindh PCC Requests
                  </DialogTitle>
                  <DialogDescription className="text-sm text-gray-500 mt-1">
                    Track the status of your Police Character Certificate filing for Sindh.
                  </DialogDescription>
                </div>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto scrollbar-premium px-6 py-5">
                {loadingStatus ? (
                  <div className="flex justify-center py-8">
                    <Loader size="md" />
                  </div>
                ) : pccRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <Shield className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-600 font-medium">No active PCC requests found</p>
                    <p className="text-sm text-gray-400 mt-1 mb-4">
                      You haven&apos;t requested any Sindh PCC filing yet.
                    </p>
                    <button
                      onClick={() => {
                        setIsModalOpen(false);
                        router.push("/police-verification/apply?province=Sindh");
                      }}
                      className="inline-flex items-center justify-center px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium text-sm transition cursor-pointer"
                    >
                      Apply for PCC Sindh
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pccRequests.map((req) => (
                      <div
                        key={req.id}
                        className="border border-gray-200 rounded-xl p-4 bg-gray-50/50 hover:bg-gray-50 transition"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className="font-mono text-xs font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
                              {req.request_id}
                            </span>
                            <h4 className="font-semibold text-gray-900 mt-1">{req.full_name}</h4>
                          </div>
                          <span
                            className={`text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize ${
                              req.status === "completed"
                                ? "bg-green-100 text-green-700"
                                : req.status === "in_progress"
                                  ? "bg-blue-100 text-blue-700"
                                  : req.status === "action_required"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {req.status?.replace("_", " ") || "Pending"}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-500 mt-2 border-t pt-2">
                          <div>
                            <span className="font-medium">District:</span> {req.district}
                          </div>
                          <div>
                            <span className="font-medium">Purpose:</span> {req.purpose}
                          </div>
                          {req.created_at && (
                            <div className="col-span-2 mt-1">
                              <span className="font-medium">Filed On:</span>{" "}
                              {new Date(req.created_at).toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </div>
                          )}
                        </div>
                        {req.admin_notes && (
                          <CollapsibleAdminNotes notes={req.admin_notes} />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Static Header */}
              <div className="flex items-center gap-3 border-b border-gray-100 px-6 py-5 shrink-0 pr-12">
                <Calendar className="h-6 w-6 text-emerald-600 flex-shrink-0" />
                <div>
                  <DialogTitle className="text-xl font-bold text-gray-900">
                    Medical Appointments
                  </DialogTitle>
                  <DialogDescription className="text-sm text-gray-500 mt-1">
                    Manage and view the status of your booked medical examinations.
                  </DialogDescription>
                </div>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto scrollbar-premium px-6 py-5">
                {loadingStatus ? (
                  <div className="flex justify-center py-8">
                    <Loader size="md" />
                  </div>
                ) : medicalAppointments.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-600 font-medium">No medical appointments booked</p>
                    <p className="text-sm text-gray-400 mt-1 mb-4">
                      You haven&apos;t scheduled a medical appointment yet.
                    </p>
                    <button
                      onClick={() => {
                        setIsModalOpen(false);
                        router.push("/book-appointment");
                      }}
                      className="inline-flex items-center justify-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium text-sm transition cursor-pointer"
                    >
                      Book Appointment
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {medicalAppointments.map((appointment) => (
                      <div
                        key={appointment.id}
                        className="border border-gray-200 rounded-xl p-4 bg-gray-50/50 hover:bg-gray-50 transition"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className="font-semibold text-gray-900">
                              {appointment.medical_website || "Medical Examination"}
                            </span>
                            <p className="text-xs text-gray-500 capitalize mt-0.5">
                              Location: {appointment.location}
                            </p>
                          </div>
                          <span
                            className={`text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize ${
                              appointment.status === "completed"
                                ? "bg-green-100 text-green-700"
                                : appointment.status === "in_progress"
                                  ? "bg-blue-100 text-blue-700"
                                  : appointment.status === "cancelled"
                                    ? "bg-gray-100 text-gray-700"
                                    : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {appointment.status || "Pending"}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-500 mt-2 border-t pt-2">
                          <div>
                            <span className="font-medium">Applicant:</span> {appointment.full_name}
                          </div>
                          <div>
                            <span className="font-medium">Passport:</span>{" "}
                            {appointment.passport_number || "N/A"}
                          </div>
                          <div>
                            {appointment.preferred_date
                              ? <><span className="font-medium">Preferred Date:</span>{" "}
                              {new Date(appointment.preferred_date).toLocaleDateString(undefined, {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })}
                              </>
                              : "N/A"}
                          </div>
                          <div>
                            {appointment.preferred_time
                              ? <><span className="font-medium">Preferred Time:</span>{" "}
                              {appointment.preferred_time}
                              </>
                              : "N/A"}
                          </div>
                        </div>
                        {appointment.notes && (
                          <div className="mt-2 text-xs text-gray-600 bg-gray-100/50 p-2 rounded">
                            <span className="font-semibold">Note:</span> {appointment.notes}
                          </div>
                        )}
                        {appointment.admin_notes && (
                          <CollapsibleAdminNotes notes={appointment.admin_notes} />
                        )}
                      </div>
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
  }
> = {
  "expert-help": {
    iconBox: "bg-indigo-600 text-white border-transparent dark:bg-indigo-500",
    innerBox: "bg-white/20",
    link: "text-indigo-600 dark:text-indigo-400",
    borderGradient: "from-indigo-400 to-indigo-300 dark:from-indigo-400 dark:to-indigo-300",
  },
  "pakistan-docs-services": {
    iconBox: "bg-emerald-600 text-white border-transparent dark:bg-emerald-500",
    innerBox: "bg-white/20",
    link: "text-emerald-600 dark:text-emerald-400",
    borderGradient: "from-emerald-400 to-emerald-300 dark:from-emerald-400 dark:to-emerald-300",
  },
  medical: {
    iconBox: "bg-rose-600 text-white border-transparent dark:bg-rose-500",
    innerBox: "bg-white/20",
    link: "text-rose-600 dark:text-rose-400",
    borderGradient: "from-rose-400 to-rose-300 dark:from-rose-400 dark:to-rose-300",
  },
  documents: {
    iconBox: "bg-amber-600 text-white border-transparent dark:bg-amber-500",
    innerBox: "bg-white/20",
    link: "text-amber-600 dark:text-amber-400",
    borderGradient: "from-amber-300 to-amber-200 dark:from-amber-300 dark:to-amber-200",
  },
  // Fallback for any other categories
  Default: {
    iconBox: "bg-slate-600 text-white border-transparent dark:bg-slate-500",
    innerBox: "bg-white/20",
    link: "text-slate-600 dark:text-slate-400",
    borderGradient: "from-slate-400 to-slate-300 dark:from-slate-400 dark:to-slate-300",
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

  // Entitlement check
  const featureLocked =
    !!service.entitlementFeature && !plan.isLoading && plan.isLocked(service.entitlementFeature);
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
            width={260}
            height={320}
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
        {React.isValidElement(service.icon)
          ? React.cloneElement(service.icon as React.ReactElement<{ className?: string }>, {
              className: "w-6 h-6 stroke-2",
            })
          : service.icon}
      </div>

      {/* (Removed tier badge — ribbon now indicates locked state) */}

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

// --- Collapsible Admin Notes component ---
function CollapsibleAdminNotes({ notes }: { notes: string }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="mt-2 border border-teal-100 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 bg-teal-50/70 hover:bg-teal-50 text-xs font-bold text-teal-800 transition-colors focus:outline-none"
      >
        <span>Admin Message</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>
      {isOpen && (
        <div className="px-3 py-2.5 bg-white text-xs text-slate-700 border-t border-teal-50 leading-relaxed">
          {notes}
        </div>
      )}
    </div>
  );
}
