// app/api/chat/route.ts
import { type NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json()

    if (!query || query.trim() === "") {
      return NextResponse.json(
        { error: "Query cannot be empty" },
        { status: 400 }
      )
    }

    // --- SMART URL LOGIC START ---
    // Production me NEXT_PUBLIC_API_URL use karega, Local me localhost fallback
    let baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
    
    // Trailing slash safe remove
    baseUrl = baseUrl.replace(/\/$/, "");

    // Path construct logic: Check if /api/v1 exists
    const endpoint = baseUrl.includes("/api/v1") 
      ? `${baseUrl}/ask-whatsapp`        // Vercel config: .../api/v1/ask-whatsapp
      : `${baseUrl}/api/v1/ask-whatsapp` // Local config: .../api/v1/ask-whatsapp

    console.log("NextJS API Proxy calling Backend at:", endpoint);
    // --- SMART URL LOGIC END ---

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: query.trim() }),
    })

    if (!response.ok) {
      throw new Error(`Backend error: ${response.status}`)
    }

    const data = await response.json()

    return NextResponse.json({
      response: data.response || "No response from assistant",
    })
  } catch (error) {
    console.error("❌ Chat API Error:", error)
    return NextResponse.json(
      { 
        response: "Sorry, I'm having trouble connecting to the assistant. Please try again.",
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}