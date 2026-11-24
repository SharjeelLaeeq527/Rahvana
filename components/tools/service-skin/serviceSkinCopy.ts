// Copy for the service skin (left pane and the Common questions drawer).
// Plain ASCII only (project rule). Keep answers factual: only state what the tools
// actually do; prices are shown by each tool's own checkout step.

import type { ServiceSkinKey } from "./ServiceSkinShell";

// Every answer below is checked against what the tools actually do (Nov 2026).
export const SERVICE_SKIN_FAQ: Record<ServiceSkinKey, Array<[string, string]>> = {
  consult: [
    [
      "What happens after I book?",
      "You get a reference ID and the booking shows under My Requests. The case details you share in the form are saved with it, so the call can start on your questions.",
    ],
    [
      "Who will I talk to?",
      "Someone who has been through these cases many times before. Each session is a 30-minute call.",
    ],
    [
      "What if my time does not work for them?",
      "They can suggest other times. These show on your booking in My Requests, and you pick the one that suits you.",
    ],
    [
      "Do I need documents to book?",
      "No. The form only asks about your case, how to reach you and a time. Keeping your case number and any embassy letters nearby helps during the call.",
    ],
  ],
  medical: [
    [
      "Which clinics can I book?",
      "Wilcare Medical Centre in Karachi or Lahore, or AMC or IOM in Islamabad. You pick the city first.",
    ],
    [
      "What will the form ask me to upload?",
      "A scanned copy of your passport. You can also add your appointment confirmation letter if you have it.",
    ],
  ],
  police: [
    [
      "Who can use this service?",
      "It is for Sindh residents only. Rahvana submits the application for you.",
    ],
    [
      "What do I need for my deponents?",
      "For each one: full name, father's name, CNIC number, phone number and address. Ask them for these before you start.",
    ],
  ],
  translate: [
    [
      "What can I upload?",
      "A clear PDF of your Urdu document, up to 50 MB and without a password.",
    ],
    [
      "Is the translation certified?",
      "Yes. You receive a certified English translation for your case file.",
    ],
    [
      "Where do I find my translation?",
      "Every request is listed under My Requests with its status. Open a request to download the translated file once it is ready.",
    ],
  ],
};

export const SERVICE_SKIN_TAGLINE: Record<ServiceSkinKey, string> = {
  consult: "Talk to an immigration expert",
  medical: "Book your visa medical exam with an approved clinic",
  police: "Sindh police character certificate, filed for you",
  translate: "Urdu to English, certified",
};
