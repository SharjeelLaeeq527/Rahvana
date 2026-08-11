"use client";

import React, { useRef, useState } from "react";
import { CheckCircle2, File, FileImage, FileText, Upload, X } from "lucide-react";

interface FileUploadProps {
  label: string;
  fieldName: string;
  onFileUpload: (fieldName: string, file: File | File[] | null) => void;
  height?: string;
  accept?: string;
  multiple?: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({
  label,
  fieldName,
  onFileUpload,
  height = "180px",
  accept = "*/*",
  multiple = false,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const selectedFiles = Array.from(files);

    const filesToStore = multiple ? selectedFiles : selectedFiles.slice(0, 1);

    setUploadedFiles(filesToStore);

    onFileUpload(fieldName, multiple ? filesToStore : (filesToStore[0] ?? null));
  };

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
    inputRef.current?.click();
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

    return <File className="h-5 w-5" />;
  };

  const hasFiles = uploadedFiles.length > 0;

  return (
    <div className="w-full">
      {/* Label */}
      <div className="mb-2.5 flex items-center justify-between">
        <label htmlFor={fieldName} className="text-sm font-semibold text-[#263342]">
          {label}
        </label>

        {hasFiles && (
          <span className="flex items-center gap-1 text-[11px] font-medium text-[#0d7377]">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Uploaded
          </span>
        )}
      </div>

      {/* Upload Container */}
      <div
        onClick={() => !hasFiles && inputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{ minHeight: height }}
        className={`relative flex w-full flex-col justify-center overflow-hidden rounded-2xl border transition-all duration-200 ${
          hasFiles
            ? "border-[#0d7377]/25 bg-[#f7fcfc] p-4"
            : `cursor-pointer border-2 border-dashed p-6 text-center ${
                isDragging
                  ? "border-[#0d7377] bg-[#edf8f8] shadow-[0_0_0_4px_rgba(13,115,119,0.08)]"
                  : "border-[#d7e1e5] bg-white hover:border-[#0d7377]/45 hover:bg-[#fbfefe] hover:shadow-[0_8px_24px_rgba(35,53,78,0.06)]"
              }`
        } `}
      >
        {/* Subtle background decoration */}
        {!hasFiles && (
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -top-16 -right-16 h-32 w-32 rounded-full bg-[#0d7377]/[0.025]" />
            <div className="absolute -bottom-20 -left-16 h-36 w-36 rounded-full bg-[#32e0c4]/[0.025]" />
          </div>
        )}

        {!hasFiles ? (
          /* =========================
             EMPTY / UPLOAD STATE
          ========================= */
          <div className="relative z-10 flex flex-col items-center justify-center">
            {/* Upload Icon */}
            <div
              className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border transition-all duration-200 ${
                isDragging
                  ? "scale-105 border-[#0d7377]/20 bg-[#0d7377]/10"
                  : "border-[#0d7377]/10 bg-[#edf8f8]"
              } `}
            >
              <Upload
                className={`h-6 w-6 transition-colors ${
                  isDragging ? "text-[#0d7377]" : "text-[#0d7377]/80"
                }`}
                strokeWidth={1.8}
              />
            </div>

            {/* Main Text */}
            <p className="text-sm font-semibold text-[#263342]">
              {isDragging ? "Drop your file here" : "Drag & drop your file here"}
            </p>

            <p className="mt-1 text-xs text-[#7a858e]">or choose a file from your device</p>

            {/* Divider */}
            <div className="my-4 flex w-full max-w-[220px] items-center gap-3">
              <span className="h-px flex-1 bg-[#e6ecee]" />
              <span className="text-[10px] font-medium tracking-wider text-[#9aa4ab]">OR</span>
              <span className="h-px flex-1 bg-[#e6ecee]" />
            </div>

            {/* Browse Button */}
            <button
              type="button"
              onClick={handleBrowse}
              className="inline-flex items-center gap-2 rounded-lg border border-[#0d7377]/25 bg-white px-4 py-2 text-xs font-semibold text-[#0d7377] shadow-sm transition-all hover:border-[#0d7377]/40 hover:bg-[#0d7377] hover:text-white hover:shadow-md active:scale-[0.98]"
            >
              <Upload className="h-3.5 w-3.5" />
              Browse files
            </button>

            {/* Helper Text */}
            <p className="mt-3 text-[10px] text-[#9aa4ab]">
              Supported files will depend on the selected file type
            </p>
          </div>
        ) : (
          /* =========================
             UPLOADED STATE
          ========================= */
          <div className="w-full">
            {uploadedFiles.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center gap-3 rounded-xl border border-[#dceaea] bg-white p-3 shadow-[0_4px_14px_rgba(35,53,78,0.05)]"
              >
                {/* File Icon */}
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#edf8f8] text-[#0d7377]">
                  {getFileIcon(file)}
                </div>

                {/* File Information */}
                <div className="min-w-0 flex-1 text-left">
                  <p className="truncate text-sm font-semibold text-[#263342]" title={file.name}>
                    {file.name}
                  </p>

                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-[11px] text-[#7a858e]">{formatFileSize(file.size)}</span>

                    <span className="h-1 w-1 rounded-full bg-[#b8c4c9]" />

                    <span className="flex items-center gap-1 text-[11px] font-medium text-[#0d7377]">
                      <CheckCircle2 className="h-3 w-3" />
                      Ready
                    </span>
                  </div>
                </div>

                {/* Remove */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove();
                  }}
                  aria-label={`Remove ${file.name}`}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#8a969e] transition-colors hover:bg-[#fff1f1] hover:text-[#c75c5c]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}

            {/* Change File */}
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

        {/* Hidden Input */}
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
