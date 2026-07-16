// ============================================================================
// IR-5 (parent of U.S. citizen) Questionnaire Configuration — JSON-DRIVEN
// ============================================================================
//
// SCALABILITY NOTE (Approach B): unlike `ir1-questionnaire.ts`, this file does
// NOT hard-code the document content. The document DEFINITIONS (name, subtitle,
// tag, icon, group, required) are the single source of truth in
// `data/visa-category/ir-5.json` (step_1_2 → `document_items`). Here we only
// author the LOGIC the json has no place for: the questions and the mapping of
// "which answer pulls in which document id". `buildIr5QuestionnaireConfig()`
// stitches the two together at runtime, so editing a document's wording in the
// json automatically flows into the checklist with no code change.
//
// A parent case has NO marriage bona-fides, so none of IR-1's spouse questions
// (prior marriage, Nikah/MRC, relationship evidence) exist here. The parent
// relationship instead varies by TYPE (mother / father / step / adoptive), which
// drives the relationship-proof documents.

import type {
  QuestionnaireConfig,
  QuestionnaireQuestion,
  ConditionalDocument,
  DocumentDecisionRule,
  QuestionnaireAnswers,
} from "./types";

/** Loose shape of one entry in ir-5.json → step_1_2 → document_items. */
export interface RawJourneyDocItem {
  id: string;
  name: string;
  subtitle?: string;
  tag?: string;
  guideUrl?: string;
  icon?: string;
  group?: string;
  required?: boolean;
}

// ── Questions (authored here — the json has no doc-questionnaire section) ──────
export const IR5_QUESTIONS: QuestionnaireQuestion[] = [
  {
    id: "parent_relationship_type",
    question: "What is your relationship to the parent you are petitioning for?",
    helper: "This decides which relationship-proof documents your case needs.",
    options: [
      { label: "My biological mother", value: "mother" },
      { label: "My biological father", value: "father" },
      { label: "My step-parent", value: "stepparent" },
      { label: "My adoptive parent", value: "adoptive" },
    ],
  },
  {
    id: "parents_were_married",
    question: "Were your biological parents legally married to each other when you were born?",
    helper:
      "For a father petition, USCIS needs either the parents' marriage certificate or proof of a genuine father-child relationship.",
    visibleWhen: [{ questionId: "parent_relationship_type", requiredValue: "father" }],
    options: [
      { label: "Yes — they were married", value: "yes" },
      { label: "No — they were not married", value: "no" },
    ],
  },
  {
    id: "primary_birth_record_ok",
    question: "Is your (the petitioner's) official birth certificate available and consistent?",
    helper:
      "It must correctly name the parent. If it is missing, late-registered, or inconsistent, extra evidence is needed.",
    options: [
      { label: "Yes — it is available and correct", value: "yes" },
      { label: "No — it is missing or inconsistent", value: "no" },
    ],
  },
  {
    id: "name_discrepancy",
    question: "Do names, spellings, or dates of birth differ across any of your documents?",
    helper: "Differences between records should be explained with supporting evidence.",
    options: [
      { label: "Yes — there are differences", value: "yes" },
      { label: "No — everything matches", value: "no" },
    ],
  },
  {
    id: "parent_prior_marriage",
    question: "Has the parent (the beneficiary) ever been married?",
    helper:
      "Marriage / divorce / former-spouse records may be needed later at the NVC or consular stage.",
    options: [
      { label: "Yes", value: "yes" },
      { label: "No", value: "no" },
    ],
  },
];

// ── Base documents: json doc-ids always shown, regardless of answers ──────────
const IR5_BASE_DOC_IDS: string[] = [
  "doc_citizenship",
  "doc_petitioner_birth_cert",
  "doc_parent_identity_match",
  "doc_translations",
  "doc_parent_passport",
  "doc_parent_birth_cert",
  "doc_police_cert",
  "doc_passport_photos",
];

// ── Conditional documents: answer → json doc-id(s) ────────────────────────────
interface Ir5DocRule {
  questionId: string;
  triggerValue: string | string[];
  docIds: string[];
  asOptional?: boolean;
}

const IR5_CONDITIONAL_DOCS: Ir5DocRule[] = [
  // Biological father → parents' marriage certificate
  { questionId: "parent_relationship_type", triggerValue: "father", docIds: ["doc_parents_marriage"] },
  // Father, parents NOT married → bona-fide father-child relationship evidence
  {
    questionId: "parents_were_married",
    triggerValue: "no",
    docIds: ["doc_father_bona_fide_relationship"],
  },
  // Step-parent → the marriage that created the step-relationship + prior-marriage terminations
  {
    questionId: "parent_relationship_type",
    triggerValue: "stepparent",
    docIds: ["doc_stepparent_marriage", "doc_stepparent_prior_marriages"],
  },
  // Adoptive parent → adoption decree + custody/residence evidence
  {
    questionId: "parent_relationship_type",
    triggerValue: "adoptive",
    docIds: ["doc_adoption_decree", "doc_adoption_custody_residence"],
  },
  // Name/date discrepancy → name-change / identity-discrepancy evidence
  { questionId: "name_discrepancy", triggerValue: "yes", docIds: ["doc_name_change"] },
  // Primary birth record unavailable/inconsistent → secondary + unavailability evidence
  {
    questionId: "primary_birth_record_ok",
    triggerValue: "no",
    docIds: ["doc_secondary_relationship", "doc_record_unavailability"],
  },
  // Parent has been married → gather their marriage/prior-marriage records for later
  {
    questionId: "parent_prior_marriage",
    triggerValue: "yes",
    docIds: ["doc_parent_marriage_history"],
    asOptional: true,
  },
];

// ── json → ConditionalDocument normalizers ────────────────────────────────────
// The json uses a few extra group/tag labels the engine's union doesn't include.
function normalizeGroup(group?: string): ConditionalDocument["group"] {
  if (group === "Required Now") return "Required Now";
  if (group === "Required if Applicable") return "Required if Applicable";
  // Everything else ("Gather Now for Later", "Gather Later", "Prepare for
  // Later — Do Not Obtain Too Early") collapses to the single "later" bucket.
  return "Gather Now for Later";
}

function normalizeTag(tag?: string): ConditionalDocument["tag"] {
  switch (tag) {
    case "petitioner":
    case "beneficiary":
    case "both":
    case "third party":
    case "joint_sponsor":
      return tag;
    case "parent beneficiary":
      return "beneficiary";
    default:
      return "both";
  }
}

function toConditionalDoc(raw: RawJourneyDocItem): ConditionalDocument {
  return {
    id: raw.id,
    name: raw.name,
    subtitle: raw.subtitle ?? "",
    tag: normalizeTag(raw.tag),
    guideUrl: raw.guideUrl ?? "/guides",
    icon: raw.icon ?? "FileText",
    group: normalizeGroup(raw.group),
    required: raw.required ?? false,
  };
}

/**
 * Build the IR-5 questionnaire config from the journey's own document list.
 * `docItems` is `currentStep.document_items` straight out of ir-5.json — so the
 * document content is never duplicated in code. Only ids referenced by
 * IR5_BASE_DOC_IDS / IR5_CONDITIONAL_DOCS are surfaced; anything missing from
 * the json is simply skipped (no crash).
 */
export function buildIr5QuestionnaireConfig(
  docItems: RawJourneyDocItem[] | undefined
): QuestionnaireConfig {
  const byId = new Map<string, ConditionalDocument>();
  for (const d of docItems ?? []) {
    if (d?.id) byId.set(d.id, toConditionalDoc(d));
  }

  const baseDocuments = IR5_BASE_DOC_IDS.map((id) => byId.get(id)).filter(
    (d): d is ConditionalDocument => Boolean(d)
  );

  const decisionRules: DocumentDecisionRule[] = IR5_CONDITIONAL_DOCS.map((rule) => ({
    questionId: rule.questionId,
    triggerValue: rule.triggerValue,
    asOptional: rule.asOptional,
    // A triggered relationship document is genuinely required for that case
    // (unless explicitly optional), even though the json lists it as
    // "Required if Applicable" (i.e. false until the condition applies).
    documents: rule.docIds
      .map((id) => byId.get(id))
      .filter((d): d is ConditionalDocument => Boolean(d))
      .map((d) => ({ ...d, required: rule.asOptional ? false : true })),
  })).filter((rule) => rule.documents.length > 0);

  return {
    id: "ir5-doc-questionnaire",
    title: "Personalize Your Document Checklist",
    subtitle:
      "Answer a few quick questions so we can build a document list tailored to your parent (IR-5) case. This only takes a minute.",
    questions: IR5_QUESTIONS,
    baseDocuments,
    decisionRules,
  };
}

/**
 * IR-5 Step 1 → Step 2 answer derivation.
 *
 * The IR-5 eligibility quest classifies the relationship differently than the
 * doc questionnaire, so we do NOT pre-fill answers here yet — the questionnaire
 * asks the relationship question directly. Kept for parity with the IR-1 API and
 * as the extension point once the eligibility→doc mapping is finalized.
 */
export function deriveIr5DocAnswersFromEligibility(
  _eligibilityAnswers: Record<string, Record<string, string | string[]>> | undefined
): QuestionnaireAnswers {
  return {};
}
