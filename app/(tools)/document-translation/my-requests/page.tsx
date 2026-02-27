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
  const statusConfig: Record<
    TranslationStatus,
    { color: string; icon: ElementType; label: string }
  > = {
    PENDING: {
      color: "bg-yellow-100 text-yellow-800",
      icon: Clock,
      label: "Pending Review",
    },
    IN_REVIEW: {
      color: "bg-blue-100 text-blue-800",
      icon: FileText,
      label: "In Review",
    },
    TRANSLATED: {
      color: "bg-purple-100 text-purple-800",
      icon: CheckCircle,
      label: "Translated",
    },
    USER_CONFIRMED: {
      color: "bg-green-100 text-green-800",
      icon: CheckCheck,
      label: "User Confirmed",
    },
    CHANGES_REQUESTED: {
      color: "bg-orange-100 text-orange-800",
      icon: AlertTriangle,
      label: "Changes Requested",
    },
    VERIFIED: {
      color: "bg-green-600 text-white",
      icon: BadgeCheck,
      label: "Verified & Certified",
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
  const [requests, setRequests] = useState<Requests[]>([]);
  const [loading, setLoading] = useState(true);

  // pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const ITEMS_PER_PAGE = 10;

  // fetch
  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const response = await fetch(
          `/api/document-translation/list`
        );
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 text-gray-800 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <header className="mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-primary/90">
            My Translation Requests
          </h1>
          <p className="mt-2 text-gray-600">
            Track the status of your document translation requests
          </p>
        </header>

        <div className="flex justify-between items-center mb-8">
          <h2 className="text-xl font-semibold text-gray-800">All Requests</h2>
          <Button
            onClick={() => (window.location.href = "/document-translation")}
            className="bg-primary hover:bg-primary/90 cursor-pointer"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload New Document
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            {requests.length === 0 ? (
              <div className="bg-white rounded-xl shadow-md overflow-hidden text-center py-12">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">
                  No translation requests
                </h3>
                <p className="text-gray-500">
                  You haven&apos;t submitted any documents for translation yet.
                </p>
                <div className="mt-6">
                  <Button
                    onClick={() =>
                      (window.location.href = "/document-translation")
                    }
                    className="bg-primary hover:bg-primary/90"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Your First Document
                  </Button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Document Type</TableHead>
                        <TableHead>Submitted Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {currentRequests.map((request) => (
                        <TableRow key={request.id} className="hover:bg-gray-50">
                          <TableCell>
                            <div className="flex items-center">
                              <FileText className="w-5 h-5 text-primary/80 mr-2" />
                              <div className="text-sm font-medium text-gray-900">
                                {request.document_type.charAt(0).toUpperCase() +
                                  request.document_type.slice(1)}
                              </div>
                            </div>
                          </TableCell>

                          <TableCell>
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
                              className="text-primary cursor-pointer hover:text-primary/90"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>

                    {/* Pagination - only show if there are requests and multiple pages */}
                    {requests.length > 0 && totalPages > 1 && (
                      <TableRow>
                        <TableCell colSpan={4}>
                          <div className="w-full flex justify-center py-4">
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
