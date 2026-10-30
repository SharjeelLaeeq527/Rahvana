
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/app/context/LanguageContext";

interface SuccessStateProps {
  onGoToRequests: () => void;
  onUploadAnother?: () => void;
  isJourney?: boolean;
}

export default function SuccessState({
  onGoToRequests,
  onUploadAnother,
  isJourney,
}: SuccessStateProps) {
  const { t } = useLanguage();

  return (
      <div className="w-full max-w-md mx-4 rounded-xl border border-slate-100 bg-white p-6 text-center shadow-lg sm:p-8">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          {t("documentTranslation.successState.title")}
        </h2>

        <p className="text-gray-600 mb-6">
          {t("documentTranslation.successState.description")}
        </p>

        <div className="inline-block bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
          {t("documentTranslation.successState.statusLabel")}{" "}
          <span className="font-semibold">
            {t("documentTranslation.successState.pendingStatus")}
          </span>
        </div>

        {isJourney && (
          <Button
            onClick={onUploadAnother || (() => window.location.reload())}
            className="w-full py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors cursor-pointer"
          >
            {t("documentTranslation.successState.uploadAnother") !==
            "documentTranslation.successState.uploadAnother"
              ? t("documentTranslation.successState.uploadAnother")
              : "Upload Another Document"}
          </Button>
        )}

        {!isJourney && (
          <p className="text-gray-700 mb-8">
            {t("documentTranslation.successState.infoPart1")}
            <span className="font-semibold">
              {t("documentTranslation.successState.infoPart2")}
            </span>
            {t("documentTranslation.successState.infoPart3")}
          </p>
        )}

        {!isJourney && (
          <Button
            onClick={onGoToRequests}
            className="w-full py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors cursor-pointer"
          >
            {t("documentTranslation.successState.buttonText")}
          </Button>
        )}
      </div>
  );
}
