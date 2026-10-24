"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

/**
 * Back control for resource detail pages. Instead of deep-linking to the pricing
 * page it returns to the previous page in history (wherever the user came from),
 * per product decision. The old "Back to Pricing" <Link> is kept, commented out,
 * in app/(main)/resources/[slug]/page.tsx.
 */
export default function ResourceBackButton({ className = "" }: { className?: string }) {
  const router = useRouter();
  return (
    <button type="button" onClick={() => router.back()} className={className}>
      <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
      <span>Back</span>
    </button>
  );
}
