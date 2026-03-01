"use client";

import React from "react";
import {
  Bell,
  X,
  AlertCircle,
  AlertTriangle,
  Info,
  Clock,
  CheckCheck,
} from "lucide-react";
import { useDocumentVaultStore } from "@/lib/document-vault/store";
import { NotificationMessage } from "@/lib/document-vault/types";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function NotificationBell() {
  const unreadCount = useDocumentVaultStore((state) =>
    state.getUnreadNotificationCount(),
  );
  const { notificationCenterOpen, toggleNotificationCenter } =
    useDocumentVaultStore();

  return (
    <Sheet
      open={notificationCenterOpen}
      onOpenChange={toggleNotificationCenter}
    >
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
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
  const notifications = useDocumentVaultStore((state) =>
    state.getNotifications(),
  );
  const markAllAsRead = useDocumentVaultStore(
    (state) => state.markAllNotificationsAsRead,
  );
  const snoozeAll = useDocumentVaultStore(
    (state) => state.snoozeAllNotifications,
  );

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="flex flex-col h-full">
      <SheetHeader className="px-1 text-left">
        <div className="flex items-center justify-between gap-2 pr-8">
          <SheetTitle className="text-xl sm:text-2xl">Notifications</SheetTitle>
          {unreadCount > 0 && (
            <Badge variant="secondary" className="shrink-0">
              {unreadCount} new
            </Badge>
          )}
        </div>
        <SheetDescription className="text-sm sm:text-base">
          Stay updated on your document status
        </SheetDescription>
      </SheetHeader>

      {notifications.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mt-4 sm:mt-6 px-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
            className="flex-1 sm:flex-none justify-center h-9 text-xs sm:text-sm font-semibold"
          >
            <CheckCheck className="h-4 w-4 mr-1.5 sm:mr-2 shrink-0" />
            Mark all read
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 sm:flex-none justify-center h-9 text-xs sm:text-sm font-semibold"
              >
                <Clock className="h-4 w-4 mr-1.5 sm:mr-2 shrink-0" />
                Snooze all
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => snoozeAll(1)}>
                1 hour
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => snoozeAll(4)}>
                4 hours
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => snoozeAll(24)}>
                24 hours
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      <ScrollArea className="flex-1 -mx-4 sm:-mx-6 px-4 sm:px-6 mt-4 sm:mt-6">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 sm:py-24 text-center px-4">
            <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-full mb-4">
              <Bell className="h-8 w-8 text-slate-400 dark:text-slate-500" />
            </div>
            <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
              No notifications
            </p>
            <p className="text-sm text-slate-500 max-w-[200px] mt-2 leading-relaxed">
              You&apos;re all caught up! New alerts will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-3 pb-8">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

function NotificationItem({
  notification,
}: {
  notification: NotificationMessage;
}) {
  const markAsRead = useDocumentVaultStore(
    (state) => state.markNotificationAsRead,
  );
  const dismiss = useDocumentVaultStore((state) => state.dismissNotification);
  const snooze = useDocumentVaultStore((state) => state.snoozeNotification);
  const openUploadModal = useDocumentVaultStore(
    (state) => state.openUploadModal,
  );

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
    markAsRead(notification.id);

    // If notification has a document, open upload modal
    if (notification.documentDefId) {
      openUploadModal(notification.documentDefId);
    }
  };

  return (
    <div
      className={`p-4 rounded-lg border transition-colors ${
        notification.read
          ? "bg-background border-border"
          : "bg-muted/50 border-primary/20"
      } ${notification.actionRequired ? "border-l-4 border-l-destructive" : ""}`}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5">{getIcon()}</div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h4 className="text-sm font-semibold leading-tight">
                {notification.title}
              </h4>
              <p className="text-sm text-muted-foreground mt-1 leading-tight">
                {notification.message}
              </p>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 -mt-1"
              onClick={() => dismiss(notification.id)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-3 sm:mt-4">
            {notification.actionRequired && notification.documentDefId && (
              <Button
                size="sm"
                variant="default"
                onClick={handleClick}
                className="h-8 text-xs font-bold w-full sm:w-auto"
              >
                Upload Document
              </Button>
            )}

            <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
              {!notification.read && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => markAsRead(notification.id)}
                  className="h-8 text-xs font-semibold flex-1 sm:flex-none"
                >
                  Mark as read
                </Button>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 text-xs font-semibold flex-1 sm:flex-none"
                  >
                    <Clock className="h-3 w-3 mr-1.5 shrink-0" />
                    Snooze
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => snooze(notification.id, 1)}>
                    1 hour
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => snooze(notification.id, 4)}>
                    4 hours
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => snooze(notification.id, 24)}>
                    24 hours
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
