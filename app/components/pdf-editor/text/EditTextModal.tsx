"use client"
import { Button } from "@/components/ui/button"
import { X, Lock } from "lucide-react"
import { useLanguage } from "@/app/context/LanguageContext"

interface EditTextModalProps {
  isOpen: boolean
  onClose: () => void
}

export function EditTextModal({ isOpen, onClose }: EditTextModalProps) {
  const { t } = useLanguage()
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-linear-to-r from-blue-600 to-purple-600 text-white px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Lock className="w-6 h-6" />
            <div>
              <h2 className="text-xl font-bold">{t("pdfProcessing.editor.editText.title")}</h2>
              <p className="text-blue-100 text-sm">{t("pdfProcessing.editor.editText.premium")}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-8">
          <div className="text-center mb-6">
            <div className="inline-flex w-16 h-16 rounded-full bg-blue-100 items-center justify-center mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">{t("pdfProcessing.editor.editText.comingSoon")}</h3>
            <p className="text-gray-600 text-sm mb-4">
              {t("pdfProcessing.editor.editText.description")}
            </p>
          </div>

          {/* Features Preview */}
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <p className="text-sm font-semibold text-blue-900 mb-3">{t("pdfProcessing.editor.editText.willBeAbleTo")}:</p>
            <ul className="space-y-2 text-sm text-blue-800">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span>{t("pdfProcessing.editor.editText.feature1")}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span>{t("pdfProcessing.editor.editText.feature2")}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span>{t("pdfProcessing.editor.editText.feature3")}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span>{t("pdfProcessing.editor.editText.feature4")}</span>
              </li>
            </ul>
          </div>

          {/* CTA */}
          <div className="bg-linear-to-r from-blue-50 to-purple-50 rounded-lg p-4 mb-6 border border-blue-200">
            <p className="text-sm text-gray-700">
              <span className="font-semibold text-blue-900">{t("pdfProcessing.editor.editText.proTipTitle")}:</span> {t("pdfProcessing.editor.editText.proTip")}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-4 bg-gray-50">
          <Button onClick={onClose} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
            {t("pdfProcessing.editor.editText.gotIt")}
          </Button>
        </div>
      </div>
    </div>
  )
}
