"use client";

import { useState, useEffect } from "react";
import {
  BookOpen,
  Plus,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Heart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Pagination from "@/components/ui/pagination";
import { Loader } from "@/components/ui/spinner";
import { ElementType } from "react";
import ActionMenu from "@/app/components/shared/ActionMenu";
import { ConfirmationModal } from "@/app/components/shared/ConfirmationModal";
import { DataTable, Column } from "@/app/components/shared/table";
import { FilterPanel, FilterField } from "@/app/components/shared/FilterPanel";

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
}

const CategoryLabel: Record<string, string> = {
  "ir-1-spouse": "IR-1/CR-1 Spouse",
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

const CompletionBadge = ({
  status,
}: {
  status: SessionStatus;
}) => {
  const statusConfig: Record<
    SessionStatus,
    { color: string; icon: ElementType; label: string }
  > = {
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
          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${config.color}`}
        >
          <Icon className="w-3 h-3" />
          {config.label}
        </span>
      </div>
    </div>
  );
};

export default function MyInterviewSessions() {
  const [sessions, setSessions] = useState<SessionWithDetails[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<SessionWithDetails[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    null
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);

  // Filter states
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedTime, setSelectedTime] = useState<TimeFilter>("all");

  // pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const ITEMS_PER_PAGE = 10;

  // fetch user sessions
  useEffect(() => {
    const fetchUserSessions = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/interview-prep/user-sessions`);

        const data = await response.json();

        if (response.ok) {
          setSessions(data.sessions);
        } else {
          setError(data.error || "Failed to fetch sessions");
          setSessions([]);
        }
      } catch (error) {
        console.error("Error fetching user sessions:", error);
        setError("Failed to load sessions");
        setSessions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUserSessions();
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = sessions;

    // Category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter((s) => s.category_slug === selectedCategory);
    }

    // Status filter
    if (selectedStatus !== "all") {
      filtered = filtered.filter(
        (s) => getSessionStatus(s) === selectedStatus
      );
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
  }, [sessions, selectedCategory, selectedStatus, selectedTime]);

  // open modal when session is selected
  useEffect(() => {
    if (selectedSessionId) setModalOpen(true);
  }, [selectedSessionId]);

  const handleDelete = async (sessionId: string) => {
    if (!selectedSessionId) return;
    setLoadingDelete(true);

    try {
      const res = await fetch(
        `/api/interview-prep/sessions/${sessionId}/delete`,
        {
          method: "DELETE",
        }
      );

      let data;
      try {
        data = await res.json();
      } catch {
        data = null;
      }

      if (!res.ok) {
        throw new Error(data?.error || "Failed to delete session");
      }

      setSessions((prev) => prev.filter((s) => s.id !== selectedSessionId));
      setModalOpen(false);
      setSelectedSessionId(null);
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Failed to delete session");
    } finally {
      setLoadingDelete(false);
    }
  };

  // pagination calculations
  const totalPages = Math.max(
    1,
    Math.ceil(filteredSessions.length / ITEMS_PER_PAGE)
  );
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

  const uniqueCategories = Array.from(
    new Set(sessions.map((s) => s.category_slug))
  );

  const getCategoryIcon = (categorySlug: string) => {
    if (categorySlug.includes("spouse") || categorySlug.includes("ir-1")) {
      return Heart;
    }
    return BookOpen;
  };

  const columns: Column<SessionWithDetails>[] = [
    {
      key: "category",
      label: "Visa Category",
      width: "25%",
      render: (session) => {
        const Icon = getCategoryIcon(session.category_slug);
        return (
          <div className="flex items-center">
            <div className="bg-teal-100 text-teal-800 w-10 h-10 rounded-full flex items-center justify-center mr-3">
              <Icon className="w-5 h-5 text-teal-600" />
            </div>
            <div className="text-base font-semibold text-slate-900">
              {getCategoryLabel(session.category_slug)}
            </div>
          </div>
        );
      },
    },
    {
      key: "created",
      label: "Created",
      width: "25%",
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
      width: "25%",
      render: (session) => (
        <CompletionBadge
          status={getSessionStatus(session)}
        />
      ),
    },
    {
      key: "actions",
      label: "Actions",
      width: "25%",
      className: "text-right",
      render: (session) => (
        <ActionMenu
          onView={() =>
            (window.location.href = `/interview-prep/result?sessionId=${session.id}`)
          }
          onDelete={() => setSelectedSessionId(session.id)}
        />
      ),
    },
  ];

  const emptyState = (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden text-center py-16">
      <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-6" />
      <h3 className="text-2xl font-bold text-gray-900 mb-2">
        No sessions found
      </h3>
      <p className="text-lg text-gray-500 mb-8">
        You haven&apos;t created any interview preparation sessions yet.
      </p>
      <div>
        <Button
          onClick={() => (window.location.href = "/interview-prep")}
          className="bg-[#0d7377] hover:bg-[#0a5a5d] text-white py-4 px-6 text-lg"
        >
          <Plus className="w-5 h-5 mr-2" />
          Start Your First Session
        </Button>
      </div>
    </div>
  );

  return (
    <div className="bg-linear-to-br from-slate-50 to-slate-100 text-gray-800 site-main-py site-main-px">
      <div className="">
        <header className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-3">
            My Interview Sessions
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Track and manage all your interview preparation sessions
          </p>
        </header>

        <div className="flex flex-col sm:flex-row justify-between items-center mb-10 gap-4">
          <h2 className="text-2xl font-bold text-slate-800">All Sessions</h2>
          <div className="flex items-center gap-3">
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
                totalCount={sessions.length}
              />
            )}
            <Button
              onClick={() => (window.location.href = "/interview-prep")}
              className="bg-[#0d7377] hover:bg-[#0a5a5d] text-white py-5 px-6 text-lg"
            >
              <Plus className="w-5 h-5 mr-2" />
              New Session
            </Button>
          </div>
        </div>

        {!loading && sessions.length > 0 && null}

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader size="md" />
          </div>
        ) : error ? (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden text-center py-16">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Error Loading Sessions
            </h3>
            <p className="text-lg text-gray-500 mb-6">{error}</p>
            <Button
              onClick={() => window.location.reload()}
              className="bg-[#0d7377] hover:bg-[#0a5a5d] text-white py-4 px-6 text-lg"
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
            />

            {/* Pagination */}
            {filteredSessions.length > ITEMS_PER_PAGE && totalPages > 1 && (
              <div className="py-6 flex justify-center">
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

      <ConfirmationModal
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) setSelectedSessionId(null);
        }}
        title="Confirm Delete"
        description="Are you sure you want to delete this session? This action cannot be undone and all your answers will be lost."
        confirmText="Delete"
        confirmVariant="danger"
        onConfirm={() => {
          if (selectedSessionId) handleDelete(selectedSessionId);
        }}
        loading={loadingDelete}
      />
    </div>
  );
}
