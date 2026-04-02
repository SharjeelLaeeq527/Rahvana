// frontend/components/visa-checker/Result.tsx
"use client";

import { AlertTriangle } from "lucide-react";
import { useLanguage } from "@/app/context/LanguageContext";

type WaitEstimate = {
  formatted?: string;
  avg_movement?: number;
  years?: number;
};

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
  waitEstimate?: WaitEstimate | null;
};

export default function Result({ data }: { data: VisaData }) {
  const { t } = useLanguage();
  const {
    status,
    categoryFull,
    priorityDate,
    country,
    applicationType,
    chartUsed,
    cutoffDate,
    currentBulletin,
    daysBehind,
    waitEstimate,
  } = data;

  // Safe access
  const hasWaitEstimate = waitEstimate && waitEstimate.formatted;

  return (
    <div className="bg-white p-8 rounded-xl shadow-xl max-w-2xl xl:max-w-4xl mx-auto font-sans">
      {/* Header */}
      <div
        className={`p-4 rounded-t-xl text-white font-bold text-xl ${
          status === "current"
            ? "bg-green-600"
            : status === "waiting"
              ? "bg-blue-600"
              : "bg-orange-600"
        }`}
      >
        {status === "current" && t("visaChecker.result.statusCurrent")}
        {status === "waiting" && t("visaChecker.result.statusWaiting")}
        {status === "unavailable" && t("visaChecker.result.statusUnavailable")}
      </div>

      <div className="p-6 space-y-6">
        {/* Your Information */}
        <div>
          <h3 className="font-bold text-gray-800 mb-2">
            {t("visaChecker.result.yourInfo")}
          </h3>
          <ul className="space-y-1 text-gray-700">
            <li>
              • <strong>{t("visaChecker.result.infoCategory")}:</strong>{" "}
              {categoryFull}
            </li>
            <li>
              • <strong>{t("visaChecker.result.infoPriDate")}:</strong>{" "}
              {priorityDate}
            </li>
            <li>
              • <strong>{t("visaChecker.result.infoCountry")}:</strong>{" "}
              {country}
            </li>
            <li>
              • <strong>{t("visaChecker.result.infoAppType")}:</strong>{" "}
              {applicationType}
            </li>
          </ul>
        </div>

        {/* Current Bulletin */}
        <div>
          <h3 className="font-bold text-gray-800 mb-2">
            {t("visaChecker.result.bulletinTitle")} ({currentBulletin}):
          </h3>
          <ul className="space-y-1 text-gray-700">
            <li>
              • <strong>{t("visaChecker.result.chartUsed")}:</strong> {chartUsed}
            </li>
            <li>
              • <strong>{t("visaChecker.result.cutoffDate")}:</strong> {cutoffDate}
            </li>
          </ul>
        </div>

        {/* Waiting Status */}
        {status === "waiting" && daysBehind > 0 && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-gray-800">
              {t("visaChecker.result.waitingDesc", {
                date: priorityDate,
                cutoff: cutoffDate,
              })}
            </p>
            <p className="mt-2 font-bold text-lg">
              {t("visaChecker.result.youAre")}{" "}
              <span className="text-blue-700">
                {hasWaitEstimate
                  ? waitEstimate.formatted
                  : `${daysBehind} days`}
              </span>{" "}
              {t("visaChecker.result.behindCutoff")}
            </p>
          </div>
        )}

        {/* Estimate Box */}
        {hasWaitEstimate && (
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="font-bold">{t("visaChecker.result.estimatedWait")}</p>
                <p>
                  {t("visaChecker.result.estimateDesc", {
                    category: categoryFull,
                  })}
                </p>
                <ul className="mt-1 space-y-1 text-sm">
                  <li>
                    • {t("visaChecker.result.avgMovement")}{" "}
                    <strong>{waitEstimate.avg_movement} days</strong>
                  </li>
                  <li>
                    • {t("visaChecker.result.estTime")}{" "}
                    <strong>~{waitEstimate.years} years</strong>
                  </li>
                  <li>
                    • {t("visaChecker.result.approxYear")}{" "}
                    <strong>2039-2040</strong>
                  </li>
                </ul>
              </div>
            </div>
            <div className="mt-3 flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <p className="text-sm">
                <strong>{t("visaChecker.result.estimateNote")}</strong>
              </p>
            </div>
          </div>
        )}

        {/* Current Status */}
        {status === "current" && (
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <p className="font-bold text-green-800">
              {t("visaChecker.result.greatNews")}
            </p>
            <p>{t("visaChecker.result.fileNow")}</p>
          </div>
        )}

        {/* Action Items */}
        <div>
          <h3 className="font-bold text-gray-800 mb-2">
            {t("visaChecker.result.whatToDo")}
          </h3>
          <ul className="space-y-1 text-gray-700">
            {(["1", "2", "3", "4"] as const).map((key) => (
              <li key={key}>{t(`visaChecker.result.actions.${key}`)}</li>
            ))}
          </ul>
        </div>

        {/* Email Updates */}
        <div className="bg-indigo-50 p-4 rounded-lg">
          <p className="font-bold text-indigo-800">
            {t("visaChecker.result.wantUpdates")}
          </p>
          <p className="text-sm">{t("visaChecker.result.updateDesc")}</p>
          <input
            type="email"
            placeholder={t("visaChecker.result.emailPlaceholder")}
            className="mt-2 w-full p-2 border rounded"
          />
          <button className="mt-2 w-full bg-indigo-600 text-white py-2 rounded font-bold">
            {t("visaChecker.result.subscribe")}
          </button>
        </div>
      </div>
    </div>
  );
}