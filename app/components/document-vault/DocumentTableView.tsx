import React, { useState } from "react";
import { DocumentDefinition, UploadedDocument } from "@/lib/document-vault/types";

// import {
//   DocumentDefinition,
//   UploadedDocument,
// } from "@/lib/document-vault/types";
import { useLanguage } from "@/app/context/LanguageContext";
import {
  formatExpirationDate,
  getExpirationStatusColor,
  getDaysUntilExpiration,
} from "@/lib/document-vault/expiration-tracker";
import { formatFileSize, getShortDisplayName } from "@/lib/document-vault/file-utils";
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
  Edit2,
  Check,
  X,
  ChevronRight,
  ChevronDown,
  History,
  Plus,
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

import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface DocumentTableViewProps {
  documents: DocumentDefinition[];
  uploadedDocuments: UploadedDocument[];
  onUpload: (docId: string, replaceId?: string) => void;
  onDownload: (docId: string) => void;
  onDelete: (docId: string) => void;
  onOpenWizard: (docId: string) => void;
  onExport: (docId: string, hasCompressed: boolean) => void;
  onPreview: (doc: UploadedDocument) => void;
  onRename?: (category: string, docId: string, newName: string) => void;
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
  onRename,
}: DocumentTableViewProps) {
  const { t } = useLanguage();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const getStatusBadge = (docDef: DocumentDefinition, uploadedDoc?: UploadedDocument) => {
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
          <Badge variant="destructive">{t("documentVaultPage.components.tableView.expired")}</Badge>
        );
      default:
        return null;
    }
  };

  return (
    <TooltipProvider delayDuration={300}>
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
              <TableHead>{t("documentVaultPage.components.tableView.columns.status")}</TableHead>
              <TableHead>{t("documentVaultPage.components.tableView.columns.fileInfo")}</TableHead>
              <TableHead>{t("documentVaultPage.components.tableView.columns.validity")}</TableHead>
              <TableHead className="text-right">
                {t("documentVaultPage.components.tableView.columns.actions")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.map((doc) => {
              const rawVariants = uploadedDocuments
                .filter((ud) => {
                  // Exact ID match
                  if (ud.documentDefId === doc.id) return true;

                  // Content-based match for dynamic/recovered documents
                  // If this is a dynamic row and the document has a matching "Type" in notes, group it here
                  if (doc.id?.startsWith("dynamic-") || doc.id?.startsWith("RECOVERED_")) {
                    if (ud.notes?.startsWith("Type: ")) {
                      const typeLabel = ud.notes
                        .split("\n")[0]
                        .replace("Type: ", "")
                        .trim()
                        .toLowerCase();
                      return typeLabel === doc.name?.trim().toLowerCase();
                    }
                  }

                  return false;
                })
                .sort(
                  (a, b) => new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime()
                ); // Sort by date ascending for virtual versioning

              // VIRTUAL VERSIONING: If we have multiple docs with the same version number,
              // we re-assign sequential versions for display based on upload date.
              const hasDuplicateVersions = rawVariants.some((v, i) =>
                rawVariants.some((v2, i2) => i !== i2 && v.version === v2.version)
              );

              const docVariants = rawVariants
                .map((v, idx) => ({
                  ...v,
                  displayVersion: hasDuplicateVersions ? idx + 1 : v.version,
                }))
                .sort((a, b) => b.displayVersion - a.displayVersion); // Show latest version first

              const latestDoc = docVariants[0];
              const hasVariants = docVariants.length > 1;
              const isExpanded = expandedRows[doc.id];

              const docName =
                t(`documentVaultPage.documents.${doc.id}.name`) !==
                `documentVaultPage.documents.${doc.id}.name`
                  ? t(`documentVaultPage.documents.${doc.id}.name`)
                  : doc.name;

              const docDescription =
                t(`documentVaultPage.documents.${doc.id}.description`) !==
                `documentVaultPage.documents.${doc.id}.description`
                  ? t(`documentVaultPage.documents.${doc.id}.description`)
                  : doc.description;

              return (
                <React.Fragment key={doc.id}>
                  <TableRow className="group transition-colors hover:bg-muted/30">
                    <TableCell>
                      <div className="flex items-center gap-3 py-1">
                        <div
                          className={`p-2 rounded-lg shrink-0 ${latestDoc ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"}`}
                        >
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-semibold text-sm flex items-center gap-1.5">
                            {editingId === doc.id ? (
                              <div className="flex items-center gap-1">
                                <Input
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  className="h-7 py-0 px-2 text-sm max-w-[200px]"
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      onRename?.(doc.category, doc.id, editValue);
                                      setEditingId(null);
                                    } else if (e.key === "Escape") {
                                      setEditingId(null);
                                    }
                                  }}
                                />
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 w-7 p-0 text-emerald-600"
                                  onClick={() => {
                                    onRename?.(doc.category, doc.id, editValue);
                                    setEditingId(null);
                                  }}
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 w-7 p-0 text-red-500"
                                  onClick={() => setEditingId(null)}
                                >
                                  <X className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="line-clamp-2 text-left max-w-[220px]">
                                      {docName}
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="max-w-[300px] z-100">
                                    <p className="text-sm font-medium">{docName}</p>
                                  </TooltipContent>
                                </Tooltip>
                                {doc.id.startsWith("dynamic-") && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingId(doc.id);
                                      setEditValue(doc.name);
                                    }}
                                    title="Rename"
                                  >
                                    <Edit2 className="w-3 h-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200" />
                                  </Button>
                                )}
                              </div>
                            )}
                            {doc.required && <span className="text-destructive font-bold">*</span>}
                            {hasVariants && (
                              <Badge
                                variant="outline"
                                className="ml-2 text-[10px] bg-primary/5 text-primary border-primary/20 whitespace-nowrap"
                              >
                                {docVariants.length} Variants
                              </Badge>
                            )}
                          </div>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <p className="text-xs text-muted-foreground line-clamp-1 max-w-[200px]">
                                {docDescription}
                              </p>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="max-w-[300px] z-[100]">
                              <p className="text-xs">{docDescription}</p>
                            </TooltipContent>
                          </Tooltip>
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
                    <TableCell>{getStatusBadge(doc, latestDoc)}</TableCell>
                    <TableCell>
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
                    </TableCell>
                    <TableCell>
                      {latestDoc?.expirationDate ? (
                        <div
                          className={`text-xs flex items-center gap-1.5 ${
                            getExpirationStatusColor(latestDoc) === "red"
                              ? "text-destructive font-medium"
                              : getExpirationStatusColor(latestDoc) === "yellow"
                                ? "text-amber-600"
                                : "text-emerald-600"
                          }`}
                        >
                          <Clock className="w-3 h-3" />
                          {formatExpirationDate(latestDoc.expirationDate, t)}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">, </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {!latestDoc ? (
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
                              title={t("documentVaultPage.components.tableView.howToObtain")}
                            >
                              <Info className="w-4 h-4" />
                            </Button>
                          </>
                        ) : (
                          <div className="flex items-center gap-1">
                            <Button
                              onClick={() => onPreview(latestDoc)}
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              title={t("documentVaultPage.components.tableView.preview")}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuLabel>
                                  {t("documentVaultPage.components.tableView.manageDocument")}
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => onPreview(latestDoc)}>
                                  <Eye className="w-4 h-4 mr-2" />{" "}
                                  {t("documentVaultPage.components.tableView.preview")}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onDownload(latestDoc.id)}>
                                  <Download className="w-4 h-4 mr-2" />{" "}
                                  {t("documentVaultPage.components.tableView.download")}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onUpload(doc.id)}>
                                  <Plus className="w-4 h-4 mr-2 text-primary" /> Add New Version
                                </DropdownMenuItem>
                                {onExport && (
                                   <DropdownMenuItem
                                     onClick={() =>
                                       onExport(
                                         latestDoc.id,
                                         latestDoc.hasCompressedVersion || false
                                       )
                                     }
                                   >
                                     <Package className="w-4 h-4 mr-2" />{" "}
                                     {t("documentVaultPage.components.tableView.export")}{" "}
                                     {latestDoc.hasCompressedVersion
                                       ? t("documentVaultPage.components.tableView.zip")
                                       : ""}
                                   </DropdownMenuItem>
                                 )}
                                 {doc.id.startsWith("dynamic-") && (
                                   <DropdownMenuItem
                                     onClick={() => {
                                       setEditingId(doc.id);
                                       setEditValue(doc.name);
                                     }}
                                   >
                                     <Edit2 className="w-4 h-4 mr-2" />{" "}
                                     {t("documentVaultPage.components.tableView.rename") || "Rename"}
                                   </DropdownMenuItem>
                                 )}
                                 <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => onUpload(doc.id, latestDoc.id)}>
                                  <Upload className="w-4 h-4 mr-2" />{" "}
                                  {t("documentVaultPage.components.tableView.replace")}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onOpenWizard(doc.id)}>
                                  <ExternalLink className="w-4 h-4 mr-2" />{" "}
                                  {t("documentVaultPage.components.tableView.instructions")}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => onDelete(latestDoc.id)}
                                  className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />{" "}
                                  {t("documentVaultPage.components.tableView.delete")}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>

                            {hasVariants && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => toggleRow(doc.id)}
                              >
                                {isExpanded ? (
                                  <ChevronDown className="w-4 h-4" />
                                ) : (
                                  <ChevronRight className="w-4 h-4" />
                                )}
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>

                  {/* Expanded Variants Row */}
                  {isExpanded && hasVariants && (
                    <TableRow className="bg-muted/10 border-l-4 border-l-primary/30">
                      <TableCell colSpan={6} className="p-0">
                        <div className="py-3 px-6 animate-in slide-in-from-top-2 duration-200">
                          <div className="flex items-center gap-2 mb-3 text-xs font-bold text-primary/70 uppercase tracking-wider">
                            <History className="w-3 h-3" />
                            Version History
                          </div>
                          <div className="space-y-2">
                            {docVariants.map((variant, idx) => (
                              <div
                                key={variant.id}
                                className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-slate-900 border shadow-sm group/variant"
                              >
                                <div className="flex items-center gap-4">
                                  <Badge
                                    variant="secondary"
                                    className={`text-[10px] font-bold ${idx === 0 ? "bg-primary/10 text-primary" : ""}`}
                                  >
                                    v{variant.displayVersion}
                                  </Badge>
                                  <div>
                                    <div className="text-sm font-medium flex items-center gap-2">
                                      {getShortDisplayName(variant.standardizedFilename, doc.name)}
                                      {idx === 0 && (
                                        <Badge
                                          variant="outline"
                                          className="h-4 text-[8px] bg-emerald-50 text-emerald-600 border-emerald-200"
                                        >
                                          Latest
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                                      <span>
                                        {new Date(variant.uploadedAt).toLocaleDateString()}
                                      </span>
                                      <span>•</span>
                                      <span>{formatFileSize(variant.fileSize, t)}</span>
                                      {variant.notes && (
                                        <>
                                          <span>•</span>
                                          <span className="italic truncate max-w-[200px]">
                                            {variant.notes}
                                          </span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={() => onPreview(variant)}
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={() => onDownload(variant.id)}
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={() => onUpload(doc.id, variant.id)}
                                  >
                                    <Upload className="w-3.5 h-3.5" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-destructive opacity-100 group-hover/variant:opacity-100 transition-opacity"
                                    onClick={() => onDelete(variant.id)}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </TooltipProvider>
  );
}
