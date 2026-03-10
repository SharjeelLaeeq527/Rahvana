"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/app/context/AuthContext";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  ShieldCheck,
  UserPlus,
  CheckCircle2,
  AlertCircle,
  Save,
  Eye,
  EyeOff,
  RefreshCw,
  Info,
  ChevronRight,
  User,
  Lock,
  ExternalLink,
  Download,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import jsPDF from "jspdf";
import { useLanguage } from "@/app/context/LanguageContext";
import { Loader } from "@/components/ui/spinner";

// const SECURITY_QUESTIONS_1 = [
//   "What is your mother's maiden name?",
//   "What was the name of your first/current/favorite pet?",
//   "What was your first car?",
//   "What elementary school did you attend?",
//   "What is the name of the town/city where you were born?",
// ];

// const SECURITY_QUESTIONS_2 = [
//   "What is the name of the road/street you grew up on?",
//   "What is your least favorite food?",
//   "What was the first company that you worked for?",
//   "What is your favorite food?",
//   "What high school did you attend?",
// ];

// const SECURITY_QUESTIONS_3 = [
//   "Where did you meet your spouse?",
//   "What is your sibling's middle name?",
//   "Who was your childhood hero?",
//   "In what city or town was your first job?",
//   "What is the name of a college you applied to but didn't attend?",
// ];

export default function CourierRegistrationPage() {
  const { t, tRaw } = useLanguage();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("guide");
  const [guideStage, setGuideStage] = useState(1);
  const [showAnswers, setShowAnswers] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [portalUsername, setPortalUsername] = useState("");
  const [questions, setQuestions] = useState({
    q1: "",
    a1: "",
    q2: "",
    a2: "",
    q3: "",
    a3: "",
  });

  const fetchUserQuestions = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/visa-security?userId=${user.id}`);
      const result = await response.json();
      if (result.data) {
        setPortalUsername(result.data.portal_username || "");
        setQuestions({
          q1: result.data.question_1 || "",
          a1: result.data.answer_1 || "",
          q2: result.data.question_2 || "",
          a2: result.data.answer_2 || "",
          q3: result.data.question_3 || "",
          a3: result.data.answer_3 || "",
        });
      }
    } catch (error) {
      console.error("Error fetching questions:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      // fetchUserQuestions(); // Removed automatic fetch per user request
    }
  }, [user, fetchUserQuestions]);

  const handleSave = async () => {
    if (!user) {
      setMessage({
        type: "error",
        text: t("pages.courierRegistration.messages.loginRequired"),
      });
      return;
    }

    if (
      !questions.q1 ||
      !questions.a1 ||
      !questions.q2 ||
      !questions.a2 ||
      !questions.q3 ||
      !questions.a3
    ) {
      setMessage({
        type: "error",
        text: t("pages.courierRegistration.messages.fillAll"),
      });
      return;
    }

    setIsSaving(true);
    setMessage(null);
    try {
      const response = await fetch("/api/visa-security", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, questions, portalUsername }),
      });
      const result = await response.json();
      if (response.ok) {
        setMessage({
          type: "success",
          text: t("pages.courierRegistration.messages.saveSuccess"),
        });
      } else {
        setMessage({
          type: "error",
          text:
            result.error || t("pages.courierRegistration.messages.saveError"),
        });
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: t("pages.courierRegistration.messages.unexpectedError"),
      });
      console.error("Error saving questions:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    const timestamp = new Date().toLocaleString();

    // Design Elements
    doc.setFillColor(13, 148, 136); // Primary Color (#0d9488)
    doc.rect(0, 0, 210, 40, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text(t("pages.courierRegistration.pdf.title"), 20, 25);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(t("pages.courierRegistration.pdf.header"), 20, 32);

    // Content Section
    doc.setTextColor(31, 41, 55);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(t("pages.courierRegistration.pdf.credentials"), 20, 55);

    doc.setDrawColor(229, 231, 235);
    doc.line(20, 58, 190, 58);

    doc.setFont("helvetica", "normal");
    doc.text(t("pages.courierRegistration.pdf.usernameLabel"), 20, 70);
    doc.setFont("helvetica", "bold");
    doc.text(
      portalUsername || t("pages.courierRegistration.pdf.notProvided"),
      60,
      70,
    );

    doc.setFont("helvetica", "bold");
    doc.text(t("pages.courierRegistration.pdf.securityQuestions"), 20, 90);
    doc.line(20, 93, 190, 93);

    const questionsList = [
      {
        q: questions.q1,
        a: questions.a1,
        label: t("pages.courierRegistration.pdf.q1"),
      },
      {
        q: questions.q2,
        a: questions.a2,
        label: t("pages.courierRegistration.pdf.q2"),
      },
      {
        q: questions.q3,
        a: questions.a3,
        label: t("pages.courierRegistration.pdf.q3"),
      },
    ];

    let currentY = 105;
    questionsList.forEach((item) => {
      doc.setFont("helvetica", "bold");
      doc.setTextColor(13, 148, 136);
      doc.text(item.label + ":", 20, currentY);

      doc.setTextColor(31, 41, 55);
      doc.setFont("helvetica", "normal");
      const qLines = doc.splitTextToSize(item.q || "Not selected", 160);
      doc.text(qLines, 20, currentY + 8);

      currentY += qLines.length * 7 + 8;

      doc.setFont("helvetica", "bold");
      doc.text(t("pages.courierRegistration.pdf.answerLabel"), 20, currentY);
      doc.setFont("helvetica", "normal");
      doc.text(
        item.a || t("pages.courierRegistration.pdf.notProvided"),
        40,
        currentY,
      );

      currentY += 15;
    });

    // Footer
    doc.setDrawColor(229, 231, 235);
    doc.line(20, 270, 190, 270);
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175);
    doc.text(
      `${t("pages.courierRegistration.pdf.generatedOn")}: ${timestamp}`,
      20,
      278,
    );
    doc.text(t("pages.courierRegistration.pdf.footerText"), 190, 278, {
      align: "right",
    });

    doc.save("US-Visa-Security-Portal-Info.pdf");
  };

  const GuideStep = ({
    title,
    description,
    badge,
    children,
  }: {
    title: string;
    description: string;
    badge?: string;
    children?: React.ReactNode;
  }) => (
    <div className="relative pl-6 sm:pl-8 pb-6 sm:pb-8 border-l-2 border-primary/20 last:border-0 last:pb-0">
      <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-primary border-4 border-white shadow-sm" />
      <div className="space-y-2 sm:space-y-3">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-[-4px]">
          <h3 className="text-base sm:text-lg font-bold text-gray-900">
            {title}
          </h3>
          {badge && (
            <Badge
              variant="secondary"
              className="bg-primary/10 text-primary border-none text-xs"
            >
              {badge}
            </Badge>
          )}
        </div>
        <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
        <div className="pt-2">{children}</div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50/50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="text-center space-y-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center"
          >
            <div className="p-3 bg-primary rounded-2xl shadow-lg ring-4 ring-primary/10">
              <ShieldCheck className="text-white w-8 h-8" />
            </div>
          </motion.div>
          <div className="space-y-2">
            <h1 className="text-4xl font-black tracking-tight text-gray-900 sm:text-5xl">
              {t("pages.courierRegistration.title.main")}{" "}
              <span className="text-primary">
                {t("pages.courierRegistration.title.highlight")}
              </span>
            </h1>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto font-medium">
              {t("pages.courierRegistration.subtitle")}
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex justify-center mb-6 sm:mb-8 w-full px-2 sm:px-0">
            <TabsList className="bg-white p-1.5 sm:p-1 rounded-2xl shadow-md border border-gray-100 h-auto flex flex-col sm:flex-row w-full sm:w-auto gap-1 sm:gap-0">
              <TabsTrigger
                value="guide"
                className="w-full sm:w-auto px-6 sm:px-8 py-3 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white transition-all text-sm font-bold gap-2"
              >
                <Info size={16} /> {t("pages.courierRegistration.tabs.guide")}
              </TabsTrigger>
              <TabsTrigger
                value="security"
                onClick={() => fetchUserQuestions()}
                className="w-full sm:w-auto px-6 sm:px-8 py-3 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white transition-all text-sm font-bold gap-2"
              >
                <Lock size={16} />{" "}
                {t("pages.courierRegistration.tabs.security")}
              </TabsTrigger>
            </TabsList>
          </div>

          <AnimatePresence mode="wait">
            <TabsContent value="guide" key="guide">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="grid grid-cols-1 lg:grid-cols-4 gap-8"
              >
                {/* Sidebar Navigation */}
                <Card className="lg:col-span-1 border-none shadow-xl shadow-slate-200/50 rounded-2xl lg:rounded-3xl bg-white p-2 sm:p-4 h-fit">
                  <div className="flex lg:flex-col sm:justify-center sm:items-center gap-2 overflow-x-auto pb-2 lg:pb-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] snap-x">
                    {[
                      {
                        id: 1,
                        title: t("pages.courierRegistration.sidebar.signup"),
                      },
                      {
                        id: 2,
                        title: t("pages.courierRegistration.sidebar.profile"),
                      },
                      {
                        id: 3,
                        title: t(
                          "pages.courierRegistration.sidebar.application",
                        ),
                      },
                      {
                        id: 4,
                        title: t(
                          "pages.courierRegistration.sidebar.groupRequest",
                        ),
                      },
                    ].map((stage) => (
                      <button
                        key={stage.id}
                        onClick={() => setGuideStage(stage.id)}
                        className={`shrink-0 snap-start lg:w-full flex items-center gap-2 sm:gap-3 px-4 py-2.5 sm:py-3 rounded-xl transition-all font-bold text-xs sm:text-sm ${
                          guideStage === stage.id
                            ? "bg-primary text-white shadow-lg shadow-primary/20"
                            : "text-gray-500 hover:bg-slate-50 hover:text-primary"
                        }`}
                      >
                        {/* {stage.icon} */}
                        {stage.title}
                      </button>
                    ))}
                  </div>
                </Card>

                {/* Steps Section */}
                <Card className="lg:col-span-3 border-none shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden bg-white">
                  <CardHeader className="border-b border-gray-50 bg-slate-50/50 p-4 sm:p-6 pb-4 sm:pb-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-xl font-bold flex items-center gap-2">
                          {guideStage === 1 ? (
                            <>
                              <UserPlus className="text-primary" />{" "}
                              {t(
                                "pages.courierRegistration.guide.titles.signup",
                              )}
                            </>
                          ) : guideStage === 2 ? (
                            <>
                              <User className="text-primary" />{" "}
                              {t(
                                "pages.courierRegistration.guide.titles.profile",
                              )}
                            </>
                          ) : guideStage === 3 ? (
                            <>
                              <ExternalLink className="text-primary" />{" "}
                              {t(
                                "pages.courierRegistration.guide.titles.application",
                              )}
                            </>
                          ) : (
                            <>
                              <UserPlus className="text-primary" />{" "}
                              {t(
                                "pages.courierRegistration.guide.titles.groupRequest",
                              )}
                            </>
                          )}
                        </CardTitle>
                        <CardDescription>
                          {guideStage === 1
                            ? t(
                                "pages.courierRegistration.guide.descriptions.signup",
                              )
                            : guideStage === 2
                              ? t(
                                  "pages.courierRegistration.guide.descriptions.profile",
                                )
                              : guideStage === 3
                                ? t(
                                    "pages.courierRegistration.guide.descriptions.application",
                                  )
                                : t(
                                    "pages.courierRegistration.guide.descriptions.groupRequest",
                                  )}
                        </CardDescription>
                      </div>
                      {(guideStage === 1 || guideStage === 3) && (
                        <a
                          href="https://www.usvisascheduling.com/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-sm font-bold text-primary hover:underline group w-fit"
                        >
                          {t("pages.courierRegistration.guide.visitPortal")}{" "}
                          <ExternalLink
                            size={14}
                            className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
                          />
                        </a>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6 sm:pt-8 px-4 sm:px-8">
                    <div className="space-y-4">
                      {guideStage === 1 && (
                        <>
                          <GuideStep
                            title={t(
                              "pages.courierRegistration.guide.steps.signup.s1.title",
                            )}
                            description={t(
                              "pages.courierRegistration.guide.steps.signup.s1.desc",
                            )}
                          >
                            <a
                              href="https://www.usvisascheduling.com/"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-sm font-bold text-primary hover:underline group w-fit"
                            >
                              {t("pages.courierRegistration.guide.visitPortal")}{" "}
                              <ExternalLink
                                size={14}
                                className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
                              />
                            </a>
                          </GuideStep>
                          <GuideStep
                            title={t(
                              "pages.courierRegistration.guide.steps.signup.s2.title",
                            )}
                            description={t(
                              "pages.courierRegistration.guide.steps.signup.s2.desc",
                            )}
                            badge={t(
                              "pages.courierRegistration.guide.badges.mandatory",
                            )}
                          />
                          <GuideStep
                            title={t(
                              "pages.courierRegistration.guide.steps.signup.s3.title",
                            )}
                            description={t(
                              "pages.courierRegistration.guide.steps.signup.s3.desc",
                            )}
                          >
                            <div className="bg-orange-50 border border-orange-100 p-4 rounded-xl flex items-start gap-3 mt-2">
                              <AlertCircle
                                className="text-orange-500 shrink-0 mt-0.5"
                                size={18}
                              />
                              <p className="text-xs text-orange-700 font-medium leading-relaxed">
                                Check your inbox (and spam folder) for a 6-digit
                                code. Enter it into the portal and click `Verify
                                Code` to proceed.
                              </p>
                            </div>
                          </GuideStep>
                          <GuideStep
                            title={t(
                              "pages.courierRegistration.guide.steps.signup.s4.title",
                            )}
                            description={t(
                              "pages.courierRegistration.guide.steps.signup.s4.desc",
                            )}
                          />
                          <GuideStep
                            title={t(
                              "pages.courierRegistration.guide.steps.signup.s5.title",
                            )}
                            description=""
                            badge={t(
                              "pages.courierRegistration.guide.badges.critical",
                            )}
                          >
                            <p className="text-gray-600 text-sm leading-relaxed">
                              {t(
                                "pages.courierRegistration.guide.steps.signup.s5.desc",
                              )}{" "}
                              <button
                                onClick={() => {
                                  setActiveTab("security");
                                  fetchUserQuestions();
                                }}
                                className="text-primary font-bold hover:underline cursor-pointer inline-flex items-center gap-1"
                              >
                                {t(
                                  "pages.courierRegistration.guide.steps.signup.s5.link",
                                )}
                              </button>{" "}
                              {t(
                                "pages.courierRegistration.guide.steps.signup.s8.q1End",
                              )}
                            </p>
                          </GuideStep>
                          <GuideStep
                            title={t(
                              "pages.courierRegistration.guide.steps.signup.s6.title",
                            )}
                            description={t(
                              "pages.courierRegistration.guide.steps.signup.s6.desc",
                            )}
                          />
                          <GuideStep
                            title={t(
                              "pages.courierRegistration.guide.steps.signup.s7.title",
                            )}
                            description={t(
                              "pages.courierRegistration.guide.steps.signup.s7.desc",
                            )}
                          />
                          <GuideStep
                            title={t(
                              "pages.courierRegistration.guide.steps.signup.s8.title",
                            )}
                            description={t(
                              "pages.courierRegistration.guide.steps.signup.s8.desc",
                            )}
                            badge={t(
                              "pages.courierRegistration.guide.badges.required",
                            )}
                          >
                            <div className="space-y-2 text-sm text-gray-600">
                              <p>
                                •{" "}
                                <strong>
                                  {t(
                                    "pages.courierRegistration.guide.steps.signup.s8.username",
                                  )}
                                </strong>{" "}
                                {t(
                                  "pages.courierRegistration.guide.steps.signup.s8.usernameDesc",
                                )}
                              </p>
                              <p>
                                •{" "}
                                <strong>
                                  {t(
                                    "pages.courierRegistration.guide.steps.signup.s8.q1",
                                  )}
                                </strong>{" "}
                                {t(
                                  "pages.courierRegistration.guide.steps.signup.s8.q1Desc",
                                )}{" "}
                                <button
                                  onClick={() => {
                                    setActiveTab("security");
                                    fetchUserQuestions();
                                  }}
                                  className="text-primary font-bold hover:underline cursor-pointer inline-flex items-center gap-1"
                                >
                                  {t(
                                    "pages.courierRegistration.guide.steps.signup.s8.q1Link",
                                  )}
                                </button>{" "}
                                {t(
                                  "pages.courierRegistration.guide.steps.signup.s8.q1End",
                                )}
                              </p>
                              <p>
                                •{" "}
                                <strong>
                                  {t(
                                    "pages.courierRegistration.guide.steps.signup.s8.q2",
                                  )}
                                </strong>{" "}
                                {t(
                                  "pages.courierRegistration.guide.steps.signup.s8.q2Desc",
                                )}
                              </p>
                              <p>
                                {t(
                                  "pages.courierRegistration.guide.steps.signup.s8.continue",
                                )}
                              </p>
                            </div>
                          </GuideStep>
                          <GuideStep
                            title={t(
                              "pages.courierRegistration.guide.steps.signup.s9.title",
                            )}
                            description={t(
                              "pages.courierRegistration.guide.steps.signup.s9.desc",
                            )}
                          />
                        </>
                      )}

                      {guideStage === 2 && (
                        <>
                          <GuideStep
                            title={t(
                              "pages.courierRegistration.guide.steps.profile.s1.title",
                            )}
                            description={t(
                              "pages.courierRegistration.guide.steps.profile.s1.desc",
                            )}
                            badge={t(
                              "pages.courierRegistration.guide.badges.important",
                            )}
                          />
                          <GuideStep
                            title={t(
                              "pages.courierRegistration.guide.steps.profile.s2.title",
                            )}
                            description={t(
                              "pages.courierRegistration.guide.steps.profile.s2.desc",
                            )}
                          />
                          <GuideStep
                            title={t(
                              "pages.courierRegistration.guide.steps.profile.s3.title",
                            )}
                            description={t(
                              "pages.courierRegistration.guide.steps.profile.s3.desc",
                            )}
                          />
                          <GuideStep
                            title={t(
                              "pages.courierRegistration.guide.steps.profile.s4.title",
                            )}
                            description={t(
                              "pages.courierRegistration.guide.steps.profile.s4.desc",
                            )}
                          />
                        </>
                      )}

                      {guideStage === 3 && (
                        <>
                          <GuideStep
                            title={t(
                              "pages.courierRegistration.guide.steps.application.s1.title",
                            )}
                            description={t(
                              "pages.courierRegistration.guide.steps.application.s1.desc",
                            )}
                          />
                          <GuideStep
                            title={t(
                              "pages.courierRegistration.guide.steps.application.s2.title",
                            )}
                            description={t(
                              "pages.courierRegistration.guide.steps.application.s2.desc",
                            )}
                          >
                            <ul className="space-y-2 text-sm text-gray-600 ml-4 list-disc">
                              <li>
                                <strong>
                                  {t(
                                    "pages.courierRegistration.guide.steps.application.s2.country",
                                  )}
                                </strong>{" "}
                                {t(
                                  "pages.courierRegistration.guide.steps.application.s2.countryDesc",
                                )}
                              </li>
                              <li>
                                <strong>
                                  {t(
                                    "pages.courierRegistration.guide.steps.application.s2.name",
                                  )}
                                </strong>{" "}
                                {t(
                                  "pages.courierRegistration.guide.steps.application.s2.nameDesc",
                                )}
                              </li>
                              <li>
                                <strong>
                                  {t(
                                    "pages.courierRegistration.guide.steps.application.s2.birth",
                                  )}
                                </strong>{" "}
                                {t(
                                  "pages.courierRegistration.guide.steps.application.s2.birthDesc",
                                )}
                              </li>
                            </ul>
                          </GuideStep>
                          <GuideStep
                            title={t(
                              "pages.courierRegistration.guide.steps.application.s3.title",
                            )}
                            description={t(
                              "pages.courierRegistration.guide.steps.application.s3.desc",
                            )}
                          >
                            <ul className="space-y-2 text-sm text-gray-600 ml-4 list-disc">
                              <li>
                                <strong>
                                  {t(
                                    "pages.courierRegistration.guide.steps.application.s3.phone",
                                  )}
                                </strong>{" "}
                                {t(
                                  "pages.courierRegistration.guide.steps.application.s3.phoneDesc",
                                )}
                              </li>
                              <li>
                                <strong>
                                  {t(
                                    "pages.courierRegistration.guide.steps.application.s3.email",
                                  )}
                                </strong>{" "}
                                {t(
                                  "pages.courierRegistration.guide.steps.application.s3.emailDesc",
                                )}
                              </li>
                            </ul>
                          </GuideStep>
                          <GuideStep
                            title={t(
                              "pages.courierRegistration.guide.steps.application.s4.title",
                            )}
                            description={t(
                              "pages.courierRegistration.guide.steps.application.s4.desc",
                            )}
                          />
                          <GuideStep
                            title={t(
                              "pages.courierRegistration.guide.steps.application.s5.title",
                            )}
                            description={t(
                              "pages.courierRegistration.guide.steps.application.s5.desc",
                            )}
                          >
                            <ul className="space-y-2 text-sm text-gray-600 ml-4 list-disc">
                              <li>
                                <strong>
                                  {t(
                                    "pages.courierRegistration.guide.steps.application.s5.pasport",
                                  )}
                                </strong>{" "}
                                {t(
                                  "pages.courierRegistration.guide.steps.application.s5.pasportDesc",
                                )}
                              </li>
                              <li>
                                <strong>
                                  {t(
                                    "pages.courierRegistration.guide.steps.application.s5.dates",
                                  )}
                                </strong>{" "}
                                {t(
                                  "pages.courierRegistration.guide.steps.application.s5.datesDesc",
                                )}
                              </li>
                              <li>
                                <strong>
                                  {t(
                                    "pages.courierRegistration.guide.steps.application.s5.place",
                                  )}
                                </strong>{" "}
                                {t(
                                  "pages.courierRegistration.guide.steps.application.s5.placeDesc",
                                )}
                              </li>
                            </ul>
                          </GuideStep>
                          <GuideStep
                            title={t(
                              "pages.courierRegistration.guide.steps.application.s6.title",
                            )}
                            description={t(
                              "pages.courierRegistration.guide.steps.application.s6.desc",
                            )}
                          >
                            <div className="space-y-2 text-sm text-gray-600">
                              <p>
                                •{" "}
                                <strong>
                                  {t(
                                    "pages.courierRegistration.guide.steps.application.s6.id",
                                  )}
                                </strong>{" "}
                                {t(
                                  "pages.courierRegistration.guide.steps.application.s6.idDesc",
                                )}
                              </p>
                              <p>
                                •{" "}
                                {t(
                                  "pages.courierRegistration.guide.steps.application.s6.review",
                                )}
                              </p>
                              <p>
                                •{" "}
                                {t(
                                  "pages.courierRegistration.guide.steps.application.s6.submit",
                                )}
                              </p>
                            </div>
                          </GuideStep>
                        </>
                      )}

                      {guideStage === 4 && (
                        <>
                          <GuideStep
                            title={t(
                              "pages.courierRegistration.guide.steps.groupRequest.s1.title",
                            )}
                            description={t(
                              "pages.courierRegistration.guide.steps.groupRequest.s1.desc",
                            )}
                          />
                          <GuideStep
                            title={t(
                              "pages.courierRegistration.guide.steps.groupRequest.s2.title",
                            )}
                            description={t(
                              "pages.courierRegistration.guide.steps.groupRequest.s2.desc",
                            )}
                          >
                            <ul className="space-y-2 text-sm text-gray-600 ml-4 list-disc">
                              <li>
                                <strong>
                                  {t(
                                    "pages.courierRegistration.guide.steps.groupRequest.s2.name",
                                  )}
                                </strong>{" "}
                                {t(
                                  "pages.courierRegistration.guide.steps.groupRequest.s2.nameDesc",
                                )}
                              </li>
                              <li>
                                <strong>
                                  {t(
                                    "pages.courierRegistration.guide.steps.groupRequest.s2.date",
                                  )}
                                </strong>{" "}
                                {t(
                                  "pages.courierRegistration.guide.steps.groupRequest.s2.dateDesc",
                                )}
                              </li>
                              <li>
                                <strong>
                                  {t(
                                    "pages.courierRegistration.guide.steps.groupRequest.s2.reason",
                                  )}
                                </strong>{" "}
                                {t(
                                  "pages.courierRegistration.guide.steps.groupRequest.s2.reasonDesc",
                                )}
                              </li>
                            </ul>
                          </GuideStep>
                          <GuideStep
                            title={t(
                              "pages.courierRegistration.guide.steps.groupRequest.s3.title",
                            )}
                            description={t(
                              "pages.courierRegistration.guide.steps.groupRequest.s3.desc",
                            )}
                          >
                            <ul className="space-y-2 text-sm text-gray-600 ml-4 list-disc">
                              <li>
                                <strong>
                                  {t(
                                    "pages.courierRegistration.guide.steps.groupRequest.s3.local",
                                  )}
                                </strong>{" "}
                                {t(
                                  "pages.courierRegistration.guide.steps.groupRequest.s3.localDesc",
                                )}
                              </li>
                              <li>
                                <strong>
                                  {t(
                                    "pages.courierRegistration.guide.steps.groupRequest.s3.us",
                                  )}
                                </strong>{" "}
                                {t(
                                  "pages.courierRegistration.guide.steps.groupRequest.s3.usDesc",
                                )}
                              </li>
                              <li>
                                <strong>
                                  {t(
                                    "pages.courierRegistration.guide.steps.groupRequest.s3.address",
                                  )}
                                </strong>{" "}
                                {t(
                                  "pages.courierRegistration.guide.steps.groupRequest.s3.addressDesc",
                                )}
                              </li>
                            </ul>
                          </GuideStep>
                          <GuideStep
                            title={t(
                              "pages.courierRegistration.guide.steps.groupRequest.s4.title",
                            )}
                            description={t(
                              "pages.courierRegistration.guide.steps.groupRequest.s4.desc",
                            )}
                          >
                            <ul className="space-y-2 text-sm text-gray-600 ml-4 list-disc">
                              <li>
                                <strong>
                                  {t(
                                    "pages.courierRegistration.guide.steps.groupRequest.s4.embassy",
                                  )}
                                </strong>{" "}
                                {t(
                                  "pages.courierRegistration.guide.steps.groupRequest.s4.embassyDesc",
                                )}
                              </li>
                              <li>
                                <strong>
                                  {t(
                                    "pages.courierRegistration.guide.steps.groupRequest.s4.attach",
                                  )}
                                </strong>{" "}
                                {t(
                                  "pages.courierRegistration.guide.steps.groupRequest.s4.attachDesc",
                                )}
                              </li>
                              <li>
                                <strong>
                                  {t(
                                    "pages.courierRegistration.guide.steps.groupRequest.s4.submit",
                                  )}
                                </strong>{" "}
                                {t(
                                  "pages.courierRegistration.guide.steps.groupRequest.s4.submitDesc",
                                )}
                              </li>
                            </ul>
                          </GuideStep>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            <TabsContent value="security" key="security">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="max-w-3xl mx-auto"
              >
                <div className="space-y-6">
                  <Card className="border-none shadow-2xl shadow-primary/5 rounded-[2.5rem] bg-white overflow-hidden border border-gray-100">
                    <CardHeader className="bg-slate-50/50 border-b border-gray-100 p-6 sm:p-8">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1 text-center sm:text-left">
                          <CardTitle className="text-xl sm:text-2xl font-black text-gray-900">
                            {t("pages.courierRegistration.securityVault.title")}
                          </CardTitle>
                          <p className="text-xs sm:text-sm text-gray-500 font-medium">
                            {t(
                              "pages.courierRegistration.securityVault.subtitle",
                            )}
                          </p>
                        </div>
                        <div className="flex items-center justify-center sm:justify-end gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => fetchUserQuestions()}
                            disabled={isLoading}
                            className="rounded-xl border-gray-200 hover:bg-white hover:border-primary transition-all font-bold"
                            title={t(
                              "pages.courierRegistration.securityVault.refreshTitle",
                            )}
                          >
                            <RefreshCw
                              size={16}
                              className={isLoading ? "animate-spin" : ""}
                            />
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setShowAnswers(!showAnswers)}
                            className="rounded-2xl border-gray-200 hover:bg-white hover:border-primary transition-all font-bold gap-2"
                          >
                            {showAnswers ? (
                              <EyeOff size={16} />
                            ) : (
                              <Eye size={16} />
                            )}
                            {showAnswers
                              ? t(
                                  "pages.courierRegistration.securityVault.hideBtn",
                                )
                              : t(
                                  "pages.courierRegistration.securityVault.showBtn",
                                )}{" "}
                            {t(
                              "pages.courierRegistration.securityVault.answersLabel",
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-8 space-y-6 sm:space-y-8">
                      {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-12 space-y-4">
                          <Loader
                            size="md"
                            text={t(
                              "pages.courierRegistration.securityVault.loading",
                            )}
                          />
                        </div>
                      ) : (
                        <>
                          <div className="space-y-6">
                            {/* Portal Username */}
                            <div className="space-y-3">
                              <Label className="text-xs sm:text-sm font-bold text-gray-700 ml-1 uppercase tracking-wider flex flex-wrap items-center gap-2">
                                <Badge className="bg-primary/10 text-primary hover:bg-primary/20 transition-colors border-none">
                                  <User size={14} />
                                </Badge>
                                {t(
                                  "pages.courierRegistration.securityVault.portalUsername",
                                )}
                              </Label>
                              <Input
                                type="text"
                                placeholder={t(
                                  "pages.courierRegistration.securityVault.portalUsernamePlaceholder",
                                )}
                                value={portalUsername}
                                onChange={(e) =>
                                  setPortalUsername(e.target.value)
                                }
                                className="h-14 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white transition-all font-bold px-6"
                              />
                            </div>

                            {/* Question 1 */}
                            <div className="space-y-3">
                              <Label className="text-xs sm:text-sm font-bold text-gray-700 ml-1 uppercase tracking-wider flex flex-wrap items-center gap-2">
                                <Badge className="bg-primary/10 text-primary hover:bg-primary/20 transition-colors border-none">
                                  1
                                </Badge>
                                {t(
                                  "pages.courierRegistration.securityVault.questionOne",
                                )}
                              </Label>
                              <Select
                                value={questions.q1}
                                onValueChange={(val) =>
                                  setQuestions({ ...questions, q1: val })
                                }
                              >
                                <SelectTrigger className="h-14 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white transition-all font-medium">
                                  <SelectValue placeholder="Select Question" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-gray-100 shadow-xl">
                                  {(
                                    tRaw(
                                      "pages.courierRegistration.questions.set1",
                                    ) as string[]
                                  ).map((q: string) => (
                                    <SelectItem
                                      key={q}
                                      value={q}
                                      className="rounded-xl my-1"
                                    >
                                      {q}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Input
                                type={showAnswers ? "text" : "password"}
                                placeholder={t(
                                  "pages.courierRegistration.securityVault.answerPlaceholder",
                                )}
                                value={questions.a1}
                                onChange={(e) =>
                                  setQuestions({
                                    ...questions,
                                    a1: e.target.value,
                                  })
                                }
                                className="h-14 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white transition-all font-bold tracking-widest px-6"
                              />
                            </div>

                            {/* Question 2 */}
                            <div className="space-y-3">
                              <Label className="text-xs sm:text-sm font-bold text-gray-700 ml-1 uppercase tracking-wider flex flex-wrap items-center gap-2">
                                <Badge className="bg-primary/10 text-primary hover:bg-primary/20 transition-colors border-none">
                                  2
                                </Badge>
                                {t(
                                  "pages.courierRegistration.securityVault.questionTwo",
                                )}
                              </Label>
                              <Select
                                value={questions.q2}
                                onValueChange={(val) =>
                                  setQuestions({ ...questions, q2: val })
                                }
                              >
                                <SelectTrigger className="h-14 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white transition-all font-medium">
                                  <SelectValue placeholder="Select Question" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-gray-100 shadow-xl">
                                  {(
                                    tRaw(
                                      "pages.courierRegistration.questions.set2",
                                    ) as string[]
                                  ).map((q: string) => (
                                    <SelectItem
                                      key={q}
                                      value={q}
                                      className="rounded-xl my-1"
                                    >
                                      {q}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Input
                                type={showAnswers ? "text" : "password"}
                                placeholder={t(
                                  "pages.courierRegistration.securityVault.answerPlaceholder",
                                )}
                                value={questions.a2}
                                onChange={(e) =>
                                  setQuestions({
                                    ...questions,
                                    a2: e.target.value,
                                  })
                                }
                                className="h-14 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white transition-all font-bold tracking-widest px-6"
                              />
                            </div>

                            {/* Question 3 */}
                            <div className="space-y-3">
                              <Label className="text-xs sm:text-sm font-bold text-gray-700 ml-1 uppercase tracking-wider flex flex-wrap items-center gap-2">
                                <Badge className="bg-primary/10 text-primary hover:bg-primary/20 transition-colors border-none">
                                  3
                                </Badge>
                                {t(
                                  "pages.courierRegistration.securityVault.questionThree",
                                )}
                              </Label>
                              <Select
                                value={questions.q3}
                                onValueChange={(val) =>
                                  setQuestions({ ...questions, q3: val })
                                }
                              >
                                <SelectTrigger className="h-14 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white transition-all font-medium">
                                  <SelectValue placeholder="Select Question" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-gray-100 shadow-xl">
                                  {(
                                    tRaw(
                                      "pages.courierRegistration.questions.set3",
                                    ) as string[]
                                  ).map((q: string) => (
                                    <SelectItem
                                      key={q}
                                      value={q}
                                      className="rounded-xl my-1"
                                    >
                                      {q}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Input
                                type={showAnswers ? "text" : "password"}
                                placeholder={t(
                                  "pages.courierRegistration.securityVault.answerPlaceholder",
                                )}
                                value={questions.a3}
                                onChange={(e) =>
                                  setQuestions({
                                    ...questions,
                                    a3: e.target.value,
                                  })
                                }
                                className="h-14 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white transition-all font-bold tracking-widest px-6"
                              />
                            </div>
                          </div>

                          <AnimatePresence>
                            {message && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className={`p-4 rounded-2xl flex items-center gap-3 ${
                                  message.type === "success"
                                    ? "bg-green-50 text-green-700 border border-green-100"
                                    : "bg-red-50 text-red-700 border border-red-100"
                                }`}
                              >
                                {message.type === "success" ? (
                                  <CheckCircle2 size={18} />
                                ) : (
                                  <AlertCircle size={18} />
                                )}
                                <p className="text-sm font-bold">
                                  {message.text}
                                </p>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Button
                              onClick={handleDownloadPDF}
                              variant="outline"
                              className="h-16 rounded-2xl font-black text-lg border-gray-200 hover:border-primary transition-all active:scale-[0.98] gap-3"
                            >
                              <Download size={20} />
                              {t(
                                "pages.courierRegistration.securityVault.downloadPdf",
                              )}
                            </Button>

                            {user ? (
                              <Button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="h-16 rounded-2xl font-black text-lg shadow-xl shadow-primary/20 transition-all active:scale-[0.98] gap-3"
                              >
                                {isSaving ? (
                                  <Loader
                                    size="sm"
                                    text={t(
                                      "pages.courierRegistration.securityVault.savingBtn",
                                    )}
                                  />
                                ) : (
                                  <>
                                    <Save size={20} />
                                    {t(
                                      "pages.courierRegistration.securityVault.saveBtn",
                                    )}
                                  </>
                                )}
                              </Button>
                            ) : (
                              <Button
                                asChild
                                className="h-16 rounded-2xl font-black text-lg shadow-xl shadow-primary/20 transition-all active:scale-[0.98] gap-3"
                              >
                                <Link href="/login">
                                  {t(
                                    "pages.courierRegistration.securityVault.loginToSave",
                                  )}{" "}
                                  <ChevronRight size={20} />
                                </Link>
                              </Button>
                            )}
                          </div>

                          {!user && (
                            <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 flex items-start gap-3 mt-4">
                              <AlertCircle
                                className="text-orange-500 shrink-0 mt-0.5"
                                size={18}
                              />
                              <p className="text-xs text-orange-800 font-medium">
                                {t(
                                  "pages.courierRegistration.securityVault.notLoggedInWarning",
                                )}
                              </p>
                            </div>
                          )}
                        </>
                      )}
                    </CardContent>
                  </Card>

                  {/* Footer Info */}
                  {user && (
                    <div className="flex flex-col sm:flex-row items-center gap-4 px-6 sm:px-8 py-6 bg-slate-100/50 rounded-2xl sm:rounded-3xl border border-slate-200/50 text-center sm:text-left">
                      <div className="p-2 bg-white rounded-xl shadow-sm shrink-0">
                        <User className="text-slate-400" size={20} />
                      </div>
                      <div className="flex-1 flex flex-col items-center sm:items-start break-all">
                        <p className="text-xs font-bold text-slate-500 uppercase">
                          {t(
                            "pages.courierRegistration.securityVault.authenticatedUser",
                          )}
                        </p>
                        <p className="text-sm font-bold text-slate-800">
                          {user.email}
                        </p>
                      </div>
                      <ShieldCheck
                        className="text-green-500 shrink-0"
                        size={24}
                      />
                    </div>
                  )}
                </div>
              </motion.div>
            </TabsContent>
          </AnimatePresence>
        </Tabs>
      </div>
    </div>
  );
}
