export interface Payment {
  id: string;
  user_id: string;
  stripe_payment_id: string;
  stripe_checkout_session_id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'succeeded' | 'failed' | 'refunded';
  product_type: 'journey_plan' | 'consultation';
  product_id: string; // 'basic', 'premium', 'executive', or consultation booking id
  metadata?: Record<string, string | number | boolean | object>;
  created_at: Date;
  updated_at: Date;
}

export interface CreatePaymentData {
  user_id: string;
  stripe_checkout_session_id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'succeeded' | 'failed' | 'refunded';
  product_type: 'journey_plan' | 'consultation';
  product_id: string;
  stripe_payment_id?: string; // Optional when creating initial record
  metadata?: Record<string, string | number | boolean | object>;
}

export interface UpdatePaymentData {
  status?: 'pending' | 'succeeded' | 'failed' | 'refunded';
  stripe_payment_id?: string;
  metadata?: Record<string, string | number | boolean | object>;
}
