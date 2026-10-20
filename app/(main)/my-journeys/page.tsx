"use client";

import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
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
import { PlanContext } from "@/app/context/PlanContext";
import { useToast } from "@/app/components/shared/ToastProvider";
import { JourneyProgressRecord, listUserJourneys } from "@/lib/journey/journeyProgressService";
import { createClient } from "@/lib/supabase/client";
import {
  getCandidateJourneyKey,
  getBaseVisaCategory,
} from "@/lib/candidate/candidateSyncService";
import { getJourneyHrefByType, ir1journeyHref, ir5journeyHref } from "@/lib/constants/routes";
import { IR5_ENABLED } from "@/lib/feature-flags";
import { Loader } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { JourneyPlanBadge } from "@/app/components/shared/JourneyPlanBadge";
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

const getJourneyStatus = (
  journey?: JourneyProgressRecord | null,
  progress: number = 0,
  tier?: string
) => {
  if (progress >= 100) {
    return {
      label: "Completed",
      className: "border-emerald-300/40 bg-emerald-500/90 text-white",
      dotClassName: "bg-emerald-200",
    };
  }

  const normTier = (tier || journey?.subscription_tier || "free").toLowerCase();
  const hasPaidTier = normTier !== "free";
  const isExplicitlyActive =
    journey?.status === "in_progress" || journey?.status === "active" || Boolean(journey?.started);

  const rawUpdatedAt = journey?.last_updated_at || journey?.updated_at || journey?.started_at;

  const updatedAt = rawUpdatedAt ? new Date(rawUpdatedAt).getTime() : Number.NaN;

  const isPaused = Number.isFinite(updatedAt) && Date.now() - updatedAt > 1000 * 60 * 60 * 24 * 10;

  if (isPaused && progress > 0) {
    return {
      label: "Paused",
      className: "border-amber-300/40 bg-amber-500/90 text-white",
      dotClassName: "bg-amber-200",
    };
  }

  // A journey is Active if it has a paid plan, is marked active/in_progress, or has progress
  if (hasPaidTier || isExplicitlyActive || progress > 0) {
    return {
      label: "Active",
      className: "border-[#5ce8d4]/30 bg-[#0d7377]/90 text-white",
      dotClassName: "bg-[#70f1dd]",
    };
  }

  return {
    label: "Draft",
    className: "border-white/25 bg-slate-900/55 text-white backdrop-blur-md",
    dotClassName: "bg-slate-300",
  };
};

const tierHierarchy: Record<string, number> = {
  executive: 3,
  premium: 2,
  basic: 1,
  free: 0,
};

const resolveHighestTier = (...tiers: (string | null | undefined)[]): string => {
  let highest = "free";
  for (const t of tiers) {
    if (!t) continue;
    const norm = t.toLowerCase().trim();
    if ((tierHierarchy[norm] ?? -1) > (tierHierarchy[highest] ?? 0)) {
      highest = norm;
    }
  }
  return highest;
};

export default function MyJourneysPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { profile, updateProfile } = useUserProfile();
  const planCtx = useContext(PlanContext);
  const { showToast } = useToast();
  const router = useRouter();
  const {
    candidates,
    setActiveCandidateId,
    activeCandidateId,
    activeCandidate,
    isMultiCandidate,
    updateCandidate,
  } = useCandidate();

  const [journeys, setJourneys] = useState<JourneyProgressRecord[]>([]);
  const [accountPlan, setAccountPlan] = useState<string | null>(null);
  const [dbCandidates, setDbCandidates] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasFetched, setHasFetched] = useState(false);

  const handleUpdateJourneyName = useCallback(
    async (canonicalKey: string, newName: string, candidateId?: string) => {
      if (candidateId) {
        updateCandidate(candidateId, { customName: newName, fullName: newName });
      }
      const existing = profile?.journeyCustomizations || {};
      const key = candidateId ? `${canonicalKey}_${candidateId}` : canonicalKey;
      const updated = {
        ...existing,
        [key]: {
          ...existing[key],
          name: newName,
          updatedAt: new Date().toISOString(),
        },
      };
      updateProfile({ journeyCustomizations: updated }, { immediate: true });
      showToast("Journey name updated!", "success");
    },
    [profile?.journeyCustomizations, updateProfile, updateCandidate, showToast]
  );

  const handleUpdateJourneyImage = useCallback(
    async (canonicalKey: string, file: File, candidateId?: string) => {
      try {
        const uploadKey = candidateId ? `${canonicalKey}_${candidateId}` : canonicalKey;
        const { url } = await uploadJourneyImage(file, "journey", uploadKey);
        if (url) {
          if (candidateId) {
            updateCandidate(candidateId, { avatarUrl: url });
          }
          const existing = profile?.journeyCustomizations || {};
          const key = candidateId ? `${canonicalKey}_${candidateId}` : canonicalKey;
          const updated = {
            ...existing,
            [key]: {
              ...existing[key],
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
    [profile?.journeyCustomizations, updateProfile, updateCandidate, showToast]
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
      const supabase = createClient();
      const [data, profileRes] = await Promise.all([
        listUserJourneys(user.id),
        supabase
          .from("user_profiles")
          .select("subscription_tier, profile_details")
          .eq("id", user.id)
          .maybeSingle(),
      ]);

      if (!isMounted.current) {
        return;
      }

      setJourneys(data || []);

      if (profileRes.data) {
        const topTier = profileRes.data.subscription_tier;
        const detailsPlan = (profileRes.data.profile_details as any)?.active_plan;
        setAccountPlan(topTier || detailsPlan || null);

        const candRoster = (profileRes.data.profile_details as any)?.candidates;
        if (Array.isArray(candRoster) && candRoster.length > 0) {
          setDbCandidates(candRoster);
        }
      }
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

        const formatCandidateRelation = (rel?: string) => {
          if (!rel) return "";
          if (rel === "AdoptiveParent") return "Adoptive Parent";
          if (rel === "Stepparent") return "Stepparent";
          if (rel === "Other") return "Parent";
          return rel;
        };

        // If user has specific candidate profiles, display each candidate individually
        if (ir5Candidates.length > 0) {
          ir5Candidates.forEach((cand, idx) => {
            const candKey = getCandidateJourneyKey("IR-5", cand.id)
              .toLowerCase()
              .replace(/[^a-z0-9]/g, "");

            // Look up the specific journey for this candidate
            const candDbJourney =
              ir5DbJourneys.find(
                (j) => (j.journey_id || "").toLowerCase().replace(/[^a-z0-9]/g, "") === candKey
              ) ||
              (cand.id === "candidate-1" &&
              !ir5DbJourneys.some((j) => (j.journey_id || "").toLowerCase().includes("candidate"))
                ? ir5DbJourneys[0]
                : undefined);

            const progress = candDbJourney ? getProgressPercent(candDbJourney) : 0;
            const completedSteps = candDbJourney ? getCompletedSteps(candDbJourney) : 0;
            const totalSteps = candDbJourney ? getTotalSteps(candDbJourney) : 28;

            // Determine candidate tier
            const candDbTier =
              candDbJourney?.subscription_tier || (candDbJourney as any)?.tier;
            const candRosterTier =
              cand.tier ||
              dbCandidates?.find((c) => c.id === cand.id)?.tier ||
              (profile as any)?.candidates?.find((c: any) => c.id === cand.id)?.tier;

            const isPrimaryCand = Boolean(
              cand.isPrimary || cand.id === "candidate-1" || ir5Candidates.length === 1
            );
            const isActiveCand = cand.id === activeCandidateId;

            let candTier = resolveHighestTier(
              candRosterTier,
              candDbTier,
              planCtx?.journeyTiers?.[candKey],
              planCtx?.journeyTiers?.[cand.id],
              planCtx?.journeyTiers?.[cand.id.toLowerCase().replace(/[^a-z0-9]/g, "")],
              planCtx?.journeyTiers?.[candKey.replace(/[^a-z0-9]/g, "")]
            );

            if (isPrimaryCand || isActiveCand) {
              const accountPlanTier = resolveHighestTier(
                planCtx?.journeyTiers?.["IR-5"],
                planCtx?.journeyTiers?.["ir5"],
                accountPlan,
                planCtx?.maxActiveJourneyTier,
                (profile as any)?.active_plan,
                (profile as any)?.subscription_tier,
                (profile as any)?.subscriptionTier,
                (profile as any)?.tier,
                isActiveCand ? planCtx?.realTier : null,
                isActiveCand ? planCtx?.tier : null
              );
              candTier = resolveHighestTier(candTier, accountPlanTier);
            }

            const status = getJourneyStatus(candDbJourney, progress, candTier);
            const baseMeta = resolveJourneyMeta("IR-5");

            const candCustom =
              profile?.journeyCustomizations?.[`ir5_${cand.id}`] ||
              profile?.journeyCustomizations?.[cand.id] ||
              (cand.id === "candidate-1" ? profile?.journeyCustomizations?.["ir5"] : undefined);

            const formattedRel = formatCandidateRelation(cand.relation);
            const candName =
              cand.customName ||
              cand.fullName ||
              (formattedRel ? formattedRel : cand.label || `Beneficiary ${idx + 1}`);

            const cardTitle = candCustom?.name || candName;
            const cardImage = candCustom?.image || cand.avatarUrl || baseMeta.image;

            const isCurrentActive =
              activeCandidateId === cand.id || (!activeCandidateId && cand.isPrimary);

            result.push({
              id: candDbJourney?.id || `candidate_${cand.id}`,
              journey: candDbJourney,
              progress,
              completedSteps,
              totalSteps,
              meta: {
                ...baseMeta,
                name: cardTitle,
                image: cardImage,
                canonicalId: `ir5_${cand.id}`,
                candidateId: cand.id,
                candidateRelation: formattedRel,
                isCurrentActive: Boolean(isCurrentActive),
              },
              status,
              subscriptionTier: candTier,
              activity: candDbJourney ? getActivityLabel(candDbJourney) : "Not started",
            });
          });
        } else {
          // Fallback if IR-5 is active on profile/DB but no candidate object in context
          const activeDbJourney = ir5DbJourneys[0];
          const highestTier = resolveHighestTier(
            ...ir5DbJourneys.map((j) => j.subscription_tier),
            activeDbJourney?.subscription_tier,
            planCtx?.journeyTiers?.["IR-5"],
            planCtx?.journeyTiers?.["ir5"],
            accountPlan,
            planCtx?.maxActiveJourneyTier,
            planCtx?.realTier,
            planCtx?.tier,
            (profile as any)?.active_plan,
            (profile as any)?.subscription_tier,
            (profile as any)?.subscriptionTier,
            (profile as any)?.tier
          );

          const progress = activeDbJourney ? getProgressPercent(activeDbJourney) : 0;
          const completedSteps = activeDbJourney ? getCompletedSteps(activeDbJourney) : 0;
          const totalSteps = activeDbJourney ? getTotalSteps(activeDbJourney) : 28;
          const status = getJourneyStatus(activeDbJourney, progress, highestTier);
          const meta = resolveJourneyMeta("IR-5");
          const ir5Custom = profile?.journeyCustomizations?.["ir5"];
          const customName = ir5Custom?.name || meta.name;
          const customImage = ir5Custom?.image || meta.image;

          const isIr5Active =
            activeCandidate &&
            getBaseVisaCategory(activeCandidate.visaCategory || "IR-5") === "IR-5";

          const candForIr5 =
            candidates.find((c) => getBaseVisaCategory(c.visaCategory) === "IR-5") ||
            candidates.find((c) => c.isPrimary) ||
            candidates[0];

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
              canonicalId: "ir5",
              candidateId: candForIr5?.id,
              isCurrentActive: Boolean(isIr5Active),
            },
            status,
            subscriptionTier: highestTier,
            activity: activeDbJourney ? getActivityLabel(activeDbJourney) : "Not started",
          });
        }
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

      const candIdFromJourney =
        j.journey_id && j.journey_id.includes("_") ? j.journey_id.split("_")[1] : null;
      const candForJourney =
        (candIdFromJourney
          ? candidates.find(
              (c) => c.id.replace(/[^a-z0-9]/g, "") === candIdFromJourney.replace(/[^a-z0-9]/g, "")
            )
          : null) ||
        (activeCandidate && getBaseVisaCategory(activeCandidate.visaCategory) === baseCategory
          ? activeCandidate
          : null) ||
        candidates.find((c) => getBaseVisaCategory(c.visaCategory) === baseCategory) ||
        (baseCategory === "IR-1" ? candidates.find((c) => c.relation === "Spouse") : null) ||
        candidates.find((c) => c.isPrimary) ||
        candidates[0];

      const candRosterTier =
        candForJourney?.tier ||
        (candForJourney ? dbCandidates?.find((c) => c.id === candForJourney.id)?.tier : null) ||
        (candForJourney
          ? (profile as any)?.candidates?.find((c: any) => c.id === candForJourney.id)?.tier
          : null);

      const isMatchingCategory =
        !activeCandidate?.visaCategory ||
        getBaseVisaCategory(activeCandidate.visaCategory) === baseCategory;

      const userAccountPlanTier = isMatchingCategory
        ? resolveHighestTier(
            accountPlan,
            planCtx?.maxActiveJourneyTier,
            (profile as any)?.active_plan,
            (profile as any)?.subscription_tier,
            (profile as any)?.subscriptionTier,
            (profile as any)?.tier,
            planCtx?.realTier,
            planCtx?.tier
          )
        : null;

      const jTier = resolveHighestTier(
        j.subscription_tier,
        (j as any)?.tier,
        candRosterTier,
        planCtx?.journeyTiers?.[j.journey_id],
        planCtx?.journeyTiers?.[canonicalKey],
        planCtx?.journeyTiers?.[baseCategory],
        planCtx?.journeyTiers?.[baseCategory.toLowerCase()],
        planCtx?.journeyTiers?.[canonical],
        userAccountPlanTier
      );

      const progress = getProgressPercent(j);
      const completedSteps = getCompletedSteps(j);
      const totalSteps = getTotalSteps(j);
      const meta = resolveJourneyMeta(j.journey_id);
      const jCustom =
        profile?.journeyCustomizations?.[canonicalKey] ||
        profile?.journeyCustomizations?.[canonical] ||
        profile?.journeyCustomizations?.[j.journey_id];

      const defaultCand = candForJourney || null;
      const defaultCandName =
        defaultCand?.customName || defaultCand?.fullName || defaultCand?.label || meta.name;
      const customName = jCustom?.name || defaultCandName;
      const customImage = jCustom?.image || defaultCand?.avatarUrl || meta.image;
      const status = getJourneyStatus(j, progress, jTier);

      const isCurrentActive =
        baseCategory === "IR-1"
          ? activeCandidate && getBaseVisaCategory(activeCandidate.visaCategory) === "IR-1"
          : activeCandidate && candForJourney
            ? activeCandidate.id === candForJourney.id
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
          canonicalId: canonicalKey,
          candidateId: candForJourney?.id,
          isCurrentActive: Boolean(isCurrentActive),
        },
        status,
        subscriptionTier: jTier,
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

          const candForProfile =
            (activeCandidate && getBaseVisaCategory(activeCandidate.visaCategory) === baseCategory
              ? activeCandidate
              : null) ||
            candidates.find((c) => getBaseVisaCategory(c.visaCategory) === baseCategory) ||
            (baseCategory === "IR-1" ? candidates.find((c) => c.relation === "Spouse") : null) ||
            candidates.find((c) => c.isPrimary) ||
            candidates[0];

          const defaultCand = candForProfile || null;
          const defaultCandName =
            defaultCand?.customName || defaultCand?.fullName || defaultCand?.label || meta.name;
          const customName = fbCustom?.name || defaultCandName;
          const customImage = fbCustom?.image || defaultCand?.avatarUrl || meta.image;

          const candRosterTier =
            candForProfile?.tier ||
            (candForProfile ? dbCandidates?.find((c) => c.id === candForProfile.id)?.tier : null) ||
            (candForProfile
              ? (profile as any)?.candidates?.find((c: any) => c.id === candForProfile.id)?.tier
              : null);

          const isMatchingCategory =
            !activeCandidate?.visaCategory ||
            getBaseVisaCategory(activeCandidate.visaCategory) === baseCategory;

          const fbTier = resolveHighestTier(
            profile?.subscriptionTier,
            (profile as any)?.subscription_tier,
            (profile as any)?.active_plan,
            (profile as any)?.tier,
            accountPlan,
            candRosterTier,
            planCtx?.journeyTiers?.[baseCategory],
            planCtx?.journeyTiers?.[canonicalKey],
            planCtx?.journeyTiers?.[profileVisa.toLowerCase()],
            planCtx?.maxActiveJourneyTier,
            isMatchingCategory ? planCtx?.realTier : null,
            isMatchingCategory ? planCtx?.tier : null
          );

          const fbStatus = getJourneyStatus(null, 0, fbTier);

          result.push({
            id: `profile_${canonicalKey}`,
            progress: 0,
            completedSteps: 0,
            totalSteps: canonicalKey === "ir1" ? 29 : 10,
            meta: {
              ...meta,
              name: customName,
              image: customImage,
              canonicalId: canonicalKey,
              candidateId: candForProfile?.id,
              isCurrentActive: false,
            },
            status: fbStatus,
            subscriptionTier: fbTier,
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
    profile,
    accountPlan,
    dbCandidates,
    planCtx?.journeyTiers,
    planCtx?.maxActiveJourneyTier,
    planCtx?.realTier,
    planCtx?.tier,
  ]);

  const startNewJourney = () => {
    router.push("/visa-category");
  };

  const handleOpenJourney = (
    meta: JourneyMeta & {
      canonicalId: string;
      candidateId?: string;
    }
  ) => {
    // Netflix-style Candidate Profile Launcher Modal kept commented out for future use
    /*
    const isMultiCandidateCategory =
      meta.canonicalId === "ir5" ||
      meta.code.toUpperCase().includes("IR-5") ||
      meta.code.toUpperCase().includes("IR5");

    if (isMultiCandidateCategory && !meta.candidateId) {
      setLauncherModal({
        isOpen: true,
        journeyCode: meta.code,
        journeyName: meta.name,
        journeyRoute: meta.route,
      });
      return;
    }
    */

    let targetCandidateId = meta.candidateId;

    // Safety fallback: if candidateId was not directly on meta, resolve the appropriate candidate
    if (!targetCandidateId) {
      const baseCategory = getBaseVisaCategory(meta.code || meta.canonicalId);
      const match =
        (activeCandidate && getBaseVisaCategory(activeCandidate.visaCategory) === baseCategory
          ? activeCandidate
          : null) ||
        candidates.find((c) => getBaseVisaCategory(c.visaCategory) === baseCategory) ||
        (baseCategory === "IR-1" ? candidates.find((c) => c.relation === "Spouse") : null) ||
        candidates.find((c) => c.isPrimary) ||
        candidates[0];

      if (match?.id) {
        targetCandidateId = match.id;
      }
    }

    if (targetCandidateId) {
      setActiveCandidateId(targetCandidateId);
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
    <main className="relative overflow-hidden bg-[#f7fbfb]">
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
        <section className="site-main-px pt-16 md:pt-16 lg:pt-20">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
              <div className="max-w-6xl">
                {/* <div className="mt-6 mb-4 flex items-center gap-2 text-sm font-semibold text-[#0d7377] md:mt-3 lg:mt-0">
                  <span className="h-2 w-2 rounded-full bg-[#32e0c4] shadow-[0_0_0_5px_rgba(50,224,196,0.14)]" />
                  Your immigration dashboard
                </div> */}

                <h1 className="text-4xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl lg:text-[3.6rem] lg:leading-[1.05]">
                  My Immigration{" "}
                  <span className="bg-linear-to-r from-[#0a5a5d] via-[#0d7377] to-[#14a0a6] bg-clip-text text-transparent">
                    Journeys
                  </span>
                </h1>

                <p className="mt-5 max-w-5xl text-base leading-7 text-slate-600 md:text-lg md:leading-8">
                  Continue your active journeys, review your progress and manage every immigration
                  journey from one secure workspace.
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
        <section className="site-main-px pt-4 pb-24">
          <div className="mx-auto max-w-7xl">
            {loading && journeys.length === 0 ? (
              <JourneyCardsSkeleton />
            ) : (
              <AnimatePresence mode="popLayout">
                {visibleJourneys.length === 0 ? (
                  <EmptyJourneyState onStartJourney={startNewJourney} />
                ) : (
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
                            isMultiCandidate={false}
                            candidateCount={0}
                            onOpen={() => handleOpenJourney(meta)}
                            onUpdateJourneyName={(newName) =>
                              handleUpdateJourneyName(meta.canonicalId, newName, meta.candidateId)
                            }
                            onUpdateJourneyImage={(file) =>
                              handleUpdateJourneyImage(meta.canonicalId, file, meta.candidateId)
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

        {/* New-style Candidate Profile Launcher Modal (commented out for now - each beneficiary card is shown individually) */}
        {/*
        <CandidateProfileLauncherModal
          isOpen={launcherModal.isOpen}
          onClose={() => setLauncherModal((prev) => ({ ...prev, isOpen: false }))}
          journeyCode={launcherModal.journeyCode}
          journeyName={launcherModal.journeyName}
          journeyRoute={launcherModal.journeyRoute}
          candidates={candidates}
          journeys={journeys}
        />
        */}
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
  const isPaid = subscriptionTier && subscriptionTier.toLowerCase() !== "free";
  const hasCandidates = Boolean(isMultiCandidate && candidateCount && candidateCount > 0);
  const isActiveJourney =
    status.label === "Active" ||
    status.label === "Completed" ||
    status.label === "Paused" ||
    progress > 0 ||
    isPaid ||
    hasCandidates;

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
      className={`group relative flex h-full cursor-pointer flex-col gap-0 overflow-hidden rounded-3xl border p-0 backdrop-blur-xl transition-all duration-500 hover:-translate-y-1.5 focus-visible:ring-2 focus-visible:ring-[#14a0a6]/50 focus-visible:outline-none ${
        isActiveJourney
          ? meta.isCurrentActive
            ? "border-[#0d7377]/40 bg-white/90 shadow-[0_20px_60px_rgba(13,115,119,0.18)] ring-2 ring-[#0d7377]/25 hover:border-[#0d7377]/60 hover:shadow-[0_28px_70px_rgba(13,115,119,0.24)]"
            : "border-white/80 bg-white/75 shadow-[0_18px_55px_rgba(15,61,63,0.08)] hover:border-[#14a0a6]/30 hover:shadow-[0_28px_70px_rgba(13,115,119,0.16)]"
          : "border-slate-200/70 bg-slate-100/60 opacity-60 shadow-xs grayscale-[0.75] hover:border-slate-300 hover:opacity-95 hover:shadow-[0_18px_50px_rgba(15,61,63,0.1)] hover:grayscale-0"
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
        className={`relative h-58 overflow-hidden ${
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
          {!(isMultiCandidate && candidateCount && candidateCount > 0) ? (
            <div className="flex items-center gap-2">
              <JourneyPlanBadge tier={subscriptionTier} iconOnly={true} />
              {meta.code && (
                <Badge className="rounded-full border border-white/25 bg-slate-950/70 px-2 py-0.5 text-[10px] font-semibold text-white shadow-lg backdrop-blur-md">
                  {meta.code}
                </Badge>
              )}
            </div>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-1.5">
            {/* {isMultiCandidate && candidateCount && candidateCount > 0 ? (
              <Badge className="rounded-full border border-teal-300/40 bg-slate-950/70 px-2.5 py-1 text-[10px] font-semibold text-teal-300 shadow-lg backdrop-blur-md hover:bg-slate-950/80">
                <Users className="mr-1 h-3 w-3 text-teal-300" />
                {candidateCount} {candidateCount === 1 ? "Profile" : "Profiles"}
              </Badge>
            ) : null} */}

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
                    className="absolute top-full right-0 z-30 mt-1.5 min-w-[175px] rounded-2xl border border-white/20 bg-slate-950/95 p-1.5 shadow-2xl backdrop-blur-xl"
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
            <div>
              <div className="flex items-center gap-2">
                <h2
                  title={meta.name}
                  className="line-clamp-1 text-xl font-semibold tracking-[-0.02em] text-white md:text-[1.35rem]"
                >
                  {meta.name}
                </h2>
                {/* {meta.candidateRelation &&
                  meta.candidateRelation.toLowerCase() !== meta.name.toLowerCase() && (
                    <Badge className="shrink-0 rounded-full border border-teal-300/40 bg-teal-950/70 px-2 py-0.5 text-[10px] font-medium text-teal-200 backdrop-blur-md">
                      {meta.candidateRelation}
                    </Badge>
                  )} */}
              </div>
            </div>
          )}
        </div>
      </div>

      <CardContent className="relative flex flex-1 flex-col px-4 pt-2 pb-2.5">
        {/* Decorative card glow */}
        {/* {isActiveJourney && (
          <div className="pointer-events-none absolute -top-20 -right-16 h-40 w-40 rounded-full bg-[#32e0c4]/8 blur-3xl" />
        )} */}

        {/* Progress block / Multi-Candidate Profile summary */}
        {isMultiCandidate && candidateCount && candidateCount > 0 ? (
          <div className="relative mt-1 flex items-center justify-between rounded-[20px] border border-[#0d7377]/10 bg-linear-to-br from-[#f2fbfb] to-white p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#e8f6f6] text-[#0d7377] shadow-xs">
                <Users className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-slate-800">
                  {candidateCount} Beneficiary {candidateCount === 1 ? "Profile" : "Profiles"}
                </p>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  Select a profile to view progress
                </p>
              </div>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#0d7377]/10 px-2.5 py-1 text-[11px] font-semibold text-[#0d7377] transition-colors group-hover:bg-[#0d7377] group-hover:text-white">
              Launch <ArrowRight className="h-3 w-3" />
            </span>
          </div>
        ) : (
          <div className="my-0.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-baseline gap-1.5">
                <span className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
                  Progress
                </span>
                <span
                  className={`text-[13px] font-bold tracking-tight ${
                    isActiveJourney ? "text-[#0a5a5d]" : "text-slate-700"
                  }`}
                >
                  {progress}%
                </span>
              </div>

              <p className="text-[11px] font-medium text-slate-500">
                <span className="font-semibold text-slate-700">{completedSteps}</span>
                <span className="text-slate-400">/{totalSteps} steps</span>
              </p>
            </div>

            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#dceeed]">
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
        )}

        {/* Activity */}
        {/* <div className="relative mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
          <div className="flex min-w-0 items-center gap-2.5 text-xs text-slate-500">
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                isActiveJourney ? "bg-[#e8f6f6] text-[#0d7377]" : "bg-slate-100 text-slate-500"
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
        </div> */}
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
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <Card
          key={index}
          className="relative flex h-full flex-col gap-0 overflow-hidden rounded-3xl border border-white/80 bg-white/75 p-0 shadow-[0_18px_55px_rgba(15,61,63,0.08)]"
        >
          {/* Image skeleton */}
          <div className="relative h-58 overflow-hidden bg-slate-200/70">
            <div className="absolute inset-0 animate-pulse bg-linear-to-r from-slate-200/60 via-slate-100/80 to-slate-200/60" />

            {/* Top badges */}
            <div className="absolute top-4 right-4 left-4 z-10 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 animate-pulse rounded-full bg-white/70" />
                <div className="h-5 w-14 animate-pulse rounded-full bg-white/60" />
              </div>
              <div className="h-7 w-7 animate-pulse rounded-full bg-white/70" />
            </div>

            {/* Bottom Title */}
            <div className="absolute right-5 bottom-4 left-5">
              <div className="h-6 w-36 animate-pulse rounded-lg bg-white/75" />
            </div>
          </div>

          {/* Compact Progress Content skeleton */}
          <CardContent className="relative flex flex-1 flex-col px-4 pt-2 pb-2.5">
            <div className="my-0.5 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <div className="h-3 w-12 animate-pulse rounded-full bg-slate-200" />
                  <div className="h-3.5 w-7 animate-pulse rounded-full bg-slate-200" />
                </div>
                <div className="h-3 w-16 animate-pulse rounded-full bg-slate-200" />
              </div>

              <div className="h-1.5 w-full animate-pulse rounded-full bg-[#dceeed]/80" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
