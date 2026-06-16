import { NextResponse } from "next/server";

// Deprecated endpoint: always return 410 Gone
export async function GET() {
  return NextResponse.json(
    { error: "This endpoint is gone. Use /api/receipt/journey instead." },
    { status: 410 }
  );
}
