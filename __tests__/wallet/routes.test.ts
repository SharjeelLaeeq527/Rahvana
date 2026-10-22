/**
 * Wallet API routes: /api/wallet, /api/wallet/launch-tool, /api/wallet/transactions.
 * Risk: anonymous access, one user reading another's ledger, body tampering.
 */

import { NextRequest } from "next/server";

const mockUser = jest.fn();
const mockEq = jest.fn();
const mockRange = jest.fn();
const mockIn = jest.fn();
const mockGte = jest.fn();
const mockOr = jest.fn();
const mockRpc = jest.fn();
const mockLaunch = jest.fn();
const mockLoadState = jest.fn();
const mockDeductService = jest.fn()

jest.mock("@/lib/api/authGuards", () => ({
  getAuthenticatedUser: () => mockUser(),
  getServiceRoleClient: () => {
    const chain: Record<string, (...a: unknown[]) => unknown> = {
      select: () => chain,
      eq: (...a: unknown[]) => {
        mockEq(...a);
        return chain;
      },
      in: (...a: unknown[]) => {
        mockIn(...a);
        return chain;
      },
      gte: (...a: unknown[]) => {
        mockGte(...a);
        return chain;
      },
      or: (...a: unknown[]) => {
        mockOr(...a);
        return chain;
      },
      order: () => chain,
      range: (...a: unknown[]) => mockRange(...a),
    };
    return { from: () => chain, rpc: (...a: unknown[]) => mockRpc(...a) };
  },
}));
jest.mock("@/lib/wallet/launch", () => ({ launchResource: (...a: unknown[]) => mockLaunch(...a) }));
jest.mock("@/lib/wallet/state", () => ({
  loadWalletState: (...a: unknown[]) => mockLoadState(...a),
}));

import { GET as getWallet } from "@/app/api/wallet/route";
import { POST as launchTool } from "@/app/api/wallet/launch-tool/route";
import { GET as getTransactions } from "@/app/api/wallet/transactions/route";

const post = (body: string) =>
  new NextRequest("http://localhost/api/wallet/launch-tool", { method: "POST", body });
const txReq = (qs = "") => new NextRequest(`http://localhost/api/wallet/transactions${qs}`);

beforeEach(() => {
  jest.clearAllMocks();
  mockUser.mockResolvedValue({ id: "user-1" });
  // Default: summary RPC unavailable -> route must degrade to summary: null.
  mockRpc.mockResolvedValue({ data: null, error: { message: "missing function" } });
});

describe("auth", () => {
  it("rejects anonymous callers on every route", async () => {
    mockUser.mockResolvedValue(null);
    expect((await getWallet()).status).toBe(401);
    expect((await launchTool(post("{}"))).status).toBe(401);
    expect((await getTransactions(txReq())).status).toBe(401);
    expect(mockLaunch).not.toHaveBeenCalled();
    expect(mockLoadState).not.toHaveBeenCalled();
  });
});

describe("GET /api/wallet", () => {
  it("returns the balance and unlocked resources of the signed-in user", async () => {
    mockLoadState.mockResolvedValue({
      balance: 25,
      unlocked: [{ resourceType: "guide", resourceId: "guide-passport" }],
    });
    const res = await getWallet();
    expect(mockLoadState).toHaveBeenCalledWith(expect.anything(), "user-1");
    expect(await res.json()).toEqual({
      success: true,
      wallet: { balance: 25, currency: "credits" },
      unlockedResources: ["guide-passport"],
      unlocks: [{ resourceType: "guide", resourceId: "guide-passport" }],
    });
  });

  it("returns 500 when the wallet cannot be read", async () => {
    mockLoadState.mockRejectedValue(new Error("db down"));
    expect((await getWallet()).status).toBe(500);
  });
});

describe("POST /api/wallet/launch-tool", () => {
  it("passes only the resource and key for the session user, never a price", async () => {
    mockLaunch.mockResolvedValue({ status: 200, body: { success: true } });
    const res = await launchTool(
      post(
        JSON.stringify({
          resourceType: "tool",
          resourceId: "pdf-toolkit",
          idempotencyKey: "k_12345678",
          credits: 0,
          userId: "victim",
        })
      )
    );
    expect(res.status).toBe(200);
    expect(mockLaunch).toHaveBeenCalledWith(expect.anything(), "user-1", {
      resourceType: "tool",
      resourceId: "pdf-toolkit",
      idempotencyKey: "k_12345678",
    });
  });

  it("forwards the launch status (e.g. 402)", async () => {
    mockLaunch.mockResolvedValue({
      status: 402,
      body: { success: false, error: "INSUFFICIENT_CREDITS" },
    });
    expect(
      (await launchTool(post('{"resourceType":"tool","resourceId":"pdf-toolkit"}'))).status
    ).toBe(402);
  });

  it.each(["not json", "[]", "null"])("rejects body %p", async (body) => {
    const res = await launchTool(post(body));
    expect(res.status).toBe(400);
    expect(mockLaunch).not.toHaveBeenCalled();
  });
});

describe("GET /api/wallet/transactions", () => {
  it("reads only the caller rows, newest page first", async () => {
    mockRange.mockResolvedValue({ data: [{ id: "t1" }], error: null, count: 41 });
    const res = await getTransactions(txReq("?page=2&limit=20"));
    expect(mockEq).toHaveBeenCalledWith("user_id", "user-1");
    expect(mockRange).toHaveBeenCalledWith(20, 39);
    expect(await res.json()).toEqual({
      success: true,
      transactions: [{ id: "t1" }],
      pagination: { page: 2, limit: 20, total: 41, totalPages: 3 },
      summary: null,
    });
  });

  it("caps the page size", async () => {
    mockRange.mockResolvedValue({ data: [], error: null, count: 0 });
    await getTransactions(txReq("?limit=500"));
    expect(mockRange).toHaveBeenCalledWith(0, 49);
  });

  it.each(["?page=0", "?page=-1", "?limit=abc", "?page=1.5"])("rejects %s", async (qs) => {
    expect((await getTransactions(txReq(qs))).status).toBe(400);
    expect(mockRange).not.toHaveBeenCalled();
  });

  it("applies the history chips, date window and search as scoped filters", async () => {
    mockRange.mockResolvedValue({ data: [], error: null, count: 0 });
    await getTransactions(txReq("?type=service&days=30&q=passport"));
    expect(mockIn).toHaveBeenCalledWith("transaction_type", ["service_booking"]);
    expect(mockGte).toHaveBeenCalledWith(
      "created_at",
      expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/)
    );
    expect(mockOr).toHaveBeenCalledWith("description.ilike.%passport%");
  });

  it("never lets search metacharacters break out of the or()-filter", async () => {
    mockRange.mockResolvedValue({ data: [], error: null, count: 0 });
    await getTransactions(txReq('?q=abc%,(x)"d'));
    const filter = mockOr.mock.calls[0][0] as string;
    expect(filter).not.toMatch(/%,(?![a-z])/);
    expect(filter.startsWith("description.ilike.%abc")).toBe(true);
    expect((filter.match(/,/g) ?? []).length).toBe(0); // no id.ilike clause: uuid has no ilike operator
  });

  it("rejects an unknown type chip and an absurd date window", async () => {
    expect((await getTransactions(txReq("?type=hack"))).status).toBe(400);
    expect((await getTransactions(txReq("?days=99999"))).status).toBe(400);
    expect(mockRange).not.toHaveBeenCalled();
  });

  it("maps the lifetime summary from the RPC", async () => {
    mockRange.mockResolvedValue({ data: [], error: null, count: 0 });
    mockRpc.mockResolvedValue({
      data: {
        balance: 2450,
        total_credits_added: 3500,
        total_credits_spent: 1050,
        pending_count: 0,
        transaction_count: 24,
      },
      error: null,
    });
    const body = await (await getTransactions(txReq())).json();
    expect(body.summary).toEqual({
      balance: 2450,
      totalAdded: 3500,
      totalSpent: 1050,
      pendingCount: 0,
      transactionCount: 24,
    });
  });
});
