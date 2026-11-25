import Link from "next/link";

const TEAL_DARK = "#0a5a5d";
const SERIF = '"DM Serif Display", Georgia, serif';

/**
 * Bottom CTA band on resource detail pages. Opens the resource itself: a tool or
 * guide unlocks there with wallet credits, a service is booked and paid with
 * credits in its own flow. Nothing is sold for dollars here.
 */
export default function BottomCta({
  title,
  href,
  isService,
}: {
  title: string;
  href: string;
  isService: boolean;
}) {
  return (
    <section
      className="mt-24 flex flex-col items-start justify-between gap-6 rounded-[22px] p-9 sm:flex-row sm:items-center"
      style={{ backgroundColor: TEAL_DARK }}
    >
      <div>
        <h2 className="text-[24px] leading-tight text-white" style={{ fontFamily: SERIF }}>
          {isService ? `Ready to start ${title}?` : `Ready to use ${title}?`}
        </h2>
        <p className="mt-1.5 text-[14px] text-white/70">
          Paid with Rahvana credits ($1 = 1 credit). No full journey plan required.
        </p>
      </div>
      <Link
        href={href}
        className="inline-flex shrink-0 items-center justify-center rounded-full bg-white px-7 py-3.5 text-[15px] font-semibold transition-transform duration-200 hover:-translate-y-0.5"
        style={{ color: TEAL_DARK }}
      >
        {isService ? `Book ${title} →` : `Open ${title} →`}
      </Link>
    </section>
  );
}
