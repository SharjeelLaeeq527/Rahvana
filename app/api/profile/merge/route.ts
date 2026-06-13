import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { encrypt } from "@/lib/encryption";
import { E, msg } from "@/lib/errors";

// POST /api/profile/merge
// Deep-merges a small set of confirmed, canonical fields (e.g. from the passport
// OCR tool) into user_profiles.profile_details WITHOUT clobbering anything else.
//
// Keys are MasterProfile dot-paths ("name.first", "dateOfBirth", "passportNumber"…)
// exactly as produced by lib/document-ocr/passportParser.ts. Sensitive leaves are
// encrypted with the same "gcm:" scheme that GET /api/profile already decrypts.

// Top-level profile_details keys that GET /api/profile decrypts. Keep in sync.
const SENSITIVE_KEYS = new Set([
  "passportNumber",
  "passportExpiry",
  "passportCountry",
  "passportIssueDate",
  // GET /api/profile lists cnic in SENSITIVE_TOP_LEVEL — keep the write side in sync
  // so the OCR'd CNIC is encrypted at rest like the passport identifiers.
  "cnic",
]);

// Only these canonical paths may be written through this route (allow-list).
const ALLOWED_PATHS = new Set([
  "name.first",
  "name.last",
  "dateOfBirth",
  "sex",
  "nationality",
  "passportNumber",
  "passportExpiry",
  "passportCountry",
  // Marriage proof (NADRA MRC / Nikah Nama) → relationship.* on the top-level
  // profile. Feeds the I-130 (step 1.4) and DS-260 (step 2.3) consistency widgets.
  "relationship.marriageDate",
  "relationship.marriagePlace.city",
  "relationship.marriagePlace.country",
  // Civil identity docs (CNIC, birth certificate) for the applicant (self).
  "cnic",
  "placeOfBirth.city",
  "placeOfBirth.country",
  // Parents — from the birth certificate. Feed DS-260 Section 2 + I-130A.
  "father.name.first",
  "father.name.last",
  "mother.name.first",
  "mother.name.last",
]);

// When the document belongs to someone other than the account holder, the same
// canonical OCR keys remap onto that person's MasterProfile subsection
// (see types/profile.ts). "beneficiary" is a legacy subsection kept as a form
// fallback; "sponsor" is the US petitioner spouse.
const PERSON_KEYS = [
  "name.first",
  "name.last",
  "dateOfBirth",
  "nationality",
  "sex",
  "passportNumber",
  "passportExpiry",
  "passportCountry",
  "cnic",
  "placeOfBirth.city",
  "placeOfBirth.country",
] as const;

function buildPathMap(prefix: "beneficiary" | "sponsor"): Record<string, string> {
  const map: Record<string, string> = {};
  for (const key of PERSON_KEYS) map[key] = `${prefix}.${key}`;
  return map;
}

const TARGET_PATH_MAPS: Record<string, Record<string, string>> = {
  beneficiary: buildPathMap("beneficiary"),
  sponsor: buildPathMap("sponsor"),
};

function isObject(val: unknown): val is Record<string, unknown> {
  return val !== null && typeof val === "object" && !Array.isArray(val);
}

function setNestedProperty(obj: Record<string, unknown>, path: string, value: unknown): void {
  const keys = path.split(".");
  let current = obj;
  for (let i = 0; i < keys.length - 1; i += 1) {
    const key = keys[i];
    if (!isObject(current[key])) current[key] = {};
    current = current[key] as Record<string, unknown>;
  }
  current[keys[keys.length - 1]] = value;
}

function deepMerge(
  target: Record<string, unknown>,
  source: Record<string, unknown>
): Record<string, unknown> {
  for (const [key, value] of Object.entries(source)) {
    if (isObject(value)) {
      if (!isObject(target[key])) target[key] = {};
      deepMerge(target[key] as Record<string, unknown>, value);
    } else {
      target[key] = value;
    }
  }
  return target;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: msg(E.AUTH_UNAUTHORIZED) }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const fields = body?.fields;
    if (!isObject(fields)) {
      return NextResponse.json(
        { success: false, error: "Body must include a `fields` object." },
        { status: 400 }
      );
    }

    // "self" (default) writes to the top-level profile (the account holder =
    // the beneficiary). "beneficiary" / "sponsor" remap the same canonical keys
    // onto that person's subsection.
    const target =
      body?.target === "beneficiary" || body?.target === "sponsor" ? body.target : "self";

    // Build the delta from allow-listed, non-empty fields (encrypt sensitive ones).
    const delta: Record<string, unknown> = {};
    const written: string[] = [];
    for (const [path, raw] of Object.entries(fields)) {
      if (!ALLOWED_PATHS.has(path)) continue;
      if (raw === undefined || raw === null || String(raw).trim() === "") continue;

      // Subsections only carry biographic keys; skip keys that don't map.
      const targetPath = target === "self" ? path : TARGET_PATH_MAPS[target][path];
      if (!targetPath) continue;

      const value = String(raw).trim();
      // Sensitive identifiers are encrypted for every person — GET /api/profile
      // decrypts the matching subsection keys (SENSITIVE_NESTED).
      const stored = SENSITIVE_KEYS.has(path) ? encrypt(value) : value;
      setNestedProperty(delta, targetPath, stored);
      written.push(targetPath);
    }

    if (written.length === 0) {
      return NextResponse.json(
        { success: false, error: "No valid fields to save." },
        { status: 400 }
      );
    }

    // Fetch current profile_details, merge, write back.
    const { data: existing, error: fetchError } = await supabase
      .from("user_profiles")
      .select("profile_details")
      .eq("id", user.id)
      .maybeSingle();

    if (fetchError && fetchError.code !== "PGRST116") {
      console.error("[profile/merge] fetch failed:", fetchError);
      return NextResponse.json({ error: msg(E.PROFILE_FETCH_FAILED) }, { status: 500 });
    }

    const current = (existing?.profile_details || {}) as Record<string, unknown>;
    const merged = deepMerge({ ...current }, delta);

    const { error: upsertError } = await supabase.from("user_profiles").upsert(
      {
        id: user.id,
        profile_details: merged,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );

    if (upsertError) {
      console.error("[profile/merge] upsert failed:", upsertError);
      return NextResponse.json({ error: msg(E.PROFILE_SAVE_FAILED) }, { status: 500 });
    }

    return NextResponse.json({ success: true, saved: written });
  } catch (error) {
    console.error("[profile/merge] Unhandled error:", error);
    return NextResponse.json({ error: msg(E.PROFILE_SAVE_FAILED) }, { status: 500 });
  }
}
