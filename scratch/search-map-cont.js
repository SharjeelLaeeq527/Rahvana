const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "../lib/document-vault/journey-mapping.ts");
const content = fs.readFileSync(filePath, "utf8");

const lines = content.split("\n");
let startLine = -1;
lines.forEach((line, index) => {
  if (line.includes("export function mapDocumentNameToId")) {
    startLine = index;
  }
});

if (startLine !== -1) {
  console.log(lines.slice(startLine + 25, startLine + 100).join("\n"));
}
