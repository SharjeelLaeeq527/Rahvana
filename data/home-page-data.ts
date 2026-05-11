import * as Icons from "lucide-react";
import { Caveat } from "next/font/google";

export const JOURNEYS = [
  // Family & Protection
  {
    category: "Family & Protection",
    code: "IR-1/CR-1",
    title: "Spouse of U.S. Citizen",
    desc: "Bring your spouse to the United States through the immediate relative visa process.",
    icon: Icons.Heart,
    live: true,
  },
  {
    category: "Family & Protection",
    code: "K-1",
    title: "Fiancé(e) Visa",
    desc: "Bring your fiancé(e) to the U.S. to marry within 90 days of arrival.",
    icon: Icons.Briefcase,
    live: false,
  },
  {
    category: "Family & Protection",
    code: "K-3",
    title: "Spouse (short-separation option)",
    desc: "Spouse (short-separation option)",
    icon: Icons.Globe,
    live: false,
  },
  {
    category: "Family & Protection",
    code: "IR-5",
    title: "Parent of U.S. Citizen",
    desc: "Petition for your parent as an immediate relative of a U.S. citizen.",
    icon: Icons.Globe,
    live: false,
  },
  {
    category: "Family & Protection",
    code: "IR-2 / CR-2",
    title: "Child of U.S. Citizen",
    desc: "Child of U.S. Citizen",
    icon: Icons.Globe,
    live: false,
  },
  {
    category: "Family & Protection",
    code: "IR-3 / IR-4",
    title: "Intercountry Adoption",
    desc: "Intercountry Adoption",
    icon: Icons.Globe,
    live: false,
  },
  // Family Preferences
  {
    category: "Family & Protection",
    code: "F-1",
    title: "Adult Child (Unmarried) of U.S. Citizen",
    desc: "Adult Child (Unmarried) of U.S. Citizen",
    icon: Icons.Globe,
    live: false,
  },
  {
    category: "Family & Protection",
    code: "F-2A",
    title: "Spouse/Child of Green Card Holder",
    desc: "Spouse/Child of Green Card Holder",
    icon: Icons.Globe,
    live: false,
  },
  {
    category: "Family & Protection",
    code: "F-2B",
    title: "Adult Child (Unmarried) of Green Card Holder",
    desc: "Adult Child (Unmarried) of Green Card Holder",
    icon: Icons.Globe,
    live: false,
  },
  {
    category: "Family & Protection",
    code: "F-3",
    title: "Adult Child (Married) of U.S. Citizen",
    desc: "Adult Child (Married) of U.S. Citizen",
    icon: Icons.Globe,
    live: false,
  },
  {
    category: "Family & Protection",
    code: "F-4",
    title: "Sibling of U.S. Citizen",
    desc: "Sibling of U.S. Citizen",
    icon: Icons.Globe,
    live: false,
  },
  // Humanitarian
  {
    category: "Family & Protection",
    code: "Refugee",
    title: "Refugee (USRAP)",
    desc: "Refugee (USRAP)",
    icon: Icons.ShieldCheck,
    live: false,
  },
  {
    category: "Family & Protection",
    code: "Asylum",
    title: "Asylum (typically filed in U.S.)",
    desc: "Asylum (typically filed in U.S.)",
    icon: Icons.ShieldCheck,
    live: false,
  },
  {
    category: "Family & Protection",
    code: "Parole",
    title: "Humanitarian Parole (case-by-case)",
    desc: "Humanitarian Parole (case-by-case)",
    icon: Icons.ShieldCheck,
    live: false,
  },

  // Work & Business - Pro Work
  {
    category: "Work & Business",
    code: "H-1B",
    title: "Specialty Occupation",
    desc: "Work in the U.S. in a specialty occupation requiring a bachelor's degree.",
    icon: Icons.Globe,
    live: false,
  },
  {
    category: "Work & Business",
    code: "L-1A / L-1B",
    title: "Company Transfer (Manager / Specialist)",
    desc: "Company Transfer (Manager / Specialist)",
    icon: Icons.Globe,
    live: false,
  },
  // Talent
  {
    category: "Work & Business",
    code: "O-1A / O-1B",
    title: "Extraordinary Talent (Science / Business / Arts)",
    desc: "Extraordinary Talent (Science / Business / Arts)",
    icon: Icons.Globe,
    live: false,
  },
  {
    category: "Work & Business",
    code: "O-2",
    title: "Support Staff for O-1",
    desc: "Support Staff for O-1",
    icon: Icons.Globe,
    live: false,
  },
  // Sports/Arts
  {
    category: "Work & Business",
    code: "P-1 / P-2 / P-3",
    title: "Athlete / Entertainer / Tour Group",
    desc: "Athlete / Entertainer / Tour Group",
    icon: Icons.Activity,
    live: false,
  },
  // Trade / Investment
  {
    category: "Work & Business",
    code: "E-1",
    title: "Treaty Trader",
    desc: "Treaty Trader",
    icon: Icons.Building2,
    live: false,
  },
  {
    category: "Work & Business",
    code: "E-2",
    title: "Treaty Investor",
    desc: "Treaty Investor",
    icon: Icons.Globe,
    live: false,
  },
  // Culture / Faith
  {
    category: "Work & Business",
    code: "R-1",
    title: "Religious Worker",
    desc: "Religious Worker",
    icon: Icons.Heart,
    live: false,
  },
  {
    category: "Work & Business",
    code: "Q-1",
    title: "Cultural Exchange (Work + Culture)",
    desc: "Cultural Exchange (Work + Culture)",
    icon: Icons.Globe,
    live: false,
  },
  // Media
  {
    category: "Work & Business",
    code: "I",
    title: "Journalist / Media",
    desc: "Journalist / Media",
    icon: Icons.Globe,
    live: false,
  },
  // Seasonal
  {
    category: "Work & Business",
    code: "H-2A",
    title: "Seasonal Agriculture (eligibility list applies)",
    desc: "Seasonal Agriculture (eligibility list applies)",
    icon: Icons.Globe,
    live: false,
  },
  {
    category: "Work & Business",
    code: "H-2B",
    title: "Seasonal Non-Agriculture (eligibility list applies)",
    desc: "Seasonal Non-Agriculture (eligibility list applies)",
    icon: Icons.Globe,
    live: false,
  },
  // Training
  {
    category: "Work & Business",
    code: "H-3",
    title: "Trainee / Special Education Exchange",
    desc: "Trainee / Special Education Exchange",
    icon: Icons.Globe,
    live: false,
  },

  // Work Green Cards
  // High Impact
  {
    category: "Work Green Cards",
    code: "EB-1",
    title: "Priority Workers",
    desc: "For persons of extraordinary ability, outstanding researchers, and multinational executives.",
    icon: Icons.Star,
    live: false,
  },
  // Advanced
  {
    category: "Work Green Cards",
    code: "EB-2",
    title: "Advanced Degree / Exceptional Ability",
    desc: "Advanced Degree / Exceptional Ability",
    icon: Icons.Cpu,
    live: false,
  },
  {
    category: "Work Green Cards",
    code: "EB-2 (NIW Path)",
    title: "National Interest Waiver",
    desc: "Self-petition without employer sponsorship based on national interest.",
    icon: Icons.Briefcase,
    live: false,
  },
  // Career
  {
    category: "Work Green Cards",
    code: "EB-3",
    title: "Skilled Worker / Professional",
    desc: "Skilled Worker / Professional",
    icon: Icons.Users,
    live: false,
  },
  // Special
  {
    category: "Work Green Cards",
    code: "EB-4",
    title: "Special Immigrants (varies)",
    desc: "Special Immigrants (varies)",
    icon: Icons.Users,
    live: false,
  },
  // Investment
  {
    category: "Work Green Cards",
    code: "EB-5",
    title: "Investor Green Card",
    desc: "Investor Green Card",
    icon: Icons.Users,
    live: false,
  },
  // Lottery
  {
    category: "Work Green Cards",
    code: "DV",
    title: "Diversity Visa (DV Lottery)",
    desc: "Diversity Visa (DV Lottery)",
    icon: Icons.Users,
    live: false,
  },

  // Students & Visitors
  // Visit
  {
    category: "Students & Visitors",
    code: "B-2",
    title: "Tourism / Family Visit",
    desc: "Tourism / Family Visit",
    icon: Icons.Camera,
    live: false,
  },
  {
    category: "Students & Visitors",
    code: "B-1",
    title: "Business Visitor",
    desc: "Business Visitor",
    icon: Icons.Camera,
    live: false,
  },
  // Study
  {
    category: "Students & Visitors",
    code: "F-1",
    title: "Student Visa",
    desc: "Study at a U.S. academic institution or English language program.",
    icon: Icons.Camera,
    live: false,
  },
  {
    category: "Students & Visitors",
    code: "F-2",
    title: "Student Dependent",
    desc: "Student Dependent",
    icon: Icons.Camera,
    live: false,
  },
  {
    category: "Students & Visitors",
    code: "M-1",
    title: "Vocational / Technical Student",
    desc: "Vocational / Technical Student",
    icon: Icons.Camera,
    live: false,
  },
  {
    category: "Students & Visitors",
    code: "M-2",
    title: "Vocational Dependent",
    desc: "Vocational Dependent",
    icon: Icons.Camera,
    live: false,
  },
  // Exchange
  {
    category: "Students & Visitors",
    code: "J-1",
    title: "Exchange Visitor (Programs)",
    desc: "Exchange Visitor (Programs)",
    icon: Icons.Camera,
    live: false,
  },
  {
    category: "Students & Visitors",
    code: "J-2",
    title: "Exchange Dependent",
    desc: "Exchange Dependent",
    icon: Icons.Camera,
    live: false,
  },
];

export const LIFECYCLE_STEPS = [
  {
    step: 1,
    title: "Create Profile & Start Case",
    icon: Icons.UserPlus,
    desc: "User creates an account, adds basic case details, and opens a dedicated immigration workspace to begin the journey.",
    items: [
      "Sign up and verify account",
      "Add applicant and spouse basics",
      "Set country and embassy context",
      "Open personal immigration workspace",
    ],
  },
  {
    step: 2,
    title: "Select the Correct Journey",
    icon: Icons.Route,
    desc: "User selects the visa pathway and enters a guided roadmap tailored to the selected category.",
    items: [
      "Review available journey options",
      "Choose a visa category",
      "Enter guided roadmap flow",
      "Align process with case goals",
    ],
  },
  {
    step: 3,
    title: "Start the Live IR-1/CR-1 Track",
    icon: Icons.HeartHandshake,
    desc: "Current primary live journey supports IR-1 / CR-1 (Spouse of U.S. Citizen) with structured stage-by-stage execution.",
    items: [
      "Confirm IR-1 / CR-1 eligibility path",
      "View stage-based workflow",
      "Understand immediate priorities",
      "Follow live journey checkpoints",
    ],
  },
  {
    step: 4,
    title: "Use Productivity Tools",
    icon: Icons.Wrench,
    desc: "Users complete tasks faster with built-in tools that support planning, form completion, interview prep, and document formatting.",
    items: [
      "Run case strength checker",
      "Use visa bulletin checker",
      "Prepare with interview prep module",
      "Use PDF/photo/signature tools and form autofill",
    ],
  },
  {
    step: 5,
    title: "Organize Documents Centrally",
    icon: Icons.FolderKanban,
    desc: "Document Vault stores files, notes, and checklist progress in one place to keep the case embassy/NVC ready.",
    items: [
      "Upload and categorize documents",
      "Track checklist completion",
      "Maintain case notes and history",
      "Stay prepared for NVC and embassy review",
    ],
  },
  {
    step: 6,
    title: "Get Expert Support",
    icon: Icons.UserRoundCog,
    desc: "Users can book consultations and request support services such as appointment booking and translation before final submission/interview.",
    items: [
      "Book expert consultation sessions",
      "Request appointment booking help",
      "Use translation and support services",
      "Reduce risk before final interview/submission",
    ],
  },
];

export const FAQS = [
  {
    q: "How does Rahvana help simplify my visa journey?",
    a: "Rahvana acts as your personal digital guide, breaking down the complex U.S. immigration process into clear, manageable steps. We combine expert-level roadmaps (specific to your location) with AI-powered tools to automate paperwork, track timelines, and prepare you for your interview, reducing the stress and uncertainty of doing it alone.",
  },
  {
    q: "Is the Roadmap tailored for the Islamabad Embassy?",
    a: "Yes! Rahvana includes specific guidance for Pakistan, including NADRA document requirements, Union Council registrations, local police certificate procedures, and IOM medical exam details specific to Islamabad, Karachi, and Lahore.",
  },
  {
    q: "Can Rahvana really auto-fill my USCIS forms?",
    a: "Absolutely. Our AI 'Brain' takes your profile data and maps it directly onto official USCIS PDFs like the I-130 and Form I-864, generating a perfectly filled, compliant form in seconds, ready for your review and submission.",
  },
  {
    q: "Does Rahvana provide legal representation?",
    a: "No, Rahvana is an educational AI assistant designed to simplify your journey. While we provide expert-level guidance and tools, we are not a law firm. We always recommend consulting a licensed attorney for complex legal cases.",
  },
  {
    q: "How accurate is the Interview Prep Question Bank?",
    a: "Our bank contains 50+ real-world questions reported from the Islamabad Embassy, with suggested answers and tips on how to present your case honestly and effectively based on successful approval historical data.",
  },
  {
    q: "Is my document data secure in the Vault?",
    a: "Yes. We use bank-level encryption (AES-256) to secure your files. For Free users, progress is stored locally in your browser. Plus users benefit from secure, encrypted cloud synchronization across all devices.",
  },
];

export const heroI130PreviewDisplay = {
  width: 520,
  height: 673,
} as const;
export const heroI130PreviewNatural = {
  width: 1040,
  height: 1346,
} as const;
export const heroAnnotationFont = Caveat({
  subsets: ["latin"],
  weight: ["500", "600"],
});

export const accent = {
  teal: "#0d7377",
  ink: "#162126",
  body: "#2C3A3E",
  dashboard: "#051738",
  chapter1: "#8284BF",
  chapter1Dark: "#4E518C",
  chapter1Tint: "#F0F1FB",
  chapter1Border: "#B9BBE2",
  chapter2: "#520A50",
  chapter2Tint: "#F4E6F3",
  chapter2Border: "#8B4388",
  chapter3: "#051738",
  chapter3Tint: "#E8ECF3",
  chapter3Border: "#31415F",
  rose: "#db8090",
};

export const heroAnnotations = [
  "A smart dashboard keeps your IR-1 journey, progress, and next actions in one place.",
  "Open the chapter you're working on and pick up right where you left off.",
  "Completed steps stay organized, so the next step is always clear.",
  "Built-in tools appear exactly where you need them in the journey.",
  "Simple auto form filling helps you move faster with less manual work.",
  "Review the completed form before moving forward with confidence.",
  "Return to your roadmap with progress updated and your next step ready.",
] as const;

export const chapters = [
  {
    number: 1,
    name: "USCIS Petition Filing",
    description:
      "File Form I-130 with USCIS to begin the IR-1 spouse visa process for your Pakistani spouse.",
    pct: 41,
    color: accent.chapter1,
    border: "border-[#B9BBE2]",
    tint: "bg-[#F0F1FB]",
    text: "text-[#4E518C]",
    steps: [
      ["step_1_1", "Determine Eligibility", "Confirm IR-1 qualification", "done"],
      ["step_1_2", "Gather Required Documents", "Pakistan-specific full checklist", "done"],
      ["step_1_3", "Review Filing Methods", "Online $625 or Paper $675", "current"],
      ["step_1_4", "Fill Form I-130", "via Rahvana wizard", "locked"],
      ["step_1_5", "Fill Form I-130A", "via Rahvana wizard", "locked"],
      ["step_1_8", "Upload Forms & Evidence", "PDF/JPG, 12 MB max", "locked"],
    ],
  },
  {
    number: 2,
    name: "NVC / CEAC Processing",
    description:
      "Pay fees, complete DS-260, prepare civil and financial documents, and track documentary qualification.",
    pct: 28,
    color: accent.chapter2,
    border: "border-[#8B4388]",
    tint: "bg-[#F4E6F3]",
    text: "text-[#520A50]",
    steps: [
      ["step_2_1", "Access CEAC Case", "Secure case details & sign in", "done"],
      ["step_2_2", "Pay NVC Fees", "AOS & IV fee payment", "current"],
      ["step_2_3", "Complete Form DS-260", "Immigrant visa application", "todo"],
      ["step_2_4", "Prepare Civil Documents", "Gather required records", "todo"],
      ["step_2_5", "Affidavit of Support", "Determine and prepare sponsorship", "locked"],
      ["step_2_10", "Record Documentary Qualification", "Record DQ date & activate tracking", "locked"],
    ],
  },
  {
    number: 3,
    name: "Medical + Interview",
    description:
      "Prepare medical clearance, courier registration, original documents, interview readiness, and outcome tracking.",
    pct: 9,
    color: accent.chapter3,
    border: "border-[#31415F]",
    tint: "bg-[#E8ECF3]",
    text: "text-[#051738]",
    steps: [
      ["step_3_1", "Schedule Medical Examination", "Official medical clearance", "current"],
      ["step_3_2", "Obtain Polio Vaccination Certificate", "Required for Pakistan applicants", "todo"],
      ["step_3_3", "Obtain Fresh Police Clearance Certificate", "Required for interview", "todo"],
      ["step_3_6", "Gather Original Documents", "Official document compilation", "todo"],
      ["step_3_7", "Prepare for Interview", "Practice questions and build confidence", "locked"],
      ["step_3_10", "Track Visa Issuance", "Passport delivery and visa issuance", "locked"],
    ],
  },
] as const;

export const milestones = [
  ["Eligibility confirmed", true],
  ["Documents gathered", true],
  ["Filing method selected", true],
  ["I-130 submitted to USCIS", false],
  ["NVC fees paid", false],
  ["DS-260 submitted", false],
  ["Documents submitted to NVC", false],
  ["Documentarily Qualified", false],
  ["Interview scheduled", false],
  ["Visa interview attended", false],
] as const;

export const caseFields = [
  ["Filing method", "Online"],
  ["Receipt number", "Pending"],
  ["NVC case number", "Unavailable"],
  ["NVC invoice ID", "Unavailable"],
  ["DQ date", "Not recorded"],
  ["Interview date", "Not scheduled"],
] as const;
