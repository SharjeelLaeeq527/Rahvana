/**
 * Document Translation inside a journey is covered by the journey plan, so the
 * upload route stores those requests as already paid. Risk: it trusted the
 * client's `source: "journey"` tag, so any standalone user could get a free
 * translation by sending it. The journey must be the user's own, active, and
 * its plan must include the service.
 */

import { fakeSupabase, type Row } from '../helpers/fakeSupabase'
import { verifyJourneyServiceAccess } from '@/lib/journey/journeyServiceAccess'

const EXEC_J = '11111111-1111-4111-8111-111111111111'
const PREMIUM_J = '33333333-3333-4333-8333-333333333333'
const DONE_J = '44444444-4444-4444-8444-444444444444'
const OTHER_J = '22222222-2222-4222-8222-222222222222'

let addons: string[]
let tables: Record<string, Row[]>
let inserted: Row[]
let usage: Record<string, number>
let deletedCount: number
const mockUpload = jest.fn()
const mockNotify = jest.fn()

jest.mock('@/lib/supabase/server', () => ({
  createClient: async () => {
    const base = fakeSupabase(tables, { user: { id: 'user-1', email: 'u@example.com' } }).client
    return {
      ...base,
      from: (table: string) => {
        if (table !== 'translation_documents') return base.from(table)
        return {
          insert: (row: Row) => {
            inserted.push(row)
            return { select: () => ({ single: async () => ({ data: row, error: null }) }) }
          },
        }
      },
      storage: { from: () => ({ upload: mockUpload, remove: jest.fn() }) },
    }
  },
}))
jest.mock('@/lib/api/authGuards', () => ({
  getServiceRoleClient: () => ({
    rpc: async (_name: string, args: { p_feature_key: string; p_limit: number }) => {
      const used = usage[args.p_feature_key] ?? 0
      if (used >= args.p_limit) return { data: { allowed: false }, error: null }
      usage[args.p_feature_key] = used + 1
      return { data: { allowed: true, remaining: args.p_limit - used - 1 }, error: null }
    },
    from: () => ({
      insert: (row: Row) => {
        inserted.push(row)
        return { select: () => ({ single: async () => ({ data: row, error: null }) }) }
      },
      delete: () => {
        const chain = { eq: () => chain }
        deletedCount++
        return chain
      },
    }),
  }),
}))
jest.mock('@/lib/security/file-content', () => ({
  validateUploadedFile: async () => ({ ok: true, buffer: Buffer.from('%PDF'), detectedMime: 'application/pdf' }),
}))
jest.mock('@/lib/notifications', () => ({
  triggerTranslationNotification: (...a: unknown[]) => mockNotify(...a),
}))

import { POST } from '@/app/api/document-translation/upload/route'

beforeEach(() => {
  jest.clearAllMocks()
  addons = []
  inserted = []
  usage = {}
  deletedCount = 0
  mockUpload.mockResolvedValue({ error: null })
  tables = {
    journeys: [
      { id: EXEC_J, user_id: 'user-1', journey_type: 'IR1', subscription_tier: 'executive', status: 'in_progress' },
      { id: PREMIUM_J, user_id: 'user-1', journey_type: 'ir5', subscription_tier: 'premium', status: 'in_progress' },
      { id: DONE_J, user_id: 'user-1', journey_type: 'ir5_candidate-2', subscription_tier: 'executive', status: 'completed' },
      { id: OTHER_J, user_id: 'user-2', journey_type: 'IR1', subscription_tier: 'executive', status: 'in_progress' },
    ],
    profiles: [{ id: 'user-1', full_name: 'Test User' }],
    get user_profiles() {
      return [{ id: 'user-1', profile_details: { purchased_addons: addons } }]
    },
  } as Record<string, Row[]>
})

describe('verifyJourneyServiceAccess', () => {
  const check = (journeyId: string) =>
    verifyJourneyServiceAccess(fakeSupabase(tables).client, 'user-1', 'document_translation', { journeyId })

  it('allows an owned Executive journey', async () => {
    await expect(check(EXEC_J)).resolves.toMatchObject({ allowed: true, journeyId: EXEC_J })
  })

  it("refuses another user's journey", async () => {
    await expect(check(OTHER_J)).resolves.toMatchObject({ allowed: false, status: 404 })
  })

  it('refuses a completed journey', async () => {
    await expect(check(DONE_J)).resolves.toMatchObject({ allowed: false, status: 403 })
  })

  it('refuses a journey whose plan lacks the service, unless the add-on was bought', async () => {
    await expect(check(PREMIUM_J)).resolves.toMatchObject({ allowed: false, status: 403 })
    addons = ['translate']
    await expect(check(PREMIUM_J)).resolves.toMatchObject({ allowed: true })
  })

  it('resolves a slug-only reference to the owned row', async () => {
    await expect(
      verifyJourneyServiceAccess(fakeSupabase(tables).client, 'user-1', 'document_translation', {
        journeyId: '',
        journeyCategory: 'IR-1',
      })
    ).resolves.toMatchObject({ allowed: true, journeyId: EXEC_J })
  })
})

describe('POST /api/document-translation/upload', () => {
  const post = (fields: Record<string, string>) => {
    const values: Record<string, unknown> = {
      file: { name: 'nikah.pdf', size: 1000, type: 'application/pdf' },
      documentType: 'marriage',
      ...fields,
    }
    return POST({
      formData: async () => ({ get: (k: string) => values[k] ?? null }),
      headers: new Headers(),
    } as never)
  }

  it('stores a verified journey request as paid and tags the journey', async () => {
    const res = await post({ source: 'journey', journey_id: EXEC_J, journey_slug: 'ir1-journey' })
    expect(res.status).toBe(200)
    expect(inserted[0]).toMatchObject({
      payment_status: 'paid',
      metadata: expect.objectContaining({ source: 'journey', journey_id: EXEC_J }),
    })
    expect(mockNotify).toHaveBeenCalled()
  })

  it("a forged journey tag (someone else's journey) uploads nothing and is not paid", async () => {
    const res = await post({ source: 'journey', journey_id: OTHER_J })
    expect(res.status).toBe(404)
    expect(mockUpload).not.toHaveBeenCalled()
    expect(inserted).toHaveLength(0)
  })

  it('a journey tag with no journey at all is refused', async () => {
    const res = await post({ source: 'journey' })
    expect(res.status).toBe(404)
    expect(inserted).toHaveLength(0)
  })

  it('a journey whose plan lacks translation is refused', async () => {
    const res = await post({ source: 'journey', journey_id: PREMIUM_J })
    expect(res.status).toBe(403)
    expect(inserted).toHaveLength(0)
  })

  it('one translation add-on on Premium covers exactly one journey upload', async () => {
    addons = ['translate']
    expect((await post({ source: 'journey', journey_id: PREMIUM_J })).status).toBe(200)
    const res = await post({ source: 'journey', journey_id: PREMIUM_J })
    expect(res.status).toBe(403)
    expect(deletedCount).toBe(1)
    expect(usage).toEqual({ 'document_translation:addon': 1 })
  })

  it('standalone stays pending (paid later with credits)', async () => {
    const res = await post({ source: 'standalone' })
    expect(res.status).toBe(200)
    expect(inserted[0]).toMatchObject({ payment_status: 'pending' })
    expect(mockNotify).not.toHaveBeenCalled()
  })

  it('an unknown source is treated as standalone', async () => {
    await post({ source: 'anything' })
    expect(inserted[0]).toMatchObject({
      payment_status: 'pending',
      metadata: expect.objectContaining({ source: 'standalone' }),
    })
  })
})
