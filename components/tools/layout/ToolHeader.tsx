"use client";

import React, { useState } from "react";
import { Heart, HelpCircle, Loader2, Clock } from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import { useQuickAccess, type QuickAccessItem } from "@/app/context/QuickAccessContext";
import { useToast } from "@/app/components/shared/ToastProvider";
import type { ToolThemePalette, ToolHistoryAction } from "./types";

interface ToolHeaderProps {
  title: React.ReactNode;
  tagline?: React.ReactNode;
  category?: React.ReactNode;
  priceOrDuration?: React.ReactNode;
  theme: ToolThemePalette;
  quickAccessItem?: QuickAccessItem;
  historyAction?: ToolHistoryAction;
  hasDrawerContent?: boolean;
  onOpenDrawer?: () => void;
  headerActions?: React.ReactNode;
}

// Rahvana Bird SVG Watermark from Option C
const WATERMARK_SVG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='200 100 760 810'%3E%3Cpath fill='%23fff' fill-opacity='.2' fill-rule='evenodd' d='M236,880C228,876 222,867 222,860C222,854 229,840 237,832C244,824 270,806 281,801C284,800 296,794 300,792C307,789 328,781 348,774C352,772 358,770 360,770C361,769 364,768 366,768C367,768 370,767 371,766C372,766 376,764 380,763C383,762 387,761 390,760C392,760 397,758 401,757C405,756 413,754 418,753C424,751 429,750 430,750C432,750 448,740 452,735C454,734 458,730 462,728C482,713 509,687 523,667C529,659 529,657 523,657C518,657 500,652 492,648C487,646 474,640 469,637C449,626 418,594 404,570C400,564 399,562 389,556C359,535 336,510 321,479C307,452 300,426 300,400C300,383 301,378 306,374C311,370 319,373 326,381C327,383 330,386 331,387C332,389 333,390 333,390C333,391 335,394 338,398C340,403 342,406 342,407C342,407 344,411 346,416C348,421 352,429 354,434C356,440 358,445 359,446C359,448 361,452 363,457C365,462 367,469 369,472C371,476 372,480 372,481C372,481 373,484 374,486C377,493 378,496 379,500C380,502 383,507 384,511C386,514 387,517 387,518C387,518 388,521 390,525C392,529 394,533 395,535C397,540 397,541 402,550C421,585 441,608 468,626C475,631 496,642 498,642C498,642 500,643 502,643C509,646 526,650 532,650C535,650 535,650 541,639C544,632 546,626 546,626C546,625 546,624 547,623C548,622 552,609 557,591C563,564 561,527 551,502C540,474 522,455 487,434C485,433 465,423 462,421C454,418 432,409 421,405C417,403 412,401 410,400C409,400 405,398 403,397C398,396 393,393 382,388C368,382 366,381 361,378C358,376 356,375 355,375C355,375 352,374 350,372C347,371 345,369 344,368C308,347 280,314 266,276C263,267 258,251 257,245C256,242 254,236 254,233C249,216 247,184 248,161C249,142 252,136 259,132C269,127 278,135 293,159C311,187 325,207 337,220C339,223 344,229 347,232C366,254 396,279 416,290C419,291 422,293 424,294C428,297 442,303 451,308C462,313 471,317 476,319C490,325 493,326 502,331C507,333 516,338 520,340C525,343 531,346 533,347C540,351 550,358 560,365C566,369 572,374 573,375C580,380 602,402 609,412C620,427 622,430 630,446C635,457 637,462 643,480C646,488 649,504 653,525C659,563 660,567 668,567C671,567 673,566 675,566C676,565 677,564 678,564C680,564 710,541 728,525C732,522 744,511 754,501C779,477 785,472 798,464C816,454 834,449 854,452C869,454 879,458 892,469C898,474 902,476 913,477C935,480 943,482 943,485C942,487 935,491 930,492C921,494 907,500 894,507C880,515 866,529 858,544C852,555 846,567 846,569C846,570 846,571 845,572C845,572 843,576 842,581C839,589 838,592 835,600C835,602 833,606 832,610C831,615 826,630 822,640C810,675 776,713 739,732C735,734 731,737 730,737C729,738 721,742 714,744C678,758 649,762 609,760C585,759 577,758 568,757C521,751 463,751 439,757C434,758 402,783 383,800C377,805 370,810 368,813C359,820 353,825 340,836C312,859 289,874 269,880C261,883 242,883 236,880ZM259,873C275,872 299,859 323,840C328,836 334,831 337,829C339,826 348,819 355,813C366,803 377,794 395,780C396,778 398,777 399,776C400,775 403,773 406,770C415,763 417,761 409,763C406,764 398,767 391,769C373,773 378,772 340,785C336,786 332,787 331,788C330,788 328,789 326,790C308,797 285,807 276,812C248,829 231,848 231,861C231,866 237,873 243,874C245,874 247,874 248,875C248,875 250,875 251,874C252,874 256,874 259,873ZM652,751C666,749 677,747 683,745C697,741 700,740 711,736C717,734 723,731 725,730C726,730 727,729 728,729C728,729 731,728 733,726C736,724 738,723 739,723C740,723 759,710 766,704C774,697 788,683 791,678C798,669 804,659 804,659C804,658 805,657 805,656C807,654 816,632 820,622C821,617 823,612 823,611C824,610 826,603 828,596C830,589 833,579 835,574C837,568 839,562 840,561C840,560 841,557 842,556C842,555 843,553 844,552C856,529 871,512 888,502C897,497 911,490 914,489C923,488 921,485 911,485C900,484 895,481 884,473C874,466 870,463 860,461C848,458 829,459 816,464C797,472 785,481 746,520C739,527 730,535 726,538C722,541 715,546 710,551C679,575 669,579 661,574C652,568 650,562 643,521C635,473 625,446 601,414C593,404 573,384 561,375C548,365 523,350 510,344C508,343 505,341 504,341C489,333 476,327 475,327C474,327 471,326 468,324C464,323 459,320 455,318C411,299 383,280 352,248C325,221 316,208 282,157C266,133 260,132 257,154C255,168 257,210 260,222C260,224 262,229 262,234C265,245 268,257 273,269C274,272 276,276 276,277C279,287 291,309 301,321C309,332 337,357 340,357C341,357 344,359 347,361C350,363 357,367 362,369C376,376 392,384 392,384C393,384 396,385 399,387C405,390 424,398 432,401C435,402 441,404 446,407C452,409 456,411 457,411C457,411 459,412 461,412C462,413 468,416 474,419C489,426 491,427 498,431C536,456 554,479 565,519C567,526 567,529 567,554C567,581 567,589 563,600C562,601 562,604 561,606C561,609 559,615 557,620C555,626 552,632 552,633C552,635 549,639 547,643C545,647 544,650 544,651C545,651 552,651 559,651C594,651 625,641 668,615C673,612 678,609 679,609C680,608 683,607 686,605C691,602 694,602 694,604C694,605 678,617 667,624C654,633 636,642 627,646C596,656 584,659 556,660L538,660L534,666C530,672 530,673 522,682C518,686 513,692 511,695C507,699 488,718 481,723C474,729 462,738 460,740C457,742 454,745 455,745C455,746 463,745 472,745C492,743 529,745 557,748C576,750 595,752 602,752C612,753 645,752 652,751ZM390,545C390,544 390,543 389,542C386,537 378,518 371,501C369,495 365,486 363,482C362,477 359,470 357,466C356,462 353,455 351,450C349,445 347,440 347,438C335,406 319,380 312,381C310,381 309,382 309,388C308,395 309,420 310,424C311,425 312,429 312,431C312,433 314,438 314,440C315,442 317,447 318,449C324,472 342,502 359,520C374,536 390,549 390,545Z'/%3E%3C/svg%3E";

export function ToolHeader({
  title,
  tagline,
  // category,
  // priceOrDuration,
  theme,
  quickAccessItem,
  historyAction,
  hasDrawerContent = false,
  onOpenDrawer,
  headerActions,
}: ToolHeaderProps) {
  const { user } = useAuth();
  const { items, addItem, removeItem, isPending } = useQuickAccess();
  const { showToast } = useToast();
  const [localBusy, setLocalBusy] = useState(false);

  const isPinned = quickAccessItem ? items.some((i) => i.id === quickAccessItem.id) : false;

  const handleBookmarkToggle = async () => {
    if (!quickAccessItem) return;

    if (!user) {
      showToast("Sign in to bookmark this tool to your Quick Access menu.", "info");
      return;
    }

    setLocalBusy(true);
    try {
      if (isPinned) {
        await removeItem(quickAccessItem.id);
        showToast(`Removed "${quickAccessItem.title}" from Quick Access.`, "info");
      } else {
        await addItem(quickAccessItem);
        showToast(`Saved "${quickAccessItem.title}" to Quick Access.`, "success");
      }
    } catch {
      showToast("Could not update Quick Access bookmark.", "error");
    } finally {
      setLocalBusy(false);
    }
  };

  return (
    <section
      className="relative px-4 pt-20 pb-20 text-white transition-colors duration-300 sm:px-6 sm:pt-20 sm:pb-22"
      style={{
        backgroundColor: theme.accentDark,
        backgroundImage: `url("${WATERMARK_SVG}")`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right max(24px, calc(50% - 560px)) bottom 18px",
        backgroundSize: "150px auto",
      }}
    >
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Left: Titles & Taglines */}
          <div className="min-w-0 flex-1">
            {/* {category && (
              <span className="mb-1 block font-serif text-xs font-semibold tracking-wider text-white/75 uppercase italic">
                {category}
              </span>
            )} */}
            <h1 className="font-serif text-2xl leading-tight font-semibold tracking-tight text-white sm:text-3xl md:text-4xl">
              {title}
            </h1>
            {tagline && (
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-white/80 sm:text-[15px]">
                {tagline}
              </p>
            )}
            {/* {priceOrDuration && (
              <p className="mt-2 text-xs text-white/70 font-medium">
                {priceOrDuration}
              </p>
            )} */}
          </div>

          {/* Right: Actions (QuickAccess Bookmark & Rules/Help Drawer trigger) */}
          <div className="flex shrink-0 items-center gap-2.5 self-start sm:self-center">
            {/* QuickAccess Bookmark / Save button (Option C ghost-w pill) */}
            {quickAccessItem && (
              <button
                type="button"
                onClick={handleBookmarkToggle}
                disabled={isPending || localBusy}
                aria-pressed={isPinned}
                className={`inline-flex cursor-pointer items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 ${
                  isPinned
                    ? "bg-white shadow-sm"
                    : "border border-white/35 bg-transparent text-white hover:bg-white/10"
                }`}
                style={isPinned ? { color: theme.accentDark } : undefined}
                title={isPinned ? "Remove from favorite" : "Add to favorite"}
              >
                {localBusy || isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Heart className={`h-4 w-4 ${isPinned ? "fill-current" : ""}`} />
                )}
                <span>{isPinned ? "Saved" : "Save"}</span>
              </button>
            )}

            {/* History Action (Reserved slot in hero header next to Save button) */}
            {historyAction && (
              <button
                type="button"
                onClick={historyAction.onClick}
                disabled={historyAction.disabled}
                aria-expanded={historyAction.isOpen}
                className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 ${
                  historyAction.isOpen
                    ? "bg-white shadow-sm"
                    : "border border-white/35 bg-transparent text-white hover:bg-white/10"
                }`}
                style={historyAction.isOpen ? { color: theme.accentDark } : undefined}
                title={historyAction.isOpen ? "Hide search history" : "Show search history"}
              >
                <Clock className="h-4 w-4" />
                <span>{historyAction.label || "History"}</span>
                {typeof historyAction.count === "number" && (
                  <span
                    className={`ml-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-bold ${
                      historyAction.isOpen
                        ? "bg-[#16302C]/10 text-[#16302C]"
                        : "bg-white/20 text-white"
                    }`}
                  >
                    {historyAction.count}
                  </span>
                )}
              </button>
            )}

            {/* Rules and help button (Only shown if no historyAction is present) */}
            {!historyAction && hasDrawerContent && onOpenDrawer && (
              <button
                type="button"
                onClick={onOpenDrawer}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-white/35 bg-transparent px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-white/10"
              >
                <HelpCircle className="h-4 w-4" />
                <span>Rules &amp; help</span>
              </button>
            )}

            {/* Optional custom header actions */}
            {headerActions}
          </div>
        </div>
      </div>
    </section>
  );
}
