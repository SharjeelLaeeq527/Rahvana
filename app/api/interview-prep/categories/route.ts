/**
 * This API route handles fetching all active interview prep categories along with their purchase status for the authenticated user. It checks if the user is logged in, retrieves the active categories, and determines whether each category has been purchased by the user. The response includes the category details along with purchase information.
 *
 * @route GET /api/interview-prep/categories
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkCategoryPurchase } from '@/lib/interview-prep/purchase-validation';
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

    // Add purchase status to each category
    const categoriesWithStatus = await Promise.all(
      categories.map(async (category) => {
        const isPurchased = await checkCategoryPurchase(
          user.id,
          category.categorySlug
        );

        return {
          ...category,
          isPurchased,
          requiresPurchase: !isPurchased,
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