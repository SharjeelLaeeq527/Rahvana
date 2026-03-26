// app/components/auth/ProtectedRoute.tsx
"use client";

import { useAuth } from "@/app/context/AuthContext";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";
import { Loader } from "@/components/ui/spinner";

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

function RedirectHandler({ redirectTo }: { redirectTo: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      let currentPath = pathname;
      if (searchParams && searchParams.toString()) {
        currentPath += `?${searchParams.toString()}`;
      }
      
      const separator = redirectTo.includes("?") ? "&" : "?";
      const redirectUrl = `${redirectTo}${separator}redirect=${encodeURIComponent(currentPath)}`;
      
      router.push(redirectUrl);
    }
  }, [user, isLoading, router, redirectTo, pathname, searchParams]);

  return null;
}

export default function ProtectedRoute({
  children,
  redirectTo = "/login"
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  // Loading state with spinner
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-50 to-slate-100">
        <Loader size="md" text="Loading..." />
      </div>
    );
  }

  // Not authenticated - show nothing while redirecting
  if (!user) {
    return (
      <>
        <Suspense fallback={null}>
          <RedirectHandler redirectTo={redirectTo} />
        </Suspense>
        <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-50 to-slate-100">
          <Loader size="md" text="Redirecting to login..." />
        </div>
      </>
    );
  }

  // Authenticated - render children
  return <>{children}</>;
}
