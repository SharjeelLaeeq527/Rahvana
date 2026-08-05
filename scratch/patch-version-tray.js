const fs = require("fs");
const path = require("path");

// Helper to replace text in file
function patchFile(filePath, target, replacement) {
  let content = fs.readFileSync(filePath, "utf8");
  content = content.replace(/\r\n/g, "\n");
  const cleanTarget = target.replace(/\r\n/g, "\n");
  const cleanReplacement = replacement.replace(/\r\n/g, "\n");

  if (!content.includes(cleanTarget)) {
    console.error(`Error: Could not find target in ${path.basename(filePath)}`);
    return false;
  }

  content = content.replace(cleanTarget, cleanReplacement);
  fs.writeFileSync(filePath, content, "utf8");
  console.log(`Success: Patched ${path.basename(filePath)}`);
  return true;
}

// 1. Patch DocumentCard.tsx
const cardPath = path.join(__dirname, "../app/components/document-vault/DocumentCard.tsx");

const cardPropsTarget = `interface DocumentCardProps {
  documentDef: DocumentDefinition;
  uploadedDoc?: UploadedDocument;
  onUpload: (replaceId?: string) => void;`;

const cardPropsReplacement = `interface DocumentCardProps {
  documentDef: DocumentDefinition;
  uploadedDoc?: UploadedDocument;
  uploadedDocsCount?: number;
  onUpload: (replaceId?: string) => void;`;

const cardArgsTarget = `export function DocumentCard({
  documentDef,
  uploadedDoc,
  onUpload,`;

const cardArgsReplacement = `export function DocumentCard({
  documentDef,
  uploadedDoc,
  uploadedDocsCount,
  onUpload,`;

const cardVersionTarget = `            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-slate-500 uppercase tracking-tight">
                {t("documentVaultPage.components.documentCard.activeVersion")}
              </span>
              <Badge
                variant="secondary"
                className="h-5 px-1.5 text-[10px] font-black bg-white dark:bg-slate-700 shadow-sm border-none"
              >
                v{uploadedDoc.version}
              </Badge>
            </div>`;

const cardVersionReplacement = `            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-slate-500 uppercase tracking-tight">
                {documentDef.multipleFilesAllowed ? "Files Uploaded" : t("documentVaultPage.components.documentCard.activeVersion")}
              </span>
              <Badge
                variant="secondary"
                className="h-5 px-1.5 text-[10px] font-black bg-white dark:bg-slate-700 shadow-sm border-none"
              >
                {documentDef.multipleFilesAllowed ? (uploadedDocsCount || 1) : \`v\${uploadedDoc.version}\`}
              </Badge>
            </div>`;

patchFile(cardPath, cardPropsTarget, cardPropsReplacement);
patchFile(cardPath, cardArgsTarget, cardArgsReplacement);
patchFile(cardPath, cardVersionTarget, cardVersionReplacement);


// 2. Patch DocumentTableView.tsx
const tablePath = path.join(__dirname, "../app/components/document-vault/DocumentTableView.tsx");

const tableVarsTarget = `              const latestDoc = docVariants[0];
              const hasVariants = docVariants.length > 1;
              const isExpanded = expandedRows[doc.id];`;

const tableVarsReplacement = `              const latestDoc = docVariants[0];
              const hasVariants = docVariants.length > 1 && !doc.multipleFilesAllowed;
              const isExpanded = expandedRows[doc.id] && !doc.multipleFilesAllowed;`;

const tableInfoTarget = `                    <TableCell>
                      {latestDoc ? (
                        <div className="space-y-1">
                          <div className="text-xs font-medium truncate max-w-[150px]">
                            {getShortDisplayName(latestDoc.standardizedFilename, doc.name)}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                            <span>{formatFileSize(latestDoc.fileSize, t)}</span>
                            <span>•</span>
                            <span className="font-bold text-primary">
                              v{latestDoc.displayVersion} (Latest)
                            </span>
                            {latestDoc.hasCompressedVersion && (
                              <Badge className="h-4 px-1 text-[9px] bg-blue-100 text-blue-700 border-none hover:bg-blue-100">
                                {t("documentVaultPage.components.tableView.zip")}
                              </Badge>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">
                          {t("documentVaultPage.components.tableView.noFileUploaded")}
                        </span>
                      )}
                    </TableCell>`;

const tableInfoReplacement = `                    <TableCell>
                      {latestDoc ? (
                        doc.multipleFilesAllowed ? (
                          <div className="space-y-1">
                            <div className="text-xs font-semibold text-primary">
                              {docVariants.length} {docVariants.length === 1 ? "File" : "Files"} Uploaded
                            </div>
                            <div className="text-[10px] text-muted-foreground truncate max-w-[150px]">
                              Latest: {getShortDisplayName(latestDoc.standardizedFilename, doc.name)}
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <div className="text-xs font-medium truncate max-w-[150px]">
                              {getShortDisplayName(latestDoc.standardizedFilename, doc.name)}
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                              <span>{formatFileSize(latestDoc.fileSize, t)}</span>
                              <span>•</span>
                              <span className="font-bold text-primary">
                                v{latestDoc.displayVersion} (Latest)
                              </span>
                              {latestDoc.hasCompressedVersion && (
                                <Badge className="h-4 px-1 text-[9px] bg-blue-100 text-blue-700 border-none hover:bg-blue-100">
                                  {t("documentVaultPage.components.tableView.zip")}
                                </Badge>
                              )}
                            </div>
                          </div>
                        )
                      ) : (
                        <span className="text-xs text-muted-foreground italic">
                          {t("documentVaultPage.components.tableView.noFileUploaded")}
                        </span>
                      )}
                    </TableCell>`;

patchFile(tablePath, tableVarsTarget, tableVarsReplacement);
patchFile(tablePath, tableInfoTarget, tableInfoReplacement);


// 3. Patch page.tsx
const pagePath = path.join(__dirname, "../app/(tools)/document-vault/page.tsx");
let pageContent = fs.readFileSync(pagePath, "utf8").replace(/\r\n/g, "\n");

// Replace DocumentCard rendering occurrences to include uploadedDocsCount
const cardRegex = /const uploadedDoc = uploadedDocuments\.find\(\s*\(ud\) => ud\.documentDefId === doc\.id\s*\);/g;
let matchCount = 0;
pageContent = pageContent.replace(cardRegex, (match) => {
  matchCount++;
  return `${match}
                                      const count = uploadedDocuments.filter(
                                        (ud) => ud.documentDefId === doc.id
                                      ).length;`;
});
console.log(`Replaced ${matchCount} uploadedDoc lookup occurrences in page.tsx`);

// Pass uploadedDocsCount={count} to all DocumentCards in page.tsx
const cardComponentRegex = /<DocumentCard\s+key=\{doc\.id\}\s+documentDef=\{doc\}\s+uploadedDoc=\{uploadedDoc\}/g;
let propMatchCount = 0;
pageContent = pageContent.replace(cardComponentRegex, (match) => {
  propMatchCount++;
  return `<DocumentCard
                                            key={doc.id}
                                            documentDef={doc}
                                            uploadedDoc={uploadedDoc}
                                            uploadedDocsCount={count}`;
});
console.log(`Replaced ${propMatchCount} DocumentCard components in page.tsx`);

fs.writeFileSync(pagePath, pageContent, "utf8");
console.log("Finished page.tsx modifications");
