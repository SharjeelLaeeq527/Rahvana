"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { mapProfileToGenericForm } from "@/lib/autoFill/mapper";
import { MasterProfile } from "@/types/profile";
import { useAuth } from "@/app/context/AuthContext";
import { createBrowserClient } from "@supabase/ssr";
import { useLanguage } from "@/app/context/LanguageContext";
import { Loader } from "@/components/ui/spinner";

export default function Form() {
  const { t } = useLanguage();
  const [form, setForm] = useState({
    category: "EB-2",
    priorityDate: "",
    country: "India",
    applicationType: "Consular Processing",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const [profileLoaded, setProfileLoaded] = useState(false);
  const { user } = useAuth();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  // Auto-fill profile data
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      try {
        const { data } = await supabase
          .from("user_profiles")
          .select("profile_details")
          .eq("id", user.id)
          .single();

        if (data?.profile_details && !profileLoaded) {
          const profile = data.profile_details as MasterProfile;

          // Map profile data to form structure
          const mappedData = mapProfileToGenericForm(profile, {
            category: form.category,
            priorityDate: form.priorityDate,
            country: form.country,
            applicationType: form.applicationType,
          });

          setForm((prev) => ({
            ...prev,
            ...mappedData,
          }));
          setProfileLoaded(true);
        }
      } catch (err) {
        console.error("Error auto-filling profile:", err);
      }
    };

    fetchProfile();
  }, [user, profileLoaded, supabase, form]);

  const handleSubmit = async () => {
    if (!form.priorityDate) {
      setError(t("visaChecker.form.errors.noPriorityDate"));
      return;
    }
    setError("");
    setLoading(true);

    try {
      let baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
      baseUrl = baseUrl.replace(/\/$/, "");
      const endpoint = baseUrl.includes("/api/v1")
        ? `${baseUrl}/visa-checker/check`
        : `${baseUrl}/api/v1/visa-checker/check`;

      console.log("Fetching from:", endpoint);

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        throw new Error(`Server error: ${res.status} - ${res.statusText}`);
      }

      const result = await res.json();
      localStorage.setItem("visaResult", JSON.stringify(result));
      router.push("/visa-checker/result");
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : t("visaChecker.form.errors.general"),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-5 sm:p-8 rounded-xl shadow-lg text-left">
      <div className="space-y-5 sm:space-y-6">
        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Visa Category */}
        <div>
          <label className="block text-sm sm:text-base font-bold text-gray-700 mb-1.5 sm:mb-2">
            {t("visaChecker.form.categoryLabel")}
          </label>
          <select
            suppressHydrationWarning
            className="w-full p-2.5 sm:p-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          >
            <option value="EB-1">{t("visaChecker.form.categories.eb1")}</option>
            <option value="EB-2">{t("visaChecker.form.categories.eb2")}</option>
            <option value="EB-3">{t("visaChecker.form.categories.eb3")}</option>
            <option value="F1">{t("visaChecker.form.categories.f1")}</option>
            <option value="F2A">{t("visaChecker.form.categories.f2a")}</option>
            <option value="F2B">{t("visaChecker.form.categories.f2b")}</option>
            <option value="F3">{t("visaChecker.form.categories.f3")}</option>
            <option value="F4">{t("visaChecker.form.categories.f4")}</option>
          </select>
        </div>

        {/* Priority Date */}
        <div>
          <label className="block text-sm sm:text-base font-bold text-gray-700 mb-1.5 sm:mb-2">
            {t("visaChecker.form.priorityDateLabel")}
          </label>
          <input
            suppressHydrationWarning
            type="date"
            className="w-full p-2.5 sm:p-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            value={form.priorityDate}
            onChange={(e) => setForm({ ...form, priorityDate: e.target.value })}
            required
          />
          <p className="text-sm text-gray-500 mt-1">
            {t("visaChecker.form.priorityDateHint")}
          </p>
        </div>

        {/* Country */}
        <div>
          <label className="block text-sm sm:text-base font-bold text-gray-700 mb-1.5 sm:mb-2">
            {t("visaChecker.form.countryLabel")}
          </label>
          <select
            suppressHydrationWarning
            className="w-full p-2.5 sm:p-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            value={form.country}
            onChange={(e) => setForm({ ...form, country: e.target.value })}
          >
            <option value="All Other Countries">{t("visaChecker.form.countries.all")}</option>
            <option value="China">{t("visaChecker.form.countries.china")}</option>
            <option value="India">{t("visaChecker.form.countries.india")}</option>
            <option value="Mexico">{t("visaChecker.form.countries.mexico")}</option>
            <option value="Philippines">{t("visaChecker.form.countries.philippines")}</option>
          </select>
        </div>

        {/* Application Type */}
        <div>
          <label className="block text-sm sm:text-base font-bold text-gray-700 mb-1.5 sm:mb-2">
            {t("visaChecker.form.appTypeLabel")}
          </label>
          <select
            suppressHydrationWarning
            className="w-full p-2.5 sm:p-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            value={form.applicationType}
            onChange={(e) =>
              setForm({ ...form, applicationType: e.target.value })
            }
          >
            <option value="Consular Processing">
              {t("visaChecker.form.appTypes.consular")}
            </option>
            <option value="Adjustment of Status">
              {t("visaChecker.form.appTypes.aos")}
            </option>
          </select>
        </div>

        {/* Submit Button */}
        <button
          suppressHydrationWarning
          onClick={handleSubmit}
          disabled={loading}
          className={`w-full py-2.5 sm:py-3 text-sm sm:text-base rounded-lg font-bold text-white transition-all ${
            loading
              ? "bg-primary/70 cursor-not-allowed"
              : "bg-primary hover:bg-primary/90 active:bg-primary/80"
          }`}
        >
          {loading ? t("visaChecker.form.checking") : t("visaChecker.form.checkBtn")}
        </button>
      </div>
    </div>
  );
}
