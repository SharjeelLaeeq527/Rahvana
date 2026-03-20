"use client";

import React from "react";
import { RoadmapData } from "./types";
import { renderTextWithLinks } from "../util/renderTextWithLinks";

interface Props {
  roadmapData: RoadmapData;
  language: string;
}

export default function VisaInfoTooltip({ roadmapData, language }: Props) {
  const disclaimerText =
    language === "ur" && roadmapData.disclaimerUr
      ? roadmapData.disclaimerUr
      : roadmapData.disclaimer || "";

  const infoText = roadmapData.info || "";

  return (
    <div className="space-y-3 text-xs leading-relaxed">

      {/* Disclaimer */}
      {disclaimerText && (
        <div>
          <span className="font-semibold text-amber-400">
            Disclaimer:
          </span>{" "}
          {renderTextWithLinks(
            disclaimerText,
            roadmapData.disclaimerLinks || [],
            "font-semibold underline underline-offset-2 text-amber-300"
          )}
        </div>
      )}

      {/* Visa Overview */}
      {roadmapData.visaOverview && (
        <div>
          <span className="font-semibold text-sky-400">
            {language === "ur" && roadmapData.visaOverview.titleUr
              ? roadmapData.visaOverview.titleUr
              : roadmapData.visaOverview.title}
            :
          </span>{" "}
          {language === "ur" && roadmapData.visaOverview.textUr
            ? roadmapData.visaOverview.textUr
            : roadmapData.visaOverview.text}

          {roadmapData.visaOverview.link && (
            <a
              href={roadmapData.visaOverview.link}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-1 underline text-sky-400"
            >
              {roadmapData.visaOverview.linkText || "Source"}
            </a>
          )}
        </div>
      )}

      {/* Info */}
      {infoText && (
        <div>
          <span className="font-semibold text-teal-400">
            Info:
          </span>{" "}
          {renderTextWithLinks(
            infoText,
            roadmapData.infoLinks || [],
            "font-semibold underline underline-offset-2 text-teal-300"
          )}
        </div>
      )}
    </div>
  );
}