// Types for our scenario classification
export type ScenarioCode =
  | "221G_DOCS_REQUESTED_FINANCIAL"
  | "221G_DOCS_REQUESTED_CIVIL"
  | "221G_DOCS_REQUESTED_SECURITY"
  | "221G_DOCS_REQUESTED_LEGAL"
  | "221G_DOCS_REQUESTED_MEDICAL"
  | "221G_DOCS_REQUESTED_TRANSLATION"
  | "221G_DOCS_REQUESTED_OTHER"
  | "AP_ONLY_NO_DOCS"
  | "DS5535_REQUESTED"
  | "DOCS_SUBMITTED_WAITING_UPDATE"
  | "UNKNOWN"

export type ConfidenceLevel = "high" | "medium" | "low"

export interface ClassificationResult {
  scenarioCode: ScenarioCode
  confidence: ConfidenceLevel
  description: string
  nextSteps: string[]
}

import type { FormData } from "../types/221g"

/**
 * Classifies the user's 221(g) situation based on the intake form data.
 * The primary signal comes from the CEAC status and the checklist items
 * the user selected in the Actual221GFormChecker.
 *
 * @param formData  - Case basics (visa type, ceac status, etc.)
 * @param parsedItems - Keys from FormSelections that are truthy; used to
 *                      determine which document category was requested.
 */
export function classifySituation(formData: FormData, parsedItems: string[] = []): ClassificationResult {
  const ceac = formData.ceacStatus?.toLowerCase() ?? "";

  // Documents submitted / awaiting update
  if (ceac.includes("submitted") || ceac.includes("received")) {
    return {
      scenarioCode: "DOCS_SUBMITTED_WAITING_UPDATE",
      confidence: "high",
      description: "Documents Submitted – Waiting for Update",
      nextSteps: [
        "Wait for CEAC status update",
        "Monitor status regularly but avoid excessive checking",
        "Prepare for next steps based on outcome",
        "Keep submission proof for reference",
      ],
    };
  }

  // Administrative processing only (no docs)
  if (
    parsedItems.length === 0 ||
    (parsedItems.length === 1 && parsedItems[0] === "admin_processing")
  ) {
    if (ceac.includes("administrative") || parsedItems.includes("admin_processing")) {
      return {
        scenarioCode: "AP_ONLY_NO_DOCS",
        confidence: "high",
        description: "Administrative Processing Only – No Additional Documents Requested",
        nextSteps: [
          "Wait for processing to complete",
          "Monitor CEAC status regularly",
          "Avoid unnecessary inquiries during processing",
          "Prepare for potential extended wait times",
        ],
      };
    }
  }

  // Financial documents
  if (
    parsedItems.some(r =>
      r.includes("i864") || r.includes("tax") || r.includes("w2") ||
      r.includes("irs") || r.includes("proof_citizenship") || r.includes("domicile")
    )
  ) {
    return {
      scenarioCode: "221G_DOCS_REQUESTED_FINANCIAL",
      confidence: "high",
      description: "221(g) – Financial Documents Requested",
      nextSteps: [
        "Gather requested financial documents (I-864, tax transcripts, employment letters)",
        "Ensure all documents are properly translated if needed",
        "Submit complete packet via courier or online as instructed",
        "Keep copies of all submitted documents",
      ],
    };
  }

  // Civil documents (NADRA, birth, marriage, nikah, divorce, police)
  if (
    parsedItems.some(r =>
      r.includes("nadra") || r.includes("birth") || r.includes("marriage") ||
      r.includes("nikah") || r.includes("divorce") || r.includes("police") ||
      r.includes("death")
    )
  ) {
    return {
      scenarioCode: "221G_DOCS_REQUESTED_CIVIL",
      confidence: "high",
      description: "221(g) – Civil Documents Requested",
      nextSteps: [
        "Gather requested civil documents (birth certificates, marriage certificates, police certificates)",
        "Ensure all documents are properly translated if needed",
        "Submit complete packet via courier as instructed",
        "Keep copies of all submitted documents",
      ],
    };
  }

  // Medical
  if (parsedItems.includes("medical_examination")) {
    return {
      scenarioCode: "221G_DOCS_REQUESTED_MEDICAL",
      confidence: "high",
      description: "221(g) – Medical Examination Required",
      nextSteps: [
        "Contact the designated panel physician to complete the medical examination",
        "Follow their instructions for any corrections or re-examinations",
        "Resubmit corrected medical documents as instructed",
        "Keep copies of all submitted documents",
      ],
    };
  }

  // Translation
  if (parsedItems.includes("english_translation")) {
    return {
      scenarioCode: "221G_DOCS_REQUESTED_TRANSLATION",
      confidence: "high",
      description: "221(g) – Document Translations Required",
      nextSteps: [
        "Obtain certified English translations for the requested documents",
        "Ensure translations are by qualified translators",
        "Submit translated documents along with originals",
        "Keep copies of all submitted documents",
      ],
    };
  }

  // DNA test
  if (parsedItems.includes("dna_test")) {
    return {
      scenarioCode: "221G_DOCS_REQUESTED_OTHER",
      confidence: "high",
      description: "221(g) – DNA Test Recommended",
      nextSteps: [
        "Contact the embassy for a list of approved DNA testing facilities",
        "Schedule and complete the DNA test as instructed",
        "Submit results directly to the embassy per their instructions",
        "Keep copies of all submitted documents",
      ],
    };
  }

  // Passport
  if (parsedItems.includes("passport")) {
    return {
      scenarioCode: "221G_DOCS_REQUESTED_OTHER",
      confidence: "high",
      description: "221(g) – Passport Required",
      nextSteps: [
        "Submit your passport via courier to the address on your 221(g) letter",
        "Keep the tracking number for your submission",
        "Monitor CEAC status for updates",
        "Keep copies of all submitted documents",
      ],
    };
  }

  // Other / generic
  if (parsedItems.includes("other") || parsedItems.length > 0) {
    return {
      scenarioCode: "221G_DOCS_REQUESTED_OTHER",
      confidence: "medium",
      description: "221(g) – Documents Requested",
      nextSteps: [
        "Carefully review your 221(g) letter for exact requirements",
        "Gather all requested documents",
        "Submit complete packet as soon as possible",
        "Keep copies of all submitted documents",
      ],
    };
  }

  // Unknown
  return {
    scenarioCode: "UNKNOWN",
    confidence: "low",
    description: "Unable to Determine Specific Situation",
    nextSteps: [
      "Double-check your 221(g) letter for specific requirements",
      "Contact the embassy if requirements are unclear",
      "Consult with an immigration attorney if needed",
      "Continue monitoring CEAC status",
    ],
  };
}