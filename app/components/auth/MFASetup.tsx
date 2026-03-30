"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createBrowserClient } from "@supabase/ssr/dist/main/createBrowserClient";
import { useToast } from "../shared/ToastProvider";
import { Loader } from "@/components/ui/spinner";

export function MFASetup() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

  const {
    user,
    enableMFA,
    verifyMFASetup,
    disableMFASetup,
    listMFACheckFactors,
  } = useAuth();

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
    setError("");

    const result = await enableMFA();

    if (result.success && result.qrCode && result.secret && result.factorId) {
      setQrCode(result.qrCode);
      setSecret(result.secret);
      setFactorId(result.factorId);
      setStep("qr");
    } else {
      setError(result.error || "Failed to enable MFA");
    }

    setLoading(false);
  };

  const handleVerifyCode = async () => {
    if (!code.trim() || !factorId) {
      setError("Please enter the verification code");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await verifyMFASetup(factorId, code);

      if (result.success) {
        showToast(
          "Two-factor authentication has been enabled on your account.",
          "success",
        );
        setTimeout(() => {
          router.replace("/settings");
        }, 800);

        return;
      } else {
        setError(result.error || "Invalid verification code");
      }
    } catch {
      setError("Failed to verify MFA setup");
    }

    setLoading(false);
  };

  const handleDisableMFA = async () => {
    if (!disableOTP.trim()) {
      setError("Please enter the authentication code");
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
      setError("Unable to identify MFA factor to disable");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Call the disable API
      const result = await disableMFASetup(currentFactorId, disableOTP);

      if (result.success) {
        // Close modal and reset state
        setIsDisableModalOpen(false);
        setDisableOTP("");
        setError("");
        showToast("Two-factor authentication has been disabled.", "success");

        await supabase.auth.signOut();

        router.replace("/login?mfaDisabled=true");

        return;
      } else {
        setError(result.error || "Failed to disable MFA");
      }
    } catch {
      setError("Failed to disable MFA");
    }

    setLoading(false);
  };

  if (profileLoading) {
    return (
      <div className="flex justify-center items-center">
        <Loader size="md" />
      </div>
    );
  }

  if (step === "initial") {
    return (
      <Card className="p-4 sm:p-6 max-w-md w-full mx-auto">
        {profile && !profile.mfa_enabled && (
          <>
            <h2 className="text-xl font-bold mb-4">
              Setup Two-Factor Authentication
            </h2>
            <p className="text-muted-foreground mb-6">
              Add an extra layer of security to your account by enabling
              two-factor authentication.
            </p>
          </>
        )}

        {profile && profile.mfa_enabled && (
          <>
            <h2 className="text-xl font-bold mb-4">
              Manage Two-Factor Authentication
            </h2>
            <p className="text-muted-foreground mb-6">
              Control and update your existing two-factor authentication
              settings.
            </p>
          </>
        )}

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {profile && !profile.mfa_enabled && (
          <Button
            onClick={handleEnableMFA}
            disabled={loading}
            className="w-full"
          >
            {loading ? "Setting up..." : "Enable 2FA"}
          </Button>
        )}

        {profile && profile.mfa_enabled && (
          <Button
            onClick={() => setIsDisableModalOpen(true)}
            className="w-full"
          >
            Disable 2FA
          </Button>
        )}

        {/* Disable MFA Modal */}
        {isDisableModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-2xl shadow-xl border border-border w-full max-w-md overflow-hidden">
              {/* Header */}
              <div className="px-4 sm:px-6 pt-5 sm:pt-6 pb-4 border-b border-border">
                <div className="flex items-start sm:items-center gap-3 mb-2">
                  <div className="w-10 h-10 shrink-0 rounded-full bg-destructive/10 flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-destructive"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">
                    Disable Two-Factor Authentication
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Enter your current authentication code to disable 2FA
                </p>
              </div>

              {/* Body */}
              <div className="px-4 sm:px-6 py-5 sm:py-6">
                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">
                      Authentication Code
                    </label>
                    <Input
                      type="text"
                      value={disableOTP}
                      onChange={(e) => setDisableOTP(e.target.value)}
                      placeholder="Enter 6-digit code"
                      maxLength={6}
                      disabled={loading}
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter the code from your authenticator app
                    </p>
                  </div>

                  {error && (
                    <div className="flex items-start gap-3 p-4 bg-destructive/5 border border-destructive/20 rounded-xl">
                      <svg
                        className="w-5 h-5 text-destructive shrink-0 mt-0.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <p className="text-sm text-destructive">{error}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="px-4 sm:px-6 py-4 bg-muted/20 border-t border-border flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDisableModalOpen(false);
                    setDisableOTP("");
                    setError("");
                  }}
                  disabled={loading}
                  className="h-11 rounded-xl px-6 w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDisableMFA}
                  disabled={loading || disableOTP.trim().length !== 6}
                  className="h-11 rounded-xl px-10 w-full sm:w-auto bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                >
                  {loading ? "Disabling..." : "Disable 2FA"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>
    );
  }

  if (step === "qr") {
    return (
      <Card className="p-4 sm:p-6 mt-10 sm:mt-20 mb-10 sm:mb-16 max-w-md w-full mx-auto">
        <h2 className="text-xl font-bold text-center">Scan QR Code</h2>
        <p className="text-muted-foreground font-medium">
          Scan this QR code with Google Authenticator:
        </p>

        <div className="flex justify-center my-6">
          <img
            src={qrCode}
            alt="Scan this QR code with your authenticator app"
            width={200}
            height={200}
            className="border-4 border-muted/20 rounded-lg p-4 max-w-xs bg-white shadow-sm"
          />
        </div>

        <div className="mb-6">
          <p className="text-sm text-muted-foreground font-medium mb-2">
            If you can&apos;t scan the QR code, you can manually enter the
            secret key below:
          </p>

          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2 sm:gap-3">
            <div className="flex-1">
              <div className="font-mono text-center sm:text-left text-xs sm:text-sm bg-muted p-3 rounded border border-border break-all">
                {secret.match(/.{1,4}/g)?.join(" ")}
              </div>
            </div>
            <button
              onClick={(e) => {
                navigator.clipboard.writeText(secret);
                const button = e.currentTarget as HTMLButtonElement;
                const originalText = button.textContent;
                button.textContent = "Copied!";
                setTimeout(() => {
                  button.textContent = originalText;
                }, 2000);
              }}
              className="p-3 bg-muted w-full sm:w-auto cursor-pointer hover:bg-muted/80 rounded text-sm font-medium transition-colors"
            >
              Copy
            </button>
          </div>

          <div className="mt-4">
            <p className="text-sm font-medium text-foreground mb-2">
              Don&apos;t have Google Authenticator?
            </p>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
              <a
                href="https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 w-full text-center bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm font-medium shadow-sm"
              >
                Download for Android
              </a>
              <a
                href="https://apps.apple.com/us/app/google-authenticator/id388497605"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 w-full text-center bg-foreground text-background rounded-lg hover:bg-foreground/90 transition-colors text-sm font-medium shadow-sm"
              >
                Download for iOS
              </a>
            </div>
          </div>

          <div className="mt-4 p-3 bg-blue-50/10 rounded-lg border border-blue-200/20">
            <p className="text-sm text-blue-600">
              <span className="font-medium">Note:</span> Any TOTP-compatible
              authenticator app will work.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <Input
            placeholder="Enter 6-digit code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            maxLength={6}
            className="w-full"
          />

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            onClick={handleVerifyCode}
            disabled={loading || code.length !== 6 || !factorId}
            className="w-full"
          >
            {loading ? "Verifying..." : "Verify Code"}
          </Button>
        </div>
      </Card>
    );
  }

  return null;
}
