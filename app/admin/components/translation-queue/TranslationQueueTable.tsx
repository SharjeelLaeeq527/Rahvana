"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

// Translation Queue Types
type TranslationStatus =
  | "PENDING"
  | "IN_REVIEW"
  | "TRANSLATED"
  | "USER_CONFIRMED"
  | "CHANGES_REQUESTED"
  | "VERIFIED";

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

// interface UploadModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   requestId: string;
//   onSuccess: () => void;
// }

export default function TranslationQueueTable() {
  const [translationRequests, setTranslationRequests] = useState<
    TranslationRequest[]
  >([]);
  const [filteredTranslationRequests, setFilteredTranslationRequests] =
    useState<TranslationRequest[]>([]);
  const [selectedTranslationStatus, setSelectedTranslationStatus] = useState<
    TranslationStatus | "all"
  >("all");
  const [selectedDocumentType, setSelectedDocumentType] = useState<
    string | "all"
  >("all");

  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [currentRequestId, setCurrentRequestId] = useState<string>("");
  const [verifyNotes, setVerifyNotes] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc"); // 'desc' for latest first, 'asc' for oldest first

  // pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const ITEMS_PER_PAGE = 5;

  // pagination calculations
  const totalPages = Math.max(
    1,
    Math.ceil(filteredTranslationRequests.length / ITEMS_PER_PAGE)
  );

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;

  const currentTranslationRequests = filteredTranslationRequests.slice(
    startIndex,
    endIndex
  );

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
      filtered = filtered.filter(
        (req) => req.status === selectedTranslationStatus
      );
    }

    // Apply document type filter
    if (selectedDocumentType !== "all") {
      filtered = filtered.filter(
        (req) => req.document_type === selectedDocumentType
      );
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
  }, [
    translationRequests,
    selectedTranslationStatus,
    selectedDocumentType,
    searchTerm,
    sortOrder,
  ]);

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

  const formatTranslationDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <>
      <Card className="max-w-6xl mx-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          {/* Search Field - Left side */}
          <div className="relative border border-gray-300 rounded-lg p-2">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-80"
            />
          </div>

          {/* Dropdowns - Right side */}
          <div className="flex space-x-3">
            <Select
              value={selectedDocumentType}
              onValueChange={(value: string | "all") =>
                setSelectedDocumentType(value)
              }
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by Document Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="marriage">Marriage</SelectItem>
                <SelectItem value="birth">Birth</SelectItem>
                <SelectItem value="death">Death</SelectItem>
                <SelectItem value="divorce">Divorce</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={selectedTranslationStatus}
              onValueChange={(value: TranslationStatus | "all") =>
                setSelectedTranslationStatus(value)
              }
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="IN_REVIEW">In Review</SelectItem>
                <SelectItem value="TRANSLATED">Translated</SelectItem>
                <SelectItem value="USER_CONFIRMED">User Confirmed</SelectItem>
                <SelectItem value="CHANGES_REQUESTED">
                  Changes Requested
                </SelectItem>
                <SelectItem value="VERIFIED">Verified</SelectItem>
              </SelectContent>
            </Select>

            {/* Date Sorting */}
            <Select
              value={sortOrder}
              onValueChange={(value: "asc" | "desc") => setSortOrder(value)}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Sort by date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">Latest First</SelectItem>
                <SelectItem value="asc">Oldest First</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-64">
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
                      <TableCell className="font-medium">
                        {request.user_name}
                      </TableCell>
                      <TableCell>{request.user_email}</TableCell>
                      <TableCell>
                        {request.document_type.charAt(0).toUpperCase() +
                          request.document_type.slice(1)}
                      </TableCell>
                      <TableCell>
                        {formatTranslationDate(request.created_at)}
                      </TableCell>
                      <TableCell>
                        <div className="relative inline-block">
                          <Badge
                            variant={getTranslationStatusBadgeVariant(
                              request.status
                            )}
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
                            onClick={() =>
                              window.open(
                                `/document-translation/request/${request.id}`,
                                "_blank"
                              )
                            }
                          >
                            View
                          </Button>
                          <Button
                            className="cursor-pointer"
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              try {
                                // Get the document details to get the file URL
                                const response = await fetch(
                                  `/api/document-translation/${request.id}/status`
                                );
                                const data = await response.json();

                                if (response.ok && data.originalFileUrl) {
                                  // Open the original file URL in a new tab
                                  window.open(data.originalFileUrl, "_blank");
                                } else {
                                  console.error(
                                    "Error getting document URL:",
                                    data.error
                                  );
                                  toast.error(
                                    "Could not download the document",
                                    {
                                      position: "top-right",
                                      duration: 3000,
                                    }
                                  );
                                }
                              } catch (error) {
                                console.error(
                                  "Error downloading document:",
                                  error
                                );
                                toast.error("Could not download the document", {
                                  position: "top-right",
                                  duration: 3000,
                                });
                              }
                            }}
                          >
                            Download
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
                            <Dialog
                              open={verifyModalOpen}
                              onOpenChange={setVerifyModalOpen}
                            >
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
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Verification Notes (Optional)
                                  </label>
                                  <textarea
                                    value={verifyNotes}
                                    onChange={(e) =>
                                      setVerifyNotes(e.target.value)
                                    }
                                    placeholder="Add any verification notes..."
                                    className="w-full border border-gray-300 rounded-lg p-3 min-h-20 focus:ring-2 focus:ring-primary focus:border-transparent"
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
                                    className="px-4 cursor-pointer"
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
                                              "Content-Type":
                                                "application/json",
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
                                              setTranslationRequests(
                                                data.documents
                                              );
                                              setFilteredTranslationRequests(
                                                data.documents
                                              );
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

                                          toast.success(
                                            "Translation verified and certified successfully!",
                                            {
                                              position: "top-right",
                                              duration: 3000,
                                            }
                                          );
                                        } else {
                                          console.error(
                                            "Error verifying translation:",
                                            data.error
                                          );
                                          toast.error(
                                            `Error verifying translation: ${
                                              data.error || "Unknown error"
                                            }`,
                                            {
                                              position: "top-right",
                                              duration: 3000,
                                            }
                                          );
                                        }
                                      } catch (error) {
                                        console.error(
                                          "Error verifying translation:",
                                          error
                                        );
                                        toast.error(
                                          "Error verifying translation: Network error",
                                          {
                                            position: "top-right",
                                            duration: 3000,
                                          }
                                        );
                                      } finally {
                                        setVerifying(false);
                                      }
                                    }}
                                    disabled={verifying}
                                    className="px-4 cursor-pointer bg-green-600 hover:bg-green-700"
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
                        <div className="w-full flex justify-center py-4">
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6 mt-8 max-w-6xl mx-auto">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Total Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {translationRequests.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {translationRequests.filter((r) => r.status === "PENDING").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              In Review
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {
                translationRequests.filter((r) => r.status === "IN_REVIEW")
                  .length
              }
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {
                translationRequests.filter((r) => r.status === "VERIFIED")
                  .length
              }
            </div>
          </CardContent>
        </Card>
      </div>

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
