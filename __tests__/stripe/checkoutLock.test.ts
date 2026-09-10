/**
 * Checkout lock tests.
 * Risk: two concurrent subscription checkouts both proceed (duplicate sub), or a
 * slow request releases a DIFFERENT request's lock. The lock must be per-user
 * mutually exclusive and release only what it owns (token ownership).
 */

describe("checkoutLock — in-memory fallback (no Upstash configured)", () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it("acquire returns ok:true with a token the first time", async () => {
    const { acquireCheckoutLock } = require("@/lib/stripe/checkoutLock");
    const res = await acquireCheckoutLock("user-A");
    expect(res.ok).toBe(true);
    expect(typeof res.token).toBe("string");
    expect(res.token.length).toBeGreaterThan(0);
  });

  it("rejects a second concurrent acquire for the same user", async () => {
    const { acquireCheckoutLock } = require("@/lib/stripe/checkoutLock");
    const first = await acquireCheckoutLock("user-B");
    const second = await acquireCheckoutLock("user-B");
    expect(first.ok).toBe(true);
    expect(second.ok).toBe(false);
    expect(second.token).toBeNull();
  });

  it("allows different users to hold locks simultaneously", async () => {
    const { acquireCheckoutLock } = require("@/lib/stripe/checkoutLock");
    const a = await acquireCheckoutLock("user-C1");
    const b = await acquireCheckoutLock("user-C2");
    expect(a.ok).toBe(true);
    expect(b.ok).toBe(true);
  });

  it("re-acquire works after the owner releases with its token", async () => {
    const { acquireCheckoutLock, releaseCheckoutLock } = require("@/lib/stripe/checkoutLock");
    const first = await acquireCheckoutLock("user-D");
    await releaseCheckoutLock("user-D", first.token);
    const second = await acquireCheckoutLock("user-D");
    expect(second.ok).toBe(true);
  });

  it("release with a WRONG token does NOT free another request's lock", async () => {
    const { acquireCheckoutLock, releaseCheckoutLock } = require("@/lib/stripe/checkoutLock");
    const owner = await acquireCheckoutLock("user-E");
    // A stale request tries to release using a token it never owned.
    await releaseCheckoutLock("user-E", "some-other-token");
    // The owner's lock must still be held → a fresh acquire is rejected.
    const intruder = await acquireCheckoutLock("user-E");
    expect(owner.ok).toBe(true);
    expect(intruder.ok).toBe(false);
  });

  it("release with a null token is a safe no-op (does not free the lock)", async () => {
    const { acquireCheckoutLock, releaseCheckoutLock } = require("@/lib/stripe/checkoutLock");
    await acquireCheckoutLock("user-F");
    await releaseCheckoutLock("user-F", null);
    const again = await acquireCheckoutLock("user-F");
    expect(again.ok).toBe(false);
  });
});

describe("checkoutLock — Upstash configured", () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
    process.env.UPSTASH_REDIS_REST_URL = "https://fake-upstash";
    process.env.UPSTASH_REDIS_REST_TOKEN = "fake-token";
  });

  afterAll(() => {
    process.env = OLD_ENV;
    // @ts-expect-error cleanup test double
    delete global.fetch;
  });

  it("acquires when Redis SET NX returns OK", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ result: "OK" }],
    }) as any;

    const { acquireCheckoutLock } = require("@/lib/stripe/checkoutLock");
    const res = await acquireCheckoutLock("user-U1");
    expect(res.ok).toBe(true);
    expect(typeof res.token).toBe("string");
  });

  it("is rejected when Redis SET NX returns null (key already held)", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ result: null }],
    }) as any;

    const { acquireCheckoutLock } = require("@/lib/stripe/checkoutLock");
    const res = await acquireCheckoutLock("user-U2");
    expect(res.ok).toBe(false);
    expect(res.token).toBeNull();
  });

  it("FAILS OPEN (ok:true, token:null) when Redis errors, so a blip never blocks buying", async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error("network down")) as any;

    const { acquireCheckoutLock } = require("@/lib/stripe/checkoutLock");
    const res = await acquireCheckoutLock("user-U3");
    expect(res.ok).toBe(true);
    expect(res.token).toBeNull(); // nothing was set, so nothing to release
  });

  it("release runs an atomic compare-and-delete (EVAL) with the owner token", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ result: "OK" }],
    });
    global.fetch = fetchMock as any;

    const { acquireCheckoutLock, releaseCheckoutLock } = require("@/lib/stripe/checkoutLock");
    const res = await acquireCheckoutLock("user-U4");
    fetchMock.mockClear();
    await releaseCheckoutLock("user-U4", res.token);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const body = JSON.parse((fetchMock.mock.calls[0][1] as any).body);
    // pipeline body is an array of commands; first command must be an EVAL
    // carrying our token as the ARGV value.
    expect(body[0][0]).toBe("EVAL");
    expect(body[0]).toContain(res.token);
  });

  it("release with null token makes NO Redis call (fail-open acquire owns nothing)", async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, json: async () => [{ result: 0 }] });
    global.fetch = fetchMock as any;

    const { releaseCheckoutLock } = require("@/lib/stripe/checkoutLock");
    await releaseCheckoutLock("user-U5", null);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
