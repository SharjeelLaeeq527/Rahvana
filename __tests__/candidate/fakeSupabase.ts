/**
 * In-memory Supabase stand-in for candidate tests (not a test file itself).
 *
 * Tables are arrays of rows. Supports the query-builder calls the candidate code uses:
 * select / insert / upsert / update / delete with eq / neq / is / in / like / ilike /
 * limit, and maybeSingle / single / await. Undefined payload values are dropped, as
 * PostgREST does.
 *
 * `guard: true` models the DB triggers of migration 20261113_01 for a client acting as
 * the `authenticated` role: journeys.subscription_tier / stripe_subscription_id are
 * forced to free / null on insert and kept on update, and server-owned profile_details
 * keys keep their stored values. It is a model of the SQL, used to show which writes the
 * guard lets through; the SQL itself is asserted in security tests.
 */

export type Row = Record<string, any>;

export interface FakeLogEntry {
  table: string;
  op: "select" | "insert" | "upsert" | "update" | "delete";
  payload?: any;
}

const SERVER_OWNED_KEYS = [
  "purchased_addons",
  "processed_addon_checkout_sessions",
  "stripe_subscription_id",
  "active_plan",
  "plan_visa_category",
  "plan_purchase_date",
  "activated_by",
  "candidates",
  "candidateIdHighWater",
  "journeyTiers",
  "journey_tiers",
];

function dropUndefined(payload: Row): Row {
  const out: Row = {};
  for (const [k, v] of Object.entries(payload || {})) if (v !== undefined) out[k] = v;
  return out;
}

function likeToRegex(pattern: string, flags = ""): RegExp {
  const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/%/g, ".*");
  return new RegExp(`^${escaped}$`, flags);
}

export interface FakeOptions {
  user?: { id: string } | null;
  guard?: boolean;
  /** Tables whose every query fails. */
  failTables?: string[];
  /** "table.op" pairs that fail, e.g. "user_guides.insert". */
  failOps?: string[];
}

export function createFakeSupabase(tables: Record<string, Row[]>, options: FakeOptions = {}) {
  const log: FakeLogEntry[] = [];
  let seq = 0;

  const applyGuard = (table: string, op: string, incoming: Row, existing?: Row): Row => {
    if (!options.guard) return incoming;
    const next = { ...incoming };
    if (table === "journeys") {
      if (op === "insert") {
        next.subscription_tier = "free";
        next.stripe_subscription_id = null;
      } else if (existing) {
        if ("subscription_tier" in next) next.subscription_tier = existing.subscription_tier;
        if ("stripe_subscription_id" in next)
          next.stripe_subscription_id = existing.stripe_subscription_id;
      }
    }
    if (table === "user_profiles" && next.profile_details && typeof next.profile_details === "object") {
      const details = { ...next.profile_details };
      const stored = (existing?.profile_details || {}) as Row;
      for (const key of SERVER_OWNED_KEYS) {
        delete details[key];
        if (op !== "insert" && key in stored) details[key] = stored[key];
      }
      next.profile_details = details;
    }
    return next;
  };

  function from(table: string) {
    const filters: Array<(r: Row) => boolean> = [];
    let op: FakeLogEntry["op"] = "select";
    let payload: any = null;
    let limit: number | undefined;
    const rows = () => (tables[table] ??= []);
    const matching = () => rows().filter((r) => filters.every((f) => f(r)));

    const exec = (): { data: any; error: any } => {
      if (options.failTables?.includes(table)) {
        return { data: null, error: { message: `${table} unavailable`, code: "XX000" } };
      }
      if (options.failOps?.includes(`${table}.${op}`)) {
        return { data: null, error: { message: `${table}.${op} failed`, code: "23505" } };
      }
      if (op !== "select") log.push({ table, op, payload });
      switch (op) {
        case "select": {
          let data = matching().map((r) => ({ ...r }));
          if (limit !== undefined) data = data.slice(0, limit);
          return { data, error: null };
        }
        case "update": {
          const hits = matching();
          for (const r of hits) Object.assign(r, applyGuard(table, "update", dropUndefined(payload), r));
          return { data: hits.map((r) => ({ ...r })), error: null };
        }
        case "insert":
        case "upsert": {
          const list = (Array.isArray(payload) ? payload : [payload]).map(dropUndefined);
          const written: Row[] = [];
          for (const p of list) {
            const row = applyGuard(table, "insert", { id: p.id ?? `${table}-${++seq}`, ...p });
            rows().push(row);
            written.push({ ...row });
          }
          return { data: written, error: null };
        }
        case "delete": {
          const hits = matching();
          tables[table] = rows().filter((r) => !hits.includes(r));
          return { data: hits.map((r) => ({ ...r })), error: null };
        }
      }
    };

    const one = (required: boolean) => {
      const res = exec();
      if (res.error) return { data: null, error: res.error };
      const list = Array.isArray(res.data) ? res.data : [res.data];
      const first = list[0] ?? null;
      if (required && !first) return { data: null, error: { message: "no rows", code: "PGRST116" } };
      return { data: first, error: null };
    };

    const b: any = {
      select: () => b,
      eq: (k: string, v: unknown) => (filters.push((r) => r[k] === v), b),
      neq: (k: string, v: unknown) => (filters.push((r) => r[k] !== v), b),
      is: (k: string, v: unknown) => (filters.push((r) => (r[k] ?? null) === v), b),
      in: (k: string, vs: unknown[]) => (filters.push((r) => vs.includes(r[k])), b),
      like: (k: string, p: string) => (filters.push((r) => likeToRegex(p).test(String(r[k] ?? ""))), b),
      ilike: (k: string, p: string) =>
        (filters.push((r) => likeToRegex(p, "i").test(String(r[k] ?? ""))), b),
      or: () => b,
      order: () => b,
      limit: (n: number) => ((limit = n), b),
      update: (p: Row) => ((op = "update"), (payload = p), b),
      insert: (p: Row | Row[]) => ((op = "insert"), (payload = p), b),
      upsert: (p: Row | Row[]) => ((op = "upsert"), (payload = p), b),
      delete: () => ((op = "delete"), b),
      maybeSingle: async () => one(false),
      single: async () => one(true),
      then: (res: any, rej: any) => Promise.resolve().then(exec).then(res, rej),
    };
    return b;
  }

  return {
    from,
    auth: {
      getUser: async () => ({ data: { user: options.user ?? null }, error: null }),
    },
    log,
    tables,
  };
}

export type FakeSupabase = ReturnType<typeof createFakeSupabase>;
