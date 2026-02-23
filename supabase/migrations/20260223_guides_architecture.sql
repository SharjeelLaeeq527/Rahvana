-- ==========================================
-- Rahvana Guides Professional Architecture
-- Dynamic, Scalable, Template-Driven
-- ==========================================

-- 1. Master Registry for available guides
CREATE TABLE IF NOT EXISTS guides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    version INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. User Guide Sessions (Instance of a guide)
DO $$ BEGIN
    CREATE TYPE guide_status AS ENUM ('not_started', 'in_progress', 'completed', 'abandoned');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS user_guides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    guide_id UUID NOT NULL REFERENCES guides(id) ON DELETE CASCADE,
    status guide_status DEFAULT 'in_progress',
    progress_percent INTEGER DEFAULT 0,
    current_step_key TEXT, -- Keeps track of the last active step
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id, guide_id)
);

-- 3. Step-Level Data (JSONB Engine)
CREATE TABLE IF NOT EXISTS user_guide_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_guide_id UUID NOT NULL REFERENCES user_guides(id) ON DELETE CASCADE,
    step_key TEXT NOT NULL,
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_completed BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_guide_id, step_key)
);

-- 4. File Metadata
CREATE TABLE IF NOT EXISTS user_guide_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_guide_id UUID NOT NULL REFERENCES user_guides(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    step_key TEXT NOT NULL,
    checklist_item_id TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_name TEXT NOT NULL,
    mime_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Row Level Security (RLS)
ALTER TABLE guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_guide_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_guide_files ENABLE ROW LEVEL SECURITY;

-- Guides (Public read, Admin manage)
CREATE POLICY "Everyone can view active guides" ON guides FOR SELECT USING (is_active = TRUE);

-- User Guides (Owner only)
CREATE POLICY "Users can manage own guide sessions" ON user_guides 
    FOR ALL USING (auth.uid() = user_id);

-- User Guide Steps (Owner only, via user_guides join)
CREATE POLICY "Users can manage own guide steps" ON user_guide_steps 
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_guides 
            WHERE user_guides.id = user_guide_steps.user_guide_id 
            AND user_guides.user_id = auth.uid()
        )
    );

-- User Guide Files (Owner only)
CREATE POLICY "Users can manage own guide files" ON user_guide_files 
    FOR ALL USING (auth.uid() = user_id);

-- 6. Updated At Triggers
CREATE OR REPLACE FUNCTION update_timestamp_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trg_guides_updated_at BEFORE UPDATE ON guides FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();
CREATE TRIGGER trg_user_guide_steps_updated_at BEFORE UPDATE ON user_guide_steps FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

-- Last updated for user_guides
CREATE OR REPLACE FUNCTION update_user_guides_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trg_user_guides_updated_at BEFORE UPDATE ON user_guides FOR EACH ROW EXECUTE FUNCTION update_user_guides_timestamp();

-- 7. Seed Initial Guides (Optional but helpful for testing)
INSERT INTO guides (slug, title, description) VALUES 
('birth-certificate-guide', 'Birth Certificate Guide', 'NADRA CRC, B-Form, and alternative birth documentation.'),
('passport-guide', 'Passport Guide', 'Complete guide to obtaining or renewing your Pakistani passport.'),
('cnic-guide', 'CNIC (National ID) Guide', 'Complete guide to obtaining and renewing your NADRA CNIC.')
ON CONFLICT (slug) DO NOTHING;
