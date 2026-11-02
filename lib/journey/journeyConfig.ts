/**
 * Which `data/visa-category/*.json` config a journey is seeded and synced from.
 *
 * One resolver shared by post-payment provisioning, `journeys/initialize` and
 * `journeys/[id]/sync-steps`, so the three seeding paths can never disagree.
 *
 * CR-2 has no config of its own: it reuses the IR-2 journey (legal differences are
 * explicit branches inside ir-2.json). Categories without an entry keep the old
 * `<base>.json` naming so nothing outside IR-2 / CR-2 changes behavior.
 */

import { getBaseVisaCategory } from "@/lib/candidate/candidateSyncService";
import type { VisaCategory } from "@/lib/document-vault/types";

const CONFIG_KEY_BY_CATEGORY: Record<string, string> = {
  "IR-1": "ir-1",
  "IR-2": "ir-2",
  "CR-2": "ir-2",
  "IR-5": "ir-5",
};

/** Base category of the journey a purchase or journey_type belongs to (CR-2 -> IR-2). */
export function journeyBaseCategory(journeyTypeOrVisa?: string | null): VisaCategory {
  const base = getBaseVisaCategory(journeyTypeOrVisa);
  return base === "CR-2" ? "IR-2" : base;
}

/** True when the category has its own chapters-schema journey config. */
export function hasJourneyConfig(journeyTypeOrVisa?: string | null): boolean {
  return getBaseVisaCategory(journeyTypeOrVisa) in CONFIG_KEY_BY_CATEGORY;
}

/** Config key, e.g. "ir2_candidate-2" -> "ir-2", "CR-2" -> "ir-2", "IR5" -> "ir-5". */
export function journeyConfigKeyFor(journeyTypeOrVisa?: string | null): string {
  const base = getBaseVisaCategory(journeyTypeOrVisa);
  return CONFIG_KEY_BY_CATEGORY[base] ?? base.toLowerCase();
}

export function journeyConfigPathFor(journeyTypeOrVisa?: string | null): string {
  return `data/visa-category/${journeyConfigKeyFor(journeyTypeOrVisa)}.json`;
}
