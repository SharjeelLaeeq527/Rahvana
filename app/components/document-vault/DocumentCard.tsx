import { useState } from "react";
import { DocumentDefinition, UploadedDocument } from "@/lib/document-vault/types";
import { useLanguage } from "@/app/context/LanguageContext";
import {
  formatExpirationDate,
  getExpirationStatusColor,
  getDaysUntilExpiration,
} from "@/lib/document-vault/expiration-tracker";
import { formatFileSize, getShortDisplayName } from "@/lib/document-vault/file-utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Package,
  Eye,
  MoreVertical,
  Zap,
  FileText,
  Upload,
  Download,
  Trash2,
  AlertCircle,
  CheckCircle,
  Info,
  Edit2,
  Check,
  X,
  Plus,
  Clock,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Input } from "@/components/ui/input";

interface DocumentCardProps {
  documentDef: DocumentDefinition;
  uploadedDoc?: UploadedDocument;
  onUpload: (replaceId?: string) => void;
  onDownload?: () => void;
  onDelete?: () => void;
  onOpenWizard: () => void;
  onExport?: () => void;
  onPreview?: () => void;
  onRename?: (newName: string) => void;
  onDeleteSlot?: () => void;
}

export function DocumentCard({
  documentDef,
  uploadedDoc,
  onUpload,
  onDownload,
  onDelete,
  onOpenWizard,
  onExport,
  onPreview,
  onRename,
  onDeleteSlot,
}: DocumentCardProps) {
  const { t } = useLanguage();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");

  const getStatusBadge = () => {
    if (!uploadedDoc) {
      // Show "Missing" for documents not yet uploaded
      return (
        <Badge className="flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2 py-1 text-[10.5px] font-bold text-rose-600 hover:bg-rose-50">
          <AlertCircle className="w-3 h-3" />
          {t("documentVaultPage.components.documentCard.status.missing")}
        </Badge>
      );
    }

    switch (uploadedDoc.status) {
      case "UPLOADED":
        return (
          <Badge variant="default" className="flex items-center gap-1 bg-green-500">
            <CheckCircle className="w-3 h-3" />
            {t("documentVaultPage.components.documentCard.status.uploaded")}
          </Badge>
        );
      case "NEEDS_ATTENTION":
        return (
          <Badge variant="secondary" className="flex items-center gap-1 bg-yellow-500">
            <Clock className="w-3 h-3" />
            {t("documentVaultPage.components.documentCard.status.expiringSoon")}
          </Badge>
        );
      case "EXPIRED":
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {t("documentVaultPage.components.documentCard.status.expired")}
          </Badge>
        );
      default:
        return null;
    }
  };

  const getRoleBadges = () => {
    return documentDef.roles.map((role) => (
      <Badge key={role} variant="outline" className="text-xs">
        {t(`documentVaultPage.roles.${role}`)}
      </Badge>
    ));
  };

  const getStageBadges = () => {
    return documentDef.stages.map((stage) => (
      <Badge key={stage} variant="outline" className="text-xs">
        {t(`documentVaultPage.stages.${stage}`)}
      </Badge>
    ));
  };

  const getExpirationInfo = () => {
    if (!uploadedDoc?.expirationDate) return null;

    const daysUntil = getDaysUntilExpiration(uploadedDoc);
    if (daysUntil === null) return null;

    const color = getExpirationStatusColor(uploadedDoc);
    const colorClass = {
      red: "text-red-600",
      yellow: "text-yellow-600",
      green: "text-green-600",
      gray: "text-gray-600",
    }[color];

    return (
      <div className={`text-sm ${colorClass} flex items-center gap-1`}>
        <Clock className="w-4 h-4" />
        {formatExpirationDate(uploadedDoc.expirationDate, t)}
      </div>
    );
  };

  return (
    <Card className="group relative flex h-full flex-col overflow-hidden rounded-[20px] border border-slate-200/80 bg-white shadow-[0_2px_8px_rgba(22,48,44,0.04)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#0F8F80]/35 hover:shadow-[0_16px_36px_-18px_rgba(10,79,73,0.30)] dark:border-slate-800 dark:bg-slate-900">
      {/* Top Status Bar */}
      <div
        className={`h-[3px] w-full ${
          !uploadedDoc
            ? "bg-red-400/50"
            : uploadedDoc.status === "UPLOADED"
              ? "bg-emerald-500"
              : uploadedDoc.status === "NEEDS_ATTENTION"
                ? "bg-amber-500"
                : "bg-red-600"
        }`}
      ></div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] border ${uploadedDoc ? "border-emerald-100 bg-emerald-50 text-emerald-600" : "border-slate-200 bg-slate-50 text-slate-500"}`}
              >
                <FileText className="h-5 w-5" />
              </div>
              <div className="flex-1">
                {isEditing ? (
                  <div className="flex items-center gap-1">
                    <Input
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="h-8 py-0 px-2 text-sm font-bold"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          onRename?.(editValue);
                          setIsEditing(false);
                        } else if (e.key === "Escape") {
                          setIsEditing(false);
                        }
                      }}
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-emerald-600"
                      onClick={() => {
                        onRename?.(editValue);
                        setIsEditing(false);
                      }}
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-red-500"
                      onClick={() => setIsEditing(false)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <h3 className="flex items-center gap-1 text-[15px] leading-snug font-extrabold tracking-tight text-slate-900 dark:text-white">
                    {t(`documentVaultPage.documents.${documentDef.id}.name`) !==
                    `documentVaultPage.documents.${documentDef.id}.name`
                      ? t(`documentVaultPage.documents.${documentDef.id}.name`)
                      : documentDef.name}
                    {documentDef.id.startsWith("dynamic-") && (
                      <div className="inline-flex items-center gap-0.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsEditing(true);
                            setEditValue(documentDef.name);
                          }}
                          title="Rename"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteSlot?.();
                          }}
                          title="Delete Slot"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    )}
                    {documentDef.required && (
                      <span className="text-red-500 ml-1 font-black">*</span>
                    )}
                  </h3>
                )}
              </div>
            </div>
            <p className="mt-2 line-clamp-2 text-[12.5px] leading-[1.55] font-medium text-slate-500 dark:text-slate-400">
              {t(`documentVaultPage.documents.${documentDef.id}.description`) !==
              `documentVaultPage.documents.${documentDef.id}.description`
                ? t(`documentVaultPage.documents.${documentDef.id}.description`)
                : documentDef.description}
            </p>
          </div>
          <div className="ml-2">{getStatusBadge()}</div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              {t("documentVaultPage.components.documentCard.owner")}
            </span>
            <div className="flex flex-wrap gap-1">{getRoleBadges()}</div>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              {t("documentVaultPage.components.documentCard.process")}
            </span>
            <div className="flex flex-wrap gap-1">{getStageBadges()}</div>
          </div>
        </div>

        {/* Uploaded File Details (Glassmorphism card) */}
        {uploadedDoc && (
          <div className="relative mb-5 overflow-hidden space-y-3 rounded-[14px] border border-slate-200/70 bg-slate-50/80 p-4 dark:border-slate-700/50 dark:bg-slate-800/50">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-slate-500 uppercase tracking-tight">
                {documentDef.multipleFilesAllowed && !documentDef.id.startsWith("dynamic-")
                  ? "Latest Upload"
                  : t("documentVaultPage.components.documentCard.activeVersion")}
              </span>
              {!(documentDef.multipleFilesAllowed && !documentDef.id.startsWith("dynamic-")) && (
                <Badge
                  variant="secondary"
                  className="h-5 px-1.5 text-[10px] font-black bg-white dark:bg-slate-700 shadow-sm border-none"
                >
                  v{uploadedDoc.version}
                </Badge>
              )}
            </div>

            <div className="space-y-1">
              <p
                className="text-xs font-extrabold text-slate-900 dark:text-white truncate"
                title={uploadedDoc.standardizedFilename}
              >
                {getShortDisplayName(uploadedDoc.standardizedFilename, documentDef.name)}
              </p>
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                <span>{formatFileSize(uploadedDoc.fileSize, t)}</span>
                <span className="h-1 w-1 rounded-full bg-slate-300"></span>
                <span>{new Date(uploadedDoc.uploadedAt).toLocaleDateString()}</span>
              </div>
            </div>

            {uploadedDoc.expirationDate && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {t("documentVaultPage.components.documentCard.validity")}
                </span>
                {getExpirationInfo()}
              </div>
            )}

            {uploadedDoc.hasCompressedVersion && (
              <div className="absolute top-0 right-0 p-1">
                <div className="bg-blue-500 text-white p-1 rounded-bl-lg">
                  <Zap className="w-3 h-3" />
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mt-auto pt-2">
          {!uploadedDoc ? (
            <div className="flex gap-2">
              <Button
                onClick={() => onUpload()}
                className="h-10 flex-1 rounded-[12px] bg-[#0A4F49] text-[12.5px] font-bold shadow-[0_8px_18px_-8px_rgba(10,79,73,0.45)] hover:bg-[#073834]"
              >
                <Upload className="w-4 h-4 mr-2" />
                {t("documentVaultPage.components.documentCard.upload")}
              </Button>
              <Button
                onClick={onOpenWizard}
                variant="outline"
                className="h-10 flex-1 rounded-[12px] border border-slate-200 text-[12.5px] font-bold text-slate-700"
              >
                {t("documentVaultPage.components.documentCard.learnHow")}
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
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
                {documentDef.multipleFilesAllowed && !documentDef.id.startsWith("dynamic-") && (
                  <Button
                    onClick={() => onUpload()}
                    variant="outline"
                    size="sm"
                    className="flex-1 h-9 font-bold text-xs border-2 text-primary border-primary/20 hover:bg-primary/5"
                  >
                    <Upload className="w-3.5 h-3.5 mr-1.5" />
                    Upload
                  </Button>
                )}
                <Button
                  onClick={onDownload}
                  variant="outline"
                  size="sm"
                  className="flex-1 h-9 font-bold text-xs border-2"
                >
                  <Download className="w-3.5 h-3.5 mr-1.5" />
                  {t("documentVaultPage.components.documentCard.files")}
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-9 w-9 p-0 border-2">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    {documentDef.multipleFilesAllowed && !documentDef.id.startsWith("dynamic-") ? (
                      <DropdownMenuItem onClick={() => onUpload()}>
                        <Plus className="w-4 h-4 mr-2 text-primary" /> Upload / Manage Files
                      </DropdownMenuItem>
                    ) : (
                      <>
                        <DropdownMenuItem onClick={() => onUpload()}>
                          <Plus className="w-4 h-4 mr-2 text-primary" /> Add New Version
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onUpload(uploadedDoc.id)}>
                          <Upload className="w-4 h-4 mr-2" />{" "}
                          {t("documentVaultPage.components.documentCard.replace")}
                        </DropdownMenuItem>
                      </>
                    )}
                    {onExport && (
                      <DropdownMenuItem onClick={onExport}>
                        <Package className="w-4 h-4 mr-2" />{" "}
                        {t("documentVaultPage.components.documentCard.exportZip")}
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={onOpenWizard}>
                      <Info className="w-4 h-4 mr-2" />{" "}
                      {t("documentVaultPage.components.documentCard.instructions")}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {documentDef.id.startsWith("dynamic-") && (
                      <>
                        <DropdownMenuItem
                          onClick={onDeleteSlot}
                          className="text-destructive focus:text-destructive focus:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4 mr-2" /> Delete Slot
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    <DropdownMenuItem
                      onClick={onDelete}
                      className="text-destructive focus:text-destructive focus:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />{" "}
                      {t("documentVaultPage.components.documentCard.delete")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
