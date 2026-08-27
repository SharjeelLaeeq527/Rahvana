export type ProfileDetails = Record<string, unknown>;

const PROCESSED_ADDON_CHECKOUTS_KEY =
  "processed_addon_checkout_sessions";

function getStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (item): item is string => typeof item === "string"
  );
}

export function buildAddonPurchaseUpdate(
  currentProfileDetails: ProfileDetails | null | undefined,
  checkoutSessionId: string,
  selectedAddons: string[]
): {
  alreadyProcessed: boolean;
  profileDetails: ProfileDetails;
} {
  const currentDetails = currentProfileDetails ?? {};

  const purchasedAddons = getStringArray(
    currentDetails.purchased_addons
  );

  const processedCheckoutSessions = getStringArray(
    currentDetails[PROCESSED_ADDON_CHECKOUTS_KEY]
  );

  // Prevent verify-session and webhook from applying
  // the same Stripe checkout more than once.
  if (processedCheckoutSessions.includes(checkoutSessionId)) {
    return {
      alreadyProcessed: true,
      profileDetails: currentDetails,
    };
  }

  return {
    alreadyProcessed: false,
    profileDetails: {
      ...currentDetails,

      // Duplicate IDs represent multiple purchased credits.
      purchased_addons: [
        ...purchasedAddons,
        ...selectedAddons,
      ],

      [PROCESSED_ADDON_CHECKOUTS_KEY]: [
        ...processedCheckoutSessions,
        checkoutSessionId,
      ],
    },
  };
}