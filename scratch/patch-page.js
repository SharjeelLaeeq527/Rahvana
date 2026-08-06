const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "../app/(tools)/document-vault/page.tsx");
let content = fs.readFileSync(filePath, "utf8");

// Target 1: required/optional tab table view
const target1 = `                                <DocumentTableView
                                  documents={
                                    getFilteredDocumentsForSpecialFilter[
                                      activeTab as "required" | "optional"
                                    ] || []
                                  }
                                  uploadedDocuments={uploadedDocuments}
                                  onUpload={openUploadModal}
                                  onPreview={handlePreview}
                                  onDownload={handleDownload}
                                  onDelete={handleDelete}
                                  onExport={handleExportSingle}
                                  onOpenWizard={openWizard}
                                  onRename={renameDynamicSlot}
                                />`;

const replacement1 = `                                <DocumentTableView
                                  documents={
                                    getFilteredDocumentsForSpecialFilter[
                                      activeTab as "required" | "optional"
                                    ] || []
                                  }
                                  uploadedDocuments={uploadedDocuments}
                                  onUpload={openUploadModal}
                                  onPreview={handlePreview}
                                  onDownload={handleDownload}
                                  onDelete={handleDelete}
                                  onExport={handleExportSingle}
                                  onOpenWizard={openWizard}
                                  onRename={renameDynamicSlot}
                                  onDeleteSlot={handleDeleteSlot}
                                />`;

// Target 2: specific category tab table view
const target2 = `                                <DocumentTableView
                                  documents={documentsByCategory[activeTab] || []}
                                  uploadedDocuments={uploadedDocuments}
                                  onUpload={openUploadModal}
                                  onPreview={handlePreview}
                                  onDownload={handleDownload}
                                  onDelete={handleDelete}
                                  onExport={handleExportSingle}
                                  onOpenWizard={openWizard}
                                  onRename={renameDynamicSlot}
                                />`;

const replacement2 = `                                <DocumentTableView
                                  documents={documentsByCategory[activeTab] || []}
                                  uploadedDocuments={uploadedDocuments}
                                  onUpload={openUploadModal}
                                  onPreview={handlePreview}
                                  onDownload={handleDownload}
                                  onDelete={handleDelete}
                                  onExport={handleExportSingle}
                                  onOpenWizard={openWizard}
                                  onRename={renameDynamicSlot}
                                  onDeleteSlot={handleDeleteSlot}
                                />`;

// Normalize line endings to do matching
content = content.replace(/\r\n/g, "\n");
const cleanTarget1 = target1.replace(/\r\n/g, "\n");
const cleanReplacement1 = replacement1.replace(/\r\n/g, "\n");
const cleanTarget2 = target2.replace(/\r\n/g, "\n");
const cleanReplacement2 = replacement2.replace(/\r\n/g, "\n");

if (!content.includes(cleanTarget1)) {
  console.error("Error: Could not find target 1 in page.tsx");
} else {
  content = content.replace(cleanTarget1, cleanReplacement1);
  console.log("Success: Replaced target 1");
}

if (!content.includes(cleanTarget2)) {
  console.error("Error: Could not find target 2 in page.tsx");
} else {
  content = content.replace(cleanTarget2, cleanReplacement2);
  console.log("Success: Replaced target 2");
}

fs.writeFileSync(filePath, content, "utf8");
console.log("Finished patching page.tsx");
