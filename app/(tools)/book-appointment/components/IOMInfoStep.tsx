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
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <div className="bg-blue-600 text-white px-3 py-1 rounded font-semibold text-sm sm:text-base">
          IOM
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
          IOM Islamabad Required Information
        </h2>
      </div>

      <div className="bg-linear-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4 sm:p-8 space-y-6">
        <p className="text-base sm:text-lg text-slate-700">
          Please provide the following mandatory information for your IOM
          Islamabad appointment:
        </p>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name as printed on passport *</Label>
            <Input
              id="fullName"
              name="fullName"
              value={formData.fullName || ""}
              onChange={onChange}
              placeholder="Enter your full name as printed on passport"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="passportNumber">Passport Number *</Label>
            <Input
              id="passportNumber"
              name="passportNumber"
              value={formData.passportNumber || ""}
              onChange={onChange}
              placeholder="Enter your passport number"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dateOfBirth">
              Date of Birth as printed on passport *
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
            <Label htmlFor="visaType">Visa Type you are applying for *</Label>
            <Select
              value={formData.visaType || ""}
              onValueChange={onSelectChange("visaType")}
            >
              <SelectTrigger id="visaType">
                <SelectValue placeholder="Select visa type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Immigrant Visa">Immigrant Visa</SelectItem>
                <SelectItem value="Non-immigrant Visa">
                  Non-immigrant Visa
                </SelectItem>
                <SelectItem value="K-1 Fiance Visa">K-1 Fiancé Visa</SelectItem>
                <SelectItem value="Student Visa">Student Visa</SelectItem>
                <SelectItem value="Work Visa">Work Visa</SelectItem>
                <SelectItem value="Tourist Visa">Tourist Visa</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactNumber">Local Contact Number *</Label>
            <div className="flex gap-2">
              <div className="flex items-center justify-center w-24 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm font-medium">
                🇵🇰 92
              </div>
              <Input
                id="contactNumber"
                name="contactNumber"
                value={formData.contactNumber || ""}
                onChange={onChange}
                placeholder="3001234567"
                type="tel"
                className="flex-1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email || ""}
              onChange={onChange}
              placeholder="your.email@example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="preferredLocation">
              Preferred IOM Health Assessment Center Location *
            </Label>
            <Select
              value={formData.preferredLocation || ""}
              onValueChange={onSelectChange("preferredLocation")}
            >
              <SelectTrigger id="preferredLocation">
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="islamabad">Islamabad</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="destinationCountry">
              Destination Country for Health Assessment *
            </Label>
            <Select
              value={formData.destinationCountry || ""}
              onValueChange={onSelectChange("destinationCountry")}
            >
              <SelectTrigger id="destinationCountry">
                <SelectValue placeholder="Select destination country" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="United States">United States</SelectItem>
                <SelectItem value="Canada">Canada</SelectItem>
                <SelectItem value="Australia">Australia</SelectItem>
                <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                <SelectItem value="New Zealand">New Zealand</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
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
            Back
          </Button>
          <Button
            onClick={onNext}
            className="bg-teal-600 hover:bg-teal-700 text-white"
          >
            Submit Information
          </Button>
        </div>
      </div>
    </div>
  );
};

export default IOMInfoStep;
