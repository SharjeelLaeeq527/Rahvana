"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { MasterProfile } from "@/types/profile";
import { ChevronDown, Loader2, Pencil, Check, X } from "lucide-react";
import { getProfileCompleteness } from "@/lib/profile/helpers";
import { FormField, FormSelect, FormCheckbox } from "./form-field";
import { useTranslations } from "next-intl";

export default function ProfilePage() {
  const t = useTranslations("profile");
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const [formData, setFormData] = useState<MasterProfile>({} as MasterProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  // Track if we've already fetched for this user
  const hasFetchedRef = useRef<string | null>(null);

  const [sections, setSections] = useState({
    personal: true,
    contact: true,
    family: true,
    employment: true,
    immigration: true,
    documents: true,
    financial: true,
    relationship: true,
    affidavit: true,
    visaContext: true,
    visaEligibility: true,
  });

  // Memoize user ID to prevent unnecessary re-renders
  const userId = useMemo(() => user?.id, [user?.id]);

  const fetchProfile = useCallback(async () => {
    // Skip if we've already fetched for this user
    if (!userId || hasFetchedRef.current === userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const { data, error: dbError } = await supabase
        .from("user_profiles")
        .select("profile_details")
        .eq("id", userId)
        .single();

      if (dbError) {
        console.error("Database error fetching profile:", dbError);
        throw dbError;
      }

      if (data?.profile_details) {
        setFormData(data.profile_details as MasterProfile);
        // Mark as fetched for this user
        hasFetchedRef.current = userId;
      }
    } catch (fetchError) {
      console.error("Error fetching profile:", fetchError);
    } finally {
      setLoading(false);
    }
  }, [userId, supabase]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
      return;
    }

    if (userId && hasFetchedRef.current !== userId) {
      fetchProfile();
    } else if (userId) {
      setLoading(false);
    }
  }, [userId, isLoading, router, fetchProfile, user]);

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage("");

      const { error } = await supabase.from("user_profiles").upsert(
        {
          id: user?.id,
          profile_details: formData,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" },
      );

      if (error) throw error;

      // Reset fetch tracking to allow refetch
      hasFetchedRef.current = null;
      await fetchProfile();

      setIsEditing(false);
      setMessage(t("successMessage"));
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Error saving profile:", error);
      setMessage(t("errorMessage"));
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset fetch tracking and refetch to restore original data
    hasFetchedRef.current = null;
    fetchProfile();
  };

  const toggleSection = (key: keyof typeof sections) => {
    setSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const updateField = <T extends keyof MasterProfile>(
    field: T,
    value: MasterProfile[T],
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const updateStrictField = <T extends keyof MasterProfile>(
    field: T,
    value: string,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value as MasterProfile[T] }));
  };

  const updateNested = <T extends keyof MasterProfile>(
    parent: T,
    field: string,
    value: unknown,
  ) => {
    setFormData((prev) => {
      const parentValue = prev[parent];
      const updatedParent =
        typeof parentValue === "object" && parentValue !== null
          ? { ...(parentValue as Record<string, unknown>), [field]: value }
          : { [field]: value };

      return {
        ...prev,
        [parent]: updatedParent as MasterProfile[T],
      };
    });
  };

  const updateAddress = (
    field: keyof MasterProfile["currentAddress"],
    value: string,
  ) => {
    setFormData((prev) => ({
      ...prev,
      currentAddress: {
        ...(prev.currentAddress || {}),
        [field]: value,
      },
    }));
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-slate-900" />
      </div>
    );
  }

  if (!user) return null;

  const completeness = formData.name ? getProfileCompleteness(formData) : 0;

  return (
    <div className="min-h-screen bg-slate-50 p-4 lg:p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
              {t("title")}
            </h1>
            <p className="text-slate-500 text-sm mt-1">{t("subtitle")}</p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto mt-2 md:mt-0">
            <Button
              variant="outline"
              onClick={() => router.push("/complete-profile")}
              className="w-full sm:w-auto h-9 text-sm px-4 border-primary/20 hover:bg-primary/5 text-primary"
            >
              <Check className="w-4 h-4 mr-2" />
              {t("buttons.completeProfile")}
            </Button>
            {isEditing ? (
              <div className="grid grid-cols-2 gap-2 w-full sm:w-auto sm:flex sm:flex-row">
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={saving}
                  className="w-full sm:w-auto h-9 text-sm px-4 bg-transparent"
                >
                  <X className="w-4 h-4 mr-2" />
                  {t("buttons.cancel")}
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full sm:w-auto h-9 text-sm px-4"
                >
                  {saving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4 mr-2" />
                  )}
                  {t("buttons.save")}
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => setIsEditing(true)}
                className="w-full sm:w-auto h-9 text-sm px-4"
              >
                <Pencil className="w-4 h-4 mr-2" />
                {t("buttons.editProfile")}
              </Button>
            )}
          </div>
        </div>

        {/* Success/Error Message */}
        {message && (
          <div
            className={`mb-4 px-3 py-2 rounded-md text-xs ${
              message.includes("Error")
                ? "bg-red-50 text-red-700 border border-red-200"
                : "bg-green-50 text-green-700 border border-green-200"
            }`}
          >
            {message}
          </div>
        )}

        {/* Profile Completeness */}
        {formData.name && (
          <div className="mb-4 px-4 py-3 bg-white border border-slate-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-600">
                {t("completeness")}
              </span>
              <span className="text-sm font-semibold text-slate-800">
                {completeness}%
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-slate-700 transition-all duration-500 rounded-full"
                style={{ width: `${completeness}%` }}
              />
            </div>
          </div>
        )}

        <div className="space-y-4">
          {/* Personal Information */}
          <Card className="bg-white border-slate-200">
            <CardHeader
              className="cursor-pointer hover:bg-slate-50/50 transition-colors px-4 py-3"
              onClick={() => toggleSection("personal")}
            >
              <div className="flex justify-between items-center">
                <CardTitle className="text-sm font-semibold text-slate-800">
                  {t("sections.personal")}
                </CardTitle>
                <ChevronDown
                  className={`h-4 w-4 text-slate-400 transition-transform ${sections.personal ? "rotate-180" : ""}`}
                />
              </div>
            </CardHeader>
            {sections.personal && (
              <CardContent className="pt-0 pb-4 px-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <FormField
                    label={t("fields.firstName")}
                    value={formData.name?.first || ""}
                    onChange={(v: string) => updateNested("name", "first", v)}
                    readOnly={!isEditing}
                    placeholder={t("placeholders.firstName")}
                  />
                  <FormField
                    label={t("fields.middleName")}
                    value={formData.name?.middle || ""}
                    onChange={(v: string) => updateNested("name", "middle", v)}
                    readOnly={!isEditing}
                    placeholder={t("placeholders.middleName")}
                  />
                  <FormField
                    label={t("fields.lastName")}
                    value={formData.name?.last || ""}
                    onChange={(v: string) => updateNested("name", "last", v)}
                    readOnly={!isEditing}
                    placeholder={t("placeholders.lastName")}
                  />
                  <FormField
                    label={t("fields.dob")}
                    type="date"
                    value={formData.dateOfBirth || ""}
                    onChange={(v: string) => updateField("dateOfBirth", v)}
                    readOnly={!isEditing}
                  />
                  <FormField
                    label={t("fields.cityOfBirth")}
                    value={formData.placeOfBirth?.city || ""}
                    onChange={(v: string) =>
                      updateNested("placeOfBirth", "city", v)
                    }
                    readOnly={!isEditing}
                    placeholder={t("placeholders.city")}
                  />
                  <FormField
                    label={t("fields.countryOfBirth")}
                    value={formData.placeOfBirth?.country || ""}
                    onChange={(v: string) =>
                      updateNested("placeOfBirth", "country", v)
                    }
                    readOnly={!isEditing}
                    placeholder={t("placeholders.country")}
                  />
                  {isEditing ? (
                    <FormSelect
                      label={t("fields.sex.label")}
                      value={formData.sex || "Male"}
                      onChange={(v: string) => updateStrictField("sex", v)}
                      options={[
                        { value: "Male", label: t("fields.sex.options.male") },
                        {
                          value: "Female",
                          label: t("fields.sex.options.female"),
                        },
                      ]}
                    />
                  ) : (
                    <FormField
                      label={t("fields.sex.label")}
                      value={formData.sex || ""}
                      onChange={() => {}}
                      readOnly
                    />
                  )}
                  <FormField
                    label={t("fields.nationality")}
                    value={formData.nationality || ""}
                    onChange={(v: string) => updateField("nationality", v)}
                    readOnly={!isEditing}
                    placeholder={t("placeholders.nationality")}
                  />
                  {isEditing ? (
                    <FormSelect
                      label={t("fields.citizenshipStatus.label")}
                      value={formData.citizenshipStatus || "Other"}
                      onChange={(v: string) =>
                        updateStrictField("citizenshipStatus", v)
                      }
                      options={[
                        {
                          value: "USCitizen",
                          label: t(
                            "fields.citizenshipStatus.options.usCitizen",
                          ),
                        },
                        {
                          value: "LPR",
                          label: t("fields.citizenshipStatus.options.lpr"),
                        },
                        {
                          value: "Other",
                          label: t("fields.citizenshipStatus.options.other"),
                        },
                      ]}
                    />
                  ) : (
                    <FormField
                      label={t("fields.citizenshipStatus.label")}
                      value={
                        formData.citizenshipStatus === "USCitizen"
                          ? t("fields.citizenshipStatus.options.usCitizen")
                          : formData.citizenshipStatus === "LPR"
                            ? t("fields.citizenshipStatus.options.lpr")
                            : t("fields.citizenshipStatus.options.other")
                      }
                      onChange={() => {}}
                      readOnly
                    />
                  )}
                  {isEditing ? (
                    <FormSelect
                      label={t("fields.maritalStatus.label")}
                      value={formData.maritalStatus || "Single"}
                      onChange={(v: string) =>
                        updateStrictField("maritalStatus", v)
                      }
                      options={[
                        {
                          value: "Single",
                          label: t("fields.maritalStatus.options.single"),
                        },
                        {
                          value: "Married",
                          label: t("fields.maritalStatus.options.married"),
                        },
                        {
                          value: "Divorced",
                          label: t("fields.maritalStatus.options.divorced"),
                        },
                        {
                          value: "Widowed",
                          label: t("fields.maritalStatus.options.widowed"),
                        },
                        {
                          value: "Separated",
                          label: t("fields.maritalStatus.options.separated"),
                        },
                        {
                          value: "Annulled",
                          label: t("fields.maritalStatus.options.annulled"),
                        },
                      ]}
                    />
                  ) : (
                    <FormField
                      label={t("fields.maritalStatus.label")}
                      value={formData.maritalStatus || ""}
                      onChange={() => {}}
                      readOnly
                    />
                  )}
                  <FormField
                    label={t("fields.passportNumber")}
                    value={formData.passportNumber || ""}
                    onChange={(v: string) => updateField("passportNumber", v)}
                    readOnly={!isEditing}
                    placeholder={t("placeholders.passport")}
                  />
                  <FormField
                    label={t("fields.passportIssueDate")}
                    type="date"
                    value={formData.passportIssueDate || ""}
                    onChange={(v: string) =>
                      updateField("passportIssueDate", v)
                    }
                    readOnly={!isEditing}
                  />
                  <FormField
                    label={t("fields.passportExpiry")}
                    type="date"
                    value={formData.passportExpiry || ""}
                    onChange={(v: string) => updateField("passportExpiry", v)}
                    readOnly={!isEditing}
                  />
                  <FormField
                    label={t("fields.passportCountry")}
                    value={formData.passportCountry || ""}
                    onChange={(v: string) => updateField("passportCountry", v)}
                    readOnly={!isEditing}
                    placeholder={t("placeholders.country")}
                  />

                  {/* Legal Identifiers */}
                  <div className="sm:col-span-2 md:col-span-3 pt-4 border-t border-slate-100 mt-4">
                    <h4 className="text-xs font-medium text-slate-600 mb-3">
                      {t("fields.legalIdentifiers")}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      <FormField
                        label={t("fields.ssn")}
                        value={formData.ssn || ""}
                        onChange={(v: string) => updateField("ssn", v)}
                        readOnly={!isEditing}
                        placeholder={t("placeholders.ssn")}
                      />
                      <FormField
                        label={t("fields.alienNumber")}
                        value={formData.alienNumber || ""}
                        onChange={(v: string) => updateField("alienNumber", v)}
                        readOnly={!isEditing}
                        placeholder={t("placeholders.alien")}
                        helpText={t("helpText.alien")}
                      />
                      <FormField
                        label={t("fields.uscisAccount")}
                        value={formData.uscisAccountNumber || ""}
                        onChange={(v: string) =>
                          updateField("uscisAccountNumber", v)
                        }
                        readOnly={!isEditing}
                        placeholder={t("placeholders.uscis")}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Contact & Address */}
          <Card className="bg-white border-slate-200">
            <CardHeader
              className="cursor-pointer hover:bg-slate-50/50 transition-colors px-4 py-3"
              onClick={() => toggleSection("contact")}
            >
              <div className="flex justify-between items-center">
                <CardTitle className="text-sm font-semibold text-slate-800">
                  {t("sections.contact")}
                </CardTitle>
                <ChevronDown
                  className={`h-4 w-4 text-slate-400 transition-transform ${sections.contact ? "rotate-180" : ""}`}
                />
              </div>
            </CardHeader>
            {sections.contact && (
              <CardContent className="pt-0 pb-4 px-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    label={t("fields.phone")}
                    value={formData.phone || ""}
                    onChange={(v: string) => updateField("phone", v)}
                    readOnly={!isEditing}
                    placeholder={t("placeholders.phone")}
                  />
                  <FormField
                    label={t("fields.email")}
                    value={user.email || ""}
                    onChange={() => {}}
                    disabled
                  />
                  <FormField
                    label={t("fields.cnic")}
                    value={formData.cnic || ""}
                    onChange={(v: string) => updateField("cnic", v)}
                    readOnly={!isEditing}
                    placeholder={t("placeholders.cnic")}
                  />
                </div>

                <div className="border-t border-slate-100 pt-4">
                  <h4 className="text-xs font-medium text-slate-600 mb-3">
                    {t("fields.currentAddress")}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <FormField
                        label={t("fields.address")}
                        value={formData.currentAddress?.street || ""}
                        onChange={(v: string) => updateAddress("street", v)}
                        readOnly={!isEditing}
                        placeholder={t("placeholders.street")}
                      />
                    </div>
                    <FormField
                      label={t("fields.city")}
                      value={formData.currentAddress?.city || ""}
                      onChange={(v: string) => updateAddress("city", v)}
                      readOnly={!isEditing}
                      placeholder={t("placeholders.city")}
                    />
                    <FormField
                      label={t("fields.state")}
                      value={formData.currentAddress?.state || ""}
                      onChange={(v: string) => updateAddress("state", v)}
                      readOnly={!isEditing}
                      placeholder={t("placeholders.state")}
                    />
                    <FormField
                      label={t("fields.zipCode")}
                      value={formData.currentAddress?.zipCode || ""}
                      onChange={(v: string) => updateAddress("zipCode", v)}
                      readOnly={!isEditing}
                      placeholder={t("placeholders.zip")}
                    />
                    <FormField
                      label={t("fields.country")}
                      value={formData.currentAddress?.country || ""}
                      onChange={(v: string) => updateAddress("country", v)}
                      readOnly={!isEditing}
                      placeholder={t("placeholders.country")}
                    />
                  </div>
                </div>

                {/* Mailing Address */}
                <div className="border-t border-slate-100 pt-4 mt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <h4 className="text-xs font-medium text-slate-600">
                      {t("fields.mailingAddress")}
                    </h4>
                  </div>
                  <FormCheckbox
                    id="sameAsCurrent"
                    label={t("fields.sameAsCurrent")}
                    checked={formData.sameAsCurrentAddress || false}
                    onCheckedChange={(checked) => {
                      updateField("sameAsCurrentAddress", checked);
                      if (checked) {
                        updateField("mailingAddress", formData.currentAddress);
                      }
                    }}
                    disabled={!isEditing}
                  />

                  {!(formData.sameAsCurrentAddress || false) && (
                    <div className="space-y-4 mt-4 p-4 bg-slate-50 rounded-lg border border-slate-100">
                      <FormField
                        label={t("fields.address")}
                        value={formData.mailingAddress?.street || ""}
                        onChange={(v: string) =>
                          updateNested("mailingAddress", "street", v)
                        }
                        readOnly={!isEditing}
                        placeholder={t("placeholders.poBox")}
                      />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField
                          label={t("fields.city")}
                          value={formData.mailingAddress?.city || ""}
                          onChange={(v: string) =>
                            updateNested("mailingAddress", "city", v)
                          }
                          readOnly={!isEditing}
                          placeholder={t("placeholders.newYork")}
                        />
                        <FormField
                          label={t("fields.state")}
                          value={formData.mailingAddress?.state || ""}
                          onChange={(v: string) =>
                            updateNested("mailingAddress", "state", v)
                          }
                          readOnly={!isEditing}
                          placeholder={t("placeholders.ny")}
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField
                          label={t("fields.zipCode")}
                          value={formData.mailingAddress?.zipCode || ""}
                          onChange={(v: string) =>
                            updateNested("mailingAddress", "zipCode", v)
                          }
                          readOnly={!isEditing}
                          placeholder={t("placeholders.zip10001")}
                        />
                        <FormField
                          label={t("fields.country")}
                          value={formData.mailingAddress?.country || ""}
                          onChange={(v: string) =>
                            updateNested("mailingAddress", "country", v)
                          }
                          readOnly={!isEditing}
                          placeholder={t("placeholders.usa")}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            )}
          </Card>

          {/* Family Background */}
          <Card className="bg-white border-slate-200">
            <CardHeader
              className="cursor-pointer hover:bg-slate-50/50 transition-colors px-4 py-3"
              onClick={() => toggleSection("family")}
            >
              <div className="flex justify-between items-center">
                <CardTitle className="text-sm font-semibold text-slate-800">
                  {t("sections.family")}
                </CardTitle>
                <ChevronDown
                  className={`h-4 w-4 text-slate-400 transition-transform ${sections.family ? "rotate-180" : ""}`}
                />
              </div>
            </CardHeader>
            {sections.family && (
              <CardContent className="pt-0 pb-4 px-4 space-y-8">
                {/* Father's Details */}
                <div>
                  <h4 className="text-xs font-medium text-slate-600 mb-3">
                    {t("fields.father.header")}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <FormField
                      label={t("fields.father.firstName")}
                      value={formData.father?.name?.first || ""}
                      onChange={(v: string) =>
                        updateNested("father", "name", {
                          ...formData.father?.name,
                          first: v,
                        })
                      }
                      readOnly={!isEditing}
                      placeholder={t("placeholders.firstName")}
                    />
                    <FormField
                      label={t("fields.father.middleName")}
                      value={formData.father?.name?.middle || ""}
                      onChange={(v: string) =>
                        updateNested("father", "name", {
                          ...formData.father?.name,
                          middle: v,
                        })
                      }
                      readOnly={!isEditing}
                      placeholder={t("placeholders.middleName")}
                    />
                    <FormField
                      label={t("fields.father.lastName")}
                      value={formData.father?.name?.last || ""}
                      onChange={(v: string) =>
                        updateNested("father", "name", {
                          ...formData.father?.name,
                          last: v,
                        })
                      }
                      readOnly={!isEditing}
                      placeholder={t("placeholders.lastName")}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                    <FormField
                      label={t("fields.dob")}
                      type="date"
                      value={formData.father?.dateOfBirth || ""}
                      onChange={(v: string) =>
                        updateNested("father", "dateOfBirth", v)
                      }
                      readOnly={!isEditing}
                    />
                    <div className="flex items-end pb-2">
                      <FormCheckbox
                        id="fatherDeceased"
                        label={t("fields.deceased")}
                        checked={formData.father?.isDeceased || false}
                        onCheckedChange={(v) =>
                          updateNested("father", "isDeceased", v)
                        }
                        disabled={!isEditing}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                    <FormField
                      label={t("fields.cityOfBirth")}
                      value={formData.father?.placeOfBirth?.city || ""}
                      onChange={(v: string) =>
                        updateNested("father", "placeOfBirth", {
                          ...formData.father?.placeOfBirth,
                          city: v,
                        })
                      }
                      readOnly={!isEditing}
                      placeholder={t("placeholders.city")}
                    />
                    <FormField
                      label={t("fields.countryOfBirth")}
                      value={formData.father?.placeOfBirth?.country || ""}
                      onChange={(v: string) =>
                        updateNested("father", "placeOfBirth", {
                          ...formData.father?.placeOfBirth,
                          country: v,
                        })
                      }
                      readOnly={!isEditing}
                      placeholder={t("placeholders.country")}
                    />
                  </div>
                  {!(formData.father?.isDeceased || false) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                      <FormField
                        label={t("fields.cityOfResidence")}
                        value={formData.father?.cityOfResidence || ""}
                        onChange={(v: string) =>
                          updateNested("father", "cityOfResidence", v)
                        }
                        readOnly={!isEditing}
                        placeholder={t("placeholders.city")}
                      />
                      <FormField
                        label={t("fields.countryOfResidence")}
                        value={formData.father?.countryOfResidence || ""}
                        onChange={(v: string) =>
                          updateNested("father", "countryOfResidence", v)
                        }
                        readOnly={!isEditing}
                        placeholder={t("placeholders.country")}
                      />
                    </div>
                  )}
                </div>

                {/* Mother's Details */}
                <div>
                  <h4 className="text-xs font-medium text-slate-600 mb-3">
                    {t("fields.mother.header")}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <FormField
                      label={t("fields.mother.firstName")}
                      value={formData.mother?.name?.first || ""}
                      onChange={(v: string) =>
                        updateNested("mother", "name", {
                          ...formData.mother?.name,
                          first: v,
                        })
                      }
                      readOnly={!isEditing}
                      placeholder={t("placeholders.firstName")}
                    />
                    <FormField
                      label={t("fields.mother.middleName")}
                      value={formData.mother?.name?.middle || ""}
                      onChange={(v: string) =>
                        updateNested("mother", "name", {
                          ...formData.mother?.name,
                          middle: v,
                        })
                      }
                      readOnly={!isEditing}
                      placeholder={t("placeholders.middleName")}
                    />
                    <FormField
                      label={t("fields.mother.lastName")}
                      value={formData.mother?.name?.last || ""}
                      onChange={(v: string) =>
                        updateNested("mother", "name", {
                          ...formData.mother?.name,
                          last: v,
                        })
                      }
                      readOnly={!isEditing}
                      placeholder={t("placeholders.lastName")}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                    <FormField
                      label={t("fields.dob")}
                      type="date"
                      value={formData.mother?.dateOfBirth || ""}
                      onChange={(v: string) =>
                        updateNested("mother", "dateOfBirth", v)
                      }
                      readOnly={!isEditing}
                    />
                    <div className="flex items-end pb-2">
                      <FormCheckbox
                        id="motherDeceased"
                        label={t("fields.deceased")}
                        checked={formData.mother?.isDeceased || false}
                        onCheckedChange={(v) =>
                          updateNested("mother", "isDeceased", v)
                        }
                        disabled={!isEditing}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                    <FormField
                      label="City of Birth"
                      value={formData.mother?.placeOfBirth?.city || ""}
                      onChange={(v: string) =>
                        updateNested("mother", "placeOfBirth", {
                          ...formData.mother?.placeOfBirth,
                          city: v,
                        })
                      }
                      readOnly={!isEditing}
                      placeholder="City"
                    />
                    <FormField
                      label="Country of Birth"
                      value={formData.mother?.placeOfBirth?.country || ""}
                      onChange={(v: string) =>
                        updateNested("mother", "placeOfBirth", {
                          ...formData.mother?.placeOfBirth,
                          country: v,
                        })
                      }
                      readOnly={!isEditing}
                      placeholder="Country"
                    />
                  </div>
                  {!(formData.mother?.isDeceased || false) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                      <FormField
                        label="Current City of Residence"
                        value={formData.mother?.cityOfResidence || ""}
                        onChange={(v: string) =>
                          updateNested("mother", "cityOfResidence", v)
                        }
                        readOnly={!isEditing}
                        placeholder="City"
                      />
                      <FormField
                        label="Current Country of Residence"
                        value={formData.mother?.countryOfResidence || ""}
                        onChange={(v: string) =>
                          updateNested("mother", "countryOfResidence", v)
                        }
                        readOnly={!isEditing}
                        placeholder="Country"
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            )}
          </Card>

          {/* Employment & Education */}
          <Card className="bg-white border-slate-200">
            <CardHeader
              className="cursor-pointer hover:bg-slate-50/50 transition-colors px-4 py-3"
              onClick={() => toggleSection("employment")}
            >
              <div className="flex justify-between items-center">
                <CardTitle className="text-sm font-semibold text-slate-800">
                  {t("sections.employment")}
                </CardTitle>
                <ChevronDown
                  className={`h-4 w-4 text-slate-400 transition-transform ${sections.employment ? "rotate-180" : ""}`}
                />
              </div>
            </CardHeader>
            {sections.employment && (
              <CardContent className="pt-0 pb-4 px-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <FormField
                    label={t("fields.occupation")}
                    value={formData.occupation || ""}
                    onChange={(v: string) => updateField("occupation", v)}
                    readOnly={!isEditing}
                    placeholder={t("placeholders.occupation")}
                  />
                  <FormField
                    label={t("fields.jobTitle")}
                    value={formData.jobTitle || ""}
                    onChange={(v: string) => updateField("jobTitle", v)}
                    readOnly={!isEditing}
                    placeholder={t("placeholders.jobTitle")}
                  />
                  <FormField
                    label={t("fields.employerName")}
                    value={formData.employer?.name || ""}
                    onChange={(v: string) =>
                      updateNested("employer", "name", v)
                    }
                    readOnly={!isEditing}
                    placeholder={t("placeholders.employer")}
                  />
                  <FormField
                    label={t("fields.annualIncome")}
                    value={formData.annualIncome || ""}
                    onChange={(v: string) => updateField("annualIncome", v)}
                    readOnly={!isEditing}
                    placeholder={t("placeholders.annualIncome")}
                  />
                  {isEditing ? (
                    <FormSelect
                      label={t("fields.industrySector.label")}
                      value={formData.industrySector || ""}
                      onChange={(v: string) =>
                        updateStrictField("industrySector", v)
                      }
                      options={[
                        {
                          value: "Technology",
                          label: t("fields.industrySector.options.technology"),
                        },
                        {
                          value: "Healthcare",
                          label: t("fields.industrySector.options.healthcare"),
                        },
                        {
                          value: "Education",
                          label: t("fields.industrySector.options.education"),
                        },
                        {
                          value: "Finance",
                          label: t("fields.industrySector.options.finance"),
                        },
                        {
                          value: "Construction",
                          label: t(
                            "fields.industrySector.options.construction",
                          ),
                        },
                        {
                          value: "Manufacturing",
                          label: t(
                            "fields.industrySector.options.manufacturing",
                          ),
                        },
                        {
                          value: "Retail",
                          label: t("fields.industrySector.options.retail"),
                        },
                        {
                          value: "Government",
                          label: t("fields.industrySector.options.government"),
                        },
                        {
                          value: "Military/Defense",
                          label: t("fields.industrySector.options.military"),
                        },
                        {
                          value: "Other",
                          label: t("fields.industrySector.options.other"),
                        },
                      ]}
                      placeholder={t("placeholders.sector")}
                    />
                  ) : (
                    <FormField
                      label={t("fields.industrySector.label")}
                      value={formData.industrySector || ""}
                      onChange={() => {}}
                      readOnly
                    />
                  )}
                  {isEditing ? (
                    <FormSelect
                      label={t("fields.educationLevel.label")}
                      value={formData.educationLevel || ""}
                      onChange={(v: string) =>
                        updateStrictField("educationLevel", v)
                      }
                      options={[
                        {
                          value: "Did not graduate high school",
                          label: t("fields.educationLevel.options.notGraduate"),
                        },
                        {
                          value: "High School",
                          label: t("fields.educationLevel.options.highSchool"),
                        },
                        {
                          value: "Some College",
                          label: t("fields.educationLevel.options.someCollege"),
                        },
                        {
                          value: "Associate Degree",
                          label: t("fields.educationLevel.options.associate"),
                        },
                        {
                          value: "Bachelor&apos;s Degree",
                          label: t("fields.educationLevel.options.bachelor"),
                        },
                        {
                          value: "Master&apos;s Degree",
                          label: t("fields.educationLevel.options.master"),
                        },
                        {
                          value: "Doctorate",
                          label: t("fields.educationLevel.options.doctorate"),
                        },
                      ]}
                      placeholder={t("placeholders.education")}
                    />
                  ) : (
                    <FormField
                      label={t("fields.educationLevel.label")}
                      value={formData.educationLevel || ""}
                      onChange={() => {}}
                      readOnly
                    />
                  )}
                  <FormField
                    label={t("fields.fieldOfStudy")}
                    value={formData.educationField || ""}
                    onChange={(v: string) => updateField("educationField", v)}
                    readOnly={!isEditing}
                    placeholder={t("placeholders.fieldStudy")}
                  />
                </div>
              </CardContent>
            )}
          </Card>

          {/* Immigration History */}
          <Card className="bg-white border-slate-200">
            <CardHeader
              className="cursor-pointer hover:bg-slate-50/50 transition-colors px-4 py-3"
              onClick={() => toggleSection("immigration")}
            >
              <div className="flex justify-between items-center">
                <CardTitle className="text-sm font-semibold text-slate-800">
                  {t("sections.immigration")}
                </CardTitle>
                <ChevronDown
                  className={`h-4 w-4 text-slate-400 transition-transform ${sections.immigration ? "rotate-180" : ""}`}
                />
              </div>
            </CardHeader>
            {sections.immigration && (
              <CardContent className="pt-0 pb-4 px-4 space-y-3">
                <FormCheckbox
                  id="pva"
                  label={t("fields.immigrationHistory.previousVisa")}
                  checked={
                    formData.immigrationHistory?.previousVisaApplications ||
                    false
                  }
                  onCheckedChange={(c) =>
                    updateNested(
                      "immigrationHistory",
                      "previousVisaApplications",
                      c,
                    )
                  }
                  disabled={!isEditing}
                />
                <FormCheckbox
                  id="pvd"
                  label={t("fields.immigrationHistory.visaDenial")}
                  checked={
                    formData.immigrationHistory?.previousVisaDenial || false
                  }
                  onCheckedChange={(c) =>
                    updateNested("immigrationHistory", "previousVisaDenial", c)
                  }
                  disabled={!isEditing}
                  variant="warning"
                />
                <FormCheckbox
                  id="ov"
                  label={t("fields.immigrationHistory.overstay")}
                  checked={
                    formData.immigrationHistory?.overstayOrViolation || false
                  }
                  onCheckedChange={(c) =>
                    updateNested("immigrationHistory", "overstayOrViolation", c)
                  }
                  disabled={!isEditing}
                  variant="warning"
                />
                <FormCheckbox
                  id="cr"
                  label={t("fields.immigrationHistory.criminalRecord")}
                  checked={formData.immigrationHistory?.criminalRecord || false}
                  onCheckedChange={(c) =>
                    updateNested("immigrationHistory", "criminalRecord", c)
                  }
                  disabled={!isEditing}
                  variant="warning"
                />
                <FormCheckbox
                  id="rd"
                  label={t("fields.immigrationHistory.removal")}
                  checked={
                    formData.immigrationHistory?.removedOrDeported || false
                  }
                  onCheckedChange={(c) =>
                    updateNested("immigrationHistory", "removedOrDeported", c)
                  }
                  disabled={!isEditing}
                  variant="warning"
                />
                <FormCheckbox
                  id="ms"
                  label={t("fields.immigrationHistory.militaryService")}
                  checked={
                    formData.immigrationHistory?.priorMilitaryService || false
                  }
                  onCheckedChange={(c) =>
                    updateNested(
                      "immigrationHistory",
                      "priorMilitaryService",
                      c,
                    )
                  }
                  disabled={!isEditing}
                />
                <FormCheckbox
                  id="swt"
                  label={t("fields.immigrationHistory.weaponsTraining")}
                  checked={
                    formData.immigrationHistory?.specializedWeaponsTraining ||
                    false
                  }
                  onCheckedChange={(c) =>
                    updateNested(
                      "immigrationHistory",
                      "specializedWeaponsTraining",
                      c,
                    )
                  }
                  disabled={!isEditing}
                />
                <FormCheckbox
                  id="uag"
                  label={t("fields.immigrationHistory.armedGroups")}
                  checked={
                    formData.immigrationHistory?.unofficialArmedGroups || false
                  }
                  onCheckedChange={(c) =>
                    updateNested(
                      "immigrationHistory",
                      "unofficialArmedGroups",
                      c,
                    )
                  }
                  disabled={!isEditing}
                />
              </CardContent>
            )}
          </Card>

          {/* Relationship Evidence */}
          <Card className="bg-white border-slate-200">
            <CardHeader
              className="cursor-pointer hover:bg-slate-50/50 transition-colors px-4 py-3"
              onClick={() => toggleSection("relationship")}
            >
              <div className="flex justify-between items-center">
                <CardTitle className="text-sm font-semibold text-slate-800">
                  {t("sections.relationship")}
                </CardTitle>
                <ChevronDown
                  className={`h-4 w-4 text-slate-400 transition-transform ${sections.relationship ? "rotate-180" : ""}`}
                />
              </div>
            </CardHeader>
            {sections.relationship && (
              <CardContent className="pt-0 pb-4 px-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <FormSelect
                    label={t("fields.relationshipType.label")}
                    value={formData.relationship?.type || ""}
                    onChange={(v) => updateNested("relationship", "type", v)}
                    options={[
                      {
                        value: "Spouse",
                        label: t("fields.relationshipType.options.spouse"),
                      },
                      {
                        value: "Fiance",
                        label: t("fields.relationshipType.options.fiance"),
                      },
                    ]}
                    placeholder={t("placeholders.selectGeneric")}
                    readOnly={!isEditing}
                  />
                  <FormField
                    label={t("fields.relationshipStart")}
                    type="date"
                    value={formData.relationship?.startDate || ""}
                    onChange={(v) =>
                      updateNested("relationship", "startDate", v)
                    }
                    readOnly={!isEditing}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <FormField
                    label={t("fields.marriageDate")}
                    type="date"
                    value={formData.relationship?.marriageDate || ""}
                    onChange={(v) =>
                      updateNested("relationship", "marriageDate", v)
                    }
                    readOnly={!isEditing}
                  />
                  <FormField
                    label={t("fields.visits")}
                    value={
                      formData.relationship?.numberOfInPersonVisits?.toString() ||
                      ""
                    }
                    onChange={(v) =>
                      updateNested(
                        "relationship",
                        "numberOfInPersonVisits",
                        v ? Number(v) : null,
                      )
                    }
                    type="number"
                    placeholder="0"
                    readOnly={!isEditing}
                  />
                </div>

                <FormField
                  label={t("fields.howMet")}
                  value={formData.relationship?.howDidYouMeet || ""}
                  onChange={(v) =>
                    updateNested("relationship", "howDidYouMeet", v)
                  }
                  readOnly={!isEditing}
                  placeholder={t("placeholders.relMeet")}
                />

                <h4 className="text-xs font-medium text-slate-600 mt-4 mb-3">
                  {t("fields.evidence.header")}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FormCheckbox
                    id="coh"
                    label={t("fields.evidence.cohabitation")}
                    checked={formData.relationship?.cohabitationProof || false}
                    onCheckedChange={(c) =>
                      updateNested("relationship", "cohabitationProof", c)
                    }
                    disabled={!isEditing}
                  />
                  <FormCheckbox
                    id="fin"
                    label={t("fields.evidence.sharing")}
                    checked={
                      formData.relationship?.sharedFinancialAccounts || false
                    }
                    onCheckedChange={(c) =>
                      updateNested("relationship", "sharedFinancialAccounts", c)
                    }
                    disabled={!isEditing}
                  />
                  <FormCheckbox
                    id="wed"
                    label={t("fields.evidence.wedding")}
                    checked={formData.relationship?.weddingPhotos || false}
                    onCheckedChange={(c) =>
                      updateNested("relationship", "weddingPhotos", c)
                    }
                    disabled={!isEditing}
                  />
                  <FormCheckbox
                    id="comm"
                    label={t("fields.evidence.comm")}
                    checked={formData.relationship?.communicationLogs || false}
                    onCheckedChange={(c) =>
                      updateNested("relationship", "communicationLogs", c)
                    }
                    disabled={!isEditing}
                  />
                  <FormCheckbox
                    id="money"
                    label={t("fields.evidence.money")}
                    checked={
                      formData.relationship?.moneyTransferReceipts || false
                    }
                    onCheckedChange={(c) =>
                      updateNested("relationship", "moneyTransferReceipts", c)
                    }
                    disabled={!isEditing}
                  />
                  <FormCheckbox
                    id="meet"
                    label={t("fields.evidence.meet")}
                    checked={formData.relationship?.meetingProof || false}
                    onCheckedChange={(c) =>
                      updateNested("relationship", "meetingProof", c)
                    }
                    disabled={!isEditing}
                  />
                </div>
              </CardContent>
            )}
          </Card>

          {/* Documents & Financial */}
          <Card className="bg-white border-slate-200">
            <CardHeader
              className="cursor-pointer hover:bg-slate-50/50 transition-colors px-4 py-3"
              onClick={() => toggleSection("documents")}
            >
              <div className="flex justify-between items-center">
                <CardTitle className="text-sm font-semibold text-slate-800">
                  {t("sections.documents")}
                </CardTitle>
                <ChevronDown
                  className={`h-4 w-4 text-slate-400 transition-transform ${sections.documents ? "rotate-180" : ""}`}
                />
              </div>
            </CardHeader>
            {sections.documents && (
              <CardContent className="pt-0 pb-4 px-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-xs font-medium text-slate-600 mb-3 block">
                      {t("fields.identityDocs")}
                    </h4>
                    <div className="space-y-3">
                      <FormCheckbox
                        id="ppt"
                        label={t("fields.docs.passport")}
                        checked={formData.documents?.hasPassport || false}
                        onCheckedChange={(c) =>
                          updateNested("documents", "hasPassport", c)
                        }
                        disabled={!isEditing}
                      />
                      <FormCheckbox
                        id="bc"
                        label={t("fields.docs.birth")}
                        checked={
                          formData.documents?.hasBirthCertificate || false
                        }
                        onCheckedChange={(c) =>
                          updateNested("documents", "hasBirthCertificate", c)
                        }
                        disabled={!isEditing}
                      />
                      <FormCheckbox
                        id="mc"
                        label={t("fields.docs.marriage")}
                        checked={
                          formData.documents?.hasMarriageCertificate || false
                        }
                        onCheckedChange={(c) =>
                          updateNested("documents", "hasMarriageCertificate", c)
                        }
                        disabled={!isEditing}
                      />
                      <FormCheckbox
                        id="pc"
                        label={t("fields.docs.police")}
                        checked={
                          formData.documents?.hasPoliceCertificate || false
                        }
                        onCheckedChange={(c) =>
                          updateNested("documents", "hasPoliceCertificate", c)
                        }
                        disabled={!isEditing}
                      />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs font-medium text-slate-600 mb-3 block">
                      {t("fields.financialDocs")}
                    </h4>
                    <div className="space-y-3">
                      <FormCheckbox
                        id="tr"
                        label={t("fields.financial.tax")}
                        checked={
                          formData.financialProfile?.hasTaxReturns || false
                        }
                        onCheckedChange={(c) =>
                          updateNested("financialProfile", "hasTaxReturns", c)
                        }
                        disabled={!isEditing}
                      />
                      <FormCheckbox
                        id="ps"
                        label={t("fields.financial.paystubs")}
                        checked={
                          formData.financialProfile?.hasPaystubs || false
                        }
                        onCheckedChange={(c) =>
                          updateNested("financialProfile", "hasPaystubs", c)
                        }
                        disabled={!isEditing}
                      />
                      <FormCheckbox
                        id="bs"
                        label={t("fields.financial.bank")}
                        checked={
                          formData.financialProfile?.hasBankStatements || false
                        }
                        onCheckedChange={(c) =>
                          updateNested(
                            "financialProfile",
                            "hasBankStatements",
                            c,
                          )
                        }
                        disabled={!isEditing}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Affidavit Support Calculator */}
          <Card className="bg-white border-slate-200">
            <CardHeader
              className="cursor-pointer hover:bg-slate-50/50 transition-colors px-4 py-3"
              onClick={() => toggleSection("affidavit")}
            >
              <div className="flex justify-between items-center">
                <CardTitle className="text-sm font-semibold text-slate-800">
                  {t("sections.affidavit")}
                </CardTitle>
                <ChevronDown
                  className={`h-4 w-4 text-slate-400 transition-transform ${sections.affidavit ? "rotate-180" : ""}`}
                />
              </div>
            </CardHeader>
            {sections.affidavit && (
              <CardContent className="pt-0 pb-4 px-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {isEditing ? (
                    <FormSelect
                      label={t("fields.sponsorStatus.label")}
                      value={formData.sponsorStatus || ""}
                      onChange={(v: string) =>
                        updateField(
                          "sponsorStatus",
                          v as "citizen" | "greenCard",
                        )
                      }
                      options={[
                        {
                          value: "citizen",
                          label: t("fields.sponsorStatus.options.citizen"),
                        },
                        {
                          value: "greenCard",
                          label: t("fields.sponsorStatus.options.greenCard"),
                        },
                      ]}
                      placeholder={t("placeholders.selectGeneric")}
                    />
                  ) : (
                    <FormField
                      label={t("fields.sponsorStatus.label")}
                      value={formData.sponsorStatus || ""}
                      onChange={() => {}}
                      readOnly
                    />
                  )}
                  <FormCheckbox
                    id="military"
                    label={t("fields.activeMilitary")}
                    checked={formData.isMilitary || false}
                    onCheckedChange={(c) => updateField("isMilitary", c)}
                    disabled={!isEditing}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormCheckbox
                    id="married"
                    label={t("fields.married")}
                    checked={formData.isMarried || false}
                    onCheckedChange={(c) => updateField("isMarried", c)}
                    disabled={!isEditing}
                  />
                  <FormField
                    label={t("fields.numChildren")}
                    type="number"
                    value={formData.numberOfChildren?.toString() || "0"}
                    onChange={(v: string) =>
                      updateField("numberOfChildren", v ? Number(v) : 0)
                    }
                    readOnly={!isEditing}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    label={t("fields.taxDependents")}
                    type="number"
                    value={formData.taxDependents?.toString() || "0"}
                    onChange={(v: string) =>
                      updateField("taxDependents", v ? Number(v) : 0)
                    }
                    readOnly={!isEditing}
                  />
                  <FormCheckbox
                    id="prevSponsor"
                    label={t("fields.prevSponsorship")}
                    checked={formData.hasPreviousSponsorship || false}
                    onCheckedChange={(c) =>
                      updateField("hasPreviousSponsorship", c)
                    }
                    disabled={!isEditing}
                  />
                </div>

                {formData.hasPreviousSponsorship && (
                  <FormField
                    label={t("fields.prevSponsorshipCount")}
                    type="number"
                    value={formData.previousSponsoredCount?.toString() || "0"}
                    onChange={(v: string) =>
                      updateField("previousSponsoredCount", v ? Number(v) : 0)
                    }
                    readOnly={!isEditing}
                  />
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <FormCheckbox
                    id="sponsorApplicant"
                    label={t("fields.sponsoringApplicant")}
                    checked={formData.currentSponsoredApplicant !== false} // defaults to true
                    onCheckedChange={(c) =>
                      updateField("currentSponsoredApplicant", c)
                    }
                    disabled={!isEditing}
                  />
                  <FormCheckbox
                    id="sponsorSpouse"
                    label={t("fields.sponsoringSpouse")}
                    checked={formData.currentSponsoredSpouse || false}
                    onCheckedChange={(c) =>
                      updateField("currentSponsoredSpouse", c)
                    }
                    disabled={!isEditing}
                  />
                  <FormField
                    label={t("fields.sponsoringChildren")}
                    type="number"
                    value={formData.currentSponsoredChildren?.toString() || "0"}
                    onChange={(v: string) =>
                      updateField("currentSponsoredChildren", v ? Number(v) : 0)
                    }
                    readOnly={!isEditing}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormCheckbox
                    id="sponsorDeceased"
                    label={t("fields.sponsorDeceased")}
                    checked={formData.sponsorDeceased || false}
                    onCheckedChange={(c) => updateField("sponsorDeceased", c)}
                    disabled={!isEditing}
                  />
                  <FormField
                    label={t("fields.assetValue")}
                    type="number"
                    value={formData.assetValue?.toString() || "0"}
                    onChange={(v: string) =>
                      updateField("assetValue", v ? Number(v) : 0)
                    }
                    readOnly={!isEditing}
                  />
                </div>

                <FormField
                  label={t("fields.relationshipToApplicant")}
                  value={formData.relationshipToApplicant || ""}
                  onChange={(v: string) =>
                    updateField("relationshipToApplicant", v)
                  }
                  readOnly={!isEditing}
                  placeholder={t("placeholders.selectGeneric")}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <FormCheckbox
                    id="vawa"
                    label={t("fields.vawa")}
                    checked={formData.isVAWA || false}
                    onCheckedChange={(c) => updateField("isVAWA", c)}
                    disabled={!isEditing}
                  />
                  <FormCheckbox
                    id="widow"
                    label={t("fields.widow")}
                    checked={formData.isWidow || false}
                    onCheckedChange={(c) => updateField("isWidow", c)}
                    disabled={!isEditing}
                  />
                  <FormCheckbox
                    id="specialImmigrant"
                    label={t("fields.specialImmigrant")}
                    checked={formData.isSpecialImmigrant || false}
                    onCheckedChange={(c) =>
                      updateField("isSpecialImmigrant", c)
                    }
                    disabled={!isEditing}
                  />
                </div>
              </CardContent>
            )}
          </Card>

          {/* Visa Application Context */}
          <Card className="bg-white border-slate-200">
            <CardHeader
              className="cursor-pointer hover:bg-slate-50/50 transition-colors px-4 py-3"
              onClick={() => toggleSection("visaContext")}
            >
              <div className="flex justify-between items-center">
                <CardTitle className="text-sm font-semibold text-slate-800">
                  {t("sections.visaContext")}
                </CardTitle>
                <ChevronDown
                  className={`h-4 w-4 text-slate-400 transition-transform ${sections.visaContext ? "rotate-180" : ""}`}
                />
              </div>
            </CardHeader>
            {sections.visaContext && (
              <CardContent className="pt-0 pb-4 px-4 space-y-8">
                <div>
                  <h4 className="text-xs font-medium text-slate-600 mb-3 block">
                    {t("fields.applicationDetails")}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {isEditing ? (
                      <FormSelect
                        label={t("fields.visaType.label")}
                        value={formData.visaType || ""}
                        onChange={(v: string) => updateField("visaType", v)}
                        options={[
                          {
                            value: "IR-1",
                            label: t("fields.visaType.options.ir1"),
                          },
                          {
                            value: "CR-1",
                            label: t("fields.visaType.options.cr1"),
                          },
                          {
                            value: "K-1",
                            label: t("fields.visaType.options.k1"),
                          },
                          {
                            value: "IR-5",
                            label: t("fields.visaType.options.ir5"),
                          },
                          {
                            value: "F-1",
                            label: t("fields.visaType.options.f1"),
                          },
                          {
                            value: "H-1B",
                            label: t("fields.visaType.options.h1b"),
                          },
                          {
                            value: "B1/B2",
                            label: t("fields.visaType.options.b1b2"),
                          },
                          {
                            value: "Other",
                            label: t("fields.visaType.options.other"),
                          },
                        ]}
                        placeholder={t("placeholders.visaType")}
                      />
                    ) : (
                      <FormField
                        label={t("fields.visaType.label")}
                        value={formData.visaType || ""}
                        onChange={() => {}}
                        readOnly
                      />
                    )}
                    <FormField
                      label={t("fields.visaCategory")}
                      value={formData.visaCategory || ""}
                      onChange={(v: string) => updateField("visaCategory", v)}
                      readOnly={!isEditing}
                      placeholder={t("placeholders.visaCategory")}
                    />
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-5">
                  <h4 className="text-xs font-medium text-slate-600 mb-3 block">
                    {t("fields.sponsorHeader")}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <FormField
                      label={t("fields.sponsorFirstName")}
                      value={formData.sponsor?.name?.first || ""}
                      onChange={(v: string) =>
                        updateNested("sponsor", "name", {
                          ...formData.sponsor?.name,
                          first: v,
                        })
                      }
                      readOnly={!isEditing}
                      placeholder={t("placeholders.firstName")}
                    />
                    <FormField
                      label={t("fields.sponsorMiddleName")}
                      value={formData.sponsor?.name?.middle || ""}
                      onChange={(v: string) =>
                        updateNested("sponsor", "name", {
                          ...formData.sponsor?.name,
                          middle: v,
                        })
                      }
                      readOnly={!isEditing}
                      placeholder={t("placeholders.middleName")}
                    />
                    <FormField
                      label={t("fields.sponsorLastName")}
                      value={formData.sponsor?.name?.last || ""}
                      onChange={(v: string) =>
                        updateNested("sponsor", "name", {
                          ...formData.sponsor?.name,
                          last: v,
                        })
                      }
                      readOnly={!isEditing}
                      placeholder={t("placeholders.lastName")}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                    <FormField
                      label={t("fields.dob")}
                      type="date"
                      value={formData.sponsor?.dateOfBirth || ""}
                      onChange={(v: string) =>
                        updateNested("sponsor", "dateOfBirth", v)
                      }
                      readOnly={!isEditing}
                    />
                    <FormField
                      label={t("fields.sponsorPhone")}
                      value={formData.sponsor?.phone || ""}
                      onChange={(v: string) =>
                        updateNested("sponsor", "phone", v)
                      }
                      readOnly={!isEditing}
                      placeholder={t("placeholders.phone")}
                    />
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-5">
                  <h4 className="text-xs font-medium text-slate-600 mb-3 block">
                    Beneficiary Details
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <FormField
                      label={t("fields.beneficiaryFirstName")}
                      value={formData.beneficiary?.name?.first || ""}
                      onChange={(v: string) =>
                        updateNested("beneficiary", "name", {
                          ...formData.beneficiary?.name,
                          first: v,
                        })
                      }
                      readOnly={!isEditing}
                      placeholder={t("placeholders.firstName")}
                    />
                    <FormField
                      label={t("fields.beneficiaryMiddleName")}
                      value={formData.beneficiary?.name?.middle || ""}
                      onChange={(v: string) =>
                        updateNested("beneficiary", "name", {
                          ...formData.beneficiary?.name,
                          middle: v,
                        })
                      }
                      readOnly={!isEditing}
                      placeholder={t("placeholders.middleName")}
                    />
                    <FormField
                      label={t("fields.beneficiaryLastName")}
                      value={formData.beneficiary?.name?.last || ""}
                      onChange={(v: string) =>
                        updateNested("beneficiary", "name", {
                          ...formData.beneficiary?.name,
                          last: v,
                        })
                      }
                      readOnly={!isEditing}
                      placeholder={t("placeholders.lastName")}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                    <FormField
                      label={t("fields.dob")}
                      type="date"
                      value={formData.beneficiary?.dateOfBirth || ""}
                      onChange={(v: string) =>
                        updateNested("beneficiary", "dateOfBirth", v)
                      }
                      readOnly={!isEditing}
                    />
                    <FormField
                      label={t("fields.countryOfResidence")}
                      value={formData.beneficiary?.countryOfResidence || ""}
                      onChange={(v: string) =>
                        updateNested("beneficiary", "countryOfResidence", v)
                      }
                      readOnly={!isEditing}
                      placeholder={t("placeholders.country")}
                    />
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Legal & Eligibility Details */}
          <Card className="bg-white border-slate-200">
            <CardHeader
              className="cursor-pointer hover:bg-slate-50/50 transition-colors px-4 py-3"
              onClick={() => toggleSection("visaEligibility")}
            >
              <div className="flex justify-between items-center">
                <CardTitle className="text-sm font-semibold text-slate-800">
                  {t("sections.visaEligibility")}
                </CardTitle>
                <ChevronDown
                  className={`h-4 w-4 text-slate-400 transition-transform ${sections.visaEligibility ? "rotate-180" : ""}`}
                />
              </div>
            </CardHeader>
            {sections.visaEligibility && (
              <CardContent className="pt-0 pb-4 px-4 space-y-8">
                <div>
                  <h4 className="text-xs font-medium text-slate-600 mb-3 block">
                    {t("fields.petitionerDetails")}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {isEditing ? (
                      <FormSelect
                        label={t("fields.petitionerStatus.label")}
                        value={formData.visaEligibility?.petitionerStatus || ""}
                        onChange={(v: string) =>
                          updateNested("visaEligibility", "petitionerStatus", v)
                        }
                        options={[
                          {
                            value: "US_CITIZEN",
                            label: t(
                              "fields.petitionerStatus.options.usCitizen",
                            ),
                          },
                          {
                            value: "LPR",
                            label: t("fields.petitionerStatus.options.lpr"),
                          },
                          {
                            value: "NONE",
                            label: t("fields.petitionerStatus.options.none"),
                          },
                        ]}
                        placeholder={t("placeholders.selectGeneric")}
                      />
                    ) : (
                      <FormField
                        label={t("fields.petitionerStatus.label")}
                        value={formData.visaEligibility?.petitionerStatus || ""}
                        onChange={() => {}}
                        readOnly
                      />
                    )}
                    {isEditing ? (
                      <FormSelect
                        label={t("fields.petitionerAge.label")}
                        value={
                          formData.visaEligibility?.petitionerAgeGroup || ""
                        }
                        onChange={(v: string) =>
                          updateNested(
                            "visaEligibility",
                            "petitionerAgeGroup",
                            v,
                          )
                        }
                        options={[
                          {
                            value: "UNDER_21",
                            label: t("fields.petitionerAge.options.under21"),
                          },
                          {
                            value: "OVER_21",
                            label: t("fields.petitionerAge.options.over21"),
                          },
                        ]}
                        placeholder={t("placeholders.selectGeneric")}
                      />
                    ) : (
                      <FormField
                        label={t("fields.petitionerAge.label")}
                        value={
                          formData.visaEligibility?.petitionerAgeGroup || ""
                        }
                        onChange={() => {}}
                        readOnly
                      />
                    )}
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-5">
                  <h4 className="text-xs font-medium text-slate-600 mb-3 block">
                    {t("fields.statusIntent")}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {isEditing ? (
                      <FormSelect
                        label={t("fields.statusOrigin.label")}
                        value={formData.visaEligibility?.statusOrigin || ""}
                        onChange={(v: string) =>
                          updateNested("visaEligibility", "statusOrigin", v)
                        }
                        options={[
                          {
                            value: "BIRTH",
                            label: t("fields.statusOrigin.options.birth"),
                          },
                          {
                            value: "NATURALIZED",
                            label: t("fields.statusOrigin.options.naturalized"),
                          },
                          {
                            value: "GREEN_CARD",
                            label: t("fields.statusOrigin.options.greenCard"),
                          },
                        ]}
                        placeholder={t("placeholders.selectGeneric")}
                      />
                    ) : (
                      <FormField
                        label={t("fields.statusOrigin.label")}
                        value={formData.visaEligibility?.statusOrigin || ""}
                        onChange={() => {}}
                        readOnly
                      />
                    )}
                    {isEditing ? (
                      <FormSelect
                        label={t("fields.intent.label")}
                        value={formData.visaEligibility?.intent || ""}
                        onChange={(v: string) =>
                          updateNested("visaEligibility", "intent", v)
                        }
                        options={[
                          {
                            value: "PERMANENT",
                            label: t("fields.intent.options.permanent"),
                          },
                          {
                            value: "TEMPORARY",
                            label: t("fields.intent.options.temporary"),
                          },
                        ]}
                        placeholder={t("placeholders.selectGeneric")}
                      />
                    ) : (
                      <FormField
                        label={t("fields.intent.label")}
                        value={formData.visaEligibility?.intent || ""}
                        onChange={() => {}}
                        readOnly
                      />
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                    {isEditing ? (
                      <FormSelect
                        label={t("fields.sponsorBase.label")}
                        value={formData.visaEligibility?.sponsorBase || ""}
                        onChange={(v: string) =>
                          updateNested("visaEligibility", "sponsorBase", v)
                        }
                        options={[
                          {
                            value: "FAMILY",
                            label: t("fields.sponsorBase.options.family"),
                          },
                          {
                            value: "EMPLOYMENT",
                            label: t("fields.sponsorBase.options.employment"),
                          },
                          {
                            value: "INVESTMENT",
                            label: t("fields.sponsorBase.options.investment"),
                          },
                          {
                            value: "HUMANITARIAN",
                            label: t("fields.sponsorBase.options.humanitarian"),
                          },
                        ]}
                        placeholder={t("placeholders.selectGeneric")}
                      />
                    ) : (
                      <FormField
                        label={t("fields.sponsorBase.label")}
                        value={formData.visaEligibility?.sponsorBase || ""}
                        onChange={() => {}}
                        readOnly
                      />
                    )}
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-5">
                  <h4 className="text-xs font-medium text-slate-600 mb-3 block">
                    {t("fields.historyLegal")}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {isEditing ? (
                      <FormSelect
                        label={t("fields.violationHistory.label")}
                        value={formData.visaEligibility?.violationHistory || ""}
                        onChange={(v: string) =>
                          updateNested("visaEligibility", "violationHistory", v)
                        }
                        options={[
                          {
                            value: "NO",
                            label: t("fields.violationHistory.options.no"),
                          },
                          {
                            value: "YES",
                            label: t("fields.violationHistory.options.yes"),
                          },
                          {
                            value: "NOT_SURE",
                            label: t("fields.violationHistory.options.unsure"),
                          },
                        ]}
                        placeholder={t("placeholders.selectGeneric")}
                      />
                    ) : (
                      <FormField
                        label={t("fields.violationHistory.label")}
                        value={formData.visaEligibility?.violationHistory || ""}
                        onChange={() => {}}
                        readOnly
                      />
                    )}

                    {isEditing ? (
                      <FormSelect
                        label={t("fields.legalStatus.label")}
                        value={formData.visaEligibility?.legalStatus || ""}
                        onChange={(v: string) =>
                          updateNested("visaEligibility", "legalStatus", v)
                        }
                        options={[
                          {
                            value: "MARRIAGE_REGISTERED",
                            label: t("fields.legalStatus.options.registered"),
                          },
                          {
                            value: "BIOLOGICAL",
                            label: t("fields.legalStatus.options.biological"),
                          },
                          {
                            value: "ADOPTIVE",
                            label: t("fields.legalStatus.options.adoptive"),
                          },
                          {
                            value: "STEP",
                            label: t("fields.legalStatus.options.step"),
                          },
                        ]}
                        placeholder={t("placeholders.selectGeneric")}
                      />
                    ) : (
                      <FormField
                        label={t("fields.legalStatus.label")}
                        value={formData.visaEligibility?.legalStatus || ""}
                        onChange={() => {}}
                        readOnly
                      />
                    )}
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
