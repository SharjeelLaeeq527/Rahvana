import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { DocumentChecklistEngine } from "@/lib/journey/document-checklist/engine";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const journeyId = params.id;

    // Fetch journey
    const { data: journey, error: journeyError } = await supabase
      .from("journeys")
      .select("*")
      .eq("id", journeyId)
      .eq("user_id", user.id)
      .single();

    if (journeyError || !journey) {
      return NextResponse.json({ error: "Journey not found" }, { status: 404 });
    }

    // Generate checklist
    const sourceSteps = ["step_1_2", "step_2_4", "step_2_6", "step_2_7", "step_3_6"];
    const checklist = await DocumentChecklistEngine.generateChecklist(
      journeyId,
      user.id,
      journey.journey_type,
      sourceSteps
    );

    // Fetch saved checked items from case_data
    const { data: savedChecklist } = await supabase
      .from("case_data")
      .select("data_value")
      .eq("journey_id", journeyId)
      .eq("data_key", "document_checklist_checked")
      .single();

    const checkedItems = savedChecklist?.data_value || [];

    return NextResponse.json({ success: true, data: checklist, checkedItems });
  } catch (error) {
    console.error("Error in document checklist API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const journeyId = params.id;
    const body = await request.json();
    const { checkedItems } = body;

    if (!Array.isArray(checkedItems)) {
      return NextResponse.json({ error: "Invalid checkedItems format" }, { status: 400 });
    }

    // Verify journey belongs to user
    const { data: journey, error: journeyError } = await supabase
      .from("journeys")
      .select("id")
      .eq("id", journeyId)
      .eq("user_id", user.id)
      .single();

    if (journeyError || !journey) {
      return NextResponse.json({ error: "Journey not found" }, { status: 404 });
    }

    // Upsert checked items to case_data
    const { error: upsertError } = await supabase
      .from("case_data")
      .upsert(
        {
          journey_id: journeyId,
          data_key: "document_checklist_checked",
          data_value: checkedItems,
          data_type: "array",
          label: "Document Checklist - Checked Items",
          description: "List of document keys that user has marked as checked in step 3_7",
          source: "tool_output",
          source_reference: "step_3_7",
          is_validated: true,
        },
        { onConflict: "journey_id,data_key" }
      );

    if (upsertError) {
      console.error("Error saving checklist state:", upsertError);
      return NextResponse.json({ error: "Failed to save checklist state" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in document checklist POST:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
