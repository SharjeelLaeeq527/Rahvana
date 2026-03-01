"use client";

import { useState } from "react";
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
import { CopyIcon, PrinterIcon, RefreshCcw } from "lucide-react";
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
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("hide221gWelcome");
      if (!saved) setShowWelcome(true);
    }
  });

  const handleStartWizard = () => {
    if (dontShowAgain) {
      localStorage.setItem("hide221gWelcome", "true");
    }
    setShowWelcome(false);
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

  const resetWizard = () => {
    if (confirm("Are you sure you want to start over? All progress will be lost.")) {
      setFormData(EMPTY_FORM);
      setSelected221gItems({});
      setOutputs(null);
      setCurrentStep(1);
    }
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
    plan += `Your visa interview on ${formatDate(cb.interviewDate)} at ${cb.consularPost} resulted in a temporary refusal under INA Section 221(g). This means the consular officer needs additional documents or administrative processing before making a final decision.\n\n`;
    
    const itemCount = Object.values(cl).filter(Boolean).length;
    plan += `Based on your checklist, you must submit the following:\n`;
    plan += `- ${itemCount} total items requested\n`;
    if (cl.i864_affidavit) plan += `- Financial sponsorship documents (I-864 package)\n`;
    if (cl.passport) plan += `- Your passport for visa placement\n`;
    if (cl.admin_processing) plan += `- Additional administrative processing (timing varies)\n\n`;
    
    plan += `## IMMEDIATE NEXT STEPS\n\n`;
    plan += `1. **Gather Documents by Provider**\n\n`;
    
    // Beneficiary docs
    const benDocs = [];
    if (cl.passport) benDocs.push('Passport');
    if (cl.medical_examination) benDocs.push('Medical examination results');
    if (cl.police_certificate) benDocs.push(`Police certificate (${cl.police_certificate_country || 'specified country'})`);
    if (cl.nadra_birth_cert_beneficiary) benDocs.push('NADRA Birth Certificate');
    if (cl.nadra_divorce_cert_beneficiary) benDocs.push('NADRA Divorce Certificate');
    if (cl.death_certificate) benDocs.push(`Death Certificate (${cl.death_certificate_name || 'specified person'})`);
    
    if (benDocs.length > 0) {
        plan += `   **Beneficiary to provide:**\n`;
        benDocs.forEach(doc => plan += `   - ${doc}\n`);
        plan += `\n`;
    }
    
    // Petitioner docs
    const petDocs = [];
    if (cl.i864_affidavit || cl.i864_petitioner) {
        petDocs.push('I-864 Affidavit of Support');
        petDocs.push('Tax returns and financial evidence');
    }
    if (cl.us_divorce_decree) petDocs.push('U.S. Divorce Decree');
    if (cl.nadra_birth_cert_petitioner) petDocs.push('NADRA Birth Certificate');
    if (cl.nadra_divorce_cert_petitioner) petDocs.push('NADRA Divorce Certificate');
    
    if (petDocs.length > 0) {
        plan += `   **Petitioner to provide:**\n`;
        petDocs.forEach(doc => plan += `   - ${doc}\n`);
        plan += `\n`;
    }

    // Joint sponsor
    if (cl.i864_joint_sponsor) {
        plan += `   **Joint Sponsor to provide:**\n`;
        plan += `   - I-864 Affidavit of Support\n`;
        plan += `   - Tax returns and financial evidence\n`;
        plan += `   - Proof of U.S. status and domicile\n\n`;
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
        plan += `   - **IRS Tax Return Transcript (PREFERRED):** Order at https://www.irs.gov/individuals/get-transcript\n`;
        plan += `     This is the IRS-generated transcript of your tax return, not the return itself.\n`;
        plan += `   - Form 1040 (if transcript unavailable): Photocopy of complete return\n`;
        plan += `   - W-2 forms: For all employment income\n\n`;

        plan += `4. Proof of Status:\n`;
        plan += `   - U.S. Birth Certificate, U.S. Passport, or Naturalization Certificate\n`;
        plan += `   - Proof of U.S. domicile: Lease, mortgage, utility bills, employment letter\n\n`;

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
        plan += `**What to submit:** DNA test results from a AABB-accredited laboratory.\n`;
        plan += `**Who provides:** ${cl.dna_test_name || 'Specified parties'}\n`;
        plan += `**How to prepare:** Contact the embassy for approved laboratory list. Both parties must test at approved facilities.\n`;
        plan += `**Common mistakes to avoid:**\n`;
        plan += `- Using a non-approved laboratory\n`;
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
    
    let letter = `${today}\n\n`;
    letter += `${cb.consularPost}\n`;
    letter += `Immigrant Visa Unit\n\n`;
    letter += `**Subject: Response to INA 221(g) Refusal`;
    if (cb.caseNumber) letter += ` – Case Number: ${cb.caseNumber}`;
    if (cb.beneficiaryName) letter += ` – ${cb.beneficiaryName}`;
    letter += `**\n\n`;
    
    letter += `Dear Consular Officer,\n\n`;
    
    letter += `I am writing in response to the Section 221(g) refusal issued following my immigrant visa interview on ${formatDate(cb.interviewDate)}. `;
    letter += `I am submitting the requested documents as instructed.\n\n`;
    
    letter += `**Applicant Information:**\n`;
    if (cb.beneficiaryName) letter += `- Full Name: ${cb.beneficiaryName}\n`;
    if (cb.passportNumber) letter += `- Passport Number: ${cb.passportNumber}\n`;
    letter += `- Interview Date: ${formatDate(cb.interviewDate)}\n`;
    if (cb.caseNumber) letter += `- Case Number: ${cb.caseNumber}\n`;
    letter += `- Visa Category: ${cb.visaCategory}\n\n`;

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

  // ──────────────────────────────────────────────
  // Step 1 – Case Basics
  // ──────────────────────────────────────────────
  const StepCaseBasics = () => (
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
          <Input id="visaTypeOther" value={formData.visaTypeOther} onChange={(e) => handleField("visaTypeOther", e.target.value)} />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="interviewDate">Interview Date *</Label>
          <Input id="interviewDate" type="date" value={formData.interviewDate} onChange={(e) => handleField("interviewDate", e.target.value)} />
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

      <div className="space-y-2">
        <Label htmlFor="consularPost">Consular Post / Embassy Location *</Label>
        <Input id="consularPost" value={formData.consularPost} onChange={(e) => handleField("consularPost", e.target.value)} placeholder="e.g. U.S. Embassy Islamabad" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="caseNumber">Case Number (optional)</Label>
          <Input id="caseNumber" value={formData.caseNumber} onChange={(e) => handleField("caseNumber", e.target.value)} placeholder="ISL2024..." />
        </div>
        <div className="space-y-2">
          <Label htmlFor="beneficiaryName">Beneficiary Name (optional)</Label>
          <Input id="beneficiaryName" value={formData.beneficiaryName} onChange={(e) => handleField("beneficiaryName", e.target.value)} />
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t">
        <Button onClick={goNext} disabled={!formData.visaType || !formData.visaCategory || !formData.interviewDate || !formData.consularPost}>
          Continue to Checklist →
        </Button>
      </div>
    </div>
  );

  // ──────────────────────────────────────────────
  // Step 2 – Replicate Checklist
  // ──────────────────────────────────────────────
  const StepChecklistReplication = () => (
    <div className="space-y-6">

      <Actual221GFormChecker
        selectedItems={selected221gItems}
        onSelectionChange={setSelected221gItems}
        onNext={goNext}
        smartModeEnabled={smartModeEnabled}
      />

      <div className="flex gap-3 pt-4 border-t">
        <Button variant="outline" onClick={goBack}>← Back</Button>
      </div>
    </div>
  );

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

    const printContent = (text: string, title: string) => {
        let htmlBody = '';
        let isTableOpen = false;

        text.split('\n').forEach((line) => {
            if (line.startsWith('# ')) { htmlBody += `<h1 class="font-bold text-2xl mt-6 mb-4 border-b pb-2">${line.substring(2)}</h1>`; return; }
            if (line.startsWith('## ')) { htmlBody += `<h2 class="font-bold text-xl mt-6 mb-3 text-teal-700">${line.substring(3)}</h2>`; return; }
            if (line.startsWith('### ')) { htmlBody += `<h3 class="font-bold text-lg mt-4 mb-2">${line.substring(4)}</h3>`; return; }
            
            if (line.match(/^\*\*(.*?)\*\*$/)) {
               htmlBody += `<p class="font-bold my-2 text-slate-900">${line.replace(/\*\*/g, '')}</p>`; return;
            }

            if (line.match(/^\|.+\|$/) && !line.match(/^\|[-\s|]+\|$/)) {
                const cells = line.split('|').filter(c => c.trim() !== '');
                const isHeader = !isTableOpen;
                
                if (isHeader) {
                    isTableOpen = true;
                    htmlBody += `<table style="width:100%; text-align:left; border-collapse:collapse; margin:20px 0; border: 1px solid #e2e8f0;">`;
                    htmlBody += `<thead style="background:#f8fafc; color:#334155;"><tr>`;
                    cells.forEach(c => htmlBody += `<th style="padding:10px; border:1px solid #e2e8f0;">${c.trim()}</th>`);
                    htmlBody += `</tr></thead><tbody>`;
                    return;
                } else {
                    htmlBody += `<tr>`;
                    cells.forEach(c => htmlBody += `<td style="padding:10px; border:1px solid #e2e8f0; color:#475569;">${c.trim()}</td>`);
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
                htmlBody += `<div style="display:flex; align-items:flex-start; margin-bottom:8px; line-height:1.2;">
                    <span style="font-size:24px; margin-right:8px; display:inline-block; font-family:sans-serif;">&#9744;</span>
                    <span style="display:inline-block; margin-top:4px;">${line.substring(2)}</span>
                </div>`;
                return;
            }

            if (line.startsWith('* ') || line.startsWith('- ')) {
                const txt = line.substring(2).trim();
                htmlBody += `<li style="margin-left:24px; margin-bottom:8px; padding-left:8px;">${txt}</li>`;
                return;
            }
            if (line.match(/^\d+\.\s/)) {
                htmlBody += `<li style="margin-left:24px; margin-bottom:8px; padding-left:8px;">${line.replace(/^\d+\.\s/, '')}</li>`;
                return;
            }

            if (line.trim() === '') { htmlBody += `<div style="height:16px;"></div>`; return; }

            const parts = line.split(/(\*\*.*?\*\*)/g);
            let pContent = '';
            parts.forEach(p => {
                if (p.startsWith('**') && p.endsWith('**')) pContent += `<strong>${p.replace(/\*\*/g, '')}</strong>`;
                else pContent += p;
            });
            htmlBody += `<p style="margin-bottom:8px;">${pContent}</p>`;
        });

        if (isTableOpen) htmlBody += `</tbody></table>`;

        const win = window.open("", "_blank");
        if (win) {
            win.document.write(`
                <html>
                    <head>
                        <title>${title}</title>
                        <style>
                            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; line-height: 1.6; max-width: 800px; margin: 0 auto; color: #334155; }
                            h1, h2, h3 { color: #0f172a; }
                            .header { border-bottom: 2px solid #e2e8f0; margin-bottom: 30px; padding-bottom: 10px; }
                            h1 { font-size: 24px; font-weight: bold; margin-bottom:16px;}
                            h2 { font-size: 20px; font-weight: bold; margin-top: 32px; margin-bottom:16px; color:#0f766e;}
                            h3 { font-size: 18px; font-weight: bold; margin-top: 24px; margin-bottom:8px;}
                            @media print {
                                body { padding: 0; max-width: none; }
                                .header { display:none; }
                            }
                        </style>
                    </head>
                    <body>
                        <div class="header"><h1>${title}</h1></div>
                        ${htmlBody}
                        <script>window.print(); setTimeout(() => window.close(), 500);</script>
                    </body>
                </html>
            `);
            win.document.close();
        }
    };


    // ── Checkbox state for the Packet Checklist tab
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

    return (
      <div className="space-y-6">
        <div className="border-b pb-4">
          <h2 className="text-2xl font-bold text-foreground">Your 221(g) Response Package</h2>
          <p className="text-muted-foreground mt-1 text-sm">Your personalized documents are ready. Review, print, or copy as needed.</p>
        </div>

        <Tabs defaultValue="actionPlan" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="actionPlan">Action Plan</TabsTrigger>
            <TabsTrigger value="checklist">Packet Checklist</TabsTrigger>
            <TabsTrigger value="coverLetter">Cover Letter</TabsTrigger>
          </TabsList>

          {(["actionPlan", "checklist", "coverLetter"] as const).map((key) => (
            <TabsContent key={key} value={key} className="mt-0">
              {/* No max-h, no scroll — shows full content like reference HTML */}
              <div className="border border-slate-200 rounded-xl p-6 md:p-8 bg-white text-sm font-sans">
                {renderMarkdown(outputs[key], key === 'checklist')}
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                <Button variant="outline" size="sm" onClick={() => copyToClipboard(outputs[key])}>
                  <CopyIcon className="w-3.5 h-3.5 mr-2" /> Copy to Clipboard
                </Button>
                <Button className="bg-teal-600 hover:bg-teal-700 text-white" size="sm" onClick={() => {
                  const titles: Record<string, string> = { actionPlan: 'Action Plan', checklist: 'Packet Checklist', coverLetter: 'Cover Letter' };
                  printContent(outputs[key], titles[key]);
                }}>
                  <PrinterIcon className="w-3.5 h-3.5 mr-2" /> Print {key === 'actionPlan' ? 'Action Plan' : key === 'checklist' ? 'Checklist' : 'Cover Letter'}
                </Button>
              </div>
            </TabsContent>
          ))}
        </Tabs>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-800 text-sm italic mt-2 mb-6">
            <strong>Important:</strong> These documents are based on the information you provided. Always follow your embassy's 221(g) letter instructions if anything differs.
        </div>

        <div className="flex flex-wrap gap-4 justify-between items-center pt-2 border-t">
          <div className="flex gap-3">
            <Button variant="outline" onClick={goBack}>← Back to Review</Button>
          </div>
          <Button variant="outline" onClick={resetWizard}>
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
      <ProgressIndicator />
      <div className="bg-card rounded-2xl border border-border shadow-2xl overflow-hidden">
        <div className="p-6 md:p-10">
            {currentStep === 1 && <StepCaseBasics />}
            {currentStep === 2 && <StepChecklistReplication />}
            {currentStep === 3 && <StepReviewGenerate />}
            {currentStep === 4 && <StepExportPacket />}
        </div>
      </div>

      <Dialog open={showWelcome} onOpenChange={setShowWelcome}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Welcome to the 221(g) Action Planner</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 pt-4 text-sm leading-relaxed">
            <section>
              <h3 className="font-bold text-lg text-teal-700 mb-2">What is a 221(g)?</h3>
              <p className="text-muted-foreground">
                Section 221(g) of the Immigration and Nationality Act allows consular officers to temporarily refuse a visa application when additional documents or administrative processing is required. This is <strong className="text-foreground">not a permanent denial</strong> – it's a hold pending resolution.
              </p>
              <p className="text-xs mt-2 italic">Source: U.S. Department of State</p>
            </section>

            <section>
              <h3 className="font-bold text-lg text-teal-700 mb-2">How This Wizard Works</h3>
              <ol className="list-decimal pl-5 space-y-2 text-muted-foreground">
                <li><strong className="text-foreground">Manually replicate</strong> your 221(g) checklist letter using our form</li>
                <li><strong className="text-foreground">Review</strong> and confirm your case details</li>
                <li><strong className="text-foreground">Generate</strong> a personalized action plan, packet checklist, and cover letter</li>
                <li><strong className="text-foreground">Export</strong> your documents and submit per your embassy's instructions</li>
              </ol>
            </section>

            <section>
              <h3 className="font-bold text-lg text-teal-700 mb-2">What You'll Need</h3>
              <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                <li>Your 221(g) letter from the embassy</li>
                <li>Case details (interview date, visa category, etc.)</li>
                <li>Sponsor information (if financial documents are requested)</li>
              </ul>
            </section>

            <div className="bg-muted p-4 rounded-lg border text-xs italic">
              <strong>Important Disclaimer:</strong> This tool provides general guidance and is not legal advice. Always follow your embassy's 221(g) letter instructions if anything differs. For complex cases, consult an immigration attorney.
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 border-t pt-4">
            <div className="flex items-center space-x-2">
              <Checkbox id="dontShowAgain" checked={dontShowAgain} onCheckedChange={(v) => setDontShowAgain(!!v)} />
              <Label htmlFor="dontShowAgain" className="text-xs text-muted-foreground cursor-pointer">Don't show this again</Label>
            </div>
            <Button onClick={handleStartWizard} className="bg-teal-600 hover:bg-teal-700 w-full sm:w-auto px-8">
              Start Wizard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
