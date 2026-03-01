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

const SECURITY_QUESTIONS_1 = [
  "What is your mother's maiden name?",
  "What was the name of your first/current/favorite pet?",
  "What was your first car?",
  "What elementary school did you attend?",
  "What is the name of the town/city where you were born?",
];

const SECURITY_QUESTIONS_2 = [
  "What is the name of the road/street you grew up on?",
  "What is your least favorite food?",
  "What was the first company that you worked for?",
  "What is your favorite food?",
  "What high school did you attend?",
];

const SECURITY_QUESTIONS_3 = [
  "Where did you meet your spouse?",
  "What is your sibling's middle name?",
  "Who was your childhood hero?",
  "In what city or town was your first job?",
  "What is the name of a college you applied to but didn't attend?",
];

export default function CourierRegistrationPage() {
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
        text: "Please log in to save security questions.",
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
        text: "Please fill all security questions and answers.",
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
          text: "Security questions saved successfully!",
        });
      } else {
        setMessage({
          type: "error",
          text: result.error || "Failed to save questions.",
        });
      }
    } catch (error) {
      setMessage({ type: "error", text: "An unexpected error occurred." });
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
    doc.text("Rahvana", 20, 25);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("US Visa Portal Security Information", 20, 32);

    // Content Section
    doc.setTextColor(31, 41, 55);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Portal Credentials", 20, 55);

    doc.setDrawColor(229, 231, 235);
    doc.line(20, 58, 190, 58);

    doc.setFont("helvetica", "normal");
    doc.text("Portal Username:", 20, 70);
    doc.setFont("helvetica", "bold");
    doc.text(portalUsername || "Not provided", 60, 70);

    doc.setFont("helvetica", "bold");
    doc.text("Security Questions", 20, 90);
    doc.line(20, 93, 190, 93);

    const questionsList = [
      { q: questions.q1, a: questions.a1, label: "Question 1" },
      { q: questions.q2, a: questions.a2, label: "Question 2" },
      { q: questions.q3, a: questions.a3, label: "Question 3" },
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
      doc.text("Answer:", 20, currentY);
      doc.setFont("helvetica", "normal");
      doc.text(item.a || "Not provided", 40, currentY);

      currentY += 15;
    });

    // Footer
    doc.setDrawColor(229, 231, 235);
    doc.line(20, 270, 190, 270);
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175);
    doc.text(`Generated on: ${timestamp}`, 20, 278);
    doc.text("Rahvana - Your US Visa Journey Companion", 190, 278, {
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
              US Visa <span className="text-primary">Scheduling Portal</span>
            </h1>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto font-medium">
              Complete registration guide and secure security questions
              management for your US Visa appointment.
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
                <Info size={16} /> Registration Guide
              </TabsTrigger>
              <TabsTrigger
                value="security"
                onClick={() => fetchUserQuestions()}
                className="w-full sm:w-auto px-6 sm:px-8 py-3 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white transition-all text-sm font-bold gap-2"
              >
                <Lock size={16} /> Security Information
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
                        title: "1. Signup & Login",
                      },
                      { id: 2, title: "2. Profile" },
                      {
                        id: 3,
                        title: "3. Application",
                      },
                      {
                        id: 4,
                        title: "4. Group Request",
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
                              <UserPlus className="text-primary" /> Signup
                              Process Guide
                            </>
                          ) : guideStage === 2 ? (
                            <>
                              <User className="text-primary" /> Profile Setup
                              Guide
                            </>
                          ) : guideStage === 3 ? (
                            <>
                              <ExternalLink className="text-primary" /> Visa
                              Application Guide
                            </>
                          ) : (
                            <>
                              <UserPlus className="text-primary" /> Group
                              Request Guide
                            </>
                          )}
                        </CardTitle>
                        <CardDescription>
                          {guideStage === 1
                            ? "Follow these steps to create and access your account."
                            : guideStage === 2
                              ? "Complete your personal profile and preferences."
                              : guideStage === 3
                                ? "Follow these steps to start and fill your visa application."
                                : "Detailed instructions for creating a group visa request."}
                        </CardDescription>
                      </div>
                      {(guideStage === 1 || guideStage === 3) && (
                        <a
                          href="https://www.usvisascheduling.com/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-sm font-bold text-primary hover:underline group w-fit"
                        >
                          Visit Portal{" "}
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
                            title="1. Initiate Signup"
                            description="Navigate to the portal and click the 'Sign up now' link at the bottom of the login panel."
                          >
                            <a
                              href="https://www.usvisascheduling.com/"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-sm font-bold text-primary hover:underline group w-fit"
                            >
                              Visit Portal{" "}
                              <ExternalLink
                                size={14}
                                className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
                              />
                            </a>
                          </GuideStep>
                          <GuideStep
                            title="2. Account Details"
                            description="Provide a unique username and a strong password (at least 8 characters, include letters, numbers, and symbols)."
                            badge="Mandatory"
                          />
                          <GuideStep
                            title="3. Email Verification"
                            description="Enter your email address and click 'Send Verification Code'."
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
                            title="4. Personal Information"
                            description="Input your legal Given Name and Surname as they appear on your passport."
                          />
                          <GuideStep
                            title="5. Security Questions"
                            description=""
                            badge="Critical"
                          >
                            <p className="text-gray-600 text-sm leading-relaxed">
                              Select three distinct security questions from the
                              dropdowns and provide answers. You MUST remember
                              these for future logins. We are providing facility
                              to remember your security questions.{" "}
                              <button
                                onClick={() => {
                                  setActiveTab("security");
                                  fetchUserQuestions();
                                }}
                                className="text-primary font-bold hover:underline cursor-pointer inline-flex items-center gap-1"
                              >
                                Go to Security Questions tab
                              </button>{" "}
                              to view and save your security questions.
                            </p>
                          </GuideStep>
                          <GuideStep
                            title="6. Finalize Signup"
                            description="Review all fields and click 'Create'. Solve the visual captcha if prompted to complete the registration."
                          />
                          <GuideStep
                            title="7. Now Login to your account"
                            description="Now login to your account using your username and password. Captcha will be required for login."
                          />
                          <GuideStep
                            title="8. User Details & Security Questions"
                            description="Fill in your profile details and set up your security layer."
                            badge="Required"
                          >
                            <div className="space-y-2 text-sm text-gray-600">
                              <p>
                                • <strong>Username:</strong> Your pre-filled
                                username will appear here otherwise fill your
                                username.
                              </p>
                              <p>
                                • <strong>Security Question 1:</strong> Answer
                                to the security question 1. <br /> If you do not
                                remember your security questions then go to{" "}
                                <button
                                  onClick={() => {
                                    setActiveTab("security");
                                    fetchUserQuestions();
                                  }}
                                  className="text-primary font-bold hover:underline cursor-pointer inline-flex items-center gap-1"
                                >
                                  Security Questions tab
                                </button>{" "}
                                and view your security questions.
                              </p>
                              <p>
                                • <strong>Security Question 2:</strong> Answer
                                to the security question 2.
                              </p>
                              <p>Click on Continue button to proceed.</p>
                            </div>
                          </GuideStep>
                          <GuideStep
                            title="9. Agree & Continue"
                            description="Read and agree to the terms and conditions and click on Continue button to proceed."
                          />
                        </>
                      )}

                      {guideStage === 2 && (
                        <>
                          <GuideStep
                            title="1. Passport Name Match"
                            description="Verify that your First Name and Last Name match your passport. These fields are locked once you move forward."
                            badge="Important"
                          />
                          <GuideStep
                            title="2. Contact Details"
                            description="Enter your 'Contact Email' where you wish to receive updates. Your 'Primary Email' is pre-filled from your registration."
                          />
                          <GuideStep
                            title="3. Language and Location"
                            description="Choose your 'Preferred Language' and the 'Country' you are applying from using the dropdown menus."
                          />
                          <GuideStep
                            title="4. Submit Profile"
                            description="Click the 'Submit' button to save your profile information."
                          />
                        </>
                      )}

                      {guideStage === 3 && (
                        <>
                          <GuideStep
                            title="1. Start Application"
                            description="Now you will see a screen; click the 'Start Application' button located at the top left to begin your visa process."
                          />
                          <GuideStep
                            title="2. Applicant Details"
                            description="Review and complete the following mandatory fields:"
                          >
                            <ul className="space-y-2 text-sm text-gray-600 ml-4 list-disc">
                              <li>
                                <strong>
                                  Country from which you are applying:
                                </strong>{" "}
                                Confirm your current location.
                              </li>
                              <li>
                                <strong>First Name & Last Name:</strong> Must
                                exactly match your passport.
                              </li>
                              <li>
                                <strong>Country of Birth:</strong> Select your
                                birth country from the dropdown.
                              </li>
                            </ul>
                          </GuideStep>
                          <GuideStep
                            title="3. Contact Information"
                            description="Provide accurate contact details for visa correspondence:"
                          >
                            <ul className="space-y-2 text-sm text-gray-600 ml-4 list-disc">
                              <li>
                                <strong>Home & Mobile Phone:</strong> Enter your
                                numbers without the country code.
                              </li>
                              <li>
                                <strong>Email:</strong> Verify the email address
                                is correct for receiving alerts.
                              </li>
                            </ul>
                          </GuideStep>
                          <GuideStep
                            title="4. Mailing Address"
                            description="Enter your current residential or mailing address (Street, City, State/Province, and Zip Code)."
                          />
                          <GuideStep
                            title="5. Passport Details"
                            description="Enter your document information with extreme care:"
                          >
                            <ul className="space-y-2 text-sm text-gray-600 ml-4 list-disc">
                              <li>
                                <strong>Passport Number:</strong> Enter the
                                number exactly as it appears.
                              </li>
                              <li>
                                <strong>Issuance & Expiration Dates:</strong>{" "}
                                Use the MM/DD/YYYY format.
                              </li>
                              <li>
                                <strong>Place of Issue & Nationality:</strong>{" "}
                                Select according to your document.
                              </li>
                            </ul>
                          </GuideStep>
                          <GuideStep
                            title="6. Finalizing Application"
                            description="Complete the last few fields and submit:"
                          >
                            <div className="space-y-2 text-sm text-gray-600">
                              <p>
                                • <strong>National ID:</strong> Enter your
                                National ID number (Citizenship ID) exactly as
                                it appears on your identity document.
                              </p>
                              <p>
                                • Review all the information carefully to ensure
                                there are no errors.
                              </p>
                              <p>
                                • Finally, click the{" "}
                                <strong>&apos;Submit&apos;</strong> button to
                                proceed with your application.
                              </p>
                            </div>
                          </GuideStep>
                        </>
                      )}

                      {guideStage === 4 && (
                        <>
                          <GuideStep
                            title="1. Initiate Group Request"
                            description="Identify the 'Create Group Request' option in the sidebar navigation and click it to begin."
                          />
                          <GuideStep
                            title="2. Group Information"
                            description="Provide general details about your travel group:"
                          >
                            <ul className="space-y-2 text-sm text-gray-600 ml-4 list-disc">
                              <li>
                                <strong>Group Name:</strong> Enter a unique name
                                for your group.
                              </li>
                              <li>
                                <strong>Date of Travel:</strong> Use the
                                calendar or type in MM/DD/YYYY format.
                              </li>
                              <li>
                                <strong>Reason for Travel:</strong> Briefly
                                explain the purpose of the group trip.
                              </li>
                            </ul>
                          </GuideStep>
                          <GuideStep
                            title="3. Contact Details"
                            description="Enter both Local and U.S. based contact information:"
                          >
                            <ul className="space-y-2 text-sm text-gray-600 ml-4 list-disc">
                              <li>
                                <strong>Local Contact:</strong> Full Name and
                                Phone number.
                              </li>
                              <li>
                                <strong>U.S. Contact:</strong> Name, Email, and
                                Phone number.
                              </li>
                              <li>
                                <strong>Complete U.S. Street Address:</strong>{" "}
                                Where the group will be staying.
                              </li>
                            </ul>
                          </GuideStep>
                          <GuideStep
                            title="4. Embassy & Submission"
                            description="Finalize your group request:"
                          >
                            <ul className="space-y-2 text-sm text-gray-600 ml-4 list-disc">
                              <li>
                                <strong>Embassy/Consulate/OFC:</strong> Select
                                the relevant office from the dropdown.
                              </li>
                              <li>
                                <strong>Attach a file:</strong> Upload any
                                required supporting documents.
                              </li>
                              <li>
                                <strong>Submit:</strong> Click the{" "}
                                <strong>&apos;Next&apos;</strong> button to
                                proceed with the request.
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
                            Security Vault
                          </CardTitle>
                          <p className="text-xs sm:text-sm text-gray-500 font-medium">
                            Store your portal security questions for future
                            logins.
                          </p>
                        </div>
                        <div className="flex items-center justify-center sm:justify-end gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => fetchUserQuestions()}
                            disabled={isLoading}
                            className="rounded-xl border-gray-200 hover:bg-white hover:border-primary transition-all font-bold"
                            title="Refresh Questions"
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
                            {showAnswers ? "Hide" : "Show"} Answers
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-8 space-y-6 sm:space-y-8">
                      {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-12 space-y-4">
                          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                          <p className="text-sm font-bold text-gray-400">
                            Loading your questions...
                          </p>
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
                                Portal Username
                              </Label>
                              <Input
                                type="text"
                                placeholder="Enter your Portal Username"
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
                                Security Question One
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
                                  {SECURITY_QUESTIONS_1.map((q) => (
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
                                placeholder="Enter your answer"
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
                                Security Question Two
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
                                  {SECURITY_QUESTIONS_2.map((q) => (
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
                                placeholder="Enter your answer"
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
                                Security Question Three
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
                                  {SECURITY_QUESTIONS_3.map((q) => (
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
                                placeholder="Enter your answer"
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
                              Download PDF
                            </Button>

                            {user ? (
                              <Button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="h-16 rounded-2xl font-black text-lg shadow-xl shadow-primary/20 transition-all active:scale-[0.98] gap-3"
                              >
                                {isSaving ? (
                                  <div className="w-5 h-5 border-3 border-white/20 border-t-white rounded-full animate-spin" />
                                ) : (
                                  <Save size={20} />
                                )}
                                {isSaving
                                  ? "Saving Responses..."
                                  : "Save Securely"}
                              </Button>
                            ) : (
                              <Button
                                asChild
                                className="h-16 rounded-2xl font-black text-lg shadow-xl shadow-primary/20 transition-all active:scale-[0.98] gap-3"
                              >
                                <Link href="/login">
                                  Login to Save <ChevronRight size={20} />
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
                                You are currently not logged in. You can still
                                download your information as a PDF, but it will
                                not be saved in our secure database.
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
                          Authenticated User
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
