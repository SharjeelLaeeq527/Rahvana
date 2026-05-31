#!/usr/bin/env node

/**
 * Simple migration script to create Document Vault tables
 * Run: node scripts/migrate-database.mjs
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, "..", ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing Supabase credentials in .env.local");
  console.error("   Need: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

console.log("🚀 Starting Database Migration...\n");

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Read migration SQL
const migrationPath = join(
  __dirname,
  "..",
  "supabase",
  "migrations",
  "create_document_vault_tables.sql"
);
const sql = readFileSync(migrationPath, "utf8");

console.log("📝 Migration SQL loaded from:", migrationPath);
console.log("\n" + "=".repeat(60));
console.log("PLEASE RUN THIS SQL IN YOUR SUPABASE SQL EDITOR:");
console.log("https://supabase.com/dashboard/project/dmetzudttdnlsagywdgu/sql/new");
console.log("=".repeat(60) + "\n");
console.log(sql);
console.log("\n" + "=".repeat(60));
console.log("\nAfter running the SQL, your Document Vault will be ready! ✅");
