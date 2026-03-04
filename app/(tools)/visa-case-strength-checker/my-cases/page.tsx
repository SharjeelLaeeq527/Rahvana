"use client";

import { useState, useEffect } from "react";
import {
  FileText,
  Calendar,
  Clock,
  Eye,
  Plus,
  CheckCircle,
  AlertTriangle,
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
import { ElementType } from "react";

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
      icon: Clock,
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

export default function MyCases() {
  const [cases, setCases] = useState<UserCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  // pagination calculations
  const totalPages = Math.max(1, Math.ceil(cases.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentCases = cases.slice(startIndex, endIndex);

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

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
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
        ) : cases.length === 0 ? (
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
        ) : (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-slate-200">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b-2 border-slate-200">
                    <TableHead className="text-lg font-bold text-slate-800 py-4">
                      Case Type
                    </TableHead>
                    <TableHead className="text-lg font-bold text-slate-800 py-4">
                      Submitted Date
                    </TableHead>
                    <TableHead className="text-lg font-bold text-slate-800 py-4">
                      Status
                    </TableHead>
                    <TableHead className="text-lg font-bold text-slate-800 py-4 text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {currentCases.map((userCase) => (
                    <TableRow
                      key={userCase.sessionId}
                      className="hover:bg-slate-50 border-b border-slate-100"
                    >
                      <TableCell className="py-5">
                        <div className="flex items-center">
                          <div className="bg-teal-100 text-teal-800 w-10 h-10 rounded-full flex items-center justify-center mr-3">
                            <FileText className="w-5 h-5 text-teal-600" />
                          </div>
                          <div className="text-base font-semibold text-slate-900">
                            {getCaseTypeLabel(userCase.caseType)}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="py-5">
                        <div className="flex items-center">
                          <div className="bg-slate-100 text-slate-800 w-10 h-10 rounded-full flex items-center justify-center mr-3">
                            <Calendar className="w-4 h-4 text-slate-600" />
                          </div>
                          <div className="text-base text-slate-700">
                            {formatDate(userCase.createdAt)}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="py-5">
                        <RiskLevelBadge
                          riskLevel={userCase.riskLevel}
                          score={userCase.overallScore}
                        />
                      </TableCell>

                      <TableCell className="py-5 text-right">
                        <Button
                          variant="outline"
                          size="lg"
                          onClick={() =>
                            (window.location.href = `/visa-case-strength-checker/result?sessionId=${userCase.sessionId}`)
                          }
                          className="text-teal-600 hover:text-teal-700 hover:bg-teal-50 border-slate-300 py-5 px-6 text-base"
                          disabled={!userCase.completed}
                        >
                          <Eye className="w-5 h-5 mr-2" />
                          {userCase.completed ? "View Details" : "Incomplete"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>

                {/* Pagination - only show if there are cases and multiple pages */}
                {cases.length > 0 && totalPages > 1 && (
                  <TableRow>
                    <TableCell colSpan={4} className="py-6">
                      <div className="w-full flex justify-center">
                        <Pagination
                          currentPage={currentPage}
                          totalItems={cases.length}
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
    </div>
  );
}
