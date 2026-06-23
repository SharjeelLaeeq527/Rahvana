import { NextResponse, NextRequest } from "next/server";
import { saveAIImprovementDB } from "@/lib/interview-prep/data-access";
import { resolveSessionAccess } from "@/lib/interview-prep/case-access";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { generatePrompt } from "@/lib/interview-prep/utils";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

/**
 * POST /api/interview-prep/ai-improve
 * Improve a user's answer using Google Gemini AI
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, questionId, userAnswer, question, improvementType } = body;

    // Validate required fields
    if (!sessionId || !questionId || !userAnswer || !question) {
      return NextResponse.json(
        { error: "Missing required fields: sessionId, questionId, userAnswer, question" },
        { status: 400 }
      );
    }

    // Owner OR shared-case member (petitioner) may improve answers on this session.
    const access = await resolveSessionAccess(sessionId);
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }
    const acting = access.mode === "delegate" ? access.acting : undefined;

    // Verify API key is configured
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "AI service not configured. Please set GEMINI_API_KEY." },
        { status: 503 }
      );
    }

    // Generate improvement using Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = generatePrompt(question, userAnswer, improvementType);

    try {
      const result = await model.generateContent(prompt);
      const improvedAnswer = result.response.text();

      // Save improvement record to DB
      await saveAIImprovementDB(
        sessionId,
        questionId,
        userAnswer,
        improvedAnswer,
        improvementType || "clarity",
        acting
      );

      return NextResponse.json(
        {
          success: true,
          originalAnswer: userAnswer,
          improvedAnswer,
          improvementType: improvementType || "clarity",
        },
        { status: 200 }
      );
    } catch (aiError: any) {
      console.error("Gemini API error:", aiError);
      return NextResponse.json(
        { error: "Failed to generate improvement. Please try again." },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Error improving answer:", error);
    const message = error instanceof Error ? error.message : "Failed to improve answer";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
