// utils/embassyGuidance.ts

export interface EmbassyGuidance {
  id: string;
  name: string;
  country: string;
  submissionMethods: SubmissionMethod[];
  prerequisites: string[];
  labelingInstructions: string[];
  proofOfSubmission: string[];
  contactInfo?: {
    email?: string;
    phone?: string;
    address?: string;
  };
  specialNotes: string[];
}

export interface SubmissionMethod {
  type: "physical" | "email" | "online_portal" | "courier";
  name: string;
  description: string;
  requirements: string[];
  processingTime: string;
  trackingAvailable: boolean;
}

export const EMBASSY_GUIDANCE_DATA: Record<string, EmbassyGuidance> = {
  islamabad: {
    id: "islamabad",
    name: "U.S. Embassy Islamabad",
    country: "Pakistan",
    submissionMethods: [
      {
        type: "physical",
        name: "In-Person Drop-off",
        description: "Submit documents in person at the designated drop-off location",
        requirements: [
          "Valid appointment confirmation",
          "Original passport",
          "Completed submission checklist",
          "All required documents in original and copy form",
        ],
        processingTime: "2-4 weeks",
        trackingAvailable: false,
      },
      {
        type: "courier",
        name: "Authorized Courier Service",
        description: "Use TCS or other authorized courier services to submit documents",
        requirements: [
          "Properly packaged documents",
          "Completed cover sheet",
          "Return shipping label",
          "Proof of payment for courier fees",
        ],
        processingTime: "1-3 weeks",
        trackingAvailable: true,
      },
    ],
    prerequisites: [
      "Create account on the embassy website",
      "Complete any required online forms",
      "Pay applicable fees before submission",
      "Schedule appointment if required",
    ],
    labelingInstructions: [
      "Include case number prominently on all packages",
      "Use waterproof packaging for protection",
      "Separate original documents from copies",
      "Include a detailed packing slip",
    ],
    proofOfSubmission: [
      "Retain courier tracking number",
      "Keep receipt from in-person submission",
      "Screenshot online submission confirmation",
      "Photograph all submitted documents before sending",
    ],
    contactInfo: {
      email: "islamabadacs@state.gov",
      phone: "+92-51-201-4000",
      address: "U.S. Embassy, Diplomatic Enclave, Ramna 5, Islamabad, Pakistan",
    },
    specialNotes: [
      "Original documents may be required for certain cases",
      "Allow extra time during peak seasons",
      "Check embassy website for any temporary changes to procedures",
    ],
  },
  karachi: {
    id: "karachi",
    name: "U.S. Consulate Karachi",
    country: "Pakistan",
    submissionMethods: [
      {
        type: "physical",
        name: "In-Person Drop-off",
        description: "Submit documents in person at the consulate",
        requirements: [
          "Valid appointment confirmation",
          "Original passport",
          "Completed submission checklist",
        ],
        processingTime: "2-5 weeks",
        trackingAvailable: false,
      },
    ],
    prerequisites: [
      "Complete required forms online",
      "Pay fees via designated payment method",
      "Schedule mandatory appointment",
    ],
    labelingInstructions: [
      "Case number must be clearly visible",
      "Use sturdy, tamper-evident packaging",
      "Include return address clearly",
    ],
    proofOfSubmission: [
      "Keep submission receipt",
      "Take photos of all documents before submission",
      "Record submission date and time",
    ],
    contactInfo: {
      email: "karachiacs@state.gov",
      phone: "+92-21-221-2000",
      address: "U.S. Consulate, Plot 28, Shahra-e-Faisal, Karachi, Pakistan",
    },
    specialNotes: [
      "Limited capacity for document submissions",
      "Appointments fill up quickly, book early",
      "No electronic devices allowed in the facility",
    ],
  },
  lahore: {
    id: "lahore",
    name: "U.S. Consulate Lahore",
    country: "Pakistan",
    submissionMethods: [
      {
        type: "courier",
        name: "Designated Courier Service",
        description: "Use approved courier service for document submission",
        requirements: [
          "Properly sealed and labeled package",
          "Payment of courier fees",
          "Completed submission form",
        ],
        processingTime: "1-3 weeks",
        trackingAvailable: true,
      },
    ],
    prerequisites: [
      "Register on consulate portal",
      "Complete submission form online",
      "Pay required fees",
    ],
    labelingInstructions: [
      "Use the tracking ID provided by the system",
      "Package must be sealed and unmarked",
      "Include reference number on exterior",
    ],
    proofOfSubmission: [
      "Keep tracking number for monitoring",
      "Save online submission confirmation",
      "Photocopy all documents before sending",
    ],
    contactInfo: {
      email: "lahoreacs@state.gov",
      phone: "+92-42-3577-2100",
      address: "U.S. Consulate, 20 Nawaz Sharif Road, Gulberg III, Lahore, Pakistan",
    },
    specialNotes: [
      "Courier service is the primary submission method",
      "Original documents may be required in some cases",
      "Processing times may vary based on document complexity",
    ],
  },
};
