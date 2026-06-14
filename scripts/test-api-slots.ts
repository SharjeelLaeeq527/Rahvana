import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function testApiSlotsOverride() {
  console.log("Starting API Slots Dynamic Override Test...");
  const dateStr = "2026-07-08";
  const timeStr = "08:03:00";
  const slotDateTime = new Date(`${dateStr}T${timeStr}.000Z`);

  // Ensure the slot exists and its database status is "available"
  console.log("1. Ensuring time slot exists in DB as 'available'...");
  await supabase
    .from("time_slots")
    .update({ status: "available" })
    .eq("date", dateStr)
    .eq("start_time", timeStr);

  // Fetch slots from GET endpoint
  console.log("2. Querying GET /api/consultation/slots...");
  const getUrl = `http://localhost:3000/api/consultation/slots?date=${dateStr}`;
  const resBefore = await fetch(getUrl);
  const slotsBefore = await resBefore.json();
  const targetSlotBefore = slotsBefore.find(
    (s: any) => s.start_time === timeStr || s.start_time.startsWith(timeStr.substring(0, 5))
  );

  if (!targetSlotBefore) {
    console.error("Error: Time slot not returned by GET endpoint!");
    return;
  }
  console.log("GET /api/consultation/slots status before booking:", targetSlotBefore.status);

  // Insert a booking directly into consultation_bookings table
  // (We do not update the time_slots table status to simulate a sync discrepancy)
  console.log("3. Creating booking without updating slot status in database...");
  const newBooking = {
    issue_category: "translation",
    visa_category: "K-1",
    case_stage: "pre-filing",
    urgency: "normal",
    preferred_language: "English",
    full_name: "API Test User",
    email: "api-test@example.com",
    whatsapp_phone: "+1234567890",
    embassy_consulate: "islamabad",
    case_summary: "This is an API test case summary with enough length.",
    selected_slot: slotDateTime.toISOString(),
    reference_id: `REQ-API-${Math.floor(100000 + Math.random() * 900000)}`,
    status: "pending_approval",
    payment_status: "paid",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data: booking, error: insertErr } = await supabase
    .from("consultation_bookings")
    .insert([newBooking])
    .select()
    .single();

  if (insertErr) {
    console.error("Failed to insert booking for test:", insertErr);
    return;
  }
  console.log("Booking created. ID:", booking.id);

  // Double check that time_slots table still has status "available" (simulated sync issue)
  const { data: slotDb, error: dbErr } = await supabase
    .from("time_slots")
    .select("status")
    .eq("date", dateStr)
    .eq("start_time", timeStr)
    .single();
  console.log("Direct database time_slots table status (simulated sync issue):", slotDb?.status);

  // Fetch slots from GET endpoint again
  console.log("4. Querying GET /api/consultation/slots again...");
  const resAfter = await fetch(getUrl);
  const slotsAfter = await resAfter.json();
  const targetSlotAfter = slotsAfter.find(
    (s: any) => s.start_time === timeStr || s.start_time.startsWith(timeStr.substring(0, 5))
  );

  console.log("GET /api/consultation/slots status after booking:", targetSlotAfter?.status);

  // 5. Cleanup
  console.log("5. Cleaning up...");
  await supabase.from("consultation_bookings").delete().eq("id", booking.id);
  await supabase
    .from("time_slots")
    .update({ status: "available" })
    .eq("date", dateStr)
    .eq("start_time", timeStr);
  console.log("Cleanup complete!");
}

testApiSlotsOverride();
