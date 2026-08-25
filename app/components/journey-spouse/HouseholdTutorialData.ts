export interface HouseholdTutorialStep {
  label: string;
  heading: string;
  instruction: string;
  note: string | null;
  media?: { type: "img" | "video"; src: string };
  vlabel: string;
  visual: string; // HTML string for mock UI
}

export const HOUSEHOLD_TUTORIAL_STEPS: HouseholdTutorialStep[] = [
  {
    label: "Step 1 of 6",
    heading: "Open CEAC and sign in",
    instruction:
      "Sign in to CEAC at <strong>ceac.state.gov</strong> using your NVC Case Number and Invoice ID from the Welcome Letter.",
    note: null,
    media: { type: "img", src: "/assets/images/ir1-journey/c2_step4/01-case-into-ceac.png" },
    vlabel: "CEAC Login",
    visual: `
      <div class="mock-card">
        <div class="mock-title">CEAC, Immigrant Visa Application</div>
        <div class="mock-field"><div class="mock-field-label">NVC Case Number</div><div class="mock-field-input">ISL2026XXXXXX</div></div>
        <div class="mock-field"><div class="mock-field-label">Invoice ID Number</div><div class="mock-field-input">••••••••••••••••</div></div>
        <div class="mock-btn">Sign In</div>
      </div>`,
  },
  {
    label: "Step 2 of 6",
    heading: "Go to the affidavit support area",
    instruction:
      "After signing in, navigate to the <strong>Affidavit of Support</strong> or sponsorship section inside your CEAC case. This is where sponsorship participants are managed.",
    note: null,
    media: { type: "img", src: "/assets/images/ir1-journey/c2_step7/locate_affidavit.png" },
    vlabel: "CEAC Case Sections",
    visual: `
      <div class="mock-card">
        <div class="mock-title">Your CEAC Case</div>
        <div class="mock-row">DS-260 Application <span class="mock-badge">Complete</span></div>
        <div class="mock-row" style="background:rgba(47,111,212,0.12);border-radius:6px;padding:7px 10px;font-weight:600;color:#2f6fd4;border-color:transparent">→ Affidavit of Support / Sponsorship</div>
        <div class="mock-row">Documents</div>
        <div class="mock-row">Interview Appointment</div>
      </div>`,
  },
  {
    label: "Step 3 of 6",
    heading: "Choose to add a household member or joint sponsor",
    instruction:
      "Inside the sponsorship section, select the appropriate option to add a participant. The two options, household member and joint sponsor, are handled through the same CEAC area but have different implications.",
    note: "Remember: joint sponsors do not require relationship-proof documents. Household members do, the checklist below will generate the correct items once you define who they are.",
    vlabel: "Add Participant",
    visual: `
      <div class="mock-card">
        <div class="mock-title">Add Sponsorship Participant</div>
        <div style="display:flex;flex-direction:column;gap:8px;margin-top:8px">
          <div style="padding:10px 14px;border:1.5px solid #d0e4f7;border-radius:10px;font-size:13px;color:#3a4f63">Add a Joint Sponsor</div>
          <div style="padding:10px 14px;background:rgba(47,111,212,0.12);border:1.5px solid rgba(47,111,212,0.22);border-radius:10px;font-size:13px;font-weight:600;color:#2f6fd4">Add a Household Member</div>
        </div>
      </div>`,
  },
  {
    label: "Step 4 of 6",
    heading: "Enter the participant's details",
    instruction:
      "Fill in the required personal information for the participant, name, date of birth, address, and their relationship to the petitioner. Complete all required fields before saving.",
    note: null,
    media: { type: "img", src: "/assets/images/ir1-journey/c2_step7/Participant's_details.png" },
    vlabel: "Participant Entry Form",
    visual: `
      <div class="mock-card">
        <div class="mock-title">Participant Information</div>
        <div class="mock-field"><div class="mock-field-label">Full Legal Name</div><div class="mock-field-input" style="color:#6b8097">Enter name</div></div>
        <div class="mock-field"><div class="mock-field-label">Date of Birth</div><div class="mock-field-input" style="color:#6b8097">MM / DD / YYYY</div></div>
        <div class="mock-field"><div class="mock-field-label">Relationship to Petitioner</div><div class="mock-field-input" style="color:#6b8097">Select relationship</div></div>
        <div class="mock-btn">Save Participant</div>
      </div>`,
  },
  {
    label: "Step 5 of 6",
    heading: "Confirm the participant is listed correctly",
    instruction:
      "After saving, verify the participant appears in the sponsorship summary with the correct name and relationship. If you see an error, edit before continuing.",
    note: null,
    media: { type: "img", src: "/assets/images/ir1-journey/c2_step7/confirm_details.png" },
    vlabel: "Sponsorship Summary",
    visual: `
      <div class="mock-card">
        <div class="mock-title">Sponsorship Participants</div>
        <div class="mock-row">Petitioner (Primary Sponsor) <span class="mock-badge">Listed</span></div>
        <div class="mock-row">Household Member 1, Spouse <span class="mock-badge">Added</span></div>
      </div>`,
  },
  {
    label: "Step 6 of 6",
    heading: "Return here to prepare relationship proof",
    instruction:
      "Once the participant is confirmed in CEAC, return to this step. Use the <strong>scenario builder</strong> to select each household member's relationship, Rahvana will generate the exact relationship-proof checklist for you.",
    note: null,
    media: { type: "img", src: "/assets/images/ir1-journey/c2_step7/back_to_rahvana.png" },
    vlabel: "Return to Rahvana",
    visual: `
      <div style="background:#e8f5ef;border:1px solid #a8d9be;border-radius:10px;padding:16px 18px;display:flex;align-items:flex-start;gap:12px">
        <div style="width:30px;height:30px;border-radius:50%;background:#15744f;display:flex;align-items:center;justify-content:center;flex-shrink:0">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <div>
          <div style="font-size:13px;font-weight:600;color:#15744f;margin-bottom:3px">CEAC participant added</div>
          <div style="font-size:12px;color:#3a4f63;line-height:1.5">Return to the scenario builder on this page. Select each household member's relationship to generate the proof checklist.</div>
        </div>
      </div>`,
  },
];

export interface HouseholdGuide {
  title: string;
  intro: string;
  sections: { title: string; body: string }[];
}

export const HOUSEHOLD_GUIDE_CONTENT: Record<string, HouseholdGuide> = {
  "birth-cert-hh": {
    title: "Birth Certificate, Household Member",
    intro: "Proves the parent-child relationship between the household member and the petitioner.",
    sections: [
      {
        title: "What this is",
        body: "<p>The official birth certificate of the household member (the child). For Pakistan cases, this is ideally the NADRA Computerized Birth Registration Certificate (CBRC).</p>",
      },
      {
        title: "Why it is needed",
        body: "<p>When a child's income is being combined with the petitioner's through Form I-864A, the parent-child relationship must be established. The birth certificate naming the petitioner as a parent does this.</p>",
      },
      {
        title: "Translation",
        body: "<p>If in Urdu, a certified English translation must accompany the original.</p>",
      },
      {
        title: "Watch out for",
        body: '<div class="note-box"><p>Ensure the name on the birth certificate matches the name used in CEAC and on other filed documents. Discrepancies should be addressed proactively.</p></div>',
      },
    ],
  },
  "birth-cert-sponsor": {
    title: "Birth Certificate of Petitioner / Sponsor",
    intro:
      "Used when the household member is a parent or sibling of the petitioner, to show the shared family link.",
    sections: [
      {
        title: "What this is",
        body: "<p>The petitioner's own birth certificate. In a parent or sibling household-member scenario, this document helps establish the family relationship between the petitioner and the household member.</p>",
      },
      {
        title: "For parent relationship",
        body: "<p>Shows that the household member (parent) is listed on the petitioner's birth certificate, establishing the parent-child link.</p>",
      },
      {
        title: "For sibling relationship",
        body: "<p>The petitioner's birth certificate, combined with the household member's birth certificate, can show shared parentage when both list the same parents.</p>",
      },
    ],
  },
  "marriage-cert-hh": {
    title: "Marriage Certificate, Household Member",
    intro: "Establishes the spousal relationship between the household member and the petitioner.",
    sections: [
      {
        title: "What this is",
        body: "<p>The civil marriage certificate proving that the household member is legally married to the petitioner. For Pakistan cases, this is the Nikah Nama and/or NADRA MRC.</p>",
      },
      {
        title: "Why it is needed",
        body: "<p>When the petitioner's spouse is acting as a household member contributing income through Form I-864A, the marriage must be documented to support that household connection.</p>",
      },
      {
        title: "Translation",
        body: "<p>The Nikah Nama (in Urdu) requires a full certified English translation.</p>",
      },
    ],
  },
  "shared-residence": {
    title: "Proof of Shared Residence",
    intro:
      "Demonstrates that the household member and the petitioner share the same household address.",
    sections: [
      {
        title: "What this is",
        body: "<p>Documents showing a shared residential address between the petitioner and the household member. This reinforces the household income contribution basis.</p>",
      },
      {
        title: "Accepted examples",
        body: "<ul><li>Lease agreement naming both parties</li><li>Utility bills addressed to the same household</li><li>Bank statements or tax returns showing the same address</li><li>Official correspondence addressed to both at the same address</li></ul>",
      },
      {
        title: "Why it matters",
        body: '<div class="info-box"><p>The household member concept in I-864A depends on a genuine shared household. Residence proof strengthens the basis for including their income.</p></div>',
      },
    ],
  },
  "id-doc-hh": {
    title: "Identity Document, Household Member",
    intro: "Confirms the identity of the household member named in the I-864A.",
    sections: [
      {
        title: "What to provide",
        body: "<p>A government-issued identity document for the household member. For Pakistan cases, this is typically the CNIC (Computerized National Identity Card) or a passport biographic page.</p>",
      },
      {
        title: "Consistency",
        body: "<p>The name on the identity document must match exactly the name used in CEAC and on the I-864A form. Any discrepancy should be explained or corrected.</p>",
      },
    ],
  },
  "family-link": {
    title: "Supporting Family-Link Evidence",
    intro:
      "Used when the household member's relationship is more distant or non-standard, to establish the household connection.",
    sections: [
      {
        title: "When this applies",
        body: "<p>For household members who are other relatives (aunt, uncle, cousin, non-relative household member), standard civil records like birth certificates may not directly show the link. Additional supporting evidence helps.</p>",
      },
      {
        title: "What to include",
        body: "<ul><li>Family tree documentation or affidavit of relationship</li><li>Any relevant civil records showing the family connection</li><li>Shared address or financial co-dependence records</li></ul>",
      },
      {
        title: "Note",
        body: '<div class="note-box"><p>For non-standard relationships, consulting an immigration attorney before relying on household member income is strongly recommended.</p></div>',
      },
    ],
  },
};
