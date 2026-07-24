// ============================================================================
// IR-5 Questionnaire Configuration
// Questions, base documents, and decision rules for IR-5 parent immigrant visa
// ============================================================================

import type { QuestionnaireConfig } from "./types";

export const IR5_QUESTIONNAIRE_CONFIG: QuestionnaireConfig = {
  id: "ir5-doc-questionnaire",
  title: "IR-5",
  subtitle:
    "Answer a few quick questions so we can build a document list tailored to your specific parent-child relationship. This only takes a minute.",

  // ──────────────────────────────────────────────────────────────────
  // QUESTIONS (shown one at a time, conditionally)
  // ──────────────────────────────────────────────────────────────────
  questions: [
    // Q1 — Relationship type
    // Primary branching question — drives most conditional documents.
    {
      id: "relationship_type",
      question:
        "What is the petitioner's relationship to the parent being petitioned for?",
      helper:
        "The type of parent-child relationship determines which documents USCIS requires to establish eligibility.",
      options: [
        {
          label: "Biological mother — the petitioner's birth mother",
          value: "biological_mother",
          helper:
            "The birth certificate alone usually establishes this relationship.",
        },
        {
          label:
            "Biological father — parents were legally married to each other",
          value: "father_married",
          helper:
            "The parents' marriage certificate is generally required to establish the father's status.",
        },
        {
          label: "Biological father — parents were never married to each other",
          value: "father_unmarried",
          helper:
            "Additional bona fide father-child relationship evidence may be required when parents were not married.",
        },
        {
          label: "Stepparent — a stepfather or stepmother",
          value: "stepparent",
          helper:
            "The stepparent must have married the petitioner's biological parent before the petitioner turned 18.",
        },
        {
          label: "Adoptive parent",
          value: "adoptive",
          helper:
            "A qualifying adoption requires two years of legal custody and two years of living together.",
        },
      ],
    },

    // Q2 — Biological parent's prior marriages (stepparent case only)
    // Needed to confirm the step-creating marriage is legally valid.
    {
      id: "stepparent_bio_parent_prior_marriages",
      question:
        "Did the petitioner's biological parent (who married the stepparent) have any prior marriages before that marriage?",
      helper:
        "Proof that prior marriages ended — a divorce decree or a death certificate — is required to show the step-creating marriage is legally valid.",
      visibleWhen: [
        { questionId: "relationship_type", requiredValue: "stepparent" },
      ],
      options: [
        {
          label:
            "Yes — the biological parent had at least one prior marriage before marrying the stepparent",
          value: "yes",
        },
        {
          label: "No — this was the biological parent's first marriage",
          value: "no",
        },
      ],
    },

    // Q3 — Name / identity discrepancies across records
    {
      id: "name_discrepancy",
      question:
        "Are there any name differences, spelling variations, or date discrepancies across the petitioner's or parent's records?",
      helper:
        "Even minor differences — a different spelling on a birth certificate vs. a passport, or a slight date-of-birth variation — must be officially explained with supporting documentation.",
      options: [
        {
          label:
            "Yes — there are name, spelling, or date discrepancies across documents",
          value: "yes",
        },
        {
          label: "No — all names, spellings, and dates are consistent",
          value: "no",
        },
      ],
    },

    // Q4 — Primary civil record availability
    // Determines whether secondary evidence / record-unavailability letters are needed.
    {
      id: "primary_record_available",
      question:
        "Is the primary civil record establishing the parent-child relationship (e.g., birth certificate) available and consistent?",
      helper:
        "If the birth certificate is unavailable, late-registered, or contains inconsistencies, secondary relationship evidence and an official record-unavailability letter may be required.",
      options: [
        {
          label:
            "Yes — the primary record is available and all information is consistent",
          value: "yes",
        },
        {
          label:
            "No — the record is unavailable, late-registered, or has inconsistencies",
          value: "no",
        },
      ],
    },

    // Q5 — Parent's marriage history (for NVC / consular stage)
    {
      id: "parent_prior_marriages",
      question:
        "Has the parent (beneficiary) ever been previously married, divorced, or widowed?",
      helper:
        "NVC and the consulate require a complete marriage history for the parent beneficiary. Marriage, divorce, annulment, or former-spouse death records will be needed later in the process.",
      options: [
        {
          label:
            "Yes — the parent has or had prior marriages, divorces, or is widowed",
          value: "yes",
        },
        {
          label: "No — the parent has only ever had one marriage (or none)",
          value: "no",
        },
      ],
    },
    // Q6 — Name change
    {
      id: "name_change",
      question: "Has the petitioner or parent beneficiary ever legally changed their name (for any reason)?",
      helper:
        "If any legal name has changed — through marriage, court order, or other means — official documentation is required.",
      options: [
        {
          label: "Yes — at least one person has had a legal name change",
          value: "yes",
        },
        {
          label: "No — neither has changed their legal name",
          value: "no",
        },
      ],
    },

    // Q7 — Military service
    {
      id: "military_service",
      question: "Has the parent beneficiary ever served in any country's military or armed forces?",
      helper:
        "If yes, military service records with a certified English translation are required for the visa application.",
      options: [
        {
          label: "Yes — the parent has military service history",
          value: "yes",
        },
        {
          label: "No — no military service",
          value: "no",
        },
      ],
    },

    // Q8 — Criminal history
    {
      id: "criminal_history",
      question:
        "Has the parent beneficiary ever been arrested, charged, or convicted of any crime — anywhere in the world?",
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
  // BASE DOCUMENTS (always included for IR-5, regardless of answers)
  // ──────────────────────────────────────────────────────────────────
  baseDocuments: [
    // ── Required Now ─────────────────────────────────────────────────
    {
      id: "doc_citizenship",
      name: "Proof of U.S. Citizenship",
      subtitle:
        "Establishes that the petitioner is eligible to file an IR-5 petition for a parent",
      tag: "petitioner",
      guideUrl: "/guides",
      icon: "ShieldCheck",
      group: "Required Now",
      required: true,
    },
    {
      id: "doc_petitioner_birth_cert",
      name: "Petitioner's Birth Certificate",
      subtitle:
        "Primary record showing the qualifying parent-child relationship",
      tag: "petitioner",
      guideUrl: "/guides/birth-certificate-guide",
      icon: "ClipboardList",
      group: "Required Now",
      required: true,
    },

    // ── Required if Applicable (shown to all — not gated on a question) ──
    {
      id: "doc_parent_identity_match",
      name: "Parent Identity and Name-Match Evidence",
      subtitle:
        "Links the parent named on the petitioner's birth record to the current beneficiary",
      tag: "beneficiary",
      guideUrl: "/guides",
      icon: "UserCheck",
      group: "Required if Applicable",
      required: false,
    },
    {
      id: "doc_translations",
      name: "Certified English Translations",
      subtitle:
        "Complete English translations of every submitted non-English document",
      tag: "both",
      guideUrl: "/document-translation",
      icon: "Globe",
      group: "Required if Applicable",
      required: false,
    },

    // ── Gather Now for Later ──────────────────────────────────────────
    {
      id: "doc_parent_passport",
      name: "Parent Beneficiary Passport",
      subtitle:
        "Current Pakistani passport — primarily required during NVC and consular processing",
      tag: "beneficiary",
      guideUrl: "/guides/passport-guide",
      icon: "BookOpen",
      group: "Gather Now for Later",
      required: false,
    },
    {
      id: "doc_parent_birth_cert",
      name: "Parent Beneficiary Birth Certificate",
      subtitle:
        "Parent's Pakistan civil birth record — required during NVC and interview processing",
      tag: "beneficiary",
      guideUrl: "/guides/birth-certificate-guide",
      icon: "ClipboardList",
      group: "Gather Now for Later",
      required: false,
    },
    {
      id: "doc_police_cert",
      name: "Police Character Certificate",
      subtitle:
        "Pakistan Character Certificate — required later under NVC age and residence rules",
      tag: "beneficiary",
      guideUrl: "/guides/police-verification-guide",
      icon: "Lock",
      group: "Gather Now for Later",
      required: false,
    },
    {
      id: "doc_passport_photos",
      name: "Passport-Style Photos",
      subtitle:
        "Needed later for medical and immigrant visa processing, not for the standard online I-130 evidence packet",
      tag: "beneficiary",
      guideUrl: "/passport",
      icon: "Camera",
      group: "Gather Now for Later",
      required: false,
    },

  ],

  // ──────────────────────────────────────────────────────────────────
  // DECISION RULES (questionnaire answers → conditional documents)
  // ──────────────────────────────────────────────────────────────────
  decisionRules: [
    // ── Biological father (married parents) → parents' marriage certificate ──
    {
      questionId: "relationship_type",
      triggerValue: "father_married",
      documents: [
        {
          id: "doc_parents_marriage",
          name: "Parents' Marriage Certificate",
          subtitle:
            "Required in many petitions for a biological father and useful where parentage depends on the parents' legal marriage",
          tag: "both",
          guideUrl: "/guides/nikah-nama-guide",
          icon: "FileCheck",
          group: "Required if Applicable",
          required: true,
        },
      ],
    },

    // ── Biological father (unmarried parents) → marriage cert (optional) + bona fide evidence ──
    {
      questionId: "relationship_type",
      triggerValue: "father_unmarried",
      documents: [
        {
          id: "doc_parents_marriage",
          name: "Parents' Marriage Certificate",
          subtitle:
            "Include if the parents eventually married — helps support the father's relationship claim",
          tag: "both",
          guideUrl: "/guides/nikah-nama-guide",
          icon: "FileCheck",
          group: "Required if Applicable",
          required: false,
        },
        {
          id: "doc_father_bona_fide_relationship",
          name: "Evidence of a Bona Fide Father-Child Relationship",
          subtitle:
            "May be required where the petitioner's parents were not married — shows the father acknowledged and supported the child",
          tag: "both",
          guideUrl: "/guides",
          icon: "Users",
          group: "Required if Applicable",
          required: true,
        },
      ],
    },

    // ── Stepparent → marriage certificate that created the step-relationship ──
    {
      questionId: "relationship_type",
      triggerValue: "stepparent",
      documents: [
        {
          id: "doc_stepparent_marriage",
          name: "Marriage Certificate Creating the Step-Relationship",
          subtitle:
            "Shows the stepparent married the petitioner's biological or legal parent before the petitioner turned 18",
          tag: "both",
          guideUrl: "/guides/nikah-nama-guide",
          icon: "HeartHandshake",
          group: "Required if Applicable",
          required: true,
        },
      ],
    },

    // ── Stepparent — biological parent had prior marriages → termination proof ──
    {
      questionId: "stepparent_bio_parent_prior_marriages",
      triggerValue: "yes",
      documents: [
        {
          id: "doc_stepparent_prior_marriages",
          name: "Termination of Prior Marriages for Step-Relationship",
          subtitle:
            "Proves prior marriages ended before the marriage that created the qualifying step-relationship",
          tag: "both",
          guideUrl: "/guides",
          icon: "Scale",
          group: "Required if Applicable",
          required: true,
        },
      ],
    },

    // ── Adoptive parent → final adoption decree + custody/residence evidence ──
    {
      questionId: "relationship_type",
      triggerValue: "adoptive",
      documents: [
        {
          id: "doc_adoption_decree",
          name: "Final Adoption Decree",
          subtitle:
            "Establishes the legal adoption in a qualifying adoptive-parent case",
          tag: "both",
          guideUrl: "/guides",
          icon: "Gavel",
          group: "Required if Applicable",
          required: true,
        },
        {
          id: "doc_adoption_custody_residence",
          name: "Legal Custody and Joint Residence Evidence",
          subtitle:
            "Documents the required two years of legal custody and two years of living together in an adoptive-parent case",
          tag: "both",
          guideUrl: "/guides",
          icon: "Home",
          group: "Required if Applicable",
          required: true,
        },
      ],
    },

    // ── Name / identity discrepancies → name-change / discrepancy evidence ──
    {
      questionId: "name_discrepancy",
      triggerValue: "yes",
      documents: [
        {
          id: "doc_name_change",
          name: "Name Change or Identity Discrepancy Evidence",
          subtitle:
            "Explains different names, spellings, dates, or parent details across records",
          tag: "both",
          guideUrl: "/guides",
          icon: "BadgeCheck",
          group: "Required if Applicable",
          required: true,
        },
      ],
    },

    // ── Primary record unavailable or inconsistent → secondary + unavailability evidence ──
    {
      questionId: "primary_record_available",
      triggerValue: "no",
      documents: [
        {
          id: "doc_secondary_relationship",
          name: "Secondary Parent-Child Relationship Evidence",
          subtitle:
            "Used when the primary birth or civil record is unavailable, late-registered, or inconsistent",
          tag: "both",
          guideUrl: "/guides",
          icon: "Files",
          group: "Required if Applicable",
          required: true,
        },
        {
          id: "doc_record_unavailability",
          name: "Record Unavailability Evidence",
          subtitle:
            "Official explanation when a required primary civil record genuinely cannot be obtained",
          tag: "both",
          guideUrl: "/guides",
          icon: "FileWarning",
          group: "Required if Applicable",
          required: true,
        },
      ],
    },

    // ── Parent has prior marriages → marriage history records (gather for later) ──
    {
      questionId: "parent_prior_marriages",
      triggerValue: "yes",
      documents: [
        {
          id: "doc_parent_marriage_history",
          name: "Parent's Marriage and Prior-Marriage Records",
          subtitle:
            "Marriage, divorce, annulment, or former-spouse death records needed later when applicable",
          tag: "beneficiary",
          guideUrl: "/guides",
          icon: "FileText",
          group: "Gather Now for Later",
          required: false,
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
          name: "Name Change or Identity Discrepancy Evidence",
          subtitle:
            "Explains different names, spellings, dates, or parent details across records",
          tag: "both",
          guideUrl: "/guides",
          icon: "BadgeCheck",
          group: "Required if Applicable",
          required: true,
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
          icon: "FileText",
          group: "Required if Applicable",
          required: false,
        },
      ],
    },
  ],

  // ──────────────────────────────────────────────────────────────────
  // ELIGIBILITY DERIVATION MAP
  // Translates Step 1 eligibility-suite answers into pre-filled answers
  // so duplicate questions are never shown to the user.
  // Add entries here if/when the eligibility suite captures IR-5
  // relationship type or other relevant data.
  // ──────────────────────────────────────────────────────────────────
  eligibilityDerivationMap: [],
};
