"use client";

import React from "react";
import {
  ToolLayout,
  useToolPlacement,
  type ToolRule,
  type ToolFaq,
  type ToolSource,
} from "@/components/tools/layout";

/**
 * The 221(g) tool's shell (hero band, bench card, rules / FAQ / sources drawer). Used by the
 * standalone /221g-action-planner page AND the journey toolbox launch (EmbeddedToolContainer
 * `action_221g`), so both entry points show the same UI. Inside a journey the drawer copy
 * describes the journey worksheet instead of the standalone wizard.
 */
export function Planner221gLayout({
  children,
  headerActions,
  hideHelpButton,
}: {
  children: React.ReactNode;
  headerActions?: React.ReactNode;
  hideHelpButton?: boolean;
}) {
  const inJourney = useToolPlacement() === "journey";
  return (
    <ToolLayout
      theme="g221"
      title="221(g) Action Planner"
      tagline={
        inJourney
          ? "Mark the reasons on your 221(g) slip and work through your action plan and checklist."
          : "Build, organize, and export a structured 221(g) response packet step by step."
      }
      quickAccessItem={{
        id: "221g-action-planner",
        title: "221(g) Action Planner",
        href: "/221g-action-planner",
        icon_name: "LifeBuoy",
      }}
      hideHelpButton={hideHelpButton}
      headerActions={headerActions}
      layout="single"
      rules={inJourney ? JOURNEY_RULES : RULES}
      faqs={inJourney ? JOURNEY_FAQS : FAQS}
      sources={SOURCES}
      disclaimer="221(g) notices may differ by embassy/consulate; always follow the instructions on your notice."
    >
      {children}
    </ToolLayout>
  );
}

// ── Drawer content. Every line restates something the planner already tells the user. ──

const RULES: ToolRule[] = [
  { label: "Time to respond", value: "Usually 1 year from the refusal, with no new fee" },
  { label: "Follow", value: "The instructions on your own 221(g) notice" },
  { label: "Steps", value: "Case basics, checklist, review, export" },
  { label: "After you send it", value: "Track the case on CEAC" },
];

const FAQS: ToolFaq[] = [
  {
    question: "How long do I have to respond?",
    answer:
      "Under Section 221(g), you generally have one year from the date of refusal to provide the requested information without paying a new fee.",
  },
  {
    question: "My notice looks different. Does that matter?",
    answer:
      "221(g) notices differ by embassy and consulate. Tick what is on your own notice, and always follow the instructions it gives.",
  },
  {
    question: "Is my progress saved?",
    answer:
      "Yes. Your answers, checklist and generated packet are saved as you go, so you can come back later. Start Fresh clears them.",
  },
  {
    question: "How do I check my case after I respond?",
    answer: "Use the State Department's CEAC visa status check with your case number.",
  },
];

const SOURCES: ToolSource[] = [
  {
    title: "Administrative processing information",
    domain: "travel.state.gov",
    url: "https://travel.state.gov/content/travel/en/us-visas/visa-information-resources/administrative-processing-information.html",
  },
  {
    title: "CEAC visa status check",
    domain: "ceac.state.gov",
    url: "https://ceac.state.gov/CEACStatTracker/Status.aspx",
  },
  {
    title: "Form I-864, Affidavit of Support",
    domain: "uscis.gov",
    url: "https://www.uscis.gov/i-864",
  },
  {
    title: "Get your tax transcript",
    domain: "irs.gov",
    url: "https://www.irs.gov/individuals/get-transcript",
  },
];

// Inside a journey the tool is the refusal worksheet + action plan, saved to the journey.
const JOURNEY_RULES: ToolRule[] = RULES.map((rule) =>
  rule.label === "Steps"
    ? { label: "Steps", value: "Mark the reasons on your slip, then follow the plan" }
    : rule
);

const JOURNEY_FAQS: ToolFaq[] = FAQS.map((faq) =>
  faq.question === "Is my progress saved?"
    ? {
        question: faq.question,
        answer:
          "Yes. Your selections and checklist are saved to this journey. Use Edit 221(g) Selections to change them.",
      }
    : faq
);
