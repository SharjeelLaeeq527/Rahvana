"use client";

import { useState, useEffect } from "react";
import { Upload, Download, FileCheck, AlertCircle } from "lucide-react";

interface CompressionResult {
  originalSize: number;
  compressedSize: number;
  reduction: string;
}

export default function Compress() {
  const [mounted, setMounted] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CompressionResult | null>(null);
  const [error, setError] = useState("");
  
const API_BASE =
  process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:8000/api/v1";

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];

      if (!selectedFile.name.toLowerCase().endsWith(".pdf")) {
        setError("Please select a PDF file");
        return;
      }

      if (selectedFile.size > 100 * 1024 * 1024) {
        setError("File is too large. Maximum size is 100MB");
        return;
      }

      setFile(selectedFile);
      setError("");
      setResult(null);
    }
  };

  const handleCompress = async () => {
    if (!file) {
      setError("Please select a PDF file");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`${API_BASE}/api/v1/compress`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Compression failed");
      }

      const originalSizeHeader = response.headers.get("x-original-size");
      const compressedSizeHeader = response.headers.get("x-compressed-size");
      const reductionHeader = response.headers.get("x-reduction");

      const originalSize = originalSizeHeader
        ? parseInt(originalSizeHeader, 10)
        : file.size;
      const compressedSizeFromHeader = compressedSizeHeader
        ? parseInt(compressedSizeHeader, 10)
        : 0;
      const reductionFromHeader = reductionHeader
        ? parseFloat(reductionHeader)
        : 0;

      const blob = await response.blob();
      const finalCompressedSize = compressedSizeFromHeader || blob.size;
      const finalReduction =
        reductionFromHeader ||
        ((originalSize - finalCompressedSize) / originalSize) * 100;

      // Trigger download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `compressed_${file.name}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setResult({
        originalSize,
        compressedSize: finalCompressedSize,
        reduction: finalReduction.toFixed(2),
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Compression failed. Please try again.";
      console.error("Compression error:", err);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const mb = bytes / 1024 / 1024;
    if (mb < 1) {
      const kb = bytes / 1024;
      return kb.toFixed(2) + " KB";
    }
    return mb.toFixed(2) + " MB";
  };

  if (!mounted) return null;

  return (
    <div className="w-full">
      <div className="bg-primary/90 p-6 md:p-10 text-white rounded-t-2xl">
        <h1 className="text-3xl md:text-5xl font-bold text-center mb-2 md:mb-3">
          PDF Compressor
        </h1>
      </div>

      <div className="p-6 md:p-12">
        {/* File Upload */}
        <div className="mb-6 md:mb-8">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Select PDF File
          </label>
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            className="hidden"
            id="file-upload"
            disabled={loading}
          />
          <label
            htmlFor="file-upload"
            className={`block border-2 border-dashed rounded-xl p-8 text-center transition-all ${
              loading
                ? "border-gray-300 bg-gray-50 cursor-not-allowed"
                : "border-primary/90 hover:border-primary hover:bg-primary/10 cursor-pointer"
            }`}
          >
            <Upload
              className={`mx-auto h-16 w-16 mb-3 ${file ? "text-primary/90" : "text-gray-400"}`}
            />
            {file ? (
              <div>
                <p className="text-primary/90 font-semibold text-lg mb-1 truncate max-w-xs mx-auto">
                  {file.name}
                </p>
                <p className="text-sm text-gray-500">
                  {formatBytes(file.size)}
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  Click to change file
                </p>
              </div>
            ) : (
              <div>
                <p className="text-gray-700 font-medium mb-1">
                  Click to upload or drag and drop
                </p>
                <p className="text-sm text-gray-500">
                  PDF files only • Max 100MB
                </p>
              </div>
            )}
          </label>
        </div>

        {/* Compress Button */}
        <button
          onClick={handleCompress}
          disabled={!file || loading}
          className="w-full bg-primary/90 text-white py-4 rounded-xl font-semibold text-lg hover:bg-primary disabled:bg-gray-400 disabled:cursor-not-allowed transition-all flex items-center justify-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        >
          {loading ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-3 h-6 w-6 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Maximizing Compression...
            </>
          ) : (
            <>
              <Download className="mr-2 h-6 w-6" />
              Compress Now
            </>
          )}
        </button>

        {/* Error Message */}
        {error && (
          <div className="mt-6 p-5 bg-red-50 border-l-4 border-red-500 rounded-lg">
            <div className="flex items-start">
              <AlertCircle className="h-6 w-6 text-red-500 mr-3 mt-0.5 shrink-0" />
              <div>
                <h3 className="text-red-800 font-semibold mb-1">Error</h3>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Success Result */}
        {result && (
          <div className="mt-6 p-6 bg-linear-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 rounded-lg shadow-sm">
            <div className="flex items-center text-green-700 mb-4">
              <FileCheck className="h-6 w-6 mr-3" />
              <span className="font-bold text-lg">Compression Successful!</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <p className="text-gray-500 text-xs font-medium mb-1">
                  Original Size
                </p>
                <p className="text-gray-800 font-bold text-xl">
                  {formatBytes(result.originalSize)}
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <p className="text-gray-500 text-xs font-medium mb-1">
                  Compressed Size
                </p>
                <p className="text-gray-800 font-bold text-xl">
                  {formatBytes(result.compressedSize)}
                </p>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <p className="text-gray-500 text-xs font-medium mb-1">
                Space Saved
              </p>
              <div className="flex items-baseline">
                <p className="text-green-600 font-bold text-3xl">
                  {result.reduction}%
                </p>
                <p className="text-gray-500 text-sm ml-2">
                  ({formatBytes(result.originalSize - result.compressedSize)}{" "}
                  saved)
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
