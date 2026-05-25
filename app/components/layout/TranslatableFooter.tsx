"use client";

import { useLanguage } from "@/app/context/LanguageContext";
import OriginalFooter from "./Footer";

export default function TranslatableFooter() {
  const { t } = useLanguage();

  return <OriginalFooter />;
}
