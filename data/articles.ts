export interface ArticleImage {
  url: string;
  alt?: string;
  caption?: string;
  imageType?: "full" | "sided";
}

export interface ArticleCallout {
  type?: "info" | "warning" | "tip";
  title?: string;
  text?: string;
}

export interface ArticleTable {
  headers?: string[];
  rows?: string[][];
}

export interface ArticleFAQ {
  question?: string;
  answer?: string;
}

export interface ArticleCTA {
  headline?: string;
  description?: string;
  buttonText?: string;
  buttonHref?: string;
  badge?: string;
}

export interface ArticleSidebarCTA {
  title?: string;
  description?: string;
  buttonText?: string;
  buttonHref?: string;
  badge?: string;
}

export interface ArticleAuthor {
  name?: string;
  title?: string;
  avatar?: string;
}

export interface ArticleTOCItem {
  id?: string;
  title?: string;
}

export interface ArticleSection {
  id?: string;
  h2?: string;
  h3?: string;
  paragraphs?: string[];
  callout?: ArticleCallout;
  table?: ArticleTable;
  bulletList?: string[];
  numberedList?: string[];
  image?: ArticleImage;
  imageType?: "full" | "sided";
  cta?: ArticleCTA;
}

export interface Article {
  id: string;
  slug: string;
  title?: string;
  bluf?: string; // Bottom Line Up Front answer for AEO / GEO AI Engine citation
  description?: string;
  category?:
    | "Spouse Visa (IR-1/CR-1)"
    | "Parent Visa (IR-5)"
    | "NVC & Documents"
    | "Consular Interview & 221(g)"
    | string;
  author?: ArticleAuthor;
  publishedAt?: string;
  updatedAt?: string;
  readTime?: string;
  keywords?: string[];
  heroImage?: string;
  heroImageAlt?: string;
  tableOfContents?: ArticleTOCItem[];
  sections?: ArticleSection[];
  faqs?: ArticleFAQ[];
  cta?: ArticleCTA;
  midArticleCta?: ArticleCTA;
  sidebarCta?: ArticleSidebarCTA | null;
  showSocialShare?: boolean;
  showTableOfContents?: boolean;
  showFaqs?: boolean;
  relatedSlugs?: string[];
}

export const ARTICLES: Article[] = [
  {
    id: "art-001",
    slug: "ir1-vs-cr1-visa-difference-pakistan",
    title: "IR-1 vs CR-1 Spouse Visa Pakistan: Ultimate Guide, Timeline & Requirements (2026)",
    bluf: "The primary difference between an IR-1 and a CR-1 visa is marriage duration at the time of visa issuance: couples married for less than 2 years receive a Conditional CR-1 visa (requiring Form I-751 removal of conditions after 2 years), whereas couples married for 2 years or longer receive an Immediate Relative IR-1 visa with a 10-year Unconditional Green Card upon arrival in the U.S. Both visas follow identical USCIS petitioning (Form I-130), NVC document processing, and US Embassy Islamabad interview requirements.",
    description:
      "Complete 2026 guide comparing IR-1 vs CR-1 spouse visas for Pakistani applicants. Learn processing timelines at US Embassy Islamabad, mandatory NADRA & Civil documents, I-864 sponsor income rules, and interview questions.",
    category: "Spouse Visa (IR-1/CR-1)",
    author: {
      name: "Rahvana Legal Research & Consular Strategy Team",
      title: "Senior U.S. Consular Immigration Strategists",
    },
    publishedAt: "2026-08-24",
    updatedAt: "2026-08-24",
    readTime: "12 min read",
    keywords: [
      "IR1 vs CR1 visa Pakistan",
      "US spouse visa Pakistan timeline 2026",
      "IR1 spouse visa requirements Pakistan",
      "US Embassy Islamabad spouse visa interview questions",
      "NVC document checklist Pakistan",
      "Nikah Nama Urdu to English translation for NVC",
      "I-130 approved NVC next steps timeline",
      "Affidavit of Support I-864 joint sponsor Pakistan",
      "NADRA Marriage Registration Certificate MRC",
      "Police Character Certificate Pakistan FIA",
    ],
    // heroImage: "/assets/images/about-card-1.png",
    heroImage: "/assets/images/blog/blog1-image.png",
    heroImageAlt: "IR-1 vs CR-1 Spouse Visa Pakistan Guide",
    tableOfContents: [
      { id: "bluf-overview", title: "1. Executive Summary & Quick Difference" },
      { id: "comparison-matrix", title: "2. CR-1 vs IR-1 Comparison Matrix" },
      {
        id: "step-by-step-journey",
        title: "3. Step-by-Step Immigration Journey (USCIS to Islamabad)",
      },
      {
        id: "nvc-documents-pakistan",
        title: "4. Mandatory Civil Documents Checklist for NVC (Pakistan Specific)",
      },
      {
        id: "financial-sponsorship-i864",
        title: "5. Financial Support & Joint Sponsor Rules (Form I-864)",
      },
      {
        id: "embassy-interview-prep",
        title: "6. US Embassy Islamabad Interview & 221(g) Prevention",
      },
      { id: "faq-section", title: "7. Frequently Asked Questions" },
    ],
    sections: [
      {
        id: "bluf-overview",
        h2: "1. Executive Summary & Key Distinction",
        image: {
          url: "/assets/images/blog/blog1-sec1.png",
          alt: "IR-1 vs CR-1 Executive Summary & Key Distinction",
          caption: "Understanding IR-1 vs CR-1 Visa Classification for Pakistani Spouses",
          imageType: "sided",
        },
        paragraphs: [
          "Navigating the U.S. immigrant visa process for a Pakistani spouse can feel overwhelming. The two primary immigrant visa categories available to spouses of U.S. Citizens are the CR-1 (Conditional Resident) visa and the IR-1 (Immediate Relative) visa.",
          "It is important to note that you do NOT choose between filing for a CR-1 or an IR-1 visa. USCIS and the Department of State automatically assign your category based on how long you have been legally married on the exact day your immigrant visa is approved at the U.S. Embassy in Islamabad or when you enter the United States.",
        ],
        callout: {
          type: "info",
          title: "The 2-Year Anniversary Threshold",
          text: "If your visa is issued or if you enter the U.S. on Day 729 of your marriage, you receive a 2-Year Conditional Green Card (CR-1). If you enter on Day 730 (your exact 2-year anniversary), you qualify for a 10-Year Unconditional Permanent Resident Card (IR-1), saving you $750+ in USCIS I-751 filing fees later.",
        },
      },
      {
        id: "comparison-matrix",
        h2: "2. CR-1 vs IR-1 Comparison Matrix (2026 Update)",
        paragraphs: [
          "Below is a direct side-by-side comparison of the CR-1 and IR-1 visa tracks for Pakistani beneficiaries sponsored by U.S. Citizen petitioners:",
        ],
        table: {
          headers: ["Feature / Metric", "CR-1 Spouse Visa", "IR-1 Spouse Visa"],
          rows: [
            [
              "Marriage Duration at Entry",
              "Less than 2 years (< 24 months)",
              "2 years or longer (≥ 24 months)",
            ],
            [
              "Green Card Granted",
              "2-Year Conditional Permanent Resident",
              "10-Year Unconditional Permanent Resident",
            ],
            [
              "Form I-751 (Removal of Conditions)",
              "Required (Must file 90 days before expiry)",
              "Not Required",
            ],
            ["USCIS Petition Form", "Form I-130 & Form I-130A", "Form I-130 & Form I-130A"],
            [
              "NVC Fee (DS-260 + I-864)",
              "$445 Total ($325 DS-260 + $120 I-864)",
              "$445 Total ($325 DS-260 + $120 I-864)",
            ],
            ["Average Timeline (Pakistan)", "12 to 16 Months", "12 to 16 Months"],
            [
              "Work Authorization Upon Entry",
              "Immediate (Stamped Passport serving as temporary I-551)",
              "Immediate (Stamped Passport serving as temporary I-551)",
            ],
          ],
        },
      },
      {
        id: "step-by-step-journey",
        h2: "3. Step-by-Step Immigration Journey (USCIS to US Embassy Islamabad)",
        image: {
          url: "/assets/images/blog/blog1-sec3.png",
          alt: "Step-by-Step Immigration Journey from USCIS to US Embassy Islamabad",
          caption: "Complete 3-Phase Roadmap: USCIS, NVC, and Islamabad Embassy Interview",
        },
        paragraphs: [
          "The IR-1/CR-1 visa journey follows three sequential phases. Understanding where your case currently sits is vital to preventing multi-month administrative delays.",
          "Phase 1: USCIS Petition Filing (Form I-130). The U.S. citizen spouse submits Form I-130 online or via mail, attaching proof of U.S. citizenship, proof of legal marriage (Nikah Nama & NADRA Marriage Registration Certificate), and bona fide marriage evidence (joint travel photos, money transfers, communication logs, joint bank accounts). Approval currently takes 10 to 13 months.",
          "Phase 2: NVC Document & Financial Processing (CEAC Portal). Once Form I-130 is approved, USCIS transfers the file to the National Visa Center (NVC). NVC issues an Invoice ID and Case Number starting with 'ISL' (for Islamabad). You must pay the fees, complete Form DS-260 online, upload the sponsor's Form I-864 with tax transcripts, and upload the Pakistani civil documents.",
          "Phase 3: US Embassy Islamabad Interview & Visa Stamping. After NVC marks your case as 'Documentarily Qualified' (DQ), your file enters the queue for an interview slot at the U.S. Embassy in Islamabad. Embassy appointment wait times currently range between 2 to 5 months after DQ.",
        ],
        bulletList: [
          "Step 1: File USCIS I-130 & I-130A petition online",
          "Step 2: Receive USCIS NOA1 (Receipt Notice) & NOA2 (Approval Notice)",
          "Step 3: Case Creation at NVC (ISL Case Number assigned)",
          "Step 4: Pay NVC Fees ($120 AOS + $325 IV fee)",
          "Step 5: Submit Form DS-260 Immigrant Visa Application",
          "Step 6: Upload Affidavit of Support (I-864) & IRS Tax Transcripts",
          "Step 7: Upload Pakistani Civil Documents (Nikah Nama, NADRA MRC, Police Certificate)",
          "Step 8: Receive Documentarily Qualified (DQ) Notice from NVC",
          "Step 9: Complete Medical Examination at Panel Physician (Islamabad or Karachi)",
          "Step 10: Attend US Embassy Islamabad Interview & Collect Passport with Visa Stamp",
        ],
      },
      {
        id: "nvc-documents-pakistan",
        h2: "4. Mandatory Civil Documents Checklist for NVC (Pakistan Specific)",
        image: {
          url: "/assets/images/blog/blog1-sec4.png",
          alt: "Mandatory Civil Documents Checklist for NVC Pakistan",
          caption: "Essential Pakistani Civil Documents: Nikah Nama, NADRA MRC, Police Certificate, and FRC",
          imageType: "sided",
        },
        paragraphs: [
          "Uploading incorrect or improperly formatted civil documents is the #1 cause of NVC rejection notices (FE Notes). The Department of State enforces strict reciprocity rules for documents issued in Pakistan.",
          "1. Original Urdu Nikah Nama & Certified English Translation: You MUST upload the complete original 4-page Urdu Nikah Nama signed by the Nikah Registrar and Union Council official, along with an official English translation signed and stamped by an authorized translation agency.",
          "2. NADRA Marriage Registration Certificate (MRC): A hand-written Urdu Nikah Nama alone is INSUFFICIENT for NVC. You must obtain the computer-generated NADRA MRC featuring a QR code and Union Council seal.",
          "3. Police Character Certificate (FIA / Local Police): Issued by the Senior Superintendent of Police (SSP) or CPO/Khidmat Markaz in the applicant's district of residence. Must cover all districts in Pakistan where the applicant has resided for 6+ months since age 16.",
          "4. NADRA Family Registration Certificate (FRC): FRC by Marriage (showing petitioner spouse) or FRC by Birth (showing parents and siblings).",
          "5. Biometric Passport: Must have at least 8 months of remaining validity prior to interview.",
        ],
        callout: {
          type: "warning",
          title: "NVC Rejection Avoidance Tip",
          text: "Never upload scanned copies of photocopies! NVC reviewers reject low-resolution or cropped document scans. Rahvana's built-in Document OCR & Validation Tool auto-checks your scanned Nikah Nama and NADRA documents for exact NVC formatting compliance before you upload them to CEAC.",
        },
      },
      {
        id: "financial-sponsorship-i864",
        h2: "5. Financial Support & Joint Sponsor Rules (Form I-864)",
        image: {
          url: "/assets/images/blog/blog1-sec5.png",
          alt: "Financial Support & Joint Sponsor Rules Form I-864",
          caption: "Form I-864 Affidavit of Support Income Requirements and Joint Sponsorship Rules",
        },
        paragraphs: [
          "The U.S. citizen petitioner must meet at least 125% of the Federal Poverty Guidelines for their household size. For a 2-person household (petitioner + immigrating spouse), the minimum annual gross income required is $25,550 (2026 guideline estimate).",
          "What if the petitioner does not meet the income threshold? You can add a Joint Sponsor. A Joint Sponsor must be a U.S. Citizen or Lawful Permanent Resident residing in the U.S. who earns 125% of the poverty guideline for their own household size PLUS the immigrating spouse.",
          "Required Financial Documents for NVC Upload:",
        ],
        bulletList: [
          "Form I-864 signed by the U.S. Citizen Petitioner",
          "Most recent IRS Tax Return Transcript (Form 1040 is acceptable, but IRS Tax Transcript is strongly preferred)",
          "Form W-2s and 1099s for the latest tax year",
          "Recent employment verification letter & last 3 to 6 months of paystubs",
          "Form I-864 signed by Joint Sponsor (if applicable) + Proof of Joint Sponsor U.S. Citizenship/PR status",
        ],
      },
      {
        id: "embassy-interview-prep",
        h2: "6. US Embassy Islamabad Interview & 221(g) Prevention",
        image: {
          url: "/assets/images/blog/blog1-sec6.png",
          alt: "US Embassy Islamabad Interview & 221(g) Prevention",
          caption: "Preparing for the Consular Interview at the U.S. Embassy in Islamabad",
        },
        paragraphs: [
          "The consular interview at the U.S. Embassy in Islamabad (located in the Diplomatic Enclave) typically lasts between 5 to 12 minutes. The consular officer's main objective is verifying that your marriage is genuine (bona fide) and not entered into solely for immigration benefits.",
          "Common US Embassy Islamabad Interview Questions:",
        ],
        bulletList: [
          "When and where did you first meet your spouse in person?",
          "How many times has your spouse visited Pakistan since your marriage?",
          "Where does your spouse work in the U.S., and what is their annual salary?",
          "Who attended your Nikah ceremony, and how many guests were present?",
          "Does your spouse have any previous marriages or children?",
          "What are your joint plans once you arrive in the U.S.?",
        ],
        callout: {
          type: "tip",
          title: "Preventing 221(g) Administrative Processing Slips",
          text: "Receiving a 221(g) refusal slip in Islamabad can delay visa issuance by 3 to 12 months. The most frequent triggers are missing original NADRA documents, incomplete joint sponsor tax returns, or insufficient physical relationship evidence. Carry organized physical binder folders to your interview!",
        },
      },
    ],
    faqs: [
      {
        question:
          "Can I upgrade from a CR-1 to an IR-1 visa if our 2nd wedding anniversary passes while waiting for the interview?",
        answer:
          "Yes! You do not need to file any special petition or pay extra fees. If your 2nd wedding anniversary occurs before your visa interview or before your actual flight/entry into the U.S., notify the consular officer at US Embassy Islamabad or CBP officer at U.S. port of entry. They will update your visa category to IR-1, granting you a 10-year unconditional Green Card.",
      },
      {
        question: "What is the average timeline for an IR-1 / CR-1 visa from Pakistan in 2026?",
        answer:
          "The total timeline from initial I-130 online submission to visa issuance at US Embassy Islamabad ranges between 25 to 33 months (approximately 14–19 months for USCIS petition approval, 1–2 months for NVC document processing, and 10–12 months for Islamabad interview scheduling).",
      },
      {
        question: "Is Urdu Nikah Nama alone accepted by NVC without NADRA MRC?",
        answer:
          "No. NVC strictly requires BOTH the complete original 4-page Urdu Nikah Nama with certified English translation AND the official computer-generated NADRA Marriage Registration Certificate (MRC). Submitting only one of them will cause an NVC FE rejection note.",
      },
      {
        question: "Do I need a joint sponsor if the US petitioner is currently unemployed?",
        answer:
          "Yes. If the U.S. petitioner's current annual income falls below 125% of the Federal Poverty Guidelines, you MUST submit Form I-864 from a qualified Joint Sponsor who meets the income requirement, along with their IRS Tax Transcripts and proof of U.S. status.",
      },
    ],
    cta: {
      headline: "Take the Guesswork Out of Your U.S. Spouse Visa",
      description:
        "Track your exact IR-1/CR-1 roadmap, validate mandatory NADRA documents with AI OCR, and run instant Case Strength checks before submitting to NVC or US Embassy Islamabad.",
      buttonText: "Check Your Visa Eligibility →",
      buttonHref: "/visa-eligibility",
      badge: "Free Interactive Tool",
    },
    midArticleCta: {
      badge: "Included with Journey Plan",
      headline: "Generate Your Custom NVC Document Vault Checklist",
      description:
        "Auto-check your scanned Nikah Nama, NADRA MRC, and Police Certificates for exact NVC formatting rules before uploading to CEAC. Included with any Rahvana Journey Plan.",
      buttonText: "Access Document Vault →",
      buttonHref: "/document-vault",
    },
    sidebarCta: {
      title: "Need Direct Assistance?",
      description: "Book a strategy consultation with our U.S. visa case managers.",
      buttonText: "Book Consultation →",
      buttonHref: "/book-consultation",
    },
    showSocialShare: true,
    showTableOfContents: true,
    showFaqs: true,
    relatedSlugs: ["ir1-vs-cr1-visa-difference-pakistan"],
  },
];

export function getArticleBySlug(slug: string): Article | undefined {
  return ARTICLES.find((a) => a.slug === slug);
}

export function getAllArticles(): Article[] {
  return ARTICLES;
}
