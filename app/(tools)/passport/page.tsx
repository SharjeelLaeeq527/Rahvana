"use client";

import PassportPhotoTool from "@/components/tools/PassportPhotoTool";
export default function PassportPhoto() {
  return (
    <div
      className="text-gray-800 site-main-px site-main-py min-h-screen relative mt-[55px]"
      style={{
        backgroundImage: "url('/assets/images/Photobooth.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed",
      }}
    >
      <div
        className="absolute inset-0 bg-white/60 pointer-events-none"
        style={{ backgroundColor: "rgba(255,255,255,0.6)" }}
      />
      <div className="relative z-10">
        <PassportPhotoTool mode="standalone" />
      </div>
    </div>
  );
}
