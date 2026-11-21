"use client";

import { useEffect, useRef, useState } from "react";
import {
  animate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import type { Transition, Variants } from "framer-motion";

// Shared motion rules. Every animated thing in Ladda pulls from here.
// Everything below respects prefers-reduced-motion: variants are wrapped by
// MotionProvider (reducedMotion="user"), and the hooks check it themselves.
export const dur = { micro: 0.15, standard: 0.3, big: 0.7 } as const;
export const stagger = 0.06;

export const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];

export const spring: Transition = { type: "spring", stiffness: 260, damping: 24 };
export const springSoft: Transition = { type: "spring", stiffness: 120, damping: 20 };

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: dur.standard, ease } },
};

export const pop: Variants = {
  hidden: { opacity: 0, scale: 0.6 },
  show: { opacity: 1, scale: 1, transition: spring },
};

export const drawPath: Variants = {
  hidden: { pathLength: 0, opacity: 0 },
  show: { pathLength: 1, opacity: 1, transition: { duration: 1.4, ease: "easeInOut" } },
};

export const unlockBurst: Variants = {
  hidden: { scale: 0.8, opacity: 0 },
  show: { scale: [0.8, 1.25, 1], opacity: 1, transition: { duration: 0.6, ease } },
};

// Active-node pulse: spread these onto a motion element.
export const pulseAnimate = { scale: [1, 1.12, 1], opacity: [0.85, 1, 0.85] };
export const pulseTransition: Transition = { duration: 1.8, repeat: Infinity, ease: "easeInOut" };

// Parent that staggers its children (list of pins, cards, chips).
export const container = (delay = 0): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: stagger, delayChildren: delay } },
});

// Buttons and cards: lift on hover, shrink on press.
export const hoverLift = {
  whileHover: { y: -3, scale: 1.03 },
  whileTap: { scale: 0.97 },
  transition: spring,
};

/* ---------- Tilt ---------- */

// 3D tilt that follows the pointer. Spread the result on a motion element:
//   const tilt = useTilt(); <motion.div {...tilt}> ...
export function useTilt(max = 8) {
  const reduce = useReducedMotion();
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const sx = useSpring(px, { stiffness: 200, damping: 20 });
  const sy = useSpring(py, { stiffness: 200, damping: 20 });
  const rotateY = useTransform(sx, [0, 1], [-max, max]);
  const rotateX = useTransform(sy, [0, 1], [max, -max]);

  if (reduce) return {};
  return {
    style: { rotateX, rotateY, transformPerspective: 900 },
    onPointerMove: (e: React.PointerEvent<HTMLElement>) => {
      const r = e.currentTarget.getBoundingClientRect();
      px.set((e.clientX - r.left) / r.width);
      py.set((e.clientY - r.top) / r.height);
    },
    onPointerLeave: () => {
      px.set(0.5);
      py.set(0.5);
    },
  };
}

/* ---------- Magnetic hover ---------- */

// Primary buttons lean toward the pointer. Spread on a motion element.
export function useMagnetic(strength = 0.3) {
  const reduce = useReducedMotion();
  const x = useSpring(0, { stiffness: 300, damping: 18 });
  const y = useSpring(0, { stiffness: 300, damping: 18 });

  if (reduce) return {};
  return {
    style: { x, y },
    onPointerMove: (e: React.PointerEvent<HTMLElement>) => {
      const r = e.currentTarget.getBoundingClientRect();
      x.set((e.clientX - (r.left + r.width / 2)) * strength);
      y.set((e.clientY - (r.top + r.height / 2)) * strength);
    },
    onPointerLeave: () => {
      x.set(0);
      y.set(0);
    },
  };
}

/* ---------- Text reveal ---------- */

// Words rise out of a mask, one after another. Use with <RevealText>.
export const revealContainer = (delay = 0, gap = 0.05): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: gap, delayChildren: delay } },
});
export const revealWord: Variants = {
  hidden: { y: "110%" },
  show: { y: "0%", transition: { duration: 0.7, ease } },
};

/* ---------- Count up ---------- */

export function useCountUp(to: number, opts: { duration?: number; start?: boolean } = {}) {
  const { duration = 1.2, start = true } = opts;
  const reduce = useReducedMotion();
  const [value, setValue] = useState(0);
  const target = useRef(to);
  target.current = to;

  useEffect(() => {
    if (!start) return;
    if (reduce) {
      setValue(target.current);
      return;
    }
    const controls = animate(0, target.current, {
      duration,
      ease,
      onUpdate: (v) => setValue(Math.round(v)),
    });
    return () => controls.stop();
  }, [start, duration, reduce, to]);

  return value;
}

/* ---------- Spark burst ---------- */

export type Spark = { x: number; y: number; delay: number; size: number };

// Deterministic (golden angle) so server and client markup match.
export function sparkParticles(count = 10, radius = 46): Spark[] {
  return Array.from({ length: count }, (_, i) => {
    const angle = i * 2.399963;
    const r = radius * (0.6 + ((i * 37) % 10) / 25);
    return {
      x: Math.cos(angle) * r,
      y: Math.sin(angle) * r,
      delay: (i % 4) * 0.025,
      size: 3 + (i % 3),
    };
  });
}

export const sparkVariants: Variants = {
  hidden: { opacity: 0, x: 0, y: 0, scale: 0 },
  show: (p: Spark) => ({
    opacity: [0, 1, 0],
    x: p.x,
    y: p.y,
    scale: [0, 1, 0.3],
    transition: { duration: 0.75, ease, delay: p.delay },
  }),
};

/* ---------- Unlock chain ---------- */

// The path lights up, then each dependant opens one by one.
export const unlockChain = (gap = 0.22, delay = 0): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: gap, delayChildren: delay } },
});
export const unlockStep: Variants = {
  hidden: { opacity: 0.35, scale: 0.9, filter: "grayscale(1)" },
  show: {
    opacity: 1,
    scale: [0.9, 1.15, 1],
    filter: "grayscale(0)",
    transition: { duration: 0.55, ease },
  },
};
export const unlockLine: Variants = {
  hidden: { pathLength: 0 },
  show: { pathLength: 1, transition: { duration: 0.4, ease: "easeInOut" } },
};
