"use client";

import React from "react";
import { ToolLayout } from "@/components/tools/layout";
import type { ToolFaq, ToolRule, ToolSource } from "@/components/tools/layout/types";

/**
 * The Sponsorship Calculator's page shell (hero band, bench card, rules / FAQ / sources drawer).
 * Shared by the standalone /affidavit-support-calculator page and the journey toolbox launch, so
 * both entry points show the same UI. The calculator itself goes in as children, rendered inline
 * (SponsorshipCalculatorTool `standalonePage` or `embedded`).
 */
const RULES: ToolRule[] = [
  {
    label: "125% HHS Poverty Guidelines Threshold",
    value:
      "For most Form I-864 filings, the petitioner's household income must equal or exceed 125% of the HHS Poverty Guidelines for their household size. Active-duty U.S. Armed Forces sponsors petitioning for their spouse or minor child must meet 100% of the poverty guidelines.",
  },
  {
    label: "Child Citizenship Act of 2000 (INA § 320) Exemption",
    value:
      "Certain biological and adopted children of U.S. citizens automatically acquire U.S. citizenship upon entry to the U.S. as lawful permanent residents. These qualifying children file Form I-864W and are entirely exempt from financial sponsorship requirements and NVC Affidavit of Support fees.",
  },
  {
    label: "Household Size Calculation Rules",
    value:
      "Your household size strictly includes: yourself (the sponsor), your spouse (even if separated, unless legally divorced), unmarried children under 21, dependents claimed on your latest federal tax return, any immigrants previously sponsored on an active I-864, and the principal immigrant plus any accompanying derivatives on this petition.",
  },
  {
    label: "Overcoming Shortfalls with Assets or Joint Sponsors",
    value:
      "If your qualifying income is below the required 125% threshold, you may bridge the gap using significant liquid assets (valued at 5× the shortfall, or 3× if petitioning for a spouse or child of a U.S. citizen) or by securing an eligible Joint Sponsor who independently meets 125% for their own household size.",
  },
];

const FAQS: ToolFaq[] = [
  {
    question: "Can I combine my income with other household members?",
    answer:
      "Yes. Relatives living in your principal residence for at least 6 months, or your spouse (regardless of residence), can combine their income by signing Form I-864A (Contract Between Sponsor and Household Member).",
  },
  {
    question: "What if my current income is different from my last tax return?",
    answer: (
      <div className="space-y-2">
        <p>
          Your current income can be different from the income reported on your most recent tax
          return. When assessing Form I-864, the government can consider your current annual income,
          even if it has increased or decreased since your last tax filing.
        </p>
        <p>To support your current income, you can provide:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Recent pay stubs (covering the previous six months).</li>
          <li>
            An employment verification letter stating your job title, employment start date, and
            current salary.
          </li>
          <li>Your most recent federal income tax return or IRS tax transcript.</li>
        </ul>
        <p>
          If you recently started a new job, your income may still qualify if the employment is
          expected to continue and your earnings meet the required income threshold.
        </p>
      </div>
    ),
  },
  {
    question: "Does a Joint Sponsor replace the petitioner?",
    answer:
      "No. The petitioner must always execute a Form I-864 even if unemployed or earning zero income. The Joint Sponsor submits an independent Form I-864 and must qualify on their own household income without combining with the petitioner.",
  },
  {
    question: "When can Form I-864EZ be used instead of Form I-864?",
    answer:
      "Form I-864EZ is a shorter, simpler version permitted only if: (1) you are the sole petitioner, (2) you are sponsoring only one immigrant with no derivatives, and (3) your qualifying income comes entirely from your own salary or pension shown on Form W-2.",
  },
];

const SOURCES: ToolSource[] = [
  {
    title: "USCIS Form I-864 Official Page",
    domain: "uscis.gov",
    url: "https://www.uscis.gov/i-864",
  },
  {
    title: "USCIS Form I-864P Poverty Guidelines",
    domain: "uscis.gov",
    url: "https://www.uscis.gov/i-864p",
  },
  {
    title: "USCIS Form I-864W Exemption Instructions",
    domain: "uscis.gov",
    url: "https://www.uscis.gov/i-864w",
  },
  {
    title: "USCIS Form I-864A Contract Page",
    domain: "uscis.gov",
    url: "https://www.uscis.gov/i-864a",
  },
];

export function SponsorshipCalculatorLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToolLayout
      title="Sponsorship Calculator"
      tagline="Find out if the sponsor earns enough for the Affidavit of Support."
      category="Affidavit of Support / Form I-864"
      priceOrDuration="Multi-step calculation"
      theme="sponsor"
      layout="single"
      quickAccessItem={{
        id: "sponsorship-calculator",
        title: "Sponsorship Calculator",
        href: "/affidavit-support-calculator",
        icon_name: "Calculator",
      }}
      rules={RULES}
      faqs={FAQS}
      sources={SOURCES}
      disclaimer="Poverty guidelines are updated annually by the Department of Health and Human Services (HHS). Calculations are based on USCIS Form I-864P tables."
    >
      {children}
    </ToolLayout>
  );
}
