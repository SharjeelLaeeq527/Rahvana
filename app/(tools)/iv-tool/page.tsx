"use client";

import React from "react";
import DqStatusCheckTool from "@/components/tools/DqStatusCheckTool";

export default function IvToolPage() {
  return (
    <div className="guide-grid-bg mt-10 min-h-screen bg-[#f5f7fb] px-5 py-12 text-[#18212f] sm:px-8 lg:px-12 lg:py-14 dark:bg-slate-950 dark:text-slate-100">
      <DqStatusCheckTool mode="standalone" showHeader={true} />
    </div>
  );
}
