import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testInsert() {
  console.log("Testing insertion into time_slots...");
  const newSlot = {
    date: new Date().toISOString().split("T")[0],
    start_time: "16:00",
    end_time: "17:00",
    status: "available",
    max_bookings: 1,
    current_bookings: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase.from("time_slots").insert([newSlot]).select();

  if (error) {
    console.error("Insertion error:", error.message);
  } else {
    console.log("Insertion success!", data);
  }
}

testInsert();
