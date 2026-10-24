/**
 * Phase 7: legacy add-on purchases stay usable without paying credits again.
 * Risks: the SQL backfill mapping drifting from the catalog (a buyer charged
 * again, or a consumable turned into unlimited access), and a client profile
 * save adding or erasing `purchased_addons` (free add-ons / lost purchases).
 */

import fs from 'fs'
import path from 'path'
import {
  WALLET_CATALOG,
  LEGACY_CIVIL_GUIDES_BUNDLE,
  resolveUnlockedItems,
} from '@/lib/wallet/catalog'
import { SERVER_OWNED_PROFILE_KEYS, withServerOwnedKeys } from '@/lib/profile/serverOwnedKeys'
import { POST as saveProfile } from '@/app/api/profile/complete/route'

let storedDetails: Record<string, unknown> | null
const serviceUpdates: Record<string, unknown>[] = []

jest.mock('@/lib/profile/schema', () => ({ validateProfile: () => ({}) }))
jest.mock('@/lib/encryption', () => ({ encrypt: (v: string) => `enc:${v}` }))
jest.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: { id: 'user-1' } }, error: null }) },
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data: storedDetails ? { id: 'user-1', profile_details: storedDetails } : null,
            error: null,
          }),
        }),
      }),
    }),
  }),
}))
jest.mock('@supabase/ssr', () => ({
  createServerClient: () => ({
    from: () => ({
      update: (row: Record<string, unknown>) => {
        serviceUpdates.push(row)
        return { eq: async () => ({ error: null }) }
      },
    }),
  }),
}))

const migration = (name: string) =>
  fs.readFileSync(path.join(process.cwd(), 'supabase', 'migrations', name), 'utf8')

function sqlLegacyMap(): string[] {
  const sql = migration('20261023_02_sync_legacy_addon_unlocks.sql')
  const block = sql.slice(sql.indexOf('LEGACY_ADDON_MAP_START'), sql.indexOf('LEGACY_ADDON_MAP_END'))
  return [...block.matchAll(/\('([^']+)',\s*'([^']+)',\s*'([^']+)'\)/g)]
    .map(([, addon, type, id]) => `${addon}|${type}|${id}`)
    .sort()
}

describe('legacy add-on backfill mapping', () => {
  it('matches the catalog exactly (permanent add-ons + the civil guides bundle)', () => {
    const expected = WALLET_CATALOG.filter((i) => i.legacyGrantsUnlock && i.legacyAddonId)
      .map((i) => `${i.legacyAddonId}|${i.resourceType}|${i.resourceId}`)
      .concat(`${LEGACY_CIVIL_GUIDES_BUNDLE}|guide|${LEGACY_CIVIL_GUIDES_BUNDLE}`)
      .sort()
    expect(sqlLegacyMap()).toEqual(expected)
  })

  it('never maps consumables, services or per-category interview prep', () => {
    const addons = sqlLegacyMap().map((row) => row.split('|')[0])
    for (const banned of ['photo', 'medical', 'pcc', 'translate', 'consultation', 'doc-review']) {
      expect(addons).not.toContain(banned)
    }
    expect(addons.filter((a) => a.startsWith('interview-prep:'))).toEqual([])
    expect(sqlLegacyMap().some((row) => row.split('|')[1] === 'service')).toBe(false)
  })

  it('every row the backfill writes is honoured as an unlock by the catalog', () => {
    for (const row of sqlLegacyMap()) {
      const [, type, id] = row.split('|')
      const unlocked = resolveUnlockedItems([{ resource_type: type, resource_id: id, status: 'active' }], [])
      expect(unlocked.length).toBeGreaterThan(0)
    }
  })

  it('a revoked backfilled row does not grant access on its own', () => {
    expect(
      resolveUnlockedItems([{ resource_type: 'tool', resource_id: 'pdf-toolkit', status: 'revoked' }], [])
    ).toEqual([])
  })

  it('a legacy buyer keeps access even before the row exists (live read)', () => {
    const ids = resolveUnlockedItems([], ['pdf', 'interview-prep:ir-1-spouse', 'photo', 'medical']).map(
      (i) => i.resourceId
    )
    expect(ids).toEqual(['pdf-toolkit'])
  })
})

describe('server-owned profile keys', () => {
  it('the DB guard protects the same keys as the app', () => {
    const sql = migration('20261023_01_protect_server_owned_profile_keys.sql')
    const block = sql.slice(sql.indexOf('c_server_keys CONSTANT TEXT[] := ARRAY['), sql.indexOf('];'))
    const keys = [...block.matchAll(/'([^']+)'/g)].map((m) => m[1]).sort()
    expect(keys).toEqual([...SERVER_OWNED_PROFILE_KEYS].sort())
  })

  it('a client save cannot add add-ons', () => {
    const out = withServerOwnedKeys(
      { fullName: 'A', purchased_addons: ['221g', 'smart', 'civil-guid'] },
      { fullName: 'old', purchased_addons: ['pdf'] }
    )
    expect(out).toEqual({ fullName: 'A', purchased_addons: ['pdf'] })
  })

  it('a stale client save cannot erase a purchase or the processed-checkout list', () => {
    const stored = {
      purchased_addons: ['pdf', 'sponsor'],
      processed_addon_checkout_sessions: ['cs_1'],
      stripe_subscription_id: 'sub_1',
    }
    expect(withServerOwnedKeys({ fullName: 'A' }, stored)).toEqual({ fullName: 'A', ...stored })
    expect(
      withServerOwnedKeys({ processed_addon_checkout_sessions: [], purchased_addons: [] }, stored)
    ).toEqual(stored)
  })

  it('a first save (no stored row) carries no server-owned keys', () => {
    expect(withServerOwnedKeys({ fullName: 'A', active_plan: 'executive' }, null)).toEqual({ fullName: 'A' })
  })
})

describe('POST /api/profile/complete', () => {
  beforeEach(() => {
    serviceUpdates.length = 0
  })

  const save = (profile_details: Record<string, unknown>) =>
    saveProfile(
      new Request('http://localhost/api/profile/complete', {
        method: 'POST',
        body: JSON.stringify({ profile_details }),
      })
    )

  it('keeps the stored purchases whatever the client sends', async () => {
    storedDetails = { purchased_addons: ['pdf'], processed_addon_checkout_sessions: ['cs_1'] }
    const res = await save({ purchased_addons: ['221g', 'smart'], processed_addon_checkout_sessions: [] })
    expect(res.status).toBe(200)
    expect(serviceUpdates[0].profile_details).toMatchObject({
      purchased_addons: ['pdf'],
      processed_addon_checkout_sessions: ['cs_1'],
    })
  })

  it('a save without the ledger does not erase it', async () => {
    storedDetails = { purchased_addons: ['sponsor', 'sponsor'] }
    await save({ fullName: 'Test' })
    expect(serviceUpdates[0].profile_details).toMatchObject({ purchased_addons: ['sponsor', 'sponsor'] })
  })
})
