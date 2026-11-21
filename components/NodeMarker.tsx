import { useId } from "react";
import { NODE_SHAPES, type NodeState } from "@/lib/node-shapes";

export type { NodeState };

type Props = {
  state: NodeState;
  /** 0 to 100. Drives the progress arc when state is in_progress. */
  percent?: number;
  label: string;
  selected?: boolean;
  /** Rendered width in px. The artwork is 200 wide. */
  size?: number;
  className?: string;
  /** Where the name sits. Defaults to below the marker. */
  labelPosition?: "below" | "above" | "left" | "right";
  /** Extra classes for the name, for example to hide it on small screens. */
  labelClassName?: string;
  /** Offset when nested inside another SVG. */
  x?: number;
  y?: number;
};

const C22 = 2 * Math.PI * 22; // circumference of the in-progress track

// Everything is drawn around (0,0). The label sits under the marker.
// Shape carries the meaning; colour only backs it up.
export default function NodeMarker({
  state,
  percent = 0,
  label,
  selected = false,
  size = 160,
  className,
  labelPosition = "below",
  labelClassName,
  x,
  y,
}: Props) {
  const gid = useId().replace(/:/g, "");
  const pct = Math.max(0, Math.min(100, percent));
  const reach = state === "in_progress" ? 22 : 17;
  const labelY = selected ? 112 : reach + 34;
  const flagRoom = state === "verified" ? 36 : 0; // the flag sits above the circle

  // A name can break onto lines with "\n".
  const lines = label.split("\n");
  const LINE = 24;
  const place =
    labelPosition === "left"
      ? { x: -(reach + 14), y: 7, anchor: "end" as const }
      : labelPosition === "right"
        ? { x: reach + 14, y: 7, anchor: "start" as const }
        : labelPosition === "above"
          ? { x: 0, y: -(reach + 14 + flagRoom) - (lines.length - 1) * LINE, anchor: "middle" as const }
          : { x: 0, y: labelY, anchor: "middle" as const };

  return (
    <svg
      role="img"
      aria-label={`${label.replace(/\n/g, " ")}, ${NODE_SHAPES[state].text}${state === "in_progress" ? `, ${Math.round(pct)} percent` : ""}`}
      viewBox="-100 -100 200 240"
      x={x}
      y={y}
      width={size}
      height={(size * 240) / 200}
      className={className}
      data-state={state}
      overflow="visible"
    >
      <defs>
        <linearGradient id={`g-${gid}`} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#047857" />
          <stop offset="1" stopColor="#BEF264" />
        </linearGradient>
        <pattern id={`h-${gid}`} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="6" height="6" fill="#0B1812" />
          <rect width="2" height="6" fill="#1B3A2A" />
        </pattern>
      </defs>

      {selected && (
        <>
          <circle r="84" fill="none" stroke="#BEF264" strokeWidth="1.5" strokeDasharray="1 7" strokeLinecap="round" />
          <line x1="0" y1={reach + 6} x2="0" y2="76" stroke="#BEF264" strokeWidth="1.5" strokeDasharray="1 6" strokeLinecap="round" />
        </>
      )}

      {state === "verified" && (
        <g>
          <line x1="0" y1="-17" x2="0" y2="-50" stroke="#BEF264" strokeWidth="2" />
          <path d="M1 -50 L19 -43 L1 -36 Z" fill="#BEF264" />
          <circle r="17" fill={`url(#g-${gid})`} />
          <path d="M-7 0.5 L-2 5.5 L7.5 -5" fill="none" stroke="#04110A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      )}

      {state === "known" && (
        <g>
          <circle r="17" fill="#0B1812" stroke="#7FD8C4" strokeWidth="2" strokeDasharray="4 4" />
          <rect x="-8" y="2" width="16" height="4.5" rx="2.25" fill="#7FD8C4" />
          <rect x="-6" y="-3.5" width="12" height="4.5" rx="2.25" fill="#7FD8C4" />
          <rect x="-4" y="-9" width="8" height="4.5" rx="2.25" fill="#7FD8C4" />
        </g>
      )}

      {state === "in_progress" && (
        <g>
          <circle className="beacon" r="22" fill="none" stroke="#BEF264" strokeWidth="2" />
          <circle r="22" fill="#0B1812" stroke="#1B3A2A" strokeWidth="4" />
          <circle
            r="22"
            fill="none"
            stroke="#BEF264"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={C22}
            strokeDashoffset={C22 * (1 - pct / 100)}
            transform="rotate(-90)"
          />
          <circle r="6" fill="#BEF264" />
        </g>
      )}

      {state === "todo" && <circle r="15" fill="none" stroke="#6E8A7A" strokeWidth="1.5" />}

      {state === "locked" && (
        <g opacity="0.85">
          <rect x="-15" y="-15" width="30" height="30" rx="6" transform="rotate(45)" fill={`url(#h-${gid})`} stroke="#1B3A2A" strokeWidth="1.5" />
          <g fill="none" stroke="#6E8A7A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="-5.5" y="-1" width="11" height="8.5" rx="1.8" fill="#0B1812" />
            <path d="M-3.2 -1 V-3.4 a3.2 3.2 0 0 1 6.4 0 V-1" />
          </g>
        </g>
      )}

      <text
        x={place.x}
        y={place.y}
        textAnchor={place.anchor}
        className={labelClassName}
        fill={state === "locked" ? "#6E8A7A" : "#EDF2E4"}
        style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 22 }}
      >
        {lines.map((line, i) => (
          <tspan key={i} x={place.x} dy={i === 0 ? 0 : LINE}>
            {line}
          </tspan>
        ))}
      </text>
    </svg>
  );
}
