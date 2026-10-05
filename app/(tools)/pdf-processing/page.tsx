"use client";

import React from "react";
import PdfToolkitTool from "@/components/tools/PdfToolkitTool";

export default function PDFProcessingPage() {
  return (
    <main className="bg-gray-50 flex flex-col items-center justify-center site-main-py site-main-px mt-[55px] dark:bg-slate-950">
      <PdfToolkitTool mode="standalone" showHeader={true} />
    </main>
  );
}
