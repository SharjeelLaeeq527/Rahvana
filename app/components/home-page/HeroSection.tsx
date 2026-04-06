"use client";

import { useEffect, useRef, useState } from "react";
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
  const touchStartYRef = useRef<number | null>(null);
  const { user } = useAuth();
     const { t } = useLanguage();

  useEffect(() => {
    const shouldIgnore = (target: EventTarget | null) => {
      return (
        target instanceof Element &&
        target.closest("button, a, input, textarea, select, [role='dialog']")
      );
    };

    const handleWheel = (event: WheelEvent) => {
      if (shouldIgnore(event.target)) {
        return;
      }

      if (!hasTransitioned && event.deltaY > 6) {
        setHasTransitioned(true);
      }

          if (hasTransitioned && event.deltaY < -6 && window.scrollY <= 80) {
        setHasTransitioned(false);
      }
    };

    const handleTouchStart = (event: TouchEvent) => {
      touchStartYRef.current = event.touches[0]?.clientY ?? null;
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (shouldIgnore(event.target) || touchStartYRef.current === null) {
        return;
      }

      const currentY = event.touches[0]?.clientY;
      if (typeof currentY !== "number") {
        return;
      }

      const deltaY = touchStartYRef.current - currentY;

      if (!hasTransitioned && deltaY > 18) {
        setHasTransitioned(true);
      }

          if (hasTransitioned && deltaY < -18 && window.scrollY <= 80) {
        setHasTransitioned(false);
      }
    };

    const handleClick = (event: MouseEvent) => {
      if (shouldIgnore(event.target)) {
        return;
      }

      if (!hasTransitioned) {
        setHasTransitioned(true);
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: true });
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("click", handleClick);

    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("click", handleClick);
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
        className={`relative flex min-h-screen pb-8 md:pb-10 ${
          hasTransitioned ? "items-start pt-0 md:items-center md:pt-3" : "items-center pt-20"
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
                    ? "relative h-[42svh] w-full max-h-[620px] rounded-t-none rounded-b-[1.75rem] sm:h-[48svh] md:h-[60vh] md:w-[60%] md:rounded-r-[2.25rem] md:rounded-l-none lg:h-[64vh] lg:w-[59%] shadow-xl shadow-teal-900/5"
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
            className={`relative z-20 mt-4 flex w-full flex-col items-center justify-center px-5 pb-4 text-center sm:mt-5 sm:px-7 sm:pb-5 md:mt-0 md:w-[44%] md:items-start md:text-left md:justify-center md:pl-9 md:pr-4 md:pb-0 lg:w-[45%] lg:pl-11 lg:pr-5 xl:pl-13 xl:pr-6 ${
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
                  className="flex w-full max-w-[44rem] flex-col items-center gap-y-4 px-1 sm:max-w-[48rem] sm:gap-y-5 sm:px-2 md:max-w-[31rem] md:items-start md:gap-y-3 md:px-0 lg:max-w-[34rem] xl:max-w-[36rem]"
                >
                  <h2 className="max-w-[20ch] text-center text-[1.22rem] font-bold leading-[1.12] tracking-tight text-[#71a1a1] sm:max-w-[24ch] sm:text-[1.42rem] sm:leading-[1.1] md:mb-2.5 md:max-w-none md:text-left md:text-[1.9rem] lg:text-[2.3rem]">
                    Where could your life
                    <br />
                    go next?
                  </h2>

                  <p className="max-w-[58ch] text-balance text-center text-[11.5px] leading-[1.78] font-medium text-gray-500 sm:max-w-[66ch] sm:text-[12.5px] sm:leading-relaxed md:mb-4 md:max-w-[48ch] md:text-left md:text-[14px]">
                    Rahvana turns the visa process into a clear, confident
                    journey, with tools and support designed around you.
                  </p>

                  <div className="flex w-full flex-row flex-wrap items-center justify-center gap-3 pt-1 sm:justify-start sm:pt-0 md:pt-1">
                    {user && (
                      <Link
                        href="/my-journeys"
                        className="group inline-flex w-fit whitespace-nowrap items-center justify-center gap-2 rounded-full border-2 border-[#d88ab0] bg-[#fff8fc] px-5 py-2.5 text-[12px] font-bold uppercase tracking-wider text-[#c86c99] shadow-md shadow-[#d88ab0]/15 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-[#fff2f9] sm:px-6 sm:py-3 sm:text-[13px]"
                      >
                        {t("homePage.resumeJourney")}
                        <span className="flex h-5 w-5 flex-none items-center justify-center rounded-full text-[#c86c99] transition-transform duration-200 ease-out group-hover:translate-x-0.5 sm:h-6 sm:w-6">
                          <ArrowRight className="h-3.5 w-3.5 stroke-[3]" />
                        </span>
                      </Link>
                    )}

                    <Link
                      href="/visa-category/ir-category"
                      className="group inline-flex w-fit whitespace-nowrap items-center justify-center gap-2 rounded-full bg-[#d884ae] px-5 py-2.5 text-[12px] font-bold uppercase tracking-wider text-white shadow-lg shadow-[#d884ae]/30 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-[#c976a0] sm:px-6 sm:py-3 sm:text-[13px]"
                    >
                      {t("homePage.exploreJourneys")}
                      <span className="flex h-5 w-5 flex-none items-center justify-center rounded-full bg-white text-[#d884ae] transition-transform group-hover:scale-110 sm:h-6 sm:w-6">
                        <ArrowUpRight className="h-3.5 w-3.5 stroke-[3]" />
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