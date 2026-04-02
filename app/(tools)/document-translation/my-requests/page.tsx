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
import { Loader } from "@/components/ui/spinner";
import { DataTable, Column } from "@/app/components/shared/table/DataTable";
import { FilterPanel, FilterField } from "@/app/components/shared/FilterPanel";
import ActionMenu from "@/app/components/shared/ActionMenu";

type TranslationStatus =
  | "PENDING"
  | "IN_REVIEW"
  | "TRANSLATED"
  | "USER_CONFIRMED"
  | "CHANGES_REQUESTED"
  | "VERIFIED";

interface Requests {
  id: string;
  document_type: string;
  created_at: string;
  status: TranslationStatus;
  version: number;
}

const StatusBadge = ({
  status,
  version,
}: {
  status: TranslationStatus;
  version: number;
}) => {
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

  const displayLabel =
    status === "TRANSLATED" ? `Proof_V${version}` : config.label;

  return (
    <span
      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${config.color}`}
    >
      <Icon className="w-3 h-3" />
      {displayLabel}
    </span>
  );
};

export default function MyTranslationRequests() {
  const { t } = useLanguage();
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

  // fetch
  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const response = await fetch(`/api/document-translation/list`);
        const data = await response.json();

        if (response.ok) {
          setRequests(data.documents || []);
        } else {
          console.error("Error fetching requests:", data.error);
          setRequests([]);
        }
      } catch (error) {
        console.error("Error fetching requests:", error);
        setRequests([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, []);

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
    if (
      filters.document_type !== "all" &&
      request.document_type !== filters.document_type
    ) {
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
          <FileText className="w-5 h-5 text-primary/80 mr-2 shrink-0" />
          <div className="text-xs sm:text-sm font-medium text-gray-900 truncate max-w-30 sm:max-w-none">
            {t(`documentTranslation.uploadPage.types.${request.document_type}`)}
            <div className="sm:hidden text-[10px] text-gray-500 font-normal mt-0.5">
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
          <Calendar className="w-4 h-4 text-gray-400 mr-2" />
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
          onView={() =>
            (window.location.href = `/document-translation/request/${request.id}`)
          }
        />
      ),
    },
  ];

  return (
    <div className="min-h-[50vh] bg-linear-to-br from-slate-50 to-slate-100 text-gray-800 site-main-px site-main-py">
      <div className="">
        <header className="mb-8 md:mb-10">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary/90">
            {t("documentTranslation.myRequestsPage.title")}
          </h1>
          <p className="mt-2 text-sm sm:text-base text-gray-600">
            {t("documentTranslation.myRequestsPage.subtitle")}
          </p>
        </header>

        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
            {t("documentTranslation.myRequestsPage.allRequests")}
          </h2>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full sm:w-auto">
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
              className="bg-primary hover:bg-primary/90 cursor-pointer w-full sm:w-auto"
            >
              <Upload className="w-4 h-4 mr-2" />
              {t("documentTranslation.myRequestsPage.uploadNewBtn")}
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader size="md" text="Loading translation requests..." />
          </div>
        ) : (
          <>
            {requests.length === 0 ? (
              <div className="bg-white rounded-xl shadow-md overflow-hidden text-center py-10 px-4 sm:py-12">
                <FileText className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-1">
                  {t("documentTranslation.myRequestsPage.noRequestsTitle")}
                </h3>
                <p className="text-sm text-gray-500">
                  {t("documentTranslation.myRequestsPage.noRequestsDesc")}
                </p>
                <div className="mt-6">
                  <Button
                    onClick={() =>
                      (window.location.href = "/document-translation")
                    }
                    className="bg-primary hover:bg-primary/90 w-full sm:w-auto"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {t("documentTranslation.myRequestsPage.uploadFirstBtn")}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-white rounded-xl shadow-md overflow-visible border border-slate-100">
                  <DataTable<Requests>
                    columns={columns}
                    data={currentRequests}
                    rowKey={(item: Requests) => item.id}
                    loading={false}
                    emptyState={
                      <div className="text-center py-10 px-4">
                        <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                        <p className="text-sm text-gray-500">
                          {t("documentTranslation.myRequestsPage.noResults")}
                        </p>
                      </div>
                    }
                  />

                  {/* Pagination - only show if there are filtered requests and multiple pages */}
                  {filteredRequests.length > 0 && totalPages > 1 && (
                    <div className="w-full flex justify-center py-4 overflow-x-auto border-t border-slate-100">
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
  );
}
