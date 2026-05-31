"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { mapProfileToGenericForm, mapFormToProfile } from "@/lib/autoFill/mapper";
import { useAuth } from "@/app/context/AuthContext";
import { useUserProfile } from "@/app/context/UserProfileContext";
import { useLanguage } from "@/app/context/LanguageContext";
import { CustomDropdown, DropdownOption } from "@/app/components/shared/CustomDropdown";

export default function Form() {
  const { t } = useLanguage();
  const [form, setForm] = useState({
    category: "IR-1",
    priorityDate: "",
    country: "India",
    applicationType: "Consular Processing",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const [profileLoaded, setProfileLoaded] = useState(false);
  const { user } = useAuth();
  const { profile, isProfileLoading, updateProfile } = useUserProfile();

  const visaCategoryOptions: DropdownOption[] = [{ value: "IR-1", label: "IR-1 (Spouse)" }];

  const countryOptions: DropdownOption[] = [
    { value: "All Other Countries", label: t("visaChecker.form.countries.all") },
    { value: "China", label: t("visaChecker.form.countries.china") },
    { value: "India", label: t("visaChecker.form.countries.india") },
    { value: "Mexico", label: t("visaChecker.form.countries.mexico") },
    { value: "Philippines", label: t("visaChecker.form.countries.philippines") },
  ];

  const applicationTypeOptions: DropdownOption[] = [
    { value: "Consular Processing", label: t("visaChecker.form.appTypes.consular") },
    { value: "Adjustment of Status", label: t("visaChecker.form.appTypes.aos") },
  ];

  // Auto-fill profile data (from central context)
  useEffect(() => {
    if (isProfileLoading || profileLoaded || !profile) return;

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
  }, [profile, isProfileLoading, profileLoaded, form]);

  const handleSubmit = async () => {
    if (!form.priorityDate) {
      setError(t("visaChecker.form.errors.noPriorityDate"));
      return;
    }
    setError("");
    setLoading(true);

    try {
      if (user) {
        const profileUpdate = mapFormToProfile(form);
        updateProfile(profileUpdate, { silent: true });
      }
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
      setError(err instanceof Error ? err.message : t("visaChecker.form.errors.general"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-5 sm:p-8 rounded-xl shadow-lg text-left">
      <div className="space-y-5 sm:space-y-6">
        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg">{error}</div>
        )}

        {/* Visa Category */}
        <div>
          <label className="block text-sm sm:text-base font-bold text-gray-700 mb-1.5 sm:mb-2">
            {t("visaChecker.form.categoryLabel")}
          </label>
          <CustomDropdown
            value={form.category}
            onChange={(value) => setForm({ ...form, category: value })}
            options={visaCategoryOptions}
            placeholder="Select category"
          />
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
          <p className="text-sm text-gray-500 mt-1">{t("visaChecker.form.priorityDateHint")}</p>
        </div>

        {/* Country */}
        <div>
          <label className="block text-sm sm:text-base font-bold text-gray-700 mb-1.5 sm:mb-2">
            {t("visaChecker.form.countryLabel")}
          </label>
          <CustomDropdown
            value={form.country}
            onChange={(value) => setForm({ ...form, country: value })}
            options={countryOptions}
            placeholder={t("visaChecker.form.countryLabel")}
          />
        </div>

        {/* Application Type */}
        <div>
          <label className="block text-sm sm:text-base font-bold text-gray-700 mb-1.5 sm:mb-2">
            {t("visaChecker.form.appTypeLabel")}
          </label>
          <CustomDropdown
            value={form.applicationType}
            onChange={(value) => setForm({ ...form, applicationType: value })}
            options={applicationTypeOptions}
            placeholder={t("visaChecker.form.appTypeLabel")}
          />
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
