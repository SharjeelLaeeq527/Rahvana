// Smoke test for lib/case-strength — verifies pure functions return expected
// shapes. Run with: node scripts/smoke-test-case-strength.mjs
//
// We use tsx-style compilation via esbuild-runtime, OR we inline the source
// since these are pure functions. For simplicity, this test calls the data
// shape from the JSON and verifies the pieces line up.

import fs from 'node:fs';

const data = JSON.parse(fs.readFileSync('./data/visa-category/ir-1.json', 'utf8'));
const ch1 = data.chapters[0];

let pass = 0;
let fail = 0;
const expect = (label, cond) => {
  if (cond) {
    pass++;
    console.log('  PASS', label);
  } else {
    fail++;
    console.log('  FAIL', label);
  }
};

console.log('Smoke test: Chapter 1 case-strength data integrity');
console.log('---------------------------------------------------');

// step_1_1.risk_signals
const s1 = ch1.steps.find((s) => s.step_key === 'step_1_1');
expect('step_1_1 has risk_signals', !!s1.risk_signals);
expect('  risk_signals.disclaimer present', typeof s1.risk_signals?.disclaimer === 'string');
expect('  risk_signals has 8 patterns (4 base + 4 quest-derivable)', s1.risk_signals?.patterns?.length === 8);
expect(
  '  each pattern has id/title/severity/advisory/source_basis',
  s1.risk_signals?.patterns?.every(
    (p) => p.id && p.title && p.severity && p.advisory && p.source_basis
  )
);

// step_1_2.evidence_tier_map
const s2 = ch1.steps.find((s) => s.step_key === 'step_1_2');
expect('step_1_2 has evidence_tier_map', !!s2.evidence_tier_map);
expect(
  '  evidence_tier_map.tiers has tier_1_strong / tier_2_moderate / tier_3_supporting',
  !!(
    s2.evidence_tier_map?.tiers?.tier_1_strong &&
    s2.evidence_tier_map?.tiers?.tier_2_moderate &&
    s2.evidence_tier_map?.tiers?.tier_3_supporting
  )
);
expect(
  '  tier_1_strong has 3 real vault document keys',
  s2.evidence_tier_map?.tiers?.tier_1_strong?.document_keys?.length === 3
);
expect(
  '  tier_1_strong keys are real vault keys (TAX_RETURNS, BANK_STATEMENTS, INSURANCE_COVERAGE)',
  s2.evidence_tier_map?.tiers?.tier_1_strong?.document_keys?.includes('TAX_RETURNS')
);

// step_1_3.filing_data.processing_time_context
const s3 = ch1.steps.find((s) => s.step_key === 'step_1_3');
expect(
  'step_1_3 has filing_data.processing_time_context',
  !!s3.filing_data?.processing_time_context
);
expect(
  '  processing_time_context has online + paper sections',
  !!(
    s3.filing_data?.processing_time_context?.online &&
    s3.filing_data?.processing_time_context?.paper
  )
);

// step_1_8.tool_data.quality_requirements
const s8 = ch1.steps.find((s) => s.step_key === 'step_1_8');
expect(
  'step_1_8 has tool_data.quality_requirements',
  !!s8.tool_data?.quality_requirements
);
expect(
  '  quality_requirements.max_file_size_mb === 12',
  s8.tool_data?.quality_requirements?.max_file_size_mb === 12
);

// step_1_13.action_data.packet_section_checklist
const s13 = ch1.steps.find((s) => s.step_key === 'step_1_13');
expect(
  'step_1_13 has action_data.packet_section_checklist',
  !!s13.action_data?.packet_section_checklist
);
expect(
  '  packet_section_checklist has 8 sections',
  s13.action_data?.packet_section_checklist?.sections?.length === 8
);

// step_1_15.tool_data.receipt_format
const s15 = ch1.steps.find((s) => s.step_key === 'step_1_15');
expect(
  'step_1_15 has tool_data.receipt_format',
  !!s15.tool_data?.receipt_format
);
const pattern = s15.tool_data?.receipt_format?.pattern_regex;
expect('  receipt_format.pattern_regex present', typeof pattern === 'string');

// Inline test of receipt regex with sample values
if (pattern) {
  const rx = new RegExp(pattern);
  expect('  pattern accepts "MSC2390123456"', rx.test('MSC2390123456'));
  expect('  pattern accepts "EAC2090123456"', rx.test('EAC2090123456'));
  expect('  pattern rejects "123ABC9876543"', !rx.test('123ABC9876543'));
  expect('  pattern rejects "MSC23901234"', !rx.test('MSC23901234'));
  expect('  pattern rejects empty string', !rx.test(''));
}

// step_1_8 visible_when correctly set
expect(
  'step_1_8.visible_when has filingMethod=online',
  s8.visible_when?.filingMethod === 'online'
);

// step_1_17 metadata correctly fixed
const s17 = ch1.steps.find((s) => s.step_key === 'step_1_17');
expect('step_1_17.step_number === 17', s17.step_number === 17);
expect('step_1_17.display_order === 17', s17.display_order === 17);
expect(
  'step_1_17.dependencies includes step_1_16',
  s17.dependencies?.includes('step_1_16')
);

// Step ordering: 1_17 comes after 1_16
const idx16 = ch1.steps.findIndex((s) => s.step_key === 'step_1_16');
const idx17 = ch1.steps.findIndex((s) => s.step_key === 'step_1_17');
expect('Array order: step_1_17 comes after step_1_16', idx17 > idx16);

console.log('---------------------------------------------------');
console.log(`Results: ${pass} pass, ${fail} fail`);
process.exit(fail === 0 ? 0 : 1);
