/**
 * Interview Prep sessions: journey vs standalone.
 * Risks: journey sessions created as paid "tool" sessions (wrong access rule),
 * a journey the user does not own, a journey plan that does not include the
 * tool, and a legacy single-category purchase turning into every category.
 */

import { fakeSupabase, type Row } from '../helpers/fakeSupabase'

const J_BASIC = '11111111-1111-4111-8111-111111111111'
const J_FREE = '33333333-3333-4333-8333-333333333333'
const J_DONE = '44444444-4444-4444-8444-444444444444'
const J_OTHER = '22222222-2222-4222-8222-222222222222'

let tables: Record<string, Row[]>
let addons: string[]
const mockCreateTool = jest.fn()
const mockCreateJourney = jest.fn()

jest.mock('@/lib/supabase/server', () => ({
  createClient: async () => fakeSupabase(tables, { user: { id: 'user-1' } }).client,
}))
jest.mock('@/lib/interview-prep/service', () => ({
  createInterviewSession: (...a: unknown[]) => mockCreateTool(...a),
  createJourneyInterviewSession: (...a: unknown[]) => mockCreateJourney(...a),
  getInterviewSession: jest.fn(),
}))
jest.mock('@/lib/interview-prep/category-loader', () => ({
  categoryLoader: {
    getActiveCategories: async () => [
      { categorySlug: 'ir-1-spouse', categoryName: 'IR-1' },
      { categorySlug: 'ir-5-parent', categoryName: 'IR-5' },
    ],
  },
}))

import {
  validateJourneySessionCreation,
  validateToolSessionCreation,
} from '@/lib/interview-prep/purchase-validation'
import { POST } from '@/app/api/interview-prep/route'

beforeEach(() => {
  jest.clearAllMocks()
  addons = []
  tables = {
    journeys: [
      { id: J_BASIC, user_id: 'user-1', journey_type: 'IR1', subscription_tier: 'basic', status: 'in_progress' },
      { id: J_FREE, user_id: 'user-1', journey_type: 'ir5', subscription_tier: 'free', status: 'in_progress' },
      { id: J_DONE, user_id: 'user-1', journey_type: 'ir5_candidate-2', subscription_tier: 'executive', status: 'completed' },
      { id: J_OTHER, user_id: 'user-2', journey_type: 'IR1', subscription_tier: 'executive', status: 'in_progress' },
    ],
    get user_profiles() {
      return [{ id: 'user-1', subscription_tier: 'premium', profile_details: { purchased_addons: addons } }]
    },
    standalone_unlocked_resources: [],
    interview_prep_sessions: [],
  } as Record<string, Row[]>
  mockCreateJourney.mockResolvedValue({ session: { id: 's-j' }, alreadyExists: false })
  mockCreateTool.mockResolvedValue({ session: { id: 's-t' }, alreadyExists: false, source: 'tool' })
})

describe('validateJourneySessionCreation', () => {
  it("refuses a journey the user does not own", async () => {
    await expect(validateJourneySessionCreation('user-1', { journeyId: J_OTHER })).resolves.toMatchObject({
      allowed: false,
      status: 404,
      reason: 'JOURNEY_NOT_FOUND',
    })
  })

  it('refuses a completed journey', async () => {
    await expect(validateJourneySessionCreation('user-1', { journeyId: J_DONE })).resolves.toMatchObject({
      allowed: false,
      reason: 'JOURNEY_INACTIVE',
    })
  })

  it('follows the journey plan: free journey is refused, basic is allowed', async () => {
    await expect(validateJourneySessionCreation('user-1', { journeyId: J_FREE })).resolves.toMatchObject({
      allowed: false,
      reason: 'JOURNEY_PLAN_REQUIRED',
    })
    await expect(validateJourneySessionCreation('user-1', { journeyId: J_BASIC })).resolves.toEqual({
      allowed: true,
      journeyId: J_BASIC,
    })
  })

  it('resolves a slug-only journey reference to the owned row', async () => {
    await expect(
      validateJourneySessionCreation('user-1', { journeyId: 'ir1-journey', journeyCategory: 'IR-1' })
    ).resolves.toEqual({ allowed: true, journeyId: J_BASIC })
  })
})

describe('validateToolSessionCreation (standalone)', () => {
  it('a Premium plan alone does not open standalone sessions', async () => {
    await expect(validateToolSessionCreation('user-1', 'ir-1-spouse')).resolves.toMatchObject({
      allowed: false,
      reason: 'NO_PURCHASE',
    })
  })

  it('a legacy category purchase opens only that category', async () => {
    addons = ['interview-prep:ir-1-spouse']
    await expect(validateToolSessionCreation('user-1', 'ir-1-spouse')).resolves.toMatchObject({
      allowed: true,
      reason: 'purchase_available',
    })
    await expect(validateToolSessionCreation('user-1', 'ir-5-parent')).resolves.toMatchObject({
      allowed: false,
      reason: 'NO_PURCHASE',
    })
  })

  it('the bare all-categories add-on opens every category', async () => {
    addons = ['interview-prep']
    await expect(validateToolSessionCreation('user-1', 'ir-5-parent')).resolves.toMatchObject({
      allowed: true,
      reason: 'wallet_unlock',
    })
  })

  it('a credit unlock opens every category', async () => {
    tables.standalone_unlocked_resources = [
      { user_id: 'user-1', resource_type: 'tool', resource_id: 'interview-prep', status: 'active' },
    ]
    await expect(validateToolSessionCreation('user-1', 'ir-5-parent')).resolves.toMatchObject({
      allowed: true,
      reason: 'wallet_unlock',
    })
  })
})

describe('POST /api/interview-prep', () => {
  const post = (body: unknown) =>
    POST(
      new Request('http://localhost/api/interview-prep', {
        method: 'POST',
        body: JSON.stringify(body),
      }) as any
    )

  it('creates a JOURNEY session for an owned, entitled journey', async () => {
    const res = await post({ category_slug: 'ir-1-spouse', source: 'journey', journey_id: J_BASIC })
    expect(res.status).toBe(201)
    expect((await res.json()).source).toBe('journey')
    expect(mockCreateJourney).toHaveBeenCalledWith(J_BASIC, 'ir-1-spouse')
    expect(mockCreateTool).not.toHaveBeenCalled()
  })

  it("does not create anything for another user's journey", async () => {
    const res = await post({ category_slug: 'ir-1-spouse', source: 'journey', journey_id: J_OTHER })
    expect(res.status).toBe(404)
    expect(mockCreateJourney).not.toHaveBeenCalled()
    expect(mockCreateTool).not.toHaveBeenCalled()
  })

  it('refuses a journey whose plan lacks Interview Prep', async () => {
    const res = await post({ category_slug: 'ir-5-parent', source: 'journey', journey_id: J_FREE })
    expect(res.status).toBe(403)
    expect((await res.json()).error).toBe('JOURNEY_PLAN_REQUIRED')
    expect(mockCreateJourney).not.toHaveBeenCalled()
  })

  it('standalone without a purchase or unlock is a 402, never a journey session', async () => {
    const res = await post({ category_slug: 'ir-1-spouse', source: 'tool' })
    expect(res.status).toBe(402)
    expect(mockCreateJourney).not.toHaveBeenCalled()
    expect(mockCreateTool).not.toHaveBeenCalled()
  })

  it('standalone with a category purchase creates a tool session', async () => {
    addons = ['interview-prep:ir-1-spouse']
    const res = await post({ category_slug: 'ir-1-spouse' })
    expect(res.status).toBe(201)
    expect(mockCreateTool).toHaveBeenCalled()
    expect(mockCreateJourney).not.toHaveBeenCalled()
  })

  it('creates a JOURNEY session with candidate_id when specified', async () => {
    const res = await post({
      category_slug: 'ir-5-parent',
      source: 'journey',
      journey_id: J_BASIC,
      candidate_id: 'candidate-2',
    })
    expect(res.status).toBe(201)
    expect(mockCreateJourney).toHaveBeenCalledWith(J_BASIC, 'ir-5-parent', 'candidate-2')
  })

  it('passes candidate_id to createInterviewSession for standalone creation', async () => {
    addons = ['interview-prep:ir-5-parent']
    const res = await post({
      category_slug: 'ir-5-parent',
      candidate_id: 'candidate-2',
    })
    expect(res.status).toBe(201)
    expect(mockCreateTool).toHaveBeenCalledWith(
      expect.objectContaining({
        category_slug: 'ir-5-parent',
        candidate_id: 'candidate-2',
      })
    )
  })
})
