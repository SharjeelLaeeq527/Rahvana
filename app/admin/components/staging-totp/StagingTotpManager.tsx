// app/admin/components/staging-totp/StagingTotpManager.tsx
"use client";

import React, { useState } from "react";
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
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader } from "@/components/ui/spinner";

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

  // Copy states
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedEnv, setCopiedEnv] = useState(false);

  // Live test verification
  const [testCode, setTestCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setTestResult(null);
    setTestCode("");

    const cleanUser = username.trim().toLowerCase();
    if (!cleanUser) {
      setError("Please enter a username for the team member (e.g. hammad, khashir).");
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

  const copyToClipboard = (text: string, type: "secret" | "env") => {
    navigator.clipboard.writeText(text);
    if (type === "secret") {
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
    } else {
      setCopiedEnv(true);
      setTimeout(() => setCopiedEnv(false), 2000);
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

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="mt-3 flex flex-col justify-between gap-4 rounded-2xl border border-teal-200/60 bg-gradient-to-r from-teal-50 to-emerald-50/50 p-5 sm:flex-row sm:items-center">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <QrCode className="h-5 w-5 text-teal-700" />
            Staging Authenticator (TOTP) Access Generator
          </h3>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-600">
            Generate individual Google Authenticator / Microsoft Authenticator QR codes for team
            members. Each team member receives their own unique secret. If a member leaves, simply
            remove their key to revoke access immediately without affecting anyone else.
          </p>
        </div>
      </div>

      {/* Generator Form */}
      <Card className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
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
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                disabled={loading}
                className="h-11 rounded-xl border-slate-200 pl-10"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading || !username.trim()}
            className="flex h-11 shrink-0 items-center gap-2 rounded-xl bg-teal-700 px-6 font-semibold text-white shadow-sm hover:bg-teal-800"
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
