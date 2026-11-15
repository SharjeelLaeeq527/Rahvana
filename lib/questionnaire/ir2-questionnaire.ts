// ============================================================================
// IR-2 / CR-2 Questionnaire Configuration
// Questions, base documents, and decision rules for IR-2 & CR-2 child immigrant visas
// ============================================================================

import type {
  QuestionnaireConfig,
  QuestionnaireQuestion,
  ConditionalDocument,
  DocumentDecisionRule,
  EligibilityDerivationMap,
} from "./types";

// ──────────────────────────────────────────────────────────────────
// QUESTIONS (shown one at a time, conditionally)
// ──────────────────────────────────────────────────────────────────
export const IR2_QUESTIONS: QuestionnaireQuestion[] = [
  // Q1 — Relationship type (Primary branching question)
  {
    id: "child_relationship_type",
    question: "What is the qualifying relationship between the petitioner and the child?",
    helper:
      "The legal definition of 'child' under INA § 101(b)(1) differs depending on whether the relationship is biological through the mother, biological through the father, stepchild, or adopted.",
    options: [
      {
        label: "Biological mother (petitioner gave birth to the child)",
        value: "bio_mother",
        helper: "The child's birth certificate alone usually establishes the biological maternal relationship.",
      },
      {
        label:
          "Biological father, parents were legally married to each other",
        value: "bio_father_married",
        helper:
          "Parents were legally married when the child was born or legitimated before the child turned 18.",
      },
      {
        label:
          "Biological father, parents were never legally married to each other",
        value: "bio_father_unmarried",
        helper:
          "Evidence is required of legitimation before age 18 (while the child was in the father's legal custody), or of a genuine father-child relationship that existed before age 21 while the child was unmarried.",
      },
      {
        label: "Stepchild (petitioner married the child's biological parent)",
        value: "stepchild",
        helper:
          "The marriage creating the step-relationship must have occurred before the child's 18th birthday.",
      },
      {
        label: "Adopted child (legally adopted by the petitioner)",
        value: "adopted",
        helper:
          "The adoption must be completed before age 16 (or before 18 under the narrow natural-sibling exception), with 2 years of legal custody and 2 years of living together, before or after the adoption.",
      },
    ],
  },

  // Q2 — Child's age (Determines police clearance requirement at consular stage)
  {
    id: "child_age_16_or_older",
    question: "Is the child beneficiary 16 years of age or older?",
    helper:
      "Under State Department guidelines, visa applicants aged 16 and older require police character certificates from their country of nationality and any country where they resided for 6+ months.",
    options: [
      {
        label: "Yes, the child is 16 years of age or older (up to 20)",
        value: "yes",
      },
      {
        label: "No, the child is under 16 years of age",
        value: "no",
      },
    ],
  },

  // Q3 — Custody and non-accompanying parent consent
  {
    id: "child_custody_or_consent_required",
    question:
      "Is custody documentation or consent from the other biological parent needed?",
    helper:
      "If the child's parents are divorced, separated, or if the child is immigrating without one parent, the embassy requires a formal custody decree, legal guardianship, or written consent from the non-accompanying parent.",
    options: [
      {
        label:
          "Yes, parents are divorced/separated or only one parent is immigrating with the child",
        value: "yes",
      },
      {
        label:
          "No, both parents live together, sole legal custody is held, or the other parent is deceased",
        value: "no",
      },
    ],
  },

  // Q4 — Parents' prior marriages (Stepchild cases only)
  {
    id: "stepparent_bio_parent_prior_marriages",
    question:
      "Did either the petitioner or the biological parent have prior marriages before marrying each other?",
    helper:
      "Proof that all prior marriages ended (divorce decree, death certificate, or annulment) is required to show the marriage creating the stepchild relationship was legally valid.",
    visibleWhen: [
      { questionId: "child_relationship_type", requiredValue: "stepchild" },
    ],
    options: [
      {
        label:
          "Yes, at least one parent had a prior marriage before the current marriage",
        value: "yes",
      },
      {
        label: "No, this was the first marriage for both parents",
        value: "no",
      },
    ],
  },

  // Q5 — Continuity of step-relationship if marriage ended (Stepchild cases only)
  {
    id: "step_relationship_ended",
    question:
      "Has the marriage that created the step-relationship ended through divorce, separation, or death?",
    helper:
      "Under BIA precedents (Matter of Pagnerre, Matter of Mowrer), a stepchild relationship continues for immigration purposes if an ongoing emotional and parental relationship is demonstrated.",
    visibleWhen: [
      { questionId: "child_relationship_type", requiredValue: "stepchild" },
    ],
    options: [
      {
        label:
          "Yes, the marriage ended (due to divorce or death), but continuing parental ties exist",
        value: "yes",
      },
      {
        label: "No, the marriage is intact and ongoing",
        value: "no",
      },
    ],
  },

  // Q6 — Child's prior marriages (Beneficiary must be unmarried)
  {
    id: "child_prior_marriages",
    question: "Has the child beneficiary ever been married previously?",
    helper:
      "An IR-2 or CR-2 beneficiary must be currently unmarried. If the child was ever previously married, official proof of legal termination (divorce decree, annulment, or death certificate) is mandatory.",
    options: [
      {
        label:
          "Yes, the child was previously married (marriage is now legally dissolved, annulled, or widowed)",
        value: "yes",
      },
      {
        label: "No, the child has never been married",
        value: "no",
      },
    ],
  },

  // Q7 — Primary birth civil record availability
  {
    id: "primary_record_available",
    question:
      "Is the child's primary civil birth certificate available and registered contemporaneously?",
    helper:
      "If the child's birth was registered more than 1 year after birth (late registration) or if the birth certificate cannot be obtained, secondary evidence of birth and an official non-availability certificate are required.",
    options: [
      {
        label:
          "Yes, official birth certificate registered contemporaneously (within 1 year) is available",
        value: "yes",
      },
      {
        label:
          "No, the record is late-registered, inconsistent, or unavailable",
        value: "no",
      },
    ],
  },

  // Q8 — Legal name change or spelling discrepancies
  {
    id: "name_change",
    question:
      "Has the child beneficiary or petitioner ever legally changed their name or is there a discrepancy across documents?",
    helper:
      "Any spelling differences, missing middle names, or formal name changes must be documented with official legal name change evidence or explanatory affidavits.",
    options: [
      {
        label:
          "Yes, there is a legal name change, alias, or document discrepancy",
        value: "yes",
      },
      {
        label: "No, names and spellings match consistently across all records",
        value: "no",
      },
    ],
  },

  // Q9 — Military service history
  {
    id: "military_service",
    question:
      "Has the child beneficiary ever served in any country's military or armed forces?",
    helper:
      "If yes, official military service records, discharge papers, and certified English translations are required for consular processing.",
    options: [
      {
        label: "Yes, the child has military service history",
        value: "yes",
      },
      {
        label: "No, no military service",
        value: "no",
      },
    ],
  },

  // Q10 — Criminal history
  {
    id: "criminal_history",
    question:
      "Has the child beneficiary ever been arrested, cited, charged, or convicted of any offense anywhere in the world?",
    helper:
      "All law enforcement interactions (including juvenile matters, citations, or dismissed charges) must be disclosed with certified court records.",
    options: [
      {
        label:
          "Yes, there is at least one arrest, citation, charge, or conviction",
        value: "yes",
      },
      {
        label: "No criminal history",
        value: "no",
      },
    ],
  },
];

// ──────────────────────────────────────────────────────────────────
// BASE DOCUMENTS (always included for IR-2 / CR-2, regardless of answers)
// ──────────────────────────────────────────────────────────────────
export const IR2_BASE_DOCUMENTS: ConditionalDocument[] = [
  // ── Required Now (USCIS Stage) ───────────────────────────────────
  {
    id: "doc_citizenship",
    name: "Proof of U.S. Citizenship",
    subtitle:
      "Establishes that the petitioner is a U.S. citizen eligible to petition for a child",
    tag: "petitioner",
    guideUrl: "/guides",
    icon: "ShieldCheck",
    group: "Required Now",
    required: true,
  },
  {
    id: "doc_child_birth_cert",
    name: "Child Beneficiary Birth Certificate",
    subtitle:
      "Primary civil birth certificate establishing the child's birth and parentage",
    tag: "beneficiary",
    guideUrl: "/guides/birth-certificate-guide",
    icon: "ClipboardList",
    group: "Required Now",
    required: true,
  },
  {
    id: "doc_child_crc",
    name: "NADRA Children Registration Certificate (B-Form)",
    subtitle:
      "NADRA record showing both parents' names. It supports the birth certificate but does not replace it",
    tag: "beneficiary",
    guideUrl: "/guides/nadra-b-form-crc-guide",
    icon: "FileCheck",
    group: "Gather Now for Later",
    required: false,
  },
  {
    id: "doc_child_marital_status",
    name: "Proof of the Child's Unmarried Status",
    subtitle:
      "Evidence and affirmation that the child beneficiary is currently unmarried",
    tag: "beneficiary",
    guideUrl: "/guides",
    icon: "UserCheck",
    group: "Required Now",
    required: true,
  },

  // ── Required if Applicable ───────────────────────────────────────
  {
    id: "doc_translations",
    name: "Certified English Translations",
    subtitle:
      "Complete certified English translations of every submitted non-English document",
    tag: "both",
    guideUrl: "/guides",
    icon: "Globe",
    group: "Required if Applicable",
    required: false,
  },

  // ── Gather Now for Later (NVC & Consular Stage) ──────────────────
  {
    id: "doc_child_passport",
    name: "Child Beneficiary Passport",
    subtitle:
      "Valid passport for the child beneficiary, primarily required during NVC and consular processing",
    tag: "beneficiary",
    guideUrl: "/guides/passport-guide",
    icon: "BookOpen",
    group: "Gather Now for Later",
    required: false,
  },
  {
    id: "doc_frc",
    name: "Family Registration Certificate (FRC)",
    subtitle:
      "NADRA FRC listing the child and parents to corroborate the family relationship",
    tag: "both",
    guideUrl: "/guides/nadra-frc-guide",
    icon: "Users",
    group: "Gather Now for Later",
    required: false,
  },
  {
    id: "doc_passport_photos",
    name: "Passport-Style Photographs",
    subtitle:
      "Needed later for medical exam and immigrant visa processing at the consulate",
    tag: "beneficiary",
    guideUrl: "/guides",
    icon: "Camera",
    group: "Gather Now for Later",
    required: false,
  },
];

// ──────────────────────────────────────────────────────────────────
// DECISION RULES (questionnaire answers → conditional documents)
// ──────────────────────────────────────────────────────────────────
export const IR2_DECISION_RULES: DocumentDecisionRule[] = [
  // ── Biological father (married parents) → parents' marriage certificate ──
  {
    questionId: "child_relationship_type",
    triggerValue: "bio_father_married",
    documents: [
      {
        id: "doc_parents_marriage",
        name: "Parents' Marriage Certificate",
        subtitle:
          "Marriage certificate (Nikah Nama / MRC from the local Union Council or other local authority) showing legal marriage of the biological parents",
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
    questionId: "child_relationship_type",
    triggerValue: "bio_father_unmarried",
    documents: [
      {
        id: "doc_parents_marriage",
        name: "Parents' Marriage Certificate",
        subtitle:
          "Include if the parents subsequently married or legitimated the child under applicable law",
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
          "Financial support, shared residence, correspondence, and recognition proving a genuine father-child relationship",
        tag: "both",
        guideUrl: "/guides",
        icon: "Users",
        group: "Required if Applicable",
        required: true,
      },
    ],
  },

  // ── Stepparent → marriage certificate creating step-relationship ──
  {
    questionId: "child_relationship_type",
    triggerValue: "stepchild",
    documents: [
      {
        id: "doc_stepparent_marriage",
        name: "Marriage Certificate Creating the Step-Relationship",
        subtitle:
          "Proves the petitioner legally married the biological parent before the child turned 18",
        tag: "both",
        guideUrl: "/guides/nikah-nama-guide",
        icon: "HeartHandshake",
        group: "Required if Applicable",
        required: true,
      },
    ],
  },

  // ── Stepparent — parents had prior marriages → termination evidence ──
  {
    questionId: "stepparent_bio_parent_prior_marriages",
    triggerValue: "yes",
    documents: [
      {
        id: "doc_stepparent_prior_marriages",
        name: "Termination of Parents' Prior Marriages",
        subtitle:
          "Divorce decrees or death certificates proving all prior marriages of both parents were legally terminated",
        tag: "both",
        guideUrl: "/guides",
        icon: "Scale",
        group: "Required if Applicable",
        required: true,
      },
    ],
  },

  // ── Stepparent — marriage ended → evidence of continuing relationship ──
  {
    questionId: "step_relationship_ended",
    triggerValue: "yes",
    documents: [
      {
        id: "doc_step_continuing_relationship",
        name: "Evidence of a Continuing Stepparent-Stepchild Relationship",
        subtitle:
          "Ongoing emotional and financial ties, regular contact, and support following the end of the marriage",
        tag: "both",
        guideUrl: "/guides",
        icon: "Heart",
        group: "Required if Applicable",
        required: true,
      },
    ],
  },

  // ── Adopted child → final adoption decree + custody and residence evidence ──
  {
    questionId: "child_relationship_type",
    triggerValue: "adopted",
    documents: [
      {
        id: "doc_adoption_decree",
        name: "Final Adoption Decree",
        subtitle:
          "Official court decree proving legal adoption took place before the child turned 16 (or 18 for siblings)",
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
          "Evidence showing 2 years of legal custody and 2 years of joint physical residence with the adoptive parent",
        tag: "both",
        guideUrl: "/guides",
        icon: "Home",
        group: "Required if Applicable",
        required: true,
      },
    ],
  },

  // ── Custody / non-accompanying parent consent ──
  {
    questionId: "child_custody_or_consent_required",
    triggerValue: "yes",
    documents: [
      {
        id: "doc_custody_consent",
        name: "Custody Order and Non-Accompanying Parent Consent",
        subtitle:
          "Court custody order, guardianship order, or notarized written consent from the non-accompanying parent",
        tag: "both",
        guideUrl: "/guides",
        icon: "FileText",
        group: "Required if Applicable",
        required: true,
      },
    ],
  },

  // ── Child is 16 or older → police certificate required for consular stage ──
  {
    questionId: "child_age_16_or_older",
    triggerValue: "yes",
    documents: [
      {
        id: "doc_police_cert",
        name: "Police Character Certificate",
        subtitle:
          "Required for beneficiaries aged 16 and older for NVC and consular processing",
        tag: "beneficiary",
        guideUrl: "/guides/police-verification-guide",
        icon: "Lock",
        group: "Gather Now for Later",
        required: false,
      },
    ],
  },

  // ── Child was previously married → termination evidence ──
  {
    questionId: "child_prior_marriages",
    triggerValue: "yes",
    documents: [
      {
        id: "doc_child_prior_marriage_terminations",
        name: "Termination of Child's Prior Marriages",
        subtitle:
          "Divorce decrees, annulments, or death certificates proving the child is legally free to qualify as unmarried",
        tag: "beneficiary",
        guideUrl: "/guides",
        icon: "Scale",
        group: "Required if Applicable",
        required: true,
      },
    ],
  },

  // ── Legal name change / identity discrepancy ──
  {
    questionId: "name_change",
    triggerValue: "yes",
    documents: [
      {
        id: "doc_name_change",
        name: "Legal Name Change or Discrepancy Evidence",
        subtitle:
          "Court order, deed poll, gazette notification, or affidavit explaining discrepancies in names or spellings",
        tag: "both",
        guideUrl: "/guides",
        icon: "BadgeCheck",
        group: "Required if Applicable",
        required: true,
      },
    ],
  },

  // ── Primary birth record unavailable or inconsistent ──
  {
    questionId: "primary_record_available",
    triggerValue: "no",
    documents: [
      {
        id: "doc_secondary_relationship",
        name: "Secondary Evidence of Birth and Relationship",
        subtitle:
          "Early school records, medical/hospital records, religious records, or contemporaneous affidavits",
        tag: "both",
        guideUrl: "/guides",
        icon: "Files",
        group: "Required if Applicable",
        required: true,
      },
      {
        id: "doc_record_unavailability",
        name: "Certificate of Non-Availability of Birth Record",
        subtitle:
          "Official letter from local civil registrar certifying that the birth record does not exist or was destroyed",
        tag: "both",
        guideUrl: "/guides",
        icon: "FileWarning",
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
        subtitle:
          "Official military service records and discharge documents with certified English translations",
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
        name: "Court and Disposition Records",
        subtitle:
          "Certified copies of police reports, charging documents, court dispositions, and sentencing records",
        tag: "beneficiary",
        guideUrl: "/guides",
        icon: "Scale",
        group: "Required if Applicable",
        required: true,
      },
      {
        id: "doc_police_disposition",
        name: "Police Disposition Letters",
        subtitle:
          "Official police letters showing final disposition of arrests or charges where applicable",
        tag: "beneficiary",
        guideUrl: "/guides",
        icon: "FileText",
        group: "Required if Applicable",
        required: false,
      },
    ],
  },
];

// ──────────────────────────────────────────────────────────────────
// ELIGIBILITY DERIVATION MAP
// Translates Step 1.1 eligibility-suite answers into pre-filled answers
// so duplicate questions are never shown to the user.
// ──────────────────────────────────────────────────────────────────
export const IR2_ELIGIBILITY_DERIVATION_MAP: EligibilityDerivationMap = [
  // ── Q2S1: Relationship type ──────────────────────────────────────
  {
    eligibilityQuestId: "q2",
    eligibilityScreenId: "q2s1",
    derive: (val) => {
      if (
        [
          "bio_mother",
          "bio_father_married",
          "bio_father_unmarried",
          "stepchild",
          "adopted",
        ].includes(val)
      ) {
        return { child_relationship_type: val };
      }
      return {};
    },
  },

  // ── Q2S2: Child's age bracket ───────────────────────────────────
  {
    eligibilityQuestId: "q2",
    eligibilityScreenId: "q2s2",
    derive: (val) => {
      if (["under_14", "14_15"].includes(val)) {
        return { child_age_16_or_older: "no" };
      }
      if (["16_17", "18_20"].includes(val)) {
        return { child_age_16_or_older: "yes" };
      }
      return {};
    },
  },

  // ── Q2S3: Child's marital status ────────────────────────────────
  {
    eligibilityQuestId: "q2",
    eligibilityScreenId: "q2s3",
    derive: (val) => {
      if (val === "never_married") {
        return { child_prior_marriages: "no" };
      }
      if (val === "previously_married") {
        return { child_prior_marriages: "yes" };
      }
      return {};
    },
  },

  // ── Q3S8: Custody and non-accompanying parent consent ───────────
  {
    eligibilityQuestId: "q3",
    eligibilityScreenId: "q3s8",
    derive: (val) => {
      if (val === "yes" || val === "no") {
        return { child_custody_or_consent_required: "yes" };
      }
      if (val === "na") {
        return { child_custody_or_consent_required: "no" };
      }
      return {};
    },
  },

  // ── Q2S4 & Q1S5: Birth record availability & name discrepancy ──
  {
    eligibilityQuestId: "q2",
    eligibilityScreenId: "q2s4",
    derive: (val) => {
      if (val === "unavailable") {
        return { primary_record_available: "no" };
      }
      if (val === "mismatch") {
        return { name_change: "yes" };
      }
      if (val === "yes") {
        return { primary_record_available: "yes" };
      }
      return {};
    },
  },
  {
    eligibilityQuestId: "q1",
    eligibilityScreenId: "q1s5",
    derive: (val) => {
      if (val === "diff_proof" || val === "diff_no_proof") {
        return { name_change: "yes" };
      }
      if (val === "match") {
        return { name_change: "no" };
      }
      return {};
    },
  },

  // ── Q5S2: Criminal history ──────────────────────────────────────
  {
    eligibilityQuestId: "q5",
    eligibilityScreenId: "q5s2",
    derive: (val) => {
      if (val === "yes") {
        return { criminal_history: "yes" };
      }
      if (val === "no") {
        return { criminal_history: "no" };
      }
      return {};
    },
  },
];

// ──────────────────────────────────────────────────────────────────
// FULL CONFIGURATION EXPORT
// ──────────────────────────────────────────────────────────────────
export const IR2_QUESTIONNAIRE_CONFIG: QuestionnaireConfig = {
  id: "ir2-doc-questionnaire",
  title: "IR-2 / CR-2",
  subtitle:
    "Answer a few quick questions so we can build a document list tailored to your child's specific case and relationship. This only takes a minute.",
  questions: IR2_QUESTIONS,
  baseDocuments: IR2_BASE_DOCUMENTS,
  decisionRules: IR2_DECISION_RULES,
  eligibilityDerivationMap: IR2_ELIGIBILITY_DERIVATION_MAP,
};
