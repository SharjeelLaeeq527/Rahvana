import { canCheckUscisForJourney } from "@/lib/uscis/journeyStatusAccess";
import { resolveOwnedJourney } from "@/lib/journey/resolveOwnedJourney";

jest.mock("@/lib/journey/resolveOwnedJourney", () => ({ resolveOwnedJourney: jest.fn() }));
const resolve = resolveOwnedJourney as jest.MockedFunction<typeof resolveOwnedJourney>;

/** Minimal Supabase stub: user_profiles.select().eq().maybeSingle() -> profile_details. */
function supabaseWith(addons: unknown) {
  const chain = {
    select: () => chain,
    eq: () => chain,
    maybeSingle: async () => ({ data: { profile_details: { purchased_addons: addons } }, error: null }),
  };
  return { from: () => chain } as never;
}

const J = "6f1c2c1e-1111-4a4a-9a9a-123456789abc";

describe("live USCIS status follows the journey's plan", () => {
  beforeEach(() => resolve.mockReset());

  it("allows Premium and Executive journeys", async () => {
    resolve.mockResolvedValue({ id: J, journey_type: "ir1", subscription_tier: "premium", status: "active" } as never);
    expect(await canCheckUscisForJourney(supabaseWith([]), "u1", J)).toBe(true);
    resolve.mockResolvedValue({ id: J, journey_type: "ir1", subscription_tier: "executive", status: "active" } as never);
    expect(await canCheckUscisForJourney(supabaseWith([]), "u1", J)).toBe(true);
  });

  it("refuses Free and Basic journeys", async () => {
    resolve.mockResolvedValue({ id: J, journey_type: "ir1", subscription_tier: "free", status: "active" } as never);
    expect(await canCheckUscisForJourney(supabaseWith([]), "u1", J)).toBe(false);
    resolve.mockResolvedValue({ id: J, journey_type: "ir1", subscription_tier: "basic", status: "active" } as never);
    expect(await canCheckUscisForJourney(supabaseWith([]), "u1", J)).toBe(false);
  });

  it("fails closed for a journey the user does not own", async () => {
    resolve.mockResolvedValue(null);
    expect(await canCheckUscisForJourney(supabaseWith([]), "u1", J)).toBe(false);
  });
});
