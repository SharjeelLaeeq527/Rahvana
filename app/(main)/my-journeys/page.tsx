"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Plus,
  Route,
  Users,
  Camera,
  Pencil,
  Check,
  X,
  Loader2,
  MoreVertical,
} from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import { useCandidate } from "@/app/context/CandidateContext";
import { useUserProfile } from "@/app/context/UserProfileContext";
import { useToast } from "@/app/components/shared/ToastProvider";
import { JourneyProgressRecord, listUserJourneys } from "@/lib/journey/journeyProgressService";
import { getCandidateJourneyKey, getBaseVisaCategory } from "@/lib/candidate/candidateSyncService";
import { getJourneyHrefByType, ir1journeyHref, ir5journeyHref } from "@/lib/constants/routes";
import { IR5_ENABLED } from "@/lib/feature-flags";
import { Loader } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { JourneyPlanBadge } from "@/app/components/shared/JourneyPlanBadge";
import { CandidateProfileLauncherModal } from "./components/CandidateProfileLauncherModal";
import { uploadJourneyImage } from "@/lib/journey/imageUploadHelper";

const JOURNEY_ALIASES: Record<string, string> = {
  "ir-1": "ir1",
  "ir1-spouse": "ir1",
  "ir1-spouse-visa": "ir1",
  "ir-1-spouse": "ir1",
  "ir-1-spouse-visa": "ir1",
  "ir-5": "ir5",
};

const normalizeJourneyId = (id: string): string => {
  const base = id
    .toLowerCase()
    .replace(/-journey$/, "")
    .trim();
  return JOURNEY_ALIASES[base] ?? base;
};

interface JourneyMeta {
  name: string;
  description: string;
  route: string;
  image: string;
  code: string;
}

const JOURNEY_META: Record<string, JourneyMeta> = {
  ir1: {
    name: "IR-1 Spouse Visa",
    description: "A guided immigration journey for the spouse of a U.S. citizen.",
    route: ir1journeyHref,
    image: "/assets/images/ir1-doc-vault-image.jpg",
    code: "IR-1",
  },
  ir5: {
    name: "IR-5 Parents Visa",
    description: "A guided immigration journey for parents of U.S. citizens.",
    route: ir5journeyHref,
    image: "/assets/images/ir5-doc-vault-image.png",
    code: "IR-5",
  },
};

const resolveJourneyMeta = (rawId: string): JourneyMeta & { canonicalId: string } => {
  const canonical = normalizeJourneyId(rawId);
  const baseVisa = getBaseVisaCategory(rawId);
  const baseCanonical = baseVisa === "IR-5" ? "ir5" : baseVisa === "IR-1" ? "ir1" : canonical;

  const meta = JOURNEY_META[baseCanonical] || JOURNEY_META[canonical];

  if (meta) {
    return {
      ...meta,
      canonicalId: baseCanonical,
    };
  }

  const prettyName = canonical
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

  return {
    name: prettyName,
    description: "A personalised workspace to guide you through your immigration process.",
    route: getJourneyHrefByType(canonical),
    image: "/assets/images/hero-journey.jpg",
    code: canonical.toUpperCase(),
    canonicalId: canonical,
  };
};

const clampProgress = (value: number) => Math.max(0, Math.min(100, value));

const getProgressPercent = (journey: JourneyProgressRecord) => {
  const completed = journey.completed_steps_count ?? journey.completed_steps?.length ?? 0;

  const total =
    journey.total_steps_count && journey.total_steps_count > 0
      ? journey.total_steps_count
      : Math.max(completed * 2, 1);

  return clampProgress(Math.round((completed / total) * 100));
};

const getCompletedSteps = (journey: JourneyProgressRecord) =>
  journey.completed_steps_count ?? journey.completed_steps?.length ?? 0;

const getTotalSteps = (journey: JourneyProgressRecord) => {
  const completed = getCompletedSteps(journey);

  return journey.total_steps_count && journey.total_steps_count > 0
    ? journey.total_steps_count
    : Math.max(completed * 2, 1);
};

const getActivityLabel = (journey: JourneyProgressRecord) => {
  const rawTimestamp = journey.last_updated_at || journey.updated_at || journey.started_at;

  if (!rawTimestamp) {
    return "Recently";
  }

  const date = new Date(rawTimestamp);

  if (Number.isNaN(date.getTime())) {
    return "Recently";
  }

  const diffMs = Math.max(0, Date.now() - date.getTime());
  const diffMinutes = Math.max(1, Math.round(diffMs / 60_000));

  if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes === 1 ? "" : "s"} ago`;
  }

  const diffHours = Math.round(diffMinutes / 60);

  if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  }

  const diffDays = Math.round(diffHours / 24);

  if (diffDays < 30) {
    return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
  }

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const getJourneyStatus = (journey: JourneyProgressRecord, progress: number) => {
  if (progress >= 100) {
    return {
      label: "Completed",
      className: "border-emerald-300/40 bg-emerald-500/90 text-white",
      dotClassName: "bg-emerald-200",
    };
  }

  if (!journey.started || progress === 0) {
    return {
      label: "Draft",
      className: "border-white/25 bg-slate-900/55 text-white backdrop-blur-md",
      dotClassName: "bg-slate-300",
    };
  }

  const rawUpdatedAt = journey.last_updated_at || journey.updated_at || journey.started_at;

  const updatedAt = rawUpdatedAt ? new Date(rawUpdatedAt).getTime() : Number.NaN;

  const isPaused = Number.isFinite(updatedAt) && Date.now() - updatedAt > 1000 * 60 * 60 * 24 * 10;

  if (isPaused) {
    return {
      label: "Paused",
      className: "border-amber-300/40 bg-amber-500/90 text-white",
      dotClassName: "bg-amber-200",
    };
  }

  return {
    label: "Active",
    className: "border-[#5ce8d4]/30 bg-[#0d7377]/90 text-white",
    dotClassName: "bg-[#70f1dd]",
  };
};

export default function MyJourneysPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { profile, updateProfile } = useUserProfile();
  const { showToast } = useToast();
  const router = useRouter();
  const { candidates, setActiveCandidateId, activeCandidateId, activeCandidate, isMultiCandidate } =
    useCandidate();

  const [journeys, setJourneys] = useState<JourneyProgressRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasFetched, setHasFetched] = useState(false);

  const handleUpdateJourneyName = useCallback(
    async (canonicalKey: string, newName: string) => {
      const existing = profile?.journeyCustomizations || {};
      const updated = {
        ...existing,
        [canonicalKey]: {
          ...existing[canonicalKey],
          name: newName,
          updatedAt: new Date().toISOString(),
        },
      };
      updateProfile({ journeyCustomizations: updated }, { immediate: true });
      showToast("Journey name updated!", "success");
    },
    [profile?.journeyCustomizations, updateProfile, showToast]
  );

  const handleUpdateJourneyImage = useCallback(
    async (canonicalKey: string, file: File) => {
      try {
        const { url } = await uploadJourneyImage(file, "journey", canonicalKey);
        if (url) {
          const existing = profile?.journeyCustomizations || {};
          const updated = {
            ...existing,
            [canonicalKey]: {
              ...existing[canonicalKey],
              image: url,
              updatedAt: new Date().toISOString(),
            },
          };
          updateProfile({ journeyCustomizations: updated }, { immediate: true });
          showToast("Journey cover photo updated!", "success");
        }
      } catch (err) {
        console.error("Failed to upload journey image:", err);
        showToast("Failed to upload image. Please try again.", "error");
      }
    },
    [profile?.journeyCustomizations, updateProfile, showToast]
  );

  const [launcherModal, setLauncherModal] = useState<{
    isOpen: boolean;
    journeyCode: string;
    journeyName: string;
    journeyRoute: string;
  }>({
    isOpen: false,
    journeyCode: "IR-5",
    journeyName: "IR-5 Parents Visa",
    journeyRoute: ir5journeyHref,
  });

  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;

    return () => {
      isMounted.current = false;
    };
  }, []);

  const fetchJourneys = useCallback(async () => {
    if (!user?.id) {
      return;
    }

    setLoading(true);

    try {
      const data = await listUserJourneys(user.id);

      if (!isMounted.current) {
        return;
      }

      setJourneys(data || []);
    } catch (error) {
      console.error("Error fetching journeys:", error);

      if (isMounted.current) {
        showToast("Unable to load your journeys right now.", "error");
      }
    } finally {
      if (isMounted.current) {
        setHasFetched(true);
        setLoading(false);
      }
    }
  }, [user?.id, showToast]);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      const redirectPath = `${window.location.pathname}${window.location.search}`;

      router.replace(`/login?redirectTo=${encodeURIComponent(redirectPath)}`);

      return;
    }

    if (user.id && !hasFetched) {
      fetchJourneys();
    }
  }, [user, user?.id, authLoading, router, fetchJourneys, hasFetched]);

  const visibleJourneys = useMemo(() => {
    const result: Array<{
      id: string;
      journey?: JourneyProgressRecord;
      progress: number;
      completedSteps: number;
      totalSteps: number;
      meta: JourneyMeta & {
        canonicalId: string;
        candidateId?: string;
        candidateBadge?: string;
        candidateRelation?: string;
        isCurrentActive?: boolean;
      };
      status: {
        label: string;
        className: string;
        dotClassName: string;
      };
      subscriptionTier: string;
      activity: string;
    }> = [];

    // Track processed canonical category IDs to guarantee each visa category gets exactly 1 parent card
    const processedCanonicals = new Set<string>();

    // ── 1. Handle Multi-Candidate Visas (IR-5) as ONE Parent Card ─────────────
    if (IR5_ENABLED) {
      const ir5Candidates = candidates.filter((c) => {
        const cat = getBaseVisaCategory(c.visaCategory || "IR-5");
        return cat === "IR-5";
      });

      const ir5DbJourneys = journeys.filter((j) => {
        const cat = getBaseVisaCategory(j.journey_id);
        return cat === "IR-5";
      });

      // User has IR-5 if they have IR-5 candidates, IR-5 DB journeys, or profile has IR-5
      const profileVisa = profile?.visaType || profile?.visaCategory;
      const hasIr5 =
        ir5Candidates.length > 0 ||
        ir5DbJourneys.length > 0 ||
        getBaseVisaCategory(profileVisa) === "IR-5";

      if (hasIr5) {
        processedCanonicals.add("ir5");

        // Find active candidate's journey or the most progressed IR-5 journey
        const activeIr5Cand = ir5Candidates.find((c) => c.id === activeCandidateId);
        const activeIr5Key = activeIr5Cand
          ? getCandidateJourneyKey("IR-5", activeIr5Cand.id).toLowerCase().replace(/[^a-z0-9]/g, "")
          : null;

        const activeDbJourney =
          (activeIr5Key &&
            ir5DbJourneys.find(
              (j) => (j.journey_id || "").toLowerCase().replace(/[^a-z0-9]/g, "") === activeIr5Key
            )) ||
          ir5DbJourneys[0];

        const progress = activeDbJourney ? getProgressPercent(activeDbJourney) : 0;
        const completedSteps = activeDbJourney ? getCompletedSteps(activeDbJourney) : 0;
        const totalSteps = activeDbJourney ? getTotalSteps(activeDbJourney) : 28;
        const status = activeDbJourney
          ? getJourneyStatus(activeDbJourney, progress)
          : {
              label: "Draft",
              className: "border-white/25 bg-slate-900/55 text-white backdrop-blur-md",
              dotClassName: "bg-slate-300",
            };

        const meta = resolveJourneyMeta("IR-5");
        const ir5Custom = profile?.journeyCustomizations?.["ir5"];
        const defaultCandName =
          activeIr5Cand?.customName || activeIr5Cand?.fullName || activeIr5Cand?.label || "Candidate";
        const customName = ir5Custom?.name || defaultCandName;
        const customImage = ir5Custom?.image || activeIr5Cand?.avatarUrl || meta.image;

        // Determine highest tier among IR-5 candidates/journeys
        const tierHierarchy: Record<string, number> = {
          executive: 3,
          premium: 2,
          basic: 1,
          free: 0,
        };
        let highestTier = "free";
        for (const c of ir5Candidates) {
          const t = (c.tier || "free").toLowerCase();
          if ((tierHierarchy[t] ?? 0) > (tierHierarchy[highestTier] ?? 0)) highestTier = t;
        }
        for (const j of ir5DbJourneys) {
          const t = (j.subscription_tier || "free").toLowerCase();
          if ((tierHierarchy[t] ?? 0) > (tierHierarchy[highestTier] ?? 0)) highestTier = t;
        }

        const isIr5Active =
          activeCandidate && getBaseVisaCategory(activeCandidate.visaCategory || "IR-5") === "IR-5";

        result.push({
          id: activeDbJourney?.id || "parent_ir5_journey",
          journey: activeDbJourney,
          progress,
          completedSteps,
          totalSteps,
          meta: {
            ...meta,
            name: customName,
            image: customImage,
            isCurrentActive: Boolean(isIr5Active),
          },
          status,
          subscriptionTier: highestTier,
          activity: activeDbJourney ? getActivityLabel(activeDbJourney) : "Not started",
        });
      }
    }

    // ── 2. Handle DB-backed Journeys (IR-1, F-1, etc.) ─────────────────────────
    journeys.forEach((j) => {
      const canonical = normalizeJourneyId(j.journey_id);
      const baseCategory = getBaseVisaCategory(j.journey_id);
      const canonicalKey =
        baseCategory === "IR-5" ? "ir5" : baseCategory === "IR-1" ? "ir1" : canonical;

      // Skip if already processed (e.g. IR-5 handled above)
      if (processedCanonicals.has(canonicalKey)) return;
      if (!IR5_ENABLED && canonicalKey === "ir5") return;

      processedCanonicals.add(canonicalKey);

      const progress = getProgressPercent(j);
      const completedSteps = getCompletedSteps(j);
      const totalSteps = getTotalSteps(j);
      const meta = resolveJourneyMeta(j.journey_id);
      const jCustom =
        profile?.journeyCustomizations?.[canonicalKey] ||
        profile?.journeyCustomizations?.[canonical] ||
        profile?.journeyCustomizations?.[j.journey_id];
      const defaultCand =
        activeCandidate && getBaseVisaCategory(activeCandidate.visaCategory) === baseCategory
          ? activeCandidate
          : null;
      const defaultCandName =
        defaultCand?.customName || defaultCand?.fullName || defaultCand?.label || meta.name;
      const customName = jCustom?.name || defaultCandName;
      const customImage = jCustom?.image || defaultCand?.avatarUrl || meta.image;
      const status = getJourneyStatus(j, progress);

      const isCurrentActive =
        baseCategory === "IR-1"
          ? activeCandidate && getBaseVisaCategory(activeCandidate.visaCategory) === "IR-1"
          : true;

      result.push({
        id: j.id,
        journey: j,
        progress,
        completedSteps,
        totalSteps,
        meta: {
          ...meta,
          name: customName,
          image: customImage,
          isCurrentActive: Boolean(isCurrentActive),
        },
        status,
        subscriptionTier: j.subscription_tier || "free",
        activity: getActivityLabel(j),
      });
    });

    // ── 3. Fallback for Profile-declared Visa if no DB journey exists yet ───────
    const profileVisa = profile?.visaType || profile?.visaCategory;
    if (profileVisa) {
      const baseCategory = getBaseVisaCategory(profileVisa);
      const canonicalKey =
        baseCategory === "IR-5"
          ? "ir5"
          : baseCategory === "IR-1"
          ? "ir1"
          : profileVisa.toLowerCase();

      if (!processedCanonicals.has(canonicalKey)) {
        if (IR5_ENABLED || canonicalKey !== "ir5") {
          processedCanonicals.add(canonicalKey);
          const meta = resolveJourneyMeta(profileVisa);
          const fbCustom =
            profile?.journeyCustomizations?.[canonicalKey] ||
            profile?.journeyCustomizations?.[profileVisa.toLowerCase()];
          const defaultCand =
            activeCandidate && getBaseVisaCategory(activeCandidate.visaCategory) === baseCategory
              ? activeCandidate
              : null;
          const defaultCandName =
            defaultCand?.customName || defaultCand?.fullName || defaultCand?.label || meta.name;
          const customName = fbCustom?.name || defaultCandName;
          const customImage = fbCustom?.image || defaultCand?.avatarUrl || meta.image;

          result.push({
            id: `profile_${canonicalKey}`,
            progress: 0,
            completedSteps: 0,
            totalSteps: canonicalKey === "ir1" ? 29 : 10,
            meta: {
              ...meta,
              name: customName,
              image: customImage,
              isCurrentActive: false,
            },
            status: {
              label: "Draft",
              className: "border-white/25 bg-slate-900/55 text-white backdrop-blur-md",
              dotClassName: "bg-slate-300",
            },
            subscriptionTier: profile?.subscriptionTier || "free",
            activity: "Not started",
          });
        }
      }
    }

    return result;
  }, [
    candidates,
    journeys,
    activeCandidateId,
    activeCandidate,
    profile?.visaType,
    profile?.visaCategory,
    profile?.subscriptionTier,
    profile?.journeyCustomizations,
  ]);

  const startNewJourney = () => {
    router.push("/visa-category");
  };

  const handleOpenJourney = (meta: JourneyMeta & { canonicalId: string }) => {
    const isMultiCandidateCategory =
      meta.canonicalId === "ir5" ||
      meta.code.toUpperCase().includes("IR-5") ||
      meta.code.toUpperCase().includes("IR5");

    if (isMultiCandidateCategory) {
      setLauncherModal({
        isOpen: true,
        journeyCode: meta.code,
        journeyName: meta.name,
        journeyRoute: meta.route,
      });
      return;
    }

    router.push(meta.route);
  };

  if (authLoading) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center bg-[#f7fbfb]">
        <Loader size="md" />
      </div>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f7fbfb]">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="grid-bg absolute inset-0" />

        <div className="absolute -top-52 -left-44 h-[520px] w-[520px] rounded-full bg-[#14a0a6]/10 blur-[130px]" />

        <div className="absolute top-36 -right-52 h-[560px] w-[560px] rounded-full bg-[#32e0c4]/10 blur-[150px]" />

        <div className="absolute bottom-0 left-1/3 h-[400px] w-[400px] rounded-full bg-[#0d7377]/5 blur-[130px]" />

        <div className="absolute inset-x-0 top-0 h-40 bg-linear-to-b from-white/80 to-transparent" />
      </div>

      <div className="relative z-10">
        {/* Page header */}
        <section className="site-main-px pt-12 md:pt-16 lg:pt-20">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
              <div className="max-w-3xl">
                <div className="mt-6 mb-4 flex items-center gap-2 text-sm font-semibold text-[#0d7377] md:mt-3 lg:mt-0">
                  <span className="h-2 w-2 rounded-full bg-[#32e0c4] shadow-[0_0_0_5px_rgba(50,224,196,0.14)]" />
                  Your immigration dashboard
                </div>

                <h1 className="text-4xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl lg:text-[3.6rem] lg:leading-[1.05]">
                  My Immigration
                  <span className="block bg-linear-to-r from-[#0a5a5d] via-[#0d7377] to-[#14a0a6] bg-clip-text text-transparent">
                    Journeys
                  </span>
                </h1>

                <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 md:text-lg md:leading-8">
                  Continue your active applications, review your progress and manage every
                  immigration journey from one secure workspace.
                </p>
              </div>

              <Button
                onClick={startNewJourney}
                className="group h-12 w-fit rounded-full border border-[#0d7377]/10 bg-[#0d7377] px-6 font-semibold text-white shadow-[0_12px_30px_rgba(13,115,119,0.22)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#0a5a5d] hover:shadow-[0_16px_38px_rgba(13,115,119,0.3)]"
              >
                <Plus className="mr-2 h-4 w-4 transition-transform duration-300 group-hover:rotate-90" />
                Start New Journey
              </Button>
            </div>

            <div className="mt-10 h-px bg-linear-to-r from-transparent via-slate-200 to-transparent" />
          </div>
        </section>

        {/* Journey content */}
        <section className="site-main-px pt-10 pb-24 md:pt-12">
          <div className="mx-auto max-w-7xl">
            {loading && journeys.length === 0 ? (
              <JourneyCardsSkeleton />
            ) : (
              <AnimatePresence mode="popLayout">
                {visibleJourneys.length === 0 ? (
                  <EmptyJourneyState onStartJourney={startNewJourney} />
                ) : (
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {visibleJourneys.map(
                      (
                        {
                          id,
                          progress,
                          completedSteps,
                          totalSteps,
                          meta,
                          status,
                          subscriptionTier,
                          activity,
                        },
                        index
                      ) => (
                        <motion.div
                          key={id}
                          layout
                          initial={{
                            opacity: 0,
                            y: 20,
                          }}
                          animate={{
                            opacity: 1,
                            y: 0,
                          }}
                          exit={{
                            opacity: 0,
                            scale: 0.98,
                          }}
                          transition={{
                            duration: 0.35,
                            delay: index * 0.05,
                            ease: [0.22, 1, 0.36, 1],
                          }}
                          className="group h-full"
                        >
                          <JourneyCard
                            progress={progress}
                            completedSteps={completedSteps}
                            totalSteps={totalSteps}
                            meta={meta}
                            status={status}
                            subscriptionTier={subscriptionTier}
                            activity={activity}
                            isMultiCandidate={
                              meta.canonicalId === "ir5" ||
                              meta.code.toUpperCase().includes("IR-5") ||
                              meta.code.toUpperCase().includes("IR5")
                            }
                            candidateCount={
                              candidates.filter((c) =>
                                (c.visaCategory || "").toUpperCase().includes("IR-5")
                              ).length || candidates.length
                            }
                            onOpen={() => handleOpenJourney(meta)}
                            onUpdateJourneyName={(newName) =>
                              handleUpdateJourneyName(meta.canonicalId, newName)
                            }
                            onUpdateJourneyImage={(file) =>
                              handleUpdateJourneyImage(meta.canonicalId, file)
                            }
                          />
                        </motion.div>
                      )
                    )}
                  </div>
                )}
              </AnimatePresence>
            )}
          </div>
        </section>

        {/* Netflix-style Candidate Profile Launcher Modal */}
        <CandidateProfileLauncherModal
          isOpen={launcherModal.isOpen}
          onClose={() => setLauncherModal((prev) => ({ ...prev, isOpen: false }))}
          journeyCode={launcherModal.journeyCode}
          journeyName={launcherModal.journeyName}
          journeyRoute={launcherModal.journeyRoute}
          candidates={candidates}
        />
      </div>
    </main>
  );
}

interface JourneyCardProps {
  progress: number;
  completedSteps: number;
  totalSteps: number;
  meta: JourneyMeta & {
    canonicalId: string;
    candidateId?: string;
    candidateBadge?: string;
    candidateRelation?: string;
    isCurrentActive?: boolean;
    customName?: string;
    customImage?: string;
  };
  status: {
    label: string;
    className: string;
    dotClassName: string;
  };
  subscriptionTier?: string;
  activity: string;
  candidateCount?: number;
  isMultiCandidate?: boolean;
  onOpen: () => void;
  onUpdateJourneyName?: (newName: string) => Promise<void> | void;
  onUpdateJourneyImage?: (file: File) => Promise<void> | void;
}

function JourneyCard({
  progress,
  completedSteps,
  totalSteps,
  meta,
  status,
  subscriptionTier = "free",
  activity,
  candidateCount,
  isMultiCandidate,
  onOpen,
  onUpdateJourneyName,
  onUpdateJourneyImage,
}: JourneyCardProps) {
  const isActiveJourney =
    status.label === "Active" ||
    status.label === "Completed" ||
    status.label === "Paused" ||
    progress > 0;

  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(meta.name);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setNameInput(meta.name);
  }, [meta.name]);

  useEffect(() => {
    if (!isMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMenuOpen]);

  const handleSaveName = async () => {
    const trimmed = nameInput.trim();
    if (!trimmed) {
      setIsEditingName(false);
      setNameInput(meta.name);
      return;
    }
    setIsEditingName(false);
    if (onUpdateJourneyName) {
      await onUpdateJourneyName(trimmed);
    }
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingImage(true);
    try {
      if (onUpdateJourneyImage) {
        await onUpdateJourneyImage(file);
      }
    } finally {
      setIsUploadingImage(false);
      e.target.value = "";
    }
  };

  return (
    <Card
      role="button"
      tabIndex={0}
      aria-label={`Open ${meta.name}`}
      onClick={(e) => {
        const target = e.target as HTMLElement | SVGElement | null;
        if (
          target?.closest?.("button") ||
          target?.closest?.("input") ||
          isEditingName ||
          isUploadingImage ||
          isMenuOpen
        ) {
          return;
        }
        onOpen();
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          if (!isEditingName) {
            event.preventDefault();
            onOpen();
          }
        }
      }}
      className={`group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-3xl border p-0 backdrop-blur-xl transition-all duration-500 hover:-translate-y-1.5 focus-visible:ring-2 focus-visible:ring-[#14a0a6]/50 focus-visible:outline-none ${
        isActiveJourney
          ? meta.isCurrentActive
            ? "border-[#0d7377]/40 bg-white/90 shadow-[0_20px_60px_rgba(13,115,119,0.18)] ring-2 ring-[#0d7377]/25 hover:border-[#0d7377]/60 hover:shadow-[0_28px_70px_rgba(13,115,119,0.24)]"
            : "border-white/80 bg-white/75 shadow-[0_18px_55px_rgba(15,61,63,0.08)] hover:border-[#14a0a6]/30 hover:shadow-[0_28px_70px_rgba(13,115,119,0.16)]"
          : "border-slate-200/70 bg-slate-100/60 opacity-60 grayscale-[0.75] shadow-xs hover:border-slate-300 hover:opacity-95 hover:grayscale-0 hover:shadow-[0_18px_50px_rgba(15,61,63,0.1)]"
      }`}
    >
      {/* Hidden File Input for Cover Photo */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onClick={(e) => e.stopPropagation()}
        onChange={handleImageFileChange}
      />

      {/* Image */}
      <div
        className={`relative h-44 overflow-hidden ${
          isActiveJourney ? "bg-[#dbeeee]" : "bg-slate-200"
        }`}
      >
        <Image
          src={meta.image}
          alt={`${meta.name} journey cover`}
          fill
          unoptimized={meta.image.startsWith("data:")}
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
          className={`object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06] ${
            !isActiveJourney
              ? "opacity-80 grayscale-[0.5] group-hover:opacity-100 group-hover:grayscale-0"
              : ""
          }`}
        />

        <div
          className={`absolute inset-0 transition-opacity duration-500 ${
            isActiveJourney
              ? "bg-linear-to-t from-[#062f31]/90 via-[#083e41]/25 to-slate-950/10"
              : "bg-linear-to-t from-slate-950/85 via-slate-900/35 to-slate-950/15"
          }`}
        />

        <div
          className={`absolute inset-0 transition-opacity duration-500 ${
            isActiveJourney
              ? "bg-linear-to-br from-[#0d7377]/15 via-transparent to-[#32e0c4]/10"
              : "bg-transparent"
          }`}
        />

        {/* Upload Spinner Overlay */}
        {isUploadingImage && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs">
            <Loader2 className="h-7 w-7 animate-spin text-white" />
          </div>
        )}

        {/* Image badges and quick options menu */}
        <div className="absolute top-4 right-4 left-4 z-10 flex items-center justify-between gap-2">
          <JourneyPlanBadge tier={subscriptionTier} iconOnly={true} />

          <div className="flex items-center gap-1.5">
            {isMultiCandidate && candidateCount && candidateCount > 0 ? (
              <Badge className="rounded-full border border-teal-300/40 bg-slate-950/70 px-2.5 py-1 text-[10px] font-semibold text-teal-300 shadow-lg backdrop-blur-md hover:bg-slate-950/80">
                <Users className="mr-1 h-3 w-3 text-teal-300" />
                {candidateCount} {candidateCount === 1 ? "Profile" : "Profiles"}
              </Badge>
            ) : null}

            {/* Quick Actions Dropdown Menu */}
            <div ref={menuRef} className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsMenuOpen((prev) => !prev);
                }}
                onMouseDown={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                title="Journey options"
                className={`flex h-7 w-7 items-center justify-center rounded-full border border-white/25 bg-slate-950/70 text-white shadow-lg backdrop-blur-md transition-all hover:scale-105 hover:border-teal-300 hover:bg-[#0d7377] active:scale-95 ${
                  isMenuOpen
                    ? "border-teal-300 bg-[#0d7377] opacity-100 ring-2 ring-teal-400/40"
                    : "opacity-85 sm:opacity-0 sm:group-hover:opacity-100"
                }`}
              >
                <MoreVertical className="h-3.5 w-3.5 text-teal-300" />
              </button>

              <AnimatePresence>
                {isMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.94, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.94, y: -4 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="absolute right-0 top-full mt-1.5 z-30 min-w-[175px] rounded-2xl border border-white/20 bg-slate-950/95 p-1.5 shadow-2xl backdrop-blur-xl"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsMenuOpen(false);
                        fileInputRef.current?.click();
                      }}
                      onMouseDown={(e) => e.stopPropagation()}
                      onPointerDown={(e) => e.stopPropagation()}
                      disabled={isUploadingImage}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-200 transition-colors hover:bg-teal-500/20 hover:text-white disabled:opacity-50"
                    >
                      <Camera className="h-3.5 w-3.5 text-teal-300" />
                      <span>Change cover</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsMenuOpen(false);
                        setNameInput(meta.name);
                        setIsEditingName(true);
                      }}
                      onMouseDown={(e) => e.stopPropagation()}
                      onPointerDown={(e) => e.stopPropagation()}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-200 transition-colors hover:bg-teal-500/20 hover:text-white"
                    >
                      <Pencil className="h-3.5 w-3.5 text-teal-300" />
                      <span>Rename journey</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Image title & rename option */}
        <div className="absolute inset-x-0 bottom-0 z-10 p-5">
          {isEditingName ? (
            <div
              className="flex items-center gap-1.5 rounded-xl border border-teal-400/40 bg-slate-950/85 p-1.5 shadow-lg backdrop-blur-md"
              onClick={(e) => e.stopPropagation()}
            >
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSaveName();
                  } else if (e.key === "Escape") {
                    e.preventDefault();
                    setIsEditingName(false);
                  }
                }}
                placeholder="Journey name"
                className="flex-1 rounded-lg border border-teal-400/30 bg-slate-900/90 px-2.5 py-1 text-sm font-semibold text-white placeholder-slate-400 focus:ring-2 focus:ring-teal-400/50 focus:outline-none"
                autoFocus
              />
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSaveName();
                }}
                onMouseDown={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#0d7377] text-white transition-colors hover:bg-[#14a0a6]"
                title="Save Name"
              >
                <Check className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsEditingName(false);
                }}
                onMouseDown={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-700 text-slate-300 transition-colors hover:bg-slate-600"
                title="Cancel"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <h2
              title={meta.name}
              className="line-clamp-1 text-xl font-semibold tracking-[-0.02em] text-white md:text-[1.35rem]"
            >
              {meta.name}
            </h2>
          )}
        </div>
      </div>

      <CardContent className="relative flex flex-1 flex-col px-4 py-2">
        {/* Decorative card glow */}
        {isActiveJourney && (
          <div className="pointer-events-none absolute -top-20 -right-16 h-40 w-40 rounded-full bg-[#32e0c4]/8 blur-3xl" />
        )}

        <p className="relative line-clamp-2 min-h-[44px] text-sm leading-6 text-slate-600">
          {meta.description}
        </p>

        {/* Progress block */}
        <div className="relative mt-4 rounded-[20px] border border-[#0d7377]/8 bg-linear-to-br from-[#f2fbfb] to-white px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold tracking-[0.2em] text-slate-500 uppercase">
                Overall progress
              </p>

              <div className="mt-1 flex items-baseline gap-1">
                <span
                  className={`text-2xl font-bold tracking-[-0.04em] ${
                    isActiveJourney ? "text-[#0a5a5d]" : "text-slate-600"
                  }`}
                >
                  {progress}
                </span>
                <span
                  className={`text-sm font-semibold ${
                    isActiveJourney ? "text-[#0d7377]" : "text-slate-500"
                  }`}
                >
                  %
                </span>
              </div>
            </div>

            <div className="text-right">
              <p className="text-xs font-medium text-slate-500">
                {completedSteps} of {totalSteps}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-400">steps completed</p>
            </div>
          </div>

          <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-[#dceeed] shadow-inner">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{
                duration: 0.8,
                ease: [0.22, 1, 0.36, 1],
              }}
              className={`relative h-full rounded-full ${
                isActiveJourney
                  ? "bg-linear-to-r from-[#0a5a5d] via-[#0d7377] to-[#32e0c4]"
                  : "bg-linear-to-r from-slate-400 to-slate-500"
              }`}
            >
              <div className="absolute inset-0 bg-linear-to-b from-white/25 to-transparent" />
            </motion.div>
          </div>
        </div>

        {/* Activity */}
        <div className="relative mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
          <div className="flex min-w-0 items-center gap-2.5 text-xs text-slate-500">
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                isActiveJourney
                  ? "bg-[#e8f6f6] text-[#0d7377]"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {progress >= 100 ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <Clock3 className="h-4 w-4" />
              )}
            </span>

            <div className="min-w-0">
              <p className="text-[10px] font-semibold tracking-[0.14em] text-slate-400 uppercase">
                Last updated
              </p>
              <p className="truncate font-medium text-slate-600">{activity}</p>
            </div>
          </div>

          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white transition-all duration-300 group-hover:translate-x-0.5 ${
              isActiveJourney
                ? "bg-[#0d7377] shadow-[0_8px_20px_rgba(13,115,119,0.22)] group-hover:bg-[#0a5a5d] group-hover:shadow-[0_10px_26px_rgba(13,115,119,0.3)]"
                : "bg-slate-400 shadow-sm group-hover:bg-[#0d7377]"
            }`}
          >
            <ArrowRight className="h-4 w-4" />
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

interface EmptyJourneyStateProps {
  onStartJourney: () => void;
}

function EmptyJourneyState({ onStartJourney }: EmptyJourneyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{
        duration: 0.35,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="relative overflow-hidden rounded-[28px] border border-[#0d7377]/10 bg-white/85 shadow-[0_24px_70px_rgba(15,61,63,0.08)] backdrop-blur-xl"
    >
      {/* Subtle decorative glow */}
      <div className="pointer-events-none absolute -top-24 -right-20 h-64 w-64 rounded-full bg-[#32e0c4]/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 -left-20 h-64 w-64 rounded-full bg-[#0d7377]/5 blur-3xl" />

      <div className="relative flex flex-col items-center px-6 py-14 text-center sm:px-10 sm:py-16 lg:py-20">
        {/* Icon */}
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#0d7377]/10 bg-[#e8f6f6] text-[#0d7377] shadow-sm">
          <Route className="h-6 w-6" />
        </div>

        {/* Content */}
        <div className="mt-6 max-w-xl">
          <p className="text-xs font-semibold tracking-[0.2em] text-[#0d7377] uppercase">
            No journeys yet
          </p>

          <h2 className="mt-3 text-2xl font-semibold tracking-[-0.035em] text-slate-950 sm:text-3xl">
            Start your first immigration journey
          </h2>

          <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-slate-600 sm:text-base">
            Select your visa category and receive a clear, step-by-step roadmap for your immigration
            process.
          </p>
        </div>

        {/* Action */}
        <Button
          onClick={onStartJourney}
          className="group mt-8 h-12 rounded-full bg-[#0d7377] px-6 font-semibold text-white shadow-[0_12px_28px_rgba(13,115,119,0.22)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#0a5a5d] hover:shadow-[0_16px_34px_rgba(13,115,119,0.28)]"
        >
          Start Your First Journey
          <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
        </Button>

        <p className="mt-4 text-xs text-slate-400">
          You can save your progress and continue anytime.
        </p>
      </div>
    </motion.div>
  );
}

function JourneyCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <Card
          key={index}
          className="overflow-hidden rounded-[28px] border border-white/80 bg-white/75 p-0 shadow-[0_18px_55px_rgba(15,61,63,0.07)]"
        >
          <div className="relative h-52 overflow-hidden bg-slate-100">
            <div className="absolute inset-0 animate-pulse bg-linear-to-r from-slate-100 via-slate-50 to-slate-100" />

            <div className="absolute top-4 right-4 left-4 flex justify-between">
              <div className="h-7 w-16 animate-pulse rounded-full bg-white/70" />
              <div className="h-7 w-20 animate-pulse rounded-full bg-white/70" />
            </div>

            <div className="absolute bottom-5 left-5 space-y-2">
              <div className="h-3 w-24 animate-pulse rounded-full bg-white/50" />
              <div className="h-6 w-44 animate-pulse rounded-full bg-white/70" />
            </div>
          </div>

          <CardContent className="space-y-5 p-5 md:p-6">
            <div className="space-y-2">
              <div className="h-4 w-full animate-pulse rounded-full bg-slate-100" />
              <div className="h-4 w-4/5 animate-pulse rounded-full bg-slate-100" />
            </div>

            <div className="rounded-[20px] border border-slate-100 bg-slate-50/70 p-4">
              <div className="flex items-end justify-between">
                <div className="space-y-2">
                  <div className="h-3 w-24 animate-pulse rounded-full bg-slate-200" />
                  <div className="h-7 w-14 animate-pulse rounded-full bg-slate-200" />
                </div>

                <div className="space-y-2">
                  <div className="ml-auto h-3 w-14 animate-pulse rounded-full bg-slate-200" />
                  <div className="h-3 w-20 animate-pulse rounded-full bg-slate-200" />
                </div>
              </div>

              <div className="mt-4 h-2.5 animate-pulse rounded-full bg-slate-200" />
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 pt-4">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 animate-pulse rounded-full bg-slate-100" />
                <div className="space-y-1.5">
                  <div className="h-2.5 w-20 animate-pulse rounded-full bg-slate-100" />
                  <div className="h-3 w-24 animate-pulse rounded-full bg-slate-100" />
                </div>
              </div>

              <div className="h-10 w-10 animate-pulse rounded-full bg-slate-100" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
