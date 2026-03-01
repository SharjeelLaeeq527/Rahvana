"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useWizard } from "../dashboard/hooks/useWizard";
import { roadmapData } from "../../../data/roadmap";
import { useRouter } from "next/navigation";
import {
  Camera,
  Calculator,
  MessageSquare,
  Sparkles,
  Flag,
  PlusCircle,
  ClipboardList,
  Wrench,
  Star,
} from "lucide-react";
import Link from "next/link";

interface PoliceRequest {
  id: string;
  request_id: string;
  created_at: string;
  status: "pending" | "in_progress" | "completed" | "rejected";
  full_name: string;
  province: string;
  district: string;
  purpose: string;
  delivery_type: string;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { state, isLoaded } = useWizard();
  const router = useRouter();

  const [policeRequests, setPoliceRequests] = useState<PoliceRequest[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loadingRequests, setLoadingRequests] = useState(false);

  useEffect(() => {
    if (user) {
      setLoadingRequests(true);
      fetch("/api/police-verification/requests")
        .then((res) => res.json())
        .then((data) => {
          if (data.data) setPoliceRequests(data.data);
        })
        .catch((err) => console.error(err))
        .finally(() => setLoadingRequests(false));
    }
  }, [user]);

  const isSignedIn = !!user;

  const handleContinue = () => {
    router.push("/?section=ir1-journey");
  };

  const handleNavigate = (section: string) => {
    router.push(`/?section=${section}`);
  };

  const handleToggleAuth = () => {
    // In a real app, this might redirect to login/signup
    router.push("/login");
  };

  const getTotalSteps = () => {
    return roadmapData.stages.reduce(
      (acc, stage) => acc + stage.steps.length,
      0,
    );
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  const totalSteps = getTotalSteps();
  const completed = state.completedSteps.size;
  const progress =
    totalSteps === 0 ? 0 : Math.round((completed / totalSteps) * 100);

  return (
    <section id="dashboard" className="block">
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-8 md:py-[60px]">
        <h1 className="text-3xl md:text-[40px] font-bold mb-2 md:mb-4">
          Your Dashboard
        </h1>
        <p className="text-muted-foreground text-base md:text-lg mb-8 md:mb-12">
          Track your active journeys and access recommended tools.
        </p>

        {!isSignedIn && (
          <div id="guest-dashboard-msg">
            <div className="bg-[#f59e0b]/5 border-2 border-[#f59e0b]/20 p-6 md:p-8 rounded-xl text-center">
              <h4 className="text-lg md:text-xl font-bold mb-2 flex items-center justify-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" /> Sign in to
                access your dashboard
              </h4>
              <p className="text-muted-foreground text-sm md:text-base mb-6">
                Track journeys, save progress across devices, and get
                personalized recommendations.
              </p>
              <button
                className="px-6 py-3 rounded-lg bg-[#0d9488] text-white font-bold hover:bg-[#0f766e] transition-colors shadow-sm w-full sm:w-auto"
                onClick={handleToggleAuth}
              >
                Sign In Free
              </button>
            </div>
          </div>
        )}

        {isSignedIn && (
          <div id="signed-in-dashboard">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
              <div className="lg:col-span-2">
                {/* Police Verification Requests Section */}
                {policeRequests.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-xl font-bold mb-5">
                      Police Verification Requests
                    </h3>
                    <div className="space-y-4">
                      {policeRequests.map((req) => (
                        <div
                          key={req.id}
                          className="bg-card border border-border rounded-xl p-4 sm:p-6 shadow-sm"
                        >
                          <div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-4 mb-4">
                            <div>
                              <h4 className="font-bold text-lg mb-1 break-all sm:break-normal">
                                {req.request_id}
                              </h4>
                              <p className="text-muted-foreground text-xs sm:text-sm">
                                Submitted on{" "}
                                {new Date(req.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <span
                              className={`self-start px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
                                req.status === "completed"
                                  ? "bg-green-100 text-green-700"
                                  : req.status === "rejected"
                                    ? "bg-red-100 text-red-700"
                                    : req.status === "in_progress"
                                      ? "bg-blue-100 text-blue-700"
                                      : "bg-yellow-100 text-yellow-700"
                              }`}
                            >
                              {req.status?.toUpperCase().replace("_", " ")}
                            </span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm mt-2">
                            <div>
                              <p className="text-muted-foreground">Applicant</p>
                              <p className="font-medium">{req.full_name}</p>
                            </div>
                            <div>
                              <p className="text-slate-500">
                                Province/District
                              </p>
                              <p className="font-medium">
                                {req.province}, {req.district}
                              </p>
                            </div>
                            <div>
                              <p className="text-slate-500">Purpose</p>
                              <p className="font-medium">{req.purpose}</p>
                            </div>
                            <div>
                              <p className="text-slate-500">Delivery</p>
                              <p className="font-medium">{req.delivery_type}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <h3 className="text-xl font-bold mb-5">Your Active Journeys</h3>
                <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                  <h4 className="text-lg font-bold mb-2 flex items-center gap-2">
                    <Flag className="w-5 h-5 text-[#0d9488]" /> IR-1/CR-1 Spouse
                    Visa
                  </h4>
                  <p className="text-muted-foreground text-sm mb-3">
                    Started Dec 21, 2025
                  </p>
                  <div className="h-3 bg-muted rounded-full overflow-hidden mb-3">
                    <div
                      className="h-full bg-linear-to-r from-[#0d9488] to-[#10b981] transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-[13px] mb-6">
                    <span className="font-semibold text-foreground">
                      {completed} of {totalSteps} steps
                    </span>
                    <span className="text-muted-foreground">
                      {progress}% Complete
                    </span>
                  </div>
                  <button
                    className="w-full sm:w-auto px-8 py-3 rounded-lg bg-[#0d9488] text-white font-bold hover:bg-[#0f766e] transition-colors shadow-lg"
                    onClick={handleContinue}
                  >
                    Continue Journey →
                  </button>
                </div>

                <div className="mt-6 bg-card border border-border rounded-xl p-4 sm:p-6 shadow-sm opacity-60">
                  <h4 className="font-bold mb-2 flex items-center gap-2">
                    <PlusCircle className="w-5 h-5" /> Start Another Journey
                  </h4>
                  <p className="text-muted-foreground text-sm mb-3">
                    IR-5 Parents, K-1 Fiancé, and more coming soon.
                  </p>
                  <button
                    className="w-full sm:w-auto px-4 py-2 rounded-lg bg-muted text-muted-foreground font-bold border border-border cursor-not-allowed"
                    disabled
                  >
                    Coming Soon
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold mb-5">
                  Tools You May Need Next
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                  <ToolCard
                    title="Photo Booth"
                    description="Make a compliant passport/visa photo in minutes."
                    icon={
                      <Camera className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                    }
                    badge="free"
                    onClick={() => router.push("/passport")}
                  />
                  <ToolCard
                    title="Sponsorship Calculator"
                    description="Auto-check income/assets and tell you what you still need."
                    icon={
                      <Calculator className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    }
                    badge="free"
                    onClick={() => router.push("/affidavit-support-calculator")}
                  />
                  <ToolCard
                    title="Interview Prep"
                    description="Prepare smarter and deliver confident answers when it matters most."
                    icon={
                      <MessageSquare className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                    }
                    badge="premium"
                    onClick={() => router.push("/interview-prep")}
                  />
                </div>
              </div>
            </div>

            <div className="mt-8 md:mt-12">
              <h3 className="text-xl font-bold mb-5">Quick Actions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                <button
                  className="bg-card w-full h-full border border-border rounded-xl p-4 sm:p-6 shadow-sm text-center hover:shadow-md transition-all group flex flex-col items-center justify-center"
                  onClick={() => handleNavigate("ir1-journey")}
                >
                  <h4 className="text-lg font-bold mb-1 group-hover:text-[#0d9488] transition-colors flex items-center justify-center gap-2">
                    <ClipboardList className="w-5 h-5" /> Open IR-1 Wizard
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Continue your journey
                  </p>
                </button>
                <Link href="/tools" className="block w-full h-full">
                  {" "}
                  <button
                    className="bg-card w-full h-full border border-border rounded-xl p-4 sm:p-6 shadow-sm text-center hover:shadow-md transition-all group flex flex-col items-center justify-center"
                    // onClick={() => handleNavigate("tools")}
                  >
                    <h4 className="text-lg font-bold mb-1 group-hover:text-[#0d9488] transition-colors flex items-center justify-center gap-2">
                      <Wrench className="w-5 h-5" /> Browse Tools
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Document prep & planning
                    </p>
                  </button>
                </Link>

                <Link href="/pricing" className="block w-full h-full">
                  {" "}
                  <button
                    className="bg-card w-full h-full border border-border rounded-xl p-4 sm:p-6 shadow-sm text-center hover:shadow-md transition-all group flex flex-col items-center justify-center"
                    // onClick={() => handleNavigate("/pricing")}
                  >
                    <h4 className="text-lg font-bold mb-1 group-hover:text-[#0d9488] transition-colors flex items-center justify-center gap-2">
                      <Star className="w-5 h-5 fill-current" /> View Premium
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Unlock all features
                    </p>
                  </button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function ToolCard({
  title,
  description,
  icon,
  badge,
  onClick,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  badge: "free" | "premium";
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="bg-card border border-border rounded-xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col items-start text-left group"
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="flex items-center justify-center text-muted-foreground group-hover:text-[#0d9488] transition-all group-hover:scale-110 duration-200">
          {icon}
        </span>
        <h4 className="font-bold text-foreground text-[15px] transition-colors group-hover:text-[#0d9488]">
          {title}
        </h4>
      </div>
      <p className="text-muted-foreground text-[13px] mb-4 leading-normal">
        {description}
      </p>
      <div className="mt-auto">
        {badge === "free" ? (
          <span className="px-3 py-1 rounded-full bg-[#ecfdf5] text-[#059669] text-[11px] font-bold">
            Free
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[--premium-bg] text-[--premium-text] text-[11px] font-bold">
            <Star className="w-3 h-3 fill-current" /> Premium
          </span>
        )}
      </div>
    </div>
  );
}
