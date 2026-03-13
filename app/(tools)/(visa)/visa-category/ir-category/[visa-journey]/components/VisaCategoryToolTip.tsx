"use client";

import React from "react";
import { InfoIcon } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import VisaInfoTooltip from "./VisaInfoToolTip";
import { RoadmapData } from "./types";

interface Props {
  roadmapData: RoadmapData;
  language: string;
}

export default function VisaCategoryTooltip({ roadmapData, language }: Props) {
  if (
    !roadmapData.disclaimer &&
    !roadmapData.disclaimerUr &&
    !roadmapData.visaOverview &&
    !roadmapData.info
  ) {
    return null;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button className="mt-5 text-slate-400 hover:text-slate-600 transition">
            <InfoIcon className="w-5 h-5" />
          </button>
        </TooltipTrigger>

        <TooltipContent
          side="bottom"
          align="start"
          className="max-w-sm text-sm leading-relaxed bg-slate-900 text-white p-4 space-y-3"
        >
          <VisaInfoTooltip roadmapData={roadmapData} language={language} />
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}