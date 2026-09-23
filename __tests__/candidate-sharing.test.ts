import { isDocumentShareableAcrossCandidates } from "@/lib/document-vault/candidate-sharing";
import { DocumentDefinition } from "@/lib/document-vault/types";
import { ALL_DOCUMENTS } from "@/lib/document-vault/document-definitions";
import { isDocumentApplicableToJourney } from "@/lib/document-vault/journey-mapping";

function def(partial: Partial<DocumentDefinition>): DocumentDefinition {
  return {
    id: "x",
    key: "X",
    name: "X",
    description: "",
    category: "CIVIL",
    roles: [],
    stages: ["NVC"],
    required: false,
    multipleFilesAllowed: false,
    validityType: "none",
    ...partial,
  };
}

describe("isDocumentShareableAcrossCandidates (cross-parent sharing relevance)", () => {
  it("shares petitioner / joint-sponsor / household documents by default", () => {
    expect(isDocumentShareableAcrossCandidates(def({ roles: ["PETITIONER"] }))).toBe(true);
    expect(isDocumentShareableAcrossCandidates(def({ roles: ["JOINT_SPONSOR"] }))).toBe(true);
    expect(isDocumentShareableAcrossCandidates(def({ roles: ["HOUSEHOLD_MEMBER"] }))).toBe(true);
  });

  it("treats any beneficiary (parent-specific) document as NOT shareable", () => {
    // passport, CNIC, birth, medical, etc. are BENEFICIARY-role docs.
    expect(isDocumentShareableAcrossCandidates(def({ roles: ["BENEFICIARY"] }))).toBe(false);
    expect(isDocumentShareableAcrossCandidates(def({ roles: ["BENEFICIARY", "PETITIONER"] }))).toBe(
      false
    );
  });

  it("treats a document with no roles as NOT shareable", () => {
    expect(isDocumentShareableAcrossCandidates(def({ roles: [] }))).toBe(false);
  });

  it("honors an explicit config override in both directions", () => {
    // e.g. parents-marriage-cert: BENEFICIARY role but same doc for both parents.
    expect(
      isDocumentShareableAcrossCandidates(
        def({ roles: ["BENEFICIARY"], shareableAcrossCandidates: true })
      )
    ).toBe(true);
    expect(
      isDocumentShareableAcrossCandidates(
        def({ roles: ["PETITIONER"], shareableAcrossCandidates: false })
      )
    ).toBe(false);
  });
});

// Reproduces the EXACT predicate both upload modals use to decide whether a document is
// offered for sharing to another journey, so this proves the real UI behavior. The rule is
// category-AGNOSTIC now: a document is offered to ANY other journey (sibling candidate OR a
// different visa category) only when it is a genuinely-same shareable petitioner/sponsor
// document AND it applies to the target journey's category.
function isOfferedForShare(
  docDef: DocumentDefinition,
  targetJourneyType: string
): boolean {
  if (!isDocumentShareableAcrossCandidates(docDef)) return false;
  if (!isDocumentApplicableToJourney(docDef.id, docDef.name, targetJourneyType)) return false;
  return true;
}

function realDoc(id: string): DocumentDefinition {
  const d = ALL_DOCUMENTS.find((x) => x.id === id);
  if (!d) throw new Error(`Document definition not found: ${id}`);
  return d;
}

describe("share-target filter for IR-5 two parents (sibling candidates)", () => {
  const PARENT_2 = "ir5_candidate-2"; // candidate-2 journey key

  it("does NOT offer parent-specific docs (passport, CNIC, birth) to the other parent", () => {
    expect(isOfferedForShare(realDoc("passport-beneficiary"), PARENT_2)).toBe(false);
    expect(isOfferedForShare(realDoc("cnic-beneficiary"), PARENT_2)).toBe(false);
    expect(isOfferedForShare(realDoc("birth-cert-beneficiary"), PARENT_2)).toBe(false);
  });

  it("DOES offer shared petitioner/sponsor docs to the other parent", () => {
    expect(isOfferedForShare(realDoc("birth-cert-petitioner"), PARENT_2)).toBe(true);
    expect(isOfferedForShare(realDoc("citizenship-proof-petitioner"), PARENT_2)).toBe(true);
  });

  it("offers the parents' marriage certificate via its explicit override", () => {
    expect(isOfferedForShare(realDoc("parents-marriage-cert"), PARENT_2)).toBe(true);
  });
});

describe("cross-CATEGORY share filter (IR-1 spouse journey <-> IR-5 parent journey)", () => {
  it("offers a shared petitioner document across different categories, both directions", () => {
    // The petitioner's own citizenship proof is the SAME file for every category, so a
    // petitioner on both an IR-1 and an IR-5 journey should be offered it in each direction.
    const citizenship = realDoc("citizenship-proof-petitioner");
    if (isDocumentApplicableToJourney(citizenship.id, citizenship.name, "ir5")) {
      expect(isOfferedForShare(citizenship, "ir5")).toBe(true);
    }
    if (isDocumentApplicableToJourney(citizenship.id, citizenship.name, "ir1")) {
      expect(isOfferedForShare(citizenship, "ir1")).toBe(true);
    }
  });

  it("NEVER offers a beneficiary-specific document across categories", () => {
    // A beneficiary passport differs per person, so it is never cross-shared - not to a
    // sibling candidate and not to a different-category journey either.
    expect(isOfferedForShare(realDoc("passport-beneficiary"), "ir5")).toBe(false);
    expect(isOfferedForShare(realDoc("passport-beneficiary"), "ir1")).toBe(false);
  });
});
