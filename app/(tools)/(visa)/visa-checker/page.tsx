"use client";

import Form from "@/app/components/visa-checker/Form";
import { useLanguage } from "@/app/context/LanguageContext";

export default function Home() {
  const { t } = useLanguage();
  return (
    <div className="bg-background site-main-px site-main-py mb-6 sm:mb-10">
      <div className="text-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-primary mb-2 sm:mb-3">
          {t("visaChecker.pageTitle")}
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground mb-6 sm:mb-8 px-2 sm:px-0">
          {t("visaChecker.pageSubtitle")}
        </p>
        <Form />
      </div>
    </div>
  );
}
