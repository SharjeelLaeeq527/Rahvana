import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not defined in environment variables');
}

// Initialize Stripe with the secret key
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2026-01-28.clover',
  typescript: true,
});

// Stripe Product Price IDs
export const STRIPE_PRICES = {
  PLUS_MONTHLY: process.env.STRIPE_PRICE_ID_PLUS_MONTHLY || '',
  PLUS_YEARLY: process.env.STRIPE_PRICE_ID_PLUS_YEARLY || '',
  BASIC: process.env.STRIPE_PRICE_ID_BASIC || '',
  PREMIUM: process.env.STRIPE_PRICE_ID_PREMIUM || '',
  EXECUTIVE: process.env.STRIPE_PRICE_ID_EXECUTIVE || '',
} as const;

// Validate that price IDs are properly set (not placeholder values)
if (process.env.NODE_ENV !== 'development' || process.env.SKIP_STRIPE_VALIDATION !== 'true') {
  if (STRIPE_PRICES.PLUS_MONTHLY && (STRIPE_PRICES.PLUS_MONTHLY.startsWith('price_...') || STRIPE_PRICES.PLUS_MONTHLY.length < 10)) {
    console.warn('⚠️  Warning: STRIPE_PRICE_ID_PLUS_MONTHLY appears to be a placeholder value.');
  }

  if (STRIPE_PRICES.PLUS_YEARLY && (STRIPE_PRICES.PLUS_YEARLY.startsWith('price_...') || STRIPE_PRICES.PLUS_YEARLY.length < 10)) {
    console.warn('⚠️  Warning: STRIPE_PRICE_ID_PLUS_YEARLY appears to be a placeholder value.');
  }
}

// Product metadata
export const PRODUCTS = {
  PLUS_MONTHLY: {
    name: 'Rahvana Plus (Monthly)',
    price: 24.99,
    priceId: STRIPE_PRICES.PLUS_MONTHLY,
    tier: 'plus',
    features: [
      'Everything in Core',
      'Cloud Backup (Cross-device)',
      'Form Filling Masterclass',
      'NVC Document Verification',
    ],
  },
  PLUS_YEARLY: {
    name: 'Rahvana Plus (Yearly)',
    price: 299.99,
    priceId: STRIPE_PRICES.PLUS_YEARLY,
    tier: 'plus',
    features: [
      'Everything in Core',
      'Cloud Backup (Cross-device)',
      'Form Filling Masterclass',
      'NVC Document Verification',
    ],
  },
  BASIC: {
    name: 'Rahvana Basic',
    price: 349.00,
    priceId: STRIPE_PRICES.BASIC,
    tier: 'basic',
    features: [
      'Full roadmap and checklist engine',
      'Guided workflows for core form and document preparation',
      'One application completeness review pass',
      'Full analytical tools and standard interview prep',
    ],
  },
  PREMIUM: {
    name: 'Rahvana Premium',
    price: 699.00,
    priceId: STRIPE_PRICES.PREMIUM,
    tier: 'premium',
    features: [
      'Everything in Basic',
      'Two structured review passes',
      'One expert review session',
      'Priority support and advanced interview prep',
    ],
  },
  EXECUTIVE: {
    name: 'Rahvana Executive',
    price: 1099.00,
    priceId: STRIPE_PRICES.EXECUTIVE,
    tier: 'executive',
    features: [
      'Everything in Premium',
      'Dedicated case manager',
      'Three expert review sessions and mock prep',
      'Expanded coordination and highest support priority',
    ],
  },
  ADDONS: {
    consult: { name: 'Expert Consultation', price: 79 },
    review: { name: 'Deep Document Review', price: 59 },
    mock: { name: 'Mock Interview Session', price: 49 },
    translation: { name: 'Certified Translation', price: 49 },
    medical: { name: 'Medical Appointment Help', price: 89 },
    pcc: { name: 'PCC Filing Assistance', price: 69 },
  },
  PRO: {
    name: 'Rahvana Pro',
    price: 199,
    priceId: '', // Coming Soon
    tier: 'pro',
    features: [
      'Everything in Plus',
      'Document Review by Experts',
      'Mock Interview Preparation',
    ],
  },
} as const;

export type ProductTier = 'core' | 'plus' | 'pro';
export type PaymentStatus = 'pending' | 'succeeded' | 'failed' | 'refunded';
export type ProductType = 'subscription' | 'consultation';
