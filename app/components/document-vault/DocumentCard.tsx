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
  Clock,
  Info,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DocumentCardProps {
  documentDef: DocumentDefinition;
  uploadedDoc?: UploadedDocument;
  onUpload: () => void;
  onDownload?: () => void;
  onDelete?: () => void;
  onOpenWizard: () => void;
  onExport?: () => void;
  onPreview?: () => void;
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
}: DocumentCardProps) {
  const { t } = useLanguage();

  const getStatusBadge = () => {
    if (!uploadedDoc) {
      // Show "Missing" for documents not yet uploaded
      return (
        <Badge className="bg-red-50 text-red-500 border-red-100 hover:bg-red-50 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800/50 flex items-center gap-1 font-bold">
          <AlertCircle className="w-3 h-3" />
          {t("documentVaultPage.components.documentCard.status.missing")}
        </Badge>
      );
    }

    switch (uploadedDoc.status) {
      case "UPLOADED":
        return (
          <Badge
            variant="default"
            className="flex items-center gap-1 bg-green-500"
          >
            <CheckCircle className="w-3 h-3" />
            {t("documentVaultPage.components.documentCard.status.uploaded")}
          </Badge>
        );
      case "NEEDS_ATTENTION":
        return (
          <Badge
            variant="secondary"
            className="flex items-center gap-1 bg-yellow-500"
          >
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
    <Card className="group relative overflow-hidden border-none shadow-sm hover:shadow-xl transition-all duration-300 bg-white dark:bg-slate-900 flex flex-col h-full">
      {/* Top Status Bar */}
      <div
        className={`h-1.5 w-full ${
          !uploadedDoc
            ? "bg-red-400/50"
            : uploadedDoc.status === "UPLOADED"
              ? "bg-emerald-500"
              : uploadedDoc.status === "NEEDS_ATTENTION"
                ? "bg-amber-500"
                : "bg-red-600"
        }`}
      ></div>

      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <div
                className={`p-2 rounded-xl ${uploadedDoc ? "bg-emerald-50 text-emerald-600" : "bg-slate-50 text-slate-400"}`}
              >
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-slate-900 dark:text-white leading-tight">
                {t(`documentVaultPage.documents.${documentDef.id}.name`) !==
                `documentVaultPage.documents.${documentDef.id}.name`
                  ? t(`documentVaultPage.documents.${documentDef.id}.name`)
                  : documentDef.name}
                {documentDef.required && (
                  <span className="text-red-500 ml-1 font-black">*</span>
                )}
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-2 leading-relaxed font-medium">
              {t(
                `documentVaultPage.documents.${documentDef.id}.description`,
              ) !== `documentVaultPage.documents.${documentDef.id}.description`
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
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 mb-5 border border-slate-100 dark:border-slate-700/50 space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-slate-500 uppercase tracking-tight">
                {t("documentVaultPage.components.documentCard.activeVersion")}
              </span>
              <Badge
                variant="secondary"
                className="h-5 px-1.5 text-[10px] font-black bg-white dark:bg-slate-700 shadow-sm border-none"
              >
                v{uploadedDoc.version}
              </Badge>
            </div>

            <div className="space-y-1">
              <p
                className="text-xs font-extrabold text-slate-900 dark:text-white truncate"
                title={uploadedDoc.standardizedFilename}
              >
                {getShortDisplayName(
                  uploadedDoc.standardizedFilename,
                  documentDef.name,
                )}
              </p>
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                <span>{formatFileSize(uploadedDoc.fileSize, t)}</span>
                <span className="h-1 w-1 rounded-full bg-slate-300"></span>
                <span>
                  {new Date(uploadedDoc.uploadedAt).toLocaleDateString()}
                </span>
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
                onClick={onUpload}
                className="flex-1 font-bold h-10 shadow-lg shadow-primary/20 bg-primary hover:bg-primary/95"
              >
                <Upload className="w-4 h-4 mr-2" />
                {t("documentVaultPage.components.documentCard.upload")}
              </Button>
              <Button
                onClick={onOpenWizard}
                variant="outline"
                className="flex-1 font-bold h-10 border-2"
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
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 w-9 p-0 border-2"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={onUpload}>
                      <Upload className="w-4 h-4 mr-2" />{" "}
                      {t("documentVaultPage.components.documentCard.replace")}
                    </DropdownMenuItem>
                    {onExport && (
                      <DropdownMenuItem onClick={onExport}>
                        <Package className="w-4 h-4 mr-2" />{" "}
                        {t(
                          "documentVaultPage.components.documentCard.exportZip",
                        )}
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={onOpenWizard}>
                      <Info className="w-4 h-4 mr-2" />{" "}
                      {t(
                        "documentVaultPage.components.documentCard.instructions",
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
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
