-- Add Missing Guides to registry
INSERT INTO guides (slug, title, description) VALUES 
('polio-vaccination-guide', 'Polio Vaccination Guide', 'Complete guide to obtaining a Polio Vaccination Certificate for international travel.'),
('nikah-nama-guide', 'Nikah Nama (Marriage Certificate) Guide', 'Complete guide for Nikah Nama registration and computerization.'),
('asset-document-guide', 'Asset Document Guide', 'Guide for preparing asset documents and evaluations.'),
('bona-marriage-guide', 'Bona Fide Marriage Guide', 'Guide to proving a bona fide marriage for visa purposes.'),
('educational-certificates-us-visa', 'Educational Certificates Guide', 'Guide for attesting educational certificates and degrees.'),
('employment-certificate-guide', 'Employment Certificate Guide', 'Guide for employment certificates and verifiable experience letters.'),
('police-certificate', 'Police Certificate Guide', 'Guide for obtaining Police Character Certificates.'),
('visa-strength-guide', 'Visa Strength Guide', 'Guide to strengthen your overall visa application profile.'),
('police-verification-guide', 'Police Verification Guide', 'Guide for obtaining Police Character Certificates.'),
('step-parent-guide', 'Step-Parent Guide', 'USCIS roadmap for sponsoring step-parents, marriage rules, and document requirements.'),
('adoptive-parent-guide', 'Adoptive Parent & Guardianship Guide', 'USCIS adoption criteria, 2-year custody rule, and legal guardianship vs. U.S. adoption.'),
('adoption-guide', 'Adoptive Parent & Guardianship Guide', 'USCIS adoption criteria, 2-year custody rule, and legal guardianship vs. U.S. adoption.')
ON CONFLICT (slug) DO NOTHING;
