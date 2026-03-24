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
  BASIC: process.env.STRIPE_BASIC_PRICE_ID || '',
  PREMIUM: process.env.STRIPE_PREMIUM_PRICE_ID || '',
  EXECUTIVE: process.env.STRIPE_EXECUTIVE_PRICE_ID || '',
  ADDONS: {
    CONSULT: process.env.STRIPE_ADDON_EXPERT_CONSULTATION || '',
    REVIEW: process.env.STRIPE_ADDON_DEEP_DOC_REVIEW || '',
    MOCK: process.env.STRIPE_ADDON_MOCK_INTERVIEW || '',
    TRANSLATION: process.env.STRIPE_ADDON_CERTIFIED_TRANSLATION || '',
    MEDICAL: process.env.STRIPE_ADDON_MEDICAL_APPOINTMENT || '',
    PCC: process.env.STRIPE_ADDON_PCC_FILING || '',
  }
} as const;

// Product metadata
export const PRODUCTS = {
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
    consult: { name: 'Expert Consultation', price: 79, priceId: STRIPE_PRICES.ADDONS.CONSULT },
    review: { name: 'Deep Document Review', price: 59, priceId: STRIPE_PRICES.ADDONS.REVIEW },
    mock: { name: 'Mock Interview Session', price: 49, priceId: STRIPE_PRICES.ADDONS.MOCK },
    translation: { name: 'Certified Translation', price: 49, priceId: STRIPE_PRICES.ADDONS.TRANSLATION },
    medical: { name: 'Medical Appointment Help', price: 89, priceId: STRIPE_PRICES.ADDONS.MEDICAL },
    pcc: { name: 'PCC Filing Assistance', price: 69, priceId: STRIPE_PRICES.ADDONS.PCC },
  },
} as const;

export type ProductTier = 'basic' | 'premium' | 'executive';
export type PaymentStatus = 'pending' | 'succeeded' | 'failed' | 'refunded';
export type ProductType = 'journey_plan' | 'consultation';
