import { ir1journeyHref, ir5journeyHref } from "@/lib/constants/routes";

export const JOURNEY_SLUGS = ["ir-1", "ir-5"] as const;

export type JourneySlug = (typeof JOURNEY_SLUGS)[number];

export function isJourneySlug(slug: string): slug is JourneySlug {
  return (JOURNEY_SLUGS as readonly string[]).includes(slug);
}

export type JourneyCategory = "Family" | "Work" | "Study" | "Investment";

export interface ExplorerJourneyCard {
  slug?: JourneySlug;
  code: string;
  title: string;
  audience: string;
  category: JourneyCategory;
  summary: string;
  timeline: string;
  successRate: string;
  status: "Live" | "Coming soon";
  featured?: boolean;
  href?: string;
  image: string;
  highlights: string[];
}

export interface JourneyFact {
  label: string;
  value: string;
}

export interface JourneyStep {
  stage: string;
  title: string;
  summary: string;
  detail: string;
  metric: string;
  duration: string;
  outcome: string;
  rahvanaSupport: string;
}

export interface JourneyCallout {
  eyebrow: string;
  title: string;
  body: string;
}

export interface JourneyPreparationCategory {
  title: string;
  description: string;
  icon: "relationship" | "financial" | "identity" | "forms" | "interview" | "arrival";
}

export interface JourneySupportingResource {
  title: string;
  description: string;
}

export interface JourneyDetailContent {
  slug: JourneySlug;
  code: string;
  title: string;
  subtitle: string;
  summary: string;
  heroEyebrow: string;
  heroImage: string;
  heroOverlay: string;
  quickFacts: JourneyFact[];
  timeline: JourneyStep[];
  preparationHeading: string;
  preparationDescription: string;
  preparationCategories: JourneyPreparationCategory[];
  supportingResources: JourneySupportingResource[];
  evidence: string[];
  checklist: string[];
  callout: JourneyCallout;
  ctaPrimary: { label: string; href: string };
  ctaSecondary: { label: string; href: string };
}

export const EXPLORER_CARDS: ExplorerJourneyCard[] = [
  {
    slug: "ir-1",
    code: "IR-1 / CR-1",
    title: "Spouse Visa",
    audience: "Spouse of a U.S. citizen",
    category: "Family",
    summary:
      "Immediate-relative pathway for couples building a life together in the United States.",
    timeline: "12 - 18 months",
    successRate: "92%",
    status: "Live",
    featured: true,
    href: "/visa-category/ir-1",
    image: "/assets/images/ir1-doc-vault-image.jpg",
    highlights: ["Immediate relative", "Consular processing", "Work authorization on arrival"],
  },
  {
    slug: "ir-5",
    code: "IR-5",
    title: "Parent Visa",
    audience: "Parent of a U.S. citizen age 21+",
    category: "Family",
    summary:
      "Dedicated parent sponsorship track with clear document requirements and a stable immediate-relative structure.",
    timeline: "15 - 22 months",
    successRate: "96%",
    status: "Live",
    featured: true,
    href: "/visa-category/ir-5",
    image: "/assets/images/ir5-doc-vault-image.png",
    highlights: ["Age 21+ petitioner", "No annual quota", "Permanent residency outcome"],
  },
  {
    code: "K-1",
    title: "Fiance(e) Route",
    audience: "Engaged couples",
    category: "Family",
    summary:
      "Future family pathway for couples planning to marry after arrival in the United States.",
    timeline: "Coming soon",
    successRate: "--",
    status: "Coming soon",
    image: "/assets/images/k1_fiance_visa.png",
    highlights: ["Planned release", "Marriage-based", "Pre-marriage planning"],
  },
];

export const JOURNEY_DETAILS: Record<JourneySlug, JourneyDetailContent> = {
  "ir-1": {
    slug: "ir-1",
    code: "IR-1 / CR-1",
    title: "IR-1 Visa Journey",
    subtitle: "Spouse of a U.S. citizen",
    summary:
      "A focused, immediate-relative pathway for spouses pursuing lawful permanent residency through consular processing.",
    heroEyebrow: "Family-based journey",
    heroImage: "/assets/images/ir1-doc-vault-image.jpg",
    heroOverlay: "linear-gradient(180deg, rgba(4, 67, 73, 0.12) 0%, rgba(4, 67, 73, 0.72) 100%)",
    quickFacts: [
      { label: "Green card type", value: "10-year if married 2+ years" },
      { label: "Est. total time", value: "22 - 31 months" },
      { label: "Work authorization", value: "Immediate" },
      { label: "Stay limit", value: "Indefinite" },
    ],
    timeline: [
      {
        stage: "Stage 1",
        title: "USCIS Petition (I-130)",
        summary:
          "The U.S. citizen spouse files the petition and establishes the legal marriage relationship.",
        detail:
          "This is the foundation of the case. Clean civil records, matching names, and strong bona fide marriage evidence reduce avoidable delays.",
        metric: "Typical duration: 12 - 18 months",
        duration: "12 - 18 months",
        outcome:
          "A USCIS decision that recognizes the qualifying marriage and moves the case to the National Visa Center.",
        rahvanaSupport:
          "Rahvana starts with eligibility screens, builds the Pakistan-specific document checklist, guides I-130/I-130A preparation, and keeps evidence uploads organized before USCIS submission.",
      },
      {
        stage: "Stage 2",
        title: "NVC Processing",
        summary:
          "The National Visa Center collects fees, civil documents, and the affidavit of support.",
        detail:
          "The pacing here is usually driven by document completeness. Organize translations, tax records, and the DS-260 before you upload anything.",
        metric: "Focus: financial and civil documentation",
        duration: "2 - 3 months after USCIS approval",
        outcome:
          "Documentarily qualified status once fees, DS-260, civil documents, and financial support are accepted.",
        rahvanaSupport:
          "Rahvana helps users access CEAC, prepare DS-260 answers, scan civil documents, calculate sponsorship needs, gather financial evidence, and run a final NVC quality check before submission.",
      },
      {
        stage: "Stage 3",
        title: "Consular Interview",
        summary: "The foreign spouse attends the embassy interview in their home country.",
        detail:
          "This is the final adjudication moment before visa issuance. Rehearse answers, carry originals, and keep your civil file neatly labeled.",
        metric: "Location: home-country embassy or consulate",
        duration: "8 - 10 months after DQ",
        outcome: "Visa approval, administrative processing, or a request for additional evidence.",
        rahvanaSupport:
          "Rahvana tracks the medical exam, police certificate, courier registration, original-document packet, interview practice, and the final interview-day checklist.",
      },
      // {
      //   stage: "Stage 4",
      //   title: "U.S. Entry and Green Card",
      //   summary:
      //     "The spouse enters the United States and receives permanent resident status on arrival.",
      //   detail:
      //     "The passport stamp acts as temporary proof of residency and the green card is mailed to the U.S. address after arrival processing.",
      //   metric: "Outcome: 10-year permanent residency",
      //   duration: "Green card typically follows after U.S. entry",
      //   outcome:
      //     "The spouse enters as a permanent resident and can begin life and work in the United States.",
      //   rahvanaSupport:
      //     "Rahvana records the interview outcome, unlocks the correct next steps for approval or 221(g), tracks visa issuance or post-interview review, and keeps delivery and arrival tasks visible.",
      // },
    ],
    preparationHeading: "What Couples Need Along the Spouse Visa Journey",
    preparationDescription:
      "IR-1/CR-1 cases depend on clean marriage records, strong relationship evidence, sponsor financial proof, and interview-ready civil documents. Rahvana keeps each requirement tied to the correct stage so couples know what to prepare before USCIS, NVC, and the consular interview.",
    preparationCategories: [
      {
        title: "Relationship Evidence",
        description:
          "Proof that the marriage is genuine, ongoing, and supported by shared history, communication, photos, and life records.",
        icon: "relationship",
      },
      {
        title: "Financial Evidence",
        description:
          "Sponsor income records, tax transcripts, and support documents needed to show the household can meet financial requirements.",
        icon: "financial",
      },
      {
        title: "Civil & Identity Documents",
        description:
          "Marriage certificates, passports, birth records, translations, and identity documents that establish eligibility.",
        icon: "identity",
      },
      {
        title: "Government Forms",
        description:
          "I-130, DS-260, affidavit of support, and stage-specific submissions that must stay consistent across the journey.",
        icon: "forms",
      },
      {
        title: "Interview Preparation",
        description:
          "Original documents, appointment letters, medical exam readiness, and relationship timeline preparation for the consular interview.",
        icon: "interview",
      },
      // {
      //   title: "Arrival & Post-Approval Documents",
      //   description:
      //     "Visa packet, immigrant fee, U.S. address readiness, and proof of permanent residence after entry.",
      //   icon: "arrival",
      // },
    ],
    supportingResources: [
      {
        title: "Relationship proof organizer",
        description:
          "Group marriage evidence by time period and proof type before the case is reviewed.",
      },
      {
        title: "NVC upload checklist",
        description: "Track civil documents, sponsor records, and translations before submission.",
      },
    ],
    evidence: [
      "Joint bank statements and evidence of financial co-mingling",
      "Lease agreements, utility bills, or home ownership records",
      "Sworn affidavits from family and friends who know the couple",
      "Photos, travel logs, and communication history that show an ongoing marriage",
    ],
    checklist: [
      "Civil marriage certificate and any required translations",
      "U.S. citizen spouse proof of citizenship",
      "Form I-130 package with consistent names and dates",
      "Affidavit of support and supporting tax transcripts",
      "Medical exam and interview letter before the embassy stage",
    ],
    callout: {
      eyebrow: "Expert tip",
      title: "IR-1 is cleaner than CR-1 when the marriage is already two years old.",
      body: "If the marriage is under two years at issuance, the case can land in CR-1 territory and later require removal of conditions. Planning the timing carefully can change the experience at the finish line.",
    },
    ctaPrimary: {
      label: "Start IR-1 assessment",
      href: ir1journeyHref,
    },
    ctaSecondary: {
      label: "Talk to an expert",
      href: "/book-consultation",
    },
  },
  "ir-5": {
    slug: "ir-5",
    code: "IR-5",
    title: "IR-5 Parent Visa Journey",
    subtitle: "Parent of a U.S. citizen age 21+",
    summary:
      "A direct immediate-relative route for parents who qualify under U.S. citizen sponsorship and consular processing.",
    heroEyebrow: "Immediate relative category",
    heroImage: "/assets/images/ir5-doc-vault-image.png",
    heroOverlay: "linear-gradient(180deg, rgba(4, 67, 73, 0.08) 0%, rgba(48, 63, 63, 0.74) 100%)",
    quickFacts: [
      { label: "Petitioner age", value: "U.S. citizen 21+" },
      { label: "Relationship type", value: "Parent of U.S. citizen" },
      { label: "Financial support", value: "I-864 / 125% FPL" },
      { label: "Quota", value: "No annual cap" },
    ],
    timeline: [
      {
        stage: "Stage 1",
        title: "Confirm eligibility and file I-130",
        summary: "The U.S. citizen child confirms age and citizenship, then files for the parent.",
        detail:
          "The core question is the legal parent-child relationship. Birth records, adoption records, or stepparent proof should be aligned before filing.",
        metric: "Petitioner must be at least 21",
        duration: "12 - 18 months",
        outcome: "A USCIS decision confirming the qualifying parent-child relationship.",
        rahvanaSupport:
          "Rahvana helps confirm petitioner age, citizenship proof, and parent-child records before the I-130 packet is assembled.",
      },
      {
        stage: "Stage 2",
        title: "NVC document review",
        summary: "Fees, Form DS-260, and the affidavit of support move through the NVC workflow.",
        detail:
          "The parent case often moves quickly when tax transcripts, income evidence, and civil records are ready at the same time.",
        metric: "Focus: I-864 and civil evidence",
        duration: "2 - 3 months after USCIS approval",
        outcome:
          "NVC accepts the sponsor and parent documents and places the case in line for interview scheduling.",
        rahvanaSupport:
          "Rahvana separates sponsor financial proof from parent civil records and keeps each required upload tied to the NVC stage.",
      },
      {
        stage: "Stage 3",
        title: "Medical exam and embassy interview",
        summary: "The parent attends the medical appointment and interview in the home country.",
        detail:
          "Carry originals, translations, and proof of family relationship. If the parent has a complex history, organize the file around dates and documents.",
        metric: "Location: embassy or consulate",
        duration: "8 - 10 months after DQ",
        outcome:
          "The parent receives an interview decision or clear instructions for any missing items.",
        rahvanaSupport:
          "Rahvana creates an interview-ready file, tracks medical and police certificate timing, and highlights documents the parent should carry.",
      },
      // {
      //   stage: "Stage 4",
      //   title: "Arrival in the United States",
      //   summary:
      //     "The parent enters the U.S. as a permanent resident and continues life with the family.",
      //   detail:
      //     "The immigrant packet and passport stay with the traveler. After arrival, the green card arrives by mail to the U.S. address.",
      //   metric: "Outcome: permanent residency",
      //   duration: "Green card typically follows after U.S. entry",
      //   outcome:
      //     "The parent enters the United States as a permanent resident with post-arrival tasks clearly defined.",
      //   rahvanaSupport:
      //     "Rahvana keeps final travel, immigrant fee, U.S. address, and post-approval document tasks organized through arrival.",
      // },
    ],
    preparationHeading: "What Families Need Along the Parent Visa Journey",
    preparationDescription:
      "IR-5 cases depend on proving the U.S. citizen child's age, citizenship, parent-child relationship, sponsor financial support, and the parent's civil documents. Rahvana organizes these requirements by stage so families can prepare the right proof before USCIS, NVC, and the embassy interview.",
    preparationCategories: [
      {
        title: "Parent-Child Relationship Proof",
        description:
          "Birth, adoption, or step-parent records that establish the legal relationship between the U.S. citizen child and parent.",
        icon: "relationship",
      },
      {
        title: "Sponsor Financial Evidence",
        description:
          "Tax transcripts, income documents, and affidavit of support materials showing the sponsor meets support requirements.",
        icon: "financial",
      },
      {
        title: "Civil & Identity Documents",
        description:
          "Parent passport, birth certificate, police certificates, translations, and other civil records needed across NVC and interview stages.",
        icon: "identity",
      },
      {
        title: "Government Forms",
        description:
          "I-130, DS-260, I-864, fee records, and case notices that must stay accurate and easy to retrieve.",
        icon: "forms",
      },
      {
        title: "Interview Preparation",
        description:
          "Medical exam, original civil documents, appointment letter, and sponsor relationship proof prepared for the consulate.",
        icon: "interview",
      },
      // {
      //   title: "Arrival & Post-Approval Documents",
      //   description:
      //     "Visa packet, U.S. entry planning, immigrant fee, address readiness, and green-card delivery tracking.",
      //   icon: "arrival",
      // },
    ],
    supportingResources: [
      {
        title: "Parent civil file checklist",
        description:
          "Keep relationship records, translations, and identity documents ready by stage.",
      },
      {
        title: "Sponsor support tracker",
        description: "Organize tax and income proof before NVC review begins.",
      },
    ],
    evidence: [
      "Child's proof of U.S. citizenship",
      "Parent's birth certificate and certified translation if needed",
      "Petitioner's birth certificate showing the relationship",
      "U.S. domicile and tax support documents for the sponsor",
    ],
    checklist: [
      "Proof of citizenship for the petitioner",
      "Birth records or adoption/step-parent documents",
      "Tax transcripts, pay stubs, and I-864 support packet",
      "Police certificates and medical exam before interview",
      "Interview letter and passport-ready civil file",
    ],
    callout: {
      eyebrow: "Expert tip",
      title: "IR-5 is strongest when the parent-child paper trail is built early.",
      body: "Age, domicile, and relationship evidence should be organized before filing. That keeps the case from stalling later when the NVC or embassy asks for proof.",
    },
    ctaPrimary: {
      label: "Start IR-5 assessment",
      href: ir5journeyHref,
    },
    ctaSecondary: {
      label: "Talk to an expert",
      href: "/book-consultation",
    },
  },
};

export const EXPLORER_FILTERS: JourneyCategory[] = ["Family", "Work", "Study", "Investment"];

export function getJourneyDetail(slug: JourneySlug) {
  return JOURNEY_DETAILS[slug];
}
