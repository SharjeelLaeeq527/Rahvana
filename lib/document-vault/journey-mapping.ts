import { ALL_DOCUMENTS } from './document-definitions';

/**
 * Maps common document names from journey JSONs to document tool definition IDs
 */
export function mapDocumentNameToId(name: string): string {
  const normalized = name.toLowerCase().trim();

  // Simple hardcoded mapping for common ones
  const mapping: Record<string, string> = {
    // Exact matches from IR-1 journey JSON
    'Proof of U.S. Citizenship': 'passport-petitioner',
    'Beneficiary Passport': 'passport-beneficiary',
    'Nikah Nama (Original)': 'nikah-nama',
    'NADRA Marriage Certificate': 'nikah-nama',
    'Relationship Evidence': 'misc-document',
    'Prior Marriage Termination Proof': 'divorce-decree-beneficiary',
    'Translations': 'misc-document',
    'Birth Certificate': 'birth-cert-beneficiary',
    'Police Character Certificate': 'police-certificate-pakistan',
    'Passport Photos': 'passport-photos',

    'pakistani passport': 'passport-beneficiary',
    'u.s. passport': 'passport-petitioner',
    'passport biographic page': 'passport-beneficiary',
    'beneficiary passport': 'passport-beneficiary',
    'petitioner passport': 'passport-petitioner',
    'proof of u.s. citizenship': 'passport-petitioner',
    'nadra birth certificate': 'birth-cert-beneficiary',
    'birth certificate': 'birth-cert-beneficiary',
    'nikah nama': 'nikah-nama',
    'nadra marriage certificate': 'nikah-nama',
    'union council marriage registration': 'nikah-nama',
    'marriage certificate': 'nikah-nama',
    'police certificate': 'police-certificate-pakistan',
    'police character certificate': 'police-certificate-pakistan',
    'passport photos': 'passport-photos',
    'irs tax transcripts': 'tax-returns-petitioner',
    'tax returns': 'tax-returns-petitioner',
    'employment letter': 'employment-letter',
    'pay stubs': 'pay-stubs',
    'w-2 forms': 'w2-forms',
    'bank statements': 'bank-statements',
    'i-864 form': 'i-864-affidavit',
    'marriage photos': 'wedding-photos',
    'communication records': 'communication-evidence',
    'cnic': 'cnic-beneficiary',
    'divorce decree': 'divorce-decree-beneficiary',
    'talaq nama': 'divorce-decree-beneficiary',
    'certified english translations': 'misc-document',

  };

  // Try direct mapping
  for (const [key, id] of Object.entries(mapping)) {
    if (normalized.includes(key)) return id;
  }

  // Try to find in ALL_DOCUMENTS by name
  const match = ALL_DOCUMENTS.find(d => 
    normalized.includes(d.name.toLowerCase()) || 
    d.name.toLowerCase().includes(normalized)
  );

  return match?.id || 'misc-document';
}
