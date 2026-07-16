import {
  getVisibleProfileSections,
  type ProfileSectionContext,
} from "@/lib/profile/profileSectionRegistry";

describe("getVisibleProfileSections", () => {
  it("keeps shared sections visible even without any case context", () => {
    const sections = getVisibleProfileSections({
      hasAnyCase: false,
      hasIr1: false,
      hasIr5: false,
      cases: [],
      hasSponsorData: false,
      hasRelationshipData: false,
    } as ProfileSectionContext);

    const ids = sections.map((section) => section.id);
    expect(ids).toContain("personal");
    expect(ids).toContain("contact");
    expect(ids).toContain("family");
  });

  it("shows relationship and affidavit sections when an IR1/IR5 context is present", () => {
    const sections = getVisibleProfileSections({
      hasAnyCase: true,
      hasIr1: true,
      hasIr5: false,
      cases: [{ caseType: "IR1", status: "current", role: "beneficiary" }],
      hasSponsorData: true,
      hasRelationshipData: true,
    } as ProfileSectionContext);

    const ids = sections.map((section) => section.id);
    expect(ids).toContain("relationship");
    expect(ids).toContain("affidavit");
    expect(ids).toContain("sponsor");
  });
});
