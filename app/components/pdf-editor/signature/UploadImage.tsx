// components/signature-tool/UploadImage.tsx
"use client"

import React, { useState, useEffect } from "react"
import NextImage from "next/image"
import { SignatureImageProcessor } from "@/lib/imageProcessor"
import { useLanguage } from "@/app/context/LanguageContext"

type Props = {
  onUpload: (dataURL: string) => void
  closeModal: () => void
}

export default function UploadImage({ onUpload, closeModal }: Props) {
  const { t } = useLanguage()
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [processedImage, setProcessedImage] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedColor, setSelectedColor] = useState<string>("#000000")

  const colors = [
    { name: t("pdfProcessing.editor.signature.black"), value: "#000000" },
    { name: t("pdfProcessing.editor.signature.blue"), value: "#2563eb" },
    { name: t("pdfProcessing.editor.signature.red"), value: "#dc2626" },
  ]

  useEffect(() => {
    if (uploadedImage) processUploadedImage()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploadedImage])

  useEffect(() => {
    if (processedImage && selectedColor) applyColorToSignature()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedColor, processedImage])

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/")) {
      alert(t("pdfProcessing.errors.invalidFile"))
      return
    }
    const reader = new FileReader()
    reader.onload = (ev) => {
      if (typeof ev.target?.result === "string") {
        setUploadedImage(ev.target.result)
      }
    }
    reader.readAsDataURL(file)
  }

  const processUploadedImage = async () => {
    if (!uploadedImage) return
    setIsProcessing(true)
    try {
      const processor = new SignatureImageProcessor()
      const result = await processor.processImage(uploadedImage, {
        threshold: 140,
        contrast: 2.5,
        darknessFactor: 0.3,
        noiseReduction: true,
        edgeSmoothing: true,
        aggressiveMode: true,
      })
      setProcessedImage(result)
      processor.destroy()
    } catch (err) {
      console.error(err)
      alert(t("pdfProcessing.editor.signature.failed"))
    } finally {
      setIsProcessing(false)
    }
  }

  const applyColorToSignature = () => {
    if (!processedImage) return
    const img = new Image()
    img.src = processedImage
    img.onload = () => {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      if (!ctx) return
      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imageData.data

      const hex = selectedColor.replace("#", "")
      const r = parseInt(hex.substring(0, 2), 16)
      const g = parseInt(hex.substring(2, 4), 16)
      const b = parseInt(hex.substring(4, 6), 16)

      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] > 0) {
          const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3
          const factor = 1 - brightness / 255
          data[i] = r * factor
          data[i + 1] = g * factor
          data[i + 2] = b * factor
        }
      }
      ctx.putImageData(imageData, 0, 0)
      setProcessedImage(canvas.toDataURL("image/png"))
    }
  }

  const handleClear = () => {
    setUploadedImage(null)
    setProcessedImage(null)
    setSelectedColor("#000000")
  }

  const handleCreate = () => {
    if (processedImage) {
      onUpload(processedImage)
      closeModal()
    }
  }

  return (
    <div className="space-y-4">
      {/* Color Selection */}
      <div className="flex gap-3">
        {colors.map((color) => (
          <button
            key={color.value}
            onClick={() => setSelectedColor(color.value)}
            className={`w-10 h-10 rounded-full transition-all ${
              selectedColor === color.value ? "ring-4 ring-blue-300 ring-offset-2" : ""
            }`}
            style={{ backgroundColor: color.value }}
            title={color.name}
          />
        ))}
      </div>

      {/* Canvas Area */}
      <div className="relative border-2 border-gray-200 rounded-lg bg-white overflow-hidden" style={{ height: "400px" }}>
        {!processedImage ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <label className="cursor-pointer">
              <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              <div className="text-center text-gray-400">
                <svg className="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <p className="text-sm">{t("pdfProcessing.editor.signature.uploadPlaceholder")}</p>
              </div>
            </label>
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center p-8">
            {isProcessing ? (
              <div className="text-blue-600 text-sm">{t("pdfProcessing.editor.signature.processing")}</div>
            ) : processedImage ? (
              <NextImage src={processedImage} alt="Processed Signature" fill className="object-contain" unoptimized />
            ) : null}
          </div>
        )}
      </div>

      {/* Buttons */}
      <div className="flex justify-end gap-3">
        {processedImage && (
          <button onClick={handleClear} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition">
            {t("pdfProcessing.editor.signature.clear")}
          </button>
        )}
        <button onClick={closeModal} className="px-5 py-2 text-sm text-gray-700 font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition">
          {t("pdfProcessing.editor.signature.cancel")}
        </button>
        <button
          onClick={handleCreate}
          disabled={!processedImage || isProcessing}
          className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {t("pdfProcessing.editor.signature.create")}
        </button>
      </div>
    </div>
  )
}