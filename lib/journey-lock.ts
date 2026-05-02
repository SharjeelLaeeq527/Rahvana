export const JOURNEY_LOCK_DAYS = 14;

export interface JourneyLockStatus {
  isLocked: boolean;
  isWarning: boolean; // true when <= 3 days remaining
  daysRemaining: number;
  lockDate: Date | null;
}

export function getJourneyLockStatus(
  metadata: Record<string, any>,
): JourneyLockStatus {
  const ceacIssuedAt = metadata?.ceacIssuedAt as string | undefined;

  const neutral: JourneyLockStatus = {
    isLocked: false,
    isWarning: false,
    daysRemaining: JOURNEY_LOCK_DAYS,
    lockDate: null,
  };

  if (!ceacIssuedAt) return neutral;

  const setDate = new Date(ceacIssuedAt);
  const lockDate = new Date(
    setDate.getTime() + JOURNEY_LOCK_DAYS * 24 * 60 * 60 * 1000,
  );
  const now = new Date();
  const msRemaining = lockDate.getTime() - now.getTime();
  const daysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24));

  return {
    isLocked: daysRemaining <= 0,
    isWarning: daysRemaining > 0 && daysRemaining <= 3,
    daysRemaining: Math.max(0, daysRemaining),
    lockDate,
  };
}
