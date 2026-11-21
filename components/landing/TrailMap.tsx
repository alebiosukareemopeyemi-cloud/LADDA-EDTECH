"use client";

import type { CSSProperties } from "react";
import NodeMarker from "@/components/NodeMarker";
import Trail from "@/components/Trail";
import { DONE_FRACTION, KNOTS, KNOT_FRACTIONS, ROUTE, SUMMIT, VIEW } from "./trailData";

const DRAW_SECONDS = 2.2;
const MIN_GAP = 0.12;

// Markers pop in as the line reaches them, never closer than 120ms apart.
const POP_DELAYS = (() => {
  const d = KNOT_FRACTIONS.map((f) => f * DRAW_SECONDS);
  for (let i = 1; i < d.length; i++) d[i] = Math.max(d[i], d[i - 1] + MIN_GAP);
  return d;
})();
const SEAL_DELAY = POP_DELAYS[POP_DELAYS.length - 1] + 0.2;

// CSS custom properties that the pop and stamp animations read (see globals.css).
const at = (x: number, y: number, delay: number) =>
  ({ "--ox": `${x}px`, "--oy": `${y}px`, "--delay": `${delay}s` }) as CSSProperties;

// The winding trail behind the hero. Decorative: the headline and links carry the meaning.
export default function TrailMap({ dimOnMobile = true }: { dimOnMobile?: boolean }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox={`0 0 ${VIEW.w} ${VIEW.h}`}
      preserveAspectRatio="xMidYMid slice"
      className={`pointer-events-none absolute inset-0 size-full ${dimOnMobile ? "opacity-40 md:opacity-100" : ""}`}
    >
      <Trail d={ROUTE} progress={DONE_FRACTION} duration={DRAW_SECONDS} />

      {KNOTS.map((k, i) => (
        <g key={k.label} className="marker-pop" style={at(k.x, k.y, POP_DELAYS[i])}>
          {/* Invisible box the tour spotlights. */}
          <rect data-tour={`node-${k.id}`} x={k.x - 60} y={k.y - 62} width="120" height="96" fill="none" />
          <NodeMarker
            x={k.x - 100}
            y={k.y - 100}
            size={200}
            state={k.state}
            percent={k.percent}
            label={k.label}
            labelPosition={k.side}
            // On small screens only the in-progress name stays.
            labelClassName={k.state === "in_progress" ? undefined : "max-md:hidden"}
          />
        </g>
      ))}

      {/* Summit: a planted flag, then the seal stamps last. */}
      <g className="marker-pop" style={at(SUMMIT.x, SUMMIT.y, POP_DELAYS[POP_DELAYS.length - 1])}>
        <circle cx={SUMMIT.x} cy={SUMMIT.y} r="17" fill="#0B1812" stroke="#BEF264" strokeWidth="2" />
        <line x1={SUMMIT.x} y1={SUMMIT.y - 17} x2={SUMMIT.x} y2={SUMMIT.y - 30} stroke="#BEF264" strokeWidth="2" />
        <path
          d={`M${SUMMIT.x + 1} ${SUMMIT.y - 30} L${SUMMIT.x + 19} ${SUMMIT.y - 23} L${SUMMIT.x + 1} ${SUMMIT.y - 16} Z`}
          fill="#BEF264"
        />
        <text
          x={SUMMIT.x - 31}
          y={SUMMIT.y + 7}
          textAnchor="end"
          fill="#EDF2E4"
          className="max-md:hidden"
          style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 22 }}
        >
          {SUMMIT.label}
        </text>
      </g>
      <g className="seal-stamp" style={at(SUMMIT.x + 66, SUMMIT.y - 12, SEAL_DELAY)}>
        <circle cx={SUMMIT.x + 66} cy={SUMMIT.y - 12} r="24" fill="#F2A93B" />
        <circle cx={SUMMIT.x + 66} cy={SUMMIT.y - 12} r="19" fill="none" stroke="#0B1812" strokeOpacity="0.7" strokeWidth="1.5" />
        <path
          d={`M${SUMMIT.x + 57} ${SUMMIT.y - 11} l6 6 l11 -12`}
          fill="none"
          stroke="#0B1812"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}
