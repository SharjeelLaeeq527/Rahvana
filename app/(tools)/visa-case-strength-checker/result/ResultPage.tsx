"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, AlertTriangle, Info } from "lucide-react";
import { Loader } from "@/components/ui/spinner";

interface RiskFlag {
  flagCode: string;
  severity: "HIGH" | "MEDIUM" | "LOW";
  pointsDeducted: number;
  explanation: string;
  improvementSuggestions: string;
  improvementPriority?: number;
}

interface ResultData {
  sessionId: string;
  overallScore: number;
  riskLevel: "STRONG" | "MODERATE" | "WEAK" | "PENDING";
  riskFlags: RiskFlag[];
  summaryReasons: string[];
  improvementSuggestions: string[];
  completedAt?: string;
  totalPossiblePoints?: number;
  totalDeductedPoints?: number;
}

interface ResultPageProps {
  sessionId?: string;
  onRestart: () => void;
  onEdit: () => void;
  onSaveToProfile: () => Promise<void>;
}

export function ResultPage({
  sessionId,
  onRestart,
  onEdit,
  onSaveToProfile,
}: ResultPageProps) {
  const [resultData, setResultData] = useState<ResultData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionGone, setSessionGone] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  const fetchResults = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setSessionGone(false);

      const response = await fetch(`/api/visa-checker/results/${sessionId}`);
      const data = await response.json();

      if (!response.ok) {
        const errorMsg: string = data.error || "Failed to fetch results";
        // Detect dead/gone session — clear localStorage so it doesn't retry forever
        const isGoneSession =
          errorMsg.includes("no longer exists") ||
          errorMsg.includes("not found") ||
          errorMsg.includes("not submitted");
        if (isGoneSession) {
          localStorage.removeItem("visaCheckerSessionId");
          setSessionGone(true);
        }
        throw new Error(errorMsg);
      }

      setResultData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load results");
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader size="md" text="Analyzing your case..." />
      </div>
    );
  }

  if (!sessionId) {
    return (
      <Card className="max-w-4xl mx-auto">
        <CardContent className="p-8 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">
            Session not found
          </h3>
          <p className="text-slate-600 mb-6">
            Your assessment session could not be loaded. Please restart.
          </p>
          <Button onClick={onRestart}>Start New Assessment</Button>
        </CardContent>
      </Card>
    );
  }

  if (sessionGone || error) {
    return (
      <Card className="max-w-4xl mx-auto">
        <CardContent className="p-8 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">
            {sessionGone ? "Previous Session Expired" : "Error Loading Results"}
          </h3>
          <p className="text-slate-600 mb-6">
            {sessionGone
              ? "Your previous assessment session is no longer available. This can happen if the session expired or was not saved correctly. Please start a new analysis — it only takes a few minutes!"
              : error}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={onRestart}
              className="bg-primary text-primary-foreground"
            >
              Start New Assessment
            </Button>
            {!sessionGone && (
              <Button onClick={fetchResults} variant="outline">
                Try Again
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!resultData) {
    return null;
  }

  const getRiskColor = (level: string) => {
    switch (level) {
      case "STRONG":
        return "text-green-600 bg-green-50 border-green-200";
      case "MODERATE":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "WEAK":
        return "text-red-600 bg-red-50 border-red-200";
      default:
        return "text-slate-600 bg-slate-50 border-slate-200";
    }
  };

  // Group risk flags by priority (using severity as proxy if priority not available)
  const groupedFlags = {
    high: resultData.riskFlags.filter((f) => f.severity === "HIGH"),
    medium: resultData.riskFlags.filter((f) => f.severity === "MEDIUM"),
    low: resultData.riskFlags.filter((f) => f.severity === "LOW"),
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10">
      {/* Header Section */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-slate-900">
          Case Strength Analysis Complete
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Your visa case has been analyzed. Here&apos;s your detailed assessment
          with actionable insights.
        </p>
      </div>

      {/* Overall Score Card */}
      <Card className="border-2 border-slate-200 bg-white">
        <CardHeader>
          <CardTitle className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-2xl font-bold text-slate-900">
              Overall Assessment
            </span>
            <Badge
              className={`${getRiskColor(resultData.riskLevel)} text-xl px-6 py-3 font-bold`}
            >
              {resultData.riskLevel}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <span className="text-lg text-slate-700 font-medium">
                Overall Score
              </span>
              <span className="text-4xl font-bold text-slate-900">
                {Math.round(resultData.overallScore)}/100
              </span>
            </div>
            <Progress
              value={resultData.overallScore}
              className="h-4"
              indicatorClassName={
                resultData.overallScore >= 80
                  ? "bg-green-500"
                  : resultData.overallScore >= 50
                    ? "bg-yellow-500"
                    : "bg-red-500"
              }
            />
            <div className="text-center text-slate-600 mt-2">
              {resultData.overallScore >= 80
                ? "Strong Case"
                : resultData.overallScore >= 50
                  ? "Moderate Case"
                  : "Needs Improvement"}
            </div>
          </div>

          <div className="p-6 bg-slate-50 rounded-xl border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-800 mb-3">
              Summary of Findings
            </h3>
            <ul className="list-disc pl-6 space-y-2">
              {resultData.summaryReasons?.map((reason, idx) => (
                <li key={idx} className="text-slate-700 text-base">
                  {reason}
                </li>
              ))}
            </ul>
          </div>

          <div className="text-center text-slate-500 text-sm">
            Completed on{" "}
            {resultData.completedAt
              ? new Date(resultData.completedAt).toLocaleDateString()
              : new Date().toLocaleDateString()}
          </div>
        </CardContent>
      </Card>

      {/* Improvement Suggestions Section */}
      {resultData.improvementSuggestions &&
        resultData.improvementSuggestions.length > 0 && (
          <Card className="border-2 border-slate-200 bg-white">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-slate-900">
                Improvement Suggestions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-6 space-y-3">
                {resultData.improvementSuggestions.map((suggestion, idx) => (
                  <li key={idx} className="text-slate-700 text-base">
                    {suggestion}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

      {/* Risk Flags by Priority */}
      <div className="space-y-8">
        {/* High Priority Issues */}
        {groupedFlags.high.length > 0 && (
          <Card className="border-2 border-red-200 bg-red-50">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-2xl text-red-800">
                <div className="bg-red-100 text-red-800 w-12 h-12 rounded-full flex items-center justify-center">
                  <AlertCircle className="h-6 w-6" />
                </div>
                High Priority Issues (Must Address)
              </CardTitle>
              <p className="text-red-700 text-lg">
                These are critical issues that significantly impact your case
                strength
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {groupedFlags.high.map((flag, index) => (
                  <div
                    key={index}
                    className="bg-white p-6 rounded-xl border border-red-200 shadow-sm"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                      <h4 className="font-bold text-xl text-slate-900">
                        {formatFlagCode(flag.flagCode)}
                      </h4>
                      <Badge className="bg-red-500 text-white text-sm px-3 py-1">
                        {flag.severity} RISK
                      </Badge>
                    </div>
                    <p className="text-slate-700 text-base mb-4">
                      {flag.explanation}
                    </p>
                    <div className="flex gap-3 text-base text-red-700">
                      <Info className="h-5 w-5 mt-0.5 shrink-0" />
                      <span>
                        <span className="font-medium">Action needed:</span>{" "}
                        {flag.improvementSuggestions}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Medium Priority Issues */}
        {groupedFlags.medium.length > 0 && (
          <Card className="border-2 border-yellow-200 bg-yellow-50">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-2xl text-yellow-800">
                <div className="bg-yellow-100 text-yellow-800 w-12 h-12 rounded-full flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                Medium Priority Issues (Should Address)
              </CardTitle>
              <p className="text-yellow-700 text-lg">
                These issues should be addressed to strengthen your case
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {groupedFlags.medium.map((flag, index) => (
                  <div
                    key={index}
                    className="bg-white p-6 rounded-xl border border-yellow-200 shadow-sm"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                      <h4 className="font-bold text-xl text-slate-900">
                        {formatFlagCode(flag.flagCode)}
                      </h4>
                      <Badge className="bg-yellow-500 text-white text-sm px-3 py-1">
                        {flag.severity} RISK
                      </Badge>
                    </div>
                    <p className="text-slate-700 text-base mb-4">
                      {flag.explanation}
                    </p>
                    <div className="flex gap-3 text-base text-yellow-700">
                      <Info className="h-5 w-5 mt-0.5 shrink-0" />
                      <span>
                        <span className="font-medium">Consider:</span>{" "}
                        {flag.improvementSuggestions}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Low Priority Issues */}
        {groupedFlags.low.length > 0 && (
          <Card className="border-2 border-blue-200 bg-blue-50">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-2xl text-blue-800">
                <div className="bg-blue-100 text-blue-800 w-12 h-12 rounded-full flex items-center justify-center">
                  <Info className="h-6 w-6" />
                </div>
                Low Priority Improvements (Nice to Have)
              </CardTitle>
              <p className="text-blue-700 text-lg">
                These minor improvements can enhance your case strength
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {groupedFlags.low.map((flag, index) => (
                  <div
                    key={index}
                    className="bg-white p-6 rounded-xl border border-blue-200 shadow-sm"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                      <h4 className="font-bold text-xl text-slate-900">
                        {formatFlagCode(flag.flagCode)}
                      </h4>
                      <Badge className="bg-blue-500 text-white text-sm px-3 py-1">
                        {flag.severity} RISK
                      </Badge>
                    </div>
                    <p className="text-slate-700 text-base mb-4">
                      {flag.explanation}
                    </p>
                    <div className="flex gap-3 text-base text-blue-700">
                      <Info className="h-5 w-5 mt-0.5 shrink-0" />
                      <span>
                        <span className="font-medium">Suggestion:</span>{" "}
                        {flag.improvementSuggestions}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-4 justify-center pt-8 max-w-md mx-auto">
        <Button
          onClick={onEdit}
          variant="outline"
          className="w-full flex items-center justify-center gap-2 py-6 bg-white border-2 border-primary text-primary font-bold rounded-2xl hover:bg-primary/5 transition-all shadow-lg shadow-primary/5"
        >
          Edit Information
        </Button>

        <Button
          onClick={async () => {
            setSaving(true);
            await onSaveToProfile();
            setSaveMessage("Saved to Profile!");
            setTimeout(() => setSaveMessage(""), 3000);
            setSaving(false);
          }}
          disabled={saving}
          className="w-full bg-teal-600 hover:bg-teal-700 text-white text-lg py-6 rounded-2xl"
        >
          {saving ? "Saving..." : saveMessage || "Save Results to My Profile"}
        </Button>
      </div>
    </div>
  );
}

// Helper function to format flag codes into readable text
function formatFlagCode(code: string): string {
  return code
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}
