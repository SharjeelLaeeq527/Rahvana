const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Parse .env.local
const envPath = path.join(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.substring(1, value.length - 1);
    }
    env[match[1]] = value;
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase URL or Service Role Key in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log("Supabase connection established.");

  // Fetch profiles (without email column)
  console.log("\n--- USER PROFILES ---");
  const { data: profiles, error: profileError } = await supabase
    .from('user_profiles')
    .select('id, subscription_tier, profile_details');

  if (profileError) {
    console.error("Error fetching profiles:", profileError);
  } else {
    profiles.forEach(p => {
      console.log(`User ID: ${p.id}`);
      console.log(`Tier: ${p.subscription_tier}`);
      console.log(`Addons: ${JSON.stringify(p.profile_details?.purchased_addons ?? [])}`);
      console.log("-----------------------------------------");
    });
  }

  // Fetch feature usage before reset
  console.log("\n--- FEATURE USAGE BEFORE RESET ---");
  const { data: usages, error: usageError } = await supabase
    .from('feature_usage')
    .select('*');

  if (usageError) {
    console.error("Error fetching feature usage:", usageError);
  } else {
    console.log(JSON.stringify(usages, null, 2));
  }

  // Reset expert_consultation usage for all users to 0 (or delete the rows) to restore 2/2 credits
  console.log("\n--- RESETTING CREDITS ---");
  const { data: deleteRes, error: deleteError } = await supabase
    .from('feature_usage')
    .delete()
    .eq('feature_key', 'expert_consultation');

  if (deleteError) {
    console.error("Error deleting expert_consultation usage:", deleteError);
  } else {
    console.log("Successfully deleted/reset all expert_consultation usage rows. All Executive plan users now have 2/2 credits remaining!");
  }
}

main().catch(err => console.error("Unhandled error:", err));
