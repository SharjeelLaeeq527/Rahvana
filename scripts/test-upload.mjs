#!/usr/bin/env node

/**
 * Test document upload API directly
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log("🧪 Testing database operations...\n");

// Test 1: Get all documents
console.log("Test 1: Fetching documents...");
const { data: allDocs, error: listError } = await supabase.from("documents").select("*");

if (listError) {
  console.log("❌ Error:", listError.message);
  console.log("   Code:", listError.code);
} else {
  console.log("✅ Success! Found", allDocs.length, "documents");
}

// Test 2: Get config
console.log("\nTest 2: Fetching config...");
const { data: configs, error: configError } = await supabase
  .from("document_vault_config")
  .select("*");

if (configError) {
  console.log("❌ Error:", configError.message);
  console.log("   Code:", configError.code);
} else {
  console.log("✅ Success! Found", configs.length, "configs");
}

console.log("\n");
