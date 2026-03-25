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

export function NotificationBell() {
  const notifications = useDocumentVaultStore((state) =>
    state.getNotifications(),
  );
  const getNotificationStatus = useDocumentVaultStore(
    (state) => state.getNotificationStatus,
  );
  const { notificationCenterOpen, toggleNotificationCenter } =
    useDocumentVaultStore();

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
    <Sheet
      open={notificationCenterOpen}
      onOpenChange={toggleNotificationCenter}
    >
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <ClipboardList className="h-5 w-5" />
          {pendingRequiredCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {pendingRequiredCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg p-4 sm:p-6 overflow-hidden flex flex-col">
        <NotificationCenter />
      </SheetContent>
    </Sheet>
  );
}

export function NotificationCenter() {
  const { t } = useLanguage();
  const notifications = useDocumentVaultStore((state) =>
    state.getNotifications(),
  );
  const getNotificationStatus = useDocumentVaultStore(
    (state) => state.getNotificationStatus,
  );

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

  const sortedNotifications = [...filteredNotifications];

  const paginatedNotifications = sortedNotifications.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header with Title and Counts */}
      <SheetHeader className="px-1 text-left">
        <div className="flex items-center justify-between gap-3 mb-4">
          <SheetTitle className="text-xl sm:text-2xl">
            Pending Documents
          </SheetTitle>
        </div>
        <SheetDescription className="text-sm sm:text-base">
          {t("documentVaultPage.components.notificationCenter.subtitle")}
        </SheetDescription>
      </SheetHeader>

      {/* Counts Section */}
      {sortedNotifications.length > 0 && (
        <div className="flex items-center justify-end gap-2 mt-4 sm:mt-6 px-1 pb-4 border-b">
          <Badge className="bg-red-100 text-red-700 border-red-300 dark:bg-red-950 dark:text-red-300 dark:border-red-700 hover:bg-red-200 dark:hover:bg-red-900 transition-colors">
            Pending: {sortedNotifications.length}
          </Badge>

          <Badge className="bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600 hover:bg-slate-200 dark:hover:bg-slate-900 transition-colors">
            Total: {sortedNotifications.length}
          </Badge>
        </div>
      )}

      {/* Notifications List */}
      <ScrollArea className="flex-1 -mx-4 sm:-mx-6 px-4 sm:px-6 mt-4 sm:mt-6">
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
          <div className="space-y-3 pb-4">
            {paginatedNotifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
              />
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

function NotificationItem({
  notification,
}: {
  notification: NotificationMessage;
}) {
  const openUploadModal = useDocumentVaultStore(
    (state) => state.openUploadModal,
  );
  const getNotificationStatus = useDocumentVaultStore(
    (state) => state.getNotificationStatus,
  );
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
      className={`p-4 rounded-lg border transition-colors shadow-sm hover:shadow-md bg-white dark:bg-slate-800 ${
        isUploaded ? "border-border" : "border-primary/20"
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="mt-0.5 shrink-0">{getIcon()}</div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title and Message */}
          <div className="mb-3">
            <h4 className="text-sm font-semibold leading-tight">
              {notification.title}
            </h4>
            <p className="text-sm text-muted-foreground mt-1 leading-tight">
              {notification.message}
            </p>
          </div>

          {/* Actions Row with justify-between */}
          <div className="flex items-center justify-between gap-3">
            {/* Upload Document Button - Only show if pending */}
            {!isUploaded &&
              notification.actionRequired &&
              notification.documentDefId && (
                <Button
                  size="sm"
                  variant="default"
                  onClick={handleClick}
                  className="h-8 text-xs font-bold"
                >
                  {t(
                    "documentVaultPage.components.notificationCenter.uploadDocument",
                  )}
                </Button>
              )}

            {/* Spacer when no button to maintain alignment */}
            {isUploaded && <div />}

            {/* Status Badge */}
            <Badge
              variant={isUploaded ? "outline" : "destructive"}
              className={`h-6 px-2 text-xs font-semibold shrink-0 ${
                isUploaded
                  ? "bg-green-50 dark:bg-green-950 border-green-300 dark:border-green-700 text-green-700 dark:text-green-300"
                  : ""
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
