"use client"
import React, { useEffect, useRef, useState, useCallback } from "react"
import { Move, RotateCcw, Check } from "lucide-react"
import domtoimage from "dom-to-image-more"
import { useLanguage } from "@/app/context/LanguageContext"
import { Loader } from "@/components/ui/spinner"

interface TiltCorrectionToolProps {
  processedImage: string
  onApply: (correctedImage: string) => void
  onCancel: () => void
}

export default function TiltCorrectionTool({
  processedImage,
  onApply,
  onCancel,
}: TiltCorrectionToolProps) {
  const { t } = useLanguage()
  const [horizontalTilt, setHorizontalTilt] = useState(0) // Y-axis rotation (left-right)
  const [verticalTilt, setVerticalTilt] = useState(0)     // X-axis rotation (up-down)
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null)
  const [isApplying, setIsApplying] = useState(false)

  const previewContainerRef = useRef<HTMLDivElement>(null)
  const captureContainerRef = useRef<HTMLDivElement>(null)

  // Load image once and get dimensions
  useEffect(() => {
    if (processedImage) {
      const img = new Image()
      img.crossOrigin = "anonymous"
      img.src = processedImage
      img.onload = () => {
        setImageDimensions({ width: img.width, height: img.height })
      }
    }
  }, [processedImage])

  // Calculate perspective based on image size
  const getPerspective = useCallback(() => {
    if (!imageDimensions) return 1000
    return Math.max(imageDimensions.width, imageDimensions.height) * 2
  }, [imageDimensions])

  // Get the CSS transform string
  const getTransformStyle = useCallback(() => {
    const perspective = getPerspective()
    return `perspective(${perspective}px) rotateX(${verticalTilt}deg) rotateY(${horizontalTilt}deg)`
  }, [horizontalTilt, verticalTilt, getPerspective])

  const handleApply = async () => {
    if (isApplying) return

    setIsApplying(true)
    try {
      // If no tilt applied, return original image
      if (horizontalTilt === 0 && verticalTilt === 0) {
        onApply(processedImage)
        return
      }

      // Use dom-to-image-more to capture the 3D transformed element
      if (captureContainerRef.current) {
        const dataUrl = await domtoimage.toPng(captureContainerRef.current, {
          bgcolor: 'transparent',
          quality: 1,
          scale: 2,
        })
        onApply(dataUrl)
      } else {
        onApply(processedImage)
      }
    } catch (error) {
      console.error("Error applying tilt:", error)
      onApply(processedImage)
    } finally {
      setIsApplying(false)
    }
  }

  const handleResetHorizontal = () => {
    setHorizontalTilt(0)
  }

  const handleResetVertical = () => {
    setVerticalTilt(0)
  }

  const handleResetAll = () => {
    setHorizontalTilt(0)
    setVerticalTilt(0)
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-3">
          <Move className="w-7 h-7 text-blue-600" />
          {t("pdfProcessing.editor.tilt.title")}
        </h2>
        <p className="text-gray-700">{t("pdfProcessing.editor.tilt.subtitle")}</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Controls Panel */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  {t("pdfProcessing.editor.tilt.horizontalLabel")}: <span className="font-bold text-blue-600">{horizontalTilt}°</span>
                </label>
                <button
                  onClick={handleResetHorizontal}
                  className="text-gray-500 hover:text-blue-600 transition p-1"
                  title="Reset horizontal tilt"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
              <input
                type="range"
                min="-30"
                max="30"
                value={horizontalTilt}
                onChange={(e) => setHorizontalTilt(parseInt(e.target.value))}
                className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>{t("pdfProcessing.editor.tilt.left")}</span>
                <span>{t("pdfProcessing.editor.tilt.center")}</span>
                <span>{t("pdfProcessing.editor.tilt.right")}</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  {t("pdfProcessing.editor.tilt.verticalLabel")}: <span className="font-bold text-blue-600">{verticalTilt}°</span>
                </label>
                <button
                  onClick={handleResetVertical}
                  className="text-gray-500 hover:text-blue-600 transition p-1"
                  title="Reset vertical tilt"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
              <input
                type="range"
                min="-30"
                max="30"
                value={verticalTilt}
                onChange={(e) => setVerticalTilt(parseInt(e.target.value))}
                className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>{t("pdfProcessing.editor.tilt.up")}</span>
                <span>{t("pdfProcessing.editor.tilt.center")}</span>
                <span>{t("pdfProcessing.editor.tilt.down")}</span>
              </div>
            </div>

            {/* Full Reset Button */}
            <button
              onClick={handleResetAll}
              className="w-full px-4 py-2 bg-primary/90 hover:bg-primary/100 text-white rounded-lg transition text-sm flex items-center justify-center gap-2 font-semibold"
            >
              <RotateCcw className="w-4 h-4" />
              {t("pdfProcessing.editor.tilt.resetTilt")}
            </button>
          </div>
        </div>

        {/* Preview with CSS 3D Transform */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-200 px-6 py-4 font-bold text-gray-900 text-lg flex items-center gap-3">
            <Check className="w-6 h-6 text-green-600" />
            <span>{t("pdfProcessing.editor.tilt.preview")}</span>
          </div>
          <div
            ref={previewContainerRef}
            className="p-6 flex items-center justify-center min-h-[500px] bg-gray-50"
            style={{
              backgroundImage: `
                linear-gradient(45deg, #e5e7eb 25%, transparent 25%),
                linear-gradient(-45deg, #e5e7eb 25%, transparent 25%),
                linear-gradient(45deg, transparent 75%, #e5e7eb 75%),
                linear-gradient(-45deg, transparent 75%, #e5e7eb 75%)
              `,
              backgroundSize: "30px 30px",
              backgroundPosition: "0 0, 0 15px, 15px -15px, -15px 0px",
            }}
          >
            {imageDimensions && (
              <div
                style={{
                  transform: getTransformStyle(),
                  transformStyle: "preserve-3d",
                  transition: "transform 0.15s ease-out",
                  transformOrigin: "center center",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={processedImage}
                  alt="Preview"
                  className="max-w-full max-h-[450px] object-contain rounded-lg shadow-md"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hidden capture container - positioned offscreen but visible for html2canvas */}
      <div
        style={{
          position: "absolute",
          left: "-9999px",
          top: "0px",
          opacity: 0,
          pointerEvents: "none",
          overflow: "visible",
        }}
      >
        <div
          ref={captureContainerRef}
          style={{
            display: "inline-block",
            padding: "50px", // Extra padding to capture the full transformed image
            background: "transparent",
          }}
        >
          {imageDimensions && (
            <div
              style={{
                transform: getTransformStyle(),
                transformStyle: "preserve-3d",
                transformOrigin: "center center",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={processedImage}
                alt="Capture"
                style={{
                  width: imageDimensions.width,
                  height: imageDimensions.height,
                  display: "block",
                }}
                crossOrigin="anonymous"
              />
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-4">
        <button
          onClick={onCancel}
          disabled={isApplying}
          className="px-10 py-4 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-xl font-bold transition-all flex items-center gap-3 text-lg shadow-md disabled:opacity-50"
        >
          <RotateCcw className="w-6 h-6" />
          {t("pdfProcessing.editor.signature.cancel")}
        </button>
        <button
          onClick={handleApply}
          disabled={isApplying}
          className="px-10 py-4 bg-primary/90 hover:bg-primary/100 text-white rounded-xl font-bold transition-all flex items-center gap-3 text-lg shadow-md disabled:opacity-50"
        >
          {isApplying ? (
            <Loader size="sm" text={t("pdfProcessing.editor.tilt.applying")} />
          ) : (
            <>
              <Check className="w-6 h-6" />
              {t("pdfProcessing.editor.tilt.applyContinue")}
            </>
          )}
        </button>
      </div>
    </div>
  )
}
