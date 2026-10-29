"use client";

import * as React from "react";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { IR5_ENABLED } from "@/lib/feature-flags";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { MasterProfile } from "@/types/profile";
import {
  Pencil,
  Check,
  X,
  User as UserIcon,
  HeartHandshake,
  Mail,
  Users,
  Briefcase,
  Plane,
  Heart,
  FileText,
  DollarSign,
  Compass,
  ShieldCheck,
  AlertCircle,
  ChevronDown,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { Loader } from "@/components/ui/spinner";
import { getProfileCompleteness } from "@/lib/profile/helpers";
import { cn } from "@/lib/utils";
import { FormField, FormSelect, FormCheckbox } from "./form-field";
import { US_STATES } from "@/lib/formConfig/constants";
import { validateProfile } from "@/lib/profile/schema";
import { useLanguage } from "@/app/context/LanguageContext";

// ── Reusable premium collapsible section ───────────────────────────────────

type ProfileSectionProps = {
  icon: React.ReactNode;
  title: React.ReactNode;
  description?: string;
  badge?: string;
  isOpen: boolean;
  onToggle: () => void;
  colorScheme?: "teal" | "coral" | "periwinkle" | "mint";
  children: React.ReactNode;
};

const colorStyles = {
  teal: {
    ring: "ring-[#0d7377]/20",
    border: "border-[#0d7377]/25",
    iconBg: "bg-[#0d7377]/10",
    iconColor: "text-[#0d7377]",
    badgeBg: "bg-[#0d7377]/10",
    badgeText: "text-[#0d7377]",
    chevronBg: "bg-[#0d7377]/10",
    chevronColor: "text-[#0d7377]",
    bar: "bg-[#0d7377]",
  },
  coral: {
    ring: "ring-[#c0596a]/20",
    border: "border-[#c0596a]/25",
    iconBg: "bg-[#c0596a]/10",
    iconColor: "text-[#c0596a]",
    badgeBg: "bg-[#c0596a]/10",
    badgeText: "text-[#c0596a]",
    chevronBg: "bg-[#c0596a]/10",
    chevronColor: "text-[#c0596a]",
    bar: "bg-[#c0596a]",
  },
  periwinkle: {
    ring: "ring-[#8284bf]/20",
    border: "border-[#8284bf]/25",
    iconBg: "bg-[#8284bf]/10",
    iconColor: "text-[#8284bf]",
    badgeBg: "bg-[#8284bf]/10",
    badgeText: "text-[#8284bf]",
    chevronBg: "bg-[#8284bf]/10",
    chevronColor: "text-[#8284bf]",
    bar: "bg-[#8284bf]",
  },
  mint: {
    ring: "ring-[#32e0c4]/30",
    border: "border-[#32e0c4]/35",
    iconBg: "bg-[#32e0c4]/12",
    iconColor: "text-[#0d7377]",
    badgeBg: "bg-[#32e0c4]/12",
    badgeText: "text-[#0d7377]",
    chevronBg: "bg-[#32e0c4]/12",
    chevronColor: "text-[#0d7377]",
    bar: "bg-[#32e0c4]",
  },
};

function ProfileSection({
  icon,
  title,
  description,
  badge,
  isOpen,
  onToggle,
  colorScheme = "teal",
  children,
}: ProfileSectionProps) {
  const colors = colorStyles[colorScheme];

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border bg-white shadow-sm transition-all duration-200",
        colors.border,
        isOpen ? `ring-1 ${colors.ring} shadow-md` : "hover:shadow-md"
      )}
    >
      <button type="button" onClick={onToggle} className="w-full text-left" aria-expanded={isOpen}>
        <div className="flex items-center gap-4 px-5 py-4 sm:px-6 sm:py-5">
          <div
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
              colors.iconBg,
              colors.iconColor
            )}
          >
            {icon}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-semibold text-slate-900">{title}</h3>
              {badge && (
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                    colors.badgeBg,
                    colors.badgeText
                  )}
                >
                  {badge}
                </span>
              )}
            </div>
            {description && <p className="mt-0.5 truncate text-sm text-slate-500">{description}</p>}
          </div>

          <div
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-transform duration-200",
              colors.chevronBg,
              colors.chevronColor,
              isOpen ? "rotate-180" : ""
            )}
          >
            <ChevronDown className="h-5 w-5" />
          </div>
        </div>

        <div className="h-1 w-full bg-slate-100">
          <motion.div
            className={cn("h-full", colors.bar)}
            initial={false}
            animate={{ width: isOpen ? "100%" : "0%" }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
          />
        </div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-5 pt-2 pb-5 sm:px-6 sm:pb-6">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ProfilePage() {
  const { t } = useLanguage();
  const { user, isLoading } = useAuth();
  const router = useRouter();

  // ── Form state (React Hook Form) ─────────────────────────────────────────────
  // RHF is the single source of truth for the form. We initialize it ONCE from the
  // server via reset() (see fetchProfile) and never overwrite loaded fields — the
  // pattern that structurally prevents the old "field wiped on load/save" bug.
  const {
    reset,
    watch,
    setValue,
    getValues,
    formState: { isDirty },
  } = useForm<MasterProfile>({ defaultValues: {} as MasterProfile });

  // Live view of the current values — every existing `formData.x` read below keeps
  // working unchanged.
  const formData = watch() as MasterProfile;

  // Dot-path setter: all writes flow through RHF and mark the form dirty. The path
  // is cast so deep paths ("sponsor.name.first") don't fight RHF's FieldPath types.
  const setField = (path: string, value: unknown) =>
    setValue(path as Parameters<typeof setValue>[0], value as never, {
      shouldDirty: true,
    });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Track if we've already fetched for this user
  const hasFetchedRef = useRef<string | null>(null);

  // All sections start collapsed — the user expands only what they want to edit,
  // so the page opens as a clean, scannable list of section headers.
  const [sections, setSections] = useState({
    personal: false,
    sponsor: false,
    contact: false,
    family: false,
    employment: false,
    immigration: false,
    documents: false,
    financial: false,
    relationship: false,
    affidavit: false,
    visaContext: false,
    visaEligibility: false,
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

      // ── SECURE FETCH: Using our server API to decrypt sensitive fields ──────
      const apiResponse = await fetch("/api/profile");
      if (!apiResponse.ok) throw new Error("Failed to fetch profile");

      const { profile } = await apiResponse.json();

      if (profile?.profile_details) {
        const profileDetails = profile.profile_details as MasterProfile;
        // Seed RHF from the (decrypted) server data. reset() sets this as the new
        // baseline (isDirty → false) and never overwrites individual fields, so
        // stored values like `sex` load and persist correctly.
        reset(profileDetails);
        // Mark as fetched for this user
        hasFetchedRef.current = userId;
      }
    } catch (fetchError) {
      console.error("Error fetching profile:", fetchError);
    } finally {
      setLoading(false);
    }
  }, [userId, reset]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push(
        `/login?redirectTo=${encodeURIComponent(window.location.pathname + window.location.search)}`
      );
      return;
    }

    if (userId && hasFetchedRef.current !== userId) {
      fetchProfile();
    } else if (userId) {
      setLoading(false);
    }
  }, [userId, isLoading, router, fetchProfile, user]);

  const handleSave = async () => {
    // Block the save on validation errors and surface them inline.
    // Rules live in ./schema.ts (Zod) so client + server share one definition.
    const values = getValues();
    const found = validateProfile(values);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      setMessage("Please fix the highlighted fields before saving.");
      return;
    }

    try {
      setSaving(true);
      setMessage("");

      // ── SECURE SAVE: Using our server API to encrypt sensitive fields ──────
      const response = await fetch("/api/profile/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile_details: values }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to save profile");
      }

      // Reset fetch tracking to allow refetch
      hasFetchedRef.current = null;
      await fetchProfile();

      setIsEditing(false);
      setMessage(t("profile.successMessage"));
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Error saving profile:", error);
      setMessage(t("profile.errorMessage"));
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setErrors({});
    setMessage("");
    // Restore the last-loaded baseline (no refetch needed — RHF holds it).
    reset();
  };

  const toggleSection = (key: keyof typeof sections) => {
    setSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // ── Field setters ─────────────────────────────────────────────────────────
  // All write through RHF via setField(). Signatures are unchanged so the field
  // bindings throughout the form stay exactly as they were; RHF handles the
  // nested-object immutability that these used to do by hand.
  const updateField = <T extends keyof MasterProfile>(field: T, value: MasterProfile[T]) =>
    setField(field as string, value);

  const updateStrictField = <T extends keyof MasterProfile>(field: T, value: string) =>
    setField(field as string, value);

  const updateNested = (parent: string, field: string, value: unknown) =>
    setField(`${parent}.${field}`, value);

  const updateAddress = (field: keyof MasterProfile["currentAddress"], value: string) =>
    setField(`currentAddress.${String(field)}`, value);

  // Sponsor section helpers — sponsor.* holds the US petitioner's own data
  // (the top-level fields are the account holder's / beneficiary's).
  const updateSponsor = (field: string, value: unknown) => setField(`sponsor.${field}`, value);

  const updateSponsorSub = (
    sub: "name" | "placeOfBirth" | "address",
    field: string,
    value: string
  ) => setField(`sponsor.${sub}.${field}`, value);

  if (isLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader size="md" />
      </div>
    );
  }

  if (!user) return null;

  const completeness = formData.name ? getProfileCompleteness(formData) : 0;

  const hasErrors = Object.keys(errors).length > 0;
  const isSuccess = Boolean(message) && !message.includes("Error") && !hasErrors;

  return (
    <div className="w-full">
      {/* ── Hero band: title + actions + completeness in one clean card ── */}
      <div className="mb-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="p-5 sm:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="flex items-start gap-3">
              <div className="bg-primary/10 text-primary hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl sm:flex">
                <UserIcon className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900 md:text-2xl">
                  {t("profile.title")}
                </h1>
                <p className="mt-0.5 text-sm text-slate-500">{t("profile.subtitle")}</p>
              </div>
            </div>
            <div className="flex w-full flex-col items-stretch gap-2 sm:flex-row sm:items-center md:w-auto">
              <Button
                variant="outline"
                onClick={() => router.push("/complete-profile")}
                className="border-primary/20 hover:bg-primary/5 text-primary h-9 w-full px-4 text-sm sm:w-auto"
              >
                <Check className="mr-2 h-4 w-4" />
                {t("profile.buttons.completeProfile")}
              </Button>
              {isEditing ? (
                <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-row">
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    disabled={saving}
                    className="h-9 w-full bg-transparent px-4 text-sm sm:w-auto"
                  >
                    <X className="mr-2 h-4 w-4" />
                    {t("profile.buttons.cancel")}
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={saving || !isDirty}
                    className="h-9 w-full px-4 text-sm sm:w-auto"
                  >
                    {saving ? <Loader size="sm" /> : <Check className="mr-2 h-4 w-4" />}
                    {t("profile.buttons.save")}
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={() => setIsEditing(true)}
                  className="h-9 w-full px-4 text-sm sm:w-auto"
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  {t("profile.buttons.editProfile")}
                </Button>
              )}
            </div>
          </div>

          {/* Profile Completeness */}
          {formData.name && (
            <div className="mt-5">
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-600">
                  {t("profile.completeness")}
                </span>
                <span className="text-primary text-sm font-semibold">{completeness}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="bg-primary h-full rounded-full transition-all duration-500"
                  style={{ width: `${completeness}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Success / Error / Validation banner */}
      {message && (
        <div
          className={`mb-4 flex items-start gap-2 rounded-lg border px-3.5 py-2.5 text-sm ${
            isSuccess
              ? "border-green-200 bg-green-50 text-green-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {isSuccess ? (
            <Check className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          )}
          <span>{message}</span>
        </div>
      )}

      <div className="space-y-4">
        {/* Personal Information */}
        <ProfileSection
          icon={<UserIcon className="h-4 w-4" />}
          title={t("profile.sections.personal")}
          description="Your own details, the visa applicant (beneficiary)."
          badge="You"
          isOpen={sections.personal}
          onToggle={() => toggleSection("personal")}
          colorScheme="teal"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            <FormField
              label={t("profile.fields.firstName")}
              value={formData.name?.first || ""}
              onChange={(v: string) => updateNested("name", "first", v)}
              readOnly={!isEditing}
              placeholder={t("profile.placeholders.firstName")}
            />
            <FormField
              label={t("profile.fields.middleName")}
              value={formData.name?.middle || ""}
              onChange={(v: string) => updateNested("name", "middle", v)}
              readOnly={!isEditing}
              placeholder={t("profile.placeholders.middleName")}
            />
            <FormField
              label={t("profile.fields.lastName")}
              value={formData.name?.last || ""}
              onChange={(v: string) => updateNested("name", "last", v)}
              readOnly={!isEditing}
              placeholder={t("profile.placeholders.lastName")}
            />
            <FormField
              label={t("profile.fields.dob")}
              type="date"
              value={formData.dateOfBirth || ""}
              onChange={(v: string) => updateField("dateOfBirth", v)}
              readOnly={!isEditing}
              error={errors["dateOfBirth"]}
            />
            <FormField
              label={t("profile.fields.cityOfBirth")}
              value={formData.placeOfBirth?.city || ""}
              onChange={(v: string) => updateNested("placeOfBirth", "city", v)}
              readOnly={!isEditing}
              placeholder={t("profile.placeholders.city")}
            />
            <FormField
              label={t("profile.fields.countryOfBirth")}
              value={formData.placeOfBirth?.country || ""}
              onChange={(v: string) => updateNested("placeOfBirth", "country", v)}
              readOnly={!isEditing}
              placeholder={t("profile.placeholders.country")}
            />
            {isEditing ? (
              <FormSelect
                label={t("profile.fields.sex.label")}
                value={formData.sex}
                onChange={(v: string) => updateStrictField("sex", v)}
                options={[
                  {
                    value: "Male",
                    label: t("profile.fields.sex.options.male"),
                  },
                  {
                    value: "Female",
                    label: t("profile.fields.sex.options.female"),
                  },
                ]}
              />
            ) : (
              <FormField
                label={t("profile.fields.sex.label")}
                value={formData.sex || ""}
                onChange={() => {}}
                readOnly
              />
            )}
            <FormField
              label={t("profile.fields.nationality")}
              value={formData.nationality || ""}
              onChange={(v: string) => updateField("nationality", v)}
              readOnly={!isEditing}
              placeholder={t("profile.placeholders.nationality")}
            />
            {isEditing ? (
              <FormSelect
                label={t("profile.fields.citizenshipStatus.label")}
                value={formData.citizenshipStatus || "Other"}
                onChange={(v: string) => updateStrictField("citizenshipStatus", v)}
                options={[
                  {
                    value: "USCitizen",
                    label: t("profile.fields.citizenshipStatus.options.usCitizen"),
                  },
                  {
                    value: "LPR",
                    label: t("profile.fields.citizenshipStatus.options.lpr"),
                  },
                  {
                    value: "Other",
                    label: t("profile.fields.citizenshipStatus.options.other"),
                  },
                ]}
              />
            ) : (
              <FormField
                label={t("profile.fields.citizenshipStatus.label")}
                value={
                  formData.citizenshipStatus === "USCitizen"
                    ? t("profile.fields.citizenshipStatus.options.usCitizen")
                    : formData.citizenshipStatus === "LPR"
                      ? t("profile.fields.citizenshipStatus.options.lpr")
                      : t("profile.fields.citizenshipStatus.options.other")
                }
                onChange={() => {}}
                readOnly
              />
            )}
            {isEditing ? (
              <FormSelect
                label={t("profile.fields.maritalStatus.label")}
                value={formData.maritalStatus || "Single"}
                onChange={(v: string) => updateStrictField("maritalStatus", v)}
                options={[
                  {
                    value: "Single",
                    label: t("profile.fields.maritalStatus.options.single"),
                  },
                  {
                    value: "Married",
                    label: t("profile.fields.maritalStatus.options.married"),
                  },
                  {
                    value: "Divorced",
                    label: t("profile.fields.maritalStatus.options.divorced"),
                  },
                  {
                    value: "Widowed",
                    label: t("profile.fields.maritalStatus.options.widowed"),
                  },
                  {
                    value: "Separated",
                    label: t("profile.fields.maritalStatus.options.separated"),
                  },
                  {
                    value: "Annulled",
                    label: t("profile.fields.maritalStatus.options.annulled"),
                  },
                ]}
              />
            ) : (
              <FormField
                label={t("profile.fields.maritalStatus.label")}
                value={formData.maritalStatus || ""}
                onChange={() => {}}
                readOnly
              />
            )}
            <FormField
              label={t("profile.fields.passportNumber")}
              value={formData.passportNumber || ""}
              onChange={(v: string) => updateField("passportNumber", v)}
              readOnly={!isEditing}
              placeholder={t("profile.placeholders.passport")}
            />
            <FormField
              label={t("profile.fields.passportIssueDate")}
              type="date"
              value={formData.passportIssueDate || ""}
              onChange={(v: string) => updateField("passportIssueDate", v)}
              readOnly={!isEditing}
            />
            <FormField
              label={t("profile.fields.passportExpiry")}
              type="date"
              value={formData.passportExpiry || ""}
              onChange={(v: string) => updateField("passportExpiry", v)}
              readOnly={!isEditing}
              error={errors["passportExpiry"]}
            />
            <FormField
              label={t("profile.fields.passportCountry")}
              value={formData.passportCountry || ""}
              onChange={(v: string) => updateField("passportCountry", v)}
              readOnly={!isEditing}
              placeholder={t("profile.placeholders.country")}
            />

            {/* Legal Identifiers */}
            <div className="mt-4 border-t border-slate-100 pt-4 sm:col-span-2 md:col-span-3">
              <h4 className="mb-3 text-xs font-medium text-slate-600">
                {/* {t("profile.fields.legalIdentifiers")} */}
                Legal Identifiers
              </h4>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                <FormField
                  label={t("profile.fields.ssn")}
                  value={formData.ssn || ""}
                  onChange={(v: string) => updateField("ssn", v)}
                  readOnly={!isEditing}
                  placeholder={t("profile.placeholders.ssn")}
                  error={errors["ssn"]}
                />
                <FormField
                  label={t("profile.fields.alienNumber")}
                  value={formData.alienNumber || ""}
                  onChange={(v: string) => updateField("alienNumber", v)}
                  readOnly={!isEditing}
                  placeholder={t("profile.placeholders.alien")}
                  helpText={t("profile.helpText.alien")}
                />
                <FormField
                  label={t("profile.fields.uscisAccount")}
                  value={formData.uscisAccountNumber || ""}
                  onChange={(v: string) => updateField("uscisAccountNumber", v)}
                  readOnly={!isEditing}
                  placeholder={t("profile.placeholders.uscis")}
                />
              </div>
            </div>
          </div>
        </ProfileSection>

        {/* Sponsor / Petitioner. The sections above describe the account
              holder (the beneficiary / applicant); this card captures the
              petitioner's own details — whoever they are petitioning as
              (spouse, parent, etc.) for I-130 Part 1 autofill. Kept
              relationship-neutral so it reads correctly regardless of which
              case type is active. */}
        <ProfileSection
          icon={<HeartHandshake className="h-4 w-4" />}
          title={"Sponsor"}
          description="The U.S. petitioner filing on your behalf, their details, not yours."
          badge="The other person"
          isOpen={sections.sponsor}
          onToggle={() => toggleSection("sponsor")}
          colorScheme="coral"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            <FormField
              label="First name"
              value={formData.sponsor?.name?.first || ""}
              onChange={(v: string) => updateSponsorSub("name", "first", v)}
              readOnly={!isEditing}
            />
            <FormField
              label="Middle name"
              value={formData.sponsor?.name?.middle || ""}
              onChange={(v: string) => updateSponsorSub("name", "middle", v)}
              readOnly={!isEditing}
            />
            <FormField
              label="Last name"
              value={formData.sponsor?.name?.last || ""}
              onChange={(v: string) => updateSponsorSub("name", "last", v)}
              readOnly={!isEditing}
            />
            <FormField
              label="Date of birth"
              type="date"
              value={formData.sponsor?.dateOfBirth || ""}
              onChange={(v: string) => updateSponsor("dateOfBirth", v)}
              readOnly={!isEditing}
              error={errors["sponsor.dateOfBirth"]}
            />
            <FormField
              label="City of birth"
              value={formData.sponsor?.placeOfBirth?.city || ""}
              onChange={(v: string) => updateSponsorSub("placeOfBirth", "city", v)}
              readOnly={!isEditing}
            />
            <FormField
              label="Country of birth"
              value={formData.sponsor?.placeOfBirth?.country || ""}
              onChange={(v: string) => updateSponsorSub("placeOfBirth", "country", v)}
              readOnly={!isEditing}
            />
            {isEditing ? (
              <FormSelect
                label="Sex"
                value={formData.sponsor?.sex}
                onChange={(v: string) => updateSponsor("sex", v)}
                options={[
                  {
                    value: "Male",
                    label: t("profile.fields.sex.options.male"),
                  },
                  {
                    value: "Female",
                    label: t("profile.fields.sex.options.female"),
                  },
                ]}
              />
            ) : (
              <FormField
                label="Sex"
                value={formData.sponsor?.sex || ""}
                onChange={() => {}}
                readOnly
              />
            )}
            <FormField
              label="Phone"
              value={formData.sponsor?.phone || ""}
              onChange={(v: string) => updateSponsor("phone", v)}
              readOnly={!isEditing}
            />
            <FormField
              label="Email"
              type="email"
              value={formData.sponsor?.email || ""}
              onChange={(v: string) => updateSponsor("email", v)}
              readOnly={!isEditing}
              error={errors["sponsor.email"]}
            />
            <FormField
              label="Passport number"
              value={formData.sponsor?.passportNumber || ""}
              onChange={(v: string) => updateSponsor("passportNumber", v)}
              readOnly={!isEditing}
            />
            <FormField
              label="Passport expiry"
              type="date"
              value={formData.sponsor?.passportExpiry || ""}
              onChange={(v: string) => updateSponsor("passportExpiry", v)}
              readOnly={!isEditing}
            />
            <FormField
              label="SSN"
              value={formData.sponsor?.ssn || ""}
              onChange={(v: string) => updateSponsor("ssn", v)}
              readOnly={!isEditing}
            />

            {/* US address */}
            <div className="mt-4 border-t border-slate-100 pt-4 sm:col-span-2 md:col-span-3">
              <h4 className="mb-3 text-xs font-medium text-slate-600">U.S. address</h4>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                <FormField
                  label="Street"
                  value={formData.sponsor?.address?.street || ""}
                  onChange={(v: string) => updateSponsorSub("address", "street", v)}
                  readOnly={!isEditing}
                />
                <FormField
                  label="City"
                  value={formData.sponsor?.address?.city || ""}
                  onChange={(v: string) => updateSponsorSub("address", "city", v)}
                  readOnly={!isEditing}
                />
                {isEditing ? (
                  <FormSelect
                    label="State"
                    // Resolve a legacy free-text value (full name) to its code so
                    // it still pre-selects in the dropdown; new saves store codes.
                    value={
                      US_STATES.find((s) => s.value === formData.sponsor?.address?.state)?.value ||
                      US_STATES.find(
                        (s) =>
                          s.label.toLowerCase() ===
                          (formData.sponsor?.address?.state || "").toLowerCase()
                      )?.value ||
                      ""
                    }
                    onChange={(v: string) => updateSponsorSub("address", "state", v)}
                    options={US_STATES}
                    placeholder="Select state"
                  />
                ) : (
                  <FormField
                    label="State"
                    value={
                      US_STATES.find((s) => s.value === formData.sponsor?.address?.state)?.label ||
                      formData.sponsor?.address?.state ||
                      ""
                    }
                    onChange={() => {}}
                    readOnly
                  />
                )}
                <FormField
                  label="ZIP code"
                  value={formData.sponsor?.address?.zipCode || ""}
                  onChange={(v: string) => updateSponsorSub("address", "zipCode", v)}
                  readOnly={!isEditing}
                />
                <FormField
                  label="Country"
                  value={formData.sponsor?.address?.country || ""}
                  onChange={(v: string) => updateSponsorSub("address", "country", v)}
                  readOnly={!isEditing}
                />
              </div>
            </div>
          </div>
        </ProfileSection>

        {/* Contact & Address */}
        <ProfileSection
          icon={<Mail className="h-4 w-4" />}
          title={t("profile.sections.contact")}
          description="The visa applicant's contact details & address (you)."
          isOpen={sections.contact}
          onToggle={() => toggleSection("contact")}
          colorScheme="periwinkle"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              label={t("profile.fields.phone")}
              value={formData.phone || ""}
              onChange={(v: string) => updateField("phone", v)}
              readOnly={!isEditing}
              placeholder={t("profile.placeholders.phone")}
            />
            <FormField
              label={t("profile.fields.email")}
              value={user.email || ""}
              onChange={() => {}}
              disabled
            />
            <FormField
              label={t("profile.fields.cnic")}
              value={formData.cnic || ""}
              onChange={(v: string) => updateField("cnic", v)}
              readOnly={!isEditing}
              placeholder={t("profile.placeholders.cnic")}
              error={errors["cnic"]}
            />
          </div>

          <div className="border-t border-slate-100 pt-4">
            <h4 className="mb-3 text-xs font-medium text-slate-600">Current Address</h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <FormField
                  label={t("profile.fields.address")}
                  value={formData.currentAddress?.street || ""}
                  onChange={(v: string) => updateAddress("street", v)}
                  readOnly={!isEditing}
                  placeholder={t("profile.placeholders.street")}
                />
              </div>
              <FormField
                label={t("profile.fields.city")}
                value={formData.currentAddress?.city || ""}
                onChange={(v: string) => updateAddress("city", v)}
                readOnly={!isEditing}
                placeholder={t("profile.placeholders.city")}
              />
              <FormField
                label={t("profile.fields.state")}
                value={formData.currentAddress?.state || ""}
                onChange={(v: string) => updateAddress("state", v)}
                readOnly={!isEditing}
                placeholder={t("profile.placeholders.state")}
              />
              <FormField
                label={t("profile.fields.zipCode")}
                value={formData.currentAddress?.zipCode || ""}
                onChange={(v: string) => updateAddress("zipCode", v)}
                readOnly={!isEditing}
                placeholder={t("profile.placeholders.zip")}
              />
              <FormField
                label={t("profile.fields.country")}
                value={formData.currentAddress?.country || ""}
                onChange={(v: string) => updateAddress("country", v)}
                readOnly={!isEditing}
                placeholder={t("profile.placeholders.country")}
              />
            </div>
          </div>

          {/* Mailing Address */}
          <div className="mt-4 border-t border-slate-100 pt-4">
            <div className="mb-3 flex items-center gap-2">
              <h4 className="text-xs font-medium text-slate-600">
                {t("profile.fields.mailingAddress")}
              </h4>
            </div>
            <FormCheckbox
              id="sameAsCurrent"
              label={t("profile.fields.sameAsCurrent")}
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
              <div className="mt-4 space-y-4 rounded-lg border border-slate-100 bg-slate-50 p-4">
                <FormField
                  label={t("profile.fields.address")}
                  value={formData.mailingAddress?.street || ""}
                  onChange={(v: string) => updateNested("mailingAddress", "street", v)}
                  readOnly={!isEditing}
                  placeholder={t("profile.placeholders.poBox")}
                />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    label={t("profile.fields.city")}
                    value={formData.mailingAddress?.city || ""}
                    onChange={(v: string) => updateNested("mailingAddress", "city", v)}
                    readOnly={!isEditing}
                    placeholder={t("profile.placeholders.newYork")}
                  />
                  <FormField
                    label={t("profile.fields.state")}
                    value={formData.mailingAddress?.state || ""}
                    onChange={(v: string) => updateNested("mailingAddress", "state", v)}
                    readOnly={!isEditing}
                    placeholder={t("profile.placeholders.ny")}
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    label={t("profile.fields.zipCode")}
                    value={formData.mailingAddress?.zipCode || ""}
                    onChange={(v: string) => updateNested("mailingAddress", "zipCode", v)}
                    readOnly={!isEditing}
                    placeholder={t("profile.placeholders.zip10001")}
                  />
                  <FormField
                    label={t("profile.fields.country")}
                    value={formData.mailingAddress?.country || ""}
                    onChange={(v: string) => updateNested("mailingAddress", "country", v)}
                    readOnly={!isEditing}
                    placeholder={t("profile.placeholders.usa")}
                  />
                </div>
              </div>
            )}
          </div>
        </ProfileSection>

        {/* Family Background */}
        <ProfileSection
          icon={<Users className="h-4 w-4" />}
          title={t("profile.sections.family")}
          description="The visa applicant's parents, father & mother (you)."
          isOpen={sections.family}
          onToggle={() => toggleSection("family")}
          colorScheme="mint"
        >
          {/* Father's Details */}
          <div>
            <h4 className="mb-3 text-xs font-medium text-slate-600">
              {t("profile.fields.father.header")}
            </h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
              <FormField
                label={t("profile.fields.father.firstName")}
                value={formData.father?.name?.first || ""}
                onChange={(v: string) =>
                  updateNested("father", "name", {
                    ...formData.father?.name,
                    first: v,
                  })
                }
                readOnly={!isEditing}
                placeholder={t("profile.placeholders.firstName")}
              />
              <FormField
                label={t("profile.fields.father.middleName")}
                value={formData.father?.name?.middle || ""}
                onChange={(v: string) =>
                  updateNested("father", "name", {
                    ...formData.father?.name,
                    middle: v,
                  })
                }
                readOnly={!isEditing}
                placeholder={t("profile.placeholders.middleName")}
              />
              <FormField
                label={t("profile.fields.father.lastName")}
                value={formData.father?.name?.last || ""}
                onChange={(v: string) =>
                  updateNested("father", "name", {
                    ...formData.father?.name,
                    last: v,
                  })
                }
                readOnly={!isEditing}
                placeholder={t("profile.placeholders.lastName")}
              />
            </div>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                label={t("profile.fields.dob")}
                type="date"
                value={formData.father?.dateOfBirth || ""}
                onChange={(v: string) => updateNested("father", "dateOfBirth", v)}
                readOnly={!isEditing}
              />
              <div className="flex items-end pb-2">
                <FormCheckbox
                  id="fatherDeceased"
                  label={t("profile.fields.deceased")}
                  checked={formData.father?.isDeceased || false}
                  onCheckedChange={(v) => updateNested("father", "isDeceased", v)}
                  disabled={!isEditing}
                />
              </div>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                label={t("profile.fields.cityOfBirth")}
                value={formData.father?.placeOfBirth?.city || ""}
                onChange={(v: string) =>
                  updateNested("father", "placeOfBirth", {
                    ...formData.father?.placeOfBirth,
                    city: v,
                  })
                }
                readOnly={!isEditing}
                placeholder={t("profile.placeholders.city")}
              />
              <FormField
                label={t("profile.fields.countryOfBirth")}
                value={formData.father?.placeOfBirth?.country || ""}
                onChange={(v: string) =>
                  updateNested("father", "placeOfBirth", {
                    ...formData.father?.placeOfBirth,
                    country: v,
                  })
                }
                readOnly={!isEditing}
                placeholder={t("profile.placeholders.country")}
              />
            </div>
            {!(formData.father?.isDeceased || false) && (
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  label={t("profile.fields.cityOfResidence")}
                  value={formData.father?.cityOfResidence || ""}
                  onChange={(v: string) => updateNested("father", "cityOfResidence", v)}
                  readOnly={!isEditing}
                  placeholder={t("profile.placeholders.city")}
                />
                <FormField
                  label={t("profile.fields.countryOfResidence")}
                  value={formData.father?.countryOfResidence || ""}
                  onChange={(v: string) => updateNested("father", "countryOfResidence", v)}
                  readOnly={!isEditing}
                  placeholder={t("profile.placeholders.country")}
                />
              </div>
            )}
          </div>

          {/* Mother's Details */}
          <div>
            <h4 className="mb-3 text-xs font-medium text-slate-600">
              {t("profile.fields.mother.header")}
            </h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
              <FormField
                label={t("profile.fields.mother.firstName")}
                value={formData.mother?.name?.first || ""}
                onChange={(v: string) =>
                  updateNested("mother", "name", {
                    ...formData.mother?.name,
                    first: v,
                  })
                }
                readOnly={!isEditing}
                placeholder={t("profile.placeholders.firstName")}
              />
              <FormField
                label={t("profile.fields.mother.middleName")}
                value={formData.mother?.name?.middle || ""}
                onChange={(v: string) =>
                  updateNested("mother", "name", {
                    ...formData.mother?.name,
                    middle: v,
                  })
                }
                readOnly={!isEditing}
                placeholder={t("profile.placeholders.middleName")}
              />
              <FormField
                label={t("profile.fields.mother.lastName")}
                value={formData.mother?.name?.last || ""}
                onChange={(v: string) =>
                  updateNested("mother", "name", {
                    ...formData.mother?.name,
                    last: v,
                  })
                }
                readOnly={!isEditing}
                placeholder={t("profile.placeholders.lastName")}
              />
            </div>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                label={t("profile.fields.dob")}
                type="date"
                value={formData.mother?.dateOfBirth || ""}
                onChange={(v: string) => updateNested("mother", "dateOfBirth", v)}
                readOnly={!isEditing}
              />
              <div className="flex items-end pb-2">
                <FormCheckbox
                  id="motherDeceased"
                  label={t("profile.fields.deceased")}
                  checked={formData.mother?.isDeceased || false}
                  onCheckedChange={(v) => updateNested("mother", "isDeceased", v)}
                  disabled={!isEditing}
                />
              </div>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
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
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  label="Current City of Residence"
                  value={formData.mother?.cityOfResidence || ""}
                  onChange={(v: string) => updateNested("mother", "cityOfResidence", v)}
                  readOnly={!isEditing}
                  placeholder="City"
                />
                <FormField
                  label="Current Country of Residence"
                  value={formData.mother?.countryOfResidence || ""}
                  onChange={(v: string) => updateNested("mother", "countryOfResidence", v)}
                  readOnly={!isEditing}
                  placeholder="Country"
                />
              </div>
            )}
          </div>
        </ProfileSection>

        {/* Employment & Education */}
        <ProfileSection
          icon={<Briefcase className="h-4 w-4" />}
          title={t("profile.sections.employment")}
          description="The visa applicant's work & education (you)."
          isOpen={sections.employment}
          onToggle={() => toggleSection("employment")}
          colorScheme="teal"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            <FormField
              label={t("profile.fields.occupation")}
              value={formData.occupation || ""}
              onChange={(v: string) => updateField("occupation", v)}
              readOnly={!isEditing}
              placeholder={t("profile.placeholders.occupation")}
            />
            <FormField
              label={t("profile.fields.jobTitle")}
              value={formData.jobTitle || ""}
              onChange={(v: string) => updateField("jobTitle", v)}
              readOnly={!isEditing}
              placeholder={t("profile.placeholders.jobTitle")}
            />
            <FormField
              label={t("profile.fields.employerName")}
              value={formData.employer?.name || ""}
              onChange={(v: string) => updateNested("employer", "name", v)}
              readOnly={!isEditing}
              placeholder={t("profile.placeholders.employer")}
            />
            <FormField
              label={t("profile.fields.annualIncome")}
              value={formData.annualIncome || ""}
              onChange={(v: string) => updateField("annualIncome", v)}
              readOnly={!isEditing}
              placeholder={t("profile.placeholders.annualIncome")}
            />
            {isEditing ? (
              <FormSelect
                label={t("profile.fields.industrySector.label")}
                value={formData.industrySector || ""}
                onChange={(v: string) => updateStrictField("industrySector", v)}
                options={[
                  {
                    value: "Technology",
                    label: t("profile.fields.industrySector.options.technology"),
                  },
                  {
                    value: "Healthcare",
                    label: t("profile.fields.industrySector.options.healthcare"),
                  },
                  {
                    value: "Education",
                    label: t("profile.fields.industrySector.options.education"),
                  },
                  {
                    value: "Finance",
                    label: t("profile.fields.industrySector.options.finance"),
                  },
                  {
                    value: "Construction",
                    label: t("profile.fields.industrySector.options.construction"),
                  },
                  {
                    value: "Manufacturing",
                    label: t("profile.fields.industrySector.options.manufacturing"),
                  },
                  {
                    value: "Retail",
                    label: t("profile.fields.industrySector.options.retail"),
                  },
                  {
                    value: "Government",
                    label: t("profile.fields.industrySector.options.government"),
                  },
                  {
                    value: "Military/Defense",
                    label: t("profile.fields.industrySector.options.military"),
                  },
                  {
                    value: "Other",
                    label: t("profile.fields.industrySector.options.other"),
                  },
                ]}
                placeholder={t("profile.placeholders.sector")}
              />
            ) : (
              <FormField
                label={t("profile.fields.industrySector.label")}
                value={formData.industrySector || ""}
                onChange={() => {}}
                readOnly
              />
            )}
            {isEditing ? (
              <FormSelect
                label={t("profile.fields.educationLevel.label")}
                value={formData.educationLevel || ""}
                onChange={(v: string) => updateStrictField("educationLevel", v)}
                options={[
                  {
                    value: "Did not graduate high school",
                    label: t("profile.fields.educationLevel.options.notGraduate"),
                  },
                  {
                    value: "High School",
                    label: t("profile.fields.educationLevel.options.highSchool"),
                  },
                  {
                    value: "Some College",
                    label: t("profile.fields.educationLevel.options.someCollege"),
                  },
                  {
                    value: "Associate Degree",
                    label: t("profile.fields.educationLevel.options.associate"),
                  },
                  {
                    value: "Bachelor&apos;s Degree",
                    label: t("profile.fields.educationLevel.options.bachelor"),
                  },
                  {
                    value: "Master&apos;s Degree",
                    label: t("profile.fields.educationLevel.options.master"),
                  },
                  {
                    value: "Doctorate",
                    label: t("profile.fields.educationLevel.options.doctorate"),
                  },
                ]}
                placeholder={t("profile.placeholders.education")}
              />
            ) : (
              <FormField
                label={t("profile.fields.educationLevel.label")}
                value={formData.educationLevel || ""}
                onChange={() => {}}
                readOnly
              />
            )}
            <FormField
              label={t("profile.fields.fieldOfStudy")}
              value={formData.educationField || ""}
              onChange={(v: string) => updateField("educationField", v)}
              readOnly={!isEditing}
              placeholder={t("profile.placeholders.fieldStudy")}
            />
          </div>
        </ProfileSection>

        {/* Immigration History */}
        <ProfileSection
          icon={<Plane className="h-4 w-4" />}
          title={t("profile.sections.immigration")}
          description="The visa applicant's travel & immigration history (you)."
          isOpen={sections.immigration}
          onToggle={() => toggleSection("immigration")}
          colorScheme="coral"
        >
          <FormCheckbox
            id="pva"
            label={t("profile.fields.immigrationHistory.previousVisa")}
            checked={formData.immigrationHistory?.previousVisaApplications || false}
            onCheckedChange={(c) =>
              updateNested("immigrationHistory", "previousVisaApplications", c)
            }
            disabled={!isEditing}
          />
          <FormCheckbox
            id="pvd"
            label={t("profile.fields.immigrationHistory.visaDenial")}
            checked={formData.immigrationHistory?.previousVisaDenial || false}
            onCheckedChange={(c) => updateNested("immigrationHistory", "previousVisaDenial", c)}
            disabled={!isEditing}
            variant="warning"
          />
          <FormCheckbox
            id="ov"
            label={t("profile.fields.immigrationHistory.overstay")}
            checked={formData.immigrationHistory?.overstayOrViolation || false}
            onCheckedChange={(c) => updateNested("immigrationHistory", "overstayOrViolation", c)}
            disabled={!isEditing}
            variant="warning"
          />
          <FormCheckbox
            id="cr"
            label={t("profile.fields.immigrationHistory.criminalRecord")}
            checked={formData.immigrationHistory?.criminalRecord || false}
            onCheckedChange={(c) => updateNested("immigrationHistory", "criminalRecord", c)}
            disabled={!isEditing}
            variant="warning"
          />
          <FormCheckbox
            id="rd"
            label={t("profile.fields.immigrationHistory.removal")}
            checked={formData.immigrationHistory?.removedOrDeported || false}
            onCheckedChange={(c) => updateNested("immigrationHistory", "removedOrDeported", c)}
            disabled={!isEditing}
            variant="warning"
          />
          <FormCheckbox
            id="ms"
            label={t("profile.fields.immigrationHistory.militaryService")}
            checked={formData.immigrationHistory?.priorMilitaryService || false}
            onCheckedChange={(c) => updateNested("immigrationHistory", "priorMilitaryService", c)}
            disabled={!isEditing}
          />
          <FormCheckbox
            id="swt"
            label={t("profile.fields.immigrationHistory.weaponsTraining")}
            checked={formData.immigrationHistory?.specializedWeaponsTraining || false}
            onCheckedChange={(c) =>
              updateNested("immigrationHistory", "specializedWeaponsTraining", c)
            }
            disabled={!isEditing}
          />
          <FormCheckbox
            id="uag"
            label={t("profile.fields.immigrationHistory.armedGroups")}
            checked={formData.immigrationHistory?.unofficialArmedGroups || false}
            onCheckedChange={(c) => updateNested("immigrationHistory", "unofficialArmedGroups", c)}
            disabled={!isEditing}
          />
        </ProfileSection>

        {/* Marriage & Relationship Evidence */}
        <ProfileSection
          icon={<Heart className="h-4 w-4" />}
          title={"Marriage & Relationship Evidence"}
          description="About your marriage & relationship with the sponsor."
          isOpen={sections.relationship}
          onToggle={() => toggleSection("relationship")}
          colorScheme="periwinkle"
        >
          <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormSelect
              label={t("profile.fields.relationshipType.label")}
              value={formData.relationship?.type || ""}
              onChange={(v) => updateNested("relationship", "type", v)}
              options={[
                {
                  value: "Spouse",
                  label: t("profile.fields.relationshipType.options.spouse"),
                },
                {
                  value: "Fiance",
                  label: t("profile.fields.relationshipType.options.fiance"),
                },
              ]}
              placeholder={t("profile.placeholders.selectGeneric")}
              readOnly={!isEditing}
            />
            <FormField
              label={t("profile.fields.relationshipStart")}
              type="date"
              value={formData.relationship?.startDate || ""}
              onChange={(v) => updateNested("relationship", "startDate", v)}
              readOnly={!isEditing}
            />
          </div>

          <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              label={t("profile.fields.marriageDate")}
              type="date"
              value={formData.relationship?.marriageDate || ""}
              onChange={(v) => updateNested("relationship", "marriageDate", v)}
              readOnly={!isEditing}
            />
            <FormField
              label={t("profile.fields.visits")}
              value={formData.relationship?.numberOfInPersonVisits?.toString() || ""}
              onChange={(v) =>
                updateNested("relationship", "numberOfInPersonVisits", v ? Number(v) : null)
              }
              type="number"
              placeholder="0"
              readOnly={!isEditing}
            />
          </div>

          <FormField
            label={t("profile.fields.howMet")}
            value={formData.relationship?.howDidYouMeet || ""}
            onChange={(v) => updateNested("relationship", "howDidYouMeet", v)}
            readOnly={!isEditing}
            placeholder={t("profile.placeholders.relMeet")}
          />

          <h4 className="mt-4 mb-3 text-xs font-medium text-slate-600">
            {t("profile.fields.evidence.header")}
          </h4>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FormCheckbox
              id="coh"
              label={t("profile.fields.evidence.cohabitation")}
              checked={formData.relationship?.cohabitationProof || false}
              onCheckedChange={(c) => updateNested("relationship", "cohabitationProof", c)}
              disabled={!isEditing}
            />
            <FormCheckbox
              id="fin"
              label={t("profile.fields.evidence.sharing")}
              checked={formData.relationship?.sharedFinancialAccounts || false}
              onCheckedChange={(c) => updateNested("relationship", "sharedFinancialAccounts", c)}
              disabled={!isEditing}
            />
            <FormCheckbox
              id="wed"
              label={t("profile.fields.evidence.wedding")}
              checked={formData.relationship?.weddingPhotos || false}
              onCheckedChange={(c) => updateNested("relationship", "weddingPhotos", c)}
              disabled={!isEditing}
            />
            <FormCheckbox
              id="comm"
              label={t("profile.fields.evidence.comm")}
              checked={formData.relationship?.communicationLogs || false}
              onCheckedChange={(c) => updateNested("relationship", "communicationLogs", c)}
              disabled={!isEditing}
            />
            <FormCheckbox
              id="money"
              label={t("profile.fields.evidence.money")}
              checked={formData.relationship?.moneyTransferReceipts || false}
              onCheckedChange={(c) => updateNested("relationship", "moneyTransferReceipts", c)}
              disabled={!isEditing}
            />
            <FormCheckbox
              id="meet"
              label={t("profile.fields.evidence.meet")}
              checked={formData.relationship?.meetingProof || false}
              onCheckedChange={(c) => updateNested("relationship", "meetingProof", c)}
              disabled={!isEditing}
            />
          </div>
        </ProfileSection>

        {/* Documents & Financial */}
        <ProfileSection
          icon={<FileText className="h-4 w-4" />}
          title={t("profile.sections.documents")}
          description="Which supporting documents you have ready."
          isOpen={sections.documents}
          onToggle={() => toggleSection("documents")}
          colorScheme="mint"
        >
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <h4 className="mb-3 block text-xs font-medium text-slate-600">
                {t("profile.fields.identityDocs")}
              </h4>
              <div className="space-y-3">
                <FormCheckbox
                  id="ppt"
                  label={t("profile.fields.docs.passport")}
                  checked={formData.documents?.hasPassport || false}
                  onCheckedChange={(c) => updateNested("documents", "hasPassport", c)}
                  disabled={!isEditing}
                />
                <FormCheckbox
                  id="bc"
                  label={t("profile.fields.docs.birth")}
                  checked={formData.documents?.hasBirthCertificate || false}
                  onCheckedChange={(c) => updateNested("documents", "hasBirthCertificate", c)}
                  disabled={!isEditing}
                />
                <FormCheckbox
                  id="mc"
                  label={t("profile.fields.docs.marriage")}
                  checked={formData.documents?.hasMarriageCertificate || false}
                  onCheckedChange={(c) => updateNested("documents", "hasMarriageCertificate", c)}
                  disabled={!isEditing}
                />
                <FormCheckbox
                  id="pc"
                  label={t("profile.fields.docs.police")}
                  checked={formData.documents?.hasPoliceCertificate || false}
                  onCheckedChange={(c) => updateNested("documents", "hasPoliceCertificate", c)}
                  disabled={!isEditing}
                />
              </div>
            </div>
            <div>
              <h4 className="mb-3 block text-xs font-medium text-slate-600">
                {t("profile.fields.financialDocs")}
              </h4>
              <div className="space-y-3">
                <FormCheckbox
                  id="tr"
                  label={t("profile.fields.financial.tax")}
                  checked={formData.financialProfile?.hasTaxReturns || false}
                  onCheckedChange={(c) => updateNested("financialProfile", "hasTaxReturns", c)}
                  disabled={!isEditing}
                />
                <FormCheckbox
                  id="ps"
                  label={t("profile.fields.financial.paystubs")}
                  checked={formData.financialProfile?.hasPaystubs || false}
                  onCheckedChange={(c) => updateNested("financialProfile", "hasPaystubs", c)}
                  disabled={!isEditing}
                />
                <FormCheckbox
                  id="bs"
                  label={t("profile.fields.financial.bank")}
                  checked={formData.financialProfile?.hasBankStatements || false}
                  onCheckedChange={(c) => updateNested("financialProfile", "hasBankStatements", c)}
                  disabled={!isEditing}
                />
              </div>
            </div>
          </div>
        </ProfileSection>

        {/* Affidavit Support Calculator */}
        <ProfileSection
          icon={<DollarSign className="h-4 w-4" />}
          title={t("profile.sections.affidavit")}
          description="The sponsor's financial details (Affidavit of Support, I-864)."
          isOpen={sections.affidavit}
          onToggle={() => toggleSection("affidavit")}
          colorScheme="teal"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {isEditing ? (
              <FormSelect
                label={t("profile.fields.sponsorStatus.label")}
                value={formData.sponsorStatus || ""}
                onChange={(v: string) => updateField("sponsorStatus", v as "citizen" | "greenCard")}
                options={[
                  {
                    value: "citizen",
                    label: t("profile.fields.sponsorStatus.options.citizen"),
                  },
                  {
                    value: "greenCard",
                    label: t("profile.fields.sponsorStatus.options.greenCard"),
                  },
                ]}
                placeholder={t("profile.placeholders.selectGeneric")}
              />
            ) : (
              <FormField
                label={t("profile.fields.sponsorStatus.label")}
                value={formData.sponsorStatus || ""}
                onChange={() => {}}
                readOnly
              />
            )}
            <FormCheckbox
              id="military"
              label={t("profile.fields.activeMilitary")}
              checked={formData.isMilitary || false}
              onCheckedChange={(c) => updateField("isMilitary", c)}
              disabled={!isEditing}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormCheckbox
              id="married"
              label={t("profile.fields.married")}
              checked={formData.isMarried || false}
              onCheckedChange={(c) => updateField("isMarried", c)}
              disabled={!isEditing}
            />
            <FormField
              label={t("profile.fields.numChildren")}
              type="number"
              value={formData.numberOfChildren?.toString() || "0"}
              onChange={(v: string) => updateField("numberOfChildren", v ? Number(v) : 0)}
              readOnly={!isEditing}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              label={t("profile.fields.taxDependents")}
              type="number"
              value={formData.taxDependents?.toString() || "0"}
              onChange={(v: string) => updateField("taxDependents", v ? Number(v) : 0)}
              readOnly={!isEditing}
            />
            <FormCheckbox
              id="prevSponsor"
              label={t("profile.fields.prevSponsorship")}
              checked={formData.hasPreviousSponsorship || false}
              onCheckedChange={(c) => updateField("hasPreviousSponsorship", c)}
              disabled={!isEditing}
            />
          </div>

          {formData.hasPreviousSponsorship && (
            <FormField
              label={t("profile.fields.prevSponsorshipCount")}
              type="number"
              value={formData.previousSponsoredCount?.toString() || "0"}
              onChange={(v: string) => updateField("previousSponsoredCount", v ? Number(v) : 0)}
              readOnly={!isEditing}
            />
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            <FormCheckbox
              id="sponsorApplicant"
              label={t("profile.fields.sponsoringApplicant")}
              checked={formData.currentSponsoredApplicant !== false} // defaults to true
              onCheckedChange={(c) => updateField("currentSponsoredApplicant", c)}
              disabled={!isEditing}
            />
            <FormCheckbox
              id="sponsorSpouse"
              label={t("profile.fields.sponsoringSpouse")}
              checked={formData.currentSponsoredSpouse || false}
              onCheckedChange={(c) => updateField("currentSponsoredSpouse", c)}
              disabled={!isEditing}
            />
            <FormField
              label={t("profile.fields.sponsoringChildren")}
              type="number"
              value={formData.currentSponsoredChildren?.toString() || "0"}
              onChange={(v: string) => updateField("currentSponsoredChildren", v ? Number(v) : 0)}
              readOnly={!isEditing}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormCheckbox
              id="sponsorDeceased"
              label={t("profile.fields.sponsorDeceased")}
              checked={formData.sponsorDeceased || false}
              onCheckedChange={(c) => updateField("sponsorDeceased", c)}
              disabled={!isEditing}
            />
            <FormField
              label={t("profile.fields.assetValue")}
              type="number"
              value={formData.assetValue?.toString() || "0"}
              onChange={(v: string) => updateField("assetValue", v ? Number(v) : 0)}
              readOnly={!isEditing}
            />
          </div>

          <FormField
            label={t("profile.fields.relationshipToApplicant")}
            value={formData.relationshipToApplicant || ""}
            onChange={(v: string) => updateField("relationshipToApplicant", v)}
            readOnly={!isEditing}
            placeholder={t("profile.placeholders.selectGeneric")}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            <FormCheckbox
              id="vawa"
              label={t("profile.fields.vawa")}
              checked={formData.isVAWA || false}
              onCheckedChange={(c) => updateField("isVAWA", c)}
              disabled={!isEditing}
            />
            <FormCheckbox
              id="widow"
              label={t("profile.fields.widow")}
              checked={formData.isWidow || false}
              onCheckedChange={(c) => updateField("isWidow", c)}
              disabled={!isEditing}
            />
            <FormCheckbox
              id="specialImmigrant"
              label={t("profile.fields.specialImmigrant")}
              checked={formData.isSpecialImmigrant || false}
              onCheckedChange={(c) => updateField("isSpecialImmigrant", c)}
              disabled={!isEditing}
            />
          </div>
        </ProfileSection>

        {/* Case Details */}
        <ProfileSection
          icon={<Compass className="h-4 w-4" />}
          title={"Case Details"}
          description="Background details for your visa case."
          isOpen={sections.visaContext}
          onToggle={() => toggleSection("visaContext")}
          colorScheme="coral"
        >
          <div>
            <h4 className="mb-3 block text-xs font-medium text-slate-600">
              {t("profile.fields.applicationDetails")}
            </h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {isEditing ? (
                <FormSelect
                  label={t("profile.fields.visaType.label")}
                  value={formData.visaType || ""}
                  onChange={(v: string) => updateField("visaType", v)}
                  options={[
                    {
                      value: "IR-1",
                      label: t("profile.fields.visaType.options.ir1"),
                    },
                    {
                      value: "CR-1",
                      label: t("profile.fields.visaType.options.cr1"),
                    },
                    {
                      value: "K-1",
                      label: t("profile.fields.visaType.options.k1"),
                    },
                    // IR-5 is hidden on production (see lib/feature-flags) until it launches.
                    ...(IR5_ENABLED
                      ? [{ value: "IR-5", label: t("profile.fields.visaType.options.ir5") }]
                      : []),
                    {
                      value: "F-1",
                      label: t("profile.fields.visaType.options.f1"),
                    },
                    {
                      value: "H-1B",
                      label: t("profile.fields.visaType.options.h1b"),
                    },
                    {
                      value: "B1/B2",
                      label: t("profile.fields.visaType.options.b1b2"),
                    },
                    {
                      value: "Other",
                      label: t("profile.fields.visaType.options.other"),
                    },
                  ]}
                  placeholder={t("profile.placeholders.visaType")}
                />
              ) : (
                <FormField
                  label={t("profile.fields.visaType.label")}
                  value={formData.visaType || ""}
                  onChange={() => {}}
                  readOnly
                />
              )}
              <FormField
                label={t("profile.fields.visaCategory")}
                value={formData.visaCategory || ""}
                onChange={(v: string) => updateField("visaCategory", v)}
                readOnly={!isEditing}
                placeholder={t("profile.placeholders.visaCategory")}
              />
            </div>
          </div>

          <div className="border-t border-slate-100 pt-5">
            <h4 className="mb-3 block text-xs font-medium text-slate-600">
              {t("profile.fields.sponsorHeader")}
            </h4>
            {/* Read-only mirror of the Sponsor section (single source of truth).
                Sponsor details are edited there; shown here only for case context
                so the same field can't be edited in two places. */}
            <p className="mb-3 text-xs text-slate-400">Edit these in the Sponsor section above.</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
              <FormField
                label={t("profile.fields.sponsorFirstName")}
                value={formData.sponsor?.name?.first || ""}
                onChange={() => {}}
                readOnly
                placeholder={t("profile.placeholders.firstName")}
              />
              <FormField
                label={t("profile.fields.sponsorMiddleName")}
                value={formData.sponsor?.name?.middle || ""}
                onChange={() => {}}
                readOnly
                placeholder={t("profile.placeholders.middleName")}
              />
              <FormField
                label={t("profile.fields.sponsorLastName")}
                value={formData.sponsor?.name?.last || ""}
                onChange={() => {}}
                readOnly
                placeholder={t("profile.placeholders.lastName")}
              />
            </div>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                label={t("profile.fields.dob")}
                type="date"
                value={formData.sponsor?.dateOfBirth || ""}
                onChange={() => {}}
                readOnly
              />
              <FormField
                label={t("profile.fields.sponsorPhone")}
                value={formData.sponsor?.phone || ""}
                onChange={() => {}}
                readOnly
                placeholder={t("profile.placeholders.phone")}
              />
            </div>
          </div>

          <div className="border-t border-slate-100 pt-5">
            <h4 className="mb-3 block text-xs font-medium text-slate-600">Beneficiary Details</h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
              <FormField
                label={t("profile.fields.beneficiaryFirstName")}
                value={formData.beneficiary?.name?.first || ""}
                onChange={(v: string) =>
                  updateNested("beneficiary", "name", {
                    ...formData.beneficiary?.name,
                    first: v,
                  })
                }
                readOnly={!isEditing}
                placeholder={t("profile.placeholders.firstName")}
              />
              <FormField
                label={t("profile.fields.beneficiaryMiddleName")}
                value={formData.beneficiary?.name?.middle || ""}
                onChange={(v: string) =>
                  updateNested("beneficiary", "name", {
                    ...formData.beneficiary?.name,
                    middle: v,
                  })
                }
                readOnly={!isEditing}
                placeholder={t("profile.placeholders.middleName")}
              />
              <FormField
                label={t("profile.fields.beneficiaryLastName")}
                value={formData.beneficiary?.name?.last || ""}
                onChange={(v: string) =>
                  updateNested("beneficiary", "name", {
                    ...formData.beneficiary?.name,
                    last: v,
                  })
                }
                readOnly={!isEditing}
                placeholder={t("profile.placeholders.lastName")}
              />
            </div>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                label={t("profile.fields.dob")}
                type="date"
                value={formData.beneficiary?.dateOfBirth || ""}
                onChange={(v: string) => updateNested("beneficiary", "dateOfBirth", v)}
                readOnly={!isEditing}
              />
              <FormField
                label={t("profile.fields.countryOfResidence")}
                value={formData.beneficiary?.countryOfResidence || ""}
                onChange={(v: string) => updateNested("beneficiary", "countryOfResidence", v)}
                readOnly={!isEditing}
                placeholder={t("profile.placeholders.country")}
              />
            </div>
          </div>
        </ProfileSection>

        {/* Eligibility Details */}
        <ProfileSection
          icon={<ShieldCheck className="h-4 w-4" />}
          title={"Eligibility Details"}
          description="Eligibility details for your visa case."
          isOpen={sections.visaEligibility}
          onToggle={() => toggleSection("visaEligibility")}
          colorScheme="periwinkle"
        >
          <div>
            <h4 className="mb-3 block text-xs font-medium text-slate-600">
              {t("profile.fields.petitionerDetails")}
            </h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {isEditing ? (
                <FormSelect
                  label={t("profile.fields.petitionerStatus.label")}
                  value={formData.visaEligibility?.petitionerStatus || ""}
                  onChange={(v: string) => updateNested("visaEligibility", "petitionerStatus", v)}
                  options={[
                    {
                      value: "US_CITIZEN",
                      label: t("profile.fields.petitionerStatus.options.usCitizen"),
                    },
                    {
                      value: "LPR",
                      label: t("profile.fields.petitionerStatus.options.lpr"),
                    },
                    {
                      value: "NONE",
                      label: t("profile.fields.petitionerStatus.options.none"),
                    },
                  ]}
                  placeholder={t("profile.placeholders.selectGeneric")}
                />
              ) : (
                <FormField
                  label={t("profile.fields.petitionerStatus.label")}
                  value={formData.visaEligibility?.petitionerStatus || ""}
                  onChange={() => {}}
                  readOnly
                />
              )}
              {isEditing ? (
                <FormSelect
                  label={t("profile.fields.petitionerAge.label")}
                  value={formData.visaEligibility?.petitionerAgeGroup || ""}
                  onChange={(v: string) => updateNested("visaEligibility", "petitionerAgeGroup", v)}
                  options={[
                    {
                      value: "UNDER_21",
                      label: t("profile.fields.petitionerAge.options.under21"),
                    },
                    {
                      value: "OVER_21",
                      label: t("profile.fields.petitionerAge.options.over21"),
                    },
                  ]}
                  placeholder={t("profile.placeholders.selectGeneric")}
                />
              ) : (
                <FormField
                  label={t("profile.fields.petitionerAge.label")}
                  value={formData.visaEligibility?.petitionerAgeGroup || ""}
                  onChange={() => {}}
                  readOnly
                />
              )}
            </div>
          </div>

          <div className="border-t border-slate-100 pt-5">
            <h4 className="mb-3 block text-xs font-medium text-slate-600">
              {t("profile.fields.statusIntent")}
            </h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {isEditing ? (
                <FormSelect
                  label={t("profile.fields.statusOrigin.label")}
                  value={formData.visaEligibility?.statusOrigin || ""}
                  onChange={(v: string) => updateNested("visaEligibility", "statusOrigin", v)}
                  options={[
                    {
                      value: "BIRTH",
                      label: t("profile.fields.statusOrigin.options.birth"),
                    },
                    {
                      value: "NATURALIZED",
                      label: t("profile.fields.statusOrigin.options.naturalized"),
                    },
                    {
                      value: "GREEN_CARD",
                      label: t("profile.fields.statusOrigin.options.greenCard"),
                    },
                  ]}
                  placeholder={t("profile.placeholders.selectGeneric")}
                />
              ) : (
                <FormField
                  label={t("profile.fields.statusOrigin.label")}
                  value={formData.visaEligibility?.statusOrigin || ""}
                  onChange={() => {}}
                  readOnly
                />
              )}
              {isEditing ? (
                <FormSelect
                  label={t("profile.fields.intent.label")}
                  value={formData.visaEligibility?.intent || ""}
                  onChange={(v: string) => updateNested("visaEligibility", "intent", v)}
                  options={[
                    {
                      value: "PERMANENT",
                      label: t("profile.fields.intent.options.permanent"),
                    },
                    {
                      value: "TEMPORARY",
                      label: t("profile.fields.intent.options.temporary"),
                    },
                  ]}
                  placeholder={t("profile.placeholders.selectGeneric")}
                />
              ) : (
                <FormField
                  label={t("profile.fields.intent.label")}
                  value={formData.visaEligibility?.intent || ""}
                  onChange={() => {}}
                  readOnly
                />
              )}
            </div>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {isEditing ? (
                <FormSelect
                  label={t("profile.fields.sponsorBase.label")}
                  value={formData.visaEligibility?.sponsorBase || ""}
                  onChange={(v: string) => updateNested("visaEligibility", "sponsorBase", v)}
                  options={[
                    {
                      value: "FAMILY",
                      label: t("profile.fields.sponsorBase.options.family"),
                    },
                    {
                      value: "EMPLOYMENT",
                      label: t("profile.fields.sponsorBase.options.employment"),
                    },
                    {
                      value: "INVESTMENT",
                      label: t("profile.fields.sponsorBase.options.investment"),
                    },
                    {
                      value: "HUMANITARIAN",
                      label: t("profile.fields.sponsorBase.options.humanitarian"),
                    },
                  ]}
                  placeholder={t("profile.placeholders.selectGeneric")}
                />
              ) : (
                <FormField
                  label={t("profile.fields.sponsorBase.label")}
                  value={formData.visaEligibility?.sponsorBase || ""}
                  onChange={() => {}}
                  readOnly
                />
              )}
            </div>
          </div>

          <div className="border-t border-slate-100 pt-5">
            <h4 className="mb-3 block text-xs font-medium text-slate-600">
              {t("profile.fields.historyLegal")}
            </h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {isEditing ? (
                <FormSelect
                  label={t("profile.fields.violationHistory.label")}
                  value={formData.visaEligibility?.violationHistory || ""}
                  onChange={(v: string) => updateNested("visaEligibility", "violationHistory", v)}
                  options={[
                    {
                      value: "NO",
                      label: t("profile.fields.violationHistory.options.no"),
                    },
                    {
                      value: "YES",
                      label: t("profile.fields.violationHistory.options.yes"),
                    },
                    {
                      value: "NOT_SURE",
                      label: t("profile.fields.violationHistory.options.unsure"),
                    },
                  ]}
                  placeholder={t("profile.placeholders.selectGeneric")}
                />
              ) : (
                <FormField
                  label={t("profile.fields.violationHistory.label")}
                  value={formData.visaEligibility?.violationHistory || ""}
                  onChange={() => {}}
                  readOnly
                />
              )}

              {isEditing ? (
                <FormSelect
                  label={t("profile.fields.legalStatus.label")}
                  value={formData.visaEligibility?.legalStatus || ""}
                  onChange={(v: string) => updateNested("visaEligibility", "legalStatus", v)}
                  options={[
                    {
                      value: "MARRIAGE_REGISTERED",
                      label: t("profile.fields.legalStatus.options.registered"),
                    },
                    {
                      value: "BIOLOGICAL",
                      label: t("profile.fields.legalStatus.options.biological"),
                    },
                    {
                      value: "ADOPTIVE",
                      label: t("profile.fields.legalStatus.options.adoptive"),
                    },
                    {
                      value: "STEP",
                      label: t("profile.fields.legalStatus.options.step"),
                    },
                  ]}
                  placeholder={t("profile.placeholders.selectGeneric")}
                />
              ) : (
                <FormField
                  label={t("profile.fields.legalStatus.label")}
                  value={formData.visaEligibility?.legalStatus || ""}
                  onChange={() => {}}
                  readOnly
                />
              )}
            </div>
          </div>
        </ProfileSection>
      </div>
    </div>
  );
}
