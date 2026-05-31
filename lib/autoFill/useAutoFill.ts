/**
 * Custom Hook for Auto-Fill Functionality
 *
 * Consumes the central UserProfileContext (loaded once on auth)
 * instead of making its own Supabase query.
 *
 * Provides:
 *  - autoFilledData: form structure pre-filled with profile data
 *  - isLoading: whether profile is still loading
 *  - profile: the raw MasterProfile
 *  - saveFormData(formData): reverse-map form data back to profile + save
 *  - onFieldChange(fieldName, value): save a single field change back to profile
 */

import { useState, useEffect, useCallback } from "react";
import { useUserProfile } from "@/app/context/UserProfileContext";
import type { MasterProfile } from "@/types/profile";
import { autoFillForm, mapFormToProfile } from "./mapper";

export function useAutoFill<T extends Record<string, unknown>>(
  formStructure: T
): {
  autoFilledData: T;
  isLoading: boolean;
  profile: MasterProfile | null;
  saveFormData: (formData: Record<string, unknown>) => void;
  onFieldChange: (fieldName: string, value: unknown) => void;
} {
  const { profile, isProfileLoading, updateProfile } = useUserProfile();
  const [autoFilledData, setAutoFilledData] = useState<T>(formStructure);

  // Auto-fill form when profile data becomes available
  useEffect(() => {
    if (isProfileLoading) return;

    if (profile) {
      const filled = autoFillForm(profile, formStructure) as T;
      setAutoFilledData(filled);
    } else {
      setAutoFilledData(formStructure);
    }
    // Only re-run when profile changes or loading state changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, isProfileLoading]);

  /**
   * Reverse-map entire form data back to MasterProfile and save.
   * Call this on form submit or when the user finishes a tool.
   */
  const saveFormData = useCallback(
    (formData: Record<string, unknown>) => {
      if (!profile) return;

      const profileDelta = mapFormToProfile(formData, profile);
      updateProfile(profileDelta, { silent: false });
    },
    [profile, updateProfile]
  );

  /**
   * Save a single field change back to the profile.
   * Call this on individual field blur/change for real-time sync.
   */
  const onFieldChange = useCallback(
    (fieldName: string, value: unknown) => {
      if (!value || value === "") return;

      const singleField: Record<string, unknown> = { [fieldName]: value };
      const profileDelta = mapFormToProfile(singleField, profile || {});

      // Only update if the mapping actually produced something
      if (Object.keys(profileDelta).length > 0) {
        updateProfile(profileDelta, { silent: true });
      }
    },
    [profile, updateProfile]
  );

  return { autoFilledData, isLoading: isProfileLoading, profile, saveFormData, onFieldChange };
}
