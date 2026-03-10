"use client";

import { useState, FormEvent, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Loader } from "@/components/ui/spinner";

function AdminLoginPageContent() {
  const router = useRouter();
  const { signIn, user, isLoading, isAdmin, verifyMFALogin, mfaPending } =
    useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [factorId, setFactorId] = useState("");
  const [challengeId, setChallengeId] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const searchParams = useSearchParams();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    const {
      error,
      mfaRequired: isMfaRequired,
      factorId: fId,
      challengeId: cId,
    } = await signIn(email, password);

    if (error) {
      setError("Invalid admin credentials");
      setIsSubmitting(false);
      return;
    }

    if (isMfaRequired && fId && cId) {
      // MFA is required
      setMfaRequired(true);
      setFactorId(fId);
      setChallengeId(cId);
      setSuccess("Please enter your authentication code");
      setIsSubmitting(false);
      return;
    }

    // ✅ Session cookie browser me set ho chuki hoti hai
    // 🔁 Middleware + AuthContext handle kar lenge
    router.replace("/admin");
  };

  const handleMfaSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const { success, error: mfaError } = await verifyMFALogin(
        factorId,
        challengeId,
        mfaCode,
      );

      if (success) {
        router.replace("/admin");
      } else {
        setError(mfaError || "Invalid authentication code");
      }
    } catch {
      setError("Failed to verify authentication code");
    } finally {
      setIsSubmitting(false);
    }
  };
  // 🔁 Already logged-in admin → redirect
  useEffect(() => {
    const confirmedParam = searchParams.get("confirmed");
    // Only redirect if user is logged in, is admin, and MFA is not pending
    if (!isLoading && user && isAdmin && !mfaPending) {
      router.replace("/admin");
    }
    if (confirmedParam === "true") {
      setSuccess("Email confirmed successfully! You can now sign in.");
    }
  }, [isLoading, user, isAdmin, mfaPending, router, searchParams]);

  // ⏳ Loading state
  if (isLoading) {
    return (
      <Loader fullScreen text="Checking session..." />
    );
  }

  return (
    <>
      <Card className="max-w-lg mt-20 mx-3 md:mx-auto p-6 bg-card shadow-lg border-border rounded-2xl">
        <h1 className="text-2xl font-bold mb-6 text-center">Admin Login</h1>
        {mfaRequired ? (
          <form onSubmit={handleMfaSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">
                Authentication Code
              </label>
              <Input
                type="text"
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value)}
                placeholder="Enter 6-digit code"
                maxLength={6}
                required
                disabled={isSubmitting}
                className="h-12 rounded-xl border-border focus:border-primary focus:ring-primary"
              />
              <p className="text-sm text-muted-foreground">
                Enter the code from your authenticator app
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-red-500 shrink-0 mt-0.5"
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
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting || mfaCode.length !== 6}
              className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-medium rounded-xl transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader size="sm" text="Verifying..." />
              ) : (
                "Verify Code"
              )}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">
                Email Address
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                disabled={isSubmitting}
                className="h-12 rounded-xl border-border focus:border-primary focus:ring-primary"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-foreground">
                  Password
                </label>
              </div>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  disabled={isSubmitting}
                  className="h-12 rounded-xl border-border focus:border-primary focus:ring-primary pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Success Message */}
            {success && (
              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <p className="text-sm text-emerald-700">{success}</p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-red-500 shrink-0 mt-0.5"
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
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-medium rounded-xl transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
              <Loader size="sm" text="Signing in..." />
            ) : (
                "Sign In"
              )}
            </Button>
          </form>
        )}
      </Card>
    </>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader size="md" text="Checking session..." />
        </div>
      }
    >
      <AdminLoginPageContent />
    </Suspense>
  );
}
