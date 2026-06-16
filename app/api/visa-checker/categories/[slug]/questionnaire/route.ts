import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { E, msg } from "@/lib/errors";
export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const { slug } = params;
    const filePath = path.join(
      process.cwd(),
      "data",
      "visa-checker",
      "categories",
      slug,
      "questionnaire.json"
    );

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: msg(E.TOOL_INTERVIEW_SELECT_CATEGORY) }, { status: 404 });
    }

    const fileContents = fs.readFileSync(filePath, "utf8");
    const questionnaire = JSON.parse(fileContents);

    return NextResponse.json(questionnaire);
  } catch (error) {
    console.error("Error loading questionnaire:", error);
    console.error("[visa-checker/questionnaire] Internal error:", error);
    return NextResponse.json({ error: msg(E.TOOL_INTERVIEW_QUESTIONS_FAILED) }, { status: 500 });
  }
}
