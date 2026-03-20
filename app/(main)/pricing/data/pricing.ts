export type PlanData = {
  id: string;
  name: string;
  price: number;
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

export const defaultPlans: PlanData[] = [
  {
    id: "free",
    name: "Signed-in Free",
    price: 0,
    cta: "Get Started Free",
    recommended: false,
    tagline: "Explore the journey structure before committing to paid support.",
    bullets: [
      "Roadmap overview and first-phase checklist",
      "Progress saving in your browser session",
      "Limited toolkit and dashboard access",
      "Guidance previews for core document steps",
    ],
  },
  {
    id: "basic",
    name: "Basic",
    price: 349,
    cta: "Choose Basic",
    recommended: false,
    tagline:
      "Structured self-serve support for applicants who want the full workflow without extra hand-holding.",
    bullets: [
      "Full roadmap and checklist engine",
      "Guided workflows for core form and document preparation",
      "One application completeness review pass",
      "Full analytical tools and standard interview prep",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    price: 699,
    cta: "Choose Premium",
    recommended: true,
    tagline:
      "Guided confidence for users who want stronger review coverage and faster support.",
    bullets: [
      "Everything in Basic",
      "Two structured review passes",
      "One expert review session",
      "Priority support and advanced interview prep",
    ],
  },
  {
    id: "executive",
    name: "Executive",
    price: 1099,
    cta: "Choose Executive",
    recommended: false,
    tagline:
      "Concierge-style support for users who want a more hands-on experience throughout the journey.",
    bullets: [
      "Everything in Premium",
      "Dedicated case manager",
      "Three expert review sessions and mock prep",
      "Expanded coordination and highest support priority",
    ],
  },
];
export const CR2Plans: PlanData[] = [
  {
    id: "free",
    name: "Signed-in Free",
    price: 0,
    cta: "Get Started Free",
    recommended: false,
    tagline: "Explore the journey structure before committing to paid support.",
    bullets: [
      "Roadmap overview and first-phase checklist",
      "Progress saving in your browser session",
      "Limited toolkit and dashboard access",
      "Guidance previews for core document steps",
    ],
  },
  {
    id: "basic",
    name: "Basic",
    price: 200,
    cta: "Choose Basic",
    recommended: false,
    tagline:
      "Structured self-serve support for applicants who want the full workflow without extra hand-holding.",
    bullets: [
      "Full roadmap and checklist engine",
      "Guided workflows for core form and document preparation",
      "One application completeness review pass",
      "Full analytical tools and standard interview prep",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    price: 500,
    cta: "Choose Premium",
    recommended: true,
    tagline:
      "Guided confidence for users who want stronger review coverage and faster support.",
    bullets: [
      "Everything in Basic",
      "Two structured review passes",
      "One expert review session",
      "Priority support and advanced interview prep",
    ],
  },
  {
    id: "executive",
    name: "Executive",
    price: 900,
    cta: "Choose Executive",
    recommended: false,
    tagline:
      "Concierge-style support for users who want a more hands-on experience throughout the journey.",
    bullets: [
      "Everything in Premium",
      "Dedicated case manager",
      "Three expert review sessions and mock prep",
      "Expanded coordination and highest support priority",
    ],
  },
];

export const VISA_CATEGORIES: VisaCategoryData[] = [
  {
    id: "IR-1 / CR-1",
    label: "IR-1 / CR-1 · Spouse Visa",
    plans: defaultPlans,
  },
  {
    id: "IR-2 / CR-2",
    label: "IR-2 / CR-2 · Child of U.S. Citizen",
    plans: CR2Plans,
  },
  {
    id: "IR-5",
    label: "IR-5 · Parent of U.S. Citizen",
    plans: defaultPlans,
  },
  {
    id: "F-2A",
    label: "F-2A · Spouse / Child of Permanent Resident",
    plans: defaultPlans,
  },
  {
    id: "K-1 / K-2",
    label: "K-1 / K-2 · Fiancé Visa",
    plans: defaultPlans,
  },
  {
    id: "F-1",
    label: "F-1 · Student Visa",
    plans: defaultPlans,
  },
];

export const HELPER_DATA = [
  {
    title: "The confident self-starter",
    copy: "You want structure, automation, and one professional checkpoint, but you plan to drive the process yourself.",
    plan: "basic",
  },
  {
    title: "The peace-of-mind applicant",
    copy: "You want more review coverage before important submissions and quicker help when questions come up.",
    plan: "premium",
  },
  {
    title: "The full-support seeker",
    copy: "You want a named point of contact and the strongest white-glove support level available in the product.",
    plan: "executive",
  },
];

export const COMPARISON_GROUPS = [
  {
    label: "Core Journey Platform",
    rows: [
      ["Full visa roadmap", "Limited", "Included", "Included", "Included"],
      ["Checklist engine", "Limited", "Included", "Included", "Included"],
      [
        "Journey timeline and milestone tracker",
        "Not included",
        "Included",
        "Included",
        "Included",
      ],
      ["Document vault", "Limited", "Included", "Included", "Included"],
    ],
  },
  {
    label: "Tools",
    rows: [
      [
        "Guided form and document workflows",
        "Not included",
        "Included",
        "Included",
        "Included",
      ],
      ["PDF toolkit", "Limited", "Included", "Included", "Included"],
      [
        "Application strength assessment",
        "Limited",
        "Included",
        "Included",
        "Included",
      ],
      [
        "Sponsorship and income calculator",
        "Limited",
        "Included",
        "Included",
        "Included",
      ],
      [
        "221(g) action workflow",
        "Not included",
        "1 included",
        "Priority",
        "Priority",
      ],
    ],
  },
  {
    label: "Reviews and Support",
    rows: [
      [
        "Support channel",
        "Standard",
        "Async queue",
        "Priority queue",
        "Dedicated contact",
      ],
      [
        "Application completeness review",
        "Not included",
        "1 included",
        "2 included",
        "3 included",
      ],
      [
        "Expert review session",
        "Not included",
        "Add-on",
        "1 included",
        "3 included",
      ],
      [
        "Mock interview prep",
        "Not included",
        "Add-on",
        "Advanced library",
        "Included",
      ],
    ],
  },
  {
    label: "Services and Credits",
    rows: [
      [
        "Medical appointment assistance",
        "Not included",
        "Add-on",
        "Included",
        "Priority coordination",
      ],
      [
        "Translation benefit",
        "Not included",
        "Add-on",
        "Discounted",
        "Included credit",
      ],
      ["PCC filing support", "Not included", "Add-on", "Add-on", "Included"],
    ],
  },
  {
    label: "Guides and Country Documents",
    rows: [
      [
        "Pakistan civil document guides",
        "Overview",
        "Full set",
        "Full set",
        "Full set",
      ],
      [
        "Embassy-specific prep notes",
        "Not included",
        "Included",
        "Included",
        "Included",
      ],
    ],
  },
];

export const ADDONS = [
  {
    id: "consult",
    title: "Expert Consultation",
    price: 79,
    unit: "per session",
    copy: "Scheduled time with a specialist for situation-specific guidance within platform scope.",
  },
  {
    id: "review",
    title: "Deep Document Review",
    price: 59,
    unit: "per pass",
    copy: "Extra completeness and quality review with written feedback and flagged issues.",
  },
  {
    id: "mock",
    title: "Mock Interview Session",
    price: 49,
    unit: "per session",
    copy: "Live practice session focused on common interview questions and presentation.",
  },
  {
    id: "translation",
    title: "Certified Translation",
    price: 49,
    unit: "per 5 pages",
    copy: "Translation support for civil documents and supporting materials where needed.",
  },
  {
    id: "medical",
    title: "Medical Appointment Help",
    price: 89,
    unit: "one-time",
    copy: "Booking support for the immigration medical exam workflow.",
  },
  {
    id: "pcc",
    title: "PCC Filing Assistance",
    price: 69,
    unit: "one-time",
    copy: "Help navigating Pakistan police clearance certificate steps and document prep.",
  },
];

export const FAQS = [
  [
    "Is this a monthly subscription?",
    "No. The paid tiers here are structured as one-time journey purchases.",
  ],
  [
    "Are government fees included?",
    "No. USCIS, NVC, embassy, and medical fees are paid separately from your Rahvana purchase.",
  ],
  [
    "Can I upgrade later?",
    "Yes. The page is structured so users can move into a higher tier later if needed.",
  ],
  [
    "Why are add-ons on the next step?",
    "Because the plan should stay easy to compare. Extra services only appear after the core plan decision is made.",
  ],
  [
    "Will this structure work for more countries and visa types?",
    "Yes. The selectors and page architecture are designed to scale to more origin countries, destinations, and visa categories.",
  ],
];

export const COUNTRIES = [
  "Afghanistan",
  "Albania",
  "Algeria",
  "Argentina",
  "Australia",
  "Austria",
  "Bangladesh",
  "Belgium",
  "Brazil",
  "Canada",
  "Chile",
  "China",
  "Colombia",
  "Denmark",
  "Egypt",
  "France",
  "Germany",
  "Ghana",
  "Greece",
  "India",
  "Indonesia",
  "Iraq",
  "Ireland",
  "Italy",
  "Japan",
  "Jordan",
  "Kenya",
  "Kuwait",
  "Malaysia",
  "Mexico",
  "Morocco",
  "Nepal",
  "Netherlands",
  "New Zealand",
  "Nigeria",
  "Norway",
  "Oman",
  "Pakistan",
  "Philippines",
  "Poland",
  "Portugal",
  "Qatar",
  "Romania",
  "Saudi Arabia",
  "Singapore",
  "South Africa",
  "South Korea",
  "Spain",
  "Sri Lanka",
  "Sweden",
  "Switzerland",
  "Thailand",
  "Turkey",
  "United Arab Emirates",
  "United Kingdom",
  "United States",
  "Vietnam",
].sort();
