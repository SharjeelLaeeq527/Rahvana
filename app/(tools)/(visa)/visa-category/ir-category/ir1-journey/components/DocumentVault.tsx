import React from "react";
import { roadmapData } from "@/data/roadmap";
import { WizardState } from "@/app/(main)/dashboard/hooks/useWizard";
import { useLanguage } from "@/app/context/LanguageContext";

interface DocumentVaultProps {
  isOpen: boolean;
  onClose: () => void;
  state: WizardState;
  onToggleDocument: (doc: string) => void;
  onUpdateNote: (doc: string, note: string) => void;
  onUpload: (doc: string, file: File) => void;
  onClearUpload: (doc: string) => void;
}

export function DocumentVault({
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
    <div className="fixed inset-0 z-1000 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Content */}
      <div className="relative bg-white rounded-2xl w-full max-w-[800px] max-h-[90vh] md:max-h-[85vh] overflow-hidden shadow-2xl flex flex-col animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="p-5 md:p-6 border-b border-slate-200 flex justify-between items-start md:items-center bg-white shrink-0">
          <div className="pr-4">
            <h2 className="text-xl md:text-2xl font-bold text-slate-900">
              {t("documentVault.title")}
            </h2>
            <p className="text-slate-500 text-xs md:text-sm mt-1">
              {t("documentVault.subtitle")}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-4 md:p-6 overflow-y-auto grow bg-slate-50/30">
          {/* Privacy Note Tooltip replaced highlighted box */}

          <div className="space-y-4">
            {roadmapData.documents.map((doc) => {
              const isChecked = state.documentChecklist[doc] || false;
              const upload = state.docUploads[doc];
              const note = state.notes[doc] || "";

              return (
                <div
                  key={doc}
                  className={`p-5 rounded-2xl border transition-all duration-200 bg-white ${
                    isChecked
                      ? "border-[#0d9488] shadow-sm"
                      : "border-slate-100"
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2 transition-all cursor-pointer ${
                          isChecked
                            ? "bg-[#0d9488] border-[#0d9488] text-white"
                            : "border-slate-200 text-slate-200"
                        }`}
                        onClick={() => onToggleDocument(doc)}
                      >
                        {isChecked ? "✓" : ""}
                      </div>
                      <div>
                        <h4
                          className={`font-bold text-base transition-colors ${isChecked ? "text-slate-900" : "text-slate-500"}`}
                        >
                          {doc}
                        </h4>
                        <div className="flex gap-2 mt-1">
                          <span
                            className={`text-[11px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                              isChecked
                                ? "bg-[#ebf5f4] text-[#0d9488]"
                                : "bg-slate-100 text-slate-400"
                            }`}
                          >
                            {isChecked
                              ? t("status.collected")
                              : t("status.pending")}
                          </span>
                          {upload && (
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-amber-100 text-amber-700">
                              {t("documentVault.status.uploaded")}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block px-1">
                        {t("documentVault.labels.notes")}
                      </label>
                      <input
                        placeholder={t("documentVault.placeholders.addNote")}
                        value={note}
                        onChange={(e) => onUpdateNote(doc, e.target.value)}
                        className="w-full h-10 px-3 flex-1 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0d9488] focus:bg-white transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block px-1">
                        {t("documentVault.labels.fileAttachment")}
                      </label>
                      <div className="flex gap-2">
                        <div className="relative grow">
                          <input
                            type="file"
                            className="absolute inset-0 opacity-0 cursor-pointer z-10"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => handleFileChange(doc, e)}
                          />
                          <div className="w-full h-10 px-3 flex items-center text-sm font-medium bg-[#ebf5f4] text-[#0d9488] rounded-lg border border-[#0d9488]/20 hover:bg-[#ebf5f4]/80 transition-all truncate">
                            {upload
                              ? upload.name
                              : t("documentVault.placeholders.chooseFile")}
                          </div>
                        </div>
                        {upload && (
                          <button
                            onClick={() => onClearUpload(doc)}
                            className="w-10 h-10 flex items-center justify-center bg-red-50 text-red-500 rounded-lg border border-red-100 hover:bg-red-100 transition-all shrink-0"
                            aria-label={t("documentVault.aria.clearFile")}
                          >
                            ✕
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
        <div className="p-4 md:p-6 border-t border-slate-200 bg-slate-50 shrink-0 flex justify-end">
          <button
            onClick={onClose}
            className="w-full md:w-auto px-8 py-3 bg-[#334155] text-white rounded-lg font-bold hover:bg-[#1e293b] transition-all shadow-md hover:-translate-y-px"
          >
            {t("documentVault.closeBtn")}
          </button>
        </div>
      </div>
    </div>
  );
}
