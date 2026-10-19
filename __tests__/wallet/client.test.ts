/**
 * Browser-side wallet helpers (lib/wallet/client.ts) used by WalletContext and
 * the top-up modal. Risk: a bad amount reaching Stripe, a signed-out user treated
 * as an error, a launch key the server rejects.
 */

import {
  createTopupCheckout,
  fetchWalletSnapshot,
  newLaunchIdempotencyKey,
  parseCustomTopup,
  requestLaunch,
} from '@/lib/wallet/client'

const mockFetch = jest.fn()
;(global as any).fetch = mockFetch

const reply = (status: number, body: unknown) => ({
  status,
  ok: status >= 200 && status < 300,
  json: async () => body,
})

beforeEach(() => mockFetch.mockReset())

describe('parseCustomTopup', () => {
  it.each([
    ['5', 5],
    ['1000', 1000],
    [' 42 ', 42],
  ])('accepts %p', (input, credits) => {
    expect(parseCustomTopup(input)).toEqual({ ok: true, credits })
  })

  it.each(['', '4', '0', '1001', '12.5', '-5', 'abc', '1e3'])('rejects %p', (input) => {
    expect(parseCustomTopup(input).ok).toBe(false)
  })
})

describe('newLaunchIdempotencyKey', () => {
  it('matches the key shape the server accepts and is unique', () => {
    const a = newLaunchIdempotencyKey()
    const b = newLaunchIdempotencyKey()
    expect(a).toMatch(/^[A-Za-z0-9_:.-]{8,100}$/)
    expect(a).not.toBe(b)
  })
})

describe('fetchWalletSnapshot', () => {
  it('returns balance and unlocks', async () => {
    mockFetch.mockResolvedValue(
      reply(200, {
        success: true,
        wallet: { balance: 25, currency: 'credits' },
        unlocks: [{ resourceType: 'tool', resourceId: 'pdf-toolkit' }],
      })
    )
    expect(await fetchWalletSnapshot()).toEqual({
      balance: 25,
      unlocks: [{ resourceType: 'tool', resourceId: 'pdf-toolkit' }],
    })
  })

  it('returns null when signed out', async () => {
    mockFetch.mockResolvedValue(reply(401, { success: false }))
    expect(await fetchWalletSnapshot()).toBeNull()
  })

  it('throws on a server error', async () => {
    mockFetch.mockResolvedValue(reply(500, { success: false, error: 'boom' }))
    await expect(fetchWalletSnapshot()).rejects.toThrow('boom')
  })
})

describe('requestLaunch', () => {
  it('sends only the resource and key, and passes the status through', async () => {
    mockFetch.mockResolvedValue(reply(402, { success: false, error: 'INSUFFICIENT_CREDITS', deficit: 10 }))
    const res = await requestLaunch('tool', 'pdf-toolkit', 'launch_12345678')
    expect(JSON.parse(mockFetch.mock.calls[0][1].body)).toEqual({
      resourceType: 'tool',
      resourceId: 'pdf-toolkit',
      idempotencyKey: 'launch_12345678',
    })
    expect(res).toEqual({ status: 402, body: { success: false, error: 'INSUFFICIENT_CREDITS', deficit: 10 } })
  })

  it('reports a network failure instead of throwing', async () => {
    mockFetch.mockRejectedValue(new Error('offline'))
    expect(await requestLaunch('tool', 'pdf-toolkit', 'launch_12345678')).toEqual({
      status: 0,
      body: { success: false, error: 'NETWORK_ERROR' },
    })
  })
})

describe('createTopupCheckout', () => {
  it('posts a wallet top-up and returns the Stripe URL', async () => {
    mockFetch.mockResolvedValue(reply(200, { url: 'https://checkout.stripe.com/x' }))
    expect(await createTopupCheckout(25, '/resources?tab=toolbox')).toBe('https://checkout.stripe.com/x')
    expect(JSON.parse(mockFetch.mock.calls[0][1].body)).toEqual({
      productType: 'wallet_topup',
      amount: 25,
      returnUrl: '/resources?tab=toolbox',
    })
  })

  it('surfaces the server message', async () => {
    mockFetch.mockResolvedValue(reply(400, { error: 'Top-up amount cannot exceed 1000 credits.' }))
    await expect(createTopupCheckout(5000, '/')).rejects.toThrow('cannot exceed 1000')
  })

  it('asks a signed-out user to sign in', async () => {
    mockFetch.mockResolvedValue(reply(401, { error: 'Authentication required' }))
    await expect(createTopupCheckout(25, '/')).rejects.toThrow('sign in')
  })
})
