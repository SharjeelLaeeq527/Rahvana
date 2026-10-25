/**
 * Phase 6 (tools): server-side standalone access.
 * Risk: a wallet unlock that the UI honours but the server rejects (user paid
 * credits and still gets a 402), or the reverse: access granted without paying.
 */

import { hasStandaloneAccess } from '@/lib/wallet/state'

type Rows = { resource_type: string; resource_id: string; status: string }[]

// Minimal Supabase stub: records eq() filters, resolves the query to `result`.
function stubClient(result: { data: Rows | null; error: unknown }, eqCalls: unknown[][] = []) {
  const chain: any = {
    select: () => chain,
    eq: (...a: unknown[]) => {
      eqCalls.push(a)
      return chain
    },
    then: (resolve: (v: unknown) => unknown) => resolve(result),
  }
  return { from: () => chain } as any
}

describe('hasStandaloneAccess', () => {
  it('grants an active wallet unlock row and filters by the user', async () => {
    const eqCalls: unknown[][] = []
    const client = stubClient(
      { data: [{ resource_type: 'tool', resource_id: 'interview-prep', status: 'active' }], error: null },
      eqCalls
    )
    await expect(hasStandaloneAccess(client, 'user-1', 'tool', 'interview-prep')).resolves.toBe(true)
    expect(eqCalls).toContainEqual(['user_id', 'user-1'])
  })

  it('ignores revoked rows and rows for other tools', async () => {
    const client = stubClient(
      {
        data: [
          { resource_type: 'tool', resource_id: 'interview-prep', status: 'revoked' },
          { resource_type: 'tool', resource_id: 'pdf-toolkit', status: 'active' },
        ],
        error: null,
      },
    )
    await expect(hasStandaloneAccess(client, 'user-1', 'tool', 'interview-prep')).resolves.toBe(false)
  })

  it('honours a permanent legacy add-on, but not a consumable one', async () => {
    const client = stubClient({ data: [], error: null })
    // Bare "interview-prep" was the all-categories purchase.
    await expect(
      hasStandaloneAccess(client, 'user-1', 'tool', 'interview-prep', ['interview-prep'])
    ).resolves.toBe(true)
    // A per-category purchase stays category-scoped: never a whole-tool unlock.
    await expect(
      hasStandaloneAccess(client, 'user-1', 'tool', 'interview-prep', ['interview-prep:ir-1-spouse'])
    ).resolves.toBe(false)
    // Photo credits are consumable: a legacy photo purchase never means unlimited.
    await expect(hasStandaloneAccess(client, 'user-1', 'tool', 'photo-booth', ['photo'])).resolves.toBe(
      false
    )
  })

  it('fails closed when the read errors', async () => {
    const client = stubClient({ data: null, error: { message: 'boom' } })
    await expect(hasStandaloneAccess(client, 'user-1', 'tool', 'interview-prep')).resolves.toBe(false)
  })
})

describe('validateToolSessionCreation (interview prep)', () => {
  const mockHasAccess = jest.fn()
  const tables: Record<string, unknown> = {}

  beforeAll(() => {
    jest.resetModules()
    jest.doMock('@/lib/wallet/state', () => ({
      hasStandaloneAccess: (...a: unknown[]) => mockHasAccess(...a),
    }))
    jest.doMock('@/lib/supabase/server', () => ({
      createClient: async () => ({
        from: (table: string) => {
          const chain: any = {
            select: () => chain,
            eq: () => chain,
            single: async () => ({ data: tables[table] ?? null, error: null }),
            then: (resolve: (v: unknown) => unknown) => resolve({ data: [], error: null }),
          }
          return chain
        },
      }),
    }))
  })

  afterAll(() => {
    jest.dontMock('@/lib/wallet/state')
    jest.dontMock('@/lib/supabase/server')
  })

  beforeEach(() => {
    mockHasAccess.mockReset()
    tables.user_profiles = { subscription_tier: 'free', profile_details: { purchased_addons: [] } }
  })

  const load = () =>
    require('@/lib/interview-prep/purchase-validation') as typeof import('@/lib/interview-prep/purchase-validation')

  it('allows unlimited standalone sessions with a wallet unlock', async () => {
    mockHasAccess.mockResolvedValue(true)
    const result = await load().validateToolSessionCreation('user-1', 'ir-1-spouse')
    expect(result).toMatchObject({ allowed: true, reason: 'wallet_unlock' })
    expect(mockHasAccess).toHaveBeenCalledWith(expect.anything(), 'user-1', 'tool', 'interview-prep', [])
  })

  it('still requires a purchase without a wallet unlock', async () => {
    mockHasAccess.mockResolvedValue(false)
    const result = await load().validateToolSessionCreation('user-1', 'ir-1-spouse')
    expect(result).toMatchObject({ allowed: false, reason: 'NO_PURCHASE' })
  })
})
