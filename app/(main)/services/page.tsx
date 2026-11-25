"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { X, Shield, Calendar, Video } from "lucide-react";
import { useRouter } from "next/navigation";
import { NAV_DATA } from "@/app/components/layout/navigationData";
import { getServiceCatalogItem, withPreviewMode } from "@/lib/wallet/resourceMapping";
import type { WalletCatalogItem } from "@/lib/wallet/catalog";
import { CreditLaunchModal } from "@/app/components/wallet/CreditLaunchModal";
import { useLanguage } from "@/app/context/LanguageContext";
import { useAuth } from "@/app/context/AuthContext";
import { UpgradeModal } from "@/app/components/entitlements/UpgradeModal";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Loader } from "@/components/ui/spinner";
import { QuickAccessButton } from "@/app/components/shared/QuickAccessButton";
import { useCandidate } from "@/app/context/CandidateContext";
import PccRequestCard, { type PccRequestRow } from "@/components/services/PccRequestCard";
import MedicalAppointmentCard, {
  type MedicalAppointmentRow,
} from "@/components/services/MedicalAppointmentCard";
import ConsultationRequestCard, {
  type ConsultationRow,
} from "@/components/services/ConsultationRequestCard";
import CreditInfoTooltip from "@/components/resources/CreditInfoTooltip";
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
  SERVICE_CATEGORY_PALETTES,
} from "@/components/resources/catalog";

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

// 7.11 — single source of truth for the row shape lives in the shared card component.
type ConsultationBooking = ConsultationRow;

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
  "expert-consultation": "expert_consultation",
  // "expert-case-review":           "expert_doc_review",
  "pcc-filing-service-, -sindh": "pcc_filing",
  "pcc-filing-service,-sindh": "pcc_filing",
  "pcc-filing-service": "pcc_filing",
  "book-medical-appointment": "medical_booking",
  "urdu-→-english-translation": "document_translation",
  "document-translation": "document_translation",
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
  const [upgradeModalFeature, setUpgradeModalFeature] = useState<string | null>(null);
  const [launchTarget, setLaunchTarget] = useState<{
    item: WalletCatalogItem;
    href: string;
  } | null>(null);

  const [pccRequests, setPccRequests] = useState<PCCRequest[]>([]);
  const [medicalAppointments, setMedicalAppointments] = useState<MedicalAppointment[]>([]);
  const [consultationBookings, setConsultationBookings] = useState<ConsultationBooking[]>([]);
  const [translationDocuments, setTranslationDocuments] = useState<TranslationDocument[]>([]);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedModalType, setSelectedModalType] = useState<
    "pcc" | "medical" | "consultation" | null
  >(null);

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
                !!b.selected_slot &&
                new Date(b.selected_slot as string) >= now &&
                b.status !== "canceled"
            )
            .sort(
              (a: ConsultationBooking, b: ConsultationBooking) =>
                new Date(a.selected_slot ?? 0).getTime() - new Date(b.selected_slot ?? 0).getTime()
            )[0] || consultationBookings[0];

        const slotDate = upcoming?.selected_slot ? new Date(upcoming.selected_slot) : null;
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
          extraContent: undefined as React.ReactNode,
          onClick: () => {
            setSelectedModalType("consultation");
            setIsModalOpen(true);
          },
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
    if (
      serviceId === "pcc-filing-service-, -sindh" ||
      serviceId === "pcc-filing-service,-sindh" ||
      serviceId === "pcc-filing-service"
    ) {
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
  //  • "My Services"     — services the user has an active request or booking for
  //  • "Browse Services" — all other services with Preview & Launch dual CTAs
  const hasBooking = (service: Service) => getActiveBookingData(service.id) !== null;
  const bookedServices = filteredServices.filter(hasBooking);
  const browseServices = filteredServices.filter((service) => !hasBooking(service));
  const displayServices = isEmbedded ? bookedServices : filteredServices;

  const renderServiceCard = (service: Service, index: number) => {
    const bookingData = getActiveBookingData(service.id);
    if (bookingData) {
      return (
        <BookedServiceCard
          key={service.id}
          service={service}
          index={index}
          booking={bookingData}
          onOpen={() => {
            if (bookingData.onClick) {
              bookingData.onClick();
            } else if (bookingData.href) {
              router.push(bookingData.href);
            }
          }}
        />
      );
    }
    return (
      <ServiceCard
        key={service.id}
        service={service}
        index={index}
        onLockedClick={(feature) => setUpgradeModalFeature(feature)}
        onLaunch={() => router.push(service.href)}
      />
    );
  };

  // Who the requests belong to, folded into the section subtitle instead of a separate pill.
  const forCandidate =
    isMultiCandidate && activeCandidate?.label ? ` For ${activeCandidate.label}.` : "";

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

  const content = isEmbedded ? (
    <div className="text-[#16302C]">
      <CatalogSection
        title="My Services"
        subtitle={`Requests you made outside a Journey (Journey requests stay in that Journey).${forCandidate}`}
        count={displayServices.length}
      >
        <CatalogGrid>
          {displayServices.map((service, index) => renderServiceCard(service, index))}
          {displayServices.length === 0 && (
            <CatalogEmpty>
              No active requests yet. Book a service below and it will show up here.
            </CatalogEmpty>
          )}
        </CatalogGrid>
      </CatalogSection>

      {browseServices.length > 0 && (
        <CatalogSection
          title="Browse Services"
          subtitle="Explore more services, preview them or book with credits."
          count={browseServices.length}
        >
          <CatalogGrid>
            {browseServices.map((service, index) => (
              <ServiceCard
                key={service.id}
                service={service}
                index={index}
                onLockedClick={(feature) => setUpgradeModalFeature(feature)}
                onLaunch={() => router.push(service.href)}
              />
            ))}
          </CatalogGrid>
        </CatalogSection>
      )}
    </div>
  ) : (
    <CatalogShell
      eyebrow="Rahvana services"
      title={t("pages.services.heroTitle")}
      tagline={t("pages.services.heroDescription")}
      bandContent={
        <CatalogSearch
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder={t("pages.services.searchPlaceholder")}
        />
      }
      toolbar={
        <CatalogToolbar>
          <CatalogFilters
            label="Service categories"
            options={categories}
            value={selectedCategoryId}
            onChange={setSelectedCategoryId}
          />
        </CatalogToolbar>
      }
    >
      <CatalogGrid>
        {displayServices.map((service, index) => renderServiceCard(service, index))}
        {displayServices.length === 0 && (
          <CatalogEmpty>{t("pages.services.noResults")}</CatalogEmpty>
        )}
      </CatalogGrid>
    </CatalogShell>
  );

  return (
    <>
      {modals}
      {content}

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
                  <Shield className="h-6 w-6 flex-shrink-0 text-[#4A5BB5]" />
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
                      className="inline-flex cursor-pointer items-center justify-center rounded-lg bg-[#4A5BB5] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#232E6B]"
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
          ) : selectedModalType === "consultation" ? (
            <>
              {/* Static Header — same anatomy as the PCC / medical dialogs */}
              <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-6 py-5 pr-12">
                <div className="flex items-center gap-3">
                  <Video className="h-6 w-6 flex-shrink-0 text-teal-600" />
                  <div>
                    <DialogTitle className="text-xl font-bold text-gray-900">
                      Expert Consultations
                    </DialogTitle>
                    <DialogDescription className="mt-1 text-sm text-gray-500">
                      Track the status of your booked expert consultation sessions.
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
                ) : consultationBookings.length === 0 ? (
                  <div className="py-8 text-center">
                    <Video className="mx-auto mb-3 h-12 w-12 text-gray-300" />
                    <p className="font-medium text-gray-600">No consultation bookings found</p>
                    <p className="mt-1 mb-4 text-sm text-gray-400">
                      You haven&apos;t booked an expert consultation yet.
                    </p>
                    <button
                      onClick={() => {
                        setIsModalOpen(false);
                        router.push("/book-consultation");
                      }}
                      className="inline-flex cursor-pointer items-center justify-center rounded-lg bg-[#0F8F80] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#0A4F49]"
                    >
                      Book Consultation
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {consultationBookings.map((req) => (
                      <ConsultationRequestCard key={req.id} req={req} />
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
                  <Calendar className="h-6 w-6 flex-shrink-0 text-[#C4534B]" />
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
                      className="inline-flex cursor-pointer items-center justify-center rounded-lg bg-[#C4534B] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#6E2420]"
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
    </>
  );
}

// --- Service cards ---

const QUICK_ACCESS_ICONS: Record<string, string> = {
  "book-a-consultation": "Briefcase",
  "expert-consultation": "Briefcase",
  "pcc-filing-service-, -sindh": "Shield",
  "pcc-filing-service,-sindh": "Shield",
  "pcc-filing-service": "Shield",
  "book-medical-appointment": "Clock",
  "urdu-→-english-translation": "Files",
  "document-translation": "Files",
};

const servicePalette = (service: Service) =>
  SERVICE_CATEGORY_PALETTES[service.categoryId] ?? CATALOG_BAND_PALETTE;

function ServiceQuickAccess({ service }: { service: Service }) {
  return (
    <QuickAccessButton
      item={{
        id: `service-${service.id}`,
        title: service.title,
        href: service.href,
        icon_name: QUICK_ACCESS_ICONS[service.id] || "Briefcase",
      }}
      mode="icon"
    />
  );
}

interface BookingSummary {
  count: number;
  countLabel: string;
  description?: React.ReactNode;
  extraContent?: React.ReactNode;
  actionButton?: { label: string; href: string };
}

/** A service the user already has requests for: count, latest status and a "book again" action. */
function BookedServiceCard({
  service,
  index,
  booking,
  onOpen,
}: {
  service: Service;
  index: number;
  booking: BookingSummary;
  onOpen: () => void;
}) {
  return (
    <CatalogCard
      palette={servicePalette(service)}
      icon={service.icon}
      eyebrow={service.categoryLabel}
      title={service.title}
      index={index}
      onClick={onOpen}
      topRight={<ServiceQuickAccess service={service} />}
      footer={
        <div className="flex items-center justify-between gap-3">
          <CatalogOpenCue label="View requests" />
          {booking.actionButton && (
            <Link
              href={booking.actionButton.href}
              onClick={(e) => e.stopPropagation()}
              className={CATALOG_BTN_PRIMARY}
            >
              {booking.actionButton.label}
            </Link>
          )}
        </div>
      }
    >
      <div className="mt-4 flex items-baseline gap-2">
        <span className="font-serif text-[34px] leading-none font-semibold text-[var(--cat-accent-dark)] tabular-nums">
          {booking.count}
        </span>
        <span className="text-sm font-medium text-[#16302C]/60">{booking.countLabel}</span>
      </div>
      {booking.extraContent && <div className="mt-3">{booking.extraContent}</div>}
      {booking.description && (
        <div className="mt-3 rounded-xl bg-[var(--cat-accent-tint)]/60 px-3.5 py-3 text-[13px] leading-relaxed text-[#16302C]/75">
          {booking.description}
        </div>
      )}
    </CatalogCard>
  );
}

function ServiceCard({
  service,
  index,
  onLockedClick,
  onLaunch,
}: {
  service: Service;
  index: number;
  onLockedClick: (feature: string) => void;
  onLaunch: (item: WalletCatalogItem) => void;
}) {
  const { t } = useLanguage();

  const catalogItem = getServiceCatalogItem(service.id);
  const showDualCta = !!catalogItem && !service.disabled;
  const isNavigable = !service.disabled;

  const handleClick = (e: React.MouseEvent) => {
    if (!showDualCta && service.entitlementFeature) {
      e.preventDefault();
      onLockedClick(service.entitlementFeature);
    }
  };

  return (
    <CatalogCard
      palette={servicePalette(service)}
      icon={service.icon}
      eyebrow={service.categoryLabel}
      title={service.title}
      description={service.description}
      disabled={service.disabled}
      index={index}
      href={!showDualCta && isNavigable ? service.href : undefined}
      onClick={!showDualCta && isNavigable ? handleClick : undefined}
      topRight={
        <>
          <CreditInfoTooltip
            message="Each booking or request requires credits. You will need to pay again for every new request."
            side="top"
          />
          <ServiceQuickAccess service={service} />
        </>
      }
      footer={
        showDualCta && catalogItem ? (
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2.5">
            <div className="flex items-center gap-2">
              <Link
                href={
                  catalogItem.legacyAddonId
                    ? `/resources/${catalogItem.legacyAddonId}`
                    : withPreviewMode(service.href)
                }
                onClick={(e) => e.stopPropagation()}
                className={CATALOG_BTN_GHOST}
              >
                {catalogItem.legacyAddonId ? "View Details" : "Preview"}
              </Link>
              <button
                type="button"
                onClick={() => onLaunch(catalogItem)}
                aria-label={`Launch ${service.title} for ${catalogItem.credits} credits`}
                className={CATALOG_BTN_PRIMARY}
              >
                Launch
              </button>
            </div>
            <CatalogPrice kind="services" amount={catalogItem.credits} />
          </div>
        ) : (
          <div className="flex items-center justify-end">
            {isNavigable ? (
              <CatalogOpenCue label={t("pages.services.openService")} />
            ) : (
              <span className="text-sm font-semibold text-[#16302C]/40">
                {t("pages.services.comingSoon")}
              </span>
            )}
          </div>
        )
      }
    />
  );
}
