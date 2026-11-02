/**
 * Interview Prep Purchase Validation
 * 
 * Handles checking if users have purchased access to specific categories.
 * Integrates with existing purchased_addons system in user profiles.
 */

import { createClient } from '@/lib/supabase/server';
import { hasStandaloneAccess } from '@/lib/wallet/state';
import { resolveOwnedJourney, type JourneyRef } from '@/lib/journey/resolveOwnedJourney';
import { canUse } from '@/lib/entitlements/helpers';
import { normalizePlanTier } from '@/lib/entitlements/config';

/** Wallet catalog id of the standalone Interview Prep tool. */
const WALLET_RESOURCE_ID = 'interview-prep';

/**
 * Standalone wallet unlock: unlimited standalone sessions in every category.
 * Counts a credit unlock or the bare all-categories "interview-prep" add-on.
 * A per-category purchase ("interview-prep:<slug>") is NOT a wallet unlock: it
 * keeps its per-category session count below. Journey sessions never come here.
 */
export async function hasInterviewPrepWalletUnlock(
  userId: string,
  purchasedAddons: readonly unknown[] = []
): Promise<boolean> {
  const supabase = await createClient();
  return hasStandaloneAccess(supabase, userId, 'tool', WALLET_RESOURCE_ID, purchasedAddons);
}

//  Addon ID format for interview prep categories
export function getAddonIdForCategory(categorySlug: string): string {
  return `interview-prep:${categorySlug}`;
}


//  Parse category slug from addon ID
export function getCategoryFromAddonId(addonId: string): string | null {
  if (!addonId.startsWith('interview-prep:')) {
    return null;
  }
  return addonId.replace('interview-prep:', '');
}

/**
 * Check if user has purchased access to a category
 * 
 * @param userId - User ID to check
 * @param categorySlug - Category slug (e.g., 'ir-1-spouse')
 * @returns True if user has access
 */
export async function checkCategoryPurchase(
  userId: string,
  categorySlug: string
): Promise<boolean> {
  const supabase = await createClient();
  
  // Get user profile
  const { data: profile, error } = await supabase
    .from('user_profiles')
    .select('subscription_tier, profile_details')
    .eq('id', userId)
    .single();
  
  if (error || !profile) {
    console.error('Failed to fetch user profile:', error);
    return false;
  }
  
  // Check subscription tier (Premium/Executive = unlimited access)
  //   if (profile.subscription_tier === 'premium' || 
  //       profile.subscription_tier === 'executive') {
  //     return true;
  //   }
  
  // Check purchased addons for this category
  const purchasedAddons = profile.profile_details?.purchased_addons || [];
  const addonId = getAddonIdForCategory(categorySlug);
  
  return purchasedAddons.includes(addonId);
}

/**
 * Count how many times a category has been purchased
 * Used for repurchase support (multiple purchases = multiple sessions allowed)
 * 
 * @param userId - User ID to check
 * @param categorySlug - Category slug
 * @returns Number of times purchased
 */
export async function countCategoryPurchases(
  userId: string,
  categorySlug: string
): Promise<number> {
  const supabase = await createClient();
  
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('profile_details')
    .eq('id', userId)
    .single();
  
  if (!profile) {
    return 0;
  }
  
  const purchasedAddons = profile.profile_details?.purchased_addons || [];
  const addonId = getAddonIdForCategory(categorySlug);
  
  // Count occurrences (allows duplicate purchases)
  return purchasedAddons.filter((addon: string) => addon === addonId).length;
}

/**
 * Count how many tool sessions exist for a category
 * 
 * @param userId - User ID
 * @param categorySlug - Category slug
 * @returns Number of existing tool sessions
 */
export async function countToolSessions(
  userId: string,
  categorySlug: string
): Promise<number> {
  const supabase = await createClient();
  
  const { data: sessions, error } = await supabase
    .from('interview_prep_sessions')
    .select('id')
    .eq('user_id', userId)
    .eq('category_slug', categorySlug)
    .eq('source', 'tool');
  
  if (error) {
    console.error('Failed to count tool sessions:', error);
    return 0;
  }
  
  return sessions?.length || 0;
}

/**
 * Count active, unfinished standalone sessions for a category.
 * Completed sessions consume a purchase credit, but should not make the
 * category look "Purchased" on the selection screen.
 */
export async function countIncompleteToolSessions(
  userId: string,
  categorySlug: string,
  candidateId?: string | null
): Promise<number> {
  const supabase = await createClient();

  let query = supabase
    .from('interview_prep_sessions')
    .select('id')
    .eq('user_id', userId)
    .eq('category_slug', categorySlug)
    .eq('source', 'tool')
    .eq('completed', false);

  if (candidateId) {
    query = query.eq('candidate_id', candidateId);
  }

  const { data: sessions, error } = await query;

  if (error) {
    console.error('Failed to count incomplete tool sessions:', error);
    return 0;
  }

  return sessions?.length || 0;
}

//  Validation result type
export interface ValidationResult {
  allowed: boolean;
  reason:
    | 'subscription'
    | 'wallet_unlock'
    | 'purchase_available'
    | 'NO_PURCHASE'
    | 'PURCHASE_EXHAUSTED';
  message?: string;
}

/**
 * Validate if user can create a tool session for a category
 * 
 * Checks:
 * 1. Subscription tier (Premium/Executive = always allowed)
 * 2. Purchase count vs session count
 * 
 * @param userId - User ID
 * @param categorySlug - Category slug
 * @param candidateId - Optional candidate ID for multi-candidate context
 * @returns Validation result
 */
export async function validateToolSessionCreation(
  userId: string,
  categorySlug: string,
  candidateId?: string | null
): Promise<ValidationResult> {
  const supabase = await createClient();
  
  // Get user profile
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('subscription_tier, profile_details')
    .eq('id', userId)
    .single();
  
  if (!profile) {
    return {
      allowed: false,
      reason: 'NO_PURCHASE',
      message: 'User profile not found'
    };
  }
  
  // Check subscription tier
  //   if (profile.subscription_tier === 'premium' || 
  //       profile.subscription_tier === 'executive') {
  //     return {
  //       allowed: true,
  //       reason: 'subscription',
  //       message: 'Unlimited access via subscription'
  //     };
  //   }
  
  const purchasedAddons = profile.profile_details?.purchased_addons;
  if (
    await hasInterviewPrepWalletUnlock(
      userId,
      Array.isArray(purchasedAddons) ? purchasedAddons : []
    )
  ) {
    return {
      allowed: true,
      reason: 'wallet_unlock',
      message: 'Unlimited standalone access via wallet unlock'
    };
  }

  // Count purchases
  const purchaseCount = await countCategoryPurchases(userId, categorySlug);
  
  if (purchaseCount === 0) {
    return {
      allowed: false,
      reason: 'NO_PURCHASE',
      message: 'Category not purchased. Please purchase to create session.'
    };
  }

  const incompleteSessionCount = await countIncompleteToolSessions(userId, categorySlug, candidateId);

  if (incompleteSessionCount > 0) {
    return {
      allowed: true,
      reason: 'purchase_available',
      message: 'Existing purchased session available'
    };
  }
  
  // Count existing sessions
  const sessionCount = await countToolSessions(userId, categorySlug);
  
  if (sessionCount >= purchaseCount) {
    return {
      allowed: false,
      reason: 'PURCHASE_EXHAUSTED',
      message: 'All purchased sessions used. Purchase again to create another session.'
    };
  }
  
  return {
    allowed: true,
    reason: 'purchase_available',
    message: `${purchaseCount - sessionCount} session(s) remaining`
  };
}

export type JourneySessionValidation =
  | { allowed: true; journeyId: string }
  | {
      allowed: false;
      status: 403 | 404;
      reason: 'JOURNEY_NOT_FOUND' | 'JOURNEY_INACTIVE' | 'JOURNEY_PLAN_REQUIRED';
      message: string;
    };

/**
 * Validate a JOURNEY interview session. Journey sessions follow the journey's
 * own plan tier (like useJourneyPlan: journey tier + account add-ons) and never
 * the wallet or standalone category purchases. The journey must belong to the
 * user and still be active (journey sessions are blocked once it completes).
 */
export async function validateJourneySessionCreation(
  userId: string,
  ref: JourneyRef
): Promise<JourneySessionValidation> {
  const supabase = await createClient();
  const journey = await resolveOwnedJourney(supabase, userId, ref);
  if (!journey) {
    return { allowed: false, status: 404, reason: 'JOURNEY_NOT_FOUND', message: 'Journey not found' };
  }
  if (journey.status && !['in_progress', 'not_started'].includes(journey.status)) {
    return {
      allowed: false,
      status: 403,
      reason: 'JOURNEY_INACTIVE',
      message: 'This journey is no longer active.',
    };
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('profile_details')
    .eq('id', userId)
    .maybeSingle();
  const raw = profile?.profile_details?.purchased_addons;
  const addons = Array.isArray(raw) ? raw.filter((a: unknown): a is string => typeof a === 'string') : [];

  if (!canUse('basic_interview_prep', normalizePlanTier(journey.subscription_tier), addons)) {
    return {
      allowed: false,
      status: 403,
      reason: 'JOURNEY_PLAN_REQUIRED',
      message: 'Interview Prep is not included in this journey plan. Upgrade the journey to use it.',
    };
  }
  return { allowed: true, journeyId: journey.id };
}
