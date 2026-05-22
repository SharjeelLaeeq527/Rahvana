/**
 * Custom Hook for Auto-Fill Functionality
 * Ensures autofill only works when user is logged in
 * and properly syncs with profile data
 */

import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useAuth } from "@/app/context/AuthContext";
import { MasterProfile } from "@/types/profile";
import { autoFillForm } from "./mapper";

export function useAutoFill<T extends Record<string, unknown>>(
  formStructure: T
): {
  autoFilledData: T;
  isLoading: boolean;
  profile: MasterProfile | null;
} {
  const { user } = useAuth();
  const [autoFilledData, setAutoFilledData] = useState<T>(formStructure);
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<MasterProfile | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchAndAutoFill = async () => {
      // If user is not logged in, clear autofill and return empty form
      if (!user?.id) {
        setAutoFilledData(formStructure);
        setProfile(null);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);

        // Fetch user profile
        const { data, error } = await supabase
          .from("user_profiles")
          .select("profile_details")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("Error fetching profile for autofill:", error);
          setAutoFilledData(formStructure);
          setProfile(null);
          return;
        }

        if (data?.profile_details) {
          const userProfile = data.profile_details as MasterProfile;
          setProfile(userProfile);

          // Auto-fill the form with profile data
          const filled = autoFillForm(userProfile, formStructure) as T;
          setAutoFilledData(filled);
        } else {
          // No profile data, use empty form
          setAutoFilledData(formStructure);
          setProfile(null);
        }
      } catch (err) {
        console.error("Unexpected error in useAutoFill:", err);
        setAutoFilledData(formStructure);
        setProfile(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAndAutoFill();
  }, [user?.id]); // Only re-run when user ID changes

  return { autoFilledData, isLoading, profile };
}
