"use client";

import React from "react";
import { useLanguage } from "@/app/context/LanguageContext";
import { Button } from "@/components/ui/button";
import { GlobeIcon } from "lucide-react";

const LanguageToggle: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === "en" ? "ur" : "en");
  };

  return (
    <Button
      onClick={toggleLanguage}
      variant="outline"
      size="sm"
      aria-label={t("toggleLanguage")}
      className="flex items-center gap-2"
    >
      <GlobeIcon className="h-4 w-4" />
      <span className="hidden sm:inline-block">{language === "en" ? t("urdu") : t("english")}</span>
      <span className="ml-1">({language === "en" ? "UR" : "EN"})</span>
    </Button>
  );
};

export default LanguageToggle;
