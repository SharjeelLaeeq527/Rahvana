/**
 * CSPA age-out checker for a child of a U.S. citizen (IR-2 / CR-2).
 *
 * Pure logic, no React and no I/O, so the standalone page and the journey share one rule set
 * and it can be tested on its own. Every rule below is tied to an official USCIS source in
 * CSPA_SOURCES. Keep it that way: when a rule is not on an official page, say "get legal review"
 * instead of guessing. Content status: pending qualified legal review (IR-2 plan, decision D6).
 *
 * Rules used (quoted from the sources):
 * - A "child" is unmarried and under 21 (USCIS children page).
 * - Child of a U.S. citizen: age is frozen on the date the I-130 is filed, if the child was under
 *   21 and unmarried then, and the child must remain unmarried (Policy Manual 7.A.7 C.1, C.2).
 * - Parent was a green card holder when the I-130 was filed and naturalized before the child
 *   turned 21: age freezes on the naturalization date and the child becomes an immediate
 *   relative (USCIS CSPA page).
 * - Stepchild: the marriage creating the step-relationship occurred before the child turned 18.
 * - Adopted child: adopted before 16 (16 to 18 only for a birth sibling), plus 2 years of legal
 *   custody and joint residence while under 21 (USCIS adoption page, INA 101(b)(1)(E)).
 * - Married sons and daughters of U.S. citizens are F3; unmarried sons and daughters 21 or older
 *   are F1 (USCIS family-of-U.S.-citizens page).
 * Not covered on purpose: a green card holder parent who has not naturalized (F2A uses a
 * different formula, INA 203(h)), and a previously married child (needs legal review).
 */

export const CSPA_SOURCES = {
  cspa: {
    label: "USCIS: Child Status Protection Act (CSPA)",
    url: "https://www.uscis.gov/green-card/green-card-processes-and-procedures/child-status-protection-act-cspa",
  },
  policyManual: {
    label: "USCIS Policy Manual, Volume 7, Part A, Chapter 7 (CSPA)",
    url: "https://www.uscis.gov/policy-manual/volume-7-part-a-chapter-7",
  },
  children: {
    label: "USCIS: Bring Children to Live in the United States",
    url: "https://www.uscis.gov/family/bring-children-to-live-in-the-US",
  },
  categories: {
    label: "USCIS: Family of U.S. Citizens",
    url: "https://www.uscis.gov/family/family-of-us-citizens",
  },
  adoption: {
    label: "USCIS: Family-Based Petition Process (adopted children)",
    url: "https://www.uscis.gov/adoption/immigration-through-adoption/family-based-petition-process",
  },
} as const;

export type CspaSourceId = keyof typeof CSPA_SOURCES;

export type CspaMaritalStatus = "never_married" | "previously_married" | "married";
export type CspaRelationship = "biological" | "stepchild" | "adopted";
/** Parent's status on the date the I-130 was filed. */
export type CspaParentStatusAtFiling = "citizen" | "lpr";

export interface CspaInput {
  /** Child's date of birth, YYYY-MM-DD. */
  dateOfBirth: string;
  maritalStatus: CspaMaritalStatus;
  relationship: CspaRelationship;
  /** Stepchild only: date of the marriage that created the step-relationship. */
  stepMarriageDate?: string | null;
  /** Adopted only: date the adoption became final. */
  adoptionDate?: string | null;
  i130Filed: boolean;
  /** Date USCIS received the I-130 (the Received Date on the I-797C receipt notice). */
  filingDate?: string | null;
  parentStatusAtFiling?: CspaParentStatusAtFiling | null;
  /** Only when the parent was a green card holder at filing. */
  parentNaturalized?: boolean | null;
  naturalizationDate?: string | null;
}

export type CspaStatus =
  /** Age is frozen under 21 on a qualifying date. */
  | "protected"
  /** I-130 not filed yet and the child turns 21 within FILE_SOON_DAYS. */
  | "file_soon"
  /** I-130 not filed yet, more than FILE_SOON_DAYS before the 21st birthday. */
  | "not_filed"
  /** The qualifying date fell on or after the 21st birthday. */
  | "aged_out"
  /** The child is married, so not a "child" for IR-2 / CR-2. */
  | "not_a_child"
  /** Outside what this checker can decide (F2A, previously married, 21+ at naturalization). */
  | "needs_review"
  | "invalid";

export type CspaCheckState = "ok" | "problem" | "review" | "info";

export interface CspaCheck {
  id: string;
  state: CspaCheckState;
  text: string;
}

export interface CspaAge {
  years: number;
  months: number;
  days: number;
}

export interface CspaResult {
  status: CspaStatus;
  headline: string;
  body: string;
  /** Date the age is frozen on, when one applies. */
  freezeDate: string | null;
  freezeBasis: "i130_filing" | "naturalization" | null;
  /** Child's age on the freeze date (the "CSPA age" for an immediate relative). */
  cspaAge: CspaAge | null;
  ageToday: CspaAge | null;
  twentyFirstBirthday: string | null;
  /** Days from today until the 21st birthday (negative once it has passed). */
  daysUntil21: number | null;
  /** Relationship checks (stepchild / adoption) and reminders. */
  checks: CspaCheck[];
  nextSteps: string[];
  sources: CspaSourceId[];
  errors: string[];
}

/** An unfiled case within this many days of the 21st birthday is urgent. */
export const FILE_SOON_DAYS = 365;

// ─── Date helpers (UTC, date only) ────────────────────────────────────────────

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Parses YYYY-MM-DD into a UTC date, or null when the text is not a real calendar date. */
export function parseIsoDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const m = ISO_DATE.exec(value.trim());
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(Date.UTC(y, mo - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== mo - 1 || date.getUTCDate() !== d) {
    return null;
  }
  return date;
}

export function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function isLeapYear(y: number): boolean {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}

/**
 * The date a person born on `dob` reaches `years` of age. A February 29 birthday falls on
 * February 28 in a non-leap year: the earlier date, so a deadline is never shown late.
 */
export function birthdayAt(dob: Date, years: number): Date {
  const y = dob.getUTCFullYear() + years;
  const mo = dob.getUTCMonth();
  let d = dob.getUTCDate();
  if (mo === 1 && d === 29 && !isLeapYear(y)) d = 28;
  return new Date(Date.UTC(y, mo, d));
}

/** Whole years, months and days from `from` to `to` (to >= from). */
export function ageBetween(from: Date, to: Date): CspaAge {
  let years = to.getUTCFullYear() - from.getUTCFullYear();
  let months = to.getUTCMonth() - from.getUTCMonth();
  let days = to.getUTCDate() - from.getUTCDate();
  if (days < 0) {
    months -= 1;
    // Days in the month before `to`.
    days += new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), 0)).getUTCDate();
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  return { years, months, days };
}

const DAY_MS = 24 * 60 * 60 * 1000;

function daysBetween(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / DAY_MS);
}

export function formatAge(age: CspaAge): string {
  const part = (n: number, unit: string) => `${n} ${unit}${n === 1 ? "" : "s"}`;
  return `${part(age.years, "year")}, ${part(age.months, "month")}, ${part(age.days, "day")}`;
}

/** "14 March 2027" style, fixed English month names (no locale drift between server and client). */
export function formatDate(iso: string | null): string {
  const d = parseIsoDate(iso);
  if (!d) return "";
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  return `${d.getUTCDate()} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

// ─── Checker ─────────────────────────────────────────────────────────────────

function emptyResult(errors: string[]): CspaResult {
  return {
    status: "invalid",
    headline: "Please check the dates",
    body: errors[0] ?? "Some information is missing.",
    freezeDate: null,
    freezeBasis: null,
    cspaAge: null,
    ageToday: null,
    twentyFirstBirthday: null,
    daysUntil21: null,
    checks: [],
    nextSteps: [],
    sources: [],
    errors,
  };
}

function validate(input: CspaInput, today: Date): string[] {
  const errors: string[] = [];
  const dob = parseIsoDate(input.dateOfBirth);
  if (!dob) {
    errors.push("Enter the child's date of birth.");
    return errors;
  }
  if (dob > today) errors.push("The date of birth cannot be in the future.");

  const checkDate = (value: string | null | undefined, label: string) => {
    const d = parseIsoDate(value);
    if (!d) {
      errors.push(`Enter the ${label}.`);
      return null;
    }
    if (d > today) errors.push(`The ${label} cannot be in the future.`);
    if (d < dob) errors.push(`The ${label} cannot be before the child's date of birth.`);
    return d;
  };

  if (input.relationship === "stepchild" && input.stepMarriageDate) {
    const d = parseIsoDate(input.stepMarriageDate);
    if (!d) errors.push("Enter a valid marriage date.");
    else if (d > today) errors.push("The marriage date cannot be in the future.");
  }
  if (input.relationship === "adopted" && input.adoptionDate) {
    checkDate(input.adoptionDate, "adoption date");
  }

  if (input.i130Filed) {
    const filed = checkDate(input.filingDate, "I-130 filing date");
    if (!input.parentStatusAtFiling) {
      errors.push("Choose whether the parent was a U.S. citizen or a green card holder when the I-130 was filed.");
    }
    if (input.parentStatusAtFiling === "lpr" && input.parentNaturalized) {
      const nat = checkDate(input.naturalizationDate, "date the parent became a citizen");
      if (filed && nat && nat < filed) {
        errors.push(
          "The citizenship date is before the I-130 filing date. If the parent was already a U.S. citizen when the I-130 was filed, choose U.S. citizen."
        );
      }
    }
  }
  return errors;
}

function relationshipChecks(input: CspaInput, dob: Date): CspaCheck[] {
  const checks: CspaCheck[] = [];

  if (input.relationship === "stepchild") {
    const married = parseIsoDate(input.stepMarriageDate);
    const eighteenth = birthdayAt(dob, 18);
    if (!married) {
      checks.push({
        id: "step_marriage_unknown",
        state: "review",
        text: `A stepchild counts only if the stepparent married the child's parent before the child turned 18 (before ${formatDate(toIsoDate(eighteenth))}). Add the marriage date to check this.`,
      });
    } else if (married < eighteenth) {
      checks.push({
        id: "step_marriage_ok",
        state: "ok",
        text: `Good: the stepparent married the child's parent (${formatDate(toIsoDate(married))}) before the child turned 18.`,
      });
    } else {
      checks.push({
        id: "step_marriage_late",
        state: "problem",
        text: `The stepparent married the child's parent (${formatDate(toIsoDate(married))}) after the child turned 18 (${formatDate(toIsoDate(eighteenth))}). The marriage had to happen before 18, so the child does not count as a stepchild. Talk to an immigration lawyer.`,
      });
    }
  }

  if (input.relationship === "adopted") {
    const adopted = parseIsoDate(input.adoptionDate);
    const sixteenth = birthdayAt(dob, 16);
    const eighteenth = birthdayAt(dob, 18);
    if (!adopted) {
      checks.push({
        id: "adoption_unknown",
        state: "review",
        text: `An adopted child usually counts only if adopted before age 16 (before ${formatDate(toIsoDate(sixteenth))}). Add the adoption date to check this.`,
      });
    } else if (adopted < sixteenth) {
      checks.push({
        id: "adoption_ok",
        state: "ok",
        text: `Good: the adoption (${formatDate(toIsoDate(adopted))}) was before the child turned 16.`,
      });
    } else if (adopted < eighteenth) {
      checks.push({
        id: "adoption_sibling_only",
        state: "review",
        text: "The adoption was between ages 16 and 18. This counts only if a brother or sister of the child was adopted by the same parent before age 16. Talk to an immigration lawyer.",
      });
    } else {
      checks.push({
        id: "adoption_late",
        state: "problem",
        text: "The adoption was after the child turned 18, so the child does not count as an adopted child. Talk to an immigration lawyer.",
      });
    }
    checks.push({
      id: "adoption_custody",
      state: "info",
      text: "The adoptive parent must also have had legal custody of the child and lived with the child for at least 2 years before the child turned 21. A guardianship order does not count as adoption.",
    });
  }

  return checks;
}

/**
 * Runs the checker. `today` is injectable for tests; it defaults to the current UTC date.
 */
export function checkCspa(input: CspaInput, todayIso?: string): CspaResult {
  const today = parseIsoDate(todayIso ?? toIsoDate(new Date()))!;
  const errors = validate(input, today);
  if (errors.length) return emptyResult(errors);

  const dob = parseIsoDate(input.dateOfBirth)!;
  const twentyFirst = birthdayAt(dob, 21);
  const twentyFirstIso = toIsoDate(twentyFirst);
  const daysUntil21 = daysBetween(today, twentyFirst);
  const base = {
    twentyFirstBirthday: twentyFirstIso,
    daysUntil21,
    ageToday: ageBetween(dob, today),
    checks: relationshipChecks(input, dob),
    errors: [] as string[],
  };
  const relationshipProblem = base.checks.some((c) => c.state === "problem");
  // An adoption between 16 and 18 counts only under the birth-sibling exception, which this
  // checker cannot confirm, so it must never read as "Good news".
  const relationshipReview = base.checks.some((c) => c.id === "adoption_sibling_only");
  // Born on 29 February and the 21st birthday falls in a year without one: the deadline uses
  // 28 February (never late), but whether the child is still under 21 on that exact day is not
  // settled, so that one day is a lawyer question, not a firm "aged out".
  const leapDayGap =
    dob.getUTCMonth() === 1 && dob.getUTCDate() === 29 && twentyFirst.getUTCDate() === 28;
  const leapDayEdge = (d: Date) => leapDayGap && d.getTime() === twentyFirst.getTime();

  // Marriage ends "child" status; the age freeze does not change that.
  if (input.maritalStatus === "married") {
    return {
      ...base,
      status: "not_a_child",
      headline: "A married son or daughter cannot apply as a child",
      body: "To apply as a child (IR-2 or CR-2), the child must be unmarried. A married son or daughter of a U.S. citizen can still be sponsored, but in a different category (F3) that has a long waiting time.",
      freezeDate: null,
      freezeBasis: null,
      cspaAge: null,
      nextSteps: [
        "Talk to an immigration lawyer about the F3 category and how long it takes.",
      ],
      sources: ["categories", "policyManual"],
    };
  }

  if (input.maritalStatus === "previously_married") {
    return {
      ...base,
      status: "needs_review",
      headline: "A child who was married before needs a lawyer's advice",
      body: "The child is not married now, but was married before. Whether this affects the case depends on details this checker cannot judge.",
      freezeDate: null,
      freezeBasis: null,
      cspaAge: null,
      nextSteps: ["Talk to an immigration lawyer before you file."],
      sources: ["policyManual", "children"],
    };
  }

  // ─ I-130 not filed yet ─
  if (!input.i130Filed) {
    if (leapDayEdge(today)) {
      return {
        ...base,
        status: "needs_review",
        headline: "Today may be the last day to file",
        body: `Your child was born on 29 February. This year has no 29 February, and the rules do not clearly say whether the 21st birthday is 28 February or 1 March. If USCIS receives the I-130 today, the child may still count as under 21.`,
        freezeDate: null,
        freezeBasis: null,
        cspaAge: null,
        nextSteps: [
          "Talk to an immigration lawyer today, before the end of the day.",
          "The filing date is the day USCIS receives the I-130. It is shown as the Received Date on the receipt notice (I-797C).",
        ],
        sources: ["cspa", "policyManual"],
      };
    }
    if (daysUntil21 <= 0) {
      return {
        ...base,
        status: "aged_out",
        headline: "Your child is already 21",
        body: `Your child turned 21 on ${formatDate(twentyFirstIso)}. The age is only locked if the I-130 is filed before age 21, so it can no longer be filed as a child. An unmarried son or daughter aged 21 or older can still be sponsored, but in a different category (F1) that has a long waiting time.`,
        freezeDate: null,
        freezeBasis: null,
        cspaAge: null,
        nextSteps: ["Talk to an immigration lawyer about the F1 category before you file."],
        sources: ["cspa", "categories"],
      };
    }
    const urgent = daysUntil21 <= FILE_SOON_DAYS;
    return {
      ...base,
      status: relationshipProblem || relationshipReview ? "needs_review" : urgent ? "file_soon" : "not_filed",
      headline: relationshipProblem
        ? "There is a problem with the relationship, see below"
        : relationshipReview
          ? "The adoption needs a lawyer's advice, see below"
          : urgent
          ? `File the I-130 before ${formatDate(twentyFirstIso)}`
          : `File the I-130 any time before ${formatDate(twentyFirstIso)}`,
      body: `Your child turns 21 on ${formatDate(twentyFirstIso)}, in ${daysUntil21} day${daysUntil21 === 1 ? "" : "s"}. If the U.S. citizen parent files the I-130 before that date, and the child is not married, the child's age is locked on the filing date. The child can then turn 21 later and still apply as a child.`,
      freezeDate: null,
      freezeBasis: null,
      cspaAge: null,
      nextSteps: [
        urgent
          ? "This is urgent. File well before the 21st birthday, in case of mail or upload delays."
          : "There is no benefit in waiting. Filing early is safer.",
        "The filing date is the day USCIS receives the I-130. It is shown as the Received Date on the receipt notice (I-797C).",
        "The child must stay unmarried until they move to the U.S.",
      ],
      sources: ["cspa", "policyManual"],
    };
  }

  // ─ I-130 filed ─
  const filed = parseIsoDate(input.filingDate)!;

  if (input.parentStatusAtFiling === "lpr" && !input.parentNaturalized) {
    return {
      ...base,
      status: "needs_review",
      headline: "This checker is only for children of U.S. citizens",
      body: "When the parent has a green card (not citizenship), the child is in a different category (F2A) where the age is worked out another way. If the parent becomes a U.S. citizen before the child turns 21, come back and enter that date.",
      freezeDate: null,
      freezeBasis: null,
      cspaAge: null,
      nextSteps: [
        "See the USCIS CSPA page below, or talk to an immigration lawyer.",
      ],
      sources: ["cspa"],
    };
  }

  const naturalized = input.parentStatusAtFiling === "lpr" && input.parentNaturalized;
  const freeze = naturalized ? parseIsoDate(input.naturalizationDate)! : filed;
  const freezeIso = toIsoDate(freeze);
  const cspaAge = ageBetween(dob, freeze);
  const under21 = freeze < twentyFirst;
  const freezeBasis = naturalized ? "naturalization" : "i130_filing";
  const freezeLabel = naturalized ? "the day the parent became a U.S. citizen" : "the day the I-130 was filed";

  if (!under21 && !naturalized && leapDayEdge(freeze)) {
    return {
      ...base,
      status: "needs_review",
      headline: "Filed on 28 February: talk to a lawyer",
      body: `Your child was born on 29 February, and the I-130 was filed on ${formatDate(freezeIso)}. That year has no 29 February, and the rules do not clearly say whether the 21st birthday is 28 February or 1 March. So it is not clear if the child was still under 21 on the filing date.`,
      freezeDate: freezeIso,
      freezeBasis,
      cspaAge: null,
      nextSteps: [
        "Talk to an immigration lawyer about whether the age was locked.",
        "Keep the I-130 receipt notice (I-797C) safe. Its Received Date proves the filing date.",
      ],
      sources: ["cspa", "policyManual"],
    };
  }

  if (!under21) {
    return {
      ...base,
      status: naturalized ? "needs_review" : "aged_out",
      headline: naturalized
        ? "The child was already 21 when the parent became a citizen"
        : "The I-130 was filed after the child turned 21",
      body: naturalized
        ? `When the parent became a U.S. citizen (${formatDate(freezeIso)}), the child was ${formatAge(cspaAge)} old. So the child cannot move to the IR-2 category. Which category applies now depends on the full case history.`
        : `On the filing date (${formatDate(freezeIso)}) the child was ${formatAge(cspaAge)} old. The age is only locked if the I-130 is filed before age 21. An unmarried son or daughter aged 21 or older falls in a different category (F1) with a long waiting time.`,
      freezeDate: freezeIso,
      freezeBasis,
      cspaAge,
      nextSteps: ["Talk to an immigration lawyer about the options."],
      sources: naturalized ? ["cspa", "policyManual"] : ["cspa", "categories"],
    };
  }

  return {
    ...base,
    status: relationshipProblem || relationshipReview ? "needs_review" : "protected",
    headline: relationshipProblem
      ? "The age is locked, but there is a problem with the relationship, see below"
      : relationshipReview
        ? "The age is locked, but the adoption needs a lawyer's advice, see below"
        : `Good news: your child's age is locked at ${cspaAge.years}`,
    body: `The age was locked on ${freezeLabel} (${formatDate(freezeIso)}), when your child was ${formatAge(cspaAge)} old. Your child can turn 21 after this date and still apply as a child.`,
    freezeDate: freezeIso,
    freezeBasis,
    cspaAge,
    nextSteps: [
      "The child must stay unmarried until they move to the U.S. Getting married ends this protection.",
      "Keep the I-130 receipt notice (I-797C) safe. Its Received Date proves the filing date.",
      ...(naturalized ? ["Keep a copy of the parent's naturalization certificate with the case papers."] : []),
    ],
    sources: ["cspa", "policyManual"],
  };
}
