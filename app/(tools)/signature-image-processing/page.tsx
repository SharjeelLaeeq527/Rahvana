"use client";

import { useState, useEffect } from "react";
import { AlertCircle } from "lucide-react";
import { Loader } from "@/components/ui/spinner";
import dynamic from "next/dynamic";
import { useLanguage } from "@/app/context/LanguageContext";

// Dynamically import components that use browser APIs - disable SSR
const SignatureUploader = dynamic(
  () => import("@/app/components/pdf-editor/signature/SignatureUploader"),
  {
    ssr: false,
    loading: () => (
      <div className="flex justify-center p-8">
        <Loader size="md" />
      </div>
    ),
  },
);
const SignaturePreview = dynamic(
  () => import("@/app/components/pdf-editor/signature/SignaturePreview"),
  {
    ssr: false,
    loading: () => (
      <div className="flex justify-center p-8">
        <Loader size="md" />
      </div>
    ),
  },
);

// Dynamic import to avoid SSR issues with browser-only APIs
type ImageProcessorModule = typeof import("@/lib/imageProcessor");
let imageProcessorModule: ImageProcessorModule | null = null;

export default function SignatureRemoverPage() {
  const { t } = useLanguage();
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, setIsModuleLoaded] = useState(false);

  // Load the image processor module on client-side only
  useEffect(() => {
    import("@/lib/imageProcessor").then((mod) => {
      imageProcessorModule = mod;
      setIsModuleLoaded(true);
    });
  }, []);

  const handleFileSelect = async (file: File) => {
    if (!imageProcessorModule) {
      setError(t("signatureProcessing.errors.loading"));
      return;
    }

    setError(null);
    setOriginalImage(null);
    setProcessedImage(null);

    const validation = imageProcessorModule.validateImageFile(file);
    if (!validation.valid) {
      setError(validation.error || t("pdfProcessing.errors.invalidFile"));
      return;
    }

    try {
      setIsProcessing(true);

      const imageData = await imageProcessorModule.readFileAsDataURL(file);
      setOriginalImage(imageData);

      const processor = new imageProcessorModule.SignatureImageProcessor();

      const processed = await processor.processImage(imageData, {
        threshold: 140,
        darknessFactor: 0.3,
        contrast: 2.5,
        noiseReduction: true,
        edgeSmoothing: true,
        aggressiveMode: true,
      });

      setProcessedImage(processed);
      processor.destroy();

      setTimeout(() => {
        setIsProcessing(false);
      }, 500);
    } catch (err) {
      console.error("Processing error:", err);
      setError(t("signatureProcessing.errors.failed"));
      setIsProcessing(false);
    }
  };
  

  const handleDownload = () => {
    if (processedImage && imageProcessorModule) {
      const timestamp = new Date().getTime();
      imageProcessorModule.downloadImage(
        processedImage,
        `signature-transparent-${timestamp}.png`,
      );
    }
  };

  const handleReset = () => {
    setOriginalImage(null);
    setProcessedImage(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <header className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 mb-3">
            {t("signatureProcessing.title")}
          </h1>
          <p className="text-slate-600 text-sm sm:text-base md:text-lg max-w-3xl mx-auto">
            {t("signatureProcessing.subtitle")}
          </p>
        </header>

        <div className="bg-slate-50 rounded-lg border border-slate-200 p-6 sm:p-8 mb-8 max-w-5xl mx-auto">
          <h2 className="text-lg sm:text-xl font-semibold text-slate-900 mb-6">
            {t("signatureProcessing.bestPractices")}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                title: t("signatureProcessing.whitePaper.title"),
                description: t("signatureProcessing.whitePaper.description"),
              },
              {
                title: t("signatureProcessing.goodLighting.title"),
                description: t("signatureProcessing.goodLighting.description"),
              },
              {
                title: t("signatureProcessing.darkInk.title"),
                description: t("signatureProcessing.darkInk.description"),
              },
            ].map((item, idx) => (
              <div key={idx} className="border-l-2 border-slate-300 pl-4">
                <h3 className="font-medium text-slate-900 mb-1 text-sm">
                  {item.title}
                </h3>
                <p className="text-slate-600 text-xs sm:text-sm">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 max-w-2xl mx-auto">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
              <div>
                <p className="text-red-800 font-medium text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="max-w-3xl mx-auto">
          {!originalImage && !isProcessing && (
            <SignatureUploader
              onFileSelect={handleFileSelect}
              disabled={isProcessing}
            />
          )}

          {processedImage && originalImage && !isProcessing && (
            <SignaturePreview
              originalImage={originalImage}
              processedImage={processedImage}
              onDownload={handleDownload}
              onReset={handleReset}
            />
          )}
        </div>
      </div>
    </div>
  );
}
