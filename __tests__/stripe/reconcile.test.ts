/**
 * Critical reconciliation tests.
 * Risk: user paid but plan not activated (webhook missed), wrong tier applied, or
 * a CANCELLED user resurrected from a historical payment row. reconcileUserPlan()
 * is the self-healing fallback — it must get the tier right AND refuse to grant
 * access that Stripe no longer backs (resurrection guard).
 */

import { reconcileUserPlan } from '@/lib/plan/reconcile'

// --- Mocks ---

const mockSessionRetrieve = jest.fn()
const mockSubRetrieve = jest.fn()

jest.mock('stripe', () =>
  jest.fn(() => ({
    checkout: { sessions: { retrieve: mockSessionRetrieve } },
    subscriptions: { retrieve: mockSubRetrieve },
  }))
)

type PaymentFixture = {
  id?: string
  product_id: string
  status: string
  stripe_checkout_session_id: string
  stripe_subscription_id?: string | null
  stripe_payment_id?: string | null
  metadata?: Record<string, any>
}

function buildAdminClient(overrides: {
  profileTier?: string
  profileStatus?: string
  stripeSubId?: string
  payments?: PaymentFixture[]
} = {}) {
  const profile = {
    subscription_tier: overrides.profileTier ?? 'free',
    subscription_status: overrides.profileStatus ?? 'inactive',
    profile_details: { stripe_subscription_id: overrides.stripeSubId ?? null },
  }

  const payments = overrides.payments ?? []
  const profileUpdate = jest.fn().mockResolvedValue({ error: null })
  const paymentsUpdate = jest.fn().mockResolvedValue({ error: null })

  return {
    _profileUpdate: profileUpdate,
    _paymentsUpdate: paymentsUpdate,
    from: jest.fn((table: string) => {
      if (table === 'user_profiles') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: profile, error: null }),
          update: jest.fn(() => ({ eq: profileUpdate })),
        }
      }
      if (table === 'payments') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          in: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue({ data: payments, error: null }),
          update: jest.fn(() => ({ eq: paymentsUpdate })),
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

const liveSub = (status = 'active') => mockSubRetrieve.mockResolvedValue({ status })

// --- Tests ---

describe('reconcileUserPlan', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    liveSub('active') // default: the backing subscription is live
  })

  it('returns current tier without change when no payments exist', async () => {
    const admin = buildAdminClient({ profileTier: 'free', payments: [] })
    const result = await reconcileUserPlan(admin as any, 'user-123')
    expect(result.tier).toBe('free')
    expect(result.reconciled).toBe(false)
  })

  it('upgrades tier when a succeeded payment (backed by a live sub) is higher', async () => {
    const admin = buildAdminClient({
      profileTier: 'basic',
      profileStatus: 'active',
      payments: [
        {
          product_id: 'premium',
          status: 'succeeded',
          stripe_checkout_session_id: 'cs_123',
          stripe_subscription_id: 'sub_live',
        },
      ],
    })
    const result = await reconcileUserPlan(admin as any, 'user-123')
    expect(mockSubRetrieve).toHaveBeenCalledWith('sub_live')
    expect(result.tier).toBe('premium')
    expect(result.reconciled).toBe(true)
    expect(result.previousTier).toBe('basic')
  })

  it('does not downgrade when profile tier is already higher than payments', async () => {
    const admin = buildAdminClient({
      profileTier: 'executive',
      profileStatus: 'active',
      payments: [
        { product_id: 'basic', status: 'succeeded', stripe_checkout_session_id: 'cs_456', stripe_subscription_id: 'sub_live' },
      ],
    })
    const result = await reconcileUserPlan(admin as any, 'user-123')
    expect(result.tier).toBe('executive')
    expect(result.reconciled).toBe(false)
  })

  it('verifies pending payment with Stripe and activates if paid + sub live', async () => {
    mockSessionRetrieve.mockResolvedValue({
      status: 'complete',
      payment_status: 'paid',
      subscription: 'sub_from_session',
      metadata: { product_id: 'premium', user_id: 'user-123' },
    })
    const admin = buildAdminClient({
      profileTier: 'free',
      payments: [
        { id: 'pay_1', product_id: 'premium', status: 'pending', stripe_checkout_session_id: 'cs_pending' },
      ],
    })
    const result = await reconcileUserPlan(admin as any, 'user-123')
    expect(mockSessionRetrieve).toHaveBeenCalledWith('cs_pending')
    expect(mockSubRetrieve).toHaveBeenCalledWith('sub_from_session')
    expect(result.tier).toBe('premium')
    expect(result.reconciled).toBe(true)
    // marks the pending payment succeeded AND writes the sub id to its own column
    expect(admin._paymentsUpdate).toHaveBeenCalled()
  })

  it('ignores pending payment when Stripe confirms it is not paid', async () => {
    mockSessionRetrieve.mockResolvedValue({
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

  it('reactivates same tier when status is not active (sub still live)', async () => {
    const admin = buildAdminClient({
      profileTier: 'premium',
      profileStatus: 'past_due',
      payments: [
        { product_id: 'premium', status: 'succeeded', stripe_checkout_session_id: 'cs_789', stripe_subscription_id: 'sub_live' },
      ],
    })
    const result = await reconcileUserPlan(admin as any, 'user-123')
    expect(result.tier).toBe('premium')
    expect(result.reconciled).toBe(true)
  })

  // --- Resurrection guard ---

  it('RESURRECTION GUARD: does NOT reactivate when the backing sub is canceled', async () => {
    liveSub('canceled') // Stripe says the sub is gone
    const admin = buildAdminClient({
      profileTier: 'free',
      profileStatus: 'canceled',
      payments: [
        { product_id: 'premium', status: 'succeeded', stripe_checkout_session_id: 'cs_hist', stripe_subscription_id: 'sub_dead' },
      ],
    })
    const result = await reconcileUserPlan(admin as any, 'user-123')
    expect(result.tier).toBe('free')
    expect(result.reconciled).toBe(false)
    expect(admin._profileUpdate).not.toHaveBeenCalled()
  })

  it('RESURRECTION GUARD: fails safe (no reactivation) when Stripe retrieve throws', async () => {
    mockSubRetrieve.mockRejectedValue(new Error('No such subscription'))
    const admin = buildAdminClient({
      profileTier: 'free',
      payments: [
        { product_id: 'premium', status: 'succeeded', stripe_checkout_session_id: 'cs_x', stripe_subscription_id: 'sub_ghost' },
      ],
    })
    const result = await reconcileUserPlan(admin as any, 'user-123')
    expect(result.reconciled).toBe(false)
  })

  it('RESURRECTION GUARD: fails safe when there is no sub id to verify at all', async () => {
    const admin = buildAdminClient({
      profileTier: 'free',
      payments: [
        { product_id: 'premium', status: 'succeeded', stripe_checkout_session_id: 'cs_nosub' },
      ],
    })
    const result = await reconcileUserPlan(admin as any, 'user-123')
    expect(result.reconciled).toBe(false)
    expect(mockSubRetrieve).not.toHaveBeenCalled()
  })

  it('reads the sub id from the stripe_subscription_id column (new data model)', async () => {
    const admin = buildAdminClient({
      profileTier: 'free',
      payments: [
        {
          product_id: 'executive',
          status: 'succeeded',
          stripe_checkout_session_id: 'cs_col',
          stripe_subscription_id: 'sub_column',
          stripe_payment_id: 'pi_should_be_ignored',
        },
      ],
    })
    await reconcileUserPlan(admin as any, 'user-123')
    expect(mockSubRetrieve).toHaveBeenCalledWith('sub_column')
  })
})
