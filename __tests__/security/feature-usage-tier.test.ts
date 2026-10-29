/**
 * /api/feature-usage must resolve the plan tier server-side.
 * Risk: the route trusted a `tier` sent by the client, so any user could claim
 * Executive and skip usage limits; journey tiers must come from a journey the
 * user owns; standalone tools must not inherit the account plan.
 */

import { fakeSupabase, type Row } from '../helpers/fakeSupabase'
import { resolveUsageTier } from '@/lib/usage/resolveUsageTier'
import { resolveOwnedJourney } from '@/lib/journey/resolveOwnedJourney'

const J1 = '11111111-1111-4111-8111-111111111111'
const J_OTHER = '22222222-2222-4222-8222-222222222222'

const journeys: Row[] = [
  { id: J1, user_id: 'user-1', journey_type: 'IR1', subscription_tier: 'premium', status: 'in_progress' },
  { id: 'j-ir5-c2', user_id: 'user-1', journey_type: 'ir5_candidate-2', subscription_tier: 'executive', status: 'in_progress' },
  { id: J_OTHER, user_id: 'user-2', journey_type: 'IR1', subscription_tier: 'executive', status: 'in_progress' },
]

describe('resolveOwnedJourney', () => {
  it('finds the user journey by id and scopes the query to the user', async () => {
    const { client, eqCalls } = fakeSupabase({ journeys })
    const j = await resolveOwnedJourney(client, 'user-1', { journeyId: J1 })
    expect(j?.id).toBe(J1)
    expect(eqCalls).toContainEqual({ table: 'journeys', column: 'user_id', value: 'user-1' })
  })

  it("never returns another user's journey", async () => {
    const { client } = fakeSupabase({ journeys })
    await expect(resolveOwnedJourney(client, 'user-1', { journeyId: J_OTHER })).resolves.toBeNull()
  })

  it('resolves a slug + candidate to the right candidate journey', async () => {
    const { client } = fakeSupabase({ journeys })
    const j = await resolveOwnedJourney(client, 'user-1', {
      journeyId: 'ir5-journey',
      journeyCategory: 'IR-5',
      candidateId: 'candidate-2',
    })
    expect(j?.id).toBe('j-ir5-c2')
  })
})

describe('resolveUsageTier', () => {
  const addons: string[] = []

  it('uses the account tier by default (old callers)', async () => {
    const { client } = fakeSupabase({ journeys })
    const r = await resolveUsageTier(client, 'user-1', 'photo_booth', 'basic', addons, {})
    expect(r).toMatchObject({ ok: true, scope: 'account', tier: 'basic' })
  })

  it("uses the owned journey's tier for journey scope", async () => {
    const { client } = fakeSupabase({ journeys })
    const r = await resolveUsageTier(client, 'user-1', 'photo_booth', 'free', addons, {
      scope: 'journey',
      journeyId: J1,
    })
    expect(r).toMatchObject({ ok: true, tier: 'premium' })
  })

  it("refuses a journey the user does not own (cannot borrow an Executive tier)", async () => {
    const { client } = fakeSupabase({ journeys })
    const r = await resolveUsageTier(client, 'user-1', 'photo_booth', 'free', addons, {
      scope: 'journey',
      journeyId: J_OTHER,
    })
    expect(r).toMatchObject({ ok: false, status: 403 })
  })

  it('standalone ignores the account plan, even Executive', async () => {
    const { client } = fakeSupabase({ journeys, standalone_unlocked_resources: [] })
    const r = await resolveUsageTier(client, 'user-1', 'photo_booth', 'executive', addons, {
      scope: 'standalone',
    })
    expect(r).toMatchObject({ ok: true, tier: 'free', walletPack: true })
  })

  it('standalone Photo Booth counts credit packs; journeys and other features never do', async () => {
    const { client } = fakeSupabase({ journeys })
    await expect(
      resolveUsageTier(client, 'user-1', 'interview_prep', 'free', addons, { scope: 'standalone' })
    ).resolves.toMatchObject({ ok: true, walletPack: false })
    await expect(
      resolveUsageTier(client, 'user-1', 'photo_booth', 'free', addons, { scope: 'journey', journeyId: J1 })
    ).resolves.toMatchObject({ ok: true, walletPack: false })
  })
})

describe('/api/feature-usage route', () => {
  let tables: Record<string, Row[]>
  const usageCalls: unknown[][] = []

  beforeAll(() => {
    jest.resetModules()
    jest.doMock('@/lib/supabase/server', () => ({
      createClient: async () => fakeSupabase(tables, { user: { id: 'user-1' } }).client,
    }))
    jest.doMock('@/lib/usage/checkFeatureUsage', () => ({
      checkFeatureUsage: async (...a: unknown[]) => {
        usageCalls.push(a)
        return { allowed: false }
      },
    }))
  })

  afterAll(() => {
    jest.dontMock('@/lib/supabase/server')
    jest.dontMock('@/lib/usage/checkFeatureUsage')
  })

  beforeEach(() => {
    usageCalls.length = 0
    tables = {
      user_profiles: [{ id: 'user-1', subscription_tier: 'free', profile_details: { purchased_addons: [] } }],
      journeys,
      standalone_unlocked_resources: [],
    }
  })

  const route = () =>
    require('@/app/api/feature-usage/route') as typeof import('@/app/api/feature-usage/route')

  it('GET ignores a client-sent tier=executive', async () => {
    const res = await route().GET(
      new Request('http://localhost/api/feature-usage?feature=photo_booth&tier=executive')
    )
    expect(res.status).toBe(200)
    // checkFeatureUsage(userId, feature, tier, addons): tier must be the real one.
    expect(usageCalls[0][2]).toBe('free')
  })

  it('POST ignores a client-sent tier=executive and refuses the locked feature', async () => {
    const res = await route().POST(
      new Request('http://localhost/api/feature-usage', {
        method: 'POST',
        body: JSON.stringify({ feature: 'photo_booth', tier: 'executive' }),
      })
    )
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.unlimited).toBeUndefined()
  })

  it("POST with another user's journey is refused", async () => {
    const res = await route().POST(
      new Request('http://localhost/api/feature-usage', {
        method: 'POST',
        body: JSON.stringify({ feature: 'photo_booth', scope: 'journey', journeyId: J_OTHER }),
      })
    )
    expect(res.status).toBe(403)
  })
})
