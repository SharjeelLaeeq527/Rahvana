"use client";

import { useState, useEffect, useRef } from "react";
import type { ToolModeProps } from "@/types/tool-mode";
import { useResolveToolMode } from "@/lib/hooks/useResolveToolMode";
import ServiceSkinShell from "@/components/tools/service-skin/ServiceSkinShell";
import ServiceSubjectPicker, {
  SOMEONE_ELSE_ID,
} from "@/components/tools/service-skin/ServiceSubjectPicker";
import {
  SERVICE_SKIN_FAQ,
  SERVICE_SKIN_TAGLINE,
} from "@/components/tools/service-skin/serviceSkinCopy";
import { normalizePlanTier } from "@/app/context/PlanContext";
import type { PlanTier } from "@/lib/entitlements/config";
import { Button } from "@/components/ui/button";
import { IR2_ENABLED, IR5_ENABLED } from "@/lib/feature-flags";
import { Input } from "@/components/ui/input";
import { ResultGate } from "@/app/components/entitlements/ResultGate";
import { Label } from "@/components/ui/label";
import IOMInfoStep from "@/app/(tools)/book-appointment/components/IOMInfoStep";
import { useAuth } from "@/app/context/AuthContext";
import { useCandidate } from "@/app/context/CandidateContext";
import { useLanguage } from "@/app/context/LanguageContext";
import { useUserProfile } from "@/app/context/UserProfileContext";
import { useWallet } from "@/app/context/WalletContext";
import { serviceBookingErrorMessage } from "@/lib/wallet/client";
import { mapProfileToGenericForm, mapFormToProfile } from "@/lib/autoFill/mapper";
import MedicalAppointmentCard, {
  type MedicalAppointmentRow,
} from "@/components/services/MedicalAppointmentCard";
import { Crown, CreditCard, ShoppingBag, Sparkles, X, Coins } from "lucide-react";
import { CustomDropdown } from "@/app/components/shared/CustomDropdown";
import { PhoneInput } from "@/components/ui/phone-input";
import type { Value as E164Number } from "react-phone-number-input";
import { validatePhoneNumber, formatPhoneNumber } from "@/lib/validation/phone";
import FieldLabel from "@/app/components/shared/FieldLabel";

type Location = "karachi" | "lahore" | "islamabad";
type IslamabadProvider = "amc" | "iom";
type Gender = "M" | "F" | "Other";

export interface MedicalAppointmentToolProps extends ToolModeProps {
  /** Journey overlay control. Standalone page omits these → renders inline full-page. */
  isOpen?: boolean;
  onClose?: () => void;
  /** Called after a successful booking so StepView can persist it to journey metadata. */
  onSave?: (record: {
    referenceId: string;
    referenceDate: string;
    location: string;
    status: string;
    timeSlot?: string;
  }) => void;
  /** Pre-fill from a previously saved journey request. */
  initialData?: Record<string, unknown>;
  candidateInfo?: { id?: string; name?: string; relation?: string; visaCategory?: string };
  /** Existing bookings surfaced on the journey intro screen (My-Resources-style cards). */
  existingRequests?: MedicalAppointmentRow[];
  /** Journey mode only: block a new booking while an active appointment date hasn't passed. */
  locked?: boolean;
  /** Human-readable reason shown on the intro when `locked` is true. */
  lockHint?: string;
  /** Journey mode only: initial services-status fetch is still in flight. */
  statusLoading?: boolean;
}

interface Applicant {
  id: string;
  surname: string;
  givenName: string;
  gender: Gender | "";
  dateOfBirth: string;
  passportNumber: string;
  passportIssueDate: string;
  passportExpiryDate: string;
  caseNumber: string;
  caseRef: string;
}

interface FormData {
  location: Location | "";
  islamabadProvider: IslamabadProvider | "";
  primaryContact: string;
  contactNumber: string;
  email: string;
  appointmentType: string;
  visaType: string;
  originalPassport: string;
  medicalType: string;
  surname: string;
  givenName: string;
  fullName: string;
  gender: Gender | "";
  dateOfBirth: string;
  passportNumber: string;
  passportIssueDate: string;
  passportExpiryDate: string;
  caseNumber: string;
  preferredLocation: string;
  destinationCountry: string;
  scannedPassport?: File | null;
  kOneLetter?: File | null;
  appointmentConfirmationLetter?: File | null;
  estimatedCharges: string;
  preferredAppointmentDate: string;
  preferredTime: string;
  interviewDate: string;
  visaCategory: string;
  hadMedicalBefore: string;
  city: string;
  caseRef: string;
  numberOfApplicants: string;
  applicants: Applicant[];
}

interface LocationStepProps {
  formData: FormData;
  error: string | null;
  onLocationChange: (location: Location) => void;
  onProviderChange: (provider: IslamabadProvider) => void;
  onNext: () => void;
}

const getPakistanTomorrow = () => {
  const now = new Date();

  const pakistanToday = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Karachi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);

  const tomorrow = new Date(`${pakistanToday}T00:00:00`);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return tomorrow.toISOString().split("T")[0];
};

const LocationStep = ({
  formData,
  error,
  onLocationChange,
  onProviderChange,
  onNext,
}: LocationStepProps) => {
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      <h2 className="mb-6 text-xl font-bold text-slate-900 sm:text-2xl">
        {t("bookAppointment.locationStep.title")}
      </h2>
      <p className="mb-8 text-slate-600">{t("bookAppointment.locationStep.subtitle")}</p>

      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <button
            type="button"
            className={`rounded-xl border-2 p-4 text-center transition-all sm:p-6 ${
              formData.location === "karachi"
                ? "border-teal-600 bg-teal-50"
                : "border-gray-200 hover:border-teal-400"
            }`}
            onClick={() => onLocationChange("karachi")}
          >
            <h3 className="mb-2 text-lg font-semibold">
              {t("bookAppointment.locationStep.karachi")}
            </h3>
            <p className="text-sm text-slate-600">
              {t("bookAppointment.locationStep.wilcareMedical")}
            </p>
          </button>

          <button
            type="button"
            className={`rounded-xl border-2 p-4 text-center transition-all sm:p-6 ${
              formData.location === "lahore"
                ? "border-teal-600 bg-teal-50"
                : "border-gray-200 hover:border-teal-400"
            }`}
            onClick={() => onLocationChange("lahore")}
          >
            <h3 className="mb-2 text-lg font-semibold">
              {t("bookAppointment.locationStep.lahore")}
            </h3>
            <p className="text-sm text-slate-600">
              {t("bookAppointment.locationStep.wilcareMedical")}
            </p>
          </button>

          <button
            type="button"
            className={`rounded-xl border-2 p-4 text-center transition-all sm:p-6 ${
              formData.location === "islamabad"
                ? "border-teal-600 bg-teal-50"
                : "border-gray-200 hover:border-teal-400"
            }`}
            onClick={() => onLocationChange("islamabad")}
          >
            <h3 className="mb-2 text-lg font-semibold">
              {t("bookAppointment.locationStep.islamabad")}
            </h3>
            <p className="text-sm text-slate-600">
              {t("bookAppointment.locationStep.chooseProviderBelow")}
            </p>
          </button>
        </div>

        {formData.location === "islamabad" && (
          <div className="space-y-4 rounded-lg border border-blue-200 bg-blue-50 p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-slate-900">
              {t("bookAppointment.locationStep.selectProviderTitle")}
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <button
                type="button"
                className={`rounded-lg border-2 p-4 text-center transition-all ${
                  formData.islamabadProvider === "amc"
                    ? "border-blue-600 bg-blue-100"
                    : "border-gray-300 hover:border-blue-400"
                }`}
                onClick={() => onProviderChange("amc")}
              >
                <h4 className="mb-1 font-semibold">{t("bookAppointment.locationStep.amc")}</h4>
                <p className="text-xs text-slate-600">
                  {t("bookAppointment.locationStep.amcDesc")}
                </p>
              </button>

              <button
                type="button"
                className={`rounded-lg border-2 p-4 text-center transition-all ${
                  formData.islamabadProvider === "iom"
                    ? "border-blue-600 bg-blue-100"
                    : "border-gray-300 hover:border-blue-400"
                }`}
                onClick={() => onProviderChange("iom")}
              >
                <h4 className="mb-1 font-semibold">{t("bookAppointment.locationStep.iom")}</h4>
                <p className="text-xs text-slate-600">
                  {t("bookAppointment.locationStep.iomDesc")}
                </p>
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex justify-end pt-4">
          <Button onClick={onNext} className="bg-teal-600 text-white hover:bg-teal-700">
            {t("bookAppointment.locationStep.nextBtn")}
          </Button>
        </div>
      </div>
    </div>
  );
};

interface BasicInfoStepProps {
  formData: FormData;
  error: string | null;
  isAMC: boolean;
  isWilcare: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSelectChange: (name: keyof FormData) => (value: string) => void;
  onPhoneChange: (value: E164Number) => void;
  onNext: () => void;
  onBack: () => void;
}

const BasicInfoStep = ({
  formData,
  error,
  isAMC,
  isWilcare,
  onChange,
  onSelectChange,
  onPhoneChange,
  onNext,
  onBack,
}: BasicInfoStepProps) => {
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      <div className="mb-6 flex items-center gap-2">
        <div className="rounded bg-teal-600 px-3 py-1 font-semibold text-white">
          {isAMC
            ? t("bookAppointment.basicInfoStep.amcBadge")
            : t("bookAppointment.basicInfoStep.hiBadge")}
        </div>
        <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
          {t("bookAppointment.basicInfoStep.title")}
        </h2>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {isAMC && (
            <>
              <div className="space-y-2">
                <FieldLabel
                  htmlFor="interviewDate"
                  title={t("bookAppointment.basicInfoStep.interviewDate")}
                />
                <Input
                  id="interviewDate"
                  name="interviewDate"
                  type="date"
                  value={formData.interviewDate}
                  onChange={onChange}
                />
              </div>

              <div className="space-y-2">
                <FieldLabel
                  htmlFor="visaCategory"
                  title={t("bookAppointment.basicInfoStep.visaCategory")}
                />
                <CustomDropdown
                  value={formData.visaCategory}
                  onChange={onSelectChange("visaCategory")}
                  options={[
                    {
                      value: "Immigrant Visa",
                      label: t("bookAppointment.basicInfoStep.visaCategories.immigrant"),
                    },
                  ]}
                  placeholder={t("bookAppointment.basicInfoStep.selectVisaCategory")}
                  className="w-full [&_button]:w-full [&_button]:min-w-0"
                />
              </div>

              <div className="space-y-2">
                <FieldLabel
                  htmlFor="hadMedicalBefore"
                  title={t("bookAppointment.basicInfoStep.hadMedicalBefore")}
                />
                <CustomDropdown
                  value={formData.hadMedicalBefore}
                  onChange={onSelectChange("hadMedicalBefore")}
                  options={[
                    { value: "Yes", label: t("bookAppointment.basicInfoStep.yes") },
                    { value: "No", label: t("bookAppointment.basicInfoStep.no") },
                  ]}
                  placeholder={t("bookAppointment.basicInfoStep.selectYesNo")}
                  className="w-full [&_button]:w-full [&_button]:min-w-0"
                />
              </div>
            </>
          )}

          <div className="space-y-2">
            <FieldLabel
              htmlFor="primaryContact"
              title={t("bookAppointment.basicInfoStep.mobileNo")}
            />
            <PhoneInput
              id="primaryContact"
              value={formData.primaryContact || ""}
              onChange={onPhoneChange}
              defaultCountry="PK"
              placeholder="3001234567"
            />
          </div>

          <div className="space-y-2">
            <FieldLabel htmlFor="email" title={t("bookAppointment.basicInfoStep.email")} />
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={onChange}
              placeholder="abc@gmail.com"
            />
          </div>

          {isAMC && (
            <>
              <div className="space-y-2">
                <FieldLabel htmlFor="city" title={t("bookAppointment.basicInfoStep.city")} />
                <Input
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={onChange}
                  placeholder={t("bookAppointment.basicInfoStep.enterCity")}
                />
              </div>

              <div className="space-y-2">
                <FieldLabel htmlFor="caseRef" title={t("bookAppointment.basicInfoStep.caseRef")} />
                <Input
                  id="caseRef"
                  name="caseRef"
                  value={formData.caseRef}
                  onChange={onChange}
                  placeholder={t("bookAppointment.basicInfoStep.enterCaseRef")}
                />
              </div>

              <div className="space-y-2">
                <FieldLabel
                  htmlFor="numberOfApplicants"
                  title={t("bookAppointment.basicInfoStep.numberOfApplicants")}
                />
                <CustomDropdown
                  value={formData.numberOfApplicants}
                  onChange={onSelectChange("numberOfApplicants")}
                  options={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => ({
                    value: num.toString(),
                    label: num.toString(),
                  }))}
                  placeholder={t("bookAppointment.basicInfoStep.selectNumber")}
                  className="w-full [&_button]:w-full [&_button]:min-w-0"
                />
              </div>
            </>
          )}

          {isWilcare && (
            <>
              <div className="space-y-2">
                <Label htmlFor="appointmentType">
                  {t("bookAppointment.basicInfoStep.appointmentType")}
                </Label>
                <CustomDropdown
                  value={formData.appointmentType}
                  onChange={onSelectChange("appointmentType")}
                  options={[
                    {
                      value: "Individual",
                      label: t("bookAppointment.basicInfoStep.appointmentTypes.individual"),
                    },
                    {
                      value: "Family",
                      label: t("bookAppointment.basicInfoStep.appointmentTypes.family"),
                    },
                  ]}
                  placeholder={t("bookAppointment.basicInfoStep.selectAppointmentType")}
                  className="w-full [&_button]:w-full [&_button]:min-w-0"
                />
              </div>

              <div className="space-y-2">
                <FieldLabel
                  htmlFor="visaType"
                  title={t("bookAppointment.basicInfoStep.visaType")}
                />
                <CustomDropdown
                  value={formData.visaType}
                  onChange={onSelectChange("visaType")}
                  options={[
                    { value: "IR-1", label: t("bookAppointment.basicInfoStep.visaTypes.ir1") },
                    // IR-5 is hidden on production (see lib/feature-flags) until it launches.
                    ...(IR5_ENABLED ? [{ value: "IR-5", label: "IR-5 Parent Visa" }] : []),
                    // IR-2 is hidden on production (see lib/feature-flags) until it launches.
                    ...(IR2_ENABLED ? [{ value: "IR-2", label: "IR-2 Child Visa" }] : []),
                  ]}
                  placeholder={t("bookAppointment.basicInfoStep.selectVisaType")}
                  className="w-full [&_button]:w-full [&_button]:min-w-0"
                  collapseWhenSingle
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="originalPassport">
                  {t("bookAppointment.basicInfoStep.originalPassport")}
                </Label>
                <CustomDropdown
                  value={formData.originalPassport}
                  onChange={onSelectChange("originalPassport")}
                  options={[
                    {
                      value: "YES",
                      label: t("bookAppointment.basicInfoStep.originalPassportOptions.yes"),
                    },
                    {
                      value: "NO",
                      label: t("bookAppointment.basicInfoStep.originalPassportOptions.no"),
                    },
                  ]}
                  placeholder={t("bookAppointment.basicInfoStep.originalPassportOptions.yes")}
                  className="w-full [&_button]:w-full [&_button]:min-w-0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="medicalType">
                  {t("bookAppointment.basicInfoStep.medicalType")}
                </Label>
                <CustomDropdown
                  value={formData.medicalType}
                  onChange={onSelectChange("medicalType")}
                  options={[
                    {
                      value: "First Medical",
                      label: t("bookAppointment.basicInfoStep.medicalTypes.first"),
                    },
                    {
                      value: "Re-Medical",
                      label: t("bookAppointment.basicInfoStep.medicalTypes.reMedical"),
                    },
                  ]}
                  placeholder={t("bookAppointment.basicInfoStep.selectMedicalType")}
                  className="w-full [&_button]:w-full [&_button]:min-w-0"
                />
              </div>
            </>
          )}
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex justify-between pt-4">
          <Button
            onClick={onBack}
            variant="outline"
            className="bg-teal-600 text-white hover:bg-teal-700 hover:text-white"
          >
            {t("bookAppointment.basicInfoStep.prevBtn")}
          </Button>
          <Button onClick={onNext} className="bg-teal-600 text-white hover:bg-teal-700">
            {t("bookAppointment.basicInfoStep.nextBtn")}
          </Button>
        </div>
      </div>
    </div>
  );
};

interface ApplicantInfoProps {
  applicant: Applicant;
  index: number;
  onChange: (index: number, field: keyof Applicant, value: string) => void;
}

const ApplicantInfo = ({ applicant, index, onChange }: ApplicantInfoProps) => {
  const { t } = useLanguage();
  const today = new Date().toISOString().split("T")[0];
  const isFutureDob = Boolean(applicant.dateOfBirth && applicant.dateOfBirth > today);

  return (
    <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-4 sm:p-6">
      <h3 className="mb-4 text-lg font-semibold text-slate-900">Applicant {index + 1}</h3>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <FieldLabel
            htmlFor={`applicant-${index}-surname`}
            title={t("bookAppointment.personalInfoStep.surname")}
          />
          <Input
            id={`applicant-${index}-surname`}
            value={applicant.surname}
            onChange={(e) => onChange(index, "surname", e.target.value)}
            placeholder={t("bookAppointment.personalInfoStep.enterSurname")}
          />
        </div>

        <div className="space-y-2">
          <FieldLabel
            htmlFor={`applicant-${index}-givenName`}
            title={t("bookAppointment.personalInfoStep.givenName")}
          />
          <Input
            id={`applicant-${index}-givenName`}
            value={applicant.givenName}
            onChange={(e) => onChange(index, "givenName", e.target.value)}
            placeholder={t("bookAppointment.personalInfoStep.enterGivenName")}
          />
        </div>

        <div className="space-y-2">
          <FieldLabel
            htmlFor={`applicant-${index}-gender`}
            title={t("bookAppointment.personalInfoStep.gender")}
          />
          <CustomDropdown
            value={applicant.gender}
            onChange={(value) => onChange(index, "gender", value)}
            options={[
              { value: "M", label: t("bookAppointment.personalInfoStep.genders.m") },
              { value: "F", label: t("bookAppointment.personalInfoStep.genders.f") },
              { value: "Other", label: t("bookAppointment.personalInfoStep.genders.other") },
            ]}
            placeholder={t("bookAppointment.personalInfoStep.selectGender")}
            className="w-full [&_button]:w-full [&_button]:min-w-0"
          />
        </div>

        <div className="space-y-2">
          <FieldLabel
            htmlFor={`applicant-${index}-dateOfBirth`}
            title={t("bookAppointment.personalInfoStep.dateOfBirth")}
          />
          <Input
            id={`applicant-${index}-dateOfBirth`}
            type="date"
            max={today}
            value={applicant.dateOfBirth}
            onChange={(e) => onChange(index, "dateOfBirth", e.target.value)}
            className={isFutureDob ? "border-red-500 focus-visible:ring-red-500" : ""}
          />
          {isFutureDob && (
            <p className="text-xs font-medium text-red-500">
              {t("bookAppointment.validation.dobFuture") !== "bookAppointment.validation.dobFuture"
                ? t("bookAppointment.validation.dobFuture")
                : "Date of birth cannot be in the future"}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

interface PersonalInfoStepProps {
  formData: FormData;
  error: string | null;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSelectChange: (name: keyof FormData) => (value: string) => void;
  onApplicantChange: (index: number, field: keyof Applicant, value: string) => void;
  onNext: () => void;
  onBack: () => void;
}

const PersonalInfoStep = ({
  formData,
  error,
  onChange,
  onSelectChange,
  onApplicantChange,
  onNext,
  onBack,
}: PersonalInfoStepProps) => {
  const { t } = useLanguage();
  const today = new Date().toISOString().split("T")[0];
  const isPrimaryDobFuture = Boolean(formData.dateOfBirth && formData.dateOfBirth > today);
  const hasApplicantDobFuture =
    parseInt(formData.numberOfApplicants) > 1 &&
    formData.applicants.some((a) => a.dateOfBirth && a.dateOfBirth > today);

  const hasValidationError = Boolean(error || isPrimaryDobFuture || hasApplicantDobFuture);

  return (
    <div className="space-y-6">
      <div className="mb-6 flex items-center gap-2">
        <div className="rounded bg-teal-600 px-3 py-1 font-semibold text-white">
          {t("bookAppointment.personalInfoStep.badge")}
        </div>
        <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
          {t("bookAppointment.personalInfoStep.title")}
        </h2>
      </div>

      <div className="space-y-6">
        {/* Primary applicant information */}
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 sm:p-6">
          <h3 className="mb-4 text-lg font-semibold text-slate-900">
            {t("bookAppointment.personalInfoStep.primaryApplicantTitle")}
          </h3>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <FieldLabel htmlFor="surname" title={t("bookAppointment.personalInfoStep.surname")} />
              <Input
                id="surname"
                name="surname"
                value={formData.surname}
                onChange={onChange}
                placeholder={t("bookAppointment.personalInfoStep.enterSurname")}
              />
            </div>

            <div className="space-y-2">
              <FieldLabel
                htmlFor="givenName"
                title={t("bookAppointment.personalInfoStep.givenName")}
              />
              <Input
                id="givenName"
                name="givenName"
                value={formData.givenName}
                onChange={onChange}
                placeholder={t("bookAppointment.personalInfoStep.enterGivenName")}
              />
            </div>

            <div className="space-y-2">
              <FieldLabel htmlFor="gender" title={t("bookAppointment.personalInfoStep.gender")} />
              <CustomDropdown
                value={formData.gender}
                onChange={onSelectChange("gender")}
                options={[
                  { value: "M", label: t("bookAppointment.personalInfoStep.genders.m") },
                  { value: "F", label: t("bookAppointment.personalInfoStep.genders.f") },
                  { value: "Other", label: t("bookAppointment.personalInfoStep.genders.other") },
                ]}
                placeholder={t("bookAppointment.personalInfoStep.selectGender")}
                className="w-full [&_button]:w-full [&_button]:min-w-0"
              />
            </div>

            <div className="space-y-2">
              <FieldLabel
                htmlFor="dateOfBirth"
                title={t("bookAppointment.personalInfoStep.dateOfBirth")}
              />
              <Input
                id="dateOfBirth"
                name="dateOfBirth"
                type="date"
                max={today}
                value={formData.dateOfBirth}
                onChange={onChange}
                className={isPrimaryDobFuture ? "border-red-500 focus-visible:ring-red-500" : ""}
              />
              {isPrimaryDobFuture && (
                <p className="text-xs font-medium text-red-500">
                  {t("bookAppointment.validation.dobFuture") !==
                  "bookAppointment.validation.dobFuture"
                    ? t("bookAppointment.validation.dobFuture")
                    : "Date of birth cannot be in the future"}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Additional applicants if any */}
        {parseInt(formData.numberOfApplicants) > 1 && (
          <div>
            <h3 className="mb-4 text-lg font-semibold text-slate-900">
              {t("bookAppointment.personalInfoStep.additionalApplicantsTitle")}
            </h3>
            {formData.applicants.map((applicant, index) => (
              <ApplicantInfo
                key={applicant.id}
                applicant={applicant}
                index={index}
                onChange={onApplicantChange}
              />
            ))}
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex justify-between pt-4">
          <Button
            onClick={onBack}
            variant="outline"
            className="bg-teal-600 text-white hover:bg-teal-700"
          >
            {t("bookAppointment.personalInfoStep.prevBtn")}
          </Button>
          <Button
            onClick={onNext}
            disabled={hasValidationError}
            className="bg-teal-600 text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t("bookAppointment.personalInfoStep.nextBtn")}
          </Button>
        </div>
      </div>
    </div>
  );
};

interface ApplicantPassportInfoProps {
  applicant: Applicant;
  index: number;
  isAMC: boolean;
  onChange: (index: number, field: keyof Applicant, value: string) => void;
}

const ApplicantPassportInfo = ({
  applicant,
  index,
  isAMC,
  onChange,
}: ApplicantPassportInfoProps) => {
  const { t } = useLanguage();
  return (
    <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-4 sm:p-6">
      <h3 className="mb-4 text-lg font-semibold text-slate-900">Applicant {index + 1}</h3>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <FieldLabel
            htmlFor={`applicant-${index}-passportNumber`}
            title={t("bookAppointment.passportDetailsStep.passportNumber")}
          />
          <Input
            id={`applicant-${index}-passportNumber`}
            value={applicant.passportNumber}
            onChange={(e) => onChange(index, "passportNumber", e.target.value)}
            placeholder={t("bookAppointment.passportDetailsStep.enterPassportNumber")}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`applicant-${index}-passportIssueDate`}>
            {t("bookAppointment.passportDetailsStep.issueDate")}
          </Label>
          <Input
            id={`applicant-${index}-passportIssueDate`}
            type="date"
            value={applicant.passportIssueDate}
            onChange={(e) => onChange(index, "passportIssueDate", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`applicant-${index}-passportExpiryDate`}>
            {t("bookAppointment.passportDetailsStep.expiryDate")}
          </Label>
          <Input
            id={`applicant-${index}-passportExpiryDate`}
            type="date"
            value={applicant.passportExpiryDate}
            onChange={(e) => onChange(index, "passportExpiryDate", e.target.value)}
          />
        </div>

        {!isAMC && (
          <div className="space-y-2">
            <Label htmlFor={`applicant-${index}-caseNumber`}>
              {t("bookAppointment.passportDetailsStep.caseNumber")}
            </Label>
            <Input
              id={`applicant-${index}-caseNumber`}
              value={applicant.caseNumber}
              onChange={(e) => onChange(index, "caseNumber", e.target.value)}
              placeholder={t("bookAppointment.passportDetailsStep.enterCaseNumber")}
            />
          </div>
        )}

        {isAMC && (
          <div className="space-y-2">
            <Label htmlFor={`applicant-${index}-caseRef`}>
              {t("bookAppointment.passportDetailsStep.caseRef")}
            </Label>
            <Input
              id={`applicant-${index}-caseRef`}
              value={applicant.caseRef}
              onChange={(e) => onChange(index, "caseRef", e.target.value)}
              placeholder={t("bookAppointment.passportDetailsStep.enterCaseRef")}
            />
          </div>
        )}
      </div>
    </div>
  );
};

interface PassportDetailsStepProps {
  formData: FormData;
  error: string | null;
  isAMC: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onApplicantChange: (index: number, field: keyof Applicant, value: string) => void;
  onNext: () => void;
  onBack: () => void;
}

const PassportDetailsStep = ({
  formData,
  error,
  isAMC,
  onChange,
  onApplicantChange,
  onNext,
  onBack,
}: PassportDetailsStepProps) => {
  const { t } = useLanguage();
  return (
    <div className="space-y-6">
      <div className="mb-6 flex items-center gap-2">
        <div className="rounded bg-teal-600 px-3 py-1 font-semibold text-white">
          {t("bookAppointment.passportDetailsStep.badge")}
        </div>
        <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
          {t("bookAppointment.passportDetailsStep.title")}
        </h2>
      </div>

      <div className="space-y-6">
        {/* Primary applicant passport details */}
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 sm:p-6">
          <h3 className="mb-4 text-lg font-semibold text-slate-900">
            {t("bookAppointment.passportDetailsStep.primaryApplicantTitle")}
          </h3>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <FieldLabel
                htmlFor="passportNumber"
                title={t("bookAppointment.passportDetailsStep.passportNumber")}
              />
              <Input
                id="passportNumber"
                name="passportNumber"
                value={formData.passportNumber}
                onChange={onChange}
                placeholder={t("bookAppointment.passportDetailsStep.enterPassportNumber")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="passportIssueDate">
                {t("bookAppointment.passportDetailsStep.issueDate")}
              </Label>
              <Input
                id="passportIssueDate"
                name="passportIssueDate"
                type="date"
                value={formData.passportIssueDate}
                onChange={onChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="passportExpiryDate">
                {t("bookAppointment.passportDetailsStep.expiryDate")}
              </Label>
              <Input
                id="passportExpiryDate"
                name="passportExpiryDate"
                type="date"
                value={formData.passportExpiryDate}
                onChange={onChange}
              />
            </div>

            {!isAMC && (
              <div className="space-y-2">
                <Label htmlFor="caseNumber">
                  {t("bookAppointment.passportDetailsStep.caseNumber")}
                </Label>
                <Input
                  id="caseNumber"
                  name="caseNumber"
                  value={formData.caseNumber}
                  onChange={onChange}
                  placeholder={t("bookAppointment.passportDetailsStep.enterCaseNumber")}
                />
              </div>
            )}

            {isAMC && (
              <div className="space-y-2">
                <Label htmlFor="caseRef">{t("bookAppointment.passportDetailsStep.caseRef")}</Label>
                <Input
                  id="caseRef"
                  name="caseRef"
                  value={formData.caseRef}
                  onChange={onChange}
                  placeholder={t("bookAppointment.passportDetailsStep.enterCaseRef")}
                />
              </div>
            )}
          </div>
        </div>

        {/* Additional applicants if any */}
        {parseInt(formData.numberOfApplicants) > 1 && (
          <div>
            <h3 className="mb-4 text-lg font-semibold text-slate-900">
              {t("bookAppointment.passportDetailsStep.additionalApplicantsTitle")}
            </h3>
            {formData.applicants.map((applicant, index) => (
              <ApplicantPassportInfo
                key={applicant.id}
                applicant={applicant}
                index={index}
                isAMC={isAMC}
                onChange={onApplicantChange}
              />
            ))}
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex justify-between pt-4">
          <Button
            onClick={onBack}
            variant="outline"
            className="bg-teal-600 text-white hover:bg-teal-700"
          >
            {t("bookAppointment.passportDetailsStep.prevBtn")}
          </Button>
          <Button onClick={onNext} className="bg-teal-600 text-white hover:bg-teal-700">
            {t("bookAppointment.passportDetailsStep.nextBtn")}
          </Button>
        </div>
      </div>
    </div>
  );
};

interface DocumentsStepProps {
  formData: FormData;
  error: string | null;
  onFileChange: (name: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) => void;
  onNext: () => void;
  onBack: () => void;
}

const DocumentsStep = ({ formData, error, onFileChange, onNext, onBack }: DocumentsStepProps) => {
  const { t } = useLanguage();
  return (
    <div className="space-y-6">
      <div className="mb-6 flex items-center gap-2">
        <div className="rounded bg-teal-600 px-3 py-1 font-semibold text-white">
          {t("bookAppointment.documentsStep.badge")}
        </div>
        <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
          {t("bookAppointment.documentsStep.title")}
        </h2>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="surname">{t("bookAppointment.documentsStep.surname")}</label>
            <Input value={formData.surname} disabled className="bg-gray-50" />
          </div>

          <div className="space-y-2">
            <label htmlFor="givenName">{t("bookAppointment.documentsStep.givenName")}</label>
            <Input value={formData.givenName} disabled className="bg-gray-50" />
          </div>
        </div>

        <div className="space-y-2">
          <FieldLabel
            htmlFor="scannedPassport"
            title={t("bookAppointment.documentsStep.scannedPassport")}
          />
          <label
            htmlFor="scannedPassport"
            className="flex h-24 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 text-slate-500 transition-colors hover:border-teal-500 hover:bg-teal-50 hover:text-teal-600"
          >
            <svg className="mb-2 h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
              />
            </svg>
            <span className="text-sm font-medium">
              {t("bookAppointment.documentsStep.clickToChoose")}
            </span>
          </label>
          <Input
            id="scannedPassport"
            name="scannedPassport"
            type="file"
            onChange={onFileChange("scannedPassport")}
            accept=".pdf,.jpg,.jpeg,.png"
            className="hidden"
          />
          {formData.scannedPassport && (
            <p className="flex items-center gap-2 text-sm text-green-600">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                ></path>
              </svg>
              {formData.scannedPassport.name}
            </p>
          )}
          <p className="text-xs text-slate-500">
            {t("bookAppointment.documentsStep.uploadScannedDesc")}
          </p>
        </div>

        <div className="space-y-2">
          <Label>{t("bookAppointment.documentsStep.k1Letter")}</Label>
          <label
            htmlFor="kOneLetter"
            className="flex h-24 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 text-slate-500 transition-colors hover:border-teal-500 hover:bg-teal-50 hover:text-teal-600"
          >
            <svg className="mb-2 h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
              />
            </svg>
            <span className="text-sm font-medium">
              {t("bookAppointment.documentsStep.clickToChoose")}
            </span>
          </label>
          <Input
            id="kOneLetter"
            name="kOneLetter"
            type="file"
            onChange={onFileChange("kOneLetter")}
            accept=".pdf,.jpg,.jpeg,.png"
            className="hidden"
          />
          {formData.kOneLetter && (
            <p className="flex items-center gap-2 text-sm text-green-600">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                ></path>
              </svg>
              {formData.kOneLetter.name}
            </p>
          )}
          <p className="text-xs text-slate-500">
            {t("bookAppointment.documentsStep.uploadK1Desc")}
          </p>
        </div>

        <div className="space-y-2">
          <Label>{t("bookAppointment.documentsStep.appointmentLetter")}</Label>
          <label
            htmlFor="appointmentConfirmationLetter"
            className="flex h-24 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 text-slate-500 transition-colors hover:border-teal-500 hover:bg-teal-50 hover:text-teal-600"
          >
            <svg className="mb-2 h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
              />
            </svg>
            <span className="text-sm font-medium">
              {t("bookAppointment.documentsStep.clickToChoose")}
            </span>
          </label>
          <Input
            id="appointmentConfirmationLetter"
            name="appointmentConfirmationLetter"
            type="file"
            onChange={onFileChange("appointmentConfirmationLetter")}
            accept=".pdf,.jpg,.jpeg,.png"
            className="hidden"
          />
          {formData.appointmentConfirmationLetter && (
            <p className="flex items-center gap-2 text-sm text-green-600">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                ></path>
              </svg>
              {formData.appointmentConfirmationLetter.name}
            </p>
          )}
          <p className="text-xs text-slate-500">
            {t("bookAppointment.documentsStep.uploadAppointmentDesc")}
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex justify-between pt-4">
          <Button
            onClick={onBack}
            variant="outline"
            className="bg-teal-600 text-white hover:bg-teal-700"
          >
            {t("bookAppointment.documentsStep.prevBtn")}
          </Button>
          <Button onClick={onNext} className="bg-teal-600 text-white hover:bg-teal-700">
            {t("bookAppointment.documentsStep.nextBtn")}
          </Button>
        </div>
      </div>
    </div>
  );
};

interface ScheduleStepProps {
  formData: FormData;
  error: string | null;
  loading: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSelectChange: (name: keyof FormData) => (value: string) => void;
  onSubmit: () => void;
  onBack: () => void;
}

const ScheduleStep = ({
  formData,
  error,
  loading,
  onChange,
  onSelectChange,
  onSubmit,
  onBack,
}: ScheduleStepProps) => {
  const { t } = useLanguage();
  return (
    <div className="space-y-6">
      <div className="mb-6 flex items-center gap-2">
        <div className="rounded bg-teal-600 px-3 py-1 font-semibold text-white">
          {t("bookAppointment.scheduleStep.badge")}
        </div>
        <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
          {t("bookAppointment.scheduleStep.title")}
        </h2>
      </div>

      <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
        <p className="text-lg font-semibold">
          {formData.surname}, {formData.givenName}
        </p>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="estimatedCharges">{t("bookAppointment.scheduleStep.estCharges")}</Label>
            <Input
              id="estimatedCharges"
              name="estimatedCharges"
              value={formData.estimatedCharges}
              onChange={onChange}
              placeholder="97,458"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="preferredAppointmentDate">
              {t("bookAppointment.scheduleStep.preferredDate")}
            </Label>
            <Input
              id="preferredAppointmentDate"
              name="preferredAppointmentDate"
              type="date"
              min={getPakistanTomorrow()}
              value={formData.preferredAppointmentDate}
              onChange={onChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="preferredTime">{t("bookAppointment.scheduleStep.time")}</Label>
            <CustomDropdown
              value={formData.preferredTime}
              onChange={onSelectChange("preferredTime")}
              options={[
                { value: "08:00-08:30", label: "08:00 AM - 08:30 AM" },
                { value: "08:30-09:00", label: "08:30 AM - 09:00 AM" },
                { value: "09:00-09:30", label: "09:00 AM - 09:30 AM" },
                { value: "09:30-10:00", label: "09:30 AM - 10:00 AM" },
                { value: "10:00-10:30", label: "10:00 AM - 10:30 AM" },
                { value: "10:30-11:00", label: "10:30 AM - 11:00 AM" },
                { value: "11:00-11:30", label: "11:00 AM - 11:30 AM" },
                { value: "11:30-12:00", label: "11:30 AM - 12:00 PM" },
              ]}
              placeholder={t("bookAppointment.scheduleStep.selectTimeSlot")}
              className="w-full [&_button]:w-full [&_button]:min-w-0"
            />
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex justify-between pt-4">
          <Button
            onClick={onBack}
            variant="outline"
            className="bg-teal-600 text-white hover:bg-teal-700"
          >
            {t("bookAppointment.scheduleStep.prevBtn")}
          </Button>
          <Button
            onClick={onSubmit}
            disabled={loading}
            className="bg-teal-600 text-white hover:bg-teal-700"
          >
            {loading
              ? t("bookAppointment.scheduleStep.submitting")
              : t("bookAppointment.scheduleStep.reviewBtn")}
          </Button>
        </div>
      </div>
    </div>
  );
};

interface ReviewStepProps {
  formData: FormData;
  error: string | null;
  loading: boolean;
  isAMC: boolean;
  isIOM: boolean;
  onSubmit: () => void;
  onBack: () => void;
  formatDate: (dateString: string) => string;
}

const ReviewStep = ({
  formData,
  error,
  loading,
  isAMC,
  isIOM,
  onSubmit,
  onBack,
  formatDate,
}: ReviewStepProps) => {
  const { t } = useLanguage();

  if (isIOM) {
    return (
      <div className="space-y-6">
        <div className="mb-6 flex items-center gap-2">
          <div className="rounded bg-teal-600 px-3 py-1 font-semibold text-white">
            {t("bookAppointment.reviewStep.badge")}
          </div>
          <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
            {t("bookAppointment.reviewStep.title")}
          </h2>
        </div>

        <div className="space-y-6">
          <div className="rounded-lg bg-slate-50 p-4 sm:p-6">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900">
              <svg
                className="h-5 w-5 text-teal-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                ></path>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                ></path>
              </svg>
              {t("bookAppointment.reviewStep.locationSection")}
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-slate-600">
                  {t("bookAppointment.reviewStep.selectedCentre")}
                </p>
                <p className="font-medium capitalize">
                  {formData.location}
                  {formData.location === "islamabad" &&
                    formData.islamabadProvider &&
                    ` - ${formData.islamabadProvider.toUpperCase()}`}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-slate-50 p-4 sm:p-6">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900">
              <svg
                className="h-5 w-5 text-teal-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                ></path>
              </svg>
              {t("bookAppointment.reviewStep.basicInfoSection")}
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-slate-600">{t("bookAppointment.reviewStep.fullName")}</p>
                <p className="font-medium">{formData.fullName}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">
                  {t("bookAppointment.reviewStep.passportNumber")}
                </p>
                <p className="font-medium">{formData.passportNumber}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">
                  {t("bookAppointment.reviewStep.dateOfBirth")}
                </p>
                <p className="font-medium">
                  {formData.dateOfBirth
                    ? formatDate(formData.dateOfBirth)
                    : t("bookAppointment.reviewStep.notSpecified")}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-600">{t("bookAppointment.reviewStep.visaType")}</p>
                <p className="font-medium">{formData.visaType}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">
                  {t("bookAppointment.reviewStep.contactNumber")}
                </p>
                <p className="font-medium">{formatPhoneNumber(formData.contactNumber)}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">{t("bookAppointment.reviewStep.email")}</p>
                <p className="font-medium">{formData.email}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">
                  {t("bookAppointment.reviewStep.preferredLocation")}
                </p>
                <p className="font-medium capitalize">{formData.preferredLocation}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">
                  {t("bookAppointment.reviewStep.destinationCountry")}
                </p>
                <p className="font-medium">{formData.destinationCountry}</p>
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex justify-between pt-4">
            <Button
              onClick={onBack}
              variant="outline"
              className="bg-teal-600 text-white hover:bg-teal-700"
            >
              {t("bookAppointment.reviewStep.backToEditBtn")}
            </Button>
            <Button
              onClick={onSubmit}
              disabled={loading}
              className="bg-teal-600 text-white hover:bg-teal-700"
            >
              {loading
                ? t("bookAppointment.reviewStep.submitting")
                : t("bookAppointment.reviewStep.confirmBtn")}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-6 flex items-center gap-2">
        <div className="rounded bg-teal-600 px-3 py-1 font-semibold text-white">
          {t("bookAppointment.reviewStep.badge")}
        </div>
        <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
          {t("bookAppointment.reviewStep.title")}
        </h2>
      </div>

      <div className="space-y-6">
        <div className="rounded-lg bg-slate-50 p-4 sm:p-6">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900">
            <svg
              className="h-5 w-5 text-teal-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              ></path>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              ></path>
            </svg>
            {t("bookAppointment.reviewStep.locationSection")}
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-slate-600">
                {t("bookAppointment.reviewStep.selectedCentre")}
              </p>
              <p className="font-medium capitalize">
                {formData.location}
                {formData.location === "islamabad" &&
                  formData.islamabadProvider &&
                  ` - ${formData.islamabadProvider.toUpperCase()}`}
                {(formData.location === "karachi" || formData.location === "lahore") &&
                  " - Wilcare Medical"}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-slate-50 p-4 sm:p-6">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900">
            <svg
              className="h-5 w-5 text-teal-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              ></path>
            </svg>
            {t("bookAppointment.reviewStep.basicInfoSection")}
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-slate-600">
                {t("bookAppointment.reviewStep.primaryContact")}
              </p>
              <p className="font-medium">{formatPhoneNumber(formData.primaryContact)}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">{t("bookAppointment.reviewStep.email")}</p>
              <p className="font-medium">{formData.email}</p>
            </div>
            {formData.interviewDate && (
              <div>
                <p className="text-sm text-slate-600">
                  {t("bookAppointment.reviewStep.interviewDate")}
                </p>
                <p className="font-medium">{formatDate(formData.interviewDate)}</p>
              </div>
            )}
            {formData.visaCategory && (
              <div>
                <p className="text-sm text-slate-600">
                  {t("bookAppointment.reviewStep.visaCategory")}
                </p>
                <p className="font-medium">{formData.visaCategory}</p>
              </div>
            )}
            {formData.appointmentType && (
              <div>
                <p className="text-sm text-slate-600">
                  {t("bookAppointment.reviewStep.appointmentType")}
                </p>
                <p className="font-medium">{formData.appointmentType}</p>
              </div>
            )}
            {formData.visaType && (
              <div>
                <p className="text-sm text-slate-600">{t("bookAppointment.reviewStep.visaType")}</p>
                <p className="font-medium">{formData.visaType}</p>
              </div>
            )}
            {/* IOM specific fields */}
            {isIOM && (
              <>
                <div>
                  <p className="text-sm text-slate-600">
                    {t("bookAppointment.reviewStep.fullName")}
                  </p>
                  <p className="font-medium">{formData.fullName}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">
                    {t("bookAppointment.reviewStep.contactNumber")}
                  </p>
                  <p className="font-medium">{formatPhoneNumber(formData.contactNumber)}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">
                    {t("bookAppointment.reviewStep.preferredLocation")}
                  </p>
                  <p className="font-medium">{formData.preferredLocation}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">
                    {t("bookAppointment.reviewStep.destinationCountry")}
                  </p>
                  <p className="font-medium">{formData.destinationCountry}</p>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="rounded-lg bg-slate-50 p-4 sm:p-6">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900">
            <svg
              className="h-5 w-5 text-teal-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"
              ></path>
            </svg>
            {t("bookAppointment.reviewStep.personalInfoSection")}
          </h3>
          <div className="space-y-6">
            {/* Primary applicant */}
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <h4 className="mb-3 font-semibold text-slate-900">
                {t("bookAppointment.reviewStep.primaryApplicant")}
              </h4>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-slate-600">
                    {t("bookAppointment.reviewStep.surname")}
                  </p>
                  <p className="font-medium">{formData.surname}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">
                    {t("bookAppointment.reviewStep.givenName")}
                  </p>
                  <p className="font-medium">{formData.givenName}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">{t("bookAppointment.reviewStep.gender")}</p>
                  <p className="font-medium">{formData.gender}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">
                    {t("bookAppointment.reviewStep.dateOfBirth")}
                  </p>
                  <p className="font-medium">
                    {formData.dateOfBirth
                      ? formatDate(formData.dateOfBirth)
                      : t("bookAppointment.reviewStep.notSpecified")}
                  </p>
                </div>
              </div>
            </div>

            {/* Additional applicants if any */}
            {parseInt(formData.numberOfApplicants) > 1 && formData.applicants.length > 0 && (
              <div>
                <h4 className="mb-3 font-semibold text-slate-900">
                  {t("bookAppointment.reviewStep.additionalApplicants")}
                </h4>
                {formData.applicants.map((applicant, index) => (
                  <div
                    key={applicant.id}
                    className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-4"
                  >
                    <h5 className="mb-2 font-semibold text-slate-900">Applicant {index + 1}</h5>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <p className="text-sm text-slate-600">
                          {t("bookAppointment.reviewStep.surname")}
                        </p>
                        <p className="font-medium">{applicant.surname}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600">
                          {t("bookAppointment.reviewStep.givenName")}
                        </p>
                        <p className="font-medium">{applicant.givenName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600">
                          {t("bookAppointment.reviewStep.gender")}
                        </p>
                        <p className="font-medium">{applicant.gender}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600">
                          {t("bookAppointment.reviewStep.dob")}
                        </p>
                        <p className="font-medium">
                          {applicant.dateOfBirth
                            ? formatDate(applicant.dateOfBirth)
                            : t("bookAppointment.reviewStep.notSpecified")}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-lg bg-slate-50 p-4 sm:p-6">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900">
            <svg
              className="h-5 w-5 text-teal-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              ></path>
            </svg>
            {t("bookAppointment.reviewStep.passportDetailsSection")}
          </h3>
          <div className="space-y-6">
            {/* Primary applicant */}
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <h4 className="mb-3 font-semibold text-slate-900">
                {t("bookAppointment.reviewStep.primaryApplicant")}
              </h4>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-slate-600">
                    {t("bookAppointment.reviewStep.passportNumber")}
                  </p>
                  <p className="font-medium">{formData.passportNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">
                    {t("bookAppointment.reviewStep.issueDate")}
                  </p>
                  <p className="font-medium">
                    {formData.passportIssueDate
                      ? formatDate(formData.passportIssueDate)
                      : t("bookAppointment.reviewStep.notSpecified")}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">
                    {t("bookAppointment.reviewStep.expiryDate")}
                  </p>
                  <p className="font-medium">
                    {formData.passportExpiryDate
                      ? formatDate(formData.passportExpiryDate)
                      : t("bookAppointment.reviewStep.notSpecified")}
                  </p>
                </div>
                {formData.caseNumber && (
                  <div>
                    <p className="text-sm text-slate-600">
                      {t("bookAppointment.reviewStep.caseNumber")}
                    </p>
                    <p className="font-medium">{formData.caseNumber}</p>
                  </div>
                )}
                {isAMC && formData.caseRef && (
                  <div>
                    <p className="text-sm text-slate-600">
                      {t("bookAppointment.reviewStep.caseRef")}
                    </p>
                    <p className="font-medium">{formData.caseRef}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Additional applicants if any */}
            {parseInt(formData.numberOfApplicants) > 1 && formData.applicants.length > 0 && (
              <div>
                <h4 className="mb-3 font-semibold text-slate-900">
                  {t("bookAppointment.reviewStep.additionalApplicants")}
                </h4>
                {formData.applicants.map((applicant, index) => (
                  <div
                    key={applicant.id}
                    className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-4"
                  >
                    <h5 className="mb-2 font-semibold text-slate-900">Applicant {index + 1}</h5>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <p className="text-sm text-slate-600">
                          {t("bookAppointment.reviewStep.passportNumber")}
                        </p>
                        <p className="font-medium">{applicant.passportNumber}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600">
                          {t("bookAppointment.reviewStep.issueDate")}
                        </p>
                        <p className="font-medium">
                          {applicant.passportIssueDate
                            ? formatDate(applicant.passportIssueDate)
                            : t("bookAppointment.reviewStep.notSpecified")}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600">
                          {t("bookAppointment.reviewStep.expiryDate")}
                        </p>
                        <p className="font-medium">
                          {applicant.passportExpiryDate
                            ? formatDate(applicant.passportExpiryDate)
                            : t("bookAppointment.reviewStep.notSpecified")}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600">
                          {t("bookAppointment.reviewStep.caseNumber")}
                        </p>
                        <p className="font-medium">{applicant.caseNumber}</p>
                      </div>
                      {isAMC && (
                        <div>
                          <p className="text-sm text-slate-600">
                            {t("bookAppointment.reviewStep.caseRef")}
                          </p>
                          <p className="font-medium">{applicant.caseRef}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-lg bg-slate-50 p-4 sm:p-6">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900">
            <svg
              className="h-5 w-5 text-teal-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
              ></path>
            </svg>
            {t("bookAppointment.reviewStep.uploadedDocsSection")}
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded border bg-white p-3">
              <span className="text-sm text-slate-600">
                {t("bookAppointment.reviewStep.scannedPassport")}
              </span>
              <span className="text-sm font-medium text-green-600">
                {formData.scannedPassport
                  ? formData.scannedPassport.name
                  : t("bookAppointment.reviewStep.notUploaded")}
              </span>
            </div>
            <div className="flex items-center justify-between rounded border bg-white p-3">
              <span className="text-sm text-slate-600">
                {t("bookAppointment.reviewStep.k1Letter")}
              </span>
              <span className="text-sm font-medium text-green-600">
                {formData.kOneLetter
                  ? formData.kOneLetter.name
                  : t("bookAppointment.reviewStep.notUploaded")}
              </span>
            </div>
            <div className="flex items-center justify-between rounded border bg-white p-3">
              <span className="text-sm text-slate-600">
                {t("bookAppointment.reviewStep.appointmentConfirmation")}
              </span>
              <span className="text-sm font-medium text-green-600">
                {formData.appointmentConfirmationLetter
                  ? formData.appointmentConfirmationLetter.name
                  : t("bookAppointment.reviewStep.notUploaded")}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-slate-50 p-4 sm:p-6">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900">
            <svg
              className="h-5 w-5 text-teal-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              ></path>
            </svg>
            {t("bookAppointment.reviewStep.appointmentScheduleSection")}
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {formData.estimatedCharges && (
              <div>
                <p className="text-sm text-slate-600">
                  {t("bookAppointment.reviewStep.estimatedCharges")}
                </p>
                <p className="font-medium">{formData.estimatedCharges}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-slate-600">
                {t("bookAppointment.reviewStep.preferredDate")}
              </p>
              <p className="font-medium">
                {formData.preferredAppointmentDate
                  ? formatDate(formData.preferredAppointmentDate)
                  : t("bookAppointment.reviewStep.notSpecified")}
              </p>
            </div>
            <div className="col-span-2">
              <p className="text-sm text-slate-600">{t("bookAppointment.reviewStep.timeSlot")}</p>
              <p className="font-medium">
                {formData.preferredTime || t("bookAppointment.reviewStep.notSpecified")}
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex justify-between pt-4">
          <Button
            onClick={onBack}
            variant="outline"
            className="bg-teal-600 text-white hover:bg-teal-700"
          >
            {t("bookAppointment.reviewStep.backToEditBtn")}
          </Button>
          <Button
            onClick={onSubmit}
            disabled={loading}
            className="bg-teal-600 text-white hover:bg-teal-700"
          >
            {loading
              ? t("bookAppointment.reviewStep.submitting")
              : t("bookAppointment.reviewStep.confirmBtn")}
          </Button>
        </div>
      </div>
    </div>
  );
};
interface CheckoutStepProps {
  formData: FormData;
  error: string | null;
  loading: boolean;
  walletBalance: number | null;
  walletLoading: boolean;
  onTopup: (amount: number) => void;
  isAMC: boolean;
  isIOM: boolean;
  onBack: () => void;
  onSubmit: (e: React.FormEvent) => void;
  formatDate: (dateString: string) => string;
}

const CheckoutStep = ({
  formData,
  error,
  loading,
  walletBalance,
  walletLoading,
  onTopup,
  isAMC,
  isIOM,
  onBack,
  onSubmit,
  formatDate,
}: CheckoutStepProps) => {
  const costCredits = 5;
  const hasWalletCredits = walletBalance !== null && walletBalance >= costCredits;
  const deficit = Math.max(costCredits, costCredits - (walletBalance ?? 0));

  return (
    <div className="space-y-6">
      <div className="mb-6 flex items-center gap-2">
        <div className="rounded bg-teal-600 px-3 py-1 font-semibold text-white">Checkout</div>
        <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">Payment &amp; Confirmation</h2>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-5">
        {/* Left column: Booking summary */}
        <div className="space-y-4 md:col-span-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <h4 className="text-xs font-bold tracking-tight text-slate-400 uppercase">
              Booking Summary
            </h4>
            <div className="mt-3 space-y-2">
              {isAMC && (
                <p className="text-sm font-semibold text-slate-800">
                  {formData.surname}, {formData.givenName}
                </p>
              )}
              <p className="text-xs text-slate-500">
                Center:{" "}
                <span className="font-medium text-slate-700 capitalize">{formData.location}</span>
                {formData.location === "islamabad" && formData.islamabadProvider && (
                  <>
                    {" "}
                    -{" "}
                    <span className="font-medium text-slate-700 uppercase">
                      {formData.islamabadProvider}
                    </span>
                  </>
                )}
              </p>
              {formData.preferredAppointmentDate && (
                <p className="text-xs text-slate-500">
                  Preferred Date:{" "}
                  <span className="font-medium text-slate-700">
                    {formatDate(formData.preferredAppointmentDate)}
                  </span>
                </p>
              )}
              {formData.preferredTime && (
                <p className="text-xs text-slate-500">
                  Preferred Time:{" "}
                  <span className="font-medium text-slate-700">{formData.preferredTime}</span>
                </p>
              )}
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-2xl border border-slate-200/60 bg-slate-50 p-5">
            <CreditCard className="mt-0.5 h-5 w-5 flex-shrink-0 text-teal-600" />
            <div>
              <h5 className="text-xs font-bold tracking-wide text-slate-900 uppercase">
                Secure Transaction
              </h5>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">
                Standalone bookings are paid with your Rahvana Wallet jarthings ($1 = 1 jarthing).
                If your balance is short, you can top up instantly via Stripe.
              </p>
            </div>
          </div>
        </div>

        {/* Right column: Cart breakdown */}
        <div className="md:col-span-2">
          <div className="flex h-full flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50/55 p-6">
            <div>
              <h4 className="mb-4 flex items-center gap-2 border-b pb-2 text-sm font-bold tracking-wider text-slate-900 uppercase">
                <ShoppingBag className="h-4 w-4 text-teal-600" />
                Price Breakdown
              </h4>

              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-600">1x Medical Exam Booking</span>
                  <span className="font-bold text-slate-800">5 Jarthings ($5.00)</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-600">Wallet Balance</span>
                  <span className="font-bold text-slate-800">
                    {walletLoading ? "..." : `${walletBalance ?? 0} Jarthings`}
                  </span>
                </div>
                {hasWalletCredits && (
                  <div className="flex items-center justify-between text-sm text-[#0d7377]">
                    <span className="font-medium">Balance After Booking</span>
                    <span className="font-bold">
                      {(walletBalance ?? 5) - costCredits} Jarthings
                    </span>
                  </div>
                )}

                <div className="mt-2 flex items-center justify-between border-t border-slate-200 pt-4">
                  <span className="text-base font-bold text-slate-900">Total Due</span>
                  <span className="text-xl font-black text-slate-900">5 Jarthings ($5.00)</span>
                </div>
              </div>
            </div>

            {error && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="mt-6 flex justify-between border-t border-slate-200 pt-6">
              <Button
                onClick={onBack}
                variant="outline"
                className="bg-teal-600 text-white hover:bg-teal-700"
              >
                Back
              </Button>
              <Button
                onClick={hasWalletCredits ? onSubmit : () => onTopup(deficit)}
                disabled={loading}
                className="bg-teal-600 text-white hover:bg-teal-700"
              >
                {loading
                  ? "Processing..."
                  : hasWalletCredits
                    ? "Pay 5 Jarthings & Confirm"
                    : `Top up ${deficit} Jarthings to Book`}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface SuccessStepProps {
  onReset: () => void;
}

const SuccessStep = ({ onReset }: SuccessStepProps) => {
  const { t } = useLanguage();
  return (
    <div className="py-12 text-center">
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
        <svg
          className="h-10 w-10 text-green-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M5 13l4 4L19 7"
          ></path>
        </svg>
      </div>
      <h2 className="mb-4 text-xl font-bold text-slate-900 sm:text-2xl">
        {t("bookAppointment.successStep.title")}
      </h2>
      <p className="mb-8 text-slate-600">{t("bookAppointment.successStep.desc")}</p>
      <div className="flex justify-center gap-4">
        <Button onClick={onReset} className="bg-teal-600 text-white hover:bg-teal-700">
          {t("bookAppointment.successStep.bookAnotherBtn")}
        </Button>
      </div>
    </div>
  );
};

export default function MedicalAppointmentTool({
  isOpen = true,
  onClose,
  onSave,
  initialData,
  existingRequests,
  locked,
  lockHint,
  statusLoading,
  embedded,
  mode: propMode,
  journeyContext: propContext,
  journeyTier: propJourneyTier,
}: MedicalAppointmentToolProps) {
  // 1) Mode resolution
  const { isJourney, journeyContext, journeyTier } = useResolveToolMode({
    mode: propMode,
    journeyContext: propContext,
    journeyTier: propJourneyTier,
  });

  // Effective tier — only evaluated for journey mode
  const rawJourneyTier = propJourneyTier ?? journeyTier ?? journeyContext?.subscriptionTier;
  const journeyTierEffective: PlanTier | null =
    isJourney && rawJourneyTier ? normalizePlanTier(rawJourneyTier) : null;
  void journeyTierEffective;
  const [step, setStep] = useState(1);
  // Journey-only intro gate: the overlay first shows a "what is this service" screen
  // (no topbar progress) and only reveals the booking wizard once the user clicks Start.
  const [started, setStarted] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    location: "",
    islamabadProvider: "",
    primaryContact: "",
    contactNumber: "",
    email: "",
    appointmentType: "",
    visaType: "",
    originalPassport: "",
    medicalType: "",
    surname: "",
    givenName: "",
    fullName: "",
    gender: "",
    dateOfBirth: "",
    passportNumber: "",
    passportIssueDate: "",
    passportExpiryDate: "",
    caseNumber: "",
    preferredLocation: "",
    destinationCountry: "United States",
    scannedPassport: null,
    kOneLetter: null,
    appointmentConfirmationLetter: null,
    estimatedCharges: "",
    preferredAppointmentDate: "",
    preferredTime: "",
    interviewDate: "",
    visaCategory: "",
    hadMedicalBefore: "",
    city: "",
    caseRef: "",
    numberOfApplicants: "",
    applicants: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const { user } = useAuth();
  const { activeCandidate, activeCandidateId, isMultiCandidate, candidates } = useCandidate();
  // Who this booking is for. In a journey it is the journey's own beneficiary (fixed).
  // On the standalone page the user picks a beneficiary or "Someone else" (null = follow
  // the active beneficiary).
  const [bookingFor, setBookingFor] = useState<string | null>(null);
  const subjectId = isJourney ? activeCandidateId : (bookingFor ?? activeCandidateId);
  const isSomeoneElse = !isJourney && subjectId === SOMEONE_ELSE_ID;
  const subject = isJourney
    ? activeCandidate
    : isSomeoneElse
      ? null
      : (candidates.find((c) => c.id === subjectId) ?? activeCandidate);
  const { t } = useLanguage();
  const { profile, isProfileLoading, updateProfile } = useUserProfile();
  const wallet = useWallet();
  // Standalone draft whose payment failed: a retry pays for this same booking
  // (never a second one). Cleared once paid or when the user goes back to edit.
  const pendingDraftRef = useRef<string | null>(null);

  const saveProgressToProfile = (currentFormData = formData) => {
    // A booking for someone else must never overwrite the account holder's profile.
    if (!user || isSomeoneElse) return;
    try {
      const cleanData: Record<string, unknown> = {
        primaryContact: currentFormData.primaryContact,
        contactNumber: currentFormData.contactNumber,
        email: currentFormData.email,
        surname: currentFormData.surname,
        givenName: currentFormData.givenName,
        fullName: currentFormData.fullName,
        gender: currentFormData.gender,
        dateOfBirth: currentFormData.dateOfBirth,
        passportNumber: currentFormData.passportNumber,
        passportExpiryDate: currentFormData.passportExpiryDate,
        passportIssueDate: currentFormData.passportIssueDate,
        caseNumber: currentFormData.caseNumber || currentFormData.caseRef,
        destinationCountry: currentFormData.destinationCountry,
        interviewDate: currentFormData.interviewDate,
        visaCategory: currentFormData.visaCategory || currentFormData.visaType,
      };

      const profileUpdate = mapFormToProfile(cleanData);
      updateProfile(profileUpdate, { silent: true });
    } catch (err) {
      console.error("Error saving progress to profile:", err);
    }
  };

  // Auto-fill profile data (prioritizing the chosen beneficiary's biographics)
  useEffect(() => {
    if (isProfileLoading || !profile) return;

    // Map profile data to form structure
    const mappedData = mapProfileToGenericForm(profile, {
      primaryContact: formData.primaryContact,
      contactNumber: formData.contactNumber,
      email: formData.email,
      surname: formData.surname,
      givenName: formData.givenName,
      fullName: formData.fullName,
      gender: formData.gender,
      dateOfBirth: formData.dateOfBirth,
      passportNumber: formData.passportNumber,
      passportExpiryDate: formData.passportExpiryDate,
      passportIssueDate: formData.passportIssueDate,
      caseNumber: formData.caseNumber,
      destinationCountry: formData.destinationCountry,
      interviewDate: formData.interviewDate,
      visaCategory: formData.visaCategory || formData.visaType,
    });

    // Someone else: keep only the account holder's contact details (they manage the booking).
    if (isSomeoneElse || !subject) {
      setFormData((prev) => ({
        ...prev,
        primaryContact: prev.primaryContact || String(mappedData.primaryContact || ""),
        contactNumber: prev.contactNumber || String(mappedData.contactNumber || ""),
        email: prev.email || String(mappedData.email || ""),
      }));
      setProfileLoaded(true);
      return;
    }

    const givenName =
      subject.name?.first ||
      (subject.fullName ? subject.fullName.split(" ")[0] : mappedData.givenName || "");
    const surname =
      subject.name?.last ||
      (subject.fullName
        ? subject.fullName.split(" ").slice(1).join(" ")
        : mappedData.surname || "");
    const fullName =
      subject.fullName ||
      (mappedData.givenName && mappedData.surname
        ? `${mappedData.givenName} ${mappedData.surname}`.trim()
        : mappedData.fullName || "");
    const passportNumber = subject.passportNumber || mappedData.passportNumber || "";
    const dateOfBirth = subject.dateOfBirth || mappedData.dateOfBirth || "";
    const caseNumber = subject.caseNumber || mappedData.caseNumber || "";
    const visaCategory =
      subject.visaCategory || mappedData.visaCategory || mappedData.visaType || "IR-5";

    setFormData((prev) => ({
      ...prev,
      ...mappedData,
      givenName: prev.givenName || givenName,
      surname: prev.surname || surname,
      fullName: prev.fullName || fullName,
      passportNumber: prev.passportNumber || passportNumber,
      dateOfBirth: prev.dateOfBirth || dateOfBirth,
      caseNumber: prev.caseNumber || caseNumber,
      visaType: prev.visaType || visaCategory,
      visaCategory: prev.visaCategory || visaCategory,
    }));
    setProfileLoaded(true);
  }, [profile, isProfileLoading, subject, isSomeoneElse]);

  // Standalone "Booking for" change (step 1 only): clear the previous person's details so
  // the next person's are filled in fresh and two people's data can never mix.
  const changeBookingFor = (id: string) => {
    if (isJourney || id === subjectId) return;
    pendingDraftRef.current = null;
    setError(null);
    setFormData((prev) => ({
      ...prev,
      surname: "",
      givenName: "",
      fullName: "",
      gender: "",
      dateOfBirth: "",
      passportNumber: "",
      passportIssueDate: "",
      passportExpiryDate: "",
      caseNumber: "",
      caseRef: "",
      visaType: "",
      visaCategory: "",
    }));
    setBookingFor(id);
  };

  const isAMC = formData.location === "islamabad" && formData.islamabadProvider === "amc";
  const isIOM = formData.location === "islamabad" && formData.islamabadProvider === "iom";
  const isWilcare = formData.location === "karachi" || formData.location === "lahore";

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (error) setError(null);
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: keyof FormData) => (value: string) => {
    if (error) setError(null);
    setFormData((prev) => {
      const updatedData = { ...prev, [name]: value };

      // If the number of applicants changes, update the applicants array
      if (name === "numberOfApplicants") {
        const numApplicants = parseInt(value) || 0;
        // Number of additional applicants (excluding primary)
        const numAdditional = numApplicants - 1;
        const currentApplicants = prev.applicants || [];

        // If increasing number of applicants, add new empty applicant objects
        if (numAdditional > currentApplicants.length) {
          const newApplicants = [...currentApplicants];
          for (let i = currentApplicants.length; i < numAdditional; i++) {
            newApplicants.push({
              id: `applicant-${i + 1}`,
              surname: "",
              givenName: "",
              gender: "",
              dateOfBirth: "",
              passportNumber: "",
              passportIssueDate: "",
              passportExpiryDate: "",
              caseNumber: "",
              caseRef: "",
            });
          }
          updatedData.applicants = newApplicants;
        }
        // If decreasing number of applicants, remove the extra ones
        else if (numAdditional < currentApplicants.length) {
          updatedData.applicants = currentApplicants.slice(0, numAdditional);
        }
        // If numAdditional is 0 (only primary applicant), clear the array
        else if (numAdditional === 0) {
          updatedData.applicants = [];
        }
      }

      return updatedData;
    });
  };

  const handleFileChange = (name: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData((prev) => ({ ...prev, [name]: file }));
  };

  const handleApplicantChange = (index: number, field: keyof Applicant, value: string) => {
    if (error) setError(null);
    setFormData((prev) => {
      const updatedApplicants = [...prev.applicants];
      updatedApplicants[index] = {
        ...updatedApplicants[index],
        [field]: value,
      };
      return {
        ...prev,
        applicants: updatedApplicants,
      };
    });
  };

  const handleLocationChange = (location: Location) => {
    if (error) setError(null);
    setFormData((prev) => ({ ...prev, location, islamabadProvider: "" }));
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    return `${date.getDate()}-${months[date.getMonth()]}-${date.getFullYear()}`;
  };

  const handleNextStep = () => {
    saveProgressToProfile();
    if (step === 1) {
      if (!formData.location) {
        setError(t("bookAppointment.validation.reqLocation"));
        return;
      }
      if (formData.location === "islamabad" && !formData.islamabadProvider) {
        setError(t("bookAppointment.validation.reqProvider"));
        return;
      }
      setError(null);
      if (isIOM) {
        setFormData((prev) => ({
          ...prev,
          destinationCountry: prev.destinationCountry || "United States",
          preferredLocation: prev.preferredLocation || prev.location || "islamabad",
          fullName: prev.fullName || `${prev.givenName || ""} ${prev.surname || ""}`.trim(),
          visaType: prev.visaType || "Immigrant Visa",
        }));
        setStep(9);
        return;
      }
      setStep(2);
      return;
    }

    if (step === 2) {
      if (isAMC) {
        if (
          !formData.interviewDate ||
          !formData.visaCategory ||
          !formData.primaryContact ||
          !formData.email
        ) {
          setError(t("bookAppointment.validation.reqAllProviderFields"));
          return;
        }
      } else if (isWilcare) {
        if (!formData.primaryContact || !formData.email) {
          setError(t("bookAppointment.validation.reqPrimaryContactEmail"));
          return;
        }
      }
      setError(null);
      setStep(3);
      return;
    }

    if (step === 3) {
      const today = new Date().toISOString().split("T")[0];
      // Validate primary applicant
      if (!formData.surname || !formData.givenName || !formData.gender || !formData.dateOfBirth) {
        setError(t("bookAppointment.validation.reqPrimaryApplicantFields"));
        return;
      }

      if (formData.dateOfBirth > today) {
        setError(t("bookAppointment.validation.dobFuture"));
        return;
      }

      // Validate additional applicants if any
      if (parseInt(formData.numberOfApplicants) > 1) {
        for (let i = 0; i < formData.applicants.length; i++) {
          const applicant = formData.applicants[i];
          if (
            !applicant.surname ||
            !applicant.givenName ||
            !applicant.gender ||
            !applicant.dateOfBirth
          ) {
            setError(
              t("bookAppointment.validation.reqApplicantIndexFields").replace(
                "{index}",
                (i + 1).toString()
              )
            );
            return;
          }

          if (applicant.dateOfBirth > today) {
            setError(
              t("bookAppointment.validation.dobApplicantFuture").replace(
                "{index}",
                (i + 1).toString()
              )
            );
            return;
          }
        }
      }

      setError(null);
      setStep(4);
      return;
    }

    if (step === 4) {
      // Validate primary applicant
      if (!formData.passportNumber) {
        setError(t("bookAppointment.validation.reqPrimaryPassportNumber"));
        return;
      }

      // Validate additional applicants if any
      if (parseInt(formData.numberOfApplicants) > 1) {
        for (let i = 0; i < formData.applicants.length; i++) {
          const applicant = formData.applicants[i];
          if (!applicant.passportNumber) {
            setError(
              t("bookAppointment.validation.reqApplicantPassportNumber").replace(
                "{index}",
                (i + 1).toString()
              )
            );
            return;
          }

          // For AMC, also validate caseRef
          if (isAMC && !applicant.caseRef) {
            setError(
              t("bookAppointment.validation.reqApplicantCaseRef").replace(
                "{index}",
                (i + 1).toString()
              )
            );
            return;
          }
        }
      }

      setError(null);
      // Go to document upload step for all providers
      setStep(5);
      return;
    }

    if (step === 5) {
      // Document upload step for all providers
      setError(null);
      setStep(6);
      return;
    }

    if (step === 6) {
      setError(null);
      setStep(7);
      return;
    }

    if (step === 7) {
      setError(null);
      // Journey mode has no payment/checkout step — finalize the request directly
      // (standalone continues to the $5 checkout at step 8).
      if (isJourney) {
        void handleFinalSubmit();
        return;
      }
      setStep(8);
      return;
    }

    if (step === 9) {
      // IOM Info step
      const today = new Date().toISOString().split("T")[0];
      const fullName =
        formData.fullName?.trim() || `${formData.givenName || ""} ${formData.surname || ""}`.trim();
      const destinationCountry = formData.destinationCountry?.trim() || "United States";
      const preferredLocation =
        formData.preferredLocation?.trim() || formData.location?.trim() || "islamabad";
      const visaType =
        formData.visaType?.trim() || formData.visaCategory?.trim() || "Immigrant Visa";
      const contactNumber = formData.contactNumber?.trim() || formData.primaryContact?.trim() || "";

      if (
        !fullName ||
        !formData.passportNumber?.trim() ||
        !formData.dateOfBirth?.trim() ||
        !visaType ||
        !contactNumber ||
        !formData.email?.trim() ||
        !preferredLocation ||
        !destinationCountry
      ) {
        setError(t("bookAppointment.validation.reqIomFields"));
        return;
      }

      if (formData.dateOfBirth > today) {
        setError(t("bookAppointment.validation.dobFuture"));
        return;
      }

      const nameParts = fullName.split(" ");
      const givenName = formData.givenName?.trim() || nameParts[0] || fullName;
      const surname =
        formData.surname?.trim() || nameParts.slice(1).join(" ") || nameParts[0] || fullName;

      setFormData((prev) => ({
        ...prev,
        fullName,
        givenName,
        surname,
        destinationCountry,
        preferredLocation,
        visaType,
        contactNumber,
        primaryContact: prev.primaryContact || contactNumber,
      }));

      setError(null);
      setStep(7); // Go to review step
      return;
    }
  };

  const handleFinalSubmit = async () => {
    saveProgressToProfile();
    setLoading(true);
    setError(null);

    try {
      // Standalone: check the balance before creating anything, so a short balance
      // leaves no hidden draft (or uploaded passport) behind.
      if (!isJourney && (wallet.balance === null || wallet.balance < 5)) {
        const deficit = Math.max(5, 5 - (wallet.balance ?? 0));
        wallet.openTopup({ amount: deficit });
        setError(
          `You need 5 jarthings for this booking (Balance: ${wallet.balance ?? 0} jarthings). Please top up to proceed.`
        );
        return;
      }

      let appointmentId = pendingDraftRef.current;
      if (!appointmentId) {
        // First, submit appointment data to API to get the appointment ID
        const appointmentResponse = await fetch("/api/book-appointment", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...formData,
            candidate_id: subjectId || "candidate-1",
            candidate_name:
              subject?.fullName ||
              subject?.label ||
              formData.fullName ||
              `${formData.givenName} ${formData.surname}`.trim(),
            // Origin tag: journey-embedded bookings are kept out of standalone My Resources.
            ...(isJourney
              ? {
                  source: "journey",
                  journey_slug: journeyContext?.journeySlug || null,
                  journey_id: journeyContext?.backendId || null,
                  journey_category: journeyContext?.journeyCategory || null,
                }
              : { source: "standalone" }),
            // Exclude file objects from the initial request
            scannedPassport: undefined,
            kOneLetter: undefined,
            appointmentConfirmationLetter: undefined,
            // Send applicants data separately to prevent circular references
            applicants: formData.applicants,
          }),
        });

        const appointmentResult = await appointmentResponse.json();

        if (!appointmentResponse.ok) {
          throw new Error(appointmentResult.error || t("bookAppointment.validation.submitError"));
        }

        appointmentId = appointmentResult.id as string;
        console.log("Appointment created successfully:", appointmentResult);

        // Then upload documents separately if they exist
        const uploadPromises = [];

        if (formData.scannedPassport) {
          const formDataUpload = new FormData();
          formDataUpload.append("appointmentId", appointmentId);
          formDataUpload.append("fileType", "scannedPassport");
          formDataUpload.append("file", formData.scannedPassport);

          uploadPromises.push(
            fetch("/api/upload", {
              method: "POST",
              body: formDataUpload,
            })
          );
        }

        if (formData.kOneLetter) {
          const formDataUpload = new FormData();
          formDataUpload.append("appointmentId", appointmentId);
          formDataUpload.append("fileType", "kOneLetter");
          formDataUpload.append("file", formData.kOneLetter);

          uploadPromises.push(
            fetch("/api/upload", {
              method: "POST",
              body: formDataUpload,
            })
          );
        }

        if (formData.appointmentConfirmationLetter) {
          const formDataUpload = new FormData();
          formDataUpload.append("appointmentId", appointmentId);
          formDataUpload.append("fileType", "appointmentConfirmationLetter");
          formDataUpload.append("file", formData.appointmentConfirmationLetter);

          uploadPromises.push(
            fetch("/api/upload", {
              method: "POST",
              body: formDataUpload,
            })
          );
        }

        // Wait for all document uploads to complete
        if (uploadPromises.length > 0) {
          const uploadResults = await Promise.all(uploadPromises);
          const uploadErrors = uploadResults.filter((res) => !res.ok);

          if (uploadErrors.length > 0) {
            const errorText = await uploadErrors[0].text();
            throw new Error(errorText || t("bookAppointment.validation.uploadError"));
          }
        }
        if (!isJourney) pendingDraftRef.current = appointmentId;
      }

      // 3) MODE BRANCH at the credit gate.
      if (isJourney) {
        // NO credits, NO Stripe. Access was already gated by the journey;
        // finalize the request for the journey.
        onSave?.({
          referenceId: appointmentId,
          referenceDate: formData.preferredAppointmentDate,
          location: formData.location,
          status: "requested",
          timeSlot: formData.preferredTime,
        });
        setStep(10); // success step
        return;
      }

      // Standalone mode: deduct 5 credits for this booking (charged at most once).
      const deductResult = await wallet.deductServiceBooking(
        "book-medical-appointment",
        appointmentId
      );

      if (deductResult.body.success) {
        pendingDraftRef.current = null;
        setStep(10); // success step
        return;
      }

      if (deductResult.status === 402) {
        const deficit = deductResult.body.deficit ?? 5;
        wallet.openTopup({ amount: deductResult.body.topupAmount ?? deficit });
        setError(
          `Insufficient jarthings. Please top up ${deficit} jarthings to complete your booking.`
        );
        return;
      }

      console.error("Credit deduction failed:", deductResult.body.error);
      setError(serviceBookingErrorMessage(deductResult.body.error));
    } catch (err: unknown) {
      console.error("Error submitting appointment:", err);
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage || "An error occurred while submitting your appointment");
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    // Editing after a failed payment books a fresh request with the new details.
    pendingDraftRef.current = null;
    if (step === 9) {
      setStep(1);
    } else if (step > 1) {
      // Updated to reflect new step structure (document upload step restored)
      if (step === 7) {
        // Going back from review step to schedule step (or IOM step if IOM)
        if (isIOM) {
          setStep(9);
        } else {
          setStep(6);
        }
      } else if (step === 8) {
        // Going back from checkout step to review step
        setStep(7);
      } else if (step === 6) {
        // Going back from schedule step to document upload step
        setStep(5);
      } else {
        setStep(step - 1);
      }
      setError(null);
    }
  };

  const handleReset = () => {
    setStep(1);
    setFormData({
      location: "",
      islamabadProvider: "",
      primaryContact: "",
      contactNumber: "",
      email: "",
      appointmentType: "",
      visaType: "",
      originalPassport: "",
      medicalType: "",
      surname: "",
      givenName: "",
      fullName: "",
      gender: "",
      dateOfBirth: "",
      passportNumber: "",
      passportIssueDate: "",
      passportExpiryDate: "",
      caseNumber: "",
      preferredLocation: "",
      destinationCountry: "United States",
      scannedPassport: null,
      kOneLetter: null,
      appointmentConfirmationLetter: null,
      estimatedCharges: "",
      preferredAppointmentDate: "",
      preferredTime: "",
      interviewDate: "",
      visaCategory: "",
      hadMedicalBefore: "",
      city: "",
      caseRef: "",
      numberOfApplicants: "",
      applicants: [],
    });
    setError(null);
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <LocationStep
            formData={formData}
            error={error}
            onLocationChange={handleLocationChange}
            onProviderChange={handleSelectChange("islamabadProvider")}
            onNext={handleNextStep}
          />
        );
      case 2:
        return (
          <BasicInfoStep
            formData={formData}
            error={error}
            isAMC={isAMC}
            isWilcare={isWilcare}
            onChange={handleInputChange}
            onSelectChange={handleSelectChange}
            onPhoneChange={(value) =>
              setFormData((prev) => ({ ...prev, primaryContact: value || "" }))
            }
            onNext={handleNextStep}
            onBack={handleGoBack}
          />
        );
      case 3:
        return (
          <PersonalInfoStep
            formData={formData}
            error={error}
            onChange={handleInputChange}
            onSelectChange={handleSelectChange}
            onApplicantChange={handleApplicantChange}
            onNext={handleNextStep}
            onBack={handleGoBack}
          />
        );
      case 4:
        return (
          <PassportDetailsStep
            formData={formData}
            error={error}
            isAMC={isAMC}
            onChange={handleInputChange}
            onApplicantChange={handleApplicantChange}
            onNext={handleNextStep}
            onBack={handleGoBack}
          />
        );
      case 5:
        return (
          <DocumentsStep
            formData={formData}
            error={error}
            onFileChange={handleFileChange}
            onNext={handleNextStep}
            onBack={handleGoBack}
          />
        );
      case 6:
        return (
          <ScheduleStep
            formData={formData}
            error={error}
            loading={loading}
            onChange={handleInputChange}
            onSelectChange={handleSelectChange}
            onSubmit={handleNextStep}
            onBack={handleGoBack}
          />
        );
      case 7:
        return (
          <ReviewStep
            formData={formData}
            error={error}
            loading={loading}
            isAMC={isAMC}
            isIOM={isIOM}
            onSubmit={handleNextStep}
            onBack={handleGoBack}
            formatDate={formatDate}
          />
        );
      case 8:
        return (
          <CheckoutStep
            formData={formData}
            error={error}
            loading={loading}
            walletBalance={wallet.balance}
            walletLoading={wallet.isLoading}
            onTopup={(amount) => wallet.openTopup({ amount })}
            isAMC={isAMC}
            isIOM={isIOM}
            onBack={handleGoBack}
            onSubmit={(e) => {
              e.preventDefault();
              handleFinalSubmit();
            }}
            formatDate={formatDate}
          />
        );
      case 10:
        return <SuccessStep onReset={handleReset} />;
      case 9:
        return (
          <IOMInfoStep
            formData={formData}
            error={error}
            onChange={handleInputChange}
            onSelectChange={(name) => (value) => {
              setFormData((prev) => ({ ...prev, [name]: value }));
            }}
            onPhoneChange={(value) =>
              setFormData((prev) => ({ ...prev, contactNumber: value || "" }))
            }
            onNext={handleNextStep}
            onBack={handleGoBack}
          />
        );
      default:
        return null;
    }
  };

  // Lock background scroll while the journey overlay is open (mirrors the Sponsorship overlay).
  useEffect(() => {
    if (isJourney && isOpen && !embedded) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [isJourney, isOpen, embedded]);

  // Each time the journey overlay opens, show the intro screen first.
  useEffect(() => {
    if (isJourney && isOpen) setStarted(false);
  }, [isJourney, isOpen]);

  // In journey mode this tool is mounted on every step but must stay hidden until the
  // launch card opens it via isOpen. Standalone omits isOpen (defaults true) → renders inline.
  if (!isOpen) return null;

  // Topbar progress mirrors the booking wizard. In journey mode the checkout step (8) is
  // skipped, so the visible wizard is steps 1–7; standalone still counts the checkout (1–8).
  const medTotalSteps = isJourney ? 7 : 8;
  const medCurrentStep = step >= 10 ? medTotalSteps : Math.min(step, medTotalSteps);

  // Journey intro screen: a "what is this service" hand-off shown before the booking wizard.
  const showIntro = isJourney && !started && step < 10;

  // Left-pane step list. Mirrors the real step order of this wizard:
  //   standard: 1 location > 2 basic > 3 info > 4 passport > 5 docs > 6 when > 7 review > 8 checkout
  //   IOM:      1 location > 9 IOM info > 7 review > 8 checkout
  // Journey mode has no checkout step (the plan covers it).
  const medStepLabels = isIOM
    ? [
        t("bookAppointment.progressSteps.location"),
        t("bookAppointment.progressSteps.iomInfo"),
        t("bookAppointment.progressSteps.review"),
        ...(isJourney ? [] : ["Checkout"]),
      ]
    : [
        t("bookAppointment.progressSteps.location"),
        isAMC ? t("bookAppointment.progressSteps.amcInfo") : t("bookAppointment.progressSteps.hi"),
        t("bookAppointment.progressSteps.info"),
        t("bookAppointment.progressSteps.passport"),
        t("bookAppointment.progressSteps.docs"),
        t("bookAppointment.progressSteps.when"),
        t("bookAppointment.progressSteps.review"),
        ...(isJourney ? [] : ["Checkout"]),
      ];
  const iomStepIndex: Record<number, number> = { 1: 0, 9: 1, 7: 2, 8: 3 };
  const medStepIndex = showIntro ? -1 : isIOM ? (iomStepIndex[step] ?? 0) : step - 1;
  return (
    <div
      className={
        isJourney
          ? embedded
            ? "w-full font-sans"
            : "animate-in slide-in-from-bottom-[18px] fixed inset-0 z-[150] overflow-y-auto bg-white font-sans duration-[0.28s] ease-in-out"
          : "mt-[55px] bg-white"
      }
    >
      {isJourney && !embedded && (
        <div className="sticky top-0 z-10 flex h-[64px] items-center gap-3 border-b border-[#d0e4f7] bg-white px-4 sm:gap-4 sm:px-6">
          <button
            onClick={onClose}
            aria-label="Close"
            className="hover:bg-primary/10 focus:ring-primary flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border-none bg-[#f4f7fb] text-[#3a4f63] transition-all outline-none focus:ring-2"
          >
            <X size={16} strokeWidth={2} />
          </button>
          <div className="flex-1" />
          {!showIntro && (
            <div className="shrink-0 text-[12px] font-medium whitespace-nowrap text-[#6b8097]">
              Step {medCurrentStep} of {medTotalSteps}
            </div>
          )}
        </div>
      )}

      <ServiceSkinShell
        service="medical"
        title="Medical appointment"
        tagline={SERVICE_SKIN_TAGLINE.medical}
        steps={medStepLabels}
        current={medStepIndex}
        done={step === 10}
        heading={showIntro ? "Book your medical exam through Rahvana" : undefined}
        subheading={
          showIntro
            ? "Rahvana will connect you with an embassy-approved physician in your area. Start the booking service below to choose your location and preferred date."
            : undefined
        }
        kicker={showIntro ? "Rahvana booking service" : undefined}
        timeEstimate="5 min"
        faq={SERVICE_SKIN_FAQ.medical}
        layout={isJourney ? (embedded ? "embedded" : "overlay") : "page"}
        topOffset={isJourney ? (embedded ? 0 : 64) : 60}
        viewportOffset={isJourney ? (embedded ? 0 : 64) : 60}
        paneFooter={
          !isJourney && user ? (
            <ServiceSubjectPicker
              label="Booking for"
              candidates={candidates}
              value={subjectId}
              onChange={changeBookingFor}
              disabled={step !== 1}
            />
          ) : isMultiCandidate ? (
            <div className="svk-for">
              <span>Booking for</span>
              <b>
                {activeCandidate.label || "Beneficiary"} (
                {activeCandidate.fullName ||
                  (formData.givenName && formData.surname
                    ? `${formData.givenName} ${formData.surname}`.trim()
                    : "Primary Candidate")}
                )
              </b>
            </div>
          ) : undefined
        }
      >
        {showIntro ? (
          <div>
            {existingRequests && existingRequests.length > 0 && (
              <div className="mb-6">
                <div className="mb-2 text-[11px] font-bold tracking-widest text-teal-700 uppercase">
                  Your Appointments
                </div>
                <div className="space-y-4">
                  {existingRequests.map((appointment) => (
                    <MedicalAppointmentCard key={appointment.id} appointment={appointment} />
                  ))}
                </div>
              </div>
            )}
            {statusLoading ? (
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3.5">
                <svg
                  className="h-4 w-4 animate-spin text-teal-600"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z"
                  />
                </svg>
                <span className="text-sm text-slate-600">
                  Checking your existing appointments...
                </span>
              </div>
            ) : locked ? (
              <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3.5">
                <svg
                  className="mt-0.5 h-4 w-4 shrink-0 text-amber-600"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <div className="text-sm leading-relaxed text-amber-900">
                  {lockHint ||
                    "You already have an active medical appointment. You can book another once its appointment date passes."}
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setStarted(true)}
                className="svk-btn svk-btn-pri w-full"
              >
                Start Booking Service
              </button>
            )}
          </div>
        ) : (
          <div className="svk-med">{renderStep()}</div>
        )}
      </ServiceSkinShell>
    </div>
  );
}
