"use client";

import { useCallback, useState } from "react";

type FeatureUsageDetails = {
  allowed: boolean;
  used?: number;
  limit?: number;
  remaining?: number;
  reason?: string;
};

type FeatureUsageResponse = {
  success: boolean;
  message?: string;
  data?: {
    feature: string;
    usage: FeatureUsageDetails;
  };
  allowed?: boolean;
  unlimited?: boolean;
  used?: number;
  limit?: number;
  remaining?: number;
  upgradeTarget?: string;
  addon?: {
    id: string;
    name: string;
    price: number;
    unit?: string;
    note?: string;
  };
};

export type FeatureAccessOptions = {
  tier?: string | null;
  journeyCategory?: string | null;
};

export function useFeatureAccess() {
  const [loading, setLoading] = useState(false);

  const checkAccess = useCallback(
    async (
      feature: string,
      options?: FeatureAccessOptions
    ): Promise<{
      allowed: boolean;
      data?: FeatureUsageResponse;
    }> => {
      try {
        setLoading(true);

        const params = new URLSearchParams({ feature });
        if (options?.tier) params.set("tier", options.tier);
        if (options?.journeyCategory) params.set("journeyCategory", options.journeyCategory);

        const res = await fetch(`/api/feature-usage?${params.toString()}`, {
          method: "GET",
        });

        const data = (await res.json()) as FeatureUsageResponse;

        if (!res.ok || !data.success) {
          return {
            allowed: false,
            data,
          };
        }

        return {
          allowed: true,
          data,
        };
      } catch (error) {
        return {
          allowed: false,
          data: {
            success: false,
            message: error instanceof Error ? error.message : "Unable to check feature access",
          },
        };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const consumeAccess = useCallback(
    async (
      feature: string,
      options?: FeatureAccessOptions
    ): Promise<{
      allowed: boolean;
      data?: FeatureUsageResponse;
    }> => {
      try {
        setLoading(true);

        const res = await fetch("/api/feature-usage", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            feature,
            tier: options?.tier,
            journeyCategory: options?.journeyCategory,
          }),
        });

        const data = (await res.json()) as FeatureUsageResponse;

        if (!res.ok || !data.success) {
          return {
            allowed: false,
            data,
          };
        }

        return {
          allowed: true,
          data,
        };
      } catch (error) {
        return {
          allowed: false,
          data: {
            success: false,
            message: error instanceof Error ? error.message : "Unable to reserve feature access",
          },
        };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { checkAccess, consumeAccess, loading };
}
