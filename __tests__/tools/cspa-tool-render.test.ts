/**
 * Render check for components/tools/CspaAgeCheckerTool.tsx (Jest + tsc do not catch render
 * crashes on their own). Renders the journey mode with saved input for every result status, and
 * confirms standalone mode never shows journey data even if a caller passes it.
 */

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import CspaAgeCheckerTool from "@/components/tools/CspaAgeCheckerTool";
import type { CspaInput } from "@/lib/tools/cspa/ageOut";

jest.mock("@/app/components/shared/QuickAccessButton", () => ({
  QuickAccessButton: () => null,
}));

const render = (props: Record<string, unknown>) =>
  renderToStaticMarkup(React.createElement(CspaAgeCheckerTool, props as never));

const journey = (initialInput: Partial<CspaInput>) =>
  render({ mode: "journey", showHeader: false, skipIntro: true, initialInput, onSave: () => {} });

describe("CspaAgeCheckerTool render", () => {
  it("renders the empty standalone page with sources and no save button", () => {
    const html = render({ mode: "standalone" });
    expect(html).toContain("CSPA Age-Out Checker");
        expect(html).toContain("https://www.uscis.gov/");
    expect(html).not.toContain("Save to this journey");
  });

  it("opens on the intro card, not the form, in both modes", () => {
    for (const mode of ["standalone", "journey"]) {
      const html = render({ mode, initialInput: { dateOfBirth: "2006-03-10" } });
      expect(html).toContain("What this tool is");
      expect(html).toContain("Why you need it");
      expect(html).toContain("How it helps");
      expect(html).toContain("What you will need");
      expect(html).toContain(">Continue<");
      expect(html).not.toContain("Your result will show here");
      expect(html).not.toContain("Common questions");
      expect(/[–—‘’“”…]/.test(html)).toBe(false);
    }
  });

  it("skipIntro opens straight on the checker with a way back to the intro", () => {
    const html = render({ mode: "standalone", skipIntro: true });
    expect(html).toContain("Your result will show here");
    expect(html).toContain("What is CSPA?");
    expect(html).not.toContain("What you will need");
    expect(html).toContain("Find out if your child");
  });

  it("does not repeat the header lead line on the intro screen", () => {
    expect(render({ mode: "standalone" })).not.toContain("Find out if your child");
  });

  it("ignores journey input in standalone mode", () => {
    const html = render({ mode: "standalone", skipIntro: true, initialInput: { dateOfBirth: "2006-03-10" } });
    expect(html).not.toContain("2006-03-10");
    expect(html).toContain("Your result will show here");
  });

  it.each<[string, Partial<CspaInput>, string]>([
    ["protected", { dateOfBirth: "2006-03-10", i130Filed: true, filingDate: "2025-06-01", parentStatusAtFiling: "citizen" }, "Protected"],
    ["aged out", { dateOfBirth: "2000-01-01", i130Filed: true, filingDate: "2025-06-01", parentStatusAtFiling: "citizen" }, "Over the age limit"],
    ["married", { dateOfBirth: "2006-03-10", maritalStatus: "married" }, "Does not qualify"],
    ["invalid date", { dateOfBirth: "2010-03-10", relationship: "adopted", adoptionDate: "2029-01-01" }, "Check the dates"],
    ["stepchild late", { dateOfBirth: "2000-03-10", relationship: "stepchild", stepMarriageDate: "2019-01-01", i130Filed: true, filingDate: "2020-01-01", parentStatusAtFiling: "citizen" }, "Relationship check"],
  ])("renders the %s result in journey mode with a save button", (_name, input, expected) => {
    const html = journey(input);
    expect(html).toContain(expected);
    if (!["invalid date"].includes(_name)) expect(html).toContain("Save to this journey");
  });
});
