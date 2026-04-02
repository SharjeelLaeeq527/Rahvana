import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLanguage } from "@/app/context/LanguageContext";

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
    },
  ) => (value: string) => void;
  onNext: () => void;
  onBack: () => void;
}

const IOMInfoStep = ({
  formData,
  error,
  onChange,
  onSelectChange,
  onNext,
  onBack,
}: IOMInfoStepProps) => {
  const { t } = useLanguage();

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
            <Label htmlFor="fullName">
              {t("bookAppointment.iomInfoStep.fullName")}
            </Label>
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
              placeholder={t(
                "bookAppointment.iomInfoStep.passportNumberPlaceholder",
              )}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dateOfBirth">
              {t("bookAppointment.iomInfoStep.dateOfBirth")}
            </Label>
            <Input
              id="dateOfBirth"
              name="dateOfBirth"
              type="date"
              value={formData.dateOfBirth || ""}
              onChange={onChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="visaType">
              {t("bookAppointment.iomInfoStep.visaType")}
            </Label>
            <Select
              value={formData.visaType || ""}
              onValueChange={onSelectChange("visaType")}
            >
              <SelectTrigger id="visaType">
                <SelectValue
                  placeholder={t("bookAppointment.iomInfoStep.selectVisaType")}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Immigrant Visa">
                  {t("bookAppointment.iomInfoStep.visaTypes.immigrant")}
                </SelectItem>
                <SelectItem value="Non-immigrant Visa">
                  {t("bookAppointment.iomInfoStep.visaTypes.nonImmigrant")}
                </SelectItem>
                <SelectItem value="K-1 Fiance Visa">
                  {t("bookAppointment.iomInfoStep.visaTypes.k1Fiance")}
                </SelectItem>
                <SelectItem value="Student Visa">
                  {t("bookAppointment.iomInfoStep.visaTypes.student")}
                </SelectItem>
                <SelectItem value="Work Visa">
                  {t("bookAppointment.iomInfoStep.visaTypes.work")}
                </SelectItem>
                <SelectItem value="Tourist Visa">
                  {t("bookAppointment.iomInfoStep.visaTypes.tourist")}
                </SelectItem>
                <SelectItem value="Other">
                  {t("bookAppointment.iomInfoStep.visaTypes.other")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactNumber">
              {t("bookAppointment.iomInfoStep.contactNumber")}
            </Label>
            <div className="flex gap-2">
              <div className="flex items-center justify-center w-24 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm font-medium">
                🇵🇰 92
              </div>
              <Input
                id="contactNumber"
                name="contactNumber"
                value={formData.contactNumber || ""}
                onChange={onChange}
                placeholder={t(
                  "bookAppointment.iomInfoStep.contactNumberPlaceholder",
                )}
                type="tel"
                className="flex-1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">
              {t("bookAppointment.iomInfoStep.email")}
            </Label>
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
            <Select
              value={formData.preferredLocation || ""}
              onValueChange={onSelectChange("preferredLocation")}
            >
              <SelectTrigger id="preferredLocation">
                <SelectValue
                  placeholder={t("bookAppointment.iomInfoStep.selectLocation")}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="islamabad">
                  {t("bookAppointment.iomInfoStep.islamabad")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="destinationCountry">
              {t("bookAppointment.iomInfoStep.destinationCountry")}
            </Label>
            <Select
              value={formData.destinationCountry || ""}
              onValueChange={onSelectChange("destinationCountry")}
            >
              <SelectTrigger id="destinationCountry">
                <SelectValue
                  placeholder={t(
                    "bookAppointment.iomInfoStep.selectDestinationCountry",
                  )}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="United States">
                  {t("bookAppointment.iomInfoStep.countries.us")}
                </SelectItem>
                <SelectItem value="Canada">
                  {t("bookAppointment.iomInfoStep.countries.canada")}
                </SelectItem>
                <SelectItem value="Australia">
                  {t("bookAppointment.iomInfoStep.countries.australia")}
                </SelectItem>
                <SelectItem value="United Kingdom">
                  {t("bookAppointment.iomInfoStep.countries.uk")}
                </SelectItem>
                <SelectItem value="New Zealand">
                  {t("bookAppointment.iomInfoStep.countries.newZealand")}
                </SelectItem>
                <SelectItem value="Other">
                  {t("bookAppointment.iomInfoStep.countries.other")}
                </SelectItem>
              </SelectContent>
            </Select>
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
            className="bg-teal-600 hover:bg-teal-700 text-white"
          >
            {t("bookAppointment.iomInfoStep.submitBtn")}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default IOMInfoStep;
