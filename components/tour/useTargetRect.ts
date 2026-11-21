"use client";

import { useEffect, useState } from "react";
import { usePlay } from "@/lib/motion";

export type Rect = { x: number; y: number; w: number; h: number };

const PAD = 14;

// Finds [data-tour="id"], scrolls it into view, and keeps its viewport rect
// fresh on resize, scroll and layout changes. Returns null when it is missing,
// so the card falls back to the centre.
export function useTargetRect(id: string | null, active: boolean, stepKey: string): Rect | null {
  const play = usePlay();
  const [rect, setRect] = useState<Rect | null>(null);

  useEffect(() => {
    if (!active || !id) {
      setRect(null);
      return;
    }
    let el: Element | null = null;
    let ro: ResizeObserver | null = null;
    let frame = 0;
    let tries = 0;

    const measure = () => {
      if (!el) return;
      const r = el.getBoundingClientRect();
      setRect((prev) => {
        const next = { x: r.left - PAD, y: r.top - PAD, w: r.width + PAD * 2, h: r.height + PAD * 2 };
        return prev && prev.x === next.x && prev.y === next.y && prev.w === next.w && prev.h === next.h
          ? prev
          : next;
      });
    };

    // The scene mounts with the step, so look again for a moment.
    const find = () => {
      el = document.querySelector(`[data-tour="${id}"]`);
      if (!el) {
        if (tries++ < 20) frame = window.setTimeout(find, 50);
        else setRect(null);
        return;
      }
      const r = el.getBoundingClientRect();
      const small = window.innerWidth < 768;
      const room = small ? window.innerHeight * 0.45 : window.innerHeight;
      // Bring it into view: near the top on phones (the card docks at the bottom).
      if (small ? r.top < 72 || r.bottom > room : r.top < 72 || r.bottom > window.innerHeight - 16) {
        const top = window.scrollY + r.top - (small ? 84 : Math.max(88, (window.innerHeight - r.height) / 2));
        window.scrollTo({ top: Math.max(0, top), behavior: play ? "smooth" : "auto" });
      }
      measure();
      ro = new ResizeObserver(measure);
      ro.observe(el);
    };
    find();

    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, { passive: true });
    return () => {
      window.clearTimeout(frame);
      ro?.disconnect();
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure);
    };
  }, [id, active, stepKey, play]);

  return rect;
}
