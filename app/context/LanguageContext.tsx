"use client";

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";

// Define available languages
export type Language = "en" | "ur";

// Define the context type
interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, variables?: Record<string, string | number>) => string; // Translation function
  tRaw: (key: string) => any; // Raw translation function for arrays/objects
}

// Create the context with default values
const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined,
);

// Static import of translation files
import enTranslations from "../translations/en.json";
import urTranslations from "../translations/ur.json";

// Provider component
interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({
  children,
}) => {
  const [language, setLanguage] = useState<Language>("en");

  // Load language preference from localStorage on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem("language") as Language | null;
    if (savedLanguage && ["en", "ur"].includes(savedLanguage)) {
      setLanguage(savedLanguage);
    } else {
      // Default to English if no preference is saved
      setLanguage("en");
    }
  }, []);

  // Save language preference to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("language", language);

    // Update document language attribute for accessibility
    document.documentElement.lang = language;
  }, [language]);

  // Translation function using nested object access
  const t = (
    key: string,
    variables?: Record<string, string | number>,
  ): string => {
    // Select the appropriate translation object based on current language
    const translations = language === "ur" ? urTranslations : enTranslations;

    // Split the key by dots to access nested properties
    const keys = key.split(".");
    let value: string | Record<string, unknown> | undefined = translations;

    for (const k of keys) {
      if (value && typeof value === "object" && k in value) {
        value = value[k as keyof typeof value] as
          | string
          | Record<string, unknown>
          | undefined;
      } else {
        value = undefined;
        break;
      }
    }

    // Return the translated string or the key itself if not found
    let translatedString = typeof value === "string" ? value : key;

    // Handle string interpolation if variables are provided
    if (variables) {
      Object.entries(variables).forEach(([k, v]) => {
        translatedString = translatedString.replace(
          new RegExp(`{{${k}}}`, "g"),
          String(v),
        );
      });
    }

    return translatedString;
  };

  // Raw translation function for arrays/objects
  const tRaw = (key: string): any => {
    // Select the appropriate translation object based on current language
    const translations = language === "ur" ? urTranslations : enTranslations;

    // Split the key by dots to access nested properties
    const keys = key.split(".");
    let value: any = translations;

    for (const k of keys) {
      if (value && typeof value === "object" && k in value) {
        value = value[k as keyof typeof value];
      } else {
        return key;
      }
    }

    return value;
  };

  const value: LanguageContextType = {
    language,
    setLanguage,
    t,
    tRaw,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

// Custom hook to use the language context
export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
