"use client";

import Result from "@/app/components/visa-checker/Result";
import { useEffect, useState } from "react";
import { useLanguage } from "@/app/context/LanguageContext";

// Define the exact shape here (or import from a shared types file)
type VisaData = {
  status: "current" | "waiting" | "unavailable" | string;
  categoryFull: string;
  priorityDate: string;
  country: string;
  applicationType: string;
  chartUsed: string;
  cutoffDate: string;
  currentBulletin: string;
  daysBehind: number;
  waitEstimate?: {
    formatted?: string;
    avg_movement?: number;
    years?: number;
  } | null;
};

export default function ResultPage() {
  const { t } = useLanguage();
  const [result, setResult] = useState<VisaData | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("visaResult");
      if (saved) {
        const parsed = JSON.parse(saved);

        // Optional: basic validation to avoid crashes from corrupted data
        if (
          parsed &&
          typeof parsed === "object" &&
          "status" in parsed &&
          "priorityDate" in parsed
        ) {
          setResult(parsed as VisaData);
        } else {
          console.warn("Invalid visa result data in localStorage");
        }
      }
    } catch (err) {
      console.error("Failed to parse visaResult from localStorage", err);
    }
  }, []);

  if (!result) {
    return (
      <div className="text-center flex items-center justify-center p-10 min-h-[50vh]">
        <p>{t("visaChecker.result.noResult")}</p>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 site-main-px site-main-py">
      <div className="max-w-2xl xl:max-w-4xl mx-auto">
        <Result data={result} />
      </div>
    </div>
  );
}
