"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";

type ValidateState =
  | { phase: "loading" }
  | { phase: "invalid"; reason: string }
  | { phase: "valid"; isAuthenticated: boolean };

const REASON_TEXT: Record<string, string> = {
  not_found: "This invite link is invalid or has been revoked.",
  expired: "This invite has expired. Ask your spouse to send a new one.",
  already_used: "This invite has already been used.",
};

function AcceptInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const { isLoading: authLoading, user } = useAuth();

  const [state, setState] = useState<ValidateState>({ phase: "loading" });
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const acceptUrl = `/invite/accept?token=${encodeURIComponent(token)}`;

  const validate = useCallback(async () => {
    if (!token) {
      setState({ phase: "invalid", reason: "not_found" });
      return;
    }
    try {
      const res = await fetch(`/api/case/invite/accept?token=${encodeURIComponent(token)}`);
      const json = await res.json();
      const data = json?.data;
      if (!data?.valid) {
        setState({ phase: "invalid", reason: data?.reason || "not_found" });
        return;
      }
      setState({ phase: "valid", isAuthenticated: data.isAuthenticated });
    } catch {
      setState({ phase: "invalid", reason: "not_found" });
    }
  }, [token]);

  // Re-validate once auth has settled (so isAuthenticated reflects the real session).
  useEffect(() => {
    if (!authLoading) validate();
  }, [authLoading, user?.id, validate]);

  const handleAccept = async () => {
    setAccepting(true);
    setError(null);
    try {
      const res = await fetch("/api/case/invite/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error?.message || "Could not accept the invite.");
        setAccepting(false);
        // Re-validate to surface a mismatch / expiry state cleanly.
        validate();
        return;
      }
      router.replace("/user-dashboard");
    } catch {
      setError("Something went wrong. Please try again.");
      setAccepting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#e8f6f6] px-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-[0_8px_24px_rgba(13,115,119,0.08)] overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-[#0d7377] via-[#14a0a6] to-[#32e0c4]" />
        <div className="p-8">
          <h1 className="text-2xl font-bold text-[#0d7377] text-center mb-4">
            Shared visa case
          </h1>

          {state.phase === "loading" && (
            <p className="text-center text-slate-500">Checking your invite…</p>
          )}

          {state.phase === "invalid" && (
            <div className="text-center">
              <p className="text-slate-600 mb-6">
                {REASON_TEXT[state.reason] || REASON_TEXT.not_found}
              </p>
              <button
                onClick={() => router.replace("/")}
                className="w-full rounded-xl bg-[#0d7377] py-3 font-semibold text-white"
              >
                Go to homepage
              </button>
            </div>
          )}

          {state.phase === "valid" && !state.isAuthenticated && (
            <div className="text-center">
              <p className="text-slate-600 mb-2">
                You've been invited to collaborate on a visa case.
              </p>
              <p className="text-sm text-slate-500 mb-6">
                Sign up or log in with any account to continue and join the case.
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => router.push(`/signup?redirect=${encodeURIComponent(acceptUrl)}`)}
                  className="w-full rounded-xl bg-[#0d7377] py-3 font-semibold text-white"
                >
                  Sign up
                </button>
                <button
                  onClick={() => router.push(`/login?redirect=${encodeURIComponent(acceptUrl)}`)}
                  className="w-full rounded-xl border border-[#0d7377] py-3 font-semibold text-[#0d7377]"
                >
                  Log in
                </button>
              </div>
            </div>
          )}

          {state.phase === "valid" && state.isAuthenticated && (
            <div className="text-center">
              <p className="text-slate-600 mb-6">
                You're invited to join this shared case. Once you accept, you and your
                spouse will work on the same case together.
              </p>
              {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
              <button
                onClick={handleAccept}
                disabled={accepting}
                className="w-full rounded-xl bg-[#0d7377] py-3 font-semibold text-white disabled:opacity-60"
              >
                {accepting ? "Joining…" : "Accept invite"}
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#e8f6f6]">
          <p className="text-slate-500">Loading…</p>
        </div>
      }
    >
      <AcceptInner />
    </Suspense>
  );
}
