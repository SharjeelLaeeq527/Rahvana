"use client";

import { useState, useRef } from "react";
import { motion, Variants } from "framer-motion";
import {
  Heart,
  Clock,
  AlertCircle,
  MapPin,
  FileText,
  Users,
  ArrowRight,
  MessageSquare,
  Trophy,
  Compass,
  Handshake,
  Lightbulb,
  Briefcase,
  Folder,
} from "lucide-react";
import { Playfair_Display, DM_Sans } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import { ir1journeyHref } from "@/lib/constants/routes";
import { explorejourneyHref } from "@/lib/constants/routes";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});
const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-dm-sans",
});

export default function AboutPage() {
  const [hoveredTeamIndex, setHoveredTeamIndex] = useState<number | null>(null);
  const [activeFragment, setActiveFragment] = useState(0);
  const [activeTeam, setActiveTeam] = useState(0);
  const [openValue, setOpenValue] = useState<number | null>(0);
  const fragmentTrackRef = useRef<HTMLDivElement | null>(null);
  const teamTrackRef = useRef<HTMLDivElement>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTeamMouseEnter = (i: number) => {
    if (leaveTimer.current) clearTimeout(leaveTimer.current);
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => setHoveredTeamIndex(i), 80);
  };

  const handleTeamMouseLeave = () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    leaveTimer.current = setTimeout(() => setHoveredTeamIndex(null), 200);
  };

  const fragmentCards = [
    {
      img: "/assets/images/about-card-4.png",
      rotate: "-rotate-2",
      text: "Forms that carry the weight of real lives.",
    },
    {
      img: "/assets/images/about-card-5.png",
      rotate: "rotate-1",
      text: "11pm here. 8am on the other side.",
    },
    {
      img: "/assets/images/about-card-2.png",
      rotate: "-rotate-1",
      text: "Words written when calls were too expensive.",
    },
    {
      img: "/assets/images/about-card-1.png",
      rotate: "rotate-1",
      text: "The last wave before the gate closes.",
    },
    {
      img: "/assets/images/about-card-3.png",
      rotate: "-rotate-2",
      text: "Home is wherever they are.",
    },
  ];

  const handleFragmentScroll = () => {
    const track = fragmentTrackRef.current;
    if (!track) return;
    const card = track.firstElementChild as HTMLElement | null;
    if (!card) return;
    const step = card.offsetWidth + 24;
    const index = Math.round(track.scrollLeft / step);
    setActiveFragment(Math.max(0, Math.min(fragmentCards.length - 1, index)));
  };

  const handleTeamScroll = () => {
    const track = teamTrackRef.current;

    if (!track) return;

    const cards = Array.from(track.children) as HTMLElement[];
    if (!cards.length) return;

    const trackCenter = track.scrollLeft + track.clientWidth / 2;

    let closestIndex = 0;
    let closestDistance = Infinity;

    cards.forEach((card, index) => {
      const cardCenter = card.offsetLeft + card.offsetWidth / 2;
      const distance = Math.abs(cardCenter - trackCenter);

      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    setActiveTeam(closestIndex);
  };

  const scrollToFragment = (index: number) => {
    const track = fragmentTrackRef.current;
    if (!track) return;
    const card = track.firstElementChild as HTMLElement | null;
    if (!card) return;
    track.scrollTo({
      left: index * (card.offsetWidth + 24),
      behavior: "smooth",
    });
    setActiveFragment(index);
  };

  const scrollToTeam = (index: number) => {
    const track = teamTrackRef.current;

    if (!track) return;

    const card = track.children[index] as HTMLElement | undefined;

    if (!card) return;

    card.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });

    setActiveTeam(index);
  };

  const valueCards = [
    {
      icon: <Lightbulb size={18} />,
      label: "Clarity",
      text: "Clarity is a form of care.",
    },
    {
      icon: <Heart size={18} />,
      label: "Distance",
      text: "Being far from your loved ones is already hard enough. The tools you use shouldn't add to that burden.",
    },
    {
      icon: <FileText size={18} />,
      label: "Every File",
      text: "Every case number belongs to a real person with a real story.",
    },
    {
      icon: <Compass size={18} />,
      label: "Respect",
      text: "Good guidance respects your intelligence and your situation.",
    },
  ];

  // Pure CSS flex-grow values — browser interpolates on compositor, no JS per frame
  const getFlexGrow = (i: number) => {
    if (hoveredTeamIndex === null) return 1;
    return hoveredTeamIndex === i ? 1.7 : 0.65;
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 24 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  return (
    <div
      className={`${dmSans.variable} ${playfair.variable} relative min-h-screen bg-[#faf7f2] font-sans text-[#2a2a2a]`}
    >
      {/* HERO */}
      <section className="relative flex min-h-screen items-center overflow-hidden bg-[#faf7f2] px-8 pt-24 pb-20 md:px-12 lg:px-20 2xl:min-h-fit 2xl:py-40">
        {/* Decorative background elements for large screens */}
        <div className="pointer-events-none absolute top-0 right-0 hidden h-[600px] w-[600px] translate-x-1/4 -translate-y-1/2 rounded-full bg-[#0d7a75]/5 blur-[120px] 2xl:block" />
        <div className="pointer-events-none absolute bottom-0 left-0 hidden h-[500px] w-[500px] -translate-x-1/4 translate-y-1/4 rounded-full bg-[#b5451b]/5 blur-[100px] 2xl:block" />

        <div className="relative z-10 mx-auto w-full max-w-[1440px]">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
            className="mb-8 flex flex-col gap-4 md:gap-6 2xl:mb-12"
          >
            <motion.h1
              variants={itemVariants}
              className="text-center font-serif text-4xl leading-[1.1] font-bold text-[#121e2e] sm:text-5xl lg:text-6xl 2xl:text-7xl"
            >
              Some journeys begin with paperwork.{" "}
              <em className="font-bold text-[#0d7a75] italic">Ours began</em> with distance.
            </motion.h1>
          </motion.div>

          <div className="grid items-center gap-12 md:grid-cols-2 lg:gap-20 2xl:gap-32">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={containerVariants}
              className="flex flex-col gap-8 md:gap-10"
            >
              <motion.div
                variants={itemVariants}
                className="inline-flex w-fit items-center gap-2 rounded-full border-[1.5px] border-[#b5451b] px-4 py-2 text-xs font-semibold tracking-wider text-[#b5451b]"
              >
                <Heart size={14} className="fill-current" />
                OUR STORY
              </motion.div>
              <motion.p
                variants={itemVariants}
                className="text-sm leading-relaxed text-gray-600 sm:text-base md:text-lg 2xl:text-xl"
              >
                Rahvana was built for the space between people who belong together, the weeks that
                stretch too long, the forms that carry real lives, and the quiet hope families hold
                onto while they wait to be reunited.
              </motion.p>
              <motion.div
                variants={itemVariants}
                className="mt-2 flex flex-wrap items-center gap-6"
              >
                <Link
                  href={explorejourneyHref}
                  className="inline-flex transform items-center gap-2.5 rounded-full bg-[#0d7a75] px-8 py-4 text-sm font-medium text-white shadow-lg shadow-[#0d7a75]/20 transition-all hover:-translate-y-0.5 hover:bg-[#0a5c58] 2xl:px-10 2xl:py-5 2xl:text-base"
                >
                  Start your journey <ArrowRight size={16} />
                </Link>
                <span className="text-xs font-medium tracking-wide text-gray-400 uppercase 2xl:text-sm">
                  {/* IR-1 · IR-5 · Family Visas */}
                  IR-1 · Spouse Visa · Phase 1
                </span>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              viewport={{ once: true }}
              className="relative flex justify-center lg:justify-end"
            >
              <div className="group relative aspect-4/3 w-full max-w-[540px] overflow-hidden rounded-[2.5rem] shadow-[0_40px_100px_rgba(0,0,0,0.16)] 2xl:max-w-[680px]">
                <Image
                  src="/assets/images/about-hero-image.png"
                  alt="Airport reunion"
                  fill
                  priority
                  className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-110"
                />
                <div className="absolute bottom-8 left-8 flex items-center gap-4 rounded-2xl border border-white/20 bg-white/90 px-6 py-4 shadow-2xl backdrop-blur-md 2xl:bottom-12 2xl:left-12">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0d7a75] text-white shadow-inner 2xl:h-12 2xl:w-12">
                    <Heart size={20} />
                  </div>
                  <div>
                    <strong className="block text-sm font-bold text-[#121e2e] 2xl:text-base">
                      IR-1 Journey
                      {/* & IR-5 */}
                    </strong>
                    <span className="text-xs font-medium text-gray-500 2xl:text-sm">
                      Guiding families home
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FRAGMENTS */}
      <section className="bg-[#faf7f2] px-8 py-16 text-center">
        <div className="mb-5 flex justify-center">
          <span className="inline-flex items-center gap-2 rounded-full border-[1.5px] border-[#b5451b] px-4 py-1.5 text-[11px] font-semibold tracking-widest text-[#b5451b] uppercase">
            Fragments From The Journey
          </span>
        </div>
        <h2 className="mx-auto mb-14 font-serif text-3xl leading-tight font-bold text-[#121e2e] md:text-5xl">
          Every immigration story is built on{" "}
          <em className="font-normal text-[#0d7a75] italic">
            moments that quietly shape a future.
          </em>
        </h2>

        <div
          ref={fragmentTrackRef}
          onScroll={handleFragmentScroll}
          className="scrollbar-hide flex snap-x snap-mandatory flex-nowrap gap-6 overflow-x-auto scroll-smooth px-8 pr-16 pb-6 lg:mx-auto lg:grid lg:max-w-[1400px] lg:grid-cols-5 lg:overflow-x-visible lg:px-10 lg:pr-10 lg:pb-12"
        >
          {fragmentCards.map((item, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -10, rotate: 0, zIndex: 10 }}
              className={`w-[78vw] shrink-0 snap-center border border-gray-100 bg-white p-3 pb-12 shadow-[0_10px_30px_rgba(0,0,0,0.1)] transition-all sm:w-[54vw] md:w-[42vw] lg:w-auto lg:snap-align-none ${item.rotate}`}
            >
              <div className="relative mb-6 aspect-square w-full overflow-hidden bg-gray-100">
                <Image src={item.img} alt={item.text} fill className="object-cover" />
              </div>
              <p className="px-2 text-center text-sm leading-relaxed font-medium text-gray-600 italic">
                {item.text}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Pagination dots — mobile & tablet only */}
        <div className="flex items-center justify-center gap-2.5 pb-4 lg:hidden">
          {fragmentCards.map((item, i) => (
            <button
              key={`dot-${i}`}
              type="button"
              aria-label={`Go to fragment ${i + 1}`}
              onClick={() => scrollToFragment(i)}
              className={`rounded-full transition-all duration-300 ${
                activeFragment === i
                  ? "h-2 w-6 bg-[#0d7a75]"
                  : "h-2 w-2 bg-[#0d7a75]/25 hover:bg-[#0d7a75]/50"
              }`}
            />
          ))}
        </div>
        <p className="text-[11px] font-medium tracking-widest text-gray-400 uppercase lg:hidden">
          Swipe to explore
        </p>
      </section>

      {/* WHY WE BUILT THIS */}
      <section className="bg-[#f3ede3] px-8 py-16 md:px-20">
        <div className="mx-auto max-w-3xl">
          <div className="mb-5 flex justify-start">
            <span className="inline-flex items-center gap-2 rounded-full border-[1.5px] border-[#b5451b] px-4 py-1.5 text-[11px] font-semibold tracking-widest text-[#b5451b] uppercase">
              Why We Built This
            </span>
          </div>
          <h2 className="mb-8 font-serif text-3xl leading-snug font-bold text-[#121e2e] md:text-4xl">
            The story behind Rahvana
          </h2>
          <div className="space-y-5 leading-relaxed text-gray-600">
            <p>Behind every immigration case is a family trying to become whole again.</p>
            <p>
              Rahvana was built from that reality, not as an abstract idea, but as a response to
              what we saw people we love go through: complex form codes instead of clear language,
              critical steps spread across government sites, and long periods of silence while cases
              moved through opaque systems.
            </p>
            <p>
              The paperwork is real. So is what it holds, someone waiting at home, children growing
              up over video calls, milestones spent apart, and the steady effort of holding hope
              across distance.
            </p>
            <p>That&apos;s Rahvana: the space between people who belong together.</p>
            <p>
              In Phase 1, we are focused exclusively on the IR-1 spouse visa journey — to go deep on one path before expanding further.
            </p>
          </div>
          <div className="mt-10 rounded-r-xl border-l-4 border-[#0d7a75] bg-white p-5 text-lg leading-relaxed text-[#121e2e] italic shadow-sm md:p-7">
            &quot;We wanted to build something that understood both things: the bureaucratic
            complexity and the human weight. A tool that holds your hand through the process without
            losing sight of why you&apos;re doing it.&quot;
          </div>
        </div>
      </section>

      {/* EMOTIONAL REALITY */}
      <section className="bg-[#121e2e] px-8 py-16 md:px-20">
        <div className="mb-5 flex justify-center">
          <span className="inline-flex items-center gap-2 rounded-full border-[1.5px] border-[#b5451b] px-4 py-1.5 text-[11px] font-semibold tracking-widest text-[#b5451b] uppercase">
            What This Really Feels Like
          </span>
        </div>
        <h2 className="mx-auto mb-16 max-w-4xl text-center font-serif text-3xl leading-tight font-bold text-white md:text-5xl">
          The emotional reality of{" "}
          <em className="font-normal text-[#0d7a75] italic">a family visa journey.</em>
        </h2>

        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {[
            {
              icon: <Clock size={20} />,
              title: "Waiting",
              desc: "The silence between submissions has its own weight. The weeks blur together.",
            },
            {
              icon: <AlertCircle size={20} />,
              title: "Uncertainty",
              desc: "Every case update is a held breath. Clarity feels like a luxury you have to fight for.",
            },
            {
              icon: <MapPin size={20} />,
              title: "Distance",
              desc: "Distance isn't abstract when you're living it across time zones, every single day.",
            },
            {
              icon: <FileText size={20} />,
              title: "Gathering",
              desc: "These aren't just documents. They're the evidence of a real life, a real love.",
            },
            {
              icon: <Users size={20} />,
              title: "Belonging",
              desc: "The process makes you prove what should simply be felt, that you belong together.",
            },
            {
              icon: <Heart size={20} />,
              title: "Hope",
              desc: "Still, you keep going. Because who's waiting on the other side makes every form worth it.",
            },
          ].map((item, i) => (
            <motion.div
              key={i}
              whileHover={{ backgroundColor: "#243347" }}
              className="rounded-2xl bg-[#1c2d40] p-7 text-left transition-colors"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-[#2fd6c9]/25 text-[#5ee7dc] ring-1 ring-[#2fd6c9]/30">
                {item.icon}
              </div>
              <h3 className="mb-2.5 font-semibold text-white">{item.title}</h3>
              <p className="text-sm leading-relaxed text-[#8fa3b8]">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* VALUES */}
      <section className="bg-[#faf7f2] px-8 py-16 md:px-20">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-16 md:gap-20">
          <div>
            <div className="mb-5 flex justify-start">
              <span className="inline-flex items-center gap-2 rounded-full border-[1.5px] border-[#b5451b] px-4 py-1.5 text-[11px] font-semibold tracking-widest text-[#b5451b] uppercase">
                Our Values
              </span>
            </div>
            <h2 className="mb-4 font-serif text-4xl leading-tight font-bold text-[#121e2e] md:text-5xl">
              What we <em className="font-normal text-[#0d7a75] italic">believe.</em>
            </h2>
            <p className="text-[15px] leading-relaxed text-gray-500">
              Not a slide deck of corporate values. Just the things we genuinely hold to be true
              about building tools for people in hard situations.
            </p>
          </div>
          {/* MOBILE & TABLET: compact accordion stack */}
          <div className="flex w-full flex-col gap-4 lg:hidden">
            <div className="relative overflow-hidden rounded-[2rem] bg-[#0d7a75] p-7 text-white shadow-xl">
              <div className="relative z-10">
                <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-xl border border-white/20 bg-white/10">
                  <Trophy size={20} className="text-white/90" />
                </div>
                <span className="mb-3 block text-[11px] font-bold tracking-[0.2em] text-white/60 uppercase">
                  Our Foundation
                </span>
                <h3 className="font-serif text-2xl leading-[1.2]">
                  Immigration help should feel humane, not mechanical.
                </h3>
              </div>
              <div className="absolute -right-20 -bottom-20 h-72 w-72 rounded-full bg-white/5 blur-3xl" />
            </div>

            <div className="flex flex-col gap-3">
              {valueCards.map((item, i) => {
                const isOpen = openValue === i;
                return (
                  <div
                    key={`value-${i}`}
                    className="overflow-hidden rounded-[1.5rem] border border-gray-100 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.03)]"
                  >
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      onClick={() => setOpenValue(isOpen ? null : i)}
                      className="flex w-full items-center gap-4 p-5 text-left"
                    >
                      <span
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition-all duration-500 ${
                          isOpen ? "bg-[#0d7a75] text-white" : "bg-[#0d7a75]/5 text-[#0d7a75]"
                        }`}
                      >
                        {item.icon}
                      </span>
                      <span className="min-w-0 flex-1 text-[11px] font-bold tracking-[0.2em] text-[#0d7a75] uppercase">
                        {item.label}
                      </span>
                      <ArrowRight
                        size={16}
                        className={`shrink-0 text-[#0d7a75] transition-transform duration-300 ${
                          isOpen ? "rotate-90" : ""
                        }`}
                      />
                    </button>
                    <div
                      className="grid transition-all duration-500 ease-out"
                      style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                    >
                      <div className="overflow-hidden">
                        <h3 className="px-5 pb-6 font-serif text-xl leading-snug text-[#121e2e]">
                          {item.text}
                        </h3>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* DESKTOP: original grid */}
          <div className="hidden grid-cols-1 gap-5 md:grid-cols-2 lg:grid lg:grid-cols-3 lg:gap-6">
            {/* CARD 1: FOUNDATION (FEATURED) */}
            <motion.div
              variants={itemVariants}
              className="group relative overflow-hidden rounded-[2rem] bg-[#0d7a75] p-8 text-white shadow-xl md:p-10 lg:col-span-2"
            >
              <div className="relative z-10">
                <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-xl border border-white/20 bg-white/10">
                  <Trophy size={22} className="text-white/90" />
                </div>
                <span className="mb-4 block text-[11px] font-bold tracking-[0.2em] text-white/60 uppercase">
                  Our Foundation
                </span>
                <h3 className="mb-6 max-w-xl font-serif text-3xl leading-[1.15] md:text-4xl">
                  Immigration help should feel humane, not mechanical.
                </h3>
              </div>
              <div className="absolute -right-20 -bottom-20 h-80 w-80 rounded-full bg-white/5 blur-3xl transition-transform duration-700 group-hover:scale-110" />
            </motion.div>

            {/* CARD 2: CLARITY */}
            <motion.div
              variants={itemVariants}
              className="group relative overflow-hidden rounded-[2rem] border border-gray-100 bg-white p-8 shadow-[0_8px_30px_rgba(0,0,0,0.03)] md:p-10"
            >
              <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0d7a75]/5 text-[#0d7a75] transition-all duration-500 group-hover:bg-[#0d7a75] group-hover:text-white">
                <Lightbulb size={20} />
              </div>
              <span className="mb-4 block text-[11px] font-bold tracking-[0.2em] text-[#0d7a75] uppercase">
                Clarity
              </span>
              <h3 className="mb-5 font-serif text-2xl leading-tight text-[#121e2e] md:text-3xl">
                Clarity is a form of care.
              </h3>
            </motion.div>

            {/* CARD 3: DISTANCE */}
            <motion.div
              variants={itemVariants}
              className="group rounded-[2rem] border border-gray-100 bg-white p-8 shadow-[0_8px_30px_rgba(0,0,0,0.03)]"
            >
              <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0d7a75]/5 text-[#0d7a75] transition-all duration-500 group-hover:bg-[#0d7a75] group-hover:text-white">
                <Heart size={20} />
              </div>
              <span className="mb-4 block text-[11px] font-bold tracking-[0.2em] text-[#0d7a75] uppercase">
                Distance
              </span>
              <h3 className="mb-4 font-serif text-2xl leading-tight text-[#121e2e]">
                Being far from your loved ones is already hard enough. The tools you use
                shouldn&apos;t add to that burden.
              </h3>
            </motion.div>

            {/* CARD 4: EVERY FILE */}
            <motion.div
              variants={itemVariants}
              className="group rounded-[2rem] border border-gray-100 bg-white p-8 shadow-[0_8px_30px_rgba(0,0,0,0.03)]"
            >
              <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0d7a75]/5 text-[#0d7a75] transition-all duration-500 group-hover:bg-[#0d7a75] group-hover:text-white">
                <FileText size={20} />
              </div>
              <span className="mb-4 block text-[11px] font-bold tracking-[0.2em] text-[#0d7a75] uppercase">
                Every File
              </span>
              <h3 className="mb-4 font-serif text-2xl leading-tight text-[#121e2e]">
                Every case number belongs to a real person with a real story.
              </h3>
            </motion.div>

            {/* CARD 5: RESPECT */}
            <motion.div
              variants={itemVariants}
              className="group relative overflow-hidden rounded-[2rem] border border-gray-100 bg-white p-8 shadow-[0_8px_30px_rgba(0,0,0,0.03)]"
            >
              <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0d7a75]/5 text-[#0d7a75] transition-all duration-500 group-hover:bg-[#0d7a75] group-hover:text-white">
                <Compass size={20} />
              </div>
              <span className="mb-4 block text-[11px] font-bold tracking-[0.2em] text-[#0d7a75] uppercase">
                Respect
              </span>
              <h3 className="mb-5 font-serif text-2xl leading-tight text-[#121e2e]">
                Good guidance respects your intelligence and your situation.
              </h3>
            </motion.div>
          </div>
        </div>
      </section>

      {/* MEMORY TO MOVEMENT */}
      <section className="bg-[#edf6f5] px-8 py-16 md:px-20">
        <div className="mx-auto grid max-w-6xl items-center gap-16 md:grid-cols-2 md:gap-20">
          <div className="relative aspect-4/3 overflow-hidden rounded-2xl shadow-xl">
            <Image
              src="/assets/images/from-memory-to-movement.png"
              alt="Consultation"
              fill
              className="h-full w-full object-cover"
            />
          </div>
          <div>
            <div className="mb-5 flex justify-start">
              <span className="inline-flex items-center gap-2 rounded-full border-[1.5px] border-[#b5451b] px-4 py-1.5 text-[11px] font-semibold tracking-widest text-[#b5451b] uppercase">
                From Memory To Movement
              </span>
            </div>
            <h2 className="mb-5 font-serif text-3xl leading-tight font-bold text-[#121e2e] md:text-4xl">
              Memory is where the journey{" "}
              <em className="font-normal text-[#0d7a75] italic">begins.</em>
              <br />
              Rahvana is how it{" "}
              <em className="font-normal text-[#0d7a75] italic">moves forward.</em>
            </h2>
            <p className="mb-8 text-[15px] leading-relaxed text-gray-600">
              We&apos;re not here to keep you in the feeling of distance. We&apos;re here to help
              you close it. Every tool, every guide, every step in Rahvana is designed to move you
              forward, toward clarity, toward submission, toward reunion.
            </p>
            <Link
              href={explorejourneyHref}
              className="inline-flex transform items-center gap-2.5 rounded-full bg-[#0d7a75] px-7 py-3.5 text-sm font-medium text-white transition-all hover:-translate-y-0.5 hover:bg-[#0a5c58]"
            >
              Start your journey <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* TEAM */}
      <section className="bg-[#f8f8f8] px-8 py-16 text-center md:px-20">
        <div className="mb-5 flex justify-center">
          <span className="inline-flex items-center gap-2 rounded-full border-[1.5px] border-[#b5451b] px-4 py-1.5 text-[11px] font-semibold tracking-widest text-[#b5451b] uppercase">
            The People Behind It
          </span>
        </div>

        <h2 className="mb-14 font-serif text-3xl leading-tight font-bold text-[#121e2e] md:text-5xl">
          Built by people who{" "}
          <em className="font-normal text-[#0d7a75] italic">have lived this too.</em>
        </h2>

        {/* ================================================================
      DESKTOP TEAM LAYOUT
      Keeps the existing hover-expand behavior.
      Visible only on lg and above.
      ================================================================ */}
        <div
          className="mx-auto hidden max-w-[1100px] flex-row items-stretch gap-6 lg:flex"
          onMouseLeave={handleTeamMouseLeave}
        >
          {[
            {
              name: "Hams",
              initials: "HL",
              image: "/assets/images/Hams.PNG",
              color: "bg-[#0d7a75]",
              role: "Co-Founder",
              desc: "Rahvana exists because people deserve clarity during one of the most important processes of their lives. I've personally helped multiple people navigate these procedures and seen how overwhelming it can be, from trying to understand complicated requirements, second-guessing every step, and feeling completely alone. As a Co-Founder, my focus is making sure Rahvana is truly supportive, giving people clarity, structure, and peace of mind at every stage.",
            },
            {
              name: "Sharjeel",
              initials: "SL",
              image: "/assets/images/Sharjeel.PNG",
              color: "bg-[#e8a020]",
              role: "Co-Founder",
              desc: "Rahvana came from a personal place. I watched someone close to me navigate the IR-1 process alone, confused, overwhelmed, and constantly unsure if they were doing things right. There was no real support, just paperwork and waiting. I built Rahvana so others wouldn't have to face that process without clarity and guidance.",
            },
            {
              name: "Javeria",
              initials: "JL",
              image: "/assets/images/Javeria.PNG",
              color: "bg-[#d9406a]",
              role: "Co-Founder",
              desc: "Behind every decision is the responsibility to build something people can rely on. At Rahvana, that means making sure we grow sustainably while staying focused on what actually matters is helping people through a difficult process without adding financial stress or uncertainty. We keep that balance intact.",
            },
          ].map((member, i) => {
            const isHovered = hoveredTeamIndex === i;
            const isOther = hoveredTeamIndex !== null && !isHovered;

            return (
              <div
                key={i}
                onMouseEnter={() => handleTeamMouseEnter(i)}
                style={{
                  flexGrow: getFlexGrow(i),
                  flexShrink: 1,
                  flexBasis: 0,
                  opacity: isOther ? 0.55 : 1,
                  filter: isOther ? "blur(1px)" : "blur(0px)",
                  transform: isOther ? "scale(0.985)" : "scale(1)",
                  transition:
                    "flex-grow 480ms cubic-bezier(0.4,0,0.2,1), opacity 350ms ease, filter 350ms ease, transform 350ms ease",
                  willChange: "flex-grow, opacity, filter, transform",
                }}
                className="min-h-[360px] flex-col overflow-hidden rounded-3xl border border-black/5 bg-white p-9 shadow-sm"
              >
                <div className="relative mx-auto mb-7 flex h-30 w-30 flex-shrink-0 items-center justify-center overflow-hidden rounded-full shadow-lg ring-4 ring-[#0d7a75]/10">
                  <Image
                    src={member.image}
                    alt={member.name}
                    fill
                    className="object-cover object-top"
                  />

                  <div
                    className={`absolute inset-0 hidden items-center justify-center rounded-full text-3xl font-bold text-white ${member.color}`}
                  >
                    {member.initials}
                  </div>
                </div>

                <p className="mb-1 overflow-hidden font-serif text-2xl font-bold text-ellipsis whitespace-nowrap text-[#121e2e]">
                  {member.name}
                </p>

                <p className="mb-4 text-[11px] font-semibold tracking-[0.12em] text-[#0d7a75] uppercase">
                  {member.role}
                </p>

                <p
                  style={{
                    opacity: isHovered ? 1 : 0.75,
                    transition: "opacity 350ms ease",
                    display: "-webkit-box",
                    WebkitLineClamp: isHovered ? "unset" : 4,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    textAlign: isHovered ? "center" : "left",
                  }}
                  className="text-sm leading-relaxed text-gray-600"
                >
                  {member.desc}
                </p>
              </div>
            );
          })}
        </div>

        {/* ================================================================
      MOBILE + TABLET TEAM CAROUSEL
      Same interaction pattern as the Fragments section.
      Visible below lg.
      ================================================================ */}
        <div className="lg:hidden">
          <div
            ref={teamTrackRef}
            onScroll={handleTeamScroll}
            className="scrollbar-hide flex snap-x snap-mandatory flex-nowrap gap-6 overflow-x-auto scroll-smooth px-2 pb-6"
          >
            {[
              {
                name: "Sharjeel",
                initials: "SL",
                image: "/assets/images/Sharjeel.PNG",
                color: "bg-[#e8a020]",
                role: "Co-Founder",
                desc: "Rahvana came from a personal place. I watched someone close to me navigate the IR-1 process alone, confused, overwhelmed, and constantly unsure if they were doing things right. There was no real support, just paperwork and waiting. I built Rahvana so others wouldn't have to face that process without clarity and guidance.",
              },
              {
                name: "Hams",
                initials: "HL",
                image: "/assets/images/Hams.PNG",
                color: "bg-[#0d7a75]",
                role: "Co-Founder",
                desc: "Rahvana exists because people deserve clarity during one of the most important processes of their lives. I've personally helped multiple people navigate these procedures and seen how overwhelming it can be, from trying to understand complicated requirements, second-guessing every step, and feeling completely alone. As a Co-Founder, my focus is making sure Rahvana is truly supportive, giving people clarity, structure, and peace of mind at every stage.",
              },
              {
                name: "Javeria",
                initials: "JL",
                image: "/assets/images/Javeria.PNG",
                color: "bg-[#d9406a]",
                role: "Co-Founder",
                desc: "Behind every decision is the responsibility to build something people can rely on. At Rahvana, that means making sure we grow sustainably while staying focused on what actually matters is helping people through a difficult process without adding financial stress or uncertainty. We keep that balance intact.",
              },
            ].map((member, i) => (
              <div
                key={`team-mobile-${i}`}
                className="w-[82vw] shrink-0 snap-center rounded-3xl border border-black/5 bg-white p-8 shadow-sm sm:w-[62vw] md:w-[48vw]"
              >
                <div className="relative mx-auto mb-7 flex h-24 w-24 flex-shrink-0 items-center justify-center overflow-hidden rounded-full shadow-lg ring-4 ring-[#0d7a75]/10">
                  <Image
                    src={member.image}
                    alt={member.name}
                    fill
                    className="object-cover object-top"
                  />

                  <div
                    className={`absolute inset-0 hidden items-center justify-center rounded-full text-3xl font-bold text-white ${member.color}`}
                  >
                    {member.initials}
                  </div>
                </div>

                <p className="mb-1 font-serif text-2xl font-bold text-[#121e2e]">{member.name}</p>

                <p className="mb-5 text-[11px] font-semibold tracking-[0.12em] text-[#0d7a75] uppercase">
                  {member.role}
                </p>

                <p className="text-left text-sm leading-relaxed text-gray-600">{member.desc}</p>
              </div>
            ))}
          </div>

          {/* Pagination dots */}
          <div className="flex items-center justify-center gap-2.5 pb-4">
            {[0, 1, 2].map((i) => (
              <button
                key={`team-dot-${i}`}
                type="button"
                aria-label={`Go to team member ${i + 1}`}
                onClick={() => scrollToTeam(i)}
                className={`rounded-full transition-all duration-300 ${
                  activeTeam === i
                    ? "h-2 w-6 bg-[#0d7a75]"
                    : "h-2 w-2 bg-[#0d7a75]/25 hover:bg-[#0d7a75]/50"
                }`}
              />
            ))}
          </div>

          <p className="text-[11px] font-medium tracking-widest text-gray-400 uppercase">
            Swipe to explore
          </p>
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="bg-[#0d7a75] px-8 py-16 text-center text-white md:py-20">
        <h2 className="mx-auto mb-5 max-w-4xl font-serif text-2xl leading-tight font-bold md:text-5xl">
          If this journey is part of
          <br />
          your story too, <em className="font-normal text-[#a8e8e5] italic">we&apos;re here.</em>
        </h2>
        <p className="mx-auto mb-10 max-w-lg text-base leading-relaxed text-white/75 md:text-lg">
          You don&apos;t have to figure it out alone. Rahvana walks with you through the IR-1 process — one step, one form, one checkpoint at a time.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href={explorejourneyHref}
            className="transform rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-[#0d7a75] transition-all hover:-translate-y-0.5 hover:shadow-xl"
          >
            Start your journey →
          </Link>
          <Link
            href="/resources"
            className="rounded-full border-[1.5px] border-white/50 bg-transparent px-8 py-3.5 text-sm font-medium text-white transition-all hover:border-white hover:bg-white/10"
          >
            Browse tools & resources
          </Link>
        </div>
        <p className="mt-7 text-[14px] tracking-wider text-white/50">
Phase 1 · IR-1 Spouse Visa Journey · U.S. Embassy Islamabad · Karachi · Lahore
        </p>
      </section>
    </div>
  );
}
