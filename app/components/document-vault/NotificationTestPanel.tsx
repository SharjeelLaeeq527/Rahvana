"use client";

import React, { useState } from "react";
import { useDocumentVaultStore } from "@/lib/document-vault/store";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useLanguage } from "@/app/context/LanguageContext";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  TestTube,
  RefreshCw,
  Calendar,
  Clock,
  AlertCircle,
} from "lucide-react";

/**
 * Testing panel for notification system - only shows in development
 * Allows you to simulate different expiry scenarios
 */
export function NotificationTestPanel() {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const {
    uploadedDocuments,
    updateDocument,
    refreshNotifications,
    getNotifications,
  } = useDocumentVaultStore();

  // Only show in development
  if (process.env.NODE_ENV === "production") {
    return null;
  }

  const simulateExpiryScenarios = () => {
    const now = new Date();

    uploadedDocuments.forEach((doc, index) => {
      if (!doc.expirationDate) return;

      let newExpiry: Date;

      // Distribute documents across different expiry scenarios
      switch (index % 5) {
        case 0:
          // Expired 5 days ago
          newExpiry = new Date(now);
          newExpiry.setDate(newExpiry.getDate() - 5);
          break;
        case 1:
          // Expires in 3 days (critical)
          newExpiry = new Date(now);
          newExpiry.setDate(newExpiry.getDate() + 3);
          break;
        case 2:
          // Expires in 15 days (urgent)
          newExpiry = new Date(now);
          newExpiry.setDate(newExpiry.getDate() + 15);
          break;
        case 3:
          // Expires in 45 days (warning)
          newExpiry = new Date(now);
          newExpiry.setDate(newExpiry.getDate() + 45);
          break;
        case 4:
          // Expires in 120 days (ok)
          newExpiry = new Date(now);
          newExpiry.setDate(newExpiry.getDate() + 120);
          break;
        default:
          return;
      }

      updateDocument(doc.id, { expirationDate: newExpiry });
    });

    refreshNotifications(t);
    toast.success(
      t("documentVaultPage.components.notificationTestPanel.testExpiryApplied"),
    );
  };

  const resetExpiryDates = () => {
    const now = new Date();

    uploadedDocuments.forEach((doc) => {
      if (!doc.expirationDate) return;

      // Set all to 6 months from now (safe)
      const newExpiry = new Date(now);
      newExpiry.setMonth(newExpiry.getMonth() + 6);

      updateDocument(doc.id, { expirationDate: newExpiry });
    });

    refreshNotifications(t);
    toast.success(
      t(
        "documentVaultPage.components.notificationTestPanel.expiryResetSuccess",
      ),
    );
  };

  const setSpecificExpiry = (days: number) => {
    if (uploadedDocuments.length === 0) {
      toast.error(
        t("documentVaultPage.components.notificationTestPanel.noDocsError"),
      );
      return;
    }

    const now = new Date();
    const newExpiry = new Date(now);
    newExpiry.setDate(newExpiry.getDate() + days);

    // Apply to first document with expiry date
    const docWithExpiry = uploadedDocuments.find((d) => d.expirationDate);
    if (docWithExpiry) {
      updateDocument(docWithExpiry.id, { expirationDate: newExpiry });
      refreshNotifications(t);
      toast.success(
        t(
          "documentVaultPage.components.notificationTestPanel.setExpirySuccess",
          { days: days.toString() },
        ),
      );
    } else {
      toast.error(
        t(
          "documentVaultPage.components.notificationTestPanel.noDocsWithExpiryError",
        ),
      );
    }
  };

  const notifications = getNotifications();

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          variant="outline"
          size="sm"
          className="bg-purple-600 text-white hover:bg-purple-700 border-purple-600"
        >
          <TestTube className="h-4 w-4 mr-2" />
          {t(
            "documentVaultPage.components.notificationTestPanel.testNotifications",
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96">
      <Card className="border-purple-600 border-2 shadow-xl">
        <CardHeader className="bg-purple-50 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TestTube className="h-5 w-5 text-purple-600" />
              <CardTitle className="text-lg">
                {t("documentVaultPage.components.notificationTestPanel.title")}
              </CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
              ✕
            </Button>
          </div>
          <CardDescription>
            {t(
              "documentVaultPage.components.notificationTestPanel.devModeDesc",
            )}
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-4 space-y-4">
          {/* Current Status */}
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">
                {t(
                  "documentVaultPage.components.notificationTestPanel.activeNotifications",
                )}
              </span>
              <Badge variant="secondary">{notifications.length}</Badge>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <span className="text-red-600 font-semibold">
                  {notifications.filter((n) => n.severity === "error").length}
                </span>{" "}
                {t("documentVaultPage.components.notificationTestPanel.errors")}
              </div>
              <div>
                <span className="text-yellow-600 font-semibold">
                  {notifications.filter((n) => n.severity === "warning").length}
                </span>{" "}
                {t(
                  "documentVaultPage.components.notificationTestPanel.warnings",
                )}
              </div>
              <div>
                <span className="text-blue-600 font-semibold">
                  {notifications.filter((n) => n.severity === "info").length}
                </span>{" "}
                {t("documentVaultPage.components.notificationTestPanel.info")}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <h4 className="text-sm font-semibold mb-2">
              {t(
                "documentVaultPage.components.notificationTestPanel.quickActions",
              )}
            </h4>
            <div className="space-y-2">
              <Button
                size="sm"
                variant="outline"
                className="w-full justify-start"
                onClick={simulateExpiryScenarios}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                {t(
                  "documentVaultPage.components.notificationTestPanel.simulateAll",
                )}
              </Button>
              <div className="text-xs text-muted-foreground pl-6">
                {t(
                  "documentVaultPage.components.notificationTestPanel.simulateDesc",
                )}
              </div>
            </div>
          </div>

          {/* Set Specific Expiry */}
          <div>
            <h4 className="text-sm font-semibold mb-2">
              {t(
                "documentVaultPage.components.notificationTestPanel.setSpecific",
              )}
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <Button
                size="sm"
                variant="destructive"
                onClick={() => setSpecificExpiry(-5)}
              >
                <AlertCircle className="h-3 w-3 mr-1" />
                {t(
                  "documentVaultPage.components.notificationTestPanel.expiredDays",
                )}
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => setSpecificExpiry(3)}
              >
                <Clock className="h-3 w-3 mr-1" />
                {t("documentVaultPage.components.notificationTestPanel.3days")}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSpecificExpiry(15)}
              >
                <Calendar className="h-3 w-3 mr-1" />
                {t("documentVaultPage.components.notificationTestPanel.15days")}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSpecificExpiry(45)}
              >
                <Calendar className="h-3 w-3 mr-1" />
                {t("documentVaultPage.components.notificationTestPanel.45days")}
              </Button>
            </div>
          </div>

          {/* Reset */}
          <div>
            <Button
              size="sm"
              variant="secondary"
              className="w-full"
              onClick={resetExpiryDates}
            >
              {t("documentVaultPage.components.notificationTestPanel.resetAll")}
            </Button>
          </div>

          {/* Info */}
          <div className="text-xs text-muted-foreground bg-blue-50 p-2 rounded">
            <strong>
              {t("documentVaultPage.components.notificationTestPanel.note")}
            </strong>{" "}
            {t(
              "documentVaultPage.components.notificationTestPanel.tempChangeDesc",
            )}{" "}
            {t(
              "documentVaultPage.components.notificationTestPanel.refreshRestore",
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
