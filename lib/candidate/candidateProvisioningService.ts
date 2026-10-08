// lib/candidate/candidateProvisioningService.ts
// ============================================================================
// Multi-Candidate & Document Vault Auto-Provisioning Service
//
// Automatically provisions candidate profiles (Candidate 1, Candidate 2, etc.),
// their dedicated candidate journeys in Supabase, and their isolated
// Document Vault configurations upon successful journey checkout or plan activation.
// ============================================================================

import { SupabaseClient } from "@supabase/supabase-js";
import type { CandidateProfile, CandidateTier } from "@/types/candidate";
import { getCandidateJourneyKey, getBaseVisaCategory } from "./candidateSyncService";
import { DocumentDatabaseStorage } from "@/lib/document-vault/storage-database";
import { journeyService } from "@/lib/journey/service";

export interface ProvisionCandidatesParams {
  supabase: SupabaseClient;
  userId: string;
  visaCategory: string;
  candidateCount: number;
  tier: string;
  stripeSubscriptionId?: string;
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
 * according to the purchased candidateCount (e.g. 1 parent vs 2+ parents on IR-5).
 */
export async function provisionCandidateJourneysAndVaults({
  supabase,
  userId,
  visaCategory,
  candidateCount = 1,
  tier,
  stripeSubscriptionId,
}: ProvisionCandidatesParams): Promise<ProvisionResult> {
  try {
    const isIr5 =
      visaCategory.toUpperCase().includes("IR-5") ||
      visaCategory.toUpperCase().includes("IR5");
    const isIr1 =
      visaCategory.toUpperCase().includes("IR-1") ||
      visaCategory.toUpperCase().includes("IR1") ||
      visaCategory.toUpperCase().includes("CR-1");

    const normVisaType = isIr5 ? "IR5" : "IR1";
    const canonicalVisa = isIr5 ? "IR-5" : "IR-1";
    const effectiveCount = isIr5 ? Math.max(1, candidateCount) : 1;

    const dbStorage = new DocumentDatabaseStorage(supabase);

    // ── 1. Ensure Primary Journey Exists and Has Tier ────────────────────────
    let primaryJourneyId: string | undefined;

    const { data: existingPrimary } = await supabase
      .from("journeys")
      .select("id, subscription_tier")
      .eq("user_id", userId)
      .ilike("journey_type", normVisaType)
      .maybeSingle();

    if (existingPrimary) {
      primaryJourneyId = existingPrimary.id;
      await supabase
        .from("journeys")
        .update({
          subscription_tier: tier,
          stripe_subscription_id: stripeSubscriptionId || undefined,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingPrimary.id);
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
      updatedCandidates[c1Index] = {
        ...updatedCandidates[c1Index],
        tier: tier as CandidateTier,
        isPreview: false,
        visaCategory: updatedCandidates[c1Index].visaCategory || canonicalVisa,
      };
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

    // ── 4. Provision Additional Candidates & Vaults (IR-5 multi-parent) ──────
    if (isIr5 && effectiveCount > 1) {
      const configPath = "data/visa-category/ir-5.json";

      for (let i = 2; i <= effectiveCount; i++) {
        const candId = `candidate-${i}`;
        const cIndex = updatedCandidates.findIndex((c) => c.id === candId);

        if (cIndex >= 0) {
          updatedCandidates[cIndex] = {
            ...updatedCandidates[cIndex],
            tier: tier as CandidateTier,
            isPreview: false,
            visaCategory: "IR-5",
          };
        } else {
          updatedCandidates.push({
            id: candId,
            label: `Candidate ${i}`,
            relation: "Other",
            fullName: "",
            visaCategory: "IR-5",
            tier: tier as CandidateTier,
            isPrimary: false,
            isPreview: false,
            createdAt: new Date().toISOString(),
            colorTag: i === 2 ? "teal" : i === 3 ? "blue" : i === 4 ? "emerald" : "amber",
          });
        }

        // Provision Candidate's Journey row in Supabase
        const journeyKey = getCandidateJourneyKey("IR-5", candId); // e.g. "ir5_candidate2"
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

    // ── 5. Save Updated Candidates to user_profiles ──────────────────────────
    await supabase
      .from("user_profiles")
      .update({
        subscription_tier: tier,
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
