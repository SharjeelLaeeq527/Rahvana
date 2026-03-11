import React from "react";
import { WizardState } from "@/app/(main)/dashboard/hooks/useWizard";
import { useLanguage } from "@/app/context/LanguageContext";
import {
  X,
  ClipboardList,
  CheckCircle2,
  Paperclip,
  StickyNote,
  UploadCloud,
  Trash2,
} from "lucide-react";

interface DocumentVaultProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  roadmapData: any;
  isOpen: boolean;
  onClose: () => void;
  state: WizardState;
  onToggleDocument: (doc: string) => void;
  onUpdateNote: (doc: string, note: string) => void;
  onUpload: (doc: string, file: File) => void;
  onClearUpload: (doc: string) => void;
}

export function DocumentVault({
  roadmapData,
  isOpen,
  onClose,
  state,
  onToggleDocument,
  onUpdateNote,
  onUpload,
  onClearUpload,
}: DocumentVaultProps) {
  const { t } = useLanguage();

  if (!isOpen) return null;

  const handleFileChange = (
    doc: string,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (e.target.files && e.target.files[0]) {
      onUpload(doc, e.target.files[0]);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Content */}
      <div className="relative bg-white rounded-2xl w-full max-w-[1200px] max-h-[90vh] md:max-h-[85vh] overflow-hidden shadow-2xl flex flex-col animate-in fade-in zoom-in duration-200 border border-slate-200">
        {/* Header */}
        <div className="p-5 md:p-6 border-b border-slate-200 flex justify-between items-start md:items-center bg-white shrink-0">
          <div className="pr-4">
            <h2 className="text-xl md:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <ClipboardList className="w-6 h-6 md:w-8 md:h-8 text-primary" />
              {t("visaJourney.documentVault.title")}
            </h2>
            <p className="text-slate-500 text-xs md:text-sm font-medium mt-1">
              {t("visaJourney.documentVault.subtitle")}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Categories / Tabs */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50/30">
          <div className="space-y-6">
            {roadmapData?.documents?.map((doc: string) => {
              const isChecked = state.documentChecklist[doc];
              const note = state.notes[doc] || "";
              const upload = state.docUploads[doc];

              return (
                <div
                  key={doc}
                  className={`group bg-white rounded-2xl p-5 md:p-6 border transition-all duration-300 ${
                    isChecked
                      ? "border-[#0d9488]/30 shadow-md shadow-[#0d9488]/5 bg-[#0d9488]/[0.02]"
                      : "border-slate-200 hover:border-slate-300 shadow-sm"
                  }`}
                >
                  <div className="flex items-start gap-4 mb-5">
                    <button
                      onClick={() => onToggleDocument(doc)}
                      className={`mt-1 shrink-0 transition-all duration-300 transform active:scale-90 ${
                        isChecked ? "scale-110" : ""
                      }`}
                    >
                      {isChecked ? (
                        <div className="bg-[#0d9488] rounded-full p-0.5 shadow-lg shadow-[#0d9488]/20">
                          <CheckCircle2 className="w-6 h-6 text-white" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full border-2 border-slate-200 group-hover:border-slate-300 bg-white" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span
                          className={`text-[15px] md:text-[17px] font-bold truncate ${
                            isChecked
                              ? "text-slate-900"
                              : "text-slate-700 font-semibold"
                          }`}
                        >
                          {doc}
                        </span>
                        <div className="flex gap-2">
                          <span
                            className={`text-[11px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                              isChecked
                                ? "bg-[#0d9488]/10 text-[#0d9488]"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {isChecked
                              ? t("visaJourney.documentVault.status.collected")
                              : t("visaJourney.documentVault.status.pending")}
                          </span>
                          {upload && (
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-amber-100 text-amber-700">
                              {t("visaJourney.documentVault.status.uploaded")}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 px-1">
                        <StickyNote className="w-3.5 h-3.5" />
                        {t("visaJourney.documentVault.labels.notes")}
                      </label>
                      <input
                        placeholder={t("visaJourney.documentVault.placeholders.addNote")}
                        value={note}
                        onChange={(e) => onUpdateNote(doc, e.target.value)}
                        className="w-full h-10 px-3 flex-1 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0d9488] focus:bg-white transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 px-1">
                        <Paperclip className="w-3.5 h-3.5" />
                        {t("visaJourney.documentVault.labels.fileAttachment")}
                      </label>
                      <div className="flex gap-2">
                        <div className="relative grow">
                          <input
                            type="file"
                            className="absolute inset-0 opacity-0 cursor-pointer z-10"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => handleFileChange(doc, e)}
                          />
                          <div className="h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-sm text-slate-600 truncate">
                            <span className="truncate text-[13px]">
                              {upload
                                ? upload.name
                                : t("visaJourney.documentVault.placeholders.chooseFile")}
                            </span>
                            <UploadCloud className="w-4 h-4 text-slate-400 ml-2" />
                          </div>
                        </div>
                        {upload && (
                          <button
                            onClick={() => onClearUpload(doc)}
                            className="h-10 w-10 shrink-0 bg-red-50 text-red-500 border border-red-100 rounded-lg flex items-center justify-center hover:bg-red-100 transition-colors"
                            title={t("visaJourney.documentVault.aria.clearFile")}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 md:p-6 border-t border-slate-200 bg-slate-50 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-all shadow-lg active:scale-95"
          >
            {t("visaJourney.documentVault.closeBtn")}
          </button>
        </div>
      </div>
    </div>
  );
}
