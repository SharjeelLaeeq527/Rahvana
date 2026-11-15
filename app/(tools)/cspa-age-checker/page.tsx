"use client";

import React from "react";
import CspaAgeCheckerTool from "@/components/tools/CspaAgeCheckerTool";

// Standalone, free, no sign-in needed: the checker runs in the browser and saves nothing.
// The journey uses the same component in journey mode (EmbeddedToolContainer, `cspa_checker`).
export default function CspaAgeCheckerPage() {
  return (
    <div className="mt-10 min-h-screen bg-[#f7f8fa] px-5 pt-12 pb-20 text-slate-900 sm:px-8 lg:px-12 lg:pt-14 lg:pb-24 dark:bg-slate-950 dark:text-slate-100">
      <CspaAgeCheckerTool mode="standalone" showHeader={true} />
    </div>
  );
}
