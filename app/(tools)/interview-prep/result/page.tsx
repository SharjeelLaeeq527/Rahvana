"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ResultPage } from "./ResultPage";
import { InterviewPrepOutput } from "@/lib/interview-prep";
import { Loader } from "@/components/ui/spinner";
import { ToastProvider } from "@/app/components/shared/ToastProvider";
import { useJourneyEnvironment } from "@/lib/hooks/useJourneyEnvironment";

export interface InterviewPrepResultPageProps {
  sessionId?: string | null;
  onRestart?: () => void;
  isEmbedded?: boolean;
  toolHref?: string | null;
}

export default function InterviewPrepResultPage({
  sessionId: propSessionId,
  onRestart: propOnRestart,
  isEmbedded: propIsEmbedded,
  toolHref,
}: InterviewPrepResultPageProps = {}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<InterviewPrepOutput | null>(null);
  const [sessionId, setSessionIdState] = useState<string | null>(propSessionId || null);
  const router = useRouter();
  const journeyEnv = useJourneyEnvironment();
  const isEmbedded = Boolean(propIsEmbedded || journeyEnv.isInsideJourney);

  useEffect(() => {
    const fetchSessionData = async () => {
      try {
        let sId = propSessionId;

        if (!sId && toolHref && toolHref.includes("?")) {
          const p = new URLSearchParams(toolHref.split("?")[1]);
          sId = p.get("sessionId");
        }

        if (!sId && typeof window !== "undefined") {
          const urlParams = new URLSearchParams(window.location.search);
          sId = urlParams.get("sessionId");
        }

        if (!sId) {
          setError("Session ID is required");
          setLoading(false);
          return;
        }

        setSessionIdState(sId);

        // Fetch the session data with results
        const response = await fetch(`/api/interview-prep/sessions/${sId}`);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch session data");
        }

        const data = await response.json();

        // Check if session has interview results
        if (data.session && data.session.interview_prep_results) {
          const prepOutput: InterviewPrepOutput = {
            sessionId: sId,
            questions: data.session.interview_prep_results.generated_questions || [],
            summary: {
              totalQuestions: data.session.interview_prep_results.generated_questions?.length || 0,
              applicableQuestions:
                data.session.interview_prep_results.generated_questions?.length || 0,
              categories: Array.from(
                new Set(
                  (data.session.interview_prep_results.generated_questions || []).map(
                    (q: any) => q.category
                  )
                )
              ),
            },
          };
          setResults(prepOutput);
        } else {
          setError(
            "No interview results found for this session. Please complete the interview preparation first."
          );
        }
      } catch (err) {
        console.error("Error fetching session data:", err);
        setError(err instanceof Error ? err.message : "An error occurred loading session");
      } finally {
        setLoading(false);
      }
    };

    fetchSessionData();
  }, [propSessionId, toolHref]);

  const handleRestart = () => {
    if (propOnRestart) {
      propOnRestart();
    } else if (!isEmbedded) {
      router.push("/interview-prep");
    }
  };

  if (loading) {
    return (
      <ToastProvider>
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader size="lg" text="Loading session..." />
        </div>
      </ToastProvider>
    );
  }

  if (error) {
    return (
      <ToastProvider>
        <div className={`site-main-px ${isEmbedded ? "py-4" : "site-main-py mt-20"} flex min-h-[60vh] items-center justify-center bg-gradient-to-br from-slate-50 via-white to-teal-50/40`}>
          <div className="w-full max-w-xl">
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50">
              <div className="px-6 py-10 text-center sm:px-10 sm:py-12">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50">
                  <svg
                    className="h-8 w-8 text-red-500"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="9" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </div>

                <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                  Unable to Load Your Interview
                </h2>

                <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500 sm:text-base">
                  We couldn&apos;t load your interview preparation session. Please try again or
                  start a new session.
                </p>

                <div className="mx-auto mt-5 max-w-md rounded-xl border border-red-100 bg-red-50/70 px-4 py-3">
                  <p className="text-sm font-medium text-red-700">{error}</p>
                </div>

                <div className="mt-7 flex justify-center">
                  <button
                    onClick={handleRestart}
                    className="inline-flex h-11 items-center justify-center rounded-full bg-[#0d7377] px-6 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-[#0a5a5d] hover:shadow-md focus:ring-2 focus:ring-[#0d7377]/30 focus:ring-offset-2 focus:outline-none"
                  >
                    Start New Interview Prep
                  </button>
                </div>

                <p className="mt-5 text-xs text-slate-400">
                  Your previous session may still be available from My Sessions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </ToastProvider>
    );
  }

  if (!results || results.questions.length === 0) {
    return (
      <ToastProvider>
        <div className={`site-main-px ${isEmbedded ? "py-4" : "site-main-py"} flex min-h-[60vh] items-center justify-center bg-gradient-to-br from-slate-50 via-white to-amber-50/30`}>
          <div className="w-full max-w-xl">
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50">
              <div className="px-6 py-10 text-center sm:px-10 sm:py-12">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50">
                  <svg
                    className="h-8 w-8 text-amber-500"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 8v4" />
                    <path d="M12 16h.01" />
                  </svg>
                </div>

                <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                  No Results Available
                </h2>

                <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500 sm:text-base">
                  We couldn&apos;t find any interview results for this session. You can start a new
                  interview preparation session to continue.
                </p>

                <div className="mx-auto mt-5 max-w-md rounded-xl border border-amber-100 bg-amber-50/70 px-4 py-3">
                  <p className="text-sm font-medium text-amber-700">
                    This session doesn&apos;t contain any completed interview results yet.
                  </p>
                </div>

                <div className="mt-7 flex justify-center">
                  <button
                    onClick={handleRestart}
                    className="inline-flex h-11 items-center justify-center rounded-full bg-[#0d7377] px-6 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-[#0a5a5d] hover:shadow-md focus:ring-2 focus:ring-[#0d7377]/30 focus:ring-offset-2 focus:outline-none"
                  >
                    Start New Interview Prep
                  </button>
                </div>

                <p className="mt-5 text-xs text-slate-400">
                  You can also return to My Sessions to review your existing sessions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </ToastProvider>
    );
  }

  return (
    <div className={`container mx-auto ${isEmbedded ? "mt-2" : "mt-16"}`}>
      <ToastProvider>
        <ResultPage sessionId={sessionId || ""} results={results} onRestart={handleRestart} />
      </ToastProvider>
    </div>
  );
}
