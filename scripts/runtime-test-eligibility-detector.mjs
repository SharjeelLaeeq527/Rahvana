// Runtime test: detectRiskFlagsFromEligibilityQuest
import { execSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const tmpOut = path.resolve('./scripts/_tmp-cs');
fs.rmSync(tmpOut, { recursive: true, force: true });

execSync(
  `npx tsc --skipLibCheck --target es2020 --module nodenext --moduleResolution nodenext --outDir "${tmpOut}" ` +
    `lib/case-strength/types.ts lib/case-strength/validators.ts lib/case-strength/risk-detector.ts ` +
    `lib/case-strength/evidence-classifier.ts lib/case-strength/eligibility-quest-detector.ts lib/case-strength/index.ts`,
  { stdio: 'inherit' }
);

const indexJs = path.resolve(tmpOut, 'index.js');
const mod = await import(pathToFileURL(indexJs).href);
const { detectRiskFlagsFromEligibilityQuest } = mod;

let pass = 0;
let fail = 0;
const expect = (label, cond) => {
  if (cond) { pass++; console.log('  PASS', label); }
  else      { fail++; console.log('  FAIL', label); }
};

console.log('\nEligibility quest detector tests');

// Empty / null inputs
expect('null answers returns []', detectRiskFlagsFromEligibilityQuest(null).length === 0);
expect('undefined answers returns []', detectRiskFlagsFromEligibilityQuest(undefined).length === 0);
expect('empty object returns []', detectRiskFlagsFromEligibilityQuest({}).length === 0);

// Missing prior marriage termination
const f1 = detectRiskFlagsFromEligibilityQuest({
  q3: { q3s1: 'petitioner', q3s3: 'no' },
});
expect(
  'q3s1=petitioner + q3s3=no flags missing termination',
  f1.some((f) => f.id === 'missing_prior_marriage_termination' && f.severity === 'critical')
);

const f2 = detectRiskFlagsFromEligibilityQuest({
  q3: { q3s1: 'beneficiary', q3s3: 'partial' },
});
expect(
  'q3s1=beneficiary + q3s3=partial flags missing termination',
  f2.some((f) => f.id === 'missing_prior_marriage_termination')
);

const f3 = detectRiskFlagsFromEligibilityQuest({
  q3: { q3s1: 'none' },
});
expect('q3s1=none does NOT flag missing termination', !f3.some((f) => f.id === 'missing_prior_marriage_termination'));

const f4 = detectRiskFlagsFromEligibilityQuest({
  q3: { q3s1: 'both', q3s3: 'yes' },
});
expect('q3s1=both + q3s3=yes does NOT flag missing termination', !f4.some((f) => f.id === 'missing_prior_marriage_termination'));

// Q5 patterns
const f5 = detectRiskFlagsFromEligibilityQuest({ q5: { q5s1: 'yes' } });
expect('q5s1=yes flags prior_visa_refusal_or_fraud as critical', f5.some((f) => f.id === 'prior_visa_refusal_or_fraud' && f.severity === 'critical'));

const f6 = detectRiskFlagsFromEligibilityQuest({ q5: { q5s2: 'yes' } });
expect('q5s2=yes flags beneficiary_criminal_history as critical', f6.some((f) => f.id === 'beneficiary_criminal_history' && f.severity === 'critical'));

const f7 = detectRiskFlagsFromEligibilityQuest({ q5: { q5s4: 'yes' } });
expect('q5s4=yes flags unlawful_presence_history as critical', f7.some((f) => f.id === 'unlawful_presence_history' && f.severity === 'critical'));

const f8 = detectRiskFlagsFromEligibilityQuest({ q5: { q5s5: 'yes' } });
expect('q5s5=yes flags financial_sponsorship_concern as warning', f8.some((f) => f.id === 'financial_sponsorship_concern' && f.severity === 'warning'));

const f9 = detectRiskFlagsFromEligibilityQuest({
  q5: { q5s1: 'no', q5s2: 'no', q5s4: 'no', q5s5: 'no' },
});
expect('All q5 answers "no" returns no q5-related flags', f9.length === 0);

// Combined scenario: multiple flags
const f10 = detectRiskFlagsFromEligibilityQuest({
  q3: { q3s1: 'both', q3s3: 'partial' },
  q5: { q5s1: 'yes', q5s4: 'yes', q5s5: 'yes' },
});
expect('Combined scenario surfaces 4 flags', f10.length === 4);

const sources = f10.map((f) => f.source_basis);
expect(
  'Every flag has a source_basis',
  sources.every((s) => typeof s === 'string' && s.length > 0)
);

console.log('\n---');
console.log(`Results: ${pass} pass, ${fail} fail`);

fs.rmSync(tmpOut, { recursive: true, force: true });
process.exit(fail === 0 ? 0 : 1);
