import React, { useState } from 'react';
import { InfoIcon, AlertIcon, LinkIcon } from './Icons';

const CONTEXT_DATA = {
  0: {
    // Welcome
    tips: [
      'This wizard is specifically for Union Council birth certificates for US immigration purposes.',
      'Have your basic information ready: full name, date of birth, and place of birth.',
      'The process typically takes 2-4 weeks, but varies by Union Council.',
    ],
    pitfalls: [
      'Do not confuse Union Council certificates with NADRA Child Registration Certificates (CRC/B-Form).',
      'Certificates on "rupee paper" are not acceptable for US immigration.',
      'Late registration (after age 1) may require additional documentation.',
    ],
    links: [
      {
        title: 'US State Dept - Pakistan Civil Documents',
        url: 'https://travel.state.gov/content/travel/en/us-visas/Visa-Reciprocity-and-Civil-Documents-by-Country/Pakistan.html',
      },
      {
        title: 'USCIS Policy Manual - Documentation',
        url: 'https://www.uscis.gov/policy-manual/volume-7-part-a-chapter-4',
      },
    ],
    lastVerified: 'February 16, 2026',
  },
  1: {
    // Who is this for?
    tips: [
      'Age and status affect document requirements and processing time.',
      'Adults may need additional identity verification documents.',
      'For minors, both parents typically must be present or provide consent.',
    ],
    pitfalls: [
      'Senior citizens born before 1960 may face challenges if no hospital record exists.',
      'Late registration for adults may require court affidavits.',
      'Adoptions require separate legal documentation.',
    ],
    links: [
      {
        title: 'Union Council Birth Certificate Process',
        url: 'https://atmateen.com/union-council-birth-certificate/',
      },
    ],
    lastVerified: 'February 16, 2026',
  },
  2: {
    // Document Need
    tips: [
      'New certificates typically take 3-5 business days if all documents are correct.',
      'Corrections require submission of supporting documents proving the correct information.',
      'Replacement certificates can usually be issued same-day if original registration exists.',
    ],
    pitfalls: [
      'Name spelling errors are common and difficult to correct after issuance.',
      'Date discrepancies between documents will cause delays.',
      'Lost certificates cannot be replaced without proof of original registration.',
    ],
    links: [
      {
        title: 'Birth Certificate Requirements',
        url: 'https://www.pakattestation.pk/birth-certificate',
      },
    ],
    lastVerified: 'February 16, 2026',
  },
  3: {
    // Location
    tips: [
      'Your Union Council is based on your permanent address at time of birth.',
      'Urban areas generally have NADRA-connected offices for faster processing.',
      'Some districts in AJK and Gilgit-Baltistan have different systems.',
    ],
    pitfalls: [
      'Varies; verify locally: NADRA connectivity varies by district, especially in AJK.',
      'Canton areas use Cantonment Boards, not Union Councils.',
      'Islamabad uses CDA (Capital Development Authority), not traditional Union Councils.',
    ],
    links: [
      {
        title: 'Pakistan Administrative Divisions',
        url: 'https://en.wikipedia.org/wiki/Administrative_units_of_Pakistan',
      },
    ],
    lastVerified: 'February 16, 2026',
  },
  4: {
    // Roadmap
    tips: [
      'Gather all required documents before visiting the Union Council.',
      'Visit during weekday mornings for shorter wait times.',
      'MOFA attestation is required for all birth certificates used for US immigration.',
    ],
    pitfalls: [
      'Missing documents will result in rejected applications.',
      'Parent CNIC/NICOP copies must be clear and legible.',
      'Attestation can take 1-2 weeks; factor this into your timeline.',
    ],
    links: [
      {
        title: 'MOFA Attestation Requirements',
        url: 'https://mofa.gov.pk/',
      },
      {
        title: 'Document Attestation Guide',
        url: 'https://pakconsulatela.org/attestation-of-documentspower-of-attorney-requirements/',
      },
    ],
    lastVerified: 'February 16, 2026',
  },
  5: {
    // Office Finder
    tips: [
      'Confirm office hours before visiting; some close early on Fridays.',
      'Bring photocopies of all documents in addition to originals.',
      'Fee amounts vary; bring extra cash for unexpected charges.',
    ],
    pitfalls: [
      'Varies; verify locally: Office addresses and contact info can change.',
      'Some offices require appointments; call ahead to confirm.',
      'Holiday closures may not be posted online.',
    ],
    links: [
      {
        title: 'Union Council Locator',
        url: 'https://www.birthcertificatepakistan.com/union-council-karachi-birth-certificate/',
      },
    ],
    lastVerified: 'February 16, 2026',
  },
  6: {
    // Validation
    tips: [
      'Verify all spellings match your passport and other official documents exactly.',
      'Check that Union Council Secretary signature and stamp are clearly visible.',
      'Ensure the certificate is on official letterhead, not rupee paper.',
    ],
    pitfalls: [
      'Even minor spelling differences can cause rejection at NVC/Embassy.',
      'Transliteration from Urdu to English must be consistent across all documents.',
      'Faded stamps or signatures will not be accepted.',
    ],
    links: [
      {
        title: 'NVC Document Requirements',
        url: 'https://travel.state.gov/content/travel/en/us-visas/immigrate/the-immigrant-visa-process/step-5-collect-financial-evidence-and-other-supporting-documents/step-7-collect-civil-documents.html',
      },
      {
        title: 'Common NVC Document Errors',
        url: 'https://govassist.com/blog/nvc-checklist-for-common-document-errors-how-to-avoid-delays-in-your-visa-application',
      },
    ],
    lastVerified: 'February 16, 2026',
  },
};

export default function ContextPanel({ currentStep }) {
  const [activeTab, setActiveTab] = useState('tips');
  const context = CONTEXT_DATA[currentStep] || CONTEXT_DATA[0];

  return (
    <div className="h-full flex flex-col">
      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('tips')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'tips'
              ? 'text-primary border-b-2 border-primary'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <InfoIcon className="w-4 h-4" />
            <span>Tips</span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab('pitfalls')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'pitfalls'
              ? 'text-primary border-b-2 border-primary'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <AlertIcon className="w-4 h-4" />
            <span>Pitfalls</span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab('links')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'links'
              ? 'text-primary border-b-2 border-primary'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <LinkIcon className="w-4 h-4" />
            <span>Links</span>
          </div>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'tips' && (
          <div className="space-y-3">
            {context.tips.map((tip, index) => (
              <div key={index} className="flex gap-3 items-start">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                  {index + 1}
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{tip}</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'pitfalls' && (
          <div className="space-y-3">
            {context.pitfalls.map((pitfall, index) => (
              <div
                key={index}
                className={`flex gap-3 p-3 rounded-lg ${
                  pitfall.startsWith('Varies;')
                    ? 'bg-amber-50 border border-amber-200'
                    : 'bg-red-50 border border-red-200'
                }`}
              >
                <AlertIcon
                  className={`flex-shrink-0 w-5 h-5 mt-0.5 ${
                    pitfall.startsWith('Varies;') ? 'text-amber-600' : 'text-red-600'
                  }`}
                />
                <p className="text-sm text-gray-700 leading-relaxed">{pitfall}</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'links' && (
          <div className="space-y-3">
            {context.links.map((link, index) => (
              <a
                key={index}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 bg-primary-50 hover:bg-primary-100 border border-primary-200 rounded-lg transition-colors group"
              >
                <LinkIcon className="flex-shrink-0 w-5 h-5 text-primary" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-primary group-hover:underline truncate">
                    {link.title}
                  </p>
                  <p className="text-xs text-gray-600 truncate mt-0.5">{link.url}</p>
                </div>
                <svg
                  className="flex-shrink-0 w-4 h-4 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Last Verified */}
      <div className="p-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          Last verified: {context.lastVerified}
        </p>
      </div>
    </div>
  );
}
