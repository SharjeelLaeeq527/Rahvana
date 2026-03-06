"use client";

import { useState, useRef } from "react";
import { Upload, AlertCircle, CheckCircle, X, FileText } from "lucide-react";
import SuccessState from "@/app/components/document-translation/SuccessState";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AuthRequiredModal } from "@/app/components/shared/AuthRequiredModal";
import { useAuth } from "@/app/context/AuthContext";

export default function DocumentTranslationUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<string>("");
  const [userNotes, setUserNotes] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const { isAuthenticated } = useAuth();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset form
  const reset = () => {
    setFile(null);
    setDocumentType("");
    setUserNotes("");
    setError(null);
    setUploadSuccess(false);

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    // Validate file type (PDF only)
    if (!selected.type.includes("application/pdf")) {
      setError("Please upload a valid PDF file.");
      return;
    }

    // Validate file size (max 50MB)
    if (selected.size > 50 * 1024 * 1024) {
      setError("File size must be under 50 MB.");
      return;
    }

    setFile(selected);
    setError(null);
  };

  // Handle upload
  const handleUpload = async () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    if (!file || !documentType) {
      setError("Please select a file and document type.");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("documentType", documentType);
      if (userNotes) {
        formData.append("userNotes", userNotes);
      }

      const response = await fetch("/api/document-translation/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Upload failed");
      }

      setUploadSuccess(true);

      // Scroll to the top when success state appears
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }, 100);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An error occurred during upload",
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 text-gray-800 flex flex-col items-center py-8 md:py-12 px-4 sm:px-6">
      {/* Header */}
      <header className="text-center mb-8 md:mb-10 w-full max-w-4xl">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-primary/90 leading-tight">
          Document Translation
        </h1>
        <p className="mt-3 text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
          Upload your Urdu document for true English translation
        </p>
      </header>

      {!uploadSuccess ? (
        <>
          {/* Requirements Section */}
          <section className="w-full max-w-4xl mb-8 md:mb-12 bg-white rounded-xl shadow-lg p-5 sm:p-6 md:p-8 border border-slate-100">
            <h2 className="flex items-center gap-2 text-xl sm:text-2xl font-semibold text-primary/90 mb-5 sm:mb-6">
              <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6" />
              Document Requirements
            </h2>

            <ul className="grid sm:grid-cols-2 gap-4 sm:gap-6 text-gray-700">
              {[
                "Submit clear, legible PDF files",
                "Original documents in Urdu language",
                "Maximum file size: 50 MB",
                "Ensure all text is readable",
                "Scanned documents should be high resolution",
                "No password protected PDFs",
              ].map((req, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                  <span className="text-sm sm:text-base">
                    <strong className="mr-1">{i + 1}.</strong> {req}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {/* Upload Section */}
          <section className="w-full max-w-md">
            <div className="bg-white rounded-xl shadow-md p-5 sm:p-6 border border-slate-100">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Upload Your Document
              </label>

              <div
                className={`border-2 border-dashed rounded-lg p-5 sm:p-6 text-center transition-colors cursor-pointer
                  ${file ? "border-indigo-500 bg-indigo-50" : "border-gray-300 hover:border-gray-400"}`}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={handleFileChange}
                />
                {file ? (
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <FileText className="w-10 h-10 text-indigo-600 shrink-0" />
                    <div className="text-center sm:text-left overflow-hidden">
                      <p className="font-medium truncate max-w-[250px]">
                        {file.name}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-500">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-gray-500">
                    <Upload className="w-10 h-10 mb-2" />
                    <p className="text-sm font-medium">
                      Click to upload or drag & drop
                    </p>
                    <p className="text-xs mt-1">PDF only, max 50MB</p>
                  </div>
                )}
              </div>

              {file && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    reset();
                  }}
                  className="mt-3 text-sm text-white flex items-center gap-1 mx-auto bg-red-500 rounded-md p-2 cursor-pointer hover:bg-red-600"
                >
                  <X className="w-4 h-4" /> Remove Document
                </button>
              )}

              {/* Document Type Selection */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Document Type
                </label>
                <Select value={documentType} onValueChange={setDocumentType}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select document type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="marriage">
                      Marriage Certificate
                    </SelectItem>
                    <SelectItem value="birth">Birth Certificate</SelectItem>
                    <SelectItem value="divorce">Divorce Certificate</SelectItem>
                    <SelectItem value="death">Death Certificate</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Optional Notes */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Notes (Optional)
                </label>
                <textarea
                  value={userNotes}
                  onChange={(e) => setUserNotes(e.target.value)}
                  placeholder="Any specific instructions for translators..."
                  className="w-full border rounded-md p-2 min-h-[80px]"
                  maxLength={500}
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  {error}
                </div>
              )}

              {/* Upload Button */}
              <button
                onClick={handleUpload}
                disabled={!file || uploading}
                className={`mt-6 w-full py-3 rounded-xl font-semibold transition-colors flex items-center justify-center cursor-pointer gap-2
                  ${
                    !file || uploading
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-primary/90 text-white hover:bg-primary"
                  }`}
              >
                {uploading ? (
                  <>Processing...</>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    Upload Document
                  </>
                )}
              </button>

              {isAuthenticated && (
                <div className="mt-4 text-center">
                  <button
                    onClick={() =>
                      (window.location.href =
                        "/document-translation/my-requests")
                    }
                    className="text-primary hover:underline text-sm cursor-pointer"
                  >
                    See my translation requests
                  </button>
                </div>
              )}
            </div>
          </section>
        </>
      ) : (
        <SuccessState
          onGoToRequests={() =>
            (window.location.href = "/document-translation/my-requests")
          }
        />
      )}

      <AuthRequiredModal
        open={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        redirectTo="/document-translation"
      />
    </div>
  );
}
