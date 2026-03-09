"use client"

import { useRef, useState } from "react"
import SignatureCanvas from "react-signature-canvas"
import { useLanguage } from "@/app/context/LanguageContext"

type Props = {
  onSave: (dataURL: string) => void
  closeModal: () => void
}

export default function SignaturePad({ onSave, closeModal }: Props) {
  const { t } = useLanguage()
  const sigRef = useRef<SignatureCanvas | null>(null)
  const [penColor, setPenColor] = useState("#000000")

  const colors = [
    { name: t("pdfProcessing.editor.signature.black"), value: "#000000" },
    { name: t("pdfProcessing.editor.signature.blue"), value: "#1E40AF" },
    { name: t("pdfProcessing.editor.signature.red"), value: "#DC2626" },
  ]

  const handleSave = () => {
    if (!sigRef.current?.isEmpty()) {
      const canvas = sigRef.current?.getCanvas()
      const dataURL = canvas?.toDataURL("image/png")
      if (dataURL) {
        onSave(dataURL)
        closeModal() // Modal band karne ke liye
      }
    }
  }

  const handleClear = () => {
    sigRef.current?.clear()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        {colors.map((color) => (
          <button
            key={color.value}
            onClick={() => setPenColor(color.value)}
            className={`w-8 h-8 rounded-full transition-all ${
              penColor === color.value ? "ring-2 ring-offset-2 ring-blue-500 scale-110" : ""
            }`}
            style={{ backgroundColor: color.value }}
          />
        ))}
      </div>

      <div className="bg-white border-2 border-gray-200 rounded-lg overflow-hidden">
        <SignatureCanvas
          ref={sigRef}
          penColor={penColor}
          canvasProps={{ className: "w-full h-48 touch-none", style: { background: "white" } }}
        />
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleClear}
          className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
        >
          {t("pdfProcessing.editor.signature.clear")}
        </button>
        <button
          onClick={closeModal}
          className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
        >
          {t("pdfProcessing.editor.signature.cancel")}
        </button>
        <button
          onClick={handleSave}
          className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
        >
          {t("pdfProcessing.editor.signature.create")}
        </button>
      </div>
    </div>
  )
}