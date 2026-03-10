"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
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
import {
  Users,
  Phone,
  Calendar,
  User,
  Upload,
  Search,
  FileText,
  ShieldCheck,
  Globe,
  AlertCircle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import Pagination from "@/components/ui/pagination";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  // DialogTrigger,
} from "@/components/ui/dialog";
import { Loader } from "@/components/ui/spinner";

interface PoliceVerificationRequest {
  id: string;
  request_id: string;
  created_at: string;
  updated_at: string;
  full_name: string;
  father_name: string;
  email: string;
  phone_number: string;
  dob?: string;
  gender?: string;
  cnic: string;
  cnic_issue_date?: string;
  cnic_expiry_date?: string;
  passport_number?: string;
  passport_issue_date?: string;
  passport_expiry_date?: string;
  status: "pending" | "in_progress" | "completed" | "cancelled";
  province: string;
  district: string;
  purpose: string;
  delivery_type: string;
  current_address?: string;
  stay_from?: string;
  stay_to?: string;
  residing_in?: string;
  residing_country?: string;
  target_country?: string;
  was_arrested: boolean;
  fir_no?: string;
  fir_year?: string;
  police_station?: string;
  arrest_status?: string;
  witness1_name?: string;
  witness1_father?: string;
  witness1_cnic?: string;
  witness1_contact?: string;
  witness1_address?: string;
  witness2_name?: string;
  witness2_father?: string;
  witness2_cnic?: string;
  witness2_contact?: string;
  witness2_address?: string;
  photograph_url?: string;
  passport_copy_url?: string;
  utility_bill_url?: string;
  police_letter_url?: string;
  judgment_copy_url?: string;
}

type VerificationStatus = "pending" | "in_progress" | "completed" | "cancelled";

export default function PoliceVerificationTable() {
  const [policeVerifications, setPoliceVerifications] = useState<
    PoliceVerificationRequest[]
  >([]);
  const [filteredPoliceVerifications, setFilteredPoliceVerifications] =
    useState<PoliceVerificationRequest[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<
    VerificationStatus | "all"
  >("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedRequest, setSelectedRequest] =
    useState<PoliceVerificationRequest | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const ITEMS_PER_PAGE = 10;

  const fetchPoliceVerifications = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/police-verifications");
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch police verifications");
      }

      setPoliceVerifications(result.data || []);
      setError(null);
    } catch (err: unknown) {
      console.error("Error fetching police verifications:", err);
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(`Failed to fetch police verifications: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPoliceVerifications();
  }, [fetchPoliceVerifications]);

  useEffect(() => {
    let filtered = [...policeVerifications];

    // Filter by status
    if (selectedStatus !== "all") {
      filtered = filtered.filter((pv) => pv.status === selectedStatus);
    }

    // Filter by search term
    if (searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (pv) =>
          pv.request_id.toLowerCase().includes(term) ||
          pv.full_name.toLowerCase().includes(term) ||
          pv.email.toLowerCase().includes(term) ||
          pv.phone_number.toLowerCase().includes(term) ||
          pv.cnic.toLowerCase().includes(term)
      );
    }

    // Sort by date
    filtered.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
    });

    setFilteredPoliceVerifications(filtered);
    setCurrentPage(1); // Reset to first page on filter change
  }, [policeVerifications, selectedStatus, searchTerm, sortOrder]);

  const totalPages = Math.ceil(
    filteredPoliceVerifications.length / ITEMS_PER_PAGE
  );
  const currentRequests = filteredPoliceVerifications.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const updateStatus = async (id: string, newStatus: VerificationStatus) => {
    try {
      const response = await fetch("/api/admin/police-verifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to update status");
      }

      fetchPoliceVerifications();
      if (selectedRequest?.id === id) {
        setSelectedRequest((prev) =>
          prev ? { ...prev, status: newStatus } : null
        );
      }
    } catch (err: unknown) {
      console.error("Error updating status:", err);
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      alert(`Failed to update status: ${errorMessage}`);
    }
  };

  const getStatusBadgeVariant = (status: VerificationStatus) => {
    switch (status) {
      case "pending":
        return "secondary";
      case "in_progress":
        return "default";
      case "completed":
        return "default";
      case "cancelled":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getStatusColor = (status: VerificationStatus) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Not specified";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleViewDetails = (request: PoliceVerificationRequest) => {
    setSelectedRequest(request);
    setIsModalOpen(true);
  };

  if (error) {
    return (
      <Card className="max-w-7xl mx-auto mt-6">
        <CardHeader>
          <CardTitle className="text-red-600">Error Loading Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">{error}</p>
          <Button onClick={fetchPoliceVerifications} className="mt-4">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Total Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {policeVerifications.length}
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
              {policeVerifications.filter((a) => a.status === "pending").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              In Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {
                policeVerifications.filter((a) => a.status === "in_progress")
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
                policeVerifications.filter((a) => a.status === "completed")
                  .length
              }
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="relative border border-gray-300 rounded-lg p-2">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search by ID, name, email, CNIC..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-80 border-none shadow-none focus-visible:ring-0"
            />
          </div>
          <div className="flex items-center space-x-3">
            <Select
              value={selectedStatus}
              onValueChange={(value: VerificationStatus | "all") =>
                setSelectedStatus(value)
              }
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

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

            <Button
              onClick={fetchPoliceVerifications}
              variant="outline"
              size="sm"
            >
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader size="md" text="Loading police verifications..." />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Request ID</TableHead>
                    <TableHead>Submitted Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentRequests.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center py-8 text-gray-500"
                      >
                        No records found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    currentRequests.map((pv) => (
                      <TableRow key={pv.id}>
                        <TableCell className="font-medium">
                          {pv.full_name}
                        </TableCell>
                        <TableCell>{pv.email}</TableCell>
                        <TableCell className="font-mono text-sm">
                          {pv.request_id}
                        </TableCell>
                        <TableCell>{formatDate(pv.created_at)}</TableCell>
                        <TableCell>
                          <Badge
                            variant={getStatusBadgeVariant(pv.status)}
                            className={getStatusColor(pv.status)}
                          >
                            {pv.status.replace("_", " ").toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewDetails(pv)}
                              className="h-8 text-xs flex items-center gap-1"
                            >
                              {/* <Eye className="w-3 h-3" /> */}
                              View
                            </Button>
                            <Select
                              value={pv.status}
                              onValueChange={(value: VerificationStatus) =>
                                updateStatus(pv.id, value)
                              }
                            >
                              <SelectTrigger className="w-32 h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="in_progress">
                                  In Progress
                                </SelectItem>
                                <SelectItem value="completed">
                                  Completed
                                </SelectItem>
                                <SelectItem value="cancelled">
                                  Cancelled
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {!loading &&
            filteredPoliceVerifications.length > 0 &&
            totalPages > 0 && (
              <div className="mt-6 flex justify-center">
                <Pagination
                  currentPage={currentPage}
                  totalItems={filteredPoliceVerifications.length}
                  itemsPerPage={ITEMS_PER_PAGE}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center justify-between">
              <span>Request Details: {selectedRequest?.request_id}</span>
              <Badge
                variant={
                  selectedRequest
                    ? getStatusBadgeVariant(selectedRequest.status)
                    : "secondary"
                }
                className={
                  selectedRequest ? getStatusColor(selectedRequest.status) : ""
                }
              >
                {selectedRequest?.status.replace("_", " ").toUpperCase()}
              </Badge>
            </DialogTitle>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-12 py-6">
              {/* Step 1: Personal Info */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 border-b pb-2">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <User className="text-primary w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Step 1: Personal Info
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase">
                      Purpose
                    </p>
                    <p className="font-medium">{selectedRequest.purpose}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase">
                      Delivery Type
                    </p>
                    <p className="font-medium">
                      {selectedRequest.delivery_type}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase">
                      Email Address
                    </p>
                    <p className="font-medium">{selectedRequest.email}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase">
                      Full Name
                    </p>
                    <p className="font-medium">{selectedRequest.full_name}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase">
                      Father / Husband Name
                    </p>
                    <p className="font-medium">{selectedRequest.father_name}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">
                      <Calendar size={12} /> Date Of Birth
                    </p>
                    <p className="font-medium">
                      {formatDate(selectedRequest.dob)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">
                      <Phone size={12} /> Mobile Number
                    </p>
                    <p className="font-medium">
                      {selectedRequest.phone_number}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase">
                      District
                    </p>
                    <p className="font-medium">{selectedRequest.district}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase">
                      Presently Residing
                    </p>
                    <p className="font-medium">
                      {selectedRequest.residing_in}
                      {selectedRequest.residing_in === "Abroad" &&
                        ` (${selectedRequest.residing_country})`}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase">
                      Target Country
                    </p>
                    <p className="font-medium">
                      {selectedRequest.target_country}
                    </p>
                  </div>
                </div>

                {/* CNIC Details */}
                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 space-y-4">
                  <h4 className="font-bold text-gray-800 flex items-center gap-2 text-sm">
                    <ShieldCheck size={16} className="text-primary" /> CNIC
                    Details
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase">
                        CNIC Number
                      </p>
                      <p className="font-medium">{selectedRequest.cnic}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase">
                        Issue Date
                      </p>
                      <p className="font-medium">
                        {formatDate(selectedRequest.cnic_issue_date)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase">
                        Expiry Date
                      </p>
                      <p className="font-medium">
                        {formatDate(selectedRequest.cnic_expiry_date)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Passport Details */}
                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 space-y-4">
                  <h4 className="font-bold text-gray-800 flex items-center gap-2 text-sm">
                    <Globe size={16} className="text-primary" /> Passport
                    Details
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase">
                        Passport No
                      </p>
                      <p className="font-medium">
                        {selectedRequest.passport_number || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase">
                        Issue Date
                      </p>
                      <p className="font-medium">
                        {formatDate(selectedRequest.passport_issue_date)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase">
                        Expiry Date
                      </p>
                      <p className="font-medium">
                        {formatDate(selectedRequest.passport_expiry_date)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Address Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase">
                      Current Address
                    </p>
                    <p className="font-medium">
                      {selectedRequest.current_address}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">
                        <Calendar size={12} /> Stay From
                      </p>
                      <p className="font-medium">
                        {formatDate(selectedRequest.stay_from)}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">
                        <Calendar size={12} /> Stay To
                      </p>
                      <p className="font-medium">
                        {formatDate(selectedRequest.stay_to)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Arrest History */}
                <div className="bg-orange-50 border border-orange-100 p-6 rounded-2xl space-y-4">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="text-orange-600 w-5 h-5" />
                    <h4 className="font-bold text-gray-900 text-sm">
                      Arrest History
                    </h4>
                  </div>
                  <p className="text-sm">
                    Was Arrested:{" "}
                    <span
                      className={`font-bold ${
                        selectedRequest.was_arrested
                          ? "text-red-600"
                          : "text-green-600"
                      }`}
                    >
                      {selectedRequest.was_arrested ? "Yes" : "No"}
                    </span>
                  </p>
                  {selectedRequest.was_arrested && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
                      <div>
                        <p className="text-xs font-bold text-gray-500 uppercase">
                          FIR No
                        </p>
                        <p className="font-medium">{selectedRequest.fir_no}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-500 uppercase">
                          FIR Year
                        </p>
                        <p className="font-medium">
                          {selectedRequest.fir_year}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-500 uppercase">
                          Police Station
                        </p>
                        <p className="font-medium">
                          {selectedRequest.police_station}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-500 uppercase">
                          Status
                        </p>
                        <p className="font-medium">
                          {selectedRequest.arrest_status}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Step 2: Details of Deponents/Guarantor */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 border-b pb-2">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Users className="text-primary w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Step 2: Details of Deponents/Guarantor
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Witness 1 */}
                  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                    <h4 className="font-bold text-gray-800 border-b pb-2 text-sm">
                      Witness 1
                    </h4>
                    <div className="space-y-3 text-sm">
                      <div>
                        <p className="text-xs font-bold text-gray-500 uppercase">
                          Name
                        </p>
                        <p className="font-medium">
                          {selectedRequest.witness1_name}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-500 uppercase">
                          Father Name
                        </p>
                        <p className="font-medium">
                          {selectedRequest.witness1_father}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-500 uppercase">
                          CNIC
                        </p>
                        <p className="font-medium">
                          {selectedRequest.witness1_cnic}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-500 uppercase">
                          Contact No
                        </p>
                        <p className="font-medium">
                          {selectedRequest.witness1_contact}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-500 uppercase">
                          Address
                        </p>
                        <p className="font-medium">
                          {selectedRequest.witness1_address}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Witness 2 */}
                  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                    <h4 className="font-bold text-gray-800 border-b pb-2 text-sm">
                      Witness 2
                    </h4>
                    <div className="space-y-3 text-sm">
                      <div>
                        <p className="text-xs font-bold text-gray-500 uppercase">
                          Name
                        </p>
                        <p className="font-medium">
                          {selectedRequest.witness2_name}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-500 uppercase">
                          Father Name
                        </p>
                        <p className="font-medium">
                          {selectedRequest.witness2_father}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-500 uppercase">
                          CNIC
                        </p>
                        <p className="font-medium">
                          {selectedRequest.witness2_cnic}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-500 uppercase">
                          Contact No
                        </p>
                        <p className="font-medium">
                          {selectedRequest.witness2_contact}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-500 uppercase">
                          Address
                        </p>
                        <p className="font-medium">
                          {selectedRequest.witness2_address}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3: Documents Required */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 border-b pb-2">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Upload className="text-primary w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Step 3: Documents Required
                  </h3>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {[
                    {
                      label: "Photograph",
                      url: selectedRequest.photograph_url,
                    },
                    {
                      label: "Passport Copy",
                      url: selectedRequest.passport_copy_url,
                    },
                    {
                      label: "Utility Bill",
                      url: selectedRequest.utility_bill_url,
                    },
                    {
                      label: "Police Letter",
                      url: selectedRequest.police_letter_url,
                    },
                    {
                      label: "Judgment Copy",
                      url: selectedRequest.judgment_copy_url,
                    },
                  ].map(
                    (doc, idx) =>
                      doc.url && (
                        <a
                          key={idx}
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex flex-col items-center justify-center p-4 bg-gray-50 border border-gray-100 rounded-2xl hover:bg-primary/5 hover:border-primary transition-all text-center gap-2 group"
                        >
                          <FileText className="w-8 h-8 text-gray-400 group-hover:text-primary" />
                          <span className="text-xs font-bold text-gray-600 group-hover:text-primary">
                            {doc.label}
                          </span>
                        </a>
                      )
                  )}
                </div>
              </div>

              {/* Status Update */}
              <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-8 border-t">
                <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <span className="text-sm font-bold text-gray-700">
                    Current Status:
                  </span>
                  <Select
                    value={selectedRequest.status}
                    onValueChange={(value: VerificationStatus) =>
                      updateStatus(selectedRequest.id, value)
                    }
                  >
                    <SelectTrigger className="w-48 bg-white border-gray-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="text-[10px] text-gray-400 font-mono text-right space-y-1">
                  <p>
                    SUBMITTED:{" "}
                    {new Date(selectedRequest.created_at).toLocaleString()}
                  </p>
                  <p>
                    LAST UPDATE:{" "}
                    {new Date(selectedRequest.updated_at).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
