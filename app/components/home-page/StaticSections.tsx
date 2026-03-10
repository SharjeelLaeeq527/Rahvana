import React from "react";
import {
  FileText,
  Layout,
  Users,
  IdCard,
  Plane,
  ArrowRight,
  Loader2,
} from "lucide-react";

export function HomeSection({
  onNavigate,
  isSignedIn,
}: {
  onNavigate: (section: string) => void;
  isSignedIn: boolean;
}) {
  return (
    <section id="home" className="block">
      <div className="max-w-[1400px] mx-auto px-6 py-8 md:py-12">
        {/* Hero */}
        <div className="bg-linear-to-br from-[#0d9488]/10 to-[#f59e0b]/10 py-20 px-6 text-center rounded-xl mb-[60px]">
          <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-4 leading-tight">
            Your U.S. visa journey, guided step-by-step
          </h1>
          <p className="text-lg md:text-xl text-slate-500 mb-8 max-w-[700px] mx-auto">
            Navigate complex immigration processes with confidence. From
            petition to visa, we`re with you every step of the way.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <button
              className="px-8 py-4 rounded-lg cursor-pointer text-base font-semibold transition-all no-underline bg-[#0d9488] text-white hover:bg-[#0f766e] hover:-translate-y-px hover:shadow-md"
              onClick={() => onNavigate("journeys")}
              suppressHydrationWarning
            >
              Explore Visa Journeys →
            </button>
            {isSignedIn && (
              <button
                className="px-8 py-4 rounded-lg cursor-pointer text-base font-semibold transition-all no-underline bg-[#0d9488] text-white hover:bg-[#0f766e] hover:-translate-y-px hover:shadow-md"
                onClick={() => onNavigate("dashboard")}
                suppressHydrationWarning
              >
                Go to Dashboard
              </button>
            )}
          </div>
        </div>

        {/* How It Works */}
        <h2 className="text-center mb-10 text-3xl font-bold">
          How Rahvana Works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5">
            <h3 className="text-xl font-bold mb-3">1️⃣ Choose Your Journey</h3>
            <p className="text-slate-500 mb-4">
              Select your visa type (IR-1 spouse, IR-5 parents, K-1 fiancé, and
              more). We`ll show you exactly what to expect.
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5">
            <h3 className="text-xl font-bold mb-3">2️⃣ Follow Step-by-Step</h3>
            <p className="text-slate-500 mb-4">
              Each journey is broken into clear stages and steps. No legal
              jargon—just plain guidance on what to do, when, and how.
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5">
            <h3 className="text-xl font-bold mb-3">3️⃣ Track Your Progress</h3>
            <p className="text-slate-500 mb-4">
              Mark steps complete, use integrated tools, watch tutorials, and
              see your progress grow. You`re never lost.
            </p>
          </div>
        </div>

        {/* Journey Preview */}
        <h2 className="text-center mt-[60px] mb-10 text-3xl font-bold">
          Available Journeys
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 relative">
            <div className="absolute top-4 right-4 px-3 py-1 bg-[#10b981] text-white rounded-full text-xs font-semibold">
              Active
            </div>
            <h3 className="text-xl font-bold mb-3">🇺🇸 IR-1/CR-1 Spouse Visa</h3>
            <p className="text-slate-500 mb-4">
              Bring your spouse to the U.S. via consular processing. Full
              roadmap for Pakistani beneficiaries.
            </p>
            <button
              className="px-6 py-3 rounded-lg cursor-pointer text-[15px] font-semibold transition-all no-underline bg-[#0d9488] text-white hover:bg-[#0f766e] hover:-translate-y-px hover:shadow-md"
              onClick={() => onNavigate("ir1-journey")}
              suppressHydrationWarning
            >
              Start Journey →
            </button>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 relative">
            <div className="absolute top-4 right-4 px-3 py-1 bg-slate-400 text-white rounded-full text-xs font-semibold">
              Coming Soon
            </div>
            <h3 className="text-xl font-bold mb-3 text-black">
              👪 IR-5 Parents Visa
            </h3>
            <p className="text-slate-500 mb-4">
              Sponsor your parents to join you in the U.S. Complete petition and
              consular guide.
            </p>
            <button
              className="px-6 py-3 rounded-lg text-[15px] font-semibold transition-all bg-white text-slate-800 border border-slate-200 hover:border-primary"
              disabled
            >
              Coming Soon
            </button>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 relative">
            <div className="absolute top-4 right-4 px-3 py-1 bg-slate-400 text-white rounded-full text-xs font-semibold">
              Coming Soon
            </div>
            <h3 className="text-xl font-bold mb-3 text-black">
              💍 K-1 Fiancé Visa
            </h3>
            <p className="text-slate-500 mb-4">
              Bring your fiancé to marry in the U.S. Petition through interview
              and adjustment.
            </p>
            <button
              className="px-6 py-3 rounded-lg text-[15px] font-semibold transition-all bg-white text-slate-800 border border-slate-200 hover:border-primary"
              disabled
            >
              Coming Soon
            </button>
          </div>
        </div>

        {/* Helpful Tools */}
        <h2 className="text-center mt-[60px] mb-10 text-3xl font-bold">
          Helpful Tools at Every Stage
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 relative">
            <h3 className="text-xl font-bold mb-3">📸 Photo Booth</h3>
            <p className="text-slate-500 mb-4">
              Make a compliant passport/visa photo in minutes.
            </p>
            <div className="inline-flex px-4 py-2 bg-primary/10 text-primary rounded-full text-xs font-semibold">
              Free
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 relative">
            <h3 className="text-xl font-bold mb-3">📄 </h3>
            <p className="text-slate-500 mb-4">
              CEAC-friendly filenames generated instantly from plain
              descriptions.
            </p>
            <div className="inline-flex px-4 py-2 bg-primary/10 text-primary rounded-full text-xs font-semibold">
              Free
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 relative">
            <h3 className="text-xl font-bold mb-3">🎯 Photo Booth </h3>
            <p className="text-slate-500 mb-4">
              50+ actual embassy questions with suggested answers and tips.
            </p>
            <div className="inline-flex px-4 py-2 bg-orange-100 text-orange-500 rounded-full text-xs font-semibold">
              ⭐ Premium
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function VisaCategorySection({
  onNavigate,
}: {
  onNavigate: (section: string) => void;
}) {
  return (
    <section id="journeys" className="block">
      <div className="max-w-[1400px] mx-auto px-6 py-8 md:py-12">
        <h1 className="text-[40px] font-bold mb-4">Visa Category</h1>
        <p className="text-slate-500 text-lg mb-12">
          Choose your visa type to start your guided journey.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 relative">
            <div className="absolute top-4 right-4 px-3 py-1 bg-[#10b981] text-white rounded-full text-xs font-semibold">
              Active
            </div>
            <h3 className="text-xl font-bold mb-4">🇺🇸 IR-1/CR-1 Spouse Visa</h3>
            <div className="text-slate-500 mb-4">
              <p>
                <strong>For:</strong> U.S. citizens petitioning foreign spouse
              </p>
              <p>
                <strong>Timeline:</strong> 18-36 months average
              </p>
              <p>
                <strong>Process:</strong> USCIS → NVC → Consular Interview →
                Visa
              </p>
            </div>
            <p className="mt-3 text-slate-500">
              Complete roadmap for Pakistani beneficiaries via U.S. Embassy
              Islamabad with stage-by-stage guidance, document vault, and tools.
            </p>
            <button
              className="w-full mt-4 px-8 py-4 rounded-lg cursor-pointer text-base font-semibold transition-all no-underline bg-[#0d9488] text-white hover:bg-[#0f766e] hover:-translate-y-px hover:shadow-md"
              onClick={() => onNavigate("ir1-journey")}
              suppressHydrationWarning
            >
              Start IR-1 Journey →
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 relative">
            <div className="absolute top-4 right-4 px-3 py-1 bg-slate-400 text-white rounded-full text-xs font-semibold">
              Waitlist
            </div>
            <h3 className="text-xl font-bold mb-4">👪 IR-5 Parents Visa</h3>
            <div className="text-slate-500 mb-4">
              <p>
                <strong>For:</strong> U.S. Citizens (21+) petitioning parents
              </p>
              <p>
                <strong>Timeline:</strong> 12-24 months average
              </p>
              <p>
                <strong>Process:</strong> USCIS → NVC → Consular Interview →
                Visa
              </p>
            </div>
            <p className="mt-3 text-slate-500">
              Step-by-step guidance for parent visa applications. Specialized
              help for older applicants and NADRA document verification.
            </p>
            <button
              className="w-full mt-4 px-8 py-4 rounded-lg text-base font-semibold transition-all bg-white text-slate-800 border border-slate-200 cursor-not-allowed"
              disabled
            >
              Coming Soon
            </button>
          </div>
        </div>

        <div className="mt-10 bg-slate-50 border-2 border-dashed border-slate-200 text-center py-16 px-6 rounded-xl">
          <h3 className="text-xl font-bold text-slate-400 mb-2">
            More Categories Coming Soon
          </h3>
          <p className="text-slate-500 text-base">
            K-1 Fiancé, F2A Spouse/Child of LPR, and Student Visas are under
            development.
          </p>
        </div>
      </div>
    </section>
  );
}

export function ToolsSection() {
  const tools = [
    {
      title: "Photo Booth",
      desc: "Make a compliant passport/visa photo in minutes.",
      tags: [
        { label: "Free", color: "bg-[#d1fae5] text-[#065f46]" },
        { label: "Stage I, II, III", color: "bg-[#dbeafe] text-[#1e40af]" },
      ],
    },
    {
      title: "PDF Tool Kit",
      desc: "Merge • compress • convert • edit — all in one toolkit.",
      tags: [
        { label: "Free", color: "bg-[#d1fae5] text-[#065f46]" },
        { label: "Stage II", color: "bg-[#dbeafe] text-[#1e40af]" },
      ],
    },
    {
      title: "Sponsorship Calculator",
      desc: "Auto-check income/assets and tell you what you still need.",
      tags: [
        { label: "Free", color: "bg-[#d1fae5] text-[#065f46]" },
        { label: "Stage II", color: "bg-[#dbeafe] text-[#1e40af]" },
      ],
    },
  ];

  return (
    <section id="tools" className="block">
      <div className="max-w-[1400px] mx-auto px-6 py-8 md:py-12">
        <h1 className="text-[40px] font-bold mb-4">Immigration Tools</h1>
        <p className="text-slate-500 text-lg mb-12">
          Free technical tools to help you prepare your application documents.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          {tools.map((tool, idx) => (
            <div
              key={idx}
              className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 flex flex-col justify-between"
            >
              <div>
                <h3 className="text-xl font-bold mb-3">{tool.title}</h3>
                <p className="text-slate-500 mb-4">{tool.desc}</p>
                <div className="flex gap-2 flex-wrap mt-3">
                  {tool.tags.map((tag, tIdx) => (
                    <span
                      key={tIdx}
                      className={`px-3 py-1 rounded-full text-[13px] font-semibold ${tag.color}`}
                    >
                      {tag.label}
                    </span>
                  ))}
                </div>
              </div>
              <button className="mt-6 px-6 py-3 rounded-lg cursor-pointer text-[15px] font-semibold transition-all no-underline bg-[#0d9488] text-white hover:bg-[#0f766e] hover:-translate-y-px hover:shadow-md w-fit">
                Open Tool →
              </button>
            </div>
          ))}
        </div>

        <h3 className="mt-12 mb-6 text-xl font-bold">
          📝 Templates & Generators
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5">
            <h3 className="text-xl font-bold mb-3">Cover Letter Generator</h3>
            <p className="text-slate-500 mb-4 text-sm">
              Create perfect cover letters for USCIS and NVC packages.
              Pre-filled with Pakistan-specific requirements.
            </p>
            <button className="px-5 py-2 rounded-lg text-[13px] font-semibold border border-slate-200 hover:border-[#0d9488] transition-colors">
              Start Generator
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export function PricingSection() {
  return (
    <section id="pricing" className="block">
      <div className="max-w-[1400px] mx-auto px-6 py-8 md:py-12">
        <h1 className="text-[40px] font-bold mb-4 text-center">
          Plain Pricing
        </h1>
        <p className="text-slate-500 text-lg mb-12 text-center">
          Use the roadmap for free. Upgrade for automation and experts.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-[1100px] mx-auto">
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
            <button className="w-full px-6 py-4 rounded-lg bg-white border border-slate-200 font-bold hover:border-[#0d9488] transition-colors">
              Get Started Free
            </button>
          </div>

          <div className="bg-white border-2 border-[#0d9488] rounded-xl p-8 shadow-xl text-center relative scale-105">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#0d9488] text-white px-4 py-1 rounded-full text-xs font-bold uppercase">
              Popular
            </div>
            <h3 className="text-xl font-bold mb-2">Rahvana Plus</h3>
            <div className="text-[48px] font-bold text-[#0d9488] my-4">
              $9.99{" "}
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
            <button className="w-full px-6 py-4 rounded-lg bg-[#0d9488] text-white font-bold hover:bg-[#0f766e] transition-colors shadow-lg">
              Upgrade to Plus →
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm text-center opacity-70">
            <h3 className="text-xl font-bold mb-2">Rahvana Pro</h3>
            <div className="text-[48px] font-bold text-slate-500 my-4">
              $199{" "}
              <span className="text-sm text-slate-400 font-normal">
                Expert Assitance
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

export function IR1JourneyDetail({
  isSignedIn,
  onToggleAuth,
  children,
}: {
  isSignedIn: boolean;
  onToggleAuth: () => void;
  onStart: () => void;
  children?: React.ReactNode;
}) {
  return (
    <section id="ir1-journey" className="block">
      <div className="max-w-[1400px] mx-auto px-6 py-8 md:py-12">
        <div className="max-w-5xl mx-auto mb-12">
          <h1 className="text-5xl font-bold mb-4">
            IR-1/CR-1 Spouse Visa Journey
          </h1>
          <p className="text-slate-500 mb-8 text-lg">
            Comprehensive roadmap for bringing your spouse to the United States
            via consular processing at U.S. Embassy Islamabad, Pakistan.
          </p>

          {/* Stage Overview */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-1 h-8 bg-[#0d9488] rounded-full" />
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                The 5 Stages of Your Journey
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {[
                {
                  stage: "I",
                  title: "USCIS Petition",
                  time: "17-65 months",
                  icon: FileText,
                  color: "bg-blue-50 text-blue-600",
                },
                {
                  stage: "II",
                  title: "NVC Processing",
                  time: "4-9 months",
                  icon: Layout,
                  color: "bg-indigo-50 text-indigo-600",
                },
                {
                  stage: "III",
                  title: "Med + Interview",
                  time: "2-4 weeks",
                  icon: Users,
                  color: "bg-emerald-50 text-emerald-600",
                },
                {
                  stage: "IV",
                  title: "Visa & Travel",
                  time: "1-2 weeks",
                  icon: IdCard,
                  color: "bg-amber-50 text-amber-600",
                },
                {
                  stage: "V",
                  title: "U.S. Arrival",
                  time: "90 days",
                  icon: Plane,
                  color: "bg-rose-50 text-rose-600",
                },
              ].map(({ stage, title, time, icon: Icon, color }) => (
                <div key={stage} className="relative group">
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:border-[#0d9488]/30 hover:-translate-y-1 h-full flex flex-col">
                    <div
                      className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-4 transition-transform group-hover:scale-110`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                      Stage {stage}
                    </span>
                    <h4 className="font-bold text-slate-800 text-[15px] mb-2 leading-tight">
                      {title}
                    </h4>
                    <div className="mt-auto pt-2 flex items-center gap-1.5 text-slate-500">
                      <Loader2 className="w-3 h-3 animate-spin-slow" />
                      <span className="text-[11px] font-medium">{time}</span>
                    </div>
                  </div>
                  {/* Connectivity Line for Desktop */}
                  {stage !== "V" && (
                    <div className="hidden lg:flex absolute top-1/2 left-[calc(100%+8px)] -translate-x-1/2 -translate-y-1/2 z-20 items-center justify-center w-6 h-6">
                      <ArrowRight className="w-5 h-5 text-slate-300" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {!isSignedIn && (
            <div className="bg-[#faba20] text-[#7c2d12] rounded-2xl p-6 mb-8 text-center shadow-sm">
              <div className="flex items-center justify-center gap-2 mb-4">
                <span className="text-2xl" role="img" aria-label="lock">
                  🔒
                </span>
                <h4 className="text-2xl font-bold">Full Wizard Access</h4>
              </div>
              <p className="mb-4 text-lg opacity-90 mx-auto">
                Sign in free to save your progress, mark steps complete, and use
                the document vault.
              </p>
              <button
                className="px-8 py-3 rounded-xl bg-primary/90 text-white font-bold text-lg hover:bg-[#0f766e] transition-all shadow-lg active:scale-95"
                onClick={onToggleAuth}
                suppressHydrationWarning
              >
                Sign In Free
              </button>
            </div>
          )}
        </div>

        {children}
      </div>
    </section>
  );
}
