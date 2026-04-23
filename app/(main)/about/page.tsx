"use client";

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
      <section className="min-h-screen grid md:grid-cols-2 items-center gap-10 md:gap-16 px-8 md:px-20 pt-24 pb-20 bg-[#faf7f2] relative overflow-hidden">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={containerVariants}
          className="flex flex-col gap-7"
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
            className="font-bold font-serif text-5xl md:text-6xl leading-[1.1] text-[#121e2e]"
          >
            Some journeys begin
            <br />
            with paperwork.
            <br />
            <em className="italic text-[#0d7a75] font-bold">Ours began</em>
            <br />
            with distance.
          </motion.h1>
          <motion.p
            variants={itemVariants}
            className="text-base leading-relaxed text-gray-600 max-w-md"
          >
            Rahvana was built for the space between people who belong together —
            the weeks that stretch too long, the forms that carry real lives,
            and the quiet hope families hold onto while they wait to be
            reunited.
          </motion.p>
          <motion.div
            variants={itemVariants}
            className="flex flex-wrap items-center gap-5 mt-2"
          >
            <Link
              href="/visa-category/ir-category/ir-1"
              className="inline-flex items-center gap-2.5 bg-[#0d7a75] text-white px-7 py-3.5 rounded-full text-sm font-medium hover:bg-[#0a5c58] transition-all transform hover:-translate-y-0.5"
            >
              Start your journey <ArrowRight size={16} />
            </Link>
            <span className="text-xs text-gray-400 tracking-wide uppercase">
              IR-1 · Spouse Visa · Phase 1
            </span>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          viewport={{ once: true }}
          className="relative flex justify-center"
        >
          <div className="relative w-full max-w-[520px] aspect-4/3 rounded-3xl overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.14)] group">
            <Image
              src="/assets/images/about-hero-image.png"
              alt="Airport reunion"
              fill
              priority
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute bottom-7 left-7 bg-white rounded-2xl px-5 py-3.5 flex items-center gap-3 shadow-xl">
              <div className="w-9 h-9 bg-teal-50 rounded-full flex items-center justify-center text-[#0d7a75]">
                <Heart size={18} />
              </div>
              <div>
                <strong className="block text-sm text-[#121e2e]">
                  IR-1 Journey
                </strong>
                <span className="text-xs text-gray-500">
                  Guiding families home
                </span>
              </div>
            </div>
          </div>
          {/* <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-gray-400 text-[10px] tracking-[0.12em] uppercase">
            <span>SCROLL</span>
            <div className="w-px h-10 bg-gradient-to-b from-gray-400 to-transparent"></div>
          </div> */}
        </motion.div>
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
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 md:gap-20 items-start">
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
          <div className="flex flex-col gap-3.5">
            {[
              {
                icon: <Handshake className="text-[#0d7a75]" size={20} />,
                text: "Immigration help should feel humane, not mechanical.",
              },
              {
                icon: <Lightbulb className="text-[#0d7a75]" size={20} />,
                text: "Clarity is a form of care.",
              },
              {
                icon: <Briefcase className="text-[#0d7a75]" size={20} />,
                text: "Being far from your loved ones is already hard enough. The tools you use shouldn't add to that burden.",
              },
              {
                icon: <Folder className="text-[#0d7a75]" size={20} />,
                text: "Every case number belongs to a real person with a real story.",
              },
              {
                icon: <Compass className="text-[#0d7a75]" size={20} />,
                text: "Good guidance respects your intelligence and your situation.",
              },
            ].map((value, i) => (
              <motion.div
                key={i}
                whileHover={{ x: 4, boxShadow: "0 6px 24px rgba(0,0,0,0.1)" }}
                className="bg-white rounded-2xl p-5 px-6 flex items-start gap-4 shadow-sm border-l-3 border-[#0d7a75] transition-all"
              >
                <div className="shrink-0 mt-0.5">{value.icon}</div>
                <p className="text-[15px] text-[#2a2a2a] leading-relaxed">
                  {value.text}
                </p>
              </motion.div>
            ))}
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

        <div className="flex flex-wrap justify-center gap-6 max-w-[900px] mx-auto">
          {[
            {
              initials: "AH",
              color: "bg-[#0d7a75]",
              role: "FOUNDER",
              desc: "Built Rahvana after watching someone close navigate the IR-1 process entirely alone — every form, every wait, every unanswered question.",
            },
            {
              initials: "SR",
              color: "bg-[#e8a020]",
              role: "PRODUCT",
              desc: "Believes that the right tool at the right moment can completely change how a hard journey feels.",
            },
            {
              initials: "FA",
              color: "bg-[#d9406a]",
              role: "SUPPORT & COMMUNITY",
              desc: "Dedicated to making every interaction feel like you're talking to someone who has read your case — not just a script.",
            },
          ].map((member, i) => (
            <div
              key={i}
              className="bg-white rounded-3xl p-9 w-full md:w-[260px] shadow-sm border border-black/5"
            >
              <div
                className={`${member.color} w-16 h-16 rounded-full flex items-center justify-center text-lg font-bold text-white mx-auto mb-4`}
              >
                {member.initials}
              </div>
              <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-[#0d7a75] mb-3">
                {member.role}
              </p>
              <p className="text-sm text-gray-600 leading-relaxed">
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

      {/* FOOTER */}
      <footer className="bg-[#121e2e] pt-16 pb-10 px-8 md:px-20 text-white/70">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 md:gap-16 mb-14">
          <div className="lg:col-span-2">
            <a
              href="#"
              className="flex items-center gap-2 text-2xl font-bold text-white tracking-tighter"
            >
              <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
                <path
                  d="M6 26 C6 26 10 10 16 8 C22 6 26 14 22 20 C18 26 10 24 10 18 C10 12 16 12 18 16"
                  stroke="#0d7a75"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>
              rahvana
            </a>
            <p className="mt-4 text-sm text-white/50 leading-relaxed max-w-xs">
              Simplifying immigration journeys with guidance, tools, and expert
              support. Your path to reuniting with loved ones starts here.
            </p>
          </div>

          {[
            {
              title: "JOURNEYS",
              links: [
                "Family & Protection",
                "Work & Business",
                "Work Green Cards",
                "Students & Visitors",
              ],
            },
            {
              title: "TOOLS",
              links: [
                "Case Strength Analyzer",
                "Visa Path Finder",
                "Sponsorship Calculator",
                "PDF Tool Kit",
              ],
            },
            { title: "COMPANY", links: ["About Us", "Contact"] },
          ].map((col, i) => (
            <div key={i}>
              <h4 className="text-[11px] font-bold tracking-[0.12em] uppercase text-white/40 mb-4">
                {col.title}
              </h4>
              <ul className="flex flex-col gap-2.5 text-[13px]">
                {col.links.map((link, j) => (
                  <li key={j}>
                    <a href="#" className="hover:text-white transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
              {col.title !== "COMPANY" && (
                <a
                  href="#"
                  className="inline-block mt-3 text-white text-[13px] underline underline-offset-4 hover:no-underline"
                >
                  Explore all {col.title === "JOURNEYS" ? "Journeys" : "Tools"}{" "}
                  →
                </a>
              )}
            </div>
          ))}

          <div>
            <h4 className="text-[11px] font-bold tracking-[0.12em] uppercase text-white/40 mb-4">
              CONNECT WITH US
            </h4>
            <ul className="flex flex-col gap-2.5 text-[13px]">
              {["Instagram", "Facebook", "X", "Youtube", "LinkedIn"].map(
                (social, i) => (
                  <li key={i}>
                    <a href="#" className="hover:text-white transition-colors">
                      {social}
                    </a>
                  </li>
                ),
              )}
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto border-t border-white/10 pt-7 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-white/30">
          <span>
            © 2026 Rahvana. All rights reserved. · Rahvana is not a law firm and
            does not provide legal advice.
          </span>
          <div className="flex gap-4">
            <a href="#" className="hover:text-white/70">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-white/70">
              Terms of Service
            </a>
            <a href="#" className="hover:text-white/70">
              Cookie Policy
            </a>
          </div>
        </div>
      </footer>

      {/* FEEDBACK BUTTON */}
      <div className="fixed bottom-7 right-7 bg-[#0d7a75] text-white px-5 py-3 rounded-full text-xs font-medium flex items-center gap-2 shadow-2xl hover:-translate-y-0.5 transition-transform cursor-pointer z-50">
        <MessageSquare size={16} />
        Provide feedback
      </div>
    </div>
  );
}
