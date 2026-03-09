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
  isUrdu: boolean;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, any>) => any; // Translation function with interpolation and object support
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
  const t = (key: string, params?: Record<string, any>): any => {
    // Select the appropriate translation object based on current language
    const translations = language === "ur" ? urTranslations : enTranslations;

    // Split the key by dots to access nested properties
    const keys = key.split(".");
    let value: any = translations;

    for (const k of keys) {
      if (value && typeof value === "object" && k in value) {
        value = (value as Record<string, any>)[k];
      } else {
        value = undefined;
        break;
      }
    }

    if (value === undefined) return key;

    // If it's an object or array and user asked for it (or implicitly via params having returnObjects)
    if (typeof value !== "string" && (params?.returnObjects || !params)) {
      return value;
    }

    if (typeof value !== "string") return key;

    // Handle interpolation
    if (params) {
      let interpolated = value;
      Object.entries(params).forEach(([k, v]) => {
        // Support both {key} and {{key}} patterns
        interpolated = interpolated.replace(
          new RegExp(`{${k}}`, "g"),
          String(v),
        );
        interpolated = interpolated.replace(
          new RegExp(`{{${k}}}`, "g"),
          String(v),
        );
      });
      return interpolated;
    }

    return value;
  };

  // Raw translation function for arrays/objects
  const tRaw = (key: string): any => {
    const translations = language === "ur" ? urTranslations : enTranslations;
    const keys = key.split(".");
    let value: any = translations;

    for (const k of keys) {
      if (value && typeof value === "object" && k in value) {
        value = value[k];
      } else {
        return key;
      }
    }

    return value;
  };

  const value: LanguageContextType = {
    language,
    isUrdu: language === "ur",
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
