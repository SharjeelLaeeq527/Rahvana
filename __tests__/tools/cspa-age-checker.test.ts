/**
 * CSPA age-out checker (lib/tools/cspa/ageOut.ts).
 * Risk: the checker tells a family their child is protected when the I-130 was filed at 21+,
 * the child is married, or the step / adoption rule fails; or it shows a filing deadline a day
 * late (Feb 29 birthdays, off-by-one on the 21st birthday itself).
 */

import {
  ageBetween,
  birthdayAt,
  checkCspa,
  CSPA_SOURCES,
  parseIsoDate,
  type CspaInput,
} from "@/lib/tools/cspa/ageOut";

const TODAY = "2026-11-04";
const base: CspaInput = {
  dateOfBirth: "2006-03-10", // turns 21 on 2027-03-10
  maritalStatus: "never_married",
  relationship: "biological",
  i130Filed: false,
};

describe("date helpers", () => {
  it("rejects impossible dates", () => {
    expect(parseIsoDate("2025-02-30")).toBeNull();
    expect(parseIsoDate("10/03/2006")).toBeNull();
  });

  it("puts a Feb 29 birthday on Feb 28 in a non-leap year (never late)", () => {
    expect(birthdayAt(parseIsoDate("2004-02-29")!, 21).toISOString().slice(0, 10)).toBe("2025-02-28");
    expect(birthdayAt(parseIsoDate("2004-02-29")!, 20).toISOString().slice(0, 10)).toBe("2024-02-29");
  });

  it("computes years, months and days", () => {
    expect(ageBetween(parseIsoDate("2006-03-10")!, parseIsoDate("2026-11-04")!)).toEqual({
      years: 20,
      months: 7,
      days: 25,
    });
  });
});

describe("I-130 not filed yet", () => {
  it("is urgent within a year of the 21st birthday", () => {
    const r = checkCspa(base, TODAY);
    expect(r.status).toBe("file_soon");
    expect(r.twentyFirstBirthday).toBe("2027-03-10");
    expect(r.daysUntil21).toBe(126);
    expect(r.cspaAge).toBeNull();
  });

  it("is not urgent when the child is young", () => {
    expect(checkCspa({ ...base, dateOfBirth: "2015-01-01" }, TODAY).status).toBe("not_filed");
  });

  it("says aged out on and after the 21st birthday", () => {
    expect(checkCspa(base, "2027-03-10").status).toBe("aged_out");
    expect(checkCspa(base, "2027-03-09").status).toBe("file_soon");
  });
});

describe("I-130 filed by a U.S. citizen parent", () => {
  const filed = { ...base, i130Filed: true, parentStatusAtFiling: "citizen" as const };

  it("freezes the age on the filing date when under 21", () => {
    const r = checkCspa({ ...filed, filingDate: "2026-06-01" }, TODAY);
    expect(r.status).toBe("protected");
    expect(r.freezeDate).toBe("2026-06-01");
    expect(r.freezeBasis).toBe("i130_filing");
    expect(r.cspaAge?.years).toBe(20);
  });

  it("does not protect an I-130 filed on the 21st birthday", () => {
    const r = checkCspa({ ...filed, filingDate: "2026-03-10", dateOfBirth: "2005-03-10" }, TODAY);
    expect(r.status).toBe("aged_out");
    expect(r.cspaAge?.years).toBe(21);
  });

  it("protects an I-130 filed the day before the 21st birthday", () => {
    const r = checkCspa({ ...filed, filingDate: "2026-03-09", dateOfBirth: "2005-03-10" }, TODAY);
    expect(r.status).toBe("protected");
  });
});

describe("parent was a green card holder at filing", () => {
  const lpr = {
    ...base,
    dateOfBirth: "2005-01-15",
    i130Filed: true,
    filingDate: "2022-05-01",
    parentStatusAtFiling: "lpr" as const,
  };

  it("is out of scope while the parent has not naturalized (F2A formula)", () => {
    expect(checkCspa({ ...lpr, parentNaturalized: false }, TODAY).status).toBe("needs_review");
  });

  it("freezes on the naturalization date when the child was under 21", () => {
    const r = checkCspa({ ...lpr, parentNaturalized: true, naturalizationDate: "2025-12-01" }, TODAY);
    expect(r.status).toBe("protected");
    expect(r.freezeBasis).toBe("naturalization");
    expect(r.freezeDate).toBe("2025-12-01");
  });

  it("never says protected when the child was 21 at naturalization", () => {
    const r = checkCspa({ ...lpr, parentNaturalized: true, naturalizationDate: "2026-02-01" }, TODAY);
    expect(r.status).toBe("needs_review");
  });

  it("rejects a naturalization date before the filing date", () => {
    const r = checkCspa({ ...lpr, parentNaturalized: true, naturalizationDate: "2021-01-01" }, TODAY);
    expect(r.status).toBe("invalid");
  });
});

describe("marriage and relationship rules", () => {
  const protectedCase = {
    ...base,
    i130Filed: true,
    filingDate: "2026-06-01",
    parentStatusAtFiling: "citizen" as const,
  };

  it("never protects a married child, whatever the dates", () => {
    expect(checkCspa({ ...protectedCase, maritalStatus: "married" }, TODAY).status).toBe("not_a_child");
  });

  it("sends a previously married child to review", () => {
    expect(checkCspa({ ...protectedCase, maritalStatus: "previously_married" }, TODAY).status).toBe(
      "needs_review"
    );
  });

  it("flags a stepparent marriage on or after the 18th birthday", () => {
    const r = checkCspa(
      { ...protectedCase, relationship: "stepchild", stepMarriageDate: "2024-03-10" },
      TODAY
    );
    expect(r.status).toBe("needs_review");
    expect(r.checks.find((c) => c.id === "step_marriage_late")?.state).toBe("problem");
  });

  it("accepts a stepparent marriage before 18", () => {
    const r = checkCspa(
      { ...protectedCase, relationship: "stepchild", stepMarriageDate: "2020-01-01" },
      TODAY
    );
    expect(r.status).toBe("protected");
  });

  it("treats adoption at 16 to 18 as the birth-sibling exception only", () => {
    const r = checkCspa({ ...protectedCase, relationship: "adopted", adoptionDate: "2023-01-01" }, TODAY);
    expect(r.checks.find((c) => c.id === "adoption_sibling_only")?.state).toBe("review");
    expect(r.checks.some((c) => c.id === "adoption_custody")).toBe(true);
  });

  it("flags adoption at 18 or older", () => {
    const r = checkCspa({ ...protectedCase, relationship: "adopted", adoptionDate: "2024-06-01" }, TODAY);
    expect(r.status).toBe("needs_review");
  });
});

describe("input validation and sources", () => {
  it("rejects a missing or future date of birth and a future filing date", () => {
    expect(checkCspa({ ...base, dateOfBirth: "" }, TODAY).status).toBe("invalid");
    expect(checkCspa({ ...base, dateOfBirth: "2030-01-01" }, TODAY).status).toBe("invalid");
    expect(
      checkCspa(
        { ...base, i130Filed: true, filingDate: "2027-01-01", parentStatusAtFiling: "citizen" },
        TODAY
      ).status
    ).toBe("invalid");
  });

  it("only cites official uscis.gov pages", () => {
    for (const s of Object.values(CSPA_SOURCES)) expect(s.url).toMatch(/^https:\/\/www\.uscis\.gov\//);
  });

  it("uses plain ASCII in every message", () => {
    const cases: CspaInput[] = [
      base,
      { ...base, maritalStatus: "married" },
      { ...base, i130Filed: true, filingDate: "2026-06-01", parentStatusAtFiling: "citizen" },
      { ...base, relationship: "adopted", adoptionDate: "2023-01-01" },
    ];
    for (const c of cases) {
      const r = checkCspa(c, TODAY);
      const text = [r.headline, r.body, ...r.nextSteps, ...r.checks.map((x) => x.text)].join(" ");
      expect(text).toMatch(/^[\x20-\x7E]*$/);
    }
  });
});
