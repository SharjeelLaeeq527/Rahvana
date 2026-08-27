/**
 * Interview Preparation API
 *
 * Handles creation and retrieval of interview prep sessions.
 * Now supports dynamic category selection.
 */

import { NextResponse, NextRequest } from "next/server";
import { createInterviewSession, getInterviewSession } from "@/lib/interview-prep/service";
import { categoryLoader } from "@/lib/interview-prep/category-loader";
import {
  validateToolSessionCreation,
  getAddonIdForCategory,
} from "@/lib/interview-prep/purchase-validation";
import { createClient } from "@/lib/supabase/server";
import { E, msg } from "@/lib/errors";

/**
 * POST /api/interview-prep
 * Create a new interview preparation session
 *
 * Body:
 * - category_slug: string (e.g., 'ir-1-spouse')
 * - user_email: string
 * - user_name: string
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { category_slug, user_email, user_name } = body;

    // Validate required fields
    if (!category_slug) {
      return NextResponse.json(
        { error: msg(E.CASE_DATA_JOURNEY_ID_REQUIRED, { fields: "[category_slug]" }) },
        { status: 400 }
      );
    }

    // Validate category exists and is active
    const categories = await categoryLoader.getActiveCategories();
    const category = categories.find((c) => c.categorySlug === category_slug);

    if (!category) {
      return NextResponse.json(
        { error: `Invalid or inactive category slug: ${category_slug}` },
        { status: 400 }
      );
    }

    // Get user for purchase validation
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validate purchase BEFORE creating session
    const validation = await validateToolSessionCreation(user.id, category_slug);

    if (!validation.allowed) {
      if (validation.reason === "NO_PURCHASE") {
        return NextResponse.json(
          {
            success: false,
            error: "PURCHASE_REQUIRED",
            message: validation.message,
            addon: {
              id: getAddonIdForCategory(category_slug),
              name: `Interview Prep - ${category.categoryName || category_slug}`,
              price: 200,
            },
          },
          { status: 402 }
        );
      }

      if (validation.reason === "PURCHASE_EXHAUSTED") {
        return NextResponse.json(
          {
            success: false,
            error: "PURCHASE_EXHAUSTED",
            message: validation.message,
            repurchase: {
              addon_id: getAddonIdForCategory(category_slug),
              message: "Purchase again to create another session",
            },
          },
          { status: 402 }
        );
      }
    }

    // Create session
    const result = await createInterviewSession({
      category_slug,
      user_email: user_email,
      user_name: user_name,
    });

    return NextResponse.json(
      {
        success: true,
        alreadyExists: result.alreadyExists,
        session: result.session,
        source: result.source || "tool",
      },
      {
        status: result.alreadyExists ? 200 : 201,
      }
    );
  } catch (error) {
    console.error("Error creating interview session:", error);
    return NextResponse.json({ error: msg(E.TOOL_INTERVIEW_SESSION_FAILED) }, { status: 500 });
  }
}

/**
 * GET /api/interview-prep?sessionId={id}
 * Retrieve an existing interview session
 *
 * OR
 *
 * GET /api/interview-prep?category_slug={slug}
 * Retrieve category questionnaire data
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const sessionId = searchParams.get("sessionId");
  const category_slug = searchParams.get("category_slug");

  // If category_slug provided, return questionnaire data
  if (category_slug) {
    try {
      const categoryData = await categoryLoader.loadCategory(category_slug);

      return NextResponse.json({
        success: true,
        questionnaire: categoryData.questionnaire,
        questionBank: categoryData.questionBank,
      });
    } catch (error) {
      console.error("Error loading category data:", error);
      return NextResponse.json({ error: "Category not found or failed to load" }, { status: 404 });
    }
  }

  // If sessionId provided, return session data
  if (!sessionId) {
    return NextResponse.json(
      { error: msg(E.CASE_DATA_JOURNEY_ID_REQUIRED, { fields: "[sessionId]" }) },
      { status: 400 }
    );
  }

  try {
    const session = await getInterviewSession(sessionId);

    if (!session) {
      return NextResponse.json({ error: msg(E.CASE_DATA_NOT_FOUND) }, { status: 404 });
    }

    return NextResponse.json({ success: true, session });
  } catch (error) {
    console.error("Error fetching interview session:", error);
    return NextResponse.json({ error: "Failed to fetch interview session" }, { status: 500 });
  }
}
