"use client";

import React from "react";
import PdfToolkitTool from "@/components/tools/PdfToolkitTool";

export default function PDFProcessingPage() {
  return (
    <div className="mt-[55px]">
      <PdfToolkitTool mode="standalone" showHeader={true} />
    </div>
  );
}
