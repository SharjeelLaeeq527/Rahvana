import { NextRequest } from "next/server";
import { checkRateLimit } from "@/lib/security/rate-limit";

function req(ip: string) {
  return new NextRequest("http://localhost:3000/api/auth/signup", {
    method: "POST",
    headers: { "x-forwarded-for": ip },
  });
}

describe("checkRateLimit", () => {
  it("allows the first N attempts then blocks", () => {
    const ip = `203.0.113.${Math.floor(Math.random() * 200) + 1}`;
    const action = `test-signup-${Date.now()}`;
    const opts = { maxAttempts: 3, windowMs: 60_000 };

    expect(checkRateLimit(req(ip), action, opts).allowed).toBe(true);
    expect(checkRateLimit(req(ip), action, opts).allowed).toBe(true);
    expect(checkRateLimit(req(ip), action, opts).allowed).toBe(true);

    const blocked = checkRateLimit(req(ip), action, opts);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("does not share buckets across IPs", () => {
    const action = `test-ip-${Date.now()}`;
    const opts = { maxAttempts: 1, windowMs: 60_000 };
    expect(checkRateLimit(req("198.51.100.1"), action, opts).allowed).toBe(true);
    expect(checkRateLimit(req("198.51.100.2"), action, opts).allowed).toBe(true);
  });
});
