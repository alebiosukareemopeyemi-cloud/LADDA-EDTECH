"use client";

import { useMemo } from "react";
import NodeMarker from "@/components/NodeMarker";
import type { NodeState } from "@/components/NodeMarker";
import Trail from "@/components/Trail";
import type { RoadmapNode } from "@/lib/contract";
import { trailLayout } from "@/lib/roadmap/trail";
import { useMediaQuery } from "@/lib/use-modal";

// Contract status (plus the computed lock) to the marker shape.
export function markerState(n: RoadmapNode): NodeState {
  if (n.locked) return "locked";
  if (n.status === "verified") return "verified";
  if (n.status === "known") return "known";
  if (n.status === "in_progress") return "in_progress";
  return "todo";
}

// How far through a node you are, from what the data does say: learn done means half.
export function nodePercent(n: RoadmapNode): number {
  return n.nextStep === "build" ? 50 : 12;
}

// Break a long name into at most two short lines so names never collide.
function wrap(title: string, max = 15): string {
  const words = title.split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    if (cur && (cur + " " + w).length > max && lines.length === 0) {
      lines.push(cur);
      cur = w;
    } else {
      cur = cur ? `${cur} ${w}` : w;
    }
  }
  lines.push(cur);
  return lines.join("\n");
}

type Props = {
  nodes: RoadmapNode[];
  selectedId?: string | null;
  /** Leave out for a picture only (the intake preview). */
  onSelect?: (node: RoadmapNode) => void;
  className?: string;
  /** "auto" switches to a tall two-column layout on phones. Previews pass "wide". */
  layout?: "auto" | "wide";
};

export default function RoadmapTrail({ nodes, selectedId = null, onSelect, className, layout: mode = "auto" }: Props) {
  const phone = useMediaQuery("(max-width: 767px)");
  const compact = mode === "auto" && phone;
  const layout = useMemo(() => trailLayout(nodes.length, compact), [nodes.length, compact]);

  // The solid stretch runs to the furthest node that is done or under way.
  let reach = 0;
  nodes.forEach((n, i) => {
    if (!n.locked && n.status !== "todo") reach = Math.max(reach, layout.nodes[i]?.fraction ?? 0);
  });

  return (
    <svg
      viewBox={`0 0 ${layout.view.w} ${layout.view.h}`}
      className={className ?? "size-full"}
      preserveAspectRatio="xMidYMid meet"
      role={onSelect ? "group" : undefined}
      aria-label={onSelect ? "Roadmap" : undefined}
      aria-hidden={onSelect ? undefined : true}
      focusable="false"
    >
      <Trail d={layout.d} progress={reach} duration={1.6} />

      {nodes.map((n, i) => {
        const p = layout.nodes[i];
        if (!p) return null;
        const state = markerState(n);
        const selected = selectedId === n.id;
        return (
          <g key={n.id}>
            <g aria-hidden="true">
              <NodeMarker
                x={p.x - 100}
                y={p.y - 100}
                size={200}
                state={state}
                percent={nodePercent(n)}
                label={wrap(n.title)}
                selected={selected}
              />
            </g>
            {onSelect && (
              <rect
                role="button"
                tabIndex={0}
                aria-label={`${n.title}, ${stateWord(state)}`}
                aria-pressed={selected}
                x={p.x - 78}
                y={p.y - 66}
                width={156}
                height={150}
                rx={16}
                fill="transparent"
                className="trail-hit"
                onClick={() => onSelect(n)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelect(n);
                  }
                }}
              />
            )}
          </g>
        );
      })}
    </svg>
  );
}

function stateWord(s: NodeState) {
  return s === "in_progress" ? "in progress" : s === "todo" ? "not started" : s;
}
