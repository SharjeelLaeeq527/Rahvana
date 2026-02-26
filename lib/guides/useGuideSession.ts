import { useState, useEffect, useCallback } from "react";

export interface GuideSession {
  hide_intro_modal: boolean;
  saved: boolean;
  id: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'abandoned';
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

export const useGuideSession = (slug: string) => {
  const [session, setSession] = useState<GuideSession | null>(null);
  const [stepsData, setStepsData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchProgress = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/guides/progress?slug=${slug}`);
      const data = await res.json();
      
      if (data.session) {
        setSession(data.session);
        const stepsMap = data.steps.reduce((acc: any, step: any) => {
          acc[step.step_key] = step.data;
          return acc;
        }, {});
        setStepsData(stepsMap);
      }
    } catch (error) {
      console.error("Failed to fetch guide progress:", error);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  const startSession = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/guides/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      const data = await res.json();
      if (data.session) {
        setSession(data.session);
      }
      return data.session;
    } catch (error) {
      console.error("Failed to start guide session:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveStep = async (stepKey: string, data: any, isCompleted = false, progressPercent?: number) => {
    if (!session) return;

    try {
      setSaving(true);
      await fetch("/api/guides/save-step", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guideSessionId: session.id,
          stepKey,
          data,
          isCompleted,
          progressPercent,
        }),
      });
      
      // Update local state cache
      setStepsData(prev => ({ ...prev, [stepKey]: data }));
      setSession(prev => prev ? { 
        ...prev, 
        current_step_key: stepKey,
        progress_percent: progressPercent !== undefined ? progressPercent : prev.progress_percent 
      } : null);
      
    } catch (error) {
      console.error("Failed to save step progress:", error);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (slug) {
      fetchProgress();
    }
  }, [slug, fetchProgress]);

  return {
    session,
    stepsData,
    loading,
    saving,
    startSession,
    saveStep,
    refresh: fetchProgress
  };
};
