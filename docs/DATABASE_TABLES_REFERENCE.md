# Database Table Structure - Quick Reference

## Two Separate Tables

### 1. `profiles` table
**Purpose**: Basic user information and roles  
**Created by**: `create_profiles_and_roles.sql`

**Columns**:
- `id` (UUID) - References auth.users(id), PRIMARY KEY
- `email` (TEXT)
- `username` (TEXT)
- `full_name` (TEXT)
- `avatar_url` (TEXT)
- `website` (TEXT)
- `role` (TEXT) - 'user', 'admin', etc.
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**Used for**: Admin checks, basic user info

---

### 2. `user_profiles` table ⭐ **USE THIS FOR PROFILE SYSTEM**
**Purpose**: Subscription and detailed profile data  
**Created by**: `20260127_add_subscription_fields.sql`

**Columns**:
- `id` (UUID) - References auth.users(id), PRIMARY KEY
- `subscription_tier` (TEXT) - 'core', 'plus', 'pro'
- `subscription_status` (TEXT) - 'active', 'cancelled', etc.
- `stripe_customer_id` (TEXT)
- `stripe_subscription_id` (TEXT)
- `current_period_end` (TIMESTAMP)
- **`profile_details` (JSONB)** ⭐ **THIS IS WHERE ALL PROFILE DATA GOES**
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**Used for**: Complete profile system, subscriptions, auto-fill data

---

## Which Table to Use?

| Use Case | Table to Use |
|----------|-------------|
| Save/Load complete user profile | `user_profiles` |
| Check user role (admin/user) | `profiles` |
| Get email, username | Either (but `profiles` is better) |
| Auto-fill forms | `user_profiles` (profile_details column) |
| Subscription info | `user_profiles` |

---

## Current Code Usage

### ✅ CORRECT - Using `user_profiles`:
- `app/components/forms/auth/CompleteProfileForm.tsx`
- `app/(tools)/visa-case-strength-checker/page.tsx`
- `app/(main)/profile/page.tsx` (should use this)

### ❌ INCORRECT - Using `profiles`:
- `lib/supabase/middleware.ts` (for admin check - this is OK)

---

## The Confusion

You have **TWO** tables because:
1. `profiles` - Was created early for basic auth
2. `user_profiles` - Was created later for subscriptions + detailed profile

**For profile auto-fill system, ALWAYS use `user_profiles.profile_details`**

---

## Migration Status

The trigger `handle_new_user_profile()` creates rows in **`user_profiles`** table when user signs up.

The trigger `handle_new_user()` creates rows in **`profiles`** table when user signs up.

**Both triggers run**, so both tables get a row for each user.
