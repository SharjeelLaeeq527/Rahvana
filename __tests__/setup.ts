// Fake env vars so modules that validate at import time don't throw
process.env.STRIPE_SECRET_KEY = 'sk_test_fake_key_for_tests'
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_fake_for_tests'
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://fake.supabase.co'
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'fake-anon-key'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'fake-service-role-key'
