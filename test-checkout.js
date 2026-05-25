const fetch = require("node-fetch");

async function test() {
  const payload = {
    userId: "d8c1e847-f3d9-4876-b635-c3f25c762557", // assuming some uuid format, it doesn't matter if it exists, we want to see the error
    addons: ["case-strength"],
  };

  try {
    const res = await fetch("http://localhost:3000/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    console.log("Status:", res.status);
    console.log("Body:", text);
  } catch (e) {
    console.error(e);
  }
}

test();
