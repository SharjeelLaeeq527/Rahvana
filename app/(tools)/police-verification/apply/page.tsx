"use client";
import { Suspense } from "react";
import { Loader } from "@/components/ui/spinner";
import PccFilingTool from "@/components/tools/PccFilingTool";
export default function PoliceApplyPage() {
  return (
    <Suspense fallback={<Loader fullScreen size="lg" text="Loading..." />}>
      <PccFilingTool />
    </Suspense>
  );
}
