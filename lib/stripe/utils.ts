import Stripe from 'stripe';

/**
 * Verify Stripe webhook signature
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): Stripe.Event {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-02-25.clover',
  });

  return stripe.webhooks.constructEvent(payload, signature, secret);
}

/**
 * Format currency amount (cents to dollars)
 */
export function formatCurrency(amountInCents: number, currency: string = 'USD'): string {
  const amount = amountInCents / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

/**
 * Get product tier from price ID
 */
export function getTierFromPriceId(priceId: string): 'plus' | 'pro' | null {
  const plusPriceId = process.env.STRIPE_PRICE_ID_PLUS;
  const proPriceId = process.env.STRIPE_PRICE_ID_PRO;

  if (priceId === plusPriceId) return 'plus';
  if (priceId === proPriceId) return 'pro';
  return null;
}

/**
 * Check if user has active subscription
 */
export function hasActiveSubscription(tier: string): boolean {
  return tier === 'plus' || tier === 'pro';
}

/**
 * Get tier display name
 */
export function getTierDisplayName(tier: 'core' | 'plus' | 'pro'): string {
  const names = {
    core: 'Rahvana Core',
    plus: 'Rahvana Plus',
    pro: 'Rahvana Pro',
  };
  return names[tier];
}

/**
 * Get tier price
 */
export function getTierPrice(tier: 'plus' | 'pro'): number {
  const prices = {
    plus: 9.99,
    pro: 199,
  };
  return prices[tier];
}
