import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log("🔍 Checking and registering 'adoption-guide'...");

const { data: existing, error: fetchError } = await supabase
  .from("guides")
  .select("id")
  .eq("slug", "adoption-guide")
  .maybeSingle();

if (fetchError) {
  console.error("❌ Error fetching guide:", fetchError.message);
  process.exit(1);
}

if (existing) {
  console.log("✅ 'adoption-guide' is already registered with ID:", existing.id);
} else {
  const { data: inserted, error: insertError } = await supabase
    .from("guides")
    .insert([
      {
        slug: "adoption-guide",
        title: "Adoptive Parent & Guardianship Guide",
        description: "USCIS adoption and guardianship eligibility, document requirements, and Pakistani system nuances.",
      }
    ])
    .select()
    .single();

  if (insertError) {
    console.error("❌ Error registering guide:", insertError.message);
    process.exit(1);
  }

  console.log("🎉 Successfully registered 'adoption-guide':", inserted);
}
