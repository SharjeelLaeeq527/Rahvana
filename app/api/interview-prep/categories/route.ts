/**
 * This API route handles fetching all active interview prep categories along with their purchase status for the authenticated user. It checks if the user is logged in, retrieves the active categories, and determines whether each category has been purchased by the user. The response includes the category details along with purchase information.
 *
 * @route GET /api/interview-prep/categories
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  countCategoryPurchases,
  countIncompleteToolSessions,
  countToolSessions,
  getAddonIdForCategory,
  hasInterviewPrepWalletUnlock,
} from '@/lib/interview-prep/purchase-validation';
import { categoryLoader } from '@/lib/interview-prep/category-loader';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const country = searchParams.get('country') || undefined; 

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Load all active categories
    const categories = await categoryLoader.getActiveCategories(country);

    // A standalone wallet unlock opens every category with unlimited sessions.
    // Journey callers (?scope=journey) never read wallet data.
    let walletUnlocked = false;
    if (searchParams.get('scope') !== 'journey') {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('profile_details')
        .eq('id', user.id)
        .maybeSingle();
      const addons = profile?.profile_details?.purchased_addons;
      walletUnlocked = await hasInterviewPrepWalletUnlock(
        user.id,
        Array.isArray(addons) ? addons : []
      );
    }

    // Add purchase status to each category
    const categoriesWithStatus = await Promise.all(
      categories.map(async (category) => {
        const [purchaseCount, usedSessionCount, activeSessionCount] = await Promise.all([
          countCategoryPurchases(user.id, category.categorySlug),
          countToolSessions(user.id, category.categorySlug),
          countIncompleteToolSessions(user.id, category.categorySlug),
        ]);

        const remainingPurchases = Math.max(purchaseCount - usedSessionCount, 0);
        const hasAvailablePurchase =
          walletUnlocked || remainingPurchases > 0 || activeSessionCount > 0;
        const purchaseExhausted = purchaseCount > 0 && !hasAvailablePurchase;

        return {
          ...category,
          isPurchased: hasAvailablePurchase,
          requiresPurchase: !hasAvailablePurchase,
          purchaseExhausted,
          purchaseCount,
          usedSessionCount,
          activeSessionCount,
          remainingPurchases,
          addonId: getAddonIdForCategory(category.categorySlug),
          price: 200,
        };
      })
    );

    return NextResponse.json({
      success: true,
      categories: categoriesWithStatus,
    });
  } catch (error) {
    console.error(
      'Error fetching categories with purchase status:',
      error
    );

    return NextResponse.json(
      { error: 'Failed to load categories' },
      { status: 500 }
    );
  }
}
