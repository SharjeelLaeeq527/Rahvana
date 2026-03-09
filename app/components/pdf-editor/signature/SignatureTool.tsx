// app/components/signature-tool/SignatureTool.tsx
"use client";

import { useState } from "react";
import SignaturePad from "./SignaturePad";
import TextSignature from "./TextSignature";
import UploadImage from "./UploadImage";
import { useLanguage } from "@/app/context/LanguageContext";

type Props = {
  onSignature: (dataURL: string) => void;
};

export default function SignatureTool({ onSignature }: Props) {
  const { t } = useLanguage();
  const [showModal, setShowModal] = useState(false);
  const [signatureMode, setSignatureMode] = useState<
    "draw" | "type" | "upload"
  >("draw");

  const handleCloseModal = () => setShowModal(false);

  return (
    <>
      {/* This is the ONLY button — no parent button allowed! */}
      <button
        type="button"
        onClick={() => setShowModal(true)}
        className="p-2 rounded transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        title={t("pdfProcessing.editor.signature.title")}
        aria-label={t("pdfProcessing.editor.signature.title")}
      >
        <svg
          className="w-5 h-5 text-gray-700"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M16.585 4.126c.618 2.53-.564 4.49-3.442 5.882q-.302 1.22-.625 2.66.437-.212.933-.426a69 69 0 0 1 1.71-.705c1.432-.582 2.309-.591 2.22.423-.038.425-.308.851-1.023 1.8l-.058.077c-.31.41-.306.407-.407.544q-.371.506-.733.989.633-.37 1.484-.89c1.357-.83 2.386-1.251 3.137-1.251.94 0 1.447.644 1.424 1.688l-1-.022c.011-.526-.099-.666-.424-.666-.516 0-1.405.363-2.616 1.104-1.294.79-2.22 1.329-2.787 1.618-.325.165-.538.255-.702.282-.303.048-.635-.068-.65-.502-.006-.188.058-.303.172-.444a98 98 0 0 0 1.888-2.497c.096-.13.102-.139.338-.452l.136-.18q.459-.61.66-.938-.27.076-.684.243a73 73 0 0 0-1.689.697 18 18 0 0 0-1.61.777l-.058.267q-.541 2.216-1.146 3.797L21 18v1H10.614c-.752 1.625-1.585 2.574-2.531 2.852-.715.209-1.3.048-1.586-.498-.217-.416-.212-.985-.04-1.675q.08-.326.209-.678L3 19v-1h4.096a11.8 11.8 0 0 1 1.947-2.818 10.3 10.3 0 0 1 2.312-1.89q.33-1.504.639-2.793-1.606.609-3.738 1.038l-.197-.98c1.695-.342 3.101-.757 4.227-1.247q.923-3.665 1.65-5.289c.92-2.052 2.126-2.038 2.65.105M9.502 19H7.738a6.4 6.4 0 0 0-.31.92c-.119.474-.122.822-.044.97.034.067.118.09.418.002.568-.167 1.14-.798 1.7-1.892m1.512-4.271a9.7 9.7 0 0 0-1.238 1.134q-.232.247-.462.526a11 11 0 0 0-1.089 1.61l1.73.002q.547-1.334 1.06-3.272M6.335 12l.666.667L5.667 14 7 15.333 6.333 16 5 14.667 3.667 16 3 15.333 4.333 14 3 12.667 3.667 12 5 13.333zm8.515-7.57q-.604 1.35-1.374 4.274c1.879-1.131 2.57-2.579 2.139-4.34-.284-1.164-.215-1.163-.765.066" />
        </svg>
      </button>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 sm:p-6">
          <div className="w-full max-w-2xl bg-white rounded-xl shadow-2xl flex flex-col max-h-full overflow-hidden">
            {/* Header */}
            <div className="shrink-0 flex items-center justify-between border-b p-4 sm:px-6 sm:py-4">
              <h2 className="text-xl font-semibold text-gray-900">
                {t("pdfProcessing.editor.signature.title")}
              </h2>
              <button
                type="button"
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 transition"
                aria-label="Close modal"
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
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Tabs */}
            <div className="shrink-0 flex gap-2 border-b p-4 sm:px-6 sm:py-4 bg-gray-50 overflow-x-auto custom-scrollbar">
              {(["draw", "type", "upload"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setSignatureMode(mode)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                    signatureMode === mode
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-100"
                  }`}
                >
                  {mode === "draw" && t("pdfProcessing.editor.signature.draw")}
                  {mode === "type" && t("pdfProcessing.editor.signature.type")}
                  {mode === "upload" && t("pdfProcessing.editor.signature.upload")}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="p-4 sm:p-6 min-h-[300px] sm:min-h-96 overflow-y-auto custom-scrollbar">
              {signatureMode === "draw" && (
                <SignaturePad
                  onSave={onSignature}
                  closeModal={handleCloseModal}
                />
              )}
              {signatureMode === "type" && (
                <TextSignature
                  onGenerate={onSignature}
                  closeModal={handleCloseModal}
                />
              )}
              {signatureMode === "upload" && (
                <UploadImage
                  onUpload={onSignature}
                  closeModal={handleCloseModal}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
