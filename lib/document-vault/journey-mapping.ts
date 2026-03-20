import { ALL_DOCUMENTS } from './document-definitions';

/**
 * Maps common document names from journey JSONs to document tool definition IDs
 */
export function mapDocumentNameToId(name: string): string {
  const normalized = name.toLowerCase().trim();

  // Simple hardcoded mapping for common ones
  const mapping: Record<string, string> = {
    'pakistani passport': 'passport-beneficiary',
    'nadra birth certificate': 'birth-cert-beneficiary',
    'nikah nama': 'nikah-nama',
    'union council marriage registration': 'nikah-nama', // Closest match
    'u.s. passport': 'passport-petitioner',
    'police certificate': 'police-certificate-pakistan',
    'passport photos': 'passport-photos',
    'irs tax transcripts': 'tax-returns-petitioner',
    'employment letter': 'employment-letter',
    'pay stubs': 'pay-stubs',
    'w-2 forms': 'w2-forms',
    'bank statements': 'bank-statements',
    'i-864 form': 'i-864-affidavit',
    'marriage photos': 'wedding-photos',
    'communication records': 'communication-evidence',
    'cnic': 'cnic-beneficiary',
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
