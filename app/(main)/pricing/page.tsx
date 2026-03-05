"use client";

import { useEffect, useState } from "react";
import CheckoutButton from "@/app/components/payment/CheckoutButton";

import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/app/context/LanguageContext";

export default function PricingSection() {
  const { t } = useLanguage();
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    // Get current user
    supabase.auth
      .getUser()
      .then(({ data }: { data: { user: { id: string } | null } }) => {
        setUserId(data.user?.id || null);
        setIsLoading(false);
      });
  }, []);

  return (
    <section id="pricing" className="block">
      <div className="max-w-[1400px] mx-auto px-6 py-[60px]">
        <h1 className="text-[40px] font-bold mb-4 text-center">{t("pricing.title")}</h1>
        <p className="text-slate-500 text-lg mb-12 text-center">
          {t("pricing.subtitle")}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-[1100px] mx-auto">
          {/* Core Plan */}
          <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm text-center">
            <h3 className="text-xl font-bold mb-2">{t("pricing.plans.core.name")}</h3>
            <div className="text-[48px] font-bold text-[#0d9488] my-4">
              {t("pricing.plans.core.price")}{" "}
              <span className="text-sm text-slate-400 font-normal">
                {t("pricing.plans.core.priceSuffix")}
              </span>
            </div>
            <ul className="text-left my-8 space-y-3">
              <li className="flex gap-2 text-sm">
                <span className="text-green-500 font-bold">✓</span>{" "}
                {t("pricing.plans.core.features.0")}
              </li>
              <li className="flex gap-2 text-sm">
                <span className="text-green-500 font-bold">✓</span>{" "}
                {t("pricing.plans.core.features.1")}
              </li>
              <li className="flex gap-2 text-sm">
                <span className="text-green-500 font-bold">✓</span>{" "}
                {t("pricing.plans.core.features.2")}
              </li>
            </ul>
            <Link
              href="/"
              className="block w-full px-6 py-4 rounded-lg bg-white border border-slate-200 font-bold hover:border-[#0d9488] transition-colors text-center"
            >
              {t("pricing.plans.core.cta")}
            </Link>
          </div>

          {/* Plus Plan */}
          <div className="bg-white border-2 border-[#0d9488] rounded-xl p-8 shadow-xl text-center relative scale-105">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#0d9488] text-white px-4 py-1 rounded-full text-xs font-bold uppercase">
              {t("pricing.plans.plus.badge")}
            </div>
            <h3 className="text-xl font-bold mb-2">{t("pricing.plans.plus.name")}</h3>
            <div className="text-[48px] font-bold text-[#0d9488] my-4">
              {t("pricing.plans.plus.price")}{" "}
              <span className="text-sm text-slate-400 font-normal">
                {t("pricing.plans.plus.priceSuffix")}
              </span>
            </div>
            <ul className="text-left my-8 space-y-3">
              <li className="flex gap-2 text-sm">
                <span className="text-green-500 font-bold">✓</span>{" "}
                {t("pricing.plans.plus.features.0")}
              </li>
              <li className="flex gap-2 text-sm">
                <span className="text-green-500 font-bold">✓</span>{" "}
                {t("pricing.plans.plus.features.1")}
              </li>
              <li className="flex gap-2 text-sm">
                <span className="text-green-500 font-bold">✓</span>{" "}
                {t("pricing.plans.plus.features.2")}
              </li>
              <li className="flex gap-2 text-sm">
                <span className="text-green-500 font-bold">✓</span>{" "}
                {t("pricing.plans.plus.features.3")}
              </li>
            </ul>

            {isLoading ? (
              <button
                disabled
                className="w-full px-6 py-4 rounded-lg bg-[#0d9488] text-white font-bold opacity-50 cursor-not-allowed"
              >
                {t("pricing.plans.plus.loading")}
              </button>
            ) : userId ? (
              <CheckoutButton
                productTier="plus"
                userId={userId}
                className="w-full px-6 py-4 rounded-lg bg-[#0d9488] text-white font-bold hover:bg-[#0f766e] transition-colors shadow-lg"
              >
                {t("pricing.plans.plus.upgradeCta")}
              </CheckoutButton>
            ) : (
              <Link
                href="/login?redirect=/pricing"
                className="block w-full px-6 py-4 rounded-lg bg-[#0d9488] text-white font-bold hover:bg-[#0f766e] transition-colors shadow-lg"
              >
                {t("pricing.plans.plus.signInCta")}
              </Link>
            )}
          </div>

          {/* Pro Plan */}
          <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm text-center opacity-70 relative">
            {/* <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#0d9488] text-white px-4 py-1 rounded-full text-xs font-bold uppercase">
              Coming Soon
            </div> */}
            <h3 className="text-xl font-bold mb-2">{t("pricing.plans.pro.name")}</h3>
            <div className="text-[24px] font-bold text-slate-500 my-4">
              {t("pricing.plans.pro.status")}{" "}
              <span className="text-sm text-slate-400 font-normal">
                {t("pricing.plans.pro.statusSuffix")}
              </span>
            </div>
            <ul className="text-left my-8 space-y-3">
              <li className="flex gap-2 text-sm">
                <span className="text-green-500 font-bold">✓</span>{" "}
                {t("pricing.plans.pro.features.0")}
              </li>
              <li className="flex gap-2 text-sm">
                <span className="text-green-500 font-bold">✓</span>{" "}
                {t("pricing.plans.pro.features.1")}
              </li>
              <li className="flex gap-2 text-sm">
                <span className="text-green-500 font-bold">✓</span>{" "}
                {t("pricing.plans.pro.features.2")}
              </li>
            </ul>
            <button
              className="w-full px-6 py-4 rounded-lg bg-white border border-slate-200 font-bold cursor-not-allowed"
              disabled
            >
              {t("pricing.plans.pro.cta")}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
