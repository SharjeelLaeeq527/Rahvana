// lib/candidate/candidateProvisioningService.ts
// ============================================================================
// Multi-Candidate & Document Vault Auto-Provisioning Service
//
// Automatically provisions candidate profiles (Candidate 1, Candidate 2, etc.),
// their dedicated candidate journeys in Supabase, and their isolated
// Document Vault configurations upon successful journey checkout or plan activation.
// ============================================================================

import { SupabaseClient } from "@supabase/supabase-js";
import {
  getCandidateJourneyKey,
  getBaseVisaCategory,
  isMultiCandidateCategory,
} from "./candidateSyncService";
import { DocumentDatabaseStorage } from "@/lib/document-vault/storage-database";
import { journeyService } from "@/lib/journey/service";

export interface ProvisionCandidatesParams {
  supabase: SupabaseClient;
  userId: string;
  visaCategory: string;
  candidateCount: number;
  tier: string;
  stripeSubscriptionId?: string;
  isAddCandidate?: boolean;
}

export interface ProvisionResult {
  success: boolean;
  provisionedCandidates: CandidateProfile[];
  primaryJourneyId?: string;
  candidateJourneyIds: Record<string, string>;
  error?: string;
}

/**
 * Automatically provisions candidate profiles, journey roadmaps, and document vaults
 * according to the purchased candidateCount (e.g. 1 parent vs 2+ parents on IR-5, or multiple children on IR-2).
 */
export async function provisionCandidateJourneysAndVaults({
  supabase,
  userId,
  visaCategory,
  candidateCount = 1,
  tier,
  stripeSubscriptionId,
  isAddCandidate = false,
}: ProvisionCandidatesParams): Promise<ProvisionResult> {
  try {
    const isMultiCandidate = isMultiCandidateCategory(visaCategory);
    const isIr5 =
      visaCategory.toUpperCase().includes("IR-5") ||
      visaCategory.toUpperCase().includes("IR5");

    const canonicalVisa = getBaseVisaCategory(visaCategory);
    const normVisaType = canonicalVisa.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    const effectiveCount = isMultiCandidate ? Math.max(1, candidateCount) : 1;

    const dbStorage = new DocumentDatabaseStorage(supabase);

    // ── 1. Ensure Primary Journey Exists and Has Tier ────────────────────────
    let primaryJourneyId: string | undefined;

    const { data: existingPrimary } = await supabase
      .from("journeys")
      .select("id, subscription_tier")
      .eq("user_id", userId)
      .ilike("journey_type", normVisaType)
      .maybeSingle();

    const isExistingPrimaryPaid =
      existingPrimary?.subscription_tier &&
      existingPrimary.subscription_tier.toLowerCase() !== "free";

    // Adding an additional candidate to an existing IR-5 roster occurs only when specifically requested
    // (isAddCandidate flag is true) AND an active paid primary journey already exists.
    // If isAddCandidate is false (e.g. an upgrade or initial purchase), we upgrade/initialize candidate-1.
    const isAddingToExistingRoster = Boolean(
      isMultiCandidate && isAddCandidate && isExistingPrimaryPaid
    );

    if (existingPrimary) {
      primaryJourneyId = existingPrimary.id;
      if (!isAddingToExistingRoster) {
        await supabase
          .from("journeys")
          .update({
            subscription_tier: tier,
            stripe_subscription_id: stripeSubscriptionId || undefined,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingPrimary.id);
      }
    } else {
      // Seed a full journey from the template config
      const configPath = isIr5
        ? "data/visa-category/ir-5.json"
        : "data/visa-category/ir-1.json";

      try {
        const created = await journeyService.createJourneyFromConfig(
          configPath,
          { journey_type: normVisaType },
          { supabase, user: { id: userId } }
        );
        primaryJourneyId = created?.journey?.id || created?.id;
      } catch (err) {
        console.warn("[provisioning] createJourneyFromConfig primary fallback:", err);
      }

      if (!primaryJourneyId) {
        const { data: inserted } = await supabase
          .from("journeys")
          .insert({
            user_id: userId,
            journey_type: normVisaType,
            filing_method: "online",
            sponsor_structure: "individual",
            subscription_tier: tier,
            stripe_subscription_id: stripeSubscriptionId || undefined,
            status: "not_started",
          })
          .select("id")
          .single();
        primaryJourneyId = inserted?.id;
      } else {
        await supabase
          .from("journeys")
          .update({
            subscription_tier: tier,
            stripe_subscription_id: stripeSubscriptionId || undefined,
            updated_at: new Date().toISOString(),
          })
          .eq("id", primaryJourneyId);
      }
    }

    // ── 2. Initialize Candidate 1 Document Vault ─────────────────────────────
    if (primaryJourneyId) {
      try {
        const existingVault = await dbStorage.getVaultConfig(userId, primaryJourneyId);
        if (!existingVault) {
          await dbStorage.saveVaultConfig({
            userId,
            visaCategory: canonicalVisa,
            journeyId: primaryJourneyId,
            scenarioFlags: {},
            dynamicDocuments: {},
            beneficiaryName: "Candidate 1",
          });
        }
      } catch (err) {
        console.warn("[provisioning] Primary vault init error (non-fatal):", err);
      }
    }

    // ── 3. Fetch and Update Candidate Roster in user_profiles ────────────────
    const { data: profileRow } = await supabase
      .from("user_profiles")
      .select("profile_details")
      .eq("id", userId)
      .maybeSingle();

    const profileDetails = (profileRow?.profile_details || {}) as Record<string, unknown>;
    const existingCandidates: CandidateProfile[] = Array.isArray(profileDetails.candidates)
      ? (profileDetails.candidates as CandidateProfile[])
      : [];

    let updatedCandidates: CandidateProfile[] = [...existingCandidates];

    // Ensure Candidate 1 is in the roster with purchased tier
    const c1Index = updatedCandidates.findIndex((c) => c.id === "candidate-1");
    if (c1Index >= 0) {
      if (!isAddingToExistingRoster) {
        updatedCandidates[c1Index] = {
          ...updatedCandidates[c1Index],
          tier: tier as CandidateTier,
          isPreview: false,
          visaCategory: updatedCandidates[c1Index].visaCategory || canonicalVisa,
        };
      }
    } else {
      updatedCandidates.unshift({
        id: "candidate-1",
        label: "Candidate 1",
        relation: isIr5 ? "Other" : "Spouse",
        fullName: "",
        visaCategory: canonicalVisa,
        tier: tier as CandidateTier,
        isPrimary: true,
        isPreview: false,
        createdAt: new Date().toISOString(),
        colorTag: isIr5 ? "purple" : "emerald",
      });
    }

    const candidateJourneyIds: Record<string, string> = {};
    if (primaryJourneyId) {
      candidateJourneyIds["candidate-1"] = primaryJourneyId;
    }

    // ── 4. Provision Additional Candidates & Vaults (Multi-candidate journeys) ──────
    if (isMultiCandidate) {
      const configPath =
        normVisaType === "IR5"
          ? "data/visa-category/ir-5.json"
          : "data/visa-category/ir-1.json";
      const defaultRelation: CandidateRelation =
        canonicalVisa === "IR-2" || canonicalVisa === "CR-2" ? "Child" : "Other";

      if (isAddingToExistingRoster) {
        // Appending new candidate(s) to the existing roster
        const currentCount = updatedCandidates.length;
        const colorPalette: Array<CandidateProfile["colorTag"]> = [
          "teal",
          "blue",
          "purple",
          "amber",
          "rose",
          "emerald",
        ];

        for (let k = 1; k <= effectiveCount; k++) {
          const nextNum = currentCount + k;
          const candId = `candidate-${nextNum}`;
          const colorTag = colorPalette[(nextNum - 1) % colorPalette.length];

          const newCandidate: CandidateProfile = {
            id: candId,
            label: `Candidate ${nextNum}`,
            relation: defaultRelation,
            fullName: "",
            visaCategory: canonicalVisa,
            tier: tier as CandidateTier,
            isPrimary: false,
            isPreview: false,
            createdAt: new Date().toISOString(),
            colorTag,
          };
          updatedCandidates.push(newCandidate);

          // Provision Candidate's Journey row in Supabase
          const journeyKey = getCandidateJourneyKey(canonicalVisa, candId);
          let candJourneyId: string | undefined;

          const { data: existingCandJourney } = await supabase
            .from("journeys")
            .select("id")
            .eq("user_id", userId)
            .eq("journey_type", journeyKey)
            .maybeSingle();

          if (existingCandJourney) {
            candJourneyId = existingCandJourney.id;
            await supabase
              .from("journeys")
              .update({
                subscription_tier: tier,
                stripe_subscription_id: stripeSubscriptionId || undefined,
                updated_at: new Date().toISOString(),
              })
              .eq("id", existingCandJourney.id);
          } else {
            try {
              const created = await journeyService.createJourneyFromConfig(
                configPath,
                { journey_type: journeyKey },
                { supabase, user: { id: userId } }
              );
              candJourneyId = created?.journey?.id || created?.id;
            } catch (err) {
              console.warn(`[provisioning] Error seeding journey config for ${journeyKey}:`, err);
            }

            if (!candJourneyId) {
              const { data: inserted } = await supabase
                .from("journeys")
                .insert({
                  user_id: userId,
                  journey_type: journeyKey,
                  filing_method: "online",
                  sponsor_structure: "individual",
                  subscription_tier: tier,
                  stripe_subscription_id: stripeSubscriptionId || undefined,
                  status: "not_started",
                })
                .select("id")
                .single();
              candJourneyId = inserted?.id;
            } else {
              await supabase
                .from("journeys")
                .update({
                  subscription_tier: tier,
                  stripe_subscription_id: stripeSubscriptionId || undefined,
                  updated_at: new Date().toISOString(),
                })
                .eq("id", candJourneyId);
            }
          }

          if (candJourneyId) {
            candidateJourneyIds[candId] = candJourneyId;

            // Provision isolated Document Vault for Candidate nextNum
            try {
              const existingCandVault = await dbStorage.getVaultConfig(userId, candJourneyId);
              if (!existingCandVault) {
                await dbStorage.saveVaultConfig({
                  userId,
                  visaCategory: "IR-5",
                  journeyId: candJourneyId,
                  scenarioFlags: {},
                  dynamicDocuments: {},
                  beneficiaryName: `Candidate ${nextNum}`,
                });
              }
            } catch (err) {
              console.warn(`[provisioning] Candidate ${nextNum} vault init error (non-fatal):`, err);
            }
          }
        }
      } else if (effectiveCount > 1) {
        for (let i = 2; i <= effectiveCount; i++) {
          const candId = `candidate-${i}`;
          const cIndex = updatedCandidates.findIndex((c) => c.id === candId);

          if (cIndex >= 0) {
            updatedCandidates[cIndex] = {
              ...updatedCandidates[cIndex],
              tier: tier as CandidateTier,
              isPreview: false,
              visaCategory: canonicalVisa,
            };
          } else {
            updatedCandidates.push({
              id: candId,
              label: `Candidate ${i}`,
              relation: defaultRelation,
              fullName: "",
              visaCategory: canonicalVisa,
              tier: tier as CandidateTier,
              isPrimary: false,
              isPreview: false,
              createdAt: new Date().toISOString(),
              colorTag: i === 2 ? "teal" : i === 3 ? "blue" : i === 4 ? "emerald" : "amber",
            });
          }

          // Provision Candidate's Journey row in Supabase
          const journeyKey = getCandidateJourneyKey(canonicalVisa, candId);
          let candJourneyId: string | undefined;

          const { data: existingCandJourney } = await supabase
            .from("journeys")
            .select("id")
            .eq("user_id", userId)
            .eq("journey_type", journeyKey)
            .maybeSingle();

          if (existingCandJourney) {
            candJourneyId = existingCandJourney.id;
            await supabase
              .from("journeys")
              .update({
                subscription_tier: tier,
                stripe_subscription_id: stripeSubscriptionId || undefined,
                updated_at: new Date().toISOString(),
              })
              .eq("id", existingCandJourney.id);
          } else {
            try {
              const created = await journeyService.createJourneyFromConfig(
                configPath,
                { journey_type: journeyKey },
                { supabase, user: { id: userId } }
              );
              candJourneyId = created?.journey?.id || created?.id;
            } catch (err) {
              console.warn(`[provisioning] Error seeding journey config for ${journeyKey}:`, err);
            }

            if (!candJourneyId) {
              const { data: inserted } = await supabase
                .from("journeys")
                .insert({
                  user_id: userId,
                  journey_type: journeyKey,
                  filing_method: "online",
                  sponsor_structure: "individual",
                  subscription_tier: tier,
                  stripe_subscription_id: stripeSubscriptionId || undefined,
                  status: "not_started",
                })
                .select("id")
                .single();
              candJourneyId = inserted?.id;
            } else {
              await supabase
                .from("journeys")
                .update({
                  subscription_tier: tier,
                  stripe_subscription_id: stripeSubscriptionId || undefined,
                  updated_at: new Date().toISOString(),
                })
                .eq("id", candJourneyId);
            }
          }

          if (candJourneyId) {
            candidateJourneyIds[candId] = candJourneyId;

            // Provision isolated Document Vault for Candidate i
            try {
              const existingCandVault = await dbStorage.getVaultConfig(userId, candJourneyId);
              if (!existingCandVault) {
                await dbStorage.saveVaultConfig({
                  userId,
                  visaCategory: "IR-5",
                  journeyId: candJourneyId,
                  scenarioFlags: {},
                  dynamicDocuments: {},
                  beneficiaryName: `Candidate ${i}`,
                });
              }
            } catch (err) {
              console.warn(`[provisioning] Candidate ${i} vault init error (non-fatal):`, err);
            }
          }
        }
      }
    }

    // ── 5. Save Updated Candidates to user_profiles ──────────────────────────
    const TIER_RANK: Record<string, number> = { free: 0, basic: 1, premium: 2, executive: 3 };
    const highestRank = updatedCandidates.reduce((max, c) => {
      const rank = TIER_RANK[(c.tier || "free").toLowerCase()] || 0;
      return Math.max(max, rank);
    }, TIER_RANK[(tier || "free").toLowerCase()] || 0);
    const highestTier =
      Object.keys(TIER_RANK).find((k) => TIER_RANK[k] === highestRank) || tier;

    await supabase
      .from("user_profiles")
      .update({
        subscription_tier: highestTier,
        subscription_status: "active",
        profile_details: {
          ...profileDetails,
          candidates: updatedCandidates,
          activeCandidateId: profileDetails.activeCandidateId || "candidate-1",
        },
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    return {
      success: true,
      provisionedCandidates: updatedCandidates,
      primaryJourneyId,
      candidateJourneyIds,
    };
  } catch (error: any) {
    console.error("[provisionCandidateJourneysAndVaults] Error:", error);
    return {
      success: false,
      provisionedCandidates: [],
      candidateJourneyIds: {},
      error: error?.message || "Unknown provisioning error",
    };
  }
}
