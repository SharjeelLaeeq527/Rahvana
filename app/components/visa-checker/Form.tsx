"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { mapProfileToGenericForm } from "@/lib/autoFill/mapper";
import { MasterProfile } from "@/types/profile";
import { useAuth } from "@/app/context/AuthContext";
import { createBrowserClient } from "@supabase/ssr";

export default function Form() {
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
      setError("Please enter your Priority Date");
      return;
    }
    setError("");
    setLoading(true);

    try {
      // --- SMART URL LOGIC START ---
      // Step 1: Env variable uthao ya Localhost fallback lo
      let baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

      // Step 2: Trailing slash (/) hata do agar last mein hai
      baseUrl = baseUrl.replace(/\/$/, "");

      // Step 3: Check kro ke '/api/v1' already URL mein hai ya nahi
      // Agar tumne Vercel me '/api/v1' lagaya hai, to hum dobara nahi lagayenge.
      const endpoint = baseUrl.includes("/api/v1")
        ? `${baseUrl}/visa-checker/check` // Agar api/v1 hai -> seedha endpoint
        : `${baseUrl}/api/v1/visa-checker/check`; // Agar nahi hai -> api/v1 add kro

      console.log("Fetching from:", endpoint); // Debugging ke liye best hai
      // --- SMART URL LOGIC END ---

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
          : "Something went wrong. Please try again.",
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
            Visa Category
          </label>
          <select
            suppressHydrationWarning
            className="w-full p-2.5 sm:p-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          >
            <option value="EB-1">EB-1 (Priority Workers)</option>
            <option value="EB-2">EB-2 (Advanced Degree)</option>
            <option value="EB-3">EB-3 (Skilled Workers)</option>
            <option value="F1">
              F1 (Unmarried Sons/Daughters of Citizens)
            </option>
            <option value="F2A">F2A (Spouses & Children of LPR)</option>
            <option value="F2B">F2B (Unmarried Sons/Daughters of LPR)</option>
            <option value="F3">F3 (Married Sons/Daughters of Citizens)</option>
            <option value="F4">F4 (Brothers/Sisters of Citizens)</option>
          </select>
        </div>

        {/* Priority Date */}
        <div>
          <label className="block text-sm sm:text-base font-bold text-gray-700 mb-1.5 sm:mb-2">
            Priority Date
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
            Found on your I-797, I-140, or PERM approval
          </p>
        </div>

        {/* Country */}
        <div>
          <label className="block text-sm sm:text-base font-bold text-gray-700 mb-1.5 sm:mb-2">
            Country of Chargeability
          </label>
          <select
            suppressHydrationWarning
            className="w-full p-2.5 sm:p-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            value={form.country}
            onChange={(e) => setForm({ ...form, country: e.target.value })}
          >
            <option value="All Other Countries">
              All Chargeability Areas Except Those Listed
            </option>
            <option value="China">China (mainland born)</option>
            <option value="India">India</option>
            <option value="Mexico">Mexico</option>
            <option value="Philippines">Philippines</option>
          </select>
        </div>

        {/* Application Type */}
        <div>
          <label className="block text-sm sm:text-base font-bold text-gray-700 mb-1.5 sm:mb-2">
            Application Type
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
              Consular Processing (Outside USA)
            </option>
            <option value="Adjustment of Status">
              Adjustment of Status (I-485 in USA)
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
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Checking...
            </span>
          ) : (
            "Check My Status"
          )}
        </button>
      </div>
    </div>
  );
}
