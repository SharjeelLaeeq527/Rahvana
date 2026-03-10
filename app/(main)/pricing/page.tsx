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
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-6 sm:py-8 md:py-[60px]">
        <h1 className="text-3xl lg:text-[40px] font-bold mb-3 md:mb-4 text-center">
          {t("pricing.title")}
        </h1>
        <p className="text-slate-500 text-base md:text-lg mb-10 md:mb-12 text-center px-4">
          {t("pricing.subtitle")}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 max-w-[1100px] mx-auto">
          {/* Core Plan */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 lg:p-8 shadow-sm text-center flex flex-col items-center">
            <h3 className="text-xl font-bold mb-2 w-full">
              {t("pricing.plans.core.name")}
            </h3>
            <div className="text-4xl lg:text-[42px] font-bold text-[#0d9488] my-4 w-full">
              {t("pricing.plans.core.price")}{" "}
              <span className="text-sm text-slate-400 font-normal">
                {t("pricing.plans.core.priceSuffix")}
              </span>
            </div>
            <ul className="text-left my-6 lg:my-8 space-y-3 grow w-full">
              <li className="flex gap-2 text-sm">
                <span className="text-green-500 font-bold shrink-0">✓</span>{" "}
                <span>{t("pricing.plans.core.features.0")}</span>
              </li>
              <li className="flex gap-2 text-sm">
                <span className="text-green-500 font-bold shrink-0">✓</span>{" "}
                <span>{t("pricing.plans.core.features.1")}</span>
              </li>
              <li className="flex gap-2 text-sm">
                <span className="text-green-500 font-bold shrink-0">✓</span>{" "}
                <span>{t("pricing.plans.core.features.2")}</span>
              </li>
            </ul>
            <Link
              href="/"
              className="mt-auto block w-full px-6 py-3 lg:py-4 rounded-lg bg-white border border-slate-200 font-bold hover:border-[#0d9488] transition-colors text-center"
            >
              {t("pricing.plans.core.cta")}
            </Link>
          </div>

          {/* Plus Plan */}
          <div className="bg-white border-2 border-[#0d9488] rounded-xl p-6 lg:p-8 shadow-lg lg:shadow-xl text-center relative lg:scale-105 z-10 flex flex-col items-center">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#0d9488] text-white px-4 py-1 rounded-full text-xs font-bold uppercase whitespace-nowrap">
              {t("pricing.plans.plus.badge")}
            </div>
            <h3 className="text-xl font-bold mb-2 w-full">
              {t("pricing.plans.plus.name")}
            </h3>
            <div className="text-4xl lg:text-[42px] font-bold text-[#0d9488] mt-4 mb-2 w-full">
              {t("pricing.plans.plus.price")}{" "}
              <span className="text-base lg:text-lg text-slate-500 font-medium">
                {t("pricing.plans.plus.priceSuffix")}
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 lg:gap-3 mb-6 w-full">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                {t("pricing.or")}
              </span>
              <div className="text-xs lg:text-sm text-[#0d9488] font-medium bg-teal-50 inline-block px-3 py-1 rounded-full border border-teal-100">
                {t("pricing.plans.plus.annualPrice")}{" "}
                {t("pricing.plans.plus.annualPriceSuffix")}
              </div>
            </div>
            <ul className="text-left my-6 lg:my-8 space-y-3 grow w-full">
              <li className="flex gap-2 text-sm">
                <span className="text-green-500 font-bold shrink-0">✓</span>{" "}
                <span>{t("pricing.plans.plus.features.0")}</span>
              </li>
              <li className="flex gap-2 text-sm">
                <span className="text-green-500 font-bold shrink-0">✓</span>{" "}
                <span>{t("pricing.plans.plus.features.1")}</span>
              </li>
              <li className="flex gap-2 text-sm">
                <span className="text-green-500 font-bold shrink-0">✓</span>{" "}
                <span>{t("pricing.plans.plus.features.2")}</span>
              </li>
              <li className="flex gap-2 text-sm">
                <span className="text-green-500 font-bold shrink-0">✓</span>{" "}
                <span>{t("pricing.plans.plus.features.3")}</span>
              </li>
            </ul>

            <div className="w-full mt-auto pt-2">
              {isLoading ? (
                <button
                  disabled
                  className="w-full px-6 py-3 lg:py-4 rounded-lg bg-[#0d9488] text-white font-bold opacity-50 cursor-not-allowed"
                >
                  {t("pricing.plans.plus.loading")}
                </button>
              ) : userId ? (
                <CheckoutButton
                  productTier="plus"
                  userId={userId}
                  className="w-full px-6 py-3 lg:py-4 rounded-lg bg-[#0d9488] text-white font-bold hover:bg-[#0f766e] transition-colors shadow-lg"
                >
                  {t("pricing.plans.plus.upgradeCta")}
                </CheckoutButton>
              ) : (
                <Link
                  href="/login?redirect=/pricing"
                  className="block w-full px-6 py-3 lg:py-4 rounded-lg bg-[#0d9488] text-white font-bold hover:bg-[#0f766e] transition-colors shadow-lg text-center"
                >
                  {t("pricing.plans.plus.signInCta")}
                </Link>
              )}
            </div>
          </div>

          {/* Pro Plan */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 lg:p-8 shadow-sm text-center opacity-70 relative flex flex-col items-center">
            {/* <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#0d9488] text-white px-4 py-1 rounded-full text-xs font-bold uppercase">
              Coming Soon
            </div> */}
            <h3 className="text-xl font-bold mb-2 w-full">
              {t("pricing.plans.pro.name")}
            </h3>
            <div className="text-2xl lg:text-[24px] font-bold text-slate-500 my-4 w-full">
              {t("pricing.plans.pro.status")}{" "}
              <span className="text-sm text-slate-400 font-normal">
                {t("pricing.plans.pro.statusSuffix")}
              </span>
            </div>
            <ul className="text-left my-6 lg:my-8 space-y-3 grow w-full">
              <li className="flex gap-2 text-sm">
                <span className="text-green-500 font-bold shrink-0">✓</span>{" "}
                <span>{t("pricing.plans.pro.features.0")}</span>
              </li>
              <li className="flex gap-2 text-sm">
                <span className="text-green-500 font-bold shrink-0">✓</span>{" "}
                <span>{t("pricing.plans.pro.features.1")}</span>
              </li>
              <li className="flex gap-2 text-sm">
                <span className="text-green-500 font-bold shrink-0">✓</span>{" "}
                <span>{t("pricing.plans.pro.features.2")}</span>
              </li>
            </ul>
            <button
              className="mt-auto w-full px-6 py-3 lg:py-4 rounded-lg bg-white border border-slate-200 font-bold cursor-not-allowed"
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
