"use client";

import { useState, useEffect } from "react";
import {
  FileText,
  Calendar,
  Clock,
  Upload,
  CheckCircle,
  AlertTriangle,
  CheckCheck,
  BadgeCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Pagination from "@/components/ui/pagination";
import { ElementType } from "react";
import { useLanguage } from "@/app/context/LanguageContext";
import { useCandidate } from "@/app/context/CandidateContext";
import { Loader } from "@/components/ui/spinner";
import { DataTable, Column } from "@/app/components/shared/table/DataTable";
import { FilterPanel, FilterField } from "@/app/components/shared/FilterPanel";
import ActionMenu from "@/app/components/shared/ActionMenu";
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

const StatusBadge = ({ status, version }: { status: TranslationStatus; version: number }) => {
  const { t } = useLanguage();

  const statusConfig: Record<
    TranslationStatus,
    { color: string; icon: ElementType; label: string }
  > = {
    PENDING: {
      color: "bg-yellow-100 text-yellow-800",
      icon: Clock,
      label: t("documentTranslation.statusLabels.PENDING"),
    },
    IN_REVIEW: {
      color: "bg-blue-100 text-blue-800",
      icon: FileText,
      label: t("documentTranslation.statusLabels.IN_REVIEW"),
    },
    TRANSLATED: {
      color: "bg-purple-100 text-purple-800",
      icon: CheckCircle,
      label: t("documentTranslation.statusLabels.TRANSLATED"),
    },
    USER_CONFIRMED: {
      color: "bg-green-100 text-green-800",
      icon: CheckCheck,
      label: t("documentTranslation.statusLabels.USER_CONFIRMED"),
    },
    CHANGES_REQUESTED: {
      color: "bg-orange-100 text-orange-800",
      icon: AlertTriangle,
      label: t("documentTranslation.statusLabels.CHANGES_REQUESTED"),
    },
    VERIFIED: {
      color: "bg-green-600 text-white",
      icon: BadgeCheck,
      label: t("documentTranslation.statusLabels.VERIFIED"),
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  const displayLabel = status === "TRANSLATED" ? `Proof_V${version}` : config.label;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${config.color}`}
    >
      <Icon className="h-3 w-3" />
      {displayLabel}
    </span>
  );
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

  // DataTable column definitions
  const columns: Column<Requests>[] = [
    {
      key: "document_type",
      label: t("documentTranslation.myRequestsPage.table.documentType"),
      render: (request: Requests) => (
        <div className="flex items-center">
          <FileText className="text-primary/80 mr-2 h-5 w-5 shrink-0" />
          <div className="max-w-30 truncate text-xs font-medium text-gray-900 sm:max-w-none sm:text-sm">
            {t(`documentTranslation.uploadPage.types.${request.document_type}`)}
            <div className="mt-0.5 text-[10px] font-normal text-gray-500 sm:hidden">
              {formatDate(request.created_at)}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "created_at",
      label: t("documentTranslation.myRequestsPage.table.submittedDate"),
      className: "hidden sm:table-cell",
      render: (request: Requests) => (
        <div className="flex items-center">
          <Calendar className="mr-2 h-4 w-4 text-gray-400" />
          <div className="text-sm text-gray-500">{formatDate(request.created_at)}</div>
        </div>
      ),
    },
    {
      key: "status",
      label: t("documentTranslation.myRequestsPage.table.status"),
      render: (request: Requests) => (
        <StatusBadge status={request.status} version={request.version} />
      ),
    },
    {
      key: "actions",
      label: t("documentTranslation.myRequestsPage.table.actions"),
      className: "text-right",
      render: (request: Requests) => (
        <ActionMenu
          onView={() => (window.location.href = `/document-translation/request/${request.id}`)}
        />
      ),
    },
  ];

  return (
    // <PageGate
    //   feature="document_translation"
    //   title="My Requests Locked"
    //   description="Upgrade your plan to view your submitted translation requests, track review statuses, and download your translated/certified PDF documents."
    // >
    <>
      <div className="site-main-px site-main-py mt-[55px] min-h-[50vh] bg-linear-to-br from-slate-50 to-slate-100 text-gray-800">
        <div className="">
          <header className="mb-8 md:mb-10">
            <h1 className="text-primary/90 text-2xl font-bold sm:text-3xl md:text-4xl">
              {t("documentTranslation.myRequestsPage.title")}
            </h1>
            <p className="mt-2 text-sm text-gray-600 sm:text-base">
              {t("documentTranslation.myRequestsPage.subtitle")}
            </p>
            {isMultiCandidate && (
              <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-medium text-teal-800">
                <span className="h-2 w-2 animate-pulse rounded-full bg-teal-500" />
                <span>
                  Showing requests for:{" "}
                  <strong>
                    {activeCandidate.fullName
                      ? `${activeCandidate.fullName} (${activeCandidate.label})`
                      : activeCandidate.label}
                  </strong>
                </span>
              </div>
            )}
          </header>

          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold text-gray-800 sm:text-xl">
              {t("documentTranslation.myRequestsPage.allRequests")}
            </h2>
            <div className="flex w-full flex-col gap-4 sm:w-auto sm:flex-row sm:items-center">
              {requests.length > 0 && (
                <FilterPanel
                  fields={filterFields}
                  onFilterChange={(newFilters: Record<string, string>) => {
                    setFilters(newFilters);
                    setCurrentPage(1);
                  }}
                  itemCount={currentRequests.length}
                  totalCount={filteredRequests.length}
                />
              )}
              <Button
                onClick={() => (window.location.href = "/document-translation")}
                className="bg-primary hover:bg-primary/90 w-full cursor-pointer sm:w-auto"
              >
                <Upload className="mr-2 h-4 w-4" />
                {t("documentTranslation.myRequestsPage.uploadNewBtn")}
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader size="md" text="Loading translation requests..." />
            </div>
          ) : (
            <>
              {requests.length === 0 ? (
                <div className="overflow-hidden rounded-xl bg-white px-4 py-10 text-center shadow-md sm:py-12">
                  <FileText className="mx-auto mb-4 h-10 w-10 text-gray-300 sm:h-12 sm:w-12" />
                  <h3 className="mb-1 text-base font-medium text-gray-900 sm:text-lg">
                    {t("documentTranslation.myRequestsPage.noRequestsTitle")}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {t("documentTranslation.myRequestsPage.noRequestsDesc")}
                  </p>
                  <div className="mt-6">
                    <Button
                      onClick={() => (window.location.href = "/document-translation")}
                      className="bg-primary hover:bg-primary/90 w-full sm:w-auto"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      {t("documentTranslation.myRequestsPage.uploadFirstBtn")}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="overflow-visible rounded-xl border border-slate-100 bg-white shadow-md">
                    <DataTable<Requests>
                      columns={columns}
                      data={currentRequests}
                      rowKey={(item: Requests) => item.id}
                      loading={false}
                      emptyState={
                        <div className="px-4 py-10 text-center">
                          <FileText className="mx-auto mb-3 h-10 w-10 text-gray-300" />
                          <p className="text-sm text-gray-500">
                            {t("documentTranslation.myRequestsPage.noResults")}
                          </p>
                        </div>
                      }
                    />

                    {/* Pagination - only show if there are filtered requests and multiple pages */}
                    {filteredRequests.length > 0 && totalPages > 1 && (
                      <div className="flex w-full justify-center overflow-x-auto border-t border-slate-100 py-4">
                        <Pagination
                          currentPage={currentPage}
                          totalItems={filteredRequests.length}
                          itemsPerPage={ITEMS_PER_PAGE}
                          onPageChange={setCurrentPage}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      {/* </PageGate> */}
    </>
  );
}
