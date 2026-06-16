/**
 * Critical reconciliation tests.
 * Risk: user paid but plan not activated (webhook missed), or wrong tier applied.
 * reconcileUserPlan() is the self-healing fallback — it must get the tier right.
 */

import { reconcileUserPlan } from '@/lib/plan/reconcile'

// --- Mocks ---

const mockStripeSessionRetrieve = jest.fn()
jest.mock('stripe', () =>
  jest.fn(() => ({
    checkout: {
      sessions: { retrieve: mockStripeSessionRetrieve },
    },
  }))
)

function buildAdminClient(overrides: {
  profileTier?: string
  profileStatus?: string
  stripeSubId?: string
  payments?: Array<{ product_id: string; status: string; stripe_checkout_session_id: string }>
} = {}) {
  const profile = {
    subscription_tier: overrides.profileTier ?? 'free',
    subscription_status: overrides.profileStatus ?? 'inactive',
    profile_details: {
      stripe_subscription_id: overrides.stripeSubId ?? null,
    },
  }

  const payments = overrides.payments ?? []

  const mockUpdate = jest.fn().mockResolvedValue({ error: null })

  return {
    _mockUpdate: mockUpdate,
    from: jest.fn((table: string) => {
      if (table === 'user_profiles') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: profile, error: null }),
          update: jest.fn(() => ({ eq: mockUpdate })),
        }
      }
      if (table === 'payments') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          in: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue({ data: payments, error: null }),
        }
      }
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: null }),
      }
    }),
  }
}

// --- Tests ---

describe('reconcileUserPlan', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns current tier without change when no payments exist', async () => {
    const admin = buildAdminClient({ profileTier: 'free', payments: [] })

    const result = await reconcileUserPlan(admin as any, 'user-123')

    expect(result.tier).toBe('free')
    expect(result.reconciled).toBe(false)
  })

  it('upgrades tier when succeeded payment is higher than current profile tier', async () => {
    const admin = buildAdminClient({
      profileTier: 'basic',
      profileStatus: 'active',
      payments: [
        { product_id: 'premium', status: 'succeeded', stripe_checkout_session_id: 'cs_123' },
      ],
    })

    const result = await reconcileUserPlan(admin as any, 'user-123')

    expect(result.tier).toBe('premium')
    expect(result.reconciled).toBe(true)
    expect(result.previousTier).toBe('basic')
  })

  it('does not downgrade when profile tier is already higher than payments', async () => {
    const admin = buildAdminClient({
      profileTier: 'executive',
      profileStatus: 'active',
      payments: [
        { product_id: 'basic', status: 'succeeded', stripe_checkout_session_id: 'cs_456' },
      ],
    })

    const result = await reconcileUserPlan(admin as any, 'user-123')

    expect(result.tier).toBe('executive')
    expect(result.reconciled).toBe(false)
  })

  it('verifies pending payment with Stripe and activates if paid', async () => {
    mockStripeSessionRetrieve.mockResolvedValue({
      status: 'complete',
      payment_status: 'paid',
      metadata: { product_id: 'premium', user_id: 'user-123' },
    })

    const admin = buildAdminClient({
      profileTier: 'free',
      payments: [
        { product_id: 'premium', status: 'pending', stripe_checkout_session_id: 'cs_pending' },
      ],
    })

    const result = await reconcileUserPlan(admin as any, 'user-123')

    expect(mockStripeSessionRetrieve).toHaveBeenCalledWith('cs_pending')
    expect(result.tier).toBe('premium')
    expect(result.reconciled).toBe(true)
  })

  it('ignores pending payment when Stripe confirms it is not paid', async () => {
    mockStripeSessionRetrieve.mockResolvedValue({
      status: 'expired',
      payment_status: 'unpaid',
      metadata: { product_id: 'premium', user_id: 'user-123' },
    })

    const admin = buildAdminClient({
      profileTier: 'free',
      payments: [
        { product_id: 'premium', status: 'pending', stripe_checkout_session_id: 'cs_expired' },
      ],
    })

    const result = await reconcileUserPlan(admin as any, 'user-123')

    expect(result.tier).toBe('free')
    expect(result.reconciled).toBe(false)
  })

  it('reactivates same tier when status is not active', async () => {
    const admin = buildAdminClient({
      profileTier: 'premium',
      profileStatus: 'past_due',
      payments: [
        { product_id: 'premium', status: 'succeeded', stripe_checkout_session_id: 'cs_789' },
      ],
    })

    const result = await reconcileUserPlan(admin as any, 'user-123')

    // same tier but status was bad → should reactivate
    expect(result.tier).toBe('premium')
    expect(result.reconciled).toBe(true)
  })
})
