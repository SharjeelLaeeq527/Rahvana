
"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

interface BackButtonProps {
  fallbackHref?: string;
  className?: string;
}

export default function BackButton({
  fallbackHref = "/resources",
  className = "",
}: BackButtonProps) {
  const router = useRouter();

  const handleBack = () => {
    // Use browser history when a previous page exists.
    if (window.history.length > 1) {
      router.back();
    } else {
      // Fallback when the page was opened directly.
      router.push(fallbackHref);
    }
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      className={`inline-flex items-center gap-1.5 rounded-md text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d7377]/40 ${className}`}
    >
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      <span>Back</span>
    </button>
  );
}
