/**
 * Critical checkout tests.
 * Risk: user buys a lower tier (downgrade), buys same tier twice, bypasses tier guard.
 */

import { NextRequest } from 'next/server'

// Mutable vars — closures in mock factory access these at call-time (during tests),
// not at factory creation time, so TDZ is not an issue.
let mockTier = 'free'
let mockStatus = 'inactive'

jest.mock('@supabase/supabase-js', () => ({
  // Regular function (not jest.fn) so createClient always returns a fresh client
  // with closures that read mockTier/mockStatus at call-time
  createClient: () => ({
    auth: {
      admin: {
        getUserById: () =>
          Promise.resolve({
            data: { user: { id: 'user-123', email: 'test@test.com' } },
            error: null,
          }),
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
      insert: jest.fn().mockResolvedValue({ data: {}, error: null }),
    }),
  }),
}))

jest.mock('@/lib/stripe/config', () => ({
  stripe: {
    customers: {
      create: jest.fn().mockResolvedValue({ id: 'cus_new' }),
      list: jest.fn().mockResolvedValue({ data: [] }),
    },
    checkout: {
      sessions: {
        create: jest.fn().mockResolvedValue({ url: 'https://checkout.stripe.com/test' }),
      },
    },
  },
  PRODUCTS: {
    BASIC:     { price: 349, monthlyPrice: 29.08, priceId: 'price_basic_annual', recurringPriceId: 'price_1basic_monthly' },
    PREMIUM:   { price: 699, monthlyPrice: 58.25, priceId: 'price_premium_annual', recurringPriceId: 'price_1premium_monthly' },
    EXECUTIVE: { price: 1099, monthlyPrice: 91.58, priceId: 'price_exec_annual', recurringPriceId: 'price_1exec_monthly' },
  },
}))

jest.mock('@/lib/plan/reconcile', () => ({
  reconcileUserPlan: jest.fn().mockResolvedValue({ tier: 'free', reconciled: false }),
}))

jest.mock('@/lib/services/paymentService', () => ({
  paymentService: {
    getUserSubscription: jest.fn().mockResolvedValue(null),
    createPayment: jest.fn().mockResolvedValue({ id: 'pay_123' }),
    updatePayment: jest.fn().mockResolvedValue({}),
  },
}))

jest.mock('@/app/(main)/pricing/data/pricing', () => ({ VISA_CATEGORIES: [] }))

import { POST } from '@/app/api/stripe/checkout/route'

function makeRequest(body: object) {
  return new NextRequest('http://localhost/api/stripe/checkout', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  })
}

// --- Downgrade guard ---

describe('Checkout — downgrade guard', () => {
  beforeEach(() => { mockTier = 'free'; mockStatus = 'inactive' })

  it('rejects downgrade: premium → basic', async () => {
    mockTier = 'premium'; mockStatus = 'active'
    const res = await POST(makeRequest({ userId: 'user-123', productTier: 'basic' }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/downgrade/i)
  })

  it('rejects downgrade: executive → premium', async () => {
    mockTier = 'executive'; mockStatus = 'active'
    const res = await POST(makeRequest({ userId: 'user-123', productTier: 'premium' }))
    expect(res.status).toBe(400)
  })

  it('rejects downgrade: executive → basic', async () => {
    mockTier = 'executive'; mockStatus = 'active'
    const res = await POST(makeRequest({ userId: 'user-123', productTier: 'basic' }))
    expect(res.status).toBe(400)
  })
})

// --- Duplicate purchase guard ---

describe('Checkout — duplicate purchase guard', () => {
  beforeEach(() => { mockTier = 'free'; mockStatus = 'inactive' })

  it('rejects same tier: premium → premium', async () => {
    mockTier = 'premium'; mockStatus = 'active'
    const res = await POST(makeRequest({ userId: 'user-123', productTier: 'premium' }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.alreadyOwned).toBe(true)
  })

  it('rejects same tier: basic → basic', async () => {
    mockTier = 'basic'; mockStatus = 'active'
    const res = await POST(makeRequest({ userId: 'user-123', productTier: 'basic' }))
    expect(res.status).toBe(400)
  })
})

// --- Allowed purchases ---

describe('Checkout — allowed purchases', () => {
  beforeEach(() => { mockTier = 'free'; mockStatus = 'inactive' })

  it('allows upgrade: basic → premium', async () => {
    mockTier = 'basic'; mockStatus = 'active'
    const res = await POST(makeRequest({ userId: 'user-123', productTier: 'premium', isUpgrade: true }))
    expect(res.status).toBe(200)
  })

  it('allows first purchase: free → basic', async () => {
    const res = await POST(makeRequest({ userId: 'user-123', productTier: 'basic' }))
    expect(res.status).toBe(200)
  })

  it('allows upgrade: free → executive', async () => {
    const res = await POST(makeRequest({ userId: 'user-123', productTier: 'executive' }))
    expect(res.status).toBe(200)
  })
})

// --- Tier ranking logic (pure, no HTTP) ---

describe('Tier ranking — TIER_RANK values', () => {
  const TIER_RANK: Record<string, number> = { free: 0, basic: 1, premium: 2, executive: 3 }

  it('free < basic < premium < executive', () => {
    expect(TIER_RANK.free).toBeLessThan(TIER_RANK.basic)
    expect(TIER_RANK.basic).toBeLessThan(TIER_RANK.premium)
    expect(TIER_RANK.premium).toBeLessThan(TIER_RANK.executive)
  })

  it('all four tiers have unique ranks', () => {
    const ranks = Object.values(TIER_RANK)
    expect(new Set(ranks).size).toBe(4)
  })
})
