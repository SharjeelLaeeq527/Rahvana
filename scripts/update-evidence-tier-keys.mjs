// Update step_1_2.evidence_tier_map to use the actual document vault keys
// (lib/document-vault/document-definitions.ts) so the meter can match against
// real uploaded documents.
import fs from 'node:fs';

const path = './data/visa-category/ir-1.json';
const data = JSON.parse(fs.readFileSync(path, 'utf8'));
const ch1 = data.chapters[0];
const s2 = ch1.steps.find((s) => s.step_key === 'step_1_2');

s2.evidence_tier_map = {
  disclaimer:
    'Tiers reflect practitioner-observed USCIS adjudication emphasis on financial co-mingling as the strongest bona fide evidence. Not an official USCIS scoring system.',
  source_basis:
    'USCIS Policy Manual Vol. 12, Part G, Ch. 2 — joint financial assets and liabilities emphasized as primary bona fide evidence',
  guidance:
    'A bona fide marriage petition typically benefits from 2 or more Tier 1 items. Marriage certificate plus photos alone is the most common cause of I-130 RFEs. Document keys reference lib/document-vault/document-definitions.ts.',
  note_on_joint_documents:
    'TAX_RETURNS and BANK_STATEMENTS count as Tier 1 when they are filed/held jointly. The vault does not currently track joint vs. single status — uploaders should tag joint documents in the upload metadata where supported.',
  tiers: {
    tier_1_strong: {
      label: 'Tier 1 — Strong (financial interdependence)',
      description:
        'Documents that demonstrate co-mingled finances or shared legal liability. Hardest evidence to fabricate.',
      document_keys: ['TAX_RETURNS', 'BANK_STATEMENTS', 'INSURANCE_COVERAGE'],
      additional_recommended: [
        'Joint property deed or mortgage (upload as MISC_DOCUMENT and tag in notes)',
        'Joint lease agreement (upload as MISC_DOCUMENT and tag in notes)',
        'Life insurance policy naming spouse as beneficiary (upload as MISC_DOCUMENT)',
      ],
    },
    tier_2_moderate: {
      label: 'Tier 2 — Moderate (relationship documentation)',
      description:
        'Third-party corroboration and documented relationship history.',
      document_keys: ['AFFIDAVIT_BONA_FIDE', 'CORRESPONDENCE_LOGS', 'TIMELINE'],
    },
    tier_3_supporting: {
      label: 'Tier 3 — Supporting (supplementary)',
      description:
        'Useful supplementary evidence — should support, not lead, the petition.',
      document_keys: ['SOCIAL_MEDIA_SS', 'SOCIAL_MEDIA_LIST'],
    },
  },
};

fs.writeFileSync(path, JSON.stringify(data, null, 10));

const map = s2.evidence_tier_map;
console.log('Updated evidence_tier_map with real vault keys:');
console.log('  Tier 1:', map.tiers.tier_1_strong.document_keys.join(', '));
console.log('  Tier 2:', map.tiers.tier_2_moderate.document_keys.join(', '));
console.log('  Tier 3:', map.tiers.tier_3_supporting.document_keys.join(', '));
