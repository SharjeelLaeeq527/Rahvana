/**
 * GET /api/interview-prep/categories
 * List all active interview preparation categories
 */

import { NextResponse } from "next/server";
import { categoryLoader } from "@/lib/interview-prep/category-loader";

export async function GET() {
  try {
    const categories = await categoryLoader.getActiveCategories();

    return NextResponse.json({
      success: true,
      categories,
    });
  } catch (error) {
    console.error("Error loading categories:", error);
    return NextResponse.json(
      { error: "Failed to load categories" },
      { status: 500 },
    );
  }
}
