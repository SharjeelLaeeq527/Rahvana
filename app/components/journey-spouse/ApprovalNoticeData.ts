export const APPROVAL_NOTICE_DATA = {
  eyebrow: {
    chapter: "Chapter 1 · USCIS Petition Filing",
    step: "Receive Approval Notice (I-797)",
  },
  title: "Receive Approval Notice (I-797)",
  description:
    "Your I-130 approval notice confirms that USCIS approved the petition. Save this notice, keep the original safe, and start preparing for NVC while you wait for the next contact.",
  chips: [
    { label: "Petitioner", type: "role" },
    { label: "Mail or online account", type: "channel" },
    { label: "USCIS approved", type: "stage" },
  ],
  launchModule: {
    eyebrow: "USCIS milestone · petition approved",
    heading: "Your petition has moved past the USCIS stage",
    copy: "After USCIS approves the I-130, the approved petition is sent forward for National Visa Center processing. This page helps you save the approval notice and get ready for what usually comes next.",
    badge: "Approved",
  },
  metrics: [
    {
      label: "Notice type",
      value: "Form I-797",
      sub: "Approval notice from USCIS",
    },
    {
      label: "Stage reached",
      value: "USCIS complete",
      sub: "NVC should be next",
    },
    {
      label: "What to save",
      value: "Digital + original",
      sub: "Keep a backup copy too",
    },
    {
      label: "Next contact",
      value: "NVC welcome",
      sub: "Case creation comes after transfer",
    },
  ],
  savePanel: {
    title: "Save Your Approval Notice",
    copy: "Keep one digital copy inside Rahvana, keep the physical original in a safe place, and keep a backup copy for your records.",
    tag: "Save first",
    uploadHead: "Upload a copy to Rahvana",
    uploadCopy:
      "Save the approval notice here so it stays connected to the roadmap and is easier to find later during NVC preparation.",
    savedState: {
      title: "Approval notice saved",
    },
    safeItems: [
      {
        title: "Keep the original safe",
        copy: "Store the paper notice with your core immigration records.",
        icon: "check",
      },
      {
        title: "Keep a backup copy",
        copy: "A duplicate PDF or printed copy makes later paperwork easier.",
        icon: "file",
      },
      {
        title: "Save the approval date",
        copy: "You may want it later when organizing the full case timeline.",
        icon: "calendar",
      },
    ],
  },
  timeline: {
    title: "What Happens Next",
    copy: "USCIS approval does not end the immigration journey. The next handoff is usually to the National Visa Center.",
    tag: "Next phase",
    items: [
      {
        title: "USCIS forwards the approved petition",
        copy: "After approval, USCIS sends the approved petition to the National Visa Center for immigrant visa pre-processing.",
      },
      {
        title: "NVC creates the case",
        copy: "Once the petition reaches NVC and the case is entered into its system, the case is prepared for the next visa-processing steps.",
      },
      {
        title: "You receive the NVC Welcome Letter",
        copy: "The Welcome Letter is the signal that the case is now in the NVC stage and ready for fee, CEAC, and document-preparation work.",
      },
    ],
    infoStrip:
      "Use current NVC timeframes for timing context rather than relying on one fixed wait estimate.",
  },
  prepCards: {
    title: "Get Ready for NVC",
    copy: "You do not need to stay idle while waiting. These are the highest-value prep areas to start now.",
    tag: "Prepare ahead",
    cards: [
      {
        title: "Civil documents",
        copy: "Make sure birth, marriage, passport, and translation records are clean and ready for the NVC stage.",
        type: "green",
        icon: "book",
      },
      {
        title: "Affidavit of support",
        copy: "Review sponsor income, tax returns, and household details so the financial phase is less stressful later.",
        type: "purple",
        icon: "dollar",
      },
      {
        title: "Contact details",
        copy: "Make sure petitioner and beneficiary email access stays active so future NVC messages are not missed.",
        type: "amber",
        icon: "mail",
      },
    ],
    actions: [
      { label: "What happens at NVC?", type: "info" },
      { label: "Continue to NVC preparation", type: "next" },
    ],
  },
  // footerNote: "USCIS approval is a major milestone. Save the notice, keep the original safe, and use the waiting period to get ready for the NVC stage.",
  modal: {
    title: "Save approval notice details",
    sub: "Add the core details so this milestone stays connected to the rest of your roadmap.",
    helper:
      "For IR-1, the priority date is useful to save for your records, but it is usually not the main driver of the next stage.",
  },
  guideSteps: [
    {
      label: "Step 1, Approval confirmed",
      title: "The I-797 tells you USCIS approved the petition",
      copy: "This notice confirms the I-130 petition was approved. It is a milestone record that you should save and keep with your immigration file.",
      head: "Approval notice",
      media: {
        type: "image",
        src: "/assets/images/ir1-journey/c1_step13/approvalnotice.png",
        alt: "Approval notice example",
      },
      pills: ["Save a digital copy", "Keep the original safe"],
      note: "This is a USCIS milestone notice. The next major handoff is usually to the National Visa Center.",
    },
    {
      label: "Step 2, Save the important details",
      title: "Keep the approval date and receipt number easy to find",
      copy: "Those details help you preserve the case timeline and make later recordkeeping easier. You can save them inside Rahvana now.",
      head: "Case details",
      media: {
        type: "video",
        src: "/assets/videos/ir1-journey/c1_step13/savedetails.mp4",
      },
      pills: ["Approval date", "Receipt number", "Priority date if shown"],
      note: "For IR-1, save the priority date as a record, but do not treat it like the main wait-list driver.",
    },
    {
      label: "Step 3, Get ready for NVC",
      title: "The next stage is usually NVC case creation",
      copy: "After USCIS forwards the approved petition, NVC creates the case and later sends the Welcome Letter. Use this time to prepare your next-stage documents and financial records.",
      head: "What comes next",
      media: {
        type: "image",
        src: "/assets/images/ir1-journey/c1_step13/flowchart.png",
        alt: "Approval to NVC flowchart",
        frame: false,
      },
      pills: ["Civil documents", "Financial prep", "Contact details"],
      note: "Use live NVC timeframes for timing context instead of assuming one fixed waiting window.",
    },
  ],
};
