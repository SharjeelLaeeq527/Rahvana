"use client";

import { useState, useEffect } from "react";
import {
  FileText,
  Calendar,
  Clock,
  Eye,
  Upload,
  CheckCircle,
  AlertTriangle,
  CheckCheck,
  BadgeCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Pagination from "@/components/ui/pagination";
import { ElementType } from "react";
import { useLanguage } from "@/app/context/LanguageContext";
import { Loader } from "@/components/ui/spinner";

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

  // pagination calculations
  const totalPages = Math.max(1, Math.ceil(requests.length / ITEMS_PER_PAGE));

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;

  const currentRequests = requests.slice(startIndex, endIndex);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 text-gray-800 py-8 md:py-12 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
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
          <Button
            onClick={() => (window.location.href = "/document-translation")}
            className="bg-primary hover:bg-primary/90 cursor-pointer w-full sm:w-auto"
          >
            <Upload className="w-4 h-4 mr-2" />
            {t("documentTranslation.myRequestsPage.uploadNewBtn")}
          </Button>
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
              <div className="bg-white rounded-xl shadow-md overflow-hidden border border-slate-100">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-slate-50/50">
                      <TableRow>
                        <TableHead className="font-semibold">
                          {t(
                            "documentTranslation.myRequestsPage.table.documentType",
                          )}
                        </TableHead>
                        <TableHead className="font-semibold hidden sm:table-cell">
                          {t(
                            "documentTranslation.myRequestsPage.table.submittedDate",
                          )}
                        </TableHead>
                        <TableHead className="font-semibold">
                          {t("documentTranslation.myRequestsPage.table.status")}
                        </TableHead>
                        <TableHead className="text-right font-semibold">
                          {t(
                            "documentTranslation.myRequestsPage.table.actions",
                          )}
                        </TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {currentRequests.map((request) => (
                        <TableRow
                          key={request.id}
                          className="hover:bg-slate-50/50 transition-colors"
                        >
                          <TableCell>
                            <div className="flex items-center">
                              <FileText className="w-5 h-5 text-primary/80 mr-2 shrink-0" />
                              <div className="text-xs sm:text-sm font-medium text-gray-900 truncate max-w-[120px] sm:max-w-none">
                                {t(
                                  `documentTranslation.uploadPage.types.${request.document_type}`,
                                )}
                                <div className="sm:hidden text-[10px] text-gray-500 font-normal mt-0.5">
                                  {formatDate(request.created_at)}
                                </div>
                              </div>
                            </div>
                          </TableCell>

                          <TableCell className="hidden sm:table-cell">
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                              <div className="text-sm text-gray-500">
                                {formatDate(request.created_at)}
                              </div>
                            </div>
                          </TableCell>

                          <TableCell>
                            <StatusBadge
                              status={request.status}
                              version={request.version}
                            />
                          </TableCell>

                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                (window.location.href = `/document-translation/request/${request.id}`)
                              }
                              className="text-primary cursor-pointer hover:text-primary/90 text-[10px] sm:text-xs h-8 sm:h-9"
                            >
                              <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                              <span className="hidden xs:inline">
                                {t(
                                  "documentTranslation.myRequestsPage.table.viewDetails",
                                )}
                              </span>
                              <span className="xs:hidden">
                                {t(
                                  "documentTranslation.myRequestsPage.table.view",
                                )}
                              </span>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>

                    {/* Pagination - only show if there are requests and multiple pages */}
                    {requests.length > 0 && totalPages > 1 && (
                      <TableRow className="hover:bg-transparent">
                        <TableCell colSpan={4}>
                          <div className="w-full flex justify-center py-4 overflow-x-auto">
                            <Pagination
                              currentPage={currentPage}
                              totalItems={requests.length}
                              itemsPerPage={ITEMS_PER_PAGE}
                              onPageChange={setCurrentPage}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </Table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
