import { isDocumentShareableAcrossCandidates } from "@/lib/document-vault/candidate-sharing";
import { DocumentDefinition } from "@/lib/document-vault/types";
import { ALL_DOCUMENTS } from "@/lib/document-vault/document-definitions";
import { isDocumentApplicableToJourney } from "@/lib/document-vault/journey-mapping";
import { getBaseVisaCategory } from "@/lib/candidate/candidateSyncService";

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
// offered for sharing to another journey, so this proves the real UI behavior for #1/#2.
function isOfferedForShare(
  docDef: DocumentDefinition,
  activeJourneyType: string,
  targetJourneyType: string
): boolean {
  if (!isDocumentApplicableToJourney(docDef.id, docDef.name, targetJourneyType)) return false;
  const activeBase = getBaseVisaCategory(activeJourneyType);
  const isSibling = !!activeBase && getBaseVisaCategory(targetJourneyType) === activeBase;
  if (isSibling && !isDocumentShareableAcrossCandidates(docDef)) return false;
  return true;
}

function realDoc(id: string): DocumentDefinition {
  const d = ALL_DOCUMENTS.find((x) => x.id === id);
  if (!d) throw new Error(`Document definition not found: ${id}`);
  return d;
}

describe("share-target filter for IR-5 two parents (sibling candidates)", () => {
  const PARENT_1 = "ir5"; // candidate-1 journey key
  const PARENT_2 = "ir5_candidate-2"; // candidate-2 journey key

  it("does NOT offer parent-specific docs (passport, CNIC, birth) to the other parent", () => {
    expect(isOfferedForShare(realDoc("passport-beneficiary"), PARENT_1, PARENT_2)).toBe(false);
    expect(isOfferedForShare(realDoc("cnic-beneficiary"), PARENT_1, PARENT_2)).toBe(false);
    expect(isOfferedForShare(realDoc("birth-cert-beneficiary"), PARENT_1, PARENT_2)).toBe(false);
  });

  it("DOES offer shared petitioner/sponsor docs to the other parent", () => {
    expect(isOfferedForShare(realDoc("birth-cert-petitioner"), PARENT_1, PARENT_2)).toBe(true);
    expect(isOfferedForShare(realDoc("citizenship-proof-petitioner"), PARENT_1, PARENT_2)).toBe(
      true
    );
  });

  it("offers the parents' marriage certificate via its explicit override", () => {
    expect(isOfferedForShare(realDoc("parents-marriage-cert"), PARENT_1, PARENT_2)).toBe(true);
  });

  it("does not apply the sibling filter across genuinely different visas (IR-1 -> F-1)", () => {
    // A different-visa target keeps the original cross-journey behavior (no shareability gate),
    // so a passport that is applicable to the target is still offered there.
    const passport = realDoc("passport-beneficiary");
    const offeredToF1 = isOfferedForShare(passport, "ir1", "f-1");
    const applicableToF1 = isDocumentApplicableToJourney(passport.id, passport.name, "f-1");
    expect(offeredToF1).toBe(applicableToF1);
  });
});
