"use client";

import { useEffect, useState } from "react";
import { Loader } from "@/components/ui/spinner";
import { E, msg } from "@/lib/errors";

interface CheckoutButtonProps {
  productTier?: string;
  addons?: string[];
  visaCategory?: string;
  consultationId?: string;
  userId: string;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export default function CheckoutButton({
  productTier,
  addons,
  visaCategory,
  consultationId,
  userId,
  children,
  className = "",
  disabled = false,
  onLoadingChange,
}: CheckoutButtonProps & { onLoadingChange?: (loading: boolean) => void }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // After redirecting to Stripe, hitting the browser Back button restores this
  // page from the bfcache with React state intact — leaving the button stuck on
  // "Processing...". Reset the loading state whenever the page is shown again.
  useEffect(() => {
    const onPageShow = (e: PageTransitionEvent) => {
      if (!e.persisted) return;
      setIsLoading(false);
      onLoadingChange?.(false);
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, [onLoadingChange]);

  const handleCheckout = async () => {
    setIsLoading(true);
    onLoadingChange?.(true);
    setError(null);

    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productTier,
          addons,
          visaCategory,
          consultationId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(msg(E.PAYMENT_CHECKOUT_FAILED));
      }

      // Redirect to Stripe checkout
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(msg(E.DASH_CHECKOUT_NO_URL));
      }
    } catch (err: unknown) {
      console.error("Checkout error:", err);
      const errorMessage = err instanceof Error ? err.message : msg(E.PAYMENT_CHECKOUT_FAILED);
      setError(errorMessage);
      setIsLoading(false);
      onLoadingChange?.(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleCheckout}
        disabled={disabled || isLoading}
        className={`${className} flex items-center justify-center ${
          isLoading || disabled ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <Loader size="sm" />
            <span>Processing...</span>
          </span>
        ) : (
          children
        )}
      </button>
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
    </div>
  );
}
