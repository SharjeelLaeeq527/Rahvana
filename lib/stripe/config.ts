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
  BASIC_MONTHLY: process.env.STRIPE_BASIC_MONTHLY_PRICE_ID || '',
  PREMIUM_MONTHLY: process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID || '',
  EXECUTIVE_MONTHLY: process.env.STRIPE_EXECUTIVE_MONTHLY_PRICE_ID || '',
  ADDONS: {
    "221g": process.env.STRIPE_ADDON_221G || '',
    "case-strength": process.env.STRIPE_ADDON_CASE_STRENGTH || '',
    "mock": process.env.STRIPE_ADDON_INTERVIEW_MOCK || '',
    "rapid": process.env.STRIPE_ADDON_INTERVIEW_RAPID || '',
    "pdf": process.env.STRIPE_ADDON_PDF_TOOLKIT || '',
    "photo": process.env.STRIPE_ADDON_PHOTO_BOOTH || '',
    "smart": process.env.STRIPE_ADDON_SMART_FORM || '',
    "snap": process.env.STRIPE_ADDON_SNAP_SIGN || '',
    "sponsor": process.env.STRIPE_ADDON_SPONSOR_CALC || '',
    "doc-review": process.env.STRIPE_ADDON_EXPERT_DOC_REVIEW || '',
    "consultation": process.env.STRIPE_ADDON_EXPERT_CONSULTATION || '',
    "medical": process.env.STRIPE_ADDON_MEDICAL_APPOINTMENT || '',
    "pcc": process.env.STRIPE_ADDON_PCC_FILING || '',
    "translate": process.env.STRIPE_ADDON_DOCUMENT_TRANSLATION || '',
    "case-manager": process.env.STRIPE_ADDON_CASE_MANAGER || '',
    "civil-guid": process.env.STRIPE_ADDON_CIVIL_GUIDES || '',
  }
} as const;

// Product metadata
export const PRODUCTS = {
  BASIC: {
    name: 'Rahvana Basic',
    price: 349.00,
    monthlyPrice: 29.08,
    priceId: STRIPE_PRICES.BASIC,
    recurringPriceId: STRIPE_PRICES.BASIC_MONTHLY,
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
    monthlyPrice: 58.25,
    priceId: STRIPE_PRICES.PREMIUM,
    recurringPriceId: STRIPE_PRICES.PREMIUM_MONTHLY,
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
    monthlyPrice: 91.58,
    priceId: STRIPE_PRICES.EXECUTIVE,
    recurringPriceId: STRIPE_PRICES.EXECUTIVE_MONTHLY,
    tier: 'executive',
    features: [
      'Everything in Premium',
      'Dedicated case manager',
      'Three expert review sessions and mock prep',
      'Expanded coordination and highest support priority',
    ],
  },
  ADDONS: {
    "221g": { name: '221(g) Action Planner', price: 199, priceId: STRIPE_PRICES.ADDONS["221g"] },
    "case-strength": { name: 'Case Strength Analyzer', price: 49, priceId: STRIPE_PRICES.ADDONS["case-strength"] },
    "mock": { name: 'Interview Prep - Mock Interview', price: 39, priceId: STRIPE_PRICES.ADDONS["mock"] },
    "rapid": { name: 'Interview Prep - Rapid Fire Mode', price: 39, priceId: STRIPE_PRICES.ADDONS["rapid"] },
    "pdf": { name: 'PDF Tool Kit', price: 69, priceId: STRIPE_PRICES.ADDONS["pdf"] },
    "photo": { name: 'Photo Booth', price: 15, priceId: STRIPE_PRICES.ADDONS["photo"] },
    "smart": { name: 'Smart Form Filler', price: 39, priceId: STRIPE_PRICES.ADDONS["smart"] },
    "snap": { name: 'Snap & Sign', price: 5, priceId: STRIPE_PRICES.ADDONS["snap"] },
    "sponsor": { name: 'Sponsorship Calculator', price: 15, priceId: STRIPE_PRICES.ADDONS["sponsor"] },
    "doc-review": { name: 'Expert Document Review (Offline)', price: 59, priceId: STRIPE_PRICES.ADDONS["doc-review"] },
    "consultation": { name: 'Expert Consultation', price: 99, priceId: STRIPE_PRICES.ADDONS["consultation"] },
    "medical": { name: 'Book Medical Appointment', price: 5, priceId: STRIPE_PRICES.ADDONS["medical"] },
    "pcc": { name: 'PCC Filing (Sindh Only)', price: 25, priceId: STRIPE_PRICES.ADDONS["pcc"] },
    "translate": { name: 'Document Translation', price: 25, priceId: STRIPE_PRICES.ADDONS["translate"] },
    "case-manager": { name: 'Dedicated Case Manager', price: 300, priceId: STRIPE_PRICES.ADDONS["case-manager"] },
    "civil-guid": { name: 'Civil Document Guides', price: 5, priceId: STRIPE_PRICES.ADDONS["civil-guid"] },
  },
} as const;

export type ProductTier = 'basic' | 'premium' | 'executive';
export type PaymentStatus = 'pending' | 'succeeded' | 'failed' | 'refunded';
export type ProductType = 'journey_plan' | 'consultation';
