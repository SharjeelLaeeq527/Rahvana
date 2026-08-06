const fs = require("fs");

const files = [
  "app/components/journey-engine/components/SponsorshipCalculatorTool.tsx",
  "app/components/journey-spouse/components/SponsorshipCalculatorTool.tsx",
  "components/tools/SponsorshipCalculatorTool.tsx"
];

files.forEach(file => {
  console.log(`=== File: ${file} ===`);
  const content = fs.readFileSync(file, "utf8");
  const lines = content.split("\n");
  lines.forEach((line, idx) => {
    if (line.includes("isEligible = ")) {
      console.log(`Line ${idx + 1}: ${line.trim()}`);
    }
  });
});
