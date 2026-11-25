"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ToolsPage from "@/app/(tools)/tools/page";
import GuidesPage from "@/app/(tools)/guides/page";
import ServicesPage from "@/app/(main)/services/page";
import { Wrench, BookOpen, Briefcase } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/app/context/AuthContext";
import { useCandidate } from "@/app/context/CandidateContext";
import { CatalogShell } from "@/components/resources/catalog";

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

  const tabSwitcher = (
    <div
      role="tablist"
      aria-label="Resource type"
      className="inline-flex gap-1 rounded-full border border-[#DDD9CE] bg-white p-1.5 shadow-[0_14px_40px_-16px_rgba(22,48,44,0.32)]"
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;
        const hasDot =
          (tab.id === "services" && hasActiveRequests) || (tab.id === "guides" && hasStartedGuides);

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => handleTabChange(tab.id)}
            className={`relative flex cursor-pointer items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition-colors duration-300 sm:px-6 ${
              isActive ? "text-white" : "text-[#16302C]/60 hover:text-[#16302C]"
            }`}
          >
            {isActive && (
              <motion.span
                layoutId="active-resource-tab"
                className="absolute inset-0 rounded-full bg-[#0A4F49] shadow-sm"
                transition={{ type: "spring", stiffness: 500, damping: 34 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              <Icon size={16} strokeWidth={isActive ? 2.2 : 1.8} />
              {tab.label}
            </span>
            {hasDot && (
              <span
                aria-label="Has activity"
                className="absolute top-1.5 right-2 z-10 h-2.5 w-2.5 rounded-full border-2 border-white bg-[#C4534B]"
              />
            )}
          </button>
        );
      })}
    </div>
  );

  return (
    <CatalogShell
      title="My Resources"
      tagline={
        <>
          <span className="hidden md:inline">
            Everything you have added, plus the full catalog to browse and try anytime.
          </span>
          <span className="md:hidden">Your unlocked tools, guides and services.</span>
        </>
      }
      toolbar={tabSwitcher}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.22, ease: "easeInOut" }}
          className="min-h-[50vh] w-full"
        >
          {activeTab === "toolbox" && <ToolsPage isEmbedded />}
          {activeTab === "guides" && <GuidesPage isEmbedded />}
          {activeTab === "services" && <ServicesPage isEmbedded />}
        </motion.div>
      </AnimatePresence>
    </CatalogShell>
  );
}
