"use client";
import { useState } from "react";
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight } from "lucide-react";
import ColorPicker from "../tools/ColorPicker";
import { useLanguage } from "@/app/context/LanguageContext";
import { CustomDropdown } from "@/app/components/shared/CustomDropdown";

export type TextFormat = {
  font: string;
  size: number;
  color: string;
  bgColor: string;
  opacity: number;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  align: "left" | "center" | "right";
};

interface TextFormattingToolbarProps {
  format: TextFormat;
  onFormatChange: (format: Partial<TextFormat>) => void;
  position?: { top: number; left: number };
}

export function TextFormattingToolbar({
  format,
  onFormatChange,
  position,
}: TextFormattingToolbarProps) {
  const { t } = useLanguage();
  const [activePicker, setActivePicker] = useState<"color" | "bg" | null>(null);
  const fonts = ["Arial", "Helvetica", "Times New Roman", "Courier New", "Georgia", "Verdana"];

  const sizes = [8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 72];

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
        <label className="text-xs font-medium text-gray-600">
          {t("pdfProcessing.editor.toolbar.font")}
        </label>
        <CustomDropdown
          value={format.font}
          onChange={(value) => {
            onFormatChange({ font: value });
            setActivePicker(null);
          }}
          options={fonts.map((font) => ({ value: font, label: font }))}
          placeholder={t("pdfProcessing.editor.toolbar.font")}
          className="w-[130px] [&_button]:h-8 [&_button]:w-full [&_button]:min-w-0 [&_button]:text-sm"
        />
      </div>

      {/* Font Size Dropdown */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-600">
          {t("pdfProcessing.editor.toolbar.size")}
        </label>
        <CustomDropdown
          value={String(format.size)}
          onChange={(value) => {
            onFormatChange({ size: Number(value) });
            setActivePicker(null);
          }}
          options={sizes.map((size) => ({ value: String(size), label: `${size}px` }))}
          placeholder={t("pdfProcessing.editor.toolbar.size")}
          className="w-[80px] [&_button]:h-8 [&_button]:w-full [&_button]:min-w-0 [&_button]:text-sm"
        />
      </div>

      {/* Divider */}
      <div className="w-px h-8 bg-gray-300" />

      {/* Text Color Picker */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-600">
          {t("pdfProcessing.editor.toolbar.color")}
        </label>
        <ColorPicker
          currentColor={format.color}
          onColorChange={(color) => onFormatChange({ color })}
          buttonClassName="w-10 h-8 rounded border border-gray-300 cursor-pointer hover:scale-105 transition-transform"
          isOpen={activePicker === "color"}
          onToggle={(open) => setActivePicker(open ? "color" : null)}
        />
      </div>

      {/* Background Color Picker */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-600">
          {t("pdfProcessing.editor.toolbar.background")}
        </label>
        <ColorPicker
          currentColor={format.bgColor}
          onColorChange={(bgColor) => onFormatChange({ bgColor })}
          buttonClassName="w-10 h-8 rounded border border-gray-300 cursor-pointer hover:scale-105 transition-transform"
          isOpen={activePicker === "bg"}
          onToggle={(open) => setActivePicker(open ? "bg" : null)}
        />
      </div>

      {/* Opacity Slider */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-600">
          {t("pdfProcessing.editor.toolbar.opacity")}
        </label>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min="0"
            max="100"
            value={format.opacity}
            onChange={(e) => onFormatChange({ opacity: Number(e.target.value) })}
            onFocus={() => setActivePicker(null)}
            className="w-20 h-2 rounded-lg appearance-none cursor-pointer bg-gray-200"
            style={{
              accentColor: "#0d7377",
            }}
          />
          <span className="text-xs text-gray-600 w-8 text-right">{format.opacity}%</span>
        </div>
      </div>

      {/* Divider */}
      <div className="w-px h-8 bg-gray-300" />

      {/* Bold Button */}
      <button
        onClick={() => {
          onFormatChange({ bold: !format.bold });
          setActivePicker(null);
        }}
        className={`p-2 rounded transition ${
          format.bold
            ? "bg-rahvana-primary text-white"
            : "bg-gray-100 hover:bg-gray-200 text-gray-700"
        }`}
        title={t("pdfProcessing.editor.toolbar.bold")}
      >
        <Bold className="w-4 h-4" />
      </button>

      {/* Italic Button */}
      <button
        onClick={() => {
          onFormatChange({ italic: !format.italic });
          setActivePicker(null);
        }}
        className={`p-2 rounded transition ${
          format.italic
            ? "bg-rahvana-primary text-white"
            : "bg-gray-100 hover:bg-gray-200 text-gray-700"
        }`}
        title={t("pdfProcessing.editor.toolbar.italic")}
      >
        <Italic className="w-4 h-4" />
      </button>

      {/* Underline Button */}
      <button
        onClick={() => {
          onFormatChange({ underline: !format.underline });
          setActivePicker(null);
        }}
        className={`p-2 rounded transition ${
          format.underline
            ? "bg-rahvana-primary text-white"
            : "bg-gray-100 hover:bg-gray-200 text-gray-700"
        }`}
        title={t("pdfProcessing.editor.toolbar.underline")}
      >
        <Underline className="w-4 h-4" />
      </button>

      {/* Divider */}
      <div className="w-px h-8 bg-gray-300" />

      {/* Align Left Button */}
      <button
        onClick={() => {
          onFormatChange({ align: "left" });
          setActivePicker(null);
        }}
        className={`p-2 rounded transition ${
          format.align === "left"
            ? "bg-rahvana-primary text-white"
            : "bg-gray-100 hover:bg-gray-200 text-gray-700"
        }`}
        title={t("pdfProcessing.editor.toolbar.alignLeft")}
      >
        <AlignLeft className="w-4 h-4" />
      </button>

      {/* Align Center Button */}
      <button
        onClick={() => {
          onFormatChange({ align: "center" });
          setActivePicker(null);
        }}
        className={`p-2 rounded transition ${
          format.align === "center"
            ? "bg-rahvana-primary text-white"
            : "bg-gray-100 hover:bg-gray-200 text-gray-700"
        }`}
        title={t("pdfProcessing.editor.toolbar.alignCenter")}
      >
        <AlignCenter className="w-4 h-4" />
      </button>

      {/* Align Right Button */}
      <button
        onClick={() => {
          onFormatChange({ align: "right" });
          setActivePicker(null);
        }}
        className={`p-2 rounded transition ${
          format.align === "right"
            ? "bg-rahvana-primary text-white"
            : "bg-gray-100 hover:bg-gray-200 text-gray-700"
        }`}
        title={t("pdfProcessing.editor.toolbar.alignRight")}
      >
        <AlignRight className="w-4 h-4" />
      </button>
    </div>
  );
}
