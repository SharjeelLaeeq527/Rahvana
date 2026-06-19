import { useMemo } from "react";
import {
  runIR1WebsiteEngine,
  IR1WebsiteOutput,
  CaseDBRowInput,
  mapCaseRowToCaseFields,
} from "@/lib/ir1-engine/ir1Service";
import {
  generateNarrative,
  type NarrativeJourneyContext,
  type StageId,
} from "../narrative/narrativeEngine";

export interface PublicIR1Status {
  headline: string;
  context: string;
  action: string | null;
  estimate: string;
  badge: string;
  confidenceLabel?: string;
  stageId?: string;
  stageLabel?: string;
  monthsElapsed?: number;
}

export interface AdminIR1Status extends PublicIR1Status {
  raw: IR1WebsiteOutput["raw"];
  progressPercent?: number;
}

export function useIR1Status(
  caseRow: CaseDBRowInput | null | undefined,
  delayScenarioMonths: number = 3,
  options: { includeRaw?: boolean; journeyContext?: NarrativeJourneyContext } = {
    includeRaw: false,
  }
): PublicIR1Status | AdminIR1Status | null {
  return useMemo(() => {
    if (!caseRow) return null;

    const websiteOutput = runIR1WebsiteEngine(caseRow, delayScenarioMonths);
    const narrative = generateNarrative(mapCaseRowToCaseFields(caseRow), options.journeyContext);

    const estimateLabel = narrative.estimate ?? websiteOutput.estimate;

    const stageLabelMap: Record<StageId, string> = {
      PRE_FILING: "Pre-filing",
      FILED: "Filed",
      NOA1: "NOA1",
      ACTIVE_REVIEW: "Active review",
      APPROVED: "Approved",
      NVC_RECEIVED: "NVC received",
      FEES_PAID: "Fees paid",
      DS260_SUBMITTED: "DS-260 submitted",
      DOCS_SUBMITTED: "Documents submitted",
      DQ: "Documentarily Qualified",
      INTERVIEW_WAIT: "Interview queue",
      MEDICAL_SCHEDULED: "Medical scheduled",
      MEDICAL_ATTENDED: "Medical attended",
      INTERVIEW_SCHEDULED: "Interview scheduled",
      INTERVIEW_ATTENDED: "Interview attended",
      INTERVIEW_OUTCOME: "Interview outcome",
      VISA_ISSUED: "Visa issued",
    };

    const publicStatus: PublicIR1Status = {
      headline: narrative.headline ?? websiteOutput.headline,
      context: narrative.why ?? websiteOutput.context ?? "",
      action: narrative.action ?? websiteOutput.action,
      estimate: estimateLabel ? `${estimateLabel} (estimate)` : "Estimate unavailable",
      badge: narrative.badge ?? websiteOutput.badge ?? "",
      confidenceLabel: narrative.badge ?? undefined,
      stageId: narrative.stage,
      stageLabel: stageLabelMap[narrative.stage] ?? websiteOutput.raw.currentStage.label,
      monthsElapsed: websiteOutput.raw.estimate?.monthsElapsed ?? undefined,
    };

    if (options.includeRaw) {
      const admin: AdminIR1Status = {
        ...publicStatus,
        raw: websiteOutput.raw,
        progressPercent: websiteOutput.raw.progressPercent,
      };
      return admin;
    }

    return publicStatus;
  }, [caseRow, delayScenarioMonths, options.includeRaw, options.journeyContext]);
}
