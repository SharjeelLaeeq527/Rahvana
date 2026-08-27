import { NextRequest, NextResponse } from "next/server";
import {
  deleteInterviewSessionProgressDB,
  getInterviewSessionDB,
  getInterviewSessionProgressDB,
  upsertInterviewSessionProgressDB,
} from "@/lib/interview-prep/data-access";
import { InterviewPrepSessionProgressInput } from "@/lib/interview-prep/types";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  try {
    const { sessionId } = await params;

    if (!sessionId || sessionId === "undefined") {
      return NextResponse.json({ error: "Invalid session ID" }, { status: 400 });
    }

    const session = await getInterviewSessionDB(sessionId);
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const progress = await getInterviewSessionProgressDB(sessionId);

    return NextResponse.json({ success: true, progress });
  } catch (error) {
    console.error("Error loading interview progress:", error);
    return NextResponse.json(
      { error: "Failed to load interview progress" },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  try {
    const { sessionId } = await params;

    if (!sessionId || sessionId === "undefined") {
      return NextResponse.json({ error: "Invalid session ID" }, { status: 400 });
    }

    const body = (await request.json()) as InterviewPrepSessionProgressInput;

    const progress = await upsertInterviewSessionProgressDB(sessionId, body);

    return NextResponse.json({ success: true, progress });
  } catch (error) {
    console.error("Error saving interview progress:", error);
    return NextResponse.json(
      { error: "Failed to save interview progress" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  try {
    const { sessionId } = await params;

    if (!sessionId || sessionId === "undefined") {
      return NextResponse.json({ error: "Invalid session ID" }, { status: 400 });
    }

    await deleteInterviewSessionProgressDB(sessionId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting interview progress:", error);
    return NextResponse.json(
      { error: "Failed to delete interview progress" },
      { status: 500 },
    );
  }
}
