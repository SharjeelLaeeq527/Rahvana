const { mapDocumentNameToId } = require("../lib/document-vault/journey-mapping");
const { ALL_DOCUMENTS } = require("../lib/document-vault/document-definitions");

const titles = [
  "Passport (current + any prior passports)",
  "Original Birth Certificate",
  "Original Marriage Certificate / Nikah Nama",
  "Original Police Clearance Certificate (Fresh)",
  "Interview Appointment Letter",
  "Original Affidavit of Support, Petitioner",
  "DS-260 Confirmation Page",
  "Most Recent Tax Evidence, Petitioner",
  "Employment Letter, Petitioner",
  "Passport-Style Photos",
  "Polio Vaccination Certificate (Original)",
  "Medical Examination Results Packet Reference",
  "Courier Registration Certificate",
  "Labeled Folder System or Document Binder",
  "Full Photocopy Set of All Documents"
];

const reqDocsSet = new Set(ALL_DOCUMENTS.map(d => d.id));

titles.forEach(title => {
  const id = mapDocumentNameToId(title);
  const exists = reqDocsSet.has(id);
  console.log(`Title: "${title}" => ID: "${id}" (Exists in ALL_DOCUMENTS: ${exists})`);
});
