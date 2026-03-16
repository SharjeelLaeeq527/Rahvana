"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CopyIcon,
  PrinterIcon,
  ArrowLeftIcon,
  SaveIcon,
  CheckCircle2,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { FormData, FormSelections } from "../types/221g";
import { classifySituation } from "../utils/classifier";
import { generateActionPlan as generateDynamicActionPlan } from "../utils/actionPlanGenerator";

interface ActionPlanResultsProps {
  formData: FormData | null;
  selectedItems: FormSelections | null;
  onBackToForm: () => void;
  onSaveToProfile: () => Promise<void>;
  planGeneratedAt?: number;
}

export default function ActionPlanResults({
  formData,
  selectedItems,
  onBackToForm,
  onSaveToProfile,
}: ActionPlanResultsProps) {
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  if (!formData || !selectedItems) {
    return (
      <div className="container mx-auto py-12 px-4 text-center">
        <p className="text-muted-foreground">Generating results...</p>
      </div>
    );
  }

  const formatDate = (d: string) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  const handlePrint = (text: string, title: string) => {
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(`
        <html>
          <head>
            <title>${title}</title>
            <style>
              body { font-family: sans-serif; padding: 40px; line-height: 1.6; max-width: 800px; margin: 0 auto; color: #333; }
              pre { white-space: pre-wrap; word-wrap: break-word; font-family: inherit; font-size: 11pt; }
              .header { border-bottom: 2px solid #eee; margin-bottom: 30px; padding-bottom: 10px; }
            </style>
          </head>
          <body>
            <div class="header"><h1>${title}</h1></div>
            <pre>${text}</pre>
            <script>window.print();</script>
          </body>
        </html>
      `);
      win.document.close();
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSaveToProfile();
      setSaveMessage("Saved to profile!");
      setTimeout(() => setSaveMessage(""), 3000);
    } catch (err) {
      alert("Failed to save to profile.");
    } finally {
      setSaving(false);
    }
  };

  // ──────────────────────────────────────────────
  // GENERATORS (Matching reference logic)
  // ──────────────────────────────────────────────

  const generateActionPlanText = () => {
    const cb = formData;
    const cl = selectedItems;
    const today = new Date().toLocaleDateString();

    const parsedItems = Object.keys(cl).filter(
      (key) => cl[key as keyof FormSelections] === true,
    );
    const classifications = classifySituation(cb, parsedItems);

    // Generate an action plan for every classification identified
    const dynamicPlans = classifications.map((classification) =>
      generateDynamicActionPlan(classification, parsedItems),
    );

    // Create a unified title
    const unifiedTitle = dynamicPlans.map((plan) => plan.title).join(" AND ");

    let plan = `# 221(g) ACTION PLAN: ${unifiedTitle}\n\n`;
    plan += `Generated: ${today}\n`;
    plan += `For: ${cb.beneficiaryName || "Beneficiary"}\n`;
    plan += `Case: ${cb.caseNumber || "Not provided"}\n\n`;

    plan += `## SUMMARY\n\n`;
    dynamicPlans.forEach((dynamicPlan) => {
      plan += `${dynamicPlan.description}\n\n`;
    });

    plan += `## ACTION STAGES\n\n`;

    let globalStageIndex = 1;

    dynamicPlans.forEach((dynamicPlan) => {
      plan += `### Requirement: ${dynamicPlan.title}\n\n`;
      dynamicPlan.stages.forEach((stage) => {
        plan += `#### Stage ${globalStageIndex++}: ${stage.title} (${stage.timeframe})\n\n`;

        plan += `**Actions:**\n`;
        stage.actions.forEach((action) => {
          plan += `- ${action}\n`;
        });
        plan += `\n`;

        if (stage.documents && stage.documents.length > 0) {
          plan += `**Documents to Prepare:**\n`;
          stage.documents.forEach((doc) => {
            plan += `- ${doc}\n`;
          });
          plan += `\n`;
        }

        plan += `**Tips:**\n`;
        stage.tips.forEach((tip) => {
          plan += `💡 ${tip}\n`;
        });
        plan += `\n`;
      });
      plan += `---\n\n`;
    });

    plan += `## FINAL REMINDERS\n\n`;
    plan += `✓ Follow your embassy's 221(g) letter instructions above all else\n`;
    plan += `✓ Submit ONLY what was requested\n`;
    plan += `✓ Keep copies of everything you submit\n`;

    plan += `## IMPORTANT DISCLAIMER\n\n`;
    plan += `This action plan is based on the information you provided and is for general guidance only. It is NOT legal advice. Always follow your embassy's 221(g) letter instructions if anything differs from this plan. Documents must be submitted via an approved Collection Center within one year of refusal, not mailed directly to the embassy unless specifically requested.\n\n`;

    return plan;
  };

  const generatePacketChecklist = () => {
    const cl = selectedItems;
    let checklist = `# PACKET ASSEMBLY CHECKLIST\n\n`;
    checklist += `Assemble your documents in this order:\n\n`;

    let num = 1;
    checklist += `${num++}. Cover Letter\n`;
    checklist += `${num++}. Copy of 221(g) Letter\n`;

    if (cl.passport) checklist += `${num++}. Passport (original)\n`;
    if (cl.medical_examination)
      checklist += `${num++}. Medical Examination Results (sealed envelope)\n`;

    if (cl.i864_affidavit) {
      checklist += `\n**SPONSOR DOCUMENTS**\n\n`;
      checklist += `${num++}. I-864 Affidavit of Support (signed, dated)\n`;
      checklist += `${num++}. IRS Tax Return Transcript(s)\n`;
    }

    const civilDocs = [];
    if (cl.nadra_birth_cert) civilDocs.push("NADRA Birth Certificate");
    if (cl.nadra_marriage_cert) civilDocs.push("NADRA Marriage Certificate");
    if (cl.nikah_nama) {
      civilDocs.push("Original Nikah Nama");
      civilDocs.push("Computerized Marriage Registration Certificate (MRC)");
      civilDocs.push("Beneficiary's CNIC (showing husband's name)");
    }
    if (cl.nadra_divorce_cert) civilDocs.push("NADRA Divorce Certificate");

    if (civilDocs.length > 0) {
      checklist += `\n**CIVIL DOCUMENTS**\n\n`;
      civilDocs.forEach((doc) => {
        checklist += `${num++}. ${doc} (original)\n`;
      });
    }

    checklist += `\n## FINAL CHECKS\n\n`;
    checklist += `☐ Cover letter is signed and dated\n`;
    checklist += `☐ All documents are in the correct order\n`;
    checklist += `☐ You have kept photocopies of everything\n`;

    return checklist;
  };

  const generateCoverLetterText = () => {
    const cb = formData;
    const cl = selectedItems;
    const today = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    let letter = `${today}\n\n`;
    letter += `${cb.consularPost}\n`;
    letter += `Immigrant Visa Unit\n\n`;
    letter += `**Subject: Response to INA 221(g) Refusal`;
    if (cb.caseNumber) letter += ` – Case Number: ${cb.caseNumber}`;
    letter += `**\n\n`;

    letter += `Dear Consular Officer,\n\n`;
    letter += `I am writing in response to the Section 221(g) refusal issued following my interview on ${formatDate(cb.interviewDate)}. I am submitting the requested documents as instructed.\n\n`;

    letter += `**Applicant Information:**\n`;
    letter += `- Full Name: ${cb.beneficiaryName || "[Your Full Name]"}\n`;
    if (cb.passportNumber)
      letter += `- Passport Number: ${cb.passportNumber}\n`;
    letter += `- Interview Date: ${formatDate(cb.interviewDate)}\n`;
    letter += `- Case Number: ${cb.caseNumber || "Not provided"}\n`;
    letter += `- Visa Category: ${cb.visaCategory}\n\n`;

    letter += `**Enclosed Documents:**\n\n`;
    const docs = [];
    if (cl.passport) docs.push("Passport (original)");
    if (cl.medical_examination)
      docs.push("Medical examination results (sealed)");
    if (cl.i864_affidavit) {
      docs.push("I-864 Affidavit of Support");
      docs.push("Tax and financial evidence");
    }
    if (cl.nadra_birth_cert) docs.push("NADRA Birth Certificate (original)");
    if (cl.nadra_marriage_cert)
      docs.push("NADRA Marriage Certificate (original)");
    if (cl.nikah_nama) {
      docs.push("Original Nikah Nama");
      docs.push(
        "Computerized Marriage Registration Certificate (MRC) (original)",
      );
      docs.push("Beneficiary's CNIC showing husband's name (copy)");
    }

    docs.forEach((doc, i) => {
      letter += `${i + 1}. ${doc}\n`;
    });

    letter += `\nAll documents are submitted in accordance with the instructions provided in the 221(g) letter.\n\n`;
    letter += `Sincerely,\n\n`;
    letter += `${cb.beneficiaryName || "[Your Full Name]"}\n`;

    return letter;
  };

  const outputs = {
    actionPlan: generateActionPlanText(),
    checklist: generatePacketChecklist(),
    coverLetter: generateCoverLetterText(),
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Your 221(g) Response Package
          </h1>
          <p className="text-muted-foreground mt-1">
            Your personalized documents are ready. Review, print, or copy as
            needed.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onBackToForm}>
            <ArrowLeftIcon className="w-4 h-4 mr-2" /> Back
          </Button>
          <Button
            className="bg-teal-600 hover:bg-teal-700"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              "Saving..."
            ) : saveMessage ? (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" /> {saveMessage}
              </>
            ) : (
              <>
                <SaveIcon className="w-4 h-4 mr-2" /> Save to Profile
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-800 text-sm flex gap-3">
        <span className="text-xl">⚠️</span>
        <p>
          <strong>Important:</strong> These documents are based on the
          information you provided. Always follow your embassy&apos;s 221(g)
          letter instructions if anything differs. This is not legal advice.
        </p>
      </div>

      <Tabs defaultValue="actionPlan" className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-12">
          <TabsTrigger value="actionPlan">Action Plan</TabsTrigger>
          <TabsTrigger value="checklist">Packet Checklist</TabsTrigger>
          <TabsTrigger value="coverLetter">Cover Letter</TabsTrigger>
        </TabsList>

        {(["actionPlan", "checklist", "coverLetter"] as const).map((key) => (
          <TabsContent
            key={key}
            value={key}
            className="mt-4 ring-offset-background focus-visible:outline-none"
          >
            <Card className="border-2">
              <CardHeader className="bg-muted/30 border-b py-3 px-6">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    {key === "actionPlan"
                      ? "Action Plan"
                      : key === "checklist"
                        ? "Packet Assembly"
                        : "Cover Letter"}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2"
                      onClick={() => handleCopy(outputs[key])}
                    >
                      <CopyIcon className="w-4 h-4 mr-1.5" /> Copy
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2"
                      onClick={() => handlePrint(outputs[key], key)}
                    >
                      <PrinterIcon className="w-4 h-4 mr-1.5" /> Print
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="bg-white p-8 md:p-12 text-slate-800 overflow-auto max-h-[600px] leading-relaxed font-serif whitespace-pre-wrap selection:bg-teal-100 italic md:not-italic">
                  {/* Applying a cleaner look for the output */}
                  <div className="prose prose-slate max-w-none">
                    {outputs[key]}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      <div className="text-center pt-8 border-t text-sm text-muted-foreground">
        Need help? Contact the Rahvana team or consult an immigration attorney.
      </div>
    </div>
  );
}
