"use client";

import DocumentTranslationTool from "@/components/tools/DocumentTranslationTool";

export default function DocumentTranslationUpload() {
  return (
    <div className="bg-linear-to-br from-slate-50 to-slate-100 text-gray-800 site-main-px site-main-py mt-[55px]">
      <DocumentTranslationTool mode="standalone" />
    </div>
  );
}
