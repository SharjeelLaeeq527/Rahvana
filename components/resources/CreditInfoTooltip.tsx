
"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Info, X } from "lucide-react";

interface CreditInfoTooltipProps {
  message: string;
  side?: "top" | "bottom";
}

export default function CreditInfoTooltip({
  message,
  side = "top",
}: CreditInfoTooltipProps) {
  const tooltipId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [isTouch, setIsTouch] = useState(false);

  const [position, setPosition] = useState({
    top: 0,
    left: 12,
    placement: side as "top" | "bottom",
  });

  useEffect(() => {
    setMounted(true);

    const updateInputMode = (event: PointerEvent) => {
      setIsTouch(event.pointerType === "touch");
    };

    document.addEventListener("pointerdown", updateInputMode, true);

    return () => {
      document.removeEventListener("pointerdown", updateInputMode, true);
    };
  }, []);

  useEffect(() => {
    if (!open || !mounted) return;

    const updatePosition = () => {
      const trigger = triggerRef.current;
      const tooltip = tooltipRef.current;

      if (!trigger || !tooltip) return;

      const rect = trigger.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const padding = 12;
      const gap = 10;
      const width = Math.min(288, viewportWidth - padding * 2);

      const height = tooltip.getBoundingClientRect().height;

      const spaceAbove = rect.top - padding;
      const spaceBelow = viewportHeight - rect.bottom - padding;

      let placement = side;

      if (placement === "top" && spaceAbove < height + gap) {
        placement =
          spaceBelow >= height + gap ? "bottom" : "top";
      } else if (
        placement === "bottom" &&
        spaceBelow < height + gap
      ) {
        placement =
          spaceAbove >= height + gap ? "top" : "bottom";
      }

      const left = Math.max(
        padding,
        Math.min(
          rect.right - width,
          viewportWidth - width - padding
        )
      );

      const preferredTop =
        placement === "top"
          ? rect.top - height - gap
          : rect.bottom + gap;

      const top = Math.max(
        padding,
        Math.min(
          preferredTop,
          viewportHeight - height - padding
        )
      );

      setPosition({ top, left, placement });
    };

    updatePosition();

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, mounted, side, message]);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;

      if (
        !triggerRef.current?.contains(target) &&
        !tooltipRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const handleMouseEnter = () => {
    if (!isTouch) setOpen(true);
  };

  const handleMouseLeave = () => {
    if (!isTouch && !triggerRef.current?.matches(":focus")) {
      setOpen(false);
    }
  };

  const handleClick = () => {
    if (isTouch) {
      setOpen((current) => !current);
    } else {
      setOpen(true);
    }
  };

  return (
    <span className="inline-flex shrink-0">
      <button
        ref={triggerRef}
        type="button"
        aria-label="Credit information"
        aria-expanded={open}
        aria-describedby={open ? tooltipId : undefined}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        onFocus={() => {
          if (!isTouch) setOpen(true);
        }}
        onBlur={(event) => {
          const next = event.relatedTarget as Node | null;

          if (
            !tooltipRef.current?.contains(next) &&
            !triggerRef.current?.contains(next)
          ) {
            if (!isTouch) setOpen(false);
          }
        }}
        className="
          inline-flex h-6 w-6 shrink-0 items-center justify-center
          rounded-full border border-slate-300 bg-white
          text-slate-600 shadow-sm
          transition-colors duration-150
          hover:border-[#0d7377] hover:bg-[#eaf5f4]
          hover:text-[#0d7377]
          focus-visible:outline-none
          focus-visible:ring-2 focus-visible:ring-[#0d7377]/40
          focus-visible:ring-offset-2
        "
      >
        <Info size={15} strokeWidth={2.2} aria-hidden="true" />
      </button>

      {mounted &&
        open &&
        createPortal(
          <div
            ref={tooltipRef}
            id={tooltipId}
            role="tooltip"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            style={{
              position: "fixed",
              top: position.top,
              left: position.left,
              width: "min(288px, calc(100vw - 24px))",
              zIndex: 2147483000,
            }}
            className="
              rounded-xl border border-white/10
              bg-[#172526] p-4
              text-left text-[13px] font-normal
              leading-[1.7] tracking-[0.01em]
              text-white
              shadow-[0_12px_36px_rgba(0,0,0,0.30)]
              [overflow-wrap:anywhere]
            "
          >
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#afdbdb]">
                Credit information
              </span>

              <button
                type="button"
                aria-label="Close tooltip"
                onClick={() => {
                  setOpen(false);
                  triggerRef.current?.focus();
                }}
                className="
                  inline-flex h-6 w-6 shrink-0 items-center
                  justify-center rounded-md text-slate-300
                  hover:bg-white/10 hover:text-white
                  focus-visible:outline-none
                  focus-visible:ring-2 focus-visible:ring-[#afdbdb]
                "
              >
                <X size={14} aria-hidden="true" />
              </button>
            </div>

            <p className="m-0 whitespace-normal break-words text-white">
              {message}
            </p>

            <span
              aria-hidden="true"
              className={`
                absolute h-2.5 w-2.5 rotate-45
                border-white/10 bg-[#172526]
                ${
                  position.placement === "top"
                    ? "bottom-[-6px] border-r border-b"
                    : "top-[-6px] border-l border-t"
                }
              `}
              style={{
                left: Math.max(
                  12,
                  Math.min(
                    (triggerRef.current?.getBoundingClientRect().left ?? 0) +
                      (triggerRef.current?.getBoundingClientRect().width ?? 0) /
                        2 -
                      position.left -
                      5,
                    260
                  ),
                ),
              }}
            />
          </div>,
          document.body
        )}
    </span>
  );
}
