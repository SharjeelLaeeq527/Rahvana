/**
 * IR-5 document questionnaire — JSON-driven (Approach B).
 *
 * Proves the Step 2 "personalized checklist" for IR-5:
 *   - sources its documents from the REAL data/visa-category/ir-5.json (single
 *     source of truth), NOT from the hard-coded IR-1 spouse config, and
 *   - never surfaces spouse (IR-1) documents for any set of answers, and
 *   - pulls in the correct relationship-proof docs per parent relationship type.
 */

import fs from "fs";
import path from "path";
import {
  buildIr5QuestionnaireConfig,
  type RawJourneyDocItem,
} from "@/lib/questionnaire/ir5-questionnaire";
import { computeDocumentList } from "@/lib/questionnaire/engine";

// Load the real roadmap json (avoids resolveJsonModule/alias concerns in jest).
const ir5Json = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "data/visa-category/ir-5.json"), "utf-8")
);

/** Recursively locate the step_1_2 document list inside the roadmap json. */
function findDocItems(node: unknown): RawJourneyDocItem[] | null {
  if (!node || typeof node !== "object") return null;
  const obj = node as Record<string, unknown>;
  const items = obj.document_items;
  if (
    Array.isArray(items) &&
    items.some((d) => (d as { id?: string })?.id === "doc_petitioner_birth_cert")
  ) {
    return items as RawJourneyDocItem[];
  }
  for (const key of Object.keys(obj)) {
    const found = findDocItems(obj[key]);
    if (found) return found;
  }
  return null;
}

const SPOUSE_DOC_IDS = [
  "doc_nikah_nama",
  "doc_mrc",
  "doc_relationship",
  "doc_petitioner_divorce",
  "doc_beneficiary_divorce",
];

describe("IR-5 document questionnaire (JSON-driven)", () => {
  const docItems = findDocItems(ir5Json);
  const config = buildIr5QuestionnaireConfig(docItems ?? undefined);

  const allConfigIds = () => [
    ...config.baseDocuments.map((d) => d.id),
    ...config.decisionRules.flatMap((r) => r.documents.map((d) => d.id)),
  ];

  it("found the real step_1_2 document list in ir-5.json", () => {
    expect(docItems).toBeTruthy();
    expect(docItems!.length).toBeGreaterThan(5);
  });

  it("sources parent docs from the json and contains NO spouse documents", () => {
    const ids = allConfigIds();
    expect(ids).toContain("doc_citizenship");
    expect(ids).toContain("doc_petitioner_birth_cert");
    for (const spouse of SPOUSE_DOC_IDS) {
      expect(ids).not.toContain(spouse);
    }
  });

  it("never produces a spouse document for ANY set of answers", () => {
    const scenarios: Record<string, string>[] = [
      {},
      { parent_relationship_type: "mother" },
      { parent_relationship_type: "father", parents_were_married: "yes" },
      { parent_relationship_type: "father", parents_were_married: "no" },
      { parent_relationship_type: "stepparent" },
      { parent_relationship_type: "adoptive" },
      { name_discrepancy: "yes", primary_birth_record_ok: "no", parent_prior_marriage: "yes" },
    ];
    for (const answers of scenarios) {
      const ids = computeDocumentList(config, answers).map((d) => d.id);
      for (const spouse of SPOUSE_DOC_IDS) {
        expect(ids).not.toContain(spouse);
      }
    }
  });

  it("always includes the base parent docs (citizenship + petitioner birth cert)", () => {
    const ids = computeDocumentList(config, {}).map((d) => d.id);
    expect(ids).toContain("doc_citizenship");
    expect(ids).toContain("doc_petitioner_birth_cert");
  });

  it("biological father → parents' marriage certificate; mother case does not", () => {
    const father = computeDocumentList(config, { parent_relationship_type: "father" }).map(
      (d) => d.id
    );
    expect(father).toContain("doc_parents_marriage");

    const mother = computeDocumentList(config, { parent_relationship_type: "mother" }).map(
      (d) => d.id
    );
    expect(mother).not.toContain("doc_parents_marriage");
  });

  it("father + parents NOT married → bona-fide father-child relationship evidence", () => {
    const ids = computeDocumentList(config, {
      parent_relationship_type: "father",
      parents_were_married: "no",
    }).map((d) => d.id);
    expect(ids).toContain("doc_father_bona_fide_relationship");
  });

  it("stepparent and adoptive pull DIFFERENT, non-overlapping relationship docs", () => {
    const step = computeDocumentList(config, { parent_relationship_type: "stepparent" }).map(
      (d) => d.id
    );
    expect(step).toContain("doc_stepparent_marriage");
    expect(step).not.toContain("doc_adoption_decree");

    const adopt = computeDocumentList(config, { parent_relationship_type: "adoptive" }).map(
      (d) => d.id
    );
    expect(adopt).toContain("doc_adoption_decree");
    expect(adopt).not.toContain("doc_stepparent_marriage");
  });

  it("missing/inconsistent birth record → secondary + unavailability evidence", () => {
    const ids = computeDocumentList(config, { primary_birth_record_ok: "no" }).map((d) => d.id);
    expect(ids).toContain("doc_secondary_relationship");
    expect(ids).toContain("doc_record_unavailability");
  });
});
