"use client";

import VisaExplorationTool from "./components/VisaExplorationTool";
import { useEffect } from "react";

export default function VisaExplorationPage() {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 sm:p-8 pt-20 sm:pt-24 lg:pt-32">
      <div className="w-full max-w-5xl flex-1 flex flex-col items-center justify-center animate-in fade-in slide-in-from-bottom-4 duration-700">
        <VisaExplorationTool />
      </div>
    </main>
  );
}
