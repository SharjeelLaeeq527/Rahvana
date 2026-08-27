import Link from "next/link";
import { PolicyData } from "../policy-data";

export const privacyPolicyData: PolicyData = {
  slug: "privacy-policy",
  badge: "Legal Document",
  title: "Privacy Policy",
  description:
    "This policy explains what Rahvana collects, why we collect it, who processes it, and the choices you have over your information.",
  effectiveDate: "April 22, 2026",
  website: "rahvana.com",
  importantNotice: {
    icon: "info",
    text: 
        "Rahvana is not a law firm, does not provide legal advice, and is not affiliated with USCIS, NVC, the Department of State, any embassy, or any government agency.",
  },
  sections: [
    {
      id: "overview",
      title: "1. Overview",
      content: (
        <>
          <p>
            Rahvana is owned and operated by Arachnie Inc, a Delaware, United States corporation.
            Rahvana provides immigration journey organization, document workflow, roadmap,
            educational, subscription, and related support tools.
          </p>
          <p>
            Because immigration workflows can involve sensitive personal information, this policy
            describes our practices for account data, immigration case data, uploaded documents,
            portal-wallet records, payment data, communications, analytics, and AI-assisted
            features.
          </p>
          <p>
            We do not sell your personal information. We do not use your immigration information to
            make government decisions, and we do not guarantee any immigration result, filing
            outcome, timeline, approval, interview result, or government action.
          </p>
        </>
      ),
    },
    {
      id: "information",
      title: "2. Information We Collect",
      content: (
        <>
          <p>We may collect the following categories of information:</p>
          <ul className="space-y-sm list-disc pl-md marker:text-primary-container">
            <li>
              <strong className="text-on-surface font-semibold">
                Account and contact information:
              </strong>{" "}
              name, email address, phone number, login identifiers, preferences, language settings,
              and account status.
            </li>
            <li>
              <strong className="text-on-surface font-semibold">
                Profile and immigration journey information:
              </strong>{" "}
              visa category, petitioner and beneficiary details, family and household details,
              addresses, travel history, case milestones, eligibility answers, checklist progress,
              appointment details, and user-entered notes.
            </li>
            <li>
              <strong className="text-on-surface font-semibold">
                Government and case identifiers:
              </strong>{" "}
              USCIS receipt numbers, USCIS online account numbers, NVC case numbers, invoice
              identifiers, CEAC or embassy-related references, courier tracking numbers, and similar
              identifiers you choose to provide.
            </li>
            <li>
              <strong className="text-on-surface font-semibold">Documents and file uploads:</strong>{" "}
              identity, passport, civil, financial, sponsorship, police clearance, medical,
              translation, form, evidence, receipt, notice, and other immigration-related documents
              that you upload.
            </li>
            <li>
              <strong className="text-on-surface font-semibold">Portal Wallet records:</strong>{" "}
              portal names, portal URLs, usernames, account emails, receipt numbers, security
              question labels and answers, and other login-related details you voluntarily save for
              USCIS, CEAC, courier, embassy, or similar portals.
            </li>
            <li>
              <strong className="text-on-surface font-semibold">
                Payment and subscription information:
              </strong>{" "}
              plan, product, add-on, billing status, Stripe customer identifiers, transaction
              identifiers, invoice status, refund status, and subscription history. We do not store
              full card numbers.
            </li>
            <li>
              <strong className="text-on-surface font-semibold">
                Support and consultation information:
              </strong>{" "}
              emails, messages, WhatsApp/contact preferences, appointment requests, uploaded
              consultation materials, feedback, and support history.
            </li>
            <li>
              <strong className="text-on-surface font-semibold">
                Device, usage, and analytics data:
              </strong>{" "}
              IP address, browser type, device information, pages visited, feature usage,
              interaction logs, error logs, cookie data, approximate location inferred from
              technical data, and marketing or analytics events.
            </li>
          </ul>
        </>
      ),
    },
    {
      id: "use",
      title: "3. How We Use Information",
      content: (
        <>
          <p>We use personal information to:</p>
          <ul className="space-y-sm list-disc pl-md marker:text-primary-container">
            <li>create, authenticate, secure, and manage your account;</li>
            <li>
              provide journey roadmaps, checklists, reminders, tools, and saved progress;
            </li>
            <li>store, organize, preview, export, and retrieve documents you upload;</li>
            <li>save portal-wallet records you choose to store;</li>
            <li>
              process payments, subscriptions, invoices, cancellations, refunds, and fraud checks;
            </li>
            <li>
              provide customer support, consultation scheduling, and service communications;
            </li>
            <li>personalize educational content and product functionality;</li>
            <li>
              monitor service reliability, debug errors, prevent abuse, and protect users;
            </li>
            <li>comply with applicable law, enforce our terms, and respond to lawful requests.</li>
          </ul>
          <p>
            We do not use your information to act as your attorney, accredited representative,
            filing representative, or government agent.
          </p>
        </>
      ),
    },
    {
      id: "sharing",
      title: "4. Sharing & Processors",
      content: (
        <>
          <p>
            We may share information with service providers that help us operate Rahvana, such as
            hosting, database, file storage, authentication, payment processing, analytics, email,
            messaging, customer support, error monitoring, security, and AI infrastructure
            providers.
          </p>
          <p>
            We require service providers to process personal information for our business purposes
            and to protect it using appropriate safeguards. We may also disclose information if
            required by law, to protect rights and safety, to enforce our terms, or as part of a
            merger, acquisition, financing, restructuring, or sale of assets.
          </p>
          <p>
            We do not sell or rent your personal information. We do not share full payment card
            numbers because those are handled by Stripe.
          </p>
        </>
      ),
    },
    {
      id: "payments",
      title: "5. Payments & Stripe",
      content: (
        <>
          <p>
            Rahvana uses Stripe and related payment infrastructure to process payments,
            subscriptions, invoices, customer portal access, fraud prevention, disputes, refunds,
            and tax or compliance records. Stripe may collect payment card data, billing
            information, device data, and transaction information directly under its own terms and
            privacy policy.
          </p>
          <p>
            Rahvana receives limited payment records from Stripe, such as customer IDs, subscription
            status, product or price IDs, invoice status, payment status, and transaction
            references. We do not store full card numbers, CVC codes, or complete bank account
            credentials on our servers.
          </p>
        </>
      ),
    },
    {
      id: "government",
      title: "6. Government Portals & USCIS",
      content: (
        <>
          <p>
            Rahvana is not USCIS, NVC, the Department of State, any embassy, any consulate, or any
            government portal. If you save government or portal information in Rahvana, you are
            choosing to store that information so you can organize your own case.
          </p>
          <p>
            We do not submit filings to USCIS, NVC, CEAC, an embassy, or a government agency unless
            a product feature expressly says so and you authorize that action. You remain
            responsible for verifying official forms, fees, deadlines, addresses, instructions,
            signatures, translations, and submissions directly with official government sources.
          </p>
        </>
      ),
    },
    {
      id: "uscis-api",
      title: "7. USCIS API Case Tracking",
      content: (
        <>
          <p>
            If USCIS Case Status API tracking is enabled, Rahvana may send the USCIS receipt number
            you provide to USCIS through the USCIS Torch API platform to retrieve case status
            information. We use this feature only when you request a lookup or enable related
            tracking, and only for cases you confirm you own or are authorized to check.
          </p>
          <p>
            The information sent to USCIS for a case-status lookup may include the receipt number,
            technical request metadata, and Rahvana&apos;s USCIS developer application credentials.
            USCIS processes information it receives according to its own security, privacy, API, and
            government records policies.
          </p>
          <p>
            We use USCIS API credentials only through backend services we control. We do not expose
            USCIS client secrets in frontend code, mobile code, public repositories, emails, or
            user-accessible logs. USCIS API keys and tokens are treated as confidential operational
            credentials and are rotated, restricted, and replaced as required by USCIS policy or if
            compromise is suspected.
          </p>
          <p>
            USCIS API results may be delayed, unavailable, incomplete, or different from notices you
            receive directly from USCIS. Always verify important case information through official
            USCIS channels and notices.
          </p>
        </>
      ),
    },
    {
      id: "ai",
      title: "8. AI-Assisted Features",
      content: (
        <>
          <p>
            Some Rahvana features may use AI or automated processing to summarize information,
            organize documents, draft educational guidance, analyze form fields, or improve support
            responses. AI outputs can be incomplete, outdated, or incorrect and must not be treated
            as legal advice.
          </p>
          <p>
            Do not enter information into AI-assisted features unless you are comfortable with that
            information being processed to provide the requested feature. We use AI-assisted
            processing only to provide and improve Rahvana services, not to represent you before any
            government agency.
          </p>
        </>
      ),
    },
    {
      id: "cookies",
      title: "9. Cookies & Analytics",
      content: (
        <>
          <p>
            We use cookies and similar technologies for authentication, security, preferences,
            analytics, performance, and product improvement. Analytics tools may collect usage
            events, device information, approximate location, and referral data.
          </p>
          <p>
            For more detail, see our{" "}
            <Link href="/cookie-policy" className="text-primary-container hover:underline">
              Cookie Policy
            </Link>
            .
          </p>
        </>
      ),
    },
    {
      id: "rights",
      title: "10. Your Privacy Rights",
      content: (
        <>
          <p>
            Depending on where you live, you may have rights to request access, correction,
            deletion, portability, restriction, or objection to certain processing of your personal
            information. You may also have the right to opt out of certain targeted advertising,
            sale, or sharing activities where those concepts apply under privacy law.
          </p>
          <p>
            To make a request, contact{" "}
            <a
              href="mailto:support@rahvana.com"
              className="text-primary-container hover:underline"
            >
              support@rahvana.com
            </a>
            . We may verify your identity before fulfilling a request. We will not discriminate
            against you for exercising privacy rights, but some features may not work if required
            data is deleted.
          </p>
        </>
      ),
    },
    {
      id: "retention",
      title: "11. Retention",
      content: (
        <>
          <p>
            We retain information while your account is active or as needed to provide services,
            comply with legal obligations, resolve disputes, enforce agreements, prevent abuse,
            maintain security, and keep business records.
          </p>
          <p>
            Immigration documents, case records, portal-wallet records, and journey data may remain
            in your account until you delete them, request deletion, or close your account, subject
            to backups and legal retention requirements. Payment and tax records may be retained
            longer where required for accounting, tax, chargeback, fraud-prevention, or legal
            compliance.
          </p>
        </>
      ),
    },
    {
      id: "security",
      title: "12. Security",
      content: (
        <>
          <p>
            We use administrative, technical, and organizational safeguards designed to protect
            personal information, including access controls, encryption in transit, and security
            monitoring. Sensitive immigration and portal-wallet data should be treated carefully by
            users and should only be uploaded or saved when needed for the service.
          </p>
          <p>
            No online system is completely secure. If we discover a data breach requiring notice, we
            will notify affected users and regulators as required by applicable law.
          </p>
        </>
      ),
    },
    {
      id: "children",
      title: "13. Children",
      content: (
        <p>
          Rahvana is not directed to children under 13. We do not knowingly collect personal
          information from children under 13. Immigration cases may involve information about family
          members or children supplied by an adult account holder; the adult user is responsible for
          having authority to provide that information.
        </p>
      ),
    },
    {
      id: "changes",
      title: "14. Changes",
      content: (
        <p>
          We may update this Privacy Policy from time to time. If changes are material, we will take
          reasonable steps to notify users, such as updating the effective date, posting a notice,
          or sending an account communication.
        </p>
      ),
    },
    {
      id: "contact",
      title: "15. Contact",
      content: (
        <div className="bg-surface-container-low p-md">
          <p className="text-on-surface-variant mb-xs">
            If you have any questions or concerns about this Privacy Policy, please contact us at:
          </p>
          <p className="text-on-surface font-semibold mb-xs">Rahvana / Arachnie Inc</p>
          <p className="text-on-surface-variant mb-xs">
            Email:{" "}
            <a
              href="mailto:support@rahvana.com"
              className="text-primary-container hover:underline"
            >
              support@rahvana.com
            </a>
          </p>
          <p className="text-on-surface-variant">
            Website:{" "}
            <a href="https://rahvana.com" className="text-primary-container hover:underline">
              rahvana.com
            </a>
          </p>
        </div>
      ),
    },
  ],
};
