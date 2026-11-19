"use client";

import React from "react";
import CspaAgeCheckerTool from "@/components/tools/CspaAgeCheckerTool";

// Standalone, free, no sign-in needed: the checker runs in the browser and saves nothing.
// The journey uses the same component in journey mode (EmbeddedToolContainer, `cspa_checker`).
export default function CspaAgeCheckerPage() {
  return (
    <div className="mt-[55px]">
      <CspaAgeCheckerTool mode="standalone" showHeader={true} />
    </div>
  );
}
