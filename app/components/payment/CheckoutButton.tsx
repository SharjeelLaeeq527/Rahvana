"use client";

import { useEffect, useState } from "react";
import { Loader } from "@/components/ui/spinner";
import { E, msg } from "@/lib/errors";

interface CheckoutButtonProps {
  productTier?: string;
  addons?: string[];
  visaCategory?: string;
  consultationId?: string;
  candidateCount?: number;
  candidateId?: string;
  action?: string;
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
  candidateCount,
  candidateId,
  action,
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
          candidateCount,
          candidateId,
          action,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Payment is failing on a plan the user already holds (past_due / manage),
        // or the server asks us to send them to the billing portal to recover
        // instead of buying again. Route there rather than showing a dead error.
        if (data?.portal) {
          try {
            const portalRes = await fetch("/api/stripe/portal", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userId }),
            });
            const portalData = await portalRes.json();
            if (portalData?.url) {
              window.location.href = portalData.url;
              return;
            }
          } catch {
            /* fall through to showing the server's message */
          }
        }
        // Surface the ACTUAL reason from the server (e.g. "You already own the
        // premium plan", or a "try again in a moment" message) instead of a
        // generic one, so the user knows what to do.
        throw new Error(data?.error || msg(E.PAYMENT_CHECKOUT_FAILED));
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
