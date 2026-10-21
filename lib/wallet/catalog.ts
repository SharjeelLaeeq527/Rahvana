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

const guide = (resourceId: string, name: string): WalletCatalogItem => ({
  resourceType: "guide",
  resourceId,
  name,
  credits: 5,
  legacyAddonId: resourceId,
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

export const WALLET_CATALOG: readonly WalletCatalogItem[] = [
  tool("sponsorship-calculator", "Sponsorship Calculator", 15, "sponsor"),
  tool("form-forge", "Smart Form Filler", 39, "smart"),
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
  service("book-medical-appointment", "Book Medical Appointment", 5, "medical"),
  service("pcc-filing-service", "PCC Filing (Sindh Only)", 25, "pcc"),
  service("document-translation", "Document Translation", 25, "translate"),
  service("book-a-consultation", "Expert Consultation", 99, "consultation"),
];

export function getCatalogItem(
  resourceType: unknown,
  resourceId: unknown
): WalletCatalogItem | null {
  if (typeof resourceType !== "string" || typeof resourceId !== "string") return null;
  return (
    WALLET_CATALOG.find(
      (item) => item.resourceType === resourceType && item.resourceId === resourceId
    ) ?? null
  );
}

/** Whether a legacy add-on ledger entry grants this item permanently. */
function legacyAddonMatches(item: WalletCatalogItem, addonId: string): boolean {
  if (!item.legacyGrantsUnlock) return false;
  if (addonId === item.legacyAddonId) return true;
  // Interview prep was sold per category ("interview-prep:ir1", ...).
  if (item.resourceId === "interview-prep" && addonId.startsWith("interview-prep")) return true;
  return item.resourceType === "guide" && addonId === LEGACY_CIVIL_GUIDES_BUNDLE;
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
  const hasCivilBundleRow = active.some(
    (row) => row.resource_id === LEGACY_CIVIL_GUIDES_BUNDLE
  );

  return WALLET_CATALOG.filter((item) => {
    if (
      active.some(
        (row) => row.resource_type === item.resourceType && row.resource_id === item.resourceId
      )
    ) {
      return true;
    }
    if (item.resourceType === "guide" && hasCivilBundleRow) return true;
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
