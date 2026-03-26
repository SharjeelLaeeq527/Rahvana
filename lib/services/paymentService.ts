import { createClient } from '@supabase/supabase-js';
import { CreatePaymentData, Payment, UpdatePaymentData } from '@/types/payment';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Use service role key for server-side operations
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export const paymentService = {
  /**
   * Create a new payment record
   */
  async createPayment(data: CreatePaymentData): Promise<Payment> {
    // Prepare the insert object conditionally including stripe_payment_id only if provided
    const insertData: CreatePaymentData & { stripe_payment_id?: string } = {
      user_id: data.user_id,
      stripe_checkout_session_id: data.stripe_checkout_session_id,
      amount: data.amount,
      currency: data.currency,
      status: data.status,
      product_type: data.product_type,
      product_id: data.product_id,
      metadata: data.metadata || {},
      ...(data.stripe_payment_id ? { stripe_payment_id: data.stripe_payment_id } : {}),
    };

    const { data: payment, error } = await supabase
      .from('payments')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Error creating payment:', error);
      throw new Error(`Failed to create payment: ${error.message}`);
    }

    return payment as Payment;
  },

  /**
   * Get payment by ID
   */
  async getPaymentById(id: string): Promise<Payment> {
    const { data: payment, error } = await supabase
      .from('payments')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching payment:', error);
      throw new Error(`Failed to fetch payment: ${error.message}`);
    }

    return payment as Payment;
  },

  /**
   * Get payment by Stripe checkout session ID
   */
  async getPaymentBySessionId(sessionId: string): Promise<Payment | null> {
    const { data: payment, error } = await supabase
      .from('payments')
      .select('*')
      .eq('stripe_checkout_session_id', sessionId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null;
      }
      console.error('Error fetching payment by session ID:', error);
      throw new Error(`Failed to fetch payment: ${error.message}`);
    }

    return payment as Payment;
  },

  /**
   * Get payment by Stripe payment intent ID
   */
  async getPaymentByStripeId(stripePaymentId: string): Promise<Payment | null> {
    const { data: payment, error } = await supabase
      .from('payments')
      .select('*')
      .eq('stripe_payment_id', stripePaymentId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Error fetching payment by Stripe ID:', error);
      throw new Error(`Failed to fetch payment: ${error.message}`);
    }

    return payment as Payment;
  },

  /**
   * Update payment status
   */
  async updatePayment(id: string, data: UpdatePaymentData): Promise<Payment> {
    const { data: payment, error } = await supabase
      .from('payments')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating payment:', error);
      throw new Error(`Failed to update payment: ${error.message}`);
    }

    return payment as Payment;
  },

  /**
   * Get all payments for a user
   */
  async getUserPayments(userId: string): Promise<Payment[]> {
    const { data: payments, error } = await supabase
      .from('payments')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user payments:', error);
      throw new Error(`Failed to fetch user payments: ${error.message}`);
    }

    return payments as Payment[];
  },

  /**
   * Update user subscription tier
   */
  async updateUserSubscription(
    userId: string,
    tier: 'free' | 'basic' | 'premium' | 'executive',
    stripeCustomerId?: string
  ): Promise<void> {
    const updateData = {
      subscription_tier: tier,
      subscription_status: 'active',
      ...(stripeCustomerId ? { stripe_customer_id: stripeCustomerId } : {}),
    };

    // Try updating user_profiles table first
    const { error: profileError } = await supabase
      .from('user_profiles')
      .upsert({
        id: userId,
        ...updateData,
      });

    if (profileError) {
      // If user_profiles doesn't exist, try users table
      const { error: userError } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', userId);

      if (userError) {
        console.error('Error updating user subscription:', userError);
        throw new Error(`Failed to update user subscription: ${userError.message}`);
      }
    }
  },

  /**
   * Get user subscription info
   */
  async getUserSubscription(userId: string): Promise<{
    subscription_tier: 'free' | 'basic' | 'premium' | 'executive';
    subscription_status: 'active' | 'inactive' | 'canceled' | 'past_due';
    stripe_customer_id?: string;
  } | null> {
    // Try user_profiles first
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('subscription_tier, subscription_status, stripe_customer_id')
      .eq('id', userId)
      .single();

    if (!profileError && profile) {
      return profile;
    }

    // Try users table
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('subscription_tier, subscription_status, stripe_customer_id')
      .eq('id', userId)
      .single();

    if (userError) {
      return null;
    }

    return user;
  },
};
