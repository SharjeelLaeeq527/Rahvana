import {
  GUIDE_RESOURCE_IDS,
  SERVICE_RESOURCE_IDS,
  TOOL_RESOURCE_IDS,
  getGuideCatalogItem,
  getServiceCatalogItem,
  getToolCatalogItem,
  withPreviewMode,
} from "@/lib/wallet/resourceMapping";
import { WALLET_CATALOG, getCatalogItem } from "@/lib/wallet/catalog";

describe("Phase 5 & 6 catalog <-> page mapping", () => {
  it("maps every tool page id to a launchable tool catalog item", () => {
    for (const [pageId, resourceId] of Object.entries(TOOL_RESOURCE_IDS)) {
      const item = getToolCatalogItem(pageId);
      expect(item).not.toBeNull();
      expect(item!.resourceType).toBe("tool");
      expect(item!.resourceId).toBe(resourceId);
      expect(item!.launchable).toBe(true);
    }
  });

  it("maps every guide page id to a launchable guide catalog item at 5 credits", () => {
    for (const resourceId of Object.values(GUIDE_RESOURCE_IDS)) {
      const item = getCatalogItem("guide", resourceId);
      expect(item).not.toBeNull();
      expect(item!.launchable).toBe(true);
      expect(item!.credits).toBe(5);
    }
    expect(getGuideCatalogItem("vaccinations")?.resourceId).toBe("guide-polio"); // 7th paid guide
    expect(getGuideCatalogItem("step-parent")).toBeNull(); // public guides are not credit-payable
  });

  it("maps all standalone services to their catalog items", () => {
    for (const [servicePageId, resourceId] of Object.entries(SERVICE_RESOURCE_IDS)) {
      const item = getServiceCatalogItem(servicePageId);
      expect(item).not.toBeNull();
      expect(item!.resourceType).toBe("service");
      expect(item!.resourceId).toBe(resourceId);
    }
  });

  it("has a page mapping for every launchable tool/guide in the catalog (no drift)", () => {
    const mappedToolIds = new Set(Object.values(TOOL_RESOURCE_IDS));
    const mappedGuideIds = new Set(Object.values(GUIDE_RESOURCE_IDS));
    for (const item of WALLET_CATALOG) {
      if (!item.launchable || item.resourceType === "service") continue;
      if (item.resourceType === "tool") expect(mappedToolIds.has(item.resourceId)).toBe(true);
      if (item.resourceType === "guide") expect(mappedGuideIds.has(item.resourceId)).toBe(true);
    }
  });

  it("appends ?mode=preview without clobbering existing query strings", () => {
    expect(withPreviewMode("/affidavit-support-calculator")).toBe(
      "/affidavit-support-calculator?mode=preview"
    );
    expect(withPreviewMode("/guides/passport-guide?tab=x")).toBe(
      "/guides/passport-guide?tab=x&mode=preview"
    );
  });
});
