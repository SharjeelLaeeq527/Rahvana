"use client";

import { useState, useEffect } from "react";
import { useDocumentVaultStore } from "@/lib/document-vault/store";
import { useLanguage } from "@/app/context/LanguageContext";
import { VisaCategory, ScenarioFlags } from "@/lib/document-vault/types";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Settings, Save } from "lucide-react";
import { toast } from "sonner";
import { Loader } from "@/components/ui/spinner";

const VISA_CATEGORIES: VisaCategory[] = [
  "IR-1",
  "CR-1",
  "IR-2",
  "CR-2",
  "IR-5",
  // "F1",
  "F-1 Student Visa",
  "Australia Student Visa (Subclass 500)",
  "China Student Visa (X1 & X2)",
  // "F2A",
  // "F2B",
  // "F3",
  // "F4",
];

export function LiveConfigPanel() {
  const { config, setConfig, updateScenarioFlags, setVisaCategory } =
    useDocumentVaultStore();
  const { t } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(true);
  const [localCategory, setLocalCategory] = useState<VisaCategory>(
    config?.visaCategory || "IR-1",
  );
  const [localFlags, setLocalFlags] = useState<ScenarioFlags>(
    config?.scenarioFlags || {},
  );
  const [caseId, setCaseId] = useState("");
  const [petitionerName, setPetitionerName] = useState("");
  const [beneficiaryName, setBeneficiaryName] = useState("");
  const [jointSponsorName, setJointSponsorName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Update only category and flags from config, keep inputs empty
  useEffect(() => {
    if (config) {
      setLocalCategory(config.visaCategory);
      setLocalFlags(config.scenarioFlags || {});
    }
  }, [config]);

  const handleCategoryChange = (category: VisaCategory) => {
    setLocalCategory(category);
    setVisaCategory(category);
  };

  const handleFlagChange = (flag: keyof ScenarioFlags, checked: boolean) => {
    const newFlags = {
      ...localFlags,
      [flag]: checked,
    };
    setLocalFlags(newFlags);
    updateScenarioFlags({ [flag]: checked });
  };

  const handleSaveCaseInfo = async () => {
    if (config) {
      // Validate required fields
      if (!caseId.trim() || !petitionerName.trim() || !beneficiaryName.trim()) {
        toast.error(
          t("documentVaultPage.components.liveConfigPanel.requiredFieldsError"),
          {
            duration: 3000,
          },
        );
        return;
      }

      setIsSaving(true);

      // Simulate save delay for better UX
      await new Promise((resolve) => setTimeout(resolve, 500));

      setConfig({
        ...config,
        caseId: caseId.trim(),
        petitionerName: petitionerName.trim(),
        beneficiaryName: beneficiaryName.trim(),
        jointSponsorName: jointSponsorName?.trim() || undefined,
      });

      // Show success with preview
      const normalizedCaseId = caseId
        .trim()
        .replace(/[^a-zA-Z0-9]/g, "")
        .toUpperCase();
      const normalizedName = petitionerName
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9\s]/g, "")
        .trim()
        .replace(/\s+/g, "_")
        .toUpperCase()
        .substring(0, 30);

      toast.success(
        <div className="space-y-1">
          <p className="font-bold text-sm">
            {t("documentVaultPage.components.liveConfigPanel.saveSuccess")}
          </p>
          <p className="text-xs opacity-90">
            {t("documentVaultPage.components.liveConfigPanel.saveSuccessDesc")}
          </p>
          <code className="text-xs block bg-green-800 bg-opacity-20 p-1 rounded mt-1">
            {normalizedCaseId}_PETITIONER_{normalizedName}
            _PASSPORT_2024-12-24_v1.pdf
          </code>
        </div>,
        {
          duration: 6000,
          style: {
            background: "#10b981",
            color: "white",
          },
        },
      );

      setIsSaving(false);
    }
  };

  if (!config) return null;

  return (
    <div className="sticky top-6 space-y-4">
      {/* Header */}
      <Card className="p-4">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-brand" />
            <h3 className="font-semibold text-lg">
              {t("documentVaultPage.components.liveConfigPanel.configuration")}
            </h3>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5" />
          ) : (
            <ChevronDown className="w-5 h-5" />
          )}
        </button>
      </Card>

      {isExpanded && (
        <>
          {/* Visa Category Selection */}
          <Card className="p-4">
            <div className="mb-3">
              <Label className="text-sm font-semibold">
                {t("documentVaultPage.components.liveConfigPanel.visaCategory")}
              </Label>
              <p className="text-xs text-muted-foreground mt-1">
                {t(
                  "documentVaultPage.components.liveConfigPanel.selectVisaType",
                )}
              </p>
            </div>
            <div className="space-y-2">
              {VISA_CATEGORIES.map((category) => (
                <label
                  key={category}
                  className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all ${
                    localCategory === category
                      ? "border-brand bg-brand/10 ring-2 ring-brand/20"
                      : "border-border hover:border-brand/50 hover:bg-brand/5"
                  }`}
                >
                  <input
                    type="radio"
                    name="visaCategory"
                    value={category}
                    checked={localCategory === category}
                    onChange={(e) =>
                      handleCategoryChange(e.target.value as VisaCategory)
                    }
                    className="mr-3 accent-brand"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-sm">
                      {
                        t(`documentVaultPage.visaCategories.${category}`).split(
                          ": ",
                        )[0]
                      }
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {
                        t(`documentVaultPage.visaCategories.${category}`).split(
                          ": ",
                        )[1]
                      }
                    </div>
                  </div>
                  {localCategory === category && (
                    <Badge variant="default" className="text-xs">
                      {t("documentVaultPage.components.liveConfigPanel.active")}
                    </Badge>
                  )}
                </label>
              ))}
            </div>
          </Card>

          {/* Additional Information */}
          <Card className="p-4">
            <div className="mb-3">
              <Label className="text-sm font-semibold">
                {t(
                  "documentVaultPage.components.liveConfigPanel.additionalInfo",
                )}
              </Label>
              <p className="text-xs text-muted-foreground mt-1">
                {t(
                  "documentVaultPage.components.liveConfigPanel.selectApplies",
                )}
              </p>
            </div>

            <div className="space-y-4">
              {/* Marriage/Relationship flags */}
              {(localCategory === "IR-1" || localCategory === "CR-1") && (
                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-muted-foreground">
                    {t(
                      "documentVaultPage.components.configWizard.marriageHistory",
                    )}
                  </h4>
                  <label className="flex items-start space-x-3 cursor-pointer">
                    <Checkbox
                      checked={localFlags.prior_marriage_petitioner || false}
                      onCheckedChange={(checked) =>
                        handleFlagChange(
                          "prior_marriage_petitioner",
                          checked as boolean,
                        )
                      }
                    />
                    <div className="flex-1">
                      <span className="text-sm font-medium">
                        {t(
                          "documentVaultPage.components.configWizard.petitionerMarried",
                        )}
                      </span>
                      <p className="text-xs text-muted-foreground">
                        {t(
                          "documentVaultPage.components.configWizard.petitionerMarriedDesc",
                        )}
                      </p>
                    </div>
                  </label>
                  <label className="flex items-start space-x-3 cursor-pointer">
                    <Checkbox
                      checked={localFlags.prior_marriage_beneficiary || false}
                      onCheckedChange={(checked) =>
                        handleFlagChange(
                          "prior_marriage_beneficiary",
                          checked as boolean,
                        )
                      }
                    />
                    <div className="flex-1">
                      <span className="text-sm font-medium">
                        {t(
                          "documentVaultPage.components.configWizard.beneficiaryMarried",
                        )}
                      </span>
                      <p className="text-xs text-muted-foreground">
                        {t(
                          "documentVaultPage.components.configWizard.beneficiaryMarriedDesc",
                        )}
                      </p>
                    </div>
                  </label>
                </div>
              )}

              {/* Children */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-muted-foreground">
                  {t("documentVaultPage.components.configWizard.childInfo")}
                </h4>
                <label className="flex items-start space-x-3 cursor-pointer">
                  <Checkbox
                    checked={localFlags.child_adopted || false}
                    onCheckedChange={(checked) =>
                      handleFlagChange("child_adopted", checked as boolean)
                    }
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium">
                      {t(
                        "documentVaultPage.components.configWizard.adoptedChild",
                      )}
                    </span>
                    <p className="text-xs text-muted-foreground">
                      {t(
                        "documentVaultPage.components.configWizard.adoptedChildDesc",
                      )}
                    </p>
                  </div>
                </label>
                <label className="flex items-start space-x-3 cursor-pointer">
                  <Checkbox
                    checked={localFlags.child_stepchild || false}
                    onCheckedChange={(checked) =>
                      handleFlagChange("child_stepchild", checked as boolean)
                    }
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium">
                      {t("documentVaultPage.components.configWizard.stepchild")}
                    </span>
                    <p className="text-xs text-muted-foreground">
                      {t(
                        "documentVaultPage.components.configWizard.stepchildDesc",
                      )}
                    </p>
                  </div>
                </label>
              </div>

              {/* Financial */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-muted-foreground">
                  {t(
                    "documentVaultPage.components.configWizard.financialSupport",
                  )}
                </h4>
                <label className="flex items-start space-x-3 cursor-pointer">
                  <Checkbox
                    checked={localFlags.joint_sponsor_used || false}
                    onCheckedChange={(checked) =>
                      handleFlagChange("joint_sponsor_used", checked as boolean)
                    }
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium">
                      {t(
                        "documentVaultPage.components.configWizard.jointSponsor",
                      )}
                    </span>
                    <p className="text-xs text-muted-foreground">
                      {t(
                        "documentVaultPage.components.configWizard.jointSponsorDesc",
                      )}
                    </p>
                  </div>
                </label>
                <label className="flex items-start space-x-3 cursor-pointer">
                  <Checkbox
                    checked={localFlags.household_member_used || false}
                    onCheckedChange={(checked) =>
                      handleFlagChange(
                        "household_member_used",
                        checked as boolean,
                      )
                    }
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium">
                      {t(
                        "documentVaultPage.components.configWizard.householdMember",
                      )}
                    </span>
                    <p className="text-xs text-muted-foreground">
                      {t(
                        "documentVaultPage.components.configWizard.householdMemberDesc",
                      )}
                    </p>
                  </div>
                </label>
              </div>

              {/* Background */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-muted-foreground">
                  {t("documentVaultPage.components.configWizard.background")}
                </h4>
                <label className="flex items-start space-x-3 cursor-pointer">
                  <Checkbox
                    checked={localFlags.criminal_history || false}
                    onCheckedChange={(checked) =>
                      handleFlagChange("criminal_history", checked as boolean)
                    }
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium">
                      {t(
                        "documentVaultPage.components.configWizard.criminalHistory",
                      )}
                    </span>
                    <p className="text-xs text-muted-foreground">
                      {t(
                        "documentVaultPage.components.configWizard.criminalHistoryDesc",
                      )}
                    </p>
                  </div>
                </label>
                <label className="flex items-start space-x-3 cursor-pointer">
                  <Checkbox
                    checked={
                      localFlags.previous_immigration_violations || false
                    }
                    onCheckedChange={(checked) =>
                      handleFlagChange(
                        "previous_immigration_violations",
                        checked as boolean,
                      )
                    }
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium">
                      {t(
                        "documentVaultPage.components.configWizard.previousViolations",
                      )}
                    </span>
                    <p className="text-xs text-muted-foreground">
                      {t(
                        "documentVaultPage.components.configWizard.previousViolationsDesc",
                      )}
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </Card>

          {/* Case Information - For USCIS Naming Convention */}
          <Card className="p-4">
            <div className="mb-3">
              <Label className="text-sm font-semibold">
                {t("documentVaultPage.components.liveConfigPanel.caseInfo")}
              </Label>
              <p className="text-xs text-muted-foreground mt-1">
                {t(
                  "documentVaultPage.components.liveConfigPanel.caseInfoRequiredDesc",
                )}
              </p>
            </div>
            <div className="space-y-3">
              <div>
                <Label htmlFor="caseId" className="text-xs font-medium">
                  {t("documentVaultPage.components.liveConfigPanel.caseIdReq")}{" "}
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="caseId"
                  type="text"
                  value={caseId}
                  onChange={(e) => setCaseId(e.target.value)}
                  placeholder="e.g., IOE1234567890 or NVC2024XXXXX"
                  className="text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {t("documentVaultPage.components.configWizard.caseIdDesc")}
                </p>
              </div>

              <div>
                <Label htmlFor="petitionerName" className="text-xs font-medium">
                  {t(
                    "documentVaultPage.components.liveConfigPanel.petitionerNameReq",
                  )}{" "}
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="petitionerName"
                  type="text"
                  value={petitionerName}
                  onChange={(e) => setPetitionerName(e.target.value)}
                  placeholder="e.g., John Michael Doe"
                  className="text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {t(
                    "documentVaultPage.components.liveConfigPanel.petitionerNameDesc",
                  )}
                </p>
              </div>

              <div>
                <Label
                  htmlFor="beneficiaryName"
                  className="text-xs font-medium"
                >
                  {t(
                    "documentVaultPage.components.liveConfigPanel.beneficiaryNameReq",
                  )}{" "}
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="beneficiaryName"
                  type="text"
                  value={beneficiaryName}
                  onChange={(e) => setBeneficiaryName(e.target.value)}
                  placeholder="e.g., Jane Elizabeth Smith"
                  className="text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {t(
                    "documentVaultPage.components.liveConfigPanel.beneficiaryNameDesc",
                  )}
                </p>
              </div>

              {localFlags.joint_sponsor_used && (
                <div>
                  <Label
                    htmlFor="jointSponsorName"
                    className="text-xs font-medium"
                  >
                    {t(
                      "documentVaultPage.components.liveConfigPanel.jointSponsorNameReq",
                    )}
                  </Label>
                  <Input
                    id="jointSponsorName"
                    type="text"
                    value={jointSponsorName}
                    onChange={(e) => setJointSponsorName(e.target.value)}
                    placeholder="e.g., Robert James Williams"
                    className="text-sm"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {t(
                      "documentVaultPage.components.liveConfigPanel.jointSponsorNameDesc",
                    )}
                  </p>
                </div>
              )}

              <Button
                size="sm"
                onClick={handleSaveCaseInfo}
                className="w-full bg-green-600 hover:bg-green-700"
                disabled={
                  !caseId || !petitionerName || !beneficiaryName || isSaving
                }
              >
                {isSaving ? (
                  <Loader
                    size="sm"
                    text={t(
                      "documentVaultPage.components.liveConfigPanel.saving",
                    )}
                  />
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {!caseId || !petitionerName || !beneficiaryName
                      ? t(
                          "documentVaultPage.components.liveConfigPanel.fillRequiredAbove",
                        )
                      : t(
                          "documentVaultPage.components.liveConfigPanel.saveCaseInfo",
                        )}
                  </>
                )}
              </Button>

              {caseId && petitionerName && beneficiaryName && (
                <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded p-2">
                  <p className="text-xs text-blue-900 dark:text-blue-100 font-medium mb-1">
                    {t(
                      "documentVaultPage.components.liveConfigPanel.namingPreview",
                    )}
                  </p>
                  <code className="text-xs text-blue-800 dark:text-blue-200 block break-all">
                    {caseId.replace(/[^a-zA-Z0-9]/g, "").toUpperCase()}_
                    {"{ROLE}"}_
                    {petitionerName
                      .normalize("NFD")
                      .replace(/[\u0300-\u036f]/g, "")
                      .replace(/[^a-zA-Z0-9\s]/g, "")
                      .trim()
                      .replace(/\s+/g, "_")
                      .toUpperCase()
                      .substring(0, 30)}
                    _{"{DOC_KEY}"}_2024-12-24_v1.pdf
                  </code>
                </div>
              )}

              {(!caseId || !petitionerName || !beneficiaryName) && (
                <div className="bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 rounded p-2">
                  <p className="text-xs text-red-800 dark:text-red-200">
                    {t(
                      "documentVaultPage.components.liveConfigPanel.requiredWarning",
                    )}
                    <br />
                    {t(
                      "documentVaultPage.components.liveConfigPanel.requiredWarningDesc",
                    )}
                  </p>
                </div>
              )}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
