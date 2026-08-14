"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Contrast, Sun, Scan } from "lucide-react";
import { Loader } from "@/components/ui/spinner";
import dynamic from "next/dynamic";
import { useLanguage } from "@/app/context/LanguageContext";
import { ResultGate } from "@/app/components/entitlements/ResultGate";
import { QuickAccessButton } from "@/app/components/shared/QuickAccessButton";
import FileUpload from "@/app/components/shared/FileUpload";
import { useToast } from "@/app/components/shared/ToastProvider";

const SignaturePreview = dynamic(
  () => import("@/app/components/pdf-editor/signature/SignaturePreview"),
  {
    ssr: false,
    loading: () => (
      <div className="flex justify-center p-8">
        <Loader size="md" />
      </div>
    ),
  }
);

// Dynamic import to avoid SSR issues with browser-only APIs
type ImageProcessorModule = typeof import("@/lib/imageProcessor");
let imageProcessorModule: ImageProcessorModule | null = null;

export default function SignatureRemoverPage() {
  const { t } = useLanguage();
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [, setIsModuleLoaded] = useState(false);

  const { showToast } = useToast();

  // Pro tips carousel
  const tipsTrackRef = useRef<HTMLDivElement>(null);

  // Load the image processor module on client-side only
  useEffect(() => {
    import("@/lib/imageProcessor").then((mod) => {
      imageProcessorModule = mod;
      setIsModuleLoaded(true);
    });
  }, []);

  const scrollTips = (direction: "prev" | "next") => {
    const track = tipsTrackRef.current;
    if (!track) return;
    const amount = track.clientWidth * 0.8;
    track.scrollBy({ left: direction === "next" ? amount : -amount, behavior: "smooth" });
  };

  const handleFileSelect = async (file: File) => {
    if (!imageProcessorModule) {
      showToast(t("signatureProcessing.errors.loading"), "error");
      return;
    }

    setOriginalImage(null);
    setProcessedImage(null);

    const validation = imageProcessorModule.validateImageFile(file);
    if (!validation.valid) {
      showToast(validation.error || t("pdfProcessing.errors.invalidFile"), "error");
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
      showToast(t("signatureProcessing.errors.failed"), "error");
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (processedImage && imageProcessorModule) {
      const timestamp = new Date().getTime();
      imageProcessorModule.downloadImage(processedImage, `signature-transparent-${timestamp}.png`);
    }
  };

  const handleReset = () => {
    setOriginalImage(null);
    setProcessedImage(null);
  };

  const proTips = [
    {
      icon: Contrast,
      title: t("signatureProcessing.whitePaper.title"),
      description: t("signatureProcessing.whitePaper.description"),
    },
    {
      icon: Sun,
      title: t("signatureProcessing.goodLighting.title"),
      description: t("signatureProcessing.goodLighting.description"),
    },
    {
      icon: Scan,
      title: t("signatureProcessing.darkInk.title"),
      description: t("signatureProcessing.darkInk.description"),
    },
  ];

  return (
    <div
      className="min-h-screen"
      style={{
        background:
          "radial-gradient(1200px 600px at 50% -10%, #dff1f7 0%, #eef7fb 40%, #f7fbfd 70%, #ffffff 100%)",
      }}
    >
      <div className="site-main-px site-main-py mt-[55px]">
        {/* Hero */}
        <header className="mb-10 text-center sm:mb-14">
          <h1 className="mb-4 text-3xl leading-[1.1] font-extrabold tracking-tight text-[#00595C] sm:text-5xl md:text-6xl">
            {t("signatureProcessing.title")}
          </h1>
          <p className="mx-auto max-w-2xl text-sm leading-relaxed text-[#4a6b70] sm:text-base md:text-lg">
            {t("signatureProcessing.subtitle")}
          </p>
          <div className="mt-6 flex justify-center">
            <QuickAccessButton
              item={{
                id: "snap-sign",
                title: "Snap & Sign",
                href: "/signature-image-processing",
                icon_name: "PenTool",
              }}
            />
          </div>
        </header>

        {/* Main Content */}
        <div className="mx-auto max-w-3xl">
          {!originalImage && !isProcessing && (
            <FileUpload
              fieldName="signature"
              accept="image/*"
              variant="premium"
              showPreview
              title={t("signatureProcessing.uploader.uploadTitle")}
              description={t("signatureProcessing.uploader.browse")}
              buttonText={t("signatureProcessing.uploader.chooseFile")}
              helperText={t("signatureProcessing.uploader.supported")}
              onFileUpload={(_, file) => {
                if (file instanceof File) {
                  handleFileSelect(file);
                }
              }}
            />
          )}

          {processedImage && originalImage && !isProcessing && (
            <ResultGate feature="snap_sign">
              <SignaturePreview
                originalImage={originalImage}
                processedImage={processedImage}
                onDownload={handleDownload}
                onReset={handleReset}
              />
            </ResultGate>
          )}
        </div>

        {/* Pro Tips carousel */}
        {!originalImage && !isProcessing && (
          <section className="mx-auto mt-14 max-w-6xl sm:mt-20">
            <div className="mb-5 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
              <h2 className="min-w-0 truncate text-base font-semibold text-[#123f42] sm:text-lg">
                {t("signatureProcessing.bestPractices")}
              </h2>
              <div className="flex shrink-0 items-center gap-2 lg:hidden">
                <button
                  type="button"
                  onClick={() => scrollTips("prev")}
                  aria-label="Previous tip"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-[#d9e9ee] bg-white text-[#0d7377] shadow-sm transition-colors hover:bg-[#f0f9fa]"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollTips("next")}
                  aria-label="Next tip"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-[#d9e9ee] bg-white text-[#0d7377] shadow-sm transition-colors hover:bg-[#f0f9fa]"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div
              ref={tipsTrackRef}
              className="-mx-1 flex snap-x snap-mandatory [scrollbar-width:none] gap-4 overflow-x-auto px-1 pb-2 [&::-webkit-scrollbar]:hidden"
            >
              {proTips.map((item, idx) => (
                <div
                  key={idx}
                  className={`w-[80%] shrink-0 snap-start rounded-2xl border border-[#e4eff2] bg-white p-5 shadow-[0_2px_14px_rgba(13,115,119,0.06)] transition-shadow hover:shadow-[0_8px_24px_rgba(13,115,119,0.10)] sm:w-[45%] sm:p-6 lg:w-[32%]`}
                >
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#eaf4f9]">
                    <item.icon className="h-5 w-5 text-[#0d7377]" />
                  </div>
                  <h3 className="mb-1.5 text-sm font-semibold text-[#123f42] sm:text-base">
                    {item.title}
                  </h3>
                  <p className="text-xs leading-relaxed text-[#5c7b80] sm:text-sm">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
