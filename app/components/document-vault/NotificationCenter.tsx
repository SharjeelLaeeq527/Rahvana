"use client";

import React from "react";
import { ClipboardList, AlertCircle, AlertTriangle, Info } from "lucide-react";
import { useDocumentVaultStore } from "@/lib/document-vault/store";
import { useLanguage } from "@/app/context/LanguageContext";
import { NotificationMessage } from "@/lib/document-vault/types";
import { ALL_DOCUMENTS } from "@/lib/document-vault/document-definitions";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import Pagination from "@/components/ui/pagination";

export function NotificationBell({ variant = "icon" }: { variant?: "icon" | "header" }) {
  const notifications = useDocumentVaultStore((state) => state.getNotifications());
  const getNotificationStatus = useDocumentVaultStore((state) => state.getNotificationStatus);
  const { notificationCenterOpen, toggleNotificationCenter } = useDocumentVaultStore();

  // Calculate count of pending required documents
  const pendingRequiredCount = notifications.filter((notif) => {
    if (!notif.documentDefId) return false;

    // Look up the document definition from ALL_DOCUMENTS
    const docDef = ALL_DOCUMENTS.find((doc) => doc.id === notif.documentDefId);
    if (!docDef || !docDef.required) return false;

    // Only count if document is pending (not uploaded)
    const status = getNotificationStatus(notif);
    return status === "pending";
  }).length;

  return (
    <Sheet open={notificationCenterOpen} onOpenChange={toggleNotificationCenter}>
      <SheetTrigger asChild>
        {variant === "header" ? (
          <Button
            variant="outline"
            className="relative h-11 gap-2 rounded-2xl border-white/85 bg-white px-4 text-[#16302C] shadow-[0_12px_32px_-8px_rgba(7,40,36,0.28)] hover:border-[#0F8F80] hover:bg-white"
          >
            <ClipboardList className="h-5 w-5 text-[#0A4F49]" />
            <span className="text-[13.5px] font-bold">Pending Documents</span>
            {pendingRequiredCount > 0 && (
              <span className="absolute -top-2 -right-2 flex h-[22px] min-w-[22px] items-center justify-center rounded-full border-2 border-white bg-[#E11D48] px-1.5 text-[11.5px] font-extrabold text-white shadow-[0_2px_6px_rgba(225,29,72,0.35)]">
                {pendingRequiredCount}
              </span>
            )}
          </Button>
        ) : (
          <Button variant="outline" size="icon" className="relative">
            <div className="relative inline-flex">
              <ClipboardList className="h-5 w-5" />
              {pendingRequiredCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full border border-white/50 p-0 text-[9px] font-black"
                >
                  {pendingRequiredCount}
                </Badge>
              )}
            </div>
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="flex w-full flex-col overflow-hidden p-0 sm:max-w-[560px]">
        <NotificationCenter />
      </SheetContent>
    </Sheet>
  );
}

export function NotificationCenter() {
  const { t } = useLanguage();
  const notifications = useDocumentVaultStore((state) => state.getNotifications());
  const getNotificationStatus = useDocumentVaultStore((state) => state.getNotificationStatus);

  // Pagination
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 10;

  // Filter notifications: only show required documents and exclude uploaded ones
  const filteredNotifications = notifications.filter((notif) => {
    if (!notif.documentDefId) return false;

    // Look up the document definition from ALL_DOCUMENTS
    const docDef = ALL_DOCUMENTS.find((doc) => doc.id === notif.documentDefId);
    if (!docDef || !docDef.required) return false;

    // Only show if document is pending (not uploaded)
    const status = getNotificationStatus(notif);
    return status === "pending";
  });
  const requiredChecklistCount = ALL_DOCUMENTS.filter((doc) => doc.required).length;

  const sortedNotifications = [...filteredNotifications];

  const paginatedNotifications = sortedNotifications.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="flex h-full flex-col">
      {/* Header with Title and Counts */}
      <SheetHeader className="border-b border-slate-200 bg-[#FAFBFC] px-7 py-6 text-left">
        <div className="flex items-center justify-between gap-3 pr-12">
          <SheetTitle className="text-[22px] font-bold text-[#16302C]">Pending Documents</SheetTitle>
        </div>
        <SheetDescription className="text-[13.5px] text-[#526360]">
          {t("documentVaultPage.components.notificationCenter.subtitle")}
        </SheetDescription>
        {sortedNotifications.length > 0 && (
          <div className="mt-1 flex items-center gap-2">
            <span className="rounded-full border border-[#FECDD3] bg-[#FFE4E6] px-2.5 py-1 text-[11.5px] font-bold text-[#E11D48]">
              Pending: {sortedNotifications.length}
            </span>
            <span className="rounded-full border border-[#E2E5E8] bg-[#F8F9FA] px-2.5 py-1 text-[11.5px] font-bold text-[#526360]">
              Total Checklist: {requiredChecklistCount}
            </span>
          </div>
        )}
      </SheetHeader>

      {/* Notifications List */}
      <ScrollArea className="flex-1 px-7 py-6">
        {sortedNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 sm:py-24 text-center px-4">
            <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-full mb-4">
              <ClipboardList className="h-8 w-8 text-slate-400 dark:text-slate-500" />
            </div>
            <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {t("documentVaultPage.components.notificationCenter.emptyTitle")}
            </p>
            <p className="text-sm text-slate-500 max-w-50 mt-2 leading-relaxed">
              {t("documentVaultPage.components.notificationCenter.emptyDesc")}
            </p>
          </div>
        ) : (
          <div className="space-y-4 pb-2">
            {paginatedNotifications.map((notification) => (
              <NotificationItem key={notification.id} notification={notification} />
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Pagination */}
      {sortedNotifications.length > itemsPerPage && (
        <Pagination
          currentPage={currentPage}
          totalItems={sortedNotifications.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
}

function NotificationItem({ notification }: { notification: NotificationMessage }) {
  const openUploadModal = useDocumentVaultStore((state) => state.openUploadModal);
  const getNotificationStatus = useDocumentVaultStore((state) => state.getNotificationStatus);
  const { t } = useLanguage();

  const status = getNotificationStatus(notification);
  const isUploaded = status === "uploaded";

  const getIcon = () => {
    switch (notification.severity) {
      case "error":
        return <AlertCircle className="h-5 w-5 text-destructive" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case "info":
      default:
        return <Info className="h-5 w-5 text-blue-600" />;
    }
  };

  const handleClick = () => {
    if (notification.documentDefId) openUploadModal(notification.documentDefId);
  };

  return (
    <div
      className="flex flex-col gap-3.5 rounded-[20px] border border-[#E2E5E8] bg-white p-[18px] shadow-[0_2px_6px_rgba(22,48,44,0.04)] transition-all even:bg-[#F4F6F8] hover:border-[#0F8F80]/30 hover:shadow-[0_10px_30px_-12px_rgba(22,48,44,0.1)]"
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="mt-0.5 flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full border border-[#F3DDB0] bg-[#FFF7E6] text-[#D97706]">
          {getIcon()}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title and Message */}
          <div className="mb-3">
            <h4 className="text-[14.5px] font-bold leading-[1.35] text-[#16302C]">{notification.title}</h4>
            <p className="mt-1 text-[13px] leading-[1.5] text-[#526360]">
              {notification.message}
            </p>
          </div>

          {/* Actions Row with justify-between */}
          <div className="flex items-center justify-between gap-3 border-t border-[#EDF0F2] pt-2.5">
            {/* Upload Document Button - Only show if pending */}
            {!isUploaded && notification.actionRequired && notification.documentDefId && (
              <Button
                size="sm"
                variant="default"
                onClick={handleClick}
                className="h-8 rounded-[14px] bg-[#0A4F49] px-4 text-[12.5px] font-bold text-white hover:bg-[#073834]"
              >
                {t("documentVaultPage.components.notificationCenter.uploadDocument")}
              </Button>
            )}

            {/* Spacer when no button to maintain alignment */}
            {isUploaded && <div />}

            {/* Status Badge */}
            <Badge
              variant={isUploaded ? "outline" : "destructive"}
              className={`h-6 shrink-0 rounded-full px-2.5 text-[11.5px] font-bold ${
                isUploaded
                  ? "bg-green-50 dark:bg-green-950 border-green-300 dark:border-green-700 text-green-700 dark:text-green-300"
                  : "border border-[#FECDD3] bg-[#FFE4E6] text-[#E11D48]"
              }`}
            >
              {isUploaded ? "Uploaded" : "Pending"}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
