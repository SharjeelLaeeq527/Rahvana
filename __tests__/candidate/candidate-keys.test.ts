/**
 * Category slots (lib/candidate/candidateKeys.ts) and journey-page alignment
 * (lib/candidate/journeyCandidateResolution.ts).
 *
 * Risk: candidate ids were `length + 1` across ALL categories, so an IR-2 child added
 * after two IR-5 parents became candidate-3 on journey `ir2_candidate3` (its plan and
 * vault then landed on the wrong rows), and ids were reused after a delete.
 */

import type { CandidateProfile } from "@/types/candidate";
import {
  candidateIdForJourneyKey,
  canonicalJourneyKey,
  findCandidateForJourneyKey,
  formatCandidateLabel,
  getCandidateSlot,
  getJourneyKeyForCandidate,
  isCategoryPrimary,
  journeyKeyForSlot,
  nextCandidateId,
  nextCategorySlot,
  parseJourneyKey,
  resolveCandidateJourneyKey,
  slotPool,
} from "@/lib/candidate/candidateKeys";
import { createNewCandidate } from "@/lib/candidate/candidateSyncService";
import { resolveJourneyCandidate } from "@/lib/candidate/journeyCandidateResolution";

function cand(id: string, visaCategory: string, extra: Partial<CandidateProfile> = {}): CandidateProfile {
  return {
    id,
    label: "",
    relation: "Other",
    fullName: "",
    visaCategory,
    tier: "free",
    isPrimary: id === "candidate-1",
    createdAt: "2026-01-01",
    ...extra,
  };
}

describe("pools and journey keys", () => {
  it("groups IR-2 with CR-2 and IR-1 with CR-1; IR-5 and others stand alone", () => {
    expect(slotPool("CR-2")).toBe("IR-2");
    expect(slotPool("IR-2 / CR-2")).toBe("IR-2");
    expect(slotPool("CR-1")).toBe("IR-1");
    expect(slotPool("IR-5")).toBe("IR-5");
    expect(slotPool("F-1")).not.toBe(slotPool("IR-1"));
  });

  it("slot 1 owns the base key, slot N the suffixed key; CR-2 maps to the IR-2 journey", () => {
    expect(journeyKeyForSlot("IR-5", 1)).toBe("ir5");
    expect(journeyKeyForSlot("IR-5", 2)).toBe("ir5_candidate2");
    expect(journeyKeyForSlot("CR-2", 1)).toBe("ir2");
    expect(journeyKeyForSlot("CR-2", 3)).toBe("ir2_candidate3");
    expect(journeyKeyForSlot("IR-2", 12)).toBe("ir2_candidate12");
  });

  it("parses every stored key variant to one canonical key", () => {
    expect(canonicalJourneyKey("IR5")).toBe("ir5");
    expect(canonicalJourneyKey("ir5-journey")).toBe("ir5");
    expect(canonicalJourneyKey("ir5_candidate-1")).toBe("ir5");
    expect(canonicalJourneyKey("ir5_candidate-2")).toBe("ir5_candidate2");
    expect(canonicalJourneyKey("IR5_candidate10")).toBe("ir5_candidate10");
    expect(parseJourneyKey("cr2_candidate2")).toMatchObject({ base: "IR-2", slot: 2 });
  });

  it("a legacy candidate (no slot) keeps the key its id gave it", () => {
    const legacy = cand("candidate-3", "IR-2");
    expect(getCandidateSlot(legacy)).toBe(3);
    expect(getJourneyKeyForCandidate(legacy)).toBe("ir2_candidate3");
  });

  it("a slotted candidate keys on its slot, whatever its id", () => {
    const child = cand("candidate-3", "IR-2", { categorySlot: 1 });
    expect(getJourneyKeyForCandidate(child)).toBe("ir2");
    expect(isCategoryPrimary(child)).toBe(true);
  });
});

describe("the required numbering example", () => {
  it("IR-5 x2 then IR-2 x2 -> ids 1..4, slots 1,2,1,2, keys ir5, ir5_candidate2, ir2, ir2_candidate2", () => {
    let roster: CandidateProfile[] = [];
    const add = (relation: CandidateProfile["relation"]) => {
      const c = createNewCandidate(roster, { relation });
      roster = [...roster, c];
      return c;
    };
    const p1 = add("Mother");
    const p2 = add("Father");
    const k1 = add("Child");
    const k2 = add("Child");

    expect([p1, p2, k1, k2].map((c) => c.id)).toEqual([
      "candidate-1",
      "candidate-2",
      "candidate-3",
      "candidate-4",
    ]);
    expect([p1, p2, k1, k2].map((c) => c.categorySlot)).toEqual([1, 2, 1, 2]);
    expect([p1, p2, k1, k2].map(getJourneyKeyForCandidate)).toEqual([
      "ir5",
      "ir5_candidate2",
      "ir2",
      "ir2_candidate2",
    ]);
    expect(k1.label).toBe("Candidate 1");
    expect(formatCandidateLabel(k1, roster)).toBe("IR-2 Candidate 1");
    expect(formatCandidateLabel(p2, roster)).toBe("IR-5 Candidate 2");
  });

  it("a CR-2 child shares the IR-2 numbering", () => {
    const roster = [cand("candidate-1", "IR-2", { categorySlot: 1 })];
    const cr2 = createNewCandidate(roster, { relation: "Child", visaCategory: "CR-2" });
    expect(cr2.categorySlot).toBe(2);
    expect(getJourneyKeyForCandidate(cr2)).toBe("ir2_candidate2");
  });
});

describe("ids are never reused", () => {
  it("is one above the highest id, not length + 1", () => {
    expect(nextCandidateId([cand("candidate-1", "IR-5"), cand("candidate-3", "IR-5")])).toBe(
      "candidate-4"
    );
  });

  it("honours the high-water mark after the highest id was deleted", () => {
    expect(nextCandidateId([cand("candidate-1", "IR-5")], 3)).toBe("candidate-4");
  });

  it("a deleted candidate's id is not handed to the next one", () => {
    const roster = [cand("candidate-1", "IR-5"), cand("candidate-2", "IR-5")];
    const next = createNewCandidate(roster, { relation: "Father", highWater: 3 });
    expect(next.id).toBe("candidate-4");
  });
});

describe("slot reuse needs every leftover to be gone", () => {
  const roster = [cand("candidate-1", "IR-5"), cand("candidate-3", "IR-5")];

  it("reuses the lowest free slot when nothing is left behind", () => {
    expect(nextCategorySlot(roster, "IR-5")).toBe(2);
  });

  it.each([
    ["a journey row / draft / tier entry / customization", "ir5_candidate2"],
  ])("skips the slot while %s still exists", (_label, key) => {
    expect(nextCategorySlot(roster, "IR-5", new Set([key]))).toBe(4);
  });

  it("slot 1 is blocked by a leftover base journey", () => {
    expect(nextCategorySlot([], "IR-2", new Set(["ir2"]))).toBe(2);
  });

  it("never renumbers existing candidates", () => {
    const before = roster.map(getJourneyKeyForCandidate);
    createNewCandidate(roster, { relation: "Mother" });
    expect(roster.map(getJourneyKeyForCandidate)).toEqual(before);
  });
});

describe("journey key -> candidate", () => {
  const roster = [
    cand("candidate-1", "IR-5"),
    cand("candidate-2", "IR-5"),
    cand("candidate-3", "IR-2", { categorySlot: 1, relation: "Child" }),
    cand("candidate-4", "CR-2", { categorySlot: 2, relation: "Child" }),
  ];

  it("finds the owner by category slot", () => {
    expect(findCandidateForJourneyKey(roster, "ir2")?.id).toBe("candidate-3");
    expect(findCandidateForJourneyKey(roster, "ir2_candidate2")?.id).toBe("candidate-4");
    expect(findCandidateForJourneyKey(roster, "ir5_candidate2")?.id).toBe("candidate-2");
    expect(findCandidateForJourneyKey(roster, "ir2_candidate3")).toBeNull();
  });

  it("a candidate of another pool resolves to the category's slot-1 key", () => {
    expect(resolveCandidateJourneyKey(roster, "IR-5", "candidate-3")).toBe("ir5");
    expect(resolveCandidateJourneyKey(roster, "IR-2", "candidate-2")).toBe("ir2");
    expect(resolveCandidateJourneyKey(roster, "IR-2", "candidate-4")).toBe("ir2_candidate2");
    expect(resolveCandidateJourneyKey(roster, "IR-5", "candidate-99")).toBe("ir5");
  });

  it("tags rows with the owner id, else the pre-slot id", () => {
    expect(candidateIdForJourneyKey(roster, "ir2")).toBe("candidate-3");
    expect(candidateIdForJourneyKey([], "ir5_candidate2")).toBe("candidate-2");
    expect(candidateIdForJourneyKey([], "ir5")).toBe("candidate-1");
  });
});

describe("IR-5-only accounts are unchanged (snapshot)", () => {
  // Gap [1, 3] after candidate-2 was deleted: keys and labels stay exactly as before.
  const roster = [
    cand("candidate-1", "IR-5", { label: "Candidate 1" }),
    cand("candidate-3", "IR-5", { label: "Candidate 3" }),
  ];

  it("keeps keys, gaps and labels", () => {
    expect(roster.map(getJourneyKeyForCandidate)).toEqual(["ir5", "ir5_candidate3"]);
    expect(roster.map((c) => formatCandidateLabel(c, roster))).toEqual([
      "Candidate 1",
      "Candidate 3",
    ]);
  });

  it("a new parent takes the lowest free slot only when nothing is left on it", () => {
    const blocked = new Set(["ir5_candidate2"]);
    const next = createNewCandidate(roster, { relation: "Father", highWater: 3, blockedKeys: blocked });
    expect(next).toMatchObject({ id: "candidate-4", categorySlot: 4 });
  });
});

describe("journey page alignment (resolveJourneyCandidate)", () => {
  const roster = [
    cand("candidate-1", "IR-5"),
    cand("candidate-2", "IR-5"),
    cand("candidate-3", "IR-2", { categorySlot: 1 }),
    cand("candidate-4", "IR-2", { categorySlot: 2 }),
  ];

  it("direct URL with a candidate of the category selects it", () => {
    expect(
      resolveJourneyCandidate({ category: "ir-2", roster, urlCandidateId: "candidate-4" })?.id
    ).toBe("candidate-4");
  });

  it("a URL candidate of another category is ignored", () => {
    expect(
      resolveJourneyCandidate({
        category: "ir-2",
        roster,
        urlCandidateId: "candidate-2",
        activeCandidateId: "candidate-2",
      })?.id
    ).toBe("candidate-3");
  });

  it("back/forward to a category returns to the candidate last used there", () => {
    expect(
      resolveJourneyCandidate({
        category: "ir-5",
        roster,
        activeCandidateId: "candidate-4",
        lastUsedByPool: { "IR-5": "candidate-2", "IR-2": "candidate-4" },
      })?.id
    ).toBe("candidate-2");
  });

  it("falls back to the category's slot-1 candidate", () => {
    expect(
      resolveJourneyCandidate({ category: "ir-2", roster, activeCandidateId: "candidate-1" })?.id
    ).toBe("candidate-3");
  });

  it("an empty category resolves to no candidate (load the base journey, create nothing)", () => {
    expect(resolveJourneyCandidate({ category: "ir-1", roster, activeCandidateId: "candidate-1" })).toBeNull();
  });
});
