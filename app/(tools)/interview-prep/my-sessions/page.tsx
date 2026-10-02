"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { E, msg } from "@/lib/errors";
import {
  UsersRound,
  Plus,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Heart,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Pagination from "@/components/ui/pagination";
import { Loader } from "@/components/ui/spinner";
import { ElementType } from "react";
import { DataTable, Column } from "@/app/components/shared/table";
import { FilterPanel } from "@/app/components/shared/FilterPanel";
import { useToast } from "@/app/components/shared/ToastProvider";
import { NarrativeModal } from "../../(visa)/221g-action-planner/components/NarrativeModal";
import { QuickAccessButton } from "@/app/components/shared/QuickAccessButton";

type SessionStatus = "COMPLETED" | "IN_PROGRESS" | "NOT_STARTED";
type TimeFilter = "all" | "today" | "week" | "month";

interface SessionWithDetails {
  id: string;
  category_slug: string;
  user_email: string;
  user_name: string;
  completed: boolean;
  created_at: string;
  updated_at: string;
  answerCount: number;
  questionCount: number;
  completionPercentage: number;
  // source: "tool" | "journey";
  journey_id?: string | null;
}

const CategoryLabel: Record<string, string> = {
  "ir-1-spouse": "IR-1/CR-1 Spouse",
  "ir-5-parent": "IR-5 Parent",
};

const getCategoryLabel = (slug: string): string => {
  return CategoryLabel[slug] || slug;
};

const getRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? "s" : ""} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} week${weeks > 1 ? "s" : ""} ago`;
  }
  const months = Math.floor(diffDays / 30);
  return `${months} month${months > 1 ? "s" : ""} ago`;
};

const formatCreatedDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const CompletionBadge = ({ status }: { status: SessionStatus }) => {
  const statusConfig: Record<SessionStatus, { color: string; icon: ElementType; label: string }> = {
    COMPLETED: {
      color: "bg-green-100 text-green-800",
      icon: CheckCircle,
      label: "Completed",
    },
    IN_PROGRESS: {
      color: "bg-blue-100 text-blue-800",
      icon: BarChart3,
      label: "In Progress",
    },
    NOT_STARTED: {
      color: "bg-gray-100 text-gray-800",
      icon: CheckCircle,
      label: "Not Started",
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-3">
      <div>
        <span
          className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${config.color}`}
        >
          <Icon className="h-3 w-3" />
          {config.label}
        </span>
      </div>
    </div>
  );
};

export default function MyInterviewSessions() {
  const router = useRouter();
  const [sessions, setSessions] = useState<SessionWithDetails[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<SessionWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false); // background refresh
  const [error, setError] = useState<string | null>(null);

  const { showToast } = useToast();

  // Filter states
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedTime, setSelectedTime] = useState<TimeFilter>("all");
  const [showNarrative, setShowNarrative] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const hasShownNarrative = useRef(false);

  // pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const ITEMS_PER_PAGE = 10;

  const visibleSessions = useMemo(() => {
    return sessions;
  }, [sessions]);

  // fetch user sessions
  const fetchUserSessions = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await fetch("/api/interview-prep/user-sessions");
      const data = await response.json();

      if (response.ok) {
        setSessions(data.sessions);
      } else {
        setError(msg(E.TOOL_INTERVIEW_SESSION_FAILED));
      }
    } catch {
      setError(msg(E.TOOL_INTERVIEW_SESSION_FAILED));
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchUserSessions(false);

    // Poll to reflect session status changes. 30s (was 5s) — a sessions LIST
    // does not need second-by-second freshness, and 5s meant ~12 DB hits/min per
    // open tab. Still gated on tab visibility so background tabs make no calls.
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchUserSessions(true);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (hasShownNarrative.current) return;

    const localHide =
      typeof window !== "undefined" &&
      localStorage.getItem("dont_show_interview_narrative") === "true";

    hasShownNarrative.current = true;
    setShowNarrative(!localHide);
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = visibleSessions;

    // Category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter((s) => s.category_slug === selectedCategory);
    }

    // Status filter
    if (selectedStatus !== "all") {
      filtered = filtered.filter((s) => getSessionStatus(s) === selectedStatus);
    }

    // Time filter
    if (selectedTime !== "all") {
      const now = new Date();

      filtered = filtered.filter((s) => {
        const createdDate = new Date(s.created_at);
        const diffMs = now.getTime() - createdDate.getTime();
        const diffDays = diffMs / (1000 * 60 * 60 * 24);

        switch (selectedTime) {
          case "today":
            return diffDays < 1;
          case "week":
            return diffDays < 7;
          case "month":
            return diffDays < 30;
          default:
            return true;
        }
      });
    }

    setFilteredSessions(filtered);
    setCurrentPage(1);
  }, [selectedCategory, selectedStatus, selectedTime, visibleSessions]);

  const hasShownToast = useRef(false);

  useEffect(() => {
    if (hasShownToast.current) return;

    const params = new URLSearchParams(window.location.search);
    const message = params.get("message");

    if (message === "session-exists") {
      showToast(
        "You already have a session for this visa category. Only one session per category is allowed.",
        "info"
      );

      window.history.replaceState({}, "", "/interview-prep/my-sessions");
    }
  }, []);

  // pagination calculations
  const totalPages = Math.max(1, Math.ceil(filteredSessions.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentSessions = filteredSessions.slice(startIndex, endIndex);

  const getSessionStatus = (session: SessionWithDetails): SessionStatus => {
    if (session.completed || session.completionPercentage === 100) {
      return "COMPLETED";
    } else if (session.answerCount > 0) {
      return "IN_PROGRESS";
    } else {
      return "NOT_STARTED";
    }
  };

  const uniqueCategories = Array.from(new Set(sessions.map((s) => s.category_slug)));

  const getCategoryIcon = (categorySlug: string) => {
    if (categorySlug.includes("spouse") || categorySlug.includes("ir-1")) {
      return Heart;
    }
    return UsersRound;
  };

  const columns: Column<SessionWithDetails>[] = [
    {
      key: "category",
      label: "Visa Category",
      width: "22%",
      render: (session) => {
        const Icon = getCategoryIcon(session.category_slug);
        return (
          <div className="flex items-center">
            <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-transparent text-teal-800 sm:bg-teal-100">
              <Icon className="h-5 w-5 text-teal-600" />
            </div>

            <div className="text-base font-semibold text-slate-900">
              {getCategoryLabel(session.category_slug)}
            </div>
          </div>
        );
      },
    },
    // {
    //   key: "source",
    //   label: "Source",
    //   width: "15%",
    //   render: (session) => (
    //     <span
    //       className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
    //         session.source === "tool" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"
    //       }`}
    //     >
    //       {session.source === "tool" ? "Tool" : "Journey"}
    //     </span>
    //   ),
    // },
    {
      key: "created",
      label: "Created",
      width: "23%",
      render: (session) => (
        <div className="flex flex-col">
          <div className="text-base font-medium text-slate-900">
            {formatCreatedDate(session.created_at)}
          </div>
          <div className="text-sm text-slate-500">
            Last active {getRelativeTime(session.updated_at)}
          </div>
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      width: "20%",
      render: (session) => <CompletionBadge status={getSessionStatus(session)} />,
    },
    {
      key: "actions",
      label: "Actions",
      width: "18%",
      className: "text-left",
      render: (session) => (
        <Button
          size="sm"
          onClick={() => (window.location.href = `/interview-prep/result?sessionId=${session.id}`)}
          className="bg-[#0d7377] text-white hover:bg-[#0a5a5d]"
        >
          View Session
        </Button>
      ),
    },
  ];

  const emptyState = (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white text-center shadow-sm">
      <div className="mx-auto flex max-w-2xl flex-col items-center px-6 py-16 sm:px-10">
        <div className="bg-primary/10 text-primary mb-6 flex h-16 w-16 items-center justify-center rounded-2xl">
          <FileText className="h-8 w-8" />
        </div>
        <h3 className="text-2xl font-semibold tracking-tight text-slate-950">No sessions found</h3>
        <p className="mt-3 max-w-lg text-base leading-7 text-slate-500">
          You haven&apos;t created any interview preparation sessions yet. Start one and Rahvana
          will guide you through the process.
        </p>
        <Button
          onClick={() => router.push("/interview-prep?newSession=1")}
          className="bg-primary shadow-primary/20 hover:bg-primary/90 mt-8 h-11 rounded-full px-5 text-white shadow-sm"
        >
          <Plus className="mr-2 h-5 w-5" />
          Start Your First Session
        </Button>
      </div>
    </div>
  );

  const showInitialLoader = loading && sessions.length === 0;

  return (
    <div className="site-main-py site-main-px bg-linear-to-br from-slate-50 to-slate-100 text-gray-800">
      <div className="mt-12">
        <NarrativeModal
          isOpen={showNarrative}
          onClose={() => {
            if (dontShowAgain) {
              localStorage.setItem("dont_show_interview_narrative", "true");
            }
            setShowNarrative(false);
          }}
          onComplete={() => {
            if (dontShowAgain) {
              localStorage.setItem("dont_show_interview_narrative", "true");
            }
            setShowNarrative(false);
          }}
          dontShowAgain={dontShowAgain}
          onDontShowAgainChange={setDontShowAgain}
          variant="interview-prep"
        />

        <header className="mb-12 text-center">
          <h1 className="mb-3 text-4xl font-bold text-slate-900 md:text-5xl">
            My Interview Sessions
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-gray-600">
            Track and manage all your interview preparation sessions
          </p>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            <QuickAccessButton
              item={{
                id: "interview-prep",
                title: "Interview Prep",
                href: "/interview-prep",
                icon_name: "MessageSquare",
              }}
            />
          </div>
        </header>

        <div className="mb-10 flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="-mt-8 text-2xl font-bold text-slate-800 sm:mt-0">All Sessions</h2>

          <div className="flex w-full items-center justify-between gap-3 sm:w-auto sm:justify-end">
            {sessions.length > 0 && (
              <FilterPanel
                fields={[
                  {
                    key: "category",
                    label: "Visa Category",
                    options: [
                      { value: "all", label: "All Categories" },
                      ...uniqueCategories.map((cat) => ({
                        value: cat,
                        label: getCategoryLabel(cat),
                      })),
                    ],
                    value: selectedCategory,
                  },
                  {
                    key: "status",
                    label: "Status",
                    options: [
                      { value: "all", label: "All Statuses" },
                      { value: "COMPLETED", label: "Completed" },
                      { value: "IN_PROGRESS", label: "In Progress" },
                      { value: "NOT_STARTED", label: "Not Started" },
                    ],
                    value: selectedStatus,
                  },

                  {
                    key: "time",
                    label: "Created",
                    options: [
                      { value: "all", label: "All Time" },
                      { value: "today", label: "Today" },
                      { value: "week", label: "This Week" },
                      { value: "month", label: "This Month" },
                    ],
                    value: selectedTime,
                  },
                ]}
                onFilterChange={(filters) => {
                  setSelectedCategory(filters.category || "all");
                  setSelectedStatus(filters.status || "all");
                  setSelectedTime((filters.time || "all") as TimeFilter);
                }}
                itemCount={filteredSessions.length}
                totalCount={visibleSessions.length}
              />
            )}

            <Button
              onClick={() => router.push("/interview-prep?newSession=1")}
              className="bg-primary shadow-primary/20 hover:bg-primary/90 h-11 rounded-full px-5 text-white shadow-sm"
            >
              <Plus className="mr-2 h-5 w-5" />
              New Session
            </Button>
          </div>
        </div>

        {!loading && visibleSessions.length > 0 && null}

        {showInitialLoader ? (
          <div className="flex h-64 items-center justify-center">
            <Loader size="md" />
          </div>
        ) : error ? (
          <div className="overflow-hidden rounded-xl bg-white py-16 text-center shadow-lg">
            <AlertTriangle className="mx-auto mb-6 h-16 w-16 text-red-500" />
            <h3 className="mb-2 text-2xl font-bold text-gray-900">Error Loading Sessions</h3>
            <p className="mb-6 text-lg text-gray-500">{error}</p>
            <Button
              onClick={() => window.location.reload()}
              className="bg-[#0d7377] px-6 py-4 text-lg text-white hover:bg-[#0a5a5d]"
            >
              Try Again
            </Button>
          </div>
        ) : filteredSessions.length === 0 ? (
          emptyState
        ) : (
          <>
            <DataTable
              columns={columns}
              data={currentSessions}
              rowKey={(session) => session.id}
              loading={false}
              refreshing={refreshing}
            />

            {/* Pagination */}
            {filteredSessions.length > ITEMS_PER_PAGE && totalPages > 1 && (
              <div className="flex justify-center py-6">
                <Pagination
                  currentPage={currentPage}
                  totalItems={filteredSessions.length}
                  itemsPerPage={ITEMS_PER_PAGE}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
