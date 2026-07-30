"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, CheckCircle2, Clock3, Plus, Route } from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import { useToast } from "@/app/components/shared/ToastProvider";
import { JourneyProgressRecord, listUserJourneys } from "@/lib/journey/journeyProgressService";
import { getJourneyHrefByType, ir1journeyHref, ir5journeyHref } from "@/lib/constants/routes";
import { Loader } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

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
    image: "/assets/images/ir1-doc-vault-image.png",
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
  const meta = JOURNEY_META[canonical];

  if (meta) {
    return {
      ...meta,
      canonicalId: canonical,
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
  const { showToast } = useToast();
  const router = useRouter();

  const [journeys, setJourneys] = useState<JourneyProgressRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasFetched, setHasFetched] = useState(false);

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

      const seen = new Set<string>();

      const unique = data.filter((journey) => {
        const canonical = normalizeJourneyId(journey.journey_id);

        if (seen.has(canonical)) {
          return false;
        }

        seen.add(canonical);
        return true;
      });

      setJourneys(unique);
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

  const visibleJourneys = useMemo(
    () =>
      journeys.map((journey) => {
        const progress = getProgressPercent(journey);
        const completedSteps = getCompletedSteps(journey);
        const totalSteps = getTotalSteps(journey);
        const meta = resolveJourneyMeta(journey.journey_id);
        const status = getJourneyStatus(journey, progress);

        return {
          journey,
          progress,
          completedSteps,
          totalSteps,
          meta,
          status,
          activity: getActivityLabel(journey),
        };
      }),
    [journeys]
  );

  const startNewJourney = () => {
    router.push("/visa-category");
  };

  const handleOpenJourney = (route: string) => {
    router.push(route);
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

        <div className="absolute -left-44 -top-52 h-[520px] w-[520px] rounded-full bg-[#14a0a6]/10 blur-[130px]" />

        <div className="absolute -right-52 top-36 h-[560px] w-[560px] rounded-full bg-[#32e0c4]/10 blur-[150px]" />

        <div className="absolute bottom-0 left-1/3 h-[400px] w-[400px] rounded-full bg-[#0d7377]/5 blur-[130px]" />

        <div className="absolute inset-x-0 top-0 h-40 bg-linear-to-b from-white/80 to-transparent" />
      </div>

      <div className="relative z-10">
        {/* Page header */}
        <section className="site-main-px pt-12 md:pt-16 lg:pt-20">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
              <div className="max-w-3xl">
                <div className="mb-4 flex mt-6 md:mt-3 lg:mt-0 items-center gap-2 text-sm font-semibold text-[#0d7377]">
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
        <section className="site-main-px pb-24 pt-10 md:pt-12">
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
                        { journey, progress, completedSteps, totalSteps, meta, status, activity },
                        index
                      ) => (
                        <motion.div
                          key={journey.id}
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
                            activity={activity}
                            onOpen={() => handleOpenJourney(meta.route)}
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
      </div>
    </main>
  );
}

interface JourneyCardProps {
  progress: number;
  completedSteps: number;
  totalSteps: number;
  meta: JourneyMeta & { canonicalId: string };
  status: {
    label: string;
    className: string;
    dotClassName: string;
  };
  activity: string;
  onOpen: () => void;
}

function JourneyCard({
  progress,
  completedSteps,
  totalSteps,
  meta,
  status,
  activity,
  onOpen,
}: JourneyCardProps) {
  return (
    <Card
      role="button"
      tabIndex={0}
      aria-label={`Open ${meta.name}`}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen();
        }
      }}
      className="relative flex h-full cursor-pointer flex-col overflow-hidden rounded-[28px] border border-white/80 bg-white/75 p-0 shadow-[0_18px_55px_rgba(15,61,63,0.08)] backdrop-blur-xl transition-all duration-500 hover:-translate-y-1.5 hover:border-[#14a0a6]/30 hover:shadow-[0_28px_70px_rgba(13,115,119,0.16)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14a0a6]/50"
    >
      {/* Image */}
      <div className="relative h-52 overflow-hidden bg-[#dbeeee]">
        <Image
          src={meta.image}
          alt={`${meta.name} journey cover`}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
        />

        <div className="absolute inset-0 bg-linear-to-t from-[#062f31]/90 via-[#083e41]/25 to-slate-950/10" />

        <div className="absolute inset-0 bg-linear-to-br from-[#0d7377]/15 via-transparent to-[#32e0c4]/10" />

        {/* Image badges */}
        <div className="absolute left-4 right-4 top-4 flex items-center justify-between gap-3">
          <Badge className="rounded-full border border-white/25 bg-white/90 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-[#0a5a5d] shadow-lg shadow-slate-950/10 backdrop-blur-md hover:bg-white">
            {meta.code}
          </Badge>

          <Badge
            className={`rounded-full border px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] shadow-lg shadow-slate-950/10 backdrop-blur-md hover:${status.className} ${status.className}`}
          >
            <span className={`mr-2 h-1.5 w-1.5 rounded-full ${status.dotClassName}`} />
            {status.label}
          </Badge>
        </div>

        {/* Image title */}
        <div className="absolute inset-x-0 bottom-0 p-5 md:p-6">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8ff5e6]">
            Immigration pathway
          </p>

          <h2 className="text-xl font-semibold tracking-[-0.02em] text-white md:text-[1.35rem]">
            {meta.name}
          </h2>
        </div>
      </div>

      <CardContent className="relative flex flex-1 flex-col p-5 md:p-6">
        {/* Decorative card glow */}
        <div className="pointer-events-none absolute -right-16 -top-20 h-40 w-40 rounded-full bg-[#32e0c4]/8 blur-3xl" />

        <p className="relative line-clamp-2 min-h-12 text-sm leading-6 text-slate-600">
          {meta.description}
        </p>

        {/* Progress block */}
        <div className="relative mt-6 rounded-[20px] border border-[#0d7377]/8 bg-linear-to-br from-[#f2fbfb] to-white p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                Overall progress
              </p>

              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-2xl font-bold tracking-[-0.04em] text-[#0a5a5d]">
                  {progress}
                </span>
                <span className="text-sm font-semibold text-[#0d7377]">%</span>
              </div>
            </div>

            <div className="text-right">
              <p className="text-xs font-medium text-slate-500">
                {completedSteps} of {totalSteps}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-400">steps completed</p>
            </div>
          </div>

          <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-[#dceeed] shadow-inner">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{
                duration: 0.8,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="relative h-full rounded-full bg-linear-to-r from-[#0a5a5d] via-[#0d7377] to-[#32e0c4]"
            >
              <div className="absolute inset-0 bg-linear-to-b from-white/25 to-transparent" />
            </motion.div>
          </div>
        </div>

        {/* Activity */}
        <div className="relative mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <div className="flex min-w-0 items-center gap-2.5 text-xs text-slate-500">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#e8f6f6] text-[#0d7377]">
              {progress >= 100 ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <Clock3 className="h-4 w-4" />
              )}
            </span>

            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                Last activity
              </p>
              <p className="truncate font-medium text-slate-600">{activity}</p>
            </div>
          </div>

          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0d7377] text-white shadow-[0_8px_20px_rgba(13,115,119,0.22)] transition-all duration-300 group-hover:translate-x-0.5 group-hover:bg-[#0a5a5d] group-hover:shadow-[0_10px_26px_rgba(13,115,119,0.3)]">
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

function EmptyJourneyState({
  onStartJourney,
}: EmptyJourneyStateProps) {
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
      <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[#32e0c4]/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 -left-20 h-64 w-64 rounded-full bg-[#0d7377]/5 blur-3xl" />

      <div className="relative flex flex-col items-center px-6 py-14 text-center sm:px-10 sm:py-16 lg:py-20">
        {/* Icon */}
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#0d7377]/10 bg-[#e8f6f6] text-[#0d7377] shadow-sm">
          <Route className="h-6 w-6" />
        </div>

        {/* Content */}
        <div className="mt-6 max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0d7377]">
            No journeys yet
          </p>

          <h2 className="mt-3 text-2xl font-semibold tracking-[-0.035em] text-slate-950 sm:text-3xl">
            Start your first immigration journey
          </h2>

          <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-slate-600 sm:text-base">
            Select your visa category and receive a clear, step-by-step
            roadmap for your immigration process.
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

            <div className="absolute left-4 right-4 top-4 flex justify-between">
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
