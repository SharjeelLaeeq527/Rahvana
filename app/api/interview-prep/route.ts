import { NextResponse, NextRequest } from "next/server";
import { createInterviewSession, getInterviewSession } from "@/lib/interview-prep/service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Create a new interview session
    const session = await createInterviewSession({
      user_email: body.user_email,
      user_name: body.user_name,
      case_type: body.case_type || 'Spouse',
    });

    return NextResponse.json({ 
      success: true, 
      session 
    });
  } catch (error) {
    console.error("Error creating interview session:", error);
    return NextResponse.json(
      { error: "Failed to create interview session" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("sessionId");
  
  if (!sessionId) {
    return NextResponse.json(
      { error: "Session ID is required" },
      { status: 400 }
    );
  }

  try {
    const session = await getInterviewSession(sessionId);
    
    if (!session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      session 
    });
  } catch (error) {
    console.error("Error fetching interview session:", error);
    return NextResponse.json(
      { error: "Failed to fetch interview session" },
      { status: 500 }
    );
  }
}