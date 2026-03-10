"use client";
import React, { useState, useEffect } from "react";
import { useLanguage } from "@/app/context/LanguageContext";

type Props = {
  onGenerate: (dataURL: string) => void;
  closeModal: () => void;
};

export default function TextSignature({ onGenerate, closeModal }: Props) {
  const { t } = useLanguage();
  const [name, setName] = useState("");
  const [selectedFont, setSelectedFont] = useState(0);
  const [, setFontsLoaded] = useState(false);

  // Professional signature fonts - diverse styles
  const fonts = [
    { name: "Great Vibes", value: "'Great Vibes', cursive", weight: "400", style: "Elegant Script" },
    { name: "Allura", value: "'Allura', cursive", weight: "400", style: "Formal Cursive" },
    { name: "Alex Brush", value: "'Alex Brush', cursive", weight: "400", style: "Classic Script" },
    { name: "Pinyon Script", value: "'Pinyon Script', cursive", weight: "400", style: "Traditional" },
    { name: "Tangerine", value: "'Tangerine', cursive", weight: "700", style: "Refined" },
    { name: "Sacramento", value: "'Sacramento', cursive", weight: "400", style: "Modern Script" },
    { name: "Satisfy", value: "'Satisfy', cursive", weight: "400", style: "Casual Elegant" },
    { name: "Marck Script", value: "'Marck Script', cursive", weight: "400", style: "Bold Script" },
  ];

  // Load Google Fonts dynamically
  useEffect(() => {
    const fontFamilies = fonts.map(f => f.name.replace(/ /g, '+')).join('&family=');
    const link = document.createElement('link');
    link.href = `https://fonts.googleapis.com/css2?family=${fontFamilies}&display=swap`;
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    link.onload = () => setFontsLoaded(true);

    return () => {
      document.head.removeChild(link);
    };
  }, );

  const handleGenerate = () => {
    if (!name.trim()) {
      alert(t("editor.signature.enterName"));
      return;
    }

    if (typeof onGenerate !== 'function') {
      console.error("onGenerate is not a function");
      return;
    }

    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      
      if (!ctx) {
        alert("Failed to create signature. Please try again.");
        return;
      }

      // Set canvas size
      canvas.width = 600;
      canvas.height = 200;

      // Transparent background
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw text signature
      const font = fonts[selectedFont];
      ctx.font = `${font.weight} 72px ${font.value}`;
      ctx.fillStyle = "#000000";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(name, canvas.width / 2, canvas.height / 2);

      const dataURL = canvas.toDataURL("image/png");
      onGenerate(dataURL);
      
      if (typeof closeModal === 'function') {
        closeModal();
      }
    } catch (error) {
      console.error("Error generating signature:", error);
      alert(t("editor.signature.failed"));
    }
  };

  return (
    <div className="space-y-4">
      {/* Name Input */}
      <div>
        <input
          type="text"
          placeholder={t("editor.signature.typePlaceholder")}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-lg focus:border-blue-500 focus:outline-none transition"
          onKeyPress={(e) => e.key === "Enter" && handleGenerate()}
          autoFocus
        />
      </div>

      {/* Font Styles */}
      <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1">
        {fonts.map((font, index) => (
          <button
            key={index}
            onClick={() => setSelectedFont(index)}
            className={`p-3 border-2 rounded-lg transition-all text-center ${
              selectedFont === index
                ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
            }`}
          >
            <div
              className="text-2xl truncate mb-1"
              style={{
                fontFamily: font.value,
                fontWeight: font.weight,
                color: selectedFont === index ? "#1E40AF" : "#000000"
              }}
            >
              {name || t("editor.signature.preview")}
            </div>
            <div className="text-xs text-gray-500">{font.style}</div>
          </button>
        ))}
      </div>

      {/* Preview Section */}
      {name && (
        <div className="bg-white border-2 border-gray-200 rounded-lg p-6 text-center">
          <p className="text-xs text-gray-500 mb-3 uppercase tracking-wide">{t("editor.signature.preview")}</p>
          <div className="bg-gray-50 rounded-lg p-8 border border-gray-100 relative overflow-hidden">
            {/* Bottom indicator line */}
            <div className="absolute bottom-8 left-0 right-0 h-0.5 bg-blue-400" />
            <div
              className="text-5xl"
              style={{
                fontFamily: fonts[selectedFont].value,
                fontWeight: fonts[selectedFont].weight,
                color: "#000000",
              }}
            >
              {name}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Action Buttons */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={() => {
            if (typeof closeModal === 'function') {
              closeModal();
            }
          }}
          className="flex-1 px-4 py-2.5 bg-white text-gray-700 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition font-semibold"
        >
          {t("editor.signature.cancel")}
        </button>
        <button
          onClick={handleGenerate}
          disabled={!name.trim()}
          className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {t("editor.signature.create")}
        </button>
      </div>

    </div>
  );
}