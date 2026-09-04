-- 1. Dedicated table for newsletter subscribers only (not all registered users)
CREATE TABLE IF NOT EXISTS public.blog_subscribers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed')),
    source TEXT DEFAULT 'blog_newsletter_cta',
    unsubscribe_token UUID NOT NULL DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Fast lookup index for active subscribers
CREATE INDEX IF NOT EXISTS idx_blog_subscribers_active 
ON public.blog_subscribers (email) 
WHERE status = 'active';

-- Index for 1-click unsubscribe token lookups
CREATE INDEX IF NOT EXISTS idx_blog_subscribers_unsub_token
ON public.blog_subscribers (unsubscribe_token);

-- 2. Deduplication & tracking log table
CREATE TABLE IF NOT EXISTS public.blog_broadcast_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscriber_id UUID REFERENCES public.blog_subscribers(id) ON DELETE CASCADE,
    article_slug TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'failed')),
    error_message TEXT,
    sent_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_blog_broadcast_dedup 
ON public.blog_broadcast_logs (subscriber_id, article_slug);

-- Enable RLS
ALTER TABLE public.blog_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_broadcast_logs ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service role full access on blog_subscribers" 
ON public.blog_subscribers 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Service role full access on blog_broadcast_logs" 
ON public.blog_broadcast_logs 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);
