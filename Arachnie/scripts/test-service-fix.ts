import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

async function testService() {
  console.log("Testing consultationService.createTimeSlot...");
  try {
    const { consultationService } = await import("../lib/services/consultationService");
    const newSlot = await consultationService.createTimeSlot({
      date: new Date(),
      start_time: "14:00",
      end_time: "15:00",
      status: "available",
      max_bookings: 1,
      current_bookings: 0,
    });
    console.log("Slot created successfully:", JSON.stringify(newSlot, null, 2));

    // Clean up or just leave it for the user to see
  } catch (error: unknown) {
    console.error("Service error:", error.message);
  }
}

testService();
