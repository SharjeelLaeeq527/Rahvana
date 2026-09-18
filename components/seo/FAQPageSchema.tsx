import React from "react";

export interface FAQItem {
  question?: string;
  answer?: string;
}

export interface FAQPageSchemaProps {
  faqs?: FAQItem[];
}

export default function FAQPageSchema({ faqs }: FAQPageSchemaProps) {
  if (!faqs || faqs.length === 0) return null;

  const validFaqs = faqs.filter(
    (faq): faq is { question: string; answer: string } =>
      Boolean(faq && faq.question && faq.answer)
  );

  if (validFaqs.length === 0) return null;

  const schemaData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: validFaqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
    />
  );
}
