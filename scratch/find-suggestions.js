const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "../lib/document-vault/document-definitions.ts");
const content = fs.readFileSync(filePath, "utf8");

const docs = eval(content.substring(content.indexOf("const ALL_DOCUMENTS"), content.lastIndexOf("];") + 2).replace("export const ALL_DOCUMENTS", "const ALL_DOCUMENTS"));

ALL_DOCUMENTS.forEach(d => {
  if (d.suggestions) {
    console.log(`ID: ${d.id}, Name: ${d.name}, isDynamicCategory: ${d.isDynamicCategory}`);
  }
});
