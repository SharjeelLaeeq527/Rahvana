"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { ConfirmationModal } from "@/app/components/shared/ConfirmationModal";
import { useLanguage } from "@/app/context/LanguageContext";

export default function SettingsPage() {
  const { t } = useLanguage();
  const { user, isLoading, signOut } = useAuth();
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    push: true,
  });

  const [accountSettings, setAccountSettings] = useState({
    twoFactorEnabled: false,
    autoBackup: true,
  });

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [profile, setProfile] = useState<{ mfa_enabled: boolean } | null>(null);
  const [deleteAccountModalOpen, setDeleteAccountModalOpen] = useState(false);

  // Track if we've already fetched for this user
  const hasFetchedRef = useRef<string | null>(null);

  // Memoize user ID to prevent unnecessary re-renders
  const userId = useMemo(() => user?.id, [user?.id]);

  const fetchProfile = useCallback(async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("mfa_enabled")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching profile:", error.message);
        return;
      }

      if (data) {
        setProfile(data);
        setAccountSettings((prev) => ({
          ...prev,
          twoFactorEnabled: data.mfa_enabled,
        }));
      }
    } catch (err) {
      console.error("Unexpected fetchProfile error:", err);
    }
  }, [supabase, userId]);

  const fetchSettings = useCallback(async () => {
    // Skip if we've already fetched for this user
    if (!userId || hasFetchedRef.current === userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Fetch user settings from database
      const { data, error } = await supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error) {
        // If no settings exist yet, use defaults
        // Check if it's a "Row not found" error (which is normal for new users)
        if (
          error.message &&
          !error.message.toLowerCase().includes("not found")
        ) {
          console.warn("Error fetching settings:", error);
        }
      } else if (data) {
        setNotifications({
          email: data.email_notifications || true,
          sms: data.sms_notifications || false,
          push: data.push_notifications || true,
        });

        setAccountSettings((prev) => ({
          ...prev,
          autoBackup: data.auto_backup || true,
        }));
      }

      // Mark as fetched for this user
      hasFetchedRef.current = userId;
    } catch (error) {
      console.error("Error in fetchSettings:", error);
    } finally {
      setLoading(false);
    }
  }, [supabase, userId]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
      return;
    }

    if (userId && hasFetchedRef.current !== userId) {
      fetchSettings();
      fetchProfile();
    } else if (userId) {
      setLoading(false);
    }
  }, [userId, isLoading, router, fetchSettings, fetchProfile, user]);

  const handleNotificationChange = (type: string) => {
    setNotifications((prev) => ({
      ...prev,
      [type]: !prev[type as keyof typeof prev],
    }));
  };

  const handleAccountSettingChange = (type: string) => {
    setAccountSettings((prev) => ({
      ...prev,
      [type]: !prev[type as keyof typeof prev],
    }));
  };

  const handleSaveSettings = async () => {
    try {
      setLoading(true);
      setMessage("");

      // Save settings to database
      const { error } = await supabase.from("user_settings").upsert(
        [
          {
            user_id: user?.id,
            email_notifications: notifications.email,
            sms_notifications: notifications.sms,
            push_notifications: notifications.push,
            two_factor_enabled: accountSettings.twoFactorEnabled,
            auto_backup: accountSettings.autoBackup,
            updated_at: new Date().toISOString(),
          },
        ],
        { onConflict: "user_id" },
      );

      if (error) {
        throw error;
      }

      setMessage(t("messages.success"));
    } catch (error) {
      console.error("Error saving settings:", error);
      setMessage(t("messages.saveError"));
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  const handleDeleteAccount = () => {
    setDeleteAccountModalOpen(true);
  };

  const confirmDeleteAccount = async () => {
    try {
      setLoading(true);
      setDeleteAccountModalOpen(false);

      // Delete user data from database
      await supabase.from("user_profiles").delete().eq("id", user?.id);

      await supabase.from("user_settings").delete().eq("user_id", user?.id);

      // Delete user from Supabase auth
      const { error } = await supabase.auth.admin.deleteUser(user?.id || "");

      if (error) {
        throw error;
      }

      // Sign out and redirect to home
      await signOut();
      router.push("/");
    } catch (error) {
      console.error("Error deleting account:", error);
      setMessage(t("messages.deleteError"));
      setLoading(false);
    }
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-50 to-slate-100 p-4">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-slate-900 mb-4"></div>
          <p className="text-slate-700">{t("pages.settings.loading")}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Auth guard will redirect
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 pb-2 px-2 sm:p-4 md:p-6">
      <div className="max-w-4xl mx-auto pb-2 sm:py-4 md:py-6">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            {t("pages.settings.title")}
          </h1>
          <p className="text-sm sm:text-base text-slate-600 mt-1 sm:mt-2">
            {t("pages.settings.subtitle")}
          </p>
        </div>

        {message && (
          <div
            className={`mb-6 p-4 rounded-lg border ${
              message === t("messages.success")
                ? "bg-green-50 border-green-200 text-green-700"
                : "bg-red-50 border-red-200 text-red-700"
            }`}
          >
            {message}
          </div>
        )}

        <div className="space-y-8">
          {/* Notification Settings */}
          <Card className="px-2 sm:px-4 py-4 sm:p-6 bg-white shadow-lg border-0">
            <CardHeader className="border-b border-slate-200 pb-4">
              <CardTitle className="text-lg sm:text-xl text-slate-900">
                {t("pages.settings.notifications.title")}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2 sm:pt-6 space-y-6">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <Label
                    htmlFor="email-notifications"
                    className="text-base font-medium"
                  >
                    {t("pages.settings.notifications.emailLabel")}
                  </Label>
                  <p className="text-sm text-slate-500">
                    {t("pages.settings.notifications.emailDesc")}
                  </p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={notifications.email}
                  onCheckedChange={() => handleNotificationChange("email")}
                />
              </div>

              <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <Label
                    htmlFor="sms-notifications"
                    className="text-base font-medium"
                  >
                    {t("pages.settings.notifications.smsLabel")}
                  </Label>
                  <p className="text-sm text-slate-500">
                    {t("pages.settings.notifications.smsDesc")}
                  </p>
                </div>
                <Switch
                  id="sms-notifications"
                  checked={notifications.sms}
                  onCheckedChange={() => handleNotificationChange("sms")}
                />
              </div>

              <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <Label
                    htmlFor="push-notifications"
                    className="text-base font-medium"
                  >
                    {t("pages.settings.notifications.pushLabel")}
                  </Label>
                  <p className="text-sm text-slate-500">
                    {t("pages.settings.notifications.pushDesc")}
                  </p>
                </div>
                <Switch
                  id="push-notifications"
                  checked={notifications.push}
                  onCheckedChange={() => handleNotificationChange("push")}
                />
              </div>
            </CardContent>
          </Card>

          {/* Account Settings */}
          <Card className="px-2 sm:px-4 py-4 sm:p-6 bg-white shadow-lg border-0">
            <CardHeader className="border-b border-slate-200 pb-4">
              <CardTitle className="text-lg sm:text-xl text-slate-900">
                {t("pages.settings.account.title")}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2 sm:pt-6 space-y-6">
              <div className="flex flex-col gap-4 sm:gap-2">
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <Label
                      htmlFor="two-factor"
                      className="text-base font-medium"
                    >
                      {t("pages.settings.account.mfaLabel")}
                    </Label>
                    <p className="text-sm text-slate-500">
                      {t("pages.settings.account.mfaDesc")}
                    </p>
                  </div>
                  <Switch
                    className="cursor-not-allowed"
                    id="two-factor"
                    checked={profile?.mfa_enabled}
                    disabled={profile?.mfa_enabled} // disable if already enabled
                  />
                </div>

                <Button
                  onClick={() => router.push("/mfa-setup")}
                  className="w-full sm:w-fit mt-2 sm:mt-0"
                >
                  <span className="hidden sm:inline">
                    {profile?.mfa_enabled
                      ? t("account.mfaManage")
                      : t("account.mfaSetup")}
                  </span>
                  <span className="sm:hidden">
                    {profile?.mfa_enabled
                      ? t("account.mfaManageMobile")
                      : t("account.mfaSetupMobile")}
                  </span>
                </Button>
              </div>

              <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <Label
                    htmlFor="auto-backup"
                    className="text-base font-medium"
                  >
                    {t("pages.settings.account.autoBackupLabel")}
                  </Label>
                  <p className="text-sm text-slate-500">
                    {t("pages.settings.account.autoBackupDesc")}
                  </p>
                </div>
                <Switch
                  id="auto-backup"
                  checked={accountSettings.autoBackup}
                  onCheckedChange={() =>
                    handleAccountSettingChange("autoBackup")
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card className="px-2 sm:px-4 py-4 sm:p-6 bg-white shadow-lg border-0">
            <CardHeader className="border-b border-slate-200 pb-4">
              <CardTitle className="text-lg sm:text-xl text-slate-900">
                {t("pages.settings.security.title")}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2 sm:pt-6 space-y-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-medium">
                    {t("pages.settings.security.changePasswordLabel")}
                  </Label>
                  <p className="text-sm text-slate-500 mb-3 sm:mb-4">
                    {t("pages.settings.security.changePasswordDesc")}
                  </p>
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto border-slate-300"
                  >
                    {t("pages.settings.security.changePasswordLabel")}
                  </Button>
                </div>

                <div className="pt-4 border-t border-slate-200">
                  <Label className="text-base font-medium">
                    {t("pages.settings.security.signOutLabel")}
                  </Label>
                  <p className="text-sm text-slate-500 mb-3 sm:mb-4">
                    {t("pages.settings.security.signOutDesc")}
                  </p>
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto border-red-300 text-red-700 hover:bg-red-50"
                    onClick={handleSignOut}
                  >
                    {t("pages.settings.security.signOutLabel")}
                  </Button>
                </div>

                <div className="pt-4 border-t border-slate-200">
                  <Label className="text-base font-medium text-red-700">
                    {t("pages.settings.security.deleteAccountLabel")}
                  </Label>
                  <p className="text-sm text-slate-500 mb-3 sm:mb-4">
                    {t("pages.settings.security.deleteAccountDesc")}
                  </p>
                  <Button
                    variant="destructive"
                    className="w-full sm:w-auto"
                    onClick={handleDeleteAccount}
                  >
                    {t("pages.settings.security.deleteAccountLabel")}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end pt-2">
            <Button
              onClick={handleSaveSettings}
              className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white px-8"
              disabled={loading}
            >
              {t("pages.settings.saveBtn")}
            </Button>
          </div>
        </div>
      </div>

      <ConfirmationModal
        open={deleteAccountModalOpen}
        onOpenChange={setDeleteAccountModalOpen}
        title={t("pages.settings.deleteModal.title")}
        description={t("pages.settings.deleteModal.description")}
        confirmText={t("pages.settings.deleteModal.confirm")}
        onConfirm={confirmDeleteAccount}
      />
    </div>
  );
}
