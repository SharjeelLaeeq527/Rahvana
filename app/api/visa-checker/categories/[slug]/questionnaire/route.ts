import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    const filePath = path.join(process.cwd(), "data", "visa-checker", "categories", slug, "questionnaire.json");

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    const fileContents = fs.readFileSync(filePath, "utf8");
    const questionnaire = JSON.parse(fileContents);

    return NextResponse.json(questionnaire);
  } catch (error) {
    console.error("Error loading questionnaire:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
