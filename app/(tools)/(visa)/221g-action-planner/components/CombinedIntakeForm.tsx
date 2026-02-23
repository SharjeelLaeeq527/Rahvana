"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import Actual221GFormChecker from "./Actual221GFormChecker";
import { FormData, FormSelections } from "../types/221g";
import { mapProfileToGenericForm } from "@/lib/autoFill/mapper";
import { MasterProfile } from "@/types/profile";
import { useAuth } from "@/app/context/AuthContext";
import { createBrowserClient } from "@supabase/ssr";

interface CombinedIntakeFormProps {
  onSubmit: (data: FormData, selectedItems: FormSelections) => void;
  initialData?: FormData | null;
  initialSelections?: FormSelections | null;
}

const VISA_TYPES = [
  { value: "IR1", label: "IR1 - Spouse of U.S. Citizen" },
  { value: "CR1", label: "CR1 - Conditional Spouse of U.S. Citizen" },
  { value: "IR2", label: "IR2 - Unmarried Child Under 21 of U.S. Citizen" },
  { value: "IR5", label: "IR5 - Parent of U.S. Citizen" },
  { value: "F1", label: "F1 - Unmarried Son/Daughter of U.S. Citizen" },
  { value: "F2A", label: "F2A - Spouse/Child of Permanent Resident" },
  { value: "F2B", label: "F2B - Unmarried Son/Daughter of Permanent Resident" },
  { value: "F3", label: "F3 - Married Son/Daughter of U.S. Citizen" },
  { value: "F4", label: "F4 - Sibling of U.S. Citizen" },
  { value: "K1", label: "K1 - Fiancé(e) of U.S. Citizen" },
  { value: "Other", label: "Other (Please specify)" },
];

const EMBASSIES = [
  { value: "islamabad", label: "U.S. Embassy Islamabad, Pakistan" },
  { value: "karachi", label: "U.S. Consulate Karachi, Pakistan" },
  { value: "lahore", label: "U.S. Consulate Lahore, Pakistan" },
  { value: "other", label: "Other Embassy" },
];

const OFFICER_REQUESTS = [
  {
    value: "financial",
    label: "Financial documents (I-864, tax transcripts, employment letters)",
  },
  {
    value: "civil",
    label:
      "Civil documents (birth certificates, marriage certificates, police certificates)",
  },
  {
    value: "security",
    label: "Security clearance (background checks, additional screening)",
  },
  {
    value: "legal",
    label:
      "Legal documents (divorce decrees, death certificates, court records)",
  },
  { value: "medical", label: "Medical examination corrections" },
  { value: "translation", label: "Document translations" },
  { value: "other", label: "Other (please specify)" },
];

export default function CombinedIntakeForm({
  onSubmit,
  initialData,
  initialSelections,
}: CombinedIntakeFormProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<FormData>(
    initialData || {
      visaType: "",
      visaTypeOther: "",
      interviewDate: "",
      embassy: "islamabad",
      embassyOther: "",
      letterReceived: null,
      officerRequests: [] as string[],
      officerRequestOther: "",
      passportKept: null,
      ceacStatus: "",
      ceacUpdateDate: "",
      caseNumber: "",
      additionalNotes: "",
    },
  );
  const [selected221gItems, setSelected221gItems] = useState<FormSelections>(
    initialSelections || {},
  );
  const [showFormChecker, setShowFormChecker] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const { user } = useAuth();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  // Auto-fill profile data
  useEffect(() => {
    // If we were initialized with saved data, don't overwrite with generic profile data automatically
    // unless the user explicitly wants to (feature for later?)
    if (initialData) return;

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
            visaType: formData.visaType,
            visaTypeOther: formData.visaTypeOther,
            interviewDate: formData.interviewDate,
            embassy: formData.embassy,
            embassyOther: formData.embassyOther,
            caseNumber: formData.caseNumber,
            additionalNotes: formData.additionalNotes,
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
  }, [user, profileLoaded, supabase, formData, initialData]);

  const steps = [
    {
      id: 0,
      title: "Visa Details",
      description: "Basic information about your visa application",
    },
    {
      id: 1,
      title: "Interview Outcome",
      description: "What happened during your interview",
    },
    {
      id: 2,
      title: "221(g) Letter",
      description: "Details about your 221(g) letter",
    },
    {
      id: 3,
      title: "221(g) Items",
      description: "Check items that match your letter",
    },
    {
      id: 4,
      title: "CEAC Status",
      description: "Current status on CEAC system",
    },
    {
      id: 5,
      title: "Additional Info",
      description: "Any other relevant details",
    },
  ];

  const handleInputChange = (
    field: keyof FormData,
    value: string | boolean | string[] | null,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCheckboxChange = (request: string) => {
    setFormData((prev) => {
      const requests = [...prev.officerRequests];
      if (requests.includes(request)) {
        return {
          ...prev,
          officerRequests: requests.filter((r) => r !== request),
        };
      } else {
        return { ...prev, officerRequests: [...requests, request] };
      }
    });
  };

  const handleSubmit = () => {
    onSubmit(formData, selected221gItems);
  };

  const nextStep = () => {
    if (currentStep === 2 && formData.letterReceived) {
      setShowFormChecker(true);
    } else if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const prevStep = () => {
    if (showFormChecker) {
      setShowFormChecker(false);
    } else if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  const handleVisaTypeOtherChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setFormData({ ...formData, visaTypeOther: e.target.value });
  };

  const progress =
    ((currentStep + (showFormChecker ? 0.5 : 0) + 1) /
      (steps.length + (formData.letterReceived ? 0.5 : 0))) *
    100;

  return (
    <div className="w-full">
      <Card className="w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-primary">
            221(g) / Administrative Processing Action Planner
          </CardTitle>
          <CardDescription>
            Get your personalized action plan after your visa interview
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <Progress
              value={progress}
              className="w-full h-2 bg-primary/10"
              indicatorClassName="bg-primary"
            />
            <div className="flex justify-between mt-2 text-sm text-gray-600">
              <span>
                Step {showFormChecker ? 3 : currentStep + 1} of {steps.length}
              </span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
          </div>

          {/* Step 0: Visa Details */}
          {currentStep === 0 && !showFormChecker && (
            <div className="space-y-4 md:space-y-6">
              <h3 className="text-lg md:text-xl font-semibold">Visa Details</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div className="space-y-2 md:space-y-3">
                  <Label htmlFor="visaType">Visa Type</Label>
                  <Select
                    value={formData.visaType}
                    onValueChange={(value) =>
                      handleInputChange("visaType", value)
                    }
                  >
                    <SelectTrigger id="visaType">
                      <SelectValue placeholder="Select visa type" />
                    </SelectTrigger>
                    <SelectContent>
                      {VISA_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {formData.visaType === "Other" && (
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        Please specify visa type
                      </label>
                      <input
                        type="text"
                        value={formData.visaTypeOther}
                        onChange={handleVisaTypeOtherChange}
                        placeholder="Enter your visa type"
                        className="w-full px-3 py-2 md:px-4 md:py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-2 md:space-y-3">
                  <Label htmlFor="embassy">Embassy/Consulate</Label>
                  <Select
                    value={formData.embassy}
                    onValueChange={(value) =>
                      handleInputChange("embassy", value)
                    }
                  >
                    <SelectTrigger id="embassy">
                      <SelectValue placeholder="Select embassy" />
                    </SelectTrigger>
                    <SelectContent>
                      {EMBASSIES.map((emb) => (
                        <SelectItem key={emb.value} value={emb.value}>
                          {emb.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {formData.embassy === "other" && (
                    <div className="mt-4 space-y-2">
                      <Label
                        htmlFor="embassyOther"
                        className="text-sm font-medium"
                      >
                        Please specify embassy/consulate
                      </Label>
                      <Input
                        id="embassyOther"
                        value={formData.embassyOther}
                        onChange={(e) =>
                          handleInputChange("embassyOther", e.target.value)
                        }
                        placeholder="Enter embassy name and location (e.g., U.S. Embassy Bangkok, Thailand)"
                        className="border-gray-300 focus:border-primary focus:ring-primary"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="interviewDate">Interview Date</Label>
                <Input
                  id="interviewDate"
                  type="date"
                  value={formData.interviewDate}
                  onChange={(e) =>
                    handleInputChange("interviewDate", e.target.value)
                  }
                />
              </div>
            </div>
          )}

          {/* Step 1: Interview Outcome */}
          {currentStep === 1 && !showFormChecker && (
            <div className="space-y-4 md:space-y-6">
              <h3 className="text-lg md:text-xl font-semibold">
                Interview Outcome
              </h3>

              <div>
                <Label>Did the officer keep your passport?</Label>
                <RadioGroup
                  value={
                    formData.passportKept === null
                      ? ""
                      : formData.passportKept.toString()
                  }
                  onValueChange={(value) =>
                    handleInputChange("passportKept", value === "true")
                  }
                  className="flex space-x-4 mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="true" id="passport-kept-yes" />
                    <Label htmlFor="passport-kept-yes">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="false" id="passport-kept-no" />
                    <Label htmlFor="passport-kept-no">No</Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label className="text-base font-semibold">
                  What did the officer request?
                </Label>
                <div className="mt-4 space-y-4">
                  {OFFICER_REQUESTS.map((request) => (
                    <div key={request.value} className="space-y-3">
                      <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                        <Checkbox
                          id={`request-${request.value}`}
                          checked={formData.officerRequests.includes(
                            request.value,
                          )}
                          onCheckedChange={() =>
                            handleCheckboxChange(request.value)
                          }
                          className="mt-1"
                        />
                        <Label
                          htmlFor={`request-${request.value}`}
                          className="leading-relaxed cursor-pointer"
                        >
                          {request.label}
                        </Label>
                      </div>

                      {request.value === "other" &&
                        formData.officerRequests.includes("other") && (
                          <div className="ml-7 mt-3 space-y-2">
                            <Label
                              htmlFor="officerRequestOther"
                              className="text-sm font-medium"
                            >
                              Please specify additional documents/requests
                            </Label>
                            <Textarea
                              id="officerRequestOther"
                              value={formData.officerRequestOther}
                              onChange={(e) =>
                                handleInputChange(
                                  "officerRequestOther",
                                  e.target.value,
                                )
                              }
                              placeholder="Enter details of additional documents or requests"
                              rows={3}
                              className="resize-none border-gray-300 focus:border-primary focus:ring-primary"
                            />
                          </div>
                        )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: 221(g) Letter */}
          {currentStep === 2 && !showFormChecker && (
            <div className="space-y-4 md:space-y-6">
              <h3 className="text-lg md:text-xl font-semibold">
                221(g) Letter Details
              </h3>

              <div>
                <Label>Did you receive a 221(g) letter?</Label>
                <RadioGroup
                  value={
                    formData.letterReceived === null
                      ? ""
                      : formData.letterReceived.toString()
                  }
                  onValueChange={(value) =>
                    handleInputChange("letterReceived", value === "true")
                  }
                  className="flex space-x-4 mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="true" id="letter-received-yes" />
                    <Label htmlFor="letter-received-yes">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="false" id="letter-received-no" />
                    <Label htmlFor="letter-received-no">No</Label>
                  </div>
                </RadioGroup>
              </div>

              {formData.letterReceived && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="caseNumber">
                      Case Number (from 221(g) letter)
                    </Label>
                    <Input
                      id="caseNumber"
                      value={formData.caseNumber}
                      onChange={(e) =>
                        handleInputChange("caseNumber", e.target.value)
                      }
                      placeholder="Enter case number if available"
                    />
                  </div>

                  <div className="bg-primary/10 p-4 rounded-lg border border-primary/30">
                    <Label className="text-primary font-medium">
                      221(g) Letter Items
                    </Label>
                    <p className="text-sm text-primary mt-1">
                      You will check the items that match your 221(g) letter on
                      the next screen
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 221(g) Form Checker - Special step when letter received */}
          {showFormChecker && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold">
                221(g) Letter Items Checker
              </h3>
              <p className="text-sm text-gray-600">
                Check all items that appear on your 221(g) letter
              </p>
              <Actual221GFormChecker
                selectedItems={selected221gItems}
                onSelectionChange={setSelected221gItems}
                onNext={() => {
                  setCurrentStep(3);
                  setShowFormChecker(false);
                }}
              />
              <div className="flex gap-4 mt-8">
                <Button
                  variant="outline"
                  onClick={prevStep}
                  className="flex-1 bg-transparent"
                >
                  Back
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: CEAC Status */}
          {currentStep === 3 && !showFormChecker && (
            <div className="space-y-4 md:space-y-6">
              <h3 className="text-lg md:text-xl font-semibold">CEAC Status</h3>

              <div className="space-y-2">
                <Label htmlFor="ceacStatus">Current CEAC Status</Label>
                <Input
                  id="ceacStatus"
                  value={formData.ceacStatus}
                  onChange={(e) =>
                    handleInputChange("ceacStatus", e.target.value)
                  }
                  placeholder="e.g., Administrative Processing, 221(g), Documentarily Qualified"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ceacUpdateDate">Last CEAC Update Date</Label>
                <Input
                  id="ceacUpdateDate"
                  type="date"
                  value={formData.ceacUpdateDate}
                  onChange={(e) =>
                    handleInputChange("ceacUpdateDate", e.target.value)
                  }
                />
              </div>
            </div>
          )}

          {/* Step 4: Additional Info */}
          {currentStep === 4 && !showFormChecker && (
            <div className="space-y-4 md:space-y-6">
              <h3 className="text-lg md:text-xl font-semibold">
                Additional Information
              </h3>

              <div className="space-y-2">
                <Label htmlFor="additionalNotes">
                  Any additional notes or special circumstances
                </Label>
                <Textarea
                  id="additionalNotes"
                  value={formData.additionalNotes}
                  onChange={(e) =>
                    handleInputChange("additionalNotes", e.target.value)
                  }
                  placeholder="Describe any special circumstances, additional documents you have, or concerns..."
                  rows={4}
                  className="resize-none"
                />
              </div>

              <div className="bg-primary/10 p-5 rounded-lg border border-primary/30">
                <h4 className="font-semibold text-primary mb-3 text-base">
                  Review Your Information
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex flex-col sm:flex-row sm:gap-4">
                    <span className="font-medium sm:min-w-40">Visa Type:</span>
                    <span className="text-gray-700">
                      {formData.visaType === "Other" && formData.visaTypeOther
                        ? formData.visaTypeOther
                        : VISA_TYPES.find((v) => v.value === formData.visaType)
                            ?.label || "Not selected"}
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:gap-4">
                    <span className="font-medium sm:min-w-40">Embassy:</span>
                    <span className="text-gray-700">
                      {formData.embassy === "other" && formData.embassyOther
                        ? formData.embassyOther
                        : EMBASSIES.find((e) => e.value === formData.embassy)
                            ?.label || formData.embassy}
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:gap-4">
                    <span className="font-medium sm:min-w-40">
                      Interview Date:
                    </span>
                    <span className="text-gray-700">
                      {formData.interviewDate || "Not provided"}
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:gap-4">
                    <span className="font-medium sm:min-w-40">
                      Letter Received:
                    </span>
                    <span className="text-gray-700">
                      {formData.letterReceived === null
                        ? "Not answered"
                        : formData.letterReceived
                          ? "Yes"
                          : "No"}
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:gap-4">
                    <span className="font-medium sm:min-w-40">
                      CEAC Status:
                    </span>
                    <span className="text-gray-700">
                      {formData.ceacStatus || "Not provided"}
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:gap-4">
                    <span className="font-medium sm:min-w-40">
                      221(g) Items:
                    </span>
                    <span className="text-gray-700">
                      {
                        Object.values(selected221gItems).filter((value) =>
                          Boolean(value),
                        ).length
                      }{" "}
                      items checked
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0 && !showFormChecker}
            >
              Previous
            </Button>

            {!showFormChecker && currentStep < steps.length - 1 ? (
              <Button onClick={nextStep}>Next</Button>
            ) : !showFormChecker && currentStep === steps.length - 1 ? (
              <Button onClick={handleSubmit}>Generate My Action Plan</Button>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
