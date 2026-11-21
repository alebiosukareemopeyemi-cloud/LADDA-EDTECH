"use client";

import { motion } from "framer-motion";
import { revealContainer, revealWord } from "@/lib/motion";

// Headline whose words rise out of a mask. Plain text, no highlighted word.
export default function RevealText({
  text,
  as: Tag = "h1",
  className = "",
  delay = 0,
}: {
  text: string;
  as?: "h1" | "h2" | "h3" | "p";
  className?: string;
  delay?: number;
}) {
  const MotionTag = motion[Tag];
  return (
    <MotionTag
      className={className}
      variants={revealContainer(delay)}
      initial="hidden"
      animate="show"
      aria-label={text}
    >
      {text.split(" ").map((w, i) => (
        <span key={i} aria-hidden="true" className="inline-block overflow-hidden pb-[0.12em] align-bottom">
          <motion.span variants={revealWord} className="inline-block">
            {w}
          </motion.span>
          {i < text.split(" ").length - 1 ? " " : ""}
        </span>
      ))}
    </MotionTag>
  );
}
