"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import { Loader } from "@/components/ui/spinner";
import { PageGate } from "@/app/components/entitlements/PageGate";
import { CreditLaunchModal } from "@/app/components/wallet/CreditLaunchModal";
import { useStandaloneAccess } from "@/lib/wallet/useStandaloneAccess";
import type { WalletResourceType } from "@/lib/wallet/catalog";

/**
 * Handles access to standalone resources launched from the catalog.
 *
 * - Users with plan or add-on access can open the resource normally.
 * - Users with a wallet unlock can access it without upgrading their plan.
 * - Locked users see the PageGate screen with an option to unlock using credits.
 * - Resources not listed in the catalog fall back to the regular PageGate.
 *
 * The resource content stays unmounted while access is locked.
 */
export function StandaloneAccessGate({
  feature,
  resourceType,
  resourceId,
  title,
  description,
  children,
}: {
  /** Entitlement feature key, e.g. "guide_passport" (snake_case). */
  feature: string;
  /** Catalog resource type: "tool", "guide", or "service". */
  resourceType: WalletResourceType;
  /** Catalog resource ID, e.g. "guide-passport" (kebab-case). */
  resourceId: string;
  title?: string;
  description?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [showLaunch, setShowLaunch] = useState(false);
  const access = useStandaloneAccess(resourceType, resourceId, feature);

  // Wait until the plan and wallet checks finish before deciding what to show.
  if (access.status === "checking") {
    return (
      <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden bg-[#fafcff]">
        <Loader size="lg" text="Loading..." subText="" />
      </div>
    );
  }

  // Render the resource normally when the user has access.
  if (access.status === "open") return <>{children}</>;

  // Keep the existing PageGate behavior for resources that aren't in the catalog.
  if (access.status === "no-catalog") {
    return (
      <PageGate feature={feature} title={title} description={description}>
        {children}
      </PageGate>
    );
  }

  // The resource is locked, so offer a one-time credit unlock through the modal.
  return (
    <>
      <PageGate
        feature={feature}
        title={title}
        description={description}
        creditUnlock={
          access.catalogItem
            ? {
                credits: access.catalogItem.credits,
                onUnlock: () => setShowLaunch(true),
              }
            : undefined
        }
      >
        {/* Keep the actual resource content unmounted while access is locked. */}
        {null}
      </PageGate>

      {showLaunch && access.catalogItem && (
        <CreditLaunchModal
          item={access.catalogItem}
          href={pathname} // Use the clean path so preview mode isn't carried into the unlock flow.
          onClose={() => setShowLaunch(false)}
        />
      )}
    </>
  );
}
