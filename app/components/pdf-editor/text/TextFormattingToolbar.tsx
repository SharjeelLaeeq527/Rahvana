"use client"
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, ChevronDown } from "lucide-react"
import ColorPicker from "../tools/ColorPicker"
import { useLanguage } from "@/app/context/LanguageContext"

export type TextFormat = {
  font: string
  size: number
  color: string
  bgColor: string
  opacity: number
  bold: boolean
  italic: boolean
  underline: boolean
  align: "left" | "center" | "right"
}

interface TextFormattingToolbarProps {
  format: TextFormat
  onFormatChange: (format: Partial<TextFormat>) => void
  position?: { top: number; left: number }
}

export function TextFormattingToolbar({ format, onFormatChange, position }: TextFormattingToolbarProps) {
  const { t } = useLanguage()
  const fonts = ["Arial", "Helvetica", "Times New Roman", "Courier New", "Georgia", "Verdana"]

  const sizes = [8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 72]

  return (
    <div
      className="absolute bg-white border border-gray-300 rounded-lg shadow-xl p-3 z-50 flex flex-wrap items-center gap-3"
      style={{
        top: position?.top || 60,
        left: position?.left || "50%",
        transform: position?.left ? "none" : "translateX(-50%)",
        minWidth: "max-content",
      }}
    >
      {/* Font Family Dropdown */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-600">{t("pdfProcessing.editor.toolbar.font")}</label>
        <div className="relative">
          <select
            value={format.font}
            onChange={(e) => onFormatChange({ font: e.target.value })}
            className="px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none pr-6 bg-white"
            style={{ fontFamily: format.font }}
          >
            {fonts.map((font) => (
              <option key={font} value={font} style={{ fontFamily: font }}>
                {font}
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 absolute right-1.5 top-2 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Font Size Dropdown */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-600">{t("pdfProcessing.editor.toolbar.size")}</label>
        <div className="relative">
          <select
            value={format.size}
            onChange={(e) => onFormatChange({ size: Number(e.target.value) })}
            className="px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none pr-6 bg-white"
          >
            {sizes.map((size) => (
              <option key={size} value={size}>
                {size}px
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 absolute right-1.5 top-2 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Divider */}
      <div className="w-px h-8 bg-gray-300" />

      {/* Text Color Picker */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-600">{t("pdfProcessing.editor.toolbar.color")}</label>
        <ColorPicker 
          currentColor={format.color}
          onColorChange={(color) => onFormatChange({ color })}
          buttonClassName="w-10 h-8 rounded border border-gray-300 cursor-pointer hover:scale-105 transition-transform"
        />
      </div>

      {/* Background Color Picker */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-600">{t("pdfProcessing.editor.toolbar.background")}</label>
        <ColorPicker 
          currentColor={format.bgColor}
          onColorChange={(bgColor) => onFormatChange({ bgColor })}
          buttonClassName="w-10 h-8 rounded border border-gray-300 cursor-pointer hover:scale-105 transition-transform"
        />
      </div>

      {/* Opacity Slider */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-600">{t("pdfProcessing.editor.toolbar.opacity")}</label>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min="0"
            max="100"
            value={format.opacity}
            onChange={(e) => onFormatChange({ opacity: Number(e.target.value) })}
            className="w-20 h-2 rounded-lg appearance-none cursor-pointer bg-gray-200"
            style={{
              accentColor: "#3b82f6",
            }}
          />
          <span className="text-xs text-gray-600 w-8 text-right">{format.opacity}%</span>
        </div>
      </div>

      {/* Divider */}
      <div className="w-px h-8 bg-gray-300" />

      {/* Bold Button */}
      <button
        onClick={() => onFormatChange({ bold: !format.bold })}
        className={`p-2 rounded transition ${
          format.bold ? "bg-blue-500 text-white" : "bg-gray-100 hover:bg-gray-200 text-gray-700"
        }`}
        title={t("pdfProcessing.editor.toolbar.bold")}
      >
        <Bold className="w-4 h-4" />
      </button>

      {/* Italic Button */}
      <button
        onClick={() => onFormatChange({ italic: !format.italic })}
        className={`p-2 rounded transition ${
          format.italic ? "bg-blue-500 text-white" : "bg-gray-100 hover:bg-gray-200 text-gray-700"
        }`}
        title={t("pdfProcessing.editor.toolbar.italic")}
      >
        <Italic className="w-4 h-4" />
      </button>

      {/* Underline Button */}
      <button
        onClick={() => onFormatChange({ underline: !format.underline })}
        className={`p-2 rounded transition ${
          format.underline ? "bg-blue-500 text-white" : "bg-gray-100 hover:bg-gray-200 text-gray-700"
        }`}
        title={t("pdfProcessing.editor.toolbar.underline")}
      >
        <Underline className="w-4 h-4" />
      </button>

      {/* Divider */}
      <div className="w-px h-8 bg-gray-300" />

      {/* Align Left Button */}
      <button
        onClick={() => onFormatChange({ align: "left" })}
        className={`p-2 rounded transition ${
          format.align === "left" ? "bg-blue-500 text-white" : "bg-gray-100 hover:bg-gray-200 text-gray-700"
        }`}
        title={t("pdfProcessing.editor.toolbar.alignLeft")}
      >
        <AlignLeft className="w-4 h-4" />
      </button>

      {/* Align Center Button */}
      <button
        onClick={() => onFormatChange({ align: "center" })}
        className={`p-2 rounded transition ${
          format.align === "center" ? "bg-blue-500 text-white" : "bg-gray-100 hover:bg-gray-200 text-gray-700"
        }`}
        title={t("pdfProcessing.editor.toolbar.alignCenter")}
      >
        <AlignCenter className="w-4 h-4" />
      </button>

      {/* Align Right Button */}
      <button
        onClick={() => onFormatChange({ align: "right" })}
        className={`p-2 rounded transition ${
          format.align === "right" ? "bg-blue-500 text-white" : "bg-gray-100 hover:bg-gray-200 text-gray-700"
        }`}
        title={t("pdfProcessing.editor.toolbar.alignRight")}
      >
        <AlignRight className="w-4 h-4" />
      </button>
    </div>
  )
}