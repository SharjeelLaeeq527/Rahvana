"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ShieldCheck,
  Eye,
  EyeOff,
  User,
  Lock,
  ArrowLeft,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";
import { motion } from "framer-motion";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/app/context/LanguageContext";

export default function SecurityQuestionsPreviewPage() {
  const { t } = useLanguage();
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [showAnswers, setShowAnswers] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<{
    portal_username: string;
    question_1: string;
    answer_1: string;
    question_2: string;
    answer_2: string;
    question_3: string;
    answer_3: string;
  } | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      setIsLoading(true);
      try {
        const response = await fetch(`/api/visa-security?userId=${user.id}`);
        const result = await response.json();
        if (result.data) {
          setData(result.data);
        }
      } catch (error) {
        console.error("Error fetching preview data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">
            {t("pages.courierRegistration.securityPreview.loadingSession")}
          </p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50/50 py-6 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6 sm:space-y-8">
        {/* Header Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="rounded-xl hover:bg-white font-bold gap-2 text-gray-500"
          >
            <ArrowLeft size={18} />{" "}
            {t("pages.courierRegistration.securityPreview.back")}
          </Button>
          <div className="flex items-center gap-2">
            <ShieldCheck className="text-green-500" size={20} />
            <span className="text-xs font-black uppercase tracking-tighter text-gray-400">
              {t("pages.courierRegistration.securityPreview.encryptedPreview")}
            </span>
          </div>
        </div>

        {/* Title Section */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900">
            {t("pages.courierRegistration.securityPreview.title.main")}{" "}
            <span className="text-primary">
              {t("pages.courierRegistration.securityPreview.title.highlight")}
            </span>
          </h1>
          <p className="text-sm sm:text-base text-gray-500 font-medium px-4">
            {t("pages.courierRegistration.securityPreview.subtitle")}
          </p>
        </div>

        {!data ? (
          <Card className="border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden text-center py-12">
            <CardContent className="space-y-6">
              <div className="flex justify-center">
                <div className="p-6 bg-orange-50 rounded-full border-4 border-white shadow-sm">
                  <ShieldAlert className="text-orange-400 w-12 h-12" />
                </div>
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-gray-900">
                  {t("pages.courierRegistration.securityPreview.noData.title")}
                </h2>
                <p className="text-gray-500 max-w-sm mx-auto">
                  {t(
                    "pages.courierRegistration.securityPreview.noData.description",
                  )}
                </p>
              </div>
              <Button
                onClick={() => router.push("/courier-registration")}
                className="rounded-2xl px-8 py-6 h-auto font-semibold"
              >
                {t("pages.courierRegistration.securityPreview.noData.button")}{" "}
                <ChevronRight size={18} />
              </Button>
            </CardContent>
          </Card>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 sm:space-y-6"
          >
            <Card className="border-none shadow-2xl shadow-primary/5 rounded-4xl sm:rounded-[2.5rem] bg-white overflow-hidden border border-gray-100">
              <CardHeader className="bg-slate-50/50 border-b border-gray-100 p-5 sm:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <CardTitle className="text-lg sm:text-xl font-black text-gray-900 flex items-center gap-2">
                      <Lock className="text-primary" size={20} />{" "}
                      {t(
                        "pages.courierRegistration.securityPreview.vault.title",
                      )}
                    </CardTitle>
                    <p className="text-[10px] sm:text-xs text-gray-400 font-bold uppercase tracking-wider">
                      {t(
                        "pages.courierRegistration.securityPreview.vault.verified",
                      )}{" "}
                      {user.email}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setShowAnswers(!showAnswers)}
                    className="rounded-2xl border-gray-200 hover:bg-white hover:border-primary transition-all font-bold gap-2 w-full sm:w-auto justify-center h-11"
                  >
                    {showAnswers ? <EyeOff size={16} /> : <Eye size={16} />}
                    {showAnswers
                      ? t(
                          "pages.courierRegistration.securityPreview.vault.mask",
                        )
                      : t(
                          "pages.courierRegistration.securityPreview.vault.reveal",
                        )}{" "}
                    {t("pages.courierRegistration.securityPreview.vault.data")}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-5 sm:p-8 space-y-8 sm:space-y-10">
                {/* Portal Username */}
                <div className="relative group">
                  <div className="absolute -inset-1 bg-linear-to-r from-primary/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative space-y-3">
                    <Label className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2 mb-1">
                      <User size={14} className="text-primary" />{" "}
                      {t(
                        "pages.courierRegistration.securityPreview.vault.username",
                      )}
                    </Label>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 font-mono text-base sm:text-lg font-bold text-gray-800 break-all">
                      {data?.portal_username ||
                        t(
                          "pages.courierRegistration.securityPreview.vault.notSet",
                        )}
                    </div>
                  </div>
                </div>

                <div className="grid gap-6 sm:gap-8">
                  {[
                    { q: data?.question_1, a: data?.answer_1, id: 1 },
                    { q: data?.question_2, a: data?.answer_2, id: 2 },
                    { q: data?.question_3, a: data?.answer_3, id: 3 },
                  ].map((item) => (
                    <div key={item.id} className="space-y-3 sm:space-y-4">
                      <div className="flex items-center gap-3">
                        <Badge className="h-6 w-6 rounded-full p-0 flex items-center justify-center bg-primary/10 text-primary border-none text-[10px] font-black">
                          {item.id}
                        </Badge>
                        <span className="text-[10px] sm:text-sm font-bold text-gray-500 uppercase tracking-widest">
                          {t(
                            "pages.courierRegistration.securityPreview.vault.questionLabel",
                          )}
                        </span>
                      </div>
                      <div className="space-y-3 pl-0 sm:pl-9">
                        <p className="text-gray-900 font-bold text-base sm:text-lg leading-tight">
                          {item.q ||
                            t(
                              "pages.courierRegistration.securityPreview.vault.noQuestion",
                            )}
                        </p>
                        <div className="p-4 bg-primary/2 rounded-2xl border border-primary/5 font-mono text-sm sm:text-base font-bold text-primary transition-all">
                          {showAnswers ? (
                            item.a || "---"
                          ) : (
                            <span className="tracking-[0.5em]">••••••••</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="bg-blue-50/50 border border-blue-100 rounded-3xl p-6 flex items-start gap-4">
              <div className="p-2 bg-blue-100 rounded-xl">
                <ShieldCheck className="text-blue-600" size={20} />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-blue-900">
                  {t("pages.courierRegistration.securityPreview.notice.title")}
                </p>
                <p className="text-xs text-blue-700 font-medium leading-relaxed">
                  {t(
                    "pages.courierRegistration.securityPreview.notice.description",
                  )}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
