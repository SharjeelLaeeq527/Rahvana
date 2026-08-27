import React from "react";
import { Building2, ClipboardList } from "lucide-react";

export const POLICE_CLEARANCE_DATA = {
  eyebrow: {
    chapter: "Chapter 3 · Medical & Interview",
    step: "Step 3, Police Clearance Certificate",
  },
  title: "Obtain Fresh Police Clearance Certificate",
  description:
    "A fresh police clearance certificate (PCC) is required for the consular interview. Apply now, this can take several weeks and must be tracked until received.",
  chips: [
    { label: "PCC Required", type: "pcc" },
    { label: "Tracking", type: "track" },
    { label: "Pending Until Received", type: "pending" },
  ],
  decisionModule: {
    eyebrow: "Police Clearance Certificate",
    heading: "How would you like to apply for your PCC?",
    paths: [
      {
        id: "service",
        icon: <Building2 size={28} className="text-purple-400" />,
        title: "Rahvana submits the application",
        sub: "Rahvana handles the application submission on your behalf",
        note: "Sindh only · You must still collect the certificate",
      },
      {
        id: "guide",
        icon: <ClipboardList size={28} className="text-blue-400" />,
        title: "I'll apply myself",
        sub: "Follow the step-by-step guide to apply for the PCC yourself",
      },
    ],
  },
  trackingCard: {
    title: "Application Tracking",
    fields: [
      { id: "receipt", label: "Receipt / Reference Number" },
      { id: "track", label: "Tracking Number (if any)" },
      { id: "date", label: "Application Date" },
    ],
    buttonLabel: "Save Application Details",
  },
  pendingCard: {
    title: "PCC still pending, dashboard reminder active",
    body: "Your police certificate application is recorded but the certificate has not yet been received. This reminder will stay on your dashboard until you mark it as received below.\n\nFollow up with the police department regularly to check status. Don't wait until the last moment.",
    buttonLabel: "Mark Certificate as Received →",
  },
  receivedCard: {
    title: "Fresh PCC received, save to Document Vault",
    body: "Your police clearance certificate has been received. Save it to the Document Vault for easy access during the interview and upload stages.",
    buttonLabel: "Save PCC to Document Vault",
    vaultUrl: "/document-vault",
  },
  disclaimer:
    "Rahvana's application submission service is available for Sindh only. Rahvana submits the application but the user must collect the certificate. Always verify PCC requirements with your consulate.",
  serviceSteps: [
    {
      label: "Step 1 of 3",
      heading: "Rahvana submits your PCC application",
      instruction:
        "This service is available for Sindh residents only. Rahvana will handle the application submission. You must still pick up the certificate yourself when ready.",
      info: "To proceed, Rahvana needs your details. Fill in the tracking section on the main page after submission to store your receipt number.",
      warn: "Important: This service is for Sindh residents only. If you reside in another province, use the self-application guide instead.",
      nav: { next: "My application has been submitted →" },
    },
    {
      label: "Step 2 of 3",
      heading: "What happens after submission",
      instruction:
        "After Rahvana submits your application, you will receive a receipt number. Use that number to track your application status with the relevant police department.",
      info: "Keep the receipt number safe. You will need it to follow up with the police department and eventually collect your certificate.",
      nav: { back: true, next: "Save tracking details →" },
    },
    {
      label: "Step 3 of 3",
      heading: "Save your receipt and track actively",
      instruction:
        "Return to the main page and save your receipt number and application date. Rahvana will keep a reminder on your dashboard until you confirm the certificate is received.",
      info: "PCCs typically take several weeks. Follow up periodically. Do not wait, check status proactively as the interview date approaches.",
      nav: { back: true, done: "Return to tracking →" },
    },
  ],
  guideSteps: [
    {
      label: "Step 1 of 4",
      heading: "What you need before applying",
      instruction:
        "Gather the required documents before visiting the police station or submitting an online application.",
      info: "Typically required:\n\n• CNIC (original + copy)\n• Passport biographic page copy\n• Passport photo(s)\n• Application fee (varies by district)\n\nCheck the Rahvana guide for your specific district requirements.",
      nav: { next: "Next →" },
    },
    {
      label: "Step 2 of 4",
      heading: "Submit your PCC application",
      instruction:
        "Visit the relevant police station or submit through the government's online portal if available in your district.",
      info: "For detailed district-specific instructions, use the Rahvana Police Certificate Guide:\n\nOpen Full PCC Guide →",
      guideUrl: "/guides/police-verification-guide",
      nav: { back: true, next: "Next →" },
    },
    {
      label: "Step 3 of 4",
      heading: "Keep the receipt and track regularly",
      instruction:
        "Once submitted, keep your receipt and follow up with the police department periodically. Do not assume it will arrive automatically.",
      warn: "PCCs can take several weeks to months. Follow up directly with the relevant police station every week or two. Proactive follow-up significantly reduces delays.",
      nav: { back: true, next: "Save tracking details →" },
    },
    {
      label: "Step 4 of 4",
      heading: "Save your receipt and application date",
      instruction:
        "Return to the main page and save your receipt and application date. Your dashboard will show a persistent reminder until you mark the certificate as received.",
      info: "Once you receive the fresh PCC, return here and mark it as received. You can then save it to the Document Vault.",
      nav: { back: true, done: "Return to tracking →" },
    },
  ],
};
