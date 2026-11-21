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

export const dur = { micro: 0.15, standard: 0.3, big: 0.7 } as const;
export const stagger = 0.06;
export const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];

export const spring: Transition = { type: "spring", stiffness: 260, damping: 24 };
export const springSoft: Transition = { type: "spring", stiffness: 120, damping: 20 };

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

// pathLength flavour, used by the existing roadmap road.
export const drawPath: Variants = {
  hidden: { pathLength: 0, opacity: 0 },
  show: { pathLength: 1, opacity: 1, transition: { duration: 1.4, ease: "easeInOut" } },
};

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

export const sealStamp: Variants = {
  hidden: { scale: 1.7, rotate: -16, opacity: 0 },
  show: {
    scale: 1,
    rotate: 0,
    opacity: 1,
    transition: { duration: 0.55, ease: [0.2, 1.5, 0.4, 1] },
  },
};

/* ---------- Retired ----------
  Pages built before the trail-map direction still import these. They now do
  nothing, so content shows at once. Delete them as each page is rebuilt.
*/
const none: Variants = { hidden: {}, show: {} };
/** @deprecated No fade-up entrances. */
export const fadeUp: Variants = none;
/** @deprecated */
export const pop: Variants = none;
/** @deprecated */
export const unlockBurst: Variants = none;
/** @deprecated No ambient pulses. */
export const pulseAnimate = {};
/** @deprecated */
export const pulseTransition: Transition = {};
/** @deprecated */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const container = (_delay = 0): Variants => none;
/** @deprecated No hover-lift on cards. */
export const hoverLift = {};
