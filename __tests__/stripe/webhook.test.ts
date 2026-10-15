/**
 * Critical webhook tests.
 * Risk: fake webhooks, missed plan upgrades, wrong status on failure/cancellation.
 */

import { NextRequest } from 'next/server'

// Mock @/lib/stripe/config before importing the route (avoids hoisting issues).
// Includes STRIPE_PRICES (subscriptionCleanup reads it at import) and an
// async-iterable subscriptions.list (the cleanup auto-paginates).
jest.mock('@/lib/stripe/config', () => {
  const listImpl = jest.fn(() => ({
    async *[Symbol.asyncIterator]() {
      /* default: no other subs */
    },
  }))
  return {
    stripe: {
      webhooks: { constructEvent: jest.fn() },
      subscriptions: { cancel: jest.fn().mockResolvedValue({}), list: listImpl },
      customers: { retrieve: jest.fn().mockResolvedValue({ email: 'x@y.com' }) },
      paymentIntents: { retrieve: jest.fn() },
      checkout: { sessions: { list: jest.fn() } },
    },
    STRIPE_PRICES: {
      BASIC: 'price_basic',
      PREMIUM: 'price_premium',
      EXECUTIVE: 'price_exec',
      BASIC_MONTHLY: 'price_basic_m',
      PREMIUM_MONTHLY: 'price_premium_m',
      EXECUTIVE_MONTHLY: 'price_exec_m',
    },
  }
})

// The route creates its Supabase client ONCE at import, so swapping createClient's
// return value later has no effect on it. Instead the client delegates every
// `from()` to `mockFromImpl`, which a test can replace (see useFakeDb).
function defaultFrom() {
  const chain: any = {
    select: jest.fn(() => chain),
    update: jest.fn(() => chain),
    eq: jest.fn(() => chain),
    is: jest.fn(() => chain),
    neq: jest.fn(() => chain),
    single: jest.fn().mockResolvedValue({ data: buildUserProfile(), error: null }),
    then: (res: any, rej: any) => Promise.resolve({ data: null, error: null }).then(res, rej),
  }
  return chain
}
let mockFromImpl: (table: string) => any = defaultFrom

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({ from: (table: string) => mockFromImpl(table) })),
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

const mockApplyWalletTopup = jest.fn()
const mockApplyWalletRefund = jest.fn()
jest.mock('@/lib/wallet/topup', () => ({
  ...jest.requireActual('@/lib/wallet/topup'),
  applyWalletTopup: (...a: any[]) => mockApplyWalletTopup(...a),
  applyWalletRefund: (...a: any[]) => mockApplyWalletRefund(...a),
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

describe('Webhook — checkout.session.completed (subscription activation)', () => {
  const { paymentService } = require('@/lib/services/paymentService')

  beforeEach(() => jest.clearAllMocks())

  it('stores the sub id in stripe_subscription_id, NOT stripe_payment_id', async () => {
    paymentService.getPaymentBySessionId.mockResolvedValueOnce({ id: 'pay_1' })
    mockConstructEvent.mockReturnValue({
      type: 'checkout.session.completed',
      data: { object: buildCheckoutSession() }, // subscription: 'sub_test123', no payment_intent
    })
    setProfile({ subscription_tier: 'free' })

    const res = await POST(makeRequest({}))
    expect(res.status).toBe(200)

    expect(paymentService.updatePayment).toHaveBeenCalledWith(
      'pay_1',
      expect.objectContaining({ stripe_subscription_id: 'sub_test123', status: 'succeeded' })
    )
    const call = paymentService.updatePayment.mock.calls.find((c: any[]) => c[0] === 'pay_1')
    // A subscription session has no top-level PaymentIntent → stripe_payment_id
    // must be undefined (omitted), never the subscription id.
    expect(call[1].stripe_payment_id).toBeUndefined()
  })

  it('runs the duplicate cleanup keeping THIS session\'s subscription', async () => {
    paymentService.getPaymentBySessionId.mockResolvedValueOnce({ id: 'pay_1' })
    ;(stripeConfig.stripe as any).subscriptions.list.mockReturnValueOnce({
      async *[Symbol.asyncIterator]() {
        yield { id: 'sub_old', status: 'active', metadata: { tier: 'premium', visa_category: 'IR-1' }, items: { data: [] } }
      },
    })
    mockConstructEvent.mockReturnValue({
      type: 'checkout.session.completed',
      data: { object: buildCheckoutSession() },
    })
    setProfile({ subscription_tier: 'free' })

    await POST(makeRequest({}))

    // The old duplicate is cancelled; the just-paid sub_test123 is kept.
    expect((stripeConfig.stripe as any).subscriptions.cancel).toHaveBeenCalledWith('sub_old')
    expect((stripeConfig.stripe as any).subscriptions.cancel).not.toHaveBeenCalledWith('sub_test123')
  })

  it('keeps a live plan for ANOTHER journey (IR-1 purchase must not cancel IR-5)', async () => {
    paymentService.getPaymentBySessionId.mockResolvedValueOnce({ id: 'pay_1' })
    ;(stripeConfig.stripe as any).subscriptions.list.mockReturnValueOnce({
      async *[Symbol.asyncIterator]() {
        yield { id: 'sub_ir5', status: 'active', metadata: { tier: 'executive', visa_category: 'IR-5' }, items: { data: [] } }
      },
    })
    mockConstructEvent.mockReturnValue({
      type: 'checkout.session.completed',
      data: { object: buildCheckoutSession() },
    })
    setProfile({ subscription_tier: 'free' })

    await POST(makeRequest({}))

    expect((stripeConfig.stripe as any).subscriptions.cancel).not.toHaveBeenCalled()
  })

  it('add-candidate purchase cancels nothing (existing IR-5 plan survives)', async () => {
    paymentService.getPaymentBySessionId.mockResolvedValueOnce({ id: 'pay_1' })
    ;(stripeConfig.stripe as any).subscriptions.list.mockReturnValueOnce({
      async *[Symbol.asyncIterator]() {
        yield { id: 'sub_ir5_primary', status: 'active', metadata: { tier: 'premium', visa_category: 'IR-5' }, items: { data: [] } }
      },
    })
    const base = buildCheckoutSession()
    const session = {
      ...base,
      metadata: { ...base.metadata, visa_category: 'IR-5', action: 'add_candidate', is_add_candidate: 'true' },
    }
    mockConstructEvent.mockReturnValue({ type: 'checkout.session.completed', data: { object: session } })
    setProfile({ subscription_tier: 'premium' })

    await POST(makeRequest({}))

    expect((stripeConfig.stripe as any).subscriptions.cancel).not.toHaveBeenCalled()
  })
})

// --- Cancellation against a stateful fake DB (per-journey plans) ---

type JourneyRow = {
  id: string
  user_id: string
  journey_type: string
  subscription_tier: string
  stripe_subscription_id: string | null
}

/**
 * In-memory stand-in for the two tables the cancellation handler touches. Journey
 * updates apply their eq/is/neq filters for real, so the tests assert the resulting
 * rows rather than call shapes. Profile updates are recorded in order.
 */
function useFakeDb(profile: any, journeys: JourneyRow[]) {
  const profileUpdates: any[] = []
  mockFromImpl = (table: string) => {
    const filters: Array<[string, string, any]> = []
    let values: any = null
    const matches = (row: any) =>
      filters.every(([op, k, v]) => (op === 'neq' ? row[k] !== v : row[k] === v))
    const chain: any = {
      select: () => chain,
      update: (v: any) => {
        values = v
        return chain
      },
      eq: (k: string, v: any) => (filters.push(['eq', k, v]), chain),
      is: (k: string, v: any) => (filters.push(['is', k, v]), chain),
      neq: (k: string, v: any) => (filters.push(['neq', k, v]), chain),
      single: () => Promise.resolve({ data: profile, error: null }),
      then: (res: any, rej: any) => {
        let data: any = null
        if (table === 'journeys') {
          const rows = journeys.filter(matches)
          if (values) rows.forEach((r) => Object.assign(r, values))
          data = rows.map((r) => ({ ...r }))
        } else if (table === 'user_profiles' && values) {
          profileUpdates.push(values)
        }
        return Promise.resolve({ data, error: null }).then(res, rej)
      },
    }
    return chain
  }
  return { profileUpdates }
}

function journey(id: string, journey_type: string, tier: string, sub: string | null): JourneyRow {
  return { id, user_id: 'user-abc', journey_type, subscription_tier: tier, stripe_subscription_id: sub }
}

function cancelEvent(subId: string) {
  mockConstructEvent.mockReturnValue({
    type: 'customer.subscription.deleted',
    data: { object: { id: subId, customer: 'cus_test123' } },
  })
}

describe('Webhook — customer.subscription.deleted (per-journey plans)', () => {
  beforeEach(() => jest.clearAllMocks())
  afterEach(() => {
    mockFromImpl = defaultFrom
  })

  it('cancelling the IR-1 plan revokes only IR-1; the IR-5 plan and account summary stay', async () => {
    const journeys = [
      journey('j1', 'IR1', 'premium', 'sub_ir1'),
      journey('j5', 'IR5', 'executive', 'sub_ir5'),
    ]
    const { profileUpdates } = useFakeDb(
      buildUserProfile({
        subscription_tier: 'executive',
        profile_details: { stripe_subscription_id: 'sub_ir5', purchased_addons: [] },
      }),
      journeys
    )
    cancelEvent('sub_ir1')

    await POST(makeRequest({}))

    expect(journeys[0]).toMatchObject({ subscription_tier: 'free', stripe_subscription_id: null })
    expect(journeys[1]).toMatchObject({ subscription_tier: 'executive', stripe_subscription_id: 'sub_ir5' })
    expect(profileUpdates.some((u) => 'subscription_tier' in u)).toBe(false)
  })

  it('cancelling the current plan falls back to the best remaining journey plan, not free', async () => {
    const journeys = [
      journey('j1', 'IR1', 'premium', 'sub_ir1'),
      journey('j5', 'IR5', 'executive', 'sub_ir5'),
    ]
    const { profileUpdates } = useFakeDb(
      buildUserProfile({
        subscription_tier: 'executive',
        profile_details: { stripe_subscription_id: 'sub_ir5', purchased_addons: [] },
      }),
      journeys
    )
    cancelEvent('sub_ir5')

    await POST(makeRequest({}))

    expect(journeys[1].subscription_tier).toBe('free')
    const summary = profileUpdates.find((u) => 'subscription_tier' in u)
    expect(summary).toMatchObject({
      subscription_tier: 'premium',
      subscription_status: 'active',
      profile_details: expect.objectContaining({ stripe_subscription_id: 'sub_ir1' }),
    })
  })

  it('cancelling a candidate-2 plan drops only that candidate (journey + roster tier) to free', async () => {
    const journeys = [
      journey('jp', 'ir5', 'premium', 'sub_primary'),
      journey('jc2', 'ir5_candidate2', 'basic', 'sub_c2'),
    ]
    const { profileUpdates } = useFakeDb(
      buildUserProfile({
        subscription_tier: 'premium',
        profile_details: {
          stripe_subscription_id: 'sub_primary',
          purchased_addons: [],
          candidates: [
            { id: 'candidate-1', visaCategory: 'IR-5', tier: 'premium' },
            { id: 'candidate-2', visaCategory: 'IR-5', tier: 'basic' },
          ],
        },
      }),
      journeys
    )
    cancelEvent('sub_c2')

    await POST(makeRequest({}))

    expect(journeys[0].subscription_tier).toBe('premium')
    expect(journeys[1].subscription_tier).toBe('free')
    const rosterUpdate = profileUpdates.find((u) => u.profile_details?.candidates)
    expect(rosterUpdate.profile_details.candidates).toEqual([
      { id: 'candidate-1', visaCategory: 'IR-5', tier: 'premium' },
      { id: 'candidate-2', visaCategory: 'IR-5', tier: 'free' },
    ])
    expect(rosterUpdate.subscription_tier).toBeUndefined()
  })

  it("an upgrade's retired plan changes nothing", async () => {
    // Provisioning already repointed the journey at the new sub before cleanup ran.
    const journeys = [journey('j1', 'IR1', 'premium', 'sub_new')]
    const { profileUpdates } = useFakeDb(
      buildUserProfile({
        subscription_tier: 'premium',
        profile_details: { stripe_subscription_id: 'sub_new', purchased_addons: [] },
      }),
      journeys
    )
    cancelEvent('sub_old_basic')

    await POST(makeRequest({}))

    expect(journeys[0]).toMatchObject({ subscription_tier: 'premium', stripe_subscription_id: 'sub_new' })
    expect(profileUpdates).toEqual([])
  })

  it('legacy account: cancelling its only plan revokes journeys never stamped with a sub id', async () => {
    const journeys = [journey('j1', 'IR1', 'premium', null)]
    const { profileUpdates } = useFakeDb(
      buildUserProfile({
        subscription_tier: 'premium',
        profile_details: { stripe_subscription_id: 'sub_legacy', purchased_addons: [] },
      }),
      journeys
    )
    cancelEvent('sub_legacy')

    await POST(makeRequest({}))

    expect(journeys[0].subscription_tier).toBe('free')
    expect(profileUpdates.find((u) => 'subscription_tier' in u)).toMatchObject({
      subscription_tier: 'free',
      subscription_status: 'canceled',
    })
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

// ================================================
// Wallet top-ups: retry on transient failure + refunds
// ================================================
describe('Webhook — wallet top-up', () => {
  const stripeMock = stripeConfig.stripe as any
  const walletSession = {
    id: 'cs_w',
    mode: 'payment',
    payment_status: 'paid',
    payment_intent: 'pi_w',
    amount_subtotal: 2500,
    metadata: { user_id: 'user-1', product_type: 'wallet_topup', credits: '25' },
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockFromImpl = defaultFrom
  })

  it('answers 500 (Stripe retries) when the credit RPC fails', async () => {
    mockConstructEvent.mockReturnValue({
      id: 'evt_1', type: 'checkout.session.completed', data: { object: walletSession },
    })
    mockApplyWalletTopup.mockResolvedValue({ ok: false, reason: 'rpc_failed' })
    const res = await POST(makeRequest({}))
    expect(res.status).toBe(500)
  })

  it.each(['not_paid', 'invalid_session'])('still answers 200 for %s (retrying cannot help)', async (reason) => {
    mockConstructEvent.mockReturnValue({
      id: 'evt_2', type: 'checkout.session.completed', data: { object: walletSession },
    })
    mockApplyWalletTopup.mockResolvedValue({ ok: false, reason })
    const res = await POST(makeRequest({}))
    expect(res.status).toBe(200)
  })

  it('keeps answering 200 when a NON-wallet handler throws', async () => {
    mockConstructEvent.mockReturnValue({
      id: 'evt_3', type: 'customer.subscription.updated', data: { object: null },
    })
    const res = await POST(makeRequest({}))
    expect(res.status).toBe(200)
  })

  const refundedCharge = (over: any = {}) => ({
    id: 'ch_w',
    payment_intent: 'pi_w',
    amount_captured: 2700,
    amount_refunded: 2700,
    metadata: {},
    ...over,
  })

  it('reverses credits on charge.refunded for a wallet top-up', async () => {
    mockConstructEvent.mockReturnValue({
      id: 'evt_4', type: 'charge.refunded', data: { object: refundedCharge() },
    })
    stripeMock.paymentIntents.retrieve.mockResolvedValue({ metadata: { product_type: 'wallet_topup' } })
    stripeMock.checkout.sessions.list.mockResolvedValue({ data: [walletSession] })
    mockApplyWalletTopup.mockResolvedValue({ ok: true, credits: 25, balance: 25, alreadyProcessed: true })
    mockApplyWalletRefund.mockResolvedValue({
      ok: true, creditsReversed: 25, creditsDeducted: 25, shortfall: 0, balance: 0, alreadyProcessed: false,
    })
    const res = await POST(makeRequest({}))
    expect(res.status).toBe(200)
    expect(mockApplyWalletRefund).toHaveBeenCalledWith(
      expect.anything(),
      {
        userId: 'user-1',
        stripeSessionId: 'cs_w',
        amountRefundedCents: 2700,
        amountCapturedCents: 2700,
        chargeId: 'ch_w',
      },
      expect.any(String)
    )
  })

  it('ignores refunds of non-wallet payments', async () => {
    mockConstructEvent.mockReturnValue({
      id: 'evt_5', type: 'charge.refunded', data: { object: refundedCharge() },
    })
    stripeMock.paymentIntents.retrieve.mockResolvedValue({ metadata: { product_type: 'consultation' } })
    const res = await POST(makeRequest({}))
    expect(res.status).toBe(200)
    expect(stripeMock.checkout.sessions.list).not.toHaveBeenCalled()
    expect(mockApplyWalletRefund).not.toHaveBeenCalled()
  })

  it('does not reverse when the top-up could never be credited', async () => {
    mockConstructEvent.mockReturnValue({
      id: 'evt_6',
      type: 'charge.refunded',
      data: { object: refundedCharge({ metadata: { product_type: 'wallet_topup' } }) },
    })
    stripeMock.checkout.sessions.list.mockResolvedValue({ data: [walletSession] })
    mockApplyWalletTopup.mockResolvedValue({ ok: false, reason: 'not_paid' })
    const res = await POST(makeRequest({}))
    expect(res.status).toBe(200)
    expect(stripeMock.paymentIntents.retrieve).not.toHaveBeenCalled()
    expect(mockApplyWalletRefund).not.toHaveBeenCalled()
  })

  it('answers 500 when the reversal RPC fails', async () => {
    mockConstructEvent.mockReturnValue({
      id: 'evt_7',
      type: 'charge.refunded',
      data: { object: refundedCharge({ metadata: { product_type: 'wallet_topup' } }) },
    })
    stripeMock.checkout.sessions.list.mockResolvedValue({ data: [walletSession] })
    mockApplyWalletTopup.mockResolvedValue({ ok: true, credits: 25, balance: 25, alreadyProcessed: true })
    mockApplyWalletRefund.mockResolvedValue({ ok: false, reason: 'rpc_failed' })
    const res = await POST(makeRequest({}))
    expect(res.status).toBe(500)
  })
})
