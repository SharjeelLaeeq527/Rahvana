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
      <CombinedIntakeFormWrapper
        onSubmit={handleSubmit}
        onSaveToProfile={handleSaveToProfile}
        initialData={initialData}
        initialSelections={initialSelections}
      />
    </div>
  );
}
