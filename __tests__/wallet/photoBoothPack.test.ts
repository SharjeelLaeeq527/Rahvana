/**
 * Standalone Photo Booth is sold in packs: one credit purchase = 2 photos, then
 * the user must buy it again. Risk: the unlock used to mean unlimited photos.
 */

import { fakeSupabase, type Row } from '../helpers/fakeSupabase'
import { PHOTOBOOTH_CREDITS_PER_ADDON } from '@/lib/entitlements/config'
import { PHOTO_BOOTH_PHOTOS_PER_PURCHASE, getCatalogItem, isPhotoBoothItem } from '@/lib/wallet/catalog'
import {
  PHOTO_BOOTH_WALLET_USAGE_KEY,
  getPhotoBoothPack,
  spendPhotoBoothPhoto,
} from '@/lib/wallet/photoBoothPack'

const purchase = (id: string, created_at: string, userId = 'user-1'): Row => ({
  id,
  created_at,
  user_id: userId,
  resource_type: 'tool',
  resource_id: 'photo-booth',
  transaction_type: 'tool_launch',
  status: 'completed',
})

const unlockRow = (transaction_id: string | null, status = 'active'): Row => ({
  user_id: 'user-1',
  resource_type: 'tool',
  resource_id: 'photo-booth',
  status,
  transaction_id,
})

/** Fake with a working increment_feature_usage_atomic over `tables.feature_usage`. */
function packClient(tables: Record<string, Row[]>) {
  tables.feature_usage ??= []
  return fakeSupabase(tables, {
    rpc: (name, args) => {
      if (name !== 'increment_feature_usage_atomic') return null
      const { p_user_id, p_feature_key, p_limit } = args as {
        p_user_id: string
        p_feature_key: string
        p_limit: number
      }
      let row = tables.feature_usage.find(
        (r) => r.user_id === p_user_id && r.feature_key === p_feature_key
      )
      const used = Number(row?.usage_count ?? 0)
      if (used >= p_limit) return { allowed: false, used, limit: p_limit, remaining: 0 }
      if (!row) {
        row = { user_id: p_user_id, feature_key: p_feature_key, usage_count: 0 }
        tables.feature_usage.push(row)
      }
      row.usage_count = used + 1
      return { allowed: true, used: used + 1, limit: p_limit, remaining: p_limit - used - 1 }
    },
  }).client
}

describe('Photo Booth credit packs', () => {
  it('sells 2 photos per purchase, the same count as the legacy add-on', () => {
    expect(PHOTO_BOOTH_PHOTOS_PER_PURCHASE).toBe(2)
    expect(PHOTO_BOOTH_PHOTOS_PER_PURCHASE).toBe(PHOTOBOOTH_CREDITS_PER_ADDON)
    const item = getCatalogItem('tool', 'photo-booth')!
    expect(isPhotoBoothItem(item)).toBe(true)
    expect(item.launchable).toBe(true)
  })

  it('never bought: no photos', async () => {
    const pack = await getPhotoBoothPack(packClient({ credit_transactions: [] }), 'user-1')
    expect(pack).toEqual({ purchases: 0, limit: 0, used: 0, remaining: 0 })
  })

  it('one purchase gives exactly 2 photos, then closes the unlock', async () => {
    const tables: Record<string, Row[]> = {
      credit_transactions: [purchase('tx-1', '2026-10-01'), purchase('tx-x', '2026-10-01', 'user-2')],
      standalone_unlocked_resources: [unlockRow('tx-1')],
    }
    const client = packClient(tables)

    await expect(spendPhotoBoothPhoto(client, 'user-1')).resolves.toMatchObject({ allowed: true, remaining: 1 })
    expect(tables.standalone_unlocked_resources[0].status).toBe('active')

    await expect(spendPhotoBoothPhoto(client, 'user-1')).resolves.toMatchObject({ allowed: true, remaining: 0 })
    // Last photo used: the tool can be bought again.
    expect(tables.standalone_unlocked_resources[0].status).toBe('revoked')

    await expect(spendPhotoBoothPhoto(client, 'user-1')).resolves.toMatchObject({ allowed: false, remaining: 0 })
    expect(tables.feature_usage[0]).toMatchObject({ feature_key: PHOTO_BOOTH_WALLET_USAGE_KEY, usage_count: 2 })
  })

  it('buying again adds 2 more photos', async () => {
    const tables: Record<string, Row[]> = {
      credit_transactions: [purchase('tx-2', '2026-10-02'), purchase('tx-1', '2026-10-01')],
      standalone_unlocked_resources: [unlockRow('tx-2')],
      feature_usage: [{ user_id: 'user-1', feature_key: PHOTO_BOOTH_WALLET_USAGE_KEY, usage_count: 2 }],
    }
    const client = packClient(tables)
    await expect(getPhotoBoothPack(client, 'user-1')).resolves.toEqual({
      purchases: 2,
      limit: 4,
      used: 2,
      remaining: 2,
    })
    expect(tables.standalone_unlocked_resources[0].status).toBe('active')
  })

  it('a used-up pack found on a read is closed (self-heal)', async () => {
    const tables: Record<string, Row[]> = {
      credit_transactions: [purchase('tx-1', '2026-10-01')],
      standalone_unlocked_resources: [unlockRow('tx-1')],
      feature_usage: [{ user_id: 'user-1', feature_key: PHOTO_BOOTH_WALLET_USAGE_KEY, usage_count: 2 }],
    }
    await getPhotoBoothPack(packClient(tables), 'user-1')
    expect(tables.standalone_unlocked_resources[0].status).toBe('revoked')
  })

  it('never closes a newer purchase than the one it counted', async () => {
    // The row points at tx-new (bought a moment ago); the count only saw tx-1.
    const tables: Record<string, Row[]> = {
      credit_transactions: [purchase('tx-1', '2026-10-01')],
      standalone_unlocked_resources: [unlockRow('tx-new')],
      feature_usage: [{ user_id: 'user-1', feature_key: PHOTO_BOOTH_WALLET_USAGE_KEY, usage_count: 2 }],
    }
    await getPhotoBoothPack(packClient(tables), 'user-1')
    expect(tables.standalone_unlocked_resources[0].status).toBe('active')
  })
})

describe('/api/feature-usage standalone Photo Booth', () => {
  let tables: Record<string, Row[]>

  beforeAll(() => {
    jest.resetModules()
    jest.doMock('@/lib/supabase/server', () => ({
      createClient: async () => fakeSupabase(tables, { user: { id: 'user-1' } }).client,
    }))
    jest.doMock('@/lib/supabase/admin', () => ({
      get supabaseAdmin() {
        return packClient(tables)
      },
    }))
  })

  afterAll(() => {
    jest.dontMock('@/lib/supabase/server')
    jest.dontMock('@/lib/supabase/admin')
  })

  beforeEach(() => {
    tables = {
      user_profiles: [{ id: 'user-1', subscription_tier: 'executive', profile_details: { purchased_addons: [] } }],
      credit_transactions: [purchase('tx-1', '2026-10-01')],
      standalone_unlocked_resources: [unlockRow('tx-1')],
      feature_usage: [],
    }
  })

  const route = () =>
    require('@/app/api/feature-usage/route') as typeof import('@/app/api/feature-usage/route')
  const spend = () =>
    route().POST(
      new Request('http://localhost/api/feature-usage', {
        method: 'POST',
        body: JSON.stringify({ feature: 'photo_booth', scope: 'standalone' }),
      })
    )

  it('reports the photos left from the purchase', async () => {
    const res = await route().GET(
      new Request('http://localhost/api/feature-usage?feature=photo_booth&scope=standalone')
    )
    const body = await res.json()
    expect(body.data.usage).toMatchObject({ allowed: true, remaining: 2, limit: 2 })
  })

  it('allows 2 photos per purchase, then refuses until bought again', async () => {
    expect(await (await spend()).json()).toMatchObject({ allowed: true, remaining: 1 })
    expect(await (await spend()).json()).toMatchObject({ allowed: true, remaining: 0 })
    const third = await (await spend()).json()
    expect(third).toMatchObject({ allowed: false, remaining: 0 })
    expect(third.unlimited).toBeUndefined()
    expect(tables.standalone_unlocked_resources[0].status).toBe('revoked')
  })
})

describe('launchResource for Photo Booth', () => {
  const { launchResource } = jest.requireActual('@/lib/wallet/launch') as typeof import('@/lib/wallet/launch')

  const setup = (usageCount: number) => {
    const tables: Record<string, Row[]> = {
      user_wallets: [{ user_id: 'user-1', balance: 30 }],
      user_profiles: [{ id: 'user-1', profile_details: { purchased_addons: [] } }],
      credit_transactions: [purchase('tx-1', '2026-10-01')],
      standalone_unlocked_resources: [unlockRow('tx-1')],
      feature_usage: [{ user_id: 'user-1', feature_key: PHOTO_BOOTH_WALLET_USAGE_KEY, usage_count: usageCount }],
    }
    const deducts: unknown[] = []
    const client = fakeSupabase(tables, {
      rpc: (name, args) => {
        if (name !== 'deduct_wallet_credits_atomic') return null
        deducts.push(args)
        return { success: true, balance: 15, transaction_id: 'tx-2' }
      },
    }).client
    return { client, deducts, tables }
  }

  it('photos left: buying again is not charged', async () => {
    const { client, deducts } = setup(1)
    const r = await launchResource(client, 'user-1', { resourceType: 'tool', resourceId: 'photo-booth' })
    expect(r.body).toMatchObject({ success: true, alreadyUnlocked: true, charged: 0 })
    expect(deducts).toHaveLength(0)
  })

  it('both photos used: buying again charges 15 credits, even if the pack was never closed', async () => {
    const { client, deducts, tables } = setup(2)
    const r = await launchResource(client, 'user-1', { resourceType: 'tool', resourceId: 'photo-booth' })
    expect(tables.standalone_unlocked_resources[0].status).toBe('revoked')
    expect(r.body).toMatchObject({ success: true, charged: 15 })
    expect(deducts[0]).toMatchObject({ p_credit_cost: 15, p_description: 'Photo Booth - 2 photos' })
  })
})
