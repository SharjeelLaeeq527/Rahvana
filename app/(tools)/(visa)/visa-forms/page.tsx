"use client";
import { useState, useEffect, useRef } from "react";
import {
  FileText,
  CheckCircle,
  X,
  Search,
  Download,
  Copy,
  Plus,
  ExternalLink,
  Filter,
  PenLine,
  BookOpen,
  Scale,
  Lock,
} from "lucide-react";
import { QuickAccessButton } from "@/app/components/shared/QuickAccessButton";
import { IR5_ENABLED } from "@/lib/feature-flags";
import { CfrExplanationModal } from "@/app/components/shared/CfrExplanationModal";
import { ExpandableTooltip } from "@/app/components/shared/ExpandableTooltip";
import { UpgradeModal } from "@/app/components/entitlements/UpgradeModal";
import { CreditLaunchModal } from "@/app/components/wallet/CreditLaunchModal";
import { useWallet } from "@/app/context/WalletContext";
import {
  getCatalogItem,
  SMART_FORM_CODES,
  SMART_FORM_TOOL_ID,
  smartFormResourceId,
} from "@/lib/wallet/catalog";

interface VisaForm {
  id?: string;
  code: string;
  name: string;
  description: string;
  stage: string;
  officialLink: string;
  icon?: "couples" | "clipboard" | "money" | "globe";
  difficulty?: "Easy" | "Medium" | "Hard";
  estimatedTime?: string;
  agency?: string;
  category?: string[];
  journeys?: string[];
  keywords?: string[];
  type?: string;
  notes?: string;
  expiryDate?: string;
  /** Form must be printed and signed by hand; show the Snap & Sign callout. */
  requiresHandSign?: boolean;
}

const VISA_FORMS: VisaForm[] = [
  // ──────────────── USCIS FAMILY-BASED FORMS ────────────────
  {
    id: "i130",
    code: "I-130",
    name: "Petition for Alien Relative",
    agency: "USCIS",
    journeys: ["IR1-CR1", "IR5", "AOS"],
    stage: "USCIS Filing",
    category: ["Family-based"],
    keywords: ["petition", "spouse", "parent", "child", "sibling", "family"],
    type: "pdf",
    officialLink: "https://www.uscis.gov/sites/default/files/document/forms/i-130.pdf",
    description:
      "Primary petition to establish family relationship for green card eligibility. Required for most family-based immigration.",
    expiryDate: "02-28-2027",
  },
  {
    id: "i130a",
    code: "I-130A",
    name: "Supplemental Information for Spouse Beneficiary",
    agency: "USCIS",
    journeys: ["IR1-CR1", "AOS"],
    stage: "USCIS Filing",
    category: ["Family-based"],
    keywords: ["spouse", "biographical", "supplement"],
    type: "pdf",
    officialLink: "https://www.uscis.gov/sites/default/files/document/forms/i-130a.pdf",
    description:
      "Required supplement when petitioning for a spouse. Includes biographical information about the beneficiary spouse.",
    expiryDate: "02-28-2027",
  },
  // {
  //   id: "i129f",
  //   code: "I-129F",
  //   name: "Petition for Alien Fiancé(e)",
  //   agency: "USCIS",
  //   journeys: ["K1"],
  //   stage: "USCIS Filing",
  //   category: ["Family-based"],
  //   keywords: ["fiancé", "fiancee", "k-1", "k1", "engagement"],
  //   type: "pdf",
  //   officialLink:
  //     "https://www.uscis.gov/sites/default/files/document/forms/i-129f.pdf",
  //   description:
  //     "Petition for fiancé(e) visa (K-1). Allows fiancé to enter US to marry within 90 days. Marriage must occur before AOS filing.",
  // },
  // {
  //   id: "i485",
  //   code: "I-485",
  //   name: "Application to Register Permanent Residence or Adjust Status",
  //   agency: "USCIS",
  //   journeys: ["AOS"],
  //   stage: "USCIS Filing",
  //   category: ["AOS"],
  //   keywords: [
  //     "adjustment",
  //     "status",
  //     "green card",
  //     "aos",
  //     "permanent residence",
  //   ],
  //   type: "pdf",
  //   officialLink:
  //     "https://www.uscis.gov/sites/default/files/document/forms/i-485.pdf",
  //   description:
  //     "Main application for adjustment of status to permanent resident. Filed by beneficiaries already in the US seeking green card.",
  // },
  // {
  //   id: "i765",
  //   code: "I-765",
  //   name: "Application for Employment Authorization",
  //   agency: "USCIS",
  //   journeys: ["AOS", "K1"],
  //   stage: "USCIS Filing",
  //   category: ["AOS", "Employment"],
  //   keywords: ["work permit", "ead", "employment", "authorization", "work"],
  //   type: "pdf",
  //   officialLink:
  //     "https://www.uscis.gov/sites/default/files/document/forms/i-765.pdf",
  //   description:
  //     "Application for work authorization (EAD). Can be filed with I-485 for AOS or after K-1 entry and marriage.",
  // },
  // {
  //   id: "i131",
  //   code: "I-131",
  //   name: "Application for Travel Document",
  //   agency: "USCIS",
  //   journeys: ["AOS"],
  //   stage: "USCIS Filing",
  //   category: ["AOS", "Travel"],
  //   keywords: ["advance parole", "travel", "reentry", "ap"],
  //   type: "pdf",
  //   officialLink:
  //     "https://www.uscis.gov/sites/default/files/document/forms/i-131.pdf",
  //   description:
  //     "Application for advance parole to travel abroad while AOS is pending. Without this, leaving US can abandon AOS application.",
  // },
  {
    id: "i864",
    code: "I-864",
    name: "Affidavit of Support Under Section 213A of the INA",
    agency: "USCIS",
    journeys: ["IR1-CR1", "IR5", "K1", "AOS"],
    stage: "Interview Prep",
    category: ["Financial"],
    keywords: ["affidavit", "support", "sponsor", "income", "financial"],
    type: "pdf",
    officialLink: "https://www.uscis.gov/sites/default/files/document/forms/i-864.pdf",
    description:
      "Legally binding contract where sponsor agrees to financially support immigrant. Must meet 125% of poverty guidelines.",
    expiryDate: "10-31-2027",
  },
  {
    id: "i864a",
    code: "I-864A",
    name: "Contract Between Sponsor and Household Member",
    agency: "USCIS",
    journeys: ["IR1-CR1", "IR5", "K1", "AOS"],
    stage: "Interview Prep",
    category: ["Financial"],
    keywords: ["joint sponsor", "household member", "income", "supplement"],
    type: "pdf",
    officialLink: "https://www.uscis.gov/sites/default/files/document/forms/i-864a.pdf",
    description:
      "Used when household member combines income with primary sponsor to meet income requirements.",
    expiryDate: "10-31-2027",
  },
  {
    id: "i864ez",
    code: "I-864EZ",
    name: "Affidavit of Support Under Section 213A (Simplified)",
    agency: "USCIS",
    journeys: ["IR1-CR1", "IR5", "AOS"],
    stage: "Interview Prep",
    category: ["Financial"],
    keywords: ["affidavit", "support", "simplified", "sponsor", "income"],
    type: "pdf",
    officialLink: "https://www.uscis.gov/sites/default/files/document/forms/i-864ez.pdf",
    description:
      "Simplified affidavit of support. Can be used when sponsor meets income requirements solely with current employment.",
    expiryDate: "10-31-2027",
  },
  // {
  //   id: "i864w",
  //   code: "I-864W",
  //   name: "Intending Immigrant's Affidavit of Support Exemption",
  //   agency: "USCIS",
  //   journeys: ["IR1-CR1", "IR5", "AOS"],
  //   stage: "Interview Prep",
  //   category: ["Financial"],
  //   keywords: ["exemption", "work credits", "40 quarters", "social security"],
  //   type: "pdf",
  //   officialLink:
  //     "https://www.uscis.gov/sites/default/files/document/forms/i-864w.pdf",
  //   description:
  //     "Exemption from affidavit requirement if immigrant has 40 qualifying work quarters under Social Security Act.",
  // },
  // {
  //   id: "i134",
  //   code: "I-134",
  //   name: "Declaration of Financial Support",
  //   agency: "USCIS",
  //   journeys: ["K1"],
  //   stage: "Interview Prep",
  //   category: ["Financial"],
  //   keywords: ["k-1", "fiancé", "support", "financial", "declaration"],
  //   type: "pdf",
  //   officialLink:
  //     "https://www.uscis.gov/sites/default/files/document/forms/i-134.pdf",
  //   description:
  //     "Non-binding declaration of financial support for K-1 fiancé visa applicants. Shows ability to support fiancé.",
  // },
  // {
  //   id: "i693",
  //   code: "I-693",
  //   name: "Report of Medical Examination and Vaccination Record",
  //   agency: "USCIS",
  //   journeys: ["AOS"],
  //   stage: "Interview Prep",
  //   category: ["AOS", "Medical"],
  //   keywords: ["medical", "exam", "vaccination", "health", "civil surgeon"],
  //   type: "pdf",
  //   officialLink:
  //     "https://www.uscis.gov/sites/default/files/document/forms/i-693.pdf",
  //   description:
  //     "Medical examination by USCIS-approved civil surgeon. Required for AOS applicants. Sealed envelope given to applicant.",
  // },
  // {
  //   id: "i751",
  //   code: "I-751",
  //   name: "Petition to Remove Conditions on Residence",
  //   agency: "USCIS",
  //   journeys: ["IR1-CR1", "AOS", "Naturalization"],
  //   stage: "Post-Entry",
  //   category: ["Post-GC"],
  //   keywords: ["conditional", "remove conditions", "2-year", "marriage"],
  //   type: "pdf",
  //   officialLink:
  //     "https://www.uscis.gov/sites/default/files/document/forms/i-751.pdf",
  //   description:
  //     "Required to remove conditions from 2-year conditional green card (marriages under 2 years). File within 90-day window before expiration.",
  // },
  // {
  //   id: "n400",
  //   code: "N-400",
  //   name: "Application for Naturalization",
  //   agency: "USCIS",
  //   journeys: ["Naturalization"],
  //   stage: "Post-Entry",
  //   category: ["Naturalization"],
  //   keywords: ["citizenship", "naturalization", "citizen", "oath"],
  //   type: "pdf",
  //   officialLink:
  //     "https://www.uscis.gov/sites/default/files/document/forms/n-400.pdf",
  //   description:
  //     "Application for U.S. citizenship. Can apply 3 years after green card (if married to USC) or 5 years (general).",
  // },
  // {
  //   id: "i90",
  //   code: "I-90",
  //   name: "Application to Replace Permanent Resident Card",
  //   agency: "USCIS",
  //   journeys: ["Naturalization"],
  //   stage: "Post-Entry",
  //   category: ["Post-GC"],
  //   keywords: ["replace", "renew", "green card", "lost", "stolen", "damaged"],
  //   type: "pdf",
  //   officialLink:
  //     "https://www.uscis.gov/sites/default/files/document/forms/i-90.pdf",
  //   description:
  //     "Replace or renew permanent resident card. File if card is lost, stolen, damaged, expired, or has incorrect information.",
  // },
  // {
  //   id: "ar11",
  //   code: "AR-11",
  //   name: "Alien's Change of Address Card",
  //   agency: "USCIS",
  //   journeys: ["IR1-CR1", "IR5", "K1", "AOS", "Naturalization"],
  //   stage: "Post-Entry",
  //   category: ["Administrative"],
  //   keywords: ["address", "change", "move", "relocation"],
  //   type: "online",
  //   officialLink: "",
  //   description:
  //     "All non-citizens must notify USCIS within 10 days of changing address. Can be filed online at uscis.gov.",
  // },
  // {
  //   id: "i102",
  //   code: "I-102",
  //   name: "Application for Replacement/Initial Nonimmigrant Arrival-Departure Document",
  //   agency: "USCIS",
  //   journeys: ["AOS"],
  //   stage: "Post-Entry",
  //   category: ["Administrative"],
  //   keywords: ["i-94", "arrival", "departure", "lost", "replace"],
  //   type: "pdf",
  //   officialLink:
  //     "https://www.uscis.gov/sites/default/files/document/forms/i-102.pdf",
  //   description:
  //     "Replace lost or never-received I-94 arrival/departure record. Required for various immigration processes.",
  // },
  // {
  //   id: "i407",
  //   code: "I-407",
  //   name: "Record of Abandonment of Lawful Permanent Resident Status",
  //   agency: "USCIS",
  //   journeys: ["Naturalization"],
  //   stage: "Post-Entry",
  //   category: ["Post-GC"],
  //   keywords: ["abandon", "green card", "surrender", "give up"],
  //   type: "pdf",
  //   officialLink:
  //     "https://www.uscis.gov/sites/default/files/document/forms/i-407.pdf",
  //   description:
  //     "Voluntary abandonment of permanent resident status. Used when permanently moving outside US.",
  // },

  // ──────────────── USCIS WAIVER FORMS ────────────────
  // {
  //   id: "i601",
  //   code: "I-601",
  //   name: "Application for Waiver of Grounds of Inadmissibility",
  //   agency: "USCIS",
  //   journeys: ["IR1-CR1", "IR5", "K1", "AOS"],
  //   stage: "Interview Prep",
  //   category: ["Waiver"],
  //   keywords: [
  //     "waiver",
  //     "inadmissibility",
  //     "unlawful presence",
  //     "extreme hardship",
  //   ],
  //   type: "pdf",
  //   officialLink:
  //     "https://www.uscis.gov/sites/default/files/document/forms/i-601.pdf",
  //   description:
  //     "Waiver for inadmissibility due to unlawful presence, fraud, criminal history, etc. Requires proof of extreme hardship to USC/LPR relative.",
  // },
  // {
  //   id: "i601a",
  //   code: "I-601A",
  //   name: "Provisional Unlawful Presence Waiver",
  //   agency: "USCIS",
  //   journeys: ["IR1-CR1", "IR5"],
  //   stage: "Interview Prep",
  //   category: ["Waiver"],
  //   keywords: ["provisional", "waiver", "unlawful presence", "3/10 year bar"],
  //   type: "pdf",
  //   officialLink:
  //     "https://www.uscis.gov/sites/default/files/document/forms/i-601a.pdf",
  //   description:
  //     "Provisional waiver for unlawful presence before consular interview. Allows applicant to wait for approval in US.",
  // },
  // {
  //   id: "i212",
  //   code: "I-212",
  //   name: "Application for Permission to Reapply for Admission",
  //   agency: "USCIS",
  //   journeys: ["IR1-CR1", "IR5", "AOS"],
  //   stage: "Interview Prep",
  //   category: ["Waiver"],
  //   keywords: ["reentry", "deportation", "removal", "previous removal"],
  //   type: "pdf",
  //   officialLink:
  //     "https://www.uscis.gov/sites/default/files/document/forms/i-212.pdf",
  //   description:
  //     "Permission to reapply after deportation or removal. Required if previously removed or deported from US.",
  // },

  // ──────────────── DOS / NVC / CEAC FORMS ────────────────
  {
    id: "ds260",
    code: "DS-260",
    name: "Immigrant Visa and Alien Registration Application",
    agency: "DOS",
    journeys: ["IR1-CR1", "IR5"],
    stage: "NVC/CEAC",
    category: ["Consular"],
    keywords: ["immigrant visa", "application", "consular", "online"],
    type: "online",
    officialLink: "https://ceac.state.gov/iv/",
    description:
      "Main immigrant visa application completed online at CEAC. Required for all consular processing cases. Cannot be downloaded as PDF.",
  },
  // {
  //   id: "ds261",
  //   code: "DS-261",
  //   name: "Choice of Address and Agent",
  //   agency: "DOS",
  //   journeys: ["IR1-CR1", "IR5"],
  //   stage: "NVC/CEAC",
  //   category: ["Consular"],
  //   keywords: ["nvc", "address", "agent", "choice"],
  //   type: "online",
  //   officialLink: "https://ceac.state.gov/iv/",
  //   description:
  //     "Form to provide address and agent information to NVC. Completed online through CEAC portal.",
  // },
  // {
  //   id: "ds160",
  //   code: "DS-160",
  //   name: "Nonimmigrant Visa Application",
  //   agency: "DOS",
  //   journeys: ["K1"],
  //   stage: "NVC/CEAC",
  //   category: ["Consular"],
  //   keywords: ["k-1", "nonimmigrant", "visa application", "fiancé"],
  //   type: "online",
  //   officialLink: "https://ceac.state.gov/genniv/",
  //   description:
  //     "Nonimmigrant visa application for K-1 fiancé visa applicants. Completed online at CEAC.",
  // },
  // {
  //   id: "ds5535",
  //   code: "DS-5535",
  //   name: "Supplemental Questions for Visa Applicants",
  //   agency: "DOS",
  //   journeys: ["IR1-CR1", "IR5", "K1"],
  //   stage: "Interview Prep",
  //   category: ["Consular"],
  //   keywords: [
  //     "supplemental",
  //     "additional questions",
  //     "security check",
  //     "administrative processing",
  //   ],
  //   type: "pdf",
  //   officialLink: "https://eforms.state.gov/Forms/ds5535.pdf",
  //   description:
  //     "Additional questionnaire sometimes requested during administrative processing. Covers detailed travel, employment, and social media history.",
  // },
  // {
  //   id: "ds5540",
  //   code: "DS-5540",
  //   name: "Affidavit of Support Sponsor's Financial Information",
  //   agency: "DOS",
  //   journeys: ["IR1-CR1", "IR5", "K1"],
  //   stage: "Interview Prep",
  //   category: ["Financial", "Consular"],
  //   keywords: ["financial", "sponsor", "income verification"],
  //   type: "pdf",
  //   officialLink: "https://eforms.state.gov/Forms/ds5540.pdf",
  //   description:
  //     "Supplemental financial information form sometimes requested at consular interviews to verify sponsor income.",
  // },
  // {
  //   id: "ds230",
  //   code: "DS-230",
  //   name: "Application for Immigrant Visa and Alien Registration",
  //   agency: "DOS",
  //   journeys: ["IR1-CR1", "IR5"],
  //   stage: "Interview Prep",
  //   category: ["Consular"],
  //   keywords: ["immigrant visa", "paper application", "legacy"],
  //   type: "pdf",
  //   officialLink: "https://eforms.state.gov/Forms/ds230.pdf",
  //   description:
  //     "Legacy paper form (replaced by DS-260). Rarely used now but may be needed in special circumstances.",
  // },
  // {
  //   id: "ds2001",
  //   code: "DS-2001",
  //   name: "Notification of Immigrant Visa Applicant",
  //   agency: "DOS",
  //   journeys: ["IR1-CR1", "IR5"],
  //   stage: "Interview Prep",
  //   category: ["Consular"],
  //   keywords: ["notification", "instructions", "interview"],
  //   type: "pdf",
  //   officialLink:
  //     "https://travel.state.gov/content/dam/visas/DS-2001%20--%20Notification%20of%20Applicant%20Ready%20(10-2019).pdf",
  //   description:
  //     "Instructions sent by consular section when case is ready for interview scheduling.",
  // },

  // ──────────────── CBP FORMS ────────────────
  // {
  //   id: "i94",
  //   code: "I-94",
  //   name: "Arrival/Departure Record",
  //   agency: "CBP",
  //   journeys: ["IR1-CR1", "IR5", "K1", "AOS"],
  //   stage: "Port of Entry",
  //   category: ["Travel", "Administrative"],
  //   keywords: ["arrival", "departure", "entry", "border", "admission"],
  //   type: "online",
  //   officialLink: "https://i94.cbp.dhs.gov/",
  //   description:
  //     "Electronic arrival/departure record. Created automatically at port of entry. Can retrieve online at i94.cbp.dhs.gov.",
  // },
  // {
  //   id: "cbp6059b",
  //   code: "CBP Form 6059B",
  //   name: "Customs Declaration",
  //   agency: "CBP",
  //   journeys: ["IR1-CR1", "IR5", "K1"],
  //   stage: "Port of Entry",
  //   category: ["Travel"],
  //   keywords: ["customs", "declaration", "arrival", "goods"],
  //   type: "pdf",
  //   officialLink:
  //     "https://www.cbp.gov/sites/default/files/assets/documents/2019-Mar/CBP%20Form%206059B%20-%20English%20%2803-2019%29_3.pdf",
  //   description:
  //     "Customs declaration form completed when entering US. Declares goods being brought into country.",
  // },
  // {
  //   id: "i551",
  //   code: "I-551",
  //   name: "Permanent Resident Card (Green Card)",
  //   agency: "CBP",
  //   journeys: ["IR1-CR1", "IR5", "AOS"],
  //   stage: "Post-Entry",
  //   category: ["Post-GC"],
  //   keywords: ["green card", "permanent resident", "card"],
  //   type: "action",
  //   officialLink: "",
  //   description:
  //     "The actual green card issued after immigrant visa or AOS approval. Not a fillable form but important document.",
  // },

  // ──────────────── SSA FORMS ────────────────
  // {
  //   id: "ss5",
  //   code: "SS-5",
  //   name: "Application for a Social Security Card",
  //   agency: "SSA",
  //   journeys: ["IR1-CR1", "IR5", "K1", "AOS"],
  //   stage: "Post-Entry",
  //   category: ["Post-Entry"],
  //   keywords: ["social security", "ssn", "card", "number"],
  //   type: "pdf",
  //   officialLink: "https://www.ssa.gov/forms/ss-5.pdf",
  //   description:
  //     "Application for Social Security Number. Should be applied for soon after entry or when receiving work authorization.",
  // },
  // {
  //   id: "ssa7050",
  //   code: "SSA-7050-F4",
  //   name: "Request for Social Security Earnings Information",
  //   agency: "SSA",
  //   journeys: ["Naturalization"],
  //   stage: "Post-Entry",
  //   category: ["Naturalization", "Financial"],
  //   keywords: ["earnings", "work history", "quarters", "ssa"],
  //   type: "pdf",
  //   officialLink: "https://www.ssa.gov/forms/ssa-7050.pdf",
  //   description:
  //     "Request detailed earnings history from Social Security Administration. May be needed for I-864W or other purposes.",
  // },

  // ──────────────── ADDITIONAL USCIS FORMS ────────────────
  {
    id: "g1450",
    code: "G-1450",
    name: "Authorization for Credit Card Transactions",
    agency: "USCIS",
    journeys: ["IR1-CR1", "IR5", "K1", "AOS", "Naturalization"],
    stage: "USCIS Filing",
    category: ["Financial"],
    keywords: ["credit card", "payment", "fee", "filing fee", "authorization", "debit card", "pay"],
    type: "pdf",
    officialLink: "https://www.uscis.gov/sites/default/files/document/forms/g-1450.pdf",
    description:
      "Authorizes USCIS to charge a credit, debit, or prepaid card for immigration filing fees. Must be placed on top of your application package when filing by mail.",
  },
  {
    id: "g1650",
    code: "G-1650",
    name: "Authorization for ACH Transactions",
    agency: "USCIS",
    journeys: ["IR1-CR1", "IR5", "K1", "AOS", "Naturalization"],
    stage: "USCIS Filing",
    category: ["Financial"],
    keywords: [
      "ach",
      "bank account",
      "payment",
      "direct debit",
      "fee",
      "filing fee",
      "checking",
      "savings",
    ],
    type: "pdf",
    officialLink: "https://www.uscis.gov/sites/default/files/document/forms/g-1650.pdf",
    description:
      "Authorizes USCIS to electronically debit filing fees directly from a U.S. bank account (checking or savings) via ACH for paper-filed benefit requests.",
  },
  {
    id: "g1651",
    code: "G-1651",
    name: "Exemption for Paper Fee Payment",
    agency: "USCIS",
    journeys: ["IR1-CR1", "IR5", "K1", "AOS", "Naturalization"],
    stage: "USCIS Filing",
    category: ["Financial"],
    keywords: [
      "exemption",
      "paper payment",
      "check",
      "money order",
      "fee",
      "payment exemption",
      "hardship",
    ],
    type: "pdf",
    officialLink: "https://www.uscis.gov/sites/default/files/document/forms/g-1651.pdf",
    requiresHandSign: true,
    description:
      "Used to request an exemption from mandatory electronic payment requirements in order to submit filing fees via check or money order with a paper application. Applicants must certify electronic payment is not possible and meet 1 or more criteria: lack of banking access, undue hardship (31 C.F.R. Part 208), national security/law enforcement reasons, or circumstances designated by the Secretary of the Treasury.",
  },
  {
    id: "i912",
    code: "I-912",
    name: "Request for Fee Waiver",
    agency: "USCIS",
    journeys: ["IR1-CR1", "IR5", "K1", "AOS", "Naturalization"],
    stage: "USCIS Filing",
    category: ["Financial"],
    keywords: ["fee waiver", "poverty", "financial hardship", "waive fee"],
    type: "pdf",
    officialLink: "https://www.uscis.gov/sites/default/files/document/forms/i-912.pdf",
    description:
      "Request to waive filing fees based on financial hardship. Must demonstrate income at or below 150% of Federal Poverty Guidelines.",
    expiryDate: "03-31-2027",
  },

  // {
  //   id: "i539",
  //   code: "I-539",
  //   name: "Application to Extend/Change Nonimmigrant Status",
  //   agency: "USCIS",
  //   journeys: ["K1", "AOS"],
  //   stage: "USCIS Filing",
  //   category: ["Status"],
  //   keywords: ["extend", "change status", "visitor", "tourist", "b2"],
  //   type: "pdf",
  //   officialLink:
  //     "https://www.uscis.gov/sites/default/files/document/forms/i-539.pdf",
  //   description:
  //     "Extend or change nonimmigrant status. Used by visitors, students, or other nonimmigrants seeking to extend stay or change category.",
  // },
];

export default function VisaFormSelector() {
  const [activeFilters, setActiveFilters] = useState<{
    agency: string[];
    category: string[];
  }>({
    agency: [],
    category: [],
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [currentView, setCurrentView] = useState<"journey" | "all">("journey");
  const [currentJourney, setCurrentJourney] = useState("IR1-CR1");
  const [currentStage, setCurrentStage] = useState("USCIS Filing");
  // const [isGuideOpen, setIsGuideOpen] = useState(false);
  // const [isFeaturesOpen, setIsFeaturesOpen] = useState(false);
  const [selectedForm, setSelectedForm] = useState<VisaForm | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "info";
  } | null>(null);
  const [isCfrModalOpen, setIsCfrModalOpen] = useState(false);
  const [isFilterPopoverOpen, setIsFilterPopoverOpen] = useState(false);
  const filterPopoverRef = useRef<HTMLDivElement>(null);
  const filterButtonRef = useRef<HTMLButtonElement>(null);

  // Plan gating: Free & Basic can only *start* the I-130 demo in the
  // Smart Form Filler; Premium & Executive start every form in the library.
  // This library is the standalone tool, paid with credits even by plan holders.
  // Each form is unlocked on its own (`form-forge:<code>`): unlocking the I-485
  // opens the I-485 only. An older unlock of the whole tool and the legacy "smart"
  // add-on still open every form (/api/wallet reports each form as unlocked).
  // Without an unlock only the I-130 demo starts. Journey runs use MultiStepForm
  // with the journey plan instead.
  const wallet = useWallet();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [unlockFormCode, setUnlockFormCode] = useState<string | null>(null);
  const DEMO_FORM_CODE = "i130";
  const normalizeCode = (formCode: string) => formCode.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
  // Forms with no Smart Form Filler wizard have no per-form unlock; they keep the
  // old rule (open only with the whole tool).
  const isFormUnlocked = (formCode: string) =>
    wallet.isUnlocked(smartFormResourceId(formCode) ?? SMART_FORM_TOOL_ID, "tool");
  const isFormLocked = (formCode: string) =>
    !isFormUnlocked(formCode) && normalizeCode(formCode) !== DEMO_FORM_CODE;
  const unlockItem = unlockFormCode
    ? getCatalogItem("tool", smartFormResourceId(unlockFormCode))
    : null;

  const renderFormDescription = (text: string) => {
    if (!text || !text.includes("31 C.F.R. Part 208")) {
      return text;
    }
    const parts = text.split("31 C.F.R. Part 208");
    return (
      <>
        {parts[0]}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsCfrModalOpen(true);
          }}
          className="mx-0.5 inline-flex cursor-pointer items-center gap-0.5 font-bold text-blue-600 underline transition-colors hover:text-blue-800"
          title="Click to view explanation of 31 C.F.R. Part 208"
        >
          31 C.F.R. Part 208
        </button>
        {parts[1]}
      </>
    );
  };

  // Close filter popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        filterPopoverRef.current &&
        !filterPopoverRef.current.contains(event.target as Node) &&
        filterButtonRef.current &&
        !filterButtonRef.current.contains(event.target as Node)
      ) {
        setIsFilterPopoverOpen(false);
      }
    };

    if (isFilterPopoverOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isFilterPopoverOpen]);

  const handleStartForm = (formCode: string): void => {
    // Free & Basic: only the I-130 demo is startable — other forms prompt
    // an upgrade. Premium & Executive (and anyone who bought the add-on) pass.
    if (isFormLocked(formCode)) {
      if (smartFormResourceId(formCode)) setUnlockFormCode(normalizeCode(formCode));
      else setShowUpgradeModal(true);
      return;
    }
    window.location.href = `/visa-forms/${normalizeCode(formCode)}/wizard`;
  };

  const toggleFilter = (type: "agency" | "category", value: string) => {
    setActiveFilters((prev) => {
      const current = prev[type];
      const isSelected = current.includes(value);

      if (isSelected) {
        return { ...prev, [type]: current.filter((v) => v !== value) };
      } else {
        return { ...prev, [type]: [...current, value] };
      }
    });
  };

  const clearFilters = () => {
    setActiveFilters({ agency: [], category: [] });
    setSearchQuery("");
    setCurrentJourney("");
  };

  const handleViewChange = (view: "journey" | "all") => {
    setCurrentView(view);
    // Reset filters if switching to 'all' or specific logic if needed
  };

  const filteredForms = VISA_FORMS.filter((form) => {
    // 1. Filter by Journey (Applies whenever a journey is selected)
    if (currentJourney && (!form.journeys || !form.journeys.includes(currentJourney))) {
      return false;
    }

    // 2. Filter by Stage (Only in Journey View)
    if (currentView === "journey" && currentStage && form.stage !== currentStage) {
      return false;
    }

    // 2. Filter by Search Query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        form.code.toLowerCase().includes(query) ||
        form.name.toLowerCase().includes(query) ||
        form.description.toLowerCase().includes(query) ||
        (form.agency && form.agency.toLowerCase().includes(query)) ||
        (form.keywords && form.keywords.some((k) => k.toLowerCase().includes(query)));

      if (!matchesSearch) return false;
    }

    // 3. Filter by Agency
    const matchAgency =
      activeFilters.agency.length === 0 ||
      (form.agency && activeFilters.agency.includes(form.agency));

    // 4. Filter by Category
    const matchCategory =
      activeFilters.category.length === 0 ||
      (form.category && form.category.some((cat) => activeFilters.category.includes(cat)));

    return matchAgency && matchCategory;
  }).sort((a, b) => {
    if (currentView === "all") {
      return a.code.localeCompare(b.code);
    }
    return 0;
  });

  return (
    <div className="from-primary/10 to-primary/5 mt-10 min-h-screen bg-linear-to-br via-white">
      <div className="site-main-px site-main-py">
        {/* Header */}
        <div className="mb-8 text-center md:mb-12">
          <div className="bg-primary/10 mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full md:h-16 md:w-16">
            <FileText className="text-primary/90 h-6 w-6 md:h-8 md:w-8" />
          </div>
          <h1 className="mb-3 text-3xl font-bold text-gray-900 md:text-4xl">
            Immigration Forms Library
          </h1>
          <p className="mx-auto mb-2 max-w-3xl text-lg text-gray-600 md:text-xl">
            Browse all forms organized by your journey stage, or search instantly to find exactly
            what you need.
          </p>
          <div className="mt-4 flex justify-center">
            <QuickAccessButton
              item={{
                id: "form-forge",
                title: "Smart Form Filler",
                href: "/visa-forms",
                icon_name: "Wand2",
              }}
            />
          </div>
          {/* <p className="text-gray-500 max-w-2xl mx-auto">
            Fill out official U.S. visa forms with helpful guidance at every
            step
          </p> */}
        </div>

        {/* Free & Basic preview disclaimer */}
        {!wallet.isLoading && SMART_FORM_CODES.some((code) => isFormLocked(code)) && (
          <div className="mx-auto max-w-3xl">
            <ExpandableTooltip
              icon={"i"}
              defaultOpen={false}
              title="Demo: I-130 only"
              message="Without an unlock you get a limited demo of the Smart Form Filler on the I-130 form only: answer a few questions, review your answers, and preview the first page of the completed PDF. Unlock a form with credits to start it and download its complete, multi-page PDF. Each form is unlocked on its own. Forms inside your journey follow your journey plan."
            />
          </div>
        )}

        {/* Info Banner */}
        {/* <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 mb-10">
          <div className="flex items-start gap-3">
            <Info className="w-6 h-6 text-primary/90 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                How It Works
              </h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-primary/90 shrink-0 mt-0.5" />
                  <span>Choose a form below to get started</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-primary/90 shrink-0 mt-0.5" />
                  <span>Answer 2-3 questions at a time with helpful tips</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-primary/90 shrink-0 mt-0.5" />
                  <span>Your progress is saved automatically</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-primary/90 shrink-0 mt-0.5" />
                  <span>Review and edit before generating your filled PDF</span>
                </li>
              </ul>
            </div>
          </div>
        </div> */}

        {/* Search & View Toggle Section */}

        {/* Content Grid */}
        <div className="mx-auto max-w-7xl">
          {/* Main Content */}
          <main className="min-w-0">
            {/* Search & Tabs (Moved Inside Main Content) */}
            <div className="mb-8 md:mb-10">
              <div className="mb-6 flex flex-row gap-4">
                <div className="relative flex-1">
                  <div className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-gray-400">
                    <Search className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    suppressHydrationWarning
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 py-3 pr-4 pl-10 text-sm shadow-sm transition-all outline-none focus:border-[#0d7377] focus:ring-2 focus:ring-[#0d7377]/10 sm:py-4"
                    placeholder="Search forms..."
                  />
                </div>
                <div className="relative">
                  <button
                    ref={filterButtonRef}
                    onClick={() => setIsFilterPopoverOpen(!isFilterPopoverOpen)}
                    className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 shadow-sm transition-all hover:border-[#0d7377] hover:text-[#0d7377] sm:px-6 sm:py-4"
                  >
                    <Filter className="h-4 w-4" />

                    {/* Hide on mobile, show on sm+ */}
                    <span className="hidden sm:inline">Filters</span>

                    {(activeFilters.agency.length > 0 ||
                      activeFilters.category.length > 0 ||
                      currentJourney) && (
                      <span className="ml-1 rounded-full bg-[#0d7377] px-2 py-0.5 text-[10px] font-bold text-white">
                        {activeFilters.agency.length +
                          activeFilters.category.length +
                          (currentJourney ? 1 : 0)}
                      </span>
                    )}
                  </button>

                  {/* Filter Popover */}
                  {isFilterPopoverOpen && (
                    <div
                      ref={filterPopoverRef}
                      className="absolute top-full right-0 z-50 mt-2 max-h-[500px] w-80 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-xl"
                    >
                      {/* Header */}
                      <div className="sticky top-0 flex items-center justify-between border-b border-gray-100 bg-white p-4">
                        <h3 className="font-semibold text-gray-900">Filter Forms</h3>
                        <button
                          onClick={() => setIsFilterPopoverOpen(false)}
                          className="text-gray-600 transition-colors hover:text-gray-900"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Filter Content */}
                      <div className="space-y-4 p-4">
                        {/* Journey Filter */}
                        <div>
                          <label className="mb-2 block text-xs font-semibold tracking-wide text-gray-900 uppercase">
                            Visa Journey
                          </label>
                          <div className="flex flex-col gap-2">
                            {[
                              { id: "IR1-CR1", label: "IR-1 / CR-1 (Spouse)" },
                              // IR-5 is hidden on production (see lib/feature-flags) until it launches.
                              ...(IR5_ENABLED ? [{ id: "IR5", label: "IR-5 (Parent)" }] : []),
                              // { id: "K1", label: "K-1 (Fiancé)" },
                              // { id: "AOS", label: "Adjustment of Status" },
                              // { id: "Naturalization", label: "Naturalization" },
                            ].map((journey) => (
                              <button
                                key={journey.id}
                                onClick={() => {
                                  if (currentJourney === journey.id) {
                                    setCurrentJourney("");
                                  } else {
                                    setCurrentJourney(journey.id);
                                    setCurrentStage("USCIS Filing");
                                  }
                                }}
                                className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition-all duration-200 ${
                                  currentJourney === journey.id
                                    ? "border-[#0d7377] bg-[#0d7377] text-white"
                                    : "border-gray-200 bg-white text-gray-600 hover:border-[#0d7377] hover:text-[#0d7377]"
                                }`}
                              >
                                {journey.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Agency Filter */}
                        <div className="border-t border-gray-100 pt-4">
                          <label className="mb-2 block text-xs font-semibold tracking-wide text-gray-900 uppercase">
                            Agency
                          </label>
                          <div className="flex flex-col gap-2">
                            {["USCIS"].map((agency) => (
                              <button
                                key={agency}
                                onClick={() => toggleFilter("agency", agency)}
                                className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition-all duration-200 ${
                                  activeFilters.agency.includes(agency)
                                    ? "border-[#0d7377] bg-[#0d7377] text-white"
                                    : "border-gray-200 bg-white text-gray-600 hover:border-[#0d7377] hover:text-[#0d7377]"
                                }`}
                              >
                                {agency}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Category Filter */}
                        <div className="border-t border-gray-100 pt-4">
                          <label className="mb-2 block text-xs font-semibold tracking-wide text-gray-900 uppercase">
                            Category
                          </label>
                          <div className="flex flex-col gap-2">
                            {["Family-based", "Financial"].map((category) => (
                              <button
                                key={category}
                                onClick={() => toggleFilter("category", category)}
                                className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition-all duration-200 ${
                                  activeFilters.category.includes(category)
                                    ? "border-[#0d7377] bg-[#0d7377] text-white"
                                    : "border-gray-200 bg-white text-gray-600 hover:border-[#0d7377] hover:text-[#0d7377]"
                                }`}
                              >
                                {category}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="sticky bottom-0 space-y-3 border-t border-gray-100 bg-gray-50 px-4 py-3">
                        <div className="flex gap-2">
                          {(activeFilters.agency.length > 0 ||
                            activeFilters.category.length > 0 ||
                            currentJourney) && (
                            <button
                              onClick={() => {
                                clearFilters();
                                setCurrentJourney("");
                              }}
                              className="flex-1 rounded-lg bg-[#0d7377] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[#0a5a5d]"
                            >
                              Reset
                            </button>
                          )}
                          <button
                            onClick={() => setIsFilterPopoverOpen(false)}
                            className="flex-1 rounded-lg bg-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-300"
                          >
                            Done
                          </button>
                        </div>
                        <div className="text-center text-xs text-gray-600">
                          Showing{" "}
                          <span className="font-semibold text-gray-900">
                            {filteredForms.length}
                          </span>{" "}
                          of{" "}
                          <span className="font-semibold text-gray-900">{VISA_FORMS.length}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-3 sm:gap-4">
                <button
                  onClick={() => handleViewChange("journey")}
                  suppressHydrationWarning
                  className={`flex-1 rounded-lg border-2 px-4 py-2.5 text-sm font-semibold transition-all sm:px-6 sm:py-3 ${
                    currentView === "journey"
                      ? "border-[#0d7377] bg-[#0d7377] text-white"
                      : "border-gray-200 bg-white text-gray-500 hover:border-[#0d7377] hover:text-[#0d7377]"
                  }`}
                >
                  Journey View
                </button>
                <button
                  onClick={() => handleViewChange("all")}
                  suppressHydrationWarning
                  className={`flex-1 rounded-lg border-2 px-4 py-2.5 text-sm font-semibold transition-all sm:px-6 sm:py-3 ${
                    currentView === "all"
                      ? "border-[#0d7377] bg-[#0d7377] text-white"
                      : "border-gray-200 bg-white text-gray-500 hover:border-[#0d7377] hover:text-[#0d7377]"
                  }`}
                >
                  All Forms
                </button>
              </div>
            </div>

            {/* Journey Selector (Only in Journey View) */}
            {currentView === "journey" && (
              <div className="mb-8 md:mb-10">
                {/* Metro Map */}
                <div className="custom-scrollbar relative mb-6 overflow-x-auto pb-4 md:mb-8">
                  <div className="min-w-[600px] px-4 md:min-w-175">
                    <div className="relative flex justify-between pt-4">
                      {/* Connection Line */}
                      <div className="absolute top-[26px] right-0 left-0 h-1 w-full rounded-full bg-gray-200" />

                      {[
                        {
                          id: "USCIS Filing",
                          label: "USCIS Filing",
                          desc: "Initial petition",
                        },
                        {
                          id: "NVC/CEAC",
                          label: "NVC / CEAC",
                          desc: "Case processing",
                        },
                        {
                          id: "Interview Prep",
                          label: "Interview Prep",
                          desc: "Documents & medical",
                        },
                        // {
                        //   id: "Port of Entry",
                        //   label: "Port of Entry",
                        //   desc: "Arrival procedures",
                        // },
                        // {
                        //   id: "Post-Entry",
                        //   label: "Post-Entry",
                        //   desc: "SSN, work auth",
                        // },
                      ].map((stage, index) => {
                        // Only show stages relevant if we had stage mapping, for now showing all visual
                        const count = VISA_FORMS.filter(
                          (f) =>
                            f.stage === stage.id &&
                            (!currentJourney || (f.journeys && f.journeys.includes(currentJourney)))
                        ).length;

                        const isActive = currentStage === stage.id;

                        return (
                          <button
                            key={index}
                            suppressHydrationWarning
                            onClick={() =>
                              setCurrentStage(currentStage === stage.id ? "" : stage.id)
                            }
                            className="group relative flex flex-1 flex-col items-center"
                          >
                            <div
                              className={`z-10 mb-3 h-6 w-6 rounded-full border-4 transition-all duration-300 ${
                                isActive
                                  ? "scale-125 border-[#0d7377] bg-[#0d7377]"
                                  : "border-gray-200 bg-white group-hover:border-[#0d7377]"
                              }`}
                            />

                            <div className="flex flex-col items-center text-center">
                              <div
                                className={`mb-0.5 text-sm font-bold ${
                                  isActive
                                    ? "text-gray-900"
                                    : "text-gray-500 group-hover:text-gray-700"
                                }`}
                              >
                                {stage.label}
                              </div>
                              <div className="mb-2 text-xs text-gray-400">{stage.desc}</div>
                              <div className="rounded-md bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">
                                {count} forms
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Forms Grid */}
            <div className="mb-12 grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
              {filteredForms.length > 0 ? (
                filteredForms.map((form) => {
                  return (
                    <div
                      key={form.code}
                      className="group relative flex h-auto min-h-[370px] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-teal-900/5 lg:h-[340px] lg:min-h-0"
                    >
                      {/* Top Accent Line */}
                      <div className="absolute top-0 right-10 left-0 h-1 origin-left scale-x-0 transform bg-linear-to-r from-[#0d7377] to-teal-400 transition-transform duration-500 group-hover:scale-x-100" />

                      {/* Folded Corner Effect */}
                      <div className="absolute top-0 right-0 h-10 w-10 overflow-hidden">
                        <div className="absolute top-0 right-0 z-10 h-0 w-0 border-t-40 border-l-40 border-t-gray-50 border-l-transparent drop-shadow-sm transition-colors duration-300 group-hover:border-t-gray-50" />
                        <div className="absolute top-0 right-0 h-0 w-0 border-t-40 border-l-40 border-t-gray-50 border-l-gray-50 shadow-md" />
                      </div>

                      <div className="relative flex flex-1 flex-col p-7">
                        {/* Header */}
                        <div className="mr-8 mb-5 flex items-start justify-between">
                          <div>
                            <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 transition-colors group-hover:text-[#0d7377]">
                              {form.code}
                            </h2>
                            <span className="mt-1 inline-block rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-bold tracking-wider text-gray-600 uppercase">
                              {form.agency}
                            </span>
                          </div>

                          {/* Status Badge */}
                          <div
                            className={`rounded-full px-3 py-1 text-xs font-bold tracking-wide uppercase ${
                              form.type === "online"
                                ? "bg-blue-50 text-blue-700"
                                : "bg-teal-50 text-teal-700"
                            }`}
                          >
                            {form.type === "online" ? "Online" : "PDF"}
                          </div>
                        </div>

                        {/* Content */}
                        <div className="min-h-0 flex-1">
                          <h3
                            className="mb-3 line-clamp-2 text-lg leading-snug font-bold text-gray-800 transition-colors group-hover:text-[#0d7377] lg:line-clamp-1 lg:truncate"
                            title={form.name}
                          >
                            {form.name}
                          </h3>
                          <p
                            className="text-sm leading-relaxed text-gray-500 lg:line-clamp-2"
                            title={form.description}
                          >
                            {form.description}
                          </p>
                          {form.expiryDate && (
                            <div className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-amber-200/50 bg-amber-50/70 px-2.5 py-1 text-xs font-medium text-amber-600">
                              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500"></span>
                              Valid till {form.expiryDate}
                            </div>
                          )}
                        </div>

                        {/* Footer (Static) */}
                        <div className="mt-4 hidden items-center justify-between border-t border-gray-50 pt-4 text-xs font-medium text-gray-400 transition-opacity delay-100 duration-200 group-hover:opacity-0 lg:flex">
                          <span className="flex items-center gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-gray-300"></span>
                            {form.stage}
                          </span>
                          {form.category && form.category[0] && <span>{form.category[0]}</span>}
                        </div>

                        {/* Hover Overlay Actions */}
                        <div className="relative z-10 mx-[-1.75rem] mt-auto mb-[-1.75rem] flex translate-y-0 flex-col gap-3 border-t border-gray-100 bg-white/95 p-4 transition-transform duration-300 ease-out lg:absolute lg:inset-x-0 lg:bottom-0 lg:mx-0 lg:mb-0 lg:translate-y-full lg:p-6 lg:backdrop-blur-[2px] lg:group-hover:translate-y-0">
                          <div className="flex gap-3">
                            <button
                              onClick={() => setSelectedForm(form)}
                              suppressHydrationWarning
                              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#0d7377] px-4 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-[#0a5a5d] hover:shadow-lg active:scale-95"
                            >
                              View Sample
                            </button>
                            <button
                              onClick={() => handleStartForm(form.code)}
                              suppressHydrationWarning
                              className={`flex flex-1 items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-bold shadow-sm transition-all active:scale-95 ${
                                isFormLocked(form.code)
                                  ? "border-amber-200 bg-white text-amber-700 hover:border-amber-400 hover:text-amber-800"
                                  : "border-gray-100 bg-white text-gray-700 hover:border-[#0d7377] hover:text-[#0d7377] hover:shadow-md"
                              }`}
                            >
                              {isFormLocked(form.code) ? (
                                <>
                                  <Lock className="h-4 w-4 shrink-0" />
                                  {smartFormResourceId(form.code) ? "Unlock" : "Upgrade"}
                                </>
                              ) : isFormUnlocked(form.code) ? (
                                "Start"
                              ) : (
                                /* Free/Basic can only start the I-130 — label it as the limited demo */
                                "Start Demo"
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full py-16 text-center">
                  <div className="mb-4 flex justify-center">
                    <FileText className="h-12 w-12 text-gray-300" />
                  </div>
                  <h3 className="mb-1 text-lg font-semibold text-gray-900">No forms found</h3>
                  <p className="text-gray-500">Try adjusting your filters to see more results</p>
                  <button
                    onClick={clearFilters}
                    className="mt-4 font-medium text-[#007f8a] hover:underline"
                  >
                    Clear all filters
                  </button>
                </div>
              )}
            </div>

            {/* Help Section */}
            <div className="grid gap-6 md:grid-cols-1">
              {/* Process Guide */}
              {/* Process Guide */}
              {/* <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <button
                  onClick={() => setIsGuideOpen(!isGuideOpen)}
                  className="w-full flex items-center justify-between p-6 text-left"
                >
                  <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                    Need Help Choosing?
                  </h3>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-400 transition-transform ${
                      isGuideOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {isGuideOpen && (
                  <div className="px-6 pb-6 space-y-3 animate-in slide-in-from-top-2 duration-200">
                    <p className="font-semibold text-gray-900">
                      For Spouse Immigration:
                    </p>
                    <ol className="space-y-2 text-gray-700">
                      <li className="flex items-start gap-2">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary/90 text-sm font-semibold shrink-0">
                          1
                        </span>
                        <span>
                          Start with <strong>I-130</strong> (Petition for
                          spouse)
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary/90 text-sm font-semibold shrink-0">
                          2
                        </span>
                        <span>
                          Complete <strong>I-130A</strong> (Spouse information)
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary/90 text-sm font-semibold shrink-0">
                          3
                        </span>
                        <span>
                          Then file <strong>I-864</strong> (Financial support
                          proof)
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary/90 text-sm font-semibold shrink-0">
                          4
                        </span>
                        <span>
                          Finally, <strong>DS-260</strong> (Main visa
                          application)
                        </span>
                      </li>
                    </ol>
                  </div>
                )}
              </div> */}

              {/* Features */}
              {/* <div className="bg-linear-to-br from-primary/5 to-primary/10 rounded-xl shadow-sm border border-primary/20 overflow-hidden">
                <button
                  onClick={() => setIsFeaturesOpen(!isFeaturesOpen)}
                  className="w-full flex items-center justify-between p-6 text-left"
                >
                  <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    Features
                  </h3>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-500 transition-transform ${
                      isFeaturesOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {isFeaturesOpen && (
                  <div className="px-6 pb-6 animate-in slide-in-from-top-2 duration-200">
                    <ul className="space-y-3">
                      <li className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-primary/90 shrink-0 mt-0.5" />
                        <span className="text-gray-700">
                          Automatic progress saving
                        </span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-primary/90 shrink-0 mt-0.5" />
                        <span className="text-gray-700">
                          Helpful tips for every question
                        </span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-primary/90 shrink-0 mt-0.5" />
                        <span className="text-gray-700">
                          Examples for guidance
                        </span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-primary/90 shrink-0 mt-0.5" />
                        <span className="text-gray-700">
                          Edit anytime before final PDF
                        </span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-primary/90 shrink-0 mt-0.5" />
                        <span className="text-gray-700">
                          Download filled official form
                        </span>
                      </li>
                    </ul>
                  </div>
                )}
              </div> */}
            </div>
          </main>
          {/* Form Detail Modal / Drawer */}
          {selectedForm && (
            <div className="fixed inset-0 z-100 flex items-center justify-center p-4 sm:p-8">
              {/* Backdrop */}
              <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                onClick={() => setSelectedForm(null)}
              />

              {/* Modal */}
              <div className="animate-in fade-in zoom-in-95 relative flex max-h-[95vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl duration-200 sm:max-h-[90vh]">
                {/* Header */}
                <div className="sticky top-0 z-10 flex shrink-0 items-center justify-between border-b border-gray-200 bg-white/95 px-5 py-4 backdrop-blur-md sm:px-8 sm:py-6">
                  <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">Form Details</h2>
                  <button
                    onClick={() => setSelectedForm(null)}
                    className="rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
                  >
                    <X className="h-5 w-5 sm:h-6 sm:w-6" />
                  </button>
                </div>

                {/* Content */}
                <div className="w-full flex-1 overflow-y-auto">
                  <div className="mx-auto w-full max-w-5xl space-y-6 p-5 sm:space-y-8 sm:p-8">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8">
                      <div>
                        <div className="mb-1 text-xs font-bold tracking-wider text-gray-500 uppercase sm:mb-2 sm:text-sm">
                          Form Code
                        </div>
                        <div className="font-mono text-2xl font-bold text-[#0d7377] sm:text-3xl">
                          {selectedForm.code}
                        </div>
                      </div>
                      <div>
                        <div className="mb-1 text-xs font-bold tracking-wider text-gray-500 uppercase sm:mb-2 sm:text-sm">
                          Agency
                        </div>
                        <div className="text-lg font-medium text-gray-900 sm:text-xl">
                          {selectedForm.agency}
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="mb-1 text-xs font-bold tracking-wider text-gray-500 uppercase sm:mb-2 sm:text-sm">
                        Full Title
                      </div>
                      <div className="text-lg leading-relaxed text-gray-900 sm:text-xl">
                        {selectedForm.name}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8">
                      <div>
                        <div className="mb-1 text-xs font-bold tracking-wider text-gray-500 uppercase sm:mb-2 sm:text-sm">
                          Journey Stage
                        </div>
                        <div className="text-base text-gray-900 sm:text-lg">
                          {selectedForm.stage}
                        </div>
                      </div>
                      {selectedForm.expiryDate && (
                        <div>
                          <div className="mb-1 text-xs font-bold tracking-wider text-gray-500 uppercase sm:mb-2 sm:text-sm">
                            Validation Status
                          </div>
                          <div className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200/50 bg-amber-50/70 px-3 py-1.5 text-sm font-semibold text-amber-600">
                            <span className="h-2 w-2 animate-pulse rounded-full bg-amber-500"></span>
                            Valid till {selectedForm.expiryDate}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Categories & Keywords */}
                    <div>
                      <div className="mb-2 text-xs font-bold tracking-wider text-gray-500 uppercase sm:mb-3 sm:text-sm">
                        Categories
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {selectedForm.category?.map((cat) => (
                          <span
                            key={cat}
                            className="rounded-md bg-[#e8f6f6] px-3 py-1 text-sm font-medium text-[#0a5a5d]"
                          >
                            {cat}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="mb-2 text-xs font-bold tracking-wider text-gray-500 uppercase sm:mb-3 sm:text-sm">
                        Keywords
                      </div>
                      <div className="flex flex-wrap gap-1.5 sm:gap-2">
                        {selectedForm.keywords?.map((kw) => (
                          <span
                            key={kw}
                            className="rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-600 sm:px-3 sm:text-sm"
                          >
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="mb-1 text-xs font-bold tracking-wider text-gray-500 uppercase sm:mb-2 sm:text-sm">
                        Description & Notes
                      </div>
                      <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm leading-relaxed text-gray-700 sm:p-6 sm:text-base">
                        {renderFormDescription(selectedForm.description)}
                        {selectedForm.notes && (
                          <p className="mt-4 border-t border-gray-200 pt-4 text-gray-600 italic">
                            {selectedForm.notes}
                          </p>
                        )}
                      </div>

                      {/* 31 C.F.R. Part 208 Special Callout for Form G-1651 */}
                      {selectedForm.code === "G-1651" && (
                        <div className="mt-3 flex flex-col justify-between gap-3 rounded-xl border border-blue-200/70 bg-blue-50/70 p-3.5 sm:flex-row sm:items-center sm:p-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                              <Scale className="h-4 w-4" />
                            </div>
                            <div>
                              <div className="text-xs font-bold text-blue-950">
                                31 C.F.R. Part 208 Undue Hardship Regulation
                              </div>
                              <div className="text-[11.5px] leading-normal text-blue-800">
                                Learn what qualifies as an infrastructure or personal barrier under
                                Treasury rules
                              </div>
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setIsCfrModalOpen(true)}
                              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-blue-700"
                            >
                              <BookOpen className="h-3.5 w-3.5" />
                              <span>View Explanation</span>
                            </button>
                            <a
                              href="https://www.govinfo.gov/content/pkg/CFR-2025-title31-vol2/pdf/CFR-2025-title31-vol2-sec208-1.pdf"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 transition-all hover:bg-blue-50"
                            >
                              <span>GovInfo Citation</span>
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Hand-sign callout -> Snap & Sign tool */}
                    {selectedForm.requiresHandSign && (
                      <div className="flex items-start gap-4 rounded-xl border border-[#0d7377]/20 bg-[#e8f6f6] p-4 sm:p-6">
                        <PenLine className="mt-1 h-6 w-6 shrink-0 text-[#0d7377]" />
                        <div>
                          <h4 className="mb-1 text-base font-bold text-[#0a5a5d] sm:text-lg">
                            This form needs a handwritten signature
                          </h4>
                          <p className="text-sm leading-relaxed text-gray-700 sm:text-base">
                            Print the form, sign it by hand, then capture your signature with our
                            Snap and Sign tool to add a clean digital copy to your document.
                          </p>
                          <a
                            href="/signature-image-processing"
                            className="mt-3 inline-flex items-center gap-2 rounded-lg bg-[#0d7377] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#0a5a5d]"
                          >
                            <PenLine className="h-4 w-4 shrink-0" />
                            Open Snap and Sign
                          </a>
                        </div>
                      </div>
                    )}

                    {/* Sample form (blank official PDF) or Online callout */}
                    {selectedForm.type === "online" ? (
                      <div className="flex items-start gap-4 rounded-xl border border-blue-100 bg-blue-50 p-6">
                        <ExternalLink className="mt-1 h-6 w-6 shrink-0 text-blue-600" />
                        <div>
                          <h4 className="mb-2 text-lg font-bold text-blue-900">Online Form</h4>
                          <p className="text-blue-800">
                            This form must be completed online and cannot be downloaded as a PDF.
                            Visit the official government website to access and submit this form.
                          </p>
                        </div>
                      </div>
                    ) : selectedForm.officialLink ? (
                      <div>
                        <div className="mb-3 text-sm font-bold tracking-wider text-gray-500 uppercase">
                          Sample Form (Preview)
                        </div>
                        <div className="h-[800px] overflow-hidden rounded-xl border border-gray-200 bg-gray-50 shadow-sm">
                          <iframe
                            src={selectedForm.officialLink}
                            className="h-full w-full"
                            title={`Sample of ${selectedForm.code} (blank official form)`}
                          />
                        </div>
                      </div>
                    ) : null}
                  </div>
                  {/* Actions Footer */}
                  <div className="shrink-0 border-t border-gray-200 bg-gray-50 p-4 sm:p-8">
                    <div className="mx-auto flex max-w-5xl flex-col flex-wrap gap-3 sm:flex-row">
                      <button className="flex w-full flex-1 items-center justify-center gap-2 rounded-xl bg-[#0d7377] py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-[#0a5a5d] hover:shadow-md sm:py-4 lg:text-base">
                        <Plus className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" />
                        <span className="truncate">Add to AutoFill Queue</span>
                      </button>

                      {selectedForm.officialLink && selectedForm.type !== "online" && (
                        <button
                          onClick={() => window.open(selectedForm.officialLink, "_blank")}
                          className="flex w-full flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-3 text-sm font-bold text-gray-700 shadow-sm transition-all hover:border-teal-600 hover:bg-gray-50 hover:text-teal-700 sm:py-4 lg:text-base"
                        >
                          <Download className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" />
                          <span className="truncate">Download PDF</span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(selectedForm.code);
                          setToast({
                            message: `${selectedForm.code} copied to clipboard`,
                            type: "success",
                          });
                          setTimeout(() => setToast(null), 3000);
                        }}
                        className="flex w-full flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-3 text-sm font-bold text-gray-700 shadow-sm transition-all hover:border-teal-600 hover:bg-gray-50 hover:text-teal-700 sm:py-4 lg:text-base"
                      >
                        <Copy className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" />
                        <span className="truncate">Copy Form Code</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Toast Notification */}
        {toast && (
          <div className="animate-in slide-in-from-bottom-5 fade-in fixed right-8 bottom-8 z-200 duration-300">
            <div
              className={`flex transform items-center gap-2 rounded-xl px-6 py-4 font-semibold text-white shadow-2xl transition-all ${
                toast.type === "success" ? "bg-[#0d7377]" : "bg-blue-600"
              }`}
            >
              <CheckCircle className="h-5 w-5" />
              {toast.message}
            </div>
          </div>
        )}

        <CfrExplanationModal open={isCfrModalOpen} onOpenChange={setIsCfrModalOpen} />

        {unlockItem && unlockFormCode && (
          <CreditLaunchModal
            item={unlockItem}
            href={`/visa-forms/${unlockFormCode}/wizard`}
            onClose={() => setUnlockFormCode(null)}
          />
        )}
        {showUpgradeModal && (
          <UpgradeModal feature="smart_form_filler" onClose={() => setShowUpgradeModal(false)} />
        )}
      </div>
    </div>
  );
}
