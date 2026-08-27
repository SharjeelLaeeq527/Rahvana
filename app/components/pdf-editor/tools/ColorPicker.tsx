"use client";

import { useState } from "react";

interface ColorPickerProps {
  currentColor: string;
  onColorChange: (color: string) => void;
  buttonClassName?: string;
  isOpen?: boolean;
  onToggle?: (open: boolean) => void;
}

export default function ColorPicker({
  currentColor,
  onColorChange,
  buttonClassName = "w-8 h-8 rounded-full shadow-sm border-2 border-gray-300 hover:scale-105 transition-transform",
  isOpen,
  onToggle,
}: ColorPickerProps) {
  const [localShowPicker, setLocalShowPicker] = useState(false);
  const [showCustom, setShowCustom] = useState(false);

  const showPicker = isOpen !== undefined ? isOpen : localShowPicker;
  const setShowPicker = (val: boolean) => {
    if (onToggle) {
      onToggle(val);
    } else {
      setLocalShowPicker(val);
    }
  };

  // SmallPDF exact colors (3 rows x 4 columns)
  const colors = [
    ["#000000", "#FFFFFF", "#9E9E9E", "#F44336"], // Black, White, Gray, Red
    ["#FF9800", "#FFC107", "#2196F3", "#9C27B0"], // Orange, Yellow, Blue, Purple
    ["#4CAF50", "#E91E63", "", ""], // Green, Pink, (empty spaces)
  ];

  const handleColorSelect = (color: string) => {
    onColorChange(color);
    setShowPicker(false);
    setShowCustom(false);
  };

  return (
    <div className="relative flex items-center">
      {/* Color Button */}
      <button
        onClick={() => setShowPicker(!showPicker)}
        className={buttonClassName}
        style={{ backgroundColor: currentColor }}
        title="Change color"
      />

      {/* Color Picker Dropdown */}
      {showPicker && (
        <div className="absolute top-10 left-0 bg-white rounded-lg shadow-xl p-2 border border-gray-200 z-50">
          {/* Preset Colors Grid - 3 rows x 4 columns */}
          <div className="grid gap-1.5 mb-2">
            {colors.map((row, rowIndex) => (
              <div key={rowIndex} className="flex gap-1.5">
                {row.map((color, colIndex) => {
                  // Skip empty slots
                  if (!color) return <div key={colIndex} className="w-7 h-7" />;

                  return (
                    <button
                      key={color}
                      onClick={() => handleColorSelect(color)}
                      className={`w-7 h-7 rounded-full border-2 hover:scale-110 transition-transform ${
                        currentColor === color
                          ? "border-blue-500 ring-2 ring-blue-200"
                          : "border-gray-300"
                      }`}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  );
                })}
              </div>
            ))}
          </div>

          {/* Custom Color Section */}
          {!showCustom ? (
            <button
              onClick={() => setShowCustom(true)}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 rounded border border-gray-200 transition"
            >
              <span className="text-lg">+</span>
              <span>Custom color</span>
            </button>
          ) : (
            <div className="pt-2 border-t border-gray-200">
              <input
                type="color"
                value={currentColor}
                onChange={(e) => onColorChange(e.target.value)}
                className="w-full h-8 rounded border border-gray-300 cursor-pointer"
                title="Pick custom color"
              />
              <button
                onClick={() => setShowCustom(false)}
                className="w-full mt-1.5 py-1 text-xs text-gray-600 hover:bg-gray-50 rounded"
              >
                Back to presets
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
