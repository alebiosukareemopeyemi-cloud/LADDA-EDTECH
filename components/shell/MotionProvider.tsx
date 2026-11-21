"use client";

import { MotionConfig } from "framer-motion";

// Every framer-motion element in the app respects prefers-reduced-motion.
export default function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
