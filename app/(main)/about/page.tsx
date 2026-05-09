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
  Quote,
} from "lucide-react";
import { Playfair_Display, DM_Sans } from "next/font/google";
import Image from "next/image";
import Link from "next/link";

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
      className={`${dmSans.variable} ${playfair.variable} font-sans bg-[#faf7f2] text-[#2a2a2a] min-h-screen relative`}
    >
      {/* HERO */}
      <section className="min-h-screen 2xl:min-h-fit flex items-center bg-[#faf7f2] relative overflow-hidden px-8 md:px-12 lg:px-20 pt-24 pb-20 2xl:py-40">
        {/* Decorative background elements for large screens */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#0d7a75]/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/4 pointer-events-none hidden 2xl:block" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#b5451b]/5 rounded-full blur-[100px] translate-y-1/4 -translate-x-1/4 pointer-events-none hidden 2xl:block" />

        <div className="max-w-[1440px] mx-auto w-full relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
            className="flex flex-col gap-4 md:gap-6 mb-8 2xl:mb-12"
          >
            <motion.div
              variants={itemVariants}
              className="inline-flex items-center gap-2 px-4 py-2 border-[1.5px] border-[#b5451b] rounded-full text-xs font-semibold tracking-wider text-[#b5451b] w-fit"
            >
              <Heart size={14} className="fill-current" />
              OUR STORY
            </motion.div>
            <motion.h1
              variants={itemVariants}
              className="font-bold text-center font-serif text-4xl sm:text-5xl lg:text-6xl 2xl:text-7xl leading-[1.1] text-[#121e2e]"
            >
              Some journeys begin with paperwork.{" "}
              <em className="italic text-[#0d7a75] font-bold">Ours began</em>{" "}
              with distance.
            </motion.h1>
          </motion.div>

          <div className="grid md:grid-cols-2 items-center gap-12 lg:gap-20 2xl:gap-32">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={containerVariants}
              className="flex flex-col gap-8 md:gap-10"
            >
              <motion.p
                variants={itemVariants}
                className="text-sm sm:text-base md:text-lg 2xl:text-xl leading-relaxed text-gray-600"
              >
                Rahvana was built for the space between people who belong
                together — the weeks that stretch too long, the forms that carry
                real lives, and the quiet hope families hold onto while they
                wait to be reunited.
              </motion.p>
              <motion.div
                variants={itemVariants}
                className="flex flex-wrap items-center gap-6 mt-2"
              >
                <Link
                  href="/visa-category/ir-category/ir-1"
                  className="inline-flex items-center gap-2.5 bg-[#0d7a75] text-white px-8 py-4 2xl:px-10 2xl:py-5 rounded-full text-sm 2xl:text-base font-medium hover:bg-[#0a5c58] transition-all transform hover:-translate-y-0.5 shadow-lg shadow-[#0d7a75]/20"
                >
                  Start your journey <ArrowRight size={16} />
                </Link>
                <span className="text-xs 2xl:text-sm text-gray-400 tracking-wide uppercase font-medium">
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
              <div className="relative w-full max-w-[540px] 2xl:max-w-[680px] aspect-4/3 rounded-[2.5rem] overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.16)] group">
                <Image
                  src="/assets/images/about-hero-image.png"
                  alt="Airport reunion"
                  fill
                  priority
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                />
                <div className="absolute bottom-8 left-8 2xl:bottom-12 2xl:left-12 bg-white/90 backdrop-blur-md rounded-2xl px-6 py-4 flex items-center gap-4 shadow-2xl border border-white/20">
                  <div className="w-10 h-10 2xl:w-12 2xl:h-12 bg-[#0d7a75] rounded-full flex items-center justify-center text-white shadow-inner">
                    <Heart size={20} />
                  </div>
                  <div>
                    <strong className="block text-sm 2xl:text-base text-[#121e2e] font-bold">
                      IR-1 Journey
                    </strong>
                    <span className="text-xs 2xl:text-sm text-gray-500 font-medium">
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
      <section className="bg-[#faf7f2] py-24 px-8 text-center">
        <div className="flex justify-center mb-5">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 border-[1.5px] border-[#b5451b] rounded-full text-[11px] font-semibold tracking-widest text-[#b5451b] uppercase">
            Fragments From The Journey
          </span>
        </div>
        <h2 className="font-serif font-bold text-3xl md:text-5xl text-[#121e2e] mb-14 mx-auto leading-tight">
          Every immigration story is built on{" "}
          <em className="italic text-[#0d7a75] font-normal">
            moments that quietly shape a future.
          </em>
        </h2>

        <div className="flex flex-nowrap overflow-x-auto lg:grid lg:grid-cols-5 lg:overflow-x-visible pb-12 gap-6 px-4 lg:px-10 lg:max-w-[1400px] lg:mx-auto scrollbar-hide">
          {[
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
          ].map((item, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -10, rotate: 0, zIndex: 10 }}
              className={`shrink-0 bg-white p-3 pb-12 w-64 lg:w-auto shadow-[0_10px_30px_rgba(0,0,0,0.1)] border border-gray-100 transition-all ${item.rotate}`}
            >
              <div className="aspect-square w-full relative overflow-hidden bg-gray-100 mb-6">
                <Image
                  src={item.img}
                  alt={item.text}
                  fill
                  className="object-cover"
                />
              </div>
              <p className="text-sm text-gray-600 font-medium italic leading-relaxed text-center px-2">
                {item.text}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* WHY WE BUILT THIS */}
      <section className="bg-[#f3ede3] py-24 px-8 md:px-20">
        <div className="max-w-3xl mx-auto">
          <div className="flex justify-start mb-5">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 border-[1.5px] border-[#b5451b] rounded-full text-[11px] font-semibold tracking-widest text-[#b5451b] uppercase">
              Why We Built This
            </span>
          </div>
          <h2 className="font-serif font-bold text-3xl md:text-4xl text-[#121e2e] mb-8 leading-snug">
            The story behind Rahvana
          </h2>
          <div className="space-y-5 text-gray-600 leading-relaxed">
            <p>
              Behind every immigration case is a family trying to become whole
              again.
            </p>
            <p>
              Rahvana was built from that reality — not as an abstract idea, but
              as a response to what we saw people we love go through: complex
              form codes instead of clear language, critical steps spread across
              government sites, and long periods of silence while cases moved
              through opaque systems.
            </p>
            <p>
              The paperwork is real. So is what it holds — someone waiting at
              home, children growing up over video calls, milestones spent
              apart, and the steady effort of holding hope across distance.
            </p>
            <p>
              That&apos;s Rahvana: the space between people who belong together.
            </p>
            <p>
              In Phase 1, we are focused exclusively on the IR-1 spouse visa
              journey — to go deep on one path before expanding further.
            </p>
          </div>
          <div className="mt-10 p-5 md:p-7 bg-white rounded-r-xl border-l-4 border-[#0d7a75] shadow-sm text-lg italic text-[#121e2e] leading-relaxed">
            &quot;We wanted to build something that understood both things: the
            bureaucratic complexity and the human weight. A tool that holds your
            hand through the process without losing sight of why you&apos;re
            doing it.&quot;
          </div>
        </div>
      </section>

      {/* EMOTIONAL REALITY */}
      <section className="bg-[#121e2e] py-24 px-8 md:px-20">
        <div className="flex justify-center mb-5">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 border-[1.5px] border-[#b5451b] rounded-full text-[11px] font-semibold tracking-widest text-[#b5451b] uppercase">
            What This Really Feels Like
          </span>
        </div>
        <h2 className="font-serif font-bold text-3xl md:text-5xl text-white text-center mb-16 max-w-4xl mx-auto leading-tight">
          The emotional reality of{" "}
          <em className="italic text-[#0d7a75] font-normal">
            a family visa journey.
          </em>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
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
              desc: "The process makes you prove what should simply be felt — that you belong together.",
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
              className="bg-[#1c2d40] rounded-2xl p-7 text-left transition-colors"
            >
              <div className="w-10 h-10 bg-[#0d7a75]/25 rounded-lg flex items-center justify-center text-[#14a89f] mb-4">
                {item.icon}
              </div>
              <h3 className="text-white font-semibold mb-2.5">{item.title}</h3>
              <p className="text-[#8fa3b8] text-sm leading-relaxed">
                {item.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* VALUES */}
      <section className="bg-[#faf7f2] py-24 px-8 md:px-20">
        <div className="max-w-6xl mx-auto flex flex-col gap-16 md:gap-20 items-start">
          <div>
            <div className="flex justify-start mb-5">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 border-[1.5px] border-[#b5451b] rounded-full text-[11px] font-semibold tracking-widest text-[#b5451b] uppercase">
                Our Values
              </span>
            </div>
            <h2 className="font-serif font-bold text-4xl md:text-5xl text-[#121e2e] mb-4 leading-tight">
              What we{" "}
              <em className="italic text-[#0d7a75] font-normal">believe.</em>
            </h2>
            <p className="text-gray-500 text-[15px] leading-relaxed">
              Not a slide deck of corporate values. Just the things we genuinely
              hold to be true about building tools for people in hard
              situations.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
            {/* CARD 1: FOUNDATION (FEATURED) */}
            <motion.div
              variants={itemVariants}
              className="lg:col-span-2 bg-[#0d7a75] rounded-[2rem] p-8 md:p-10 text-white relative overflow-hidden group shadow-xl"
            >
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-8 border border-white/20">
                  <Trophy size={22} className="text-white/90" />
                </div>
                <span className="block text-[11px] font-bold tracking-[0.2em] uppercase text-white/60 mb-4">
                  Our Foundation
                </span>
                <h3 className="font-serif text-3xl md:text-4xl leading-[1.15] mb-6 max-w-xl">
                  Immigration help should feel humane, not mechanical.
                </h3>
              </div>
              <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-white/5 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700" />
            </motion.div>

            {/* CARD 2: CLARITY */}
            <motion.div
              variants={itemVariants}
              className="bg-white rounded-[2rem] p-8 md:p-10 border border-gray-100 shadow-[0_8px_30px_rgba(0,0,0,0.03)] relative overflow-hidden group"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#0d7a75]/5 flex items-center justify-center text-[#0d7a75] mb-8 group-hover:bg-[#0d7a75] group-hover:text-white transition-all duration-500">
                <Lightbulb size={20} />
              </div>
              <span className="block text-[11px] font-bold tracking-[0.2em] uppercase text-[#0d7a75] mb-4">
                Clarity
              </span>
              <h3 className="font-serif text-2xl md:text-3xl leading-tight text-[#121e2e] mb-5">
                Clarity is a form of care.
              </h3>
            </motion.div>

            {/* CARD 3: DISTANCE */}
            <motion.div
              variants={itemVariants}
              className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-[0_8px_30px_rgba(0,0,0,0.03)] group"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#0d7a75]/5 flex items-center justify-center text-[#0d7a75] mb-8 group-hover:bg-[#0d7a75] group-hover:text-white transition-all duration-500">
                <Heart size={20} />
              </div>
              <span className="block text-[11px] font-bold tracking-[0.2em] uppercase text-[#0d7a75] mb-4">
                Distance
              </span>
              <h3 className="font-serif text-2xl leading-tight text-[#121e2e] mb-4">
                Being far from your loved ones is already hard enough. The tools
                you use shouldn't add to that burden.
              </h3>
            </motion.div>

            {/* CARD 4: EVERY FILE */}
            <motion.div
              variants={itemVariants}
              className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-[0_8px_30px_rgba(0,0,0,0.03)] group"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#0d7a75]/5 flex items-center justify-center text-[#0d7a75] mb-8 group-hover:bg-[#0d7a75] group-hover:text-white transition-all duration-500">
                <FileText size={20} />
              </div>
              <span className="block text-[11px] font-bold tracking-[0.2em] uppercase text-[#0d7a75] mb-4">
                Every File
              </span>
              <h3 className="font-serif text-2xl leading-tight text-[#121e2e] mb-4">
                Every case number belongs to a real person with a real story.
              </h3>
            </motion.div>

            {/* CARD 5: RESPECT */}
            <motion.div
              variants={itemVariants}
              className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-[0_8px_30px_rgba(0,0,0,0.03)] relative overflow-hidden group"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#0d7a75]/5 flex items-center justify-center text-[#0d7a75] mb-8 group-hover:bg-[#0d7a75] group-hover:text-white transition-all duration-500">
                <Compass size={20} />
              </div>
              <span className="block text-[11px] font-bold tracking-[0.2em] uppercase text-[#0d7a75] mb-4">
                Respect
              </span>
              <h3 className="font-serif text-2xl leading-tight text-[#121e2e] mb-5">
                Good guidance respects your intelligence and your situation.
              </h3>
            </motion.div>
          </div>
        </div>
      </section>

      {/* MEMORY TO MOVEMENT */}
      <section className="bg-[#edf6f5] py-24 px-8 md:px-20">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 md:gap-20 items-center">
          <div className="rounded-2xl overflow-hidden aspect-4/3 shadow-xl relative">
            <Image
              src="/assets/images/from-memory-to-movement.png"
              alt="Consultation"
              fill
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <div className="flex justify-start mb-5">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 border-[1.5px] border-[#b5451b] rounded-full text-[11px] font-semibold tracking-widest text-[#b5451b] uppercase">
                From Memory To Movement
              </span>
            </div>
            <h2 className="font-serif font-bold text-3xl md:text-4xl text-[#121e2e] mb-5 leading-tight">
              Memory is where the journey{" "}
              <em className="italic text-[#0d7a75] font-normal">begins.</em>
              <br />
              Rahvana is how it{" "}
              <em className="italic text-[#0d7a75] font-normal">
                moves forward.
              </em>
            </h2>
            <p className="text-gray-600 text-[15px] leading-relaxed mb-8">
              We&apos;re not here to keep you in the feeling of distance.
              We&apos;re here to help you close it. Every tool, every guide,
              every step in Rahvana is designed to move you forward — toward
              clarity, toward submission, toward reunion.
            </p>
            <Link
              href="/visa-category/ir-category/ir-1"
              className="inline-flex items-center gap-2.5 bg-[#0d7a75] text-white px-7 py-3.5 rounded-full text-sm font-medium hover:bg-[#0a5c58] transition-all transform hover:-translate-y-0.5"
            >
              Start the IR-1 journey <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="bg-[#faf7f2] py-24 px-8 md:px-20 text-center">
        <div className="flex justify-center mb-5">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 border-[1.5px] border-[#b5451b] rounded-full text-[11px] font-semibold tracking-widest text-[#b5451b] uppercase">
            Voices From The Journey
          </span>
        </div>
        <h2 className="font-serif font-bold text-3xl md:text-5xl text-[#121e2e] mb-14 max-w-4xl mx-auto leading-tight">
          Words from people{" "}
          <em className="italic text-[#0d7a75] font-normal">
            who&apos;ve been there.
          </em>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {[
            {
              bg: "bg-[#fde8ec]",
              iconBg: "bg-[#fbc8d2]",
              author: "Fatima A.",
              role: "IR-1 applicant · Islamabad",
              text: "For the first time, I felt like someone had actually thought about what this process feels like to go through — not just the steps, but the weight of it.",
            },
            {
              bg: "bg-[#e3edf9]",
              iconBg: "bg-[#c4d9f5]",
              author: "Omar K.",
              role: "US Citizen sponsor · Houston",
              text: "Three years of waiting. Rahvana helped me understand where I was in the process without the constant anxiety of not knowing what comes next.",
            },
            {
              bg: "bg-[#fef9e3]",
              iconBg: "bg-[#faedb8]",
              author: "Sara M.",
              role: "Beneficiary spouse · Lahore",
              text: "The form filler saved me hours. But more than that — reading the guides felt like being understood by people who knew what this was really like.",
            },
          ].map((item, i) => (
            <div
              key={i}
              className={`${item.bg} rounded-[20px] p-9 text-left flex flex-col gap-6 shadow-sm`}
            >
              <div
                className={`${item.iconBg} w-9 h-9 rounded-lg flex items-center justify-center text-[#0d7a75]`}
              >
                <Quote size={20} fill="currentColor" />
              </div>
              <blockquote className="text-sm italic text-gray-600 leading-relaxed grow">
                &quot;{item.text}&quot;
              </blockquote>
              <div className="text-sm">
                <strong className="block text-[#121e2e] font-semibold">
                  {item.author}
                </strong>
                <span className="text-xs text-gray-500">{item.role}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* TEAM */}
      <section className="bg-[#f8f8f8] py-24 px-8 md:px-20 text-center">
        <div className="flex justify-center mb-5">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 border-[1.5px] border-[#b5451b] rounded-full text-[11px] font-semibold tracking-widest text-[#b5451b] uppercase">
            The People Behind It
          </span>
        </div>
        <h2 className="font-serif font-bold text-3xl md:text-5xl text-[#121e2e] mb-14 leading-tight">
          Built by people who{" "}
          <em className="italic text-[#0d7a75] font-normal">
            have lived this too.
          </em>
        </h2>

        <div
          className="mx-auto flex max-w-[1100px] flex-col gap-6 md:flex-row md:items-stretch"
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
              role: "Founder",
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
                  // Single CSS transition — runs on compositor, zero JS per frame
                  transition:
                    "flex-grow 480ms cubic-bezier(0.4,0,0.2,1), opacity 350ms ease, filter 350ms ease, transform 350ms ease",
                  willChange: "flex-grow, opacity, filter, transform",
                }}
                className="hidden md:flex bg-white rounded-3xl p-9 shadow-sm border border-black/5 flex-col min-h-[360px] overflow-hidden"
              >
                <div className="relative w-20 h-20 mx-auto mb-7 overflow-hidden rounded-full flex items-center justify-center flex-shrink-0 ring-4 ring-[#0d7a75]/10 shadow-lg">
                  <Image
                    src={member.image}
                    alt={member.name}
                    fill
                    className="object-cover object-top"
                  />
                  <div
                    className={`absolute inset-0 rounded-full flex items-center justify-center text-3xl font-bold text-white ${member.color} hidden`}
                  >
                    {member.initials}
                  </div>
                </div>
                <p className="text-2xl font-serif font-bold text-[#121e2e] mb-1 whitespace-nowrap overflow-hidden text-ellipsis">
                  {member.name}
                </p>
                <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-[#0d7a75] mb-4">
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
                  className="text-sm text-gray-600 leading-relaxed"
                >
                  {member.desc}
                </p>
              </div>
            );
          })}

          {/* Mobile layout — stacked, no animation */}
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
              role: "Founder",
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
          ].map((member, i) => (
            <div
              key={`mobile-${i}`}
              className="md:hidden bg-white rounded-3xl p-9 shadow-sm border border-black/5 flex flex-col"
            >
              <div className="relative w-20 h-20 mx-auto mb-7 overflow-hidden rounded-full flex items-center justify-center flex-shrink-0 ring-4 ring-[#0d7a75]/10 shadow-lg">
                <Image
                  src={member.image}
                  alt={member.name}
                  fill
                  className="object-cover object-top"
                />
              </div>
              <p className="text-2xl font-serif font-bold text-[#121e2e] mb-1">
                {member.name}
              </p>
              <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-[#0d7a75] mb-4">
                {member.role}
              </p>
              <p className="text-sm text-gray-600 leading-relaxed text-left">
                {member.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="bg-[#0d7a75] py-20 px-8 text-center text-white">
        <h2 className="font-serif font-bold text-3xl md:text-5xl leading-tight mb-5 max-w-4xl mx-auto">
          If this journey is part of
          <br />
          your story too,{" "}
          <em className="italic text-[#a8e8e5] font-normal">
            we&apos;re here.
          </em>
        </h2>
        <p className="text-white/75 text-base md:text-lg max-w-lg mx-auto mb-10 leading-relaxed">
          You don&apos;t have to figure it out alone. Rahvana walks with you
          through the IR-1 process — one step, one form, one checkpoint at a
          time.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link
            href="/visa-category/ir-category/ir-1"
            className="bg-white text-[#0d7a75] px-8 py-3.5 rounded-full text-sm font-semibold hover:shadow-xl transition-all transform hover:-translate-y-0.5"
          >
            Start your IR-1 journey →
          </Link>
          <Link
            href="/resources"
            className="bg-transparent border-[1.5px] border-white/50 text-white px-8 py-3.5 rounded-full text-sm font-medium hover:border-white hover:bg-white/10 transition-all"
          >
            Browse tools & resources
          </Link>
        </div>
        <p className="mt-7 text-[14px] text-white/50 tracking-wider">
          Phase 1 · IR-1 Spouse Visa Journey · U.S. Embassy Islamabad · Karachi
          · Lahore
        </p>
      </section>
    </div>
  );
}