/**
 * Smart Form Filler credits unlock ONE form at a time.
 * Bug fixed here: the only credit item was the whole tool, so unlocking one form
 * (39 credits) opened every form in the library. Unlocks sold before the fix (a
 * whole-tool row) and the legacy "smart" add-on still open every form.
 */

import { getFormConfig } from '@/lib/formConfig'
import {
  getCatalogItem,
  isSmartFormItem,
  normalizeSmartFormCode,
  resolveUnlockedItems,
  SMART_FORM_CODES,
  smartFormResourceId,
  type UnlockRow,
} from '@/lib/wallet/catalog'
import { isCatalogItemOwned } from '@/lib/wallet/resourceMapping'

const row = (resource_id: string, status = 'active'): UnlockRow => ({
  resource_type: 'tool',
  resource_id,
  status,
})
const unlockedIds = (rows: UnlockRow[], addons: string[] = []) =>
  resolveUnlockedItems(rows, addons).map((item) => item.resourceId)

describe('per-form catalog items', () => {
  it('lists exactly the forms that have a Smart Form Filler config', () => {
    for (const code of SMART_FORM_CODES) expect(getFormConfig(code)).not.toBeNull()
    expect(new Set(SMART_FORM_CODES).size).toBe(SMART_FORM_CODES.length)
  })

  it('prices each form like the tool and names it', () => {
    const item = getCatalogItem('tool', 'form-forge:i485')
    expect(item).toMatchObject({ credits: 39, launchable: true, name: 'Smart Form Filler (I-485)' })
    expect(getCatalogItem('tool', 'form-forge:ds260')?.name).toBe('Smart Form Filler (DS-260)')
    expect(getCatalogItem('tool', 'form-forge:i864ez')?.name).toBe('Smart Form Filler (I-864EZ)')
    expect(isSmartFormItem(item!)).toBe(true)
  })

  it('no longer sells the whole tool', () => {
    expect(getCatalogItem('tool', 'form-forge')?.launchable).toBe(false)
  })

  it('refuses forms that are not in the library', () => {
    expect(getCatalogItem('tool', 'form-forge:x999')).toBeNull()
    expect(smartFormResourceId('N-400')).toBeNull()
    expect(normalizeSmartFormCode('I-130A')).toBe('i130a')
    expect(smartFormResourceId('I-130')).toBe('form-forge:i130')
  })
})

describe('what a form unlock opens', () => {
  it('one form unlock opens that form only', () => {
    const ids = unlockedIds([row('form-forge:i485')])
    expect(ids).toContain('form-forge:i485')
    expect(ids).not.toContain('form-forge:i130')
    expect(ids).not.toContain('form-forge')
  })

  it('a revoked form unlock opens nothing', () => {
    expect(unlockedIds([row('form-forge:i485', 'revoked')])).not.toContain('form-forge:i485')
  })

  it('a whole-tool unlock sold before the fix still opens every form', () => {
    const ids = unlockedIds([row('form-forge')])
    for (const code of SMART_FORM_CODES) expect(ids).toContain(`form-forge:${code}`)
  })

  it('the legacy "smart" add-on still opens every form', () => {
    const ids = unlockedIds([], ['smart'])
    for (const code of SMART_FORM_CODES) expect(ids).toContain(`form-forge:${code}`)
  })
})

describe('tool card ownership', () => {
  const tool = getCatalogItem('tool', 'form-forge')!
  const owned = (ids: string[]) => isCatalogItemOwned(tool, (id) => ids.includes(id))

  it('counts the tool as owned once any form is unlocked', () => {
    expect(owned([])).toBe(false)
    expect(owned(['form-forge:i485'])).toBe(true)
    expect(owned(['form-forge'])).toBe(true)
  })
})
