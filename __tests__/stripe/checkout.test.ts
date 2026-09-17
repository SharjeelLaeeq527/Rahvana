/**
 * Critical checkout tests.
 * Risk: user buys a lower tier (downgrade), buys the same tier twice, bypasses the
 * tier guard on a DB<->Stripe desync, a second Stripe customer gets created when a
 * lookup fails (dup-sub hole), or a past_due user re-buys instead of recovering.
 */

import { NextRequest } from 'next/server'

// Mutable DB profile the supabase mock returns (read at call-time).
let mockTier = 'free'
let mockStatus = 'inactive'

jest.mock('@/lib/api/authGuards', () => ({
  getAuthenticatedUser: jest.fn().mockResolvedValue({ id: 'user-123', email: 'test@test.com' }),
}))

// Deterministic lock (its own unit tests cover token/ownership behavior).
jest.mock('@/lib/stripe/checkoutLock', () => ({
  acquireCheckoutLock: jest.fn().mockResolvedValue({ ok: true, token: 'tok' }),
  releaseCheckoutLock: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    auth: {
      admin: {
        getUserById: () =>
          Promise.resolve({ data: { user: { id: 'user-123', email: 'test@test.com' } }, error: null }),
      },
    },
    from: () => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: () =>
        Promise.resolve({
          data: {
            subscription_tier: mockTier,
            subscription_status: mockStatus,
            profile_details: { stripe_subscription_id: null, purchased_addons: [] },
            stripe_customer_id: null,
          },
          error: null,
        }),
      update: jest.fn(() => ({ eq: jest.fn().mockResolvedValue({ error: null }) })),
      insert: jest.fn().mockResolvedValue({ data: {}, error: null }),
    }),
  }),
}))

// Async-iterable helper for stripe.subscriptions.list (auto-pagination).
function asyncSubs(subs: any[]) {
  return {
    async *[Symbol.asyncIterator]() {
      for (const s of subs) yield s
    },
  }
}

const mockCustomersSearch = jest.fn().mockResolvedValue({ data: [] })
const mockCustomersList = jest.fn().mockResolvedValue({ data: [] })
const mockSubsList = jest.fn(() => asyncSubs([]))

jest.mock('@/lib/stripe/config', () => ({
  stripe: {
    customers: {
      search: (...a: any[]) => mockCustomersSearch(...a),
      list: (...a: any[]) => mockCustomersList(...a),
      create: jest.fn().mockResolvedValue({ id: 'cus_new' }),
    },
    subscriptions: {
      list: (...a: any[]) => mockSubsList(...a),
      cancel: jest.fn().mockResolvedValue({}),
    },
    checkout: {
      sessions: { create: jest.fn().mockResolvedValue({ id: 'cs_1', url: 'https://checkout.stripe.com/x' }) },
    },
  },
  STRIPE_PRICES: {
    BASIC: 'price_basic', PREMIUM: 'price_premium', EXECUTIVE: 'price_exec',
    BASIC_MONTHLY: 'price_basic_m', PREMIUM_MONTHLY: 'price_premium_m', EXECUTIVE_MONTHLY: 'price_exec_m',
  },
  PRODUCTS: {
    BASIC:     { name: 'Basic', price: 349, monthlyPrice: 29.08, priceId: 'price_basic', recurringPriceId: 'price_basic_m', features: [] },
    PREMIUM:   { name: 'Premium', price: 699, monthlyPrice: 58.25, priceId: 'price_premium', recurringPriceId: 'price_premium_m', features: [] },
    EXECUTIVE: { name: 'Executive', price: 1099, monthlyPrice: 91.58, priceId: 'price_exec', recurringPriceId: 'price_exec_m', features: [] },
    ADDONS: {},
  },
}))

jest.mock('@/lib/plan/reconcile', () => ({
  reconcileUserPlan: jest.fn().mockResolvedValue({ tier: 'free', reconciled: false }),
}))

let mockCustomerId: string | null = null
jest.mock('@/lib/services/paymentService', () => ({
  paymentService: {
    getUserSubscription: jest.fn(() =>
      Promise.resolve(mockCustomerId ? { stripe_customer_id: mockCustomerId } : null)
    ),
    createPayment: jest.fn().mockResolvedValue({ id: 'pay_123' }),
    updatePayment: jest.fn().mockResolvedValue({}),
  },
}))

jest.mock('@/app/(main)/pricing/data/pricing', () => ({ VISA_CATEGORIES: [], ADDONS: [] }))

import { POST } from '@/app/api/stripe/checkout/route'

function makeRequest(body: object) {
  return new NextRequest('http://localhost/api/stripe/checkout', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  })
}

function resetAll() {
  mockTier = 'free'
  mockStatus = 'inactive'
  mockCustomerId = null
  mockCustomersSearch.mockResolvedValue({ data: [] })
  mockCustomersList.mockResolvedValue({ data: [] })
  mockSubsList.mockImplementation(() => asyncSubs([]))
}

// --- Downgrade / duplicate guards (DB-driven) ---

describe('Checkout — downgrade guard', () => {
  beforeEach(resetAll)

  it('rejects downgrade: premium -> basic', async () => {
    mockTier = 'premium'; mockStatus = 'active'
    const res = await POST(makeRequest({ productTier: 'basic' }))
    expect(res.status).toBe(400)
    expect((await res.json()).error).toMatch(/downgrade/i)
  })

  it('rejects downgrade: executive -> premium', async () => {
    mockTier = 'executive'; mockStatus = 'active'
    expect((await POST(makeRequest({ productTier: 'premium' }))).status).toBe(400)
  })
})

describe('Checkout — duplicate purchase guard', () => {
  beforeEach(resetAll)

  it('rejects same tier: premium -> premium (alreadyOwned)', async () => {
    mockTier = 'premium'; mockStatus = 'active'
    const res = await POST(makeRequest({ productTier: 'premium' }))
    expect(res.status).toBe(400)
    expect((await res.json()).alreadyOwned).toBe(true)
  })
})

// --- Allowed purchases ---

describe('Checkout — allowed purchases', () => {
  beforeEach(resetAll)

  it('allows upgrade: basic -> premium', async () => {
    mockTier = 'basic'; mockStatus = 'active'
    expect((await POST(makeRequest({ productTier: 'premium' }))).status).toBe(200)
  })

  it('allows first purchase: free -> basic', async () => {
    expect((await POST(makeRequest({ productTier: 'basic' }))).status).toBe(200)
  })
})

// --- Stripe-aware guard: DB desync (the ordering fix) ---

describe('Checkout — Stripe is the source of truth on DB desync', () => {
  beforeEach(resetAll)

  it('blocks a duplicate when DB says free but Stripe has a live premium sub', async () => {
    // DB profile is stale (free/inactive) and has NO customer id...
    mockTier = 'free'; mockStatus = 'inactive'; mockCustomerId = null
    // ...but the existing customer is found via Stripe search...
    mockCustomersSearch.mockResolvedValue({ data: [{ id: 'cus_existing' }] })
    // ...and that customer already holds a live premium subscription.
    mockSubsList.mockImplementation(() =>
      asyncSubs([{ id: 'sub_live', status: 'active', metadata: { tier: 'premium' }, items: { data: [] } }])
    )
    const res = await POST(makeRequest({ productTier: 'premium' }))
    expect(res.status).toBe(400) // dup guard fired off Stripe, not the stale DB
    expect((await res.json()).alreadyOwned).toBe(true)
  })

  it('still allows an upgrade when Stripe shows a lower live tier', async () => {
    mockCustomerId = 'cus_existing'
    mockSubsList.mockImplementation(() =>
      asyncSubs([{ id: 'sub_live', status: 'active', metadata: { tier: 'basic' }, items: { data: [] } }])
    )
    expect((await POST(makeRequest({ productTier: 'premium' }))).status).toBe(200)
  })
})

// --- Fail-closed customer resolution ---

describe('Checkout — fail closed when Stripe lookups error', () => {
  beforeEach(resetAll)

  it('returns 503 (not a new customer) when customer search throws on a subscription', async () => {
    mockCustomerId = null
    mockCustomersSearch.mockRejectedValue(new Error('stripe down'))
    const res = await POST(makeRequest({ productTier: 'basic' }))
    expect(res.status).toBe(503)
  })

  it('returns 503 when subscription listing throws for an existing customer', async () => {
    mockCustomerId = 'cus_existing'
    mockSubsList.mockImplementation(() => { throw new Error('list down') })
    const res = await POST(makeRequest({ productTier: 'basic' }))
    expect(res.status).toBe(503)
  })
})

// --- past_due recovery ---

describe('Checkout — past_due recovers instead of re-buying', () => {
  beforeEach(resetAll)

  it('returns 409 with portal:true for a same-tier past_due sub', async () => {
    mockCustomerId = 'cus_existing'
    mockSubsList.mockImplementation(() =>
      asyncSubs([{ id: 'sub_pd', status: 'past_due', metadata: { tier: 'premium' }, items: { data: [] } }])
    )
    const res = await POST(makeRequest({ productTier: 'premium' }))
    expect(res.status).toBe(409)
    const body = await res.json()
    expect(body.portal).toBe(true)
    expect(body.recover).toBe(true)
  })
})
