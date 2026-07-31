export const POLIO_CERTIFICATE_DATA = {
  eyebrow: {
    chapter: "Chapter 3 · Medical & Interview",
    step: "Step 2, Polio Vaccination Certificate",
  },
  title: "Obtain Polio Vaccination Certificate",
  description:
    "Pakistan-origin applicants must obtain a polio vaccination certificate before the consular interview. This is a required compliance step for all immigrant visa applicants.",
  chips: [
    { label: "Medical Compliance", type: "med" },
    { label: "Required", type: "req" },
    { label: "Rahvana Guide", type: "guide" },
  ],
  launchModule: {
    eyebrow: "Rahvana Polio Vaccination Guide",
    heading: "Follow the step-by-step guide to obtain your certificate",
    cues: [
      "Where to get the polio vaccination",
      "What the certificate looks like and what to verify",
      "Timing relative to your medical exam date",
      "Common mistakes and how to avoid them",
    ],
    buttonLabels: {
      initial: "Open Polio Vaccination Guide",
      completed: "Guide Completed",
    },
    note: {
      initial: "Opens the guide in a focused view",
      completed: "Use the checklist below to track your progress",
    },
  },
  returnNote: {
    title: "✓ Guide completed",
    sub: "Use the checklist below to mark your polio certificate as obtained once you have it in hand.",
  },
  completionCard: {
    title: "Mark your progress",
    items: [
      "Vaccination received at an approved site",
      "Polio certificate obtained with correct details",
      "Original certificate ready to bring to medical exam",
    ],
  },
  disclaimer:
    "Rahvana provides structured guidance only. Confirm current polio documentation requirements directly with your embassy before attending the medical exam.",
  guideSteps: [
    {
      label: "Step 1 of 5",
      heading: "What is the polio vaccination requirement?",
      instruction:
        "Pakistan is a polio-endemic country. All immigrant visa applicants from Pakistan must receive an oral polio vaccine dose and obtain a certificate before their consular medical exam.",
      vLabel: "Requirement Overview",
      visual: {
        title: "Why this is required",
        sub: "The U.S. requires polio vaccination documentation from applicants from polio-endemic countries. This is administered at an approved vaccination site, not a general clinic.",
      },
    },
    {
      label: "Step 2 of 5",
      heading: "Where to get vaccinated",
      instruction:
        "Polio vaccinations for visa purposes must be obtained from an approved government vaccination post or official WHO-designated site. Do not use a private clinic unless it is specifically on the approved list.",
      vLabel: "Vaccination Sites",
      note: "Do not go to a general doctor or hospital for this, you must use a government-approved site for the certificate to be accepted.",
      visual: {
        title: "Approved Vaccination Sites",
        sub: "Government immunization centres in major cities typically administer this vaccine and issue the official certificate. Contact your local district health office or check with your panel physician for the nearest site.",
      },
    },
    {
      label: "Step 3 of 5",
      heading: "What the certificate looks like",
      instruction:
        "The official polio vaccination certificate is typically a printed card or letter issued at the vaccination site. It should include your name, vaccination date, and the type of vaccine received.",
      vLabel: "Certificate Format",
      visual: {
        title: "Certificate Details to Verify",
        items: [
          "Your full legal name (matching passport)",
          "Date of vaccination",
          "Vaccine type, oral polio vaccine (OPV)",
          "Official stamp or signature",
        ],
      },
    },
    {
      label: "Step 4 of 5",
      heading: "Timing, when to get vaccinated",
      instruction:
        "Get your polio vaccination at least a few days before your medical exam appointment so you can bring the original certificate to the exam. The panel physician will record it as part of your medical packet.",
      vLabel: "Timing Guidance",
      note: "Do not get vaccinated the same day as the medical exam unless your physician specifically confirms this is acceptable.",
      visual: {
        title: "Recommended Timing",
        sub: "Vaccinate → Receive certificate → Bring original to medical exam. Budget at least 1-3 days between vaccination and your scheduled medical exam date.",
      },
    },
    {
      label: "Step 5 of 5",
      heading: "Bring the original certificate to your medical exam",
      instruction:
        "Bring the original polio vaccination certificate to your medical exam appointment. Your panel physician will review it and include documentation in the sealed medical packet sent to the embassy.",
      vLabel: "What to Bring",
      visual: {
        completed: true,
        title: "Guide complete",
        sub: "Return to this step and mark the polio certificate as obtained once you have it in hand.",
      },
    },
  ],
};
