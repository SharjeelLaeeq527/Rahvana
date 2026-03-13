import React from "react";

interface LinkItem {
  text: string;
  url: string;
}

export function renderTextWithLinks(
  text: string,
  links: LinkItem[] = [],
  linkClass = "font-semibold underline underline-offset-2"
) {
  if (!links.length) return text;

  const sortedLinks = [...links].sort(
    (a, b) => b.text.length - a.text.length
  );

  let parts: (string | React.ReactNode)[] = [text];

  sortedLinks.forEach((link) => {
    const newParts: (string | React.ReactNode)[] = [];

    parts.forEach((part) => {
      if (typeof part === "string" && part.includes(link.text)) {
        const subParts = part.split(link.text);

        subParts.forEach((subPart, i) => {
          newParts.push(subPart);

          if (i < subParts.length - 1) {
            newParts.push(
              <a
                key={`${link.text}-${i}`}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className={linkClass}
              >
                {link.text}
              </a>
            );
          }
        });
      } else {
        newParts.push(part);
      }
    });

    parts = newParts;
  });

  return parts;
}