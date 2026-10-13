/**
 * Wallet top-up domain logic (lib/wallet/topup.ts).
 * Risk: credits minted from tampered metadata, unpaid sessions credited, or a
 * top-up credited twice when the webhook and verify-session both fire.
 */

import {
  validateTopupAmount,
  creditsFromSession,
  applyWalletTopup,
  resolveTopupReturnPath,
  WALLET_MIN_TOPUP,
} from '@/lib/wallet/topup'

describe('validateTopupAmount', () => {
  it('accepts preset packs', () => {
    for (const n of [10, 25, 50, 100]) expect(validateTopupAmount(n)).toEqual({ ok: true, credits: n })
  })
  it('accepts numeric strings', () => {
    expect(validateTopupAmount('15')).toEqual({ ok: true, credits: 15 })
  })
  it('lifts amounts under the minimum', () => {
    expect(validateTopupAmount(1)).toEqual({ ok: true, credits: WALLET_MIN_TOPUP })
  })
  it.each([[0], [-1], [2.5], [NaN], [Infinity], ['x'], [null], [undefined], [1001]])(
    'rejects %p',
    (v) => expect(validateTopupAmount(v).ok).toBe(false)
  )
})

describe('resolveTopupReturnPath', () => {
  it('keeps same-origin paths and rejects others', () => {
    expect(resolveTopupReturnPath('/tools?x=1')).toBe('/tools?x=1')
    expect(resolveTopupReturnPath('https://evil.com')).toBe('/resources')
    expect(resolveTopupReturnPath('//evil.com')).toBe('/resources')
    expect(resolveTopupReturnPath(undefined)).toBe('/resources')
  })
})

describe('creditsFromSession', () => {
  it('uses the pre-tax subtotal Stripe charged', () => {
    expect(creditsFromSession({ amount_subtotal: 2500, metadata: { credits: '25' } } as any)).toBe(25)
  })
  it('refuses when metadata disagrees with the charge', () => {
    expect(creditsFromSession({ amount_subtotal: 1000, metadata: { credits: '100' } } as any)).toBeNull()
  })
  it('refuses missing, zero or fractional subtotals', () => {
    expect(creditsFromSession({ amount_subtotal: null, metadata: {} } as any)).toBeNull()
    expect(creditsFromSession({ amount_subtotal: 0, metadata: {} } as any)).toBeNull()
    expect(creditsFromSession({ amount_subtotal: 1050, metadata: {} } as any)).toBeNull()
  })
})

function makeSupabase(rpcResult: { data: any; error: any }) {
  const rpc = jest.fn().mockResolvedValue(rpcResult)
  const chain: any = {
    select: () => chain,
    eq: () => chain,
    maybeSingle: () => Promise.resolve({ data: { id: 'pay_1' }, error: null }),
  }
  return { client: { from: () => chain, rpc } as any, rpc }
}

const paidSession = (over: any = {}) =>
  ({
    id: 'cs_topup',
    payment_status: 'paid',
    status: 'complete',
    amount_subtotal: 2500,
    amount_total: 2700,
    currency: 'usd',
    payment_intent: 'pi_1',
    metadata: { user_id: 'user-1', product_type: 'wallet_topup', credits: '25' },
    ...over,
  }) as any

describe('applyWalletTopup', () => {
  it('credits the subtotal through the atomic RPC, keyed by session id', async () => {
    const { client, rpc } = makeSupabase({
      data: { success: true, balance: 30, transaction_id: 'tx_1' },
      error: null,
    })
    const r = await applyWalletTopup(client, paidSession())
    expect(r).toEqual({
      ok: true,
      credits: 25,
      balance: 30,
      alreadyProcessed: false,
      transactionId: 'tx_1',
    })
    expect(rpc).toHaveBeenCalledWith(
      'credit_wallet_topup_atomic',
      expect.objectContaining({
        p_user_id: 'user-1',
        p_amount: 25,
        p_stripe_session_id: 'cs_topup',
        p_payment_id: 'pay_1',
      })
    )
  })

  it('reports a replayed session as already processed', async () => {
    const { client } = makeSupabase({
      data: { success: true, already_processed: true, balance: 30, transaction_id: 'tx_1' },
      error: null,
    })
    const r = await applyWalletTopup(client, paidSession())
    expect(r.ok && r.alreadyProcessed).toBe(true)
  })

  it('never credits an unpaid session', async () => {
    const { client, rpc } = makeSupabase({ data: null, error: null })
    const r = await applyWalletTopup(client, paidSession({ payment_status: 'unpaid' }))
    expect(r).toEqual({ ok: false, reason: 'not_paid' })
    expect(rpc).not.toHaveBeenCalled()
  })

  it('ignores non-wallet sessions', async () => {
    const { client, rpc } = makeSupabase({ data: null, error: null })
    const r = await applyWalletTopup(
      client,
      paidSession({ metadata: { user_id: 'user-1', product_type: 'journey_plan' } })
    )
    expect(r.ok).toBe(false)
    expect(rpc).not.toHaveBeenCalled()
  })

  it('surfaces RPC failures', async () => {
    const { client } = makeSupabase({ data: null, error: { message: 'boom' } })
    const r = await applyWalletTopup(client, paidSession())
    expect(r).toEqual({ ok: false, reason: 'rpc_failed', error: 'boom' })
  })
})
