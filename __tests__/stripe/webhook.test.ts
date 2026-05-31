/**
 * Critical webhook tests.
 * Risk: fake webhooks, missed plan upgrades, wrong status on failure/cancellation.
 */

import { NextRequest } from 'next/server'

// Mock @/lib/stripe/config before importing the route (avoids hoisting issues)
jest.mock('@/lib/stripe/config', () => ({
  stripe: {
    webhooks: { constructEvent: jest.fn() },
    subscriptions: { cancel: jest.fn().mockResolvedValue({}) },
  },
}))

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: buildUserProfile(), error: null }),
    })),
  })),
}))

jest.mock('@/lib/services/paymentService', () => ({
  paymentService: {
    getPaymentBySessionId: jest.fn().mockResolvedValue(null),
    createPayment: jest.fn().mockResolvedValue({ id: 'pay_123' }),
    updatePayment: jest.fn().mockResolvedValue({}),
    updateUserSubscription: jest.fn().mockResolvedValue({}),
    getUserSubscription: jest.fn().mockResolvedValue(null),
  },
}))

jest.mock('resend', () => ({
  Resend: jest.fn(() => ({
    emails: { send: jest.fn().mockResolvedValue({ id: 'email_123' }) },
  })),
}))

// Get mock references AFTER jest.mock (no hoisting issue this way)
import * as stripeConfig from '@/lib/stripe/config'
import { createClient } from '@supabase/supabase-js'
import { POST } from '@/app/api/stripe/webhook/route'

const mockConstructEvent = (stripeConfig.stripe as any).webhooks.constructEvent as jest.Mock
const mockSupabaseSingle = jest.fn()

// --- Helpers ---

function makeRequest(body: object, signature = 'valid-sig') {
  return new NextRequest('http://localhost/api/stripe/webhook', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'stripe-signature': signature },
  })
}

function setProfile(profile: Partial<ReturnType<typeof buildUserProfile>>) {
  mockSupabaseSingle.mockResolvedValue({ data: { ...buildUserProfile(), ...profile }, error: null })
  ;(createClient as jest.Mock).mockReturnValue({
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: mockSupabaseSingle,
    })),
  })
}

// --- Tests ---

describe('Webhook — signature validation', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns 400 when stripe-signature header is missing', async () => {
    const req = new NextRequest('http://localhost/api/stripe/webhook', {
      method: 'POST',
      body: '{}',
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 when signature is invalid', async () => {
    mockConstructEvent.mockImplementation(() => {
      throw new Error('No signatures found matching the expected signature')
    })
    const res = await POST(makeRequest({}, 'bad-sig'))
    expect(res.status).toBe(400)
  })

  it('returns 200 when signature is valid', async () => {
    mockConstructEvent.mockReturnValue({
      type: 'checkout.session.completed',
      data: { object: buildCheckoutSession() },
    })
    setProfile({ subscription_tier: 'free' })
    const res = await POST(makeRequest({}))
    expect(res.status).toBe(200)
  })
})

describe('Webhook — invoice.payment_failed', () => {
  beforeEach(() => jest.clearAllMocks())

  it('processes payment_failed event without crashing', async () => {
    mockConstructEvent.mockReturnValue({
      type: 'invoice.payment_failed',
      data: {
        object: { customer: 'cus_test123', subscription: 'sub_test123' },
      },
    })
    setProfile({ subscription_tier: 'premium', subscription_status: 'active' })
    const res = await POST(makeRequest({}))
    expect(res.status).toBe(200)
  })
})

describe('Webhook — customer.subscription.deleted', () => {
  beforeEach(() => jest.clearAllMocks())

  it('processes subscription.deleted event without crashing', async () => {
    mockConstructEvent.mockReturnValue({
      type: 'customer.subscription.deleted',
      data: { object: { id: 'sub_active_123', customer: 'cus_test123' } },
    })
    setProfile({
      subscription_tier: 'premium',
      subscription_status: 'active',
      profile_details: { stripe_subscription_id: 'sub_active_123', purchased_addons: [] },
    })
    const res = await POST(makeRequest({}))
    expect(res.status).toBe(200)
  })

  it('does NOT downgrade when a different subscription is deleted', async () => {
    const mockUpdate = jest.fn().mockReturnThis()
    const mockEq = jest.fn().mockResolvedValue({ error: null })
    ;(createClient as jest.Mock).mockReturnValue({
      from: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        update: mockUpdate,
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: buildUserProfile({
            subscription_tier: 'executive',
            profile_details: { stripe_subscription_id: 'sub_new_789', purchased_addons: [] },
          }),
          error: null,
        }),
      })),
    })

    mockConstructEvent.mockReturnValue({
      type: 'customer.subscription.deleted',
      data: { object: { id: 'sub_old_456', customer: 'cus_test123' } },
    })

    await POST(makeRequest({}))

    // Check that no update was called with free tier
    const updateCalls = mockUpdate.mock.calls
    const downgradedToFree = updateCalls.some(
      (args) => args[0] && JSON.stringify(args[0]).includes('"free"')
    )
    expect(downgradedToFree).toBe(false)
  })
})

// --- Builders ---

function buildCheckoutSession() {
  return {
    id: 'cs_test_123',
    status: 'complete',
    payment_status: 'paid',
    customer: 'cus_test123',
    subscription: 'sub_test123',
    metadata: {
      user_id: 'user-abc',
      product_type: 'journey_plan',
      product_id: 'premium',
      product_name: 'Premium Plan',
      visa_category: 'IR-1',
      is_upgrade: 'false',
      addons: '[]',
    },
  }
}

function buildUserProfile(overrides: Partial<{
  subscription_tier: string
  subscription_status: string
  profile_details: Record<string, any>
}> = {}) {
  return {
    id: 'user-abc',
    subscription_tier: 'free',
    subscription_status: 'inactive',
    stripe_customer_id: 'cus_test123',
    profile_details: {
      active_plan: null,
      stripe_subscription_id: null,
      purchased_addons: [],
    },
    ...overrides,
  }
}
