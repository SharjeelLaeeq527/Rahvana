"use client";

import { useEffect, useState } from "react";
import CheckoutButton from "@/app/components/payment/CheckoutButton";

import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function PricingSection() {
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    // Get current user
    supabase.auth.getUser().then(({ data }: { data: { user: { id: string } | null } }) => {
      setUserId(data.user?.id || null);
      setIsLoading(false);
    });
  }, []);

  return (
    <section id="pricing" className="block">
      <div className="max-w-[1400px] mx-auto px-6 py-[60px]">
        <h1 className="text-[40px] font-bold mb-4 text-center">
          Pricing Plan
        </h1>
        <p className="text-slate-500 text-lg mb-12 text-center">
          Use the roadmap for free. Upgrade for automation and experts.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-[1100px] mx-auto">
          {/* Core Plan */}
          <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm text-center">
            <h3 className="text-xl font-bold mb-2">Rahvana Core</h3>
            <div className="text-[48px] font-bold text-[#0d9488] my-4">
              $0{" "}
              <span className="text-sm text-slate-400 font-normal">
                Free Forever
              </span>
            </div>
            <ul className="text-left my-8 space-y-3">
              <li className="flex gap-2 text-sm">
                <span className="text-green-500 font-bold">✓</span> Full
                IR-1/CR-1 Step Roadmap
              </li>
              <li className="flex gap-2 text-sm">
                <span className="text-green-500 font-bold">✓</span> Pakistan
                Specific Checklists
              </li>
              <li className="flex gap-2 text-sm">
                <span className="text-green-500 font-bold">✓</span> Browser
                Progress Saving
              </li>
            </ul>
            <Link
              href="/"
              className="block w-full px-6 py-4 rounded-lg bg-white border border-slate-200 font-bold hover:border-[#0d9488] transition-colors text-center"
            >
              Get Started Free
            </Link>
          </div>

          {/* Plus Plan */}
          <div className="bg-white border-2 border-[#0d9488] rounded-xl p-8 shadow-xl text-center relative scale-105">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#0d9488] text-white px-4 py-1 rounded-full text-xs font-bold uppercase">
              Popular
            </div>
            <h3 className="text-xl font-bold mb-2">Rahvana Plus</h3>
            <div className="text-[48px] font-bold text-[#0d9488] my-4">
              $24.99{" "}
              <span className="text-sm text-slate-400 font-normal">
                one-time
              </span>
            </div>
            <ul className="text-left my-8 space-y-3">
              <li className="flex gap-2 text-sm">
                <span className="text-green-500 font-bold">✓</span> Everything
                in Core
              </li>
              <li className="flex gap-2 text-sm">
                <span className="text-green-500 font-bold">✓</span> Cloud Backup
                (Cross-device)
              </li>
              <li className="flex gap-2 text-sm">
                <span className="text-green-500 font-bold">✓</span> Form Filling
                Masterclass
              </li>
              <li className="flex gap-2 text-sm">
                <span className="text-green-500 font-bold">✓</span> NVC Document
                Verification
              </li>
            </ul>

            {isLoading ? (
              <button
                disabled
                className="w-full px-6 py-4 rounded-lg bg-[#0d9488] text-white font-bold opacity-50 cursor-not-allowed"
              >
                Loading...
              </button>
            ) : userId ? (
              <CheckoutButton
                productTier="plus"
                userId={userId}
                className="w-full px-6 py-4 rounded-lg bg-[#0d9488] text-white font-bold hover:bg-[#0f766e] transition-colors shadow-lg"
              >
                Upgrade to Plus →
              </CheckoutButton>
            ) : (
              <Link
                href="/login?redirect=/pricing"
                className="block w-full px-6 py-4 rounded-lg bg-[#0d9488] text-white font-bold hover:bg-[#0f766e] transition-colors shadow-lg"
              >
                Sign In to Upgrade
              </Link>
            )}
          </div>

          {/* Pro Plan */}
          <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm text-center opacity-70 relative">
            {/* <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#0d9488] text-white px-4 py-1 rounded-full text-xs font-bold uppercase">
              Coming Soon
            </div> */}
            <h3 className="text-xl font-bold mb-2">Rahvana Pro</h3>
            <div className="text-[24px] font-bold text-slate-500 my-4">
              Coming Soon{" "}
              <span className="text-sm text-slate-400 font-normal">
                Expert Assistance
              </span>
            </div>
            <ul className="text-left my-8 space-y-3">
              <li className="flex gap-2 text-sm">
                <span className="text-green-500 font-bold">✓</span> Everything
                in Plus
              </li>
              <li className="flex gap-2 text-sm">
                <span className="text-green-500 font-bold">✓</span> Document
                Review by Experts
              </li>
              <li className="flex gap-2 text-sm">
                <span className="text-green-500 font-bold">✓</span> Mock
                Interview Preparation
              </li>
            </ul>
            <button
              className="w-full px-6 py-4 rounded-lg bg-white border border-slate-200 font-bold cursor-not-allowed"
              disabled
            >
              In Beta
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
