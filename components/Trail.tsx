"use client";

import { useId } from "react";
import { motion } from "framer-motion";
import { trailDraw, usePlayProps } from "@/lib/motion";

// A trail as an SVG <g>. Put it inside an <svg>.
// Dotted base for the whole route; the finished part is solid volt gradient
// with a blurred glow underneath. The route draws itself once over `duration`
// seconds (stroke-dashoffset). Under reduced motion it simply appears.
export default function Trail({
  d,
  progress = 0,
  duration = 1.6,
}: {
  d: string;
  /** 0 to 1: how much of the route is finished. */
  progress?: number;
  /** Seconds for the whole route to draw. */
  duration?: number;
}) {
  const gid = useId().replace(/:/g, "");
  const play = usePlayProps();
  const done = Math.max(0, Math.min(1, progress));
  // The solid part is `done` of the route, so it takes `done` of the time and
  // its tip moves at the same speed as the dotted line.
  const solid = trailDraw(done, duration * done);
  const reveal = trailDraw(1, duration);

  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <defs>
        <linearGradient id={`tg-${gid}`} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#047857" />
          <stop offset="1" stopColor="#BEF264" />
        </linearGradient>
        <filter id={`tb-${gid}`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
        {/* A wide stroke that follows the route and uncovers the dotted base. */}
        <mask id={`tm-${gid}`} maskUnits="userSpaceOnUse" x="-4000" y="-4000" width="9000" height="9000">
          <motion.path
            d={d}
            pathLength={1}
            stroke="#fff"
            strokeWidth="24"
            strokeDasharray="1 2"
            variants={reveal}
            {...play}
          />
        </mask>
      </defs>

      <path d={d} stroke="#2B5A44" strokeWidth="3" strokeDasharray="1 12" mask={`url(#tm-${gid})`} />

      {done > 0 && (
        <>
          <motion.path
            d={d}
            pathLength={1}
            stroke="#BEF264"
            strokeOpacity={0.4}
            strokeWidth="10"
            strokeDasharray={`${done} 2`}
            filter={`url(#tb-${gid})`}
            variants={solid}
            {...play}
          />
          <motion.path
            d={d}
            pathLength={1}
            stroke={`url(#tg-${gid})`}
            strokeWidth="4"
            strokeDasharray={`${done} 2`}
            variants={solid}
            {...play}
          />
        </>
      )}
    </g>
  );
}
