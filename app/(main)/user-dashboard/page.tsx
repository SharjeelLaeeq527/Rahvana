"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, MessageSquare, FileUp, Users, Shield, Calendar, X } from "lucide-react";

import StatCard from "@/app/components/shared/StatCard";
import { Loader } from "@/components/ui/spinner";
import { useAuth } from "@/app/context/AuthContext";
import { E, msg } from "@/lib/errors";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";

type Analytics = {
  journeys: { total: number };
  guides: { total: number };
  document_translations: { total: number };
  case_strength: { total: number };
  interview_prep: { total: number };
};

const UserDashboard = () => {
  const router = useRouter();

  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [journeyType, setJourneyType] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [pccRequests, setPccRequests] = useState<any[]>([]);
  const [medicalAppointments, setMedicalAppointments] = useState<any[]>([]);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedModalType, setSelectedModalType] = useState<"pcc" | "medical" | null>(null);

  const { profile } = useAuth();

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await fetch("/api/user-dashboard/analytics");

        if (!res.ok) throw new Error(msg(E.ANALYTICS_FETCH_FAILED));

        const data = await res.json();
        setAnalytics(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    const fetchJourneyType = async () => {
      try {
        const journeyTypeValue = "IR1";

        const res = await fetch(
          `/api/journeys?journey_type=${encodeURIComponent(journeyTypeValue)}`
        );

        if (!res.ok) throw new Error(msg(E.JOURNEY_NOT_FOUND));

        const data = await res.json();
        console.log(data);

        // Extract just the journey type string, not the entire object
        setJourneyType(journeyTypeValue);
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

    fetchAnalytics();
    fetchJourneyType();
    fetchServicesStatus();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <Loader size="lg" />
        <p className="text-[#0d7377] text-sm font-medium mt-2">Preparing your dashboard...</p>
      </div>
    );
  }

  const services = [
    // {
    //   title: "My Journeys",
    //   icon: <Briefcase className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />,
    //   status: "live" as const,
    //   count: analytics?.journeys.total || 0,
    //   journeyType: journeyType,
    //   countLabel: "journeys created",
    //   description:
    //     "Track your IR-1 journey, progress through steps, and manage your case preparation.",
    //   href: ir1journeyHref,
    // },
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
    // {
    //   title: "Case Strength Analyzer",
    //   icon: <Brain className="h-5 w-5 text-violet-600 dark:text-violet-400" />,
    //   status: "live" as const,
    //   count: analytics?.case_strength.total || 0,
    //   countLabel: "cases analyzed",
    //   description:
    //     "Get an instant AI case strength score and identify gaps before NVC or visa interview.",
    //   href: "/visa-case-strength-checker/my-cases",
    // },
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
    {
      title: "PCC Filing Sindh",
      icon: <Shield className="h-5 w-5 text-teal-700 dark:text-teal-450" />,
      status: "live" as const,
      count: pccRequests.length,
      countLabel: pccRequests.length === 1 ? "request filed" : "requests filed",
      description: "Track the filing status of your Sindh Police Character Certificate.",
      onClick: () => {
        setSelectedModalType("pcc");
        setIsModalOpen(true);
      },
    },
    {
      title: "Medical Appointments",
      icon: <Calendar className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />,
      status: "live" as const,
      count: medicalAppointments.length,
      countLabel: medicalAppointments.length === 1 ? "appointment booked" : "appointments booked",
      description: "Manage your booked medical examination appointments and review status.",
      onClick: () => {
        setSelectedModalType("medical");
        setIsModalOpen(true);
      },
    },
  ];

  // const quickActions = [
  //   {
  //     title: "Explore Visa Categories",
  //     subtitle: "Understand different visa paths and eligibility",
  //     icon: <Briefcase size={18} />,
  //     href: "/visa-category",
  //   },
  //   {
  //     title: "Explore all Tools",
  //     subtitle: "Access tools to prepare your immigration case",
  //     icon: <Compass size={18} />,
  //     href: "/tools",
  //   },
  //   {
  //     title: "Explore all services",
  //     subtitle: "View our services for preparing yourself for immigration process",
  //     icon: <FileText size={18} />,
  //     href: "/services",
  //   },
  // ];

  return (
    <div className="bg-[#f8fafa]">
      <div className="w-full site-main-px site-main-py mt-14">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-start mb-2">
            <h2 className="text-[28px] font-bold text-[#0a1128] mb-2">Dashboard</h2>
          </div>

          <h1 className="text-[28px] font-bold text-[#0a1128] mb-2">
            Welcome back, {profile?.full_name || "Valued User"}!
          </h1>

          <p className="text-[15px] text-[#67737e]">
            Track your guides, document translations, interview prep, consultations, PCC filing, and
            medical appointments to prepare for every step of your journey.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* MAIN CONTENT */}
          <div className="flex-1">
            <div className="mb-8">
              <h2 className="text-[17px] font-semibold text-[#0a1128] mb-4">Your Services</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {services.map((service, index) => (
                  <StatCard
                    key={index}
                    title={service.title}
                    icon={service.icon}
                    status={service.status}
                    type={service.journeyType}
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
        </div>
      </div>

      {/* Dialog modal to show requests and statuses */}
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

export default UserDashboard;
