"use client";

import VisaExplorationTool from "./components/VisaExplorationTool";
import { useEffect } from "react";

export default function VisaExplorationPage() {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <main className="bg-slate-50 flex flex-col items-center justify-center site-main-px site-main-py">
      <div className="w-full flex-1 flex flex-col items-center justify-center animate-in fade-in slide-in-from-bottom-4 duration-700">
        <VisaExplorationTool />
      </div>
    </main>
  );
}
