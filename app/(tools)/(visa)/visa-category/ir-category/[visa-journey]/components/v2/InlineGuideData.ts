export const InlineGuideData: Record<
  string,
  {
    title: string;
    sub: string;
    sourceType: "internal" | "rahvana";
    sections: { title: string; htmlContent: string }[];
  }
> = {
  doc_citizenship: {
    title: "Proof of U.S. Citizenship",
    sub: "Establishes the petitioner's right to file for an IR-1 spouse",
    sourceType: "internal",
    sections: [
      {
        title: "What this is",
        htmlContent: `<p class="text-[14px] text-[#3a4f63] leading-[1.7] mb-[10px] last:mb-0">The petitioner — the U.S. citizen spouse — must prove their citizenship to USCIS when filing Form I-130. This is the foundational document of the entire petition.</p>`,
      },
      {
        title: "Accepted documents",
        htmlContent: `<p class="text-[14px] text-[#3a4f63] leading-[1.7] mb-[10px]">USCIS accepts one of the following as proof of U.S. citizenship:</p>
        <ul class="pl-[20px] mt-[6px] list-disc marker:text-[#6b8097]">
          <li class="text-[14px] text-[#3a4f63] leading-[1.65] mb-[6px] last:mb-0"><strong class="font-semibold text-[#1c2b3a]">U.S. passport</strong> — valid or recently expired; most commonly used</li>
          <li class="text-[14px] text-[#3a4f63] leading-[1.65] mb-[6px] last:mb-0"><strong class="font-semibold text-[#1c2b3a]">U.S. birth certificate</strong> — issued by a U.S. state or county vital records office</li>
          <li class="text-[14px] text-[#3a4f63] leading-[1.65] mb-[6px] last:mb-0"><strong class="font-semibold text-[#1c2b3a]">Certificate of Naturalization (Form N-550)</strong> — issued by USCIS after oath ceremony</li>
          <li class="text-[14px] text-[#3a4f63] leading-[1.65] mb-[6px] last:mb-0"><strong class="font-semibold text-[#1c2b3a]">Certificate of Citizenship (Form N-560)</strong> — for those who acquired or derived citizenship through a parent</li>
          <li class="text-[14px] text-[#3a4f63] leading-[1.65] mb-[6px] last:mb-0"><strong class="font-semibold text-[#1c2b3a]">Consular Report of Birth Abroad (Form FS-240 / DS-1350)</strong> — for those born abroad to a U.S. citizen parent</li>
        </ul>
        <div class="bg-[#e8f1fb] border border-[#d0e4f7] rounded-[9px] p-[13px_16px] mt-[14px]">
          <p class="text-[13px] text-[#3a4f63] leading-[1.6] m-0">You do not need to submit originals for most of these — legible photocopies are typically accepted with Form I-130. Check the current I-130 instructions before filing.</p>
        </div>`,
      },
      {
        title: "Name discrepancy",
        htmlContent: `<p class="text-[14px] text-[#3a4f63] leading-[1.7] mb-[10px]">If the name on the citizenship document does not match the name used in the petition (e.g. due to marriage or legal name change), include legal proof of the name change:</p>
        <ul class="pl-[20px] mt-[6px] list-disc marker:text-[#6b8097]">
          <li class="text-[14px] text-[#3a4f63] leading-[1.65] mb-[6px] last:mb-0">Court order for name change</li>
          <li class="text-[14px] text-[#3a4f63] leading-[1.65] mb-[6px] last:mb-0">Marriage certificate showing the name change</li>
        </ul>`,
      },
      {
        title: "Key pitfall",
        htmlContent: `<div class="bg-[#fef8e8] border border-[#f0d98a] rounded-[9px] p-[13px_16px] mt-[14px]">
          <p class="text-[13px] text-[#8a6200] leading-[1.6] m-0"><strong class="text-[#6b4900] font-semibold">Avoid this:</strong> Do not submit an expired U.S. passport without also providing another valid proof. An expired passport alone may not be accepted — check the current I-130 filing instructions.</p>
        </div>`,
      },
    ],
  },
  doc_relationship: {
    title: "Relationship Evidence",
    sub: "Proof the marriage is genuine and entered in good faith",
    sourceType: "internal",
    sections: [
      {
        title: "Why this matters",
        htmlContent: `<p class="text-[14px] text-[#3a4f63] leading-[1.7] mb-[10px] last:mb-0">USCIS adjudicators will assess whether the marriage is bona fide — entered in good faith for a genuine life together, not primarily to obtain immigration benefits. Evidence across multiple categories significantly strengthens the case.</p>`,
      },
      {
        title: "Strong evidence categories",
        htmlContent: `<p class="text-[14px] text-[#3a4f63] leading-[1.7] mb-[10px]">Gather evidence across as many of these categories as possible:</p>
        <ul class="pl-[20px] mt-[6px] list-disc marker:text-[#6b8097]">
          <li class="text-[14px] text-[#3a4f63] leading-[1.65] mb-[6px] last:mb-0"><strong class="font-semibold text-[#1c2b3a]">Communication history</strong> — WhatsApp/call logs, screenshots of messages over time, email correspondence showing an ongoing relationship</li>
          <li class="text-[14px] text-[#3a4f63] leading-[1.65] mb-[6px] last:mb-0"><strong class="font-semibold text-[#1c2b3a]">Photos together</strong> — wedding photos, casual photos, photos across different dates and locations, family gatherings</li>
          <li class="text-[14px] text-[#3a4f63] leading-[1.65] mb-[6px] last:mb-0"><strong class="font-semibold text-[#1c2b3a]">Travel history</strong> — plane tickets, boarding passes, hotel bookings showing in-person visits</li>
          <li class="text-[14px] text-[#3a4f63] leading-[1.65] mb-[6px] last:mb-0"><strong class="font-semibold text-[#1c2b3a]">Shared finances</strong> — joint bank account statements, shared bills, financial transfers between spouses</li>
          <li class="text-[14px] text-[#3a4f63] leading-[1.65] mb-[6px] last:mb-0"><strong class="font-semibold text-[#1c2b3a]">Shared residence</strong> — lease agreements, utility bills, or mail showing a shared address</li>
          <li class="text-[14px] text-[#3a4f63] leading-[1.65] mb-[6px] last:mb-0"><strong class="font-semibold text-[#1c2b3a]">Family evidence</strong> — children together, family photos that show integration into each other's families</li>
          <li class="text-[14px] text-[#3a4f63] leading-[1.65] mb-[6px] last:mb-0"><strong class="font-semibold text-[#1c2b3a]">Affidavits</strong> — signed statements from family members or friends who personally know the couple and can attest to the relationship</li>
        </ul>`,
      },
      {
        title: "For the I-130 stage specifically",
        htmlContent: `<p class="text-[14px] text-[#3a4f63] leading-[1.7] mb-[10px]">At the USCIS I-130 filing stage, the petitioner submits the I-130 along with supporting evidence. A strong bona fide marriage package typically includes:</p>
        <ul class="pl-[20px] mt-[6px] list-disc marker:text-[#6b8097]">
          <li class="text-[14px] text-[#3a4f63] leading-[1.65] mb-[6px] last:mb-0">At least 3–5 photos showing the couple together across different occasions</li>
          <li class="text-[14px] text-[#3a4f63] leading-[1.65] mb-[6px] last:mb-0">Evidence of ongoing communication (call logs or chat screenshots with metadata)</li>
          <li class="text-[14px] text-[#3a4f63] leading-[1.65] mb-[6px] last:mb-0">Evidence of at least one in-person visit (travel documentation)</li>
          <li class="text-[14px] text-[#3a4f63] leading-[1.65] mb-[6px] last:mb-0">Affidavits if direct joint evidence is limited</li>
        </ul>
        <div class="bg-[#e8f1fb] border border-[#d0e4f7] rounded-[9px] p-[13px_16px] mt-[14px]">
          <p class="text-[13px] text-[#3a4f63] leading-[1.6] m-0">There is no single &quot;required&quot; evidence list from USCIS — the goal is to present a convincing overall picture of a genuine relationship. More varied evidence across categories is better than one large category alone.</p>
        </div>`,
      },
      {
        title: "What to avoid",
        htmlContent: `<ul class="pl-[20px] mt-[6px] list-disc marker:text-[#6b8097]">
          <li class="text-[14px] text-[#3a4f63] leading-[1.65] mb-[6px] last:mb-0">Do not submit hundreds of pages of chat history — curate and organize</li>
          <li class="text-[14px] text-[#3a4f63] leading-[1.65] mb-[6px] last:mb-0">Avoid submitting only one type of evidence (e.g. photos only)</li>
          <li class="text-[14px] text-[#3a4f63] leading-[1.65] mb-[6px] last:mb-0">Ensure affidavits are signed, dated, and specific about how the writer knows the couple</li>
          <li class="text-[14px] text-[#3a4f63] leading-[1.65] mb-[6px] last:mb-0">Do not use generic template affidavits — they are easily spotted and carry little weight</li>
        </ul>`,
      },
    ],
  },
  doc_prior_marriage: {
    title: "Prior Marriage Termination Proof",
    sub: "Required if either spouse had a previous marriage",
    sourceType: "internal",
    sections: [
      {
        title: "When this applies",
        htmlContent: `<p class="text-[14px] text-[#3a4f63] leading-[1.7] mb-[10px]">This document is required if either the petitioner or the beneficiary was previously married. USCIS must confirm that every prior marriage ended legally before the current marriage began.</p>
        <p class="text-[14px] text-[#3a4f63] leading-[1.7] mb-[10px] last:mb-0">If neither spouse has a prior marriage, this item does not apply to your case.</p>`,
      },
      {
        title: "Accepted termination documents",
        htmlContent: `<ul class="pl-[20px] mt-[6px] list-disc marker:text-[#6b8097]">
          <li class="text-[14px] text-[#3a4f63] leading-[1.65] mb-[6px] last:mb-0"><strong class="font-semibold text-[#1c2b3a]">Divorce decree or divorce certificate</strong> — final court order ending the prior marriage</li>
          <li class="text-[14px] text-[#3a4f63] leading-[1.65] mb-[6px] last:mb-0"><strong class="font-semibold text-[#1c2b3a]">Annulment order</strong> — court order declaring the marriage void</li>
          <li class="text-[14px] text-[#3a4f63] leading-[1.65] mb-[6px] last:mb-0"><strong class="font-semibold text-[#1c2b3a]">Death certificate</strong> — if the prior spouse is deceased</li>
        </ul>`,
      },
      {
        title: "Pakistan-specific — divorce",
        htmlContent: `<p class="text-[14px] text-[#3a4f63] leading-[1.7] mb-[10px]">In Pakistan, divorce proceedings vary by religious law. For Muslims, the process typically involves:</p>
        <ul class="pl-[20px] mt-[6px] list-disc marker:text-[#6b8097]">
          <li class="text-[14px] text-[#3a4f63] leading-[1.65] mb-[6px] last:mb-0"><strong class="font-semibold text-[#1c2b3a]">Talaq</strong> — the husband's pronouncement, registered with the Union Council, followed by a mandatory 90-day reconciliation period (iddat); Union Council issues a divorce certificate after this period</li>
          <li class="text-[14px] text-[#3a4f63] leading-[1.65] mb-[6px] last:mb-0"><strong class="font-semibold text-[#1c2b3a]">Khula</strong> — wife-initiated dissolution through Family Court; court issues the final decree</li>
          <li class="text-[14px] text-[#3a4f63] leading-[1.65] mb-[6px] last:mb-0"><strong class="font-semibold text-[#1c2b3a]">Judicial divorce</strong> — through Family Court; court issues the final decree</li>
        </ul>
        <div class="bg-[#fef8e8] border border-[#f0d98a] rounded-[9px] p-[13px_16px] mt-[14px]">
          <p class="text-[13px] text-[#8a6200] leading-[1.6] m-0"><strong class="text-[#6b4900] font-semibold">Important:</strong> For talaq, the divorce is not legally effective in Pakistan until the 90-day reconciliation period expires and the Union Council issues the divorce certificate. Ensure you have the final certificate, not just the initial notice.</p>
        </div>`,
      },
      {
        title: "Translation requirement",
        htmlContent: `<p class="text-[14px] text-[#3a4f63] leading-[1.7] mb-[10px] last:mb-0">All divorce decrees and termination documents in Urdu or other non-English languages must be accompanied by a full certified English translation.</p>`,
      },
    ],
  },
  doc_translations: {
    title: "Translations",
    sub: "Certified English translations of non-English documents",
    sourceType: "internal",
    sections: [
      {
        title: "USCIS translation requirement",
        htmlContent: `<p class="text-[14px] text-[#3a4f63] leading-[1.7] mb-[10px] last:mb-0">USCIS requires that every document not in English be accompanied by a full certified English translation. This applies to all stages — I-130, NVC, and consular.</p>`,
      },
      {
        title: 'What "certified translation" means',
        htmlContent: `<p class="text-[14px] text-[#3a4f63] leading-[1.7] mb-[10px]">USCIS defines a certified translation as one accompanied by a signed statement from the translator certifying:</p>
        <ul class="pl-[20px] mt-[6px] list-disc marker:text-[#6b8097] mb-[10px]">
          <li class="text-[14px] text-[#3a4f63] leading-[1.65] mb-[6px] last:mb-0">They are competent to translate from the source language to English</li>
          <li class="text-[14px] text-[#3a4f63] leading-[1.65] mb-[6px] last:mb-0">The translation is accurate and complete to the best of their ability</li>
        </ul>
        <p class="text-[14px] text-[#3a4f63] leading-[1.7] mb-[10px] last:mb-0">The translator does not need to be a licensed professional or a notary — but they must not be the applicant or petitioner themselves.</p>`,
      },
      {
        title: "Documents that need translation",
        htmlContent: `<ul class="pl-[20px] mt-[6px] list-disc marker:text-[#6b8097]">
          <li class="text-[14px] text-[#3a4f63] leading-[1.65] mb-[6px] last:mb-0"><strong class="font-semibold text-[#1c2b3a]">Nikah Nama</strong> — typically in Urdu; full translation required</li>
          <li class="text-[14px] text-[#3a4f63] leading-[1.65] mb-[6px] last:mb-0"><strong class="font-semibold text-[#1c2b3a]">NADRA MRC</strong> — bilingual, but full translation of the Urdu portions is recommended to avoid questions</li>
          <li class="text-[14px] text-[#3a4f63] leading-[1.65] mb-[6px] last:mb-0"><strong class="font-semibold text-[#1c2b3a]">Birth certificate</strong> — if issued in Urdu or regional language</li>
          <li class="text-[14px] text-[#3a4f63] leading-[1.65] mb-[6px] last:mb-0"><strong class="font-semibold text-[#1c2b3a]">Divorce decree</strong> — if in Urdu or Sindhi etc.</li>
          <li class="text-[14px] text-[#3a4f63] leading-[1.65] mb-[6px] last:mb-0"><strong class="font-semibold text-[#1c2b3a]">Any other civil documents</strong> submitted to USCIS or the NVC</li>
        </ul>`,
      },
      {
        title: "Practical tips",
        htmlContent: `<ul class="pl-[20px] mt-[6px] list-disc marker:text-[#6b8097]">
          <li class="text-[14px] text-[#3a4f63] leading-[1.65] mb-[6px] last:mb-0">Use a translation service that issues a formal certification letter on their letterhead — it is more persuasive than a plain self-attestation</li>
          <li class="text-[14px] text-[#3a4f63] leading-[1.65] mb-[6px] last:mb-0">Keep the translated document together with the original — submit them as a pair</li>
          <li class="text-[14px] text-[#3a4f63] leading-[1.65] mb-[6px] last:mb-0">Do not translate only part of a document — the entire document must be translated</li>
        </ul>`,
      },
    ],
  },
  doc_passport_photos: {
    title: "Passport Photos",
    sub: "Required at consular and visa application stages",
    sourceType: "internal",
    sections: [
      {
        title: "When these are needed",
        htmlContent: `<p class="text-[14px] text-[#3a4f63] leading-[1.7] mb-[10px]">Passport photos are <strong class="font-semibold text-[#1c2b3a]">not required</strong> for the USCIS I-130 petition filing. They are required at later stages:</p>
        <ul class="pl-[20px] mt-[6px] list-disc marker:text-[#6b8097] mb-[10px]">
          <li class="text-[14px] text-[#3a4f63] leading-[1.65] mb-[6px] last:mb-0">The <strong class="font-semibold text-[#1c2b3a]">DS-260 immigrant visa application</strong> (online form submitted to the NVC)</li>
          <li class="text-[14px] text-[#3a4f63] leading-[1.65] mb-[6px] last:mb-0">At the <strong class="font-semibold text-[#1c2b3a]">consular interview</strong>, the U.S. Embassy in Islamabad typically requires passport-size photos</li>
        </ul>
        <p class="text-[14px] text-[#3a4f63] leading-[1.7] mb-[10px] last:mb-0">Gather them closer to those stages rather than now.</p>`,
      },
      {
        title: "U.S. visa photo specifications",
        htmlContent: `<ul class="pl-[20px] mt-[6px] list-disc marker:text-[#6b8097]">
          <li class="text-[14px] text-[#3a4f63] leading-[1.65] mb-[6px] last:mb-0">2 × 2 inches (51 × 51 mm)</li>
          <li class="text-[14px] text-[#3a4f63] leading-[1.65] mb-[6px] last:mb-0">White or off-white plain background</li>
          <li class="text-[14px] text-[#3a4f63] leading-[1.65] mb-[6px] last:mb-0">Taken within the last 6 months</li>
          <li class="text-[14px] text-[#3a4f63] leading-[1.65] mb-[6px] last:mb-0">Full front view, neutral expression, eyes open</li>
          <li class="text-[14px] text-[#3a4f63] leading-[1.65] mb-[6px] last:mb-0">No glasses (as of 2016 U.S. visa photo rules)</li>
          <li class="text-[14px] text-[#3a4f63] leading-[1.65] mb-[6px] last:mb-0">Head coverings only for religious reasons, and must not obscure the face</li>
        </ul>
        <div class="bg-[#e8f1fb] border border-[#d0e4f7] rounded-[9px] p-[13px_16px] mt-[14px]">
          <p class="text-[13px] text-[#3a4f63] leading-[1.6] m-0">The DS-260 online application accepts a digital photo upload — check the U.S. State Department's photo upload tool and specifications at the time of filing.</p>
        </div>`,
      },
    ],
  },
};
