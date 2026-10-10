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
      "The Case Strength Analyzer reads your application the way a consular officer or NVC reviewer would, then hands you an instant, plain-English score out of 100 with the exact gaps that could slow you down or trigger an RFE.",
      "It scores across income, relationship strength, document completeness and immigration history, and even screens for administrative-processing risks. Instead of guessing whether your packet is 'good enough,' you get a prioritized, fixable list: what's strong, what's weak, and what to do about it before you submit.",
    ],
    highlights: [
      { icon: "Gauge", title: "Instant 0-100 score", text: "A clear strength rating with a breakdown across income, relationship, documents and history." },
      { icon: "AlertTriangle", title: "Flagged gaps & risks", text: "Every missing document or weak spot is surfaced and ranked HIGH / MEDIUM / LOW." },
      { icon: "ListChecks", title: "Prioritized fix list", text: "Improvement suggestions ordered by impact so you fix what matters first." },
      { icon: "ShieldCheck", title: "AP & RFE risk screening", text: "Catches inconsistencies and administrative-processing triggers before they cost you months." },
    ],
    steps: [
      { title: "Share your case details", text: "Pull from your Rahvana profile or answer a short guided intake, no re-typing." },
      { title: "AI reviews everything", text: "The analyzer checks income, relationship, documents and history for gaps and risks." },
      { title: "Get your score + gaps", text: "See your 0-100 strength score with each gap explained in plain English." },
      { title: "Fix and re-run", text: "Resolve items and re-analyze, your case analysis isn't capped." },
    ],
    audience: [
      "Applicants preparing for NVC document review",
      "Anyone unsure whether their evidence is strong enough",
      "Couples who want to avoid an RFE or 221(g) delay",
    ],
    outcomes: [
      "A clear 0-100 case strength score",
      "A prioritized list of gaps ranked by severity",
      "Re-analysis for your case as you fix things",
      "Confidence before you submit",
    ],
    faqs: [
      ["Is this a guarantee of approval?", "No. It significantly improves the completeness and consistency of your application, but the final decision always rests with the U.S. government."],
      ["How many times can I run it?", "The add-on covers one full case; you can re-analyze as you fix gaps; there's no fixed re-run limit."],
      ["Does it use my real data?", "Yes, it can pull directly from your Rahvana profile so you don't re-enter anything. Your data stays private."],
    ],
    media: [
      imgFile("case-strength_hero.jpg", "Case Strength Analyzer score screen", "Your instant 0-100 case strength score with flagged gaps"),
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
      "A 221(g) or 'administrative processing' notice is one of the most stressful moments in the journey: vague wording, no timeline, and a lot at stake. The 221(g) Action Planner turns that uncertainty into a clear, personalized roadmap.",
      "Tell us what your slip says and we generate the precise next moves: which documents to send, embassy-specific submission guidance, what to expect, and how to follow up, then bundle it all into a ready-to-send PDF packet with a cover letter and your merged documents.",
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
      ["Can this remove a 221(g)?", "It can't override the consulate, but it ensures you respond completely and correctly, which is the single biggest factor in resolving administrative processing faster."],
      ["What's in the PDF packet?", "A cover letter addressed to your embassy, a document index, and your uploaded documents merged in order, ready to print or submit."],
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
      "The consular interview can decide everything in a few minutes. Interview Prep is your complete practice suite: guided question prep, timed rapid-fire drills, and an AI-guided voice mock interview, all built around the questions officers actually ask.",
      "You build and tighten your answers, drill them until they're automatic, then rehearse out loud in a realistic mock session, then get an instant performance summary so the real interview feels familiar.",
    ],
    highlights: [
      { icon: "MessageSquare", title: "Real consular questions", text: "Drawn from the questions officers commonly ask spouse-visa applicants." },
      { icon: "Zap", title: "Timed rapid-fire drills", text: "Short, sharp questions on a countdown that build fast, clear recall." },
      { icon: "Video", title: "AI voice mock interview", text: "Questions are spoken to you and you answer aloud, under realistic interview conditions." },
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
      ["What's included?", "Three practice modes in one tool: guided question prep, timed rapid-fire drilling, and an AI-guided voice mock interview, all built around real consular questions."],
      ["Is the mock a live person or AI?", "It's an AI-guided voice session: questions are read aloud and your spoken answers are captured, so you can rehearse realistically anytime. It is not a live human interviewer."],
      ["Do I need a microphone?", "For the mock interview, yes, since answering out loud gives you response insights. Guided prep and rapid-fire drills work without one."],
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
      "It supports the core spouse-visa filings: I-130, I-130A, I-129F, the I-864 family (I-864, I-864A, I-864EZ), I-693, I-912 and DS-260, with field-level mapping, so you don't re-type the same details across pages.",
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
      ["Can I edit before downloading?", "Yes, you review and confirm every field, with a completion summary, before the final PDF is generated."],
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
      "The Affidavit of Support (I-864) trips up countless applicants. The Sponsorship Calculator checks your income and assets against the current poverty guidelines and tells you, in plain numbers, whether you qualify, and exactly what's missing if you don't.",
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
      ["Can I recalculate?", "Yes, unlimited recalculations are included for your case."],
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
  pdf: {
    slug: "pdf",
    badge: "All-in-One",
    tagline: "Every PDF fix the embassy needs, in one place.",
    overview: [
      "Embassies and USCIS are unforgiving about file format: pages out of order, files too large to upload, the wrong format entirely. The PDF Tool Kit puts merge, edit, compress and convert in one place so every document goes in exactly the way it's supposed to.",
      "Combine multiple scans into a single packet, shrink an oversized file under the upload limit, convert images or office files to PDF, and edit pages, all in your browser, no extra software to install.",
    ],
    highlights: [
      { icon: "Combine", title: "Merge into one packet", text: "Combine multiple PDFs and scans into a single, correctly ordered document." },
      { icon: "Minimize2", title: "Compress to fit limits", text: "Shrink oversized files under portal upload size limits without losing legibility." },
      { icon: "RefreshCw", title: "Convert formats", text: "Turn images and office files into clean PDFs (and between formats) ready to submit." },
      { icon: "PenLine", title: "Edit pages", text: "Reorder, rotate and tidy pages so your packet reads exactly right." },
    ],
    steps: [
      { title: "Upload your file", text: "Drop in the PDF, image or document you need to fix." },
      { title: "Pick a tool", text: "Choose merge, compress, convert or edit." },
      { title: "Process in-browser", text: "The toolkit handles it instantly, nothing to install." },
      { title: "Download", text: "Get a clean, submission-ready PDF." },
    ],
    audience: [
      "Anyone whose upload was rejected for size or format",
      "Applicants combining multiple scans into one packet",
      "Anyone preparing documents for NVC or embassy upload",
    ],
    outcomes: [
      "Merged, correctly ordered document packets",
      "Files compressed under portal upload limits",
      "Format conversion to embassy-ready PDFs",
    ],
    faqs: [
      ["Is this included in my plan?", "Yes, the PDF Tool Kit is included free with Basic, Premium and Executive. It's sold standalone only for free-tier users."],
      ["Do my files stay private?", "Processing happens in your browser session; your documents aren't shared."],
      ["What can it convert?", "Common images and office files to PDF, plus merging, compressing and editing existing PDFs."],
    ],
    media: [
      imgFile("pdf-toolkit_hero.jpg", "PDF Tool Kit, merge, compress, convert, edit"),
    ],
    related: ["smart", "snap", "photo"],
  },

  // ───────────────────────────────────────────────────────────────────────────
  snap: {
    slug: "snap",
    badge: "Clean Signatures",
    tagline: "A clean digital signature from a quick photo.",
    overview: [
      "Forms often need a signature image, but a phone photo of your signature comes with a grey background and shadows that look messy on an official document. Snap & Sign cleans that up: it removes the background and gives you a crisp, transparent signature you can drop straight into your forms.",
      "Snap a photo of your handwritten signature on paper, upload it, and download a clean, ready-to-place signature image, no scanner or design tool needed.",
    ],
    highlights: [
      { icon: "Eraser", title: "Background removed", text: "Strips the paper, shadows and noise so only your signature remains." },
      { icon: "FileImage", title: "Transparent output", text: "Get a clean transparent image that sits naturally on any form." },
      { icon: "Smartphone", title: "Just use your phone", text: "A normal photo of your signature on paper is all you need, no scanner." },
      { icon: "Zap", title: "Ready in seconds", text: "Upload, preview and download, done in moments." },
    ],
    steps: [
      { title: "Sign on paper", text: "Write your signature clearly on plain white paper." },
      { title: "Snap & upload", text: "Take a photo with your phone and upload it." },
      { title: "We clean it up", text: "The background is removed automatically." },
      { title: "Download & place", text: "Drop the clean signature into your forms." },
    ],
    audience: [
      "Anyone signing forms that need a signature image",
      "Applicants without a scanner",
      "Anyone whose signature photo looked messy on a document",
    ],
    outcomes: [
      "A clean, background-free signature image",
      "A transparent file ready to place on forms",
      "No scanner or design software required",
    ],
    faqs: [
      ["Is this included in my plan?", "Yes, Snap & Sign is included free with Basic, Premium and Executive. It's sold standalone only for free-tier users."],
      ["What should I upload?", "A clear photo of your handwritten signature on plain white paper, well lit, works best."],
      ["Is the output transparent?", "Yes, the background is removed so the signature drops cleanly onto your forms."],
    ],
    media: [
      imgFile("snap-and-sign_hero.jpg", "Snap & Sign, clean digital signature"),
    ],
    related: ["pdf", "smart", "photo"],
  },

  // ───────────────────────────────────────────────────────────────────────────
  photo: {
    slug: "photo",
    badge: "Minutes, Not Studios",
    tagline: "A compliant visa photo, without the studio trip.",
    overview: [
      "Visa and passport photos get rejected for the smallest things: wrong size, busy background, off-center crop. Photo Booth makes a compliant biometric photo from a picture you already have: background removed, face-centered, and cropped to the exact dimensions for US.",
      "Skip the studio queue and the do-overs. Upload, auto-process, download.",
    ],
    highlights: [
      { icon: "Scissors", title: "Automatic background removal", text: "Clean white background with the subject centered, powered by smart cutout." },
      { icon: "Crop", title: "Country size preset", text: "Outputs the exact dimensions for US." },
      { icon: "Camera", title: "Face-centered crop", text: "Automatically positions and crops your face to spec." },
      { icon: "Image", title: "Download-ready output", text: "Get a print- and upload-ready JPG in one click." },
    ],
    steps: [
      { title: "Upload a photo", text: "Use a clear, front-facing picture." },
      { title: "Automatic sizing", text: "Pre-configured to the exact dimensions for US." },
      { title: "Auto-process", text: "We remove the background and crop to compliant dimensions." },
      { title: "Download", text: "Get your photo, ready to print or upload." },
    ],
    audience: [
      "Applicants needing a visa/passport photo",
      "Anyone whose photo got rejected before",
      "Families needing multiple compliant photos",
    ],
    outcomes: [
      "2 credits per purchase — each credit produces one compliant photo output",
      "Country-correct dimensions (US)",
      "No studio visit required",
    ],
    faqs: [
      ["How many credits do I get?", "Every Photo Booth purchase grants 2 credits, on any plan — each credit produces one compliant photo output."],
      ["What photo should I upload?", "A clear, well-lit, front-facing photo with your full face visible works best."],
      ["Will it definitely be accepted?", "It outputs to the standard size for US and shows the requirements checklist, but always double-check your specific post's instructions before submitting."],
    ],
    media: [
      imgFile("photobooth.webp", "Your original photo (before)", "Before: a normal photo you upload"),
      imgFile("photobooth-after.jpg", "Compliant passport photo (after)", "After: a fully compliant biometric photo"),
    ],
    related: ["smart", "guide-passport"],
  },

  // ───────────────────────────────────────────────────────────────────────────
  "doc-review": {
    slug: "doc-review",
    badge: "Human Expert",
    tagline: "A real expert reads your packet before the officer does.",
    overview: [
      "Sometimes you just want a human to look it over. Expert Case Review is a hands-on review of your application packet by a specialist, returned with clear written feedback on completeness, quality and anything that could raise a flag.",
      "It's the second set of eyes that catches what self-review misses, before it reaches the government.",
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
      ["What can I submit?", "Your application packet documents: forms, evidence and supporting materials."],
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
      "Book a slot, bring your case, your worries, your what-ifs, and leave with a clear plan.",
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
      ["Is this legal representation?", "No, it's expert guidance on the process. For legal representation, consult a licensed immigration attorney."],
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
      "Civil documents in another language need certified translations that meet embassy formatting standards; get it wrong and your case stalls. Document Translation delivers certified, embassy-ready translations of your standard civil documents.",
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
      ["Is it certified?", "Yes, translations are prepared as certified, embassy-ready documents."],
      ["How do I get it back?", "You track the request status in-app and download the finished translation once it's ready."],
    ],
    media: [
      img("translate", "hero.png", "Certified document translation", "Source document to embassy-ready translation"),
    ],
    related: ["guide-nikah-nama", "doc-review"],
  },

  // ───────────────────────────────────────────────────────────────────────────
  medical: {
    slug: "medical",
    badge: "Done-for-You",
    tagline: "We book your panel physician medical exam, so you don't have to.",
    overview: [
      "The immigrant visa medical exam has to be done by an embassy-approved panel physician, and getting a slot can mean phone calls, waitlists and confusion over which clinic is authorised. The Book Medical Appointment service hands that off to Rahvana.",
      "Tell us where you are and your preferred timing, and we coordinate the booking with an approved panel clinic on your behalf, then confirm the appointment back to you.",
    ],
    highlights: [
      { icon: "CalendarCheck", title: "We do the booking", text: "Rahvana coordinates your appointment with an approved panel physician for you." },
      { icon: "Stethoscope", title: "Approved panel clinics", text: "Booked only with embassy-authorised panel physicians for the immigrant visa exam." },
      { icon: "Clock", title: "No waitlist chasing", text: "Skip the phone calls and back-and-forth, we line up the slot." },
      { icon: "BellRing", title: "Confirmation back to you", text: "You receive the confirmed date, time and clinic details once it's set." },
    ],
    steps: [
      { title: "Submit your request", text: "Share your location and preferred timing for the medical exam." },
      { title: "We coordinate the slot", text: "Rahvana contacts an approved panel clinic and arranges your appointment." },
      { title: "Get your confirmation", text: "Receive the confirmed appointment details: date, time and clinic." },
      { title: "Attend your exam", text: "Show up prepared, with what to bring laid out for you in advance." },
    ],
    audience: [
      "Applicants who've reached the medical exam stage",
      "Anyone unsure which clinics are panel-approved",
      "People who'd rather hand off the scheduling",
    ],
    outcomes: [
      "One panel physician appointment booked per request",
      "A confirmed date, time and clinic",
      "No waitlist chasing or guesswork on approved clinics",
    ],
    faqs: [
      ["Are government or clinic fees included?", "No. This covers the booking coordination only. The panel physician's exam fee is paid separately, directly to the clinic."],
      ["Which doctor will I see?", "An embassy-approved panel physician authorised to perform the immigrant visa medical exam in your area."],
      ["How fast can I get an appointment?", "It depends on the panel clinic's availability, but we line up the earliest workable slot and confirm it back to you."],
    ],
    media: [
      img("medical", "hero.png", "Book Medical Appointment service"),
    ],
    related: ["consultation", "guide-passport"],
  },

  // ───────────────────────────────────────────────────────────────────────────
  pcc: {
    slug: "pcc",
    badge: "Done-for-You",
    tagline: "Hand off your Sindh police certificate filing to us.",
    overview: [
      "A Police Character Certificate (PCC) is required for the visa, but the Sindh filing process means documents, fees and follow-ups with the authorities. The PCC Filing service does it for you, end to end, for Sindh.",
      "You provide the required documents and we handle the submission and follow-up so you don't have to navigate the process yourself.",
    ],
    highlights: [
      { icon: "Shield", title: "Done-for-you filing", text: "We submit and follow up on your Sindh PCC application on your behalf." },
      { icon: "MapPin", title: "Sindh province", text: "Specialised handling for the Sindh police certificate workflow." },
      { icon: "FileCheck2", title: "Document checklist", text: "We tell you exactly what to provide before filing so nothing stalls." },
      { icon: "ClipboardCheck", title: "Status updates", text: "Stay informed as your application moves through the process." },
    ],
    steps: [
      { title: "Submit your request", text: "Start your Sindh PCC filing and tell us about your case." },
      { title: "Provide your documents", text: "Share the required documents from the checklist we give you." },
      { title: "We file & follow up", text: "Rahvana submits the application and follows up with the authorities." },
      { title: "Receive your certificate", text: "Get your Police Character Certificate once issued." },
    ],
    audience: [
      "Applicants who need a Sindh police certificate for the visa",
      "Anyone who'd rather not navigate the filing themselves",
      "People short on time to chase the authorities",
    ],
    outcomes: [
      "Done-for-you PCC filing for Sindh",
      "A clear document checklist up front",
      "Status updates through to issuance",
    ],
    faqs: [
      ["Which provinces are covered?", "This service covers Sindh only."],
      ["Are government fees included?", "No. The official PCC fee is paid separately. This service covers the filing and coordination on your behalf."],
      ["What do I need to provide?", "We give you a checklist up front: typically your CNIC, passport copy, a recent photo, a utility bill and a verification letter."],
    ],
    media: [
      img("pcc", "hero.png", "PCC Filing (Sindh) service"),
    ],
    related: ["guide-police", "consultation"],
  },

  // ───────────────────────────────────────────────────────────────────────────
  // Individual document guides. All copy below is sourced verbatim from the guide
  // wizard data in /data/<doc>-guide-data.json (whats_this, sections, document_need,
  // roadmap). Nothing here is invented — it mirrors the content of each live guide.
  // ───────────────────────────────────────────────────────────────────────────
  "guide-passport": {
    slug: "guide-passport",
    badge: "Step-by-Step",
    tagline: "DGIP • Immigration & International Travel",
    overview: [
      "The Pakistani Passport is an official travel document issued by the Directorate General of Immigration & Passports (DGIP). It is required for all international travel and serves as proof of Pakistani citizenship. This wizard guides you through the application process step by step.",
      "A Pakistani passport is an official travel document issued for international travel that also proves Pakistani citizenship and identity.",
    ],
    highlights: [
      { icon: "BookOpen", title: "Understanding Pakistani Passport", text: "Learn about the types of passports and why you need one." },
      { icon: "Users", title: "Eligibility Criteria", text: "Check if you qualify to apply for a Pakistani passport." },
      { icon: "FileText", title: "Required Documents", text: "Complete checklist of documents needed." },
      { icon: "Globe", title: "Application Process (Online & Offline)", text: "Step-by-step guide to applying." },
      { icon: "Clock", title: "Processing Time", text: "Expected timelines." },
      { icon: "AlertTriangle", title: "Critical Tips & Common Mistakes", text: "Best practices & warnings." },
    ],
    steps: [
      { title: "Fee Payment & Document Preparation", text: "Download or obtain the passport fee challan. Pay the required fee via bank challan or e-payment. Collect original CNIC with copy. For minors, bring B-Form and guardian's CNIC. Keep previous passport if applying for renewal." },
      { title: "Visit Regional Passport Office (RPO)", text: "Visit your nearest Regional Passport Office (RPO) or Pakistan Mission. Present your paid fee receipt. Obtain a token number. Your photograph will be taken, fingerprints captured, and biometric verification completed." },
      { title: "Application Verification & Processing", text: "Your application is reviewed by the Directorate General of Immigration & Passports (DGIP). Criminal record checks (ECL/BL) are performed. After successful verification, passport printing is initiated." },
      { title: "Passport Collection or Delivery", text: "You will receive an SMS when your passport is ready. Collect it from the passport office or receive it via courier if delivery was selected. Verify name spelling, CNIC number, date of birth, and other details before leaving." },
    ],
    audience: [
      "New Passport, First-time passport application or expired passport",
      "Renewal, Renew your existing valid or recently expired passport",
      "Lost / Damaged, Replace a lost, stolen, or damaged passport",
    ],
    outcomes: [
      "Step-by-step guidance tailored to your passport application type",
      "Fee calculator for MRP and ePassport options",
      "Personalized roadmap with realistic time estimates",
      "Office finder with RPO/EPO locations and timings",
      "Immigration-ready validation checklist",
    ],
    faqs: [
      ["What is a Pakistani Passport?", "A Pakistani passport is an official travel document issued for international travel that also proves Pakistani citizenship and identity."],
      ["When is it required?", "Required for all international travel; most countries require at least 6 months validity on your passport beyond your planned stay."],
      ["Who can apply?", "Every Pakistani citizen including newborns. No minimum age. Dual nationals must show their foreign passport with photocopy, NOC is required for government employees, and minors need both parents' IDs or legal guardianship documents."],
      ["How long does processing take?", "Normal: approx. 10 working days. Urgent: approx. 4 working days. Fast Track: 2 working days at select offices. Online delivery via courier typically adds 2-3 additional days."],
      ["Any pro tips?", "Renew 7-12 months before expiry. Use official DGIP portals/apps only. Keep your CNIC valid and complete all documents. Incorrect or incomplete documents cause rejections."],
      ["Is this official legal advice?", "This wizard provides general guidance based on publicly available DGIP information and should not be considered legal advice. Requirements may vary and can change. Always verify current procedures with your local RPO/EPO office."],
    ],
    media: [
      img("guide-passport", "hero.png", "Pakistani Passport guide"),
    ],
    related: ["guide-cnic", "guide-frc", "guide-nikah-nama"],
  },

  // ───────────────────────────────────────────────────────────────────────────
  "guide-police": {
    slug: "guide-police",
    badge: "Step-by-Step",
    tagline: "Character Certificate Process",
    overview: [
      "A Police Verification Certificate (PVC) or Police Clearance Certificate (PCC) is an official document issued by law enforcement, confirming an individual has no criminal record, active investigations, or adverse findings against them. A Police Character Certificate is often required for traveling abroad, international jobs, immigration, and general verification.",
    ],
    highlights: [
      { icon: "FileText", title: "Original CNIC", text: "13-digit CNIC." },
      { icon: "Camera", title: "Passport Size Photograph", text: "In .JPG or .PNG format." },
      { icon: "FileText", title: "Passport Copy", text: "Clear copy of passport." },
      { icon: "FileText", title: "Utility Bill", text: "Recent utility bill in .PDF." },
      { icon: "FileBadge", title: "Verification Letter", text: "Official Verification Letter in .PDF." },
    ],
    steps: [
      { title: "Select your province to get tailored instructions.", text: "" },
      { title: "Review the required documents and steps.", text: "" },
      { title: "Generate necessary forms or apply directly online where supported.", text: "" },
    ],
    audience: [
      "Traveling abroad",
      "International jobs",
      "Immigration",
      "General verification",
    ],
    outcomes: [
      "Punjab, Rs 500, 3 working days",
      "Balochistan, Rs 350, 3 working days",
      "Sindh, Rs 500-1000, 7-15 working days",
      "KPK, Rs 3000, varies by verification",
    ],
    faqs: [
      ["What is a Police Character Certificate used for?", "It is often required for traveling abroad, international jobs, immigration, and general verification."],
      ["Is this official legal advice?", "This guide provides general information based on public records. Always verify details with your local police station or PKM center."],
    ],
    media: [
      img("guide-police", "hero.png", "Police Character Certificate guide"),
    ],
    related: ["guide-passport", "guide-cnic", "translate"],
  },

  // ───────────────────────────────────────────────────────────────────────────
  "guide-cnic": {
    slug: "guide-cnic",
    badge: "Step-by-Step",
    tagline: "NADRA • Identity & Official Purpose",
    overview: [
      "The Computerized National Identity Card (CNIC) is an official identity document for Pakistani citizens. It is required for voting, opening bank accounts, getting a passport, obtaining a driving license, and more.",
    ],
    highlights: [
      { icon: "FileText", title: "Original B-Form (CRC)", text: "Or original Birth Certificate. Without originals, application may be rejected." },
      { icon: "Users", title: "Parents' CNIC Copies", text: "Clear copies of at least one parent's CNIC (both is better)." },
      { icon: "MapPin", title: "Proof of Residence", text: "Utility bill or domicile in your parent's/your name." },
      { icon: "MessageSquare", title: "Active Mobile Number", text: "For OTP verification and SMS tracking." },
    ],
    steps: [
      { title: "Token & Waiting", text: "Visit your nearest NADRA Registration Center, get a queue token, and wait for your turn. Visit early morning to avoid rush." },
      { title: "Data Entry & Biometrics", text: "Biometric Verification (anyone of parents or sibling). Photographs and fingerprints are mandatory. Your data will be entered and reviewed. Attestation by anyone of the parents or siblings or by Gazetted officer. Interview by OIC. Fee submission." },
      { title: "Review & Receipt", text: "Review the printed application form carefully. Sign it and collect your tracking receipt." },
    ],
    audience: [
      "New CNIC, Applying for the very first time (age 18+)",
      "Correction / Update, Fixing details (name, DOB, marital status, address)",
      "Replacement / Renewal, CNIC is expired, lost, stolen, or damaged",
    ],
    outcomes: [
      "Answer a few questions about your application type",
      "Receive a custom roadmap and document checklist",
      "Validate your application against pre-submission requirements",
    ],
    faqs: [
      ["How long does it take and what does it cost?", "Around 7-10 days on the Executive track. Fees: Executive Rs 2500, Urgent Rs 1500, Normal Rs 750 (excluding delivery fee)."],
      ["Is this official legal advice?", "This wizard provides general guidance based on publicly available information and should not be considered legal advice. Requirements may vary and can change over time. Always verify current procedures with your local NADRA office."],
    ],
    media: [
      img("guide-cnic", "hero.png", "Pakistani CNIC guide"),
    ],
    related: ["guide-passport", "guide-frc", "guide-birth-cert"],
  },

  // ───────────────────────────────────────────────────────────────────────────
  "guide-birth-cert": {
    slug: "guide-birth-cert",
    badge: "Step-by-Step",
    tagline: "Union Council CBRC & NADRA B-Form",
    overview: [
      "The Birth Certificate is an official civil document issued by local Union Councils or NADRA in Pakistan. It serves as primary evidence of birth and is required for legal, educational, and immigration purposes (USCIS, NVC, etc.).",
    ],
    highlights: [
      { icon: "Users", title: "Parents' CNIC / NICOP (Valid)", text: "Originals of both parents required for verification." },
      { icon: "ScrollText", title: "Nikah Nama Copy", text: "Proof of parents' marriage, relationship verification." },
      { icon: "MapPin", title: "Proof of Residence", text: "Utility bill, tenancy agreement, or domicile certificate." },
      { icon: "FileText", title: "Hospital Discharge / Birth Notification Slip", text: "Required only for hospital births, primary evidence of birth." },
      { icon: "Users", title: "2 Witness CNICs", text: "Required only for home births, witnesses must be non-relatives." },
      { icon: "FileText", title: "Affidavit (Sworn Statement)", text: "Mandatory for home births or late registration; signed by both parents." },
    ],
    steps: [
      { title: "Gather Evidence", text: "Collect mandatory proofs for your specific age group and birth setting. Original CNICs of parents and Nikah Nama are essential. Vaccination cards or hospital slips should be gathered if available." },
      { title: "Union Council (CBRC)", text: "Visit your local Union Council or Municipal Corporation. Submit the application form along with required documents. Pay the applicable fee. Wait for the processing and pick up your computerized birth certificate (CBRC)." },
      { title: "NADRA B-Form", text: "Present the UC CBRC at a NADRA Registration Center. Complete the biometric process for the child. Pay the NADRA fee (Normal Rs. 50 / Urgent Rs. 500). Receive the token." },
      { title: "Collection", text: "Track your application status via 1777 or SMS. Visit the NADRA center to collect the final B-Form or CNIC. Verify all details and spellings on the document immediately." },
    ],
    audience: [
      "New Registration, First-time CBRC registration at Union Council.",
      "Correction, Fixing errors in existing birth records.",
      "Replacement, Reissuing lost or damaged certificates.",
    ],
    outcomes: [
      "Select the reason for your request and who the certificate is for",
      "Choose the current age to help us determine the correct process and requirements.",
      "Provide the information where the birth took place.",
      "Get a tailored roadmap + checklist (what to request, verify, and upload).",
      "Validate the final certificate before submission.",
    ],
    faqs: [
      ["How long does it take?", "3-15 working days."],
      ["Is this official legal advice?", "This wizard provides general guidance. Requirements vary by province and Union Council. Always verify with local authorities."],
    ],
    media: [
      img("guide-birth-cert", "hero.png", "Birth Certificate guide"),
    ],
    related: ["guide-cnic", "guide-frc", "guide-nikah-nama"],
  },

  // ───────────────────────────────────────────────────────────────────────────
  "guide-frc": {
    slug: "guide-frc",
    badge: "Step-by-Step",
    tagline: "NADRA • Immigration & Official Purpose",
    overview: [
      "The Family Registration Certificate (FRC) is an official document issued by NADRA that lists your registered family members as recorded in their database. It is commonly required for visa applications, embassy submissions, and legal verification of family relationships.",
    ],
    highlights: [
      { icon: "FileText", title: "Applicant CNIC/NICOP/POC", text: "Valid 13-digit identification document (original + copy)." },
      { icon: "Users", title: "Family Members CNIC", text: "CNIC copies of all adult family members to be listed." },
      { icon: "FileText", title: "Child Registration Certificate (CRC)", text: "Form-B for children under 18 years of age." },
      { icon: "ScrollText", title: "Nikah Nama / Marriage Certificate", text: "Required if applying for FRC By Marriage category." },
      { icon: "FileText", title: "Death Certificate (if applicable)", text: "For deceased family members, issued by Union Council or Municipal Corporation." },
      { icon: "Camera", title: "Passport-size Photographs", text: "Recent photographs for online application via Pak Identity App." },
    ],
    steps: [
      { title: "Gather Required Documents", text: "Collect your original CNIC and its copy. Gather B-Form for children if applicable. Keep marriage certificate, divorce certificate, or death certificate if relevant. Ensure your family data is correctly updated in NADRA records before visiting." },
      { title: "Visit NADRA Registration Center", text: "Visit your nearest NADRA Registration Center (NRC). Take a token and wait for your turn. Inform the officer you want to apply for a Family Registration Certificate (FRC). Your family record will be retrieved from the system for verification." },
      { title: "Biometric Verification & Processing", text: "Your CNIC will be verified through biometric authentication if required. The officer will cross-check your family details in NADRA database. After confirmation and fee payment, your FRC will be generated." },
      { title: "Collect Printed FRC Certificate", text: "Receive your printed FRC certificate from the counter. Carefully verify names, CNIC numbers, and relationships before leaving the center. Report any errors immediately for correction." },
    ],
    audience: [
      "New Certificate, First-time FRC registration with NADRA",
      "Correction Needed, Fix errors in existing FRC document",
      "Replacement, Lost or damaged FRC certificate",
    ],
    outcomes: [
      "Answer a few questions about your FRC need",
      "Receive a custom roadmap and document checklist",
      "Validate your final certificate against immigration requirements",
    ],
    faqs: [
      ["How long does it take?", "1-3 working days."],
      ["Is this official legal advice?", "This wizard provides general guidance based on publicly available information and should not be considered legal advice. Requirements may vary and can change over time. Always verify current procedures with your local NADRA office and consult an immigration attorney for specific legal guidance."],
    ],
    media: [
      img("guide-frc", "hero.png", "Family Registration Certificate (FRC) guide"),
    ],
    related: ["guide-cnic", "guide-birth-cert", "guide-nikah-nama"],
  },

  // ───────────────────────────────────────────────────────────────────────────
  "guide-nikah-nama": {
    slug: "guide-nikah-nama",
    badge: "Step-by-Step",
    tagline: "Union Council & NADRA • 2026 Official Guide",
    overview: [
      "A Nikah Nama is the official Islamic marriage contract in Pakistan, which must be registered with the local Union Council (local government office) to become legally recognized. The Union Council issues an attested copy, which is then used to obtain a Marriage Registration Certificate (MRC) from NADRA, a computerized document required for legal, immigration, and visa purposes.",
    ],
    highlights: [
      { icon: "ScrollText", title: "Original Urdu Nikah Nama", text: "Signed by Nikah Khawan, Bride, Groom, and Witnesses." },
      { icon: "FileText", title: "CNIC of Bride & Groom", text: "Valid original CNICs plus photocopies." },
      { icon: "Users", title: "CNIC of Both Fathers", text: "Copies of bride's father and groom's father CNICs." },
      { icon: "Camera", title: "Passport Photos", text: "Two passport-size photos with white background." },
      { icon: "Globe", title: "Foreign Passport Copy", text: "Including entry stamp page to Pakistan (for a foreign partner)." },
      { icon: "FileText", title: "Divorce or Death Certificate", text: "NADRA Divorce Certificate or Spouse's Death Certificate (for a second marriage)." },
    ],
    steps: [
      { title: "Nikah Ceremony", text: "Licensed Nikah Khawan fills the handwritten Urdu Nikah Nama." },
      { title: "UC Registration", text: "Submit Urdu Nikah Nama and CNICs to Union Council for registration." },
      { title: "NADRA Issuance", text: "Collect the computerized Marriage Registration Certificate (MRC)." },
      { title: "MOFA Attestation", text: "Get the certificate attested by Ministry of Foreign Affairs (Mandatory for Visas)." },
    ],
    audience: [
      "Standard Registration, Both partners are Pakistani citizens (Single)",
      "Foreign Partner, One partner is a foreign national (e.g. US/UK Citizen)",
      "Second Marriage, One or both partners are Divorced or Widowed",
      "Age-Specific Case, Bride is under the age of 18",
    ],
    outcomes: [
      "Select your specific marriage case (Standard, Foreign Partner, etc.)",
      "Review the estimated fee structure for 2026",
      "Follow the step-by-step registration and attestation roadmap",
      "Generate a personalized document checklist",
      "Validate your final certificate details",
    ],
    faqs: [
      ["How long does it take?", "10-20 days."],
      ["What are the fees?", "Official UC fee: Rs 500-2,000 (standard). Urgent tracking: Rs 1,500-2,500. Lawyer/agent service: Rs 5,000-15,000. Consultant/legal firm: Rs 25,000-50,000. MOFA attestation and certified translations are charged separately."],
      ["Is this official legal advice?", "Fees and procedures are subject to change by local Union Councils. Always confirm with your local UC Secretary."],
    ],
    media: [
      img("guide-nikah-nama", "hero.png", "Marriage Registration (Nikah Nama) guide"),
    ],
    related: ["guide-birth-cert", "guide-frc", "translate"],
  },

  // ───────────────────────────────────────────────────────────────────────────
  "case-manager": {
    slug: "case-manager",
    badge: "Concierge",
    tagline: "One named expert who follows your case end to end.",
    overview: [
      "When you want a single point of contact through the whole journey, a Dedicated Case Manager is your named support contact: someone who knows your case, answers your questions, and coordinates reviews from start to finish.",
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
      ["Is it the same person each time?", "Yes, a dedicated case manager follows your case end to end."],
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
