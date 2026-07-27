// ─── Pricing data — single source of truth for the /pricing page ─────────────
// Keep in sync with lib/entitlements/config.ts (TIER_PRICES, ENTITLEMENTS, ADDON).

export type PlanData = {
  id: string;
  name: string;
  annualPrice: number; // total journey commitment (displayed as "$X total")
  monthlyPrice: number; // monthly billing rate (displayed as "$X/mo")
  price: number; // alias → annualPrice (used by legacy checkout code)
  cta: string;
  recommended: boolean;
  tagline: string;
  bullets: string[];
};

export type VisaCategoryData = {
  id: string;
  label: string;
  plans: PlanData[];
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
const makePlan = (
  id: string,
  name: string,
  annualPrice: number,
  monthlyPrice: number,
  cta: string,
  recommended: boolean,
  tagline: string,
  bullets: string[]
): PlanData => ({
  id,
  name,
  annualPrice,
  monthlyPrice,
  price: annualPrice, // legacy field
  cta,
  recommended,
  tagline,
  bullets,
});

// ─── Default Plans (IR-1/CR-1, IR-5, F-2A, K-1, F-1) ────────────────────────
export const defaultPlans: PlanData[] = [
  makePlan(
    "free",
    "Free",
    0,
    0,
    "Get Started Free",
    false,
    "Explore the journey structure at no cost before committing to a paid plan.",
    [
      "Preview of the full roadmap structure",
      "First-phase checklist overview",
      "Access to free public tools",
      "No payment required to sign up",
    ]
  ),
  makePlan(
    "basic",
    "Basic",
    349,
    29,
    "Choose Basic",
    false,
    "The full self-guided roadmap. Every step visible with checklists and core tools. No hand-holding needed.",
    [
      "Full roadmap: all steps & chapters visible",
      "Checklist engine for your case",
      "Portal wallet (save credentials securely)",
      "Visa Bulletin Monitor & DQ Status Check",
      "PDF Toolkit, Snap & Sign",
      "Basic interview prep",
    ]
  ),
  makePlan(
    "premium",
    "Premium",
    699,
    58,
    "Choose Premium",
    true,
    "Guided confidence. Step-by-step instructions, document vault, tracking, and most productivity tools.",
    [
      "Everything in Basic",
      "Step-by-step guides in every step",
      "Document vault: upload & auto-extract",
      "Tracker & reminders (DQ, interview, case status)",
      "Smart Form Filler (I-130 / I-130A)",
      "Sponsorship Calculator",
      "Rapid Fire interview prep",
      "Medical appointment booking via Rahvana",
      "Civil document guides",
    ]
  ),
  makePlan(
    "executive",
    "Executive",
    1099,
    92,
    "Choose Executive",
    false,
    "Full-suite support for when things get complicated. Expert reviews, 221(g) planning, and more.",
    [
      "Everything in Premium",
      "Case Strength Analyzer",
      "221(g) Action Planner",
      "Mock interview sessions",
      "Expert case review: 2 sessions included",
      "Expert consultation calls: 2 sessions included",
      "PCC filing assistance (Sindh only)",
      "Document translation: 2 documents included",
    ]
  ),
];

// ─── CR-2 Plans (Child of U.S. Citizen — lower price point) ──────────────────
export const CR2Plans: PlanData[] = [
  makePlan(
    "free",
    "Free",
    0,
    0,
    "Get Started Free",
    false,
    "Explore the journey structure at no cost before committing to a paid plan.",
    [
      "Preview of the full roadmap structure",
      "First-phase checklist overview",
      "Access to free public tools",
      "No payment required to sign up",
    ]
  ),
  makePlan(
    "basic",
    "Basic",
    200,
    17,
    "Choose Basic",
    false,
    "The full self-guided roadmap. Every step visible with checklists and core tools.",
    [
      "Full roadmap: all steps & chapters visible",
      "Checklist engine for your case",
      "Portal wallet (save credentials securely)",
      "Visa Bulletin Monitor & DQ Status Check",
      "PDF Toolkit, Snap & Sign",
      "Basic interview prep",
    ]
  ),
  makePlan(
    "premium",
    "Premium",
    500,
    42,
    "Choose Premium",
    true,
    "Guided confidence. Step-by-step instructions, document vault, tracking, and most productivity tools.",
    [
      "Everything in Basic",
      "Step-by-step guides in every step",
      "Document vault: upload & auto-extract",
      "Tracker & reminders (DQ, interview, case status)",
      "Smart Form Filler (I-130 / I-130A)",
      "Sponsorship Calculator",
      "Rapid Fire interview prep",
      "Medical appointment booking via Rahvana",
      "Civil document guides",
    ]
  ),
  makePlan(
    "executive",
    "Executive",
    900,
    75,
    "Choose Executive",
    false,
    "Full-suite support for when things get complicated. Expert reviews, 221(g) planning, and more.",
    [
      "Everything in Premium",
      "Case Strength Analyzer",
      "221(g) Action Planner",
      "Mock interview sessions",
      "Expert case review: 2 sessions included",
      "Expert consultation calls: 2 sessions included",
      "PCC filing assistance (Sindh only)",
      "Document translation: 2 documents included",
    ]
  ),
];

// ─── Visa categories ──────────────────────────────────────────────────────────
export const VISA_CATEGORIES: VisaCategoryData[] = [
  { id: "IR-1 / CR-1", label: "IR-1 / CR-1 · Spouse Visa", plans: defaultPlans },
  { id: "IR-2 / CR-2", label: "IR-2 / CR-2 · Child of U.S. Citizen", plans: CR2Plans },
  { id: "IR-5", label: "IR-5 · Parent of U.S. Citizen", plans: defaultPlans },
  { id: "F-2A", label: "F-2A · Spouse / Child of Permanent Resident", plans: defaultPlans },
  { id: "K-1 / K-2", label: "K-1 / K-2 · Fiancé Visa", plans: defaultPlans },
  { id: "F-1", label: "F-1 · Student Visa", plans: defaultPlans },
];

// ─── Helper cards ─────────────────────────────────────────────────────────────
export const HELPER_DATA = [
  {
    title: "The confident self-starter",
    copy: "You want structure and automation. You'll drive the process yourself, no hand-holding needed.",
    plan: "basic",
  },
  {
    title: "The guided applicant",
    copy: "You want step-by-step instructions, document tracking, and productivity tools throughout your journey.",
    plan: "premium",
  },
  {
    title: "The full-support seeker",
    copy: "You want everything Premium offers, plus expert reviews, 221(g) planning, and concierge-level coverage.",
    plan: "executive",
  },
];

// ─── Comparison table (matches config.ts exactly) ────────────────────────────
//
// Cell values:
//   "Included"     → green checkmark
//   "—"            → dash (locked, upgrade required, not purchasable)
//   "Add On · $X"  → amber badge (purchasable as standalone)
//   "2 included"   → neutral badge (limited inclusion)
//   "Unlimited"    → green badge
//   "Not Included" → red × (hard no)
//
export const COMPARISON_GROUPS = [
  {
    label: "Core Journey Platform",
    rows: [
      ["Full visa roadmap: all chapters & steps", "Included", "Included", "Included"],
      ["Checklist engine for your case", "Included", "Included", "Included"],
      ["Step-by-step guides in every step", "", "Included", "Included"],
      ["Document vault: upload & auto-extract", "", "Included", "Included"],
      ["Tracker & reminders", "", "Included", "Included"],
    ],
  },
  {
    label: "Tools: Included in All Paid Plans",
    rows: [
      ["Portal Wallet (credential storage)", "Included", "Included", "Included"],
      ["Visa Bulletin Monitor", "Included", "Included", "Included"],
      ["DQ Status Check", "Included", "Included", "Included"],
      ["PDF Tool Kit", "Included", "Included", "Included"],
      ["Snap & Sign", "Included", "Included", "Included"],
      ["Basic Interview Prep", "Included", "Included", "Included"],
    ],
  },
  {
    label: "Tools: Premium Upgrades (Add-on for Basic)",
    rows: [
      ["Rapid Fire Interview Prep", "", "Included", "Included"],
      ["Smart Form Filler (I-130 / I-130A)", "", "Included", "Included"],
      ["Sponsorship Calculator", "", "Included", "Included"],
      ["Photo Booth", "", "2 included", "Unlimited"],
      ["Medical Appointment Booking", "Add On · $5", "Included", "Included"],
      ["Civil Document Guides", "", "Included", "Included"],
    ],
  },
  {
    label: "Tools: Executive Only (Add-on for Basic & Premium)",
    rows: [
      ["Case Strength Analyzer", "", "", "Included"],
      ["221(g) Action Planner", "", "", "Included"],
      ["Mock Interview", "", "", "Included"],
    ],
  },
  {
    label: "Reviews & Support",
    rows: [
      ["Expert Case Review", "", "", "2 included"],
      ["Expert Consultation", "", "", "2 included"],
    ],
  },
  {
    label: "Services",
    rows: [
      ["PCC Filing (Sindh Only)", "Add On · $25", "Add On · $25", "Included"],
      ["Document Translation", "", "", "2 included"],
      // ["Dedicated Case Manager",                    "—",             "—",             "—"],
    ],
  },
];

// ─── Add-on catalog (purchasable items; matches ADDON in config.ts) ───────────
// NOT included: pdf_toolkit and snap_sign (included in Basic+).
// Medical Appointment Booking and PCC Filing (Sindh) are also sold as standalone
// service add-ons here, in addition to being bundled into Premium / Executive.
export const ADDONS = [
  {
    id: "221g",
    kind: "tools",
    title: "221(g) Action Planner",
    price: 199,
    unit: "one-time",
    copy: "Step-by-step next moves after 221(g) or Administrative Processing. Includes a personalised action roadmap.",
    note: "Expires at the end of your visa journey",
  },
  // Temporarily hidden — Case Strength Analyzer add-on commented out.
  // {
  //   id: "case-strength",
  //   kind: "tools",
  //   title: "Case Strength Analyzer",
  //   price: 49,
  //   unit: "one-time",
  //   copy: "Instant AI case strength score with flagged gaps to fix before NVC review or your embassy interview.",
  //   note: "Valid for one full case analysis",
  // },
  {
    id: "interview-prep",
    kind: "tools",
    title: "Interview Prep",
    price: 200,
    unit: "one-time",
    copy: "Personalized interview preparation with guided questions, answer building, rapid-fire practice, and mock interview simulations.",
    note: "Three interview preparation modes included",
  },
  {
    id: "photo",
    kind: "tools",
    title: "Photo Booth",
    price: 15,
    unit: "per photo",
    copy: "Make a fully compliant biometric passport or visa photo in minutes, no studio visit needed.",
    note: "One compliant photo output per credit",
  },
  {
    id: "smart",
    kind: "tools",
    title: "Smart Form Filler",
    price: 39,
    unit: "per form",
    copy: "Auto-fills your official USCIS form from your profile data and generates a ready-to-upload PDF.",
    note: "One completed form per credit",
  },
  {
    id: "sponsor",
    kind: "tools",
    title: "Sponsorship Calculator",
    price: 15,
    unit: "one-time",
    copy: "Checks your income and assets against the I-864 poverty guidelines and tells you exactly what you still need.",
    note: "Unlimited recalculations for your case",
  },
  {
    id: "pdf",
    kind: "tools",
    title: "PDF Tool Kit",
    price: 69,
    unit: "one-time",
    copy: "Merge, edit, compress and convert your PDFs in one place, get every document into the exact format the embassy expects.",
    note: "Included free with Basic, Premium & Executive",
  },
  {
    id: "snap",
    kind: "tools",
    title: "Snap & Sign",
    price: 5,
    unit: "per signature",
    copy: "Snap a photo of your handwritten signature and get a clean, background-free digital signature ready to drop into your forms.",
    note: "Included free with Basic, Premium & Executive",
  },
  // Temporarily disabled — service not currently offered.
  // {
  //   id: "doc-review",
  //   kind: "services",
  //   title: "Expert Case Review",
  //   price: 59,
  //   unit: "per request",
  //   copy: "Human review of your application packet with written feedback on completeness, quality, and flagged issues.",
  //   note: "Returned within 2 business days",
  // },
  {
    id: "consultation",
    kind: "services",
    title: "Expert Consultation",
    price: 99,
    unit: "per 30 min",
    copy: "Targeted 30-minute video session with a specialist for situation-specific guidance on your case.",
    note: "Scheduled within 3 business days",
  },
  {
    id: "translate",
    kind: "services",
    title: "Document Translation",
    price: 25,
    unit: "per document",
    copy: "Certified translation with embassy-ready formatting. Covers standard civil documents (CNIC, birth cert, etc.).",
    note: "Delivered within 3 business days",
  },
  {
    id: "medical",
    kind: "services",
    title: "Book Medical Appointment",
    price: 5,
    unit: "per request",
    copy: "We book your panel physician medical exam appointment for you and coordinate the scheduling through Rahvana.",
    note: "One appointment booking per request",
  },
  {
    id: "pcc",
    kind: "services",
    title: "PCC Filing (Sindh Only)",
    price: 25,
    unit: "per request",
    copy: "Done-for-you police character certificate filing for Sindh, handled end-to-end on your behalf.",
    note: "Sindh province only",
  },
  // Temporarily disabled — service not currently offered.
  // {
  //   id: "case-manager",
  //   kind: "services",
  //   title: "Dedicated Case Manager",
  //   price: 300,
  //   unit: "per year",
  //   copy: "A named support contact who follows your case end-to-end, answers questions, and coordinates reviews.",
  //   note: "Available across all plan tiers",
  // },
  // Individual document guides — buyable à la carte so users can add only the
  // one they need. IDs match the entitlement ADDON catalog in lib/entitlements/config.ts.
  {
    id: "guide-passport",
    kind: "guides",
    title: "Passport Guide",
    price: 5,
    unit: "one-time",
    copy: "DGIP roadmap for MRP and ePassport applications, renewals, and lost or damaged cases.",
    note: "Permanent access to the purchased guide",
  },
  {
    id: "guide-police",
    kind: "guides",
    title: "Police Character Certificate Guide",
    price: 5,
    unit: "one-time",
    copy: "Province-wise PCC workflow with required documents, fee tiers, and verification steps.",
    note: "Permanent access to the purchased guide",
  },
  {
    id: "guide-cnic",
    kind: "guides",
    title: "CNIC Guide",
    price: 5,
    unit: "one-time",
    copy: "NADRA CNIC workflow for new issuance, corrections, and replacement or renewal applications.",
    note: "Permanent access to the purchased guide",
  },
  {
    id: "guide-birth-cert",
    kind: "guides",
    title: "Birth Certificate Guide",
    price: 5,
    unit: "one-time",
    copy: "Union Council CBRC process for birth registration, correction, and replacement.",
    note: "Permanent access to the purchased guide",
  },
  {
    id: "guide-frc",
    kind: "guides",
    title: "FRC Guide",
    price: 5,
    unit: "one-time",
    copy: "NADRA process to apply for a Family Registration Certificate and review registered family details.",
    note: "Permanent access to the purchased guide",
  },
  {
    id: "guide-nikah-nama",
    kind: "guides",
    title: "Marriage Registration Guide",
    price: 5,
    unit: "one-time",
    copy: "Nikah Nama registration through Union Council and NADRA MRC issuance with the attestation pathway.",
    note: "Permanent access to the purchased guide",
  },
];

// ─── Service flows ────────────────────────────────────────────────────────────
// Service-kind add-ons are NOT added to the cart like tools/guides. Instead the
// user clicks "Explore" → lands on the service's /resources/[slug] info page →
// then a CTA there sends them to a guided flow page that collects the required
// info and lets them pay at checkout (e.g. /book-consultation). Map each service
// add-on id to its flow route here (single source of truth for card + detail page).
export const SERVICE_FLOW_HREF: Record<string, string> = {
  consultation: "/book-consultation",
  translate: "/document-translation",
  medical: "/book-appointment",
  pcc: "/police-verification/apply?province=Sindh",
};

// Standalone launch targets for the detail-page CTA and the secondary CTA on
// pricing cards. Services resolve through SERVICE_FLOW_HREF above; tools and
// guides point at their live app/guide routes here.
export const RESOURCE_LAUNCH_HREF: Record<string, string> = {
  "221g": "/221g-action-planner",
  "interview-prep": "/interview-prep",
  photo: "/passport",
  smart: "/visa-forms",
  sponsor: "/affidavit-support-calculator",
  pdf: "/pdf-processing",
  snap: "/signature-image-processing",
  consultation: "/book-consultation",
  translate: "/document-translation",
  medical: "/book-appointment",
  pcc: "/police-verification/apply?province=Sindh",
  "guide-passport": "/guides/passport-guide",
  "guide-police": "/guides/police-verification-guide",
  "guide-cnic": "/guides/cnic-guide",
  "guide-birth-cert": "/guides/birth-certificate-guide",
  "guide-frc": "/guides/frc-guide",
  "guide-nikah-nama": "/guides/nikah-nama-guide",
};

export function getResourceLaunchHref(slug: string, kind?: string): string {
  if (kind === "services") {
    return SERVICE_FLOW_HREF[slug] ?? "/book-consultation";
  }
  return RESOURCE_LAUNCH_HREF[slug] ?? `/resources/${slug}`;
}

// ─── FAQs ─────────────────────────────────────────────────────────────────────
export const FAQS: [string, string][] = [
  [
    "How does billing work?",
    "Your Rahvana plan is billed monthly at a fixed rate: $29/mo for Basic, $58/mo for Premium, or $92/mo for Executive. You are committing to the full plan total (e.g. $699 for Premium) which is collected in monthly installments over the life of your journey. You are not charged all at once, but the full amount is your financial commitment.",
  ],
  [
    "Are government fees included?",
    "No. USCIS, NVC, embassy, and medical examination fees are paid separately and are not included in any Rahvana plan. Our platform supports you through the process. It does not cover government-mandated costs.",
  ],
  [
    "Can I upgrade later?",
    "Yes. You can upgrade from Basic to Premium or Executive at any time during your journey. Your existing progress, data, and add-ons carry over, so you only pay the difference.",
  ],
  [
    "What are add-ons and how do they work?",
    "Add-ons are individual tools or services you can purchase on top of your plan. For example, if you're on Basic and need the Smart Form Filler, you can buy it for $39 without upgrading your entire plan. Add-ons are charged once and remain active for your journey.",
  ],
  [
    "Is my data secure?",
    "Yes. We use industry-standard encryption for all data in transit and at rest. Your immigration documents and personal information are never shared with third parties. The Document Vault (Premium+) uses end-to-end encrypted storage.",
  ],
  [
    "Does Rahvana replace an immigration lawyer?",
    "Rahvana provides guided workflows, automation, checklists, and structural reviews to help you navigate the process independently. For highly complex cases (prior visa denials, criminal history, or unusual circumstances), we recommend consulting a licensed immigration attorney.",
  ],
  [
    "How long do I have access after purchasing?",
    "Your plan covers your full immigration journey from the date of purchase. Once purchased, plans cannot be cancelled after the grace period. Please review features carefully before committing. You can upgrade to a higher tier at any time, and your journey data and progress are always preserved.",
  ],
  [
    "Do you offer refunds?",
    "Rahvana significantly improves the accuracy and completeness of your application, but the final visa decision rests with the U.S. government. We cannot offer refunds based on embassy outcomes. For billing issues or technical problems, contact support within 7 days of purchase.",
  ],
];

// ─── Country list ─────────────────────────────────────────────────────────────
export const COUNTRIES = [
  "Afghanistan",
  "Albania",
  "Algeria",
  "Andorra",
  "Angola",
  "Antigua and Barbuda",
  "Argentina",
  "Armenia",
  "Australia",
  "Austria",
  "Azerbaijan",
  "Bahamas",
  "Bahrain",
  "Bangladesh",
  "Barbados",
  "Belarus",
  "Belgium",
  "Belize",
  "Benin",
  "Bhutan",
  "Bolivia",
  "Bosnia and Herzegovina",
  "Botswana",
  "Brazil",
  "Brunei",
  "Bulgaria",
  "Burkina Faso",
  "Burundi",
  "Cabo Verde",
  "Cambodia",
  "Cameroon",
  "Canada",
  "Central African Republic",
  "Chad",
  "Chile",
  "China",
  "Colombia",
  "Comoros",
  "Congo (Congo-Brazzaville)",
  "Costa Rica",
  "Croatia",
  "Cuba",
  "Cyprus",
  "Czechia",
  "Denmark",
  "Djibouti",
  "Dominica",
  "Dominican Republic",
  "Ecuador",
  "Egypt",
  "El Salvador",
  "Equatorial Guinea",
  "Eritrea",
  "Estonia",
  "Eswatini",
  "Ethiopia",
  "Fiji",
  "Finland",
  "France",
  "Gabon",
  "Gambia",
  "Georgia",
  "Germany",
  "Ghana",
  "Greece",
  "Grenada",
  "Guatemala",
  "Guinea",
  "Guinea-Bissau",
  "Guyana",
  "Haiti",
  "Honduras",
  "Hungary",
  "Iceland",
  "India",
  "Indonesia",
  "Iran",
  "Iraq",
  "Ireland",
  "Israel",
  "Italy",
  "Jamaica",
  "Japan",
  "Jordan",
  "Kazakhstan",
  "Kenya",
  "Kiribati",
  "Kuwait",
  "Kyrgyzstan",
  "Laos",
  "Latvia",
  "Lebanon",
  "Lesotho",
  "Liberia",
  "Libya",
  "Liechtenstein",
  "Lithuania",
  "Luxembourg",
  "Madagascar",
  "Malawi",
  "Malaysia",
  "Maldives",
  "Mali",
  "Malta",
  "Marshall Islands",
  "Mauritania",
  "Mauritius",
  "Mexico",
  "Micronesia",
  "Moldova",
  "Monaco",
  "Mongolia",
  "Montenegro",
  "Morocco",
  "Mozambique",
  "Myanmar (Burma)",
  "Namibia",
  "Nauru",
  "Nepal",
  "Netherlands",
  "New Zealand",
  "Nicaragua",
  "Niger",
  "Nigeria",
  "North Korea",
  "North Macedonia",
  "Norway",
  "Oman",
  "Pakistan",
  "Palau",
  "Palestine State",
  "Panama",
  "Papua New Guinea",
  "Paraguay",
  "Peru",
  "Philippines",
  "Poland",
  "Portugal",
  "Qatar",
  "Romania",
  "Russia",
  "Rwanda",
  "Saint Kitts and Nevis",
  "Saint Lucia",
  "Saint Vincent and the Grenadines",
  "Samoa",
  "San Marino",
  "Sao Tome and Principe",
  "Saudi Arabia",
  "Senegal",
  "Serbia",
  "Seychelles",
  "Sierra Leone",
  "Singapore",
  "Slovakia",
  "Slovenia",
  "Solomon Islands",
  "Somalia",
  "South Africa",
  "South Korea",
  "South Sudan",
  "Spain",
  "Sri Lanka",
  "Sudan",
  "Suriname",
  "Sweden",
  "Switzerland",
  "Syria",
  "Tajikistan",
  "Tanzania",
  "Thailand",
  "Timor-Leste",
  "Togo",
  "Tonga",
  "Trinidad and Tobago",
  "Tunisia",
  "Turkey",
  "Turkmenistan",
  "Tuvalu",
  "Uganda",
  "Ukraine",
  "United Arab Emirates",
  "United Kingdom",
  "United States",
  "Uruguay",
  "Uzbekistan",
  "Vanuatu",
  "Vatican City",
  "Venezuela",
  "Vietnam",
  "Yemen",
  "Zambia",
  "Zimbabwe",
];
