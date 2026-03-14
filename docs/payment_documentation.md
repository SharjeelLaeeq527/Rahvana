Complete Payment System Documentation

    Overview
    This document provides a comprehensive overview of the payment system integrated into the Rahvana application. The system uses   
    Stripe for payment processing and Supabase for storing payment records and user subscriptions.

    Architecture

    Components
     1. Frontend Component: CheckoutButton.tsx - Handles the UI for initiating payments
     2. API Routes:
        - /api/stripe/checkout - Creates Stripe checkout sessions
        - /api/stripe/webhook - Receives and processes Stripe events
     3. Service Layer: paymentService.ts - Manages database operations for payments
     4. Configuration: stripe/config.ts - Stripe initialization and product definitions
     5. Types: types/payment.ts - Type definitions for payment-related data

    File Structure

      1 ├── components/
      2 │   └── payment/
      3 │       └── CheckoutButton.tsx          # Frontend payment button component
      4 ├── app/
      5 │   └── api/
      6 │       └── stripe/
      7 │           ├── checkout/
      8 │           │   └── route.ts            # Handles checkout session creation
      9 │           ├── webhook/
     10 │           │   └── route.ts            # Processes Stripe webhook events  
     11 │           └── portal/
     12 │               └── route.ts            # (Not covered in this document)   
     13 ├── lib/
     14 │   ├── stripe/
     15 │   │   └── config.ts                   # Stripe configuration and product definitions
     16 │   └── services/
     17 │       └── paymentService.ts           # Payment database operations
     18 ├── types/
     19 │   └── payment.ts                      # Type definitions
     20 ├── .env.local                          # Environment variables
     21 └── STRIPE_PRICE_SETUP.md               # Setup instructions

    Detailed File Descriptions

    1. components/payment/CheckoutButton.tsx
    This React component provides a reusable button for initiating Stripe checkout sessions.

    Key Features:
     - Accepts props for product tier ('plus'/'pro'), consultation ID, and user ID
     - Handles loading states and error display
     - Makes POST request to /api/stripe/checkout
     - Redirects to Stripe checkout page upon success

    Props:
     - productTier: Optional ('plus' | 'pro') - For subscription purchases
     - consultationId: Optional string - For consultation bookings
     - userId: Required string - Current user's ID
     - children: ReactNode - Button content
     - className: Optional string - Additional CSS classes
     - disabled: Optional boolean - Disables the button

    2. app/api/stripe/checkout/route.ts
    This API route creates Stripe checkout sessions and records initial payment data.

    Process Flow:
     1. Validates incoming request data
     2. Retrieves user email from Supabase
     3. Checks if user has existing Stripe customer ID
     4. Creates new customer if needed
     5. Sets up session parameters based on product type:
        - For subscriptions: Uses 'subscription' mode with recurring prices
        - For consultations: Uses 'payment' mode with one-time prices
     6. Creates initial payment record in database
     7. Returns checkout session URL

    Key Features:
     - Handles both subscription and one-time payment types
     - Validates price IDs to prevent using placeholder values
     - Creates initial payment record with pending status
     - Properly sets checkout session mode based on product type

    3. app/api/stripe/webhook/route.ts
    This webhook endpoint processes Stripe events and updates application state.

    Handled Events:
     - checkout.session.completed: Updates payment status and user subscription
     - payment_intent.succeeded: Updates payment status to succeeded
     - payment_intent.payment_failed: Updates payment status to failed

    Process Flow:
     1. Verifies webhook signature for security
     2. Parses event type and handles accordingly
     3. Updates payment records in database
     4. Updates user subscription tier
     5. Sends confirmation emails
     6. Updates consultation booking status (if applicable)

    Key Features:
     - Secure webhook signature verification
     - Comprehensive event handling
     - Email notifications for successful payments
     - Automatic user subscription updates

    4. lib/stripe/config.ts
    Contains Stripe configuration and product definitions.

    Key Elements:
     - Stripe client initialization
     - Product definitions with names, prices, and Stripe price IDs
     - Environment variable validation

    Product Types:
     - PLUS: Rahvana Plus ($9.99/month)
     - PRO: Rahvana Pro ($199/month)

    5. lib/services/paymentService.ts
    Provides database operations for payment-related data.

    Methods:
     - createPayment(): Creates new payment records
     - getPaymentById(): Retrieves payment by ID
     - getPaymentBySessionId(): Retrieves payment by checkout session ID
     - getPaymentByStripeId(): Retrieves payment by Stripe payment ID
     - updatePayment(): Updates payment records
     - getUserPayments(): Gets all payments for a user
     - updateUserSubscription(): Updates user's subscription tier
     - getUserSubscription(): Gets user's subscription info

    6. types/payment.ts
    Defines TypeScript interfaces for payment-related data.

    Interfaces:
     - Payment: Complete payment record structure
     - CreatePaymentData: Data required to create a payment
     - UpdatePaymentData: Data for updating a payment

    Implementation Details

    How the Payment Flow Works

     1. Initiation: User clicks the CheckoutButton component
     2. API Request: Component makes POST request to /api/stripe/checkout
     3. Session Creation: Server creates Stripe checkout session
     4. Database Record: Initial payment record is created with 'pending' status
     5. Redirect: User is redirected to Stripe checkout page
     6. Payment Processing: Stripe processes the payment
     7. Webhook Notification: Stripe sends event to /api/stripe/webhook
     8. State Update: Webhook updates payment status and user subscription
     9. Confirmation: Confirmation email is sent to user

    Error Handling

    The system implements comprehensive error handling:

     - Price ID Validation: Prevents using placeholder values like 'price_...'
     - Mode Selection: Automatically selects 'subscription' mode for recurring prices and 'payment' mode for one-time charges 
     - Duplicate Prevention: Handles the unique constraint on stripe_payment_id by only setting it after receiving from Stripe
     - Webhook Security: Verifies webhook signatures to prevent unauthorized requests

    Security Measures

     - Webhook signature verification
     - Service role key for Supabase operations
     - Environment variable validation
     - Input validation for all API endpoints

    Testing Mode vs Production

    Testing Mode
     - Uses Stripe test keys
     - Uses test price IDs from your Stripe dashboard
     - All transactions are simulated
     - No real money is charged
     - Use test card numbers: 4242 4242 4242 4242

    Production Mode
     - Uses Stripe live keys
     - Uses real price IDs
     - Real transactions occur
     - Real money is charged
     - Requires SSL certificate for webhook endpoints

    Environment Variables Required

      1 # Stripe Configuration
      2 STRIPE_SECRET_KEY=sk_test_... (test) or sk_live_... (production)
      3 NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_... (test) or pk_live_... (production)
      4 STRIPE_WEBHOOK_SECRET=whsec_...
      5 STRIPE_PRICE_ID_PLUS=price_... (actual price ID from Stripe dashboard)
      6 STRIPE_PRICE_ID_PRO=price_... (actual price ID from Stripe dashboard)
      7 
      8 # Supabase Configuration
      9 NEXT_PUBLIC_SUPABASE_URL=https://...
     10 SUPABASE_SERVICE_ROLE_KEY=...
     11 NEXT_PUBLIC_SUPABASE_ANON_KEY=...
     12 
     13 # Email Configuration
     14 RESEND_API_KEY=...
     15 EMAIL_FROM="Name <email@domain.com>"
     16 
     17 # Application URL
     18 NEXT_PUBLIC_APP_URL=http://localhost:3000 (dev) or https://yourdomain.com (prod)

    Setup Instructions

    1. Stripe Account Setup
     1. Create a Stripe account at https://stripe.com
     2. Get your API keys from the Stripe dashboard
     3. Create products and prices in the Stripe dashboard
     4. Copy the Price IDs for your products
     5. Set up webhook endpoints in the Stripe dashboard pointing to your /api/stripe/webhook endpoint
     6. Get the webhook signing secret

    2. Environment Configuration
     1. Update your .env.local file with all required environment variables
     2. Replace placeholder price IDs with actual IDs from your Stripe dashboard
     3. Use test keys for development, live keys for production

    3. Database Schema
    Ensure your Supabase database has the required tables:
     - payments table with columns for payment tracking
     - user_profiles or users table with subscription fields
     - consultation_bookings table (if using consultation feature)

    4. Testing the System
     1. Start your development server
     2. Use the CheckoutButton to initiate a payment
     3. Complete the test payment using Stripe's test card
     4. Verify that:
        - Payment record is created in the database
        - User subscription is updated
        - Confirmation email is sent
        - Webhook logs show successful processing

    Troubleshooting

    Common Issues and Solutions

     1. "No such price: 'price_...'" Error
        - Cause: Using placeholder price IDs
        - Solution: Update environment variables with actual Stripe price IDs

     2. "You specified `payment` mode but passed a recurring price" Error
        - Cause: Trying to use subscription prices in payment mode
        - Solution: System now automatically selects correct mode based on product type

     3. "Duplicate key value violates unique constraint" Error
        - Cause: Multiple records with empty stripe_payment_id
        - Solution: System now only sets stripe_payment_id after receiving from Stripe

     4. Webhook Not Receiving Events
        - Cause: Incorrect webhook endpoint or signature verification failure
        - Solution: Verify webhook URL in Stripe dashboard and ensure SSL in production

    Maintenance

    Regular Monitoring
     - Check webhook logs for failed deliveries
     - Monitor payment success/failure rates
     - Review user subscription updates
     - Verify email delivery rates

    Updates
     - Keep Stripe SDK updated
     - Monitor Stripe API version changes
     - Update webhook handlers when Stripe adds new events
     - Regularly review and update security measures

    This payment system provides a secure, scalable solution for processing both subscription and one-time payments while
    maintaining proper state management and user experience.