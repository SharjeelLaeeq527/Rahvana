const fs = require("fs");
const path = require("path");

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

const cardTarget = `            <div className="flex items-center gap-2">
              <Button
                onClick={onPreview}
                variant="secondary"
                size="sm"
                className="h-9 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200"
                title={t("documentVaultPage.components.documentCard.preview")}
              >
                <Eye className="w-4 h-4" />
              </Button>

              <div className="flex-1 flex gap-1">
                <Button
                  onClick={onDownload}
                  variant="outline"
                  size="sm"
                  className="flex-1 h-9 font-bold text-xs border-2"
                >
                  <Download className="w-3.5 h-3.5 mr-1.5" />
                  {t("documentVaultPage.components.documentCard.files")}
                </Button>
              </div>`;

const cardReplacement = `            <div className="flex items-center gap-2">
              {documentDef.multipleFilesAllowed ? (
                <>
                  <Button
                    onClick={() => onUpload()}
                    className="flex-1 font-bold h-9 shadow-md shadow-primary/10 bg-primary hover:bg-primary/95 text-xs"
                  >
                    <Upload className="w-3.5 h-3.5 mr-1.5" />
                    Upload More
                  </Button>
                  <Button
                    onClick={onDownload}
                    variant="outline"
                    size="sm"
                    className="h-9 w-9 p-0 border-2"
                    title={t("documentVaultPage.components.documentCard.files")}
                  >
                    <Download className="w-3.5 h-3.5" />
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    onClick={onPreview}
                    variant="secondary"
                    size="sm"
                    className="h-9 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200"
                    title={t("documentVaultPage.components.documentCard.preview")}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>

                  <div className="flex-1 flex gap-1">
                    <Button
                      onClick={onDownload}
                      variant="outline"
                      size="sm"
                      className="flex-1 h-9 font-bold text-xs border-2"
                    >
                      <Download className="w-3.5 h-3.5 mr-1.5" />
                      {t("documentVaultPage.components.documentCard.files")}
                    </Button>
                  </div>
                </>
              )}`;

patchFile(cardPath, cardTarget, cardReplacement);

// 2. Patch DocumentTableView.tsx
const tablePath = path.join(__dirname, "../app/components/document-vault/DocumentTableView.tsx");

const tableTarget = `                          <div className="flex items-center gap-1">
                            <Button
                              onClick={() => onPreview(latestDoc)}
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              title={t("documentVaultPage.components.tableView.preview")}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>`;

const tableReplacement = `                          <div className="flex items-center gap-1">
                            {doc.multipleFilesAllowed && (
                              <Button
                                onClick={() => onUpload(doc.id)}
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-primary hover:text-primary hover:bg-primary/10"
                                title="Upload More"
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                            )}

                            <Button
                              onClick={() => onPreview(latestDoc)}
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              title={t("documentVaultPage.components.tableView.preview")}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>`;

patchFile(tablePath, tableTarget, tableReplacement);
