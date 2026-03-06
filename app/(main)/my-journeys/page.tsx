"use client";

import { useCallback, useState, useEffect, useRef } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import {
  listUserJourneys,
  deleteJourneyProgress,
  deleteAllUserJourneys,
  JourneyProgressRecord,
} from "@/lib/journey/journeyProgressService";
import {
  Briefcase,
  Trash2,
  Loader2,
  ChevronRight,
  Plus,
  ArrowRight,
  Clock,
  Shield,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmationModal } from "@/app/components/shared/ConfirmationModal";
import { useLanguage } from "@/app/context/LanguageContext";

const JOURNEY_ROUTES: Record<string, string> = {
  ir1: "/visa-category/ir-category/ir1-journey",
  ir5: "/visa-category/ir-category/ir5-journey",
  k1: "/visa-category/ir-category/k1-journey",
};

export default function MyJourneysPage() {
  const { t } = useLanguage();
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [journeys, setJourneys] = useState<JourneyProgressRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);

  // Modal states
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteAllModalOpen, setDeleteAllModalOpen] = useState(false);
  const [selectedJourneyId, setSelectedJourneyId] = useState<string | null>(
    null,
  );
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const fetchJourneys = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);

    try {
      const data = await listUserJourneys(user.id);
      if (!isMounted.current) return;
      setJourneys(data);
      setHasFetched(true);
    } catch (error) {
      console.error("Error fetching journeys:", error);
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [user?.id]);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push("/login");
      return;
    }

    if (user.id && !hasFetched) {
      fetchJourneys();
    }
  }, [user?.id, authLoading, router, fetchJourneys, hasFetched, user]);

  const handleDelete = async (journeyId: string) => {
    setSelectedJourneyId(journeyId);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!user?.id || !selectedJourneyId) return;

    setDeletingId(selectedJourneyId);
    setDeleteModalOpen(false);
    try {
      const success = await deleteJourneyProgress(user.id, selectedJourneyId);
      if (success) {
        setJourneys((prev: JourneyProgressRecord[]) =>
          prev.filter((j) => j.journey_id !== selectedJourneyId),
        );
      }
    } catch (error) {
      console.error("Error deleting journey:", error);
    } finally {
      setDeletingId(null);
      setSelectedJourneyId(null);
    }
  };

  const handleDeleteAll = async () => {
    if (!user?.id || journeys.length === 0) return;
    setDeleteAllModalOpen(true);
  };

  const confirmDeleteAll = async () => {
    if (!user?.id) return;

    setDeletingId("all");
    setDeleteAllModalOpen(false);
    try {
      const success = await deleteAllUserJourneys(user.id);
      if (success) {
        setJourneys([]);
      }
    } catch (error) {
      console.error("Error deleting all journeys:", error);
    } finally {
      setDeletingId(null);
    }
  };

  // Auth loading state is still blocking to prevent layout shift for unauthenticated users
  if (authLoading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-muted-foreground font-medium animate-pulse">
          {t("myJourneys.loading")}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* Header Section */}
      <div className="bg-white border-b border-slate-200 pt-10 pb-12">
        <div className="container mx-auto px-6">
          <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-black uppercase tracking-widest border border-primary/20">
                  <Shield className="w-3 h-3" />{" "}
                  {t("myJourneys.header.badges.securePortal")}
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />{" "}
                  {t("myJourneys.header.badges.liveSync")}
                </div>
              </div>
              <h1 className="text-5xl font-black text-slate-900 tracking-tight leading-[1.1]">
                {t("myJourneys.header.title.main")} <br />
                <span className="text-primary bg-linear-to-r from-primary to-secondary bg-clip-text">
                  {t("myJourneys.header.title.highlight")}
                </span>
              </h1>
              <p className="text-slate-500 max-w-lg text-lg font-medium leading-relaxed">
                {t("myJourneys.header.description")}
              </p>
            </div>

            {(journeys.length > 0 || loading) && (
              <div className="flex items-center gap-3">
                {journeys.length > 0 && (
                  <Button
                    variant="outline"
                    className="text-red-500 border-red-100 hover:bg-red-50"
                    onClick={handleDeleteAll}
                    disabled={deletingId === "all"}
                  >
                    {deletingId === "all" ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4 mr-2" />
                    )}
                    {t("myJourneys.header.actions.deleteAll")}
                  </Button>
                )}
                <Button
                  onClick={() => router.push("/visa-category/ir-category")}
                  className="bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/20"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {t("myJourneys.header.actions.startNew")}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 mt-12">
        <div className="max-w-5xl mx-auto">
          {loading && journeys.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <Card
                  key={i}
                  className="overflow-hidden border-slate-200 shadow-sm animate-pulse"
                >
                  <CardContent className="p-8">
                    <div className="flex items-start gap-4 mb-6">
                      <div className="w-14 h-14 rounded-2xl bg-slate-100 shrink-0" />
                      <div className="flex-1 space-y-3">
                        <div className="h-6 bg-slate-100 rounded w-2/3" />
                        <div className="h-4 bg-slate-100 rounded w-full" />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <div className="h-4 bg-slate-100 rounded w-1/3" />
                        <div className="h-4 bg-slate-100 rounded w-8" />
                      </div>
                      <div className="h-2.5 bg-slate-100 rounded-full w-full" />
                    </div>
                    <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
                      <div className="w-32 h-10 bg-slate-100 rounded-full" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {journeys.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm"
                >
                  <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Briefcase className="w-10 h-10 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-3">
                    {t("myJourneys.emptyState.title")}
                  </h2>
                  <p className="text-slate-500 max-w-md mx-auto mb-8">
                    {t("myJourneys.emptyState.description")}
                  </p>
                  <Button
                    size="lg"
                    onClick={() => router.push("/visa-category/ir-category")}
                    className="bg-primary hover:bg-primary/90 text-white rounded-full px-8 py-6 text-lg font-bold shadow-lg shadow-primary/20"
                  >
                    {t("myJourneys.emptyState.button")}{" "}
                    <ChevronRight className="ml-2 w-5 h-5" />
                  </Button>
                </motion.div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {journeys.map((j) => {
                    const progress = Math.round(
                      (j.completed_steps.length / 42) * 100,
                    );
                    const journeyId = j.journey_id as "ir1" | "ir5" | "k1";
                    const isValidJourney = ["ir1", "ir5", "k1"].includes(
                      journeyId,
                    );
                    const journeyName = isValidJourney
                      ? t(`myJourneys.journeyNames.${journeyId}`)
                      : j.journey_id.toUpperCase();
                    const description = isValidJourney
                      ? t(`myJourneys.journeyDescriptions.${journeyId}`)
                      : t("myJourneys.journeyDescriptions.fallback");
                    const route = JOURNEY_ROUTES[j.journey_id] || "/";

                    return (
                      <motion.div
                        key={j.id}
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.2 }}
                        className="group"
                      >
                        <Card
                          className="overflow-hidden border-slate-200 hover:border-primary/50 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/5 cursor-pointer relative"
                          onClick={() => router.push(route)}
                        >
                          <div className="absolute top-0 right-0 p-4">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(j.journey_id);
                              }}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-all"
                              title={t("myJourneys.journeyCard.deleteTooltip")}
                              disabled={deletingId === j.journey_id}
                            >
                              {deletingId === j.journey_id ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                              ) : (
                                <Trash2 className="w-5 h-5" />
                              )}
                            </button>
                          </div>

                          <CardContent className="p-8">
                            <div className="flex items-start gap-4 mb-6">
                              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                <Briefcase className="w-7 h-7 text-primary" />
                              </div>
                              <div className="min-w-0">
                                <h3 className="text-xl font-bold text-slate-900 group-hover:text-primary transition-colors truncate pr-8">
                                  {journeyName}
                                </h3>
                                <p className="text-slate-500 text-sm line-clamp-1 italic mt-1 font-medium">
                                  {description}
                                </p>
                              </div>
                            </div>

                            <div className="space-y-4">
                              <div className="flex items-center justify-between text-sm font-bold">
                                <span className="text-slate-600 uppercase tracking-tighter flex items-center gap-1.5">
                                  <Clock className="w-3.5 h-3.5" />
                                  {t(
                                    "myJourneys.journeyCard.lastActivity",
                                  )}{" "}
                                  {new Date(
                                    j.last_updated_at,
                                  ).toLocaleDateString()}
                                </span>
                                <span className="text-primary">
                                  {progress}%
                                </span>
                              </div>

                              <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${progress}%` }}
                                  transition={{
                                    duration: 0.5,
                                    ease: "easeOut",
                                  }}
                                  className="h-full bg-linear-to-r from-primary via-primary to-rahvana-primary rounded-full relative"
                                >
                                  <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%)] bg-size-[40px_40px] animate-[slide_1s_linear_infinite]" />
                                </motion.div>
                              </div>
                            </div>

                            <div className="mt-8 flex items-center justify-between pt-6 border-t border-slate-100 gap-4">
                              <Button className="rounded-full bg-primary text-white shadow-lg shadow-primary/20 transition-all font-bold px-6 border-transparent hover:bg-primary/90">
                                {t("myJourneys.journeyCard.resumeBtn")}{" "}
                                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </AnimatePresence>
          )}
        </div>
      </div>

      <style jsx global>{`
        @keyframes slide {
          from {
            background-position: 0 0;
          }
          to {
            background-position: 40px 0;
          }
        }
      `}</style>

      {/* Confirmation Modals */}
      <ConfirmationModal
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        title={t("myJourneys.modals.deleteJourney.title")}
        description={t("myJourneys.modals.deleteJourney.description")}
        confirmText={t("myJourneys.modals.deleteJourney.confirmBtn")}
        onConfirm={confirmDelete}
      />

      <ConfirmationModal
        open={deleteAllModalOpen}
        onOpenChange={setDeleteAllModalOpen}
        title={t("myJourneys.modals.deleteAllJourneys.title")}
        description={t("myJourneys.modals.deleteAllJourneys.description", {
          count: journeys.length,
        })}
        confirmText={t("myJourneys.modals.deleteAllJourneys.confirmBtn")}
        onConfirm={confirmDeleteAll}
      />
    </div>
  );
}