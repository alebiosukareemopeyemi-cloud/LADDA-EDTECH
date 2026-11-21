"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import type { Rect } from "./useTargetRect";
import type { TourStep } from "./steps";

type Props = {
  step: TourStep;
  index: number;
  total: number;
  rect: Rect | null;
  paused: boolean;
  isFirst: boolean;
  isLast: boolean;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
  onTogglePause: () => void;
  /** Called with the card's box so the overlay can draw its leader line. */
  onMeasure: (box: DOMRect | null) => void;
  children?: ReactNode;
};

const CARD_W = 440;
const GAP = 28;
const MARGIN = 16;
const TOP_SAFE = 76; // below the top bar

function useViewport() {
  const [v, setV] = useState({ w: 1280, h: 800 });
  useEffect(() => {
    const read = () => setV({ w: window.innerWidth, h: window.innerHeight });
    read();
    window.addEventListener("resize", read);
    return () => window.removeEventListener("resize", read);
  }, []);
  return v;
}

// Put the card beside the hole where it fits: right, left, below, above.
// Otherwise dock it in the bottom right. With no target it sits in the centre.
function place(rect: Rect | null, w: number, h: number, vw: number, vh: number) {
  const cw = Math.min(CARD_W, vw - MARGIN * 2);
  const clampY = (y: number) => Math.max(TOP_SAFE, Math.min(vh - h - MARGIN, y));
  const clampX = (x: number) => Math.max(MARGIN, Math.min(vw - cw - MARGIN, x));
  if (!rect) return { left: clampX((vw - cw) / 2), top: clampY((vh - h) / 2) };
  const midY = rect.y + rect.h / 2 - h / 2;
  const midX = rect.x + rect.w / 2 - cw / 2;
  if (rect.x + rect.w + GAP + cw <= vw - MARGIN) return { left: rect.x + rect.w + GAP, top: clampY(midY) };
  if (rect.x - GAP - cw >= MARGIN) return { left: rect.x - GAP - cw, top: clampY(midY) };
  if (rect.y + rect.h + GAP + h <= vh - MARGIN) return { left: clampX(midX), top: rect.y + rect.h + GAP };
  if (rect.y - GAP - h >= TOP_SAFE) return { left: clampX(midX), top: rect.y - GAP - h };
  return { left: vw - cw - 24, top: clampY(vh - h - 24) };
}

export default function NarratorCard(p: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const { w: vw, h: vh } = useViewport();
  const mobile = vw < 768;
  const [size, setSize] = useState({ w: CARD_W, h: 320 });

  // Move focus to the card on every step.
  useEffect(() => {
    ref.current?.focus({ preventScroll: true });
  }, [p.index]);

  // Measure the card, and tell the overlay where it is.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const read = () => {
      const b = el.getBoundingClientRect();
      setSize((s) => (s.w === b.width && s.h === b.height ? s : { w: b.width, h: b.height }));
      p.onMeasure(b);
    };
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => {
      ro.disconnect();
      p.onMeasure(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.index, p.rect, vw, vh, mobile]);

  const pos = mobile ? undefined : place(p.rect, size.w, size.h, vw, vh);

  return (
    <div
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-labelledby="tour-title"
      aria-describedby="tour-body"
      tabIndex={-1}
      data-tour-ui
      className={`tour-card z-[65] flex flex-col gap-4 p-5 outline-none md:p-6 ${
        mobile
          ? "fixed inset-x-0 bottom-0 max-h-[58dvh] overflow-y-auto rounded-t-[1.25rem]"
          : "fixed rounded-[1.25rem]"
      }`}
      style={mobile ? undefined : { ...pos, width: Math.min(CARD_W, vw - MARGIN * 2) }}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-volt">
          Step {p.index + 1} of {p.total}
        </p>
        <div className="flex items-center gap-1">
          <button type="button" onClick={p.onTogglePause} className="btn btn-ghost !min-h-10 !px-4 !text-sm">
            {p.paused ? "Resume" : "Pause"}
          </button>
          <button type="button" onClick={p.onSkip} className="btn btn-ghost !min-h-10 !px-4 !text-sm">
            Skip tour
          </button>
        </div>
      </div>

      <div aria-live="polite" className="flex flex-col gap-3">
        <h2 id="tour-title" className="font-display text-[2rem] font-bold leading-[1] md:text-[2.5rem]">
          {p.step.title}
        </h2>
        <p id="tour-body" className="text-base leading-[1.6] text-text-soft">
          {p.step.body}
        </p>
      </div>

      {p.children}

      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={p.onBack} disabled={p.isFirst} className="btn btn-secondary">
          Back
        </button>
        {p.isLast ? (
          <>
            <Link href="/auth" className="btn btn-primary">
              Try it with your own account
            </Link>
            <Link href="/verify/demo-001" className="btn btn-secondary">
              Check a credential
            </Link>
          </>
        ) : (
          <button type="button" onClick={p.onNext} className="btn btn-primary">
            Next
          </button>
        )}
      </div>

      <p className="text-sm text-text-mute">Arrow keys also work</p>
    </div>
  );
}
