"use client";

import React from "react";

interface HydrationSafeButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: string;
  size?: string;
}

/**
 * A button component that handles browser extension attributes that cause hydration mismatches
 * Commonly caused by extensions that inject attributes like fdprocessedid
 */
const HydrationSafeButton: React.FC<HydrationSafeButtonProps> = ({
  className,
  children,
  ...props
}) => {
  // Filter out problematic attributes that might be added by browser extensions
  const filteredProps = { ...props };
  const extensionAttributes = [
    "fdprocessedid",
    "data-extension",
    "data-extension-id",
    "_moz-generated-content-before",
    "_moz-generated-content-after",
  ];

  extensionAttributes.forEach((attr) => {
    if ((filteredProps as any)[attr]) {
      delete (filteredProps as any)[attr];
    }
  });

  return (
    <button {...filteredProps} className={className} suppressHydrationWarning={true}>
      {children}
    </button>
  );
};

export default HydrationSafeButton;
