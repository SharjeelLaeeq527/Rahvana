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

export default function ProfilePage() {
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
      setMessage("Profile updated successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Error saving profile:", error);
      setMessage("Error updating profile. Please try again.");
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
              Your Profile
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Manage your data for auto-filling forms
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto mt-2 md:mt-0">
            <Button
              variant="outline"
              onClick={() => router.push("/complete-profile")}
              className="w-full sm:w-auto h-9 text-sm px-4 border-primary/20 hover:bg-primary/5 text-primary"
            >
              <Check className="w-4 h-4 mr-2" />
              Complete Master Profile
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
                  Cancel
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
                  Save
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => setIsEditing(true)}
                className="w-full sm:w-auto h-9 text-sm px-4"
              >
                <Pencil className="w-4 h-4 mr-2" />
                Edit Profile
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
                Profile Completeness
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
                  Personal Information
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
                    label="First Name"
                    value={formData.name?.first || ""}
                    onChange={(v: string) => updateNested("name", "first", v)}
                    readOnly={!isEditing}
                    placeholder="Enter first name"
                  />
                  <FormField
                    label="Middle Name"
                    value={formData.name?.middle || ""}
                    onChange={(v: string) => updateNested("name", "middle", v)}
                    readOnly={!isEditing}
                    placeholder="Enter middle name"
                  />
                  <FormField
                    label="Last Name"
                    value={formData.name?.last || ""}
                    onChange={(v: string) => updateNested("name", "last", v)}
                    readOnly={!isEditing}
                    placeholder="Enter last name"
                  />
                  <FormField
                    label="Date of Birth"
                    type="date"
                    value={formData.dateOfBirth || ""}
                    onChange={(v: string) => updateField("dateOfBirth", v)}
                    readOnly={!isEditing}
                  />
                  <FormField
                    label="City of Birth"
                    value={formData.placeOfBirth?.city || ""}
                    onChange={(v: string) =>
                      updateNested("placeOfBirth", "city", v)
                    }
                    readOnly={!isEditing}
                    placeholder="Enter city"
                  />
                  <FormField
                    label="Country of Birth"
                    value={formData.placeOfBirth?.country || ""}
                    onChange={(v: string) =>
                      updateNested("placeOfBirth", "country", v)
                    }
                    readOnly={!isEditing}
                    placeholder="Enter country"
                  />
                  {isEditing ? (
                    <FormSelect
                      label="Sex"
                      value={formData.sex || "Male"}
                      onChange={(v: string) => updateStrictField("sex", v)}
                      options={[
                        { value: "Male", label: "Male" },
                        { value: "Female", label: "Female" },
                      ]}
                    />
                  ) : (
                    <FormField
                      label="Sex"
                      value={formData.sex || ""}
                      onChange={() => {}}
                      readOnly
                    />
                  )}
                  <FormField
                    label="Nationality"
                    value={formData.nationality || ""}
                    onChange={(v: string) => updateField("nationality", v)}
                    readOnly={!isEditing}
                    placeholder="Enter nationality"
                  />
                  {isEditing ? (
                    <FormSelect
                      label="Citizenship Status"
                      value={formData.citizenshipStatus || "Other"}
                      onChange={(v: string) =>
                        updateStrictField("citizenshipStatus", v)
                      }
                      options={[
                        { value: "USCitizen", label: "U.S. Citizen" },
                        { value: "LPR", label: "Legal Permanent Resident" },
                        { value: "Other", label: "Other" },
                      ]}
                    />
                  ) : (
                    <FormField
                      label="Citizenship Status"
                      value={
                        formData.citizenshipStatus === "USCitizen"
                          ? "U.S. Citizen"
                          : formData.citizenshipStatus === "LPR"
                            ? "Green Card Holder"
                            : "Other"
                      }
                      onChange={() => {}}
                      readOnly
                    />
                  )}
                  {isEditing ? (
                    <FormSelect
                      label="Marital Status"
                      value={formData.maritalStatus || "Single"}
                      onChange={(v: string) =>
                        updateStrictField("maritalStatus", v)
                      }
                      options={[
                        { value: "Single", label: "Single" },
                        { value: "Married", label: "Married" },
                        { value: "Divorced", label: "Divorced" },
                        { value: "Widowed", label: "Widowed" },
                        { value: "Separated", label: "Separated" },
                        { value: "Annulled", label: "Annulled" },
                      ]}
                    />
                  ) : (
                    <FormField
                      label="Marital Status"
                      value={formData.maritalStatus || ""}
                      onChange={() => {}}
                      readOnly
                    />
                  )}
                  <FormField
                    label="Passport Number"
                    value={formData.passportNumber || ""}
                    onChange={(v: string) => updateField("passportNumber", v)}
                    readOnly={!isEditing}
                    placeholder="Enter passport number"
                  />
                  <FormField
                    label="Passport Issue Date"
                    type="date"
                    value={formData.passportIssueDate || ""}
                    onChange={(v: string) =>
                      updateField("passportIssueDate", v)
                    }
                    readOnly={!isEditing}
                  />
                  <FormField
                    label="Passport Expiry"
                    type="date"
                    value={formData.passportExpiry || ""}
                    onChange={(v: string) => updateField("passportExpiry", v)}
                    readOnly={!isEditing}
                  />
                  <FormField
                    label="Passport Issuing Country"
                    value={formData.passportCountry || ""}
                    onChange={(v: string) => updateField("passportCountry", v)}
                    readOnly={!isEditing}
                    placeholder="Enter country"
                  />

                  {/* Legal Identifiers */}
                  <div className="sm:col-span-2 md:col-span-3 pt-4 border-t border-slate-100 mt-4">
                    <h4 className="text-xs font-medium text-slate-600 mb-3">
                      Legal Identifiers
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      <FormField
                        label="SSN (if any)"
                        value={formData.ssn || ""}
                        onChange={(v: string) => updateField("ssn", v)}
                        readOnly={!isEditing}
                        placeholder="000-00-0000"
                      />
                      <FormField
                        label="A-Number (if any)"
                        value={formData.alienNumber || ""}
                        onChange={(v: string) => updateField("alienNumber", v)}
                        readOnly={!isEditing}
                        placeholder="A-123456789"
                        helpText="Alien Registration Number"
                      />
                      <FormField
                        label="USCIS Account #"
                        value={formData.uscisAccountNumber || ""}
                        onChange={(v: string) =>
                          updateField("uscisAccountNumber", v)
                        }
                        readOnly={!isEditing}
                        placeholder="123456789012"
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
                  Contact & Address
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
                    label="Phone"
                    value={formData.phone || ""}
                    onChange={(v: string) => updateField("phone", v)}
                    readOnly={!isEditing}
                    placeholder="+1 (555) 000-0000"
                  />
                  <FormField
                    label="Email"
                    value={user.email || ""}
                    onChange={() => {}}
                    disabled
                  />
                  <FormField
                    label="CNIC / National ID"
                    value={formData.cnic || ""}
                    onChange={(v: string) => updateField("cnic", v)}
                    readOnly={!isEditing}
                    placeholder="Enter national ID"
                  />
                </div>

                <div className="border-t border-slate-100 pt-4">
                  <h4 className="text-xs font-medium text-slate-600 mb-3">
                    Current Address
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <FormField
                        label="Street Address"
                        value={formData.currentAddress?.street || ""}
                        onChange={(v: string) => updateAddress("street", v)}
                        readOnly={!isEditing}
                        placeholder="123 Main Street"
                      />
                    </div>
                    <FormField
                      label="City"
                      value={formData.currentAddress?.city || ""}
                      onChange={(v: string) => updateAddress("city", v)}
                      readOnly={!isEditing}
                      placeholder="Enter city"
                    />
                    <FormField
                      label="State"
                      value={formData.currentAddress?.state || ""}
                      onChange={(v: string) => updateAddress("state", v)}
                      readOnly={!isEditing}
                      placeholder="Enter state"
                    />
                    <FormField
                      label="Zip Code"
                      value={formData.currentAddress?.zipCode || ""}
                      onChange={(v: string) => updateAddress("zipCode", v)}
                      readOnly={!isEditing}
                      placeholder="Enter zip code"
                    />
                    <FormField
                      label="Country"
                      value={formData.currentAddress?.country || ""}
                      onChange={(v: string) => updateAddress("country", v)}
                      readOnly={!isEditing}
                      placeholder="Enter country"
                    />
                  </div>
                </div>

                {/* Mailing Address */}
                <div className="border-t border-slate-100 pt-4 mt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <h4 className="text-xs font-medium text-slate-600">
                      Mailing Address
                    </h4>
                  </div>
                  <FormCheckbox
                    id="sameAsCurrent"
                    label="Mailing address is the same as physical address"
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
                        label="Street Address"
                        value={formData.mailingAddress?.street || ""}
                        onChange={(v: string) =>
                          updateNested("mailingAddress", "street", v)
                        }
                        readOnly={!isEditing}
                        placeholder="PO Box 123"
                      />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField
                          label="City"
                          value={formData.mailingAddress?.city || ""}
                          onChange={(v: string) =>
                            updateNested("mailingAddress", "city", v)
                          }
                          readOnly={!isEditing}
                          placeholder="New York"
                        />
                        <FormField
                          label="State / Province"
                          value={formData.mailingAddress?.state || ""}
                          onChange={(v: string) =>
                            updateNested("mailingAddress", "state", v)
                          }
                          readOnly={!isEditing}
                          placeholder="NY"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField
                          label="Zip / Postal Code"
                          value={formData.mailingAddress?.zipCode || ""}
                          onChange={(v: string) =>
                            updateNested("mailingAddress", "zipCode", v)
                          }
                          readOnly={!isEditing}
                          placeholder="10001"
                        />
                        <FormField
                          label="Country"
                          value={formData.mailingAddress?.country || ""}
                          onChange={(v: string) =>
                            updateNested("mailingAddress", "country", v)
                          }
                          readOnly={!isEditing}
                          placeholder="United States"
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
                  Family Background
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
                    Father&apos;s Details
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <FormField
                      label="Father's First Name"
                      value={formData.father?.name?.first || ""}
                      onChange={(v: string) =>
                        updateNested("father", "name", {
                          ...formData.father?.name,
                          first: v,
                        })
                      }
                      readOnly={!isEditing}
                      placeholder="First Name"
                    />
                    <FormField
                      label="Father's Middle Name"
                      value={formData.father?.name?.middle || ""}
                      onChange={(v: string) =>
                        updateNested("father", "name", {
                          ...formData.father?.name,
                          middle: v,
                        })
                      }
                      readOnly={!isEditing}
                      placeholder="Middle Name"
                    />
                    <FormField
                      label="Father's Last Name"
                      value={formData.father?.name?.last || ""}
                      onChange={(v: string) =>
                        updateNested("father", "name", {
                          ...formData.father?.name,
                          last: v,
                        })
                      }
                      readOnly={!isEditing}
                      placeholder="Last Name"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                    <FormField
                      label="Date of Birth"
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
                        label="Person is deceased"
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
                      label="City of Birth"
                      value={formData.father?.placeOfBirth?.city || ""}
                      onChange={(v: string) =>
                        updateNested("father", "placeOfBirth", {
                          ...formData.father?.placeOfBirth,
                          city: v,
                        })
                      }
                      readOnly={!isEditing}
                      placeholder="City"
                    />
                    <FormField
                      label="Country of Birth"
                      value={formData.father?.placeOfBirth?.country || ""}
                      onChange={(v: string) =>
                        updateNested("father", "placeOfBirth", {
                          ...formData.father?.placeOfBirth,
                          country: v,
                        })
                      }
                      readOnly={!isEditing}
                      placeholder="Country"
                    />
                  </div>
                  {!(formData.father?.isDeceased || false) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                      <FormField
                        label="Current City of Residence"
                        value={formData.father?.cityOfResidence || ""}
                        onChange={(v: string) =>
                          updateNested("father", "cityOfResidence", v)
                        }
                        readOnly={!isEditing}
                        placeholder="City"
                      />
                      <FormField
                        label="Current Country of Residence"
                        value={formData.father?.countryOfResidence || ""}
                        onChange={(v: string) =>
                          updateNested("father", "countryOfResidence", v)
                        }
                        readOnly={!isEditing}
                        placeholder="Country"
                      />
                    </div>
                  )}
                </div>

                {/* Mother's Details */}
                <div>
                  <h4 className="text-xs font-medium text-slate-600 mb-3">
                    Mother&apos;s Details
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <FormField
                      label="Mother's First Name"
                      value={formData.mother?.name?.first || ""}
                      onChange={(v: string) =>
                        updateNested("mother", "name", {
                          ...formData.mother?.name,
                          first: v,
                        })
                      }
                      readOnly={!isEditing}
                      placeholder="First Name"
                    />
                    <FormField
                      label="Mother's Middle Name"
                      value={formData.mother?.name?.middle || ""}
                      onChange={(v: string) =>
                        updateNested("mother", "name", {
                          ...formData.mother?.name,
                          middle: v,
                        })
                      }
                      readOnly={!isEditing}
                      placeholder="Middle Name"
                    />
                    <FormField
                      label="Mother's Last Name"
                      value={formData.mother?.name?.last || ""}
                      onChange={(v: string) =>
                        updateNested("mother", "name", {
                          ...formData.mother?.name,
                          last: v,
                        })
                      }
                      readOnly={!isEditing}
                      placeholder="Last Name"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                    <FormField
                      label="Date of Birth"
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
                        label="Person is deceased"
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
                  Employment & Education
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
                    label="Occupation"
                    value={formData.occupation || ""}
                    onChange={(v: string) => updateField("occupation", v)}
                    readOnly={!isEditing}
                    placeholder="Enter occupation"
                  />
                  <FormField
                    label="Job Title"
                    value={formData.jobTitle || ""}
                    onChange={(v: string) => updateField("jobTitle", v)}
                    readOnly={!isEditing}
                    placeholder="Exact title on employment letter"
                  />
                  <FormField
                    label="Employer Name"
                    value={formData.employer?.name || ""}
                    onChange={(v: string) =>
                      updateNested("employer", "name", v)
                    }
                    readOnly={!isEditing}
                    placeholder="Enter employer name"
                  />
                  <FormField
                    label="Annual Income"
                    value={formData.annualIncome || ""}
                    onChange={(v: string) => updateField("annualIncome", v)}
                    readOnly={!isEditing}
                    placeholder="Enter annual income"
                  />
                  {isEditing ? (
                    <FormSelect
                      label="Industry Sector"
                      value={formData.industrySector || ""}
                      onChange={(v: string) =>
                        updateStrictField("industrySector", v)
                      }
                      options={[
                        { value: "Technology", label: "Technology" },
                        { value: "Healthcare", label: "Healthcare" },
                        { value: "Education", label: "Education" },
                        { value: "Finance", label: "Finance" },
                        { value: "Construction", label: "Construction" },
                        { value: "Manufacturing", label: "Manufacturing" },
                        { value: "Retail", label: "Retail" },
                        { value: "Government", label: "Government" },
                        {
                          value: "Military/Defense",
                          label: "Military/Defense",
                        },
                        { value: "Other", label: "Other" },
                      ]}
                      placeholder="Select an option"
                    />
                  ) : (
                    <FormField
                      label="Industry Sector"
                      value={formData.industrySector || ""}
                      onChange={() => {}}
                      readOnly
                    />
                  )}
                  {isEditing ? (
                    <FormSelect
                      label="Education Level"
                      value={formData.educationLevel || ""}
                      onChange={(v: string) =>
                        updateStrictField("educationLevel", v)
                      }
                      options={[
                        {
                          value: "Did not graduate high school",
                          label: "Did not graduate high school",
                        },
                        { value: "High School", label: "High School" },
                        { value: "Some College", label: "Some College" },
                        {
                          value: "Associate Degree",
                          label: "Associate Degree",
                        },
                        {
                          value: "Bachelor&apos;s Degree",
                          label: "Bachelor&apos;s Degree",
                        },
                        {
                          value: "Master&apos;s Degree",
                          label: "Master&apos;s Degree",
                        },
                        { value: "Doctorate", label: "Doctorate (PhD)" },
                      ]}
                      placeholder="Select level"
                    />
                  ) : (
                    <FormField
                      label="Education Level"
                      value={formData.educationLevel || ""}
                      onChange={() => {}}
                      readOnly
                    />
                  )}
                  <FormField
                    label="Field of Study"
                    value={formData.educationField || ""}
                    onChange={(v: string) => updateField("educationField", v)}
                    readOnly={!isEditing}
                    placeholder="e.g. Computer Science"
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
                  Immigration History
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
                  label="Previous US Visa Applications"
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
                  label="Previous Visa Denials"
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
                  label="Overstay or Violation"
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
                  label="Criminal Record"
                  checked={formData.immigrationHistory?.criminalRecord || false}
                  onCheckedChange={(c) =>
                    updateNested("immigrationHistory", "criminalRecord", c)
                  }
                  disabled={!isEditing}
                  variant="warning"
                />
                <FormCheckbox
                  id="rd"
                  label="Removed or Deported"
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
                  label="Prior Military Service"
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
                  label="Specialized Weapons Training"
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
                  label="Unofficial Armed Groups"
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
                  Relationship Details
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
                    label="Relationship Type"
                    value={formData.relationship?.type || ""}
                    onChange={(v) => updateNested("relationship", "type", v)}
                    options={[
                      { value: "Spouse", label: "Spouse" },
                      { value: "Fiance", label: "Fiance(e)" },
                    ]}
                    placeholder="Select type"
                    readOnly={!isEditing}
                  />
                  <FormField
                    label="Relationship Start Date"
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
                    label="Marriage Date"
                    type="date"
                    value={formData.relationship?.marriageDate || ""}
                    onChange={(v) =>
                      updateNested("relationship", "marriageDate", v)
                    }
                    readOnly={!isEditing}
                  />
                  <FormField
                    label="Number of In-Person Visits"
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
                  label="How did you meet?"
                  value={formData.relationship?.howDidYouMeet || ""}
                  onChange={(v) =>
                    updateNested("relationship", "howDidYouMeet", v)
                  }
                  readOnly={!isEditing}
                  placeholder="e.g. at university, online, through family..."
                />

                <h4 className="text-xs font-medium text-slate-600 mt-4 mb-3">
                  Available Evidence
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FormCheckbox
                    id="coh"
                    label="Cohabitation Proof (Lease/Deed)"
                    checked={formData.relationship?.cohabitationProof || false}
                    onCheckedChange={(c) =>
                      updateNested("relationship", "cohabitationProof", c)
                    }
                    disabled={!isEditing}
                  />
                  <FormCheckbox
                    id="fin"
                    label="Shared Financial Accounts"
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
                    label="Wedding Photos"
                    checked={formData.relationship?.weddingPhotos || false}
                    onCheckedChange={(c) =>
                      updateNested("relationship", "weddingPhotos", c)
                    }
                    disabled={!isEditing}
                  />
                  <FormCheckbox
                    id="comm"
                    label="Communication Logs"
                    checked={formData.relationship?.communicationLogs || false}
                    onCheckedChange={(c) =>
                      updateNested("relationship", "communicationLogs", c)
                    }
                    disabled={!isEditing}
                  />
                  <FormCheckbox
                    id="money"
                    label="Money Transfer Receipts"
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
                    label="Meeting Proof"
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
                  Documents & Financial
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
                      Identity Documents
                    </h4>
                    <div className="space-y-3">
                      <FormCheckbox
                        id="ppt"
                        label="Valid Passport"
                        checked={formData.documents?.hasPassport || false}
                        onCheckedChange={(c) =>
                          updateNested("documents", "hasPassport", c)
                        }
                        disabled={!isEditing}
                      />
                      <FormCheckbox
                        id="bc"
                        label="Birth Certificate"
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
                        label="Marriage Certificate"
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
                        label="Police Certificate"
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
                      Financial Documents
                    </h4>
                    <div className="space-y-3">
                      <FormCheckbox
                        id="tr"
                        label="Tax Returns (Last 3 Years)"
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
                        label="Paystubs (Recent)"
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
                        label="Bank Statements"
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
                  Affidavit Support Calculator
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
                      label="Sponsor Status"
                      value={formData.sponsorStatus || ""}
                      onChange={(v: string) =>
                        updateField(
                          "sponsorStatus",
                          v as "citizen" | "greenCard",
                        )
                      }
                      options={[
                        { value: "citizen", label: "US Citizen" },
                        { value: "greenCard", label: "Green Card Holder" },
                      ]}
                      placeholder="Select sponsor status"
                    />
                  ) : (
                    <FormField
                      label="Sponsor Status"
                      value={formData.sponsorStatus || ""}
                      onChange={() => {}}
                      readOnly
                    />
                  )}
                  <FormCheckbox
                    id="military"
                    label="Active-Duty Military"
                    checked={formData.isMilitary || false}
                    onCheckedChange={(c) => updateField("isMilitary", c)}
                    disabled={!isEditing}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormCheckbox
                    id="married"
                    label="Married"
                    checked={formData.isMarried || false}
                    onCheckedChange={(c) => updateField("isMarried", c)}
                    disabled={!isEditing}
                  />
                  <FormField
                    label="Number of Children"
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
                    label="Tax Dependents"
                    type="number"
                    value={formData.taxDependents?.toString() || "0"}
                    onChange={(v: string) =>
                      updateField("taxDependents", v ? Number(v) : 0)
                    }
                    readOnly={!isEditing}
                  />
                  <FormCheckbox
                    id="prevSponsor"
                    label="Previous Sponsorship"
                    checked={formData.hasPreviousSponsorship || false}
                    onCheckedChange={(c) =>
                      updateField("hasPreviousSponsorship", c)
                    }
                    disabled={!isEditing}
                  />
                </div>

                {formData.hasPreviousSponsorship && (
                  <FormField
                    label="Previous Sponsored Count"
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
                    label="Sponsoring Applicant"
                    checked={formData.currentSponsoredApplicant !== false} // defaults to true
                    onCheckedChange={(c) =>
                      updateField("currentSponsoredApplicant", c)
                    }
                    disabled={!isEditing}
                  />
                  <FormCheckbox
                    id="sponsorSpouse"
                    label="Sponsoring Spouse"
                    checked={formData.currentSponsoredSpouse || false}
                    onCheckedChange={(c) =>
                      updateField("currentSponsoredSpouse", c)
                    }
                    disabled={!isEditing}
                  />
                  <FormField
                    label="Sponsoring Children"
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
                    label="Sponsor Deceased"
                    checked={formData.sponsorDeceased || false}
                    onCheckedChange={(c) => updateField("sponsorDeceased", c)}
                    disabled={!isEditing}
                  />
                  <FormField
                    label="Asset Value"
                    type="number"
                    value={formData.assetValue?.toString() || "0"}
                    onChange={(v: string) =>
                      updateField("assetValue", v ? Number(v) : 0)
                    }
                    readOnly={!isEditing}
                  />
                </div>

                <FormField
                  label="Relationship to Applicant"
                  value={formData.relationshipToApplicant || ""}
                  onChange={(v: string) =>
                    updateField("relationshipToApplicant", v)
                  }
                  readOnly={!isEditing}
                  placeholder="e.g. spouse, parent, other"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <FormCheckbox
                    id="vawa"
                    label="VAWA Self-Petitioner"
                    checked={formData.isVAWA || false}
                    onCheckedChange={(c) => updateField("isVAWA", c)}
                    disabled={!isEditing}
                  />
                  <FormCheckbox
                    id="widow"
                    label="Widow of US Citizen"
                    checked={formData.isWidow || false}
                    onCheckedChange={(c) => updateField("isWidow", c)}
                    disabled={!isEditing}
                  />
                  <FormCheckbox
                    id="specialImmigrant"
                    label="Special Immigrant"
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
                  Visa Application Context
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
                    Application Details
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {isEditing ? (
                      <FormSelect
                        label="Visa Type"
                        value={formData.visaType || ""}
                        onChange={(v: string) => updateField("visaType", v)}
                        options={[
                          {
                            value: "IR-1",
                            label: "IR-1 - Spouse of US Citizen (2+ yrs)",
                          },
                          {
                            value: "CR-1",
                            label: "CR-1 - Spouse of US Citizen (<2 yrs)",
                          },
                          { value: "K-1", label: "K-1 - Fiancé(e) Visa" },
                          {
                            value: "IR-5",
                            label: "IR-5 - Parent of US Citizen",
                          },
                          { value: "F-1", label: "F-1 - Student Visa" },
                          {
                            value: "H-1B",
                            label: "H-1B - Specialty Occupation",
                          },
                          { value: "B1/B2", label: "B1/B2 - Visitor Visa" },
                          { value: "Other", label: "Other" },
                        ]}
                        placeholder="Select visa type"
                      />
                    ) : (
                      <FormField
                        label="Visa Type"
                        value={formData.visaType || ""}
                        onChange={() => {}}
                        readOnly
                      />
                    )}
                    <FormField
                      label="Visa Category / Sub-category"
                      value={formData.visaCategory || ""}
                      onChange={(v: string) => updateField("visaCategory", v)}
                      readOnly={!isEditing}
                      placeholder="e.g. EB-2, NIW, Priority Date"
                    />
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-5">
                  <h4 className="text-xs font-medium text-slate-600 mb-3 block">
                    Sponsor Details
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <FormField
                      label="Sponsor First Name"
                      value={formData.sponsor?.name?.first || ""}
                      onChange={(v: string) =>
                        updateNested("sponsor", "name", {
                          ...formData.sponsor?.name,
                          first: v,
                        })
                      }
                      readOnly={!isEditing}
                      placeholder="First Name"
                    />
                    <FormField
                      label="Sponsor Middle Name"
                      value={formData.sponsor?.name?.middle || ""}
                      onChange={(v: string) =>
                        updateNested("sponsor", "name", {
                          ...formData.sponsor?.name,
                          middle: v,
                        })
                      }
                      readOnly={!isEditing}
                      placeholder="Middle Name"
                    />
                    <FormField
                      label="Sponsor Last Name"
                      value={formData.sponsor?.name?.last || ""}
                      onChange={(v: string) =>
                        updateNested("sponsor", "name", {
                          ...formData.sponsor?.name,
                          last: v,
                        })
                      }
                      readOnly={!isEditing}
                      placeholder="Last Name"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                    <FormField
                      label="Date of Birth"
                      type="date"
                      value={formData.sponsor?.dateOfBirth || ""}
                      onChange={(v: string) =>
                        updateNested("sponsor", "dateOfBirth", v)
                      }
                      readOnly={!isEditing}
                    />
                    <FormField
                      label="Sponsor Phone"
                      value={formData.sponsor?.phone || ""}
                      onChange={(v: string) =>
                        updateNested("sponsor", "phone", v)
                      }
                      readOnly={!isEditing}
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-5">
                  <h4 className="text-xs font-medium text-slate-600 mb-3 block">
                    Beneficiary Details
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <FormField
                      label="Beneficiary First Name"
                      value={formData.beneficiary?.name?.first || ""}
                      onChange={(v: string) =>
                        updateNested("beneficiary", "name", {
                          ...formData.beneficiary?.name,
                          first: v,
                        })
                      }
                      readOnly={!isEditing}
                      placeholder="First Name"
                    />
                    <FormField
                      label="Beneficiary Middle Name"
                      value={formData.beneficiary?.name?.middle || ""}
                      onChange={(v: string) =>
                        updateNested("beneficiary", "name", {
                          ...formData.beneficiary?.name,
                          middle: v,
                        })
                      }
                      readOnly={!isEditing}
                      placeholder="Middle Name"
                    />
                    <FormField
                      label="Beneficiary Last Name"
                      value={formData.beneficiary?.name?.last || ""}
                      onChange={(v: string) =>
                        updateNested("beneficiary", "name", {
                          ...formData.beneficiary?.name,
                          last: v,
                        })
                      }
                      readOnly={!isEditing}
                      placeholder="Last Name"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                    <FormField
                      label="Date of Birth"
                      type="date"
                      value={formData.beneficiary?.dateOfBirth || ""}
                      onChange={(v: string) =>
                        updateNested("beneficiary", "dateOfBirth", v)
                      }
                      readOnly={!isEditing}
                    />
                    <FormField
                      label="Country of Residence"
                      value={formData.beneficiary?.countryOfResidence || ""}
                      onChange={(v: string) =>
                        updateNested("beneficiary", "countryOfResidence", v)
                      }
                      readOnly={!isEditing}
                      placeholder="Enter country"
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
                  Legal & Eligibility Details
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
                    Petitioner Details
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {isEditing ? (
                      <FormSelect
                        label="Petitioner Status"
                        value={formData.visaEligibility?.petitionerStatus || ""}
                        onChange={(v: string) =>
                          updateNested("visaEligibility", "petitionerStatus", v)
                        }
                        options={[
                          { value: "US_CITIZEN", label: "US Citizen" },
                          { value: "LPR", label: "US Permanent Resident" },
                          { value: "NONE", label: "None" },
                        ]}
                        placeholder="Select status"
                      />
                    ) : (
                      <FormField
                        label="Petitioner Status"
                        value={formData.visaEligibility?.petitionerStatus || ""}
                        onChange={() => {}}
                        readOnly
                      />
                    )}
                    {isEditing ? (
                      <FormSelect
                        label="Petitioner Age Group"
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
                          { value: "UNDER_21", label: "Under 21" },
                          { value: "OVER_21", label: "21 or older" },
                        ]}
                        placeholder="Select age group"
                      />
                    ) : (
                      <FormField
                        label="Petitioner Age Group"
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
                    Status & Intent
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {isEditing ? (
                      <FormSelect
                        label="Status Origin"
                        value={formData.visaEligibility?.statusOrigin || ""}
                        onChange={(v: string) =>
                          updateNested("visaEligibility", "statusOrigin", v)
                        }
                        options={[
                          { value: "BIRTH", label: "By Birth" },
                          { value: "NATURALIZED", label: "Naturalized" },
                          { value: "GREEN_CARD", label: "Green Card" },
                        ]}
                        placeholder="Select origin"
                      />
                    ) : (
                      <FormField
                        label="Status Origin"
                        value={formData.visaEligibility?.statusOrigin || ""}
                        onChange={() => {}}
                        readOnly
                      />
                    )}
                    {isEditing ? (
                      <FormSelect
                        label="Intent of Stay"
                        value={formData.visaEligibility?.intent || ""}
                        onChange={(v: string) =>
                          updateNested("visaEligibility", "intent", v)
                        }
                        options={[
                          { value: "PERMANENT", label: "Permanent" },
                          { value: "TEMPORARY", label: "Temporary" },
                        ]}
                        placeholder="Select intent"
                      />
                    ) : (
                      <FormField
                        label="Intent of Stay"
                        value={formData.visaEligibility?.intent || ""}
                        onChange={() => {}}
                        readOnly
                      />
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                    {isEditing ? (
                      <FormSelect
                        label="Sponsorship Base"
                        value={formData.visaEligibility?.sponsorBase || ""}
                        onChange={(v: string) =>
                          updateNested("visaEligibility", "sponsorBase", v)
                        }
                        options={[
                          { value: "FAMILY", label: "Family-Based" },
                          { value: "EMPLOYMENT", label: "Employment-Based" },
                          { value: "INVESTMENT", label: "Investment" },
                          { value: "HUMANITARIAN", label: "Humanitarian" },
                        ]}
                        placeholder="Select base"
                      />
                    ) : (
                      <FormField
                        label="Sponsorship Base"
                        value={formData.visaEligibility?.sponsorBase || ""}
                        onChange={() => {}}
                        readOnly
                      />
                    )}
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-5">
                  <h4 className="text-xs font-medium text-slate-600 mb-3 block">
                    History & Legal
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {isEditing ? (
                      <FormSelect
                        label="Visa Violation History"
                        value={formData.visaEligibility?.violationHistory || ""}
                        onChange={(v: string) =>
                          updateNested("visaEligibility", "violationHistory", v)
                        }
                        options={[
                          { value: "NO", label: "No" },
                          { value: "YES", label: "Yes" },
                          { value: "NOT_SURE", label: "Not Sure" },
                        ]}
                        placeholder="Select..."
                      />
                    ) : (
                      <FormField
                        label="Visa Violation History"
                        value={formData.visaEligibility?.violationHistory || ""}
                        onChange={() => {}}
                        readOnly
                      />
                    )}

                    {isEditing ? (
                      <FormSelect
                        label="Legal Relationship Status"
                        value={formData.visaEligibility?.legalStatus || ""}
                        onChange={(v: string) =>
                          updateNested("visaEligibility", "legalStatus", v)
                        }
                        options={[
                          {
                            value: "MARRIAGE_REGISTERED",
                            label: "Registered Marriage",
                          },
                          { value: "BIOLOGICAL", label: "Biological" },
                          { value: "ADOPTIVE", label: "Adoptive" },
                          { value: "STEP", label: "Step-Child/Parent" },
                        ]}
                        placeholder="Select..."
                      />
                    ) : (
                      <FormField
                        label="Legal Relationship Status"
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
