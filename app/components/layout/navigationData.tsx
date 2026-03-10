import React from "react";
import {
  Heart,
  Briefcase,
  Globe,
  ShieldCheck,
  Activity,
  Building2,
  Star,
  Cpu,
  Users,
  Camera,
  Shield,
  FileText,
  Syringe,
  MessageSquare,
  FileUp,
  Brain,
  LifeBuoy,
  Compass,
  Calculator,
  Clock,
  Calendar,
  Files,
  PenTool,
  Wand2,
} from "lucide-react";

export interface NavItem {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
  translationKey?: string;
  // badge?: "Soon" | "Live";
  disabled?: boolean;
}

export interface NavCategory {
  label: string;
  items: NavItem[];
}

export interface NavTab {
  id: string;
  label: string;
  translationKey?: string;
  categories?: NavCategory[]; // For Journeys
  items?: NavItem[]; // For Tools, Guides, Services
}

export interface NavSection {
  id: string;
  label: string; // e.g., "Explore Journeys"
  tabs: NavTab[];
  footerLink?: { label: string; href: string };
  showSearch?: boolean; // For Journeys
}

export const NAV_DATA: Record<string, NavSection> = {
  journeys: {
    id: "journeys",
    label: "Explore Journeys",
    showSearch: true,
    footerLink: {
      label: "Explore all journeys",
      href: "/visa-category/ir-category",
    },
    tabs: [
      {
        id: "family",
        label: "Family & Protection",
        categories: [
          {
            label: "Spouse/Partner",
            items: [
              {
                icon: <Heart className="h-5 w-5" />,
                title: "IR-1 / CR-1",
                description: "Spouse of U.S. Citizen",
                href: "/visa-category/ir-category/ir1-journey",
                // badge: "Live",
              },
              {
                icon: <Briefcase className="h-5 w-5" />,
                title: "K-1",
                description: "Fiancé(e) of U.S. Citizen",
                href: "/visa-category/ir-category",
                // badge: "Soon",
                disabled: true,
              },
              {
                icon: <Globe className="h-5 w-5" />,
                title: "K-3",
                description: "Spouse (short-separation option)",
                href: "#", // No live path
                // badge: "Soon",
                disabled: true,
              },
              {
                icon: <Globe className="h-5 w-5" />,
                title: "IR-5",
                description: "Parent of U.S. Citizen (21+)",
                href: "#",
                // badge: "Soon",
                disabled: true,
              },
              {
                icon: <Globe className="h-5 w-5" />,
                title: "IR-2 / CR-2",
                description: "Child of U.S. Citizen",
                href: "#",
                // badge: "Soon",
                disabled: true,
              },
              {
                icon: <Globe className="h-5 w-5" />,
                title: "IR-3 / IR-4 (and Hague variants)",
                description: "Intercountry Adoption",
                href: "#",
                // badge: "Soon",
                disabled: true,
              },
            ],
          },
          {
            label: "Family Preferences",
            items: [
              {
                icon: <Globe className="h-5 w-5" />,
                title: "F-1",
                description: "Adult Child (Unmarried) of U.S. Citizen",
                href: "#",
                // badge: "Soon",
                disabled: true,
              },
              {
                icon: <Globe className="h-5 w-5" />,
                title: "F-2A",
                description: "Spouse/Child of Green Card Holder",
                href: "#",
                // badge: "Soon",
                disabled: true,
              },
              {
                icon: <Globe className="h-5 w-5" />,
                title: "F-2B",
                description: "Adult Child (Unmarried) of Green Card Holder",
                href: "#",
                // badge: "Soon",
                disabled: true,
              },
              {
                icon: <Globe className="h-5 w-5" />,
                title: "F-3",
                description: "Adult Child (Married) of U.S. Citizen",
                href: "#",
                // badge: "Soon",
                disabled: true,
              },
              {
                icon: <Globe className="h-5 w-5" />,
                title: "F-4",
                description: "Sibling of U.S. Citizen",
                href: "#",
                // badge: "Soon",
                disabled: true,
              },
            ],
          },
          {
            label: "Humanitarian",
            items: [
              {
                icon: <ShieldCheck className="h-5 w-5" />,
                title: "Refugee",
                description: "Refugee (USRAP)",
                href: "#",
                // badge: "Soon",
                disabled: true,
              },
              {
                icon: <ShieldCheck className="h-5 w-5" />,
                title: "Asylum",
                description: "Asylum (typically filed in U.S.)",
                href: "#",
                // badge: "Soon",
                disabled: true,
              },
              {
                icon: <ShieldCheck className="h-5 w-5" />,
                title: "Parole",
                description: "Humanitarian Parole (case-by-case)",
                href: "#",
                // badge: "Soon",
                disabled: true,
              },
            ],
          },
        ],
      },
      {
        id: "work",
        label: "Work & Business",
        categories: [
          {
            label: "Pro Work",
            items: [
              {
                icon: <Globe className="h-5 w-5" />,
                title: "H-1B",
                description: "Specialty Job (Tech / Engineer / Analyst)",
                href: "#",
                // badge: "Soon",
                disabled: true,
              },
              {
                icon: <Globe className="h-5 w-5" />,
                title: "L-1A / L-1B",
                description: "Company Transfer (Manager / Specialist)",
                href: "#",
                // badge: "Soon",
                disabled: true,
              },
            ],
          },
          {
            label: "Talent",
            items: [
              {
                icon: <Globe className="h-5 w-5" />,
                title: "O-1A / O-1B",
                description: "Extraordinary Talent (Science / Business / Arts)",
                href: "#",
                // badge: "Soon",
                disabled: true,
              },
              {
                icon: <Globe className="h-5 w-5" />,
                title: "O-2",
                description: "Support Staff for O-1",
                href: "#",
                // badge: "Soon",
                disabled: true,
              },
            ],
          },
          {
            label: "Sports/Arts",
            items: [
              {
                icon: <Activity className="h-5 w-5" />,
                title: "P-1 / P-2 / P-3",
                description: "Athlete / Entertainer / Tour Group",
                href: "#",
                // badge: "Soon",
                disabled: true,
              },
            ],
          },
          {
            label: "Trade / Investment",
            items: [
              {
                icon: <Building2 className="h-5 w-5" />,
                title: "E-1",
                description: "Treaty Trader",
                href: "#",
                // badge: "Soon",
                disabled: true,
              },
              {
                icon: <Globe className="h-5 w-5" />,
                title: "E-2",
                description: "Treaty Investor",
                href: "#",
                // badge: "Soon",
                disabled: true,
              },
            ],
          },
          {
            label: "Culture / Faith",
            items: [
              {
                icon: <Heart className="h-5 w-5" />,
                title: "R-1",
                description: "Religious Worker",
                href: "#",
                // badge: "Soon",
                disabled: true,
              },
              {
                icon: <Globe className="h-5 w-5" />,
                title: "Q-1",
                description: "Cultural Exchange (Work + Culture)",
                href: "#",
                // badge: "Soon",
                disabled: true,
              },
            ],
          },
          {
            label: "Media",
            items: [
              {
                icon: <Globe className="h-5 w-5" />,
                title: "I",
                description: "Journalist / Media",
                href: "#",
                // badge: "Soon",
                disabled: true,
              },
            ],
          },
          {
            label: "Seasonal (Conditional)",
            items: [
              {
                icon: <Globe className="h-5 w-5" />,
                title: "H-2A",
                description: "Seasonal Agriculture (eligibility list applies)",
                href: "#",
                // badge: "Soon",
                disabled: true,
              },
              {
                icon: <Globe className="h-5 w-5" />,
                title: "H-2B",
                description:
                  "Seasonal Non-Agriculture (eligibility list applies)",
                href: "#",
                // badge: "Soon",
                disabled: true,
              },
            ],
          },
          {
            label: "Training",
            items: [
              {
                icon: <Globe className="h-5 w-5" />,
                title: "H-3",
                description: "Trainee / Special Education Exchange",
                href: "#",
                // badge: "Soon",
                disabled: true,
              },
            ],
          },
        ],
      },
      {
        id: "green-cards",
        label: "Work Green Cards",
        categories: [
          {
            label: "High Impact",
            items: [
              {
                icon: <Star className="h-5 w-5" />,
                title: "EB-1",
                description: "Extraordinary Ability / Top Talent",
                href: "#",
                // badge: "Soon",
                disabled: true,
              },
            ],
          },
          {
            label: "Advanced",
            items: [
              {
                icon: <Cpu className="h-5 w-5" />,
                title: "EB-2",
                description: "Advanced Degree / Exceptional Ability",
                href: "#",
                // badge: "Soon",
                disabled: true,
              },
              {
                icon: <Briefcase className="h-5 w-5" />,
                title: "EB-2 (NIW Path)",
                description: "National Interest Waiver (NIW)",
                href: "#",
                // badge: "Soon",
                disabled: true,
              },
            ],
          },
          {
            label: "Career",
            items: [
              {
                icon: <Users className="h-5 w-5" />,
                title: "EB-3",
                description: "Skilled Worker / Professional",
                href: "#",
                // badge: "Soon",
                disabled: true,
              },
            ],
          },
          {
            label: "Special",
            items: [
              {
                icon: <Users className="h-5 w-5" />,
                title: "EB-4",
                description: "Special Immigrants (varies)",
                href: "#",
                // badge: "Soon",
                disabled: true,
              },
            ],
          },
          {
            label: "Investment",
            items: [
              {
                icon: <Users className="h-5 w-5" />,
                title: "EB-5",
                description: "Investor Green Card",
                href: "#",
                // badge: "Soon",
                disabled: true,
              },
            ],
          },
          {
            label: "Lottery",
            items: [
              {
                icon: <Users className="h-5 w-5" />,
                title: "DV",
                description: "Diversity Visa (DV Lottery)",
                href: "#",
                // badge: "Soon",
                disabled: true,
              },
            ],
          },
        ],
      },
      {
        id: "students",
        label: "Students & Visitors",
        categories: [
          {
            label: "Visit",
            items: [
              {
                icon: <Camera className="h-5 w-5" />,
                title: "B-2",
                description: "Tourism / Family Visit",
                href: "#",
                // badge: "Soon",
                disabled: true,
              },
              {
                icon: <Camera className="h-5 w-5" />,
                title: "B-1",
                description: "Business Visitor",
                href: "#",
                // badge: "Soon",
                disabled: true,
              },
            ],
          },
          {
            label: "Study",
            items: [
              {
                icon: <Camera className="h-5 w-5" />,
                title: "F-1",
                description: "University / College Student",
                href: "#",
                // badge: "Soon",
                disabled: true,
              },
              {
                icon: <Camera className="h-5 w-5" />,
                title: "F-2",
                description: "Student Dependent",
                href: "#",
                // badge: "Soon",
                disabled: true,
              },
              {
                icon: <Camera className="h-5 w-5" />,
                title: "M-1",
                description: "Vocational / Technical Student",
                href: "#",
                // badge: "Soon",
                disabled: true,
              },
              {
                icon: <Camera className="h-5 w-5" />,
                title: "M-2",
                description: "Vocational Dependent",
                href: "#",
                // badge: "Soon",
                disabled: true,
              },
            ],
          },
          {
            label: "Exchange",
            items: [
              {
                icon: <Camera className="h-5 w-5" />,
                title: "J-1",
                description: "Exchange Visitor (Programs)",
                href: "#",
                // badge: "Soon",
                disabled: true,
              },
              {
                icon: <Camera className="h-5 w-5" />,
                title: "J-2",
                description: "Exchange Dependent",
                href: "#",
                // badge: "Soon",
                disabled: true,
              },
            ],
          },
        ],
      },
    ],
  },
  tools: {
    id: "tools",
    label: "Toolbox",
    footerLink: { label: "View all tools", href: "/tools" },
    tabs: [
      {
        id: "ai-planning",
        label: "AI & Planning",
        items: [
          {
            icon: (
              <Brain className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            ),
            title: "Case Strength Analyzer",
            description:
              "Instant AI case strength score + gaps to fix before NVC/Interview.",
            href: "/visa-case-strength-checker",
            // badge: "Live",
          },
          {
            icon: (
              <LifeBuoy className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            ),
            title: "221(g) Action Planner",
            description:
              "Step-by-step next moves after 221(g) or Administrative Processing.",
            href: "/221g-action-planner",
            // badge: "Live",
          },
          {
            icon: (
              <Compass className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            ),
            title: "Visa Path Finder",
            description:
              "Quick quiz that points you to the right visa path + next steps.",
            href: "/visa-eligibility",
            // badge: "Live",
          },
          {
            icon: (
              <MessageSquare className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            ),
            title: "Interview Prep",
            description:
              "Prepare smarter and deliver confident answers when it matters most.",
            href: "/interview-prep",
            // badge: "Live",
          },
        ],
      },
      {
        id: "money-sponsorship",
        label: "Money & Sponsorship",
        items: [
          {
            icon: (
              <Calculator className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            ),
            title: "Sponsorship Calculator",
            description:
              "Auto-check income/assets and tell you what you still need.",
            href: "/affidavit-support-calculator",
          },
        ],
      },
      {
        id: "tracking",
        label: "Tracking",
        items: [
          {
            icon: (
              <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            ),
            title: "DQ Status Check",
            description:
              "Track interview scheduling movement and trends by category.",
            href: "/iv-tool",
          },
          {
            icon: (
              <Calendar className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            ),
            title: "Visa Bulletin Monitor",
            description:
              "Check your priority date progress against the Visa Bulletin.",
            href: "/visa-checker",
            // badge: "Live",
            disabled: false,
          },
        ],
      },
      {
        id: "docs-pdfs",
        label: "Docs & PDFs",
        items: [
          {
            icon: (
              <Camera className="h-5 w-5 text-rose-600 dark:text-rose-400" />
            ),
            title: "Photo Booth",
            description: "Make a compliant passport/visa photo in minutes.",
            href: "/passport",
            // badge: "Live"
          },
          {
            icon: (
              <Files className="h-5 w-5 text-rose-600 dark:text-rose-400" />
            ),
            title: "PDF Tool Kit",
            description:
              "Merge • compress • convert • edit — all in one toolkit.",
            href: "/pdf-processing",
            // badge: "Live",
          },
          {
            icon: (
              <PenTool className="h-5 w-5 text-rose-600 dark:text-rose-400" />
            ),
            title: "Snap & Sign",
            description: "Create a clean digital signature for your forms.",
            href: "/signature-image-processing",
          },
        ],
      },
      {
        id: "forms-automation",
        label: "Forms & Automation",
        items: [
          {
            icon: (
              <Wand2 className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
            ),
            title: "Smart Form Filler",
            description:
              "Auto-fills your official form and generates a ready-to-upload PDF.",
            href: "/visa-forms",
          },
        ],
      },
      // {
      //   id: "storage",
      //   label: "Storage & Organization",
      //   items: [
      //     {
      //       icon: (
      //         <FolderLock className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
      //       ),
      //       title: "Document Vault",
      //       description:
      //         "Organize docs + build shareable packets when the embassy asks.",
      //       href: "/document-vault",
      //     },
      //   ],
      // },
    ],
  },
  guides: {
    id: "guides",
    label: "Guides",
    footerLink: { label: "Browse all guides", href: "/guides" },
    tabs: [
      {
        id: "pakistan-docs",
        label: "Pakistan Docs",
        items: [
          // {
          //   icon: (
          //     <FileText className="h-5 w-5 text-green-600 dark:text-green-400" />
          //   ),
          //   title: "PCC Playbooks (All Provinces)",
          //   description:
          //     "Guides for Sindh, Punjab, KPK, and Balochistan Police Certificates.",
          //   href: "/guides/police-verification-guide",
          // },
          // {
          //   icon: (
          //     <Shield className="h-5 w-5 text-green-600 dark:text-green-400" />
          //   ),
          //   title: "PCC Reference Guide",
          //   description:
          //     "Comprehensive overview of Police Character Certificates.",
          //   href: "/guides/police-certificate",
          // },
          {
            icon: (
              <Globe className="h-5 w-5 text-green-600 dark:text-green-400" />
            ),
            title: "Passport Guide",
            description: "Obtaining or renewing your Pakistani passport.",
            href: "/guides/passport-guide",
            // badge: "Live",
          },
          {
            icon: (
              <FileText className="h-5 w-5 text-green-600 dark:text-green-400" />
            ),
            title: "CNIC Guide",
            description: "Obtaining and renewing your NADRA CNIC.",
            href: "/guides/cnic-guide",
            // badge: "Live",
          },
          {
            icon: (
              <FileText className="h-5 w-5 text-green-600 dark:text-green-400" />
            ),
            title: "Birth Certificate Guide",
            description: "NADRA CRC, B-Form, and birth documentation.",
            href: "/guides/birth-certificate-guide",
          },
          {
            icon: (
              <Globe className="h-5 w-5 text-green-600 dark:text-green-400" />
            ),
            title: "FRC Guide",
            description: "Family Registration Certificate (FRC) guide.",
            href: "/guides/frc-guide",
            // badge: "Live",
          },
          {
            icon: (
              <Heart className="h-5 w-5 text-green-600 dark:text-green-400" />
            ),
            title: "Marriage Certificate Guide",
            description: "Nikahnama and MRC guide.",
            href: "/guides/nikah-nama-guide",
            // badge: "Live",
          },
          // police certificate
          {
            icon: (
              <Shield className="h-5 w-5 text-green-600 dark:text-green-400" />
            ),
            title: "Police Verification Guide",
            description: "How to obtain Police Verification Certificate.",
            href: "/guides/police-verification-guide",
            // badge: "Live",
          },
          // {
          //   icon: <FileCheck className="h-5 w-5" />,
          //   title: "Divorce & Death",
          //   description: "Termination of prior marriages.",
          //   href: "/guides/prior-marriage-termination",
          //   // badge: "Soon",
          //   disabled: true,
          // },
          // {
          //   icon: (
          //     <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
          //   ),
          //   title: "Asset Documentation",
          //   description: "Prove financial standing with correct documents.",
          //   href: "/guides/asset-document-guide",
          // },
          // {
          //   icon: (
          //     <Briefcase className="h-5 w-5 text-green-600 dark:text-green-400" />
          //   ),
          //   title: "Employment Verification",
          //   description: "Employment letters and income proof.",
          //   href: "/guides/employment-certificate-guide",
          // },
        ],
      },
      // {
      //   id: "embassy-logistics",
      //   label: "Embassy Logistics",
      //   items: [
      //     {
      //       icon: <Map className="h-5 w-5 text-blue-600 dark:text-blue-400" />,
      //       title: "Courier & Passport Delivery",
      //       description:
      //         "Register, choose delivery options, and courier guide.",
      //       href: "/guides/courier-registration",
      //     },
      //     {
      //       icon: (
      //         <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
      //       ),
      //       title: "Interview Preparation",
      //       description: "Required documents and what to bring to the embassy.",
      //       href: "/interview-prep",
      //     },
      //   ],
      // },
      // {
      //   id: "financial-sponsorship",
      //   label: "Financial & Sponsorship",
      //   items: [
      //     {
      //       icon: (
      //         <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
      //       ),
      //       title: "Affidavit of Support",
      //       description: "I-864 guide and financial requirements.",
      //       href: "/affidavit-support-calculator",
      //     },
      //   ],
      // },
      {
        id: "medical-exam",
        label: "Medical & Exam",
        items: [
          // {
          //   icon: (
          //     <Activity className="h-5 w-5 text-teal-600 dark:text-teal-400" />
          //   ),
          //   title: "Medical Examination",
          //   description: "Panel physicians and medical requirements.",
          //   href: "/guides/medical-exam",
          //   // badge: "Soon",
          //   disabled: true,
          // },
          {
            icon: (
              <Syringe className="h-5 w-5 text-teal-600 dark:text-teal-400" />
            ),
            title: "Polio Vaccination Guide",
            description: "CDC-required vaccinations and polio certificate.",
            href: "/guides/polio-vaccination-guide",
          },
        ],
      },
      // {
      //   id: "relationship-evidence",
      //   label: "Relationship Evidence",
      //   items: [
      //     {
      //       icon: (
      //         <Heart className="h-5 w-5 text-rose-600 dark:text-rose-400" />
      //       ),
      //       title: "Bona Fide Marriage",
      //       description: "Proof of genuine relationship.",
      //       href: "/guides/bona-marriage-guide",
      //       // badge: "Live",
      //     },
      //   ],
      // },
      // {
      //   id: "arrival-travel",
      //   label: "Arrival & Travel",
      //   items: [
      //     {
      //       icon: (
      //         <FileCheck className="h-5 w-5 text-sky-600 dark:text-sky-400" />
      //       ),
      //       title: "Customs & Declarations",
      //       description: "What to declare and common pitfalls.",
      //       href: "/guides/custom-requirements",
      //     },
      //   ],
      // },
      // {
      //   id: "education-process",
      //   label: "Education & Process",
      //   items: [
      //     {
      //       icon: (
      //         <BookOpen className="h-5 w-5 text-amber-600 dark:text-amber-400" />
      //       ),
      //       title: "Educational Certificates",
      //       description:
      //         "HEC/IBCC attestation, WES evaluation, and I-20 requirements.",
      //       href: "/guides/educational-certificates-us-visa",
      //       // badge: "Live",
      //     },
      //   ],
      // },
      // {
      //   id: "visa-strategy",
      //   label: "Visa Strategy",
      //   items: [
      //     {
      //       icon: (
      //         <GraduationCap className="h-5 w-5 text-violet-600 dark:text-violet-400" />
      //       ),
      //       title: "Visa Case Strength",
      //       description: "Understand your visa case strength and improve it.",
      //       href: "/guides/visa-strength-guide",
      //       // badge: "Live",
      //     },
      //   ],
      // },
    ],
  },
  services: {
    id: "services",
    label: "Services",
    footerLink: { label: "Explore all services", href: "/services" },
    tabs: [
      {
        id: "expert-help",
        label: "Expert Help",
        translationKey: "expertHelp",
        items: [
          {
            icon: (
              <MessageSquare className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            ),
            title: "Book a Consultation",
            translationKey: "bookConsultation",
            description: "Book a call with an expert.",
            href: "/book-consultation",
            disabled: true,
          },
          {
            icon: (
              <Users className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            ),
            title: "Expert Case Review",
            translationKey: "expertCaseReview",
            description:
              "Human review of your documents + a tailored improvement plan.",
            href: "#",
            disabled: true,
            // badge: "Soon",
          },
        ],
      },
      {
        id: "pakistan-docs-services",
        label: "Pakistan Docs",
        translationKey: "pakistanDocsSevices",
        items: [
          {
            icon: (
              <Shield className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            ),
            title: "PCC Filing Service — Sindh",
            translationKey: "pccSindh",
            description: "Done-for-you police certificate filing for Sindh.",
            href: "/police-verification/apply?province=Sindh",
            disabled: true,
            // href: "/guides/police-verification-guide",
            // badge: "Soon",
          },
          {
            icon: (
              <Shield className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            ),
            title: "PCC Filing Service — Punjab (Coming Soon)",
            translationKey: "pccPunjab",
            description:
              "Join the waitlist for done-for-you PCC filing in Punjab.",
            href: "#",
            // badge: "Soon",
            disabled: true,
          },
          {
            icon: (
              <Shield className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            ),
            title: "PCC Filing Service — KPK (Coming Soon)",
            translationKey: "pccKpk",
            description:
              "Join the waitlist for done-for-you PCC filing in KPK.",
            href: "#",
            // badge: "Soon",
            disabled: true,
          },
          {
            icon: (
              <Shield className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            ),
            title: "PCC Filing Service — Balochistan (Coming Soon)",
            translationKey: "pccBalochistan",
            description:
              "Join the waitlist for done-for-you PCC filing in Balochistan.",
            href: "#",
            // badge: "Soon",
            disabled: true,
          },
        ],
      },
      {
        id: "medical",
        label: "Medical",
        translationKey: "medical",
        items: [
          {
            icon: (
              <Heart className="h-5 w-5 text-rose-600 dark:text-rose-400" />
            ),
            title: "Book Medical Appointment",
            translationKey: "bookMedical",
            description: "Book your panel physician medical exam appointment.",
            href: "/book-appointment",
            disabled: true,
            // badge: "Live",
          },
        ],
      },
      {
        id: "documents",
        label: "Documents",
        translationKey: "documents",
        items: [
          {
            icon: (
              <FileUp className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            ),
            title: "Urdu → English Translation",
            translationKey: "urduEnglish",
            description:
              "Request certified translation + formatting for submission.",
            href: "/document-translation",
            disabled: true,
          },
        ],
      },
    ],
  },
};
