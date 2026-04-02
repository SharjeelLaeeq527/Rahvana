"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowUpRight,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import { useLanguage } from "@/app/context/LanguageContext";

const heroImage = "/assets/images/herobg.jpg";

export function CinematicHero() {
  const [hasTransitioned, setHasTransitioned] = useState(false);
  const { user } = useAuth();
  const { t } = useLanguage();

  useEffect(() => {
    if (hasTransitioned) return;

    const handleInteraction = (event: Event) => {
      if (event.target instanceof Element && event.target.closest("button")) {
        return;
      }

      setHasTransitioned(true);
    };

    window.addEventListener("wheel", handleInteraction, { passive: true });
    window.addEventListener("touchmove", handleInteraction, { passive: true });
    window.addEventListener("click", handleInteraction);

    return () => {
      window.removeEventListener("wheel", handleInteraction);
      window.removeEventListener("touchmove", handleInteraction);
      window.removeEventListener("click", handleInteraction);
    };
  }, [hasTransitioned]);

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("home-hero-transition", {
        detail: { transitioned: hasTransitioned },
      }),
    );

    return () => {
      window.dispatchEvent(
        new CustomEvent("home-hero-transition", {
          detail: { transitioned: false },
        }),
      );
    };
  }, [hasTransitioned]);

  const customEase = [0.25, 1, 0.5, 1] as const;
  const layoutDuration = 1.6;

  return (
    <section className="relative min-h-screen overflow-x-hidden bg-[#FCFCFC] text-gray-900 selection:bg-teal-100 selection:text-teal-900">
      <div
        className={`relative flex min-h-screen items-center pb-8 md:pb-10 ${
          hasTransitioned ? "pt-2 md:pt-3" : "pt-20"
        }`}
      >
        <div
          className={`relative flex h-full w-full flex-col md:flex-row ${
            hasTransitioned ? "items-stretch" : "items-center"
          }`}
        >
          <motion.div
            layout
            className={`z-10 shrink-0 overflow-hidden will-change-transform ${
              hasTransitioned
                ? "relative h-[42svh] w-full max-h-[620px] rounded-[1.75rem] sm:h-[48svh] md:h-[60vh] md:w-[60%] md:rounded-r-[2.25rem] md:rounded-l-none lg:h-[64vh] lg:w-[59%] shadow-xl shadow-teal-900/5"
                : "fixed inset-0 h-full w-full rounded-none shadow-none"
            }`}
            transition={{ layout: { duration: layoutDuration, ease: customEase } }}
          >
            <motion.img
              layout
              src={heroImage}
              alt="Immigration journey"
              className="h-full w-full origin-center object-cover will-change-transform"
              animate={{
                scale: hasTransitioned ? 1 : 1.05,
                objectPosition: hasTransitioned ? "60% 48%" : "58% 50%",
              }}
              transition={{
                scale: { duration: 20, ease: "linear" },
                layout: { duration: layoutDuration, ease: customEase },
              }}
            />

            <motion.div
              className="pointer-events-none absolute inset-0 will-change-opacity"
              animate={{ opacity: hasTransitioned ? 0 : 1 }}
              transition={{ duration: 1.2, ease: customEase }}
            >
              <div
                className="absolute inset-0 bg-gradient-to-t from-[#305254]/90 via-[#305254]/30 to-transparent"
                style={{
                  backdropFilter: "blur(16px)",
                  WebkitBackdropFilter: "blur(16px)",
                  WebkitMaskImage:
                    "linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.7) 25%, rgba(0,0,0,0) 65%)",
                  maskImage:
                    "linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.7) 25%, rgba(0,0,0,0) 65%)",
                }}
              />
            </motion.div>
          </motion.div>

          <div
            className={`relative z-20 mt-0 flex w-full flex-col items-center justify-center px-5 pb-4 text-center sm:px-7 sm:pb-5 md:w-[40%] md:items-start md:text-left md:justify-center md:pl-9 md:pr-6 md:pb-0 lg:w-[41%] lg:pl-11 lg:pr-7 xl:pl-13 xl:pr-8 ${
              hasTransitioned ? "block" : "hidden"
            }`}
          >
            <AnimatePresence>
              {hasTransitioned && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10, transition: { duration: 0.4, ease: "easeOut" } }}
                  transition={{ duration: 1.2, delay: 0.6, ease: customEase }}
                  className="flex w-full max-w-[42rem] flex-col items-center gap-y-6 sm:max-w-[48rem] sm:gap-y-7 md:max-w-[25rem] md:items-start md:gap-y-0 lg:max-w-[27rem] xl:max-w-[29rem]"
                >
                  <h2 className="max-w-[20ch] text-center text-[1.2rem] font-bold leading-[1.1] tracking-tight text-[#71a1a1] sm:max-w-none sm:text-[1.4rem] sm:leading-[1.08] md:mb-4 md:text-left md:text-[1.85rem] lg:text-[2.25rem]">
                    Where could your life
                    <br />
                    go next?
                  </h2>

                  <p className="max-w-[50ch] text-balance text-center text-[11px] leading-[1.8] font-medium text-gray-500 sm:max-w-[56ch] sm:text-[12px] sm:leading-relaxed md:mb-6 md:max-w-[34ch] md:text-left md:text-[14px]">
                    Navigate the complexities of immigration with confidence.
                    Rahvana provides step-by-step guidance, smart tools, and
                    expert support to help you reunite with loved ones.
                  </p>

                  <div className="flex w-full flex-row flex-wrap items-center justify-center gap-3 pt-2 sm:justify-start sm:pt-0">
                    {user && (
                      <Link
                        href="/my-journeys"
                        className="group inline-flex w-fit whitespace-nowrap items-center justify-center gap-2 rounded-full border border-[#f4a8c4] bg-transparent px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-[#f4a8c4] transition-transform duration-200 ease-out hover:-translate-y-0.5 sm:px-5 sm:text-[12px]"
                      >
                        {t("homePage.resumeJourney")}
                        <span className="flex h-5 w-5 flex-none items-center justify-center rounded-full text-[#f4a8c4] transition-transform duration-200 ease-out group-hover:translate-x-0.5 sm:h-6 sm:w-6">
                          <ArrowRight className="h-3 w-3 stroke-[3]" />
                        </span>
                      </Link>
                    )}

                    <Link
                      href="/visa-category/ir-category"
                      className="group inline-flex w-fit whitespace-nowrap items-center justify-center gap-2 rounded-full bg-[#f4a8c4] px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-white shadow-lg shadow-[#f4a8c4]/30 transition-all hover:bg-[#e89db8] sm:px-5 sm:text-[12px]"
                    >
                      {t("homePage.exploreJourneys")}
                      <span className="flex h-5 w-5 flex-none items-center justify-center rounded-full bg-white text-[#f4a8c4] transition-transform group-hover:scale-110 sm:h-6 sm:w-6">
                        <ArrowUpRight className="h-3 w-3 stroke-[3]" />
                      </span>
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <AnimatePresence>
          {!hasTransitioned && (
            <motion.div
              className="pointer-events-none fixed inset-0 z-30 flex flex-col items-start justify-end px-6 pb-16 sm:px-8 md:px-10 md:pb-20 lg:px-16"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              transition={{ duration: 1.2, ease: customEase }}
            >
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.4, delay: 0.2, ease: customEase }}
                className="max-w-3xl"
              >
                <h1 className="text-4xl font-light leading-[1.06] tracking-[-0.03em] text-white drop-shadow-lg sm:text-5xl md:text-[3.6rem] lg:text-[4.6rem]">
                  Your immigration
                  <br />
                  journey, <span className="font-serif font-normal italic text-[#fdf0f4]">simplified.</span>
                </h1>

                <div className="mt-8 flex items-start gap-4 md:mt-10 md:gap-5">
                  <div className="mt-1.5 h-10 w-[2px] rounded-t-full bg-gradient-to-b from-[#f4a8c4] to-transparent" />
                  <p className="max-w-[22rem] text-[14px] font-light leading-[1.7] tracking-wide text-white/90 drop-shadow-md sm:max-w-[26rem] sm:text-[15px] sm:leading-[1.78] md:max-w-[28rem] md:text-base">
                    Bespoke residency and citizenship advisory. We handle the
                    intricacies of your international relocation with absolute
                    discretion and precision.
                  </p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
      </section>
    );
}