/** @jest-environment node */
// The Resources catalog (My Resources tabs + standalone /tools, /guides, /services) renders on the
// shared catalog UI: tool-layout paper + band, one accent palette per resource, no legacy ribbon.
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

jest.mock("next/navigation", () => ({ useRouter: () => ({ push: jest.fn(), replace: jest.fn() }) }));
jest.mock("@/app/context/AuthContext", () => ({ useAuth: () => ({ user: null }) }));
jest.mock("@/app/context/LanguageContext", () => ({ useLanguage: () => ({ t: (k: string) => k }) }));
jest.mock("@/app/context/PlanContext", () => ({
  usePlan: () => ({
    isLoading: false,
    isLocked: () => true,
    journeyTiers: {},
    entitlement: () => ({ upgradeTarget: "premium" }),
  }),
}));
jest.mock("@/app/context/WalletContext", () => ({
  useWallet: () => ({ isLoading: false, isUnlocked: () => false }),
}));
jest.mock("@/app/context/JourneyEnvironmentContext", () => ({
  useJourneyEnvironment: () => ({ isInsideJourney: false }),
}));
jest.mock("@/app/context/QuickAccessContext", () => ({
  useQuickAccess: () => ({
    items: [],
    addItem: jest.fn(),
    removeItem: jest.fn(),
    isPending: false,
    isInQuickAccess: () => false,
  }),
}));
jest.mock("@/app/components/shared/ToastProvider", () => ({ useToast: () => ({ showToast: jest.fn() }) }));
jest.mock("@/app/context/CandidateContext", () => ({
  useCandidate: () => ({ activeCandidateId: "candidate-1", activeCandidate: {}, isMultiCandidate: false }),
}));
jest.mock("@/app/components/wallet/CreditLaunchModal", () => ({ CreditLaunchModal: () => null }));
jest.mock("@/app/components/entitlements/UpgradeModal", () => ({ UpgradeModal: () => null }));

import ToolsPage from "@/app/(tools)/tools/page";
import GuidesPage from "@/app/(tools)/guides/page";
import ServicesPage from "@/app/(main)/services/page";

const render = (C: React.ComponentType<{ isEmbedded?: boolean }>, isEmbedded: boolean) =>
  renderToStaticMarkup(React.createElement(C, { isEmbedded }));

test.each([
  ["tools", ToolsPage, "Browse Tools"],
  ["guides", GuidesPage, "Browse Guides"],
  ["services", ServicesPage, "Browse Services"],
])("%s tab in My Resources uses the catalog cards", (_name, Page, browseTitle) => {
  const html = render(Page, true);
  expect(html).toContain(browseTitle);
  expect(html).toContain("--cat-accent:");
  expect(html).toContain("font-serif");
  expect(html).not.toContain("ribbon.png");
  // The band comes from ResourcesContent, not from each tab.
  expect(html).not.toContain("mt-[55px]");
});

test.each([
  ["tools", ToolsPage],
  ["guides", GuidesPage],
  ["services", ServicesPage],
])("standalone %s page draws the band and the filters", (_name, Page) => {
  const html = render(Page, false);
  expect(html).toContain("mt-[55px]");
  expect(html).toContain("bg-[#F6F4EF]");
  expect(html).toContain('role="tablist"');
  expect(html).toContain('type="search"');
});

test("tool cards carry the theme of the tool they open", () => {
  const html = render(ToolsPage, true);
  expect(html).toContain("--cat-accent:#6A4C93"); // Interview Prep
  expect(html).toContain("--cat-accent:#9A4130"); // 221(g)
  expect(html).toContain("--cat-accent:#A8455E"); // Photo Booth
});
