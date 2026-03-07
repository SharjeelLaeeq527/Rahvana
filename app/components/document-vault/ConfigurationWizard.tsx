"use client";

import { useState } from "react";
import { useDocumentVaultStore } from "@/lib/document-vault/store";
import { useLanguage } from "@/app/context/LanguageContext";
import { VisaCategory, ScenarioFlags } from "@/lib/document-vault/types";
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
  const { t } = useLanguage();
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
            {t("documentVaultPage.components.configWizard.title")}
          </h2>
          <p className="text-muted-foreground">
            {t("documentVaultPage.components.configWizard.subtitle")}
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
                {t("documentVaultPage.components.configWizard.step1Title")}
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
                      <div className="font-medium">
                        {
                          t(
                            `documentVaultPage.visaCategories.${category}`,
                          ).split(": ")[0]
                        }
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {
                          t(
                            `documentVaultPage.visaCategories.${category}`,
                          ).split(": ")[1]
                        }
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <Button onClick={() => setStep(2)} className="w-full">
              {t("documentVaultPage.components.configWizard.continue")}
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">
                {t("documentVaultPage.components.configWizard.step2Title")}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {t("documentVaultPage.components.configWizard.step2Subtitle")}
              </p>

              <div className="space-y-4">
                {/* Marriage/Relationship flags */}
                {(visaCategory === "IR-1" || visaCategory === "CR-1") && (
                  <>
                    <div className="space-y-3">
                      <h4 className="font-medium text-sm">
                        {t(
                          "documentVaultPage.components.configWizard.marriageHistory",
                        )}
                      </h4>
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
                            {t(
                              "documentVaultPage.components.configWizard.petitionerMarried",
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {t(
                              "documentVaultPage.components.configWizard.petitionerMarriedDesc",
                            )}
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
                            {t(
                              "documentVaultPage.components.configWizard.beneficiaryMarried",
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {t(
                              "documentVaultPage.components.configWizard.beneficiaryMarriedDesc",
                            )}
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
                          <div className="font-medium">
                            {t(
                              "documentVaultPage.components.configWizard.nameChange",
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {t(
                              "documentVaultPage.components.configWizard.nameChangeDesc",
                            )}
                          </div>
                        </div>
                      </label>
                    </div>
                  </>
                )}

                {/* Children flags */}
                {(visaCategory === "IR-2" || visaCategory === "CR-2") && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm">
                      {t("documentVaultPage.components.configWizard.childInfo")}
                    </h4>
                    <label className="flex items-start space-x-3">
                      <Checkbox
                        checked={scenarioFlags.child_adopted || false}
                        onCheckedChange={(checked) =>
                          handleFlagChange("child_adopted", checked as boolean)
                        }
                      />
                      <div>
                        <div className="font-medium">
                          {t(
                            "documentVaultPage.components.configWizard.adoptedChild",
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {t(
                            "documentVaultPage.components.configWizard.adoptedChildDesc",
                          )}
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
                        <div className="font-medium">
                          {t(
                            "documentVaultPage.components.configWizard.stepchild",
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {t(
                            "documentVaultPage.components.configWizard.stepchildDesc",
                          )}
                        </div>
                      </div>
                    </label>
                  </div>
                )}

                {/* Financial flags */}
                <div className="space-y-3">
                  <h4 className="font-medium text-sm">
                    {t(
                      "documentVaultPage.components.configWizard.financialSupport",
                    )}
                  </h4>
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
                      <div className="font-medium">
                        {t(
                          "documentVaultPage.components.configWizard.jointSponsor",
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {t(
                          "documentVaultPage.components.configWizard.jointSponsorDesc",
                        )}
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
                      <div className="font-medium">
                        {t(
                          "documentVaultPage.components.configWizard.householdMember",
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {t(
                          "documentVaultPage.components.configWizard.householdMemberDesc",
                        )}
                      </div>
                    </div>
                  </label>
                </div>

                {/* Background flags */}
                <div className="space-y-3">
                  <h4 className="font-medium text-sm">
                    {t("documentVaultPage.components.configWizard.background")}
                  </h4>
                  <label className="flex items-start space-x-3">
                    <Checkbox
                      checked={scenarioFlags.military_service || false}
                      onCheckedChange={(checked) =>
                        handleFlagChange("military_service", checked as boolean)
                      }
                    />
                    <div>
                      <div className="font-medium">
                        {t(
                          "documentVaultPage.components.configWizard.militaryService",
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {t(
                          "documentVaultPage.components.configWizard.militaryServiceDesc",
                        )}
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
                      <div className="font-medium">
                        {t(
                          "documentVaultPage.components.configWizard.criminalHistory",
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {t(
                          "documentVaultPage.components.configWizard.criminalHistoryDesc",
                        )}
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
                {t("documentVaultPage.components.configWizard.back")}
              </Button>
              <Button onClick={() => setStep(3)} className="flex-1">
                {t("documentVaultPage.components.configWizard.continue")}
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">
                {t("documentVaultPage.components.configWizard.step3Title")}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {t("documentVaultPage.components.configWizard.step3Subtitle")}
              </p>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="caseId">
                    {t("documentVaultPage.components.configWizard.caseId")}
                  </Label>
                  <Input
                    id="caseId"
                    placeholder="e.g., IOE123456789"
                    value={caseId}
                    onChange={(e) => setCaseId(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {t("documentVaultPage.components.configWizard.caseIdDesc")}
                  </p>
                </div>

                <div>
                  <Label htmlFor="petitionerName">
                    {t(
                      "documentVaultPage.components.configWizard.petitionerName",
                    )}
                  </Label>
                  <Input
                    id="petitionerName"
                    placeholder="e.g., John Smith"
                    value={petitionerName}
                    onChange={(e) => setPetitionerName(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="beneficiaryName">
                    {t(
                      "documentVaultPage.components.configWizard.beneficiaryName",
                    )}
                  </Label>
                  <Input
                    id="beneficiaryName"
                    placeholder="e.g., Ahmed Khan"
                    value={beneficiaryName}
                    onChange={(e) => setBeneficiaryName(e.target.value)}
                  />
                </div>

                {scenarioFlags.joint_sponsor_used && (
                  <div>
                    <Label htmlFor="jointSponsorName">
                      {t(
                        "documentVaultPage.components.configWizard.jointSponsorName",
                      )}
                    </Label>
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
                {t("documentVaultPage.components.configWizard.back")}
              </Button>
              <Button onClick={handleComplete} className="flex-1">
                {t("documentVaultPage.components.configWizard.completeSetup")}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
