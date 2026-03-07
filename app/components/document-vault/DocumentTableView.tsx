"use client";

import {
  DocumentDefinition,
  UploadedDocument,
} from "@/lib/document-vault/types";
import { useLanguage } from "@/app/context/LanguageContext";
import {
  formatExpirationDate,
  getExpirationStatusColor,
  getDaysUntilExpiration,
} from "@/lib/document-vault/expiration-tracker";
import {
  formatFileSize,
  getShortDisplayName,
} from "@/lib/document-vault/file-utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Upload,
  Download,
  Trash2,
  AlertCircle,
  CheckCircle,
  Clock,
  Info,
  Package,
  Eye,
  FileArchive,
  MoreVertical,
  ExternalLink,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DocumentTableViewProps {
  documents: DocumentDefinition[];
  uploadedDocuments: UploadedDocument[];
  onUpload: (docId: string) => void;
  onDownload: (docId: string) => void;
  onDelete: (docId: string) => void;
  onOpenWizard: (docId: string) => void;
  onExport: (docId: string, hasCompressed: boolean) => void;
  onPreview: (doc: UploadedDocument) => void;
}

export function DocumentTableView({
  documents,
  uploadedDocuments,
  onUpload,
  onDownload,
  onDelete,
  onOpenWizard,
  onExport,
  onPreview,
}: DocumentTableViewProps) {
  const { t } = useLanguage();

  const getStatusBadge = (
    docDef: DocumentDefinition,
    uploadedDoc?: UploadedDocument,
  ) => {
    if (!uploadedDoc) {
      return (
        <Badge className="bg-red-50 text-red-500 border-red-100 hover:bg-red-50 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800/50 font-bold">
          {t("documentVaultPage.components.tableView.missing")}
        </Badge>
      );
    }

    switch (uploadedDoc.status) {
      case "UPLOADED":
        return (
          <Badge className="bg-emerald-500 hover:bg-emerald-600 border-none">
            {t("documentVaultPage.components.tableView.completed")}
          </Badge>
        );
      case "NEEDS_ATTENTION":
        return (
          <Badge className="bg-amber-500 hover:bg-amber-600 border-none text-white">
            {t("documentVaultPage.components.tableView.expiring")}
          </Badge>
        );
      case "EXPIRED":
        return (
          <Badge variant="destructive">
            {t("documentVaultPage.components.tableView.expired")}
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead className="w-[300px]">
              {t("documentVaultPage.components.tableView.columns.documentName")}
            </TableHead>
            <TableHead>
              {t("documentVaultPage.components.tableView.columns.requiredFor")}
            </TableHead>
            <TableHead>
              {t("documentVaultPage.components.tableView.columns.status")}
            </TableHead>
            <TableHead>
              {t("documentVaultPage.components.tableView.columns.fileInfo")}
            </TableHead>
            <TableHead>
              {t("documentVaultPage.components.tableView.columns.validity")}
            </TableHead>
            <TableHead className="text-right">
              {t("documentVaultPage.components.tableView.columns.actions")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents.map((doc) => {
            const uploadedDoc = uploadedDocuments.find(
              (ud) => ud.documentDefId === doc.id,
            );

            return (
              <TableRow
                key={doc.id}
                className="group transition-colors hover:bg-muted/30"
              >
                <TableCell>
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-1 p-2 rounded-lg ${uploadedDoc ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"}`}
                    >
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm flex items-center gap-1.5">
                        {t(`documentVaultPage.documents.${doc.id}.name`) !==
                        `documentVaultPage.documents.${doc.id}.name`
                          ? t(`documentVaultPage.documents.${doc.id}.name`)
                          : doc.name}
                        {doc.required && (
                          <span className="text-destructive font-bold">*</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1 max-w-[200px]">
                        {t(
                          `documentVaultPage.documents.${doc.id}.description`,
                        ) !==
                        `documentVaultPage.documents.${doc.id}.description`
                          ? t(
                              `documentVaultPage.documents.${doc.id}.description`,
                            )
                          : doc.description}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {doc.roles.map((role) => (
                      <Badge
                        key={role}
                        variant="outline"
                        className="text-[10px] uppercase tracking-wider py-0 px-1.5 font-bold border-muted-foreground/20 text-muted-foreground"
                      >
                        {t(`documentVaultPage.roles.${role}`)}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>{getStatusBadge(doc, uploadedDoc)}</TableCell>
                <TableCell>
                  {uploadedDoc ? (
                    <div className="space-y-1">
                      <div className="text-xs font-medium truncate max-w-[150px]">
                        {getShortDisplayName(
                          uploadedDoc.standardizedFilename,
                          doc.name,
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <span>{formatFileSize(uploadedDoc.fileSize, t)}</span>
                        <span>•</span>
                        <span>v{uploadedDoc.version}</span>
                        {uploadedDoc.hasCompressedVersion && (
                          <Badge className="h-4 px-1 text-[9px] bg-blue-100 text-blue-700 border-none hover:bg-blue-100">
                            {t("documentVaultPage.components.tableView.zip")}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground italic">
                      {t(
                        "documentVaultPage.components.tableView.noFileUploaded",
                      )}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  {uploadedDoc?.expirationDate ? (
                    <div
                      className={`text-xs flex items-center gap-1.5 ${
                        getExpirationStatusColor(uploadedDoc) === "red"
                          ? "text-destructive font-medium"
                          : getExpirationStatusColor(uploadedDoc) === "yellow"
                            ? "text-amber-600"
                            : "text-emerald-600"
                      }`}
                    >
                      <Clock className="w-3 h-3" />
                      {formatExpirationDate(uploadedDoc.expirationDate, t)}
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    {!uploadedDoc ? (
                      <>
                        <Button
                          onClick={() => onUpload(doc.id)}
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-primary hover:text-primary hover:bg-primary/10"
                        >
                          <Upload className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => onOpenWizard(doc.id)}
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-muted-foreground"
                          title={t(
                            "documentVaultPage.components.tableView.howToObtain",
                          )}
                        >
                          <Info className="w-4 h-4" />
                        </Button>
                      </>
                    ) : (
                      <div className="flex items-center gap-1">
                        <Button
                          onClick={() => onPreview(uploadedDoc)}
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          title={t(
                            "documentVaultPage.components.tableView.preview",
                          )}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>
                              {t(
                                "documentVaultPage.components.tableView.manageDocument",
                              )}
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => onPreview(uploadedDoc)}
                            >
                              <Eye className="w-4 h-4 mr-2" />{" "}
                              {t(
                                "documentVaultPage.components.tableView.preview",
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => onDownload(uploadedDoc.id)}
                            >
                              <Download className="w-4 h-4 mr-2" />{" "}
                              {t(
                                "documentVaultPage.components.tableView.download",
                              )}
                            </DropdownMenuItem>
                            {onExport && (
                              <DropdownMenuItem
                                onClick={() =>
                                  onExport(
                                    uploadedDoc.id,
                                    uploadedDoc.hasCompressedVersion || false,
                                  )
                                }
                              >
                                <Package className="w-4 h-4 mr-2" />{" "}
                                {t(
                                  "documentVaultPage.components.tableView.export",
                                )}{" "}
                                {uploadedDoc.hasCompressedVersion
                                  ? t(
                                      "documentVaultPage.components.tableView.zip",
                                    )
                                  : ""}
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => onUpload(doc.id)}>
                              <Upload className="w-4 h-4 mr-2" />{" "}
                              {t(
                                "documentVaultPage.components.tableView.replace",
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => onOpenWizard(doc.id)}
                            >
                              <ExternalLink className="w-4 h-4 mr-2" />{" "}
                              {t(
                                "documentVaultPage.components.tableView.instructions",
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => onDelete(uploadedDoc.id)}
                              className="text-destructive focus:text-destructive focus:bg-destructive/10"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />{" "}
                              {t(
                                "documentVaultPage.components.tableView.delete",
                              )}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
