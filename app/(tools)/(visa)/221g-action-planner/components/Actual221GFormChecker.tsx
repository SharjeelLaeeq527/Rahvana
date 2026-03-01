import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface FormSelections {
  admin_processing?: boolean;
  passport?: boolean;
  medical_examination?: boolean;
  nadra_family_reg?: boolean;
  nadra_birth_cert?: boolean;
  nadra_birth_cert_petitioner?: boolean;
  nadra_birth_cert_beneficiary?: boolean;
  nadra_marriage_cert?: boolean;
  nikah_nama?: boolean;
  nadra_divorce_cert?: boolean;
  nadra_divorce_cert_petitioner?: boolean;
  nadra_divorce_cert_beneficiary?: boolean;
  us_divorce_decree?: boolean;
  death_certificate?: boolean;
  death_certificate_name?: string;
  police_certificate?: boolean;
  police_certificate_country?: string;
  english_translation?: boolean;
  english_translation_document?: string;
  i864_affidavit?: boolean;
  i864_courier?: boolean;
  i864_online?: boolean;
  i864_petitioner?: boolean;
  i864_joint_sponsor?: boolean;
  i864a?: boolean;
  i134?: boolean;
  i864w?: boolean;
  tax_1040?: boolean;
  w2?: boolean;
  irs_transcript?: boolean;
  proof_citizenship?: boolean;
  domicile?: boolean;
  dna_test?: boolean;
  dna_test_name?: string;
  other?: boolean;
  other_details?: string;
}

interface Actual221GFormCheckerProps {
  selectedItems: FormSelections;
  onSelectionChange: (selected: FormSelections) => void;
  onNext: () => void;
}

export default function Actual221GFormChecker({
  selectedItems,
  onSelectionChange,
  onNext,
}: Actual221GFormCheckerProps) {
  const handleCheckboxChange = <T extends keyof FormSelections>(
    fieldId: T,
    value: boolean = true,
  ) => {
    const newSelected = {
      ...selectedItems,
      [fieldId]: value,
    } as FormSelections;
    onSelectionChange(newSelected);
  };

  const handleInputChange = <T extends keyof FormSelections>(
    fieldId: T,
    value: string,
  ) => {
    const newSelected = {
      ...selectedItems,
      [fieldId]: value,
    } as FormSelections;
    onSelectionChange(newSelected);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-primary">
          221(g) Form Checker
        </CardTitle>
        <CardDescription>
          Check the boxes that match your actual 221(g) letter
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6 p-4 bg-primary/10 rounded-lg border border-primary/20">
          <h3 className="font-semibold text-primary text-center text-lg">
            U.S. Embassy Islamabad, Pakistan
          </h3>
          <h4 className="font-medium text-primary text-center">
            Immigrant Visa Unit
          </h4>
        </div>

        <div className="space-y-4">
          <div className="p-6 bg-card rounded-lg border-2 border-border shadow-sm">
            <h4 className="font-bold text-lg mb-6 text-foreground">
              221(g) FORM - REQUIRED DOCUMENTS
            </h4>

            {/* Administrative processing */}
            <div className="flex items-start space-x-2 mb-3">
              <Checkbox
                id="admin_processing"
                checked={!!selectedItems.admin_processing}
                onCheckedChange={(checked) =>
                  handleCheckboxChange("admin_processing", checked as boolean)
                }
                className="mt-1"
              />
              <Label
                htmlFor="admin_processing"
                className="text-sm font-normal cursor-pointer"
              >
                <span className="font-semibold">Administrative processing</span>{" "}
                <span className="italic text-muted-foreground">
                  (you will be notified if further action is needed)
                </span>
              </Label>
            </div>

            {/* Passport */}
            <div className="flex items-start space-x-2 mb-3">
              <Checkbox
                id="passport"
                checked={!!selectedItems.passport}
                onCheckedChange={(checked) =>
                  handleCheckboxChange("passport", checked as boolean)
                }
                className="mt-1"
              />
              <Label
                htmlFor="passport"
                className="text-sm font-normal cursor-pointer"
              >
                <span className="font-semibold">Passport</span>{" "}
                <span className="italic text-muted-foreground">
                  (submit via courier)
                </span>
              </Label>
            </div>

            {/* Medical examination */}
            <div className="flex items-start space-x-2 mb-3">
              <Checkbox
                id="medical_examination"
                checked={!!selectedItems.medical_examination}
                onCheckedChange={(checked) =>
                  handleCheckboxChange(
                    "medical_examination",
                    checked as boolean,
                  )
                }
                className="mt-1"
              />
              <Label
                htmlFor="medical_examination"
                className="text-sm font-normal cursor-pointer"
              >
                <span className="font-semibold">Medical examination</span>{" "}
                <span className="italic text-muted-foreground">
                  (through panel physician)
                </span>
              </Label>
            </div>

            {/* Original NADRA Family Registration Certificate */}
            <div className="flex items-start space-x-2 mb-3">
              <Checkbox
                id="nadra_family_reg"
                checked={!!selectedItems.nadra_family_reg}
                onCheckedChange={(checked) =>
                  handleCheckboxChange("nadra_family_reg", checked as boolean)
                }
                className="mt-1"
              />
              <Label
                htmlFor="nadra_family_reg"
                className="text-sm font-normal cursor-pointer"
              >
                Original{" "}
                <span className="font-semibold">
                  NADRA Family Registration Certificate
                </span>{" "}
                <span className="italic text-muted-foreground">
                  (submit via courier)
                </span>
              </Label>
            </div>

            {/* Original NADRA Birth Cert. */}
            <div className="flex items-start space-x-2 mb-3">
              <Checkbox
                id="nadra_birth_cert"
                checked={!!selectedItems.nadra_birth_cert}
                onCheckedChange={(checked) =>
                  handleCheckboxChange("nadra_birth_cert", checked as boolean)
                }
                className="mt-1"
              />
              <div className="flex-1">
                <Label
                  htmlFor="nadra_birth_cert"
                  className="text-sm font-normal cursor-pointer"
                >
                  Original{" "}
                  <span className="font-semibold">NADRA Birth Cert.</span>{" "}
                  <span className="italic text-muted-foreground">
                    (submit via courier)
                  </span>
                </Label>
                <div className="ml-6 mt-1 flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <Checkbox
                      id="nadra_birth_cert_petitioner"
                      checked={!!selectedItems.nadra_birth_cert_petitioner}
                      onCheckedChange={(checked) =>
                        handleCheckboxChange(
                          "nadra_birth_cert_petitioner",
                          checked as boolean,
                        )
                      }
                    />
                    <Label
                      htmlFor="nadra_birth_cert_petitioner"
                      className="text-xs cursor-pointer"
                    >
                      Petitioner
                    </Label>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Checkbox
                      id="nadra_birth_cert_beneficiary"
                      checked={!!selectedItems.nadra_birth_cert_beneficiary}
                      onCheckedChange={(checked) =>
                        handleCheckboxChange(
                          "nadra_birth_cert_beneficiary",
                          checked as boolean,
                        )
                      }
                    />
                    <Label
                      htmlFor="nadra_birth_cert_beneficiary"
                      className="text-xs cursor-pointer"
                    >
                      Beneficiary
                    </Label>
                  </div>
                </div>
              </div>
            </div>

            {/* Original NADRA Marriage Certificate */}
            <div className="flex items-start space-x-2 mb-3">
              <Checkbox
                id="nadra_marriage_cert"
                checked={!!selectedItems.nadra_marriage_cert}
                onCheckedChange={(checked) =>
                  handleCheckboxChange(
                    "nadra_marriage_cert",
                    checked as boolean,
                  )
                }
                className="mt-1"
              />
              <Label
                htmlFor="nadra_marriage_cert"
                className="text-sm font-normal cursor-pointer"
              >
                Original{" "}
                <span className="font-semibold">
                  NADRA Marriage Certificate
                </span>{" "}
                <span className="italic text-muted-foreground">
                  (submit via courier)
                </span>
              </Label>
            </div>

            {/* Original Nikah Nama */}
            <div className="flex items-start space-x-2 mb-3">
              <Checkbox
                id="nikah_nama"
                checked={!!selectedItems.nikah_nama}
                onCheckedChange={(checked) =>
                  handleCheckboxChange("nikah_nama", checked as boolean)
                }
                className="mt-1"
              />
              <Label
                htmlFor="nikah_nama"
                className="text-sm font-normal cursor-pointer"
              >
                Original <span className="font-semibold">Nikah Nama</span>{" "}
                <span className="italic text-muted-foreground">
                  (submit via courier)
                </span>
              </Label>
            </div>

            {/* Original NADRA Divorce Cert. */}
            <div className="flex items-start space-x-2 mb-3">
              <Checkbox
                id="nadra_divorce_cert"
                checked={!!selectedItems.nadra_divorce_cert}
                onCheckedChange={(checked) =>
                  handleCheckboxChange("nadra_divorce_cert", checked as boolean)
                }
                className="mt-1"
              />
              <div className="flex-1">
                <Label
                  htmlFor="nadra_divorce_cert"
                  className="text-sm font-normal cursor-pointer"
                >
                  Original{" "}
                  <span className="font-semibold">NADRA Divorce Cert.</span>{" "}
                  <span className="italic text-muted-foreground">
                    (submit via courier)
                  </span>
                </Label>
                <div className="ml-6 mt-1 flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <Checkbox
                      id="nadra_divorce_cert_petitioner"
                      checked={!!selectedItems.nadra_divorce_cert_petitioner}
                      onCheckedChange={(checked) =>
                        handleCheckboxChange(
                          "nadra_divorce_cert_petitioner",
                          checked as boolean,
                        )
                      }
                    />
                    <Label
                      htmlFor="nadra_divorce_cert_petitioner"
                      className="text-xs cursor-pointer"
                    >
                      Petitioner
                    </Label>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Checkbox
                      id="nadra_divorce_cert_beneficiary"
                      checked={!!selectedItems.nadra_divorce_cert_beneficiary}
                      onCheckedChange={(checked) =>
                        handleCheckboxChange(
                          "nadra_divorce_cert_beneficiary",
                          checked as boolean,
                        )
                      }
                    />
                    <Label
                      htmlFor="nadra_divorce_cert_beneficiary"
                      className="text-xs cursor-pointer"
                    >
                      Beneficiary
                    </Label>
                  </div>
                </div>
              </div>
            </div>

            {/* Original U.S. Divorce Decree */}
            <div className="flex items-start space-x-2 mb-3">
              <Checkbox
                id="us_divorce_decree"
                checked={!!selectedItems.us_divorce_decree}
                onCheckedChange={(checked) =>
                  handleCheckboxChange("us_divorce_decree", checked as boolean)
                }
                className="mt-1"
              />
              <Label
                htmlFor="us_divorce_decree"
                className="text-sm font-normal cursor-pointer"
              >
                Original{" "}
                <span className="font-semibold">U.S. Divorce Decree</span> or
                certified copy{" "}
                <span className="italic text-muted-foreground">
                  (submit via courier)
                </span>
              </Label>
            </div>

            {/* Original Death Certificate */}
            <div className="flex items-start space-x-2 mb-3">
              <Checkbox
                id="death_certificate"
                checked={!!selectedItems.death_certificate}
                onCheckedChange={(checked) =>
                  handleCheckboxChange("death_certificate", checked as boolean)
                }
                className="mt-1"
              />
              <div className="flex-1">
                <Label
                  htmlFor="death_certificate"
                  className="text-sm font-normal cursor-pointer"
                >
                  Original{" "}
                  <span className="font-semibold">Death Certificate</span>{" "}
                  <span className="italic text-muted-foreground">
                    (submit via courier)
                  </span>{" "}
                  for:{" "}
                  <Input
                    type="text"
                    placeholder=""
                    className="inline-block w-56 h-6 px-2 border-b border-input border-t-0 border-l-0 border-r-0 rounded-none focus:border-ring focus:ring-0"
                    value={selectedItems.death_certificate_name || ""}
                    onChange={(e) =>
                      handleInputChange(
                        "death_certificate_name",
                        e.target.value,
                      )
                    }
                  />
                </Label>
              </div>
            </div>

            {/* Original Police Certificate */}
            <div className="flex items-start space-x-2 mb-3">
              <Checkbox
                id="police_certificate"
                checked={!!selectedItems.police_certificate}
                onCheckedChange={(checked) =>
                  handleCheckboxChange("police_certificate", checked as boolean)
                }
                className="mt-1"
              />
              <div className="flex-1">
                <Label
                  htmlFor="police_certificate"
                  className="text-sm font-normal cursor-pointer"
                >
                  Original{" "}
                  <span className="font-semibold">Police Certificate</span>{" "}
                  <span className="italic text-muted-foreground">
                    (submit via courier)
                  </span>{" "}
                  for country:{" "}
                  <Input
                    type="text"
                    placeholder=""
                    className="inline-block w-56 h-6 px-2 border-b border-input border-t-0 border-l-0 border-r-0 rounded-none focus:border-ring focus:ring-0"
                    value={selectedItems.police_certificate_country || ""}
                    onChange={(e) =>
                      handleInputChange(
                        "police_certificate_country",
                        e.target.value,
                      )
                    }
                  />
                </Label>
              </div>
            </div>

            {/* English translation */}
            <div className="flex items-start space-x-2 mb-3">
              <Checkbox
                id="english_translation"
                checked={!!selectedItems.english_translation}
                onCheckedChange={(checked) =>
                  handleCheckboxChange(
                    "english_translation",
                    checked as boolean,
                  )
                }
                className="mt-1"
              />
              <div className="flex-1">
                <Label
                  htmlFor="english_translation"
                  className="text-sm font-normal cursor-pointer"
                >
                  <span className="font-semibold">English translation</span>{" "}
                  <span className="italic text-muted-foreground">
                    (submit via courier)
                  </span>{" "}
                  of document:{" "}
                  <Input
                    type="text"
                    placeholder=""
                    className="inline-block w-56 h-6 px-2 border-b border-input border-t-0 border-l-0 border-r-0 rounded-none focus:border-ring focus:ring-0"
                    value={selectedItems.english_translation_document || ""}
                    onChange={(e) =>
                      handleInputChange(
                        "english_translation_document",
                        e.target.value,
                      )
                    }
                  />
                </Label>
              </div>
            </div>

            {/* I-864 Affidavit of Support */}
            <div className="flex items-start space-x-2 mb-3">
              <Checkbox
                id="i864_affidavit"
                checked={!!selectedItems.i864_affidavit}
                onCheckedChange={(checked) =>
                  handleCheckboxChange("i864_affidavit", checked as boolean)
                }
                className="mt-1"
              />
              <div className="flex-1">
                <Label
                  htmlFor="i864_affidavit"
                  className="text-sm font-normal cursor-pointer"
                >
                  <span className="font-semibold">
                    I-864 Affidavit of Support
                  </span>
                </Label>
                <div className="ml-6 mt-1 flex items-center space-x-3 text-muted-foreground italic text-xs">
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
                      className="text-xs cursor-pointer italic text-muted-foreground"
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
                      className="text-xs cursor-pointer italic text-muted-foreground"
                    >
                      online)
                    </Label>
                  </div>
                </div>
                <div className="ml-6 mt-1 flex flex-wrap items-center gap-3">
                  <div className="flex items-center space-x-1">
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
                  </div>
                  <div className="flex items-center space-x-1">
                    <Checkbox
                      id="i864_joint_sponsor"
                      checked={!!selectedItems.i864_joint_sponsor}
                      onCheckedChange={(checked) =>
                        handleCheckboxChange(
                          "i864_joint_sponsor",
                          checked as boolean,
                        )
                      }
                    />
                    <Label
                      htmlFor="i864_joint_sponsor"
                      className="text-xs cursor-pointer"
                    >
                      Joint Sponsor
                    </Label>
                  </div>
                </div>
                <div className="ml-6 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <div className="flex items-center space-x-1">
                    <Checkbox
                      id="i864a"
                      checked={!!selectedItems.i864a}
                      onCheckedChange={(checked) =>
                        handleCheckboxChange("i864a", checked as boolean)
                      }
                    />
                    <Label htmlFor="i864a" className="text-xs cursor-pointer">
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
                    <Label htmlFor="i134" className="text-xs cursor-pointer">
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
                    <Label htmlFor="i864w" className="text-xs cursor-pointer">
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
                    <Label
                      htmlFor="tax_1040"
                      className="text-xs cursor-pointer"
                    >
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
                    <Label htmlFor="w2" className="text-xs cursor-pointer">
                      W-2
                    </Label>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Checkbox
                      id="irs_transcript"
                      checked={!!selectedItems.irs_transcript}
                      onCheckedChange={(checked) =>
                        handleCheckboxChange(
                          "irs_transcript",
                          checked as boolean,
                        )
                      }
                    />
                    <Label
                      htmlFor="irs_transcript"
                      className="text-xs cursor-pointer"
                    >
                      IRS tax transcript
                    </Label>
                  </div>
                </div>
                <div className="ml-6 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <div className="flex items-center space-x-1">
                    <Checkbox
                      id="proof_citizenship"
                      checked={!!selectedItems.proof_citizenship}
                      onCheckedChange={(checked) =>
                        handleCheckboxChange(
                          "proof_citizenship",
                          checked as boolean,
                        )
                      }
                    />
                    <Label
                      htmlFor="proof_citizenship"
                      className="text-xs cursor-pointer"
                    >
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
                    <Label
                      htmlFor="domicile"
                      className="text-xs cursor-pointer"
                    >
                      Domicile
                    </Label>
                  </div>
                </div>
              </div>
            </div>

            {/* DNA test */}
            <div className="flex items-start space-x-2 mb-3">
              <Checkbox
                id="dna_test"
                checked={!!selectedItems.dna_test}
                onCheckedChange={(checked) =>
                  handleCheckboxChange("dna_test", checked as boolean)
                }
                className="mt-1"
              />
              <div className="flex-1">
                <Label
                  htmlFor="dna_test"
                  className="text-sm font-normal cursor-pointer"
                >
                  <span className="font-semibold">DNA test</span> recommended
                  for:{" "}
                  <Input
                    type="text"
                    placeholder=""
                    className="inline-block w-56 h-6 px-2 border-b border-input border-t-0 border-l-0 border-r-0 rounded-none focus:border-ring focus:ring-0"
                    value={selectedItems.dna_test_name || ""}
                    onChange={(e) =>
                      handleInputChange("dna_test_name", e.target.value)
                    }
                  />
                </Label>
              </div>
            </div>

            {/* Other */}
            <div className="flex items-start space-x-2 mb-3">
              <Checkbox
                id="other"
                checked={!!selectedItems.other}
                onCheckedChange={(checked) =>
                  handleCheckboxChange("other", checked as boolean)
                }
                className="mt-1"
              />
              <div className="flex-1">
                <Label
                  htmlFor="other"
                  className="text-sm font-normal cursor-pointer"
                >
                  <span className="font-semibold">Other:</span>{" "}
                  <Input
                    type="text"
                    placeholder=""
                    className="inline-block w-96 h-6 px-2 border-b border-input border-t-0 border-l-0 border-r-0 rounded-none focus:border-ring focus:ring-0"
                    value={selectedItems.other_details || ""}
                    onChange={(e) =>
                      handleInputChange("other_details", e.target.value)
                    }
                  />
                </Label>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
          <h4 className="font-medium text-yellow-700 flex items-center">
            <span className="mr-2">💡</span>
            Instructions
          </h4>
          <p className="text-sm text-yellow-700 mt-1">
            Carefully compare each item with your actual 221(g) letter. Check
            all items that match your specific situation. Based on your
            selections, you will receive tailored guidance on next steps.
          </p>
        </div>

        <div className="mt-6 flex justify-end">
          <Button
            onClick={onNext}
            disabled={
              Object.values(selectedItems).filter((value) => Boolean(value))
                .length === 0
            }
            className="bg-primary hover:bg-primary/90"
          >
            Continue with Selected Items (
            {
              Object.values(selectedItems).filter((value) => Boolean(value))
                .length
            }
            )
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
