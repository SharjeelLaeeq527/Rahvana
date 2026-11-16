// app/admin/components/staging-totp/StagingTotpManager.tsx
"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  QrCode,
  Copy,
  Check,
  KeyRound,
  Download,
  AlertCircle,
  CheckCircle2,
  ShieldAlert,
  Users,
  RotateCw,
  Send,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader } from "@/components/ui/spinner";
import { useAuth } from "@/app/context/AuthContext";
import { isStagingTotpManager } from "@/lib/security/staging-access";

interface GeneratedKeyData {
  username: string;
  secret: string;
  otpUri: string;
  qrCodeDataUrl: string;
  envConfigString: string;
}

export function StagingTotpManager() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedData, setGeneratedData] = useState<GeneratedKeyData | null>(null);

  // Existing configured members list from .env.local
  const [existingUsers, setExistingUsers] = useState<string[]>([]);
  const [fetchingUsers, setFetchingUsers] = useState(false);
  const { user } = useAuth();
  const [canManage, setCanManage] = useState<boolean | null>(() => {
    return user?.email ? isStagingTotpManager(user.email) : null;
  });

  // Copy states
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedEnv, setCopiedEnv] = useState(false);
  const [copiedMemberEnv, setCopiedMemberEnv] = useState(false);

  // Live test verification
  const [testCode, setTestCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const fetchExistingUsers = async () => {
    try {
      setFetchingUsers(true);
      const res = await fetch("/api/admin/staging-totp");
      const data = await res.json().catch(() => ({}));
      if (res.ok && Array.isArray(data.existingUsers)) {
        setExistingUsers(data.existingUsers.map((u: string) => u.toLowerCase()));
      }
    } catch (err) {
      console.error("Failed to fetch existing staging users:", err);
    } finally {
      setFetchingUsers(false);
    }
  };

  useEffect(() => {
    fetchExistingUsers();
  }, []);

  const cleanUser = username.trim().toLowerCase();
  const isCurrentlyGenerated = generatedData?.username === cleanUser;
  const isAlreadyTaken =
    cleanUser.length > 0 && !isCurrentlyGenerated && existingUsers.includes(cleanUser);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setTestResult(null);
    setTestCode("");

    if (!cleanUser) {
      setError("Please enter a username for the team member (e.g. hammad, khashir).");
      return;
    }

    // Client-side uniqueness check
    if (isAlreadyTaken) {
      setError(
        `Username "${cleanUser}" already exists in STAGING_TOTP_KEYS. Please use a unique username or remove the existing key first to avoid conflicts.`
      );
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/admin/staging-totp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: cleanUser }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.alreadyExists && Array.isArray(data.existingUsers)) {
          setExistingUsers(data.existingUsers.map((u: string) => u.toLowerCase()));
        }
        setError(data.error || "Failed to generate authenticator key.");
        setLoading(false);
        return;
      }

      setGeneratedData(data);
    } catch (err) {
      console.error("Error generating TOTP key:", err);
      setError("Network error while generating key.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, type: "secret" | "env" | "memberEnv") => {
    navigator.clipboard.writeText(text);
    if (type === "secret") {
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
    } else if (type === "env") {
      setCopiedEnv(true);
      setTimeout(() => setCopiedEnv(false), 2000);
    } else if (type === "memberEnv") {
      setCopiedMemberEnv(true);
      setTimeout(() => setCopiedMemberEnv(false), 2000);
    }
  };

  const handleTestCode = async () => {
    if (!generatedData || testCode.length !== 6) return;
    setVerifying(true);
    setTestResult(null);

    try {
      // Test code directly against the generated secret without modifying any session cookies
      const res = await fetch("/api/admin/staging-totp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "test_code",
          secret: generatedData.secret,
          code: testCode,
        }),
      });

      const data = await res.json();
      if (res.ok && data.valid) {
        setTestResult({
          success: true,
          message:
            data.message || "Code verified successfully! Authenticator app is linked properly.",
        });
      } else {
        setTestResult({
          success: false,
          message:
            data.message ||
            "Code did not match. Please ensure your device clock is synchronized and enter the current 6-digit code.",
        });
      }
    } catch {
      setTestResult({
        success: false,
        message: "Failed to verify test code.",
      });
    } finally {
      setVerifying(false);
    }
  };

  if (canManage === false) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-6 text-slate-800">
        <div className="flex items-start gap-4">
          <div className="rounded-xl bg-amber-100 p-2.5 text-amber-700">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Manager &amp; Owner Access Only</h3>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">
              You do not have permission to generate QR codes or manage staging access keys. This
              capability is restricted strictly to designated platform Owners and Managers
              configured in the environment variable (
              <code className="rounded bg-amber-100 px-1 py-0.5 font-mono text-xs text-amber-900">
                STAGING_TOTP_MANAGER_EMAILS
              </code>
              ).
            </p>
            <p className="mt-2 text-xs text-slate-500">
              If a team member needs access to the staging platform, please reach out to an
              authorized Owner or Manager.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Generator Form */}
      <Card className="mt-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {/* Active Configured Members Badges */}
        {existingUsers.length > 0 && (
          <div className="mb-5 rounded-xl border border-slate-100 bg-slate-50/80 p-3.5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-slate-600 uppercase">
                <Users className="h-3.5 w-3.5 text-slate-500" />
                Configured Members in Environment ({existingUsers.length})
              </span>
              <button
                type="button"
                onClick={fetchExistingUsers}
                disabled={fetchingUsers}
                className="flex items-center gap-1 text-[11px] font-medium text-teal-700 hover:text-teal-800"
                title="Refresh configured users list"
              >
                <RotateCw className={`h-3 w-3 ${fetchingUsers ? "animate-spin" : ""}`} />
                <span>{fetchingUsers ? "Refreshing..." : "Refresh"}</span>
              </button>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {existingUsers.map((user) => (
                <span
                  key={user}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-2xs"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />@{user}
                </span>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleGenerate} className="flex flex-col items-end gap-3 sm:flex-row">
          <div className="w-full flex-1">
            <label className="mb-1.5 block text-xs font-semibold tracking-wider text-slate-700 uppercase">
              Team Member Identifier (Username)
            </label>
            <div className="relative">
              <KeyRound className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                type="text"
                placeholder="e.g. hammad, khashir, dev2"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value.toLowerCase());
                  if (error) setError(null);
                }}
                disabled={loading}
                className={`h-11 rounded-xl pl-10 ${
                  isAlreadyTaken
                    ? "border-amber-400 bg-amber-50/30 focus-visible:ring-amber-400"
                    : "border-slate-200"
                }`}
              />
            </div>

            {/* In-flight Uniqueness Warning */}
            {isAlreadyTaken && (
              <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-amber-700">
                <AlertCircle className="h-3.5 w-3.5 shrink-0 text-amber-600" />
                <span>
                  Username <strong>&quot;{cleanUser}&quot;</strong> already exists in
                  STAGING_TOTP_KEYS. Choose a unique name.
                </span>
              </p>
            )}
          </div>

          <Button
            type="submit"
            disabled={loading || !username.trim() || isAlreadyTaken}
            className="flex h-11 shrink-0 items-center gap-2 rounded-xl bg-teal-700 px-6 font-semibold text-white shadow-sm hover:bg-teal-800 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader size="sm" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <QrCode className="h-4 w-4" />
                <span>Generate QR Code</span>
              </>
            )}
          </Button>
        </form>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </Card>

      {/* Generated Result Display */}
      {generatedData && (
        <Card className="rounded-2xl border-2 border-teal-600/30 bg-white p-6 shadow-md sm:p-8">
          <div className="grid items-start gap-8 md:grid-cols-2">
            {/* Left Column: QR Code & Download */}
            <div className="flex flex-col items-center rounded-2xl border border-slate-200/80 bg-slate-50 p-6 text-center">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <Image
                  src={generatedData.qrCodeDataUrl}
                  alt={`QR code for ${generatedData.username}`}
                  width={240}
                  height={240}
                  unoptimized
                  priority
                  className="h-56 w-56 rounded-lg"
                />
              </div>

              <div className="mt-4">
                <span className="inline-block rounded-full bg-teal-100 px-3 py-1 text-xs font-bold tracking-wide text-teal-800">
                  @{generatedData.username}
                </span>
                <p className="mt-2 max-w-xs text-xs text-slate-500">
                  Scan this QR code with Google Authenticator, Microsoft Authenticator, or
                  1Password.
                </p>
              </div>

              <a
                href={generatedData.qrCodeDataUrl}
                download={`rahvana-staging-totp-${generatedData.username}.png`}
                className="mt-4 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-2xs transition-colors hover:bg-slate-100"
              >
                <Download className="h-3.5 w-3.5" />
                Save QR Code as PNG
              </a>
            </div>

            {/* Right Column: Secret, Environment Config & Test */}
            <div className="space-y-5">
              <div>
                <p className="mt-0.5 mb-2 text-xs text-slate-600">
                  Add this pair to{" "}
                  <code className="font-mono text-teal-700">STAGING_TOTP_KEYS</code> in your{" "}
                  <code className="text-slate-800">.env.local</code> or Vercel Staging Settings:
                </p>

                <div className="flex items-center gap-2 overflow-x-auto rounded-xl border border-slate-800 bg-slate-900 p-3 font-mono text-xs text-teal-300">
                  <span className="flex-1 break-all select-all">
                    {generatedData.envConfigString}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(generatedData.envConfigString, "env")}
                    className="shrink-0 rounded-lg bg-slate-800 p-1.5 text-white transition-colors hover:bg-slate-700"
                    title="Copy Config"
                  >
                    {copiedEnv ? (
                      <Check className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <span className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
                  Manual Entry Key (if camera scan fails)
                </span>
                <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <span className="flex-1 font-mono text-xs tracking-wider text-slate-800 select-all">
                    {generatedData.secret}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(generatedData.secret, "secret")}
                    className="shrink-0 rounded-lg p-1.5 text-slate-600 transition-colors hover:bg-slate-200"
                    title="Copy Secret"
                  >
                    {copiedSecret ? (
                      <Check className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <span className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
                  Send to New Team Member (Their .env.local Variable)
                </span>
                <p className="mt-0.5 mb-2 text-xs text-slate-600">
                  Send this complete line to the new team member to add to their local{" "}
                  <code className="text-slate-800">.env.local</code> file:
                </p>

                <div className="flex items-center gap-2 overflow-x-auto rounded-xl border border-slate-800 bg-slate-900 p-3 font-mono text-xs text-teal-300">
                  <span className="flex-1 break-all select-all">
                    STAGING_TOTP_KEYS={generatedData.envConfigString}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboard(
                        `STAGING_TOTP_KEYS=${generatedData.envConfigString}`,
                        "memberEnv"
                      )
                    }
                    className="shrink-0 rounded-lg bg-slate-800 p-1.5 text-white transition-colors hover:bg-slate-700"
                    title="Copy for Team Member"
                  >
                    {copiedMemberEnv ? (
                      <Check className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Step 2: Instant Code Tester */}
              {/* <div className="space-y-3 rounded-xl border border-teal-200/80 bg-teal-50/60 p-4">
                <span className="block text-xs font-bold tracking-wide text-teal-900 uppercase">
                  Step 2: Test 6-Digit Code
                </span>
                <p className="text-xs text-slate-600">
                  Test the 6-digit code showing in the authenticator app right here to verify it is
                  properly synced:
                </p>

                <div className="flex gap-2">
                  <Input
                    type="text"
                    maxLength={6}
                    placeholder="000 000"
                    value={testCode}
                    onChange={(e) => setTestCode(e.target.value.replace(/\D/g, ""))}
                    className="h-10 rounded-lg border-teal-200 bg-white text-center font-mono text-base tracking-widest"
                  />
                  <Button
                    type="button"
                    onClick={handleTestCode}
                    disabled={verifying || testCode.length !== 6}
                    className="h-10 shrink-0 rounded-lg bg-teal-700 px-4 text-xs font-medium text-white hover:bg-teal-800"
                  >
                    {verifying ? <Loader /> : "Verify Code"}
                  </Button>
                </div>

                {testResult && (
                  <div
                    className={`flex items-start gap-2 rounded-lg p-2.5 text-xs ${
                      testResult.success
                        ? "border border-emerald-300 bg-emerald-100 text-emerald-800"
                        : "border border-amber-300 bg-amber-100 text-amber-800"
                    }`}
                  >
                    {testResult.success ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
                    ) : (
                      <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
                    )}
                    <span>{testResult.message}</span>
                  </div>
                )}
              </div> */}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
