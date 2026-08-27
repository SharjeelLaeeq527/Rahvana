import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function testBooking() {
  console.log("Starting booking test...");
  const { consultationService } = await import("../lib/services/consultationService");
  
  // Choose an available slot: 2026-07-08 08:03:00 UTC
  const slotDate = new Date("2026-07-08T08:03:00.000Z");
  
  // 1. Check current status of the slot
  const { data: slotBefore, error: slotError } = await supabase
    .from("time_slots")
    .select("*")
    .eq("date", "2026-07-08")
    .eq("start_time", "08:03:00")
    .single();
    
  if (slotError) {
    console.error("Error fetching slot before test:", slotError);
    return;
  }
  console.log("Slot status before booking:", slotBefore.status); // should be "available"
  
  // 2. Call createBooking
  try {
    const booking = await consultationService.createBooking({
      issue_category: "marriage-certificate",
      visa_category: "IR-1 / CR-1",
      case_stage: "pre-filing",
      urgency: "normal",
      preferred_language: "English",
      full_name: "Test User",
      email: "testuser@example.com",
      whatsapp_phone: "+923001234567",
      embassy_consulate: "islamabad",
      case_summary: "This is a test case summary with more than twenty characters.",
      selected_slot: slotDate,
      payment_status: "paid",
      status: "pending_approval",
    });
    console.log("Booking created successfully, reference_id:", booking.reference_id);
    
    // 3. Check status of the slot after booking
    const { data: slotAfter, error: slotError2 } = await supabase
      .from("time_slots")
      .select("*")
      .eq("date", "2026-07-08")
      .eq("start_time", "08:03:00")
      .single();
      
    if (slotError2) {
      console.error("Error fetching slot after test:", slotError2);
      return;
    }
    console.log("Slot status after booking:", slotAfter.status); // should be "confirmed"
    
    // Clean up created booking
    const { error: deleteErr } = await supabase
      .from("consultation_bookings")
      .delete()
      .eq("id", booking.id);
    console.log("Cleaned up booking record. Error:", deleteErr);
    
    // Reset slot status to available
    const { error: updateErr } = await supabase
      .from("time_slots")
      .update({ status: "available" })
      .eq("id", slotBefore.id);
    console.log("Reset slot status back to available. Error:", updateErr);
  } catch (err) {
    console.error("Exception occurred during booking test:", err);
  }
}

testBooking();
