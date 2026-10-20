/**
 * Wallet catalog (lib/wallet/catalog.ts).
 * Risk: charging a different price than the add-on catalog, charging users who
 * already own a resource, or turning a consumable legacy add-on into free
 * unlimited access.
 */

import { ADDONS } from '@/app/(main)/pricing/data/pricing'
import {
  WALLET_CATALOG,
  getCatalogItem,
  resolveUnlockedItems,
  isItemUnlocked,
} from '@/lib/wallet/catalog'

const ids = (items: { resourceId: string }[]) => items.map((i) => i.resourceId).sort()

describe('WALLET_CATALOG', () => {
  it('prices every item exactly like its add-on in the pricing catalog', () => {
    for (const item of WALLET_CATALOG) {
      const addon = (ADDONS as any[]).find((a) => a.id === item.legacyAddonId)
      expect({ id: item.resourceId, price: addon?.price }).toEqual({ id: item.resourceId, price: item.credits })
    }
  })

  it('has whole, positive prices and unique ids', () => {
    for (const item of WALLET_CATALOG) {
      expect(Number.isInteger(item.credits) && item.credits > 0).toBe(true)
    }
    const keys = WALLET_CATALOG.map((i) => `${i.resourceType}/${i.resourceId}`)
    expect(new Set(keys).size).toBe(keys.length)
  })

  it('does not let services be launched (they are per booking)', () => {
    for (const item of WALLET_CATALOG.filter((i) => i.resourceType === 'service')) {
      expect(item.launchable).toBe(false)
    }
  })
})

describe('getCatalogItem', () => {
  it('requires the type to match the id', () => {
    expect(getCatalogItem('tool', 'sponsorship-calculator')?.credits).toBe(15)
    expect(getCatalogItem('guide', 'sponsorship-calculator')).toBeNull()
    expect(getCatalogItem('tool', 'nope')).toBeNull()
    expect(getCatalogItem(undefined, 123)).toBeNull()
  })
})

describe('resolveUnlockedItems', () => {
  it('counts only active wallet unlock rows', () => {
    const rows = [
      { resource_type: 'tool', resource_id: 'pdf-toolkit', status: 'active' },
      { resource_type: 'tool', resource_id: 'form-forge', status: 'revoked' },
    ]
    expect(ids(resolveUnlockedItems(rows, []))).toEqual(['pdf-toolkit'])
  })

  it('grandfathers permanent legacy add-ons, including per-category interview prep', () => {
    expect(ids(resolveUnlockedItems([], ['sponsor', 'interview-prep:ir1', 'guide-cnic']))).toEqual([
      'guide-cnic',
      'interview-prep',
      'sponsorship-calculator',
    ])
  })

  it('expands the legacy civil guides bundle to every guide', () => {
    const guides = WALLET_CATALOG.filter((i) => i.resourceType === 'guide').map((i) => i.resourceId).sort()
    expect(ids(resolveUnlockedItems([], ['civil-guid']))).toEqual(guides)
    expect(
      ids(resolveUnlockedItems([{ resource_type: 'guide', resource_id: 'civil-guid', status: 'active' }], []))
    ).toEqual(guides)
  })

  it('never turns consumable legacy add-ons into unlimited access', () => {
    expect(resolveUnlockedItems([], ['photo', 'medical', 'pcc', 'translate', 'consultation'])).toEqual([])
  })

  it('ignores junk in purchased_addons', () => {
    expect(resolveUnlockedItems([], [null, 42, { id: 'sponsor' }])).toEqual([])
  })

  it('isItemUnlocked agrees with resolveUnlockedItems', () => {
    const item = getCatalogItem('guide', 'guide-frc')!
    expect(isItemUnlocked(item, [], ['civil-guid'])).toBe(true)
    expect(isItemUnlocked(item, [], ['guide-cnic'])).toBe(false)
  })
})
