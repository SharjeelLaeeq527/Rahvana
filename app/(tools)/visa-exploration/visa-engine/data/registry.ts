/**
 * visa-engine/data/registry.ts
 *
 * Central index of all supported destination countries.
 * To add a new country: (1) create its data file, (2) add ONE line here.
 */

import { CountryData } from "../types";
import { US_DATA } from "./us";
import { UK_DATA } from "./uk";
import { GERMANY_DATA } from "./germany";
import { AUSTRALIA_DATA } from "./australia";
import { CHINA_DATA } from "./china";
import { CANADA_DATA } from "./canada";
import { ITALY_DATA } from "./italy";

// ─────────────────────────────────────────────────────────────
// REGISTRY  — add new countries here only
// ─────────────────────────────────────────────────────────────
export const COUNTRY_REGISTRY: Record<string, CountryData> = {
  "United States": US_DATA,
  "United Kingdom": UK_DATA,
  "Germany": GERMANY_DATA,
  "Australia": AUSTRALIA_DATA,
  "China": CHINA_DATA,
  "Canada": CANADA_DATA,
  "Italy": ITALY_DATA,
};

export const SUPPORTED_DESTINATIONS = Object.keys(COUNTRY_REGISTRY);

export function getCountryData(destination: string): CountryData | null {
  return COUNTRY_REGISTRY[destination] ?? null;
}
