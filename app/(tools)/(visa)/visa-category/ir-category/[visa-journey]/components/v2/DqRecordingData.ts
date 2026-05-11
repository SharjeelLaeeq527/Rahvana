export const DQ_RECORDING_DATA = {
  // eyebrow: {
  //   chapter: "Chapter 2 · NVC / CEAC Processing",
  //   step: "Step 11 — Documentary Qualification"
  // },
  title: "Record Documentary Qualification",
  description: "Your case has been documentarily qualified — NVC has accepted your package. Record your DQ date to activate scheduling tracking and sync your dashboard.",
  chips: [
    { label: "Major Milestone", type: "milestone" },
    { label: "Tracking Active", type: "track" },
    { label: "Dashboard Update", type: "dash" }
  ],
  milestoneBanner: {
    eyebrow: "NVC — Documentary Qualification Received",
    title: "Your documents have been accepted by NVC",
    sub: "This is a significant milestone. Your case is now documentarily complete and eligible for interview scheduling at your designated post."
  },
  postScheduling: {
    "Islamabad": { 
      official: "Mar 2024", 
      est: "Steady movement", 
      estSub: "Islamabad is processing cases from approximately March 2024 DQ. Movement has been steady in recent months." 
    },
    "Karachi": { 
      official: "Feb 2024", 
      est: "Moderate movement", 
      estSub: "Karachi is processing cases from approximately February 2024 DQ. Recent scheduling pace has been moderate." 
    },
    "Lahore": { 
      official: "Apr 2024", 
      est: "Steady movement", 
      estSub: "Lahore is processing cases from approximately April 2024 DQ. Scheduling pace appears stable." 
    },
    "Other": { 
      official: "Varies by post", 
      est: "Check your post", 
      estSub: "Scheduling varies significantly by post. Check the State Department bulletin for your specific consulate." 
    }
  },
  disclaimer: "Official scheduling status reflects the State Department Visa Bulletin and NVC scheduling data — verify directly at travel.state.gov. Rahvana estimates are trend projections only."
};
