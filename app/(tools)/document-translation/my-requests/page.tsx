"use client";

import { useState, useEffect } from "react";
import { Upload } from "lucide-react";
import Pagination from "@/components/ui/pagination";
import { useLanguage } from "@/app/context/LanguageContext";
import { useCandidate } from "@/app/context/CandidateContext";
import { Loader } from "@/components/ui/spinner";
import { FilterPanel, FilterField } from "@/app/components/shared/FilterPanel";
import ServiceSkinShell from "@/components/tools/service-skin/ServiceSkinShell";
import { SERVICE_SKIN_FAQ } from "@/components/tools/service-skin/serviceSkinCopy";
import ServiceRequestList, {
  ServiceRequestEmpty,
  type RequestTone,
} from "@/components/tools/service-skin/ServiceRequestList";
// import { PageGate } from "@/app/components/entitlements/PageGate";

type TranslationStatus =
  "PENDING" | "IN_REVIEW" | "TRANSLATED" | "USER_CONFIRMED" | "CHANGES_REQUESTED" | "VERIFIED";

interface Requests {
  id: string;
  document_type: string;
  created_at: string;
  status: TranslationStatus;
  version: number;
  candidate_id?: string;
  candidate_name?: string;
}

/** Status text for a row (the proof version reads "Proof ready - v2"). */
function translationStatusLabel(
  status: TranslationStatus,
  version: number,
  t: (key: string) => string
): string {
  return status === "TRANSLATED" ? `Proof ready - v${version}` : t(`documentTranslation.statusLabels.${status}`);
}

const TRANSLATION_STATUS_TONE: Record<TranslationStatus, RequestTone> = {
  PENDING: "waiting",
  IN_REVIEW: "progress",
  TRANSLATED: "attention", // proof is ready for the user to review
  CHANGES_REQUESTED: "progress",
  USER_CONFIRMED: "done",
  VERIFIED: "done",
};

export default function MyTranslationRequests() {
  const { t } = useLanguage();
  const { activeCandidate, activeCandidateId, isMultiCandidate } = useCandidate();
  const [requests, setRequests] = useState<Requests[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Record<string, string>>({
    document_type: "all",
    status: "all",
    date_range: "all",
  });

  // pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const ITEMS_PER_PAGE = 10;

  // fetch candidate-scoped translation requests
  useEffect(() => {
    let isCancelled = false;
    const fetchRequests = async () => {
      setLoading(true);
      try {
        const queryParam = activeCandidateId
          ? `?candidateId=${encodeURIComponent(activeCandidateId)}`
          : "";
        const response = await fetch(`/api/document-translation/list${queryParam}`);
        const data = await response.json();

        if (isCancelled) return;

        if (response.ok) {
          setRequests(data.documents || []);
        } else {
          console.error("Error fetching requests:", data.error);
          setRequests([]);
        }
      } catch (error) {
        if (isCancelled) return;
        console.error("Error fetching requests:", error);
        setRequests([]);
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    fetchRequests();
    return () => {
      isCancelled = true;
    };
  }, [activeCandidateId]);

  // Helper function to calculate date range for date filters
  const getDateRange = (filterValue: string): { start: Date; end: Date } | null => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (filterValue) {
      case "today":
        return { start: today, end: new Date(today.getTime() + 24 * 60 * 60 * 1000) };
      case "this_week":
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
        return { start: weekStart, end: weekEnd };
      case "this_month":
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        return { start: monthStart, end: monthEnd };
      case "last_30_days":
        const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        return { start: thirtyDaysAgo, end: new Date(today.getTime() + 24 * 60 * 60 * 1000) };
      case "all":
        return null;
      default:
        return null;
    }
  };

  // Filter requests based on active filters
  const filteredRequests = requests.filter((request) => {
    if (filters.document_type !== "all" && request.document_type !== filters.document_type) {
      return false;
    }
    if (filters.status !== "all" && request.status !== filters.status) {
      return false;
    }
    if (filters.date_range !== "all") {
      const dateRange = getDateRange(filters.date_range);
      if (dateRange) {
        const requestDate = new Date(request.created_at);
        if (requestDate < dateRange.start || requestDate >= dateRange.end) {
          return false;
        }
      }
    }
    return true;
  });

  // pagination calculations
  const totalPages = Math.max(1, Math.ceil(filteredRequests.length / ITEMS_PER_PAGE));

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;

  const currentRequests = filteredRequests.slice(startIndex, endIndex);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Get unique document types and statuses for filter options
  const uniqueDocumentTypes = Array.from(new Set(requests.map((r) => r.document_type)));
  const uniqueStatuses: TranslationStatus[] = Array.from(
    new Set(requests.map((r) => r.status))
  ) as TranslationStatus[];

  // Filter field definitions
  const filterFields: FilterField[] = [
    {
      key: "document_type",
      label: t("documentTranslation.myRequestsPage.table.documentType"),
      value: filters.document_type,
      options: [
        { value: "all", label: "All Types" },
        ...uniqueDocumentTypes.map((type) => ({
          value: type,
          label: t(`documentTranslation.uploadPage.types.${type}`),
        })),
      ],
    },
    {
      key: "status",
      label: t("documentTranslation.myRequestsPage.table.status"),
      value: filters.status,
      options: [
        { value: "all", label: "All Status" },
        ...uniqueStatuses.map((status) => ({
          value: status,
          label: t(`documentTranslation.statusLabels.${status}`),
        })),
      ],
    },
    {
      key: "date_range",
      label: "Date Range",
      value: filters.date_range,
      options: [
        { value: "all", label: "All Time" },
        { value: "today", label: "Today" },
        { value: "this_week", label: "This Week" },
        { value: "this_month", label: "This Month" },
        { value: "last_30_days", label: "Last 30 Days" },
      ],
    },
  ];

  return (
    // <PageGate
    //   feature="document_translation"
    //   title="My Requests Locked"
    //   description="Upgrade your plan to view your submitted translation requests, track review statuses, and download your translated/certified PDF documents."
    // >
    <>
      <div className="mt-[55px] bg-white text-gray-800">
        <ServiceSkinShell
          service="translate"
          title="Document translation"
          tagline="Track your translation requests and download finished files"
          steps={[]}
          current={-1}
          kicker={null}
          heading={t("documentTranslation.myRequestsPage.title")}
          subheading={t("documentTranslation.myRequestsPage.subtitle")}
          faq={SERVICE_SKIN_FAQ.translate}
          hideSwitcher
          layout="page"
          topOffset={60}
          viewportOffset={60}
          paneFooter={
            isMultiCandidate ? (
              <div className="svk-for">
                <span>Showing requests for</span>
                <b>
                  {activeCandidate.fullName
                    ? `${activeCandidate.fullName} (${activeCandidate.label})`
                    : activeCandidate.label}
                </b>
              </div>
            ) : undefined
          }
        >
        <div>
          <div className="svk-toolbar">
            {requests.length > 0 ? (
              <FilterPanel
                fields={filterFields}
                onFilterChange={(newFilters: Record<string, string>) => {
                  setFilters(newFilters);
                  setCurrentPage(1);
                }}
                itemCount={currentRequests.length}
                totalCount={filteredRequests.length}
              />
            ) : (
              <span />
            )}
            <button
              type="button"
              className="svk-btn svk-btn-pri"
              onClick={() => (window.location.href = "/document-translation")}
            >
              <Upload className="h-4 w-4" aria-hidden="true" />
              {t("documentTranslation.myRequestsPage.uploadNewBtn")}
            </button>
          </div>

          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader size="md" text="Loading translation requests..." />
            </div>
          ) : requests.length === 0 ? (
            <ServiceRequestEmpty
              title={t("documentTranslation.myRequestsPage.noRequestsTitle")}
              body={t("documentTranslation.myRequestsPage.noRequestsDesc")}
              action={
                <button
                  type="button"
                  className="svk-btn svk-btn-pri"
                  onClick={() => (window.location.href = "/document-translation")}
                >
                  {t("documentTranslation.myRequestsPage.uploadFirstBtn")}
                </button>
              }
            />
          ) : currentRequests.length === 0 ? (
            <ServiceRequestEmpty title={t("documentTranslation.myRequestsPage.noResults")} />
          ) : (
            <>
              <ServiceRequestList
                items={currentRequests.map((request) => ({
                  id: request.id,
                  title: t(`documentTranslation.uploadPage.types.${request.document_type}`),
                  subtitle: `Submitted ${formatDate(request.created_at)}`,
                  status: {
                    label: translationStatusLabel(request.status, request.version, t),
                    tone: TRANSLATION_STATUS_TONE[request.status] ?? "neutral",
                  },
                  onOpen: () => (window.location.href = `/document-translation/request/${request.id}`),
                  openLabel: "Open request",
                }))}
              />
              {filteredRequests.length > 0 && totalPages > 1 && (
                <div className="flex w-full justify-center overflow-x-auto pt-5">
                  <Pagination
                    currentPage={currentPage}
                    totalItems={filteredRequests.length}
                    itemsPerPage={ITEMS_PER_PAGE}
                    onPageChange={setCurrentPage}
                  />
                </div>
              )}
            </>
          )}
        </div>
        </ServiceSkinShell>
      </div>
      {/* </PageGate> */}
    </>
  );
}
