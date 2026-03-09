"use client"

import { Copy } from "lucide-react"
import ColorPicker from "../tools/ColorPicker"
import type { ShapeAnnotation } from "@/lib/store"
import { useLanguage } from "@/app/context/LanguageContext"

export default function ShapeFormattingToolbar({
  shape,
  onUpdate,
  onDuplicate,
}: {
  shape: ShapeAnnotation
  onUpdate: (id: string, patch: Partial<ShapeAnnotation>) => void
  onDuplicate?: (shape: ShapeAnnotation) => void
}) {
  const { t } = useLanguage()
  const strokeWidth = shape.strokeWidth || 2

  const handleDuplicate = () => {
    if (onDuplicate) {
      onDuplicate(shape)
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 mt-16 flex items-center gap-3">
      {/* Color Picker */}
      <ColorPicker 
        currentColor={shape.color}
        onColorChange={(color) => onUpdate(shape.id, { color })}
      />

      <div className="w-px h-6 bg-gray-200" />

      {/* Size Control - Default 12, can go smaller */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onUpdate(shape.id, { size: Math.max(8, shape.size - 2) })}
          className="w-6 h-6 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded border border-gray-300 transition text-gray-600 text-sm"
        >
          −
        </button>
        <input
          type="number"
          value={Math.round(shape.size)}
          onChange={(e) => {
            const newSize = Math.max(8, Math.min(100, parseInt(e.target.value) || 12))
            onUpdate(shape.id, { size: newSize })
          }}
          className="w-12 px-1.5 py-1 text-xs text-center border border-gray-300 rounded focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
          min="8"
          max="100"
        />
        <button
          onClick={() => onUpdate(shape.id, { size: Math.min(100, shape.size + 2) })}
          className="w-6 h-6 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded border border-gray-300 transition text-gray-600 text-sm"
        >
          +
        </button>
      </div>

      {/* Stroke Width (only for rectangle) */}
      {shape.type === "rectangle" && (
        <>
          <div className="w-px h-6 bg-gray-200" />
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-600">{t("pdfProcessing.editor.toolbar.line")}:</span>
            <button
              onClick={() => onUpdate(shape.id, { strokeWidth: Math.max(1, strokeWidth - 1) })}
              className="w-6 h-6 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded border border-gray-300 transition text-gray-600 text-sm"
            >
              −
            </button>
            <input
              type="number"
              value={strokeWidth}
              onChange={(e) => {
                const newWidth = Math.max(1, Math.min(10, parseInt(e.target.value) || 2))
                onUpdate(shape.id, { strokeWidth: newWidth })
              }}
              className="w-10 px-1.5 py-1 text-xs text-center border border-gray-300 rounded focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
              min="1"
              max="10"
            />
            <button
              onClick={() => onUpdate(shape.id, { strokeWidth: Math.min(10, strokeWidth + 1) })}
              className="w-6 h-6 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded border border-gray-300 transition text-gray-600 text-sm"
            >
              +
            </button>
          </div>
        </>
      )}

      {/* Duplicate Button */}
      {onDuplicate && (
        <>
          <div className="w-px h-6 bg-gray-200" />
          <button
            onClick={handleDuplicate}
            className="p-1.5 hover:bg-gray-100 rounded transition-colors group"
            title={t("pdfProcessing.editor.toolbar.duplicate")}
          >
            <Copy className="w-4 h-4 text-gray-600 group-hover:text-blue-600" />
          </button>
        </>
      )}
    </div>
  )
}