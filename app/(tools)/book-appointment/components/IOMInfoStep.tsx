import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/app/context/LanguageContext";
import { CustomDropdown } from "@/app/components/shared/CustomDropdown";
import { PhoneInput } from "@/components/ui/phone-input";
import type { Value as E164Number } from "react-phone-number-input";
import FieldLabel from "@/app/components/shared/FieldLabel";

interface IOMInfoStepProps {
  formData: {
    fullName?: string;
    passportNumber?: string;
    dateOfBirth?: string;
    visaType?: string;
    contactNumber?: string;
    email?: string;
    preferredLocation?: string;
    destinationCountry?: string;
  };
  error: string | null;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSelectChange: (
    name: keyof {
      fullName?: string;
      passportNumber?: string;
      dateOfBirth?: string;
      visaType?: string;
      contactNumber?: string;
      email?: string;
      preferredLocation?: string;
      destinationCountry?: string;
    }
  ) => (value: string) => void;
  onPhoneChange?: (value: E164Number) => void;
  onNext: () => void;
  onBack: () => void;
}

const IOMInfoStep = ({
  formData,
  error,
  onChange,
  onSelectChange,
  onPhoneChange,
  onNext,
  onBack,
}: IOMInfoStepProps) => {
  const { t } = useLanguage();
  const today = new Date().toISOString().split("T")[0];
  const isFutureDob = Boolean(formData.dateOfBirth && formData.dateOfBirth > today);
  const hasValidationError = Boolean(error || isFutureDob);

  useEffect(() => {
    if (!formData.destinationCountry) {
      onSelectChange("destinationCountry")("United States");
    }
    if (!formData.preferredLocation) {
      onSelectChange("preferredLocation")("islamabad");
    }
    if (!formData.visaType) {
      onSelectChange("visaType")("Immigrant Visa");
    }
  }, [formData.destinationCountry, formData.preferredLocation, formData.visaType, onSelectChange]);

  return (
    <div className="space-y-6">
      <div className="mb-6 flex items-center gap-2">
        <div className="rounded bg-blue-600 px-3 py-1 text-sm font-semibold text-white sm:text-base">
          {t("bookAppointment.iomInfoStep.badge")}
        </div>
        <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
          {t("bookAppointment.iomInfoStep.title")}
        </h2>
      </div>

      <div className="space-y-6 rounded-xl border border-blue-200 bg-linear-to-br from-blue-50 to-blue-100 p-4 sm:p-8">
        <p className="text-base text-slate-700 sm:text-lg">
          {t("bookAppointment.iomInfoStep.subtitle")}
        </p>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <FieldLabel htmlFor="fullName" title={t("bookAppointment.iomInfoStep.fullName")} />
            <Input
              id="fullName"
              name="fullName"
              value={formData.fullName || ""}
              onChange={onChange}
              placeholder={t("bookAppointment.iomInfoStep.fullNamePlaceholder")}
            />
          </div>

          <div className="space-y-2">
            <FieldLabel
              htmlFor="passportNumber"
              title={t("bookAppointment.iomInfoStep.passportNumber")}
            />
            <Input
              id="passportNumber"
              name="passportNumber"
              value={formData.passportNumber || ""}
              onChange={onChange}
              placeholder={t("bookAppointment.iomInfoStep.passportNumberPlaceholder")}
            />
          </div>

          <div className="space-y-2">
            <FieldLabel
              htmlFor="dateOfBirth"
              title={t("bookAppointment.iomInfoStep.dateOfBirth")}
            />
            <Input
              id="dateOfBirth"
              name="dateOfBirth"
              type="date"
              max={today}
              value={formData.dateOfBirth || ""}
              onChange={onChange}
              className={isFutureDob ? "border-red-500 focus-visible:ring-red-500" : ""}
            />
            {isFutureDob && (
              <p className="text-xs font-medium text-red-500">
                {t("bookAppointment.validation.dobFuture") !==
                "bookAppointment.validation.dobFuture"
                  ? t("bookAppointment.validation.dobFuture")
                  : "Date of birth cannot be in the future"}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <FieldLabel htmlFor="visaType" title={t("bookAppointment.iomInfoStep.visaType")} />
            <CustomDropdown
              value={formData.visaType || ""}
              onChange={onSelectChange("visaType")}
              options={[
                {
                  value: "Immigrant Visa",
                  label: t("bookAppointment.iomInfoStep.visaTypes.immigrant"),
                },
              ]}
              placeholder={t("bookAppointment.iomInfoStep.selectVisaType")}
              className="w-full [&_button]:w-full [&_button]:min-w-0"
            />
          </div>

          <div className="space-y-2">
            <FieldLabel
              htmlFor="contactNumber"
              title={t("bookAppointment.iomInfoStep.contactNumber")}
            />
            <PhoneInput
              id="contactNumber"
              value={formData.contactNumber || ""}
              onChange={(value) => {
                if (onPhoneChange) {
                  onPhoneChange(value);
                }
              }}
              defaultCountry="PK"
              placeholder={t("bookAppointment.iomInfoStep.contactNumberPlaceholder")}
            />
          </div>

          <div className="space-y-2">
            <FieldLabel htmlFor="email" title={t("bookAppointment.iomInfoStep.email")} />
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email || ""}
              onChange={onChange}
              placeholder={t("bookAppointment.iomInfoStep.emailPlaceholder")}
            />
          </div>

          <div className="space-y-2">
            <FieldLabel
              htmlFor="preferredLocation"
              title={t("bookAppointment.iomInfoStep.preferredLocation")}
            />

            <CustomDropdown
              value={formData.preferredLocation || ""}
              onChange={onSelectChange("preferredLocation")}
              options={[{ value: "islamabad", label: t("bookAppointment.iomInfoStep.islamabad") }]}
              placeholder={t("bookAppointment.iomInfoStep.selectLocation")}
              className="w-full [&_button]:w-full [&_button]:min-w-0"
            />
          </div>

          <div className="space-y-2">
            <FieldLabel
              htmlFor="destinationCountry"
              title={t("bookAppointment.iomInfoStep.destinationCountry")}
            />

            <Input
              id="destinationCountry"
              name="destinationCountry"
              value={formData.destinationCountry || "United States"}
              disabled
              className="cursor-not-allowed bg-gray-100 font-medium text-gray-700"
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
            {t("bookAppointment.iomInfoStep.backBtn")}
          </Button>
          <Button
            onClick={onNext}
            disabled={hasValidationError}
            className="bg-teal-600 text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t("bookAppointment.iomInfoStep.submitBtn")}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default IOMInfoStep;
