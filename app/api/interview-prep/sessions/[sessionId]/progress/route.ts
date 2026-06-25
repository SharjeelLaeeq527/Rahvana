import { NextRequest, NextResponse } from "next/server";
import {
  deleteInterviewSessionProgressDB,
  getInterviewSessionProgressDB,
  upsertInterviewSessionProgressDB,
} from "@/lib/interview-prep/data-access";
import { resolveSessionAccess } from "@/lib/interview-prep/case-access";
import { InterviewPrepSessionProgressInput } from "@/lib/interview-prep/types";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  try {
    const { sessionId } = await params;

    const access = await resolveSessionAccess(sessionId);
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }
    const acting = access.mode === "delegate" ? access.acting : undefined;

    const progress = await getInterviewSessionProgressDB(sessionId, acting);

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

    // Saving practice progress is a write — beneficiary only; petitioner is
    // read-only.
    const access = await resolveSessionAccess(sessionId, { write: true });
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }
    const acting = access.mode === "delegate" ? access.acting : undefined;

    const body = (await request.json()) as InterviewPrepSessionProgressInput;

    const progress = await upsertInterviewSessionProgressDB(sessionId, body, acting);

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

    // Deleting practice progress is a write — beneficiary only; petitioner is
    // read-only.
    const access = await resolveSessionAccess(sessionId, { write: true });
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }
    const acting = access.mode === "delegate" ? access.acting : undefined;

    await deleteInterviewSessionProgressDB(sessionId, acting);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting interview progress:", error);
    return NextResponse.json(
      { error: "Failed to delete interview progress" },
      { status: 500 },
    );
  }
}
