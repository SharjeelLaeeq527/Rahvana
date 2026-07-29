"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import { KeyRound, LogOut, Trash2, Loader2, User, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import { useLanguage } from "@/app/context/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader } from "@/components/ui/spinner";
import { ConfirmationModal } from "@/app/components/shared/ConfirmationModal";
import { useToast } from "@/app/components/shared/ToastProvider";
import { validateStrongPassword } from "@/lib/security/password";
import { set } from "react-hook-form";

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

  const [activeTab, setActiveTab] = useState("account");
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

  const handlePasswordChange = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const { currentPassword, newPassword, confirmPassword } = passwordForm;

    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast("All password fields are required.", "error");
      return;
    }

    if (!validateStrongPassword(newPassword)) {
      showToast(
        "Your new password must be at least 8 characters long and include uppercase, lowercase, number, and symbol characters.",
        "error"
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast("New password and confirmation do not match.", "error");
      return;
    }

    if (currentPassword === newPassword) {
      showToast("Your new password must be different from the current one.", "error");
      return;
    }

    try {
      setIsPasswordSaving(true);

      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        showToast(data.error || "Password update failed. Please try again.", "error");
        return;
      }

      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      showToast("Password updated successfully.", "success");
      setPasswordChangedModalOpen(true);
    } catch (error) {
      console.error("Error updating password:", error);
      showToast("Password update failed. Please try again.", "error");
    } finally {
      setIsPasswordSaving(false);
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
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-50 to-slate-100 p-4">
        <Loader size="lg" text={t("pages.settings.loading")} />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 mt-10">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {t("pages.settings.title")}
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
          {t("pages.settings.subtitle")}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card px-4 py-3 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Signed in as</p>
          <p className="mt-1 truncate text-sm font-medium text-foreground">{user.email}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card px-4 py-3 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Security status</p>
          <p className="mt-1 text-sm font-medium text-foreground">
            {profile?.mfa_enabled
              ? "Two-factor authentication enabled"
              : "Two-factor authentication off"}
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid h-auto w-full grid-cols-2 gap-2 rounded-2xl border border-border bg-card p-1.5 shadow-sm">
          <TabsTrigger
            value="account"
            className="rounded-xl px-4 py-2.5 text-sm font-medium text-muted-foreground data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
          >
            Account Settings
          </TabsTrigger>
          <TabsTrigger
            value="security"
            className="rounded-xl px-4 py-2.5 text-sm font-medium text-muted-foreground data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
          >
            Security
          </TabsTrigger>
        </TabsList>

        <TabsContent value="account" className="mt-6">
          <Card className="border-border bg-card shadow-sm">
            <CardHeader className="border-b border-border/60 pb-4">
              <CardTitle className="flex items-center gap-2 text-lg text-foreground">
                <User className="h-4 w-4 text-[#0d7377]" />
                Account Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 pt-6">
              <div className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-background p-4">
                <div className="space-y-1">
                  <Label htmlFor="two-factor" className="text-sm font-medium text-foreground">
                    Two-Factor Authentication
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {profile?.mfa_enabled ? "Enabled on this account" : "Not enabled yet"}
                  </p>
                </div>
                <Switch id="two-factor" checked={!!profile?.mfa_enabled} disabled />
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">Manage authentication</p>
                  <p className="text-sm text-muted-foreground">Open the 2FA setup flow.</p>
                </div>
                <Button
                  onClick={() => router.push("/mfa-setup")}
                  variant="outline"
                  className="w-full sm:w-auto cursor-pointer"
                >
                  {profile?.mfa_enabled ? "Manage 2FA" : "Set Up 2FA"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="mt-6">
          <div className="grid gap-6">
            {canChangePassword && (
              <Card className="border-border bg-card shadow-sm">
                <CardHeader className="border-b border-border/60 pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg text-foreground">
                    <KeyRound className="h-4 w-4 text-[#0d7377]" />
                    Change Password
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
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
                            className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground transition hover:text-foreground"
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
                            className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground transition hover:text-foreground"
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
                            className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground transition hover:text-foreground"
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
                        className="w-full sm:w-auto cursor-pointer"
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
                </CardContent>
              </Card>
            )}

            <Card className="border-border bg-card shadow-sm">
              <CardHeader className="border-b border-border/60 pb-4">
                <CardTitle className="flex items-center gap-2 text-lg text-foreground">
                  <LogOut className="h-4 w-4 text-[#0d7377]" />
                  Sign Out
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  Sign out of all devices connected to your account.
                </p>
                <Button
                  variant="outline"
                  className="w-full sm:w-auto cursor-pointer"
                  onClick={() => setConfirmSignOutOpen(true)}
                >
                  Sign Out All Devices
                </Button>
              </CardContent>
            </Card>

            <Card className="border-border bg-card shadow-sm">
              <CardHeader className="border-b border-border/60 pb-4">
                <CardTitle className="flex items-center gap-2 text-lg text-foreground">
                  <Trash2 className="h-4 w-4 text-[#c0596a]" />
                  Delete Account
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  Permanently delete your account and related settings data.
                </p>
                <Button
                  variant="destructive"
                  className="w-full sm:w-auto cursor-pointer"
                  onClick={() => setDeleteAccountModalOpen(true)}
                  disabled={isDeletingAccount}
                >
                  {isDeletingAccount ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    "Delete Account"
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

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
