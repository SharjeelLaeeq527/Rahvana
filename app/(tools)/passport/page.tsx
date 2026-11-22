"use client";

import PassportPhotoTool from "@/components/tools/PassportPhotoTool";
import { ToolPageFrame } from "@/components/tools/layout";

export default function PassportPhoto() {
  return (
    <ToolPageFrame>
      <PassportPhotoTool mode="standalone" />
    </ToolPageFrame>
  );
}
