"use client";
import { useState, useEffect } from "react";
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
} from "lucide-react";

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
    officialLink:
      "https://www.uscis.gov/sites/default/files/document/forms/i-130.pdf",
    description:
      "Primary petition to establish family relationship for green card eligibility. Required for most family-based immigration.",
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
    officialLink:
      "https://www.uscis.gov/sites/default/files/document/forms/i-130a.pdf",
    description:
      "Required supplement when petitioning for a spouse. Includes biographical information about the beneficiary spouse.",
  },
  {
    id: "i129f",
    code: "I-129F",
    name: "Petition for Alien Fiancé(e)",
    agency: "USCIS",
    journeys: ["K1"],
    stage: "USCIS Filing",
    category: ["Family-based"],
    keywords: ["fiancé", "fiancee", "k-1", "k1", "engagement"],
    type: "pdf",
    officialLink:
      "https://www.uscis.gov/sites/default/files/document/forms/i-129f.pdf",
    description:
      "Petition for fiancé(e) visa (K-1). Allows fiancé to enter US to marry within 90 days. Marriage must occur before AOS filing.",
  },
  {
    id: "i485",
    code: "I-485",
    name: "Application to Register Permanent Residence or Adjust Status",
    agency: "USCIS",
    journeys: ["AOS"],
    stage: "USCIS Filing",
    category: ["AOS"],
    keywords: [
      "adjustment",
      "status",
      "green card",
      "aos",
      "permanent residence",
    ],
    type: "pdf",
    officialLink:
      "https://www.uscis.gov/sites/default/files/document/forms/i-485.pdf",
    description:
      "Main application for adjustment of status to permanent resident. Filed by beneficiaries already in the US seeking green card.",
  },
  {
    id: "i765",
    code: "I-765",
    name: "Application for Employment Authorization",
    agency: "USCIS",
    journeys: ["AOS", "K1"],
    stage: "USCIS Filing",
    category: ["AOS", "Employment"],
    keywords: ["work permit", "ead", "employment", "authorization", "work"],
    type: "pdf",
    officialLink:
      "https://www.uscis.gov/sites/default/files/document/forms/i-765.pdf",
    description:
      "Application for work authorization (EAD). Can be filed with I-485 for AOS or after K-1 entry and marriage.",
  },
  {
    id: "i131",
    code: "I-131",
    name: "Application for Travel Document",
    agency: "USCIS",
    journeys: ["AOS"],
    stage: "USCIS Filing",
    category: ["AOS", "Travel"],
    keywords: ["advance parole", "travel", "reentry", "ap"],
    type: "pdf",
    officialLink:
      "https://www.uscis.gov/sites/default/files/document/forms/i-131.pdf",
    description:
      "Application for advance parole to travel abroad while AOS is pending. Without this, leaving US can abandon AOS application.",
  },
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
    officialLink:
      "https://www.uscis.gov/sites/default/files/document/forms/i-864.pdf",
    description:
      "Legally binding contract where sponsor agrees to financially support immigrant. Must meet 125% of poverty guidelines.",
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
    officialLink:
      "https://www.uscis.gov/sites/default/files/document/forms/i-864a.pdf",
    description:
      "Used when household member combines income with primary sponsor to meet income requirements.",
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
    officialLink:
      "https://www.uscis.gov/sites/default/files/document/forms/i-864ez.pdf",
    description:
      "Simplified affidavit of support. Can be used when sponsor meets income requirements solely with current employment.",
  },
  {
    id: "i864w",
    code: "I-864W",
    name: "Intending Immigrant's Affidavit of Support Exemption",
    agency: "USCIS",
    journeys: ["IR1-CR1", "IR5", "AOS"],
    stage: "Interview Prep",
    category: ["Financial"],
    keywords: ["exemption", "work credits", "40 quarters", "social security"],
    type: "pdf",
    officialLink:
      "https://www.uscis.gov/sites/default/files/document/forms/i-864w.pdf",
    description:
      "Exemption from affidavit requirement if immigrant has 40 qualifying work quarters under Social Security Act.",
  },
  {
    id: "i134",
    code: "I-134",
    name: "Declaration of Financial Support",
    agency: "USCIS",
    journeys: ["K1"],
    stage: "Interview Prep",
    category: ["Financial"],
    keywords: ["k-1", "fiancé", "support", "financial", "declaration"],
    type: "pdf",
    officialLink:
      "https://www.uscis.gov/sites/default/files/document/forms/i-134.pdf",
    description:
      "Non-binding declaration of financial support for K-1 fiancé visa applicants. Shows ability to support fiancé.",
  },
  {
    id: "i693",
    code: "I-693",
    name: "Report of Medical Examination and Vaccination Record",
    agency: "USCIS",
    journeys: ["AOS"],
    stage: "Interview Prep",
    category: ["AOS", "Medical"],
    keywords: ["medical", "exam", "vaccination", "health", "civil surgeon"],
    type: "pdf",
    officialLink:
      "https://www.uscis.gov/sites/default/files/document/forms/i-693.pdf",
    description:
      "Medical examination by USCIS-approved civil surgeon. Required for AOS applicants. Sealed envelope given to applicant.",
  },
  {
    id: "i751",
    code: "I-751",
    name: "Petition to Remove Conditions on Residence",
    agency: "USCIS",
    journeys: ["IR1-CR1", "AOS", "Naturalization"],
    stage: "Post-Entry",
    category: ["Post-GC"],
    keywords: ["conditional", "remove conditions", "2-year", "marriage"],
    type: "pdf",
    officialLink:
      "https://www.uscis.gov/sites/default/files/document/forms/i-751.pdf",
    description:
      "Required to remove conditions from 2-year conditional green card (marriages under 2 years). File within 90-day window before expiration.",
  },
  {
    id: "n400",
    code: "N-400",
    name: "Application for Naturalization",
    agency: "USCIS",
    journeys: ["Naturalization"],
    stage: "Post-Entry",
    category: ["Naturalization"],
    keywords: ["citizenship", "naturalization", "citizen", "oath"],
    type: "pdf",
    officialLink:
      "https://www.uscis.gov/sites/default/files/document/forms/n-400.pdf",
    description:
      "Application for U.S. citizenship. Can apply 3 years after green card (if married to USC) or 5 years (general).",
  },
  {
    id: "i90",
    code: "I-90",
    name: "Application to Replace Permanent Resident Card",
    agency: "USCIS",
    journeys: ["Naturalization"],
    stage: "Post-Entry",
    category: ["Post-GC"],
    keywords: ["replace", "renew", "green card", "lost", "stolen", "damaged"],
    type: "pdf",
    officialLink:
      "https://www.uscis.gov/sites/default/files/document/forms/i-90.pdf",
    description:
      "Replace or renew permanent resident card. File if card is lost, stolen, damaged, expired, or has incorrect information.",
  },
  {
    id: "ar11",
    code: "AR-11",
    name: "Alien's Change of Address Card",
    agency: "USCIS",
    journeys: ["IR1-CR1", "IR5", "K1", "AOS", "Naturalization"],
    stage: "Post-Entry",
    category: ["Administrative"],
    keywords: ["address", "change", "move", "relocation"],
    type: "online",
    officialLink: "",
    description:
      "All non-citizens must notify USCIS within 10 days of changing address. Can be filed online at uscis.gov.",
  },
  {
    id: "i102",
    code: "I-102",
    name: "Application for Replacement/Initial Nonimmigrant Arrival-Departure Document",
    agency: "USCIS",
    journeys: ["AOS"],
    stage: "Post-Entry",
    category: ["Administrative"],
    keywords: ["i-94", "arrival", "departure", "lost", "replace"],
    type: "pdf",
    officialLink:
      "https://www.uscis.gov/sites/default/files/document/forms/i-102.pdf",
    description:
      "Replace lost or never-received I-94 arrival/departure record. Required for various immigration processes.",
  },
  {
    id: "i407",
    code: "I-407",
    name: "Record of Abandonment of Lawful Permanent Resident Status",
    agency: "USCIS",
    journeys: ["Naturalization"],
    stage: "Post-Entry",
    category: ["Post-GC"],
    keywords: ["abandon", "green card", "surrender", "give up"],
    type: "pdf",
    officialLink:
      "https://www.uscis.gov/sites/default/files/document/forms/i-407.pdf",
    description:
      "Voluntary abandonment of permanent resident status. Used when permanently moving outside US.",
  },

  // ──────────────── USCIS WAIVER FORMS ────────────────
  {
    id: "i601",
    code: "I-601",
    name: "Application for Waiver of Grounds of Inadmissibility",
    agency: "USCIS",
    journeys: ["IR1-CR1", "IR5", "K1", "AOS"],
    stage: "Interview Prep",
    category: ["Waiver"],
    keywords: [
      "waiver",
      "inadmissibility",
      "unlawful presence",
      "extreme hardship",
    ],
    type: "pdf",
    officialLink:
      "https://www.uscis.gov/sites/default/files/document/forms/i-601.pdf",
    description:
      "Waiver for inadmissibility due to unlawful presence, fraud, criminal history, etc. Requires proof of extreme hardship to USC/LPR relative.",
  },
  {
    id: "i601a",
    code: "I-601A",
    name: "Provisional Unlawful Presence Waiver",
    agency: "USCIS",
    journeys: ["IR1-CR1", "IR5"],
    stage: "Interview Prep",
    category: ["Waiver"],
    keywords: ["provisional", "waiver", "unlawful presence", "3/10 year bar"],
    type: "pdf",
    officialLink:
      "https://www.uscis.gov/sites/default/files/document/forms/i-601a.pdf",
    description:
      "Provisional waiver for unlawful presence before consular interview. Allows applicant to wait for approval in US.",
  },
  {
    id: "i212",
    code: "I-212",
    name: "Application for Permission to Reapply for Admission",
    agency: "USCIS",
    journeys: ["IR1-CR1", "IR5", "AOS"],
    stage: "Interview Prep",
    category: ["Waiver"],
    keywords: ["reentry", "deportation", "removal", "previous removal"],
    type: "pdf",
    officialLink:
      "https://www.uscis.gov/sites/default/files/document/forms/i-212.pdf",
    description:
      "Permission to reapply after deportation or removal. Required if previously removed or deported from US.",
  },

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
  {
    id: "ds261",
    code: "DS-261",
    name: "Choice of Address and Agent",
    agency: "DOS",
    journeys: ["IR1-CR1", "IR5"],
    stage: "NVC/CEAC",
    category: ["Consular"],
    keywords: ["nvc", "address", "agent", "choice"],
    type: "online",
    officialLink: "https://ceac.state.gov/iv/",
    description:
      "Form to provide address and agent information to NVC. Completed online through CEAC portal.",
  },
  {
    id: "ds160",
    code: "DS-160",
    name: "Nonimmigrant Visa Application",
    agency: "DOS",
    journeys: ["K1"],
    stage: "NVC/CEAC",
    category: ["Consular"],
    keywords: ["k-1", "nonimmigrant", "visa application", "fiancé"],
    type: "online",
    officialLink: "https://ceac.state.gov/genniv/",
    description:
      "Nonimmigrant visa application for K-1 fiancé visa applicants. Completed online at CEAC.",
  },
  {
    id: "ds5535",
    code: "DS-5535",
    name: "Supplemental Questions for Visa Applicants",
    agency: "DOS",
    journeys: ["IR1-CR1", "IR5", "K1"],
    stage: "Interview Prep",
    category: ["Consular"],
    keywords: [
      "supplemental",
      "additional questions",
      "security check",
      "administrative processing",
    ],
    type: "pdf",
    officialLink: "https://eforms.state.gov/Forms/ds5535.pdf",
    description:
      "Additional questionnaire sometimes requested during administrative processing. Covers detailed travel, employment, and social media history.",
  },
  {
    id: "ds5540",
    code: "DS-5540",
    name: "Affidavit of Support Sponsor's Financial Information",
    agency: "DOS",
    journeys: ["IR1-CR1", "IR5", "K1"],
    stage: "Interview Prep",
    category: ["Financial", "Consular"],
    keywords: ["financial", "sponsor", "income verification"],
    type: "pdf",
    officialLink: "https://eforms.state.gov/Forms/ds5540.pdf",
    description:
      "Supplemental financial information form sometimes requested at consular interviews to verify sponsor income.",
  },
  {
    id: "ds230",
    code: "DS-230",
    name: "Application for Immigrant Visa and Alien Registration",
    agency: "DOS",
    journeys: ["IR1-CR1", "IR5"],
    stage: "Interview Prep",
    category: ["Consular"],
    keywords: ["immigrant visa", "paper application", "legacy"],
    type: "pdf",
    officialLink: "https://eforms.state.gov/Forms/ds230.pdf",
    description:
      "Legacy paper form (replaced by DS-260). Rarely used now but may be needed in special circumstances.",
  },
  {
    id: "ds2001",
    code: "DS-2001",
    name: "Notification of Immigrant Visa Applicant",
    agency: "DOS",
    journeys: ["IR1-CR1", "IR5"],
    stage: "Interview Prep",
    category: ["Consular"],
    keywords: ["notification", "instructions", "interview"],
    type: "pdf",
    officialLink:
      "https://travel.state.gov/content/dam/visas/DS-2001%20--%20Notification%20of%20Applicant%20Ready%20(10-2019).pdf",
    description:
      "Instructions sent by consular section when case is ready for interview scheduling.",
  },

  // ──────────────── CBP FORMS ────────────────
  {
    id: "i94",
    code: "I-94",
    name: "Arrival/Departure Record",
    agency: "CBP",
    journeys: ["IR1-CR1", "IR5", "K1", "AOS"],
    stage: "Port of Entry",
    category: ["Travel", "Administrative"],
    keywords: ["arrival", "departure", "entry", "border", "admission"],
    type: "online",
    officialLink: "https://i94.cbp.dhs.gov/",
    description:
      "Electronic arrival/departure record. Created automatically at port of entry. Can retrieve online at i94.cbp.dhs.gov.",
  },
  {
    id: "cbp6059b",
    code: "CBP Form 6059B",
    name: "Customs Declaration",
    agency: "CBP",
    journeys: ["IR1-CR1", "IR5", "K1"],
    stage: "Port of Entry",
    category: ["Travel"],
    keywords: ["customs", "declaration", "arrival", "goods"],
    type: "pdf",
    officialLink:
      "https://www.cbp.gov/sites/default/files/assets/documents/2019-Mar/CBP%20Form%206059B%20-%20English%20%2803-2019%29_3.pdf",
    description:
      "Customs declaration form completed when entering US. Declares goods being brought into country.",
  },
  {
    id: "i551",
    code: "I-551",
    name: "Permanent Resident Card (Green Card)",
    agency: "CBP",
    journeys: ["IR1-CR1", "IR5", "AOS"],
    stage: "Post-Entry",
    category: ["Post-GC"],
    keywords: ["green card", "permanent resident", "card"],
    type: "action",
    officialLink: "",
    description:
      "The actual green card issued after immigrant visa or AOS approval. Not a fillable form but important document.",
  },

  // ──────────────── SSA FORMS ────────────────
  {
    id: "ss5",
    code: "SS-5",
    name: "Application for a Social Security Card",
    agency: "SSA",
    journeys: ["IR1-CR1", "IR5", "K1", "AOS"],
    stage: "Post-Entry",
    category: ["Post-Entry"],
    keywords: ["social security", "ssn", "card", "number"],
    type: "pdf",
    officialLink: "https://www.ssa.gov/forms/ss-5.pdf",
    description:
      "Application for Social Security Number. Should be applied for soon after entry or when receiving work authorization.",
  },
  {
    id: "ssa7050",
    code: "SSA-7050-F4",
    name: "Request for Social Security Earnings Information",
    agency: "SSA",
    journeys: ["Naturalization"],
    stage: "Post-Entry",
    category: ["Naturalization", "Financial"],
    keywords: ["earnings", "work history", "quarters", "ssa"],
    type: "pdf",
    officialLink: "https://www.ssa.gov/forms/ssa-7050.pdf",
    description:
      "Request detailed earnings history from Social Security Administration. May be needed for I-864W or other purposes.",
  },

  // ──────────────── ADDITIONAL USCIS FORMS ────────────────
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
    officialLink:
      "https://www.uscis.gov/sites/default/files/document/forms/i-912.pdf",
    description:
      "Request to waive filing fees based on financial hardship. Must demonstrate income at or below 150% of Federal Poverty Guidelines.",
  },

  {
    id: "i539",
    code: "I-539",
    name: "Application to Extend/Change Nonimmigrant Status",
    agency: "USCIS",
    journeys: ["K1", "AOS"],
    stage: "USCIS Filing",
    category: ["Status"],
    keywords: ["extend", "change status", "visitor", "tourist", "b2"],
    type: "pdf",
    officialLink:
      "https://www.uscis.gov/sites/default/files/document/forms/i-539.pdf",
    description:
      "Extend or change nonimmigrant status. Used by visitors, students, or other nonimmigrants seeking to extend stay or change category.",
  },
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
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  useEffect(() => {
    if (isMobileFiltersOpen) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }

    // Cleanup when component unmounts
    return () => {
      document.body.classList.remove("overflow-hidden");
    };
  }, [isMobileFiltersOpen]);

  const handleStartForm = (formCode: string): void => {
    const normalized = formCode.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
    window.location.href = `/visa-forms/${normalized}/wizard`;
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
    // 1. Filter by Journey & Stage (Only in Journey View)
    if (currentView === "journey") {
      if (
        currentJourney &&
        form.journeys &&
        !form.journeys.includes(currentJourney)
      )
        return false;

      if (currentStage && form.stage !== currentStage) return false;
    }

    // 2. Filter by Search Query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        form.code.toLowerCase().includes(query) ||
        form.name.toLowerCase().includes(query) ||
        form.description.toLowerCase().includes(query) ||
        (form.agency && form.agency.toLowerCase().includes(query)) ||
        (form.keywords &&
          form.keywords.some((k) => k.toLowerCase().includes(query)));

      if (!matchesSearch) return false;
    }

    // 3. Filter by Agency
    const matchAgency =
      activeFilters.agency.length === 0 ||
      (form.agency && activeFilters.agency.includes(form.agency));

    // 4. Filter by Category
    const matchCategory =
      activeFilters.category.length === 0 ||
      (form.category &&
        form.category.some((cat) => activeFilters.category.includes(cat)));

    return matchAgency && matchCategory;
  }).sort((a, b) => {
    if (currentView === "all") {
      return a.code.localeCompare(b.code);
    }
    return 0;
  });

  return (
    <div className="min-h-screen bg-linear-to-br from-primary/10 via-white to-primary/5">
      <div className="site-main-px site-main-py">
        {/* Header */}
        <div className="text-center mb-8 md:mb-12">
          <div className="inline-flex items-center justify-center w-12 h-12 md:w-16 md:h-16 bg-primary/10 rounded-full mb-4">
            <FileText className="w-6 h-6 md:w-8 md:h-8 text-primary/90" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Immigration Forms Library
          </h1>
          <p className="text-lg md:text-xl text-gray-600 mb-2 max-w-3xl mx-auto">
            Browse all forms organized by your journey stage, or search
            instantly to find exactly what you need.
          </p>
          {/* <p className="text-gray-500 max-w-2xl mx-auto">
            Fill out official U.S. visa forms with helpful guidance at every
            step
          </p> */}
        </div>

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
        <div className="grid lg:grid-cols-[280px_1fr] gap-6 lg:gap-8 items-start">
          {/* Sidebar Filters Mobile Backdrop */}
          {isMobileFiltersOpen && (
            <div
              className="lg:hidden fixed inset-0 z-100 bg-black/50 backdrop-blur-sm transition-opacity"
              onClick={() => setIsMobileFiltersOpen(false)}
            />
          )}

          {/* Sidebar Filters */}
          <aside
            className={`
              w-[280px] sm:w-[320px] lg:w-full space-y-6 lg:self-start lg:sticky lg:top-24 lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto lg:pr-2 lg:overflow-x-hidden custom-scrollbar
              ${
                isMobileFiltersOpen
                  ? "fixed inset-y-0 right-0 z-110 bg-white p-5 shadow-2xl overflow-y-auto"
                  : "hidden lg:block lg:relative lg:z-auto lg:bg-transparent lg:p-0 lg:shadow-none"
              }
            `}
          >
            <div className="bg-white lg:border lg:border-gray-200 lg:rounded-xl lg:shadow-sm lg:p-5 lg:md:p-6">
              {/* Mobile Close Button */}
              <div className="lg:hidden flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                <span className="text-lg font-bold text-gray-900">Filters</span>
                <button
                  onClick={() => setIsMobileFiltersOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-gray-900"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search Filter */}

              {/* Journey Filter (Only in Journey View) */}

              <div className="hidden lg:block text-xs font-extrabold tracking-wider uppercase text-gray-400 mb-5">
                Filters
              </div>
              <div className="mb-6 pb-6 border-b border-gray-100">
                <h3 className="text-sm font-bold text-gray-900 mb-3">
                  Visa Journey
                </h3>
                <div className="flex flex-col gap-2">
                  {[
                    { id: "IR1-CR1", label: "IR-1 / CR-1 (Spouse)" },
                    { id: "IR5", label: "IR-5 (Parent)" },
                    { id: "K1", label: "K-1 (Fiancé)" },
                    { id: "AOS", label: "Adjustment of Status" },
                    { id: "Naturalization", label: "Naturalization" },
                  ].map((journey) => (
                    <button
                      key={journey.id}
                      suppressHydrationWarning
                      onClick={() => {
                        if (currentJourney === journey.id) {
                          setCurrentJourney("");
                        } else {
                          setCurrentJourney(journey.id);
                          setCurrentStage("USCIS Filing");
                        }
                      }}
                      className={`w-full text-left px-4 py-2 text-sm border rounded-full transition-all duration-200 ${
                        currentJourney === journey.id
                          ? "bg-[#0d7377] text-white border-[#0d7377]"
                          : "bg-white text-gray-600 border-gray-200 hover:border-[#0d7377] hover:text-[#0d7377]"
                      }`}
                    >
                      {journey.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Agency Filter */}
              <div className="mb-6 pb-6 border-b border-gray-100 last:border-0 last:pb-0">
                <h3 className="text-sm font-bold text-gray-900 mb-3">Agency</h3>
                <div className="flex flex-col gap-2">
                  {["USCIS", "DOS", "CBP", "SSA"].map((agency) => (
                    <button
                      key={agency}
                      suppressHydrationWarning
                      onClick={() => toggleFilter("agency", agency)}
                      className={`w-full text-left px-4 py-2 text-sm border rounded-full transition-all duration-200 ${
                        activeFilters.agency.includes(agency)
                          ? "bg-[#0d7377] text-white border-[#0d7377]"
                          : "bg-white text-gray-600 border-gray-200 hover:border-[#0d7377] hover:text-[#0d7377]"
                      }`}
                    >
                      {agency}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category Filter */}
              <div className="mb-6">
                <h3 className="text-sm font-bold text-gray-900 mb-3">
                  Category
                </h3>
                <div className="flex flex-col gap-2">
                  {["Family-based", "AOS", "Financial", "Waiver"].map(
                    (category) => (
                      <button
                        key={category}
                        suppressHydrationWarning
                        onClick={() => toggleFilter("category", category)}
                        className={`w-full text-left px-4 py-2 text-sm border rounded-full transition-all duration-200 ${
                          activeFilters.category.includes(category)
                            ? "bg-[#0d7377] text-white border-[#0d7377]"
                            : "bg-white text-gray-600 border-gray-200 hover:border-[#0d7377] hover:text-[#0d7377]"
                        }`}
                      >
                        {category}
                      </button>
                    ),
                  )}
                </div>
              </div>

              {/* Clear Button */}
              {(activeFilters.agency.length > 0 ||
                activeFilters.category.length > 0) && (
                <button
                  onClick={clearFilters}
                  suppressHydrationWarning
                  className="w-full flex items-center justify-center gap-2 text-sm font-medium text-[#0d7377] hover:bg-[#e8f6f6] py-2 rounded-lg transition-colors border border-dashed border-gray-300 mt-4"
                >
                  <X className="w-4 h-4" />
                  Clear all
                </button>
              )}
            </div>
          </aside>

          {/* Main Content */}
          <main className="min-w-0">
            {/* Search & Tabs (Moved Inside Main Content) */}
            <div className="mb-8 md:mb-10">
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                    <Search className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    suppressHydrationWarning
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 sm:py-4 border border-gray-200 rounded-xl text-sm focus:border-[#0d7377] focus:ring-2 focus:ring-[#0d7377]/10 outline-none transition-all shadow-sm"
                    placeholder="Search forms..."
                  />
                </div>
                <button
                  onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}
                  className="lg:hidden flex items-center justify-center gap-2 px-6 py-3 sm:py-4 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:border-[#0d7377] hover:text-[#0d7377] transition-all shadow-sm"
                >
                  <Filter className="w-4 h-4" />
                  Filters
                  {(activeFilters.agency.length > 0 ||
                    activeFilters.category.length > 0) && (
                    <span className="bg-[#0d7377] text-white text-[10px] font-bold px-2 py-0.5 rounded-full ml-1">
                      {activeFilters.agency.length +
                        activeFilters.category.length}
                    </span>
                  )}
                </button>
              </div>
              <div className="flex gap-3 sm:gap-4">
                <button
                  onClick={() => handleViewChange("journey")}
                  suppressHydrationWarning
                  className={`flex-1 py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg font-semibold text-sm transition-all border-2 ${
                    currentView === "journey"
                      ? "bg-[#0d7377] border-[#0d7377] text-white"
                      : "bg-white border-gray-200 text-gray-500 hover:border-[#0d7377] hover:text-[#0d7377]"
                  }`}
                >
                  Journey View
                </button>
                <button
                  onClick={() => handleViewChange("all")}
                  suppressHydrationWarning
                  className={`flex-1 py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg font-semibold text-sm transition-all border-2 ${
                    currentView === "all"
                      ? "bg-[#0d7377] border-[#0d7377] text-white"
                      : "bg-white border-gray-200 text-gray-500 hover:border-[#0d7377] hover:text-[#0d7377]"
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
                <div className="relative overflow-x-auto pb-4 mb-6 md:mb-8 custom-scrollbar">
                  <div className="min-w-[600px] md:min-w-175 px-4">
                    <div className="relative flex justify-between pt-4">
                      {/* Connection Line */}
                      <div className="absolute top-[26px] left-0 right-0 h-1 bg-gray-200 rounded-full w-full" />

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
                        {
                          id: "Port of Entry",
                          label: "Port of Entry",
                          desc: "Arrival procedures",
                        },
                        {
                          id: "Post-Entry",
                          label: "Post-Entry",
                          desc: "SSN, work auth",
                        },
                      ].map((stage, index) => {
                        // Only show stages relevant if we had stage mapping, for now showing all visual
                        const count = VISA_FORMS.filter(
                          (f) =>
                            f.stage === stage.id &&
                            (!currentJourney ||
                              (f.journeys &&
                                f.journeys.includes(currentJourney))),
                        ).length;

                        const isActive = currentStage === stage.id;

                        return (
                          <button
                            key={index}
                            suppressHydrationWarning
                            onClick={() =>
                              setCurrentStage(
                                currentStage === stage.id ? "" : stage.id,
                              )
                            }
                            className="flex flex-col items-center group relative flex-1"
                          >
                            <div
                              className={`w-6 h-6 rounded-full border-4 z-10 transition-all duration-300 mb-3 ${
                                isActive
                                  ? "bg-[#0d7377] border-[#0d7377] scale-125"
                                  : "bg-white border-gray-200 group-hover:border-[#0d7377]"
                              }`}
                            />

                            <div className="text-center flex flex-col items-center">
                              <div
                                className={`text-sm font-bold mb-0.5 ${
                                  isActive
                                    ? "text-gray-900"
                                    : "text-gray-500 group-hover:text-gray-700"
                                }`}
                              >
                                {stage.label}
                              </div>
                              <div className="text-xs text-gray-400 mb-2">
                                {stage.desc}
                              </div>
                              <div className="bg-teal-50 text-teal-700 text-xs font-semibold px-3 py-1 rounded-md">
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
            <div className="grid sm:grid-cols-2 lg:grid-cols-2 gap-4 sm:gap-6 mb-12">
              {filteredForms.length > 0 ? (
                filteredForms.map((form) => {
                  return (
                    <div
                      key={form.code}
                      className="group relative bg-white rounded-2xl shadow-sm hover:shadow-xl hover:shadow-teal-900/5 hover:-translate-y-1 transition-all duration-300 border border-gray-200 overflow-hidden flex flex-col h-[320px] sm:h-[340px]"
                    >
                      {/* Top Accent Line */}
                      <div className="absolute top-0 left-0 right-10 h-1 bg-linear-to-r from-[#0d7377] to-teal-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />

                      {/* Folded Corner Effect */}
                      <div className="absolute top-0 right-0 w-10 h-10 overflow-hidden">
                        <div className="absolute top-0 right-0 w-0 h-0 border-t-40 border-l-40 border-t-gray-50 border-l-transparent drop-shadow-sm group-hover:border-t-gray-50 transition-colors duration-300 z-10" />
                        <div className="absolute top-0 right-0 w-0 h-0 border-t-40 border-l-40 border-t-gray-50 border-l-gray-50 shadow-md" />
                      </div>

                      <div className="p-7 flex flex-col h-full relative">
                        {/* Header */}
                        <div className="flex justify-between items-start mb-5 mr-8">
                          <div>
                            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight group-hover:text-[#0d7377] transition-colors">
                              {form.code}
                            </h2>
                            <span className="inline-block mt-1 px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-bold uppercase tracking-wider rounded-md">
                              {form.agency}
                            </span>
                          </div>

                          {/* Status Badge */}
                          <div
                            className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                              form.type === "online"
                                ? "bg-blue-50 text-blue-700"
                                : "bg-teal-50 text-teal-700"
                            }`}
                          >
                            {form.type === "online" ? "Online" : "PDF"}
                          </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-h-0">
                          <h3 className="text-lg font-bold text-gray-800 leading-snug mb-3 group-hover:text-[#0d7377] transition-colors line-clamp-2">
                            {form.name}
                          </h3>
                          <p className="text-sm text-gray-500 leading-relaxed line-clamp-3 group-hover:line-clamp-4 transition-all">
                            {form.description}
                          </p>
                        </div>

                        {/* Footer (Static) */}
                        <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between text-xs font-medium text-gray-400 group-hover:opacity-0 transition-opacity duration-200 delay-100">
                          <span className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
                            {form.stage}
                          </span>
                          {form.category && form.category[0] && (
                            <span>{form.category[0]}</span>
                          )}
                        </div>

                        {/* Hover Overlay Actions */}
                        <div className="absolute inset-x-0 bottom-0 p-6 bg-white/95 backdrop-blur-[2px] border-t border-gray-100 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out flex flex-col gap-3 z-10">
                          <div className="flex gap-3">
                            <button
                              onClick={() => setSelectedForm(form)}
                              suppressHydrationWarning
                              className="flex-1 bg-[#0d7377] text-white font-bold py-3 px-4 rounded-xl hover:bg-[#0a5a5d] transition-all shadow-sm hover:shadow-lg active:scale-95 text-sm flex items-center justify-center gap-2"
                            >
                              Preview
                            </button>
                            <button
                              onClick={() => handleStartForm(form.code)}
                              suppressHydrationWarning
                              className="flex-1 bg-white border-2 border-gray-100 text-gray-700 font-bold py-3 px-4 rounded-xl hover:border-[#0d7377] hover:text-[#0d7377] transition-all shadow-sm hover:shadow-md active:scale-95 text-sm flex items-center justify-center gap-2"
                            >
                              Start
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full py-16 text-center">
                  <div className="flex justify-center mb-4">
                    <FileText className="w-12 h-12 text-gray-300" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    No forms found
                  </h3>
                  <p className="text-gray-500">
                    Try adjusting your filters to see more results
                  </p>
                  <button
                    onClick={clearFilters}
                    className="mt-4 text-[#007f8a] hover:underline font-medium"
                  >
                    Clear all filters
                  </button>
                </div>
              )}
            </div>

            {/* Help Section */}
            <div className="grid md:grid-cols-1 gap-6">
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
              <div className="relative w-full max-w-5xl max-h-[95vh] sm:max-h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="sticky top-0 bg-white/95 backdrop-blur-md px-5 sm:px-8 py-4 sm:py-6 border-b border-gray-200 flex justify-between items-center z-10 shrink-0">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                    Form Details
                  </h2>
                  <button
                    onClick={() => setSelectedForm(null)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-gray-900"
                  >
                    <X className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto w-full">
                  <div className="p-5 sm:p-8 space-y-6 sm:space-y-8 max-w-5xl mx-auto w-full">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
                      <div>
                        <div className="text-xs sm:text-sm font-bold text-gray-500 uppercase tracking-wider mb-1 sm:mb-2">
                          Form Code
                        </div>
                        <div className="text-2xl sm:text-3xl font-bold text-[#0d7377] font-mono">
                          {selectedForm.code}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs sm:text-sm font-bold text-gray-500 uppercase tracking-wider mb-1 sm:mb-2">
                          Agency
                        </div>
                        <div className="text-lg sm:text-xl text-gray-900 font-medium">
                          {selectedForm.agency}
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="text-xs sm:text-sm font-bold text-gray-500 uppercase tracking-wider mb-1 sm:mb-2">
                        Full Title
                      </div>
                      <div className="text-lg sm:text-xl text-gray-900 leading-relaxed">
                        {selectedForm.name}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
                      <div>
                        <div className="text-xs sm:text-sm font-bold text-gray-500 uppercase tracking-wider mb-1 sm:mb-2">
                          Journey Stage
                        </div>
                        <div className="text-base sm:text-lg text-gray-900">
                          {selectedForm.stage}
                        </div>
                      </div>
                      {/* Add more fields if needed matching the HTML design */}
                    </div>

                    {/* Categories & Keywords */}
                    <div>
                      <div className="text-xs sm:text-sm font-bold text-gray-500 uppercase tracking-wider mb-2 sm:mb-3">
                        Categories
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {selectedForm.category?.map((cat) => (
                          <span
                            key={cat}
                            className="px-3 py-1 bg-[#e8f6f6] text-[#0a5a5d] rounded-md text-sm font-medium"
                          >
                            {cat}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs sm:text-sm font-bold text-gray-500 uppercase tracking-wider mb-2 sm:mb-3">
                        Keywords
                      </div>
                      <div className="flex flex-wrap gap-1.5 sm:gap-2">
                        {selectedForm.keywords?.map((kw) => (
                          <span
                            key={kw}
                            className="px-2 sm:px-3 py-1 bg-gray-100 text-gray-600 rounded-md text-xs sm:text-sm"
                          >
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs sm:text-sm font-bold text-gray-500 uppercase tracking-wider mb-1 sm:mb-2">
                        Description & Notes
                      </div>
                      <div className="text-sm sm:text-base text-gray-700 leading-relaxed bg-gray-50 p-4 sm:p-6 rounded-xl border border-gray-100">
                        {selectedForm.description}
                        {selectedForm.notes && (
                          <p className="mt-4 pt-4 border-t border-gray-200 text-gray-600 italic">
                            {selectedForm.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* PDF Preview or Online Callout */}
                    {selectedForm.type === "online" ? (
                      <div className="p-6 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-4">
                        <ExternalLink className="w-6 h-6 text-blue-600 shrink-0 mt-1" />
                        <div>
                          <h4 className="text-lg font-bold text-blue-900 mb-2">
                            Online Form
                          </h4>
                          <p className="text-blue-800">
                            This form must be completed online and cannot be
                            downloaded as a PDF. Visit the official government
                            website to access and submit this form.
                          </p>
                        </div>
                      </div>
                    ) : selectedForm.officialLink ? (
                      <div>
                        <div className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">
                          PDF Preview
                        </div>
                        <div className="border border-gray-200 rounded-xl overflow-hidden h-[800px] shadow-sm bg-gray-50">
                          <iframe
                            src={selectedForm.officialLink}
                            className="w-full h-full"
                            title={`PDF Preview of ${selectedForm.code}`}
                          />
                        </div>
                      </div>
                    ) : null}
                  </div>
                  {/* Actions Footer */}
                  <div className="p-4 sm:p-8 border-t border-gray-200 bg-gray-50 shrink-0">
                    <div className="max-w-5xl mx-auto flex flex-col sm:flex-row flex-wrap gap-3">
                      <button className="flex-1 w-full py-3 sm:py-4 bg-[#0d7377] hover:bg-[#0a5a5d] text-white rounded-xl font-bold text-sm lg:text-base shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2">
                        <Plus className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                        <span className="truncate">Add to AutoFill Queue</span>
                      </button>

                      {selectedForm.officialLink &&
                        selectedForm.type !== "online" && (
                          <button
                            onClick={() =>
                              window.open(selectedForm.officialLink, "_blank")
                            }
                            className="flex-1 w-full py-3 sm:py-4 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 hover:border-teal-600 hover:text-teal-700 rounded-xl font-bold text-sm lg:text-base shadow-sm transition-all flex items-center justify-center gap-2"
                          >
                            <Download className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
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
                        className="flex-1 w-full py-3 sm:py-4 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 hover:border-teal-600 hover:text-teal-700 rounded-xl font-bold text-sm lg:text-base shadow-sm transition-all flex items-center justify-center gap-2"
                      >
                        <Copy className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
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
          <div className="fixed bottom-8 right-8 z-200 animate-in slide-in-from-bottom-5 fade-in duration-300">
            <div
              className={`flex items-center gap-2 px-6 py-4 rounded-xl shadow-2xl font-semibold text-white transform transition-all ${
                toast.type === "success" ? "bg-[#0d7377]" : "bg-blue-600"
              }`}
            >
              <CheckCircle className="w-5 h-5" />
              {toast.message}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
