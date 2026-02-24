-- Add FRC Guide to registry
INSERT INTO guides (slug, title, description) VALUES 
('frc-guide', 'Family Registration Certificate (FRC)', 'NADRA Family Registration Certificate (FRC) for immigration and official purposes.')
ON CONFLICT (slug) DO NOTHING;
