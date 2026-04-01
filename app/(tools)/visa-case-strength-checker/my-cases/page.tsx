"use client";

import { useState, useEffect } from "react";
import {
  FileText,
  Calendar,
  Eye,
  Plus,
  CheckCircle,
  AlertTriangle,
  Heart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Pagination from "@/components/ui/pagination";
import { Loader } from "@/components/ui/spinner";
import { ElementType } from "react";
import ActionMenu from "@/app/components/shared/ActionMenu";
import { ConfirmationModal } from "@/app/components/shared/ConfirmationModal";
import { DataTable, Column } from "@/app/components/shared/table/DataTable";
import { FilterPanel } from "@/app/components/shared/FilterPanel";

type RiskLevel = "STRONG" | "MODERATE" | "WEAK" | "PENDING";
type CaseType = "Spouse";

interface UserCase {
  sessionId: string;
  userEmail: string;
  userName: string;
  caseType: CaseType;
  overallScore: number | null;
  riskLevel: RiskLevel;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

const RiskLevelBadge = ({
  riskLevel,
  score,
}: {
  riskLevel: RiskLevel;
  score: number | null;
}) => {
  const riskConfig: Record<
    RiskLevel,
    { color: string; icon: ElementType; label: string }
  > = {
    STRONG: {
      color: "bg-green-100 text-green-800",
      icon: CheckCircle,
      label: "Strong",
    },
    MODERATE: {
      color: "bg-yellow-100 text-yellow-800",
      icon: AlertTriangle,
      label: "Moderate",
    },
    WEAK: {
      color: "bg-red-100 text-red-800",
      icon: AlertTriangle,
      label: "Weak",
    },
    PENDING: {
      color: "bg-gray-100 text-gray-800",
      icon: AlertTriangle,
      label: "Pending",
    },
  };

  const config = riskConfig[riskLevel];
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${config.color}`}
    >
      <Icon className="w-3 h-3" />
      {score !== null ? `${config.label} (${Math.round(score)})` : config.label}
    </span>
  );
};

const getCategoryIcon = (caseType: CaseType) => {
  switch (caseType) {
    case "Spouse":
      return Heart;
    default:
      return FileText;
  }
};

export default function MyCases() {
  const [cases, setCases] = useState<UserCase[]>([]);
  const [filteredCases, setFilteredCases] = useState<UserCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    null,
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);

  // Filter states
  const [selectedCaseType, setSelectedCaseType] = useState<string>("all");
  const [selectedRiskLevel, setSelectedRiskLevel] = useState<string>("all");

  // pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const ITEMS_PER_PAGE = 10;

  // fetch user cases
  useEffect(() => {
    const fetchUserCases = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/visa-checker/results`);

        const data = await response.json();

        if (response.ok) {
          setCases(data);
        } else {
          setError(data.error || "Failed to fetch cases");
          setCases([]);
        }
      } catch (error) {
        console.error("Error fetching user cases:", error);
        setError("Failed to load cases");
        setCases([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUserCases();
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = cases;

    // Case type filter
    if (selectedCaseType !== "all") {
      filtered = filtered.filter((c) => c.caseType === selectedCaseType);
    }

    // Risk level filter
    if (selectedRiskLevel !== "all") {
      filtered = filtered.filter((c) => c.riskLevel === selectedRiskLevel);
    }

    setFilteredCases(filtered);
    setCurrentPage(1);
  }, [cases, selectedCaseType, selectedRiskLevel]);

  // open modal when session is selected
  useEffect(() => {
    if (selectedSessionId) setModalOpen(true);
  }, [selectedSessionId]);

  const handleDelete = async (sessionId: string) => {
    if (!selectedSessionId) return;
    setLoadingDelete(true);

    try {
      const res = await fetch(`/api/visa-checker/session/${sessionId}/delete`, {
        method: "DELETE",
      });

      let data;
      try {
        data = await res.json();
      } catch {
        data = null;
      }

      if (!res.ok) {
        throw new Error(data?.error || "Failed to delete session");
      }

      setCases((prev) => prev.filter((c) => c.sessionId !== selectedSessionId));
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
    Math.ceil(filteredCases.length / ITEMS_PER_PAGE)
  );
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentCases = filteredCases.slice(startIndex, endIndex);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getCaseTypeLabel = (caseType: CaseType) => {
    switch (caseType) {
      case "Spouse":
        return "IR-1/CR-1 Spouse Visa";
      default:
        return caseType;
    }
  };

  const uniqueCaseTypes = Array.from(
    new Set(cases.map((c) => c.caseType))
  );

  const columns: Column<UserCase>[] = [
    {
      key: "caseType",
      label: "Case Type",
      width: "30%",
      render: (userCase) => {
        const Icon = getCategoryIcon(userCase.caseType);
        return (
          <div className="flex items-center">
            <div className="bg-teal-100 text-teal-800 w-10 h-10 rounded-full flex items-center justify-center mr-3">
              <Icon className="w-5 h-5 text-teal-600" />
            </div>
            <div className="text-base font-semibold text-slate-900">
              {getCaseTypeLabel(userCase.caseType)}
            </div>
          </div>
        );
      },
    },
    {
      key: "createdAt",
      label: "Submitted Date",
      width: "25%",
      render: (userCase) => (
        <div className="flex items-center">
          <div className="bg-slate-100 text-slate-800 w-10 h-10 rounded-full flex items-center justify-center mr-3">
            <Calendar className="w-4 h-4 text-slate-600" />
          </div>
          <div className="text-base text-slate-700">
            {formatDate(userCase.createdAt)}
          </div>
        </div>
      ),
    },
    {
      key: "riskLevel",
      label: "Status",
      width: "25%",
      render: (userCase) => (
        <RiskLevelBadge
          riskLevel={userCase.riskLevel}
          score={userCase.overallScore}
        />
      ),
    },
    {
      key: "actions",
      label: "Actions",
      width: "20%",
      className: "text-right",
      render: (userCase) => (
        <ActionMenu
          onView={() =>
            (window.location.href = `/visa-case-strength-checker/result?sessionId=${userCase.sessionId}`)
          }
          onDelete={() => setSelectedSessionId(userCase.sessionId)}
        />
      ),
    },
  ];

  const emptyState = (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden text-center py-16">
      <FileText className="w-16 h-16 text-gray-300 mx-auto mb-6" />
      <h3 className="text-2xl font-bold text-gray-900 mb-2">
        No cases found
      </h3>
      <p className="text-lg text-gray-500 mb-8">
        You haven&apos;t submitted any visa case assessments yet.
      </p>
      <div>
        <Button
          onClick={() =>
            (window.location.href = "/visa-case-strength-checker")
          }
          className="bg-teal-600 hover:bg-teal-700 text-white py-4 px-6 text-lg"
        >
          <Plus className="w-5 h-5 mr-2" />
          Start Your First Assessment
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 text-gray-800 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-3">
            My Visa Cases
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Track and manage all your visa case assessments in one place
          </p>
        </header>

        <div className="flex flex-col sm:flex-row justify-between items-center mb-10 gap-4">
          <h2 className="text-2xl font-bold text-slate-800">All Cases</h2>
          <div className="flex items-center gap-3">
            {cases.length > 0 && (
              <FilterPanel
                fields={[
                  {
                    key: "caseType",
                    label: "Case Type",
                    options: [
                      { value: "all", label: "All Types" },
                      ...uniqueCaseTypes.map((type) => ({
                        value: type,
                        label: getCaseTypeLabel(type),
                      })),
                    ],
                    value: selectedCaseType,
                  },
                  {
                    key: "riskLevel",
                    label: "Risk Level",
                    options: [
                      { value: "all", label: "All Levels" },
                      { value: "STRONG", label: "Strong" },
                      { value: "MODERATE", label: "Moderate" },
                      { value: "WEAK", label: "Weak" },
                      { value: "PENDING", label: "Pending" },
                    ],
                    value: selectedRiskLevel,
                  },
                ]}
                onFilterChange={(filters) => {
                  setSelectedCaseType(filters.caseType || "all");
                  setSelectedRiskLevel(filters.riskLevel || "all");
                }}
                itemCount={filteredCases.length}
                totalCount={cases.length}
              />
            )}
            <Button
              onClick={() =>
                (window.location.href = "/visa-case-strength-checker")
              }
              className="bg-teal-600 hover:bg-teal-700 text-white py-5 px-6 text-lg"
            >
              <Plus className="w-5 h-5 mr-2" />
              New Assessment
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader size="md" />
          </div>
        ) : error ? (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden text-center py-16">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Error Loading Cases
            </h3>
            <p className="text-lg text-gray-500 mb-6">{error}</p>
            <Button
              onClick={() => window.location.reload()}
              className="bg-teal-600 hover:bg-teal-700 text-white py-4 px-6 text-lg"
            >
              Try Again
            </Button>
          </div>
        ) : (
          <>
            <DataTable
              columns={columns}
              data={currentCases}
              rowKey={(userCase) => userCase.sessionId}
              emptyState={emptyState}
              loading={false}
            />

            {/* Pagination - only show if there are cases and multiple pages */}
            {filteredCases.length > 0 && totalPages > 1 && (
              <div className="py-6 flex justify-center">
                <Pagination
                  currentPage={currentPage}
                  totalItems={filteredCases.length}
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
        description="Are you sure you want to delete this case? This action cannot be undone."
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
