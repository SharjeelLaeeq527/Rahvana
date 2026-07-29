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
    setError("");

    const result = await enableMFA();

    if (result.success && result.qrCode && result.secret && result.factorId) {
      setQrCode(result.qrCode);
      setSecret(result.secret);
      setFactorId(result.factorId);
      setStep("qr");
    } else {
      setError(result.error || msg(E.AUTH_MFA_ENABLE_FAILED));
    }

    setLoading(false);
  };

  const handleVerifyCode = async () => {
    if (!code.trim() || !factorId) {
      setError(`${msg(E.AUTH_CLIENT_ENTER_VERIFICATION_CODE)}`);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await verifyMFASetup(factorId, code);

      if (result.success) {
        showToast("Two-factor authentication has been enabled on your account.", "success");
        setTimeout(() => {
          router.replace("/settings");
        }, 800);

        return;
      } else {
        setError(result.error || `${msg(E.AUTH_MFA_CODE_INVALID)}`);
      }
    } catch {
      setError(`${msg(E.AUTH_MFA_VERIFY_FAILED)}`);
    }

    setLoading(false);
  };

  const handleDisableMFA = async () => {
    if (!disableOTP.trim()) {
      setError(`${msg(E.AUTH_CLIENT_ENTER_VERIFICATION_CODE)}`);
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
      setError(`${msg(E.AUTH_MFA_FACTOR_NOT_FOUND)}`);
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
        setError(result.error || `${msg(E.AUTH_MFA_DISABLE_FAILED)}`);
      }
    } catch {
      setError(`${msg(E.AUTH_MFA_DISABLE_FAILED)}`);
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
            <h2 className="text-xl font-bold mb-4">Setup Two-Factor Authentication</h2>
            <p className="text-muted-foreground mb-6">
              Add an extra layer of security to your account by enabling two-factor authentication.
            </p>
          </>
        )}

        {profile && profile.mfa_enabled && (
          <>
            <h2 className="text-xl font-bold mb-4">Manage Two-Factor Authentication</h2>
            <p className="text-muted-foreground mb-6">
              Control and update your existing two-factor authentication settings.
            </p>
          </>
        )}

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {profile && !profile.mfa_enabled && (
          <Button onClick={handleEnableMFA} disabled={loading} className="w-full">
            {loading ? "Setting up..." : "Enable 2FA"}
          </Button>
        )}

        {profile && profile.mfa_enabled && (
          <Button onClick={() => setIsDisableModalOpen(true)} className="w-full">
            Disable 2FA
          </Button>
        )}

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
            If you can&apos;t scan the QR code, you can manually enter the secret key below:
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
              <span className="font-medium">Note:</span> Any TOTP-compatible authenticator app will
              work.
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
