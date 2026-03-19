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
import { NextResponse } from "next/server";
import { encrypt } from "@/lib/encryption";

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
] as const;

// Sensitive nested fields: { parentKey: [subKey, ...] }
const SENSITIVE_NESTED: Record<string, string[]> = {
  currentAddress:     ["street", "city", "state", "zipCode"],
  mailingAddress:     ["street", "city", "state", "zipCode"],
  father:             ["dateOfBirth"],
  mother:             ["dateOfBirth"],
  sponsor:            ["phone", "email"],
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
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ── 2. Parse incoming profile_details object ──────────────────────────────
    const body = await request.json();
    const profileDetails = body.profile_details as Record<string, unknown>;

    if (!profileDetails || typeof profileDetails !== "object") {
      return NextResponse.json({ error: "Invalid profile data" }, { status: 400 });
    }

    // ── 3. Encrypt sensitive fields ───────────────────────────────────────────
    const encryptedDetails = encryptProfileDetails(profileDetails);

    // ── 4. Upsert into user_profiles ──────────────────────────────────────────
    const { error: upsertError } = await supabase
      .from("user_profiles")
      .upsert(
        {
          id: user.id,
          profile_details: encryptedDetails,  // encrypted blob
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );

    if (upsertError) {
      console.error("[profile/complete] Upsert error:", upsertError);
      return NextResponse.json({ error: "Failed to save profile" }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Profile saved securely" });
  } catch (error) {
    console.error("[profile/complete] Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
