"use client";
import { useState } from "react";
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ColorPicker from "../tools/ColorPicker";
import { useLanguage } from "@/app/context/LanguageContext";

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
        <Select
          value={format.font}
          onValueChange={(value) => {
            onFormatChange({ font: value });
            setActivePicker(null);
          }}
        >
          <SelectTrigger
            className="h-8 w-[130px] text-sm bg-white border-gray-300"
            style={{ fontFamily: format.font }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="z-[9999]">
            {fonts.map((font) => (
              <SelectItem key={font} value={font}>
                <span style={{ fontFamily: font }}>{font}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Font Size Dropdown */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-600">
          {t("pdfProcessing.editor.toolbar.size")}
        </label>
        <Select
          value={String(format.size)}
          onValueChange={(value) => {
            onFormatChange({ size: Number(value) });
            setActivePicker(null);
          }}
        >
          <SelectTrigger
            className="h-8 w-[80px] text-sm bg-white border-gray-300"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="z-[9999]">
            {sizes.map((size) => (
              <SelectItem key={size} value={String(size)}>
                {size}px
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
