"use client";

import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";

const sections = [
  { id: "acceptance", title: "1. Acceptance" },
  { id: "service", title: "2. What Rahvana Provides" },
  { id: "not-law-firm", title: "3. Not a Law Firm" },
  { id: "government", title: "4. Government & USCIS Disclaimer" },
  { id: "uscis-api", title: "5. USCIS API Case Tracking" },
  { id: "accounts", title: "6. Accounts & User Duties" },
  { id: "documents", title: "7. Documents, Forms & Portal Data" },
  { id: "payments", title: "8. Payments, Subscriptions & Refunds" },
  { id: "acceptable-use", title: "9. Acceptable Use" },
  { id: "accessibility", title: "10. Accessibility" },
  { id: "ai", title: "11. AI and Automated Features" },
  { id: "third-party", title: "12. Third-Party Services" },
  { id: "ip", title: "13. Intellectual Property" },
  { id: "warranties", title: "14. Disclaimers" },
  { id: "liability", title: "15. Limitation of Liability" },
  { id: "indemnity", title: "16. Indemnity" },
  { id: "termination", title: "17. Suspension & Termination" },
  { id: "law", title: "18. Governing Law" },
  { id: "updates", title: "19. Updates" },
  { id: "contact", title: "20. Contact" },
];

export default function TermsOfService() {
  const [activeSection, setActiveSection] = useState("acceptance");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        });
      },
      { rootMargin: "-20% 0px -70% 0px" }
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
            <span className="text-gray-600">Terms of Service</span>
          </div>

          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-teal-50 border border-teal-200 rounded-full px-4 py-1.5 text-teal-700 text-xs font-medium mb-5">
              Legal Document
            </div>

            <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms of Service</h1>

            <p className="text-gray-500 text-lg leading-relaxed">
              These Terms govern access to Rahvana, including our immigration journey tools,
              subscriptions, document tools, portal-wallet features, and support services.
            </p>

            <div className="flex flex-wrap gap-6 mt-5 text-sm text-gray-400">
              <span>
                Effective Date: <span className="text-gray-700 font-medium">April 22, 2026</span>
              </span>
              <span>
                Website: <span className="text-gray-700 font-medium">rahvana.com</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="site-main-px site-main-py">
        <div className="flex gap-10">
          <aside className="hidden lg:block w-72 shrink-0">
            <div className="sticky top-8">
              <p className="text-xs font-semibold text-gray-400 uppercase mb-4">Contents</p>

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
                <strong>Core disclaimer:</strong> Rahvana is not a law firm, is not an attorney, is
                not an accredited representative, does not provide legal advice, does not create an
                attorney-client relationship, and is not affiliated with USCIS, NVC, the Department
                of State, any embassy, or any government agency.
              </p>
            </div>

            <Section id="acceptance" title="1. Acceptance">
              <p>
                By accessing or using Rahvana, you confirm that you have read, understood, and agree
                to these Terms, our{" "}
                <Link href="/privacy-policy" className="text-teal-600">
                  Privacy Policy
                </Link>
                , our{" "}
                <Link href="/cookie-policy" className="text-teal-600">
                  Cookie Policy
                </Link>
                , and our{" "}
                <Link href="/acceptable-use" className="text-teal-600">
                  Acceptable Use Policy
                </Link>
                . If you do not agree, do not use Rahvana.
              </p>
              <p>
                If you use Rahvana for or on behalf of another person, you represent that you have
                authority to provide that person&apos;s information and to manage the relevant
                account or case data.
              </p>
            </Section>

            <Section id="service" title="2. What Rahvana Provides">
              <p>
                Rahvana is owned and operated by Arachnie Inc, a Delaware, United States
                corporation. Rahvana provides digital immigration organization tools, educational
                resources, case roadmaps, checklists, document organization, status tracking, portal
                wallet tools, form-preparation utilities, reminders, subscription features, and
                related support.
              </p>
              <p>
                Rahvana is a self-help and workflow software platform. We may provide general
                educational information and administrative tools, but users remain responsible for
                deciding what to file, when to file, what evidence to submit, whether they are
                eligible for an immigration benefit, and whether to consult a licensed immigration
                attorney or accredited representative.
              </p>
            </Section>

            <Section id="not-law-firm" title="3. Not a Law Firm">
              <p>
                Rahvana does not provide legal advice, legal opinions, legal strategy, legal
                representation, attorney review, or government representation. Rahvana employees,
                contractors, tools, AI outputs, support communications, roadmap steps, checklists,
                calculators, and document tools are not substitutes for advice from a licensed
                attorney or accredited immigration representative.
              </p>
              <p>
                No attorney-client relationship, fiduciary relationship, or representative
                relationship is created by using Rahvana, purchasing a plan, uploading documents,
                receiving support, completing a questionnaire, booking a consultation, or reading
                generated guidance.
              </p>
              <p>
                For case-specific legal questions, deadlines, admissibility issues, prior denials,
                criminal history, misrepresentation, unlawful presence, waivers, removal history,
                public charge, affidavit-of-support concerns, complex family history, or any
                uncertainty, consult a licensed immigration attorney or accredited representative.
              </p>
            </Section>

            <Section id="government" title="4. Government & USCIS Disclaimer">
              <p>
                Rahvana is not USCIS, NVC, CEAC, the Department of State, CBP, ICE, any embassy, any
                consulate, or any government agency. Rahvana is not endorsed by, sponsored by,
                approved by, or officially connected to those entities.
              </p>
              <p>
                Government forms are generally available for free from official government websites.
                Government filing fees, biometrics fees, medical exam fees, embassy fees, courier
                fees, translation fees, police certificate fees, and other third-party charges are
                separate from Rahvana fees unless expressly stated otherwise.
              </p>
              <p>
                You are responsible for verifying the latest official forms, instructions, fees,
                filing addresses, editions, deadlines, signature requirements, translations,
                document standards, and submission methods directly with official government sources
                before filing or relying on information.
              </p>
              <p>
                Rahvana does not guarantee that information displayed in the platform reflects the
                latest government policy, processing time, fee, form edition, embassy procedure,
                consular instruction, or case status.
              </p>
            </Section>

            <Section id="uscis-api" title="5. USCIS API Case Tracking">
              <p>
                If Rahvana offers USCIS Case Status API tracking, you may use it only to check your
                own case or a case you are legally authorized to monitor. By requesting a
                case-status lookup, you authorize Rahvana to send the receipt number you provide to
                USCIS through the USCIS Torch API platform and to display the response to you.
              </p>
              <p>
                Case-status data retrieved from USCIS is provided for convenience and informational
                tracking only. It is not legal advice, does not replace official notices, and may
                not reflect the most recent agency action. Official USCIS notices, instructions, and
                secure USCIS account information control over any Rahvana display.
              </p>
              <p>
                You must not use Rahvana or the USCIS API feature for unauthorized bulk lookups,
                scraping, resale of USCIS data, monitoring cases without authorization, identity
                theft, stalking, harassment, fraud, or any activity that violates USCIS terms, API
                rules, rate limits, privacy rules, or applicable law.
              </p>
              <p>
                Rahvana will keep USCIS API client secrets and access tokens on backend systems we
                control and will not intentionally expose them to users, frontend applications,
                public repositories, emails, logs, or third parties except service providers that
                need access to operate the service under appropriate controls. You must not attempt
                to extract, misuse, share, or interfere with Rahvana&apos;s USCIS API credentials or
                access tokens.
              </p>
            </Section>

            <Section id="accounts" title="6. Accounts & User Duties">
              <p>
                You are responsible for maintaining accurate account information, safeguarding your
                login credentials, controlling access to your account, and promptly notifying us of
                suspected unauthorized access.
              </p>
              <p>
                You must provide truthful, lawful, and accurate information. You must not submit
                false, misleading, fraudulent, forged, or unlawfully obtained information or
                documents.
              </p>
            </Section>

            <Section id="documents" title="7. Documents, Forms & Portal Data">
              <p>
                You retain responsibility for all information, documents, images, forms, answers,
                case identifiers, portal records, and other materials you upload, enter, store,
                download, export, or use through Rahvana.
              </p>
              <p>
                Portal Wallet features are optional organizational tools. If you save portal
                credentials, security questions, receipt numbers, account emails, or similar data,
                you are responsible for ensuring you have authority to store that information and
                for keeping it current.
              </p>
              <p>
                Rahvana may help organize or populate form fields, but you must review every form,
                field, document, answer, packet, signature, translation, fee, and instruction before
                use or submission. You are solely responsible for final filings and submissions.
              </p>
            </Section>

            <Section id="payments" title="8. Payments, Subscriptions & Refunds">
              <p>
                Paid features may be offered as one-time purchases, subscriptions, monthly
                installments, add-ons, or service packages. Prices, included features, billing
                periods, renewal terms, and exclusions are shown at checkout or on the pricing page.
              </p>
              <p>
                Payments are processed through Stripe or other third-party payment providers. By
                paying through Stripe, you also agree to Stripe&apos;s applicable terms and
                understand that Stripe may process payment and fraud-prevention data under its own
                privacy practices.
              </p>
              <p>
                Unless a checkout screen or written refund policy says otherwise, subscription fees
                and digital-service purchases are non-refundable after access is provided, except
                where required by law. Canceling a subscription stops future renewals but does not
                automatically refund past charges.
              </p>
              <p>
                You agree not to initiate improper chargebacks or payment disputes for services you
                authorized and received. We may suspend or terminate access for unpaid invoices,
                failed payments, abuse, suspected fraud, or violation of these Terms.
              </p>
            </Section>

            <Section id="acceptable-use" title="9. Acceptable Use">
              <p>
                You may use Rahvana only for lawful personal or authorized administrative
                immigration organization purposes. You must not use Rahvana to impersonate a
                government agency, mislead users, provide unauthorized legal services, sell access
                to government services without authorization or value-add, falsify documents, commit
                fraud, evade sanctions, infringe rights, scrape data, or violate Stripe, government,
                or platform rules.
              </p>
              <p>
                Additional restrictions appear in our{" "}
                <Link href="/acceptable-use" className="text-teal-600">
                  Acceptable Use Policy
                </Link>
                .
              </p>
            </Section>

            <Section id="accessibility" title="10. Accessibility">
              <p>
                Rahvana aims to make its public website and user-facing tools accessible and to
                support USCIS API production review expectations for accessible applications,
                including Section 508 considerations where applicable. If you encounter an
                accessibility issue, contact support@rahvana.com so we can review and address it.
              </p>
            </Section>

            <Section id="ai" title="11. AI and Automated Features">
              <p>
                AI-assisted and automated features may produce inaccurate, incomplete, outdated, or
                unsuitable output. You are responsible for reviewing outputs before relying on them.
                AI output is not legal advice and must not be treated as a legal opinion or
                instruction from a government agency.
              </p>
            </Section>

            <Section id="third-party" title="12. Third-Party Services">
              <p>
                Rahvana may link to or interact with third-party services such as Stripe, USCIS,
                NVC, CEAC, embassy sites, courier providers, analytics tools, storage providers,
                messaging providers, or AI services. Third-party services are governed by their own
                terms and privacy policies. Rahvana is not responsible for third-party websites,
                outages, decisions, forms, fees, content, or actions.
              </p>
            </Section>

            <Section id="ip" title="13. Intellectual Property">
              <p>
                Rahvana, including its design, software, workflows, text, graphics, tools,
                templates, and proprietary content, is owned by Arachnie Inc or its licensors and is
                protected by intellectual property laws. You may use Rahvana only as permitted by
                these Terms.
              </p>
              <p>
                You retain ownership of documents and information you upload, subject to the license
                needed for Rahvana to host, process, display, analyze, export, transmit, and
                otherwise provide the service to you.
              </p>
            </Section>

            <Section id="warranties" title="14. Disclaimers">
              <p>
                Rahvana is provided on an &quot;as is&quot; and &quot;as available&quot; basis. To
                the maximum extent permitted by law, we disclaim all warranties, express or implied,
                including warranties of accuracy, completeness, timeliness, merchantability, fitness
                for a particular purpose, non-infringement, availability, and error-free operation.
              </p>
              <p>
                We do not guarantee approval, visa issuance, government acceptance, case speed,
                interview scheduling, document sufficiency, form accuracy, government-system
                availability, or any immigration outcome.
              </p>
            </Section>

            <Section id="liability" title="15. Limitation of Liability">
              <p>
                To the maximum extent permitted by law, Rahvana, Arachnie Inc, and their owners,
                officers, employees, contractors, affiliates, and service providers will not be
                liable for indirect, incidental, consequential, special, exemplary, or punitive
                damages, or for lost profits, lost data, lost opportunities, immigration delays,
                denials, refusals, rejections, missed deadlines, government fees, travel costs,
                attorney fees, or third-party charges.
              </p>
              <p>
                To the maximum extent permitted by law, our total liability for any claim related to
                Rahvana will not exceed the amount you paid Rahvana for the service giving rise to
                the claim during the 12 months before the event giving rise to liability.
              </p>
              <p>
                Some jurisdictions do not allow certain limitations, so some of these limits may not
                apply to you.
              </p>
            </Section>

            <Section id="indemnity" title="16. Indemnity">
              <p>
                You agree to defend, indemnify, and hold harmless Rahvana, Arachnie Inc, and their
                owners, officers, employees, contractors, affiliates, and service providers from
                claims, damages, liabilities, losses, costs, and expenses arising from your use of
                Rahvana, your content, your filings or submissions, your violation of these Terms,
                your violation of law, or your violation of another person&apos;s rights.
              </p>
            </Section>

            <Section id="termination" title="17. Suspension & Termination">
              <p>
                We may suspend, limit, or terminate access if we believe you violated these Terms,
                created legal or security risk, failed to pay, abused the platform, submitted
                fraudulent information, or used Rahvana in a way that may violate law, Stripe rules,
                government rules, or third-party rights.
              </p>
            </Section>

            <Section id="law" title="18. Governing Law">
              <p>
                These Terms are governed by the laws of the State of Delaware, United States,
                without regard to conflict-of-law principles, unless applicable law requires
                otherwise.
              </p>
            </Section>

            <Section id="updates" title="19. Updates">
              <p>
                We may update these Terms from time to time. If changes are material, we will take
                reasonable steps to notify users, such as updating the effective date, posting a
                notice, or sending an account communication. Continued use after changes means you
                accept the updated Terms.
              </p>
            </Section>

            <Section id="contact" title="20. Contact">
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
              <Link href="/privacy-policy" className="text-teal-600">
                Privacy Policy
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

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="mb-10 scroll-mt-24">
      <h2 className="text-xl font-semibold mb-3 text-gray-950">{title}</h2>
      <div className="space-y-4 leading-relaxed text-gray-700">{children}</div>
    </section>
  );
}
