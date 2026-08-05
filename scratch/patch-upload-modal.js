const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "../app/(tools)/document-vault/page.tsx");
let content = fs.readFileSync(filePath, "utf8");

// Target string
const target = `{selectedDoc.multipleFilesAllowed ? (`;
const replacement = `{selectedDoc.multipleFilesAllowed && !selectedDoc.id.startsWith("dynamic-") ? (`;

if (!content.includes(target)) {
  console.error("Error: Could not find target upload modal condition in page.tsx");
} else {
  content = content.replace(target, replacement);
  console.log("Success: Replaced upload modal condition");
}

fs.writeFileSync(filePath, content, "utf8");
console.log("Finished patching page.tsx for dynamic upload modal");
