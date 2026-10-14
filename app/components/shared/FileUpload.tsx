"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  CheckCircle2,
  File as FileIcon,
  FileImage,
  FileText,
  ImageIcon,
  Upload,
  UploadCloud,
  X,
} from "lucide-react";

interface FileUploadProps {
  label?: string;
  fieldName: string;
  onFileUpload: (fieldName: string, file: File | File[] | null) => void;

  height?: string;
  accept?: string;
  multiple?: boolean;

  // Optional controlled file to synchronize external resets or values.
  file?: File | File[] | null;

  /**
   * Controls the visual style.
   * - default: existing Rahvana uploader
   * - premium: richer uploader for tools such as Snap & Sign, etc
   */
  variant?: "default" | "premium";

  // Optional custom content for premium uploader.
  title?: string;
  description?: string;
  buttonText?: string;
  helperText?: string;
  icon?: React.ReactNode;

  // Show image preview when an image is uploaded.
  showPreview?: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({
  label,
  fieldName,
  onFileUpload,
  file,
  height = "180px",
  accept = "*/*",
  multiple = false,

  variant = "default",

  title = "Drag & drop your file here",
  description = "or choose a file from your device",
  buttonText = "Browse files",
  helperText = "Supported files will depend on the selected file type",
  icon,

  showPreview = false,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});

  const isPremium = variant === "premium";
  const hasFiles = uploadedFiles.length > 0;

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const selectedFiles = Array.from(files);

    const filesToStore = multiple ? selectedFiles : selectedFiles.slice(0, 1);

    setUploadedFiles(filesToStore);

    onFileUpload(
      fieldName,
      multiple ? filesToStore : (filesToStore[0] ?? null)
    );
  };

  useEffect(() => {
    const urls: Record<string, string> = {};
  
    uploadedFiles.forEach((file) => {
      if (showPreview && file.type.startsWith("image/")) {
        urls[file.name] = URL.createObjectURL(file);
      }
    });
  
    setPreviewUrls(urls);
  
    return () => {
      Object.values(urls).forEach((url) => {
        URL.revokeObjectURL(url);
      });
    };
  }, [uploadedFiles, showPreview]);

  // Synchronize internal files state when controlled file prop changes (e.g., cleared/reset externally)
  useEffect(() => {
    if (file === null) {
      setUploadedFiles([]);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    } else if (typeof window !== "undefined" && file instanceof window.File) {
      setUploadedFiles([file]);
    } else if (Array.isArray(file)) {
      setUploadedFiles(file);
    }
  }, [file]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleRemove = () => {
    setUploadedFiles([]);

    if (inputRef.current) {
      inputRef.current.value = "";
    }

    onFileUpload(fieldName, null);
  };

  const handleBrowse = (e?: React.MouseEvent) => {
    e?.stopPropagation();

    if (!inputRef.current) return;

    inputRef.current.value = "";
    inputRef.current.click();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith("image/")) {
      return <FileImage className="h-5 w-5" />;
    }

    if (file.type === "application/pdf") {
      return <FileText className="h-5 w-5" />;
    }

    return <FileIcon className="h-5 w-5" />;
  };

  return (
    <div className="w-full">
      {/* LABEL */}
      {label && (
        <div className="mb-2.5 flex items-center justify-between">
          <label
            htmlFor={fieldName}
            className="text-sm font-semibold text-[#263342]"
          >
            {label}
          </label>

          {hasFiles && (
            <span className="flex items-center gap-1 text-[11px] font-medium text-[#0d7377]">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Uploaded
            </span>
          )}
        </div>
      )}

      {/* UPLOAD CONTAINER */}
      <div
        onClick={() => !hasFiles && inputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{ minHeight: height }}
        className={`relative flex w-full flex-col justify-center overflow-hidden rounded-2xl transition-all duration-300 ${
          hasFiles
            ? "border border-[#0d7377]/25 bg-[#f7fcfc] p-4"
            : isPremium
              ? `cursor-pointer border ${
                  isDragging
                    ? "border-[#0d7377] bg-[#edf8f8] shadow-[0_18px_50px_rgba(13,115,119,0.18)]"
                    : "border-[#dcecf1] bg-white shadow-[0_10px_40px_rgba(13,115,119,0.10)] hover:border-[#afdbdb] hover:shadow-[0_16px_48px_rgba(13,115,119,0.14)]"
                } px-6 py-12 sm:px-10 sm:py-16`
              : `cursor-pointer border-2 border-dashed p-6 text-center ${
                  isDragging
                    ? "border-[#0d7377] bg-[#edf8f8] shadow-[0_0_0_4px_rgba(13,115,119,0.08)]"
                    : "border-[#d7e1e5] bg-white hover:border-[#0d7377]/45 hover:bg-[#fbfefe] hover:shadow-[0_8px_24px_rgba(35,53,78,0.06)]"
                }`
        }`}
      >
        {/* BACKGROUND DECORATION */}
        {!hasFiles && (
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -right-16 -top-16 h-32 w-32 rounded-full bg-[#0d7377]/[0.025]" />
            <div className="absolute -bottom-20 -left-16 h-36 w-36 rounded-full bg-[#32e0c4]/[0.025]" />
          </div>
        )}

        {!hasFiles ? (
          // EMPTY / UPLOAD STATE
          <div className="relative z-10 flex flex-col items-center justify-center">
            {/* ICON */}
            <div
              className={`mb-6 flex h-16 w-16 items-center justify-center rounded-2xl transition-all duration-300 sm:h-[72px] sm:w-[72px] ${
                isPremium
                  ? isDragging
                    ? "scale-105 bg-[#0d7377] shadow-[0_10px_30px_rgba(13,115,119,0.22)]"
                    : "bg-[#eaf3fb] group-hover:bg-[#e0f0f4]"
                  : isDragging
                    ? "scale-105 border border-[#0d7377]/20 bg-[#0d7377]/10"
                    : "border border-[#0d7377]/10 bg-[#edf8f8]"
              }`}
            >
              {isDragging ? (
                <ImageIcon
                  className={`h-8 w-8 ${
                    isPremium ? "text-white" : "text-[#0d7377]"
                  }`}
                />
              ) : (
                icon || (
                  <UploadCloud
                    className={`h-8 w-8 ${
                      isPremium ? "text-[#0d7377]" : "text-[#0d7377]/80"
                    }`}
                  />
                )
              )}
            </div>

            {/* TITLE */}
            <p
              className={`text-center font-bold ${
                isPremium
                  ? "text-xl text-[#123f42] sm:text-2xl"
                  : "text-sm text-[#263342]"
              }`}
            >
              {isDragging
                ? isPremium
                  ? "Drop your file here"
                  : "Drop your file here"
                : title}
            </p>

            {/* DESCRIPTION */}
            <p
              className={`text-center ${
                isPremium
                  ? "mb-7 mt-1.5 text-xs text-[#6b8a8f] sm:text-sm"
                  : "mt-1 text-xs text-[#7a858e]"
              }`}
            >
              {description}
            </p>

            {/* DIVIDER */}
            <div
              className={`my-4 flex items-center gap-3 ${
                isPremium ? "w-[201px]" : "w-full max-w-[220px]"
              }`}
            >
              <span className="h-px flex-1 bg-[#e6ecee]" />

              <span className="text-[10px] font-medium tracking-wider text-[#9aa4ab]">
                OR
              </span>

              <span className="h-px flex-1 bg-[#e6ecee]" />
            </div>

            {/* BROWSE BUTTON */}
            <button
              type="button"
              onClick={handleBrowse}
              className={`inline-flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
                isPremium
                  ? "w-full rounded-xl bg-[#00595C] px-7 py-3 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(13,115,119,0.25)] hover:bg-[#004a4c] hover:shadow-[0_10px_26px_rgba(13,115,119,0.32)] sm:w-auto"
                  : "rounded-lg border border-[#0d7377]/25 bg-white px-4 py-2 text-xs font-semibold text-[#0d7377] shadow-sm hover:border-[#0d7377]/40 hover:bg-[#0d7377] hover:text-white hover:shadow-md"
              }`}
            >
              <Upload className="h-3.5 w-3.5" />
              {buttonText}
            </button>

            {/* HELPER */}
            <p
              className={`text-center ${
                isPremium
                  ? "mt-5 text-[11px] text-[#8aa5a8] sm:text-xs"
                  : "mt-3 text-[10px] text-[#9aa4ab]"
              }`}
            >
              {helperText}
            </p>
          </div>
        ) : (
          // UPLOADED STATE
          <div className="w-full">
            {uploadedFiles.map((file, index) => {
              const previewUrl = previewUrls[file.name] ?? null;

              return (
                <div
                  key={`${file.name}-${index}`}
                  className={`flex items-center gap-3 rounded-xl border bg-white shadow-[0_4px_14px_rgba(35,53,78,0.05)] ${
                    isPremium ? "p-3.5 sm:p-4" : "p-3"
                  }`}
                >
                  {/* IMAGE PREVIEW / FILE ICON */}
                  {previewUrl ? (
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-[#dceaea] bg-[#edf8f8]">
                      <img
                        src={previewUrl}
                        alt={file.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#edf8f8] text-[#0d7377]">
                      {getFileIcon(file)}
                    </div>
                  )}

                  {/* FILE INFO */}
                  <div className="min-w-0 flex-1 text-left">
                    <p
                      className="truncate text-sm font-semibold text-[#263342]"
                      title={file.name}
                    >
                      {file.name}
                    </p>

                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-[11px] text-[#7a858e]">
                        {formatFileSize(file.size)}
                      </span>

                      <span className="h-1 w-1 rounded-full bg-[#b8c4c9]" />

                      <span className="flex items-center gap-1 text-[11px] font-medium text-[#0d7377]">
                        <CheckCircle2 className="h-3 w-3" />
                        Ready
                      </span>
                    </div>
                  </div>

                  {/* REMOVE */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove();
                    }}
                    aria-label={`Remove ${file.name}`}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#8a969e] transition-all hover:bg-[#fff1f1] hover:text-[#c75c5c] active:scale-95"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              );
            })}

            {/* CHANGE FILE */}
            <div className="mt-3 flex items-center justify-between px-1">
              <span className="text-[11px] text-[#7a858e]">
                {multiple && uploadedFiles.length > 1
                  ? `${uploadedFiles.length} files selected`
                  : "File ready to upload"}
              </span>

              <button
                type="button"
                onClick={handleBrowse}
                className="text-[11px] font-semibold text-[#0d7377] transition-colors hover:text-[#095c60]"
              >
                Change file
              </button>
            </div>
          </div>
        )}

        {/* HIDDEN INPUT */}
        <input
          ref={inputRef}
          id={fieldName}
          type="file"
          className="hidden"
          onChange={handleFileChange}
          accept={accept}
          multiple={multiple}
        />
      </div>
    </div>
  );
};

export default FileUpload;