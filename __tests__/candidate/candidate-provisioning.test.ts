/**
 * Post-payment journey provisioning tests (provisionCandidateJourneysAndVaults).
 * Risk (docs/ir2-implementation-plan.md, blocker B2): provisioning picked `ir-5.json` for IR-5
 * and `ir-1.json` for EVERYTHING else, so a paid IR-2 journey was seeded with IR-1 spouse
 * steps (and the background step sync only inserts, never deletes, so the row stays polluted).
 * An empty roster also got a "Spouse" candidate-1 for an IR-2 purchase.
 */

const mockCreateJourneyFromConfig = jest.fn();
jest.mock("@/lib/journey/service", () => ({
  journeyService: {
    createJourneyFromConfig: (...a: any[]) => mockCreateJourneyFromConfig(...a),
  },
}));

jest.mock("@/lib/document-vault/storage-database", () => ({
  DocumentDatabaseStorage: jest.fn().mockImplementation(() => ({
    getVaultConfig: jest.fn().mockResolvedValue(null),
    saveVaultConfig: jest.fn().mockResolvedValue(undefined),
  })),
}));

import { provisionCandidateJourneysAndVaults } from "@/lib/candidate/candidateProvisioningService";

interface FakeDb {
  /** journeys rows keyed by lower-cased journey_type */
  journeys: Record<string, { id: string; subscription_tier: string }>;
  roster: any[];
  profileUpdates: any[];
}

/** Minimal chainable Supabase stand-in: journeys lookups by journey_type + roster read/write. */
function makeSupabase(db: FakeDb): any {
  return {
    from(table: string) {
      const filters: Record<string, string> = {};
      let op: "select" | "update" | "insert" = "select";
      const b: any = {
        select: () => b,
        eq: (k: string, v: string) => {
          filters[k] = v;
          return b;
        },
        ilike: (k: string, v: string) => {
          filters[k] = v;
          return b;
        },
        update: (payload: any) => {
          op = "update";
          if (table === "user_profiles") db.profileUpdates.push(payload);
          return b;
        },
        insert: (payload: any) => {
          op = "insert";
          if (table === "journeys") {
            db.journeys[String(payload.journey_type).toLowerCase()] = {
              id: `raw-${payload.journey_type}`,
              subscription_tier: payload.subscription_tier,
            };
          }
          return b;
        },
        maybeSingle: async () => {
          if (table === "journeys") {
            const key = String(filters.journey_type ?? "").toLowerCase();
            return { data: db.journeys[key] ?? null, error: null };
          }
          if (table === "user_profiles") {
            return { data: { profile_details: { candidates: db.roster } }, error: null };
          }
          return { data: null, error: null };
        },
        single: async () => ({ data: op === "insert" ? { id: "inserted" } : null, error: null }),
        then: (res: any, rej: any) => Promise.resolve({ data: null, error: null }).then(res, rej),
      };
      return b;
    },
  };
}

function freshDb(partial: Partial<FakeDb> = {}): FakeDb {
  return { journeys: {}, roster: [], profileUpdates: [], ...partial };
}

/** Config paths createJourneyFromConfig was asked to seed from, with the journey_type used. */
function seeded(): Array<{ path: string; journeyType: string }> {
  return mockCreateJourneyFromConfig.mock.calls.map((c) => ({
    path: c[0],
    journeyType: c[1]?.journey_type,
  }));
}

function savedRoster(db: FakeDb): any[] {
  const last = db.profileUpdates[db.profileUpdates.length - 1];
  return last?.profile_details?.candidates ?? [];
}

beforeEach(() => {
  mockCreateJourneyFromConfig.mockReset();
  mockCreateJourneyFromConfig.mockImplementation(async (_path: string, opts: any) => ({
    journey: { id: `seeded-${opts.journey_type}` },
  }));
});

describe("provisioning seeds IR-2 from the IR-2 config", () => {
  it("first IR-2 purchase seeds the primary journey from ir-2.json, never ir-1.json", async () => {
    const db = freshDb();
    const res = await provisionCandidateJourneysAndVaults({
      supabase: makeSupabase(db),
      userId: "u1",
      visaCategory: "IR-2 / CR-2",
      candidateCount: 1,
      tier: "premium",
      stripeSubscriptionId: "sub_ir2",
    });
    expect(res.success).toBe(true);
    expect(seeded()).toEqual([{ path: "data/visa-category/ir-2.json", journeyType: "IR2" }]);
  });

  it("an empty roster gets a Child candidate-1 for IR-2, not a Spouse", async () => {
    const db = freshDb();
    await provisionCandidateJourneysAndVaults({
      supabase: makeSupabase(db),
      userId: "u1",
      visaCategory: "IR-2 / CR-2",
      candidateCount: 1,
      tier: "premium",
    });
    const c1 = savedRoster(db).find((c) => c.id === "candidate-1");
    expect(c1).toMatchObject({ relation: "Child", visaCategory: "IR-2" });
  });

  it("adding a second child seeds ir2_candidate2 from ir-2.json", async () => {
    const db = freshDb({
      journeys: { ir2: { id: "j-ir2", subscription_tier: "premium" } },
      roster: [{ id: "candidate-1", relation: "Child", visaCategory: "IR-2", tier: "premium" }],
    });
    await provisionCandidateJourneysAndVaults({
      supabase: makeSupabase(db),
      userId: "u1",
      visaCategory: "IR-2 / CR-2",
      candidateCount: 1,
      tier: "basic",
      isAddCandidate: true,
    });
    expect(seeded()).toEqual([
      { path: "data/visa-category/ir-2.json", journeyType: "ir2_candidate2" },
    ]);
    const c2 = savedRoster(db).find((c) => c.id === "candidate-2");
    expect(c2).toMatchObject({ relation: "Child", visaCategory: "IR-2", tier: "basic" });
  });

  it("a CR-2 purchase reuses the IR-2 journey and config (decision 1)", async () => {
    const db = freshDb();
    await provisionCandidateJourneysAndVaults({
      supabase: makeSupabase(db),
      userId: "u1",
      visaCategory: "CR-2",
      candidateCount: 1,
      tier: "basic",
    });
    expect(seeded()).toEqual([{ path: "data/visa-category/ir-2.json", journeyType: "IR2" }]);
  });
});

describe("provisioning regression: IR-1 and IR-5 unchanged", () => {
  it("IR-1 seeds from ir-1.json with a Spouse candidate-1", async () => {
    const db = freshDb();
    await provisionCandidateJourneysAndVaults({
      supabase: makeSupabase(db),
      userId: "u1",
      visaCategory: "IR-1 / CR-1",
      candidateCount: 1,
      tier: "premium",
    });
    expect(seeded()).toEqual([{ path: "data/visa-category/ir-1.json", journeyType: "IR1" }]);
    expect(savedRoster(db).find((c) => c.id === "candidate-1")).toMatchObject({
      relation: "Spouse",
      colorTag: "emerald",
    });
  });

  it("IR-5 seeds from ir-5.json with an Other candidate-1", async () => {
    const db = freshDb();
    await provisionCandidateJourneysAndVaults({
      supabase: makeSupabase(db),
      userId: "u1",
      visaCategory: "IR-5",
      candidateCount: 1,
      tier: "premium",
    });
    expect(seeded()).toEqual([{ path: "data/visa-category/ir-5.json", journeyType: "IR5" }]);
    expect(savedRoster(db).find((c) => c.id === "candidate-1")).toMatchObject({
      relation: "Other",
      colorTag: "purple",
    });
  });

  it("IR-5 add-candidate seeds ir5_candidate2 from ir-5.json", async () => {
    const db = freshDb({
      journeys: { ir5: { id: "j-ir5", subscription_tier: "premium" } },
      roster: [{ id: "candidate-1", relation: "Mother", visaCategory: "IR-5", tier: "premium" }],
    });
    await provisionCandidateJourneysAndVaults({
      supabase: makeSupabase(db),
      userId: "u1",
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
    const db = freshDb({ journeys: { ir1: { id: "j-ir1", subscription_tier: "basic" } } });
    await provisionCandidateJourneysAndVaults({
      supabase: makeSupabase(db),
      userId: "u1",
      visaCategory: "IR-1 / CR-1",
      candidateCount: 1,
      tier: "premium",
      isUpgrade: true,
    });
    expect(seeded()).toEqual([]);
  });
});
