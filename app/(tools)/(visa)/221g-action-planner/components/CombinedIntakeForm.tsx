"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowRight, CircleHelp, CopyIcon, FileText, Mail, ShieldCheck, Sparkles, PrinterIcon, CheckCircle2, FolderCheck, ClipboardCheck, X, ListChecks, Info, MapPin, ChevronDown, Search, Download, FileDown } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import Actual221GFormChecker from "./Actual221GFormChecker";
import { FormData, FormSelections } from "../types/221g";
import { classifySituation } from "../utils/classifier";
import { ConfirmationModal } from "@/app/components/shared/ConfirmationModal";

interface CombinedIntakeFormProps {
  onSubmit: (data: FormData, selectedItems: FormSelections) => void;
  onSaveToProfile?: () => Promise<void>;
  initialData?: FormData | null;
  initialSelections?: FormSelections | null;
  smartModeEnabled?: boolean;
}

// Steps matching the reference HTML wizard
const STEPS = [
  { id: 1, label: "Case Basics" },
  { id: 2, label: "Replicate Checklist" },
  { id: 3, label: "Review & Generate" },
  { id: 4, label: "Export Packet" },
];

const EMBASSY_OPTIONS = [
  // Pakistan
  { value: "U.S. Embassy Islamabad", label: "U.S. Embassy Islamabad", country: "Pakistan" },
  { value: "U.S. Consulate Karachi", label: "U.S. Consulate Karachi", country: "Pakistan" },
  { value: "U.S. Consulate Lahore", label: "U.S. Consulate Lahore", country: "Pakistan" },
  // India
  { value: "U.S. Embassy New Delhi", label: "U.S. Embassy New Delhi", country: "India" },
  { value: "U.S. Consulate Mumbai", label: "U.S. Consulate Mumbai", country: "India" },
  { value: "U.S. Consulate Chennai", label: "U.S. Consulate Chennai", country: "India" },
  { value: "U.S. Consulate Hyderabad", label: "U.S. Consulate Hyderabad", country: "India" },
  { value: "U.S. Consulate Kolkata", label: "U.S. Consulate Kolkata", country: "India" },
  // Bangladesh
  { value: "U.S. Embassy Dhaka", label: "U.S. Embassy Dhaka", country: "Bangladesh" },
  // Sri Lanka
  { value: "U.S. Embassy Colombo", label: "U.S. Embassy Colombo", country: "Sri Lanka" },
  // Nepal
  { value: "U.S. Embassy Kathmandu", label: "U.S. Embassy Kathmandu", country: "Nepal" },
  // Philippines
  { value: "U.S. Embassy Manila", label: "U.S. Embassy Manila", country: "Philippines" },
  // Mexico
  { value: "U.S. Embassy Mexico City", label: "U.S. Embassy Mexico City", country: "Mexico" },
  { value: "U.S. Consulate Guadalajara", label: "U.S. Consulate Guadalajara", country: "Mexico" },
  { value: "U.S. Consulate Monterrey", label: "U.S. Consulate Monterrey", country: "Mexico" },
  { value: "U.S. Consulate Ciudad Juarez", label: "U.S. Consulate Ciudad Juarez", country: "Mexico" },
  // UK
  { value: "U.S. Embassy London", label: "U.S. Embassy London", country: "United Kingdom" },
  // Germany
  { value: "U.S. Embassy Berlin", label: "U.S. Embassy Berlin", country: "Germany" },
  { value: "U.S. Consulate Frankfurt", label: "U.S. Consulate Frankfurt", country: "Germany" },
  { value: "U.S. Consulate Munich", label: "U.S. Consulate Munich", country: "Germany" },
  // France
  { value: "U.S. Embassy Paris", label: "U.S. Embassy Paris", country: "France" },
  // Canada
  { value: "U.S. Embassy Ottawa", label: "U.S. Embassy Ottawa", country: "Canada" },
  { value: "U.S. Consulate Toronto", label: "U.S. Consulate Toronto", country: "Canada" },
  { value: "U.S. Consulate Montreal", label: "U.S. Consulate Montreal", country: "Canada" },
  { value: "U.S. Consulate Vancouver", label: "U.S. Consulate Vancouver", country: "Canada" },
  // China
  { value: "U.S. Embassy Beijing", label: "U.S. Embassy Beijing", country: "China" },
  { value: "U.S. Consulate Shanghai", label: "U.S. Consulate Shanghai", country: "China" },
  { value: "U.S. Consulate Guangzhou", label: "U.S. Consulate Guangzhou", country: "China" },
  { value: "U.S. Consulate Chengdu", label: "U.S. Consulate Chengdu", country: "China" },
  // South Korea
  { value: "U.S. Embassy Seoul", label: "U.S. Embassy Seoul", country: "South Korea" },
  // Japan
  { value: "U.S. Embassy Tokyo", label: "U.S. Embassy Tokyo", country: "Japan" },
  { value: "U.S. Consulate Osaka", label: "U.S. Consulate Osaka", country: "Japan" },
  // Nigeria
  { value: "U.S. Embassy Abuja", label: "U.S. Embassy Abuja", country: "Nigeria" },
  { value: "U.S. Consulate Lagos", label: "U.S. Consulate Lagos", country: "Nigeria" },
  // Egypt
  { value: "U.S. Embassy Cairo", label: "U.S. Embassy Cairo", country: "Egypt" },
  // Saudi Arabia
  { value: "U.S. Embassy Riyadh", label: "U.S. Embassy Riyadh", country: "Saudi Arabia" },
  { value: "U.S. Consulate Jeddah", label: "U.S. Consulate Jeddah", country: "Saudi Arabia" },
  // UAE
  { value: "U.S. Embassy Abu Dhabi", label: "U.S. Embassy Abu Dhabi", country: "UAE" },
  { value: "U.S. Consulate Dubai", label: "U.S. Consulate Dubai", country: "UAE" },
  // Brazil
  { value: "U.S. Embassy Brasilia", label: "U.S. Embassy Brasilia", country: "Brazil" },
  { value: "U.S. Consulate Sao Paulo", label: "U.S. Consulate Sao Paulo", country: "Brazil" },
  // Colombia
  { value: "U.S. Embassy Bogota", label: "U.S. Embassy Bogota", country: "Colombia" },
  // Ghana
  { value: "U.S. Embassy Accra", label: "U.S. Embassy Accra", country: "Ghana" },
  // Ethiopia
  { value: "U.S. Embassy Addis Ababa", label: "U.S. Embassy Addis Ababa", country: "Ethiopia" },
  // Kenya
  { value: "U.S. Embassy Nairobi", label: "U.S. Embassy Nairobi", country: "Kenya" },
];

const VISA_TYPES = [
  { value: "Immigrant", label: "Immigrant" },
  { value: "Nonimmigrant", label: "Nonimmigrant" },
];

const VISA_CATEGORIES = [
  { value: "IR-1", label: "IR-1 (Immediate Relative – Spouse)" },
  { value: "IR-2", label: "IR-2 (Immediate Relative – Child)" },
  { value: "IR-5", label: "IR-5 (Immediate Relative – Parent)" },
  { value: "CR-1", label: "CR-1 (Conditional Resident – Spouse)" },
  { value: "F-1", label: "F-1 (Family 1st Preference)" },
  { value: "F-2A", label: "F-2A (Family 2nd Preference)" },
  { value: "F-3", label: "F-3 (Family 3rd Preference)" },
  { value: "F-4", label: "F-4 (Family 4th Preference)" },
  { value: "K-1", label: "K-1 (Fiancé(e))" },
  { value: "K-3", label: "K-3 (Spouse of U.S. Citizen)" },
  { value: "B-1/B-2", label: "B-1/B-2 (Tourist/Business)" },
  { value: "F-1-student", label: "F-1 (Student)" },
  { value: "other", label: "Other (specify below)" },
];

const CEAC_STATUSES = [
  { value: "Refused", label: "Refused" },
  { value: "Administrative Processing", label: "Administrative Processing" },
  { value: "Issued", label: "Issued" },
  { value: "Ready", label: "Ready" },
  { value: "Other", label: "Other" },
];

const EMPTY_FORM: FormData = {
  visaType: "",
  visaCategory: "",
  visaTypeOther: "",
  interviewDate: "",
  consularPost: "",
  ceacStatus: "",
  caseNumber: "",
  beneficiaryName: "",
  passportNumber: "",
  dateOfBirth: "",
};

export default function CombinedIntakeForm({
  onSubmit,
  onSaveToProfile,
  initialData,
  initialSelections,
  smartModeEnabled = false,
}: CombinedIntakeFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(initialData ?? EMPTY_FORM);
  const [selected221gItems, setSelected221gItems] = useState<FormSelections>(
    initialSelections ?? {},
  );

  const [outputs, setOutputs] = useState<{
    actionPlan: string;
    checklist: string;
    coverLetter: string;
  } | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [showWelcome, setShowWelcome] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [dobError, setDobError] = useState<string | null>(null);
  const [openWhatIs, setOpenWhatIs] = useState(false);
  const [openFlow, setOpenFlow] = useState(false);
  const [openNeed, setOpenNeed] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  // Embassy combobox state
  const [embassySearchText, setEmbassySearchText] = useState(formData.consularPost ?? "");
  const [showEmbassySuggestions, setShowEmbassySuggestions] = useState(false);
  const embassyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("hide221gWelcome");
      if (!saved) setShowWelcome(true);
    }
  }, []);

  // Close embassy dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (embassyRef.current && !embassyRef.current.contains(e.target as Node)) {
        setShowEmbassySuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Sync embassySearchText when formData.consularPost changes externally
  useEffect(() => {
    setEmbassySearchText(formData.consularPost ?? "");
  }, [formData.consularPost]);

  const filteredEmbassies = EMBASSY_OPTIONS.filter(
    (e) =>
      e.label.toLowerCase().includes(embassySearchText.toLowerCase()) ||
      e.country.toLowerCase().includes(embassySearchText.toLowerCase())
  );

  const handleStartWizard = () => {
    if (dontShowAgain) {
      localStorage.setItem("hide221gWelcome", "true");
    }
    setShowWelcome(false);
  };

  const handleWelcomeOpenChange = (open: boolean) => {
    if (!open && dontShowAgain && typeof window !== "undefined") {
      localStorage.setItem("hide221gWelcome", "true");
    }
    setShowWelcome(open);
  };

  const handleField = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const goNext = () => setCurrentStep((s) => Math.min(s + 1, 4));
  const goBack = () => setCurrentStep((s) => Math.max(s - 1, 1));

  const handleGenerate = () => {
    // Generate outputs based on the logic from the reference JS
    const actionPlan = generateActionPlan();
    const packetChecklist = generatePacketChecklist();
    const coverLetter = generateCoverLetter();

    setOutputs({
      actionPlan,
      checklist: packetChecklist,
      coverLetter,
    });

    setCurrentStep(4);
    onSubmit(formData, selected221gItems);
  };

  const selectedBooleanKeys = Object.entries(selected221gItems)
    .filter(([, value]) => typeof value === "boolean" && value)
    .map(([key]) => key);

  const smartClassification = smartModeEnabled
    ? classifySituation(formData, selectedBooleanKeys)
    : null;

  const validateDob = (value: string): string | null => {
    if (!value) return null; // DOB is optional
    const dob = new Date(value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (isNaN(dob.getTime())) return "Please enter a valid date.";
    if (dob >= today) return "Date of Birth must be in the past.";
    const minAge = 1;
    const minDate = new Date(today);
    minDate.setFullYear(today.getFullYear() - minAge);
    if (dob > minDate) return "Beneficiary must be at least 1 year old.";
    const maxAge = 120;
    const maxDate = new Date(today);
    maxDate.setFullYear(today.getFullYear() - maxAge);
    if (dob < maxDate) return "Please enter a valid Date of Birth.";
    return null;
  };

  const handleDobChange = (value: string) => {
    handleField("dateOfBirth", value);
    setDobError(validateDob(value));
  };

  const resetWizard = () => {
    setFormData(EMPTY_FORM);
    setSelected221gItems({});
    setOutputs(null);
    setCurrentStep(1);
    setShowResetModal(false);
  };

  const formatDate = (d: string) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // ──────────────────────────────────────────────
  // GENERATORS (Translated from app.js)
  // ──────────────────────────────────────────────

  const generateActionPlan = () => {
    const cb = formData;
    const cl = selected221gItems;
    
    let plan = `# 221(g) ACTION PLAN\n\n`;
    plan += `Generated: ${new Date().toLocaleDateString()}\n`;
    plan += `For: ${cb.beneficiaryName || 'Beneficiary'}\n`;
    plan += `Case: ${cb.caseNumber || 'Not provided'}\n\n`;
    
    plan += `## IMPORTANT DISCLAIMER\n\n`;
    plan += `This action plan is based on the information you provided and is for general guidance only. It is NOT legal advice. Always follow your embassy's 221(g) letter instructions if anything differs from this plan. For complex cases, consult an immigration attorney. Processing times vary and we cannot guarantee visa issuance or specific timelines.\n\n`;
    
    plan += `## SUMMARY\n\n`;
    // Contextual summary based on CEAC status and selected items
    const isAdminOnly = !cl.passport && !cl.medical_examination && !cl.i864_affidavit &&
      !cl.nadra_family_reg && !cl.nadra_birth_cert && !cl.nadra_marriage_cert &&
      !cl.nikah_nama && !cl.nadra_divorce_cert && !cl.us_divorce_decree &&
      !cl.death_certificate && !cl.police_certificate && !cl.english_translation &&
      !cl.dna_test && !cl.other && cl.admin_processing;
    const isAdminProcessingStatus = cb.ceacStatus?.toLowerCase().includes('administrative');

    if (isAdminOnly || isAdminProcessingStatus) {
      plan += `Your case is currently under Administrative Processing following the visa interview on ${formatDate(cb.interviewDate)} at ${cb.consularPost}. Under INA Section 221(g), additional review is being conducted before a final decision can be made. No additional documents have been specifically requested at this time — you are advised to monitor your CEAC status and wait for further instructions from the embassy.\n\n`;
    } else {
      plan += `Your visa interview on ${formatDate(cb.interviewDate)} at ${cb.consularPost} resulted in a temporary hold under INA Section 221(g). The consular officer requires the documents listed below before a final decision can be made. This is NOT a permanent denial.\n\n`;
    }

    const docItemCount = Object.entries(cl)
      .filter(([, v]) => typeof v === 'boolean' && v)
      .length;
    if (docItemCount > 0) {
      plan += `Based on your checklist, the following items have been identified:\n`;
      if (cl.i864_affidavit) plan += `- Financial sponsorship documents (I-864 package)\n`;
      if (cl.passport) plan += `- Your passport for visa placement\n`;
      if (cl.medical_examination) plan += `- Completed medical examination\n`;
      if (cl.nadra_family_reg || cl.nadra_birth_cert || cl.nadra_marriage_cert || cl.nikah_nama) plan += `- Civil/NADRA registration documents\n`;
      if (cl.police_certificate) plan += `- Police certificate\n`;
      if (cl.english_translation) plan += `- Certified English translations\n`;
      if (cl.dna_test) plan += `- DNA test\n`;
      if (cl.admin_processing) plan += `- Administrative processing (no action needed from you)\n`;
      plan += `\n`;
    }
    
    plan += `## IMMEDIATE NEXT STEPS\n\n`;
    plan += `1. **Gather Documents by Provider**\n\n`;
    
    // Beneficiary docs
    const benDocs: string[] = [];
    if (cl.passport) benDocs.push('Passport (original)');
    if (cl.medical_examination) benDocs.push('Medical examination results (DS-2054, sealed)');
    if (cl.police_certificate) benDocs.push(`Police certificate – ${cl.police_certificate_country || 'specified country'}`);
    if (cl.nadra_birth_cert_beneficiary) benDocs.push('NADRA Birth Certificate');
    if (cl.nadra_birth_cert && !cl.nadra_birth_cert_beneficiary && !cl.nadra_birth_cert_petitioner) benDocs.push('NADRA Birth Certificate');
    if (cl.nadra_family_reg) benDocs.push('NADRA Family Registration Certificate');
    if (cl.nadra_marriage_cert) benDocs.push('NADRA Marriage Certificate');
    if (cl.nikah_nama) benDocs.push('Nikah Nama');
    if (cl.nadra_divorce_cert_beneficiary) benDocs.push('NADRA Divorce Certificate (beneficiary)');
    if (cl.death_certificate) benDocs.push(`Death Certificate – ${cl.death_certificate_name || 'specified person'}`);
    
    if (benDocs.length > 0) {
        plan += `   **Beneficiary to provide:**\n`;
        benDocs.forEach(doc => plan += `   - ${doc}\n`);
        plan += `\n`;
    }
    
    // Petitioner docs
    const petDocs: string[] = [];
    if (cl.i864_affidavit || cl.i864_petitioner) {
        const sponsorName = cl.i864_petitioner_name ? ` (${cl.i864_petitioner_name})` : '';
        petDocs.push(`I-864 Affidavit of Support${sponsorName}`);
        if (cl.irs_transcript) petDocs.push(`IRS Tax Transcript${cl.i864_tax_years ? ` – year(s): ${cl.i864_tax_years}` : ''}`);
        else if (cl.tax_1040) petDocs.push(`Signed IRS Form 1040${cl.i864_tax_years ? ` – year(s): ${cl.i864_tax_years}` : ''}`);
        else petDocs.push(`Tax and financial evidence${cl.i864_tax_years ? ` – year(s): ${cl.i864_tax_years}` : ''}`);
        if (cl.w2) petDocs.push('W-2 Tax Statements');
        if (cl.proof_citizenship) petDocs.push('Proof of U.S. citizenship / LPR status');
        if (cl.domicile) petDocs.push('Proof of U.S. domicile');
    }
    if (cl.i864a) petDocs.push(`I-864A (Household Member contract${cl.i864_household_member_name ? ` – ${cl.i864_household_member_name}` : ''})`);
    if (cl.us_divorce_decree) petDocs.push('U.S. Divorce Decree (original or certified copy)');
    if (cl.nadra_birth_cert_petitioner) petDocs.push('NADRA Birth Certificate (petitioner)');
    if (cl.nadra_divorce_cert_petitioner) petDocs.push('NADRA Divorce Certificate (petitioner)');
    
    if (petDocs.length > 0) {
        plan += `   **Petitioner to provide:**\n`;
        petDocs.forEach(doc => plan += `   - ${doc}\n`);
        plan += `\n`;
    }

    // Joint sponsor
    if (cl.i864_joint_sponsor) {
        const jsName = cl.i864_joint_sponsor_name ? ` (${cl.i864_joint_sponsor_name})` : '';
        plan += `   **Joint Sponsor${jsName} to provide:**\n`;
        plan += `   - I-864 Affidavit of Support\n`;
        plan += `   - Tax and financial evidence${cl.i864_tax_years ? ` – year(s): ${cl.i864_tax_years}` : ''}\n`;
        plan += `   - Proof of U.S. citizenship / LPR status and domicile\n\n`;
    }
    
    plan += `2. **Prepare Translations**\n`;
    if (cl.english_translation) {
        plan += `   You indicated that English translations are required for: ${cl.english_translation_document || 'specified documents'}. All translations must be certified and include a statement of translator competency.\n\n`;
    } else {
        plan += `   If any documents are not in English, they must be accompanied by certified English translations.\n\n`;
    }
    
    plan += `3. **Assemble Your Packet**\n`;
    plan += `   Organize documents in the order shown in the Packet Assembly Checklist. Place the cover letter first, followed by a copy of your 221(g) letter.\n\n`;
    
    plan += `4. **Submit Per Embassy Instructions**\n`;
    plan += `   Follow the submission method specified on your 221(g) letter. Most embassies use designated courier services. Do NOT mail documents directly to the embassy unless instructed.\n\n`;
    
    plan += `5. **Track and Wait**\n`;
    plan += `   After submission, check your CEAC status regularly at https://ceac.state.gov/CEACStatTracker/Status.aspx. Administrative processing duration varies by case and cannot be predicted. If your case enters administrative processing, additional security checks may be required, and timing is outside embassy control.\n\n`;
    plan += `   Source: U.S. Department of State - https://travel.state.gov/content/travel/en/us-visas/visa-information-resources/administrative-processing-information.html\n\n`;
    
    plan += `## DOCUMENT-BY-DOCUMENT INSTRUCTIONS\n\n`;
    
    if (cl.passport) {
        plan += `### Passport\n`;
        plan += `**What to submit:** Original passport with at least 6 months validity beyond intended U.S. entry date.\n`;
        plan += `**Who provides:** Beneficiary\n`;
        plan += `**How to prepare:** Submit via courier service as instructed on your 221(g) letter. Keep photocopies for your records.\n`;
        plan += `**Common mistakes to avoid:**\n`;
        plan += `- Submitting an expired or nearly-expired passport\n`;
        plan += `- Sending passport via regular mail instead of designated courier\n\n`;
    }
    
    if (cl.medical_examination) {
        plan += `### Medical Examination\n`;
        plan += `**What to submit:** Completed DS-2054 form (sealed) from a panel physician.\n`;
        plan += `**Who provides:** Beneficiary\n`;
        plan += `**How to prepare:** Schedule with a U.S. embassy-approved panel physician. They will provide sealed results.\n`;
        plan += `**Common mistakes to avoid:**\n`;
        plan += `- Using a non-panel physician\n`;
        plan += `- Opening the sealed envelope\n\n`;
    }
    
    if (cl.i864_affidavit) {
        plan += `### I-864 Affidavit of Support Package\n\n`;
        if (smartModeEnabled && cl.i864_sponsor_structure) {
            plan += `**Sponsor structure selected:** ${cl.i864_sponsor_structure.replace(/-/g, " ")}\n`;
            if (cl.i864_petitioner_name) {
                plan += `**Petitioner:** ${cl.i864_petitioner_name}\n`;
            }
            if (cl.i864_joint_sponsor_name) {
                plan += `**Joint Sponsor:** ${cl.i864_joint_sponsor_name}\n`;
            }
            if (cl.i864_household_member_name) {
                plan += `**Household Member:** ${cl.i864_household_member_name}\n`;
            }
            if (cl.i864_tax_years) {
                plan += `**Tax years noted:** ${cl.i864_tax_years}\n`;
            }
            plan += `\n`;
        }
        plan += `**Expected submissions:**\n`;
        
        plan += `1. Form I-864 Affidavit of Support (signed and dated)\n`;
        plan += `   - Complete all sections\n`;
        plan += `   - Sign in blue ink\n`;
        plan += `   - Date within 6 months of submission\n`;
        plan += `   - Source: https://www.uscis.gov/i-864\n\n`;

        if (cl.i864a) {
            plan += `2. Form I-864A Contract Between Sponsor and Household Member\n`;
            plan += `   - Signed by both sponsor and household member\n`;
            plan += `   - Source: https://www.uscis.gov/i-864a\n\n`;
        }

        plan += `3. Tax Evidence (for each sponsor):\n`;
        if (cl.irs_transcript) {
            plan += `   - **IRS Tax Return Transcript (as requested):** Order at https://www.irs.gov/individuals/get-transcript\n`;
            plan += `     - Tax year(s): ${cl.i864_tax_years || 'most recent 3 years'}\n`;
        } else if (cl.tax_1040) {
            plan += `   - **Signed IRS Form 1040** for year(s): ${cl.i864_tax_years || 'most recent 3 years'}\n`;
        } else {
            plan += `   - **IRS Tax Return Transcript (PREFERRED):** Order at https://www.irs.gov/individuals/get-transcript\n`;
            plan += `     This is the IRS-generated transcript of your tax return, not the return itself.\n`;
            if (cl.i864_tax_years) plan += `   - Tax year(s) requested: ${cl.i864_tax_years}\n`;
        }
        if (cl.w2) plan += `   - **W-2 Forms:** For all employment income for year(s): ${cl.i864_tax_years || 'as requested'}\n`;
        plan += `\n`;

        plan += `4. Proof of U.S. Status and Domicile:\n`;
        if (cl.proof_citizenship) plan += `   - U.S. Birth Certificate, U.S. Passport, or Naturalization Certificate\n`;
        if (cl.domicile) plan += `   - Proof of U.S. domicile: Lease, mortgage, utility bills, employment letter\n`;
        if (!cl.proof_citizenship && !cl.domicile) {
            plan += `   - U.S. Birth Certificate, U.S. Passport, or Naturalization Certificate\n`;
            plan += `   - Proof of U.S. domicile: Lease, mortgage, utility bills, employment letter\n`;
        }
        plan += `\n`;

        plan += `**Common mistakes to avoid:**\n`;
        plan += `- Using an outdated I-864 form version\n`;
        plan += `- Submitting tax returns instead of IRS transcripts when transcripts are requested\n`;
        plan += `- Missing signatures or dates\n`;
        plan += `- Not including household member income when needed to meet requirements\n\n`;
    }

    if (cl.nadra_family_reg || cl.nadra_birth_cert || cl.nadra_marriage_cert || cl.nikah_nama || cl.nadra_divorce_cert) {
        plan += `### NADRA Civil Documents\n`;
        plan += `**What to submit:** Original certificates issued by Pakistan's National Database and Registration Authority (NADRA).\n`;
        plan += `**Who provides:** As indicated on your letter (beneficiary or petitioner)\n`;
        plan += `**How to prepare:** Obtain originals from NADRA. Ensure names and dates match other documents.\n`;
        plan += `**Common mistakes to avoid:**\n`;
        plan += `- Submitting photocopies instead of originals when originals are required\n`;
        plan += `- Name spelling discrepancies across documents\n\n`;
    }

    if (cl.english_translation) {
        plan += `### English Translations\n`;
        plan += `**What to submit:** Certified English translation of: ${cl.english_translation_document || 'specified documents'}\n`;
        plan += `**Who provides:** Professional translator\n`;
        plan += `**How to prepare:** Translation must include:\n`;
        plan += `- Full translation of all text\n`;
        plan += `- Translator's certification of accuracy and competency\n`;
        plan += `- Translator's signature and contact information\n`;
        plan += `**Common mistakes to avoid:**\n`;
        plan += `- Using uncertified translations\n`;
        plan += `- Partial translations\n\n`;
    }

    if (cl.dna_test) {
        plan += `### DNA Test\n`;
        plan += `**What to submit:** DNA test results from an AABB-accredited laboratory.\n`;
        plan += `**Parties being tested:** ${cl.dna_test_name || 'As specified on your 221(g) letter'}\n`;
        plan += `**Who to contact:** Contact ${cb.consularPost || 'the embassy'} for the approved laboratory list.\n`;
        plan += `**How to prepare:** Both parties must test at an approved AABB-accredited lab. Results should be sent directly to the embassy.\n`;
        plan += `**Common mistakes to avoid:**\n`;
        plan += `- Using a non-AABB-accredited laboratory\n`;
        plan += `- Incomplete chain of custody documentation\n\n`;
    }

    if (cl.other && cl.other_details) {
        plan += `### Other Requested Items\n`;
        plan += `**Details:** ${cl.other_details}\n`;
        plan += `**How to prepare:** Follow the specific instructions on your 221(g) letter for this item.\n\n`;
    }

    plan += `## EXPECTED TIMING & FOLLOW-UP\n\n`;
    plan += `**After Submission:**\n`;
    plan += `- Confirm courier delivery (keep tracking number)\n`;
    plan += `- Keep copies of all submitted documents\n`;
    plan += `- Monitor CEAC status weekly\n\n`;
    
    plan += `**Status Monitoring:**\n`;
    plan += `Check https://ceac.state.gov/CEACStatTracker/Status.aspx regularly. Status meanings:\n`;
    plan += `- **Refused:** Documents under review or administrative processing ongoing\n`;
    plan += `- **Administrative Processing:** Security checks or additional review in progress\n`;
    plan += `- **Issued:** Visa approved\n`;
    plan += `- **Ready:** Passport ready for pickup\n\n`;
    
    plan += `**Important Notes on Timing:**\n`;
    plan += `- Document review typically takes several weeks, but timing varies widely\n`;
    plan += `- Administrative processing duration cannot be predicted and may take additional time\n`;
    plan += `- Embassies cannot expedite administrative processing\n`;
    plan += `- Per U.S. Department of State guidance, processing times vary by individual case circumstances\n\n`;
    
    plan += `**If No Update After Several Weeks:**\n`;
    plan += `- Verify documents were received via courier tracking\n`;
    plan += `- Check CEAC status remains current\n`;
    plan += `- Consider polite inquiry per embassy's contact procedures\n`;
    plan += `- Do NOT repeatedly contact the embassy as this does not expedite processing\n\n`;
    
    plan += `## FINAL REMINDERS\n\n`;
    plan += `✓ Follow your embassy's 221(g) letter instructions above all else\n`;
    plan += `✓ Submit ONLY what was requested - do not add unrequested documents\n`;
    plan += `✓ Keep copies of everything you submit\n`;
    plan += `✓ Use the designated courier service specified by your embassy\n`;
    plan += `✓ Be patient - processing times vary and cannot be guaranteed\n`;
    plan += `✓ For complex cases, consult an immigration attorney\n\n`;
    
    plan += `This action plan is based on your inputs and general guidance. It is not legal advice.\n`;

    if (smartModeEnabled && smartClassification) {
      plan += `\n## SMART INSIGHT SUMMARY\n\n`;
      plan += `Scenario: ${smartClassification.description}\n`;
      plan += `Confidence: ${smartClassification.confidence.toUpperCase()}\n\n`;
      plan += `Recommended next steps:\n`;
      smartClassification.nextSteps.forEach((step, i) => {
        plan += `${i + 1}. ${step}\n`;
      });
      plan += `\n`;
    }
    
    return plan;
  };

  const generatePacketChecklist = () => {
    const cl = selected221gItems;
    
    let checklist = `# PACKET ASSEMBLY CHECKLIST\n\n`;
    checklist += `Assemble your documents in this order:\n\n`;
    
    checklist += `* Cover Letter (see Cover Letter tab)\n`;
    checklist += `* Copy of 221(g) Letter (recommended)\n`;
    
    // Beneficiary documents
    checklist += `\n**BENEFICIARY DOCUMENTS**\n\n`;
    if (cl.passport) {
        checklist += `* Passport (original)\n`;
    }
    if (cl.medical_examination) {
        checklist += `* Medical Examination Results (sealed envelope)\n`;
    }
    if (cl.nadra_birth_cert_beneficiary || (!cl.nadra_birth_cert_beneficiary && !cl.nadra_birth_cert_petitioner && cl.nadra_birth_cert)) {
        checklist += `* NADRA Birth Certificate (original)\n`;
    }
    if (cl.police_certificate) {
        checklist += `* Police Certificate - ${cl.police_certificate_country || 'Specified Country'} (original)\n`;
    }
    
    // Petitioner/Sponsor documents
    if (cl.i864_affidavit || cl.us_divorce_decree || cl.nadra_birth_cert_petitioner) {
        checklist += `\n**PETITIONER/SPONSOR DOCUMENTS**\n\n`;
        
        if (cl.i864_affidavit || cl.i864_petitioner) {
            checklist += `* I-864 Affidavit of Support (signed, dated)\n`;
            checklist += `* Proof of U.S. Status (citizenship/LPR)\n`;
            checklist += `* Tax and Financial Evidence\n`;
        }
        
        if (cl.us_divorce_decree) {
            checklist += `* U.S. Divorce Decree (original or certified copy)\n`;
        }
        
        if (cl.nadra_birth_cert_petitioner) {
            checklist += `* NADRA Birth Certificate (original)\n`;
        }
    }
    
    // Joint Sponsor documents
    if (cl.i864_joint_sponsor) {
        checklist += `\n**JOINT SPONSOR DOCUMENTS**\n\n`;
        checklist += `* I-864 Affidavit of Support (signed, dated)\n`;
        checklist += `* Tax and Financial Evidence\n`;
        checklist += `* Proof of U.S. Status and Domicile\n`;
    }
    
    // Civil documents
    const civilDocs = [];
    if (cl.nadra_family_reg) civilDocs.push('NADRA Family Registration Certificate');
    if (cl.nadra_marriage_cert) civilDocs.push('NADRA Marriage Certificate');
    if (cl.nikah_nama) civilDocs.push('Nikah Nama');
    if (cl.nadra_divorce_cert) civilDocs.push('NADRA Divorce Certificate');
    if (cl.death_certificate) civilDocs.push(`Death Certificate (${cl.death_certificate_name || 'as indicated'})`);
    
    if (civilDocs.length > 0) {
        checklist += `\n**CIVIL DOCUMENTS**\n\n`;
        civilDocs.forEach(doc => {
            checklist += `* ${doc} (original)\n`;
        });
    }
    
    // Translations
    if (cl.english_translation) {
        checklist += `\n**TRANSLATIONS**\n\n`;
        checklist += `* Certified English Translation of: ${cl.english_translation_document || 'Specified Documents'}\n`;
    }
    
    // DNA
    if (cl.dna_test) {
        checklist += `\n**DNA TEST**\n\n`;
        checklist += `* DNA Test Results (${cl.dna_test_name || 'specified parties'})\n`;
    }
    
    // Custom items
    if (cl.other && cl.other_details) {
        checklist += `\n**OTHER REQUESTED ITEMS**\n\n`;
        checklist += `* ${cl.other_details} (original)\n`;
    }
    
    checklist += `\n\n## BEFORE YOU SUBMIT - FINAL CHECKS\n\n`;
    checklist += `☐ Cover letter is signed and dated\n`;
    checklist += `☐ All documents are in the correct order\n`;
    checklist += `☐ Originals are included where required (not photocopies)\n`;
    checklist += `☐ All signatures are in blue ink where required\n`;
    checklist += `☐ All forms are dated within 6 months\n`;
    checklist += `☐ Translations are certified and complete\n`;
    checklist += `☐ Names and dates are consistent across all documents\n`;
    checklist += `☐ You have kept photocopies of everything\n`;
    checklist += `☐ Courier tracking number is recorded\n`;
    checklist += `☐ You know how to check CEAC status\n\n`;
    
    checklist += `**REMEMBER:** Follow your embassy's 221(g) letter instructions if anything differs from this checklist.\n`;
    
    return checklist;
  };

  const generateCoverLetter = () => {
    const cb = formData;
    const cl = selected221gItems;
    
    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    
    const visaUnitType = cb.visaType?.toLowerCase() === 'nonimmigrant'
      ? 'Nonimmigrant'
      : 'Immigrant';
    const visaCategoryFull = VISA_CATEGORIES.find(c => c.value === cb.visaCategory)?.label || cb.visaCategory;

    let letter = `${today}\n\n`;
    letter += `${cb.consularPost}\n`;
    letter += `${visaUnitType} Visa Unit\n\n`;
    letter += `**Subject: Response to INA 221(g) Refusal`;
    if (cb.caseNumber) letter += ` – Case Number: ${cb.caseNumber}`;
    if (cb.beneficiaryName) letter += ` – ${cb.beneficiaryName}`;
    letter += `**\n\n`;
    
    letter += `Dear Consular Officer,\n\n`;
    
    letter += `I am writing in response to the Section 221(g) refusal issued following my ${visaUnitType.toLowerCase()} visa interview on ${formatDate(cb.interviewDate)}. `;
    letter += `I am submitting the requested documents as instructed.\n\n`;
    
    letter += `**Applicant Information:**\n`;
    if (cb.beneficiaryName) letter += `- Full Name: ${cb.beneficiaryName}\n`;
    if (cb.passportNumber) letter += `- Passport Number: ${cb.passportNumber}\n`;
    letter += `- Interview Date: ${formatDate(cb.interviewDate)}\n`;
    if (cb.caseNumber) letter += `- Case Number: ${cb.caseNumber}\n`;
    letter += `- Visa Category: ${visaCategoryFull}\n`;
    if (cb.ceacStatus) letter += `- Current CEAC Status: ${cb.ceacStatus}\n`;
    letter += `\n`;

    if (smartModeEnabled && cl.i864_affidavit && cl.i864_sponsor_structure) {
        letter += `**Financial Sponsorship Structure:**\n`;
        letter += `- Structure: ${cl.i864_sponsor_structure.replace(/-/g, " ")}\n`;
        if (cl.i864_petitioner_name) {
            letter += `- Petitioner: ${cl.i864_petitioner_name}\n`;
        }
        if (cl.i864_joint_sponsor_name) {
            letter += `- Joint Sponsor: ${cl.i864_joint_sponsor_name}\n`;
        }
        if (cl.i864_household_member_name) {
            letter += `- Household Member: ${cl.i864_household_member_name}\n`;
        }
        if (cl.i864_tax_years) {
            letter += `- Tax Years: ${cl.i864_tax_years}\n`;
        }
        letter += `\n`;
    }

    letter += `**Enclosed Documents:**\n\n`;

    // Build document list
    const docList = [];
    if (cl.passport) docList.push('Passport (original)');
    if (cl.medical_examination) docList.push('Medical examination results (sealed)');

    if (cl.i864_affidavit) {
        if (cl.i864_petitioner) {
            docList.push('I-864 Affidavit of Support from petitioner');
            docList.push('Tax and financial evidence for petitioner');
            if (cl.i864a) {
                docList.push('I-864A Contract with household member');
            }
        }
        if (cl.i864_joint_sponsor) {
            docList.push('I-864 Affidavit of Support from joint sponsor');
            docList.push('Tax and financial evidence for joint sponsor');
            if (cl.i864a) {
                docList.push('I-864A Contract with joint sponsor household member');
            }
        }
        if (!cl.i864_petitioner && !cl.i864_joint_sponsor) {
             docList.push('I-864 Affidavit of Support package');
        }
    }

    if (cl.nadra_family_reg) docList.push('NADRA Family Registration Certificate (original)');
    if (cl.nadra_birth_cert) docList.push(`NADRA Birth Certificate (original)`);
    if (cl.nadra_marriage_cert) docList.push('NADRA Marriage Certificate (original)');
    if (cl.nikah_nama) docList.push('Nikah Nama (original)');
    if (cl.nadra_divorce_cert) docList.push(`NADRA Divorce Certificate (original)`);
    if (cl.us_divorce_decree) docList.push('U.S. Divorce Decree (original or certified copy)');
    if (cl.death_certificate) docList.push(`Death Certificate (original)`);
    if (cl.police_certificate) docList.push(`Police Certificate from ${cl.police_certificate_country || 'specified country'} (original)`);
    if (cl.english_translation) docList.push(`Certified English translation of ${cl.english_translation_document || 'specified documents'}`);
    if (cl.dna_test) docList.push(`DNA test results for ${cl.dna_test_name || 'specified parties'}`);

    if (cl.other && cl.other_details) {
        docList.push(cl.other_details);
    }

    // Format as table
    letter += `| # | Document |\n`;
    letter += `|---|----------|\n`;
    docList.forEach((doc, index) => {
        letter += `| ${index + 1} | ${doc} |\n`;
    });

    letter += `\n`;
    letter += `All documents are submitted in accordance with the instructions provided in the 221(g) letter. `;
    letter += `I have included originals where required and have retained photocopies for my records.\n\n`;

    letter += `I respectfully request that you review these documents at your earliest convenience. `;
    letter += `Please do not hesitate to contact me if additional information is needed.\n\n`;

    letter += `Thank you for your time and consideration.\n\n`;
    letter += `Sincerely,\n\n`;
    letter += `${cb.beneficiaryName || '[Your Full Name]'}\n`;
    if (cb.passportNumber) letter += `Passport: ${cb.passportNumber}\n`;
    letter += `[Your Email Address]\n`;
    letter += `[Your Phone Number]\n`;

    return letter;
  };

  // ──────────────────────────────────────────────
  // Progress Indicator
  // ──────────────────────────────────────────────
  const ProgressIndicator = () => (
    <div className="flex items-center justify-between mb-8 px-2 max-w-2xl mx-auto">
      {STEPS.map((step, idx) => (
        <div key={step.id} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-300
                ${
                  currentStep === step.id
                    ? "bg-primary text-white scale-110 shadow-md ring-4 ring-primary/20"
                    : currentStep > step.id
                      ? "bg-teal-600 text-white"
                      : "bg-muted text-muted-foreground"
                }`}
            >
              {currentStep > step.id ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                step.id
              )}
            </div>
            <span
              className={`mt-1.5 text-[10px] md:text-xs text-center max-w-[80px] leading-tight font-medium ${
                currentStep === step.id
                  ? "text-primary font-bold"
                  : "text-muted-foreground"
              }`}
            >
              {step.label}
            </span>
          </div>
          {idx < STEPS.length - 1 && (
            <div
              className={`flex-1 h-0.5 mx-2 mb-5 rounded transition-colors duration-300 ${
                currentStep > step.id ? "bg-teal-600/50" : "bg-border"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );

  // Embassy combobox helpers (defined here so they can be used inline in render)
  const handleEmbassyInputChange = (val: string) => {
    setEmbassySearchText(val);
    handleField("consularPost", val);
    setShowEmbassySuggestions(true);
  };

  const handleEmbassySelect = (val: string) => {
    setEmbassySearchText(val);
    handleField("consularPost", val);
    setShowEmbassySuggestions(false);
  };



  // ──────────────────────────────────────────────
  // Step 3 – Review & Generate
  // ──────────────────────────────────────────────
  const StepReviewGenerate = () => {
    const selectedCount = Object.values(selected221gItems).filter(
      (value) => typeof value === "boolean" && value,
    ).length;
    
    return (
      <div className="space-y-6">
        <div className="border-b pb-4 text-center">
            <div className="inline-block p-1 px-3 bg-teal-100 text-teal-800 rounded-full text-xs font-bold mb-2 tracking-wide uppercase">Almost there!</div>
          <h2 className="text-2xl font-bold text-foreground">Review & Generate</h2>
          <p className="text-muted-foreground mt-1 text-sm">Review your case details and generate your personalised action plan.</p>
        </div>

        <div className="space-y-8">
            <section>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs">A</span>
                    Case Basics
                </h3>
                <div className="border rounded-lg overflow-hidden bg-muted/30">
                    <table className="w-full text-sm">
                        <tbody>
                            <tr className="border-b last:border-0">
                                <th className="text-left p-3 bg-muted/50 font-medium w-40">Visa Category</th>
                                <td className="p-3">{formData.visaCategory === 'other' ? formData.visaTypeOther : formData.visaCategory}</td>
                            </tr>
                            <tr className="border-b last:border-0">
                                <th className="text-left p-3 bg-muted/50 font-medium">Interview Date</th>
                                <td className="p-3">{formatDate(formData.interviewDate)}</td>
                            </tr>
                            <tr className="border-b last:border-0">
                                <th className="text-left p-3 bg-muted/50 font-medium">Consular Post</th>
                                <td className="p-3">{formData.consularPost}</td>
                            </tr>
                            {formData.caseNumber && (
                                <tr className="border-b last:border-0">
                                    <th className="text-left p-3 bg-muted/50 font-medium">Case Number</th>
                                    <td className="p-3 font-mono">{formData.caseNumber}</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            <section>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs">B</span>
                    Requested Documents ({selectedCount})
                </h3>
                {selectedCount === 0 ? (
                    <div className="p-6 border-2 border-dashed rounded-lg text-center text-muted-foreground">
                        No documents selected. Go back to choose items from your letter.
                    </div>
                ) : (
                    <div className="border rounded-lg overflow-hidden bg-muted/30">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 border-b">
                                <tr>
                                    <th className="text-left p-3 font-semibold">Document</th>
                                    <th className="text-left p-3 font-semibold">Who Provides</th>
                                    <th className="text-left p-3 font-semibold">Method</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {Object.entries(selected221gItems)
                                  .filter(([, v]) => typeof v === "boolean" && v)
                                  .map(([key]) => (
                                    <tr key={key}>
                                        <td className="p-3 capitalize">{key.replace(/_/g, " ")}</td>
                                        <td className="p-3 opacity-70">As indicated</td>
                                        <td className="p-3 opacity-70">Courier/Letter</td>
                                    </tr>
                                  ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            {smartModeEnabled && smartClassification && (
              <section>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs">
                    S
                  </span>
                  Smart Insights
                </h3>
                <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-4">
                  <p className="text-sm text-emerald-900">
                    <span className="font-semibold">Scenario:</span>{" "}
                    {smartClassification.description}
                  </p>
                  <p className="mt-1 text-sm text-emerald-900">
                    <span className="font-semibold">Confidence:</span>{" "}
                    {smartClassification.confidence.toUpperCase()}
                  </p>
                  <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-emerald-900">
                    {smartClassification.nextSteps.map((step, idx) => (
                      <li key={`${idx}-${step}`}>{step}</li>
                    ))}
                  </ul>
                </div>
              </section>
            )}
        </div>

        <div className="flex gap-3 pt-6 border-t font-semibold">
          <Button variant="outline" onClick={goBack}>← Back to Checklist</Button>
          <Button onClick={handleGenerate} className="ml-auto bg-teal-600 hover:bg-teal-700 shadow-teal-900/10 shadow-lg" disabled={selectedCount === 0}>
            Generate Action Plan & Documents
          </Button>
        </div>
      </div>
    );
  };

  // ──────────────────────────────────────────────
  // Step 4 – Export Packet
  // ──────────────────────────────────────────────
  const StepExportPacket = () => {
    if (!outputs) return null;

    const copyToClipboard = (text: string) => {
      navigator.clipboard.writeText(text);
      alert("Copied to clipboard!");
    };

    const generateHtmlContent = (text: string, title: string) => {
        let htmlBody = '';
        let isTableOpen = false;

        text.split('\n').forEach((line) => {
            if (line.startsWith('# ')) { htmlBody += `<h1 style="font-size:24pt; font-weight:bold; margin-top:20pt; margin-bottom:12pt; border-bottom:1px solid #ddd; padding-bottom:5pt;">${line.substring(2)}</h1>`; return; }
            if (line.startsWith('## ')) { htmlBody += `<h2 style="font-size:18pt; font-weight:bold; margin-top:16pt; margin-bottom:10pt; color:#0d9488;">${line.substring(3)}</h2>`; return; }
            if (line.startsWith('### ')) { htmlBody += `<h3 style="font-size:14pt; font-weight:bold; margin-top:12pt; margin-bottom:8pt;">${line.substring(4)}</h3>`; return; }
            
            if (line.match(/^\*\*(.*?)\*\*$/)) {
               htmlBody += `<p style="font-weight:bold; margin-top:8pt; margin-bottom:8pt; color:#111;">${line.replace(/\*\*/g, '')}</p>`; return;
            }

            if (line.match(/^\|.+\|$/) && !line.match(/^\|[-\s|]+\|$/)) {
                const cells = line.split('|').filter(c => c.trim() !== '');
                const isHeader = !isTableOpen;
                
                if (isHeader) {
                    isTableOpen = true;
                    htmlBody += `<table style="width:100%; text-align:left; border-collapse:collapse; margin:15pt 0; border: 1px solid #ddd;">`;
                    htmlBody += `<thead style="background:#f9fafb; color:#374151;"><tr>`;
                    cells.forEach(c => htmlBody += `<th style="padding:8pt; border:1px solid #ddd; font-weight:bold;">${c.trim()}</th>`);
                    htmlBody += `</tr></thead><tbody>`;
                    return;
                } else {
                    htmlBody += `<tr>`;
                    cells.forEach(c => htmlBody += `<td style="padding:8pt; border:1px solid #ddd; color:#4b5563;">${c.trim()}</td>`);
                    htmlBody += `</tr>`;
                    return;
                }
            }
            if (line.match(/^\|[-\s|]+\|$/)) return;
            
            if (isTableOpen) {
                htmlBody += `</tbody></table>`;
                isTableOpen = false;
            }

            if (line.startsWith('☐ ')) {
                htmlBody += `<p style="margin-bottom:8pt; margin-top:4pt;">
                    <span style="font-size:16pt; margin-right:8pt; font-family:serif;">&#9744;</span>
                    ${line.substring(2)}
                </p>`;
                return;
            }

            if (line.startsWith('* ') || line.startsWith('- ')) {
                const txt = line.substring(2).trim();
                htmlBody += `<li style="margin-left:20pt; margin-bottom:6pt;">${txt}</li>`;
                return;
            }
            if (line.match(/^\d+\.\s/)) {
                htmlBody += `<li style="margin-left:20pt; margin-bottom:6pt;">${line.replace(/^\d+\.\s/, '')}</li>`;
                return;
            }

            if (line.trim() === '') { htmlBody += `<div style="height:10pt;"></div>`; return; }

            const parts = line.split(/(\*\*.*?\*\*)/g);
            let pContent = '';
            parts.forEach(p => {
                if (p.startsWith('**') && p.endsWith('**')) pContent += `<strong>${p.replace(/\*\*/g, '')}</strong>`;
                else pContent += p;
            });
            htmlBody += `<p style="margin-bottom:8pt;">${pContent}</p>`;
        });

        if (isTableOpen) htmlBody += `</tbody></table>`;

        return `
            <html>
                <head>
                    <meta charset="utf-8">
                    <title>${title}</title>
                    <style>
                        body { font-family: "Segoe UI", Tahoma, sans-serif; padding: 1in; line-height: 1.5; color: #333; }
                        h1, h2, h3 { color: #000; }
                        li { margin-bottom: 0.1in; }
                        table { border-collapse: collapse; width: 100%; border: 1pt solid #ccc; }
                        th, td { border: 1pt solid #ccc; padding: 8pt; text-align: left; }
                        @page { margin: 1in; }
                        @media print {
                            body { padding: 0; }
                        }
                    </style>
                </head>
                <body>
                    ${htmlBody}
                </body>
            </html>
        `;
    };

    const handleDownloadPDF = (text: string, title: string) => {
        const titleLabel = `221g_${title.replace(/\s+/g, '_')}_${formData.caseNumber || ''}`.replace(/_+$/, '');
        const content = generateHtmlContent(text, title);
        const win = window.open("", "_blank");
        if (win) {
            win.document.open();
            win.document.write(content);
            win.document.write(`<script>window.print(); setTimeout(() => window.close(), 1000);</script>`);
            win.document.close();
        }
    };

    const handleDownloadWord = (text: string, title: string) => {
        const titleLabel = `221g_${title.replace(/\s+/g, '_')}_${formData.caseNumber || ''}`.replace(/_+$/, '');
        const content = generateHtmlContent(text, title);
        const blob = new Blob(['\ufeff', content], {
            type: 'application/msword'
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${titleLabel}.doc`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };


    // ── Checkbox state for the Packet Checklist tab
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});
    const toggleCheck = (i: number) => setCheckedItems(prev => ({ ...prev, [i]: !prev[i] }));

    // Pre-parse markdown text into structured blocks for correct rendering
    const renderMarkdown = (text: string, isChecklist = false) => {
        const lines = text.split('\n');
        const nodes: React.ReactNode[] = [];

        // First pass: group table rows
        let i = 0;
        while (i < lines.length) {
            const line = lines[i];

            // ── Headings
            if (line.startsWith('# '))  { nodes.push(<h1 key={i} className="text-2xl font-bold mb-4 mt-6 pb-2 border-b border-slate-200 text-slate-900">{line.substring(2)}</h1>); i++; continue; }
            if (line.startsWith('## ')) { nodes.push(<h2 key={i} className="text-xl font-bold mb-3 mt-6 text-teal-700">{line.substring(3)}</h2>); i++; continue; }
            if (line.startsWith('### ')){ nodes.push(<h3 key={i} className="text-base font-bold mb-2 mt-4 text-slate-800">{line.substring(4)}</h3>); i++; continue; }

            // ── Markdown table: collect all consecutive table lines
            if (line.match(/^\|.+\|$/) && !line.match(/^\|[-\s|]+\|$/)) {
                const headerCells = line.split('|').filter(c => c.trim() !== '').map(c => c.trim());
                const rows: string[][] = [];
                let j = i + 1;
                if (j < lines.length && lines[j].match(/^\|[-\s|]+\|$/)) j++; // skip separator
                while (j < lines.length && lines[j].match(/^\|.+\|$/) && !lines[j].match(/^\|[-\s|]+\|$/)) {
                    rows.push(lines[j].split('|').filter(c => c.trim() !== '').map(c => c.trim()));
                    j++;
                }
                nodes.push(
                    <div key={i} className="my-4 border border-slate-200 rounded-lg overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50">
                                <tr>{headerCells.map((c, k) => <th key={k} className="px-4 py-3 font-semibold text-slate-700 border-r last:border-r-0 border-slate-200">{c}</th>)}</tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {rows.map((row, ri) => (
                                    <tr key={ri} className="hover:bg-slate-50">
                                        {row.map((c, k) => <td key={k} className="px-4 py-2.5 text-slate-600 border-r last:border-r-0 border-slate-100">{c}</td>)}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                );
                i = j;
                continue;
            }
            if (line.match(/^\|[-\s|]+\|$/)) { i++; continue; } // skip stray separators

            // ── Interactive Checkboxes (only in checklist tab)
            if (line.startsWith('\u2610 ')) {
                const idx = i;
                const label = line.substring(2);
                if (isChecklist) {
                    nodes.push(
                        <label key={i} className="flex items-center gap-3 mb-2 cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={!!checkedItems[idx]}
                                onChange={() => toggleCheck(idx)}
                                className="w-4 h-4 rounded accent-teal-600 cursor-pointer"
                            />
                            <span className={`text-sm leading-snug transition-colors ${checkedItems[idx] ? 'line-through text-slate-400' : 'text-slate-700'}`}>{label}</span>
                        </label>
                    );
                } else {
                    nodes.push(
                        <div key={i} className="flex items-start gap-2 mb-2">
                            <span className="text-slate-400 mt-0.5">&#9744;</span>
                            <span className="text-sm text-slate-700 leading-snug">{label}</span>
                        </div>
                    );
                }
                i++; continue;
            }

            // ── Bullet list (starts with * or -)
            if (line.startsWith('* ') || line.startsWith('- ')) {
                const txt = line.substring(2).trim();
                nodes.push(<li key={i} className="ml-5 mb-1.5 text-slate-700 text-sm list-disc">{renderInlineBold(txt)}</li>);
                i++; continue;
            }

            // ── Numbered list
            if (line.match(/^\d+\.\s/)) {
                const txt = line.replace(/^\d+\.\s/, '');
                nodes.push(<li key={i} className="ml-5 mb-1.5 text-slate-700 text-sm" style={{listStyleType:'decimal'}}>{renderInlineBold(txt)}</li>);
                i++; continue;
            }

            // ── Full-line bold (**text**)
            if (line.match(/^\*\*(.*?)\*\*$/)) {
                nodes.push(<p key={i} className="font-bold text-slate-900 text-sm mt-3 mb-1">{line.replace(/\*\*/g, '')}</p>);
                i++; continue;
            }

            // ── Empty line → spacer
            if (line.trim() === '') { nodes.push(<div key={i} className="h-3" />); i++; continue; }

            // ── Default paragraph (with inline bold handling)
            nodes.push(<p key={i} className="text-sm text-slate-700 mb-1.5 leading-relaxed">{renderInlineBold(line)}</p>);
            i++;
        }
        return nodes;
    };

    // Render inline **bold** text
    const renderInlineBold = (text: string): React.ReactNode => {
        const parts = text.split(/(\*\*.*?\*\*)/g);
        return <>{parts.map((p, j) => p.startsWith('**') && p.endsWith('**')
            ? <strong key={j} className="font-semibold text-slate-900">{p.slice(2, -2)}</strong>
            : <span key={j}>{p}</span>
        )}</>;
    };

    const docConfig = {
      actionPlan: {
        title: "Action Plan",
        subtitle: "Prioritized next steps and follow-up timeline.",
        icon: FileText,
      },
      checklist: {
        title: "Packet Checklist",
        subtitle: "Track required documents before final submission.",
        icon: ListChecks,
      },
      coverLetter: {
        title: "Cover Letter",
        subtitle: "Ready-to-print letter for embassy packet assembly.",
        icon: Mail,
      },
    } as const;

    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-50 via-white to-teal-50/70 p-5 md:p-6">
          <h2 className="text-2xl font-bold text-slate-900">Your 221(g) Response Package</h2>
          <p className="mt-1 text-sm text-slate-600">
            Review each document, copy or print instantly, and finalize your response packet.
          </p>
        </div>

        <Tabs defaultValue="actionPlan" className="w-full">
          <TabsList className="mb-5 grid h-auto w-full grid-cols-1 gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2 sm:grid-cols-3">
            <TabsTrigger value="actionPlan" className="rounded-lg py-2.5 text-slate-700 data-[state=active]:bg-white data-[state=active]:text-teal-700 data-[state=active]:shadow-sm">
              Action Plan
            </TabsTrigger>
            <TabsTrigger value="checklist" className="rounded-lg py-2.5 text-slate-700 data-[state=active]:bg-white data-[state=active]:text-teal-700 data-[state=active]:shadow-sm">
              Packet Checklist
            </TabsTrigger>
            <TabsTrigger value="coverLetter" className="rounded-lg py-2.5 text-slate-700 data-[state=active]:bg-white data-[state=active]:text-teal-700 data-[state=active]:shadow-sm">
              Cover Letter
            </TabsTrigger>
          </TabsList>

          {(["actionPlan", "checklist", "coverLetter"] as const).map((key) => {
            const config = docConfig[key];
            const Icon = config.icon;

            return (
              <TabsContent key={key} value={key} className="mt-0">
                <div className="mb-4 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg border border-teal-200 bg-teal-50 p-2 text-teal-700">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">{config.title}</h3>
                      <p className="text-xs text-slate-600">{config.subtitle}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={() => copyToClipboard(outputs[key])}>
                      <CopyIcon className="mr-2 h-3.5 w-3.5" />
                      Copy
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadPDF(outputs[key], config.title)}
                      className="border-teal-200 text-teal-700 hover:bg-teal-50"
                    >
                      <FileText className="mr-2 h-3.5 w-3.5" />
                      Download as PDF
                    </Button>
                    <Button
                      className="bg-teal-600 text-white hover:bg-teal-700"
                      size="sm"
                      onClick={() => handleDownloadWord(outputs[key], config.title)}
                    >
                      <FileDown className="mr-2 h-3.5 w-3.5" />
                      Download as Word
                    </Button>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm shadow-sm md:p-8">
                  {renderMarkdown(outputs[key], key === "checklist")}
                </div>
              </TabsContent>
            );
          })}
        </Tabs>

        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm italic text-amber-900">
          <strong>Important:</strong> These documents are generated from your inputs. Always follow your embassy&apos;s 221(g) letter if instructions differ.
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t pt-2">
          <Button variant="outline" onClick={goBack}>← Back to Review</Button>
          <Button
            variant="outline"
            onClick={() => setShowResetModal(true)}
            className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 hover:text-red-700 transition-colors"
          >
            Start Over
          </Button>
        </div>
      </div>
    );
  };

  // ──────────────────────────────────────────────
  // Main render
  // ──────────────────────────────────────────────
  return (
    <div className="w-full space-y-6 max-w-5xl mx-auto py-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <ProgressIndicator />
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowWelcome(true)}
          className="self-start border-slate-300 text-slate-700 hover:bg-slate-100"
        >
          <CircleHelp className="mr-2 h-4 w-4" />
          What&apos;s this?
        </Button>
      </div>
      <div className="bg-card rounded-2xl border border-border shadow-2xl overflow-hidden">
        <div className="p-6 md:p-10">
            {/* ── Step 1: Case Basics (inlined to prevent re-mount focus loss) ── */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="border-b pb-4">
                  <h2 className="text-2xl font-bold text-foreground">Case Basics</h2>
                  <p className="text-muted-foreground mt-1 text-sm">
                    Provide your basic case information to personalise your action plan.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="visaType">Visa Type *</Label>
                    <Select value={formData.visaType} onValueChange={(v) => handleField("visaType", v)}>
                      <SelectTrigger id="visaType">
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        {VISA_TYPES.map((t) => (
                          <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="visaCategory">Visa Category *</Label>
                    <Select value={formData.visaCategory} onValueChange={(v) => handleField("visaCategory", v)}>
                      <SelectTrigger id="visaCategory">
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        {VISA_CATEGORIES.map((c) => (
                          <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {formData.visaCategory === "other" && (
                  <div className="space-y-2">
                    <Label htmlFor="visaTypeOther">Specify Other Category</Label>
                    <Input
                      id="visaTypeOther"
                      value={formData.visaTypeOther}
                      onChange={(e) => handleField("visaTypeOther", e.target.value)}
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="interviewDate">Interview Date *</Label>
                    <Input
                      id="interviewDate"
                      type="date"
                      value={formData.interviewDate}
                      onChange={(e) => handleField("interviewDate", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ceacStatus">Current CEAC Status</Label>
                    <Select value={formData.ceacStatus} onValueChange={(v) => handleField("ceacStatus", v)}>
                      <SelectTrigger id="ceacStatus">
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        {CEAC_STATUSES.map((s) => (
                          <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Embassy Combobox */}
                <div className="space-y-2">
                  <Label htmlFor="consularPost">Consular Post / Embassy Location *</Label>
                  <div className="relative" ref={embassyRef}>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                      <Input
                        id="consularPost"
                        autoComplete="off"
                        value={embassySearchText}
                        onChange={(e) => handleEmbassyInputChange(e.target.value)}
                        onFocus={() => setShowEmbassySuggestions(true)}
                        placeholder="Search embassy or country…"
                        className="pl-9 pr-9"
                      />
                      <ChevronDown
                        className={`absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-transform ${showEmbassySuggestions ? "rotate-180" : ""}`}
                      />
                    </div>

                    {showEmbassySuggestions && (
                      <div className="absolute z-50 mt-1 w-full rounded-xl border border-border bg-popover shadow-xl overflow-hidden">
                        {/* Search hint */}
                        {embassySearchText && (
                          <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-muted/40">
                            <Search className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">Showing results for &ldquo;{embassySearchText}&rdquo;</span>
                          </div>
                        )}
                        <div className="max-h-64 overflow-y-auto">
                          {filteredEmbassies.length === 0 ? (
                            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                              <MapPin className="h-6 w-6 mx-auto mb-2 opacity-40" />
                              No embassy found. You can type a custom location.
                            </div>
                          ) : (
                            (() => {
                              const grouped: Record<string, typeof filteredEmbassies> = {};
                              filteredEmbassies.forEach((e) => {
                                if (!grouped[e.country]) grouped[e.country] = [];
                                grouped[e.country].push(e);
                              });
                              return Object.entries(grouped).map(([country, items]) => (
                                <div key={country}>
                                  <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-muted/50 sticky top-0">
                                    {country}
                                  </div>
                                  {items.map((embassy) => (
                                    <button
                                      key={embassy.value}
                                      type="button"
                                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors hover:bg-primary/5 focus:bg-primary/5 focus:outline-none ${
                                        formData.consularPost === embassy.value
                                          ? "bg-primary/10 text-primary font-semibold"
                                          : "text-foreground"
                                      }`}
                                      onMouseDown={(e) => {
                                        e.preventDefault(); // prevent input blur
                                        handleEmbassySelect(embassy.value);
                                      }}
                                    >
                                      <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                      {embassy.label}
                                      {formData.consularPost === embassy.value && (
                                        <span className="ml-auto text-primary text-xs">✓</span>
                                      )}
                                    </button>
                                  ))}
                                </div>
                              ));
                            })()
                          )}
                        </div>
                        {/* Custom entry option */}
                        {embassySearchText && !EMBASSY_OPTIONS.find(e => e.value.toLowerCase() === embassySearchText.toLowerCase()) && (
                          <div className="border-t border-border">
                            <button
                              type="button"
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left text-muted-foreground hover:bg-muted/50 transition-colors"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                handleEmbassySelect(embassySearchText);
                              }}
                            >
                              <Search className="h-3.5 w-3.5 shrink-0" />
                              Use &ldquo;{embassySearchText}&rdquo; as custom location
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="caseNumber">Case Number (optional)</Label>
                    <Input
                      id="caseNumber"
                      value={formData.caseNumber}
                      onChange={(e) => handleField("caseNumber", e.target.value)}
                      placeholder="ISL2024..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="beneficiaryName">Beneficiary Name (optional)</Label>
                    <Input
                      id="beneficiaryName"
                      value={formData.beneficiaryName}
                      onChange={(e) => handleField("beneficiaryName", e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="passportNumber">Passport Number (optional)</Label>
                    <Input
                      id="passportNumber"
                      value={formData.passportNumber}
                      onChange={(e) => handleField("passportNumber", e.target.value)}
                      placeholder="AA1234567"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Date of Birth (optional)</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      max={new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString().split("T")[0]}
                      min={new Date(new Date().setFullYear(new Date().getFullYear() - 120)).toISOString().split("T")[0]}
                      onChange={(e) => handleDobChange(e.target.value)}
                      className={dobError ? "border-red-500 focus-visible:ring-red-400" : ""}
                    />
                    {dobError && (
                      <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
                        <span className="inline-block w-3.5 h-3.5 rounded-full bg-red-100 text-red-600 text-center leading-[14px] font-bold text-[10px]">!</span>
                        {dobError}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t">
                  <Button
                    onClick={goNext}
                    disabled={!formData.visaType || !formData.visaCategory || !formData.interviewDate || !formData.consularPost || !!dobError}
                  >
                    Continue to Checklist →
                  </Button>
                </div>
              </div>
            )}
            {/* ── Step 2: Replicate Checklist ── */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <Actual221GFormChecker
                  selectedItems={selected221gItems}
                  onSelectionChange={setSelected221gItems}
                  onNext={goNext}
                  smartModeEnabled={smartModeEnabled}
                  consularPost={formData.consularPost}
                  visaType={formData.visaType}
                />
                <div className="flex gap-3 pt-4 border-t">
                  <Button variant="outline" onClick={goBack}>← Back</Button>
                </div>
              </div>
            )}
            {currentStep === 3 && <StepReviewGenerate />}
            {currentStep === 4 && <StepExportPacket />}
        </div>
      </div>

      <Dialog open={showWelcome} onOpenChange={handleWelcomeOpenChange}>
        <DialogContent className="max-w-5xl max-h-[92vh] flex flex-col overflow-hidden border-white/5 p-0 shadow-2xl bg-[#042f2e] bg-linear-to-br from-[#042f2e] via-[#0d6b6b] to-[#115e5e] text-white rounded-3xl">
          <div className="absolute top-5 right-5 z-20">
            <button
              onClick={() => handleWelcomeOpenChange(false)}
              className="p-2 rounded-2xl bg-white/10 border border-white/10 hover:bg-white/15 transition-colors focus:outline-none focus:ring-2 focus:ring-white/50 backdrop-blur-md shadow-sm"
              aria-label="Close modal"
              type="button"
            >
              <X className="w-5 h-5 text-white/85" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar w-full">
            <div className="px-6 pt-12 pb-4 bg-linear-to-b from-black/15 to-transparent backdrop-blur-sm">
              <div className="text-center">
                <p className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white/90 mb-3">
                  <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                  Guided Setup
                </p>
                <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white mb-3">
                  Welcome to the 221(g) Action Planner
                </h2>
                <p className="mt-2 text-sm md:text-base text-white/75 max-w-3xl mx-auto leading-relaxed flex items-center justify-center gap-2">
                  Follow a step-by-step workflow to build a cleaner, embassy-ready response packet {" "}
                  <CheckCircle2 className="w-5 h-5 text-teal-400" />
                </p>

                {/* Feature boxes */}
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 max-w-5xl mx-auto px-4 text-left">
                  <div className="rounded-2xl border border-teal-500/40 bg-teal-600/20 backdrop-blur-md p-4 flex gap-3 shadow-[0_16px_34px_rgba(0,0,0,0.15)]">
                    <span className="h-11 w-11 rounded-2xl grid place-items-center shrink-0 border border-white/10 bg-white/10 text-teal-400 shadow-sm">
                      <ShieldCheck className="w-5 h-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-extrabold text-white leading-snug">Avoid Pitfalls</div>
                      <div className="mt-1 text-xs text-white/70 leading-relaxed">Common mistakes that cause rejections.</div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-sky-500/40 bg-sky-600/20 backdrop-blur-md p-4 flex gap-3 shadow-[0_16px_34px_rgba(0,0,0,0.15)]">
                    <span className="h-11 w-11 rounded-2xl grid place-items-center shrink-0 border border-white/10 bg-white/10 text-sky-400 shadow-sm">
                      <ClipboardCheck className="w-5 h-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-extrabold text-white leading-snug">Guided Workflow</div>
                      <div className="mt-1 text-xs text-white/70 leading-relaxed">Step-by-step situation replication.</div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-amber-500/40 bg-amber-600/20 backdrop-blur-md p-4 flex gap-3 shadow-[0_16px_34px_rgba(0,0,0,0.15)]">
                    <span className="h-11 w-11 rounded-2xl grid place-items-center shrink-0 border border-white/10 bg-white/10 text-amber-400 shadow-sm">
                      <FolderCheck className="w-5 h-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-extrabold text-white leading-snug">Clean Output</div>
                      <div className="mt-1 text-xs text-white/70 leading-relaxed">Embassy-ready Packet & Checklist.</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Body content */}
            <div className="px-6 pb-6 mt-4">
              <div className="space-y-4 max-w-4xl mx-auto">
                {/* Collapsible Section 1 */}
                <div className="rounded-2xl border border-white/10 bg-white/10 backdrop-blur-sm overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setOpenWhatIs(!openWhatIs)}
                    className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-white/5 transition-colors"
                  >
                    <div>
                      <div className="text-sm font-extrabold tracking-wide text-white/95 uppercase">What is a 221(g)?</div>
                      {!openWhatIs && <div className="mt-1 text-sm text-white/70">Expand for description.</div>}
                    </div>
                    <div className="flex items-center gap-2">
                       <span className="text-sm font-semibold text-white/80">{openWhatIs ? "Hide" : "Learn more"}</span>
                       <span className={`inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 border border-white/10 text-white/85 transition-transform ${openWhatIs ? "rotate-180" : ""}`}>
                         <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                       </span>
                    </div>
                  </button>
                  <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${openWhatIs ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                    <div className="overflow-hidden">
                      <div className="px-5 pb-5 pt-0 text-[14px] md:text-[15px] leading-relaxed text-white/85 space-y-3">
                         <p>Section 221(g) of the Immigration and Nationality Act allows consular officers to temporarily refuse a visa application when additional documents or administrative processing is required. This is not a permanent denial; it is a hold pending resolution.</p>
                         <p className="text-xs italic text-white/50">Source: U.S. Department of State</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Collapsible Section 2 */}
                <div className="rounded-2xl border border-white/10 bg-white/10 backdrop-blur-sm overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setOpenFlow(!openFlow)}
                    className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-white/5 transition-colors"
                  >
                    <div>
                      <div className="text-sm font-extrabold tracking-wide text-white/95 uppercase">How this wizard works</div>
                      {!openFlow && <div className="mt-1 text-sm text-white/70">Fast, step-by-step flow.</div>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white/80">{openFlow ? "Hide" : "Learn more"}</span>
                      <span className={`inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 border border-white/10 text-white/85 transition-transform ${openFlow ? "rotate-180" : ""}`}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </span>
                    </div>
                  </button>
                  <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${openFlow ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                    <div className="overflow-hidden">
                       <div className="px-5 pb-5 pt-0">
                         <ol className="space-y-3 pt-2">
                            {[
                              "Replicate your 221(g) checklist letter using the guided form.",
                              "Review and confirm your case details before generation.",
                              "Generate an action plan, packet checklist, and cover letter.",
                              "Export documents and submit exactly per embassy instructions."
                            ].map((text, idx) => (
                              <li key={idx} className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 group hover:bg-white/10 transition-colors">
                                <span className="flex h-9 w-9 items-center justify-center rounded-2xl font-extrabold text-sm text-teal-900 bg-white shadow-sm shrink-0 mt-0.5">{idx + 1}</span>
                                <p className="text-[14px] md:text-[15px] leading-snug text-white/90 font-medium pt-1.5">{text}</p>
                              </li>
                            ))}
                         </ol>
                       </div>
                    </div>
                  </div>
                </div>

                {/* Collapsible Section 3 - What You'll Need */}
                <div className="rounded-2xl border border-white/10 bg-white/10 backdrop-blur-sm overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setOpenNeed(!openNeed)}
                    className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-white/5 transition-colors"
                  >
                    <div>
                      <div className="text-sm font-extrabold tracking-wide text-white/95 uppercase">What You&apos;ll Need</div>
                      {!openNeed && <div className="mt-1 text-sm text-white/70">Gather these before starting.</div>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white/80">{openNeed ? "Hide" : "Expand list"}</span>
                      <span className={`inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 border border-white/10 text-white/85 transition-transform ${openNeed ? "rotate-180" : ""}`}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </span>
                    </div>
                  </button>
                  <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${openNeed ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                    <div className="overflow-hidden">
                      <div className="px-5 pb-5 pt-0">
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                          {[
                            { icon: <FileText className="w-4 h-4" />, text: "Your 221(g) refusal letter" },
                            { icon: <ClipboardCheck className="w-4 h-4" />, text: "Case Number (e.g. ISL...)" },
                            { icon: <ShieldCheck className="w-4 h-4" />, text: "Passport details" },
                            { icon: <Mail className="w-4 h-4" />, text: "Beneficiary email & phone" }
                          ].map((item, idx) => (
                            <li key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 text-white/90 text-sm font-medium">
                              <span className="text-teal-400">{item.icon}</span>
                              {item.text}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Disclaimer card */}
                <div className="rounded-2xl border border-yellow-300/30 bg-yellow-400/10 backdrop-blur-md p-5 mt-6 border-dashed">
                  <div className="flex items-start gap-4">
                    <span className="h-10 w-10 rounded-full bg-yellow-400/20 flex items-center justify-center shrink-0">
                      <Info className="w-6 h-6 text-yellow-400" />
                    </span>
                    <div>
                      <p className="text-[15px] font-extrabold text-yellow-400 text-left">Important Note</p>
                      <p className="mt-1.5 text-[14px] leading-relaxed text-white/80 font-medium text-left">
                        This tool provides general guidance for Pakistan-based cases (Islamabad/Karachi) and is not legal advice. Always prioritize your official letter&apos;s instructions.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="pt-8 mt-6 border-t border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 pb-6 text-left">
                  <label className="flex items-center gap-3 cursor-pointer select-none group">
                    <div className="relative flex items-center justify-center">
                      <input
                        type="checkbox"
                        checked={dontShowAgain}
                        onChange={(e) => setDontShowAgain(e.target.checked)}
                        className="peer w-5 h-5 appearance-none rounded border-2 border-white/30 bg-white/10 checked:bg-teal-500 checked:border-teal-500 transition-all focus:outline-none"
                      />
                      <svg className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-white/70 group-hover:text-white transition-colors">
                      Don&apos;t show this again
                    </span>
                  </label>

                  <button
                    onClick={handleStartWizard}
                    className="px-10 py-3.5 rounded-2xl font-bold bg-white text-[#042f2e] hover:bg-teal-50 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_20px_40px_rgba(0,0,0,0.3)] flex items-center gap-2"
                  >
                    Start Planner
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmationModal
        open={showResetModal}
        onOpenChange={setShowResetModal}
        title="Start Over?"
        description="This will permanently erase all your current progress — your case details, selected checklist items, and any generated documents. This action cannot be undone."
        confirmText="Yes, Start Over"
        cancelText="Cancel"
        confirmVariant="danger"
        onConfirm={resetWizard}
      />
    </div>
  );
}
