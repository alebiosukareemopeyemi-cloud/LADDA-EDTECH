"use client";

import { useReducedMotion } from "framer-motion";
import type { Transition, Variants } from "framer-motion";

/*
  Ladda has three moments of motion and no others:
    1. The trail draws itself (stroke-dashoffset).
    2. The unlock chain: the next nodes light up in sequence.
    3. The seal stamps onto the credential.
  Everything is off under prefers-reduced-motion (see usePlay).
*/

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];

/** False when the person asked for reduced motion. Gate every moment on it. */
export function usePlay(): boolean {
  return !useReducedMotion();
}

/** Props for a motion element: starts hidden and animates, or just shows. */
export function usePlayProps(): { initial: "hidden" | false; animate: "show" } {
  const play = usePlay();
  return { initial: play ? "hidden" : false, animate: "show" };
}

/* ---------- Moment 1: the trail draws itself ---------- */

// For a <path pathLength={1} strokeDasharray="1 2"> whose finished length is `to`
// (0 to 1), animate strokeDashoffset from `to` down to 0.
export const trailDraw = (to = 1, duration = 1.6): Variants => ({
  hidden: { strokeDashoffset: to },
  show: { strokeDashoffset: 0, transition: { duration, ease: "easeInOut" } },
});

/* ---------- Moment 2: unlock chain ---------- */

export const unlockChain = (gap = 0.3, delay = 0): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: gap, delayChildren: delay } },
});
export const unlockStep: Variants = {
  hidden: { opacity: 0.3, filter: "grayscale(1)" },
  show: { opacity: 1, filter: "grayscale(0)", transition: { duration: 0.5, ease } },
};

/* ---------- Moment 3: the seal stamps ---------- */

export const sealTransition: Transition = { duration: 0.55, ease: [0.2, 1.5, 0.4, 1] };
export const sealStamp: Variants = {
  hidden: { scale: 1.7, rotate: -16, opacity: 0 },
  show: { scale: 1, rotate: 0, opacity: 1, transition: sealTransition },
};

/* ---------- Retired ----------
  The dashboard still imports this. It does nothing, so content shows at once.
  Delete it when the dashboard is rebuilt.
*/
/** @deprecated No fade-up entrances. */
export const fadeUp: Variants = { hidden: {}, show: {} };
