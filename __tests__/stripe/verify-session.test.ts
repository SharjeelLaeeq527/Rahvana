/**
 * verify-session tests (the self-healing "source of truth" activation path).
 * Risk: paid session not activated, upgrade doesn't clean up the old sub, or the
 * sub id lands in the wrong payments column.
 */

import { NextRequest } from 'next/server'

let sessionData: any = null
const mockSessionRetrieve = jest.fn(() => Promise.resolve(sessionData))
const mockCancelDuplicates = jest.fn().mockResolvedValue([])

jest.mock('@/lib/stripe/config', () => ({
  stripe: {
    checkout: { sessions: { retrieve: (...a: any[]) => mockSessionRetrieve(...(a as [])) } },
    subscriptions: { cancel: jest.fn().mockResolvedValue({}) },
  },
}))

jest.mock('@/lib/stripe/subscriptionCleanup', () => ({
  cancelSupersededSubscriptions: (...a: any[]) => mockCancelDuplicates(...a),
}))

jest.mock('resend', () => ({ Resend: jest.fn(() => ({ emails: { send: jest.fn() } })) }))
jest.mock('@/lib/services/consultationService', () => ({
  consultationService: { createBooking: jest.fn().mockResolvedValue({}) },
}))
jest.mock('@/lib/payments/addon-purchase-ledger', () => ({
  buildAddonPurchaseUpdate: jest.fn(() => ({ alreadyProcessed: false, profileDetails: {} })),
}))

let profile: any = null
const updateSpy = jest.fn(() => makeChain())

function makeChain(): any {
  const o: any = {}
  for (const m of ['eq', 'neq', 'in', 'order']) o[m] = () => makeChain()
  o.select = () => makeChain()
  o.single = () => Promise.resolve({ data: profile, error: null })
  o.maybeSingle = () => Promise.resolve({ data: null, error: null })
  o.then = (res: any) => res({ data: null, error: null }) // awaitable
  return o
}

jest.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: () => ({
      select: () => makeChain(),
      update: (...a: any[]) => {
        updateSpy(...a)
        return makeChain()
      },
    }),
  }),
}))

import { GET } from '@/app/api/stripe/verify-session/route'

function makeRequest(sessionId?: string) {
  const url = sessionId
    ? `http://localhost/api/stripe/verify-session?session_id=${sessionId}`
    : 'http://localhost/api/stripe/verify-session'
  return new NextRequest(url)
}

beforeEach(() => {
  jest.clearAllMocks()
  profile = {
    subscription_tier: 'free',
    subscription_status: 'inactive',
    profile_details: { stripe_subscription_id: null, purchased_addons: [] },
    stripe_customer_id: 'cus_1',
  }
})

describe('verify-session — validation', () => {
  it('returns 400 when session_id is missing', async () => {
    const res = await GET(makeRequest())
    expect(res.status).toBe(400)
  })

  it('does not activate when payment is not complete', async () => {
    sessionData = { status: 'open', payment_status: 'unpaid', metadata: { user_id: 'user-1', product_type: 'journey_plan', product_id: 'premium' } }
    const res = await GET(makeRequest('cs_1'))
    const body = await res.json()
    expect(body.activated).toBe(false)
  })
})

describe('verify-session — journey plan activation', () => {
  it('activates an upgrade, keeps the new sub, and cleans up duplicates', async () => {
    sessionData = {
      id: 'cs_1', status: 'complete', payment_status: 'paid',
      customer: 'cus_1', subscription: 'sub_new', payment_intent: null,
      metadata: {
        user_id: 'user-1', product_type: 'journey_plan', product_id: 'premium',
        is_upgrade: 'true', old_subscription_id: 'sub_old', visa_category: 'IR-1', addons: '[]',
      },
    }
    const res = await GET(makeRequest('cs_1'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.activated).toBe(true)
    expect(body.tier).toBe('premium')

    // Profile activated to premium
    expect(updateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ subscription_tier: 'premium', subscription_status: 'active' })
    )
    // Cleanup keeps the just-paid subscription
    expect(mockCancelDuplicates).toHaveBeenCalledWith({
      customerId: 'cus_1', keepSubId: 'sub_new', visaCategory: 'IR-1',
      isAddCandidate: false, oldSubscriptionId: 'sub_old', logPrefix: '[verify-session]',
    })
    // Sub id written to its own column, not stripe_payment_id
    const paymentsUpdate = updateSpy.mock.calls.find(
      (c: any[]) => c[0] && 'stripe_subscription_id' in c[0]
    )
    expect(paymentsUpdate?.[0]).toEqual(
      expect.objectContaining({ status: 'succeeded', stripe_subscription_id: 'sub_new' })
    )
    expect(paymentsUpdate?.[0].stripe_payment_id).toBeUndefined()
  })

  it('is idempotent: re-running on an already-active same-tier plan keeps existing sub', async () => {
    profile = {
      subscription_tier: 'premium', subscription_status: 'active',
      profile_details: { stripe_subscription_id: 'sub_existing', purchased_addons: [] },
      stripe_customer_id: 'cus_1',
    }
    sessionData = {
      id: 'cs_1', status: 'complete', payment_status: 'paid',
      customer: 'cus_1', subscription: 'sub_existing', payment_intent: null,
      metadata: { user_id: 'user-1', product_type: 'journey_plan', product_id: 'premium', addons: '[]' },
    }
    const res = await GET(makeRequest('cs_1'))
    const body = await res.json()
    expect(body.activated).toBe(true)
    expect(mockCancelDuplicates).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'cus_1', keepSubId: 'sub_existing', oldSubscriptionId: null })
    )
  })
})
