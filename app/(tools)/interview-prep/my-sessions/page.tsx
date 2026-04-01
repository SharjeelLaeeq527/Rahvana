"use client";

import { useState, useEffect } from "react";
import {
  BookOpen,
  Calendar,
  Clock,
  Plus,
  AlertTriangle,
  CheckCircle,
  BarChart3,
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
import { Loader } from "@/components/ui/spinner";
import { ElementType } from "react";
import ActionMenu from "@/app/components/shared/ActionMenu";
import { ConfirmationModal } from "@/app/components/shared/ConfirmationModal";

type VisaCategory = "IR-1";
type SessionStatus = "COMPLETED" | "IN_PROGRESS" | "NOT_STARTED";

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
  "ir-1-spouse": "IR-1 Spouse",
};

const getCategoryLabel = (slug: string): string => {
  return CategoryLabel[slug] || slug;
};

const CompletionBadge = ({
  status,
  percentage,
}: {
  status: SessionStatus;
  percentage: number;
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
      icon: Clock,
      label: "Not Started",
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-3 site-main-px site-main-py">
      <div className="relative w-12 h-12">
        <svg className="w-full h-full" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="8"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke={
              status === "COMPLETED"
                ? "#10b981"
                : status === "IN_PROGRESS"
                  ? "#3b82f6"
                  : "#9ca3af"
            }
            strokeWidth="8"
            strokeDasharray={`${(percentage / 100) * 282.7} 282.7`}
            strokeLinecap="round"
            transform="rotate(-90 50 50)"
          />
          <text
            x="50"
            y="55"
            textAnchor="middle"
            fontSize="24"
            fontWeight="bold"
            fill={
              status === "COMPLETED"
                ? "#10b981"
                : status === "IN_PROGRESS"
                  ? "#3b82f6"
                  : "#9ca3af"
            }
          >
            {Math.round(percentage)}%
          </text>
        </svg>
      </div>
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    null
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);

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
  const totalPages = Math.max(1, Math.ceil(sessions.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentSessions = sessions.slice(startIndex, endIndex);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getSessionStatus = (session: SessionWithDetails): SessionStatus => {
    if (session.completed || session.completionPercentage === 100) {
      return "COMPLETED";
    } else if (session.answerCount > 0) {
      return "IN_PROGRESS";
    } else {
      return "NOT_STARTED";
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 text-gray-800 py-12 px-4">
      <div className="max-w-6xl mx-auto">
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
          <Button
            onClick={() => (window.location.href = "/interview-prep")}
            className="bg-teal-600 hover:bg-teal-700 text-white py-5 px-6 text-lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            New Session
          </Button>
        </div>

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
              className="bg-teal-600 hover:bg-teal-700 text-white py-4 px-6 text-lg"
            >
              Try Again
            </Button>
          </div>
        ) : sessions.length === 0 ? (
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
                className="bg-teal-600 hover:bg-teal-700 text-white py-4 px-6 text-lg"
              >
                <Plus className="w-5 h-5 mr-2" />
                Start Your First Session
              </Button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-slate-200">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b-2 border-slate-200">
                    <TableHead className="text-lg font-bold text-slate-800 py-4">
                      Visa Category
                    </TableHead>
                    <TableHead className="text-lg font-bold text-slate-800 py-4">
                      Created
                    </TableHead>
                    <TableHead className="text-lg font-bold text-slate-800 py-4">
                      Last Updated
                    </TableHead>
                    <TableHead className="text-lg font-bold text-slate-800 py-4">
                      Progress
                    </TableHead>
                    <TableHead className="text-lg font-bold text-slate-800 py-4 text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {currentSessions.map((session) => (
                    <TableRow
                      key={session.id}
                      className="hover:bg-slate-50 border-b border-slate-100"
                    >
                      <TableCell className="py-5">
                        <div className="flex items-center">
                          <div className="bg-teal-100 text-teal-800 w-10 h-10 rounded-full flex items-center justify-center mr-3">
                            <BookOpen className="w-5 h-5 text-teal-600" />
                          </div>
                          <div className="text-base font-semibold text-slate-900">
                            {getCategoryLabel(session.category_slug)}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="py-5">
                        <div className="flex items-center">
                          <div className="bg-slate-100 text-slate-800 w-10 h-10 rounded-full flex items-center justify-center mr-3">
                            <Calendar className="w-4 h-4 text-slate-600" />
                          </div>
                          <div className="text-base text-slate-700">
                            {formatDate(session.created_at)}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="py-5">
                        <div className="flex items-center">
                          <div className="bg-slate-100 text-slate-800 w-10 h-10 rounded-full flex items-center justify-center mr-3">
                            <Clock className="w-4 h-4 text-slate-600" />
                          </div>
                          <div className="text-base text-slate-700">
                            {formatDate(session.updated_at)}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="py-5">
                        <CompletionBadge
                          status={getSessionStatus(session)}
                          percentage={session.completionPercentage}
                        />
                      </TableCell>

                      <TableCell className="py-5 text-right">
                        <ActionMenu
                          onView={() =>
                            (window.location.href = `/interview-prep/result?sessionId=${session.id}`)
                          }
                          onDelete={() => setSelectedSessionId(session.id)}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>

                {/* Pagination - only show if there are sessions and multiple pages */}
                {sessions.length > 0 && totalPages > 1 && (
                  <TableRow>
                    <TableCell colSpan={5} className="py-6">
                      <div className="w-full flex justify-center">
                        <Pagination
                          currentPage={currentPage}
                          totalItems={sessions.length}
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
