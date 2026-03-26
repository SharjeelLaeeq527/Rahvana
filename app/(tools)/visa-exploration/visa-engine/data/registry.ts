/**
 * visa-engine/data/registry.ts
 *
 * Central index of all supported destination countries.
 * To add a new country: (1) create its data file, (2) add ONE line here.
 */

import { CountryData } from "../types";
import { US_DATA } from "./us";

// ─────────────────────────────────────────────────────────────
// REGISTRY  — add new countries here only
// ─────────────────────────────────────────────────────────────
export const COUNTRY_REGISTRY: Record<string, CountryData> = {
  "United States": US_DATA,
  // "United Kingdom": UK_DATA,   ← uncomment when uk.ts is ready
  // "Canada":         CA_DATA,
  // "Australia":      AU_DATA,
};

export const SUPPORTED_DESTINATIONS = Object.keys(COUNTRY_REGISTRY);

export function getCountryData(destination: string): CountryData | null {
  return COUNTRY_REGISTRY[destination] ?? null;
}
