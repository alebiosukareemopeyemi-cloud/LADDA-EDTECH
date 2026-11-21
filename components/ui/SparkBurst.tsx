"use client";

import { motion } from "framer-motion";
import { sparkParticles, sparkVariants } from "@/lib/motion";

// Particles fly out of the centre of the parent when `fire` changes.
// Put it inside a `relative` element. Renders nothing at 0.
export default function SparkBurst({ fire, count = 10 }: { fire: number; count?: number }) {
  if (fire === 0) return null;
  const sparks = sparkParticles(count);
  return (
    <span
      key={fire}
      aria-hidden="true"
      className="pointer-events-none absolute left-1/2 top-1/2 size-0"
    >
      {sparks.map((p, i) => (
        <motion.span
          key={i}
          custom={p}
          variants={sparkVariants}
          initial="hidden"
          animate="show"
          className="absolute rounded-full bg-volt"
          style={{ width: p.size, height: p.size, marginLeft: -p.size / 2, marginTop: -p.size / 2 }}
        />
      ))}
    </span>
  );
}
