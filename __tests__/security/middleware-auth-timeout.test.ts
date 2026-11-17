/**
 * The middleware must never hang on Supabase Auth (Vercel answers a slow
 * middleware with 504 MIDDLEWARE_INVOCATION_TIMEOUT). getUserWithTimeout caps
 * the call and tells "Auth is down" apart from "signed out".
 */
import { AuthRetryableFetchError, AuthApiError } from "@supabase/supabase-js";
import { getUserWithTimeout } from "@/lib/supabase/middleware";

type Client = Parameters<typeof getUserWithTimeout>[0];

function clientWith(getUser: () => Promise<unknown>): Client {
  return { auth: { getUser } } as unknown as Client;
}

describe("getUserWithTimeout", () => {
  afterEach(() => jest.useRealTimers());

  it("returns the user when Auth answers", async () => {
    const user = { id: "u1", email: "a@b.c" };
    const result = await getUserWithTimeout(
      clientWith(async () => ({ data: { user }, error: null }))
    );
    expect(result).toEqual({ unavailable: false, user });
  });

  it("treats a normal auth error (no / bad session) as signed out", async () => {
    const result = await getUserWithTimeout(
      clientWith(async () => ({
        data: { user: null },
        error: new AuthApiError("invalid JWT", 401, "bad_jwt"),
      }))
    );
    expect(result).toEqual({ unavailable: false, user: null });
  });

  it("reports unavailable on a network failure instead of signing the user out", async () => {
    const result = await getUserWithTimeout(
      clientWith(async () => ({
        data: { user: null },
        error: new AuthRetryableFetchError("fetch failed", 0),
      }))
    );
    expect(result.unavailable).toBe(true);
  });

  it("reports unavailable on a 5xx from Auth", async () => {
    const result = await getUserWithTimeout(
      clientWith(async () => ({
        data: { user: null },
        error: new AuthApiError("upstream error", 503, "unexpected_failure"),
      }))
    );
    expect(result.unavailable).toBe(true);
  });

  it("reports unavailable when getUser throws", async () => {
    const result = await getUserWithTimeout(
      clientWith(async () => {
        throw new Error("boom");
      })
    );
    expect(result).toEqual({ unavailable: true, reason: "boom" });
  });

  it("gives up after the timeout when Auth never answers", async () => {
    jest.useFakeTimers();
    const pending = getUserWithTimeout(clientWith(() => new Promise(() => {})));
    jest.advanceTimersByTime(5000);
    const result = await pending;
    expect(result.unavailable).toBe(true);
    if (result.unavailable) expect(result.reason).toMatch(/timeout/);
  });
});
