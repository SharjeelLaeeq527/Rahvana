/**
 * Tiny in-memory Supabase stand-in for route/lib tests. Supports the query
 * shapes the wallet / entitlement code uses: select + eq/in/is filters, then
 * maybeSingle / single / await. `update(values)` + filters + await patches the
 * matching rows in `tables` in place. `eqCalls` records every filter so tests can
 * assert that queries are scoped to the signed-in user.
 */
export type Row = Record<string, unknown>;

export function fakeSupabase(
  tables: Record<string, Row[]>,
  opts: { user?: { id: string; email?: string } | null; rpc?: (name: string, args: unknown) => unknown } = {}
) {
  const eqCalls: Array<{ table: string; column: string; value: unknown }> = [];

  const from = (table: string) => {
    let rows = [...(tables[table] ?? [])];
    let patch: Row | null = null;
    const builder: any = {
      update: (values: Row) => {
        patch = values;
        return builder;
      },
      is: (column: string, value: unknown) => {
        rows = rows.filter((r) => (r[column] ?? null) === value);
        return builder;
      },
      select: () => builder,
      order: () => builder,
      limit: () => builder,
      eq: (column: string, value: unknown) => {
        eqCalls.push({ table, column, value });
        rows = rows.filter((r) => r[column] === value);
        return builder;
      },
      in: (column: string, values: unknown[]) => {
        rows = rows.filter((r) => values.includes(r[column]));
        return builder;
      },
      maybeSingle: async () => ({ data: rows[0] ?? null, error: null }),
      single: async () =>
        rows[0] ? { data: rows[0], error: null } : { data: null, error: { code: "PGRST116" } },
      then: (resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) => {
        if (patch) {
          for (const row of rows) Object.assign(row, patch);
          return Promise.resolve({ data: null, error: null }).then(resolve, reject);
        }
        return Promise.resolve({ data: rows, error: null }).then(resolve, reject);
      },
    };
    return builder;
  };

  const client: any = {
    from,
    rpc: async (name: string, args: unknown) => ({ data: opts.rpc?.(name, args) ?? null, error: null }),
    auth: {
      getUser: async () => ({ data: { user: opts.user ?? null }, error: null }),
    },
  };
  return { client, eqCalls };
}
