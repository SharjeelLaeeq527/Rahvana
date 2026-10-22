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

/**
 * Where the check runs. The server resolves the tier from this (journey plan,
 * no plan for standalone, or the account plan by default); it never trusts a
 * tier sent by the client.
 */
export type FeatureAccessOptions = {
  scope?: "journey" | "standalone";
  /** Journey row id (or slug) when scope is "journey". */
  journeyId?: string | null;
  journeyCategory?: string | null;
  candidateId?: string | null;
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
        if (options?.scope) params.set("scope", options.scope);
        if (options?.journeyId) params.set("journeyId", options.journeyId);
        if (options?.journeyCategory) params.set("journeyCategory", options.journeyCategory);
        if (options?.candidateId) params.set("candidateId", options.candidateId);

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
            scope: options?.scope,
            journeyId: options?.journeyId,
            journeyCategory: options?.journeyCategory,
            candidateId: options?.candidateId,
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
