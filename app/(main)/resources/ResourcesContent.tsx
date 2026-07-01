"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ToolsPage from "@/app/(tools)/tools/page";
import GuidesPage from "@/app/(tools)/guides/page";
import ServicesPage from "@/app/(main)/services/page";
import { Wrench, BookOpen, Briefcase } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/app/context/AuthContext";

export type ResourceTab = "toolbox" | "guides" | "services";

const tabs: { id: ResourceTab; icon: React.ElementType; label: string }[] = [
  { id: "toolbox", icon: Wrench, label: "Tools" },
  { id: "guides", icon: BookOpen, label: "Guides" },
  { id: "services", icon: Briefcase, label: "Services" },
];

export default function ResourcesContent({ initialTab }: { initialTab: ResourceTab }) {
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<ResourceTab>(initialTab);
  const [hasActiveRequests, setHasActiveRequests] = useState(false);
  const [hasStartedGuides, setHasStartedGuides] = useState(false);

  useEffect(() => {
    if (!user) {
      setHasActiveRequests(false);
      setHasStartedGuides(false);
      return;
    }

    const fetchStatus = async () => {
      try {
        const res = await fetch("/api/user-dashboard/services-status");
        if (res.ok) {
          const data = await res.json();
          const active =
            (data.pccRequests && data.pccRequests.length > 0) ||
            (data.medicalAppointments && data.medicalAppointments.length > 0) ||
            (data.consultationBookings && data.consultationBookings.length > 0) ||
            (data.translationDocuments && data.translationDocuments.length > 0);
          setHasActiveRequests(active);
        }
      } catch (e) {
        console.error(e);
      }
    };

    const fetchGuidesStatus = async () => {
      try {
        const res = await fetch("/api/guides/my-guides");
        if (res.ok) {
          const data = await res.json();
          setHasStartedGuides(data.sessions && data.sessions.length > 0);
        }
      } catch (e) {
        console.error(e);
      }
    };

    fetchStatus();
    fetchGuidesStatus();
  }, [user]);

  const handleTabChange = (tab: ResourceTab) => {
    setActiveTab(tab);
    router.replace(`/resources?tab=${tab}`, { scroll: false });
  };

  return (
    <div className="bg-background text-foreground font-sans overflow-x-hidden selection:bg-primary selection:text-primary-foreground min-h-screen">
      {/* Ambient Glow */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10">
        <div className="absolute top-[10%] left-[15%] w-[30rem] h-[30rem] bg-[#0d7377]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-[20%] right-[10%] w-[40rem] h-[40rem] bg-[#32e0c4]/5 rounded-full blur-3xl" />
      </div>

      {/* Page heading */}
      <div className="text-center pt-24 pb-2">
        <h1 className="text-3xl md:text-5xl font-bold bg-clip-text text-transparent bg-linear-to-r from-foreground to-muted-foreground animate-fade-up">
          My Resources
        </h1>
        <p className="mt-3 text-muted-foreground text-base md:text-lg max-w-2xl mx-auto animate-fade-up [animation-delay:100ms]">
          Everything you&apos;ve added — plus the full catalog to browse and try anytime.
        </p>
      </div>

      {/* Tab Selector Section */}
      <div className="flex justify-center pt-6 pb-8">
        <div className="flex gap-2 bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-full border border-slate-200 dark:border-slate-700/50 shadow-sm backdrop-blur-md relative">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;

            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`relative px-2.5 sm:px-6 py-2.5 flex items-center gap-2 rounded-full font-medium text-sm transition-colors duration-300 z-10 ${
                  isActive
                    ? "text-slate-900 dark:text-white"
                    : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-resource-tab"
                    className="absolute inset-0 bg-white dark:bg-slate-700 rounded-full shadow-sm border border-slate-200/50 dark:border-slate-600/50"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  <motion.div
                    animate={{
                      scale: isActive ? 1.1 : 1,
                      opacity: isActive ? 1 : 0.7,
                    }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  >
                    <Icon size={16} strokeWidth={isActive ? 2.2 : 1.8} />
                  </motion.div>
                  {tab.label}
                </span>

                {/* animate-pulse */}
                {tab.id === "services" && hasActiveRequests && (
                  <span className="absolute top-1.5 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border border-white" />
                )}
                {tab.id === "guides" && hasStartedGuides && (
                  <span className="absolute top-1.5 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border border-white" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Section */}
      <div className="w-full relative min-h-[50vh]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="w-full h-full"
          >
            {activeTab === "toolbox" && <ToolsPage isEmbedded />}
            {activeTab === "guides" && <GuidesPage isEmbedded />}
            {activeTab === "services" && <ServicesPage isEmbedded />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
