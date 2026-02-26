"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Search,
  FileText,
  Shield,
  DollarSign,
  Heart,
  Users,
  Briefcase,
  FileCheck,
  BookOpen,
  ArrowRight,
  GraduationCap,
  Scale,
  Globe,
  Syringe,
  Activity,
  Map,
  // Truck,
  // Truck,
  // Plane,
  ChevronDown,
  LayoutGrid,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// --- Data & Types ---

type GuideCategory =
  | "Pakistan Docs"
  // | "Embassy Logistics"
  // | "Arrival & Travel"
  // | "Financial & Sponsorship"
  | "Medical & Exam"
  // | "Relationship Evidence"
  // | "Education & Process"
  // | "Visa Strategy";

interface Guide {
  id: string;
  title: string;
  description: string;
  category: GuideCategory;
  href: string;
  icon: React.ElementType;
  disabled?: boolean;
  comingSoon?: boolean;
}

const GUIDES: Guide[] = [
  // --- Pakistan Docs ---
  // {
  //   id: "pcc-sindh",
  //   title: "PCC Playbook — Sindh",
  //   description:
  //     "Sindh police certificate guide: requirements, steps, timelines, and common mistakes.",
  //   category: "Pakistan Docs",
  //   href: "/police-verification?province=Sindh",
  //   icon: FileText,
  // },
  // {
  //   id: "pcc-punjab",
  //   title: "PCC Playbook — Punjab",
  //   description: "Punjab police certificate guide (service coming soon).",
  //   category: "Pakistan Docs",
  //   href: "/police-verification?province=Punjab",
  //   icon: Shield,
  // },
  // {
  //   id: "pcc-kpk",
  //   title: "PCC Playbook — KPK",
  //   description: "KPK police certificate guide (service coming soon).",
  //   category: "Pakistan Docs",
  //   href: "/police-verification?province=KPK",
  //   icon: Shield,
  // },
  // {
  //   id: "pcc-balochistan",
  //   title: "PCC Playbook — Balochistan",
  //   description: "Balochistan police certificate guide (service coming soon).",
  //   category: "Pakistan Docs",
  //   href: "/police-verification?province=Balochistan",
  //   icon: Shield,
  // },
  {
    id: "passport",
    title: "Passport Guide",
    description:
      "Complete guide to obtaining or renewing your Pakistani passport.",
    category: "Pakistan Docs",
    href: "/guides/passport-guide",
    icon: Globe,
  },
  // {
  //   id: "pcc-reference",
  //   title: "PCC Reference Guide",
  //   description:
  //     "Comprehensive overview of Police Character Certificates for all provinces.",
  //   category: "Pakistan Docs",
  //   href: "/guides/police-certificate",
  //   icon: Shield,
  // },
  {
    id: "cnic",
    title: "CNIC (National ID)",
    description: "Complete guide to obtaining and renewing your NADRA CNIC.",
    category: "Pakistan Docs",
    href: "/guides/cnic-guide",
    icon: FileText,
  },
  {
    id: "birth-certificate",
    title: "Birth Certificate",
    description: "NADRA CRC, B-Form, and alternative birth documentation.",
    category: "Pakistan Docs",
    href: "/guides/birth-certificate-guide",
    icon: FileText,
  },
  {
    id: "frc",
    title: "FRC Guide",
    description:
      "Complete guide to obtaining your Family Registration Certificate (FRC).",
    category: "Pakistan Docs",
    href: "/guides/frc-guide",
    icon: Globe,
  },
  {
    id: "marriage-certificate",
    title: "Marriage Certificate",
    description: "Nikahnama, MRC, and certified English translations.",
    category: "Pakistan Docs",
    href: "/guides/nikah-nama-guide",
    icon: Heart,
  },
  // {
  //   id: "divorce-death",
  //   title: "Divorce & Death",
  //   description: "Termination of prior marriages documentation.",
  //   category: "Pakistan Docs",
  //   href: "/guides/prior-marriage-termination",
  //   icon: FileCheck,
  //   disabled: true,
  //   comingSoon: true,
  // },
  // {
  //   id: "court-records",
  //   title: "Court & Prison Records",
  //   description: "Obtaining legal records for visa compliance.",
  //   category: "Pakistan Docs",
  //   href: "/guides/court-records",
  //   icon: Scale,
  //   disabled: true,
  //   comingSoon: true,
  // },

  // --- Embassy Logistics ---
  // {
  //   id: "courier-passport",
  //   title: "Courier & Passport Delivery",
  //   description:
  //     "Register, choose delivery options, and troubleshoot common courier issues.",
  //   category: "Embassy Logistics",
  //   href: "/guides/courier-registration",
  //   icon: Map,
  // },
  // {
  //   id: "interview-prep",
  //   title: "Interview Preparation",
  //   description: "Required documents and what to bring to the embassy.",
  //   category: "Embassy Logistics",
  //   href: "/interview-prep", // Tool Link
  //   icon: Users,
  // },
  // {
  //   id: "ds260",
  //   title: "DS-260 Form",
  //   description: "How to complete the online immigrant visa application.",
  //   category: "Embassy Logistics",
  //   href: "/guides/ds260",
  //   icon: Globe,
  //   disabled: true,
  //   comingSoon: true,
  // },

  // --- Arrival & Travel ---
  // {
  //   id: "customs",
  //   title: "Customs & Declarations",
  //   description:
  //     "What to declare, what to avoid, and common pitfalls when traveling.",
  //   category: "Arrival & Travel",
  //   href: "/guides/custom-requirements",
  //   icon: FileCheck,
  // },

  // --- Financial & Sponsorship ---
  // {
  //   id: "asset-docs",
  //   title: "Asset Documentation",
  //   description: "Prove your financial standing with correct asset documents.",
  //   category: "Pakistan Docs",
  //   href: "/guides/asset-document-guide",
  //   icon: DollarSign,
  // },
  // {
  //   id: "employment-verification",
  //   title: "Employment Verification",
  //   description: "Employment letters, paystubs, and income proof.",
  //   category: "Pakistan Docs",
  //   href: "/guides/employment-certificate-guide",
  //   icon: Briefcase,
  // },
  // {
  //   id: "tax-documents",
  //   title: "Tax Transcripts",
  //   description: "IRS tax documents and W-2 forms for sponsorship.",
  //   category: "Financial & Sponsorship",
  //   href: "/guides/tax-documents",
  //   icon: FileText,
  //   disabled: true,
  //   comingSoon: true,
  // },
  // {
  //   id: "affidavit-support",
  //   title: "I-864 Affidavit",
  //   description: "Complete guide to financial sponsorship requirements.",
  //   category: "Financial & Sponsorship",
  //   href: "/affidavit-support-calculator", // Redirect to tool
  //   icon: DollarSign,
  // },

  // --- Medical & Exam ---
  // {
  //   id: "medical-exam",
  //   title: "Medical Examination",
  //   description: "Panel physicians, appointments, and requirements.",
  //   category: "Medical & Exam",
  //   href: "/guides/medical-exam",
  //   icon: Activity,
  //   disabled: true,
  //   comingSoon: true,
  // },
  {
    id: "vaccinations",
    title: "Vaccination Guide",
    description: "CDC-required vaccinations and polio certificate.",
    category: "Medical & Exam",
    href: "/guides/polio-vaccination-guide",
    icon: Syringe,
  },

  // --- Relationship Evidence ---
  // {
  //   id: "relationship-evidence",
  //   title: "Bona Fide Marriage",
  //   description: "Photos, chat logs, and proof of genuine relationship.",
  //   category: "Relationship Evidence",
  //   href: "/guides/bona-marriage-guide",
  //   icon: Heart,
  // },

  // --- Visa Strategy ---
  // {
  //   id: "visa-strength",
  //   title: "Visa Case Strength",
  //   description: "Understand your visa case strength and improve it.",
  //   category: "Visa Strategy",
  //   href: "/guides/visa-strength-guide",
  //   icon: GraduationCap,
  // },
  // {
  //   id: "educational-docs",
  //   title: "Educational Certificates (US Visa)",
  //   description:
  //     "Complete roadmap: HEC/IBCC attestation, WES evaluation, and I-20 requirements.",
  //   href: "/guides/educational-certificates-us-visa",
  //   icon: BookOpen,
  //   category: "Education & Process",
  // },
];

const CATEGORIES: ("All" | GuideCategory)[] = [
  "All",
  "Pakistan Docs",
  // "Embassy Logistics",
  // "Arrival & Travel",
  // "Financial & Sponsorship",
  "Medical & Exam",
  // "Relationship Evidence",
  // "Education & Process",
  // "Visa Strategy",
];

// --- Components ---

export default function GuidesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<
    "All" | GuideCategory
  >("All");
  const [visibleCount, setVisibleCount] = useState(7); // Default to all

  const containerRef = React.useRef<HTMLDivElement>(null);
  const measureRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const calculateVisible = () => {
      if (!containerRef.current || !measureRef.current) return;

      const containerWidth = containerRef.current.clientWidth;
      const measureItems = Array.from(
        measureRef.current.children,
      ) as HTMLDivElement[];

      // Extract the More button width (last item) and Category widths
      const moreButtonEl = measureItems[measureItems.length - 1];
      const categoryEls = measureItems.slice(0, measureItems.length - 1);

      const moreButtonWidth = moreButtonEl.offsetWidth;
      const gap = 12; // gap-3 is 12px (0.75rem)

      let totalWidth = 0;
      let visible = 0;

      // First pass: Check if ALL fit
      for (let i = 0; i < categoryEls.length; i++) {
        const itemWidth = categoryEls[i].offsetWidth;
        const isLast = i === categoryEls.length - 1;
        totalWidth += itemWidth;
        if (!isLast) totalWidth += gap;
      }

      if (totalWidth <= containerWidth) {
        setVisibleCount(CATEGORIES.length);
        return;
      }

      // Second pass: Calculate how many fit WITH "More" button
      totalWidth = 0;

      for (let i = 0; i < categoryEls.length; i++) {
        const itemWidth = categoryEls[i].offsetWidth;
        // Check if adding this item + gap + MoreButton exceeds container
        // Current accumulated + this item + (gap if not first) + gap + MoreButton
        const gapWidth = i > 0 ? gap : 0;
        const projectedWidth =
          totalWidth + gapWidth + itemWidth + gap + moreButtonWidth;

        if (projectedWidth <= containerWidth) {
          visible++;
          totalWidth += gapWidth + itemWidth;
        } else {
          break;
        }
      }

      setVisibleCount(visible);
    };

    calculateVisible();

    // Add resize listener
    const observer = new ResizeObserver(calculateVisible);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const visibleCategories = CATEGORIES.slice(0, visibleCount);
  const hiddenCategories = CATEGORIES.slice(visibleCount);
  const isMoreSelected = hiddenCategories.includes(selectedCategory);

  const filteredGuides = GUIDES.filter((guide) => {
    const matchesSearch =
      guide.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      guide.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "All" || guide.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }).sort((a, b) => a.title.localeCompare(b.title));

  return (
    <div className="min-h-screen bg-background text-foreground font-sans overflow-x-hidden selection:bg-primary selection:text-primary-foreground">
      {/* Ambient Glow */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10">
        <div className="absolute top-[10%] left-[15%] w-[500px] h-[500px] bg-[#0d7377]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-[20%] right-[10%] w-[600px] h-[600px] bg-[#32e0c4]/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Hero Section */}
        <section className="text-center mb-5 md:mb-10 relative">
          <div className="absolute top-0 right-0">
             <Link 
              href="/guides/my-guides"
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-full text-sm font-bold text-slate-600 hover:text-teal-600 hover:border-teal-200 shadow-sm transition-all"
             >
               <LayoutGrid size={16} />
               My Guides
             </Link>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-linear-to-r from-foreground to-muted-foreground animate-fade-up">
            Master the Paperwork.
          </h1>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto animate-fade-up [animation-delay:100ms]">
            Step-by-step guides for every document you need. Clear instructions,
            timelines, and common pitfalls to avoid.
          </p>
        </section>

        {/* Search Bar */}
        <div className="relative max-w-lg mx-auto mb-10 animate-scale-in [animation-delay:200ms]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search guides... (e.g., 'passport', 'police')"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-card border-2 border-border pl-11 pr-4 py-3 rounded-full text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all shadow-sm placeholder:text-muted-foreground"
          />
        </div>

        {/* Categories */}
        <div ref={containerRef} className="relative w-full mb-8 flex justify-center">
          {/* Hidden container for measuring */}
          <div
            ref={measureRef}
            aria-hidden="true"
            className="absolute top-0 left-0 w-full flex flex-wrap gap-3 pointer-events-none opacity-0 z-[-1]"
          >
            {/* Render all categories to measure them */}
            {CATEGORIES.map((cat) => (
              <div
                key={cat}
                className="px-5 py-2.5 text-sm font-medium whitespace-nowrap border"
              >
                {cat}
              </div>
            ))}
            {/* Force render the More button to measure it */}
            <div className="px-5 py-2.5 text-sm font-medium whitespace-nowrap border flex items-center gap-1">
              More <ChevronDown className="w-4 h-4 ml-1" />
            </div>
          </div>

          {/* Visible Container */}
          <div className="flex flex-wrap gap-3 animate-fade-in [animation-delay:300ms]">
            {visibleCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap border transition-all duration-200 ${
                  selectedCategory === cat
                    ? "bg-primary text-primary-foreground border-primary shadow-md"
                    : "bg-card text-muted-foreground border-border hover:border-primary hover:bg-primary/5 hover:text-primary"
                }`}
              >
                {cat}
              </button>
            ))}

            {hiddenCategories.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className={`px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap border transition-all duration-200 flex items-center gap-1 ${
                      isMoreSelected
                        ? "bg-primary text-primary-foreground border-primary shadow-md"
                        : "bg-card text-muted-foreground border-border hover:border-primary hover:bg-primary/5 hover:text-primary"
                    }`}
                  >
                    More <ChevronDown className="w-4 h-4 ml-1" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-[200px]">
                  {hiddenCategories.map((cat) => (
                    <DropdownMenuItem
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`cursor-pointer ${
                        selectedCategory === cat
                          ? "bg-primary/10 text-primary font-semibold"
                          : ""
                      }`}
                    >
                      {cat}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* Guides Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-10 gap-x-6 pt-6">
          {filteredGuides.length > 0 ? (
            filteredGuides.map((guide, index) => (
              <GuideCard key={guide.id} guide={guide} index={index} />
            ))
          ) : (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              No guides found matching your search.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Guide Card Component ---

const CATEGORY_STYLES: Record<
  GuideCategory,
  {
    iconBox: string;
    innerBox: string;
    link: string;
    borderGradient: string;
  }
> = {
  "Pakistan Docs": {
    iconBox: "bg-green-600 text-white border-transparent dark:bg-green-500",
    innerBox: "bg-white/20",
    link: "text-green-600 dark:text-green-400",
    borderGradient:
      "from-green-400 to-green-300 dark:from-green-400 dark:to-green-300",
  },
  // "Embassy Logistics": {
  //   iconBox: "bg-blue-600 text-white border-transparent dark:bg-blue-500",
  //   innerBox: "bg-white/20",
  //   link: "text-blue-600 dark:text-blue-400",
  //   borderGradient:
  //     "from-blue-400 to-blue-300 dark:from-blue-400 dark:to-blue-300",
  // },
  // "Arrival & Travel": {
  //   iconBox: "bg-sky-600 text-white border-transparent dark:bg-sky-500",
  //   innerBox: "bg-white/20",
  //   link: "text-sky-600 dark:text-sky-400",
  //   borderGradient: "from-sky-400 to-sky-300 dark:from-sky-400 dark:to-sky-300",
  // },
  // "Financial & Sponsorship": {
  //   iconBox: "bg-emerald-600 text-white border-transparent dark:bg-emerald-500",
  //   innerBox: "bg-white/20",
  //   link: "text-emerald-600 dark:text-emerald-400",
  //   borderGradient:
  //     "from-emerald-400 to-emerald-300 dark:from-emerald-400 dark:to-emerald-300",
  // },
  "Medical & Exam": {
    iconBox: "bg-teal-600 text-white border-transparent dark:bg-teal-500",
    innerBox: "bg-white/20",
    link: "text-teal-600 dark:text-teal-400",
    borderGradient:
      "from-teal-400 to-teal-300 dark:from-teal-400 dark:to-teal-300",
  },
  // "Relationship Evidence": {
  //   iconBox: "bg-rose-600 text-white border-transparent dark:bg-rose-500",
  //   innerBox: "bg-white/20",
  //   link: "text-rose-600 dark:text-rose-400",
  //   borderGradient:
  //     "from-rose-400 to-rose-300 dark:from-rose-400 dark:to-rose-300",
  // },
  // "Visa Strategy": {
  //   iconBox: "bg-violet-600 text-white border-transparent dark:bg-violet-500",
  //   innerBox: "bg-white/20",
  //   link: "text-violet-600 dark:text-violet-400",
  //   borderGradient:
  //     "from-violet-400 to-violet-300 dark:from-violet-400 dark:to-violet-300",
  // },
  // "Education & Process": {
  //   iconBox: "bg-amber-600 text-white border-transparent dark:bg-amber-500",
  //   innerBox: "bg-white/20",
  //   link: "text-amber-600 dark:text-amber-400",
  //   borderGradient:
  //     "from-amber-400 to-amber-300 dark:from-amber-400 dark:to-amber-300",
  // },
};

function GuideCard({ guide, index }: { guide: Guide; index: number }) {
  const Icon = guide.icon;
  const isClickable = !guide.disabled;
  const CardWrapper = isClickable ? Link : "div";
  const styles = CATEGORY_STYLES[guide.category];

  return (
    <CardWrapper
      href={guide.href}
      className={`group relative flex flex-col bg-card border border-border rounded-[30px] p-6 pt-7 mt-6 
      transition-all duration-400 ease-[cubic-bezier(0.175,0.885,0.32,1.275)] 
      ${
        isClickable
          ? "hover:-translate-y-2 hover:shadow-xl cursor-pointer"
          : "opacity-80 cursor-not-allowed grayscale-[0.5]"
      }
      animate-fade-up`}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Floating Icon Box */}
      <div
        className={`absolute -top-6 left-6 w-14 h-14 rounded-2xl border flex items-center justify-center shadow-md transition-all duration-400 z-10 
        group-hover:-translate-y-1 group-hover:-rotate-3 group-hover:shadow-lg 
        ${styles.iconBox}`}
      >
        {/* Inner colored box for depth */}
        <div
          className={`absolute inset-1 rounded-[10px] -z-10 transition-colors duration-300 ${styles.innerBox}`}
        />
        <Icon className="w-6 h-6 stroke-2" />
      </div>

      {/* Floating Border Gradient (Pseudo-element emulation) */}
      <div
        className={`absolute inset-0 rounded-[30px] p-[2px] bg-linear-to-br ${styles.borderGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-400 pointer-events-none [mask:linear-gradient(#fff_0_0)_content-box,linear-gradient(#fff_0_0)] mask-exclude`}
      />

      {/* Radial Glow Effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-0 bg-[radial-gradient(400px_circle_at_var(--mouse-x,50%)_var(--mouse-y,50%),rgba(13,115,119,0.04),transparent_40%)] dark:bg-[radial-gradient(400px_circle_at_var(--mouse-x,50%)_var(--mouse-y,50%),rgba(255,255,255,0.03),transparent_40%)]" />

      {/* Content */}
      <div className="relative z-10 flex flex-col grow pt-2">
        <h3 className="text-xl font-bold text-foreground mb-1 transition-colors">
          {guide.title}
        </h3>
        <div className="mb-3">
          <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground/80 bg-muted px-2 py-0.5 rounded">
            {guide.category}
          </span>
        </div>
        <p className="text-muted-foreground dark:text-white text-sm leading-relaxed mb-6 grow">
          {guide.description}
        </p>
      </div>

      {/* Footer / Action */}
      <div className="relative z-10 flex items-center justify-between pt-4 border-t border-border mt-auto">
        <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
          {/* Placeholder for stats or extra info if needed */}
        </span>

        {isClickable ? (
          <span
            className={`text-sm font-semibold flex items-center gap-1.5 group-hover:underline decoration-2 underline-offset-2 ${styles.link}`}
          >
            Read Guide <ArrowRight className="w-4 h-4" />
          </span>
        ) : (
          <span className="text-sm font-semibold text-muted-foreground/50 flex items-center gap-1.5 cursor-not-allowed">
            {guide.comingSoon ? "Coming Soon" : "Unavailable"}
          </span>
        )}
      </div>
    </CardWrapper>
  );
}
