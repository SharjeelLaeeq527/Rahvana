"use client";

import type React from "react";
import { useRef, useState } from "react";
import { UploadCloud, ImageIcon, type File } from "lucide-react";
import { useLanguage } from "@/app/context/LanguageContext";

interface SignatureUploaderProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

export default function SignatureUploader({
  onFileSelect,
  disabled = false,
}: SignatureUploaderProps) {
  const { t } = useLanguage();
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      onFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFileSelect(files[0]);
    }
  };

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="mx-auto w-full max-w-md">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") handleClick();
        }}
        className={`
          group relative rounded-3xl bg-white text-center cursor-pointer
          px-6 py-12 sm:px-10 sm:py-16
          transition-all duration-300 outline-none
          ${disabled ? "opacity-50 cursor-not-allowed" : ""}
          ${
            isDragging
              ? "border-2 border-[#0d7377] shadow-[0_18px_50px_rgba(13,115,119,0.18)] scale-[1.01]"
              : "border border-[#dcecf1] shadow-[0_10px_40px_rgba(13,115,119,0.10)] hover:border-[#afdbdb] hover:shadow-[0_16px_48px_rgba(13,115,119,0.14)]"
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileInput}
          className="hidden"
          disabled={disabled}
        />

        <div className="flex flex-col items-center">
          <div
            className={`w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-2xl flex items-center justify-center mb-6 transition-colors ${
              isDragging ? "bg-[#0d7377]" : "bg-[#eaf3fb] group-hover:bg-[#e0f0f4]"
            }`}
          >
            {isDragging ? (
              <ImageIcon className="w-8 h-8 text-white" />
            ) : (
              <UploadCloud className="w-8 h-8 text-[#0d7377]" />
            )}
          </div>

          <h3 className="text-xl sm:text-2xl font-bold text-[#123f42] mb-1.5">
            {isDragging
              ? t("signatureProcessing.uploader.dropzone")
              : t("signatureProcessing.uploader.uploadTitle")}
          </h3>

          <p className="text-[#6b8a8f] text-xs sm:text-sm mb-7">
            {t("signatureProcessing.uploader.browse")}
          </p>

          <button
            type="button"
            disabled={disabled}
            className="w-full sm:w-auto text-white bg-[#0d7377] px-7 py-3 rounded-xl text-sm font-semibold
                       shadow-[0_8px_20px_rgba(13,115,119,0.25)]
                       transition-all hover:bg-[#0a5c60] hover:shadow-[0_10px_26px_rgba(13,115,119,0.32)]
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t("signatureProcessing.uploader.chooseFile")}
          </button>

          <p className="text-[11px] sm:text-xs text-[#8aa5a8] mt-5">
            {t("signatureProcessing.uploader.supported")}
          </p>
        </div>
      </div>
    </div>
  );
}
