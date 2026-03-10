"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/app/context/AuthContext";
import CompleteProfileForm from "@/app/components/forms/auth/CompleteProfileForm";
import { Loader } from "@/components/ui/spinner";

export default function CompleteProfilePage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    // Redirect to signup if not authenticated
    if (!isLoading && !user) {
      router.push("/signup");
    }
  }, [user, isLoading, router]);

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader size="md" />
      </div>
    );
  }

  // Don't render if no user
  if (!user) return null;

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 px-4 sm:px-6 py-8 sm:py-12">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-0 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
                Complete Your Profile
              </h1>
              <p className="text-sm sm:text-base text-slate-600 mt-1 sm:mt-2">
                Provide detailed information to enable auto-fill across all
                tools
              </p>
            </div>
            <div className="text-left sm:text-right">
              <div className="text-sm text-slate-600">Step 2 of 3</div>
              <div className="w-full sm:w-32 h-2 bg-slate-200 rounded-full mt-2">
                <div className="w-2/3 h-full bg-slate-900 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
        <CompleteProfileForm />
      </div>
    </div>
  );
}
