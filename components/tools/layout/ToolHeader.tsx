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
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='200 100 760 810'%3E%3Cpath fill='%23fff' fill-opacity='.18' fill-rule='evenodd' d='M236,880C228,876 222,867 222,860C222,854 229,840 237,832C244,824 270,806 281,801C284,800 296,794 300,792C307,789 328,781 348,774C352,772 358,770 360,770C361,769 364,768 366,768C367,768 370,767 371,766C372,766 376,764 380,763C383,762 387,761 390,760C392,760 397,758 401,757C405,756 413,754 418,753C424,751 429,750 430,750C432,750 448,740 452,735C454,734 458,730 462,728C482,713 509,687 523,667C529,659 529,657 523,657C518,657 500,652 492,648C487,646 474,640 469,637C449,626 418,594 404,570C400,564 399,562 389,556C359,535 336,510 321,479C307,452 300,426 300,400C300,383 301,378 306,374C311,370 319,373 326,381C327,383 330,386 331,387C332,389 333,390 333,390C333,391 335,394 338,398C340,403 342,406 342,407C342,407 344,411 346,416C348,421 352,429 354,434C356,440 358,445 359,446C359,448 361,452 363,457C365,462 367,469 369,472C371,476 372,480 372,481C372,481 373,484 374,486C377,493 378,496 379,500C380,502 383,507 384,511C386,514 387,517 387,518C387,518 388,521 390,525C392,529 394,533 395,535C397,540 397,541 402,550C421,585 441,608 468,626C475,631 496,642 498,642C498,642 500,643 502,643C509,646 526,650 532,650C535,650 535,650 541,639C544,632 546,626 546,626C546,625 546,624 547,623C548,622 552,609 557,591C563,564 561,527 551,502C540,474 522,455 487,434C485,433 465,423 462,421C454,418 432,409 421,405C417,403 412,401 410,400C409,400 405,398 403,397C398,396 393,393 382,388C368,382 366,381 361,378C358,376 356,375 355,375C355,375 352,374 350,372C347,371 345,369 344,368C308,347 280,314 266,276C263,267 258,251 257,245C256,242 254,236 254,233C249,216 247,184 248,161C249,142 252,136 259,132C269,127 278,135 293,159C311,187 325,207 337,220C339,223 344,229 347,232C366,254 396,279 416,290C419,291 422,293 424,294C428,297 442,303 451,308C462,313 471,317 476,319C490,325 493,326 502,331C507,333 516,338 520,340C525,343 531,346 533,347C540,351 550,358 560,365C566,369 572,374 573,375C580,380 602,402 609,412C620,427 622,430 630,446C635,457 637,462 643,480C646,488 649,504 653,525C659,563 660,567 668,567C671,567 673,566 675,566C676,565 677,564 678,564C680,564 710,541 728,525C732,522 744,511 754,501C779,477 785,472 798,464C816,454 834,449 854,452C869,454 879,458 892,469C898,474 902,476 913,477C935,480 943,482 943,485C942,487 935,491 930,492C921,494 907,500 894,507C880,515 866,529 858,544C852,555 846,567 846,569C846,570 846,571 845,572C845,572 843,576 842,581C839,589 838,592 835,600C835,602 833,606 832,610C831,615 826,630 822,640C810,675 776,713 739,732C735,734 731,737 730,737C729,738 721,742 714,744C678,758 649,762 609,760C585,759 577,758 568,757C521,751 463,751 439,757C434,758 402,783 383,800C377,805 370,810 368,813C359,820 353,825 340,836C312,859 289,874 269,880C261,883 242,883 236,880Z'/%3E%3C/svg%3E";

export function ToolHeader({
  title,
  tagline,
  category,
  priceOrDuration,
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
      className="relative px-4 pt-7 pb-20 text-white transition-colors duration-300 sm:px-6 sm:pb-22"
      style={{
        backgroundColor: theme.accentDark,
        backgroundImage: `url("${WATERMARK_SVG}")`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right max(24px, calc(50% - 560px)) bottom 18px",
        backgroundSize: "160px auto",
      }}
    >
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Left: Titles & Taglines */}
          <div className="min-w-0 flex-1">
            {category && (
              <span className="mb-1 block font-serif text-xs font-semibold tracking-wider text-white/75 uppercase italic">
                {category}
              </span>
            )}
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
