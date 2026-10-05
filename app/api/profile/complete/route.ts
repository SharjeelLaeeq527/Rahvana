// POST /api/profile/complete
// Called by CompleteProfileForm (app/components/forms/auth/CompleteProfileForm.tsx)
//
// Previously the form saved profile_details directly via Supabase client
// (browser → Supabase). This meant SSN, CNIC, Passport etc. were stored
// in PLAIN TEXT — readable in the Supabase dashboard.
//
// Now: form sends data to THIS server-side route → we encrypt sensitive fields
// → then upsert encrypted blob into profile_details JSONB column.
// Owner sees only "gcm:..." strings — completely unreadable.

import { createClient } from "@/lib/supabase/server";
import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { encrypt } from "@/lib/encryption";
import { validateProfile } from "@/lib/profile/schema";
import type { MasterProfile } from "@/types/profile";

// Sensitive top-level string fields inside the MasterProfile object
const SENSITIVE_TOP_LEVEL = [
  "ssn",
  "cnic",
  "passportNumber",
  "passportIssueDate",
  "passportExpiry",
  "passportCountry",
  "alienNumber",
  "uscisAccountNumber",
  "annualIncome",
  "phone",
  "caseNumber",
  "nvcInvoice",
  "surname",
] as const;

// Sensitive nested fields: { parentKey: [subKey, ...] }
const SENSITIVE_NESTED: Record<string, string[]> = {
  currentAddress: ["street", "city", "state", "zipCode"],
  mailingAddress: ["street", "city", "state", "zipCode"],
  father: ["dateOfBirth"],
  mother: ["dateOfBirth"],
  // Keep in sync with app/api/profile/route.ts (GET decrypts the same keys).
  sponsor: [
    "phone",
    "email",
    "passportNumber",
    "passportIssueDate",
    "passportExpiry",
    "passportCountry",
    "ssn",
    "alienNumber",
    "uscisAccountNumber",
  ],
  beneficiary: ["passportNumber", "passportIssueDate", "passportExpiry", "passportCountry", "cnic"],
  naturalizationInfo: ["certificateNumber", "placeOfIssuance", "dateOfIssuance"],
};

function encryptProfileDetails(profile: Record<string, unknown>): Record<string, unknown> {
  const out = { ...profile };

  for (const field of SENSITIVE_TOP_LEVEL) {
    const val = out[field];
    if (val && typeof val === "string" && val.trim() !== "") {
      out[field] = encrypt(val);
    }
  }

  for (const [parentKey, subKeys] of Object.entries(SENSITIVE_NESTED)) {
    const parent = out[parentKey];
    if (parent && typeof parent === "object" && !Array.isArray(parent)) {
      const encParent = { ...(parent as Record<string, unknown>) };
      for (const subKey of subKeys) {
        const val = encParent[subKey];
        if (val && typeof val === "string" && val.trim() !== "") {
          encParent[subKey] = encrypt(val);
        }
      }
      out[parentKey] = encParent;
    }
  }

  return out;
}

export async function POST(request: Request) {
  try {
    // ── 1. Authenticate user ──────────────────────────────────────────────────
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ── 2. Parse incoming profile_details object ──────────────────────────────
    const body = await request.json();
    const profileDetails = body.profile_details as Record<string, unknown>;

    if (!profileDetails || typeof profileDetails !== "object") {
      return NextResponse.json({ error: "Invalid profile data" }, { status: 400 });
    }

    // ── 3. Validate (same Zod rules the client uses) ──────────────────────────
    // The client already blocks bad saves, but the server must not trust the
    // client — enforce the identical rules here before anything is written.
    const fieldErrors = validateProfile(profileDetails as unknown as MasterProfile);
    if (Object.keys(fieldErrors).length > 0) {
      return NextResponse.json({ error: "Validation failed", fieldErrors }, { status: 400 });
    }

    // ── 4. Encrypt sensitive fields ───────────────────────────────────────────
    const encryptedDetails = encryptProfileDetails(profileDetails);

    // ── 5. Save into user_profiles ────────────────────────────────────────────
    // const { data: existingProfile } = await supabase
    //   .from("user_profiles")
    //   .select("id")
    //   .eq("id", user.id)
    //   .maybeSingle();

    // let saveError;
    // if (existingProfile) {
    //   const { error } = await supabase
    //     .from("user_profiles")
    //     .update({
    //       profile_details: encryptedDetails,
    //       updated_at: new Date().toISOString(),
    //     })
    //     .eq("id", user.id);
    //   saveError = error;
    // } else {
    //   const { error } = await supabase.from("user_profiles").insert({
    //     id: user.id,
    //     subscription_tier: "core",
    //     subscription_status: "active",
    //     profile_details: encryptedDetails,
    //     created_at: new Date().toISOString(),
    //     updated_at: new Date().toISOString(),
    //   });
    //   saveError = error;
    // }

    // if (saveError) {
    //   console.error("[profile/complete] Save error:", saveError);
    //   return NextResponse.json({ error: "Failed to save profile" }, { status: 500 });

    // ── 5. Upsert into user_profiles ──────────────────────────────────────────
    // Use the service-role client so the upsert runs as `service_role`, not
    // `authenticated`. The trigger guard_user_profile_billing only blocks
    // authenticated role writes to subscription columns — service role bypasses it.
    // Authentication was already verified above; we only write non-subscription fields.
    const supabaseService = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { cookies: { getAll: () => [], setAll: () => {} } }
    );

    const { error: upsertError } = await supabaseService.from("user_profiles").upsert(
      {
        id: user.id,
        profile_details: encryptedDetails, // encrypted blob
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );

    if (upsertError) {
      console.error("[profile/complete] Upsert error:", upsertError);
      return NextResponse.json(
        { error: upsertError.message || "Failed to save profile" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: "Profile saved securely" });
  } catch (error) {
    console.error("[profile/complete] Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
