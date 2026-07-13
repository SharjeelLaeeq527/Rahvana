import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function checkDatabase() {
  console.log("Checking database...");

  const { data: bookings, error: bookingsError } = await supabase
    .from("consultation_bookings")
    .select("*");

  if (bookingsError) {
    console.error("Error checking consultation_bookings:", bookingsError.message);
  } else {
    console.log("consultation_bookings count:", bookings?.length);
    console.log("consultation_bookings data:", JSON.stringify(bookings, null, 2));
  }

  // Check time_slots
  const { data: slots, error: slotsError } = await supabase.from("time_slots").select("*");

  if (slotsError) {
    console.error("Error checking time_slots:", slotsError.message);
  } else {
    console.log("time_slots count:", slots?.length);
    console.log("time_slots data:", JSON.stringify(slots, null, 2));
  }
}

checkDatabase();
