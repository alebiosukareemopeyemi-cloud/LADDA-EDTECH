"use client";

import { useCallback, useEffect, useState } from "react";
import { usePlay } from "@/lib/motion";

// Tour state machine. Progress lives in memory only: a reload starts again.
export function useTour(total: number, seconds: (index: number) => number | null) {
  const play = usePlay();
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(true);
  // Autoplay starts paused for people who asked for reduced motion.
  const [paused, setPaused] = useState(!play);
  // Set while someone is typing or pressing buttons in a step, so it never moves under them.
  const [busy, setBusy] = useState(false);

  const goTo = useCallback(
    (i: number) => {
      setIndex(Math.max(0, Math.min(total - 1, i)));
      setBusy(false);
    },
    [total]
  );
  const next = useCallback(() => goTo(index + 1), [goTo, index]);
  const back = useCallback(() => goTo(index - 1), [goTo, index]);
  const skip = useCallback(() => setOpen(false), []);
  const restart = useCallback(() => {
    setIndex(0);
    setBusy(false);
    setOpen(true);
    setPaused(!play);
  }, [play]);

  // Autoplay: move on after the step's reading time.
  const wait = seconds(index);
  useEffect(() => {
    if (!open || paused || busy || wait === null) return;
    const t = setTimeout(() => setIndex((i) => Math.min(total - 1, i + 1)), wait * 1000);
    return () => clearTimeout(t);
  }, [open, paused, busy, wait, index, total]);

  // Arrow keys and Escape. Typing in a field keeps its own arrow keys.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      const el = e.target as HTMLElement | null;
      const typing = el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);
      if (e.key === "Escape") {
        e.preventDefault();
        skip();
      } else if (!typing && e.key === "ArrowRight") {
        e.preventDefault();
        next();
      } else if (!typing && e.key === "ArrowLeft") {
        e.preventDefault();
        back();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, next, back, skip]);

  return {
    index,
    open,
    paused,
    busy,
    setBusy,
    goTo,
    next,
    back,
    skip,
    restart,
    togglePause: () => setPaused((p) => !p),
    isFirst: index === 0,
    isLast: index === total - 1,
  };
}
