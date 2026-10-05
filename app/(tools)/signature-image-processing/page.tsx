"use client";

import React from "react";
import SnapAndSignTool from "@/components/tools/SnapAndSignTool";

export default function SignatureRemoverPage() {
  return (
    <div
      className="min-h-screen"
      style={{
        background:
          "radial-gradient(1200px 600px at 50% -10%, #dff1f7 0%, #eef7fb 40%, #f7fbfd 70%, #ffffff 100%)",
      }}
    >
      <main className="site-main-px site-main-py mt-[55px]">
        <SnapAndSignTool mode="standalone" showHeader={true} showTips={true} />
      </main>
    </div>
  );
}
