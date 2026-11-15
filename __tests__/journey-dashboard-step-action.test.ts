import { resolveStepAction } from "@/lib/journey/dashboard/stepAction";
import ir1 from "@/data/visa-category/ir-1.json";
import ir5 from "@/data/visa-category/ir-5.json";

const allSteps = (d: { chapters: { steps: unknown[] }[] }) => d.chapters.flatMap((c) => c.steps);

describe("hero step action", () => {
  it("opens the toolbox item a step is built around, inside the journey", () => {
    expect(resolveStepAction({ tool_data: { type: "polio_certificate" } })).toEqual({
      kind: "tool",
      label: expect.any(String),
      componentKey: "polio_vaccination_guide",
    });
  });

  it("maps guide and tool pages to in-journey items, and keeps portals as links", () => {
    expect(resolveStepAction({ relevantTools: [{ label: "Passport Guide", href: "/guides/passport-guide" }] })).toMatchObject({
      kind: "tool",
      componentKey: "passport_guide",
    });
    expect(resolveStepAction({ relevantTools: [{ label: "Sponsorship Calculator", href: "/affidavit-support-calculator" }] })).toMatchObject({
      kind: "tool",
      componentKey: "sponsorship_calculator",
    });
    expect(
      resolveStepAction({ tool_data: { launch_module: { button_label: "Create USCIS Account", href: "https://myaccount.uscis.gov/" } } })
    ).toMatchObject({ kind: "link", external: true, label: "Create USCIS Account" });
  });

  it("sends form-filler links to the step, which launches them in journey mode", () => {
    expect(
      resolveStepAction({ tool_data: { launch_module: { button_label: "Launch I-130 Autoform Filler", href: "/visa-forms/i130/wizard" } } })
    ).toEqual({ kind: "step", label: "Launch I-130 Autoform Filler" });
  });

  it("returns null when a step offers nothing", () => {
    expect(resolveStepAction({ step_name: "Wait" })).toBeNull();
  });

  it("produces plain-ASCII labels for every step in the live journeys", () => {
    for (const s of [...allSteps(ir1 as never), ...allSteps(ir5 as never)]) {
      const a = resolveStepAction(s);
      if (a) expect(a.label).toMatch(/^[\x20-\x7E]{1,34}$/);
    }
  });
});
