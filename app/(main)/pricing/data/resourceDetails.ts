// ─── Resource / Tool detail content ──────────────────────────────────────────
// Rich, e-commerce-style content for each purchasable add-on. Price, unit and
// note live in `pricing.ts` (ADDONS) — this file holds only the marketing /
// product-page copy, media and reviews. Keyed by ADDON.id (== URL slug).
//
// Media `src` paths point at /public/assets/images/tools/<slug>/...  — drop the
// real screenshots there and they appear automatically. Until then the gallery
// renders a styled placeholder, so nothing ever looks broken.
//
// NOTE on copy accuracy: every feature below has been cross-checked against the
// actual tool code so the detail pages describe what the tools really do — not
// just marketing. The `reviews` arrays are SAMPLE testimonials (placeholders);
// replace them with real customer reviews when available.

export type ResourceMedia = {
  type: "image" | "video";
  src: string;
  alt: string;
  caption?: string;
  /** poster image for videos */
  poster?: string;
};

export type ResourceDetail = {
  slug: string;
  /** small ribbon shown on the hero + card, e.g. "AI-Powered" */
  badge?: string;
  /** one-line hero subtitle */
  tagline: string;
  /** 1–3 short paragraphs */
  overview: string[];
  /** key features grid — icon is a lucide-react name */
  highlights: { icon: string; title: string; text: string }[];
  /** numbered "how it works" steps */
  steps: { title: string; text: string }[];
  /** "who it's for" bullets */
  audience: string[];
  /** "what you get / outcomes" bullets */
  outcomes: string[];
  /** tool-specific Q&A */
  faqs: [string, string][];
  /** hero + gallery media (placeholders until real screenshots arrive) */
  media: ResourceMedia[];
  /** related add-on slugs to cross-sell */
  related: string[];
};

const img = (slug: string, file: string, alt: string, caption?: string): ResourceMedia => ({
  type: "image",
  src: `/assets/images/tools/${slug}/${file}`,
  alt,
  caption,
});

// For images that live directly under /tools (not in a per-slug subfolder).
const imgFile = (file: string, alt: string, caption?: string): ResourceMedia => ({
  type: "image",
  src: `/assets/images/tools/${file}`,
  alt,
  caption,
});

export const RESOURCE_DETAILS: Record<string, ResourceDetail> = {
  // ───────────────────────────────────────────────────────────────────────────
  "case-strength": {
    slug: "case-strength",
    badge: "AI-Powered",
    tagline: "Know your case strength before the government does.",
    overview: [
      "The Case Strength Analyzer reads your application the way a consular officer or NVC reviewer would — then hands you an instant, plain-English score out of 100 with the exact gaps that could slow you down or trigger an RFE.",
      "It scores across income, relationship strength, document completeness and immigration history, and even screens for administrative-processing risks. Instead of guessing whether your packet is 'good enough,' you get a prioritized, fixable list: what's strong, what's weak, and what to do about it before you submit.",
    ],
    highlights: [
      { icon: "Gauge", title: "Instant 0–100 score", text: "A clear strength rating with a breakdown across income, relationship, documents and history." },
      { icon: "AlertTriangle", title: "Flagged gaps & risks", text: "Every missing document or weak spot is surfaced and ranked HIGH / MEDIUM / LOW." },
      { icon: "ListChecks", title: "Prioritized fix list", text: "Improvement suggestions ordered by impact so you fix what matters first." },
      { icon: "ShieldCheck", title: "AP & RFE risk screening", text: "Catches inconsistencies and administrative-processing triggers before they cost you months." },
    ],
    steps: [
      { title: "Share your case details", text: "Pull from your Rahvana profile or answer a short guided intake — no re-typing." },
      { title: "AI reviews everything", text: "The analyzer checks income, relationship, documents and history for gaps and risks." },
      { title: "Get your score + gaps", text: "See your 0–100 strength score with each gap explained in plain English." },
      { title: "Fix and re-run", text: "Resolve items and re-analyze — your case analysis isn't capped." },
    ],
    audience: [
      "Applicants preparing for NVC document review",
      "Anyone unsure whether their evidence is strong enough",
      "Couples who want to avoid an RFE or 221(g) delay",
    ],
    outcomes: [
      "A clear 0–100 case strength score",
      "A prioritized list of gaps ranked by severity",
      "Re-analysis for your case as you fix things",
      "Confidence before you submit",
    ],
    faqs: [
      ["Is this a guarantee of approval?", "No. It significantly improves the completeness and consistency of your application, but the final decision always rests with the U.S. government."],
      ["How many times can I run it?", "The add-on covers one full case — you can re-analyze as you fix gaps; there's no fixed re-run limit."],
      ["Does it use my real data?", "Yes, it can pull directly from your Rahvana profile so you don't re-enter anything. Your data stays private."],
    ],
    media: [
      imgFile("case-strength_hero.jpg", "Case Strength Analyzer score screen", "Your instant 0–100 case strength score with flagged gaps"),
      imgFile("case_strength_Sub_img.jpg", "Prioritized list of gaps to fix", "Every gap explained and ranked by severity"),
      imgFile("case_Strength_Sub.jpg", "Case Strength Analyzer detail view"),
    ],
    related: ["smart", "sponsor", "doc-review"],
  },

  // ───────────────────────────────────────────────────────────────────────────
  "221g": {
    slug: "221g",
    badge: "Executive Tool",
    tagline: "Got a 221(g)? Here's exactly what to do next.",
    overview: [
      "A 221(g) or 'administrative processing' notice is one of the most stressful moments in the journey — vague wording, no timeline, and a lot at stake. The 221(g) Action Planner turns that uncertainty into a clear, personalized roadmap.",
      "Tell us what your slip says and we generate the precise next moves: which documents to send, embassy-specific submission guidance, what to expect, and how to follow up — then bundle it all into a ready-to-send PDF packet with a cover letter and your merged documents.",
    ],
    highlights: [
      { icon: "Map", title: "Personalized action roadmap", text: "Staged plan with timeframes, tailored to your specific 221(g) reason and embassy." },
      { icon: "FileCheck2", title: "Document response checklist", text: "Know exactly what to gather and how to submit it correctly." },
      { icon: "FileText", title: "Ready-to-send PDF packet", text: "Generates a cover letter plus your merged documents as one downloadable PDF." },
      { icon: "Compass", title: "Embassy-specific guidance", text: "Submission method, processing windows and follow-up steps for your post." },
    ],
    steps: [
      { title: "Enter your 221(g) details", text: "Select the reason given and the documents requested on your slip." },
      { title: "Get your action plan", text: "Receive a staged roadmap with timeframes built for your exact situation." },
      { title: "Build your packet", text: "Generate a cover letter and merge your documents into one clean PDF." },
      { title: "Respond & follow up", text: "Submit the right way and track follow-up without overstepping." },
    ],
    audience: [
      "Applicants who received a 221(g) or AP notice",
      "Anyone confused by vague embassy wording",
      "Families racing the clock to respond correctly",
    ],
    outcomes: [
      "A personalized, staged 221(g) action roadmap",
      "A clear document response checklist",
      "A downloadable cover-letter + documents PDF packet",
      "Calm, confident next steps",
    ],
    faqs: [
      ["Can this remove a 221(g)?", "It can't override the consulate, but it ensures you respond completely and correctly — the single biggest factor in resolving administrative processing faster."],
      ["What's in the PDF packet?", "A cover letter addressed to your embassy, a document index, and your uploaded documents merged in order — ready to print or submit."],
      ["How long does the add-on last?", "It stays available until the end of your visa journey."],
    ],
    media: [
      imgFile("221g-hero.jpg", "221(g) Action Planner roadmap", "Your personalized step-by-step 221(g) plan"),
      imgFile("221g-sub_img.jpg", "221(g) reason and document intake", "Tell us what your slip says"),
      imgFile("221g-second_Sub_img.jpg", "221(g) Action Planner detail view"),
    ],
    related: ["doc-review", "consultation", "case-strength"],
  },

  // ───────────────────────────────────────────────────────────────────────────
  "interview-prep": {
    slug: "interview-prep",
    badge: "AI Interview Coach",
    tagline: "Walk into your consular interview like you've already done it.",
    overview: [
      "The consular interview can decide everything in a few minutes. Interview Prep is your complete practice suite — guided question prep, timed rapid-fire drills, and an AI-guided voice mock interview, all built around the questions officers actually ask.",
      "You build and tighten your answers, drill them until they're automatic, then rehearse out loud in a realistic mock session — and get an instant performance summary so the real interview feels familiar.",
    ],
    highlights: [
      { icon: "MessageSquare", title: "Real consular questions", text: "Drawn from the questions officers commonly ask spouse-visa applicants." },
      { icon: "Zap", title: "Timed rapid-fire drills", text: "Short, sharp questions on a countdown that build fast, clear recall." },
      { icon: "Video", title: "AI voice mock interview", text: "Questions are spoken to you and you answer aloud — realistic interview conditions." },
      { icon: "ClipboardCheck", title: "Instant performance summary", text: "Completion, pace and response insights with strengths and areas to improve." },
    ],
    steps: [
      { title: "Build your answers", text: "Work through guided questions tailored to your case and shape strong responses." },
      { title: "Drill rapid-fire", text: "Practice against the clock until your answers are sharp and automatic." },
      { title: "Run a mock interview", text: "Hear realistic consular questions and respond out loud, hands-free." },
      { title: "Get your summary", text: "See an instant breakdown of what's working and what to refine." },
    ],
    audience: [
      "Applicants with an interview scheduled",
      "Anyone who gets nervous under pressure",
      "Couples who want their stories to align",
    ],
    outcomes: [
      "Guided answer prep, rapid-fire drills and a voice mock session",
      "An instant performance summary with insights",
      "A confidence boost for the real day",
    ],
    faqs: [
      ["What's included?", "Three practice modes in one tool — guided question prep, timed rapid-fire drilling, and an AI-guided voice mock interview — all built around real consular questions."],
      ["Is the mock a live person or AI?", "It's an AI-guided voice session — questions are read aloud and your spoken answers are captured, so you can rehearse realistically anytime. It is not a live human interviewer."],
      ["Do I need a microphone?", "For the mock interview, yes — answering out loud gives you response insights. Guided prep and rapid-fire drills work without one."],
    ],
    media: [
      imgFile("interview_prep.jpg", "Interview Prep guided questions", "Build strong answers tailored to your case"),
      imgFile("rapidfire.jpg", "Timed rapid-fire drills", "Sharpen recall against the clock"),
      imgFile("mock_interviw.jpg", "AI voice mock interview", "Hear realistic consular questions and answer aloud"),
      imgFile("result_Rapid.jpg", "Performance summary", "Instant breakdown of pace and responses"),
    ],
    related: ["case-strength", "consultation", "221g"],
  },

  // ───────────────────────────────────────────────────────────────────────────
  smart: {
    slug: "smart",
    badge: "Automation",
    tagline: "Your official forms, filled and ready to upload.",
    overview: [
      "Government forms are long, repetitive, and unforgiving of small mistakes. Smart Form Filler auto-fills your official USCIS and DOS forms straight from your profile data and generates a clean, ready-to-upload PDF.",
      "It supports the core spouse-visa filings — I-130, I-130A, I-129F, the I-864 family (I-864, I-864A, I-864EZ), I-693, I-912 and DS-260 — with field-level mapping, so you don't re-type the same details across pages.",
    ],
    highlights: [
      { icon: "Wand2", title: "Auto-fill from profile", text: "Pulls your saved data so you never re-enter the basics." },
      { icon: "FileText", title: "Real USCIS / DOS forms", text: "Supports I-130, I-130A, I-129F, I-864 / I-864A / I-864EZ, I-693, I-912 and DS-260." },
      { icon: "Download", title: "Ready-to-upload PDF", text: "Clean, properly formatted output you can submit as-is." },
      { icon: "CheckCircle2", title: "Review before download", text: "Check and edit every field, with completion stats, before the PDF is generated." },
    ],
    steps: [
      { title: "Pick your form", text: "Choose the form you need to file." },
      { title: "Confirm your details", text: "Review the data pulled from your Rahvana profile." },
      { title: "Review the output", text: "Check the mapped fields and completion summary for accuracy." },
      { title: "Download & upload", text: "Get a ready-to-submit PDF in minutes." },
    ],
    audience: [
      "Petitioners filing I-130 / I-130A and the I-864 family",
      "Anyone who hates re-typing the same data",
      "Applicants who want error-free forms",
    ],
    outcomes: [
      "One completed official form per credit",
      "A ready-to-upload PDF",
      "Hours of form-filling saved",
    ],
    faqs: [
      ["Which forms are supported?", "I-130, I-130A, I-129F, I-864, I-864A, I-864EZ, I-693, I-912 and DS-260. More forms are added over time."],
      ["How many forms does one credit cover?", "One completed form per credit."],
      ["Can I edit before downloading?", "Yes — you review and confirm every field, with a completion summary, before the final PDF is generated."],
    ],
    media: [
      imgFile("autoform_hero.jpg", "Auto-filled USCIS form preview", "Your official form, auto-filled from your profile"),
      imgFile("autoform.jpg", "Review screen and ready-to-upload PDF"),
    ],
    related: ["case-strength", "sponsor", "doc-review"],
  },

  // ───────────────────────────────────────────────────────────────────────────
  sponsor: {
    slug: "sponsor",
    badge: "Most Useful",
    tagline: "Find out instantly if your income qualifies.",
    overview: [
      "The Affidavit of Support (I-864) trips up countless applicants. The Sponsorship Calculator checks your income and assets against the current poverty guidelines and tells you, in plain numbers, whether you qualify — and exactly what's missing if you don't.",
      "It handles household size, convertible assets, joint sponsors and even special cases like the active-duty military threshold and I-864EZ eligibility. No spreadsheets, no guesswork.",
    ],
    highlights: [
      { icon: "Calculator", title: "Instant qualification check", text: "Compares your income/assets to the I-864 poverty threshold in seconds." },
      { icon: "TrendingUp", title: "Household & asset sizing", text: "Accounts for household size and convertible assets (3× / 5× rules)." },
      { icon: "AlertCircle", title: "Shortfall breakdown", text: "Shows exactly how much more you need if you fall short." },
      { icon: "Users", title: "Joint sponsor guidance", text: "Tells you when a joint sponsor or assets can close the gap, and which forms apply." },
    ],
    steps: [
      { title: "Enter income & household", text: "Add your income, household size and any assets." },
      { title: "We run the numbers", text: "The calculator checks you against current poverty guidelines." },
      { title: "See your result", text: "Get a clear qualify / don't-qualify answer with any shortfall." },
      { title: "Close any gap", text: "Follow guidance on assets, a joint sponsor or the right I-864 variant." },
    ],
    audience: [
      "Petitioners completing the I-864",
      "Sponsors unsure if their income is enough",
      "Anyone considering a joint sponsor",
    ],
    outcomes: [
      "A clear qualify/no-qualify answer",
      "An exact shortfall amount if any",
      "Unlimited recalculations for your case",
    ],
    faqs: [
      ["Which guidelines does it use?", "It checks against the current federal poverty guidelines used for the I-864, including the 100% active-duty military threshold where it applies."],
      ["Can I recalculate?", "Yes — unlimited recalculations are included for your case."],
      ["Does it cover assets, not just income?", "Yes, it factors in convertible assets (with the 3×/5× rules) and household size, and accounts for joint sponsors."],
    ],
    media: [
      imgFile("affidavit_main_hero.jpg", "Sponsorship Calculator result", "Your income vs the I-864 requirement"),
      imgFile("affidavit_hero.jpg", "Income and household intake", "Enter your income, household size and assets"),
      imgFile("affidavit.jpg", "Sponsorship Calculator detail view"),
    ],
    related: ["case-strength", "smart", "doc-review"],
  },

  // ───────────────────────────────────────────────────────────────────────────
  photo: {
    slug: "photo",
    badge: "Minutes, Not Studios",
    tagline: "A compliant visa photo — without the studio trip.",
    overview: [
      "Visa and passport photos get rejected for the smallest things: wrong size, busy background, off-center crop. Photo Booth makes a compliant biometric photo from a picture you already have — background removed, face-centered, and cropped to the exact dimensions for your country.",
      "Skip the studio queue and the do-overs. Upload, pick your country preset, download.",
    ],
    highlights: [
      { icon: "Scissors", title: "Automatic background removal", text: "Clean white background with the subject centered, powered by smart cutout." },
      { icon: "Crop", title: "Country size presets", text: "Outputs the exact dimensions for US, UK, India, Canada — or a custom size." },
      { icon: "Camera", title: "Face-centered crop", text: "Automatically positions and crops your face to spec." },
      { icon: "Image", title: "Download-ready output", text: "Get a print- and upload-ready JPG in one click." },
    ],
    steps: [
      { title: "Upload a photo", text: "Use a clear, front-facing picture." },
      { title: "Pick your preset", text: "Choose US, UK, India, Canada or a custom size." },
      { title: "Auto-process", text: "We remove the background and crop to your chosen dimensions." },
      { title: "Download", text: "Get your photo, ready to print or upload." },
    ],
    audience: [
      "Applicants needing a visa/passport photo",
      "Anyone whose photo got rejected before",
      "Families needing multiple compliant photos",
    ],
    outcomes: [
      "One compliant photo output per credit",
      "Country-correct dimensions (US/UK/India/Canada or custom)",
      "No studio visit required",
    ],
    faqs: [
      ["What counts as one credit?", "Each credit produces one compliant photo output."],
      ["What photo should I upload?", "A clear, well-lit, front-facing photo with your full face visible works best."],
      ["Will it definitely be accepted?", "It outputs to the standard size for your selected country and shows the requirements checklist — always double-check your specific post's instructions before submitting."],
    ],
    media: [
      img("photo", "hero.png", "Photo Booth compliant photo output", "From a normal photo to a compliant one"),
      img("photo", "gallery-1.png", "Background removal and country presets"),
    ],
    related: ["smart", "civil-guid"],
  },

  // ───────────────────────────────────────────────────────────────────────────
  "doc-review": {
    slug: "doc-review",
    badge: "Human Expert",
    tagline: "A real expert reads your packet before the officer does.",
    overview: [
      "Sometimes you just want a human to look it over. Expert Case Review is a hands-on review of your application packet by a specialist, returned with clear written feedback on completeness, quality and anything that could raise a flag.",
      "It's the second set of eyes that catches what self-review misses — before it reaches the government.",
    ],
    highlights: [
      { icon: "FileSearch", title: "Full packet review", text: "A specialist reviews your documents end to end." },
      { icon: "MessageSquareText", title: "Written feedback", text: "Clear, actionable notes you can act on immediately." },
      { icon: "Flag", title: "Issue flagging", text: "Surfaces gaps, inconsistencies and red flags." },
      { icon: "Timer", title: "2 business day turnaround", text: "Feedback returned quickly so you stay on schedule." },
    ],
    steps: [
      { title: "Submit your packet", text: "Share the documents you want reviewed." },
      { title: "Expert reviews it", text: "A specialist checks completeness and quality." },
      { title: "Get written feedback", text: "Receive clear notes within 2 business days." },
      { title: "Apply the fixes", text: "Strengthen your packet before you submit." },
    ],
    audience: [
      "Applicants who want a human second opinion",
      "Anyone with a complex or borderline case",
      "Couples who want peace of mind before filing",
    ],
    outcomes: [
      "A full expert review of your packet",
      "Written, actionable feedback",
      "Returned within 2 business days",
    ],
    faqs: [
      ["Is this legal advice?", "It's a structural and quality review, not legal representation. For complex legal situations we recommend a licensed attorney."],
      ["How fast is it?", "Feedback is typically returned within 2 business days of submission."],
      ["What can I submit?", "Your application packet documents — forms, evidence and supporting materials."],
    ],
    media: [
      img("doc-review", "hero.png", "Expert Case Review feedback", "A specialist's written feedback on your packet"),
    ],
    related: ["case-strength", "consultation", "221g"],
  },

  // ───────────────────────────────────────────────────────────────────────────
  consultation: {
    slug: "consultation",
    badge: "1-on-1 Expert",
    tagline: "Talk it through with someone who knows the process.",
    overview: [
      "Some questions need a conversation. Expert Consultation is a focused 30-minute video session with a specialist who understands your situation and gives you straight, situation-specific guidance.",
      "Book a slot, bring your case, your worries, your what-ifs — and leave with a clear plan.",
    ],
    highlights: [
      { icon: "Video", title: "30-minute video call", text: "A focused one-on-one session with a specialist." },
      { icon: "CalendarCheck", title: "Easy online booking", text: "Pick a time from available slots in a few clicks." },
      { icon: "Target", title: "Situation-specific advice", text: "Guidance tailored to your exact case, not generic tips." },
      { icon: "Lightbulb", title: "Clear next steps", text: "Leave with a concrete plan of action." },
    ],
    steps: [
      { title: "Book your slot", text: "Choose an available time for your 30-minute session." },
      { title: "Prep your questions", text: "Jot down what you want to cover." },
      { title: "Meet your specialist", text: "Get tailored guidance on a video call." },
      { title: "Act with clarity", text: "Move forward with a clear plan." },
    ],
    audience: [
      "Applicants with case-specific questions",
      "Anyone facing an unusual situation",
      "People who prefer talking it through",
    ],
    outcomes: [
      "One 30-minute expert video session",
      "Situation-specific guidance",
      "Scheduled within 3 business days",
    ],
    faqs: [
      ["Is this legal representation?", "No — it's expert guidance on the process. For legal representation, consult a licensed immigration attorney."],
      ["How long is the session?", "Each session is 30 minutes of focused one-on-one time."],
      ["How soon can I be seen?", "You book from available slots, and sessions are typically scheduled within 3 business days."],
    ],
    media: [
      img("consultation", "hero.png", "Expert Consultation booking and video session"),
    ],
    related: ["doc-review", "221g", "interview-prep"],
  },

  // ───────────────────────────────────────────────────────────────────────────
  translate: {
    slug: "translate",
    badge: "Certified",
    tagline: "Embassy-ready certified translations, done right.",
    overview: [
      "Civil documents in another language need certified translations that meet embassy formatting standards — get it wrong and your case stalls. Document Translation delivers certified, embassy-ready translations of your standard civil documents.",
      "Upload a document, track its status, and download the finished certified translation when it's ready.",
    ],
    highlights: [
      { icon: "Languages", title: "Certified translation", text: "Meets the certification embassies and USCIS require." },
      { icon: "FileBadge", title: "Embassy-ready format", text: "Correct formatting so it's accepted the first time." },
      { icon: "ScrollText", title: "Standard civil documents", text: "Marriage, birth, death and divorce certificates and similar civil records." },
      { icon: "Timer", title: "Status tracking", text: "Follow your request from uploaded to translated to verified." },
    ],
    steps: [
      { title: "Upload your document", text: "Share the civil document that needs translating." },
      { title: "We translate & certify", text: "A certified translation is prepared in the correct format." },
      { title: "Track the status", text: "Watch your request move through translation and verification." },
      { title: "Confirm & download", text: "Review and download your embassy-ready translation." },
    ],
    audience: [
      "Applicants with non-English civil documents",
      "Anyone needing certified, accepted translations",
      "Families submitting multiple civil documents",
    ],
    outcomes: [
      "One certified document translation per document",
      "Embassy-ready formatting",
      "Status tracking from upload to download",
    ],
    faqs: [
      ["What documents are covered?", "Standard civil documents such as marriage, birth, death and divorce certificates."],
      ["Is it certified?", "Yes — translations are prepared as certified, embassy-ready documents."],
      ["How do I get it back?", "You track the request status in-app and download the finished translation once it's ready."],
    ],
    media: [
      img("translate", "hero.png", "Certified document translation", "Source document to embassy-ready translation"),
    ],
    related: ["civil-guid", "doc-review"],
  },

  // ───────────────────────────────────────────────────────────────────────────
  "civil-guid": {
    slug: "civil-guid",
    badge: "Step-by-Step",
    tagline: "Exactly how and where to get every document.",
    overview: [
      "Tracking down civil documents in the right format is half the battle. Civil Document Guides are country-specific, step-by-step walkthroughs that tell you precisely how and where to obtain each required document.",
      "From CNIC and birth certificates to police certificates, FRC, marriage registration and polio vaccination — clear instructions, and your progress is saved as you go.",
    ],
    highlights: [
      { icon: "Globe", title: "Country-specific", text: "Instructions tailored to where you actually are." },
      { icon: "MapPin", title: "Where & how to obtain", text: "The right channels and offices for each document." },
      { icon: "ListOrdered", title: "Step-by-step wizard", text: "Clear ordered steps from request to collection, with progress saved." },
      { icon: "BookOpen", title: "Permanent access", text: "Keep access to every guide you purchase." },
    ],
    steps: [
      { title: "Pick your document", text: "Choose the civil document you need — CNIC, birth, police certificate and more." },
      { title: "Open the guide", text: "Get country-specific, step-by-step instructions." },
      { title: "Follow the steps", text: "Know where to go and what to ask for; your progress saves automatically." },
      { title: "Collect & proceed", text: "Obtain the document in the correct format." },
    ],
    audience: [
      "Applicants gathering civil documents",
      "Anyone unsure where to obtain a document",
      "People who want a clear, local roadmap",
    ],
    outcomes: [
      "Permanent access to purchased guides",
      "Country-specific, step-by-step instructions",
      "Saved progress you can return to anytime",
    ],
    faqs: [
      ["Which documents have guides?", "Guides cover documents like CNIC, birth certificate, police character certificate, FRC, marriage registration (Nikah Nama) and polio vaccination."],
      ["Are guides specific to my country?", "Yes — guides are country-specific so the steps actually apply to you."],
      ["Do I keep access?", "Yes, you keep permanent access to any guide you purchase, and your progress is saved."],
    ],
    media: [
      img("civil-guid", "hero.png", "Civil Document Guides library"),
    ],
    related: ["translate", "photo"],
  },

  // ───────────────────────────────────────────────────────────────────────────
  "case-manager": {
    slug: "case-manager",
    badge: "Concierge",
    tagline: "One named expert who follows your case end to end.",
    overview: [
      "When you want a single point of contact through the whole journey, a Dedicated Case Manager is your named support contact — someone who knows your case, answers your questions, and coordinates reviews from start to finish.",
      "Continuity and accountability across every stage, available on any plan tier.",
    ],
    highlights: [
      { icon: "UserCheck", title: "A named contact", text: "The same person follows your case throughout." },
      { icon: "Headphones", title: "Direct support", text: "Get your questions answered without starting over each time." },
      { icon: "GitMerge", title: "Coordinates reviews", text: "Keeps reviews and steps moving on your behalf." },
      { icon: "CalendarRange", title: "Full-journey coverage", text: "Available across all plan tiers, all year." },
    ],
    steps: [
      { title: "Get matched", text: "You're assigned a dedicated case manager." },
      { title: "Share your case", text: "They get up to speed on your situation." },
      { title: "Stay supported", text: "Ask questions and get help at every stage." },
      { title: "Move forward together", text: "They coordinate reviews and keep things on track." },
    ],
    audience: [
      "Applicants who want one consistent contact",
      "Busy people who want things coordinated for them",
      "Anyone who values continuity and accountability",
    ],
    outcomes: [
      "A named support contact for your case",
      "Coordinated reviews and follow-ups",
      "Available across all plan tiers",
    ],
    faqs: [
      ["Is it the same person each time?", "Yes — a dedicated case manager follows your case end to end."],
      ["How long does it last?", "It's an annual service available across all plan tiers."],
    ],
    media: [
      img("case-manager", "hero.png", "Dedicated Case Manager dashboard"),
    ],
    related: ["consultation", "doc-review"],
  },
};

export const RESOURCE_SLUGS = Object.keys(RESOURCE_DETAILS);

export function getResourceDetail(slug: string): ResourceDetail | undefined {
  return RESOURCE_DETAILS[slug];
}
