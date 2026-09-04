import React from "react";

export interface ArticleSchemaProps {
  headline?: string;
  description?: string;
  url?: string;
  datePublished?: string;
  dateModified?: string;
  authorName?: string;
  authorUrl?: string;
  publisherName?: string;
  publisherLogo?: string;
  image?: string[];
}

export default function ArticleSchema({
  headline = "",
  description = "",
  url = "https://rahvana.com/blog",
  datePublished,
  dateModified,
  authorName = "Rahvana Immigration Research Team",
  authorUrl = "https://rahvana.com/about",
  publisherName = "Rahvana",
  publisherLogo = "https://rahvana.com/icon.png",
  image = ["https://rahvana.com/opengraph-image.png"],
}: ArticleSchemaProps) {
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
    headline,
    description,
    image,
    ...(datePublished ? { datePublished } : {}),
    ...(dateModified ? { dateModified } : {}),
    author: {
      "@type": "Organization",
      name: authorName,
      url: authorUrl,
    },
    publisher: {
      "@type": "Organization",
      name: publisherName,
      logo: {
        "@type": "ImageObject",
        url: publisherLogo,
      },
    },
    inLanguage: "en-US",
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
    />
  );
}
