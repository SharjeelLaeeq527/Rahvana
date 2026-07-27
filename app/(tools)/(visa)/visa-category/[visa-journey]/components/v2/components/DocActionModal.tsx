import React from "react";
import {
  ShieldCheck,
  User,
  FileText,
  FileCheck,
  MessageSquare,
  Scale,
  Globe,
  ClipboardList,
  Lock,
  Camera,
  Sparkles,
  BookOpen,
  Upload,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { UpgradeModal } from "@/app/components/entitlements/UpgradeModal";
import { useToast } from "@/app/components/shared/ToastProvider";

interface DocActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  docActionModal: {
    isOpen: boolean;
    doc: any;
    title?: string;
    subtitle?: string;
    hasGuide?: boolean;
    onReadGuide?: () => void;
    onUpload?: () => void;
  };
  setDocActionModal: (val: any) => void;
  plan: any;
  docActionUpgradeFeature: string | null;
  setDocActionUpgradeFeature: (val: string | null) => void;
  sId: string;
}

export const DocActionModal: React.FC<DocActionModalProps> = ({
  isOpen,
  onClose,
  docActionModal,
  setDocActionModal,
  plan,
  docActionUpgradeFeature,
  setDocActionUpgradeFeature,
  sId,
}) => {
  const { showToast } = useToast();

  if (!docActionModal.doc) return null;
  const { doc, title, subtitle, onReadGuide, onUpload } = docActionModal;

  const isTranslation =
    doc.id === "doc_translations" ||
    doc.guideKey === "doc_translations" ||
    doc.selectedGuideId === "doc_translations";
  const isPassportPhoto =
    doc.id === "doc_passport_photos" ||
    doc.guideKey === "doc_passport_photos" ||
    doc.selectedGuideId === "doc_passport_photos";

  const hasGuideAction = typeof onReadGuide === "function" && docActionModal.hasGuide !== false;
  const hasUploadAction = typeof onUpload === "function";
  const availableActionsCount = Number(hasGuideAction) + Number(hasUploadAction);

  const guideFeature = isTranslation
    ? "document_translation"
    : isPassportPhoto
      ? "photo_booth"
      : "step_guides";

  const canReadGuide = plan.canUse(guideFeature);
  const canUpload = plan.canUse("document_vault");

  const guideTierIconClass = (() => {
    const target = plan.entitlement(guideFeature).upgradeTarget;
    return target ? `plan-icon--${target}` : "plan-icon--premium";
  })();
  const uploadTierIconClass = (() => {
    const target = plan.entitlement("document_vault").upgradeTarget;
    return target ? `plan-icon--${target}` : "plan-icon--premium";
  })();

  return (
    <>
      {docActionUpgradeFeature && (
        <UpgradeModal
          feature={docActionUpgradeFeature}
          onClose={() => setDocActionUpgradeFeature(null)}
        />
      )}

      <Dialog
        open={isOpen}
        onOpenChange={(open) => setDocActionModal({ ...docActionModal, isOpen: open })}
      >
        <DialogContent className="max-w-xl w-[95vw] p-0 overflow-hidden border-none rounded-[28px] shadow-2xl">
          <div className="relative overflow-hidden bg-white">
            {/* Background Decorations */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl" />

            <div className="relative p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                  {(() => {
                    switch (doc.icon) {
                      case "ShieldCheck":
                        return <ShieldCheck size={24} />;
                      case "User":
                        return <User size={24} />;
                      case "FileText":
                        return <FileText size={24} />;
                      case "FileCheck":
                        return <FileCheck size={24} />;
                      case "MessageSquare":
                        return <MessageSquare size={24} />;
                      case "Scale":
                        return <Scale size={24} />;
                      case "Globe":
                        return <Globe size={24} />;
                      case "ClipboardList":
                        return <ClipboardList size={24} />;
                      case "Lock":
                        return <Lock size={24} />;
                      case "Camera":
                        return <Camera size={24} />;
                      default:
                        return <FileText size={24} />;
                    }
                  })()}
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold text-[#0f1f38]">
                    {title || doc.name || doc.title}
                  </DialogTitle>
                  <p className="text-sm text-[#6b8097]">
                    {subtitle ||
                      doc.subtitle ||
                      doc.sub ||
                      "Choose an action to proceed with this document"}
                  </p>
                </div>
              </div>

              <div
                className={`grid grid-cols-1 gap-4 ${
                  availableActionsCount > 1 ? "sm:grid-cols-2" : "sm:grid-cols-1"
                }`}
              >
                {/* ── Read Guide / Launch Tool Card ── */}
                {hasGuideAction && (
                  <button
                    onClick={() => {
                      if (!canReadGuide) {
                        setDocActionModal({
                          ...docActionModal,
                          isOpen: false,
                        });

                        setDocActionUpgradeFeature(guideFeature);
                        return;
                      }

                      setDocActionModal({
                        ...docActionModal,
                        isOpen: false,
                      });

                      onReadGuide();
                    }}
                    className={`group relative text-left p-6 rounded-2xl border-[1.5px] bg-white transition-all ${
                      canReadGuide
                        ? "border-[#d0e4f7] hover:border-primary hover:shadow-[0_12px_24px_rgba(15,31,56,0.08)] hover:-translate-y-1"
                        : "border-[#e8d47a] hover:border-[#c49a0a] hover:shadow-[0_12px_24px_rgba(196,154,10,0.10)] hover:-translate-y-1"
                    }`}
                  >
                    {!canReadGuide && (
                      <div className="absolute top-3 right-3 flex items-center gap-1 bg-[#fffbec] border border-[#e8d47a] rounded-full px-2 py-0.5">
                        <span
                          className={`plan-icon ${guideTierIconClass} scale-110`}
                          aria-hidden="true"
                        />

                        <span className="text-[9px] font-bold text-[#c49a0a] uppercase tracking-wider">
                          Upgrade
                        </span>
                      </div>
                    )}

                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-colors ${
                        canReadGuide
                          ? "bg-[#e8f1fb] text-primary group-hover:bg-primary group-hover:text-white"
                          : "bg-[#fffbec] text-[#c49a0a] group-hover:bg-[#c49a0a] group-hover:text-white"
                      }`}
                    >
                      {isTranslation ? (
                        <Sparkles size={20} />
                      ) : isPassportPhoto ? (
                        <Camera size={20} />
                      ) : (
                        <BookOpen size={20} />
                      )}
                    </div>

                    <h4 className="font-bold text-[#0f1f38] mb-1">
                      {isTranslation || isPassportPhoto ? "Launch the Tool" : "Read the Guide"}
                    </h4>

                    <p className="text-xs text-[#6b8097] leading-relaxed">
                      {isTranslation
                        ? "Use our automated tool to prepare certified translations for your documents."
                        : isPassportPhoto
                          ? "Generate and validate your passport photos to meet U.S. specifications."
                          : "View requirements, pitfalls, and step-by-step instructions."}
                    </p>

                    {isPassportPhoto &&
                      canReadGuide &&
                      (() => {
                        const ent = plan.entitlement("photo_booth");

                        if (ent.state === "limited") {
                          return (
                            <div className="mt-3 flex items-center gap-1.5 bg-amber-50 border border-amber-100 rounded-lg px-2 py-1">
                              <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />

                              <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">
                                {ent.limit} Credits Included
                              </span>
                            </div>
                          );
                        }

                        return null;
                      })()}

                    {!canReadGuide && (
                      <p className="mt-2 text-[10px] font-semibold text-[#c49a0a] flex items-center gap-1">
                        <Lock size={9} strokeWidth={2.5} />
                        Not included in your current plan
                      </p>
                    )}
                  </button>
                )}

                {/* ── Upload Document Card ── */}
                <button
                  onClick={() => {
                    if (!canUpload) {
                      setDocActionModal({ ...docActionModal, isOpen: false });
                      if (sId === "step_1_15") {
                        showToast(
                          "Registering your receipt manually is included, but uploading the notice for automated tracking requires Premium.",
                          "info",
                          { duration: 6000 }
                        );
                      } else if (sId === "step_1_17") {
                        showToast(
                          "Saving approval details manually is included, but uploading the notice for permanent vault storage requires Premium.",
                          "info",
                          { duration: 6000 }
                        );
                      }
                      setDocActionUpgradeFeature("document_vault");
                      return;
                    }
                    setDocActionModal({ ...docActionModal, isOpen: false });
                    if (onUpload) onUpload();
                  }}
                  className={`group relative text-left p-6 rounded-2xl border-[1.5px] bg-white transition-all
                  ${
                    canUpload
                      ? "border-[#d0e4f7] hover:border-primary hover:shadow-[0_12px_24px_rgba(15,31,56,0.08)] hover:-translate-y-1"
                      : "border-[#e8d47a] hover:border-[#c49a0a] hover:shadow-[0_12px_24px_rgba(196,154,10,0.10)] hover:-translate-y-1"
                  }`}
                >
                  {!canUpload && (
                    <div className="absolute top-3 right-3 flex items-center gap-1 bg-[#fffbec] border border-[#e8d47a] rounded-full px-2 py-0.5">
                      <span
                        className={`plan-icon ${uploadTierIconClass} scale-110`}
                        aria-hidden="true"
                      />
                      <span className="text-[9px] font-bold text-[#c49a0a] uppercase tracking-wider">
                        Upgrade
                      </span>
                    </div>
                  )}

                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-colors
                    ${
                      canUpload
                        ? "bg-[#eaf7f2] text-[#1a7a5e] group-hover:bg-[#1a7a5e] group-hover:text-white"
                        : "bg-[#fffbec] text-[#c49a0a] group-hover:bg-[#c49a0a] group-hover:text-white"
                    }`}
                  >
                    <Upload size={20} />
                  </div>

                  <h4 className="font-bold text-[#0f1f38] mb-1">Upload Document</h4>
                  <p className="text-xs text-[#6b8097] leading-relaxed">
                    Attach and submit your document for processing.
                  </p>

                  {!canUpload && (
                    <p className="mt-2 text-[10px] font-semibold text-[#c49a0a] flex items-center gap-1">
                      <Lock size={9} strokeWidth={2.5} />
                      Not included in your current plan
                    </p>
                  )}
                </button>
              </div>

              <div className="mt-8 pt-6 border-t border-[#d0e4f7]/50 flex justify-end">
                <button
                  onClick={() => setDocActionModal({ ...docActionModal, isOpen: false })}
                  className="px-6 py-2.5 rounded-full text-sm font-semibold text-[#6b8097] hover:bg-slate-100 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
