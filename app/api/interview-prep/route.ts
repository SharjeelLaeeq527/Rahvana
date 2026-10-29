/**
 * Interview Preparation API
 *
 * Handles creation and retrieval of interview prep sessions.
 * Now supports dynamic category selection.
 */

import { NextResponse, NextRequest } from "next/server";
import {
  createInterviewSession,
  createJourneyInterviewSession,
  getInterviewSession,
} from "@/lib/interview-prep/service";
import { categoryLoader } from "@/lib/interview-prep/category-loader";
import {
  validateToolSessionCreation,
  validateJourneySessionCreation,
  getAddonIdForCategory,
  countCategoryPurchases,
  countToolSessions,
} from "@/lib/interview-prep/purchase-validation";
import { getInterviewSessionByCategory } from "@/lib/interview-prep/data-access";
import { createClient } from "@/lib/supabase/server";
import { getServiceRoleClient } from "@/lib/api/authGuards";
import { topupAmountForDeficit } from "@/lib/wallet/launch";
import { E, msg } from "@/lib/errors";

/**
 * POST /api/interview-prep
 * Create a new interview preparation session
 *
 * Body:
 * - category_slug: string (e.g., 'ir-1-spouse')
 * - user_email: string
 * - user_name: string
 * - source?: "journey" | "tool" (default "tool")
 * - journey_id / journey_category / candidate_id: required context for "journey"
 *
 * Journey sessions are validated against the user's own journey and its plan
 * tier and are stored as source "journey". Standalone ("tool") sessions need a
 * wallet unlock or a per-category purchase; the plan tier does not count.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { category_slug, user_email, user_name, source, journey_id, journey_category, candidate_id } =
      body ?? {};

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

    // Get user for authentication
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (source === "journey") {
      const journeyCheck = await validateJourneySessionCreation(user.id, {
        journeyId: typeof journey_id === "string" ? journey_id : null,
        journeyCategory: typeof journey_category === "string" ? journey_category : null,
        candidateId: typeof candidate_id === "string" ? candidate_id : null,
      });
      if (!journeyCheck.allowed) {
        return NextResponse.json(
          { success: false, error: journeyCheck.reason, message: journeyCheck.message },
          { status: journeyCheck.status }
        );
      }

      const journeyResult = candidate_id
        ? await createJourneyInterviewSession(
            journeyCheck.journeyId,
            category_slug,
            typeof candidate_id === "string" ? candidate_id : undefined
          )
        : await createJourneyInterviewSession(journeyCheck.journeyId, category_slug);
      return NextResponse.json(
        {
          success: true,
          alreadyExists: journeyResult.alreadyExists,
          session: journeyResult.session,
          source: "journey",
        },
        { status: journeyResult.alreadyExists ? 200 : 201 }
      );
    }

    // Standalone: check if active incomplete session already exists
    const existingSession = await getInterviewSessionByCategory(
      category_slug,
      typeof candidate_id === "string" ? candidate_id : undefined
    );
    if (existingSession && !existingSession.completed) {
      return NextResponse.json(
        {
          success: true,
          alreadyExists: true,
          session: existingSession,
          source: "tool",
        },
        { status: 200 }
      );
    }

    // Creating a NEW session: check for legacy unused purchases first
    const purchaseCount = await countCategoryPurchases(user.id, category_slug);
    const sessionCount = await countToolSessions(user.id, category_slug);
    const hasLegacyPrepaid = purchaseCount > sessionCount;

    if (hasLegacyPrepaid) {
      const result = await createInterviewSession({
        category_slug,
        user_email: user_email,
        user_name: user_name,
        candidate_id: typeof candidate_id === "string" ? candidate_id : undefined,
      });

      return NextResponse.json(
        {
          success: true,
          alreadyExists: false,
          session: result.session,
          source: "tool",
        },
        { status: 201 }
      );
    }

    // Each new session requires 200 credits from the wallet
    const serviceSupabase = getServiceRoleClient();
    const { data: walletData } = await serviceSupabase
      .from("user_wallets")
      .select("balance")
      .eq("user_id", user.id)
      .maybeSingle();

    const currentBalance = Number(walletData?.balance ?? 0);
    const requiredCredits = 200;

    if (currentBalance < requiredCredits) {
      const deficit = requiredCredits - currentBalance;
      return NextResponse.json(
        {
          success: false,
          error: "INSUFFICIENT_CREDITS",
          message: "You need 200 credits to start a new interview prep session.",
          required: requiredCredits,
          available: currentBalance,
          deficit,
          topupAmount: topupAmountForDeficit(deficit),
        },
        { status: 402 }
      );
    }

    // Balance is sufficient: create new session and deduct 200 credits
    const result = await createInterviewSession({
      category_slug,
      user_email: user_email,
      user_name: user_name,
      candidate_id: typeof candidate_id === "string" ? candidate_id : undefined,
    });

    const { data: deductResult, error: deductError } = await serviceSupabase.rpc(
      "deduct_wallet_credits_atomic",
      {
        p_user_id: user.id,
        p_resource_type: "tool",
        p_resource_id: `interview-prep:session:${result.session.id}`,
        p_credit_cost: requiredCredits,
        p_description: `Interview Prep Session - ${category.categoryName || category_slug}`,
        p_idempotency_key: `interview_prep_session:${result.session.id}`,
        p_metadata: {
          source: "interview_prep_session",
          category_slug,
          candidate_id: typeof candidate_id === "string" ? candidate_id : "candidate-1",
          session_id: result.session.id,
        },
      }
    );

    if (deductError || (deductResult && deductResult.success === false)) {
      await serviceSupabase.from("interview_prep_sessions").delete().eq("id", result.session.id);
      const deficit = Number(deductResult?.deficit ?? requiredCredits);
      return NextResponse.json(
        {
          success: false,
          error: "INSUFFICIENT_CREDITS",
          message: "Insufficient credits to start session.",
          required: requiredCredits,
          available: Number(deductResult?.available ?? currentBalance),
          deficit,
          topupAmount: topupAmountForDeficit(deficit),
        },
        { status: 402 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        alreadyExists: false,
        session: result.session,
        source: "tool",
        charged: requiredCredits,
        balance: deductResult?.balance,
      },
      { status: 201 }
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
