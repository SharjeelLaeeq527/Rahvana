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
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

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
    setIsDialogOpen(true);
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

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
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
              <CardDescription>
                Monitor and manage user visa applications
              </CardDescription>
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
                      {journeys.filter((j) => !j.tracking_status || Object.keys(j.tracking_status).length === 0).length}
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
                            <span className="font-mono text-xs font-bold text-slate-700">{journey.nvc_case_number}</span>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">Not registered</span>
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
            <DialogDescription>
              Review and update case tracking information
            </DialogDescription>
          </DialogHeader>

          {selectedJourney && (
            <div className="space-y-6">
              {/* User Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <Label className="text-muted-foreground text-xs">User Email</Label>
                  <p className="font-medium text-sm mt-1">{selectedJourney.user_email || "Unknown"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">NVC Case Number</Label>
                  <p className="font-mono font-bold text-sm mt-1">{selectedJourney.nvc_case_number || "Not provided"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">User ID</Label>
                  <p className="font-mono text-xs mt-1">{selectedJourney.user_id}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Journey Type</Label>
                  <p className="font-semibold text-sm mt-1">{selectedJourney.journey_type}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedJourney.status)}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Created</Label>
                  <p className="text-sm mt-1">
                    {new Date(selectedJourney.created_at).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>

              {/* Tracking Steps */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm uppercase tracking-wide">Tracking Steps (Manual Update)</h3>

                {/* Step 2.9: NVC Review */}
                <Card className="border-2">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <Label className="font-semibold">Step 2.9: NVC Document Review</Label>
                      <Badge variant={trackingStatus.nvc_review_complete ? "default" : "outline"}>
                        {trackingStatus.nvc_review_complete ? "Complete" : "Pending"}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={trackingStatus.nvc_review_complete ? "outline" : "default"}
                        onClick={() =>
                          setTrackingStatus((prev) => ({
                            ...prev,
                            nvc_review_complete: !prev.nvc_review_complete,
                            nvc_review_date: !prev.nvc_review_complete ? new Date().toISOString().split("T")[0] : null,
                          }))
                        }
                      >
                        {trackingStatus.nvc_review_complete ? "Undo" : "Mark Complete"}
                      </Button>
                      {trackingStatus.nvc_review_date && (
                        <span className="text-sm text-muted-foreground self-center">
                          Date: {trackingStatus.nvc_review_date}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Step 2.10: DQ Status */}
                <Card className="border-2">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <Label className="font-semibold">Step 2.10: Documentarily Qualified (DQ)</Label>
                      <Badge variant={trackingStatus.dq_status === "qualified" ? "default" : "outline"}>
                        {trackingStatus.dq_status || "Pending"}
                      </Badge>
                    </div>
                    <div className="flex gap-2 items-center">
                      <Select
                        value={trackingStatus.dq_status || "pending"}
                        onValueChange={(val) =>
                          setTrackingStatus((prev) => ({
                            ...prev,
                            dq_status: val,
                            dq_date: val === "qualified" ? new Date().toISOString().split("T")[0] : prev.dq_date,
                          }))
                        }
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="qualified">Qualified</SelectItem>
                        </SelectContent>
                      </Select>
                      {trackingStatus.dq_status === "qualified" && trackingStatus.dq_date && (
                        <span className="text-sm text-muted-foreground">
                          DQ Date: {trackingStatus.dq_date}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Step 2.11: Interview Queue */}
                <Card className="border-2">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <Label className="font-semibold">Step 2.11: Interview Queue</Label>
                      <Badge variant={trackingStatus.interview_queue ? "default" : "outline"}>
                        {trackingStatus.interview_queue ? "In Queue" : "Not Queued"}
                      </Badge>
                    </div>
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
                      {trackingStatus.interview_queue ? "Remove from Queue" : "Mark In Queue"}
                    </Button>
                  </CardContent>
                </Card>

                {/* Step 2.12: Interview Scheduled */}
                <Card className="border-2">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="font-semibold">Step 2.12: Interview Scheduled</Label>
                      <Badge variant={trackingStatus.interview_date ? "default" : "outline"}>
                        {trackingStatus.interview_date ? "Scheduled" : "Not Scheduled"}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs text-muted-foreground">Date</Label>
                        <Input
                          type="date"
                          value={trackingStatus.interview_date || ""}
                          onChange={(e) =>
                            setTrackingStatus((prev) => ({
                              ...prev,
                              interview_date: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Time</Label>
                        <Input
                          type="time"
                          value={trackingStatus.interview_time || ""}
                          onChange={(e) =>
                            setTrackingStatus((prev) => ({
                              ...prev,
                              interview_time: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs text-muted-foreground">Embassy/Consulate</Label>
                        <Input
                          placeholder="e.g., Islamabad, Karachi"
                          value={trackingStatus.interview_embassy || ""}
                          onChange={(e) =>
                            setTrackingStatus((prev) => ({
                              ...prev,
                              interview_embassy: e.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Step 3.9: Administrative Processing */}
                <Card className="border-2">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="font-semibold">Step 3.9: Administrative Processing (AP)</Label>
                      <Badge variant={trackingStatus.ap_status ? "default" : "outline"}>
                        {trackingStatus.ap_status || "Not Started"}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={trackingStatus.ap_status === "pending" ? "outline" : "default"}
                        onClick={() =>
                          setTrackingStatus((prev) => ({
                            ...prev,
                            ap_status: prev.ap_status === "pending" ? null : "pending",
                            ap_date: prev.ap_status === "pending" ? null : new Date().toISOString().split("T")[0],
                          }))
                        }
                      >
                        {trackingStatus.ap_status === "pending" ? "Undo AP" : "Mark AP"}
                      </Button>
                      <Button
                        size="sm"
                        variant={trackingStatus.ap_status === "cleared" ? "outline" : "default"}
                        onClick={() =>
                          setTrackingStatus((prev) => ({
                            ...prev,
                            ap_status: prev.ap_status === "cleared" ? null : "cleared",
                            ap_cleared_date: prev.ap_status === "cleared" ? null : new Date().toISOString().split("T")[0],
                          }))
                        }
                      >
                        {trackingStatus.ap_status === "cleared" ? "Undo Cleared" : "Mark AP Cleared"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
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

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
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
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
