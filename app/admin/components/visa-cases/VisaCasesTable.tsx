"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Search,
  Filter,
  Eye,
  Save,
  RefreshCw,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  Copy,
  ExternalLink,
  ChevronDown,
} from "lucide-react";

interface Journey {
  id: string;
  user_id: string;
  journey_type: string;
  status: string;
  tracking_status?: Record<string, any>;
  admin_notes?: string;
  admin_last_checked_at?: string;
  created_at: string;
  updated_at: string;
  user_email?: string;
  nvc_case_number?: string;
  nvc_invoice?: string;
  passport_number?: string;
  surname?: string;
}

export default function VisaCasesTable() {
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [journeyType, setJourneyType] = useState("IR1");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedJourney, setSelectedJourney] = useState<Journey | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [trackingStatus, setTrackingStatus] = useState<Record<string, any>>({});
  const [openStep, setOpenStep] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [checkDate, setCheckDate] = useState("");
  const [checkDateError, setCheckDateError] = useState("");
  const [caseStatus, setCaseStatus] = useState("");
  const [checkNotes, setCheckNotes] = useState("");

  const fetchJourneys = async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) setIsRefreshing(true);
      else setLoading(true);
      setError(null);

      const params = new URLSearchParams({ journey_type: journeyType });
      if (searchQuery) params.set("search", searchQuery);

      const res = await fetch(`/api/admin/visa-cases?${params}`);
      if (!res.ok) throw new Error("Failed to fetch journeys");

      const data = await res.json();
      setJourneys(data.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchJourneys();
  }, [journeyType]);

  const handleViewDetails = (journey: Journey) => {
    setSelectedJourney(journey);
    setAdminNotes(journey.admin_notes || "");
    setTrackingStatus(journey.tracking_status || {});
    setCheckDate(new Date().toISOString().split("T")[0]);
    setCheckDateError("");
    setCaseStatus(journey.tracking_status?.admin_case_status || "");
    setCheckNotes("");
    setIsDialogOpen(true);
  };

  const today = new Date().toISOString().split("T")[0];

  const validateCheckDate = (val: string): string => {
    if (!val) return "Date is required";
    if (val > today) return "Cannot log a future check date";
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    if (new Date(val) < thirtyDaysAgo) return "Date cannot be more than 30 days in the past";
    return "";
  };

  const handleLogCheckNow = async () => {
    if (!selectedJourney) return;
    const err = validateCheckDate(checkDate);
    if (err) {
      setCheckDateError(err);
      return;
    }
    setCheckDateError("");
    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/visa-cases", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedJourney.id,
          tracking_status: { ...trackingStatus, admin_case_status: caseStatus },
          admin_notes: adminNotes,
          check_date: new Date(checkDate).toISOString(),
          case_status: caseStatus,
          check_notes: checkNotes,
        }),
      });
      if (!res.ok) throw new Error("Failed to log check");
      await fetchJourneys(true);
      setIsDialogOpen(false);
      setSelectedJourney(null);
    } catch (err: any) {
      console.error("Error logging check:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedJourney) return;

    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/visa-cases", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedJourney.id,
          tracking_status: trackingStatus,
          admin_notes: adminNotes,
          check_date: new Date(checkDate || today).toISOString(),
        }),
      });

      if (!res.ok) throw new Error("Failed to update");

      await fetchJourneys(true);
      setIsDialogOpen(false);
      setSelectedJourney(null);
    } catch (err: any) {
      console.error("Error saving notes:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearTracking = async () => {
    if (!selectedJourney) return;
    if (
      !confirm(
        "Are you sure you want to clear ALL tracking data? This will revert the case to an un-tracked state."
      )
    )
      return;

    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/visa-cases", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedJourney.id,
          clear_tracking: true,
        }),
      });

      if (!res.ok) throw new Error("Failed to clear tracking");

      await fetchJourneys(true);
      setIsDialogOpen(false);
      setSelectedJourney(null);
    } catch (err: any) {
      console.error("Error clearing tracking:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<
      string,
      { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
    > = {
      not_started: { label: "Not Started", variant: "outline" },
      in_progress: { label: "In Progress", variant: "default" },
      completed: { label: "Completed", variant: "secondary" },
      on_hold: { label: "On Hold", variant: "destructive" },
    };

    const config = statusMap[status] || { label: status, variant: "outline" };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getTrackingBadge = (trackingStatus?: Record<string, any>) => {
    if (!trackingStatus || Object.keys(trackingStatus).length === 0) {
      return <Badge variant="outline">Not Set</Badge>;
    }

    // Determine the most advanced tracking state
    if (trackingStatus.interview_date) {
      return <Badge className="bg-purple-100 text-purple-800">Interview Scheduled</Badge>;
    }
    if (trackingStatus.interview_queue) {
      return <Badge className="bg-blue-100 text-blue-800">In Interview Queue</Badge>;
    }
    if (trackingStatus.dq_status === "qualified") {
      return <Badge className="bg-green-100 text-green-800">DQ'd</Badge>;
    }
    if (trackingStatus.nvc_review_complete) {
      return <Badge className="bg-teal-100 text-teal-800">NVC Review Done</Badge>;
    }

    return <Badge variant="outline">In Review</Badge>;
  };

  const filteredJourneys = journeys.filter((journey) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const userId = journey.user_id?.toLowerCase() || "";
    const email = journey.user_email?.toLowerCase() || "";
    const caseNum = journey.nvc_case_number?.toLowerCase() || "";
    return (
      userId.includes(query) ||
      journey.id.toLowerCase().includes(query) ||
      email.includes(query) ||
      caseNum.includes(query)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader size="lg" text="Loading visa cases..." />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-700">Error Loading Data</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => fetchJourneys()} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-teal-600" />
                Visa Cases Management
              </CardTitle>
              <CardDescription>Monitor and manage user visa applications</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchJourneys(true)}
              disabled={isRefreshing}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={journeyType} onValueChange={setJourneyType}>
              <SelectTrigger className="w-[200px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Journey Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="IR1">IR-1 Spouse Visa</SelectItem>
                <SelectItem value="IR5">IR-5 Parent Visa</SelectItem>
                <SelectItem value="F1">F-1 Student Visa</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card className="border-teal-200 bg-teal-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-teal-600" />
                  <div>
                    <p className="text-2xl font-bold text-teal-900">{journeys.length}</p>
                    <p className="text-xs text-teal-700">Total Cases</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="text-2xl font-bold text-blue-900">
                      {journeys.filter((j) => j.status === "in_progress").length}
                    </p>
                    <p className="text-xs text-blue-700">In Progress</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold text-green-900">
                      {journeys.filter((j) => j.status === "completed").length}
                    </p>
                    <p className="text-xs text-green-700">Completed</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                  <div>
                    <p className="text-2xl font-bold text-orange-900">
                      {
                        journeys.filter(
                          (j) => !j.tracking_status || Object.keys(j.tracking_status).length === 0
                        ).length
                      }
                    </p>
                    <p className="text-xs text-orange-700">Needs Review</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Journey ID</TableHead>
                  <TableHead>NVC Case #</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tracking</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Last Checked</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredJourneys.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <div className="flex flex-col items-center gap-2">
                        <FileText className="h-12 w-12 text-muted-foreground opacity-20" />
                        <p className="text-muted-foreground">No cases found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredJourneys.map((journey) => (
                    <TableRow key={journey.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-sm text-[#0c1b33]">
                            {journey.user_email || "Unknown User"}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            ID: {journey.user_id?.slice(0, 8) || "N/A"}...
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-[11px] bg-muted px-1.5 py-0.5 rounded border border-slate-200">
                          {journey.id.slice(0, 8)}...
                        </code>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          {journey.nvc_case_number ? (
                            <span className="font-mono text-xs font-bold text-slate-700">
                              {journey.nvc_case_number}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">
                              Not registered
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(journey.status)}</TableCell>
                      <TableCell>{getTrackingBadge(journey.tracking_status)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(journey.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "2-digit",
                          year: "numeric",
                        })}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {journey.admin_last_checked_at
                          ? new Date(journey.admin_last_checked_at).toLocaleDateString("en-US", {
                              month: "short",
                              day: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "Never"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(journey)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Visa Case Details</DialogTitle>
            <DialogDescription>Review and update case tracking information</DialogDescription>
          </DialogHeader>

          {selectedJourney && (
            <div className="space-y-6">
              {/* User Info */}
              {/* User Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-5 bg-slate-50 rounded-xl border border-slate-200">
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-[10px] uppercase tracking-wider font-semibold">
                    User Email
                  </Label>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm text-[#0c1b33] break-all">
                      {selectedJourney.user_email || "Unknown"}
                    </p>
                    <button
                      onClick={() =>
                        navigator.clipboard.writeText(selectedJourney.user_email || "")
                      }
                      className="p-1 hover:bg-slate-200 rounded transition-colors"
                      title="Copy Email"
                    >
                      <Copy className="h-3 w-3 text-slate-400 cursor-pointer" />
                    </button>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1">
                    <Label className="text-muted-foreground text-[10px] uppercase tracking-wider font-semibold">
                      NVC Case Number
                    </Label>
                    <Badge
                      variant="outline"
                      className="text-[8px] h-3 px-1 border-teal-200 text-teal-600 bg-teal-50"
                    >
                      Secure
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="font-mono font-bold text-sm text-slate-800 break-all">
                      {selectedJourney.nvc_case_number || "Not provided"}
                    </p>
                    {selectedJourney.nvc_case_number && (
                      <button
                        onClick={() =>
                          navigator.clipboard.writeText(selectedJourney.nvc_case_number || "")
                        }
                        className="p-1 hover:bg-slate-200 rounded transition-colors"
                        title="Copy Case Number"
                      >
                        <Copy className="h-3 w-3 text-slate-400 cursor-pointer" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1">
                    <Label className="text-muted-foreground text-[10px] uppercase tracking-wider font-semibold">
                      Passport Number
                    </Label>
                    <Badge
                      variant="outline"
                      className="text-[8px] h-3 px-1 border-teal-200 text-teal-600 bg-teal-50"
                    >
                      Secure
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="font-mono font-bold text-sm text-slate-800 uppercase break-all">
                      {selectedJourney.passport_number || "Not provided"}
                    </p>
                    {selectedJourney.passport_number && (
                      <button
                        onClick={() =>
                          navigator.clipboard.writeText(selectedJourney.passport_number || "")
                        }
                        className="p-1 hover:bg-slate-200 rounded transition-colors"
                        title="Copy Passport"
                      >
                        <Copy className="h-3 w-3 text-slate-400 cursor-pointer" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1">
                    <Label className="text-muted-foreground text-[10px] uppercase tracking-wider font-semibold">
                      Surname (First 5)
                    </Label>
                    <Badge
                      variant="outline"
                      className="text-[8px] h-3 px-1 border-teal-200 text-teal-600 bg-teal-50"
                    >
                      Secure
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="font-mono font-bold text-sm text-slate-800 uppercase break-all">
                      {selectedJourney.surname || "Not provided"}
                    </p>
                    {selectedJourney.surname && (
                      <button
                        onClick={() => navigator.clipboard.writeText(selectedJourney.surname || "")}
                        className="p-1 hover:bg-slate-200 rounded transition-colors"
                        title="Copy Surname"
                      >
                        <Copy className="h-3 w-3 text-slate-400 cursor-pointer" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-[10px] uppercase tracking-wider font-semibold">
                    Journey Type
                  </Label>
                  <p className="font-semibold text-sm mt-1">{selectedJourney.journey_type}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-[10px] uppercase tracking-wider font-semibold">
                    Status
                  </Label>
                  <div className="mt-1">{getStatusBadge(selectedJourney.status)}</div>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-[10px] uppercase tracking-wider font-semibold">
                    Created Date
                  </Label>
                  <p className="text-sm mt-1 text-slate-600 font-medium">
                    {new Date(selectedJourney.created_at).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>

              {/* CEAC Quick Link */}
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3 flex items-center justify-between">
                <div className="text-sm text-blue-900">
                  <span className="font-semibold">Check CEAC Portal:</span> Use the credentials
                  above to check live tracking.
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-white"
                  onClick={() =>
                    window.open("https://ceac.state.gov/CEACStatTracker/Status.aspx", "_blank")
                  }
                >
                  Open CEAC <ExternalLink className="ml-2 h-3 w-3" />
                </Button>
              </div>

              {/* Tracking Steps (Collapsible) */}
              <div className="space-y-3">
                <h3 className="font-semibold text-xs uppercase tracking-widest text-slate-500 mb-2">
                  Operational Tracking (Editable)
                </h3>

                {/* Step 1.15: USCIS Case Status */}
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                  <button
                    onClick={() => setOpenStep(openStep === "uscis" ? null : "uscis")}
                    className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center ${trackingStatus.uscis_status ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-400"}`}
                      >
                        <FileText size={16} />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-bold text-[#0c1b33]">1.15: USCIS Case Status</p>
                        <p className="text-[11px] text-slate-500">
                          {trackingStatus.uscis_status
                            ? `Status: ${trackingStatus.uscis_status.replace(/_/g, " ")}`
                            : "No managed tracking updates yet"}
                        </p>
                      </div>
                    </div>
                    <ChevronDown
                      size={16}
                      className={`text-slate-400 transition-transform ${openStep === "uscis" ? "rotate-180" : ""}`}
                    />
                  </button>

                  {openStep === "uscis" && (
                    <div className="p-4 border-t border-slate-100 bg-slate-50/30 animate-in slide-in-from-top-2 duration-200">
                      <div className="space-y-3">
                        <Label className="text-xs uppercase tracking-wider font-bold">
                          Update USCIS Status
                        </Label>
                        <Select
                          value={trackingStatus.uscis_status || ""}
                          onValueChange={(val) =>
                            setTrackingStatus((prev) => ({
                              ...prev,
                              uscis_status: val,
                              uscis_status_updated: new Date().toISOString(),
                            }))
                          }
                        >
                          <SelectTrigger className="bg-white">
                            <SelectValue placeholder="Select current status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="receipt_notice_sent">Receipt Notice Sent</SelectItem>
                            <SelectItem value="case_received">Case Received</SelectItem>
                            <SelectItem value="under_review">Actively Reviewing</SelectItem>
                            <SelectItem value="rfe">Request for Evidence (RFE)</SelectItem>
                            <SelectItem value="approved">Case Approved</SelectItem>
                            <SelectItem value="denied">Case Denied</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </div>

                {/* Step 2.9: NVC Review */}
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                  <button
                    onClick={() => setOpenStep(openStep === "nvc" ? null : "nvc")}
                    className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center ${trackingStatus.nvc_review_complete ? "bg-green-100 text-green-600" : "bg-slate-100 text-slate-400"}`}
                      >
                        <FileText size={16} />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-bold text-[#0c1b33]">2.9: NVC Review Status</p>
                        <p className="text-[11px] text-slate-500">
                          {trackingStatus.nvc_review_complete
                            ? `Completed on ${trackingStatus.nvc_review_date}`
                            : "Awaiting review completion"}
                        </p>
                      </div>
                    </div>
                    <ChevronDown
                      size={16}
                      className={`text-slate-400 transition-transform ${openStep === "nvc" ? "rotate-180" : ""}`}
                    />
                  </button>

                  {openStep === "nvc" && (
                    <div className="p-4 border-t border-slate-100 bg-slate-50/30 animate-in slide-in-from-top-2 duration-200">
                      <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200">
                        <span className="text-sm font-medium">Mark Review as Complete</span>
                        <Button
                          size="sm"
                          variant={trackingStatus.nvc_review_complete ? "outline" : "default"}
                          onClick={() =>
                            setTrackingStatus((prev) => ({
                              ...prev,
                              nvc_review_complete: !prev.nvc_review_complete,
                              nvc_review_date: !prev.nvc_review_complete
                                ? new Date().toISOString().split("T")[0]
                                : null,
                            }))
                          }
                        >
                          {trackingStatus.nvc_review_complete ? "Undo" : "Confirm Completion"}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Step 2.10: DQ Status */}
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                  <button
                    onClick={() => setOpenStep(openStep === "dq" ? null : "dq")}
                    className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center ${trackingStatus.dq_status === "qualified" ? "bg-teal-100 text-teal-600" : "bg-slate-100 text-slate-400"}`}
                      >
                        <CheckCircle size={16} />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-bold text-[#0c1b33]">2.10: DQ (Doc Qualified)</p>
                        <p className="text-[11px] text-slate-500">
                          {trackingStatus.dq_status === "qualified"
                            ? `Approved on ${trackingStatus.dq_date}`
                            : "Case pending DQ approval"}
                        </p>
                      </div>
                    </div>
                    <ChevronDown
                      size={16}
                      className={`text-slate-400 transition-transform ${openStep === "dq" ? "rotate-180" : ""}`}
                    />
                  </button>

                  {openStep === "dq" && (
                    <div className="p-4 border-t border-slate-100 bg-slate-50/30 animate-in slide-in-from-top-2 duration-200">
                      <div className="space-y-3">
                        <Label className="text-xs uppercase tracking-wider font-bold">
                          Set Status
                        </Label>
                        <Select
                          value={trackingStatus.dq_status || "pending"}
                          onValueChange={(val) =>
                            setTrackingStatus((prev) => ({
                              ...prev,
                              dq_status: val,
                              dq_date:
                                val === "qualified"
                                  ? new Date().toISOString().split("T")[0]
                                  : prev.dq_date,
                            }))
                          }
                        >
                          <SelectTrigger className="bg-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="qualified">Qualified</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </div>

                {/* Step 2.11: Interview Queue */}
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                  <button
                    onClick={() => setOpenStep(openStep === "queue" ? null : "queue")}
                    className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center ${trackingStatus.interview_queue ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-400"}`}
                      >
                        <Clock size={16} />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-bold text-[#0c1b33]">2.11: Interview Queue</p>
                        <p className="text-[11px] text-slate-500">
                          {trackingStatus.interview_queue
                            ? "Currently in queue at ISL"
                            : "Not yet in queue"}
                        </p>
                      </div>
                    </div>
                    <ChevronDown
                      size={16}
                      className={`text-slate-400 transition-transform ${openStep === "queue" ? "rotate-180" : ""}`}
                    />
                  </button>

                  {openStep === "queue" && (
                    <div className="p-4 border-t border-slate-100 bg-slate-50/30 animate-in slide-in-from-top-2 duration-200">
                      <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200">
                        <span className="text-sm font-medium">Add to Interview Queue</span>
                        <Button
                          size="sm"
                          variant={trackingStatus.interview_queue ? "outline" : "default"}
                          onClick={() =>
                            setTrackingStatus((prev) => ({
                              ...prev,
                              interview_queue: !prev.interview_queue,
                            }))
                          }
                        >
                          {trackingStatus.interview_queue ? "Remove" : "Assign Queue"}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Step 3.9: Administrative Processing */}
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                  <button
                    onClick={() => setOpenStep(openStep === "ap" ? null : "ap")}
                    className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center ${trackingStatus.ap_status ? "bg-orange-100 text-orange-600" : "bg-slate-100 text-slate-400"}`}
                      >
                        <AlertCircle size={16} />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-bold text-[#0c1b33]">
                          3.9: Admin Processing (AP)
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {trackingStatus.ap_status
                            ? `Status: ${trackingStatus.ap_status === "pending" ? "Pending" : "Cleared"}`
                            : "Case normal (No AP)"}
                        </p>
                      </div>
                    </div>
                    <ChevronDown
                      size={16}
                      className={`text-slate-400 transition-transform ${openStep === "ap" ? "rotate-180" : ""}`}
                    />
                  </button>

                  {openStep === "ap" && (
                    <div className="p-4 border-t border-slate-100 bg-slate-50/30 animate-in slide-in-from-top-2 duration-200">
                      <div className="flex gap-2">
                        <Button
                          className="flex-1"
                          size="sm"
                          variant={
                            trackingStatus.ap_status === "pending" ? "destructive" : "outline"
                          }
                          onClick={() =>
                            setTrackingStatus((prev) => ({
                              ...prev,
                              ap_status: prev.ap_status === "pending" ? null : "pending",
                              ap_date:
                                prev.ap_status === "pending"
                                  ? null
                                  : new Date().toISOString().split("T")[0],
                            }))
                          }
                        >
                          {trackingStatus.ap_status === "pending" ? "Remove AP" : "Mark Pending"}
                        </Button>
                        <Button
                          className="flex-1"
                          size="sm"
                          variant={trackingStatus.ap_status === "cleared" ? "secondary" : "default"}
                          onClick={() =>
                            setTrackingStatus((prev) => ({
                              ...prev,
                              ap_status: prev.ap_status === "cleared" ? null : "cleared",
                              ap_cleared_date:
                                prev.ap_status === "cleared"
                                  ? null
                                  : new Date().toISOString().split("T")[0],
                            }))
                          }
                        >
                          {trackingStatus.ap_status === "cleared" ? "Undo Cleared" : "Mark Cleared"}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Log Status Check */}
              <div className="border border-indigo-200 rounded-xl overflow-hidden bg-indigo-50/40">
                <div className="flex items-center gap-3 p-4 border-b border-indigo-100">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                    <Clock size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#0c1b33]">Log Status Check</p>
                    <p className="text-[11px] text-slate-500">
                      {selectedJourney?.admin_last_checked_at
                        ? `Last logged: ${new Date(selectedJourney.admin_last_checked_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}`
                        : "Never checked"}
                    </p>
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  {/* Case Status Dropdown */}
                  <div className="space-y-1.5">
                    <Label className="text-xs uppercase tracking-wider font-bold">
                      Case Status
                    </Label>
                    <select
                      value={caseStatus}
                      onChange={(e) => setCaseStatus(e.target.value)}
                      className="w-full h-9 rounded-md border border-slate-200 px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    >
                      <option value="">, Select Status, </option>
                      <option value="Pending">Pending</option>
                      <option value="Ready">Ready</option>
                      <option value="In Transit">In Transit</option>
                      <option value="Administrative Processing">
                        Administrative Processing (AP)
                      </option>
                      <option value="221(g)">221(g)</option>
                      <option value="Refused">Refused</option>
                      <option value="Issued">Issued</option>
                      <option value="Approved">Approved</option>
                      <option value="Not Available">Not Available</option>
                    </select>
                  </div>
                  {/* Last Checked Date */}
                  <div className="space-y-1.5">
                    <Label className="text-xs uppercase tracking-wider font-bold">
                      Last Checked Date
                    </Label>
                    <input
                      type="date"
                      value={checkDate}
                      max={today}
                      onChange={(e) => {
                        setCheckDate(e.target.value);
                        setCheckDateError(validateCheckDate(e.target.value));
                      }}
                      className={`w-full h-9 rounded-md border px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 ${checkDateError ? "border-red-400" : "border-slate-200"}`}
                    />
                    {checkDateError && (
                      <p className="text-[11px] text-red-600 font-medium flex items-center gap-1">
                        <AlertCircle size={11} /> {checkDateError}
                      </p>
                    )}
                    <p className="text-[10px] text-slate-400">
                      Auto-set to today. Max 30 days past. No future dates.
                    </p>
                  </div>
                  {/* Notes (optional) */}
                  <div className="space-y-1.5">
                    <Label className="text-xs uppercase tracking-wider font-bold">
                      Notes <span className="font-normal text-slate-400">(optional)</span>
                    </Label>
                    <textarea
                      value={checkNotes}
                      onChange={(e) => setCheckNotes(e.target.value)}
                      placeholder="e.g. Checked CEAC, status unchanged, case still in AP..."
                      rows={2}
                      className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
                    />
                  </div>
                  <Button
                    size="sm"
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                    onClick={handleLogCheckNow}
                    disabled={isSaving || !!checkDateError}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    {isSaving ? "Saving..." : "Log Check & Save"}
                  </Button>
                </div>
              </div>

              {/* Admin Notes */}
              <div>
                <Label htmlFor="admin-notes">Admin Notes</Label>
                <Textarea
                  id="admin-notes"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add internal notes about this case..."
                  className="min-h-[120px] mt-2"
                />
              </div>

              <DialogFooter className="flex justify-between w-full sm:justify-between items-center mt-6">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleClearTracking}
                  disabled={isSaving}
                  className="mr-auto"
                >
                  <AlertCircle className="mr-2 h-4 w-4" />
                  Clear Tracking
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    disabled={isSaving}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleSaveNotes} disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <Loader size="sm" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
