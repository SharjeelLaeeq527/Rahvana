"use client";

import React, { useState } from "react";
import ToolsPage from "@/app/(tools)/tools/page";
import GuidesPage from "@/app/(tools)/guides/page";
import ServicesPage from "@/app/(main)/services/page";
import { Wrench, BookOpen, Briefcase } from "lucide-react";

type ResourceTab = "toolbox" | "guides" | "services";

export default function ResourcesPage() {
  const [activeTab, setActiveTab] = useState<ResourceTab>("toolbox");

  const tabs: { id: ResourceTab; icon: React.ReactNode; label: string }[] = [
    { id: "toolbox", icon: <Wrench className="h-4 w-4" />, label: "Toolbox" },
    { id: "guides", icon: <BookOpen className="h-4 w-4" />, label: "Guides" },
    {
      id: "services",
      icon: <Briefcase className="h-4 w-4" />,
      label: "Services",
    },
  ];

  return (
    <div className="bg-background text-foreground font-sans overflow-x-hidden selection:bg-primary selection:text-primary-foreground">
      {/* Ambient Glow */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10">
        <div className="absolute top-[10%] left-[15%] w-125 h-125 bg-[#0d7377]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-[20%] right-[10%] w-150 h-150 bg-[#32e0c4]/5 rounded-full blur-3xl" />
      </div>

      {/* Tab Selector Section */}
      <div className="flex justify-center pt-24">
        <div className="flex gap-4 bg-gray-200 border border-border rounded-full p-2 shadow-lg">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-8 py-3 flex gap-2 rounded-full font-semibold text-sm transition-all duration-300 ${
                activeTab === tab.id
                  ? "bg-white text-black shadow-md dark:bg-slate-900 dark:text-white"
                  : "bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content Section */}
      <div className="w-full">
        {activeTab === "toolbox" && <ToolsPage isEmbedded />}{" "}
        {activeTab === "guides" && <GuidesPage isEmbedded />}
        {activeTab === "services" && <ServicesPage isEmbedded />}
      </div>
    </div>
  );
}
