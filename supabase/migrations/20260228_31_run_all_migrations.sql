-- Helper script to run all migrations in order
-- Run this in your Supabase SQL editor

-- 1. Create payments table
\i 20260127_create_payments_table.sql

-- 2. Add subscription fields to users
\i 20260127_add_subscription_fields.sql

-- 3. Add payment tracking to consultations
\i 20260127_add_payment_to_consultations.sql
