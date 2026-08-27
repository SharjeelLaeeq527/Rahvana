/**
 * POST /api/journeys/create-from-config
 * Create a complete journey from a configuration JSON file
 *
 * This endpoint:
 * 1. Accepts a visa type (e.g., "ir-1")
 * 2. Loads the corresponding JSON config
 * 3. Creates journey + chapters + steps + case data in one operation
 * 4. Returns the complete journey with all related data
 */

import { NextRequest, NextResponse } from "next/server";
import { journeyService } from "@/lib/journey/service";

interface CreateJourneyFromConfigRequest {
  visa_type: string; // e.g. "ir-1"
  filing_method?: "online" | "paper"; // Optional override
}

// POST /api/journeys/create-from-config - Create a journey from a JSON config file
export async function POST(request: NextRequest) {
  try {
    const body: CreateJourneyFromConfigRequest = await request.json();

    // Validate required field
    if (!body.visa_type) {
      return NextResponse.json(
        {
          success: false,
          error: "visa_type is required (e.g., 'ir-1', 'eb-3', 'f-1')",
        },
        { status: 400 }
      );
    }

    // Build path to JSON config
    const configPath = `data/visa-category/${body.visa_type.toLowerCase()}.json`;

    console.log(`\n API Request: Create Journey from Config`);
    console.log(`   visa_type: ${body.visa_type}`);
    console.log(`   filing_method: ${body.filing_method || "not specified"}`);

    // Create journey from config using the service method
    const result = await journeyService.createJourneyFromConfig(configPath, {
      filing_method: body.filing_method,
    });

    return NextResponse.json(
      {
        success: true,
        data: result,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in POST /api/journeys/create-from-config:", error);

    const errorMessage =
      (error instanceof Error ? error.message : String(error)) || "Unknown error";

    // Handle specific error cases
    if (errorMessage.includes("ENOENT") || errorMessage.includes("not found")) {
      return NextResponse.json(
        {
          success: false,
          error: `Config file not found. Supported visa types: ir-1, eb-3, f-1, etc.`,
        },
        { status: 404 }
      );
    }

    if (errorMessage.includes("JSON")) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid JSON in config file: ${errorMessage}`,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}

// GET /api/journeys/create-from-config - List available visa types and usage instructions
export async function GET(request: NextRequest) {
  try {
    // List available visa types (in production, read from directory)
    const availableVisaTypes = [
      {
        code: "ir-1",
        name: "IR-1/CR-1 Spouse Visa",
        description: "Immediate Relative visa for spouse of U.S. citizen",
      },
    ];

    return NextResponse.json(
      {
        success: true,
        data: {
          message: "Available visa journey configurations",
          visa_types: availableVisaTypes,
          usage: {
            method: "POST",
            endpoint: "/api/journeys/create-from-config",
            body: {
              visa_type: "ir-1",
              filing_method: "online (optional)",
            },
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in GET /api/journeys/create-from-config:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
