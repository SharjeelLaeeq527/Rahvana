import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormSelections } from "../types/221g";
import StaticCountryAutocomplete from "@/app/components/shared/StaticCountryAutocomplete";
import { CustomDropdown } from "@/app/components/shared/CustomDropdown";
import { Settings } from "lucide-react";

interface Actual221GFormCheckerProps {
  selectedItems: FormSelections;
  onSelectionChange: (selected: FormSelections) => void;
  onNext: () => void;
  smartModeEnabled?: boolean;
  consularPost?: string;
  visaType?: string;
}

export default function Actual221GFormChecker({
  selectedItems,
  onSelectionChange,
  onNext,
  smartModeEnabled = false,
  consularPost,
  visaType,
}: Actual221GFormCheckerProps) {
  const visaUnitLabel =
    visaType?.toLowerCase() === "nonimmigrant" ? "Nonimmigrant Visa Unit" : "Immigrant Visa Unit";
  const handleCheckboxChange = <T extends keyof FormSelections>(
    fieldId: T,
    value: boolean = true
  ) => {
    const newSelected = {
      ...selectedItems,
      [fieldId]: value,
    } as FormSelections;
    onSelectionChange(newSelected);
  };

  const sponsorStructure = selectedItems.i864_sponsor_structure || "";
  const showJointSponsorName =
    sponsorStructure === "joint-sponsor" || sponsorStructure === "joint-sponsor-hm";
  const showHouseholdMemberName =
    sponsorStructure === "petitioner-hm" || sponsorStructure === "joint-sponsor-hm";

  const handleInputChange = <T extends keyof FormSelections>(fieldId: T, value: string) => {
    const newSelected = {
      ...selectedItems,
      [fieldId]: value,
    } as FormSelections;
    onSelectionChange(newSelected);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-primary text-2xl font-bold">
          What Did Your 221(g) Letter Request?
        </CardTitle>
        <CardDescription>
          Select every item your letter asked for, we'll build your action plan from this
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="bg-primary/10 border-primary/20 mb-6 rounded-lg border p-4">
          <h3 className="text-primary text-center text-lg font-semibold">
            {consularPost || "Your Embassy / Consulate"}
          </h3>
          <h4 className="text-primary text-center font-medium">{visaUnitLabel}</h4>
        </div>

        <div className="sm:bg-card sm:border-border space-y-4 sm:rounded-lg sm:border-2 sm:p-4 sm:shadow-sm">
          <h4 className="text-foreground mb-4 text-lg font-bold">SELECT WHAT WAS REQUESTED</h4>

          {/* Administrative processing */}
          <div className="mb-3 flex items-start space-x-2">
            <Checkbox
              id="admin_processing"
              checked={!!selectedItems.admin_processing}
              onCheckedChange={(checked) =>
                handleCheckboxChange("admin_processing", checked as boolean)
              }
              className="mt-1"
            />
            <Label htmlFor="admin_processing" className="cursor-pointer text-sm font-normal">
              <span className="font-semibold">Administrative processing</span>{" "}
              <span className="text-muted-foreground italic">
                (you will be notified if further action is needed)
              </span>
            </Label>
          </div>

          {/* Passport */}
          <div className="mb-3 flex items-start space-x-2">
            <Checkbox
              id="passport"
              checked={!!selectedItems.passport}
              onCheckedChange={(checked) => handleCheckboxChange("passport", checked as boolean)}
              className="mt-1"
            />
            <Label htmlFor="passport" className="cursor-pointer text-sm font-normal">
              <span className="font-semibold">Passport</span>{" "}
              <span className="text-muted-foreground italic">(submit via courier)</span>
            </Label>
          </div>

          {/* Medical examination */}
          <div className="mb-3 flex items-start space-x-2">
            <Checkbox
              id="medical_examination"
              checked={!!selectedItems.medical_examination}
              onCheckedChange={(checked) =>
                handleCheckboxChange("medical_examination", checked as boolean)
              }
              className="mt-1"
            />
            <Label htmlFor="medical_examination" className="cursor-pointer text-sm font-normal">
              <span className="font-semibold">Medical examination</span>{" "}
              <span className="text-muted-foreground italic">(through panel physician)</span>
            </Label>
          </div>

          {/* Original NADRA Family Registration Certificate */}
          <div className="mb-3 flex items-start space-x-2">
            <Checkbox
              id="nadra_family_reg"
              checked={!!selectedItems.nadra_family_reg}
              onCheckedChange={(checked) =>
                handleCheckboxChange("nadra_family_reg", checked as boolean)
              }
              className="mt-1"
            />
            <div className="flex-1">
              <Label htmlFor="nadra_family_reg" className="cursor-pointer text-sm font-normal">
                Original{" "}
                <span className="font-semibold">NADRA Family Registration Certificate</span>{" "}
                <span className="text-muted-foreground italic">(submit via courier)</span> for:{" "}
                <Input
                  type="text"
                  placeholder="(optional)"
                  className="border-grey-500 border-input focus:border-ring inline-block h-6 w-56 rounded-none px-2 focus:ring-0"
                  value={selectedItems.nadra_family_reg_name || ""}
                  onChange={(e) => handleInputChange("nadra_family_reg_name", e.target.value)}
                />
              </Label>
            </div>
          </div>

          {/* Original NADRA Birth Cert. */}
          <div className="mb-3 flex items-start space-x-2">
            <Checkbox
              id="nadra_birth_cert"
              checked={!!selectedItems.nadra_birth_cert}
              onCheckedChange={(checked) =>
                handleCheckboxChange("nadra_birth_cert", checked as boolean)
              }
              className="mt-1"
            />
            <div className="flex-1">
              <Label htmlFor="nadra_birth_cert" className="cursor-pointer text-sm font-normal">
                Original <span className="font-semibold">NADRA Birth Cert.</span>{" "}
                <span className="text-muted-foreground italic">(submit via courier)</span>
              </Label>
              <div className="mt-1 ml-6 flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <Checkbox
                    id="nadra_birth_cert_petitioner"
                    checked={!!selectedItems.nadra_birth_cert_petitioner}
                    onCheckedChange={(checked) =>
                      handleCheckboxChange("nadra_birth_cert_petitioner", checked as boolean)
                    }
                  />
                  <Label htmlFor="nadra_birth_cert_petitioner" className="cursor-pointer text-xs">
                    Petitioner
                  </Label>
                </div>
                <div className="flex items-center space-x-1">
                  <Checkbox
                    id="nadra_birth_cert_beneficiary"
                    checked={!!selectedItems.nadra_birth_cert_beneficiary}
                    onCheckedChange={(checked) =>
                      handleCheckboxChange("nadra_birth_cert_beneficiary", checked as boolean)
                    }
                  />
                  <Label htmlFor="nadra_birth_cert_beneficiary" className="cursor-pointer text-xs">
                    Beneficiary
                  </Label>
                </div>
              </div>
            </div>
          </div>

          {/* Original NADRA Marriage Certificate */}
          <div className="mb-3 flex items-start space-x-2">
            <Checkbox
              id="nadra_marriage_cert"
              checked={!!selectedItems.nadra_marriage_cert}
              onCheckedChange={(checked) =>
                handleCheckboxChange("nadra_marriage_cert", checked as boolean)
              }
              className="mt-1"
            />
            <Label htmlFor="nadra_marriage_cert" className="cursor-pointer text-sm font-normal">
              Original <span className="font-semibold">NADRA Marriage Certificate</span>{" "}
              <span className="text-muted-foreground italic">(submit via courier)</span>
            </Label>
          </div>

          {/* Original Nikah Nama */}
          <div className="mb-3 flex items-start space-x-2">
            <Checkbox
              id="nikah_nama"
              checked={!!selectedItems.nikah_nama}
              onCheckedChange={(checked) => handleCheckboxChange("nikah_nama", checked as boolean)}
              className="mt-1"
            />
            <div className="flex-1">
              <Label htmlFor="nikah_nama" className="cursor-pointer text-sm font-normal">
                Original <span className="font-semibold">Nikah Nama</span>{" "}
                <span className="text-muted-foreground italic">(submit via courier)</span>
              </Label>
              {!!selectedItems.nikah_nama && (
                <div className="mt-2 rounded-md border border-amber-200 bg-amber-50 p-2 text-xs font-medium text-amber-700">
                  Note: You must also submit a Computerized Marriage Registration Certificate (MRC)
                  and the beneficiary&apos;s CNIC showing husband&apos;s name.
                </div>
              )}
            </div>
          </div>

          {/* Original NADRA Divorce Cert. */}
          <div className="mb-3 flex items-start space-x-2">
            <Checkbox
              id="nadra_divorce_cert"
              checked={!!selectedItems.nadra_divorce_cert}
              onCheckedChange={(checked) =>
                handleCheckboxChange("nadra_divorce_cert", checked as boolean)
              }
              className="mt-1"
            />
            <div className="flex-1">
              <Label htmlFor="nadra_divorce_cert" className="cursor-pointer text-sm font-normal">
                Original <span className="font-semibold">NADRA Divorce Cert.</span>{" "}
                <span className="text-muted-foreground italic">(submit via courier)</span>
              </Label>
              <div className="mt-1 ml-6 flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <Checkbox
                    id="nadra_divorce_cert_petitioner"
                    checked={!!selectedItems.nadra_divorce_cert_petitioner}
                    onCheckedChange={(checked) =>
                      handleCheckboxChange("nadra_divorce_cert_petitioner", checked as boolean)
                    }
                  />
                  <Label htmlFor="nadra_divorce_cert_petitioner" className="cursor-pointer text-xs">
                    Petitioner
                  </Label>
                </div>
                <div className="flex items-center space-x-1">
                  <Checkbox
                    id="nadra_divorce_cert_beneficiary"
                    checked={!!selectedItems.nadra_divorce_cert_beneficiary}
                    onCheckedChange={(checked) =>
                      handleCheckboxChange("nadra_divorce_cert_beneficiary", checked as boolean)
                    }
                  />
                  <Label
                    htmlFor="nadra_divorce_cert_beneficiary"
                    className="cursor-pointer text-xs"
                  >
                    Beneficiary
                  </Label>
                </div>
              </div>
            </div>
          </div>

          {/* Original U.S. Divorce Decree */}
          <div className="mb-3 flex items-start space-x-2">
            <Checkbox
              id="us_divorce_decree"
              checked={!!selectedItems.us_divorce_decree}
              onCheckedChange={(checked) =>
                handleCheckboxChange("us_divorce_decree", checked as boolean)
              }
              className="mt-1"
            />
            <Label htmlFor="us_divorce_decree" className="cursor-pointer text-sm font-normal">
              Original <span className="font-semibold">U.S. Divorce Decree</span> or certified copy{" "}
              <span className="text-muted-foreground italic">(submit via courier)</span>
            </Label>
          </div>

          {/* Original Death Certificate */}
          <div className="mb-3 flex items-start space-x-2">
            <Checkbox
              id="death_certificate"
              checked={!!selectedItems.death_certificate}
              onCheckedChange={(checked) =>
                handleCheckboxChange("death_certificate", checked as boolean)
              }
              className="mt-1"
            />
            <div className="flex-1">
              <Label htmlFor="death_certificate" className="cursor-pointer text-sm font-normal">
                Original <span className="font-semibold">Death Certificate</span>{" "}
                <span className="text-muted-foreground italic">(submit via courier)</span> for:{" "}
                <Input
                  type="text"
                  placeholder=""
                  className="border-grey-500 border-input focus:border-ring inline-block h-6 w-56 rounded-none px-2 focus:ring-0"
                  value={selectedItems.death_certificate_name || ""}
                  onChange={(e) => handleInputChange("death_certificate_name", e.target.value)}
                />
              </Label>
            </div>
          </div>

          {/* Original Police Certificate */}
          <div className="mb-3 flex items-start space-x-2">
            <Checkbox
              id="police_certificate"
              checked={!!selectedItems.police_certificate}
              onCheckedChange={(checked) =>
                handleCheckboxChange("police_certificate", checked as boolean)
              }
              className="mt-1"
            />
            <div className="flex-1">
              <Label htmlFor="police_certificate" className="cursor-pointer text-sm font-normal">
                Original <span className="font-semibold">Police Certificate</span>{" "}
                <span className="text-muted-foreground italic">(submit via courier)</span> for
                country:{" "}
                <StaticCountryAutocomplete
                  className="w-full"
                  inputClassName="h-6 px-2 border-grey-500 border-input rounded-none focus:border-ring focus:ring-0"
                  placeholder=""
                  value={selectedItems.police_certificate_country || ""}
                  onChange={(value) => handleInputChange("police_certificate_country", value)}
                />
              </Label>
            </div>
          </div>

          {/* English translation */}
          <div className="mb-3 flex items-start space-x-2">
            <Checkbox
              id="english_translation"
              checked={!!selectedItems.english_translation}
              onCheckedChange={(checked) =>
                handleCheckboxChange("english_translation", checked as boolean)
              }
              className="mt-1"
            />
            <div className="flex-1">
              <Label htmlFor="english_translation" className="cursor-pointer text-sm font-normal">
                <span className="font-semibold">English translation</span>{" "}
                <span className="text-muted-foreground italic">(submit via courier)</span> of
                document:{" "}
                <Input
                  type="text"
                  placeholder=""
                  className="border-grey-500 border-input focus:border-ring inline-block h-6 w-56 rounded-none px-2 focus:ring-0"
                  value={selectedItems.english_translation_document || ""}
                  onChange={(e) =>
                    handleInputChange("english_translation_document", e.target.value)
                  }
                />
              </Label>
            </div>
          </div>

          {/* I-864 Affidavit of Support (Restructured) */}
          <div className="mb-3 flex items-start space-x-2">
            <Checkbox
              id="i864_affidavit"
              checked={!!selectedItems.i864_affidavit}
              onCheckedChange={(checked) =>
                handleCheckboxChange("i864_affidavit", checked as boolean)
              }
              className="mt-1"
            />
            <div className="flex-1">
              <Label htmlFor="i864_affidavit" className="cursor-pointer text-sm font-normal">
                <span className="font-semibold">I-864 Affidavit of Support</span>
              </Label>

              {smartModeEnabled ? (
                // --- PREMIUM SEQUENTIAL LAYOUT (Only for Smart Mode) ---
                <>
                  {!!selectedItems.i864_affidavit && (
                    <div className="animate-in fade-in slide-in-from-top-2 mt-4 space-y-4 rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 shadow-sm duration-500 sm:ml-6 sm:space-y-6 sm:p-5">
                      {/* Submission Method Selection */}
                      <div className="flex flex-col space-y-2 border-b border-emerald-100 pb-4">
                        <Label className="mb-1 text-[11px] font-bold tracking-wider text-emerald-900 uppercase">
                          Submission Method *
                        </Label>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
                          <div className="group flex items-center space-x-2">
                            <Checkbox
                              id="i864_courier"
                              checked={!!selectedItems.i864_courier}
                              onCheckedChange={(checked) =>
                                handleCheckboxChange("i864_courier", checked as boolean)
                              }
                              className="data-[state=checked]:border-emerald-600 data-[state=checked]:bg-emerald-600"
                            />
                            <Label
                              htmlFor="i864_courier"
                              className="cursor-pointer text-xs font-semibold text-emerald-800 transition-colors group-hover:text-emerald-900"
                            >
                              Submit via Courier
                            </Label>
                          </div>
                          <div className="group flex items-center space-x-2">
                            <Checkbox
                              id="i864_online"
                              checked={!!selectedItems.i864_online}
                              onCheckedChange={(checked) =>
                                handleCheckboxChange("i864_online", checked as boolean)
                              }
                              className="data-[state=checked]:border-emerald-600 data-[state=checked]:bg-emerald-600"
                            />
                            <Label
                              htmlFor="i864_online"
                              className="cursor-pointer text-xs font-semibold text-emerald-800 transition-colors group-hover:text-emerald-900"
                            >
                              Submit Online (CEAC)
                            </Label>
                          </div>
                        </div>
                      </div>

                      {/* Sponsor Structure */}
                      <div className="space-y-2">
                        <Label className="text-foreground group flex items-center text-sm font-semibold">
                          Sponsor Structure *
                        </Label>
                        <CustomDropdown
                          value={selectedItems.i864_sponsor_structure || ""}
                          onChange={(value) => handleInputChange("i864_sponsor_structure", value)}
                          options={[
                            { value: "petitioner-only", label: "Petitioner only" },
                            {
                              value: "petitioner-hm",
                              label: "Petitioner + Household Member (I-864A)",
                            },
                            {
                              value: "joint-sponsor",
                              label: "Joint Sponsor (separate I-864)",
                            },
                            {
                              value: "joint-sponsor-hm",
                              label: "Joint Sponsor + Household Member (I-864A)",
                            },
                          ]}
                          placeholder="How are you sponsoring?"
                          className="w-full [&_button]:h-10 [&_button]:w-full [&_button]:min-w-0 [&_button]:bg-white [&_button]:text-emerald-900"
                        />
                      </div>

                      {/* Step 2: Sponsor Names */}
                      {!!sponsorStructure && (
                        <div className="animate-in fade-in space-y-4 duration-500">
                          <Label className="text-foreground flex items-center text-sm font-semibold">
                            Sponsor Identification
                          </Label>
                          <div className="grid grid-cols-1 gap-4 sm:ml-7 sm:grid-cols-2">
                            <div className="space-y-1.5 focus-within:ring-0">
                              <Label className="ml-1 text-[11px] font-medium text-emerald-800/70">
                                Petitioner Full Name (optional)
                              </Label>
                              <Input
                                type="text"
                                value={selectedItems.i864_petitioner_name || ""}
                                onChange={(e) =>
                                  handleInputChange("i864_petitioner_name", e.target.value)
                                }
                                placeholder="Full name as on I-864"
                                className="h-10 border-emerald-100 bg-white font-medium shadow-none transition-all hover:border-emerald-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                              />
                            </div>

                            {showJointSponsorName && (
                              <div className="animate-in slide-in-from-left-2 space-y-1.5 duration-500">
                                <Label className="ml-1 text-[11px] font-medium text-emerald-800/70">
                                  Joint Sponsor Full Name (optional)
                                </Label>
                                <Input
                                  type="text"
                                  value={selectedItems.i864_joint_sponsor_name || ""}
                                  onChange={(e) =>
                                    handleInputChange("i864_joint_sponsor_name", e.target.value)
                                  }
                                  placeholder="Full name of joint sponsor"
                                  className="h-10 border-emerald-100 bg-white font-medium shadow-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                />
                              </div>
                            )}

                            {showHouseholdMemberName && (
                              <div className="animate-in slide-in-from-left-2 space-y-1.5 duration-500">
                                <Label className="ml-1 text-[11px] font-medium text-emerald-800/70">
                                  Household Member Name (optional)
                                </Label>
                                <Input
                                  type="text"
                                  value={selectedItems.i864_household_member_name || ""}
                                  onChange={(e) =>
                                    handleInputChange("i864_household_member_name", e.target.value)
                                  }
                                  placeholder="Name from I-864A contract"
                                  className="h-10 border-emerald-100 bg-white font-medium shadow-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Step 3: Forms Requested */}
                      <div className="space-y-3">
                        <Label className="text-foreground flex items-center text-sm font-semibold">
                          Forms Requested
                        </Label>
                        <div className="grid grid-cols-1 gap-2 sm:ml-7 sm:grid-cols-2 md:grid-cols-4">
                          {[
                            // { id: "i864_petitioner", label: "I-864" },
                            { id: "i864a", label: "I-864A" },
                            { id: "i134", label: "I-134" },
                            { id: "i864w", label: "I-864W" },
                          ].map((form) => (
                            <div
                              key={form.id}
                              className="group flex items-center space-x-2 rounded-lg border border-emerald-50 bg-white p-2 shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-all hover:border-emerald-300"
                            >
                              <Checkbox
                                id={`premium_${form.id}`}
                                checked={!!selectedItems[form.id as keyof FormSelections]}
                                onCheckedChange={(checked) =>
                                  handleCheckboxChange(
                                    form.id as keyof FormSelections,
                                    checked as boolean
                                  )
                                }
                                className="data-[state=checked]:border-emerald-600 data-[state=checked]:bg-emerald-600"
                              />
                              <Label
                                htmlFor={`premium_${form.id}`}
                                className="cursor-pointer text-[11px] font-semibold transition-colors group-hover:text-emerald-700"
                              >
                                {form.label}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Step 4: Evidence Required */}
                      <div className="space-y-3">
                        <Label className="text-foreground flex items-center text-sm font-semibold">
                          Financial Evidence Checklist
                        </Label>
                        <div className="grid grid-cols-1 gap-2 sm:ml-7 md:grid-cols-3">
                          {[
                            { id: "tax_1040", label: "Signed Form 1040" },
                            { id: "w2", label: "W-2 Tax Statements" },
                            {
                              id: "irs_transcript",
                              label: "IRS Tax Transcript",
                            },
                          ].map((ev) => (
                            <div
                              key={ev.id}
                              className="group flex items-center space-x-2 rounded-lg border border-emerald-50 bg-white p-2 shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-all hover:border-emerald-300"
                            >
                              <Checkbox
                                id={`premium_${ev.id}`}
                                checked={!!selectedItems[ev.id as keyof FormSelections]}
                                onCheckedChange={(checked) =>
                                  handleCheckboxChange(
                                    ev.id as keyof FormSelections,
                                    checked as boolean
                                  )
                                }
                                className="data-[state=checked]:border-emerald-600 data-[state=checked]:bg-emerald-600"
                              />
                              <Label
                                htmlFor={`premium_${ev.id}`}
                                className="cursor-pointer text-[11px] font-semibold group-hover:text-emerald-700"
                              >
                                {ev.label}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Step 5: Status Documentation */}
                      <div className="space-y-3">
                        <Label className="text-foreground flex items-center text-sm font-semibold">
                          Legal Status Proof
                        </Label>
                        <div className="grid grid-cols-1 gap-2 sm:ml-7 md:grid-cols-2">
                          {[
                            {
                              id: "proof_citizenship",
                              label: "U.S. Citizen/LPR Proof",
                            },
                            { id: "domicile", label: "Proof of Domicile" },
                          ].map((status) => (
                            <div
                              key={status.id}
                              className="group flex items-center space-x-2 rounded-lg border border-emerald-50 bg-white p-2 shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-all hover:border-emerald-300"
                            >
                              <Checkbox
                                id={`premium_${status.id}`}
                                checked={!!selectedItems[status.id as keyof FormSelections]}
                                onCheckedChange={(checked) =>
                                  handleCheckboxChange(
                                    status.id as keyof FormSelections,
                                    checked as boolean
                                  )
                                }
                                className="data-[state=checked]:border-emerald-600 data-[state=checked]:bg-emerald-600"
                              />
                              <Label
                                htmlFor={`premium_${status.id}`}
                                className="cursor-pointer text-[11px] font-semibold group-hover:text-emerald-700"
                              >
                                {status.label}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Step 6: Tax Years */}
                      <div className="space-y-2">
                        <Label className="text-foreground flex items-center text-sm font-semibold">
                          Tax Year(s) Requested
                        </Label>
                        <div className="sm:ml-7">
                          <Input
                            type="text"
                            value={selectedItems.i864_tax_years || ""}
                            onChange={(e) => handleInputChange("i864_tax_years", e.target.value)}
                            placeholder="e.g., 2024, 2023, 2022"
                            className="h-10 border-emerald-100 bg-white shadow-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                          />
                          <div className="mt-2 ml-1 flex text-[10px] font-medium text-emerald-700/80">
                            <Settings className="mr-1.5 flex-shrink-0" size={14} />
                            <span>
                              Only provide years expressly mentioned on your 221(g) letter.
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                // --- ORIGINAL DEFAULT LAYOUT (For non-premium users) ---
                <>
                  <div className="text-muted-foreground mt-1 flex flex-col gap-2 text-xs italic sm:ml-6 sm:flex-row sm:items-center sm:gap-0 sm:space-x-3">
                    <span>(submit via</span>
                    <div className="flex items-center space-x-1">
                      <Checkbox
                        id="i864_courier"
                        checked={!!selectedItems.i864_courier}
                        onCheckedChange={(checked) =>
                          handleCheckboxChange("i864_courier", checked as boolean)
                        }
                      />
                      <Label
                        htmlFor="i864_courier"
                        className="text-muted-foreground cursor-pointer text-xs italic"
                      >
                        courier /
                      </Label>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Checkbox
                        id="i864_online"
                        checked={!!selectedItems.i864_online}
                        onCheckedChange={(checked) =>
                          handleCheckboxChange("i864_online", checked as boolean)
                        }
                      />
                      <Label
                        htmlFor="i864_online"
                        className="text-muted-foreground cursor-pointer text-xs italic"
                      >
                        online)
                      </Label>
                    </div>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-3 sm:ml-6">
                    {/* <div className="flex items-center space-x-1">
                        <Checkbox
                          id="i864_petitioner"
                          checked={!!selectedItems.i864_petitioner}
                          onCheckedChange={(checked) =>
                            handleCheckboxChange(
                              "i864_petitioner",
                              checked as boolean,
                            )
                          }
                        />
                        <Label
                          htmlFor="i864_petitioner"
                          className="text-xs cursor-pointer"
                        >
                          Petitioner
                        </Label>
                      </div> */}
                    <div className="flex items-center space-x-1">
                      <Checkbox
                        id="i864_joint_sponsor"
                        checked={!!selectedItems.i864_joint_sponsor}
                        onCheckedChange={(checked) =>
                          handleCheckboxChange("i864_joint_sponsor", checked as boolean)
                        }
                      />
                      <Label htmlFor="i864_joint_sponsor" className="cursor-pointer text-xs">
                        Joint Sponsor
                      </Label>
                    </div>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 sm:ml-6">
                    <div className="flex items-center space-x-1">
                      <Checkbox
                        id="i864a"
                        checked={!!selectedItems.i864a}
                        onCheckedChange={(checked) =>
                          handleCheckboxChange("i864a", checked as boolean)
                        }
                      />
                      <Label htmlFor="i864a" className="cursor-pointer text-xs">
                        I-864A
                      </Label>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Checkbox
                        id="i134"
                        checked={!!selectedItems.i134}
                        onCheckedChange={(checked) =>
                          handleCheckboxChange("i134", checked as boolean)
                        }
                      />
                      <Label htmlFor="i134" className="cursor-pointer text-xs">
                        I-134
                      </Label>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Checkbox
                        id="i864w"
                        checked={!!selectedItems.i864w}
                        onCheckedChange={(checked) =>
                          handleCheckboxChange("i864w", checked as boolean)
                        }
                      />
                      <Label htmlFor="i864w" className="cursor-pointer text-xs">
                        I-864W
                      </Label>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Checkbox
                        id="tax_1040"
                        checked={!!selectedItems.tax_1040}
                        onCheckedChange={(checked) =>
                          handleCheckboxChange("tax_1040", checked as boolean)
                        }
                      />
                      <Label htmlFor="tax_1040" className="cursor-pointer text-xs">
                        1040
                      </Label>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Checkbox
                        id="w2"
                        checked={!!selectedItems.w2}
                        onCheckedChange={(checked) =>
                          handleCheckboxChange("w2", checked as boolean)
                        }
                      />
                      <Label htmlFor="w2" className="cursor-pointer text-xs">
                        W-2
                      </Label>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Checkbox
                        id="irs_transcript"
                        checked={!!selectedItems.irs_transcript}
                        onCheckedChange={(checked) =>
                          handleCheckboxChange("irs_transcript", checked as boolean)
                        }
                      />
                      <Label htmlFor="irs_transcript" className="cursor-pointer text-xs">
                        IRS tax transcript
                      </Label>
                    </div>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 sm:ml-6">
                    <div className="flex items-center space-x-1">
                      <Checkbox
                        id="proof_citizenship"
                        checked={!!selectedItems.proof_citizenship}
                        onCheckedChange={(checked) =>
                          handleCheckboxChange("proof_citizenship", checked as boolean)
                        }
                      />
                      <Label htmlFor="proof_citizenship" className="cursor-pointer text-xs">
                        Proof of U.S. citizenship or LPR status
                      </Label>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Checkbox
                        id="domicile"
                        checked={!!selectedItems.domicile}
                        onCheckedChange={(checked) =>
                          handleCheckboxChange("domicile", checked as boolean)
                        }
                      />
                      <Label htmlFor="domicile" className="cursor-pointer text-xs">
                        Domicile
                      </Label>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
          {/* DNA test */}
          <div className="mb-3 flex items-start space-x-2">
            <Checkbox
              id="dna_test"
              checked={!!selectedItems.dna_test}
              onCheckedChange={(checked) => handleCheckboxChange("dna_test", checked as boolean)}
              className="mt-1"
            />
            <div className="flex-1">
              <Label htmlFor="dna_test" className="cursor-pointer text-sm font-normal">
                <span className="font-semibold">DNA test</span> recommended for:{" "}
                <Input
                  type="text"
                  placeholder=""
                  className="border-grey-500 border-input focus:border-ring inline-block h-6 w-56 rounded-none px-2 focus:ring-0"
                  value={selectedItems.dna_test_name || ""}
                  onChange={(e) => handleInputChange("dna_test_name", e.target.value)}
                />
              </Label>
            </div>
          </div>

          {/* Other */}
          <div className="mb-3 flex items-start space-x-2">
            <Checkbox
              id="other"
              checked={!!selectedItems.other}
              onCheckedChange={(checked) => handleCheckboxChange("other", checked as boolean)}
              className="mt-1"
            />
            <div className="flex-1">
              <Label htmlFor="other" className="cursor-pointer text-sm font-normal">
                <span className="font-semibold">Other:</span>{" "}
                <Input
                  type="text"
                  placeholder=""
                  className="border-grey-500 border-input focus:border-ring inline-block h-6 w-96 rounded-none px-2 focus:ring-0"
                  value={selectedItems.other_details || ""}
                  onChange={(e) => handleInputChange("other_details", e.target.value)}
                />
              </Label>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
