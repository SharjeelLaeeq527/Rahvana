"use client";

import { usePathname } from "next/navigation";
import { ROUTE_FEATURE_MAP } from "@/lib/entitlements/routeFeatureMap";
import { PageGate } from "@/app/components/entitlements/PageGate";

export function ToolsGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const gate = Object.entries(ROUTE_FEATURE_MAP).find(
    ([route]) => pathname === route || pathname.startsWith(route + "/")
  )?.[1];

  if (!gate) return <>{children}</>;

  return (
    <PageGate feature={gate.feature} title={gate.title} description={gate.description}>
      {children}
    </PageGate>
  );
}
