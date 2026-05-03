"use client";

import { useState, useMemo } from "react";
import {
  CopyIcon,
  CheckCircle2,
  FileText,
  ClipboardList,
  Clock,
  Check,
  AlertCircle,
  Lightbulb,
  FileDigit,
  ChevronLeft,
  ChevronRight,
  Upload,
  Download,
  RefreshCw,
} from "lucide-react";
import { FormData, FormSelections } from "../types/221g";
import { classifySituation } from "../utils/classifier";
import {
  generateActionPlan as generateDynamicActionPlan,
  ActionPlan,
  ActionStage,
} from "../utils/actionPlanGenerator";
import { useDocumentVaultStore } from "@/lib/document-vault/store";
import { toast } from "sonner";

interface ActionPlanResultsProps {
  formData: FormData | null;
  selectedItems: FormSelections | null;
  onBackToForm: () => void;
  onSaveToProfile: () => Promise<void>;
  planGeneratedAt?: number;
  guard?: () => boolean;
}

/* ─── Doc item type ─────────────────────────────────────────── */
interface DocItem {
  id: string;
  vaultId?: string;
  label: string;
  sub: string;
  alwaysShow?: boolean; // items like the 221g letter itself
}

/* ─── Map FormSelections → checklist items ──────────────────── */
function buildDocItems(cl: FormSelections): DocItem[] {
  const items: DocItem[] = [];

  // Always first — the letter itself (no upload needed, just reference)
  items.push({
    id: "221g_letter",
    label: "221(g) Refusal Letter / Slip",
    sub: "The original notice from the consular officer — keep your physical copy",
    alwaysShow: true,
  });

  if (cl.passport)
    items.push({
      id: "passport",
      vaultId: "passport-beneficiary",
      label: "Beneficiary Passport (Original)",
      sub: "Submit via courier to the embassy",
    });

  if (cl.medical_examination)
    items.push({
      id: "medical_examination",
      vaultId: "medical-results-envelope",
      label: "Sealed Medical Examination Envelope",
      sub: "From panel physician — do not open the sealed envelope",
    });

  if (cl.nadra_family_reg)
    items.push({
      id: "nadra_family_reg",
      vaultId: "nadra-mrc",
      label: cl.nadra_family_reg_name
        ? `NADRA Family Registration Certificate — ${cl.nadra_family_reg_name}`
        : "NADRA Family Registration Certificate",
      sub: "Computerised Family Registration Certificate (FRC)",
    });

  if (cl.nadra_birth_cert_beneficiary)
    items.push({
      id: "birth_cert_ben",
      vaultId: "birth-cert-beneficiary",
      label: "NADRA Birth Certificate — Beneficiary",
      sub: "Computerised birth certificate from NADRA",
    });

  if (cl.nadra_birth_cert_petitioner)
    items.push({
      id: "birth_cert_pet",
      label: "NADRA Birth Certificate — Petitioner",
      sub: "Computerised birth certificate from NADRA",
    });

  if (cl.nadra_marriage_cert)
    items.push({
      id: "nadra_marriage_cert",
      vaultId: "nadra-mrc",
      label: "NADRA Marriage Registration Certificate",
      sub: "Computerised marriage certificate from NADRA",
    });

  if (cl.nikah_nama)
    items.push({
      id: "nikah_nama",
      vaultId: "nikah-nama",
      label: "Original Nikah Nama",
      sub: "Include all pages and annexures",
    });

  if (cl.nadra_divorce_cert_beneficiary)
    items.push({
      id: "divorce_cert_ben",
      vaultId: "divorce-decree-beneficiary",
      label: "NADRA Divorce Certificate — Beneficiary",
      sub: "Computerised divorce certificate / Talaqnama from NADRA",
    });

  if (cl.nadra_divorce_cert_petitioner)
    items.push({
      id: "divorce_cert_pet",
      vaultId: "divorce-decree-beneficiary",
      label: "NADRA Divorce Certificate — Petitioner",
      sub: "Computerised divorce certificate from NADRA",
    });

  if (cl.us_divorce_decree)
    items.push({
      id: "us_divorce",
      label: "U.S. Divorce Decree",
      sub: "Court-issued final divorce decree",
    });

  if (cl.death_certificate)
    items.push({
      id: "death_cert",
      vaultId: "death-cert-prior-spouse",
      label: cl.death_certificate_name
        ? `Death Certificate — ${cl.death_certificate_name}`
        : "Death Certificate",
      sub: "Death certificate of deceased spouse",
    });

  if (cl.police_certificate)
    items.push({
      id: "police_cert",
      vaultId: "police-certificate-pakistan",
      label: cl.police_certificate_country
        ? `Police Clearance Certificate — ${cl.police_certificate_country}`
        : "Police Clearance Certificate",
      sub: "Character certificate from police / relevant authorities",
    });

  if (cl.english_translation)
    items.push({
      id: "translation",
      vaultId: "certified-translations",
      label: cl.english_translation_document
        ? `Certified English Translation — ${cl.english_translation_document}`
        : "Certified English Translations",
      sub: "Full certified translation by a qualified translator",
    });

  if (cl.i864_affidavit)
    items.push({
      id: "i864",
      vaultId: "i-864-affidavit",
      label: "Form I-864 — Affidavit of Support",
      sub: "Completed and signed by petitioner or joint sponsor",
    });

  if (cl.i864a)
    items.push({
      id: "i864a",
      vaultId: "i-864a-contract",
      label: "Form I-864A — Household Member Contract",
      sub: "Required if household member is contributing income",
    });

  if (cl.tax_1040 || cl.irs_transcript)
    items.push({
      id: "tax_returns",
      vaultId: "tax-returns-petitioner",
      label: "Federal Tax Returns / IRS Transcripts",
      sub: cl.i864_tax_years
        ? `Years: ${cl.i864_tax_years}`
        : "Most recent tax years",
    });

  if (cl.w2)
    items.push({
      id: "w2",
      vaultId: "w2-forms",
      label: "W-2 Wage & Tax Statements",
      sub: "Must match the tax return years provided",
    });

  if (cl.proof_citizenship)
    items.push({
      id: "citizenship",
      vaultId: "passport-petitioner",
      label: "Proof of U.S. Citizenship / LPR Status",
      sub: "Petitioner's U.S. passport, naturalisation certificate, or green card",
    });

  if (cl.domicile)
    items.push({
      id: "domicile",
      vaultId: "domicile-certificate",
      label: "Evidence of U.S. Domicile",
      sub: "Lease, utility bills, or declaration of intent",
    });

  if (cl.dna_test)
    items.push({
      id: "dna",
      label: cl.dna_test_name ? `DNA Test Results — ${cl.dna_test_name}` : "DNA Test Results",
      sub: "Results from an approved DNA testing facility",
    });

  if (cl.other)
    items.push({
      id: "other",
      label: cl.other_details ? `Other: ${cl.other_details}` : "Other Documents",
      sub: "As specified in your 221(g) letter",
    });

  return items;
}

/* ─── Main component ────────────────────────────────────────── */
export default function ActionPlanResults({
  formData,
  selectedItems,
  onBackToForm,
  onSaveToProfile,
  guard,
}: ActionPlanResultsProps) {
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [activeTab, setActiveTab] = useState<"plan" | "checklist">("plan");
  const [currentStageIdx, setCurrentStageIdx] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);

  const { openUploadModal, uploadedDocuments, isReloadingDocs } =
    useDocumentVaultStore();

  const data = useMemo(() => {
    if (!formData || !selectedItems) return null;
    const cb = formData;
    const cl = selectedItems;
    const parsedItems = Object.keys(cl).filter(
      (key) => cl[key as keyof FormSelections] === true
    );
    const classifications = classifySituation(cb, parsedItems);
    const plans = classifications.map((c) =>
      generateDynamicActionPlan(c, parsedItems)
    );
    const allStages: { plan: ActionPlan; stage: ActionStage; globalIdx: number }[] =
      [];
    plans.forEach((plan) => {
      plan.stages.forEach((stage) => {
        allStages.push({ plan, stage, globalIdx: allStages.length });
      });
    });
    const docItems = buildDocItems(cl);
    return { cb, cl, plans, allStages, docItems };
  }, [formData, selectedItems]);

  if (!data) {
    return (
      <div className="w-full py-12 text-center">
        <p className="text-[#6b8097]">Generating results…</p>
      </div>
    );
  }

  const { cl, allStages, docItems } = data;
  const totalStages = allStages.length;
  const current = allStages[currentStageIdx];

  // vault counts (skip the always-show 221g letter — no vaultId)
  const uploadableItems = docItems.filter((i) => !!i.vaultId);
  const uploadedCount = uploadableItems.filter((item) =>
    uploadedDocuments?.some((d: any) => d.documentDefId === item.vaultId)
  ).length;
  const pct =
    uploadableItems.length > 0
      ? Math.round((uploadedCount / uploadableItems.length) * 100)
      : 0;

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setSaveMessage("Copied!");
    setTimeout(() => setSaveMessage(""), 2000);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSaveToProfile();
      setSaveMessage("Saved!");
      setTimeout(() => setSaveMessage(""), 3000);
    } catch {
      /* noop */
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = (vaultId: string) => {
    if (guard && !guard()) return;
    openUploadModal(vaultId);
  };

  const handleDownloadAll = async () => {
    if (guard && !guard()) return;
    if (isDownloading) return;
    setIsDownloading(true);
    try {
      const res = await fetch("/api/documents/export");
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `221g-documents-${new Date().toISOString().split("T")[0]}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Documents downloaded!");
    } catch {
      toast.error("Download failed. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  const goNext = () =>
    setCurrentStageIdx((p) => Math.min(p + 1, totalStages - 1));
  const goPrev = () => setCurrentStageIdx((p) => Math.max(p - 1, 0));

  const tabs = [
    { key: "plan" as const, label: "Action Plan", icon: FileText },
    { key: "checklist" as const, label: "Checklist", icon: ClipboardList },
  ];

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* ── Tab Bar ── */}
      <div className="flex bg-[#f1f5f9] rounded-xl p-1 mb-5 gap-1">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => {
                setActiveTab(t.key);
                setCurrentStageIdx(0);
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-[12px] font-bold transition-all ${
                isActive
                  ? "bg-white text-primary shadow-sm"
                  : "text-[#6b8097] hover:text-[#3a4f63]"
              }`}
            >
              <Icon size={14} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ══════════════ TAB: ACTION PLAN ══════════════ */}
      {activeTab === "plan" && current && (
        <div className="animate-in fade-in duration-200">
          {/* Stage dots */}
          <div className="flex items-center gap-2 mb-4">
            {allStages.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentStageIdx(idx)}
                className={`h-1.5 rounded-full transition-all flex-1 ${
                  idx === currentStageIdx
                    ? "bg-primary"
                    : idx < currentStageIdx
                    ? "bg-primary/30"
                    : "bg-[#d0e4f7]"
                }`}
              />
            ))}
          </div>

          <div className="flex items-center justify-between mb-3">
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#6b8097]">
              Stage {currentStageIdx + 1} of {totalStages}
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/8 text-primary text-[10px] font-bold uppercase tracking-wider">
              <Clock size={10} />
              {current.stage.timeframe}
            </div>
          </div>

          <div className="bg-white border border-[#d0e4f7] rounded-2xl overflow-hidden shadow-sm mb-4">
            <div className="bg-[#f8fafc] border-b border-[#e8f1fb] px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center text-[13px] font-black shrink-0">
                  {currentStageIdx + 1}
                </div>
                <div>
                  <div className="text-[16px] font-bold text-[#0c1b33] leading-tight">
                    {current.stage.title}
                  </div>
                  <div className="text-[11px] text-[#6b8097] mt-0.5">
                    {current.plan.title.replace(" - Action Plan", "")}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5 space-y-5">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-[#6b8097] mb-3 flex items-center gap-1.5">
                  <Check size={12} className="text-primary" strokeWidth={3} />
                  Steps to take
                </div>
                <div className="space-y-2.5">
                  {current.stage.actions.map((action, i) => (
                    <div key={i} className="flex gap-3 group">
                      <div className="w-5 h-5 rounded-md bg-[#e8f1fb] text-primary flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 group-hover:bg-primary group-hover:text-white transition-colors">
                        {i + 1}
                      </div>
                      <div className="text-[13px] text-[#3a4f63] leading-relaxed">
                        {action}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {current.stage.documents && current.stage.documents.length > 0 && (
                <div className="bg-[#f8fafc] rounded-xl p-4 border border-[#e8f1fb]">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-[#6b8097] mb-2.5 flex items-center gap-1.5">
                    <FileDigit size={12} className="text-primary" />
                    Documents needed
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {current.stage.documents.map((doc, i) => (
                      <span
                        key={i}
                        className="bg-white px-2.5 py-1 rounded-md border border-[#d0e4f7] text-[11px] font-medium text-[#3a4f63]"
                      >
                        {doc}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {current.stage.tips.length > 0 && (
                <div className="bg-[#eff6ff] rounded-xl p-4 border border-[#dbeafe]">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-[#4f46e5] mb-2 flex items-center gap-1.5">
                    <Lightbulb size={12} />
                    Pro Tips
                  </div>
                  <div className="space-y-1.5">
                    {current.stage.tips.map((tip, i) => (
                      <div
                        key={i}
                        className="text-[12px] text-[#4338ca]/80 leading-relaxed flex gap-2"
                      >
                        <span className="shrink-0">•</span>
                        <span>{tip}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={goPrev}
              disabled={currentStageIdx === 0}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[12px] font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed bg-[#f1f5f9] text-[#3a4f63] hover:bg-[#e2e8f0]"
            >
              <ChevronLeft size={14} /> Previous
            </button>
            {currentStageIdx < totalStages - 1 ? (
              <button
                onClick={goNext}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-[12px] font-bold bg-primary text-white shadow-md shadow-primary/20 hover:-translate-y-0.5 active:translate-y-0 transition-all"
              >
                Next Stage <ChevronRight size={14} />
              </button>
            ) : (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#e8f5ef] text-[#15744f] text-[12px] font-bold">
                <CheckCircle2 size={14} /> All stages reviewed
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════ TAB: CHECKLIST ══════════════ */}
      {activeTab === "checklist" && (
        <div className="animate-in fade-in duration-200">

          {/* Header row — progress + download */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <div className="text-[15px] font-bold text-[#0c1b33]">
                Packet Assembly
              </div>
              <div className="text-[12px] text-[#6b8097] mt-0.5">
                {isReloadingDocs ? (
                  "Checking vault…"
                ) : (
                  <>
                    {uploadedCount} of {uploadableItems.length} saved to vault
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Copy plain text */}
              <button
                onClick={() =>
                  handleCopyText(
                    docItems.map((d, i) => `${i + 1}. ${d.label}`).join("\n")
                  )
                }
                className="flex items-center gap-1 text-[11px] font-bold text-[#6b8097] hover:text-primary transition-colors"
                title="Copy list"
              >
                <CopyIcon size={12} />
                {saveMessage || "Copy"}
              </button>

              {/* Download All */}
              <button
                onClick={handleDownloadAll}
                disabled={isDownloading || uploadedCount === 0}
                title={
                  uploadedCount === 0
                    ? "Upload documents first"
                    : "Download all as ZIP"
                }
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0c1b33] text-white text-[11px] font-bold rounded-lg hover:bg-[#1a3054] transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
              >
                {isDownloading ? (
                  <RefreshCw size={11} className="animate-spin" />
                ) : (
                  <Download size={11} strokeWidth={2.5} />
                )}
                {isDownloading ? "…" : "Download All"}
              </button>
            </div>
          </div>

          {/* Progress bar */}
          {uploadableItems.length > 0 && (
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-[5px] bg-[#e8f1fb] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${pct}%`,
                    background:
                      pct === 100
                        ? "#15744f"
                        : "linear-gradient(90deg,#2f6fd4,#6aa8f0)",
                  }}
                />
              </div>
              <span className="text-[11px] font-bold text-[#6b8097] shrink-0 w-8 text-right">
                {pct}%
              </span>
            </div>
          )}

          {/* Document rows */}
          <div className="flex flex-col gap-1.5 mb-4">
            {docItems.map((item, i) => {
              const isUploaded = !!(
                item.vaultId &&
                uploadedDocuments?.some(
                  (d: any) => d.documentDefId === item.vaultId
                )
              );
              const canUpload = !!item.vaultId;

              return (
                <div
                  key={item.id}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border-[1.5px] transition-all ${
                    isUploaded
                      ? "bg-[#e8f5ef] border-[#a8d9be]"
                      : item.alwaysShow
                      ? "bg-[#fef8e8] border-[#f0d98a]"
                      : "bg-white border-[#e8f1fb] hover:border-primary/20"
                  }`}
                >
                  {/* Number badge */}
                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-bold shrink-0 ${
                      isUploaded
                        ? "bg-[#15744f] text-white"
                        : item.alwaysShow
                        ? "bg-[#f0d98a] text-[#8a6200]"
                        : "bg-[#f1f5f9] border border-[#d0e4f7] text-primary"
                    }`}
                  >
                    {isUploaded ? <Check size={10} strokeWidth={3} /> : i + 1}
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <div
                      className={`text-[13px] font-medium leading-snug ${
                        isUploaded ? "text-[#0e5c3c]" : "text-[#3a4f63]"
                      }`}
                    >
                      {item.label}
                    </div>
                    <div className="text-[10.5px] text-[#6b8097] mt-0.5">
                      {item.sub}
                    </div>
                  </div>

                  {/* Action */}
                  {isReloadingDocs ? (
                    <RefreshCw size={12} className="animate-spin text-[#6b8097] shrink-0" />
                  ) : item.alwaysShow ? (
                    <span className="shrink-0 text-[10px] font-semibold text-[#8a6200] bg-[#fef8e8] px-2 py-0.5 rounded-full border border-[#f0d98a]">
                      Keep original
                    </span>
                  ) : isUploaded ? (
                    <div className="shrink-0 flex items-center gap-2">
                      <span className="text-[10px] font-bold text-[#15744f] uppercase tracking-wider">
                        Saved ✓
                      </span>
                      {canUpload && (
                        <button
                          onClick={() => handleUpload(item.vaultId!)}
                          className="text-[11px] font-bold text-primary hover:underline"
                        >
                          Replace
                        </button>
                      )}
                    </div>
                  ) : canUpload ? (
                    <button
                      onClick={() => handleUpload(item.vaultId!)}
                      className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-[11px] font-bold rounded-lg hover:bg-primary/90 transition-all active:scale-95 shadow-sm"
                    >
                      <Upload size={11} strokeWidth={2.5} />
                      Save to Vault
                    </button>
                  ) : (
                    <span className="shrink-0 text-[10px] font-semibold text-[#6b8097] bg-[#f4f7fb] px-2 py-0.5 rounded-full border border-[#d0e4f7]">
                      Manual
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Final checks */}
          <div className="bg-[#0e1e38] rounded-xl p-4 text-white">
            <div className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2.5">
              Before You Submit
            </div>
            <div className="space-y-2">
              {[
                "Submit exactly what was requested — nothing more, nothing less",
                "Keep a complete copy of everything you send",
                "Use the method stated in the notice (courier, email, or drop box)",
              ].map((t, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2.5 text-[12px] text-white/75"
                >
                  <div className="w-4 h-4 rounded border border-white/20 shrink-0 mt-0.5" />
                  {t}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Disclaimer ── */}
      <div className="flex items-start gap-2.5 mt-5 p-3.5 rounded-xl bg-amber-50/60 border border-amber-100">
        <AlertCircle size={14} className="text-amber-500 shrink-0 mt-0.5" />
        <p className="text-[11px] text-amber-700/80 leading-relaxed">
          Based on your inputs. Always follow your embassy&apos;s 221(g) letter
          exactly. This is not legal advice.
        </p>
      </div>
    </div>
  );
}
