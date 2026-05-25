#!/usr/bin/env node

/**
 * Create a test config to verify database setup
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log("🧪 Testing config creation...\n");

// Get first user
const { data: users, error: usersError } = await supabase.auth.admin.listUsers();

if (usersError || !users || users.users.length === 0) {
  console.error("❌ No users found. Please create a user first.");
  process.exit(1);
}

const userId = users.users[0].id;
console.log("Using user ID:", userId);

// Create test config
const testConfig = {
  user_id: userId,
  visa_category: "IR-1",
  scenario_flags: { prior_marriage_petitioner: true },
  case_id: "TEST123",
  petitioner_name: "John Doe",
  beneficiary_name: "Jane Doe",
  joint_sponsor_name: null,
};

console.log("\nCreating config:", testConfig);

const { data: config, error: configError } = await supabase
  .from("document_vault_config")
  .upsert(testConfig)
  .select()
  .single();

if (configError) {
  console.error("❌ Error:", configError.message);
  process.exit(1);
}

console.log("✅ Config created successfully!");
console.log("Config:", config);

// Verify
const { data: verify, error: verifyError } = await supabase
  .from("document_vault_config")
  .select("*")
  .eq("user_id", userId)
  .single();

if (verifyError) {
  console.error("❌ Verification failed:", verifyError.message);
  process.exit(1);
}

console.log("\n✅ Verification successful!");
console.log("Saved config:", verify);
console.log("\n🎉 Config is working! Now refresh your browser and it should load.");
