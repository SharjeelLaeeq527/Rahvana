CREATE TYPE feedback_type AS ENUM (
  'incorrect_information',
  'ui_ux_issue',
  'bug',
  'suggestion',
  'other'
);

CREATE TYPE feedback_status AS ENUM (
  'open',
  'resolved'
);

CREATE TABLE IF NOT EXISTS guide_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  guide_id UUID REFERENCES guides(id) ON DELETE CASCADE,
  step_key TEXT,
  feedback_type feedback_type NOT NULL,
  description TEXT,
  attachment_url TEXT,
  status feedback_status DEFAULT 'open',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  admin_resolved_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE guide_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert feedback"
ON guide_feedback FOR INSERT
WITH CHECK (auth.uid() = user_id);