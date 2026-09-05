"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import { KeyRound, LogOut, Trash2, Loader2, User, Eye, EyeOff, ChevronRight } from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import { useLanguage } from "@/app/context/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader } from "@/components/ui/spinner";
import { ConfirmationModal } from "@/app/components/shared/ConfirmationModal";
import { MFACodeModal } from "@/app/components/shared/MFACodeModal";
import { useToast } from "@/app/components/shared/ToastProvider";
import { validateStrongPassword } from "@/lib/security/password";
import SurveyModal from "@/app/components/SurveyModal";

export default function SettingsPage() {
  const { t } = useLanguage();
  const { user, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const canChangePassword = user?.app_metadata?.provider === "email";

  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      ),
    []
  );

  const [openSection, setOpenSection] = useState<string | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [profile, setProfile] = useState<{ mfa_enabled: boolean } | null>(null);
  const [isPasswordSaving, setIsPasswordSaving] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteAccountModalOpen, setDeleteAccountModalOpen] = useState(false);
  const [confirmSignOutOpen, setConfirmSignOutOpen] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordChangedModalOpen, setPasswordChangedModalOpen] = useState(false);
  const [mfaCodeModalOpen, setMfaCodeModalOpen] = useState(false);
  const [mfaCode, setMfaCode] = useState("");
  const [mfaCodeError, setMfaCodeError] = useState("");
  const [isVerifyingMfaCode, setIsVerifyingMfaCode] = useState(false);
  const [isSurveyOpen, setIsSurveyOpen] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const userId = user?.id;

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace(
        `/login?redirectTo=${encodeURIComponent(window.location.pathname + window.location.search)}`
      );
    }
  }, [authLoading, router, user]);

  useEffect(() => {
    let active = true;

    const fetchProfile = async () => {
      if (!userId) {
        return;
      }

      setPageLoading(true);

      const { data, error } = await supabase
        .from("profiles")
        .select("mfa_enabled")
        .eq("id", userId)
        .maybeSingle();

      if (!active) return;

      if (error) {
        console.error("Error fetching profile:", error.message);
        setProfile({ mfa_enabled: false });
      } else {
        setProfile({ mfa_enabled: !!data?.mfa_enabled });
      }

      setPageLoading(false);
    };

    if (userId) {
      fetchProfile();
    } else if (!authLoading) {
      setPageLoading(false);
    }

    return () => {
      active = false;
    };
  }, [authLoading, supabase, userId]);

  const submitPasswordChange = async (
    submittedMfaCode?: string
  ): Promise<"success" | "mfa-required" | "error"> => {
    setMfaCodeError("");
    const { currentPassword, newPassword, confirmPassword } = passwordForm;

    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast("All password fields are required.", "error");
      return "error";
    }

    if (!validateStrongPassword(newPassword)) {
      showToast(
        "Your new password must be at least 8 characters long and include uppercase, lowercase, number, and symbol characters.",
        "error"
      );
      return "error";
    }

    if (newPassword !== confirmPassword) {
      showToast("New password and confirmation do not match.", "error");
      return "error";
    }

    if (currentPassword === newPassword) {
      showToast("Your new password must be different from the current one.", "error");
      return "error";
    }

    try {
      setIsPasswordSaving(true);

      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          ...(submittedMfaCode ? { mfaCode: submittedMfaCode } : {}),
        }),
      });

      const data = await response.json();

      if (data?.mfaRequired) {
        setMfaCode("");
        setMfaCodeError("");
        setMfaCodeModalOpen(true);
        return "mfa-required";
      }

      if (!response.ok) {
        const errorMessage = data.error || "Password update failed. Please try again.";
        if (submittedMfaCode) {
          setMfaCodeError(errorMessage);
        } else {
          showToast(errorMessage, "error");
        }
        return "error";
      }

      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      showToast("Password updated successfully.", "success");
      setPasswordChangedModalOpen(true);
      return "success";
    } catch (error) {
      console.error("Error updating password:", error);
      showToast("Password update failed. Please try again.", "error");
      return "error";
    } finally {
      setIsPasswordSaving(false);
    }
  };

  const handlePasswordChange = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await submitPasswordChange();
  };

  const handleMfaCodeSubmit = async () => {
    const code = mfaCode.trim();

    if (!/^\d{6}$/.test(code)) {
      setMfaCodeError("Enter the 6-digit code from your authenticator app.");
      return;
    }

    try {
      setIsVerifyingMfaCode(true);
      const result = await submitPasswordChange(code);
      if (result === "success") {
        setMfaCodeModalOpen(false);
      }
    } catch (error) {
      console.error("Error verifying MFA code:", error);
      setMfaCodeError("We couldn't verify that code. Please try again.");
    } finally {
      setIsVerifyingMfaCode(false);
    }
  };

  const handleGlobalSignOut = async () => {
    try {
      setIsSigningOut(true);
      await fetch("/api/auth/signout", { method: "POST" });
      await supabase.auth.signOut({ scope: "local" });
      router.replace(
        `/login?redirectTo=${encodeURIComponent(window.location.pathname + window.location.search)}`
      );
    } catch (error) {
      console.error("Error signing out:", error);
      router.replace("/login");
    } finally {
      setIsSigningOut(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setIsDeletingAccount(true);
      setDeleteAccountModalOpen(false);

      const response = await fetch("/api/auth/delete-account", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        showToast(data.error || "Unable to delete your account right now.", "error");
        return;
      }

      window.location.href = "/";
    } catch (error) {
      console.error("Error deleting account:", error);
      showToast("Unable to delete your account right now.", "error");
    } finally {
      setIsDeletingAccount(false);
    }
  };

  if (authLoading || pageLoading) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center p-4">
        <Loader size="lg" text={t("pages.settings.loading")} />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const accountOpen = openSection === "account";
  const passwordOpen = openSection === "password";
  const toggleSection = (id: string) => setOpenSection((prev) => (prev === id ? null : id));

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 px-4 pt-8 pb-16 sm:px-6 sm:pt-10">
      <div className="space-y-2">
        <h1 className="text-foreground text-2xl font-semibold tracking-tight sm:text-3xl">
          {t("pages.settings.title")}
        </h1>
        <p className="text-muted-foreground text-sm leading-6 sm:text-base">
          {t("pages.settings.subtitle")}
        </p>
      </div>

      {/* Account summary cards */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="border-border bg-card flex items-start gap-3 rounded-2xl border px-4 py-3.5 shadow-sm">
          <User className="mt-0.5 h-5 w-5 shrink-0 text-[#0d7377]" />
          <div className="min-w-0">
            <p className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">
              Signed in as
            </p>
            <p className="text-foreground mt-0.5 truncate text-sm font-medium">{user.email}</p>
          </div>
        </div>
        <div className="border-border bg-card flex items-start gap-3 rounded-2xl border px-4 py-3.5 shadow-sm">
          <KeyRound className="mt-0.5 h-5 w-5 shrink-0 text-[#0d7377]" />
          <div className="min-w-0">
            <p className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">
              Security status
            </p>
            <p className="text-foreground mt-0.5 text-sm font-medium">
              {profile?.mfa_enabled
                ? "Two-factor authentication enabled"
                : "Two-factor authentication off"}
            </p>
          </div>
        </div>
      </div>

      {/* Security & Access */}
      <section className="space-y-2.5">
        <h2 className="text-foreground px-1 text-base font-semibold">Security &amp; Access</h2>
        <div className="divide-border/60 border-border bg-card divide-y overflow-hidden rounded-2xl border shadow-sm">
          {/* Account Settings row */}
          <button
            type="button"
            onClick={() => toggleSection("account")}
            aria-expanded={accountOpen}
            className="hover:bg-muted/40 flex w-full cursor-pointer items-center gap-3 px-4 py-4 text-left transition"
          >
            <User className="h-5 w-5 shrink-0 text-[#0d7377]" />
            <span className="text-foreground flex-1 text-sm font-medium">Account Settings</span>
            <ChevronRight
              className={`text-muted-foreground h-4 w-4 shrink-0 transition-transform ${
                accountOpen ? "rotate-90" : ""
              }`}
            />
          </button>
          {accountOpen && (
            <div className="bg-muted/20 space-y-4 px-4 py-4">
              <div className="border-border bg-background flex items-center justify-between gap-4 rounded-xl border p-4">
                <div className="min-w-0 space-y-1">
                  <Label htmlFor="two-factor" className="text-foreground text-sm font-medium">
                    Two-Factor Authentication
                  </Label>
                  <p className="text-muted-foreground text-sm">
                    {profile?.mfa_enabled ? "Enabled on this account" : "Not enabled yet"}
                  </p>
                </div>
                <Switch id="two-factor" checked={!!profile?.mfa_enabled} disabled />
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <p className="text-foreground text-sm font-medium">Manage authentication</p>
                  <p className="text-muted-foreground text-sm">Open the 2FA setup flow.</p>
                </div>
                <Button
                  onClick={() => router.push("/mfa-setup")}
                  variant="outline"
                  className="w-full cursor-pointer sm:w-auto"
                >
                  {profile?.mfa_enabled ? "Manage 2FA" : "Set Up 2FA"}
                </Button>
              </div>
            </div>
          )}

          {/* Change Password row */}
          {canChangePassword && (
            <>
              <button
                type="button"
                onClick={() => toggleSection("password")}
                aria-expanded={passwordOpen}
                className="hover:bg-muted/40 flex w-full cursor-pointer items-center gap-3 px-4 py-4 text-left transition"
              >
                <KeyRound className="h-5 w-5 shrink-0 text-[#0d7377]" />
                <span className="text-foreground flex-1 text-sm font-medium">Change Password</span>
                <ChevronRight
                  className={`text-muted-foreground h-4 w-4 shrink-0 transition-transform ${
                    passwordOpen ? "rotate-90" : ""
                  }`}
                />
              </button>
              {passwordOpen && (
                <div className="bg-muted/20 px-4 py-4">
                  <form onSubmit={handlePasswordChange} className="space-y-5">
                    <div className="flex flex-col gap-4 lg:flex-row">
                      <div className="flex-1 space-y-2">
                        <Label htmlFor="current-password">Current Password</Label>
                        <div className="relative">
                          <Input
                            id="current-password"
                            type={showCurrentPassword ? "text" : "password"}
                            value={passwordForm.currentPassword}
                            onChange={(event) =>
                              setPasswordForm((prev) => ({
                                ...prev,
                                currentPassword: event.target.value,
                              }))
                            }
                            placeholder="Current password"
                            autoComplete="current-password"
                            disabled={isPasswordSaving}
                            className="pr-11"
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrentPassword((prev) => !prev)}
                            className="text-muted-foreground hover:text-foreground absolute inset-y-0 right-0 flex items-center px-3 transition"
                            aria-label={
                              showCurrentPassword
                                ? "Hide current password"
                                : "Show current password"
                            }
                          >
                            {showCurrentPassword ? (
                              <Eye className="h-4 w-4" />
                            ) : (
                              <EyeOff className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>
                      <div className="flex-1 space-y-2">
                        <Label htmlFor="new-password">New Password</Label>
                        <div className="relative">
                          <Input
                            id="new-password"
                            type={showNewPassword ? "text" : "password"}
                            value={passwordForm.newPassword}
                            onChange={(event) =>
                              setPasswordForm((prev) => ({
                                ...prev,
                                newPassword: event.target.value,
                              }))
                            }
                            placeholder="New password"
                            autoComplete="new-password"
                            disabled={isPasswordSaving}
                            className="pr-11"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword((prev) => !prev)}
                            className="text-muted-foreground hover:text-foreground absolute inset-y-0 right-0 flex items-center px-3 transition"
                            aria-label={showNewPassword ? "Hide new password" : "Show new password"}
                          >
                            {showNewPassword ? (
                              <Eye className="h-4 w-4" />
                            ) : (
                              <EyeOff className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>
                      <div className="flex-1 space-y-2">
                        <Label htmlFor="confirm-password">Confirm Password</Label>
                        <div className="relative">
                          <Input
                            id="confirm-password"
                            type={showConfirmPassword ? "text" : "password"}
                            value={passwordForm.confirmPassword}
                            onChange={(event) =>
                              setPasswordForm((prev) => ({
                                ...prev,
                                confirmPassword: event.target.value,
                              }))
                            }
                            placeholder="Confirm password"
                            autoComplete="new-password"
                            disabled={isPasswordSaving}
                            className="pr-11"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword((prev) => !prev)}
                            className="text-muted-foreground hover:text-foreground absolute inset-y-0 right-0 flex items-center px-3 transition"
                            aria-label={
                              showConfirmPassword
                                ? "Hide confirmation password"
                                : "Show confirmation password"
                            }
                          >
                            {showConfirmPassword ? (
                              <Eye className="h-4 w-4" />
                            ) : (
                              <EyeOff className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        disabled={isPasswordSaving}
                        className="w-full cursor-pointer sm:w-auto"
                      >
                        {isPasswordSaving ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          "Update Password"
                        )}
                      </Button>
                    </div>
                  </form>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Device & Sessions */}
      <section className="space-y-2.5">
        <h2 className="text-foreground px-1 text-base font-semibold">Device &amp; Sessions</h2>
        <div className="border-border bg-card overflow-hidden rounded-2xl border shadow-sm">
          <button
            type="button"
            onClick={() => setConfirmSignOutOpen(true)}
            className="hover:bg-muted/40 flex w-full cursor-pointer items-center gap-3 px-4 py-4 text-left transition"
          >
            <LogOut className="h-5 w-5 shrink-0 text-[#0d7377]" />
            <span className="flex-1">
              <span className="text-foreground block text-sm font-medium">Sign Out</span>
              <span className="text-muted-foreground mt-0.5 block text-xs">
                Sign out of all devices connected to your account.
              </span>
            </span>
            <ChevronRight className="text-muted-foreground h-4 w-4 shrink-0" />
          </button>
        </div>
      </section>

      {/* Danger Zone */}
      <section className="space-y-2.5">
        <h2 className="text-foreground px-1 text-base font-semibold">Leaving So Soon?</h2>
        <div className="bg-card overflow-hidden rounded-2xl border border-[#c0596a]/30 shadow-sm">
          <button
            type="button"
            onClick={() => setIsSurveyOpen(true)}
            disabled={isDeletingAccount}
            className="flex w-full cursor-pointer items-center gap-3 px-4 py-4 text-left transition hover:bg-[#c0596a]/5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isDeletingAccount ? (
              <Loader2 className="h-5 w-5 shrink-0 animate-spin text-[#c0596a]" />
            ) : (
              <Trash2 className="h-5 w-5 shrink-0 text-[#c0596a]" />
            )}
            <span className="flex-1">
              <span className="text-foreground block text-sm font-medium">
                {isDeletingAccount ? "Deleting..." : "Delete Account"}
              </span>
              <span className="text-muted-foreground mt-0.5 block text-xs">
                Permanently delete your account and related settings data.
              </span>
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-[#c0596a]/70" />
          </button>
        </div>
      </section>

      <SurveyModal
        open={isSurveyOpen}
        onOpenChange={setIsSurveyOpen}
        onContinue={async (reason, additionalComments) => {
          const response = await fetch("/api/account-deletion-feedback", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              reason,
              additional_comments: additionalComments || null,
            }),
          });

          if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            throw new Error(data.error || "Failed to save account deletion feedback.");
          }

          setDeleteAccountModalOpen(true);
        }}
        onSkip={() => {
          setDeleteAccountModalOpen(true);
        }}
      />

      <ConfirmationModal
        open={confirmSignOutOpen}
        onOpenChange={setConfirmSignOutOpen}
        title="Sign out of all devices?"
        description="This will end every active session for your account, including the one on this browser."
        cancelText="Cancel"
        confirmText="Sign Out"
        onConfirm={handleGlobalSignOut}
        loading={isSigningOut}
        confirmVariant="danger"
      />

      <ConfirmationModal
        open={passwordChangedModalOpen}
        onOpenChange={setPasswordChangedModalOpen}
        title="Password Updated"
        description="Your password has been changed successfully. Would you like to sign out of all active devices? This is recommended if you believe your account may have been accessed by someone else."
        cancelText="Stay Signed In"
        confirmText="Sign Out All Devices"
        confirmVariant="primary"
        loading={isSigningOut}
        onConfirm={async () => {
          setPasswordChangedModalOpen(false);
          await handleGlobalSignOut();
        }}
      />

      <MFACodeModal
        open={mfaCodeModalOpen}
        onOpenChange={(open) => {
          setMfaCodeModalOpen(open);
          if (!open) {
            setMfaCode("");
            setMfaCodeError("");
          }
        }}
        value={mfaCode}
        onValueChange={setMfaCode}
        onSubmit={handleMfaCodeSubmit}
        loading={isVerifyingMfaCode}
        error={mfaCodeError}
        title="Verify Your Identity"
        description="For security, enter the 6-digit code from your authenticator app before changing your password."
        confirmText="Verify Code"
        loadingText="Verifying..."
        variant="primary"
      />

      <ConfirmationModal
        open={deleteAccountModalOpen}
        onOpenChange={setDeleteAccountModalOpen}
        title="Delete account?"
        description="This permanently removes your account and the data currently linked to it."
        cancelText="Cancel"
        confirmText="Delete Account"
        onConfirm={handleDeleteAccount}
        loading={isDeletingAccount}
        confirmVariant="danger"
      />
    </div>
  );
}
