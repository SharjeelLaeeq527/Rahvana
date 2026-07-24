// ============================================================================
// IR-1 Questionnaire Configuration
// Questions, base documents, and decision rules for IR-1/CR-1 spouse visa
// ============================================================================

import type { QuestionnaireConfig } from "./types";

export const IR1_QUESTIONNAIRE_CONFIG: QuestionnaireConfig = {
  id: "ir1-doc-questionnaire",
  title: "IR-1 / CR-1",
  subtitle:
    "Answer a few quick questions so we can build a document list tailored to your specific situation. This only takes a minute.",

  // ──────────────────────────────────────────────────────────────────
  // QUESTIONS (shown one at a time, conditionally)
  // ──────────────────────────────────────────────────────────────────
  questions: [
    // Q1 — Petitioner prior marriage
    // ⚡ DERIVED FROM STEP 1 (q3 → q3s1) — not shown to user if already answered.
    {
      id: "prior_marriage_petitioner",
      question:
        "Was the petitioner (U.S. citizen spouse) previously married before the current marriage?",
      helper:
        "If the petitioner was married before, proof of how that marriage ended is legally required by USCIS.",
      options: [
        {
          label: "Yes — the petitioner was previously married",
          value: "yes",
        },
        {
          label: "No — this is the petitioner's first marriage",
          value: "no",
        },
      ],
    },

    // Q2 — How petitioner's prior marriage ended (conditional on Q1=yes)
    {
      id: "petitioner_marriage_end",
      question: "How did the petitioner's previous marriage end?",
      helper:
        "This determines which termination document to include — a divorce decree or a death certificate.",
      visibleWhen: [{ questionId: "prior_marriage_petitioner", requiredValue: "yes" }],
      options: [
        {
          label: "Divorce — a final divorce decree was issued",
          value: "divorce",
        },
        {
          label: "Death — the former spouse passed away",
          value: "death",
        },
      ],
    },

    // Q3 — Beneficiary prior marriage
    // ⚡ DERIVED FROM STEP 1 (q3 → q3s1) — not shown to user if already answered.
    {
      id: "prior_marriage_beneficiary",
      question:
        "Was the beneficiary (Pakistani spouse) previously married before the current marriage?",
      helper:
        "If the beneficiary had a prior marriage, proof of termination is required for visa processing.",
      options: [
        {
          label: "Yes — the beneficiary was previously married",
          value: "yes",
        },
        {
          label: "No — this is the beneficiary's first marriage",
          value: "no",
        },
      ],
    },

    // Q4 — How beneficiary's prior marriage ended (conditional on Q3=yes)
    {
      id: "beneficiary_marriage_end",
      question: "How did the beneficiary's previous marriage end?",
      helper:
        "We'll add the correct termination document based on your answer — divorce decree or death certificate.",
      visibleWhen: [{ questionId: "prior_marriage_beneficiary", requiredValue: "yes" }],
      options: [
        {
          label: "Divorce — a final divorce decree was issued",
          value: "divorce",
        },
        {
          label: "Death — the former spouse passed away",
          value: "death",
        },
      ],
    },

    // Q5 — Children
    {
      id: "has_children",
      question: "Does the beneficiary have any children who are under 21 and unmarried?",
      helper:
        "Children's documents may be needed for the petition, even if they are not immigrating with the beneficiary right now.",
      options: [
        {
          label: "Yes — the beneficiary has children under 21",
          value: "yes",
        },
        {
          label: "No — no children, or all children are 21 or older",
          value: "no",
        },
      ],
    },

    // Q6 — Name change
    {
      id: "name_change",
      question: "Has either spouse ever legally changed their name (for any reason)?",
      helper:
        "If any legal name has changed — through marriage, court order, or other means — official documentation is required.",
      options: [
        {
          label: "Yes — at least one spouse has had a legal name change",
          value: "yes",
        },
        {
          label: "No — neither spouse has changed their legal name",
          value: "no",
        },
      ],
    },

    // Q7 — Joint sponsor
    // {
    //   id: "joint_sponsor",
    //   question:
    //     "Will a joint sponsor be used for the Affidavit of Support (Form I-864)?",
    //   helper:
    //     "A joint sponsor is needed if the petitioner's income doesn't meet the minimum threshold. Joint sponsor documents will be added to your checklist.",
    //   options: [
    //     {
    //       label: "Yes — a joint sponsor will be used",
    //       value: "yes",
    //     },
    //     {
    //       label: "No — the petitioner meets the income requirement alone",
    //       value: "no",
    //     },
    //     {
    //       label: "Not sure yet — still figuring this out",
    //       value: "unsure",
    //       helper:
    //         "We'll add joint sponsor documents as optional so you can prepare just in case.",
    //     },
    //   ],
    // },

    // Q8 — Military service
    {
      id: "military_service",
      question: "Has the beneficiary ever served in any country's military or armed forces?",
      helper:
        "If yes, military service records with a certified English translation are required for the visa application.",
      options: [
        {
          label: "Yes — the beneficiary has military service history",
          value: "yes",
        },
        {
          label: "No — no military service",
          value: "no",
        },
      ],
    },

    // Q9 — Criminal history
    // ⚡ DERIVED FROM STEP 1 (q5 → q5s2) — not shown to user if already answered.
    {
      id: "criminal_history",
      question:
        "Has the beneficiary ever been arrested, charged, or convicted of any crime — anywhere in the world?",
      helper:
        "Even minor or old matters can affect eligibility. Court/disposition records will be needed if applicable.",
      options: [
        {
          label: "Yes — there is at least one arrest, charge, or conviction",
          value: "yes",
        },
        {
          label: "No — no criminal history at all",
          value: "no",
        },
      ],
    },
  ],

  // ──────────────────────────────────────────────────────────────────
  // BASE DOCUMENTS (always required for IR-1)
  // ──────────────────────────────────────────────────────────────────
  baseDocuments: [
    {
      id: "doc_citizenship",
      name: "Proof of U.S. Citizenship",
      subtitle: "Establishes the petitioner's right to file for an IR-1 spouse",
      tag: "petitioner",
      guideUrl: "/guides",
      icon: "ShieldCheck",
      group: "Required Now",
      required: true,
    },
    {
      id: "doc_passport_ben",
      name: "Beneficiary Passport",
      subtitle: "Pakistan passport of the immigrant spouse",
      tag: "beneficiary",
      guideUrl: "/guides/passport-guide",
      icon: "User",
      group: "Required Now",
      required: true,
    },
    {
      id: "doc_nikah_nama",
      name: "Nikah Nama (Original)",
      subtitle: "Islamic marriage contract — the foundational marriage document",
      tag: "beneficiary",
      guideUrl: "/guides/nikah-nama-guide",
      icon: "FileText",
      group: "Required Now",
      required: true,
    },
    {
      id: "doc_mrc",
      name: "NADRA Marriage Certificate",
      subtitle: "Government civil registration of the marriage (MRC)",
      tag: "beneficiary",
      guideUrl: "/guides/nikah-nama-guide",
      icon: "FileCheck",
      group: "Required Now",
      required: true,
    },
    {
      id: "doc_relationship",
      name: "Relationship Evidence",
      subtitle: "Proof the marriage is genuine and entered in good faith",
      tag: "both",
      guideUrl: "/guides",
      icon: "MessageSquare",
      group: "Required Now",
      required: true,
    },
    {
      id: "doc_translations",
      name: "Translations",
      subtitle: "Certified English translations of non-English documents",
      tag: "both",
      guideUrl: "/guides",
      icon: "Globe",
      group: "Required if Applicable",
      required: false,
    },
    {
      id: "doc_birth_cert",
      name: "Birth Certificate",
      subtitle: "Beneficiary's Pakistan birth record — needed at consular stage",
      tag: "beneficiary",
      guideUrl: "/guides/birth-certificate-guide",
      icon: "ClipboardList",
      group: "Gather Now for Later",
      required: false,
    },
    {
      id: "doc_police_cert",
      name: "Police Character Certificate",
      subtitle: "Pakistan PCC — required at consular stage",
      tag: "beneficiary",
      guideUrl: "/guides/police-verification-guide",
      icon: "Lock",
      group: "Gather Now for Later",
      required: false,
    },
    {
      id: "doc_passport_photos",
      name: "Passport Photos",
      subtitle: "Required at consular and visa application stages",
      tag: "beneficiary",
      guideUrl: "/guides",
      icon: "Camera",
      group: "Gather Now for Later",
      required: false,
    },
  ],

  // ──────────────────────────────────────────────────────────────────
  // DECISION RULES (questionnaire answers → documents)
  // ──────────────────────────────────────────────────────────────────
  decisionRules: [
    // ── Petitioner prior marriage: divorce ──
    {
      questionId: "petitioner_marriage_end",
      triggerValue: "divorce",
      documents: [
        {
          id: "doc_petitioner_divorce",
          name: "Petitioner's Divorce Decree",
          subtitle: "Final divorce decree from the petitioner's prior marriage",
          tag: "petitioner",
          guideUrl: "/guides",
          icon: "Scale",
          group: "Required if Applicable",
          required: true,
        },
      ],
    },

    // ── Petitioner prior marriage: death ──
    {
      questionId: "petitioner_marriage_end",
      triggerValue: "death",
      documents: [
        {
          id: "doc_petitioner_spouse_death",
          name: "Death Certificate of Petitioner's Former Spouse",
          subtitle: "Official death certificate proving the prior marriage ended by death",
          tag: "petitioner",
          guideUrl: "/guides",
          icon: "FileText",
          group: "Required if Applicable",
          required: true,
        },
      ],
    },

    // ── Beneficiary prior marriage: divorce ──
    {
      questionId: "beneficiary_marriage_end",
      triggerValue: "divorce",
      documents: [
        {
          id: "doc_beneficiary_divorce",
          name: "Beneficiary's Divorce Decree",
          subtitle:
            "Final divorce decree or Union Council certificate from the beneficiary's prior marriage",
          tag: "beneficiary",
          guideUrl: "/guides",
          icon: "Scale",
          group: "Required if Applicable",
          required: true,
        },
      ],
    },

    // ── Beneficiary prior marriage: death ──
    {
      questionId: "beneficiary_marriage_end",
      triggerValue: "death",
      documents: [
        {
          id: "doc_beneficiary_spouse_death",
          name: "Death Certificate of Beneficiary's Former Spouse",
          subtitle: "Official death certificate proving the prior marriage ended by death",
          tag: "beneficiary",
          guideUrl: "/guides",
          icon: "FileText",
          group: "Required if Applicable",
          required: true,
        },
      ],
    },

    // ── Children under 21 ──
    {
      questionId: "has_children",
      triggerValue: "yes",
      documents: [
        {
          id: "doc_children_birth_certs",
          name: "Children's Birth Certificates",
          subtitle: "Birth certificates for all children under 21 (with English translations)",
          tag: "beneficiary",
          guideUrl: "/guides",
          icon: "ClipboardList",
          group: "Required if Applicable",
          required: true,
        },
        {
          id: "doc_children_passports",
          name: "Children's Passport Copies",
          subtitle: "Passport biographic pages for all children under 21",
          tag: "beneficiary",
          guideUrl: "/guides",
          icon: "User",
          group: "Required if Applicable",
          required: true,
        },
      ],
    },

    // ── Name change ──
    {
      questionId: "name_change",
      triggerValue: "yes",
      documents: [
        {
          id: "doc_name_change",
          name: "Name Change Documentation",
          subtitle: "Court order, deed poll, or marriage certificate proving any legal name change",
          tag: "both",
          guideUrl: "/guides",
          icon: "FileText",
          group: "Required if Applicable",
          required: true,
        },
      ],
    },

    // ── Joint sponsor: Yes ──
    {
      questionId: "joint_sponsor",
      triggerValue: "yes",
      documents: [
        {
          id: "doc_joint_i864",
          name: "Joint Sponsor's Form I-864",
          subtitle: "Completed Affidavit of Support from the joint sponsor",
          tag: "joint_sponsor",
          guideUrl: "/guides",
          icon: "FileCheck",
          group: "Required if Applicable",
          required: true,
        },
        {
          id: "doc_joint_tax_returns",
          name: "Joint Sponsor's Tax Returns (3 years)",
          subtitle: "Federal tax transcripts or returns from the joint sponsor",
          tag: "joint_sponsor",
          guideUrl: "/guides",
          icon: "FileText",
          group: "Required if Applicable",
          required: true,
        },
        {
          id: "doc_joint_employment",
          name: "Joint Sponsor's Employment Letter",
          subtitle: "Current employment verification from the joint sponsor's employer",
          tag: "joint_sponsor",
          guideUrl: "/guides",
          icon: "FileText",
          group: "Required if Applicable",
          required: true,
        },
        {
          id: "doc_joint_pay_stubs",
          name: "Joint Sponsor's Pay Stubs",
          subtitle: "Most recent 6 pay stubs from the joint sponsor",
          tag: "joint_sponsor",
          guideUrl: "/guides",
          icon: "FileText",
          group: "Required if Applicable",
          required: true,
        },
      ],
    },

    // ── Joint sponsor: Not sure yet → add same docs as optional ──
    {
      questionId: "joint_sponsor",
      triggerValue: "unsure",
      asOptional: true,
      documents: [
        {
          id: "doc_joint_i864",
          name: "Joint Sponsor's Form I-864",
          subtitle: "Completed Affidavit of Support from the joint sponsor",
          tag: "joint_sponsor",
          guideUrl: "/guides",
          icon: "FileCheck",
          group: "Required if Applicable",
          required: false,
        },
        {
          id: "doc_joint_tax_returns",
          name: "Joint Sponsor's Tax Returns (3 years)",
          subtitle: "Federal tax transcripts or returns from the joint sponsor",
          tag: "joint_sponsor",
          guideUrl: "/guides",
          icon: "FileText",
          group: "Required if Applicable",
          required: false,
        },
        {
          id: "doc_joint_employment",
          name: "Joint Sponsor's Employment Letter",
          subtitle: "Current employment verification from the joint sponsor's employer",
          tag: "joint_sponsor",
          guideUrl: "/guides",
          icon: "FileText",
          group: "Required if Applicable",
          required: false,
        },
        {
          id: "doc_joint_pay_stubs",
          name: "Joint Sponsor's Pay Stubs",
          subtitle: "Most recent 6 pay stubs from the joint sponsor",
          tag: "joint_sponsor",
          guideUrl: "/guides",
          icon: "FileText",
          group: "Required if Applicable",
          required: false,
        },
      ],
    },

    // ── Military service ──
    {
      questionId: "military_service",
      triggerValue: "yes",
      documents: [
        {
          id: "doc_military_records",
          name: "Military Service Records",
          subtitle: "Complete military service records with certified English translation",
          tag: "beneficiary",
          guideUrl: "/guides",
          icon: "ShieldCheck",
          group: "Required if Applicable",
          required: true,
        },
      ],
    },

    // ── Criminal history ──
    {
      questionId: "criminal_history",
      triggerValue: "yes",
      documents: [
        {
          id: "doc_court_records",
          name: "Court / Disposition Records",
          subtitle:
            "Complete records of all arrests, charges, or convictions with English translations",
          tag: "beneficiary",
          guideUrl: "/guides",
          icon: "Scale",
          group: "Required if Applicable",
          required: true,
        },
        {
          id: "doc_police_disposition",
          name: "Police Disposition Letters",
          subtitle: "Official letters from police showing final disposition of each incident",
          tag: "beneficiary",
          guideUrl: "/guides",
          icon: "Lock",
          group: "Required if Applicable",
          required: true,
        },
      ],
    },
  ],

  // ──────────────────────────────────────────────────────────────────
  // ELIGIBILITY DERIVATION MAP
  // Translates Step 1 eligibility-suite answers into pre-filled answers
  // for this questionnaire so duplicate questions are never shown.
  // ──────────────────────────────────────────────────────────────────
  eligibilityDerivationMap: [
    {
      // q3 → q3s1: prior marriage history
      // Values: "none" | "petitioner" | "beneficiary" | "both" | "unsure"
      eligibilityQuestId: "q3",
      eligibilityScreenId: "q3s1",
      derive: (v) => ({
        prior_marriage_petitioner:
          v === "petitioner" || v === "both" ? "yes" : "no",
        prior_marriage_beneficiary:
          v === "beneficiary" || v === "both" ? "yes" : "no",
      }),
    },
    {
      // q5 → q5s2: criminal history
      // Values: "no" | "yes" | "unsure"
      eligibilityQuestId: "q5",
      eligibilityScreenId: "q5s2",
      derive: (v) => ({
        criminal_history: v === "yes" ? "yes" : "no",
      }),
    },
  ],
};
