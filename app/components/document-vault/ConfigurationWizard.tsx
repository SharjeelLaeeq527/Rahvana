"use client";

import { useState } from "react";
import { useDocumentVaultStore } from "@/lib/document-vault/store";
import { VisaCategory, ScenarioFlags } from "@/lib/document-vault/types";
import { getVisaCategoryDisplayName } from "@/lib/document-vault/personalization-engine";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

interface ConfigurationWizardProps {
  userId: string;
  onComplete: () => void;
}

const VISA_CATEGORIES: VisaCategory[] = [
  "IR-1",
  "CR-1",
  "IR-2",
  "CR-2",
  "IR-5",
  "F1",
  "F2A",
  "F2B",
  "F3",
  "F4",
];

export function ConfigurationWizard({
  userId,
  onComplete,
}: ConfigurationWizardProps) {
  const [step, setStep] = useState(1);
  const [visaCategory, setVisaCategory] = useState<VisaCategory>("IR-1");
  const [scenarioFlags, setScenarioFlags] = useState<ScenarioFlags>({});
  const [caseId, setCaseId] = useState("");
  const [petitionerName, setPetitionerName] = useState("");
  const [beneficiaryName, setBeneficiaryName] = useState("");
  const [jointSponsorName, setJointSponsorName] = useState("");

  const { setConfig } = useDocumentVaultStore();

  const handleFlagChange = (flag: keyof ScenarioFlags, checked: boolean) => {
    setScenarioFlags((prev) => ({
      ...prev,
      [flag]: checked,
    }));
  };

  const handleComplete = () => {
    const config = {
      userId,
      visaCategory,
      scenarioFlags,
      caseId: caseId || undefined,
      petitionerName: petitionerName || undefined,
      beneficiaryName: beneficiaryName || undefined,
      jointSponsorName: jointSponsorName || undefined,
    };

    setConfig(config);
    onComplete();
  };

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6">
      <Card className="p-5 sm:p-8">
        <div className="mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-bold mb-2">
            Document Vault Setup
          </h2>
          <p className="text-muted-foreground">
            Let&apos;s configure your personalized document checklist
          </p>
          <div className="flex gap-2 mt-4">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-2 flex-1 rounded ${
                  s <= step ? "bg-brand" : "bg-muted"
                }`}
              />
            ))}
          </div>
        </div>

        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">
                Step 1: Select Your Visa Category
              </h3>
              <div className="space-y-3">
                {VISA_CATEGORIES.map((category) => (
                  <label
                    key={category}
                    className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                      visaCategory === category
                        ? "border-brand bg-brand/5"
                        : "border-border hover:border-brand/50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="visaCategory"
                      value={category}
                      checked={visaCategory === category}
                      onChange={(e) =>
                        setVisaCategory(e.target.value as VisaCategory)
                      }
                      className="mr-3"
                    />
                    <div>
                      <div className="font-medium">{category}</div>
                      <div className="text-sm text-muted-foreground">
                        {getVisaCategoryDisplayName(category).split(": ")[1]}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <Button onClick={() => setStep(2)} className="w-full">
              Continue
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">
                Step 2: Additional Information
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Select any that apply to your case:
              </p>

              <div className="space-y-4">
                {/* Marriage/Relationship flags */}
                {(visaCategory === "IR-1" || visaCategory === "CR-1") && (
                  <>
                    <div className="space-y-3">
                      <h4 className="font-medium text-sm">Marriage History</h4>
                      <label className="flex items-start space-x-3">
                        <Checkbox
                          checked={
                            scenarioFlags.prior_marriage_petitioner || false
                          }
                          onCheckedChange={(checked) =>
                            handleFlagChange(
                              "prior_marriage_petitioner",
                              checked as boolean,
                            )
                          }
                        />
                        <div>
                          <div className="font-medium">
                            Petitioner Previously Married
                          </div>
                          <div className="text-sm text-muted-foreground">
                            U.S. citizen was married before
                          </div>
                        </div>
                      </label>

                      <label className="flex items-start space-x-3">
                        <Checkbox
                          checked={
                            scenarioFlags.prior_marriage_beneficiary || false
                          }
                          onCheckedChange={(checked) =>
                            handleFlagChange(
                              "prior_marriage_beneficiary",
                              checked as boolean,
                            )
                          }
                        />
                        <div>
                          <div className="font-medium">
                            Beneficiary Previously Married
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Pakistan-based spouse was married before
                          </div>
                        </div>
                      </label>

                      <label className="flex items-start space-x-3">
                        <Checkbox
                          checked={scenarioFlags.name_change_any_party || false}
                          onCheckedChange={(checked) =>
                            handleFlagChange(
                              "name_change_any_party",
                              checked as boolean,
                            )
                          }
                        />
                        <div>
                          <div className="font-medium">Name Change</div>
                          <div className="text-sm text-muted-foreground">
                            Any party changed their name
                          </div>
                        </div>
                      </label>
                    </div>
                  </>
                )}

                {/* Children flags */}
                {(visaCategory === "IR-2" || visaCategory === "CR-2") && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm">Child Information</h4>
                    <label className="flex items-start space-x-3">
                      <Checkbox
                        checked={scenarioFlags.child_adopted || false}
                        onCheckedChange={(checked) =>
                          handleFlagChange("child_adopted", checked as boolean)
                        }
                      />
                      <div>
                        <div className="font-medium">Adopted Child</div>
                        <div className="text-sm text-muted-foreground">
                          Child is adopted
                        </div>
                      </div>
                    </label>

                    <label className="flex items-start space-x-3">
                      <Checkbox
                        checked={scenarioFlags.child_stepchild || false}
                        onCheckedChange={(checked) =>
                          handleFlagChange(
                            "child_stepchild",
                            checked as boolean,
                          )
                        }
                      />
                      <div>
                        <div className="font-medium">Stepchild</div>
                        <div className="text-sm text-muted-foreground">
                          Child is a stepchild
                        </div>
                      </div>
                    </label>
                  </div>
                )}

                {/* Financial flags */}
                <div className="space-y-3">
                  <h4 className="font-medium text-sm">Financial Support</h4>
                  <label className="flex items-start space-x-3">
                    <Checkbox
                      checked={scenarioFlags.joint_sponsor_used || false}
                      onCheckedChange={(checked) =>
                        handleFlagChange(
                          "joint_sponsor_used",
                          checked as boolean,
                        )
                      }
                    />
                    <div>
                      <div className="font-medium">Joint Sponsor</div>
                      <div className="text-sm text-muted-foreground">
                        Using a joint sponsor for financial support
                      </div>
                    </div>
                  </label>

                  <label className="flex items-start space-x-3">
                    <Checkbox
                      checked={scenarioFlags.household_member_used || false}
                      onCheckedChange={(checked) =>
                        handleFlagChange(
                          "household_member_used",
                          checked as boolean,
                        )
                      }
                    />
                    <div>
                      <div className="font-medium">Household Member</div>
                      <div className="text-sm text-muted-foreground">
                        Including household member income
                      </div>
                    </div>
                  </label>
                </div>

                {/* Background flags */}
                <div className="space-y-3">
                  <h4 className="font-medium text-sm">Background</h4>
                  <label className="flex items-start space-x-3">
                    <Checkbox
                      checked={scenarioFlags.military_service || false}
                      onCheckedChange={(checked) =>
                        handleFlagChange("military_service", checked as boolean)
                      }
                    />
                    <div>
                      <div className="font-medium">Military Service</div>
                      <div className="text-sm text-muted-foreground">
                        Beneficiary served in military
                      </div>
                    </div>
                  </label>

                  <label className="flex items-start space-x-3">
                    <Checkbox
                      checked={scenarioFlags.criminal_history || false}
                      onCheckedChange={(checked) =>
                        handleFlagChange("criminal_history", checked as boolean)
                      }
                    />
                    <div>
                      <div className="font-medium">Criminal History</div>
                      <div className="text-sm text-muted-foreground">
                        Any arrests, charges, or convictions
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                className="flex-1"
              >
                Back
              </Button>
              <Button onClick={() => setStep(3)} className="flex-1">
                Continue
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">
                Step 3: Case Information (Optional)
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                This information will be used for file naming and organization
              </p>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="caseId">
                    Case ID / Receipt Number (Optional)
                  </Label>
                  <Input
                    id="caseId"
                    placeholder="e.g., IOE123456789"
                    value={caseId}
                    onChange={(e) => setCaseId(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    USCIS receipt number or NVC case number
                  </p>
                </div>

                <div>
                  <Label htmlFor="petitionerName">Petitioner Name</Label>
                  <Input
                    id="petitionerName"
                    placeholder="e.g., John Smith"
                    value={petitionerName}
                    onChange={(e) => setPetitionerName(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="beneficiaryName">Beneficiary Name</Label>
                  <Input
                    id="beneficiaryName"
                    placeholder="e.g., Ahmed Khan"
                    value={beneficiaryName}
                    onChange={(e) => setBeneficiaryName(e.target.value)}
                  />
                </div>

                {scenarioFlags.joint_sponsor_used && (
                  <div>
                    <Label htmlFor="jointSponsorName">Joint Sponsor Name</Label>
                    <Input
                      id="jointSponsorName"
                      placeholder="e.g., Jane Doe"
                      value={jointSponsorName}
                      onChange={(e) => setJointSponsorName(e.target.value)}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setStep(2)}
                className="flex-1"
              >
                Back
              </Button>
              <Button onClick={handleComplete} className="flex-1">
                Complete Setup
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
