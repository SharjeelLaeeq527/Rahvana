"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/app/components/shared/ToastProvider";
import { msg, E, errorCode } from "@/lib/errors";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Pagination from "@/components/ui/pagination";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import TranslationUploadModal from "@/app/components/document-translation/TranslationUploadModal";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { CustomDropdown } from "@/app/components/shared/CustomDropdown";

// Translation Queue Types
type TranslationStatus =
  "PENDING" | "IN_REVIEW" | "TRANSLATED" | "USER_CONFIRMED" | "CHANGES_REQUESTED" | "VERIFIED";

interface TranslationRequest {
  id: string;
  user_name: string;
  user_email: string;
  document_type: string;
  created_at: string;
  status: TranslationStatus;
  version: number;
  original_filename: string;
  translated_filename?: string;
}

// Full row + admin-signed file URLs from GET /api/document-translation/admin/[id]
interface TranslationDetail extends TranslationRequest {
  updated_at?: string;
  payment_status?: string | null;
  original_file_size?: number;
  original_mime_type?: string;
  translated_file_size?: number | null;
  translated_mime_type?: string | null;
  translated_uploaded_at?: string | null;
  user_confirmed_at?: string | null;
  admin_verified_at?: string | null;
  user_notes?: string | null;
  admin_notes?: string | null;
  rejection_reason?: string | null;
  originalFileUrl?: string | null;
  translatedFileUrl?: string | null;
}

// interface UploadModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   requestId: string;
//   onSuccess: () => void;
// }

export default function TranslationQueueTable() {
  const { showToast } = useToast();
  const [translationRequests, setTranslationRequests] = useState<TranslationRequest[]>([]);
  const [filteredTranslationRequests, setFilteredTranslationRequests] = useState<
    TranslationRequest[]
  >([]);
  const [selectedTranslationStatus, setSelectedTranslationStatus] = useState<
    TranslationStatus | "all"
  >("all");
  const [selectedDocumentType, setSelectedDocumentType] = useState<string | "all">("all");

  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [currentRequestId, setCurrentRequestId] = useState<string>("");
  const [verifyNotes, setVerifyNotes] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [loading, setLoading] = useState(true);

  // Admin-side detail modal (replaces the old "View" jump to the user portal)
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewDetail, setViewDetail] = useState<TranslationDetail | null>(null);
  const [viewError, setViewError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc"); // 'desc' for latest first, 'asc' for oldest first

  // pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const ITEMS_PER_PAGE = 5;

  // pagination calculations
  const totalPages = Math.max(1, Math.ceil(filteredTranslationRequests.length / ITEMS_PER_PAGE));

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;

  const currentTranslationRequests = filteredTranslationRequests.slice(startIndex, endIndex);

  // Fetch translation requests from API
  useEffect(() => {
    const fetchTranslationRequests = async () => {
      try {
        const response = await fetch("/api/document-translation/admin");
        const data = await response.json();

        if (response.ok) {
          setTranslationRequests(data.documents);
          setFilteredTranslationRequests(data.documents);
        } else {
          console.error("Error fetching translation requests:", data.error);
        }
      } catch (error) {
        console.error("Error fetching translation requests:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTranslationRequests();
  }, []);

  // Filter translation requests based on selected status, document type, search term, and sort by date
  useEffect(() => {
    let filtered = [...translationRequests];

    // Apply status filter
    if (selectedTranslationStatus !== "all") {
      filtered = filtered.filter((req) => req.status === selectedTranslationStatus);
    }

    // Apply document type filter
    if (selectedDocumentType !== "all") {
      filtered = filtered.filter((req) => req.document_type === selectedDocumentType);
    }

    // Apply search filter (search in user_name and user_email)
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (req) =>
          req.user_name.toLowerCase().includes(lowerSearchTerm) ||
          req.user_email.toLowerCase().includes(lowerSearchTerm)
      );
    }

    // Sort by date (created_at)
    filtered.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
    });

    setFilteredTranslationRequests(filtered);
  }, [translationRequests, selectedTranslationStatus, selectedDocumentType, searchTerm, sortOrder]);

  const getTranslationStatusBadgeVariant = (status: TranslationStatus) => {
    switch (status) {
      case "PENDING":
        return "secondary";
      case "IN_REVIEW":
        return "default";
      case "TRANSLATED":
        return "default";
      case "USER_CONFIRMED":
        return "default";
      case "CHANGES_REQUESTED":
        return "destructive";
      case "VERIFIED":
        return "default";
      default:
        return "secondary";
    }
  };

  const getStatusColor = (status: TranslationStatus) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "IN_REVIEW":
        return "bg-blue-100 text-blue-800";
      case "TRANSLATED":
        return "bg-purple-100 text-purple-800";
      case "USER_CONFIRMED":
        return "bg-green-100 text-green-800";
      case "CHANGES_REQUESTED":
        return "bg-orange-100 text-orange-800";
      case "VERIFIED":
        return "bg-green-600 text-white";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleUploadClick = (requestId: string) => {
    setCurrentRequestId(requestId);
    setUploadModalOpen(true);
  };

  // Admin-only detail endpoint (service role) — unlike the user-side /status
  // route this can sign URLs for other users' files, so downloads work.
  const fetchAdminDetail = async (requestId: string): Promise<TranslationDetail> => {
    const response = await fetch(`/api/document-translation/admin/${requestId}`);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Failed to load document details");
    }
    return data as TranslationDetail;
  };

  const handleViewClick = async (requestId: string) => {
    setViewDetail(null);
    setViewError(null);
    setViewLoading(true);
    setViewModalOpen(true);
    try {
      setViewDetail(await fetchAdminDetail(requestId));
    } catch (error: any) {
      setViewError(error.message || "Failed to load document details");
    } finally {
      setViewLoading(false);
    }
  };

  // "Preview Text" row action: opens the original document in a new tab
  // (browser's inline PDF viewer) for reading.
  const handlePreviewTextClick = async (requestId: string) => {
    try {
      const detail = await fetchAdminDetail(requestId);
      if (detail.originalFileUrl) {
        window.open(detail.originalFileUrl, "_blank");
      } else {
        console.error("No previewable original file for request:", requestId);
        showToast(`${msg(E.VAULT_DOWNLOAD_FAILED)}`, "error", { duration: 3000 });
      }
    } catch (error: any) {
      console.error("Error previewing document:", error);
      showToast(error.message || `${msg(E.VAULT_DOWNLOAD_FAILED)}`, "error", { duration: 3000 });
    }
  };

  // Force an actual file download (blob + <a download>) instead of letting
  // the browser open the PDF inline in a new tab.
  const forceDownload = async (url: string, filename?: string | null) => {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Fetch failed with status ${response.status}`);
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = filename || "document.pdf";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      console.error("Error downloading document:", error);
      showToast(`${msg(E.VAULT_DOWNLOAD_FAILED)}`, "error", { duration: 3000 });
    }
  };

  const formatDateTime = (dateString?: string | null) =>
    dateString
      ? new Date(dateString).toLocaleString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "—";

  const formatFileSize = (bytes?: number | null) => {
    if (!bytes && bytes !== 0) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatTranslationDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <>
      <Card className="mx-auto mt-4 max-w-6xl">
        <CardHeader className="flex flex-row items-center justify-between">
          {/* Search Field - Left side */}
          <div className="relative rounded-lg border border-gray-300 p-2">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
            <Input
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-80 pl-10"
            />
          </div>

          {/* Dropdowns - Right side */}
          <div className="flex space-x-3">
            <CustomDropdown
              value={selectedDocumentType}
              onChange={(value) => setSelectedDocumentType(value)}
              options={[
                { value: "all", label: "All Types" },
                { value: "marriage", label: "Marriage" },
                { value: "birth", label: "Birth" },
                { value: "death", label: "Death" },
                { value: "divorce", label: "Divorce" },
              ]}
              placeholder="Filter by Document Type"
              className="w-40 [&_button]:w-full [&_button]:min-w-0"
            />
            <CustomDropdown
              value={selectedTranslationStatus}
              onChange={(value) => setSelectedTranslationStatus(value as TranslationStatus | "all")}
              options={[
                { value: "all", label: "All Statuses" },
                { value: "PENDING", label: "Pending" },
                { value: "IN_REVIEW", label: "In Review" },
                { value: "TRANSLATED", label: "Translated" },
                { value: "USER_CONFIRMED", label: "User Confirmed" },
                { value: "CHANGES_REQUESTED", label: "Changes Requested" },
                { value: "VERIFIED", label: "Verified" },
              ]}
              placeholder="Filter by status"
              className="w-40 [&_button]:w-full [&_button]:min-w-0"
            />

            {/* Date Sorting */}
            <CustomDropdown
              value={sortOrder}
              onChange={(value) => setSortOrder(value as "asc" | "desc")}
              options={[
                { value: "desc", label: "Latest First" },
                { value: "asc", label: "Oldest First" },
              ]}
              placeholder="Sort by date"
              className="w-40 [&_button]:w-full [&_button]:min-w-0"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader size="md" text="Loading translation queue..." />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Document Type</TableHead>
                    <TableHead>Submitted Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentTranslationRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">{request.user_name}</TableCell>
                      <TableCell>{request.user_email}</TableCell>
                      <TableCell>
                        {request.document_type.charAt(0).toUpperCase() +
                          request.document_type.slice(1)}
                      </TableCell>
                      <TableCell>{formatTranslationDate(request.created_at)}</TableCell>
                      <TableCell>
                        <div className="relative inline-block">
                          <Badge
                            variant={getTranslationStatusBadgeVariant(request.status)}
                            className={`${getStatusColor(
                              request.status
                            )} transition-all duration-200`}
                          >
                            {request.status === "TRANSLATED"
                              ? `Proof_V${request.version}`
                              : request.status.replace("_", " ")}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            className="cursor-pointer"
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewClick(request.id)}
                          >
                            View
                          </Button>
                          <Button
                            className="cursor-pointer"
                            variant="outline"
                            size="sm"
                            onClick={() => handlePreviewTextClick(request.id)}
                          >
                            Preview
                          </Button>
                          <Button
                            className="cursor-pointer"
                            variant="outline"
                            size="sm"
                            onClick={() => handleUploadClick(request.id)}
                          >
                            Upload
                          </Button>
                          {request.status === "USER_CONFIRMED" && (
                            <Dialog open={verifyModalOpen} onOpenChange={setVerifyModalOpen}>
                              <DialogTrigger asChild>
                                <Button
                                  className="cursor-pointer"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setCurrentRequestId(request.id);
                                  }}
                                >
                                  Verify
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Verify Translation</DialogTitle>
                                </DialogHeader>
                                <div className="py-4">
                                  <label className="mb-2 block text-sm font-medium text-gray-700">
                                    Verification Notes (Optional)
                                  </label>
                                  <textarea
                                    value={verifyNotes}
                                    onChange={(e) => setVerifyNotes(e.target.value)}
                                    placeholder="Add any verification notes..."
                                    className="focus:ring-primary min-h-20 w-full rounded-lg border border-gray-300 p-3 focus:border-transparent focus:ring-2"
                                    maxLength={500}
                                  />
                                </div>
                                <div className="flex justify-end gap-3 pt-2">
                                  <Button
                                    variant="outline"
                                    onClick={() => {
                                      setVerifyModalOpen(false);
                                      setVerifyNotes("");
                                    }}
                                    disabled={verifying}
                                    className="cursor-pointer px-4"
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    onClick={async () => {
                                      if (!currentRequestId) return;

                                      setVerifying(true);

                                      try {
                                        const response = await fetch(
                                          `/api/document-translation/${currentRequestId}/verify`,
                                          {
                                            method: "POST",
                                            headers: {
                                              "Content-Type": "application/json",
                                            },
                                            body: JSON.stringify({
                                              verificationNotes: verifyNotes,
                                            }),
                                          }
                                        );

                                        const data = await response.json();

                                        if (response.ok) {
                                          setVerifyNotes("");
                                          setVerifyModalOpen(false);

                                          // Refresh the list
                                          try {
                                            const response = await fetch(
                                              "/api/document-translation/admin"
                                            );
                                            const data = await response.json();

                                            if (response.ok) {
                                              setTranslationRequests(data.documents);
                                              setFilteredTranslationRequests(data.documents);
                                            } else {
                                              console.error(
                                                "Error fetching translation requests:",
                                                data.error
                                              );
                                            }
                                          } catch (error) {
                                            console.error(
                                              "Error fetching translation requests:",
                                              error
                                            );
                                          }

                                          showToast(
                                            "Translation verified and certified successfully!",
                                            "success",
                                            {
                                              duration: 3000,
                                            }
                                          );
                                        } else {
                                          console.error("Error verifying translation:", data.error);
                                          showToast(
                                            `Error verifying translation: ${
                                              data.error || "Unknown error"
                                            }`,
                                            "error",
                                            {
                                              duration: 3000,
                                            }
                                          );
                                        }
                                      } catch (error) {
                                        console.error("Error verifying translation:", error);
                                        showToast(
                                          "Error verifying translation: Network error",
                                          "error",
                                          {
                                            duration: 3000,
                                          }
                                        );
                                      } finally {
                                        setVerifying(false);
                                      }
                                    }}
                                    disabled={verifying}
                                    className="cursor-pointer bg-green-600 px-4 hover:bg-green-700"
                                  >
                                    {verifying ? "Verifying..." : "Verify"}
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                {/* Pagination - only show if there are requests and multiple pages */}
                {filteredTranslationRequests.length > 0 && totalPages > 1 && (
                  <TableFooter>
                    <TableRow>
                      <TableCell colSpan={6}>
                        <div className="flex w-full justify-center py-4">
                          <Pagination
                            currentPage={currentPage}
                            totalItems={filteredTranslationRequests.length}
                            itemsPerPage={ITEMS_PER_PAGE}
                            onPageChange={setCurrentPage}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                )}
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="mx-auto mt-8 mb-6 grid max-w-6xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{translationRequests.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {translationRequests.filter((r) => r.status === "PENDING").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">In Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {translationRequests.filter((r) => r.status === "IN_REVIEW").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {translationRequests.filter((r) => r.status === "VERIFIED").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Request Detail Modal — admin-side, replaces the user-portal navigation */}
      <Dialog
        open={viewModalOpen}
        onOpenChange={(open) => {
          setViewModalOpen(open);
          if (!open) {
            setViewDetail(null);
            setViewError(null);
          }
        }}
      >
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Translation Request Detail
              {viewDetail && (
                <Badge className={getStatusColor(viewDetail.status)}>
                  {viewDetail.status === "TRANSLATED"
                    ? `Proof_V${viewDetail.version}`
                    : viewDetail.status.replace("_", " ")}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          {viewLoading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader size="md" text="Loading request details..." />
            </div>
          ) : viewError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-sm font-medium text-red-700">{viewError}</p>
            </div>
          ) : viewDetail ? (
            <div className="space-y-5">
              {/* Requester & classification */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold tracking-wider text-gray-500 uppercase">
                    User
                  </p>
                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {viewDetail.user_name || "—"}
                  </p>
                  <p className="text-sm text-gray-600">{viewDetail.user_email || "—"}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold tracking-wider text-gray-500 uppercase">
                    Document
                  </p>
                  <p className="mt-1 text-sm font-medium text-gray-900 capitalize">
                    {viewDetail.document_type} Certificate
                  </p>
                  <p className="text-sm text-gray-600">
                    Version {viewDetail.version} · Payment:{" "}
                    <span className="capitalize">{viewDetail.payment_status || "n/a"}</span>
                  </p>
                </div>
              </div>

              {/* Timeline */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4 sm:grid-cols-3">
                {[
                  ["Submitted", formatDateTime(viewDetail.created_at)],
                  ["Last Updated", formatDateTime(viewDetail.updated_at)],
                  ["Translated At", formatDateTime(viewDetail.translated_uploaded_at)],
                  ["User Confirmed", formatDateTime(viewDetail.user_confirmed_at)],
                  ["Verified At", formatDateTime(viewDetail.admin_verified_at)],
                  ["Request ID", viewDetail.id.slice(0, 8)],
                ].map(([label, value]) => (
                  <div key={label}>
                    <p className="text-[11px] font-semibold tracking-wider text-gray-500 uppercase">
                      {label}
                    </p>
                    <p className="text-sm text-gray-900">{value}</p>
                  </div>
                ))}
              </div>

              {/* Files */}
              <div className="space-y-3">
                <p className="text-xs font-semibold tracking-wider text-gray-500 uppercase">
                  Files
                </p>

                {/* Original (uploaded by user) */}
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900">
                      Original: {viewDetail.original_filename}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(viewDetail.original_file_size)} ·{" "}
                      {viewDetail.original_mime_type || "application/pdf"}
                    </p>
                  </div>
                  {viewDetail.originalFileUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="cursor-pointer"
                      onClick={() =>
                        forceDownload(viewDetail.originalFileUrl!, viewDetail.original_filename)
                      }
                    >
                      Download
                    </Button>
                  )}
                </div>

                {/* Translated (uploaded by admin), if any */}
                {viewDetail.translated_filename ? (
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 p-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gray-900">
                        Translated: {viewDetail.translated_filename}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(viewDetail.translated_file_size)} ·{" "}
                        {viewDetail.translated_mime_type || "application/pdf"} ·{" "}
                        {formatDateTime(viewDetail.translated_uploaded_at)}
                      </p>
                    </div>
                    {viewDetail.translatedFileUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="cursor-pointer"
                        onClick={() =>
                          forceDownload(
                            viewDetail.translatedFileUrl!,
                            viewDetail.translated_filename
                          )
                        }
                      >
                        Download
                      </Button>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    No translated file uploaded yet for this version.
                  </p>
                )}
              </div>

              {/* Notes */}
              {(viewDetail.user_notes || viewDetail.admin_notes || viewDetail.rejection_reason) && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold tracking-wider text-gray-500 uppercase">
                    Notes
                  </p>
                  {viewDetail.user_notes && (
                    <div className="rounded-lg border border-blue-100 bg-blue-50 p-3">
                      <p className="text-[11px] font-semibold tracking-wider text-blue-700 uppercase">
                        User Notes
                      </p>
                      <p className="mt-1 text-sm whitespace-pre-wrap text-gray-800">
                        {viewDetail.user_notes}
                      </p>
                    </div>
                  )}
                  {viewDetail.admin_notes && (
                    <div className="rounded-lg border border-teal-100 bg-teal-50 p-3">
                      <p className="text-[11px] font-semibold tracking-wider text-teal-700 uppercase">
                        Admin Notes
                      </p>
                      <p className="mt-1 text-sm whitespace-pre-wrap text-gray-800">
                        {viewDetail.admin_notes}
                      </p>
                    </div>
                  )}
                  {viewDetail.rejection_reason && (
                    <div className="rounded-lg border border-orange-100 bg-orange-50 p-3">
                      <p className="text-[11px] font-semibold tracking-wider text-orange-700 uppercase">
                        Rejection Reason (Changes Requested)
                      </p>
                      <p className="mt-1 text-sm whitespace-pre-wrap text-gray-800">
                        {viewDetail.rejection_reason}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Upload Modal */}
      <TranslationUploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        requestId={currentRequestId}
        onSuccess={async () => {
          // Refresh the list
          try {
            const response = await fetch("/api/document-translation/admin");
            const data = await response.json();

            if (response.ok) {
              setTranslationRequests(data.documents);
              setFilteredTranslationRequests(data.documents);
            } else {
              console.error("Error fetching translation requests:", data.error);
            }
          } catch (error) {
            console.error("Error fetching translation requests:", error);
          }
        }}
      />
    </>
  );
}
