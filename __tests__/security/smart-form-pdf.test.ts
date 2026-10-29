/**
 * Smart Form Filler: the server decides full PDF vs page 1.
 * Risk: the client sent `onlyFirstPage` itself, so anyone could get the paid
 * multi-page form. Journey runs follow the journey plan; standalone runs need a
 * wallet unlock even for plan holders.
 */

import { fakeSupabase, type Row } from '../helpers/fakeSupabase'
import { canGenerateFullSmartForm } from '@/lib/forms/smartFormAccess'

const PREMIUM_J = '11111111-1111-4111-8111-111111111111'
const BASIC_J = '33333333-3333-4333-8333-333333333333'
const OTHER_J = '22222222-2222-4222-8222-222222222222'

const journeys: Row[] = [
  { id: PREMIUM_J, user_id: 'user-1', journey_type: 'IR1', subscription_tier: 'premium', status: 'in_progress' },
  { id: BASIC_J, user_id: 'user-1', journey_type: 'ir5', subscription_tier: 'basic', status: 'in_progress' },
  { id: OTHER_J, user_id: 'user-2', journey_type: 'IR1', subscription_tier: 'executive', status: 'in_progress' },
]

describe('canGenerateFullSmartForm', () => {
  const unlocks = (rows: Row[] = []) => fakeSupabase({ journeys, standalone_unlocked_resources: rows }).client

  it('journey: follows the journey plan tier', async () => {
    await expect(
      canGenerateFullSmartForm(unlocks(), 'user-1', [], { scope: 'journey', formCode: 'i130', journeyId: PREMIUM_J })
    ).resolves.toBe(true)
    await expect(
      canGenerateFullSmartForm(unlocks(), 'user-1', [], { scope: 'journey', formCode: 'i130', journeyId: BASIC_J })
    ).resolves.toBe(false)
  })

  it("journey: another user's journey never counts", async () => {
    await expect(
      canGenerateFullSmartForm(unlocks(), 'user-1', [], { scope: 'journey', formCode: 'i130', journeyId: OTHER_J })
    ).resolves.toBe(false)
  })

  it('journey: never reads wallet unlocks', async () => {
    const client = unlocks([
      { user_id: 'user-1', resource_type: 'tool', resource_id: 'form-forge', status: 'active' },
    ])
    await expect(
      canGenerateFullSmartForm(client, 'user-1', [], { scope: 'journey', formCode: 'i130', journeyId: BASIC_J })
    ).resolves.toBe(false)
  })

  it('standalone: needs a wallet unlock, whatever the plan', async () => {
    // No journey or plan input at all: a Premium account gets nothing here.
    await expect(
      canGenerateFullSmartForm(unlocks(), 'user-1', [], { scope: 'standalone', formCode: 'i130' })
    ).resolves.toBe(false)
    const unlocked = unlocks([
      { user_id: 'user-1', resource_type: 'tool', resource_id: 'form-forge', status: 'active' },
    ])
    await expect(
      canGenerateFullSmartForm(unlocked, 'user-1', [], { scope: 'standalone', formCode: 'i130' })
    ).resolves.toBe(true)
  })

  it('standalone: a form unlock opens that form only', async () => {
    const client = unlocks([
      { user_id: 'user-1', resource_type: 'tool', resource_id: 'form-forge:i485', status: 'active' },
    ])
    const full = (formCode: string) =>
      canGenerateFullSmartForm(client, 'user-1', [], { scope: 'standalone', formCode })
    await expect(full('i485')).resolves.toBe(true)
    await expect(full('I-485')).resolves.toBe(true)
    await expect(full('i130')).resolves.toBe(false)
    await expect(full('ds260')).resolves.toBe(false)
  })

  it('standalone: an unknown form is never full', async () => {
    const client = unlocks([
      { user_id: 'user-1', resource_type: 'tool', resource_id: 'form-forge', status: 'active' },
    ])
    await expect(
      canGenerateFullSmartForm(client, 'user-1', ['smart'], { scope: 'standalone', formCode: 'x999' })
    ).resolves.toBe(false)
  })

  it('standalone: a legacy "smart" add-on keeps working', async () => {
    await expect(
      canGenerateFullSmartForm(unlocks(), 'user-1', ['smart'], { scope: 'standalone', formCode: 'i130' })
    ).resolves.toBe(true)
  })
})

describe('POST /api/visa-forms/[formCode]/pdf', () => {
  let tables: Record<string, Row[]>
  let user: { id: string } | null
  const fetchMock = jest.fn()
  const originalFetch = global.fetch

  beforeAll(() => {
    jest.resetModules()
    jest.doMock('@/lib/supabase/server', () => ({
      createClient: async () => fakeSupabase(tables, { user }).client,
    }))
    global.fetch = fetchMock as unknown as typeof fetch
  })

  afterAll(() => {
    jest.dontMock('@/lib/supabase/server')
    global.fetch = originalFetch
    delete process.env.PDF_FILL_INTERNAL_TOKEN
  })

  beforeEach(() => {
    fetchMock.mockReset()
    fetchMock.mockResolvedValue(new Response('%PDF-1.7', { status: 200 }))
    process.env.PDF_FILL_INTERNAL_TOKEN = 'secret'
    user = { id: 'user-1' }
    tables = {
      user_profiles: [{ id: 'user-1', profile_details: { purchased_addons: [] } }],
      journeys,
      standalone_unlocked_resources: [],
    }
  })

  const call = async (body: unknown, formCode = 'i130') => {
    const { POST } = require('@/app/api/visa-forms/[formCode]/pdf/route') as typeof import('@/app/api/visa-forms/[formCode]/pdf/route')
    const req = new Request(`http://localhost/api/visa-forms/${formCode}/pdf`, {
      method: 'POST',
      body: JSON.stringify(body),
    })
    return POST(req as any, { params: Promise.resolve({ formCode }) })
  }
  const backendBody = () => JSON.parse(fetchMock.mock.calls[0][1].body)
  const backendHeaders = () => fetchMock.mock.calls[0][1].headers as Record<string, string>

  it('forces page 1 without access, even if the client asks for the full form', async () => {
    const res = await call({ data: { a: '1' }, scope: 'standalone', onlyFirstPage: false })
    expect(res.status).toBe(200)
    expect(res.headers.get('X-Pdf-Scope')).toBe('first-page')
    expect(backendBody().onlyFirstPage).toBe(true)
    expect(backendHeaders()['X-Internal-Token']).toBeUndefined()
  })

  it('sends the full form with the internal token when entitled', async () => {
    const res = await call({ data: { a: '1' }, scope: 'journey', journeyId: PREMIUM_J })
    expect(res.headers.get('X-Pdf-Scope')).toBe('full')
    expect(backendBody()).toMatchObject({ formId: 'i130', onlyFirstPage: false })
    expect(backendHeaders()['X-Internal-Token']).toBe('secret')
  })

  it('a standalone form unlock gives the full PDF for that form only', async () => {
    tables.standalone_unlocked_resources = [
      { user_id: 'user-1', resource_type: 'tool', resource_id: 'form-forge:i485', status: 'active' },
    ]
    const own = await call({ data: {}, scope: 'standalone' }, 'i485')
    expect(own.headers.get('X-Pdf-Scope')).toBe('full')
    fetchMock.mockClear()
    const other = await call({ data: {}, scope: 'standalone' }, 'i130')
    expect(other.headers.get('X-Pdf-Scope')).toBe('first-page')
    expect(backendBody().onlyFirstPage).toBe(true)
  })

  it('signed-out visitors only get the page-1 demo', async () => {
    user = null
    const res = await call({ data: {}, scope: 'standalone' })
    expect(res.headers.get('X-Pdf-Scope')).toBe('first-page')
    expect(backendBody().onlyFirstPage).toBe(true)
  })

  it('rejects a malformed form code before calling the backend', async () => {
    const res = await call({ data: {} }, '../etc')
    expect(res.status).toBe(400)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
