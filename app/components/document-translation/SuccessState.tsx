import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SuccessStateProps {
  onGoToRequests: () => void;
}

export default function SuccessState({ onGoToRequests }: SuccessStateProps) {
  return (
    <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-6 sm:p-8 text-center mx-4 border border-slate-100">
      <div className="flex justify-center mb-6">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
      </div>

      <h2 className="text-2xl font-bold text-gray-800 mb-2">
        Document Submitted Successfully!
      </h2>
      <p className="text-gray-600 mb-6">
        Your document has been received and is being processed by our team.
      </p>

      <div className="inline-block bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
        Status: <span className="font-semibold">PENDING</span>
      </div>

      <p className="text-gray-700 mb-8">
        Our team will review your document and provide a true English
        translation. You can check the status of your request anytime in{" "}
        <span className="font-semibold">My Translation Requests.</span>
      </p>

      <Button
        onClick={onGoToRequests}
        className="w-full py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors cursor-pointer"
      >
        Go to My Requests
      </Button>
    </div>
  );
}
