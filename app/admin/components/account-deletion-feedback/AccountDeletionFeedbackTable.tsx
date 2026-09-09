"use client";

import { useEffect, useMemo, useState } from "react";
import { useToast } from "@/app/components/shared/ToastProvider";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Search, MessageSquareText } from "lucide-react";
import { CustomDropdown } from "@/app/components/shared/CustomDropdown";

type DeletionReason =
  | "journey_completed"
  | "couldnt_find_needed"
  | "missing_features"
  | "technical_problem"
  | "privacy_security_concern"
  | "found_alternative"
  | "other";

interface AccountDeletionFeedback {
  id: string;
  reason: DeletionReason;
  follow_up_answers: Record<string, string> | null;
  additional_comments: string | null;
  created_at: string;
}

interface FeedbackResponse {
  data: AccountDeletionFeedback[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next_page: boolean;
    has_previous_page: boolean;
  };
}

const ITEMS_PER_PAGE = 10;

const DELETION_REASONS: {
  value: DeletionReason | "all";
  label: string;
}[] = [
  {
    value: "all",
    label: "All Reasons",
  },
  {
    value: "journey_completed",
    label: "Journey Completed",
  },
  {
    value: "couldnt_find_needed",
    label: "Couldn't Find What I Needed",
  },
  {
    value: "missing_features",
    label: "Missing Features",
  },
  {
    value: "technical_problem",
    label: "Technical Problem",
  },
  {
    value: "privacy_security_concern",
    label: "Privacy / Security Concern",
  },
  {
    value: "found_alternative",
    label: "Found Another Solution",
  },
  {
    value: "other",
    label: "Other",
  },
];

const REASON_LABELS: Record<DeletionReason, string> = {
  journey_completed: "Journey Completed",
  couldnt_find_needed: "Couldn't Find What I Needed",
  missing_features: "Missing Features",
  technical_problem: "Technical Problem",
  privacy_security_concern: "Privacy / Security Concern",
  found_alternative: "Found Another Solution",
  other: "Other",
};

const FOLLOW_UP_LABELS: Record<string, string> = {
  journey_stage: "Current journey status",
  information_needed: "What they were looking for",
  feature_needed: "Feature needed",
  problem_type: "Problem type",
  concern_type: "Privacy / security concern",
  alternative_type: "Alternative solution",
  what_were_you_trying_to_do: "What they were trying to do",
  additional_context: "What the other solution provided",
};

const FOLLOW_UP_VALUE_LABELS: Record<string, string> = {
  visa_received: "I received my visa",
  immigration_process_completed: "I completed my immigration process",
  no_longer_need_assistance: "I no longer need immigration assistance",

  journey_guidance: "Step-by-step immigration journey guidance",
  visa_information: "Information about my visa category",
  document_checklists: "Document checklists and requirements",
  forms_assistance: "Forms and form-filling assistance",
  case_status_information: "Case or status information",

  better_journey_tracking: "Better journey tracking",
  more_visa_categories: "More visa categories",
  document_assistance: "Document assistance",
  case_status_tracking: "Case or status tracking",
  notifications_reminders: "Notifications or reminders",
  more_personalized_guidance: "More personalized guidance",

  something_didnt_work: "Something didn't work",
  encountered_error: "I encountered an error",
  page_too_slow: "The page was too slow",
  couldnt_complete_action: "I couldn't complete an action",
  information_not_displaying: "Information wasn't displaying correctly",

  personal_information_storage: "How my personal information is stored",
  document_handling: "How my documents are handled",
  account_security: "Account security",
  data_sharing: "Data sharing",
  uncomfortable_providing_information: "I wasn't comfortable providing personal information",

  immigration_attorney: "An immigration attorney",
  another_immigration_platform: "Another immigration platform",
  government_official_resources: "Government or official resources",
  community_social_media: "Community or social media",
  personal_research: "Personal research",
  someone_helping_directly: "Someone helping me directly",

  other: "Other",
};

const formatFollowUpValue = (key: string, value: string) => {
  return FOLLOW_UP_VALUE_LABELS[value] || value;
};

export default function AccountDeletionFeedbackTable() {
  const { showToast } = useToast();

  const [feedback, setFeedback] = useState<AccountDeletionFeedback[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedReason, setSelectedReason] = useState<DeletionReason | "all">("all");

  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const [currentPage, setCurrentPage] = useState(1);

  const [selectedFeedback, setSelectedFeedback] = useState<AccountDeletionFeedback | null>(null);

  const [viewModalOpen, setViewModalOpen] = useState(false);

  const [serverPagination, setServerPagination] = useState({
    page: 1,
    limit: ITEMS_PER_PAGE,
    total: 0,
    total_pages: 0,
    has_next_page: false,
    has_previous_page: false,
  });

  // Fetch feedback
  const fetchFeedback = async () => {
    setLoading(true);

    try {
      const params = new URLSearchParams();

      params.set("page", currentPage.toString());
      params.set("limit", ITEMS_PER_PAGE.toString());

      if (selectedReason !== "all") {
        params.set("reason", selectedReason);
      }

      const response = await fetch(`/api/admin/account-deletion-feedback?${params.toString()}`);

      const data: FeedbackResponse | { error?: string } = await response.json();

      if (!response.ok) {
        throw new Error(
          "error" in data && data.error ? data.error : "Failed to fetch account deletion feedback."
        );
      }

      const responseData = data as FeedbackResponse;

      setFeedback(responseData.data);
      setServerPagination(responseData.pagination);
    } catch (error) {
      console.error("Error fetching account deletion feedback:", error);

      showToast(
        error instanceof Error ? error.message : "Failed to load account deletion feedback.",
        "error",
        {
          duration: 3000,
        }
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedback();
  }, [currentPage, selectedReason]);

  // Client-side search + sorting
  const filteredFeedback = useMemo(() => {
    let filtered = [...feedback];

    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase().trim();

      filtered = filtered.filter((item) => {
        const reason = REASON_LABELS[item.reason].toLowerCase();
        const comments = item.additional_comments?.toLowerCase() || "";

        return reason.includes(search) || comments.includes(search);
      });
    }

    filtered.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();

      return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
    });

    return filtered;
  }, [feedback, searchTerm, sortOrder]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedReason]);

  // Helpers
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const getReasonBadgeClass = (reason: DeletionReason) => {
    switch (reason) {
      case "journey_completed":
        return "bg-green-100 text-green-800";

      case "couldnt_find_needed":
        return "bg-orange-100 text-orange-800";

      case "missing_features":
        return "bg-purple-100 text-purple-800";

      case "technical_problem":
        return "bg-red-100 text-red-800";

      case "privacy_security_concern":
        return "bg-yellow-100 text-yellow-800";

      case "found_alternative":
        return "bg-blue-100 text-blue-800";

      case "other":
        return "bg-gray-100 text-gray-700";

      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const openFeedback = (item: AccountDeletionFeedback) => {
    setSelectedFeedback(item);
    setViewModalOpen(true);
  };

  const renderFollowUpAnswers = (answers: Record<string, string> | null) => {
    if (!answers || Object.keys(answers).length === 0) {
      return <p className="text-sm text-slate-400 italic">No follow-up response was provided.</p>;
    }

    return (
      <div className="space-y-4">
        {Object.entries(answers).map(([key, value]) => (
          <div key={key}>
            <p className="mb-1 text-sm font-medium text-slate-500">
              {FOLLOW_UP_LABELS[key] || key}
            </p>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm leading-6 text-slate-700">{formatFollowUpValue(key, value)}</p>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Render
  return (
    <>
      {/* Main Table Card */}
      <Card className="mx-auto mt-4 max-w-6xl">
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />

            <Input
              placeholder="Search feedback..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-80 pl-10"
            />
          </div>

          {/* Filters */}
          <div className="flex space-x-3">
            <div className="w-64 shrink-0 [&_button]:!w-full">
              <CustomDropdown
                value={selectedReason}
                onChange={(value) => setSelectedReason(value as DeletionReason | "all")}
                options={DELETION_REASONS}
                placeholder="Filter by reason"
              />
            </div>

            <CustomDropdown
              value={sortOrder}
              onChange={(value) => setSortOrder(value as "asc" | "desc")}
              options={[
                {
                  value: "desc",
                  label: "Latest First",
                },
                {
                  value: "asc",
                  label: "Oldest First",
                },
              ]}
              placeholder="Sort by date"
              className="w-40 [&_button]:w-full [&_button]:min-w-0"
            />
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader size="md" text="Loading account deletion feedback..." />
            </div>
          ) : filteredFeedback.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                <MessageSquareText className="h-6 w-6 text-slate-400" />
              </div>

              <h3 className="text-sm font-semibold text-slate-800">No feedback found</h3>

              <p className="mt-1 max-w-sm text-sm text-slate-500">
                No account deletion feedback matches your current search or filter.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reason</TableHead>
                    <TableHead>Follow-up / Feedback</TableHead>
                    <TableHead>Submitted Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filteredFeedback.map((item) => (
                    <TableRow key={item.id}>
                      {/* Reason */}
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={`${getReasonBadgeClass(item.reason)} whitespace-nowrap`}
                        >
                          {REASON_LABELS[item.reason]}
                        </Badge>
                      </TableCell>

                      {/* Feedback */}
                      <TableCell className="max-w-md">
                        {item.follow_up_answers &&
                        Object.keys(item.follow_up_answers).length > 0 ? (
                          <div className="space-y-1">
                            <p className="truncate text-sm font-medium text-slate-700">
                              {(() => {
                                const [key, value] = Object.entries(item.follow_up_answers)[0];

                                return `${FOLLOW_UP_LABELS[key] || key}: ${formatFollowUpValue(
                                  key,
                                  value
                                )}`;
                              })()}
                            </p>

                            {item.additional_comments && (
                              <p className="truncate text-xs text-slate-500">
                                {item.additional_comments}
                              </p>
                            )}
                          </div>
                        ) : item.additional_comments ? (
                          <p className="truncate text-sm text-slate-600">
                            {item.additional_comments}
                          </p>
                        ) : (
                          <span className="text-sm text-slate-400 italic">
                            No additional feedback
                          </span>
                        )}
                      </TableCell>

                      {/* Date */}
                      <TableCell className="whitespace-nowrap">
                        {formatDate(item.created_at)}
                      </TableCell>

                      {/* Action */}
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className="cursor-pointer"
                          onClick={() => openFeedback(item)}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>

                {/* Pagination */}
                {serverPagination.total_pages > 1 && (
                  <TableFooter>
                    <TableRow>
                      <TableCell colSpan={4}>
                        <div className="flex w-full justify-center py-4">
                          <Pagination
                            currentPage={currentPage}
                            totalItems={serverPagination.total}
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
        {/* Total */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Responses</CardTitle>
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-bold">{serverPagination.total}</div>
          </CardContent>
        </Card>

        {/* Current Page */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Showing</CardTitle>
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-bold">{filteredFeedback.length}</div>
          </CardContent>
        </Card>

        {/* With Comments */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">With Comments</CardTitle>
          </CardHeader>

          <CardContent>
            <div className="text-primary text-2xl font-bold">
              {
                feedback.filter(
                  (item) => item.additional_comments && item.additional_comments.trim().length > 0
                ).length
              }
            </div>
          </CardContent>
        </Card>

        {/* Current Page */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Current Page</CardTitle>
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-bold">
              {serverPagination.page}
              <span className="ml-1 text-sm font-normal text-gray-400">
                / {serverPagination.total_pages || 1}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* View Feedback Modal */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-slate-900">
              Account Deletion Feedback
            </DialogTitle>
          </DialogHeader>

          {selectedFeedback && (
            <div className="space-y-5 py-2">
              {/* Reason */}
              <div>
                <p className="mb-2 text-sm font-medium text-slate-500">Reason for leaving</p>

                <Badge variant="secondary" className={getReasonBadgeClass(selectedFeedback.reason)}>
                  {REASON_LABELS[selectedFeedback.reason]}
                </Badge>
              </div>

              {/* Follow-up Response */}
              <div>
                <p className="mb-2 text-sm font-medium text-slate-500">Follow-up response</p>

                {renderFollowUpAnswers(selectedFeedback.follow_up_answers)}
              </div>

              {/* Additional Feedback */}
              <div>
                <p className="mb-2 text-sm font-medium text-slate-500">Additional feedback</p>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  {selectedFeedback.additional_comments ? (
                    <p className="text-sm leading-6 whitespace-pre-wrap text-slate-700">
                      {selectedFeedback.additional_comments}
                    </p>
                  ) : (
                    <p className="text-sm text-slate-400 italic">
                      No additional feedback was provided.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
