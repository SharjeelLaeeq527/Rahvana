/**
 * Service bookings decide payment on the server.
 * Risks fixed here: consultations created as "paid" by default or by a forged
 * `source: "journey"` tag, every user's bookings readable without login, any
 * booking approved or cancelled by anyone, Medical / PCC journey tags trusted
 * without checking the journey (and PCC filed under a user id from the body),
 * and abandoned unpaid drafts holding a consultation slot forever.
 */

import { fakeSupabase, type Row } from '../helpers/fakeSupabase'

process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-key'
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://supabase.local'

const EXEC_J = '11111111-1111-4111-8111-111111111111'
const PREMIUM_J = '33333333-3333-4333-8333-333333333333'
const OTHER_J = '22222222-2222-4222-8222-222222222222'

let currentUser: { id: string; email?: string } | null
let isAdmin: boolean
let tables: Record<string, Row[]>
let inserted: Array<{ table: string; row: Row }>
const mockCreateBooking = jest.fn()
const mockGetAllBookings = jest.fn()
const mockGetBookingById = jest.fn()
const mockUpdateBooking = jest.fn()

/** fakeSupabase reads + insert capture, for the clients the routes build. */
function client() {
  const base = fakeSupabase(tables, { user: currentUser }).client
  return {
    ...base,
    from: (table: string) => ({
      ...base.from(table),
      insert: (rows: Row | Row[]) => {
        const row = Array.isArray(rows) ? rows[0] : rows
        inserted.push({ table, row })
        const saved = { id: `${table}-1`, request_id: 'PV-1', ...row }
        return { select: () => ({ single: async () => ({ data: saved, error: null }) }) }
      },
    }),
  }
}

jest.mock('@/lib/supabase/server', () => ({ createClient: async () => client() }))
jest.mock('@supabase/ssr', () => ({ createServerClient: () => client() }))
jest.mock('@/lib/api/authGuards', () => ({
  getAuthenticatedUser: async () => currentUser,
  requireAdmin: async () => ({ user: currentUser, isAdmin, error: null }),
  getServiceRoleClient: () => client(),
}))
jest.mock('@/lib/notifications', () => ({
  triggerConsultationNotification: jest.fn(),
  triggerAppointmentNotification: jest.fn(),
  triggerPCCNotification: jest.fn(async () => undefined),
}))
jest.mock('@/lib/services/consultationService', () => ({
  consultationService: {
    createBooking: (...a: unknown[]) => mockCreateBooking(...a),
    getAllBookings: (...a: unknown[]) => mockGetAllBookings(...a),
    getBookingById: (...a: unknown[]) => mockGetBookingById(...a),
    updateBooking: (...a: unknown[]) => mockUpdateBooking(...a),
    getTimeSlots: async () => [
      { id: 's1', date: '2030-01-01', start_time: '09:00:00', status: 'available' },
      { id: 's2', date: '2030-01-01', start_time: '10:00:00', status: 'available' },
      { id: 's3', date: '2030-01-01', start_time: '11:00:00', status: 'available' },
    ],
    createTimeSlot: jest.fn(async (s: Row) => s),
    updateTimeSlot: jest.fn(async (_id: string, s: Row) => s),
    deleteTimeSlot: jest.fn(async () => undefined),
  },
}))

import * as consultation from '@/app/api/consultation/route'
import * as slots from '@/app/api/consultation/slots/route'
import { POST as bookMedical } from '@/app/api/book-appointment/route'
import { POST as applyPcc } from '@/app/api/police-verification/apply/route'

const jsonReq = (url: string, method: string, body?: unknown) =>
  Object.assign(
    new Request(url, { method, body: body === undefined ? undefined : JSON.stringify(body) }),
    { cookies: { getAll: () => [] } }
  ) as never

beforeEach(() => {
  jest.clearAllMocks()
  currentUser = { id: 'user-1', email: 'me@example.com' }
  isAdmin = false
  inserted = []
  tables = {
    journeys: [
      { id: EXEC_J, user_id: 'user-1', journey_type: 'IR1', subscription_tier: 'executive', status: 'in_progress' },
      { id: PREMIUM_J, user_id: 'user-1', journey_type: 'ir5', subscription_tier: 'premium', status: 'in_progress' },
      { id: OTHER_J, user_id: 'user-2', journey_type: 'IR1', subscription_tier: 'executive', status: 'in_progress' },
    ],
    user_profiles: [{ id: 'user-1', profile_details: { purchased_addons: [] } }],
  }
  mockCreateBooking.mockImplementation(async (b: Row) => ({ id: 'c-1', reference_id: 'REQ-1', ...b }))
  mockGetAllBookings.mockResolvedValue([])
})

const consultBody = {
  issue_category: 'General',
  case_stage: 'NVC',
  full_name: 'A',
  email: 'me@example.com',
  whatsapp_phone: '+1',
  case_summary: 'x',
  selected_slot: '2030-01-01T09:00:00Z',
}

describe('POST /api/consultation', () => {
  const post = (body: Row) => consultation.POST(jsonReq('http://x/api/consultation', 'POST', body))

  it('requires a signed-in user', async () => {
    currentUser = null
    const res = await post(consultBody)
    expect(res.status).toBe(401)
    expect(mockCreateBooking).not.toHaveBeenCalled()
  })

  it('a standalone booking is always unpaid, whatever the client sends', async () => {
    await post({ ...consultBody, payment_status: 'paid', status: 'confirmed' })
    expect(mockCreateBooking.mock.calls[0][0]).toMatchObject({
      payment_status: 'pending',
      status: 'pending_approval',
      source: 'standalone',
      user_id: 'user-1',
    })
  })

  it('no payment_status at all no longer means paid', async () => {
    await post(consultBody)
    expect(mockCreateBooking.mock.calls[0][0].payment_status).toBe('pending')
  })

  it("a forged journey tag (another user's journey) is refused", async () => {
    const res = await post({ ...consultBody, source: 'journey', journey_id: OTHER_J })
    expect(res.status).toBe(404)
    expect(mockCreateBooking).not.toHaveBeenCalled()
  })

  it('a journey whose plan lacks consultations is refused', async () => {
    const res = await post({ ...consultBody, source: 'journey', journey_id: PREMIUM_J })
    expect(res.status).toBe(403)
    expect(mockCreateBooking).not.toHaveBeenCalled()
  })

  it('a verified Executive journey books as paid', async () => {
    const res = await post({ ...consultBody, source: 'journey', journey_id: EXEC_J, journey_slug: 'ir1-journey' })
    expect(res.status).toBe(201)
    expect(mockCreateBooking.mock.calls[0][0]).toMatchObject({ payment_status: 'paid', source: 'journey' })
  })
})

describe('GET /api/consultation', () => {
  const get = () => consultation.GET(jsonReq('http://x/api/consultation', 'GET'))

  it('requires a signed-in user', async () => {
    currentUser = null
    expect((await get()).status).toBe(401)
    expect(mockGetAllBookings).not.toHaveBeenCalled()
  })

  it('a user only gets their own bookings', async () => {
    await get()
    expect(mockGetAllBookings.mock.calls[0][0].owner).toEqual({ userId: 'user-1', email: 'me@example.com' })
  })

  it('an admin gets every booking', async () => {
    isAdmin = true
    await get()
    expect(mockGetAllBookings.mock.calls[0][0].owner).toBeUndefined()
  })
})

describe('PUT /api/consultation', () => {
  const alt = new Date('2030-01-02T09:00:00Z')
  const put = (body: Row) => consultation.PUT(jsonReq('http://x/api/consultation?id=c-1', 'PUT', body))

  beforeEach(() => {
    mockGetBookingById.mockResolvedValue({
      id: 'c-1',
      user_id: 'user-1',
      status: 'alternatives_proposed',
      alternate_slots: [alt],
      admin_notes: 'keep me',
      reference_id: 'REQ-1',
    })
  })

  it('requires a signed-in user', async () => {
    currentUser = null
    expect((await put({ action: 'cancel' })).status).toBe(401)
    expect(mockUpdateBooking).not.toHaveBeenCalled()
  })

  it('a user cannot cancel or approve arbitrary bookings', async () => {
    expect((await put({ action: 'cancel' })).status).toBe(403)
    expect((await put({ action: 'approve', selected_slot: '2031-05-05T00:00:00Z' })).status).toBe(403)
    mockGetBookingById.mockResolvedValue({ id: 'c-1', user_id: 'user-2', status: 'alternatives_proposed', alternate_slots: [alt] })
    expect((await put({ action: 'approve', selected_slot: alt.toISOString() })).status).toBe(403)
    expect(mockUpdateBooking).not.toHaveBeenCalled()
  })

  it('a user can accept an alternative slot proposed on their own booking', async () => {
    const res = await put({ action: 'approve', selected_slot: alt.toISOString(), adminNotes: 'hijack' })
    expect(res.status).toBe(200)
    expect(mockUpdateBooking).toHaveBeenCalledWith(
      'c-1',
      expect.objectContaining({ status: 'confirmed', admin_notes: 'keep me' })
    )
  })

  it('an admin can run any action', async () => {
    isAdmin = true
    expect((await put({ action: 'cancel', adminNotes: 'n' })).status).toBe(200)
  })
})

describe('consultation slots', () => {
  it('only admins can create, edit or delete slots', async () => {
    const body = { date: '2030-01-01', start_time: '09:00', end_time: '10:00' }
    expect((await slots.POST(jsonReq('http://x/s', 'POST', body))).status).toBe(403)
    expect((await slots.PUT(jsonReq('http://x/s?id=s1', 'PUT', body))).status).toBe(403)
    expect((await slots.DELETE(jsonReq('http://x/s?id=s1', 'DELETE'))).status).toBe(403)
    currentUser = null
    expect((await slots.DELETE(jsonReq('http://x/s?id=s1', 'DELETE'))).status).toBe(401)
    currentUser = { id: 'admin' }
    isAdmin = true
    expect((await slots.POST(jsonReq('http://x/s', 'POST', body))).status).toBe(201)
  })

  it('a paid booking holds its slot; an abandoned unpaid draft does not', async () => {
    const old = new Date(Date.now() - 60 * 60 * 1000)
    mockGetAllBookings.mockResolvedValue([
      { selected_slot: '2030-01-01T09:00:00Z', status: 'pending_approval', payment_status: 'paid', created_at: old },
      { selected_slot: '2030-01-01T10:00:00Z', status: 'pending_approval', payment_status: 'pending', created_at: old },
      { selected_slot: '2030-01-01T11:00:00Z', status: 'pending_approval', payment_status: 'pending', created_at: new Date() },
    ])
    const res = await slots.GET(jsonReq('http://x/s', 'GET'))
    const byId = Object.fromEntries((await res.json()).map((s: Row) => [s.id, s.status]))
    expect(byId).toEqual({ s1: 'confirmed', s2: 'available', s3: 'confirmed' })
  })
})

describe('POST /api/book-appointment (Medical)', () => {
  const book = (body: Row) =>
    bookMedical(jsonReq('http://x/api/book-appointment', 'POST', { location: 'karachi', email: 'e', ...body }))
  const appointment = () => inserted.find((i) => i.table === 'appointments')?.row

  it('requires a signed-in user', async () => {
    currentUser = null
    expect((await book({})).status).toBe(401)
    expect(appointment()).toBeUndefined()
  })

  it('standalone is a hidden unpaid draft, whatever the client sends', async () => {
    await book({ source: 'standalone', awaitingPayment: false })
    expect(appointment()).toMatchObject({ awaiting_payment: true, payment_status: 'pending', user_id: 'user-1' })
  })

  it("a forged journey tag is refused before anything is saved", async () => {
    expect((await book({ source: 'journey', journey_id: OTHER_J })).status).toBe(404)
    expect((await book({ source: 'journey', journey_id: PREMIUM_J })).status).toBe(403)
    expect(appointment()).toBeUndefined()
  })

  it('a verified journey booking is visible and paid', async () => {
    expect((await book({ source: 'journey', journey_id: EXEC_J })).status).toBe(200)
    expect(appointment()).toMatchObject({ source: 'journey', awaiting_payment: false, payment_status: 'paid' })
  })
})

describe('POST /api/police-verification/apply (PCC)', () => {
  const apply = (body: Row) =>
    applyPcc(jsonReq('http://x/api/police-verification/apply', 'POST', { fullName: 'A', district: 'Karachi', ...body }))
  const request = () => inserted.find((i) => i.table === 'police_verification_requests')?.row

  it('requires a signed-in user and files under the session user, never the body', async () => {
    currentUser = null
    expect((await apply({ userId: 'user-2' })).status).toBe(401)
    currentUser = { id: 'user-1' }
    await apply({ userId: 'user-2' })
    expect(request()).toMatchObject({ user_id: 'user-1', awaiting_payment: true, payment_status: 'pending' })
  })

  it('a forged journey tag is refused; a verified one is paid', async () => {
    expect((await apply({ source: 'journey', journey_id: OTHER_J })).status).toBe(404)
    expect(request()).toBeUndefined()
    expect((await apply({ source: 'journey', journey_id: EXEC_J })).status).toBe(200)
    expect(request()).toMatchObject({ source: 'journey', awaiting_payment: false, payment_status: 'paid' })
  })
})
