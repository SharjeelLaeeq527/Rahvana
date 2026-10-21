/**
 * Maps tool and guide IDs to their corresponding wallet catalog resources.
 * Prices are managed in `lib/wallet/catalog.ts`; this file only defines the mapping.
 * Items not listed here have no credit price and use the existing UpgradeModal UI.
 * `__tests__/wallet/resourceMapping.test.ts` checks that these mappings stay in sync.
 */
import { getCatalogItem, type WalletCatalogItem } from "@/lib/wallet/catalog";

/** Tool IDs from `app/(tools)/tools/page.tsx` mapped to their catalog resource IDs. */
export const TOOL_RESOURCE_IDS: Record<string, string> = {
  "sponsorship-calculator": "sponsorship-calculator",
  "form-forge": "form-forge",
  "221g-planner": "221g-planner",
  "interview-prep": "interview-prep",
  "photo-booth": "photo-booth",
  "pdf-toolkit": "pdf-toolkit",
};

/** Guide IDs from `app/(tools)/guides/page.tsx` mapped to their catalog resource IDs. */
export const GUIDE_RESOURCE_IDS: Record<string, string> = {
  passport: "guide-passport",
  "police-verification": "guide-police",
  cnic: "guide-cnic",
  "birth-certificate": "guide-birth-cert",
  frc: "guide-frc",
  "marriage-certificate": "guide-nikah-nama",
  vaccinations: "guide-polio",
};

/** Service IDs from `app/(main)/services/page.tsx` mapped to their catalog resource IDs. */
export const SERVICE_RESOURCE_IDS: Record<string, string> = {
  "book-medical-appointment": "book-medical-appointment",
  "pcc-filing-service": "pcc-filing-service",
  "pcc-filing-service-, -sindh": "pcc-filing-service",
  "document-translation": "document-translation",
  "urdu-→-english-translation": "document-translation",
  "book-a-consultation": "book-a-consultation",
};

/** Returns the catalog item for a tool, or null if it isn't mapped. */
export function getToolCatalogItem(toolId: string): WalletCatalogItem | null {
  const resourceId = TOOL_RESOURCE_IDS[toolId];
  return resourceId ? getCatalogItem("tool", resourceId) : null;
}

/** Returns the catalog item for a guide, or null if it isn't mapped. */
export function getGuideCatalogItem(guideId: string): WalletCatalogItem | null {
  const resourceId = GUIDE_RESOURCE_IDS[guideId];
  return resourceId ? getCatalogItem("guide", resourceId) : null;
}

/** Returns the catalog item for a service, or null if it isn't mapped. */
export function getServiceCatalogItem(serviceId: string): WalletCatalogItem | null {
  const resourceId = SERVICE_RESOURCE_IDS[serviceId] ?? serviceId;
  const item = getCatalogItem("service", resourceId);
  return item;
}

/** Adds preview mode to a tool URL. */
export function withPreviewMode(href: string): string {
  return `${href}${href.includes("?") ? "&" : "?"}mode=preview`;
}
