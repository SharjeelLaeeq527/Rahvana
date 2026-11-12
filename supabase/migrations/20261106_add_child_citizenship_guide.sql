-- Register the Child Citizenship Guide in the guides table
INSERT INTO guides (slug, title, description) VALUES
('child-citizenship-guide', 'Child Citizenship Guide', 'Screen for U.S. citizenship acquired through a U.S. citizen parent: at birth (CRBA), automatically under INA § 320, or by naturalization abroad under INA § 322.')
ON CONFLICT (slug) DO NOTHING;
