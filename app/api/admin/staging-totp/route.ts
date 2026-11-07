// app/api/admin/staging-totp/route.ts
import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import { generateBase32Secret, getOtpAuthUri, verifyTOTP } from "@/lib/security/totp";
import { getAuthenticatedUser } from "@/lib/api/authGuards";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export async function POST(request: NextRequest) {
  try {
    // 1. Verify caller is authenticated admin
    const user = await getAuthenticatedUser();
    if (!user || !user.email || !ADMIN_EMAILS.includes(user.email.toLowerCase())) {
      return NextResponse.json(
        { error: "Unauthorized: Admin privileges required." },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));

    // Action A: Test 6-digit code against a secret directly (without setting any session cookie)
    if (body.action === "test_code") {
      const secret = String(body.secret || "").trim();
      const code = String(body.code || "").trim();

      if (!secret || !code) {
        return NextResponse.json(
          { error: "Secret and 6-digit code are required." },
          { status: 400 }
        );
      }

      const isValid = await verifyTOTP(code, secret, 1);
      return NextResponse.json({
        success: true,
        valid: isValid,
        message: isValid
          ? "Code verified successfully! Authenticator app is linked properly."
          : "Code did not match. Please ensure your device clock is synchronized and enter the current 6-digit code.",
      });
    }

    // Action B: Generate new Key & QR Code
    const username = String(body.username || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "");

    if (!username) {
      return NextResponse.json(
        { error: "A valid alphanumeric username is required (e.g. hammad, khashir)." },
        { status: 400 }
      );
    }

    // 2. Generate random 20-byte base32 secret
    const secret = generateBase32Secret(20);

    // 3. Build standard otpauth URI
    const otpUri = getOtpAuthUri(username, secret, "Rahvana Staging");

    // 4. Generate high-resolution scannable QR Code Data URL
    const qrCodeDataUrl = await QRCode.toDataURL(otpUri, {
      width: 280,
      margin: 2,
      color: {
        dark: "#0f172a",
        light: "#ffffff",
      },
      errorCorrectionLevel: "M",
    });

    const envConfigString = `${username}:${secret}`;

    return NextResponse.json({
      success: true,
      username,
      secret,
      otpUri,
      qrCodeDataUrl,
      envConfigString,
    });
  } catch (err) {
    console.error("[admin-staging-totp] Generation error:", err);
    return NextResponse.json(
      { error: "Failed to generate staging authenticator key." },
      { status: 500 }
    );
  }
}
