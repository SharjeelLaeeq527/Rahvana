"use client";

import { useState, useEffect } from "react";
import CombinedIntakeFormWrapper from "./components/CombinedIntakeFormWrapper";
import { FormData, FormSelections } from "./types/221g";
import { useAuth } from "@/app/context/AuthContext";
import { createBrowserClient } from "@supabase/ssr";
import { MasterProfile } from "@/types/profile";

export default function TwentyTwoOneGActionPlanner() {
  const [formData, setFormData] = useState<FormData | null>(null);
  const [selectedItems, setSelectedItems] = useState<FormSelections | null>(null);
  const [initialData, setInitialData] = useState<FormData | null>(null);
  const [initialSelections, setInitialSelections] = useState<FormSelections | null>(null);
  const [smartModeEnabled, setSmartModeEnabled] = useState(false);

  const { user } = useAuth();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  // Restore session from profile
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      try {
        const { data } = await supabase
          .from("user_profiles")
          .select("profile_details")
          .eq("id", user.id)
          .single();

        if (data?.profile_details) {
          const profile = data.profile_details as MasterProfile;
          if (profile.actionPlanner?.questionnaire) {
            const savedData = profile.actionPlanner.questionnaire.formData as unknown as FormData;
            const savedSelections = profile.actionPlanner.questionnaire.selectedItems as unknown as FormSelections;

            if (savedData) setInitialData(savedData);
            if (savedSelections) setInitialSelections(savedSelections);
          }
        }
      } catch (err) {
        console.error("Error fetching profile", err);
      }
    };
    fetchProfile();
  }, [user, supabase]);

  const handleSubmit = (data: FormData, selectedItems: FormSelections = {}) => {
    setFormData(data);
    setSelectedItems(selectedItems);
    // Saving to profile is now possible from the wizard results step via onSaveToProfile prop
  };

  const handleSaveToProfile = async () => {
    if (!user || !formData) return;

    try {
      const actionPlannerData = {
        questionnaire: {
          formData,
          selectedItems,
        },
        caseStatus: formData.ceacStatus,
        interviewDate: formData.interviewDate,
      };

      const { data: currentData } = await supabase
        .from("user_profiles")
        .select("profile_details")
        .eq("id", user.id)
        .single();

      const currentProfile = currentData?.profile_details || {};

      const { error } = await supabase.from("user_profiles").upsert({
        id: user.id,
        profile_details: {
          ...currentProfile,
          actionPlanner: actionPlannerData,
        },
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;
    } catch (err) {
      console.error("Error saving to profile", err);
      throw err;
    }
  };

  return (
    <div className="container mx-auto py-4 px-2 md:py-8 md:px-4 max-w-5xl">
      <div className="mb-5 rounded-2xl border border-slate-200  px-4 py-4 md:px-6 md:py-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-700">
          Visa Response Toolkit
        </p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 md:text-3xl">
          221(g) Action Planner
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Build and export a structured 221(g) response packet step by step.
        </p>
      </div>

      <div className="mb-4 flex justify-end">
        <button
          onClick={() => setSmartModeEnabled(true)}
          disabled={smartModeEnabled}
          className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
            smartModeEnabled
              ? "cursor-not-allowed bg-emerald-600 text-white opacity-90"
              : "border border-border bg-background text-foreground hover:bg-muted/50"
          }`}
        >
          {smartModeEnabled
            ? "Premium Smart Enabled"
            : "Enable Premium Smart"}
        </button>
      </div>
      <CombinedIntakeFormWrapper
        key={smartModeEnabled ? "smart-mode" : "basic-mode"}
        onSubmit={handleSubmit}
        onSaveToProfile={handleSaveToProfile}
        initialData={initialData}
        initialSelections={initialSelections}
        smartModeEnabled={smartModeEnabled}
      />
    </div>
  );
}
