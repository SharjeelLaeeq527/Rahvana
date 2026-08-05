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

const cardPath = path.join(__dirname, "../app/components/document-vault/DocumentCard.tsx");

const target = `            <div className="flex items-center gap-2">
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
                </Button>`;

const replacement = `            <div className="flex items-center gap-2">
              {documentDef.multipleFilesAllowed ? (
                <Button
                  onClick={() => onUpload()}
                  className="flex-1 font-bold h-9 shadow-md shadow-primary/10 bg-primary hover:bg-primary/95 text-xs"
                >
                  <Upload className="w-3.5 h-3.5 mr-1.5" />
                  Upload More
                </Button>
              ) : (
                <Button
                  onClick={onPreview}
                  variant="secondary"
                  size="sm"
                  className="h-9 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200"
                  title={t("documentVaultPage.components.documentCard.preview")}
                >
                  <Eye className="w-4 h-4" />
                </Button>
              )}

              <div className="flex-1 flex gap-1">
                <Button
                  onClick={onDownload}
                  variant="outline"
                  size="sm"
                  className={documentDef.multipleFilesAllowed ? "h-9 w-9 p-0 border-2 shrink-0" : "flex-1 h-9 font-bold text-xs border-2"}
                  title={documentDef.multipleFilesAllowed ? t("documentVaultPage.components.documentCard.files") : undefined}
                >
                  <Download className={documentDef.multipleFilesAllowed ? "w-4 h-4" : "w-3.5 h-3.5 mr-1.5"} />
                  {!documentDef.multipleFilesAllowed && t("documentVaultPage.components.documentCard.files")}
                </Button>`;

patchFile(cardPath, target, replacement);
