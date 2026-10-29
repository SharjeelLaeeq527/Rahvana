"use client";

import React from "react";
import { JourneyEnvironmentProvider } from "@/app/context/JourneyEnvironmentContext";

interface JourneyLayoutClientProps {
  journeySlug: string;
  children: React.ReactNode;
}

/**
 * Client-side wrapper that injects JourneyEnvironmentProvider into
 * the server-rendered layout. Bridges Server Component layout with
 * client-side context.
 */
export function JourneyLayoutClient({ journeySlug, children }: JourneyLayoutClientProps) {
  return (
    <JourneyEnvironmentProvider journeySlug={journeySlug}>
      {children}
    </JourneyEnvironmentProvider>
  );
}
