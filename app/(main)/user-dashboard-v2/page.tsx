"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  MessageSquare,
  FileUp,
  Users,
  Shield,
  Calendar,
  X,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
  ArrowUpRight,
  ClipboardList,
} from "lucide-react";

import StatCard from "@/app/components/shared/StatCard";
import { Loader } from "@/components/ui/spinner";
import { useAuth } from "@/app/context/AuthContext";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ir1journeyHref } from "@/lib/constants/routes";

type Analytics = {
  journeys: { total: number };
  guides: { total: number };
  document_translations: { total: number };
  case_strength: { total: number };
  interview_prep: { total: number };
};

type ChecklistItem = {
  id: string;
  label: string;
  category: string;
  checked: boolean;
  link: string;
};

const UserDashboardV2 = () => {
  const router = useRouter();
  const { profile } = useAuth();

  // Page level states
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  // PCC & Medical appointment states
  const [pccRequests, setPccRequests] = useState<any[]>([]);
  const [medicalAppointments, setMedicalAppointments] = useState<any[]>([]);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedModalType, setSelectedModalType] = useState<"pcc" | "medical" | null>(null);

  // Interactive Checklist state
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);

  // Initial default checklist
  const defaultChecklist: ChecklistItem[] = [
    {
      id: "passport",
      label: "Valid Pakistani Passport",
      category: "Documents",
      checked: false,
      link: "/guides/passport-guide",
    },
    {
      id: "cnic",
      label: "NADRA CNIC / NICOP",
      category: "Documents",
      checked: false,
      link: "/guides/cnic-guide",
    },
    {
      id: "frc",
      label: "NADRA FRC (Family Tree)",
      category: "Documents",
      checked: false,
      link: "/guides/frc-guide",
    },
    {
      id: "mrc",
      label: "NADRA Marriage Certificate",
      category: "Documents",
      checked: false,
      link: "/guides/nikah-nama-guide",
    },
    {
      id: "pcc",
      label: "Sindh PCC Status",
      category: "Filing Services",
      checked: false,
      link: "/police-verification/apply?province=Sindh",
    },
    {
      id: "polio",
      label: "Polio Vaccination Card",
      category: "Medical & Vaccines",
      checked: false,
      link: "/guides/polio-vaccination-guide",
    },
    {
      id: "medical",
      label: "Immigration Medical Exam booked",
      category: "Medical & Vaccines",
      checked: false,
      link: "/book-appointment",
    },
  ];

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

    const fetchServicesStatus = async () => {
      try {
        const res = await fetch("/api/user-dashboard/services-status");
        if (!res.ok) throw new Error("Failed to fetch services status");
        const data = await res.json();
        setPccRequests(data.pccRequests || []);
        setMedicalAppointments(data.medicalAppointments || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingStatus(false);
      }
    };

    // Load or initialize checklist
    try {
      const savedChecklist = localStorage.getItem("rahvana_dashboard_checklist");
      if (savedChecklist) {
        setChecklist(JSON.parse(savedChecklist));
      } else {
        setChecklist(defaultChecklist);
        localStorage.setItem("rahvana_dashboard_checklist", JSON.stringify(defaultChecklist));
      }
    } catch (e) {
      setChecklist(defaultChecklist);
    }

    fetchAnalytics();
    fetchServicesStatus();
  }, []);

  // Handle checklist checkbox toggles
  const handleChecklistChange = (id: string) => {
    const updated = checklist.map((item) =>
      item.id === id ? { ...item, checked: !item.checked } : item
    );
    setChecklist(updated);
    try {
      localStorage.setItem("rahvana_dashboard_checklist", JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const services = [
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
      title: "Interview Prep",
      icon: <MessageSquare className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />,
      status: "live" as const,
      count: analytics?.interview_prep.total || 0,
      countLabel: "sessions completed",
      description: "Prepare smarter and deliver confident answers when it matters most.",
      href: "/interview-prep/my-sessions",
    },
    {
      title: "Expert Consultation",
      icon: <Users className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />,
      status: "live" as const,
      description: "Book a consultation with an immigration expert.",
      href: "/book-consultation?tab=requests",
    },
  ];

  const activePcc = pccRequests[0];
  const activeMedical = medicalAppointments[0];

  const checkedCount = checklist.filter((item) => item.checked).length;
  const progressPercent =
    checklist.length > 0 ? Math.round((checkedCount / checklist.length) * 100) : 0;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4 bg-[#f8fafa]">
        <Loader size="lg" />
        <p className="text-[#0d7377] text-sm font-medium mt-2">Preparing your workspace...</p>
      </div>
    );
  }

  return (
    <div className="bg-[#f8fafa] min-h-screen text-slate-900 pb-8">
      <div className="w-full site-main-px site-main-py mt-14 max-w-7xl mx-auto space-y-8">
        {/* TOP WELCOME BANNER (Premium Gradient) */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0d7377] via-[#0f8a8f] to-[#14a0a6] p-8 md:p-10 text-white shadow-xl shadow-teal-950/5">
          <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-white/5 -translate-y-20 translate-x-20 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-96 h-96 rounded-full bg-[#32e0c4]/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-3 max-w-2xl">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-semibold backdrop-blur-md uppercase tracking-wider">
                <Sparkles className="h-3.5 w-3.5 text-[#32e0c4] animate-pulse" />
                Immigration Workspace
              </span>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                Welcome back, {profile?.full_name || "Valued User"}!
              </h1>
              <p className="text-white/80 text-[15px] leading-relaxed">
                Reuniting with your family is a journey. Keep track of documents, filing services,
                medical bookings, and manage all your tasks in one unified workspace.
              </p>

              {/* Quick statistics row in banner */}
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2 text-sm text-white/90">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-[#32e0c4]" />
                  <span>
                    {checkedCount} of {checklist.length} milestones met
                  </span>
                </div>
                <div className="h-1.5 w-1.5 rounded-full bg-white/40 hidden sm:block" />
                <div className="flex items-center gap-1.5">
                  <BookOpen className="h-4 w-4 text-[#32e0c4]" />
                  <span>{analytics?.guides.total || 0} guides saved</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => router.push({ ir1journeyHref })}
              className="shrink-0 inline-flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-teal-50 text-[#0d7377] font-semibold rounded-xl transition duration-200 shadow-md group cursor-pointer"
            >
              Go to IR-1 Roadmap
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>

        {/* MAIN COLUMN GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT COLUMN: Trackers & Services Grid (Span 2) */}
          <div className="lg:col-span-2 space-y-8">
            {/* ACTIVE FILINGS / REQUESTS TIMELINE */}
            <div className="bg-white border border-[#eef3f3] rounded-3xl p-6 shadow-sm space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                <div className="space-y-1">
                  <h2 className="text-xl font-bold text-gray-900">Active Service Statuses</h2>
                  <p className="text-xs text-gray-500">
                    Real-time status updates of your submitted filings
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedModalType("pcc");
                      setIsModalOpen(true);
                    }}
                    className="px-3.5 py-1.5 bg-teal-50 hover:bg-teal-100 text-[#0d7377] text-xs font-semibold rounded-lg transition cursor-pointer"
                  >
                    All PCCs ({pccRequests.length})
                  </button>
                  <button
                    onClick={() => {
                      setSelectedModalType("medical");
                      setIsModalOpen(true);
                    }}
                    className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-lg transition cursor-pointer"
                  >
                    All Medicals ({medicalAppointments.length})
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* PCC TRACKER BLOCK */}
                <div className="p-5 rounded-2xl border border-slate-100 bg-[#fbfdfd] flex flex-col justify-between min-h-[180px]">
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-teal-50 text-teal-600 rounded-lg">
                          <Shield className="h-5 w-5" />
                        </div>
                        <span className="text-sm font-semibold text-gray-700">
                          Sindh PCC Filing
                        </span>
                      </div>
                      {activePcc ? (
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            activePcc.status === "completed"
                              ? "bg-green-50 text-green-700 border border-green-200"
                              : activePcc.status === "in_progress"
                                ? "bg-blue-50 text-blue-700 border border-blue-200"
                                : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {activePcc.status?.replace("_", " ") || "Pending"}
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                          Not Filed
                        </span>
                      )}
                    </div>

                    {activePcc ? (
                      <div className="space-y-2">
                        <p className="text-xs font-mono text-slate-400">
                          ID: {activePcc.request_id}
                        </p>
                        <h4 className="font-bold text-slate-900 text-base">
                          {activePcc.full_name}
                        </h4>
                        <div className="flex flex-col gap-1 text-xs text-slate-500">
                          <span>District: {activePcc.district}</span>
                          <span>Filed: {new Date(activePcc.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="py-4 text-center">
                        <p className="text-sm text-slate-500">
                          Need Sindh Police Character Certificate?
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          Get certified done-for-you filing support.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-slate-100 mt-4 flex justify-between items-center">
                    {activePcc ? (
                      <>
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock className="h-3 w-3" /> Updated recently
                        </span>
                        <button
                          onClick={() => {
                            setSelectedModalType("pcc");
                            setIsModalOpen(true);
                          }}
                          className="text-xs font-bold text-teal-700 hover:text-teal-900 inline-flex items-center gap-0.5 cursor-pointer"
                        >
                          View details <ArrowRight className="h-3 w-3" />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => router.push("/police-verification/apply?province=Sindh")}
                        className="w-full inline-flex justify-center items-center gap-1.5 py-2 bg-[#0d7377] hover:bg-teal-700 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                      >
                        Apply for PCC Sindh <ArrowUpRight className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* MEDICAL APPOINTMENTS BLOCK */}
                <div className="p-5 rounded-2xl border border-slate-100 bg-[#fafcfb] flex flex-col justify-between min-h-[180px]">
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                          <Calendar className="h-5 w-5" />
                        </div>
                        <span className="text-sm font-semibold text-gray-700">
                          Medical Examination
                        </span>
                      </div>
                      {activeMedical ? (
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            activeMedical.status === "completed"
                              ? "bg-green-50 text-green-700 border border-green-200"
                              : activeMedical.status === "cancelled"
                                ? "bg-red-50 text-red-700 border border-red-200"
                                : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {activeMedical.status || "Pending"}
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                          No Booking
                        </span>
                      )}
                    </div>

                    {activeMedical ? (
                      <div className="space-y-2">
                        <h4 className="font-bold text-slate-900 text-base">
                          {activeMedical.medical_website || "Medical Center"}
                        </h4>
                        <div className="flex flex-col gap-1 text-xs text-slate-500">
                          <span>Applicant: {activeMedical.full_name}</span>
                          <span>Location: {activeMedical.location}</span>
                          {activeMedical.preferred_date && (
                            <span className="font-medium text-[#0d7377]">
                              Date: {new Date(activeMedical.preferred_date).toLocaleDateString()} at{" "}
                              {activeMedical.preferred_time || "TBD"}
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="py-4 text-center">
                        <p className="text-sm text-slate-500">Haven't booked your medical exam?</p>
                        <p className="text-xs text-slate-400 mt-1">
                          Immigration medical centers require strict booking.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-slate-100 mt-4 flex justify-between items-center">
                    {activeMedical ? (
                      <>
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock className="h-3 w-3" /> Updated recently
                        </span>
                        <button
                          onClick={() => {
                            setSelectedModalType("medical");
                            setIsModalOpen(true);
                          }}
                          className="text-xs font-bold text-teal-700 hover:text-teal-900 inline-flex items-center gap-0.5 cursor-pointer"
                        >
                          View details <ArrowRight className="h-3 w-3" />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => router.push("/book-appointment")}
                        className="w-full inline-flex justify-center items-center gap-1.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                      >
                        Book Appointment <ArrowUpRight className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* SERVICES GRID */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-[#0a1128]">Your Services</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {services.map((service, index) => (
                  <StatCard
                    key={index}
                    title={service.title}
                    icon={service.icon}
                    status={service.status}
                    count={service.count}
                    countLabel={service.countLabel}
                    description={service.description}
                    onClick={() => {
                      if (service.onClick) {
                        service.onClick();
                      } else if (service.href) {
                        router.push(service.href);
                      }
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Checklist */}
          <div className="space-y-8">
            {/* INTERACTIVE DOCUMENTS CHECKLIST */}
            <div className="bg-white border border-[#eef3f3] rounded-3xl p-6 shadow-sm flex flex-col">
              <div className="space-y-1 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-[#0d7377]" />
                  <h2 className="text-xl font-bold text-gray-900">Milestone Checklist</h2>
                </div>
                <p className="text-xs text-gray-500">Track and tick off items as you secure them</p>
              </div>

              {/* Progress Bar */}
              <div className="py-4 space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-500">Progress</span>
                  <span className="text-[#0d7377]">
                    {progressPercent}% ({checkedCount}/{checklist.length})
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-[#0d7377] to-[#32e0c4] h-full rounded-full transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Checklist list */}
              <div className="space-y-3 flex-1 overflow-y-auto max-h-[320px] pr-1 scrollbar-premium">
                {checklist.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start justify-between p-3 rounded-xl border border-slate-100 bg-[#fbfdfd] hover:bg-slate-50/50 transition gap-3"
                  >
                    <div className="flex items-start gap-2.5">
                      <input
                        type="checkbox"
                        checked={item.checked}
                        onChange={() => handleChecklistChange(item.id)}
                        className="mt-1 w-4 h-4 text-[#0d7377] border-slate-300 rounded focus:ring-[#0d7377] accent-[#0d7377] cursor-pointer"
                      />
                      <div className="space-y-0.5">
                        <span
                          className={`text-[13px] font-medium leading-snug block ${item.checked ? "line-through text-slate-400" : "text-slate-800"}`}
                        >
                          {item.label}
                        </span>
                        <span className="inline-block px-1.5 py-0.5 rounded bg-slate-100 text-slate-400 text-[10px] uppercase font-bold">
                          {item.category}
                        </span>
                      </div>
                    </div>
                    {item.link && (
                      <button
                        onClick={() => router.push(item.link)}
                        className="p-1 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-lg transition shrink-0 cursor-pointer"
                        title="View Guide / Service"
                      >
                        <ArrowUpRight className="h-4.5 w-4.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* ESTIMATED TIMELINE / PROCESSING TIMES */}
            <div className="bg-white border border-[#eef3f3] rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                <Clock className="h-5 w-5 text-teal-600 animate-pulse" />
                <h3 className="text-lg font-bold text-gray-900">Processing Times</h3>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed">
                Estimated average durations for the Pakistan-to-US family visa pipeline (IR-1 / CR-1
                category).
              </p>

              <div className="space-y-3 pt-1">
                {/* Step 1 */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100/50 transition">
                  <div className="flex items-center gap-2.5">
                    <span className="flex items-center justify-center w-5.5 h-5.5 rounded-full bg-teal-50 text-[10px] font-bold text-[#0d7377] border border-teal-100 shrink-0">
                      1
                    </span>
                    <span className="text-xs font-semibold text-slate-700">
                      USCIS I-130 Petition Approval
                    </span>
                  </div>
                  <span className="text-xs font-bold text-[#0d7377] bg-teal-50/50 px-2 py-0.5 rounded-md shrink-0">
                    11-13 Mos
                  </span>
                </div>

                {/* Step 2 */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100/50 transition">
                  <div className="flex items-center gap-2.5">
                    <span className="flex items-center justify-center w-5.5 h-5.5 rounded-full bg-teal-50 text-[10px] font-bold text-[#0d7377] border border-teal-100 shrink-0">
                      2
                    </span>
                    <span className="text-xs font-semibold text-slate-700">
                      NVC Document Review
                    </span>
                  </div>
                  <span className="text-xs font-bold text-[#0d7377] bg-teal-50/50 px-2 py-0.5 rounded-md shrink-0">
                    2-4 Weeks
                  </span>
                </div>

                {/* Step 3 */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100/50 transition">
                  <div className="flex items-center gap-2.5">
                    <span className="flex items-center justify-center w-5.5 h-5.5 rounded-full bg-teal-50 text-[10px] font-bold text-[#0d7377] border border-teal-100 shrink-0">
                      3
                    </span>
                    <span className="text-xs font-semibold text-slate-700">
                      Islamabad Embassy Interview
                    </span>
                  </div>
                  <span className="text-xs font-bold text-[#0d7377] bg-teal-50/50 px-2 py-0.5 rounded-md shrink-0">
                    2-3 Mos
                  </span>
                </div>
              </div>

              {/* Tip box */}
              <div className="flex items-start gap-2 p-3 bg-amber-50/60 rounded-2xl border border-amber-100/50 text-amber-900 text-[11px] leading-relaxed">
                <Sparkles className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Pro Tip:</span> Sindh PCC is valid for 12 months.
                  Make sure yours doesn't expire before your step 3 interview!
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* DETAIL MODAL (Fixed from V1) */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="w-[calc(100%-2rem)] md:w-full max-w-2xl bg-white rounded-2xl p-0 shadow-xl max-h-[85vh] overflow-hidden border border-gray-100 flex flex-col">
          {/* Close button in top-right */}
          <button
            onClick={() => setIsModalOpen(false)}
            className="absolute right-4 top-4 rounded-full p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors focus:outline-none z-10060 cursor-pointer"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>

          {selectedModalType === "pcc" ? (
            <>
              {/* Static Header */}
              <div className="flex items-center gap-3 border-b border-gray-100 px-6 py-5 shrink-0 pr-12">
                <Shield className="h-6 w-6 text-teal-650 flex-shrink-0" />
                <div>
                  <DialogTitle className="text-xl font-bold text-gray-900">
                    Sindh PCC Requests
                  </DialogTitle>
                  <DialogDescription className="text-sm text-gray-500 mt-1">
                    Track the status of your Police Character Certificate filing for Sindh.
                  </DialogDescription>
                </div>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto scrollbar-premium px-6 py-5">
                {loadingStatus ? (
                  <div className="flex justify-center py-8">
                    <Loader size="md" />
                  </div>
                ) : pccRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <Shield className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-600 font-medium">No active PCC requests found</p>
                    <p className="text-sm text-gray-400 mt-1 mb-4">
                      You haven&apos;t requested any Sindh PCC filing yet.
                    </p>
                    <button
                      onClick={() => {
                        setIsModalOpen(false);
                        router.push("/police-verification/apply?province=Sindh");
                      }}
                      className="inline-flex items-center justify-center px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium text-sm transition cursor-pointer"
                    >
                      Apply for PCC Sindh
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pccRequests.map((req) => (
                      <div
                        key={req.id}
                        className="border border-gray-200 rounded-xl p-4 bg-gray-50/50 hover:bg-gray-50 transition"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className="font-mono text-xs font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
                              {req.request_id}
                            </span>
                            <h4 className="font-semibold text-gray-900 mt-1">{req.full_name}</h4>
                          </div>
                          <span
                            className={`text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize ${
                              req.status === "completed"
                                ? "bg-green-100 text-green-700"
                                : req.status === "in_progress"
                                  ? "bg-blue-100 text-blue-700"
                                  : req.status === "action_required"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {req.status?.replace("_", " ") || "Pending"}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-500 mt-2 border-t pt-2">
                          <div>
                            <span className="font-medium">District:</span> {req.district}
                          </div>
                          <div>
                            <span className="font-medium">Purpose:</span> {req.purpose}
                          </div>
                          {req.created_at && (
                            <div className="col-span-2 mt-1">
                              <span className="font-medium">Filed On:</span>{" "}
                              {new Date(req.created_at).toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Static Header */}
              <div className="flex items-center gap-3 border-b border-gray-100 px-6 py-5 shrink-0 pr-12">
                <Calendar className="h-6 w-6 text-emerald-600 flex-shrink-0" />
                <div>
                  <DialogTitle className="text-xl font-bold text-gray-900">
                    Medical Appointments
                  </DialogTitle>
                  <DialogDescription className="text-sm text-gray-500 mt-1">
                    Manage and view the status of your booked medical examinations.
                  </DialogDescription>
                </div>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto scrollbar-premium px-6 py-5">
                {loadingStatus ? (
                  <div className="flex justify-center py-8">
                    <Loader size="md" />
                  </div>
                ) : medicalAppointments.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-600 font-medium">No medical appointments booked</p>
                    <p className="text-sm text-gray-400 mt-1 mb-4">
                      You haven't scheduled a medical appointment yet.
                    </p>
                    <button
                      onClick={() => {
                        setIsModalOpen(false);
                        router.push("/book-appointment");
                      }}
                      className="inline-flex items-center justify-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium text-sm transition cursor-pointer"
                    >
                      Book Appointment
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {medicalAppointments.map((appointment) => (
                      <div
                        key={appointment.id}
                        className="border border-gray-200 rounded-xl p-4 bg-gray-50/50 hover:bg-gray-50 transition"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className="font-semibold text-gray-900">
                              {appointment.medical_website || "Medical Examination"}
                            </span>
                            <p className="text-xs text-gray-500 capitalize mt-0.5">
                              Location: {appointment.location}
                            </p>
                          </div>
                          <span
                            className={`text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize ${
                              appointment.status === "completed"
                                ? "bg-green-100 text-green-700"
                                : appointment.status === "in_progress"
                                  ? "bg-blue-100 text-blue-700"
                                  : appointment.status === "cancelled"
                                    ? "bg-gray-100 text-gray-700"
                                    : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {appointment.status || "Pending"}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-500 mt-2 border-t pt-2">
                          <div>
                            <span className="font-medium">Applicant:</span> {appointment.full_name}
                          </div>
                          <div>
                            <span className="font-medium">Passport:</span>{" "}
                            {appointment.passport_number || "N/A"}
                          </div>
                          <div>
                            <span className="font-medium">Preferred Date:</span>{" "}
                            {appointment.preferred_date
                              ? new Date(appointment.preferred_date).toLocaleDateString(undefined, {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })
                              : "N/A"}
                          </div>
                          <div>
                            <span className="font-medium">Preferred Time:</span>{" "}
                            {appointment.preferred_time || "N/A"}
                          </div>
                        </div>
                        {appointment.notes && (
                          <div className="mt-2 text-xs text-gray-600 bg-gray-100/50 p-2 rounded">
                            <span className="font-semibold">Note:</span> {appointment.notes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserDashboardV2;
