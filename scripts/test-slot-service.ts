const testSlot = async () => {
  console.log("Testing slot creation API...");
  try {
    const response = await fetch("http://localhost:3000/api/consultation/slots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: new Date().toISOString().split("T")[0],
        start_time: "11:00",
        end_time: "12:00",
        status: "available",
        max_bookings: 1,
        current_bookings: 0,
      }),
    });

    const data = await response.json();
    if (response.ok) {
      console.log("Slot created successfully:", data);
    } else {
      console.error("Failed to create slot:", data);
    }
  } catch (error) {
    console.error("Error during fetch:", error);
  }
};

// Note: This script needs to be run in an environment where it can access the local server.
// Since I can't start the server and keep it running for a fetch,
// I'll use the service directly in a script to verify the fix.
