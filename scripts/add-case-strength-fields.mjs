// One-off migration: add Chapter 1 case-strength data fields to ir-1.json
// Additive only — no existing field is modified.
import fs from "node:fs";

const path = "./data/visa-category/ir-1.json";
const data = JSON.parse(fs.readFileSync(path, "utf8"));
const ch1 = data.chapters[0];
const findStep = (key) => ch1.steps.find((s) => s.step_key === key);

// === STEP 1.1: risk_signals (advisory patterns grounded in USCIS Policy Manual / 8 CFR / INA) ===
const s1 = findStep("step_1_1");
s1.risk_signals = {
  disclaimer:
    "Advisory patterns based on USCIS Policy Manual guidance and practitioner-reported RFE trends. Not an official USCIS evaluation rubric.",
  patterns: [
    {
      id: "short_marriage_duration",
      title: "Marriage under 6 months at filing time",
      trigger_field: "marriage_date",
      condition: "duration_months < 6",
      severity: "warning",
      advisory:
        "USCIS may apply additional scrutiny to short-duration marriages. Strengthen the filing with multiple Tier 1 bona fide evidence items (joint financial accounts, joint tax filings, joint property/lease) and consider including a relationship timeline cover letter.",
      source_basis: "USCIS Policy Manual Vol. 12, Part G, Ch. 2 — bona fide marriage adjudication",
    },
    {
      id: "never_met_in_person",
      title: "Spouses never met in person before marriage",
      trigger_field: "eligibility_quest_answer",
      severity: "warning",
      advisory:
        "Document the communication history thoroughly (call logs, messaging records, video calls) and add a relationship timeline to the petition. Cases involving no in-person meeting commonly face RFEs.",
      source_basis: "AILA practice advisories; commonly reported RFE pattern",
    },
    {
      id: "prior_i130_for_different_spouse",
      title: "Petitioner previously filed I-130 for a different spouse",
      trigger_field: "eligibility_quest_answer",
      severity: "critical",
      advisory:
        "Under INA Section 204(c), if any prior marriage was found to be entered into for the purpose of evading immigration laws, all future I-130 petitions by the same petitioner are barred. Consult an immigration attorney before filing.",
      source_basis: "INA Section 204(c) — 8 USC Section 1154(c)",
    },
    {
      id: "missing_prior_marriage_termination",
      title: "Prior marriage termination evidence missing",
      trigger_field: "prior_marriage_status_and_documents",
      severity: "critical",
      advisory:
        "If either party had a prior marriage, proof of legal termination is required (divorce decree, annulment order, or death certificate). Without this, USCIS will issue an RFE.",
      source_basis: "8 CFR Section 204.2(a)(2) — I-130 documentation requirements",
    },
  ],
};

// === STEP 1.2: evidence tier classification ===
const s2 = findStep("step_1_2");
s2.evidence_tier_map = {
  disclaimer:
    "Tiers reflect practitioner-observed USCIS adjudication emphasis on financial co-mingling as the strongest bona fide evidence. Not an official USCIS scoring system.",
  source_basis:
    "USCIS Policy Manual Vol. 12, Part G, Ch. 2 — joint financial assets and liabilities emphasized as primary bona fide evidence",
  guidance:
    "A bona fide marriage petition typically benefits from 2 or more Tier 1 items. Marriage certificate plus photos alone is the most common cause of I-130 RFEs.",
  tiers: {
    tier_1_strong: {
      label: "Tier 1 — Strong (financial interdependence)",
      document_keys: [
        "joint_tax_return",
        "joint_bank_statement",
        "joint_property_deed",
        "joint_mortgage",
        "joint_lease",
        "life_insurance_spouse_beneficiary",
      ],
    },
    tier_2_moderate: {
      label: "Tier 2 — Moderate (relationship documentation)",
      document_keys: [
        "photographs_relationship",
        "third_party_affidavits",
        "joint_travel_records",
        "communication_logs",
      ],
    },
    tier_3_supporting: {
      label: "Tier 3 — Supporting (supplementary)",
      document_keys: [
        "shared_utility_bills",
        "shared_subscriptions",
        "social_media_evidence",
        "child_birth_certificates",
      ],
    },
  },
};

// === STEP 1.3: processing_time_context for filing comparison ===
const s3 = findStep("step_1_3");
if (s3.filing_data) {
  s3.filing_data.processing_time_context = {
    disclaimer:
      "Receipt notice timing only. Overall I-130 adjudication time varies significantly by service center. Always check current USCIS processing times at uscis.gov/processing-times.",
    online: {
      receipt_notice_timing:
        "Digital receipt typically same-day; mailed I-797C usually arrives within 2-3 weeks",
      operational_notes: [
        "Immediate digital confirmation of submission",
        "Real-time form validation in USCIS portal",
        "RFE responses can be filed through the same portal",
        "No mail transit risk",
      ],
    },
    paper: {
      receipt_notice_timing:
        "Add ~5-7 days mail transit each way; I-797C typically received 3-4 weeks after USCIS receives the packet",
      operational_notes: [
        "No USCIS online account required",
        "Physical packet can be reviewed before sealing",
        "Trackable shipping recommended for delivery proof",
      ],
    },
    source_basis:
      "USCIS processing times — uscis.gov/processing-times. Operational notes from USCIS published guidance.",
  };
}

// === STEP 1.8: file quality requirements (USCIS portal limits) ===
const s8 = findStep("step_1_8");
if (s8.tool_data) {
  s8.tool_data.quality_requirements = {
    max_file_size_mb: 12,
    accepted_formats: ["PDF", "JPG", "JPEG", "TIF", "TIFF"],
    guidance: [
      "Each individual file must be 12 MB or smaller (USCIS portal limit)",
      "Scans must be clear and legible — USCIS commonly issues RFEs for unreadable documents",
      "All non-English documents require a certified English translation uploaded alongside",
      "Combine multi-page documents into a single PDF per category where appropriate",
    ],
    source_basis: "USCIS online filing portal — file requirements published at myaccount.uscis.gov",
  };
}

// === STEP 1.13: explicit packet section checklist (mailing path) ===
const s13 = findStep("step_1_13");
if (s13.action_data) {
  s13.action_data.packet_section_checklist = {
    title: "Packet section completeness checklist",
    instruction:
      "Confirm each section is present and in correct order before marking this step done.",
    sections: [
      {
        id: "payment",
        label: "Payment form (G-1450 card or G-1650 ACH)",
        position: "front of packet",
        required: true,
      },
      {
        id: "forms",
        label: "Completed I-130 and I-130A — signed and dated",
        position: "after payment",
        required: true,
      },
      {
        id: "citizenship_proof",
        label:
          "Proof of U.S. citizenship (passport bio page, naturalization certificate, or birth certificate)",
        position: "supporting section",
        required: true,
      },
      {
        id: "marriage_certificate",
        label: "Marriage certificate (original or certified copy as required)",
        position: "supporting section",
        required: true,
      },
      {
        id: "prior_termination",
        label:
          "Prior marriage termination evidence (divorce decree / annulment / death certificate)",
        position: "supporting section",
        required_when: "either party had a prior marriage",
      },
      {
        id: "bona_fide_evidence",
        label:
          "Bona fide marriage evidence (joint financial documents, photos, third-party affidavits)",
        position: "supporting section",
        required: true,
      },
      {
        id: "translations",
        label: "Certified English translations for any non-English document",
        position: "with the original document",
        required_when: "any supporting document is not in English",
      },
      {
        id: "passport_photos",
        label: "Passport-style photos",
        position: "supporting section",
        required_when: "instructions request photos",
      },
    ],
    source_basis: "USCIS I-130 paper filing instructions — uscis.gov/i-130",
  };
}

// === STEP 1.15: receipt number format validator data ===
const s15 = findStep("step_1_15");
if (s15.tool_data) {
  s15.tool_data.receipt_format = {
    pattern_regex: "^[A-Z]{3}\\d{10}$",
    pattern_description:
      "USCIS receipt numbers are 13 characters: a 3-letter service center code followed by 10 digits.",
    service_center_codes: {
      EAC: "Vermont Service Center",
      WAC: "California Service Center",
      LIN: "Nebraska Service Center",
      SRC: "Texas Service Center",
      MSC: "National Benefits Center (Missouri)",
      NBC: "National Benefits Center",
      IOE: "USCIS ELIS / online filing system",
    },
    example: "MSC2390123456",
    invalid_format_message:
      "This does not match the standard USCIS receipt number format. Double-check the number on your I-797C — it should be 3 letters followed by 10 digits.",
    source_basis: "USCIS publishes receipt notice format — see I-797C examples on uscis.gov",
  };
}

fs.writeFileSync(path, JSON.stringify(data, null, 10));
console.log("Phase 1 complete. JSON additions written to", path);

// Re-read and validate
const verify = JSON.parse(fs.readFileSync(path, "utf8"));
const v_ch1 = verify.chapters[0];
console.log("");
console.log("Step count check:", v_ch1.steps.length === 17 ? "PASS (17)" : "FAIL");
console.log("Added fields verified:");
console.log(
  "  step_1_1.risk_signals:",
  !!v_ch1.steps.find((s) => s.step_key === "step_1_1").risk_signals
);
console.log(
  "  step_1_2.evidence_tier_map:",
  !!v_ch1.steps.find((s) => s.step_key === "step_1_2").evidence_tier_map
);
console.log(
  "  step_1_3.filing_data.processing_time_context:",
  !!v_ch1.steps.find((s) => s.step_key === "step_1_3").filing_data?.processing_time_context
);
console.log(
  "  step_1_8.tool_data.quality_requirements:",
  !!v_ch1.steps.find((s) => s.step_key === "step_1_8").tool_data?.quality_requirements
);
console.log(
  "  step_1_13.action_data.packet_section_checklist:",
  !!v_ch1.steps.find((s) => s.step_key === "step_1_13").action_data?.packet_section_checklist
);
console.log(
  "  step_1_15.tool_data.receipt_format:",
  !!v_ch1.steps.find((s) => s.step_key === "step_1_15").tool_data?.receipt_format
);
