"use client";

import { usePathname } from "next/navigation";
import { ROUTE_FEATURE_MAP } from "@/lib/entitlements/routeFeatureMap";
import { PageGate } from "@/app/components/entitlements/PageGate";

export function ToolsGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Use the most specific (longest) matching route so per-guide routes
  // take precedence over the general /guides prefix.
  const gate = Object.entries(ROUTE_FEATURE_MAP)
    .filter(([route]) => pathname === route || pathname.startsWith(route + "/"))
    .sort((a, b) => b[0].length - a[0].length)[0]?.[1];

  if (!gate) return <>{children}</>;

  return (
    <PageGate feature={gate.feature} title={gate.title} description={gate.description}>
      {children}
    </PageGate>
  );
}
