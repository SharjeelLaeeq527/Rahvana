"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import IOMInfoStep from "./components/IOMInfoStep";
import { useAuth } from "@/app/context/AuthContext";
import { useLanguage } from "@/app/context/LanguageContext";
import { createBrowserClient } from "@supabase/ssr";
import { mapProfileToGenericForm } from "@/lib/autoFill/mapper";
import { MasterProfile } from "@/types/profile";

type Location = "karachi" | "lahore" | "islamabad";
type IslamabadProvider = "amc" | "iom";
type Gender = "M" | "F" | "Other";

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
      <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-6">
        {t("bookAppointment.locationStep.title")}
      </h2>
      <p className="text-slate-600 mb-8">
        {t("bookAppointment.locationStep.subtitle")}
      </p>

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            type="button"
            className={`p-4 sm:p-6 border-2 rounded-xl text-center transition-all ${
              formData.location === "karachi"
                ? "border-teal-600 bg-teal-50"
                : "border-gray-200 hover:border-teal-400"
            }`}
            onClick={() => onLocationChange("karachi")}
          >
            <h3 className="font-semibold text-lg mb-2">
              {t("bookAppointment.locationStep.karachi")}
            </h3>
            <p className="text-sm text-slate-600">
              {t("bookAppointment.locationStep.wilcareMedical")}
            </p>
          </button>

          <button
            type="button"
            className={`p-4 sm:p-6 border-2 rounded-xl text-center transition-all ${
              formData.location === "lahore"
                ? "border-teal-600 bg-teal-50"
                : "border-gray-200 hover:border-teal-400"
            }`}
            onClick={() => onLocationChange("lahore")}
          >
            <h3 className="font-semibold text-lg mb-2">
              {t("bookAppointment.locationStep.lahore")}
            </h3>
            <p className="text-sm text-slate-600">
              {t("bookAppointment.locationStep.wilcareMedical")}
            </p>
          </button>

          <button
            type="button"
            className={`p-4 sm:p-6 border-2 rounded-xl text-center transition-all ${
              formData.location === "islamabad"
                ? "border-teal-600 bg-teal-50"
                : "border-gray-200 hover:border-teal-400"
            }`}
            onClick={() => onLocationChange("islamabad")}
          >
            <h3 className="font-semibold text-lg mb-2">
              {t("bookAppointment.locationStep.islamabad")}
            </h3>
            <p className="text-sm text-slate-600">
              {t("bookAppointment.locationStep.chooseProviderBelow")}
            </p>
          </button>
        </div>

        {formData.location === "islamabad" && (
          <div className="space-y-4 p-4 sm:p-6 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-lg text-slate-900">
              {t("bookAppointment.locationStep.selectProviderTitle")}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                type="button"
                className={`p-4 border-2 rounded-lg text-center transition-all ${
                  formData.islamabadProvider === "amc"
                    ? "border-blue-600 bg-blue-100"
                    : "border-gray-300 hover:border-blue-400"
                }`}
                onClick={() => onProviderChange("amc")}
              >
                <h4 className="font-semibold mb-1">
                  {t("bookAppointment.locationStep.amc")}
                </h4>
                <p className="text-xs text-slate-600">
                  {t("bookAppointment.locationStep.amcDesc")}
                </p>
              </button>

              <button
                type="button"
                className={`p-4 border-2 rounded-lg text-center transition-all ${
                  formData.islamabadProvider === "iom"
                    ? "border-blue-600 bg-blue-100"
                    : "border-gray-300 hover:border-blue-400"
                }`}
                onClick={() => onProviderChange("iom")}
              >
                <h4 className="font-semibold mb-1">
                  {t("bookAppointment.locationStep.iom")}
                </h4>
                <p className="text-xs text-slate-600">
                  {t("bookAppointment.locationStep.iomDesc")}
                </p>
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="flex justify-end pt-4">
          <Button
            onClick={onNext}
            className="bg-teal-600 hover:bg-teal-700 text-white"
          >
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
  onNext,
  onBack,
}: BasicInfoStepProps) => {
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <div className="bg-teal-600 text-white px-3 py-1 rounded font-semibold">
          {isAMC
            ? t("bookAppointment.basicInfoStep.amcBadge")
            : t("bookAppointment.basicInfoStep.hiBadge")}
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
          {t("bookAppointment.basicInfoStep.title")}
        </h2>
      </div>

      <div className="space-y-6">
        {isAMC && (
          <>
            <div className="space-y-2">
              <Label htmlFor="interviewDate">
                {t("bookAppointment.basicInfoStep.interviewDate")}
              </Label>
              <Input
                id="interviewDate"
                name="interviewDate"
                type="date"
                value={formData.interviewDate}
                onChange={onChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="visaCategory">
                {t("bookAppointment.basicInfoStep.visaCategory")}
              </Label>
              <Select
                value={formData.visaCategory}
                onValueChange={onSelectChange("visaCategory")}
              >
                <SelectTrigger id="visaCategory">
                  <SelectValue
                    placeholder={t(
                      "bookAppointment.basicInfoStep.selectVisaCategory",
                    )}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Immigrant Visa">
                    {t(
                      "bookAppointment.basicInfoStep.visaCategories.immigrant",
                    )}
                  </SelectItem>
                  <SelectItem value="Non-immigrant Visa">
                    {t(
                      "bookAppointment.basicInfoStep.visaCategories.nonImmigrant",
                    )}
                  </SelectItem>
                  <SelectItem value="K-1 Fiance Visa">
                    {t("bookAppointment.basicInfoStep.visaCategories.k1Fiance")}
                  </SelectItem>
                  <SelectItem value="Student Visa">
                    {t("bookAppointment.basicInfoStep.visaCategories.student")}
                  </SelectItem>
                  <SelectItem value="Work Visa">
                    {t("bookAppointment.basicInfoStep.visaCategories.work")}
                  </SelectItem>
                  <SelectItem value="Tourist Visa">
                    {t("bookAppointment.basicInfoStep.visaCategories.tourist")}
                  </SelectItem>
                  <SelectItem value="Other">
                    {t("bookAppointment.basicInfoStep.visaCategories.other")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="hadMedicalBefore">
                {t("bookAppointment.basicInfoStep.hadMedicalBefore")}
              </Label>
              <Select
                value={formData.hadMedicalBefore}
                onValueChange={onSelectChange("hadMedicalBefore")}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={t("bookAppointment.basicInfoStep.selectYesNo")}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Yes">
                    {t("bookAppointment.basicInfoStep.yes")}
                  </SelectItem>
                  <SelectItem value="No">
                    {t("bookAppointment.basicInfoStep.no")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        <div className="space-y-2">
          <Label htmlFor="primaryContact">
            {t("bookAppointment.basicInfoStep.mobileNo")}
          </Label>
          <div className="flex gap-2">
            <div className="flex items-center justify-center w-24 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm font-medium">
              🇵🇰 92
            </div>
            <Input
              id="primaryContact"
              name="primaryContact"
              value={formData.primaryContact}
              onChange={onChange}
              placeholder="3001234567"
              type="tel"
              className="flex-1"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">
            {t("bookAppointment.basicInfoStep.email")}
          </Label>
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
              <Label htmlFor="city">
                {t("bookAppointment.basicInfoStep.city")}
              </Label>
              <Input
                id="city"
                name="city"
                value={formData.city}
                onChange={onChange}
                placeholder={t("bookAppointment.basicInfoStep.enterCity")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="caseRef">
                {t("bookAppointment.basicInfoStep.caseRef")}
              </Label>
              <Input
                id="caseRef"
                name="caseRef"
                value={formData.caseRef}
                onChange={onChange}
                placeholder={t("bookAppointment.basicInfoStep.enterCaseRef")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="numberOfApplicants">
                {t("bookAppointment.basicInfoStep.numberOfApplicants")}
              </Label>
              <Select
                value={formData.numberOfApplicants}
                onValueChange={onSelectChange("numberOfApplicants")}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={t(
                      "bookAppointment.basicInfoStep.selectNumber",
                    )}
                  />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      {num}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {isWilcare && (
          <>
            <div className="space-y-2">
              <Label htmlFor="appointmentType">
                {t("bookAppointment.basicInfoStep.appointmentType")}
              </Label>
              <Select
                value={formData.appointmentType}
                onValueChange={onSelectChange("appointmentType")}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={t(
                      "bookAppointment.basicInfoStep.selectAppointmentType",
                    )}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Individual">
                    {t(
                      "bookAppointment.basicInfoStep.appointmentTypes.individual",
                    )}
                  </SelectItem>
                  <SelectItem value="Family">
                    {t("bookAppointment.basicInfoStep.appointmentTypes.family")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="visaType">
                {t("bookAppointment.basicInfoStep.visaType")}
              </Label>
              <Select
                value={formData.visaType}
                onValueChange={onSelectChange("visaType")}
              >
                <SelectTrigger id="visaType">
                  <SelectValue
                    placeholder={t(
                      "bookAppointment.basicInfoStep.selectVisaType",
                    )}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="B-2">
                    {t("bookAppointment.basicInfoStep.visaTypes.b2")}
                  </SelectItem>
                  <SelectItem value="B-1/B-2">
                    {t("bookAppointment.basicInfoStep.visaTypes.b1b2")}
                  </SelectItem>
                  <SelectItem value="F-1">
                    {t("bookAppointment.basicInfoStep.visaTypes.f1")}
                  </SelectItem>
                  <SelectItem value="H-1B">
                    {t("bookAppointment.basicInfoStep.visaTypes.h1b")}
                  </SelectItem>
                  <SelectItem value="K-1">
                    {t("bookAppointment.basicInfoStep.visaTypes.k1")}
                  </SelectItem>
                  <SelectItem value="IR-1">
                    {t("bookAppointment.basicInfoStep.visaTypes.ir1")}
                  </SelectItem>
                  <SelectItem value="CR-1">
                    {t("bookAppointment.basicInfoStep.visaTypes.cr1")}
                  </SelectItem>
                  <SelectItem value="Other">
                    {t("bookAppointment.basicInfoStep.visaTypes.other")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="originalPassport">
                {t("bookAppointment.basicInfoStep.originalPassport")}
              </Label>
              <Select
                value={formData.originalPassport}
                onValueChange={onSelectChange("originalPassport")}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={t(
                      "bookAppointment.basicInfoStep.originalPassportOptions.yes",
                    )}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="YES">
                    {t(
                      "bookAppointment.basicInfoStep.originalPassportOptions.yes",
                    )}
                  </SelectItem>
                  <SelectItem value="NO">
                    {t(
                      "bookAppointment.basicInfoStep.originalPassportOptions.no",
                    )}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="medicalType">
                {t("bookAppointment.basicInfoStep.medicalType")}
              </Label>
              <Select
                value={formData.medicalType}
                onValueChange={onSelectChange("medicalType")}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={t(
                      "bookAppointment.basicInfoStep.selectMedicalType",
                    )}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="First Medical">
                    {t("bookAppointment.basicInfoStep.medicalTypes.first")}
                  </SelectItem>
                  <SelectItem value="Re-Medical">
                    {t("bookAppointment.basicInfoStep.medicalTypes.reMedical")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="flex justify-between pt-4">
          <Button
            onClick={onBack}
            variant="outline"
            className="bg-teal-600 hover:bg-teal-700 text-white"
          >
            {t("bookAppointment.basicInfoStep.prevBtn")}
          </Button>
          <Button
            onClick={onNext}
            className="bg-teal-600 hover:bg-teal-700 text-white"
          >
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
  return (
    <div className="border border-gray-200 rounded-lg p-4 sm:p-6 mb-6 bg-gray-50">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">
        {t("bookAppointment.personalInfoStep.applicantNumber").replace(
          "{index}",
          (index + 1).toString(),
        )}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor={`applicant-${index}-surname`}>
            {t("bookAppointment.personalInfoStep.surname")}
          </Label>
          <Input
            id={`applicant-${index}-surname`}
            value={applicant.surname}
            onChange={(e) => onChange(index, "surname", e.target.value)}
            placeholder={t("bookAppointment.personalInfoStep.enterSurname")}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`applicant-${index}-givenName`}>
            {t("bookAppointment.personalInfoStep.givenName")}
          </Label>
          <Input
            id={`applicant-${index}-givenName`}
            value={applicant.givenName}
            onChange={(e) => onChange(index, "givenName", e.target.value)}
            placeholder={t("bookAppointment.personalInfoStep.enterGivenName")}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`applicant-${index}-gender`}>
            {t("bookAppointment.personalInfoStep.gender")}
          </Label>
          <Select
            value={applicant.gender}
            onValueChange={(value) => onChange(index, "gender", value)}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={t("bookAppointment.personalInfoStep.selectGender")}
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="M">
                {t("bookAppointment.personalInfoStep.genders.m")}
              </SelectItem>
              <SelectItem value="F">
                {t("bookAppointment.personalInfoStep.genders.f")}
              </SelectItem>
              <SelectItem value="Other">
                {t("bookAppointment.personalInfoStep.genders.other")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`applicant-${index}-dateOfBirth`}>
            {t("bookAppointment.personalInfoStep.dateOfBirth")}
          </Label>
          <Input
            id={`applicant-${index}-dateOfBirth`}
            type="date"
            value={applicant.dateOfBirth}
            onChange={(e) => onChange(index, "dateOfBirth", e.target.value)}
          />
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
  onApplicantChange: (
    index: number,
    field: keyof Applicant,
    value: string,
  ) => void;
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
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <div className="bg-teal-600 text-white px-3 py-1 rounded font-semibold">
          {t("bookAppointment.personalInfoStep.badge")}
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
          {t("bookAppointment.personalInfoStep.title")}
        </h2>
      </div>

      <div className="space-y-6">
        {/* Primary applicant information */}
        <div className="border border-blue-200 rounded-lg p-4 sm:p-6 bg-blue-50">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            {t("bookAppointment.personalInfoStep.primaryApplicantTitle")}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="surname">
                {t("bookAppointment.personalInfoStep.surname")}
              </Label>
              <Input
                id="surname"
                name="surname"
                value={formData.surname}
                onChange={onChange}
                placeholder={t("bookAppointment.personalInfoStep.enterSurname")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="givenName">
                {t("bookAppointment.personalInfoStep.givenName")}
              </Label>
              <Input
                id="givenName"
                name="givenName"
                value={formData.givenName}
                onChange={onChange}
                placeholder={t(
                  "bookAppointment.personalInfoStep.enterGivenName",
                )}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">
                {t("bookAppointment.personalInfoStep.gender")}
              </Label>
              <Select
                value={formData.gender}
                onValueChange={onSelectChange("gender")}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={t(
                      "bookAppointment.personalInfoStep.selectGender",
                    )}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="M">
                    {t("bookAppointment.personalInfoStep.genders.m")}
                  </SelectItem>
                  <SelectItem value="F">
                    {t("bookAppointment.personalInfoStep.genders.f")}
                  </SelectItem>
                  <SelectItem value="Other">
                    {t("bookAppointment.personalInfoStep.genders.other")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">
                {t("bookAppointment.personalInfoStep.dateOfBirth")}
              </Label>
              <Input
                id="dateOfBirth"
                name="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={onChange}
              />
            </div>
          </div>
        </div>

        {/* Additional applicants if any */}
        {parseInt(formData.numberOfApplicants) > 1 && (
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
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
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="flex justify-between pt-4">
          <Button
            onClick={onBack}
            variant="outline"
            className="bg-teal-600 hover:bg-teal-700 text-white"
          >
            {t("bookAppointment.personalInfoStep.prevBtn")}
          </Button>
          <Button
            onClick={onNext}
            className="bg-teal-600 hover:bg-teal-700 text-white"
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
    <div className="border border-gray-200 rounded-lg p-4 sm:p-6 mb-6 bg-gray-50">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">
        {t("bookAppointment.passportDetailsStep.applicantNumber").replace(
          "{index}",
          (index + 1).toString(),
        )}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor={`applicant-${index}-passportNumber`}>
            {t("bookAppointment.passportDetailsStep.passportNumber")}
          </Label>
          <Input
            id={`applicant-${index}-passportNumber`}
            value={applicant.passportNumber}
            onChange={(e) => onChange(index, "passportNumber", e.target.value)}
            placeholder={t(
              "bookAppointment.passportDetailsStep.enterPassportNumber",
            )}
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
            onChange={(e) =>
              onChange(index, "passportIssueDate", e.target.value)
            }
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
            onChange={(e) =>
              onChange(index, "passportExpiryDate", e.target.value)
            }
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
              placeholder={t(
                "bookAppointment.passportDetailsStep.enterCaseNumber",
              )}
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
              placeholder={t(
                "bookAppointment.passportDetailsStep.enterCaseRef",
              )}
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
  onApplicantChange: (
    index: number,
    field: keyof Applicant,
    value: string,
  ) => void;
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
      <div className="flex items-center gap-2 mb-6">
        <div className="bg-teal-600 text-white px-3 py-1 rounded font-semibold">
          {t("bookAppointment.passportDetailsStep.badge")}
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
          {t("bookAppointment.passportDetailsStep.title")}
        </h2>
      </div>

      <div className="space-y-6">
        {/* Primary applicant passport details */}
        <div className="border border-blue-200 rounded-lg p-4 sm:p-6 bg-blue-50">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            {t("bookAppointment.passportDetailsStep.primaryApplicantTitle")}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="passportNumber">
                {t("bookAppointment.passportDetailsStep.passportNumber")}
              </Label>
              <Input
                id="passportNumber"
                name="passportNumber"
                value={formData.passportNumber}
                onChange={onChange}
                placeholder={t(
                  "bookAppointment.passportDetailsStep.enterPassportNumber",
                )}
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
                  placeholder={t(
                    "bookAppointment.passportDetailsStep.enterCaseNumber",
                  )}
                />
              </div>
            )}

            {isAMC && (
              <div className="space-y-2">
                <Label htmlFor="caseRef">
                  {t("bookAppointment.passportDetailsStep.caseRef")}
                </Label>
                <Input
                  id="caseRef"
                  name="caseRef"
                  value={formData.caseRef}
                  onChange={onChange}
                  placeholder={t(
                    "bookAppointment.passportDetailsStep.enterCaseRef",
                  )}
                />
              </div>
            )}
          </div>
        </div>

        {/* Additional applicants if any */}
        {parseInt(formData.numberOfApplicants) > 1 && (
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              {t(
                "bookAppointment.passportDetailsStep.additionalApplicantsTitle",
              )}
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
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="flex justify-between pt-4">
          <Button
            onClick={onBack}
            variant="outline"
            className="bg-teal-600 hover:bg-teal-700 text-white"
          >
            {t("bookAppointment.passportDetailsStep.prevBtn")}
          </Button>
          <Button
            onClick={onNext}
            className="bg-teal-600 hover:bg-teal-700 text-white"
          >
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
  onFileChange: (
    name: keyof FormData,
  ) => (e: React.ChangeEvent<HTMLInputElement>) => void;
  onNext: () => void;
  onBack: () => void;
}

const DocumentsStep = ({
  formData,
  error,
  onFileChange,
  onNext,
  onBack,
}: DocumentsStepProps) => {
  const { t } = useLanguage();
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <div className="bg-teal-600 text-white px-3 py-1 rounded font-semibold">
          {t("bookAppointment.documentsStep.badge")}
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
          {t("bookAppointment.documentsStep.title")}
        </h2>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>{t("bookAppointment.documentsStep.surname")}</Label>
            <Input value={formData.surname} disabled className="bg-gray-50" />
          </div>

          <div className="space-y-2">
            <Label>{t("bookAppointment.documentsStep.givenName")}</Label>
            <Input value={formData.givenName} disabled className="bg-gray-50" />
          </div>
        </div>

        <div className="space-y-2">
          <Label>{t("bookAppointment.documentsStep.scannedPassport")}</Label>
          <label
            htmlFor="scannedPassport"
            className="flex flex-col items-center justify-center w-full cursor-pointer h-24 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-teal-50 hover:border-teal-500 hover:text-teal-600 transition-colors text-slate-500"
          >
            <svg
              className="w-6 h-6 mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
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
            <p className="text-sm text-green-600 flex items-center gap-2">
              <svg
                className="w-4 h-4"
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
            className="flex flex-col items-center justify-center w-full cursor-pointer h-24 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-teal-50 hover:border-teal-500 hover:text-teal-600 transition-colors text-slate-500"
          >
            <svg
              className="w-6 h-6 mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
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
            <p className="text-sm text-green-600 flex items-center gap-2">
              <svg
                className="w-4 h-4"
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
            className="flex flex-col items-center justify-center w-full cursor-pointer h-24 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-teal-50 hover:border-teal-500 hover:text-teal-600 transition-colors text-slate-500"
          >
            <svg
              className="w-6 h-6 mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
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
            <p className="text-sm text-green-600 flex items-center gap-2">
              <svg
                className="w-4 h-4"
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
              {formData.appointmentConfirmationLetter.name}
            </p>
          )}
          <p className="text-xs text-slate-500">
            {t("bookAppointment.documentsStep.uploadAppointmentDesc")}
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="flex justify-between pt-4">
          <Button
            onClick={onBack}
            variant="outline"
            className="bg-teal-600 hover:bg-teal-700 text-white"
          >
            {t("bookAppointment.documentsStep.prevBtn")}
          </Button>
          <Button
            onClick={onNext}
            className="bg-teal-600 hover:bg-teal-700 text-white"
          >
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
      <div className="flex items-center gap-2 mb-6">
        <div className="bg-teal-600 text-white px-3 py-1 rounded font-semibold">
          {t("bookAppointment.scheduleStep.badge")}
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
          {t("bookAppointment.scheduleStep.title")}
        </h2>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="font-semibold text-lg">
          {formData.surname}, {formData.givenName}
        </p>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="estimatedCharges">
            {t("bookAppointment.scheduleStep.estCharges")}
          </Label>
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
            value={formData.preferredAppointmentDate}
            onChange={onChange}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="preferredTime">
            {t("bookAppointment.scheduleStep.time")}
          </Label>
          <Select
            value={formData.preferredTime}
            onValueChange={onSelectChange("preferredTime")}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={t("bookAppointment.scheduleStep.selectTimeSlot")}
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="08:00-08:30">08:00 AM - 08:30 AM</SelectItem>
              <SelectItem value="08:30-09:00">08:30 AM - 09:00 AM</SelectItem>
              <SelectItem value="09:00-09:30">09:00 AM - 09:30 AM</SelectItem>
              <SelectItem value="09:30-10:00">09:30 AM - 10:00 AM</SelectItem>
              <SelectItem value="10:00-10:30">10:00 AM - 10:30 AM</SelectItem>
              <SelectItem value="10:30-11:00">10:30 AM - 11:00 AM</SelectItem>
              <SelectItem value="11:00-11:30">11:00 AM - 11:30 AM</SelectItem>
              <SelectItem value="11:30-12:00">11:30 AM - 12:00 PM</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="flex justify-between pt-4">
          <Button
            onClick={onBack}
            variant="outline"
            className="bg-teal-600 hover:bg-teal-700 text-white"
          >
            {t("bookAppointment.scheduleStep.prevBtn")}
          </Button>
          <Button
            onClick={onSubmit}
            disabled={loading}
            className="bg-teal-600 hover:bg-teal-700 text-white"
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
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <div className="bg-teal-600 text-white px-3 py-1 rounded font-semibold">
          {t("bookAppointment.reviewStep.badge")}
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
          {t("bookAppointment.reviewStep.title")}
        </h2>
      </div>

      <div className="space-y-6">
        <div className="bg-slate-50 rounded-lg p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <svg
              className="w-5 h-5 text-teal-600"
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-slate-600">
                {t("bookAppointment.reviewStep.selectedCentre")}
              </p>
              <p className="font-medium capitalize">
                {formData.location}
                {formData.location === "islamabad" &&
                  formData.islamabadProvider &&
                  ` - ${formData.islamabadProvider.toUpperCase()}`}
                {(formData.location === "karachi" ||
                  formData.location === "lahore") &&
                  " - Wilcare Medical"}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 rounded-lg p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <svg
              className="w-5 h-5 text-teal-600"
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-slate-600">
                {t("bookAppointment.reviewStep.primaryContact")}
              </p>
              <p className="font-medium">+92 {formData.primaryContact}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">
                {t("bookAppointment.reviewStep.email")}
              </p>
              <p className="font-medium">{formData.email}</p>
            </div>
            {formData.interviewDate && (
              <div>
                <p className="text-sm text-slate-600">
                  {t("bookAppointment.reviewStep.interviewDate")}
                </p>
                <p className="font-medium">
                  {formatDate(formData.interviewDate)}
                </p>
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
                <p className="text-sm text-slate-600">
                  {t("bookAppointment.reviewStep.visaType")}
                </p>
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
                  <p className="font-medium">+92 {formData.contactNumber}</p>
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

        <div className="bg-slate-50 rounded-lg p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <svg
              className="w-5 h-5 text-teal-600"
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
            <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
              <h4 className="font-semibold text-slate-900 mb-3">
                {t("bookAppointment.reviewStep.primaryApplicant")}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  <p className="text-sm text-slate-600">
                    {t("bookAppointment.reviewStep.gender")}
                  </p>
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
            {parseInt(formData.numberOfApplicants) > 1 &&
              formData.applicants.length > 0 && (
                <div>
                  <h4 className="font-semibold text-slate-900 mb-3">
                    {t("bookAppointment.reviewStep.additionalApplicants")}
                  </h4>
                  {formData.applicants.map((applicant, index) => (
                    <div
                      key={applicant.id}
                      className="border border-gray-200 rounded-lg p-4 mb-4 bg-gray-50"
                    >
                      <h5 className="font-semibold text-slate-900 mb-2">
                        {t("bookAppointment.reviewStep.applicantIndex").replace(
                          "{index}",
                          (index + 1).toString(),
                        )}
                      </h5>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

        <div className="bg-slate-50 rounded-lg p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <svg
              className="w-5 h-5 text-teal-600"
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
            <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
              <h4 className="font-semibold text-slate-900 mb-3">
                {t("bookAppointment.reviewStep.primaryApplicant")}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            {parseInt(formData.numberOfApplicants) > 1 &&
              formData.applicants.length > 0 && (
                <div>
                  <h4 className="font-semibold text-slate-900 mb-3">
                    {t("bookAppointment.reviewStep.additionalApplicants")}
                  </h4>
                  {formData.applicants.map((applicant, index) => (
                    <div
                      key={applicant.id}
                      className="border border-gray-200 rounded-lg p-4 mb-4 bg-gray-50"
                    >
                      <h5 className="font-semibold text-slate-900 mb-2">
                        {t("bookAppointment.reviewStep.applicantIndex").replace(
                          "{index}",
                          (index + 1).toString(),
                        )}
                      </h5>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-slate-600">
                            {t("bookAppointment.reviewStep.passportNumber")}
                          </p>
                          <p className="font-medium">
                            {applicant.passportNumber}
                          </p>
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

        <div className="bg-slate-50 rounded-lg p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <svg
              className="w-5 h-5 text-teal-600"
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
            <div className="flex items-center justify-between p-3 bg-white rounded border">
              <span className="text-sm text-slate-600">
                {t("bookAppointment.reviewStep.scannedPassport")}
              </span>
              <span className="text-sm font-medium text-green-600">
                {formData.scannedPassport
                  ? formData.scannedPassport.name
                  : t("bookAppointment.reviewStep.notUploaded")}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-white rounded border">
              <span className="text-sm text-slate-600">
                {t("bookAppointment.reviewStep.k1Letter")}
              </span>
              <span className="text-sm font-medium text-green-600">
                {formData.kOneLetter
                  ? formData.kOneLetter.name
                  : t("bookAppointment.reviewStep.notUploaded")}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-white rounded border">
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

        <div className="bg-slate-50 rounded-lg p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <svg
              className="w-5 h-5 text-teal-600"
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              <p className="text-sm text-slate-600">
                {t("bookAppointment.reviewStep.timeSlot")}
              </p>
              <p className="font-medium">
                {formData.preferredTime ||
                  t("bookAppointment.reviewStep.notSpecified")}
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="flex justify-between pt-4">
          <Button
            onClick={onBack}
            variant="outline"
            className="bg-teal-600 hover:bg-teal-700 text-white"
          >
            {t("bookAppointment.reviewStep.backToEditBtn")}
          </Button>
          <Button
            onClick={onSubmit}
            disabled={loading}
            className="bg-teal-600 hover:bg-teal-700 text-white"
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

interface SuccessStepProps {
  onReset: () => void;
}

const SuccessStep = ({ onReset }: SuccessStepProps) => {
  const { t } = useLanguage();
  return (
    <div className="text-center py-12">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg
          className="w-10 h-10 text-green-600"
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
      <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4">
        {t("bookAppointment.successStep.title")}
      </h2>
      <p className="text-slate-600 mb-8">
        {t("bookAppointment.successStep.desc")}
      </p>
      <div className="flex justify-center gap-4">
        <Button
          onClick={onReset}
          className="bg-teal-600 hover:bg-teal-700 text-white"
        >
          {t("bookAppointment.successStep.bookAnotherBtn")}
        </Button>
      </div>
    </div>
  );
};

export default function WilcareAppointmentForm() {
  const [step, setStep] = useState(1);
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
    destinationCountry: "",
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
  const { t } = useLanguage();
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
          });

          setFormData((prev) => ({
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
  }, [user, profileLoaded, supabase, formData]);

  const isAMC =
    formData.location === "islamabad" && formData.islamabadProvider === "amc";
  const isIOM =
    formData.location === "islamabad" && formData.islamabadProvider === "iom";
  const isWilcare =
    formData.location === "karachi" || formData.location === "lahore";

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: keyof FormData) => (value: string) => {
    setFormData((prev) => {
      const updatedData = { ...prev, [name]: value };

      // If the number of applicants changes, update the applicants array
      if (name === "numberOfApplicants") {
        const numApplicants = parseInt(value) || 0;
        const currentApplicants = prev.applicants || [];

        // If increasing number of applicants, add new empty applicant objects
        if (numApplicants > currentApplicants.length) {
          const newApplicants = [...currentApplicants];
          for (let i = currentApplicants.length; i < numApplicants; i++) {
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
        else if (numApplicants < currentApplicants.length) {
          updatedData.applicants = currentApplicants.slice(0, numApplicants);
        }
      }

      return updatedData;
    });
  };

  const handleFileChange =
    (name: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] || null;
      setFormData((prev) => ({ ...prev, [name]: file }));
    };

  const handleApplicantChange = (
    index: number,
    field: keyof Applicant,
    value: string,
  ) => {
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
      // Validate primary applicant
      if (
        !formData.surname ||
        !formData.givenName ||
        !formData.gender ||
        !formData.dateOfBirth
      ) {
        setError(t("bookAppointment.validation.reqPrimaryApplicantFields"));
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
                (i + 1).toString(),
              ),
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
              t(
                "bookAppointment.validation.reqApplicantPassportNumber",
              ).replace("{index}", (i + 1).toString()),
            );
            return;
          }

          // For AMC, also validate caseRef
          if (isAMC && !applicant.caseRef) {
            setError(
              t("bookAppointment.validation.reqApplicantCaseRef").replace(
                "{index}",
                (i + 1).toString(),
              ),
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
      handleFinalSubmit();
      return;
    }

    if (step === 9) {
      // IOM Info step
      if (
        !formData.fullName ||
        !formData.passportNumber ||
        !formData.dateOfBirth ||
        !formData.visaType ||
        !formData.contactNumber ||
        !formData.email ||
        !formData.preferredLocation ||
        !formData.destinationCountry
      ) {
        setError(t("bookAppointment.validation.reqIomFields"));
        return;
      }
      setError(null);
      setStep(7); // Go to review step
      return;
    }
  };

  const handleFinalSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      // First, submit appointment data to API to get the appointment ID
      const appointmentResponse = await fetch("/api/book-appointment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
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
        throw new Error(
          appointmentResult.error ||
            t("bookAppointment.validation.submitError"),
        );
      }

      const appointmentId = appointmentResult.id;
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
          }),
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
          }),
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
          }),
        );
      }

      // Wait for all document uploads to complete
      if (uploadPromises.length > 0) {
        const uploadResults = await Promise.all(uploadPromises);
        const uploadErrors = uploadResults.filter((res) => !res.ok);

        if (uploadErrors.length > 0) {
          const errorText = await uploadErrors[0].text();
          throw new Error(
            errorText || t("bookAppointment.validation.uploadError"),
          );
        }
      }

      setStep(8);
    } catch (err: unknown) {
      console.error("Error submitting appointment:", err);
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(
        errorMessage || "An error occurred while submitting your appointment",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    if (step === 9) {
      setStep(1);
    } else if (step > 1) {
      // Updated to reflect new step structure (document upload step restored)
      if (step === 7) {
        // Going back from review step to schedule step
        setStep(6);
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
      destinationCountry: "",
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
            onNext={handleNextStep}
            onBack={handleGoBack}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 py-6 sm:py-12 px-2 sm:px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 sm:mb-8 text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
            {t("bookAppointment.title")}
          </h1>
          <p className="text-slate-600 text-sm sm:text-base">
            {t("bookAppointment.description")}
          </p>

          {step > 1 && step < 8 && step !== 9 && !isIOM && (
            <div className="mt-6">
              <div className="flex justify-between text-[10px] sm:text-xs text-slate-600 mb-2 px-1 sm:px-0">
                <span>{t("bookAppointment.progressSteps.location")}</span>
                <span>
                  {isAMC
                    ? t("bookAppointment.progressSteps.amcInfo")
                    : t("bookAppointment.progressSteps.hi")}
                </span>
                <span>{t("bookAppointment.progressSteps.info")}</span>
                <span>{t("bookAppointment.progressSteps.passport")}</span>
                <span>{t("bookAppointment.progressSteps.docs")}</span>
                <span>{t("bookAppointment.progressSteps.when")}</span>
              </div>
              <div className="w-full h-2 bg-slate-200 rounded-full">
                <div
                  className="h-full bg-teal-600 rounded-full transition-all duration-300"
                  style={{ width: `${((step - 1) / 7) * 100}%` }}
                ></div>
              </div>
            </div>
          )}
          {isIOM && step === 9 && (
            <div className="mt-6">
              <div className="flex justify-between text-xs text-slate-600 mb-2">
                <span>{t("bookAppointment.progressSteps.location")}</span>
                <span>{t("bookAppointment.progressSteps.iomInfo")}</span>
                <span>{t("bookAppointment.progressSteps.review")}</span>
              </div>
              <div className="w-full h-2 bg-slate-200 rounded-full">
                <div
                  className="h-full bg-teal-600 rounded-full transition-all duration-300"
                  style={{ width: `${((step - 8) / 2) * 100}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        <Card className="p-4 sm:p-8 bg-white shadow-lg border-0">
          {renderStep()}
        </Card>
      </div>
    </div>
  );
}
