"use client";

import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";

const sections = [
  { id: "overview", title: "1. Overview" },
  { id: "information", title: "2. Information We Collect" },
  { id: "use", title: "3. How We Use Information" },
  { id: "sharing", title: "4. Sharing & Processors" },
  { id: "payments", title: "5. Payments & Stripe" },
  { id: "government", title: "6. Government Portals & USCIS" },
  { id: "uscis-api", title: "7. USCIS API Case Tracking" },
  { id: "ai", title: "8. AI-Assisted Features" },
  { id: "cookies", title: "9. Cookies & Analytics" },
  { id: "rights", title: "10. Your Privacy Rights" },
  { id: "retention", title: "11. Retention" },
  { id: "security", title: "12. Security" },
  { id: "children", title: "13. Children" },
  { id: "changes", title: "14. Changes" },
  { id: "contact", title: "15. Contact" },
];

export default function PrivacyPolicy() {
  const [activeSection, setActiveSection] = useState("overview");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        });
      },
      { rootMargin: "-20% 0px -70% 0px" },
    );

    sections.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <div className="bg-white border-b border-gray-100">
        <div className="site-main-px site-main-py">
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-5">
            <Link href="/" className="hover:text-teal-600">
              Home
            </Link>
            <span>/</span>
            <span className="text-gray-600">Privacy Policy</span>
          </div>

          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-teal-50 border border-teal-200 rounded-full px-4 py-1.5 text-teal-700 text-xs font-medium mb-5">
              Legal Document
            </div>

            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Privacy Policy
            </h1>

            <p className="text-gray-500 text-lg leading-relaxed">
              This policy explains what Rahvana collects, why we collect it,
              who processes it, and the choices you have over your information.
            </p>

            <div className="flex flex-wrap gap-6 mt-5 text-sm text-gray-400">
              <span>
                Effective Date:{" "}
                <span className="text-gray-700 font-medium">
                  April 22, 2026
                </span>
              </span>
              <span>
                Website:{" "}
                <span className="text-gray-700 font-medium">rahvana.com</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="site-main-px site-main-py">
        <div className="flex gap-10 mx-auto">
          <aside className="hidden lg:block w-72 shrink-0">
            <div className="sticky top-8">
              <p className="text-xs font-semibold text-gray-400 uppercase mb-4">
                Contents
              </p>

              {sections.map((s) => (
                <button
                  key={s.id}
                  onClick={() => scrollTo(s.id)}
                  className={`block w-full text-left px-3 py-2 rounded text-sm ${
                    activeSection === s.id
                      ? "bg-teal-50 text-teal-700"
                      : "text-gray-400 hover:text-gray-700"
                  }`}
                >
                  {s.title}
                </button>
              ))}
            </div>
          </aside>

          <main className="flex-1 max-w-4xl">
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-10">
              <p className="text-sm text-amber-800 leading-relaxed">
                <strong>Important:</strong> Rahvana is not a law firm, does not
                provide legal advice, and is not affiliated with USCIS, NVC, the
                Department of State, any embassy, or any government agency.
              </p>
            </div>

            <Section id="overview" title="1. Overview">
              <p>
                Rahvana is owned and operated by Arachnie Inc, a Delaware,
                United States corporation. Rahvana provides immigration journey
                organization, document workflow, roadmap, educational,
                subscription, and related support tools.
              </p>
              <p>
                Because immigration workflows can involve sensitive personal
                information, this policy describes our practices for account
                data, immigration case data, uploaded documents, portal-wallet
                records, payment data, communications, analytics, and
                AI-assisted features.
              </p>
              <p>
                We do not sell your personal information. We do not use your
                immigration information to make government decisions, and we do
                not guarantee any immigration result, filing outcome, timeline,
                approval, interview result, or government action.
              </p>
            </Section>

            <Section id="information" title="2. Information We Collect">
              <p>We may collect the following categories of information:</p>
              <ul>
                <li>
                  <strong>Account and contact information:</strong> name, email
                  address, phone number, login identifiers, preferences,
                  language settings, and account status.
                </li>
                <li>
                  <strong>Profile and immigration journey information:</strong>
                  visa category, petitioner and beneficiary details, family and
                  household details, addresses, travel history, case milestones,
                  eligibility answers, checklist progress, appointment details,
                  and user-entered notes.
                </li>
                <li>
                  <strong>Government and case identifiers:</strong> USCIS
                  receipt numbers, USCIS online account numbers, NVC case
                  numbers, invoice identifiers, CEAC or embassy-related
                  references, courier tracking numbers, and similar identifiers
                  you choose to provide.
                </li>
                <li>
                  <strong>Documents and file uploads:</strong> identity,
                  passport, civil, financial, sponsorship, police clearance,
                  medical, translation, form, evidence, receipt, notice, and
                  other immigration-related documents that you upload.
                </li>
                <li>
                  <strong>Portal Wallet records:</strong> portal names, portal
                  URLs, usernames, account emails, receipt numbers, security
                  question labels and answers, and other login-related details
                  you voluntarily save for USCIS, CEAC, courier, embassy, or
                  similar portals.
                </li>
                <li>
                  <strong>Payment and subscription information:</strong> plan,
                  product, add-on, billing status, Stripe customer identifiers,
                  transaction identifiers, invoice status, refund status, and
                  subscription history. We do not store full card numbers.
                </li>
                <li>
                  <strong>Support and consultation information:</strong> emails,
                  messages, WhatsApp/contact preferences, appointment requests,
                  uploaded consultation materials, feedback, and support
                  history.
                </li>
                <li>
                  <strong>Device, usage, and analytics data:</strong> IP
                  address, browser type, device information, pages visited,
                  feature usage, interaction logs, error logs, cookie data,
                  approximate location inferred from technical data, and
                  marketing or analytics events.
                </li>
              </ul>
            </Section>

            <Section id="use" title="3. How We Use Information">
              <p>We use personal information to:</p>
              <ul>
                <li>create, authenticate, secure, and manage your account;</li>
                <li>provide journey roadmaps, checklists, reminders, tools, and saved progress;</li>
                <li>store, organize, preview, export, and retrieve documents you upload;</li>
                <li>save portal-wallet records you choose to store;</li>
                <li>process payments, subscriptions, invoices, cancellations, refunds, and fraud checks;</li>
                <li>provide customer support, consultation scheduling, and service communications;</li>
                <li>personalize educational content and product functionality;</li>
                <li>monitor service reliability, debug errors, prevent abuse, and protect users;</li>
                <li>comply with applicable law, enforce our terms, and respond to lawful requests.</li>
              </ul>
              <p>
                We do not use your information to act as your attorney,
                accredited representative, filing representative, or government
                agent.
              </p>
            </Section>

            <Section id="sharing" title="4. Sharing & Processors">
              <p>
                We may share information with service providers that help us
                operate Rahvana, such as hosting, database, file storage,
                authentication, payment processing, analytics, email, messaging,
                customer support, error monitoring, security, and AI
                infrastructure providers.
              </p>
              <p>
                We require service providers to process personal information for
                our business purposes and to protect it using appropriate
                safeguards. We may also disclose information if required by law,
                to protect rights and safety, to enforce our terms, or as part
                of a merger, acquisition, financing, restructuring, or sale of
                assets.
              </p>
              <p>
                We do not sell or rent your personal information. We do not
                share full payment card numbers because those are handled by
                Stripe.
              </p>
            </Section>

            <Section id="payments" title="5. Payments & Stripe">
              <p>
                Rahvana uses Stripe and related payment infrastructure to
                process payments, subscriptions, invoices, customer portal
                access, fraud prevention, disputes, refunds, and tax or
                compliance records. Stripe may collect payment card data,
                billing information, device data, and transaction information
                directly under its own terms and privacy policy.
              </p>
              <p>
                Rahvana receives limited payment records from Stripe, such as
                customer IDs, subscription status, product or price IDs, invoice
                status, payment status, and transaction references. We do not
                store full card numbers, CVC codes, or complete bank account
                credentials on our servers.
              </p>
            </Section>

            <Section id="government" title="6. Government Portals & USCIS">
              <p>
                Rahvana is not USCIS, NVC, the Department of State, any embassy,
                any consulate, or any government portal. If you save government
                or portal information in Rahvana, you are choosing to store that
                information so you can organize your own case.
              </p>
              <p>
                We do not submit filings to USCIS, NVC, CEAC, an embassy, or a
                government agency unless a product feature expressly says so and
                you authorize that action. You remain responsible for verifying
                official forms, fees, deadlines, addresses, instructions,
                signatures, translations, and submissions directly with official
                government sources.
              </p>
            </Section>

            <Section id="uscis-api" title="7. USCIS API Case Tracking">
              <p>
                If USCIS Case Status API tracking is enabled, Rahvana may send
                the USCIS receipt number you provide to USCIS through the USCIS
                Torch API platform to retrieve case status information. We use
                this feature only when you request a lookup or enable related
                tracking, and only for cases you confirm you own or are
                authorized to check.
              </p>
              <p>
                The information sent to USCIS for a case-status lookup may
                include the receipt number, technical request metadata, and
                Rahvana&apos;s USCIS developer application credentials. USCIS
                processes information it receives according to its own security,
                privacy, API, and government records policies.
              </p>
              <p>
                We use USCIS API credentials only through backend services we
                control. We do not expose USCIS client secrets in frontend code,
                mobile code, public repositories, emails, or user-accessible
                logs. USCIS API keys and tokens are treated as confidential
                operational credentials and are rotated, restricted, and
                replaced as required by USCIS policy or if compromise is
                suspected.
              </p>
              <p>
                USCIS API results may be delayed, unavailable, incomplete, or
                different from notices you receive directly from USCIS. Always
                verify important case information through official USCIS
                channels and notices.
              </p>
            </Section>

            <Section id="ai" title="8. AI-Assisted Features">
              <p>
                Some Rahvana features may use AI or automated processing to
                summarize information, organize documents, draft educational
                guidance, analyze form fields, or improve support responses. AI
                outputs can be incomplete, outdated, or incorrect and must not
                be treated as legal advice.
              </p>
              <p>
                Do not enter information into AI-assisted features unless you
                are comfortable with that information being processed to provide
                the requested feature. We use AI-assisted processing only to
                provide and improve Rahvana services, not to represent you
                before any government agency.
              </p>
            </Section>

            <Section id="cookies" title="9. Cookies & Analytics">
              <p>
                We use cookies and similar technologies for authentication,
                security, preferences, analytics, performance, and product
                improvement. Analytics tools may collect usage events, device
                information, approximate location, and referral data.
              </p>
              <p>
                For more detail, see our{" "}
                <Link href="/cookie-policy" className="text-teal-600">
                  Cookie Policy
                </Link>
                .
              </p>
            </Section>

            <Section id="rights" title="10. Your Privacy Rights">
              <p>
                Depending on where you live, you may have rights to request
                access, correction, deletion, portability, restriction, or
                objection to certain processing of your personal information.
                You may also have the right to opt out of certain targeted
                advertising, sale, or sharing activities where those concepts
                apply under privacy law.
              </p>
              <p>
                To make a request, contact{" "}
                <a href="mailto:support@rahvana.com" className="text-teal-600">
                  support@rahvana.com
                </a>
                . We may verify your identity before fulfilling a request. We
                will not discriminate against you for exercising privacy rights,
                but some features may not work if required data is deleted.
              </p>
            </Section>

            <Section id="retention" title="11. Retention">
              <p>
                We retain information while your account is active or as needed
                to provide services, comply with legal obligations, resolve
                disputes, enforce agreements, prevent abuse, maintain security,
                and keep business records.
              </p>
              <p>
                Immigration documents, case records, portal-wallet records, and
                journey data may remain in your account until you delete them,
                request deletion, or close your account, subject to backups and
                legal retention requirements. Payment and tax records may be
                retained longer where required for accounting, tax, chargeback,
                fraud-prevention, or legal compliance.
              </p>
            </Section>

            <Section id="security" title="12. Security">
              <p>
                We use administrative, technical, and organizational safeguards
                designed to protect personal information, including access
                controls, encryption in transit, and security monitoring.
                Sensitive immigration and portal-wallet data should be treated
                carefully by users and should only be uploaded or saved when
                needed for the service.
              </p>
              <p>
                No online system is completely secure. If we discover a data
                breach requiring notice, we will notify affected users and
                regulators as required by applicable law.
              </p>
            </Section>

            <Section id="children" title="13. Children">
              <p>
                Rahvana is not directed to children under 13. We do not
                knowingly collect personal information from children under 13.
                Immigration cases may involve information about family members
                or children supplied by an adult account holder; the adult user
                is responsible for having authority to provide that information.
              </p>
            </Section>

            <Section id="changes" title="14. Changes">
              <p>
                We may update this Privacy Policy from time to time. If changes
                are material, we will take reasonable steps to notify users,
                such as updating the effective date, posting a notice, or
                sending an account communication.
              </p>
            </Section>

            <Section id="contact" title="15. Contact">
              <p>Rahvana / Arachnie Inc</p>
              <p>
                Email:{" "}
                <a href="mailto:support@rahvana.com" className="text-teal-600">
                  support@rahvana.com
                </a>
              </p>
              <p>Website: rahvana.com</p>
            </Section>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link href="/terms" className="text-teal-600">
                Terms of Service
              </Link>
              <Link href="/acceptable-use" className="text-teal-600">
                Acceptable Use Policy
              </Link>
              <Link href="/cookie-policy" className="text-teal-600">
                Cookie Policy
              </Link>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="mb-10 scroll-mt-24">
      <h2 className="text-xl font-semibold mb-3 text-gray-950">{title}</h2>
      <div className="space-y-4 leading-relaxed text-gray-700">{children}</div>
    </section>
  );
}