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
]);

// When the document belongs to the beneficiary (foreign spouse) rather than the
// account holder, the same canonical OCR keys map onto MasterProfile.beneficiary.*
// (see types/profile.ts — beneficiary only carries name + dateOfBirth).
const BENEFICIARY_PATH_MAP: Record<string, string> = {
  "name.first": "beneficiary.name.first",
  "name.last": "beneficiary.name.last",
  dateOfBirth: "beneficiary.dateOfBirth",
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

    // "self" (default) writes to the top-level profile (the account holder /
    // petitioner). "beneficiary" remaps the same canonical keys onto beneficiary.*.
    const target = body?.target === "beneficiary" ? "beneficiary" : "self";

    // Build the delta from allow-listed, non-empty fields (encrypt sensitive ones).
    const delta: Record<string, unknown> = {};
    const written: string[] = [];
    for (const [path, raw] of Object.entries(fields)) {
      if (!ALLOWED_PATHS.has(path)) continue;
      if (raw === undefined || raw === null || String(raw).trim() === "") continue;

      // Beneficiary only carries name + dateOfBirth; skip keys that don't map.
      const targetPath = target === "beneficiary" ? BENEFICIARY_PATH_MAP[path] : path;
      if (!targetPath) continue;

      const value = String(raw).trim();
      // Sensitive encryption only applies to the account holder's own identifiers.
      const stored = target === "self" && SENSITIVE_KEYS.has(path) ? encrypt(value) : value;
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
