export type APReasonCategory =
  | "document_request"
  | "security_check"
  | "social_media"
  | "name_check"
  | "unspecified";

export interface APResolutionGuidance {
  description: string;
}

export const AP_ESCALATION_THRESHOLDS = {
  normalWeeks: 4,
  typicalMaxWeeks: 16,
  extendedMaxWeeks: 36,
  mandamusConsiderationWeeks: 52,
};

const AP_REASON_GUIDANCE: Record<APReasonCategory, APResolutionGuidance> = {
  document_request: {
    description:
      "The embassy requested additional documents. This is typically the fastest type of AP to resolve once you submit everything requested.",
  },
  security_check: {
    description:
      "The case is under a security review. These checks often take longer than a document request, but they are still a standard part of the process.",
  },
  social_media: {
    description:
      "A social media review is in progress. These reviews can add time, but they are generally routine and do not reflect a case denial.",
  },
  name_check: {
    description:
      "A name check is ongoing. This can take several weeks or months depending on the records search, and it is a common reason for extended AP.",
  },
  unspecified: {
    description:
      "Your case is in Administrative Processing. Continue monitoring CEAC and respond quickly to any requests from the embassy.",
  },
};

export function getAPResolutionGuidance(reason: APReasonCategory): APResolutionGuidance {
  return AP_REASON_GUIDANCE[reason] ?? AP_REASON_GUIDANCE.unspecified;
}
