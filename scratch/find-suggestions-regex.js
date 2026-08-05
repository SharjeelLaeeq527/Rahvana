const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "../lib/document-vault/document-definitions.ts");
const content = fs.readFileSync(filePath, "utf8");

const matches = content.matchAll(/id:\s*["']([^"']+)["']/g);
for (const match of matches) {
  const id = match[1];
  const startIndex = match.index;
  const endIndex = content.indexOf("}", startIndex);
  const block = content.substring(startIndex, endIndex);
  if (block.includes("suggestions:")) {
    const nameMatch = block.match(/name:\s*["']([^"']+)["']/);
    const isDynamicMatch = block.match(/isDynamicCategory:\s*(\w+)/);
    console.log(`ID: ${id}, Name: ${nameMatch ? nameMatch[1] : ""}, isDynamicCategory: ${isDynamicMatch ? isDynamicMatch[1] : "false"}`);
  }
}
