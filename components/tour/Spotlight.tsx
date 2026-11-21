"use client";

import type { Rect } from "./useTargetRect";

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

// The dimmed overlay: night at 74% with a hole around the target, a dotted volt
// ring on the hole edge, and a thin line from the hole to the card.
// It never takes clicks: the screen underneath is inert while the tour is open.
export default function Spotlight({ rect, card }: { rect: Rect | null; card: DOMRect | null }) {
  let line: { x1: number; y1: number; x2: number; y2: number } | null = null;
  if (rect && card) {
    const cx = card.left + card.width / 2;
    const cy = card.top + card.height / 2;
    const x1 = clamp(cx, rect.x, rect.x + rect.w);
    const y1 = clamp(cy, rect.y, rect.y + rect.h);
    const x2 = clamp(rect.x + rect.w / 2, card.left, card.right);
    const y2 = clamp(rect.y + rect.h / 2, card.top, card.bottom);
    if (Math.hypot(x2 - x1, y2 - y1) > 28) line = { x1, y1, x2, y2 };
  }

  return (
    <svg aria-hidden="true" focusable="false" className="pointer-events-none fixed inset-0 z-[60] size-full">
      <defs>
        <mask id="tour-mask">
          <rect width="100%" height="100%" fill="white" />
          {rect && (
            <rect x={rect.x} y={rect.y} width={rect.w} height={rect.h} rx="20" fill="black" className="tour-hole" />
          )}
        </mask>
      </defs>
      <rect width="100%" height="100%" fill="#050B08" fillOpacity="0.74" mask="url(#tour-mask)" />
      {rect && (
        <rect
          x={rect.x}
          y={rect.y}
          width={rect.w}
          height={rect.h}
          rx="20"
          fill="none"
          stroke="#BEF264"
          strokeWidth="2"
          strokeDasharray="2 8"
          strokeLinecap="round"
          className="tour-pulse tour-hole"
        />
      )}
      {line && (
        <line
          {...line}
          stroke="#BEF264"
          strokeOpacity="0.6"
          strokeWidth="1.5"
          strokeDasharray="1 6"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}
