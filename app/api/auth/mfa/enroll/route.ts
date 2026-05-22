import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check if user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check for existing unverified factors and remove them
    try {
      const { data: factorsData, error: factorsError } = await supabase.auth.mfa.listFactors();

      if (!factorsError && factorsData?.totp) {
        console.log(`Found ${factorsData.totp.length} existing TOTP factors`);

        // Only unenroll unverified factors
        for (const factor of factorsData.totp) {
          console.log(`Found factor: ${factor.id}, status: ${factor.status}`);

          if (factor.status.toLowerCase() === "unverified") {
            console.log(`Attempting to unenroll unverified factor: ${factor.id}`);

            const { error: unenrollError } = await supabase.auth.mfa.unenroll({
              factorId: factor.id,
            });

            if (unenrollError) {
              console.error(`Error unenrolling unverified factor ${factor.id}:`, unenrollError);
            } else {
              console.log(`Successfully unenrolled unverified factor: ${factor.id}`);
            }
          }
        }

        // Check if there are any verified factors already
        const verifiedFactors = factorsData.totp.filter(
          (f) => f.status.toLowerCase() === "verified"
        );
        if (verifiedFactors.length > 0) {
          console.log(`User already has ${verifiedFactors.length} verified TOTP factor(s)`);
          return NextResponse.json(
            { error: "User already has a verified TOTP factor enrolled" },
            { status: 400 }
          );
        }
      }
    } catch (listError) {
      console.error("Error listing factors:", listError);
    }

    // Enroll MFA factor with a friendly name
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: "Authenticator App",
    });

    if (error) {
      console.error("MFA enroll error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: {
        factorId: data.id,
        qrCode: data.totp.qr_code,
        secret: data.totp.secret,
        uri: data.totp.uri,
      },
    });
  } catch (error) {
    console.error("MFA enroll error:", error);
    return NextResponse.json({ error: "Failed to initiate MFA setup" }, { status: 500 });
  }
}
