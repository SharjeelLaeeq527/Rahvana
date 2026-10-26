/**
 * Rahvana Wallet catalog: the server-authoritative credit price of every
 * standalone resource ($1 = 1 credit). The client only ever sends a resource id;
 * the cost charged always comes from here.
 *
 * Prices mirror the add-on catalog in app/(main)/pricing/data/pricing.ts
 * (`legacyAddonId` links the two; __tests__/wallet/catalog.test.ts fails if they
 * drift).
 *
 * Journey plans never use this: tools launched inside a journey roadmap run on the
 * journey tier and cost 0 credits.
 */

export type WalletResourceType = "tool" | "guide" | "service";

export type WalletCatalogItem = {
  resourceType: WalletResourceType;
  resourceId: string;
  name: string;
  credits: number;
  /** Id of the matching legacy add-on in profile_details.purchased_addons. */
  legacyAddonId: string;
  /**
   * Whether owning the legacy add-on means permanent standalone access.
   * False for consumables (photo = 2 uses per purchase; services = 1 booking),
   * which keep working through the legacy purchased_addons + feature_usage pools.
   */
  legacyGrantsUnlock: boolean;
  /**
   * Services are booked per use, not unlocked once. The deduct RPC grants a
   * permanent unlock, so services cannot be paid with credits until a per-booking
   * flow exists. They stay listed here for their display price.
   */
  launchable: boolean;
};

/** Legacy bundle that unlocks every civil document guide. */
export const LEGACY_CIVIL_GUIDES_BUNDLE = "civil-guid";

/**
 * The six civil-document guides the legacy "all guides" add-on covers.
 * The Polio Vaccination guide is Medical & Exam, was never part of that
 * bundle, and has no individual legacy add-on - it is credit-unlock only.
 */
const CIVIL_GUIDE_RESOURCE_IDS: ReadonlySet<string> = new Set([
  "guide-passport",
  "guide-police",
  "guide-cnic",
  "guide-birth-cert",
  "guide-frc",
  "guide-nikah-nama",
]);

const tool = (
  resourceId: string,
  name: string,
  credits: number,
  legacyAddonId: string,
  legacyGrantsUnlock = true
): WalletCatalogItem => ({
  resourceType: "tool",
  resourceId,
  name,
  credits,
  legacyAddonId,
  legacyGrantsUnlock,
  launchable: true,
});

const guide = (
  resourceId: string,
  name: string,
  /** Empty = never sold as a legacy add-on; credits are the only unlock path. */
  legacyAddonId = resourceId
): WalletCatalogItem => ({
  resourceType: "guide",
  resourceId,
  name,
  credits: 5,
  legacyAddonId,
  legacyGrantsUnlock: true,
  launchable: true,
});

const service = (
  resourceId: string,
  name: string,
  credits: number,
  legacyAddonId: string
): WalletCatalogItem => ({
  resourceType: "service",
  resourceId,
  name,
  credits,
  legacyAddonId,
  legacyGrantsUnlock: false,
  launchable: false,
});

/** The Smart Form Filler tool. Its forms are unlocked one at a time (below). */
export const SMART_FORM_TOOL_ID = "form-forge";

export const WALLET_CATALOG: readonly WalletCatalogItem[] = [
  tool("sponsorship-calculator", "Sponsorship Calculator", 15, "sponsor"),
  // Not launchable: credits unlock one form at a time (`form-forge:<form code>`).
  // An unlock row for the whole tool (sold before per-form unlocks) and the legacy
  // "smart" add-on still open every form.
  { ...tool(SMART_FORM_TOOL_ID, "Smart Form Filler", 39, "smart"), launchable: false },
  tool("221g-planner", "221(g) Action Planner", 199, "221g"),
  tool("interview-prep", "Interview Prep", 200, "interview-prep"),
  tool("photo-booth", "Photo Booth", 15, "photo", false),
  tool("pdf-toolkit", "PDF Tool Kit", 69, "pdf"),
  guide("guide-passport", "Passport Guide"),
  guide("guide-police", "Police Verification Guide"),
  guide("guide-cnic", "CNIC Guide"),
  guide("guide-birth-cert", "Birth Certificate Guide"),
  guide("guide-frc", "FRC Guide"),
  guide("guide-nikah-nama", "Marriage Guide (Nikah Nama)"),
  // No legacy add-on id: nothing in purchased_addons can ever grant this guide.
  guide("guide-polio", "Polio Vaccination Guide", ""),
  service("book-medical-appointment", "Book Medical Appointment", 5, "medical"),
  service("pcc-filing-service", "PCC Filing (Sindh Only)", 25, "pcc"),
  service("document-translation", "Document Translation", 25, "translate"),
  service("book-a-consultation", "Expert Consultation", 99, "consultation"),
];

/**
 * Forms in the Smart Form Filler library, by normalized form code. Each one is
 * unlocked separately for the tool's price. Must match lib/formConfig
 * (__tests__/wallet/smartFormUnlock.test.ts fails if they drift).
 */
export const SMART_FORM_CODES: readonly string[] = [
  "i130",
  "i130a",
  "i129f",
  "i864",
  "i864a",
  "i864ez",
  "i912",
  "i693",
  "ds260",
  "i485",
  "g1450",
  "g1650",
  "g1651",
];

const SMART_FORM_PREFIX = `${SMART_FORM_TOOL_ID}:`;

/** Normalized code of a library form ("I-130" -> "i130"), or null for any other form. */
export function normalizeSmartFormCode(formCode: unknown): string | null {
  if (typeof formCode !== "string") return null;
  const code = formCode.toLowerCase().replace(/[^a-z0-9]/g, "");
  return SMART_FORM_CODES.includes(code) ? code : null;
}

/** Unlock id of one form (`form-forge:i130`), or null for an unknown form. */
export function smartFormResourceId(formCode: unknown): string | null {
  const code = normalizeSmartFormCode(formCode);
  return code ? `${SMART_FORM_PREFIX}${code}` : null;
}

/** "i130" -> "I-130", "ds260" -> "DS-260", "i864ez" -> "I-864EZ". */
function smartFormLabel(code: string): string {
  const m = /^([a-z]+)(\d+)([a-z]*)$/.exec(code);
  return m ? `${m[1].toUpperCase()}-${m[2]}${m[3].toUpperCase()}` : code.toUpperCase();
}

const SMART_FORM_BASE = WALLET_CATALOG.find((i) => i.resourceId === SMART_FORM_TOOL_ID)!;

/** Catalog entry for one Smart Form Filler form: same price as the tool. */
function smartFormItem(code: string): WalletCatalogItem {
  return {
    ...SMART_FORM_BASE,
    resourceId: `${SMART_FORM_PREFIX}${code}`,
    name: `Smart Form Filler (${smartFormLabel(code)})`,
    launchable: true,
  };
}

const SMART_FORM_ITEMS: readonly WalletCatalogItem[] = SMART_FORM_CODES.map(smartFormItem);

/** An unlock of one Smart Form Filler form (not the whole tool). */
export function isSmartFormItem(item: WalletCatalogItem): boolean {
  return item.resourceType === "tool" && item.resourceId.startsWith(SMART_FORM_PREFIX);
}

/**
 * Credits for a legacy add-on id (the ids pricing.ts and the sales pages use), so
 * UIs can quote the standalone price in wallet credits ($1 = 1 credit). For a tool
 * or guide that is a one-time unlock; for a service it is the price of one booking.
 * Returns undefined for ids with no wallet counterpart (e.g. the civil-guide bundle).
 */
export function getCreditsForLegacyAddon(addonId: unknown): number | undefined {
  if (typeof addonId !== "string" || !addonId) return undefined;
  return WALLET_CATALOG.find((i) => i.legacyAddonId === addonId)?.credits;
}

export function getCatalogItem(
  resourceType: unknown,
  resourceId: unknown
): WalletCatalogItem | null {
  if (typeof resourceType !== "string" || typeof resourceId !== "string") return null;
  return (
    [...WALLET_CATALOG, ...SMART_FORM_ITEMS].find(
      (item) => item.resourceType === resourceType && item.resourceId === resourceId
    ) ?? null
  );
}

/** Whether a legacy add-on ledger entry grants this item permanently. */
function legacyAddonMatches(item: WalletCatalogItem, addonId: string): boolean {
  if (!item.legacyGrantsUnlock) return false;
  if (item.legacyAddonId && addonId === item.legacyAddonId) return true;
  // Interview prep was sold per category ("interview-prep:ir-1-spouse"). A
  // category purchase keeps its per-category, per-session access through
  // lib/interview-prep/purchase-validation.ts; only the bare all-categories
  // add-on ("interview-prep", matched above) grants the whole tool.
  return (
    item.resourceType === "guide" &&
    CIVIL_GUIDE_RESOURCE_IDS.has(item.resourceId) &&
    addonId === LEGACY_CIVIL_GUIDES_BUNDLE
  );
}

export type UnlockRow = { resource_type: string; resource_id: string; status: string };

/**
 * Catalog items the user can use standalone without paying: an active wallet
 * unlock row, or a legacy add-on purchase that grants permanent access.
 * Consumable legacy add-ons are deliberately excluded (see `legacyGrantsUnlock`).
 */
export function resolveUnlockedItems(
  unlockRows: readonly UnlockRow[],
  purchasedAddons: readonly unknown[]
): WalletCatalogItem[] {
  const active = unlockRows.filter((row) => row.status === "active");
  const addons = purchasedAddons.filter((a): a is string => typeof a === "string");
  const hasCivilBundleRow = active.some((row) => row.resource_id === LEGACY_CIVIL_GUIDES_BUNDLE);
  // An unlock of the whole Smart Form Filler, sold before forms were unlocked one by one.
  const hasWholeSmartFormRow = active.some(
    (row) => row.resource_type === "tool" && row.resource_id === SMART_FORM_TOOL_ID
  );

  return [...WALLET_CATALOG, ...SMART_FORM_ITEMS].filter((item) => {
    if (
      active.some(
        (row) => row.resource_type === item.resourceType && row.resource_id === item.resourceId
      )
    ) {
      return true;
    }
    if (
      item.resourceType === "guide" &&
      CIVIL_GUIDE_RESOURCE_IDS.has(item.resourceId) &&
      hasCivilBundleRow
    )
      return true;
    if (isSmartFormItem(item) && hasWholeSmartFormRow) return true;
    return addons.some((addonId) => legacyAddonMatches(item, addonId));
  });
}

export function isItemUnlocked(
  item: WalletCatalogItem,
  unlockRows: readonly UnlockRow[],
  purchasedAddons: readonly unknown[]
): boolean {
  return resolveUnlockedItems(unlockRows, purchasedAddons).some(
    (unlocked) =>
      unlocked.resourceType === item.resourceType && unlocked.resourceId === item.resourceId
  );
}
