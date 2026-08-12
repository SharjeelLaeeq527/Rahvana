import { PolicyData } from "../policy-data";

export const cookiePolicyData: PolicyData = {
  slug: "cookie-policy",
  badge: "Legal Document",
  title: "Cookie Policy",
  description: "How we use cookies on rahvana.com.",
  effectiveDate: "March 17, 2026",
  website: "rahvana.com",
  sections: [
    {
      id: "what",
      title: "1. What Are Cookies?",
      content: (
        <p>
          Cookies are small files stored in your browser that help websites remember you and work
          properly.
        </p>
      ),
    },
    {
      id: "types",
      title: "2. Cookies We Use",
      content: (
        <ul className="space-y-sm list-disc pl-md marker:text-primary-container">
          <li>
            <strong className="text-on-surface font-semibold">Essential:</strong> Keep you logged
            in and secure. Cannot be disabled.
          </li>
          <li>
            <strong className="text-on-surface font-semibold">Payment (Stripe):</strong> Fraud
            prevention during checkout. Required for payments.
          </li>
          <li>
            <strong className="text-on-surface font-semibold">Functional:</strong> Remember your
            preferences and save your progress.
          </li>
          <li>
            <strong className="text-on-surface font-semibold">Analytics:</strong> Understand how
            visitors use Rahvana (anonymous data).
          </li>
        </ul>
      ),
    },
    {
      id: "managing",
      title: "3. Managing Cookies",
      content: (
        <p>
          You can control or disable cookies through your browser settings. Disabling essential
          cookies may prevent login and core features from working. To opt out of Google Analytics,
          visit{" "}
          <a
            href="https://tools.google.com/dlpage/gaoptout"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-container hover:underline"
          >
            tools.google.com/dlpage/gaoptout
          </a>
          .
        </p>
      ),
    },
    {
      id: "consent",
      title: "4. Your Consent",
      content: (
        <p>
          By using Rahvana, you consent to our use of essential and payment cookies. You may opt
          out of analytics cookies at any time via your browser settings.
        </p>
      ),
    },
    {
      id: "contact",
      title: "5. Contact",
      content: (
        <div className="bg-surface-container-low p-md">
          <p className="text-on-surface-variant mb-xs">
            If you have any questions or concerns about this Cookie Policy, please contact us at:
          </p>
          <p className="text-on-surface font-semibold mb-xs">Rahvana Legal Team</p>
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
