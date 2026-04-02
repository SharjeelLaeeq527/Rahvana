"use client";

import { Suspense } from "react";

import { useSearchParams } from "next/navigation";
import { ResultPage } from "./ResultPage";

function ResultPageInner() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId");

  const handleRestart = () => {
    window.location.href = "/visa-case-strength-checker";
  };

  const handleEdit = () => {
    // Navigate back to the form to allow editing
    window.location.href = `/visa-case-strength-checker?sessionId=${sessionId}`;
  };

  const handleSaveToProfile = async () => {
    // Implementation for saving results to user's profile
    // This would typically involve calling an API endpoint
    try {
      const response = await fetch("/api/visa-checker/save-results", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sessionId }),
      });

      if (!response.ok) {
        throw new Error("Failed to save results");
      }

      // Optionally show success notification here
      console.log("Results saved successfully");
    } catch (error) {
      console.error("Error saving results:", error);
      throw error; // Re-throw to be handled by the component
    }
  };

  if (!sessionId) {
    return (
      <div className="bg-linear-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center max-w-md xl:max-w-xl">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              Invalid Session
            </h2>
            <p className="text-slate-600 mb-6">
              No session ID provided. Please start a new assessment.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-linear-to-br from-slate-50 to-slate-100 site-main-px site-main-py">
      <div className="">
        <div className="mb-6">
          <button
            onClick={() => window.history.back()}
            className="text-teal-600 hover:text-teal-700 font-medium flex items-center gap-2"
          >
            ← Back to My Cases
          </button>
        </div>
        <ResultPage
          sessionId={sessionId}
          onRestart={handleRestart}
          onEdit={handleEdit}
          onSaveToProfile={handleSaveToProfile}
        />
      </div>
    </div>
  );
}

export default function ResultPageRoute() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResultPageInner />
    </Suspense>
  );
}
