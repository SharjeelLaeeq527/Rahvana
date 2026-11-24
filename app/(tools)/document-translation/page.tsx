"use client";

import DocumentTranslationTool from "@/components/tools/DocumentTranslationTool";

export default function DocumentTranslationUpload() {
  return (
    <div className="mt-[55px] bg-white text-gray-800">
      <DocumentTranslationTool mode="standalone" />
    </div>
  );
}
