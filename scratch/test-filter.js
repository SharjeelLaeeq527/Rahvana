// Mocking the finalDocs before cleanup
const category = "WORK";
const displayName = "Work / Employment Documents";
const baseName = displayName.replace(/ (Documents|Evidence)$/, ""); // "Work / Employment"

// Scenario: user adds two slots, renames slot 1 to "Offer Letter"
const finalDocs = [
  {
    id: "dynamic-WORK-1",
    name: "Offer Letter",
    category: "WORK",
  },
  {
    id: "dynamic-WORK-2",
    name: `${baseName} Document (2)`, // "Work / Employment Document (2)"
    category: "WORK",
  }
];

// Replicating the logic from personalization-engine.ts
const namedRequirementCategories = new Set();
finalDocs.forEach((d) => {
  if (!d.name.includes(" Document (") && !d.name.includes(" Evidence (")) {
    namedRequirementCategories.add(`${d.category}-${d.name.toLowerCase().trim()}`);
  }
});

console.log("namedRequirementCategories:", Array.from(namedRequirementCategories));

const filteredDocs = finalDocs.filter((d) => {
  const isGeneric = d.name.includes(" Document (") || d.name.includes(" Evidence (");
  if (!isGeneric) return true;

  const baseName = d.name.split(" Document (")[0].split(" Evidence (")[0].toLowerCase().trim();
  console.log(`Checking generic doc: "${d.name}", baseName: "${baseName}"`);

  const hasNamedMatch = Array.from(namedRequirementCategories).some((nc) => {
    const starts = nc.startsWith(d.category);
    const includes = nc.includes(baseName);
    console.log(`  Comparing with nc: "${nc}" -> startsWith(${d.category}): ${starts}, includes(${baseName}): ${includes}`);
    return starts && includes;
  });

  return !hasNamedMatch;
});

console.log("filteredDocs:", filteredDocs.map(d => d.name));
