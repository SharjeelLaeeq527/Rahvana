"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  ArrowRight,
  FileText,
  Compass,
  Briefcase,
  BookOpen,
  Brain,
  MessageSquare,
  FileUp,
  HelpCircle,
  Users,
} from "lucide-react";

import StatCard from "@/app/components/shared/StatCard";
import { Loader } from "@/components/ui/spinner";
import { useAuth } from "@/app/context/AuthContext";

type Analytics = {
  journeys: { total: number };
  guides: { total: number };
  document_translations: { total: number };
  case_strength: { total: number };
};

const UserDashboard = () => {
  const router = useRouter();

  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  const { profile } = useAuth();

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await fetch("/api/user-dashboard/analytics");

        if (!res.ok) throw new Error("Failed to fetch analytics");

        const data = await res.json();
        setAnalytics(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <Loader size="lg" />
        <p className="text-[#0d7377] text-sm font-medium mt-2">
          Preparing your dashboard...
        </p>
      </div>
    );
  }

  const services = [
    {
      title: "My Journeys",
      icon: (
        <Briefcase className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
      ),
      status: "live" as const,
      count: analytics?.journeys.total || 0,
      countLabel: "journeys created",
      description:
        "Track your immigration journeys, progress through steps, and manage your case preparation.",
      href: "/my-journeys",
    },
    {
      title: "My Guides",
      icon: <BookOpen className="h-5 w-5 text-amber-600 dark:text-amber-400" />,
      status: "live" as const,
      count: analytics?.guides.total || 0,
      countLabel: "guides saved",
      description:
        "Access personalized immigration guides and track your progress through each stage.",
      href: "/guides/my-guides",
    },
    {
      title: "Document Translations",
      icon: <FileUp className="h-5 w-5 text-amber-600 dark:text-amber-400" />,
      status: "live" as const,
      count: analytics?.document_translations.total || 0,
      countLabel: "translations requested",
      description:
        "Request certified Urdu → English translations formatted for official immigration submission.",
      href: "/document-translation/my-requests",
    },
    {
      title: "Case Strength Analyzer",
      icon: <Brain className="h-5 w-5 text-violet-600 dark:text-violet-400" />,
      status: "live" as const,
      count: analytics?.case_strength.total || 0,
      countLabel: "cases analyzed",
      description:
        "Get an instant AI case strength score and identify gaps before NVC or visa interview.",
      href: "/visa-case-strength-checker/my-cases",
    },
    {
      title: "Book a Consultation",
      icon: (
        <MessageSquare className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
      ),
      status: "coming-soon" as const,
      description:
        "Book a consultation call with an immigration expert to review your case and documents.",
      href: "#",
    },
    {
      title: "Expert Case Review",
      icon: <Users className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />,
      status: "coming-soon" as const,
      description:
        "Human review of your documents + a tailored improvement plan.",
      href: "#",
    },
  ];

  const quickActions = [
    {
      title: "Explore Visa Categories",
      subtitle: "Understand different visa paths and eligibility",
      icon: <Briefcase size={18} />,
      href: "/visa-category/ir-category",
    },
    {
      title: "Explore all Tools",
      subtitle: "Access tools to prepare your immigration case",
      icon: <Compass size={18} />,
      href: "/tools",
    },
    {
      title: "Explore all services",
      subtitle:
        "View our services for preparing yourself for immigration process",
      icon: <FileText size={18} />,
      href: "/services",
    },
  ];

  return (
    <div className="bg-[#f8fafa]">
      <div className="w-full site-main-px site-main-py">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-center mb-2">
            <h2 className="text-[28px] font-bold text-[#0a1128] mb-2">
              Dashboard
            </h2>
          </div>

          <h1 className="text-[28px] font-bold text-[#0a1128] mb-2">
            Welcome back, {profile?.full_name || "Valued User"}!
          </h1>

          <p className="text-[15px] text-[#67737e]">
            Track your immigration progress, manage requests, and access tools
            that help you prepare every step of your journey.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* MAIN CONTENT */}
          <div className="flex-1">
            <div className="mb-8">
              <h2 className="text-[17px] font-semibold text-[#0a1128] mb-4">
                Your Services
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {services.map((service, index) => (
                  <StatCard
                    key={index}
                    title={service.title}
                    icon={service.icon}
                    status={service.status}
                    count={service.count}
                    countLabel={service.countLabel}
                    description={service.description}
                    onClick={() => service.href && router.push(service.href)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* SIDEBAR */}
          <div className="w-full lg:w-70 shrink-0 space-y-6">
            {/* Quick Actions */}
            <div>
              <h3 className="text-[15px] font-semibold text-[#0a1128] mb-3">
                Quick Actions
              </h3>

              <div className="space-y-2.5">
                {quickActions.map((action, i) => (
                  <button
                    key={i}
                    onClick={() => router.push(action.href)}
                    className="w-full flex items-center gap-3 rounded-xl border border-[#e0f0f0] bg-white px-4 py-3.5 text-left hover:border-[#0d7377]/30 hover:shadow-sm transition-all duration-200 group"
                  >
                    <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-[#e8f6f6] text-[#0d7377] group-hover:bg-[#0d7377] group-hover:text-white transition-colors">
                      {action.icon}
                    </div>

                    <div className="flex-1 min-w-0">
                      <span className="block text-[13px] font-semibold text-[#0a1128]">
                        {action.title}
                      </span>
                      <span className="block text-[11px] text-[#9ca3af]">
                        {action.subtitle}
                      </span>
                    </div>

                    <ArrowRight
                      size={14}
                      className="text-[#d1d5db] group-hover:text-[#0d7377]"
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Help Card */}
            <div className="rounded-2xl border border-[#e6f1f1] bg-white p-5">
              <div className="flex items-center gap-2 mb-2">
                <HelpCircle className="text-[#0d7377]" size={18} />
                <span className="text-[13px] font-semibold text-[#0a1128]">
                  Understand Rahvana?
                </span>
              </div>

              <p className="text-[12px] text-[#67737e] mb-4 leading-relaxed">
                Explore how Rahvana helps you to understand any step of your
                immigration process.
              </p>

              <button
                onClick={() => router.push("/#about")}
                className="w-full py-2.5 rounded-lg bg-[#0d7377] text-white text-[13px] font-semibold hover:bg-[#0b5f62] transition-colors"
              >
                How Rahvana Works
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
