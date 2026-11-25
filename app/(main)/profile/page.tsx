"use client";

import * as React from "react";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { IR5_ENABLED, IR2_ENABLED } from "@/lib/feature-flags";
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
import { cn } from "@/lib/utils";
import { FormField, FormSelect, FormCheckbox } from "./form-field";
import { useToast } from "@/app/components/shared/ToastProvider";
import { validateProfile } from "@/lib/profile/schema";
import { useLanguage } from "@/app/context/LanguageContext";

// All 12 sections with their color themes (3 per color: teal, coral, blue, gold)
const sectionConfig = [
  { key: "personal", label: "Personal Info", icon: UserIcon, theme: "teal" },
  { key: "sponsor", label: "Sponsor Details", icon: HeartHandshake, theme: "coral" },
  { key: "contact", label: "Contact & Address", icon: Mail, theme: "blue" },
  { key: "family", label: "Family Background", icon: Users, theme: "teal" },
  { key: "employment", label: "Work & Education", icon: Briefcase, theme: "gold" },
  { key: "immigration", label: "Immigration History", icon: Plane, theme: "coral" },
  { key: "documents", label: "Documents", icon: FileText, theme: "gold" },
  { key: "financial", label: "Financial Profile", icon: DollarSign, theme: "blue" },
  { key: "relationship", label: "Relationship Evidence", icon: Heart, theme: "blue" },
  { key: "affidavit", label: "Affidavit Support", icon: DollarSign, theme: "teal" },
  { key: "visaContext", label: "Case Details", icon: Compass, theme: "coral" },
  { key: "visaEligibility", label: "Eligibility Details", icon: ShieldCheck, theme: "gold" },
];

// Color scheme definitions matching ProfilePage.html
const colorSchemes = {
  teal: {
    bg: "bg-[#E1F2EE]",
    text: "text-[#0A4F49]",
    border: "border-[#E1F2EE]",
    bar: "bg-[#0F8F80]",
    navBg: "bg-[#E1F2EE]",
    navText: "text-[#0A4F49]",
    navBorder: "border-[#0F8F80]/20",
  },
  coral: {
    bg: "bg-[#FBE7E4]",
    text: "text-[#6E2420]",
    border: "border-[#FBE7E4]",
    bar: "bg-[#C4534B]",
    navBg: "bg-[#FBE7E4]",
    navText: "text-[#6E2420]",
    navBorder: "border-[#C4534B]/20",
  },
  blue: {
    bg: "bg-[#E6E9F7]",
    text: "text-[#232E6B]",
    border: "border-[#E6E9F7]",
    bar: "bg-[#4A5BB5]",
    navBg: "bg-[#E6E9F7]",
    navText: "text-[#232E6B]",
    navBorder: "border-[#4A5BB5]/20",
  },
  gold: {
    bg: "bg-[#F9EDD3]",
    text: "text-[#5E3F07]",
    border: "border-[#F9EDD3]",
    bar: "bg-[#B47A12]",
    navBg: "bg-[#F9EDD3]",
    navText: "text-[#5E3F07]",
    navBorder: "border-[#B47A12]/20",
  },
};

type CardTheme = keyof typeof colorSchemes;

// ProfileCard component matching HTML design
interface ProfileCardProps {
  theme: CardTheme;
  icon: React.ReactNode;
  title: string;
  description: string;
  badge?: string;
  isOpen: boolean;
  onToggle: () => void;
  isCompleted?: boolean;
  hasWarning?: boolean;
  children: React.ReactNode;
}

const ProfileCard = ({
  theme,
  icon,
  title,
  description,
  badge,
  isOpen,
  onToggle,
  isCompleted = false,
  hasWarning = false,
  children,
}: ProfileCardProps) => {
  const colors = colorSchemes[theme];

  return (
    <article className="overflow-hidden rounded-lg border border-[#E2E5E8] bg-white shadow-sm transition-shadow hover:shadow-md sm:rounded-[20px]">
      <header
        onClick={onToggle}
        className="flex cursor-pointer items-start justify-between gap-2 border-b border-[#E2E5E8] px-4 py-3 sm:items-center sm:gap-3 sm:px-6 sm:py-[18px]"
      >
        <div className="flex min-w-0 flex-1 items-start gap-2.5 sm:items-center sm:gap-3.5">
          <div
            className={cn(
              "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[12px] sm:h-11 sm:w-11 sm:rounded-[14px]",
              colors.bg,
              colors.text
            )}
          >
            {icon}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold text-[#16302C] sm:text-[20px]">{title}</h2>
              {badge && (
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap sm:px-2.5 sm:py-1",
                    colors.bg,
                    colors.text
                  )}
                >
                  {badge}
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-[#66787A] sm:text-sm">{description}</p>
          </div>
        </div>

        <div className="flex flex-shrink-0 items-center gap-2 sm:gap-3">
          {isCompleted && (
            <div className="flex items-center gap-1 rounded-full bg-[#E1F2EE] px-2 py-1 text-[#0A4F49] sm:px-3 sm:py-1.5">
              <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              <span className="hidden text-xs font-semibold sm:inline">Completed</span>
            </div>
          )}

          {hasWarning && (
            <div className="flex items-center gap-1 rounded-full bg-[#FDF2F2] px-2 py-1 text-[#B3261E] sm:px-3 sm:py-1.5">
              <AlertCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              <span className="hidden text-xs font-semibold sm:inline">Attention</span>
            </div>
          )}

          <div
            className={cn(
              "flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[#F8F9FA] transition-transform duration-300",
              isOpen && "rotate-180"
            )}
          >
            <ChevronDown className="h-3.5 w-3.5 text-[#66787A]" />
          </div>
        </div>
      </header>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0, scaleY: 0 }}
            animate={{ height: "auto", opacity: 1, scaleY: 1 }}
            exit={{ height: 0, opacity: 0, scaleY: 0 }}
            transition={{
              height: { duration: 0.3, ease: "easeOut" },
              scaleY: { duration: 0.3, ease: "easeOut" },
              opacity: { duration: 0.2 },
            }}
            style={{ transformOrigin: "top" }}
            className="overflow-hidden"
          >
            <div className="px-4 py-4 sm:px-6 sm:py-6">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </article>
  );
};

// Animated circular progress component
const AnimatedCompletionRing = ({ percentage = 82 }: { percentage?: number }) => {
  const radius = 15.9155;
  const circumference = 2 * Math.PI * radius;
  const [displayPercentage, setDisplayPercentage] = React.useState(0);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDisplayPercentage(percentage);
    }, 100);
    return () => clearTimeout(timer);
  }, [percentage]);

  const offset = circumference - (displayPercentage / 100) * circumference;

  return (
    <div className="relative h-14 w-14">
      <svg viewBox="0 0 36 36" className="h-full w-full" style={{ transform: "rotate(-90deg)" }}>
        <path
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          fill="none"
          stroke="currentColor"
          strokeWidth="3.5"
          className="text-slate-200"
        />
        <path
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          fill="none"
          stroke="currentColor"
          strokeWidth="3.5"
          strokeLinecap="round"
          className="text-[#0F8F80] transition-all duration-1000 ease-out"
          style={{ strokeDasharray: circumference, strokeDashoffset: offset }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-bold text-[#0A4F49]">{displayPercentage}%</span>
      </div>
    </div>
  );
};

export default function ProfilePage() {
  const { t } = useLanguage();
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const {
    reset,
    watch,
    setValue,
    getValues,
    formState: { isDirty },
  } = useForm<MasterProfile>({ defaultValues: {} as MasterProfile });

  const formData = watch() as MasterProfile;

  const { showToast } = useToast();

  const setField = (path: string, value: unknown) =>
    setValue(path as Parameters<typeof setValue>[0], value as never, { shouldDirty: true });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const hasFetchedRef = useRef<string | null>(null);

  const [sections, setSections] = useState({
    personal: true,
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

  const userId = useMemo(() => user?.id, [user?.id]);

  const fetchProfile = useCallback(async () => {
    if (!userId || hasFetchedRef.current === userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const apiResponse = await fetch("/api/profile");
      if (!apiResponse.ok) throw new Error("Failed to fetch profile");
      const { profile } = await apiResponse.json();
      if (profile?.profile_details) {
        const profileDetails = profile.profile_details as MasterProfile;
        reset(profileDetails);
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
    const values = getValues();
    const found = validateProfile(values);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      showToast("Please fix the highlighted fields before saving.", "error");
      return;
    }

    try {
      setSaving(true);
      const response = await fetch("/api/profile/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile_details: values }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to save profile");
      }
      hasFetchedRef.current = null;
      await fetchProfile();
      setIsEditing(false);
      showToast(t("profile.successMessage"), "success");
    } catch (error) {
      console.error("Error saving profile:", error);
      showToast(t("profile.errorMessage"), "error");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setErrors({});
    showToast("Profile changes cancelled.", "info");
    reset();
  };

  const toggleSection = (key: keyof typeof sections) => {
    setSections((prev) => ({
      ...Object.keys(prev).reduce((acc, k) => ({ ...acc, [k]: false }), {}),
      [key]: !prev[key],
    }));
  };

  const updateField = <T extends keyof MasterProfile>(field: T, value: MasterProfile[T]) =>
    setField(field as string, value);
  const updateStrictField = <T extends keyof MasterProfile>(field: T, value: string) =>
    setField(field as string, value);
  const updateNested = (parent: string, field: string, value: unknown) =>
    setField(`${parent}.${field}`, value);
  const updateAddress = (field: keyof MasterProfile["currentAddress"], value: string) =>
    setField(`currentAddress.${String(field)}`, value);
  const updateSponsor = (field: string, value: unknown) => setField(`sponsor.${field}`, value);
  const updateSponsorSub = (
    sub: "name" | "placeOfBirth" | "address",
    field: string,
    value: string
  ) => setField(`sponsor.${sub}.${field}`, value);

  if (isLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8F9FA]">
        <Loader size="md" />
      </div>
    );
  }

  if (!user) return null;

  const hasValue = (value: unknown) =>
    value !== undefined && value !== null && (typeof value !== "string" || value.trim() !== "");
  const allValues = (...values: unknown[]) => values.every(hasValue);
  const allBooleans = (...values: unknown[]) => values.every((value) => typeof value === "boolean");
  const isCompleteAddress = (address?: MasterProfile["currentAddress"]) =>
    Boolean(
      address &&
      allValues(address.street, address.city, address.state, address.zipCode, address.country)
    );

  const sectionCompletion: Record<keyof typeof sections, boolean> = {
    personal: allValues(
      formData.name?.first,
      formData.name?.middle,
      formData.name?.last,
      formData.dateOfBirth,
      formData.placeOfBirth?.city,
      formData.placeOfBirth?.country,
      formData.sex,
      formData.nationality,
      formData.citizenshipStatus,
      formData.maritalStatus,
      formData.passportNumber,
      formData.passportIssueDate,
      formData.passportExpiry,
      formData.passportCountry,
      formData.ssn,
      formData.alienNumber,
      formData.uscisAccountNumber
    ),
    sponsor: allValues(
      formData.sponsor?.name?.first,
      formData.sponsor?.name?.middle,
      formData.sponsor?.name?.last,
      formData.sponsor?.dateOfBirth,
      formData.sponsor?.placeOfBirth?.city,
      formData.sponsor?.placeOfBirth?.country,
      formData.sponsor?.sex,
      formData.sponsor?.phone,
      formData.sponsor?.email,
      formData.sponsor?.passportNumber,
      formData.sponsor?.passportExpiry,
      formData.sponsor?.ssn,
      formData.sponsor?.address?.street,
      formData.sponsor?.address?.city,
      formData.sponsor?.address?.state,
      formData.sponsor?.address?.zipCode,
      formData.sponsor?.address?.country
    ),
    contact:
      allValues(formData.phone, formData.email, formData.cnic) &&
      isCompleteAddress(formData.currentAddress) &&
      (formData.sameAsCurrentAddress === true || isCompleteAddress(formData.mailingAddress)),
    family:
      allValues(
        formData.father?.name?.first,
        formData.father?.name?.middle,
        formData.father?.name?.last,
        formData.father?.dateOfBirth,
        formData.father?.placeOfBirth?.city,
        formData.father?.placeOfBirth?.country,
        formData.mother?.name?.first,
        formData.mother?.name?.middle,
        formData.mother?.name?.last,
        formData.mother?.dateOfBirth,
        formData.mother?.placeOfBirth?.city,
        formData.mother?.placeOfBirth?.country
      ) &&
      allBooleans(formData.father?.isDeceased, formData.mother?.isDeceased) &&
      (formData.father?.isDeceased ||
        allValues(formData.father?.cityOfResidence, formData.father?.countryOfResidence)) &&
      (formData.mother?.isDeceased ||
        allValues(formData.mother?.cityOfResidence, formData.mother?.countryOfResidence)),
    employment: allValues(
      formData.occupation,
      formData.jobTitle,
      formData.employer?.name,
      formData.annualIncome,
      formData.industrySector,
      formData.educationLevel,
      formData.educationField
    ),
    immigration: allBooleans(
      formData.immigrationHistory?.previousVisaApplications,
      formData.immigrationHistory?.previousVisaDenial,
      formData.immigrationHistory?.overstayOrViolation,
      formData.immigrationHistory?.criminalRecord,
      formData.immigrationHistory?.removedOrDeported,
      formData.immigrationHistory?.priorMilitaryService,
      formData.immigrationHistory?.specializedWeaponsTraining,
      formData.immigrationHistory?.unofficialArmedGroups
    ),
    documents: allBooleans(
      formData.documents?.hasPassport,
      formData.documents?.hasBirthCertificate,
      formData.documents?.hasMarriageCertificate,
      formData.documents?.hasPoliceCertificate,
      formData.financialProfile?.hasTaxReturns,
      formData.financialProfile?.hasPaystubs,
      formData.financialProfile?.hasBankStatements
    ),
    financial:
      allBooleans(
        formData.isMilitary,
        formData.isMarried,
        formData.isVAWA,
        formData.isWidow,
        formData.isSpecialImmigrant
      ) && typeof formData.numberOfChildren === "number",
    relationship:
      allValues(
        formData.relationship?.type,
        formData.relationship?.startDate,
        formData.relationship?.marriageDate,
        formData.relationship?.numberOfInPersonVisits,
        formData.relationship?.howDidYouMeet
      ) &&
      allBooleans(
        formData.relationship?.cohabitationProof,
        formData.relationship?.sharedFinancialAccounts,
        formData.relationship?.weddingPhotos,
        formData.relationship?.communicationLogs,
        formData.relationship?.moneyTransferReceipts,
        formData.relationship?.meetingProof
      ),
    affidavit:
      allValues(
        formData.sponsorStatus,
        formData.annualIncome,
        formData.numberOfChildren,
        formData.taxDependents,
        formData.currentSponsoredChildren,
        formData.assetValue,
        formData.relationshipToApplicant
      ) &&
      allBooleans(
        formData.isMilitary,
        formData.isMarried,
        formData.hasPreviousSponsorship,
        formData.currentSponsoredApplicant,
        formData.currentSponsoredSpouse,
        formData.sponsorDeceased,
        formData.isVAWA,
        formData.isWidow,
        formData.isSpecialImmigrant
      ) &&
      (!formData.hasPreviousSponsorship || hasValue(formData.previousSponsoredCount)),
    visaContext: allValues(
      formData.visaType,
      formData.visaCategory,
      formData.sponsor?.name?.first,
      formData.sponsor?.name?.middle,
      formData.sponsor?.name?.last,
      formData.sponsor?.dateOfBirth,
      formData.sponsor?.phone,
      formData.beneficiary?.name?.first,
      formData.beneficiary?.name?.middle,
      formData.beneficiary?.name?.last,
      formData.beneficiary?.dateOfBirth,
      formData.beneficiary?.countryOfResidence
    ),
    visaEligibility: allValues(
      formData.visaEligibility?.petitionerStatus,
      formData.visaEligibility?.petitionerAgeGroup,
      formData.visaEligibility?.statusOrigin,
      formData.visaEligibility?.intent,
      formData.visaEligibility?.sponsorBase,
      formData.visaEligibility?.violationHistory,
      formData.visaEligibility?.legalStatus
    ),
  };
  const completedSections = Object.values(sectionCompletion).filter(Boolean).length;
  const completeness = Math.round((completedSections / sectionConfig.length) * 100);

  return (
    <div className="w-full bg-[#F8F9FA]">
      {/* HERO SECTION - Offset below the fixed site navigation */}
      <section className="relative overflow-hidden bg-[#0A4F49] px-4 pt-8 pb-16 text-white sm:px-6 sm:pt-10 sm:pb-20 lg:px-8">
      <svg
            className="pointer-events-none hidden md:block absolute right-[300px] bottom-14 h-[160px] w-[150px] opacity-[.14]"
            viewBox="200 100 760 810"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              fill="currentColor"
              fillOpacity=".18"
              fillRule="evenodd"
              d="M236,880C228,876 222,867 222,860C222,854 229,840 237,832C244,824 270,806 281,801C284,800 296,794 300,792C307,789 328,781 348,774C352,772 358,770 360,770C361,769 364,768 366,768C367,768 370,767 371,766C372,766 376,764 380,763C383,762 387,761 390,760C392,760 397,758 401,757C405,756 413,754 418,753C424,751 429,750 430,750C432,750 448,740 452,735C454,734 458,730 462,728C482,713 509,687 523,667C529,659 529,657 523,657C518,657 500,652 492,648C487,646 474,640 469,637C449,626 418,594 404,570C400,564 399,562 389,556C359,535 336,510 321,479C307,452 300,426 300,400C300,383 301,378 306,374C311,370 319,373 326,381C327,383 330,386 331,387C332,389 333,390 333,390C333,391 335,394 338,398C340,403 342,406 342,407C342,407 344,411 346,416C348,421 352,429 354,434C356,440 358,445 359,446C359,448 361,452 363,457C365,462 367,469 369,472C371,476 372,480 372,481C372,481 373,484 374,486C377,493 378,496 379,500C380,502 383,507 384,511C386,514 387,517 387,518C387,518 388,521 390,525C392,529 394,533 395,535C397,540 397,541 402,550C421,585 441,608 468,626C475,631 496,642 498,642C498,642 500,643 502,643C509,646 526,650 532,650C535,650 535,650 541,639C544,632 546,626 546,626C546,625 546,624 547,623C548,622 552,609 557,591C563,564 561,527 551,502C540,474 522,455 487,434C485,433 465,423 462,421C454,418 432,409 421,405C417,403 412,401 410,400C409,400 405,398 403,397C398,396 393,393 382,388C368,382 366,381 361,378C358,376 356,375 355,375C355,375 352,374 350,372C347,371 345,369 344,368C308,347 280,314 266,276C263,267 258,251 257,245C256,242 254,236 254,233C249,216 247,184 248,161C249,142 252,136 259,132C269,127 278,135 293,159C311,187 325,207 337,220C339,223 344,229 347,232C366,254 396,279 416,290C419,291 422,293 424,294C428,297 442,303 451,308C462,313 471,317 476,319C490,325 493,326 502,331C507,333 516,338 520,340C525,343 531,346 533,347C540,351 550,358 560,365C566,369 572,374 573,375C580,380 602,402 609,412C620,427 622,430 630,446C635,457 637,462 643,480C646,488 649,504 653,525C659,563 660,567 668,567C671,567 673,566 675,566C676,565 677,564 678,564C680,564 710,541 728,525C732,522 744,511 754,501C779,477 785,472 798,464C816,454 834,449 854,452C869,454 879,458 892,469C898,474 902,476 913,477C935,480 943,482 943,485C942,487 935,491 930,492C921,494 907,500 894,507C880,515 866,529 858,544C852,555 846,567 846,569C846,570 846,571 845,572C845,572 843,576 842,581C839,589 838,592 835,600C835,602 833,606 832,610C831,615 826,630 822,640C810,675 776,713 739,732C735,734 731,737 730,737C729,738 721,742 714,744C678,758 649,762 609,760C585,759 577,758 568,757C521,751 463,751 439,757C434,758 402,783 383,800C377,805 370,810 368,813C359,820 353,825 340,836C312,859 289,874 269,880C261,883 242,883 236,880ZM259,873C275,872 299,859 323,840C328,836 334,831 337,829C339,826 348,819 355,813C366,803 377,794 395,780C396,778 398,777 399,776C400,775 403,773 406,770C415,763 417,761 409,763C406,764 398,767 391,769C373,773 378,772 340,785C336,786 332,787 331,788C330,788 328,789 326,790C308,797 285,807 276,812C248,829 231,848 231,861C231,866 237,873 243,874C245,874 247,874 248,875C248,875 250,875 251,874C252,874 256,874 259,873ZM652,751C666,749 677,747 683,745C697,741 700,740 711,736C717,734 723,731 725,730C726,730 727,729 728,729C728,729 731,728 733,726C736,724 738,723 739,723C740,723 759,710 766,704C774,697 788,683 791,678C798,669 804,659 804,659C804,658 805,657 805,656C807,654 816,632 820,622C821,617 823,612 823,611C824,610 826,603 828,596C830,589 833,579 835,574C837,568 839,562 840,561C840,560 841,557 842,556C842,555 843,553 844,552C856,529 871,512 888,502C897,497 911,490 914,489C923,488 921,485 911,485C900,484 895,481 884,473C874,466 870,463 860,461C848,458 829,459 816,464C797,472 785,481 746,520C739,527 730,535 726,538C722,541 715,546 710,551C679,575 669,579 661,574C652,568 650,562 643,521C635,473 625,446 601,414C593,404 573,384 561,375C548,365 523,350 510,344C508,343 505,341 504,341C489,333 476,327 475,327C474,327 471,326 468,324C464,323 459,320 455,318C411,299 383,280 352,248C325,221 316,208 282,157C266,133 260,132 257,154C255,168 257,210 260,222C260,224 262,229 262,234C265,245 268,257 273,269C274,272 276,276 276,277C279,287 291,309 301,321C309,332 337,357 340,357C341,357 344,359 347,361C350,363 357,367 362,369C376,376 392,384 392,384C393,384 396,385 399,387C405,390 424,398 432,401C435,402 441,404 446,407C452,409 456,411 457,411C457,411 459,412 461,412C462,413 468,416 474,419C489,426 491,427 498,431C536,456 554,479 565,519C567,526 567,529 567,554C567,581 567,589 563,600C562,601 562,604 561,606C561,609 559,615 557,620C555,626 552,632 552,633C552,635 549,639 547,643C545,647 544,650 544,651C545,651 552,651 559,651C594,651 625,641 668,615C673,612 678,609 679,609C680,608 683,607 686,605C691,602 694,602 694,604C694,605 678,617 667,624C654,633 636,642 627,646C596,656 584,659 556,660L538,660L534,666C530,672 530,673 522,682C518,686 513,692 511,695C507,699 488,718 481,723C474,729 462,738 460,740C457,742 454,745 455,745C455,746 463,745 472,745C492,743 529,745 557,748C576,750 595,752 602,752C612,753 645,752 652,751ZM390,545C390,544 390,543 389,542C386,537 378,518 371,501C369,495 365,486 363,482C362,477 359,470 357,466C356,462 353,455 351,450C349,445 347,440 347,438C335,406 319,380 312,381C310,381 309,382 309,388C308,395 309,420 310,424C311,425 312,429 312,431C312,433 314,438 314,440C315,442 317,447 318,449C324,472 342,502 359,520C374,536 390,549 390,545Z"
            />
          </svg>

        <div className="relative z-10 mx-auto flex max-w-6xl flex-col flex-wrap items-start justify-between gap-5 sm:flex-row sm:items-end sm:gap-6">
          <div className="min-w-0 flex-1">
            <h1 className="mb-2 text-[clamp(2rem,7vw,2.75rem)] leading-tight font-semibold text-white sm:text-5xl">
              Your Master Profile
            </h1>
            <p className="max-w-2xl text-sm leading-6 opacity-90 sm:text-[15.5px]">
              Complete and manage your biographic, contact, and legal details for automated
              immigration filing across all journeys.
            </p>
          </div>

          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:gap-3">
            <Button
              variant="outline"
              onClick={() => router.push("/complete-profile")}
              className="h-10 flex-1 border border-white/30 bg-white/15 px-3 text-xs font-semibold text-white hover:bg-white/25 sm:flex-none sm:px-4 sm:text-sm"
            >
              <Check className="mr-1.5 h-3.5 w-3.5 sm:mr-2 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Complete Profile</span>
              <span className="sm:hidden">Complete</span>
            </Button>

            {isEditing ? (
              <div className="flex w-full gap-1.5 sm:w-auto sm:gap-2">
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={saving}
                  className="h-9 flex-1 border-0 bg-white px-3 text-xs font-semibold text-[#0A4F49] hover:bg-white/90 sm:h-10 sm:flex-none sm:px-4 sm:text-sm"
                >
                  <X className="mr-1 h-3.5 w-3.5 sm:mr-2 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Cancel</span>
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving || !isDirty}
                  className="h-9 flex-1 bg-white px-3 text-xs font-semibold text-[#0A4F49] hover:bg-white/90 sm:h-10 sm:flex-none sm:px-4 sm:text-sm"
                >
                  {saving ? (
                    <Loader size="sm" />
                  ) : (
                    <Check className="mr-1 h-3.5 w-3.5 sm:mr-2 sm:h-4 sm:w-4" />
                  )}
                  <span className="hidden sm:inline">Save Changes</span>
                  <span className="sm:hidden">Save</span>
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => setIsEditing(true)}
                className="h-9 w-full bg-white px-3 text-xs font-semibold text-[#0A4F49] hover:bg-white/90 sm:h-10 sm:w-auto sm:px-4 sm:text-sm"
              >
                <Pencil className="mr-1 h-3.5 w-3.5 sm:mr-2 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Edit Profile</span>
                <span className="sm:hidden">Edit</span>
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* MAIN CONTENT - Raised into the hero like the reference layout */}
      <main className="relative z-20 mx-auto -mt-8 max-w-6xl px-4 pb-12 sm:-mt-12 sm:px-6 sm:pb-20 lg:px-8">
        <div className="grid grid-cols-1 items-start gap-6 sm:gap-7 lg:grid-cols-[minmax(0,310px)_minmax(0,1fr)]">
          {/* SIDEBAR - Responsive: full width on mobile, stacks on top */}
          <aside className="order-1 h-fit rounded-[20px] border border-[#E2E5E8] bg-white p-4 shadow-sm sm:p-[22px] lg:sticky lg:top-6 lg:order-1">
            <div className="mb-3 flex items-center justify-between border-b border-[#E2E5E8] pb-3 sm:mb-4 sm:pb-4">
              <div>
                <div className="mb-0.5 text-xs font-bold text-[#66787A] uppercase sm:mb-1">
                  Profile Completion
                </div>
                <div className="text-xl font-semibold text-[#16302C] sm:text-2xl">
                  {Math.round(completeness)}%
                </div>
                <div className="mt-0.5 text-xs font-semibold text-[#0F8F80]">
                  {completedSections} of {sectionConfig.length}
                </div>
              </div>
              <AnimatedCompletionRing percentage={completeness} />
            </div>

            <div className="mb-1 text-xs font-bold tracking-wide text-[#66787A] uppercase sm:mb-2">
              Profile Checklist
            </div>
            <nav className="space-y-0.5 sm:space-y-1">
              {sectionConfig.map(({ key, label, icon: Icon, theme }) => {
                const isDone = sectionCompletion[key];
                const isWarn =
                  key === "immigration" && formData.immigrationHistory?.previousVisaDenial;
                const sectionTheme = colorSchemes[theme as CardTheme];
                const isActive = sections[key as keyof typeof sections];

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleSection(key as keyof typeof sections)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg px-2 py-2 text-xs font-medium transition-all sm:rounded-xl sm:px-3 sm:py-2.5 sm:text-sm",
                      isActive
                        ? `${sectionTheme.navBg} ${sectionTheme.navText} border font-semibold ${sectionTheme.navBorder}`
                        : "border border-transparent text-[#16302C] hover:bg-[#F8F9FA]"
                    )}
                  >
                    <div className="flex min-w-0 items-center gap-1.5 sm:gap-2.5">
                      <Icon className="h-4 w-4 flex-shrink-0 text-[#66787A]" />
                      <span className="truncate">{label}</span>
                    </div>
                    {isDone && (
                      <div className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-[#0F8F80] sm:h-5 sm:w-5">
                        <Check className="h-2.5 w-2.5 text-white sm:h-3 sm:w-3" />
                      </div>
                    )}
                    {isWarn && (
                      <div className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-[#B47A12] sm:h-5 sm:w-5">
                        <AlertCircle className="h-2.5 w-2.5 text-white sm:h-3 sm:w-3" />
                      </div>
                    )}
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* CARD STACK - order on desktop to come after sidebar */}
          <div className="order-2 min-w-0 space-y-4 sm:space-y-[18px] lg:order-2">
            {/* Personal */}
            <ProfileCard
              theme="teal"
              icon={<UserIcon className="h-5 w-5" />}
              title="Personal Information"
              description="Your own details, the visa applicant (beneficiary)."
              badge="You"
              isOpen={sections.personal}
              onToggle={() => toggleSection("personal")}
              isCompleted={sectionCompletion.personal}
            >
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <FormField
                  label={t("profile.fields.firstName")}
                  value={formData.name?.first || ""}
                  onChange={(v: string) => updateNested("name", "first", v)}
                  readOnly={!isEditing}
                  placeholder={t("profile.placeholders.firstName")}
                  error={errors["name.first"]}
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
                  error={errors["name.last"]}
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
                      { value: "Male", label: t("profile.fields.sex.options.male") },
                      { value: "Female", label: t("profile.fields.sex.options.female") },
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
                      { value: "LPR", label: t("profile.fields.citizenshipStatus.options.lpr") },
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
                      { value: "Single", label: t("profile.fields.maritalStatus.options.single") },
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
                <div className="col-span-full mt-4 border-t border-[#E2E5E8] pt-4">
                  <h4 className="mb-3 text-xs font-semibold text-[#16302C]">Legal Identifiers</h4>
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
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
            </ProfileCard>

            {/* Sponsor */}
            <ProfileCard
              theme="coral"
              icon={<HeartHandshake className="h-5 w-5" />}
              title="Sponsor Details"
              description="The U.S. petitioner filing on your behalf, their details, not yours."
              badge="The other person"
              isOpen={sections.sponsor}
              onToggle={() => toggleSection("sponsor")}
              isCompleted={sectionCompletion.sponsor}
            >
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
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
                      { value: "Male", label: t("profile.fields.sex.options.male") },
                      { value: "Female", label: t("profile.fields.sex.options.female") },
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
                <div className="col-span-full mt-4 border-t border-[#E2E5E8] pt-4">
                  <h4 className="mb-3 text-xs font-semibold text-[#16302C]">U.S. Address</h4>
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
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
                    <FormField
                      label="State"
                      value={formData.sponsor?.address?.state || ""}
                      onChange={(v: string) => updateSponsorSub("address", "state", v)}
                      readOnly={!isEditing}
                    />
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
            </ProfileCard>

            {/* Contact */}
            <ProfileCard
              theme="blue"
              icon={<Mail className="h-5 w-5" />}
              title="Contact & Address"
              description="The visa applicant's contact details & address (you)."
              badge="You"
              isOpen={sections.contact}
              onToggle={() => toggleSection("contact")}
              isCompleted={sectionCompletion.contact}
            >
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <FormField
                  label={t("profile.fields.phone")}
                  value={formData.phone || ""}
                  onChange={(v: string) => updateField("phone", v)}
                  readOnly={!isEditing}
                  placeholder={t("profile.placeholders.phone")}
                  error={errors["phone"]}
                />
                <FormField
                  label={t("profile.fields.email")}
                  type="email"
                  value={formData.email || ""}
                  onChange={(v: string) => updateField("email", v)}
                  readOnly={!isEditing}
                  placeholder={t("profile.placeholders.email")}
                  error={errors["email"]}
                />
                <FormField
                  label={t("profile.fields.cnic")}
                  value={formData.cnic || ""}
                  onChange={(v: string) => updateField("cnic", v)}
                  readOnly={!isEditing}
                  placeholder={t("profile.placeholders.cnic")}
                  error={errors["cnic"]}
                />
                <div className="col-span-full">
                  <h3 className="mb-4 text-sm font-semibold text-[#16302C]">Current Address</h3>
                </div>
                <FormField
                  label={t("profile.fields.address")}
                  value={formData.currentAddress?.street || ""}
                  onChange={(v: string) => updateAddress("street", v)}
                  readOnly={!isEditing}
                  placeholder={t("profile.placeholders.street")}
                />
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

              {/* Mailing Address */}
              <div className="col-span-full mt-4 border-t border-[#E2E5E8] pt-4">
                <div className="mb-3 flex items-center gap-2">
                  <h4 className="text-xs font-semibold text-[#16302C]">
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
                  <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <FormField
                      label={t("profile.fields.address")}
                      value={formData.mailingAddress?.street || ""}
                      onChange={(v: string) => updateNested("mailingAddress", "street", v)}
                      readOnly={!isEditing}
                      placeholder={t("profile.placeholders.poBox")}
                    />
                    <FormField
                      label={t("profile.fields.city")}
                      value={formData.mailingAddress?.city || ""}
                      onChange={(v: string) => updateNested("mailingAddress", "city", v)}
                      readOnly={!isEditing}
                      placeholder={t("profile.placeholders.city")}
                    />
                    <FormField
                      label={t("profile.fields.state")}
                      value={formData.mailingAddress?.state || ""}
                      onChange={(v: string) => updateNested("mailingAddress", "state", v)}
                      readOnly={!isEditing}
                      placeholder={t("profile.placeholders.state")}
                    />
                    <FormField
                      label={t("profile.fields.zipCode")}
                      value={formData.mailingAddress?.zipCode || ""}
                      onChange={(v: string) => updateNested("mailingAddress", "zipCode", v)}
                      readOnly={!isEditing}
                      placeholder={t("profile.placeholders.zip")}
                    />
                    <FormField
                      label={t("profile.fields.country")}
                      value={formData.mailingAddress?.country || ""}
                      onChange={(v: string) => updateNested("mailingAddress", "country", v)}
                      readOnly={!isEditing}
                      placeholder={t("profile.placeholders.country")}
                    />
                  </div>
                )}
              </div>
            </ProfileCard>

            {/* Family */}
            <ProfileCard
              theme="teal"
              icon={<Users className="h-5 w-5" />}
              title="Family Background"
              description="The visa applicant's parents, father & mother (you)."
              badge="You"
              isOpen={sections.family}
              onToggle={() => toggleSection("family")}
              isCompleted={sectionCompletion.family}
            >
              <div className="space-y-6">
                <div>
                  <h3 className="mb-4 text-sm font-semibold text-[#16302C]">Father's Details</h3>
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
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
                    />
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
                    {!(formData.father?.isDeceased || false) && (
                      <>
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
                      </>
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="mb-4 text-sm font-semibold text-[#16302C]">Mother's Details</h3>
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
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
                    />
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
                    <FormField
                      label={t("profile.fields.cityOfBirth")}
                      value={formData.mother?.placeOfBirth?.city || ""}
                      onChange={(v: string) =>
                        updateNested("mother", "placeOfBirth", {
                          ...formData.mother?.placeOfBirth,
                          city: v,
                        })
                      }
                      readOnly={!isEditing}
                      placeholder={t("profile.placeholders.city")}
                    />
                    <FormField
                      label={t("profile.fields.countryOfBirth")}
                      value={formData.mother?.placeOfBirth?.country || ""}
                      onChange={(v: string) =>
                        updateNested("mother", "placeOfBirth", {
                          ...formData.mother?.placeOfBirth,
                          country: v,
                        })
                      }
                      readOnly={!isEditing}
                      placeholder={t("profile.placeholders.country")}
                    />
                    {!(formData.mother?.isDeceased || false) && (
                      <>
                        <FormField
                          label={t("profile.fields.cityOfResidence")}
                          value={formData.mother?.cityOfResidence || ""}
                          onChange={(v: string) => updateNested("mother", "cityOfResidence", v)}
                          readOnly={!isEditing}
                          placeholder={t("profile.placeholders.city")}
                        />
                        <FormField
                          label={t("profile.fields.countryOfResidence")}
                          value={formData.mother?.countryOfResidence || ""}
                          onChange={(v: string) => updateNested("mother", "countryOfResidence", v)}
                          readOnly={!isEditing}
                          placeholder={t("profile.placeholders.country")}
                        />
                      </>
                    )}
                  </div>
                </div>
              </div>
            </ProfileCard>

            {/* Employment */}
            <ProfileCard
              theme="gold"
              icon={<Briefcase className="h-5 w-5" />}
              title="Employment & Education"
              description="The visa applicant's work & education (you)."
              badge="You"
              isOpen={sections.employment}
              onToggle={() => toggleSection("employment")}
              isCompleted={sectionCompletion.employment}
            >
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <FormField
                  label={t("profile.fields.occupation")}
                  value={formData.occupation || ""}
                  onChange={(v: string) => updateField("occupation", v)}
                  readOnly={!isEditing}
                />
                <FormField
                  label={t("profile.fields.jobTitle")}
                  value={formData.jobTitle || ""}
                  onChange={(v: string) => updateField("jobTitle", v)}
                  readOnly={!isEditing}
                />
                <FormField
                  label={t("profile.fields.employerName")}
                  value={formData.employer?.name || ""}
                  onChange={(v: string) => updateNested("employer", "name", v)}
                  readOnly={!isEditing}
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
                      { value: "Retail", label: t("profile.fields.industrySector.options.retail") },
                      {
                        value: "Government",
                        label: t("profile.fields.industrySector.options.government"),
                      },
                      {
                        value: "Military/Defense",
                        label: t("profile.fields.industrySector.options.military"),
                      },
                      { value: "Other", label: t("profile.fields.industrySector.options.other") },
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
                        value: "Bachelor's Degree",
                        label: t("profile.fields.educationLevel.options.bachelor"),
                      },
                      {
                        value: "Master's Degree",
                        label: t("profile.fields.educationLevel.options.master"),
                      },
                      {
                        value: "Doctorate",
                        label: t("profile.fields.educationLevel.options.doctorate"),
                      },
                    ]}
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
            </ProfileCard>

            {/* Immigration */}
            <ProfileCard
              theme="coral"
              icon={<Plane className="h-5 w-5" />}
              title="Immigration History"
              description="The visa applicant's travel & immigration history (you)."
              badge="You"
              isOpen={sections.immigration}
              onToggle={() => toggleSection("immigration")}
              isCompleted={sectionCompletion.immigration}
              hasWarning={formData.immigrationHistory?.previousVisaDenial}
            >
              <div className="space-y-3">
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
                  onCheckedChange={(c) =>
                    updateNested("immigrationHistory", "previousVisaDenial", c)
                  }
                  disabled={!isEditing}
                  variant="warning"
                />
                <FormCheckbox
                  id="ov"
                  label={t("profile.fields.immigrationHistory.overstay")}
                  checked={formData.immigrationHistory?.overstayOrViolation || false}
                  onCheckedChange={(c) =>
                    updateNested("immigrationHistory", "overstayOrViolation", c)
                  }
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
                  onCheckedChange={(c) =>
                    updateNested("immigrationHistory", "removedOrDeported", c)
                  }
                  disabled={!isEditing}
                  variant="warning"
                />
                <FormCheckbox
                  id="ms"
                  label={t("profile.fields.immigrationHistory.militaryService")}
                  checked={formData.immigrationHistory?.priorMilitaryService || false}
                  onCheckedChange={(c) =>
                    updateNested("immigrationHistory", "priorMilitaryService", c)
                  }
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
                  onCheckedChange={(c) =>
                    updateNested("immigrationHistory", "unofficialArmedGroups", c)
                  }
                  disabled={!isEditing}
                />
              </div>
            </ProfileCard>

            {/* Documents */}
            <ProfileCard
              theme="gold"
              icon={<FileText className="h-5 w-5" />}
              title="Documents"
              description="Which supporting documents you have ready."
              isOpen={sections.documents}
              onToggle={() => toggleSection("documents")}
              isCompleted={sectionCompletion.documents}
            >
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <h4 className="mb-3 text-xs font-semibold text-[#16302C]">Identity Documents</h4>
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
                      onCheckedChange={(c) =>
                        updateNested("documents", "hasMarriageCertificate", c)
                      }
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
                  <h4 className="mb-3 text-xs font-semibold text-[#16302C]">Financial Documents</h4>
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
                      onCheckedChange={(c) =>
                        updateNested("financialProfile", "hasBankStatements", c)
                      }
                      disabled={!isEditing}
                    />
                  </div>
                </div>
              </div>
            </ProfileCard>

            {/* Financial */}
            <ProfileCard
              theme="blue"
              icon={<DollarSign className="h-5 w-5" />}
              title="Financial Profile"
              description="Your financial and employment status."
              isOpen={sections.financial}
              onToggle={() => toggleSection("financial")}
              isCompleted={sectionCompletion.financial}
            >
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormCheckbox
                    id="military"
                    label="Active Military"
                    checked={formData.isMilitary || false}
                    onCheckedChange={(c) => updateField("isMilitary", c)}
                    disabled={!isEditing}
                  />
                  <FormCheckbox
                    id="married"
                    label="Currently Married"
                    checked={formData.isMarried || false}
                    onCheckedChange={(c) => updateField("isMarried", c)}
                    disabled={!isEditing}
                  />
                </div>
                <FormField
                  label="Number of Children"
                  type="number"
                  value={formData.numberOfChildren?.toString() || ""}
                  onChange={(v) => updateField("numberOfChildren", v ? Number(v) : 0)}
                  readOnly={!isEditing}
                />
                <FormCheckbox
                  id="vawa"
                  label="VAWA Applicant"
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
            </ProfileCard>

            {/* Relationship */}
            <ProfileCard
              theme="blue"
              icon={<Heart className="h-5 w-5" />}
              title="Relationship Evidence"
              description="About your marriage & relationship with the sponsor."
              isOpen={sections.relationship}
              onToggle={() => toggleSection("relationship")}
              isCompleted={sectionCompletion.relationship}
            >
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                  label="How Did You Meet"
                  value={formData.relationship?.howDidYouMeet || ""}
                  onChange={(v) => updateNested("relationship", "howDidYouMeet", v)}
                  readOnly={!isEditing}
                />
                <div>
                  <h4 className="mb-3 text-xs font-semibold text-[#16302C]">
                    Relationship Evidence
                  </h4>
                  <div className="space-y-3">
                    <FormCheckbox
                      id="coh"
                      label="Cohabitation Proof"
                      checked={formData.relationship?.cohabitationProof || false}
                      onCheckedChange={(c) => updateNested("relationship", "cohabitationProof", c)}
                      disabled={!isEditing}
                    />
                    <FormCheckbox
                      id="fin"
                      label="Shared Financial Accounts"
                      checked={formData.relationship?.sharedFinancialAccounts || false}
                      onCheckedChange={(c) =>
                        updateNested("relationship", "sharedFinancialAccounts", c)
                      }
                      disabled={!isEditing}
                    />
                    <FormCheckbox
                      id="wed"
                      label="Wedding Photos"
                      checked={formData.relationship?.weddingPhotos || false}
                      onCheckedChange={(c) => updateNested("relationship", "weddingPhotos", c)}
                      disabled={!isEditing}
                    />
                    <FormCheckbox
                      id="comm"
                      label="Communication Logs"
                      checked={formData.relationship?.communicationLogs || false}
                      onCheckedChange={(c) => updateNested("relationship", "communicationLogs", c)}
                      disabled={!isEditing}
                    />
                    <FormCheckbox
                      id="money"
                      label="Money Transfer Receipts"
                      checked={formData.relationship?.moneyTransferReceipts || false}
                      onCheckedChange={(c) =>
                        updateNested("relationship", "moneyTransferReceipts", c)
                      }
                      disabled={!isEditing}
                    />
                    <FormCheckbox
                      id="meet"
                      label="Meeting Proof"
                      checked={formData.relationship?.meetingProof || false}
                      onCheckedChange={(c) => updateNested("relationship", "meetingProof", c)}
                      disabled={!isEditing}
                    />
                  </div>
                </div>
              </div>
            </ProfileCard>

            {/* Affidavit */}
            <ProfileCard
              theme="teal"
              icon={<DollarSign className="h-5 w-5" />}
              title="Affidavit Support"
              description="The sponsor's financial details (Affidavit of Support, I-864)."
              isOpen={sections.affidavit}
              onToggle={() => toggleSection("affidavit")}
              isCompleted={sectionCompletion.affidavit}
            >
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {isEditing ? (
                    <FormSelect
                      label={t("profile.fields.sponsorStatus.label")}
                      value={formData.sponsorStatus || ""}
                      onChange={(v: string) =>
                        updateField("sponsorStatus", v as "citizen" | "greenCard")
                      }
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
                    id="affidavitMilitary"
                    label={t("profile.fields.activeMilitary")}
                    checked={formData.isMilitary || false}
                    onCheckedChange={(c) => updateField("isMilitary", c)}
                    disabled={!isEditing}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormCheckbox
                    id="affidavitMarried"
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
                    onChange={(v: string) =>
                      updateField("previousSponsoredCount", v ? Number(v) : 0)
                    }
                    readOnly={!isEditing}
                  />
                )}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                  <FormCheckbox
                    id="sponsorApplicant"
                    label={t("profile.fields.sponsoringApplicant")}
                    checked={formData.currentSponsoredApplicant !== false}
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
                    onChange={(v: string) =>
                      updateField("currentSponsoredChildren", v ? Number(v) : 0)
                    }
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
                    id="affidavitVawa"
                    label={t("profile.fields.vawa")}
                    checked={formData.isVAWA || false}
                    onCheckedChange={(c) => updateField("isVAWA", c)}
                    disabled={!isEditing}
                  />
                  <FormCheckbox
                    id="affidavitWidow"
                    label={t("profile.fields.widow")}
                    checked={formData.isWidow || false}
                    onCheckedChange={(c) => updateField("isWidow", c)}
                    disabled={!isEditing}
                  />
                  <FormCheckbox
                    id="affidavitSpecialImmigrant"
                    label={t("profile.fields.specialImmigrant")}
                    checked={formData.isSpecialImmigrant || false}
                    onCheckedChange={(c) => updateField("isSpecialImmigrant", c)}
                    disabled={!isEditing}
                  />
                </div>
              </div>
            </ProfileCard>

            {/* Visa Context */}
            <ProfileCard
              theme="coral"
              icon={<Compass className="h-5 w-5" />}
              title="Case Details"
              description="Background details for your visa case."
              isOpen={sections.visaContext}
              onToggle={() => toggleSection("visaContext")}
              isCompleted={sectionCompletion.visaContext}
            >
              <div className="space-y-4">
                <div>
                  <h4 className="mb-3 block text-xs font-semibold text-[#16302C]">
                    {t("profile.fields.applicationDetails")}
                  </h4>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {isEditing ? (
                      <FormSelect
                        label={t("profile.fields.visaType.label")}
                        value={formData.visaType || ""}
                        onChange={(v: string) => updateField("visaType", v)}
                        options={[
                          { value: "IR-1", label: t("profile.fields.visaType.options.ir1") },
                          { value: "CR-1", label: t("profile.fields.visaType.options.cr1") },
                          { value: "K-1", label: t("profile.fields.visaType.options.k1") },
                          ...(IR5_ENABLED
                            ? [{ value: "IR-5", label: t("profile.fields.visaType.options.ir5") }]
                            : []),
                          ...(IR2_ENABLED
                            ? [{ value: "IR-2", label: t("profile.fields.visaType.options.ir2") }]
                            : []),
                          { value: "F-1", label: t("profile.fields.visaType.options.f1") },
                          { value: "H-1B", label: t("profile.fields.visaType.options.h1b") },
                          { value: "B1/B2", label: t("profile.fields.visaType.options.b1b2") },
                          { value: "Other", label: t("profile.fields.visaType.options.other") },
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

                <div className="border-t border-[#E2E5E8] pt-4">
                  <h4 className="mb-1 block text-xs font-semibold text-[#16302C]">
                    {t("profile.fields.sponsorHeader")}
                  </h4>
                  <p className="mb-3 text-xs text-slate-400">
                    Edit these in the Sponsor section above.
                  </p>
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

                <div className="border-t border-[#E2E5E8] pt-4">
                  <h4 className="mb-3 block text-xs font-semibold text-[#16302C]">
                    Beneficiary Details
                  </h4>
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
              </div>
            </ProfileCard>

            {/* Eligibility */}
            <ProfileCard
              theme="gold"
              icon={<ShieldCheck className="h-5 w-5" />}
              title="Eligibility Details"
              description="Eligibility details for your visa case."
              isOpen={sections.visaEligibility}
              onToggle={() => toggleSection("visaEligibility")}
              isCompleted={sectionCompletion.visaEligibility}
            >
              <div className="space-y-4">
                <div>
                  <h4 className="mb-3 block text-xs font-semibold text-[#16302C]">
                    {t("profile.fields.petitionerDetails")}
                  </h4>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {isEditing ? (
                      <FormSelect
                        label={t("profile.fields.petitionerStatus.label")}
                        value={formData.visaEligibility?.petitionerStatus || ""}
                        onChange={(v: string) =>
                          updateNested("visaEligibility", "petitionerStatus", v)
                        }
                        options={[
                          {
                            value: "US_CITIZEN",
                            label: t("profile.fields.petitionerStatus.options.usCitizen"),
                          },
                          { value: "LPR", label: t("profile.fields.petitionerStatus.options.lpr") },
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
                        onChange={(v: string) =>
                          updateNested("visaEligibility", "petitionerAgeGroup", v)
                        }
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

                <div className="border-t border-[#E2E5E8] pt-4">
                  <h4 className="mb-3 block text-xs font-semibold text-[#16302C]">
                    {t("profile.fields.statusIntent")}
                  </h4>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {isEditing ? (
                      <FormSelect
                        label={t("profile.fields.statusOrigin.label")}
                        value={formData.visaEligibility?.statusOrigin || ""}
                        onChange={(v: string) => updateNested("visaEligibility", "statusOrigin", v)}
                        options={[
                          { value: "BIRTH", label: t("profile.fields.statusOrigin.options.birth") },
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

                <div className="border-t border-[#E2E5E8] pt-4">
                  <h4 className="mb-3 block text-xs font-semibold text-[#16302C]">
                    {t("profile.fields.historyLegal")}
                  </h4>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {isEditing ? (
                      <FormSelect
                        label={t("profile.fields.violationHistory.label")}
                        value={formData.visaEligibility?.violationHistory || ""}
                        onChange={(v: string) =>
                          updateNested("visaEligibility", "violationHistory", v)
                        }
                        options={[
                          { value: "NO", label: t("profile.fields.violationHistory.options.no") },
                          { value: "YES", label: t("profile.fields.violationHistory.options.yes") },
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
                          { value: "STEP", label: t("profile.fields.legalStatus.options.step") },
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
              </div>
            </ProfileCard>
          </div>
        </div>
      </main>
    </div>
  );
}
