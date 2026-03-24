"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { MasterProfile } from "@/types/profile";
import { ChevronRight, ChevronLeft, Save } from "lucide-react";
import { Loader } from "@/components/ui/spinner";
import {
  FormField,
  FormSelect,
  FormSection,
  FormCheckbox,
} from "@/app/(main)/profile/form-field";
import { mapProfileToGenericForm } from "@/lib/autoFill/mapper";

export default function CompleteProfileForm() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState("");
  const [profileLoaded, setProfileLoaded] = useState(false);

  const [formData, setFormData] = useState<Partial<MasterProfile>>({
    name: { first: "", last: "", middle: "" },
    dateOfBirth: "",
    placeOfBirth: { city: "", country: "" },
    sex: "Male",
    nationality: "",
    maritalStatus: "Single",
    phone: "",
    email: user?.email || "",
    currentAddress: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: "",
    },
    mailingAddress: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: "",
    },
    sameAsCurrentAddress: true,
    visaType: "",
    visaCategory: "",
    sponsor: {
      name: { first: "", last: "", middle: "" },
      dateOfBirth: "",
      phone: "",
      email: "",
      address: { street: "", city: "", state: "", zipCode: "", country: "" },
    },
    beneficiary: {
      name: { first: "", last: "", middle: "" },
      dateOfBirth: "",
      countryOfResidence: "",
    },
    relationship: {
      type: "",
      startDate: "",
      // Evidence
      cohabitationProof: false,
      sharedFinancialAccounts: false,
      weddingPhotos: false,
      communicationLogs: false,
      moneyTransferReceipts: false,
      meetingProof: false,
    },
    immigrationHistory: {
      previousVisaApplications: false,
      previousVisaDenial: false,
      overstayOrViolation: false,
      criminalRecord: false,
      removedOrDeported: false,
      priorMilitaryService: false,
      specializedWeaponsTraining: false,
      unofficialArmedGroups: false,
    },
    financialProfile: {
      hasTaxReturns: false,
      hasEmploymentLetter: false,
      hasPaystubs: false,
      hasBankStatements: false,
    },
    documents: {
      hasPassport: false,
      hasBirthCertificate: false,
      hasMarriageCertificate: false,
      hasPoliceCertificate: false,
      hasMedicalRecord: false,
      hasPhotos: false,
    },
    employer: { name: "" },
    educationLevel: "",
    educationField: "",
    annualIncome: "",
    passportNumber: "",
    passportIssueDate: "",
    passportExpiry: "",
    passportCountry: "",
    ssn: "",
    alienNumber: "",
    uscisAccountNumber: "",
    cnic: "",
    citizenshipStatus: "Other",
    naturalizationInfo: {
      certificateNumber: "",
      placeOfIssuance: "",
      dateOfIssuance: "",
    },
    father: {
      name: { first: "", last: "", middle: "" },
      dateOfBirth: "",
      placeOfBirth: { city: "", country: "" },
      isDeceased: false,
    },
    mother: {
      name: { first: "", last: "", middle: "" },
      dateOfBirth: "",
      placeOfBirth: { city: "", country: "" },
      isDeceased: false,
    },
  });

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
            name: formData.name,
            dateOfBirth: formData.dateOfBirth,
            placeOfBirth: formData.placeOfBirth,
            sex: formData.sex,
            maritalStatus: formData.maritalStatus,
            phone: formData.phone,
            email: formData.email,
            currentAddress: formData.currentAddress,
            relationship: formData.relationship,
            employer: formData.employer,
            passportNumber: formData.passportNumber,
            passportExpiry: formData.passportExpiry,
            intendedUSState: formData.intendedUSState,
            ssn: formData.ssn,
            alienNumber: formData.alienNumber,
            uscisAccountNumber: formData.uscisAccountNumber,
            mailingAddress: formData.mailingAddress,
            sameAsCurrentAddress: formData.sameAsCurrentAddress,
            citizenshipStatus: formData.citizenshipStatus,
            naturalizationInfo: formData.naturalizationInfo,
            father: formData.father,
            mother: formData.mother,
            visaEligibility: formData.visaEligibility,
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

  const handleChange = <T extends keyof MasterProfile>(
    field: T,
    value: MasterProfile[T] | string,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value as MasterProfile[T] }));
  };

  const handleNestedChange = <T extends keyof MasterProfile>(
    parent: T,
    field: string,
    value: unknown,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [parent]: {
        ...((prev[parent] as Record<string, unknown>) || {}),
        [field]: value,
      },
    }));
  };

  // Step definitions
  const steps = [
    {
      title: "Personal Information",
      description: "Basic details about yourself",
      render: () => (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              label="First Name"
              value={formData.name?.first || ""}
              onChange={(v) => handleNestedChange("name", "first", v)}
              placeholder="John"
              required
            />
            <FormField
              label="Middle Name"
              value={formData.name?.middle || ""}
              onChange={(v) => handleNestedChange("name", "middle", v)}
              placeholder="William"
            />
            <FormField
              label="Last Name"
              value={formData.name?.last || ""}
              onChange={(v) => handleNestedChange("name", "last", v)}
              placeholder="Doe"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="Date of Birth"
              value={formData.dateOfBirth || ""}
              onChange={(v) => handleChange("dateOfBirth", v)}
              type="date"
              required
            />
            <FormSelect
              label="Sex"
              value={formData.sex || "Male"}
              onChange={(v) => handleChange("sex", v)}
              options={[
                { value: "Male", label: "Male" },
                { value: "Female", label: "Female" },
              ]}
            />
            <FormField
              label="Nationality"
              value={formData.nationality || ""}
              onChange={(v) => handleChange("nationality", v)}
              placeholder="Pakistani"
              helpText="Country of citizenship"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="City of Birth"
              value={formData.placeOfBirth?.city || ""}
              onChange={(v) => handleNestedChange("placeOfBirth", "city", v)}
              placeholder="New York"
              helpText="As shown on passport"
            />
            <FormField
              label="Country of Birth"
              value={formData.placeOfBirth?.country || ""}
              onChange={(v) => handleNestedChange("placeOfBirth", "country", v)}
              placeholder="United States"
              helpText="As shown on passport"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormSelect
              label="Marital Status"
              value={formData.maritalStatus || "Single"}
              onChange={(v) => handleChange("maritalStatus", v)}
              options={[
                { value: "Single", label: "Single" },
                { value: "Married", label: "Married" },
                { value: "Divorced", label: "Divorced" },
                { value: "Widowed", label: "Widowed" },
                { value: "Separated", label: "Separated" },
                { value: "Annulled", label: "Annulled" },
              ]}
            />
            <FormSelect
              label="U.S. Citizenship Status"
              value={formData.citizenshipStatus || "Other"}
              onChange={(v) => handleChange("citizenshipStatus", v)}
              options={[
                { value: "USCitizen", label: "U.S. Citizen" },
                {
                  value: "LPR",
                  label: "Legal Permanent Resident (Green Card)",
                },
                { value: "Other", label: "Other / None" },
              ]}
              helpText="Your current legal status in the United States"
            />
          </div>

          <FormSection
            title="Legal Identifiers"
            description="Critical for identifying you in government systems"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                label="SSN (if any)"
                value={formData.ssn || ""}
                onChange={(v) => handleChange("ssn", v)}
                placeholder="000-00-0000"
              />
              <FormField
                label="A-Number (if any)"
                value={formData.alienNumber || ""}
                onChange={(v) => handleChange("alienNumber", v)}
                placeholder="A-123456789"
                helpText="Alien Registration Number"
              />
              <FormField
                label="USCIS Account #"
                value={formData.uscisAccountNumber || ""}
                onChange={(v) => handleChange("uscisAccountNumber", v)}
                placeholder="123456789012"
              />
            </div>
          </FormSection>

          <FormSection
            title="Passport Details"
            description="As shown on your travel document"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Passport Number"
                value={formData.passportNumber || ""}
                onChange={(v) => handleChange("passportNumber", v)}
                placeholder="AB1234567"
              />
              <FormField
                label="Passport Issue Date"
                value={formData.passportIssueDate || ""}
                onChange={(v) => handleChange("passportIssueDate", v)}
                type="date"
                helpText="Date your passport was issued"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Passport Expiry Date"
                value={formData.passportExpiry || ""}
                onChange={(v) => handleChange("passportExpiry", v)}
                type="date"
              />
              <FormField
                label="Passport Issuing Country"
                value={formData.passportCountry || ""}
                onChange={(v) => handleChange("passportCountry", v)}
                placeholder="Pakistan"
                helpText="Country that issued your passport"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="CNIC / National ID (if applicable)"
                value={formData.cnic || ""}
                onChange={(v) => handleChange("cnic", v)}
                placeholder="12345-1234567-1"
                helpText="Your national ID number"
              />
            </div>
          </FormSection>
        </div>
      ),
    },
    {
      title: "Contact & Address",
      description: "Your contact information and current address",
      render: () => (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="Phone Number"
              value={formData.phone || ""}
              onChange={(v) => handleChange("phone", v)}
              placeholder="+1 (555) 000-0000"
              required
            />
            <FormField
              label="Email"
              value={formData.email || ""}
              onChange={() => {}}
              disabled
            />
          </div>

          <FormSection title="Current Physical Address">
            <FormField
              label="Street Address"
              value={formData.currentAddress?.street || ""}
              onChange={(v) =>
                handleNestedChange("currentAddress", "street", v)
              }
              placeholder="123 Main Street, Apt 4B"
              required
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="City"
                value={formData.currentAddress?.city || ""}
                onChange={(v) =>
                  handleNestedChange("currentAddress", "city", v)
                }
                placeholder="New York"
                required
              />
              <FormField
                label="State / Province"
                value={formData.currentAddress?.state || ""}
                onChange={(v) =>
                  handleNestedChange("currentAddress", "state", v)
                }
                placeholder="NY"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Zip / Postal Code"
                value={formData.currentAddress?.zipCode || ""}
                onChange={(v) =>
                  handleNestedChange("currentAddress", "zipCode", v)
                }
                placeholder="10001"
              />
              <FormField
                label="Country"
                value={formData.currentAddress?.country || ""}
                onChange={(v) =>
                  handleNestedChange("currentAddress", "country", v)
                }
                placeholder="United States"
                required
              />
            </div>

            <FormField
              label="Intended US State"
              value={formData.intendedUSState || ""}
              onChange={(v) => handleChange("intendedUSState", v)}
              placeholder="Where do you plan to live?"
              helpText="If applicable"
            />
          </FormSection>

          <FormSection title="Mailing Address">
            <FormCheckbox
              id="sameAsCurrent"
              label="Mailing address is the same as physical address"
              checked={formData.sameAsCurrentAddress || false}
              onCheckedChange={(checked) => {
                setFormData((prev) => ({
                  ...prev,
                  sameAsCurrentAddress: checked,
                  mailingAddress: checked
                    ? prev.currentAddress
                    : prev.mailingAddress,
                }));
              }}
            />

            {!formData.sameAsCurrentAddress && (
              <div className="space-y-4 mt-4 p-4 bg-slate-50 rounded-lg border border-slate-100">
                <FormField
                  label="Street Address"
                  value={formData.mailingAddress?.street || ""}
                  onChange={(v) =>
                    handleNestedChange("mailingAddress", "street", v)
                  }
                  placeholder="PO Box 123"
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    label="City"
                    value={formData.mailingAddress?.city || ""}
                    onChange={(v) =>
                      handleNestedChange("mailingAddress", "city", v)
                    }
                    placeholder="New York"
                  />
                  <FormField
                    label="State / Province"
                    value={formData.mailingAddress?.state || ""}
                    onChange={(v) =>
                      handleNestedChange("mailingAddress", "state", v)
                    }
                    placeholder="NY"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    label="Zip / Postal Code"
                    value={formData.mailingAddress?.zipCode || ""}
                    onChange={(v) =>
                      handleNestedChange("mailingAddress", "zipCode", v)
                    }
                    placeholder="10001"
                  />
                  <FormField
                    label="Country"
                    value={formData.mailingAddress?.country || ""}
                    onChange={(v) =>
                      handleNestedChange("mailingAddress", "country", v)
                    }
                    placeholder="United States"
                  />
                </div>
              </div>
            )}
          </FormSection>
        </div>
      ),
    },
    {
      title: "Relationship Details",
      description: "Information for spousal visa forms",
      render: () => (
        <div className="space-y-5">
          <div className="bg-slate-50 border border-slate-200 rounded-md px-3 py-2.5">
            <p className="text-xs text-slate-600">
              This information helps us auto-fill spousal visa forms (I-130).
              Skip if not applicable.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormSelect
              label="Relationship Type"
              value={formData.relationship?.type || ""}
              onChange={(v) => handleNestedChange("relationship", "type", v)}
              options={[
                { value: "Spouse", label: "Spouse" },
                { value: "Fiance", label: "Fiance(e)" },
              ]}
              placeholder="Select relationship"
            />
            <FormField
              label="Marriage Date"
              value={formData.relationship?.marriageDate || ""}
              onChange={(v) =>
                handleNestedChange("relationship", "marriageDate", v)
              }
              type="date"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="Relationship Start Date"
              value={formData.relationship?.startDate || ""}
              onChange={(v) =>
                handleNestedChange("relationship", "startDate", v)
              }
              type="date"
            />
            <FormField
              label="Number of In-Person Visits"
              value={
                formData.relationship?.numberOfInPersonVisits?.toString() || ""
              }
              onChange={(v) =>
                handleNestedChange(
                  "relationship",
                  "numberOfInPersonVisits",
                  v ? Number(v) : null,
                )
              }
              type="number"
              placeholder="0"
            />
          </div>

          <FormField
            label="How did you meet?"
            value={formData.relationship?.howDidYouMeet || ""}
            onChange={(v) =>
              handleNestedChange("relationship", "howDidYouMeet", v)
            }
            placeholder="e.g. at university, online, through family..."
          />
        </div>
      ),
    },
    {
      title: "Employment & Education",
      description: "Your work and educational background",
      render: () => (
        <div className="space-y-5">
          <FormSection title="Employment Background">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Current Occupation"
                value={formData.occupation || ""}
                onChange={(v) => handleChange("occupation", v)}
                placeholder="e.g. Software Engineer"
              />
              <FormField
                label="Job Title"
                value={formData.jobTitle || ""}
                onChange={(v) => handleChange("jobTitle", v)}
                placeholder="Exact title on employment letter"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Employer Name"
                value={formData.employer?.name || ""}
                onChange={(v) => handleNestedChange("employer", "name", v)}
                placeholder="e.g. ABC Corporation"
              />
              <FormSelect
                label="Industry Sector"
                value={formData.industrySector || ""}
                onChange={(v) => handleChange("industrySector", v)}
                options={[
                  { value: "Technology", label: "Technology" },
                  { value: "Healthcare", label: "Healthcare" },
                  { value: "Education", label: "Education" },
                  { value: "Finance", label: "Finance" },
                  { value: "Construction", label: "Construction" },
                  { value: "Manufacturing", label: "Manufacturing" },
                  { value: "Retail", label: "Retail" },
                  { value: "Government", label: "Government" },
                  { value: "Military/Defense", label: "Military/Defense" },
                  { value: "Other", label: "Other" },
                ]}
                placeholder="Select an option"
              />
            </div>

            <div className="md:w-1/2">
              <FormField
                label="Annual Income (USD)"
                value={formData.annualIncome || ""}
                onChange={(v) => handleChange("annualIncome", v)}
                type="number"
                placeholder="e.g. 50000"
              />
            </div>
          </FormSection>

          <FormSection title="Education Background">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormSelect
                label="Highest Education Level"
                value={formData.educationLevel || ""}
                onChange={(v) => handleChange("educationLevel", v)}
                options={[
                  {
                    value: "Did not graduate high school",
                    label: "Did not graduate high school",
                  },
                  { value: "High School", label: "High School" },
                  { value: "Some College", label: "Some College" },
                  { value: "Associate Degree", label: "Associate Degree" },
                  { value: "Bachelor's Degree", label: "Bachelor's Degree" },
                  { value: "Master's Degree", label: "Master's Degree" },
                  { value: "Doctorate", label: "Doctorate (PhD)" },
                ]}
                placeholder="Select an option"
              />
              <FormField
                label="Field of Study"
                value={formData.educationField || ""}
                onChange={(v) => handleChange("educationField", v)}
                placeholder="e.g. Computer Science"
              />
            </div>
          </FormSection>
        </div>
      ),
    },
    {
      title: "Family Background",
      description: "Information about your parents (Required for most forms)",
      render: () => (
        <div className="space-y-8">
          <FormSection title="Father's Details">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                label="Father's First Name"
                value={formData.father?.name?.first || ""}
                onChange={(v) =>
                  handleNestedChange("father", "name", {
                    ...formData.father?.name,
                    first: v,
                  })
                }
                placeholder="First Name"
              />
              <FormField
                label="Father's Middle Name"
                value={formData.father?.name?.middle || ""}
                onChange={(v) =>
                  handleNestedChange("father", "name", {
                    ...formData.father?.name,
                    middle: v,
                  })
                }
                placeholder="Middle Name"
              />
              <FormField
                label="Father's Last Name"
                value={formData.father?.name?.last || ""}
                onChange={(v) =>
                  handleNestedChange("father", "name", {
                    ...formData.father?.name,
                    last: v,
                  })
                }
                placeholder="Last Name"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Date of Birth"
                value={formData.father?.dateOfBirth || ""}
                onChange={(v) => handleNestedChange("father", "dateOfBirth", v)}
                type="date"
              />
              <div className="flex items-end pb-2">
                <FormCheckbox
                  id="fatherDeceased"
                  label="Person is deceased"
                  checked={formData.father?.isDeceased || false}
                  onCheckedChange={(v) =>
                    handleNestedChange("father", "isDeceased", v)
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="City of Birth"
                value={formData.father?.placeOfBirth?.city || ""}
                onChange={(v) =>
                  handleNestedChange("father", "placeOfBirth", {
                    ...formData.father?.placeOfBirth,
                    city: v,
                  })
                }
                placeholder="City"
              />
              <FormField
                label="Country of Birth"
                value={formData.father?.placeOfBirth?.country || ""}
                onChange={(v) =>
                  handleNestedChange("father", "placeOfBirth", {
                    ...formData.father?.placeOfBirth,
                    country: v,
                  })
                }
                placeholder="Country"
              />
            </div>
            {!formData.father?.isDeceased && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  label="Current City of Residence"
                  value={formData.father?.cityOfResidence || ""}
                  onChange={(v) =>
                    handleNestedChange("father", "cityOfResidence", v)
                  }
                  placeholder="City"
                />
                <FormField
                  label="Current Country of Residence"
                  value={formData.father?.countryOfResidence || ""}
                  onChange={(v) =>
                    handleNestedChange("father", "countryOfResidence", v)
                  }
                  placeholder="Country"
                />
              </div>
            )}
          </FormSection>

          <FormSection title="Mother's Details">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                label="Mother's First Name"
                value={formData.mother?.name?.first || ""}
                onChange={(v) =>
                  handleNestedChange("mother", "name", {
                    ...formData.mother?.name,
                    first: v,
                  })
                }
                placeholder="First Name"
              />
              <FormField
                label="Mother's Middle Name"
                value={formData.mother?.name?.middle || ""}
                onChange={(v) =>
                  handleNestedChange("mother", "name", {
                    ...formData.mother?.name,
                    middle: v,
                  })
                }
                placeholder="Middle Name"
              />
              <FormField
                label="Mother's Last Name"
                value={formData.mother?.name?.last || ""}
                onChange={(v) =>
                  handleNestedChange("mother", "name", {
                    ...formData.mother?.name,
                    last: v,
                  })
                }
                placeholder="Last Name"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Date of Birth"
                value={formData.mother?.dateOfBirth || ""}
                onChange={(v) => handleNestedChange("mother", "dateOfBirth", v)}
                type="date"
              />
              <div className="flex items-end pb-2">
                <FormCheckbox
                  id="motherDeceased"
                  label="Person is deceased"
                  checked={formData.mother?.isDeceased || false}
                  onCheckedChange={(v) =>
                    handleNestedChange("mother", "isDeceased", v)
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="City of Birth"
                value={formData.mother?.placeOfBirth?.city || ""}
                onChange={(v) =>
                  handleNestedChange("mother", "placeOfBirth", {
                    ...formData.mother?.placeOfBirth,
                    city: v,
                  })
                }
                placeholder="City"
              />
              <FormField
                label="Country of Birth"
                value={formData.mother?.placeOfBirth?.country || ""}
                onChange={(v) =>
                  handleNestedChange("mother", "placeOfBirth", {
                    ...formData.mother?.placeOfBirth,
                    country: v,
                  })
                }
                placeholder="Country"
              />
            </div>
            {!formData.mother?.isDeceased && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  label="Current City of Residence"
                  value={formData.mother?.cityOfResidence || ""}
                  onChange={(v) =>
                    handleNestedChange("mother", "cityOfResidence", v)
                  }
                  placeholder="City"
                />
                <FormField
                  label="Current Country of Residence"
                  value={formData.mother?.countryOfResidence || ""}
                  onChange={(v) =>
                    handleNestedChange("mother", "countryOfResidence", v)
                  }
                  placeholder="Country"
                />
              </div>
            )}
          </FormSection>
        </div>
      ),
    },
    {
      title: "Visa Application Context",
      description: "Optional: Helps us auto-fill your visa application forms",
      render: () => (
        <div className="space-y-5">
          <div className="bg-slate-50 border border-slate-200 rounded-md px-3 py-2.5 mb-4">
            <p className="text-xs text-slate-600">
              This information is optional but helps us auto-fill visa forms.
              Skip if you&apos;re not currently applying for a visa.
            </p>
          </div>

          <FormSection title="Visa Type">
            <FormSelect
              label="What type of visa are you applying for?"
              value={formData.visaType || ""}
              onChange={(v) => handleChange("visaType", v)}
              options={[
                {
                  value: "IR-1",
                  label:
                    "IR-1 - Immediate Relative (Spouse of US Citizen, married 2+ years)",
                },
                {
                  value: "CR-1",
                  label:
                    "CR-1 - Conditional Resident (Spouse of US Citizen, married <2 years)",
                },
                { value: "K-1", label: "K-1 - Fiancé(e) Visa" },
                { value: "IR-5", label: "IR-5 - Parent of US Citizen" },
                {
                  value: "IR-2",
                  label: "IR-2 - Unmarried Child of US Citizen",
                },
                { value: "F-1", label: "F-1 - Student Visa" },
                { value: "H-1B", label: "H-1B - Specialty Occupation" },
                { value: "B1/B2", label: "B1/B2 - Visitor Visa" },
                { value: "Other", label: "Other" },
              ]}
              placeholder="Select visa type"
            />
          </FormSection>

          <FormSection
            title="Sponsor Information"
            description="If someone is sponsoring your visa application"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                label="Sponsor's First Name"
                value={formData.sponsor?.name?.first || ""}
                onChange={(v) =>
                  handleNestedChange("sponsor", "name", {
                    ...formData.sponsor?.name,
                    first: v,
                  })
                }
                placeholder="First Name"
              />
              <FormField
                label="Sponsor's Middle Name"
                value={formData.sponsor?.name?.middle || ""}
                onChange={(v) =>
                  handleNestedChange("sponsor", "name", {
                    ...formData.sponsor?.name,
                    middle: v,
                  })
                }
                placeholder="Middle Name"
              />
              <FormField
                label="Sponsor's Last Name"
                value={formData.sponsor?.name?.last || ""}
                onChange={(v) =>
                  handleNestedChange("sponsor", "name", {
                    ...formData.sponsor?.name,
                    last: v,
                  })
                }
                placeholder="Last Name"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Sponsor's Date of Birth"
                value={formData.sponsor?.dateOfBirth || ""}
                onChange={(v) =>
                  handleNestedChange("sponsor", "dateOfBirth", v)
                }
                type="date"
              />
              <FormField
                label="Sponsor's Phone"
                value={formData.sponsor?.phone || ""}
                onChange={(v) => handleNestedChange("sponsor", "phone", v)}
                placeholder="+1 (555) 000-0000"
              />
            </div>
          </FormSection>

          <FormSection
            title="Beneficiary Information"
            description="If you are sponsoring someone else's visa"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                label="Beneficiary's First Name"
                value={formData.beneficiary?.name?.first || ""}
                onChange={(v) =>
                  handleNestedChange("beneficiary", "name", {
                    ...formData.beneficiary?.name,
                    first: v,
                  })
                }
                placeholder="First Name"
              />
              <FormField
                label="Beneficiary's Middle Name"
                value={formData.beneficiary?.name?.middle || ""}
                onChange={(v) =>
                  handleNestedChange("beneficiary", "name", {
                    ...formData.beneficiary?.name,
                    middle: v,
                  })
                }
                placeholder="Middle Name"
              />
              <FormField
                label="Beneficiary's Last Name"
                value={formData.beneficiary?.name?.last || ""}
                onChange={(v) =>
                  handleNestedChange("beneficiary", "name", {
                    ...formData.beneficiary?.name,
                    last: v,
                  })
                }
                placeholder="Last Name"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Beneficiary's Date of Birth"
                value={formData.beneficiary?.dateOfBirth || ""}
                onChange={(v) =>
                  handleNestedChange("beneficiary", "dateOfBirth", v)
                }
                type="date"
              />
              <FormField
                label="Beneficiary's Country of Residence"
                value={formData.beneficiary?.countryOfResidence || ""}
                onChange={(v) =>
                  handleNestedChange("beneficiary", "countryOfResidence", v)
                }
                placeholder="Country"
              />
            </div>
          </FormSection>
        </div>
      ),
    },
    {
      title: "Immigration & Documents",
      description: "Your immigration history and document readiness",
      render: () => (
        <div className="space-y-5">
          <FormSection title="Citizenship Status">
            <FormSelect
              label="What is your current US immigration status?"
              value={formData.citizenshipStatus || "Other"}
              onChange={(v) => handleChange("citizenshipStatus", v)}
              options={[
                { value: "USCitizen", label: "U.S. Citizen" },
                {
                  value: "LPR",
                  label: "Lawful Permanent Resident (Green Card Holder)",
                },
                { value: "Other", label: "Other / None" },
              ]}
            />

            {formData.citizenshipStatus === "USCitizen" && (
              <div className="mt-4 p-4 bg-rahvana-primary-pale/30 rounded-lg border border-rahvana-primary-pale space-y-4">
                <p className="text-xs font-semibold text-rahvana-primary uppercase tracking-wider">
                  Naturalization Details
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    label="Certificate Number"
                    value={formData.naturalizationInfo?.certificateNumber || ""}
                    onChange={(v) =>
                      handleNestedChange(
                        "naturalizationInfo",
                        "certificateNumber",
                        v,
                      )
                    }
                    placeholder="Naturalization Certificate #"
                  />
                  <FormField
                    label="Date of Issuance"
                    value={formData.naturalizationInfo?.dateOfIssuance || ""}
                    onChange={(v) =>
                      handleNestedChange(
                        "naturalizationInfo",
                        "dateOfIssuance",
                        v,
                      )
                    }
                    type="date"
                  />
                </div>
                <FormField
                  label="Place of Issuance"
                  value={formData.naturalizationInfo?.placeOfIssuance || ""}
                  onChange={(v) =>
                    handleNestedChange(
                      "naturalizationInfo",
                      "placeOfIssuance",
                      v,
                    )
                  }
                  placeholder="City, State"
                />
              </div>
            )}
          </FormSection>

          <FormSection title="Immigration History">
            <div className="space-y-3 bg-slate-50 rounded-md px-4 py-3 border border-slate-200">
              <FormCheckbox
                id="prevVisa"
                label="I have applied for a US visa before"
                checked={
                  formData.immigrationHistory?.previousVisaApplications || false
                }
                onCheckedChange={(checked) =>
                  handleNestedChange(
                    "immigrationHistory",
                    "previousVisaApplications",
                    checked,
                  )
                }
              />
              <FormCheckbox
                id="prevDenial"
                label="I have been denied a visa before"
                checked={
                  formData.immigrationHistory?.previousVisaDenial || false
                }
                onCheckedChange={(checked) =>
                  handleNestedChange(
                    "immigrationHistory",
                    "previousVisaDenial",
                    checked,
                  )
                }
                variant="warning"
              />
              <FormCheckbox
                id="overstay"
                label="I have overstayed a visa or violated terms"
                checked={
                  formData.immigrationHistory?.overstayOrViolation || false
                }
                onCheckedChange={(checked) =>
                  handleNestedChange(
                    "immigrationHistory",
                    "overstayOrViolation",
                    checked,
                  )
                }
                variant="warning"
              />
              <FormCheckbox
                id="criminal"
                label="I have a criminal record (anywhere in world)"
                checked={formData.immigrationHistory?.criminalRecord || false}
                onCheckedChange={(checked) =>
                  handleNestedChange(
                    "immigrationHistory",
                    "criminalRecord",
                    checked,
                  )
                }
                variant="warning"
              />
              <FormCheckbox
                id="military"
                label="I have served in the military"
                checked={
                  formData.immigrationHistory?.priorMilitaryService || false
                }
                onCheckedChange={(checked) =>
                  handleNestedChange(
                    "immigrationHistory",
                    "priorMilitaryService",
                    checked,
                  )
                }
              />
            </div>
          </FormSection>

          <FormSection
            title="Relationship Evidence"
            description="Do you have these proofs available?"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50 rounded-md px-4 py-3 border border-slate-200">
              <FormCheckbox
                id="cohabitation"
                label="Proof of living together (Lease/Deed)"
                checked={formData.relationship?.cohabitationProof || false}
                onCheckedChange={(checked) =>
                  handleNestedChange(
                    "relationship",
                    "cohabitationProof",
                    checked,
                  )
                }
              />
              <FormCheckbox
                id="financial"
                label="Joint Financial Accounts"
                checked={
                  formData.relationship?.sharedFinancialAccounts || false
                }
                onCheckedChange={(checked) =>
                  handleNestedChange(
                    "relationship",
                    "sharedFinancialAccounts",
                    checked,
                  )
                }
              />
              <FormCheckbox
                id="wedding"
                label="Wedding Photos"
                checked={formData.relationship?.weddingPhotos || false}
                onCheckedChange={(checked) =>
                  handleNestedChange("relationship", "weddingPhotos", checked)
                }
              />
              <FormCheckbox
                id="comms"
                label="Communication Logs (Chats/Calls)"
                checked={formData.relationship?.communicationLogs || false}
                onCheckedChange={(checked) =>
                  handleNestedChange(
                    "relationship",
                    "communicationLogs",
                    checked,
                  )
                }
              />
            </div>
          </FormSection>

          <FormSection
            title="Document Readiness"
            description="Check documents you currently have available"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50 rounded-md px-4 py-3 border border-slate-200">
              <FormCheckbox
                id="hasPassport"
                label="Valid Passport"
                checked={formData.documents?.hasPassport || false}
                onCheckedChange={(checked) =>
                  handleNestedChange("documents", "hasPassport", checked)
                }
              />
              <FormCheckbox
                id="hasBirthCert"
                label="Birth Certificate"
                checked={formData.documents?.hasBirthCertificate || false}
                onCheckedChange={(checked) =>
                  handleNestedChange(
                    "documents",
                    "hasBirthCertificate",
                    checked,
                  )
                }
              />
              <FormCheckbox
                id="hasMarriageCert"
                label="Marriage Certificate"
                checked={formData.documents?.hasMarriageCertificate || false}
                onCheckedChange={(checked) =>
                  handleNestedChange(
                    "documents",
                    "hasMarriageCertificate",
                    checked,
                  )
                }
              />
              <FormCheckbox
                id="hasPolice"
                label="Police Certificate"
                checked={formData.documents?.hasPoliceCertificate || false}
                onCheckedChange={(checked) =>
                  handleNestedChange(
                    "documents",
                    "hasPoliceCertificate",
                    checked,
                  )
                }
              />
              <FormCheckbox
                id="hasTax"
                label="Tax Returns (Last 3 Years)"
                checked={formData.financialProfile?.hasTaxReturns || false}
                onCheckedChange={(checked) =>
                  handleNestedChange(
                    "financialProfile",
                    "hasTaxReturns",
                    checked,
                  )
                }
              />
              <FormCheckbox
                id="hasPaystubs"
                label="Recent Paystubs"
                checked={formData.financialProfile?.hasPaystubs || false}
                onCheckedChange={(checked) =>
                  handleNestedChange("financialProfile", "hasPaystubs", checked)
                }
              />
            </div>
          </FormSection>
        </div>
      ),
    },
    {
      title: "Legal & Eligibility Details",
      description: "Advanced details for visa eligibility assessment",
      render: () => (
        <div className="space-y-5">
          <FormSection title="Status & Intent">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormSelect
                label="How did you obtain your status?"
                value={formData.visaEligibility?.statusOrigin || ""}
                onChange={(v) =>
                  handleNestedChange("visaEligibility", "statusOrigin", v)
                }
                options={[
                  { value: "BIRTH", label: "By Birth" },
                  { value: "NATURALIZED", label: "Naturalized" },
                  { value: "GREEN_CARD", label: "Green Card Holder" },
                ]}
                placeholder="Select origin"
              />
              <FormSelect
                label="Intent of Stay"
                value={formData.visaEligibility?.intent || ""}
                onChange={(v) =>
                  handleNestedChange("visaEligibility", "intent", v)
                }
                options={[
                  { value: "PERMANENT", label: "Permanent (Immigrant)" },
                  { value: "TEMPORARY", label: "Temporary (Non-Immigrant)" },
                ]}
                placeholder="Select intent"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <FormSelect
                label="Sponsorship Base"
                value={formData.visaEligibility?.sponsorBase || ""}
                onChange={(v) =>
                  handleNestedChange("visaEligibility", "sponsorBase", v)
                }
                options={[
                  { value: "FAMILY", label: "Family-Based" },
                  { value: "EMPLOYMENT", label: "Employment-Based" },
                  { value: "INVESTMENT", label: "Investment" },
                  { value: "HUMANITARIAN", label: "Humanitarian" },
                ]}
                placeholder="Select base"
              />
              <FormSelect
                label="Legal Relationship Status"
                value={formData.visaEligibility?.legalStatus || ""}
                onChange={(v) =>
                  handleNestedChange("visaEligibility", "legalStatus", v)
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
                placeholder="For parent/child cases"
              />
            </div>
          </FormSection>

          <FormSection title="History & Violations">
            <div className="space-y-3">
              <FormSelect
                label="Any history of visa violations?"
                value={formData.visaEligibility?.violationHistory || ""}
                onChange={(v) =>
                  handleNestedChange("visaEligibility", "violationHistory", v)
                }
                options={[
                  { value: "NO", label: "No" },
                  { value: "YES", label: "Yes" },
                  { value: "NOT_SURE", label: "Not Sure" },
                ]}
              />
            </div>
          </FormSection>
        </div>
      ),
    },
  ];

  const handleSubmit = async () => {
    try {
      setLoading(true);

      // ── SECURE SAVE: route data through server so sensitive fields
      // (SSN, CNIC, Passport, Phone, Income etc.) are encrypted BEFORE
      // being written to the database. Direct Supabase client calls from
      // the browser would store everything in plain text. ──────────────
      const response = await fetch("/api/profile/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile_details: formData }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to save profile");
      }

      router.push("/dashboard");
    } catch (err) {
      console.error("Error saving profile:", err);
      if (err instanceof Error) {
        setError(err.message || "Failed to save profile");
      } else {
        setError("Failed to save profile");
      }
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((curr) => curr + 1);
      window.scrollTo(0, 0);
    } else {
      handleSubmit();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep((curr) => curr - 1);
      window.scrollTo(0, 0);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      {/* Header with step indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 border-b border-slate-100 px-4 sm:px-5 py-3 sm:py-4 bg-slate-50/50">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            {steps[currentStep].title}
          </h2>
          {steps[currentStep].description && (
            <p className="text-xs text-slate-500 mt-0.5">
              {steps[currentStep].description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500 self-start sm:self-auto">
          <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-md font-medium">
            Step {currentStep + 1} of {steps.length}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-slate-100">
        <div
          className="h-full bg-slate-700 transition-all duration-300"
          style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
        />
      </div>

      <div className="p-4 sm:p-5">
        {error && (
          <div className="mb-4 px-3 py-2 bg-red-50 border border-red-200 text-red-700 rounded-md text-xs">
            {error}
          </div>
        )}

        {/* Step Content */}
        <div className="mb-5">{steps[currentStep].render()}</div>

        {/* Navigation */}
        <div className="flex justify-between pt-4 border-t border-slate-100">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 0 || loading}
            className="h-9 px-4 text-sm bg-transparent"
          >
            <ChevronLeft className="w-4 h-4 mr-1.5" />
            Back
          </Button>

          <Button
            onClick={nextStep}
            disabled={loading}
            className="h-9 px-4 text-sm min-w-30"
          >
            {loading ? (
              <Loader size="sm" text="Saving..." />
            ) : currentStep === steps.length - 1 ? (
              <>
                Save & Complete
                <Save className="ml-1.5 w-3.5 h-3.5" />
              </>
            ) : (
              <>
                Continue
                <ChevronRight className="ml-1.5 w-3.5 h-3.5" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
