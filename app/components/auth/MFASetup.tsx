"use client";

import { useCallback, useEffect, useState } from "react";
import { msg, E, errorCode } from "@/lib/errors";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createBrowserClient } from "@supabase/ssr/dist/main/createBrowserClient";
import { useToast } from "../shared/ToastProvider";
import { Loader } from "@/components/ui/spinner";
import { MFACodeModal } from "../shared/MFACodeModal";
import { Copy, Check } from "lucide-react";

export function MFASetup() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { showToast } = useToast();
  const router = useRouter();

  const [step, setStep] = useState<"initial" | "qr" | "verify">("initial");
  const [qrCode, setQrCode] = useState<string>("");
  const [secret, setSecret] = useState<string>("");
  const [code, setCode] = useState<string>("");
  const [factorId, setFactorId] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [isDisableModalOpen, setIsDisableModalOpen] = useState(false);
  const [disableOTP, setDisableOTP] = useState<string>("");
  const [profile, setProfile] = useState<{ mfa_enabled: boolean } | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const { user, enableMFA, verifyMFASetup, disableMFASetup, listMFACheckFactors } = useAuth();

  const fetchProfile = useCallback(async () => {
    if (!user) return;

    setProfileLoading(true);

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("mfa_enabled")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching profile:", error.message);
        return;
      }

      if (data) {
        setProfile(data);
      }
    } catch (err) {
      console.error("Unexpected fetchProfile error:", err);
    } finally {
      setProfileLoading(false);
    }
  }, [supabase, user?.id]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleEnableMFA = async () => {
    setLoading(true);

    const result = await enableMFA();

    if (result.success && result.qrCode && result.secret && result.factorId) {
      setQrCode(result.qrCode);
      setSecret(result.secret);
      setFactorId(result.factorId);
      setStep("qr");
    } else {
      showToast(result.error || msg(E.AUTH_MFA_ENABLE_FAILED), "error");
    }

    setLoading(false);
  };

  const handleVerifyCode = async () => {
    if (!code.trim() || !factorId) {
      showToast(`${msg(E.AUTH_CLIENT_ENTER_VERIFICATION_CODE)}`, "error");
      return;
    }

    setLoading(true);

    try {
      const result = await verifyMFASetup(factorId, code);

      if (result.success) {
        showToast("Two-factor authentication has been enabled on your account.", "success");
        setTimeout(() => {
          router.replace("/settings");
        }, 800);

        return;
      } else {
        showToast(result.error || `${msg(E.AUTH_MFA_CODE_INVALID)}`, "error");
      }
    } catch {
      showToast(`${msg(E.AUTH_MFA_VERIFY_FAILED)}`, "error");
    }

    setLoading(false);
  };

  const handleDisableMFA = async () => {
    if (!disableOTP.trim()) {
      showToast(`${msg(E.AUTH_CLIENT_ENTER_VERIFICATION_CODE)}`, "error");
      return;
    }

    // Use the listMFACheckFactors function from auth context to get the factorId
    const { totp } = await listMFACheckFactors();
    let currentFactorId = factorId;

    // If we don't have factorId from state, try to get it from the list of factors
    if (!currentFactorId && totp && totp.length > 0) {
      currentFactorId = totp[0].id;
    }

    if (!currentFactorId) {
      showToast(`${msg(E.AUTH_MFA_FACTOR_NOT_FOUND)}`, "error");
      return;
    }

    setLoading(true);

    try {
      // Call the disable API
      const result = await disableMFASetup(currentFactorId, disableOTP);

      if (result.success) {
        // Close modal and reset state
        setIsDisableModalOpen(false);
        setDisableOTP("");
        showToast("Two-factor authentication has been disabled.", "success");

        await supabase.auth.signOut();

        router.replace("/login?mfaDisabled=true");

        return;
      } else {
        showToast(result.error || `${msg(E.AUTH_MFA_DISABLE_FAILED)}`, "error");
      }
    } catch {
      showToast(`${msg(E.AUTH_MFA_DISABLE_FAILED)}`, "error");
    }

    setLoading(false);
  };

  const handleCopySecret = () => {
    navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (profileLoading) {
    return (
      <div className="flex min-h-[240px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader size="md" />
          <span className="text-xs font-medium tracking-[0.18em] text-[#8284bf] uppercase">
            Loading security settings
          </span>
        </div>
      </div>
    );
  }

  if (step === "initial") {
    const enabled = !!profile?.mfa_enabled;

    return (
      <div className="mx-auto mt-8 w-full max-w-xl px-4 py-10 sm:py-16">
        <Card className="relative overflow-hidden rounded-3xl border border-[#0d7377]/15 bg-white p-0 shadow-[0_24px_60px_-30px_rgba(13,115,119,0.45)]">
          {/* Accent header */}
          <div className="relative overflow-hidden bg-[#0d7377] px-6 py-8 sm:px-9 sm:py-10">
            <div className="pointer-events-none absolute -top-16 -right-10 h-48 w-48 rounded-full bg-[#32e0c4]/25 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-20 left-10 h-40 w-40 rounded-full bg-[#8284bf]/30 blur-2xl" />

            <div className="relative flex items-center gap-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#32e0c4]/20 ring-1 ring-[#32e0c4]/40">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#32e0c4"
                  strokeWidth={1.8}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-6 w-6"
                  aria-hidden="true"
                >
                  <path d="M12 3l7 3.5v5c0 4.2-2.9 8-7 9.5-4.1-1.5-7-5.3-7-9.5v-5L12 3z" />
                  <path d="M9.5 12.2l1.8 1.8 3.4-3.6" />
                </svg>
              </div>

              <div className="min-w-0">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-[0.16em] uppercase ${
                    enabled
                      ? "bg-[#32e0c4]/20 text-[#32e0c4] ring-1 ring-[#32e0c4]/40"
                      : "bg-white/10 text-white/80 ring-1 ring-white/20"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${enabled ? "bg-[#32e0c4]" : "bg-[#c0596a]"}`}
                  />
                  {enabled ? "2FA Active" : "2FA Inactive"}
                </span>
                <h2 className="mt-2 truncate text-xl font-semibold tracking-tight text-white sm:text-2xl">
                  {enabled ? "Manage Two-Factor Auth" : "Setup Two-Factor Auth"}
                </h2>
              </div>
            </div>
          </div>

          <div className="px-6 py-4 sm:px-9">
            <p className="text-sm leading-relaxed text-black/70">
              {enabled
                ? "Control and update your existing two-factor authentication settings."
                : "Add an extra layer of security to your account with a time-based one-time code from your authenticator app."}
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {[
                { t: "Time-based codes", d: "Rotating 6-digit TOTP" },
                { t: "Device bound", d: "Codes live on your phone" },
                { t: "Phishing resistant", d: "Passwords alone won't do" },
              ].map((f) => (
                <div
                  key={f.t}
                  className="rounded-2xl border border-[#0d7377]/12 bg-[#0d7377]/[0.04] p-3.5"
                >
                  <p className="text-[13px] font-semibold text-black">{f.t}</p>
                  <p className="mt-1 text-[11px] leading-snug text-black/70">{f.d}</p>
                </div>
              ))}
            </div>

            {profile && !enabled && (
              <Button
                onClick={handleEnableMFA}
                disabled={loading}
                className="mt-7 h-12 w-full rounded-xl bg-[#0d7377] text-[15px] font-semibold text-white shadow-[0_12px_28px_-14px_rgba(13,115,119,0.9)] transition-all hover:bg-[#0a5f62] hover:shadow-[0_16px_32px_-14px_rgba(13,115,119,0.9)] disabled:opacity-60"
              >
                {loading ? "Setting up..." : "Enable 2FA"}
              </Button>
            )}

            {profile && enabled && (
              <Button
                onClick={() => setIsDisableModalOpen(true)}
                className="mt-7 h-12 w-full rounded-xl border border-[#c0596a]/30 bg-[#c0596a]/10 text-[15px] font-semibold text-[#c0596a] shadow-none transition-colors hover:bg-[#c0596a] hover:text-white"
              >
                Disable 2FA
              </Button>
            )}

            <p className="mt-4 text-center text-[11px] text-[#8284bf]">
              Works with Google Authenticator, 1Password, Authy and any TOTP app.
            </p>
          </div>

          {/* Disable MFA Modal */}
          <MFACodeModal
            open={isDisableModalOpen}
            onOpenChange={setIsDisableModalOpen}
            value={disableOTP}
            onValueChange={setDisableOTP}
            onSubmit={handleDisableMFA}
            loading={loading}
            error={error}
            title="Disable Two-Factor Authentication"
            description="Enter your current authentication code to disable 2FA."
            confirmText="Disable 2FA"
            loadingText="Disabling..."
            variant="danger"
          />
        </Card>
      </div>
    );
  }

  if (step === "qr") {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:py-14">
        <Card className="overflow-hidden rounded-3xl border border-[#0d7377]/15 bg-white p-0 shadow-[0_30px_80px_-40px_rgba(13,115,119,0.5)]">
          <div className="grid lg:grid-cols-[1.35fr_1fr]">
            {/* LEFT — light panel with all the info */}
            <div className="bg-white px-6 py-8 sm:px-10 sm:py-10">
              <span className="inline-flex items-center gap-2 rounded-full bg-[#0d7377]/8 px-3 py-1 text-[10px] font-semibold tracking-[0.18em] text-[#0d7377] uppercase ring-1 ring-[#0d7377]/15">
                Step 2 of 2
              </span>

              <h2 className="mt-4 text-2xl font-semibold tracking-tight text-[#0d7377] sm:text-3xl">
                Scan the QR code
              </h2>
              <p className="mt-2 max-w-lg text-sm leading-relaxed text-black/70">
                Open Google Authenticator (or any TOTP app), scan the code on the right, then enter
                the 6-digit code it generates to finish enabling 2FA.
              </p>

              {/* manual secret */}
              <div className="mt-8">
                <p className="text-[11px] font-semibold tracking-[0.16em] text-[#8284bf] uppercase">
                  Can&apos;t scan? Enter this key
                </p>

                <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-stretch sm:gap-3">
                  <div className="min-w-0 flex-1 rounded-xl border border-[#0d7377]/15 bg-[#0d7377]/[0.04] px-4 py-3">
                    <p className="font-mono text-[13px] leading-relaxed tracking-[0.14em] break-all text-black/70 sm:text-sm">
                      {secret.match(/.{1,4}/g)?.join(" ")}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopySecret}
                    className={`shrink-0 cursor-pointer rounded-xl p-3 transition-all ${
                      copied
                        ? "bg-[#32e0c4] text-[#0b3f41]"
                        : "bg-[#0d7377] text-white hover:bg-[#0a5f62]"
                    }`}
                    aria-label={copied ? "Copied" : "Copy secret"}
                    title={copied ? "Copied!" : "Copy"}
                  >
                    {copied ? <Check size={18} /> : <Copy size={18} />}
                  </button>
                </div>
              </div>

              {/* app downloads */}
              <div className="mt-7">
                <p className="text-sm font-semibold text-[#8284bf]">
                  Don&apos;t have Google Authenticator?
                </p>
                <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                  <a
                    href="https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 rounded-xl border border-[#0d7377]/15 bg-white px-4 py-3 text-center text-sm font-semibold text-[#0d7377] shadow-[0_6px_18px_-12px_rgba(13,115,119,0.6)] transition-colors hover:border-[#0d7377]/35 hover:bg-[#0d7377]/[0.05]"
                  >
                    Download for Android
                  </a>
                  <a
                    href="https://apps.apple.com/us/app/google-authenticator/id388497605"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 rounded-xl border border-[#8284bf]/25 bg-[#8284bf]/8 px-4 py-3 text-center text-sm font-semibold text-[#5f6199] transition-colors hover:bg-[#8284bf] hover:text-white"
                  >
                    Download for iOS
                  </a>
                </div>
              </div>

              <div className="mt-6 flex items-start gap-3 rounded-xl border border-[#8284bf]/25 bg-[#8284bf]/8 px-4 py-3">
                <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#8284bf] text-[11px] font-bold text-white">
                  i
                </span>
                <p className="text-[13px] leading-relaxed text-[#5f6199]">
                  Any TOTP-compatible authenticator app will work.
                </p>
              </div>

              {/* verify */}
              <div className="mt-8 rounded-2xl border border-[#0d7377]/12 bg-[#0d7377]/[0.03] p-5">
                <label className="text-[11px] font-semibold tracking-[0.16em] text-black uppercase">
                  Verification code
                </label>
                <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                  <Input
                    placeholder="000000"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    maxLength={6}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    className="h-12 flex-1 rounded-xl border-[#0d7377]/20 bg-white text-center font-mono text-lg tracking-[0.45em] text-[#0d7377] placeholder:text-[#0d7377]/25 focus-visible:border-[#32e0c4] focus-visible:ring-2 focus-visible:ring-[#32e0c4]/40 sm:text-left sm:tracking-[0.35em]"
                  />
                  <Button
                    onClick={handleVerifyCode}
                    disabled={loading || code.length !== 6 || !factorId}
                    className="h-12 rounded-xl bg-[#0d7377] px-7 text-[15px] font-semibold text-white shadow-[0_12px_28px_-14px_rgba(13,115,119,0.9)] transition-all hover:bg-[#0a5f62] disabled:opacity-50 disabled:shadow-none"
                  >
                    {loading ? "Verifying..." : "Verify Code"}
                  </Button>
                </div>
              </div>
            </div>

            {/* RIGHT — dark contrasted panel with QR only */}
            <div className="relative flex items-center justify-center overflow-hidden bg-[#0d7377] px-6 py-10 sm:px-10">
              <div className="pointer-events-none absolute -top-24 -right-16 h-64 w-64 rounded-full bg-[#32e0c4]/25 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-[#8284bf]/30 blur-3xl" />

              <div className="relative flex w-full max-w-xs flex-col items-center">
                <div className="rounded-3xl bg-white p-5 shadow-[0_24px_50px_-20px_rgba(0,0,0,0.5)] ring-1 ring-[#32e0c4]/30">
                  <img
                    src={qrCode}
                    alt="Scan this QR code with your authenticator app"
                    width={220}
                    height={220}
                    className="h-[220px] w-[220px] rounded-xl"
                  />
                </div>
                <p className="mt-6 text-center text-[11px] font-semibold tracking-[0.18em] text-[#32e0c4] uppercase">
                  Scan with your app
                </p>
                <p className="mt-2 text-center text-[13px] leading-relaxed text-white/70">
                  This code is unique to your account. Never share it with anyone.
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return null;
}
