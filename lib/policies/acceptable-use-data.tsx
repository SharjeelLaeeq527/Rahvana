import { PolicyData } from "../policy-data";

export const acceptableUsePolicyData: PolicyData = {
  slug: "acceptable-use",
  badge: "Legal Document",
  title: "Acceptable Use Policy",
  description:
    "These guidelines define how Rahvana may and may not be used. Violations may result in account suspension or termination.",
  effectiveDate: "March 17, 2026",
  website: "rahvana.com",
  sections: [
    {
      id: "purpose",
      title: "1. Purpose",
      content: (
        <p>
          This Acceptable Use Policy (&quot;AUP&quot;) outlines the rules and guidelines for using
          Rahvana&apos;s immigration roadmap platform. By using our services, you agree to comply
          with this AUP. Violations may result in account suspension or termination.
        </p>
      ),
    },
    {
      id: "permitted",
      title: "2. Permitted Uses",
      content: (
        <>
          <p>Rahvana is designed for:</p>
          <ul className="space-y-sm list-disc pl-md marker:text-primary-container">
            <li>Personal immigration journey tracking and planning</li>
            <li>Organizing documents for various US visa categories and related processes</li>
            <li>Accessing educational immigration resources and guides</li>
            <li>Tracking checklist progress for personal immigration cases</li>
          </ul>
        </>
      ),
    },
    {
      id: "prohibited",
      title: "3. Prohibited Activities",
      content: (
        <>
          <h3 className="text-base font-bold text-on-surface mt-md mb-sm">3.1 Legal Violations</h3>
          <ul className="space-y-sm list-disc pl-md marker:text-error">
            <li>Using the platform for any illegal purpose under applicable law</li>
            <li>Submitting false or fraudulent immigration information</li>
            <li>Impersonating USCIS, NVC, or any government agency</li>
            <li>
              Using the platform to facilitate unauthorized immigration advice for compensation
            </li>
            <li>
              Representing Rahvana as a law firm, attorney, accredited representative, government
              agency, or official government service
            </li>
            <li>
              Using USCIS API-powered features to look up cases you do not own or are not
              authorized to monitor
            </li>
          </ul>

          <h3 className="text-base font-bold text-on-surface mt-md mb-sm">3.2 Platform Abuse</h3>
          <ul className="space-y-sm list-disc pl-md marker:text-error">
            <li>Attempting to gain unauthorized access to other user accounts</li>
            <li>Probing, scanning, or testing the vulnerability of our systems</li>
            <li>Introducing malware, viruses, or malicious code</li>
            <li>Attempting to overload our servers through automated requests</li>
            <li>Scraping or harvesting our proprietary content or user data</li>
          </ul>

          <h3 className="text-base font-bold text-on-surface mt-md mb-sm">
            3.3 Content Violations
          </h3>
          <ul className="space-y-sm list-disc pl-md marker:text-error">
            <li>Uploading content that infringes third-party intellectual property</li>
            <li>Sharing personal information of others without consent</li>
            <li>Distributing offensive, harassing, or abusive content</li>
            <li>
              Uploading documents that you do not have the right to use, store, process, or share
            </li>
          </ul>
        </>
      ),
    },
    {
      id: "account-sharing",
      title: "4. Account Sharing",
      content: (
        <div className="bg-surface-container-low p-md">
          <p className="text-on-surface font-semibold mb-xs">Account Sharing is Prohibited</p>
          <p>
            Rahvana subscriptions are for individual use only. Sharing account credentials is
            prohibited. Each user must have their own account. If we detect account sharing, we
            reserve the right to suspend or terminate the account without refund.
          </p>
        </div>
      ),
    },
    {
      id: "reporting",
      title: "5. Reporting Violations",
      content: (
        <p>
          If you become aware of any violation of this AUP, please report it to us at:{" "}
          <a href="mailto:legal@rahvana.com" className="text-primary-container hover:underline">
            legal@rahvana.com
          </a>
          . We take all reports seriously and will investigate promptly.
        </p>
      ),
    },
    {
      id: "enforcement",
      title: "6. Enforcement",
      content: (
        <>
          <p>Violations of this AUP may result in:</p>
          <ul className="space-y-sm list-disc pl-md marker:text-primary-container">
            <li>
              <strong className="text-on-surface font-semibold">Warning:</strong> Request to remedy
              the violation immediately
            </li>
            <li>
              <strong className="text-on-surface font-semibold">Suspension:</strong> Temporary
              suspension of account access
            </li>
            <li>
              <strong className="text-on-surface font-semibold">Termination:</strong> Permanent
              account termination without refund
            </li>
            <li>
              <strong className="text-on-surface font-semibold">Legal Action:</strong> Referral to
              law enforcement where warranted
            </li>
          </ul>
        </>
      ),
    },
    {
      id: "contact",
      title: "7. Contact",
      content: (
        <div className="bg-surface-container-low p-md">
          <p className="text-on-surface-variant mb-xs">
            If you have any questions or concerns about this AUP, please contact us at:
          </p>
          <p className="text-on-surface font-semibold mb-xs">Rahvana Legal Team</p>
          <p className="text-on-surface-variant mb-xs">
            Email:{" "}
            <a href="mailto:support@rahvana.com" className="text-primary-container hover:underline">
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
