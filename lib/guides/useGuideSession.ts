import { useState, useEffect, useCallback } from "react";

export interface GuideSession {
  hide_intro_modal: boolean;
  saved: boolean;
  id: string;
  status: "not_started" | "in_progress" | "completed" | "abandoned";
  progress_percent: number;
  current_step_key: string | null;
  guides?: {
    slug: string;
    title: string;
    description: string;
  };
}

export interface GuideStepData {
  step_key: string;
  data: any;
  is_completed: boolean;
}

export const useGuideSession = (slug: string, candidateId: string = "candidate-1") => {
  const [session, setSession] = useState<GuideSession | null>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem(`rahvana_guide_${slug}_${candidateId}`);
        return cached ? JSON.parse(cached) : null;
      } catch {
        return null;
      }
    }
    return null;
  });
  const [stepsData, setStepsData] = useState<Record<string, any>>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem(`rahvana_guide_steps_${slug}_${candidateId}`);
        return cached ? JSON.parse(cached) : {};
      } catch {
        return {};
      }
    }
    return {};
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const syncToLocal = useCallback(
    (newSession: GuideSession | null, newSteps?: Record<string, any>) => {
      if (typeof window === "undefined") return;
      try {
        if (newSession) {
          localStorage.setItem(`rahvana_guide_${slug}_${candidateId}`, JSON.stringify(newSession));
          if (newSteps) {
            localStorage.setItem(
              `rahvana_guide_steps_${slug}_${candidateId}`,
              JSON.stringify(newSteps)
            );
          }
          const listRaw = localStorage.getItem(`rahvana_guide_sessions_${candidateId}`);
          const list: GuideSession[] = listRaw ? JSON.parse(listRaw) : [];
          const filtered = list.filter(
            (s) => (s.guides?.slug && s.guides.slug !== slug) && s.id !== newSession.id
          );
          if (newSession.saved) {
            localStorage.setItem(
              `rahvana_guide_sessions_${candidateId}`,
              JSON.stringify([newSession, ...filtered])
            );
          } else {
            localStorage.setItem(
              `rahvana_guide_sessions_${candidateId}`,
              JSON.stringify(filtered)
            );
          }
        } else {
          localStorage.removeItem(`rahvana_guide_${slug}_${candidateId}`);
          localStorage.removeItem(`rahvana_guide_steps_${slug}_${candidateId}`);
        }
      } catch {
        // Ignore storage errors
      }
    },
    [slug, candidateId]
  );

  const fetchProgress = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/guides/progress?slug=${slug}&candidateId=${candidateId}`);
      const data = await res.json();

      if (data.session) {
        setSession(data.session);
        const stepsMap = (data.steps || []).reduce((acc: any, step: any) => {
          acc[step.step_key] = step.data;
          return acc;
        }, {});
        setStepsData(stepsMap);
        syncToLocal(data.session, stepsMap);
      } else {
        // Check local cache if API returns null
        if (typeof window !== "undefined") {
          try {
            const cached = localStorage.getItem(`rahvana_guide_${slug}_${candidateId}`);
            if (cached) {
              const parsed = JSON.parse(cached);
              setSession(parsed);
              const cachedSteps = localStorage.getItem(
                `rahvana_guide_steps_${slug}_${candidateId}`
              );
              if (cachedSteps) setStepsData(JSON.parse(cachedSteps));
              return;
            }
          } catch {
            // Ignore
          }
        }
        setSession(null);
        setStepsData({});
      }
    } catch (error) {
      console.error("Failed to fetch guide progress:", error);
    } finally {
      setLoading(false);
    }
  }, [slug, candidateId, syncToLocal]);

  const startSession = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await fetch("/api/guides/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, candidateId }),
      });
      const data = await res.json();
      if (data.session) {
        const enrichedSession: GuideSession = {
          ...data.session,
          guides: data.session.guides || {
            slug,
            title: slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
            description: "",
          },
        };
        setSession(enrichedSession);
        syncToLocal(enrichedSession, stepsData);
        return enrichedSession;
      }
    } catch (error) {
      console.error("Failed to start guide session:", error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const saveStep = async (
    stepKey: string,
    data: any,
    isCompleted = false,
    progressPercent?: number
  ) => {
    // Optimistically update step state
    const newSteps = { ...stepsData, [stepKey]: data };
    setStepsData(newSteps);

    let activeSession = session;

    // If there is no active backend session yet (or it has a dummy local id), start one on demand
    if (!activeSession || !activeSession.id || activeSession.id.startsWith("local_")) {
      try {
        const started = await startSession(true);
        if (started) {
          activeSession = started;
        }
      } catch (err) {
        console.error("Failed to ensure active backend session before saving step:", err);
      }
    }

    const calculatedProgress =
      progressPercent !== undefined
        ? progressPercent
        : (activeSession?.progress_percent ?? (session?.progress_percent || 0));

    const updatedSession: GuideSession = activeSession
      ? {
          ...activeSession,
          current_step_key: stepKey,
          progress_percent: calculatedProgress,
          status:
            calculatedProgress >= 100
              ? "completed"
              : activeSession.status === "completed"
                ? "completed"
                : "in_progress",
          guides: activeSession.guides || {
            slug,
            title: slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
            description: "",
          },
        }
      : {
          id: `local_${slug}_${candidateId}`,
          status: calculatedProgress >= 100 ? "completed" : "in_progress",
          progress_percent: calculatedProgress,
          current_step_key: stepKey,
          saved: false,
          hide_intro_modal: false,
          guides: {
            slug,
            title: slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
            description: "",
          },
        };

    setSession(updatedSession);
    syncToLocal(updatedSession, newSteps);

    if (!activeSession?.id || activeSession.id.startsWith("local_")) return;

    try {
      setSaving(true);
      await fetch("/api/guides/save-step", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guideSessionId: activeSession.id,
          stepKey,
          data,
          isCompleted,
          progressPercent: calculatedProgress,
        }),
      });
    } catch (error) {
      console.error("Failed to save step progress to server:", error);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (slug) {
      fetchProgress();
    }
  }, [slug, candidateId, fetchProgress]);

  return {
    session,
    stepsData,
    loading,
    saving,
    startSession,
    saveStep,
    refresh: fetchProgress,
  };
};
