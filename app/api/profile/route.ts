import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { encrypt, decrypt } from "@/lib/encryption";

// ─────────────────────────────────────────────────────────────────────────────
// SENSITIVE FIELDS — these are encrypted before DB write and decrypted on read
// Top-level string fields inside profile_details JSONB that are sensitive.
// ─────────────────────────────────────────────────────────────────────────────
const SENSITIVE_TOP_LEVEL = [
  "ssn",             // US Social Security Number ← most critical
  "cnic",            // Pakistani National ID
  "passportNumber",
  "passportIssueDate",
  "passportExpiry",
  "passportCountry",
  "alienNumber",     // A-Number
  "uscisAccountNumber",
  "annualIncome",
  "phone",
] as const;

// Nested objects where every leaf-string should be encrypted
// Format: { parentKey: ["subKey1", "subKey2"] }
const SENSITIVE_NESTED: Record<string, string[]> = {
  currentAddress:   ["street", "city", "state", "zipCode", "country"],
  mailingAddress:   ["street", "city", "state", "zipCode", "country"],
  father:           ["dateOfBirth"],
  mother:           ["dateOfBirth"],
  sponsor:          ["phone", "email"],
  naturalizationInfo: ["certificateNumber", "placeOfIssuance", "dateOfIssuance"],
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers to encrypt / decrypt a profile_details object
// ─────────────────────────────────────────────────────────────────────────────
function encryptProfileDetails(profile: Record<string, unknown>): Record<string, unknown> {
  const out = { ...profile };

  // Top-level sensitive string fields
  for (const field of SENSITIVE_TOP_LEVEL) {
    const val = out[field];
    if (val && typeof val === "string" && val.trim() !== "") {
      out[field] = encrypt(val);
    }
  }

  // Nested sensitive fields
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

function decryptProfileDetails(profile: Record<string, unknown>): Record<string, unknown> {
  const out = { ...profile };

  // Top-level
  for (const field of SENSITIVE_TOP_LEVEL) {
    const val = out[field];
    if (val && typeof val === "string" && val.startsWith("gcm:")) {
      out[field] = decrypt(val);
    }
  }

  // Nested
  for (const [parentKey, subKeys] of Object.entries(SENSITIVE_NESTED)) {
    const parent = out[parentKey];
    if (parent && typeof parent === "object" && !Array.isArray(parent)) {
      const decParent = { ...(parent as Record<string, unknown>) };
      for (const subKey of subKeys) {
        const val = decParent[subKey];
        if (val && typeof val === "string" && val.startsWith("gcm:")) {
          decParent[subKey] = decrypt(val);
        }
      }
      out[parentKey] = decParent;
    }
  }

  return out;
}

// ─────────────────────────────────────────────────────────────────────────────
// Also encrypt the flat columns (used by the older profile API flow)
// ─────────────────────────────────────────────────────────────────────────────
function encryptFlatColumn(value: string | undefined | null): string | null {
  if (!value || value.trim() === "") return null;
  return encrypt(value);
}

function decryptFlatColumn(value: string | undefined | null): string | null {
  if (!value) return null;
  if (value.startsWith("gcm:")) return decrypt(value);
  return value; // legacy plain-text — return as-is
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/profile
// ─────────────────────────────────────────────────────────────────────────────
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error("[Profile API] Error fetching profile:", profileError);
      return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
    }

    if (!profile) {
      return NextResponse.json({ profile: null, profileCompleted: false });
    }

    // ── Decrypt flat columns ──────────────────────────────────────────────────
    const decryptedProfile = {
      ...profile,
      ssn:             decryptFlatColumn(profile.ssn),
      cnic:            decryptFlatColumn(profile.cnic),
      passport_number: decryptFlatColumn(profile.passport_number),
      phone_number:    decryptFlatColumn(profile.phone_number),
      father_name:     decryptFlatColumn(profile.father_name),
      mother_name:     decryptFlatColumn(profile.mother_name),
      spouse_name:     decryptFlatColumn(profile.spouse_name),
      annual_income:   decryptFlatColumn(profile.annual_income),
      physical_address: profile.physical_address
        ? decryptFlatColumn(JSON.stringify(profile.physical_address))
        : null,
    };

    // ── Decrypt profile_details JSONB blob ────────────────────────────────────
    if (decryptedProfile.profile_details && typeof decryptedProfile.profile_details === "object") {
      decryptedProfile.profile_details = decryptProfileDetails(
        decryptedProfile.profile_details as Record<string, unknown>
      );
    }

    return NextResponse.json({
      profile: decryptedProfile,
      profileCompleted: profile.profile_completed || false,
    });
  } catch (error) {
    console.error("[Profile API] Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/profile  — save (encrypt) profile data
// Called by the profile page form (NOT the CompleteProfileForm which uses
// the /api/profile/complete route below)
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // ── Encrypt sensitive flat columns before writing to DB ───────────────────
    const profileData = {
      id: user.id,
      full_legal_name:     body.fullLegalName,         // name is low-sensitivity
      date_of_birth:       body.dateOfBirth,
      place_of_birth:      body.placeOfBirth,
      nationality:         body.nationality,
      phone_number:        encryptFlatColumn(body.phoneNumber),
      cnic:                encryptFlatColumn(body.cnic),
      passport_number:     encryptFlatColumn(body.passportNumber),
      passport_expiry:     body.passportExpiry,
      physical_address:    body.physicalAddress,
      contact_info:        body.contactInfo,
      father_name:         encryptFlatColumn(body.fatherName),
      father_dob:          body.fatherDOB,
      mother_name:         encryptFlatColumn(body.motherName),
      mother_dob:          body.motherDOB,
      spouse_name:         encryptFlatColumn(body.spouseName),
      spouse_dob:          body.spouseDOB,
      siblings_count:      body.siblingsCount  ? parseInt(body.siblingsCount)  : null,
      children_count:      body.childrenCount  ? parseInt(body.childrenCount)  : null,
      visa_status:         body.visaStatus,
      petitioner_name:     body.petitionerName,
      case_number:         body.caseNumber,
      travel_history:      body.travelHistory,
      education_level:     body.educationLevel,
      schools_attended:    body.schoolsAttended,
      current_employer:    body.currentEmployer,
      employer_address:    body.employerAddress,
      position:            body.position,
      start_date:          body.startDate,
      previous_employers:  body.previousEmployers,
      employment_gaps:     body.employmentGaps,
      annual_income:       encryptFlatColumn(body.annualIncome?.toString()),
      ssn:                 encryptFlatColumn(body.ssn),
      sponsor_details:     body.sponsorDetails,
      bank_statement:      body.bankStatement,
      residence_history:   body.residenceHistory,
      countries_visited:   body.countriesVisited,
      long_term_stays:     body.longTermStays,
      profile_completed:   true,
      completed_at:        new Date().toISOString(),
    };

    // Check if profile exists
    const { data: existingProfile } = await supabase
      .from("user_profiles")
      .select("id")
      .eq("id", user.id)
      .single();

    let result;
    if (existingProfile) {
      result = await supabase
        .from("user_profiles")
        .update(profileData)
        .eq("id", user.id)
        .select()
        .single();
    } else {
      result = await supabase
        .from("user_profiles")
        .insert([profileData])
        .select()
        .single();
    }

    if (result.error) {
      console.error("Error saving profile:", result.error);
      return NextResponse.json({ error: "Failed to save profile" }, { status: 500 });
    }

    return NextResponse.json({
      message: "Profile saved successfully",
      profile: result.data,
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
