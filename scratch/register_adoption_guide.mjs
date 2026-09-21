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

const slugsToRegister = [
  {
    slug: "adoptive-parent-guide",
    title: "Adoptive Parent & Guardianship Guide",
    description: "USCIS adoption and guardianship eligibility, document requirements, and Pakistani system nuances.",
  },
  {
    slug: "adoption-guide",
    title: "Adoptive Parent & Guardianship Guide",
    description: "USCIS adoption and guardianship eligibility, document requirements, and Pakistani system nuances.",
  },
];

for (const item of slugsToRegister) {
  console.log(`🔍 Checking and registering '${item.slug}'...`);
  const { data: existing, error: fetchError } = await supabase
    .from("guides")
    .select("id")
    .eq("slug", item.slug)
    .maybeSingle();

  if (fetchError) {
    console.error(`❌ Error fetching guide '${item.slug}':`, fetchError.message);
    continue;
  }

  if (existing) {
    console.log(`✅ '${item.slug}' is already registered with ID:`, existing.id);
  } else {
    const { data: inserted, error: insertError } = await supabase
      .from("guides")
      .insert([item])
      .select()
      .single();

    if (insertError) {
      console.error(`❌ Error registering guide '${item.slug}':`, insertError.message);
    } else {
      console.log(`🎉 Successfully registered '${item.slug}':`, inserted);
    }
  }
}
