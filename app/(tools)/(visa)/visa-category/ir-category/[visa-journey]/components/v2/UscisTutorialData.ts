export interface TutorialStep {
  label: string;
  heading: string;
  instruction: string;
  screenshot: string;
  alt: string;
  caption: string;
  note: string | null;
}

export const USCIS_TUTORIAL_STEPS: TutorialStep[] = [
  {
    label: 'Step 1 of 7 — Open the USCIS sign-up page',
    heading: 'Go to the official USCIS account sign-up page',
    instruction: 'In your browser, navigate to <strong>myaccount.uscis.gov/create-account</strong>. You will land on the USCIS sign-up page where you can enter your email address to begin.',
    screenshot: '/assets/uscis-step-01-landing.png',
    alt: 'USCIS account sign-up page showing the email entry field and Sign Up button',
    caption: 'myaccount.uscis.gov/create-account — the official USCIS account creation page',
    note: null,
  },
  {
    label: 'Step 2 of 7 — Enter your email address',
    heading: "Enter the petitioner's email address",
    instruction: 'Enter a valid email address the petitioner actively monitors. Type it a second time to confirm, then click <strong>Sign Up</strong>. All USCIS case notices — including Requests for Evidence — will go to this address.',
    screenshot: '/assets/uscis-step-02-email.png',
    alt: 'USCIS sign-up form with email and confirm-email fields filled in',
    caption: 'Use a personal email address the petitioner checks regularly.',
    note: 'Do not use a shared, work, or temporary email. USCIS sends mail from myaccount@uscis.dhs.gov — add it to your safe-senders list to avoid missing notices.',
  },
  {
    label: 'Step 3 of 7 — Create a password',
    heading: 'Set a strong account password',
    instruction: 'Create a password between <strong>8 and 64 characters</strong>. Letters, numbers, and special characters are all accepted. Enter it twice to confirm, then continue.',
    screenshot: '/assets/uscis-step-03-password.png',
    alt: 'USCIS password creation screen with both password fields filled',
    caption: "Choose a strong, unique password you don't use on other sites.",
    note: null,
  },
  {
    label: 'Step 4 of 7 — Set up two-step verification',
    heading: 'Choose a two-step verification method',
    instruction: 'USCIS requires two-step verification on every login. Choose one method: <strong>authentication app</strong> (most reliable), <strong>SMS text message</strong>, or <strong>email</strong>. Complete the prompt to activate it.',
    screenshot: '/assets/uscis-step-04-verification.png',
    alt: 'USCIS two-step verification screen showing Auth App, SMS, and Email options',
    caption: 'An authenticator app (Google Authenticator, Authy, etc.) is the most reliable method.',
    note: null,
  },
  {
    label: 'Step 5 of 7 — Save your backup code',
    heading: 'Copy and store your one-time backup code',
    instruction: 'After verification setup, USCIS shows a <strong>one-time backup code</strong>. Copy it immediately and store it somewhere safe — this is the only recovery option if you lose access to your verification device.',
    screenshot: '/assets/uscis-step-05-backup-code.png',
    alt: 'USCIS screen displaying the one-time backup code',
    caption: 'The backup code is shown only once. Save it in a secure password manager or write it down.',
    note: 'If you skip this and later lose your phone or change your number, you may be permanently locked out of your USCIS account. Do not skip.',
  },
  {
    label: 'Step 6 of 7 — Answer 5 security questions',
    heading: 'Select and answer five security questions',
    instruction: 'USCIS asks you to choose and answer <strong>five security questions</strong>. These are used to verify identity during password resets. Pick questions with answers only you know, and record both the questions and answers.',
    screenshot: '/assets/uscis-step-06-security-questions.png',
    alt: 'USCIS security questions screen with five dropdown and answer field pairs',
    caption: 'Answer all five before clicking Save and Continue.',
    note: "You will record these same answers in Rahvana's Portal Wallet. Keep your wording consistent — capitalization and spelling matter when you are asked to re-enter them.",
  },
  {
    label: 'Step 7 of 7 — Choose account type and finish',
    heading: 'Select your account type to complete setup',
    instruction: 'You will see a "Welcome to your USCIS Account" screen. Select <strong>myUSCIS</strong>, then choose <strong>"I am an applicant, petitioner, or requestor"</strong> and click Submit. A confirmation email will arrive from myaccount@uscis.dhs.gov.',
    screenshot: '/assets/uscis-step-07-account-type.png',
    alt: 'USCIS account type selection screen with applicant/petitioner/requestor option visible',
    caption: 'Select the correct account type — choosing incorrectly limits what forms you can file.',
    note: "Check your spam folder if the confirmation email doesn't arrive within 10 minutes. Once confirmed, your USCIS account is active — return here to save your credentials.",
  },
];
