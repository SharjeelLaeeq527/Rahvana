"use client";

import React from "react";
import SnapAndSignTool from "@/components/tools/SnapAndSignTool";

export default function SignatureRemoverPage() {
  return (
    <div className="">
      <SnapAndSignTool mode="standalone" showHeader={true} />
    </div>
  );
}
