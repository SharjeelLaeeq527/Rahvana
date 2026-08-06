const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "../lib/document-vault/personalization-engine.ts");
const content = fs.readFileSync(filePath, "utf8");

const lines = content.split("\n");
let startLine = -1;
lines.forEach((line, index) => {
  if (line.includes("function mapDocumentNameToId") || line.includes("const mapDocumentNameToId")) {
    startLine = index;
  }
});

if (startLine !== -1) {
  console.log(lines.slice(startLine, startLine + 30).join("\n"));
} else {
  console.log("Not found");
}
