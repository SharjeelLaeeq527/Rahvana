// Add beneficiary_residence_capture configuration to step_1_5 (Fill I-130A).
// This data drives the BeneficiaryResidenceCapture UI which:
//   (a) captures countries the beneficiary lived in 6+ months in last 5 years
//   (b) surfaces police-certificate requirements for each country
//   (c) flags long-distance marriage indicator
//
// Source basis: 9 FAM 504.4-4(B) — police certificate requirement.
import fs from 'node:fs';

const path = './data/visa-category/ir-1.json';
const data = JSON.parse(fs.readFileSync(path, 'utf8'));
const ch1 = data.chapters[0];
const s5 = ch1.steps.find((s) => s.step_key === 'step_1_5');

s5.beneficiary_residence_capture = {
  title: 'Beneficiary residence history',
  subtitle:
    'Capture the beneficiary\'s residence countries here so Rahvana can pre-prepare ' +
    'the police certificate requirements for Chapter 3 and cross-check against ' +
    'the I-130A and DS-260 later.',
  rule_summary:
    'A police certificate is required from every country where the beneficiary lived ' +
    'for 6 months or more since age 16. Some countries are exempt — refer to the ' +
    'travel.state.gov Reciprocity Schedule for each country.',
  source_basis:
    '9 FAM 504.4-4(B)(2) — Police Certificate Requirement; travel.state.gov Reciprocity Schedule',
  exempt_country_note:
    'A small list of countries does not produce reliable police certificates (see ' +
    'travel.state.gov Reciprocity Schedule). The consular officer at the interview ' +
    'will indicate whether a substitute is acceptable.',
  age_threshold: 16,
  duration_threshold_months: 6,
  lookback_years: 5,
};

fs.writeFileSync(path, JSON.stringify(data, null, 10));
console.log('Added beneficiary_residence_capture to step_1_5');
console.log('Keys:', Object.keys(s5.beneficiary_residence_capture).join(', '));
