import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/app/context/LanguageContext";
import { CustomDropdown } from "@/app/components/shared/CustomDropdown";
import { PhoneInput } from "@/components/ui/phone-input";
import type { Value as E164Number } from "react-phone-number-input";

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
      <div className="flex items-center gap-2 mb-6">
        <div className="bg-blue-600 text-white px-3 py-1 rounded font-semibold text-sm sm:text-base">
          {t("bookAppointment.iomInfoStep.badge")}
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
          {t("bookAppointment.iomInfoStep.title")}
        </h2>
      </div>

      <div className="bg-linear-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4 sm:p-8 space-y-6">
        <p className="text-base sm:text-lg text-slate-700">
          {t("bookAppointment.iomInfoStep.subtitle")}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="fullName">{t("bookAppointment.iomInfoStep.fullName")}</Label>
            <Input
              id="fullName"
              name="fullName"
              value={formData.fullName || ""}
              onChange={onChange}
              placeholder={t("bookAppointment.iomInfoStep.fullNamePlaceholder")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="passportNumber">
              {t("bookAppointment.iomInfoStep.passportNumber")}
            </Label>
            <Input
              id="passportNumber"
              name="passportNumber"
              value={formData.passportNumber || ""}
              onChange={onChange}
              placeholder={t("bookAppointment.iomInfoStep.passportNumberPlaceholder")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dateOfBirth">{t("bookAppointment.iomInfoStep.dateOfBirth")}</Label>
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
                {t("bookAppointment.validation.dobFuture") !== "bookAppointment.validation.dobFuture"
                  ? t("bookAppointment.validation.dobFuture")
                  : "Date of birth cannot be in the future"}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="visaType">{t("bookAppointment.iomInfoStep.visaType")}</Label>
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
            <Label htmlFor="contactNumber">{t("bookAppointment.iomInfoStep.contactNumber")}</Label>
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
            <Label htmlFor="email">{t("bookAppointment.iomInfoStep.email")}</Label>
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
            <Label htmlFor="preferredLocation">
              {t("bookAppointment.iomInfoStep.preferredLocation")}
            </Label>
            <CustomDropdown
              value={formData.preferredLocation || ""}
              onChange={onSelectChange("preferredLocation")}
              options={[
                { value: "islamabad", label: t("bookAppointment.iomInfoStep.islamabad") },
              ]}
              placeholder={t("bookAppointment.iomInfoStep.selectLocation")}
              className="w-full [&_button]:w-full [&_button]:min-w-0"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="destinationCountry">
              {t("bookAppointment.iomInfoStep.destinationCountry")}
            </Label>
            <Input
              id="destinationCountry"
              name="destinationCountry"
              value={formData.destinationCountry || "United States"}
              disabled
              className="bg-gray-100 cursor-not-allowed text-gray-700 font-medium"
            />
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
            {t("bookAppointment.iomInfoStep.backBtn")}
          </Button>
          <Button
            onClick={onNext}
            disabled={hasValidationError}
            className="bg-teal-600 hover:bg-teal-700 text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t("bookAppointment.iomInfoStep.submitBtn")}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default IOMInfoStep;
