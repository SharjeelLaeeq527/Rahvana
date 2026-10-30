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
          caption:
            "Essential Pakistani Civil Documents: Nikah Nama, NADRA MRC, Police Certificate, and FRC",
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
          caption:
            "Form I-864 Affidavit of Support Income Requirements and Joint Sponsorship Rules",
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
    relatedSlugs: [
      "ir5-visa-guide-bring-parents-to-united-states",
      "221g-visa-refusal-ir1-cr1-spouse-visa",
    ],
  },
  {
    id: "art-002",
    slug: "ir5-visa-guide-bring-parents-to-united-states",
    title: "IR-5 Visa Guide: How to Bring Your Parents to the United States",
    bluf: "The IR-5 is an immediate relative immigrant visa for the parent of a U.S. citizen who is at least 21 years old. It allows parents to immigrate to the United States as lawful permanent residents (green card holders) without annual numerical visa caps, following Form I-130 petition approval, NVC processing, financial sponsorship (Form I-864), and consular interview.",
    description:
      "Comprehensive guide to the IR-5 parent immigrant visa. Learn eligibility requirements, Form I-130 petitioning, NVC document processing, I-864 financial sponsorship, civil documents, and embassy interview preparation.",
    category: "Parent Visa (IR-5)",
    author: {
      name: "Rahvana Legal Research & Consular Strategy Team",
      title: "Senior U.S. Consular Immigration Strategists",
    },
    publishedAt: "2026-09-15",
    updatedAt: "2026-10-18",
    readTime: "10 min read",
    keywords: [
      "IR-5 visa guide",
      "how to bring parents to United States",
      "IR-5 parent visa Pakistan",
      "sponsor parents green card",
      "IR5 visa requirements",
      "Form I-130 for parents",
      "I-864 affidavit of support parent",
      "DS-260 consular processing parent",
      "US Embassy Islamabad parent visa",
      "IR-5 civil documents checklist",
    ],
    heroImage: "/assets/images/ir5-image.png",
    heroImageAlt: "IR-5 Visa Guide: How to Bring Your Parents to the United States",
    tableOfContents: [
      { id: "intro-overview", title: "1. Introduction & Overview" },
      { id: "what-is-ir5-visa", title: "2. What Is the IR-5 Visa?" },
      { id: "who-qualifies", title: "3. Who Qualifies for an IR-5 Visa?" },
      { id: "step-by-step-process", title: "4. Step-by-Step: How the IR-5 Visa Process Works" },
      { id: "timeline", title: "5. How Long Does the IR-5 Visa Process Take?" },
      { id: "common-mistakes", title: "6. Common Mistakes to Avoid" },
      { id: "next-steps", title: "7. Make the Immigration Process Easier to Navigate" },
      { id: "faq-section", title: "8. Frequently Asked Questions" },
    ],
    sections: [
      {
        id: "intro-overview",
        h2: "Bringing Your Parents to the United States",
        paragraphs: [
          "For many families, moving to the United States is not the end of the immigration journey. It is the beginning of a new question: How can I bring my parents here so we can finally live closer together?",
          "If you are a U.S. citizen aged 21 or older hoping to help your mother or father immigrate from Pakistan or another country, the IR-5 visa may be the pathway you need to understand.",
          "The IR-5 is an immigrant visa for the eligible mother or father of a U.S. citizen who is at least 21 years old. It allows the parent to immigrate to the United States as a lawful permanent resident (green card holder), provided all applicable eligibility requirements are met.",
          "However, sponsoring a parent involves more than submitting one application. You will need to establish the qualifying family relationship, prepare financial sponsorship documents, complete the immigrant visa application, and help your parents navigate the required documentation and interview process.",
          "This guide explains how the IR-5 visa works, who qualifies, which documents may be required, and what families should prepare for throughout the process.",
        ],
      },
      {
        id: "what-is-ir5-visa",
        h2: "What Is the IR-5 Visa?",
        paragraphs: [
          "The IR-5 visa is an immediate relative immigrant visa for the parent of a U.S. citizen who is at least 21 years old.",
          "Unlike temporary visitor visas, the IR-5 is intended for parents who want to immigrate to the United States permanently. Once admitted to the United States with the immigrant visa, the parent generally becomes a lawful permanent resident.",
          "The IR-5 falls under the U.S. immediate relative immigration categories. These categories are not subject to the annual numerical limits that apply to many family-preference visas. That does not mean the process is immediate: petition review, document processing, interview scheduling, security checks, and other requirements can still take time.",
          "Official overview: [U.S. Department of State — Family Immigration](https://travel.state.gov/content/travel/en/us-visas/immigrate/family-immigration.html).",
        ],
      },
      {
        id: "who-qualifies",
        h2: "Who Qualifies for an IR-5 Visa?",
        paragraphs: [
          "The first step is determining whether the U.S. citizen and parent meet the eligibility requirements.",
        ],
        numberedList: [
          "The sponsoring child must be a U.S. citizen: The person filing the petition must be a U.S. citizen. A lawful permanent resident, or green card holder, cannot sponsor a parent through the IR-5 category.",
          "The U.S. citizen must be at least 21 years old: You must have reached your 21st birthday before petitioning your parents.",
          "You must establish the qualifying parent-child relationship: The required evidence depends on the family relationship. For example, a biological parent’s birth record may establish the connection between the petitioner and parent. Other circumstances, such as a stepparent or adoptive parent relationship, can involve additional legal requirements. If your family history includes adoption, a stepparent relationship, a name change, or discrepancies between official records, review the applicable requirements carefully before filing.",
          "The parent must be eligible for an immigrant visa: An approved family petition establishes the qualifying relationship, but it does not automatically guarantee visa issuance. The parent must also complete the immigrant visa process and meet the applicable admissibility requirements.",
        ],
        callout: {
          type: "warning",
          title: "Important: Each Parent Requires a Separate Petition",
          text: "If you want to sponsor both your mother and father, you generally must file one Form I-130 for each parent. A parent’s spouse does not automatically receive an IR-5 visa as a dependent on the same petition.",
        },
      },
      {
        id: "step-by-step-process",
        h2: "Step-by-Step: How the IR-5 Visa Process Works",
        paragraphs: [
          "The process generally moves through several stages, beginning with U.S. Citizenship and Immigration Services (USCIS) and continuing through the National Visa Center (NVC) and the appropriate U.S. embassy or consulate.",
        ],
      },
      {
        id: "step-1-form-i130",
        h3: "Step 1: File Form I-130",
        paragraphs: [
          "The U.S. citizen begins by filing Form I-130, Petition for Alien Relative, with USCIS.",
          "This petition establishes that the petitioner is a qualifying U.S. citizen and that the beneficiary is their eligible parent.",
          "Depending on your circumstances, supporting evidence may include:",
        ],
        bulletList: [
          "Proof of the petitioner's U.S. citizenship, such as a U.S. passport or naturalization certificate.",
          "The petitioner's birth certificate showing the parent-child relationship.",
          "Relevant adoption, marriage, or legal records when applicable.",
          "Evidence explaining name changes or differences across official documents, if necessary.",
        ],
        callout: {
          type: "info",
          title: "Filing Instructions & Official Portal",
          text: "Follow the current USCIS form instructions to determine which evidence applies to your case and how to submit it. You can find the form and filing instructions on the [official USCIS website](https://www.uscis.gov/i-130).",
        },
      },
      {
        id: "step-2-uscis-review",
        h3: "Step 2: Wait for USCIS to review the petition",
        paragraphs: [
          "USCIS reviews the petition and supporting evidence. It may approve the petition, deny it, or request additional evidence.",
          "Processing times vary. They can depend on the type of case, the reviewing office, and other factors. Avoid relying on another family's timeline as a guarantee for your own case.",
          "You can check the relevant estimates using the [USCIS Processing Times tool](https://egov.uscis.gov/processing-times/).",
        ],
      },
      {
        id: "step-3-nvc-processing",
        h3: "Step 3: Complete National Visa Center processing",
        paragraphs: [
          "After USCIS approves the petition and forwards the case for consular processing, the National Visa Center generally handles the next stage.",
          "The NVC provides instructions for paying the applicable fees and submitting the required information and documents.",
          "At this stage, the petitioner and parent may need to coordinate several tasks, including financial sponsorship, the immigrant visa application, and civil documentation.",
          "Keep copies of receipts, submitted forms, and official correspondence. Make sure the email address and contact information associated with the case remain current.",
        ],
      },
      {
        id: "step-4-financial-sponsorship",
        h3: "Step 4: Prepare the financial sponsorship documents",
        paragraphs: [
          "Financial sponsorship is an important part of the IR-5 process.",
          "In most cases, the U.S. citizen petitioner must submit Form I-864, Affidavit of Support, along with the required financial evidence. By signing this form, the sponsor accepts legally binding financial responsibilities under the applicable rules.",
          "The sponsor generally must demonstrate sufficient income or qualifying assets under the relevant requirements. The amount depends on factors such as household size and the applicable income guidelines.",
          "Financial evidence may include:",
        ],
        bulletList: [
          "Federal income tax information or tax transcripts.",
          "Proof of current income, such as employment or income documentation.",
          "Additional evidence requested by the NVC or required by the case.",
          "Qualifying asset documentation, where applicable.",
        ],
        callout: {
          type: "tip",
          title: "Joint Sponsor Rules",
          text: "If the petitioner does not meet the financial requirements alone, a qualifying joint sponsor may be an option. The joint sponsor must independently satisfy the applicable requirements and accept the obligations associated with the Affidavit of Support. \n\nDo not assume that having a job or submitting a tax return automatically satisfies the requirements. Review the current instructions and calculate the applicable household size and income threshold. \n\nFor more guidance, consult the [Department of State's Affidavit of Support information](https://travel.state.gov/content/travel/en/us-visas/immigrate/the-immigrant-visa-process/step-4-affidavit-of-support.html).",
        },
      },
      {
        id: "step-5-ds-260",
        h3: "Step 5: Complete Form DS-260",
        paragraphs: [
          "Once the case is ready for the immigrant visa application stage and the applicable fee requirements are met, the parent generally completes Form DS-260, Immigrant Visa and Alien Registration Application, through the Consular Electronic Application Center (CEAC).",
          "The form requests personal, family, travel, and background information. Answers should be accurate and consistent with the parent's supporting records.",
          "Before submitting, carefully review details such as:",
        ],
        bulletList: [
          "Full legal name and any previous names.",
          "Date and place of birth.",
          "Marriage and family history.",
          "Residential and travel history.",
          "Previous U.S. immigration or visa history, where applicable.",
        ],
        callout: {
          type: "info",
          title: "CEAC Application Portal",
          text: "Errors or inconsistencies may require clarification and can delay processing. Save the DS-260 confirmation page because it is generally required for the interview. \n\nOfficial application portal: [Consular Electronic Application Center](https://ceac.state.gov/).",
        },
      },
      {
        id: "step-6-civil-documents",
        h3: "Step 6: Collect the required civil documents",
        paragraphs: [
          "The parent must gather the civil documents required for their case and country of processing. The exact checklist can vary according to the applicant's history and the instructions of the responsible embassy or consulate.",
          "Documents may include:",
        ],
        bulletList: [
          "Birth certificate.",
          "Valid passport.",
          "Marriage certificate, if applicable.",
          "Final divorce decrees or death certificates relating to previous marriages, if applicable.",
          "Police certificates, where required.",
          "Court or military records, if applicable.",
          "The petitioner's birth certificate or other evidence establishing the parent-child relationship.",
          "Any required translations or additional supporting records.",
        ],
        callout: {
          type: "tip",
          title: "Country-Specific Instructions & Practical Tip",
          text: "For families applying from Pakistan, it is particularly important to check the current country-specific civil document instructions. The correct issuing authority, acceptable document format, and translation requirements matter. \n\nUse the [Department of State's Civil Documents guidance](https://travel.state.gov/content/travel/en/us-visas/immigrate/the-immigrant-visa-process/step-7-collect-civil-documents.html) and its [country-specific reciprocity and civil documents directory](https://travel.state.gov/content/travel/en/us-visas/Visa-Reciprocity-and-Civil-Documents-by-Country.html). \n\nA practical tip: Check names, dates, and places across every document before submission. If the parent's passport uses a different spelling from the birth certificate, for example, determine whether supporting documentation or an explanation is needed. Do not alter official records simply to make them match.",
        },
      },
      {
        id: "step-7-medical-and-interview",
        h3: "Step 7: Complete the medical examination and prepare for the interview",
        paragraphs: [
          "Once an interview is scheduled, follow the embassy or consulate's specific instructions. The parent will generally need to complete an immigration medical examination with an authorized panel physician and bring the required documents to the interview.",
          "Depending on the case instructions, the interview package may include:",
        ],
        bulletList: [
          "A valid passport.",
          "The DS-260 confirmation page.",
          "The interview appointment letter.",
          "Original or certified civil documents, as instructed.",
          "Financial sponsorship documents or updated evidence, if required.",
          "Medical examination information and any other requested records.",
        ],
        callout: {
          type: "info",
          title: "Consular Interview Guidelines",
          text: "The consular officer reviews the application and determines whether the parent qualifies for the visa. The officer may ask questions about the family relationship, the petitioner's circumstances, or information in the application. Answer truthfully. If a question is unclear, ask for clarification rather than guessing. For the official process, see the [Department of State's immigrant visa interview guidance](https://travel.state.gov/content/travel/en/us-visas/immigrate/the-immigrant-visa-process/step-10-prepare-for-the-interview.html).",
        },
      },
      {
        id: "step-8-outcome",
        h3: "Step 8: Understand the outcome after the interview",
        paragraphs: [
          "An interview does not always result in immediate visa issuance.",
          "If the application is approved and all required processing is complete, the parent will receive instructions about passport return and visa use. If additional documentation or administrative processing is needed, the consular post will provide instructions.",
          "Do not make irreversible travel or financial commitments until the immigrant visa has been issued and the parent has reviewed its validity and entry instructions.",
          "After the parent enters the United States using the immigrant visa, they generally become a lawful permanent resident. The physical green card is then produced and delivered according to the applicable procedures.",
        ],
      },
      {
        id: "timeline",
        h2: "How Long Does the IR-5 Visa Process Take?",
        paragraphs: [
          "There is no single timeline that applies to every IR-5 case.",
          "The total process can depend on:",
        ],
        bulletList: [
          "USCIS petition processing.",
          "How quickly the petitioner and parent complete required steps.",
          "Whether the NVC requests corrections or additional documents.",
          "The availability of interview appointments at the relevant embassy or consulate.",
          "Medical, security, or administrative processing requirements.",
        ],
        callout: {
          type: "info",
          title: "Monitoring Official Updates",
          text: "The IR-5 category is not subject to the annual numerical limits that affect many family-preference categories. However, that does not eliminate the time required to review petitions and complete consular processing. Rather than relying on a fixed number of months, monitor official case updates and use the appropriate government tools for current processing information. If your parent is applying through Islamabad, consult the current instructions for that post.",
        },
      },
      {
        id: "common-mistakes",
        h2: "Common Mistakes to Avoid",
        paragraphs: [
          "Even when the family relationship is straightforward, missing details can create avoidable delays.",
        ],
        bulletList: [
          "Submitting incomplete financial evidence. Review the current Affidavit of Support requirements, household size, and applicable income threshold before submitting the financial package.",
          "Assuming one petition covers both parents. Each parent generally needs a separate I-130 petition and their own immigrant visa application.",
          "Ignoring document inconsistencies. Differences in spelling, dates, names, or other biographical information should be addressed appropriately rather than overlooked.",
          "Using outdated checklists. Embassy instructions, forms, fees, and document requirements can change. Confirm the current requirements before each major stage.",
          "Making travel plans too early. A petition approval or interview appointment is not the same as an issued immigrant visa. Wait until the visa is issued before making permanent commitments.",
          "Treating every case as identical. Prior marriages, adoption, missing civil records, previous immigration issues, and other individual circumstances can affect what evidence or legal guidance is needed.",
        ],
      },
      {
        id: "next-steps",
        h2: "Make the Immigration Process Easier to Navigate",
        paragraphs: [
          "Bringing a parent to the United States can involve months of paperwork, coordination, and waiting. For families managing the process across countries, keeping documents organized and understanding what comes next can make the experience less overwhelming.",
          "Rahvana is building tools to help families navigate complex immigration processes with clearer guidance and more organized preparation. If you are preparing for a family-based immigration journey, explore [Rahvana](https://www.rahvana.com/) to learn more about the platform and its resources.",
        ],
        callout: {
          type: "info",
          title: "Legal Disclaimer",
          text: "This article is for general informational purposes only and is not legal advice. Immigration requirements, government fees, processing procedures, and embassy instructions can change. Always confirm current requirements through USCIS, the U.S. Department of State, and the relevant U.S. embassy or consulate. Consider consulting a qualified immigration attorney about complex or case-specific issues.",
        },
      },
    ],
    faqs: [
      {
        question: "Can a green card holder sponsor their parents?",
        answer:
          "No. The IR-5 category is for parents sponsored by U.S. citizens who are at least 21 years old. A lawful permanent resident cannot petition for a parent through this category.",
      },
      {
        question: "Can I sponsor both of my parents?",
        answer:
          "Yes, if both qualify. You generally must file a separate Form I-130 for each parent, and each parent completes their own immigrant visa process.",
      },
      {
        question: "Can my parent bring their spouse on the same IR-5 petition?",
        answer:
          "No. A parent's spouse does not automatically qualify as a derivative beneficiary under the IR-5 petition. The spouse would need to qualify through an appropriate separate immigration pathway.",
      },
      {
        question: "Does an approved I-130 mean my parent will receive a green card?",
        answer:
          "No. Approval establishes the qualifying family relationship for the petition, but the parent must still complete the immigrant visa process and meet the applicable eligibility and admissibility requirements.",
      },
      {
        question: "Can my parents visit the United States while the IR-5 case is pending?",
        answer:
          "A pending immigrant petition does not automatically prevent someone from applying for a temporary visitor visa. However, a visitor visa has separate requirements, and the applicant must qualify for the requested temporary visit. A visa or entry is never guaranteed.",
      },
      {
        question: "Is the IR-5 visa only for parents living in Pakistan?",
        answer:
          "No. The IR-5 is available to eligible parents regardless of their country of residence, subject to the applicable immigration requirements and consular processing procedures. The civil documents and interview instructions will depend in part on the country handling the case.",
      },
    ],
    cta: {
      headline: "Make Your Parents' IR-5 Visa Journey Seamless",
      description:
        "Track Form I-130 filings, organize civil documents, and prepare for consular processing with Rahvana's guided immigration roadmaps.",
      buttonText: "Check Your Visa Eligibility →",
      buttonHref: "/visa-eligibility",
      badge: "Family Immigration Roadmap",
    },
    // midArticleCta: {
    //   badge: "Document Preparation",
    //   headline: "Organize Civil Documents Before NVC Submission",
    //   description:
    //     "Ensure birth certificates, NADRA records, and translations meet consular requirements before uploading to CEAC. Included with any Rahvana Journey Plan.",
    //   buttonText: "Explore Document Vault →",
    //   buttonHref: "/document-vault",
    // },
    sidebarCta: {
      title: "Sponsoring Your Parents?",
      description: "Book a strategy consultation with our U.S. visa case managers.",
      buttonText: "Book Consultation →",
      buttonHref: "/book-consultation",
    },
    showSocialShare: true,
    showTableOfContents: true,
    showFaqs: true,
    relatedSlugs: ["ir1-vs-cr1-visa-difference-pakistan", "221g-visa-refusal-ir1-cr1-spouse-visa"],
  },
  {
    id: "art-003",
    slug: "221g-visa-refusal-ir1-cr1-spouse-visa",
    title: "221(g) Visa Refusal: What It Means for Your IR-1 or CR-1 Spouse Visa",
    bluf: "A Section 221(g) visa refusal does not automatically mean your immigrant visa is permanently denied; it means the consular officer cannot establish eligibility at this stage due to missing documents or required administrative processing. What happens next depends on the specific instructions provided on your refusal notice.",
    description:
      "Received a 221(g) refusal after your U.S. visa interview? Learn what it means, why it happens, and how to understand your next steps—especially if you're applying for a spousal visa from Pakistan.",
    category: "Consular Interview & 221(g)",
    author: {
      name: "Rahvana Legal Research & Consular Strategy Team",
      title: "Senior U.S. Consular Immigration Strategists",
    },
    publishedAt: "2026-10-20",
    updatedAt: "2026-10-30",
    readTime: "9 min read",
    keywords: [
      "221g visa refusal",
      "221g refusal Pakistan",
      "IR-1 221g administrative processing",
      "CR-1 221g Islamabad",
      "221g yellow slip Islamabad",
      "US Embassy Islamabad 221g refusal",
      "CEAC refused administrative processing",
      "221g missing documents checklist",
      "how long does 221g take Pakistan",
      "spouse visa 221g next steps",
    ],
    heroImage: "/assets/images/blog/blog-hero-image.png",
    heroImageAlt: "221(g) Visa Refusal: What It Means for Your IR-1 or CR-1 Spouse Visa",
    tableOfContents: [
      { id: "intro-overview", title: "1. Understanding 221(g) Refusals" },
      { id: "what-is-221g", title: "2. What Is a 221(g) Visa Refusal?" },
      { id: "permanently-denied", title: "3. Does 221(g) Mean Permanent Denial?" },
      { id: "why-refusals-happen", title: "4. Why Do IR-1 and CR-1 Applicants Receive 221(g)?" },
      { id: "what-to-do", title: "5. What Should You Do After Receiving a 221(g)?" },
      { id: "administrative-timeline", title: "6. How Long Does Administrative Processing Take?" },
      { id: "common-misconceptions", title: "7. Common Misconceptions About 221(g)" },
      { id: "next-steps", title: "8. Making an Unfamiliar Process Easier to Navigate" },
      { id: "faq-section", title: "9. Frequently Asked Questions" },
    ],
    sections: [
      {
        id: "intro-overview",
        h2: "Understanding Your 221(g) Refusal Notice",
        paragraphs: [
          "Received a 221(g) refusal after your U.S. visa interview? Learn what it means, why it happens, and how to understand your next steps—especially if you're applying for a spousal visa from Pakistan.",
          "You prepare your documents, complete your medical examination, attend your visa interview, and wait for an answer that could bring you and your spouse closer to living together. Instead, you receive a paper referencing Section 221(g) of U.S. immigration law.",
          "Suddenly, you have more questions than answers.",
          "Does this mean your visa has been denied permanently? Do you need to submit more documents? How long will you have to wait? And if your case is being processed through the U.S. Embassy in Islamabad, what should you do next?",
          "For couples pursuing an IR-1 or CR-1 spousal visa, uncertainty can be especially difficult when every update feels like a step toward—or away from—reuniting with family.",
          "The important thing to understand is that a 221(g) refusal does not automatically mean your visa journey is over. It means the consular officer has not established your eligibility for a visa at that stage. What happens next depends on the reason for the refusal and the instructions you receive.",
          "Understanding that distinction can help you approach the situation with a clearer plan.",
        ],
      },
      {
        id: "what-is-221g",
        h2: "What Is a 221(g) Visa Refusal?",
        paragraphs: [
          "Section 221(g) of the Immigration and Nationality Act allows a consular officer to refuse a visa application when the officer does not yet have all the information needed to determine whether the applicant qualifies.",
          "According to the U.S. Department of State, this can happen for two principal reasons:",
        ],
        bulletList: [
          "Missing information or documentation: The application is incomplete, or additional documents or information are needed.",
          "Administrative processing: The application requires further review before a decision can be made.",
        ],
        callout: {
          type: "info",
          title: "Official U.S. Department of State Guidance",
          text: "These situations are not identical, and they may require different responses. \n\nIf additional documents are required, the consular officer should provide instructions explaining what is needed and how to submit it. If the case requires administrative processing, the applicant generally must wait for that review to be completed. \n\nYou can read the official explanation on the [U.S. Department of State's Visa Denials page](https://travel.state.gov/content/travel/en/us-visas/visa-information-resources/visa-denials.html).",
        },
      },
      {
        id: "permanently-denied",
        h2: "Does a 221(g) mean your visa has been permanently denied?",
        paragraphs: [
          "Not necessarily.",
          "A 221(g) refusal means that your visa has not been issued. In some cases, the officer may reconsider the application after receiving the requested information or completing administrative processing.",
          "However, approval is not guaranteed. After reviewing the additional information, the consular officer may determine that you qualify for the visa or that you remain ineligible.",
          "This is why it is important to understand the specific reason for your refusal rather than assuming that every 221(g) case will have the same outcome.",
        ],
      },
      {
        id: "why-refusals-happen",
        h2: "Why Do IR-1 and CR-1 Applicants Receive 221(g) Refusals?",
        paragraphs: [
          "IR-1 and CR-1 visas allow eligible spouses of U.S. citizens to immigrate to the United States. Although the two categories differ in their treatment of conditional permanent residence, both involve establishing eligibility for an immigrant visa.",
          "A 221(g) refusal can arise at the interview stage for several reasons.",
        ],
      },
      {
        id: "reason-1-documents",
        h3: "1. Additional documents are required",
        paragraphs: [
          "A consular officer may need documents or information that were not available or sufficient at the time of the interview.",
          "For family based immigrant visa applicants, relevant records can include civil documents, financial sponsorship evidence, or other supporting information. The particular request depends on the individual case.",
          "Applicants processing through Islamabad should pay close attention to the embassy’s document instructions. These may specify which original documents, translations, photocopies, or other materials are required.",
          "The embassy’s [official immigrant visa instructions for Pakistan](https://travel.state.gov/content/travel/en/us-visas/Supplements/Supplements_by_Post/ISL-Islamabad.html) explain the general requirements for applicants processing there.",
        ],
        callout: {
          type: "tip",
          title: "Focus on Requested Documents",
          text: "Remember that a 221(g) notice is not a reason to submit every document you can find. Focus on the information actually requested.",
        },
      },
      {
        id: "reason-2-admin-processing",
        h3: "2. Administrative processing is necessary",
        paragraphs: [
          "Some applications require additional review after the interview. This is known as administrative processing.",
          "The review may involve circumstances that the applicant cannot resolve simply by uploading another document. The consular officer will provide relevant instructions, and the case remains pending a final determination.",
          "Administrative processing does not have one guaranteed completion date. The time required varies according to the circumstances of the individual application.",
        ],
      },
      {
        id: "reason-3-clarification",
        h3: "3. Further clarification is needed",
        paragraphs: [
          "The consular officer may need additional information to assess an applicant's eligibility. Depending on the case, the applicant may be asked to clarify information or provide further evidence.",
          "It is important not to assume that a particular question, document, or interview answer automatically causes a 221(g) refusal. Without knowing the details of an individual case, it is impossible to identify the reason with certainty.",
        ],
      },
      {
        id: "what-to-do",
        h2: "What Should You Do After Receiving a 221(g) Refusal?",
        paragraphs: [
          "The most useful first step is to understand exactly what the consular officer has asked you to do.",
          "Rather than relying on another applicant's experience or trying to predict the outcome, work through your own instructions carefully.",
        ],
      },
      {
        id: "step-1-read-notice",
        h3: "Step 1: Read the refusal notice carefully",
        paragraphs: [
          "Keep the notice and review every instruction. Determine whether the embassy has requested specific documents, provided a method for submitting additional information, or indicated that administrative processing is required.",
          "If the instructions are unclear, consult the official guidance or seek clarification through the appropriate channel.",
        ],
      },
      {
        id: "step-2-checklist",
        h3: "Step 2: Make a checklist of outstanding requirements",
        paragraphs: [
          "If documents are requested, list each item individually. Check whether the embassy requires an original, a photocopy, a translation, or a particular submission format.",
          "For applicants in Pakistan, the embassy's instructions are particularly important because civil documents and submission procedures may have specific requirements.",
          "Do not assume that a document accepted in another applicant's case will necessarily satisfy the requirements of yours.",
        ],
      },
      {
        id: "step-3-submit-correctly",
        h3: "Step 3: Submit the requested information correctly",
        paragraphs: [
          "Follow the submission instructions provided by the consular officer.",
          "The U.S. Embassy in Islamabad specifically instructs applicants who must submit additional documents after their interview not to mail them directly to the embassy. Instead, applicants should follow the instructions provided during the interview.",
          "Keep copies of your documents and any available proof of submission. These records can help you track what has been provided if you need to follow up later.",
        ],
      },
      {
        id: "step-4-monitor-case",
        h3: "Step 4: Monitor your case and keep your records organized",
        paragraphs: [
          "Keep your case number, refusal notice, submission confirmations, and relevant correspondence in one place.",
          "You can use the [Consular Electronic Application Center (CEAC)](https://ceac.state.gov/CEACStatTracker/Status.aspx) to check your immigrant visa case status.",
          "A status of “Refused” does not, by itself, explain the full circumstances of your case. A 221(g) case undergoing administrative processing may continue to display that status while the review is underway.",
          "Follow any instructions issued by the embassy, and avoid interpreting a status change—or the absence of one—as a guarantee of the final outcome.",
        ],
      },
      {
        id: "step-5-professional-guidance",
        h3: "Step 5: Seek professional guidance if necessary",
        paragraphs: [
          "If you are unsure how to respond, cannot obtain a requested document, or believe your case involves a more complicated legal issue, consider consulting a qualified U.S. immigration attorney.",
          "A professional may help you understand the applicable requirements and evaluate possible next steps. Be cautious of anyone who guarantees approval or claims to have a way to bypass consular processing.",
        ],
      },
      {
        id: "administrative-timeline",
        h2: "How Long Does 221(g) Administrative Processing Take?",
        paragraphs: [
          "For many couples, the waiting period is the hardest part.",
          "Unfortunately, there is no universal timeline for resolving a 221(g) refusal. The time required depends on the circumstances of the application and the review involved.",
          "Experiences shared in online communities may offer insight into what other applicants have experienced, but they cannot predict when your own case will be resolved. Two applicants interviewed at the same embassy may experience very different timelines.",
          "The Department of State advises applicants to wait at least 180 days from the date of the interview or submission of supplemental documents, whichever is later, before making inquiries about the status of administrative processing. An exception applies to emergency travel involving serious illness, injury, or death in the immediate family.",
          "This guidance concerns inquiries about administrative processing. It does not mean you should delay submitting documents when the embassy has specifically requested them.",
          "For the latest guidance, consult the Department of State's [After the Interview page](https://travel.state.gov/content/travel/en/us-visas/immigrate/the-immigrant-visa-process/step-10-prepare-for-the-interview/step-12-after-the-interview.html).",
          "While waiting, keep your information organized, monitor official communications, and avoid making nonrefundable travel arrangements before your visa is issued.",
        ],
      },
      {
        id: "common-misconceptions",
        h2: "Common Misconceptions About 221(g) Refusals",
        bulletList: [
          "“My visa says refused, so my application is over.” \nNot necessarily. A refusal under Section 221(g) may be followed by further review and reconsideration. The final outcome depends on whether you establish eligibility.",
          "“Administrative processing always takes a few weeks.” \nThere is no guaranteed processing period. Other applicants' experiences are not reliable predictions of your timeline.",
          "“Submitting more documents will make my case move faster.” \nNot necessarily. If the embassy has requested specific documents, follow those instructions. If the case is undergoing administrative processing, sending unsolicited documents may not resolve the outstanding issue.",
          "“If another applicant received their visa, mine should be issued soon too.” \nEach application is assessed individually. Similar circumstances or interview dates do not guarantee similar outcomes.",
          "“I can wait indefinitely before responding to a document request.” \nDo not assume that you have unlimited time. The Department of State states that applicants generally have one year from the date of a 221(g) refusal to submit requested additional information. Failure to provide the information within that period can require a new application and another application fee. Check your specific instructions and applicable requirements.",
        ],
      },
      {
        id: "next-steps",
        h2: "Making an Unfamiliar Process Easier to Navigate",
        paragraphs: [
          "When a visa application is refused under Section 221(g), it can be difficult to know which information to trust or what to do first. Government instructions, document requirements, online discussions, and other applicants' experiences can be scattered across different sources.",
          "The goal is not to predict every possible outcome. It is to understand your instructions, keep your documents organized, and identify the next step that applies to your circumstances.",
          "That is the problem Rahvana is working to address.",
          "Rahvana brings immigration guidance, practical tools, and resources together to help people better understand and organize their immigration journeys. For couples navigating a U.S. spousal visa, having a clearer view of the process can make it easier to manage documents, understand requirements, and keep track of what comes next.",
          "If you are still learning about the spousal visa process, start with our [IR-1 vs. CR-1 Spouse Visa Guide for Pakistan](https://www.rahvana.com/blog/ir1-vs-cr1-visa-difference-pakistan), which explains the differences between the two visa categories and the broader application journey.",
          "You can also explore [Rahvana's immigration resources](https://www.rahvana.com/) for practical guidance and tools.",
          "Your immigration journey may involve uncertainty, but your next step can still be informed.",
        ],
        callout: {
          type: "info",
          title: "Legal Disclaimer",
          text: "This article is for general educational purposes only and is not legal advice. Immigration requirements and procedures may change. Always consult current official government instructions for your individual case. Rahvana is not a law firm and cannot guarantee visa approval or processing times.",
        },
      },
    ],
    faqs: [
      {
        question: "Can a 221(g) refusal happen after an IR-1 or CR-1 interview in Islamabad?",
        answer:
          "Yes. The U.S. Embassy in Islamabad explains that an application may be refused under Section 221(g) when additional documents or administrative processing are required. The reason and next steps depend on the individual case.",
      },
      {
        question: "Should I submit additional documents if the embassy has not requested them?",
        answer:
          "Do not assume that unsolicited documents will help. Follow the instructions in your refusal notice. If you believe important information is missing from your application, seek clarification through the appropriate official channel before deciding how to proceed.",
      },
      {
        question: "Can I contact the embassy to ask about my case?",
        answer:
          "Follow the instructions provided by the embassy and the Department of State's guidance on status inquiries. For cases undergoing administrative processing, the Department of State recommends waiting at least 180 days, subject to the stated emergency exception.",
      },
      {
        question: "Can a 221(g) refusal be overcome?",
        answer:
          "Some 221(g) cases can proceed after the applicant supplies the requested information or the required review is completed. Others may result in a determination that the applicant remains ineligible. The outcome depends on the circumstances of the case.",
      },
      {
        question: "Can anyone guarantee that my visa will be approved?",
        answer:
          "No. An attorney or immigration resource may help you understand the process and prepare a response, but no one can guarantee a consular decision or promise a specific processing time.",
      },
    ],
    cta: {
      headline: "Received a 221(g) or Preparing for Your Consular Interview?",
      description:
        "Organize your missing civil documents, track submission checklists, and practice targeted consular interview questions with Rahvana's guided tools.",
      buttonText: "Explore Interview Preparation →",
      buttonHref: "/interview-prep",
      badge: "221(g) Recovery & Interview Tool",
    },
    sidebarCta: {
      title: "Facing 221(g) Delays?",
      description: "Book a strategy consultation with our U.S. visa case managers.",
      buttonText: "Book Consultation →",
      buttonHref: "/book-consultation",
    },
    showSocialShare: true,
    showTableOfContents: true,
    showFaqs: true,
    relatedSlugs: [
      "ir1-vs-cr1-visa-difference-pakistan",
      "ir5-visa-guide-bring-parents-to-united-states",
    ],
  },
];

export function getArticleBySlug(slug: string): Article | undefined {
  return ARTICLES.find((a) => a.slug === slug);
}

export function getAllArticles(): Article[] {
  return ARTICLES;
}
