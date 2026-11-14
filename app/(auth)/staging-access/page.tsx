// app/(auth)/staging-access/page.tsx
"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Shield, KeyRound, Smartphone, AlertCircle, CheckCircle2, Lock, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader } from "@/components/ui/spinner";

function StagingAccessGateContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/";

  const [username, setUsername] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [lockoutRemaining, setLockoutRemaining] = useState<number>(0);

  // Auto-focus username and restore lockout if active
  useEffect(() => {
    const savedUser = localStorage.getItem("rahvana_staging_last_user");
    if (savedUser) {
      setUsername(savedUser);
    }

    const savedUntil = sessionStorage.getItem("rahvana_staging_locked_until");
    if (savedUntil) {
      const remaining = Math.ceil((parseInt(savedUntil, 10) - Date.now()) / 1000);
      if (remaining > 0) {
        setLockoutRemaining(remaining);
      } else {
        sessionStorage.removeItem("rahvana_staging_locked_until");
      }
    }
  }, []);

  // Tick down lockout timer
  useEffect(() => {
    if (lockoutRemaining <= 0) return;

    const timer = setInterval(() => {
      setLockoutRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          sessionStorage.removeItem("rahvana_staging_locked_until");
          setError(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [lockoutRemaining]);

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutRemaining > 0) return;
    setError(null);

    const cleanUser = username.trim();
    const cleanCode = code.trim().replace(/\s+/g, "");

    if (!cleanUser) {
      setError("Please enter your team member username.");
      return;
    }

    if (cleanCode.length !== 6 || !/^\d+$/.test(cleanCode)) {
      setError("Please enter the full 6-digit code from your authenticator app.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/staging-auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: cleanUser, code: cleanCode }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (response.status === 429 || data.locked) {
          const seconds = Number(data.retryAfterSeconds) || 15 * 60;
          setLockoutRemaining(seconds);
          sessionStorage.setItem(
            "rahvana_staging_locked_until",
            String(Date.now() + seconds * 1000)
          );
        }
        setError(
          data.error ||
            data.message ||
            "Authentication failed. Please verify your code and try again."
        );
        setLoading(false);
        return;
      }

      // Success! Clear any local lockout trace and save username
      sessionStorage.removeItem("rahvana_staging_locked_until");
      localStorage.setItem("rahvana_staging_last_user", cleanUser);
      setSuccess(true);

      // Brief delay for checkmark feedback before redirect
      setTimeout(() => {
        window.location.href = redirectTo.startsWith("/") ? redirectTo : "/";
      }, 700);
    } catch (err) {
      console.error("Staging verification error:", err);
      setError("A network error occurred. Please check your connection and try again.");
      setLoading(false);
    }
  };

  const isFormDisabled = loading || success || lockoutRemaining > 0;

  return (
    <div className="mt-[55px] flex items-center justify-center bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 p-4 sm:p-6">
      <Card className="w-full max-w-md rounded-3xl border border-teal-500/20 bg-white/95 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
        {/* Header Icon */}
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-teal-500/20 bg-teal-500/10 text-teal-600 shadow-inner">
            <Shield className="h-8 w-8" />
          </div>

          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-teal-200/60 bg-teal-50 px-3 py-1 text-xs font-semibold tracking-wide text-teal-700 uppercase">
            <Lock className="h-3.5 w-3.5" />
            Staging Environment
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Authenticator Access Gate
          </h1>

          <p className="mt-2 max-w-xs text-sm text-slate-600">
            Open <span className="font-semibold text-slate-800">Google Authenticator</span> or{" "}
            <span className="font-semibold text-slate-800">Microsoft Authenticator</span> to get
            your 6-digit access code.
          </p>
        </div>

        {/* Lockout Countdown Alert */}
        {lockoutRemaining > 0 ? (
          <div className="mt-5 rounded-2xl border border-red-300 bg-red-50 p-4 text-red-900 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-200/80 text-red-700">
                <Clock className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold tracking-wider text-red-800 uppercase">
                    Security Lockout Active
                  </h4>
                  <span className="font-mono text-xs font-bold text-red-700">
                    {formatCountdown(lockoutRemaining)}
                  </span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-red-700">
                  8 failed attempts reached. Access is locked for 15 minutes to protect the
                  staging environment.
                </p>
              </div>
            </div>
          </div>
        ) : error ? (
          /* Error Alert */
          <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <p className="leading-snug">{error}</p>
          </div>
        ) : null}

        {/* Success Alert */}
        {success && (
          <div className="mt-5 flex items-center gap-2.5 rounded-xl border border-teal-200 bg-teal-50 p-3.5 text-sm text-teal-800">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-teal-600" />
            <p className="font-medium">Code verified! Unlocking staging platform...</p>
          </div>
        )}

        {/* Verification Form */}
        <form onSubmit={handleVerify} className="mt-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold tracking-wider text-slate-700 uppercase">
              Team Member Username
            </label>
            <div className="relative">
              <KeyRound className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                disabled={isFormDisabled}
                autoComplete="username"
                className="h-11 rounded-xl border-slate-200 bg-slate-50/50 pl-10 font-medium text-slate-900 focus:bg-white disabled:opacity-60"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold tracking-wider text-slate-700 uppercase">
              6-Digit Authenticator Code
            </label>
            <div className="relative">
              <Smartphone className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                type="text"
                placeholder="000 000"
                maxLength={6}
                inputMode="numeric"
                autoComplete="one-time-code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                disabled={isFormDisabled}
                className="h-12 rounded-xl border-slate-200 bg-slate-50/50 pl-10 text-center font-mono text-xl font-semibold tracking-[0.3em] text-slate-900 focus:bg-white disabled:opacity-60 sm:text-left sm:tracking-[0.25em]"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={isFormDisabled}
            className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-teal-600 text-base font-semibold text-white shadow-lg shadow-teal-700/20 transition-all hover:bg-teal-700 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader />
                <span>Verifying Code...</span>
              </>
            ) : success ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-white" />
                <span>Access Granted</span>
              </>
            ) : lockoutRemaining > 0 ? (
              <span className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>Locked ({formatCountdown(lockoutRemaining)})</span>
              </span>
            ) : (
              <span>Unlock Staging</span>
            )}
          </Button>
        </form>

      </Card>
    </div>
  );
}

export default function StagingAccessGate() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-900">
          <Loader size="md" text="Loading Staging Gate..." className="text-white" />
        </div>
      }
    >
      <StagingAccessGateContent />
    </Suspense>
  );
}
