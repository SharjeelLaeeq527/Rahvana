"use client";
import StandardHeader from "../../components/headers/Standard-Header"

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ToolsPage from "@/app/(tools)/tools/page";
import GuidesPage from "@/app/(tools)/guides/page";
import ServicesPage from "@/app/(main)/services/page";
import { Wrench, BookOpen, Briefcase } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/app/context/AuthContext";
import { useCandidate } from "@/app/context/CandidateContext";

export type ResourceTab = "toolbox" | "guides" | "services";

const tabs: { id: ResourceTab; icon: React.ElementType; label: string }[] = [
  { id: "toolbox", icon: Wrench, label: "Tools" },
  { id: "guides", icon: BookOpen, label: "Guides" },
  { id: "services", icon: Briefcase, label: "Services" },
];

export default function ResourcesContent({ initialTab }: { initialTab: ResourceTab }) {
  const router = useRouter();
  const { user } = useAuth();
  const { activeCandidateId } = useCandidate();
  const [activeTab, setActiveTab] = useState<ResourceTab>(initialTab);
  const [hasActiveRequests, setHasActiveRequests] = useState(false);
  const [hasStartedGuides, setHasStartedGuides] = useState(false);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

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
        const currentCandidateId = activeCandidateId || "candidate-1";
        const res = await fetch(`/api/guides/my-guides?candidateId=${currentCandidateId}`);
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
  }, [user, activeCandidateId]);

  const handleTabChange = (tab: ResourceTab) => {
    setActiveTab(tab);
    router.replace(`/resources?tab=${tab}`, { scroll: false });
  };

  return (
    <div className="bg-background text-foreground selection:bg-primary selection:text-primary-foreground min-h-screen overflow-x-hidden font-sans">
      {/* Ambient Glow */}
      <div className="pointer-events-none fixed top-0 left-0 -z-10 h-full w-full">
        <div className="absolute top-[10%] left-[15%] h-[30rem] w-[30rem] rounded-full bg-[#0d7377]/5 blur-3xl" />
        <div className="absolute right-[10%] bottom-[20%] h-[40rem] w-[40rem] rounded-full bg-[#32e0c4]/5 blur-3xl" />
      </div>

      {/* Page heading */}
      <div className="text-center pt-24 pb-2">
        <StandardHeader 
          title= "My Resources"
          subtitle= "Everything you've added, plus the full catalog to browse and try anytime."
        />
        <p className="mt-3 text-muted-foreground text-base md:text-lg max-w-2xl mx-auto animate-fade-up [animation-delay:100ms] block md:hidden">
        Your unlocked tools, guides & services.
        </p>
      </div>

      {/* Tab Selector Section */}
      <div className="flex justify-center pt-6 pb-8">
        <div className="relative flex gap-2 rounded-full border border-slate-200 bg-slate-100 p-1.5 shadow-sm backdrop-blur-md dark:border-slate-700/50 dark:bg-slate-800/50">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;

            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`relative z-10 flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition-colors duration-300 sm:px-6 ${
                  isActive
                    ? "text-slate-900 dark:text-white"
                    : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-resource-tab"
                    className="absolute inset-0 rounded-full border border-slate-200/50 bg-white shadow-sm dark:border-slate-600/50 dark:bg-slate-700"
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
                  <span className="absolute top-1.5 right-2 h-2.5 w-2.5 rounded-full border border-white bg-red-500" />
                )}
                {tab.id === "guides" && hasStartedGuides && (
                  <span className="absolute top-1.5 right-2 h-2.5 w-2.5 rounded-full border border-white bg-red-500" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Section */}
      <div className="relative min-h-[50vh] w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="h-full w-full"
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
