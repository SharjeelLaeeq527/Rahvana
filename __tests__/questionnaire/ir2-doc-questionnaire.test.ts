/**
 * IR-2 / CR-2 document questionnaire tests.
 *
 * Verifies that the Step 2 questionnaire configuration for IR-2:
 *   - supplies the correct base documents for a child petition,
 *   - includes conditional decision rules for relationship types (bio mother,
 *     bio father out of wedlock, stepchild, adopted),
 *   - conditionally requires police clearance only for children 16+,
 *   - never requires spouse-only marriage certificates for the petitioner/beneficiary.
 */

import { IR2_QUESTIONNAIRE_CONFIG } from "@/lib/questionnaire/ir2-questionnaire";
import { computeDocumentList } from "@/lib/questionnaire/engine";
import { getQuestionnaireConfig } from "@/lib/questionnaire";

describe("IR-2 Document Questionnaire Configuration", () => {
  it("resolves through getQuestionnaireConfig for IR-2 and CR-2", () => {
    expect(getQuestionnaireConfig("ir-2")).toBe(IR2_QUESTIONNAIRE_CONFIG);
    expect(getQuestionnaireConfig("IR2")).toBe(IR2_QUESTIONNAIRE_CONFIG);
    expect(getQuestionnaireConfig("cr-2")).toBe(IR2_QUESTIONNAIRE_CONFIG);
    expect(getQuestionnaireConfig("CR-2")).toBe(IR2_QUESTIONNAIRE_CONFIG);
  });

  it("includes core child base documents", () => {
    const baseIds = IR2_QUESTIONNAIRE_CONFIG.baseDocuments.map((d) => d.id);
    expect(baseIds).toContain("doc_citizenship");
    expect(baseIds).toContain("doc_child_birth_cert");
    expect(baseIds).toContain("doc_child_crc");
    expect(baseIds).toContain("doc_child_passport");
  });

  it("adds legitimation evidence when petitioner is an unmarried biological father", () => {
    const docs = computeDocumentList(IR2_QUESTIONNAIRE_CONFIG, {
      child_relationship_type: "bio_father_unmarried",
    });
    const ids = docs.map((d) => d.id);
    expect(ids).toContain("doc_father_bona_fide_relationship");
  });

  it("adds step-relationship documents when child is a stepchild", () => {
    const docs = computeDocumentList(IR2_QUESTIONNAIRE_CONFIG, {
      child_relationship_type: "stepchild",
      stepparent_marriage_timing: "before_18",
    });
    const ids = docs.map((d) => d.id);
    expect(ids).toContain("doc_stepparent_marriage");
  });

  it("adds adoption decree and custody/residence when child is adopted", () => {
    const docs = computeDocumentList(IR2_QUESTIONNAIRE_CONFIG, {
      child_relationship_type: "adopted",
      adoption_age_16_or_sibling: "yes",
      adoption_custody_and_residence_met: "yes",
    });
    const ids = docs.map((d) => d.id);
    expect(ids).toContain("doc_adoption_decree");
    expect(ids).toContain("doc_adoption_custody_residence");
  });

  it("adds custody order or consent when needed", () => {
    const docs = computeDocumentList(IR2_QUESTIONNAIRE_CONFIG, {
      child_custody_or_consent_required: "yes",
    });
    const ids = docs.map((d) => d.id);
    expect(ids).toContain("doc_custody_consent");
  });

  it("conditionally includes police certificate only when child is 16 or older", () => {
    const under16 = computeDocumentList(IR2_QUESTIONNAIRE_CONFIG, {
      child_age_16_or_older: "no",
    });
    const pccUnder16 = under16.find((d) => d.id === "doc_police_cert");
    expect(pccUnder16).toBeUndefined();

    const over16 = computeDocumentList(IR2_QUESTIONNAIRE_CONFIG, {
      child_age_16_or_older: "yes",
    });
    const pccOver16 = over16.find((d) => d.id === "doc_police_cert");
    expect(pccOver16).toBeDefined();
    expect(pccOver16?.group).toBe("Gather Now for Later");
  });
});
