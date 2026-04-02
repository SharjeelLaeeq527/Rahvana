"use client";

import { useState, useEffect, ElementType } from "react";
import {
  FileText,
  Calendar,
  Clock,
  Download,
  CheckCircle,
  AlertTriangle,
  XCircle,
  CheckCheck,
  BadgeCheck,
  User,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useLanguage } from "@/app/context/LanguageContext";
import { Loader } from "@/components/ui/spinner";

type TranslationStatus =
  | "PENDING"
  | "IN_REVIEW"
  | "TRANSLATED"
  | "USER_CONFIRMED"
  | "CHANGES_REQUESTED"
  | "VERIFIED";

interface TranslationRequest {
  id: string;
  user_name: string;
  user_email: string;
  document_type: string;
  created_at: string;
  status: TranslationStatus;
  version?: number;
  original_filename?: string;
  originalFilename?: string;
  originalFileUrl?: string;
  translated_filename?: string;
  translatedFilename?: string;
  translatedFileUrl?: string;
  user_notes?: string;
  admin_notes?: string;
  translatedUploadedAt?: string;
}

// Status badge component
const StatusBadge = ({
  status,
  version = 1,
}: {
  status: string;
  version?: number;
}) => {
  const { t } = useLanguage();

  const statusConfig: Record<
    TranslationStatus,
    { color: string; icon: ElementType; label: string }
  > = {
    PENDING: {
      color: "bg-yellow-100 text-yellow-800",
      icon: Clock,
      label: t("documentTranslation.statusLabels.PENDING"),
    },
    IN_REVIEW: {
      color: "bg-blue-100 text-blue-800",
      icon: FileText,
      label: t("documentTranslation.statusLabels.IN_REVIEW"),
    },
    TRANSLATED: {
      color: "bg-purple-100 text-purple-800",
      icon: CheckCircle,
      label: t("documentTranslation.statusLabels.TRANSLATED"),
    },
    USER_CONFIRMED: {
      color: "bg-green-100 text-green-800",
      icon: CheckCheck,
      label: t("documentTranslation.statusLabels.USER_CONFIRMED"),
    },
    CHANGES_REQUESTED: {
      color: "bg-orange-100 text-orange-800",
      icon: AlertTriangle,
      label: t("documentTranslation.statusLabels.CHANGES_REQUESTED"),
    },
    VERIFIED: {
      color: "bg-green-600 text-white",
      icon: BadgeCheck,
      label: t("documentTranslation.statusLabels.VERIFIED"),
    },
  };

  const config = statusConfig[status as TranslationStatus] || {
    color: "bg-gray-100 text-gray-800",
    icon: XCircle,
    label: status,
  };
  const Icon = config.icon;

  // For TRANSLATED status, display version (e.g., Proof_V1, Proof_V1.1)
  const displayLabel =
    status === "TRANSLATED" ? `Proof_V${version}` : config.label;

  return (
    <span
      className={`inline-flex items-center gap-1 px-3 py-2 rounded-full text-sm font-medium ${config.color}`}
    >
      <Icon className="w-4 h-4" />
      {displayLabel}
    </span>
  );
};

export default function TranslationRequestDetails({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { t } = useLanguage();
  const [request, setRequest] = useState<TranslationRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [showChangeRequestModal, setShowChangeRequestModal] = useState(false);
  const [changeRequestReason, setChangeRequestReason] = useState("");

  useEffect(() => {
    const fetchRequest = async () => {
      try {
        const paramsId = await params;
        const response = await fetch(
          `/api/document-translation/${paramsId.id}/status`,
        );
        const data = await response.json();

        if (response.ok) {
          setRequest(data);
        } else {
          console.error("Error fetching request:", data.error);
        }
      } catch (error) {
        console.error("Error fetching request:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRequest();
  }, [params]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleConfirmTranslation = async () => {
    if (!request) return;

    try {
      const response = await fetch(
        `/api/document-translation/${request.id}/confirm`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
        },
      );

      const data = await response.json();

      if (response.ok) {
        // Show success toast
        toast.success(
          t("documentTranslation.requestDetailsPage.messages.confirmSuccess"),
        );

        // Update the request status with a forced update
        setRequest((prevRequest) => ({
          ...prevRequest!,
          status: "USER_CONFIRMED",
        }));
      } else {
        console.error("Error confirming translation:", data.error);
        toast.error(
          data.error ||
            t("documentTranslation.requestDetailsPage.messages.confirmFailed"),
        );
      }
    } catch (error) {
      console.error("Error confirming translation:", error);
    }

    setShowChangeRequestModal(false);
  };

  const handleRequestChanges = async () => {
    if (!request || !changeRequestReason.trim()) return;

    try {
      const response = await fetch(
        `/api/document-translation/${request.id}/request-changes`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ reason: changeRequestReason }),
        },
      );

      const data = await response.json();

      if (response.ok) {
        // Show success toast
        toast.success(
          t("documentTranslation.requestDetailsPage.messages.changeSuccess"),
        );

        // Update the request status
        setRequest((prevRequest) => ({
          ...prevRequest!,
          status: "CHANGES_REQUESTED",
        }));
      } else {
        console.error("Error requesting changes:", data.error);
        toast.error(
          data.error ||
            t("documentTranslation.requestDetailsPage.messages.changeFailed"),
        );
      }
    } catch (error) {
      console.error("Error requesting changes:", error);
    }

    setShowChangeRequestModal(false);
    setChangeRequestReason("");
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] bg-linear-to-br from-slate-50 to-slate-100 text-gray-800 py-12 px-4">
        <div className="">
          <div className="flex justify-center items-center h-64">
            <Loader size="lg" text="Loading translation request..." />
          </div>
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="bg-linear-to-br from-slate-50 to-slate-100 text-gray-800 site-main-px site-main-py">
        <div className="">
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              {t("documentTranslation.requestDetailsPage.notFound.title")}
            </h2>
            <p className="text-gray-600 mb-6">
              {t("documentTranslation.requestDetailsPage.notFound.desc")}
            </p>
            <Button
              onClick={() =>
                (window.location.href = "/document-translation/my-requests")
              }
              className="bg-primary hover:bg-primary/90"
            >
              {t("documentTranslation.requestDetailsPage.notFound.backBtn")}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-linear-to-br from-slate-50 to-slate-100 text-gray-800 site-main-px site-main-py">
      <div className="">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-primary/90">
            {t("documentTranslation.requestDetailsPage.title")}
          </h1>
          <p className="mt-2 text-gray-600">
            {t("documentTranslation.requestDetailsPage.subtitle")}
          </p>
        </header>

        {/* Back button */}
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => window.history.back()}
            className="flex items-center gap-2"
          >
            {t("documentTranslation.requestDetailsPage.backBtn")}
          </Button>
        </div>

        {/* Status Banner - Only shown when VERIFIED */}
        {request.status === "VERIFIED" && (
          <div className="bg-green-600 text-white p-6 rounded-xl mb-8 text-center">
            <div className="flex items-center justify-center gap-3 mb-2">
              <BadgeCheck className="w-8 h-8" />
              <h2 className="text-2xl font-bold">
                {t(
                  "documentTranslation.requestDetailsPage.verifiedBanner.title",
                )}
              </h2>
            </div>
            <p className="text-green-100">
              {t("documentTranslation.requestDetailsPage.verifiedBanner.desc")}
            </p>
          </div>
        )}

        {/* Summary Card */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                {t("documentTranslation.requestDetailsPage.docInfo.title")}
              </h3>
              <div className="space-y-3">
                <div className="flex items-start">
                  <FileText className="w-5 h-5 text-primary/80 mt-0.5 mr-3 shrink-0" />
                  <div>
                    <p className="text-sm text-gray-500">
                      {t(
                        "documentTranslation.requestDetailsPage.docInfo.typeLabel",
                      )}
                    </p>
                    <p className="font-medium">
                      {t(
                        `documentTranslation.uploadPage.types.${request.document_type}`,
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <Calendar className="w-5 h-5 text-primary/80 mt-0.5 mr-3 shrink-0" />
                  <div>
                    <p className="text-sm text-gray-500">
                      {t(
                        "documentTranslation.requestDetailsPage.docInfo.submittedLabel",
                      )}
                    </p>
                    <p className="font-medium">
                      {formatDate(request.created_at)}
                    </p>
                  </div>
                </div>

                {request.translatedUploadedAt && (
                  <div className="flex items-start">
                    <Clock className="w-5 h-5 text-primary/80 mt-0.5 mr-3 shrink-0" />
                    <div>
                      <p className="text-sm text-gray-500">
                        {t(
                          "documentTranslation.requestDetailsPage.docInfo.translatedLabel",
                        )}
                      </p>
                      <p className="font-medium">
                        {formatDate(request.translatedUploadedAt)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                {t(
                  "documentTranslation.requestDetailsPage.statusAndActions.title",
                )}
              </h3>
              <div className="flex flex-col gap-4">
                <div className="flex items-center">
                  <StatusBadge
                    status={request.status}
                    version={request.version || 1}
                  />
                </div>

                {/* Download buttons */}
                <div className="flex flex-col gap-3 mt-4">
                  <a
                    href={request.originalFileUrl || "#"}
                    className={`flex items-center justify-between gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors ${!request.originalFileUrl ? "opacity-50 pointer-events-none" : ""}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-full">
                        <FileText className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-gray-900 text-sm">
                          {t(
                            "documentTranslation.requestDetailsPage.statusAndActions.originalPdf",
                          )}
                        </p>
                        <p className="text-xs text-gray-500 truncate max-w-[150px]">
                          {request.original_filename ||
                            request.originalFilename}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-blue-600">
                      <span className="text-sm font-medium">
                        {t(
                          "documentTranslation.requestDetailsPage.statusAndActions.download",
                        )}
                      </span>
                      <Download className="w-4 h-4" />
                    </div>
                  </a>

                  {request.translatedFileUrl && (
                    <a
                      href={request.translatedFileUrl || "#"}
                      className={`flex items-center justify-between gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors ${!request.translatedFileUrl ? "opacity-50 pointer-events-none" : ""}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-full">
                          <FileText className="w-5 h-5 text-green-600" />
                        </div>
                        <div className="text-left">
                          <p className="font-medium text-gray-900 text-sm">
                            {t(
                              "documentTranslation.requestDetailsPage.statusAndActions.translatedPdf",
                            )}
                          </p>
                          <p className="text-xs text-gray-500 truncate max-w-[150px]">
                            {request.translated_filename ||
                              request.translatedFilename}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-green-600">
                        <span className="text-sm font-medium">
                          {t(
                            "documentTranslation.requestDetailsPage.statusAndActions.download",
                          )}
                        </span>
                        <Download className="w-4 h-4" />
                      </div>
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notes Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center mb-4">
              <User className="w-5 h-5 text-primary/80 mr-2" />
              <h3 className="text-lg font-semibold text-gray-800">
                {t(
                  "documentTranslation.requestDetailsPage.notes.yourNotesTitle",
                )}
              </h3>
            </div>
            <p className="text-gray-700">
              {request.user_notes ||
                t("documentTranslation.requestDetailsPage.notes.noUserNotes")}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center mb-4">
              <MessageSquare className="w-5 h-5 text-primary/80 mr-2" />
              <h3 className="text-lg font-semibold text-gray-800">
                {t(
                  "documentTranslation.requestDetailsPage.notes.adminNotesTitle",
                )}
              </h3>
            </div>
            <p className="text-gray-700">
              {request.admin_notes ||
                t("documentTranslation.requestDetailsPage.notes.noAdminNotes")}
            </p>
          </div>
        </div>

        {/* Action Buttons - Shown based on status */}
        {request.status === "TRANSLATED" && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              {t("documentTranslation.requestDetailsPage.actions.title")}
            </h3>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={handleConfirmTranslation}
                className="bg-green-600 hover:bg-green-700 flex items-center gap-2 flex-1 cursor-pointer"
              >
                <CheckCircle className="w-5 h-5" />
                {t(
                  "documentTranslation.requestDetailsPage.actions.confirmCorrectBtn",
                )}
              </Button>

              <Dialog
                open={showChangeRequestModal}
                onOpenChange={setShowChangeRequestModal}
              >
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="border-red-500 text-red-600 hover:bg-red-50 flex-1 cursor-pointer"
                  >
                    <AlertTriangle className="w-5 h-5" />
                    {t(
                      "documentTranslation.requestDetailsPage.actions.requestChangesBtn",
                    )}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-lg font-semibold text-gray-900">
                      {t(
                        "documentTranslation.requestDetailsPage.actions.modalTitle",
                      )}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="py-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t(
                        "documentTranslation.requestDetailsPage.actions.reasonLabel",
                      )}
                    </label>
                    <textarea
                      value={changeRequestReason}
                      onChange={(e) => setChangeRequestReason(e.target.value)}
                      placeholder={t(
                        "documentTranslation.requestDetailsPage.actions.reasonPlaceholder",
                      )}
                      className="w-full border border-gray-300 rounded-lg p-3 min-h-[100px] focus:ring-2 focus:ring-primary focus:border-transparent"
                      maxLength={500}
                    />
                    <p className="text-xs text-gray-500 mt-1 text-right">
                      {t(
                        "documentTranslation.requestDetailsPage.actions.characters",
                      ).replace(
                        "{length}",
                        changeRequestReason.length.toString(),
                      )}
                    </p>
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <Button
                      className="cursor-pointer px-4"
                      variant="outline"
                      onClick={() => {
                        setShowChangeRequestModal(false);
                        setChangeRequestReason("");
                      }}
                    >
                      {t(
                        "documentTranslation.requestDetailsPage.actions.cancelBtn",
                      )}
                    </Button>
                    <Button
                      onClick={handleRequestChanges}
                      disabled={!changeRequestReason.trim()}
                      className="px-4 bg-red-600 hover:bg-red-700 cursor-pointer"
                    >
                      {t(
                        "documentTranslation.requestDetailsPage.actions.submitRequestBtn",
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        )}

        {/* {request.status === "VERIFIED" && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Final Document</h3>
            <div className="flex flex-col sm:flex-row gap-3">
              <a href={request.translatedFileUrl || "#"} target="_blank" rel="noopener noreferrer">
                <Button 
                  className={`bg-green-600 hover:bg-green-700 flex items-center gap-2 ${!request.translatedFileUrl ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  <Download className="w-5 h-5" />
                  Download Certified Translation
                </Button>
              </a>
            </div>
          </div>
        )} */}
      </div>
    </div>
  );
}
