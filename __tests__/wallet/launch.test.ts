/**
 * Wallet launch (lib/wallet/launch.ts).
 * Risk: client-chosen prices, double charges, charging owners again, and
 * idempotency keys colliding across users or resources.
 */

import { launchResource, topupAmountForDeficit } from '@/lib/wallet/launch'

type Tables = {
  wallet?: { balance: number } | null
  unlocks?: { resource_type: string; resource_id: string; status: string }[]
  addons?: unknown[]
}

function makeSupabase(tables: Tables, rpcResult: { data: any; error: any } = { data: null, error: null }) {
  const rpc = jest.fn().mockResolvedValue(rpcResult)
  const from = (table: string) => {
    const result =
      table === 'user_wallets'
        ? { data: tables.wallet ?? null, error: null }
        : table === 'standalone_unlocked_resources'
          ? { data: tables.unlocks ?? [], error: null }
          : { data: { profile_details: { purchased_addons: tables.addons ?? [] } }, error: null }
    const chain: any = {
      select: () => chain,
      eq: () => chain,
      maybeSingle: () => Promise.resolve(result),
      then: (res: any, rej: any) => Promise.resolve(result).then(res, rej),
    }
    return chain
  }
  return { client: { from, rpc } as any, rpc }
}

const launch = (client: any, body: any) => launchResource(client, 'user-1', body)

describe('launchResource', () => {
  it('charges the server catalog price, never a client price', async () => {
    const { client, rpc } = makeSupabase(
      { wallet: { balance: 20 } },
      { data: { success: true, balance: 5, transaction_id: 'tx_1' }, error: null }
    )
    const r = await launch(client, {
      resourceType: 'tool',
      resourceId: 'sponsorship-calculator',
      credits: 0,
      price: 0,
    } as any)
    expect(rpc).toHaveBeenCalledWith(
      'deduct_wallet_credits_atomic',
      expect.objectContaining({
        p_user_id: 'user-1',
        p_resource_type: 'tool',
        p_resource_id: 'sponsorship-calculator',
        p_credit_cost: 15,
      })
    )
    expect(r).toEqual({
      status: 200,
      body: expect.objectContaining({ success: true, unlocked: true, balance: 5, charged: 15, transactionId: 'tx_1' }),
    })
  })

  it('Smart Form Filler: refuses the whole tool and charges one form at its price', async () => {
    const whole = makeSupabase({ wallet: { balance: 100 } })
    const refused = await launch(whole.client, { resourceType: 'tool', resourceId: 'form-forge' })
    expect(refused).toEqual({ status: 400, body: { success: false, error: 'RESOURCE_NOT_LAUNCHABLE' } })
    expect(whole.rpc).not.toHaveBeenCalled()

    const one = makeSupabase(
      { wallet: { balance: 100 } },
      { data: { success: true, balance: 61, transaction_id: 'tx_2' }, error: null }
    )
    await launch(one.client, { resourceType: 'tool', resourceId: 'form-forge:i485' })
    expect(one.rpc).toHaveBeenCalledWith(
      'deduct_wallet_credits_atomic',
      expect.objectContaining({ p_resource_id: 'form-forge:i485', p_credit_cost: 39 })
    )
  })

  it('Smart Form Filler: an earlier whole-tool unlock is not charged again for a form', async () => {
    const { client, rpc } = makeSupabase({
      wallet: { balance: 0 },
      unlocks: [{ resource_type: 'tool', resource_id: 'form-forge', status: 'active' }],
    })
    const r = await launch(client, { resourceType: 'tool', resourceId: 'form-forge:i485' })
    expect(rpc).not.toHaveBeenCalled()
    expect(r.body).toMatchObject({ success: true, alreadyUnlocked: true })
  })

  it('returns 402 with the exact top-up when credits are short', async () => {
    const { client } = makeSupabase(
      { wallet: { balance: 5 } },
      { data: { success: false, error: 'INSUFFICIENT_CREDITS', required: 15, available: 5, deficit: 10 }, error: null }
    )
    const r = await launch(client, { resourceType: 'tool', resourceId: 'sponsorship-calculator' })
    expect(r).toEqual({
      status: 402,
      body: { success: false, error: 'INSUFFICIENT_CREDITS', required: 15, available: 5, deficit: 10, topupAmount: 10 },
    })
  })

  it('does not charge a resource the user already owns through a legacy purchase', async () => {
    const { client, rpc } = makeSupabase({ wallet: { balance: 3 }, addons: ['sponsor'] })
    const r = await launch(client, { resourceType: 'tool', resourceId: 'sponsorship-calculator' })
    expect(rpc).not.toHaveBeenCalled()
    expect(r.status).toBe(200)
    expect(r.body).toEqual(expect.objectContaining({ alreadyUnlocked: true, charged: 0, balance: 3 }))
  })

  it('does not charge an existing wallet unlock', async () => {
    const { client, rpc } = makeSupabase({
      unlocks: [{ resource_type: 'guide', resource_id: 'guide-cnic', status: 'active' }],
    })
    const r = await launch(client, { resourceType: 'guide', resourceId: 'guide-cnic' })
    expect(rpc).not.toHaveBeenCalled()
    expect(r.body).toEqual(expect.objectContaining({ alreadyUnlocked: true, charged: 0 }))
  })

  it('reports a re-entry or replay seen under the lock as not charged', async () => {
    const { client } = makeSupabase(
      { wallet: { balance: 5 } },
      { data: { success: true, already_unlocked: true, balance: 5 }, error: null }
    )
    const r = await launch(client, { resourceType: 'tool', resourceId: 'pdf-toolkit' })
    expect(r.body).toEqual(expect.objectContaining({ charged: 0, alreadyUnlocked: true }))
  })

  it('namespaces the idempotency key by user and resource', async () => {
    const { client, rpc } = makeSupabase(
      { wallet: { balance: 100 } },
      { data: { success: true, balance: 31 }, error: null }
    )
    await launch(client, { resourceType: 'tool', resourceId: 'pdf-toolkit', idempotencyKey: 'launch_123_abc' })
    expect(rpc.mock.calls[0][1].p_idempotency_key).toBe('launch:user-1:tool:pdf-toolkit:launch_123_abc')
  })

  it.each([
    [{ resourceType: 'tool', resourceId: 'nope' }, 404, 'UNKNOWN_RESOURCE'],
    [{ resourceType: 'guide', resourceId: 'sponsorship-calculator' }, 404, 'UNKNOWN_RESOURCE'],
    [{ resourceType: 'service', resourceId: 'book-a-consultation' }, 400, 'RESOURCE_NOT_LAUNCHABLE'],
    [{ resourceType: 'tool', resourceId: 'pdf-toolkit', idempotencyKey: 'short' }, 400, 'INVALID_IDEMPOTENCY_KEY'],
    [{ resourceType: 'tool', resourceId: 'pdf-toolkit', idempotencyKey: 'bad key with spaces' }, 400, 'INVALID_IDEMPOTENCY_KEY'],
    [{ resourceType: 'tool', resourceId: 'pdf-toolkit', idempotencyKey: 12345678 }, 400, 'INVALID_IDEMPOTENCY_KEY'],
  ])('rejects %p with %i', async (body, status, error) => {
    const { client, rpc } = makeSupabase({ wallet: { balance: 1000 } })
    const r = await launch(client, body)
    expect(r).toEqual({ status, body: { success: false, error } })
    expect(rpc).not.toHaveBeenCalled()
  })

  it('surfaces RPC failures as 500 without claiming an unlock', async () => {
    const { client } = makeSupabase({ wallet: { balance: 100 } }, { data: null, error: { message: 'boom' } })
    const r = await launch(client, { resourceType: 'tool', resourceId: 'pdf-toolkit' })
    expect(r).toEqual({ status: 500, body: { success: false, error: 'LAUNCH_FAILED' } })
  })
})

describe('topupAmountForDeficit', () => {
  it('rounds up to whole credits within the top-up limits', () => {
    expect(topupAmountForDeficit(10)).toBe(10)
    expect(topupAmountForDeficit(2)).toBe(5)
    expect(topupAmountForDeficit(9.5)).toBe(10)
    expect(topupAmountForDeficit(5000)).toBe(1000)
  })
})
