#!/usr/bin/env node

/**
 * Script to run database migrations for Supabase
 * Usage: node scripts/run-migration.js
 */

const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log("📦 Running Document Vault migration...\n");

    // Read the migration file
    const migrationPath = path.join(
      __dirname,
      "..",
      "supabase",
      "migrations",
      "create_document_vault_tables.sql"
    );
    const migrationSQL = fs.readFileSync(migrationPath, "utf8");

    // Split by semicolons to execute statements separately
    const statements = migrationSQL
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith("--"));

    console.log(`Found ${statements.length} SQL statements to execute\n`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ";";

      // Skip comment-only statements
      if (statement.trim().startsWith("--")) continue;

      console.log(`Executing statement ${i + 1}/${statements.length}...`);

      const { error } = await supabase.rpc("exec_sql", { sql: statement });

      if (error) {
        // Try direct query if RPC fails
        const { error: queryError } = await supabase.from("_").select("*").limit(0);

        if (error.message.includes("function exec_sql")) {
          console.log(
            "⚠️  Note: exec_sql RPC not available. You may need to run this migration manually."
          );
          console.log("\nPlease run this SQL in your Supabase SQL Editor:");
          console.log("\n" + migrationSQL);
          process.exit(0);
        } else {
          console.error(`❌ Error:`, error.message);
          throw error;
        }
      }
    }

    console.log("\n✅ Migration completed successfully!");
    console.log("\nCreated tables:");
    console.log("  - document_vault_config");
    console.log("  - documents");
    console.log("\nYou can now use the document vault feature.");
  } catch (error) {
    console.error("\n❌ Migration failed:", error.message);
    console.error("\nPlease run the migration manually by:");
    console.error("1. Opening your Supabase dashboard");
    console.error("2. Going to SQL Editor");
    console.error("3. Running the SQL from: supabase/migrations/create_document_vault_tables.sql");
    process.exit(1);
  }
}

runMigration();
