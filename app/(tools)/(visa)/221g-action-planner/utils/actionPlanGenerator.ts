import type { ClassificationResult } from "./classifier"

export interface ActionPlan {
  title: string
  description: string
  stages: ActionStage[]
  selected221gItems?: string[]
}

export interface ActionStage {
  title: string
  timeframe: string
  actions: string[]
  tips: string[]
  documents?: string[]
}

/**
 * Generates a personalized action plan based on the classified scenario
 */
export function generateActionPlan(classification: ClassificationResult, selected221gItems: string[] = []): ActionPlan {
  const scenario = classification.scenarioCode

  const hasCivilDocs = selected221gItems.some(
    (item) =>
      item === "nadra_birth_cert" ||
      item === "nadra_birth_cert_petitioner" ||
      item === "nadra_birth_cert_beneficiary" ||
      item === "nadra_marriage_cert" ||
      item === "nikah_nama"
  )

  const hasLegalDocs = selected221gItems.some(
    (item) => 
      item === "nadra_divorce_cert" || 
      item === "us_divorce_decree" || 
      item === "death_certificate" || 
      item === "police_certificate"
  )

  const hasTranslation = selected221gItems.includes("english_translation")

  switch (scenario) {
    case "221G_DOCS_REQUESTED_FINANCIAL":
      return {
        title: "Financial Documents Required - Action Plan",
        description:
          "Your case requires additional financial documentation. Follow this plan to prepare and submit the required documents correctly.",
        selected221gItems,
        stages: [
          {
            title: "Do Now (Today)",
            timeframe: "Immediate Actions",
            actions: [
              "Gather your most recent tax transcripts from the IRS (Form 1040 with all schedules)",
              "Collect employment verification letter from your sponsor's employer",
              "Compile recent pay stubs (last 6 months) from sponsor's employment",
              "Verify all financial documents match the information provided in your I-864 Affidavit of Support",
            ],
            tips: [
              "Use the IRS Transcript Delivery System (TDS) for free tax transcripts",
              "Employment verification should include job title, salary, employment dates, and company letterhead",
              "Ensure all documents are dated within the last 30 days if possible",
            ],
            documents: [
              "Federal Tax Transcripts (last 3 years)",
              "Employment Verification Letter",
              "Recent Pay Stubs (last 6 months)",
              "Bank Statements (if showing significant assets)",
              "Asset Documentation (if relying on assets)",
            ],
          },
          {
            title: "Next 3-7 Days",
            timeframe: "Document Preparation",
            actions: [
              "Ensure all documents are properly translated if not in English",
              "Make copies of all documents for your records",
              "Verify that all names and dates match across all documents",
              "Prepare a cover letter explaining what you're submitting",
            ],
            tips: [
              "Use certified translators for document translations",
              "Keep original documents separate from copies",
              "Check that all signatures are present on documents that require them",
            ],
            documents: ["Cover Letter", "Document Checklist", "Certified Translations (if needed)"],
          },
          {
            title: "Submit Documents",
            timeframe: "Within 30 Days",
            actions: [
              "Submit all required financial documents according to embassy instructions",
              "Keep proof of submission (receipts, tracking numbers)",
              "Monitor your CEAC status for updates",
            ],
            tips: [
              "Follow the specific submission method outlined in your 221(g) letter",
              "Use trackable shipping method if sending physical documents",
              "Never send original documents unless specifically requested",
            ],
          },
          {
            title: "If No Update After 30-60 Days",
            timeframe: "Follow-up Actions",
            actions: [
              "Check CEAC status regularly",
              "Send a polite inquiry if no update after 60 days",
              "Consider reaching out to your Congressman if appropriate",
            ],
            tips: [
              "Be patient - financial document reviews can take time",
              "Only inquire if there's been no status update after the expected timeframe",
              "Keep all correspondence organized for reference",
            ],
          },
        ],
      }

    case "221G_DOCS_REQUESTED_CIVIL":
      return {
        title: "Civil Documents Required - Action Plan",
        description:
          "Your case requires additional civil documentation. Follow this plan to prepare and submit the required documents correctly.",
        selected221gItems,
        stages: [
          {
            title: "Do Now (Today)",
            timeframe: "Immediate Actions",
            actions: [
              "Identify which civil documents are required based on your 221(g) form",
              "Contact relevant authorities to obtain certified copies",
              "Start the process for any documents that take longer to obtain (police certificates, etc.)",
            ],
            tips: [
              "Birth certificates from NADRA can be obtained online or in person",
              "If submitting a Nikah Nama, a NADRA Marriage Registration Certificate (MRC) and the bride's CNIC showing her husband's name are ALSO required.",
              "Manual or 'Rupee Paper' records are generally NOT acceptable for US visas.",
            ],
            documents: [
              hasCivilDocs ? "Birth Certificate (NADRA) if requested" : "",
              hasCivilDocs ? "Marriage Certificate (MRC) + Nikah Nama" : "",
              hasCivilDocs ? "CNIC of bride showing husband's name" : "",
            ].filter(Boolean),
          },
          {
            title: "Next 3-7 Days",
            timeframe: "Document Gathering",
            actions: [
              "Obtain certified copies of all required civil documents",
              "Arrange for professional translations if documents are not in English",
              "Ensure all documents are current (police certificates typically valid for 1 year)",
            ],
            tips: [
              "Request extra certified copies in case additional documents are needed",
              "Use certified translators familiar with immigration documents",
              "Verify that all documents have official seals and signatures",
            ],
            documents: [
              hasCivilDocs ? "Certified Birth Certificate" : "",
              hasCivilDocs ? "Computerized Marriage Registration Certificate (MRC)" : "",
              hasCivilDocs ? "Original Nikah Nama (with translation if required)" : "",
              hasTranslation ? "Certified Translations" : "",
              "Official Seals and Signatures",
            ].filter(Boolean),
          },
          {
            title: "Next 7-14 Days",
            timeframe: "Document Preparation",
            actions: [
              "Prepare all documents according to embassy specifications",
              "Create a cover letter explaining the submission",
              "Organize documents in the order specified in your 221(g) letter",
            ],
            tips: [
              "Scan all documents before submission for your records",
              "Follow the exact format requested in your 221(g) letter",
              "Keep copies separate from originals if originals are required",
            ],
          },
          {
            title: "Submit Documents",
            timeframe: "Within 30 Days",
            actions: [
              "Submit all required civil documents according to embassy instructions",
              "Keep proof of submission (receipts, tracking numbers)",
              "Monitor your CEAC status for updates",
            ],
            tips: [
              "Follow the specific submission method outlined in your 221(g) letter",
              "Use trackable shipping method if sending physical documents",
              "Never send original documents unless specifically requested",
            ],
          },
        ],
      }

    case "221G_DOCS_REQUESTED_SECURITY":
      return {
        title: "Security Review - Action Plan",
        description: "Your case is undergoing security review. This typically requires no additional action from you.",
        selected221gItems,
        stages: [
          {
            title: "Do Now (Today)",
            timeframe: "Immediate Actions",
            actions: [
              "Understand that security reviews are standard for many visa applications",
              "Avoid making unnecessary inquiries during the security review process",
              "Continue to monitor your CEAC status periodically",
            ],
            tips: [
              "Security reviews can take anywhere from a few weeks to several months",
              "Making frequent inquiries can actually slow down the process",
              "There is typically no way to expedite a security review",
            ],
          },
          {
            title: "While Waiting",
            timeframe: "Ongoing",
            actions: [
              "Keep your passport and travel documents ready",
              "Stay in contact with your petitioner",
              "Prepare for your visa interview once cleared",
            ],
            tips: [
              "Use this time to prepare for potential questions at your visa interview",
              "Ensure all your documents are organized and accessible",
              "Keep your contact information updated with the embassy",
            ],
          },
          {
            title: "If Extended Review (>6 Months)",
            timeframe: "Extended Timeline",
            actions: [
              "Consider reaching out to your Congressman for case assistance",
              "Consult with an immigration attorney if appropriate",
              "Verify that your case is still actively being processed",
            ],
            tips: [
              "Wait at least 180 days from your interview date before contacting the consulate (per USTravelDocs official guidance).",
              "Congressional inquiries can sometimes help with transparency",
              "An attorney can provide guidance on your options",
            ],
          },
        ],
      }

    case "221G_DOCS_REQUESTED_LEGAL":
      return {
        title: "Legal & Court Records Required - Action Plan",
        description:
          "Your case requires additional legal documentation, such as court records or police certificates. Follow this plan to obtain and submit the required authoritative records.",
        selected221gItems,
        stages: [
          {
            title: "Immediate Actions: Review Requirements",
            timeframe: "Today",
            actions: [
              "Carefully review the precise legal or court documents checked on your 221(g) form.",
              "Identify the correct issuing authority (e.g., local police, specific court, national government agency).",
              "Note that you must provide police and court records for any arrest or conviction, even if the charges were dropped or you were pardoned.",
            ],
            tips: [
              "Only certified copies from the original issuing authority are accepted.",
              "Consult the U.S. Department of State's Reciprocity Schedule for your country to verify the necessary format and issuing authority for the document.",
            ],
          },
          {
            title: "Document Request & Translation",
            timeframe: "Within 3-10 Days",
            actions: [
              "Submit requests for the official records from the relevant authorities.",
              "If the obtained documents are not in English or the official language of the country where your interview took place, have them translated.",
            ],
            tips: [
              "Legal and court records often take significant time to process; apply for them immediately.",
              "Any translations must include a signed certification statement from the translator detailing their competence.",
            ],
          },
          {
            title: "Submission to Embassy",
            timeframe: "Within 30 Days",
            actions: [
              "Submit the complete package of records and translations as instructed (via CEAC upload, courier, or drop-box).",
              "Maintain complete copies of all submitted documents for your personal files.",
            ],
            tips: [
              "Do not submit any original documents unless explicitly requested by the consular officer.",
            ],
          },
        ],
      }

    case "221G_DOCS_REQUESTED_MEDICAL":
      return {
        title: "Medical Examination or Additional Tests - Action Plan",
        description:
          "A medical examination, re-examination, or further specialized testing is required. This often happens if the original medical expired or specific health issues need clarification.",
        selected221gItems,
        stages: [
          {
            title: "Schedule Appointment",
            timeframe: "Today",
            actions: [
              "Locate the U.S. Embassy-approved Panel Physician.",
              "Contact the Panel Physician immediately to schedule a new appointment or follow-up tests (e.g., Sputum tests for TB).",
            ],
            tips: [
              "You cannot use your personal doctor; it MUST be a designated Panel Physician.",
              "Mention to the clinic that you received a 221(g) and bring the letter to your appointment.",
            ],
          },
          {
            title: "Complete the Examination",
            timeframe: "Within 1-2 Weeks",
            actions: [
              "Attend your medical exam with your passport, 221(g) letter, and past medical records.",
              "If specialized TB testing is required, understand that results can take approximately 8 weeks.",
            ],
            tips: [
              "Medical holds can severely delay a visa. Start the process without delay.",
            ],
          },
          {
            title: "Submitting the Results",
            timeframe: "Upon Completion",
            actions: [
              "In many cases, the clinic sends the results directly to the Embassy via the eMedical system.",
              "If you are handed a sealed medical envelope, submit it to the Embassy using the approved courier.",
            ],
            tips: [
              "NEVER open a sealed medical envelope. An open envelope will invalidate the exam.",
            ],
          },
        ],
      }

    case "221G_DOCS_REQUESTED_TRANSLATION":
      return {
        title: "Certified Translations Required - Action Plan",
        description:
          "The consular officer requested certified English translations for documents previously submitted in a foreign language.",
        selected221gItems,
        stages: [
          {
            title: "Identify Documents & Find Translator",
            timeframe: "1-3 Days",
            actions: [
              "Gather all foreign-language documents that lack an English translation.",
              "Locate a competent translation service or individual translator.",
            ],
            tips: [
              "You cannot translate your own documents, nor can members of your family.",
              "A notary is not required unless specified, but the translator must provide a certification statement.",
            ],
          },
          {
            title: "Obtaining Translation",
            timeframe: "3-7 Days",
            actions: [
              "Provide clear copies of your documents to the translator.",
              "Ensure the translated document includes a certification stating: 'I certify that I am competent to translate from [Language] to English and that the above is a correct and true translation to the best of my knowledge', followed by the translator's signature, printed name, and date.",
            ],
            tips: [
              "Double-check that all names, dates, and places match the original document exactly.",
            ],
          },
          {
            title: "Submission",
            timeframe: "Within 14 Days",
            actions: [
              "Submit the translation along with a copy of the original document.",
              "Follow the embassy's submission instructions (upload to CEAC or courier service).",
            ],
            tips: [
              "If uploading to CEAC, include the translation in the same document category as the original file.",
            ],
          },
        ],
      }

    case "DS5535_REQUESTED":
      return {
        title: "Form DS-5535 (Supplemental Questions) - Action Plan",
        description:
          "You have been asked to complete Form DS-5535 for enhanced security vetting. This extensive form requires 15 years of travel, address, and employment history, and 5 years of social media history.",
        selected221gItems,
        stages: [
          {
            title: "Gathering Information",
            timeframe: "1-3 Days",
            actions: [
              "Check your email or online portal for the DS-5535 form and instructions from the embassy.",
              "Collect all old passports, travel itineraries, and employment contracts.",
              "Compile a complete list of your social media handles (Facebook, Twitter/X, Instagram, LinkedIn, YouTube, TikTok), phone numbers, and email addresses used over the last 5 years.",
            ],
            tips: [
              "DO NOT omit any information. Omitting details will significantly delay the process or lead to denial.",
              "If an exact date is forgotten, provide your closest estimate and note it appropriately.",
            ],
          },
          {
            title: "Completing the Form",
            timeframe: "3-7 Days",
            actions: [
              "Fill out the DS-5535 digitally or exactly as instructed by the embassy (often via a Word/PDF form sent by email).",
              "Ensure there are zero gaps in your 15-year travel, address, and employment timelines. If unemployed, list 'Unemployed'.",
              "Provide details of sources of funding for all past travel.",
              "List all current and former spouses/partners, children, and siblings.",
            ],
            tips: [
              "Review the form multiple times for accuracy before submission.",
            ],
          },
          {
            title: "Submission and Waiting Period",
            timeframe: "Post-Submission",
            actions: [
              "Submit the completed form according to the embassy's exact instructions.",
              "Monitor your case status strictly via the CEAC website.",
            ],
            tips: [
              "DS-5535 administrative processing can take anywhere from 60 days to several months or longer.",
              "Do not finalize travel plans, sell property, or resign from employment while waiting.",
            ],
          },
        ],
      }

    case "221G_DOCS_REQUESTED_OTHER":
      return {
        title: "Other / Additional Documents Required",
        description:
          "Your application requires specific documents not categorized under standard financial or civil lists, such as passports, DNA testing, or specific petitioner evidence.",
        selected221gItems,
        stages: [
          {
            title: "Identify Requirements",
            timeframe: "Immediate Actions",
            actions: [
              "Carefully review the 'Other' remarks or checked boxes on your 221(g) refusal letter.",
              "If DNA testing was suggested, refer back to the embassy website for an approved AABB-accredited laboratory procedure.",
              "If your passport was requested, this generally means your visa is ready for issuance.",
            ],
            tips: [
              "The 221(g) letter is the ultimate authority for what you need. Adhere to it strictly.",
              "For DNA tests, NEVER self-administer a test; the embassy must schedule the collection.",
            ],
          },
          {
            title: "Preparation",
            timeframe: "As soon as possible",
            actions: [
              "Gather the specifically requested items.",
              "If submitting foreign documents, obtain certified English translations.",
            ],
            tips: [
              "Under Section 221(g), you generally have one year from the date of refusal to provide the requested information without paying a new fee.",
            ],
          },
          {
            title: "Submission",
            timeframe: "Once gathered",
            actions: [
              "Submit the documents via the specified method (courier drop-off or CEAC upload).",
              "Retain a personal copy of every document submitted.",
            ],
            tips: [
              "If returning your passport, use the embassy-approved designated courier service.",
            ],
          },
        ],
      }

    case "AP_ONLY_NO_DOCS":
      return {
        title: "Administrative Processing - No Additional Documents",
        description:
          "Your case is in administrative processing. This typically requires no additional action from you.",
        selected221gItems,
        stages: [
          {
            title: "Do Now (Today)",
            timeframe: "Immediate Actions",
            actions: [
              "Understand that administrative processing is standard for certain visa applications",
              "Avoid making unnecessary inquiries during the processing period",
              "Continue to monitor your CEAC status periodically",
            ],
            tips: [
              "Administrative processing can take anywhere from a few weeks to several months",
              "Making frequent inquiries can actually slow down the process",
              "There is typically no way to expedite administrative processing",
            ],
          },
          {
            title: "While Waiting",
            timeframe: "Ongoing",
            actions: [
              "Keep your passport and travel documents ready",
              "Stay in contact with your petitioner",
              "Prepare for your visa interview once processed",
            ],
            tips: [
              "Use this time to prepare for potential questions at your visa interview",
              "Ensure all your documents are organized and accessible",
              "Keep your contact information updated with the embassy",
            ],
          },
          {
            title: "If Extended Processing (>6 Months)",
            timeframe: "Extended Timeline",
            actions: [
              "Consider reaching out to your Congressman for case assistance",
              "Consult with an immigration attorney if appropriate",
              "Verify that your case is still actively being processed",
            ],
            tips: [
              "Wait at least 180 days from your interview date before contacting the consulate (per USTravelDocs official guidance).",
              "Congressional inquiries can sometimes help with transparency",
              "An attorney can provide guidance on your options",
              "Keep detailed records of all communications",
            ],
          },
        ],
      }

    case "DOCS_SUBMITTED_WAITING_UPDATE":
      return {
        title: "Documents Submitted - Waiting for Update",
        description: "Your documents have been submitted. Now you're waiting for an update on your case status.",
        selected221gItems,
        stages: [
          {
            title: "Do Now (Today)",
            timeframe: "Immediate Actions",
            actions: [
              "Keep your submission proof and tracking information handy",
              "Begin monitoring CEAC status more frequently (every 2-3 days)",
              "Prepare for next steps based on potential outcomes",
            ],
            tips: [
              "Don't expect immediate updates after submission",
              "Status changes can take several weeks to appear in the system",
              "Keep all documentation organized for reference",
            ],
          },
          {
            title: "Next 2-4 Weeks",
            timeframe: "Monitoring Period",
            actions: [
              "Check CEAC status regularly but avoid excessive checking",
              "Prepare for potential next steps based on outcome",
              "Keep your passport and travel documents accessible",
            ],
            tips: [
              "Some cases resolve quickly after document submission",
              "Others may require additional processing time",
              "Stay patient during this period",
            ],
          },
          {
            title: "If Processing Is Unusually Delayed",
            timeframe: "Follow-up Actions",
            actions: [
              "Send a polite inquiry to the embassy only after a significant timeframe",
              "Consider reaching out to your Congressman if appropriate",
              "Consult with an immigration attorney if needed",
            ],
            tips: [
              "There is no official, guaranteed timeline for document review",
              "Inquiries should be polite and include your case details",
              "Keep all correspondence organized",
            ],
          },
        ],
      }

    default:
      return {
        title: "General Action Plan",
        description: "Based on your situation, here's a general plan to help you navigate the process.",
        selected221gItems,
        stages: [
          {
            title: "Immediate Actions",
            timeframe: "Today",
            actions: [
              "Review your 221(g) letter carefully for specific requirements",
              "Gather any documents that you know are needed",
              "Research the specific requirements for your embassy",
            ],
            tips: [
              "Keep all original documents secure and use copies when possible",
              "Organize your documents in a clear, logical manner",
              "Keep digital copies of all documents",
            ],
          },
          {
            title: "Next Steps",
            timeframe: "This Week",
            actions: [
              "Prepare required documents according to embassy guidelines",
              "Consider consulting with an immigration attorney if requirements are complex",
              "Plan your document submission strategy",
            ],
            tips: [
              "Follow embassy instructions precisely",
              "Use certified translations when required",
              "Keep detailed records of all submissions",
            ],
          },
        ],
      }
  }
}
