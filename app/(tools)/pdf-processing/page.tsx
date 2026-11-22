"use client";

import React from "react";
import PdfToolkitTool from "@/components/tools/PdfToolkitTool";
import { ToolPageFrame } from "@/components/tools/layout";

export default function PDFProcessingPage() {
  return (
    <ToolPageFrame>
      <PdfToolkitTool mode="standalone" showHeader={true} />
    </ToolPageFrame>
  );
}
