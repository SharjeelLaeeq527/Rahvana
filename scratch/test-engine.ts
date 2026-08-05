import { generateRequiredDocuments } from "../lib/document-vault/personalization-engine";
import { DocumentVaultConfig } from "../lib/document-vault/types";

// Mocking config with two OTHER slots, where slot 1 is renamed
const config: DocumentVaultConfig = {
  userId: "user-123",
  visaCategory: "IR-1",
  scenarioFlags: {},
  dynamicDocuments: {
    OTHER: [
      { id: "dynamic-OTHER-1", name: "Other Passport" },
      { id: "dynamic-OTHER-2", name: "Other Document (2)" },
    ],
  },
};

const requiredDocs = generateRequiredDocuments(config, true, []);

console.log("Required Documents in OTHER category:");
requiredDocs
  .filter((d) => d.category === "OTHER")
  .forEach((d) => {
    console.log(`- ID: ${d.id}, Name: ${d.name}`);
  });
