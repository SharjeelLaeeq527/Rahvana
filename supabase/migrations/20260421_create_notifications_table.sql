-- Create the notifications table for admin alerts
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Links to the admin user receiving the notification
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    -- Links to the specific journey (equivalent to feature_id in user_notifications)
    journey_id UUID REFERENCES public.journeys(id) ON DELETE SET NULL,
    
    -- Content fields
    type TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'normal',
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    
    -- Action context
    action_url TEXT,
    action_label TEXT,
    
    -- Status tracking (matches code logic)
    status TEXT NOT NULL DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'dismissed')),
    email_sent_at TIMESTAMPTZ, -- For tracking when the admin was notified via email
    read_at TIMESTAMPTZ,
    dismissed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Realtime so the AdminNotificationBell component updates instantly
ALTER TABLE public.notifications REPLICA IDENTITY FULL;

-- Add the table to the Supabase Realtime publication
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
EXCEPTION
  WHEN OTHERS THEN
    NULL;
END $$;

-- Enable Row Level Security (RLS)
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policies: Admins can only see and update their own notifications
CREATE POLICY "Admins can view their own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can update their own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Performance indices
CREATE INDEX IF NOT EXISTS idx_notifications_user_status ON public.notifications(user_id, status);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);