"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader } from "@/components/ui/spinner";
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
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type AppointmentStatus = "pending" | "in_progress" | "completed" | "cancelled";

interface Applicant {
  id: string;
  surname: string;
  givenName: string;
  gender: string;
  dateOfBirth: string;
  passportNumber: string;
  passportIssueDate?: string;
  passportExpiryDate?: string;
  caseNumber?: string;
  caseRef?: string;
}

interface Appointment {
  id: string;
  created_at: string;
  updated_at: string;
  full_name: string;
  email: string;
  phone_number: string;
  medical_website: string;
  location: string;
  provider: string;
  appointment_type: string;
  visa_type?: string;
  medical_type?: string;
  surname?: string;
  given_name?: string;
  gender?: string;
  date_of_birth?: string;
  passport_number?: string;
  passport_issue_date?: string;
  passport_expiry_date?: string;
  case_number?: string;
  preferred_date?: string;
  preferred_time?: string;
  estimated_charges?: string;
  interview_date?: string;
  visa_category?: string;
  had_medical_before?: string;
  city?: string;
  case_ref?: string;
  number_of_applicants?: number;
  original_passport?: string;
  status: AppointmentStatus;
  scanned_passport_url?: string;
  k_one_letter_url?: string;
  appointment_confirmation_letter_url?: string;
  applicants?: Applicant[];
}

export default function BookAppointmentTable() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<
    Appointment[]
  >([]);
  const [selectedStatus, setSelectedStatus] = useState<
    AppointmentStatus | "all"
  >("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [currentAppointment, setCurrentAppointment] = useState<Appointment | null>(null);

  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/appointments");
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch appointments");
      }

      setAppointments(result.data || []);
      setError(null);
    } catch (err: unknown) {
      console.error("Error fetching appointments:", err);
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(`Failed to fetch appointments: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  // Filter and sort appointments based on selected status, search term, and sort order
  useEffect(() => {
    let filtered = [...appointments];

    // Apply status filter
    if(selectedStatus !== "all") {
      filtered = filtered.filter(
        (req) => req.status === selectedStatus
      );
    }

    // Apply search filter (search in full_name and email)
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (req) =>
          req.full_name.toLowerCase().includes(lowerSearchTerm) ||
          req.email.toLowerCase().includes(lowerSearchTerm)
      );
    }

    // Sort by date (created_at)
    filtered.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

    setFilteredAppointments(filtered);
  }, [appointments, selectedStatus, searchTerm, sortOrder]);

  const updateAppointmentStatus = async (
    id: string,
    newStatus: AppointmentStatus
  ) => {
    try {
      const response = await fetch("/api/admin/appointments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to update appointment status");
      }

      fetchAppointments();
      console.log(`Appointment ${id} status updated to ${newStatus}`);
    } catch (err: unknown) {
      console.error("Error updating appointment status:", err);
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      alert(`Failed to update appointment status: ${errorMessage}`);
    }
  };

  const getStatusBadgeVariant = (status: AppointmentStatus) => {
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

  const getStatusColor = (status: AppointmentStatus) => {
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

  if (error) {
    return (
      <Card className="max-w-7xl mx-auto mt-6">
        <CardHeader>
          <CardTitle className="text-red-600">Error Loading Appointments</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">{error}</p>
          <Button onClick={fetchAppointments} className="mt-4">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

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
              value={selectedStatus}
              onValueChange={(value: AppointmentStatus | "all") =>
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

            {/* Date Sorting */}
            <Select
              value={sortOrder}
              onValueChange={(value: 'asc' | 'desc') =>
                setSortOrder(value)
              }
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
              <Loader size="md" text="Loading appointments..." />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Submitted Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAppointments.map((appointment) => (
                    <TableRow key={appointment.id}>
                      <TableCell className="font-medium">
                        {appointment.full_name}
                      </TableCell>
                      <TableCell>{appointment.email}</TableCell>
                      <TableCell>
                        {appointment.location ? appointment.location.charAt(0).toUpperCase() +
                          appointment.location.slice(1) : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {appointment.provider ? appointment.provider.charAt(0).toUpperCase() +
                          appointment.provider.slice(1) : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {formatDate(appointment.created_at)}
                      </TableCell>
                      <TableCell>
                        <div className="relative inline-block">
                          <Badge
                            variant={getStatusBadgeVariant(
                              appointment.status
                            )}
                            className={`${getStatusColor(
                              appointment.status
                            )} transition-all duration-200`}
                          >
                            {appointment.status.charAt(0).toUpperCase() +
                              appointment.status.slice(1)}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Dialog open={viewModalOpen && currentAppointment?.id === appointment.id} onOpenChange={(open) => {
                            if (!open) {
                              setViewModalOpen(false);
                              setCurrentAppointment(null);
                            }
                          }}>
                            <DialogTrigger asChild>
                              <Button
                                className="cursor-pointer"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setCurrentAppointment(appointment);
                                  setViewModalOpen(true);
                                }}
                              >
                                View
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>Appointment Details</DialogTitle>
                              </DialogHeader>
                              {currentAppointment && (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                                  {/* Personal Information */}
                                  <div className="bg-slate-50 p-4 rounded-lg">
                                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                      <svg
                                        className="w-5 h-5 text-teal-600"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth="2"
                                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                        ></path>
                                      </svg>
                                      Personal Information
                                    </h4>
                                    <div className="space-y-2 text-sm">
                                      <p>
                                        <span className="text-gray-600">
                                          Full Name:
                                        </span>{" "}
                                        <span className="font-medium">
                                          {currentAppointment.full_name}
                                        </span>
                                      </p>
                                      <p>
                                        <span className="text-gray-600">
                                          Surname:
                                        </span>{" "}
                                        <span className="font-medium">
                                          {currentAppointment.surname || "N/A"}
                                        </span>
                                      </p>
                                      <p>
                                        <span className="text-gray-600">
                                          Given Name:
                                        </span>{" "}
                                        <span className="font-medium">
                                          {currentAppointment.given_name || "N/A"}
                                        </span>
                                      </p>
                                      <p>
                                        <span className="text-gray-600">Gender:</span>{" "}
                                        <span className="font-medium">
                                          {currentAppointment.gender || "N/A"}
                                        </span>
                                      </p>
                                      <p>
                                        <span className="text-gray-600">
                                          Date of Birth:
                                        </span>{" "}
                                        <span className="font-medium">
                                          {formatDate(currentAppointment.date_of_birth)}
                                        </span>
                                      </p>
                                    </div>
                                  </div>

                                  {/* Contact Information */}
                                  <div className="bg-slate-50 p-4 rounded-lg">
                                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                      <svg
                                        className="w-5 h-5 text-teal-600"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth="2"
                                          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                                        ></path>
                                      </svg>
                                      Contact Information
                                    </h4>
                                    <div className="space-y-2 text-sm">
                                      <p>
                                        <span className="text-gray-600">Email:</span>{" "}
                                        <span className="font-medium">
                                          {currentAppointment.email}
                                        </span>
                                      </p>
                                      <p>
                                        <span className="text-gray-600">Phone:</span>{" "}
                                        <span className="font-medium">
                                          +92 {currentAppointment.phone_number}
                                        </span>
                                      </p>
                                      {currentAppointment.city && (
                                        <p>
                                          <span className="text-gray-600">City:</span>{" "}
                                          <span className="font-medium">
                                            {currentAppointment.city}
                                          </span>
                                        </p>
                                      )}
                                    </div>
                                  </div>

                                  {/* Appointment Details */}
                                  <div className="bg-slate-50 p-4 rounded-lg">
                                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                      <svg
                                        className="w-5 h-5 text-teal-600"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth="2"
                                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                        ></path>
                                      </svg>
                                      Appointment Details
                                    </h4>
                                    <div className="space-y-2 text-sm">
                                      <p>
                                        <span className="text-gray-600">
                                          Location:
                                        </span>{" "}
                                        <span className="font-medium capitalize">
                                          {currentAppointment.location || 'N/A'}
                                        </span>
                                      </p>
                                      <p>
                                        <span className="text-gray-600">
                                          Provider:
                                        </span>{" "}
                                        <span className="font-medium">
                                          {currentAppointment.provider || 'N/A'}
                                        </span>
                                      </p>
                                      <p>
                                        <span className="text-gray-600">
                                          Website:
                                        </span>{" "}
                                        <span className="font-medium">
                                          {currentAppointment.medical_website}
                                        </span>
                                      </p>
                                      {currentAppointment.appointment_type && (
                                        <p>
                                          <span className="text-gray-600">Type:</span>{" "}
                                          <span className="font-medium">
                                            {currentAppointment.appointment_type}
                                          </span>
                                        </p>
                                      )}
                                      {currentAppointment.visa_type && (
                                        <p>
                                          <span className="text-gray-600">
                                            Visa Type:
                                          </span>{" "}
                                          <span className="font-medium">
                                            {currentAppointment.visa_type}
                                          </span>
                                        </p>
                                      )}
                                      {currentAppointment.medical_type && (
                                        <p>
                                          <span className="text-gray-600">
                                            Medical Type:
                                          </span>{" "}
                                          <span className="font-medium">
                                            {currentAppointment.medical_type}
                                          </span>
                                        </p>
                                      )}
                                      {currentAppointment.original_passport && (
                                        <p>
                                          <span className="text-gray-600">
                                            Original Passport:
                                          </span>{" "}
                                          <span className="font-medium">
                                            {currentAppointment.original_passport}
                                          </span>
                                        </p>
                                      )}
                                    </div>
                                  </div>

                                  {/* AMC Specific Fields */}
                                  {currentAppointment.location === "islamabad" &&
                                    currentAppointment.provider === "amc" && (
                                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                          <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs">
                                            AMC
                                          </span>
                                          AMC Specific Info
                                        </h4>
                                        <div className="space-y-2 text-sm">
                                          {currentAppointment.interview_date && (
                                            <p>
                                              <span className="text-gray-600">
                                                Interview Date:
                                              </span>{" "}
                                              <span className="font-medium">
                                                {formatDate(
                                                  currentAppointment.interview_date
                                                )}
                                              </span>
                                            </p>
                                          )}
                                          {currentAppointment.visa_category && (
                                            <p>
                                              <span className="text-gray-600">
                                                Visa Category:
                                              </span>{" "}
                                              <span className="font-medium">
                                                {currentAppointment.visa_category}
                                              </span>
                                            </p>
                                          )}
                                          {currentAppointment.had_medical_before && (
                                            <p>
                                              <span className="text-gray-600">
                                                Had Medical Before:
                                              </span>{" "}
                                              <span className="font-medium">
                                                {currentAppointment.had_medical_before}
                                              </span>
                                            </p>
                                          )}
                                          {currentAppointment.case_ref && (
                                            <p>
                                              <span className="text-gray-600">
                                                Case Ref:
                                              </span>{" "}
                                              <span className="font-medium">
                                                {currentAppointment.case_ref}
                                              </span>
                                            </p>
                                          )}
                                          {currentAppointment.number_of_applicants && (
                                            <p>
                                              <span className="text-gray-600">
                                                No. of Applicants:
                                              </span>{" "}
                                              <span className="font-medium">
                                                {currentAppointment.number_of_applicants}
                                              </span>
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    )}

                                  {/* Passport Information */}
                                  <div className="bg-slate-50 p-4 rounded-lg">
                                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                      <svg
                                        className="w-5 h-5 text-teal-600"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth="2"
                                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                        ></path>
                                      </svg>
                                      Passport Information
                                    </h4>
                                    <div className="space-y-2 text-sm">
                                      <p>
                                        <span className="text-gray-600">
                                          Passport Number:
                                        </span>{" "}
                                        <span className="font-medium">
                                          {currentAppointment.passport_number || "N/A"}
                                        </span>
                                      </p>
                                      <p>
                                        <span className="text-gray-600">
                                          Issue Date:
                                        </span>{" "}
                                        <span className="font-medium">
                                          {formatDate(
                                            currentAppointment.passport_issue_date
                                          )}
                                        </span>
                                      </p>
                                      <p>
                                        <span className="text-gray-600">
                                          Expiry Date:
                                        </span>{" "}
                                        <span className="font-medium">
                                          {formatDate(
                                            currentAppointment.passport_expiry_date
                                          )}
                                        </span>
                                      </p>
                                      {currentAppointment.case_number && (
                                        <p>
                                          <span className="text-gray-600">
                                            Case Number:
                                          </span>{" "}
                                          <span className="font-medium">
                                            {currentAppointment.case_number}
                                          </span>
                                        </p>
                                      )}
                                    </div>
                                  </div>

                                  {/* Additional Applicants */}
                                  {currentAppointment.applicants &&
                                    currentAppointment.applicants.length > 0 && (
                                      <div className="bg-green-50 p-4 rounded-lg border border-green-200 col-span-3">
                                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                          <svg
                                            className="w-5 h-5 text-green-600"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                          >
                                            <path
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              strokeWidth="2"
                                              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                                            ></path>
                                          </svg>
                                          Additional Applicants (
                                          {currentAppointment.applicants.length})
                                        </h4>
                                        <div className="space-y-4">
                                          {currentAppointment.applicants.map(
                                            (applicant, index) => (
                                              <div
                                                key={applicant.id}
                                                className="border border-green-200 rounded-lg p-4 bg-white"
                                              >
                                                <h5 className="font-medium text-gray-900 mb-2">
                                                  Applicant #{index + 1}
                                                </h5>
                                                <div className="grid grid-cols-2 gap-2 text-sm">
                                                  <p>
                                                    <span className="text-gray-600">
                                                      Surname:
                                                    </span>{" "}
                                                    <span className="font-medium">
                                                      {applicant.surname}
                                                    </span>
                                                  </p>
                                                  <p>
                                                    <span className="text-gray-600">
                                                      Given Name:
                                                    </span>{" "}
                                                    <span className="font-medium">
                                                      {applicant.givenName}
                                                    </span>
                                                  </p>
                                                  <p>
                                                    <span className="text-gray-600">
                                                      Gender:
                                                    </span>{" "}
                                                    <span className="font-medium">
                                                      {applicant.gender}
                                                    </span>
                                                  </p>
                                                  <p>
                                                    <span className="text-gray-600">
                                                      DOB:
                                                    </span>{" "}
                                                    <span className="font-medium">
                                                      {formatDate(
                                                        applicant.dateOfBirth
                                                      )}
                                                    </span>
                                                  </p>
                                                  <p>
                                                    <span className="text-gray-600">
                                                      Passport:
                                                    </span>{" "}
                                                    <span className="font-medium">
                                                      {applicant.passportNumber}
                                                    </span>
                                                  </p>
                                                  <p>
                                                    <span className="text-gray-600">
                                                      Issue Date:
                                                    </span>{" "}
                                                    <span className="font-medium">
                                                      {formatDate(
                                                        applicant.passportIssueDate
                                                      )}
                                                    </span>
                                                  </p>
                                                  <p>
                                                    <span className="text-gray-600">
                                                      Expiry Date:
                                                    </span>{" "}
                                                    <span className="font-medium">
                                                      {formatDate(
                                                        applicant.passportExpiryDate
                                                      )}
                                                    </span>
                                                  </p>
                                                  <p>
                                                    <span className="text-gray-600">
                                                      Case Number:
                                                    </span>{" "}
                                                    <span className="font-medium">
                                                      {applicant.caseNumber}
                                                    </span>
                                                  </p>
                                                  {currentAppointment.location ===
                                                    "islamabad" &&
                                                    currentAppointment.provider ===
                                                      "amc" && (
                                                    <p>
                                                      <span className="text-gray-600">
                                                        Case Ref:
                                                      </span>{" "}
                                                      <span className="font-medium">
                                                        {applicant.caseRef}
                                                      </span>
                                                    </p>
                                                  )}
                                                </div>
                                              </div>
                                            )
                                          )}
                                        </div>
                                      </div>
                                    )}

                                  {/* Documents Section - NOW SHOWS FOR ALL PROVIDERS */}
                                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-200 col-span-3">
                                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                      <svg
                                        className="w-5 h-5 text-purple-600"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth="2"
                                          d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                                        ></path>
                                      </svg>
                                      Uploaded Documents
                                      {currentAppointment.location === "islamabad" &&
                                        currentAppointment.provider === "amc" && (
                                          <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs ml-2">
                                            AMC
                                          </span>
                                        )}
                                      {(currentAppointment.location === "karachi" ||
                                        currentAppointment.location === "lahore") && (
                                        <span className="bg-teal-600 text-white px-2 py-1 rounded text-xs ml-2">
                                          Wilcare
                                        </span>
                                      )}
                                    </h4>

                                    {/* Primary applicant documents */}
                                    <div className="mb-4">
                                      <h5 className="font-medium text-gray-900 mb-2">
                                        Primary Applicant Documents
                                      </h5>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                        {currentAppointment.scanned_passport_url && (
                                          <a
                                            href={currentAppointment.scanned_passport_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:underline break-all"
                                          >
                                            Scanned Passport
                                          </a>
                                        )}
                                        {currentAppointment.k_one_letter_url && (
                                          <a
                                            href={currentAppointment.k_one_letter_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:underline break-all"
                                          >
                                            K-1 Letter
                                          </a>
                                        )}
                                        {currentAppointment.appointment_confirmation_letter_url && (
                                          <a
                                            href={
                                              currentAppointment.appointment_confirmation_letter_url
                                            }
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:underline break-all"
                                          >
                                            Confirmation Letter
                                          </a>
                                        )}
                                        {!currentAppointment.scanned_passport_url &&
                                          !currentAppointment.k_one_letter_url &&
                                          !currentAppointment.appointment_confirmation_letter_url && (
                                            <p className="text-gray-500 col-span-2">
                                              No documents uploaded
                                            </p>
                                          )}
                                      </div>
                                    </div>

                                    {/* Additional applicant documents */}
                                    {currentAppointment.applicants &&
                                      currentAppointment.applicants.length > 0 && (
                                        <div className="mt-4">
                                          <h5 className="font-medium text-gray-900 mb-2">
                                            Additional Applicant Documents
                                          </h5>
                                          <div className="space-y-3">
                                            {currentAppointment.applicants.map(
                                              (applicant, index) => (
                                                <div
                                                  key={applicant.id}
                                                  className="border-l-4 border-purple-200 pl-4 py-2 bg-white"
                                                >
                                                  <h6 className="font-medium text-gray-800">
                                                    Applicant #{index + 1}:{" "}
                                                    {applicant.surname},{" "}
                                                    {applicant.givenName}
                                                  </h6>
                                                  <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                                    {applicant.passportNumber && (
                                                      <p>
                                                        <span className="text-gray-600">
                                                          Passport:
                                                        </span>{" "}
                                                        <span className="font-medium">
                                                          {applicant.passportNumber}
                                                        </span>
                                                      </p>
                                                    )}
                                                  </div>
                                                </div>
                                              )
                                            )}
                                          </div>
                                        </div>
                                      )}
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                          <Button
                            className="cursor-pointer"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // Placeholder for download functionality
                              console.log("Download functionality for appointment:", appointment.id);
                            }}
                          >
                            Download
                          </Button>
                          <Select
                            value={appointment.status}
                            onValueChange={(value: AppointmentStatus) =>
                              updateAppointmentStatus(appointment.id, value)
                            }
                          >
                            <SelectTrigger className="w-32">
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
                  ))}
                </TableBody>
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
              Total Appointments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{appointments.length}</div>
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
              {appointments.filter((r) => r.status === "pending").length}
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
                appointments.filter((r) => r.status === "in_progress")
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
                appointments.filter((r) => r.status === "completed")
                  .length
              }
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}