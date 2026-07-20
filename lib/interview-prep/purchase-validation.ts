/**
 * Interview Prep Purchase Validation
 * 
 * Handles checking if users have purchased access to specific categories.
 * Integrates with existing purchased_addons system in user profiles.
 */

import { createClient } from '@/lib/supabase/server';

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

//  Validation result type
export interface ValidationResult {
  allowed: boolean;
  reason: 'subscription' | 'purchase_available' | 'NO_PURCHASE' | 'PURCHASE_EXHAUSTED';
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
 * @returns Validation result
 */
export async function validateToolSessionCreation(
  userId: string,
  categorySlug: string
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
  
  // Count purchases
  const purchaseCount = await countCategoryPurchases(userId, categorySlug);
  
  if (purchaseCount === 0) {
    return {
      allowed: false,
      reason: 'NO_PURCHASE',
      message: 'Category not purchased. Please purchase to create session.'
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