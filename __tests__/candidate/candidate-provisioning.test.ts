/**
 * Post-payment journey provisioning tests (provisionCandidateJourneysAndVaults).
 * Risk (docs/ir2-implementation-plan.md, blocker B2): provisioning picked `ir-5.json` for IR-5
 * and `ir-1.json` for EVERYTHING else, so a paid IR-2 journey was seeded with IR-1 spouse
 * steps. An empty roster also got a "Spouse" candidate-1 for an IR-2 purchase.
 *
 * Category slots: an IR-2 purchase on an IR-5 account must never touch the IR-5 candidates
 * (it used to stamp the IR-2 tier onto IR-5 candidate-1) and every vault is created with
 * the purchased category (it used to be hardcoded "IR-5").
 */

import { createFakeSupabase, type Row } from "./fakeSupabase";

const mockCreateJourneyFromConfig = jest.fn();
jest.mock("@/lib/journey/service", () => ({
  journeyService: {
    createJourneyFromConfig: (...a: any[]) => mockCreateJourneyFromConfig(...a),
  },
}));

const mockSaveVaultConfig = jest.fn().mockResolvedValue(undefined);
jest.mock("@/lib/document-vault/storage-database", () => ({
  DocumentDatabaseStorage: jest.fn().mockImplementation(() => ({
    getVaultConfig: jest.fn().mockResolvedValue(null),
    saveVaultConfig: (...a: any[]) => mockSaveVaultConfig(...a),
  })),
}));

import { provisionCandidateJourneysAndVaults } from "@/lib/candidate/candidateProvisioningService";

const USER = "u1";

function setup(journeys: Row[] = [], roster: any[] = [], extraProfile: Row = {}) {
  const tables: Record<string, Row[]> = {
    journeys: journeys.map((j) => ({ user_id: USER, stripe_subscription_id: null, ...j })),
    user_profiles: [{ id: USER, profile_details: { candidates: roster, ...extraProfile } }],
    visa_forms_draft: [],
  };
  const supabase = createFakeSupabase(tables);
  mockCreateJourneyFromConfig.mockImplementation(async (_path: string, opts: any) => {
    const row = {
      id: `seeded-${opts.journey_type}`,
      user_id: USER,
      journey_type: opts.journey_type,
      subscription_tier: "free",
    };
    tables.journeys.push(row);
    return { journey: { id: row.id } };
  });
  return { supabase: supabase as any, tables };
}

function seeded(): Array<{ path: string; journeyType: string }> {
  return mockCreateJourneyFromConfig.mock.calls.map((c) => ({
    path: c[0],
    journeyType: c[1]?.journey_type,
  }));
}

function savedRoster(tables: Record<string, Row[]>): any[] {
  return tables.user_profiles[0].profile_details.candidates;
}

function row(tables: Record<string, Row[]>, journeyType: string): Row | undefined {
  return tables.journeys.find((j) => j.journey_type === journeyType);
}

beforeEach(() => {
  mockCreateJourneyFromConfig.mockReset();
  mockSaveVaultConfig.mockClear();
});

describe("provisioning seeds IR-2 from the IR-2 config", () => {
  it("first IR-2 purchase seeds the primary journey from ir-2.json, never ir-1.json", async () => {
    const { supabase } = setup();
    const res = await provisionCandidateJourneysAndVaults({
      supabase,
      userId: USER,
      visaCategory: "IR-2 / CR-2",
      candidateCount: 1,
      tier: "premium",
      stripeSubscriptionId: "sub_ir2",
    });
    expect(res.success).toBe(true);
    expect(seeded()).toEqual([{ path: "data/visa-category/ir-2.json", journeyType: "ir2" }]);
  });

  it("an empty roster gets a Child candidate-1 for IR-2, not a Spouse", async () => {
    const { supabase, tables } = setup();
    await provisionCandidateJourneysAndVaults({
      supabase,
      userId: USER,
      visaCategory: "IR-2 / CR-2",
      candidateCount: 1,
      tier: "premium",
    });
    const c1 = savedRoster(tables).find((c) => c.id === "candidate-1");
    expect(c1).toMatchObject({ relation: "Child", visaCategory: "IR-2", categorySlot: 1 });
  });

  it("adding a second child seeds ir2_candidate2 from ir-2.json", async () => {
    const { supabase, tables } = setup(
      [{ id: "j-ir2", journey_type: "ir2", subscription_tier: "premium" }],
      [{ id: "candidate-1", relation: "Child", visaCategory: "IR-2", tier: "premium" }]
    );
    await provisionCandidateJourneysAndVaults({
      supabase,
      userId: USER,
      visaCategory: "IR-2 / CR-2",
      candidateCount: 1,
      tier: "basic",
      isAddCandidate: true,
    });
    expect(seeded()).toEqual([
      { path: "data/visa-category/ir-2.json", journeyType: "ir2_candidate2" },
    ]);
    const c2 = savedRoster(tables).find((c) => c.id === "candidate-2");
    expect(c2).toMatchObject({ relation: "Child", visaCategory: "IR-2", tier: "basic", categorySlot: 2 });
  });

  it("a CR-2 purchase reuses the IR-2 journey and config (decision 1)", async () => {
    const { supabase } = setup();
    await provisionCandidateJourneysAndVaults({
      supabase,
      userId: USER,
      visaCategory: "CR-2",
      candidateCount: 1,
      tier: "basic",
    });
    expect(seeded()).toEqual([{ path: "data/visa-category/ir-2.json", journeyType: "ir2" }]);
  });
});

describe("provisioning regression: IR-1 and IR-5 unchanged", () => {
  it("IR-1 seeds from ir-1.json with a Spouse candidate-1", async () => {
    const { supabase, tables } = setup();
    await provisionCandidateJourneysAndVaults({
      supabase,
      userId: USER,
      visaCategory: "IR-1 / CR-1",
      candidateCount: 1,
      tier: "premium",
    });
    expect(seeded()).toEqual([{ path: "data/visa-category/ir-1.json", journeyType: "ir1" }]);
    expect(savedRoster(tables).find((c) => c.id === "candidate-1")).toMatchObject({
      relation: "Spouse",
      colorTag: "emerald",
    });
  });

  it("IR-5 seeds from ir-5.json with an Other candidate-1", async () => {
    const { supabase, tables } = setup();
    await provisionCandidateJourneysAndVaults({
      supabase,
      userId: USER,
      visaCategory: "IR-5",
      candidateCount: 1,
      tier: "premium",
    });
    expect(seeded()).toEqual([{ path: "data/visa-category/ir-5.json", journeyType: "ir5" }]);
    expect(savedRoster(tables).find((c) => c.id === "candidate-1")).toMatchObject({
      relation: "Other",
      colorTag: "purple",
    });
  });

  it("IR-5 add-candidate seeds ir5_candidate2 from ir-5.json", async () => {
    const { supabase } = setup(
      [{ id: "j-ir5", journey_type: "ir5", subscription_tier: "premium" }],
      [{ id: "candidate-1", relation: "Mother", visaCategory: "IR-5", tier: "premium" }]
    );
    await provisionCandidateJourneysAndVaults({
      supabase,
      userId: USER,
      visaCategory: "IR-5",
      candidateCount: 1,
      tier: "basic",
      isAddCandidate: true,
    });
    expect(seeded()).toEqual([
      { path: "data/visa-category/ir-5.json", journeyType: "ir5_candidate2" },
    ]);
  });

  it("an existing primary journey is re-tiered, not re-seeded", async () => {
    const { supabase, tables } = setup([
      { id: "j-ir1", journey_type: "ir1", subscription_tier: "basic" },
    ]);
    await provisionCandidateJourneysAndVaults({
      supabase,
      userId: USER,
      visaCategory: "IR-1 / CR-1",
      candidateCount: 1,
      tier: "premium",
      isUpgrade: true,
    });
    expect(seeded()).toEqual([]);
    expect(row(tables, "ir1")?.subscription_tier).toBe("premium");
  });

  it("an IR-5 purchase covering two parents keeps the legacy keys ir5 / ir5_candidate2", async () => {
    const { supabase, tables } = setup();
    await provisionCandidateJourneysAndVaults({
      supabase,
      userId: USER,
      visaCategory: "IR-5",
      candidateCount: 2,
      tier: "premium",
    });
    expect(seeded().map((s) => s.journeyType)).toEqual(["ir5", "ir5_candidate2"]);
    expect(savedRoster(tables).map((c) => [c.id, c.categorySlot, c.tier])).toEqual([
      ["candidate-1", 1, "premium"],
      ["candidate-2", 2, "premium"],
    ]);
  });
});

describe("category isolation (IR-2 bought on an IR-5 account)", () => {
  const ir5Roster = [
    { id: "candidate-1", relation: "Mother", visaCategory: "IR-5", tier: "premium", isPrimary: true },
    { id: "candidate-2", relation: "Father", visaCategory: "IR-5", tier: "basic", isPrimary: false },
  ];
  const ir5Rows = [
    { id: "j-ir5", journey_type: "ir5", subscription_tier: "premium", stripe_subscription_id: "sub_ir5" },
    { id: "j-ir5c2", journey_type: "ir5_candidate2", subscription_tier: "basic", stripe_subscription_id: "sub_ir5c2" },
  ];

  it("leaves the IR-5 parents and their rows untouched and adds IR-2 candidate-3 on slot 1", async () => {
    const { supabase, tables } = setup(ir5Rows, ir5Roster);
    await provisionCandidateJourneysAndVaults({
      supabase,
      userId: USER,
      visaCategory: "IR-2 / CR-2",
      candidateCount: 1,
      tier: "executive",
      stripeSubscriptionId: "sub_ir2",
    });

    const roster = savedRoster(tables);
    expect(roster.find((c) => c.id === "candidate-1")).toMatchObject({ tier: "premium", visaCategory: "IR-5" });
    expect(roster.find((c) => c.id === "candidate-2")).toMatchObject({ tier: "basic", visaCategory: "IR-5" });
    expect(roster.find((c) => c.id === "candidate-3")).toMatchObject({
      visaCategory: "IR-2",
      relation: "Child",
      categorySlot: 1,
      tier: "executive",
      isPrimary: false,
    });

    expect(row(tables, "ir5")).toMatchObject({ subscription_tier: "premium", stripe_subscription_id: "sub_ir5" });
    expect(row(tables, "ir5_candidate2")).toMatchObject({ subscription_tier: "basic" });
    expect(row(tables, "ir2")).toMatchObject({ subscription_tier: "executive", stripe_subscription_id: "sub_ir2" });
    expect(row(tables, "ir2_candidate3")).toBeUndefined();
  });

  it("creates every vault with the purchased category, never IR-5", async () => {
    const { supabase } = setup(
      [{ id: "j-ir2", journey_type: "ir2", subscription_tier: "premium" }],
      [...ir5Roster, { id: "candidate-3", relation: "Child", visaCategory: "IR-2", tier: "premium", categorySlot: 1 }]
    );
    await provisionCandidateJourneysAndVaults({
      supabase,
      userId: USER,
      visaCategory: "IR-2",
      candidateCount: 1,
      tier: "basic",
      isAddCandidate: true,
    });
    const categories = mockSaveVaultConfig.mock.calls.map((c) => c[0].visaCategory);
    expect(categories.length).toBeGreaterThan(0);
    expect(categories.every((c) => c === "IR-2")).toBe(true);
    expect(seeded()).toEqual([{ path: "data/visa-category/ir-2.json", journeyType: "ir2_candidate2" }]);
  });

  it("an IR-2 target candidate id of another category is ignored (stamps the IR-2 base)", async () => {
    const { supabase, tables } = setup(
      [...ir5Rows, { id: "j-ir2", journey_type: "ir2", subscription_tier: "free" }],
      [...ir5Roster, { id: "candidate-3", relation: "Child", visaCategory: "IR-2", tier: "free", categorySlot: 1 }]
    );
    await provisionCandidateJourneysAndVaults({
      supabase,
      userId: USER,
      visaCategory: "IR-2",
      candidateCount: 1,
      tier: "premium",
      targetCandidateId: "candidate-2",
    });
    expect(row(tables, "ir2")?.subscription_tier).toBe("premium");
    expect(row(tables, "ir5_candidate2")?.subscription_tier).toBe("basic");
    expect(savedRoster(tables).find((c) => c.id === "candidate-2")?.tier).toBe("basic");
  });

  it("never reissues a deleted id (high-water mark)", async () => {
    const { supabase, tables } = setup(
      [{ id: "j-ir5", journey_type: "ir5", subscription_tier: "premium" }],
      [{ id: "candidate-1", relation: "Mother", visaCategory: "IR-5", tier: "premium" }],
      { candidateIdHighWater: 4 }
    );
    await provisionCandidateJourneysAndVaults({
      supabase,
      userId: USER,
      visaCategory: "IR-5",
      candidateCount: 1,
      tier: "basic",
      isAddCandidate: true,
    });
    const added = savedRoster(tables).find((c) => c.id !== "candidate-1");
    expect(added).toMatchObject({ id: "candidate-5", categorySlot: 2 });
    expect(tables.user_profiles[0].profile_details.candidateIdHighWater).toBe(5);
  });
});
