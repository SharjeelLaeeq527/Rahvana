"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileDown, AlertCircle, FileCheck } from "lucide-react";
import { Loader } from "@/components/ui/spinner";

interface ConversionResult {
  originalSize: number;
  convertedSize: number;
  reduction: string;
}

/**
 * PDFConverter Component
 * - Handles text input and PDF generation
 * - Uses the /api/create-pdf endpoint to generate PDFs
 * - Supports real-time validation and error handling
 */
export function PDFConverter() {
  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ConversionResult | null>(null);

  // Validates and generates PDF from input text
  const handleDownloadPDF = async () => {
    // Validate input
    if (!text.trim()) {
      setError("Please enter some text to convert to PDF");
      return;
    }

    if (text.length > 50000) {
      setError("Text exceeds maximum length of 50,000 characters");
      return;
    }

    setIsLoading(true);
    setError("");
    setResult(null);

    try {
      // Call the API route to generate PDF
      const response = await fetch("/api/create-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate PDF");
      }

      // Get the PDF blob and trigger download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `document-${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);

      // Calculate result stats
      const originalSize = new Blob([text]).size;
      const convertedSize = blob.size;
      const reduction =
        originalSize > 0
          ? (((originalSize - convertedSize) / originalSize) * 100).toFixed(2)
          : "0";

      setResult({
        originalSize,
        convertedSize,
        reduction,
      });

      setText(""); // Clear textarea after success
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "An error occurred";
      setError(message);
      console.error("[PDF Converter Error]", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate character count for real-time feedback
  const charCount = text.length;
  const maxChars = 50000;
  const percentUsed = (charCount / maxChars) * 100;

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const mb = bytes / 1024 / 1024;
    if (mb < 1) {
      const kb = bytes / 1024;
      return kb.toFixed(2) + " KB";
    }
    return mb.toFixed(2) + " MB";
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-indigo-50 via-white to-purple-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-primary/90 p-10 text-white">
            <h1 className="text-4xl md:text-5xl font-bold text-center mb-3">
              Text to PDF Converter
            </h1>
            <p className="text-center text-white/90 text-lg">
              Convert your text content to a professional PDF document
            </p>
          </div>

          <div className="p-8 md:p-12">
            {/* Textarea Input */}
            <div className="space-y-3 mb-6">
              <label
                htmlFor="text-input"
                className="block text-sm font-semibold text-gray-700 mb-3"
              >
                Your Text
              </label>
              <textarea
                id="text-input"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste or type your content here..."
                disabled={isLoading}
                className="w-full h-64 p-4 bg-background border border-input rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              />
            </div>

            {/* Character Count */}
            <div className="space-y-2 mb-6">
              <div className="flex justify-between items-center text-xs text-gray-500">
                <span>{charCount.toLocaleString()} characters</span>
                <span>{maxChars.toLocaleString()} max</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${percentUsed > 90 ? "bg-red-500" : "bg-primary/90"}`}
                  style={{ width: `${Math.min(percentUsed, 100)}%` }}
                />
              </div>
            </div>

            {/* Download Button */}
            <Button
              onClick={handleDownloadPDF}
              disabled={isLoading || !text.trim()}
              size="lg"
              className="w-full bg-primary/90 text-white py-4 rounded-xl font-semibold text-lg hover:bg-primary disabled:bg-gray-400 disabled:cursor-not-allowed transition-all flex items-center justify-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              {isLoading ? (
                <>
                  <Loader size="sm" text="Generating PDF..." />
                </>
              ) : (
                <>
                  <FileDown className="mr-2 h-6 w-6" />
                  Convert to PDF
                </>
              )}
            </Button>

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
                  <span className="font-bold text-lg">
                    Conversion Successful!
                  </span>
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
                      Converted Size
                    </p>
                    <p className="text-gray-800 font-bold text-xl">
                      {formatBytes(result.convertedSize)}
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
                      ({formatBytes(result.originalSize - result.convertedSize)}{" "}
                      saved)
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
