import { createClient } from "@/lib/supabase/client";
import {
  FormData,
  FormSelections,
} from "@/app/(tools)/(visa)/221g-action-planner/types/221g";

export async function save221gCase(
  userId: string,
  formData: FormData,
  selectedItems: FormSelections,
  status: string = "received",
) {
  const supabase = createClient();
  console.log("Saving 221g case for user:", userId, status);

  // Try to find existing case for this user
  const { data: existingCases } = await supabase
    .from("user_221g_cases")
    .select("id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1);
  const existingCase = existingCases?.[0];

  // FOR TESTING: Reset next follow-up to 5 seconds on every save
  const nextFollowUp = new Date();
  nextFollowUp.setSeconds(nextFollowUp.getSeconds() + 15);

  const caseData = {
    user_id: userId,
    case_number: formData.caseNumber,
    beneficiary_name: formData.beneficiaryName,
    status,
    form_data: formData,
    selected_items: JSON.parse(JSON.stringify(selectedItems)), // Ensure it's plain object
    next_follow_up_at: nextFollowUp.toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (existingCase) {
    const { error } = await supabase
      .from("user_221g_cases")
      .update(caseData)
      .eq("id", existingCase.id);
    if (error) {
      console.error("Supabase update error:", error);
      throw error;
    }
    console.log("Supabase update successful");
    return existingCase.id;
  } else {
    // FOR TESTING: Set the first follow-up to 5 seconds from now
    const nextFollowUp = new Date();
    // nextFollowUp.setDate(nextFollowUp.getDate() + 7);
    nextFollowUp.setSeconds(nextFollowUp.getSeconds() + 15);

    console.log("Inserting NEW case data...");
    const { data, error } = await supabase
      .from("user_221g_cases")
      .insert({
        ...caseData,
        received_at: new Date().toISOString(),
        next_follow_up_at: nextFollowUp.toISOString(),
      })
      .select()
      .single();
    if (error) {
      console.error("Supabase insert error:", error);
      throw error;
    }
    console.log("Supabase insert successful:", data.id);
    return data.id;
  }
}

export async function getUser221gCase(userId: string) {
  const supabase = createClient();
  console.log("Fetching 221g case for user:", userId);
  const { data: existingCases, error } = await supabase
    .from("user_221g_cases")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1);
  const data = existingCases?.[0] || null;

  if (error) {
    console.error("Error in getUser221gCase:", error);
    throw error;
  }
  console.log("Fetched case data:", data);
  return data;
}

export async function update221gStatus(
  caseId: string,
  status: string,
  nextFollowUpDate?: Date | null,
  lastResponses?: Record<string, boolean>,
  dismissCount?: number,
) {
  const supabase = createClient();
  const updateData: {
    status: string;
    updated_at: string;
    next_follow_up_at?: string | null;
    last_responses?: Record<string, boolean>;
    last_follow_up_at: string;
    dismiss_count?: number;
  } = {
    status,
    updated_at: new Date().toISOString(),
    last_follow_up_at: new Date().toISOString(),
  };

  if (nextFollowUpDate === null) {
    updateData.next_follow_up_at = null;
  } else if (nextFollowUpDate) {
    updateData.next_follow_up_at = nextFollowUpDate.toISOString();
  }

  if (dismissCount !== undefined) {
    updateData.dismiss_count = dismissCount;
  }

  if (lastResponses) {
    updateData.last_responses = lastResponses;
  }

  const { error } = await supabase
    .from("user_221g_cases")
    .update(updateData)
    .eq("id", caseId);

  if (error) throw error;
}
