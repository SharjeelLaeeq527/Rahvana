/** @jest-environment node */
// The same tool layout renders on a standalone page and inside a journey; the journey launcher
// only sets the placement (ToolSurfaceProvider). Guards against tools growing a second UI again.
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

jest.mock("next/navigation", () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock("@/app/context/AuthContext", () => ({ useAuth: () => ({ user: null }) }));
jest.mock("@/app/context/QuickAccessContext", () => ({
  useQuickAccess: () => ({ items: [], addItem: jest.fn(), removeItem: jest.fn(), isPending: false }),
}));
jest.mock("@/app/components/shared/ToastProvider", () => ({ useToast: () => ({ showToast: jest.fn() }) }));
jest.mock("@/lib/hooks/useJourneyEnvironment", () => ({ useJourneyEnvironment: () => ({ isInsideJourney: true }) }));
jest.mock("@/app/context/CandidateContext", () => ({ useCandidate: () => ({ candidates: [], isMultiCandidate: false }) }));
jest.mock("@/app/(tools)/(visa)/221g-action-planner/components/NarrativeModal", () => ({ NarrativeModal: () => null }));

import { ToolSurfaceProvider, ToolPageFrame } from "@/components/tools/layout";
import { Planner221gLayout } from "@/app/(tools)/(visa)/221g-action-planner/components/Planner221gLayout";
import { SponsorshipCalculatorLayout } from "@/components/tools/SponsorshipCalculatorLayout";
import MyInterviewSessions from "@/app/(tools)/interview-prep/my-sessions/page";

const inJourney = (el: React.ReactElement) =>
  renderToStaticMarkup(React.createElement(ToolSurfaceProvider, { placement: "journey" }, el));
const onPage = (el: React.ReactElement) => renderToStaticMarkup(el);

test("221g shell: same layout, journey copy, no bookmark", () => {
  const j = inJourney(React.createElement(Planner221gLayout, null, "X"));
  const p = onPage(React.createElement(Planner221gLayout, null, "X"));
  expect(j).toContain("--tool-accent:#9A4130");
  expect(p).toContain("--tool-accent:#9A4130");
  expect(j).not.toContain("Add to favorite");
  expect(p).toContain("Add to favorite");
  expect(j).toContain("Mark the reasons on your 221(g) slip");
  expect(j).not.toContain("min-h-screen");
});
test("sponsorship shell renders in a journey", () => {
  const j = inJourney(React.createElement(SponsorshipCalculatorLayout, null, "X"));
  expect(j).toContain("Sponsorship Calculator");
  expect(j).toContain("--tool-accent:#3E7C4F");
});
test("my sessions in a journey uses the layout with a back button", () => {
  const j = inJourney(React.createElement(MyInterviewSessions, { isEmbedded: true, categorySlug: "ir-1-spouse", onBackToPrep: () => {} }));
  expect(j).toContain("IR-1/CR-1 Spouse Sessions");
  expect(j).toContain("--tool-accent:#6A4C93");
  expect(j).toContain("Interview Prep</span>");
  expect(j).not.toContain("mt-[55px]");
});
test("page frame offsets only on its own page", () => {
  expect(onPage(React.createElement(ToolPageFrame, null, "x"))).toContain("mt-[55px]");
  expect(inJourney(React.createElement(ToolPageFrame, null, "x"))).not.toContain("mt-[55px]");
});
