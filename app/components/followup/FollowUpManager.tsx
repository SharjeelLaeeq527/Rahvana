"use client";

import { useState, useEffect } from "react";
import * as Errors from "@/lib/errors";
import { useAuth } from "@/app/context/AuthContext";
import { useToast } from "@/app/components/shared/ToastProvider";
import { getUser221gCase, update221gStatus } from "@/lib/supabase/twentyTwoOneG";
import { FollowUpDialog } from "./FollowUpDialog";

interface CaseData {
  id: string;
  status: string;
  next_follow_up_at: string | null;
  selected_items: any;
  dismiss_count: number;
}

export function FollowUpManager() {
  const { user } = useAuth();
  const [caseData, setCaseData] = useState<CaseData | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    async function checkFollowUp() {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const data = await getUser221gCase(user.id);
        if (data) {
          setCaseData(data);
          if (data.next_follow_up_at) {
            const now = new Date();
            const nextFollowUp = new Date(data.next_follow_up_at);
            if (now >= nextFollowUp) {
              setShowDialog(true);
            }
          }
        }
      } catch {
        // 221g is an optional feature — never break the main journey
      } finally {
        setLoading(false);
      }
    }

    checkFollowUp();
  }, [user]);

  const handleResponse = async (response: {
    difficultyDoc: string;
    answers: Record<string, boolean>;
  }) => {
    if (!caseData) return;

    console.log("User responses captured:", response.answers);

    const hasUploaded = response.answers["has_uploaded"];
    const embassyUpdate = response.answers["embassy_update"];
    const hasDifficulty = response.answers["has_difficulty"];

    // Compute new status
    let newStatus = caseData.status;
    if (response.difficultyDoc || hasDifficulty) newStatus = "stuck";
    if (hasUploaded) newStatus = "submitted";

    // DB Constraint validation
    const allowedStatuses = ["received", "gathering", "submitted", "not_uploaded", "stuck"];
    if (!allowedStatuses.includes(newStatus)) {
      newStatus = "received"; // fallback to standard allowed value
    }

    let nextDate: Date | null = new Date();
    let newDismissCount = caseData.dismiss_count || 0;

    if (hasUploaded) {
      if (embassyUpdate) {
        // User got an update from embassy, we can pause or disable follow up
        nextDate = null;
        console.log("Embassy updated: Disabling future follow-ups");
      } else {
        // Scenario 2: Follow up monthly
        nextDate.setMonth(nextDate.getMonth() + 1);
        newDismissCount = 0; // reset
        console.log("No update: Scheduled for next month");
      }
    } else {
      if (hasDifficulty === false) {
        // Scenario 3: Not uploaded but no difficulty
        newDismissCount += 1;
        if (newDismissCount >= 3) {
          nextDate = null;
          console.log("Smart dismissal: Disabling future follow-ups (3rd No)");
        } else {
          nextDate.setDate(nextDate.getDate() + 7); // weekly
          console.log("Smart dismissal: Scheduled for next week");
        }
      } else {
        // Scenario 1/4: Not uploaded and has difficulty
        newDismissCount = 0;
        nextDate.setDate(nextDate.getDate() + 7);
        console.log("User stuck: Scheduled for next week");
      }
    }

    try {
      await update221gStatus(caseData.id, newStatus, nextDate, response.answers, newDismissCount);
      setShowDialog(false);
      } catch (err) {
      console.error("Error updating follow-up status", err);
      const msgText = err instanceof Error ? err.message : String(err);
      // Show user-friendly message
      // eslint-disable-next-line no-alert
      alert(Errors.msg(Errors.E.FOLLOWUP_UPDATE_FAILED) + (msgText ? ` (${msgText})` : ""));
    }
  };

  if (loading || !showDialog || !caseData) return null;

  return (
    <FollowUpDialog
      isOpen={showDialog}
      onClose={() => setShowDialog(false)}
      // status={caseData.status}
      selectedItems={caseData.selected_items}
      onResponse={handleResponse}
    />
  );
}
